import express from "express";
import { logger } from "./log.ts";
import { handleGetPosts } from "./api/posts.ts";

const log = logger("api");

export function createApiServer(port: number) {
  log.info(`Creating API server on port ${port}`);
  const app = express();

  app.get("/api/posts", handleGetPosts);

  app.use((_req, res) => {
    res.status(404).json({
      status: 404,
      error: "The page you are looking for cannot be found.",
    });
  });

  app.listen(port, "0.0.0.0", () => {
    log.info("Server is running");
  });
}
