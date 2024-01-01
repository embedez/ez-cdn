import { spawn } from "child_process";
import ffmpeg from "ffmpeg-static";

import {nanoid} from "nanoid";
import {replaceData, uploadData} from "../../../../database/minio";
import * as fs from 'fs';
import {join} from 'path';
import axios from 'axios';
import {videoUpload} from "../../../upload/handlers/videoUploadHandler";

export const longestMultiTrack =  async (req: Request) => {
    const formData = await req.formData()

    const videoFile = formData.get('video') as File
    const shouldTemp = formData.get('temp')
    const audioFiles = formData.getAll('audio') as File[]
    if (!videoFile) return Response.json({success: false, message: "no file provider in Form body"}, {status: 404})

    const tempFolder = './temp'
    const id = nanoid()

    if (shouldTemp) {
        const data = await uploadData(Buffer.from(JSON.stringify({
            test: false
        }), "utf-8"), `${id}/video`, {
            loading: true
        });
    }

    // Download the files
    const videoFilePath = join(tempFolder, nanoid()+'.mp4');
    const outputFilePath = join(tempFolder, `${id}-output.mp4`)
    const overlayFilePath = join('./static', 'overlay.png')
    const audioFilePaths = [];

    fs.writeFileSync(videoFilePath, await videoFile.arrayBuffer())

    for(let audioFile of audioFiles) {
        const audioFilePath = join(tempFolder, nanoid()+'.mp3')
        fs.writeFileSync(audioFilePath, await audioFile.arrayBuffer())
        audioFilePaths.push(audioFilePath)
    }


    if (audioFilePaths.length === 0)
        return Response.json({success: false, message: "No audio files provided"}, {status: 404})

    let ffmpegCommand: string[] = [
      "-i", videoFilePath,
      "-i", overlayFilePath, // Path of the image file
    ];

    let i = audioFilePaths.length;
    for(let audioFilePath of audioFilePaths) {
        if(audioFilePath.endsWith('.mp4')) {
            ffmpegCommand.push('-i', '-vn', audioFilePath);
        }
        else {
            ffmpegCommand.push('-i', audioFilePath);
        }
    }

    // Apply the new complex filter
    ffmpegCommand.push("-filter_complex");
    ffmpegCommand.push("[0:v][1:v]overlay=W-w-10:H-h-10[outv]");

    ffmpegCommand.push("-map", "[outv]",)

    // Map streams after all input files are specified
    //ffmpegCommand.push("-map", "0:v:0");
    for(let j = 0; j < i; j++) {
        ffmpegCommand.push("-map", `${j+2}:a:0`);
    }


    // Convert the mapped audio stream to aac
    ffmpegCommand.push("-c:a", "aac");

    // Make sure we're using the ultrafast preset for quicker encoding
    ffmpegCommand.push("-preset");
    ffmpegCommand.push("ultrafast");

    // Set max FPS to 30
    ffmpegCommand.push("-r");
    ffmpegCommand.push("30");

    ffmpegCommand.push("-y");
    ffmpegCommand.push(outputFilePath);

    // call ffmpeg with the constructed command
    const ffmpegProcess = spawn('ffmpeg', ffmpegCommand);


    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });


    ffmpegProcess.on('close', async (code) => {
        console.log(`child process exited with code ${code}`);
        // Delete the files
        fs.unlinkSync(videoFilePath);
        for(let audioFilePath of audioFilePaths) {
            fs.unlinkSync(audioFilePath);
        }

        if (code == 0) {
            const outputData = fs.readFileSync(outputFilePath);
            await videoUpload(
                outputData,
                id,
                'video/mp4',
            );
        }

        fs.unlinkSync(outputFilePath)

    });

    return Response.json({
        id: id
    })
}