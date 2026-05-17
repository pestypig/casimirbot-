export const HELIX_LIVE_FIELD_WORKER_SCHEMA =
  "helix.live_field_worker.v1" as const;

export type HelixLiveFieldWorkerRole =
  | "scene_observer"
  | "activity_interpreter"
  | "object_extractor"
  | "evidence_curator"
  | "uncertainty_tracker"
  | "next_check_planner"
  | "user_notice_judge"
  | "workstation_affordance_judge"
  | "custom";

export type HelixLiveFieldWorker = {
  schema: typeof HELIX_LIVE_FIELD_WORKER_SCHEMA;
  worker_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  field_key: string;
  field_label: string;
  worker_role: HelixLiveFieldWorkerRole;
  input_policy: {
    allowed_roles: string[];
    forbidden_roles: string[];
    max_observations: number;
    allow_prior_field_evaluations: boolean;
  };
  output_type: "field_evaluation";
  may_execute_tool: false;
  status: "registered" | "active" | "paused" | "stale" | "disabled" | "stopped";
  assistant_answer: false;
  raw_content_included: false;
};
