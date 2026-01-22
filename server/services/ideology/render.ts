type RenderFormat = "png" | "svg";

type RenderOptions = {
  baseUrl: string;
  pillId: string;
  format: RenderFormat;
  pixelRatio?: number;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20_000;

const loadPlaywright = async () => {
  try {
    return await import("@playwright/test");
  } catch (err) {
    const error = new Error("playwright_unavailable");
    (error as Error & { cause?: unknown }).cause = err;
    throw error;
  }
};

const parseDataUrl = (dataUrl: string): { buffer: Buffer; contentType: string } => {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) {
    throw new Error("invalid_data_url");
  }
  const [, contentType, base64Flag, payload] = match;
  if (base64Flag) {
    return { buffer: Buffer.from(payload, "base64"), contentType };
  }
  return {
    buffer: Buffer.from(decodeURIComponent(payload), "utf8"),
    contentType,
  };
};

export async function renderIdeologyPill(options: RenderOptions): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const { baseUrl, pillId, format, pixelRatio } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  let buffer: Buffer;
  let contentType: string;

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 2000 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const renderUrl = new URL("/ideology-render", baseUrl);
    renderUrl.searchParams.set("pill", pillId);
    await page.goto(renderUrl.toString(), { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForFunction(
      () => (window as any).__ideologyExportReady === true,
      null,
      { timeout: timeoutMs },
    );

    const dataUrl = await page.evaluate(
      async ({ pillId, format, pixelRatio }) => {
        const exporter = (window as any).__ideologyExport;
        if (typeof exporter !== "function") {
          throw new Error("exporter_unavailable");
        }
        return exporter(pillId, format, { pixelRatio });
      },
      { pillId, format, pixelRatio },
    );

    const parsed = parseDataUrl(String(dataUrl));
    buffer = parsed.buffer;
    contentType = parsed.contentType;
    await context.close();
  } finally {
    await browser.close();
  }

  return { buffer, contentType };
}
