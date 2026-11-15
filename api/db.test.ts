import os from "node:os";

import { afterAll, describe, expect, it } from "@jest/globals";

import { connectDb, db } from "./db.ts";
import { mongoUrl } from "./env.ts";

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

