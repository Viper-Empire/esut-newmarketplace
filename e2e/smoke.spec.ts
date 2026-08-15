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

  test("branded login and registration forms remain directly reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Log into your account/i })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
    await expect(page.getByRole("group", { name: "I am registering as" })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
  });

  test("seller, moderator, and administrator routes preserve protected boundaries", async ({ page }) => {
    for (const route of ["/seller", "/moderator", "/admin"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: /Sign in to access|access required|Welcome,/i }).first()).toBeVisible();
    }
  });

  test("guarded transport presents a recovery boundary when the public query returns HTML", async ({ page }) => {
    await page.route("**/api/trpc/**", route => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><html><body>unexpected document</body></html>" }));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /We could not load marketplace collections/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText("Unexpected token");
  });

  test("guarded authentication transport keeps a protected route at its access boundary when HTML is returned", async ({ page }) => {
    await page.route("**/api/trpc/**", route => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><html><body>unexpected document</body></html>" }));
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /Sign in to access your account/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Unexpected token");
  });

  test("cart route preserves a guest-cart access boundary", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Your guest cart/i })).toBeVisible();
    await expect(page.getByText(/Sign in to merge them securely/i)).toBeVisible();
  });

  test("password-recovery route exposes its real availability boundary", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Password reset/i })).toBeVisible();
    await expect(page.getByText(/password-recovery|reset link/i).first()).toBeVisible();
  });

  test("interactive buttons have accessible names", async ({ page }) => {
    await page.goto("/");
    const unnamedButtons = await page.locator("button").evaluateAll(buttons => buttons.filter(button => !((button.textContent ?? "").trim() || button.getAttribute("aria-label") || button.getAttribute("title"))).length);
    expect(unnamedButtons).toBe(0);
  });
});
