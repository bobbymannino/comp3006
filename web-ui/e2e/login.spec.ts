import { expect, test } from "@playwright/test";

test("login form shows errors for empty fields", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Enter your username.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  // The first invalid field is focused so it can be fixed straight away
  await expect(page.getByLabel("Username")).toBeFocused();
  await expect(page).toHaveURL("/login");
});
