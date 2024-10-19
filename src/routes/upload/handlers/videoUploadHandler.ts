import { uploadData } from "../../../database/minio";
import { getBlurHashAverageColor } from "fast-blurhash";
import { extractFrameAndUpload } from "../../../utils/extractFrameAndUpload";
import { nanoid } from "nanoid";
import { rgbToHex } from "../../../utils/rgbToHex";
import { createUploadData } from "./imageUpload";

interface VideoUploadContext {
  contentType: string;
}

export async function videoUploadHandler(
  formData: FormData,
  req: Request,
  context: VideoUploadContext,
): Promise<any> {
  const id = nanoid();
  const file = formData.get("file") as File;
  const blurhash = formData.get("blurhash") as string;
  const fileData = await file.arrayBuffer();

  const response = await videoUpload(
    Buffer.from(fileData),
    id,
    context.contentType,
    blurhash,
  );

  return Response.json(response);
}

export const videoUpload = async (
  data: Buffer,
  id: string,
  type: string,
  blurhash?: string,
) => {
  let promises = [
    uploadFileData(data, id, type, blurhash),
    extractFrameAndUpload(data),
  ];
  const [__, firstFrame] = await Promise.all(promises);
  console.log("uploaded video to: ", id);

  const imageData = await createUploadData(
    firstFrame,
    id,
    blurhash,
    "image/png",
  );
  const color = rgbToHex(...getBlurHashAverageColor(imageData.generatedHash));

  console.log("uploaded: ", {
    id: id,
    blurhash: blurhash || imageData.generatedHash,
    color: color,
  });

  return {
    id: id,
    blurhash: blurhash || imageData.generatedHash,
    color: color,
  };
};

const uploadFileData = async (
  fileData: Buffer,
  id: string,
  contentType: string,
  blurhash: string,
) => {
  return uploadData(fileData, `${id}/video`, {
    "content-type": contentType,
    blurhash: blurhash,
  });
};
