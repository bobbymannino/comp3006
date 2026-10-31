import { ArrowLeftIcon, HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { LikeButton } from "@/components/LikeButton";
import { buttonVariants } from "@/components/ui/button";
import { ApiError, getLiked, getMe, getPost } from "@/lib/api";
import { getSession } from "@/lib/session";
import { Main } from "@/components/main";
import { DeletePostButton } from "./delete-post-button";

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
    <Main>
      <Link
        href="/"
        className={buttonVariants({
          variant: "ghost",
          className: "-ml-2.5 self-start",
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
    </Main>
  );
}

/** A single post in full */
async function Post({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;
  const token = await getSession();
  // Checked alongside the post rather than after it. If it cannot be checked
  // the post is shown as not liked rather than failing
  const likedRequest = token
    ? getLiked(id, token).catch(() => false)
    : undefined;
  // Who is logged in, to know if they wrote the post. If it cannot be checked
  // the post is shown without the author's controls rather than failing
  const meRequest = token ? getMe(token).catch(() => undefined) : undefined;

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
  const [liked, me] = await Promise.all([likedRequest, meRequest]);

  return (
    <article>
      <header className="mb-6 flex flex-col gap-2 border-b pb-6">
        <h1>{post.title}</h1>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {post.publishedAt ? (
              <>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    dateStyle: "medium",
                  })}
                </time>
                •
                <span>
                  @{post.authorUsername} ({post.authorDisplayName})
                </span>
                •
              </>
            ) : (
              // Only the author can see an unpublished post
              <span>Draft, only you can see this</span>
            )}

            {post.publishedAt ? (
              <LikeButton
                postId={post._id}
                likeCount={post.likeCount}
                liked={liked}
              />
            ) : (
              // Only published posts can be liked
              <span className="flex items-center gap-1">
                <HeartIcon aria-hidden className="size-4" />
                {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
              </span>
            )}
          </div>
          {me && post.authorId === me._id && <DeletePostButton postId={post._id} />}
        </div>
      </header>
      {/* Content is plain text, so keep its line breaks */}
      <div className="leading-7 whitespace-pre-wrap">{post.content}</div>
    </article>
  );
}
