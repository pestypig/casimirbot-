import crypto from "node:crypto";
import {
  HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
  HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA,
  type HelixInterimVoiceCalloutKind,
  type HelixInterimVoiceCalloutReceiptV1,
  type HelixInterimVoiceCalloutRequestV1,
  type HelixInterimVoiceCalloutSource,
  type HelixInterimVoicePlaybackKind,
} from "@shared/contracts/helix-interim-voice-callout.v1";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";

const MAX_INTERIM_CALLOUT_CHARS = 220;
const MAX_IMMEDIATE_ACK_CHARS = 96;
const RECENT_CALLOUT_LIMIT = 120;

const requestById = new Map<string, HelixInterimVoiceCalloutRequestV1>();
const receiptById = new Map<string, HelixInterimVoiceCalloutReceiptV1>();

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
    value === "translation_relay"
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
  Array.from(requestById.values()).some((request) => {
    if (request.turnId !== turnId || request.threadId !== threadId || request.kind !== "immediate_ack") return false;
    return Array.from(receiptById.values()).some((receipt) =>
      receipt.requestId === request.requestId &&
      (receipt.status === "queued" || receipt.status === "delivered")
    );
  });

const normalizeSource = (value: string | null | undefined): HelixInterimVoiceCalloutSource => {
  if (
    value === "ask_tool_loop" ||
    value === "live_source_mail_loop" ||
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
): HelixInterimVoicePlaybackKind =>
  value === "translation_relay" || kind === "translation_relay" ? "translation_relay" : "tool_receipt";

const pruneRecent = <T extends { requestId?: string; receiptId?: string }>(map: Map<string, T>) => {
  while (map.size > RECENT_CALLOUT_LIMIT) {
    const firstKey = map.keys().next().value;
    if (!firstKey) break;
    map.delete(firstKey);
  }
};

const buildReceipt = (input: {
  request: HelixInterimVoiceCalloutRequestV1;
  status: HelixInterimVoiceCalloutReceiptV1["status"];
  message?: string | null;
  utteranceId?: string | null;
  provider?: string | null;
}): HelixInterimVoiceCalloutReceiptV1 => {
  const receipt: HelixInterimVoiceCalloutReceiptV1 = {
    artifactId: "helix_interim_voice_callout_receipt",
    schemaVersion: HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
    receiptId: `helix_interim_voice_callout_receipt:${hashShort([
      input.request.requestId,
      input.status,
      input.message ?? null,
      Date.now(),
    ])}`,
    requestId: input.request.requestId,
    status: input.status,
    delivery: {
      utteranceId: input.utteranceId ?? null,
      provider: input.provider ?? "helix_interim_voice_callout",
      message: input.message ?? null,
    },
    evidenceRefs: uniqueStrings([input.request.requestId, ...input.request.evidenceRefs]),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
  receiptById.set(receipt.receiptId, receipt);
  pruneRecent(receiptById);
  return receipt;
};

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
  const kind = normalizeKind(input.kind);
  const kindMaxChars = kind === "immediate_ack" ? MAX_IMMEDIATE_ACK_CHARS : MAX_INTERIM_CALLOUT_CHARS;
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
  requestById.set(request.requestId, request);
  pruneRecent(requestById);

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
    return {
      request,
      receipt: buildReceipt({
        request,
        status: "blocked_capacity",
        message: `Voice TTS admission blocked: ${admission.reason}.`,
      }),
    };
  }
  admission.lease?.release("completed");
  return {
    request,
    receipt: buildReceipt({
      request,
      status: "queued",
      utteranceId: `interim_voice:${hashShort(request.requestId)}`,
      message: "Interim voice callout queued for voice playback.",
    }),
  };
}

export function listInterimVoiceCalloutRequests(input: {
  threadId?: string | null;
  turnId?: string | null;
  limit?: number;
} = {}): HelixInterimVoiceCalloutRequestV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, RECENT_CALLOUT_LIMIT));
  return Array.from(requestById.values())
    .filter((entry) => !input.threadId || entry.threadId === input.threadId)
    .filter((entry) => !input.turnId || entry.turnId === input.turnId)
    .slice(-limit);
}

export function listInterimVoiceCalloutReceipts(input: {
  requestId?: string | null;
  limit?: number;
} = {}): HelixInterimVoiceCalloutReceiptV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, RECENT_CALLOUT_LIMIT));
  return Array.from(receiptById.values())
    .filter((entry) => !input.requestId || entry.requestId === input.requestId)
    .slice(-limit);
}

export function resetInterimVoiceCalloutsForTest(): void {
  requestById.clear();
  receiptById.clear();
}
