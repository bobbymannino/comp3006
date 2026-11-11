import { connect } from "mongoose";

import { mongoUrl } from "./env.ts";
import { logger } from "./log.ts";
import { Like, Post, Session, User } from "./models.ts";

export { isDuplicateKeyError } from "./db-errors.ts";
export { Like, Post, SESSION_TTL_MS, Session, User } from "./models.ts";

const log = logger("db");

/** The MongoDB connection */
export const db = await connect(mongoUrl());

/** Users collection */
export const users = db.model("User", User.schema);
/** Posts collection */
export const posts = db.model("Post", Post.schema);
/** Likes collection */
export const likes = db.model("Like", Like.schema);
/** Sessions collection */
export const sessions = db.model("Session", Session.schema);

log.info("Loaded database");
