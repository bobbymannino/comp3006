# COMP3006: Full-Stack Development

This repo contains the source code, documentation, and test procedures for all
of my (Bobby Mannino) COMP3006 work.

## Documents

- Report ([MD](documents/REPORT.md)/[PDF](documents/REPORT.pdf))

## Docker Images

### Docker Image: API

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
