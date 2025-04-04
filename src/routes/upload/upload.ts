import { imageUpload } from "./handlers/imageUpload";
import { anyUpload } from "./handlers/anyUpload";
import { validateAuthToken } from "../../utils/validateAuthToken";
import { videoUploadHandler } from "./handlers/videoUploadHandler";
import {handleInputFile} from "../../utils/handleInputFile";

export const upload = async (req: Request) => {
  if (req.method !== "POST")
    return Response.json(
      { success: false, message: "please post" },
      { status: 405 },
    );

  const formData = await req.formData();

  if (!formData)
    return Response.json(
      { success: false, message: "please provide form data" },
      { status: 400 },
    );

  const authToken = validateAuthToken(req);
  if (authToken instanceof Response) return authToken;

  const formFile = formData.get("file");
  
  if (!formFile)
    return Response.json(
      { success: false, message: "please provide a file in Form body" },
      { status: 400 },
    );
  const file = await handleInputFile(formFile);

  if (!file)
    return Response.json(
      { success: false, message: "no file provider in Form body" },
      { status: 404 },
    );

  const contentType =
  (formData.get("contentType") as undefined | string) ||
  file.type ||
  "text/plain; charset=us-ascii";

  if (contentType.includes("image/"))
    return imageUpload(formData, req, { contentType });
  if (contentType.includes("video/"))
    return videoUploadHandler(formData, req, { contentType });

  return anyUpload(formData, req, {
    contentType,
  });
};
