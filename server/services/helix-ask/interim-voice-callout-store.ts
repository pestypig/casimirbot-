import crypto from "node:crypto";
import {
  HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA,
  type HelixInterimVoiceCalloutKind,
  type HelixInterimVoiceCalloutReceiptV1,
  type HelixInterimVoiceCalloutRequestV1,
  type HelixInterimVoiceCalloutSource,
  type HelixInterimVoicePlaybackKind,
} from "@shared/contracts/helix-interim-voice-callout.v1";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";
import { buildInterimVoiceCalloutReceipt } from "./voice-playback/receipt-builder";
import { createInterimVoiceCalloutReceiptStore } from "./voice-playback/receipt-store";
import { createInterimVoiceDeliveryRetryPolicy } from "./voice-playback/retry-policy";
import { createInterimVoiceCalloutRequestStore } from "./voice-playback/request-store";
import {
  createVoicePlaybackOutcomeWaiterStore,
  findLatestClientVoicePlaybackOutcomeReceipt,
  normalizeVoicePlaybackOutcomeStatus,
} from "./voice-playback/outcome-receipts";

const MAX_INTERIM_CALLOUT_CHARS = 220;
const MAX_IMMEDIATE_ACK_CHARS = 96;
const MAX_STEERING_ACK_CHARS = 96;
const VOICE_STEERING_EVENT_REF_PREFIX = "helix_voice_steering_event:";
const RECENT_CALLOUT_LIMIT = 120;
const TEXT_TO_SPEECH_CAPABILITY_LANE_REASON = "capability_lane_text_to_speech_speak_text";

const requestStore = createInterimVoiceCalloutRequestStore({
  limit: RECENT_CALLOUT_LIMIT,
});
const receiptStore = createInterimVoiceCalloutReceiptStore({
  limit: RECENT_CALLOUT_LIMIT,
});
const playbackOutcomeWaiters = createVoicePlaybackOutcomeWaiterStore();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] => {
  const result = new Set<string>();
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) result.add(text);
  }
  return Array.from(result);
};

