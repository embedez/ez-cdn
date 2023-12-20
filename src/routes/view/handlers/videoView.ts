import {exists, getFile} from "../../../database/minio";

export const videoView = async (id: String) => {
    let idSuffix = '';
    const dataExists = await exists(id + '/video');
    if (dataExists) {
        idSuffix = '/video';
    } else {
        idSuffix = '/data';
    }

    return await getFile(id + idSuffix);
};