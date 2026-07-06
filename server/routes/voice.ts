import express, { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { enforceCalloutParity, type CertaintyClass } from "../../shared/helix-dottie-callout-contract";
import { evaluateCalloutEligibility as evaluateSharedEligibility } from "../../shared/callout-eligibility";
import { authorizeDotVoiceSource } from "../../shared/helix-dot-voice-authority";
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
import {
  isSttInvalidFormatMessage,
  recoverSttInvalidFormatToPcmWav,
} from "../services/audio/stt-format-recovery";
import {
  HELIX_LANG_SCHEMA_VERSION,
  canonicalTermPreservationRatio,
  enforceCanonicalTermPreservation,
  normalizeLanguageTag,
} from "../services/helix-ask/multilang";
import {
  HELIX_INTERPRETER_SCHEMA_VERSION,
  readHelixAskInterpreterConfigFromEnv,
  runHelixAskInterpreter,
  shouldRunHelixAskInterpreter,
  type HelixAskInterpreterArtifact,
  type HelixAskInterpreterStatus,
} from "../services/helix-ask/interpreter";
import {
  HELIX_VOICE_COMMAND_LANE_VERSION,
  runVoiceCommandArbiter,
  type VoiceCommandLaneResult,
} from "../services/voice-command/command-arbiter";
import { buildHelixAudioIdentityResult } from "../services/audio-identity/transcript-attribution";
import {
  applySpeakerSession,
  getSpeakerSessionSnapshot,
  resetSpeakerSessionRegistry,
  resolveAudioIdentitySessionId,
  trustSessionSpeaker,
} from "../services/audio-identity/speaker-session";
import {
  readDiarizationConfigFromEnv,
  runDiarizationShadow,
} from "../services/audio-identity/diarization-shadow";
import {
  resolveHelixSpeakerColorToken,
  type HelixAudioIdentityResult,
  type HelixSpeakerAuthority,
  type HelixSpeakerAuthoritySource,
  type HelixSpeakerLabel,
  type HelixSpeakerRole,
  type HelixSpeakerSegment,
} from "../../shared/helix-audio-identity";
import type { HelixDiarizationShadowResult } from "../../shared/helix-diarization";
import {
  createVoiceLaneBreadcrumbId,
  readVoiceLaneRequestSummary,
  writeVoiceLaneBreadcrumb,
} from "../services/diagnostics/voice-lane-crash-breadcrumbs";
import {
  runtimeMemoryGovernor,
  type RuntimeAdmissionDecision,
  type RuntimeTaskLease,
} from "../services/runtime/runtime-memory-governor";
import type { HelixAgentProvider } from "../services/helix-ask/agent-providers/types";
import { runSpeechToTextTranscribeAudio } from "../services/helix-ask/capability-lanes/speech-to-text";

type VoicePriority = "info" | "warn" | "critical" | "action";

const voiceRouter = Router();
const voiceTranscribeLaneProvider: HelixAgentProvider = {
  id: "helix",
  label: "Helix voice transcription route",
  permissionProfile: {
    id: "helix-native",
    label: "Helix native governed runtime",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: false,
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: "helix",
    response_type: "voice_transcribe_lane_provider",
    final_status: "not_invoked",
  }),
};
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
  chunkKind: z.enum(["brief", "final", "tool_receipt", "manual_read_aloud", "translation_relay", "narrator_read", "panel_narration"]).optional(),
  turnKey: z.string().trim().max(200).optional(),
  textCertainty: z.enum(["unknown", "hypothesis", "reasoned", "confirmed"]).optional(),
  voiceCertainty: z.enum(["unknown", "hypothesis", "reasoned", "confirmed"]).optional(),
  deterministic: z.boolean().optional(),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).max(32).optional(),
  repoAttributed: z.boolean().optional(),
  replayMode: z.boolean().optional(),
  streaming: z.boolean().optional(),
  policyTsMs: z.number().int().nonnegative().optional(),
  tsMs: z.number().int().nonnegative().optional(),
  voiceAuthorityState: z
    .enum(["transcribe_only", "status_voice", "callout_voice", "command_confirm", "command_execute"])
    .optional(),
  terminal_answer_authority: z.unknown().optional(),
  accepted_arbitration_candidate: z.unknown().optional(),
  sourceKind: z.string().trim().min(1).max(120).optional(),
  sourceTextHash: z.string().trim().min(1).max(256).optional(),
  terminal_voice_text_hash: z.string().trim().min(1).max(256).optional(),
  threadId: z.string().trim().min(1).max(200).optional(),
  turnId: z.string().trim().min(1).max(200).optional(),
});

type VoiceRequest = z.infer<typeof requestSchema>;

const booleanFormField = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true") return true;
    if (normalized === "0" || normalized === "false") return false;
  }
  return undefined;
}, z.boolean().optional());

const stringArrayFormField = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((entry): entry is string => typeof entry === "string")
            .map((entry) => entry.trim())
            .filter(Boolean);
        }
      } catch {
        return trimmed.split(",").map((entry) => entry.trim()).filter(Boolean);
      }
    }
    return trimmed.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return undefined;
}, z.array(z.string().trim().min(1).max(120)).max(64).optional());

const transcribeRequestSchema = z.object({
  language: z.string().trim().min(1).max(32).optional(),
  traceId: z.string().trim().max(200).optional(),
  missionId: z.string().trim().max(200).optional(),
  mission_id: z.string().trim().max(200).optional(),
  room_id: z.string().trim().max(200).optional(),
  thread_id: z.string().trim().max(200).optional(),
  capture_session_id: z.string().trim().max(200).optional(),
  chunk_index: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : undefined;
    }
    return undefined;
  }, z.number().int().nonnegative().max(1_000_000).optional()),
  capture_source: z
    .enum([
      "mic",
      "display_tab_audio",
      "display_window_audio",
      "display_screen_audio",
      "system_loopback",
    ])
    .optional(),
  command_lane_enabled: booleanFormField,
  speaker_identity_enabled: booleanFormField,
  speaker_policy_mode: z
    .enum(["profile_only", "trusted_session", "any_speaker", "transcribe_only"])
    .optional(),
  known_speaker_ids: stringArrayFormField,
  active_listener_speaker_ids: stringArrayFormField,
  unknown_speaker_behavior: z
    .enum(["ignore", "transcribe_only", "ask_to_add"])
    .optional(),
  audio_identity_session_id: z.string().trim().min(1).max(200).optional(),
  speaker_id: z.string().trim().min(1).max(64).optional(),
  speaker_role: z
    .enum(["owner", "trusted_guest", "guest", "unknown", "device_audio"])
    .optional(),
  speaker_authority: z
    .enum(["command_allowed", "command_confirm", "transcribe_only", "ignored"])
    .optional(),
  overlapping_speech: booleanFormField,
  speaker_confidence: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }, z.number().min(0).max(1).optional()),
  speech_probability: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }, z.number().min(0).max(1).optional()),
  snr_db: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }, z.number().min(-80).max(80).optional()),
  confirm_auto_eligible: z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "1" || normalized === "true") return true;
      if (normalized === "0" || normalized === "false") return false;
    }
    return undefined;
  }, z.boolean().optional()),
  confirm_block_reason: z.string().trim().max(120).optional(),
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

const voiceMemoryPressureDetails = (admission: RuntimeAdmissionDecision): Record<string, unknown> => ({
  reason: admission.reason,
  heapUsedMiB: Math.round(admission.memory.heapUsedMiB),
  rssMiB: Math.round(admission.memory.rssMiB),
  maxHeapUsedMiB: admission.limits.maxHeapUsedMiB,
  maxRssMiB: admission.limits.maxRssMiB,
  pausedTaskCount: admission.pausedTaskCount,
  activeTaskCount: admission.activeTaskCount,
});

const releaseVoiceTranscribeLease = (
  lease: RuntimeTaskLease | undefined,
  outcome: "completed" | "failed" | "rejected" | "aborted",
): void => {
  lease?.release(outcome);
};

const speakerSessionTrustSchema = z.object({
  session_id: z.string().trim().min(1).max(200).optional(),
  audio_identity_session_id: z.string().trim().min(1).max(200).optional(),
  capture_session_id: z.string().trim().min(1).max(200).optional(),
  room_id: z.string().trim().max(200).optional(),
  thread_id: z.string().trim().max(200).optional(),
  speaker_id: z.string().trim().min(1).max(120),
  display_name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["owner", "trusted_guest", "guest"]).optional(),
  authority: z
    .enum(["command_allowed", "command_confirm", "transcribe_only", "ignored"])
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
});

type SpeakerSessionTrustRequest = z.infer<typeof speakerSessionTrustSchema>;

const resolveTranscribeMissionId = (payload: VoiceTranscribeRequest): string | undefined =>
  payload.mission_id?.trim() || payload.missionId?.trim() || undefined;

const resolveTrustRequestSessionId = (payload: SpeakerSessionTrustRequest): string =>
  resolveAudioIdentitySessionId({
    audioIdentitySessionId: payload.audio_identity_session_id ?? payload.session_id,
    captureSessionId: payload.capture_session_id,
    roomId: payload.room_id,
    threadId: payload.thread_id,
  });

const buildSuppressedTranscribeCommandLane = (args: {
  traceId?: string | null;
  captureSessionId?: string | null;
  chunkIndex?: number | null;
  suppressionReason: "disabled" | "non_user_audio_source";
}): VoiceCommandLaneResult => ({
  version: HELIX_VOICE_COMMAND_LANE_VERSION,
  decision: "none",
  action: null,
  confidence: null,
  source: "none",
  suppression_reason: args.suppressionReason,
  strict_prefix_applied: false,
  confirm_required: false,
  utterance_id: [
    args.suppressionReason,
    args.traceId?.trim() || "trace",
    args.captureSessionId?.trim() || "capture",
    typeof args.chunkIndex === "number" && Number.isFinite(args.chunkIndex)
      ? String(Math.max(0, Math.round(args.chunkIndex)))
      : "chunk",
  ].join(":"),
});

const shouldRunTranscribeCommandLane = (payload: VoiceTranscribeRequest): boolean =>
  (payload.capture_source ?? "mic") === "mic" && payload.command_lane_enabled !== false;


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
type SttRateLimitSource = "provider_429" | "local_cooldown";

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
  undefined;

const resolveOpenAiSttAuthKey = (): string | undefined =>
  process.env.OPENAI_API_KEY?.trim() || undefined;

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

const readConfidenceThreshold = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return clamp01(fallback);
  return clamp01(parsed);
};

const HELIX_ASK_LANG_CONF_AUTO_MIN = readConfidenceThreshold(
  process.env.HELIX_ASK_LANG_CONF_AUTO_MIN,
  0.85,
);
const HELIX_ASK_LANG_CONF_MIN = readConfidenceThreshold(
  process.env.HELIX_ASK_LANG_CONF_MIN,
  0.7,
);
const HELIX_ASK_PIVOT_CONF_AUTO_MIN = readConfidenceThreshold(
  process.env.HELIX_ASK_PIVOT_CONF_AUTO_MIN,
  0.82,
);
const HELIX_ASK_PIVOT_CONF_BLOCK_MIN = readConfidenceThreshold(
  process.env.HELIX_ASK_PIVOT_CONF_BLOCK_MIN,
  0.68,
);
const HELIX_ASK_CODEMIX_PRIMARY_SHARE_MAX = readConfidenceThreshold(
  process.env.HELIX_ASK_CODEMIX_PRIMARY_SHARE_MAX,
  0.8,
);
const HELIX_ASK_CODEMIX_SECONDARY_SHARE_MIN = readConfidenceThreshold(
  process.env.HELIX_ASK_CODEMIX_SECONDARY_SHARE_MIN,
  0.2,
);
const HELIX_ASK_INTERPRETER_CONFIG = readHelixAskInterpreterConfigFromEnv();
const HELIX_ASK_INTERPRETER_EVALUATE =
  HELIX_ASK_INTERPRETER_CONFIG.enabled || HELIX_ASK_INTERPRETER_CONFIG.logOnly;
