import * as v from "valibot";
import { loadEnv } from "./env.ts";
import { PostSchema, PostsSchema } from "./schemas.ts";

// Expects the API to already be running, e.g. via `npm run dev`
const env = loadEnv();
const baseUrl = env.API_URL ?? `http://localhost:${env.PORT}`;

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
    const result = v.safeParse(PostsSchema, body);

    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it("returns the seeded posts", () => {
    const posts = v.parse(PostsSchema, body);

    expect(posts.length).toBeGreaterThan(0);
  });

  it("returns each post once", () => {
    const posts = v.parse(PostsSchema, body);
    const ids = posts.map((post) => post._id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns unique slugs", () => {
    const posts = v.parse(PostsSchema, body);
    const slugs = posts.map((post) => post.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("rejects posts with unknown fields", () => {
    const [post] = v.parse(PostsSchema, body);
    const result = v.safeParse(PostSchema, { ...post, passwordHash: "leaked" });

    expect(result.success).toBe(false);
  });
});
