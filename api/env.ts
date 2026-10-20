import { config } from "dotenv";

/** Load environment variables */
export function loadEnv() {
  config({ path: "../.env" });
  return process.env;
}
