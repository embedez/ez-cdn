import { Readable } from "stream";
import { exists, getFile, uploadData } from "../database/minio"
import * as fs from "fs"

export const view =  async (req: Request) => {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) return new Response(JSON.stringify({success: false, message: "no ?id"}), {status: 404})

    const dataExists = await exists(id)
    if (!dataExists) return new Response(JSON.stringify({success: false, message: "no file found with this id"}), {status: 404})

    const data = await getFile(id)
    const dataArray: Uint8Array = await streamToUint8Array(data);

    if ('headers' in data) console.log(data.headers)

    return new Response(dataArray, 'headers' in data ? {headers: data.headers as any} : {});
};

// Function to convert a Readable stream to a Uint8Array
async function streamToUint8Array(stream: Readable): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
    });
}