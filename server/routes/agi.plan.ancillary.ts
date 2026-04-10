import type { Request, Response, Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import type { ResonanceBundle, ResonanceCollapse, ResonancePatch } from "@shared/code-lattice";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import type { GroundingReport, GroundingSource } from "@shared/grounding";
import { guardTenant } from "../auth/tenant";
import { personaPolicy } from "../auth/policy";
import { saveConsoleTelemetry } from "../services/console-telemetry/store";
import { persistConsoleTelemetrySnapshot } from "../services/console-telemetry/persist";
import { getGlobalPipelineState } from "../energy-pipeline";
import {
  clearHelixThreadSessionGraphLock,
  getHelixThreadSessionGraphLock,
  setHelixThreadSessionGraphLock,
} from "../services/helix-thread/carry-forward";
import { collectBadgeTelemetry } from "../services/telemetry/badges";
import { collectPanelSnapshots } from "../services/telemetry/panels";
import { llmLocalHandler } from "../skills/llm.local";

const LOCAL_CALL_SPEC_URL =
  process.env.LOCAL_CALL_SPEC_URL ??
  process.env.VITE_LOCAL_CALL_SPEC_URL ??
  "http://127.0.0.1:11434/api/local-call-spec";
const LOCAL_CALL_SPEC_TIMEOUT_MS = 2500;
const LOCAL_TTS_URL =
  process.env.LOCAL_TTS_URL ??
  process.env.VITE_LOCAL_TTS_URL ??
  "http://127.0.0.1:11434/api/tts";
const LOCAL_STT_URL =
  process.env.LOCAL_STT_URL ??
  process.env.VITE_LOCAL_STT_URL ??
  "http://127.0.0.1:11434/api/stt";
const LOCAL_TTS_TIMEOUT_MS = 5000;
const LOCAL_STT_TIMEOUT_MS = 5000;

const PanelTelemetrySchema = z.object({
  panelId: z.string().min(1),
  instanceId: z.string().min(1),
  title: z.string().min(1),
  kind: z.string().min(1).optional(),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  flags: z.record(z.boolean()).optional(),
  strings: z.record(z.string()).optional(),
  bands: z
    .array(
      z.object({
        name: z.string().min(1),
        q: z.number().optional(),
        coherence: z.number().optional(),
        occupancy: z.number().optional(),
        event_rate: z.number().optional(),
        last_event: z.string().optional(),
      }),
    )
    .max(24)
    .optional(),
  tile_sample: z
    .object({
      total: z.number().int().nonnegative().optional(),
      active: z.number().int().nonnegative().optional(),
      hot: z.array(z.number()).max(256).optional(),
    })
    .optional(),
  sourceIds: z.array(z.string().min(1)).max(16).optional(),
  notes: z.string().max(512).optional(),
  lastUpdated: z.string().optional(),
});

const ConsoleTelemetrySchema = z.object({
  desktopId: z.string().min(1).max(128),
  capturedAt: z.string().optional(),
  panels: z.array(PanelTelemetrySchema).max(32),
});

type RawPanelTelemetry = z.infer<typeof PanelTelemetrySchema>;

const HelixAskGraphLockRequest = z.object({
  sessionId: z.string().min(1),
  treeIds: z.array(z.string().min(1)).optional(),
  mode: z.enum(["replace", "merge", "clear"]).optional(),
});

const LUMA_MOOD_VALUES = ["mad", "upset", "shock", "question", "happy", "friend", "love"] as const;
type LumaMood = (typeof LUMA_MOOD_VALUES)[number];
const LumaMoodSchema = z.enum(LUMA_MOOD_VALUES);

const MoodHintRequest = z.object({
  text: z.string().min(1, "text required"),
  sessionId: z.string().min(1).max(128).optional(),
  personaId: z.string().min(1).optional(),
});

const MoodHintPayloadSchema = z.object({
  mood: LumaMoodSchema.nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().min(1).optional(),
});

const readBoundedNumber = (
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  round: boolean,
): number => {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const bounded = Math.max(min, Math.min(max, parsed));
  return round ? Math.floor(bounded) : bounded;
};

const HELIX_MOOD_HINT_MAX_CHARS = readBoundedNumber(
  process.env.HELIX_MOOD_HINT_MAX_CHARS ?? process.env.VITE_HELIX_MOOD_HINT_MAX_CHARS,
  600,
  120,
  2400,
  true,
);
const HELIX_MOOD_HINT_MAX_TOKENS = readBoundedNumber(
  process.env.HELIX_MOOD_HINT_MAX_TOKENS ?? process.env.VITE_HELIX_MOOD_HINT_MAX_TOKENS,
  48,
  8,
  256,
  true,
);
const HELIX_MOOD_HINT_TEMP = readBoundedNumber(
  process.env.HELIX_MOOD_HINT_TEMP ?? process.env.VITE_HELIX_MOOD_HINT_TEMP,
  0.1,
  0,
  1,
  false,
);

type PlanDebugRecord = {
  traceId: string;
  createdAt: string;
  goal: string;
  personaId: string;
  planDsl: string;
  groundingReport?: GroundingReport | null;
  taskTrace: {
    grounding_report?: GroundingReport | null;
  };
  resonance?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
};

type RegisterAgiPlanAncillaryRoutesArgs = {
  planRouter: Router;
  defaultDesktopId: string;
  sessionMemoryEnabled: boolean;
  getPlanRecord: (traceId: string) => PlanDebugRecord | null;
  rehydratePlanRecord: (traceId: string) => Promise<PlanDebugRecord | null>;
  rememberPlanRecord: (record: PlanDebugRecord) => unknown;
  findLatestAccessiblePlan: (claims: unknown) => PlanDebugRecord | null;
  dedupeGroundingSources: (sources?: GroundingSource[] | null) => GroundingSource[];
  pickResonancePatch: (args: {
    bundle: ResonanceBundle | null | undefined;
    selection: ResonanceCollapse | null | undefined;
  }) => ResonancePatch | null;
};

const toFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const pickTypedEntries = <T extends "string" | "number" | "boolean">(
  source: Record<string, unknown> | undefined,
  type: T,
): Record<string, T extends "string" ? string : T extends "number" ? number : boolean> => {
  if (!source) {
    return {} as Record<string, any>;
  }
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === type) {
      next[key] = value;
    }
  }
  return next as Record<string, any>;
};

