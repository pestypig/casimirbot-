export const HELIX_STANDBY_OBSERVATION_BATCH_SCHEMA =
  "helix.standby_observation_batch.v1" as const;

export type HelixStandbyObservationAppendReason =
  | "salient_receipt"
  | "source_health"
  | "request_user_input"
  | "manual_attach";

export type HelixStandbyObservationSuppressionReason =
  | "no_thread_context"
  | "observe_only_binding"
  | "projection_only"
  | "not_salient"
  | "dedupe_cooldown"
  | "rate_limited"
  | "binding_mismatch"
  | "source_id_mismatch"
  | "context_ineligible"
  | "batch_empty";

export type HelixStandbyObservationAppendDecision = {
  event_id: string;
  world_id?: string | null;
  room_id: string;
  source_id?: string | null;
  graph_id?: string | null;
  thread_id?: string | null;
  appendable: boolean;
  appended: boolean;
  salience_reason?: string | null;
  salience_priority?: "info" | "warn" | "critical" | "action" | null;
  append_reason?: HelixStandbyObservationAppendReason | null;
  suppression_reason?: HelixStandbyObservationSuppressionReason | null;
  dedupe_key?: string | null;
  observation_item_id?: string | null;
};

export type HelixStandbyObservationBatchReceipt = {
  schema: typeof HELIX_STANDBY_OBSERVATION_BATCH_SCHEMA;
  batch_id: string;
  thread_id?: string | null;
  turn_id?: string | null;
  room_id?: string | null;
  source_ids: string[];
  world_ids: string[];
  event_count: number;
  appendable_count: number;
  appended_count: number;
  suppressed_count: number;
  decisions: HelixStandbyObservationAppendDecision[];
  started_at: string;
  completed_at: string;
  duration_ms: number;
};
