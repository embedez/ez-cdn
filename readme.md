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

## Advanced Upload


> #### File upload
> takes a video file and audio file to combine them and return the id
> ```bash
> curl --request POST \
> --url 'http://localhost:3000/advanced/upload?type=multi-track-fast' \
> --header 'Authorization: Bearer {{keys}}' \
> --header 'Content-Type: multipart/form-data' \
> --form 'video=@C:\temp\video.mp4' \
> --form 'audio=@C:\temp\audio.mp3'
> ```


> #### Image upload
> takes a video file and audio file to combine them and return the id
> ```bash
> curl --request POST \
> --url 'http://localhost:3000/advanced/upload?type=slides-fluent' \
> --header 'Authorization: Bearer {{keys}}' \
> --header 'Content-Type: multipart/form-data' \
> --form 'image=@C:\temp\image.png' \
> --form 'image=@C:\temp\image1.png' \
> --form 'image=@C:\temp\image2.png' \
> --form 'audio=@C:\temp\audio.mp3'
> ```

> #### ?type
> form data video&audio:
> - multi-track
> - multi-track-fast
> 
> form data image&audio:
> - slides
> - slides-fluent
