export const HELIX_GOAL_CARD_SCHEMA = "helix.goal_card.v1" as const;

export type HelixGoalCardStatus =
  | "candidate"
  | "active"
  | "expired"
  | "resolved"
  | "rejected";

export type HelixGoalCard = {
  schema: typeof HELIX_GOAL_CARD_SCHEMA;
  goal_id: string;
  thread_id: string;
  room_id?: string | null;
  candidate_goal: string;
  rationale: string;
  evidence_refs: string[];
  next_evidence_needed: string[];
  status: HelixGoalCardStatus;
  confidence: number;
  expires_at: string;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