export function sanitizePanelTelemetry(panel: RawPanelTelemetry, capturedAt: string): PanelTelemetry {
  const metrics = pickTypedEntries(panel.metrics, "number");
  const strings = { ...pickTypedEntries(panel.metrics, "string"), ...(panel.strings ?? {}) };
  const flags = { ...pickTypedEntries(panel.metrics, "boolean"), ...(panel.flags ?? {}) };
  const bands =
    panel.bands
      ?.map((band) => ({
        name: band.name,
        q: toFiniteNumber(band.q) ?? 0,
        coherence: toFiniteNumber(band.coherence) ?? 0,
        occupancy: toFiniteNumber(band.occupancy) ?? 0,
        event_rate: toFiniteNumber(band.event_rate),
        last_event: band.last_event,
      }))
      .filter((band) => band.name) ?? [];
  const tileSample =
    panel.tile_sample && (panel.tile_sample.total !== undefined || panel.tile_sample.active !== undefined)
      ? {
          total: toFiniteNumber(panel.tile_sample.total) ?? 0,
          active: toFiniteNumber(panel.tile_sample.active) ?? 0,
          hot: Array.isArray(panel.tile_sample.hot)
            ? panel.tile_sample.hot.filter((value) => typeof value === "number" && Number.isFinite(value)).slice(0, 256)
            : undefined,
        }
      : undefined;

  return {
    panelId: panel.panelId,
    instanceId: panel.instanceId,
    title: panel.title,
    kind: panel.kind,
    metrics: Object.keys(metrics).length ? metrics : undefined,
    flags: Object.keys(flags).length ? flags : undefined,
    strings: Object.keys(strings).length ? strings : undefined,
    bands: bands.length ? bands : undefined,
    tile_sample: tileSample,
    sourceIds: panel.sourceIds?.filter(Boolean),
    notes: panel.notes,
    lastUpdated: panel.lastUpdated ?? capturedAt,
  };
}

export const normalizeGraphLockSessionId = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const clamp01 = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
};

const coerceLumaMood = (value: unknown): LumaMood | null => {
  if (typeof value !== "string") return null;
  const lowered = value.trim().toLowerCase();
  return LUMA_MOOD_VALUES.includes(lowered as LumaMood) ? (lowered as LumaMood) : null;
};

const extractJsonObject = (text: string): string | null => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

