import {
  LIVE_SOURCE_OBSERVATION_SCHEMA,
  type LiveSourceObservation,
} from "@shared/live-source-observation";
import { evaluateLiveSourceFreshness } from "./source-freshness";
import { makeLiveSourceObservationId } from "./live-source-observation-store";

export function normalizeVisualSourceEvent(input: {
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  binding_id?: string | null;
  job_contract_ids?: string[] | null;
  observed_at?: string | null;
  now?: Date;
  stale_after_ms?: number | null;
  scene_summary: string;
  confidence?: "low" | "medium" | "high" | null;
  evidence_refs?: string[] | null;
}): LiveSourceObservation {
  const observedAt = input.observed_at ?? new Date().toISOString();
  const summary = "Visual source summary updated.";
  return {
    schema: LIVE_SOURCE_OBSERVATION_SCHEMA,
    observation_id: makeLiveSourceObservationId({
      sourceId: input.source_id,
      sourceKind: "screen_capture",
      eventKind: "visual_summary",
      observedAt,
      summary,
    }),
    thread_id: input.thread_id ?? undefined,
    room_id: input.room_id ?? null,
    environment_id: input.environment_id ?? null,
    source_id: input.source_id,
    binding_id: input.binding_id ?? undefined,
    job_contract_ids: input.job_contract_ids ?? [],
    source_kind: "screen_capture",
    event_kind: "visual_summary",
    observed_at: observedAt,
    freshness: evaluateLiveSourceFreshness({
      observedAt,
      now: input.now,
      staleAfterMs: input.stale_after_ms ?? 20_000,
    }),
    provenance: {
      adapter: "visual_source_event_normalizer",
      confidence: input.confidence ?? "medium",
    },
    compact_summary: summary,
    payload_summary: {
      visual: {
        scene_summary: input.scene_summary,
        confidence: input.confidence ?? "medium",
      },
    },
    evidence_refs: input.evidence_refs ?? [],
    assistant_answer: false,
    raw_content_included: false,
  };
}
