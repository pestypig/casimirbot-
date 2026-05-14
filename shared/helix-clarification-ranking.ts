export const HELIX_CLARIFICATION_RANKING_SCHEMA =
  "helix.clarification_ranking.v1" as const;

export type HelixClarificationExpectedEffect =
  | "confirm_intent"
  | "disambiguate_use"
  | "resolve_missing_evidence"
  | "lower_confidence"
  | "raise_confidence"
  | "update_next_check";

export type HelixClarificationSuppressReason =
  | "duplicate"
  | "cooldown"
  | "low_value"
  | "user_busy"
  | "policy_disabled";

export type HelixClarificationRanking = {
  schema: typeof HELIX_CLARIFICATION_RANKING_SCHEMA;
  question_id: string;
  thread_id: string;
  room_id?: string | null;
  source_family: string;
  hypothesis_id?: string | null;
  evidence_refs: string[];
  candidate_question: string;
  answer_options?: string[];
  score: number;
  reason: string;
  suppress_reason?: HelixClarificationSuppressReason | null;
  expected_effect: HelixClarificationExpectedEffect;
  created_at: string;
};
