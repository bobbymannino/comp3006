import { Suspense } from "react";
import { LivePostList } from "@/components/LivePostList";
import { ApiError, getPosts, withLiked } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Posts</h1>
      {/* The posts are fetched on each request, so they stream in after the page */}
      <Suspense
        fallback={<p className="text-muted-foreground">Loading posts...</p>}
      >
        <PostList />
      </Suspense>
    </main>
  );
}

/** The first page of published posts */
async function PostList() {
  let posts;
  try {
    posts = await withLiked(await getPosts(), await getSession());
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    );
  }

  return <LivePostList initialPosts={posts} />;
}
