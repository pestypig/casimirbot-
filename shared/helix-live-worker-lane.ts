export const HELIX_LIVE_WORKER_LANE_SCHEMA = "helix.live_worker_lane.v1" as const;

export type HelixLiveWorkerLaneKey =
  | "visual_capture"
  | "visual_analysis"
  | "source_health"
  | "present_state_synthesis"
  | "line_place"
  | "line_activity"
  | "line_structure"
  | "line_entities"
  | "line_risk"
  | "line_missing_evidence"
  | "line_next_check"
  | "custom_line";

export type HelixLiveWorkerTriggerPolicy =
  | "manual"
  | "interval"
  | "on_salience"
  | "on_stale"
  | "on_missing_evidence";

export type HelixLiveWorkerLane = {
  schema: typeof HELIX_LIVE_WORKER_LANE_SCHEMA;
  worker_id: string;
  thread_id: string;
  environment_id: string;
  source_ids: string[];
  lane_key: HelixLiveWorkerLaneKey;
  objective: string;
  allowed_tools: string[];
  cadence_ms?: number | null;
  trigger_policy: HelixLiveWorkerTriggerPolicy;
  status: "active" | "paused" | "stopped" | "error";
  latest_run_id?: string | null;
  next_run_at?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
