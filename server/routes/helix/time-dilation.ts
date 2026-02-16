import express, { type Request, type Response } from "express";
import { z } from "zod";
import {
  buildTimeDilationDiagnostics,
  type TimeDilationDiagnosticsOptions,
  DEFAULT_HULL_AXES,
  DEFAULT_HULL_WALL_THICKNESS_M,
} from "@shared/time-dilation-diagnostics";

type DiagnosticsStatus = "pending" | "ready" | "error";
type SeedStatus = "provisional" | "final";

type TimeDilationDiagnosticsStore = {
  status: DiagnosticsStatus;
  updatedAt: number;
  source: string | null;
  renderingSeed: string;
  seedStatus: SeedStatus;
  payload: Record<string, unknown>;
  reason?: string;
};

type TimeDilationControlCommand = {
  id: number;
  issuedAt: number;
  command: string;
  args: Record<string, unknown>;
  source: string | null;
};

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const helixTimeDilationRouter = express.Router();

let latestDiagnostics: TimeDilationDiagnosticsStore | null = null;
let latestControlCommand: TimeDilationControlCommand | null = null;
let controlCommandSeq = 0;

const ActivateSchema = z.object({
  baseUrl: z.string().url().optional(),
  warpFieldType: z.enum(["natario", "natario_sdf", "alcubierre", "irrotational"]).default("natario"),
  grEnabled: z.boolean().default(true),
  strictCongruence: z.boolean().optional(),
  applyCanonicalHull: z.boolean().optional(),
  publishDiagnostics: z.boolean().default(true),
  async: z.boolean().default(true),
  kickGrBrick: z.boolean().default(true),
  quality: z.string().optional(),
  kickQuality: z.string().optional(),
  gridScale: z.number().positive().optional(),
  grTargetDx: z.number().positive().optional(),
  includeExtra: z.boolean().optional(),
  includeMatter: z.boolean().optional(),
  includeKij: z.boolean().optional(),
  wallInvariant: z.enum(["kretschmann", "ricci4"]).optional(),
  timeoutMs: z.number().positive().optional(),
  diagnosticsTimeoutMs: z.number().positive().optional(),
});

const ControlCommandSchema = z.object({
  command: z.string().min(1),
  args: z.record(z.unknown()).optional(),
  source: z.string().optional(),
});

const resolveCanonicalHull = () => ({
  Lx_m: DEFAULT_HULL_AXES[0] * 2,
  Ly_m: DEFAULT_HULL_AXES[1] * 2,
  Lz_m: DEFAULT_HULL_AXES[2] * 2,
  wallThickness_m: DEFAULT_HULL_WALL_THICKNESS_M,
});

const resolveBaseUrl = (req: Request, override?: string) => {
  if (override) return override;
  const host = req.get("host");
  const protocol = req.protocol || "http";
  return host ? `${protocol}://${host}` : "http://127.0.0.1:5173";
};

const resolveCanonicalSummary = (
  input: z.infer<typeof ActivateSchema>,
  pipelineUpdate?: Record<string, unknown> | null,
  diagnostics?: Record<string, unknown> | null,
) => {
  const strictCongruence =
    (typeof pipelineUpdate?.strictCongruence === "boolean"
      ? pipelineUpdate.strictCongruence
      : input.strictCongruence) ?? true;
  const canonical =
    (diagnostics?.canonical as Record<string, unknown> | undefined) ??
    ((pipelineUpdate as any)?.canonical as Record<string, unknown> | undefined) ??
    {};
  return {
    strictCongruence,
    mode: input.warpFieldType,
    family: typeof canonical.family === "string" ? canonical.family : input.warpFieldType,
    chart: typeof canonical.chart === "string" ? canonical.chart : null,
    observer: typeof canonical.observer === "string" ? canonical.observer : null,
    normalization: typeof canonical.normalization === "string" ? canonical.normalization : null,
  };
};

