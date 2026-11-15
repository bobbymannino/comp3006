import { randomUUID } from "node:crypto";
import { expect, describe, it } from "@jest/globals";
import * as v from "valibot";
import { UserSchema } from "../schemas.ts";
import {
  createPost,
  createPublishedPost,
  createUser,
  deleteUser,
  getLikeCount,
  login,
  request,
  uniqueId,
  useUsers,
} from "../test-utils.ts";

describe("PUT /api/users/:id", () => {
  const users = useUsers("user", "other");

  it("updates the user and never returns the password hash", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { displayName: "Updated Name" },
      as: users.user,
    });

    expect(res.status).toBe(200);
    expect(v.parse(UserSchema, res.body)).toMatchObject({
      _id: users.user._id,
      displayName: "Updated Name",
    });
  });

  it("requires auth", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { displayName: "Hijacked" },
    });

    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { displayName: "Hijacked" },
      as: { token: "not-a-real-token" },
    });

    expect(res.status).toBe(401);
  });

  it("forbids updating another user", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { displayName: "Hijacked" },
      as: users.other,
    });

    expect(res.status).toBe(403);
  });

  it("rejects a username that is taken", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { username: users.other.username },
      as: users.user,
    });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid update", async () => {
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { email: "not-an-email" },
      as: users.user,
    });

    expect(res.status).toBe(400);
  });

  it("logs in with a changed password", async () => {
    const password = `new-password-${uniqueId()}`;
    const res = await request("PUT", `/users/${users.user._id}`, {
      body: { password },
      as: users.user,
    });
    expect(res.status).toBe(200);

    const [withOld, withNew] = await Promise.all([
      login(users.user),
      login({ ...users.user, password }),
    ]);

    expect(withOld.status).toBe(401);
    expect(withNew.status).toBe(201);
  });
});

describe("DELETE /api/users/:id", () => {
  const users = useUsers("other");

  it("deletes the user", async () => {
    const user = await createUser();
    const res = await request("DELETE", `/users/${user._id}`, { as: user });

    expect(res.status).toBe(204);
    const [withToken, withPassword] = await Promise.all([
      request("PUT", `/users/${user._id}`, { body: {}, as: user }),
      login(user),
    ]);
    expect(withToken.status).toBe(401);
    expect(withPassword.status).toBe(401);
  });

  it("deletes the user's posts and the likes on them", async () => {
    const user = await createUser();
    const [published, draft] = await Promise.all([createPublishedPost(user), createPost(user)]);
    await request("POST", `/posts/${published._id}/likes`, { as: users.other });

    await request("DELETE", `/users/${user._id}`, { as: user });

    const [publishedRes, draftRes, likeRes] = await Promise.all([
      request("GET", `/posts/${published._id}`),
      request("GET", `/posts/${draft._id}`),
      request("DELETE", `/posts/${published._id}/likes`, { as: users.other }),
    ]);
    expect(publishedRes.status).toBe(404);
    expect(draftRes.status).toBe(404);
    expect(likeRes.status).toBe(404);
  });

  it("removes the likes the user has given", async () => {
    const user = await createUser();
    const post = await createPublishedPost(users.other);
    await request("POST", `/posts/${post._id}/likes`, { as: user });
    expect(await getLikeCount(users.other, post)).toBe(1);

    await request("DELETE", `/users/${user._id}`, { as: user });

    expect(await getLikeCount(users.other, post)).toBe(0);
  });

  it("requires auth", async () => {
    const res = await request("DELETE", `/users/${users.other._id}`);

    expect(res.status).toBe(401);
  });

  it("forbids deleting another user", async () => {
    const user = await createUser();
    const res = await request("DELETE", `/users/${users.other._id}`, { as: user });
    await deleteUser(user);

    expect(res.status).toBe(403);
  });

  it("responds with 404 for a user that does not exist", async () => {
    const res = await request("DELETE", `/users/${randomUUID()}`, { as: users.other });

    expect(res.status).toBe(403);
  });
});
