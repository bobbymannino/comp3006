import type { IncomingMessage, ServerResponse } from "http";
import { posts } from "../db.ts";

export async function handleGetPosts(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  url: URL,
) {
  const _posts = await posts.find();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(_posts));
}
