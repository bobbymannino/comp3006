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
