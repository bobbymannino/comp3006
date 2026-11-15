import type { Request, Response } from "express";

import { db } from "../db.ts";

/** 200 while the API can reach MongoDB, otherwise 503 */
export async function handleGetHealth(_req: Request, res: Response) {
  try {
    await db.connection.db?.admin().ping();
    if (db.connection.readyState !== 1) throw new Error("Not connected");
    res.status(200).json({ status: 200, db: "up" });
  } catch {
    res.status(503).json({ status: 503, db: "down" });
  }
}
