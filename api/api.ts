import express from "express";
import { logger } from "./log.ts";
import { handleGetPosts } from "./api/posts.ts";
import { handleCreateUser } from "./api/users.ts";

const log = logger("api");

export function createApiServer(port: number) {
  log.info(`Creating API server on port ${port}`);
  const app = express();

  // Posts
  app.get("/api/posts", handleGetPosts);
  // Auth
  app.post("/api/auth/signup", handleCreateUser);

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
