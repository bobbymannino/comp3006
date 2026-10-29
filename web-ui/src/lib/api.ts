import type * as v from "valibot";
// Type-only, so none of the API's code ends up in the web UI
import type {
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
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
