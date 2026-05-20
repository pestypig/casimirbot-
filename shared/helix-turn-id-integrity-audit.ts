export const HELIX_TURN_ID_INTEGRITY_AUDIT_SCHEMA = "helix.turn_id_integrity_audit.v1" as const;

export type HelixTurnIdIntegrityViolationCode =
  | "canonical_goal_turn_mismatch"
  | "artifact_ledger_turn_mismatch"
  | "event_turn_mismatch"
  | "solver_trace_turn_mismatch"
  | "terminal_authority_turn_mismatch"
  | "client_backend_turn_unmapped"
  | "prior_artifact_unmarked";

export type HelixTurnIdIntegrityAudit = {
  schema: typeof HELIX_TURN_ID_INTEGRITY_AUDIT_SCHEMA;
  turn_id: string;
  backend_turn_id: string | null;
  client_turn_id: string | null;
  ok: boolean;
  violations: Array<{
    code: HelixTurnIdIntegrityViolationCode;
    ref: string;
    observed_turn_id: string | null;
    expected_turn_id: string;
  }>;
  checked_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
