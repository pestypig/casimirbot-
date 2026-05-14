export const HELIX_LEARNING_PROMOTION_RECORD_SCHEMA = "helix.learning_promotion_record.v1" as const;

export type HelixLearningPromotionDecision =
  | "not_ready"
  | "ready_for_review"
  | "promoted"
  | "rejected";

export type HelixLearningPromotionRecord = {
  schema: typeof HELIX_LEARNING_PROMOTION_RECORD_SCHEMA;
  promotion_id: string;
  thread_id: string;
  candidate_id: string;
  decision: HelixLearningPromotionDecision;
  reason: string;
  required_replay_count: number;
  observed_replay_count: number;
  dictionary_version_id?: string | null;
  raw_logs_included: false;
  assistant_answer: false;
  model_invoked: boolean;
  deterministic: boolean;
  created_at: string;
};
