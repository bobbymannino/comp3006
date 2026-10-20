import type { IncomingMessage, ServerResponse } from "http";
import { posts } from "../db.ts";
import { logger } from "../log.ts";

const POSTS_PER_PAGE = 10;

const log = logger("posts");

export async function handleGetPosts(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  url: URL,
) {
  let page = 1;
  try {
    page = Number.parseInt(url.searchParams.get("page") ?? "1");
    page = Math.max(page, 1);
  } catch {}
  const _posts = await posts.find({ publishedAt: { $ne: null } }, "-authorId", {
    limit: POSTS_PER_PAGE,
    skip: (page - 1) * POSTS_PER_PAGE,
  });

  res.writeHead(200, {
    "Content-Type": "application/json",
    "X-Total-Count": _posts.length.toString(),
  });
  res.end(JSON.stringify(_posts));
}
