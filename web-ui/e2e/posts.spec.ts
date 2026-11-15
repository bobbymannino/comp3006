import { expect, test, type Page } from "@playwright/test";
import { loginWithTestUser, TEST_USER } from "./test-utils";

/** Create a post as the logged in user, returning its title and URL */
async function createPost(page: Page, { published = true } = {}) {
  const title = `E2E post ${Date.now()}`;
  const content = "Written by the posts e2e test.";

  await page.goto("/posts/new");
  await page.locator("#title").fill(title);
  await page.locator("#content").fill(content);
  if (!published) await page.getByLabel(/Publish now/).uncheck();
  await page.locator("#create-post-button").click();
  await expect(page).toHaveURL(/\/posts\/(?!new$)[^/]+$/);

  return { title, content, url: page.url() };
}

test("author sees their post with edit and delete controls", async ({ page, context }) => {
  await loginWithTestUser({ page, context });
  const { title, content } = await createPost(page);

  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText(content)).toBeVisible();
  await expect(page.getByText(`@${TEST_USER.username} (${TEST_USER.displayName})`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit Post" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Post" })).toBeVisible();
});

test("anon user can view a published post without author controls", async ({
  page,
  context,
  browser,
}) => {
  await loginWithTestUser({ page, context });
  const { title, url } = await createPost(page);

  // A fresh context has no token cookie
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(url);

  await expect(anonPage.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(anonPage.getByRole("link", { name: "Edit Post" })).toHaveCount(0);
  await expect(anonPage.getByRole("button", { name: "Delete Post" })).toHaveCount(0);
  await anonContext.close();
});

test("draft post is only visible to its author", async ({ page, context, browser }) => {
  await loginWithTestUser({ page, context });
  const { title, url } = await createPost(page, { published: false });

  await expect(page.getByText("Draft, only you can see this")).toBeVisible();

  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(url);
  await expect(anonPage.getByRole("heading", { level: 1, name: title })).toHaveCount(0);
  await anonContext.close();
});

test("author can delete their post", async ({ page, context }) => {
  await loginWithTestUser({ page, context });
  const { url } = await createPost(page);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Post" }).click();
  await expect(page).toHaveURL("/account");

  // The page streams, so the status is already 200 by the time the post is
  // found missing. Check for the not found page instead
  await page.goto(url);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("unknown post shows not found", async ({ page }) => {
  await page.goto("/posts/000000000000000000000000");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});
