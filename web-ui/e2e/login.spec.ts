import { expect, test } from "@playwright/test";

const TEST_USER = {
  username: "bob",
  password: "password123",
  displayName: "Bob Mannino",
};

test("login form shows errors for empty fields", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Enter your username.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  // The first invalid field is focused so it can be fixed straight away
  await expect(page.getByLabel("Username")).toBeFocused();
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
  await page.goto("/login");

  await page.locator("#username").fill(TEST_USER.username);
  await page.locator("#password").fill(TEST_USER.password);
  await page.locator("#login-button").click();

  await expect(page).not.toHaveURL("/login");
});
