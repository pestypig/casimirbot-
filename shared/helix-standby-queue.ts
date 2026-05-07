export const HELIX_STANDBY_QUEUE_ITEM_SCHEMA =
  "helix.standby_queue_item.v1" as const;

export type StandbyQueuePriority =
  | "user_direct"
  | "critical_salience"
  | "standby_salience"
  | "standby_interpretation"
  | "maintenance";

export type StandbyQueueTaskKind =
  | "semantic_event"
  | "micro_narration"
  | "goal_prediction"
  | "salience_review"
  | "interjection_review"
  | "thread_observation_append"
  | "context_compaction";

export type StandbyQueueItem = {
  schema: typeof HELIX_STANDBY_QUEUE_ITEM_SCHEMA;
  queue_item_id: string;
  room_id: string;
  graph_id?: string | null;
  priority: StandbyQueuePriority;
  task_kind: StandbyQueueTaskKind;
  input_refs: string[];
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  result_ref?: string | null;
};

export type SituationCognitionPowerMode =
  | "observe_only"
  | "low_power"
  | "warm_standby"
  | "active_companion"
  | "game_master";

export const HELIX_STANDBY_WORK_ITEM_SCHEMA =
  "helix.standby_work_item.v1" as const;

export type StandbyWorkPriority =
  | "user_direct"
  | "critical_salience"
  | "standby_callout_delivery"
  | "standby_salience"
  | "standby_interpretation"
  | "maintenance";

export type StandbyWorkKind =
  | "episode_narration"
  | "goal_prediction"
  | "interjection_review"
  | "standby_callout_delivery"
  | "state_compaction"
  | "thread_observation_append"
  | "user_request_context_refresh";

export type StandbyWorkItem = {
  schema: typeof HELIX_STANDBY_WORK_ITEM_SCHEMA;
  work_id: string;
  priority: StandbyWorkPriority;
  kind: StandbyWorkKind;
  room_id: string;
  graph_id?: string | null;
  thread_id?: string | null;
  episode_id?: string | null;
  salience_receipt_id?: string | null;
  evidence_refs: string[];
  payload: Record<string, unknown>;
  status: "queued" | "running" | "completed" | "cancelled" | "failed" | "dropped";
  created_at: string;
  updated_at: string;
  dropped_reason?: string | null;
};

export type StandbyQueueMetrics = {
  pending_count: number;
  running_count: number;
  completed_count: number;
  dropped_count: number;
  last_preempted_work_id?: string;
};

export type StandbyCognitionMode =
  | "off"
  | "deterministic_only"
  | "llm_on_salience"
  | "llm_per_episode"
  | "llm_per_event_debug";
