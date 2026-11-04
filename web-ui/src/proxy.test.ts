import { describe, expect, it } from "@jest/globals";
import { NextRequest, type NextFetchEvent } from "next/server";
import { config, proxy } from "./proxy";
import { TOKEN_COOKIE } from "@/lib/session";

/** Run the proxy for a page, logged in or out */
async function visit(path: string, loggedIn: boolean) {
  const request = new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: loggedIn ? { cookie: `${TOKEN_COOKIE}=tok` } : {},
  });
  return proxy(request, {} as NextFetchEvent);
}

/** Where a response redirects to, if anywhere */
function redirectedTo(response: Response | null | undefined | void) {
  const location = response?.headers.get("location");
  return location ? new URL(location).pathname : undefined;
}

describe("proxy", () => {
  it.each(["/login", "/signup"])("sends logged in users away from %s", async (path) => {
    expect(redirectedTo(await visit(path, true))).toBe("/");
  });

  it.each(["/login", "/signup"])("lets logged out users see %s", async (path) => {
    expect(redirectedTo(await visit(path, false))).toBeUndefined();
  });

  it.each(["/posts/new", "/posts/abc/edit", "/account", "/account/edit"])(
    "sends logged out users from %s to log in",
    async (path) => {
      expect(redirectedTo(await visit(path, false))).toBe("/login");
    },
  );

  it.each(["/posts/new", "/posts/abc/edit", "/account", "/account/edit"])(
    "lets logged in users see %s",
    async (path) => {
      expect(redirectedTo(await visit(path, true))).toBeUndefined();
    },
  );

  it.each(["/", "/posts/abc", "/posts/abc/edit/more", "/accounts"])(
    "leaves %s alone either way",
    async (path) => {
      expect(redirectedTo(await visit(path, false))).toBeUndefined();
      expect(redirectedTo(await visit(path, true))).toBeUndefined();
    },
  );

  it("runs on every page it protects", () => {
    // The proxy only runs on pages in the matcher, so a missing one would be unprotected
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/login", "/signup", "/posts/new", "/account", "/account/edit"]),
    );
    expect(config.matcher).toContain("/posts/:id/edit");
  });
});
