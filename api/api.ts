import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { logger } from "./log.ts";
import { posts } from "./db.ts";

const log = logger("api");

export function createApiServer(port: number) {
  log.info(`Creating API server on port ${port}`);
  const server = createServer();
  server.on("request", (req, res) => {
    if (req.url && req.method && req.method in API_ENDPOINTS) {
      const url = new URL(req.url, `http://localhost:${port}`);
      if (url.pathname in API_ENDPOINTS[req.method]) {
        return API_ENDPOINTS[req.method][url.pathname](req, res, url);
      }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: 404,
        error: "The page you are looking for cannot be found.",
      }),
    );
  });
  server.listen(port, "0.0.0.0");
  log.info("Server is running");
}

const API_ENDPOINTS = {
  GET: {
    "/api/posts": handleGetPosts,
  },
};

async function handleGetPosts(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  url: URL,
) {
  const _posts = await posts.find();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(_posts));
}
