import { uploadData } from "../../../database/minio";
import { createAndUploadHash } from "../../../utils/createAndUploadHash";
import { getBlurHashAverageColor } from "fast-blurhash";
import { nanoid } from "nanoid";
import { rgbToHex } from "../../../utils/rgbToHex";

interface ImageUploadContext {
  contentType: string;
}

export async function imageUpload(
  formData: FormData,
  req: Request,
  context: ImageUploadContext,
): Promise<any> {
  const file = formData.get("file") as File;
  const blurhash = formData.get("blurhash") as string;
  const id = nanoid();

  const { uploadDataList, generatedHash } = await createUploadData(
    file,
    id,
    blurhash,
    context.contentType,
  );

  const [data] = await Promise.all(uploadDataList);
  const returnedBlurHash = blurhash || generatedHash;

  return Response.json({
    id: id,
    blurhash: returnedBlurHash,
    color: rgbToHex(...getBlurHashAverageColor(returnedBlurHash)),
  });
}

export async function createUploadData(
  file: File | ArrayBuffer,
  id: string,
  blurhash: string,
  contentType: string,
) {
  const fileData = file instanceof File ? await file.arrayBuffer() : file;
  const uploadDataList = [
    uploadData(Buffer.from(fileData), id + "/image", {
      "content-type": contentType,
      blurhash: blurhash,
    }),
  ];
  let generatedHash = null;
  if (!blurhash) {
    generatedHash = await createAndUploadHash(id, fileData, {
      "content-type": contentType,
    });
    uploadDataList.push(generatedHash);
  }
  return {
    uploadDataList,
    generatedHash,
  };
}
