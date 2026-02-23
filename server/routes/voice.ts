import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

type VoicePriority = "info" | "warn" | "critical" | "action";

const voiceRouter = Router();

const requestSchema = z.object({
  text: z.string().trim().min(1).max(600),
  mode: z.enum(["callout", "briefing", "debrief"]).default("callout"),
  priority: z.enum(["info", "warn", "critical", "action"]).default("info"),
  voiceProfile: z.string().trim().min(1).max(120).optional(),
  voice_profile_id: z.string().trim().min(1).max(120).optional(),
  format: z.enum(["wav", "mp3"]).default("wav"),
  consent_asserted: z.boolean().optional(),
  watermark_mode: z.string().trim().max(120).optional(),
  traceId: z.string().trim().max(200).optional(),
  missionId: z.string().trim().max(200).optional(),
  eventId: z.string().trim().max(200).optional(),
  referenceAudioHash: z.string().trim().max(256).nullable().optional(),
  dedupe_key: z.string().trim().max(240).optional(),
  provider: z.string().trim().min(1).max(120).optional(),
  durationMs: z.number().int().nonnegative().max(600000).optional(),
  contextTier: z.enum(["tier0", "tier1"]).optional(),
  sessionState: z.enum(["idle", "requesting", "active", "stopping", "error"]).optional(),
  voiceMode: z.enum(["off", "critical_only", "normal", "dnd"]).optional(),
});

type VoiceRequest = z.infer<typeof requestSchema>;


type VoiceProviderMode = "local_only" | "allow_remote";

type ProviderGovernance = {
  providerMode: VoiceProviderMode;
  providerAllowlist: string[];
  commercialMode: boolean;
  managedProvidersEnabled: boolean;
  localOnlyMissionMode: boolean;
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return defaultValue;
};

const resolveProviderGovernance = (): ProviderGovernance => {
  const providerMode = process.env.VOICE_PROVIDER_MODE?.trim().toLowerCase() === "local_only" ? "local_only" : "allow_remote";
  const providerAllowlist = (process.env.VOICE_PROVIDER_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  const commercialMode = parseBooleanFlag(process.env.VOICE_COMMERCIAL_MODE, false);
  const managedProvidersEnabled = parseBooleanFlag(process.env.VOICE_MANAGED_PROVIDERS_ENABLED, true);
  const localOnlyMissionMode = providerMode === "local_only" ? true : parseBooleanFlag(process.env.VOICE_LOCAL_ONLY_MISSION_MODE, true);
  return { providerMode, providerAllowlist, commercialMode, managedProvidersEnabled, localOnlyMissionMode };
};

const isLocalProvider = (provider: string): boolean => provider.toLowerCase().startsWith("local");

const COOLDOWN_SECONDS: Record<VoicePriority, number> = {
  info: 60,
  warn: 30,
  critical: 10,
  action: 5,
};

const dedupeUntil = new Map<string, number>();
const missionWindow = new Map<string, number[]>();

const missionBudgetWindow = new Map<string, number[]>();
const tenantBudgetDaily = new Map<string, { day: string; count: number }>();

const parseIntEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveBudgetConfig = () => ({
  missionWindowMs: parseIntEnv(process.env.VOICE_BUDGET_MISSION_WINDOW_MS, 60_000),
  missionMaxRequests: parseIntEnv(process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS, 12),
  tenantDailyMaxRequests: parseIntEnv(process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS, 500),
});

const currentDayKey = (): string => new Date().toISOString().slice(0, 10);

type BudgetRejection = {
  scope: "mission_window" | "tenant_day";
  limit: number;
  windowMs?: number;
  tenantId: string;
};

const checkAndRecordBudget = (missionId: string | undefined, tenantId: string): BudgetRejection | null => {
  const cfg = resolveBudgetConfig();

  if (missionId) {
    const now = Date.now();
    const windowStart = now - cfg.missionWindowMs;
    const existing = missionBudgetWindow.get(missionId) ?? [];
    const next = existing.filter((ts) => ts >= windowStart);
    if (next.length >= cfg.missionMaxRequests) {
      missionBudgetWindow.set(missionId, next);
      return {
        scope: "mission_window",
        limit: cfg.missionMaxRequests,
        windowMs: cfg.missionWindowMs,
        tenantId,
      };
    }
    next.push(now);
    missionBudgetWindow.set(missionId, next);
  }

  const day = currentDayKey();
  const tenantState = tenantBudgetDaily.get(tenantId);
  const nextTenant = !tenantState || tenantState.day !== day ? { day, count: 0 } : tenantState;
  if (nextTenant.count >= cfg.tenantDailyMaxRequests) {
    tenantBudgetDaily.set(tenantId, nextTenant);
    return {
      scope: "tenant_day",
      limit: cfg.tenantDailyMaxRequests,
      tenantId,
    };
  }
  nextTenant.count += 1;
  tenantBudgetDaily.set(tenantId, nextTenant);
  return null;
};


type CircuitBreakerState = {
  openedUntil: number;
  recentFailures: number[];
};

const circuitBreaker: CircuitBreakerState = {
  openedUntil: 0,
  recentFailures: [],
};

const BREAKER_FAILURE_WINDOW_MS = 60_000;
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_OPEN_MS = 30_000;

const isCircuitBreakerOpen = (): boolean => circuitBreaker.openedUntil > Date.now();

const recordBackendFailure = (): void => {
  const now = Date.now();
  const windowStart = now - BREAKER_FAILURE_WINDOW_MS;
  const next = circuitBreaker.recentFailures.filter((ts) => ts >= windowStart);
  next.push(now);
  circuitBreaker.recentFailures = next;
  if (next.length >= BREAKER_FAILURE_THRESHOLD) {
    circuitBreaker.openedUntil = now + BREAKER_OPEN_MS;
  }
};

const recordBackendSuccess = (): void => {
  circuitBreaker.recentFailures = [];
  circuitBreaker.openedUntil = 0;
};

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id");
};

