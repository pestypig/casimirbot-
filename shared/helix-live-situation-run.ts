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
  objective_text: string;
  modality_scope: HelixLiveSituationRunModalityScope;
  active_fields: string[];
  corroboration_policy: {
    audio_required: boolean;
    user_steering_required: boolean;
    world_event_required: boolean;
    missing_corroboration_effect: "lower_confidence_not_block" | "block" | "request_input";
  };
  reasoning_budget: "cheap" | "normal" | "deep";
  status: "active" | "paused" | "stale" | "completed" | "stopped";
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
