import { upload } from "./routes/upload/upload";
import { advancedUpload } from "./routes/advanced/advancedUpload";
import { connect } from "./database/minio";
import { view } from "./routes/view/view";
import { hash } from "./routes/view/hash";

connect();

const server = Bun.serve({
  port: process.env.port || 3000,

  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname == "/upload") return upload(request);
    if (url.pathname == "/advanced/upload") return advancedUpload(request);
    if (url.pathname == "/view") return view(request);
    if (url.pathname == "/view.gif") return view(request);
    if (url.pathname == "/view/hash") return hash(request);

    return Response.json({ hello: "world" });
  },
});

console.log(`Listening on localhost: ${server.port}`);
