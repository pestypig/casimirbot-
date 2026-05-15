import type { HelixLiveSourceCaptureMode } from "./helix-live-source-producer";
import type { HelixLiveSourceChunkModality } from "./helix-live-source-chunk";

export const HELIX_LIVE_SOURCE_RATE_POLICY_SCHEMA = "helix.live_source_rate_policy.v1" as const;

export type HelixLiveSourceRatePolicy = {
  schema: typeof HELIX_LIVE_SOURCE_RATE_POLICY_SCHEMA;
  source_id: string;
  thread_id: string;
  modality: HelixLiveSourceChunkModality;
  capture_mode: HelixLiveSourceCaptureMode;
  cadence_ms?: number | null;
  max_chunks_per_source: number;
  max_analysis_jobs_per_minute: number;
  assistant_answer: false;
  raw_content_included: false;
};
