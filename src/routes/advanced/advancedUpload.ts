import { validateAuthToken } from "../../utils/validateAuthToken";
import { longestMultiTrack } from "./handlers/videos/longestMultiTrack";
import { shortestMultiTrack } from "./handlers/videos/shortestMultiTrack";
import { imagesAndAudio } from "./handlers/images/imagesAndAudio";
import { imagesAndAudioFluent } from "./handlers/images/imagesAndAudioFluent";

export const advancedUpload = async (request: Request) => {
  if (request.method === "GET") {
    return Response.json(
      {
        message: "To use this service, send a POST request with your content.",
        usage:
          "?type=[multi-track|multi-track-fast] in the URL for different types of processing.",
        note: "Use multi-track for longest processing (does not clip) and multi-track-fast for shortest processing (clips content).",
      },
      { status: 200 },
    );
  }

  if (request.method !== "POST")
    return Response.json(
      { success: false, message: "Please post" },
      { status: 405 },
    );

  const authToken = validateAuthToken(request);
  if (authToken instanceof Response) return authToken;

  const url = new URL(request.url);
  switch (url.searchParams?.get("type")) {
    case "multi-track":
      return longestMultiTrack(request);
    case "multi-track-fast":
      return shortestMultiTrack(request);
    case "slides":
      return imagesAndAudio(request);
    case "slides-fluent":
      return imagesAndAudioFluent(request);
    default:
      return Response.json({
        success: false,
        message: "Could not find searchParams, or type",
      });
  }
};
