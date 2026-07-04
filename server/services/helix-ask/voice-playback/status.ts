import type { HelixTextToSpeechPlaybackStatus } from "@shared/helix-text-to-speech-lane";
import type { HelixInterimVoiceCalloutReceiptV1 } from "@shared/contracts/helix-interim-voice-callout.v1";

export type HelixVoiceGatewayPlaybackStatus =
  | "awaiting_client_receipt"
  | "queued"
  | "delivered"
  | "unavailable"
  | "blocked"
  | "failed";

export function isVoiceClientHandoffReceipt(
  receipt: HelixInterimVoiceCalloutReceiptV1,
): boolean {
  return (
    receipt.status === "awaiting_client_playback" ||
    receipt.status === "queued" ||
    receipt.status === "delivered"
  );
}

export function mapInterimVoiceReceiptToGatewayPlaybackStatus(
  receipt: HelixInterimVoiceCalloutReceiptV1,
): HelixVoiceGatewayPlaybackStatus {
  if (receipt.status === "awaiting_client_playback") return "awaiting_client_receipt";
  if (receipt.status === "queued") return "queued";
  if (receipt.status === "delivered") return "delivered";
  if (receipt.status === "queued_for_retry" || receipt.status === "blocked_capacity") return "unavailable";
  if (receipt.status.startsWith("blocked")) return "blocked";
  return "failed";
}

export function mapInterimVoiceReceiptToTextToSpeechPlaybackStatus(
  receipt: HelixInterimVoiceCalloutReceiptV1,
): HelixTextToSpeechPlaybackStatus {
  if (receipt.status === "awaiting_client_playback" || receipt.status === "queued") return "pending";
  if (receipt.status === "delivered") return "played";
  if (receipt.status === "queued_for_retry" || receipt.status === "blocked_capacity") return "blocked";
  if (receipt.status.startsWith("blocked")) return "blocked";
  return "failed";
}
