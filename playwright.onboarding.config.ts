import { defineConfig } from "@playwright/test";

// No app server, profile, persisted browser session or production credentials.
export default defineConfig({
  testDir: "client/e2e/onboarding-isolated",
  outputDir: ".tmp/onboarding-playwright-results",
  workers: 1,
  timeout: 30_000,
  use: { browserName: "chromium", serviceWorkers: "block", trace: "retain-on-failure" },
});
