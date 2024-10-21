import { spawn } from "child_process";

import { nanoid } from "nanoid";
import { exists, uploadData } from "../../../../database/minio";
import * as fs from "fs";
import { join } from "path";
import { videoUpload } from "../../../upload/handlers/videoUploadHandler";
import {
  handleInputFile,
  handleInputFiles,
} from "../../../../utils/handleInputFile";

export const longestMultiTrack = async (req: Request) => {
  return new Promise(async (res, rej) => {
    const formData = await req.formData();

    const shouldTemp = formData.get("temp");
    const id = (formData.get("id") as string | undefined) || nanoid();

    if (formData.get("id")) {
      const existingFile = await exists(`${id}/video`);
      if (existingFile)
        return res(
          Response.json({
            id: id,
          })
        );
    }

    if (shouldTemp) {
      const data = await uploadData(
        Buffer.from(
          JSON.stringify({
            test: false,
          }),
          "utf-8"
        ),
        `${id}/video`,
        {
          loading: true,
        }
      );

      res(
        Response.json({
          id: id,
        })
      );
    }

    const vid = formData.get("video");
    const aud = formData.getAll("audio");

    if (!vid)
      return Response.json(
        { success: false, message: "no video file provided" },
        { status: 404 }
      );
    if (aud.length === 0)
      return Response.json(
        { success: false, message: "no audio files provided" },
        { status: 404 }
      );

    const [videoFile, audioFiles] = await Promise.all([
      handleInputFile(vid),
      handleInputFiles(aud),
    ]);

    if (!videoFile)
      return Response.json(
        { success: false, message: "no file provider in Form body" },
        { status: 404 }
      );
    if (audioFiles.length === 0)
      return Response.json(
        { success: false, message: "No audio files provided" },
        { status: 404 }
      );

    const tempFolder = "./temp";
    const outputFilePath = join(tempFolder, `${id}-output.mp4`);
    const videoFilePath = join(tempFolder, nanoid() + ".mp4");
    const audioFilePaths: string[] = [];

    // Download the video file
    fs.writeFileSync(videoFilePath, Buffer.from(await videoFile.arrayBuffer()));

    // Download the audio files
    for (let audioFile of audioFiles) {
      const audioFilePath = join(tempFolder, nanoid() + ".mp3");
      fs.writeFileSync(
        audioFilePath,
        Buffer.from(await audioFile.arrayBuffer())
      );
      audioFilePaths.push(audioFilePath);
    }

    let ffmpegCommand: string[] = ["-i", videoFilePath];

    for (let audioFilePath of audioFilePaths) {
      ffmpegCommand.push("-i", audioFilePath);
    }

    // Map video stream
    ffmpegCommand.push("-map", "0:v:0");

    // Map audio streams
    for (let j = 0; j < audioFiles.length; j++) {
      ffmpegCommand.push("-map", `${j + 1}:a:0?`);
    }

    // Copy video and audio codecs without re-encoding
    ffmpegCommand.push("-c:v", "copy");
    ffmpegCommand.push("-c:a", "copy");

    ffmpegCommand.push("-shortest");
    ffmpegCommand.push("-y");
    ffmpegCommand.push(outputFilePath);

    // Call ffmpeg with the constructed command
    const ffmpegProcess = spawn("ffmpeg", ffmpegCommand);

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    ffmpegProcess.on("close", async (code) => {
      console.log(`child process exited with code ${code}`);

      // Delete the temporary files
      fs.unlinkSync(videoFilePath);
      for (let audioFilePath of audioFilePaths) {
        fs.unlinkSync(audioFilePath);
      }

      if (code == 0) {
        const outputData = fs.readFileSync(outputFilePath);
        const responseData = await videoUpload(outputData, id, "video/mp4");
        if (!shouldTemp) res(Response.json(responseData));
      } else {
        if (!shouldTemp) res(Response.error());
      }

      fs.unlinkSync(outputFilePath);
    });
  });
};
