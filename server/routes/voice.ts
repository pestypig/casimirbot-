import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { createHash } from "node:crypto";
import { enforceCalloutParity, type CertaintyClass } from "../../shared/helix-dottie-callout-contract";
import { evaluateCalloutEligibility as evaluateSharedEligibility } from "../../shared/callout-eligibility";
import {
  OPERATOR_CALLOUT_V1_KIND,
  validateOperatorCalloutV1,
} from "../services/helix-ask/operator-contract-v1";
import { sttHttpHandler } from "../skills/stt.whisper.http";
import { sttWhisperHandler } from "../skills/stt.whisper";
import {
  normalizeVoiceBuffer,
  type VoiceMp3NormalizationOptions,
  type VoiceWavNormalizationOptions,
} from "../services/audio/voice-normalization";

type VoicePriority = "info" | "warn" | "critical" | "action";

const voiceRouter = Router();
const OPENAI_AUDIO_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: OPENAI_AUDIO_UPLOAD_LIMIT_BYTES },
});

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
  utteranceId: z.string().trim().max(200).optional(),
  chunkIndex: z.number().int().nonnegative().max(4096).optional(),
  chunkCount: z.number().int().positive().max(4096).optional(),
  chunkKind: z.enum(["brief", "final"]).optional(),
  turnKey: z.string().trim().max(200).optional(),
  textCertainty: z.enum(["unknown", "hypothesis", "reasoned", "confirmed"]).optional(),
  voiceCertainty: z.enum(["unknown", "hypothesis", "reasoned", "confirmed"]).optional(),
  deterministic: z.boolean().optional(),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).max(32).optional(),
  repoAttributed: z.boolean().optional(),
  replayMode: z.boolean().optional(),
  policyTsMs: z.number().int().nonnegative().optional(),
  tsMs: z.number().int().nonnegative().optional(),
});

type VoiceRequest = z.infer<typeof requestSchema>;

const transcribeRequestSchema = z.object({
  language: z.string().trim().min(1).max(32).optional(),
  traceId: z.string().trim().max(200).optional(),
  missionId: z.string().trim().max(200).optional(),
  durationMs: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : undefined;
    }
    return undefined;
  }, z.number().int().nonnegative().max(600_000).optional()),
});

type VoiceTranscribeRequest = z.infer<typeof transcribeRequestSchema>;


type VoiceProviderMode = "local_only" | "allow_remote";

type ProviderGovernance = {
  providerMode: VoiceProviderMode;
  providerAllowlist: string[];
  commercialMode: boolean;
  managedProvidersEnabled: boolean;
  localOnlyMissionMode: boolean;
};

type ElevenLabsConfig = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  baseUrl: string;
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return defaultValue;
};

const voiceTranscriptionEnabled = (): boolean =>
  parseBooleanFlag(process.env.ENABLE_VOICE_TRANSCRIBE, true);

type SttPolicyMode = "openai_first" | "local_first" | "local_only" | "http_only";
type SttOutputMode = "original" | "english" | "dual";
type TranscriptionEngine = "openai_transcribe" | "faster_whisper_local" | "whisper_http";
type SttBackendKind = "openai" | "whisper_http" | "local";
type SttBackendMode = "openai" | "generic";

type ResolvedSttBackend = {
  kind: SttBackendKind;
  mode: SttBackendMode;
  url?: string;
  apiKey?: string;
  model?: string;
};

const normalizeSttPolicyMode = (value: string | undefined): SttPolicyMode => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "local_first") return "local_first";
  if (normalized === "local_only") return "local_only";
  if (normalized === "http_only") return "http_only";
  return "openai_first";
};

const normalizeSttOutputMode = (value: string | undefined): SttOutputMode => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "original") return "original";
  if (normalized === "dual") return "dual";
  return "english";
};

const resolveSttPolicyMode = (): SttPolicyMode => normalizeSttPolicyMode(process.env.STT_POLICY_MODE);

const resolveSttOutputMode = (): SttOutputMode => normalizeSttOutputMode(process.env.STT_OUTPUT_MODE);

const resolveWhisperHttpModel = (): string =>
  (process.env.WHISPER_HTTP_MODEL ?? "gpt-4o-mini-transcribe").trim() || "gpt-4o-mini-transcribe";

const resolveSttAuthKey = (): string | undefined =>
  process.env.WHISPER_HTTP_API_KEY?.trim() ||
  process.env.OPENAI_API_KEY?.trim() ||
  process.env.LLM_HTTP_API_KEY?.trim() ||
  undefined;

const resolveOpenAiSttAuthKey = (): string | undefined =>
  process.env.OPENAI_API_KEY?.trim() ||
  process.env.WHISPER_HTTP_API_KEY?.trim() ||
  process.env.LLM_HTTP_API_KEY?.trim() ||
  undefined;

const resolveOpenAiSttBaseUrl = (): string => {
  const explicit = process.env.OPENAI_API_BASE?.trim();
  if (explicit) {
    return explicit;
  }
  const llmBase = process.env.LLM_HTTP_BASE?.trim();
  if (llmBase && /api\.openai\.com/i.test(llmBase)) {
    return llmBase;
  }
  return "https://api.openai.com";
};

const resolveOpenAiSttBackend = (): ResolvedSttBackend | null => {
  const apiKey = resolveOpenAiSttAuthKey();
  if (!apiKey) {
    return null;
  }
  const url = resolveOpenAiSttBaseUrl().trim();
  if (!url) {
    return null;
  }
  return {
    kind: "openai",
    mode: "openai",
    url,
    apiKey,
    model: resolveWhisperHttpModel(),
  };
};

