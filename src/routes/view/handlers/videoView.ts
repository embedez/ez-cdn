import {exists, getFile} from "../../../database/minio";
export const videoView = async (id: String, req: Request) => {
    let idSuffix = '';
    const dataExists = await exists(id + '/video');
    if (dataExists) {
        idSuffix = '/video';
    } else {
        idSuffix = '/data';
    }
    const stream = await getFile(id + idSuffix);
    // Get range header
    const range = req.headers.get('range');
    const chunks = [];
    for await (let chunk of stream) {
        chunks.push(chunk);
    }
    const video = Buffer.concat(chunks);
    const videoSize = video.length;
    if (range) {
        let parts = range.replace(/bytes=/, "").split("-");
        let start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
        // Debug
        console.log(`Range: ${range}`);
        console.log(`Parts: ${parts}`);
        console.log(`Start: ${start}`);
        console.log(`End: ${end}`);
        // Fix for seeking issue by adding 1 to the end byte range
        let contentLength = (end - start) + 1;
        console.log(`Content Length: ${contentLength}`); // Debug
        let headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
            "Expires": new Date(Date.now() + 86400000).toUTCString(),  // Expires in 24 hours
            "Cache-Control": "public, max-age=86400",  // Cache for 24 hours
            //"ETag": `"${video.hashCode()}"`  // ETag based on hash of video
        };
        console.log(`Headers: ${JSON.stringify(headers)}`); // Debug
        // Slice range should include the end byte so add 1
        let content = Buffer.from(video).subarray(start, end + 1)
        return {options: {headers, status: 206}, content};
    } else {
        return {
            options: {
                headers: {
                    "Content-Type": "video/mp4",
                    "Content-Length": videoSize,
                    "Expires": new Date(Date.now() + 86400000).toUTCString(),  // Expires in 24 hours
                    "Cache-Control": "public, max-age=86400",  // Cache for 24 hours
                    //"ETag": `"${video.hashCode()}"`  // ETag based on hash of video
                }, status: 200
            },
            content: video,
        };
    }
};