import isKey from "./isKey";
import extractBearer from "./extractBearer";

export function validateAuthToken(req: Request){
    const auth = req.headers.get('Authorization')
    if (!auth) return Response.json({success: false, message: 'no auth'}, {status: 403})
    const token = extractBearer(auth)
    if (!isKey(token)) return Response.json({success: false, message: `${token} is not a key`}, {status: 403})

    // Return the token if it passes all checks
    return token;
}