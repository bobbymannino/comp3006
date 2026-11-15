import { expect, test } from "@playwright/test";
import { loginWithTestUser } from "./test-utils";

test("login with test user, create post", async ({ page, context }) => {
  await loginWithTestUser({ page, context });

  await page.goto("/posts/new");
  await expect(page).toHaveURL("/posts/new");

  const title = `E2E post ${Date.now()}`;
  await page.locator("#title").fill(title);
  await page.locator("#content").fill("Written by the new post e2e test.");
  await page.locator("#create-post-button").click();

  await expect(page).toHaveURL(/\/posts\/(?!new$)[^/]+$/);
  await expect(page.getByText(title).first()).toBeVisible();
});
