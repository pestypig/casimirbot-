export const HELIX_LIVE_SOURCE_PRODUCER_FRESHNESS_SCHEMA =
  "helix.live_source_producer_freshness.v1" as const;

export type HelixLiveSourceProducerFreshness = {
  schema: typeof HELIX_LIVE_SOURCE_PRODUCER_FRESHNESS_SCHEMA;
  producer_id: string;
  source_id: string;
  thread_id: string;
  cadence_ms?: number | null;
  last_capture_at?: string | null;
  last_chunk_id?: string | null;
  last_analysis_job_id?: string | null;
  last_visual_evidence_id?: string | null;
  last_card_delta_at?: string | null;
  is_fresh: boolean;
  stale_reason?: string | null;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
