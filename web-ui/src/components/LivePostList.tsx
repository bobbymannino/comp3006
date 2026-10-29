"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as v from "valibot";
import { PublicPostSchema } from "../../../api/schemas";
import { loadPostsAction } from "@/app/actions";
import { PostPreviewCard } from "@/components/PostPreviewCard";
import { Button } from "@/components/ui/button";
import type { PublicPost } from "@/lib/api";

/** Where the API sends newly published posts, this is public as the browser connects to it */
const LIVE_URL =
  process.env.NEXT_PUBLIC_LIVE_URL ?? "ws://localhost:3001/api/posts";

/** How long to wait before reconnecting when the connection drops */
const RECONNECT_MS = 3000;

/** How far below the screen the bottom of the list is when the next page starts loading */
const LOAD_AHEAD = "400px";

/** Where loading more posts is up to, `end` once a page comes back empty */
type Status = "idle" | "loading" | "end" | "error";

/**
 * Add posts to a list, skipping any already in it. Pages can overlap when
 * posts are published after the first page loaded, as each page then starts later
 */
function withoutDuplicates(current: PublicPost[], added: PublicPost[]) {
  const seen = new Set(current.map((post) => post._id));
  return added.filter((post) => !seen.has(post._id));
}

/**
 * A list of posts, which adds newly published posts to the top as they happen
 * and loads the next page when scrolled to the bottom
 */
export function LivePostList({ initialPosts }: { initialPosts: PublicPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [newPost, setNewPost] = useState<string>();
  const bottom = useRef<HTMLDivElement>(null);
  // A ref as well as the status, so a second load cannot start before a render
  const loading = useRef(false);

  useEffect(() => {
    let socket: WebSocket;
    let reconnect: ReturnType<typeof setTimeout>;
    let closed = false;

    function connect() {
      socket = new WebSocket(LIVE_URL);

      socket.addEventListener("message", (event) => {
        // Anything that is not a post is ignored rather than breaking the list
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        const result = v.safeParse(PublicPostSchema, data);
        if (!result.success) return;

        const post = result.output;
        setPosts((current) => [
          ...withoutDuplicates(current, [post]),
          ...current,
        ]);
        setNewPost(post.title);
      });

      socket.addEventListener("close", () => {
        if (!closed) reconnect = setTimeout(connect, RECONNECT_MS);
      });
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnect);
      socket.close();
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    setStatus("loading");

    const result = await loadPostsAction(page + 1);
    loading.current = false;

    if ("error" in result) {
      setError(result.error);
      setStatus("error");
    } else if (result.posts.length === 0) {
      setStatus("end");
    } else {
      setPosts((current) => [
        ...current,
        ...withoutDuplicates(current, result.posts),
      ]);
      setPage(page + 1);
      setStatus("idle");
    }
  }, [page]);

  // watch the bottom of the list. This runs again after each page, so if the
  // bottom is still on screen (a tall screen or short page) the next one loads too
  useEffect(() => {
    if (status !== "idle" || !bottom.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { rootMargin: LOAD_AHEAD },
    );
    observer.observe(bottom.current);
    return () => observer.disconnect();
  }, [status, loadMore]);

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No posts yet.</p>;
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post._id} className="flex *:flex-1">
            <PostPreviewCard post={post} />
          </li>
        ))}
      </ul>

      {/* Tells screen readers about live posts, which appear out of view at the top */}
      <p role="status" className="sr-only">
        {newPost && `New post: ${newPost}`}
      </p>

      <div
        ref={bottom}
        role="status"
        className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground"
      >
        {status === "loading" && <p>Loading more posts...</p>}
        {status === "end" && <p>You&apos;ve reached the end.</p>}
        {status === "error" && (
          <>
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadMore}>
              Try again
            </Button>
          </>
        )}
      </div>
    </>
  );
}
