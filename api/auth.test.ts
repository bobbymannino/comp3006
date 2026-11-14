import { disconnect } from "mongoose";

import { Session, User } from "./models.ts";
import { connectTestDb } from "./test-utils.ts";

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
