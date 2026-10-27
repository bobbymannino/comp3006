import * as v from "valibot";

// Mirrors the validators in mongo/init/01-schema.js as they appear once
// serialised to JSON (UUIDs and dates become strings)
const uuid = v.pipe(v.string(), v.uuid());
const date = v.pipe(v.string(), v.isoTimestamp());

/** A post as returned by the API */
export const PostSchema = v.strictObject({
  _id: uuid,
  authorId: uuid,
  title: v.pipe(v.string(), v.minLength(1)),
  slug: v.pipe(v.string(), v.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)),
  content: v.string(),
  publishedAt: v.nullable(date),
  likeCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: date,
  updatedAt: date,
});

/** A list of posts as returned by the API */
export const PostsSchema = v.array(PostSchema);

/** A post as shown publicly, without its author */
export const PublicPostSchema = v.omit(PostSchema, ["authorId"]);

/** A user as returned by the API, which never exposes the password hash */
export const UserSchema = v.strictObject({
  _id: uuid,
  username: v.pipe(v.string(), v.regex(/^[a-z0-9_]{3,32}$/)),
  email: v.pipe(v.string(), v.regex(/^[^@\s]+@[^@\s]+$/)),
  displayName: v.pipe(v.string(), v.minLength(1)),
  createdAt: date,
  updatedAt: date,
});

/** The response when a document is created */
export const CreatedSchema = v.strictObject({ _id: uuid });

/** The response when logging in */
export const SessionSchema = v.strictObject({
  token: v.pipe(v.string(), v.minLength(1)),
  expiresAt: date,
});

/** The response when signing up, which also logs the new user in */
export const SignupSchema = v.strictObject({
  ...CreatedSchema.entries,
  ...SessionSchema.entries,
});
