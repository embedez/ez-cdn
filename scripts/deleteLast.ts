import {
    connect,
    getAllObjectNames,
    exists,
    getFile,
    getFileInfo,
    deleteObject,
} from "../src/database/minio";

// connect to the Minio storage
connect();

const deleteFilesUploadedLast30Min = async () => {
    const names = await getAllObjectNames();

    // Get current time
    const currentTime = new Date();

    // Go through all existing objects
    for (const name of names) {
        // Skip this iteration if the file doesn't exist
        // (race condition, objects could be processed by other means)
        if (!(await exists(name))) continue;

        // Get object's info
        const fileInfo = await getFileInfo(name);

        // Calculate difference in minutes
        const diffInMinutes = Math.abs((currentTime.getTime() - fileInfo.lastModified.getTime()) / 60000);

        // Check if file was modified in the last 30 minutes
        if(diffInMinutes <= 60) {
            // Delete file if it was
            console.log('delete', name)
            await deleteObject(name);
        }
    }
};

deleteFilesUploadedLast30Min();