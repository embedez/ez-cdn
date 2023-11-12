Simple cdn that uses minio as its core

TODO:
  Add keys

template env
```env
minio_endpoint=""
minio_port=""
minio_useSSL="false"
minio_accessKey=""
minio_secretKey=""
minio_bucket=""
```

example upload
```ts
import axios, { type AxiosRequestConfig } from "axios";
import FormData from "form-data";

export const UploadImage = async (base64image: string, settings: {
    filename: string,
    contentType: string
}) => {
    let data = new FormData();

    const binaryImage = Buffer.from(base64image, 'base64');
    data.append('file', binaryImage, settings);
    data.append('contentType', 'image/png');


    let config = {
        method: 'POST',
        maxBodyLength: Infinity,
        url: 'http://localhost:3000/upload',
        headers: { 
          ...data.getHeaders()
        },
        data : data,
        validateStatus: () => true
      } satisfies AxiosRequestConfig;

    return axios.request(config);
}
```

> returns `{"id": "sdfghgsdfhsdjfgj-gdfshg"}`

example view
http://localhost:3000/view?id=sdfghgsdfhsdjfgj-gdfshg
