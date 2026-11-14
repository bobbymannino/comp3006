import { it, describe, beforeAll, afterAll, expect } from "@jest/globals";
import { disconnect } from "mongoose";

import { createSession } from "./auth.ts";
import { Session, User } from "./models.ts";
import { connectTestDb, uniqueId } from "./test-utils.ts";

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({ _id: { $in: created.users } }),
    Session.deleteMany({ _id: { $in: created.sessions } }),
  ]);
  await disconnect();
});

const created = {
  users: [] as string[],
  sessions: [] as string[],
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
