import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loginWithTestUser, TEST_USER } from "./test-utils";

/**
 * Sign up and log in as a brand new user, so tests that change or delete the
 * account leave the shared test user alone
 */
async function signUpNewUser(page: Page) {
  const id = randomUUID().replace(/-/g, "").slice(0, 10);
  const user = {
    displayName: "Profile Test",
    username: `test_${id}`,
    email: `test_${id}@example.com`,
    password: "password123",
  };

  await page.goto("/signup");
  await page.locator("#displayName").fill(user.displayName);
  await page.locator("#username").fill(user.username);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#signup-button").click();
  await expect(page).not.toHaveURL("/signup");

  return user;
}

test("anon user is sent to log in from /account", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL("/login");
});

test("profile shows the logged in user's details and controls", async ({ page, context }) => {
  await loginWithTestUser({ page, context });
  await page.goto("/account");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_USER.displayName);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`@${TEST_USER.username}`);
  await expect(page.getByRole("link", { name: "Edit Account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Account" })).toBeVisible();
});

test("new user's profile has no posts", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.goto("/account");

  await expect(page.getByRole("heading", { level: 3, name: user.email })).toBeVisible();
  await expect(page.getByText("You have no posts yet.")).toBeVisible();
});

test("profile lists the user's posts", async ({ page }) => {
  await signUpNewUser(page);

  const title = `E2E post ${Date.now()}`;
  await page.goto("/posts/new");
  await page.locator("#title").fill(title);
  await page.locator("#content").fill("Written by the account e2e test.");
  await page.locator("#create-post-button").click();
  await expect(page).toHaveURL(/\/posts\/(?!new$)[^/]+$/);

  await page.goto("/account");
  await expect(page.getByRole("heading", { level: 2, name: "Your Posts" })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
});

test("user can log out", async ({ page }) => {
  await signUpNewUser(page);
  await page.goto("/account");

  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).not.toHaveURL("/account");

  // Without a session the profile is no longer reachable
  await page.goto("/account");
  await expect(page).toHaveURL("/login");
});

test("user can delete their account", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.goto("/account");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Account" }).click();
  await expect(page).not.toHaveURL("/account");

  // The deleted account can no longer log in
  await page.goto("/login");
  await page.locator("#username").fill(user.username);
  await page.locator("#password").fill(user.password);
  await page.locator("#login-button").click();
  await expect(page.getByText("The username or password is incorrect.")).toBeVisible();
});
