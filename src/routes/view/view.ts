import { Readable } from "stream";
import { exists, getFile, uploadData } from "../../database/minio";
import * as fs from "fs";
import {imageView} from "./handlers/imageView";
import {videoView} from "./handlers/videoView";
import {dataView} from "./handlers/dataView";

export const view = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type')

  console.log('View: ', id)

  if (!id) return new Response(JSON.stringify({ success: false, message: "no ?id" }), { status: 404 });

  // Create a writable stream to handle the response
  let data: any;
  const contentType = type || req.headers.get('Sec-Fetch-Dest') || req.headers.get('Accept') || req.headers.get("content-type");

  if ( contentType?.includes('image') ) {
    data = await imageView(id);
  } else if ( contentType?.includes('video') ) {
    data = await videoView(id, req);
    return new Response(data.content, data.options);
  } else {
    const dataPromise = [exists(id + '/image'), exists(id + '/video')]
    const [isImage, isVideo] = await Promise.all(dataPromise)

    if (isVideo && !data) {
      data = await videoView(id, req)
      return new Response(data.content, data.options);
    }
    if (isImage && !data) data = await imageView(id)
    if (!data) data = await dataView(id)
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      data.on('data', (chunk: any) => {
        controller.enqueue(chunk);
      });

      data.on('end', () => {
        controller.close();
      });

      data.on('error', (err: any) => {
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