const normalizeText = (value: string | null | undefined, maxChars: number): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...` : text;
};

const normalizeKind = (value: string | null | undefined): HelixInterimVoiceCalloutKind => {
  if (
    value === "immediate_ack" ||
    value === "tool_started" ||
    value === "tool_progress" ||
    value === "tool_result" ||
    value === "waiting_for_evidence" ||
    value === "memory_pressure" ||
    value === "clarifying_status" ||
    value === "steering_ack" ||
    value === "translation_relay" ||
    value === "narrator_read" ||
    value === "panel_narration"
  ) {
    return value;
  }
  return "clarifying_status";
};

const normalizeTimingHintMs = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(Math.floor(value), 5_000));
};

const hasQueuedImmediateAckForTurn = (turnId: string, threadId: string): boolean =>
  requestStore.values().some((request) => {
    if (request.turnId !== turnId || request.threadId !== threadId || request.kind !== "immediate_ack") return false;
    return receiptStore.values().some((receipt) =>
      receipt.requestId === request.requestId &&
      (
        receipt.status === "awaiting_client_playback" ||
        receipt.status === "queued" ||
        receipt.status === "queued_for_retry" ||
        receipt.status === "delivered"
      )
    );
  });

const readVoiceSteeringEventRef = (evidenceRefs: string[]): string | null =>
  evidenceRefs.find((ref) => ref.startsWith(VOICE_STEERING_EVENT_REF_PREFIX)) ?? null;

const hasQueuedSteeringAckForEvent = (steeringEventId: string): boolean =>
  requestStore.values().some((request) => {
    if (request.kind !== "steering_ack" || !request.evidenceRefs.includes(steeringEventId)) return false;
    return receiptStore.values().some((receipt) =>
      receipt.requestId === request.requestId &&
      (
        receipt.status === "awaiting_client_playback" ||
        receipt.status === "queued" ||
        receipt.status === "queued_for_retry" ||
        receipt.status === "delivered"
      )
    );
  });

const normalizeSource = (value: string | null | undefined): HelixInterimVoiceCalloutSource => {
  if (
    value === "ask_tool_loop" ||
    value === "live_source_mail_loop" ||
    value === "voice_steering_queue" ||
    value === "runtime_governor" ||
    value === "manual_read"
  ) {
    return value;
  }
  return "ask_tool_loop";
};

const normalizePlaybackKind = (
  value: string | null | undefined,
  kind: HelixInterimVoiceCalloutKind,
): HelixInterimVoicePlaybackKind => {
  if (value === "translation_relay" || kind === "translation_relay") return "translation_relay";
  if (value === "narrator_read" || kind === "narrator_read") return "narrator_read";
  if (value === "panel_narration" || kind === "panel_narration") return "panel_narration";
  return "tool_receipt";
};

const isTextToSpeechCapabilityLaneClientHandoff = (
  request: HelixInterimVoiceCalloutRequestV1,
): boolean =>
  request.source === "ask_tool_loop" &&
  request.kind === "tool_result" &&
  request.reasonCodes.includes(TEXT_TO_SPEECH_CAPABILITY_LANE_REASON);

const findLatestClientPlaybackOutcomeReceipt = (
  requestId: string,
): HelixInterimVoiceCalloutReceiptV1 | null =>
  findLatestClientVoicePlaybackOutcomeReceipt({
    receipts: receiptStore.values(),
    requestId,
  });

const buildReceipt = (input: {
  request: HelixInterimVoiceCalloutRequestV1;
  status: HelixInterimVoiceCalloutReceiptV1["status"];
  message?: string | null;
  utteranceId?: string | null;
  provider?: string | null;
  nextRetryAtMs?: number | null;
  retryCount?: number | null;
  blockedReason?: string | null;
}): HelixInterimVoiceCalloutReceiptV1 => {
  const receipt = buildInterimVoiceCalloutReceipt(input);
  receiptStore.set(receipt);
  return receipt;
};

const retryPolicy = createInterimVoiceDeliveryRetryPolicy({
  getRequestById: (requestId) => requestStore.get(requestId),
  buildReceipt,
});

export function retryQueuedInterimVoiceCalloutDeliveries(input: {
  threadId?: string | null;
  turnId?: string | null;
  nowMs?: number;
  force?: boolean;
} = {}): HelixInterimVoiceCalloutReceiptV1[] {
  return retryPolicy.retryQueuedDeliveries(input);
}

export function recordInterimVoiceCalloutRequest(input: {
  turnId: string;
  threadId: string;
  source?: string | null;
  kind?: string | null;
  text?: string | null;
  maxChars?: number | null;
  timingHintMs?: number | null;
  voicePlaybackKind?: string | null;
  requiresConfirmation?: boolean | null;
  evidenceRefs?: string[];
  reasonCodes?: string[];
}): {
  request: HelixInterimVoiceCalloutRequestV1;
  receipt: HelixInterimVoiceCalloutReceiptV1;
} {
  retryQueuedInterimVoiceCalloutDeliveries({ threadId: input.threadId });
  const kind = normalizeKind(input.kind);
  const kindMaxChars =
    kind === "immediate_ack"
      ? MAX_IMMEDIATE_ACK_CHARS
      : kind === "steering_ack"
        ? MAX_STEERING_ACK_CHARS
        : MAX_INTERIM_CALLOUT_CHARS;
  const maxChars = Math.max(1, Math.min(Math.floor(input.maxChars ?? kindMaxChars), kindMaxChars));
  const text = normalizeText(input.text, maxChars);
  const requestId = `helix_interim_voice_callout_request:${hashShort([
    input.turnId,
    input.threadId,
    input.source ?? "ask_tool_loop",
    kind,
    text,
    Date.now(),
  ])}`;
  const request: HelixInterimVoiceCalloutRequestV1 = {
    artifactId: "helix_interim_voice_callout_request",
    schemaVersion: HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA,
    requestId,
    turnId: input.turnId,
    threadId: input.threadId,
    source: normalizeSource(input.source),
    kind,
    text,
    maxChars,
    timingHintMs: normalizeTimingHintMs(input.timingHintMs),
    voicePlaybackKind: normalizePlaybackKind(input.voicePlaybackKind, kind),
    authority: "provisional",
    requiresConfirmation: input.requiresConfirmation === true,
    evidenceRefs: uniqueStrings(input.evidenceRefs ?? []),
    reasonCodes: uniqueStrings(input.reasonCodes ?? []),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    context_role: "tool_evidence",
  };
  requestStore.set(request);

  if (!text) {
    return {
      request,
      receipt: buildReceipt({
        request,
        status: "blocked_missing_text",
        message: "Interim voice callout text is required.",
      }),
    };
  }

  if (request.requiresConfirmation) {
    return {
      request,
      receipt: buildReceipt({
        request,
        status: "blocked_policy",
        message: "Interim voice callout requires confirmation.",
      }),
    };
  }

  if (request.kind === "steering_ack") {
    const steeringEventId = readVoiceSteeringEventRef(request.evidenceRefs);
    if (!steeringEventId) {
      return {
        request,
        receipt: buildReceipt({
          request,
          status: "blocked_policy",
          message: "Steering acknowledgements require a voice steering event evidence ref.",
        }),
      };
    }
    if (hasQueuedSteeringAckForEvent(steeringEventId)) {
      return {
        request,
        receipt: buildReceipt({
          request,
          status: "blocked_policy",
          message: "Only one steering acknowledgement may be queued per voice steering event.",
        }),
      };
    }
    if (/\b(final answer|answer is|i'?m done|completed|complete|finished|result is)\b/i.test(request.text)) {
      return {
        request,
        receipt: buildReceipt({
          request,
          status: "blocked_policy",
          message: "Steering acknowledgements cannot claim final answer status.",
        }),
      };
    }
  }

  if (request.kind === "immediate_ack" && hasQueuedImmediateAckForTurn(request.turnId, request.threadId)) {
    return {
      request,
      receipt: buildReceipt({
        request,
        status: "blocked_policy",
        message: "Only one immediate voice acknowledgement may be queued per Ask turn.",
      }),
    };
  }

  const admission = runtimeMemoryGovernor.admitRuntimeTask({
    taskClass: "voice_tts",
    traceId: request.requestId,
    source: "helix.interim_voice_callout",
  });
  if (!admission.admitted) {
    if (isTextToSpeechCapabilityLaneClientHandoff(request)) {
      return {
        request,
        receipt: buildReceipt({
          request,
          status: "awaiting_client_playback",
          utteranceId: `interim_voice:${hashShort([request.requestId, "client_handoff_under_pressure"])}`,
          message:
            `Text-to-speech client playback handoff accepted while server TTS admission reported ${admission.reason}; awaiting browser playback receipt.`,
          blockedReason: admission.reason,
        }),
      };
    }
    return {
      request,
      receipt: retryPolicy.enqueueRetryJob(request, admission.reason),
    };
  }
  admission.lease?.release("completed");
  return {
    request,
    receipt: buildReceipt({
      request,
      status: "awaiting_client_playback",
      utteranceId: `interim_voice:${hashShort(request.requestId)}`,
      message: "Interim voice callout accepted for client playback handoff; awaiting browser playback receipt.",
    }),
  };
}

export function listInterimVoiceCalloutRequests(input: {
  threadId?: string | null;
  turnId?: string | null;
  limit?: number;
} = {}): HelixInterimVoiceCalloutRequestV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, RECENT_CALLOUT_LIMIT));
  return requestStore.list({
    threadId: input.threadId,
    turnId: input.turnId,
    limit,
  });
}

export function listInterimVoiceCalloutReceipts(input: {
  requestId?: string | null;
  limit?: number;
} = {}): HelixInterimVoiceCalloutReceiptV1[] {
  retryQueuedInterimVoiceCalloutDeliveries();
  const limit = Math.max(1, Math.min(input.limit ?? 50, RECENT_CALLOUT_LIMIT));
  return receiptStore.list({
    requestId: input.requestId,
    limit,
  });
}

export function recordInterimVoicePlaybackOutcome(input: {
  requestId?: string | null;
  sourceReceiptId?: string | null;
  utteranceId?: string | null;
  status?: string | null;
  message?: string | null;
  provider?: string | null;
}): {
  ok: boolean;
  request: HelixInterimVoiceCalloutRequestV1 | null;
  receipt: HelixInterimVoiceCalloutReceiptV1 | null;
  error?: string;
} {
  const requestId = String(input.requestId ?? "").trim();
  const sourceReceiptId = String(input.sourceReceiptId ?? "").trim();
  const status = normalizeVoicePlaybackOutcomeStatus(input.status);
  const request =
    (requestId ? requestStore.get(requestId) : null) ??
    (sourceReceiptId ? (() => {
      const sourceReceipt = receiptStore.get(sourceReceiptId);
      return sourceReceipt ? requestStore.get(sourceReceipt.requestId) : null;
    })() : null);

  if (!request) {
    return {
      ok: false,
      request: null,
      receipt: null,
      error: "interim_voice_callout_request_not_found",
    };
  }
  if (!status) {
    return {
      ok: false,
      request,
      receipt: null,
      error: "invalid_voice_playback_outcome_status",
    };
  }

  const receiptStatus: HelixInterimVoiceCalloutReceiptV1["status"] =
    status === "delivered"
      ? "delivered"
      : status === "queued"
        ? "queued"
        : "failed";
  const receipt = buildReceipt({
    request,
    status: receiptStatus,
    utteranceId: input.utteranceId ?? null,
    provider: input.provider ?? "helix_client_voice_playback",
    message: input.message ?? `Client voice playback outcome: ${status}.`,
    blockedReason:
      status === "cancelled" || status === "suppressed" || status === "failed"
        ? status
        : null,
  });
  playbackOutcomeWaiters.notify(receipt);
  return {
    ok: true,
    request,
    receipt,
  };
}

export function waitForInterimVoicePlaybackOutcome(input: {
  requestId?: string | null;
  sourceReceiptId?: string | null;
  timeoutMs?: number | null;
}): Promise<HelixInterimVoiceCalloutReceiptV1 | null> {
  const sourceReceiptId = String(input.sourceReceiptId ?? "").trim();
  const sourceReceipt = sourceReceiptId ? receiptStore.get(sourceReceiptId) : null;
  const requestId = String(input.requestId ?? sourceReceipt?.requestId ?? "").trim();
  if (!requestId) return Promise.resolve(null);
  const timeoutMs = Math.max(0, Math.min(Math.floor(input.timeoutMs ?? 8_000), 30_000));
  return playbackOutcomeWaiters.wait({
    requestId,
    timeoutMs,
    findLatest: () => findLatestClientPlaybackOutcomeReceipt(requestId),
  });
}

export function resetInterimVoiceCalloutsForTest(): void {
  requestStore.clear();
  receiptStore.clear();
  retryPolicy.reset();
  playbackOutcomeWaiters.reset();
}
