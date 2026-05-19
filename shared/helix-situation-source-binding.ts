export const HELIX_SITUATION_SOURCE_BINDING_SCHEMA =
  "helix.situation_source_binding.v1" as const;

export type HelixSituationSourceBindingModality =
  | "visual_frame"
  | "world_event"
  | "environment_state"
  | "environment_affordance"
  | "audio_transcript"
  | "calculator_stream"
  | "simulation_stream"
  | "document_context"
  | "note_context"
  | "procedure_graph"
  | "process_graph";

export type HelixSituationSourceBindingStatus =
  | "bound"
  | "observed_unbound"
  | "stale"
  | "missing"
  | "pending_repair"
  | "repair_candidate"
  | "repair_applied"
  | "detached"
  | "blocked";

export type HelixSituationSourceBindingPolicy =
  | "explicit_user"
  | "session_start"
  | "repair_acceptance"
  | "profile_default";

export type HelixSituationSourceReplayPolicy =
  | "future_only"
  | "explicit_replay_window"
  | "none";

export type HelixSituationSourceBinding = {
  schema: typeof HELIX_SITUATION_SOURCE_BINDING_SCHEMA;
  binding_id: string;
  thread_id: string;
  situation_run_id: string;
  environment_id?: string | null;
  source_id: string;
  modality: HelixSituationSourceBindingModality;
  status: HelixSituationSourceBindingStatus;
  binding_policy: HelixSituationSourceBindingPolicy;
  replay_policy: HelixSituationSourceReplayPolicy;
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
