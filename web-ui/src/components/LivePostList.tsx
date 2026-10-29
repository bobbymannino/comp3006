"use client";

import { useEffect, useState } from "react";
import * as v from "valibot";
import { PublicPostSchema } from "../../../api/schemas";
import { PostPreviewCard } from "@/components/PostPreviewCard";
import type { PublicPost } from "@/lib/api";

/** Where the API sends newly published posts, this is public as the browser connects to it */
const LIVE_URL = process.env.NEXT_PUBLIC_LIVE_URL ?? "ws://localhost:3001/api/posts";

/** How long to wait before reconnecting when the connection drops */
const RECONNECT_MS = 3000;

/** A list of posts, which adds newly published posts to the top as they happen */
export function LivePostList({ initialPosts }: { initialPosts: PublicPost[] }) {
  const [posts, setPosts] = useState(initialPosts);

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
        setPosts((current) =>
          current.some((p) => p._id === post._id) ? current : [post, ...current],
        );
      });

      // Keep trying while the page is open, for example if the API restarts
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

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No posts yet.</p>;
  }

  return (
    // Announce new posts to screen readers as they are added
    <ul aria-live="polite" className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post._id} className="flex *:flex-1">
          <PostPreviewCard post={post} />
        </li>
      ))}
    </ul>
  );
}
