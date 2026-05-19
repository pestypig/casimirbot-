export const HELIX_LIVE_SITUATION_RUN_SCHEMA =
  "helix.live_situation_run.v1" as const;

export type HelixLiveSituationRunModalityScope =
  | "generic_visual"
  | "minecraft_visual"
  | "minecraft_world"
  | "audio_transcript"
  | "calculator_stream"
  | "document_context"
  | "mixed";

export type HelixLiveSituationRun = {
  schema: typeof HELIX_LIVE_SITUATION_RUN_SCHEMA;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  pipeline_id?: string | null;
  source_ids: string[];
  source_binding_id: string;
  primary_source_identity_ref: string;
  latest_observation_ref?: string | null;
  latest_epoch_observation_refs: string[];
  terminal_authority_required: true;
  selected_evidence_refs: string[];
  objective_text: string;
  modality_scope: HelixLiveSituationRunModalityScope;
  active_fields: string[];
  current_epoch: number;
  corroboration_policy: {
    audio_required: boolean;
    user_steering_required: boolean;
    world_event_required: boolean;
    missing_corroboration_effect: "lower_confidence_not_block" | "block" | "request_input";
  };
  reasoning_budget: "cheap" | "normal" | "deep";
  terminal_policy: {
    worker_outputs_are_terminal: false;
    tangent_outputs_are_terminal: false;
    terminal_authority_required: true;
  };
  status: "created" | "active" | "paused" | "stale" | "completed" | "cancelled" | "stopped";
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
