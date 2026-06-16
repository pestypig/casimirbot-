import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { enqueueStagePlayLiveSourceMailItem } from "./stage-play-live-source-mailbox-store";

const previewText = (text: string | null | undefined, limit = 220): string => {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

export function enqueueAudioTranscriptMailFromChunk(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId: string;
  transcript: string;
  eventRef: string;
  chunkRef: string;
  analysisJobRef?: string | null;
  evidenceRefs?: string[];
  durationMs?: number | null;
  now?: string;
}): StagePlayLiveSourceMailItemV1 {
  const transcript = previewText(input.transcript, 1200);
  return enqueueStagePlayLiveSourceMailItem({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId,
    sourceKind: "audio_transcript",
    evidenceRef: input.chunkRef,
    observationRef: input.eventRef,
    summaryText: transcript ? `Audio transcript chunk: ${transcript}` : "Audio transcript chunk captured with no recognized speech.",
    summaryPreview: transcript || "Audio transcript chunk captured.",
    confidence: null,
    analysisState: transcript ? "analysis_ready" : "unknown",
    deterministicChangeHint: "summary_changed",
    sourceFreshness: "fresh",
    captureIntervalMs: input.durationMs ?? null,
    evidenceRefs: [
      input.sourceId,
      input.eventRef,
      input.chunkRef,
      input.analysisJobRef ?? null,
      ...(input.evidenceRefs ?? []),
    ].filter((value): value is string => Boolean(value)),
    createdAt: input.now,
  });
}
