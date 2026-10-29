import type { Request } from "express";
import * as v from "valibot";
import type { AuthResponse } from "../auth.ts";
import { isDuplicateKeyError, likes, posts } from "../db.ts";
import { PostSchema } from "../schemas.ts";

export async function handleCreateLike(req: Request<{ id: string }>, res: AuthResponse) {
  // An ID that is not a UUID cannot match a post, and would fail to cast. Only
  // published posts can be liked
  const id = req.params.id.toLowerCase();
  const post = v.is(PostSchema.entries._id, id)
    ? await posts.findOne({ _id: id, publishedAt: { $ne: null } }, "_id")
    : null;
  console.log(post);
  if (!post) {
    res.status(404).json({ status: 404, error: "That post does not exist." });
    return;
  }

  // The unique index on userId and postId stops a user liking a post twice
  try {
    const like = await likes.create({ userId: res.locals.user._id, postId: post._id });
    await posts.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
    res.status(201).json({ _id: like._id });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res.status(409).json({ status: 409, error: "You have already liked this post." });
  }
}

export async function handleDeleteLike(req: Request<{ id: string }>, res: AuthResponse) {}
