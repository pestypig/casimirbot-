export type HelixTerminalCandidateSource =
  | "final_answer_draft"
  | "agent_provider_terminal_candidate"
  | "doc_evidence_synthesis_answer"
  | "repo_code_evidence_answer"
  | "compound_evidence_synthesis_answer"
  | "compound_research_locator_answer"
  | "scholarly_research_answer"
  | "internet_search_answer"
  | "theory_context_reflection_answer"
  | "situation_room_live_job_setup_answer"
  | "capability_help_summary"
  | "workspace_directory_resolution"
  | "workspace_status_answer"
  | "workstation_tool_evaluation"
  | "calculator_stream_result"
  | "calculation_trace"
  | "tool_evaluation"
  | "request_user_input"
  | "typed_failure"
  | "doc_summary"
  | "doc_search_results"
  | "doc_open_receipt"
  | "docs_viewer_receipt"
  | "doc_location_result"
  | "doc_location_matches"
  | "doc_evidence_location"
  | "doc_equation_context"
  | "workspace_action_receipt"
  | "note_update_receipt"
  | "note_action_receipt"
  | "stage_play_live_source_mail_decision"
  | "stage_play_live_source_watch_job_policy_config_result"
  | "stage_play_agent_goal_session_receipt"
  | "stage_play_workstation_control_receipt"
  | "live_source_interim_voice_callout_receipt"
  | "live_pipeline_receipt"
  | "live_environment_binding_diagnosis"
  | "narrator_bind_stream_receipt"
  | "narrator_say_receipt"
  | "voice_block_receipt"
  | "voice_hold_receipt"
  | "voice_receipt"
  | "situation_context_pack"
  | "visual_context_pack"
  | "visual_frame_evidence"
  | "image_lens_observation_report"
  | "provider_image_lens_observation_report"
  | "image_lens_named_receipt_evaluation"
  | "postulate_runtime_review"
  | "agent_step_observation_packet"
  | "client_projection"
  | "deterministic_receipt_fallback"
  | "legacy_fallback"
  | "legacy_workspace_failure";

export type HelixToolOutputRole =
  | "self_terminal"
  | "evidence_for_synthesis"
  | "ambient_context"
  | "candidate_next_step";

const HELIX_SELF_TERMINAL_ARTIFACT_KINDS = new Set([
  "image_lens_observation_report",
  "image_lens_named_receipt_evaluation",
  "note_update_receipt",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "typed_failure",
  "request_user_input",
]);

export const helixToolOutputRoleForTerminalKind = (
  kind: string | null | undefined,
): HelixToolOutputRole | null => {
  const normalized = typeof kind === "string" ? kind.trim().toLowerCase() : "";
  if (!normalized) return null;
  if (HELIX_SELF_TERMINAL_ARTIFACT_KINDS.has(normalized)) return "self_terminal";
  if (/sidecar|context_pack|client_projection|panel_generated_answer|live_card_projection/i.test(normalized)) {
    return "ambient_context";
  }
  return null;
};

export const helixTerminalKindIsSelfTerminal = (kind: string | null | undefined): boolean =>
  helixToolOutputRoleForTerminalKind(kind) === "self_terminal";

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
  output_role?: HelixToolOutputRole | null;
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
  | "missing_required_observation"
  | "missing_evidence_reentry"
  | "route_contract_disallowed"
  | "deterministic_receipt_fallback_nonterminal"
  | "route_contract_forbids_model_synthesized_answer"
  | "coverage_valid_model_only_answer_exists"
  | "stale_model_only_after_observation"
  | "composer_claimed_no_observations_but_receipts_exist"
  | "missing_required_live_source_mail_decision"
  | "missing_required_voice_receipt_or_hold"
  | "receipt_not_terminal_eligible"
  | "terminal_forbidden_by_phase_lock"
  | "solver_continuation_pending"
  | "stale_solver_continuation_superseded_by_repo_terminal"
  | "stale_solver_continuation_superseded_by_docs_terminal"
  | "stale_solver_continuation_superseded_by_scholarly_terminal"
  | "stale_solver_continuation_superseded_by_stage_play_terminal"
  | "stale_solver_continuation_superseded_by_image_lens_observation_report"
  | "stale_solver_continuation_superseded_by_provider_terminal"
  | "stale_solver_continuation_superseded_by_provider_route_product";

export type TerminalAuthoritySingleWriterAuditRejectionReason =
  | "receipt_not_terminal_eligible"
  | "stale_model_only_after_observation"
  | "terminal_forbidden_by_phase_lock"
  | "missing_required_observation"
  | "missing_evidence_reentry"
  | "route_contract_disallowed";

export interface TerminalAuthoritySingleWriterAuditV1 {
  artifactId: "terminal_authority_single_writer";
  schemaVersion: "helix.terminal_authority_single_writer.v1";
  selectedArtifactKind: string | null;
  selectedArtifactRef: string | null;
  rejectedCandidates: Array<{
    artifactKind: string;
    artifactRef?: string;
    reason: TerminalAuthoritySingleWriterAuditRejectionReason;
  }>;
  wroteVisibleFields: string[];
  forbiddenPreAuthorityVisibleFields?: string[];
}

