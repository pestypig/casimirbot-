export const HELIX_DEICTIC_REFERENCE_SCHEMA =
  "helix.deictic_reference.v1" as const;

export type HelixDeicticInputModality = "typed" | "voice" | "discord" | "system";

export type HelixDeicticReferenceType =
  | "current_screen"
  | "selected_visible_file"
  | "latest_visual_object"
  | "current_activity"
  | "latest_epoch_change"
  | "comparison_target"
  | "active_live_source"
  | "unknown";

export type HelixDeicticResolutionStatus =
  | "resolved"
  | "ambiguous"
  | "stale"
  | "missing_context"
  | "unbound_source";

export type HelixDeicticReference = {
  schema: typeof HELIX_DEICTIC_REFERENCE_SCHEMA;
  reference_id: string;
  thread_id: string;
  prompt_text: string;
  input_modality: HelixDeicticInputModality;
  reference_type: HelixDeicticReferenceType;
  candidate_signal: boolean;
  resolved_context_refs: string[];
  confidence: number;
  resolution_status: HelixDeicticResolutionStatus;
  assistant_answer: false;
  raw_content_included: false;
};
