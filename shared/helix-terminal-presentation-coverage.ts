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
  violations: string[];
  assistant_answer: false;
};
