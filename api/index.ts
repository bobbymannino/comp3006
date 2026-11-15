import { createApiServer } from "./api.ts";
import { loadEnv } from "./env.ts";
import * as v from "valibot";
import { logger } from "./log.ts";

const log = logger("index");

const env = loadEnv();
const port_str = env.API_PORT ?? "3000";
try {
  const port = v.parse(v.pipe(v.string(), v.toNumber()), port_str);
  createApiServer(port);
} catch (error) {
  log.error("Failed to create server", error);
}