const errorEnvelope = (
  res: Response,
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
  traceId?: string,
) => {
  return res.status(status).json({
    error,
    message,
    ...(details ? { details } : {}),
    ...(traceId ? { traceId } : {}),
  });
};

const missionRateAllowed = (missionId: string | undefined): boolean => {
  if (!missionId) return true;
  const now = Date.now();
  const windowStart = now - 15_000;
  const existing = missionWindow.get(missionId) ?? [];
  const next = existing.filter((ts) => ts >= windowStart);
  if (next.length >= 2) {
    missionWindow.set(missionId, next);
    return false;
  }
  next.push(now);
  missionWindow.set(missionId, next);
  return true;
};

const dedupeSuppressed = (payload: VoiceRequest): boolean => {
  const key = payload.dedupe_key?.trim() || payload.eventId?.trim();
  if (!key) return false;
  const now = Date.now();
  const until = dedupeUntil.get(key) ?? 0;
  if (until > now) return true;
  const cooldownMs = COOLDOWN_SECONDS[payload.priority] * 1000;
  dedupeUntil.set(key, now + cooldownMs);
  return false;
};

voiceRouter.options("/speak", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.post("/speak", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  const parsed = requestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(
      res,
      400,
      "voice_invalid_request",
      "Invalid voice request payload.",
      { issues: parsed.error.flatten() },
    );
  }

  const payload = parsed.data;
  if (payload.contextTier === "tier0" || (payload.sessionState && payload.sessionState !== "active")) {
    return res.status(200).json({ ok: true, suppressed: true, reason: "voice_context_ineligible", traceId: payload.traceId ?? null });
  }
  if (payload.voiceMode === "off" || payload.voiceMode === "dnd") {
    return res.status(200).json({ ok: true, suppressed: true, reason: "voice_context_ineligible", traceId: payload.traceId ?? null });
  }
  if (payload.voiceMode === "critical_only" && payload.priority !== "critical" && payload.priority !== "action") {
    return res.status(200).json({ ok: true, suppressed: true, reason: "voice_context_ineligible", traceId: payload.traceId ?? null });
  }
  const traceId = payload.traceId?.trim() || undefined;
  const tenantId =
    (req.header("x-tenant-id") ?? req.header("x-customer-id") ?? "single-tenant").trim().toLowerCase() ||
    "single-tenant";
  const metering = {
    requestCount: 1,
    charCount: payload.text.length,
    durationMs: payload.durationMs,
    tenantId,
    missionId: payload.missionId,
  };

  const usesReferenceAudio = Boolean(payload.referenceAudioHash && payload.referenceAudioHash.trim());
  if (usesReferenceAudio && payload.consent_asserted !== true) {
    return errorEnvelope(
      res,
      400,
      "voice_consent_required",
      "consent_asserted must be true when reference audio is provided.",
      { referenceAudioHash: true },
      traceId,
    );
  }

  const governance = resolveProviderGovernance();
  const missionCritical = payload.priority === "critical" || payload.priority === "action";
  const requestedProvider = payload.provider?.trim() || "local-chatterbox";
  const provider = missionCritical && governance.localOnlyMissionMode ? "local-chatterbox" : requestedProvider;

  if (!isLocalProvider(provider) && !governance.managedProvidersEnabled) {
    return errorEnvelope(
      res,
      403,
      "voice_provider_not_allowed",
      "Managed voice providers are disabled by runtime policy.",
      { provider, managedProvidersEnabled: false },
      traceId,
    );
  }

  if (governance.providerMode === "local_only" && !isLocalProvider(provider)) {
    return errorEnvelope(
      res,
      403,
      "voice_provider_not_allowed",
      "Remote voice providers are disabled by runtime policy.",
      { provider, providerMode: governance.providerMode },
      traceId,
    );
  }

  if (
    governance.commercialMode &&
    governance.providerAllowlist.length > 0 &&
    !governance.providerAllowlist.includes(provider.toLowerCase())
  ) {
    return errorEnvelope(
      res,
      403,
      "voice_provider_not_allowed",
      "Voice provider is not allowed for commercial mode.",
      { provider, commercialMode: true },
      traceId,
    );
  }

  const budgetRejection = checkAndRecordBudget(payload.missionId, tenantId);
  if (budgetRejection) {
    return errorEnvelope(
      res,
      429,
      "voice_budget_exceeded",
      "Voice budget exceeded for current policy window.",
      {
        ...budgetRejection,
        metering,
      },
      traceId,
    );
  }

  if (!missionRateAllowed(payload.missionId)) {
    return errorEnvelope(
      res,
      429,
      "voice_rate_limited",
      "Mission voice rate limit exceeded.",
      { windowSeconds: 15, maxCallouts: 2 },
      traceId,
    );
  }

  if (dedupeSuppressed(payload)) {
    return res.status(200).json({
      ok: true,
      suppressed: true,
      reason: "dedupe_cooldown",
      traceId,
      missionId: payload.missionId,
      eventId: payload.eventId,
    });
  }

  const dryRun = String(process.env.VOICE_PROXY_DRY_RUN ?? "0").trim() === "1";
  const baseUrl = process.env.TTS_BASE_URL?.trim();

  if (dryRun) {
    return res.status(200).json({
      ok: true,
      dryRun: true,
      provider: "dry-run",
      voiceProfile: payload.voiceProfile ?? payload.voice_profile_id ?? "default",
      metering: {
        ...metering,
        durationMs: payload.durationMs ?? Math.max(250, payload.text.length * 45),
      },
      traceId,
    });
  }

  if (!baseUrl) {
    return errorEnvelope(
      res,
      503,
      "voice_unavailable",
      "Voice service is not configured.",
      { providerConfigured: false },
      traceId,
    );
  }

  if (isCircuitBreakerOpen()) {
    const retryAfterMs = Math.max(0, circuitBreaker.openedUntil - Date.now());
    return errorEnvelope(
      res,
      503,
      "voice_backend_error",
      "Voice backend temporarily unavailable due to repeated failures.",
      {
        circuitBreakerOpen: true,
        retryAfterMs,
      },
      traceId,
    );
  }

  const timeoutMs = 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, "")}/speak`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, provider, ...(payload.voice_profile_id ? { voiceProfile: payload.voiceProfile ?? payload.voice_profile_id } : {}) }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      recordBackendFailure();
      const responseText = await upstream.text().catch(() => "");
      return errorEnvelope(
        res,
        upstream.status >= 500 ? 502 : upstream.status,
        "voice_backend_error",
        "Voice backend returned an error response.",
        { status: upstream.status, body: responseText.slice(0, 400) },
        traceId,
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    recordBackendSuccess();
    res.setHeader("content-type", contentType);
    res.setHeader("x-voice-provider", "proxy");
    res.setHeader("x-voice-profile", payload.voiceProfile ?? payload.voice_profile_id ?? "default");
    if (payload.watermark_mode) {
      res.setHeader("x-watermark-mode", payload.watermark_mode);
    }
    const durationHeader = upstream.headers.get("x-audio-duration-ms") ?? (payload.durationMs ? String(payload.durationMs) : "");
    res.setHeader("x-voice-meter-request-count", String(metering.requestCount));
    res.setHeader("x-voice-meter-char-count", String(metering.charCount));
    if (durationHeader) {
      res.setHeader("x-voice-meter-duration-ms", durationHeader);
    }
    return res.status(200).send(buffer);
  } catch (error) {
    recordBackendFailure();
    const aborted = error instanceof Error && error.name === "AbortError";
    return errorEnvelope(
      res,
      aborted ? 504 : 502,
      aborted ? "voice_backend_timeout" : "voice_backend_error",
      aborted ? "Voice backend timed out." : "Voice backend request failed.",
      { timeoutMs },
      traceId,
    );
  } finally {
    clearTimeout(timeout);
  }
});

const resetVoiceRouteState = () => {
  dedupeUntil.clear();
  missionWindow.clear();
  missionBudgetWindow.clear();
  tenantBudgetDaily.clear();
  circuitBreaker.openedUntil = 0;
  circuitBreaker.recentFailures = [];
};

export { voiceRouter, resetVoiceRouteState };
