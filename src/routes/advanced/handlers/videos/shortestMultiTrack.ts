import { spawn } from "child_process";
import ffmpeg from "ffmpeg-static";

import {nanoid} from "nanoid";
import {replaceData, uploadData} from "../../../../database/minio";
import * as fs from 'fs';
import {join} from 'path';
import axios from 'axios';
import {videoUpload} from "../../../upload/handlers/videoUploadHandler";

export const shortestMultiTrack =  async (req: Request) => {
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

    let ffmpegCommand: string[] = [];


    ffmpegCommand.push(//"-loglevel", "debug", // Add the loglevel debug
        "-i",
        videoFilePath,  // Path of the input video file
        "-i",
        audioFilePaths[0], // Path of the input audio file
        "-i",
        overlayFilePath, // Path of the image file
        "-metadata",
        "title=Embed Ez", // Add custom meta title
        "-metadata",
        "tos=Atleast cache download it", // Add custom meta tos
        "-filter_complex",
        "[0:v][2:v]overlay=W-w-10:H-h-10[outv]", // Position the image to bottom right
        "-map",
        "[outv]", // Map the output from the 'overlay' filter to video stream
        "-map",
        "1:a:0", // Map the audio stream from the second input file
        "-c:a",
        "aac", // Convert the mapped audio stream to aac
        "-crf",
        "28", // Lower the video quality to increase the processing speed
        "-shortest", // Make the output file duration the same as the shortest input file
        "-y", // Overwrite output file without asking
    )

    // Make sure we're using the ultrafast preset for quicker encoding
    ffmpegCommand.push("-preset");
    ffmpegCommand.push("ultrafast");

    // Set max FPS to 30
    ffmpegCommand.push("-r");
    ffmpegCommand.push("30");


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
        } else {
            return Response.error()
        }
    });

    return Response.json({
        id: id
    })
}