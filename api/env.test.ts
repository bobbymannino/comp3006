import { describe, expect, it } from "@jest/globals";
import { loadEnv, mongoUrl } from "./env.ts";

describe("loadEnv", () => {
  it("returns the process environment", () => {
    expect(loadEnv()).toBe(process.env);
  });
});

describe("mongoUrl", () => {
  it("builds a connection string from the environment", () => {
    const url = mongoUrl({
      MONGO_USER: "admin",
      MONGO_PASS: "secret",
      MONGO_HOST: "mongo",
      MONGO_PORT: "27017",
      MONGO_DB: "bloggy",
    });

    expect(url).toBe("mongodb://admin:secret@mongo:27017/bloggy?authSource=admin");
  });

  it("authenticates against the admin database", () => {
    expect(mongoUrl({})).toMatch(/\?authSource=admin$/);
  });
});
