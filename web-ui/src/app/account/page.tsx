import { ApiError, getMe } from "@/lib/api";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Main } from "@/components/main";
import PostList from "@/components/PostList";
import { DeleteAccountButton } from "./delete-account-button";
import LogOutButton from "./log-out-button";

export default function AccountPage() {
  return (
    <Main>
      <Suspense fallback={<h2 aria-live="polite">Loading account...</h2>}>
        <Account />
      </Suspense>

      <div className="flex flex-wrap items-start gap-2">
        <LogOutButton />
        <DeleteAccountButton />
      </div>
    </Main>
  );
}

async function Account() {
  const token = await getSession();
  if (!token) redirect("/login");
  let me;
  try {
    me = await getMe(token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 404) notFound();
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    );
  }

  const createdAt = new Date(me.createdAt);
  const updatedAt = new Date(me.updatedAt);

  return (
    <>
      <div className="space-y-3">
        <h3>{me.email}</h3>
        <h1>
          {me.displayName} <span className="opacity-25">@{me.username}</span>
        </h1>
        <small>
          <time dateTime={createdAt.toISOString()}>
            Created {createdAt.toLocaleString()}
          </time>{" "}
          •{" "}
          <time dateTime={updatedAt.toISOString()}>
            Updated {updatedAt.toLocaleString()}
          </time>
        </small>
      </div>
      {me.posts.length === 0 ? (
        <p>You have no posts yet.</p>
      ) : (
        <>
          <hr />
          <h2>Your Posts</h2>
          <PostList posts={me.posts} />
        </>
      )}
    </>
  );
}
