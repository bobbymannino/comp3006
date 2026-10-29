"use server";

import { redirect } from "next/navigation";
import { ApiError, getPosts } from "@/lib/api";
import { deleteSession } from "@/lib/session";

/**
 * Log the user out. The API has no logout route, so the token is only
 * forgotten here and the session ends when it expires on the API
 */
export async function logoutAction() {
  await deleteSession();
  redirect("/");
}

/**
 * Get a page of posts for the browser, which cannot call the API itself. Errors
 * are returned rather than thrown, as Next hides thrown messages in production
 */
export async function loadPostsAction(page: number) {
  // Anyone can call an action, so the page is not trusted to be a number
  const safePage = Math.max(1, Math.trunc(Number(page)) || 1);
  try {
    return { posts: await getPosts(safePage) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error: error.message };
  }
}
