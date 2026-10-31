# COMP3006: Full-Stack Development

This repo contains the source code, documentation, and test procedures for all
of my (Bobby Mannino) COMP3006 work.

## Documents

- Report ([MD](documents/REPORT.md)/[PDF](documents/REPORT.pdf))

## Docker Images

### Docker Image: API

To build the image, in the API directory run:

```sh
docker build -f Dockerfile -t comp3006-api:latest .
```

To run the image:

```sh
docker run --rm \
    -p 3000:3000 \
    -e API_PORT=3000 \
    -e MONGO_USER=bob \
    -e MONGO_PASS=change_me \
    -e MONGO_HOST=host.docker.internal \
    -e MONGO_PORT=6001 \
    -e MONGO_DB=bloggy \
    bobbymannino/comp3006-api
```

> [!NOTE]
> Inside the container `localhost`/`127.0.0.1` is the container itself, not your
> machine, so `MONGO_HOST` must be `host.docker.internal` to reach the MongoDB
> container's published port.

### Docker Image: Web UI

The web UI imports the API's schemas, so the image is built from the repo root:

```sh
docker build -f web-ui/Dockerfile -t comp3006-web-ui:latest .
```

To run the image, with the API running on port 3001:

```sh
docker run --rm \
    -p 3000:3000 \
    -e API_URL=http://host.docker.internal:3001 \
    comp3006-web-ui
```

> [!NOTE]
> `NEXT_PUBLIC_LIVE_URL` is used by the browser, so it is set when the image is
> built rather than when it runs, with
> `--build-arg NEXT_PUBLIC_LIVE_URL=ws://localhost:3001/api/posts` (the
> default).