export function buildMoodHintPrompt(text: string): string {
  const clipped = text.slice(0, HELIX_MOOD_HINT_MAX_CHARS);
  const lines: string[] = [];
  lines.push("You are a fast mood classifier for UI theming.");
  lines.push(
    `Choose exactly one mood from: ${LUMA_MOOD_VALUES.join(", ")}. Use question for neutral prompts.`,
  );
  lines.push(
    "Return strict JSON only: {\"mood\":\"<mood|null>\",\"confidence\":0..1,\"reason\":\"short\"}.",
  );
  lines.push("If unclear, use mood null with low confidence.");
  lines.push("");
  lines.push("Text:");
  lines.push(clipped);
  return lines.join("\n");
}

export function parseMoodHintResult(raw: string): {
  mood: LumaMood | null;
  confidence: number;
  reason: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { mood: null, confidence: 0, reason: null };
  }

  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = MoodHintPayloadSchema.safeParse(JSON.parse(jsonCandidate));
    if (parsed.success) {
      const mood = coerceLumaMood(parsed.data.mood ?? null);
      const confidence = clamp01(parsed.data.confidence, mood ? 0.6 : 0.2);
      const reason = parsed.data.reason?.trim() ?? null;
      return { mood, confidence, reason };
    }
  } catch {
    // Fall through to token parsing.
  }

  const lowered = trimmed.toLowerCase();
  const mood =
    LUMA_MOOD_VALUES.find((entry) => new RegExp(`\\b${entry}\\b`, "i").test(lowered)) ?? null;
  return {
    mood,
    confidence: mood ? 0.35 : 0.1,
    reason: mood ? "token-match" : null,
  };
}

const resolveDesktopId = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const resolvePanelIds = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return undefined;
};

const proxyBinaryPost = async (
  targetUrl: string,
  timeoutMs: number,
  req: Request,
  res: Response,
  disabledError: string,
) => {
  if (!targetUrl) {
    return res.status(503).json({ error: `${disabledError}_unconfigured` });
  }
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    const body: BodyInit | undefined = (() => {
      const payload = req.body;
      if (payload === undefined) return undefined;
      if (typeof payload === "string") return payload;
      if (payload instanceof ArrayBuffer) return payload;
      if (typeof SharedArrayBuffer !== "undefined" && payload instanceof SharedArrayBuffer) {
        return new Uint8Array(payload).slice();
      }
      if (ArrayBuffer.isView(payload)) return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength).slice();
      return JSON.stringify(payload);
    })();
    const contentTypeHeader = req.headers["content-type"];
    const contentType = Array.isArray(contentTypeHeader)
      ? contentTypeHeader[0]
      : contentTypeHeader ?? "application/octet-stream";
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!response.ok) {
      return res.status(502).json({ error: `${disabledError}_upstream`, status: response.status });
    }
    const responseContentType = response.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await response.arrayBuffer());
    res.setHeader("content-type", responseContentType);
    return res.status(200).send(buf);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: `${disabledError}_failed`, message });
  }
};

