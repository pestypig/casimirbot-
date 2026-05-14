export const HELIX_USER_STEERING_EVIDENCE_SCHEMA =
  "helix.user_steering_evidence.v1" as const;

export type HelixUserSteeringEvidence = {
  schema: typeof HELIX_USER_STEERING_EVIDENCE_SCHEMA;
  steering_id: string;
  thread_id: string;
  source: "helix_ask_text" | "discord_voice" | "discord_text" | "manual_ui";
  user_claim: string;
  normalized_claim?: string | null;
  target_hypothesis_ids: string[];
  effect:
    | "confirm"
    | "reject"
    | "rename"
    | "refine_goal"
    | "add_missing_evidence_target"
    | "set_priority"
    | "unknown";
  confidence_delta?: number | null;
  next_checks: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
