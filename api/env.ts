import { config } from "dotenv";

/** Load environment variables */
export function load_env() {
  config({ path: "../.env" });
  return process.env;
}
