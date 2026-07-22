export const HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA = "helix.tool_lifecycle_trace.v1" as const;

export const HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA = "helix.tool_followup_decision.v1" as const;

export type HelixToolLifecycleStage =
  | "proposed"
  | "admitted"
  | "started"
  | "polling"
  | "completed"
  | "failed"
  | "cancelled"
  | "blocked"
  | "reentered_solver";

export type HelixToolLifecycleStatus =
  | "not_started"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "unknown";

export type HelixToolRetryRecommendation =
  | "poll_same_tool"
  | "retry_same_tool"
  | "try_alternate_probe"
  | "ask_user"
  | "stop_external_change_required"
  | "allow_terminal";

export type HelixToolLifecycleTrace = {
  schema: typeof HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA;
  turn_id: string;

  tool_call_id: string;
  tool_family: string;

  requested_capability: string | null;
  admitted_capability: string | null;
  executed_capability: string | null;

  lifecycle_stage: HelixToolLifecycleStage;
  status: HelixToolLifecycleStatus;

  session_ref: string | null;
  process_ref: string | null;

  observation_refs: string[];
  receipt_refs: string[];
  evidence_refs: string[];

  reentry_authority?: "runtime_event_log" | "compatibility_projection";
  runtime_lifecycle_verified?: boolean;
  matched_reentry_refs?: string[];

  failure_reason: string | null;
  retry_recommendation: HelixToolRetryRecommendation;

  fallback_used: boolean;
  fallback_equivalent: boolean;
  terminal_eligible: boolean;

  assistant_answer: false;
  raw_content_included: false;
};

export type HelixToolFollowupDecision = {
  schema: typeof HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA;
  turn_id: string;

  prior_tool_trace_ref: string;
  observation_summary: string;

  next_action:
    | "poll"
    | "retry"
    | "alternate_probe"
    | "continue_reasoning"
    | "ask_user"
    | "terminal_failure"
    | "terminal_answer";

  reason: string;
  external_change_required: boolean;
  terminal_blockers: string[];

  required_surface_satisfied: boolean;
  evidence_reentered: boolean;

  assistant_answer: false;
  raw_content_included: false;
};
