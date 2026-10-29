import { randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { sessions, users } from "./db.ts";
import { sha256 } from "./sha.ts";

/** A logged in user, without their password hash */
export type AuthUser = NonNullable<Awaited<ReturnType<typeof findSessionUser>>>;

/** A response for a route behind `requireAuth`, with the user on `res.locals` */
export type AuthResponse = Response<unknown, { user: AuthUser }>;

/** A response for a route behind `optionalAuth`, which may have a user */
export type OptionalAuthResponse = Response<unknown, { user?: AuthUser }>;

/** Get the token from an `Authorization: Bearer <token>` header */
function bearerToken(req: Request) {
  const match = req.get("Authorization")?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1];
}

/**
 * Start a new session for a user. Only a hash of the token is stored, so the
 * returned token is the only copy of it
 */
export async function createSession(userId: Types.UUID) {
  const token = randomBytes(32).toString("base64url");
  const session = await sessions.create({ userId, tokenHash: await sha256(token) });
  return { token, expiresAt: session.expiresAt };
}

/** Find the user a session token belongs to, ignoring expired sessions */
async function findSessionUser(token: string) {
  // The TTL index only removes expired sessions periodically, so check here too
  const session = await sessions.findOne({
    tokenHash: await sha256(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return users.findById(session.userId, "-passwordHash");
}

/**
 * Reject the request with 401 unless it has a valid bearer token, otherwise
 * put the logged in user on `res.locals.user`
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  const user = token ? await findSessionUser(token) : null;

  if (!user) {
    res.status(401).json({
      status: 401,
      error: "You must be logged in to do this.",
    });
    return;
  }

  res.locals.user = user;
  next();
}

/**
 * Put the logged in user on `res.locals.user` if the request has a valid
 * bearer token, otherwise carry on without one
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  const user = token ? await findSessionUser(token) : null;

  if (user) res.locals.user = user;
  next();
}
