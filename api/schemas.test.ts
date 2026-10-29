import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import * as v from "valibot";
import {
  CreatedSchema,
  CreatePostBodySchema,
  LoginBodySchema,
  PostSchema,
  PublicPostSchema,
  SessionSchema,
  SignupBodySchema,
  SignupSchema,
  UpdatePostBodySchema,
  UpdateUserBodySchema,
  UserSchema,
} from "./schemas.ts";

const now = new Date().toISOString();

/** A post as the API would return it */
const validPost = () => ({
  _id: randomUUID(),
  authorId: randomUUID(),
  title: "A Post",
  slug: "a-post",
  content: "Some content",
  publishedAt: now,
  likeCount: 0,
  createdAt: now,
  updatedAt: now,
});

/** A user as the API would return it */
const validUser = () => ({
  _id: randomUUID(),
  username: "bobby_99",
  email: "bobby@example.com",
  displayName: "Bobby",
  createdAt: now,
  updatedAt: now,
});

/** A valid signup body */
const validSignup = () => ({
  username: "bobby_99",
  email: "bobby@example.com",
  password: "password",
  displayName: "Bobby",
});

describe("PostSchema", () => {
  it("accepts a valid post", () => {
    expect(v.is(PostSchema, validPost())).toBe(true);
  });

  it("accepts an unpublished post", () => {
    expect(v.is(PostSchema, { ...validPost(), publishedAt: null })).toBe(true);
  });

  it("rejects unknown fields", () => {
    expect(v.is(PostSchema, { ...validPost(), passwordHash: "leaked" })).toBe(false);
  });

  it.each(["a-post", "post", "a1-b2-c3", "123"])("accepts the slug %p", (slug) => {
    expect(v.is(PostSchema, { ...validPost(), slug })).toBe(true);
  });

  it.each(["", "A-Post", "a post", "-a-post", "a-post-", "a--post", "a_post", "post!"])(
    "rejects the slug %p",
    (slug) => {
      expect(v.is(PostSchema, { ...validPost(), slug })).toBe(false);
    },
  );

  it("rejects an empty title", () => {
    expect(v.is(PostSchema, { ...validPost(), title: "" })).toBe(false);
  });

  it.each([-1, 1.5, "1", null])("rejects the like count %p", (likeCount) => {
    expect(v.is(PostSchema, { ...validPost(), likeCount })).toBe(false);
  });

  it.each(["not-a-uuid", "", 123])("rejects the ID %p", (_id) => {
    expect(v.is(PostSchema, { ...validPost(), _id })).toBe(false);
  });

  it.each(["yesterday", "2026-13-01T00:00:00.000Z", 0])("rejects the date %p", (createdAt) => {
    expect(v.is(PostSchema, { ...validPost(), createdAt })).toBe(false);
  });

  it.each(Object.keys(validPost()))("requires %s", (key) => {
    const post: Record<string, unknown> = validPost();
    delete post[key];
    expect(v.is(PostSchema, post)).toBe(false);
  });
});

describe("PublicPostSchema", () => {
  it("accepts a post without its author", () => {
    const { authorId: _, ...post } = validPost();
    expect(v.is(PublicPostSchema, post)).toBe(true);
  });

  it("rejects a post that exposes its author", () => {
    expect(v.is(PublicPostSchema, validPost())).toBe(false);
  });
});

describe("UserSchema", () => {
  it("accepts a valid user", () => {
    expect(v.is(UserSchema, validUser())).toBe(true);
  });

  it("rejects a user that exposes their password hash", () => {
    expect(v.is(UserSchema, { ...validUser(), passwordHash: "$2b$10$..." })).toBe(false);
  });

  it.each(["abc", "a".repeat(32), "under_score", "123"])("accepts the username %p", (username) => {
    expect(v.is(UserSchema, { ...validUser(), username })).toBe(true);
  });

  it.each(["ab", "a".repeat(33), "Bobby", "bob by", "bob-by", "bob.by", ""])(
    "rejects the username %p",
    (username) => {
      expect(v.is(UserSchema, { ...validUser(), username })).toBe(false);
    },
  );

  it.each(["bobby", "@example.com", "bobby@", "bob by@example.com", ""])(
    "rejects the email %p",
    (email) => {
      expect(v.is(UserSchema, { ...validUser(), email })).toBe(false);
    },
  );

  it("rejects an empty display name", () => {
    expect(v.is(UserSchema, { ...validUser(), displayName: "" })).toBe(false);
  });
});

describe("CreatedSchema", () => {
  it("accepts an ID", () => {
    expect(v.is(CreatedSchema, { _id: randomUUID() })).toBe(true);
  });

  it("rejects anything else alongside the ID", () => {
    expect(v.is(CreatedSchema, { _id: randomUUID(), title: "A Post" })).toBe(false);
  });
});

