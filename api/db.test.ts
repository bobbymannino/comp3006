import os from "node:os";

import { afterAll, describe, expect, it } from "@jest/globals";

import { connectDb, db, likes, posts, SESSION_TTL_MS, sessions, users } from "./db.ts";
import { mongoUrl } from "./env.ts";
import * as models from "./models.ts";

afterAll(async () => {
  await db.disconnect();
});

describe("db", () => {
  // Must run before connectDb is called
  it("does not connect on import", () => {
    expect(db.connection.readyState).toBe(0);
  });

  it("is the default mongoose instance", async () => {
    const mongoose = await import("mongoose");
    expect(db).toBe(mongoose.default);
  });
});

describe("connectDb", () => {
  it("connects to MongoDB and returns the connection", async () => {
    const result = await connectDb(mongoUrl(), { runtimeAdapters: { os } });
    expect(result).toBe(db);
    expect(db.connection.readyState).toBe(1);
  });

  it("can reach the server once connected", async () => {
    const ping = await db.connection.db?.admin().ping();
    expect(ping).toEqual(expect.objectContaining({ ok: 1 }));
  });
});

describe("collections", () => {
  it.each([
    ["users", users, models.User, "users"],
    ["posts", posts, models.Post, "posts"],
    ["likes", likes, models.Like, "likes"],
    ["sessions", sessions, models.Session, "sessions"],
  ])("%s is the shared model on the db connection", (_name, model, source, collection) => {
    expect(model).toBe(source);
    expect(model.db).toBe(db.connection);
    expect(model.collection.collectionName).toBe(collection);
  });
});

describe("re-exports", () => {
  it("re-exports SESSION_TTL_MS", () => {
    expect(SESSION_TTL_MS).toBe(models.SESSION_TTL_MS);
  });
});
