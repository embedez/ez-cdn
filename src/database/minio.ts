import { Client, ClientOptions, ItemBucketMetadata } from 'minio'
import axios from 'axios';
import * as path from "path";
import {Readable as ReadableStream} from "stream";

let minioClient: Client | null = null;
let minioBucket: string = process.env.minio_bucket || 'embedez';
let status = {
    connected: false
}

const getClient = (): Client => {
    const missingEnv = ['minio_endpoint', 'minio_port', 'minio_useSSL', 'minio_accessKey', 'minio_secretKey'].filter(v => !process.env[v])
    if (missingEnv.length > 0) throw new Error(`Missing environment variables: ${missingEnv.join(', ')}`)

    if (minioClient) {
        return minioClient;
    }

    const clientOptions: ClientOptions = {
        endPoint: process.env.minio_endpoint!,
        port: parseInt(process.env.minio_port || '9001'),
        useSSL: process.env.minio_useSSL === 'true',
        accessKey: process.env.minio_accessKey!,
        secretKey: process.env.minio_secretKey!,
    };

    minioClient = new Client(clientOptions);

    return minioClient;
}

const connect = async () => {
    const client = getClient();
    try {
        await client.bucketExists(minioBucket)
        console.log(`Minio bucket ${minioBucket} exists`)
        status.connected = true;
    } catch (error) {
        try {
            await client.makeBucket(minioBucket)
            console.log(`Minio bucket ${minioBucket} created`)
            status.connected = true;
        } catch (error) {
            console.log(error);
            status.connected = false;
        }
    }
}

const uploadFile = async (filePath: string, filename: string | string[], metadata?: any) => {
    if (!status.connected) await connect();
    if (Array.isArray(filename)) filename = path.join(...filename);
    const client = getClient();
    return client.fPutObject(
        minioBucket,
        `${filename}`,
        filePath,
        metadata,
        (err, etag) => console.log(err, etag)
    )
}

const uploadFileFromUrl = async (url: string, filename: string | string[], metadata?: any) => {
    if (!status.connected) await connect();
    if (Array.isArray(filename)) filename = path.join(...filename);
    const client = getClient();
    try {
        const res = await axios.get(url, { responseType: 'stream' })
        return new Promise((resolve, reject) => {
            client.putObject(
                minioBucket,
                `${filename}`,
                res.data,
                metadata,
                (err, etag) => {
                    if (err) reject(err);
                    else resolve(etag);
                }
            )
        });
    } catch (error) {
        console.log(error);
        return error
    }
}

const uploadData = async (data: Buffer | string, filename: string | string[], metadata?: ItemBucketMetadata) => {
    if (!status.connected) await connect();
    if (Array.isArray(filename)) filename = path.join(...filename);
    const client = getClient();
    try {
        return new Promise((resolve, reject) => {
            client.putObject(
                minioBucket,
                `${filename}`,
                data,
                0,
                metadata,
                (err, etag) => {
                    if (err) {
                        console.log(err)
                        reject(err);
                    } else {
                        console.log('uploaded: ', filename)
                        resolve(etag);
                    }
                }
            )
        });
    } catch (error) {
        console.log(error);
        return error
    }
}

const getFile = async (filename: string) => {
    if (!status.connected) await connect();
    if (Array.isArray(filename)) filename = path.join(...filename);
    const client = getClient();
    /*if (callback)
        return client.getObject(minioBucket, filename, callback);
    else*/
        return client.getObject(minioBucket, filename);

}

const exists = async (filename: string) => {
    if (!status.connected) await connect();
    if (Array.isArray(filename)) filename = path.join(...filename);
    const client = getClient();
    return client.statObject(minioBucket, filename).catch(e => false)
}

const getAllObjectNames = async (): Promise<string[]> => {
    if (!status.connected) await connect();
    const client = getClient();

    return new Promise((resolve, reject) => {
        const objects: string[] = [];

        const objectStream = client.listObjects(minioBucket, '', true);

        objectStream.on('data', (obj: any) => {
            objects.push(obj.name);
        });

        objectStream.on('end', () => {
            resolve(objects);
        });

        objectStream.on('error', (error) => {
            reject(error);
        });
    });
};

export {
    connect,
    getClient,
    getFile,
    exists,
    uploadFileFromUrl,
    uploadFile,
    uploadData,
    getAllObjectNames
};