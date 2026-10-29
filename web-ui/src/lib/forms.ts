import * as v from "valibot";
import { LoginBodySchema, SignupBodySchema } from "../../../api/schemas";

// The form schemas reuse the API's rules so both sides always agree, only the
// messages are added here as the API's are not written for users

const signup = SignupBodySchema.entries;

/** The fields of the signup form */
export const SignupFormSchema = v.object({
  displayName: v.message(signup.displayName, "Enter a display name."),
  username: v.message(
    signup.username,
    "Use 3 to 32 lowercase letters, numbers or underscores.",
  ),
  email: v.message(signup.email, "Enter a valid email address."),
  password: v.message(signup.password, "Enter a password."),
});

const login = LoginBodySchema.entries;

/** The fields of the login form. The API accepts empty values, so they are rejected here */
export const LoginFormSchema = v.object({
  username: v.message(v.pipe(login.username, v.nonEmpty()), "Enter your username."),
  password: v.message(v.pipe(login.password, v.nonEmpty()), "Enter your password."),
});

/** The first error for each invalid field */
export type FieldErrors<TEntries extends v.ObjectEntries> = Partial<
  Record<keyof TEntries, string>
>;

/**
 * Check a form's fields against a schema. Only the fields in the schema are
 * read, as React adds hidden fields of its own to forms with actions
 */
export function validateForm<TEntries extends v.ObjectEntries>(
  schema: v.ObjectSchema<TEntries, undefined>,
  form: HTMLFormElement,
) {
  const formData = new FormData(form);
  const data = Object.fromEntries(
    Object.keys(schema.entries).map((key) => [key, formData.get(key) ?? ""]),
  );

  const errors: FieldErrors<TEntries> = {};
  const result = v.safeParse(schema, data);
  if (result.success) return errors;

  for (const issue of result.issues) {
    const key = v.getDotPath(issue) as keyof TEntries | null;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
