import { hashVoiceUtteranceKey } from "@/lib/helix/ask-read-aloud-display";
import type {
  VoicePlaybackOutcomeReceipt,
  VoicePlaybackOutcomeStatus,
} from "@/lib/helix/voice-capture-diagnostics";
import type {
  VoicePlaybackMetrics,
  VoicePlaybackUtteranceKind,
} from "@/lib/helix/voice-playback";

export type BuildVoicePlaybackOutcomeReceiptInput = {
  status: VoicePlaybackOutcomeStatus;
  utteranceId: string;
  turnKey: string;
  kind: VoicePlaybackUtteranceKind;
  sourceReceiptId?: string | null;
  sourceReceiptKey?: string | null;
  requestId?: string | null;
  calloutKind?: string | null;
  metrics?: VoicePlaybackMetrics | null;
  error?: string | null;
  audioUnlocked: boolean;
  playbackPath?: string | null;
  atMs?: number;
};

export function buildVoicePlaybackOutcomeReceipt(
  input: BuildVoicePlaybackOutcomeReceiptInput,
): VoicePlaybackOutcomeReceipt {
  const atMs = input.atMs ?? Date.now();
  return {
    schema: "helix.voice_playback_outcome_receipt.v1",
    receiptId: `voice_playback_outcome:${hashVoiceUtteranceKey([
      input.utteranceId,
      input.status,
      input.sourceReceiptId ?? input.sourceReceiptKey ?? "",
      String(atMs),
    ].join(":"))}`,
    sourceReceiptId: input.sourceReceiptId ?? null,
    sourceReceiptKey: input.sourceReceiptKey ?? null,
    requestId: input.requestId ?? null,
    calloutKind: input.calloutKind ?? null,
    utteranceId: input.utteranceId,
    turnKey: input.turnKey,
    kind: input.kind,
    status: input.status,
    atMs,
    providerHeader: input.metrics?.providerHeader ?? null,
    profileHeader: input.metrics?.profileHeader ?? null,
    cacheHitCount: input.metrics?.cacheHitCount ?? null,
    cacheMissCount: input.metrics?.cacheMissCount ?? null,
    totalPlaybackMs: input.metrics?.totalPlaybackMs ?? null,
    cancelReason: input.metrics?.cancelReason ?? null,
    error: input.error ?? null,
    audioUnlocked: input.audioUnlocked,
    playbackPath: input.playbackPath ?? null,
    playbackLifecycle: input.metrics?.playbackLifecycle ?? null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    output_authority: "playback_observation",
  };
}

export function postVoicePlaybackOutcomeReceipt(receipt: VoicePlaybackOutcomeReceipt): void {
  if (typeof fetch !== "function") return;
  if (!receipt.requestId && !receipt.sourceReceiptId) return;
  void fetch("/api/helix/live-environment/voice-playback/outcome", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      request_id: receipt.requestId,
      source_receipt_id: receipt.sourceReceiptId,
      utterance_id: receipt.utteranceId,
      status: receipt.status,
      message: receipt.error ?? receipt.cancelReason ?? null,
      provider: receipt.providerHeader ?? "helix_client_voice_playback",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    }),
    keepalive: true,
  }).catch(() => undefined);
}
