import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { waitForInterimVoicePlaybackOutcome } from "../interim-voice-callout-store";

const VOICE_INTERIM_CALLOUT_CAPABILITY = "live_env.request_interim_voice_callout" as const;
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say" as const;
const TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY = "text_to_speech.speak_text" as const;

export const DEFAULT_VOICE_PLAYBACK_RECEIPT_WAIT_MS = 8_000;

const voiceGatewayCapabilities = new Set<string>([
  VOICE_INTERIM_CALLOUT_CAPABILITY,
  VOICE_NARRATOR_SAY_CAPABILITY,
  TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeVoicePlaybackClientStatus = (receipt: Record<string, unknown>): string => {
  const delivery = readRecord(receipt.delivery);
  const deliveryPlaybackStatus = readString(delivery?.playbackStatus);
  if (deliveryPlaybackStatus === "client_confirmed") return "delivered";
  const status = readString(receipt.status);
  const provider = readString(delivery?.provider);
  if (
    provider &&
    provider !== "helix_interim_voice_callout" &&
    (status === "queued" || status === "awaiting_client_playback")
  ) {
    return "queued";
  }
  if (status === "delivered") return "delivered";
  if (status === "failed") {
    return readString(delivery?.blockedReason) ?? "failed";
  }
  return status ?? "awaiting_client_receipt";
};

export const applyClientVoicePlaybackOutcomeToGatewayResult = (
  result: HelixWorkstationGatewayCallResult,
  receipt: Record<string, unknown> | null,
): void => {
  if (!receipt) return;
  const observation = readRecord(result.observation);
  if (!observation) return;
  const existingReceipt = readRecord(observation.receipt);
  const hostProjection = readRecord(observation.host_projection);
  const normalizedStatus = normalizeVoicePlaybackClientStatus(receipt);
  const delivered = normalizedStatus === "delivered";
  const delivery = readRecord(receipt.delivery);
  const utteranceId = readString(delivery?.utteranceId) ?? readString(existingReceipt?.utterance_id);
  const playbackReceipt = {
    ...(existingReceipt ?? {}),
    client_playback_receipt: receipt,
    playback_status: normalizedStatus,
    audio_bytes_observed: delivered,
    delivered_at_ms: delivered ? Date.now() : readNumber(existingReceipt?.delivered_at_ms),
    utterance_id: utteranceId,
    audio_ref: utteranceId ?? readString(existingReceipt?.audio_ref),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const updatedHostProjection = {
    ...(hostProjection ?? {}),
    client_playback_receipt_id: readString(receipt.receiptId),
    playback_status: readString(receipt.status) ?? normalizedStatus,
    normalized_playback_status: normalizedStatus,
    audio_bytes_observed: delivered,
    delivered_at_ms: delivered ? playbackReceipt.delivered_at_ms : null,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  observation.receipt = playbackReceipt;
  observation.host_projection = updatedHostProjection;
  result.observation_packet.observation_summary =
    `Voice playback client receipt ${normalizedStatus} for ${readString(receipt.requestId) ?? "request"}.`;
  result.observation_packet.state_delta = {
    ...(readRecord(result.observation_packet.state_delta) ?? {}),
    voice_playback_client_receipt: receipt,
  };
  result.tool_followup_decision.observation_summary = result.observation_packet.observation_summary;
  result.tool_followup_decision.required_surface_satisfied = true;
  result.tool_followup_decision.evidence_reentered = true;
  result.tool_followup_decision.terminal_blockers = [];
  (result as unknown as Record<string, unknown>).voice_playback_receipt_barrier = {
    schema: "helix.voice_playback_receipt_barrier.v1",
    status: "client_receipt_observed",
    playback_status: normalizedStatus,
    receipt_id: readString(receipt.receiptId),
    request_id: readString(receipt.requestId),
    waited_ms: null,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const waitForVoicePlaybackGatewayReceipts = async (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  options: { timeoutMs?: number | null } = {},
): Promise<void> => {
  const timeoutMs = Math.max(
    0,
    Math.min(Math.floor(options.timeoutMs ?? DEFAULT_VOICE_PLAYBACK_RECEIPT_WAIT_MS), 30_000),
  );
  const waitTargets = gatewayCallResults
    .filter((result: HelixWorkstationGatewayCallResult) => voiceGatewayCapabilities.has(result.capability_id))
    .map((result: HelixWorkstationGatewayCallResult) => {
      const observation = readRecord(result.observation);
      const hostProjection = readRecord(observation?.host_projection);
      const receipt = readRecord(observation?.receipt);
      const requestId = readString(hostProjection?.request_id) ?? readString(receipt?.requestId);
      const sourceReceiptId = readString(hostProjection?.receipt_id) ?? readString(receipt?.receiptId);
      const status = readString(hostProjection?.normalized_playback_status) ?? readString(receipt?.playback_status);
      return requestId && status === "awaiting_client_receipt"
        ? { result, requestId, sourceReceiptId }
        : null;
    })
    .filter((entry): entry is {
      result: HelixWorkstationGatewayCallResult;
      requestId: string;
      sourceReceiptId: string | null;
    } => Boolean(entry));
  if (waitTargets.length === 0) return;
  await Promise.all(waitTargets.map(async (target: {
    result: HelixWorkstationGatewayCallResult;
    requestId: string;
    sourceReceiptId: string | null;
  }) => {
    const startedAtMs = Date.now();
    const receipt = await waitForInterimVoicePlaybackOutcome({
      requestId: target.requestId,
      sourceReceiptId: target.sourceReceiptId,
      timeoutMs,
    });
    if (receipt) {
      applyClientVoicePlaybackOutcomeToGatewayResult(
        target.result,
        receipt as unknown as Record<string, unknown>,
      );
      const barrier = (target.result as unknown as Record<string, unknown>).voice_playback_receipt_barrier;
      if (barrier && typeof barrier === "object") {
        (barrier as Record<string, unknown>).waited_ms = Math.max(0, Date.now() - startedAtMs);
      }
      return;
    }
    (target.result as unknown as Record<string, unknown>).voice_playback_receipt_barrier = {
      schema: "helix.voice_playback_receipt_barrier.v1",
      status: "client_receipt_timeout",
      playback_status: "awaiting_client_receipt",
      request_id: target.requestId,
      source_receipt_id: target.sourceReceiptId,
      waited_ms: Math.max(0, Date.now() - startedAtMs),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
    target.result.tool_followup_decision.observation_summary =
      `Voice playback client receipt timed out for ${target.requestId}.`;
    target.result.tool_followup_decision.required_surface_satisfied = false;
    target.result.tool_followup_decision.evidence_reentered = false;
    target.result.tool_followup_decision.terminal_blockers = [
      ...new Set([
        ...target.result.tool_followup_decision.terminal_blockers,
        "voice_playback_client_receipt_timeout",
      ]),
    ];
  }));
};
