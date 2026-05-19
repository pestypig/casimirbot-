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

export type HelixLiveInterpretationWorkerKind =
  | "scene_neutral"
  | "activity"
  | "objects"
  | "uncertainty"
  | "verifier"
  | "protocol_lane"
  | "risk_lane"
  | "workstation_affordance_lane"
  | "user_notice_lane";

export type HelixLiveInterpretationRunStatus =
  | "pending"
  | "created"
  | "running"
  | "active"
  | "completed"
  | "expired"
  | "failed"
  | "stale"
  | "cancelled";

export type HelixLiveInterpretationRun = {
  schema: typeof HELIX_LIVE_INTERPRETATION_RUN_SCHEMA;
  interpretation_run_id: string;
  situation_run_id: string;
  thread_id: string;
  ask_session_id?: string | null;
  source_id: string;
  source_binding_id: string;
  first_scene_epoch_id: string;
  current_scene_epoch_id: string;
  seed_observation_ref: string;
  seed_summary_ref: string;
  seeded_from_summary_id?: string | null;
  seed_epoch: number;
  objective_text: string;
  modality_scope: "generic_visual" | "minecraft" | "audio" | "document" | "calculator" | "mixed";
  active_lenses: HelixLiveInterpretationLens[];
  allowed_worker_kinds: HelixLiveInterpretationWorkerKind[];
  worker_config: {
    max_worker_budget: number;
    allowed_worker_kinds: HelixLiveInterpretationWorkerKind[];
  };
  status: HelixLiveInterpretationRunStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  expired_at?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
