import { ArrowLeftIcon, HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ApiError, getPost } from "@/lib/api";
import { getSession } from "@/lib/session";

/** Get a post as the current user, cached so the metadata and page share one request */
const loadPost = cache(async (id: string) => getPost(id, await getSession()));

export async function generateMetadata({
  params,
}: PageProps<"/posts/[id]">): Promise<Metadata> {
  try {
    const post = await loadPost((await params).id);
    return { title: post.title };
  } catch {
    return {};
  }
}

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/"
        className={buttonVariants({
          variant: "ghost",
          className: "mb-6 -ml-2.5",
        })}
      >
        <ArrowLeftIcon aria-hidden />
        All posts
      </Link>
      {/* The post is fetched on each request, so it streams in after the page */}
      <Suspense
        fallback={<p className="text-muted-foreground">Loading post...</p>}
      >
        <Post params={params} />
      </Suspense>
    </main>
  );
}

/** A single post in full */
async function Post({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;

  let post;
  try {
    post = await loadPost(id);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 404) notFound();
    return (
      <p role="alert" className="text-destructive">
        {error.message}
      </p>
    );
  }

  return (
    <article>
      <header className="mb-6 flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                dateStyle: "medium",
              })}
            </time>
          ) : (
            // Only the author can see an unpublished post
            <span>Draft, only you can see this</span>
          )}
          <span className="flex items-center gap-1">
            <HeartIcon aria-hidden className="size-4" />
            {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
          </span>
        </div>
      </header>
      {/* Content is plain text, so keep its line breaks */}
      <div className="leading-7 whitespace-pre-wrap">{post.content}</div>
    </article>
  );
}
