import { expect, test } from "@playwright/test";

test("signup form shows errors for empty fields", async ({ page }) => {
  await page.goto("/signup");

  await page.locator("#signup-button").click();

  await expect(page.locator("#displayName-error")).toHaveText("Enter a display name.");
  await expect(page.locator("#username-error")).toHaveText(
    "Use 3 to 32 lowercase letters, numbers or underscores.",
  );
  await expect(page.locator("#email-error")).toHaveText("Enter a valid email address.");
  await expect(page.locator("#password-error")).toHaveText("Enter a password.");
  // The first invalid field is focused so it can be fixed straight away
  await expect(page.locator("#displayName")).toBeFocused();
  await expect(page).toHaveURL("/signup");
});

test("signup with invalid username and email", async ({ page }) => {
  await page.goto("/signup");

  await page.locator("#displayName").fill("Test User");
  await page.locator("#username").fill("Not Valid!");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#password").fill("password123");
  await page.locator("#signup-button").click();

  await expect(page.locator("#username-error")).toHaveText(
    "Use 3 to 32 lowercase letters, numbers or underscores.",
  );
  await expect(page.locator("#email-error")).toHaveText("Enter a valid email address.");
  await expect(page.locator("#displayName-error")).toBeHidden();
  await expect(page.locator("#username")).toBeFocused();
  await expect(page).toHaveURL("/signup");
});
