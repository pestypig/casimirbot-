import {
  LIVE_SOURCE_OBSERVATION_SCHEMA,
  type LiveSourceObservation,
} from "@shared/live-source-observation";
import { evaluateLiveSourceFreshness } from "./source-freshness";
import { makeLiveSourceObservationId } from "./live-source-observation-store";

export function normalizeBrowserAudioSourceEvent(input: {
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  binding_id?: string | null;
  job_contract_ids?: string[] | null;
  observed_at?: string | null;
  now?: Date;
  stale_after_ms?: number | null;
  text?: string | null;
  detected_language?: string | null;
  evidence_refs?: string[] | null;
}): LiveSourceObservation {
  const observedAt = input.observed_at ?? new Date().toISOString();
  const hasTranscript = typeof input.text === "string" && input.text.trim().length > 0;
  const eventKind = hasTranscript ? "transcript_segment" : "browser_tab_audio";
  const summary = hasTranscript ? "Browser audio transcript segment observed." : "Browser tab audio segment observed.";
  return {
    schema: LIVE_SOURCE_OBSERVATION_SCHEMA,
    observation_id: makeLiveSourceObservationId({
      sourceId: input.source_id,
      sourceKind: "browser_audio",
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
    source_kind: "browser_audio",
    event_kind: eventKind,
    observed_at: observedAt,
    freshness: evaluateLiveSourceFreshness({
      observedAt,
      now: input.now,
      staleAfterMs: input.stale_after_ms ?? 15_000,
    }),
    provenance: {
      adapter: "browser_audio_source_event_normalizer",
      confidence: hasTranscript ? "medium" : "low",
    },
    compact_summary: summary,
    payload_summary: hasTranscript
      ? {
          transcript: {
            text: input.text?.trim() ?? "",
            detected_language: input.detected_language ?? undefined,
          },
        }
      : undefined,
    evidence_refs: input.evidence_refs ?? [],
    assistant_answer: false,
    raw_content_included: false,
  };
}
