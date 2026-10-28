import express from "express";
import { requireAuth } from "./auth.ts";
import { logger } from "./log.ts";
import {
  handleCreatePost,
  handleDeletePost,
  handleGetPost,
  handleGetPosts,
  handleUpdatePost,
} from "./api/posts.ts";
import { handleCreateLike, handleDeleteLike } from "./api/likes.ts";
import {
  handleCreateUser,
  handleDeleteUser,
  handleLoginUser,
  handleUpdateUser,
} from "./api/users.ts";

const log = logger("api");

export function createApiServer(port: number) {
  log.info(`Creating API server on port ${port}`);
  const app = express().use(express.json());

  // Posts
  app.get("/api/posts", handleGetPosts);
  app.post("/api/posts", requireAuth, handleCreatePost);
  app.get("/api/posts/:id", handleGetPost);
  app.put("/api/posts/:id", requireAuth, handleUpdatePost);
  app.delete("/api/posts/:id", requireAuth, handleDeletePost);
  // Likes
  app.post("/api/posts/:id/likes", requireAuth, handleCreateLike);
  app.delete("/api/posts/:id/likes", requireAuth, handleDeleteLike);
  // Auth
  app.post("/api/auth/signup", handleCreateUser);
  app.post("/api/auth/login", handleLoginUser);
  // Users
  app.put("/api/users/:id", requireAuth, handleUpdateUser);
  app.delete("/api/users/:id", requireAuth, handleDeleteUser);

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
