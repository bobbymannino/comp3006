"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState, type SubmitEvent } from "react";
import { deletePostAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** Delete one of the logged in user's posts, once they have confirmed it */
export function DeletePostButton({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(
    deletePostAction.bind(null, postId),
    {},
  );

  /** Stop the action unless the user confirms, as deleting cannot be undone */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This cannot be undone.",
    );
    if (!confirmed) event.preventDefault();
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="flex flex-col gap-2"
    >
      <Button type="submit" variant="destructive" disabled={pending}>
        <Trash2Icon />
        <span>{pending ? "Deleting post..." : "Delete Post"}</span>
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
