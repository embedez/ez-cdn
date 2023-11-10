import { uploadData } from "../database/minio"
import { nanoid } from 'nanoid'
import * as fs from "fs"

export const upload =  async (req: Request) => {
    const formData = await req.formData()

    if (!formData.get('file')) return new Response(JSON.stringify({success: false}), {status: 404})

    const file = formData.get('file')
    const contentType = formData.get('contentType')

    const id = nanoid()

    const fileData = await (new Blob([file])).arrayBuffer()

    const data = await uploadData(Buffer.from(fileData), id, {
        'Content-Type': contentType || 'text/plain; charset=us-ascii'
    })

    return new Response(JSON.stringify({
        id: id 
    }))
}