"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/session";

/**
 * Log the user out. The API has no logout route, so the token is only
 * forgotten here and the session ends when it expires on the API
 */
export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