const resolveWarnings = (
  pipelineUpdate?: Record<string, unknown> | null,
  diagnostics?: Record<string, unknown> | null,
) => {
  const warnings: string[] = [];
  const overallStatus = typeof pipelineUpdate?.overallStatus === "string"
    ? pipelineUpdate.overallStatus
    : null;
  if (overallStatus === "CRITICAL") {
    warnings.push("overall_status_critical");
  }
  if (!diagnostics) {
    warnings.push("diagnostics_partial");
  } else {
    const strict = diagnostics.strict as Record<string, unknown> | undefined;
    if (strict?.strictMetricMissing === true || strict?.anyProxy === true) {
      warnings.push("diagnostics_partial");
    }
  }
  return warnings;
};

const postJson = async <T>(url: string, body: unknown, timeoutMs?: number): Promise<T> => {
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? setTimeout(() => controller?.abort(), timeoutMs)
    : null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: controller?.signal,
  });
  if (timeout) clearTimeout(timeout);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
};

const buildDiagnosticsEnvelope = (record: TimeDilationDiagnosticsStore) => ({
  ok: record.status !== "error",
  status: record.status,
  updatedAt: record.updatedAt,
  source: record.source,
  renderingSeed: record.renderingSeed,
  seedStatus: record.seedStatus,
  reason: record.reason ?? null,
  payload: record.payload,
});

helixTimeDilationRouter.options("/diagnostics", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTimeDilationRouter.options("/activate", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTimeDilationRouter.options("/control", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTimeDilationRouter.get("/diagnostics", (req, res) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  if (!latestDiagnostics) {
    res.status(404).json({ ok: false, error: "no_diagnostics" });
    return;
  }

  const raw = typeof req.query.raw === "string" ? req.query.raw === "1" : false;
  if (raw) {
    res.json(buildDiagnosticsEnvelope(latestDiagnostics));
    return;
  }

  res.json(buildDiagnosticsEnvelope(latestDiagnostics));
});

helixTimeDilationRouter.get("/control", (_req, res) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, command: latestControlCommand });
});

helixTimeDilationRouter.post("/control", (req, res) => {
  setCors(res);
  const parsed = ControlCommandSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid-control-command", issues: parsed.error.issues });
    return;
  }
  const issuedAt = Date.now();
  const source =
    typeof parsed.data.source === "string" && parsed.data.source.trim().length > 0
      ? parsed.data.source.trim()
      : null;
  latestControlCommand = {
    id: ++controlCommandSeq,
    issuedAt,
    command: parsed.data.command,
    args: parsed.data.args ?? {},
    source,
  };
  res.json({ ok: true, command: latestControlCommand });
});

helixTimeDilationRouter.delete("/control", (_req, res) => {
  setCors(res);
  latestControlCommand = null;
  res.json({ ok: true });
});

helixTimeDilationRouter.post("/diagnostics", (req, res) => {
  setCors(res);
  const payload =
    req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
  const sourceRaw = payload?.source;
  const source =
    typeof sourceRaw === "string" && sourceRaw.trim().length > 0 ? sourceRaw.trim() : null;
  const updatedAt = Date.now();
  const renderingSeed = typeof payload.renderingSeed === "string" ? payload.renderingSeed : `diag:${updatedAt}`;
  latestDiagnostics = {
    status: "ready",
    updatedAt,
    source,
    payload,
    renderingSeed,
    seedStatus: "final",
  };
  res.json({ ok: true, updatedAt: latestDiagnostics.updatedAt });
});

helixTimeDilationRouter.delete("/diagnostics", (_req, res) => {
  setCors(res);
  latestDiagnostics = null;
  res.json({ ok: true });
});

