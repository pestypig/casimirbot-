export const HELIX_USER_STEERING_EVENT_SCHEMA =
  "helix.user_steering_event.v1" as const;

export type HelixUserSteeringEffect =
  | "raise_relevance"
  | "correct_hypothesis"
  | "set_objective"
  | "set_missing_evidence_target"
  | "change_delivery_policy"
  | "request_review";

export type HelixUserSteeringEvent = {
  schema: typeof HELIX_USER_STEERING_EVENT_SCHEMA;
  steering_id: string;
  thread_id: string;
  room_id?: string | null;
  prompt: string;
  interpreted_claim?: string | null;
  effect: HelixUserSteeringEffect;
  target_ids: string[];
  evidence_refs: string[];
  created_at: string;
  assistant_answer: false;
};
