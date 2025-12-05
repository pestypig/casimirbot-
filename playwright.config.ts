import { defineConfig } from "@playwright/test";

const PORT = parseInt(process.env.PORT ?? "5173", 10);
const baseURL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ??
  process.env.BASE_URL ??
  `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "client/e2e",
  timeout: 60_000,
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: `cross-env PORT=${PORT} NODE_ENV=development SKIP_VITE_MIDDLEWARE=0 tsx server/index.ts`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
