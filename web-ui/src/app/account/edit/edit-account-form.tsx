"use client";

import Link from "next/link";
import { useActionState, useState, type SubmitEvent } from "react";
import { FieldError } from "@/components/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditAccountFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/forms";
import { editAccountAction, type EditAccountState } from "./actions";

type EditAccountFormProps = {
  /** The user's current details, which the fields start with */
  current: NonNullable<EditAccountState["values"]>;
};

export function EditAccountForm({ current }: EditAccountFormProps) {
  const [state, action, pending] = useActionState(editAccountAction, {
    values: current,
  });
  const [errors, setErrors] = useState<
    FieldErrors<typeof EditAccountFormSchema.entries>
  >({});

  /** Check the fields before they are sent, stopping the action if any are invalid */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const fieldErrors = validateForm(EditAccountFormSchema, form);
    setErrors(fieldErrors);

    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) {
      event.preventDefault();
      (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
    }
  }

  return (
    // Valibot checks the fields instead of the browser
    <form
      action={action}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          defaultValue={state.values?.displayName}
          aria-invalid={!!errors.displayName}
          aria-describedby="displayName-error"
        />
        <FieldError id="displayName-error" error={errors.displayName} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          defaultValue={state.values?.username}
          aria-invalid={!!errors.username}
          aria-describedby="username-error"
        />
        <FieldError id="username-error" error={errors.username} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
        />
        <FieldError id="email-error" error={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-sm text-muted-foreground">
          Leave empty to keep your current password.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Link
          href="/account"
          className={buttonVariants({ variant: "secondary" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
