import {
  HELIX_TERMINAL_PRESENTATION_COVERAGE_AUDIT_SCHEMA,
  type HelixTerminalPresentationCoverageAudit,
} from "@shared/helix-terminal-presentation-coverage";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? value as Record<string, unknown> : null;

export function auditTerminalPresentationCoverage(input: {
  payload: Record<string, unknown>;
  turnId: string;
  route: string;
  terminalArtifactKind: string;
  selectedFinalAnswer: string;
}): HelixTerminalPresentationCoverageAudit {
  const presentation = readRecord(input.payload.terminal_presentation);
  const presenterUsed = presentation?.schema === "helix.terminal_presentation.v1";
  const presentationText = readString(presentation?.concise_text);
  const presentationId = readString(presentation?.presentation_id);
  const receiptSnapshotId =
    readString(presentation?.receipt_snapshot_ref) ??
    readString(readRecord(input.payload.receipt_presentation_snapshot)?.snapshot_id);
  const distillationId =
    readString(presentation?.distillation_ref) ??
    readString(readRecord(input.payload.answer_distillation)?.distillation_id);
  const terminalAuthority = readRecord(input.payload.terminal_answer_authority);
  const poisonAudit = readRecord(input.payload.poison_audit);
  const terminalAuthorityCount = terminalAuthority?.schema === "helix.turn_terminal_authority.v1" ? 1 : 0;
  const violations: string[] = [];
  if (!presenterUsed) violations.push("terminal_presenter_missing");
  if (terminalAuthorityCount !== 1 || terminalAuthority?.server_authoritative !== true) {
    violations.push("terminal_authority_missing");
  }
  if (poisonAudit?.schema !== "helix.turn_poison_audit.v1" || poisonAudit.ok !== true) {
    violations.push("poison_audit_missing_or_failed");
  }
  if (presenterUsed && presentationText && presentationText !== input.selectedFinalAnswer.trim()) {
    violations.push("selected_final_answer_not_presented_text");
  }
  if (
    [
      "live_pipeline_receipt",
      "live_answer_environment_receipt",
      "workspace_action_receipt",
      "tool_evaluation",
      "workstation_tool_evaluation",
      "request_user_input",
      "typed_failure",
    ]
      .includes(input.terminalArtifactKind) &&
    !receiptSnapshotId
  ) {
    violations.push("receipt_snapshot_missing");
  }
  return {
    schema: HELIX_TERMINAL_PRESENTATION_COVERAGE_AUDIT_SCHEMA,
    turn_id: input.turnId,
    route: input.route,
    terminal_artifact_kind: input.terminalArtifactKind,
    terminal_presenter_used: presenterUsed,
    terminal_presentation_id: presentationId,
    raw_route_text_returned: !presenterUsed || violations.includes("selected_final_answer_not_presented_text"),
    receipt_snapshot_id: receiptSnapshotId,
    distillation_id: distillationId,
    terminal_authority_count: terminalAuthorityCount,
    violations,
    assistant_answer: false,
  };
}
