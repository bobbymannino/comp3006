import os from "node:os";

import { afterAll, beforeAll } from "@jest/globals";
import { connect, disconnect } from "mongoose";

import { mongoUrl } from "./env.ts";
import { Like, Post, Session, User } from "./models.ts";

// Expects MongoDB to already be running. Every document a test creates is
// recorded here and deleted once all the tests have run
const created = {
  users: [] as string[],
  posts: [] as string[],
  likes: [] as string[],
  sessions: [] as string[],
};

beforeAll(async () => {
  // The driver loads `os` with a dynamic `import()`, which Jest's CommonJS
  // sandbox rejects, so hand it over directly
  await connect(mongoUrl(), { runtimeAdapters: { os } });
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

