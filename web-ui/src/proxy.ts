import { NextResponse } from "next/server";
import type { ProxyConfig, NextProxy } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/** Pages only for logged out users */
const ANON_ONLY = ["/login", "/signup"];

/** Pages only for logged in users, as patterns since some have a post's ID in them */
const LOGGED_IN_ONLY = [/^\/posts\/new$/, /^\/posts\/[^/]+\/edit$/, /^\/account(\/edit)?$/];

/**
 * Send logged in users away from the login and sign up pages, and logged out
 * users to log in from pages that need an account
 */
export const proxy: NextProxy = (request) => {
  // Don't actually test the auth, just pretend. This is good enough for this
  // project.
  const loggedIn = request.cookies.has(TOKEN_COOKIE);
  const anonOnly = ANON_ONLY.includes(request.nextUrl.pathname);
  const loggedInOnly = LOGGED_IN_ONLY.some((page) => page.test(request.nextUrl.pathname));

  if (loggedIn && anonOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!loggedIn && loggedInOnly) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
};

export const config = {
  matcher: ["/login", "/signup", "/posts/new", "/posts/:id/edit", "/account", "/account/edit"],
} satisfies ProxyConfig;
