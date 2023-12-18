import { uploadData } from "../database/minio"
import { nanoid } from 'nanoid'
import extractBearer from "../utils/extractBearer";
import isKey from "../utils/isKey";

export const upload =  async (req: Request) => {
    if (req.method !== 'POST') return Response.json({success: false, message: 'please post'}, {status: 405})

    const formData = await req.formData()

    const auth = req.headers.get('Authorization')
    if (!auth) return Response.json({success: false, message: 'no auth'}, {status: 403})

    const token = extractBearer(auth)
    if (!isKey(token)) return Response.json({success: false, message: `${token} is not a key`}, {status: 403})


    const file = formData.get('file') as File
    if (!file) return Response.json({success: false, message: "no file provider in Form body"}, {status: 404})

    const contentType = formData.get('contentType') as undefined | string

    const id = nanoid()
    const fileData = await (new Blob([file])).arrayBuffer()

    const data = await uploadData(Buffer.from(fileData), id, {
        'Content-Type': contentType || file.type || 'text/plain; charset=us-ascii'
    })

    return Response.json({
        id: id 
    })
}