import { randomUUID } from "node:crypto";
import { expect, describe, it } from "@jest/globals";
import { createPost, createPublishedPost, getLikeCount, request, useUsers } from "../test-utils.ts";

describe("POST /api/posts/:id/likes", () => {
  const users = useUsers("author", "reader");

  it("likes another user's post", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("POST", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(201);
    expect(await getLikeCount(users.author, post)).toBe(1);
  });

  it("likes the user's own post", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("POST", `/posts/${post._id}/likes`, { as: users.author });

    expect(res.status).toBe(201);
    expect(await getLikeCount(users.author, post)).toBe(1);
  });

  it("counts likes from different users", async () => {
    const post = await createPublishedPost(users.author);
    await Promise.all([
      request("POST", `/posts/${post._id}/likes`, { as: users.author }),
      request("POST", `/posts/${post._id}/likes`, { as: users.reader }),
    ]);

    expect(await getLikeCount(users.author, post)).toBe(2);
  });

  it("rejects liking the same post twice", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.reader });
    const res = await request("POST", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(409);
    expect(await getLikeCount(users.author, post)).toBe(1);
  });

  it("requires auth", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("POST", `/posts/${post._id}/likes`);

    expect(res.status).toBe(401);
    expect(await getLikeCount(users.author, post)).toBe(0);
  });

  it("responds with 404 for an unpublished post", async () => {
    const post = await createPost(users.author);
    const res = await request("POST", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });

  it("responds with 404 for a post that does not exist", async () => {
    const res = await request("POST", `/posts/${randomUUID()}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/posts/:id/likes", () => {
  const users = useUsers("author", "reader");

  it("unlikes a post", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.reader });
    const res = await request("DELETE", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(204);
    expect(await getLikeCount(users.author, post)).toBe(0);
  });

  it("only removes the user's own like", async () => {
    const post = await createPublishedPost(users.author);
    await Promise.all([
      request("POST", `/posts/${post._id}/likes`, { as: users.author }),
      request("POST", `/posts/${post._id}/likes`, { as: users.reader }),
    ]);
    await request("DELETE", `/posts/${post._id}/likes`, { as: users.reader });

    expect(await getLikeCount(users.author, post)).toBe(1);
  });

  it("responds with 404 when the post has not been liked", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("DELETE", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });

  it("requires auth", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.reader });
    const res = await request("DELETE", `/posts/${post._id}/likes`);

    expect(res.status).toBe(401);
    expect(await getLikeCount(users.author, post)).toBe(1);
  });

  it("responds with 404 for a post that does not exist", async () => {
    const res = await request("DELETE", `/posts/${randomUUID()}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/posts/:id/likes", () => {
  const users = useUsers("author", "reader");

  it("responds with true when the user has liked the post", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.reader });
    const res = await request("GET", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
  });

  it("responds with false when the user has not liked the post", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.author });
    const res = await request("GET", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(200);
    expect(res.body).toBe(false);
  });

  it("responds with false after the post is unliked", async () => {
    const post = await createPublishedPost(users.author);
    await request("POST", `/posts/${post._id}/likes`, { as: users.reader });
    await request("DELETE", `/posts/${post._id}/likes`, { as: users.reader });
    const res = await request("GET", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.body).toBe(false);
  });

  it("requires auth", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("GET", `/posts/${post._id}/likes`);

    expect(res.status).toBe(401);
  });

  it("lets the author check their unpublished post", async () => {
    const post = await createPost(users.author);
    const res = await request("GET", `/posts/${post._id}/likes`, { as: users.author });

    expect(res.status).toBe(200);
    expect(res.body).toBe(false);
  });

  it("responds with 404 for someone else's unpublished post", async () => {
    const post = await createPost(users.author);
    const res = await request("GET", `/posts/${post._id}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });

  it("responds with 404 for a post that does not exist", async () => {
    const res = await request("GET", `/posts/${randomUUID()}/likes`, { as: users.reader });

    expect(res.status).toBe(404);
  });
});
