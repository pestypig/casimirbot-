import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, "./fixtures");

const loadFixture = (file: string) => JSON.parse(readFileSync(path.join(fixturesDir, file), "utf8"));

const GUARD_FIXTURES = {
  red: loadFixture("qi-guard.red.json"),
  amber: loadFixture("qi-guard.amber.json"),
  green: loadFixture("qi-guard.green.json"),
  fallback: loadFixture("qi-guard.fallback.json"),
  dtDrift: loadFixture("qi-guard.dt-drift.json"),
} as const;

type GuardKey = keyof typeof GUARD_FIXTURES;

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://localhost:5173";

test.use({ baseURL: BASE_URL, serviceWorkers: "block" });

const TARGET_PATH = "/helix-core#drive-guards";
const ZETA = "\u03b6";

async function gotoDriveGuards(page: Page) {
  await page.goto(TARGET_PATH, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-panel-hash="drive-guards"]', { state: "attached", timeout: 15_000 });
  await page.evaluate(() => {
    const panel = document.querySelector('[data-panel-hash="drive-guards"]');
    if (panel) {
      panel.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
    }
    window.location.hash = "#drive-guards";
  });
  await page.waitForTimeout(100);
}

async function mockGuardPipeline(page: Page, payload: (typeof GUARD_FIXTURES)[GuardKey]) {
  await page.route("**/api/helix/pipeline", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...payload, mock: true, __mockSource: "playwright" }),
    });
  });
}

const expectBadgeVisible = async (page: Page) => {
  const badge = page.getByTestId("qi-guard-badge").first();
  await expect(badge).toBeVisible({ timeout: 15_000 });
  return badge;
};

test.describe("QiGuardBadge smoke (mocked pipeline)", () => {
  test("badge shows RED on \u03b6_raw >= 1", async ({ page }) => {
    await mockGuardPipeline(page, GUARD_FIXTURES.red);
    await gotoDriveGuards(page);

    const badge = await expectBadgeVisible(page);
    await expect(badge).toHaveAttribute("data-tone", "red");
    await expect(badge).toContainText("At risk");
    await expect(badge).toContainText(`${ZETA}_raw:2.65`);
    await expect(badge).toContainText(`${ZETA}:1.00`);
    await expect(badge).toHaveAttribute("title", new RegExp(`${ZETA}\\s*[=:]\\s*1\\.00\\s*\\(policy\\/clamped\\)`, "i"));
    await expect(badge).toContainText(/lhs:-47\.71/);
    await expect(badge).toContainText(/bound:-18\.00/);
  });

  test("badge shows AMBER on 0.95 <= \u03b6_raw < 1", async ({ page }) => {
    await mockGuardPipeline(page, GUARD_FIXTURES.amber);
    await gotoDriveGuards(page);

    const badge = await expectBadgeVisible(page);
    await expect(badge).toHaveAttribute("data-tone", "amber");
    await expect(badge).toContainText("Watch");
    await expect(badge).toContainText(`${ZETA}_raw:0.98`);
    await expect(badge).toContainText(`${ZETA}:0.98`);
    await expect(badge).toHaveAttribute("title", new RegExp(`${ZETA}\\s*[=:]\\s*0\\.98\\s*\\(policy\\/clamped\\)`, "i"));
  });

  test("badge shows GREEN on \u03b6_raw < 0.95", async ({ page }) => {
    await mockGuardPipeline(page, GUARD_FIXTURES.green);
    await gotoDriveGuards(page);

    const badge = await expectBadgeVisible(page);
    await expect(badge).toHaveAttribute("data-tone", "green");
    await expect(badge).toContainText("OK");
    await expect(badge).toContainText(`${ZETA}_raw:0.20`);
    await expect(badge).toContainText(`${ZETA}:0.20`);
    await expect(badge).toHaveAttribute("title", new RegExp(`${ZETA}\\s*[=:]\\s*0\\.20\\s*\\(policy\\/clamped\\)`, "i"));
    await expect(badge).toHaveAttribute("title", /source=duty-fallback/);
  });

  test("badge renders duty fallback snapshot with normalized window", async ({ page }) => {
    await mockGuardPipeline(page, GUARD_FIXTURES.fallback);
    await gotoDriveGuards(page);

    const badge = await expectBadgeVisible(page);
    await expect(badge).toHaveAttribute("data-tone", "green");
    await expect(badge).toContainText("OK");
    await expect(badge).toContainText(`${ZETA}_raw:\u2014`);
    await expect(badge).toContainText(`${ZETA}:0.20`);
    await expect(badge).toHaveAttribute("title", new RegExp(`${ZETA}\\s*[=:]\\s*0\\.20\\s*\\(policy\\/clamped\\)`, "i"));
    await expect(badge).toContainText(/window:40\.0 ms/);
    await expect(badge).toContainText(/sampler:gaussian/);
  });

  test("badge surfaces \u03a3dt warning when window normalization drifts", async ({ page }) => {
    await mockGuardPipeline(page, GUARD_FIXTURES.dtDrift);
    await gotoDriveGuards(page);

    const badge = await expectBadgeVisible(page);
    await expect(badge).toContainText("OK");
    await expect(badge).toHaveAttribute("title", new RegExp(`${ZETA}\\s*[=:]\\s*0\\.20\\s*\\(policy\\/clamped\\)`, "i"));
    const warning = badge.getByTestId("qi-guard-badge-dt-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("Window not normalized (\u03a3 g\u00b7dt = 1.070)");
  });
});
