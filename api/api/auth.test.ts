import { expect, describe, it, afterAll } from "@jest/globals";
import * as v from "valibot";
import { SignupSchema } from "../schemas.ts";
import {
  createUser,
  deleteUser,
  request,
  signup,
  signupBody,
  type TestUser,
} from "../test-utils.ts";

describe("POST /api/auth/signup", () => {
  const created: TestUser[] = [];

  afterAll(async () => {
    await Promise.all(created.map(deleteUser));
  });

  it("responds with 201, a new user ID and a session token", async () => {
    const body = signupBody();
    const res = await signup(body);

    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);

    const result = v.safeParse(SignupSchema, res.body);
    expect(result.success).toBe(true);
    if (result.success) created.push({ ...body, ...result.output });
  });

  it("gives a token that authorizes the new user", async () => {
    const user = await createUser();
    created.push(user);
    const res = await request("PUT", `/users/${user._id}`, { body: {}, as: user });

    expect(res.status).toBe(200);
  });

  it("rejects a duplicate username", async () => {
    const user = await createUser();
    created.push(user);
    const res = await signup({ ...signupBody(), username: user.username });

    expect(res.status).toBe(409);
  });

  it("rejects a duplicate email", async () => {
    const user = await createUser();
    created.push(user);
    const res = await signup({ ...signupBody(), email: user.email });

    expect(res.status).toBe(409);
  });

  it.each([
    ["an invalid username", { username: "Not Valid!" }],
    ["an invalid email", { email: "not-an-email" }],
    ["an empty password", { password: "" }],
    ["an empty display name", { displayName: "" }],
  ])("rejects %s", async (_, overrides) => {
    const res = await signup({ ...signupBody(), ...overrides });

    expect(res.status).toBe(400);
  });

  it("rejects unknown fields", async () => {
    const res = await signup({ ...signupBody(), passwordHash: "not-a-hash" });

    expect(res.status).toBe(400);
  });
});
