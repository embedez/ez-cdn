import { spawn } from "child_process";

import {nanoid} from "nanoid";
import {replaceData, uploadData} from "../../../../database/minio";
import * as fs from 'fs';
import {join} from 'path';
import {videoUpload} from "../../../upload/handlers/videoUploadHandler";
import {handleInputFiles} from "../../../../utils/handleInputFile";

export const imagesAndAudio =  async (req: Request) => {
    const formData = await req.formData()

    const shouldTemp = formData.get('temp')
    const [imageFiles, audioFiles] = await Promise.all([
        handleInputFiles(formData.getAll('image')),
        handleInputFiles(formData.getAll('audio'))
    ])

    if (!imageFiles || !imageFiles[0]) return Response.json({success: false, message: "no image provided in Form body"}, {status: 404})

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
    const outputFilePath = join(tempFolder, `${id}-output.mp4`)
    const overlayFilePath = join('./static', 'overlay.png')
    const imageFilePaths: string[] = [];
    const audioFilePaths: string[] = [];


    for(let audioFile of audioFiles) {
        const audioFilePath = join(tempFolder, nanoid()+'.mp3');
        fs.writeFileSync(audioFilePath, Buffer.from(await audioFile.arrayBuffer()));
        audioFilePaths.push(audioFilePath);
    }
    for(let imageFile of imageFiles) {
        const imageFilePath = join(tempFolder, nanoid()+'.png');
        fs.writeFileSync(imageFilePath, Buffer.from(await imageFile.arrayBuffer()));
        imageFilePaths.push(imageFilePath);
    }

    const imageInputs = imageFilePaths.flatMap((imgPath, i) => {
        return ['-loop', '1', '-t', '2', '-i', imgPath]
    });

    const audioInputs = audioFilePaths.flatMap(audioPath => ['-i', audioPath]);

    const filters: string[] = []

    for(let i = 0; i < imageFilePaths.length; i++) {
        filters.push(`[${i}:v]scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[v${i}]`)
    }

    filters.push(
        `${new Array(imageFilePaths.length).fill("").map((v, i) => `[v${i}]`).join("")}concat=${imageFilePaths.length}:v=1:v=1[v]`
    )


    const maps = [
        "-map", "[v]"
    ]

    for(let i = 0; i < audioFilePaths.length; i++) {
        maps.push("-map", `${i+imageFilePaths.length}:a:0`,)
    }

    let ffmpegCommand = [
        ...imageInputs,
        ...audioInputs,
        "-filter_complex",
        filters.join(';'),
        ...maps,
        "-shortest",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-y",
        outputFilePath
    ].flat();

    const ffmpegProcess = spawn('ffmpeg', ffmpegCommand);
    // Log outputs
    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ffmpegProcess.on('close', async (code) => {
        console.log(`child process exited with code ${code}`);

        // Delete the files
        for(let audioFilePath of audioFilePaths) {
            fs.unlinkSync(audioFilePath);
        }

        for(let imageFilePath of imageFilePaths) {
            fs.unlinkSync(imageFilePath);
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
        id: id,
    });
}