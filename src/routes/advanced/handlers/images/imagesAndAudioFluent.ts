import ffmpeg from 'fluent-ffmpeg';
import {nanoid} from "nanoid";
import {replaceData, uploadData} from "../../../../database/minio";
import * as fs from 'fs';
import {join} from 'path';
import {videoUpload} from "../../../upload/handlers/videoUploadHandler";
import {handleInputFiles} from "../../../../utils/handleInputFile";

export const imagesAndAudioFluent =  async (req: Request) => {
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
    let imageFilePaths: Array<string> = [];
    let audioFilePaths: Array<string> = [];

    for(let audioFile of audioFiles) {
        const audioFilePath = join(tempFolder, nanoid()+'.mp3');
        fs.writeFileSync(audioFilePath, await audioFile.arrayBuffer());
        audioFilePaths.push(audioFilePath);
    }
    for(let imageFile of imageFiles) {
        const imageFilePath = join(tempFolder, nanoid()+'.png');
        fs.writeFileSync(imageFilePath, await imageFile.arrayBuffer());
        imageFilePaths.push(imageFilePath);
    }

    let command = ffmpeg();

    imageFilePaths.forEach(path => {
        command = command.addInput(path);
    });

    audioFilePaths.forEach(path => {
        command = command.addInput(path);
    });

    command
        .addOption('-loop', '1')
        .inputFPS(25)
        .complexFilter([
            'scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)\/2:(oh-ih)\/2:color=black[v]',
            'concat=1:v=1:v=1[v]'
        ], 'v')
        .outputOptions([
            '-map [v]',
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-c:a aac',
            '-movflags',
            '+faststart'
        ])
        .saveToFile(outputFilePath)
        .on('start', function() {
            console.log('Processing started !');
        })
        .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', async function() {
            console.log('Processing finished !');
            // Delete the files
            for(let audioFilePath of audioFilePaths) {
                fs.unlinkSync(audioFilePath);
            }
            for(let imageFilePath of imageFilePaths) {
                fs.unlinkSync(imageFilePath);
            }
            const outputData = fs.readFileSync(outputFilePath);
            await videoUpload(
                outputData,
                id,
                'video/mp4',
            );
            fs.unlinkSync(outputFilePath);
        });

    return Response.json({
        id: id
    });
}