import { expect, test } from "@playwright/test";

test.describe("controlled dark mode", () => {
  test("toggles with readable labels and persists across reload", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Switch to dark mode" }).first();
    await expect(toggle).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Switch to light mode" }).first()).toBeVisible();
    await expect.poll(async () => page.locator("body").evaluate(element => getComputedStyle(element).backgroundImage)).toContain("linear-gradient");

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Switch to light mode" }).first()).toBeVisible();
  });
});
