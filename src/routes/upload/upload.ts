import {imageUpload} from "./handlers/imageUpload";
import {anyUpload} from "./handlers/anyUpload";
import {validateAuthToken} from "../../utils/validateAuthToken";
import {nanoid} from "nanoid";
import {videoUpload} from "./handlers/videoUpload";

export const upload =  async (req: Request) => {
    if (req.method !== 'POST') return Response.json({success: false, message: 'please post'}, {status: 405})

    const formData = await req.formData()

    const authToken = validateAuthToken(req)
    if (authToken instanceof Response) return authToken

    const file = formData.get('file') as File
    if (!file) return Response.json({success: false, message: "no file provider in Form body"}, {status: 404})

    const contentType = (formData.get('contentType') as undefined | string) || file.type || 'text/plain; charset=us-ascii'
    if (contentType.includes('image/')) return imageUpload(formData, req, {contentType})
    if (contentType.includes('video/')) return videoUpload(formData, req, {contentType})

    return anyUpload(formData, req, {
        contentType
    })
}