describe("SessionSchema", () => {
  it("accepts a token and expiry", () => {
    expect(v.is(SessionSchema, { token: "abc", expiresAt: now })).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(v.is(SessionSchema, { token: "", expiresAt: now })).toBe(false);
  });
});

describe("SignupSchema", () => {
  it("accepts an ID, token and expiry", () => {
    expect(v.is(SignupSchema, { _id: randomUUID(), token: "abc", expiresAt: now })).toBe(true);
  });

  it("requires the session", () => {
    expect(v.is(SignupSchema, { _id: randomUUID() })).toBe(false);
  });
});

describe("SignupBodySchema", () => {
  it("accepts a valid body", () => {
    expect(v.is(SignupBodySchema, validSignup())).toBe(true);
  });

  it.each(Object.keys(validSignup()))("requires %s", (key) => {
    const body: Record<string, unknown> = validSignup();
    delete body[key];
    expect(v.is(SignupBodySchema, body)).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(v.is(SignupBodySchema, { ...validSignup(), password: "" })).toBe(false);
  });

  it("rejects setting the password hash directly", () => {
    expect(v.is(SignupBodySchema, { ...validSignup(), passwordHash: "$2b$10$..." })).toBe(false);
  });

  it("uses the same username rules as a user", () => {
    expect(v.is(SignupBodySchema, { ...validSignup(), username: "Not Valid" })).toBe(false);
  });
});

describe("UpdateUserBodySchema", () => {
  it("accepts an empty body", () => {
    expect(v.is(UpdateUserBodySchema, {})).toBe(true);
  });

  it("accepts a single field", () => {
    expect(v.is(UpdateUserBodySchema, { displayName: "Bob" })).toBe(true);
  });

  it("still validates the fields given", () => {
    expect(v.is(UpdateUserBodySchema, { email: "not-an-email" })).toBe(false);
  });

  it.each(["passwordHash", "_id", "createdAt"])("rejects changing %s", (key) => {
    expect(v.is(UpdateUserBodySchema, { [key]: "value" })).toBe(false);
  });
});

describe("LoginBodySchema", () => {
  it("accepts a username and password", () => {
    expect(v.is(LoginBodySchema, { username: "bobby", password: "password" })).toBe(true);
  });

  it.each([{ username: "bobby" }, { password: "password" }, {}])("rejects %p", (body) => {
    expect(v.is(LoginBodySchema, body)).toBe(false);
  });

  it("rejects a password that is not a string", () => {
    expect(v.is(LoginBodySchema, { username: "bobby", password: 123 })).toBe(false);
  });
});

describe("CreatePostBodySchema", () => {
  const body = { title: "A Post", slug: "a-post", content: "Some content" };

  it("accepts a valid body", () => {
    expect(v.is(CreatePostBodySchema, body)).toBe(true);
  });

  it("makes the content optional", () => {
    const { content: _, ...withoutContent } = body;
    expect(v.is(CreatePostBodySchema, withoutContent)).toBe(true);
  });

  it.each(["title", "slug"])("requires %s", (key) => {
    const partial: Record<string, unknown> = { ...body };
    delete partial[key];
    expect(v.is(CreatePostBodySchema, partial)).toBe(false);
  });

  it.each([true, false])("accepts published: %p", (published) => {
    expect(v.is(CreatePostBodySchema, { ...body, published })).toBe(true);
  });

  it.each(["true", 1, null])("rejects published: %p", (published) => {
    expect(v.is(CreatePostBodySchema, { ...body, published })).toBe(false);
  });

  it.each([
    ["publishedAt", now],
    ["likeCount", 100],
    ["authorId", randomUUID()],
  ])("rejects setting %s", (key, value) => {
    expect(v.is(CreatePostBodySchema, { ...body, [key]: value })).toBe(false);
  });
});

describe("UpdatePostBodySchema", () => {
  it("accepts an empty body", () => {
    expect(v.is(UpdatePostBodySchema, {})).toBe(true);
  });

  it.each([true, false])("accepts published: %p", (published) => {
    expect(v.is(UpdatePostBodySchema, { published })).toBe(true);
  });

  it.each(["true", 1, null])("rejects published: %p", (published) => {
    expect(v.is(UpdatePostBodySchema, { published })).toBe(false);
  });

  it("still validates the fields given", () => {
    expect(v.is(UpdatePostBodySchema, { title: "" })).toBe(false);
    expect(v.is(UpdatePostBodySchema, { slug: "Not A Slug" })).toBe(false);
  });

  it.each([
    ["publishedAt", now],
    ["likeCount", 100],
    ["authorId", randomUUID()],
  ])("rejects setting %s", (key, value) => {
    expect(v.is(UpdatePostBodySchema, { [key]: value })).toBe(false);
  });
});
