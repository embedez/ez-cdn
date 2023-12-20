import {uploadData} from "../../../database/minio";
import {createAndUploadHash} from "../../../utils/createAndUploadHash";
import {getBlurHashAverageColor} from "fast-blurhash";
import { extractFrameAndUpload } from "../../../utils/extractFrameAndUpload";
import {nanoid} from "nanoid";
import {rgbToHex} from "../../../utils/rgbToHex";
import {createUploadData} from "./imageUpload";


interface VideoUploadContext {
    contentType: string;
}

export async function videoUpload(formData: FormData, req: Request, context: VideoUploadContext): Promise<any> {
    const id = nanoid()
    const file = formData.get('file') as File
    const blurhash = formData.get('blurhash') as string
    const fileData = await file.arrayBuffer();

    let promises = [uploadFileData(fileData, id, context.contentType, blurhash), extractFrameAndUpload(file)];

    console.log('uploading data')
    const [data, firstFrame] = await Promise.all(promises);
    console.log('uploaded video to: ', id)

    const imageData = await createUploadData(firstFrame, id,  blurhash, 'image/png')
    const color = rgbToHex(...getBlurHashAverageColor(blurhash || imageData.generatedHash))

    console.log('uploaded: ', {
        id: id,
        blurhash: blurhash || imageData.generatedHash,
        color: color,
    })

    return Response.json({
        id: id,
        blurhash: blurhash || imageData.generatedHash,
        color: color,
    })
}

const uploadFileData = async (fileData: ArrayBuffer, id: string, contentType: string, blurhash: string) => {
    return uploadData(Buffer.from(fileData), `${id}/video`, {
        'content-type': contentType,
        'blurhash': blurhash,
    });
}