export function registerAgiPlanAncillaryRoutes(args: RegisterAgiPlanAncillaryRoutesArgs): void {
  const {
    planRouter,
    defaultDesktopId,
    sessionMemoryEnabled,
    getPlanRecord,
    rehydratePlanRecord,
    rememberPlanRecord,
    findLatestAccessiblePlan,
    dedupeGroundingSources,
    pickResonancePatch,
  } = args;

  planRouter.post("/console/telemetry", (req, res) => {
    const parsed = ConsoleTelemetrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
    }
    const capturedAt = parsed.data.capturedAt ?? new Date().toISOString();
    const panels: PanelTelemetry[] = parsed.data.panels.map((panel) => sanitizePanelTelemetry(panel, capturedAt));
    const payload: ConsoleTelemetryBundle = {
      desktopId: parsed.data.desktopId,
      capturedAt,
      panels,
    };
    saveConsoleTelemetry(payload);
    void persistConsoleTelemetrySnapshot(payload).catch((error) => {
      console.warn("[telemetry] failed to persist snapshot", error);
    });
    res.status(204).end();
  });

  planRouter.get("/telemetry/badges", (req, res) => {
    const desktopId = resolveDesktopId(req.query.desktopId, defaultDesktopId);
    const panelIds = resolvePanelIds(req.query.panelId ?? req.query.panelIds);
    const includeRaw = req.query.includeRaw === "1" || req.query.includeRaw === "true";
    const { snapshot, rawPanels } = collectBadgeTelemetry({ desktopId, panelIds });
    if (includeRaw) {
      return res.json({ ...snapshot, raw: rawPanels });
    }
    return res.json(snapshot);
  });

  planRouter.get("/telemetry/panels", (req, res) => {
    const desktopId = resolveDesktopId(req.query.desktopId, defaultDesktopId);
    const panelIds = resolvePanelIds(req.query.panelId ?? req.query.panelIds);
    const snapshot = collectPanelSnapshots({ desktopId, panelIds });
    return res.json(snapshot);
  });

  planRouter.get("/pipeline/status", (_req, res) => {
    try {
      const state = getGlobalPipelineState();
      const { warp, natario, warpUniforms, natarioConstraint, dutyEffective_FR, thetaScaleExpected, thetaScale } = state as any;
      res.json({
        ok: true,
        natarioConstraint: natarioConstraint ?? warp?.isZeroExpansion ?? natario?.isZeroExpansion,
        dutyEffective_FR,
        thetaScaleExpected,
        thetaScale,
        warp: warp ?? null,
        natario: natario ?? null,
        warpUniforms: warpUniforms ?? null,
        capturedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ ok: false, error: "pipeline_status_error", message });
    }
  });

  planRouter.get("/pipeline/last-plan-debug", async (req, res) => {
    const traceIdParam =
      typeof req.query.traceId === "string" && req.query.traceId.trim().length > 0
        ? req.query.traceId.trim()
        : undefined;
    let record: PlanDebugRecord | null = null;
    if (traceIdParam) {
      record = getPlanRecord(traceIdParam) ?? (await rehydratePlanRecord(traceIdParam));
      if (record) {
        rememberPlanRecord(record);
      }
    }
    if (!record) {
      record = findLatestAccessiblePlan(req.auth);
    }
    if (!record) {
      return res.status(404).json({ error: "plan_debug_unavailable" });
    }
    if (!personaPolicy.canAccess(req.auth, record.personaId, "plan")) {
      return res.status(403).json({ error: "forbidden" });
    }
    const groundingSources = dedupeGroundingSources(
      record.groundingReport?.sources ?? record.taskTrace.grounding_report?.sources ?? [],
    );
    const patch = pickResonancePatch({ bundle: record.resonance, selection: record.resonanceSelection });
    const resonanceNodes = patch?.nodes ?? [];
    const resonancePatches = resonanceNodes
      .filter((node) => node?.filePath || node?.symbol)
      .slice(0, 16)
      .map((node) => ({
        id: node.id ?? node.symbol ?? patch?.id ?? "",
        path: node.filePath ?? node.symbol ?? "",
        kind: node.kind,
        score: node.score,
      }));
    res.json({
      ok: true,
      traceId: record.traceId,
      createdAt: record.createdAt,
      goal: record.goal,
      personaId: record.personaId,
      planDsl: record.planDsl,
      resonancePatchId: patch?.id ?? null,
      resonancePatches,
      groundingSources,
    });
  });

  planRouter.post("/local-call-spec", async (req, res) => {
    if ((process.env.ENABLE_LOCAL_CALL_SPEC ?? process.env.VITE_ENABLE_LOCAL_CALL_SPEC) !== "1") {
      return res.status(404).json({ error: "local_call_spec_disabled" });
    }
    if (!LOCAL_CALL_SPEC_URL) {
      return res.status(503).json({ error: "local_call_spec_unconfigured" });
    }
    try {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), LOCAL_CALL_SPEC_TIMEOUT_MS);
      const response = await fetch(LOCAL_CALL_SPEC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body ?? {}),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!response.ok) {
        return res.status(502).json({ error: "local_call_spec_upstream", status: response.status });
      }
      const payload = await response.json();
      return res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(502).json({ error: "local_call_spec_failed", message });
    }
  });

  planRouter.post("/tts/local", async (req, res) => {
    const enabled = (process.env.ENABLE_LOCAL_TTS ?? process.env.VITE_ENABLE_LOCAL_TTS) === "1";
    if (!enabled) {
      return res.status(404).json({ error: "local_tts_disabled" });
    }
    return proxyBinaryPost(LOCAL_TTS_URL, LOCAL_TTS_TIMEOUT_MS, req, res, "local_tts");
  });

  planRouter.post("/stt/local", async (req, res) => {
    const enabled = (process.env.ENABLE_LOCAL_STT ?? process.env.VITE_ENABLE_LOCAL_STT) === "1";
    if (!enabled) {
      return res.status(404).json({ error: "local_stt_disabled" });
    }
    return proxyBinaryPost(LOCAL_STT_URL, LOCAL_STT_TIMEOUT_MS, req, res, "local_stt");
  });

  planRouter.post("/mood-hint", async (req, res) => {
    const tenantGuard = guardTenant(req);
    if (!tenantGuard.ok) {
      return res.status(tenantGuard.status).json({ error: tenantGuard.error });
    }
    const parsed = MoodHintRequest.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
    }

    let personaId = parsed.data.personaId ?? "default";
    if (
      personaPolicy.shouldRestrictRequest(req.auth) &&
      (!personaId || personaId === "default") &&
      req.auth?.sub
    ) {
      personaId = req.auth.sub;
    }
    if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const text = parsed.data.text.trim();
    if (!text) {
      return res.status(400).json({ error: "bad_request", details: "text required" });
    }

    const sessionId = parsed.data.sessionId?.trim() || undefined;
    const traceId = `mood:${crypto.randomUUID()}`;
    const startedAt = Date.now();
    const prompt = buildMoodHintPrompt(text);

    try {
      const result = await llmLocalHandler(
        {
          prompt,
          max_tokens: HELIX_MOOD_HINT_MAX_TOKENS,
          temperature: HELIX_MOOD_HINT_TEMP,
          stop: ["\n\n"],
          metadata: { kind: "helix.mood_hint" },
        },
        {
          sessionId,
          traceId,
          personaId,
          tenantId: tenantGuard.tenantId,
        },
      );
      const raw = String((result as any)?.text ?? "");
      const parsedHint = parseMoodHintResult(raw);
      const rawPreview = raw.trim().slice(0, 320);
      return res.json({
        mood: parsedHint.mood,
        confidence: parsedHint.confidence,
        reason: parsedHint.reason,
        source: "local-llm",
        durationMs: Math.max(0, Date.now() - startedAt),
        traceId,
        sessionId: sessionId ?? null,
        raw: rawPreview || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.json({
        mood: null,
        confidence: 0,
        reason: message || "mood_hint_failed",
        source: "error",
        durationMs: Math.max(0, Date.now() - startedAt),
        traceId,
        sessionId: sessionId ?? null,
        raw: null,
      });
    }
  });

  planRouter.get("/helix-ask/graph-lock", (req, res) => {
    if (!sessionMemoryEnabled) {
      return res.status(404).json({ error: "session_memory_disabled", status: 404 });
    }
    const sessionId = normalizeGraphLockSessionId(req.query.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "bad_request", message: "sessionId required" });
    }
    const treeIds = getHelixThreadSessionGraphLock(sessionId);
    return res.json({ sessionId, treeIds, locked: treeIds.length > 0 });
  });

  planRouter.post("/helix-ask/graph-lock", (req, res) => {
    if (!sessionMemoryEnabled) {
      return res.status(404).json({ error: "session_memory_disabled", status: 404 });
    }
    const parsed = HelixAskGraphLockRequest.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
    }
    const sessionId = parsed.data.sessionId.trim();
    const mode = parsed.data.mode ?? "replace";
    if (mode === "clear") {
      clearHelixThreadSessionGraphLock(sessionId);
      return res.json({ ok: true, sessionId, treeIds: [], locked: false, mode: "clear" });
    }
    const treeIds = parsed.data.treeIds ?? [];
    if (treeIds.length === 0) {
      return res.status(400).json({ error: "bad_request", message: "treeIds required" });
    }
    const next = setHelixThreadSessionGraphLock({
      sessionId,
      treeIds,
      mode: mode === "merge" ? "merge" : "replace",
    });
    return res.json({ ok: true, sessionId, treeIds: next, locked: next.length > 0, mode });
  });

  planRouter.delete("/helix-ask/graph-lock", (req, res) => {
    if (!sessionMemoryEnabled) {
      return res.status(404).json({ error: "session_memory_disabled", status: 404 });
    }
    const sessionId =
      normalizeGraphLockSessionId(req.query.sessionId) ||
      normalizeGraphLockSessionId((req.body as { sessionId?: string } | undefined)?.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "bad_request", message: "sessionId required" });
    }
    clearHelixThreadSessionGraphLock(sessionId);
    return res.json({ ok: true, sessionId, treeIds: [], locked: false });
  });
}
