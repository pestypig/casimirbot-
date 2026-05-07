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
