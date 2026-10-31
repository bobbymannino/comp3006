import path from "node:path";
import type { NextConfig } from "next";

/** The repo root, so the API's schemas in ../api can be imported */
const root = path.join(import.meta.dirname, "..");

const nextConfig: NextConfig = {
  // Builds a minimal server with only the files it needs, for the Docker image
  output: "standalone",
  // Traced from the repo root to match Turbopack's root below
  outputFileTracingRoot: root,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
