import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import { BrainCircuit, Mic, Search, Square } from "lucide-react";
import { panelRegistry, getPanelDef, type PanelDefinition } from "@/lib/desktop/panelRegistry";
import {
  askLocal,
  askMoodHint,
  getContextCapsule,
  getReasoningTheaterConfig,
  getPendingHelixAskJob,
  runConversationTurn,
  resumeHelixAskJob,
  speakVoice,
  subscribeToolLogs,
  transcribeVoice,
  type AtomicViewerLaunch,
  type ConversationClarifierPolicy,
  type ConversationExplorationPacket,
  type PendingHelixAskJob,
  type ToolLogEvent,
} from "@/lib/agi/api";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { classifyMoodFromWhisper } from "@/lib/luma-mood-spectrum";
import { LUMA_MOOD_ORDER, resolveMoodAsset, type LumaMood } from "@/lib/luma-moods";
import { broadcastLumaMood } from "@/lib/luma-mood-theme";
import { reportClientError } from "@/lib/observability/client-error";
import {
  readMissionContextControls,
  stopDesktopTier1ScreenSession,
  writeMissionContextControls,
  type ContextLifecycleEvent,
  type MissionContextControls,
} from "@/lib/mission-overwatch";
import {
  getDefaultReasoningTheaterConfig,
  type ReasoningTheaterConfigResponse,
  type ReasoningTheaterFrontierAction,
} from "@/lib/helix/reasoning-theater-config";
import {
  publishVoiceCaptureDiagnosticsSnapshot,
  type VoiceLaneTimelineDebugEvent,
} from "@/lib/helix/voice-capture-diagnostics";
import {
  advanceReasoningTheaterFrontierTracker,
  clampFrontierMeterPct,
  createReasoningTheaterFrontierTrackerState,
  resolveReasoningTheaterFrontierIconPath,
  resolveReasoningTheaterFrontierParticleProfile,
  type ReasoningTheaterFrontierTrackerState,
} from "@/lib/helix/reasoning-theater-frontier";
import {
  deriveConvergenceStripState,
  getConvergencePhaseOrder,
  type ConvergenceCollapseEvent,
  type ConvergenceDebug,
  type ConvergenceStripState,
} from "@/lib/helix/reasoning-theater-convergence";
import {
  applyLatestWinsVoiceQueue,
  createVoicePlaybackUtterance,
  trimVoicePlaybackQueue,
  type VoicePlaybackCancelReason,
  type VoicePlaybackChunk,
  type VoicePlaybackMetrics,
  type VoicePreemptPolicy,
  type VoicePlaybackUtterance,
  type VoicePlaybackUtteranceKind,
} from "@/lib/helix/voice-playback";
import {
  createContextCapsuleAutomaton,
  extractContextCapsuleIdsFromText,
  injectContextCapsuleCommit,
  normalizeContextCapsuleId,
  renderContextCapsuleStampLines,
  stepContextCapsuleAutomaton,
  type ContextCapsuleAutomaton,
  type ContextCapsuleConvergence,
  type ContextCapsuleSummary,
} from "@shared/helix-context-capsule";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { HelixAskResponseEnvelope } from "@shared/helix-ask-envelope";


export type ReadAloudPlaybackState = "idle" | "requesting" | "playing" | "dry-run" | "error";

export function transitionReadAloudState(
  current: ReadAloudPlaybackState,
  event: "request" | "audio" | "dry-run" | "error" | "stop" | "ended",
): ReadAloudPlaybackState {
  if (event === "request") return "requesting";
  if (event === "audio") return "playing";
  if (event === "dry-run") return "dry-run";
  if (event === "error") return "error";
  if (event === "stop" || event === "ended") return "idle";
  return current;
}

const SPEAK_TEXT_MAX_CHARS = 600;
const VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS = 180;
const MOBILE_AUDIO_UNLOCK_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
const FILE_PATH_CITATION_SEGMENT =
  "(?:[A-Za-z]:[\\\\/]|(?:docs|client|server|shared|scripts|tests|configs|reports|artifacts|packages|sdk|cli)/)";
const FILE_PATH_CITATION_PATTERN = new RegExp(`${FILE_PATH_CITATION_SEGMENT}[^\\s)\\]]+`, "gi");
const SOURCE_TRAILER_PATTERN = new RegExp(`(?:;|,)?\\s*source:\\s*${FILE_PATH_CITATION_SEGMENT}[^)\\s]+`, "gi");
const SOURCE_PAREN_PATTERN = new RegExp(`\\(\\s*source:\\s*${FILE_PATH_CITATION_SEGMENT}[^)]*\\)`, "gi");
const FILE_PATH_PAREN_PATTERN = new RegExp(`\\(\\s*${FILE_PATH_CITATION_SEGMENT}[^)]*\\)`, "gi");
const FILE_BASENAME_PATTERN = /\b[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yaml|yml)\b/gi;
const RESIDUAL_EXTENSION_TOKEN_PATTERN = /\b(?:ts|tsx|js|jsx|md|json|yaml|yml)\b(?=[,;:])/gi;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const URL_PATTERN = /\bhttps?:\/\/[^\s)]+/gi;
const MOBILE_AUDIO_USER_AGENT_PATTERN =
  /(iphone|ipad|ipod|android|mobile|silk|kindle|fennec|iemobile|opera mini)/i;
const IOS_AUDIO_USER_AGENT_PATTERN = /(iphone|ipad|ipod)/i;
const HELIX_VOICE_PLAYBACK_GAIN_DESKTOP = 1.15;
const HELIX_VOICE_PLAYBACK_GAIN_MOBILE = 1.8;
const HELIX_VOICE_PLAYBACK_GAIN_IOS = 2.1;

export function resolveVoicePlaybackGain(userAgent?: string): number {
  const ua = (userAgent ?? "").trim();
  if (!ua) return HELIX_VOICE_PLAYBACK_GAIN_DESKTOP;
  if (IOS_AUDIO_USER_AGENT_PATTERN.test(ua)) return HELIX_VOICE_PLAYBACK_GAIN_IOS;
  if (MOBILE_AUDIO_USER_AGENT_PATTERN.test(ua)) return HELIX_VOICE_PLAYBACK_GAIN_MOBILE;
  return HELIX_VOICE_PLAYBACK_GAIN_DESKTOP;
}

export function stripVoiceCitationArtifacts(source: string): string {
  if (!source) return "";
  const normalized = source
    .replace(/\r\n/g, "\n")
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(URL_PATTERN, "");
  const strippedLines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .replace(SOURCE_TRAILER_PATTERN, "")
        .replace(SOURCE_PAREN_PATTERN, "")
        .replace(FILE_PATH_PAREN_PATTERN, "")
        .replace(FILE_PATH_CITATION_PATTERN, "")
        .replace(FILE_BASENAME_PATTERN, "")
        .replace(RESIDUAL_EXTENSION_TOKEN_PATTERN, "")
        .replace(/\[\s*\]/g, " ")
        .replace(/\bsources?\s*:\s*$/i, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .trim(),
    )
    .filter((line) => line.length > 0 && !/^sources?\s*:/i.test(line))
    .filter((line) => !/^[(){}\[\],.;:!?-]+$/.test(line));

  return strippedLines.join("\n").trim();
}

export function isArtifactDominatedReasoningText(source: string): boolean {
  const text = source.trim();
  if (!text) return true;
  if (/\bwhat[\s_]?is[\s_](warp[\s_]?bubble|mission[\s_]?ethos)\s*:/i.test(text)) return true;
  if (/\bhow[\s_]?they[\s_]?connect\s*:/i.test(text)) return true;
  if (/\bconstraints?_and_falsifiability\s*:/i.test(text)) return true;
  const underscoreTemplateHits = (
    text.match(/\b(?:what|how|focus|constraints?|policy|mission|sources?)_[a-z0-9_]+\s*:/gi) ?? []
  ).length;
  if (underscoreTemplateHits >= 2) return true;
  if (
    /\bfocus anchor\s*:/i.test(text) &&
    /\b(?:what[\s_]?is[\s_]|how[\s_]?they[\s_]?connect|constraints?_and_)\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\bexport\s+default\s+function\b/i.test(text) &&
    /\b(?:useState|const\s+state\s*,\s*actions|\.tsx?\b)\b/i.test(text)
  ) {
    return true;
  }
  if (/\bhow they connect:\b/i.test(text) && /\bverification hooks|constraints and falsifiability|policy bounds\b/i.test(text)) {
    return true;
  }
  const fileRefHits = (
    text.match(
      /\b(?:[A-Za-z]:[\\/]|(?:docs|client|server|shared|modules|tests|scripts)[\\/]|[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yaml|yml))\S*/gi,
    ) ?? []
  ).length;
  const labelHits = (text.match(/\b(?:tree walk|checked files|searched terms|sources?:|evidence:|constraint:)\b/gi) ?? [])
    .length;
  const semanticHits = (
    text.match(
      /\b(?:is|are|means|refers|describes|involves|because|therefore|allows|helps|shows|occurs|happens)\b/gi,
    ) ?? []
  ).length;
  const citationBracketHits = (text.match(/\[[^\]]+\]/g) ?? []).length;
  const emptyBracketHits = (text.match(/\[\s*\]/g) ?? []).length;
  const sentenceHits = (text.match(/[.!?](?:\s|$)/g) ?? []).length;
  if (fileRefHits >= 3 && semanticHits <= 2) return true;
  if (fileRefHits >= 4 && labelHits >= 1) return true;
  if (labelHits >= 2 && fileRefHits >= 2 && semanticHits <= 2) return true;
  if (citationBracketHits >= 4 && fileRefHits >= 1 && semanticHits <= 12) return true;
  if (citationBracketHits >= 6 && semanticHits <= 5) return true;
  if (emptyBracketHits >= 2 && semanticHits <= 18) return true;
  if (/\bsources?\s*:\s*$/i.test(text) && (fileRefHits >= 1 || citationBracketHits >= 1)) return true;
  if (sentenceHits === 0 && fileRefHits >= 3) return true;
  return false;
}

export function sanitizeReasoningOutputText(source: string): string {
  return stripVoiceCitationArtifacts(source)
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isLikelyIdeologyDomainLeak(args: {
  promptText?: string;
  outputText: string;
}): boolean {
  const prompt = (args.promptText ?? "").trim();
  const output = args.outputText.trim();
  if (!prompt || !output) return false;
  if (
    !/\b(?:mission ethos|ideology scope|warp vessel|radiance to the sun|stewardship policy)\b/i.test(output)
  ) {
    return false;
  }
  if (/\b(?:mission ethos|ideology|ethos|warp bubble|warp drive|alcubierre|natario)\b/i.test(prompt)) {
    return false;
  }
  const promptTerms = new Set(extractIntentTerms(prompt, 18));
  if (promptTerms.size === 0) return true;
  let overlap = 0;
  for (const term of extractIntentTerms(output, 24)) {
    if (!promptTerms.has(term)) continue;
    overlap += 1;
    if (overlap >= 2) return false;
  }
  return true;
}

export function buildSpeakText(source: string, maxChars = SPEAK_TEXT_MAX_CHARS): string {
  const text = stripVoiceCitationArtifacts(source).trim();
  if (!text || maxChars <= 0) return "";
  if (text.length <= maxChars) return text;

  const capped = text.slice(0, maxChars).trimEnd();
  const boundaryIndex = Math.max(
    capped.lastIndexOf("\n"),
    capped.lastIndexOf("."),
    capped.lastIndexOf("!"),
    capped.lastIndexOf("?"),
  );
  const bounded = boundaryIndex > 0 ? capped.slice(0, boundaryIndex + 1).trimEnd() : capped;
  const fallback = bounded || capped;
  if (!fallback) return "";
  if (fallback.length < maxChars) return `${fallback}...`;
  if (maxChars === 1) return ".";
  return `${fallback.slice(0, maxChars - 1).trimEnd()}...`;
}

function hashVoiceUtteranceKey(source: string): string {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildVoiceAutoSpeakUtteranceId(parts: Array<string | undefined | null>): string {
  const normalized = parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(":");
  if (!normalized) {
    return `utt:${crypto.randomUUID()}`;
  }
  if (normalized.length <= VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS) {
    return normalized;
  }
  const digest = hashVoiceUtteranceKey(normalized);
  const headMax = Math.max(24, VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS - digest.length - 1);
  return `${normalized.slice(0, headMax)}:${digest}`;
}

function summarizeVoiceDebugText(source: string, maxChars = 220): string {
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}...`;
}

export function isActivePlayback(audio: HTMLAudioElement | null, active: HTMLAudioElement): boolean {
  return audio === active;
}

export type MicArmState = "off" | "on";
export type MicRuntimeState = "listening" | "transcribing" | "cooldown" | "error";
export type FloorOwner = "none" | "user" | "bot";
export type TurnState =
  | "user_speaking"
  | "soft_pause"
  | "hard_pause"
  | "bot_brief"
  | "bot_full"
  | "interrupted";

export type CompletionRoute = "ask_more" | "mirror_clarify" | "answer";

export type CompletionScore = {
  score: number;
  route: CompletionRoute;
};

export type TurnCompleteBand = "low" | "medium" | "high";

export type TurnCompleteScore = {
  score: number;
  band: TurnCompleteBand;
  reason: string;
};

export type IntentShiftBand = "continuation" | "shift";

export type IntentShiftScore = {
  score: number;
  band: IntentShiftBand;
  reason: string;
};

export type NarrativeSpine = {
  objective: string | null;
  phase: "observe" | "plan" | "retrieve" | "gate" | "synthesize" | "verify" | "execute" | "debrief";
  user_terms: string[];
  candidate_answer: string | null;
  open_question: string | null;
  evidence_anchor: string | null;
  next_action: string | null;
};

export type ConversationGovernorState = {
  floor_owner: FloorOwner;
  turn_state: TurnState;
  cooling_down: boolean;
  completion_score: CompletionScore;
  narrative_spine: NarrativeSpine;
};

export type ReasoningAttemptStatus =
  | "queued"
  | "running"
  | "streaming"
  | "done"
  | "failed"
  | "cancelled"
  | "suppressed";

export type ReasoningAttemptSource = "voice_auto" | "manual";
export type VoiceDecisionLifecycle =
  | "queued"
  | "running"
  | "suppressed"
  | "escalated"
  | "done"
  | "failed";

export type ReasoningAttempt = {
  id: string;
  traceId: string;
  turnId?: string;
  prompt: string;
  dispatchPrompt?: string;
  recordedText?: string | null;
  contextCapsuleIds?: string[];
  contextCapsuleCount?: number;
  contextCapsulePinnedCount?: number;
  source: ReasoningAttemptSource;
  profile?: "dot_min_steps_v1";
  status: ReasoningAttemptStatus;
  mode?: "observe" | "act" | "verify";
  suppression_reason?: string;
  routeReasonCode?: string;
  explorationTurn?: boolean;
  clarifierPolicy?: ConversationClarifierPolicy;
  explorationPacket?: ConversationExplorationPacket | null;
  explorationTopicKey?: string | null;
  explorationAttemptCount?: number;
  intentRevision?: number;
  transcriptRevision?: number;
  sealToken?: string | null;
  sealedAtMs?: number | null;
  intentShiftScore?: number;
  turnCompleteScore?: number;
  floorOwner?: FloorOwner;
  completionScore?: number;
  sttEngine?: string;
  sourceLanguage?: string | null;
  translated?: boolean;
  certaintyClass?: "confirmed" | "reasoned" | "hypothesis" | "unknown";
  evidenceRefs?: string[];
  conversationBriefBase?: string;
  partial: string;
  finalAnswer?: string;
  events: AskLiveEventEntry[];
  createdAtMs: number;
  updatedAtMs: number;
  completedAtMs?: number;
};

export type HelixTimelineEntryType =
  | "conversation_recorded"
  | "conversation_brief"
  | "reasoning_attempt"
  | "reasoning_stream"
  | "reasoning_final"
  | "action_receipt"
  | "suppressed";

export type HelixTimelineEntry = {
  id: string;
  type: HelixTimelineEntryType;
  source: ReasoningAttemptSource;
  status: "queued" | "running" | "streaming" | "done" | "failed" | "suppressed";
  text: string;
  detail?: string | null;
  mode?: "read" | "observe" | "act" | "verify" | "clarify";
  traceId?: string;
  attemptId?: string;
  createdAtMs: number;
  updatedAtMs: number;
  meta?: Record<string, unknown>;
};

export type VoiceCaptureWarningCode = "loopback_source" | "flat_signal" | "recorder_stalled";

export type VoiceCaptureCheckpointKey =
  | "track_live"
  | "signal_detected"
  | "segment_cut"
  | "stt_request_started"
  | "stt_response_ok"
  | "stt_response_error"
  | "translated"
  | "draft_appended"
  | "dispatch_queued"
  | "dispatch_suppressed"
  | "dispatch_completed";

export type VoiceCaptureCheckpointStatus = "idle" | "ok" | "warn" | "error";

export type VoiceCaptureCheckpoint = {
  key: VoiceCaptureCheckpointKey;
  status: VoiceCaptureCheckpointStatus;
  message: string | null;
  lastAtMs: number | null;
  latencyMs: number | null;
};

export type VoiceCaptureHealthSnapshot = {
  rmsRaw: number;
  rmsDb: number;
  peak: number;
  noiseFloor: number;
  displayLevel: number;
  mediaChunkCount: number;
  mediaBytes: number;
  chunksPerSecond: number;
  lastChunkAgeMs: number | null;
  warnings: VoiceCaptureWarningCode[];
  pipelineStatus: "idle" | "active" | "attention";
  lastRoundtripMs: number | null;
};

type VoiceMeterStats = {
  rmsRaw: number;
  rmsDb: number;
  peak: number;
  noiseFloor: number;
  displayLevel: number;
};

type VoiceRecorderStats = {
  mediaChunkCount: number;
  mediaBytes: number;
  lastChunkAtMs: number | null;
  chunksPerSecond: number;
};

type VoiceSegmentAttempt = {
  id: string;
  cutAtMs: number;
  durationMs: number;
  status: "segment_cut" | "transcribing" | "stt_ok" | "stt_error";
  sttLatencyMs: number | null;
  transcriptPreview: string | null;
  translated: boolean;
  dispatch: "none" | "queued" | "suppressed" | "completed";
  engine: string | null;
  error: string | null;
};

type VoiceConfirmedTurn = {
  id: string;
  traceId: string;
  segmentId: string;
  transcript: string;
  recordedText: string;
  completion: CompletionScore;
  turnComplete: TurnCompleteScore;
  sttEngine: string | null;
  sourceLanguage: string | null;
  translated: boolean;
  confidence: number;
  confidenceReason: string | null;
  needsConfirmation: boolean;
  translationUncertain: boolean;
};

type VoiceAutoSpeakTask = {
  key: string;
  kind: VoicePlaybackUtteranceKind;
  turnKey: string;
  revision: number;
  text: string;
  traceId?: string;
  eventId: string;
};

type VoiceDivergenceEventCode =
  | "divergence_detected"
  | "stale_revision_dropped"
  | "preempt_pending"
  | "preempt_applied"
  | "preempt_timeout_forced"
  | "ui_voice_revision_match";

type VoiceTurnRevisionState = {
  turnKey: string;
  latestTranscriptRevision: number;
  latestBriefRevision: number;
  latestFinalRevision: number;
  latestRevision: number;
  activeUtteranceRevision: number | null;
  pendingPreemptPolicy: VoicePreemptPolicy;
  pendingSwitchReason: "none" | "pending_preempt_by_final" | "pending_preempt_by_regen";
  pendingSinceMs: number | null;
  pendingDeadlineMs: number | null;
  uiVoiceRevisionMatch: boolean | null;
  lastEventCode: VoiceDivergenceEventCode | null;
  updatedAtMs: number;
};

type VoiceTurnAssemblerPhase = "draft" | "sealed";

type VoiceTurnAssemblerState = {
  turnKey: string;
  phase: VoiceTurnAssemblerPhase;
  transcriptRevision: number;
  sealedRevision: number;
  sealToken: string | null;
  sealedAtMs: number | null;
  draftTranscript: string;
  draftRecordedText: string;
  lastSpeechAtMs: number;
  hashStableSinceMs: number;
  currentTranscriptHash: string;
  sttQueueDepth: number;
  sttInFlight: boolean;
  heldPending: boolean;
  briefSpokenRevision: number;
  artifactRetryCountByRevision: Record<number, number>;
  sourceLanguage: string | null;
  translated: boolean;
  sttEngine: string | null;
  confidence: number;
  confidenceReason: string | null;
  completion: CompletionScore;
  turnComplete: TurnCompleteScore;
  segmentId: string | null;
  updatedAtMs: number;
};

type VoiceUtteranceRevision = {
  turnKey: string;
  revision: number;
  kind: VoicePlaybackUtteranceKind;
};

type VoiceDivergenceEvent = {
  code: VoiceDivergenceEventCode;
  turnKey: string;
  utteranceId: string | null;
  revision: number | null;
  detail: string | null;
  atMs: number;
};

type TranscriptConfirmState = {
  id: string;
  traceId: string;
  missionId: string | null;
  segmentId: string;
  transcript: string;
  sourceText: string | null;
  sourceLanguage: string | null;
  translated: boolean;
  translationUncertain: boolean;
  confidence: number;
  confidenceReason: string | null;
  completion: CompletionScore;
  turnComplete: TurnCompleteScore;
  sttEngine: string | null;
};

type HeldTranscriptReason = "continuation_hold" | "low_info_tail";

type HeldTranscriptState = {
  transcript: string;
  traceId: string;
  segmentId: string;
  recordedText: string;
  sourceLanguage: string | null;
  translated: boolean;
  sttEngine: string | null;
  confidence: number;
  confidenceReason: string | null;
  completion: CompletionScore;
  turnComplete: TurnCompleteScore;
  holdReason: HeldTranscriptReason;
  updatedAtMs: number;
};

type IntentRevisionState = {
  turnKey: string;
  revision: number;
  topicTerms: string[];
  mode: "observe" | "act" | "verify" | "clarify" | null;
  dispatchPromptHash: string;
  updatedAtMs: number;
};

type ExplorationRuntimeState = {
  attemptCount: number;
  clarifierAsked: boolean;
  packet: ConversationExplorationPacket | null;
  lastRouteReasonCode: string | null;
  updatedAtMs: number;
};

const VOICE_CAPTURE_CHECKPOINT_ORDER: VoiceCaptureCheckpointKey[] = [
  "track_live",
  "signal_detected",
  "segment_cut",
  "stt_request_started",
  "stt_response_ok",
  "stt_response_error",
  "translated",
  "draft_appended",
  "dispatch_queued",
  "dispatch_suppressed",
  "dispatch_completed",
];

const VOICE_CAPTURE_CHECKPOINT_LABEL: Record<VoiceCaptureCheckpointKey, string> = {
  track_live: "track live",
  signal_detected: "signal",
  segment_cut: "segment",
  stt_request_started: "stt request",
  stt_response_ok: "stt ok",
  stt_response_error: "stt error",
  translated: "translated",
  draft_appended: "draft append",
  dispatch_queued: "dispatch queued",
  dispatch_suppressed: "dispatch suppressed",
  dispatch_completed: "dispatch completed",
};

const VOICE_LEVEL_ATTACK_ALPHA = 0.55;
const VOICE_LEVEL_RELEASE_ALPHA = 0.18;
const VOICE_FLAT_SIGNAL_WINDOW_MS = 3000;
const VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD = 0.0016;
const VOICE_RECORDER_STALL_MS = 1200;

const MIC_PERSIST_KEY = "helix.ask.micCaptureEnabled.v1";
const MIC_SPEECH_START_MS = 120;
const MIC_SOFT_PAUSE_MS = 450;
const MIC_END_TURN_MS = 1200;
const MIC_MAX_SEGMENT_MS = 12_000;
const MIC_POST_TRANSCRIBE_COOLDOWN_MS = 600;
const VOICE_BARGE_RESUME_GRACE_MS = 2800;
const VOICE_BARGE_HARD_CUT_PERSIST_MS = 700;
const VOICE_BARGE_TRAFFIC_BUFFER_MS = 2600;
const VOICE_TRANSCRIPTION_BREATH_WINDOW_MS = 2600;
const VOICE_TURN_CLOSE_SILENCE_MS = 3200;
const VOICE_TURN_HASH_STABLE_DWELL_MS = 900;
const VOICE_TURN_SEAL_POLL_MS = 140;
const VOICE_TURN_GAMEPLAY_LOOP_MAX_MS = 30_000;
const VOICE_PLAYBACK_TRANSCRIBE_WAIT_POLL_MS = 120;
const VOICE_PLAYBACK_TRANSCRIBE_WAIT_MAX_MS = 4200;
const VOICE_CHUNK_SYNTH_MAX_ATTEMPTS = 2;
const VOICE_CHUNK_SYNTH_RETRY_BASE_MS = 220;
const VOICE_CHUNK_SYNTH_RETRY_JITTER_MS = 180;
const VOICE_CHUNK_SYNTH_RETRY_MAX_MS = 4000;
const VOICE_ARTIFACT_RESTART_MAX_ATTEMPTS = 3;
const MIC_RING_BUFFER_MS = 45_000;
const MIC_ANALYSIS_INTERVAL_MS = 60;
const MIC_LEVEL_UI_UPDATE_MS = 120;
const MIC_LEVEL_THRESHOLD = 0.03;
const MIC_LEVEL_MIN_THRESHOLD = 0.008;
const MIC_LEVEL_FLOOR_ALPHA = 0.92;
const MIC_LEVEL_FLOOR_MULTIPLIER = 2.4;
const VOICE_STT_CONFIRM_THRESHOLD = 0.58;
const VOICE_STT_TRANSLATION_CONFIRM_THRESHOLD = 0.68;
const VOICE_TURN_COMPLETE_HIGH_THRESHOLD = 0.72;
const VOICE_TURN_COMPLETE_MEDIUM_THRESHOLD = 0.5;
const VOICE_TURN_COMPLETE_MEDIUM_HOLD_MS = 420;
const VOICE_TURN_COMPLETE_LOW_HOLD_MS = 680;
const VOICE_PREEMPT_BOUNDARY_TIMEOUT_MS = 1200;
const VOICE_CONTINUATION_MERGE_WINDOW_MS = 9000;
const VOICE_CONTINUATION_ACTIVE_CHAIN_WINDOW_MS = 18_000;
const VOICE_CONTINUATION_SHORT_WORD_LIMIT = 14;
const VOICE_CONTINUATION_ADDENDUM_WORD_LIMIT = 20;
const VOICE_HELD_TRANSCRIPT_FLUSH_MS = 1800;
const VOICE_HELD_TRANSCRIPT_MAX_AGE_MS = 30_000;
const HELIX_CONTEXT_CAPSULE_MAX_IDS = 12;
const HELIX_CONTEXT_CAPSULE_AUTO_APPLY_IDS_VOICE = HELIX_CONTEXT_CAPSULE_MAX_IDS;
const HELIX_CONTEXT_CAPSULE_AUTO_APPLY_IDS_MANUAL = HELIX_CONTEXT_CAPSULE_MAX_IDS;
const HELIX_VOICE_AUTO_SPEAK_DEFAULT_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const HELIX_VOICE_AUTO_SPEAK_PROVIDER = "elevenlabs";
const HELIX_VOICE_AUTO_SPEAK_QUEUE_MAX = 8;
const HELIX_VOICE_AUTO_SPEAK_TEXT_MAX_CHARS = 2400;
const HELIX_VOICE_DEBUG_TIMELINE_LIMIT = 280;
const HELIX_TIMELINE_TYPE_LABEL: Record<HelixTimelineEntryType, string> = {
  conversation_recorded: "recorded",
  conversation_brief: "brief",
  reasoning_attempt: "reasoning",
  reasoning_stream: "stream",
  reasoning_final: "final",
  action_receipt: "action",
  suppressed: "suppressed",
};

const SESSION_CAPSULE_CONFIDENCE_LABEL: Record<SessionCapsuleConfidenceBand, string> = {
  reinforcing: "reinforcing",
  building: "building",
  uncertain: "uncertain",
};

function createVoiceCaptureCheckpointMap(): Record<VoiceCaptureCheckpointKey, VoiceCaptureCheckpoint> {
  return VOICE_CAPTURE_CHECKPOINT_ORDER.reduce(
    (acc, key) => {
      acc[key] = {
        key,
        status: "idle",
        message: null,
        lastAtMs: null,
        latencyMs: null,
      };
      return acc;
    },
    {} as Record<VoiceCaptureCheckpointKey, VoiceCaptureCheckpoint>,
  );
}

const CONTEXT_CAPSULE_PROOF_POSTURE_SCORE: Record<ContextCapsuleConvergence["proofPosture"], number> = {
  confirmed: 5,
  reasoned: 4,
  hypothesis: 3,
  unknown: 2,
  fail_closed: 1,
};

const CONTEXT_CAPSULE_MATURITY_SCORE: Record<ContextCapsuleConvergence["maturity"], number> = {
  certified: 4,
  diagnostic: 3,
  reduced_order: 2,
  exploratory: 1,
};

const CONTEXT_CAPSULE_PROOF_VERDICT_SCORE: Record<ContextCapsuleSummary["commit"]["proof_verdict"], number> = {
  PASS: 3,
  UNKNOWN: 2,
  FAIL: 1,
};

function resolveSessionCapsuleConfidenceBand(
  summary: ContextCapsuleSummary,
): SessionCapsuleConfidenceBand {
  if (
    summary.convergence.proofPosture === "fail_closed" ||
    summary.commit.proof_verdict === "FAIL" ||
    summary.commit.certificate_integrity_ok === false
  ) {
    return "uncertain";
  }
  if (summary.convergence.proofPosture === "confirmed") {
    return "reinforcing";
  }
  if (
    summary.convergence.proofPosture === "reasoned" &&
    (summary.commit.proof_verdict === "PASS" || summary.convergence.maturity === "certified")
  ) {
    return "reinforcing";
  }
  if (
    summary.convergence.proofPosture === "reasoned" ||
    summary.convergence.proofPosture === "hypothesis" ||
    summary.convergence.maturity === "diagnostic" ||
    summary.convergence.maturity === "certified"
  ) {
    return "building";
  }
  return "uncertain";
}

export function deriveSessionCapsuleState(
  entries: ContextCapsuleLedgerEntry[],
): SessionCapsuleState | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const latest = [...entries].sort((a, b) => {
    const touchedDelta = b.touchedAtMs - a.touchedAtMs;
    if (touchedDelta !== 0) return touchedDelta;
    const createdDelta = b.summary.createdAtTsMs - a.summary.createdAtTsMs;
    if (createdDelta !== 0) return createdDelta;
    return a.id.localeCompare(b.id);
  })[0];
  return {
    id: latest.id,
    summary: latest.summary,
    confidenceBand: resolveSessionCapsuleConfidenceBand(latest.summary),
  };
}

function resolveContextCapsuleLedgerId(
  summary: Pick<ContextCapsuleSummary, "fingerprint" | "capsuleId">,
): string | null {
  return (
    normalizeContextCapsuleId(summary.fingerprint) ??
    normalizeContextCapsuleId(summary.capsuleId)
  );
}

export function compareContextCapsuleSummariesByRank(
  a: ContextCapsuleSummary,
  b: ContextCapsuleSummary,
): number {
  const proofPostureDelta =
    CONTEXT_CAPSULE_PROOF_POSTURE_SCORE[b.convergence.proofPosture] -
    CONTEXT_CAPSULE_PROOF_POSTURE_SCORE[a.convergence.proofPosture];
  if (proofPostureDelta !== 0) return proofPostureDelta;

  const maturityDelta =
    CONTEXT_CAPSULE_MATURITY_SCORE[b.convergence.maturity] -
    CONTEXT_CAPSULE_MATURITY_SCORE[a.convergence.maturity];
  if (maturityDelta !== 0) return maturityDelta;

  const proofVerdictDelta =
    CONTEXT_CAPSULE_PROOF_VERDICT_SCORE[b.commit.proof_verdict] -
    CONTEXT_CAPSULE_PROOF_VERDICT_SCORE[a.commit.proof_verdict];
  if (proofVerdictDelta !== 0) return proofVerdictDelta;

  const integrityScoreA =
    a.commit.certificate_integrity_ok === true ? 2 : a.commit.certificate_integrity_ok === false ? 0 : 1;
  const integrityScoreB =
    b.commit.certificate_integrity_ok === true ? 2 : b.commit.certificate_integrity_ok === false ? 0 : 1;
  const integrityDelta = integrityScoreB - integrityScoreA;
  if (integrityDelta !== 0) return integrityDelta;

  const createdAtDelta = b.createdAtTsMs - a.createdAtTsMs;
  if (createdAtDelta !== 0) return createdAtDelta;

  return a.fingerprint.localeCompare(b.fingerprint);
}

function compareContextCapsuleLedgerEntriesByRank(
  a: ContextCapsuleLedgerEntry,
  b: ContextCapsuleLedgerEntry,
): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }
  return compareContextCapsuleSummariesByRank(a.summary, b.summary);
}

function compareContextCapsuleLedgerEntriesForSelection(
  a: ContextCapsuleLedgerEntry,
  b: ContextCapsuleLedgerEntry,
): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }
  const touchedDelta = b.touchedAtMs - a.touchedAtMs;
  if (touchedDelta !== 0) return touchedDelta;
  if (a.pinnedAtMs !== b.pinnedAtMs) {
    return (b.pinnedAtMs ?? 0) - (a.pinnedAtMs ?? 0);
  }
  return compareContextCapsuleSummariesByRank(a.summary, b.summary);
}

export function upsertContextCapsuleLedger(args: {
  entries: ContextCapsuleLedgerEntry[];
  summary: ContextCapsuleSummary;
  pin?: boolean;
  maxEntries?: number;
  nowMs?: number;
}): ContextCapsuleLedgerEntry[] {
  const maxEntries = Math.max(
    1,
    Math.min(args.maxEntries ?? HELIX_CONTEXT_CAPSULE_MAX_IDS, HELIX_CONTEXT_CAPSULE_MAX_IDS),
  );
  const nowMs = args.nowMs ?? Date.now();
  const capsuleId = resolveContextCapsuleLedgerId(args.summary);
  if (!capsuleId) {
    return [...args.entries].sort(compareContextCapsuleLedgerEntriesByRank).slice(0, maxEntries);
  }

  const existingIndex = args.entries.findIndex((entry) => entry.id === capsuleId);
  const pin = args.pin === true;
  const nextEntries = [...args.entries];
  if (existingIndex >= 0) {
    const existing = nextEntries[existingIndex];
    nextEntries[existingIndex] = {
      ...existing,
      summary: args.summary,
      pinned: existing.pinned || pin,
      pinnedAtMs: existing.pinnedAtMs ?? (pin ? nowMs : null),
      touchedAtMs: nowMs,
    };
  } else {
    nextEntries.push({
      id: capsuleId,
      summary: args.summary,
      pinned: pin,
      pinnedAtMs: pin ? nowMs : null,
      touchedAtMs: nowMs,
    });
  }

  while (nextEntries.length > maxEntries) {
    const evictionPool = nextEntries.some((entry) => !entry.pinned)
      ? nextEntries.filter((entry) => !entry.pinned)
      : nextEntries;
    const lowest = [...evictionPool]
      .sort((a, b) => compareContextCapsuleSummariesByRank(a.summary, b.summary))
      .at(-1);
    if (!lowest) break;
    const dropIndex = nextEntries.findIndex((entry) => entry.id === lowest.id);
    if (dropIndex < 0) break;
    nextEntries.splice(dropIndex, 1);
  }

  return nextEntries.sort(compareContextCapsuleLedgerEntriesByRank).slice(0, maxEntries);
}

export function buildSelectedContextCapsuleIds(args: {
  ledgerEntries: ContextCapsuleLedgerEntry[];
  prompt?: string;
  inlineCapsuleIds?: string[];
  maxIds?: number;
}): string[] {
  const maxIds = Math.max(
    1,
    Math.min(args.maxIds ?? HELIX_CONTEXT_CAPSULE_MAX_IDS, HELIX_CONTEXT_CAPSULE_MAX_IDS),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string | null | undefined) => {
    const normalized = normalizeContextCapsuleId(value ?? null);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  const inlineIds = args.inlineCapsuleIds ?? extractContextCapsuleIdsFromText(args.prompt ?? "");
  for (const inlineId of inlineIds) {
    push(inlineId);
    if (out.length >= maxIds) return out;
  }

  const orderedLedger = [...args.ledgerEntries].sort(compareContextCapsuleLedgerEntriesForSelection);
  for (const entry of orderedLedger) {
    push(entry.id);
    if (out.length >= maxIds) return out;
  }

  return out;
}

export function buildLatestWinsContextCapsuleIds(args: {
  ledgerEntries: ContextCapsuleLedgerEntry[];
  prompt?: string;
  inlineCapsuleIds?: string[];
  maxIds?: number;
}): string[] {
  const maxIds = Math.max(
    1,
    Math.min(args.maxIds ?? HELIX_CONTEXT_CAPSULE_MAX_IDS, HELIX_CONTEXT_CAPSULE_MAX_IDS),
  );
  const inlineIds = args.inlineCapsuleIds ?? extractContextCapsuleIdsFromText(args.prompt ?? "");
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string | null | undefined) => {
    const normalized = normalizeContextCapsuleId(value ?? null);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };
  for (const inlineId of inlineIds) {
    push(inlineId);
    if (out.length >= maxIds) return out;
  }
  const recencySorted = [...args.ledgerEntries].sort(compareContextCapsuleLedgerEntriesForSelection);
  const confidenceSorted = [...args.ledgerEntries].sort(compareContextCapsuleLedgerEntriesByRank);
  let recencyIndex = 0;
  let confidenceIndex = 0;
  while (out.length < maxIds && (recencyIndex < recencySorted.length || confidenceIndex < confidenceSorted.length)) {
    for (let step = 0; step < 2 && recencyIndex < recencySorted.length && out.length < maxIds; step += 1) {
      push(recencySorted[recencyIndex]?.id);
      recencyIndex += 1;
    }
    if (confidenceIndex < confidenceSorted.length && out.length < maxIds) {
      push(confidenceSorted[confidenceIndex]?.id);
      confidenceIndex += 1;
    }
  }
  return out.slice(0, maxIds);
}

export function smoothVoiceLevel(
  previous: number,
  nextRaw: number,
  attack = VOICE_LEVEL_ATTACK_ALPHA,
  release = VOICE_LEVEL_RELEASE_ALPHA,
): number {
  const prev = clamp01(previous);
  const next = clamp01(nextRaw);
  const alpha = clampNumber(next >= prev ? attack : release, 0, 1);
  return clamp01(prev + (next - prev) * alpha);
}

export function isFlatVoiceSignal(
  variance: number,
  elapsedMs: number,
  threshold = VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD,
  windowMs = VOICE_FLAT_SIGNAL_WINDOW_MS,
): boolean {
  return variance <= threshold && elapsedMs >= windowMs;
}

export function isRecorderStalled(params: {
  recorderActive: boolean;
  nowMs: number;
  recorderStartedAtMs: number | null;
  lastChunkAtMs: number | null;
  stallMs?: number;
}): boolean {
  const stallMs = params.stallMs ?? VOICE_RECORDER_STALL_MS;
  if (!params.recorderActive) return false;
  const referenceMs = params.lastChunkAtMs ?? params.recorderStartedAtMs;
  if (referenceMs === null) return false;
  return params.nowMs - referenceMs >= stallMs;
}

export function isLikelyLoopbackDeviceLabel(label: string): boolean {
  return /\b(output|loopback|stereo mix|vb-audio|voicemeeter|what u hear)\b/i.test(label.trim());
}

export function shouldPrimeSegmentWithContainerHeader(params: {
  segmentStartIndex: number;
  mimeType?: string | null;
  hasHeaderChunk: boolean;
}): boolean {
  if (!params.hasHeaderChunk) return false;
  if (params.segmentStartIndex <= 0) return false;
  const normalized = (params.mimeType ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes("webm") ||
    normalized.includes("ogg") ||
    normalized.includes("mp4") ||
    normalized.includes("mpeg") ||
    normalized.includes("mp3") ||
    normalized.includes("wav")
  );
}

function pickMicRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const mimeType of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    } catch {
      // continue checking the next mime type
    }
  }
  return undefined;
}

export function inferAskMode(question: string): "observe" | "act" | "verify" | undefined {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return undefined;

  if (
    /\b(verify|verification|prove|proof|validate|validation|integrity|certificate|pass\/fail|pass fail|audit|check)\b/.test(
      normalized,
    )
  ) {
    return "verify";
  }

  if (
    /^(please\s+)?(implement|fix|change|update|remove|add|create|open|start|stop|run|patch|rewrite)\b/.test(
      normalized,
    ) ||
    /\b(next action|take action|fix this|implement this|make this|change this|update this)\b/.test(
      normalized,
    )
  ) {
    return "act";
  }

  if (
    /\b(observe|monitor|watch|track|status|state|what changed|what is happening|inspect|summarize the current)\b/.test(
      normalized,
    )
  ) {
    return "observe";
  }

  return undefined;
}

export function mergeVoiceTranscriptDraft(currentDraft: string, transcript: string): string {
  const normalizedSegment = transcript
    .trim()
    .replace(/^\.\.\.\s*/, "")
    .replace(/\s*\.\.\.$/, "");
  if (!normalizedSegment) return currentDraft;
  const normalizedDraft = currentDraft.trimEnd().replace(/\s*\.\.\.$/, "");
  const joiner = normalizedDraft && !/\s$/.test(normalizedDraft) ? " " : "";
  return `${normalizedDraft}${joiner}${normalizedSegment}`;
}

export function shouldMergeVoiceContinuationTurn(args: {
  previousPrompt: string;
  nextTranscript: string;
  gapMs: number;
  windowMs?: number;
}): boolean {
  const windowMs = args.windowMs ?? VOICE_CONTINUATION_MERGE_WINDOW_MS;
  if (args.gapMs < 0 || args.gapMs > windowMs) return false;
  const previous = args.previousPrompt.trim();
  const next = args.nextTranscript.trim();
  if (!previous || !next) return false;
  const nextWords = next.split(/\s+/).filter(Boolean);
  const nextStartsContinuation =
    /^[a-z]/.test(next) ||
    /^(and|but|so|then|because|which|that|who|where|when|while|if|with|for|to|used|using)\b/i.test(
      next,
    );
  if (nextStartsContinuation) return true;
  const previousLooksIncomplete = !/[.!?]["')\]]?\s*$/.test(previous);
  return previousLooksIncomplete && nextWords.length <= VOICE_CONTINUATION_SHORT_WORD_LIMIT;
}

export function shouldMergeVoiceContinuationInFlight(args: {
  gapMs: number;
  lexicalContinuation: boolean;
  activeWindowMs?: number;
}): boolean {
  const activeWindowMs = args.activeWindowMs ?? VOICE_CONTINUATION_ACTIVE_CHAIN_WINDOW_MS;
  if (args.gapMs < 0) return false;
  if (args.gapMs <= activeWindowMs) return true;
  return args.lexicalContinuation;
}

export function shouldRestartExplorationLadderOnSupersede(args: {
  hasContinuityCandidate: boolean;
  forceTailContinuationMerge: boolean;
  shortContinuationAddendum: boolean;
  canMergeContinuation: boolean;
  intentShiftBand: IntentShiftBand;
}): boolean {
  if (!args.hasContinuityCandidate) return false;
  if (args.forceTailContinuationMerge || args.shortContinuationAddendum) return false;
  if (args.canMergeContinuation && args.intentShiftBand === "continuation") return false;
  return true;
}

export function hasDanglingTurnTail(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
  if (!normalized) return false;
  return /\b(and|or|but|so|because|that|which|who|when|where|why|what|how|if|to|of|for|with|in|on|at|from|is|are|was|were|be|been|being|the|a|an|it|this|these|those|my|your|our|their|does|do|did|can|could|would|will)\s*$/.test(
    normalized,
  );
}

export function isLowInformationTailTranscript(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  if (!normalized) return true;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 3) return false;
  if (/\b(verify|check|prove|fix|implement|change|update|explain|define|what|why|how)\b/.test(normalized)) {
    return false;
  }
  const compact = words.join("");
  return compact.length <= 18;
}

export function isLikelyContinuationAddendum(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > VOICE_CONTINUATION_ADDENDUM_WORD_LIMIT) return false;
  return /^(and|so|but|then|because|which|that|also|plus|right|yeah|yes|well)\b/.test(normalized);
}

export function isLikelyContinuationTailFragment(transcript: string): boolean {
  const trimmed = transcript.trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 14) return false;
  if (/[?]$/.test(trimmed)) return false;
  if (
    /^(what|why|how|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were|explain|define|describe)\b/.test(
      normalized,
    )
  ) {
    return false;
  }
  const startsLower = /^[a-z]/.test(trimmed);
  if (!startsLower) return false;
  return /\b(this|that|it|they|them|those|these|happens?|effect|result|probability|because|within)\b/.test(
    normalized,
  );
}

export function extractLatestContinuationQuestionFocus(transcript: string): string | null {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (sentences.length < 2) return null;
  const last = sentences[sentences.length - 1] ?? "";
  if (!last) return null;
  const lowered = last.toLowerCase();
  const looksQuestionPivot =
    /^(?:so|and|right|okay|ok|well)[,\s]+/.test(lowered) ||
    /^(?:what about|how about|can you|could you|would you|please)\b/.test(lowered) ||
    /\?$/.test(last);
  if (!looksQuestionPivot) return null;
  const hasIntentVerb = /\b(?:what about|how about|explain|define|relate|compare|tell|walk me through|can you)\b/.test(
    lowered,
  );
  if (!hasIntentVerb && !/\?$/.test(last)) return null;
  if (last.length < 12) return null;
  return clipText(last, 360);
}

export type VoiceBargeHardCutReason =
  | "speech_persisted"
  | "stt_queue"
  | "stt_busy"
  | "pending_confirmation";

export function resolveVoiceBargeHardCutReason(args: {
  holdActive: boolean;
  holdStartedAtMs: number | null;
  nowMs: number;
  transcribeQueueLength: number;
  transcribeBusy: boolean;
  pendingConfirmation: boolean;
  speechActive: boolean;
  persistMs?: number;
}): VoiceBargeHardCutReason | null {
  if (!args.holdActive) return null;
  if (args.pendingConfirmation) return "pending_confirmation";
  // Only escalate to an STT-queue hard cut while speech is actively present.
  // Queue growth by itself can happen during normal segment rollover and should
  // not suppress upcoming brief playback.
  if (args.transcribeQueueLength > 0 && args.speechActive) return "stt_queue";
  if (args.transcribeBusy) return "stt_busy";
  const persistMs = args.persistMs ?? VOICE_BARGE_HARD_CUT_PERSIST_MS;
  if (
    args.speechActive &&
    args.holdStartedAtMs !== null &&
    args.nowMs - args.holdStartedAtMs >= Math.max(0, persistMs)
  ) {
    return "speech_persisted";
  }
  return null;
}

export function shouldResumeBargeHeldPlayback(args: {
  holdActive: boolean;
  resumeNotBeforeMs: number | null;
  nowMs: number;
  transcribeQueueLength: number;
  transcribeBusy: boolean;
  pendingConfirmation: boolean;
  speechActive: boolean;
  micArmed: boolean;
  segmentFlushPending: boolean;
  trafficQuietUntilMs: number | null;
}): boolean {
  if (!args.holdActive) return false;
  if (args.resumeNotBeforeMs === null || args.nowMs < args.resumeNotBeforeMs) return false;
  if (args.transcribeBusy || args.transcribeQueueLength > 0 || args.pendingConfirmation) return false;
  if (args.speechActive || !args.micArmed || args.segmentFlushPending) return false;
  if (args.trafficQuietUntilMs !== null && args.nowMs < args.trafficQuietUntilMs) return false;
  return true;
}

export function shouldRecoverHeldTranscriptAfterNoTranscript(args: {
  heldTranscript: string;
  turnCompleteBand: TurnCompleteScore["band"];
  transcribeQueueLength: number;
  speechActive: boolean;
  sinceLastSpeechMs: number;
}): boolean {
  const held = args.heldTranscript.trim();
  if (!held) return false;
  if (isLowInformationTailTranscript(held)) return false;
  if (args.transcribeQueueLength > 0) return false;
  if (args.speechActive) return false;
  if (args.turnCompleteBand === "high" && args.sinceLastSpeechMs >= VOICE_TURN_CLOSE_SILENCE_MS) {
    return true;
  }
  if (
    args.turnCompleteBand === "medium" &&
    !hasDanglingTurnTail(held) &&
    args.sinceLastSpeechMs >= VOICE_TURN_CLOSE_SILENCE_MS
  ) {
    return true;
  }
  return false;
}

export function shouldFlushHeldTranscriptFromWatchdog(args: {
  heldTranscript: string;
  holdReason: HeldTranscriptReason;
  transcribeQueueLength: number;
  speechActive: boolean;
  transcribeBusy: boolean;
  pendingConfirmation: boolean;
  sinceLastSpeechMs: number;
  ageMs: number;
}): boolean {
  const held = args.heldTranscript.trim();
  if (!held) return false;
  if (args.holdReason !== "continuation_hold") return false;
  if (args.ageMs < VOICE_HELD_TRANSCRIPT_FLUSH_MS) return false;
  if (args.ageMs > VOICE_HELD_TRANSCRIPT_MAX_AGE_MS) return false;
  if (args.transcribeQueueLength > 0) return false;
  if (args.speechActive || args.transcribeBusy || args.pendingConfirmation) return false;
  const turnComplete = scoreVoiceTurnComplete({
    transcript: held,
    pauseMs: Math.max(args.sinceLastSpeechMs, MIC_END_TURN_MS),
    stability: 0.92,
  });
  return shouldRecoverHeldTranscriptAfterNoTranscript({
    heldTranscript: held,
    turnCompleteBand: turnComplete.band,
    transcribeQueueLength: args.transcribeQueueLength,
    speechActive: args.speechActive,
    sinceLastSpeechMs: args.sinceLastSpeechMs,
  });
}

export function evaluateVoiceTurnSealGate(args: {
  sinceLastSpeechMs: number;
  sttQueueDepth: number;
  sttInFlight: boolean;
  heldPending: boolean;
  hashStableDwellMs: number;
  closeSilenceMs?: number;
  hashStableMs?: number;
}): boolean {
  const closeSilenceMs = args.closeSilenceMs ?? VOICE_TURN_CLOSE_SILENCE_MS;
  const hashStableMs = args.hashStableMs ?? VOICE_TURN_HASH_STABLE_DWELL_MS;
  return (
    args.sinceLastSpeechMs >= closeSilenceMs &&
    args.sttQueueDepth <= 0 &&
    !args.sttInFlight &&
    !args.heldPending &&
    args.hashStableDwellMs >= hashStableMs
  );
}

export function scoreConversationCompletion(input: {
  transcript: string;
  pauseMs: number;
  stability: number;
}): CompletionScore {
  const text = input.transcript.trim();
  const stability = Math.max(0, Math.min(1, input.stability));
  let score = 0.2 + stability * 0.45;
  if (/[.!?]$/.test(text)) score += 0.18;
  if (/\b(and|but|or|because|so)\s*$/i.test(text)) score -= 0.16;
  if (/\b(this|that|it|they|those|these)\b/i.test(text) && !/\b(is|are|means|does)\b/i.test(text)) {
    score -= 0.08;
  }
  if (input.pauseMs >= MIC_SOFT_PAUSE_MS) score += 0.06;
  if (input.pauseMs >= MIC_END_TURN_MS) score += 0.12;
  score = Math.max(0, Math.min(1, score));
  if (score < 0.45) return { score, route: "ask_more" };
  if (score < 0.75) return { score, route: "mirror_clarify" };
  return { score, route: "answer" };
}

export function deriveTranscriptConfidence(args: {
  transcript: string;
  providerConfidence?: number | null;
  segments?: Array<{ confidence?: number }>;
}): { confidence: number; reason: string } {
  const provider = typeof args.providerConfidence === "number" && Number.isFinite(args.providerConfidence)
    ? clamp01(args.providerConfidence)
    : null;
  if (provider !== null) {
    return { confidence: provider, reason: "provider_reported" };
  }
  const segmentConfidenceValues = (args.segments ?? [])
    .map((segment) =>
      typeof segment?.confidence === "number" && Number.isFinite(segment.confidence)
        ? clamp01(segment.confidence)
        : null,
    )
    .filter((value): value is number => value !== null);
  if (segmentConfidenceValues.length > 0) {
    const avg =
      segmentConfidenceValues.reduce((sum, value) => sum + value, 0) / segmentConfidenceValues.length;
    return { confidence: clamp01(avg), reason: "segment_average" };
  }
  const text = args.transcript.trim();
  if (!text) return { confidence: 0, reason: "empty_text" };
  let score = 0.5;
  if (text.length >= 20) score += 0.12;
  if (text.length >= 56) score += 0.12;
  if (/[.!?]["')\]]?$/.test(text)) score += 0.08;
  if (/\b(and|but|or|because|so)\s*$/i.test(text)) score -= 0.08;
  if (/[\u0000-\u001F�]/.test(text)) score -= 0.24;
  const normalized = text.replace(/\s+/g, "");
  if (normalized.length > 0) {
    const alnum = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
    const ratio = alnum / normalized.length;
    if (ratio < 0.45) score -= 0.12;
    if (ratio > 0.85) score += 0.04;
  }
  return { confidence: clamp01(score), reason: "heuristic_text_quality" };
}

export function shouldRequireTranscriptConfirmation(args: {
  confidence: number;
  translationUncertain: boolean;
  providerNeedsConfirmation?: boolean;
}): boolean {
  if (args.providerNeedsConfirmation === true) return true;
  if (args.translationUncertain) return true;
  return args.confidence < VOICE_STT_CONFIRM_THRESHOLD;
}

export function scoreVoiceTurnComplete(input: {
  transcript: string;
  pauseMs: number;
  stability: number;
}): TurnCompleteScore {
  const text = input.transcript.trim();
  const completion = scoreConversationCompletion({
    transcript: text,
    pauseMs: input.pauseMs,
    stability: input.stability,
  });
  let score = completion.score;
  const hasTerminalPunctuation = /[.!?]["')\]]?$/.test(text);
  const trailingConnector = /\b(and|but|or|because|so|which|that|if|when|while|to)\s*$/i.test(text);
  const trailingQuestionStem =
    /\b(how|why|what|where|when|who)\s+(does|do|is|are|can|could|would|will|did)?\s*$/i.test(text);
  const unresolvedReferent =
    /\b(this|that|it|they|those|these)\b/i.test(text) && !/\b(is|are|was|were|means|refers|comes)\b/i.test(text);
  const shortTurn = text.split(/\s+/).filter(Boolean).length < 5;
  if (hasTerminalPunctuation) score += 0.05;
  if (trailingConnector) score -= 0.12;
  if (trailingQuestionStem) score -= 0.16;
  if (unresolvedReferent) score -= 0.08;
  if (shortTurn) score -= 0.08;
  score = clamp01(score);
  if (score >= VOICE_TURN_COMPLETE_HIGH_THRESHOLD) {
    return { score, band: "high", reason: "lexical_closure_high" };
  }
  if (score >= VOICE_TURN_COMPLETE_MEDIUM_THRESHOLD) {
    return { score, band: "medium", reason: "likely_continuation_hold" };
  }
  return { score, band: "low", reason: "incomplete_turn_hold" };
}

function extractIntentTerms(text: string, maxTerms = 8): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .slice(0, maxTerms);
}

export function scoreIntentShift(args: {
  activePrompt: string;
  nextTranscript: string;
}): IntentShiftScore {
  const prevTerms = new Set(extractIntentTerms(args.activePrompt, 16));
  const nextTerms = new Set(extractIntentTerms(args.nextTranscript, 16));
  if (nextTerms.size === 0) {
    return { score: 0, band: "continuation", reason: "no_terms" };
  }
  let overlap = 0;
  for (const term of nextTerms) {
    if (prevTerms.has(term)) overlap += 1;
  }
  const union = new Set([...prevTerms, ...nextTerms]).size || 1;
  const jaccard = overlap / union;
  const explicitShift =
    /\b(new topic|different topic|switch|instead|unrelated|another question)\b/i.test(
      args.nextTranscript.trim().toLowerCase(),
    );
  const score = clamp01((1 - jaccard) * 0.82 + (explicitShift ? 0.26 : 0));
  if (score >= 0.56) {
    return { score, band: "shift", reason: explicitShift ? "explicit_topic_shift" : "semantic_shift" };
  }
  return { score, band: "continuation", reason: "semantic_continuation" };
}

export type VoiceReasoningResponseAuthorityDecision = {
  suppress: boolean;
  reason:
    | "ok"
    | "continuation_merged"
    | "stale_prompt"
    | "stale_revision"
    | "stale_dispatch_hash"
    | "inactive_attempt";
  restart: boolean;
};

export function evaluateVoiceReasoningResponseAuthority(args: {
  source: ReasoningAttemptSource;
  continuationRestartRequested: boolean;
  latestAskPromptForAttempt: string;
  askPromptForRequest: string;
  latestAttemptStatus?: ReasoningAttemptStatus;
  requestIntentRevision?: number;
  latestIntentRevision?: number;
  latestAttemptIntentRevision?: number;
  requestDispatchPromptHash?: string | null;
  latestDispatchPromptHash?: string | null;
  attemptTranscriptRevision?: number | null;
  latestSealedTranscriptRevision?: number | null;
  attemptSealToken?: string | null;
  latestSealToken?: string | null;
  assemblerPhase?: VoiceTurnAssemblerPhase | null;
}): VoiceReasoningResponseAuthorityDecision {
  if (args.continuationRestartRequested) {
    return { suppress: true, reason: "continuation_merged", restart: true };
  }
  if (
    args.latestAttemptStatus === "suppressed" ||
    args.latestAttemptStatus === "cancelled" ||
    args.latestAttemptStatus === "failed"
  ) {
    return { suppress: true, reason: "inactive_attempt", restart: false };
  }
  if (
    args.latestAskPromptForAttempt.length > 0 &&
    args.latestAskPromptForAttempt !== args.askPromptForRequest.trim()
  ) {
    return { suppress: true, reason: "stale_prompt", restart: true };
  }
  if (args.source !== "voice_auto") {
    return { suppress: false, reason: "ok", restart: false };
  }
  if (args.assemblerPhase && args.assemblerPhase !== "sealed") {
    return { suppress: true, reason: "inactive_attempt", restart: false };
  }
  const attemptTranscriptRevision =
    typeof args.attemptTranscriptRevision === "number" && Number.isFinite(args.attemptTranscriptRevision)
      ? Math.max(0, Math.floor(args.attemptTranscriptRevision))
      : null;
  const latestSealedTranscriptRevision =
    typeof args.latestSealedTranscriptRevision === "number" &&
    Number.isFinite(args.latestSealedTranscriptRevision)
      ? Math.max(0, Math.floor(args.latestSealedTranscriptRevision))
      : null;
  if (
    attemptTranscriptRevision !== null &&
    latestSealedTranscriptRevision !== null &&
    attemptTranscriptRevision !== latestSealedTranscriptRevision
  ) {
    return { suppress: true, reason: "stale_revision", restart: false };
  }
  const attemptSealToken = args.attemptSealToken?.trim() || null;
  const latestSealToken = args.latestSealToken?.trim() || null;
  if (attemptSealToken && latestSealToken && attemptSealToken !== latestSealToken) {
    return { suppress: true, reason: "stale_revision", restart: false };
  }
  const requestIntentRevision =
    typeof args.requestIntentRevision === "number" && Number.isFinite(args.requestIntentRevision)
      ? args.requestIntentRevision
      : null;
  const latestIntentRevision =
    typeof args.latestIntentRevision === "number" && Number.isFinite(args.latestIntentRevision)
      ? args.latestIntentRevision
      : null;
  const latestAttemptIntentRevision =
    typeof args.latestAttemptIntentRevision === "number" &&
    Number.isFinite(args.latestAttemptIntentRevision)
      ? args.latestAttemptIntentRevision
      : null;
  if (
    requestIntentRevision !== null &&
    latestAttemptIntentRevision !== null &&
    requestIntentRevision !== latestAttemptIntentRevision
  ) {
    return { suppress: true, reason: "stale_revision", restart: true };
  }
  if (
    requestIntentRevision !== null &&
    latestIntentRevision !== null &&
    requestIntentRevision < latestIntentRevision
  ) {
    return { suppress: true, reason: "stale_revision", restart: true };
  }
  if (
    latestAttemptIntentRevision !== null &&
    latestIntentRevision !== null &&
    latestAttemptIntentRevision < latestIntentRevision
  ) {
    return { suppress: true, reason: "stale_revision", restart: true };
  }
  const requestDispatchPromptHash = args.requestDispatchPromptHash?.trim() || null;
  const latestDispatchPromptHash = args.latestDispatchPromptHash?.trim() || null;
  if (
    requestDispatchPromptHash !== null &&
    latestDispatchPromptHash !== null &&
    requestDispatchPromptHash !== latestDispatchPromptHash
  ) {
    return { suppress: true, reason: "stale_dispatch_hash", restart: true };
  }
  return { suppress: false, reason: "ok", restart: false };
}

export function shouldDispatchReasoningAttempt(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  const text = normalized
    .replace(/^(?:(?:ok(?:ay)?)|yeah|yep|nope|thanks|thank you|cool|nice|right|well|so|um|uh)\b[,\s:-]*/g, "")
    .trim();
  const effective = text || normalized;
  if (effective.length < 14) return false;
  if (/^(ok|okay|yeah|yep|nope|thanks|thank you|cool|nice|right)\b$/.test(effective)) return false;
  if (/\b(verify|prove|check|pass fail|certificate|integrity|evidence|risk|decision)\b/.test(effective)) {
    return true;
  }
  if (/\b(implement|fix|change|update|remove|add|create|run|patch|deploy|execute)\b/.test(effective)) {
    return true;
  }
  if (/\b(what changed|status|monitor|state|watch)\b/.test(effective)) {
    return true;
  }
  if (
    /\b(how|why|explain|define|walk me through|full solve|tell me about|break down|understand)\b/.test(
      effective,
    )
  ) {
    return true;
  }
  if (effective.includes("?") && effective.length >= 16) {
    return true;
  }
  return false;
}

export function shouldForceObserveDispatchFromSuppression(args: {
  dispatchHint: boolean;
  routeReasonCode?: string | null;
  transcript: string;
}): boolean {
  if (args.dispatchHint) return false;
  const normalizedRoute = (args.routeReasonCode ?? "").trim().toLowerCase();
  const isLowSalienceSuppression =
    normalizedRoute === "suppressed:filler" ||
    normalizedRoute === "suppressed:low_salience" ||
    normalizedRoute === "suppressed:heuristic_low_salience";
  if (!isLowSalienceSuppression) return false;
  const transcript = args.transcript.trim();
  if (transcript.length < 20) return false;
  if (isLowInformationTailTranscript(transcript)) return false;
  if (transcript.split(/\s+/).filter(Boolean).length < 4) return false;
  return shouldDispatchReasoningAttempt(transcript);
}

export function isLikelyContextDependentTurn(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.length > 220) return false;
  if (
    /^(where|why|how|what)\s+(is|are|was|were|does|did)\s+(that|this|it|they|those|these)\b/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^(and|so|then|also)\b/.test(normalized)) return true;
  if (/\b(that|this|it|they|those|these)\b/.test(normalized) && normalized.length <= 72) {
    return true;
  }
  return false;
}

function extractPriorUserContext(recentTurns: string[], currentTranscript?: string): string | null {
  const currentNormalized = currentTranscript?.trim().toLowerCase() || null;
  for (let index = recentTurns.length - 1; index >= 0; index -= 1) {
    const line = recentTurns[index]?.trim() ?? "";
    if (!line) continue;
    if (!/^user:/i.test(line)) continue;
    const text = line.replace(/^user:\s*/i, "").trim();
    if (!text) continue;
    if (currentNormalized && text.toLowerCase() === currentNormalized) continue;
    return text;
  }
  return null;
}

function hasSufficientLexicalCarryover(nextTranscript: string, priorUserTurn: string): boolean {
  const nextTerms = new Set(extractIntentTerms(nextTranscript, 12));
  const priorTerms = new Set(extractIntentTerms(priorUserTurn, 14));
  if (nextTerms.size === 0 || priorTerms.size === 0) return false;
  let overlap = 0;
  for (const term of nextTerms) {
    if (!priorTerms.has(term)) continue;
    overlap += 1;
    if (overlap >= 2) return true;
  }
  return false;
}

export function isLikelyNearTurnContinuation(args: {
  transcript: string;
  priorUserTurn: string | null;
}): boolean {
  const normalized = args.transcript.trim().toLowerCase();
  const prior = args.priorUserTurn?.trim();
  if (!normalized || !prior) return false;
  if (
    /^(where|why|how|what)\s+(is|are|was|were|does|did)\s+(that|this|it|they|those|these)\b/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^(and|so|then|also|but|because|which|that|right|yeah|yes|well)\b/.test(normalized)) return true;
  if (/^(it|this|that|they|those|these)\b/.test(normalized)) return true;
  return hasSufficientLexicalCarryover(normalized, prior.toLowerCase());
}

export function buildVoiceReasoningDispatchPrompt(args: {
  transcript: string;
  recentTurns: string[];
  explorationPacket?: ConversationExplorationPacket | null;
}): string {
  const transcript = args.transcript.trim();
  if (!transcript) return "";
  if (!isLikelyContextDependentTurn(transcript)) {
    return transcript;
  }
  const priorUser = extractPriorUserContext(args.recentTurns, transcript);
  if (!isLikelyNearTurnContinuation({ transcript, priorUserTurn: priorUser })) {
    return transcript;
  }
  const topicHint = args.explorationPacket?.topic?.trim() || priorUser || transcript;
  return [
    `Follow-up turn: ${transcript}`,
    `Immediate anchor: ${clipText(topicHint, 220)}`,
    "Use only this immediate anchor for continuity before answering.",
    priorUser ? `Prior user turn: ${clipText(priorUser, 220)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeConversationModeForDispatch(
  mode: "observe" | "act" | "verify" | "clarify" | undefined,
): "observe" | "act" | "verify" | undefined {
  if (!mode || mode === "clarify") return undefined;
  return mode;
}

type ExplorationLadderAction =
  | "finalize"
  | "restart_after_artifact"
  | "clarify_after_attempt1"
  | "escalate_verify"
  | "escalate_act";

type ExplorationLadderDecision = {
  action: ExplorationLadderAction;
  reasonCode: string;
};

function inferExplorationTopicKey(packet: ConversationExplorationPacket | null | undefined, prompt: string): string {
  const raw = (packet?.topic?.trim() || prompt.trim() || "unknown").toLowerCase();
  const normalized = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return normalized || "unknown";
}

function buildExplorationEscalationPrompt(args: {
  mode: "verify" | "act";
  prompt: string;
  previousOutput: string;
  packet?: ConversationExplorationPacket | null;
}): string {
  const topic = clipText(args.packet?.topic?.trim() || args.prompt.trim(), 140);
  const previous = clipText(args.previousOutput.trim(), 700);
  if (args.mode === "verify") {
    return [
      `Topic: ${topic}`,
      "Run verify mode on this exploration thread.",
      "Return pass/fail with grounded evidence anchors and deterministic fail reason if blocked.",
      "",
      "Original user turn:",
      args.prompt.trim(),
      "",
      "Observe attempt output:",
      previous,
    ].join("\n");
  }
  return [
    `Topic: ${topic}`,
    "Run act mode on this exploration thread.",
    "Return concrete execution steps and expected receipts, bounded by existing safety gates.",
    "",
    "Original user turn:",
    args.prompt.trim(),
    "",
    "Observe attempt output:",
    previous,
  ].join("\n");
}

function buildExplorationArtifactRetryPrompt(args: {
  prompt: string;
  previousOutput: string;
  packet?: ConversationExplorationPacket | null;
}): string {
  const topic = clipText(args.packet?.topic?.trim() || args.prompt.trim(), 140);
  const previous = clipText(args.previousOutput.trim(), 700);
  return [
    `Topic: ${topic}`,
    "Restart observe mode from the top of the reasoning chain.",
    "Do not emit repository file lists, mission/ethos scaffolds, or artifact-only templates.",
    "If the output drifts into mission/ethos ideology content without explicit user request, ask one focused clarifier instead of finalizing.",
    "Return a plain, grounded explanation aligned to the user turn. If still blocked, ask one focused clarifier.",
    "",
    "Original user turn:",
    args.prompt.trim(),
    "",
    "Previous artifact-dominated output (avoid repeating this pattern):",
    previous,
  ].join("\n");
}

export function decideExplorationLadderAction(args: {
  explorationAttemptCount: number;
  outputText: string;
  rawOutputText?: string;
  promptText?: string;
  failReason?: string | null;
  mode?: "observe" | "act" | "verify";
  debug?:
    | {
        arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
        coverage_gate_reason?: string;
        evidence_gate_ok?: boolean;
        verification_anchor_required?: boolean;
      }
    | null
    | undefined;
}): ExplorationLadderDecision {
  const trimmedText = args.outputText.trim();
  const rawText = (args.rawOutputText ?? trimmedText).trim();
  const normalizedText = trimmedText.toLowerCase();
  const normalizedFail = (args.failReason ?? "").trim().toLowerCase();
  const normalizedCoverage = (args.debug?.coverage_gate_reason ?? "").trim().toLowerCase();
  const normalizedPrompt = (args.promptText ?? "").trim().toLowerCase();
  const firstAttempt = args.explorationAttemptCount <= 1;
  const ideologyDomainLeak = isLikelyIdeologyDomainLeak({
    promptText: args.promptText,
    outputText: rawText || trimmedText,
  });
  const artifactDominated =
    isArtifactDominatedReasoningText(trimmedText) ||
    (rawText !== trimmedText && isArtifactDominatedReasoningText(rawText)) ||
    ideologyDomainLeak;
  const explicitClarifierQuestion =
    /\?$/.test(trimmedText) &&
    /\b(could you|can you|would you|please clarify|which|what specific|what context|provide)\b/.test(
      normalizedText,
    );
  const substantiveAnswer =
    normalizedText.length >= 180 ||
    /[.!]\s+/.test(normalizedText) ||
    /\b(warp bubble|general relativity|metric|space-time|mechanism|because|therefore)\b/.test(normalizedText);
  const missingContextSignal =
    explicitClarifierQuestion ||
    /\b(please clarify|missing context|need more context|one more detail|specific problem|which context)\b/.test(
      normalizedText,
    ) ||
    /\bclarify\b/.test(normalizedFail) ||
    /\bmissing\b/.test(normalizedCoverage) ||
    (args.debug?.arbiter_mode === "clarify" && !substantiveAnswer);
  if (firstAttempt && missingContextSignal) {
    return { action: "clarify_after_attempt1", reasonCode: "suppressed:clarify_after_attempt1" };
  }

  // Restart observe lane from rung 1 for artifact output, bounded by retry cap.
  if (artifactDominated && args.mode !== "verify" && args.mode !== "act") {
    if (args.explorationAttemptCount < VOICE_ARTIFACT_RESTART_MAX_ATTEMPTS) {
      return { action: "restart_after_artifact", reasonCode: "dispatch:observe_restart_artifact_guard" };
    }
    return { action: "clarify_after_attempt1", reasonCode: "suppressed:clarify_after_artifact_retry_exhausted" };
  }

  const explicitVerifyIntent = /\b(verify|verification|prove|proof|validate|integrity|certificate|pass\/?fail|audit)\b/.test(
    normalizedPrompt,
  );
  const verifySignal =
    args.mode === "verify" ||
    args.debug?.verification_anchor_required === true ||
    explicitVerifyIntent;
  if (verifySignal) {
    return { action: "escalate_verify", reasonCode: "dispatch:verify" };
  }

  const explicitActIntent = /\b(implement|apply patch|edit files|run tool|execute|change code|update code|fix)\b/.test(
    normalizedPrompt,
  );
  const actSignal =
    args.mode === "act" ||
    explicitActIntent;
  if (actSignal) {
    return { action: "escalate_act", reasonCode: "dispatch:act" };
  }

  return { action: "finalize", reasonCode: "dispatch:observe_finalize" };
}

function buildConversationFallbackBrief(args: {
  transcript: string;
  mode?: "observe" | "act" | "verify" | "clarify";
  clarifyNeeded: boolean;
}): string {
  const snippet = clipText(args.transcript.trim().replace(/\?/g, "").replace(/\s+/g, " "), 180);
  if (args.clarifyNeeded || args.mode === "clarify") {
    return `I heard: "${snippet}". One concrete detail will help me route this precisely while I keep this conversational.`;
  }
  if (args.mode === "verify") {
    return `I heard: "${snippet}". I'll verify the claim path and report evidence-backed pass/fail.`;
  }
  if (args.mode === "act") {
    return `I heard: "${snippet}". I'll queue an action-oriented reasoning run and return the next concrete step.`;
  }
  if (args.mode === "observe") {
    return `I heard: "${snippet}". I'll inspect the current state and summarize what changed and what matters now.`;
  }
  return `I heard: "${snippet}". I will continue with one precise next step while preserving context continuity.`;
}

function sanitizeConversationBriefTextForVoice(value: string, maxChars = 560): string {
  const normalized = value
    .replace(/\?/g, ".")
    .replace(/\s+/g, " ")
    .replace(/\.\.+/g, ".")
    .trim();
  return clipText(normalized, maxChars);
}

function normalizeBriefComparableText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBriefEchoingTranscript(briefText: string, transcript: string): boolean {
  const brief = normalizeBriefComparableText(briefText);
  const source = normalizeBriefComparableText(transcript);
  if (!brief || !source) return false;
  if (brief === source) return true;
  if (brief.startsWith(source) && brief.length <= source.length + 24) return true;
  return false;
}

function buildPredictiveBriefFromTranscript(transcript: string): string {
  const latestFocus = extractLatestContinuationQuestionFocus(transcript);
  const focusSource = sanitizeConversationBriefTextForVoice(latestFocus ?? "", 220);
  const source = sanitizeConversationBriefTextForVoice(transcript, 220);
  const candidate = focusSource || source;
  if (!candidate) return "";
  const normalized = candidate.toLowerCase();
  const fullNormalized = source.toLowerCase();
  if (
    /\b(warp|quantum inequality|ford[-\s]?roman|energy conditions?)\b/.test(fullNormalized) &&
    /\b(uncertainty|bound|limit|inequality|constraint)\b/.test(fullNormalized)
  ) {
    return "I can map the quantum-inequality bounds to what the warp model can and cannot claim.";
  }
  if (/\b(casimir|objective reduction|penrose|wave function|gravitational curvature)\b/.test(fullNormalized)) {
    return "I can map the quantum claim to the physical mechanism and separate established results from speculative links.";
  }
  if (
    /\b(quantum statistical|statistical quantum)\b/.test(fullNormalized) &&
    /\bclassical\b/.test(fullNormalized)
  ) {
    return "Quantum statistical systems model ensemble behavior under quantum uncertainty, while classical systems model deterministic macroscopic dynamics.";
  }
  if (
    /\b(classical|quantum|wave function|collapse|superposition|measurement)\b/.test(fullNormalized)
  ) {
    return "I can relate the classical limit, quantum superposition, and measurement collapse in one clean chain.";
  }
  if (/\b(what is|define|explain)\b/.test(normalized) && /\bsystem\b/.test(normalized)) {
    return "A system is a set of interacting components organized to achieve a purpose.";
  }
  if (/[?]$/.test(candidate.trim()) || /\b(how|why|what|when|where|which|can you|could you)\b/.test(normalized)) {
    return "I will answer directly first, then contrast assumptions and limits.";
  }
  return "";
}

function buildDeterministicQueuedBriefFromTranscript(transcript: string): string {
  const latestFocus = extractLatestContinuationQuestionFocus(transcript);
  const focusSource = sanitizeConversationBriefTextForVoice(latestFocus ?? "", 220);
  const source = sanitizeConversationBriefTextForVoice(transcript, 220);
  const candidate = focusSource || source;
  if (!candidate) return "";
  const normalized = candidate.toLowerCase();
  const fullNormalized = source.toLowerCase();
  if (
    /\b(warp|quantum inequality|ford[-\s]?roman|energy conditions?)\b/.test(fullNormalized) &&
    /\b(uncertainty|bound|limit|inequality|constraint)\b/.test(fullNormalized)
  ) {
    return "I can map the quantum-inequality bounds to what the warp model can and cannot claim.";
  }
  if (/\b(quantum|classical|wave function|collapse|superposition)\b/.test(fullNormalized)) {
    return "I can answer this in steps and keep the mechanism and uncertainty explicit.";
  }
  if (/\b(warp|casimir|curvature|inequality)\b/.test(fullNormalized)) {
    return "I can map the mechanism, constraints, and uncertainty bounds before drawing conclusions.";
  }
  if (/\b(system|components?|interactions?|purpose)\b/.test(normalized)) {
    return "I can define the system first, then map components, interactions, and purpose.";
  }
  return "I can answer directly, then separate mechanism, constraints, and uncertainty.";
}

function laneLabelForConversationMode(mode?: "observe" | "act" | "verify" | "clarify"): string {
  if (mode === "verify") return "verification";
  if (mode === "act") return "action";
  if (mode === "observe") return "observe";
  if (mode === "clarify") return "clarify";
  return "reasoning";
}

function normalizeConversationRouteReasonCode(reasonCode?: string | null): string | null {
  const trimmed = reasonCode?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function normalizeVoiceFailureReasonText(reason?: string | null): string | null {
  const trimmed = reason?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase();
  const messageMap: Array<{ pattern: RegExp; text: string }> = [
    {
      pattern: /\bDESKTOP_JOINT_SCOPE_REQUIRED\b/,
      text: "desktop joint scope is required before this run can execute",
    },
    {
      pattern: /\bCALIBRATION_STATE_INCOMPLETE\b/,
      text: "calibration is incomplete for this run",
    },
    {
      pattern: /\bIMU_BASELINE_NOT_CONFIGURED\b/,
      text: "the IMU baseline is not configured for this run",
    },
    {
      pattern: /\bESTOP_NOT_READY\b/,
      text: "the emergency stop state is not ready for this run",
    },
    {
      pattern: /\bFORBIDDEN_CONTROL_PATH\b/,
      text: "the request targets restricted actuator-level controls",
    },
    {
      pattern: /\bEVIDENCE_CONTRACT_FIELD_MISSING\b/,
      text: "required evidence fields were missing",
    },
    {
      pattern: /\bTOOL_NOT_ALLOWED\b/,
      text: "the requested tool is not allowed in this lane",
    },
    {
      pattern: /\bGENERIC_COLLAPSE\b/,
      text: "the reasoning stack could not complete the run",
    },
    {
      pattern: /\bHELIX_ASK_FAILED_400\b/,
      text: "a request gate blocked this run",
    },
    {
      pattern: /\bHELIX_ASK_FAILED_403\b/,
      text: "access policy blocked this run",
    },
  ];
  for (const entry of messageMap) {
    if (entry.pattern.test(normalized)) {
      return entry.text;
    }
  }
  if (/\bABORT|CANCEL|INTERRUPT|SUPERSEDE\b/i.test(trimmed)) {
    return "the run was interrupted by a newer turn";
  }
  return null;
}

function isVoiceTurnSupersededReason(reason?: string | null): boolean {
  const trimmed = reason?.trim();
  if (!trimmed) return false;
  if (normalizeVoiceFailureReasonText(trimmed) === "the run was interrupted by a newer turn") {
    return true;
  }
  return /\bvoice_turn_(continuation_merged|response_stale|superseded_by_newer_attempt|superseded_by_newer_intent_revision)\b/i.test(
    trimmed,
  );
}

type AskLocalOptions = Parameters<typeof askLocal>[1];
type AskLocalMode = NonNullable<AskLocalOptions>["mode"];
type AskLocalResult = Awaited<ReturnType<typeof askLocal>>;

const AGIBOT_PREFLIGHT_SCOPE_ERROR_RE =
  /\bDESKTOP_JOINT_SCOPE_REQUIRED\b|desktop joint scope is required|mission interface blocked by bring-up preflight gate|preflight_gate/i;

export function isAgibotPreflightScopeError(error: unknown): boolean {
  if (!error) return false;
  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown }).message === "string"
          ? String((error as { message?: unknown }).message)
          : "";
  if (!rawMessage) return false;
  return AGIBOT_PREFLIGHT_SCOPE_ERROR_RE.test(rawMessage);
}

type AskLocalWithFallbackResult = {
  response: AskLocalResult;
  downgradedFromMode?: AskLocalMode;
};

export async function askLocalWithPreflightScopeFallback(
  prompt: string | undefined,
  options?: AskLocalOptions,
): Promise<AskLocalWithFallbackResult> {
  try {
    const response = await askLocal(prompt, options);
    return { response };
  } catch (error) {
    if (!options?.mode || !isAgibotPreflightScopeError(error)) {
      throw error;
    }
    const retryOptions: AskLocalOptions = { ...options };
    delete retryOptions.mode;
    delete retryOptions.allowTools;
    delete retryOptions.requiredEvidence;
    delete retryOptions.verify;
    const response = await askLocal(prompt, retryOptions);
    if (!response.mode) {
      response.mode = "read";
    }
    return {
      response,
      downgradedFromMode: options.mode,
    };
  }
}

export function formatVoiceDecisionSentence(args: {
  lifecycle: VoiceDecisionLifecycle;
  mode?: "observe" | "act" | "verify" | "clarify";
  routeReasonCode?: string | null;
  escalatedMode?: "verify" | "act";
  failureReasonRaw?: string | null;
}): string {
  const reasonCode = normalizeConversationRouteReasonCode(args.routeReasonCode);
  const normalizedFailureReason = normalizeVoiceFailureReasonText(args.failureReasonRaw ?? args.routeReasonCode);
  if (args.lifecycle === "queued") {
    if (reasonCode === "dispatch:verify") return "I am thinking through a verification pass in the background.";
    if (reasonCode === "dispatch:act") return "I am thinking through an action-oriented pass in the background.";
    if (reasonCode === "dispatch:observe_explore") return "I am thinking through this in the background.";
    if (reasonCode === "dispatch:observe") return "I am thinking through this in the background.";
    return "I am thinking through this in the background.";
  }
  if (args.lifecycle === "running") {
    return `Reasoning is running in ${laneLabelForConversationMode(args.mode)} mode.`;
  }
  if (args.lifecycle === "suppressed") {
    if (normalizedFailureReason === "the run was interrupted by a newer turn") {
      return "Switched to your newer request.";
    }
    if (reasonCode === "suppressed:filler") {
      return "Reasoning is suppressed for this filler turn.";
    }
    if (reasonCode === "suppressed:clarify_after_attempt1") {
      return "Reasoning is paused until you share one concrete detail.";
    }
    if (reasonCode === "suppressed:low_salience") {
      return "Reasoning is suppressed for now while we keep this conversational.";
    }
    if (normalizedFailureReason) {
      return `Reasoning is paused because ${normalizedFailureReason}.`;
    }
    return "Reasoning is suppressed for this turn.";
  }
  if (args.lifecycle === "escalated") {
    if (args.escalatedMode === "verify") return "Reasoning is escalated to verification mode.";
    if (args.escalatedMode === "act") return "Reasoning is escalated to action mode.";
    return "Reasoning is escalated to a deeper lane.";
  }
  if (args.lifecycle === "done") {
    if (args.mode === "act") return "Action reasoning is complete; see the receipt below.";
    return "Reasoning is complete; see the answer below.";
  }
  if (normalizedFailureReason === "the run was interrupted by a newer turn") {
    return "Switched to your newer request.";
  }
  if (normalizedFailureReason) {
    return `Reasoning failed for this turn because ${normalizedFailureReason}.`;
  }
  return "Reasoning failed for this turn; I can retry on your next prompt.";
}

export function shouldAutoSpeakVoiceDecisionLifecycle(
  lifecycle: VoiceDecisionLifecycle | undefined,
  options?: {
    routeReasonCode?: string | null;
    failReasonRaw?: string | null;
  },
): boolean {
  if (lifecycle === "queued") return true;
  if (lifecycle === "running") return true;
  if (lifecycle === "suppressed" || lifecycle === "failed") return false;
  return false;
}

export function isGenericQueuedVoiceAcknowledgement(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === "got it. i am thinking through this in the background." ||
    normalized === "got it. thinking in the background." ||
    normalized ===
      "got it. i will run a short observe reasoning pass in the background so we can keep talking while it loads."
  );
}

function isPinnedVoiceBriefCandidate(text: string): boolean {
  const normalized = sanitizeConversationBriefTextForVoice(text, 560);
  if (!normalized) return false;
  if (isGenericQueuedVoiceAcknowledgement(normalized)) return false;
  if (/^i heard:\s*"/i.test(normalized)) return false;
  return normalized.split(/\s+/).filter(Boolean).length >= 9;
}

export function shouldInterruptForSupersededReason(
  reason: VoicePlaybackCancelReason | null,
  hasActiveAudio: boolean,
): boolean {
  if (!reason) return false;
  if (reason === "preempted_by_final" && !hasActiveAudio) {
    return false;
  }
  return true;
}

export function isRetryableVoiceChunkSynthesisError(error: unknown): boolean {
  const err = error as {
    status?: unknown;
    name?: unknown;
    message?: unknown;
  } | null;
  const status = typeof err?.status === "number" && Number.isFinite(err.status) ? err.status : null;
  const name = typeof err?.name === "string" ? err.name.toLowerCase() : "";
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof err?.message === "string"
        ? err.message.toLowerCase()
        : String(error ?? "").toLowerCase();
  if (message.startsWith("voice_auto_speak_suppressed:")) return false;
  if (name === "aborterror" || /\babort(ed)?\b/.test(message)) return false;
  if (status !== null && (status === 408 || status === 425 || status === 429 || status >= 500)) {
    return true;
  }
  return /\b(failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|timed out|temporarily unavailable)\b/.test(
    message,
  );
}

function mapVoicePreemptPolicyToCancelReason(
  policy: Exclude<VoicePreemptPolicy, "none">,
): VoicePlaybackCancelReason {
  return policy === "pending_final" ? "preempted_by_final" : "superseded_same_turn";
}

export function composeVoiceBriefWithDecision(baseBrief: string, decisionSentence: string): string {
  const brief = baseBrief.trim();
  const decision = decisionSentence.trim();
  if (!brief) return clipText(decision, 640);
  if (!decision) return clipText(brief, 640);
  const separator = /[.!?]["')\]]?$/.test(brief) ? " " : ". ";
  return clipText(`${brief}${separator}${decision}`, 640);
}

function buildQueuedVoiceSpeechText(args: {
  entryText: string;
  decisionSentence: string;
  continuityMerged?: boolean;
}): string {
  if (args.continuityMerged) {
    return "Got it. I merged your latest phrase into the active reasoning run.";
  }
  const normalized = sanitizeConversationBriefTextForVoice(args.entryText, 560);
  const decision = sanitizeConversationBriefTextForVoice(args.decisionSentence, 220);
  const prefersThinkingDecision = /thinking through/i.test(decision);
  if (!normalized) {
    if (prefersThinkingDecision) {
      return "Got it. I am thinking through this in the background.";
    }
    return sanitizeConversationBriefTextForVoice(decision || "Got it. Thinking in the background.", 180);
  }
  const deEchoed = normalized.replace(/^I heard:\s*".*?"\.\s*/i, "").trim();
  const primary = (deEchoed || normalized)
    .split(/(?<=[.!])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)[0] ?? "";
  if (prefersThinkingDecision) {
    return "Got it. I am thinking through this in the background.";
  }
  const concise = sanitizeConversationBriefTextForVoice(primary, 180);
  if (!concise) {
    return sanitizeConversationBriefTextForVoice(decision || "Got it. Thinking in the background.", 180);
  }
  return clipText(concise, 180);
}

function buildSuppressedVoiceSpeechText(args: {
  entryText: string;
  decisionSentence: string;
  routeReasonCode?: string | null;
  failReasonRaw?: string | null;
}): string {
  const combinedReason = `${args.routeReasonCode ?? ""} ${args.failReasonRaw ?? ""}`.trim();
  if (isVoiceTurnSupersededReason(combinedReason)) {
    return sanitizeConversationBriefTextForVoice(args.decisionSentence || "Switched to your newer request.", 240);
  }
  const normalized = sanitizeConversationBriefTextForVoice(args.entryText, 560);
  if (!normalized) {
    return "";
  }
  const reasonCode = normalizeConversationRouteReasonCode(args.routeReasonCode);
  const sentenceBudget = reasonCode === "suppressed:filler" || reasonCode === "suppressed:low_salience" ? 2 : 1;
  const sentences = normalized
    .split(/(?<=[.!])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const selected = sentences.slice(0, sentenceBudget);
  const selectedLower = selected.map((entry) => entry.toLowerCase());
  const decision = sanitizeConversationBriefTextForVoice(args.decisionSentence, 220);
  if (decision && !selectedLower.includes(decision.toLowerCase())) {
    selected.push(decision);
  }
  return clipText(sanitizeConversationBriefTextForVoice(selected.join(" "), 360), 360);
}

function buildRunningVoiceSpeechText(args: {
  entryText: string;
  decisionSentence: string;
}): string {
  const normalized = sanitizeConversationBriefTextForVoice(args.entryText, 560);
  if (normalized) {
    const deEchoed = normalized.replace(/^I heard:\s*".*?"\.?\s*/i, "").trim();
    const subject = deEchoed || normalized;
    const sentences = subject
      .split(/(?<=[.!])\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const concise = sanitizeConversationBriefTextForVoice(sentences.slice(0, 2).join(" "), 320);
    if (concise) return clipText(concise, 320);
  }
  const decision = sanitizeConversationBriefTextForVoice(args.decisionSentence, 220);
  if (decision) return clipText(decision, 220);
  return "Reasoning is running in the background.";
}

export function buildVoiceInputStatusLabel(
  micArmState: MicArmState,
  state: MicRuntimeState,
  error: string | null,
): string | null {
  if (micArmState === "off") return null;
  if (state === "listening") return "Listening";
  if (state === "transcribing") return "Transcribing";
  if (state === "cooldown") return "Cooldown";
  if (state === "error") return error ?? "Voice input unavailable.";
  return null;
}

function describeVoiceInputError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (/STT HTTP 401/i.test(msg)) {
      return "OpenAI STT unauthorized (401). Check OPENAI_API_KEY on server :5050.";
    }
    if (/STT HTTP 403/i.test(msg)) {
      return "OpenAI STT forbidden (403). Check key permissions and organization/project access.";
    }
    if (/STT HTTP 429/i.test(msg)) {
      return "OpenAI STT rate-limited (429). Retry shortly or adjust limits.";
    }
    if (/HULL|not allowed|ENOTFOUND|EAI_AGAIN|ECONN|network|fetch/i.test(msg)) {
      return "STT network/allowlist failure. Verify outbound host allowlist includes api.openai.com.";
    }
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microphone permission denied.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone available.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "Microphone is busy.";
    }
    if (msg) {
      return msg;
    }
  }
  return "Voice input unavailable.";
}

type HelixAskReply = {
  id: string;
  content: string;
  contextCapsule?: ContextCapsuleSummary;
  mode?: "read" | "observe" | "act" | "verify";
  proof?: {
    verdict?: "PASS" | "FAIL";
    firstFail?: unknown;
    certificate?: { certificateHash?: string | null; integrityOk?: boolean | null } | null;
    artifacts?: Array<{ kind: string; ref: string; label?: string }>;
  };
  question?: string;
  sources?: string[];
  promptIngested?: boolean;
  envelope?: HelixAskResponseEnvelope;
  liveEvents?: AskLiveEventEntry[];
  convergenceSnapshot?: ConvergenceStripState;
  debug?: {
    two_pass?: boolean;
    micro_pass?: boolean;
    micro_pass_auto?: boolean;
    micro_pass_reason?: string;
    scaffold?: string;
    evidence_cards?: string;
    query_hints?: string[];
    queries?: string[];
    context_files?: string[];
    prompt_ingested?: boolean;
    prompt_ingest_source?: string;
    prompt_ingest_reason?: string;
    prompt_chunk_count?: number;
    prompt_selected?: number;
    prompt_context_files?: string[];
    prompt_context_points?: string[];
    prompt_used_sections?: string[];
    intent_id?: string;
    intent_domain?: string;
    intent_tier?: string;
    intent_secondary_tier?: string;
    intent_strategy?: string;
    intent_reason?: string;
    client_inferred_mode?: "observe" | "act" | "verify";
    claim_tier?: "exploratory" | "diagnostic" | "reduced_order" | "reduced-order" | "certified";
    provenance_class?: "measured" | "proxy" | "inferred" | "simulation";
    certifying?: boolean;
    fail_reason?: string;
    helix_ask_fail_reason?: string | null;
    arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
    arbiter_reason?: string;
    arbiter_strictness?: "low" | "med" | "high";
    arbiter_user_expects_repo?: boolean;
    arbiter_repo_ok?: boolean;
    arbiter_hybrid_ok?: boolean;
    arbiter_ratio?: number;
    arbiter_topic_ok?: boolean;
    arbiter_concept_match?: boolean;
    verification_anchor_required?: boolean;
    verification_anchor_ok?: boolean;
    math_solver_ok?: boolean;
    math_solver_kind?: string;
    math_solver_final?: string;
    math_solver_reason?: string;
    math_solver_maturity?: string;
    evidence_gate_ok?: boolean;
    evidence_match_ratio?: number;
    evidence_match_count?: number;
    evidence_token_count?: number;
    evidence_claim_count?: number;
    evidence_claim_supported?: number;
    evidence_claim_unsupported?: number;
    evidence_claim_ratio?: number;
    evidence_claim_gate_ok?: boolean;
    evidence_claim_missing?: string[];
    evidence_critic_applied?: boolean;
    evidence_critic_ok?: boolean;
    evidence_critic_ratio?: number;
    evidence_critic_count?: number;
    evidence_critic_tokens?: number;
    ambiguity_terms?: string[];
    ambiguity_gate_applied?: boolean;
    overflow_retry_applied?: boolean;
    overflow_retry_steps?: string[];
    overflow_retry_labels?: string[];
    overflow_retry_attempts?: number;
    physics_lint_applied?: boolean;
    physics_lint_reasons?: string[];
    coverage_token_count?: number;
    coverage_key_count?: number;
    coverage_missing_key_count?: number;
    coverage_ratio?: number;
    coverage_missing_keys?: string[];
    coverage_gate_applied?: boolean;
    coverage_gate_reason?: string;
    belief_claim_count?: number;
    belief_supported_count?: number;
    belief_unsupported_count?: number;
    belief_unsupported_rate?: number;
    belief_contradictions?: number;
    belief_gate_applied?: boolean;
    belief_gate_reason?: string;
    belief_graph_node_count?: number;
    belief_graph_edge_count?: number;
    belief_graph_claim_count?: number;
    belief_graph_definition_count?: number;
    belief_graph_conclusion_count?: number;
    belief_graph_evidence_ref_count?: number;
    belief_graph_constraint_count?: number;
    belief_graph_supports?: number;
    belief_graph_contradicts?: number;
    belief_graph_depends_on?: number;
    belief_graph_maps_to?: number;
    belief_graph_claim_ids?: string[];
    belief_graph_unsupported_claim_ids?: string[];
    belief_graph_contradiction_ids?: string[];
    rattling_score?: number;
    rattling_base_distance?: number;
    rattling_perturbation_distance?: number;
    rattling_claim_set_count?: number;
    rattling_gate_applied?: boolean;
    variant_selection_applied?: boolean;
    variant_selection_reason?: string;
    variant_selection_label?: string;
    variant_selection_candidate_count?: number;
    capsule_dialogue_applied_count?: number;
    capsule_evidence_applied_count?: number;
    capsule_retry_applied?: boolean;
    capsule_retry_triggered?: boolean;
    capsule_retry_reason?: string;
    capsule_latest_topic_shift?: boolean;
    capsule_must_keep_terms?: string[];
    capsule_preferred_paths?: string[];
    focus_guard_result?: "pass" | "retry" | "clarify";
    anchor_guard_result?: "pass" | "retry" | "clarify";
    gates?: {
      evidence?: {
        ok?: boolean;
        matchCount?: number;
        tokenCount?: number;
        matchRatio?: number;
        criticApplied?: boolean;
        criticOk?: boolean;
        criticRatio?: number;
        criticCount?: number;
        criticTokens?: number;
      };
      coverage?: {
        applied?: boolean;
        reason?: string;
        ratio?: number;
        tokenCount?: number;
        keyCount?: number;
        missingKeyCount?: number;
        missingKeys?: string[];
      };
      belief?: {
        applied?: boolean;
        reason?: string;
        unsupportedRate?: number;
        unsupportedCount?: number;
        supportedCount?: number;
        claimCount?: number;
        contradictions?: number;
      };
      beliefGraph?: {
        nodeCount?: number;
        edgeCount?: number;
        claimCount?: number;
        definitionCount?: number;
        conclusionCount?: number;
        evidenceRefCount?: number;
        constraintCount?: number;
        supports?: number;
        contradicts?: number;
        dependsOn?: number;
        mapsTo?: number;
      };
      rattling?: {
        applied?: boolean;
        score?: number;
        baseDistance?: number;
        perturbationDistance?: number;
        claimSetCount?: number;
      };
      lint?: {
        conceptApplied?: boolean;
        conceptReasons?: string[];
        physicsApplied?: boolean;
        physicsReasons?: string[];
      };
      variant?: {
        applied?: boolean;
        reason?: string;
        label?: string;
        candidateCount?: number;
      };
      ambiguity?: {
        resolverApplied?: boolean;
        resolverReason?: string;
        resolverTokenCount?: number;
        resolverShortPrompt?: boolean;
        resolverTopScore?: number;
        resolverMargin?: number;
        resolverCandidates?: string[];
        gateApplied?: boolean;
        terms?: string[];
      };
    };
    graph_congruence_diagnostics?: {
      treeCount?: number;
      allowedEdges?: number;
      blockedEdges?: number;
      resolvedInTreeEdges?: number;
      resolvedCrossTreeEdges?: number;
      blockedByReason?: Record<string, number>;
      blockedByCondition?: Record<string, number>;
        strictSignals?: {
          B_equals_1?: boolean;
          qi_metric_derived_equals_true?: boolean;
          qi_strict_ok_equals_true?: boolean;
          theta_geom_equals_true?: boolean;
          vdb_two_wall_derivative_support_equals_true?: boolean;
          ts_metric_derived_equals_true?: boolean;
        };
      };
    citation_repair?: boolean;
    live_events?: Array<{
      ts: string;
      tool: string;
      stage: string;
      detail?: string;
      ok?: boolean;
      durationMs?: number;
      text?: string;
      meta?: Record<string, unknown>;
    }>;
    format?: "steps" | "compare" | "brief";
    stage_tags?: boolean;
    verbosity?: "brief" | "normal" | "extended";
  };
};

type AskLiveEventEntry = {
  id: string;
  text: string;
  tool?: string;
  ts?: string | number;
  tsMs?: number;
  seq?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

type ContextCapsulePreview = {
  id: string;
  loading: boolean;
  error?: string;
  summary?: ContextCapsuleSummary;
  convergence?: ContextCapsuleConvergence;
};

export type ContextCapsuleLedgerEntry = {
  id: string;
  summary: ContextCapsuleSummary;
  pinned: boolean;
  pinnedAtMs: number | null;
  touchedAtMs: number;
};

export type SessionCapsuleConfidenceBand = "reinforcing" | "building" | "uncertain";

export type SessionCapsuleState = {
  id: string;
  summary: ContextCapsuleSummary;
  confidenceBand: SessionCapsuleConfidenceBand;
};

type HelixAskPillProps = {
  contextId: string;
  className?: string;
  maxWidthClassName?: string;
  onOpenPanel?: (panelId: PanelDefinition["id"]) => void;
  onOpenConversation?: (sessionId: string) => void;
  placeholder?: string;
};

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clipText(value: string | undefined, limit: number): string {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
}

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

function normalizeCitations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function clipForDisplay(value: string, limit: number, expanded: boolean): string {
  if (expanded || value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
}

function hasLongText(value: unknown, limit: number): boolean {
  return coerceText(value).length > limit;
}

function safeJsonStringify(value: unknown, fallback = "Unable to render debug payload."): string {
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") return val.toString();
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      2,
    );
  } catch {
    return fallback;
  }
}

function convergenceSourceTone(source: ConvergenceStripState["source"]): string {
  if (source === "atlas_exact") return "border-cyan-300/45 bg-cyan-400/12 text-cyan-100";
  if (source === "repo_exact") return "border-sky-300/45 bg-sky-400/12 text-sky-100";
  if (source === "open_world") return "border-rose-300/45 bg-rose-400/12 text-rose-100";
  return "border-slate-300/25 bg-slate-400/10 text-slate-200";
}

function convergenceProofTone(proof: ConvergenceStripState["proof"]): string {
  if (proof === "confirmed") return "border-emerald-300/45 bg-emerald-400/12 text-emerald-100";
  if (proof === "reasoned") return "border-teal-300/45 bg-teal-400/12 text-teal-100";
  if (proof === "hypothesis") return "border-amber-300/45 bg-amber-400/12 text-amber-100";
  if (proof === "fail_closed") return "border-rose-300/55 bg-rose-500/16 text-rose-100";
  return "border-slate-300/25 bg-slate-400/10 text-slate-200";
}

function convergenceMaturityTone(maturity: ConvergenceStripState["maturity"]): string {
  if (maturity === "certified") return "border-emerald-300/45 bg-emerald-400/12 text-emerald-100";
  if (maturity === "diagnostic") return "border-cyan-300/45 bg-cyan-400/12 text-cyan-100";
  if (maturity === "reduced_order") return "border-violet-300/45 bg-violet-400/12 text-violet-100";
  return "border-amber-300/45 bg-amber-400/12 text-amber-100";
}

function buildConvergenceDebugSnapshot(
  debug: HelixAskReply["debug"] | undefined,
): ConvergenceDebug | undefined {
  if (!debug) return undefined;
  return {
    intent_domain: debug.intent_domain,
    intent_id: debug.intent_id,
    arbiter_mode: debug.arbiter_mode,
    claim_tier: typeof debug.claim_tier === "string" ? debug.claim_tier : undefined,
    math_solver_maturity: debug.math_solver_maturity,
    helix_ask_fail_reason:
      typeof debug.helix_ask_fail_reason === "string" ? debug.helix_ask_fail_reason : undefined,
  };
}

function hasConvergenceStateChanged(
  previous: ConvergenceStripState | null,
  next: ConvergenceStripState,
): boolean {
  if (!previous) return true;
  return (
    previous.source !== next.source ||
    previous.proof !== next.proof ||
    previous.maturity !== next.maturity ||
    previous.phase !== next.phase ||
    previous.openWorldActive !== next.openWorldActive ||
    previous.caption !== next.caption ||
    previous.deltaPct !== next.deltaPct
  );
}

type HelixAskErrorBoundaryState = { hasError: boolean; error?: Error };

class HelixAskErrorBoundary extends Component<{ children: ReactNode }, HelixAskErrorBoundaryState> {
  state: HelixAskErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): HelixAskErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[helix-ask] render error:", error, info);
    reportClientError(error, { componentStack: info.componentStack, scope: "helix-ask" });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    if (typeof window === "undefined") return;
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const message = this.state.error?.message || "Unexpected Helix Ask error.";
    return (
      <div className="pointer-events-auto rounded-2xl border border-amber-200/30 bg-amber-500/10 p-4 text-xs text-amber-100">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200">Helix Ask paused</p>
        <p className="mt-2">
          The Helix Ask panel hit a rendering error. You can retry or reload the page.
        </p>
        <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/40 p-2 text-[10px] text-amber-100/80">
          {message}
        </pre>
        <div className="mt-2 flex gap-2">
          <button
            className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-200/20"
            onClick={this.handleRetry}
            type="button"
          >
            Retry
          </button>
          <button
            className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-200/20"
            onClick={this.handleReload}
            type="button"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

function ensureFinalMarker(value: string): string {
  if (!value.trim()) return "ANSWER_START\nANSWER_END";
  if (value.includes("ANSWER_START") || value.includes("FINAL:")) {
    return value;
  }
  return `${value.trimEnd()}\n\nANSWER_START\nANSWER_END`;
}

const HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE = /^\s*ANSWER_(?:START|END)\b\s*/i;
const HELIX_ASK_ANSWER_MARKER_SPLIT_RE = /\b(?:ANSWER_START|ANSWER_END)\b/gi;

const stripAnswerBoundaryPrefix = (value: string): string => {
  let cursor = value.trimStart();
  while (true) {
    const stripped = cursor.replace(HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE, "");
    if (stripped === cursor) break;
    cursor = stripped.trimStart();
  }
  return cursor;
};

function formatEnvelopeSectionsForCopy(
  sections: HelixAskResponseEnvelope["sections"],
  hideTitle?: string,
): string {
  if (!sections || sections.length === 0) return "";
  const hidden = hideTitle?.toLowerCase();
  return sections
    .map((section) => {
      const lines: string[] = [];
      const title = coerceText(section.title);
      if (title && title.toLowerCase() !== hidden) {
        lines.push(title);
      }
      const body = coerceText(section.body);
      if (body) {
        lines.push(body);
      }
      const citations = normalizeCitations(section.citations);
      if (citations.length > 0) {
        lines.push(`Sources: ${citations.join(", ")}`);
      }
      return lines.filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

const HELIX_ASK_CONTEXT_FILES = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_FILES, 18),
  4,
  48,
);
const HELIX_ASK_CONTEXT_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_CHARS, 2200),
  120,
  2400,
);
const HELIX_ASK_MAX_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_TOKENS, 2048),
  64,
  8192,
);
const HELIX_ASK_CONTEXT_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_TOKENS, 2048),
  512,
  8192,
);
const HELIX_ASK_MAX_RENDER_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_RENDER_CHARS, 6000),
  1200,
  24000,
);
const HELIX_ASK_MAX_PROMPT_LINES = 4;
const HELIX_ASK_LIVE_EVENT_LIMIT = 28;
const HELIX_ASK_QUEUE_LIMIT = 12;
const HELIX_ASK_LIVE_EVENT_MAX_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_LIVE_EVENT_MAX_CHARS, 560),
  160,
  2400,
);
const HELIX_MOOD_HINT_MIN_INTERVAL_MS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_MIN_INTERVAL_MS, 1200),
  600,
  12_000,
);
const HELIX_MOOD_HINT_CONFIDENCE = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_CONFIDENCE, 0.58),
  0.2,
  1,
);
const HELIX_MOOD_HINT_MAX_TEXT_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_MAX_TEXT_CHARS, 720),
  160,
  2400,
);
type LumaMoodPalette = {
  ring: string;
  aura: string;
  surfaceBorder: string;
  surfaceTint: string;
  surfaceHalo: string;
  liveBorder: string;
  replyBorder: string;
  replyTint: string;
};

const LUMA_MOOD_PALETTE: Record<LumaMood, LumaMoodPalette> = {
  mad: {
    ring: "ring-rose-400/60",
    aura:
      "border-rose-300/45 bg-rose-500/[0.08] shadow-[0_0_40px_rgba(244,63,94,0.45)]",
    surfaceBorder: "border-rose-300/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(244,63,94,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(244,63,94,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-rose-300/25",
    replyBorder: "border-rose-300/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(244,63,94,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  upset: {
    ring: "ring-amber-300/55",
    aura:
      "border-amber-200/45 bg-amber-400/[0.08] shadow-[0_0_40px_rgba(251,191,36,0.42)]",
    surfaceBorder: "border-amber-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(251,191,36,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(251,191,36,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-amber-200/25",
    replyBorder: "border-amber-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(251,191,36,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  shock: {
    ring: "ring-yellow-300/60",
    aura:
      "border-yellow-200/50 bg-yellow-300/[0.09] shadow-[0_0_42px_rgba(253,224,71,0.45)]",
    surfaceBorder: "border-yellow-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(253,224,71,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(253,224,71,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-yellow-200/25",
    replyBorder: "border-yellow-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(253,224,71,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
  },
  question: {
    ring: "ring-sky-300/55",
    aura:
      "border-sky-300/40 bg-sky-400/[0.07] shadow-[0_0_40px_rgba(125,211,252,0.45)]",
    surfaceBorder: "border-sky-300/30",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(125,211,252,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(125,211,252,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-sky-300/25",
    replyBorder: "border-sky-300/28",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(125,211,252,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
  },
  happy: {
    ring: "ring-emerald-300/60",
    aura:
      "border-emerald-200/45 bg-emerald-400/[0.08] shadow-[0_0_40px_rgba(110,231,183,0.42)]",
    surfaceBorder: "border-emerald-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(110,231,183,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(110,231,183,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-emerald-200/25",
    replyBorder: "border-emerald-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(110,231,183,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  friend: {
    ring: "ring-teal-300/60",
    aura:
      "border-teal-200/45 bg-teal-400/[0.08] shadow-[0_0_40px_rgba(94,234,212,0.44)]",
    surfaceBorder: "border-teal-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(94,234,212,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(94,234,212,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-teal-200/25",
    replyBorder: "border-teal-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(94,234,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  love: {
    ring: "ring-pink-300/60",
    aura:
      "border-pink-200/45 bg-pink-400/[0.08] shadow-[0_0_42px_rgba(249,168,212,0.45)]",
    surfaceBorder: "border-pink-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(249,168,212,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(249,168,212,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-pink-200/25",
    replyBorder: "border-pink-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(249,168,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
};

type ReasoningTheaterStance = "winning" | "contested" | "losing" | "fail_closed";
type ReasoningTheaterArchetype =
  | "ambiguity"
  | "missing_evidence"
  | "coverage_gap"
  | "contradiction"
  | "overload";
type ReasoningTheaterSuppressionReason =
  | "context_ineligible"
  | "dedupe_cooldown"
  | "mission_rate_limited"
  | "voice_rate_limited"
  | "voice_budget_exceeded"
  | "voice_backend_error"
  | "missing_evidence"
  | "contract_violation"
  | "agi_overload_admission_control";
type ReasoningTheaterPhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";
type ReasoningTheaterCertaintyClass =
  | "confirmed"
  | "reasoned"
  | "hypothesis"
  | "unknown";
type ReasoningTheaterMedal =
  | "scout"
  | "anchor"
  | "lattice"
  | "prism"
  | "fracture"
  | "stitch"
  | "relay"
  | "gate"
  | "seal"
  | "lantern"
  | "valve"
  | "crown";

type ReasoningTheaterState = {
  stance: ReasoningTheaterStance;
  archetype: ReasoningTheaterArchetype;
  phase: ReasoningTheaterPhase;
  certaintyClass: ReasoningTheaterCertaintyClass;
  suppressionReason: ReasoningTheaterSuppressionReason | null;
  momentum: number;
  ambiguityPressure: number;
  battleIndex: number;
  pulseHz: number;
  fogOpacity: number;
  particleCount: number;
  passHits: number;
  evidenceHits: number;
  stageTransitions: number;
  allText: string;
  symbolicLine: string;
  seed: number;
};

type ReasoningTheaterMedalEvent = {
  medal: ReasoningTheaterMedal;
  reason: string;
};

type ReasoningTheaterMedalPulse = ReasoningTheaterMedalEvent & {
  token: string;
  startedAt: number;
  assetPath: string;
  fading: boolean;
};

type ReasoningTheaterClockSource = "local" | "event_ts" | "event_seq";

type ReasoningTheaterParticle = {
  id: string;
  leftPct: number;
  topPct: number;
  sizePx: number;
  opacity: number;
  delayS: number;
  durationS: number;
};

type ReasoningTheaterFrontierParticleNode = {
  id: string;
  phaseOffsetMs: number;
  baseRadiusPx: number;
};

const REASONING_THEATER_STANCE_META: Record<
  ReasoningTheaterStance,
  { badge: string; bar: string; label: string }
> = {
  winning: {
    badge: "text-emerald-200",
    bar: "bg-emerald-300/80",
    label: "Winning",
  },
  contested: {
    badge: "text-sky-200",
    bar: "bg-sky-300/80",
    label: "Contested",
  },
  losing: {
    badge: "text-amber-200",
    bar: "bg-amber-300/80",
    label: "Losing",
  },
  fail_closed: {
    badge: "text-rose-200",
    bar: "bg-rose-300/80",
    label: "Fail-closed",
  },
};

const REASONING_THEATER_ARCHETYPE_LABEL: Record<ReasoningTheaterArchetype, string> = {
  ambiguity: "ambiguity",
  missing_evidence: "missing evidence",
  coverage_gap: "coverage gap",
  contradiction: "contradiction",
  overload: "overload",
};

const REASONING_THEATER_PHASE_LABEL: Record<ReasoningTheaterPhase, string> = {
  observe: "observe",
  plan: "plan",
  retrieve: "retrieve",
  gate: "gate",
  synthesize: "synthesize",
  verify: "verify",
  execute: "execute",
  debrief: "debrief",
};

const REASONING_THEATER_CERTAINTY_LABEL: Record<ReasoningTheaterCertaintyClass, string> = {
  confirmed: "confirmed",
  reasoned: "reasoned",
  hypothesis: "hypothesis",
  unknown: "unknown",
};

const REASONING_THEATER_SUPPRESSION_LABEL: Record<ReasoningTheaterSuppressionReason, string> = {
  context_ineligible: "context ineligible",
  dedupe_cooldown: "dedupe cooldown",
  mission_rate_limited: "mission rate limited",
  voice_rate_limited: "voice rate limited",
  voice_budget_exceeded: "voice budget exceeded",
  voice_backend_error: "voice backend error",
  missing_evidence: "missing evidence",
  contract_violation: "contract violation",
  agi_overload_admission_control: "agi overload admission control",
};

const REASONING_THEATER_MEDAL_LABEL: Record<ReasoningTheaterMedal, string> = {
  scout: "Scout",
  anchor: "Anchor",
  lattice: "Lattice",
  prism: "Prism",
  fracture: "Fracture",
  stitch: "Stitch",
  relay: "Relay",
  gate: "Gate",
  seal: "Seal",
  lantern: "Lantern",
  valve: "Valve",
  crown: "Crown",
};

const REASONING_THEATER_MEDAL_ASSET: Record<ReasoningTheaterMedal, string> = {
  scout: "/reasoning-theater/medals/scout.svg",
  anchor: "/reasoning-theater/medals/anchor.svg",
  lattice: "/reasoning-theater/medals/lattice.svg",
  prism: "/reasoning-theater/medals/prism.svg",
  fracture: "/reasoning-theater/medals/fracture.svg",
  stitch: "/reasoning-theater/medals/stitch.svg",
  relay: "/reasoning-theater/medals/relay.svg",
  gate: "/reasoning-theater/medals/gate.svg",
  seal: "/reasoning-theater/medals/seal.svg",
  lantern: "/reasoning-theater/medals/lantern.svg",
  valve: "/reasoning-theater/medals/valve.svg",
  crown: "/reasoning-theater/medals/crown.svg",
};

const REASONING_THEATER_MEDAL_VISIBLE_MS = 4200;
const REASONING_THEATER_MEDAL_FADE_MS = 900;
const REASONING_THEATER_MEDAL_MAX_VISIBLE = 6;
const REASONING_THEATER_CLOCK_FPS = 60;
const REASONING_THEATER_CLOCK_STEP_MS = 1000 / REASONING_THEATER_CLOCK_FPS;
const REASONING_THEATER_METER_GAIN_ALPHA = 0.16;
const REASONING_THEATER_METER_LOSS_ALPHA = 0.24;
const REASONING_THEATER_METER_EPSILON = 0.05;
const REASONING_THEATER_CLOCK_SOURCE_LABEL: Record<ReasoningTheaterClockSource, string> = {
  local: "local",
  event_ts: "event-ts",
  event_seq: "event-seq",
};
const REASONING_THEATER_FRONTIER_ACTION_LABEL: Record<ReasoningTheaterFrontierAction, string> = {
  large_gain: "Large gain",
  small_gain: "Small gain",
  steady: "Steady",
  small_loss: "Small loss",
  large_loss: "Large loss",
  hard_drop: "Hard drop",
};
const CONVERGENCE_SOURCE_LABEL: Record<ConvergenceStripState["source"], string> = {
  atlas_exact: "atlas exact",
  repo_exact: "repo exact",
  open_world: "open-world",
  unknown: "unknown",
};
const CONVERGENCE_PROOF_LABEL: Record<ConvergenceStripState["proof"], string> = {
  confirmed: "confirmed",
  reasoned: "reasoned",
  hypothesis: "hypothesis",
  unknown: "unknown",
  fail_closed: "fail-closed",
};
const CONVERGENCE_MATURITY_LABEL: Record<ConvergenceStripState["maturity"], string> = {
  exploratory: "exploratory",
  reduced_order: "reduced-order",
  diagnostic: "diagnostic",
  certified: "certified",
};
const CONVERGENCE_PHASE_ORDER = getConvergencePhaseOrder();
const CONVERGENCE_PHASE_LABEL: Record<ConvergenceStripState["phase"], string> = {
  observe: "observe",
  plan: "plan",
  retrieve: "retrieve",
  gate: "gate",
  synthesize: "synthesize",
  verify: "verify",
  execute: "execute",
  debrief: "debrief",
};
const CONVERGENCE_COLLAPSE_LABEL: Record<ConvergenceCollapseEvent, string> = {
  arbiter_commit: "arbiter commit",
  proof_commit: "proof commit",
};
const REASONING_THEATER_FRONTIER_CURSOR_PULSE_MS = 420;
const REASONING_THEATER_FRONTIER_PARTICLE_COUNT = 8;
const REASONING_THEATER_FRONTIER_ACTIONS_ENABLED = (() => {
  const raw = (import.meta as any)?.env?.VITE_HELIX_THEATER_FRONTIER_ACTIONS;
  return raw === undefined ? true : String(raw) !== "0";
})();
const CONTEXT_CAPSULE_GRID_WIDTH = 80;
const CONTEXT_CAPSULE_GRID_HEIGHT = 16;
const CONTEXT_CAPSULE_SIM_TICK_MS = 50;

const REASONING_THEATER_SUPPRESSION_PATTERNS: Array<{
  reason: ReasoningTheaterSuppressionReason;
  pattern: RegExp;
}> = [
  { reason: "context_ineligible", pattern: /context[_\s-]?ineligible|voice_context_ineligible/i },
  { reason: "dedupe_cooldown", pattern: /dedupe[_\s-]?cooldown/i },
  { reason: "mission_rate_limited", pattern: /mission[_\s-]?rate[_\s-]?limited/i },
  { reason: "voice_rate_limited", pattern: /voice[_\s-]?rate[_\s-]?limited/i },
  { reason: "voice_budget_exceeded", pattern: /voice[_\s-]?budget[_\s-]?exceeded/i },
  { reason: "voice_backend_error", pattern: /voice[_\s-]?backend[_\s-]?error/i },
  { reason: "missing_evidence", pattern: /missing[_\s-]?evidence/i },
  { reason: "contract_violation", pattern: /contract[_\s-]?violation/i },
  { reason: "agi_overload_admission_control", pattern: /agi[_\s-]?overload[_\s-]?admission[_\s-]?control/i },
];

function clamp01(value: number): number {
  return clampNumber(value, 0, 1);
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function stripContextCapsuleTokensFromText(value: string): string {
  const ids = extractContextCapsuleIdsFromText(value);
  if (ids.length === 0) return value.trim();
  let next = value;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

function resolveContextCapsulePalette(state: ConvergenceStripState): {
  r: number;
  g: number;
  b: number;
} {
  if (state.proof === "fail_closed") return { r: 239, g: 68, b: 68 };
  if (state.source === "open_world") return { r: 244, g: 114, b: 182 };
  if (state.source === "atlas_exact") return { r: 34, g: 211, b: 238 };
  if (state.source === "repo_exact") return { r: 56, g: 189, b: 248 };
  return { r: 148, g: 163, b: 184 };
}

function buildContextCapsuleCopyText(summary: ContextCapsuleSummary): string {
  const proofTag = summary.commit.proof_verdict ?? "UNKNOWN";
  const sourceTag = summary.convergence.source;
  const stampLines = renderContextCapsuleStampLines({
    bits: summary.stamp.finalBits,
    width: summary.stamp.gridW,
    height: summary.stamp.gridH,
    targetWidth: 10,
    targetHeight: 3,
  });
  return [
    ...stampLines,
    `proof:${proofTag}  src:${sourceTag}`,
  ].join("\n");
}

function buildContextCapsuleStampDataUri(
  stamp: ContextCapsuleSummary["stamp"],
  options?: { onColor?: string; offColor?: string },
): string {
  const width = Math.max(1, Math.floor(stamp.gridW));
  const height = Math.max(1, Math.floor(stamp.gridH));
  const bits = typeof stamp.finalBits === "string" ? stamp.finalBits : "";
  const total = width * height;
  const onColor = options?.onColor ?? "#D4F4FF";
  const offColor = options?.offColor ?? "#071525";
  const rects: string[] = [];
  for (let i = 0; i < total; i += 1) {
    if (bits[i] !== "1") continue;
    const x = i % width;
    const y = Math.floor(i / width);
    rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${onColor}" />`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><rect width="${width}" height="${height}" fill="${offColor}" />${rects.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveReasoningTheaterSuppressionReason(
  text: string,
): ReasoningTheaterSuppressionReason | null {
  for (const entry of REASONING_THEATER_SUPPRESSION_PATTERNS) {
    if (entry.pattern.test(text)) return entry.reason;
  }
  return null;
}

function resolveReasoningTheaterPhase(
  allText: string,
  events: AskLiveEventEntry[],
): ReasoningTheaterPhase {
  const toolText = events
    .map((event) => event.tool ?? "")
    .join(" ")
    .toLowerCase();
  if (/\b(debrief|wrap[-\s]?up|final summary|final answer)\b/i.test(allText) || /\bdebrief\b/.test(toolText)) {
    return "debrief";
  }
  if (/\b(execute|run tool|action required|apply now)\b/i.test(allText) || /\bexecute\b/.test(toolText)) {
    return "execute";
  }
  if (/\b(verify|verification|proof|certificate|integrity)\b/i.test(allText) || /\bverify\b/.test(toolText)) {
    return "verify";
  }
  if (/\b(gate|gating|threshold)\b/i.test(allText) || /\bgate\b/.test(toolText)) {
    return "gate";
  }
  if (/\b(synthes|compose|assemble|combine answer)\w*/i.test(allText) || /\bsynthes/i.test(toolText)) {
    return "synthesize";
  }
  if (/\b(retrieve|search|lookup|resonance|context files?)\b/i.test(allText) || /\bretrieve|search/.test(toolText)) {
    return "retrieve";
  }
  if (/\b(plan|intent|router|strategy)\b/i.test(allText) || /\bplan|intent/.test(toolText)) {
    return "plan";
  }
  return "observe";
}

function resolveReasoningTheaterCertaintyClass(input: {
  allText: string;
  suppressionReason: ReasoningTheaterSuppressionReason | null;
  passHits: number;
  failHits: number;
  evidenceHits: number;
  ambiguityHits: number;
}): ReasoningTheaterCertaintyClass {
  if (input.suppressionReason === "missing_evidence" || input.suppressionReason === "contract_violation") {
    return "unknown";
  }
  if (/\b(confirmed|finalized|verdict:\s*pass|integrity:\s*ok|certificate:\s*[a-f0-9]{8,})\b/i.test(input.allText)) {
    return "confirmed";
  }
  if (/\b(hypothes|maybe|possible|candidate|speculat)\w*/i.test(input.allText)) {
    return "hypothesis";
  }
  if (input.evidenceHits > 0 || input.passHits > input.failHits) {
    return "reasoned";
  }
  if (input.ambiguityHits > 0 || input.failHits > 0) {
    return "unknown";
  }
  return "reasoned";
}

function resolveReasoningTheaterMedal(input: {
  current: ReasoningTheaterState;
  previous: ReasoningTheaterState | null;
}): ReasoningTheaterMedalEvent | null {
  const { current, previous } = input;
  if (!previous) {
    if (current.phase === "retrieve") {
      return { medal: "scout", reason: "Retrieval/search engaged." };
    }
    if (current.phase === "observe" && (current.certaintyClass === "unknown" || current.certaintyClass === "hypothesis")) {
      return { medal: "lantern", reason: "Uncertainty surfaced explicitly." };
    }
    return null;
  }

  if (
    (previous.suppressionReason !== current.suppressionReason && current.suppressionReason) ||
    (previous.stance !== "fail_closed" && current.stance === "fail_closed")
  ) {
    return { medal: "seal", reason: "Constraint block/fail-closed activated." };
  }
  if (previous.archetype !== "contradiction" && current.archetype === "contradiction") {
    return { medal: "fracture", reason: "Contradiction surfaced." };
  }
  if (previous.archetype === "contradiction" && current.archetype !== "contradiction") {
    return { medal: "stitch", reason: "Contradiction reconciled." };
  }
  if (previous.archetype !== "overload" && current.archetype === "overload") {
    return { medal: "valve", reason: "Pressure handling/rate control engaged." };
  }
  if (previous.phase !== current.phase && current.phase === "retrieve") {
    return { medal: "scout", reason: "Moved into retrieval phase." };
  }
  if (
    current.evidenceHits >= previous.evidenceHits + 2 ||
    (previous.archetype === "missing_evidence" && current.archetype !== "missing_evidence")
  ) {
    return { medal: "anchor", reason: "Grounding/evidence improved." };
  }
  if (previous.archetype === "coverage_gap" && current.archetype !== "coverage_gap") {
    return { medal: "lattice", reason: "Coverage gap reduced." };
  }
  if (current.ambiguityPressure + 0.12 < previous.ambiguityPressure && current.archetype === "ambiguity") {
    return { medal: "prism", reason: "Ambiguity resolving into distinction." };
  }
  if (previous.phase !== current.phase && (current.phase === "gate" || current.phase === "verify")) {
    return { medal: "gate", reason: "Verification threshold encountered." };
  }
  if (current.passHits > previous.passHits && (current.phase === "gate" || current.phase === "verify")) {
    return { medal: "gate", reason: "Gate/verification progress recorded." };
  }
  if (previous.phase !== current.phase && (current.phase === "synthesize" || current.phase === "execute")) {
    return { medal: "relay", reason: "Reasoning relayed into next stage." };
  }
  if (
    (previous.certaintyClass !== "confirmed" &&
      current.certaintyClass === "confirmed" &&
      current.stance === "winning") ||
    (previous.phase !== "debrief" &&
      current.phase === "debrief" &&
      current.certaintyClass === "confirmed")
  ) {
    return { medal: "crown", reason: "Verified conclusion reached." };
  }
  if (
    previous.phase !== "observe" &&
    current.phase === "observe" &&
    (current.certaintyClass === "unknown" || current.certaintyClass === "hypothesis")
  ) {
    return { medal: "lantern", reason: "Observation uncertainty surfaced." };
  }
  return null;
}

function deriveReasoningTheaterState(input: {
  askBusy: boolean;
  askStatus: string | null;
  askLiveDraft: string;
  askElapsedMs: number | null;
  askLiveEvents: AskLiveEventEntry[];
  askLiveTraceId: string | null;
}): ReasoningTheaterState | null {
  if (!input.askBusy) return null;
  const allText = [
    input.askStatus ?? "",
    input.askLiveDraft,
    ...input.askLiveEvents.map((event) => event.text ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  const suppressionReason = resolveReasoningTheaterSuppressionReason(allText);
  const passHits = (allText.match(/\b(pass|passed|resolved|verified|complete(?:d)?|ok)\b/g) ?? []).length;
  const failHits = (allText.match(/\b(fail|failed|error|blocked|timeout|fallback|clarify)\b/g) ?? []).length;
  const ambiguityHits = (allText.match(/\b(ambigu|unclear|unknown|unsure|question)\w*/g) ?? []).length;
  const gapHits = (allText.match(/\b(gap|missing|coverage|unresolved)\w*/g) ?? []).length;
  const contradictionHits = (allText.match(/\b(contradict|conflict|inconsisten)\w*/g) ?? []).length;
  const overloadHits = (allText.match(/\b(overload|rate[_\s-]?limit|cooldown|queue|admission)\w*/g) ?? []).length;
  const evidenceHits = (allText.match(/\b(evidence|citation|anchor)\w*/g) ?? []).length;
  const progressHits = (allText.match(/\b(retrieve|synthes|verify|analysis|gate|progress|scaffold)\w*/g) ?? []).length;

  let stageTransitions = 0;
  for (let i = 1; i < input.askLiveEvents.length; i += 1) {
    const currentTool = input.askLiveEvents[i]?.tool ?? "";
    const previousTool = input.askLiveEvents[i - 1]?.tool ?? "";
    if (currentTool && currentTool !== previousTool) {
      stageTransitions += 1;
    }
  }

  const latencyPenalty = clamp01(((input.askElapsedMs ?? 0) - 10_000) / 30_000);
  const suppressionPenalty = suppressionReason ? 1 : 0;
  const momentum = clamp01(
    0.2 +
      passHits * 0.11 +
      Math.min(0.22, (progressHits + stageTransitions) * 0.025) +
      Math.min(0.08, evidenceHits * 0.02) -
      failHits * 0.06 -
      latencyPenalty * 0.14,
  );
  const ambiguityPressure = clamp01(
    0.17 +
      ambiguityHits * 0.08 +
      gapHits * 0.05 +
      contradictionHits * 0.07 +
      failHits * 0.045 +
      overloadHits * 0.06 +
      suppressionPenalty * 0.18 +
      latencyPenalty * 0.2,
  );
  const battleIndex = clampNumber(momentum - ambiguityPressure, -1, 1);

  const failClosed =
    suppressionReason === "missing_evidence" ||
    suppressionReason === "contract_violation" ||
    /\b(verdict:\s*fail|integrity:\s*failed|firstfail|fail[-\s]?closed|hard constraint)\b/i.test(allText);

  const stance: ReasoningTheaterStance = failClosed
    ? "fail_closed"
    : battleIndex >= 0.25
      ? "winning"
      : battleIndex <= -0.25
        ? "losing"
        : "contested";

  const archetype: ReasoningTheaterArchetype =
    overloadHits > 0 ||
    suppressionReason === "agi_overload_admission_control" ||
    suppressionReason === "mission_rate_limited" ||
    suppressionReason === "dedupe_cooldown"
      ? "overload"
      : suppressionReason === "missing_evidence" || /\b(missing evidence|evidence gate|citation)\b/i.test(allText)
        ? "missing_evidence"
        : gapHits > 0
          ? "coverage_gap"
          : contradictionHits > 0
            ? "contradiction"
            : "ambiguity";

  const symbolicLine =
    stance === "fail_closed"
      ? "Seal engaged: deterministic fail reason surfaced."
      : stance === "winning"
        ? "Momentum is clearing the fog around the objective."
        : stance === "losing"
          ? "Ambiguity pressure is pushing back; tighten evidence."
          : "Battle is contested; keep resolving the highest-signal gaps.";

  const pulseHz = 0.8 + 1.4 * clamp01(Math.abs(battleIndex));
  const fogOpacity = clamp01(0.12 + 0.75 * ambiguityPressure);
  const particleCount = clampNumber(Math.round(6 + momentum * 16), 4, 24);
  const phase = resolveReasoningTheaterPhase(allText, input.askLiveEvents);
  const certaintyClass = resolveReasoningTheaterCertaintyClass({
    allText,
    suppressionReason,
    passHits,
    failHits,
    evidenceHits,
    ambiguityHits,
  });
  const seed = hash32(
    `${input.askLiveTraceId ?? "no-trace"}:${input.askLiveEvents.length}:${archetype}:${stance}:${phase}:${certaintyClass}`,
  );

  return {
    stance,
    archetype,
    phase,
    certaintyClass,
    suppressionReason,
    momentum,
    ambiguityPressure,
    battleIndex,
    pulseHz,
    fogOpacity,
    particleCount,
    passHits,
    evidenceHits,
    stageTransitions,
    allText,
    symbolicLine,
    seed,
  };
}

function buildReasoningTheaterParticles(
  seed: number,
  count: number,
): ReasoningTheaterParticle[] {
  const rng = mulberry32(seed);
  const particles: ReasoningTheaterParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      id: `particle-${i}`,
      leftPct: Math.round(rng() * 1000) / 10,
      topPct: Math.round(rng() * 1000) / 10,
      sizePx: 1.8 + rng() * 3.6,
      opacity: 0.15 + rng() * 0.55,
      delayS: rng() * 1.2,
      durationS: 1.2 + rng() * 1.8,
    });
  }
  return particles;
}

function buildReasoningTheaterFrontierParticles(
  seed: number,
  count: number,
): ReasoningTheaterFrontierParticleNode[] {
  const rng = mulberry32(seed ^ 0xa5a5a5a5);
  const nodes: ReasoningTheaterFrontierParticleNode[] = [];
  for (let i = 0; i < count; i += 1) {
    nodes.push({
      id: `frontier-particle-${i}`,
      phaseOffsetMs: Math.round(rng() * 1200),
      baseRadiusPx: 2 + rng() * 2.4,
    });
  }
  return nodes;
}

const HELIX_ASK_OUTPUT_TOKENS = clampNumber(
  readNumber(
    (import.meta as any)?.env?.VITE_HELIX_ASK_OUTPUT_TOKENS,
    Math.min(
      HELIX_ASK_MAX_TOKENS,
      Math.max(64, Math.floor(HELIX_ASK_CONTEXT_TOKENS * 0.5)),
    ),
  ),
  64,
  HELIX_ASK_MAX_TOKENS,
);
const HELIX_ASK_PATH_REGEX =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:tsx|ts|jsx|js|md|json|cjs|mjs|py|yml|yaml)/g;
const HELIX_ASK_CORE_FOCUS = /(helix ask|helix|ask system|ask pipeline|ask mode)/i;
const HELIX_ASK_CORE_PATH_BOOST =
  /(docs\/helix-ask-flow\.md|client\/src\/components\/helix\/HelixAskPill\.tsx|client\/src\/pages\/desktop\.tsx|server\/routes\/agi\.plan\.ts|server\/skills\/llm\.local|asklocal)/i;
const HELIX_ASK_CORE_NOISE =
  /(docs\/SMOKE\.md|docs\/V0\.1-SIGNOFF\.md|docs\/ESSENCE-CONSOLE|docs\/TRACE-API\.md|HullMetricsVisPanel|shared\/schema\.ts|server\/db\/)/i;
const HELIX_ASK_METHOD_TRIGGER = /(scientific method|methodology|method\b)/i;
const HELIX_ASK_STEP_TRIGGER =
  /(how to|how does|how do|steps?|step-by-step|procedure|process|workflow|pipeline|implement|implementation|configure|setup|set up|troubleshoot|debug|fix|resolve)/i;
const HELIX_ASK_COMPARE_TRIGGER =
  /(compare|versus|vs\.?|difference|better|worse|more accurate|accuracy|tradeoffs|advantages|what is|what's|why is|why are|how is|how are)/i;
const HELIX_ASK_REPO_HINT =
  /(helix|helix ask|ask system|ask pipeline|ask mode|this system|this repo|repository|repo\b|code|codebase|file|path|component|module|endpoint|api|server|client|ui|panel|pipeline|trace|essence|casimir|warp|alcubierre|resonance|code lattice|lattice|smoke test|smoke\.md|bug|error|crash|config|env|settings|docs\/)/i;
const HELIX_ASK_FILE_HINT =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|mjs|cjs|py|rs|go|java|kt|swift|cpp|c|h)/i;

type HelixAskFormat = "steps" | "compare" | "brief";

function decideHelixAskFormat(question?: string): { format: HelixAskFormat; stageTags: boolean } {
  const normalized = question?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return { format: "brief", stageTags: false };
  }
  if (HELIX_ASK_METHOD_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: true };
  }
  if (HELIX_ASK_STEP_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: false };
  }
  if (
    HELIX_ASK_COMPARE_TRIGGER.test(normalized) ||
    normalized.startsWith("why ") ||
    normalized.startsWith("what is") ||
    normalized.startsWith("what's")
  ) {
    return { format: "compare", stageTags: false };
  }
  return { format: "brief", stageTags: false };
}

function isHelixAskRepoQuestion(question: string): boolean {
  const trimmed = question.trim();
  if (!trimmed) return true;
  if (HELIX_ASK_FILE_HINT.test(trimmed)) return true;
  return HELIX_ASK_REPO_HINT.test(trimmed);
}

function stripStageTags(value: string): string {
  if (!value) return value;
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\s*\((observe|hypothesis|experiment|analysis|explain)\)\s*$/i, "").trimEnd())
    .join("\n")
    .trim();
}
const HELIX_ASK_WARP_FOCUS = /(warp|bubble|alcubierre|natario)/i;
const HELIX_ASK_WARP_PATH_BOOST =
  /(modules\/warp|client\/src\/lib\/warp-|warp-module|natario-warp|warp-theta|energy-pipeline)/i;

const HELIX_PANEL_ALIASES: Array<{ id: PanelDefinition["id"]; aliases: string[] }> = [
  { id: "helix-noise-gens", aliases: ["noise gens", "noise generators", "noise generator"] },
  { id: "alcubierre-viewer", aliases: ["warp bubble", "warp viewer", "alcubierre", "warp visualizer"] },
  { id: "live-energy", aliases: ["live energy", "energy pipeline", "pipeline"] },
  { id: "live-energy", aliases: ["helix core", "core"] },
  { id: "docs-viewer", aliases: ["docs", "documentation", "papers"] },
  { id: "resonance-orchestra", aliases: ["resonance", "resonance orchestra"] },
  { id: "agi-essence-console", aliases: ["essence console", "helix console", "conversation panel"] },
];

const HELIX_FILE_PANEL_HINTS: Array<{ pattern: RegExp; panelId: PanelDefinition["id"] }> = [
  { pattern: /(modules\/warp|client\/src\/components\/warp|client\/src\/lib\/warp-|warp-bubble)/i, panelId: "alcubierre-viewer" },
  { pattern: /(energy-pipeline|warp-pipeline-adapter|pipeline)/i, panelId: "live-energy" },
  { pattern: /(helix-core\.ts|server\/helix-core|\/helix\/pipeline)/i, panelId: "live-energy" },
  { pattern: /(code-lattice|resonance)/i, panelId: "resonance-orchestra" },
  { pattern: /(agi\.plan|training-trace|essence|trace)/i, panelId: "agi-essence-console" },
  { pattern: /(docs\/|\.md$)/i, panelId: "docs-viewer" },
];

const HELIX_ATOMIC_LAUNCH_EVENT = "helix:atomic-launch";
const HELIX_ATOMIC_LAUNCH_STORAGE_KEY = "helix.atomic.launch.v1";

function normalizePanelQuery(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function resolvePanelIdFromText(value: string): PanelDefinition["id"] | null {
  const normalized = normalizePanelQuery(value);
  if (!normalized) return null;
  for (const entry of HELIX_PANEL_ALIASES) {
    if (!getPanelDef(entry.id)) continue;
    if (entry.aliases.some((alias) => normalized.includes(alias))) {
      return entry.id;
    }
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  let bestId: PanelDefinition["id"] | null = null;
  let bestScore = 0;
  for (const panel of panelRegistry) {
    if (!getPanelDef(panel.id)) continue;
    const haystack = `${panel.title} ${panel.id} ${(panel.keywords ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = panel.id;
    }
  }
  return bestScore > 0 ? bestId : null;
}

function resolvePanelIdFromPath(value: string): PanelDefinition["id"] | null {
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  for (const hint of HELIX_FILE_PANEL_HINTS) {
    if (hint.pattern.test(normalized) && getPanelDef(hint.panelId)) {
      return hint.panelId;
    }
  }
  return resolvePanelIdFromText(normalized);
}

function parseOpenPanelCommand(value: string): PanelDefinition["id"] | null {
  const match = value.trim().match(/^(?:\/open|open|show|launch)\s+(.+)/i);
  if (!match) return null;
  const raw = match[1].replace(/^(the|panel|window)\s+/i, "").trim();
  return resolvePanelIdFromText(raw);
}

function buildHelixAskSearchQueries(question: string): string[] {
  const base = question.trim();
  if (!base) return [];
  const normalized = base.toLowerCase();
  const queries = [base];
  const seen = new Set([base.toLowerCase()]);
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(trimmed);
  };

  if (/(scientific method|ask|assistant|llm|prompt|context|plan|execute|trace|code lattice|resonance)/i.test(normalized)) {
    push("/api/agi/ask");
    push("docs/helix-ask-flow.md");
    push("helix ask");
    push("helix ask flow");
    push("helix ask pipeline");
    push("buildGroundedAskPrompt");
    push("buildGroundedPrompt");
    push("askLocal");
    push("server/routes/agi.plan.ts");
    push("client/src/pages/desktop.tsx");
    push("client/src/components/helix/HelixAskPill.tsx");
    push("client/src/lib/agi/api.ts");
    push("server/skills/llm.local.spawn.ts");
  }
  if (normalized.includes("warp") || normalized.includes("alcubierre") || normalized.includes("bubble")) {
    push("warp bubble");
    push("modules/warp/warp-module.ts");
    push("calculateNatarioWarpBubble");
    push("warp pipeline");
    push("energy-pipeline warp");
  }
  if (normalized.includes("solve") || normalized.includes("solver")) {
    push("warp solver");
    push("constraint gate");
    push("gr evaluation");
  }

  return queries.slice(0, 6);
}

function buildGroundedPrompt(question: string, context: string): string {
  const formatSpec = decideHelixAskFormat(question);
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
    "Use only the evidence in the context below. Cite file paths when referencing code.",
    "If the context is insufficient, say what is missing and ask a concise follow-up.",
    "When the context includes solver or calculation functions, summarize the inputs, outputs, and flow before UI details.",
  ];
  if (formatSpec.format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 6-9 steps and no preamble.");
    lines.push("Each step should be 2-3 sentences and grounded in repo details; cite file paths when relevant.");
    if (formatSpec.stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (2-3 sentences).");
  } else if (formatSpec.format === "compare") {
    lines.push("Answer in 2-3 short paragraphs; do not use numbered steps.");
    lines.push("If the question is comparative, include a short bullet list (3-5 items) of concrete differences grounded in repo details.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (2-3 sentences).");
  } else {
    lines.push("Answer in 2-3 short paragraphs; do not use numbered steps unless explicitly requested.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (2-3 sentences).");
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push("Do not include the words \"Question:\" or \"Context sources\".");
  lines.push("Keep paragraphs short (2-3 sentences) and separate sections with blank lines.");
  lines.push("Do not repeat the question or include headings like Question, Context, or Resonance patch.");
  lines.push("Do not output tool logs, certificates, command transcripts, or repeat the prompt/context.");
  lines.push('Respond with only the answer and prefix it with "FINAL:".');
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Context:");
  lines.push(context || "No repo context was attached to this request.");
  lines.push("");
  lines.push("FINAL:");
  return lines.join("\n");
}

function buildGeneralPrompt(question: string): string {
  const formatSpec = decideHelixAskFormat(question);
  const lines = [
    "You are Helix Ask.",
    "Answer using general knowledge; do not cite file paths or repo details.",
  ];
  if (formatSpec.format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences.");
    if (formatSpec.stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else if (formatSpec.format === "compare") {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps.");
    lines.push("If the question is comparative, include a short bullet list (2-4 items) of concrete differences.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  }
  lines.push("Avoid repetition; do not repeat the question.");
  lines.push('Respond with only the answer and prefix it with "FINAL:".');
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("FINAL:");
  return lines.join("\n");
}

function normalizeQuestionMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const QUESTION_PREFIX = /^question\s*:\s*/i;

function stripInlineQuestionLine(line: string, question?: string): string | null {
  if (!QUESTION_PREFIX.test(line)) return null;
  let rest = line.replace(QUESTION_PREFIX, "").trimStart();
  if (QUESTION_PREFIX.test(rest)) {
    rest = rest.replace(QUESTION_PREFIX, "").trimStart();
  }
  const questionTrimmed = question?.trim();
  if (questionTrimmed) {
    const questionLower = questionTrimmed.toLowerCase();
    if (rest.toLowerCase().startsWith(questionLower)) {
      rest = rest
        .slice(questionTrimmed.length)
        .replace(/^[\s:;,.!?-]+/, "")
        .trimStart();
    }
  }
  if (!rest) return "";
  const markIndex = rest.indexOf("?");
  if (markIndex >= 0 && markIndex < 240) {
    const after = rest.slice(markIndex + 1).replace(/^[\s:;,.!?-]+/, "").trimStart();
    if (after) return after;
  }
  return rest;
}

function stripQuestionPrefixText(value: string, question?: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  if (!lines.length) return value;
  const stripped = stripInlineQuestionLine(lines[0] ?? "", question);
  if (stripped === null) return value;
  if (stripped) {
    lines[0] = stripped;
  } else {
    lines.shift();
  }
  return lines.join("\n").trim();
}

function cleanPromptLine(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const stripped = trimmed
    .replace(/^[\"'`.\-,;]+/g, "")
    .replace(/[\"'`.\-,;]+$/g, "")
    .trim();
  return stripped;
}

function stripLeadingQuestion(response: string, question?: string): string {
  const lines = response.split(/\r?\n/);
  const target = question?.trim();
  const targetNormalized = target ? normalizeQuestionMatch(target) : "";
  let startIndex = 0;
  while (startIndex < lines.length) {
    const inline = stripInlineQuestionLine(lines[startIndex] ?? "", question);
    if (inline !== null) {
      if (inline) {
        lines[startIndex] = inline;
        break;
      }
      startIndex += 1;
      continue;
    }
    const cleaned = cleanPromptLine(lines[startIndex]);
    if (!cleaned) {
      startIndex += 1;
      continue;
    }
    if (/^(question|context|resonance patch)\s*:/i.test(cleaned)) {
      startIndex += 1;
      continue;
    }
    if (target) {
      const lowerLine = cleaned.toLowerCase();
      if (lowerLine === target.toLowerCase()) {
        startIndex += 1;
        continue;
      }
      const normalizedLine = normalizeQuestionMatch(cleaned);
      if (normalizedLine && normalizedLine === targetNormalized) {
        startIndex += 1;
        continue;
      }
    }
    break;
  }
  return lines.slice(startIndex).join("\n").trim();
}

function stripPromptEcho(response: string, question?: string): string {
  let trimmed = stripQuestionPrefixText(response.trim(), question);
  trimmed = stripLeadingQuestion(trimmed, question);
  trimmed = stripEvidencePromptBlock(trimmed);
  trimmed = stripAnswerBoundaryPrefix(trimmed);
  const answerBlock = extractAnswerBlock(trimmed);
  if (answerBlock) {
    return answerBlock;
  }
  if (!trimmed) return trimmed;
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const index = trimmed.lastIndexOf(marker);
    if (index >= 0) {
      const after = trimmed.slice(index + marker.length).trim();
      if (after) return after;
    }
  }
  const isScaffoldLine = (line: string) => {
    const cleaned = line
      .trim()
      .replace(/^[>"'`*#\-\d\.\)\s]+/, "")
      .trim();
    if (!cleaned) return true;
    const lowered = cleaned.toLowerCase();
    return (
      lowered.startsWith("you are helix ask") ||
      lowered.startsWith("use only the evidence") ||
      lowered.startsWith("use only the evidence steps") ||
      lowered.startsWith("use only the evidence bullets") ||
      lowered.startsWith("use general knowledge") ||
      lowered.startsWith("use only the reasoning") ||
      lowered.startsWith("revise the answer") ||
      lowered.startsWith("do not add new claims") ||
      lowered.startsWith("preserve the format") ||
      lowered.startsWith("keep the paragraph format") ||
      lowered.startsWith("keep the numbered step list") ||
      lowered.startsWith("use only file paths") ||
      lowered.startsWith("evidence:") ||
      lowered.startsWith("answer:") ||
      lowered.startsWith("if the context is insufficient") ||
      lowered.startsWith("if the question mentions") ||
      lowered.startsWith("when the context includes") ||
      lowered.startsWith("if the question is comparative") ||
      lowered.startsWith("answer in") ||
      lowered.startsWith("do not use numbered steps") ||
      lowered.startsWith("start directly with") ||
      lowered.startsWith("each step should") ||
      lowered.startsWith("after the steps") ||
      lowered.startsWith("avoid repetition") ||
      lowered.startsWith("preserve any stage tags") ||
      lowered.startsWith("do not include stage tags") ||
      lowered.startsWith("do not include the words") ||
      lowered.startsWith("do not output tool logs") ||
      lowered.startsWith("do not repeat the question") ||
      lowered.startsWith("end with a short paragraph") ||
      lowered.startsWith("respond with only the answer between") ||
      /^answer_(?:start|end)\b/i.test(cleaned) ||
      lowered.startsWith("no preamble") ||
      lowered.startsWith("no headings") ||
      lowered.startsWith("ask debug") ||
      lowered.startsWith("two-pass:") ||
      lowered.startsWith("format:") ||
      lowered.startsWith("stage tags:") ||
      lowered.startsWith("question:") ||
      lowered.includes("question:") ||
      lowered.startsWith("context:") ||
      lowered.startsWith("prompt context") ||
      lowered.startsWith("context sources") ||
      lowered.startsWith("resonance patch:") ||
      lowered.startsWith("knowledge projects:") ||
      lowered.startsWith("evidence steps:") ||
      lowered.startsWith("evidence bullets:") ||
      lowered.startsWith("reasoning steps:") ||
      lowered.startsWith("reasoning bullets:") ||
      lowered.startsWith("final:")
    );
  };
  const cleanedLines = trimmed
    .split(/\r?\n/)
    .filter((line) => !isScaffoldLine(line))
    .map((line) => stripAnswerBoundaryPrefix(line));
  const cleaned = cleanedLines.join("\n").trim();
  const formatSpec = decideHelixAskFormat(question);
  if (cleaned) {
    return formatSpec.stageTags ? cleaned : stripStageTags(cleaned);
  }
  return formatSpec.stageTags
    ? trimmed
    : stripStageTags(stripAnswerBoundaryPrefix(trimmed));
}

function extractAnswerBlock(value: string): string {
  if (!value) return "";
  const splitSegments = value
    .split(HELIX_ASK_ANSWER_MARKER_SPLIT_RE)
    .map((segment) => stripAnswerBoundaryPrefix(segment).trim())
    .filter(Boolean);
  if (splitSegments.length > 0) {
    const longest = splitSegments.reduce((best, candidate) =>
      best.length >= candidate.length ? best : candidate,
    "");
    if (longest) return longest;
  }
  const startIndex = value.lastIndexOf("ANSWER_START");
  if (startIndex >= 0) {
    const afterStart = value.slice(startIndex + "ANSWER_START".length);
    const endIndex = afterStart.lastIndexOf("ANSWER_END");
    const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    const trimmed = stripAnswerBoundaryPrefix(slice).trim();
    if (trimmed) return trimmed;
  }
  const boundaryTrimmed = stripAnswerBoundaryPrefix(value);
  if (boundaryTrimmed) {
    return boundaryTrimmed;
  }
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const index = value.lastIndexOf(marker);
    if (index >= 0) {
      const after = value.slice(index + marker.length).trim();
      if (after) return after;
    }
  }
  return "";
}

function stripEvidencePromptBlock(value: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  const cleaned = lines.map((line) => cleanPromptLine(line));
  const evidenceIndex = cleaned.findIndex((line) => /^evidence\s*:/i.test(line));
  if (evidenceIndex < 0) return value;
  const answerIndex = cleaned.findIndex((line, index) => index > evidenceIndex && /^answer\s*:/i.test(line));
  if (answerIndex < 0) return value;
  const pruned = [...lines.slice(0, evidenceIndex), ...lines.slice(answerIndex + 1)];
  return pruned.join("\n").trim();
}

function parseSearchScore(preview: string | undefined): number {
  if (!preview) return 0;
  const match = preview.match(/score=([0-9.]+)/i);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildContextFromBundles(bundles: KnowledgeProjectExport[], question: string): string {
  const files = bundles.flatMap((bundle) => bundle.files ?? []);
  const helixAskFocus = HELIX_ASK_CORE_FOCUS.test(question);
  const scored = files
    .map((file) => {
      const label = file.path || file.name || "";
      const preview = file.preview ?? "";
      let score = parseSearchScore(preview);
      if (helixAskFocus) {
        if (HELIX_ASK_CORE_PATH_BOOST.test(label)) {
          score += 10;
        }
        if (HELIX_ASK_CORE_NOISE.test(label)) {
          score -= 6;
        }
      }
      if (HELIX_ASK_WARP_FOCUS.test(question) && HELIX_ASK_WARP_PATH_BOOST.test(label)) {
        score += 8;
      }
      return { file, label, preview, score };
    })
    .filter((entry) => entry.label && entry.preview && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const entry of scored) {
    if (seen.has(entry.label)) continue;
    const preview = clipText(entry.preview, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    lines.push(`${entry.label}\n${preview}`);
    seen.add(entry.label);
    if (lines.length >= HELIX_ASK_CONTEXT_FILES) {
      return lines.join("\n\n");
    }
  }
  return lines.join("\n\n");
}

export function HelixAskPill({
  contextId,
  className,
  maxWidthClassName,
  onOpenPanel,
  onOpenConversation,
  placeholder,
}: HelixAskPillProps) {
  const { userSettings } = useHelixStartSettings();
  const { ensureContextSession, addMessage, setActive } = useAgiChatStore();
  const helixAskSessionRef = useRef<string | null>(null);
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
  const [askReplies, setAskReplies] = useState<HelixAskReply[]>([]);
  const [askExtensionOpenByReply, setAskExtensionOpenByReply] = useState<Record<string, boolean>>(
    {},
  );
  const [askLiveEvents, setAskLiveEvents] = useState<AskLiveEventEntry[]>([]);
  const askLiveEventsRef = useRef<AskLiveEventEntry[]>([]);
  const [askLiveSessionId, setAskLiveSessionId] = useState<string | null>(null);
  const [askLiveTraceId, setAskLiveTraceId] = useState<string | null>(null);
  const [askElapsedMs, setAskElapsedMs] = useState<number | null>(null);
  const [askLiveDraft, setAskLiveDraft] = useState<string>("");
  const askLiveDraftRef = useRef("");
  const askLiveDraftBufferRef = useRef("");
  const askLiveDraftFlushRef = useRef<number | null>(null);
  const [askQueue, setAskQueue] = useState<string[]>([]);
  const [contextCapsulePreview, setContextCapsulePreview] = useState<ContextCapsulePreview | null>(null);
  const [contextCapsuleDetectedId, setContextCapsuleDetectedId] = useState<string | null>(null);
  const [contextCapsuleSessionLedger, setContextCapsuleSessionLedger] = useState<ContextCapsuleLedgerEntry[]>([]);
  const contextCapsuleSessionLedgerRef = useRef<ContextCapsuleLedgerEntry[]>([]);
  const contextCapsuleLookupSeqRef = useRef(0);
  const [askActiveQuestion, setAskActiveQuestion] = useState<string | null>(null);
  const [askMood, setAskMood] = useState<LumaMood>("question");
  const [askMoodBroken, setAskMoodBroken] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.onLine === false;
  });
  const resumeAttemptedRef = useRef(false);
  const askStartRef = useRef<number | null>(null);
  const lastAskStatusRef = useRef<string | null>(null);
  const askDraftRef = useRef("");
  const askMoodTimerRef = useRef<number | null>(null);
  const moodHintAbortRef = useRef<AbortController | null>(null);
  const moodHintSeqRef = useRef(0);
  const moodHintLastAtRef = useRef(0);
  const askAbortRef = useRef<AbortController | null>(null);
  const askRunIdRef = useRef(0);
  const moodHintSessionId = useMemo(() => `helix:mood:${contextId}`, [contextId]);
  const [askExpandedByReply, setAskExpandedByReply] = useState<Record<string, boolean>>({});
  const [micArmState, setMicArmState] = useState<MicArmState>(() => {
    if (typeof window === "undefined") return "off";
    try {
      const persisted = window.localStorage.getItem(MIC_PERSIST_KEY);
      return persisted === "on" ? "on" : "off";
    } catch {
      return "off";
    }
  });
  const micArmStateRef = useRef<MicArmState>(micArmState);
  const [voiceInputState, setVoiceInputState] = useState<MicRuntimeState>("listening");
  const [voiceInputError, setVoiceInputError] = useState<string | null>(null);
  const [transcriptConfirmState, setTranscriptConfirmState] = useState<TranscriptConfirmState | null>(null);
  const [voiceMonitorMaxHeightPx, setVoiceMonitorMaxHeightPx] = useState(320);
  const [voiceMonitorLevel, setVoiceMonitorLevel] = useState(0);
  const [voiceMonitorThreshold, setVoiceMonitorThreshold] = useState(MIC_LEVEL_MIN_THRESHOLD);
  const [voiceSignalState, setVoiceSignalState] = useState<"waiting" | "low" | "speech">("waiting");
  const [voiceMeterStats, setVoiceMeterStats] = useState<VoiceMeterStats>({
    rmsRaw: 0,
    rmsDb: -120,
    peak: 0,
    noiseFloor: 0.006,
    displayLevel: 0,
  });
  const [voiceRecorderStats, setVoiceRecorderStats] = useState<VoiceRecorderStats>({
    mediaChunkCount: 0,
    mediaBytes: 0,
    lastChunkAtMs: null,
    chunksPerSecond: 0,
  });
  const [voiceCaptureCheckpoints, setVoiceCaptureCheckpoints] = useState<
    Record<VoiceCaptureCheckpointKey, VoiceCaptureCheckpoint>
  >(() => createVoiceCaptureCheckpointMap());
  const [voiceCaptureWarnings, setVoiceCaptureWarnings] = useState<VoiceCaptureWarningCode[]>([]);
  const [voiceSegmentAttempts, setVoiceSegmentAttempts] = useState<VoiceSegmentAttempt[]>([]);
  const [voiceLastRoundtripMs, setVoiceLastRoundtripMs] = useState<number | null>(null);
  const [voiceRecorderMimeType, setVoiceRecorderMimeType] = useState<string | null>(null);
  const [voiceInputDeviceLabel, setVoiceInputDeviceLabel] = useState<string | null>(null);
  const [voiceTrackMuted, setVoiceTrackMuted] = useState(false);
  const [conversationGovernor, setConversationGovernor] = useState<ConversationGovernorState>({
    floor_owner: "none",
    turn_state: "hard_pause",
    cooling_down: false,
    completion_score: { score: 0, route: "ask_more" },
    narrative_spine: {
      objective: null,
      phase: "observe",
      user_terms: [],
      candidate_answer: null,
      open_question: null,
      evidence_anchor: null,
      next_action: null,
    },
  });
  const [reasoningAttempts, setReasoningAttempts] = useState<ReasoningAttempt[]>([]);
  const [helixTimeline, setHelixTimeline] = useState<HelixTimelineEntry[]>([]);
  const reasoningAttemptQueueRef = useRef<string[]>([]);
  const reasoningAttemptRunnerRef = useRef(false);
  const reasoningAttemptCurrentIdRef = useRef<string | null>(null);
  const reasoningAttemptAbortControllerRef = useRef<AbortController | null>(null);
  const reasoningAttemptAbortAttemptIdRef = useRef<string | null>(null);
  const reasoningAttemptRestartRequestedRef = useRef(new Set<string>());
  const reasoningAttemptManualIdRef = useRef<string | null>(null);
  const [missionContextControls, setMissionContextControls] = useState<MissionContextControls>(() =>
    readMissionContextControls(),
  );
  const [contextSessionState, setContextSessionState] = useState<
    "idle" | "requesting" | "active" | "stopping" | "error"
  >("idle");
  const [readAloudByReply, setReadAloudByReply] = useState<Record<string, ReadAloudPlaybackState>>({});
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackElementRef = useRef<HTMLAudioElement | null>(null);
  const voicePlaybackAudioContextRef = useRef<AudioContext | null>(null);
  const voicePlaybackSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const voicePlaybackCompressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const voicePlaybackGainNodeRef = useRef<GainNode | null>(null);
  const voicePlaybackGraphElementRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const playbackReplyIdRef = useRef<string | null>(null);
  const voiceAudioUnlockedRef = useRef(false);
  const voiceAutoSpeakQueueRef = useRef<VoicePlaybackUtterance[]>([]);
  const voiceAutoSpeakRunningRef = useRef(false);
  const voiceAutoSpeakActiveUtteranceRef = useRef<VoicePlaybackUtterance | null>(null);
  const voiceAutoSpeakAbortControllerRef = useRef<AbortController | null>(null);
  const voiceAutoSpeakPendingPlaybackResolverRef = useRef<(() => void) | null>(null);
  const voiceAutoSpeakCancelReasonRef = useRef<VoicePlaybackCancelReason | null>(null);
  const voiceAutoSpeakLastMetricsRef = useRef<VoicePlaybackMetrics | null>(null);
  const voiceBargeHoldActiveRef = useRef(false);
  const voiceBargeHoldTurnKeyRef = useRef<string | null>(null);
  const voiceBargeHoldStartedAtMsRef = useRef<number | null>(null);
  const voiceBargeResumeNotBeforeMsRef = useRef<number | null>(null);
  const voiceBargeTrafficQuietUntilMsRef = useRef<number | null>(null);
  const voiceSuppressedFinalTurnKeysRef = useRef<Set<string>>(new Set());
  const voiceBriefSpokenLifecycleByTurnRef = useRef<Map<string, VoiceDecisionLifecycle>>(new Map());
  const voicePinnedBriefByTurnRef = useRef<
    Map<
      string,
      {
        text: string;
        transcriptRevision: number | null;
      }
    >
  >(new Map());
  const voiceQueuedSpeechLatchByTurnRef = useRef<Map<string, number>>(new Map());
  const voiceRunningSpeechLatchByTurnRef = useRef<Map<string, number>>(new Map());
  const voiceTurnRevisionStateRef = useRef<Record<string, VoiceTurnRevisionState>>({});
  const voiceDivergenceEventsRef = useRef<VoiceDivergenceEvent[]>([]);
  const voiceChunkTimelineEventsRef = useRef<VoiceLaneTimelineDebugEvent[]>([]);
  const [voiceTimelineDebugVersion, setVoiceTimelineDebugVersion] = useState(0);
  const voicePendingPreemptRef = useRef<{
    turnKey: string;
    utteranceId: string;
    policy: Exclude<VoicePreemptPolicy, "none">;
    requestedAtMs: number;
    timeoutAtMs: number;
    timeoutId: number | null;
  } | null>(null);
  const [voiceAutoSpeakLastMetrics, setVoiceAutoSpeakLastMetrics] = useState<VoicePlaybackMetrics | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Array<{ chunk: Blob; atMs: number }>>([]);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceSilenceGainNodeRef = useRef<GainNode | null>(null);
  const voiceMonitorTimerRef = useRef<number | null>(null);
  const voiceCooldownTimerRef = useRef<number | null>(null);
  const voiceSpeechCandidateStartMsRef = useRef<number | null>(null);
  const voiceSpeechActiveRef = useRef(false);
  const voiceLastSpeechMsRef = useRef<number | null>(null);
  const voiceNoiseFloorRef = useRef(0.006);
  const voiceDisplayLevelRef = useRef(0);
  const voicePeakLevelRef = useRef(0);
  const voiceLevelUiLastMsRef = useRef(0);
  const voiceFlatWindowStartMsRef = useRef<number | null>(null);
  const voiceFlatMinRmsRef = useRef(Number.POSITIVE_INFINITY);
  const voiceFlatMaxRmsRef = useRef(0);
  const voiceRecorderStartedAtMsRef = useRef<number | null>(null);
  const voiceLastChunkAtMsRef = useRef<number | null>(null);
  const voiceChunkCountRef = useRef(0);
  const voiceChunkBytesRef = useRef(0);
  const voiceReasoningAttemptSegmentByIdRef = useRef<Record<string, string>>({});
  const voiceTrackMutedRef = useRef(false);
  const voiceSegmentStartMsRef = useRef<number | null>(null);
  const voiceSegmentStartIndexRef = useRef(0);
  const voiceTranscribeQueueRef = useRef<
    Array<{ id: string; blob: Blob; durationMs: number; cutAtMs: number; turnKey: string }>
  >([]);
  const voiceConfirmedTurnQueueRef = useRef<VoiceConfirmedTurn[]>([]);
  const transcriptConfirmStateRef = useRef<TranscriptConfirmState | null>(null);
  const voiceTranscribeBusyRef = useRef(false);
  const voiceSealPollTimerRef = useRef<number | null>(null);
  const voiceSegmentFlushTimerRef = useRef<number | null>(null);
  const voiceMonitorAnchorRef = useRef<HTMLDivElement | null>(null);
  const contextSessionStreamRef = useRef<MediaStream | null>(null);
  const reasoningTheaterPrevRef = useRef<ReasoningTheaterState | null>(null);
  const reasoningTheaterClockRafRef = useRef<number | null>(null);
  const reasoningTheaterClockLastMsRef = useRef<number | null>(null);
  const reasoningTheaterClockAccumulatorMsRef = useRef(0);
  const reasoningTheaterClockElapsedMsRef = useRef(0);
  const reasoningTheaterEventClockRef = useRef<{
    baseElapsedMs: number;
    anchorPerfMs: number | null;
    lastSeq: number | null;
    lastEventTsMs: number | null;
    source: ReasoningTheaterClockSource;
  }>({
    baseElapsedMs: 0,
    anchorPerfMs: null,
    lastSeq: null,
    lastEventTsMs: null,
    source: "local",
  });
  const [reasoningTheaterClockDebug, setReasoningTheaterClockDebug] = useState<{
    source: ReasoningTheaterClockSource;
    seq: number | null;
  }>({
    source: "local",
    seq: null,
  });
  const reasoningTheaterMeterTargetRef = useRef(50);
  const reasoningTheaterMeterDisplayRef = useRef(50);
  const reasoningTheaterPulseHzRef = useRef(1);
  const reasoningTheaterBattleIndexRef = useRef(0);
  const reasoningTheaterStanceRef = useRef<ReasoningTheaterStance>("contested");
  const reasoningTheaterSuppressionReasonRef = useRef<ReasoningTheaterSuppressionReason | null>(null);
  const reasoningTheaterMeterFillRef = useRef<HTMLDivElement | null>(null);
  const reasoningTheaterMeterPatternRef = useRef<HTMLDivElement | null>(null);
  const reasoningTheaterMedalTimersRef = useRef<
    Record<string, { fadeTimer: number | null; removeTimer: number | null }>
  >({});
  const [reasoningTheaterMedalQueue, setReasoningTheaterMedalQueue] = useState<
    ReasoningTheaterMedalPulse[]
  >([]);
  const [reasoningTheaterMedalBrokenByToken, setReasoningTheaterMedalBrokenByToken] = useState<
    Record<string, boolean>
  >({});
  const [reasoningTheaterConfig, setReasoningTheaterConfig] = useState<ReasoningTheaterConfigResponse>(
    () => getDefaultReasoningTheaterConfig(),
  );
  const [reasoningTheaterFrontierIconBrokenByPath, setReasoningTheaterFrontierIconBrokenByPath] = useState<
    Record<string, boolean>
  >({});
  const [reasoningTheaterFrontierDebug, setReasoningTheaterFrontierDebug] = useState<{
    action: ReasoningTheaterFrontierAction;
    deltaPct: number;
  }>({
    action: "steady",
    deltaPct: 0,
  });
  const reasoningTheaterFrontierDebugRef = useRef<{
    action: ReasoningTheaterFrontierAction;
    deltaPct: number;
  }>({
    action: "steady",
    deltaPct: 0,
  });
  const reasoningTheaterFrontierTrackerRef = useRef<ReasoningTheaterFrontierTrackerState>(
    createReasoningTheaterFrontierTrackerState("steady"),
  );
  const reasoningTheaterFrontierCursorRef = useRef<HTMLDivElement | null>(null);
  const reasoningTheaterFrontierIconRef = useRef<HTMLImageElement | null>(null);
  const reasoningTheaterFrontierTextRef = useRef<HTMLSpanElement | null>(null);
  const reasoningTheaterFrontierParticleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reasoningTheaterFrontierBurstRef = useRef<HTMLDivElement | null>(null);
  const reasoningTheaterFrontierPulseUntilMsRef = useRef(0);
  const reasoningTheaterFrontierDebugUpdateAtRef = useRef(0);
  const convergenceStripHoldTimerRef = useRef<number | null>(null);
  const convergenceStripCollapseTimerRef = useRef<number | null>(null);
  const convergenceStripLastCommitTokenRef = useRef<string | null>(null);
  const convergenceStripLastAppliedAtRef = useRef(0);
  const [convergenceStripDisplayState, setConvergenceStripDisplayState] =
    useState<ConvergenceStripState | null>(null);
  const [convergenceStripCollapseState, setConvergenceStripCollapseState] = useState<{
    token: string;
    event: ConvergenceCollapseEvent;
  } | null>(null);
  const convergenceStripStateRef = useRef<ConvergenceStripState | null>(null);
  const contextCapsuleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextCapsuleAutomatonRef = useRef<ContextCapsuleAutomaton | null>(null);
  const contextCapsulePrevCellsRef = useRef<Uint8Array | null>(null);
  const contextCapsuleLastStepMsRef = useRef(0);
  const contextCapsuleLastCommitTokenRef = useRef<string | null>(null);
  const reasoningAttemptsRef = useRef<ReasoningAttempt[]>([]);
  const conversationRecentTurnsRef = useRef<string[]>([]);
  const intentRevisionByTurnKeyRef = useRef<Record<string, IntentRevisionState>>({});
  const voiceTurnAssemblerByTurnKeyRef = useRef<Record<string, VoiceTurnAssemblerState>>({});
  const voiceActiveAssemblerTurnKeyRef = useRef<string | null>(null);
  const voiceHeldTranscriptPrefixRef = useRef<string>("");
  const voiceHeldTranscriptStateRef = useRef<HeldTranscriptState | null>(null);
  const voiceHeldTranscriptFlushTimerRef = useRef<number | null>(null);
  const voiceTurnGameplayLoopStartedAtMsRef = useRef<number | null>(null);
  const explorationRuntimeByTopicRef = useRef<Record<string, ExplorationRuntimeState>>({});
  const reasoningTimelineEntryByAttemptIdRef = useRef<Record<string, string>>({});
  const reasoningStreamEntryByAttemptIdRef = useRef<Record<string, string>>({});

  useEffect(() => {
    reasoningAttemptsRef.current = reasoningAttempts;
  }, [reasoningAttempts]);

  useEffect(() => {
    transcriptConfirmStateRef.current = transcriptConfirmState;
  }, [transcriptConfirmState]);

  useEffect(() => {
    micArmStateRef.current = micArmState;
  }, [micArmState]);

  const clearHeldTranscriptFlushTimer = useCallback(() => {
    if (voiceHeldTranscriptFlushTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(voiceHeldTranscriptFlushTimerRef.current);
      voiceHeldTranscriptFlushTimerRef.current = null;
    }
  }, []);

  const clearHeldTranscriptState = useCallback(() => {
    voiceHeldTranscriptPrefixRef.current = "";
    voiceHeldTranscriptStateRef.current = null;
    clearHeldTranscriptFlushTimer();
  }, [clearHeldTranscriptFlushTimer]);

  useEffect(() => () => clearHeldTranscriptFlushTimer(), [clearHeldTranscriptFlushTimer]);

  const getHelixAskSessionId = useCallback(() => {
    if (helixAskSessionRef.current) return helixAskSessionRef.current;
    const sessionId = ensureContextSession(contextId, "Helix Ask");
    helixAskSessionRef.current = sessionId || null;
    return helixAskSessionRef.current;
  }, [contextId, ensureContextSession]);

  const upsertContextCapsuleSessionLedger = useCallback(
    (summary: ContextCapsuleSummary, pin = false) => {
      setContextCapsuleSessionLedger((prev) => {
        const next = upsertContextCapsuleLedger({
          entries: prev,
          summary,
          pin,
          maxEntries: HELIX_CONTEXT_CAPSULE_MAX_IDS,
        });
        contextCapsuleSessionLedgerRef.current = next;
        return next;
      });
    },
    [],
  );

  const resolveSelectedContextCapsuleIds = useCallback(
    (
      prompt: string,
      inlineCapsuleIds?: string[],
      options?: {
        source?: ReasoningAttemptSource;
        preferLatestWins?: boolean;
      },
    ) => {
      const inlineIds = inlineCapsuleIds ?? extractContextCapsuleIdsFromText(prompt);
      const autoLimit =
        options?.source === "voice_auto"
          ? HELIX_CONTEXT_CAPSULE_AUTO_APPLY_IDS_VOICE
          : HELIX_CONTEXT_CAPSULE_AUTO_APPLY_IDS_MANUAL;
      const builder = options?.preferLatestWins
        ? buildLatestWinsContextCapsuleIds
        : buildSelectedContextCapsuleIds;
      return builder({
        ledgerEntries: contextCapsuleSessionLedgerRef.current,
        prompt,
        inlineCapsuleIds: inlineIds,
        maxIds: inlineIds.length > 0 ? HELIX_CONTEXT_CAPSULE_MAX_IDS : autoLimit,
      });
    },
    [],
  );

  const getPinnedContextCapsuleCount = useCallback(
    () => contextCapsuleSessionLedgerRef.current.filter((entry) => entry.pinned).length,
    [],
  );

  useEffect(() => {
    contextCapsuleSessionLedgerRef.current = contextCapsuleSessionLedger;
  }, [contextCapsuleSessionLedger]);

  useEffect(() => {
    helixAskSessionRef.current = null;
    contextCapsuleSessionLedgerRef.current = [];
    setContextCapsuleSessionLedger([]);
    setContextCapsuleDetectedId(null);
    setContextCapsulePreview(null);
  }, [contextId]);

  useEffect(() => {
    setAskMoodBroken(false);
  }, [askMood]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const update = () => setIsOffline(navigator.onLine === false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!contextCapsuleDetectedId) {
      const previewId = normalizeContextCapsuleId(
        contextCapsulePreview?.summary?.fingerprint ??
          contextCapsulePreview?.summary?.capsuleId ??
          contextCapsulePreview?.id ??
          null,
      );
      const keepVisible =
        previewId !== null &&
        contextCapsuleSessionLedgerRef.current.some((entry) => entry.id === previewId && entry.pinned);
      if (keepVisible) return;
      setContextCapsulePreview(null);
      return;
    }
    const sequence = ++contextCapsuleLookupSeqRef.current;
    const controller = new AbortController();
    setContextCapsulePreview({
      id: contextCapsuleDetectedId,
      loading: true,
    });
    void getContextCapsule(contextCapsuleDetectedId, {
      sessionId: getHelixAskSessionId() ?? undefined,
      signal: controller.signal,
    })
      .then((payload) => {
        if (controller.signal.aborted || sequence !== contextCapsuleLookupSeqRef.current) return;
        setContextCapsulePreview({
          id: contextCapsuleDetectedId,
          loading: false,
          summary: payload.capsule,
          convergence: payload.convergence,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || sequence !== contextCapsuleLookupSeqRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        setContextCapsulePreview({
          id: contextCapsuleDetectedId,
          loading: false,
          error: message,
        });
      });
    return () => {
      controller.abort();
    };
  }, [contextCapsuleDetectedId, getHelixAskSessionId]);

  useEffect(() => {
    broadcastLumaMood(askMood);
  }, [askMood]);

  useEffect(() => {
    if (!REASONING_THEATER_FRONTIER_ACTIONS_ENABLED) return;
    let active = true;
    void getReasoningTheaterConfig()
      .then((payload) => {
        if (!active) return;
        setReasoningTheaterConfig(payload);
      })
      .catch(() => {
        if (!active) return;
        setReasoningTheaterConfig(getDefaultReasoningTheaterConfig());
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (convergenceStripHoldTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(convergenceStripHoldTimerRef.current);
      }
      if (convergenceStripCollapseTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(convergenceStripCollapseTimerRef.current);
      }
    };
  }, []);

  const clearLiveDraftFlush = useCallback(() => {
    if (askLiveDraftFlushRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(askLiveDraftFlushRef.current);
    }
    askLiveDraftFlushRef.current = null;
  }, []);

  const flushLiveDraft = useCallback(() => {
    clearLiveDraftFlush();
    const nextRaw = askLiveDraftBufferRef.current;
    const clipped = nextRaw.length > 4000 ? nextRaw.slice(-4000) : nextRaw;
    askLiveDraftRef.current = clipped;
    setAskLiveDraft(clipped);
  }, [clearLiveDraftFlush]);

  const scheduleLiveDraftFlush = useCallback(() => {
    if (askLiveDraftFlushRef.current !== null) return;
    if (typeof window === "undefined") {
      flushLiveDraft();
      return;
    }
    askLiveDraftFlushRef.current = window.setTimeout(() => {
      flushLiveDraft();
    }, 60);
  }, [flushLiveDraft]);

  const pickRandomMood = useCallback((): LumaMood => {
    const idx = Math.floor(Math.random() * LUMA_MOOD_ORDER.length);
    return LUMA_MOOD_ORDER[idx] ?? "question";
  }, []);

  useEffect(() => {
    setAskMood(pickRandomMood());
  }, [pickRandomMood]);

  const updateMoodFromText = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const { mood } = classifyMoodFromWhisper(trimmed);
    if (mood) {
      setAskMood(mood);
    }
  }, []);

  const cancelMoodHint = useCallback(() => {
    moodHintSeqRef.current += 1;
    moodHintLastAtRef.current = 0;
    if (moodHintAbortRef.current) {
      moodHintAbortRef.current.abort();
      moodHintAbortRef.current = null;
    }
  }, []);

  const requestMoodHint = useCallback(
    (value: string, opts?: { force?: boolean }) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const now = Date.now();
      const force = opts?.force === true;
      if (!force && now - moodHintLastAtRef.current < HELIX_MOOD_HINT_MIN_INTERVAL_MS) {
        return;
      }
      moodHintLastAtRef.current = now;
      moodHintSeqRef.current += 1;
      const seq = moodHintSeqRef.current;
      if (moodHintAbortRef.current) {
        moodHintAbortRef.current.abort();
      }
      const controller = new AbortController();
      moodHintAbortRef.current = controller;
      const clipped = trimmed.slice(-HELIX_MOOD_HINT_MAX_TEXT_CHARS);
      void askMoodHint(clipped, {
        sessionId: moodHintSessionId,
        signal: controller.signal,
      })
        .then((hint) => {
          if (controller.signal.aborted) return;
          if (seq !== moodHintSeqRef.current) return;
          const mood = hint?.mood;
          const confidence = typeof hint?.confidence === "number" ? hint.confidence : 0;
          if (mood && confidence >= HELIX_MOOD_HINT_CONFIDENCE) {
            setAskMood(mood);
          }
        })
        .catch(() => {
          // Mood hints are best-effort and should never block the UI.
        })
        .finally(() => {
          if (moodHintAbortRef.current === controller) {
            moodHintAbortRef.current = null;
          }
        });
    },
    [moodHintSessionId],
  );

  const clearMoodTimer = useCallback(() => {
    if (askMoodTimerRef.current !== null) {
      window.clearTimeout(askMoodTimerRef.current);
      askMoodTimerRef.current = null;
    }
  }, []);

  const clearReasoningTheaterMedalTimers = useCallback((token?: string) => {
    if (typeof window === "undefined") return;
    if (token) {
      const timers = reasoningTheaterMedalTimersRef.current[token];
      if (timers?.fadeTimer !== null) {
        window.clearTimeout(timers.fadeTimer);
      }
      if (timers?.removeTimer !== null) {
        window.clearTimeout(timers.removeTimer);
      }
      delete reasoningTheaterMedalTimersRef.current[token];
      return;
    }
    for (const key of Object.keys(reasoningTheaterMedalTimersRef.current)) {
      const timers = reasoningTheaterMedalTimersRef.current[key];
      if (timers?.fadeTimer !== null) {
        window.clearTimeout(timers.fadeTimer);
      }
      if (timers?.removeTimer !== null) {
        window.clearTimeout(timers.removeTimer);
      }
    }
    reasoningTheaterMedalTimersRef.current = {};
  }, []);

  useEffect(() => () => clearMoodTimer(), [clearMoodTimer]);
  useEffect(() => () => cancelMoodHint(), [cancelMoodHint]);
  useEffect(() => () => clearLiveDraftFlush(), [clearLiveDraftFlush]);
  useEffect(() => () => clearReasoningTheaterMedalTimers(), [clearReasoningTheaterMedalTimers]);
  useEffect(() => {
    if (!askBusy) return;
    cancelMoodHint();
  }, [askBusy, cancelMoodHint]);

  useEffect(() => {
    if (!askBusy) return;
    const offlineStatus = "Offline - reconnecting...";
    if (isOffline) {
      if (askStatus && askStatus !== offlineStatus) {
        lastAskStatusRef.current = askStatus;
      }
      if (askStatus !== offlineStatus) {
        setAskStatus(offlineStatus);
      }
      return;
    }
    if (askStatus === offlineStatus) {
      setAskStatus(lastAskStatusRef.current ?? "Generating answer...");
    }
  }, [askBusy, askStatus, isOffline]);

  useEffect(() => {
    if (isOffline) return;
    if (askStatus) {
      lastAskStatusRef.current = askStatus;
    }
  }, [askStatus, isOffline]);


  const moodAsset = resolveMoodAsset(askMood);
  const moodSrc = askMoodBroken ? null : moodAsset?.sources[0] ?? null;
  const moodLabel = moodAsset?.label ?? "Helix mood";
  const moodPalette = LUMA_MOOD_PALETTE[askMood] ?? LUMA_MOOD_PALETTE.question;
  const moodRingClass = moodPalette.ring;
  const reasoningTheater = useMemo(
    () =>
      deriveReasoningTheaterState({
        askBusy,
        askStatus,
        askLiveDraft,
        askElapsedMs,
        askLiveEvents,
        askLiveTraceId,
      }),
    [askBusy, askElapsedMs, askLiveDraft, askLiveEvents, askLiveTraceId, askStatus],
  );
  const reasoningTheaterParticles = useMemo(() => {
    if (!reasoningTheater) return [];
    return buildReasoningTheaterParticles(
      reasoningTheater.seed,
      reasoningTheater.particleCount,
    );
  }, [reasoningTheater]);
  const reasoningTheaterFrontierParticles = useMemo(() => {
    if (!reasoningTheater) return [];
    return buildReasoningTheaterFrontierParticles(
      reasoningTheater.seed,
      REASONING_THEATER_FRONTIER_PARTICLE_COUNT,
    );
  }, [reasoningTheater]);
  const reasoningTheaterMeterTarget = reasoningTheater
    ? clampNumber(Math.round(((reasoningTheater.battleIndex + 1) / 2) * 100), 0, 100)
    : 50;
  const convergenceStripRawState = useMemo(
    () =>
      deriveConvergenceStripState({
        events: askLiveEvents,
        frontierAction: reasoningTheaterFrontierDebug.action,
        frontierDeltaPct: reasoningTheaterFrontierDebug.deltaPct,
        fallbackPhase: reasoningTheater?.phase ?? "observe",
      }),
    [
      askLiveEvents,
      reasoningTheater?.phase,
      reasoningTheaterFrontierDebug.action,
      reasoningTheaterFrontierDebug.deltaPct,
    ],
  );

  useEffect(() => {
    if (!askBusy) {
      if (convergenceStripHoldTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(convergenceStripHoldTimerRef.current);
      }
      convergenceStripHoldTimerRef.current = null;
      convergenceStripLastAppliedAtRef.current = 0;
      setConvergenceStripDisplayState(null);
      return;
    }
    const next = convergenceStripRawState;
    setConvergenceStripDisplayState((previous) => {
      if (!hasConvergenceStateChanged(previous, next)) {
        return previous ?? next;
      }
      const nowMs = Date.now();
      const holdMs = Math.max(0, reasoningTheaterConfig.retrieval_zone_layer.presentation.lane_hold_ms);
      const elapsed = nowMs - convergenceStripLastAppliedAtRef.current;
      const remaining = Math.max(0, holdMs - elapsed);
      if (remaining <= 0 || previous === null || typeof window === "undefined") {
        convergenceStripLastAppliedAtRef.current = nowMs;
        if (convergenceStripHoldTimerRef.current !== null && typeof window !== "undefined") {
          window.clearTimeout(convergenceStripHoldTimerRef.current);
          convergenceStripHoldTimerRef.current = null;
        }
        return next;
      }
      if (convergenceStripHoldTimerRef.current !== null) {
        window.clearTimeout(convergenceStripHoldTimerRef.current);
      }
      convergenceStripHoldTimerRef.current = window.setTimeout(() => {
        convergenceStripLastAppliedAtRef.current = Date.now();
        setConvergenceStripDisplayState((current) => (hasConvergenceStateChanged(current, next) ? next : current));
      }, remaining);
      return previous;
    });
  }, [askBusy, convergenceStripRawState, reasoningTheaterConfig.retrieval_zone_layer.presentation.lane_hold_ms]);

  useEffect(() => {
    if (!askBusy) {
      if (convergenceStripCollapseTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(convergenceStripCollapseTimerRef.current);
      }
      convergenceStripCollapseTimerRef.current = null;
      convergenceStripLastCommitTokenRef.current = null;
      setConvergenceStripCollapseState(null);
      return;
    }
    const token = convergenceStripRawState.collapseToken;
    const event = convergenceStripRawState.collapseEvent;
    if (!token || !event) return;
    if (token === convergenceStripLastCommitTokenRef.current) return;
    convergenceStripLastCommitTokenRef.current = token;
    setConvergenceStripCollapseState({ token, event });
    if (convergenceStripCollapseTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(convergenceStripCollapseTimerRef.current);
    }
    if (typeof window !== "undefined") {
      convergenceStripCollapseTimerRef.current = window.setTimeout(() => {
        setConvergenceStripCollapseState((current) => (current?.token === token ? null : current));
      }, Math.max(120, reasoningTheaterConfig.retrieval_zone_layer.presentation.collapse_pulse_ms));
    }
  }, [
    askBusy,
    convergenceStripRawState.collapseEvent,
    convergenceStripRawState.collapseToken,
    reasoningTheaterConfig.retrieval_zone_layer.presentation.collapse_pulse_ms,
  ]);

  const convergenceStripState = convergenceStripDisplayState ?? convergenceStripRawState;

  const stopReasoningTheaterClock = useCallback(() => {
    if (reasoningTheaterClockRafRef.current !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(reasoningTheaterClockRafRef.current);
      reasoningTheaterClockRafRef.current = null;
    }
    reasoningTheaterClockLastMsRef.current = null;
    reasoningTheaterClockAccumulatorMsRef.current = 0;
  }, []);

  const resetReasoningTheaterEventClock = useCallback(() => {
    reasoningTheaterEventClockRef.current = {
      baseElapsedMs: 0,
      anchorPerfMs: null,
      lastSeq: null,
      lastEventTsMs: null,
      source: "local",
    };
    setReasoningTheaterClockDebug({ source: "local", seq: null });
  }, []);

  const updateReasoningTheaterEventClock = useCallback(
    (event: ToolLogEvent, startedAt: number, eventTsMs: number | null) => {
      const nowPerfMs =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      const clock = reasoningTheaterEventClockRef.current;
      let nextSource: ReasoningTheaterClockSource = clock.source;
      let nextElapsedMs = clock.baseElapsedMs;

      if (
        eventTsMs !== null &&
        (clock.lastEventTsMs === null || eventTsMs >= clock.lastEventTsMs - 250)
      ) {
        const elapsedFromStartMs = Math.max(0, eventTsMs - startedAt);
        nextElapsedMs = Math.max(nextElapsedMs, elapsedFromStartMs);
        clock.lastEventTsMs = eventTsMs;
        nextSource = "event_ts";
      } else if (
        typeof event.seq === "number" &&
        Number.isFinite(event.seq) &&
        clock.lastSeq !== null &&
        event.seq > clock.lastSeq
      ) {
        const seqDelta = clampNumber(event.seq - clock.lastSeq, 1, 120);
        nextElapsedMs += seqDelta * REASONING_THEATER_CLOCK_STEP_MS;
        nextSource = "event_seq";
      } else if (clock.anchorPerfMs !== null) {
        const elapsedSinceAnchorMs = Math.max(0, nowPerfMs - clock.anchorPerfMs);
        nextElapsedMs = Math.max(nextElapsedMs, clock.baseElapsedMs + elapsedSinceAnchorMs);
      }

      clock.baseElapsedMs = nextElapsedMs;
      clock.anchorPerfMs = nowPerfMs;
      if (typeof event.seq === "number" && Number.isFinite(event.seq)) {
        if (clock.lastSeq === null || event.seq > clock.lastSeq) {
          clock.lastSeq = event.seq;
        }
      }
      clock.source = nextSource;
      setReasoningTheaterClockDebug((prev) =>
        prev.source === clock.source && prev.seq === clock.lastSeq
          ? prev
          : { source: clock.source, seq: clock.lastSeq },
      );
    },
    [],
  );

  const applyReasoningTheaterMeterFrame = useCallback(
    (meterValue: number, elapsedMs: number) => {
      const clampedMeter = clampFrontierMeterPct(meterValue);
      const fill = reasoningTheaterMeterFillRef.current;
      if (fill) {
        fill.style.width = `${clampedMeter.toFixed(2)}%`;
      }
      const pattern = reasoningTheaterMeterPatternRef.current;
      if (pattern) {
        const hz = clampNumber(reasoningTheaterPulseHzRef.current, 0.4, 4.5);
        const speedPxPerSecond = 20 + hz * 26;
        const direction = reasoningTheaterBattleIndexRef.current >= 0 ? 1 : -1;
        const cyclePx = 56;
        const driftPx = ((elapsedMs / 1000) * speedPxPerSecond) % cyclePx;
        const shiftPx = direction > 0 ? driftPx : -driftPx;
        pattern.style.transform = `translate3d(${shiftPx.toFixed(2)}px,0,0)`;
        const intensity = clampNumber(
          0.24 + Math.abs(reasoningTheaterBattleIndexRef.current) * 0.46,
          0.24,
          0.8,
        );
        pattern.style.opacity = intensity.toFixed(2);
      }

      let committedAction = reasoningTheaterFrontierTrackerRef.current.committedAction;
      let profile = resolveReasoningTheaterFrontierParticleProfile(
        committedAction,
        reasoningTheaterConfig.frontier_actions,
      );
      if (REASONING_THEATER_FRONTIER_ACTIONS_ENABLED) {
        const trackerResult = advanceReasoningTheaterFrontierTracker(
          reasoningTheaterFrontierTrackerRef.current,
          {
            nowMs: elapsedMs,
            meterPct: clampedMeter,
            stance: reasoningTheaterStanceRef.current,
            suppressionReason: reasoningTheaterSuppressionReasonRef.current,
            config: reasoningTheaterConfig.frontier_actions,
          },
        );
        reasoningTheaterFrontierTrackerRef.current = trackerResult.state;
        committedAction = trackerResult.state.committedAction;
        if (trackerResult.actionChanged) {
          reasoningTheaterFrontierPulseUntilMsRef.current =
            elapsedMs + REASONING_THEATER_FRONTIER_CURSOR_PULSE_MS;
        }
        const windowDeltaPct = trackerResult.state.lastWindowDeltaPct;
        const deltaRounded = Math.round(windowDeltaPct * 10) / 10;
        const canPublishDebug =
          trackerResult.actionChanged ||
          elapsedMs - reasoningTheaterFrontierDebugUpdateAtRef.current >= 250;
        if (canPublishDebug) {
          reasoningTheaterFrontierDebugUpdateAtRef.current = elapsedMs;
          const nextDebug = {
            action: committedAction,
            deltaPct: deltaRounded,
          };
          reasoningTheaterFrontierDebugRef.current = nextDebug;
          setReasoningTheaterFrontierDebug((prev) =>
            prev.action === committedAction && Math.abs(prev.deltaPct - deltaRounded) < 0.25
              ? prev
              : nextDebug,
          );
        }

        const iconPath = resolveReasoningTheaterFrontierIconPath(
          committedAction,
          reasoningTheaterConfig.frontier_actions,
        );
        profile = resolveReasoningTheaterFrontierParticleProfile(
          committedAction,
          reasoningTheaterConfig.frontier_actions,
        );
        const iconBroken = reasoningTheaterFrontierIconBrokenByPath[iconPath] === true;
        const cursor = reasoningTheaterFrontierCursorRef.current;
        if (cursor) {
          const pulseActive = elapsedMs <= reasoningTheaterFrontierPulseUntilMsRef.current;
          const pulseScale = pulseActive ? 1.18 : 1;
          cursor.style.left = `${clampedMeter.toFixed(2)}%`;
          cursor.style.opacity = "1";
          cursor.style.transform = `translate3d(-50%,-50%,0) scale(${pulseScale.toFixed(2)})`;
        }

        const icon = reasoningTheaterFrontierIconRef.current;
        if (icon) {
          if (!iconBroken) {
            if (icon.getAttribute("src") !== iconPath) {
              icon.setAttribute("src", iconPath);
            }
            icon.style.display = "block";
          } else {
            icon.style.display = "none";
          }
        }
        const fallback = reasoningTheaterFrontierTextRef.current;
        if (fallback) {
          fallback.textContent = REASONING_THEATER_FRONTIER_ACTION_LABEL[committedAction];
          fallback.style.display = iconBroken ? "inline-flex" : "none";
          fallback.style.color = profile.color;
        }

        const densityRatio = clamp01(profile.emit_rate_hz / 30);
        const activeParticleCount = Math.max(
          1,
          Math.round(densityRatio * reasoningTheaterFrontierParticleRefs.current.length),
        );
        for (let i = 0; i < reasoningTheaterFrontierParticleRefs.current.length; i += 1) {
          const node = reasoningTheaterFrontierParticles[i];
          const element = reasoningTheaterFrontierParticleRefs.current[i];
          if (!node || !element) continue;
          if (i >= activeParticleCount) {
            element.style.opacity = "0";
            continue;
          }
          const cycleMs = clampNumber(
            980 - profile.speed_max_px_s * 2.8 + i * 40,
            260,
            1200,
          );
          const progress = ((elapsedMs + node.phaseOffsetMs) % cycleMs) / cycleMs;
          const angleDrift =
            Math.sin((elapsedMs + node.phaseOffsetMs) * 0.003 + i) * profile.spread_deg;
          const angleDeg =
            profile.base_direction_deg + angleDrift * (0.45 + profile.turbulence * 0.75);
          const angleRad = (angleDeg * Math.PI) / 180;
          const speed =
            profile.speed_min_px_s +
            (profile.speed_max_px_s - profile.speed_min_px_s) *
              (0.24 + ((i + 1) / (activeParticleCount + 1)) * 0.76);
          const travelPx = speed * 0.22;
          const jitter =
            Math.sin((elapsedMs + node.phaseOffsetMs) * 0.014 + i) * profile.turbulence * 5;
          const x = Math.cos(angleRad) * travelPx * progress;
          const y = Math.sin(angleRad) * travelPx * progress + jitter;
          const alpha = (1 - progress) * (0.42 + densityRatio * 0.5);
          const size = node.baseRadiusPx + profile.turbulence * 1.6;
          element.style.width = `${size.toFixed(2)}px`;
          element.style.height = `${size.toFixed(2)}px`;
          element.style.backgroundColor = profile.color;
          element.style.opacity = alpha.toFixed(2);
          element.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
        }

        const burst = reasoningTheaterFrontierBurstRef.current;
        if (burst) {
          const pulseWindowMs = Math.max(1, REASONING_THEATER_FRONTIER_CURSOR_PULSE_MS);
          const pulseProgress = clamp01(
            (reasoningTheaterFrontierPulseUntilMsRef.current - elapsedMs) / pulseWindowMs,
          );
          const shouldShow = profile.transition_burst && pulseProgress > 0;
          burst.style.opacity = shouldShow ? (pulseProgress * 0.7).toFixed(2) : "0";
          burst.style.borderColor = profile.color;
          const ringScale = 0.7 + (1 - pulseProgress) * (profile.shock_ring ? 1.45 : 0.9);
          burst.style.transform = `translate3d(-50%,-50%,0) scale(${ringScale.toFixed(2)})`;
        }
      }

      const capsuleState = convergenceStripStateRef.current;
      let capsuleAutomaton = contextCapsuleAutomatonRef.current;
      const capsuleCanvas = contextCapsuleCanvasRef.current;
      if (capsuleState && capsuleAutomaton && capsuleCanvas) {
        const commitToken = capsuleState.collapseToken;
        if (
          commitToken &&
          capsuleState.collapseEvent &&
          commitToken !== contextCapsuleLastCommitTokenRef.current
        ) {
          contextCapsulePrevCellsRef.current = capsuleAutomaton.cells.slice();
          capsuleAutomaton = injectContextCapsuleCommit(capsuleAutomaton, capsuleState.collapseEvent);
          if (capsuleState.collapseEvent === "proof_commit") {
            capsuleAutomaton = { ...capsuleAutomaton, frozen: true };
          }
          contextCapsuleAutomatonRef.current = capsuleAutomaton;
          contextCapsuleLastCommitTokenRef.current = commitToken;
        } else if (!commitToken) {
          contextCapsuleLastCommitTokenRef.current = null;
        }

        const controls = {
          source: capsuleState.source,
          proof: capsuleState.proof,
          maturity: capsuleState.maturity,
        } satisfies {
          source: ConvergenceStripState["source"];
          proof: ConvergenceStripState["proof"];
          maturity: ConvergenceStripState["maturity"];
        };
        let guard = 0;
        while (
          !capsuleAutomaton.frozen &&
          elapsedMs - contextCapsuleLastStepMsRef.current >= CONTEXT_CAPSULE_SIM_TICK_MS &&
          guard < 8
        ) {
          contextCapsulePrevCellsRef.current = capsuleAutomaton.cells.slice();
          capsuleAutomaton = stepContextCapsuleAutomaton(capsuleAutomaton, controls);
          contextCapsuleAutomatonRef.current = capsuleAutomaton;
          contextCapsuleLastStepMsRef.current += CONTEXT_CAPSULE_SIM_TICK_MS;
          guard += 1;
        }
        if (guard === 8 && elapsedMs - contextCapsuleLastStepMsRef.current >= CONTEXT_CAPSULE_SIM_TICK_MS) {
          contextCapsuleLastStepMsRef.current = elapsedMs;
        }

        const interpolation = clamp01(
          (elapsedMs - contextCapsuleLastStepMsRef.current) / CONTEXT_CAPSULE_SIM_TICK_MS,
        );
        const prevCells = contextCapsulePrevCellsRef.current ?? capsuleAutomaton.cells;
        const palette = resolveContextCapsulePalette(capsuleState);
        const ctx = capsuleCanvas.getContext("2d");
        if (ctx) {
          const width = capsuleAutomaton.width;
          const height = capsuleAutomaton.height;
          const proofBias =
            capsuleState.proof === "confirmed"
              ? 0.24
              : capsuleState.proof === "reasoned"
                ? 0.12
                : capsuleState.proof === "fail_closed"
                  ? -0.2
                  : 0;
          ctx.clearRect(0, 0, width, height);
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              const index = y * width + x;
              const prev = prevCells[index] ?? 0;
              const current = capsuleAutomaton.cells[index] ?? 0;
              const mixed = prev + (current - prev) * interpolation;
              if (mixed <= 0.01) continue;
              const alpha = clampNumber(0.08 + mixed * 0.78 + proofBias, 0.04, 0.98);
              ctx.fillStyle = `rgba(${palette.r},${palette.g},${palette.b},${alpha.toFixed(3)})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
    },
    [
      reasoningTheaterConfig,
      reasoningTheaterFrontierIconBrokenByPath,
      reasoningTheaterFrontierParticles,
    ],
  );

  useEffect(() => {
    if (!askBusy || !reasoningTheater) {
      reasoningTheaterMeterTargetRef.current = 50;
      reasoningTheaterPulseHzRef.current = 1;
      reasoningTheaterBattleIndexRef.current = 0;
      reasoningTheaterStanceRef.current = "contested";
      reasoningTheaterSuppressionReasonRef.current = null;
      reasoningTheaterMeterDisplayRef.current = 50;
      reasoningTheaterClockElapsedMsRef.current = 0;
      reasoningTheaterFrontierTrackerRef.current = createReasoningTheaterFrontierTrackerState("steady");
      const steadyDebug = { action: "steady" as const, deltaPct: 0 };
      reasoningTheaterFrontierDebugRef.current = steadyDebug;
      setReasoningTheaterFrontierDebug((prev) =>
        prev.action === steadyDebug.action && Math.abs(prev.deltaPct - steadyDebug.deltaPct) < 0.01
          ? prev
          : steadyDebug,
      );
      setReasoningTheaterFrontierIconBrokenByPath((prev) =>
        Object.keys(prev).length === 0 ? prev : {},
      );
      reasoningTheaterFrontierDebugUpdateAtRef.current = 0;
      setConvergenceStripDisplayState(null);
      setConvergenceStripCollapseState(null);
      convergenceStripLastCommitTokenRef.current = null;
      contextCapsuleAutomatonRef.current = null;
      contextCapsulePrevCellsRef.current = null;
      contextCapsuleLastStepMsRef.current = 0;
      contextCapsuleLastCommitTokenRef.current = null;
      const capsuleCanvas = contextCapsuleCanvasRef.current;
      if (capsuleCanvas) {
        const ctx = capsuleCanvas.getContext("2d");
        ctx?.clearRect(0, 0, capsuleCanvas.width, capsuleCanvas.height);
      }
      if (!askBusy) {
        resetReasoningTheaterEventClock();
      }
      applyReasoningTheaterMeterFrame(50, 0);
      return;
    }
    reasoningTheaterMeterTargetRef.current = reasoningTheaterMeterTarget;
    reasoningTheaterPulseHzRef.current = reasoningTheater.pulseHz;
    reasoningTheaterBattleIndexRef.current = reasoningTheater.battleIndex;
    reasoningTheaterStanceRef.current = reasoningTheater.stance;
    reasoningTheaterSuppressionReasonRef.current = reasoningTheater.suppressionReason;
    if (!contextCapsuleAutomatonRef.current) {
      const seed = hash32(
        `${askLiveTraceId ?? askActiveQuestion ?? "helix"}:${convergenceStripState.source}:${contextId}`,
      );
      const automaton = createContextCapsuleAutomaton({
        seed,
        width: CONTEXT_CAPSULE_GRID_WIDTH,
        height: CONTEXT_CAPSULE_GRID_HEIGHT,
        source: convergenceStripState.source,
      });
      contextCapsuleAutomatonRef.current = automaton;
      contextCapsulePrevCellsRef.current = automaton.cells.slice();
      contextCapsuleLastStepMsRef.current = reasoningTheaterClockElapsedMsRef.current;
      contextCapsuleLastCommitTokenRef.current = null;
    }
  }, [
    applyReasoningTheaterMeterFrame,
    askBusy,
    askActiveQuestion,
    askLiveTraceId,
    contextId,
    convergenceStripState.source,
    resetReasoningTheaterEventClock,
    reasoningTheater,
    reasoningTheaterMeterTarget,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !askBusy) {
      stopReasoningTheaterClock();
      return;
    }
    stopReasoningTheaterClock();
    const tick = (nowMs: number) => {
      if (reasoningTheaterClockLastMsRef.current === null) {
        reasoningTheaterClockLastMsRef.current = nowMs;
        applyReasoningTheaterMeterFrame(
          reasoningTheaterMeterDisplayRef.current,
          reasoningTheaterClockElapsedMsRef.current,
        );
        reasoningTheaterClockRafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      const rawDelta = nowMs - reasoningTheaterClockLastMsRef.current;
      reasoningTheaterClockLastMsRef.current = nowMs;
      const frameDelta = clampNumber(
        Number.isFinite(rawDelta) ? rawDelta : REASONING_THEATER_CLOCK_STEP_MS,
        0,
        120,
      );
      let simulationDelta = frameDelta;
      const eventClock = reasoningTheaterEventClockRef.current;
      if (eventClock.anchorPerfMs !== null) {
        const elapsedSinceAnchorMs = Math.max(0, nowMs - eventClock.anchorPerfMs);
        const eventTimelineElapsedMs = eventClock.baseElapsedMs + elapsedSinceAnchorMs;
        const eventTimelineDelta = eventTimelineElapsedMs - reasoningTheaterClockElapsedMsRef.current;
        if (Number.isFinite(eventTimelineDelta)) {
          simulationDelta = clampNumber(eventTimelineDelta, 0, 240);
        }
      }
      reasoningTheaterClockAccumulatorMsRef.current += simulationDelta;
      let stepped = false;
      while (reasoningTheaterClockAccumulatorMsRef.current >= REASONING_THEATER_CLOCK_STEP_MS) {
        reasoningTheaterClockAccumulatorMsRef.current -= REASONING_THEATER_CLOCK_STEP_MS;
        const target = reasoningTheaterMeterTargetRef.current;
        const current = reasoningTheaterMeterDisplayRef.current;
        const delta = target - current;
        let next = current;
        if (Math.abs(delta) <= REASONING_THEATER_METER_EPSILON) {
          next = target;
        } else {
          const alpha =
            delta >= 0
              ? REASONING_THEATER_METER_GAIN_ALPHA
              : REASONING_THEATER_METER_LOSS_ALPHA;
          next = clampNumber(current + delta * alpha, 0, 100);
        }
        reasoningTheaterMeterDisplayRef.current = next;
        reasoningTheaterClockElapsedMsRef.current += REASONING_THEATER_CLOCK_STEP_MS;
        stepped = true;
      }
      if (stepped) {
        applyReasoningTheaterMeterFrame(
          reasoningTheaterMeterDisplayRef.current,
          reasoningTheaterClockElapsedMsRef.current,
        );
      }
      reasoningTheaterClockRafRef.current = window.requestAnimationFrame(tick);
    };
    reasoningTheaterClockRafRef.current = window.requestAnimationFrame(tick);
    return () => stopReasoningTheaterClock();
  }, [applyReasoningTheaterMeterFrame, askBusy, stopReasoningTheaterClock]);

  useEffect(() => {
    if (!askBusy || !reasoningTheater) {
      reasoningTheaterPrevRef.current = null;
      setReasoningTheaterMedalQueue([]);
      setReasoningTheaterMedalBrokenByToken({});
      clearReasoningTheaterMedalTimers();
      return;
    }
    const previous = reasoningTheaterPrevRef.current;
    const medalEvent = resolveReasoningTheaterMedal({
      current: reasoningTheater,
      previous,
    });
    reasoningTheaterPrevRef.current = reasoningTheater;
    if (!medalEvent) return;

    const startedAt = Date.now();
    const token = `${reasoningTheater.seed}:${medalEvent.medal}:${askLiveEvents.length}:${startedAt}`;
    const pulse: ReasoningTheaterMedalPulse = {
      ...medalEvent,
      token,
      startedAt,
      assetPath: REASONING_THEATER_MEDAL_ASSET[medalEvent.medal],
      fading: false,
    };

    setReasoningTheaterMedalQueue((prevQueue) => {
      const nextQueue = [...prevQueue, pulse];
      if (nextQueue.length <= REASONING_THEATER_MEDAL_MAX_VISIBLE) return nextQueue;
      const trimmedQueue = nextQueue.slice(-REASONING_THEATER_MEDAL_MAX_VISIBLE);
      const keep = new Set(trimmedQueue.map((entry) => entry.token));
      for (const entry of prevQueue) {
        if (!keep.has(entry.token)) {
          clearReasoningTheaterMedalTimers(entry.token);
        }
      }
      return trimmedQueue;
    });

    if (typeof window !== "undefined") {
      const fadeTimer = window.setTimeout(() => {
        setReasoningTheaterMedalQueue((prevQueue) =>
          prevQueue.map((entry) =>
            entry.token === token ? { ...entry, fading: true } : entry,
          ),
        );
      }, REASONING_THEATER_MEDAL_VISIBLE_MS);
      const removeTimer = window.setTimeout(() => {
        setReasoningTheaterMedalQueue((prevQueue) =>
          prevQueue.filter((entry) => entry.token !== token),
        );
        setReasoningTheaterMedalBrokenByToken((prev) => {
          if (!(token in prev)) return prev;
          const next = { ...prev };
          delete next[token];
          return next;
        });
        clearReasoningTheaterMedalTimers(token);
      }, REASONING_THEATER_MEDAL_VISIBLE_MS + REASONING_THEATER_MEDAL_FADE_MS);
      reasoningTheaterMedalTimersRef.current[token] = { fadeTimer, removeTimer };
    }
  }, [
    askBusy,
    askLiveEvents.length,
    clearReasoningTheaterMedalTimers,
    reasoningTheater,
  ]);
  const latestReasoningTheaterMedal =
    reasoningTheaterMedalQueue[reasoningTheaterMedalQueue.length - 1] ?? null;
  const reasoningTheaterFrontierAction = reasoningTheaterFrontierDebug.action;
  const reasoningTheaterFrontierIconPath = resolveReasoningTheaterFrontierIconPath(
    reasoningTheaterFrontierAction,
    reasoningTheaterConfig.frontier_actions,
  );
  const reasoningTheaterFrontierIconBroken =
    reasoningTheaterFrontierIconBrokenByPath[reasoningTheaterFrontierIconPath] === true;
  const convergenceStripPresentation = reasoningTheaterConfig.retrieval_zone_layer.presentation;
  const convergenceStripActiveMode = convergenceStripPresentation.mode === "convergence_strip_v1";
  const convergenceStripShowPhaseTick =
    convergenceStripActiveMode && convergenceStripPresentation.show_phase_tick;
  const convergenceStripShowCaption =
    convergenceStripActiveMode && convergenceStripPresentation.show_caption;
  const convergenceStripShowReplySnapshot = convergenceStripPresentation.show_reply_snapshot;
  const convergenceIdeologyCue =
    convergenceStripActiveMode &&
    convergenceStripState.ideologyAnchorNodeIds.length > 0 &&
    (convergenceStripState.source !== "unknown" || convergenceStripState.proof !== "unknown");
  const convergenceCollapseVisible =
    convergenceStripActiveMode &&
    convergenceStripCollapseState !== null &&
    convergenceStripCollapseState.token === convergenceStripState.collapseToken;

  useEffect(() => {
    convergenceStripStateRef.current = convergenceStripState;
  }, [convergenceStripState]);

  useEffect(() => {
    if (!askBusy) return;
    const lastEvent = askLiveEvents[askLiveEvents.length - 1]?.text?.trim();
    const draftTail = askLiveDraft.trim();
    const status = askStatus?.trim();
    const nextText = lastEvent || (draftTail ? draftTail.slice(-320) : "") || status;
    if (!nextText) return;
    const timer = window.setTimeout(() => {
      updateMoodFromText(nextText);
      requestMoodHint(nextText);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [askBusy, askLiveDraft, askLiveEvents, askStatus, requestMoodHint, updateMoodFromText]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"] | null | undefined) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      onOpenPanel?.(panelId);
    },
    [onOpenPanel],
  );

  const launchAtomicViewer = useCallback(
    (payload: AtomicViewerLaunch | undefined) => {
      if (!payload) return;
      if (payload.viewer !== "atomic-orbital" || payload.panel_id !== "electron-orbital") return;
      openPanelById(payload.panel_id);
      if (typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(HELIX_ATOMIC_LAUNCH_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Best effort; still dispatch the event.
      }
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(HELIX_ATOMIC_LAUNCH_EVENT, {
            detail: payload,
          }),
        );
      }, 60);
    },
    [openPanelById],
  );

  const renderHelixAskContent = useCallback(
    (content: unknown): ReactNode[] => {
      const parts: ReactNode[] = [];
      const text = coerceText(content);
      if (!text) return parts;
      HELIX_ASK_PATH_REGEX.lastIndex = 0;
      let lastIndex = 0;
      for (const match of text.matchAll(HELIX_ASK_PATH_REGEX)) {
        const matchText = match[0];
        const start = match.index ?? 0;
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        const panelId = resolvePanelIdFromPath(matchText);
        if (panelId) {
          parts.push(
            <button
              key={`${matchText}-${start}`}
              className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
              onClick={() => openPanelById(panelId)}
              type="button"
            >
              {matchText}
            </button>,
          );
        } else {
          parts.push(matchText);
        }
        lastIndex = start + matchText.length;
      }
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      return parts.length ? parts : [text];
    },
    [openPanelById],
  );

  const renderEnvelopeSections = useCallback(
    (sections: HelixAskResponseEnvelope["sections"], hideTitle?: string, expanded?: boolean) => {
      if (!sections || sections.length === 0) return null;
      const hidden = hideTitle?.toLowerCase();
      return (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="text-sm text-slate-100">
              {(() => {
                const title = coerceText(section.title);
                return title && title.toLowerCase() !== hidden ? (
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {title}
                  </p>
                ) : null;
              })()}
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {renderHelixAskContent(
                  clipForDisplay(
                    coerceText(section.body),
                    HELIX_ASK_MAX_RENDER_CHARS,
                    Boolean(expanded),
                  ),
                )}
              </p>
              {section.layer === "proof" && normalizeCitations(section.citations).length > 0 ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  Sources: {renderHelixAskContent(normalizeCitations(section.citations).join(", "))}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      );
    },
    [renderHelixAskContent],
  );

  const renderHelixAskEnvelope = useCallback(
    (reply: HelixAskReply) => {
      if (!reply.envelope) {
        return (
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(reply.content)}
          </p>
        );
      }
      const envelopeAnswer = coerceText(reply.envelope.answer).trim();
      const fallbackAnswer = coerceText(reply.content).trim();
      const sections = reply.envelope.sections ?? [];
      const detailSections = sections.filter((section) => section.layer !== "proof");
      const proofSections = sections.filter((section) => section.layer === "proof");
      const expandDetails = reply.envelope.mode === "extended";
      const extension = reply.envelope.extension;
      const extensionBody = coerceText(extension?.body).trim();
      const extensionCitations = normalizeCitations(extension?.citations);
      const extensionAvailable = Boolean(extension?.available && extensionBody);
      const extensionOpen = Boolean(askExtensionOpenByReply[reply.id]);
      const expanded = Boolean(askExpandedByReply[reply.id]);
      const answerText = clipForDisplay(
        coerceText(envelopeAnswer || fallbackAnswer),
        HELIX_ASK_MAX_RENDER_CHARS,
        expanded,
      );
      const hasLongContent =
        hasLongText(envelopeAnswer || fallbackAnswer, HELIX_ASK_MAX_RENDER_CHARS) ||
        hasLongText(extensionBody, HELIX_ASK_MAX_RENDER_CHARS) ||
        sections.some((section) => hasLongText(section.body, HELIX_ASK_MAX_RENDER_CHARS));
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(answerText)}
          </p>
          {hasLongContent ? (
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
              onClick={() =>
                setAskExpandedByReply((prev) => ({
                  ...prev,
                  [reply.id]: !expanded,
                }))
              }
            >
              {expanded ? "Show Less" : "Show Full Answer"}
            </button>
          ) : null}
          {extensionAvailable ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              <button
                type="button"
                className="text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-slate-200"
                onClick={() =>
                  setAskExtensionOpenByReply((prev) => ({
                    ...prev,
                    [reply.id]: !prev[reply.id],
                  }))
                }
              >
                {extensionOpen ? "Hide Additional Repo Context" : "Expand With Retrieved Evidence"}
              </button>
              {extensionOpen ? (
                <div className="mt-2 space-y-1">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderHelixAskContent(
                      clipForDisplay(extensionBody, HELIX_ASK_MAX_RENDER_CHARS, expanded),
                    )}
                  </p>
                  {extensionCitations.length > 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Sources: {renderHelixAskContent(extensionCitations.join(", "))}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {detailSections.length > 0 ? (
            <details
              open={expandDetails}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Details
              </summary>
              <div className="mt-2">
                {renderEnvelopeSections(detailSections, "Details", expanded)}
              </div>
            </details>
          ) : null}
          {proofSections.length > 0 ? (
            <details
              open={expandDetails}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Proof
              </summary>
              <div className="mt-2">
                {renderEnvelopeSections(proofSections, "Proof", expanded)}
              </div>
            </details>
          ) : null}
        </div>
      );
    },
    [askExpandedByReply, askExtensionOpenByReply, renderEnvelopeSections, renderHelixAskContent],
  );

  const buildCopyText = useCallback((reply: HelixAskReply): string => {
    if (!reply) return "";
    if (!reply.envelope) return reply.content;
    const sections = reply.envelope.sections ?? [];
    const detailSections = sections.filter((section) => section.layer !== "proof");
    const proofSections = sections.filter((section) => section.layer === "proof");
    const chunks: string[] = [coerceText(reply.envelope.answer)];
    const extensionBody = coerceText(reply.envelope.extension?.body).trim();
    if (extensionBody) {
      chunks.push(`Additional Repo Context\n${extensionBody}`);
    }
    if (detailSections.length > 0) {
      const detailText = formatEnvelopeSectionsForCopy(detailSections, "Details");
      if (detailText) {
        chunks.push(`Details\n${detailText}`);
      }
    }
    if (proofSections.length > 0) {
      const proofText = formatEnvelopeSectionsForCopy(proofSections, "Proof");
      if (proofText) {
        chunks.push(`Proof\n${proofText}`);
      }
    }
    return chunks.filter(Boolean).join("\n\n").trim();
  }, []);

  const handleCopyReply = useCallback(
    async (reply: HelixAskReply) => {
      const text = buildCopyText(reply);
      if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore clipboard failures
      }
    },
    [buildCopyText],
  );

  const handleCopyContextCapsule = useCallback(
    async (reply: HelixAskReply) => {
      if (!reply.contextCapsule || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(buildContextCapsuleCopyText(reply.contextCapsule));
      } catch {
        // ignore clipboard failures
      }
    },
    [],
  );

  const updateVoiceAutoSpeakMetrics = useCallback((metrics: VoicePlaybackMetrics) => {
    voiceAutoSpeakLastMetricsRef.current = metrics;
    setVoiceAutoSpeakLastMetrics(metrics);
  }, []);

  const buildInitialVoiceTurnAssemblerState = useCallback(
    (turnKey: string): VoiceTurnAssemblerState => {
      const now = Date.now();
      return {
        turnKey,
        phase: "draft",
        transcriptRevision: 0,
        sealedRevision: 0,
        sealToken: null,
        sealedAtMs: null,
        draftTranscript: "",
        draftRecordedText: "",
        lastSpeechAtMs: now,
        hashStableSinceMs: now,
        currentTranscriptHash: "",
        sttQueueDepth: 0,
        sttInFlight: false,
        heldPending: false,
        briefSpokenRevision: 0,
        artifactRetryCountByRevision: {},
        sourceLanguage: null,
        translated: false,
        sttEngine: null,
        confidence: 0,
        confidenceReason: null,
        completion: { score: 0, route: "ask_more" },
        turnComplete: { score: 0, band: "low", reason: "insufficient_pause" },
        segmentId: null,
        updatedAtMs: now,
      };
    },
    [],
  );

  const updateVoiceTurnAssemblerState = useCallback(
    (
      turnKey: string,
      updater: (current: VoiceTurnAssemblerState) => VoiceTurnAssemblerState,
    ): VoiceTurnAssemblerState => {
      const map = voiceTurnAssemblerByTurnKeyRef.current;
      const current = map[turnKey] ?? buildInitialVoiceTurnAssemblerState(turnKey);
      const next = {
        ...updater(current),
        turnKey,
        updatedAtMs: Date.now(),
      };
      map[turnKey] = next;
      const keys = Object.keys(map);
      if (keys.length > 64) {
        const dropKeys = keys
          .sort((a, b) => (map[a]?.updatedAtMs ?? 0) - (map[b]?.updatedAtMs ?? 0))
          .slice(0, keys.length - 64);
        for (const dropKey of dropKeys) {
          delete map[dropKey];
        }
      }
      return next;
    },
    [buildInitialVoiceTurnAssemblerState],
  );

  const getVoiceTurnAssemblerState = useCallback((turnKey: string | null | undefined) => {
    if (!turnKey) return null;
    return voiceTurnAssemblerByTurnKeyRef.current[turnKey] ?? null;
  }, []);

  const clearVoiceSealPollTimer = useCallback(() => {
    if (voiceSealPollTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(voiceSealPollTimerRef.current);
      voiceSealPollTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearVoiceSealPollTimer(), [clearVoiceSealPollTimer]);

  const updateVoiceTurnRevisionState = useCallback(
    (
      turnKey: string,
      updater: (current: VoiceTurnRevisionState) => VoiceTurnRevisionState,
    ): VoiceTurnRevisionState => {
      const current = voiceTurnRevisionStateRef.current[turnKey] ?? {
        turnKey,
        latestTranscriptRevision: 0,
        latestBriefRevision: 0,
        latestFinalRevision: 0,
        latestRevision: 0,
        activeUtteranceRevision: null,
        pendingPreemptPolicy: "none" as VoicePreemptPolicy,
        pendingSwitchReason: "none" as const,
        pendingSinceMs: null,
        pendingDeadlineMs: null,
        uiVoiceRevisionMatch: null,
        lastEventCode: null,
        updatedAtMs: Date.now(),
      };
      const next = {
        ...updater(current),
        turnKey,
        updatedAtMs: Date.now(),
      };
      voiceTurnRevisionStateRef.current[turnKey] = next;
      const keys = Object.keys(voiceTurnRevisionStateRef.current);
      if (keys.length > 64) {
        const oldest = keys
          .sort(
            (a, b) =>
              (voiceTurnRevisionStateRef.current[a]?.updatedAtMs ?? 0) -
              (voiceTurnRevisionStateRef.current[b]?.updatedAtMs ?? 0),
          )
          .slice(0, keys.length - 64);
        for (const key of oldest) {
          delete voiceTurnRevisionStateRef.current[key];
        }
      }
      return next;
    },
    [],
  );

  const bumpVoiceTurnRevision = useCallback(
    (
      turnKey: string,
      kind: "transcript" | "brief" | "final",
    ): VoiceUtteranceRevision => {
      const next = updateVoiceTurnRevisionState(turnKey, (current) => {
        const revision = current.latestRevision + 1;
        return {
          ...current,
          latestRevision: revision,
          latestTranscriptRevision:
            kind === "transcript" ? revision : current.latestTranscriptRevision,
          latestBriefRevision: kind === "brief" ? revision : current.latestBriefRevision,
          latestFinalRevision: kind === "final" ? revision : current.latestFinalRevision,
        };
      });
      return {
        turnKey,
        revision: next.latestRevision,
        kind: kind === "final" ? "final" : "brief",
      };
    },
    [updateVoiceTurnRevisionState],
  );

  const setIntentRevisionState = useCallback((next: IntentRevisionState) => {
    const key = next.turnKey.trim();
    if (!key) return;
    const map = intentRevisionByTurnKeyRef.current;
    map[key] = {
      ...next,
      turnKey: key,
      updatedAtMs: Date.now(),
    };
    const keys = Object.keys(map);
    if (keys.length > 64) {
      const dropKeys = keys
        .sort((a, b) => (map[a]?.updatedAtMs ?? 0) - (map[b]?.updatedAtMs ?? 0))
        .slice(0, keys.length - 64);
      for (const dropKey of dropKeys) {
        delete map[dropKey];
      }
    }
  }, []);

  const recordVoiceDivergenceEvent = useCallback(
    (input: {
      code: VoiceDivergenceEventCode;
      turnKey: string;
      utteranceId?: string | null;
      revision?: number | null;
      detail?: string | null;
      uiVoiceRevisionMatch?: boolean | null;
    }) => {
      const event: VoiceDivergenceEvent = {
        code: input.code,
        turnKey: input.turnKey,
        utteranceId: input.utteranceId ?? null,
        revision: input.revision ?? null,
        detail: input.detail ?? null,
        atMs: Date.now(),
      };
      const nextEvents = [...voiceDivergenceEventsRef.current, event].slice(-40);
      voiceDivergenceEventsRef.current = nextEvents;
      updateVoiceTurnRevisionState(input.turnKey, (current) => ({
        ...current,
        lastEventCode: input.code,
        uiVoiceRevisionMatch:
          typeof input.uiVoiceRevisionMatch === "boolean"
            ? input.uiVoiceRevisionMatch
            : current.uiVoiceRevisionMatch,
      }));
    },
    [updateVoiceTurnRevisionState],
  );

  const pushVoiceChunkTimelineEvent = useCallback(
    (
      input: Omit<VoiceLaneTimelineDebugEvent, "id" | "atMs" | "source"> & {
        atMs?: number;
      },
    ) => {
      const event: VoiceLaneTimelineDebugEvent = {
        id: `voice-chunk:${crypto.randomUUID()}`,
        atMs: input.atMs ?? Date.now(),
        source: "chunk_playback",
        kind: input.kind,
        status: input.status ?? null,
        traceId: input.traceId ?? null,
        turnKey: input.turnKey ?? null,
        attemptId: input.attemptId ?? null,
        utteranceId: input.utteranceId ?? null,
        chunkIndex: typeof input.chunkIndex === "number" ? input.chunkIndex : null,
        chunkCount: typeof input.chunkCount === "number" ? input.chunkCount : null,
        text: input.text ? summarizeVoiceDebugText(input.text, 240) : null,
        detail: input.detail ? summarizeVoiceDebugText(input.detail, 220) : null,
      };
      const nextEvents = [...voiceChunkTimelineEventsRef.current, event].slice(
        -HELIX_VOICE_DEBUG_TIMELINE_LIMIT,
      );
      voiceChunkTimelineEventsRef.current = nextEvents;
      setVoiceTimelineDebugVersion((value) => (value + 1) % 1_000_000);
    },
    [],
  );

  const isVoiceUtteranceRevisionStale = useCallback((revision: VoiceUtteranceRevision): boolean => {
    const state = voiceTurnRevisionStateRef.current[revision.turnKey];
    if (!state) return false;
    return state.latestRevision > revision.revision;
  }, []);

  const getOrCreateVoicePlaybackElement = useCallback((): HTMLAudioElement => {
    const existing = playbackElementRef.current;
    if (existing) return existing;
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    audio.volume = 1;
    playbackElementRef.current = audio;
    return audio;
  }, []);

  const ensureVoicePlaybackAudioGraph = useCallback(
    async (audio: HTMLAudioElement): Promise<boolean> => {
      if (typeof window === "undefined") return false;
      const AudioCtx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AudioCtx) return false;
      let playbackContext = voicePlaybackAudioContextRef.current;
      if (!playbackContext) {
        playbackContext = new AudioCtx();
        voicePlaybackAudioContextRef.current = playbackContext;
      }
      if (playbackContext.state === "suspended") {
        try {
          await playbackContext.resume();
        } catch {
          // fallback to plain element playback if context resume is blocked
          return false;
        }
      }

      let sourceNode = voicePlaybackSourceNodeRef.current;
      if (!sourceNode || voicePlaybackGraphElementRef.current !== audio) {
        sourceNode = playbackContext.createMediaElementSource(audio);
        voicePlaybackSourceNodeRef.current = sourceNode;
        voicePlaybackGraphElementRef.current = audio;
      }
      let compressorNode = voicePlaybackCompressorNodeRef.current;
      if (!compressorNode) {
        compressorNode = playbackContext.createDynamicsCompressor();
        compressorNode.threshold.value = -21;
        compressorNode.knee.value = 18;
        compressorNode.ratio.value = 3.4;
        compressorNode.attack.value = 0.004;
        compressorNode.release.value = 0.22;
        voicePlaybackCompressorNodeRef.current = compressorNode;
      }
      let gainNode = voicePlaybackGainNodeRef.current;
      if (!gainNode) {
        gainNode = playbackContext.createGain();
        voicePlaybackGainNodeRef.current = gainNode;
      }

      const targetGain = resolveVoicePlaybackGain(window.navigator?.userAgent);
      gainNode.gain.cancelScheduledValues(playbackContext.currentTime);
      gainNode.gain.setTargetAtTime(targetGain, playbackContext.currentTime, 0.02);
      try {
        sourceNode.disconnect();
      } catch {
        // no-op
      }
      try {
        compressorNode.disconnect();
      } catch {
        // no-op
      }
      try {
        gainNode.disconnect();
      } catch {
        // no-op
      }
      sourceNode.connect(compressorNode);
      compressorNode.connect(gainNode);
      gainNode.connect(playbackContext.destination);
      return true;
    },
    [],
  );

  const primeVoiceAudioPlayback = useCallback(async (): Promise<boolean> => {
    if (voiceAudioUnlockedRef.current) return true;
    if (typeof window === "undefined") return false;
    try {
      const primer = getOrCreateVoicePlaybackElement();
      await ensureVoicePlaybackAudioGraph(primer).catch(() => false);
      primer.muted = true;
      primer.src = MOBILE_AUDIO_UNLOCK_DATA_URI;
      const playPromise = primer.play();
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }
      primer.pause();
      primer.currentTime = 0;
      primer.src = "";
      primer.load();
      primer.muted = false;
      voiceAudioUnlockedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, [ensureVoicePlaybackAudioGraph, getOrCreateVoicePlaybackElement]);

  const playVoiceAudioBlob = useCallback(
    async (input: { blob: Blob; replyId?: string | null; awaitPlayback?: boolean }): Promise<void> => {
      const replyId = input.replyId ?? null;
      const audio = getOrCreateVoicePlaybackElement();
      await ensureVoicePlaybackAudioGraph(audio).catch(() => false);
      const url = URL.createObjectURL(input.blob);
      audio.muted = false;
      audio.volume = 1;
      playbackUrlRef.current = url;
      playbackReplyIdRef.current = replyId;
      audio.src = url;
      audio.load();
      playbackAudioRef.current = audio;
      if (replyId) {
        setReadAloudByReply((prev) => ({
          ...prev,
          [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", "audio"),
        }));
      }
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finalize = (event: "ended" | "error" | "stopped") => {
          if (settled) return;
          settled = true;
          if (voiceAutoSpeakPendingPlaybackResolverRef.current === resolver) {
            voiceAutoSpeakPendingPlaybackResolverRef.current = null;
          }
          if (replyId) {
            setReadAloudByReply((prev) => ({
              ...prev,
              [replyId]: transitionReadAloudState(
                prev[replyId] ?? "idle",
                event === "ended" ? "ended" : event === "stopped" ? "stop" : "error",
              ),
            }));
          }
          if (playbackUrlRef.current === url) {
            URL.revokeObjectURL(url);
            playbackUrlRef.current = null;
          }
          if (playbackAudioRef.current === audio) {
            playbackAudioRef.current = null;
          }
          if (playbackReplyIdRef.current === replyId) {
            playbackReplyIdRef.current = null;
          }
          if (event === "error") {
            reject(new Error("voice_audio_playback_error"));
            return;
          }
          resolve();
        };
        const resolver = () => finalize("stopped");
        voiceAutoSpeakPendingPlaybackResolverRef.current = resolver;
        audio.onended = () => finalize("ended");
        audio.onerror = () => finalize("error");
        const attemptPlay = async () => {
          try {
            await audio.play();
          } catch (error) {
            if (
              error instanceof DOMException &&
              (error.name === "NotAllowedError" || error.name === "AbortError")
            ) {
              const unlocked = await primeVoiceAudioPlayback();
              if (unlocked) {
                await audio.play();
                return;
              }
            }
            throw error;
          }
        };
        if (input.awaitPlayback === false) {
          void attemptPlay()
            .then(() => resolve())
            .catch(() => finalize("error"));
          return;
        }
        void attemptPlay().catch((error) => {
          if (
            error instanceof DOMException &&
            (error.name === "NotAllowedError" || error.name === "AbortError")
          ) {
            setVoiceInputError("Audio blocked on this device. Tap mic to enable playback.");
          }
          finalize("error");
        });
      });
    },
    [ensureVoicePlaybackAudioGraph, getOrCreateVoicePlaybackElement, primeVoiceAudioPlayback],
  );

  const clearVoicePendingPreempt = useCallback(() => {
    const pending = voicePendingPreemptRef.current;
    if (!pending) return;
    if (pending.timeoutId !== null && typeof window !== "undefined") {
      window.clearTimeout(pending.timeoutId);
    }
    updateVoiceTurnRevisionState(pending.turnKey, (current) => ({
      ...current,
      pendingPreemptPolicy: "none",
      pendingSwitchReason: "none",
      pendingSinceMs: null,
      pendingDeadlineMs: null,
    }));
    voicePendingPreemptRef.current = null;
  }, [updateVoiceTurnRevisionState]);

  const stopReadAloud = useCallback((reason: VoicePlaybackCancelReason = "manual_stop") => {
    clearVoicePendingPreempt();
    voiceBargeHoldActiveRef.current = false;
    voiceBargeHoldTurnKeyRef.current = null;
    voiceBargeHoldStartedAtMsRef.current = null;
    voiceBargeResumeNotBeforeMsRef.current = null;
    if (reason === "barge_in") {
      // Drop pending chunks so speech does not resume over the active speaker.
      voiceAutoSpeakQueueRef.current = [];
    }
    if (voiceAutoSpeakAbortControllerRef.current) {
      voiceAutoSpeakAbortControllerRef.current.abort();
      voiceAutoSpeakAbortControllerRef.current = null;
    }
    const activeUtterance = voiceAutoSpeakActiveUtteranceRef.current;
    if (activeUtterance) {
      voiceAutoSpeakCancelReasonRef.current = reason;
      const previousMetrics = voiceAutoSpeakLastMetricsRef.current;
      if (previousMetrics && previousMetrics.utteranceId === activeUtterance.utteranceId) {
        updateVoiceAutoSpeakMetrics({
          ...previousMetrics,
          cancelReason: reason,
          totalPlaybackMs:
            previousMetrics.totalPlaybackMs ??
            Math.max(0, Date.now() - activeUtterance.enqueuedAtMs),
        });
      }
    }
    const currentAudio = playbackAudioRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      playbackAudioRef.current = null;
    }
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }
    if (playbackReplyIdRef.current) {
      const replyId = playbackReplyIdRef.current;
      setReadAloudByReply((prev) => ({ ...prev, [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", "stop") }));
      playbackReplyIdRef.current = null;
    }
    const pendingResolver = voiceAutoSpeakPendingPlaybackResolverRef.current;
    voiceAutoSpeakPendingPlaybackResolverRef.current = null;
    if (pendingResolver) {
      pendingResolver();
    }
  }, [clearVoicePendingPreempt, updateVoiceAutoSpeakMetrics]);

  const setVoicePendingPreempt = useCallback(
    (input: {
      policy: Exclude<VoicePreemptPolicy, "none">;
      activeUtterance: VoicePlaybackUtterance;
      incomingUtterance: VoicePlaybackUtterance;
    }) => {
      const existing = voicePendingPreemptRef.current;
      if (
        existing &&
        existing.turnKey === input.activeUtterance.turnKey &&
        existing.utteranceId === input.activeUtterance.utteranceId &&
        existing.policy === input.policy
      ) {
        return;
      }
      clearVoicePendingPreempt();
      const now = Date.now();
      const timeoutAtMs = now + VOICE_PREEMPT_BOUNDARY_TIMEOUT_MS;
      updateVoiceTurnRevisionState(input.activeUtterance.turnKey, (current) => ({
        ...current,
        pendingPreemptPolicy: input.policy,
        pendingSwitchReason:
          input.policy === "pending_final" ? "pending_preempt_by_final" : "pending_preempt_by_regen",
        pendingSinceMs: now,
        pendingDeadlineMs: timeoutAtMs,
      }));
      recordVoiceDivergenceEvent({
        code: "preempt_pending",
        turnKey: input.activeUtterance.turnKey,
        utteranceId: input.activeUtterance.utteranceId,
        revision: input.activeUtterance.revision,
        detail: `${input.policy} <- ${input.incomingUtterance.kind}@r${input.incomingUtterance.revision}`,
      });
      const timeoutId =
        typeof window !== "undefined"
          ? window.setTimeout(() => {
              const pending = voicePendingPreemptRef.current;
              if (
                !pending ||
                pending.turnKey !== input.activeUtterance.turnKey ||
                pending.utteranceId !== input.activeUtterance.utteranceId ||
                pending.policy !== input.policy
              ) {
                return;
              }
              recordVoiceDivergenceEvent({
                code: "preempt_timeout_forced",
                turnKey: pending.turnKey,
                utteranceId: pending.utteranceId,
                revision: input.activeUtterance.revision,
                detail: `${pending.policy} timeout ${VOICE_PREEMPT_BOUNDARY_TIMEOUT_MS}ms`,
              });
              stopReadAloud(pending.policy === "pending_final" ? "preempted_by_final" : "superseded_same_turn");
            }, VOICE_PREEMPT_BOUNDARY_TIMEOUT_MS)
          : null;
      voicePendingPreemptRef.current = {
        turnKey: input.activeUtterance.turnKey,
        utteranceId: input.activeUtterance.utteranceId,
        policy: input.policy,
        requestedAtMs: now,
        timeoutAtMs,
        timeoutId,
      };
    },
    [
      clearVoicePendingPreempt,
      recordVoiceDivergenceEvent,
      stopReadAloud,
      updateVoiceTurnRevisionState,
    ],
  );

  const requestVoicePlayback = useCallback(
    async (input: {
      text: string;
      eventId: string;
      traceId?: string;
      provider?: string;
      voiceProfileId?: string;
      markReplyId?: string;
      awaitPlayback?: boolean;
    }): Promise<"audio" | "json"> => {
      const text = buildSpeakText(input.text);
      if (!text) return "json";
      stopReadAloud();
      const replyId = input.markReplyId ?? null;
      if (replyId) {
        setReadAloudByReply((prev) => ({
          ...prev,
          [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", "request"),
        }));
      }
      try {
        const response = await speakVoice({
          text,
          mode: "briefing",
          priority: "info",
          provider: input.provider,
          voice_profile_id: input.voiceProfileId,
          traceId: input.traceId ?? askLiveTraceId ?? `ask:${crypto.randomUUID()}`,
          missionId: contextId,
          eventId: input.eventId,
          contextTier: missionContextControls.tier,
          sessionState: contextSessionState,
          voiceMode: missionContextControls.voiceMode,
        });
        if (response.kind === "json") {
          if (replyId) {
            const statusEvent = response.status >= 400 ? "error" : "dry-run";
            setReadAloudByReply((prev) => ({
              ...prev,
              [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", statusEvent),
            }));
          }
          return "json";
        }
        await playVoiceAudioBlob({
          blob: response.blob,
          replyId,
          awaitPlayback: input.awaitPlayback,
        });
        return "audio";
      } catch {
        if (playbackAudioRef.current) {
          playbackAudioRef.current.pause();
          playbackAudioRef.current.src = "";
          playbackAudioRef.current = null;
        }
        if (playbackUrlRef.current) {
          URL.revokeObjectURL(playbackUrlRef.current);
          playbackUrlRef.current = null;
        }
        playbackReplyIdRef.current = null;
        if (replyId) {
          setReadAloudByReply((prev) => ({
            ...prev,
            [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", "error"),
          }));
        }
        throw new Error("voice_playback_failed");
      }
    },
    [
      askLiveTraceId,
      contextId,
      contextSessionState,
      missionContextControls.tier,
      missionContextControls.voiceMode,
      playVoiceAudioBlob,
      stopReadAloud,
    ],
  );

  const synthesizeVoiceChunk = useCallback(
    async (input: {
      utterance: VoicePlaybackUtterance;
      chunk: VoicePlaybackChunk;
      signal: AbortSignal;
    }): Promise<{
      blob: Blob;
      synthMs: number;
      headers: {
        provider: string | null;
        profile: string | null;
        cache: "hit" | "miss" | null;
      };
    }> => {
      const startedAtMs = Date.now();
      const sleepWithAbort = async (ms: number): Promise<void> => {
        if (ms <= 0) return;
        await new Promise<void>((resolve, reject) => {
          if (input.signal.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          const timer = setTimeout(() => {
            input.signal.removeEventListener("abort", onAbort);
            resolve();
          }, ms);
          const onAbort = () => {
            clearTimeout(timer);
            input.signal.removeEventListener("abort", onAbort);
            reject(new DOMException("Aborted", "AbortError"));
          };
          input.signal.addEventListener("abort", onAbort, { once: true });
        });
      };
      let lastError: unknown = null;
      for (let attempt = 1; attempt <= VOICE_CHUNK_SYNTH_MAX_ATTEMPTS; attempt += 1) {
        try {
          const response = await speakVoice(
            {
              text: input.chunk.text,
              mode: "briefing",
              priority: "info",
              provider: HELIX_VOICE_AUTO_SPEAK_PROVIDER,
              voice_profile_id: HELIX_VOICE_AUTO_SPEAK_DEFAULT_PROFILE_ID,
              traceId: input.utterance.traceId ?? askLiveTraceId ?? `ask:${crypto.randomUUID()}`,
              // Brief/final auto-speak is chunked; omit missionId to avoid callout rate rails.
              missionId: undefined,
              eventId: input.utterance.eventId,
              contextTier: missionContextControls.tier,
              sessionState: contextSessionState,
              voiceMode: missionContextControls.voiceMode,
              utteranceId: input.utterance.utteranceId,
              chunkIndex: input.chunk.chunkIndex,
              chunkCount: input.chunk.chunkCount,
              chunkKind: input.chunk.kind,
              turnKey: input.chunk.turnKey,
            },
            { signal: input.signal },
          );
          if (response.kind === "json") {
            const suppressionReason =
              (response.payload as { suppression_reason?: string | null }).suppression_reason ??
              response.payload?.reason ??
              response.payload?.error ??
              response.payload?.message ??
              "voice_auto_speak_json_response";
            if (response.payload?.suppressed === true || response.status < 400) {
              throw new Error(`voice_auto_speak_suppressed:${suppressionReason}`);
            }
            const statusError = new Error(suppressionReason) as Error & {
              status?: number;
              retryAfterMs?: number;
            };
            statusError.status = response.status;
            const payloadRetryAfter = (response.payload as { retryAfterMs?: unknown })?.retryAfterMs;
            if (typeof payloadRetryAfter === "number" && Number.isFinite(payloadRetryAfter)) {
              statusError.retryAfterMs = payloadRetryAfter;
            }
            throw statusError;
          }
          const synthMs = Math.max(0, Date.now() - startedAtMs);
          return {
            blob: response.blob,
            synthMs,
            headers: response.headers,
          };
        } catch (error) {
          lastError = error;
          if (!isRetryableVoiceChunkSynthesisError(error) || attempt >= VOICE_CHUNK_SYNTH_MAX_ATTEMPTS) {
            break;
          }
          const retryAfterMsRaw = (error as { retryAfterMs?: unknown } | null)?.retryAfterMs;
          const retryAfterMs =
            typeof retryAfterMsRaw === "number" && Number.isFinite(retryAfterMsRaw)
              ? retryAfterMsRaw
              : VOICE_CHUNK_SYNTH_RETRY_BASE_MS + Math.floor(Math.random() * VOICE_CHUNK_SYNTH_RETRY_JITTER_MS);
          const delayMs = Math.min(
            VOICE_CHUNK_SYNTH_RETRY_MAX_MS,
            Math.max(VOICE_CHUNK_SYNTH_RETRY_BASE_MS, retryAfterMs),
          );
          await sleepWithAbort(delayMs);
        }
      }
      throw (lastError instanceof Error ? lastError : new Error(String(lastError ?? "voice_chunk_synth_failed")));
    },
    [
      askLiveTraceId,
      contextId,
      contextSessionState,
      missionContextControls.tier,
      missionContextControls.voiceMode,
    ],
  );

  const runVoiceAutoSpeakQueue = useCallback(async () => {
    if (voiceAutoSpeakRunningRef.current) return;
    voiceAutoSpeakRunningRef.current = true;
    try {
      while (voiceAutoSpeakQueueRef.current.length > 0) {
        if (micArmStateRef.current !== "on") break;
        const utterance = voiceAutoSpeakQueueRef.current.shift();
        if (!utterance || utterance.chunks.length === 0) continue;
        const stalePendingPreempt = voicePendingPreemptRef.current;
        if (
          stalePendingPreempt &&
          (stalePendingPreempt.turnKey !== utterance.turnKey ||
            stalePendingPreempt.utteranceId !== utterance.utteranceId)
        ) {
          clearVoicePendingPreempt();
        }
        if (isVoiceUtteranceRevisionStale({
          turnKey: utterance.turnKey,
          revision: utterance.revision,
          kind: utterance.kind,
        })) {
          recordVoiceDivergenceEvent({
            code: "stale_revision_dropped",
            turnKey: utterance.turnKey,
            utteranceId: utterance.utteranceId,
            revision: utterance.revision,
            detail: "dropped before playback",
            uiVoiceRevisionMatch: false,
          });
          continue;
        }
        voiceAutoSpeakActiveUtteranceRef.current = utterance;
        voiceAutoSpeakCancelReasonRef.current = null;
        updateVoiceTurnRevisionState(utterance.turnKey, (current) => ({
          ...current,
          activeUtteranceRevision: utterance.revision,
        }));
        const turnState = voiceTurnRevisionStateRef.current[utterance.turnKey];
        const revisionMatch =
          !turnState || turnState.latestRevision <= utterance.revision;
        recordVoiceDivergenceEvent({
          code: revisionMatch ? "ui_voice_revision_match" : "divergence_detected",
          turnKey: utterance.turnKey,
          utteranceId: utterance.utteranceId,
          revision: utterance.revision,
          detail: revisionMatch ? "active utterance matches latest revision" : "active utterance behind latest revision",
          uiVoiceRevisionMatch: revisionMatch,
        });
        const metrics: VoicePlaybackMetrics = {
          utteranceId: utterance.utteranceId,
          turnKey: utterance.turnKey,
          kind: utterance.kind,
          chunkCount: utterance.chunks.length,
          enqueueToFirstAudioMs: null,
          synthDurationsMs: [],
          chunkGapMs: [],
          totalPlaybackMs: null,
          cancelReason: null,
          cacheHitCount: 0,
          cacheMissCount: 0,
        };
        updateVoiceAutoSpeakMetrics(metrics);
        const utteranceStartedAtMs = Date.now();
        let lastChunkEndedAtMs: number | null = null;
        let yieldedForTurnClose = false;
        for (let chunkIndex = 0; chunkIndex < utterance.chunks.length; chunkIndex += 1) {
          if (micArmStateRef.current !== "on") {
            metrics.cancelReason = "mic_off";
            break;
          }
          if (voiceAutoSpeakActiveUtteranceRef.current?.utteranceId !== utterance.utteranceId) {
            metrics.cancelReason = voiceAutoSpeakCancelReasonRef.current ?? "superseded_same_turn";
            break;
          }
          const waitStartMs = Date.now();
          while (micArmStateRef.current === "on") {
            const transcribeBusy =
              voiceBargeHoldActiveRef.current ||
              voiceTranscribeBusyRef.current ||
              voiceTranscribeQueueRef.current.length > 0 ||
              transcriptConfirmStateRef.current !== null;
            if (!transcribeBusy) break;
            if (Date.now() - waitStartMs >= VOICE_PLAYBACK_TRANSCRIBE_WAIT_MAX_MS) break;
            await new Promise<void>((resolve) => {
              setTimeout(resolve, VOICE_PLAYBACK_TRANSCRIBE_WAIT_POLL_MS);
            });
          }
          const turnCloseTrafficActive =
            voiceBargeHoldActiveRef.current ||
            voiceTranscribeBusyRef.current ||
            voiceTranscribeQueueRef.current.length > 0 ||
            transcriptConfirmStateRef.current !== null;
          const sinceLastSpeechMs =
            voiceLastSpeechMsRef.current !== null
              ? Math.max(0, Date.now() - voiceLastSpeechMsRef.current)
              : Number.POSITIVE_INFINITY;
          if (
            utterance.kind === "final" &&
            (turnCloseTrafficActive || sinceLastSpeechMs < VOICE_TURN_CLOSE_SILENCE_MS)
          ) {
            pushVoiceChunkTimelineEvent({
              kind: "chunk_drop",
              status: "suppressed",
              traceId: utterance.traceId ?? null,
              turnKey: utterance.turnKey,
              utteranceId: utterance.utteranceId,
              chunkIndex: null,
              chunkCount: null,
              detail: turnCloseTrafficActive
                ? "turn_close_guard:traffic_active"
                : "turn_close_guard:silence_window",
            });
            voiceAutoSpeakQueueRef.current.push(utterance);
            metrics.cancelReason = metrics.cancelReason ?? "barge_in";
            yieldedForTurnClose = true;
            break;
          }
          if (micArmStateRef.current !== "on") {
            metrics.cancelReason = "mic_off";
            break;
          }
          if (voiceAutoSpeakActiveUtteranceRef.current?.utteranceId !== utterance.utteranceId) {
            metrics.cancelReason = voiceAutoSpeakCancelReasonRef.current ?? "superseded_same_turn";
            break;
          }
          const chunk: VoicePlaybackChunk = {
            utteranceId: utterance.utteranceId,
            turnKey: utterance.turnKey,
            kind: utterance.kind,
            revision: utterance.revision,
            chunkIndex,
            chunkCount: utterance.chunks.length,
            text: utterance.chunks[chunkIndex] ?? "",
          };
          if (!chunk.text) continue;
          pushVoiceChunkTimelineEvent({
            kind: "chunk_synth_start",
            status: "running",
            traceId: utterance.traceId ?? null,
            turnKey: utterance.turnKey,
            utteranceId: utterance.utteranceId,
            chunkIndex: chunk.chunkIndex,
            chunkCount: chunk.chunkCount,
            text: chunk.text,
          });
          const currentController = new AbortController();
          voiceAutoSpeakAbortControllerRef.current = currentController;
          const nextChunk = utterance.chunks[chunkIndex + 1]
            ? {
                utteranceId: utterance.utteranceId,
                turnKey: utterance.turnKey,
                kind: utterance.kind,
                revision: utterance.revision,
                chunkIndex: chunkIndex + 1,
                chunkCount: utterance.chunks.length,
                text: utterance.chunks[chunkIndex + 1] ?? "",
              }
            : null;
          let nextController: AbortController | null = null;
          let nextFetch:
            | Promise<{
                ok: true;
                value: {
                  blob: Blob;
                  synthMs: number;
                  headers: {
                    provider: string | null;
                    profile: string | null;
                    cache: "hit" | "miss" | null;
                  };
                };
              } | {
                ok: false;
                error: unknown;
              }>
            | null = null;
          try {
            const currentResult = await synthesizeVoiceChunk({
              utterance,
              chunk,
              signal: currentController.signal,
            });
            if (voiceAutoSpeakAbortControllerRef.current === currentController) {
              voiceAutoSpeakAbortControllerRef.current = null;
            }
            metrics.synthDurationsMs.push(currentResult.synthMs);
            if (currentResult.headers.cache === "hit") metrics.cacheHitCount += 1;
            if (currentResult.headers.cache === "miss") metrics.cacheMissCount += 1;
            pushVoiceChunkTimelineEvent({
              kind: "chunk_synth_ok",
              status: "done",
              traceId: utterance.traceId ?? null,
              turnKey: utterance.turnKey,
              utteranceId: utterance.utteranceId,
              chunkIndex: chunk.chunkIndex,
              chunkCount: chunk.chunkCount,
              detail: `synth ${currentResult.synthMs}ms | cache ${currentResult.headers.cache ?? "n/a"}`,
            });
            metrics.providerHeader = currentResult.headers.provider ?? undefined;
            metrics.profileHeader = currentResult.headers.profile ?? undefined;
            if (metrics.enqueueToFirstAudioMs === null) {
              metrics.enqueueToFirstAudioMs = Math.max(0, Date.now() - utterance.enqueuedAtMs);
            }
            const pendingPreemptForUtterance =
              voicePendingPreemptRef.current &&
              voicePendingPreemptRef.current.turnKey === utterance.turnKey &&
              voicePendingPreemptRef.current.utteranceId === utterance.utteranceId;
            if (utterance.kind === "final" && nextChunk && nextChunk.text && !pendingPreemptForUtterance) {
              nextController = new AbortController();
              voiceAutoSpeakAbortControllerRef.current = nextController;
              nextFetch = synthesizeVoiceChunk({
                utterance,
                chunk: nextChunk,
                signal: nextController.signal,
              })
                .then((value) => ({
                  ok: true as const,
                  value,
                }))
                .catch((error: unknown) => ({
                  ok: false as const,
                  error,
                }));
            }
            const playStartedAtMs = Date.now();
            if (lastChunkEndedAtMs !== null) {
              metrics.chunkGapMs.push(Math.max(0, playStartedAtMs - lastChunkEndedAtMs));
            }
            pushVoiceChunkTimelineEvent({
              kind: "chunk_play_start",
              status: "running",
              traceId: utterance.traceId ?? null,
              turnKey: utterance.turnKey,
              utteranceId: utterance.utteranceId,
              chunkIndex: chunk.chunkIndex,
              chunkCount: chunk.chunkCount,
            });
            await playVoiceAudioBlob({ blob: currentResult.blob, awaitPlayback: true });
            lastChunkEndedAtMs = Date.now();
            pushVoiceChunkTimelineEvent({
              kind: "chunk_play_end",
              status: "done",
              atMs: lastChunkEndedAtMs,
              traceId: utterance.traceId ?? null,
              turnKey: utterance.turnKey,
              utteranceId: utterance.utteranceId,
              chunkIndex: chunk.chunkIndex,
              chunkCount: chunk.chunkCount,
            });
            if (voiceAutoSpeakCancelReasonRef.current) {
              metrics.cancelReason = metrics.cancelReason ?? voiceAutoSpeakCancelReasonRef.current;
              break;
            }
            if (voiceAutoSpeakActiveUtteranceRef.current?.utteranceId !== utterance.utteranceId) {
              metrics.cancelReason = metrics.cancelReason ?? "superseded_same_turn";
              break;
            }
            const pendingAfterChunk = voicePendingPreemptRef.current;
            if (
              pendingAfterChunk &&
              pendingAfterChunk.turnKey === utterance.turnKey &&
              pendingAfterChunk.utteranceId === utterance.utteranceId
            ) {
              metrics.cancelReason = mapVoicePreemptPolicyToCancelReason(pendingAfterChunk.policy);
              recordVoiceDivergenceEvent({
                code: "preempt_applied",
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                revision: utterance.revision,
                detail: pendingAfterChunk.policy,
              });
              clearVoicePendingPreempt();
              break;
            }
            if (isVoiceUtteranceRevisionStale({
              turnKey: utterance.turnKey,
              revision: utterance.revision,
              kind: utterance.kind,
            })) {
              metrics.cancelReason = metrics.cancelReason ?? "superseded_same_turn";
              recordVoiceDivergenceEvent({
                code: "stale_revision_dropped",
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                revision: utterance.revision,
                detail: "dropped after chunk boundary",
                uiVoiceRevisionMatch: false,
              });
              break;
            }
            if (nextFetch && nextController && nextChunk) {
              const prefetchedSettled = await nextFetch;
              if (voiceAutoSpeakAbortControllerRef.current === nextController) {
                voiceAutoSpeakAbortControllerRef.current = null;
              }
              if (!prefetchedSettled.ok) {
                throw prefetchedSettled.error;
              }
              const prefetched = prefetchedSettled.value;
              metrics.synthDurationsMs.push(prefetched.synthMs);
              if (prefetched.headers.cache === "hit") metrics.cacheHitCount += 1;
              if (prefetched.headers.cache === "miss") metrics.cacheMissCount += 1;
              pushVoiceChunkTimelineEvent({
                kind: "chunk_synth_ok",
                status: "done",
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: nextChunk.chunkIndex,
                chunkCount: nextChunk.chunkCount,
                detail: `prefetch synth ${prefetched.synthMs}ms | cache ${prefetched.headers.cache ?? "n/a"}`,
              });
              metrics.providerHeader = prefetched.headers.provider ?? metrics.providerHeader;
              metrics.profileHeader = prefetched.headers.profile ?? metrics.profileHeader;
              if (metrics.enqueueToFirstAudioMs === null) {
                metrics.enqueueToFirstAudioMs = Math.max(0, Date.now() - utterance.enqueuedAtMs);
              }
              const prefetchedPlayStartMs = Date.now();
              if (lastChunkEndedAtMs !== null) {
                metrics.chunkGapMs.push(Math.max(0, prefetchedPlayStartMs - lastChunkEndedAtMs));
              }
              pushVoiceChunkTimelineEvent({
                kind: "chunk_play_start",
                status: "running",
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: nextChunk.chunkIndex,
                chunkCount: nextChunk.chunkCount,
                detail: "prefetched",
              });
              await playVoiceAudioBlob({ blob: prefetched.blob, awaitPlayback: true });
              lastChunkEndedAtMs = Date.now();
              pushVoiceChunkTimelineEvent({
                kind: "chunk_play_end",
                status: "done",
                atMs: lastChunkEndedAtMs,
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: nextChunk.chunkIndex,
                chunkCount: nextChunk.chunkCount,
                detail: "prefetched",
              });
              if (voiceAutoSpeakCancelReasonRef.current) {
                metrics.cancelReason = metrics.cancelReason ?? voiceAutoSpeakCancelReasonRef.current;
                break;
              }
              if (voiceAutoSpeakActiveUtteranceRef.current?.utteranceId !== utterance.utteranceId) {
                metrics.cancelReason = metrics.cancelReason ?? "superseded_same_turn";
                break;
              }
              const pendingAfterPrefetchChunk = voicePendingPreemptRef.current;
              if (
                pendingAfterPrefetchChunk &&
                pendingAfterPrefetchChunk.turnKey === utterance.turnKey &&
                pendingAfterPrefetchChunk.utteranceId === utterance.utteranceId
              ) {
                metrics.cancelReason = mapVoicePreemptPolicyToCancelReason(pendingAfterPrefetchChunk.policy);
                recordVoiceDivergenceEvent({
                  code: "preempt_applied",
                  turnKey: utterance.turnKey,
                  utteranceId: utterance.utteranceId,
                  revision: utterance.revision,
                  detail: `${pendingAfterPrefetchChunk.policy} (prefetched)`,
                });
                clearVoicePendingPreempt();
                break;
              }
              if (isVoiceUtteranceRevisionStale({
                turnKey: utterance.turnKey,
                revision: utterance.revision,
                kind: utterance.kind,
              })) {
                metrics.cancelReason = metrics.cancelReason ?? "superseded_same_turn";
                recordVoiceDivergenceEvent({
                  code: "stale_revision_dropped",
                  turnKey: utterance.turnKey,
                  utteranceId: utterance.utteranceId,
                  revision: utterance.revision,
                  detail: "dropped after prefetched chunk boundary",
                  uiVoiceRevisionMatch: false,
                });
                break;
              }
              chunkIndex += 1;
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (/abort|signal is aborted without reason/i.test(message)) {
              pushVoiceChunkTimelineEvent({
                kind: "chunk_drop",
                status: "cancelled",
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: chunk.chunkIndex,
                chunkCount: chunk.chunkCount,
                detail: message,
              });
              metrics.cancelReason = metrics.cancelReason ?? voiceAutoSpeakCancelReasonRef.current ?? "barge_in";
            } else if (/^voice_auto_speak_suppressed:/i.test(message)) {
              pushVoiceChunkTimelineEvent({
                kind: "chunk_drop",
                status: "suppressed",
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: chunk.chunkIndex,
                chunkCount: chunk.chunkCount,
                detail: message,
              });
              metrics.cancelReason = metrics.cancelReason ?? voiceAutoSpeakCancelReasonRef.current;
            } else {
              pushVoiceChunkTimelineEvent({
                kind: "chunk_synth_error",
                status: "failed",
                traceId: utterance.traceId ?? null,
                turnKey: utterance.turnKey,
                utteranceId: utterance.utteranceId,
                chunkIndex: chunk.chunkIndex,
                chunkCount: chunk.chunkCount,
                detail: message,
              });
              metrics.cancelReason = metrics.cancelReason ?? "error";
            }
            break;
          }
        }
        metrics.totalPlaybackMs = Math.max(0, Date.now() - utteranceStartedAtMs);
        updateVoiceAutoSpeakMetrics(metrics);
        updateVoiceTurnRevisionState(utterance.turnKey, (current) => ({
          ...current,
          activeUtteranceRevision: null,
        }));
        voiceAutoSpeakActiveUtteranceRef.current = null;
        voiceAutoSpeakCancelReasonRef.current = null;
        if (yieldedForTurnClose) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, VOICE_PLAYBACK_TRANSCRIBE_WAIT_POLL_MS);
          });
          break;
        }
      }
    } finally {
      clearVoicePendingPreempt();
      voiceAutoSpeakRunningRef.current = false;
      voiceAutoSpeakAbortControllerRef.current = null;
      voiceAutoSpeakActiveUtteranceRef.current = null;
      voiceAutoSpeakCancelReasonRef.current = null;
    }
  }, [
    clearVoicePendingPreempt,
    isVoiceUtteranceRevisionStale,
    playVoiceAudioBlob,
    pushVoiceChunkTimelineEvent,
    recordVoiceDivergenceEvent,
    synthesizeVoiceChunk,
    updateVoiceAutoSpeakMetrics,
    updateVoiceTurnRevisionState,
  ]);

  const enqueueVoiceAutoSpeakTask = useCallback(
    (task: VoiceAutoSpeakTask): boolean => {
      if (micArmStateRef.current !== "on") return false;
      if (task.kind === "final" && voiceSuppressedFinalTurnKeysRef.current.has(task.turnKey)) {
        return false;
      }
      updateVoiceTurnRevisionState(task.turnKey, (current) => ({
        ...current,
        latestRevision: Math.max(current.latestRevision, task.revision),
        latestBriefRevision:
          task.kind === "brief"
            ? Math.max(current.latestBriefRevision, task.revision)
            : current.latestBriefRevision,
        latestFinalRevision:
          task.kind === "final"
            ? Math.max(current.latestFinalRevision, task.revision)
            : current.latestFinalRevision,
      }));
      if (isVoiceUtteranceRevisionStale({
        turnKey: task.turnKey,
        revision: task.revision,
        kind: task.kind,
      })) {
        recordVoiceDivergenceEvent({
          code: "stale_revision_dropped",
          turnKey: task.turnKey,
          utteranceId: task.key,
          revision: task.revision,
          detail: `${task.kind} dropped before enqueue`,
          uiVoiceRevisionMatch: false,
        });
        return false;
      }
      const text = buildSpeakText(task.text, HELIX_VOICE_AUTO_SPEAK_TEXT_MAX_CHARS);
      if (!text) return false;
      const nextUtterance = createVoicePlaybackUtterance({
        utteranceId: task.key,
        turnKey: task.turnKey,
        kind: task.kind,
        revision: task.revision,
        text,
        traceId: task.traceId,
        eventId: task.eventId,
      });
      if (nextUtterance.chunks.length === 0) {
        return false;
      }
      const duplicateQueued = voiceAutoSpeakQueueRef.current.some(
        (entry) =>
          entry.turnKey === nextUtterance.turnKey &&
          entry.kind === nextUtterance.kind &&
          entry.revision === nextUtterance.revision &&
          entry.text === nextUtterance.text,
      );
      const duplicateActive =
        voiceAutoSpeakActiveUtteranceRef.current &&
        voiceAutoSpeakActiveUtteranceRef.current.turnKey === nextUtterance.turnKey &&
        voiceAutoSpeakActiveUtteranceRef.current.kind === nextUtterance.kind &&
        voiceAutoSpeakActiveUtteranceRef.current.revision === nextUtterance.revision &&
        voiceAutoSpeakActiveUtteranceRef.current.text === nextUtterance.text;
      if (duplicateQueued || duplicateActive) {
        return false;
      }
      const nextQueue = applyLatestWinsVoiceQueue({
        queue: voiceAutoSpeakQueueRef.current,
        incoming: nextUtterance,
        active: voiceAutoSpeakActiveUtteranceRef.current,
      });
      const trimmedQueue = trimVoicePlaybackQueue(nextQueue.queue, HELIX_VOICE_AUTO_SPEAK_QUEUE_MAX);
      const staleDropped: string[] = [];
      const filteredQueue = trimmedQueue.queue.filter((entry) => {
        const stale = isVoiceUtteranceRevisionStale({
          turnKey: entry.turnKey,
          revision: entry.revision,
          kind: entry.kind,
        });
        if (stale) staleDropped.push(entry.utteranceId);
        return !stale;
      });
      voiceAutoSpeakQueueRef.current = filteredQueue;
      const accepted = filteredQueue.some((entry) => entry.utteranceId === nextUtterance.utteranceId);
      if (!accepted) {
        return false;
      }
      pushVoiceChunkTimelineEvent({
        kind: "chunk_enqueue",
        status: "queued",
        traceId: task.traceId ?? null,
        turnKey: nextUtterance.turnKey,
        utteranceId: nextUtterance.utteranceId,
        chunkCount: nextUtterance.chunks.length,
        text: nextUtterance.text,
        detail: `${nextUtterance.kind}@r${nextUtterance.revision}`,
      });
      const droppedIds = [...nextQueue.droppedUtteranceIds, ...trimmedQueue.droppedUtteranceIds, ...staleDropped];
      if (droppedIds.length > 0) {
        const droppedId = droppedIds[droppedIds.length - 1] ?? null;
        pushVoiceChunkTimelineEvent({
          kind: "chunk_drop",
          status: "suppressed",
          traceId: task.traceId ?? null,
          turnKey: task.turnKey,
          utteranceId: droppedId,
          chunkCount: droppedIds.length,
          detail: `${droppedIds.length} queued utterance(s) dropped`,
        });
        recordVoiceDivergenceEvent({
          code: "stale_revision_dropped",
          turnKey: task.turnKey,
          utteranceId: droppedId,
          revision: task.revision,
          detail: `${droppedIds.length} queued utterance(s) dropped`,
          uiVoiceRevisionMatch: false,
        });
      }
      if (
        nextQueue.pendingPreemptPolicy !== "none" &&
        voiceAutoSpeakActiveUtteranceRef.current
      ) {
        setVoicePendingPreempt({
          policy: nextQueue.pendingPreemptPolicy,
          activeUtterance: voiceAutoSpeakActiveUtteranceRef.current,
          incomingUtterance: nextUtterance,
        });
      }
      if (
        shouldInterruptForSupersededReason(
          nextQueue.supersededActiveReason,
          Boolean(playbackAudioRef.current),
        )
      ) {
        stopReadAloud(nextQueue.supersededActiveReason ?? undefined);
      }
      void runVoiceAutoSpeakQueue();
      return true;
    },
    [
      isVoiceUtteranceRevisionStale,
      recordVoiceDivergenceEvent,
      runVoiceAutoSpeakQueue,
      setVoicePendingPreempt,
      stopReadAloud,
      pushVoiceChunkTimelineEvent,
      updateVoiceTurnRevisionState,
    ],
  );

  const scheduleVoiceAutoSpeakBrief = useCallback(
    (entry: HelixTimelineEntry) => {
      if (entry.source !== "voice_auto" || micArmStateRef.current !== "on") return;
      const lifecycle =
        typeof entry.meta?.decisionLifecycle === "string"
          ? (entry.meta.decisionLifecycle as VoiceDecisionLifecycle)
          : undefined;
      const artifactGuardRestart = entry.meta?.artifactGuardRestart === true;
      const turnKey = entry.traceId ?? entry.attemptId ?? entry.id;
      const decisionSentence =
        typeof entry.meta?.decisionSentence === "string" ? String(entry.meta.decisionSentence).trim() : "";
      const routeReasonCode =
        typeof entry.meta?.routeReasonCode === "string" ? String(entry.meta.routeReasonCode) : null;
      const failReasonRaw =
        typeof entry.meta?.failReasonRaw === "string" ? String(entry.meta.failReasonRaw) : null;
      const shouldSpeakLifecycle = shouldAutoSpeakVoiceDecisionLifecycle(lifecycle, {
        routeReasonCode,
        failReasonRaw,
      });
      if (!shouldSpeakLifecycle) return;
      const assemblerSnapshot = getVoiceTurnAssemblerState(turnKey);
      const transcriptRevision =
        typeof entry.meta?.transcriptRevision === "number" && Number.isFinite(entry.meta.transcriptRevision)
          ? Math.max(0, Math.floor(entry.meta.transcriptRevision))
          : assemblerSnapshot?.transcriptRevision ??
            voiceTurnRevisionStateRef.current[turnKey]?.latestTranscriptRevision ??
            0;
      const spokenRevision = assemblerSnapshot?.briefSpokenRevision ?? 0;
      if (
        lifecycle === "queued" &&
        artifactGuardRestart &&
        transcriptRevision > 0 &&
        spokenRevision === transcriptRevision
      ) {
        return;
      }
      if (lifecycle) {
        const map = voiceBriefSpokenLifecycleByTurnRef.current;
        map.set(turnKey, lifecycle);
        if (map.size > 256) {
          const oldestKey = map.keys().next().value;
          if (typeof oldestKey === "string" && oldestKey) {
            map.delete(oldestKey);
          }
        }
      }
      const continuityMerged = entry.meta?.continuityMerged === true;
      if (lifecycle === "queued" || lifecycle === "running") {
        if (transcriptRevision > 0 && spokenRevision === transcriptRevision) {
          return;
        }
      }
      const textForSpeech =
        lifecycle === "queued"
          ? buildQueuedVoiceSpeechText({
              entryText: entry.text,
              decisionSentence:
                decisionSentence || "I am thinking through this in the background.",
              continuityMerged,
            })
          : lifecycle === "running"
            ? buildRunningVoiceSpeechText({
                entryText: entry.text,
                decisionSentence:
                  decisionSentence || "Reasoning is running in the background.",
              })
          : lifecycle === "suppressed" || lifecycle === "failed"
            ? buildSuppressedVoiceSpeechText({
                entryText: entry.text,
                decisionSentence: decisionSentence || entry.text,
                routeReasonCode,
                failReasonRaw,
              })
            : decisionSentence || entry.text;
      if ((lifecycle === "queued" || lifecycle === "running") && isGenericQueuedVoiceAcknowledgement(textForSpeech)) {
        return;
      }
      const revision = bumpVoiceTurnRevision(turnKey, "brief");
      const task: VoiceAutoSpeakTask = {
        key: buildVoiceAutoSpeakUtteranceId([
          "brief",
          entry.traceId ?? entry.attemptId ?? entry.id,
          lifecycle,
          entry.id,
        ]),
        kind: "brief",
        turnKey,
        revision: revision.revision,
        text: textForSpeech,
        traceId: entry.traceId,
        eventId: entry.id,
      };
      const accepted = enqueueVoiceAutoSpeakTask(task);
      if (accepted && (lifecycle === "queued" || lifecycle === "running") && transcriptRevision > 0) {
        updateVoiceTurnAssemblerState(turnKey, (current) => ({
          ...current,
          briefSpokenRevision: transcriptRevision,
        }));
      }
    },
    [
      bumpVoiceTurnRevision,
      enqueueVoiceAutoSpeakTask,
      getVoiceTurnAssemblerState,
      updateVoiceTurnAssemblerState,
    ],
  );

  const suppressVoiceFinalForTurn = useCallback((turnKey: string | null | undefined): void => {
    if (!turnKey) return;
    const suppressed = voiceSuppressedFinalTurnKeysRef.current;
    suppressed.add(turnKey);
    if (suppressed.size > 64) {
      const oldest = suppressed.values().next().value;
      if (typeof oldest === "string" && oldest) {
        suppressed.delete(oldest);
      }
    }
  }, []);

  const suppressVoiceFinalsForActiveTurns = useCallback(
    (heldTurnKey?: string | null) => {
      suppressVoiceFinalForTurn(heldTurnKey);
      for (const attempt of reasoningAttemptsRef.current) {
        if (attempt.source !== "voice_auto") continue;
        if (!attempt.traceId || attempt.traceId === heldTurnKey) continue;
        if (
          attempt.status === "queued" ||
          attempt.status === "running" ||
          attempt.status === "streaming"
        ) {
          suppressVoiceFinalForTurn(attempt.traceId);
        }
      }
    },
    [suppressVoiceFinalForTurn],
  );

  const pausePlaybackForPotentialBargeIn = useCallback((): boolean => {
    const activeUtterance = voiceAutoSpeakActiveUtteranceRef.current;
    const currentAudio = playbackAudioRef.current;
    const hasActiveAudio = Boolean(currentAudio && !currentAudio.paused);
    if (!activeUtterance && !hasActiveAudio) {
      return false;
    }
    voiceBargeHoldTurnKeyRef.current = activeUtterance?.turnKey ?? null;
    voiceBargeHoldActiveRef.current = true;
    voiceBargeHoldStartedAtMsRef.current = Date.now();
    voiceBargeResumeNotBeforeMsRef.current = null;
    if (!currentAudio || currentAudio.paused) return true;
    try {
      currentAudio.pause();
      return true;
    } catch {
      return true;
    }
  }, []);

  const resolveBargeInFromTranscription = useCallback(
    (resolved: boolean) => {
      if (!voiceBargeHoldActiveRef.current) return;
      const heldTurnKey = voiceBargeHoldTurnKeyRef.current;
      if (resolved) {
        voiceBargeHoldActiveRef.current = false;
        voiceBargeHoldTurnKeyRef.current = null;
        voiceBargeHoldStartedAtMsRef.current = null;
        voiceBargeResumeNotBeforeMsRef.current = null;
        voiceBargeTrafficQuietUntilMsRef.current = null;
        suppressVoiceFinalsForActiveTurns(heldTurnKey);
        stopReadAloud("barge_in");
        return;
      }
      const now = Date.now();
      voiceBargeResumeNotBeforeMsRef.current = now + VOICE_BARGE_RESUME_GRACE_MS;
      const quietUntilCandidate = now + VOICE_BARGE_TRAFFIC_BUFFER_MS;
      const currentQuietUntil = voiceBargeTrafficQuietUntilMsRef.current ?? 0;
      if (quietUntilCandidate > currentQuietUntil) {
        voiceBargeTrafficQuietUntilMsRef.current = quietUntilCandidate;
      }
    },
    [stopReadAloud, suppressVoiceFinalsForActiveTurns],
  );

  const handleReadAloud = useCallback(
    async (reply: HelixAskReply) => {
      const text = buildCopyText(reply);
      if (!text) return;
      try {
        await primeVoiceAudioPlayback();
        await requestVoicePlayback({
          text,
          eventId: reply.id,
          markReplyId: reply.id,
        });
      } catch {
        // requestVoicePlayback handles state cleanup for manual read aloud.
      }
    },
    [buildCopyText, primeVoiceAudioPlayback, requestVoicePlayback],
  );

  useEffect(() => {
    if (micArmState !== "off") return;
    voiceAutoSpeakQueueRef.current = [];
    voiceAutoSpeakActiveUtteranceRef.current = null;
    voiceAutoSpeakCancelReasonRef.current = "mic_off";
    voiceSuppressedFinalTurnKeysRef.current.clear();
    voiceBriefSpokenLifecycleByTurnRef.current.clear();
    voiceQueuedSpeechLatchByTurnRef.current.clear();
    voiceRunningSpeechLatchByTurnRef.current.clear();
    voiceTurnRevisionStateRef.current = {};
    intentRevisionByTurnKeyRef.current = {};
    voiceTurnAssemblerByTurnKeyRef.current = {};
    voiceActiveAssemblerTurnKeyRef.current = null;
    clearVoiceSealPollTimer();
    clearHeldTranscriptState();
    setTranscriptConfirmState(null);
    voiceDivergenceEventsRef.current = [];
    voiceBargeResumeNotBeforeMsRef.current = null;
    voiceBargeTrafficQuietUntilMsRef.current = null;
    voiceBargeHoldTurnKeyRef.current = null;
    voiceBargeHoldStartedAtMsRef.current = null;
    stopReadAloud("mic_off");
  }, [clearHeldTranscriptState, clearVoiceSealPollTimer, micArmState, stopReadAloud]);

  const handleOpenConversationPanel = useCallback(() => {
    const sessionId = getHelixAskSessionId();
    if (!sessionId) return;
    setActive(sessionId);
    onOpenConversation?.(sessionId);
  }, [getHelixAskSessionId, onOpenConversation, setActive]);

  const resizeTextarea = useCallback((target?: HTMLTextAreaElement | null) => {
    const el = target ?? askInputRef.current;
    if (!el || typeof window === "undefined") return;
    el.style.height = "auto";
    const styles = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(styles.lineHeight || "20");
    const paddingTop = Number.parseFloat(styles.paddingTop || "0");
    const paddingBottom = Number.parseFloat(styles.paddingBottom || "0");
    const maxHeight = lineHeight * HELIX_ASK_MAX_PROMPT_LINES + paddingTop + paddingBottom;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  const syncAskDraftValue = useCallback(
    (
      nextValue: string,
      options?: {
        target?: HTMLTextAreaElement | null;
        focus?: boolean;
        forceMoodHint?: boolean;
      },
    ) => {
      const input = options?.target ?? askInputRef.current;
      if (input) {
        input.value = nextValue;
        if (options?.focus) {
          input.focus();
          const cursor = input.value.length;
          input.setSelectionRange(cursor, cursor);
        }
        resizeTextarea(input);
        input.scrollTop = input.scrollHeight;
      }
      askDraftRef.current = nextValue;
      const contextCapsuleIds = extractContextCapsuleIdsFromText(nextValue);
      setContextCapsuleDetectedId(contextCapsuleIds[0] ?? null);
      if (voiceInputError) {
        setVoiceInputError(null);
        if (voiceInputState === "error") {
          setVoiceInputState("listening");
        }
      }
      if (askBusy) return;
      clearMoodTimer();
      const trimmed = nextValue.trim();
      if (!trimmed) return;
      if (options?.forceMoodHint) {
        updateMoodFromText(trimmed);
        requestMoodHint(trimmed, { force: true });
        return;
      }
      askMoodTimerRef.current = window.setTimeout(() => {
        askMoodTimerRef.current = null;
        const latest = askDraftRef.current.trim();
        if (!latest) return;
        updateMoodFromText(latest);
        requestMoodHint(latest);
      }, 900);
    },
    [
      askBusy,
      clearMoodTimer,
      requestMoodHint,
      resizeTextarea,
      updateMoodFromText,
      voiceInputError,
      voiceInputState,
    ],
  );

  const setVoiceWarning = useCallback((code: VoiceCaptureWarningCode, active: boolean) => {
    setVoiceCaptureWarnings((prev) => {
      const hasCode = prev.includes(code);
      if (active) {
        return hasCode ? prev : [...prev, code];
      }
      if (!hasCode) return prev;
      return prev.filter((entry) => entry !== code);
    });
  }, []);

  const markVoiceCheckpoint = useCallback(
    (
      key: VoiceCaptureCheckpointKey,
      status: VoiceCaptureCheckpointStatus,
      message?: string,
      latencyMs?: number | null,
    ) => {
      setVoiceCaptureCheckpoints((prev) => {
        const existing = prev[key];
        const nextMessage = message ?? existing.message;
        const nextLatencyMs = latencyMs ?? existing.latencyMs;
        return {
          ...prev,
          [key]: {
            ...existing,
            status,
            message: nextMessage ?? null,
            latencyMs: nextLatencyMs ?? null,
            lastAtMs: Date.now(),
          },
        };
      });
    },
    [],
  );

  const hardCutVoicePlaybackForBargeIn = useCallback(
    (reason: VoiceBargeHardCutReason) => {
      if (!voiceBargeHoldActiveRef.current) return;
      const heldTurnKey = voiceBargeHoldTurnKeyRef.current;
      const activeUtterance = voiceAutoSpeakActiveUtteranceRef.current;
      if (!activeUtterance && !heldTurnKey) {
        voiceBargeHoldActiveRef.current = false;
        voiceBargeHoldTurnKeyRef.current = null;
        voiceBargeHoldStartedAtMsRef.current = null;
        voiceBargeResumeNotBeforeMsRef.current = null;
        return;
      }
      const suppressFinals =
        reason === "stt_queue" || reason === "stt_busy" || reason === "pending_confirmation";
      if (suppressFinals) {
        suppressVoiceFinalsForActiveTurns(heldTurnKey);
      }
      pushVoiceChunkTimelineEvent({
        kind: "chunk_drop",
        status: "suppressed",
        traceId: activeUtterance?.traceId ?? null,
        turnKey: heldTurnKey,
        utteranceId: activeUtterance?.utteranceId ?? null,
        detail: `barge_in_hard_cut:${reason}${suppressFinals ? ":finals_suppressed" : ":playback_only"}`,
      });
      markVoiceCheckpoint("dispatch_suppressed", "ok", `Barge-in hard cut (${reason}).`);
      voiceBargeHoldActiveRef.current = false;
      voiceBargeHoldTurnKeyRef.current = null;
      voiceBargeHoldStartedAtMsRef.current = null;
      voiceBargeResumeNotBeforeMsRef.current = null;
      stopReadAloud("barge_in");
    },
    [markVoiceCheckpoint, pushVoiceChunkTimelineEvent, stopReadAloud, suppressVoiceFinalsForActiveTurns],
  );

  const addVoiceSegmentAttempt = useCallback((segment: VoiceSegmentAttempt) => {
    setVoiceSegmentAttempts((prev) => [segment, ...prev].slice(0, 5));
  }, []);

  const patchVoiceSegmentAttempt = useCallback(
    (segmentId: string, patch: Partial<VoiceSegmentAttempt>) => {
      setVoiceSegmentAttempts((prev) =>
        prev.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment)),
      );
    },
    [],
  );

  const rememberConversationTurn = useCallback((entry: string) => {
    const trimmed = entry.trim();
    if (!trimmed) return;
    conversationRecentTurnsRef.current = [...conversationRecentTurnsRef.current, trimmed].slice(-8);
  }, []);

  const addHelixTimelineEntry = useCallback(
    (input: Omit<HelixTimelineEntry, "id" | "createdAtMs" | "updatedAtMs">): HelixTimelineEntry => {
      const now = Date.now();
      const entry: HelixTimelineEntry = {
        ...input,
        id: `timeline:${crypto.randomUUID()}`,
        createdAtMs: now,
        updatedAtMs: now,
      };
      setHelixTimeline((prev) => [entry, ...prev].slice(0, 120));
      return entry;
    },
    [],
  );

  const replaceVoiceConversationTimelineEntry = useCallback(
    (
      input: Omit<HelixTimelineEntry, "id" | "createdAtMs" | "updatedAtMs"> & {
        type: "conversation_recorded" | "conversation_brief";
        source: "voice_auto";
      },
    ): HelixTimelineEntry => {
      const now = Date.now();
      const entry: HelixTimelineEntry = {
        ...input,
        id: `timeline:${crypto.randomUUID()}`,
        createdAtMs: now,
        updatedAtMs: now,
      };
      setHelixTimeline((prev) => {
        const filtered = prev.filter(
          (existing) => !(existing.source === "voice_auto" && existing.type === input.type),
        );
        return [entry, ...filtered].slice(0, 120);
      });
      return entry;
    },
    [],
  );

  const updateVoiceDecisionBrief = useCallback(
    (input: {
      baseBrief: string;
      lifecycle: VoiceDecisionLifecycle;
      mode?: "observe" | "act" | "verify" | "clarify";
      routeReasonCode?: string | null;
      failReasonRaw?: string | null;
      traceId?: string;
      escalatedMode?: "verify" | "act";
      status?: HelixTimelineEntry["status"];
      meta?: Record<string, unknown>;
    }): HelixTimelineEntry => {
      const sanitizedBaseBrief = sanitizeConversationBriefTextForVoice(input.baseBrief, 560);
      const turnKey =
        input.traceId ??
        (typeof input.meta?.attemptId === "string" ? String(input.meta.attemptId) : null) ??
        null;
      let resolvedBaseBrief = sanitizedBaseBrief;
      const transcriptHint =
        typeof input.meta?.transcript === "string"
          ? sanitizeConversationBriefTextForVoice(String(input.meta.transcript), 220)
          : "";
      const transcriptRevision =
        typeof input.meta?.transcriptRevision === "number" &&
        Number.isFinite(input.meta.transcriptRevision)
          ? Math.max(0, Math.floor(input.meta.transcriptRevision))
          : null;
      if (turnKey && (input.lifecycle === "queued" || input.lifecycle === "running")) {
        const pinnedBriefs = voicePinnedBriefByTurnRef.current;
        const pinned = pinnedBriefs.get(turnKey);
        const pinnedMatchesRevision =
          Boolean(pinned) &&
          (transcriptRevision === null ||
            pinned?.transcriptRevision === null ||
            pinned?.transcriptRevision === transcriptRevision);
        if (pinned && pinnedMatchesRevision) {
          if (isPinnedVoiceBriefCandidate(sanitizedBaseBrief) && !isPinnedVoiceBriefCandidate(pinned.text)) {
            pinnedBriefs.set(turnKey, {
              text: sanitizedBaseBrief,
              transcriptRevision,
            });
            resolvedBaseBrief = sanitizedBaseBrief;
          } else {
            resolvedBaseBrief = pinned.text;
          }
        } else if (pinned && !pinnedMatchesRevision) {
          // New transcript revision for the same turn; never reuse an older pinned brief.
          pinnedBriefs.delete(turnKey);
        } else if (isPinnedVoiceBriefCandidate(sanitizedBaseBrief)) {
          pinnedBriefs.set(turnKey, {
            text: sanitizedBaseBrief,
            transcriptRevision,
          });
        }
        if (pinnedBriefs.size > 256) {
          const oldestKey = pinnedBriefs.keys().next().value;
          if (typeof oldestKey === "string" && oldestKey) {
            pinnedBriefs.delete(oldestKey);
          }
        }
      }
      if ((input.lifecycle === "queued" || input.lifecycle === "running") && isGenericQueuedVoiceAcknowledgement(resolvedBaseBrief)) {
        resolvedBaseBrief = transcriptHint ? buildDeterministicQueuedBriefFromTranscript(transcriptHint) : "";
      }
      if (
        input.lifecycle === "queued" || input.lifecycle === "running"
      ) {
        const predictiveBrief =
          transcriptHint ? buildPredictiveBriefFromTranscript(transcriptHint) : "";
        const deterministicBrief =
          transcriptHint ? buildDeterministicQueuedBriefFromTranscript(transcriptHint) : "";
        if (transcriptHint) {
          resolvedBaseBrief = predictiveBrief || deterministicBrief || resolvedBaseBrief;
        }
        if (turnKey && resolvedBaseBrief) {
          voicePinnedBriefByTurnRef.current.set(turnKey, {
            text: resolvedBaseBrief,
            transcriptRevision,
          });
        }
      }
      if (
        turnKey &&
        (input.lifecycle === "done" ||
          input.lifecycle === "failed" ||
          input.lifecycle === "suppressed" ||
          input.lifecycle === "escalated")
      ) {
        voicePinnedBriefByTurnRef.current.delete(turnKey);
      }
      const decisionSentence = formatVoiceDecisionSentence({
        lifecycle: input.lifecycle,
        mode: input.mode,
        routeReasonCode: input.routeReasonCode,
        escalatedMode: input.escalatedMode,
        failureReasonRaw: input.failReasonRaw,
      });
      const composedBrief =
        input.lifecycle === "queued" || input.lifecycle === "running"
          ? clipText((resolvedBaseBrief || decisionSentence).trim(), 640)
          : composeVoiceBriefWithDecision(resolvedBaseBrief, decisionSentence);
      const status: HelixTimelineEntry["status"] =
        input.status ??
        (input.lifecycle === "queued"
          ? "queued"
          : input.lifecycle === "running" || input.lifecycle === "escalated"
            ? "running"
            : input.lifecycle === "suppressed"
              ? "suppressed"
              : input.lifecycle === "failed"
                ? "failed"
                : "done");
      const timelineEntry = replaceVoiceConversationTimelineEntry({
        type: "conversation_brief",
        source: "voice_auto",
        status,
        text: clipText(composedBrief, 560),
        detail: decisionSentence,
        mode: input.mode,
        traceId: input.traceId,
        meta: {
          ...(input.meta ?? {}),
          decisionLifecycle: input.lifecycle,
          decisionSentence,
          routeReasonCode: input.routeReasonCode ?? null,
          failReasonRaw: input.failReasonRaw ?? null,
          escalatedMode: input.escalatedMode ?? null,
        },
      });
      scheduleVoiceAutoSpeakBrief(timelineEntry);
      return timelineEntry;
    },
    [replaceVoiceConversationTimelineEntry, scheduleVoiceAutoSpeakBrief],
  );

  const patchHelixTimelineEntry = useCallback((entryId: string, patch: Partial<HelixTimelineEntry>) => {
    setHelixTimeline((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              ...patch,
              updatedAtMs: Date.now(),
            }
          : entry,
      ),
    );
  }, []);

  const formatReasoningAttemptDetail = useCallback(
    (attempt: Pick<ReasoningAttempt, "mode">, fallback: string | null): string | null => {
      const parts: string[] = [];
      if (attempt.mode) {
        parts.push(`mode:${attempt.mode}`);
      }
      if (parts.length > 0) return parts.join(" | ");
      return fallback;
    },
    [],
  );

  const ensureReasoningTimelineEntry = useCallback(
    (attempt: ReasoningAttempt, status?: HelixTimelineEntry["status"]) => {
      const existingId = reasoningTimelineEntryByAttemptIdRef.current[attempt.id];
      if (existingId) {
        if (status) {
          patchHelixTimelineEntry(existingId, { status });
        }
        return existingId;
      }
      const timelineEntry = addHelixTimelineEntry({
        type: "reasoning_attempt",
        source: attempt.source,
        status: status ?? (attempt.status === "suppressed" ? "suppressed" : "queued"),
        text: clipText(attempt.prompt, 300),
        detail: formatReasoningAttemptDetail(attempt, null),
        mode: attempt.mode,
        traceId: attempt.traceId,
        attemptId: attempt.id,
        meta: {
          profile: attempt.profile ?? null,
          completionScore: attempt.completionScore ?? null,
          floorOwner: attempt.floorOwner ?? null,
          contextCapsuleCount: attempt.contextCapsuleCount ?? null,
          contextCapsulePinnedCount: attempt.contextCapsulePinnedCount ?? null,
          contextCapsuleIds: attempt.contextCapsuleIds ?? [],
          routeReasonCode: attempt.routeReasonCode ?? null,
          explorationTurn: attempt.explorationTurn ?? false,
          explorationAttemptCount: attempt.explorationAttemptCount ?? null,
          intentRevision: attempt.intentRevision ?? null,
          transcriptRevision: attempt.transcriptRevision ?? null,
          sealToken: attempt.sealToken ?? null,
          intentShiftScore: attempt.intentShiftScore ?? null,
          turnCompleteScore: attempt.turnCompleteScore ?? null,
        },
      });
      reasoningTimelineEntryByAttemptIdRef.current[attempt.id] = timelineEntry.id;
      return timelineEntry.id;
    },
    [addHelixTimelineEntry, formatReasoningAttemptDetail, patchHelixTimelineEntry],
  );

  const updateReasoningAttempt = useCallback(
    (attemptId: string, updater: (attempt: ReasoningAttempt) => ReasoningAttempt) => {
      setReasoningAttempts((prev) => {
        const next = prev.map((attempt) =>
          attempt.id === attemptId ? { ...updater(attempt), updatedAtMs: Date.now() } : attempt,
        );
        reasoningAttemptsRef.current = next;
        return next;
      });
    },
    [],
  );

  const enqueueReasoningAttempt = useCallback((attemptId: string) => {
    reasoningAttemptQueueRef.current.push(attemptId);
  }, []);

  const suppressSupersededVoiceAttemptsForNewTurn = useCallback(
    (newTraceId: string | null | undefined) => {
      if (!newTraceId) return;
      const supersededAttempts = reasoningAttemptsRef.current.filter(
        (attempt) =>
          attempt.source === "voice_auto" &&
          attempt.traceId &&
          attempt.traceId !== newTraceId &&
          (attempt.status === "queued" || attempt.status === "running" || attempt.status === "streaming"),
      );
      if (supersededAttempts.length === 0) return;
      const supersededIds = new Set(supersededAttempts.map((attempt) => attempt.id));
      reasoningAttemptQueueRef.current = reasoningAttemptQueueRef.current.filter((id) => !supersededIds.has(id));
      for (const attempt of supersededAttempts) {
        updateReasoningAttempt(attempt.id, (current) => ({
          ...current,
          status: "suppressed",
          suppression_reason: "voice_turn_superseded_by_newer_turn",
          completedAtMs: Date.now(),
        }));
        const entryId = ensureReasoningTimelineEntry(attempt, "suppressed");
        patchHelixTimelineEntry(entryId, {
          status: "suppressed",
          detail: "superseded by newer voice turn",
        });
        const streamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
        if (streamEntryId) {
          patchHelixTimelineEntry(streamEntryId, {
            status: "suppressed",
            detail: "superseded by newer voice turn",
          });
          delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
        }
        if (reasoningAttemptAbortAttemptIdRef.current === attempt.id) {
          reasoningAttemptAbortControllerRef.current?.abort();
        }
        suppressVoiceFinalForTurn(attempt.traceId);
        const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
        if (segmentId) {
          patchVoiceSegmentAttempt(segmentId, { dispatch: "suppressed" });
          delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
        }
      }
    },
    [
      ensureReasoningTimelineEntry,
      patchHelixTimelineEntry,
      patchVoiceSegmentAttempt,
      suppressVoiceFinalForTurn,
      updateReasoningAttempt,
    ],
  );

  const suppressActiveVoiceAttemptsForTurn = useCallback(
    (input: {
      turnKey: string;
      reason: string;
      detail: string;
      patchSegmentDispatch?: "suppressed" | "queued" | "completed" | "none";
    }) => {
      const activeAttempts = reasoningAttemptsRef.current.filter(
        (attempt) =>
          attempt.source === "voice_auto" &&
          attempt.traceId === input.turnKey &&
          (attempt.status === "queued" || attempt.status === "running" || attempt.status === "streaming"),
      );
      if (activeAttempts.length === 0) return;
      const activeIds = new Set(activeAttempts.map((attempt) => attempt.id));
      reasoningAttemptQueueRef.current = reasoningAttemptQueueRef.current.filter((id) => !activeIds.has(id));
      for (const attempt of activeAttempts) {
        updateReasoningAttempt(attempt.id, (current) => ({
          ...current,
          status: "suppressed",
          suppression_reason: input.reason,
          completedAtMs: Date.now(),
        }));
        const entryId = ensureReasoningTimelineEntry(attempt, "suppressed");
        patchHelixTimelineEntry(entryId, {
          status: "suppressed",
          detail: input.detail,
        });
        const streamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
        if (streamEntryId) {
          patchHelixTimelineEntry(streamEntryId, {
            status: "suppressed",
            detail: input.detail,
          });
          delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
        }
        if (reasoningAttemptAbortAttemptIdRef.current === attempt.id) {
          reasoningAttemptAbortControllerRef.current?.abort();
        }
        const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
        if (segmentId && input.patchSegmentDispatch) {
          patchVoiceSegmentAttempt(segmentId, { dispatch: input.patchSegmentDispatch });
        }
      }
      suppressVoiceFinalForTurn(input.turnKey);
    },
    [
      ensureReasoningTimelineEntry,
      patchHelixTimelineEntry,
      patchVoiceSegmentAttempt,
      suppressVoiceFinalForTurn,
      updateReasoningAttempt,
    ],
  );

  const createReasoningAttempt = useCallback(
    (input: {
      prompt: string;
      dispatchPrompt?: string;
      recordedText?: string | null;
      contextCapsuleIds?: string[];
      contextCapsuleCount?: number;
      contextCapsulePinnedCount?: number;
      source: ReasoningAttemptSource;
      mode?: "observe" | "act" | "verify";
      profile?: "dot_min_steps_v1";
      status?: ReasoningAttemptStatus;
      traceId?: string;
      conversationBriefBase?: string;
      completionScore?: number;
      floorOwner?: FloorOwner;
      suppression_reason?: string;
      routeReasonCode?: string;
      explorationTurn?: boolean;
      clarifierPolicy?: ConversationClarifierPolicy;
      explorationPacket?: ConversationExplorationPacket | null;
      explorationTopicKey?: string | null;
      explorationAttemptCount?: number;
      intentRevision?: number;
      transcriptRevision?: number;
      sealToken?: string | null;
      sealedAtMs?: number | null;
      intentShiftScore?: number;
      turnCompleteScore?: number;
      sttEngine?: string;
      sourceLanguage?: string | null;
      translated?: boolean;
    }): ReasoningAttempt => {
      const now = Date.now();
      const attempt: ReasoningAttempt = {
        id: crypto.randomUUID(),
        traceId: input.traceId ?? `ask:${crypto.randomUUID()}`,
        prompt: input.prompt.trim(),
        dispatchPrompt: input.dispatchPrompt?.trim() || undefined,
        recordedText: input.recordedText ?? null,
        contextCapsuleIds: input.contextCapsuleIds?.slice(0, HELIX_CONTEXT_CAPSULE_MAX_IDS),
        contextCapsuleCount: input.contextCapsuleCount,
        contextCapsulePinnedCount: input.contextCapsulePinnedCount,
        source: input.source,
        status: input.status ?? "queued",
        profile: input.profile,
        mode: input.mode,
        completionScore: input.completionScore,
        floorOwner: input.floorOwner,
        suppression_reason: input.suppression_reason,
        routeReasonCode: input.routeReasonCode,
        explorationTurn: input.explorationTurn,
        clarifierPolicy: input.clarifierPolicy,
        explorationPacket: input.explorationPacket ?? null,
        explorationTopicKey: input.explorationTopicKey ?? null,
        explorationAttemptCount: input.explorationAttemptCount,
        intentRevision: input.intentRevision,
        transcriptRevision: input.transcriptRevision,
        sealToken: input.sealToken ?? null,
        sealedAtMs: input.sealedAtMs ?? null,
        intentShiftScore: input.intentShiftScore,
        turnCompleteScore: input.turnCompleteScore,
        sttEngine: input.sttEngine,
        sourceLanguage: input.sourceLanguage,
        translated: input.translated,
        conversationBriefBase: input.conversationBriefBase,
        partial: "",
        events: [],
        createdAtMs: now,
        updatedAtMs: now,
      };
      const nextAttempts = [attempt, ...reasoningAttemptsRef.current].slice(0, 24);
      reasoningAttemptsRef.current = nextAttempts;
      setReasoningAttempts(nextAttempts);
      return attempt;
    },
    [],
  );

  const runReasoningAttemptQueue = useCallback(async () => {
    if (reasoningAttemptRunnerRef.current) return;
    reasoningAttemptRunnerRef.current = true;
    try {
      while (reasoningAttemptQueueRef.current.length > 0) {
        const nextAttemptId = reasoningAttemptQueueRef.current.shift();
        if (!nextAttemptId) continue;
        if (askBusy && reasoningAttemptCurrentIdRef.current === null) {
          reasoningAttemptQueueRef.current.unshift(nextAttemptId);
          break;
        }
        const attempt = reasoningAttemptsRef.current.find((entry) => entry.id === nextAttemptId);
        if (!attempt || attempt.status === "cancelled" || attempt.status === "suppressed") {
          continue;
        }
        if (attempt.source === "voice_auto") {
          const assemblerState = getVoiceTurnAssemblerState(attempt.traceId);
          const preflightAuthority = evaluateVoiceReasoningResponseAuthority({
            source: attempt.source,
            continuationRestartRequested: false,
            latestAskPromptForAttempt: attempt.dispatchPrompt ?? attempt.prompt,
            askPromptForRequest: attempt.dispatchPrompt ?? attempt.prompt,
            latestAttemptStatus: attempt.status,
            requestIntentRevision: attempt.intentRevision,
            latestIntentRevision: assemblerState?.sealedRevision ?? undefined,
            latestAttemptIntentRevision: attempt.intentRevision,
            requestDispatchPromptHash: hashVoiceUtteranceKey(attempt.dispatchPrompt ?? attempt.prompt),
            latestDispatchPromptHash: hashVoiceUtteranceKey(attempt.dispatchPrompt ?? attempt.prompt),
            attemptTranscriptRevision: attempt.transcriptRevision ?? null,
            latestSealedTranscriptRevision: assemblerState?.sealedRevision ?? null,
            attemptSealToken: attempt.sealToken ?? null,
            latestSealToken: assemblerState?.sealToken ?? null,
            assemblerPhase: assemblerState?.phase ?? null,
          });
          if (preflightAuthority.suppress) {
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              suppression_reason: "voice_turn_response_stale_seal_authority",
              completedAtMs: Date.now(),
            }));
            const suppressedEntryId = ensureReasoningTimelineEntry(attempt, "suppressed");
            patchHelixTimelineEntry(suppressedEntryId, {
              status: "suppressed",
              detail: "stale seal authority",
            });
            const staleStreamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            if (staleStreamEntryId) {
              patchHelixTimelineEntry(staleStreamEntryId, {
                status: "suppressed",
                detail: "stale seal authority",
              });
              delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            }
            continue;
          }
        }
        const sessionId = getHelixAskSessionId() ?? undefined;
        setAskBusy(true);
        setAskStatus("Generating answer...");
        setAskError(null);
        setAskLiveEvents([]);
        askLiveEventsRef.current = [];
        resetReasoningTheaterEventClock();
        setAskLiveDraft("");
        askLiveDraftRef.current = "";
        askLiveDraftBufferRef.current = "";
        clearLiveDraftFlush();
        askStartRef.current = Date.now();
        setAskElapsedMs(0);
        setAskActiveQuestion(attempt.prompt);
        setAskLiveSessionId(sessionId ?? null);
        setAskLiveTraceId(attempt.traceId);
        if (sessionId) {
          setActive(sessionId);
        }
        reasoningAttemptCurrentIdRef.current = attempt.id;
        const primaryTimelineEntryId = ensureReasoningTimelineEntry(attempt, "running");
        updateReasoningAttempt(attempt.id, (current) => ({ ...current, status: "running" }));
        patchHelixTimelineEntry(primaryTimelineEntryId, {
          status: "running",
          detail: formatReasoningAttemptDetail(attempt, "running"),
        });
        if (attempt.source === "voice_auto") {
          const rawVoiceBriefBase =
            attempt.conversationBriefBase?.trim() ||
            buildConversationFallbackBrief({
              transcript: attempt.recordedText ?? attempt.prompt,
              mode: attempt.mode,
              clarifyNeeded: false,
            });
          const voiceBriefBase = isGenericQueuedVoiceAcknowledgement(rawVoiceBriefBase)
            ? attempt.recordedText ?? attempt.prompt
            : rawVoiceBriefBase;
          updateVoiceDecisionBrief({
            baseBrief: voiceBriefBase,
            lifecycle: "running",
            mode: attempt.mode,
            routeReasonCode: attempt.routeReasonCode,
            traceId: attempt.traceId,
            meta: {
              attemptId: attempt.id,
              explorationAttemptCount: attempt.explorationAttemptCount ?? null,
              transcript: attempt.recordedText ?? attempt.prompt,
              transcriptRevision: attempt.transcriptRevision ?? null,
            },
          });
        }
        const unsubscribe = subscribeToolLogs(
          (event) => {
            if (!event || event.traceId !== attempt.traceId) return;
            if (attempt.source === "voice_auto") {
              const assemblerState = getVoiceTurnAssemblerState(attempt.traceId);
              const authoritative =
                assemblerState?.phase === "sealed" &&
                assemblerState.sealedRevision === (attempt.transcriptRevision ?? -1) &&
                assemblerState.sealToken === (attempt.sealToken ?? null);
              if (!authoritative) {
                return;
              }
            }
            const toolName = (event.tool ?? "").trim();
            if (toolName === "helix.ask.stream") {
              const chunk = String(event.text ?? "");
              if (!chunk) return;
              const currentAttempt = reasoningAttemptsRef.current.find((entry) => entry.id === attempt.id);
              const nextPartial = `${currentAttempt?.partial ?? ""}${chunk}`.slice(-4000);
              updateReasoningAttempt(attempt.id, (current) => ({
                ...current,
                status: "streaming",
                partial: nextPartial,
              }));
              patchHelixTimelineEntry(primaryTimelineEntryId, {
                status: "streaming",
                detail: "streaming",
              });
              const streamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
              if (streamEntryId) {
                patchHelixTimelineEntry(streamEntryId, {
                  status: "streaming",
                  text: clipText(nextPartial, 420),
                });
              } else {
                const streamEntry = addHelixTimelineEntry({
                  type: "reasoning_stream",
                  source: attempt.source,
                  status: "streaming",
                  text: clipText(nextPartial, 420),
                  detail: "live partial",
                  traceId: attempt.traceId,
                  attemptId: attempt.id,
                  mode: attempt.mode,
                });
                reasoningStreamEntryByAttemptIdRef.current[attempt.id] = streamEntry.id;
              }
              return;
            }
            let text = String(event.message ?? event.text ?? "").trim();
            if (!text && event.stage) {
              text = event.detail ? `${event.stage}: ${event.detail}` : event.stage;
            }
            if (!text) return;
            const eventTs = parseTimestampMs(event.ts);
            const nextEvent: AskLiveEventEntry = {
              id: event.id ?? String(event.seq ?? Date.now()),
              text: clipText(text, HELIX_ASK_LIVE_EVENT_MAX_CHARS),
              tool: toolName || undefined,
              ts: event.ts,
              tsMs: eventTs ?? undefined,
              seq:
                typeof event.seq === "number" && Number.isFinite(event.seq)
                  ? event.seq
                  : undefined,
              durationMs:
                typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
                  ? event.durationMs
                  : undefined,
              meta:
                event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
                  ? (event.meta as Record<string, unknown>)
                  : undefined,
            };
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              events: [...current.events, nextEvent].slice(-HELIX_ASK_LIVE_EVENT_LIMIT),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              detail: clipText(nextEvent.text, 120),
            });
          },
          {
            sessionId,
            traceId: attempt.traceId,
            limit: 120,
          },
        );
        const askController = new AbortController();
        reasoningAttemptAbortControllerRef.current = askController;
        reasoningAttemptAbortAttemptIdRef.current = attempt.id;
        try {
          const askModeForRequest = attempt.mode === "observe" ? undefined : attempt.mode;
          const askPromptForRequest = attempt.dispatchPrompt ?? attempt.prompt;
          const requestIntentRevision =
            attempt.source === "voice_auto" &&
            typeof (attempt.transcriptRevision ?? attempt.intentRevision) === "number" &&
            Number.isFinite(attempt.transcriptRevision ?? attempt.intentRevision)
              ? (attempt.transcriptRevision ?? attempt.intentRevision)
              : undefined;
          const requestDispatchPromptHash =
            attempt.source === "voice_auto"
              ? hashVoiceUtteranceKey(askPromptForRequest)
              : null;
          const selectedCapsuleIds =
            Array.isArray(attempt.contextCapsuleIds) && attempt.contextCapsuleIds.length > 0
              ? attempt.contextCapsuleIds.slice(0, HELIX_CONTEXT_CAPSULE_MAX_IDS)
              : resolveSelectedContextCapsuleIds(attempt.prompt, undefined, { source: attempt.source });
          const askResult = await askLocalWithPreflightScopeFallback(undefined, {
            sessionId,
            traceId: attempt.traceId,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
            question: askPromptForRequest,
            debug: userSettings.showHelixAskDebug,
            mode: askModeForRequest,
            capsuleIds: selectedCapsuleIds,
            dialogue_profile: attempt.profile,
            signal: askController.signal,
          });
          const response = askResult.response;
          const responseMode =
            response.mode === "read" ||
            response.mode === "observe" ||
            response.mode === "act" ||
            response.mode === "verify"
              ? response.mode
              : undefined;
          const modeForTimeline: HelixTimelineEntry["mode"] =
            responseMode ?? (attempt.mode ?? "observe");
          const modeForAttempt: ReasoningAttempt["mode"] =
            responseMode === "observe" || responseMode === "act" || responseMode === "verify"
              ? responseMode
              : responseMode === "read"
                ? "observe"
                : attempt.mode;
          const latestAttemptSnapshot = reasoningAttemptsRef.current.find((entry) => entry.id === attempt.id);
          const latestAskPromptForAttempt = (
            latestAttemptSnapshot?.dispatchPrompt ?? latestAttemptSnapshot?.prompt ?? askPromptForRequest
          ).trim();
          const continuationRestartRequested = reasoningAttemptRestartRequestedRef.current.has(attempt.id);
          const latestIntentState =
            attempt.source === "voice_auto" && attempt.traceId
              ? intentRevisionByTurnKeyRef.current[attempt.traceId]
              : undefined;
          const latestAssemblerState =
            attempt.source === "voice_auto" ? getVoiceTurnAssemblerState(attempt.traceId) : null;
          const latestIntentRevision = latestAssemblerState?.sealedRevision ?? latestIntentState?.revision;
          const attemptIntentRevision =
            typeof latestAttemptSnapshot?.transcriptRevision === "number"
              ? latestAttemptSnapshot.transcriptRevision
              : typeof latestAttemptSnapshot?.intentRevision === "number"
                ? latestAttemptSnapshot.intentRevision
                : typeof attempt.transcriptRevision === "number"
                  ? attempt.transcriptRevision
                  : typeof attempt.intentRevision === "number"
                    ? attempt.intentRevision
                : undefined;
          const authority = evaluateVoiceReasoningResponseAuthority({
            source: attempt.source,
            continuationRestartRequested,
            latestAskPromptForAttempt,
            askPromptForRequest,
            latestAttemptStatus: latestAttemptSnapshot?.status,
            requestIntentRevision,
            latestIntentRevision,
            latestAttemptIntentRevision: attemptIntentRevision,
            requestDispatchPromptHash,
            latestDispatchPromptHash: latestIntentState?.dispatchPromptHash,
            attemptTranscriptRevision: attempt.transcriptRevision ?? null,
            latestSealedTranscriptRevision: latestAssemblerState?.sealedRevision ?? null,
            attemptSealToken: attempt.sealToken ?? null,
            latestSealToken: latestAssemblerState?.sealToken ?? null,
            assemblerPhase: latestAssemblerState?.phase ?? null,
          });
          if (authority.suppress) {
            reasoningAttemptRestartRequestedRef.current.delete(attempt.id);
            if (!authority.restart) {
              continue;
            }
            const staleRestartDetail =
              authority.reason === "continuation_merged"
                ? "continuation merged; restarting"
                : authority.reason === "stale_revision"
                  ? "stale revision dropped; restarting"
                  : authority.reason === "stale_dispatch_hash"
                    ? "stale dispatch dropped; restarting"
                    : "stale prompt dropped; restarting";
            reasoningAttemptQueueRef.current = [
              attempt.id,
              ...reasoningAttemptQueueRef.current.filter((id) => id !== attempt.id),
            ];
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "queued",
              suppression_reason:
                authority.reason === "continuation_merged"
                  ? "voice_turn_continuation_merged"
                  : "voice_turn_response_stale",
              partial: "",
              finalAnswer: undefined,
              events: [],
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "queued",
              detail: staleRestartDetail,
            });
            const staleStreamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            if (staleStreamEntryId) {
              patchHelixTimelineEntry(staleStreamEntryId, {
                status: "suppressed",
                detail: staleRestartDetail,
              });
              delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            }
            continue;
          }
          const supersededByIntentRevision =
            attempt.source === "voice_auto" &&
            typeof latestIntentRevision === "number" &&
            Number.isFinite(latestIntentRevision) &&
            typeof attemptIntentRevision === "number" &&
            Number.isFinite(attemptIntentRevision) &&
            attemptIntentRevision < latestIntentRevision;
          if (supersededByIntentRevision) {
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              suppression_reason: "voice_turn_superseded_by_newer_intent_revision",
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "suppressed",
              detail: "superseded by newer turn intent",
            });
            const staleStreamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            if (staleStreamEntryId) {
              patchHelixTimelineEntry(staleStreamEntryId, {
                status: "suppressed",
                detail: "superseded by newer turn intent",
              });
              delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            }
            markVoiceCheckpoint(
              "dispatch_suppressed",
              "ok",
              "Suppressed stale final from superseded intent revision.",
            );
            const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
            if (segmentId) {
              patchVoiceSegmentAttempt(segmentId, { dispatch: "suppressed" });
              delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
            }
            continue;
          }
          const supersededByNewerVoiceAttempt =
            attempt.source === "voice_auto" &&
            reasoningAttemptsRef.current.some(
              (entry) =>
                entry.source === "voice_auto" &&
                entry.id !== attempt.id &&
                entry.createdAtMs > attempt.createdAtMs &&
                entry.status !== "cancelled" &&
                entry.status !== "failed" &&
                entry.status !== "suppressed",
            );
          if (supersededByNewerVoiceAttempt) {
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              suppression_reason: "voice_turn_superseded_by_newer_attempt",
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "suppressed",
              detail: "superseded by newer voice turn",
            });
            const staleStreamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            if (staleStreamEntryId) {
              patchHelixTimelineEntry(staleStreamEntryId, {
                status: "suppressed",
                detail: "superseded by newer voice turn",
              });
              delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
            }
            if (attempt.source === "voice_auto") {
              markVoiceCheckpoint(
                "dispatch_suppressed",
                "ok",
                "Superseded stale result in favor of newer voice turn.",
              );
              const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              if (segmentId) {
                patchVoiceSegmentAttempt(segmentId, { dispatch: "suppressed" });
                delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              }
            }
            continue;
          }
        const finalText = (response.envelope?.answer?.trim() ||
            stripPromptEcho(response.text ?? "", askPromptForRequest) ||
            "").trim();
          const rawOutputText = finalText || "No final answer returned.";
          const artifactDominated = isArtifactDominatedReasoningText(rawOutputText);
          const sanitizedOutputText = sanitizeReasoningOutputText(rawOutputText);
          const outputText =
            artifactDominated && sanitizedOutputText.length < 72
              ? "I could not produce a readable grounded answer for this turn. Please restate it and I will retry with stricter grounding."
              : sanitizedOutputText || rawOutputText;
          const responseDebugWithClientMode =
            response.debug || modeForAttempt
              ? {
                  ...response.debug,
                  ...(modeForAttempt ? { client_inferred_mode: modeForAttempt } : {}),
                  ...(askResult.downgradedFromMode
                    ? {
                        client_mode_fallback: {
                          from: askResult.downgradedFromMode,
                          to: responseMode ?? "read",
                          reason: "preflight_scope_required",
                        },
                      }
                    : {}),
                }
              : undefined;
          const evidenceRefs = response.debug?.context_files ?? response.debug?.prompt_context_files ?? [];
          const certaintyClass =
            ((response.envelope as { certainty_class?: "confirmed" | "reasoned" | "hypothesis" | "unknown" } | undefined)
              ?.certainty_class) ??
            (response.debug?.evidence_gate_ok ? "reasoned" : "unknown");
          const ladderDecision =
            attempt.source === "voice_auto" && attempt.explorationTurn
                ? decideExplorationLadderAction({
                  explorationAttemptCount: attempt.explorationAttemptCount ?? 1,
                  outputText,
                  rawOutputText,
                  promptText: attempt.recordedText ?? attempt.prompt,
                  failReason:
                    (
                      response.debug as
                        | { fail_reason?: string; helix_ask_fail_reason?: string }
                        | undefined
                    )?.helix_ask_fail_reason ??
                    (response.debug as { fail_reason?: string } | undefined)?.fail_reason,
                  mode: modeForAttempt,
                  debug: response.debug,
                })
              : { action: "finalize" as const, reasonCode: attempt.routeReasonCode ?? "dispatch:finalize" };
          const streamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
          if (streamEntryId) {
            patchHelixTimelineEntry(streamEntryId, {
              status: "done",
              detail: "stream complete",
            });
            delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
          }
          if (ladderDecision.action === "restart_after_artifact") {
            const nextAttemptCount = (attempt.explorationAttemptCount ?? 1) + 1;
            if (
              attempt.source === "voice_auto" &&
              typeof attempt.transcriptRevision === "number" &&
              Number.isFinite(attempt.transcriptRevision)
            ) {
              const revision = Math.max(0, Math.floor(attempt.transcriptRevision));
              updateVoiceTurnAssemblerState(attempt.traceId, (current) => ({
                ...current,
                artifactRetryCountByRevision: {
                  ...current.artifactRetryCountByRevision,
                  [revision]: (current.artifactRetryCountByRevision[revision] ?? 0) + 1,
                },
              }));
            }
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              mode: modeForAttempt,
              suppression_reason: ladderDecision.reasonCode,
              partial: current.partial || outputText,
              finalAnswer: outputText,
              certaintyClass,
              evidenceRefs,
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "suppressed",
              detail: "artifact guard restart -> observe",
            });
            addHelixTimelineEntry({
              type: "suppressed",
              source: attempt.source,
              status: "suppressed",
              text: clipText(
                formatVoiceDecisionSentence({
                  lifecycle: "suppressed",
                  mode: "observe",
                  routeReasonCode: ladderDecision.reasonCode,
                }),
                280,
              ),
              detail: "artifact-dominated output; restarting observe lane",
              mode: "observe",
              traceId: attempt.traceId,
              attemptId: attempt.id,
            });
            const retryBriefBase =
              attempt.conversationBriefBase?.trim() ||
              buildConversationFallbackBrief({
                transcript: attempt.recordedText ?? attempt.prompt,
                mode: "observe",
                clarifyNeeded: false,
              });
            const followUpAttempt = createReasoningAttempt({
              prompt: buildExplorationArtifactRetryPrompt({
                prompt: attempt.prompt,
                previousOutput: outputText,
                packet: attempt.explorationPacket,
              }),
              traceId: attempt.traceId,
              recordedText: attempt.recordedText ?? attempt.prompt,
              contextCapsuleIds: attempt.contextCapsuleIds,
              contextCapsuleCount: attempt.contextCapsuleCount,
              contextCapsulePinnedCount: attempt.contextCapsulePinnedCount,
              source: attempt.source,
              profile: attempt.profile,
              mode: "observe",
              status: "queued",
              routeReasonCode: ladderDecision.reasonCode,
              explorationTurn: true,
              clarifierPolicy: attempt.clarifierPolicy,
              explorationPacket: attempt.explorationPacket,
              explorationTopicKey: attempt.explorationTopicKey,
              explorationAttemptCount: nextAttemptCount,
              transcriptRevision: attempt.transcriptRevision,
              sealToken: attempt.sealToken,
              sealedAtMs: attempt.sealedAtMs,
              completionScore: attempt.completionScore,
              floorOwner: attempt.floorOwner,
              sttEngine: attempt.sttEngine,
              sourceLanguage: attempt.sourceLanguage,
              translated: attempt.translated,
              conversationBriefBase: retryBriefBase,
            });
            ensureReasoningTimelineEntry(followUpAttempt, "queued");
            enqueueReasoningAttempt(followUpAttempt.id);
            if (attempt.explorationTopicKey) {
              const existing = explorationRuntimeByTopicRef.current[attempt.explorationTopicKey];
              explorationRuntimeByTopicRef.current[attempt.explorationTopicKey] = {
                attemptCount: nextAttemptCount,
                clarifierAsked: existing?.clarifierAsked ?? false,
                packet: attempt.explorationPacket ?? existing?.packet ?? null,
                lastRouteReasonCode: ladderDecision.reasonCode,
                updatedAtMs: Date.now(),
              };
            }
            if (attempt.source === "voice_auto") {
              markVoiceCheckpoint(
                "dispatch_queued",
                "ok",
                "Artifact guard restarted observe reasoning from top of chain.",
              );
              updateVoiceDecisionBrief({
                baseBrief: retryBriefBase,
                lifecycle: "queued",
                mode: "observe",
                routeReasonCode: ladderDecision.reasonCode,
                traceId: followUpAttempt.traceId,
                meta: {
                  attemptId: followUpAttempt.id,
                  transcript: followUpAttempt.recordedText ?? followUpAttempt.prompt,
                  explorationAttemptCount: nextAttemptCount,
                  artifactGuardRestart: true,
                  transcriptRevision: followUpAttempt.transcriptRevision ?? null,
                },
              });
              const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              if (segmentId) {
                voiceReasoningAttemptSegmentByIdRef.current[followUpAttempt.id] = segmentId;
                delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              }
            }
          } else if (ladderDecision.action === "clarify_after_attempt1") {
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              mode: modeForAttempt,
              suppression_reason: ladderDecision.reasonCode,
              partial: current.partial || outputText,
              finalAnswer: outputText,
              certaintyClass,
              evidenceRefs,
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "suppressed",
              detail: clipText(
                formatVoiceDecisionSentence({
                  lifecycle: "suppressed",
                  mode: "clarify",
                  routeReasonCode: ladderDecision.reasonCode,
                }),
                140,
              ),
            });
            addHelixTimelineEntry({
              type: "suppressed",
              source: attempt.source,
              status: "suppressed",
              text: clipText(
                formatVoiceDecisionSentence({
                  lifecycle: "suppressed",
                  mode: "clarify",
                  routeReasonCode: ladderDecision.reasonCode,
                }),
                280,
              ),
              detail: "clarifier requested after attempt 1",
              mode: "clarify",
              traceId: attempt.traceId,
              attemptId: attempt.id,
            });
            const clarifierBriefBase = buildConversationFallbackBrief({
              transcript: attempt.recordedText ?? attempt.prompt,
              mode: "clarify",
              clarifyNeeded: true,
            });
            updateVoiceDecisionBrief({
              baseBrief: clarifierBriefBase,
              lifecycle: "suppressed",
              mode: "clarify",
              routeReasonCode: ladderDecision.reasonCode,
              traceId: attempt.traceId,
              meta: {
                attemptId: attempt.id,
                explorationAttemptCount: attempt.explorationAttemptCount ?? 1,
              },
            });
            rememberConversationTurn(`dottie: ${clarifierBriefBase}`);
            if (attempt.explorationTopicKey) {
              const existing = explorationRuntimeByTopicRef.current[attempt.explorationTopicKey];
              explorationRuntimeByTopicRef.current[attempt.explorationTopicKey] = {
                attemptCount: attempt.explorationAttemptCount ?? existing?.attemptCount ?? 1,
                clarifierAsked: true,
                packet: attempt.explorationPacket ?? existing?.packet ?? null,
                lastRouteReasonCode: ladderDecision.reasonCode,
                updatedAtMs: Date.now(),
              };
            }
            if (attempt.source === "voice_auto") {
              markVoiceCheckpoint("dispatch_suppressed", "ok", "Clarifier requested after attempt 1.");
              const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              if (segmentId) {
                patchVoiceSegmentAttempt(segmentId, { dispatch: "suppressed" });
                delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              }
            }
          } else if (ladderDecision.action === "escalate_verify" || ladderDecision.action === "escalate_act") {
            const escalatedMode: "verify" | "act" =
              ladderDecision.action === "escalate_verify" ? "verify" : "act";
            const nextAttemptCount = (attempt.explorationAttemptCount ?? 1) + 1;
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "suppressed",
              mode: modeForAttempt,
              suppression_reason: ladderDecision.reasonCode,
              partial: current.partial || outputText,
              finalAnswer: outputText,
              certaintyClass,
              evidenceRefs,
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "suppressed",
              detail: `escalated -> ${escalatedMode}`,
            });
            addHelixTimelineEntry({
              type: "suppressed",
              source: attempt.source,
              status: "suppressed",
              text: clipText(
                formatVoiceDecisionSentence({
                  lifecycle: "escalated",
                  mode: modeForAttempt,
                  escalatedMode,
                  routeReasonCode: ladderDecision.reasonCode,
                }),
                280,
              ),
              detail: `escalating to ${escalatedMode}`,
              mode: escalatedMode,
              traceId: attempt.traceId,
              attemptId: attempt.id,
            });
            const escalatedBriefBase = attempt.conversationBriefBase?.trim() || outputText;
            updateVoiceDecisionBrief({
              baseBrief: escalatedBriefBase,
              lifecycle: "escalated",
              mode: modeForAttempt,
              escalatedMode,
              routeReasonCode: ladderDecision.reasonCode,
              traceId: attempt.traceId,
              meta: {
                attemptId: attempt.id,
                explorationAttemptCount: attempt.explorationAttemptCount ?? 1,
              },
            });
            const followUpAttempt = createReasoningAttempt({
              prompt: buildExplorationEscalationPrompt({
                mode: escalatedMode,
                prompt: attempt.prompt,
                previousOutput: outputText,
                packet: attempt.explorationPacket,
              }),
              traceId: attempt.traceId,
              recordedText: attempt.recordedText ?? attempt.prompt,
              contextCapsuleIds: attempt.contextCapsuleIds,
              contextCapsuleCount: attempt.contextCapsuleCount,
              contextCapsulePinnedCount: attempt.contextCapsulePinnedCount,
              source: attempt.source,
              profile: attempt.profile,
              mode: escalatedMode,
              status: "queued",
              routeReasonCode: ladderDecision.reasonCode,
              explorationTurn: false,
              clarifierPolicy: attempt.clarifierPolicy,
              explorationPacket: attempt.explorationPacket,
              explorationTopicKey: attempt.explorationTopicKey,
              explorationAttemptCount: nextAttemptCount,
              transcriptRevision: attempt.transcriptRevision,
              sealToken: attempt.sealToken,
              sealedAtMs: attempt.sealedAtMs,
              completionScore: attempt.completionScore,
              floorOwner: attempt.floorOwner,
              sttEngine: attempt.sttEngine,
              sourceLanguage: attempt.sourceLanguage,
              translated: attempt.translated,
              conversationBriefBase: escalatedBriefBase,
            });
            ensureReasoningTimelineEntry(followUpAttempt, "queued");
            enqueueReasoningAttempt(followUpAttempt.id);
            if (attempt.explorationTopicKey) {
              const existing = explorationRuntimeByTopicRef.current[attempt.explorationTopicKey];
              explorationRuntimeByTopicRef.current[attempt.explorationTopicKey] = {
                attemptCount: nextAttemptCount,
                clarifierAsked: existing?.clarifierAsked ?? false,
                packet: attempt.explorationPacket ?? existing?.packet ?? null,
                lastRouteReasonCode: ladderDecision.reasonCode,
                updatedAtMs: Date.now(),
              };
            }
            if (attempt.source === "voice_auto") {
              markVoiceCheckpoint("dispatch_queued", "ok", `Escalated to ${escalatedMode} lane.`);
              updateVoiceDecisionBrief({
                baseBrief: escalatedBriefBase,
                lifecycle: "queued",
                mode: escalatedMode,
                routeReasonCode: ladderDecision.reasonCode,
                traceId: followUpAttempt.traceId,
                meta: {
                  attemptId: followUpAttempt.id,
                  transcript: followUpAttempt.recordedText ?? followUpAttempt.prompt,
                  explorationAttemptCount: nextAttemptCount,
                  transcriptRevision: followUpAttempt.transcriptRevision ?? null,
                },
              });
              const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              if (segmentId) {
                voiceReasoningAttemptSegmentByIdRef.current[followUpAttempt.id] = segmentId;
                delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              }
            }
          } else {
            if (response.context_capsule) {
              upsertContextCapsuleSessionLedger(response.context_capsule);
            }
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "done",
              mode: modeForAttempt,
              partial: current.partial || outputText,
              finalAnswer: outputText,
              certaintyClass,
              evidenceRefs,
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "done",
              detail: formatReasoningAttemptDetail({ mode: modeForAttempt }, "done"),
              mode: modeForTimeline,
            });
            const finalTimelineEntry = addHelixTimelineEntry({
              type: modeForAttempt === "act" ? "action_receipt" : "reasoning_final",
              source: attempt.source,
              status: "done",
              text: clipText(outputText, 500),
              detail: formatReasoningAttemptDetail({ mode: modeForAttempt }, "reasoning complete"),
              mode: modeForTimeline,
              traceId: attempt.traceId,
              attemptId: attempt.id,
              meta: {
                certaintyClass,
                evidenceRefs,
              },
            });
            if (attempt.source === "voice_auto" && finalTimelineEntry.type === "reasoning_final") {
              const finalRevision = bumpVoiceTurnRevision(attempt.traceId ?? attempt.id, "final");
              enqueueVoiceAutoSpeakTask({
                key: `final:${attempt.id}:${finalTimelineEntry.id}`,
                kind: "final",
                turnKey: attempt.traceId ?? attempt.id,
                revision: finalRevision.revision,
                text: outputText,
                traceId: attempt.traceId,
                eventId: finalTimelineEntry.id,
              });
            }
            const liveEventsSnapshot = [...askLiveEventsRef.current];
            const convergenceSnapshot = deriveConvergenceStripState({
              events: liveEventsSnapshot,
              frontierAction: reasoningTheaterFrontierDebugRef.current.action,
              frontierDeltaPct: reasoningTheaterFrontierDebugRef.current.deltaPct,
              proof: response.proof
                ? {
                    verdict: response.proof.verdict,
                    certificate: {
                      certificateHash: response.proof.certificate?.certificateHash ?? null,
                      integrityOk: response.proof.certificate?.integrityOk ?? null,
                    },
                  }
                : undefined,
              debug: buildConvergenceDebugSnapshot(responseDebugWithClientMode),
              fallbackPhase: "debrief",
            });
            const replyId = crypto.randomUUID();
            setAskReplies((prev) =>
              [
                {
                  id: replyId,
                  content: outputText,
                  question: attempt.recordedText ?? attempt.prompt,
                  debug: responseDebugWithClientMode,
                  promptIngested: response.prompt_ingested,
                  envelope: response.envelope,
                  mode: modeForTimeline,
                  proof: response.proof,
                  contextCapsule: response.context_capsule,
                  sources:
                    responseDebugWithClientMode?.context_files ??
                    responseDebugWithClientMode?.prompt_context_files ??
                    [],
                  liveEvents: liveEventsSnapshot,
                  convergenceSnapshot,
                },
                ...prev,
              ].slice(0, 3),
            );
            if (sessionId) {
              addMessage(sessionId, { role: "assistant", content: outputText });
            }
            if (attempt.explorationTopicKey) {
              const existing = explorationRuntimeByTopicRef.current[attempt.explorationTopicKey];
              explorationRuntimeByTopicRef.current[attempt.explorationTopicKey] = {
                attemptCount: attempt.explorationAttemptCount ?? existing?.attemptCount ?? 1,
                clarifierAsked: existing?.clarifierAsked ?? false,
                packet: attempt.explorationPacket ?? existing?.packet ?? null,
                lastRouteReasonCode: ladderDecision.reasonCode,
                updatedAtMs: Date.now(),
              };
            }
            if (attempt.source === "voice_auto") {
              markVoiceCheckpoint("dispatch_completed", "ok", "Reasoning dispatch completed.");
              const doneBriefBase =
                attempt.conversationBriefBase?.trim() ||
                buildConversationFallbackBrief({
                  transcript: attempt.recordedText ?? attempt.prompt,
                  mode: modeForAttempt,
                  clarifyNeeded: false,
                });
              updateVoiceDecisionBrief({
                baseBrief: doneBriefBase,
                lifecycle: "done",
                mode: modeForAttempt,
                routeReasonCode: attempt.routeReasonCode,
                traceId: attempt.traceId,
                meta: {
                  attemptId: attempt.id,
                  certaintyClass,
                  evidenceRefs,
                },
              });
              const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              if (segmentId) {
                patchVoiceSegmentAttempt(segmentId, { dispatch: "completed" });
                delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
              }
            }
          }
        } catch (error) {
          const isAbortError =
            (typeof DOMException !== "undefined" &&
              error instanceof DOMException &&
              error.name === "AbortError") ||
            (error instanceof Error && /abort/i.test(error.message));
          if (isAbortError && reasoningAttemptRestartRequestedRef.current.has(attempt.id)) {
            reasoningAttemptRestartRequestedRef.current.delete(attempt.id);
            reasoningAttemptQueueRef.current = [
              attempt.id,
              ...reasoningAttemptQueueRef.current.filter((id) => id !== attempt.id),
            ];
            updateReasoningAttempt(attempt.id, (current) => ({
              ...current,
              status: "queued",
              suppression_reason: "voice_turn_continuation_merged",
              partial: "",
              finalAnswer: undefined,
              events: [],
            }));
            patchHelixTimelineEntry(primaryTimelineEntryId, {
              status: "queued",
              detail: "continuation merged; restarting",
            });
            continue;
          }
          const message = error instanceof Error ? error.message : String(error);
          const supersededByNewerTurn =
            attempt.source === "voice_auto" && isVoiceTurnSupersededReason(message);
          const failureLifecycle: VoiceDecisionLifecycle = supersededByNewerTurn ? "suppressed" : "failed";
          const failureStatus: ReasoningAttempt["status"] = supersededByNewerTurn ? "suppressed" : "failed";
          updateReasoningAttempt(attempt.id, (current) => ({
            ...current,
            status: failureStatus,
            suppression_reason: message || "reasoning_failed",
            completedAtMs: Date.now(),
          }));
          patchHelixTimelineEntry(primaryTimelineEntryId, {
            status: supersededByNewerTurn ? "suppressed" : "failed",
            detail: clipText(
              formatVoiceDecisionSentence({
                lifecycle: failureLifecycle,
                mode: attempt.mode,
                routeReasonCode: attempt.routeReasonCode,
                failureReasonRaw: message,
              }),
              160,
            ),
          });
          const streamEntryId = reasoningStreamEntryByAttemptIdRef.current[attempt.id];
          if (streamEntryId) {
            patchHelixTimelineEntry(streamEntryId, {
              status: supersededByNewerTurn ? "suppressed" : "failed",
              detail: supersededByNewerTurn ? "superseded by newer turn" : "stream failed",
            });
            delete reasoningStreamEntryByAttemptIdRef.current[attempt.id];
          }
          addHelixTimelineEntry({
            type: "suppressed",
            source: attempt.source,
            status: "suppressed",
            text: clipText(
              formatVoiceDecisionSentence({
                lifecycle: failureLifecycle,
                mode: attempt.mode,
                routeReasonCode: attempt.routeReasonCode,
                failureReasonRaw: message,
              }),
              280,
            ),
            detail: supersededByNewerTurn ? "superseded by newer turn" : "reasoning attempt failed",
            mode: attempt.mode,
            traceId: attempt.traceId,
            attemptId: attempt.id,
            meta: {
              failReasonRaw: message || null,
            },
          });
          if (attempt.source === "voice_auto") {
            const failedBriefBase =
              attempt.conversationBriefBase?.trim() ||
              buildConversationFallbackBrief({
                transcript: attempt.recordedText ?? attempt.prompt,
                mode: attempt.mode,
                clarifyNeeded: false,
              });
            updateVoiceDecisionBrief({
              baseBrief: failedBriefBase,
              lifecycle: failureLifecycle,
              mode: attempt.mode,
              routeReasonCode: attempt.routeReasonCode,
              failReasonRaw: message,
              traceId: attempt.traceId,
              meta: {
                attemptId: attempt.id,
                errorMessage: message,
              },
            });
            const segmentId = voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
            if (segmentId) {
              patchVoiceSegmentAttempt(segmentId, { dispatch: "suppressed" });
              delete voiceReasoningAttemptSegmentByIdRef.current[attempt.id];
            }
          }
        } finally {
          unsubscribe();
          if (reasoningAttemptAbortAttemptIdRef.current === attempt.id) {
            reasoningAttemptAbortAttemptIdRef.current = null;
            reasoningAttemptAbortControllerRef.current = null;
          }
          reasoningAttemptCurrentIdRef.current = null;
          setAskBusy(false);
          setAskStatus(null);
          setAskLiveSessionId(null);
          setAskLiveTraceId(null);
          setAskLiveDraft("");
          askLiveDraftRef.current = "";
          askLiveDraftBufferRef.current = "";
          clearLiveDraftFlush();
          setAskActiveQuestion(null);
        }
      }
    } finally {
      reasoningAttemptRunnerRef.current = false;
    }
  }, [
    addMessage,
    addHelixTimelineEntry,
    askBusy,
    bumpVoiceTurnRevision,
    clearLiveDraftFlush,
    createReasoningAttempt,
    enqueueReasoningAttempt,
    enqueueVoiceAutoSpeakTask,
    ensureReasoningTimelineEntry,
    formatReasoningAttemptDetail,
    getHelixAskSessionId,
    getVoiceTurnAssemblerState,
    markVoiceCheckpoint,
    patchHelixTimelineEntry,
    patchVoiceSegmentAttempt,
    rememberConversationTurn,
    resetReasoningTheaterEventClock,
    resolveSelectedContextCapsuleIds,
    setActive,
    upsertContextCapsuleSessionLedger,
    updateVoiceDecisionBrief,
    updateReasoningAttempt,
    userSettings.showHelixAskDebug,
  ]);

  useEffect(() => {
    if (askBusy) return;
    if (reasoningAttemptRunnerRef.current) return;
    if (reasoningAttemptQueueRef.current.length === 0) return;
    void runReasoningAttemptQueue();
  }, [askBusy, runReasoningAttemptQueue]);

  const stopVoiceCapture = useCallback(
    (options?: { preserveChunks?: boolean }) => {
      if (voiceMonitorTimerRef.current !== null && typeof window !== "undefined") {
        window.clearInterval(voiceMonitorTimerRef.current);
        voiceMonitorTimerRef.current = null;
      }
      if (voiceCooldownTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(voiceCooldownTimerRef.current);
        voiceCooldownTimerRef.current = null;
      }
      if (voiceSegmentFlushTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(voiceSegmentFlushTimerRef.current);
        voiceSegmentFlushTimerRef.current = null;
      }
      const recorder = voiceRecorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // no-op
          }
        }
      }
      voiceRecorderRef.current = null;
      const stream = voiceStreamRef.current;
      if (stream) {
        const track = stream.getAudioTracks()[0];
        if (track) {
          track.onmute = null;
          track.onunmute = null;
          track.onended = null;
        }
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      voiceStreamRef.current = null;
      voiceSourceNodeRef.current?.disconnect();
      voiceSourceNodeRef.current = null;
      voiceSilenceGainNodeRef.current?.disconnect();
      voiceSilenceGainNodeRef.current = null;
      voiceAnalyserRef.current = null;
      if (voiceAudioContextRef.current) {
        void voiceAudioContextRef.current.close().catch(() => undefined);
        voiceAudioContextRef.current = null;
      }
      voiceSpeechCandidateStartMsRef.current = null;
      voiceSpeechActiveRef.current = false;
      voiceLastSpeechMsRef.current = null;
      voiceNoiseFloorRef.current = 0.006;
      voiceDisplayLevelRef.current = 0;
      voicePeakLevelRef.current = 0;
      voiceLevelUiLastMsRef.current = 0;
      voiceFlatWindowStartMsRef.current = null;
      voiceFlatMinRmsRef.current = Number.POSITIVE_INFINITY;
      voiceFlatMaxRmsRef.current = 0;
      voiceRecorderStartedAtMsRef.current = null;
      voiceLastChunkAtMsRef.current = null;
      voiceChunkCountRef.current = 0;
      voiceChunkBytesRef.current = 0;
      voiceReasoningAttemptSegmentByIdRef.current = {};
      voiceSegmentStartMsRef.current = null;
      voiceSegmentStartIndexRef.current = 0;
      voiceTranscribeQueueRef.current = [];
      voiceTranscribeBusyRef.current = false;
      clearVoiceSealPollTimer();
      voiceTurnAssemblerByTurnKeyRef.current = {};
      voiceActiveAssemblerTurnKeyRef.current = null;
      clearHeldTranscriptState();
      voiceTurnGameplayLoopStartedAtMsRef.current = null;
      setVoiceMonitorLevel(0);
      setVoiceMonitorThreshold(MIC_LEVEL_MIN_THRESHOLD);
      setVoiceSignalState("waiting");
      setVoiceMeterStats({
        rmsRaw: 0,
        rmsDb: -120,
        peak: 0,
        noiseFloor: 0.006,
        displayLevel: 0,
      });
      setVoiceRecorderStats({
        mediaChunkCount: 0,
        mediaBytes: 0,
        lastChunkAtMs: null,
        chunksPerSecond: 0,
      });
      setVoiceCaptureCheckpoints(createVoiceCaptureCheckpointMap());
      setVoiceCaptureWarnings([]);
      setVoiceSegmentAttempts([]);
      setVoiceLastRoundtripMs(null);
      setVoiceRecorderMimeType(null);
      setVoiceInputDeviceLabel(null);
      setVoiceTrackMuted(false);
      setTranscriptConfirmState(null);
      voiceTrackMutedRef.current = false;
      setConversationGovernor((prev) => ({
        ...prev,
        floor_owner: "none",
        turn_state: "hard_pause",
        cooling_down: false,
      }));
      if (!options?.preserveChunks) {
        voiceChunksRef.current = [];
      }
      voiceBargeResumeNotBeforeMsRef.current = null;
    },
    [clearHeldTranscriptState, clearVoiceSealPollTimer],
  );

  const dispatchConfirmedVoiceTranscript = useCallback(
    async (
      input: VoiceConfirmedTurn,
      authority?: {
        transcriptRevision: number;
        sealToken: string;
        sealedAtMs: number;
      },
    ) => {
      const transcript = input.transcript.trim();
      if (!transcript) return;
      const recordedText = input.recordedText?.trim() || transcript;
      replaceVoiceConversationTimelineEntry({
        type: "conversation_recorded",
        source: "voice_auto",
        status: "done",
        text: clipText(recordedText, 360),
        detail: input.translated
          ? `translated from ${input.sourceLanguage ?? "unknown"}`
          : "captured",
        traceId: input.traceId,
        meta: {
          engine: input.sttEngine,
          sourceLanguage: input.sourceLanguage,
          translated: input.translated,
          confidence: input.confidence,
          confidenceReason: input.confidenceReason,
          confirmed: true,
        },
      });
      const recentTurnsForTurn = conversationRecentTurnsRef.current.slice(-6);
      rememberConversationTurn(`user: ${recordedText}`);
      const sessionId = getHelixAskSessionId() ?? undefined;
      let conversationMode: "observe" | "act" | "verify" | "clarify" | undefined;
      let classifierConfidence: number | null = null;
      let classifierReason = "conversation_turn_fallback";
      let classifierSource: "llm" | "fallback" = "fallback";
      let dispatchHint = shouldDispatchReasoningAttempt(transcript);
      let dispatchReason = dispatchHint ? "dispatch:heuristic" : "suppressed:heuristic_low_salience";
      let routeReasonCode = dispatchReason;
      let explorationTurn = false;
      let clarifierPolicy: ConversationClarifierPolicy = "after_first_attempt";
      let explorationPacket: ConversationExplorationPacket | null = null;
      let failReason: string | null = null;
      let briefText = buildConversationFallbackBrief({
        transcript,
        mode: input.completion.route === "ask_more" ? "clarify" : undefined,
        clarifyNeeded: input.completion.route === "ask_more",
      });
      try {
        const conversation = await runConversationTurn({
          transcript,
          sessionId,
          traceId: input.traceId,
          missionId: contextId,
          sourceLanguage: input.sourceLanguage ?? undefined,
          translated: input.translated,
          recentTurns: recentTurnsForTurn,
        });
        conversationMode = conversation.classification?.mode;
        classifierConfidence = conversation.classification?.confidence ?? null;
        classifierReason = conversation.classification?.reason?.trim() || classifierReason;
        classifierSource = conversation.classification?.source ?? classifierSource;
        routeReasonCode =
          conversation.route_reason_code?.trim() ||
          conversation.dispatch?.reason?.trim() ||
          routeReasonCode;
        explorationTurn = conversation.exploration_turn === true;
        clarifierPolicy = conversation.clarifier_policy ?? "after_first_attempt";
        explorationPacket = conversation.exploration_packet ?? null;
        dispatchHint =
          conversation.dispatch?.dispatch_hint ??
          conversation.classification?.dispatch_hint ??
          dispatchHint;
        dispatchReason =
          routeReasonCode ||
          (dispatchHint ? `dispatch:${conversationMode ?? "unknown"}` : "suppressed:low_salience");
        if (explorationTurn && conversationMode !== "act" && conversationMode !== "verify") {
          conversationMode = "observe";
        }
        failReason = conversation.fail_reason ?? null;
        const briefCandidate = conversation.brief?.text?.trim() ?? "";
        if (briefCandidate) {
          briefText = briefCandidate;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failReason = "conversation_turn_client_fallback";
        classifierReason = clipText(message || classifierReason, 160);
      }
      if (
        shouldForceObserveDispatchFromSuppression({
          dispatchHint,
          routeReasonCode,
          transcript,
        })
      ) {
        dispatchHint = true;
        conversationMode = conversationMode === "act" || conversationMode === "verify" ? conversationMode : "observe";
        routeReasonCode = "dispatch:observe_explore_forced";
        dispatchReason = routeReasonCode;
      }
      const predictiveBrief = buildPredictiveBriefFromTranscript(transcript);
      if (
        isGenericQueuedVoiceAcknowledgement(briefText) ||
        isBriefEchoingTranscript(briefText, transcript)
      ) {
        briefText = predictiveBrief || buildDeterministicQueuedBriefFromTranscript(transcript);
      }
      briefText = sanitizeConversationBriefTextForVoice(briefText, 520);
      if (!dispatchHint) {
        updateVoiceDecisionBrief({
          baseBrief: briefText,
          lifecycle: "suppressed",
          mode: conversationMode,
          routeReasonCode,
          failReasonRaw: failReason,
          traceId: input.traceId,
          meta: {
            dispatchHint,
            classifierSource,
            classifierConfidence,
            classifierReason,
            routeReasonCode,
            explorationTurn,
            clarifierPolicy,
            failReason,
            confidence: input.confidence,
            confidenceReason: input.confidenceReason,
          },
        });
        markVoiceCheckpoint("dispatch_suppressed", "ok", "Dispatch suppressed for confirmed turn.");
        patchVoiceSegmentAttempt(input.segmentId, { dispatch: "suppressed" });
        return;
      }
      const dispatchMode =
        normalizeConversationModeForDispatch(conversationMode) ??
        normalizeConversationModeForDispatch(inferAskMode(transcript));
      suppressSupersededVoiceAttemptsForNewTurn(input.traceId);
      const selectedCapsuleIds = resolveSelectedContextCapsuleIds(transcript, undefined, {
        source: "voice_auto",
      });
      const pinnedCapsuleCount = getPinnedContextCapsuleCount();
      const queuedAttempt = createReasoningAttempt({
        prompt: transcript,
        dispatchPrompt: buildVoiceReasoningDispatchPrompt({
          transcript,
          recentTurns: recentTurnsForTurn,
          explorationPacket,
        }),
        recordedText,
        contextCapsuleIds: selectedCapsuleIds,
        contextCapsuleCount: selectedCapsuleIds.length,
        contextCapsulePinnedCount: pinnedCapsuleCount,
        source: "voice_auto",
        profile: "dot_min_steps_v1",
        mode: dispatchMode,
        status: "queued",
        routeReasonCode,
        explorationTurn,
        clarifierPolicy,
        explorationPacket,
        completionScore: input.completion.score,
        turnCompleteScore: input.turnComplete.score,
        floorOwner: "none",
        sttEngine: input.sttEngine ?? undefined,
        sourceLanguage: input.sourceLanguage,
        translated: input.translated,
        conversationBriefBase: briefText,
        traceId: input.traceId,
        transcriptRevision:
          typeof authority?.transcriptRevision === "number" &&
          Number.isFinite(authority.transcriptRevision)
            ? Math.max(0, Math.floor(authority.transcriptRevision))
            : undefined,
        sealToken: authority?.sealToken ?? null,
        sealedAtMs:
          typeof authority?.sealedAtMs === "number" && Number.isFinite(authority.sealedAtMs)
            ? Math.max(0, Math.floor(authority.sealedAtMs))
            : null,
      });
      const transcriptRevision =
        typeof authority?.transcriptRevision === "number" && Number.isFinite(authority.transcriptRevision)
          ? Math.max(0, Math.floor(authority.transcriptRevision))
          : bumpVoiceTurnRevision(queuedAttempt.traceId, "transcript").revision;
      setIntentRevisionState({
        turnKey: queuedAttempt.traceId,
        revision: transcriptRevision,
        topicTerms: extractIntentTerms(transcript, 12),
        mode: conversationMode ?? dispatchMode ?? null,
        dispatchPromptHash: hashVoiceUtteranceKey(queuedAttempt.dispatchPrompt ?? queuedAttempt.prompt),
        updatedAtMs: Date.now(),
      });
      updateReasoningAttempt(queuedAttempt.id, (current) => ({
        ...current,
        intentRevision: transcriptRevision,
        transcriptRevision,
        sealToken: authority?.sealToken ?? current.sealToken ?? null,
        sealedAtMs:
          typeof authority?.sealedAtMs === "number" && Number.isFinite(authority.sealedAtMs)
            ? Math.max(0, Math.floor(authority.sealedAtMs))
            : current.sealedAtMs ?? null,
      }));
      ensureReasoningTimelineEntry(queuedAttempt, "queued");
      markVoiceCheckpoint("dispatch_queued", "ok", "Reasoning dispatch queued.");
      patchVoiceSegmentAttempt(input.segmentId, { dispatch: "queued" });
      updateVoiceDecisionBrief({
        baseBrief: briefText,
        lifecycle: "queued",
        mode: conversationMode ?? dispatchMode,
        routeReasonCode,
        traceId: queuedAttempt.traceId,
        meta: {
          attemptId: queuedAttempt.id,
          transcript,
          dispatchHint,
          classifierSource,
          classifierConfidence,
          classifierReason,
          routeReasonCode,
          explorationTurn,
          clarifierPolicy,
            failReason,
            transcriptRevision,
            confidence: input.confidence,
            confidenceReason: input.confidenceReason,
            confirmed: true,
        },
      });
      enqueueReasoningAttempt(queuedAttempt.id);
      void runReasoningAttemptQueue();
      rememberConversationTurn(`dottie: ${briefText}`);
    },
    [
      bumpVoiceTurnRevision,
      contextId,
      createReasoningAttempt,
      enqueueReasoningAttempt,
      ensureReasoningTimelineEntry,
      getHelixAskSessionId,
      getPinnedContextCapsuleCount,
      markVoiceCheckpoint,
      patchVoiceSegmentAttempt,
      rememberConversationTurn,
      replaceVoiceConversationTimelineEntry,
      resolveSelectedContextCapsuleIds,
      runReasoningAttemptQueue,
      setIntentRevisionState,
      suppressSupersededVoiceAttemptsForNewTurn,
      updateReasoningAttempt,
      updateVoiceDecisionBrief,
    ],
  );

  const hasActiveVoiceAttemptForTurn = useCallback((turnKey: string): boolean => {
    return reasoningAttemptsRef.current.some(
      (attempt) =>
        attempt.source === "voice_auto" &&
        attempt.traceId === turnKey &&
        (attempt.status === "queued" || attempt.status === "running" || attempt.status === "streaming"),
    );
  }, []);

  const evaluateAndDispatchVoiceSeal = useCallback(
    (turnKey: string) => {
      const state = getVoiceTurnAssemblerState(turnKey);
      if (!state) return;
      const now = Date.now();
      const queueDepth = voiceTranscribeQueueRef.current.length;
      const inFlight = voiceTranscribeBusyRef.current;
      const heldPending =
        transcriptConfirmStateRef.current !== null ||
        voiceHeldTranscriptStateRef.current !== null ||
        voiceHeldTranscriptPrefixRef.current.trim().length > 0;
      const sinceLastSpeechMs =
        voiceLastSpeechMsRef.current !== null
          ? Math.max(0, now - voiceLastSpeechMsRef.current)
          : Number.POSITIVE_INFINITY;
      const hashStableDwellMs = Math.max(0, now - state.hashStableSinceMs);
      const gateOpen = evaluateVoiceTurnSealGate({
        sinceLastSpeechMs,
        sttQueueDepth: queueDepth,
        sttInFlight: inFlight,
        heldPending,
        hashStableDwellMs,
      });
      updateVoiceTurnAssemblerState(turnKey, (current) => ({
        ...current,
        sttQueueDepth: queueDepth,
        sttInFlight: inFlight,
        heldPending,
        lastSpeechAtMs: voiceLastSpeechMsRef.current ?? current.lastSpeechAtMs,
      }));
      if (state.phase !== "draft" || !gateOpen) {
        clearVoiceSealPollTimer();
        if (
          state.phase === "draft" &&
          micArmStateRef.current === "on" &&
          voiceActiveAssemblerTurnKeyRef.current === turnKey &&
          typeof window !== "undefined"
        ) {
          voiceSealPollTimerRef.current = window.setTimeout(() => {
            voiceSealPollTimerRef.current = null;
            evaluateAndDispatchVoiceSeal(turnKey);
          }, VOICE_TURN_SEAL_POLL_MS);
        }
        return;
      }
      const sealedRevision = state.transcriptRevision;
      if (sealedRevision <= 0 || !state.draftTranscript.trim()) {
        return;
      }
      const sealToken = crypto.randomUUID();
      updateVoiceTurnAssemblerState(turnKey, (current) => ({
        ...current,
        phase: "sealed",
        sealedRevision,
        sealToken,
        sealedAtMs: now,
        sttQueueDepth: queueDepth,
        sttInFlight: inFlight,
        heldPending,
      }));
      const sealedTurn: VoiceConfirmedTurn = {
        id: `confirm:${turnKey}:sealed:${sealedRevision}`,
        traceId: turnKey,
        segmentId: state.segmentId ?? `segment:${crypto.randomUUID()}`,
        transcript: state.draftTranscript,
        recordedText: state.draftRecordedText || state.draftTranscript,
        completion: state.completion,
        turnComplete: state.turnComplete,
        sttEngine: state.sttEngine,
        sourceLanguage: state.sourceLanguage,
        translated: state.translated,
        confidence: state.confidence,
        confidenceReason: state.confidenceReason,
        needsConfirmation: false,
        translationUncertain: false,
      };
      void dispatchConfirmedVoiceTranscript(sealedTurn, {
        transcriptRevision: sealedRevision,
        sealToken,
        sealedAtMs: now,
      });
    },
    [
      clearVoiceSealPollTimer,
      dispatchConfirmedVoiceTranscript,
      getVoiceTurnAssemblerState,
      updateVoiceTurnAssemblerState,
    ],
  );

  const scheduleVoiceSealEvaluation = useCallback(
    (turnKey: string, delayMs = VOICE_TURN_SEAL_POLL_MS) => {
      clearVoiceSealPollTimer();
      if (micArmStateRef.current !== "on" || typeof window === "undefined") return;
      voiceSealPollTimerRef.current = window.setTimeout(() => {
        voiceSealPollTimerRef.current = null;
        evaluateAndDispatchVoiceSeal(turnKey);
      }, Math.max(0, delayMs));
    },
    [clearVoiceSealPollTimer, evaluateAndDispatchVoiceSeal],
  );

  const reopenVoiceAssemblerDraft = useCallback(
    (turnKey: string, reason: string) => {
      suppressActiveVoiceAttemptsForTurn({
        turnKey,
        reason,
        detail: "awaiting reseal after interruption",
        patchSegmentDispatch: "suppressed",
      });
      updateVoiceTurnAssemblerState(turnKey, (current) => ({
        ...current,
        phase: "draft",
        sealToken: null,
        sealedAtMs: null,
      }));
      clearVoiceSealPollTimer();
      scheduleVoiceSealEvaluation(turnKey);
    },
    [
      clearVoiceSealPollTimer,
      scheduleVoiceSealEvaluation,
      suppressActiveVoiceAttemptsForTurn,
      updateVoiceTurnAssemblerState,
    ],
  );

  const resolveVoiceAssemblerTurnKeyForIncomingSegment = useCallback((): string => {
    const currentTurnKey = voiceActiveAssemblerTurnKeyRef.current;
    if (!currentTurnKey) {
      const nextTurnKey = `voice:${crypto.randomUUID()}`;
      voiceActiveAssemblerTurnKeyRef.current = nextTurnKey;
      updateVoiceTurnAssemblerState(nextTurnKey, (current) => ({
        ...current,
        phase: "draft",
        lastSpeechAtMs: Date.now(),
      }));
      suppressSupersededVoiceAttemptsForNewTurn(nextTurnKey);
      return nextTurnKey;
    }
    const currentState = getVoiceTurnAssemblerState(currentTurnKey);
    const activeAttempt = hasActiveVoiceAttemptForTurn(currentTurnKey);
    if (!currentState || (currentState.phase === "sealed" && !activeAttempt)) {
      const nextTurnKey = `voice:${crypto.randomUUID()}`;
      voiceActiveAssemblerTurnKeyRef.current = nextTurnKey;
      updateVoiceTurnAssemblerState(nextTurnKey, (current) => ({
        ...current,
        phase: "draft",
        lastSpeechAtMs: Date.now(),
      }));
      suppressSupersededVoiceAttemptsForNewTurn(nextTurnKey);
      return nextTurnKey;
    }
    return currentTurnKey;
  }, [
    getVoiceTurnAssemblerState,
    hasActiveVoiceAttemptForTurn,
    suppressSupersededVoiceAttemptsForNewTurn,
    updateVoiceTurnAssemblerState,
  ]);

  const ingestVoiceDraftSegment = useCallback(
    (input: {
      turnKey: string;
      segmentId: string;
      transcript: string;
      recordedText: string;
      sourceLanguage: string | null;
      translated: boolean;
      sttEngine: string | null;
      confidence: number;
      confidenceReason: string | null;
      completion: CompletionScore;
      turnComplete: TurnCompleteScore;
    }) => {
      const transcript = input.transcript.trim();
      if (!transcript) return null;
      const now = Date.now();
      const assembler = updateVoiceTurnAssemblerState(input.turnKey, (current) => {
        const mergedTranscript = mergeVoiceTranscriptDraft(current.draftTranscript, transcript);
        const mergedRecordedText = mergeVoiceTranscriptDraft(
          current.draftRecordedText || current.draftTranscript,
          input.recordedText || transcript,
        );
        const nextHash = hashVoiceUtteranceKey(mergedTranscript);
        const hashStableSinceMs =
          nextHash === current.currentTranscriptHash ? current.hashStableSinceMs : now;
        return {
          ...current,
          phase: "draft",
          transcriptRevision: current.transcriptRevision + 1,
          sealToken: null,
          sealedAtMs: null,
          draftTranscript: mergedTranscript,
          draftRecordedText: mergedRecordedText,
          lastSpeechAtMs: voiceLastSpeechMsRef.current ?? now,
          hashStableSinceMs,
          currentTranscriptHash: nextHash,
          sttQueueDepth: voiceTranscribeQueueRef.current.length,
          sttInFlight: voiceTranscribeBusyRef.current,
          heldPending:
            transcriptConfirmStateRef.current !== null ||
            voiceHeldTranscriptStateRef.current !== null ||
            voiceHeldTranscriptPrefixRef.current.trim().length > 0,
          sourceLanguage: input.sourceLanguage,
          translated: input.translated,
          sttEngine: input.sttEngine,
          confidence: input.confidence,
          confidenceReason: input.confidenceReason,
          completion: input.completion,
          turnComplete: input.turnComplete,
          segmentId: input.segmentId,
        };
      });
      voiceActiveAssemblerTurnKeyRef.current = input.turnKey;
      replaceVoiceConversationTimelineEntry({
        type: "conversation_recorded",
        source: "voice_auto",
        status: "done",
        text: clipText(assembler.draftRecordedText || assembler.draftTranscript, 360),
        detail: input.translated
          ? `translated from ${input.sourceLanguage ?? "unknown"}`
          : "captured",
        traceId: input.turnKey,
        meta: {
          engine: input.sttEngine,
          sourceLanguage: input.sourceLanguage,
          translated: input.translated,
          confidence: input.confidence,
          confidenceReason: input.confidenceReason,
          transcriptRevision: assembler.transcriptRevision,
        },
      });
      suppressActiveVoiceAttemptsForTurn({
        turnKey: input.turnKey,
        reason: "voice_turn_reopened_pending_seal",
        detail: "draft revision advanced; awaiting reseal",
      });
      const nextDraft = mergeVoiceTranscriptDraft(askDraftRef.current, transcript);
      syncAskDraftValue(nextDraft, {
        focus: true,
        forceMoodHint: true,
      });
      scheduleVoiceSealEvaluation(input.turnKey);
      return assembler;
    },
    [
      replaceVoiceConversationTimelineEntry,
      scheduleVoiceSealEvaluation,
      suppressActiveVoiceAttemptsForTurn,
      syncAskDraftValue,
      updateVoiceTurnAssemblerState,
    ],
  );

  const processTranscriptionQueue = useCallback(async () => {
    if (voiceTranscribeBusyRef.current) return;
    voiceTranscribeBusyRef.current = true;
    const scheduleHeldTranscriptFlush = (heldState: HeldTranscriptState) => {
      clearHeldTranscriptFlushTimer();
      voiceHeldTranscriptStateRef.current = heldState;
      if (typeof window === "undefined") return;
      voiceHeldTranscriptFlushTimerRef.current = window.setTimeout(() => {
        voiceHeldTranscriptFlushTimerRef.current = null;
        const pendingHeld = voiceHeldTranscriptStateRef.current;
        if (!pendingHeld) return;
        const now = Date.now();
        const ageMs = Math.max(0, now - pendingHeld.updatedAtMs);
        const sinceLastSpeechMs =
          voiceLastSpeechMsRef.current !== null
            ? Math.max(0, now - voiceLastSpeechMsRef.current)
            : Number.POSITIVE_INFINITY;
        const shouldFlushHeld = shouldFlushHeldTranscriptFromWatchdog({
          heldTranscript: pendingHeld.transcript,
          holdReason: pendingHeld.holdReason,
          transcribeQueueLength: voiceTranscribeQueueRef.current.length,
          speechActive: voiceSpeechActiveRef.current,
          transcribeBusy: voiceTranscribeBusyRef.current,
          pendingConfirmation: transcriptConfirmStateRef.current !== null,
          sinceLastSpeechMs,
          ageMs,
        });
        if (!shouldFlushHeld) {
          if (
            micArmStateRef.current !== "on" ||
            ageMs >= VOICE_HELD_TRANSCRIPT_MAX_AGE_MS
          ) {
            clearHeldTranscriptState();
            return;
          }
          scheduleHeldTranscriptFlush(pendingHeld);
          return;
        }
        resolveBargeInFromTranscription(true);
        stopReadAloud("barge_in");
        setTranscriptConfirmState(null);
        clearHeldTranscriptState();
        const recoveredTurn: VoiceConfirmedTurn = {
          id: `confirm:${pendingHeld.traceId}:held_watchdog`,
          traceId: pendingHeld.traceId,
          segmentId: pendingHeld.segmentId,
          transcript: pendingHeld.transcript,
          recordedText: pendingHeld.recordedText,
          sourceLanguage: pendingHeld.sourceLanguage,
          translated: pendingHeld.translated,
          translationUncertain: false,
          confidence: pendingHeld.confidence,
          confidenceReason: pendingHeld.confidenceReason,
          completion: pendingHeld.completion,
          turnComplete: pendingHeld.turnComplete,
          sttEngine: pendingHeld.sttEngine,
          needsConfirmation: false,
        };
        voiceConfirmedTurnQueueRef.current.unshift(recoveredTurn);
        patchVoiceSegmentAttempt(pendingHeld.segmentId, {
          status: "stt_ok",
          dispatch: "queued",
          transcriptPreview: clipText(pendingHeld.transcript, 180),
          translated: pendingHeld.translated,
          engine: pendingHeld.sttEngine,
          error: null,
        });
        markVoiceCheckpoint(
          "dispatch_queued",
          "ok",
          "Held transcript auto-dispatched after continuation guard timeout.",
        );
        setVoiceInputError(null);
        setVoiceInputState("transcribing");
        void processTranscriptionQueue();
      }, VOICE_HELD_TRANSCRIPT_FLUSH_MS);
    };
    try {
      while (
        (voiceConfirmedTurnQueueRef.current.length > 0 || voiceTranscribeQueueRef.current.length > 0) &&
        micArmState === "on"
      ) {
        const confirmedTurn = voiceConfirmedTurnQueueRef.current.shift();
        if (confirmedTurn) {
          clearHeldTranscriptState();
          setVoiceInputState("transcribing");
          ingestVoiceDraftSegment({
            turnKey: confirmedTurn.traceId,
            segmentId: confirmedTurn.segmentId,
            transcript: confirmedTurn.transcript,
            recordedText: confirmedTurn.recordedText,
            sourceLanguage: confirmedTurn.sourceLanguage,
            translated: confirmedTurn.translated,
            sttEngine: confirmedTurn.sttEngine,
            confidence: confirmedTurn.confidence,
            confidenceReason: confirmedTurn.confidenceReason,
            completion: confirmedTurn.completion,
            turnComplete: confirmedTurn.turnComplete,
          });
          setVoiceInputError(null);
          setVoiceInputState("cooldown");
          if (voiceCooldownTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(voiceCooldownTimerRef.current);
          }
          if (typeof window !== "undefined") {
            voiceCooldownTimerRef.current = window.setTimeout(() => {
              voiceCooldownTimerRef.current = null;
              if (micArmStateRef.current === "on") {
                setVoiceInputState("listening");
                setConversationGovernor((prev) => ({ ...prev, cooling_down: false }));
              }
            }, MIC_POST_TRANSCRIBE_COOLDOWN_MS);
          }
          continue;
        }
        const nextSegment = voiceTranscribeQueueRef.current.shift();
        if (!nextSegment) continue;
        setVoiceInputState("transcribing");
        markVoiceCheckpoint("stt_request_started", "ok", "Submitting segment to STT.");
        markVoiceCheckpoint("stt_response_error", "idle", "No STT error.");
        patchVoiceSegmentAttempt(nextSegment.id, { status: "transcribing" });
        const traceId = nextSegment.turnKey;
        const sttStartedAt = Date.now();
        try {
          const result = await transcribeVoice({
            audio: nextSegment.blob,
            traceId,
            missionId: contextId,
            durationMs: nextSegment.durationMs,
          });
          const sttLatencyMs = Date.now() - sttStartedAt;
          const transcript = result.text?.trim() ?? "";
          if (!transcript) {
            const heldTranscript = voiceHeldTranscriptPrefixRef.current.trim();
            const heldTurnComplete = heldTranscript
              ? scoreVoiceTurnComplete({
                  transcript: heldTranscript,
                  pauseMs: MIC_END_TURN_MS,
                  stability: 0.92,
                })
              : null;
            const sinceLastSpeechMs =
              voiceLastSpeechMsRef.current !== null
                ? Math.max(0, Date.now() - voiceLastSpeechMsRef.current)
                : Number.POSITIVE_INFINITY;
            const recoverHeldTranscript =
              heldTurnComplete !== null &&
              shouldRecoverHeldTranscriptAfterNoTranscript({
                heldTranscript,
                turnCompleteBand: heldTurnComplete.band,
                transcribeQueueLength: voiceTranscribeQueueRef.current.length,
                speechActive: voiceSpeechActiveRef.current,
                sinceLastSpeechMs,
              });
            if (recoverHeldTranscript) {
              resolveBargeInFromTranscription(true);
              stopReadAloud("barge_in");
              setTranscriptConfirmState(null);
              clearHeldTranscriptState();
              const recoveredConfidence = deriveTranscriptConfidence({
                transcript: heldTranscript,
              });
              const recoveredCompletion = scoreConversationCompletion({
                transcript: heldTranscript,
                pauseMs: MIC_END_TURN_MS,
                stability: 0.92,
              });
              const recoveredTurn: VoiceConfirmedTurn = {
                id: `confirm:${traceId}:held_recovery`,
                traceId,
                segmentId: nextSegment.id,
                transcript: heldTranscript,
                recordedText: result.source_text?.trim() || heldTranscript,
                sourceLanguage: result.source_language ?? result.language ?? null,
                translated: Boolean(result.translated),
                translationUncertain: false,
                confidence: Math.max(VOICE_STT_CONFIRM_THRESHOLD, recoveredConfidence.confidence),
                confidenceReason: "held_transcript_recovery",
                completion: recoveredCompletion,
                turnComplete: heldTurnComplete,
                sttEngine: result.engine ?? null,
                needsConfirmation: false,
              };
              voiceConfirmedTurnQueueRef.current.unshift(recoveredTurn);
              patchVoiceSegmentAttempt(nextSegment.id, {
                status: "stt_ok",
                sttLatencyMs,
                transcriptPreview: clipText(heldTranscript, 180),
                translated: Boolean(result.translated),
                engine: result.engine ?? null,
                error: null,
                dispatch: "queued",
              });
              markVoiceCheckpoint(
                "stt_response_ok",
                "ok",
                "Recovered held transcript after no follow-up transcript.",
                sttLatencyMs,
              );
              setVoiceInputError(null);
              setVoiceInputState("transcribing");
              continue;
            }
            resolveBargeInFromTranscription(false);
            markVoiceCheckpoint(
              "stt_response_error",
              "warn",
              "No transcript detected; continuing playback.",
            );
            patchVoiceSegmentAttempt(nextSegment.id, {
              status: "stt_error",
              sttLatencyMs,
              transcriptPreview: null,
              translated: false,
              engine: result.engine ?? null,
              error: "no_transcript",
              dispatch: "none",
            });
            setVoiceInputError(null);
            setVoiceInputState("listening");
            setConversationGovernor((prev) => ({
              ...prev,
              floor_owner: "none",
              turn_state: "hard_pause",
              cooling_down: false,
            }));
            voiceTurnGameplayLoopStartedAtMsRef.current = null;
            continue;
          }
          resolveBargeInFromTranscription(true);
          stopReadAloud("barge_in");
          setTranscriptConfirmState(null);
          markVoiceCheckpoint(
            "stt_response_ok",
            "ok",
            `STT returned ${transcript.length} chars.`,
            sttLatencyMs,
          );
          markVoiceCheckpoint("stt_response_error", "idle", "No STT error.");
          if (result.translated) {
            markVoiceCheckpoint(
              "translated",
              "ok",
              `Translated ${result.source_language ?? "source"} -> ${result.language ?? "en"}.`,
            );
          } else {
            markVoiceCheckpoint("translated", "idle", "No translation needed.");
          }
          const heldTranscriptPrefix = voiceHeldTranscriptPrefixRef.current.trim();
          const heldState = voiceHeldTranscriptStateRef.current;
          const heldAgeMs =
            heldState !== null ? Math.max(0, Date.now() - heldState.updatedAtMs) : Number.POSITIVE_INFINITY;
          const canApplyHeldPrefix =
            heldTranscriptPrefix.length > 0 &&
            (!heldState ||
              heldAgeMs <= VOICE_TRANSCRIPTION_BREATH_WINDOW_MS * 2 ||
              heldAgeMs <= VOICE_TURN_GAMEPLAY_LOOP_MAX_MS ||
              shouldMergeVoiceContinuationTurn({
                previousPrompt: heldTranscriptPrefix,
                nextTranscript: transcript,
                gapMs: heldAgeMs,
              }));
          const mergedTranscript = canApplyHeldPrefix
            ? mergeVoiceTranscriptDraft(heldTranscriptPrefix, transcript)
            : transcript;
          if (voiceTurnGameplayLoopStartedAtMsRef.current === null) {
            voiceTurnGameplayLoopStartedAtMsRef.current = Date.now();
          }
          clearHeldTranscriptFlushTimer();
          if (!canApplyHeldPrefix && heldTranscriptPrefix.length > 0) {
            clearHeldTranscriptState();
          } else {
            voiceHeldTranscriptStateRef.current = null;
          }
          const confidenceMeta = deriveTranscriptConfidence({
            transcript: mergedTranscript,
            providerConfidence: result.confidence ?? null,
            segments: result.segments,
          });
          const translationUncertain =
            result.translation_uncertain === true ||
            (Boolean(result.translated) &&
              confidenceMeta.confidence < VOICE_STT_TRANSLATION_CONFIRM_THRESHOLD);
          const needsConfirmation = shouldRequireTranscriptConfirmation({
            confidence: confidenceMeta.confidence,
            translationUncertain,
            providerNeedsConfirmation: result.needs_confirmation === true,
          });
          const turnComplete = scoreVoiceTurnComplete({
            transcript: mergedTranscript,
            pauseMs: MIC_END_TURN_MS,
            stability: 1,
          });
          const completion = scoreConversationCompletion({
            transcript: mergedTranscript,
            pauseMs: MIC_END_TURN_MS,
            stability: 1,
          });
          const nextDraft = mergeVoiceTranscriptDraft(askDraftRef.current, mergedTranscript);
          syncAskDraftValue(nextDraft, {
            focus: true,
            forceMoodHint: true,
          });
          const roundtripMs = Math.max(0, Date.now() - nextSegment.cutAtMs);
          setVoiceLastRoundtripMs(roundtripMs);
          markVoiceCheckpoint(
            "draft_appended",
            "ok",
            `Draft updated from captured segment.`,
            roundtripMs,
          );
          patchVoiceSegmentAttempt(nextSegment.id, {
            status: "stt_ok",
            sttLatencyMs,
            transcriptPreview: clipText(mergedTranscript, 180),
            translated: Boolean(result.translated),
            engine: result.engine ?? null,
            error: null,
          });
          if (needsConfirmation) {
            setTranscriptConfirmState({
              id: `confirm:${traceId}`,
              traceId,
              missionId: contextId,
              segmentId: nextSegment.id,
              transcript: mergedTranscript,
              sourceText: result.source_text ?? null,
              sourceLanguage: result.source_language ?? result.language ?? null,
              translated: Boolean(result.translated),
              translationUncertain,
              confidence: confidenceMeta.confidence,
              confidenceReason: result.confidence_reason ?? confidenceMeta.reason,
              completion,
              turnComplete,
              sttEngine: result.engine ?? null,
            });
            clearHeldTranscriptState();
            markVoiceCheckpoint(
              "stt_response_error",
              "warn",
              "Transcript needs confirmation before reasoning dispatch.",
            );
            patchVoiceSegmentAttempt(nextSegment.id, { dispatch: "none" });
            setVoiceInputState("listening");
            setConversationGovernor((prev) => ({
              ...prev,
              floor_owner: "none",
              turn_state: "soft_pause",
              cooling_down: false,
            }));
            continue;
          }
          const openQuestionTail = /\b(how|why|what|where|when|who)\s+(does|do|is|are|can|could|would|will|did)?\s*$/i.test(
            mergedTranscript.trim(),
          );
          const danglingTail = hasDanglingTurnTail(mergedTranscript);
          const initialTurnCloseHoldMs =
            openQuestionTail
              ? Math.max(VOICE_TURN_COMPLETE_MEDIUM_HOLD_MS, 1000)
              : danglingTail
                ? Math.max(VOICE_TURN_COMPLETE_MEDIUM_HOLD_MS, 1200)
              : turnComplete.band === "high"
                ? Math.max(VOICE_TURN_COMPLETE_MEDIUM_HOLD_MS, 520)
                : turnComplete.band === "medium"
                  ? VOICE_TURN_COMPLETE_MEDIUM_HOLD_MS
                  : VOICE_TURN_COMPLETE_LOW_HOLD_MS;
          if (typeof window !== "undefined") {
            await new Promise<void>((resolve) => {
              window.setTimeout(() => resolve(), initialTurnCloseHoldMs);
            });
          }
          const continuationWindowMs =
            danglingTail || openQuestionTail
              ? VOICE_TRANSCRIPTION_BREATH_WINDOW_MS * 2
              : VOICE_TRANSCRIPTION_BREATH_WINDOW_MS;
          const sinceLastSpeechAfterHoldMs =
            voiceLastSpeechMsRef.current !== null
              ? Math.max(0, Date.now() - voiceLastSpeechMsRef.current)
              : Number.POSITIVE_INFINITY;
          const hasHardContinuationSignal =
            voiceTranscribeQueueRef.current.length > 0 ||
            voiceSpeechActiveRef.current ||
            voiceTranscribeBusyRef.current;
          const hasContinuationAfterHold =
            micArmStateRef.current === "on" &&
            (hasHardContinuationSignal || sinceLastSpeechAfterHoldMs < continuationWindowMs);
          const gameplayLoopStartedAtMs = voiceTurnGameplayLoopStartedAtMsRef.current ?? Date.now();
          const gameplayLoopAgeMs = Math.max(0, Date.now() - gameplayLoopStartedAtMs);
          const gameplayLoopOpen = gameplayLoopAgeMs < VOICE_TURN_GAMEPLAY_LOOP_MAX_MS;
          const shouldHoldForTurnClose =
            hasHardContinuationSignal ||
            (gameplayLoopOpen &&
              (turnComplete.band !== "high" ||
                openQuestionTail ||
                danglingTail ||
                hasContinuationAfterHold ||
                sinceLastSpeechAfterHoldMs < VOICE_TURN_CLOSE_SILENCE_MS));
          if (shouldHoldForTurnClose) {
            const heldTranscript = clipText(mergedTranscript, 720);
            voiceHeldTranscriptPrefixRef.current = heldTranscript;
            scheduleHeldTranscriptFlush({
              transcript: heldTranscript,
              traceId,
              segmentId: nextSegment.id,
              recordedText: result.source_text?.trim() || mergedTranscript,
              sourceLanguage: result.source_language ?? result.language ?? null,
              translated: Boolean(result.translated),
              sttEngine: result.engine ?? null,
              confidence: Math.max(VOICE_STT_CONFIRM_THRESHOLD, confidenceMeta.confidence),
              confidenceReason: result.confidence_reason ?? confidenceMeta.reason,
              completion,
              turnComplete,
              holdReason: "continuation_hold",
              updatedAtMs: Date.now(),
            });
            const holdReason = hasHardContinuationSignal
              ? "active_signal"
              : openQuestionTail
                ? "question_tail"
                : danglingTail
                  ? "dangling_tail"
                  : turnComplete.band !== "high"
                    ? turnComplete.band
                    : "turn_close_guard";
            markVoiceCheckpoint(
              "segment_cut",
              "ok",
              `Holding turn for continuity (${holdReason}).`,
            );
            patchVoiceSegmentAttempt(nextSegment.id, { dispatch: "none" });
            setVoiceInputState("listening");
            continue;
          }
          const hasActiveVoiceReasoningAttempt = reasoningAttemptsRef.current.some(
            (entry) =>
              entry.source === "voice_auto" &&
              (entry.status === "queued" || entry.status === "running" || entry.status === "streaming"),
          );
          if (isLowInformationTailTranscript(mergedTranscript) && hasActiveVoiceReasoningAttempt) {
            const heldTranscript = clipText(mergedTranscript, 720);
            voiceHeldTranscriptPrefixRef.current = heldTranscript;
            scheduleHeldTranscriptFlush({
              transcript: heldTranscript,
              traceId,
              segmentId: nextSegment.id,
              recordedText: result.source_text?.trim() || mergedTranscript,
              sourceLanguage: result.source_language ?? result.language ?? null,
              translated: Boolean(result.translated),
              sttEngine: result.engine ?? null,
              confidence: Math.max(VOICE_STT_CONFIRM_THRESHOLD, confidenceMeta.confidence),
              confidenceReason: result.confidence_reason ?? confidenceMeta.reason,
              completion,
              turnComplete,
              holdReason: "low_info_tail",
              updatedAtMs: Date.now(),
            });
            markVoiceCheckpoint(
              "segment_cut",
              "ok",
              "Holding low-information tail for continuation merge.",
            );
            patchVoiceSegmentAttempt(nextSegment.id, { dispatch: "none" });
            setVoiceInputState("listening");
            continue;
          }
          voiceTurnGameplayLoopStartedAtMsRef.current = null;
          clearHeldTranscriptState();
          setConversationGovernor((prev) => ({
            ...prev,
            floor_owner: "none",
            turn_state: completion.route === "answer" ? "hard_pause" : "soft_pause",
            cooling_down: true,
            completion_score: completion,
            narrative_spine: {
              ...prev.narrative_spine,
              user_terms: mergedTranscript
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter((token) => token.length >= 4)
                .slice(0, 12),
              open_question: completion.route === "ask_more" ? mergedTranscript : null,
            },
          }));
          const recordedText = result.source_text?.trim() || mergedTranscript;
          rememberConversationTurn(`user: ${recordedText}`);
          const assembled = ingestVoiceDraftSegment({
            turnKey: traceId,
            segmentId: nextSegment.id,
            transcript: mergedTranscript,
            recordedText,
            sourceLanguage: result.source_language ?? result.language ?? null,
            translated: Boolean(result.translated),
            sttEngine: result.engine ?? null,
            confidence: confidenceMeta.confidence,
            confidenceReason: result.confidence_reason ?? confidenceMeta.reason,
            completion,
            turnComplete,
          });
          if (assembled) {
            markVoiceCheckpoint(
              "dispatch_queued",
              "ok",
              `Draft revision ${assembled.transcriptRevision} updated; waiting for seal gate.`,
            );
            patchVoiceSegmentAttempt(nextSegment.id, { dispatch: "queued" });
          } else {
            markVoiceCheckpoint("dispatch_suppressed", "ok", "Draft transcript was empty.");
            patchVoiceSegmentAttempt(nextSegment.id, { dispatch: "suppressed" });
          }
          setVoiceInputError(null);
          setVoiceInputState("cooldown");
          if (voiceCooldownTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(voiceCooldownTimerRef.current);
          }
          if (typeof window !== "undefined") {
            voiceCooldownTimerRef.current = window.setTimeout(() => {
              voiceCooldownTimerRef.current = null;
              if (micArmState === "on") {
                setVoiceInputState("listening");
                setConversationGovernor((prev) => ({ ...prev, cooling_down: false }));
              }
            }, MIC_POST_TRANSCRIBE_COOLDOWN_MS);
          }
        } catch (error) {
          resolveBargeInFromTranscription(true);
          const message = describeVoiceInputError(error);
          setVoiceInputError(message);
          markVoiceCheckpoint("stt_response_error", "error", message);
          patchVoiceSegmentAttempt(nextSegment.id, {
            status: "stt_error",
            sttLatencyMs: Math.max(0, Date.now() - sttStartedAt),
            error: message,
            dispatch: "suppressed",
          });
          setVoiceInputState("error");
          setConversationGovernor((prev) => ({
            ...prev,
            floor_owner: "none",
            turn_state: "hard_pause",
            cooling_down: false,
          }));
        }
      }
    } finally {
      voiceTranscribeBusyRef.current = false;
    }
  }, [
    clearHeldTranscriptFlushTimer,
    clearHeldTranscriptState,
    contextId,
    ingestVoiceDraftSegment,
    markVoiceCheckpoint,
    micArmState,
    patchVoiceSegmentAttempt,
    resolveBargeInFromTranscription,
    rememberConversationTurn,
    stopReadAloud,
  ]);

  const handleTranscriptConfirmationAccept = useCallback(() => {
    const pending = transcriptConfirmStateRef.current;
    if (!pending || micArmStateRef.current !== "on") return;
    stopReadAloud("barge_in");
    setTranscriptConfirmState(null);
    clearHeldTranscriptState();
    const confirmedTurn: VoiceConfirmedTurn = {
      id: pending.id,
      traceId: pending.traceId,
      segmentId: pending.segmentId,
      transcript: pending.transcript,
      recordedText: pending.sourceText?.trim() || pending.transcript,
      completion: pending.completion,
      turnComplete: pending.turnComplete,
      sttEngine: pending.sttEngine,
      sourceLanguage: pending.sourceLanguage,
      translated: pending.translated,
      confidence: pending.confidence,
      confidenceReason: pending.confidenceReason,
      needsConfirmation: true,
      translationUncertain: pending.translationUncertain,
    };
    voiceConfirmedTurnQueueRef.current = [
      confirmedTurn,
      ...voiceConfirmedTurnQueueRef.current.filter((entry) => entry.traceId !== pending.traceId),
    ];
    patchVoiceSegmentAttempt(pending.segmentId, {
      status: "stt_ok",
      dispatch: "queued",
      transcriptPreview: clipText(pending.transcript, 180),
      translated: pending.translated,
      engine: pending.sttEngine,
      error: null,
    });
    markVoiceCheckpoint("stt_response_error", "idle", "Transcript confirmed.");
    setVoiceInputError(null);
    setVoiceInputState("transcribing");
    void processTranscriptionQueue();
  }, [
    clearHeldTranscriptState,
    markVoiceCheckpoint,
    patchVoiceSegmentAttempt,
    processTranscriptionQueue,
    stopReadAloud,
  ]);

  const handleTranscriptConfirmationRetry = useCallback(() => {
    const pending = transcriptConfirmStateRef.current;
    if (!pending) return;
    setTranscriptConfirmState(null);
    clearHeldTranscriptState();
    voiceTurnGameplayLoopStartedAtMsRef.current = null;
    patchVoiceSegmentAttempt(pending.segmentId, {
      status: "stt_error",
      dispatch: "none",
      error: "confirmation_retry",
    });
    markVoiceCheckpoint(
      "stt_response_error",
      "warn",
      "Transcript discarded. Capture another segment to continue.",
    );
    setVoiceInputError(null);
    setVoiceInputState("listening");
    setConversationGovernor((prev) => ({
      ...prev,
      floor_owner: "none",
      turn_state: "soft_pause",
      cooling_down: false,
    }));
  }, [clearHeldTranscriptState, markVoiceCheckpoint, patchVoiceSegmentAttempt]);

  const queueSegmentForTranscription = useCallback(
    (blob: Blob, durationMs: number, segmentId: string, cutAtMs: number) => {
      if (blob.size <= 0) return;
      // If a voice segment was captured, pause any active playback while STT resolves.
      // This prevents stale finals from continuing to speak over the user's in-flight thought.
      pausePlaybackForPotentialBargeIn();
      const turnKey = resolveVoiceAssemblerTurnKeyForIncomingSegment();
      const assemblerState = getVoiceTurnAssemblerState(turnKey);
      if (assemblerState?.phase === "sealed") {
        reopenVoiceAssemblerDraft(turnKey, "voice_turn_interrupted_pending_reseal");
      } else {
        updateVoiceTurnAssemblerState(turnKey, (current) => ({
          ...current,
          phase: "draft",
          sealToken: null,
          sealedAtMs: null,
          lastSpeechAtMs: Date.now(),
        }));
      }
      voiceTranscribeQueueRef.current.push({ id: segmentId, blob, durationMs, cutAtMs, turnKey });
      const hardCutReason = resolveVoiceBargeHardCutReason({
        holdActive: voiceBargeHoldActiveRef.current,
        holdStartedAtMs: voiceBargeHoldStartedAtMsRef.current,
        nowMs: Date.now(),
        transcribeQueueLength: voiceTranscribeQueueRef.current.length,
        transcribeBusy: voiceTranscribeBusyRef.current,
        pendingConfirmation: transcriptConfirmStateRef.current !== null,
        speechActive: voiceSpeechActiveRef.current,
      });
      if (hardCutReason) {
        hardCutVoicePlaybackForBargeIn(hardCutReason);
      }
      void processTranscriptionQueue();
    },
    [
      getVoiceTurnAssemblerState,
      hardCutVoicePlaybackForBargeIn,
      pausePlaybackForPotentialBargeIn,
      processTranscriptionQueue,
      reopenVoiceAssemblerDraft,
      resolveVoiceAssemblerTurnKeyForIncomingSegment,
      updateVoiceTurnAssemblerState,
    ],
  );

  const finalizeVoiceSegment = useCallback(
    (reason: "silence" | "max_segment") => {
      if (!voiceSpeechActiveRef.current) return;
      voiceSpeechActiveRef.current = false;
      voiceSpeechCandidateStartMsRef.current = null;
      const segmentStartMs = voiceSegmentStartMsRef.current ?? Date.now();
      const segmentStartIndex = voiceSegmentStartIndexRef.current;
      const recorder = voiceRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.requestData();
        } catch {
          // no-op
        }
      }
      if (voiceSegmentFlushTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(voiceSegmentFlushTimerRef.current);
        voiceSegmentFlushTimerRef.current = null;
      }
      if (typeof window !== "undefined") {
        voiceSegmentFlushTimerRef.current = window.setTimeout(() => {
          voiceSegmentFlushTimerRef.current = null;
          const bufferedChunks = voiceChunksRef.current;
          const headerChunk = bufferedChunks[0]?.chunk;
          const segmentChunks = bufferedChunks.slice(segmentStartIndex);
          voiceSegmentStartIndexRef.current = voiceChunksRef.current.length;
          const audioChunks = segmentChunks.map((entry) => entry.chunk).filter((chunk) => chunk.size > 0);
          if (!audioChunks.length) return;
          const mimeType =
            recorder?.mimeType || audioChunks[0]?.type || "audio/webm";
          const shouldPrimeWithHeader = shouldPrimeSegmentWithContainerHeader({
            segmentStartIndex,
            mimeType,
            hasHeaderChunk: Boolean(headerChunk && headerChunk.size > 0),
          });
          const uploadChunks =
            shouldPrimeWithHeader && headerChunk && !audioChunks.includes(headerChunk)
              ? [headerChunk, ...audioChunks]
              : audioChunks;
          const durationMs = Math.max(0, Date.now() - segmentStartMs);
          const segmentId = `segment:${crypto.randomUUID()}`;
          const cutAtMs = Date.now();
          addVoiceSegmentAttempt({
            id: segmentId,
            cutAtMs,
            durationMs,
            status: "segment_cut",
            sttLatencyMs: null,
            transcriptPreview: null,
            translated: false,
            dispatch: "none",
            engine: null,
            error: null,
          });
          markVoiceCheckpoint(
            "segment_cut",
            "ok",
            shouldPrimeWithHeader
              ? `Segment captured (${Math.round(durationMs)}ms, container primed).`
              : `Segment captured (${Math.round(durationMs)}ms).`,
            durationMs,
          );
          queueSegmentForTranscription(new Blob(uploadChunks, { type: mimeType }), durationMs, segmentId, cutAtMs);
        }, 90);
      }
      setConversationGovernor((prev) => ({
        ...prev,
        floor_owner: "none",
        turn_state: reason === "silence" ? "hard_pause" : "soft_pause",
        cooling_down: true,
      }));
      // Preserve the latest speech timestamp for continuation scoring in STT processing.
      voiceLastSpeechMsRef.current = Date.now();
      voiceSegmentStartMsRef.current = null;
    },
    [addVoiceSegmentAttempt, markVoiceCheckpoint, queueSegmentForTranscription],
  );

  const evaluateMicLevel = useCallback(() => {
    const analyser = voiceAnalyserRef.current;
    if (!analyser || micArmState !== "on") return;
    const frame = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(frame);
    let sum = 0;
    for (let i = 0; i < frame.length; i += 1) {
      const normalized = (frame[i]! - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / frame.length);
    const baseline = Math.max(0.001, voiceNoiseFloorRef.current || 0.006);
    const dynamicThreshold = Math.max(
      MIC_LEVEL_MIN_THRESHOLD,
      Math.min(MIC_LEVEL_THRESHOLD, baseline * MIC_LEVEL_FLOOR_MULTIPLIER),
    );
    const rmsDb = 20 * Math.log10(Math.max(rms, 0.000001));
    voicePeakLevelRef.current = Math.max(rms, voicePeakLevelRef.current * 0.94);
    const scaledRaw = Math.max(
      0,
      Math.min(1, rms / Math.max(dynamicThreshold * 2.2, MIC_LEVEL_MIN_THRESHOLD * 2.2)),
    );
    const smoothedLevel = smoothVoiceLevel(voiceDisplayLevelRef.current, scaledRaw);
    voiceDisplayLevelRef.current = smoothedLevel;
    const speakingNow = rms >= dynamicThreshold;
    const now = Date.now();

    const trackMuted = voiceTrackMutedRef.current;
    if (voiceFlatWindowStartMsRef.current === null) {
      voiceFlatWindowStartMsRef.current = now;
      voiceFlatMinRmsRef.current = rms;
      voiceFlatMaxRmsRef.current = rms;
    } else {
      voiceFlatMinRmsRef.current = Math.min(voiceFlatMinRmsRef.current, rms);
      voiceFlatMaxRmsRef.current = Math.max(voiceFlatMaxRmsRef.current, rms);
      const flatElapsedMs = now - voiceFlatWindowStartMsRef.current;
      const flatVariance = Math.max(0, voiceFlatMaxRmsRef.current - voiceFlatMinRmsRef.current);
      const isFlat = isFlatVoiceSignal(flatVariance, flatElapsedMs);
      if (!trackMuted && isFlat && !speakingNow) {
        setVoiceWarning("flat_signal", true);
      } else if (speakingNow || flatVariance > VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD * 1.25) {
        setVoiceWarning("flat_signal", false);
      }
      if (flatElapsedMs >= VOICE_FLAT_SIGNAL_WINDOW_MS) {
        voiceFlatWindowStartMsRef.current = now;
        voiceFlatMinRmsRef.current = rms;
        voiceFlatMaxRmsRef.current = rms;
      }
    }

    const recorder = voiceRecorderRef.current;
    const recorderActive = Boolean(recorder && recorder.state !== "inactive");
    setVoiceWarning(
      "recorder_stalled",
      isRecorderStalled({
        recorderActive,
        nowMs: now,
        recorderStartedAtMs: voiceRecorderStartedAtMsRef.current,
        lastChunkAtMs: voiceLastChunkAtMsRef.current,
      }),
    );

    if (now - voiceLevelUiLastMsRef.current >= MIC_LEVEL_UI_UPDATE_MS) {
      voiceLevelUiLastMsRef.current = now;
      setVoiceMonitorLevel(smoothedLevel);
      setVoiceMonitorThreshold(dynamicThreshold);
      const nextSignalState =
        rms >= dynamicThreshold
          ? "speech"
          : rms >= Math.max(baseline * 1.1, MIC_LEVEL_MIN_THRESHOLD * 0.8)
            ? "low"
            : "waiting";
      setVoiceSignalState((prev) => (prev === nextSignalState ? prev : nextSignalState));
      setVoiceMeterStats({
        rmsRaw: rms,
        rmsDb,
        peak: voicePeakLevelRef.current,
        noiseFloor: baseline,
        displayLevel: smoothedLevel,
      });
      setVoiceRecorderStats((prev) => {
        const lastChunkAtMs = voiceLastChunkAtMsRef.current;
        const mediaChunkCount = voiceChunkCountRef.current;
        const mediaBytes = voiceChunkBytesRef.current;
        const recorderStartedAtMs = voiceRecorderStartedAtMsRef.current;
        const elapsedMs =
          recorderStartedAtMs !== null ? Math.max(1, now - recorderStartedAtMs) : 1;
        const chunksPerSecond = mediaChunkCount / (elapsedMs / 1000);
        if (
          prev.mediaChunkCount === mediaChunkCount &&
          prev.mediaBytes === mediaBytes &&
          prev.lastChunkAtMs === lastChunkAtMs &&
          Math.abs(prev.chunksPerSecond - chunksPerSecond) < 0.01
        ) {
          return prev;
        }
        return {
          mediaChunkCount,
          mediaBytes,
          lastChunkAtMs,
          chunksPerSecond,
        };
      });
    }
    if (speakingNow) {
      const quietUntilCandidate = now + VOICE_BARGE_TRAFFIC_BUFFER_MS;
      const currentQuietUntil = voiceBargeTrafficQuietUntilMsRef.current ?? 0;
      if (quietUntilCandidate > currentQuietUntil) {
        voiceBargeTrafficQuietUntilMsRef.current = quietUntilCandidate;
      }
      if (voiceSpeechCandidateStartMsRef.current === null) {
        voiceSpeechCandidateStartMsRef.current = now;
      }
      const candidateDuration = now - (voiceSpeechCandidateStartMsRef.current ?? now);
      if (!voiceSpeechActiveRef.current && candidateDuration >= MIC_SPEECH_START_MS) {
        voiceSpeechActiveRef.current = true;
        voiceLastSpeechMsRef.current = now;
        voiceSegmentStartMsRef.current = now;
        markVoiceCheckpoint(
          "signal_detected",
          "ok",
          `Signal detected (rms ${rms.toFixed(4)}, gate ${dynamicThreshold.toFixed(4)}).`,
        );
        setVoiceWarning("flat_signal", false);
        const prerollWindowStart = now - 240;
        const firstPrerollIndex = voiceChunksRef.current.findIndex(
          (entry) => entry.atMs >= prerollWindowStart,
        );
        voiceSegmentStartIndexRef.current =
          firstPrerollIndex >= 0
            ? firstPrerollIndex
            : Math.max(0, voiceChunksRef.current.length - 2);
        const voiceOutputActive =
          Boolean(playbackAudioRef.current) ||
          Boolean(voiceAutoSpeakActiveUtteranceRef.current) ||
          voiceAutoSpeakRunningRef.current ||
          voiceAutoSpeakQueueRef.current.length > 0;
        if (voiceOutputActive) {
          pausePlaybackForPotentialBargeIn();
          if (playbackAudioRef.current && !playbackAudioRef.current.paused) {
            stopReadAloud("barge_in");
          }
          setConversationGovernor((prev) => ({
            ...prev,
            floor_owner: "user",
            turn_state: "interrupted",
            cooling_down: false,
          }));
        } else {
          setConversationGovernor((prev) => ({
            ...prev,
            floor_owner: "user",
            turn_state: "user_speaking",
            cooling_down: false,
          }));
        }
      } else if (voiceSpeechActiveRef.current) {
        if (voiceBargeHoldActiveRef.current) {
          const currentAudio = playbackAudioRef.current;
          if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
          }
          const hardCutReason = resolveVoiceBargeHardCutReason({
            holdActive: true,
            holdStartedAtMs: voiceBargeHoldStartedAtMsRef.current,
            nowMs: now,
            transcribeQueueLength: voiceTranscribeQueueRef.current.length,
            transcribeBusy: voiceTranscribeBusyRef.current,
            pendingConfirmation: transcriptConfirmStateRef.current !== null,
            speechActive: true,
          });
          if (hardCutReason) {
            hardCutVoicePlaybackForBargeIn(hardCutReason);
          }
        }
        voiceLastSpeechMsRef.current = now;
        setConversationGovernor((prev) => ({
          ...prev,
          floor_owner: "user",
          turn_state: "user_speaking",
          cooling_down: false,
        }));
      }
      if (
        voiceSpeechActiveRef.current &&
        voiceSegmentStartMsRef.current !== null &&
        now - voiceSegmentStartMsRef.current >= MIC_MAX_SEGMENT_MS
      ) {
        finalizeVoiceSegment("max_segment");
      }
      return;
    }
    if (!voiceSpeechActiveRef.current) {
      voiceNoiseFloorRef.current =
        baseline * MIC_LEVEL_FLOOR_ALPHA + rms * (1 - MIC_LEVEL_FLOOR_ALPHA);
    }
    voiceSpeechCandidateStartMsRef.current = null;
    if (!voiceSpeechActiveRef.current) {
      if (
        shouldResumeBargeHeldPlayback({
          holdActive: voiceBargeHoldActiveRef.current,
          resumeNotBeforeMs: voiceBargeResumeNotBeforeMsRef.current,
          nowMs: now,
          transcribeQueueLength: voiceTranscribeQueueRef.current.length,
          transcribeBusy: voiceTranscribeBusyRef.current,
          pendingConfirmation: transcriptConfirmStateRef.current !== null,
          speechActive: voiceSpeechActiveRef.current,
          micArmed: micArmStateRef.current === "on",
          segmentFlushPending: voiceSegmentFlushTimerRef.current !== null,
          trafficQuietUntilMs: voiceBargeTrafficQuietUntilMsRef.current,
        })
      ) {
        voiceBargeHoldActiveRef.current = false;
        voiceBargeHoldTurnKeyRef.current = null;
        voiceBargeHoldStartedAtMsRef.current = null;
        voiceBargeResumeNotBeforeMsRef.current = null;
        voiceBargeTrafficQuietUntilMsRef.current = null;
        const currentAudio = playbackAudioRef.current;
        if (currentAudio && currentAudio.paused) {
          void currentAudio.play().catch(() => {
            // Ignore resume failures; queue may still continue on subsequent turns.
          });
        } else if (voiceAutoSpeakQueueRef.current.length > 0) {
          void runVoiceAutoSpeakQueue();
        }
      }
      setConversationGovernor((prev) =>
        prev.turn_state === "hard_pause"
          ? prev
          : { ...prev, floor_owner: "none", turn_state: "hard_pause" },
      );
      return;
    }
    const sinceLastSpeech = now - (voiceLastSpeechMsRef.current ?? now);
    if (sinceLastSpeech >= MIC_SOFT_PAUSE_MS && sinceLastSpeech < MIC_END_TURN_MS) {
      setConversationGovernor((prev) => ({
        ...prev,
        floor_owner: "none",
        turn_state: "soft_pause",
        cooling_down: false,
      }));
      return;
    }
    if (sinceLastSpeech >= MIC_END_TURN_MS) {
      finalizeVoiceSegment("silence");
    }
  }, [
    finalizeVoiceSegment,
    hardCutVoicePlaybackForBargeIn,
    markVoiceCheckpoint,
    micArmState,
    pausePlaybackForPotentialBargeIn,
    runVoiceAutoSpeakQueue,
    setVoiceWarning,
    stopReadAloud,
  ]);

  const startVoiceCaptureLoop = useCallback(async () => {
    if (micArmState !== "on") return;
    if (voiceRecorderRef.current || voiceStreamRef.current) return;
    setVoiceInputError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceInputError("Microphone capture unavailable.");
      setVoiceInputState("error");
      markVoiceCheckpoint("track_live", "error", "Microphone capture unavailable.");
      return;
    }
    if (typeof MediaRecorder === "undefined" || typeof window === "undefined") {
      setVoiceInputError("Browser recording unsupported.");
      setVoiceInputState("error");
      markVoiceCheckpoint("track_live", "error", "Browser recording unsupported.");
      return;
    }
    try {
      const micConstraints: MediaTrackConstraints = {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        channelCount: { ideal: 1 },
      };
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: micConstraints,
      });
      let audioTrack = stream.getAudioTracks()[0];
      let trackLabel = audioTrack?.label?.trim() || "default microphone";
      if (
        audioTrack &&
        isLikelyLoopbackDeviceLabel(trackLabel) &&
        typeof navigator.mediaDevices.enumerateDevices === "function"
      ) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const currentDeviceId =
            (audioTrack.getSettings?.().deviceId as string | undefined) ?? undefined;
          const fallbackInput = devices.find(
            (device) =>
              device.kind === "audioinput" &&
              !!device.deviceId &&
              device.deviceId !== currentDeviceId &&
              !isLikelyLoopbackDeviceLabel(device.label ?? ""),
          );
          if (fallbackInput?.deviceId) {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                ...micConstraints,
                deviceId: { exact: fallbackInput.deviceId },
              },
            });
            for (const track of stream.getTracks()) {
              track.stop();
            }
            stream = fallbackStream;
            audioTrack = stream.getAudioTracks()[0];
            trackLabel = audioTrack?.label?.trim() || fallbackInput.label?.trim() || "default microphone";
            markVoiceCheckpoint(
              "track_live",
              "warn",
              `Auto-switched from loopback to ${clipText(trackLabel, 32)}.`,
            );
          }
        } catch {
          // keep original stream; warning surface will guide operator
        }
      }
      voiceStreamRef.current = stream;
      if (audioTrack) {
        const mutedNow = audioTrack.muted === true;
        setVoiceInputDeviceLabel(trackLabel);
        setVoiceTrackMuted(mutedNow);
        voiceTrackMutedRef.current = mutedNow;
        markVoiceCheckpoint(
          "track_live",
          mutedNow ? "warn" : "ok",
          mutedNow ? "Track is live but muted." : "Track is live.",
        );
        setVoiceWarning("loopback_source", isLikelyLoopbackDeviceLabel(trackLabel));
        audioTrack.onmute = () => {
          voiceTrackMutedRef.current = true;
          setVoiceTrackMuted(true);
          markVoiceCheckpoint("track_live", "warn", "Track muted by browser or device.");
        };
        audioTrack.onunmute = () => {
          voiceTrackMutedRef.current = false;
          setVoiceTrackMuted(false);
          markVoiceCheckpoint("track_live", "ok", "Track resumed.");
        };
        audioTrack.onended = () => {
          setVoiceInputError("Microphone track ended.");
          setVoiceInputState("error");
          markVoiceCheckpoint("track_live", "error", "Track ended unexpectedly.");
          stopVoiceCapture();
        };
      }
      const preferredMimeType = pickMicRecorderMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = preferredMimeType
          ? new MediaRecorder(stream, { mimeType: preferredMimeType })
          : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      voiceRecorderRef.current = recorder;
      voiceRecorderStartedAtMsRef.current = Date.now();
      voiceLastChunkAtMsRef.current = null;
      voiceChunkCountRef.current = 0;
      voiceChunkBytesRef.current = 0;
      setVoiceRecorderMimeType(recorder.mimeType?.trim() || preferredMimeType || "default");
      voiceChunksRef.current = [];
      voiceSegmentStartIndexRef.current = 0;
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size <= 0) return;
        const now = Date.now();
        voiceLastChunkAtMsRef.current = now;
        voiceChunkCountRef.current += 1;
        voiceChunkBytesRef.current += event.data.size;
        setVoiceWarning("recorder_stalled", false);
        const beforeLength = voiceChunksRef.current.length;
        voiceChunksRef.current.push({ chunk: event.data, atMs: now });
        const cutoff = now - MIC_RING_BUFFER_MS;
        voiceChunksRef.current = voiceChunksRef.current.filter(
          (entry, index) => index === 0 || entry.atMs >= cutoff,
        );
        const dropped = beforeLength + 1 - voiceChunksRef.current.length;
        if (dropped > 0) {
          voiceSegmentStartIndexRef.current = Math.max(0, voiceSegmentStartIndexRef.current - dropped);
        }
      };
      recorder.onerror = (event) => {
        const recorderError = (event as unknown as { error?: Error }).error;
        setVoiceInputError(describeVoiceInputError(recorderError));
        setVoiceInputState("error");
        markVoiceCheckpoint("track_live", "error", "Recorder error.");
        stopVoiceCapture();
      };
      recorder.start(250);
      const AudioCtx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AudioCtx) {
        setVoiceInputError("Audio analysis unavailable.");
        setVoiceInputState("error");
        markVoiceCheckpoint("track_live", "error", "Audio analysis unavailable.");
        stopVoiceCapture();
        return;
      }
      const audioContext = new AudioCtx();
      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {
          // continue; analyser may still become available on next interaction
        }
      }
      voiceAudioContextRef.current = audioContext;
      const sourceNode = audioContext.createMediaStreamSource(stream);
      voiceSourceNodeRef.current = sourceNode;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.88;
      sourceNode.connect(analyser);
      const silenceGain = audioContext.createGain();
      silenceGain.gain.value = 0;
      analyser.connect(silenceGain);
      silenceGain.connect(audioContext.destination);
      voiceSilenceGainNodeRef.current = silenceGain;
      voiceAnalyserRef.current = analyser;
      voiceMonitorTimerRef.current = window.setInterval(
        evaluateMicLevel,
        MIC_ANALYSIS_INTERVAL_MS,
      );
      setVoiceInputState("listening");
      markVoiceCheckpoint("track_live", "ok", "Capture loop armed.");
      setConversationGovernor((prev) => ({
        ...prev,
        floor_owner: "none",
        turn_state: "hard_pause",
        cooling_down: false,
      }));
    } catch (error) {
      stopVoiceCapture();
      const message = describeVoiceInputError(error);
      setVoiceInputError(message);
      setVoiceInputState("error");
      markVoiceCheckpoint("track_live", "error", message);
    }
  }, [evaluateMicLevel, markVoiceCheckpoint, micArmState, setVoiceWarning, stopVoiceCapture]);

  const handleVoiceInputToggle = useCallback(() => {
    void primeVoiceAudioPlayback();
    if (micArmState === "on") {
      setMicArmState("off");
      setVoiceInputError(null);
      stopVoiceCapture();
      return;
    }
    setMicArmState("on");
    setVoiceInputState("listening");
    setVoiceInputError(null);
  }, [micArmState, primeVoiceAudioPlayback, stopVoiceCapture]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MIC_PERSIST_KEY, micArmState);
    } catch {
      // no-op
    }
  }, [micArmState]);

  useEffect(() => {
    if (micArmState === "on") {
      void startVoiceCaptureLoop();
      return;
    }
    stopVoiceCapture();
  }, [micArmState, startVoiceCaptureLoop, stopVoiceCapture]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      if (document.hidden) {
        stopVoiceCapture();
        return;
      }
      if (micArmState === "on") {
        void startVoiceCaptureLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [micArmState, startVoiceCaptureLoop, stopVoiceCapture]);

  useEffect(() => () => {
    stopReadAloud();
    stopVoiceCapture();
    voicePlaybackSourceNodeRef.current?.disconnect();
    voicePlaybackSourceNodeRef.current = null;
    voicePlaybackCompressorNodeRef.current?.disconnect();
    voicePlaybackCompressorNodeRef.current = null;
    voicePlaybackGainNodeRef.current?.disconnect();
    voicePlaybackGainNodeRef.current = null;
    voicePlaybackGraphElementRef.current = null;
    if (voicePlaybackAudioContextRef.current) {
      void voicePlaybackAudioContextRef.current.close().catch(() => undefined);
      voicePlaybackAudioContextRef.current = null;
    }
    const playbackElement = playbackElementRef.current;
    if (playbackElement) {
      playbackElement.pause();
      playbackElement.src = "";
      playbackElement.load();
    }
    playbackElementRef.current = null;
    voiceChunkTimelineEventsRef.current = [];
    contextCapsuleSessionLedgerRef.current = [];
  }, [stopReadAloud, stopVoiceCapture]);

  useEffect(() => {
    if (!askBusy) {
      setAskElapsedMs(null);
      return;
    }
    const startedAt = askStartRef.current ?? Date.now();
    askStartRef.current = startedAt;
    setAskElapsedMs(0);
    const timer = setInterval(() => {
      setAskElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [askBusy]);

  useEffect(() => {
    if (!askBusy || !askLiveSessionId || !askLiveTraceId) return undefined;
    const startedAt = askStartRef.current ?? Date.now();
    const handleEvent = (event: ToolLogEvent) => {
      if (!event) return;
      const hasSessionFilter = Boolean(askLiveSessionId);
      if (hasSessionFilter && event.sessionId && event.sessionId !== askLiveSessionId) return;
      if (askLiveTraceId && event.traceId && event.traceId !== askLiveTraceId) return;
      const toolName = (event.tool ?? "").trim();
      const isHelixTool = toolName.startsWith("helix.ask");
      const isLocalTool =
        toolName.startsWith("llm.local") ||
        toolName.startsWith("llm.http") ||
        toolName.startsWith("luma.");
      if (!isHelixTool && !hasSessionFilter) return;
      if (!isHelixTool && hasSessionFilter && !isLocalTool && event.sessionId !== askLiveSessionId) {
        return;
      }
      const eventTs = parseTimestampMs(event.ts);
      if (typeof eventTs === "number" && Number.isFinite(eventTs) && eventTs < startedAt - 500) {
        return;
      }
      updateReasoningTheaterEventClock(event, startedAt, eventTs);
      if (toolName === "helix.ask.stream") {
        const chunk = (event.text ?? "").toString();
        if (!chunk.trim()) return;
        askLiveDraftBufferRef.current = `${askLiveDraftBufferRef.current}${chunk}`;
        if (askLiveDraftBufferRef.current.length > 4000) {
          askLiveDraftBufferRef.current = askLiveDraftBufferRef.current.slice(-4000);
        }
        askLiveDraftRef.current = askLiveDraftBufferRef.current;
        scheduleLiveDraftFlush();
        const manualAttemptId = reasoningAttemptManualIdRef.current;
        if (manualAttemptId) {
          updateReasoningAttempt(manualAttemptId, (current) => ({
            ...current,
            status: "streaming",
            partial: askLiveDraftBufferRef.current,
          }));
        }
        return;
      }
      let text = (event.message ?? event.text ?? "").toString().trim();
      if (!text && event.stage) {
        text = event.detail ? `${event.stage}: ${event.detail}` : event.stage;
      }
      if (!text) {
        text = toolName || "Helix Ask update";
      }
      text = clipText(text, HELIX_ASK_LIVE_EVENT_MAX_CHARS);
      if (!text) return;
      setAskStatus(text);
      setAskLiveEvents((prev) => {
        const id = event.id ?? String(event.seq ?? Date.now());
        if (prev.some((entry) => entry.id === id)) return prev;
        const meta =
          event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
            ? (event.meta as Record<string, unknown>)
            : undefined;
        const next = [
          ...prev,
          {
            id,
            text,
            tool: toolName || undefined,
            ts: event.ts,
            tsMs: eventTs ?? undefined,
            seq:
              typeof event.seq === "number" && Number.isFinite(event.seq)
                ? event.seq
                : undefined,
            durationMs:
              typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
                ? event.durationMs
                : undefined,
            meta,
          },
        ];
        const clipped = next.slice(-HELIX_ASK_LIVE_EVENT_LIMIT);
        askLiveEventsRef.current = clipped;
        const manualAttemptId = reasoningAttemptManualIdRef.current;
        if (manualAttemptId) {
          const appendedEvent = clipped[clipped.length - 1];
          if (appendedEvent) {
            updateReasoningAttempt(manualAttemptId, (current) => ({
              ...current,
              events: [...current.events, appendedEvent].slice(-HELIX_ASK_LIVE_EVENT_LIMIT),
            }));
          }
        }
        return clipped;
      });
    };
    const unsubscribe = subscribeToolLogs(handleEvent, {
      sessionId: askLiveSessionId ?? undefined,
      traceId: askLiveTraceId ?? undefined,
      limit: 200,
    });
    return () => unsubscribe();
  }, [
    askBusy,
    askLiveSessionId,
    askLiveTraceId,
    updateReasoningAttempt,
    scheduleLiveDraftFlush,
    updateReasoningTheaterEventClock,
  ]);

  const askLiveStatusText = useMemo(() => {
    const statusTrimmed = askStatus?.trim() ?? "";
    if (!askBusy) {
      return statusTrimmed || null;
    }
    const statusIsGenerating = !statusTrimmed || /^generating/i.test(statusTrimmed);
    const lastEventText = askLiveEvents[askLiveEvents.length - 1]?.text?.trim();
    if (lastEventText) {
      return lastEventText;
    }
    const draftTail = askLiveDraft.trim();
    if (draftTail && statusIsGenerating) {
      const normalized = draftTail.replace(/\s+/g, " ").trim();
      if (normalized) {
        const snippet = normalized.slice(-160);
        return normalized.length > snippet.length
          ? `Streaming: ...${snippet}`
          : `Streaming: ${snippet}`;
      }
    }
    return statusTrimmed || null;
  }, [askBusy, askLiveDraft, askLiveEvents, askStatus]);

  const buildConvergenceSnapshot = useCallback(
    (args: {
      events: AskLiveEventEntry[];
      proof?: HelixAskReply["proof"];
      debug?: HelixAskReply["debug"];
      fallbackPhase?: ReasoningTheaterPhase;
    }): ConvergenceStripState => {
      return deriveConvergenceStripState({
        events: args.events,
        frontierAction: reasoningTheaterFrontierDebugRef.current.action,
        frontierDeltaPct: reasoningTheaterFrontierDebugRef.current.deltaPct,
        proof: args.proof
          ? {
              verdict: args.proof.verdict,
              certificate: {
                certificateHash: args.proof.certificate?.certificateHash ?? null,
                integrityOk: args.proof.certificate?.integrityOk ?? null,
              },
            }
          : undefined,
        debug: buildConvergenceDebugSnapshot(args.debug),
        fallbackPhase: args.fallbackPhase ?? reasoningTheater?.phase ?? "observe",
      });
    },
    [reasoningTheater?.phase],
  );

  const parseQueuedQuestions = useCallback((value: string): string[] => {
    if (!value) return [];
    return value
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, []);

  const resolveReplyEvents = useCallback((reply: HelixAskReply): AskLiveEventEntry[] => {
    if (reply.liveEvents && reply.liveEvents.length > 0) {
      return reply.liveEvents;
    }
    const debugEvents = reply.debug?.live_events;
    if (!debugEvents || debugEvents.length === 0) {
      return [];
    }
    return debugEvents.map((entry, index) => {
      const fallbackLabel = `${entry.stage}${entry.detail ? ` - ${entry.detail}` : ""}`.trim();
      const text = entry.text?.trim() || fallbackLabel || "Helix Ask update";
      return {
        id: `${reply.id}-debug-${index}`,
        text,
        tool: entry.tool,
        ts: entry.ts,
        tsMs: parseTimestampMs(entry.ts) ?? undefined,
        durationMs: entry.durationMs,
        meta:
          entry.meta && typeof entry.meta === "object" && !Array.isArray(entry.meta)
            ? entry.meta
            : undefined,
      };
    });
  }, []);

  const resolveReplyConvergenceSnapshot = useCallback(
    (reply: HelixAskReply, events: AskLiveEventEntry[]): ConvergenceStripState => {
      if (reply.convergenceSnapshot) {
        return reply.convergenceSnapshot;
      }
      return deriveConvergenceStripState({
        events,
        frontierAction: "steady",
        frontierDeltaPct: 0,
        proof: reply.proof
          ? {
              verdict: reply.proof.verdict,
              certificate: {
                certificateHash: reply.proof.certificate?.certificateHash ?? null,
                integrityOk: reply.proof.certificate?.integrityOk ?? null,
              },
            }
          : undefined,
        debug: buildConvergenceDebugSnapshot(reply.debug),
        fallbackPhase: "debrief",
      });
    },
    [],
  );


  const extractObjectiveSignals = useCallback((events: AskLiveEventEntry[]) => {
    const objective = events.find((event) => /objective/i.test(event.text));
    const gaps = events
      .filter((event) => /gap/i.test(event.text))
      .map((event) => event.text)
      .sort((a, b) => a.localeCompare(b));
    const suppression = events.find((event) => /suppress/i.test(event.text) || /context_ineligible|dedupe_cooldown|mission_rate_limited/.test(event.text));
    return {
      objective: objective?.text ?? null,
      gaps: gaps.slice(0, 3),
      suppression: suppression?.text ?? null,
    };
  }, []);

  const resumePendingAsk = useCallback(
    async (pending: PendingHelixAskJob) => {
      if (!pending.jobId) return;
      const questionText = pending.question?.trim() ?? "";
      setAskBusy(true);
      setAskStatus("Reconnecting to previous answer...");
      setAskError(null);
      setAskLiveEvents([]);
      askLiveEventsRef.current = [];
      resetReasoningTheaterEventClock();
      setAskLiveDraft("");
      askLiveDraftRef.current = "";
      askLiveDraftBufferRef.current = "";
      clearLiveDraftFlush();
      askStartRef.current = Date.now();
      setAskElapsedMs(0);
      setAskActiveQuestion(questionText || null);
      if (questionText) {
        clearMoodTimer();
        cancelMoodHint();
        updateMoodFromText(questionText);
        requestMoodHint(questionText, { force: true });
      }
      const sessionId = pending.sessionId ?? getHelixAskSessionId();
      const traceId = pending.traceId ?? `ask:${crypto.randomUUID()}`;
      setAskLiveSessionId(sessionId ?? null);
      setAskLiveTraceId(traceId);
      if (sessionId) {
        setActive(sessionId);
      }

      const controller = new AbortController();
      askAbortRef.current = controller;
      const runId = ++askRunIdRef.current;
      let skipReply = false;

      try {
        let responseText = "";
        let responseDebug: HelixAskReply["debug"];
        let responsePromptIngested: boolean | undefined;
        let responseEnvelope: HelixAskResponseEnvelope | undefined;
        let responseViewerLaunch: AtomicViewerLaunch | undefined;
        let responseMode: "read" | "observe" | "act" | "verify" | undefined;
        let responseProof: HelixAskReply["proof"];
        let responseContextCapsule: ContextCapsuleSummary | undefined;
        try {
          const localResponse = await resumeHelixAskJob(pending.jobId, {
            signal: controller.signal,
          });
          responseEnvelope = localResponse.envelope;
          const envelopeAnswer = responseEnvelope?.answer?.trim() ?? "";
          responseText = envelopeAnswer
            ? envelopeAnswer
            : stripPromptEcho(localResponse.text ?? "", questionText);
          responseDebug = localResponse.debug;
          responsePromptIngested = localResponse.prompt_ingested;
          responseViewerLaunch = localResponse.viewer_launch;
          responseMode = localResponse.mode;
          responseProof = localResponse.proof;
          responseContextCapsule = localResponse.context_capsule;
        } catch (error) {
          const aborted =
            controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
          if (aborted) {
            skipReply = true;
            setAskStatus("Generation stopped.");
          } else {
            const message = error instanceof Error ? error.message : String(error);
            const streamedFallback = askLiveDraftRef.current.trim();
            responseText = streamedFallback || message || "Request failed.";
          }
        }
        if (!skipReply) {
          if (!responseText) {
            responseText = "No response returned.";
          }
          if (responseContextCapsule) {
            upsertContextCapsuleSessionLedger(responseContextCapsule);
          }
          launchAtomicViewer(responseViewerLaunch);
          updateMoodFromText(responseText);
          requestMoodHint(responseText, { force: true });
          const replyId = crypto.randomUUID();
          const liveEventsSnapshot = [...askLiveEventsRef.current];
          const convergenceSnapshot = buildConvergenceSnapshot({
            events: liveEventsSnapshot,
            proof: responseProof,
            debug: responseDebug,
          });
          setAskReplies((prev) =>
            [
              {
                id: replyId,
                content: responseText,
                question: questionText || "Previous request",
                debug: responseDebug,
                promptIngested: responsePromptIngested,
                envelope: responseEnvelope,
                mode: responseMode,
                proof: responseProof,
                contextCapsule: responseContextCapsule,
                sources: responseDebug?.context_files ?? responseDebug?.prompt_context_files ?? [],
                liveEvents: liveEventsSnapshot,
                convergenceSnapshot,
              },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
        }
      } finally {
        if (askRunIdRef.current === runId) {
          setAskBusy(false);
          setAskStatus(null);
          setAskLiveSessionId(null);
          setAskLiveTraceId(null);
          setAskLiveDraft("");
          askLiveDraftRef.current = "";
          askLiveDraftBufferRef.current = "";
          clearLiveDraftFlush();
          setAskActiveQuestion(null);
        }
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
      }
    },
    [
      addMessage,
      buildConvergenceSnapshot,
      cancelMoodHint,
      clearLiveDraftFlush,
      clearMoodTimer,
      getHelixAskSessionId,
      launchAtomicViewer,
      resetReasoningTheaterEventClock,
      requestMoodHint,
      setActive,
      upsertContextCapsuleSessionLedger,
      updateMoodFromText,
    ],
  );

  useEffect(() => {
    if (askBusy) return;
    if (resumeAttemptedRef.current) return;
    const pending = getPendingHelixAskJob();
    if (!pending) return;
    resumeAttemptedRef.current = true;
    void resumePendingAsk(pending);
  }, [askBusy, resumePendingAsk]);

  const runAsk = useCallback(
    async (question: string, capsuleIds?: string[]) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const selectedCapsuleIds =
        Array.isArray(capsuleIds) && capsuleIds.length > 0
          ? capsuleIds.slice(0, HELIX_CONTEXT_CAPSULE_MAX_IDS)
          : resolveSelectedContextCapsuleIds(trimmed, undefined, { source: "manual" });
      const pinnedCapsuleCount = getPinnedContextCapsuleCount();
      const inferredMode = inferAskMode(trimmed);
      setAskBusy(true);
      setAskStatus("Interpreting prompt...");
      setAskError(null);
      setAskLiveEvents([]);
      askLiveEventsRef.current = [];
      resetReasoningTheaterEventClock();
      setAskLiveDraft("");
      askLiveDraftRef.current = "";
      askLiveDraftBufferRef.current = "";
      clearLiveDraftFlush();
      askStartRef.current = Date.now();
      setAskElapsedMs(0);
      setAskActiveQuestion(trimmed);
      if (askInputRef.current) {
        askInputRef.current.value = "";
        resizeTextarea();
      }
      askDraftRef.current = "";
      setContextCapsuleDetectedId(null);
      clearMoodTimer();
      cancelMoodHint();
      updateMoodFromText(trimmed);
      requestMoodHint(trimmed, { force: true });
      const sessionId = getHelixAskSessionId();
      const traceId = `ask:${crypto.randomUUID()}`;
      const manualAttempt = createReasoningAttempt({
        prompt: trimmed,
        contextCapsuleIds: selectedCapsuleIds,
        contextCapsuleCount: selectedCapsuleIds.length,
        contextCapsulePinnedCount: pinnedCapsuleCount,
        source: "manual",
        mode: inferredMode,
        status: "running",
        traceId,
        completionScore: conversationGovernor.completion_score.score,
        floorOwner: conversationGovernor.floor_owner,
      });
      const manualTimelineEntryId = ensureReasoningTimelineEntry(manualAttempt, "running");
      reasoningAttemptManualIdRef.current = manualAttempt.id;
      setAskLiveSessionId(sessionId ?? null);
      setAskLiveTraceId(traceId);
      if (sessionId) {
        setActive(sessionId);
        addMessage(sessionId, { role: "user", content: trimmed });
      }

      const controller = new AbortController();
      askAbortRef.current = controller;
      const runId = ++askRunIdRef.current;
      let skipReply = false;

      try {
        let responseText = "";
        let responseDebug: HelixAskReply["debug"];
        let responsePromptIngested: boolean | undefined;
        let responseEnvelope: HelixAskResponseEnvelope | undefined;
        let responseViewerLaunch: AtomicViewerLaunch | undefined;
        let responseMode: "read" | "observe" | "act" | "verify" | undefined;
        let responseProof: HelixAskReply["proof"];
        let responseContextCapsule: ContextCapsuleSummary | undefined;
        let responseDebugWithClientMode: HelixAskReply["debug"] | undefined;
        setAskStatus("Generating answer...");
        try {
          const askModeForRequest = inferredMode === "observe" ? undefined : inferredMode;
          const askResult = await askLocalWithPreflightScopeFallback(undefined, {
            sessionId: sessionId ?? undefined,
            traceId,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
            question: trimmed,
            debug: userSettings.showHelixAskDebug,
            signal: controller.signal,
            mode: askModeForRequest,
            capsuleIds: selectedCapsuleIds,
          });
          const localResponse = askResult.response;
          responseEnvelope = localResponse.envelope;
          const envelopeAnswer = responseEnvelope?.answer?.trim() ?? "";
          responseText = envelopeAnswer
            ? envelopeAnswer
            : stripPromptEcho(localResponse.text ?? "", trimmed);
          responseDebug = localResponse.debug;
          responseDebugWithClientMode =
            localResponse.debug || inferredMode
              ? {
                  ...localResponse.debug,
                  ...(inferredMode ? { client_inferred_mode: inferredMode } : {}),
                  ...(askResult.downgradedFromMode
                    ? {
                        client_mode_fallback: {
                          from: askResult.downgradedFromMode,
                          to: localResponse.mode ?? "read",
                          reason: "preflight_scope_required",
                        },
                      }
                    : {}),
                }
              : undefined;
          responsePromptIngested = localResponse.prompt_ingested;
          responseViewerLaunch = localResponse.viewer_launch;
          responseMode = localResponse.mode;
          responseProof = localResponse.proof;
          responseContextCapsule = localResponse.context_capsule;
        } catch (error) {
          const aborted =
            controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
          if (aborted) {
            skipReply = true;
            setAskStatus("Generation stopped.");
            updateReasoningAttempt(manualAttempt.id, (current) => ({
              ...current,
              status: "cancelled",
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(manualTimelineEntryId, {
              status: "suppressed",
              detail: "cancelled",
            });
            addHelixTimelineEntry({
              type: "suppressed",
              source: "manual",
              status: "suppressed",
              text: "Manual reasoning cancelled by user.",
              detail: "cancelled",
              mode: inferredMode,
              traceId,
              attemptId: manualAttempt.id,
            });
          } else {
            const message = error instanceof Error ? error.message : String(error);
            const streamedFallback = askLiveDraftRef.current.trim();
            responseText = streamedFallback || message || "Request failed.";
            updateReasoningAttempt(manualAttempt.id, (current) => ({
              ...current,
              status: "failed",
              suppression_reason: message || "reasoning_failed",
              completedAtMs: Date.now(),
            }));
            patchHelixTimelineEntry(manualTimelineEntryId, {
              status: "failed",
              detail: clipText(message || "reasoning_failed", 180),
            });
            addHelixTimelineEntry({
              type: "suppressed",
              source: "manual",
              status: "suppressed",
              text: clipText(message || "reasoning_failed", 280),
              detail: "manual reasoning failed",
              mode: inferredMode,
              traceId,
              attemptId: manualAttempt.id,
            });
          }
        }
        if (!skipReply) {
          if (!responseText) {
            responseText = "No response returned.";
          }
          if (responseContextCapsule) {
            upsertContextCapsuleSessionLedger(responseContextCapsule);
          }
          launchAtomicViewer(responseViewerLaunch);
          updateMoodFromText(responseText);
          requestMoodHint(responseText, { force: true });
          const replyId = crypto.randomUUID();
          const liveEventsSnapshot = [...askLiveEventsRef.current];
          const convergenceSnapshot = buildConvergenceSnapshot({
            events: liveEventsSnapshot,
            proof: responseProof,
            debug: responseDebug,
          });
          setAskReplies((prev) =>
            [
              {
                id: replyId,
                content: responseText,
                question: trimmed,
                debug: responseDebugWithClientMode ?? responseDebug,
                promptIngested: responsePromptIngested,
                envelope: responseEnvelope,
                mode: responseMode,
                proof: responseProof,
                contextCapsule: responseContextCapsule,
                sources:
                  (responseDebugWithClientMode ?? responseDebug)?.context_files ??
                  (responseDebugWithClientMode ?? responseDebug)?.prompt_context_files ??
                  [],
                liveEvents: liveEventsSnapshot,
                convergenceSnapshot,
              },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
          const detailMode =
            responseMode === "observe" || responseMode === "act" || responseMode === "verify"
              ? responseMode
              : responseMode === "read"
                ? "observe"
                : inferredMode;
          updateReasoningAttempt(manualAttempt.id, (current) => ({
            ...current,
            status: "done",
            partial: askLiveDraftRef.current || responseText,
            finalAnswer: responseText,
            certaintyClass:
              ((responseEnvelope as { certainty_class?: "confirmed" | "reasoned" | "hypothesis" | "unknown" } | undefined)
                ?.certainty_class) ??
              ((responseDebugWithClientMode ?? responseDebug)?.evidence_gate_ok ? "reasoned" : "unknown"),
            evidenceRefs:
              (responseDebugWithClientMode ?? responseDebug)?.context_files ??
              (responseDebugWithClientMode ?? responseDebug)?.prompt_context_files ??
              [],
            completedAtMs: Date.now(),
          }));
          patchHelixTimelineEntry(manualTimelineEntryId, {
            status: "done",
            detail: formatReasoningAttemptDetail(
              {
                mode: detailMode,
              },
              "done",
            ),
            mode: responseMode ?? inferredMode,
          });
          addHelixTimelineEntry({
            type: responseMode === "act" ? "action_receipt" : "reasoning_final",
            source: "manual",
            status: "done",
            text: clipText(responseText, 520),
            detail: formatReasoningAttemptDetail(
              {
                mode: detailMode,
              },
              "manual complete",
            ),
            mode: responseMode ?? inferredMode,
            traceId,
            attemptId: manualAttempt.id,
            meta: {
              certaintyClass:
                ((responseEnvelope as { certainty_class?: "confirmed" | "reasoned" | "hypothesis" | "unknown" } | undefined)
                  ?.certainty_class) ??
                ((responseDebugWithClientMode ?? responseDebug)?.evidence_gate_ok ? "reasoned" : "unknown"),
              contextFiles:
                (responseDebugWithClientMode ?? responseDebug)?.context_files ??
                (responseDebugWithClientMode ?? responseDebug)?.prompt_context_files ??
                [],
            },
          });
        }
      } finally {
        if (askRunIdRef.current === runId) {
          setAskBusy(false);
          setAskStatus(null);
          setAskLiveSessionId(null);
          setAskLiveTraceId(null);
          setAskLiveDraft("");
          askLiveDraftRef.current = "";
          askLiveDraftBufferRef.current = "";
          clearLiveDraftFlush();
          setAskActiveQuestion(null);
        }
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
        if (reasoningAttemptManualIdRef.current === manualAttempt.id) {
          reasoningAttemptManualIdRef.current = null;
        }
      }
    },
    [
      addHelixTimelineEntry,
      addMessage,
      askBusy,
      conversationGovernor.completion_score.score,
      conversationGovernor.floor_owner,
      createReasoningAttempt,
      buildConvergenceSnapshot,
      cancelMoodHint,
      clearLiveDraftFlush,
      clearMoodTimer,
      ensureReasoningTimelineEntry,
      formatReasoningAttemptDetail,
      getHelixAskSessionId,
      getPinnedContextCapsuleCount,
      launchAtomicViewer,
      patchHelixTimelineEntry,
      resetReasoningTheaterEventClock,
      resolveSelectedContextCapsuleIds,
      requestMoodHint,
      resizeTextarea,
      setActive,
      upsertContextCapsuleSessionLedger,
      updateReasoningAttempt,
      updateMoodFromText,
      userSettings.showHelixAskDebug,
    ],
  );

  useEffect(() => {
    if (askBusy || askQueue.length === 0) return;
    const next = askQueue[0];
    setAskQueue((prev) => prev.slice(1));
    void runAsk(next);
  }, [askBusy, askQueue, runAsk]);

  const handleStop = useCallback(() => {
    if (askAbortRef.current) {
      askAbortRef.current.abort();
    }
    setAskStatus("Stopping...");
  }, []);

  const handleAskSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void primeVoiceAudioPlayback();
      const rawInput = askInputRef.current?.value ?? "";
      const entries = parseQueuedQuestions(rawInput);
      if (entries.length === 0) return;
      const inlineCapsuleIds = extractContextCapsuleIdsFromText(rawInput);
      const selectedCapsuleIds = resolveSelectedContextCapsuleIds(rawInput, inlineCapsuleIds, {
        source: "manual",
      });
      const normalizedEntries = entries.map((entry) => {
        const stripped = stripContextCapsuleTokensFromText(entry);
        return stripped || entry.trim();
      });
      const panelCommand =
        normalizedEntries.length === 1 ? parseOpenPanelCommand(normalizedEntries[0]) : null;
      if (panelCommand) {
        const panelDef = getPanelDef(panelCommand);
        if (askInputRef.current) {
          askInputRef.current.value = "";
          resizeTextarea();
        }
        askDraftRef.current = "";
        setContextCapsuleDetectedId(null);
        clearMoodTimer();
        cancelMoodHint();
        updateMoodFromText(normalizedEntries[0] ?? entries[0] ?? "");
        requestMoodHint(normalizedEntries[0] ?? entries[0] ?? "", { force: true });
        const sessionId = getHelixAskSessionId();
        if (sessionId) {
          setActive(sessionId);
          addMessage(sessionId, { role: "user", content: normalizedEntries[0] ?? entries[0] });
        }
        if (panelDef) {
          openPanelById(panelCommand);
          const replyId = crypto.randomUUID();
          const responseText = `Opened ${panelDef.title}.`;
          setAskReplies((prev) =>
            [
              { id: replyId, content: responseText, question: normalizedEntries[0] ?? entries[0] },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
        } else {
          setAskError("Panel not found.");
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: "Error: Panel not found." });
          }
        }
        return;
      }
      if (askInputRef.current) {
        askInputRef.current.value = "";
        resizeTextarea();
      }
      askDraftRef.current = "";
      setContextCapsuleDetectedId(null);
      if (askBusy) {
        setAskQueue((prev) => {
          const combined = [...prev, ...normalizedEntries];
          return combined.slice(0, HELIX_ASK_QUEUE_LIMIT);
        });
        return;
      }
      const [firstRaw, ...restRaw] = normalizedEntries;
      const first = firstRaw?.trim() || normalizedEntries[0] || entries[0];
      const rest = restRaw.map((entry) => entry.trim()).filter(Boolean);
      if (rest.length > 0) {
        setAskQueue((prev) => {
          const combined = [...prev, ...rest];
          return combined.slice(0, HELIX_ASK_QUEUE_LIMIT);
        });
      }
      void runAsk(first, selectedCapsuleIds);
    },
    [
      addMessage,
      cancelMoodHint,
      clearMoodTimer,
      getHelixAskSessionId,
      openPanelById,
      parseQueuedQuestions,
      primeVoiceAudioPlayback,
      resolveSelectedContextCapsuleIds,
      requestMoodHint,
      resizeTextarea,
      setActive,
      updateMoodFromText,
      runAsk,
      userSettings.showHelixAskDebug,
    ],
  );

  const maxWidthClass = maxWidthClassName ?? "max-w-4xl";
  const inputPlaceholder = placeholder ?? "Ask anything about this system";
  const currentPlaceholder = askBusy ? "Add another question..." : inputPlaceholder;
  const voiceInputStatusLabel = buildVoiceInputStatusLabel(
    micArmState,
    voiceInputState,
    voiceInputError,
  );
  const showTopInputLevelMonitor = micArmState === "on";
  const formMaxWidthStyle =
    maxWidthClassName !== undefined
      ? undefined
      : ({
          maxWidth: showTopInputLevelMonitor ? "72rem" : "64rem",
        } as const);

  const refreshVoiceMonitorBounds = useCallback(() => {
    if (typeof window === "undefined") return;
    const anchor = voiceMonitorAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    // Use the anchored bottom edge (stable at the pill top) so expansion
    // doesn't recursively shrink available space as the monitor grows.
    const availableAbove = Math.max(0, Math.floor(rect.bottom - viewportTop - 8));
    const viewportCap = Math.max(48, Math.floor(Math.min(560, viewportHeight - 64)));
    const nextMaxHeight = Math.min(availableAbove, viewportCap);
    setVoiceMonitorMaxHeightPx((prev) => (Math.abs(prev - nextMaxHeight) <= 1 ? prev : nextMaxHeight));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !showTopInputLevelMonitor) return;
    const updateBounds = () => {
      refreshVoiceMonitorBounds();
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, true);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", updateBounds);
    visualViewport?.addEventListener("scroll", updateBounds);
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds, true);
      visualViewport?.removeEventListener("resize", updateBounds);
      visualViewport?.removeEventListener("scroll", updateBounds);
    };
  }, [refreshVoiceMonitorBounds, showTopInputLevelMonitor]);

  const emitContextLifecycle = useCallback((event: ContextLifecycleEvent) => {
    setContextSessionState(event.sessionState);
  }, []);

  const stopContextSession = useCallback(() => {
    const stream = contextSessionStreamRef.current;
    if (!stream && contextSessionState === "idle") return;
    stopDesktopTier1ScreenSession(stream, emitContextLifecycle);
    contextSessionStreamRef.current = null;
  }, [contextSessionState, emitContextLifecycle]);

  useEffect(() => {
    writeMissionContextControls(missionContextControls);
  }, [missionContextControls]);

  useEffect(() => {
    if (missionContextControls.tier !== "tier0") return;
    stopContextSession();
    setContextSessionState("idle");
  }, [missionContextControls.tier, stopContextSession]);

  useEffect(() => {
    return () => {
      const stream = contextSessionStreamRef.current;
      contextSessionStreamRef.current = null;
      for (const track of stream?.getTracks?.() ?? []) {
        track.stop();
      }
    };
  }, []);

  const queuePreview = useMemo(() => {
    const preview = askQueue.slice(0, 3).map((entry) => clipText(entry, 80));
    const remainder = Math.max(0, askQueue.length - preview.length);
    return { preview, remainder };
  }, [askQueue]);

  const helixTimelineFeed = useMemo(() => {
    return [...helixTimeline].sort((a, b) => {
      const aActive = a.status === "queued" || a.status === "running" || a.status === "streaming";
      const bActive = b.status === "queued" || b.status === "running" || b.status === "streaming";
      if (aActive !== bActive) return aActive ? -1 : 1;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [helixTimeline]);

  const latestConversationBrief = useMemo(
    () => helixTimelineFeed.find((entry) => entry.type === "conversation_brief") ?? null,
    [helixTimelineFeed],
  );

  const latestTimelineEvent = useMemo(
    () => helixTimelineFeed.find((entry) => entry.type !== "conversation_brief") ?? null,
    [helixTimelineFeed],
  );

  const sessionCapsuleState = useMemo(
    () => deriveSessionCapsuleState(contextCapsuleSessionLedger),
    [contextCapsuleSessionLedger],
  );

  const activeContextCapsulePreview = useMemo<ContextCapsulePreview | null>(() => {
    if (sessionCapsuleState) {
      return {
        id: sessionCapsuleState.id,
        loading: false,
        summary: sessionCapsuleState.summary,
        convergence: sessionCapsuleState.summary.convergence,
      };
    }
    return contextCapsulePreview;
  }, [contextCapsulePreview, sessionCapsuleState]);

  const contextMemoryStatusText = useMemo(() => {
    if (!sessionCapsuleState) return null;
    return `Context memory active - ${SESSION_CAPSULE_CONFIDENCE_LABEL[sessionCapsuleState.confidenceBand]}`;
  }, [sessionCapsuleState]);

  const voiceCaptureCheckpointList = useMemo(
    () => VOICE_CAPTURE_CHECKPOINT_ORDER.map((key) => voiceCaptureCheckpoints[key]),
    [voiceCaptureCheckpoints],
  );

  const voiceCaptureHealth = useMemo<VoiceCaptureHealthSnapshot>(() => {
    const nowMs = Date.now();
    const lastChunkAgeMs =
      voiceRecorderStats.lastChunkAtMs !== null ? Math.max(0, nowMs - voiceRecorderStats.lastChunkAtMs) : null;
    const hasWarningCheckpoint = voiceCaptureCheckpointList.some(
      (checkpoint) => checkpoint.status === "warn" || checkpoint.status === "error",
    );
    const pipelineStatus =
      micArmState === "off"
        ? "idle"
        : voiceCaptureWarnings.length > 0 || hasWarningCheckpoint
          ? "attention"
          : "active";
    return {
      rmsRaw: voiceMeterStats.rmsRaw,
      rmsDb: voiceMeterStats.rmsDb,
      peak: voiceMeterStats.peak,
      noiseFloor: voiceMeterStats.noiseFloor,
      displayLevel: voiceMeterStats.displayLevel,
      mediaChunkCount: voiceRecorderStats.mediaChunkCount,
      mediaBytes: voiceRecorderStats.mediaBytes,
      chunksPerSecond: voiceRecorderStats.chunksPerSecond,
      lastChunkAgeMs,
      warnings: voiceCaptureWarnings,
      pipelineStatus,
      lastRoundtripMs: voiceLastRoundtripMs,
    };
  }, [
    micArmState,
    voiceCaptureCheckpointList,
    voiceCaptureWarnings,
    voiceLastRoundtripMs,
    voiceMeterStats,
    voiceRecorderStats,
  ]);

  const voiceLaneTimelineEvents = useMemo<VoiceLaneTimelineDebugEvent[]>(() => {
    const conversationAndReasoningEvents = [...helixTimeline]
      .sort((a, b) => a.createdAtMs - b.createdAtMs)
      .map((entry): VoiceLaneTimelineDebugEvent => {
        const source =
          entry.type === "conversation_recorded" || entry.type === "conversation_brief"
            ? "conversation"
            : "reasoning";
        const kind: VoiceLaneTimelineDebugEvent["kind"] =
          entry.type === "conversation_recorded"
            ? "prompt_recorded"
            : entry.type === "conversation_brief"
              ? "brief"
              : entry.type === "reasoning_attempt"
                ? "reasoning_attempt"
                : entry.type === "reasoning_stream"
                  ? "reasoning_stream"
                  : entry.type === "reasoning_final"
                    ? "reasoning_final"
                    : entry.type === "action_receipt"
                      ? "action_receipt"
                      : "suppressed";
        return {
          id: `timeline:${entry.id}`,
          atMs: entry.updatedAtMs || entry.createdAtMs,
          source,
          kind,
          status: entry.status,
          traceId: entry.traceId ?? null,
          turnKey: entry.traceId ?? null,
          attemptId: entry.attemptId ?? null,
          text: entry.text ? summarizeVoiceDebugText(entry.text, 300) : null,
          detail: entry.detail ? summarizeVoiceDebugText(entry.detail, 220) : null,
        };
      });
    const segmentEvents = [...voiceSegmentAttempts]
      .sort((a, b) => a.cutAtMs - b.cutAtMs)
      .map((segment): VoiceLaneTimelineDebugEvent => ({
        id: `segment:${segment.id}`,
        atMs: segment.cutAtMs,
        source: "voice_capture",
        kind: "segment",
        status: segment.status,
        traceId: null,
        turnKey: null,
        attemptId: null,
        text: segment.transcriptPreview
          ? summarizeVoiceDebugText(segment.transcriptPreview, 260)
          : null,
        detail: summarizeVoiceDebugText(
          [
            `dispatch:${segment.dispatch}`,
            segment.engine ? `engine:${segment.engine}` : null,
            segment.error ? `error:${segment.error}` : null,
            segment.sttLatencyMs !== null ? `stt:${Math.round(segment.sttLatencyMs)}ms` : null,
          ]
            .filter(Boolean)
            .join(" | "),
          220,
        ),
      }));
    const chunkEvents = [...voiceChunkTimelineEventsRef.current];
    return [...conversationAndReasoningEvents, ...segmentEvents, ...chunkEvents]
      .sort((a, b) => a.atMs - b.atMs)
      .slice(-HELIX_VOICE_DEBUG_TIMELINE_LIMIT);
  }, [helixTimeline, voiceSegmentAttempts, voiceTimelineDebugVersion]);

  useEffect(() => {
    publishVoiceCaptureDiagnosticsSnapshot({
      updatedAtMs: Date.now(),
      micArmState,
      voiceInputState,
      voiceSignalState,
      voiceMonitorLevel,
      voiceMonitorThreshold,
      voiceRecorderMimeType,
      voiceInputDeviceLabel,
      voiceTrackMuted,
      rmsRaw: voiceCaptureHealth.rmsRaw,
      rmsDb: voiceCaptureHealth.rmsDb,
      peak: voiceCaptureHealth.peak,
      noiseFloor: voiceCaptureHealth.noiseFloor,
      chunksPerSecond: voiceCaptureHealth.chunksPerSecond,
      mediaChunkCount: voiceCaptureHealth.mediaChunkCount,
      mediaBytes: voiceCaptureHealth.mediaBytes,
      lastChunkAgeMs: voiceCaptureHealth.lastChunkAgeMs,
      lastRoundtripMs: voiceCaptureHealth.lastRoundtripMs,
      warnings: [...voiceCaptureWarnings],
      checkpoints: voiceCaptureCheckpointList.map((checkpoint) => ({
        key: checkpoint.key,
        label: VOICE_CAPTURE_CHECKPOINT_LABEL[checkpoint.key],
        status: checkpoint.status,
        message: checkpoint.message,
        lastAtMs: checkpoint.lastAtMs,
      })),
      segments: voiceSegmentAttempts.map((segment) => ({
        id: segment.id,
        cutAtMs: segment.cutAtMs,
        durationMs: segment.durationMs,
        status: segment.status,
        sttLatencyMs: segment.sttLatencyMs,
        transcriptPreview: segment.transcriptPreview,
        translated: segment.translated,
        dispatch: segment.dispatch,
        engine: segment.engine,
        error: segment.error,
      })),
      playback: voiceAutoSpeakLastMetrics
        ? {
            utteranceId: voiceAutoSpeakLastMetrics.utteranceId,
            turnKey: voiceAutoSpeakLastMetrics.turnKey,
            kind: voiceAutoSpeakLastMetrics.kind,
            chunkCount: voiceAutoSpeakLastMetrics.chunkCount,
            enqueueToFirstAudioMs: voiceAutoSpeakLastMetrics.enqueueToFirstAudioMs,
            synthDurationsMs: [...voiceAutoSpeakLastMetrics.synthDurationsMs],
            chunkGapMs: [...voiceAutoSpeakLastMetrics.chunkGapMs],
            totalPlaybackMs: voiceAutoSpeakLastMetrics.totalPlaybackMs,
            cancelReason: voiceAutoSpeakLastMetrics.cancelReason,
            providerHeader: voiceAutoSpeakLastMetrics.providerHeader,
            profileHeader: voiceAutoSpeakLastMetrics.profileHeader,
            cacheHitCount: voiceAutoSpeakLastMetrics.cacheHitCount,
            cacheMissCount: voiceAutoSpeakLastMetrics.cacheMissCount,
            divergence: {
              activeUtteranceId: voiceAutoSpeakActiveUtteranceRef.current?.utteranceId ?? null,
              activeTurnKey: voiceAutoSpeakActiveUtteranceRef.current?.turnKey ?? null,
              activeRevision: voiceAutoSpeakActiveUtteranceRef.current?.revision ?? null,
              pendingPreemptPolicy: voicePendingPreemptRef.current?.policy ?? "none",
              pendingTurnKey: voicePendingPreemptRef.current?.turnKey ?? null,
              pendingUtteranceId: voicePendingPreemptRef.current?.utteranceId ?? null,
              pendingDeadlineMs: voicePendingPreemptRef.current?.timeoutAtMs ?? null,
              turnStates: Object.values(voiceTurnRevisionStateRef.current)
                .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
                .slice(0, 8)
                .map((state) => ({
                  turnKey: state.turnKey,
                  latestTranscriptRevision: state.latestTranscriptRevision,
                  latestBriefRevision: state.latestBriefRevision,
                  latestFinalRevision: state.latestFinalRevision,
                  latestRevision: state.latestRevision,
                  activeUtteranceRevision: state.activeUtteranceRevision,
                  pendingPreemptPolicy: state.pendingPreemptPolicy,
                  pendingSwitchReason: state.pendingSwitchReason,
                  pendingSinceMs: state.pendingSinceMs,
                  pendingDeadlineMs: state.pendingDeadlineMs,
                  uiVoiceRevisionMatch: state.uiVoiceRevisionMatch,
                  lastEventCode: state.lastEventCode,
                  updatedAtMs: state.updatedAtMs,
                })),
              recentEvents: [...voiceDivergenceEventsRef.current].slice(-12),
            },
          }
        : null,
      timelineEvents: voiceLaneTimelineEvents,
    });
  }, [
    helixTimeline,
    micArmState,
    voiceCaptureCheckpointList,
    voiceCaptureHealth,
    voiceCaptureWarnings,
    voiceInputDeviceLabel,
    voiceInputState,
    voiceMonitorLevel,
    voiceMonitorThreshold,
    voiceRecorderMimeType,
    voiceSegmentAttempts,
    voiceAutoSpeakLastMetrics,
    voiceLaneTimelineEvents,
    voiceSignalState,
    voiceTimelineDebugVersion,
    voiceTrackMuted,
  ]);

  return (
    <HelixAskErrorBoundary>
      <div className={className}>
        <form
          className={`w-full ${maxWidthClass} transition-[max-width] duration-300 ease-out`}
          style={formMaxWidthStyle}
          onSubmit={handleAskSubmit}
          onPointerDownCapture={() => {
            void primeVoiceAudioPlayback();
          }}
          onTouchStartCapture={() => {
            void primeVoiceAudioPlayback();
          }}
          onClickCapture={() => {
            void primeVoiceAudioPlayback();
          }}
        >
        <div
          className={`relative overflow-visible rounded-3xl border bg-slate-950/80 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur ${moodPalette.surfaceBorder}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 rounded-3xl ${moodPalette.surfaceTint}`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-0 rounded-3xl ${moodPalette.surfaceHalo}`}
            aria-hidden
          />
          <div className="relative">
            {isOffline ? (
              <div className="px-4 pt-3 text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
                Offline - reconnecting
              </div>
            ) : null}
            <div
              ref={voiceMonitorAnchorRef}
              aria-hidden={!showTopInputLevelMonitor}
              className={`absolute inset-x-4 bottom-full z-20 overflow-hidden transition-all duration-300 ease-out ${
                showTopInputLevelMonitor
                  ? "mb-2 translate-y-0 opacity-100"
                  : "pointer-events-none mb-0 max-h-0 translate-y-1 opacity-0"
              }`}
              style={
                showTopInputLevelMonitor ? { maxHeight: `${Math.max(0, voiceMonitorMaxHeightPx)}px` } : undefined
              }
            >
              <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-slate-500">
                    <span>Input level</span>
                    <span>
                      {voiceSignalState === "speech"
                        ? "speech-level signal"
                        : voiceSignalState === "low"
                          ? "low-level signal"
                          : "waiting for device audio"}
                    </span>
                  </div>
                  <div
                    className="mt-1 grid grid-cols-12 gap-0.5 rounded border border-white/10 bg-slate-900/70 p-1"
                    aria-label="Voice input level meter"
                  >
                    {Array.from({ length: 12 }).map((_, index) => {
                      const threshold = (index + 1) / 12;
                      const active = voiceMonitorLevel >= threshold;
                      return (
                        <span
                          key={`voice-level-${index}`}
                          className={`h-2 rounded-[2px] ${
                            active
                              ? voiceMonitorLevel >= 0.75
                                ? "bg-emerald-300"
                                : voiceMonitorLevel >= 0.45
                                  ? "bg-cyan-300"
                                  : "bg-sky-300"
                              : "bg-slate-700/80"
                          }`}
                        />
                      );
                    })}
                  </div>
                  {voiceSegmentAttempts.length === 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500">Listening for first segment...</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border ${moodPalette.aura}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/45 ring-1 ring-inset ${moodRingClass}`}
                >
                  {moodSrc ? (
                    <img
                      src={moodSrc}
                      alt={`${moodLabel} mood`}
                      className="h-9 w-9 object-contain"
                      loading="lazy"
                      onError={() => setAskMoodBroken(true)}
                    />
                  ) : (
                    <BrainCircuit
                      className="h-5 w-5 text-slate-100/90"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            <button
              type="button"
              aria-label={micArmState === "on" ? "Disable microphone" : "Enable microphone"}
              aria-pressed={micArmState === "on"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60 ${
                micArmState === "on"
                  ? voiceInputState === "transcribing"
                    ? "border-cyan-300/45 bg-cyan-400/12 text-cyan-100"
                    : "border-emerald-300/55 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                  : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              }`}
              onClick={handleVoiceInputToggle}
            >
              <Mic
                className={`h-4 w-4 ${
                  micArmState === "on" || voiceInputState === "transcribing" ? "animate-pulse" : ""
                }`}
              />
            </button>
            <textarea
              aria-label="Ask Helix"
              aria-disabled={askBusy}
              className="flex-1 resize-none bg-transparent text-[16px] leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none sm:text-sm"
              ref={askInputRef}
              placeholder={currentPlaceholder}
              rows={1}
              onInput={(event) =>
                syncAskDraftValue(event.currentTarget.value, {
                  target: event.currentTarget,
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit?.();
                }
              }}
            />
            <button
              aria-label={askBusy ? "Stop generation" : "Submit prompt"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60"
              onClick={askBusy ? handleStop : undefined}
              type={askBusy ? "button" : "submit"}
            >
              {askBusy ? <Square className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
            {activeContextCapsulePreview ? (
              <div className="-mt-1 px-4 pb-2 text-[10px] text-slate-300">
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-950/20 px-2 py-1">
                  <span className="uppercase tracking-[0.18em] text-cyan-200/90">capsule</span>
                  {activeContextCapsulePreview.summary ? (
                    <img
                      src={buildContextCapsuleStampDataUri(activeContextCapsulePreview.summary.stamp)}
                      alt="Context capsule fingerprint"
                      className="h-7 w-32 rounded border border-cyan-300/40 bg-cyan-950/30 object-fill"
                      style={{ imageRendering: "pixelated" }}
                      loading="lazy"
                    />
                  ) : (
                    <span className="rounded border border-cyan-300/40 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-100">
                      visual key detected
                    </span>
                  )}
                  {activeContextCapsulePreview.loading ? (
                    <span className="text-cyan-100/80">loading...</span>
                  ) : activeContextCapsulePreview.error ? (
                    <span className="text-rose-200/90">unavailable</span>
                  ) : activeContextCapsulePreview.convergence ? (
                    <span className="text-cyan-100/85">
                      {CONVERGENCE_SOURCE_LABEL[activeContextCapsulePreview.convergence.source]} /{" "}
                      {CONVERGENCE_PROOF_LABEL[activeContextCapsulePreview.convergence.proofPosture]} /{" "}
                      {CONVERGENCE_MATURITY_LABEL[activeContextCapsulePreview.convergence.maturity]}
                    </span>
                  ) : null}
                  {sessionCapsuleState ? (
                    <span className="rounded border border-emerald-300/45 bg-emerald-400/12 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-100">
                      auto-applied
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {voiceInputStatusLabel ? (
              <div className="-mt-1 px-4 pb-2 text-[10px]">
                <div
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 uppercase tracking-[0.18em] ${
                    voiceInputState === "listening"
                      ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
                      : voiceInputState === "transcribing"
                        ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-100"
                        : voiceInputState === "cooldown"
                          ? "border-indigo-300/35 bg-indigo-400/10 text-indigo-100"
                          : "border-amber-300/35 bg-amber-400/10 text-amber-100"
                  }`}
                >
                  {voiceInputStatusLabel}
                </div>
              </div>
            ) : null}
            {transcriptConfirmState ? (
              <div className="-mt-1 px-4 pb-2 text-[11px]">
                <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-2.5 py-2 text-amber-50/95">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-amber-100/90">Confirm transcript</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px]">
                    Heard: &quot;{clipText(transcriptConfirmState.transcript, 320)}&quot;
                  </p>
                  {transcriptConfirmState.translationUncertain &&
                  transcriptConfirmState.sourceText &&
                  transcriptConfirmState.sourceText.trim() &&
                  transcriptConfirmState.sourceText.trim() !== transcriptConfirmState.transcript.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap break-words text-[10px] text-amber-100/90">
                      Source ({transcriptConfirmState.sourceLanguage ?? "unknown"}): &quot;
                      {clipText(transcriptConfirmState.sourceText, 320)}&quot;
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-500/25"
                      onClick={handleTranscriptConfirmationAccept}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-amber-300/35 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-100 transition hover:bg-black/35"
                      onClick={handleTranscriptConfirmationRetry}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {latestConversationBrief ? (
              <div className="-mt-1 px-4 pb-2 text-[11px]">
                <p className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/80">brief</p>
                <p className="mt-0.5 whitespace-pre-wrap text-cyan-100/90">{latestConversationBrief.text}</p>
              </div>
            ) : null}
            {contextMemoryStatusText ? (
              <div className="-mt-1 px-4 pb-2 text-[9px] uppercase tracking-[0.14em] text-emerald-200/85">
                {contextMemoryStatusText}
              </div>
            ) : null}
            {latestTimelineEvent ? (
              <div className="-mt-1 px-4 pb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="shrink-0">{HELIX_TIMELINE_TYPE_LABEL[latestTimelineEvent.type]}</span>
                  {latestTimelineEvent.status !== "done" ? (
                    <span className="shrink-0 text-[8px] text-slate-400">{latestTimelineEvent.status}</span>
                  ) : null}
                  <span className="truncate normal-case tracking-normal text-[10px] text-slate-400/90">
                    {clipText(latestTimelineEvent.text, 140)}
                  </span>
                </div>
              </div>
            ) : null}
          {askBusy ? (
            <div
              className={`relative overflow-hidden border-t px-4 py-2 text-[11px] text-slate-300 ${moodPalette.liveBorder}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-70 ${moodPalette.replyTint}`}
                aria-hidden
              />
              <div className="relative">
                {reasoningTheater ? (
                  <div
                    className="relative mb-2 overflow-hidden px-1 py-1"
                  >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                      <div className="absolute inset-0">
                        {reasoningTheaterParticles.map((particle) => (
                          <span
                            key={particle.id}
                            className="absolute rounded-full bg-cyan-200/80 animate-pulse"
                            style={{
                              left: `${particle.leftPct}%`,
                              top: `${particle.topPct}%`,
                              width: `${particle.sizePx}px`,
                              height: `${particle.sizePx}px`,
                              opacity: particle.opacity * (0.35 + reasoningTheater.fogOpacity * 0.35),
                              animationDelay: `${particle.delayS}s`,
                              animationDuration: `${particle.durationS}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          Reasoning theater
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-[0.18em] ${REASONING_THEATER_STANCE_META[reasoningTheater.stance].badge}`}
                        >
                          {REASONING_THEATER_STANCE_META[reasoningTheater.stance].label}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-300/90">
                          {REASONING_THEATER_ARCHETYPE_LABEL[reasoningTheater.archetype]}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-300/90">
                          {REASONING_THEATER_PHASE_LABEL[reasoningTheater.phase]}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-300/90">
                          {REASONING_THEATER_CERTAINTY_LABEL[reasoningTheater.certaintyClass]}
                        </span>
                        {reasoningTheater.suppressionReason ? (
                          <span className="text-[10px] uppercase tracking-[0.16em] text-rose-200/95">
                            {REASONING_THEATER_SUPPRESSION_LABEL[reasoningTheater.suppressionReason]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-200/90">
                        {reasoningTheater.symbolicLine}
                      </p>
                      {convergenceStripActiveMode ? (
                        <div className="relative mt-2 overflow-hidden rounded-lg border border-white/15 bg-black/35 px-2 py-2">
                          {convergenceCollapseVisible ? (
                            <div className="pointer-events-none absolute inset-0">
                              <span
                                key={convergenceStripCollapseState?.token}
                                className="absolute inset-0 rounded-lg border border-cyan-200/60"
                                style={{
                                  animationName: "ping",
                                  animationDuration: `${Math.max(120, convergenceStripPresentation.collapse_pulse_ms)}ms`,
                                  animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
                                  animationIterationCount: 1,
                                }}
                              />
                            </div>
                          ) : null}
                          <div className="pointer-events-none absolute right-2 top-2">
                            <canvas
                              ref={contextCapsuleCanvasRef}
                              width={CONTEXT_CAPSULE_GRID_WIDTH}
                              height={CONTEXT_CAPSULE_GRID_HEIGHT}
                              className="h-8 w-32 rounded border border-cyan-300/20 bg-black/30"
                              aria-label="Context capsule texture"
                            />
                          </div>
                          <div className="relative pr-36">
                            <div className="relative flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceSourceTone(convergenceStripState.source)}`}
                              >
                                {CONVERGENCE_SOURCE_LABEL[convergenceStripState.source]}
                              </span>
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceProofTone(convergenceStripState.proof)}`}
                              >
                                {CONVERGENCE_PROOF_LABEL[convergenceStripState.proof]}
                              </span>
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceMaturityTone(convergenceStripState.maturity)}`}
                              >
                                {CONVERGENCE_MATURITY_LABEL[convergenceStripState.maturity]}
                              </span>
                              {convergenceIdeologyCue ? (
                                <span className="inline-flex items-center rounded border border-violet-300/35 bg-violet-400/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-violet-100">
                                  ideology cue
                                </span>
                              ) : null}
                              {convergenceCollapseVisible ? (
                                <span className="inline-flex items-center rounded border border-cyan-300/45 bg-cyan-400/12 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-cyan-100">
                                  {convergenceStripCollapseState
                                    ? CONVERGENCE_COLLAPSE_LABEL[convergenceStripCollapseState.event]
                                    : ""}
                                </span>
                              ) : null}
                            </div>
                            {convergenceStripShowPhaseTick ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {CONVERGENCE_PHASE_ORDER.map((phase, index) => {
                                  const active = phase === convergenceStripState.phase;
                                  return (
                                    <div key={phase} className="flex items-center gap-1">
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          active ? "bg-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-slate-500/70"
                                        }`}
                                        title={CONVERGENCE_PHASE_LABEL[phase]}
                                      />
                                      {index < CONVERGENCE_PHASE_ORDER.length - 1 ? (
                                        <span className="h-px w-2 bg-slate-500/50" />
                                      ) : null}
                                    </div>
                                  );
                                })}
                                <span className="ml-1 text-[9px] uppercase tracking-[0.14em] text-slate-300/90">
                                  {CONVERGENCE_PHASE_LABEL[convergenceStripState.phase]}
                                </span>
                              </div>
                            ) : null}
                            {convergenceStripShowCaption ? (
                              <p className="mt-1 text-[10px] text-slate-200/90">{convergenceStripState.caption}</p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {reasoningTheaterMedalQueue.length > 0 ? (
                        <div className="pointer-events-none mt-1 space-y-1 text-cyan-100/95">
                          <div className="flex items-end gap-1.5">
                            {reasoningTheaterMedalQueue.map((medalPulse) => {
                              const broken = reasoningTheaterMedalBrokenByToken[medalPulse.token] === true;
                              return (
                                <div
                                  key={medalPulse.token}
                                  className="overflow-hidden transition-[width,opacity,transform] duration-700 ease-out"
                                  style={{
                                    width: medalPulse.fading ? 0 : 52,
                                    opacity: medalPulse.fading ? 0 : 1,
                                    transform: medalPulse.fading ? "scale(0.86)" : "scale(1)",
                                  }}
                                >
                                  {!broken ? (
                                    <img
                                      src={medalPulse.assetPath}
                                      alt={`${REASONING_THEATER_MEDAL_LABEL[medalPulse.medal]} medal`}
                                      className="h-12 w-12 shrink-0 object-contain opacity-95 mix-blend-screen drop-shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                                      loading="lazy"
                                      onError={() =>
                                        setReasoningTheaterMedalBrokenByToken((prev) => ({
                                          ...prev,
                                          [medalPulse.token]: true,
                                        }))
                                      }
                                    />
                                  ) : (
                                    <span className="inline-flex h-12 w-12 items-center justify-center text-[8px] uppercase tracking-[0.18em] text-cyan-100/90">
                                      {REASONING_THEATER_MEDAL_LABEL[medalPulse.medal]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {latestReasoningTheaterMedal ? (
                            <div className="min-w-0 leading-tight">
                              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-cyan-200/90">
                                {REASONING_THEATER_MEDAL_LABEL[latestReasoningTheaterMedal.medal]}
                              </p>
                              <p className="truncate text-[10px] text-cyan-100/80">
                                {latestReasoningTheaterMedal.reason}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mt-2 relative h-1.5 overflow-visible rounded-full bg-black/45">
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                          <div
                            ref={reasoningTheaterMeterFillRef}
                            className={`relative h-full rounded-full ${REASONING_THEATER_STANCE_META[reasoningTheater.stance].bar}`}
                            style={{ width: `${reasoningTheaterMeterTarget}%` }}
                          >
                            <div
                              ref={reasoningTheaterMeterPatternRef}
                              className="pointer-events-none absolute inset-y-0 -left-12 w-[160%] bg-[repeating-linear-gradient(120deg,rgba(255,255,255,0.0)_0px,rgba(255,255,255,0.0)_8px,rgba(255,255,255,0.3)_10px,rgba(255,255,255,0.0)_16px)] mix-blend-screen"
                              style={{ opacity: 0.3, transform: "translate3d(0,0,0)" }}
                            />
                          </div>
                        </div>
                        {REASONING_THEATER_FRONTIER_ACTIONS_ENABLED ? (
                          <div
                            ref={reasoningTheaterFrontierCursorRef}
                            className="pointer-events-none absolute top-1/2 z-[2] will-change-transform"
                            style={{ left: "50%", transform: "translate3d(-50%,-50%,0)" }}
                          >
                            <div
                              ref={reasoningTheaterFrontierBurstRef}
                              className="absolute left-1/2 top-1/2 h-7 w-7 rounded-full border border-cyan-200/70 opacity-0"
                              style={{ transform: "translate3d(-50%,-50%,0) scale(0.7)" }}
                            />
                            {!reasoningTheaterFrontierIconBroken ? (
                              <img
                                ref={reasoningTheaterFrontierIconRef}
                                src={reasoningTheaterFrontierIconPath}
                                alt={`${REASONING_THEATER_FRONTIER_ACTION_LABEL[reasoningTheaterFrontierAction]} frontier action`}
                                className="relative z-[3] h-6 w-6 object-contain mix-blend-screen drop-shadow-[0_0_16px_rgba(148,163,184,0.6)]"
                                loading="lazy"
                                onError={(event) =>
                                  setReasoningTheaterFrontierIconBrokenByPath((prev) => {
                                    const next = { ...prev };
                                    next[reasoningTheaterFrontierIconPath] = true;
                                    const currentSrc = event.currentTarget.currentSrc?.trim();
                                    if (currentSrc) {
                                      next[currentSrc] = true;
                                    }
                                    return next;
                                  })
                                }
                              />
                            ) : null}
                            <span
                              ref={reasoningTheaterFrontierTextRef}
                              className="relative z-[3] hidden min-w-[56px] rounded-sm border border-white/25 bg-black/50 px-1 py-0.5 text-[8px] uppercase tracking-[0.16em]"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[2]">
                              {reasoningTheaterFrontierParticles.map((particle, index) => (
                                <span
                                  key={particle.id}
                                  ref={(node) => {
                                    reasoningTheaterFrontierParticleRefs.current[index] = node;
                                  }}
                                  className="absolute left-0 top-0 block rounded-full"
                                  style={{ opacity: 0, transform: "translate3d(0,0,0)" }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-300/90">
                        <span>momentum {Math.round(reasoningTheater.momentum * 100)}%</span>
                        <span>ambiguity {Math.round(reasoningTheater.ambiguityPressure * 100)}%</span>
                        <span>pulse {reasoningTheater.pulseHz.toFixed(1)}Hz</span>
                        <span>clock {REASONING_THEATER_CLOCK_FPS}fps</span>
                        <span>
                          evt {REASONING_THEATER_CLOCK_SOURCE_LABEL[reasoningTheaterClockDebug.source]}
                          {reasoningTheaterClockDebug.seq !== null
                            ? ` #${reasoningTheaterClockDebug.seq}`
                            : ""}
                        </span>
                        <span>
                          frontier {reasoningTheaterFrontierAction} (
                          {reasoningTheaterFrontierDebug.deltaPct >= 0 ? "+" : ""}
                          {reasoningTheaterFrontierDebug.deltaPct.toFixed(1)}%/
                          {reasoningTheaterConfig.frontier_actions.window_ms}ms)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Live
                  </span>
                  <span className="text-slate-200">
                    {askLiveStatusText ?? "Working..."}
                  </span>
                  {askElapsedMs !== null ? (
                    <span className="text-slate-500">
                      ({Math.round(askElapsedMs / 1000)}s)
                    </span>
                  ) : null}
                </div>
                {askActiveQuestion ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Now
                    </span>{" "}
                    {clipText(askActiveQuestion, 140)}
                  </p>
                ) : null}
                {askQueue.length > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Queue ({askQueue.length})
                    </span>{" "}
                    {queuePreview.preview.join(" | ")}
                    {queuePreview.remainder > 0
                      ? ` +${queuePreview.remainder} more`
                      : ""}
                  </p>
                ) : null}
                {askLiveEvents.length > 0 ? (
                  <div className="mt-2 max-h-40 space-y-2 overflow-hidden pr-1 text-[11px] text-slate-300">
                    {askLiveEvents.map((entry) => {
                      const label = entry.tool?.startsWith("helix.ask.")
                        ? entry.tool.replace("helix.ask.", "").replace(/\./g, " ")
                        : entry.tool ?? "event";
                      return (
                        <div key={entry.id} className="px-1 py-0.5">
                          <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
                            {label}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-slate-300">{entry.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Waiting for updates...
                  </p>
                )}
                {askLiveDraft ? (
                  <div className="mt-2 max-h-28 overflow-hidden px-1 py-0.5 text-[11px] text-slate-200">
                    <p className="whitespace-pre-wrap leading-relaxed">{askLiveDraft}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        </div>
        </form>
        {askError ? (
          <p className="mt-3 text-xs text-rose-200">{askError}</p>
        ) : null}
        {askReplies.length > 0 ? (
          <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-2">
          {askReplies.map((reply) => {
            const replyEvents = resolveReplyEvents(reply);
            const replyConvergence = resolveReplyConvergenceSnapshot(reply, replyEvents);
            const expanded = Boolean(askExpandedByReply[reply.id]);
            return (
              <div
                  key={reply.id}
                  className={`relative overflow-hidden rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur ${moodPalette.replyBorder}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 opacity-80 ${moodPalette.replyTint}`}
                    aria-hidden
                  />
                  <div className="relative">
                {reply.contextCapsule ? (
                  <div className="mb-2 w-full rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-3 py-2 text-left text-xs text-cyan-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Context capsule</p>
                        <img
                          src={buildContextCapsuleStampDataUri(reply.contextCapsule.stamp)}
                          alt="Context capsule fingerprint"
                          className="mt-1 h-10 w-44 rounded border border-cyan-300/40 bg-cyan-950/30 object-fill"
                          style={{ imageRendering: "pixelated" }}
                          loading="lazy"
                        />
                      </div>
                      <span className="shrink-0 rounded border border-cyan-300/35 bg-cyan-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-cyan-100">
                        auto
                      </span>
                    </div>
                  </div>
                ) : null}
                {reply.question ? (
                  <p className="mb-2 text-xs text-slate-300">
                    <span className="text-slate-400">Question:</span> {reply.question}
                  </p>
                ) : null}
                {renderHelixAskEnvelope(reply)}
                {(() => {
                  const objectiveSignals = extractObjectiveSignals(replyEvents);
                  if (!objectiveSignals.objective && objectiveSignals.gaps.length === 0 && !objectiveSignals.suppression) return null;
                  return (
                    <div className="mt-2 rounded-lg border border-indigo-400/20 bg-indigo-950/20 px-3 py-2 text-xs text-indigo-100">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300">Objective-first situational view</p>
                      {objectiveSignals.objective ? <p className="mt-1">Objective: {objectiveSignals.objective}</p> : null}
                      {objectiveSignals.gaps.length > 0 ? <p className="mt-1">Top unresolved gaps: {objectiveSignals.gaps.join(" | ")}</p> : null}
                      <p className="mt-1">Suppression inspector: {objectiveSignals.suppression ?? "not suppressed"}</p>
                    </div>
                  );
                })()}
                {convergenceStripShowReplySnapshot ? (
                  <div className="mt-2 rounded-lg border border-white/12 bg-black/25 px-3 py-2 text-xs">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Convergence snapshot</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceSourceTone(replyConvergence.source)}`}
                      >
                        {CONVERGENCE_SOURCE_LABEL[replyConvergence.source]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceProofTone(replyConvergence.proof)}`}
                      >
                        {CONVERGENCE_PROOF_LABEL[replyConvergence.proof]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${convergenceMaturityTone(replyConvergence.maturity)}`}
                      >
                        {CONVERGENCE_MATURITY_LABEL[replyConvergence.maturity]}
                      </span>
                      <span className="inline-flex items-center rounded border border-slate-300/25 bg-slate-400/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-200">
                        {CONVERGENCE_PHASE_LABEL[replyConvergence.phase]}
                      </span>
                    </div>
                    {convergenceStripShowCaption ? (
                      <p className="mt-1 text-[10px] text-slate-300">{replyConvergence.caption}</p>
                    ) : null}
                  </div>
                ) : null}
                {reply.proof ? (
                  <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Proof</p>
                    <p className="mt-1">Mode: {reply.mode ?? "read"} | Verdict: {reply.proof.verdict ?? "n/a"}</p>
                    {reply.proof.certificate?.certificateHash ? (
                      <p className="mt-1">Certificate: {reply.proof.certificate.certificateHash}</p>
                    ) : null}
                    {typeof reply.proof.certificate?.integrityOk === "boolean" ? (
                      <p className="mt-1">Integrity: {reply.proof.certificate.integrityOk ? "OK" : "FAILED"}</p>
                    ) : null}
                    {reply.proof.artifacts?.length ? (
                      <p className="mt-1 whitespace-pre-wrap">
                        Artifacts: {reply.proof.artifacts.map((a) => `${a.kind}: ${a.ref}`).join(", ")}
                      </p>
                    ) : null}
                  </div>
              ) : null}
              {userSettings.showHelixAskDebug && reply.debug?.client_inferred_mode ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Client inference
                  </p>
                  <p className="mt-1">Mode: {reply.debug.client_inferred_mode}</p>
                </div>
              ) : null}
              {userSettings.showHelixAskDebug &&
              (reply.debug?.capsule_dialogue_applied_count !== undefined ||
                reply.debug?.capsule_evidence_applied_count !== undefined ||
                reply.debug?.focus_guard_result ||
                reply.debug?.anchor_guard_result ||
                reply.debug?.capsule_retry_applied !== undefined) ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Capsule guards
                  </p>
                  <p className="mt-1">
                    Dialogue: {reply.debug?.capsule_dialogue_applied_count ?? 0} | Evidence:{" "}
                    {reply.debug?.capsule_evidence_applied_count ?? 0}
                  </p>
                  <p className="mt-1">
                    Focus: {reply.debug?.focus_guard_result ?? "pass"} | Anchor:{" "}
                    {reply.debug?.anchor_guard_result ?? "pass"}
                  </p>
                  <p className="mt-1">
                    Retry: {reply.debug?.capsule_retry_applied ? "applied" : "not applied"}
                    {reply.debug?.capsule_retry_reason ? ` (${reply.debug.capsule_retry_reason})` : ""}
                  </p>
                </div>
              ) : null}
              {userSettings.showHelixAskDebug &&
              (reply.sources?.length || reply.debug?.context_files?.length || reply.debug?.prompt_context_files?.length) ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Context sources
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {(reply.sources?.length
                      ? reply.sources
                      : reply.debug?.context_files ?? reply.debug?.prompt_context_files ?? []
                    )
                      .filter(Boolean)
                      .slice(0, 12)
                      .join("\n")}
                  </p>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  Saved in Helix Console
                  {reply.promptIngested ? " | Prompt ingested" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyReply(reply)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-200"
                    aria-label="Copy response"
                  >
                    Copy
                  </button>
                  {reply.contextCapsule ? (
                    <button
                      type="button"
                      onClick={() => void handleCopyContextCapsule(reply)}
                      className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/20"
                      aria-label="Copy context capsule"
                    >
                      Copy Capsule
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleReadAloud(reply)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-200"
                    aria-label="Read aloud"
                  >
                    Read aloud ({readAloudByReply[reply.id] ?? "idle"})
                  </button>
                  {onOpenConversation ? (
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                      onClick={handleOpenConversationPanel}
                      type="button"
                    >
                      Open conversation
                    </button>
                  ) : null}
                </div>
              </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </HelixAskErrorBoundary>
  );
}


