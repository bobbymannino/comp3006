import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Main } from "@/components/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, getMe } from "@/lib/api";
import { getSession } from "@/lib/session";
import { EditAccountForm } from "./edit-account-form";

export const metadata: Metadata = { title: "Edit account" };

/** Change the logged in user's details. Logged out users are sent to log in by the proxy */
export default function EditAccountPage() {
  return (
    <Main width="narrow">
      <Card>
        <CardHeader>
          <CardTitle>Edit account</CardTitle>
          <CardDescription>Change your details, only what you change is saved.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* The user is fetched on each request, so the form streams in after the page */}
          <Suspense fallback={<p className="text-muted-foreground">Loading account...</p>}>
            <Form />
          </Suspense>
        </CardContent>
      </Card>
    </Main>
  );
}

/** The form, filled in with the user's current details */
async function Form() {
  const token = await getSession();
  if (!token) redirect("/login");

  let me;
  try {
    me = await getMe(token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) redirect("/login");
    if (error.status === 404) notFound();
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    );
  }

  const { displayName, username, email } = me;
  return <EditAccountForm current={{ displayName, username, email }} />;
}