helixTimeDilationRouter.post("/activate", async (req, res) => {
  setCors(res);
  const parsed = ActivateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid-request", issues: parsed.error.issues });
    return;
  }
  const input = parsed.data;
  const baseUrl = resolveBaseUrl(req, input.baseUrl);
  const timeoutMs = input.timeoutMs;
  const diagnosticsTimeoutMs = Number.isFinite(input.diagnosticsTimeoutMs)
    ? input.diagnosticsTimeoutMs
    : input.async
      ? 60000
      : timeoutMs;
  const kickQuality = input.kickQuality ?? input.quality;

  try {
    const runDiagnostics = async () =>
      buildTimeDilationDiagnostics({
        baseUrl,
        quality: input.quality,
        gridScale: input.gridScale,
        grTargetDx: input.grTargetDx,
        includeExtra: input.includeExtra,
        includeMatter: input.includeMatter,
        includeKij: input.includeKij,
        wallInvariant: input.wallInvariant,
        publish: input.publishDiagnostics,
        timeoutMs: diagnosticsTimeoutMs,
      } satisfies TimeDilationDiagnosticsOptions);

    if (input.async) {
      const activatedAt = Date.now();
      const provisionalSeed = `activate:${activatedAt}`;
      latestDiagnostics = {
        status: "pending",
        updatedAt: activatedAt,
        source: "time_dilation_activate_async",
        renderingSeed: provisionalSeed,
        seedStatus: "provisional",
        reason: "diagnostics_running",
        payload: {
          ok: false,
          kind: "time_dilation_diagnostics_pending",
          message: "Diagnostics are running asynchronously. Poll /api/helix/time-dilation/diagnostics.",
        },
      };

      void postJson<any>(
        `${baseUrl}/api/helix/pipeline/update`,
        {
          ...(input.applyCanonicalHull === false ? {} : { hull: resolveCanonicalHull() }),
          warpFieldType: input.warpFieldType,
          dynamicConfig: { warpFieldType: input.warpFieldType },
          grEnabled: input.grEnabled,
          strictCongruence: input.strictCongruence ?? true,
        },
        timeoutMs,
      )
        .then(async () => {
          if (input.kickGrBrick) {
            const params = new URLSearchParams();
            if (kickQuality) params.set("quality", kickQuality);
            if (input.includeExtra !== undefined) params.set("includeExtra", input.includeExtra ? "1" : "0");
            if (input.includeMatter !== undefined) params.set("includeMatter", input.includeMatter ? "1" : "0");
            if (input.includeKij !== undefined) params.set("includeKij", input.includeKij ? "1" : "0");
            params.set("format", "json");
            await fetch(`${baseUrl}/api/helix/gr-evolve-brick?${params.toString()}`).catch(() => null);
          }
          const diagnostics = await runDiagnostics();
          const diagnosticsRecord = (diagnostics ?? {}) as Record<string, unknown>;
          const finalSeed =
            typeof diagnosticsRecord.renderingSeed === "string" ? diagnosticsRecord.renderingSeed : provisionalSeed;
          latestDiagnostics = {
            status: "ready",
            updatedAt: Date.now(),
            source: "time_dilation_activate_async",
            renderingSeed: finalSeed,
            seedStatus: "final",
            payload: {
              kind: typeof diagnosticsRecord.kind === "string" ? diagnosticsRecord.kind : "time_dilation_diagnostics",
              gate: (diagnosticsRecord.gate as Record<string, unknown> | undefined) ?? { banner: null, reasons: [] },
              strict: (diagnosticsRecord.strict as Record<string, unknown> | undefined) ?? {},
              canonical: (diagnosticsRecord.canonical as Record<string, unknown> | undefined) ?? {},
              ...diagnosticsRecord,
              renderingSeed: finalSeed,
            },
          };
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          latestDiagnostics = {
            status: "error",
            updatedAt: Date.now(),
            source: "time_dilation_activate_error",
            renderingSeed: provisionalSeed,
            seedStatus: "provisional",
            reason: "activate_failed",
            payload: {
              ok: false,
              error: "activate_failed",
              message,
            },
          };
        });

codex/fix-webgl2-and-502-bad-gateway-errors-nzovm4

      const updatedAt = Date.now();
main
      const pipelineUpdate = {
        ok: true,
        pending: true,
        source: "activate_async",
        requested: {
          warpFieldType: input.warpFieldType,
          grEnabled: input.grEnabled,
          strictCongruence: input.strictCongruence ?? true,
          applyCanonicalHull: input.applyCanonicalHull !== false,
        },
      };
      const diagnostics = {
        ok: false,
codex/fix-webgl2-and-502-bad-gateway-errors-nzovm4
        status: "pending",
        pending: true,
        error: "diagnostics_pending",
        reason: "diagnostics_running",
        message: "Diagnostics are running asynchronously. Poll /api/helix/time-dilation/diagnostics.",
        updatedAt: activatedAt,
        renderingSeed: provisionalSeed,
        seedStatus: "provisional" as SeedStatus,
        pending: true,
        error: "diagnostics_pending",
        message: "Diagnostics are running asynchronously. Poll /api/helix/time-dilation/diagnostics.",
        updatedAt,
main
      };
      const canonical = resolveCanonicalSummary(input, pipelineUpdate, null);
      const warnings = resolveWarnings(pipelineUpdate, null);
      res.status(202).json({
        ok: true,
        accepted: true,
        baseUrl,
        warpFieldType: input.warpFieldType,
        grEnabled: input.grEnabled,
        updatedAt: activatedAt,
        renderingSeed: provisionalSeed,
        seedStatus: "provisional",
codex/fix-webgl2-and-502-bad-gateway-errors-nzovm4
        updatedAt: activatedAt,
        renderingSeed: provisionalSeed,
        seedStatus: "provisional",

        updatedAt,
        renderingSeed: `activate:${updatedAt}`,
main
        strictCongruence: canonical.strictCongruence,
        canonical,
        warnings,
        pipelineUpdate,
        diagnostics,
      });
      return;
    }

    const pipelineUpdate = await postJson<any>(
      `${baseUrl}/api/helix/pipeline/update`,
      {
        ...(input.applyCanonicalHull === false ? {} : { hull: resolveCanonicalHull() }),
        warpFieldType: input.warpFieldType,
        dynamicConfig: { warpFieldType: input.warpFieldType },
        grEnabled: input.grEnabled,
        strictCongruence: input.strictCongruence ?? true,
      },
      timeoutMs,
    );

    if (input.kickGrBrick) {
      const params = new URLSearchParams();
      if (kickQuality) params.set("quality", kickQuality);
      if (input.includeExtra !== undefined) params.set("includeExtra", input.includeExtra ? "1" : "0");
      if (input.includeMatter !== undefined) params.set("includeMatter", input.includeMatter ? "1" : "0");
      if (input.includeKij !== undefined) params.set("includeKij", input.includeKij ? "1" : "0");
      params.set("format", "json");
      await fetch(`${baseUrl}/api/helix/gr-evolve-brick?${params.toString()}`).catch(() => null);
    }

    const diagnostics = await runDiagnostics();
    const updatedAt = Date.now();
    const diagnosticsRecord = diagnostics as unknown as Record<string, unknown>;
    const pipelineRecord = pipelineUpdate as unknown as Record<string, unknown>;
    const canonical = resolveCanonicalSummary(input, pipelineRecord, diagnosticsRecord);
    const warnings = resolveWarnings(pipelineRecord, diagnosticsRecord);
    res.json({
      ok: true,
      accepted: false,
      baseUrl,
      warpFieldType: input.warpFieldType,
      grEnabled: input.grEnabled,
      updatedAt,
      renderingSeed:
        (typeof diagnosticsRecord?.renderingSeed === "string" ? diagnosticsRecord.renderingSeed : null) ??
        (typeof (pipelineRecord as any)?.renderingSeed === "string" ? (pipelineRecord as any).renderingSeed : null) ??
        `activate:${updatedAt}`,
      seedStatus: "final",
codex/fix-webgl2-and-502-bad-gateway-errors-nzovm4
      seedStatus: "final",

main
      strictCongruence: canonical.strictCongruence,
      canonical,
      warnings,
      pipelineUpdate,
      diagnostics:
        diagnostics ?? {
          ok: false,
          status: "error",
codex/fix-webgl2-and-502-bad-gateway-errors-nzovm4
          status: "error",
main
          error: "diagnostics_unavailable",
          message: "Diagnostics returned empty payload.",
          updatedAt,
        },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: "activate_failed", message });
  }
});

export { helixTimeDilationRouter };
