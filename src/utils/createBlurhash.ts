import {encode} from "blurhash";
import sharp from "sharp";


export default async (image: ArrayBuffer, headers?: any) => {
    const processedImage = sharp(image)
    // Get metadata of the processed image
    const metadata = await processedImage.metadata();

    const imageData = await processedImage.raw().ensureAlpha().toBuffer();
    const uint8ClampedArray = new Uint8ClampedArray(imageData);

    return {
        blurhash: encode(uint8ClampedArray, headers.width || metadata.width, headers.height || metadata.height, 4, 4),
        width: metadata.width,
        height: metadata.height,
        headers: metadata
    }
}