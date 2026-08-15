import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE ?? "/usr/bin/chromium" },
    trace: "retain-on-failure",
  },
});
