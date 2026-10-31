"use server";

import { redirect } from "next/navigation";
import { ApiError, createPost } from "@/lib/api";
import { deleteSession, getSession } from "@/lib/session";

/** The fields kept when the form is shown again */
type PostValues = { title: string; slug: string; content: string; published: boolean };

export type CreatePostState = { error?: string; values?: PostValues };

export async function createPostAction(
  _prev: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const values = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    content: String(formData.get("content") ?? ""),
    // A checkbox is only sent when it is ticked
    published: formData.get("published") === "on",
  };

  let id;
  try {
    ({ _id: id } = await createPost(values, token));
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    // The session has expired or ended on the API
    if (error.status === 401) {
      await deleteSession();
      redirect("/login");
    }

    return { error: error.message, values };
  }

  // Outside the try as it works by throwing
  redirect(`/posts/${id}`);
}