const HELIX_ASK_INTERPRETER_ACTIVE =
  HELIX_ASK_INTERPRETER_CONFIG.enabled && !HELIX_ASK_INTERPRETER_CONFIG.logOnly;
const INTERPRETER_FAIL_CLOSED_STATUSES = new Set<HelixAskInterpreterStatus>([
  "timeout",
  "parse_error",
  "provider_error",
]);

const shouldForceInterpreterFailClosed = (args: {
  artifact: HelixAskInterpreterArtifact | null;
  status: HelixAskInterpreterStatus | null;
  error: string | null;
  sourceLanguage: string | null;
  codeMixed: boolean;
}): boolean => {
  if (!HELIX_ASK_INTERPRETER_ACTIVE) return false;
  if (args.artifact) return false;
  if (
    !shouldRunHelixAskInterpreter({
      sourceLanguage: args.sourceLanguage,
      codeMixed: args.codeMixed,
    })
  ) {
    return false;
  }
  if (args.status && INTERPRETER_FAIL_CLOSED_STATUSES.has(args.status)) {
    return true;
  }
  return Boolean(args.error && args.error.trim());
};

type ScriptFamily = "latin" | "cjk" | "arabic" | "cyrillic" | "other";

const expectedScriptFamily = (language: string | undefined): ScriptFamily => {
  const normalized = normalizeLanguageTag(language);
  if (!normalized) return "other";
  if (normalized === "zh" || normalized.startsWith("zh-") || normalized === "ja" || normalized.startsWith("ja-") || normalized === "ko" || normalized.startsWith("ko-")) {
    return "cjk";
  }
  if (normalized === "ar" || normalized.startsWith("ar-")) return "arabic";
  if (
    normalized === "ru" ||
    normalized.startsWith("ru-") ||
    normalized === "uk" ||
    normalized.startsWith("uk-") ||
    normalized === "bg" ||
    normalized.startsWith("bg-")
  ) {
    return "cyrillic";
  }
  if (normalized === "unknown") return "other";
  return "latin";
};

const scriptForChar = (char: string): ScriptFamily => {
  if (/[A-Za-z]/.test(char)) return "latin";
  if (/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF]/u.test(char)) return "cjk";
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(char)) return "arabic";
  if (/[\u0400-\u04FF]/u.test(char)) return "cyrillic";
  return "other";
};

type ScriptStats = {
  totalLetters: number;
  shares: Record<ScriptFamily, number>;
  primary: ScriptFamily;
  secondary: ScriptFamily;
  primaryShare: number;
  secondaryShare: number;
};

const analyzeScriptStats = (text: string): ScriptStats => {
  const counts: Record<ScriptFamily, number> = {
    latin: 0,
    cjk: 0,
    arabic: 0,
    cyrillic: 0,
    other: 0,
  };
  for (const char of text) {
    if (!/\S/u.test(char)) continue;
    counts[scriptForChar(char)] += 1;
  }
  const totalLetters = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const shares: Record<ScriptFamily, number> = {
    latin: totalLetters > 0 ? counts.latin / totalLetters : 0,
    cjk: totalLetters > 0 ? counts.cjk / totalLetters : 0,
    arabic: totalLetters > 0 ? counts.arabic / totalLetters : 0,
    cyrillic: totalLetters > 0 ? counts.cyrillic / totalLetters : 0,
    other: totalLetters > 0 ? counts.other / totalLetters : 0,
  };
  const ranked = (Object.keys(shares) as ScriptFamily[]).sort((a, b) => shares[b] - shares[a]);
  const primary = ranked[0] ?? "other";
  const secondary = ranked[1] ?? "other";
  return {
    totalLetters,
    shares,
    primary,
    secondary,
    primaryShare: shares[primary] ?? 0,
    secondaryShare: shares[secondary] ?? 0,
  };
};

const estimateLidModelConfidence = (text: string, language: string | undefined): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  let score = 0.56;
  if (trimmed.length >= 16) score += 0.08;
  if (trimmed.length >= 40) score += 0.08;
  if (trimmed.length >= 80) score += 0.04;
  if (/[.!?。！？]$/.test(trimmed)) score += 0.05;
  if (!normalizeLanguageTag(language)) score -= 0.12;
  return clamp01(score);
};

const estimateScriptSanityConfidence = (text: string, language: string | undefined): number => {
  const stats = analyzeScriptStats(text);
  if (stats.totalLetters <= 0) return 0.5;
  const expected = expectedScriptFamily(language);
  if (expected === "other") return 0.6;
  const expectedShare = stats.shares[expected] ?? 0;
  const primaryShare = stats.primaryShare;
  if (expectedShare >= 0.6) return clamp01(0.7 + 0.3 * expectedShare);
  if (expected === stats.primary) return clamp01(0.6 + 0.25 * primaryShare);
  return clamp01(0.35 + 0.3 * expectedShare);
};

const deriveLanguageConfidence = (args: {
  text: string;
  language: string | undefined;
  providerConfidence?: unknown;
}): number => {
  const provider = normalizeConfidenceValue(args.providerConfidence) ?? estimateTextConfidence(args.text, args.language);
  const lidModel = estimateLidModelConfidence(args.text, args.language);
  const scriptSanity = estimateScriptSanityConfidence(args.text, args.language);
  return clamp01(0.6 * provider + 0.25 * lidModel + 0.15 * scriptSanity);
};

const isCodeMixedTranscript = (text: string): boolean => {
  const stats = analyzeScriptStats(text);
  if (stats.totalLetters <= 0) return false;
  return (
    stats.primaryShare <= HELIX_ASK_CODEMIX_PRIMARY_SHARE_MAX &&
    stats.secondaryShare >= HELIX_ASK_CODEMIX_SECONDARY_SHARE_MIN
  );
};

const estimateBacktranslationSimilarity = (sourceText: string, translatedText: string): number => {
  const source = sourceText.trim();
  const target = translatedText.trim();
  if (!source || !target) return 0;
  const sourceLen = source.length;
  const targetLen = target.length;
  const lengthScore = Math.min(sourceLen, targetLen) / Math.max(sourceLen, targetLen, 1);
  const sourceSentenceCount = Math.max(1, source.split(/[.!?。！？]+/).filter(Boolean).length);
  const targetSentenceCount = Math.max(1, target.split(/[.!?。！？]+/).filter(Boolean).length);
  const sentenceScore =
    1 - Math.min(1, Math.abs(sourceSentenceCount - targetSentenceCount) / Math.max(sourceSentenceCount, targetSentenceCount, 1));
  const sourcePunctuation = (source.match(/[,:;.!?。！？]/g) ?? []).length;
  const targetPunctuation = (target.match(/[,:;.!?。！？]/g) ?? []).length;
  const punctuationScore =
    sourcePunctuation === 0 && targetPunctuation === 0
      ? 1
      : Math.min(sourcePunctuation, targetPunctuation) / Math.max(sourcePunctuation, targetPunctuation, 1);
  return clamp01(0.45 * lengthScore + 0.35 * sentenceScore + 0.2 * punctuationScore);
};

const derivePivotConfidence = (args: {
  translatorConfidence: number;
  sourceText: string;
  translatedText: string;
}): number => {
  const backtranslationSimilarity = estimateBacktranslationSimilarity(args.sourceText, args.translatedText);
  const canonicalPreservation = canonicalTermPreservationRatio(args.sourceText, args.translatedText);
  return clamp01(
    0.5 * clamp01(args.translatorConfidence) +
      0.3 * backtranslationSimilarity +
      0.2 * canonicalPreservation,
  );
};

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

