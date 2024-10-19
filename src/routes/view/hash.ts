import { exists, getFile } from "../../database/minio";
import { streamToUint8Array } from "../../utils/streamToUint8Array";

export const hash = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") + "/hash.json";

  console.log("Hash: ", id);

  if (!url.searchParams.get("id"))
    return new Response(
      JSON.stringify({
        success: false,
        message: "no ?id",
      }),
      { status: 404 },
    );

  const dataExists = await exists(id);
  if (!dataExists)
    return new Response(
      JSON.stringify({
        success: false,
        message: "no file found with this id",
      }),
      { status: 404 },
    );

  // Create a writable stream to handle the response
  const dataRaw = await getFile(id);
  const dataArray = await streamToUint8Array(dataRaw);

  const cacheHeaders = {
    "Cache-Control": "public, max-age=36000",
    Expires: new Date(Date.now() + 36000).toUTCString(), // 1 year from now
  };

  // Combine existing headers with cache headers
  const responseHeaders =
    "headers" in dataRaw
      ? { headers: { ...(dataRaw.headers as {}), ...cacheHeaders } }
      : { headers: cacheHeaders };
  return new Response(dataArray, responseHeaders);
};
