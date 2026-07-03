import crypto from "node:crypto";
import {
  HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
  type HelixInterimVoiceCalloutReceiptV1,
  type HelixInterimVoiceCalloutRequestV1,
} from "@shared/contracts/helix-interim-voice-callout.v1";

export type BuildInterimVoiceCalloutReceiptInput = {
  request: HelixInterimVoiceCalloutRequestV1;
  status: HelixInterimVoiceCalloutReceiptV1["status"];
  message?: string | null;
  utteranceId?: string | null;
  provider?: string | null;
  nextRetryAtMs?: number | null;
  retryCount?: number | null;
  blockedReason?: string | null;
  atMs?: number;
};

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

export function resolveInterimVoicePlaybackConfirmationRequired(
  status: HelixInterimVoiceCalloutReceiptV1["status"],
): boolean {
  return status === "awaiting_client_playback" || status === "queued";
}

export function resolveInterimVoicePlaybackAuthority(
  status: HelixInterimVoiceCalloutReceiptV1["status"],
): NonNullable<NonNullable<HelixInterimVoiceCalloutReceiptV1["delivery"]>["playbackAuthority"]> {
  if (status === "awaiting_client_playback" || status === "queued") return "client_runtime_required";
  if (status === "queued_for_retry") return "backend_retry_pending";
  return "backend_terminal_status";
}

export function resolveInterimVoicePlaybackStatus(
  status: HelixInterimVoiceCalloutReceiptV1["status"],
): NonNullable<NonNullable<HelixInterimVoiceCalloutReceiptV1["delivery"]>["playbackStatus"]> {
  if (status === "awaiting_client_playback" || status === "queued") return "awaiting_client_receipt";
  if (status === "queued_for_retry") return "backend_retry_pending";
  if (status === "delivered") return "client_confirmed";
  return "blocked_before_client";
}

export function buildInterimVoiceCalloutReceipt(
  input: BuildInterimVoiceCalloutReceiptInput,
): HelixInterimVoiceCalloutReceiptV1 {
  return {
    artifactId: "helix_interim_voice_callout_receipt",
    schemaVersion: HELIX_INTERIM_VOICE_CALLOUT_RECEIPT_SCHEMA,
    receiptId: `helix_interim_voice_callout_receipt:${hashShort([
      input.request.requestId,
      input.status,
      input.message ?? null,
      input.atMs ?? Date.now(),
    ])}`,
    requestId: input.request.requestId,
    status: input.status,
    delivery: {
      utteranceId: input.utteranceId ?? null,
      provider: input.provider ?? "helix_interim_voice_callout",
      message: input.message ?? null,
      nextRetryAtMs: input.nextRetryAtMs ?? null,
      retryCount: input.retryCount ?? null,
      blockedReason: input.blockedReason ?? null,
      playbackConfirmationRequired: resolveInterimVoicePlaybackConfirmationRequired(input.status),
      playbackAuthority: resolveInterimVoicePlaybackAuthority(input.status),
      playbackStatus: resolveInterimVoicePlaybackStatus(input.status),
    },
    evidenceRefs: uniqueStrings([input.request.requestId, ...input.request.evidenceRefs]),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
}
