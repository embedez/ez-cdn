import {
    connect,
    getAllObjectNames,
    exists,
    getFile,
} from "../src/database/minio";
import { streamToUint8Array } from "../src/utils/streamToUint8Array";
import { createAndUploadHash } from "../src/utils/createAndUploadHash";

connect();

async function blurhashAll() {
    const rawNames = await getAllObjectNames();
    const names = rawNames.filter((e) => !e.includes("hash.json"));

    // Split the array into chunks of 10 folders
    const chunkSize = 10;
    for (let i = 0; i < names.length; i += chunkSize) {
        const foldersChunk = names.slice(i, i + chunkSize);

        // Use Promise.all to process 10 folders in parallel
        await Promise.all(
            foldersChunk.map(async (folder) => {
                try {
                    const exist = await exists(folder.replace("/data", "") + "/hash.json");

                    if (exist) return;

                    const file = await getFile(folder);

                    // @ts-ignore
                    const type = file.headers["content-type"];
                    if (!type.includes("image/")) return;

                    const fileData = await streamToUint8Array(file);

                    await createAndUploadHash(
                        folder.replace("/data", ""),
                        await new Blob([fileData]).arrayBuffer(),
                        file
                    );

                    console.log("created hash: ", folder.replace("/data", ""));
                } catch (e) {
                    console.log(e, folder);
                }
            })
        );
    }
}

blurhashAll();
