import {
  HELIX_TERMINAL_PRESENTATION_COVERAGE_AUDIT_SCHEMA,
  type HelixTerminalPresentationCoverageAudit,
} from "@shared/helix-terminal-presentation-coverage";
import { hashHelixTerminalText } from "./turn-terminal-authority";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? value as Record<string, unknown> : null;

const readTerminalAnswerEventText = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const event of [...value].reverse()) {
      const record = readRecord(event);
      if (record?.type === "terminal_answer" || record?.type === "request_user_input") {
        return readString(record.text);
      }
    }
    return null;
  }
  return (
    readString(readRecord(readRecord(value)?.terminal_answer)?.text) ??
    readString(readRecord(readRecord(value)?.request_user_input)?.text)
  );
};

const readVisibleAnswerText = (payload: Record<string, unknown>): string | null =>
  readString(payload.answer) ??
  readString(payload.text) ??
  readString(payload.finalAnswer) ??
  readString(payload.content);

const hashOrNull = (value: string | null): string | null =>
  value === null ? null : hashHelixTerminalText(value);

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
  const selectedFinalAnswer = readString(input.payload.selected_final_answer);
  const authorityText = readString(terminalAuthority?.terminal_text_preview);
  const typedFailurePayload = readRecord(input.payload.typed_failure);
  const typedFailureText =
    readString(input.payload.terminal_failure_text) ??
    readString(typedFailurePayload?.message);
  const terminalEventText =
    readTerminalAnswerEventText(input.payload.current_turn_events) ??
    readTerminalAnswerEventText(input.payload.turn_events);
  const visibleAnswerText = readVisibleAnswerText(input.payload);
  const terminalIsTypedFailure = input.terminalArtifactKind === "typed_failure";
  const terminalIsToolReceipt = input.terminalArtifactKind === "tool_receipt";
  const canonicalText = terminalIsTypedFailure
    ? authorityText ?? typedFailureText ?? selectedFinalAnswer ?? input.selectedFinalAnswer.trim()
    : presentationText ?? selectedFinalAnswer ?? input.selectedFinalAnswer.trim();
  const violations: string[] = [];
  if (!presenterUsed) violations.push("terminal_presenter_missing");
  if (terminalAuthorityCount !== 1 || (terminalAuthority?.server_authoritative !== true && !terminalIsToolReceipt)) {
    violations.push("terminal_authority_missing");
  }
  if (poisonAudit?.schema !== "helix.turn_poison_audit.v1" || poisonAudit.ok !== true) {
    violations.push("poison_audit_missing_or_failed");
  }
  if (selectedFinalAnswer !== canonicalText) {
    violations.push("selected_final_answer_not_presented_text");
  }
  if (terminalIsTypedFailure && presentationText && presentationText !== canonicalText) {
    violations.push("terminal_presentation_not_authority_text");
  }
  if (authorityText !== canonicalText) {
    violations.push("terminal_authority_not_presented_text");
  }
  if (terminalEventText !== canonicalText) {
    violations.push("terminal_event_not_presented_text");
  }
  if (visibleAnswerText !== canonicalText) {
    violations.push("visible_answer_not_presented_text");
  }
  const routeContract = readRecord(input.payload.route_product_contract);
  const forbiddenKinds = Array.isArray(routeContract?.forbidden_terminal_artifact_kinds)
    ? routeContract.forbidden_terminal_artifact_kinds
    : [];
  const selectionGuard = readRecord(input.payload.terminal_artifact_selection_guard);
  const productAuthorityGuard = readRecord(input.payload.product_authority_guard);
  if (
    forbiddenKinds.includes(input.terminalArtifactKind) ||
    selectionGuard?.allowed === false ||
    productAuthorityGuard?.allowed === false
  ) {
    violations.push("terminal_artifact_forbidden_by_route_contract");
  }
  if (input.terminalArtifactKind === "typed_failure" && terminalAuthorityCount !== 1) {
    violations.push("typed_failure_missing_terminal_authority");
  }
  if (input.terminalArtifactKind === "request_user_input" && terminalAuthorityCount !== 1) {
    violations.push("request_user_input_missing_terminal_authority");
  }
  if (
    [
      "live_pipeline_receipt",
      "live_answer_environment_receipt",
      "workspace_action_receipt",
      "tool_evaluation",
      "workstation_tool_evaluation",
      "tool_receipt",
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
    raw_route_text_returned: !presenterUsed || violations.some((violation) => violation.endsWith("_not_presented_text")),
    receipt_snapshot_id: receiptSnapshotId,
    distillation_id: distillationId,
    terminal_authority_count: terminalAuthorityCount,
    canonical_terminal_text_hash: hashOrNull(canonicalText),
    selected_final_answer_hash: hashOrNull(selectedFinalAnswer),
    presentation_text_hash: hashOrNull(presentationText),
    authority_text_hash: hashOrNull(authorityText),
    terminal_event_text_hash: hashOrNull(terminalEventText),
    visible_answer_hash: hashOrNull(visibleAnswerText),
    authority_origin: readString(terminalAuthority?.authority_origin),
    violations,
    assistant_answer: false,
  };
}
