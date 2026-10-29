import { config } from "dotenv";

/** Load environment variables */
export function loadEnv() {
  config({ path: "../.env" });
  return process.env;
}

/** The MongoDB connection string */
export function mongoUrl(env = loadEnv()) {
  return `mongodb://${env.MONGO_USER}:${env.MONGO_PASS}@${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DB}?authSource=admin`;
}
