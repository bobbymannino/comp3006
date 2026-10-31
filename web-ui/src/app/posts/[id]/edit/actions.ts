"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, updatePost } from "@/lib/api";
import { deleteSession, getSession } from "@/lib/session";

/** The fields kept when the form is shown again */
export type EditPostValues = { title: string; slug: string; content: string; published: boolean };

export type EditPostState = { error?: string; values?: EditPostValues };

/**
 * Save the changes to one of the logged in user's posts. The post's ID is bound
 * to the action, so it comes before the form's previous state and data
 */
export async function editPostAction(
  postId: string,
  _prev: EditPostState,
  formData: FormData,
): Promise<EditPostState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const values = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    content: String(formData.get("content") ?? ""),
    // A checkbox is only sent when it is ticked
    published: formData.get("published") === "on",
  };

  try {
    // The API checks the post belongs to the user, so another user's post is rejected
    await updatePost(postId, values, token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // The session has expired or ended on the API
    if (error.status === 401) {
      await deleteSession();
      redirect("/login");
    }

    return { error: error.message, values };
  }

  // The browser keeps pages it has already loaded, so without this the post,
  // the feed and the account page would show the post as it was before. The
  // whole site is cleared as the post can appear on any of them
  revalidatePath("/", "layout");

  // Outside the try as it works by throwing
  redirect(`/posts/${postId}`);
}
