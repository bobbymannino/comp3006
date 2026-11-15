import { expect, test } from "@playwright/test";
import { loginWithTestUser, TEST_USER } from "./test-utils";

test("login form shows errors for empty fields", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#login-button").click();

  await expect(page.locator("#username-error")).toHaveText("Enter your username.");
  await expect(page.locator("#password-error")).toHaveText("Enter your password.");
  // The first invalid field is focused so it can be fixed straight away
  await expect(page.locator("#username")).toBeFocused();
  await expect(page).toHaveURL("/login");
});

test("login with invalid credentials", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#username").fill(TEST_USER.username);
  await page.locator("#password").fill("invalid password");
  await page.locator("#login-button").click();

  await expect(page.getByText("The username or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL("/login");
});

test("login with valid credentials", async ({ page }) => {
  await loginWithTestUser(page);
  await expect(page).not.toHaveURL("/login");
});
