type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export type HelixRouteLabelConsistencyAudit = {
  schema: "helix.route_label_consistency_audit.v1";
  turn_id: string;
  route_label: string | null;
  selected_terminal_kind: string | null;
  solver_decision: string | null;
  goal_satisfaction: string | null;
  stale_route_label_detected: boolean;
  route_label_superseded: boolean;
  superseded_by: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

export function buildHelixRouteLabelConsistencyAudit(input: {
  turnId: string;
  payload: RecordLike;
}): HelixRouteLabelConsistencyAudit {
  const routeLabel = readString(input.payload.route_reason_code) ?? readString(input.payload.route);
  const terminalAuthority = readRecord(input.payload.terminal_answer_authority);
  const terminalWriter = readRecord(input.payload.terminal_authority_single_writer);
  const terminalArtifactKind =
    readString(input.payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind) ??
    readString(terminalWriter?.selected_terminal_artifact_kind);
  const solver = readRecord(input.payload.solver_controller_decision);
  const goal = readRecord(input.payload.goal_satisfaction_evaluation);
  const solverDecision = readString(solver?.decision);
  const goalSatisfaction = readString(goal?.satisfaction);
  const finalAnswerSource = readString(input.payload.final_answer_source);
  const terminalIsAnswer =
    terminalArtifactKind === "direct_answer_text" ||
    terminalArtifactKind === "model_synthesized_answer" ||
    terminalArtifactKind === "repo_code_evidence_answer" ||
    finalAnswerSource === "model_direct_answer" ||
    finalAnswerSource === "final_answer_draft";
  const staleRouteLabelDetected = Boolean(
    routeLabel === "clarify:missing_args" &&
      terminalIsAnswer &&
      solverDecision === "allow_terminal" &&
      goalSatisfaction === "satisfied" &&
      terminalArtifactKind !== "request_user_input",
  );

  return {
    schema: "helix.route_label_consistency_audit.v1",
    turn_id: input.turnId,
    route_label: routeLabel,
    selected_terminal_kind: terminalArtifactKind,
    solver_decision: solverDecision,
    goal_satisfaction: goalSatisfaction,
    stale_route_label_detected: staleRouteLabelDetected,
    route_label_superseded: staleRouteLabelDetected,
    superseded_by: staleRouteLabelDetected
      ? `terminal_artifact_selected:${terminalArtifactKind ?? finalAnswerSource ?? "unknown"}`
      : null,
    assistant_answer: false,
    raw_content_included: false,
  };
}