export type HelixTerminalAuthoritySingleWriterResult = {
  schema: "helix.terminal_authority_single_writer_result.v1";
  artifactId?: "terminal_authority_single_writer";
  schemaVersion?: "helix.terminal_authority_single_writer.v1";
  turn_id: string;
  selectedArtifactKind?: string | null;
  selectedArtifactRef?: string | null;
  selected_terminal_artifact_ref: string | null;
  selected_terminal_artifact_kind:
    | "model_synthesized_answer"
    | "doc_evidence_synthesis_answer"
    | "repo_code_evidence_answer"
    | "compound_evidence_synthesis_answer"
    | "compound_research_locator_answer"
    | "scholarly_research_answer"
    | "internet_search_answer"
    | "theory_context_reflection_answer"
    | "situation_room_live_job_setup_answer"
    | "situation_context_pack"
    | "visual_context_pack"
    | "visual_frame_evidence"
    | "image_lens_observation_report"
    | "provider_image_lens_observation_report"
    | "image_lens_named_receipt_evaluation"
    | "postulate_runtime_review"
    | "agent_provider_terminal_candidate"
    | "live_environment_binding_diagnosis"
    | "capability_help_summary"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "workstation_tool_evaluation"
    | "calculator_stream_result"
    | "calculation_trace"
    | "tool_evaluation"
    | "workspace_action_receipt"
    | "doc_open_receipt"
    | "docs_viewer_receipt"
    | "active_doc_identity"
    | "doc_search_results"
    | "doc_location_result"
    | "doc_location_matches"
    | "doc_evidence_location"
    | "doc_summary"
    | "doc_equation_context"
    | "note_update_receipt"
    | "note_action_receipt"
    | "stage_play_live_source_mail_decision"
    | "stage_play_live_source_watch_job_policy_config_result"
    | "stage_play_agent_goal_session_receipt"
    | "stage_play_workstation_control_receipt"
    | "live_source_interim_voice_callout_receipt"
    | "live_pipeline_receipt"
    | "narrator_bind_stream_receipt"
    | "narrator_say_receipt"
    | "voice_block_receipt"
    | "voice_hold_receipt"
    | "voice_receipt"
    | "request_user_input"
    | "typed_failure"
    | "tool_receipt"
    | "direct_answer_text"
    | null;
  visible_text: string;
  assistant_answer: false;
  selected_terminal_support_refs?: string[];
  selected_terminal_support_refs_count?: number;
  selected_terminal_subgoal_observation_refs?: string[];
  selected_terminal_subgoal_observation_refs_count?: number;
  selected_terminal_source_families?: string[];
  source:
    | "final_answer_draft"
    | "agent_provider_terminal_candidate"
    | "doc_evidence_synthesis_answer"
    | "repo_code_evidence_answer"
    | "compound_evidence_synthesis_answer"
    | "compound_research_locator_answer"
    | "scholarly_research_answer"
    | "internet_search_answer"
    | "theory_context_reflection_answer"
    | "situation_room_live_job_setup_answer"
    | "situation_context_pack"
    | "visual_context_pack"
    | "visual_frame_evidence"
    | "image_lens_observation_report"
    | "provider_image_lens_observation_report"
    | "image_lens_named_receipt_evaluation"
    | "postulate_runtime_review"
    | "live_environment_binding_diagnosis"
    | "capability_help_summary"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "workstation_tool_evaluation"
    | "calculator_stream_result"
    | "calculation_trace"
    | "tool_evaluation"
    | "workspace_action_receipt"
    | "doc_open_receipt"
    | "docs_viewer_receipt"
    | "active_doc_identity"
    | "doc_search_results"
    | "doc_location_result"
    | "doc_location_matches"
    | "doc_evidence_location"
    | "doc_summary"
    | "doc_equation_context"
    | "note_update_receipt"
    | "note_action_receipt"
    | "stage_play_live_source_mail_decision"
    | "stage_play_live_source_watch_job_policy_config_result"
    | "stage_play_agent_goal_session_receipt"
    | "stage_play_workstation_control_receipt"
    | "live_source_interim_voice_callout_receipt"
    | "live_pipeline_receipt"
    | "narrator_bind_stream_receipt"
    | "narrator_say_receipt"
    | "voice_block_receipt"
    | "voice_hold_receipt"
    | "voice_receipt"
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
  wroteVisibleFields?: string[];
  forbiddenPreAuthorityVisibleFields?: string[];
  audit?: TerminalAuthoritySingleWriterAuditV1;
  integrity: {
    single_writer_applied: true;
    terminal_authority_single_writer_audit?: TerminalAuthoritySingleWriterAuditV1;
    forbidden_pre_authority_visible_fields?: string[];
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
    itinerary_observation_criteria_satisfied?: boolean;
    compound_materialized_draft_can_satisfy_terminal?: boolean;
    terminal_projection_kind_match?: boolean;
    terminal_projection_guard_applied?: boolean;
    terminal_projection_guard_action?: "project_authority_artifact" | "fail_closed" | null;
    terminal_projection_failure_code?: "terminal_projection_mismatch" | null;
  };
};
