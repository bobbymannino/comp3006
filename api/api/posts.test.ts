import { expect, describe, it, beforeAll } from "@jest/globals";
import * as v from "valibot";
import { loadEnv } from "../env.ts";
import { PostSchema } from "../schemas.ts";

// Expects the API to already be running, e.g. via `npm run dev`
const env = loadEnv();
const baseUrl = `http://localhost:${env.PORT}`;

describe("GET /api/posts", () => {
  let res: Response;
  let body: unknown;

  beforeAll(async () => {
    res = await fetch(`${baseUrl}/api/posts`);
    body = await res.json();
  });

  it("responds with 200 and JSON", () => {
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
  });

  it("returns a list of posts matching the post schema", () => {
    const result = v.safeParse(v.array(v.omit(PostSchema, ["authorId"])), body);

    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(res.headers.get("x-total-count")).toBe(result.output.length.toString());
    }
  });

  it("returns the seeded posts", () => {
    const posts = v.parse(v.array(v.omit(PostSchema, ["authorId"])), body);

    expect(posts.length).toBeGreaterThan(0);
  });

  it("returns each post once", () => {
    const posts = v.parse(v.array(v.omit(PostSchema, ["authorId"])), body);
    const ids = posts.map((post) => post._id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns unique slugs", () => {
    const posts = v.parse(v.array(v.omit(PostSchema, ["authorId"])), body);
    const slugs = posts.map((post) => post.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("rejects posts with unknown fields", () => {
    const [post] = v.parse(v.array(v.omit(PostSchema, ["authorId"])), body);
    const result = v.safeParse(PostSchema, { ...post, passwordHash: "leaked" });

    expect(result.success).toBe(false);
  });
});

describe("POST /api/posts", () => {
  let res: Response;
  let body: unknown;
  const postBody = {
    title: "Test Post, Hi There",
    authorId: "e73bbf43-360b-46f1-aab0-041ac132ef9f",
    slug: "test-post-hi-there",
    content: "Just some text here",
  };

  beforeAll(async () => {
    res = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      body: JSON.stringify(postBody),
    });
    body = await res.json();
  });

  it("responds with 201 and JSON", () => {
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
  });

  it("responds with a new post ID", () => {
    const response = v.safeParse(v.strictObject({ _id: v.string() }), body);
    expect(response.success).toBe(true);
  });
});
