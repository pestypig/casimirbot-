import {
  LIVE_SOURCE_OBSERVATION_SCHEMA,
  type LiveSourceObservation,
} from "@shared/live-source-observation";
import { evaluateLiveSourceFreshness } from "./source-freshness";
import { makeLiveSourceObservationId } from "./live-source-observation-store";

export function normalizeMicSourceEvent(input: {
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  binding_id?: string | null;
  job_contract_ids?: string[] | null;
  observed_at?: string | null;
  now?: Date;
  stale_after_ms?: number | null;
  text: string;
  is_direct_address?: boolean | null;
  detected_language?: string | null;
  speaker_label?: string | null;
  evidence_refs?: string[] | null;
}): LiveSourceObservation {
  const observedAt = input.observed_at ?? new Date().toISOString();
  const isDirectAddress = input.is_direct_address === true;
  const summary = isDirectAddress ? "Mic direct address detected." : "Mic transcript segment observed.";
  const eventKind = isDirectAddress ? "direct_address" : "transcript_segment";
  return {
    schema: LIVE_SOURCE_OBSERVATION_SCHEMA,
    observation_id: makeLiveSourceObservationId({
      sourceId: input.source_id,
      sourceKind: "mic_audio",
      eventKind,
      observedAt,
      summary,
    }),
    thread_id: input.thread_id ?? undefined,
    room_id: input.room_id ?? null,
    environment_id: input.environment_id ?? null,
    source_id: input.source_id,
    binding_id: input.binding_id ?? undefined,
    job_contract_ids: input.job_contract_ids ?? [],
    source_kind: "mic_audio",
    event_kind: eventKind,
    observed_at: observedAt,
    freshness: evaluateLiveSourceFreshness({
      observedAt,
      now: input.now,
      staleAfterMs: input.stale_after_ms ?? 15_000,
    }),
    provenance: {
      adapter: "mic_source_event_normalizer",
      confidence: "medium",
    },
    compact_summary: summary,
    payload_summary: {
      transcript: {
        text: input.text,
        is_direct_address: isDirectAddress,
        detected_language: input.detected_language ?? undefined,
        speaker_label: input.speaker_label ?? undefined,
      },
    },
    evidence_refs: input.evidence_refs ?? [],
    assistant_answer: false,
    raw_content_included: false,
  };
}
