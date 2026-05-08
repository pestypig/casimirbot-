export const HELIX_MISSION_MEMORY_SCHEMA = "helix.mission_memory.v1" as const;
export const HELIX_MISSION_MEMORY_UPDATE_SCHEMA =
  "helix.mission_memory_update.v1" as const;

export type HelixMissionMemoryStatus = "inactive" | "active" | "paused" | "error";

export type HelixMissionMemoryMode =
  | "text_only"
  | "voice_on_confirm"
  | "critical_voice"
  | "direct_address_only";

export type HelixMissionMemory = {
  schema: typeof HELIX_MISSION_MEMORY_SCHEMA;
  session_id: string;
  thread_id: string;
  room_id: string;
  source_ids: string[];
  world_id?: string | null;
  status: HelixMissionMemoryStatus;
  objective: string;
  mode: HelixMissionMemoryMode;
  now_line: string;
  goal_line: string;
  risk_line: string;
  progress_line: string;
  unknowns_line: string;
  last_decision_line: string;
  active_predictions: Array<{
    prediction_id: string;
    label: string;
    confidence: number;
    status: "hypothesis" | "active" | "completed" | "blocked";
    evidence_refs: string[];
  }>;
  active_risks: Array<{
    risk_id: string;
    label: string;
    priority: "info" | "warn" | "critical" | "action";
    evidence_refs: string[];
  }>;
  recent_episode_ids: string[];
  recent_salience_receipt_ids: string[];
  updated_at: string;
};

export type HelixMissionMemoryUpdate = {
  schema: typeof HELIX_MISSION_MEMORY_UPDATE_SCHEMA;
  update_id: string;
  session_id: string;
  thread_id: string;
  room_id: string;
  reason:
    | "episode_update"
    | "risk_update"
    | "goal_progress"
    | "goal_blocked"
    | "source_health"
    | "user_direct"
    | "manual_refresh";
  previous_hash?: string | null;
  next_hash: string;
  memory: HelixMissionMemory;
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_only";
  ts: string;
};

