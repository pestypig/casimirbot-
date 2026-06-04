export type HelixTerminalCandidateSource =
  | "final_answer_draft"
  | "repo_code_evidence_answer"
  | "situation_room_live_job_setup_answer"
  | "request_user_input"
  | "typed_failure"
  | "workspace_action_receipt"
  | "agent_step_observation_packet"
  | "client_projection"
  | "deterministic_receipt_fallback"
  | "legacy_fallback"
  | "legacy_workspace_failure";

export type HelixTerminalCandidate = {
  schema: "helix.terminal_candidate.v1";
  candidate_id: string;
  turn_id: string;
  artifact_ref?: string;
  artifact_kind: string;
  text: string;
  terminal_eligible: boolean;
  assistant_answer: boolean;
  source: HelixTerminalCandidateSource;
  created_at_stage:
    | "pre_runtime"
    | "runtime_iteration"
    | "post_tool_model_step"
    | "terminal_authority"
    | "legacy_branch";
  route_terminal_kind?: string;
  failure_code?: string;
  freshness: {
    iteration?: number;
    artifact_ledger_sequence?: number;
    supersedes_refs?: string[];
  };
};

export type HelixTerminalAuthoritySingleWriterRejectionReason =
  | "not_terminal_eligible"
  | "route_contract_forbidden"
  | "receipt_or_projection"
  | "stale_failure_candidate"
  | "missing_post_tool_model_step"
  | "pending_tool_call"
  | "legacy_direct_writer_quarantined"
  | "lower_priority_than_selected_artifact"
  | "later_valid_final_answer_draft"
  | "route_requires_synthesis"
  | "deterministic_receipt_fallback_nonterminal"
  | "route_contract_forbids_model_synthesized_answer"
  | "coverage_valid_model_only_answer_exists";

export type HelixTerminalAuthoritySingleWriterResult = {
  schema: "helix.terminal_authority_single_writer_result.v1";
  turn_id: string;
  selected_terminal_artifact_ref: string | null;
  selected_terminal_artifact_kind:
    | "model_synthesized_answer"
    | "repo_code_evidence_answer"
    | "scholarly_research_answer"
    | "situation_room_live_job_setup_answer"
    | "situation_context_pack"
    | "visual_context_pack"
    | "visual_frame_evidence"
    | "request_user_input"
    | "typed_failure"
    | "tool_receipt"
    | "direct_answer_text"
    | null;
  visible_text: string;
  assistant_answer: false;
  source:
    | "final_answer_draft"
    | "repo_code_evidence_answer"
    | "scholarly_research_answer"
    | "situation_room_live_job_setup_answer"
    | "situation_context_pack"
    | "visual_context_pack"
    | "visual_frame_evidence"
    | "request_user_input"
    | "typed_failure"
    | "tool_receipt"
    | "direct_answer_text"
    | "terminal_authority_repair_failure";
  rejected_candidates: Array<{
    ref?: string;
    kind: string;
    source?: HelixTerminalCandidateSource | string;
    reason: HelixTerminalAuthoritySingleWriterRejectionReason;
  }>;
  writes: {
    payload_text: string;
    payload_answer: string;
    payload_assistant_answer: string;
    payload_selected_final_answer: string;
    terminal_presentation_concise_text: string;
    debug_selected_final_answer: string;
  };
  integrity: {
    single_writer_applied: true;
    visible_matches_selected_artifact: boolean;
    visible_matches_draft: boolean;
    stale_failure_visible: boolean;
    receipt_visible_as_answer: boolean;
    post_tool_model_step_satisfied: boolean;
    legacy_terminal_candidate_count: number;
    forbidden_terminal_candidate_count: number;
    payload_mirror_written_after_terminal_selection: boolean;
    selected_over_direct_answer_text?: boolean;
    final_answer_draft_quality_ok?: boolean;
    final_answer_draft_quality_violations?: string[];
    materialized_terminal_artifact_kind?: string | null;
    materialized_terminal_artifact_ref?: string | null;
    materialization_blocked_reason?: string | null;
  };
};
