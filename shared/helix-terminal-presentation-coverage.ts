export const HELIX_TERMINAL_PRESENTATION_COVERAGE_AUDIT_SCHEMA =
  "helix.terminal_presentation_coverage_audit.v1" as const;

export type HelixTerminalPresentationCoverageAudit = {
  schema: typeof HELIX_TERMINAL_PRESENTATION_COVERAGE_AUDIT_SCHEMA;
  turn_id: string;
  route: string;
  terminal_artifact_kind: string;
  terminal_presenter_used: boolean;
  terminal_presentation_id?: string | null;
  raw_route_text_returned: boolean;
  receipt_snapshot_id?: string | null;
  distillation_id?: string | null;
  terminal_authority_count?: number;
  canonical_terminal_text_hash?: string | null;
  selected_final_answer_hash?: string | null;
  presentation_text_hash?: string | null;
  authority_text_hash?: string | null;
  terminal_event_text_hash?: string | null;
  visible_answer_hash?: string | null;
  authority_origin?: string | null;
  violations: string[];
  assistant_answer: false;
};
