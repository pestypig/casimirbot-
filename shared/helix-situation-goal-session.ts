export const HELIX_SITUATION_GOAL_SESSION_SCHEMA =
  "helix.situation_goal_session.v1" as const;

export const HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA =
  "helix.situation_goal_session_receipt.v1" as const;

export type SituationGoalSessionStatus =
  | "inactive"
  | "starting"
  | "active"
  | "paused"
  | "stopped"
  | "closed"
  | "error";

export type SituationGoalSessionMode =
  | "observe_only"
  | "text_callouts"
  | "voice_on_confirm"
  | "critical_voice";

export type SituationGoalSessionAppendPolicy =
  | "salient_only"
  | "callouts_only"
  | "episodes_and_salience";

export type SituationGoalSessionLedger = {
  objective: string;
  current_goal?: string | null;
  constraints: string[];
  known_risks: string[];
  known_unknowns: string[];
  recent_progress: string[];
  next_recommended_check?: string | null;
  evidence_refs: string[];
  updated_at: string;
};

export type SituationGoalSession = {
  schema: typeof HELIX_SITUATION_GOAL_SESSION_SCHEMA;
  session_id: string;
  thread_id: string;
  room_id: string;
  source_id?: string | null;
  source_ids: string[];
  graph_id?: string | null;
  world_id?: string | null;
  objective: string;
  current_goal?: string | null;
  status: SituationGoalSessionStatus;
  mode: SituationGoalSessionMode;
  voice_output_enabled: boolean;
  context_policy: "compact_context_pack_only";
  attachment_policy: "manual_or_session_bound";
  command_lane_enabled: false;
  created_at: string;
  updated_at: string;

  // Compatibility fields for older E129-E136 clients while the UI migrates.
  standby_mode?: "off" | "text_only" | "voice_on_confirm" | "critical_voice" | "direct_address_only";
  append_policy?: SituationGoalSessionAppendPolicy;
};

export type SituationGoalSessionReceipt = {
  schema: typeof HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA;
  ok: boolean;
  session?: SituationGoalSession | null;
  ledger?: SituationGoalSessionLedger | null;
  binding_id?: string | null;
  graph_id?: string | null;
  source_id?: string | null;
  message: string;
  error?: string | null;
};

export type HelixSituationGoalSession = SituationGoalSession;
export type HelixSituationGoalSessionReceipt = SituationGoalSessionReceipt;
