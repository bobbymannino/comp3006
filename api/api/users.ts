import type { Response, Request } from "express";
import { hash, verify } from "@node-rs/bcrypt";
import * as v from "valibot";
import { createSession, type AuthResponse } from "../auth.ts";
import { isDuplicateKeyError, likes, posts, sessions, users } from "../db.ts";
import { UserSchema } from "../schemas.ts";

/** The bcrypt cost to hash passwords with, matching the seeded users */
const BCRYPT_COST = 10;

/**
 * Compared against when a username does not exist, so the response takes as long.
 *
 * This is a security feature I learned from my placement last year.
 */
const DUMMY_HASH = await hash("dummy-password", { cost: BCRYPT_COST });

const SignupBodySchema = v.strictObject({
  username: UserSchema.entries.username,
  email: UserSchema.entries.email,
  password: v.pipe(v.string(), v.minLength(1)),
  displayName: UserSchema.entries.displayName,
});

const LoginBodySchema = v.strictObject({
  username: v.string(),
  password: v.string(),
});

export async function handleCreateUser(req: Request, res: Response) {
  const body = v.safeParse(SignupBodySchema, req.body);
  if (!body.success) {
    res.status(400).json({ status: 400, error: v.summarize(body.issues) });
    return;
  }

  const { password, ...details } = body.output;
  try {
    const user = await users.create({
      ...details,
      passwordHash: await hash(password, { cost: BCRYPT_COST }),
    });
    const session = await createSession(user._id);
    res.status(201).json({ _id: user._id, ...session });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    res.status(409).json({
      status: 409,
      error: "That username or email is already taken.",
    });
  }
}

export async function handleLoginUser(req: Request, res: Response) {
  const body = v.safeParse(LoginBodySchema, req.body);
  if (!body.success) {
    res.status(400).json({ status: 400, error: v.summarize(body.issues) });
    return;
  }

  const { username, password } = body.output;
  const user = await users.findOne({ username });
  const valid = await verify(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    res.status(401).json({
      status: 401,
      error: "The username or password is incorrect.",
    });
    return;
  }

  const session = await createSession(user._id);
  res.status(201).json(session);
}

export async function handleUpdateUser(req: Request<{ id: string }>, res: AuthResponse) {}

export async function handleDeleteUser(req: Request<{ id: string }>, res: AuthResponse) {
  // User ID from the URL
  const id = req.params.id.toLowerCase();
  // User ID from the bearer token
  const self = res.locals.user;

  if (id !== self._id.toString()) {
    res.status(403).json({ status: 403, error: "You can only delete your own account." });
    return;
  }

  // There is no transaction on a standalone MongoDB, so the user is deleted
  // last: if a step fails the account still exists and deleting can be retried
  await sessions.deleteMany({ userId: self._id });

  const given = await likes.find({ userId: self._id }, "postId");
  await posts.updateMany(
    { _id: { $in: given.map((like) => like.postId) } },
    { $inc: { likeCount: -1 } },
  );
  await likes.deleteMany({ userId: self._id });

  const authored = await posts.find({ authorId: self._id }, "_id");
  await likes.deleteMany({ postId: { $in: authored.map((post) => post._id) } });
  await posts.deleteMany({ authorId: self._id });

  await users.deleteOne({ _id: self._id });
  res.status(204).end();
}
