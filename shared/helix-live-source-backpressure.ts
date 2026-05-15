export const HELIX_LIVE_SOURCE_BACKPRESSURE_SCHEMA = "helix.live_source_backpressure.v1" as const;

export type HelixLiveSourceBackpressurePolicy =
  | "drop_oldest"
  | "compact_window"
  | "pause_source"
  | "reject_retryable";

export type HelixLiveSourceBackpressureStatus =
  | "clear"
  | "compacting"
  | "dropping_oldest"
  | "paused"
  | "retry_later";

export type HelixLiveSourceBackpressure = {
  schema: typeof HELIX_LIVE_SOURCE_BACKPRESSURE_SCHEMA;
  source_id: string;
  thread_id: string;
  policy: HelixLiveSourceBackpressurePolicy;
  status: HelixLiveSourceBackpressureStatus;
  chunk_queue_depth: number;
  analysis_queue_depth: number;
  dropped_chunk_count: number;
  compacted_chunk_count: number;
  retry_after_ms?: number | null;
  reason?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
