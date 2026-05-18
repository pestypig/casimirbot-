export const HELIX_LIVE_INTERPRETATION_RUN_SCHEMA =
  "helix.live_interpretation_run.v1" as const;

export type HelixLiveInterpretationLens =
  | "scene_neutral"
  | "activity"
  | "objects"
  | "uncertainty"
  | "protocol_lane"
  | "verifier_lane"
  | "risk_lane"
  | "workstation_affordance_lane"
  | "user_notice_lane";

export type HelixLiveInterpretationRun = {
  schema: typeof HELIX_LIVE_INTERPRETATION_RUN_SCHEMA;
  interpretation_run_id: string;
  situation_run_id: string;
  thread_id: string;
  source_id: string;
  source_binding_id: string;
  seed_observation_ref: string;
  seed_summary_ref: string;
  seed_epoch: number;
  objective_text: string;
  modality_scope: "generic_visual" | "minecraft" | "audio" | "document" | "calculator" | "mixed";
  active_lenses: HelixLiveInterpretationLens[];
  status: "created" | "active" | "stale" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
