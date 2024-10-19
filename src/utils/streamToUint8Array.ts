// Function to convert a Readable stream to a Uint8Array
import { Readable } from "stream";

export async function streamToUint8Array(
  stream: Readable,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (error) => reject(error));
  });
}
