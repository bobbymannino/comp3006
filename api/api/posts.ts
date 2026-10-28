import type { Request, Response } from "express";
import * as v from "valibot";
import type { AuthResponse } from "../auth.ts";
import { isDuplicateKeyError, posts } from "../db.ts";
import { PostSchema } from "../schemas.ts";

const POSTS_PER_PAGE = 12;

const CreateBodySchema = v.strictObject({
  title: PostSchema.entries.title,
  slug: PostSchema.entries.slug,
  content: v.optional(PostSchema.entries.content),
});

export async function handleGetPosts(req: Request, res: Response) {
  let page = Number.parseInt(String(req.query.page ?? "1"));
  page = Number.isNaN(page) ? 1 : Math.max(page, 1);
  const _posts = await posts.find({ publishedAt: { $ne: null } }, "-authorId", {
    limit: POSTS_PER_PAGE,
    skip: (page - 1) * POSTS_PER_PAGE,
  });

  res.set("X-Total-Count", _posts.length.toString()).status(200).json(_posts);
}

export async function handleCreatePost(req: Request, res: AuthResponse) {
  const body = v.safeParse(CreateBodySchema, req.body);
  if (!body.success) {
    res.status(400).json({ status: 400, error: v.summarize(body.issues) });
    return;
  }

  // Posts start unpublished, publishing is done through an update
  try {
    const post = await posts.create({ ...body.output, authorId: res.locals.user._id });
    res.status(201).json({ _id: post._id });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res.status(409).json({ status: 409, error: "A post with that slug already exists." });
  }
}

export async function handleGetPost(req: Request<{ id: string }>, res: Response) {}

export async function handleUpdatePost(req: Request<{ id: string }>, res: AuthResponse) {}

export async function handleDeletePost(req: Request<{ id: string }>, res: AuthResponse) {}
