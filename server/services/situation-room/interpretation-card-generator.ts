import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { appendInterpretationCard } from "./interpretation-card-store";

const expiryForModality = (chunk: HelixLiveSourceChunk): number => {
  if (chunk.modality === "visual_frame") return 45_000;
  if (chunk.modality === "audio_transcript" || chunk.modality === "world_event") return 60_000;
  if (chunk.modality === "calculator_stream" || chunk.modality === "simulation_stream") return 120_000;
  return 180_000;
};

const titleForModality = (chunk: HelixLiveSourceChunk): string => {
  if (chunk.modality === "visual_frame") return "Visual scene hypothesis";
  if (chunk.modality === "audio_transcript" || chunk.modality === "text_chat") return "Transcript context hypothesis";
  if (chunk.modality === "world_event") return "World-event meaning hypothesis";
  if (chunk.modality === "calculator_stream" || chunk.modality === "simulation_stream") return "Stream stability hypothesis";
  return "Context relevance hypothesis";
};

export function generateInterpretationCardFromObservation(input: {
  observation: HelixObservationJournalEntry;
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
  summary: string;
  modelInvoked?: boolean;
  evidenceRefs: string[];
}) {
  if (input.status !== "completed") return null;
  const evidenceRefs = Array.from(new Set([input.observation.observation_id, ...input.evidenceRefs].filter(Boolean)));
  if (evidenceRefs.length === 0) return null;
  const now = Date.now();
  return appendInterpretationCard({
    thread_id: input.chunk.thread_id,
    room_id: input.chunk.environment_id ?? null,
    title: titleForModality(input.chunk),
    summary: input.summary,
    evidence_refs: evidenceRefs,
    confidence: input.chunk.modality === "visual_frame" ? 0.7 : 0.62,
    expires_at: new Date(now + expiryForModality(input.chunk)).toISOString(),
    model_invoked: input.modelInvoked === true,
  });
}
