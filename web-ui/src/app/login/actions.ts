"use server";

import { redirect } from "next/navigation";
import { ApiError, login } from "@/lib/api";
import { setSession } from "@/lib/session";

/** The fields kept when the form is shown again, the password is never sent back */
type LoginValues = { username: string };

export type LoginState = { error?: string; values?: LoginValues };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const values = { username: String(formData.get("username") ?? "") };

  try {
    const session = await login({
      ...values,
      password: String(formData.get("password") ?? ""),
    });
    await setSession(session.token, session.expiresAt);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error: error.message, values };
  }

  // Outside the try as it works by throwing
  redirect("/");
}