const resolveWhisperHttpBackend = (): ResolvedSttBackend | null => {
  const url = process.env.WHISPER_HTTP_URL?.trim();
  if (!url) {
    return null;
  }
  return {
    kind: "whisper_http",
    mode: (process.env.WHISPER_HTTP_MODE ?? "openai").trim().toLowerCase() === "generic" ? "generic" : "openai",
    url,
    apiKey: resolveSttAuthKey(),
    model: resolveWhisperHttpModel(),
  };
};

const resolveLocalSttBackend = (): ResolvedSttBackend | null => {
  const localUrl = process.env.STT_LOCAL_URL?.trim();
  if (localUrl) {
    return {
      kind: "local",
      mode: (process.env.STT_LOCAL_MODE ?? "openai").trim().toLowerCase() === "generic" ? "generic" : "openai",
      url: localUrl,
      apiKey: process.env.STT_LOCAL_API_KEY?.trim(),
      model: (process.env.STT_LOCAL_MODEL ?? "whisper-1").trim() || "whisper-1",
    };
  }
  if (parseBooleanFlag(process.env.STT_LOCAL_EMBEDDED_ENABLED, false)) {
    return {
      kind: "local",
      mode: "generic",
    };
  }
  return null;
};

const resolveSttBackendOrder = (policyMode: SttPolicyMode): ResolvedSttBackend[] => {
  const openAi = resolveOpenAiSttBackend();
  const local = resolveLocalSttBackend();
  const whisperHttp = resolveWhisperHttpBackend();
  if (policyMode === "local_only") {
    return local ? [local] : [];
  }
  if (policyMode === "local_first") {
    return [local, openAi, whisperHttp].filter((entry): entry is ResolvedSttBackend => Boolean(entry));
  }
  if (policyMode === "http_only") {
    return [whisperHttp ?? openAi].filter((entry): entry is ResolvedSttBackend => Boolean(entry));
  }
  return [openAi, local, whisperHttp].filter((entry): entry is ResolvedSttBackend => Boolean(entry));
};

const isEnglishLikeLanguage = (value: string | undefined): boolean => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "en" || normalized.startsWith("en-");
};

const normalizeRequestedLanguage = (value: string | undefined): string | undefined => {
  const normalized = (value ?? "").trim();
  if (!normalized || /^auto$/i.test(normalized)) {
    return undefined;
  }
  return normalized;
};

const STT_CONFIRM_CONFIDENCE_THRESHOLD = 0.58;
const STT_TRANSLATION_CONFIRM_THRESHOLD = 0.68;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizeConfidenceValue = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return clamp01(value);
};

const collectSegmentConfidence = (segments: unknown[] | undefined): number[] => {
  if (!Array.isArray(segments)) return [];
  const values: number[] = [];
  for (const segment of segments) {
    if (!segment || typeof segment !== "object") continue;
    const confidence = normalizeConfidenceValue((segment as { confidence?: unknown }).confidence);
    if (typeof confidence === "number") values.push(confidence);
  }
  return values;
};

const averageConfidence = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  const total = values.reduce((sum, value) => sum + value, 0);
  return clamp01(total / values.length);
};

