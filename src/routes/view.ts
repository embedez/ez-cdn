import { Readable } from "stream";
import { exists, getFile, uploadData } from "../database/minio";
import * as fs from "fs";

export const view = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ success: false, message: "no ?id" }), { status: 404 });

  const dataExists = await exists(id);
  if (!dataExists) return new Response(JSON.stringify({ success: false, message: "no file found with this id" }), { status: 404 });

  const data = await getFile(id);
  const dataArray: Uint8Array = await streamToUint8Array(data);

  if ('headers' in data) console.log(data.headers);

  // Cache for 1 year (31536000 seconds)
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=31536000',
    'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
  };

  // Combine existing headers with cache headers
  const responseHeaders = 'headers' in data ? {headers: { ...data.headers as {}, ...cacheHeaders }} : { headers: cacheHeaders };

  return new Response(dataArray, responseHeaders);
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
