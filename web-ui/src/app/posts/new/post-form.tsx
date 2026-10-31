"use client";

import { useActionState, useState, type SubmitEvent } from "react";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PostFormSchema, slugify, validateForm, type FieldErrors } from "@/lib/forms";
import { createPostAction } from "./actions";

export function PostForm() {
  const [state, action, pending] = useActionState(createPostAction, {});
  const [errors, setErrors] = useState<FieldErrors<typeof PostFormSchema.entries>>({});
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  // The slug follows the title until it is edited by hand
  const [slugEdited, setSlugEdited] = useState(!!state.values?.slug);

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
    <form action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={state.values?.title}
          onChange={(event) => {
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
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
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            // Clearing the slug lets it follow the title again
            setSlugEdited(event.target.value !== "");
          }}
          aria-invalid={!!errors.slug}
          aria-describedby="slug-hint slug-error"
        />
        <p id="slug-hint" className="text-sm text-muted-foreground">
          Used in the post&apos;s link, made from the title unless you change it.
        </p>
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
          defaultChecked={state.values?.published ?? true}
          className="size-4 accent-primary"
        />
        Publish now, otherwise it is saved as a draft only you can see
      </Label>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating..." : "Create post"}
      </Button>
    </form>
  );
}
