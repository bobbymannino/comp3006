"use client";

import { HeartIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { setLikedAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  postId: string;
  likeCount: number;
  /** Whether the user has liked the post, left out when logged out */
  liked?: boolean;
  className?: string;
};

/**
 * Like or unlike a post, showing its like count. The change shows straight
 * away and is undone if the API rejects it
 */
export function LikeButton({
  postId,
  likeCount,
  liked = false,
  className,
}: LikeButtonProps) {
  const [state, setState] = useState({ liked, likeCount });
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const previous = state;
    const next = {
      liked: !previous.liked,
      // love how this looks complicated and its just +-1
      likeCount: previous.likeCount + (previous.liked ? -1 : 1),
    };
    setState(next);
    setError(undefined);

    startTransition(async () => {
      const result = await setLikedAction(postId, next.liked);
      if (result.error) {
        setState(previous);
        setError(result.error);
      }
    });
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        aria-pressed={state.liked}
        title={state.liked ? "Unlike" : "Like"}
      >
        <HeartIcon
          aria-hidden
          className={cn(state.liked && "fill-red-500 text-red-500")}
        />
        {state.likeCount}
        <span className="sr-only">
          {state.likeCount === 1 ? "like" : "likes"}
        </span>
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
