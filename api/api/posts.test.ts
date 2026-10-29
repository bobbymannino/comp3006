import { randomUUID } from "node:crypto";
import { expect, describe, it, beforeAll } from "@jest/globals";
import * as v from "valibot";
import { CreatedSchema, PostSchema, PublicPostSchema } from "../schemas.ts";
import {
  createPost,
  createPublishedPost,
  request,
  setPublished,
  uniqueId,
  useUsers,
  type ApiResponse,
} from "../test-utils.ts";

const PublicPostsSchema = v.array(PublicPostSchema);

describe("GET /api/posts", () => {
  let res: ApiResponse;

  beforeAll(async () => {
    res = await request("GET", "/posts");
  });

  it("responds with 200 and JSON", () => {
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
  });

  it("returns a list of posts matching the post schema", () => {
    const result = v.safeParse(PublicPostsSchema, res.body);

    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(res.headers.get("x-total-count")).toBe(result.output.length.toString());
    }
  });

  it("returns the seeded posts", () => {
    const posts = v.parse(PublicPostsSchema, res.body);

    expect(posts.length).toBeGreaterThan(0);
  });

  it("returns each post once", () => {
    const posts = v.parse(PublicPostsSchema, res.body);
    const ids = posts.map((post) => post._id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns unique slugs", () => {
    const posts = v.parse(PublicPostsSchema, res.body);
    const slugs = posts.map((post) => post.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("rejects posts with unknown fields", () => {
    const [post] = v.parse(PublicPostsSchema, res.body);
    const result = v.safeParse(PostSchema, { ...post, passwordHash: "leaked" });

    expect(result.success).toBe(false);
  });

  it("only returns published posts", () => {
    const posts = v.parse(PublicPostsSchema, res.body);

    expect(posts.every((post) => post.publishedAt !== null)).toBe(true);
  });
});

describe("POST /api/posts", () => {
  const users = useUsers("author");
  const postBody = () => ({
    title: "Test Post, Hi There",
    slug: `test-post-hi-there-${uniqueId()}`,
    content: "Just some text here",
  });

  it("responds with 201 and a new post ID", async () => {
    const res = await request("POST", "/posts", { body: postBody(), as: users.author });

    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(v.safeParse(CreatedSchema, res.body).success).toBe(true);
  });

  it("creates the post unpublished", async () => {
    const post = await createPost(users.author);
    const res = await request("GET", `/posts/${post._id}`, { as: users.author });

    expect(v.parse(PublicPostSchema, res.body).publishedAt).toBeNull();
  });

  it("requires auth", async () => {
    const res = await request("POST", "/posts", { body: postBody() });

    expect(res.status).toBe(401);
  });

  it("rejects a post without a title", async () => {
    const { title: _, ...body } = postBody();
    const res = await request("POST", "/posts", { body, as: users.author });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid slug", async () => {
    const res = await request("POST", "/posts", {
      body: { ...postBody(), slug: "Not A Slug!" },
      as: users.author,
    });

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate slug", async () => {
    const post = await createPost(users.author);
    const res = await request("POST", "/posts", {
      body: { ...postBody(), slug: post.slug },
      as: users.author,
    });

    expect(res.status).toBe(409);
  });
});

describe("GET /api/posts/:id", () => {
  const users = useUsers("author", "other");

  it("returns a published post to anyone", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("GET", `/posts/${post._id}`);

    expect(res.status).toBe(200);
    expect(v.parse(PublicPostSchema, res.body)).toMatchObject(post);
  });

  it("returns an unpublished post to its author", async () => {
    const post = await createPost(users.author);
    const res = await request("GET", `/posts/${post._id}`, { as: users.author });

    expect(res.status).toBe(200);
  });

  it("hides an unpublished post from everyone else", async () => {
    const post = await createPost(users.author);
    const [anonymous, other] = await Promise.all([
      request("GET", `/posts/${post._id}`),
      request("GET", `/posts/${post._id}`, { as: users.other }),
    ]);

    expect(anonymous.status).toBe(404);
    expect(other.status).toBe(404);
  });

  it("responds with 404 for a post that does not exist", async () => {
    const res = await request("GET", `/posts/${randomUUID()}`);

    expect(res.status).toBe(404);
  });

  it("responds with 404 for an invalid id", async () => {
    const res = await request("GET", "/posts/not-an-id");

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/posts/:id", () => {
  const users = useUsers("author", "other");

  it("updates the post for its author", async () => {
    const post = await createPost(users.author);
    const res = await request("PUT", `/posts/${post._id}`, {
      body: { title: "Updated Title" },
      as: users.author,
    });

    expect(res.status).toBe(200);
    expect(v.parse(PublicPostSchema, res.body)).toMatchObject({
      ...post,
      title: "Updated Title",
    });
  });

  it("publishes a post", async () => {
    const post = await createPost(users.author);
    const res = await setPublished(users.author, post, true);

    expect(res.status).toBe(200);
    expect(v.parse(PublicPostSchema, res.body).publishedAt).not.toBeNull();
    expect((await request("GET", `/posts/${post._id}`)).status).toBe(200);
  });

  it("unpublishes a post", async () => {
    const post = await createPublishedPost(users.author);
    const res = await setPublished(users.author, post, false);

    expect(res.status).toBe(200);
    expect(v.parse(PublicPostSchema, res.body).publishedAt).toBeNull();
    expect((await request("GET", `/posts/${post._id}`)).status).toBe(404);
  });

  it("requires auth", async () => {
    const post = await createPost(users.author);
    const res = await request("PUT", `/posts/${post._id}`, { body: { title: "Hijacked" } });

    expect(res.status).toBe(401);
  });

  it("forbids other users from updating the post", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("PUT", `/posts/${post._id}`, {
      body: { title: "Hijacked" },
      as: users.other,
    });

    expect(res.status).toBe(403);
  });

  it("rejects an invalid update", async () => {
    const post = await createPost(users.author);
    const res = await request("PUT", `/posts/${post._id}`, {
      body: { title: "" },
      as: users.author,
    });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/posts/:id", () => {
  const users = useUsers("author", "other");

  it("deletes the post for its author", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("DELETE", `/posts/${post._id}`, { as: users.author });

    expect(res.status).toBe(204);
    expect((await request("GET", `/posts/${post._id}`, { as: users.author })).status).toBe(404);
  });

  it("requires auth", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("DELETE", `/posts/${post._id}`);

    expect(res.status).toBe(401);
  });

  it("forbids other users from deleting the post", async () => {
    const post = await createPublishedPost(users.author);
    const res = await request("DELETE", `/posts/${post._id}`, { as: users.other });

    expect(res.status).toBe(403);
    expect((await request("GET", `/posts/${post._id}`)).status).toBe(200);
  });

  it("responds with 404 for a post that does not exist", async () => {
    const res = await request("DELETE", `/posts/${randomUUID()}`, { as: users.author });

    expect(res.status).toBe(404);
  });
});
