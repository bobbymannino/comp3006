import type { NextFunction, Request, Response } from "express";
import { sessions, users } from "./db.ts";
import { sha256 } from "./sha.ts";

/** A logged in user, without their password hash */
export type AuthUser = NonNullable<Awaited<ReturnType<typeof findSessionUser>>>;

/** A response for a route behind `requireAuth`, with the user on `res.locals` */
export type AuthResponse = Response<unknown, { user: AuthUser }>;

/** Get the token from an `Authorization: Bearer <token>` header */
function bearerToken(req: Request) {
  const match = req.get("Authorization")?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1];
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
