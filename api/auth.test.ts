import { it, describe, beforeAll, afterAll, expect, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { disconnect } from "mongoose";

import { createSession, optionalAuth, requireAuth } from "./auth.ts";
import { Session, User } from "./models.ts";
import { sha256 } from "./sha.ts";
import { connectTestDb, uniqueId } from "./test-utils.ts";

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({ _id: { $in: created.users } }),
    Session.deleteMany({ userId: { $in: created.users } }),
  ]);
  await disconnect();
});

const created = {
  users: [] as string[],
};

/** Create a demo user */
async function createTestUser() {
  const id = uniqueId();
  const user = await User.insertOne({
    username: `test_${id}`,
    email: `test_${id}@example.com`,
    passwordHash: "hash",
    displayName: `Test User ${id}`,
  });
  created.users.push(String(user._id));
  return user;
}

describe("createSession", () => {
  it("should return a token and expiry for a valid user", async () => {
    const user = await createTestUser();
    const session = await createSession(user._id);
    expect(session).toHaveProperty("token");
    expect(session).toHaveProperty("expiresAt");
  });
});

/**
 * A fake request with the given `Authorization` header.
 *
 * @param authorization - The `Authorization` header value to use, including "Bearer".
 */
function mockRequest(authorization?: string) {
  return {
    get: (name: string) => (name.toLowerCase() === "authorization" ? authorization : undefined),
  } as unknown as Request;
}

/** A fake response that records the status and body it was sent */
function mockResponse() {
  const res = {
    locals: {} as Record<string, unknown>,
    statusCode: 200,
    body: undefined as unknown,
    // This and json fn are used by express to change status/json of the response.
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

/** Run requireAuth with the given header */
async function runRequireAuth(authorization?: string) {
  const res = mockResponse();
  // Since we don't use next we can just fake it.
  const next = jest.fn();
  await requireAuth(
    mockRequest(authorization),
    res as unknown as Response,
    next as unknown as NextFunction,
  );
  return { res, next };
}

/** Run optionalAuth with the given header */
async function runOptionalAuth(authorization?: string) {
  const res = mockResponse();
  const next = jest.fn();
  await optionalAuth(
    mockRequest(authorization),
    res as unknown as Response,
    next as unknown as NextFunction,
  );
  return { res, next };
}

/** Assert requireAuth rejected the request */
function expectUnauthorised({ res, next }: Awaited<ReturnType<typeof runRequireAuth>>) {
  expect(next).not.toHaveBeenCalled();
  expect(res.statusCode).toBe(401);
  expect(res.body).toEqual({ status: 401, error: "You must be logged in to do this." });
  expect(res.locals.user).toBeUndefined();
}

describe("requireAuth", () => {
  it("should call next and set the user for a valid token", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user._id);

    const { res, next } = await runRequireAuth(`Bearer ${token}`);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    const authed = res.locals.user as InstanceType<typeof User>;
    expect(String(authed._id)).toBe(String(user._id));
    expect(authed.username).toBe(user.username);
  });

  it("should not expose the password hash", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user._id);

    const { res } = await runRequireAuth(`Bearer ${token}`);

    const authed = res.locals.user as InstanceType<typeof User>;
    expect(authed.passwordHash).toBeUndefined();
  });

  it("should accept a lowercase bearer scheme", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user._id);

    const { next } = await runRequireAuth(`bearer ${token}`);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject a request with no Authorization header", async () => {
    expectUnauthorised(await runRequireAuth());
  });

  it("should reject a non-bearer Authorization header", async () => {
    expectUnauthorised(await runRequireAuth("Basic dXNlcjpwYXNz"));
  });

  it("should reject a bearer header with no token", async () => {
    expectUnauthorised(await runRequireAuth("Bearer "));
  });

  it("should reject an unknown token", async () => {
    expectUnauthorised(await runRequireAuth(`Bearer ${uniqueId()}`));
  });

  it("should reject an expired session", async () => {
    const user = await createTestUser();
    const token = uniqueId();
    await Session.create({
      userId: user._id,
      tokenHash: await sha256(token),
      expiresAt: new Date(Date.now() - 1000),
    });

    expectUnauthorised(await runRequireAuth(`Bearer ${token}`));
  });

  it("should reject a session whose user no longer exists", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user._id);
    await User.deleteOne({ _id: user._id });

    expectUnauthorised(await runRequireAuth(`Bearer ${token}`));
  });
});

describe("optionalAuth", () => {
  it("user should exist in locals", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user._id);

    const { res, next } = await runOptionalAuth(`Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.locals.user).toBeDefined();
    const authed = res.locals.user as InstanceType<typeof User>;
    expect(authed._id).toEqual(user._id);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should accept an invalid token", async () => {
    const { res, next } = await runOptionalAuth("Bearer invalid_token");
    expect(res.statusCode).toBe(200);
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allow no token", async () => {
    const { res, next } = await runOptionalAuth();
    expect(res.statusCode).toBe(200);
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
