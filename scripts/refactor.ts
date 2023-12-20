import {connect} from "../src/database/minio";
import {backup} from "./logic/backup";
import {upload} from "./logic/upload";

connect();
async function refactor() {
    await backup()
    await upload()
}