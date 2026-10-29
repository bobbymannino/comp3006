import { NextResponse } from "next/server";
import type { ProxyConfig, NextProxy } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/** Send logged in users away from the login and signup pages */
export const proxy: NextProxy = (request) => {
  if (request.cookies.has(TOKEN_COOKIE)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
};

export const config = {
  matcher: ["/login", "/signup"],
} satisfies ProxyConfig;
