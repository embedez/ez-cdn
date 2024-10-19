import { nanoid } from "nanoid";
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";

export async function extractFrameAndUpload(file: Buffer): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    // Generate a unique, random filename
    const filename = nanoid();
    const filepath = path.join("./temp", filename);
    const outpath = filepath + ".png";

    const onCompletion = () => {
      // Delete the files
      fs.unlink(filepath, (err) => {
        if (err) console.error(`Error deleting file ${filepath}:`, err);
      });
      fs.unlink(outpath, (err) => {
        if (err) console.error(`Error deleting file ${outpath}:`, err);
      });
    };

    // Write the file to disk
    fs.writeFile(filepath, file, (err) => {
      if (err) {
        onCompletion();
        reject(err);
      }
      console.log("File written to disk");

      const command = ffmpeg(filepath)
        .outputOptions(["-vframes 1"])
        .format("image2")
        .on("error", (error) => {
          onCompletion();
          reject(error);
        })
        .on("end", () => {
          console.log("ffmpeg command execution ended");
          // After processing the file, read the resulting image into a Buffer and resolve it
          fs.readFile(outpath, (err, data) => {
            onCompletion();
            if (err) reject(err);
            else resolve(data);
          });
        });

      console.log("FFmpeg command set up");
      command.save(outpath);
    });
  });
}
