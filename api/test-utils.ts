import { randomUUID } from "node:crypto";
import { afterAll, beforeAll } from "@jest/globals";
import * as v from "valibot";
import { loadEnv } from "./env.ts";
import { CreatedSchema, PublicPostSchema, SignupSchema } from "./schemas.ts";

// Expects the API to already be running, e.g. via `npm run dev`
const env = loadEnv();
export const baseUrl = `http://localhost:${env.PORT}/api`;

/** A user created for a test, along with their password and session token */
export type TestUser = {
  _id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  token: string;
};

/** A post created for a test */
export type TestPost = {
  _id: string;
  title: string;
  slug: string;
  content: string;
};

export type ApiResponse = {
  status: number;
  headers: Headers;
  body: unknown;
};

type RequestOptions = {
  /** Sent as JSON */
  body?: unknown;
  /** The user (or just the token) to make the request as */
  as?: Pick<TestUser, "token">;
  /** Extra headers, e.g. a malformed `Authorization` header */
  headers?: Record<string, string>;
};

/** A short random id, safe to use in usernames and slugs */
export function uniqueId() {
  return randomUUID().slice(0, 8);
}

/** Credentials for a session token */
export function authHeader({ token }: Pick<TestUser, "token">) {
  return `Bearer ${token}`;
}

/** Make a request to the API, parsing the body as JSON when there is one */
export async function request(
  method: string,
  path: string,
  { body, as, headers: extraHeaders }: RequestOptions = {},
): Promise<ApiResponse> {
  const headers = new Headers(extraHeaders);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (as) headers.set("Authorization", authHeader(as));

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = text || undefined;
  try {
    parsed = JSON.parse(text);
  } catch {}

  return { status: res.status, headers: res.headers, body: parsed };
}

/** Assert a create request succeeded and return its parsed body */
function expectCreated<const Schema extends v.GenericSchema>(
  res: ApiResponse,
  schema: Schema,
  what: string,
) {
  if (res.status !== 201) {
    throw new Error(`Creating ${what} failed with ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return v.parse(schema, res.body);
}

/** Unique details to sign up with */
export function signupBody() {
  const id = uniqueId();
  return {
    username: `test_${id}`,
    email: `test_${id}@example.com`,
    password: `password-${id}`,
    displayName: `Test User ${id}`,
  };
}

/** Sign up a new user */
export function signup(body: unknown) {
  return request("POST", "/auth/signup", { body });
}

/** Sign up a user with unique details, keeping the token they are given */
export async function createUser(overrides: Partial<Omit<TestUser, "_id" | "token">> = {}) {
  const user = { ...signupBody(), ...overrides };
  const { _id, token } = expectCreated(await signup(user), SignupSchema, "user");
  return { ...user, _id, token } satisfies TestUser;
}

/** Log in as a user */
export function login({ username, password }: Pick<TestUser, "username" | "password">) {
  return request("POST", "/auth/login", { body: { username, password } });
}

/** Delete a user, along with their posts and likes */
export async function deleteUser(user: TestUser) {
  await request("DELETE", `/users/${user._id}`, { as: user });
}

/**
 * Create named users before the enclosing `describe` runs and delete them
 * after, e.g. `const users = useUsers("author", "reader")` then `users.author`
 */
export function useUsers<const Name extends string>(...names: Name[]) {
  const users = {} as Record<Name, TestUser>;

  beforeAll(async () => {
    const created = await Promise.all(names.map(() => createUser()));
    names.forEach((name, i) => (users[name] = created[i]!));
  });

  afterAll(async () => {
    await Promise.all(Object.values<TestUser>(users).map(deleteUser));
  });

  return users;
}

/** Create an unpublished post with a unique slug */
export async function createPost(author: TestUser, overrides: Partial<Omit<TestPost, "_id">> = {}) {
  const id = uniqueId();
  const post = {
    title: `Test Post ${id}`,
    slug: `test-post-${id}`,
    content: "Just some text here",
    ...overrides,
  };
  const res = await request("POST", "/posts", { body: post, as: author });
  const { _id } = expectCreated(res, CreatedSchema, "post");
  return { ...post, _id } satisfies TestPost;
}

/** Publish or unpublish a post */
export function setPublished(author: TestUser, post: TestPost, published: boolean) {
  return request("PUT", `/posts/${post._id}`, { body: { published }, as: author });
}

/** Create a post and publish it */
export async function createPublishedPost(author: TestUser) {
  const post = await createPost(author);
  await setPublished(author, post, true);
  return post;
}

/** Get a post's current like count, as seen by its author */
export async function getLikeCount(author: TestUser, post: TestPost) {
  const res = await request("GET", `/posts/${post._id}`, { as: author });
  return v.parse(PublicPostSchema, res.body).likeCount;
}
