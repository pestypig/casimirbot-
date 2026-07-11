export const HELIX_AGENT_CONTINUATION_STATE_SCHEMA = "helix.agent_continuation_state.v1" as const;
export const HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA =
  "helix.terminal_rejection_observation.v1" as const;

export type HelixAgentContinuationDecision = "act" | "retry" | "ask_user" | "answer" | "fail";

export type HelixAgentContinuationGoalStatus =
  | "satisfied"
  | "in_progress"
  | "needs_user_input"
  | "blocked"
  | "unknown";

export type HelixAgentContinuationFailureClass =
  | "none"
  | "invalid_args"
  | "permission"
  | "missing_evidence"
  | "temporary"
  | "provider"
  | "route"
  | "terminal_authority"
  | "unknown";

export type HelixAgentContinuationRetryability =
  | "not_applicable"
  | "retryable"
  | "non_retryable"
  | "requires_user_input"
  | "unknown";

export type HelixAgentContinuationAction = {
  panel_id?: string | null;
  action_id?: string | null;
  args?: Record<string, unknown>;
} & Record<string, unknown>;

export type HelixAgentContinuationAffordance = {
  affordance_id: string;
  capability_id: string | null;
  action: HelixAgentContinuationAction | null;
  args: Record<string, unknown>;
  source_ref: string | null;
  reason: string | null;
  admissible: boolean;
  tried: boolean;
  action_fingerprint: string;
};

export type HelixAgentContinuationAttempt = {
  attempt_id: string | null;
  capability_id: string | null;
  action_fingerprint: string | null;
  status: "succeeded" | "failed" | "blocked" | "pending" | "unknown";
  failure_class: HelixAgentContinuationFailureClass;
  failure_code: string | null;
  failure_message: string | null;
  retryability: HelixAgentContinuationRetryability;
  observation_refs: string[];
};

export type HelixAgentContinuationBudgetDimension = {
  max: number | null;
  consumed: number;
  remaining: number | null;
};

export type HelixAgentContinuationBudget = {
  soft: {
    iterations: HelixAgentContinuationBudgetDimension;
    tool_calls: HelixAgentContinuationBudgetDimension;
    model_decisions: HelixAgentContinuationBudgetDimension;
    pressure: "none" | "approaching" | "exhausted";
    exhausted: boolean;
  };
  hard: {
    iterations: HelixAgentContinuationBudgetDimension;
    tool_calls: HelixAgentContinuationBudgetDimension;
    model_decisions: HelixAgentContinuationBudgetDimension;
    exhausted: boolean;
  };
  extension_count: number;
  max_extensions: number | null;
};

export type HelixAgentContinuationState = {
  schema: typeof HELIX_AGENT_CONTINUATION_STATE_SCHEMA;
  turn_id: string;
  state_id: string;
  sequence: number;
  trigger: "initial" | "pre_decision" | "post_attempt" | "terminal_rejection" | "final_review";
  goal: {
    status: HelixAgentContinuationGoalStatus;
    satisfied: boolean;
    terminal_product_allowed: boolean | null;
  };
  observation_refs: {
    all: string[];
    existing: string[];
    new: string[];
  };
  missing_requirement_ids: string[];
  last_attempt: HelixAgentContinuationAttempt | null;
  next_admissible_affordances: HelixAgentContinuationAffordance[];
  tried_action_fingerprints: string[];
  progress: {
    made_progress: boolean;
    new_observation_count: number;
    resolved_requirement_ids: string[];
    added_requirement_ids: string[];
    new_affordance_count: number;
    no_progress_repeat_count: number;
    reason_codes: string[];
  };
  budget: HelixAgentContinuationBudget;
  allowed_decisions: HelixAgentContinuationDecision[];
  authority: "runtime_agent_decides_within_admitted_boundaries";
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTerminalRejectionObservation = {
  schema: typeof HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA;
  turn_id: string;
  observation_id: string;
  rejected_candidate_kind: string | null;
  rejected_candidate_ref: string | null;
  rejection_reason: string;
  recoverable: boolean;
  failure_class: "terminal_authority";
  retryability: "retryable" | "non_retryable";
  next_affordances: Array<{
    decision: "answer" | "act" | "ask_user" | "fail";
    reason: string;
  }>;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
