export const HELIX_TURN_LIFECYCLE_SCHEMA = "helix.turn_lifecycle.v1" as const;
export const HELIX_TURN_LIFECYCLE_EVENT_SCHEMA = "helix.turn_lifecycle_event.v1" as const;

export type HelixTurnLifecycleScope =
  | "codex_native_provider_cycle"
  | "helix_ask_turn";

export type HelixTurnLifecycleEventKind =
  | "turn.started"
  | "route.proposed"
  | "route.committed"
  | "route.rejected"
  | "capability.proposed"
  | "capability.admitted"
  | "capability.rejected"
  | "tool.call.started"
  | "tool.call.completed"
  | "tool.call.failed"
  | "tool.call.rejected"
  | "observation.reentered"
  | "agent.message.completed"
  | "runtime.turn.completed"
  | "runtime.turn.failed"
  | "terminal.eligibility.checked"
  | "turn.completed"
  | "turn.failed"
  | "turn.needs_input";

export type HelixTurnLifecycleProducer =
  | "codex_runtime"
  | "helix_adapter"
  | "helix_policy"
  | "helix_terminal_authority";

export type HelixTurnLifecycleEvent = {
  schema: typeof HELIX_TURN_LIFECYCLE_EVENT_SCHEMA;
  turn_id: string;
  event_id: string;
  sequence: number;
  kind: HelixTurnLifecycleEventKind;
  producer: HelixTurnLifecycleProducer;
  occurred_at_ms: number;
  causation_id?: string;
  route_commit_id?: string;
  native_request_id?: string;
  native_turn_id?: string;
  native_item_id?: string;
  call_id?: string;
  capability_id?: string;
  capability_ids?: string[];
  observation_refs?: string[];
  message_sha256?: string;
  status?: "started" | "succeeded" | "blocked" | "failed";
  reason_code?: string;
  terminal_kind?: string;
  terminal_eligible?: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTurnLifecycleToolCallReduction = {
  call_id: string;
  capability_id: string | null;
  admission_event_id: string | null;
  started_event_id: string | null;
  completion_event_id: string | null;
  completion_kind: "tool.call.completed" | "tool.call.failed" | "tool.call.rejected" | null;
  completion_observation_refs: string[];
  reentry_observation_refs: string[];
  observation_refs: string[];
  reentry_event_id: string | null;
  reentered: boolean;
};

export type HelixTurnLifecycleReduction = {
  schema: "helix.turn_lifecycle_reduction.v1";
  turn_id: string;
  phase: HelixTurnLifecycleEventKind | "empty";
  route_commit_id: string | null;
  admitted_capability_ids: string[];
  tool_calls: HelixTurnLifecycleToolCallReduction[];
  pending_call_ids: string[];
  observation_reentry_refs: string[];
  latest_reentry_event_id: string | null;
  final_agent_message_event_id: string | null;
  post_observation_reasoning_completed: boolean;
  runtime_turn_completed: boolean;
  terminal_eligibility_event_id: string | null;
  terminal_eligible: boolean | null;
  terminal_event_count: number;
  terminal_outcome: "completed" | "failed" | "needs_input" | null;
  complete: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTurnLifecycleIntegrityViolationCode =
  | "event_sequence_invalid"
  | "event_turn_id_mismatch"
  | "duplicate_event_id"
  | "event_causation_missing"
  | "event_causation_not_prior"
  | "tool_call_started_without_admission"
  | "tool_call_settled_without_start"
  | "tool_call_capability_mismatch"
  | "tool_call_completed_without_observation"
  | "duplicate_tool_call_start"
  | "duplicate_tool_call_settlement"
  | "duplicate_observation_reentry"
  | "observation_reentry_without_tool_completion"
  | "observation_reentry_ref_mismatch"
  | "completed_tool_observation_not_reentered"
  | "agent_message_precedes_latest_reentry"
  | "runtime_completion_without_prior_agent_message"
  | "turn_completion_without_prior_runtime_completion"
  | "turn_completion_without_terminal_eligibility"
  | "turn_completed_without_agent_message"
  | "multiple_terminal_events"
  | "conflicting_terminal_events";

export type HelixTurnLifecycleIntegrityViolation = {
  code: HelixTurnLifecycleIntegrityViolationCode;
  event_id?: string;
  call_id?: string;
  detail: string;
};

export type HelixTurnLifecycleIntegrity = {
  schema: "helix.turn_lifecycle_integrity.v1";
  ok: boolean;
  violations: HelixTurnLifecycleIntegrityViolation[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTurnLifecycle = {
  schema: typeof HELIX_TURN_LIFECYCLE_SCHEMA;
  turn_id: string;
  scope: HelixTurnLifecycleScope;
  authority: "runtime_event_log";
  events: HelixTurnLifecycleEvent[];
  reduction: HelixTurnLifecycleReduction;
  integrity: HelixTurnLifecycleIntegrity;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixTurnLifecycleProjectionMismatchCode =
  | "legacy_evidence_reentry_disagrees_with_runtime"
  | "legacy_followup_reasoning_disagrees_with_runtime"
  | "legacy_provider_completion_disagrees_with_runtime"
  | "continuation_pending_after_runtime_completion"
  | "terminal_rejection_after_eligible_runtime_completion"
  | "pending_lane_request_projected_as_terminal_candidate";

export type HelixTurnLifecycleProjectionMismatch = {
  code: HelixTurnLifecycleProjectionMismatchCode;
  lifecycle_event_id: string | null;
  projection_path: string;
  lifecycle_value: boolean | string | null;
  projection_value: boolean | string | null;
};

export type HelixTurnLifecycleProjectionAudit = {
  schema: "helix.turn_lifecycle_projection_audit.v1";
  ok: boolean;
  mismatches: HelixTurnLifecycleProjectionMismatch[];
  assistant_answer: false;
  raw_content_included: false;
};
