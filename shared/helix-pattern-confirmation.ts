export const HELIX_PATTERN_CONFIRMATION_SCHEMA =
  "helix.pattern_confirmation.v1" as const;

export type HelixPatternConfirmation = {
  schema: typeof HELIX_PATTERN_CONFIRMATION_SCHEMA;
  confirmation_id: string;
  thread_id: string;
  pattern_id: string;
  status: "candidate" | "confirmed_by_user" | "rejected_by_user" | "needs_replay" | "promotion_ready";
  steering_memory_ids: string[];
  evidence_refs: string[];
  promotion_allowed: boolean;
  reason: string;
  assistant_answer: false;
  raw_logs_included: false;
  created_at: string;
};
