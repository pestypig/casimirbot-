export const HELIX_LIVE_SOURCE_CHUNK_SCHEMA = "helix.live_source_chunk.v1" as const;

export type HelixLiveSourceChunkModality =
  | "world_event"
  | "visual_frame"
  | "audio_transcript"
  | "text_chat"
  | "calculator_stream"
  | "simulation_stream"
  | "document_context"
  | "note_context";

export type HelixLiveSourceChunkContextPolicy = "compact_context_pack_only";

export type HelixLiveSourceChunk = {
  schema: typeof HELIX_LIVE_SOURCE_CHUNK_SCHEMA;
  chunk_id: string;
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  participant_id?: string | null;
  modality: HelixLiveSourceChunkModality;
  sequence_index: number;
  ts: string;
  duration_ms?: number | null;
  compact_summary?: string | null;
  payload_ref?: string | null;
  evidence_refs: string[];
  raw_content_included: false;
  assistant_answer: false;
  context_policy: HelixLiveSourceChunkContextPolicy;
};
