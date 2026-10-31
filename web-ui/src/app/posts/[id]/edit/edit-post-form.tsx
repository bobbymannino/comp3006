"use client";

import Link from "next/link";
import { useActionState, useState, type SubmitEvent } from "react";
import { FieldError } from "@/components/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PostFormSchema, validateForm, type FieldErrors } from "@/lib/forms";
import { editPostAction, type EditPostValues } from "./actions";

type EditPostFormProps = {
  postId: string;
  /** The post's current fields, which the form starts with */
  current: EditPostValues;
};

/** Edit one of the logged in user's posts */
export function EditPostForm({ postId, current }: EditPostFormProps) {
  // The post's ID is bound, as the action is otherwise only given the form
  const [state, action, pending] = useActionState(
    editPostAction.bind(null, postId),
    {
      values: current,
    },
  );
  const [errors, setErrors] = useState<
    FieldErrors<typeof PostFormSchema.entries>
  >({});

  /** Check the fields before they are sent, stopping the action if any are invalid */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const fieldErrors = validateForm(PostFormSchema, form);
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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={state.values?.title}
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
        <FieldError id="title-error" error={errors.title} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={state.values?.slug}
          aria-invalid={!!errors.slug}
          aria-describedby="slug-error"
        />
        <FieldError id="slug-error" error={errors.slug} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          rows={12}
          defaultValue={state.values?.content}
          aria-invalid={!!errors.content}
          aria-describedby="content-error"
        />
        <FieldError id="content-error" error={errors.content} />
      </div>
      <Label className="font-normal">
        <input
          type="checkbox"
          name="published"
          defaultChecked={state.values?.published}
          className="size-4 accent-primary"
        />
        Published, otherwise it is a draft only you can see
      </Label>

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
          href={`/posts/${postId}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
