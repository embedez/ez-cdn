import {exists, getFile} from "../../../database/minio";

export const imageView = async (id: String) => {
    let idSuffix = '';
    const dataExists = await exists(id + '/image');
    if (dataExists) {
        idSuffix = '/image';
    } else {
        idSuffix = '/data';
    }

    return await getFile(id + idSuffix);
};