import { Suspense } from "react";
import { PostPreviewCard } from "@/components/PostPreviewCard";
import { ApiError, getPosts } from "@/lib/api";

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
    posts = await getPosts();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    );
  }

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No posts yet.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post._id} className="flex *:flex-1">
          <PostPreviewCard post={post} />
        </li>
      ))}
    </ul>
  );
}
