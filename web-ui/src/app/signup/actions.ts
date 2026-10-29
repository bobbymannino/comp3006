"use server";

import { redirect } from "next/navigation";
import { ApiError, signup } from "@/lib/api";
import { setSession } from "@/lib/session";

/** The fields kept when the form is shown again, the password is never sent back */
type SignupValues = { username: string; email: string; displayName: string };

export type SignupState = { error?: string; values?: SignupValues };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  // do not include password so when it is returned the password it not
  const values = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  };

  try {
    const session = await signup({
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
