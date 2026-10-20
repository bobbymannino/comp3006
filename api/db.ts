import { randomUUID } from "node:crypto";
import { connect, model, Schema } from "mongoose";
import { config } from "dotenv";

// Loads env variables
config({ path: "../.env" });

const url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

/** The MongoDB connection */
export const db = await connect(url);

// Mirrors the validators in mongo/init/01-schema.js, which reject unknown
// fields, so `__v` is disabled on every schema
const id = { type: Schema.Types.UUID, default: () => randomUUID() };

const userSchema = new Schema(
  {
    _id: id,
    username: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9_]{3,32}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^@\s]+@[^@\s]+$/,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

const postSchema = new Schema(
  {
    _id: id,
    authorId: { type: Schema.Types.UUID, ref: "User", required: true },
    title: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    },
    content: { type: String, default: "" },
    publishedAt: { type: Date, default: null },
    likeCount: { type: Schema.Types.Int32, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

const likeSchema = new Schema(
  {
    _id: id,
    userId: { type: Schema.Types.UUID, ref: "User", required: true },
    postId: { type: Schema.Types.UUID, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

/** Users collection */
export const User = model("User", userSchema);
/** Users collection */
export const users = db.model("User", User.schema);
/** Posts collection */
export const Post = model("Post", postSchema);
/** Posts collection */
export const posts = db.model("Post", Post.schema);
/** Likes collection */
export const Like = model("Like", likeSchema);
/** Likes collection */
export const likes = db.model("Like", Like.schema);
