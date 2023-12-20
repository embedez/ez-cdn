import * as fs from "fs";
import * as path from "path";
import {uploadFile} from "../../src/database/minio";

export async function upload() {
    const backupDirectory = './backup';

    if (!fs.existsSync(backupDirectory)) {
        console.error(`Backup directory ${backupDirectory} does not exist.`);
        return;
    }

    const fileNames = fs.readdirSync(backupDirectory);
    const files = fileNames.filter(e => !e.includes('headers.json'))

    for (const fileName of files) {
        const filePath = path.join(backupDirectory, fileName);

        try {
            const metadata = JSON.parse(fs.readFileSync(filePath + "-headers.json").toString())

            await uploadFile(filePath, path.join(fileName,  'data'), metadata);

            console.log(`Uploaded: ${fileName}`);
        } catch (error) {
            console.error(`Error uploading ${fileName}:`, error);
        }
    }

    console.log('Upload completed.');
}
