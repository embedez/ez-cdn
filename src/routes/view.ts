import { Readable } from "stream";
import { exists, getFile, uploadData } from "../database/minio";
import * as fs from "fs";

export const view = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  console.log('View: ', id)

  if (!id) return new Response(JSON.stringify({ success: false, message: "no ?id" }), { status: 404 });

  const dataExists = await exists(id);
  if (!dataExists) return new Response(JSON.stringify({ success: false, message: "no file found with this id" }), { status: 404 });

  // Create a writable stream to handle the response
  const data = await getFile(id);
  const readableStream = new ReadableStream({
    async start(controller) {
      data.on('data', (chunk) => {
        controller.enqueue(chunk);
      });

      data.on('end', () => {
        controller.close();
      });

      data.on('error', (err) => {
        controller.error(err);
      });
    },
  });

  // Cache for 1 year (31536000 seconds)
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=31536000',
    'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
  };

  // Combine existing headers with cache headers
  const responseHeaders = 'headers' in data ? {headers: { ...data.headers as {}, ...cacheHeaders }} : { headers: cacheHeaders };
  return new Response(readableStream, responseHeaders);
};