import { describe, expect, it } from "@jest/globals";

import { loadEnv, mongoUrl } from "./env.ts";

describe("mongoUrl", () => {
  it("builds a connection string that authenticates against the admin database", () => {
    const env = {
      MONGO_USER: "user",
      MONGO_PASS: "pass",
      MONGO_HOST: "localhost",
      MONGO_PORT: "27017",
      MONGO_DB: "blog",
    };
    expect(mongoUrl(env)).toBe("mongodb://user:pass@localhost:27017/blog?authSource=admin");
  });
});

describe("loadEnv", () => {
  it("returns the process environment", () => {
    expect(loadEnv()).toBe(process.env);
  });
});
