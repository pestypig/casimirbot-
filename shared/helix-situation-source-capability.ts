export const HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA =
  "helix.situation_source_capability.v1" as const;

export type HelixSituationSourceModality =
  | "world_event"
  | "visual_frame"
  | "audio_transcript"
  | "voice_identity"
  | "text_chat"
  | "calculator_stream"
  | "simulation_stream"
  | "document_context"
  | "note_context";

export type HelixSituationSourceStatus =
  | "active"
  | "waiting_for_client"
  | "permission_required"
  | "configured_missing"
  | "stale"
  | "error"
  | "paused"
  | "stopped";

export type HelixSituationSourceContribution =
  | "place"
  | "activity"
  | "risk"
  | "dialogue"
  | "visual_scene"
  | "identity"
  | "calculation"
  | "reference"
  | "memory";

export type HelixSituationSourceCapability = {
  schema: typeof HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA;
  source_id: string;
  thread_id: string;
  room_id?: string | null;
  participant_id?: string | null;
  modality: HelixSituationSourceModality;
  status: HelixSituationSourceStatus;
  contribution: HelixSituationSourceContribution;
  fidelity_score: number;
  last_event_ts?: string | null;
  missing_reason?: string | null;
  next_required_action?: string | null;
  raw_content_included: false;
  assistant_answer: false;
};

export type HelixSituationSourceCapabilityRead = {
  schema: "helix.situation_source_capability_read.v1";
  thread_id: string;
  room_id?: string | null;
  capabilities: HelixSituationSourceCapability[];
  raw_content_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
