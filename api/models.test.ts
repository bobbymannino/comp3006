import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { disconnect } from "mongoose";

import { isDuplicateKeyError } from "./db-errors.ts";
import { Like, Post, Session, SESSION_TTL_MS, User } from "./models.ts";
import { sha256 } from "./sha.ts";
import { connectTestDb, uniqueId } from "./test-utils.ts";

// Expects MongoDB to already be running. Every document a test creates is
// recorded here and deleted once all the tests have run
const created = {
  users: [] as string[],
  posts: [] as string[],
  likes: [] as string[],
  sessions: [] as string[],
};

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({ _id: { $in: created.users } }),
    Post.deleteMany({ _id: { $in: created.posts } }),
    Like.deleteMany({ _id: { $in: created.likes } }),
    Session.deleteMany({ _id: { $in: created.sessions } }),
  ]);
  await disconnect();
});

/** Expect a promise to reject and return its error. If it does not reject then throw an error. */
async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error("Expected the promise to reject");
    },
    (error: unknown) => error,
  );
}

/** Create a new user, random ID */
async function createUser() {
  const id = uniqueId();
  const user = await User.create({
    username: `test_${id}`,
    email: `test_${id}@example.com`,
    passwordHash: "hash",
    displayName: `Test User ${id}`,
  });
  created.users.push(String(user._id));
  return user;
}

type TestUser = Awaited<ReturnType<typeof createUser>>;

/** Create a new post, random ID */
async function createPost(author: TestUser) {
  const id = uniqueId();
  const post = await Post.create({
    authorId: author._id,
    title: `Test Post ${id}`,
    slug: `test-post-${id}`,
  });
  created.posts.push(String(post._id));
  return post;
}

describe("User", () => {
  it("gives a new user a UUID and timestamps, without a version key", async () => {
    const user = await createUser();
    // `.lean()` is used to return a plain object instead of extra methods/setters/getters.
    const stored = await User.findById(user._id).lean();

    expect(String(user._id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(stored?.createdAt).toBeInstanceOf(Date);
    expect(stored?.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects a username that is not lowercase letters, numbers and underscores", async () => {
    const error = await rejection(
      User.create({
        username: "Not Valid!",
        email: `test_${uniqueId()}@example.com`,
        passwordHash: "hash",
        displayName: "Test User",
      }),
    );
    expect(error).toHaveProperty("name", "ValidationError");
  });

  it("rejects a username that is already taken", async () => {
    const user = await createUser();
    const error = await rejection(
      User.create({
        username: user.username,
        email: `test_${uniqueId()}@example.com`,
        passwordHash: "hash",
        displayName: "Test User",
      }),
    );
    expect(isDuplicateKeyError(error)).toBe(true);
  });
});

describe("Post", () => {
  it("defaults to no content, unpublished and no likes", async () => {
    const author = await createUser();
    const post = await createPost(author);

    expect(post.content).toBe("");
    expect(post.publishedAt).toBeNull();
    expect(post.likeCount).toBe(0);
  });

  it("rejects a negative like count", async () => {
    const author = await createUser();
    const post = await createPost(author);
    post.likeCount = -1;

    // (mongo/init/01-schema.js) that rejects this, with DocumentValidationFailure
    expect(await rejection(post.save())).toHaveProperty("code", 121);
  });
});

describe("Like", () => {
  it("rejects a user liking the same post twice", async () => {
    const user = await createUser();
    const post = await createPost(user);
    const like = await Like.create({ userId: user._id, postId: post._id });
    created.likes.push(String(like._id));

    const error = await rejection(Like.create({ userId: user._id, postId: post._id }));
    expect(isDuplicateKeyError(error)).toBe(true);
  });

  it("only records when a like was created", async () => {
    const user = await createUser();
    const post = await createPost(user);
    const like = await Like.create({ userId: user._id, postId: post._id });
    created.likes.push(String(like._id));

    const stored = await Like.findById(like._id).lean();
    expect(stored?.createdAt).toBeInstanceOf(Date);
    expect(stored).not.toHaveProperty("updatedAt");
  });
});

describe("Session", () => {
  it("expires after the default session length", async () => {
    const user = await createUser();
    const before = Date.now();
    const session = await Session.create({
      userId: user._id,
      tokenHash: await sha256(randomUUID()),
    });
    created.sessions.push(String(session._id));

    const expiresIn = session.expiresAt.getTime() - before;
    expect(expiresIn).toBeGreaterThanOrEqual(SESSION_TTL_MS);
    expect(expiresIn).toBeLessThan(SESSION_TTL_MS + 5000);
  });

  it("rejects a token hash that is not SHA-256 hex", async () => {
    const user = await createUser();
    const error = await rejection(Session.create({ userId: user._id, tokenHash: "not-a-hash" }));
    expect(error).toHaveProperty("name", "ValidationError");
  });
});