const estimateTextConfidence = (text: string, language: string | undefined): number => {
  const normalized = text.trim();
  if (!normalized) return 0;
  let score = 0.48;
  if (normalized.length >= 18) score += 0.12;
  if (normalized.length >= 64) score += 0.12;
  if (/[.!?]["')\]]?$/.test(normalized)) score += 0.08;
  if (/\b(and|but|or|because|so)\s*$/i.test(normalized)) score -= 0.08;
  if (/[�]/.test(normalized)) score -= 0.25;
  if (/[\u0000-\u001F]/.test(normalized)) score -= 0.2;
  const alnumChars = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  const printableChars = (normalized.match(/[^\s]/g) ?? []).length || 1;
  const alnumRatio = alnumChars / printableChars;
  if (alnumRatio < 0.45) score -= 0.14;
  if (alnumRatio > 0.82) score += 0.06;
  const normalizedLanguage = (language ?? "").trim().toLowerCase();
  if (!normalizedLanguage || normalizedLanguage === "unknown") score -= 0.06;
  return clamp01(score);
};

const deriveTranscriptionConfidence = (args: {
  text: string;
  language: string | undefined;
  segments: unknown[] | undefined;
  providerConfidence?: unknown;
}): { confidence: number; reason: string } => {
  const provider = normalizeConfidenceValue(args.providerConfidence);
  if (typeof provider === "number") {
    return { confidence: provider, reason: "provider_reported" };
  }
  const segmentAverage = averageConfidence(collectSegmentConfidence(args.segments));
  if (typeof segmentAverage === "number") {
    return { confidence: segmentAverage, reason: "segment_average" };
  }
  return {
    confidence: estimateTextConfidence(args.text, args.language),
    reason: "heuristic_text_quality",
  };
};

const resolvePolicyNowMs = (payload: VoiceRequest): number => {
  const serverNowMs = Date.now();
  const replayClockTrusted = parseBooleanFlag(process.env.VOICE_REPLAY_CLOCK_TRUSTED, false);
  if (replayClockTrusted && payload.replayMode === true) {
    return payload.policyTsMs ?? payload.tsMs ?? serverNowMs;
  }
  return serverNowMs;
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

const isElevenLabsProvider = (provider: string): boolean => {
  const normalized = provider.trim().toLowerCase();
  return normalized === "elevenlabs" || normalized.startsWith("elevenlabs:");
};

const resolveRequestedVoiceProfile = (payload: VoiceRequest): string | undefined => {
  const direct = payload.voiceProfile?.trim();
  if (direct) return direct;
  const legacy = payload.voice_profile_id?.trim();
  if (legacy) return legacy;
  return undefined;
};

const resolveElevenLabsConfig = (voiceProfileId?: string): ElevenLabsConfig | null => {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || process.env.VOICE_ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return null;
  const voiceId = voiceProfileId?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!voiceId) return null;
  const modelId = (process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2").trim() || "eleven_multilingual_v2";
  const outputFormat = (process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128").trim() || "mp3_44100_128";
  const baseUrl = (process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io").trim().replace(/\/+$/, "");
  return {
    apiKey,
    voiceId,
    modelId,
    outputFormat,
    baseUrl: baseUrl || "https://api.elevenlabs.io",
  };
};

const clipBackendErrorDetail = (value: string, limit = 400): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3)}...`;
};

const isRetryableVoiceStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

const waitWithJitter = async (attempt: number): Promise<void> => {
  const baseMs = 80 + attempt * 70;
  const jitterMs = Math.floor(Math.random() * 90);
  const waitMs = baseMs + jitterMs;
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), waitMs);
  });
};

type VoiceSynthFetchSuccess = {
  contentType: string;
  durationHeader: string;
  providerHeader: string;
  profileHeader: string;
  buffer: Buffer;
};

type VoiceSynthFetchFailure = {
  status: number;
  provider: "elevenlabs" | "proxy";
  message: string;
  body: string;
  retryable: boolean;
};

const COOLDOWN_SECONDS: Record<VoicePriority, number> = {
  info: 60,
  warn: 30,
  critical: 10,
  action: 5,
};

const PRIORITY_TO_CERTAINTY: Record<VoicePriority, CertaintyClass> = {
  info: "unknown",
  warn: "hypothesis",
  action: "reasoned",
  critical: "confirmed",
};

const dedupeUntil = new Map<string, number>();
const missionWindow = new Map<string, number[]>();

const missionBudgetWindow = new Map<string, number[]>();
const tenantBudgetDaily = new Map<string, { day: string; count: number }>();

type VoiceSpeakCacheEntry = {
  expiresAtMs: number;
  contentType: string;
  providerHeader: string;
  profileHeader: string;
  durationHeader: string;
  normalizationHeader: string;
  normalizationGainDbHeader: string;
  buffer: Buffer;
};

const voiceSpeakChunkCache = new Map<string, VoiceSpeakCacheEntry>();

const resolveVoiceChunkCacheTtlMs = (): number => {
  const parsed = Number.parseInt((process.env.VOICE_CHUNK_CACHE_TTL_MS ?? "30000").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30_000;
  return Math.max(1_000, parsed);
};

const createVoiceSpeakCacheKey = (payload: VoiceRequest, provider: string, voiceProfile: string): string => {
  const hash = createHash("sha256");
  hash.update(provider);
  hash.update("|");
  hash.update(voiceProfile);
  hash.update("|");
  hash.update(payload.format ?? "wav");
  hash.update("|");
  hash.update(payload.mode ?? "callout");
  hash.update("|");
  hash.update(payload.text);
  return hash.digest("hex");
};

const readVoiceSpeakChunkCache = (cacheKey: string, nowMs: number): VoiceSpeakCacheEntry | null => {
  const cached = voiceSpeakChunkCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAtMs <= nowMs) {
    voiceSpeakChunkCache.delete(cacheKey);
    return null;
  }
  return cached;
};

const writeVoiceSpeakChunkCache = (cacheKey: string, nowMs: number, entry: Omit<VoiceSpeakCacheEntry, "expiresAtMs">): void => {
  const ttlMs = resolveVoiceChunkCacheTtlMs();
  voiceSpeakChunkCache.set(cacheKey, {
    ...entry,
    expiresAtMs: nowMs + ttlMs,
  });
};

const cleanupVoiceSpeakChunkCache = (nowMs: number): void => {
  for (const [key, entry] of voiceSpeakChunkCache.entries()) {
    if (entry.expiresAtMs <= nowMs) {
      voiceSpeakChunkCache.delete(key);
    }
  }
};

const parseIntEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseFloatEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat((value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveVoiceWavNormalizationOptions = (): VoiceWavNormalizationOptions => ({
  enabled: parseBooleanFlag(process.env.VOICE_SPEAK_NORMALIZE_ENABLED, true),
  targetPeakDbfs: parseFloatEnv(process.env.VOICE_SPEAK_TARGET_PEAK_DBFS, -2),
  targetRmsDbfs: parseFloatEnv(process.env.VOICE_SPEAK_TARGET_RMS_DBFS, -19),
  maxGainDb: parseFloatEnv(process.env.VOICE_SPEAK_MAX_GAIN_DB, 12),
  minGainDb: parseFloatEnv(process.env.VOICE_SPEAK_MIN_GAIN_DB, -12),
  minDeltaDb: parseFloatEnv(process.env.VOICE_SPEAK_MIN_DELTA_DB, 0.6),
});

const resolveVoiceMp3NormalizationOptions = (): VoiceMp3NormalizationOptions => ({
  enabled: parseBooleanFlag(process.env.VOICE_SPEAK_MP3_NORMALIZE_ENABLED, true),
  ffmpegPath: process.env.VOICE_SPEAK_MP3_FFMPEG_PATH?.trim() || undefined,
  bitrateKbps: parseIntEnv(process.env.VOICE_SPEAK_MP3_BITRATE_KBPS, 128),
});

const resolveBudgetConfig = () => ({
  missionWindowMs: parseIntEnv(process.env.VOICE_BUDGET_MISSION_WINDOW_MS, 60_000),
  missionMaxRequests: parseIntEnv(process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS, 12),
  tenantDailyMaxRequests: parseIntEnv(process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS, 500),
});

const currentDayKey = (nowMs: number): string => new Date(nowMs).toISOString().slice(0, 10);

type BudgetRejection = {
  scope: "mission_window" | "tenant_day";
  limit: number;
  windowMs?: number;
  tenantId: string;
};

const checkAndRecordBudget = (missionId: string | undefined, tenantId: string, nowMs: number): BudgetRejection | null => {
  const cfg = resolveBudgetConfig();

  if (missionId) {
    const windowStart = nowMs - cfg.missionWindowMs;
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
    next.push(nowMs);
    missionBudgetWindow.set(missionId, next);
  }

  const day = currentDayKey(nowMs);
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

const isCircuitBreakerOpen = (nowMs: number): boolean => circuitBreaker.openedUntil > nowMs;

const recordBackendFailure = (nowMs: number): void => {
  const now = nowMs;
  const windowStart = now - BREAKER_FAILURE_WINDOW_MS;
  const next = circuitBreaker.recentFailures.filter((ts) => ts >= windowStart);
  next.push(nowMs);
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

const missionRateAllowed = (missionId: string | undefined, nowMs: number): boolean => {
  if (!missionId) return true;
  const windowStart = nowMs - 15_000;
  const existing = missionWindow.get(missionId) ?? [];
  const next = existing.filter((ts) => ts >= windowStart);
  if (next.length >= 2) {
    missionWindow.set(missionId, next);
    return false;
  }
  next.push(nowMs);
  missionWindow.set(missionId, next);
  return true;
};

const dedupeSuppressed = (payload: VoiceRequest, nowMs: number): boolean => {
  const key = payload.dedupe_key?.trim() || payload.eventId?.trim();
  if (!key) return false;
  const until = dedupeUntil.get(key) ?? 0;
  if (until > nowMs) return true;
  const cooldownMs = COOLDOWN_SECONDS[payload.priority] * 1000;
  dedupeUntil.set(key, nowMs + cooldownMs);
  return false;
};

const buildOperatorCalloutCandidate = (payload: VoiceRequest, textCertainty: CertaintyClass, voiceCertainty: CertaintyClass) => ({
  kind: OPERATOR_CALLOUT_V1_KIND,
  deterministic: payload.deterministic ?? true,
  suppressed: false,
  text: {
    certainty: textCertainty,
    message: payload.text,
  },
  voice: {
    certainty: voiceCertainty,
    message: payload.text,
  },
});

const suppressionEnvelope = (reason: string) => ({
  reason,
  suppression_reason: reason,
});

const buildInlineAudioDataUri = (file: Express.Multer.File): string => {
  const mimeType = file.mimetype?.trim() || "audio/webm";
  return `data:${mimeType};base64,${file.buffer.toString("base64")}`;
};

type VoiceTranscriptionHandlerResult = {
  text?: string;
  language?: string;
  duration_ms?: number;
  segments?: unknown[];
  confidence?: number;
  confidence_reason?: string;
  needs_confirmation?: boolean;
  translation_uncertain?: boolean;
  essence_id?: string;
  model?: string;
  mode?: string;
  task?: string;
  backend_url?: string;
};

type VoiceTranscriptionResult = {
  text?: string;
  language?: string;
  duration_ms?: number;
  segments?: unknown[];
  confidence?: number;
  confidence_reason?: string;
  needs_confirmation?: boolean;
  translation_uncertain?: boolean;
  essence_id?: string;
  source_text?: string;
  source_language?: string;
  translated?: boolean;
  engine: TranscriptionEngine;
};

type SttFailure = {
  backend: SttBackendKind;
  engine: TranscriptionEngine;
  message: string;
  status?: number;
  retryable: boolean;
};

const backendEngine = (backend: ResolvedSttBackend): TranscriptionEngine => {
  if (backend.kind === "openai") return "openai_transcribe";
  if (backend.kind === "local") return "faster_whisper_local";
  return "whisper_http";
};

const inferStatusCode = (message: string): number | undefined => {
  const match = message.match(/STT HTTP (\d{3})/i);
  if (match) {
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const classifySttFailure = (backend: ResolvedSttBackend, error: unknown): SttFailure => {
  const message = error instanceof Error ? error.message : String(error);
  const status = inferStatusCode(message);
  const retryable =
    (typeof status === "number" && (status >= 500 || status === 429 || status === 408)) ||
    /tim(e)?out|temporar|unavailable|network|fetch|ECONN|ENOTFOUND|EAI_AGAIN|WHISPER_HTTP_URL not set/i.test(message);
  return {
    backend: backend.kind,
    engine: backendEngine(backend),
    message,
    status,
    retryable,
  };
};

const runHttpTask = async (args: {
  backend: ResolvedSttBackend;
  task: "transcribe" | "translate";
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  requestedLanguage?: string;
}): Promise<VoiceTranscriptionHandlerResult> => {
  const personaId = args.payload.missionId?.trim() || args.payload.traceId?.trim() || "voice.transcribe";
  const response = (await sttHttpHandler(
    {
      audio_url: buildInlineAudioDataUri(args.file),
      language: args.requestedLanguage,
      duration_ms: args.payload.durationMs,
      audio_mime: args.file.mimetype || undefined,
      audio_filename: args.file.originalname || undefined,
      backend_mode: args.backend.mode,
      backend_url: args.backend.url,
      api_key: args.backend.apiKey,
      model: args.task === "translate" ? "whisper-1" : args.backend.model,
      task: args.task,
    },
    { personaId },
  )) as VoiceTranscriptionHandlerResult;
  return response;
};

const runEmbeddedLocalTranscribe = async (args: {
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  requestedLanguage?: string;
}): Promise<VoiceTranscriptionHandlerResult> => {
  const personaId = args.payload.missionId?.trim() || args.payload.traceId?.trim() || "voice.transcribe";
  const result = (await sttWhisperHandler(
    {
      audio_base64: args.file.buffer.toString("base64"),
      language: args.requestedLanguage ?? "en",
      duration_ms: args.payload.durationMs,
    },
    { personaId },
  )) as VoiceTranscriptionHandlerResult;
  return result;
};

const runBackendTranscribe = async (args: {
  backend: ResolvedSttBackend;
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  requestedLanguage?: string;
}): Promise<VoiceTranscriptionResult> => {
  const result =
    args.backend.kind === "local" && !args.backend.url
      ? await runEmbeddedLocalTranscribe({
          file: args.file,
          payload: args.payload,
          requestedLanguage: args.requestedLanguage,
        })
      : await runHttpTask({
          backend: args.backend,
          task: "transcribe",
          file: args.file,
          payload: args.payload,
          requestedLanguage: args.requestedLanguage,
        });
  const text = typeof result.text === "string" ? result.text : "";
  const language = typeof result.language === "string" ? result.language : args.requestedLanguage;
  const segments = Array.isArray(result.segments) ? result.segments : [];
  const confidenceMeta = deriveTranscriptionConfidence({
    text,
    language,
    segments,
    providerConfidence: result.confidence,
  });
  return {
    text,
    language,
    duration_ms:
      typeof result.duration_ms === "number" ? result.duration_ms : args.payload.durationMs,
    segments,
    confidence: confidenceMeta.confidence,
    confidence_reason:
      typeof result.confidence_reason === "string" && result.confidence_reason.trim().length > 0
        ? result.confidence_reason.trim()
        : confidenceMeta.reason,
    needs_confirmation:
      typeof result.needs_confirmation === "boolean" ? result.needs_confirmation : undefined,
    translation_uncertain:
      typeof result.translation_uncertain === "boolean" ? result.translation_uncertain : undefined,
    essence_id: typeof result.essence_id === "string" ? result.essence_id : undefined,
    engine: backendEngine(args.backend),
    translated: false,
  };
};

const translateToEnglish = async (args: {
  backend: ResolvedSttBackend;
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
}): Promise<VoiceTranscriptionHandlerResult> => {
  if (args.backend.kind === "local" && !args.backend.url) {
    throw new Error("local_embedded_translation_unsupported");
  }
  return runHttpTask({
    backend: args.backend,
    task: "translate",
    file: args.file,
    payload: args.payload,
  });
};

const runVoiceTranscription = async (args: {
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  policyMode: SttPolicyMode;
  outputMode: SttOutputMode;
}): Promise<{ result?: VoiceTranscriptionResult; failures: SttFailure[] }> => {
  const backends = resolveSttBackendOrder(args.policyMode);
  const failures: SttFailure[] = [];
  const requestedLanguage = normalizeRequestedLanguage(args.payload.language);
  let selectedBackend: ResolvedSttBackend | null = null;
  let baseResult: VoiceTranscriptionResult | undefined;

  for (const backend of backends) {
    try {
      const next = await runBackendTranscribe({
        backend,
        file: args.file,
        payload: args.payload,
        requestedLanguage,
      });
      baseResult = next;
      selectedBackend = backend;
      break;
    } catch (error) {
      const failure = classifySttFailure(backend, error);
      failures.push(failure);
      if (!failure.retryable) {
        break;
      }
    }
  }

  if (!baseResult || !selectedBackend) {
    return { failures };
  }

  const sourceText = baseResult.text ?? "";
  const sourceLanguage =
    (baseResult.language ?? requestedLanguage ?? "unknown").trim().toLowerCase() || "unknown";
  const wantsEnglish = args.outputMode === "english" || args.outputMode === "dual";
  let translationUncertain = baseResult.translation_uncertain === true;
  if (wantsEnglish && sourceText && !isEnglishLikeLanguage(sourceLanguage)) {
    try {
      const translated = await translateToEnglish({
        backend: selectedBackend,
        file: args.file,
        payload: args.payload,
      });
      const translatedText = typeof translated.text === "string" ? translated.text.trim() : "";
      if (translatedText) {
        const translatedSegments = Array.isArray(translated.segments) ? translated.segments : [];
        const translatedConfidenceMeta = deriveTranscriptionConfidence({
          text: translatedText,
          language: "en",
          segments: translatedSegments,
          providerConfidence: translated.confidence,
        });
        baseResult = {
          ...baseResult,
          text: translatedText,
          language: "en",
          segments: translatedSegments.length > 0 ? translatedSegments : baseResult.segments,
          confidence:
            typeof baseResult.confidence === "number"
              ? Math.min(baseResult.confidence, translatedConfidenceMeta.confidence)
              : translatedConfidenceMeta.confidence,
          confidence_reason:
            typeof translated.confidence_reason === "string" && translated.confidence_reason.trim().length > 0
              ? translated.confidence_reason.trim()
              : translatedConfidenceMeta.reason,
          needs_confirmation:
            typeof translated.needs_confirmation === "boolean"
              ? translated.needs_confirmation
              : baseResult.needs_confirmation,
          translation_uncertain:
            typeof translated.translation_uncertain === "boolean"
              ? translated.translation_uncertain
              : translatedConfidenceMeta.confidence < STT_TRANSLATION_CONFIRM_THRESHOLD,
          source_text: sourceText,
          source_language: sourceLanguage,
          translated: true,
        };
        translationUncertain =
          baseResult.translation_uncertain === true ||
          translatedConfidenceMeta.confidence < STT_TRANSLATION_CONFIRM_THRESHOLD;
      } else if (args.outputMode === "dual") {
        baseResult = {
          ...baseResult,
          source_text: sourceText,
          source_language: sourceLanguage,
          translated: false,
        };
        translationUncertain = true;
      }
    } catch (error) {
      failures.push(classifySttFailure(selectedBackend, error));
      baseResult = {
        ...baseResult,
        source_text: sourceText,
        source_language: sourceLanguage,
        translated: false,
      };
      translationUncertain = true;
    }
  } else if (args.outputMode === "dual") {
    baseResult = {
      ...baseResult,
      source_text: sourceText,
      source_language: sourceLanguage,
      translated: false,
    };
  }

  const confidenceMeta = deriveTranscriptionConfidence({
    text: baseResult.text ?? "",
    language: baseResult.language,
    segments: Array.isArray(baseResult.segments) ? baseResult.segments : [],
    providerConfidence: baseResult.confidence,
  });
  const normalizedConfidence = confidenceMeta.confidence;
  const confidenceReason =
    typeof baseResult.confidence_reason === "string" && baseResult.confidence_reason.trim().length > 0
      ? baseResult.confidence_reason.trim()
      : confidenceMeta.reason;
  const needsConfirmation =
    (typeof baseResult.needs_confirmation === "boolean" ? baseResult.needs_confirmation : false) ||
    normalizedConfidence < STT_CONFIRM_CONFIDENCE_THRESHOLD ||
    translationUncertain;
  baseResult = {
    ...baseResult,
    confidence: normalizedConfidence,
    confidence_reason: confidenceReason,
    needs_confirmation: needsConfirmation,
    translation_uncertain: translationUncertain,
  };

  return { result: baseResult, failures };
};

voiceRouter.options("/speak", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.options("/transcribe", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.post("/transcribe", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  voiceUpload.single("audio")(req, res, async (uploadError?: unknown) => {
    const rawTraceId = typeof req.body?.traceId === "string" ? req.body.traceId.trim() : undefined;
    const traceId = rawTraceId || undefined;
    if (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Audio upload failed.";
      return errorEnvelope(
        res,
        400,
        "voice_invalid_request",
        "Invalid voice transcription upload.",
        { message },
        traceId,
      );
    }

    if (!voiceTranscriptionEnabled()) {
      return errorEnvelope(
        res,
        503,
        "voice_unavailable",
        "Voice transcription is disabled.",
        { transcriptionEnabled: false },
        traceId,
      );
    }

    const parsed = transcribeRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return errorEnvelope(
        res,
        400,
        "voice_invalid_request",
        "Invalid voice transcription payload.",
        { issues: parsed.error.flatten() },
        traceId,
      );
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file?.buffer || file.buffer.length === 0) {
      return errorEnvelope(
        res,
        400,
        "voice_invalid_request",
        "Audio upload is required.",
        { field: "audio" },
        parsed.data.traceId,
      );
    }

    const policyMode = resolveSttPolicyMode();
    const outputMode = resolveSttOutputMode();
    const configuredBackends = resolveSttBackendOrder(policyMode);
    if (configuredBackends.length === 0) {
      return errorEnvelope(
        res,
        503,
        "voice_unavailable",
        "Voice transcription backend is not configured.",
        {
          policyMode,
          outputMode,
          backendConfigured: false,
          requiredEnv: ["WHISPER_HTTP_API_KEY|OPENAI_API_KEY|LLM_HTTP_API_KEY", "STT_LOCAL_URL"],
        },
        parsed.data.traceId,
      );
    }

    const { result, failures } = await runVoiceTranscription({
      file,
      payload: parsed.data,
      policyMode,
      outputMode,
    });
    if (!result) {
      return errorEnvelope(
        res,
        502,
        "voice_backend_error",
        "Voice transcription failed.",
        {
          policyMode,
          outputMode,
          attempts: failures.map((entry) => ({
            backend: entry.backend,
            engine: entry.engine,
            status: entry.status ?? null,
            retryable: entry.retryable,
            message: entry.message,
          })),
        },
        parsed.data.traceId,
      );
    }

    return res.status(200).json({
      ok: true,
      text: result.text ?? "",
      language: result.language ?? parsed.data.language ?? "en",
      duration_ms:
        typeof result.duration_ms === "number"
          ? result.duration_ms
          : parsed.data.durationMs ?? 0,
      segments: Array.isArray(result.segments) ? result.segments : [],
      source_text: result.source_text ?? null,
      source_language: result.source_language ?? null,
      translated: result.translated ?? false,
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      confidence_reason: result.confidence_reason ?? null,
      needs_confirmation: result.needs_confirmation ?? false,
      translation_uncertain: result.translation_uncertain ?? false,
      traceId: parsed.data.traceId ?? null,
      missionId: parsed.data.missionId ?? null,
      engine: result.engine,
      essence_id: result.essence_id ?? null,
    });
  });
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
  const policyNowMs = resolvePolicyNowMs(payload);
  if (payload.mode === "callout") {
    const contextEligibility = evaluateSharedEligibility({
      contextTier: payload.contextTier,
      sessionState: payload.sessionState,
      voiceMode: payload.voiceMode,
      classification: payload.priority,
    });
    if (!contextEligibility.emitVoice) {
      return res
        .status(200)
        .json({ ok: true, suppressed: true, ...suppressionEnvelope("voice_context_ineligible"), traceId: payload.traceId ?? null });
    }
  }
  const repoAttributedEffective = payload.repoAttributed ?? Boolean(payload.missionId && payload.mode === "callout");
  const textCertainty = payload.textCertainty ?? PRIORITY_TO_CERTAINTY[payload.priority];
  const voiceCertainty = payload.voiceCertainty ?? PRIORITY_TO_CERTAINTY[payload.priority];
  const parity = enforceCalloutParity({
    textCertainty,
    voiceCertainty,
    deterministic: payload.deterministic ?? true,
    evidenceRefs: payload.evidenceRefs ?? [],
    requireEvidence: repoAttributedEffective,
  });
  if (!parity.allowed) {
    return res.status(200).json({
      ok: true,
      suppressed: true,
      ...suppressionEnvelope(parity.reason),
      traceId: payload.traceId ?? null,
      replayMeta: parity.metadata,
    });
  }

  const operatorCalloutCandidate = buildOperatorCalloutCandidate(payload, textCertainty, voiceCertainty);
  const operatorCalloutValidation = validateOperatorCalloutV1(operatorCalloutCandidate);
  if (!operatorCalloutValidation.ok) {
    const firstError = operatorCalloutValidation.errors[0];
    return res.status(200).json({
      ok: true,
      suppressed: true,
      ...suppressionEnvelope("contract_violation"),
      traceId: payload.traceId ?? null,
      debug: {
        validator_failed: true,
        validator_error_count: operatorCalloutValidation.errors.length,
        first_validator_error_code: firstError?.code ?? "UNKNOWN",
        first_validator_error_path: firstError?.path ?? "unknown",
      },
    });
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

  const budgetRejection = checkAndRecordBudget(payload.missionId, tenantId, policyNowMs);
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

  if (payload.mode === "callout" && !missionRateAllowed(payload.missionId, policyNowMs)) {
    return errorEnvelope(
      res,
      429,
      "voice_rate_limited",
      "Mission voice rate limit exceeded.",
      { windowSeconds: 15, maxCallouts: 2 },
      traceId,
    );
  }

  if (payload.mode === "callout" && dedupeSuppressed(payload, policyNowMs)) {
    return res.status(200).json({
      ok: true,
      suppressed: true,
      ...suppressionEnvelope("dedupe_cooldown"),
      traceId,
      missionId: payload.missionId,
      eventId: payload.eventId,
    });
  }

  const dryRun = String(process.env.VOICE_PROXY_DRY_RUN ?? "0").trim() === "1";
  const baseUrl = process.env.TTS_BASE_URL?.trim();
  const requestedVoiceProfile = resolveRequestedVoiceProfile(payload);
  const elevenLabsRequested = isElevenLabsProvider(provider);
  const elevenLabsConfig = elevenLabsRequested ? resolveElevenLabsConfig(requestedVoiceProfile) : null;

  if (dryRun) {
    return res.status(200).json({
      ok: true,
      dryRun: true,
      provider: "dry-run",
      voiceProfile: requestedVoiceProfile ?? "default",
      metering: {
        ...metering,
        durationMs: payload.durationMs ?? Math.max(250, payload.text.length * 45),
      },
      traceId,
    });
  }

  if (elevenLabsRequested && !elevenLabsConfig) {
    return errorEnvelope(
      res,
      503,
      "voice_unavailable",
      "ElevenLabs voice service is not configured.",
      {
        providerConfigured: false,
        provider,
        requiredEnv: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID|voice_profile_id"],
      },
      traceId,
    );
  }

  if (!elevenLabsRequested && !baseUrl) {
    return errorEnvelope(
      res,
      503,
      "voice_unavailable",
      "Voice service is not configured.",
      { providerConfigured: false, provider },
      traceId,
    );
  }

  if (isCircuitBreakerOpen(policyNowMs)) {
    const retryAfterMs = Math.max(0, circuitBreaker.openedUntil - policyNowMs);
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
  const maxAttempts = 2;
  const resolvedProfileHeader = requestedVoiceProfile ?? "default";
  cleanupVoiceSpeakChunkCache(policyNowMs);
  const cacheKey = createVoiceSpeakCacheKey(payload, provider, resolvedProfileHeader);
  const cached = readVoiceSpeakChunkCache(cacheKey, policyNowMs);
  if (cached) {
    res.setHeader("content-type", cached.contentType);
    res.setHeader("x-voice-provider", cached.providerHeader);
    res.setHeader("x-voice-profile", cached.profileHeader);
    res.setHeader("x-voice-cache", "hit");
    if (cached.normalizationHeader) {
      res.setHeader("x-voice-normalization", cached.normalizationHeader);
    }
    if (cached.normalizationGainDbHeader) {
      res.setHeader("x-voice-normalization-gain-db", cached.normalizationGainDbHeader);
    }
    if (payload.watermark_mode) {
      res.setHeader("x-watermark-mode", payload.watermark_mode);
    }
    res.setHeader("x-voice-meter-request-count", String(metering.requestCount));
    res.setHeader("x-voice-meter-char-count", String(metering.charCount));
    if (cached.durationHeader) {
      res.setHeader("x-voice-meter-duration-ms", cached.durationHeader);
    }
    return res.status(200).send(cached.buffer);
  }

  const attempts: VoiceSynthFetchFailure[] = [];
  let success: VoiceSynthFetchSuccess | null = null;

  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (elevenLabsRequested) {
        const config = elevenLabsConfig as ElevenLabsConfig;
        const response = await fetch(`${config.baseUrl}/v1/text-to-speech/${encodeURIComponent(config.voiceId)}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "audio/mpeg",
            "xi-api-key": config.apiKey,
          },
          body: JSON.stringify({
            text: payload.text,
            model_id: config.modelId,
            output_format: config.outputFormat,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const responseText = await response.text().catch(() => "");
          const retryable = isRetryableVoiceStatus(response.status);
          attempts.push({
            status: response.status >= 500 ? 502 : response.status,
            provider: "elevenlabs",
            message: "Voice backend returned an error response.",
            body: clipBackendErrorDetail(responseText),
            retryable,
          });
          if (retryable && attemptIndex < maxAttempts - 1) {
            await waitWithJitter(attemptIndex);
            continue;
          }
          break;
        }
        const contentType = response.headers.get("content-type") ?? "audio/mpeg";
        const durationHeader = response.headers.get("x-audio-duration-ms") ?? (payload.durationMs ? String(payload.durationMs) : "");
        success = {
          contentType,
          durationHeader,
          providerHeader: "elevenlabs",
          profileHeader: config.voiceId,
          buffer: Buffer.from(await response.arrayBuffer()),
        };
        break;
      }

      const upstream = await fetch(`${(baseUrl as string).replace(/\/+$/, "")}/speak`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          provider,
          ...(requestedVoiceProfile ? { voiceProfile: requestedVoiceProfile } : {}),
        }),
        signal: controller.signal,
      });

      if (!upstream.ok) {
        const responseText = await upstream.text().catch(() => "");
        const retryable = isRetryableVoiceStatus(upstream.status);
        attempts.push({
          status: upstream.status >= 500 ? 502 : upstream.status,
          provider: "proxy",
          message: "Voice backend returned an error response.",
          body: clipBackendErrorDetail(responseText),
          retryable,
        });
        if (retryable && attemptIndex < maxAttempts - 1) {
          await waitWithJitter(attemptIndex);
          continue;
        }
        break;
      }

      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const durationHeader = upstream.headers.get("x-audio-duration-ms") ?? (payload.durationMs ? String(payload.durationMs) : "");
      success = {
        contentType,
        durationHeader,
        providerHeader: "proxy",
        profileHeader: resolvedProfileHeader,
        buffer: Buffer.from(await upstream.arrayBuffer()),
      };
      break;
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      attempts.push({
        status: aborted ? 504 : 502,
        provider: elevenLabsRequested ? "elevenlabs" : "proxy",
        message: aborted ? "Voice backend timed out." : "Voice backend request failed.",
        body: clipBackendErrorDetail(error instanceof Error ? error.message : String(error)),
        retryable: true,
      });
      if (attemptIndex < maxAttempts - 1) {
        await waitWithJitter(attemptIndex);
        continue;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!success) {
    recordBackendFailure(policyNowMs);
    const finalAttempt = attempts[attempts.length - 1];
    return errorEnvelope(
      res,
      finalAttempt?.status ?? 502,
      finalAttempt?.status === 504 ? "voice_backend_timeout" : "voice_backend_error",
      finalAttempt?.message ?? "Voice backend request failed.",
      {
        timeoutMs,
        attempts: attempts.map((entry, index) => ({
          attempt: index + 1,
          provider: entry.provider,
          status: entry.status,
          retryable: entry.retryable,
          body: entry.body,
        })),
      },
      traceId,
    );
  }

  const normalization = await normalizeVoiceBuffer({
    buffer: success.buffer,
    contentType: success.contentType,
    wavOptions: resolveVoiceWavNormalizationOptions(),
    mp3Options: resolveVoiceMp3NormalizationOptions(),
  });
  const normalizationHeader =
    normalization.applied
      ? `${normalization.codec}_applied`
      : `skipped:${normalization.reason}`;
  const normalizationGainDbHeader =
    normalization.applied ? normalization.gainDb.toFixed(2) : "";

  writeVoiceSpeakChunkCache(cacheKey, policyNowMs, {
    contentType: success.contentType,
    providerHeader: success.providerHeader,
    profileHeader: success.profileHeader,
    durationHeader: success.durationHeader,
    normalizationHeader,
    normalizationGainDbHeader,
    buffer: normalization.buffer,
  });
  recordBackendSuccess();
  res.setHeader("content-type", success.contentType);
  res.setHeader("x-voice-provider", success.providerHeader);
  res.setHeader("x-voice-profile", success.profileHeader);
  res.setHeader("x-voice-cache", "miss");
  res.setHeader("x-voice-normalization", normalizationHeader);
  if (normalizationGainDbHeader) {
    res.setHeader("x-voice-normalization-gain-db", normalizationGainDbHeader);
  }
  if (payload.watermark_mode) {
    res.setHeader("x-watermark-mode", payload.watermark_mode);
  }
  res.setHeader("x-voice-meter-request-count", String(metering.requestCount));
  res.setHeader("x-voice-meter-char-count", String(metering.charCount));
  if (success.durationHeader) {
    res.setHeader("x-voice-meter-duration-ms", success.durationHeader);
  }
  return res.status(200).send(normalization.buffer);
});

const resetVoiceRouteState = () => {
  dedupeUntil.clear();
  missionWindow.clear();
  missionBudgetWindow.clear();
  tenantBudgetDaily.clear();
  voiceSpeakChunkCache.clear();
  circuitBreaker.openedUntil = 0;
  circuitBreaker.recentFailures = [];
};

export { voiceRouter, resetVoiceRouteState };
