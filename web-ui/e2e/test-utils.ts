import type { Page, BrowserContext } from "@playwright/test";

export const TEST_USER = {
  username: "bob",
  password: "password123",
  displayName: "Bob Mannino",
};

export async function loginWithTestUser({
  page,
  context,
}: {
  page: Page;
  context: BrowserContext;
}) {
  await page.goto("/login");
  await page.locator("#username").fill(TEST_USER.username);
  await page.locator("#password").fill(TEST_USER.password);
  await page.locator("#login-button").click();
  await page.waitForURL("/");
  const cookies = await context.cookies();
  const token = cookies.find((c) => c.name === "token");
  if (!token) throw new Error("No token found");
  return token;
}
