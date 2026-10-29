import { expect, describe, it, beforeEach, afterEach } from "@jest/globals";
import * as v from "valibot";
import { PublicPostSchema } from "../schemas.ts";
import { baseUrl, createPost, setPublished, uniqueId, useUsers } from "../test-utils.ts";

const TIMEOUT_MS = 2000;

/**
 * Resolve with the first message about a post, or reject after a timeout.
 * Matches on slug so it can listen before the post exists
 */
function nextMessageFor(socket: WebSocket, slug: string) {
  return new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No message for post ${slug}`)), TIMEOUT_MS);
    socket.addEventListener("message", (event) => {
      const data: unknown = JSON.parse(String(event.data));
      if (v.is(v.object({ slug: v.literal(slug) }), data)) {
        clearTimeout(timer);
        resolve(data);
      }
    });
  });
}

/** Resolve when no message about a post arrives within the timeout */
function noMessageFor(socket: WebSocket, slug: string) {
  return nextMessageFor(socket, slug).then(
    () => Promise.reject(new Error(`Unexpected message for post ${slug}`)),
    () => undefined,
  );
}

describe("WS /api/posts", () => {
  const users = useUsers("author");
  let socket: WebSocket;

  beforeEach(async () => {
    socket = new WebSocket(`${baseUrl.replace(/^http/, "ws")}/posts`);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
  });

  afterEach(() => {
    socket.close();
  });

  it("sends a post when it is published", async () => {
    const post = await createPost(users.author);
    const message = nextMessageFor(socket, post.slug);
    await setPublished(users.author, post, true);

    const result = v.safeParse(PublicPostSchema, await message);
    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
    expect(result.output).toMatchObject(post);
  });

  it("does not send a post that is still unpublished", async () => {
    const slug = `test-post-${uniqueId()}`;
    const message = noMessageFor(socket, slug);
    await createPost(users.author, { slug });

    await expect(message).resolves.toBeUndefined();
  });
});
