import createBlurhash from "./createBlurhash";
import {uploadData} from "../database/minio";

export async function createAndUploadHash (id: string, fileData: ArrayBuffer, headers: any) {
    const hash = await createBlurhash(fileData, headers)
    if (hash.blurhash) {
        const uploadHash = await uploadData(Buffer.from(JSON.stringify({
            "type": "image",
            "content-type": headers['content-type'],
            "data": {
                "blurhash": hash.blurhash,
                "width": hash.width,
                "height": hash.height,
            }
        })), id + '/hash.json', {
            'Content-Type': 'application/json'
        })

        return hash.blurhash
    } else false
}