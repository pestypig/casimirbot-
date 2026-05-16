import type { HelixLiveSourceBackpressurePolicy } from "./helix-live-source-backpressure";
import type { HelixLiveSourceChunkModality } from "./helix-live-source-chunk";

export const HELIX_LIVE_SOURCE_PRODUCER_SCHEMA = "helix.live_source_producer.v1" as const;

export type HelixLiveSourceProducerStatus =
  | "permission_required"
  | "waiting_for_client"
  | "active"
  | "paused"
  | "stale"
  | "error"
  | "stopped";

export type HelixLiveSourceCaptureMode =
  | "manual"
  | "interval"
  | "salience_triggered"
  | "push"
  | "on_change";

export type HelixLiveSourceRawContentPolicy =
  | "ephemeral"
  | "debug_retained"
  | "profile_opt_in";

export type HelixLiveSourceProducer = {
  schema: typeof HELIX_LIVE_SOURCE_PRODUCER_SCHEMA;
  producer_id: string;
  source_id: string;
  thread_id: string;
  modality: HelixLiveSourceChunkModality;
  status: HelixLiveSourceProducerStatus;
  cadence_ms?: number | null;
  capture_mode: HelixLiveSourceCaptureMode;
  latest_chunk_id?: string | null;
  next_chunk_due_at?: string | null;
  backpressure_policy: HelixLiveSourceBackpressurePolicy;
  raw_content_policy: HelixLiveSourceRawContentPolicy;
  assistant_answer: false;
};
