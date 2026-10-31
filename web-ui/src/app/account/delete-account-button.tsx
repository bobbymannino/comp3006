"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState, type SubmitEvent } from "react";
import { deleteAccountAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** Delete the logged in user's account, once they have confirmed it */
export function DeleteAccountButton() {
  const [state, action, pending] = useActionState(deleteAccountAction, {});

  /** Stop the action unless the user confirms, as deleting cannot be undone */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      "Delete your account? Your posts and likes will be deleted too. This cannot be undone.",
    );
    if (!confirmed) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Button type="submit" variant="destructive" disabled={pending}>
        <Trash2Icon />
        <span>{pending ? "Deleting account..." : "Delete Account"}</span>
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
