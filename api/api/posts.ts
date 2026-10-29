import type { Request, Response } from "express";
import * as v from "valibot";
import type { AuthResponse, OptionalAuthResponse } from "../auth.ts";
import { isDuplicateKeyError, likes, posts } from "../db.ts";
import { broadcastPost } from "../live.ts";
import { CreatePostBodySchema, PostSchema, UpdatePostBodySchema } from "../schemas.ts";
import { preview } from "../text.ts";

const POSTS_PER_PAGE = 12;

export async function handleGetPosts(req: Request, res: Response) {
  let page = Number.parseInt(String(req.query.page ?? "1"));
  page = Number.isNaN(page) ? 1 : Math.max(page, 1);
  // Newest first, with the ID breaking ties so pages never overlap
  const _posts = await posts.find({ publishedAt: { $ne: null } }, "-authorId", {
    sort: { publishedAt: -1, _id: -1 },
    limit: POSTS_PER_PAGE,
    skip: (page - 1) * POSTS_PER_PAGE,
  });

  // The list only needs a preview, the full content comes from a single post
  const previews = _posts.map((post) => ({ ...post.toJSON(), content: preview(post.content) }));

  res.set("X-Total-Count", previews.length.toString()).status(200).json(previews);
}

export async function handleCreatePost(req: Request, res: AuthResponse) {
  const body = v.safeParse(CreatePostBodySchema, req.body);
  if (!body.success) {
    res.status(400).json({ status: 400, error: v.summarize(body.issues) });
    return;
  }

  // Posts start unpublished unless asked, otherwise publishing is done through an update
  const { published, ...details } = body.output;
  try {
    const post = await posts.create({
      ...details,
      authorId: res.locals.user._id,
      publishedAt: published ? new Date() : null,
    });
    res.status(201).json({ _id: post._id });

    // A post published straight away is new to the feed, without its author
    if (published) {
      const { authorId: _, ...publicPost } = post.toJSON();
      broadcastPost({ ...publicPost, content: preview(post.content) });
    }
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res.status(409).json({ status: 409, error: "A post with that slug already exists." });
  }
}

export async function handleGetPost(req: Request<{ id: string }>, res: OptionalAuthResponse) {
  // An ID that is not a UUID cannot match a post, and would fail to cast
  const id = req.params.id.toLowerCase();
  const user = res.locals.user;
  // Unpublished posts are only visible to their author. Anyone else gets a 404
  // rather than a 403 so they cannot tell the post exists
  const visible = user
    ? { $or: [{ publishedAt: { $ne: null } }, { authorId: user._id }] }
    : { publishedAt: { $ne: null } };
  const post = v.is(PostSchema.entries._id, id)
    ? await posts.findOne({ _id: id, ...visible }, "-authorId")
    : null;

  if (!post) {
    res.status(404).json({ status: 404, error: "That post does not exist." });
    return;
  }

  res.status(200).json(post);
}

export async function handleUpdatePost(req: Request<{ id: string }>, res: AuthResponse) {
  const post = await findOwnPost(req, res, "update");
  // Response has been set within the above function so return just consumes it
  if (!post) return;

  const body = v.safeParse(UpdatePostBodySchema, req.body);
  if (!body.success) {
    res.status(400).json({ status: 400, error: v.summarize(body.issues) });
    return;
  }

  // Publishing again keeps the original publish date
  const { published, ...details } = body.output;
  const update =
    published === undefined
      ? details
      : { ...details, publishedAt: published ? (post.publishedAt ?? new Date()) : null };

  try {
    const updated = await posts.findByIdAndUpdate(post._id, update, {
      projection: "-authorId",
      returnDocument: "after",
      runValidators: true,
    });
    res.status(200).json(updated);

    // Only a post going from unpublished to published is new to the feed
    if (updated && published && !post.publishedAt) {
      broadcastPost({ ...updated.toJSON(), content: preview(updated.content) });
    }
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res.status(409).json({ status: 409, error: "A post with that slug already exists." });
  }
}

export async function handleDeletePost(req: Request<{ id: string }>, res: AuthResponse) {
  const post = await findOwnPost(req, res, "delete");
  if (!post) return;

  // The post is deleted last: if a step fails it still exists and deleting can
  // be retried
  await likes.deleteMany({ postId: post._id });
  await posts.deleteOne({ _id: post._id });

  res.status(204).end();
}

/**
 * Find the post in the URL if it belongs to the logged in user, otherwise
 * respond with a 404 or 403 and return null
 */
async function findOwnPost(req: Request<{ id: string }>, res: AuthResponse, action: string) {
  // An ID that is not a UUID cannot match a post, and would fail to cast
  const id = req.params.id.toLowerCase();
  const post = v.is(PostSchema.entries._id, id)
    ? await posts.findById(id, "authorId publishedAt")
    : null;
  if (!post) {
    res.status(404).json({ status: 404, error: "That post does not exist." });
    return null;
  }

  if (post.authorId.toString() !== res.locals.user._id.toString()) {
    res.status(403).json({ status: 403, error: `You can only ${action} your own posts.` });
    return null;
  }

  return post;
}
