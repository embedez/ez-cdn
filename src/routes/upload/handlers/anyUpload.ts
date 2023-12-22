import {uploadData} from "../../../database/minio";
import {nanoid} from "nanoid";

interface AnyUploadContext {
    contentType: string;
}

export async function anyUpload(formData: FormData, req: Request, context: AnyUploadContext): Promise<any> {
    const id = nanoid()
    const file = formData.get('file') as File
    const fileData = await file.arrayBuffer();

    const data = await uploadData(Buffer.from(fileData), id + '/data', {
        'content-type': context.contentType,
    })

    return Response.json({
        id: id,
    })
}