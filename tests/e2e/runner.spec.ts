import { expect, test } from "@playwright/test";

test("starts Chromium and renders a page", async ({ page }) => {
  await page.setContent("<main><h1>Playwright is ready</h1></main>");

  await expect(page.getByRole("heading", { name: "Playwright is ready" })).toBeVisible();
});
