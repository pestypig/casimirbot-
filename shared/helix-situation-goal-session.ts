export const HELIX_SITUATION_GOAL_SESSION_SCHEMA =
  "helix.situation_goal_session.v1" as const;

export type HelixSituationGoalSession = {
  schema: typeof HELIX_SITUATION_GOAL_SESSION_SCHEMA;
  session_id: string;
  thread_id: string;
  room_id: string;
  source_ids: string[];
  graph_id?: string | null;
  world_id?: string | null;
  objective: string;
  standby_mode:
    | "off"
    | "text_only"
    | "voice_on_confirm"
    | "critical_voice"
    | "direct_address_only";
  append_policy: "salient_only" | "callouts_only" | "episodes_and_salience";
  context_policy: "explicit_attachment_only";
  command_lane_enabled: false;
  status: "active" | "paused" | "closed";
  created_at: string;
  updated_at: string;
};

export type HelixSituationGoalSessionReceipt = {
  schema: "helix.situation_goal_session_receipt.v1";
  ok: boolean;
  session?: HelixSituationGoalSession | null;
  error?: string | null;
  message: string;
};
