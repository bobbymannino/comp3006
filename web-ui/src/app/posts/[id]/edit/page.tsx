import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Main } from "@/components/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, getMe, getPost } from "@/lib/api";
import { getSession } from "@/lib/session";
import { EditPostForm } from "./edit-post-form";

export const metadata: Metadata = { title: "Edit post" };

/** Change one of the logged in user's posts. Logged out users are sent to log in by the proxy */
export default function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  return (
    <Main>
      <Card>
        <CardHeader>
          <CardTitle>Edit post</CardTitle>
          <CardDescription>
            Change your post, publish it or turn it back into a draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The post is fetched on each request, so the form streams in after the page */}
          <Suspense fallback={<p className="text-muted-foreground">Loading post...</p>}>
            <Form params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </Main>
  );
}

/** The form, filled in with the post's current fields */
async function Form({ params }: Pick<PageProps<"/posts/[id]/edit">, "params">) {
  const { id } = await params;
  const token = await getSession();
  if (!token) redirect("/login");

  let post, me;
  try {
    // Fetched together, the user is needed to check they wrote the post
    [post, me] = await Promise.all([getPost(id, token), getMe(token)]);
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

  // Only the author can edit a post. Anyone else gets a 404, as the API does
  // for drafts, so the page does not say whose posts exist
  if (post.authorId !== me._id) notFound();

  const { title, slug, content, publishedAt } = post;
  return (
    <EditPostForm
      postId={post._id}
      current={{ title, slug, content, published: publishedAt !== null }}
    />
  );
}
