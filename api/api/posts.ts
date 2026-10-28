import type { Request, Response } from "express";
import { posts } from "../db.ts";

const POSTS_PER_PAGE = 10;

export async function handleGetPosts(req: Request, res: Response) {
  let page = Number.parseInt(String(req.query.page ?? "1"));
  page = Number.isNaN(page) ? 1 : Math.max(page, 1);
  const _posts = await posts.find({ publishedAt: { $ne: null } }, "-authorId", {
    limit: POSTS_PER_PAGE,
    skip: (page - 1) * POSTS_PER_PAGE,
  });

  res.set("X-Total-Count", _posts.length.toString()).status(200).json(_posts);
}

export async function handleCreatePost(req: Request, res: Response) {}

export async function handleGetPost(req: Request<{ id: number }>, res: Response) {}

export async function handleUpdatePost(req: Request<{ id: number }>, res: Response) {}

export async function handleDeletePost(req: Request<{ id: number }>, res: Response) {}
