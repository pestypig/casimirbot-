import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type Primitive = string | number | boolean | null;

type WarpVisualPanelCapture = {
  panelId: string;
  selector: string;
  baselinePath: string | null;
  targetPath: string | null;
  baselineHash: string;
  targetHash: string;
  baselineBytes: number;
  targetBytes: number;
  renderMsBaseline: number;
  renderMsTarget: number;
  diff: {
    meanAbsNormalized: number;
    changedPixelRatio: number;
    changedPixels: number;
    totalPixels: number;
  };
  visualResponse: "responding" | "flat";
  panelDebugBaseline: Record<string, unknown>;
  panelDebugTarget: Record<string, unknown>;
};

type WarpVisualPanelError = {
  panelId: string;
  stage: "baseline" | "target";
  message: string;
};

export type WarpVisualOrchestratorInput = {
  baseUrl: string;
  solveInput?: Record<string, unknown> | null;
  panels?: string[];
  timeoutMs?: number;
  viewport?: {
    width?: number;
    height?: number;
  };
  pixelRatio?: number;
  outDir?: string;
  writeArtifacts?: boolean;
  visualThreshold?: number;
  continueOnPanelError?: boolean;
};

export type WarpVisualOrchestratorResult = {
  ok: boolean;
  runId: string;
  baseUrl: string;
  outputDir: string | null;
  writeArtifacts: boolean;
  requestedPanelCount: number;
  panelCount: number;
  captures: WarpVisualPanelCapture[];
  panelErrors: WarpVisualPanelError[];
  solveCongruence: {
    source: "requested_payload" | "none";
    checked: number;
    matched: number;
    mismatched: number;
    missing: number;
    matchRatio: number | null;
    mismatches: Array<{
      path: string;
      expected: Primitive;
      actual: Primitive | "missing";
      status: "mismatch" | "missing";
    }>;
  };
  debug: {
    pipelineStateSampleBefore: Record<string, Primitive>;
    pipelineStateSampleAfter: Record<string, Primitive>;
    restored: boolean;
    restoreError?: string;
  };
  artifacts: {
    reportJson: string | null;
  };
  generatedAt: string;
};

const VISUAL_ORCHESTRATOR_ROOT = path.resolve(
  "artifacts",
  "research",
  "full-solve",
  "visual-orchestrator",
);
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };
const DEFAULT_PIXEL_RATIO = 1;
const DEFAULT_VISUAL_THRESHOLD = 0.002;
const DEFAULT_PANELS = [
  "alcubierre-viewer",
  "time-dilation-lattice",
  "shell-outline",
  "drive-guards",
  "speed-capability",
];

const loadPlaywright = async () => {
  try {
    return await import("@playwright/test");
  } catch (err) {
    const error = new Error("playwright_unavailable");
    (error as Error & { cause?: unknown }).cause = err;
    throw error;
  }
};

const toPortablePath = (value: string): string => value.split(path.sep).join("/");

const toRunId = (): string => {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `warp-visual-${iso}`;
};

const sanitizeId = (value: string): string => value.replace(/[^a-z0-9_-]+/gi, "_");

const sha256Hex = (buffer: Buffer): string =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const resolveOutputDir = (runId: string, outDir?: string): string => {
  if (!outDir || outDir.trim().length === 0) {
    return path.join(VISUAL_ORCHESTRATOR_ROOT, runId);
  }
  const resolved = path.resolve(outDir);
  const rel = path.relative(VISUAL_ORCHESTRATOR_ROOT, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("invalid_out_dir");
  }
  return resolved;
};

