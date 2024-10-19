import { getFile } from "../../../database/minio";

export const dataView = async (id: String) => {
  const idSuffix = "/data";
  return await getFile(id + idSuffix);
};
