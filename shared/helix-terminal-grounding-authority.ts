export const HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA =
  "helix.terminal_grounding_authority.v1" as const;

export type HelixTerminalGroundingAuthorityStatus =
  | "not_required"
  | "validated"
  | "rejected";

export type HelixTerminalGroundingAuthoritySource =
  | "canonical_terminal_boundary"
  | "canonical_terminal_boundary_compatibility";

export type HelixTerminalGroundingAuthorityFailureCode =
  | "grounding_mode_ambiguous"
  | "solver_path_not_completed"
  | "route_authority_rejected"
  | "poison_audit_rejected"
  | "terminal_answer_not_server_authoritative"
  | "terminal_answer_not_eligible"
  | "terminal_answer_contract_incomplete"
  | "terminal_turn_binding_mismatch"
  | "terminal_artifact_ref_missing"
  | "terminal_artifact_binding_mismatch"
  | "terminal_text_hash_missing"
  | "terminal_text_hash_mismatch"
  | "terminal_product_not_allowed_by_route"
  | "evidence_reentry_not_completed"
  | "evidence_not_current_turn"
  | "selected_evidence_missing"
  | "selected_evidence_support_incomplete"
  | "solver_artifact_reentry_rejected";

/**
 * Tool-neutral proof that a canonical terminal answer is either model-direct or
 * grounded by the completed solver path. This is an audit artifact, never an
 * assistant answer or a replacement terminal writer.
 */
export type HelixTerminalGroundingAuthority = {
  schema: typeof HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA;
  authority_id: string;
  authority_source: HelixTerminalGroundingAuthoritySource;
  turn_id: string;
  terminal_artifact_ref: string | null;
  terminal_artifact_kind: string | null;
  final_answer_source: string | null;
  terminal_text_hash: string | null;
  grounding_required: boolean;
  status: HelixTerminalGroundingAuthorityStatus;
  selected_evidence_refs: string[];
  evidence_reentry_authority:
    | "runtime_event_log"
    | "route_self_terminal"
    | "provider_terminal_authority_bridge"
    | "compatibility_projection"
    | null;
  runtime_lifecycle_verified: boolean;
  current_turn_only: boolean;
  completed_solver_path: boolean;
  route_authority_ok: boolean;
  poison_audit_ok: boolean;
  terminal_authority_ok: boolean;
  support_coverage_complete: boolean;
  failure_code: HelixTerminalGroundingAuthorityFailureCode | null;
  failure_codes: HelixTerminalGroundingAuthorityFailureCode[];
  assistant_answer: false;
  terminal_eligible: false;
  provider_payload_included: false;
  raw_content_included: false;
};
