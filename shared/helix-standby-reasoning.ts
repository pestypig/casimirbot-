export const HELIX_STANDBY_REASONING_RESULT_SCHEMA =
  "helix.standby_reasoning_result.v1" as const;

export type StandbyReasoningDecision =
  | "silent_keep_in_context"
  | "text_callout"
  | "voice_on_confirm"
  | "request_user_input"
  | "attach_context_for_user_turn";

export type StandbyReasoningSource =
  | "deterministic_dictionary"
  | "rule_based_salience"
  | "micro_model"
  | "full_helix_turn";

export type StandbyReasoningContextPolicy =
  | "observation_only"
  | "eligible_for_retrieval_summary"
  | "eligible_for_direct_user_context"
  | "never_inject";

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
  source: StandbyReasoningSource;
  context_policy: StandbyReasoningContextPolicy;
  model_invoked: boolean;
  user_visible: boolean;
  safe_for_future_context: boolean;
  deterministic: boolean;
};
