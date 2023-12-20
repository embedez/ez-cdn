import {connect, getAllObjectNames, getFile} from "../../src/database/minio";
import * as fs from "fs";
import * as path from "path";

export async function backup() {
    const names = await getAllObjectNames();
    const backupDirectory = './backup';

    if (!fs.existsSync(backupDirectory)) {
        fs.mkdirSync(backupDirectory);
    }

    console.log('Downloading files...');

    for (const name of names) {
        const destinationPath = path.join(backupDirectory, name);

        try {
            const fileStream = await getFile(name);


            fileStream.pipe(fs.createWriteStream(destinationPath) as any);
            // @ts-ignore
            fs.writeFileSync(destinationPath + "-headers.json", JSON.stringify(fileStream.headers))

            console.log(`Downloaded: ${name}`);
        } catch (error) {
            console.error(`Error downloading ${name}:`, error);
        }
    }

    console.log('Download completed.');
}