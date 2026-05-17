export const HELIX_GOAL_CARD_SCHEMA = "helix.goal_card.v1" as const;

export type HelixGoalCardStatus =
  | "candidate"
  | "active"
  | "blocked"
  | "completed"
  | "expired"
  | "resolved"
  | "rejected";

export type HelixGoalCardType =
  | "identify_current_activity"
  | "track_risk"
  | "resolve_missing_visual_evidence"
  | "resolve_missing_world_events"
  | "monitor_user_direct_address"
  | "verify_equation_or_calculation"
  | "compare_live_transcript_to_reference"
  | "preserve_context_in_notes"
  | "update_place_memory"
  | "custom";

export type HelixGoalCard = {
  schema: typeof HELIX_GOAL_CARD_SCHEMA;
  goal_id: string;
  thread_id: string;
  room_id?: string | null;
  goal_type: HelixGoalCardType;
  candidate_goal: string;
  rationale: string;
  evidence_refs: string[];
  next_evidence_needed: string[];
  blocked_by: string[];
  status: HelixGoalCardStatus;
  priority: number;
  confidence: number;
  may_request_helix_ask: boolean;
  may_execute_tool: false;
  expires_after_ms?: number | null;
  expires_at: string;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
