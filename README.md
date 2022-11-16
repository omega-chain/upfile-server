After uploading the file by upfile-builder package, you can use upfile-server to serve the uploaded data.

## Capabilities

- Header information
- Single chunk file serve
- Multipart downloading

## How to Build

```
npm run build
```

## Run

Rename `.env.sample` to `.env` and fill the environments, then run the bellow command:

```
node ./dist/index.js
```

## How To Call

With upfile-handler you will receive a key that is transaction id

`curl http[s]://host:port/key`

One instance is up and running on https://cdn.upfile.space
try it with https://cdn.upfile.space/<key>
i.e
https://cdn.upfile.space/0f6f603b18f87921c28cc1ab1ac0f4028449aca6be26bd9d5cda388e0e22d648

## How the CDN responds to a request
If the data inside the transaction is something that CDN understands(HTML, image, ...), it will interpret the file, and you can see the image or the HTML page. In other cases, you can download the file.
e.g.
https://cdn.upfile.space/7c7590e533c7009af13f953d290ffee04f90a52750c89c892d469025ac2fc88d