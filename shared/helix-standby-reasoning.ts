export const HELIX_STANDBY_REASONING_RESULT_SCHEMA =
  "helix.standby_reasoning_result.v1" as const;

export type StandbyReasoningDecision =
  | "silent_keep_in_context"
  | "text_callout"
  | "voice_on_confirm"
  | "request_user_input"
  | "attach_context_for_user_turn";

export type StandbyReasoningResult = {
  schema: typeof HELIX_STANDBY_REASONING_RESULT_SCHEMA;
  work_id: string;
  episode_id?: string | null;
  decision: StandbyReasoningDecision;
  summary: string;
  prediction?: string | null;
  rationale: string;
  evidence_refs: string[];
  confidence: number;
};
