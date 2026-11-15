import type { Page } from "@playwright/test";

export const TEST_USER = {
  username: "bob",
  password: "password123",
  displayName: "Bob Mannino",
};

export async function loginWithTestUser(page: Page) {
  await page.goto("/login");
  await page.locator("#username").fill(TEST_USER.username);
  await page.locator("#password").fill(TEST_USER.password);
  await page.locator("#login-button").click();
}
