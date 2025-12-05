const { chromium } = require('playwright');
const fixtures = require('./client/__fixtures__/qi-guard.json');
const makePayload = (key) => {
  const guardrail = fixtures[key].qiGuardrail;
  const SPEED_OF_LIGHT_MPS = 299792458;
  const MOCK_NEEDLE_PATH_M = 1007;
  const MOCK_TAU_LC_MS = (MOCK_NEEDLE_PATH_M / SPEED_OF_LIGHT_MPS) * 1e3;
  const now = Date.now();
  return {
    currentMode: 'hover',
    dutyEffectiveFR: typeof guardrail.duty === 'number' ? guardrail.duty : 0.0025,
    gammaGeo: 26,
    qSpoilingFactor: 1,
    gammaVanDenBroeck: 134_852.5967,
    lightCrossing: { tauLC_ms: MOCK_TAU_LC_MS, burst_ms: 10, dwell_ms: 1000 },
    hull: { a: 503.5, b: 132, c: 86.5 },
    updatedAt: now,
    qiGuardrail: guardrail,
    zetaRaw: guardrail.marginRatioRaw,
    zeta: guardrail.marginRatio,
    mock: true,
    __mockSource: 'playwright-script',
  };
};
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/helix/pipeline') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makePayload('green')) });
      return;
    }
    await route.continue();
  });
  await page.goto('http://localhost:5173/helix-core#drive-guards', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const count = await page.locator("[data-testid='qi-guard-badge']").count();
  console.log('badge count', count);
  await browser.close();
})();
