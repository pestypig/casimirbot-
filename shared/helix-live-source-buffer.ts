import type { HelixLiveSourceBackpressure } from "./helix-live-source-backpressure";
import type { HelixLiveSourceChunkModality } from "./helix-live-source-chunk";

export const HELIX_LIVE_SOURCE_BUFFER_STATUS_SCHEMA = "helix.live_source_buffer_status.v1" as const;

export type HelixLiveSourceBufferSourceStatus = {
  source_id: string;
  thread_id: string;
  modality: HelixLiveSourceChunkModality;
  chunk_count: number;
  latest_chunk_id?: string | null;
  latest_chunk_ts?: string | null;
  compacted_summary?: string | null;
  backpressure: HelixLiveSourceBackpressure;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixLiveSourceBufferStatus = {
  schema: typeof HELIX_LIVE_SOURCE_BUFFER_STATUS_SCHEMA;
  thread_id: string;
  sources: HelixLiveSourceBufferSourceStatus[];
  total_chunk_count: number;
  total_analysis_queue_depth: number;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};
