import type * as v from "valibot";
// Type-only, so none of the API's code ends up in the web UI
import type {
  CreatedSchema,
  CreatePostBodySchema,
  LoginBodySchema,
  PublicPostSchema,
  SessionSchema,
  SignupBodySchema,
  SignupSchema,
} from "../../../api/schemas";

/** Where the API is, only used from the server so it is never sent to the browser */
const API_URL = process.env.API_URL ?? "http://localhost:3001";

/** An error response from the API, or a failure to reach it */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Make a JSON request to the API, throwing an `ApiError` if it fails */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(503, "Could not reach the server, please try again later.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Something went wrong.");
  }
  return data as T;
}

/** Create a new user, which also logs them in */
export function signup(body: v.InferInput<typeof SignupBodySchema>) {
  return request<v.InferOutput<typeof SignupSchema>>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Log in an existing user, starting a new session */
export function login(body: v.InferInput<typeof LoginBodySchema>) {
  return request<v.InferOutput<typeof SessionSchema>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** A post as shown publicly, with its content cut down to a preview in lists */
export type PublicPost = v.InferOutput<typeof PublicPostSchema>;

/** The header to send a session token with, if there is one */
function auth(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Get a page of published posts, newest first. Pages start at 1 */
export function getPosts(page = 1) {
  return request<PublicPost[]>(`/api/posts?page=${page}`);
}

/**
 * Get a single post by its ID. Authors can also see their unpublished posts,
 * so their token is sent when logged in
 */
export function getPost(id: string, token?: string) {
  return request<PublicPost>(`/api/posts/${encodeURIComponent(id)}`, {
    headers: auth(token),
  });
}

/** Check if the logged in user has liked a post */
export function getLiked(id: string, token: string) {
  return request<boolean>(`/api/posts/${encodeURIComponent(id)}/likes`, {
    headers: auth(token),
  });
}

/** A post along with whether the logged in user has liked it, left out when logged out */
export type LikeablePost = PublicPost & { liked?: boolean };

/**
 * Add whether the logged in user has liked each post, checking them all at
 * once. A post that cannot be checked is shown as not liked rather than failing
 */
export async function withLiked(
  posts: PublicPost[],
  bearerToken?: string,
): Promise<LikeablePost[]> {
  if (!bearerToken) return posts;
  return Promise.all(
    posts.map(async (post) => ({
      ...post,
      liked: await getLiked(post._id, bearerToken).catch(() => false),
    })),
  );
}

/** Like a post as the logged in user */
export function likePost(postId: string, bearerToken: string) {
  return request<unknown>(`/api/posts/${encodeURIComponent(postId)}/likes`, {
    method: "POST",
    headers: auth(bearerToken),
  });
}

/** Take back the logged in user's like of a post */
export function unlikePost(postId: string, bearerToken: string) {
  return request<unknown>(`/api/posts/${encodeURIComponent(postId)}/likes`, {
    method: "DELETE",
    headers: auth(bearerToken),
  });
}

/** Create a post as the logged in user, unpublished unless `published` is true */
export function createPost(body: v.InferInput<typeof CreatePostBodySchema>, bearerToken: string) {
  return request<v.InferOutput<typeof CreatedSchema>>("/api/posts", {
    method: "POST",
    headers: auth(bearerToken),
    body: JSON.stringify(body),
  });
}
