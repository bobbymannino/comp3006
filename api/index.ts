import { createApiServer } from "./api.ts";
import { loadEnv } from "./env.ts";

const env = loadEnv();
createApiServer(env.PORT);
