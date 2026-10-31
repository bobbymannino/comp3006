"use server";

import { redirect } from "next/navigation";
import { ApiError, getMe, updateUser } from "@/lib/api";
import { deleteSession, getSession } from "@/lib/session";

/** The fields kept when the form is shown again, the password is never sent back */
type EditAccountValues = { displayName: string; username: string; email: string };

export type EditAccountState = { error?: string; values?: EditAccountValues };

export async function editAccountAction(
  _prev: EditAccountState,
  formData: FormData,
): Promise<EditAccountState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  // An empty password keeps the current one, so it is only sent when given
  const password = String(formData.get("password") ?? "");

  try {
    // The ID is looked up from the session, so only the user's own account can be changed
    const me = await getMe(token);
    await updateUser(me._id, password ? { ...values, password } : values, token);
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
  redirect("/account");
}
