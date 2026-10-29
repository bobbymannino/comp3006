import { cookies } from "next/headers";

/** The cookie the session token is kept in */
export const TOKEN_COOKIE = "token";

/**
 * Store a session token. It is `httpOnly` so it cannot be read by JavaScript
 * in the browser, only by the server when calling the API
 */
export async function setSession(token: string, expiresAt: string) {
  const cs = await cookies();
  cs.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
  });
}

/**
 * Get the session token, if logged in. The cookie expires with the session,
 * so having one means the user is logged in
 */
export async function getSession() {
  const cs = await cookies();
  return cs.get(TOKEN_COOKIE)?.value;
}

/**
 * Delete a session token
 */
export async function deleteSession() {
  const cs = await cookies();
  cs.delete(TOKEN_COOKIE);
}
