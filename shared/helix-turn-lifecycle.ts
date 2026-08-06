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
  | "provider_observation_reentry_disagrees_with_runtime"
  | "capability_lane_reentry_disagrees_with_provider"
  | "capability_lane_reentry_disagrees_with_runtime"
  | "continuation_pending_after_runtime_completion"
  | "terminal_rejection_after_eligible_runtime_completion"
  | "pending_lane_request_projected_as_terminal_candidate"
  | "provider_candidate_disagrees_with_runtime_message"
  | "authorized_provider_candidate_not_materialized"
  | "provider_candidate_ref_lost_during_materialization"
  | "provider_candidate_text_changed_during_materialization"
  | "provider_candidate_evidence_refs_dropped"
  | "provider_candidate_ref_lost_by_terminal_writer"
  | "provider_candidate_text_changed_by_terminal_writer"
  | "provider_candidate_evidence_refs_dropped_by_terminal_writer"
  | "materialized_text_changed_by_terminal_writer"
  | "materialized_evidence_refs_dropped_by_terminal_writer"
  | "terminal_writer_text_changed_in_visible_projection"
  | "typed_failure_selected_after_authorized_provider_candidate"
  | "recoverable_rejection_terminalized_before_reentry"
  | "record_only_admission_executed_runtime_steps"
  | "exact_tool_cardinality_violated"
  | "forbidden_extra_tool_executed"
  | "failed_evidence_quality_gate_bypassed";

export type HelixTurnLifecycleAuditStage =
  | "tool_execution"
  | "evidence_reentry"
  | "followup_reasoning"
  | "terminal_materialization"
  | "terminal_authority"
  | "presentation"
  | "scientific_evidence";

export type HelixTurnLifecycleAuditDisposition =
  | "adapter_projection_contradiction"
  | "hard_evidence_boundary"
  | "hard_policy_boundary"
  | "informational";

export type HelixTurnLifecycleProjectionMismatch = {
  code: HelixTurnLifecycleProjectionMismatchCode;
  lifecycle_event_id: string | null;
  projection_path: string;
  lifecycle_value: boolean | string | null;
  projection_value: boolean | string | null;
  stage?: HelixTurnLifecycleAuditStage;
  disposition?: HelixTurnLifecycleAuditDisposition;
};

export type HelixTurnLifecycleContinuityCheck = {
  stage: HelixTurnLifecycleAuditStage;
  check:
    | "runtime_observation_reentry"
    | "capability_lane_observation_reentry"
    | "provider_observation_reentry"
    | "requested_tool_cardinality"
    | "forbidden_other_tools_absent"
    | "runtime_followup_reasoning"
    | "record_only_admission_did_not_execute"
    | "runtime_message_matches_provider_candidate"
    | "provider_candidate_authorized"
    | "provider_candidate_materialized"
    | "provider_candidate_ref_preserved"
    | "provider_candidate_text_preserved"
    | "provider_candidate_evidence_refs_preserved"
    | "provider_candidate_ref_preserved_by_terminal_writer"
    | "provider_candidate_text_preserved_by_terminal_writer"
    | "provider_candidate_evidence_refs_preserved_by_terminal_writer"
    | "materialized_text_preserved_by_terminal_writer"
    | "materialized_evidence_refs_preserved_by_terminal_writer"
    | "terminal_writer_text_preserved_in_visible_projection"
    | "recoverable_rejection_reentered"
    | "evidence_quality_gate";
  status: "passed" | "failed" | "failed_closed" | "not_observed" | "not_applicable";
  disposition: HelixTurnLifecycleAuditDisposition;
  source_ref?: string | null;
  target_ref?: string | null;
  source_sha256?: string | null;
  target_sha256?: string | null;
  expected_support_ref_count?: number;
  observed_support_ref_count?: number;
  missing_support_refs?: string[];
  reason_codes?: string[];
};

export type HelixTurnLifecycleProjectionAudit = {
  schema: "helix.turn_lifecycle_projection_audit.v1";
  ok: boolean;
  mismatches: HelixTurnLifecycleProjectionMismatch[];
  first_divergence_stage?: HelixTurnLifecycleAuditStage | null;
  continuity_checks?: HelixTurnLifecycleContinuityCheck[];
  scientific_evidence_disposition?:
    | "passed"
    | "repair_pending"
    | "failed_closed"
    | "bypassed"
    | "not_observed";
  assistant_answer: false;
  raw_content_included: false;
};
