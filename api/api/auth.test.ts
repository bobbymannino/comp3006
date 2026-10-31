import { randomUUID } from "node:crypto";
import { expect, describe, it, afterAll } from "@jest/globals";
import * as v from "valibot";
import { LoginSchema, SignupSchema, UserSchema } from "../schemas.ts";
import {
  createPost,
  createPublishedPost,
  createUser,
  deleteUser,
  login,
  request,
  signup,
  signupBody,
  uniqueId,
  useUsers,
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

describe("POST /api/auth/login", () => {
  const users = useUsers("user");

  it("responds with 201 and a session token", async () => {
    const res = await login(users.user);

    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(v.safeParse(LoginSchema, res.body).success).toBe(true);
  });

  it("responds with the user's ID", async () => {
    const res = await login(users.user);

    expect(v.parse(LoginSchema, res.body)._id).toBe(users.user._id);
  });

  it("gives a token that authorizes the user", async () => {
    const { token } = v.parse(LoginSchema, (await login(users.user)).body);
    const res = await request("PUT", `/users/${users.user._id}`, { body: {}, as: { token } });

    expect(res.status).toBe(200);
  });

  it("gives a new token for each login", async () => {
    const [first, second] = await Promise.all([login(users.user), login(users.user)]);

    expect(v.parse(LoginSchema, first.body).token).not.toBe(
      v.parse(LoginSchema, second.body).token,
    );
  });

  it("rejects a wrong password", async () => {
    const res = await login({ ...users.user, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects a username that does not exist", async () => {
    const res = await login({ username: `missing_${uniqueId()}`, password: "password" });

    expect(res.status).toBe(401);
  });

  it.each([
    ["a missing username", { password: "password" }],
    ["a missing password", { username: "someone" }],
    ["unknown fields", { username: "someone", password: "password", admin: true }],
  ])("rejects %s", async (_, body) => {
    const res = await request("POST", "/auth/login", { body });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  const users = useUsers("user", "other");

  /** The logged in user's details, along with their posts */
  const MeSchema = v.strictObject({
    ...UserSchema.entries,
    posts: v.array(v.looseObject({ _id: v.string() })),
  });

  it("responds with 200 and the logged in user's details", async () => {
    const res = await request("GET", "/auth/me", { as: users.user });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(v.parse(MeSchema, res.body)).toMatchObject({
      _id: users.user._id,
      username: users.user.username,
      email: users.user.email,
      displayName: users.user.displayName,
    });
  });

  it("never returns the password hash", async () => {
    const res = await request("GET", "/auth/me", { as: users.user });

    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("responds with whoever the token belongs to", async () => {
    const [userRes, otherRes] = await Promise.all([
      request("GET", "/auth/me", { as: users.user }),
      request("GET", "/auth/me", { as: users.other }),
    ]);

    expect(userRes.body).toHaveProperty("_id", users.user._id);
    expect(otherRes.body).toHaveProperty("_id", users.other._id);
  });

  it("works with a token from logging in", async () => {
    const { token } = v.parse(LoginSchema, (await login(users.user)).body);
    const res = await request("GET", "/auth/me", { as: { token } });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("_id", users.user._id);
  });

  it("responds with the user's latest details after an update", async () => {
    const user = await createUser();
    const displayName = `Renamed ${uniqueId()}`;
    await request("PUT", `/users/${user._id}`, { body: { displayName }, as: user });

    const res = await request("GET", "/auth/me", { as: user });
    await deleteUser(user);

    expect(res.body).toHaveProperty("displayName", displayName);
  });

  it("includes the user's published and unpublished posts", async () => {
    const user = await createUser();
    const [published, draft] = await Promise.all([createPublishedPost(user), createPost(user)]);
    // Another user's post must not be included
    const others = await createPublishedPost(users.other);

    const res = await request("GET", "/auth/me", { as: user });
    await deleteUser(user);

    const ids = v.parse(MeSchema, res.body).posts.map((post) => post._id);
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining([published._id, draft._id]));
    expect(ids).not.toContain(others._id);
  });

  it("responds with no posts for a user who has not written any", async () => {
    const res = await request("GET", "/auth/me", { as: users.user });

    expect(v.parse(MeSchema, res.body).posts).toEqual([]);
  });

  it("rejects the token of a deleted user", async () => {
    const user = await createUser();
    await deleteUser(user);

    const res = await request("GET", "/auth/me", { as: user });

    expect(res.status).toBe(401);
  });
});

// These endpoints require a bearer token
describe("unauthorized requests", () => {
  // Auth is checked before the route looks anything up, so the IDs need not exist
  const id = randomUUID();
  const routes = [
    ["POST", "/posts"],
    ["PUT", `/posts/${id}`],
    ["DELETE", `/posts/${id}`],
    ["POST", `/posts/${id}/likes`],
    ["DELETE", `/posts/${id}/likes`],
    ["GET", "/auth/me"],
    ["PUT", `/users/${id}`],
    ["DELETE", `/users/${id}`],
  ];
  const credentials: [string, Record<string, string>][] = [
    ["no Authorization header", {}],
    ["an invalid token", { Authorization: "Bearer not-a-real-token" }],
    ["a non-bearer scheme", { Authorization: "Basic dXNlcjpwYXNzd29yZA==" }],
    ["a bearer header with no token", { Authorization: "Bearer " }],
  ];

  describe.each(routes)("%s /api%s", (method, path) => {
    it.each(credentials)("responds with 401 for %s", async (_, headers) => {
      // fetch cannot send a body with a GET
      const body = method === "GET" ? undefined : {};
      const res = await request(method, path, { body, headers });

      expect(res.status).toBe(401);
      expect(res.headers.get("content-type")).toMatch(/^application\/json/);
      expect(res.body).toEqual({ status: 401, error: expect.any(String) });
    });
  });
});