type VoiceSpeakDebugEvent = {
  schema: "helix.voice_speak_debug_event.v1";
  observedAtMs: number;
  breadcrumbId: string;
  traceId: string | null;
  missionId: string | null;
  eventId: string | null;
  utteranceId: string | null;
  turnKey: string | null;
  chunkKind: VoiceRequest["chunkKind"] | null;
  narrator: boolean;
  textHash: string;
  textLength: number;
  evidenceRefCount: number;
  statusCode: number;
  outcome: "audio_response" | "metadata_response" | "error_response";
  provider: string | null;
  cache: string | null;
  contentType: string | null;
  durationMs: number;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  output_authority: "voice_transport_observation";
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
const recentVoiceSpeakDebugEvents: VoiceSpeakDebugEvent[] = [];
const MAX_RECENT_VOICE_SPEAK_DEBUG_EVENTS = 200;

type VoiceSpeakCacheEntry = {
  expiresAtMs: number;
  contentType: string;
  providerHeader: string;
  profileHeader: string;
  durationHeader: string;
  normalizationHeader: string;
  normalizationGainDbHeader: string;
  normalizationBenchmarkHeader: string;
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

const hashVoiceSpeakDebugText = (text: string): string =>
  `sha256:${createHash("sha256").update(text).digest("hex")}`;

const isNarratorVoiceChunk = (payload: VoiceRequest): boolean =>
  payload.chunkKind === "narrator_read" ||
  payload.chunkKind === "panel_narration" ||
  /^narrator[:_-]/i.test(payload.eventId?.trim() ?? "") ||
  /^narrator[:_-]/i.test(payload.utteranceId?.trim() ?? "");

const recordVoiceSpeakDebugEvent = (event: VoiceSpeakDebugEvent): void => {
  recentVoiceSpeakDebugEvents.push(event);
  if (recentVoiceSpeakDebugEvents.length > MAX_RECENT_VOICE_SPEAK_DEBUG_EVENTS) {
    recentVoiceSpeakDebugEvents.splice(
      0,
      recentVoiceSpeakDebugEvents.length - MAX_RECENT_VOICE_SPEAK_DEBUG_EVENTS,
    );
  }
};

const attachVoiceSpeakDebugRecorder = (
  res: Response,
  payload: VoiceRequest,
  breadcrumbId: string,
  startedAtMs: number,
): void => {
  res.once("finish", () => {
    const contentType = String(res.getHeader("content-type") ?? "") || null;
    const provider = String(res.getHeader("x-voice-provider") ?? "") || null;
    const cache = String(res.getHeader("x-voice-cache") ?? "") || null;
    const statusCode = res.statusCode;
    const outcome: VoiceSpeakDebugEvent["outcome"] =
      statusCode >= 400
        ? "error_response"
        : contentType?.startsWith("audio/")
          ? "audio_response"
          : "metadata_response";
    recordVoiceSpeakDebugEvent({
      schema: "helix.voice_speak_debug_event.v1",
      observedAtMs: Date.now(),
      breadcrumbId,
      traceId: payload.traceId ?? null,
      missionId: payload.missionId ?? null,
      eventId: payload.eventId ?? null,
      utteranceId: payload.utteranceId ?? null,
      turnKey: payload.turnKey ?? null,
      chunkKind: payload.chunkKind ?? null,
      narrator: isNarratorVoiceChunk(payload),
      textHash: hashVoiceSpeakDebugText(payload.text),
      textLength: payload.text.length,
      evidenceRefCount: payload.evidenceRefs?.length ?? 0,
      statusCode,
      outcome,
      provider,
      cache,
      contentType,
      durationMs: Math.max(0, Date.now() - startedAtMs),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      output_authority: "voice_transport_observation",
    });
  });
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
  targetPeakDbfs: parseFloatEnv(process.env.VOICE_SPEAK_TARGET_PEAK_DBFS, -1),
  targetRmsDbfs: parseFloatEnv(process.env.VOICE_SPEAK_TARGET_RMS_DBFS, -14),
  maxGainDb: parseFloatEnv(process.env.VOICE_SPEAK_MAX_GAIN_DB, 20),
  minGainDb: parseFloatEnv(process.env.VOICE_SPEAK_MIN_GAIN_DB, -14),
  minDeltaDb: parseFloatEnv(process.env.VOICE_SPEAK_MIN_DELTA_DB, 0.3),
});

const resolveVoiceMp3NormalizationOptions = (): VoiceMp3NormalizationOptions => ({
  enabled: parseBooleanFlag(process.env.VOICE_SPEAK_MP3_NORMALIZE_ENABLED, true),
  ffmpegPath: process.env.VOICE_SPEAK_MP3_FFMPEG_PATH?.trim() || undefined,
  bitrateKbps: parseIntEnv(process.env.VOICE_SPEAK_MP3_BITRATE_KBPS, 192),
});

const formatVoiceNormalizationBenchmarkHeader = (
  wavOptions: VoiceWavNormalizationOptions,
  mp3Options: VoiceMp3NormalizationOptions,
): string => {
  const enabled = wavOptions.enabled !== false;
  const mp3Enabled = mp3Options.enabled !== false;
  const peak = Number.isFinite(wavOptions.targetPeakDbfs as number)
    ? Number(wavOptions.targetPeakDbfs)
    : -1;
  const rms = Number.isFinite(wavOptions.targetRmsDbfs as number)
    ? Number(wavOptions.targetRmsDbfs)
    : -14;
  const maxGain = Number.isFinite(wavOptions.maxGainDb as number)
    ? Number(wavOptions.maxGainDb)
    : 20;
  const minGain = Number.isFinite(wavOptions.minGainDb as number)
    ? Number(wavOptions.minGainDb)
    : -14;
  const minDelta = Number.isFinite(wavOptions.minDeltaDb as number)
    ? Number(wavOptions.minDeltaDb)
    : 0.3;
  const bitrate = Number.isFinite(mp3Options.bitrateKbps as number)
    ? Number(mp3Options.bitrateKbps)
    : 192;
  return [
    "mobile_voice_v1",
    `enabled=${enabled ? 1 : 0}`,
    `peak=${peak.toFixed(1)}`,
    `rms=${rms.toFixed(1)}`,
    `maxGain=${maxGain.toFixed(1)}`,
    `minGain=${minGain.toFixed(1)}`,
    `minDelta=${minDelta.toFixed(1)}`,
    `mp3=${mp3Enabled ? 1 : 0}`,
    `kbps=${Math.max(0, Math.round(bitrate))}`,
  ].join(";");
};

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

const hasDotVoiceAuthorityFields = (payload: VoiceRequest): boolean =>
  Boolean(
    payload.voiceAuthorityState ||
      payload.terminal_answer_authority ||
      payload.accepted_arbitration_candidate ||
      payload.sourceKind ||
      payload.sourceTextHash ||
      payload.terminal_voice_text_hash,
  );

const isDotVoiceProfile = (value: string | undefined): boolean =>
  /\b(?:dot|dottie)\b|(?:^|[_-])(?:dot|dottie)(?:[_-]|$)/i.test(value?.trim() ?? "");

const hasDotTraceMetadata = (payload: VoiceRequest): boolean =>
  [payload.traceId, payload.missionId, payload.eventId, payload.utteranceId, payload.turnKey].some((value) =>
    /(?:^|[:_-])(?:helix|dot|dottie)(?:[:_-]|$)|^ask:/i.test(value?.trim() ?? ""),
  );

const isInterimVoiceReceiptChunk = (payload: VoiceRequest): boolean =>
  payload.chunkKind === "tool_receipt" ||
  payload.chunkKind === "translation_relay" ||
  payload.chunkKind === "narrator_read" ||
  payload.chunkKind === "panel_narration";

const hasInterimVoiceReceiptAuthority = (payload: VoiceRequest): boolean => {
  if (!isInterimVoiceReceiptChunk(payload)) return false;
  const eventId = payload.eventId?.trim() ?? "";
  const utteranceId = payload.utteranceId?.trim() ?? "";
  const traceId = payload.traceId?.trim() ?? "";
  const evidenceRefs = payload.evidenceRefs?.map((ref) => ref.trim()).filter(Boolean) ?? [];
  const isNarratorReceipt =
    (payload.chunkKind === "narrator_read" || payload.chunkKind === "panel_narration") &&
    Boolean(eventId) &&
    /^narrator[:_-]/i.test(utteranceId) &&
    (utteranceId.includes(eventId) || evidenceRefs.some((ref) => ref === eventId || ref.includes(eventId)));
  if (isNarratorReceipt) return true;
  const isInterimReceipt =
    /^helix_interim_voice_callout_receipt:/i.test(eventId) ||
    /^translation_obs:/i.test(eventId);
  if (!isInterimReceipt || !utteranceId || !traceId) return false;
  if (utteranceId.includes(eventId)) return true;
  return evidenceRefs.some((ref) => ref === eventId || ref.includes(eventId));
};

const isDotVoiceRequest = (payload: VoiceRequest): boolean => {
  if (payload.chunkKind === "manual_read_aloud") return false;
  if (hasDotVoiceAuthorityFields(payload)) return true;
  if (isDotVoiceProfile(payload.voiceProfile) || isDotVoiceProfile(payload.voice_profile_id)) return true;
  if (payload.mode === "callout" && (payload.missionId?.trim() || payload.eventId?.trim())) return true;
  return hasDotTraceMetadata(payload);
};

const buildInlineAudioDataUri = (file: Express.Multer.File): string => {
  const mimeType = file.mimetype?.trim() || "audio/webm";
  return `data:${mimeType};base64,${file.buffer.toString("base64")}`;
};

type VoiceTranscriptionHandlerResult = {
  text?: string;
  language?: string;
  language_detected?: string;
  language_confidence?: number;
  code_mixed?: boolean;
  duration_ms?: number;
  segments?: unknown[];
  confidence?: number;
  confidence_reason?: string;
  pivot_confidence?: number;
  dispatch_state?: "auto" | "confirm" | "blocked";
  needs_confirmation?: boolean;
  translation_uncertain?: boolean;
  speaker_id?: string;
  speaker_confidence?: number;
  speaker_role?: HelixSpeakerRole;
  speaker_authority?: HelixSpeakerAuthority;
  speaker_authority_source?: HelixSpeakerAuthoritySource;
  speaker_authority_reason?: string;
  speaker_segments?: HelixSpeakerSegment[];
  audio_identity?: HelixAudioIdentityResult | null;
  diarization_shadow?: HelixDiarizationShadowResult | null;
  primary_speaker_id?: string | null;
  speaker_color_token?: string | null;
  unknown_speaker_detected?: boolean;
  speech_probability?: number;
  snr_db?: number;
  confirm_auto_eligible?: boolean;
  confirm_block_reason?: string;
  lang_schema_version?: string;
  essence_id?: string;
  model?: string;
  mode?: string;
  task?: string;
  backend_url?: string;
  interpreter?: HelixAskInterpreterArtifact;
  interpreter_schema_version?: string;
  interpreter_status?: HelixAskInterpreterStatus;
  interpreter_confidence?: number;
  interpreter_dispatch_state?: "auto" | "confirm" | "blocked";
  interpreter_confirm_prompt?: string | null;
  interpreter_term_ids?: string[];
  interpreter_concept_ids?: string[];
};

type VoiceTranscriptionResult = {
  text?: string;
  language?: string;
  language_detected?: string;
  language_confidence?: number;
  code_mixed?: boolean;
  duration_ms?: number;
  segments?: unknown[];
  confidence?: number;
  confidence_reason?: string;
  pivot_confidence?: number;
  dispatch_state?: "auto" | "confirm" | "blocked";
  needs_confirmation?: boolean;
  translation_uncertain?: boolean;
  speaker_id?: string;
  speaker_confidence?: number;
  speaker_role?: HelixSpeakerRole;
  speaker_authority?: HelixSpeakerAuthority;
  speaker_authority_source?: HelixSpeakerAuthoritySource;
  speaker_authority_reason?: string;
  speaker_segments?: HelixSpeakerSegment[];
  audio_identity?: HelixAudioIdentityResult | null;
  diarization_shadow?: HelixDiarizationShadowResult | null;
  primary_speaker_id?: string | null;
  speaker_color_token?: string | null;
  unknown_speaker_detected?: boolean;
  speech_probability?: number;
  snr_db?: number;
  confirm_auto_eligible?: boolean;
  confirm_block_reason?: string;
  lang_schema_version?: string;
  essence_id?: string;
  source_text?: string;
  source_language?: string;
  translated?: boolean;
  interpreter?: HelixAskInterpreterArtifact;
  interpreter_schema_version?: string;
  interpreter_status?: HelixAskInterpreterStatus;
  interpreter_confidence?: number;
  interpreter_dispatch_state?: "auto" | "confirm" | "blocked";
  interpreter_confirm_prompt?: string | null;
  interpreter_term_ids?: string[];
  interpreter_concept_ids?: string[];
  engine: TranscriptionEngine;
};

type SttFailure = {
  backend: SttBackendKind;
  engine: TranscriptionEngine;
  message: string;
  status?: number;
  retryable: boolean;
  stage?: "primary" | "format_recovery" | "format_recovery_retry";
  retryAfterMs?: number;
  rateLimitSource?: SttRateLimitSource;
};

const backendEngine = (backend: ResolvedSttBackend): TranscriptionEngine => {
  if (backend.kind === "openai") return "openai_transcribe";
  if (backend.kind === "local") return "faster_whisper_local";
  return "whisper_http";
};

const DEFAULT_STT_429_COOLDOWN_MS = Math.max(
  250,
  Number(process.env.STT_429_COOLDOWN_MS ?? 1500),
);
const sttBackendCooldownUntil = new Map<string, number>();

const buildSttBackendCooldownKey = (backend: ResolvedSttBackend): string =>
  [
    backend.kind,
    backend.mode,
    (backend.url ?? "embedded").trim().toLowerCase(),
    (backend.model ?? "").trim().toLowerCase(),
  ].join("|");

const readSttRetryAfterMs = (message: string): number | undefined => {
  const match = message.match(/\bretry_after_ms=(\d+)\b/i);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
};

const readSttRateLimitSource = (message: string): SttRateLimitSource | undefined => {
  const match = message.match(/\brate_limit_source=(provider_429|local_cooldown)\b/i);
  if (!match) return undefined;
  const value = match[1]?.trim().toLowerCase();
  return value === "local_cooldown" ? "local_cooldown" : value === "provider_429" ? "provider_429" : undefined;
};

const getSttBackendCooldownRemainingMs = (
  backend: ResolvedSttBackend,
  nowMs: number,
): number => {
  const key = buildSttBackendCooldownKey(backend);
  const until = sttBackendCooldownUntil.get(key) ?? 0;
  if (until <= nowMs) {
    if (until > 0) sttBackendCooldownUntil.delete(key);
    return 0;
  }
  return until - nowMs;
};

const noteSttBackendCooldown = (
  backend: ResolvedSttBackend,
  nowMs: number,
  retryAfterMs?: number,
): void => {
  const delayMs =
    typeof retryAfterMs === "number" && Number.isFinite(retryAfterMs) && retryAfterMs > 0
      ? retryAfterMs
      : DEFAULT_STT_429_COOLDOWN_MS;
  sttBackendCooldownUntil.set(buildSttBackendCooldownKey(backend), nowMs + delayMs);
};

const clearSttBackendCooldown = (backend: ResolvedSttBackend): void => {
  sttBackendCooldownUntil.delete(buildSttBackendCooldownKey(backend));
};

const inferStatusCode = (message: string): number | undefined => {
  const match = message.match(/STT HTTP (\d{3})/i);
  if (match) {
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const classifySttFailure = (
  backend: ResolvedSttBackend,
  error: unknown,
  stage: SttFailure["stage"] = "primary",
): SttFailure => {
  const message = error instanceof Error ? error.message : String(error);
  const status = inferStatusCode(message);
  const retryAfterMs = readSttRetryAfterMs(message);
  const rateLimitSource = readSttRateLimitSource(message);
  const retryable =
    (typeof status === "number" && (status >= 500 || status === 429 || status === 408)) ||
    /tim(e)?out|temporar|unavailable|network|fetch|ECONN|ENOTFOUND|EAI_AGAIN|WHISPER_HTTP_URL not set/i.test(message);
  return {
    backend: backend.kind,
    engine: backendEngine(backend),
    message,
    status,
    retryable,
    stage,
    retryAfterMs,
    rateLimitSource,
  };
};

const isInvalidFormatSttFailure = (failure: SttFailure): boolean =>
  failure.status === 400 && isSttInvalidFormatMessage(failure.message);

const runHttpTask = async (args: {
  backend: ResolvedSttBackend;
  task: "transcribe" | "translate";
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  requestedLanguage?: string;
}): Promise<VoiceTranscriptionHandlerResult> => {
  const personaId = resolveTranscribeMissionId(args.payload) || args.payload.traceId?.trim() || "voice.transcribe";
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
  const personaId = resolveTranscribeMissionId(args.payload) || args.payload.traceId?.trim() || "voice.transcribe";
  const result = (await sttWhisperHandler(
    {
      audio_base64: args.file.buffer.toString("base64"),
      language: args.requestedLanguage,
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
  const language = normalizeLanguageTag(
    typeof result.language === "string" ? result.language : args.requestedLanguage ?? "unknown",
  ) ?? "unknown";
  const languageDetected = normalizeLanguageTag(
    typeof result.language_detected === "string" ? result.language_detected : language,
  ) ?? language;
  const segments = Array.isArray(result.segments) ? result.segments : [];
  const confidenceMeta = deriveTranscriptionConfidence({
    text,
    language,
    segments,
    providerConfidence: result.confidence,
  });
  const languageConfidence = deriveLanguageConfidence({
    text,
    language: languageDetected,
    providerConfidence:
      typeof result.language_confidence === "number" ? result.language_confidence : confidenceMeta.confidence,
  });
  const codeMixed = typeof result.code_mixed === "boolean" ? result.code_mixed : isCodeMixedTranscript(text);
  return {
    text,
    language,
    language_detected: languageDetected,
    language_confidence: languageConfidence,
    code_mixed: codeMixed,
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
    pivot_confidence:
      typeof result.pivot_confidence === "number" ? clamp01(result.pivot_confidence) : undefined,
    dispatch_state:
      result.dispatch_state === "blocked" || result.dispatch_state === "confirm" || result.dispatch_state === "auto"
        ? result.dispatch_state
        : undefined,
    lang_schema_version: typeof result.lang_schema_version === "string" ? result.lang_schema_version : HELIX_LANG_SCHEMA_VERSION,
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

const unavailableVoiceSpeakEnvelope = (
  res: Response,
  message: string,
  details: Record<string, unknown>,
  traceId: string | undefined,
) => {
  return res.status(200).json({
    ok: true,
    suppressed: true,
    dryRun: true,
    reason: "voice_unavailable",
    message,
    details,
    ...(traceId ? { traceId } : {}),
  });
};

const runVoiceTranscription = async (args: {
  file: Express.Multer.File;
  payload: VoiceTranscribeRequest;
  policyMode: SttPolicyMode;
  outputMode: SttOutputMode;
}): Promise<{
  result?: VoiceTranscriptionResult;
  failures: SttFailure[];
  formatRecovery: {
    attempted: boolean;
    succeeded: boolean;
    reason: string | null;
    backend: SttBackendKind | null;
    ffmpegPath: string | null;
  };
}> => {
  const backends = resolveSttBackendOrder(args.policyMode);
  const failures: SttFailure[] = [];
  const formatRecovery = {
    attempted: false,
    succeeded: false,
    reason: null as string | null,
    backend: null as SttBackendKind | null,
    ffmpegPath: null as string | null,
  };
  const requestedLanguage = normalizeRequestedLanguage(args.payload.language);
  let selectedBackend: ResolvedSttBackend | null = null;
  let baseResult: VoiceTranscriptionResult | undefined;
  let transcriptionFile: Express.Multer.File = args.file;
  let hardFailure = false;

  for (const backend of backends) {
    const cooldownNowMs = Date.now();
    const cooldownRemainingMs = getSttBackendCooldownRemainingMs(backend, cooldownNowMs);
    if (cooldownRemainingMs > 0) {
      failures.push({
        backend: backend.kind,
        engine: backendEngine(backend),
        message: `STT HTTP 429: local cooldown active retry_after_ms=${cooldownRemainingMs} rate_limit_source=local_cooldown`,
        status: 429,
        retryable: true,
        stage: "primary",
        retryAfterMs: cooldownRemainingMs,
        rateLimitSource: "local_cooldown",
      });
      continue;
    }
    try {
      const next = await runBackendTranscribe({
        backend,
        file: args.file,
        payload: args.payload,
        requestedLanguage,
      });
      baseResult = next;
      selectedBackend = backend;
      transcriptionFile = args.file;
      clearSttBackendCooldown(backend);
      break;
    } catch (error) {
      const failure = classifySttFailure(backend, error, "primary");
      failures.push(failure);
      if (failure.status === 429) {
        noteSttBackendCooldown(backend, Date.now(), failure.retryAfterMs);
      }
      if (isInvalidFormatSttFailure(failure)) {
        const recovery = await recoverSttInvalidFormatToPcmWav({
          buffer: args.file.buffer,
          originalName: args.file.originalname,
          ffmpegPath: process.env.STT_TRANSCRIBE_FFMPEG_PATH?.trim() || undefined,
          sampleRateHz: 16_000,
        });
        formatRecovery.attempted = true;
        formatRecovery.backend = backend.kind;
        formatRecovery.ffmpegPath = recovery.ffmpegPath;
        if (!recovery.ok) {
          formatRecovery.succeeded = false;
          formatRecovery.reason = recovery.reason;
          failures.push({
            backend: backend.kind,
            engine: backendEngine(backend),
            message: `stt_invalid_format_recovery_${recovery.reason}`,
            retryable: false,
            stage: "format_recovery",
          });
          hardFailure = true;
          break;
        }
        formatRecovery.succeeded = true;
        formatRecovery.reason = "recovered";
        const recoveredFile: Express.Multer.File = {
          ...args.file,
          buffer: recovery.buffer,
          size: recovery.buffer.byteLength,
          mimetype: recovery.mimeType,
          originalname: recovery.fileName,
        };
        try {
          const recoveredResult = await runBackendTranscribe({
            backend,
            file: recoveredFile,
            payload: args.payload,
            requestedLanguage,
          });
          baseResult = recoveredResult;
          selectedBackend = backend;
          transcriptionFile = recoveredFile;
          break;
        } catch (retryError) {
          const retryFailure = classifySttFailure(backend, retryError, "format_recovery_retry");
          failures.push(retryFailure);
          if (retryFailure.status === 429) {
            noteSttBackendCooldown(backend, Date.now(), retryFailure.retryAfterMs);
          }
          if (!retryFailure.retryable) {
            hardFailure = true;
          }
          if (isInvalidFormatSttFailure(retryFailure)) {
            hardFailure = true;
          }
          if (hardFailure) {
            break;
          }
          continue;
        }
      }
      if (!failure.retryable) {
        hardFailure = true;
        break;
      }
    }
    if (hardFailure) break;
  }

  if (!baseResult || !selectedBackend) {
    return { failures, formatRecovery };
  }

  const sourceText = baseResult.text ?? "";
  const sourceLanguage = normalizeLanguageTag(
    baseResult.language ?? requestedLanguage ?? "unknown",
  ) ?? "unknown";
  const wantsEnglish = args.outputMode === "english" || args.outputMode === "dual";
  let translationUncertain = baseResult.translation_uncertain === true;
  let pivotConfidence =
    typeof baseResult.pivot_confidence === "number"
      ? clamp01(baseResult.pivot_confidence)
      : isEnglishLikeLanguage(sourceLanguage)
        ? 1
        : 0.5;
  if (wantsEnglish && sourceText && !isEnglishLikeLanguage(sourceLanguage)) {
    try {
      const translated = await translateToEnglish({
        backend: selectedBackend,
        file: transcriptionFile,
        payload: args.payload,
      });
      const translatedText = typeof translated.text === "string" ? translated.text.trim() : "";
      if (translatedText) {
        const translatedTextWithCanonicalTerms = enforceCanonicalTermPreservation(sourceText, translatedText);
        const translatedSegments = Array.isArray(translated.segments) ? translated.segments : [];
        const translatedConfidenceMeta = deriveTranscriptionConfidence({
          text: translatedTextWithCanonicalTerms,
          language: "en",
          segments: translatedSegments,
          providerConfidence: translated.confidence,
        });
        pivotConfidence = derivePivotConfidence({
          translatorConfidence: translatedConfidenceMeta.confidence,
          sourceText,
          translatedText: translatedTextWithCanonicalTerms,
        });
        baseResult = {
          ...baseResult,
          text: translatedTextWithCanonicalTerms,
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
              : pivotConfidence < HELIX_ASK_PIVOT_CONF_AUTO_MIN,
          pivot_confidence: pivotConfidence,
          source_text: sourceText,
          source_language: sourceLanguage,
          translated: true,
          lang_schema_version: HELIX_LANG_SCHEMA_VERSION,
        };
        translationUncertain =
          baseResult.translation_uncertain === true ||
          pivotConfidence < HELIX_ASK_PIVOT_CONF_AUTO_MIN ||
          translatedConfidenceMeta.confidence < STT_TRANSLATION_CONFIRM_THRESHOLD;
      } else {
        baseResult = {
          ...baseResult,
          source_text: sourceText,
          source_language: sourceLanguage,
          translated: false,
          pivot_confidence: 0,
          lang_schema_version: HELIX_LANG_SCHEMA_VERSION,
        };
        translationUncertain = true;
        pivotConfidence = 0;
      }
    } catch (error) {
      failures.push(classifySttFailure(selectedBackend, error, "primary"));
      baseResult = {
        ...baseResult,
        source_text: sourceText,
        source_language: sourceLanguage,
        translated: false,
        pivot_confidence: 0,
        lang_schema_version: HELIX_LANG_SCHEMA_VERSION,
      };
      translationUncertain = true;
      pivotConfidence = 0;
    }
  } else if (args.outputMode === "dual") {
    baseResult = {
      ...baseResult,
      source_text: sourceText,
      source_language: sourceLanguage,
      translated: false,
      lang_schema_version: HELIX_LANG_SCHEMA_VERSION,
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
  const languageDetected = normalizeLanguageTag(
    baseResult.language_detected ?? baseResult.source_language ?? sourceLanguage,
  ) ?? sourceLanguage;
  const languageConfidence =
    typeof baseResult.language_confidence === "number"
      ? clamp01(baseResult.language_confidence)
      : deriveLanguageConfidence({
          text: sourceText || baseResult.text || "",
          language: languageDetected,
          providerConfidence: baseResult.confidence,
        });
  const codeMixed =
    typeof baseResult.code_mixed === "boolean"
      ? baseResult.code_mixed
      : isCodeMixedTranscript(sourceText || baseResult.text || "");
  let interpreterArtifact: HelixAskInterpreterArtifact | null = null;
  let interpreterStatus: HelixAskInterpreterStatus | null = null;
  let interpreterError: string | null = null;
  let interpreterDispatchTrusted = false;
  if (
    HELIX_ASK_INTERPRETER_EVALUATE &&
    shouldRunHelixAskInterpreter({
      sourceLanguage,
      codeMixed,
    })
  ) {
    const interpreterResult = await runHelixAskInterpreter({
      sourceText: sourceText || baseResult.source_text || baseResult.text || "",
      sourceLanguage,
      codeMixed,
      pivotText: baseResult.text ?? null,
      responseLanguage: args.payload.language ?? sourceLanguage,
      config: HELIX_ASK_INTERPRETER_CONFIG,
    });
    interpreterStatus = interpreterResult.status;
    interpreterArtifact = interpreterResult.artifact;
    interpreterError = interpreterResult.error;
    interpreterDispatchTrusted =
      HELIX_ASK_INTERPRETER_ACTIVE &&
      interpreterStatus === "ok" &&
      Boolean(interpreterArtifact);
    if (interpreterArtifact) {
      const interpreterPivotText = interpreterArtifact.selected_pivot.text.trim();
      const interpreterPivotConfidence = clamp01(interpreterArtifact.selected_pivot.confidence);
      if (interpreterDispatchTrusted && interpreterPivotText) {
        baseResult = {
          ...baseResult,
          text: interpreterPivotText,
          language: "en",
          pivot_confidence: interpreterPivotConfidence,
        };
      }
      baseResult = {
        ...baseResult,
        interpreter: interpreterArtifact,
        interpreter_schema_version: HELIX_INTERPRETER_SCHEMA_VERSION,
        interpreter_status: interpreterStatus,
        interpreter_confidence: interpreterPivotConfidence,
        interpreter_dispatch_state: interpreterDispatchTrusted ? interpreterArtifact.dispatch_state : undefined,
        interpreter_confirm_prompt: interpreterArtifact.confirm_prompt,
        interpreter_term_ids: interpreterArtifact.term_ids,
        interpreter_concept_ids: interpreterArtifact.concept_ids,
      };
      if (interpreterDispatchTrusted && interpreterArtifact.dispatch_state !== "auto") {
        translationUncertain = true;
      }
    } else {
      baseResult = {
        ...baseResult,
        interpreter_status: interpreterStatus,
      };
      if (HELIX_ASK_INTERPRETER_ACTIVE) {
        translationUncertain = true;
      }
    }
    if (interpreterError && HELIX_ASK_INTERPRETER_ACTIVE) {
      translationUncertain = true;
    }
  }
  pivotConfidence =
    typeof baseResult!.pivot_confidence === "number"
      ? clamp01(baseResult!.pivot_confidence)
      : isEnglishLikeLanguage(sourceLanguage)
        ? 1
        : pivotConfidence;
  const interpreterStatusForceBlock = shouldForceInterpreterFailClosed({
    artifact: interpreterArtifact,
    status: interpreterStatus,
    error: interpreterError,
    sourceLanguage,
    codeMixed,
  });
  let dispatchState: "auto" | "confirm" | "blocked" = "auto";
  if (interpreterStatusForceBlock) {
    dispatchState = "blocked";
  } else if (interpreterDispatchTrusted && interpreterArtifact) {
    dispatchState = interpreterArtifact.dispatch_state;
    pivotConfidence = clamp01(interpreterArtifact.selected_pivot.confidence);
  } else {
    if (pivotConfidence < HELIX_ASK_PIVOT_CONF_BLOCK_MIN) {
      dispatchState = "blocked";
    } else if (
      pivotConfidence < HELIX_ASK_PIVOT_CONF_AUTO_MIN ||
      languageConfidence < HELIX_ASK_LANG_CONF_MIN
    ) {
      dispatchState = "confirm";
    }
  }
  const needsConfirmation =
    (typeof baseResult!.needs_confirmation === "boolean" ? baseResult!.needs_confirmation : false) ||
    normalizedConfidence < STT_CONFIRM_CONFIDENCE_THRESHOLD ||
    translationUncertain ||
    languageConfidence < HELIX_ASK_LANG_CONF_MIN ||
    dispatchState !== "auto";
  baseResult = {
    ...baseResult!,
    language_detected: languageDetected,
    language_confidence: languageConfidence,
    code_mixed: codeMixed,
    confidence: normalizedConfidence,
    confidence_reason: confidenceReason,
    pivot_confidence: pivotConfidence,
    dispatch_state: dispatchState,
    needs_confirmation: needsConfirmation,
    translation_uncertain: translationUncertain,
    lang_schema_version: HELIX_LANG_SCHEMA_VERSION,
    interpreter: interpreterArtifact ?? baseResult!.interpreter,
    interpreter_schema_version:
      baseResult!.interpreter_schema_version ?? (interpreterArtifact ? HELIX_INTERPRETER_SCHEMA_VERSION : undefined),
    interpreter_status: interpreterStatus ?? baseResult!.interpreter_status,
    interpreter_confidence:
      typeof baseResult!.interpreter_confidence === "number"
        ? clamp01(baseResult!.interpreter_confidence)
        : interpreterArtifact
          ? clamp01(interpreterArtifact.selected_pivot.confidence)
          : undefined,
    interpreter_dispatch_state:
      interpreterDispatchTrusted && interpreterArtifact
        ? interpreterArtifact.dispatch_state
        : baseResult!.interpreter_dispatch_state,
    interpreter_confirm_prompt: interpreterArtifact?.confirm_prompt ?? baseResult!.interpreter_confirm_prompt ?? null,
    interpreter_term_ids: interpreterArtifact?.term_ids ?? baseResult!.interpreter_term_ids ?? [],
    interpreter_concept_ids: interpreterArtifact?.concept_ids ?? baseResult!.interpreter_concept_ids ?? [],
  };

  return { result: baseResult, failures, formatRecovery };
};

voiceRouter.options("/speak", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.options("/transcribe", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.options("/speaker-session/trust", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.options("/debug/recent", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.get("/debug/recent", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const limitValue = Number.parseInt(String(req.query.limit ?? "50"), 10);
  const limit = Number.isFinite(limitValue) ? Math.min(200, Math.max(1, limitValue)) : 50;
  const chunkKind = typeof req.query.chunkKind === "string" ? req.query.chunkKind.trim() : "";
  const narratorQuery = String(req.query.narrator ?? req.query.narratorOnly ?? "").trim().toLowerCase();
  const narratorOnly = narratorQuery === "1" || narratorQuery === "true";
  const events = recentVoiceSpeakDebugEvents
    .filter((event) => (!chunkKind ? true : event.chunkKind === chunkKind))
    .filter((event) => (!narratorOnly ? true : event.narrator))
    .slice(-limit)
    .reverse();
  return res.status(200).json({
    schema: "helix.voice_speak_debug_recent.v1",
    generatedAtMs: Date.now(),
    count: events.length,
    limit,
    filters: {
      chunkKind: chunkKind || null,
      narratorOnly,
    },
    events,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
});

voiceRouter.get("/speaker-session/:sessionId", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const sessionId = req.params.sessionId?.trim();
  if (!sessionId) {
    return errorEnvelope(
      res,
      400,
      "voice_invalid_request",
      "Audio identity session id is required.",
      { field: "sessionId" },
    );
  }
  const snapshot = getSpeakerSessionSnapshot(sessionId);
  if (!snapshot) {
    return res.status(200).json({
      ok: true,
      session: null,
    });
  }
  return res.status(200).json({
    ok: true,
    session: snapshot,
  });
});

voiceRouter.post("/speaker-session/trust", express.json({ limit: "64kb" }), (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = speakerSessionTrustSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(
      res,
      400,
      "voice_invalid_request",
      "Invalid speaker session trust payload.",
      { issues: parsed.error.flatten() },
    );
  }
  const sessionId = resolveTrustRequestSessionId(parsed.data);
  const session = trustSessionSpeaker({
    sessionId,
    speakerId: parsed.data.speaker_id,
    roomId: parsed.data.room_id ?? null,
    threadId: parsed.data.thread_id ?? null,
    displayName: parsed.data.display_name ?? null,
    role: parsed.data.role ?? "trusted_guest",
    authority: parsed.data.authority ?? null,
    confidence: parsed.data.confidence ?? null,
  });
  return res.status(200).json({
    ok: true,
    session,
  });
});

voiceRouter.post("/transcribe", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const breadcrumbId = createVoiceLaneBreadcrumbId("voice_transcribe");
  writeVoiceLaneBreadcrumb("voice.transcribe.received", {
    breadcrumbId,
    contentType: req.headers["content-type"] ?? null,
    contentLength: req.headers["content-length"] ?? null,
  });
  const admission = runtimeMemoryGovernor.admitRuntimeTask({
    taskClass: "voice_stt",
    requestBytes: Number(req.headers["content-length"]) || 0,
    source: "api.voice.transcribe.pre_upload",
  });
  let voiceTranscribeLease = admission.lease;
  let responseFinished = false;
  res.once("finish", () => {
    responseFinished = true;
    writeVoiceLaneBreadcrumb("voice.transcribe.response_finished", {
      breadcrumbId,
      statusCode: res.statusCode,
    });
    releaseVoiceTranscribeLease(
      voiceTranscribeLease,
      res.statusCode >= 200 && res.statusCode < 400 ? "completed" : "rejected",
    );
  });
  res.once("close", () => {
    if (!responseFinished) {
      releaseVoiceTranscribeLease(voiceTranscribeLease, "aborted");
    }
  });
  if (!admission.admitted) {
    writeVoiceLaneBreadcrumb("voice.transcribe.memory_pressure", {
      breadcrumbId,
      source: "api.voice.transcribe.pre_upload",
      action: admission.action,
      pressureLevel: admission.pressureLevel,
      ...voiceMemoryPressureDetails(admission),
    });
    return errorEnvelope(
      res,
      503,
      "voice_memory_pressure",
      "Voice transcription is temporarily paused because the server is under memory pressure.",
      voiceMemoryPressureDetails(admission),
      undefined,
    );
  }
  voiceUpload.single("audio")(req, res, async (uploadError?: unknown) => {
    const rawTraceId = typeof req.body?.traceId === "string" ? req.body.traceId.trim() : undefined;
    const traceId = rawTraceId || undefined;
    if (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Audio upload failed.";
      writeVoiceLaneBreadcrumb("voice.transcribe.upload_error", {
        breadcrumbId,
        traceId,
        error: message,
      });
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
      writeVoiceLaneBreadcrumb("voice.transcribe.disabled", { breadcrumbId, traceId });
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
      writeVoiceLaneBreadcrumb("voice.transcribe.invalid_payload", {
        breadcrumbId,
        traceId,
        issues: parsed.error.flatten(),
      });
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
      writeVoiceLaneBreadcrumb("voice.transcribe.missing_audio", {
        breadcrumbId,
        traceId: parsed.data.traceId ?? traceId,
      });
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
    writeVoiceLaneBreadcrumb("voice.transcribe.dispatch", {
      breadcrumbId,
      traceId: parsed.data.traceId ?? traceId,
      policyMode,
      outputMode,
      fileBytes: file.buffer.length,
      backends: configuredBackends.map((backend) => backend.kind),
      request: parsed.data,
    });
    if (configuredBackends.length === 0) {
      writeVoiceLaneBreadcrumb("voice.transcribe.no_backend", {
        breadcrumbId,
        traceId: parsed.data.traceId ?? traceId,
        policyMode,
        outputMode,
      });
      return errorEnvelope(
        res,
        503,
        "voice_unavailable",
        "Voice transcription backend is not configured.",
        {
          policyMode,
          outputMode,
          backendConfigured: false,
          requiredEnv: ["WHISPER_HTTP_API_KEY|OPENAI_API_KEY", "STT_LOCAL_URL"],
        },
        parsed.data.traceId,
      );
    }

    const burstRecheck = runtimeMemoryGovernor.recheckRuntimeTask(voiceTranscribeLease, {
      taskClass: "voice_stt",
      traceId: parsed.data.traceId ?? traceId,
      actualBytes: file.buffer.length,
      estimatedExpansionBytes: file.buffer.length * 4,
      source: "api.voice.transcribe.pre_stt",
    });
    voiceTranscribeLease = burstRecheck.lease ?? voiceTranscribeLease;
    if (!burstRecheck.admitted) {
      writeVoiceLaneBreadcrumb("voice.transcribe.memory_pressure", {
        breadcrumbId,
        traceId: parsed.data.traceId ?? traceId,
        source: "api.voice.transcribe.pre_stt",
        action: burstRecheck.action,
        pressureLevel: burstRecheck.pressureLevel,
        actualBytes: file.buffer.length,
        estimatedExpansionBytes: file.buffer.length * 4,
        ...voiceMemoryPressureDetails(burstRecheck),
      });
      return errorEnvelope(
        res,
        503,
        "voice_memory_pressure",
        "Voice transcription is temporarily paused because the server is under memory pressure.",
        voiceMemoryPressureDetails(burstRecheck),
        parsed.data.traceId,
      );
    }

    const { result, failures, formatRecovery } = await runVoiceTranscription({
      file,
      payload: parsed.data,
      policyMode,
      outputMode,
    });
    if (!result) {
      writeVoiceLaneBreadcrumb("voice.transcribe.failed", {
        breadcrumbId,
        traceId: parsed.data.traceId ?? traceId,
        failureCount: failures.length,
        failures,
      });
      const rateLimitedFailures = failures.filter((entry) => entry.status === 429);
      const allFailuresRateLimited =
        failures.length > 0 && rateLimitedFailures.length === failures.length;
      const retryAfterMs = rateLimitedFailures.reduce((max, entry) => {
        const value =
          typeof entry.retryAfterMs === "number" && Number.isFinite(entry.retryAfterMs)
            ? entry.retryAfterMs
            : 0;
        return Math.max(max, value);
      }, 0);
      const rateLimitSource =
        rateLimitedFailures.some((entry) => entry.rateLimitSource === "provider_429")
          ? "provider_429"
          : rateLimitedFailures.some((entry) => entry.rateLimitSource === "local_cooldown")
            ? "local_cooldown"
            : null;
      if (allFailuresRateLimited) {
        return errorEnvelope(
          res,
          429,
          "voice_rate_limited",
          "Voice transcription rate limit exceeded.",
          {
            policyMode,
            outputMode,
            retryAfterMs: retryAfterMs > 0 ? retryAfterMs : null,
            rateLimitSource,
            attempts: failures.map((entry) => ({
              backend: entry.backend,
              engine: entry.engine,
              stage: entry.stage ?? "primary",
              status: entry.status ?? null,
              retryable: entry.retryable,
              retryAfterMs:
                typeof entry.retryAfterMs === "number" && Number.isFinite(entry.retryAfterMs)
                  ? entry.retryAfterMs
                  : null,
              rateLimitSource: entry.rateLimitSource ?? null,
              message: entry.message,
            })),
            formatRecovery,
          },
          parsed.data.traceId,
        );
      }
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
            stage: entry.stage ?? "primary",
            status: entry.status ?? null,
            retryable: entry.retryable,
            retryAfterMs:
              typeof entry.retryAfterMs === "number" && Number.isFinite(entry.retryAfterMs)
                ? entry.retryAfterMs
                : null,
            rateLimitSource: entry.rateLimitSource ?? null,
            message: entry.message,
          })),
          formatRecovery,
        },
        parsed.data.traceId,
      );
    }

    const resolvedSpeakerId = result.speaker_id ?? parsed.data.speaker_id ?? null;
    const resolvedSpeakerConfidence =
      typeof result.speaker_confidence === "number"
        ? result.speaker_confidence
        : typeof parsed.data.speaker_confidence === "number"
          ? parsed.data.speaker_confidence
          : null;
    const resolvedSpeechProbability =
      typeof result.speech_probability === "number"
        ? result.speech_probability
        : typeof parsed.data.speech_probability === "number"
          ? parsed.data.speech_probability
          : null;
    const resolvedSnrDb =
      typeof result.snr_db === "number"
        ? result.snr_db
        : typeof parsed.data.snr_db === "number"
          ? parsed.data.snr_db
          : null;
    const resolvedDurationMs =
      typeof result.duration_ms === "number"
        ? result.duration_ms
        : parsed.data.durationMs ?? 0;
    const rawAudioIdentity =
      result.audio_identity ??
      buildHelixAudioIdentityResult({
        speakerIdentityEnabled: parsed.data.speaker_identity_enabled ?? false,
        captureSessionId: parsed.data.audio_identity_session_id ?? parsed.data.capture_session_id ?? null,
        roomId: parsed.data.room_id ?? null,
        threadId: parsed.data.thread_id ?? null,
        chunkIndex: parsed.data.chunk_index ?? null,
        captureSource: parsed.data.capture_source ?? "mic",
        text: result.text ?? "",
        language: result.language ?? parsed.data.language ?? "en",
        durationMs: resolvedDurationMs,
        speakerId: resolvedSpeakerId,
        speakerConfidence: resolvedSpeakerConfidence,
        speechProbability: resolvedSpeechProbability,
        snrDb: resolvedSnrDb,
        overlappingSpeech: parsed.data.overlapping_speech ?? null,
        speakerRole: result.speaker_role ?? parsed.data.speaker_role ?? null,
        speakerAuthority: result.speaker_authority ?? parsed.data.speaker_authority ?? null,
        policyMode: parsed.data.speaker_policy_mode ?? null,
        policyModeSource: "client_hint",
        unknownSpeakerBehavior: parsed.data.unknown_speaker_behavior ?? null,
        knownSpeakerIds: parsed.data.known_speaker_ids ?? null,
        activeListenerSpeakerIds: parsed.data.active_listener_speaker_ids ?? null,
      });
    const speakerSessionId = resolveAudioIdentitySessionId({
      audioIdentitySessionId: parsed.data.audio_identity_session_id,
      captureSessionId: parsed.data.capture_session_id,
      roomId: parsed.data.room_id,
      threadId: parsed.data.thread_id,
    });
    const sessionApplied = rawAudioIdentity
      ? applySpeakerSession(rawAudioIdentity, {
          sessionId: speakerSessionId,
          roomId: parsed.data.room_id ?? null,
          threadId: parsed.data.thread_id ?? null,
        })
      : null;
    const audioIdentity = sessionApplied?.audioIdentity ?? null;
    let speakerSession = sessionApplied?.session ?? null;
    const primarySpeaker = audioIdentity?.speakers.find(
      (speaker) => speaker.speaker_id === audioIdentity.primary_speaker_id,
    ) ?? audioIdentity?.speakers[0] ?? null;
    const speakerSegments = Array.isArray(result.speaker_segments)
      ? result.speaker_segments
      : audioIdentity?.segments ?? [];

    const commandLane = shouldRunTranscribeCommandLane(parsed.data)
      ? await runVoiceCommandArbiter({
          transcript: result.text ?? "",
          traceId: parsed.data.traceId ?? null,
          speechProbability: resolvedSpeechProbability,
          snrDb: resolvedSnrDb,
          speakerId: primarySpeaker?.speaker_id ?? resolvedSpeakerId,
          speakerConfidence: primarySpeaker?.confidence ?? resolvedSpeakerConfidence,
          speakerRole: primarySpeaker?.role ?? result.speaker_role ?? parsed.data.speaker_role ?? null,
          speakerAuthority:
            primarySpeaker?.authority ?? result.speaker_authority ?? parsed.data.speaker_authority ?? null,
          overlappingSpeech:
            parsed.data.overlapping_speech === true ||
            speakerSegments.some((segment) => segment.overlap === true),
        })
      : buildSuppressedTranscribeCommandLane({
          traceId: parsed.data.traceId ?? null,
          captureSessionId: parsed.data.capture_session_id ?? null,
          chunkIndex: parsed.data.chunk_index ?? null,
          suppressionReason:
            (parsed.data.capture_source ?? "mic") === "mic" ? "disabled" : "non_user_audio_source",
        });
    const diarizationConfig = readDiarizationConfigFromEnv();
    const diarizationShadow =
      result.diarization_shadow ??
      (await runDiarizationShadow({
        audioBuffer: file.buffer,
        contentType: file.mimetype?.trim() || "application/octet-stream",
        captureSessionId:
          audioIdentity?.capture_session_id ??
          parsed.data.audio_identity_session_id ??
          parsed.data.capture_session_id ??
          speakerSessionId,
        roomId: parsed.data.room_id ?? null,
        threadId: parsed.data.thread_id ?? null,
        captureSource: parsed.data.capture_source ?? "mic",
        chunkIndex: parsed.data.chunk_index ?? null,
        durationMs: resolvedDurationMs,
        knownSpeakerIds: parsed.data.known_speaker_ids ?? null,
        config: diarizationConfig,
      }));
    const appliedDiarizationSegments: HelixSpeakerSegment[] =
      diarizationConfig.applySegments &&
      diarizationShadow?.status === "success" &&
      diarizationShadow.segments.length > 0
        ? diarizationShadow.segments.map((segment) => ({
            segment_id: segment.segment_id,
            speaker_id: segment.speaker_id,
            speaker_confidence: segment.confidence,
            start_ms: Math.max(0, Math.round(segment.start_ms)),
            end_ms: Math.max(0, Math.round(segment.end_ms)),
            text: undefined,
            language: result.language ?? parsed.data.language ?? "en",
            speech_probability:
              diarizationShadow.audio_quality?.speech_probability ?? resolvedSpeechProbability ?? undefined,
            snr_db: diarizationShadow.audio_quality?.snr_db ?? resolvedSnrDb ?? undefined,
            overlap: segment.overlap,
            capture_source: parsed.data.capture_source ?? "mic",
          }))
        : [];
    let responseSpeakerSegments =
      appliedDiarizationSegments.length > 0 ? appliedDiarizationSegments : speakerSegments;
    let responseAudioIdentity = audioIdentity;
    if (appliedDiarizationSegments.length > 0 && audioIdentity && diarizationShadow?.status === "success") {
      const knownSpeakerIds = new Set(audioIdentity.speakers.map((speaker) => speaker.speaker_id));
      const sidecarLabels: HelixSpeakerLabel[] = diarizationShadow.speakers
        .filter((speaker) => !knownSpeakerIds.has(speaker.speaker_id))
        .map((speaker) => {
          const deviceAudio = (parsed.data.capture_source ?? "mic") !== "mic";
          return {
            speaker_id: speaker.speaker_id,
            display_name: deviceAudio ? "Device audio" : "Guest",
            color_token: resolveHelixSpeakerColorToken(
              parsed.data.room_id ?? speakerSessionId,
              speaker.speaker_id,
            ),
            role: deviceAudio ? "device_audio" : "guest",
            authority: "transcribe_only",
            authority_source: deviceAudio ? "device_audio_policy" : "server_policy",
            authority_reason: deviceAudio
              ? "device_audio_transcribe_only"
              : "diarization_shadow_requires_session_or_profile_trust",
            confidence: speaker.confidence,
            enrollment_state: "none",
          };
        });
      const appliedIdentity = applySpeakerSession(
        {
          ...audioIdentity,
          speakers: [...audioIdentity.speakers, ...sidecarLabels],
          segments: appliedDiarizationSegments,
        },
        {
          sessionId: speakerSessionId,
          roomId: parsed.data.room_id ?? null,
          threadId: parsed.data.thread_id ?? null,
        },
      );
      responseAudioIdentity = appliedIdentity.audioIdentity;
      speakerSession = appliedIdentity.session;
      responseSpeakerSegments = responseAudioIdentity.segments;
    }
    const missionId = resolveTranscribeMissionId(parsed.data);
    writeVoiceLaneBreadcrumb("voice.transcribe.success", {
      breadcrumbId,
      traceId: parsed.data.traceId ?? traceId,
      missionId,
      engine: result.engine ?? null,
      language: result.language ?? parsed.data.language ?? "en",
      translated: result.translated ?? false,
      text: result.text ?? "",
      source_text: result.source_text ?? null,
      speakerCount: responseAudioIdentity?.speakers.length ?? 0,
      segmentCount: Array.isArray(result.segments) ? result.segments.length : 0,
    });
    const threadId = parsed.data.thread_id?.trim() || "helix-ask:desktop";
    const sourceId = `audio_transcript:${threadId}`;
    const chunkIndex =
      typeof parsed.data.chunk_index === "number" && Number.isFinite(parsed.data.chunk_index)
        ? parsed.data.chunk_index
        : null;
    const audioHash = createHash("sha256").update(file.buffer).digest("hex");
    const audioRef = `voice:audio:${audioHash.slice(0, 16)}`;
    const speechToTextLaneResult = runSpeechToTextTranscribeAudio({
      provider: voiceTranscribeLaneProvider,
      request: {
        schema: "helix.speech_to_text.one_shot_request.v1",
        capability: "speech_to_text.transcribe_audio",
        transcript_text: result.text ?? "",
        audio_ref: audioRef,
        audio_hash: audioHash,
        language: result.language_detected ?? result.source_language ?? result.language ?? parsed.data.language ?? null,
        confidence: typeof result.confidence === "number" ? result.confidence : null,
        requested_backend_provider: null,
        turn_id: parsed.data.traceId ?? traceId ?? null,
        thread_id: threadId,
        room_id: parsed.data.room_id ?? null,
        environment_id: null,
        source_id: sourceId,
        capture_session_id: parsed.data.capture_session_id ?? null,
        chunk_id:
          parsed.data.capture_session_id && chunkIndex !== null
            ? `voice:transcribe:${parsed.data.capture_session_id}:${chunkIndex}`
            : null,
        chunk_index: chunkIndex,
        duration_ms: resolvedDurationMs,
        capture_source: parsed.data.capture_source ?? "mic",
        source_event_ms: null,
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: parsed.data.traceId ?? traceId ?? null,
      env: process.env,
    });

    return res.status(200).json({
      ok: true,
      text: result.text ?? "",
      language: result.language ?? parsed.data.language ?? "en",
      language_detected: result.language_detected ?? result.source_language ?? result.language ?? null,
      language_confidence:
        typeof result.language_confidence === "number" ? result.language_confidence : null,
      code_mixed: result.code_mixed ?? false,
      duration_ms:
        resolvedDurationMs,
      segments: Array.isArray(result.segments) ? result.segments : [],
      source_text: result.source_text ?? null,
      source_language: result.source_language ?? null,
      translated: result.translated ?? false,
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      confidence_reason: result.confidence_reason ?? null,
      pivot_confidence: typeof result.pivot_confidence === "number" ? result.pivot_confidence : null,
      dispatch_state: result.dispatch_state ?? "auto",
      needs_confirmation: result.needs_confirmation ?? false,
      translation_uncertain: result.translation_uncertain ?? false,
      speaker_id: primarySpeaker?.speaker_id ?? resolvedSpeakerId,
      speaker_confidence: primarySpeaker?.confidence ?? resolvedSpeakerConfidence,
      speaker_segments: responseSpeakerSegments,
      primary_speaker_id: responseAudioIdentity?.primary_speaker_id ?? primarySpeaker?.speaker_id ?? resolvedSpeakerId,
      claimed_role: primarySpeaker?.claimed_role ?? null,
      speaker_role: primarySpeaker?.role ?? result.speaker_role ?? parsed.data.speaker_role ?? null,
      speaker_authority:
        primarySpeaker?.authority ?? result.speaker_authority ?? parsed.data.speaker_authority ?? null,
      speaker_authority_source:
        primarySpeaker?.authority_source ?? result.speaker_authority_source ?? null,
      speaker_authority_reason:
        primarySpeaker?.authority_reason ?? result.speaker_authority_reason ?? null,
      speaker_color_token: primarySpeaker?.color_token ?? result.speaker_color_token ?? null,
      unknown_speaker_detected:
        result.unknown_speaker_detected ??
        (responseAudioIdentity?.speakers.some((speaker) => speaker.role === "unknown") ?? false),
      audio_identity: responseAudioIdentity,
      speaker_session: speakerSession,
      speech_probability: resolvedSpeechProbability,
      snr_db: resolvedSnrDb,
      confirm_auto_eligible:
        typeof result.confirm_auto_eligible === "boolean"
          ? result.confirm_auto_eligible
          : typeof parsed.data.confirm_auto_eligible === "boolean"
            ? parsed.data.confirm_auto_eligible
            : null,
      confirm_block_reason: result.confirm_block_reason ?? parsed.data.confirm_block_reason ?? null,
      lang_schema_version: result.lang_schema_version ?? HELIX_LANG_SCHEMA_VERSION,
      traceId: parsed.data.traceId ?? null,
      missionId: missionId ?? null,
      mission_id: missionId ?? null,
      room_id: parsed.data.room_id ?? null,
      thread_id: parsed.data.thread_id ?? null,
      capture_session_id: parsed.data.capture_session_id ?? null,
      chunk_index:
        typeof parsed.data.chunk_index === "number" && Number.isFinite(parsed.data.chunk_index)
          ? parsed.data.chunk_index
          : null,
      capture_source: parsed.data.capture_source ?? "mic",
      engine: result.engine,
      essence_id: result.essence_id ?? null,
      interpreter: result.interpreter ?? null,
      interpreter_schema_version: result.interpreter_schema_version ?? null,
      interpreter_status: result.interpreter_status ?? null,
      interpreter_confidence:
        typeof result.interpreter_confidence === "number" ? result.interpreter_confidence : null,
      interpreter_dispatch_state: result.interpreter_dispatch_state ?? null,
      interpreter_confirm_prompt: result.interpreter_confirm_prompt ?? null,
      interpreter_term_ids: Array.isArray(result.interpreter_term_ids) ? result.interpreter_term_ids : [],
      interpreter_concept_ids: Array.isArray(result.interpreter_concept_ids) ? result.interpreter_concept_ids : [],
      ...(diarizationShadow ? { diarization_shadow: diarizationShadow } : {}),
      command_lane: commandLane,
      speech_to_text_lane_result: speechToTextLaneResult,
      speech_to_text_observation_packet: speechToTextLaneResult.observation_packet,
      speech_to_text_observation: speechToTextLaneResult.observation,
      live_source_mail_item:
        speechToTextLaneResult.observation_packet.state_delta.speech_to_text_live_source_mail_item ?? null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      raw_audio_included: false,
    });
  });
});

voiceRouter.post("/speak", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const breadcrumbId = createVoiceLaneBreadcrumbId("voice_speak");
  writeVoiceLaneBreadcrumb("voice.speak.received", {
    breadcrumbId,
    request: readVoiceLaneRequestSummary(req.body),
  });

  const parsed = requestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    writeVoiceLaneBreadcrumb("voice.speak.invalid_payload", {
      breadcrumbId,
      issues: parsed.error.flatten(),
    });
    return errorEnvelope(
      res,
      400,
      "voice_invalid_request",
      "Invalid voice request payload.",
      { issues: parsed.error.flatten() },
    );
  }

  const payload = parsed.data;
  const traceId = payload.traceId?.trim() || undefined;
  const policyNowMs = resolvePolicyNowMs(payload);
  attachVoiceSpeakDebugRecorder(res, payload, breadcrumbId, Date.now());
  writeVoiceLaneBreadcrumb("voice.speak.validated", {
    breadcrumbId,
    request: readVoiceLaneRequestSummary(payload),
  });
  const hasProvisionalInterimReceiptAuthority = hasInterimVoiceReceiptAuthority(payload);
  if (isDotVoiceRequest(payload) && !hasProvisionalInterimReceiptAuthority) {
    writeVoiceLaneBreadcrumb("voice.speak.dot_authority_check", {
      breadcrumbId,
      traceId: payload.traceId ?? null,
      threadId: payload.threadId ?? null,
      turnId: payload.turnId ?? null,
      voiceAuthorityState: payload.voiceAuthorityState ?? null,
    });
    const voiceSourceDecision = authorizeDotVoiceSource({
      text: payload.text,
      voiceAuthorityState: payload.voiceAuthorityState ?? (payload.mode === "callout" ? "callout_voice" : "status_voice"),
      terminalAnswerAuthority: payload.terminal_answer_authority,
      acceptedArbitrationCandidate: payload.accepted_arbitration_candidate,
      sourceKind: payload.sourceKind,
      sourceTextHash: payload.sourceTextHash,
      terminalVoiceTextHash: payload.terminal_voice_text_hash,
      currentThreadId: payload.threadId,
      currentTurnId: payload.turnId,
      nowMs: policyNowMs,
    });
    if (!voiceSourceDecision.ok) {
      writeVoiceLaneBreadcrumb("voice.speak.suppressed", {
        breadcrumbId,
        traceId: payload.traceId ?? null,
        reason: voiceSourceDecision.reason,
      });
      return res.status(200).json({
        ok: true,
        suppressed: true,
        ...suppressionEnvelope(voiceSourceDecision.reason),
        traceId: payload.traceId ?? null,
      });
    }
  } else if (hasProvisionalInterimReceiptAuthority) {
    writeVoiceLaneBreadcrumb("voice.speak.interim_receipt_authority", {
      breadcrumbId,
      traceId: payload.traceId ?? null,
      eventId: payload.eventId ?? null,
      utteranceId: payload.utteranceId ?? null,
      chunkKind: payload.chunkKind ?? null,
    });
  }
  if (payload.mode === "callout") {
    const contextEligibility = evaluateSharedEligibility({
      contextTier: payload.contextTier,
      sessionState: payload.sessionState,
      voiceMode: payload.voiceMode,
      classification: payload.priority,
    });
    if (!contextEligibility.emitVoice) {
      writeVoiceLaneBreadcrumb("voice.speak.suppressed", {
        breadcrumbId,
        traceId: payload.traceId ?? null,
        reason: "voice_context_ineligible",
      });
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
    writeVoiceLaneBreadcrumb("voice.speak.suppressed", {
      breadcrumbId,
      traceId: payload.traceId ?? null,
      reason: parity.reason,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.suppressed", {
      breadcrumbId,
      traceId: payload.traceId ?? null,
      reason: "contract_violation",
      firstError,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_consent_required",
    });
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
  writeVoiceLaneBreadcrumb("voice.speak.provider_selected", {
    breadcrumbId,
    traceId,
    provider,
    requestedProvider,
    missionCritical,
    governance,
  });

  if (!isLocalProvider(provider) && !governance.managedProvidersEnabled) {
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_provider_not_allowed",
      provider,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_provider_not_allowed_local_only",
      provider,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_provider_not_allowed_commercial",
      provider,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_budget_exceeded",
      missionId: payload.missionId ?? null,
      budgetRejection,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "voice_rate_limited",
      missionId: payload.missionId ?? null,
    });
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
    writeVoiceLaneBreadcrumb("voice.speak.suppressed", {
      breadcrumbId,
      traceId,
      reason: "dedupe_cooldown",
      missionId: payload.missionId ?? null,
      eventId: payload.eventId ?? null,
    });
    return res.status(200).json({
      ok: true,
      suppressed: true,
      ...suppressionEnvelope("dedupe_cooldown"),
      traceId,
      missionId: payload.missionId,
      eventId: payload.eventId,
    });
  }

  const baseUrl = process.env.TTS_BASE_URL?.trim();
  const requestedVoiceProfile = resolveRequestedVoiceProfile(payload);
  const elevenLabsRequested = isElevenLabsProvider(provider);
  const elevenLabsConfig = elevenLabsRequested ? resolveElevenLabsConfig(requestedVoiceProfile) : null;

  if (elevenLabsRequested && !elevenLabsConfig) {
    writeVoiceLaneBreadcrumb("voice.speak.no_backend", {
      breadcrumbId,
      traceId,
      provider,
      reason: "elevenlabs_not_configured",
    });
    return unavailableVoiceSpeakEnvelope(
      res,
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
    writeVoiceLaneBreadcrumb("voice.speak.no_backend", {
      breadcrumbId,
      traceId,
      provider,
      reason: "tts_base_url_not_configured",
    });
    return unavailableVoiceSpeakEnvelope(
      res,
      "Voice service is not configured.",
      { providerConfigured: false, provider },
      traceId,
    );
  }

  if (isCircuitBreakerOpen(policyNowMs)) {
    const retryAfterMs = Math.max(0, circuitBreaker.openedUntil - policyNowMs);
    writeVoiceLaneBreadcrumb("voice.speak.rejected", {
      breadcrumbId,
      traceId,
      reason: "circuit_breaker_open",
      retryAfterMs,
    });
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

  if (payload.streaming === true) {
    if (!elevenLabsRequested || !elevenLabsConfig) {
      writeVoiceLaneBreadcrumb("voice.speak.stream_rejected", {
        breadcrumbId,
        traceId,
        reason: "streaming_requires_elevenlabs",
        provider,
      });
      return errorEnvelope(
        res,
        400,
        "voice_invalid_request",
        "Streaming voice playback currently requires the ElevenLabs provider.",
        { provider },
        traceId,
      );
    }
    const config = elevenLabsConfig;
    const controller = new AbortController();
    const streamUrl = `${config.baseUrl}/v1/text-to-speech/${encodeURIComponent(config.voiceId)}/stream`;
    try {
      writeVoiceLaneBreadcrumb("voice.speak.stream_backend_attempt", {
        breadcrumbId,
        traceId,
        provider: "elevenlabs",
        endpoint: "stream",
      });
      const upstream = await fetch(streamUrl, {
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
      if (!upstream.ok || !upstream.body) {
        const responseText = await upstream.text().catch(() => "");
        recordBackendFailure(policyNowMs);
        writeVoiceLaneBreadcrumb("voice.speak.stream_backend_error", {
          breadcrumbId,
          traceId,
          provider: "elevenlabs",
          status: upstream.status,
        });
        return errorEnvelope(
          res,
          upstream.status >= 500 ? 502 : upstream.status,
          "voice_backend_error",
          "Voice streaming backend returned an error response.",
          {
            provider: "elevenlabs",
            body: clipBackendErrorDetail(responseText),
          },
          traceId,
        );
      }

      const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
      const durationHeader = upstream.headers.get("x-audio-duration-ms") ?? (payload.durationMs ? String(payload.durationMs) : "");
      res.status(200);
      res.setHeader("content-type", contentType);
      res.setHeader("x-voice-provider", "elevenlabs");
      res.setHeader("x-voice-profile", config.voiceId);
      res.setHeader("x-voice-cache", "stream");
      res.setHeader("x-voice-streaming", "1");
      res.setHeader("x-voice-meter-request-count", String(metering.requestCount));
      res.setHeader("x-voice-meter-char-count", String(metering.charCount));
      if (durationHeader) {
        res.setHeader("x-voice-meter-duration-ms", durationHeader);
      }
      writeVoiceLaneBreadcrumb("voice.speak.stream_started", {
        breadcrumbId,
        traceId,
        provider: "elevenlabs",
        contentType,
      });
      recordBackendSuccess();
      const nodeStream = Readable.fromWeb(upstream.body as any);
      let streamCompleted = false;
      const abortStream = () => {
        if (!streamCompleted) controller.abort();
      };
      res.once("close", abortStream);
      nodeStream.on("error", (error) => {
        writeVoiceLaneBreadcrumb("voice.speak.stream_error", {
          breadcrumbId,
          traceId,
          provider: "elevenlabs",
          error,
        });
        if (!res.destroyed) res.destroy(error);
      });
      nodeStream.on("end", () => {
        streamCompleted = true;
        res.off("close", abortStream);
        writeVoiceLaneBreadcrumb("voice.speak.stream_ended", {
          breadcrumbId,
          traceId,
          provider: "elevenlabs",
        });
      });
      return nodeStream.pipe(res);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      if (aborted && res.headersSent) return res.end();
      recordBackendFailure(policyNowMs);
      writeVoiceLaneBreadcrumb("voice.speak.stream_exception", {
        breadcrumbId,
        traceId,
        provider: "elevenlabs",
        aborted,
        error,
      });
      return errorEnvelope(
        res,
        aborted ? 504 : 502,
        aborted ? "voice_backend_timeout" : "voice_backend_error",
        aborted ? "Voice streaming backend timed out." : "Voice streaming backend request failed.",
        { provider: "elevenlabs" },
        traceId,
      );
    }
  }

  const timeoutMs = 15_000;
  const maxAttempts = 2;
  const resolvedProfileHeader = requestedVoiceProfile ?? "default";
  const wavNormalizationOptions = resolveVoiceWavNormalizationOptions();
  const mp3NormalizationOptions = resolveVoiceMp3NormalizationOptions();
  const normalizationBenchmarkHeader = formatVoiceNormalizationBenchmarkHeader(
    wavNormalizationOptions,
    mp3NormalizationOptions,
  );
  cleanupVoiceSpeakChunkCache(policyNowMs);
  const cacheKey = createVoiceSpeakCacheKey(payload, provider, resolvedProfileHeader);
  const cached = readVoiceSpeakChunkCache(cacheKey, policyNowMs);
  if (cached) {
    writeVoiceLaneBreadcrumb("voice.speak.cache_hit", {
      breadcrumbId,
      traceId,
      provider: cached.providerHeader,
      contentType: cached.contentType,
      bytes: cached.buffer.length,
    });
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
    if (cached.normalizationBenchmarkHeader) {
      res.setHeader("x-voice-normalization-benchmark", cached.normalizationBenchmarkHeader);
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
      writeVoiceLaneBreadcrumb("voice.speak.backend_attempt", {
        breadcrumbId,
        traceId,
        provider: elevenLabsRequested ? "elevenlabs" : "proxy",
        attemptIndex,
        timeoutMs,
      });
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
          writeVoiceLaneBreadcrumb("voice.speak.backend_error_response", {
            breadcrumbId,
            traceId,
            provider: "elevenlabs",
            attemptIndex,
            status: response.status,
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
        writeVoiceLaneBreadcrumb("voice.speak.backend_success", {
          breadcrumbId,
          traceId,
          provider: "elevenlabs",
          contentType,
          bytes: success.buffer.length,
        });
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
        writeVoiceLaneBreadcrumb("voice.speak.backend_error_response", {
          breadcrumbId,
          traceId,
          provider: "proxy",
          attemptIndex,
          status: upstream.status,
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
      writeVoiceLaneBreadcrumb("voice.speak.backend_success", {
        breadcrumbId,
        traceId,
        provider: "proxy",
        contentType,
        bytes: success.buffer.length,
      });
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
      writeVoiceLaneBreadcrumb("voice.speak.backend_exception", {
        breadcrumbId,
        traceId,
        provider: elevenLabsRequested ? "elevenlabs" : "proxy",
        attemptIndex,
        aborted,
        error,
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
    writeVoiceLaneBreadcrumb("voice.speak.failed", {
      breadcrumbId,
      traceId,
      attemptCount: attempts.length,
      finalAttempt,
    });
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
    wavOptions: wavNormalizationOptions,
    mp3Options: mp3NormalizationOptions,
  });
  const normalizationHeader =
    normalization.applied
      ? `${normalization.codec}_applied`
      : `skipped:${normalization.reason}`;
  const normalizationGainDbHeader =
    normalization.applied ? normalization.gainDb.toFixed(2) : "";
  writeVoiceLaneBreadcrumb("voice.speak.normalized", {
    breadcrumbId,
    traceId,
    provider: success.providerHeader,
    contentType: success.contentType,
    inputBytes: success.buffer.length,
    outputBytes: normalization.buffer.length,
    normalization: {
      applied: normalization.applied,
      codec: normalization.codec,
      reason: normalization.reason,
      gainDb: normalization.applied ? normalization.gainDb : null,
    },
  });

  writeVoiceSpeakChunkCache(cacheKey, policyNowMs, {
    contentType: success.contentType,
    providerHeader: success.providerHeader,
    profileHeader: success.profileHeader,
    durationHeader: success.durationHeader,
    normalizationHeader,
    normalizationGainDbHeader,
    normalizationBenchmarkHeader,
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
  res.setHeader("x-voice-normalization-benchmark", normalizationBenchmarkHeader);
  if (payload.watermark_mode) {
    res.setHeader("x-watermark-mode", payload.watermark_mode);
  }
  res.setHeader("x-voice-meter-request-count", String(metering.requestCount));
  res.setHeader("x-voice-meter-char-count", String(metering.charCount));
  if (success.durationHeader) {
    res.setHeader("x-voice-meter-duration-ms", success.durationHeader);
  }
  writeVoiceLaneBreadcrumb("voice.speak.success", {
    breadcrumbId,
    traceId,
    provider: success.providerHeader,
    contentType: success.contentType,
    bytes: normalization.buffer.length,
  });
  return res.status(200).send(normalization.buffer);
});

const resetVoiceRouteState = () => {
  dedupeUntil.clear();
  missionWindow.clear();
  missionBudgetWindow.clear();
  tenantBudgetDaily.clear();
  voiceSpeakChunkCache.clear();
  recentVoiceSpeakDebugEvents.splice(0, recentVoiceSpeakDebugEvents.length);
  sttBackendCooldownUntil.clear();
  resetSpeakerSessionRegistry();
  circuitBreaker.openedUntil = 0;
  circuitBreaker.recentFailures = [];
};

export { voiceRouter, resetVoiceRouteState };
