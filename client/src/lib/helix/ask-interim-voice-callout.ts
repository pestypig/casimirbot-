import type { VoicePlaybackUtteranceIntent } from "@/lib/helix/ask-voice-playback-intent";

export type InterimVoiceCalloutKind =
  | "immediate_ack"
  | "tool_started"
  | "tool_progress"
  | "tool_result"
  | "waiting_for_evidence"
  | "memory_pressure"
  | "clarifying_status"
  | "steering_ack"
  | "translation_relay"
  | "narrator_read"
  | "panel_narration";

export type InterimVoiceCalloutPlaybackIntent = VoicePlaybackUtteranceIntent & {
  requestId: string;
  receiptId: string;
  receiptKey: string;
  calloutKind: InterimVoiceCalloutKind;
};

const INTERIM_VOICE_CALLOUT_TOOL_RESULT_SCHEMA = "helix.interim_voice_callout_tool_result.v1";

const INTERIM_VOICE_CALLOUT_KINDS = new Set<InterimVoiceCalloutKind>([
  "immediate_ack",
  "tool_started",
  "tool_progress",
  "tool_result",
  "waiting_for_evidence",
  "memory_pressure",
  "clarifying_status",
  "steering_ack",
  "translation_relay",
  "narrator_read",
  "panel_narration",
]);

const INTERIM_VOICE_CALLOUT_PLAYABLE_STATUSES = new Set([
  "awaiting_client_playback",
  "queued",
  "delivered",
]);

const readInterimVoiceRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readInterimVoiceString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isInterimVoiceAuthoritySafe = (record: Record<string, unknown>): boolean =>
  record.assistant_answer === false &&
  record.terminal_eligible === false &&
  record.raw_content_included === false;

const readInterimVoiceCalloutKind = (value: unknown): InterimVoiceCalloutKind | null => {
  const kind = readInterimVoiceString(value);
  return kind && INTERIM_VOICE_CALLOUT_KINDS.has(kind as InterimVoiceCalloutKind)
    ? kind as InterimVoiceCalloutKind
    : null;
};

export const buildInterimVoiceReceiptPlaybackIntent = (
  value: unknown,
): InterimVoiceCalloutPlaybackIntent | null => {
  const result = readInterimVoiceRecord(value);
  if (!result || result.schema !== INTERIM_VOICE_CALLOUT_TOOL_RESULT_SCHEMA) return null;
  const request = readInterimVoiceRecord(result.request);
  const receipt = readInterimVoiceRecord(result.receipt);
  if (!request || !receipt) return null;
  if (!isInterimVoiceAuthoritySafe(request) || !isInterimVoiceAuthoritySafe(receipt)) return null;
  if (request.authority !== "provisional") return null;
  const status = readInterimVoiceString(receipt.status);
  if (!status || !INTERIM_VOICE_CALLOUT_PLAYABLE_STATUSES.has(status)) return null;
  const calloutKind = readInterimVoiceCalloutKind(request.kind);
  if (!calloutKind) return null;
  const text = readInterimVoiceString(request.text);
  const turnKey = readInterimVoiceString(request.turnId) ?? readInterimVoiceString(request.turn_id);
  const requestId = readInterimVoiceString(request.requestId) ?? readInterimVoiceString(request.request_id);
  const receiptId = readInterimVoiceString(receipt.receiptId) ?? readInterimVoiceString(receipt.receipt_id);
  if (!text || !turnKey || !requestId || !receiptId) return null;
  const delivery = readInterimVoiceRecord(receipt.delivery);
  const utteranceId = readInterimVoiceString(delivery?.utteranceId) ?? readInterimVoiceString(delivery?.utterance_id);
  const receiptKey = utteranceId ?? receiptId;
  const requestedPlaybackKind = readInterimVoiceString(request.voicePlaybackKind);
  const playbackKind =
    requestedPlaybackKind === "translation_relay" || calloutKind === "translation_relay"
      ? "translation_relay"
      : requestedPlaybackKind === "narrator_read" || calloutKind === "narrator_read"
        ? "narrator_read"
        : requestedPlaybackKind === "panel_narration" || calloutKind === "panel_narration"
          ? "panel_narration"
          : "tool_receipt";
  return {
    kind: playbackKind,
    authority: "provisional",
    source: "agent_loop",
    turnKey,
    revision: 1,
    text,
    traceId: turnKey,
    eventId: receiptId,
    requestId,
    receiptId,
    receiptKey,
    calloutKind,
    interimVoiceRequestId: requestId,
    interimVoiceReceiptId: receiptId,
    interimVoiceReceiptKey: receiptKey,
    interimVoiceCalloutKind: calloutKind,
  };
};

export function collectInterimVoiceCalloutPlaybackIntents(input: {
  artifacts: unknown[];
  spokenReceiptKeys?: Iterable<string>;
  spokenImmediateAckTurnKeys?: Iterable<string>;
}): InterimVoiceCalloutPlaybackIntent[] {
  const spokenReceiptKeys = new Set(input.spokenReceiptKeys ?? []);
  const spokenImmediateAckTurnKeys = new Set(input.spokenImmediateAckTurnKeys ?? []);
  const emittedReceiptKeys = new Set<string>();
  const emittedImmediateAckTurnKeys = new Set<string>();
  const intents: InterimVoiceCalloutPlaybackIntent[] = [];
  const visited = new WeakSet<object>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);
    const intent = buildInterimVoiceReceiptPlaybackIntent(value);
    if (intent) {
      const receiptKnown =
        spokenReceiptKeys.has(intent.receiptKey) ||
        spokenReceiptKeys.has(intent.receiptId) ||
        emittedReceiptKeys.has(intent.receiptKey) ||
        emittedReceiptKeys.has(intent.receiptId);
      const immediateAckKnown =
        intent.calloutKind === "immediate_ack" &&
        (spokenImmediateAckTurnKeys.has(intent.turnKey) || emittedImmediateAckTurnKeys.has(intent.turnKey));
      if (!receiptKnown && !immediateAckKnown) {
        intents.push(intent);
        emittedReceiptKeys.add(intent.receiptKey);
        emittedReceiptKeys.add(intent.receiptId);
        if (intent.calloutKind === "immediate_ack") {
          emittedImmediateAckTurnKeys.add(intent.turnKey);
        }
      }
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    for (const child of Object.values(value as Record<string, unknown>)) {
      visit(child);
    }
  };

  input.artifacts.forEach(visit);
  return intents;
}
