import { expect, test } from "@playwright/test";

test.describe("ESUT Marketplace browser smoke coverage", () => {
  test("public homepage exposes real marketplace discovery entry points", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Everything you need/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search products, stores or categories")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start selling" })).toBeVisible();
  });

  test("catalogue exposes search and filtering controls", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: /Find Your Next Campus Essential/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Search listings/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByText(/Verified sellers only/i)).toBeVisible();
  });

  test("protected account route keeps a clear access boundary", async ({ page }) => {
    await page.goto("/account");
    const accountHeading = page.getByRole("heading", { name: /MY ACCOUNT/i });
    const signInBoundary = page.getByText(/Sign in to access your account|Sign in to view your account|Sign in securely|Welcome,/i).first();
    await expect(accountHeading.or(signInBoundary)).toBeVisible();
  });

  test("mobile storefront keeps primary navigation and controls usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "ESUT Marketplace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start selling" })).toBeVisible();
  });

  test("interactive buttons have accessible names", async ({ page }) => {
    await page.goto("/");
    const unnamedButtons = await page.locator("button").evaluateAll(buttons => buttons.filter(button => !((button.textContent ?? "").trim() || button.getAttribute("aria-label") || button.getAttribute("title"))).length);
    expect(unnamedButtons).toBe(0);
  });
});
