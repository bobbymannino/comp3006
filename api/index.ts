import * as v from "valibot";

import { createApiServer } from "./api.ts";
import { connectDb } from "./db.ts";
import { loadEnv } from "./env.ts";
import { logger } from "./log.ts";

const log = logger("index");

/**
 * Connect to MongoDB, then start the API on `API_PORT` (default 3000).
 * Rejects if the database can't be reached, so the process exits non-zero
 */
export async function main(env = loadEnv()) {
  await connectDb();

  const port_str = env.API_PORT ?? "3000";
  try {
    const port = v.parse(v.pipe(v.string(), v.toNumber()), port_str);
    createApiServer(port);
  } catch (error) {
    log.error("Failed to create server", error);
  }
}

void main();
