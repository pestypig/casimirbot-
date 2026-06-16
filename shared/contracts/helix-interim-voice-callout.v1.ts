export const HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA =
  "helix.interim_voice_callout_request.v1" as const;

export const HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA =
  "helix.interim_voice_callout_receipt.v1" as const;

export type HelixInterimVoiceCalloutKind =
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

export type HelixInterimVoicePlaybackKind =
  | "tool_receipt"
  | "translation_relay"
  | "narrator_read"
  | "panel_narration";

export type HelixInterimVoiceCalloutSource =
  | "ask_tool_loop"
  | "live_source_mail_loop"
  | "voice_steering_queue"
  | "runtime_governor"
  | "manual_read";

export type HelixInterimVoiceCalloutRequestV1 = {
  artifactId: "helix_interim_voice_callout_request";
  schemaVersion: typeof HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA;
  requestId: string;
  turnId: string;
  threadId: string;
  source: HelixInterimVoiceCalloutSource;
  kind: HelixInterimVoiceCalloutKind;
  text: string;
  maxChars: number;
  timingHintMs?: number | null;
  voicePlaybackKind: HelixInterimVoicePlaybackKind;
  authority: "provisional";
  requiresConfirmation: boolean;
  evidenceRefs: string[];
  reasonCodes: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  instruction_authority: "none";
  context_role: "tool_evidence";
};

export type HelixInterimVoiceCalloutReceiptV1 = {
  artifactId: "helix_interim_voice_callout_receipt";
  schemaVersion: typeof HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA;
  receiptId: string;
  requestId: string;
  status:
    | "awaiting_client_playback"
    | "queued"
    | "queued_for_retry"
    | "delivered"
    | "expired"
    | "superseded"
    | "blocked_policy"
    | "blocked_capacity"
    | "blocked_missing_text"
    | "failed";
  delivery?: {
    utteranceId?: string | null;
    provider?: string | null;
    message?: string | null;
    nextRetryAtMs?: number | null;
    retryCount?: number | null;
    blockedReason?: string | null;
    playbackConfirmationRequired?: boolean;
    playbackAuthority?:
      | "client_runtime_required"
      | "backend_retry_pending"
      | "backend_terminal_status";
    playbackStatus?:
      | "awaiting_client_receipt"
      | "backend_retry_pending"
      | "client_confirmed"
      | "blocked_before_client";
  } | null;
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
};

const REQUEST_STATUSES = new Set([
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

const PLAYBACK_KINDS = new Set(["tool_receipt", "translation_relay", "narrator_read", "panel_narration"]);

export function validateHelixInterimVoiceCalloutRequestV1(
  value: HelixInterimVoiceCalloutRequestV1,
): string[] {
  const issues: string[] = [];
  if (value.artifactId !== "helix_interim_voice_callout_request") issues.push("artifactId must be helix_interim_voice_callout_request");
  if (value.schemaVersion !== HELIX_INTERIM_VOICE_CALLOUT_REQUEST_SCHEMA) issues.push("schemaVersion must match request schema");
  if (!value.requestId) issues.push("requestId is required");
  if (!value.turnId) issues.push("turnId is required");
  if (!value.threadId) issues.push("threadId is required");
  if (!REQUEST_STATUSES.has(value.kind)) issues.push("kind is invalid");
  if (!value.text.trim()) issues.push("text is required");
  if (value.maxChars < 1 || value.maxChars > 220) issues.push("maxChars must be between 1 and 220");
  if (
    value.timingHintMs !== undefined &&
    value.timingHintMs !== null &&
    (value.timingHintMs < 0 || value.timingHintMs > 5_000)
  ) {
    issues.push("timingHintMs must be between 0 and 5000");
  }
  if (!PLAYBACK_KINDS.has(value.voicePlaybackKind)) issues.push("voicePlaybackKind is invalid");
  if (value.authority !== "provisional") issues.push("authority must be provisional");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.instruction_authority !== "none") issues.push("instruction_authority must be none");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  return issues;
}

export function validateHelixInterimVoiceCalloutReceiptV1(
  value: HelixInterimVoiceCalloutReceiptV1,
): string[] {
  const issues: string[] = [];
  if (value.artifactId !== "helix_interim_voice_callout_receipt") issues.push("artifactId must be helix_interim_voice_callout_receipt");
  if (value.schemaVersion !== HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA) issues.push("schemaVersion must match receipt schema");
  if (!value.receiptId) issues.push("receiptId is required");
  if (!value.requestId) issues.push("requestId is required");
  if (
    value.delivery?.playbackConfirmationRequired === true &&
    value.delivery.playbackStatus === "client_confirmed" &&
    value.status !== "delivered"
  ) {
    issues.push("client_confirmed playback requires delivered status");
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  return issues;
}
