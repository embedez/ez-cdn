# Simple cdn that uses minio as its core

TODO:
  Add cors

## template env
```env
minio_endpoint=""
minio_port=""
minio_useSSL="false"
minio_accessKey=""
minio_secretKey=""
minio_bucket=""

keys=ezkeyname123
```

## example upload

```ts
import axios, {type AxiosRequestConfig} from "axios";
import FormData from "form-data";

export const UploadImage = async (base64File: string, settings: {
  filename: string,
  contentType: string
}) => {
  let data = new FormData();

  const binaryFile = Buffer.from(base64File, 'base64');
  data.append('file', binaryFile, settings);

  // OPTIONAL override
  // data.append('contentType', 'image/png');


  const key = "ezkeyname123"
  let config = {
    method: 'POST',
    maxBodyLength: Infinity,
    url: 'http://localhost:3000/upload',
    headers: {
      'Authorization': `Bearer ${key}`,
      ...data.getHeaders()
    },
    data: data,
    validateStatus: () => true
  } satisfies AxiosRequestConfig;

  return axios.request(config);
}
```

> returns `{"id": "sdfghgsdfhsdjfgj-gdfshg"}`

example view
http://localhost:3000/view?id=sdfghgsdfhsdjfgj-gdfshg
