import { Suspense } from "react";
import { LivePostList } from "@/components/LivePostList";
import { ApiError, getPosts, withLiked } from "@/lib/api";
import { getSession } from "@/lib/session";
import { Main } from "@/components/main";

export default function Home() {
  return (
    <Main>
      <h1>Posts</h1>
      {/* The posts are fetched on each request, so they stream in after the page */}
      <Suspense
        fallback={<p className="text-muted-foreground">Loading posts...</p>}
      >
        <PostList />
      </Suspense>
    </Main>
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
