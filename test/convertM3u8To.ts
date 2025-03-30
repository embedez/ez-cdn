import { spawn, execSync } from "child_process";
import { nanoid } from "nanoid";
import * as fs from "fs";
import { join } from "path";

interface ConversionResult {
  id: string;
  outputFormat: string;
  duration: number;
  timeTaken: number;
  fileSize: number;
  command: string[];
}

const tempFolder = "./temp";
const resultsFolder = "./results";

async function combineVideoAndAudio(
  videoUrl: string,
  audioUrl: string,
  outputFormat: string = "mp4"
): Promise<ConversionResult> {
  const id = `combined-${nanoid()}`;
  const outputFilePath = join(tempFolder, `${id}.${outputFormat}`);
  const startTime = Date.now();

  // Combine watermarked first frame with the rest of the video and audio
  let ffmpegArgs = [
    "-i",
    videoUrl,
    "-i",
    audioUrl,
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-shortest",
    "-y",
    outputFilePath,
  ];


  await runFFmpegCommand(ffmpegArgs);

  const fileSize = fs.statSync(outputFilePath).size;
  const duration = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${outputFilePath}`).toString().trim();
  const timeTaken = Date.now() - startTime;

  return {
    id,
    outputFormat,
    duration: parseFloat(duration),
    timeTaken,
    fileSize,
    command: ffmpegArgs,
  };
}

function runFFmpegCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", args);

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

async function runTests() {
  const videoUrl =
    "https://cf-st.sc-cdn.net/d/rIsrLAjzGe9qFgXOJMWJx.85.mp4?mo=Gt0HGiISFUJITVNORzNna3BzdjhmMTZVRU42ZxoAGgAyAQRQBWABWhVMb25nZm9ybVZpZGVvVmFyaWFudHOiAUMIswkSBAoCaAMiOAo2EidkRTZuUmhCWmFVdEQ5S01VZ1FoeksuMTIwMy5LNUYyM0lRLm0zdTg6AX1CBgjj4qW3BkgCogHCAQiFCxKDAQqAAUp8CncjCxYbGygcExMXESUTFA8QFBUOEhMQFxoPERAMEBYSExEQExQPEBIOFBULFBMSDR0PFBsYGSMSFRgWJjUrEg8LDRcNGhUOGRkTFg4VFCUPCQ0NCxgJCg0MCRgLCwYQChkICwwKDBwKDAwKFi4jJCIVFyQPDhELBxD0A2gEIjcKNRImblp1SngyUGpFR08yTHg5M2pjUFlxLjE0MTMuSzVGMjNJUS5tcGQ6AX1CBgji4qW3BkgCogHDAQiPCxKEAQqBAUp9Cng-DxcOFyUdGBEcCiMZGQoMFRAJDxcODB0MDBYOCxMIDhsNCxYLChULFxEKFQsXDxYPDBkYDykNDBQSHTYjEg4JCRUFGRUOFRUTFhAKEiMMEAgNBRgJBwgUBBULCwMZDxgOCRARCh0QEwoKDzImGC0UECcb_xAbCAUQ9ANoBCI3CjUSJlFRZ2d2TjhadzI0cVhSZWZTTEVJeC4xNDIzLks1RjIzSVEubXBkOgF9QgYIpOOltwZIAqIBtAEIbhKDAQqAAUp8Cnc7FyYwMTE2Ji4oGzQnHh8nIB0hIiQqKychISEeICMnIx8nIiEgICMpHxgYLCQgHR4fJy81MzooLS48SVFdGhQYGxUdKSUfJCMnIhsiIzcaGhUXFxgTFRcZFBgWFBAkERYTFxYYGRoYFhwWLUBDRDcpJyUgGiIXERD0A2gBIioKKBIZMU5ieHBKZU5XWWpHUGVYVTNZWkZSLjExMDoBfUIGCNHlpbcGSAKiAb8BCG8SjgEKiwFKhgEKgAF7LUpjXmF3Y1xaOXVVQkBfQT9ERlBVXVZGRUhEQ0dWSUNRSkRDRUtaRDE0V0dDOD5FTmFvgAGAAV9kZocBnwG2AcMBOistPys8VlFATUhOSzVFR24zMCwpKy0oJi8vJiovJh5IJSkmLi8uMjEsNTExYpQBjQGPAW9kTktENEMuGxD0A2gBIioKKBIZS3l2bTBmMWh1bXU1cnZ3U2dDNlRNLjExMToBfUIGCLvnpbcGSAKiAUMIlwoSBAoCaAMiOAo2EidSOGptTEI0MnFvVWc4cHhvR0ZTeWIuMTMwMy5LNUYyM0lRLm0zdTg6AX1CBgij46W3BkgCogELCAEiBwoFMgF9SAE%3D&uc=5";
  const audioUrl =
    "https://cf-st.sc-cdn.net/d/zLw8zgmDQVLMO9VrjbGqq.mp4?mo=Gt0HGiISFUJITVNORzNna3BzdjhmMTZVRU42ZxoAGgAyAQRQBWABWhVMb25nZm9ybVZpZGVvVmFyaWFudHOiAUMIswkSBAoCaAMiOAo2EidkRTZuUmhCWmFVdEQ5S01VZ1FoeksuMTIwMy5LNUYyM0lRLm0zdTg6AX1CBgjj4qW3BkgCogHCAQiFCxKDAQqAAUp8CncjCxYbGygcExMXESUTFA8QFBUOEhMQFxoPERAMEBYSExEQExQPEBIOFBULFBMSDR0PFBsYGSMSFRgWJjUrEg8LDRcNGhUOGRkTFg4VFCUPCQ0NCxgJCg0MCRgLCwYQChkICwwKDBwKDAwKFi4jJCIVFyQPDhELBxD0A2gEIjcKNRImblp1SngyUGpFR08yTHg5M2pjUFlxLjE0MTMuSzVGMjNJUS5tcGQ6AX1CBgji4qW3BkgCogHDAQiPCxKEAQqBAUp9Cng-DxcOFyUdGBEcCiMZGQoMFRAJDxcODB0MDBYOCxMIDhsNCxYLChULFxEKFQsXDxYPDBkYDykNDBQSHTYjEg4JCRUFGRUOFRUTFhAKEiMMEAgNBRgJBwgUBBULCwMZDxgOCRARCh0QEwoKDzImGC0UECcb_xAbCAUQ9ANoBCI3CjUSJlFRZ2d2TjhadzI0cVhSZWZTTEVJeC4xNDIzLks1RjIzSVEubXBkOgF9QgYIpOOltwZIAqIBtAEIbhKDAQqAAUp8Cnc7FyYwMTE2Ji4oGzQnHh8nIB0hIiQqKychISEeICMnIx8nIiEgICMpHxgYLCQgHR4fJy81MzooLS48SVFdGhQYGxUdKSUfJCMnIhsiIzcaGhUXFxgTFRcZFBgWFBAkERYTFxYYGRoYFhwWLUBDRDcpJyUgGiIXERD0A2gBIioKKBIZMU5ieHBKZU5XWWpHUGVYVTNZWkZSLjExMDoBfUIGCNHlpbcGSAKiAb8BCG8SjgEKiwFKhgEKgAF7LUpjXmF3Y1xaOXVVQkBfQT9ERlBVXVZGRUhEQ0dWSUNRSkRDRUtaRDE0V0dDOD5FTmFvgAGAAV9kZocBnwG2AcMBOistPys8VlFATUhOSzVFR24zMCwpKy0oJi8vJiovJh5IJSkmLi8uMjEsNTExYpQBjQGPAW9kTktENEMuGxD0A2gBIioKKBIZS3l2bTBmMWh1bXU1cnZ3U2dDNlRNLjExMToBfUIGCLvnpbcGSAKiAUMIlwoSBAoCaAMiOAo2EidSOGptTEI0MnFvVWc4cHhvR0ZTeWIuMTMwMy5LNUYyM0lRLm0zdTg6AX1CBgij46W3BkgCogELCAEiBwoFMgF9SAE%3D&uc=5";

  //const videoPath = await downloadToTemp(videoUrl);
  //const audioPath = await downloadToTemp(audioUrl);

  try {
    const result = await combineVideoAndAudio(videoUrl, audioUrl);
    console.log(`Combination successful: ${result.id}`);
  } catch (error) {
    console.error(`Combination failed: ${error.message}`);
  }
}

async function downloadToTemp(url: string): Promise<{
  path: string;
  delete: () => void;
}> {
  const id = `temp-${nanoid()}`;
  const path = join(tempFolder, `${id}.mp4`);
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  fs.writeFileSync(path, Buffer.from(arrayBuffer));
  return { path, delete: () => fs.unlinkSync(path) };
}

if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);
if (!fs.existsSync(resultsFolder)) fs.mkdirSync(resultsFolder);

runTests();
