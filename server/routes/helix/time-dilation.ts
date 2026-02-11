import express, { type Request, type Response } from "express";
import { z } from "zod";
import {
  buildTimeDilationDiagnostics,
  type TimeDilationDiagnosticsOptions,
  DEFAULT_HULL_AXES,
  DEFAULT_HULL_WALL_THICKNESS_M,
} from "@shared/time-dilation-diagnostics";

type TimeDilationDiagnosticsStore = {
  updatedAt: number;
  source: string | null;
  payload: unknown;
};

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const helixTimeDilationRouter = express.Router();

let latestDiagnostics: TimeDilationDiagnosticsStore | null = null;

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

helixTimeDilationRouter.options("/diagnostics", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixTimeDilationRouter.options("/activate", (_req, res) => {
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
    res.json(latestDiagnostics.payload);
    return;
  }

  res.json({
    ok: true,
    updatedAt: latestDiagnostics.updatedAt,
    source: latestDiagnostics.source,
    payload: latestDiagnostics.payload,
  });
});

helixTimeDilationRouter.post("/diagnostics", (req, res) => {
  setCors(res);
  const payload =
    req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
  const sourceRaw = payload?.source;
  const source =
    typeof sourceRaw === "string" && sourceRaw.trim().length > 0 ? sourceRaw.trim() : null;
  latestDiagnostics = {
    updatedAt: Date.now(),
    source,
    payload,
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
          return runDiagnostics();
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          latestDiagnostics = {
            updatedAt: Date.now(),
            source: "time_dilation_activate_error",
            payload: { ok: false, error: "activate_failed", message },
          };
        });

      res.status(202).json({
        ok: true,
        accepted: true,
        baseUrl,
        warpFieldType: input.warpFieldType,
        grEnabled: input.grEnabled,
        pipelineUpdate: null,
        diagnostics: null,
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
    res.json({
      ok: true,
      accepted: false,
      baseUrl,
      warpFieldType: input.warpFieldType,
      grEnabled: input.grEnabled,
      pipelineUpdate,
      diagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: "activate_failed", message });
  }
});

export { helixTimeDilationRouter };