const jsonFetch = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}:${(payload as any)?.error ?? "unknown"}`);
  }
  return payload as T;
};

const getValueAtPath = (root: unknown, dottedPath: string): unknown => {
  if (!dottedPath) return root;
  const tokens = dottedPath.split(".");
  let cursor: unknown = root;
  for (const token of tokens) {
    if (!isObjectRecord(cursor) || !(token in cursor)) {
      return undefined;
    }
    cursor = cursor[token];
  }
  return cursor;
};

const flattenPrimitivePaths = (
  input: Record<string, unknown>,
  prefix = "",
  acc: Array<{ path: string; value: Primitive }> = [],
): Array<{ path: string; value: Primitive }> => {
  for (const [key, value] of Object.entries(input)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (
      value == null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      acc.push({ path: pathKey, value: value as Primitive });
      continue;
    }
    if (isObjectRecord(value)) {
      flattenPrimitivePaths(value, pathKey, acc);
    }
  }
  return acc;
};

const valuesMatch = (expected: Primitive, actual: unknown): boolean => {
  if (
    typeof expected === "number" &&
    typeof actual === "number" &&
    Number.isFinite(expected) &&
    Number.isFinite(actual)
  ) {
    const absDiff = Math.abs(expected - actual);
    const scale = Math.max(1, Math.abs(expected), Math.abs(actual));
    return absDiff <= 1e-9 * scale;
  }
  return actual === expected;
};

const buildRestorePatch = (
  template: unknown,
  baseline: unknown,
): Record<string, unknown> | undefined => {
  if (!isObjectRecord(template) || !isObjectRecord(baseline)) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(template)) {
    if (!(key in baseline)) continue;
    const baselineValue = (baseline as Record<string, unknown>)[key];
    if (isObjectRecord(value)) {
      const nested = buildRestorePatch(value, baselineValue);
      if (nested && Object.keys(nested).length > 0) {
        out[key] = nested;
      }
      continue;
    }
    out[key] = baselineValue;
  }
  return out;
};

const samplePipelineByTemplate = (
  template: Record<string, unknown> | null | undefined,
  pipeline: unknown,
): Record<string, Primitive> => {
  if (!template) return {};
  const flattened = flattenPrimitivePaths(template);
  const sample: Record<string, Primitive> = {};
  for (const entry of flattened) {
    const actual = getValueAtPath(pipeline, entry.path);
    if (
      actual == null ||
      typeof actual === "string" ||
      typeof actual === "number" ||
      typeof actual === "boolean"
    ) {
      sample[entry.path] = actual as Primitive;
    }
  }
  return sample;
};

const computeCongruence = (
  solveInput: Record<string, unknown> | null | undefined,
  pipelineAfter: unknown,
) => {
  if (!solveInput) {
    return {
      source: "none" as const,
      checked: 0,
      matched: 0,
      mismatched: 0,
      missing: 0,
      matchRatio: null,
      mismatches: [] as Array<{
        path: string;
        expected: Primitive;
        actual: Primitive | "missing";
        status: "mismatch" | "missing";
      }>,
    };
  }
  const flattened = flattenPrimitivePaths(solveInput);
  let matched = 0;
  let mismatched = 0;
  let missing = 0;
  const mismatches: Array<{
    path: string;
    expected: Primitive;
    actual: Primitive | "missing";
    status: "mismatch" | "missing";
  }> = [];

  for (const entry of flattened) {
    const actual = getValueAtPath(pipelineAfter, entry.path);
    if (actual === undefined) {
      missing += 1;
      mismatches.push({
        path: entry.path,
        expected: entry.value,
        actual: "missing",
        status: "missing",
      });
      continue;
    }
    if (valuesMatch(entry.value, actual)) {
      matched += 1;
      continue;
    }
    mismatched += 1;
    mismatches.push({
      path: entry.path,
      expected: entry.value,
      actual:
        actual == null ||
        typeof actual === "string" ||
        typeof actual === "number" ||
        typeof actual === "boolean"
          ? (actual as Primitive)
          : JSON.stringify(actual) as unknown as Primitive,
      status: "mismatch",
    });
  }

  const checked = flattened.length;
  const matchRatio = checked > 0 ? matched / checked : null;
  return {
    source: "requested_payload" as const,
    checked,
    matched,
    mismatched,
    missing,
    matchRatio,
    mismatches: mismatches.slice(0, 50),
  };
};

const computeImageDiff = async (baseline: Buffer, target: Buffer) => {
  const baselineRaw = await sharp(baseline)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const targetRaw = await sharp(target)
    .ensureAlpha()
    .resize(baselineRaw.info.width, baselineRaw.info.height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const b = baselineRaw.data;
  const t = targetRaw.data;
  const pixelCount = baselineRaw.info.width * baselineRaw.info.height;
  let changedPixels = 0;
  let accumulated = 0;

  for (let i = 0; i < b.length; i += 4) {
    const dr = Math.abs(b[i] - t[i]);
    const dg = Math.abs(b[i + 1] - t[i + 1]);
    const db = Math.abs(b[i + 2] - t[i + 2]);
    const da = Math.abs(b[i + 3] - t[i + 3]);
    const perPixelMean = (dr + dg + db + da) / 4;
    accumulated += dr + dg + db + da;
    if (perPixelMean >= 12) {
      changedPixels += 1;
    }
  }

  return {
    meanAbsNormalized: accumulated / (b.length * 255),
    changedPixelRatio: pixelCount > 0 ? changedPixels / pixelCount : 0,
    changedPixels,
    totalPixels: pixelCount,
  };
};

const pickPanelDebug = async (page: any, panelId: string): Promise<Record<string, unknown>> =>
  page.evaluate((id: string) => {
    const win = window as any;
    const panelRoot = document.querySelector(`[data-window-id="${id}"]`) as HTMLElement | null;
    const grid = win.__spacetimeGridDbg;
    const lattice = win.__hullLatticeVolume;
    return {
      panelFound: Boolean(panelRoot),
      panelRect:
        panelRoot != null
          ? {
              width: Math.round(panelRoot.getBoundingClientRect().width),
              height: Math.round(panelRoot.getBoundingClientRect().height),
            }
          : null,
      canvasCount: panelRoot ? panelRoot.querySelectorAll("canvas").length : 0,
      hasSpacetimeGridDebug: Boolean(grid),
      spacetimeGridMode:
        grid && typeof grid.mode === "string"
          ? grid.mode
          : grid && typeof grid.postMode === "string"
            ? grid.postMode
            : null,
      spacetimeGridDegradedReasons: Array.isArray(grid?.degradedReasons)
        ? grid.degradedReasons
        : Array.isArray(grid?.degraded?.reasons)
          ? grid.degraded.reasons
          : [],
      hasHullLatticeVolume: Boolean(lattice),
      hullLatticeSource:
        lattice && typeof lattice.meta?.source === "string" ? lattice.meta.source : null,
      hullLatticeHashes:
        lattice && lattice.hashes
          ? {
              sdf: typeof lattice.hashes.sdf === "string" ? lattice.hashes.sdf : null,
              volume: typeof lattice.hashes.volume === "string" ? lattice.hashes.volume : null,
            }
          : null,
    };
  }, panelId);

const capturePanel = async (args: {
  browser: any;
  baseUrl: string;
  panelId: string;
  timeoutMs: number;
  viewport: { width: number; height: number };
  pixelRatio: number;
}): Promise<{ buffer: Buffer; renderMs: number; panelDebug: Record<string, unknown> }> => {
  const started = Date.now();
  const context = await args.browser.newContext({
    viewport: args.viewport,
    deviceScaleFactor: args.pixelRatio,
  });
  const page = await context.newPage();
  try {
    await page.goto(new URL("/desktop", args.baseUrl).toString(), {
      waitUntil: "networkidle",
      timeout: args.timeoutMs,
    });
    await page.addStyleTag({
      content: `
        * {
          transition-duration: 0s !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          scroll-behavior: auto !important;
        }
      `,
    });
    await page.waitForTimeout(250);
    await page.evaluate((panelId: string) => {
      window.dispatchEvent(
        new CustomEvent("open-helix-panel", {
          detail: { id: panelId },
        }),
      );
    }, args.panelId);
    const selector = `[data-window-id="${args.panelId}"]`;
    await page.waitForSelector(selector, {
      state: "visible",
      timeout: args.timeoutMs,
    });
    const panelLocator = page.locator(selector).first();
    await page.waitForTimeout(1200);
    const panelDebug = await pickPanelDebug(page, args.panelId);
    let screenshot: Buffer;
    try {
      screenshot = (await panelLocator.screenshot({
        type: "png",
        animations: "disabled",
        timeout: Math.min(args.timeoutMs, 20_000),
      })) as Buffer;
      panelDebug.captureMode = "locator";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const likelyStabilityTimeout =
        message.includes("waiting for element to be stable") ||
        message.includes("Timeout");
      if (!likelyStabilityTimeout) {
        throw err;
      }
      const handle = await panelLocator.elementHandle();
      const box = handle ? await handle.boundingBox() : null;
      if (!box || box.width <= 0 || box.height <= 0) {
        throw err;
      }
      screenshot = (await page.screenshot({
        type: "png",
        animations: "disabled",
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.max(1, box.width),
          height: Math.max(1, box.height),
        },
      })) as Buffer;
      panelDebug.captureMode = "clip-fallback";
      panelDebug.captureFallbackReason = "element_unstable";
    }
    const renderMs = Date.now() - started;
    return { buffer: screenshot, renderMs, panelDebug };
  } finally {
    await context.close();
  }
};

const uniquePanels = (panels?: string[]): string[] => {
  const source = panels && panels.length > 0 ? panels : DEFAULT_PANELS;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of source) {
    if (typeof raw !== "string") continue;
    const panelId = raw.trim();
    if (!panelId || seen.has(panelId)) continue;
    seen.add(panelId);
    out.push(panelId);
  }
  return out;
};

export async function runWarpVisualOrchestrator(
  input: WarpVisualOrchestratorInput,
): Promise<WarpVisualOrchestratorResult> {
  const runId = toRunId();
  const writeArtifacts = input.writeArtifacts !== false;
  const outDir = writeArtifacts ? resolveOutputDir(runId, input.outDir) : null;
  const panels = uniquePanels(input.panels);
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const viewport = {
    width: input.viewport?.width ?? DEFAULT_VIEWPORT.width,
    height: input.viewport?.height ?? DEFAULT_VIEWPORT.height,
  };
  const pixelRatio = input.pixelRatio ?? DEFAULT_PIXEL_RATIO;
  const visualThreshold = input.visualThreshold ?? DEFAULT_VISUAL_THRESHOLD;
  const continueOnPanelError = input.continueOnPanelError === true;
  const solveInput = isObjectRecord(input.solveInput) ? input.solveInput : null;

  if (outDir) {
    await ensureDir(outDir);
  }

  const pipelineBefore = await jsonFetch<Record<string, unknown>>(
    new URL("/api/helix/pipeline", input.baseUrl).toString(),
  );
  const restorePatch = solveInput ? buildRestorePatch(solveInput, pipelineBefore) : undefined;

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });

  let restored = false;
  let restoreError: string | undefined;
  let result: WarpVisualOrchestratorResult | null = null;
  try {
    const panelErrors: WarpVisualPanelError[] = [];
    const baselineCaptures = new Map<
      string,
      { buffer: Buffer; renderMs: number; panelDebug: Record<string, unknown> }
    >();
    for (const panelId of panels) {
      try {
        const capture = await capturePanel({
          browser,
          baseUrl: input.baseUrl,
          panelId,
          timeoutMs,
          viewport,
          pixelRatio,
        });
        baselineCaptures.set(panelId, capture);
      } catch (err) {
        if (!continueOnPanelError) {
          throw err;
        }
        panelErrors.push({
          panelId,
          stage: "baseline",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (solveInput) {
      await jsonFetch(
        new URL("/api/helix/pipeline/update", input.baseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(solveInput),
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const pipelineAfter = await jsonFetch<Record<string, unknown>>(
      new URL("/api/helix/pipeline", input.baseUrl).toString(),
    );
    const solveCongruence = computeCongruence(solveInput, pipelineAfter);

    const captures: WarpVisualPanelCapture[] = [];
    for (const panelId of panels) {
      const baseline = baselineCaptures.get(panelId);
      if (!baseline) continue;
      let target: { buffer: Buffer; renderMs: number; panelDebug: Record<string, unknown> };
      try {
        target = await capturePanel({
          browser,
          baseUrl: input.baseUrl,
          panelId,
          timeoutMs,
          viewport,
          pixelRatio,
        });
      } catch (err) {
        if (!continueOnPanelError) {
          throw err;
        }
        panelErrors.push({
          panelId,
          stage: "target",
          message: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
      const diff = await computeImageDiff(baseline.buffer, target.buffer);
      const baselineHash = sha256Hex(baseline.buffer);
      const targetHash = sha256Hex(target.buffer);
      const visualResponse =
        diff.changedPixelRatio >= visualThreshold || diff.meanAbsNormalized >= visualThreshold
          ? "responding"
          : "flat";

      let baselinePath: string | null = null;
      let targetPath: string | null = null;
      if (outDir) {
        const baseName = `${sanitizeId(panelId)}`;
        const baselineAbsolute = path.join(outDir, `${baseName}.baseline.png`);
        const targetAbsolute = path.join(outDir, `${baseName}.target.png`);
        await fs.writeFile(baselineAbsolute, baseline.buffer);
        await fs.writeFile(targetAbsolute, target.buffer);
        baselinePath = toPortablePath(path.relative(process.cwd(), baselineAbsolute));
        targetPath = toPortablePath(path.relative(process.cwd(), targetAbsolute));
      }

      captures.push({
        panelId,
        selector: `[data-window-id="${panelId}"]`,
        baselinePath,
        targetPath,
        baselineHash,
        targetHash,
        baselineBytes: baseline.buffer.byteLength,
        targetBytes: target.buffer.byteLength,
        renderMsBaseline: baseline.renderMs,
        renderMsTarget: target.renderMs,
        diff,
        visualResponse,
        panelDebugBaseline: baseline.panelDebug,
        panelDebugTarget: target.panelDebug,
      });
    }

    result = {
      ok: true,
      runId,
      baseUrl: input.baseUrl,
      outputDir: outDir ? toPortablePath(path.relative(process.cwd(), outDir)) : null,
      writeArtifacts,
      requestedPanelCount: panels.length,
      panelCount: captures.length,
      captures,
      panelErrors,
      solveCongruence,
      debug: {
        pipelineStateSampleBefore: samplePipelineByTemplate(solveInput, pipelineBefore),
        pipelineStateSampleAfter: samplePipelineByTemplate(solveInput, pipelineAfter),
        restored: false,
      },
      artifacts: {
        reportJson: null,
      },
      generatedAt: new Date().toISOString(),
    };

    if (outDir) {
      const reportPath = path.join(outDir, "visual-orchestrator-report.json");
      await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
      result.artifacts.reportJson = toPortablePath(path.relative(process.cwd(), reportPath));
    }
  } finally {
    if (
      solveInput &&
      restorePatch &&
      isObjectRecord(restorePatch) &&
      Object.keys(restorePatch).length > 0
    ) {
      try {
        await jsonFetch(new URL("/api/helix/pipeline/update", input.baseUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restorePatch),
        });
        restored = true;
      } catch (err) {
        restoreError = err instanceof Error ? err.message : String(err);
      }
    } else {
      restored = true;
    }
    await browser.close();
    if (result) {
      result.debug.restored = restored;
      if (restoreError) {
        result.debug.restoreError = restoreError;
      }
    }
    if (outDir) {
      const statusPath = path.join(outDir, "visual-orchestrator-restore-status.json");
      await fs.writeFile(
        statusPath,
        JSON.stringify(
          {
            runId,
            restored,
            restoreError: restoreError ?? null,
            generatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
      if (result) {
        const reportPath = path.join(outDir, "visual-orchestrator-report.json");
        await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
      }
    }
  }
  if (!result) {
    throw new Error("orchestrator_no_result");
  }
  return result;
}
