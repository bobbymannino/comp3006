import mongoose, { type ConnectOptions } from "mongoose";

import { mongoUrl } from "./env.ts";
import { logger } from "./log.ts";
import { Like, Post, Session, User } from "./models.ts";

export { isDuplicateKeyError } from "./db-errors.ts";
export { Like, Post, SESSION_TTL_MS, Session, User } from "./models.ts";

const log = logger("db");

/**
 * The MongoDB connection. Not connected until `connectDb` is called, but
 * queries made before then are buffered until it is
 */
export const db = mongoose;

/** Connect to MongoDB. Call once before the API starts handling requests */
export async function connectDb(url = mongoUrl(), options?: ConnectOptions) {
  await db.connect(url, options);
  log.info("Loaded database");
  return db;
}

/** Users collection */
export const users = db.model("User", User.schema);
/** Posts collection */
export const posts = db.model("Post", Post.schema);
/** Likes collection */
export const likes = db.model("Like", Like.schema);
/** Sessions collection */
export const sessions = db.model("Session", Session.schema);
