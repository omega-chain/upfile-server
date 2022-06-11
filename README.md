After upload the file by upfile-builder, you can use upfile-server to serve the uploaded file data

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

## How To Work

With upfile-handler you will receive a key that is transaction id

`curl http[s]://host:port/key`
