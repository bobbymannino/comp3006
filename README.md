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
> built rather than when it runs. By default it is empty, so the browser
> connects to `/api/posts` on the page's own host (nginx in production).

## Production

`compose.prod.yml` runs MongoDB, the API, the web UI and nginx. Only nginx is
published (port 80): `/api` goes to the API, including the live posts WebSocket,
and everything else goes to the web UI.

```sh
cp .env.prod.example .env.prod

# Pulls the latest images, needed to avoid caching issues.
docker compose -f compose.prod.yml pull

docker compose -f compose.prod.yml up -d
```

Then open <http://localhost>.

## Tests

### API Unit Test Coverage

| File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| ---------- | ------- | -------- | ------- | ------- | ----------------- |
| All files  | 18.24   | 1.85     | 14.28   | 14.18   |                   |
| api        | 39.43   | 9.52     | 28.57   | 32.23   |                   |
| api.ts     | 0       | 100      | 0       | 0       | 22-59             |
| auth.ts    | 0       | 0        | 0       | 0       | 18-72             |
| db.ts      | 0       | 100      | 0       | 0       | 7-112             |
| env.ts     | 100     | 0        | 100     | 100     | 10                |
| index.ts   | 0       | 0        | 100     | 0       | 6-14              |
| live.ts    | 0       | 0        | 0       | 0       | 5-40              |
| log.ts     | 100     | 100      | 100     | 100     |                   |
| schemas.ts | 100     | 100      | 100     | 100     |                   |
| sha.ts     | 100     | 100      | 100     | 100     |                   |
| text.ts    | 100     | 100      | 100     | 100     |                   |
| api/api    | 0       | 0        | 0       | 0       |                   |
| health.ts  | 0       | 0        | 0       | 0       | 6-11              |
| likes.ts   | 0       | 0        | 0       | 0       | 10-64             |
| posts.ts   | 0       | 0        | 0       | 0       | 9-150             |
| users.ts   | 0       | 0        | 0       | 0       | 9-154             |
