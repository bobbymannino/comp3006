"use server";

import { redirect } from "next/navigation";
import { ApiError, deleteUser, getMe, getPosts, likePost, unlikePost, withLiked } from "@/lib/api";
import { deleteSession, getSession } from "@/lib/session";

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
    return { posts: await withLiked(await getPosts(safePage), await getSession()) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error: error.message };
  }
}

/**
 * Like or unlike a post. Logged out users are sent to log in first. Errors are
 * returned rather than thrown
 */
export async function setLikedAction(postId: string, liked: boolean) {
  const token = await getSession();
  if (!token) redirect("/login");

  try {
    await (liked ? likePost(postId, token) : unlikePost(postId, token));
    return {};
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // Already liked, or already not liked
    if (error.status === (liked ? 409 : 404)) return {};

    // The session has expired or ended on the API
    if (error.status === 401) {
      await deleteSession();
      redirect("/login");
    }

    return { error: error.message };
  }
}

/**
 * Delete the logged in user's account, along with their posts and likes, then
 * log them out. Errors are returned rather than thrown
 */
export async function deleteAccountAction(): Promise<{ error?: string }> {
  const token = await getSession();
  if (!token) redirect("/login");

  try {
    // The ID is looked up from the session, so only the user's own account can be deleted
    const me = await getMe(token);
    await deleteUser(me._id, token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // The session has expired or ended on the API
    if (error.status === 401) {
      await deleteSession();
      redirect("/login");
    }

    return { error: error.message };
  }

  // Outside the try as it works by throwing. The API ends every session of a
  // deleted user, so the token is only forgotten here
  await deleteSession();
  redirect("/");
}
