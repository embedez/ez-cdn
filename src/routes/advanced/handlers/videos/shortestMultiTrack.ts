import {spawn} from "child_process";

import {nanoid} from "nanoid";
import {exists, uploadData} from "../../../../database/minio";
import * as fs from 'fs';
import {join} from 'path';
import {videoUpload} from "../../../upload/handlers/videoUploadHandler";
import {handleInputFile, handleInputFiles} from "../../../../utils/handleInputFile";

export const shortestMultiTrack = async (req: Request) => {
    return new Promise(async (res, rej) => {

        const formData = await req.formData()

        const shouldTemp = formData.get('temp')
        const id = formData.get("id") as string | undefined || nanoid()

        if (formData.get("id")) {
            const existingFile = await exists(`${id}/video`);
            if (existingFile) return res(Response.json({
                id: id
            }))
        }

        if (shouldTemp) {
            await uploadData(Buffer.from(JSON.stringify({
                test: false
            }), "utf-8"), `${id}/video`, {
                loading: true
            });

            res(Response.json({
                id: id
            }))
        }

        const vid = formData.get('video')
        const aud = formData.getAll('audio')

        if (!vid) return Response.json({success: false, message: "no video file provided"}, {status: 404})
        if (aud.length === 0) return Response.json({success: false, message: "no audio files provided"}, {status: 404})

        const [videoFile, audioFiles] = await Promise.all([
            handleInputFile(vid),
            handleInputFiles(aud)
        ])


        if (!videoFile) return Response.json({success: false, message: "no file provider in Form body"}, {status: 404})
        if (audioFiles.length === 0) return Response.json({
            success: false,
            message: "No audio files provided"
        }, {status: 404})


        const tempFolder = './temp'

        // Download the files
        const videoFilePath = join(tempFolder, nanoid() + '.mp4');
        const outputFilePath = join(tempFolder, `${id}-output.mp4`)
        const overlayFilePath = join('./static', 'overlay.png')
        const audioFilePaths: string[] = [];


        fs.writeFileSync(videoFilePath, Buffer.from(await videoFile.arrayBuffer()))

        for (let audioFile of audioFiles) {
            const audioFilePath = join(tempFolder, nanoid() + '.mp3')
            fs.writeFileSync(audioFilePath, Buffer.from(await audioFile.arrayBuffer()))
            audioFilePaths.push(audioFilePath)
        }

        let ffmpegCommand: string[] = [];


        ffmpegCommand.push(
            "-i",
            videoFilePath,
            "-i",
            audioFilePaths[0],
            "-metadata",
            "title=Embed Ez", 
            "-metadata",
            "tos=Atleast cache download it",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-shortest",
            "-y",
            outputFilePath,
        )

        // specify output file
        ffmpegCommand.push(outputFilePath)

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
            for (let audioFilePath of audioFilePaths) {
                fs.unlinkSync(audioFilePath);
            }

            if (code == 0) {
                const outputData = fs.readFileSync(outputFilePath);
                const data = await videoUpload(
                    outputData,
                    id,
                    'video/mp4',
                );
                if (!shouldTemp) res(Response.json(data))
            } else {
                if (!shouldTemp) res(Response.error())
            }
        });
    })
}