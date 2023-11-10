import { upload } from "./routes/upload";
import { connect } from "./database/minio";
import { view } from "./routes/view";
connect()

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url)

    if (url.pathname == "/upload") return upload(request)
    if (url.pathname == "/view") return view(request)
  
    return new Response();
  },
});

console.log(`Listening on localhost: ${server.port}`);
