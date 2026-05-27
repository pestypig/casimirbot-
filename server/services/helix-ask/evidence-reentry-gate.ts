import type { HelixIntentKind } from "./intent-hypothesis";

type RecordLike = Record<string, unknown>;

export type HelixEvidenceReentryViolationCode =
  | "receipt_terminal_without_reentry"
  | "projection_terminal_without_reentry"
  | "tool_result_terminal_without_reentry"
  | "source_observation_terminal_without_selection"
  | "evidence_selected_but_finalizer_missing";

export type HelixEvidenceReentryGate = {
  schema: "helix.evidence_reentry_gate.v1";
  turn_id: string;
  required: boolean;
  completed: boolean;
  selected_evidence_refs: string[];
  rejected_evidence_refs: Array<{ ref: string; reason: string }>;
  receipts_reentered: string[];
  receipts_not_reentered: string[];
  projections_reentered: string[];
  projections_not_reentered: string[];
  violation_codes: HelixEvidenceReentryViolationCode[];
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const isReceiptKind = (value: string): boolean =>
  /receipt|tool_evaluation|workstation_tool_evaluation/i.test(value);

const isProjectionKind = (value: string): boolean =>
  /projection|panel_generated_answer|client_projection|live_card_projection|no_tool_direct/i.test(value);

const readTerminalGoalFrame = (payload: RecordLike): { goalKind: string; requiredTerminalKind: string } => {
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const universalGoalFrame = readRecord(payload.universal_goal_frame);
  const universalUserGoal = readRecord(universalGoalFrame?.user_goal);
  return {
    goalKind:
      readString(canonicalGoalFrame?.goal_kind) ||
      readString(universalGoalFrame?.goal_kind) ||
      readString(universalUserGoal?.goal_kind),
    requiredTerminalKind:
      readString(canonicalGoalFrame?.required_terminal_kind) ||
      readString(universalGoalFrame?.required_terminal_kind) ||
      readString(universalUserGoal?.required_terminal_kind),
  };
};

const receiptTerminalMatchesCanonicalGoal = (payload: RecordLike, terminalArtifactKind: string): boolean => {
  const goalFrame = readTerminalGoalFrame(payload);
  return (
    goalFrame.requiredTerminalKind === terminalArtifactKind &&
    Boolean(goalFrame.goalKind) &&
    !/^(?:unknown|ambiguous)$/i.test(goalFrame.goalKind)
  );
};

const primaryAllowsReceiptTerminal = (
  primaryIntent: HelixIntentKind,
  terminalArtifactKind: string,
  allowedTerminalProducts: string[],
  payload: RecordLike,
): boolean => {
  if (!isReceiptKind(terminalArtifactKind)) return false;
  if (
    (primaryIntent === "control_command" || primaryIntent === "status_question") &&
    allowedTerminalProducts.includes(terminalArtifactKind)
  ) {
    return true;
  }
  if (!receiptTerminalMatchesCanonicalGoal(payload, terminalArtifactKind)) return false;
  return (
    allowedTerminalProducts.includes(terminalArtifactKind) ||
    primaryIntent === "control_command" ||
    primaryIntent === "status_question"
  );
};

const collectRejectedEvidence = (loopTrace: RecordLike | null): Array<{ ref: string; reason: string }> =>
  (Array.isArray(loopTrace?.evidence_rejected_for_answer) ? loopTrace.evidence_rejected_for_answer : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      ref: readString(entry.ref) || "unknown",
      reason: readString(entry.reason) || "rejected",
    }));

const collectActualToolCalls = (loopTrace: RecordLike | null): RecordLike[] =>
  (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));

const collectObservationRefs = (loopTrace: RecordLike | null): string[] =>
  (Array.isArray(loopTrace?.observations_created) ? loopTrace.observations_created : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => readString(entry.observation_id))
    .filter(Boolean);

const collectWorkspaceSourceEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const workspaceSnapshot = readRecord(input.payload.workspace_context_snapshot);
  const activeDocPath =
    readString(workspaceSnapshot?.activeDocPath) ||
    readString(workspaceSnapshot?.docContextPath) ||
    readString(readRecord(input.payload.active_doc_identity)?.path) ||
    readString(readRecord(input.payload.active_doc_identity)?.activeDocPath);
  const terminalUsesActiveDoc =
    /active_doc_identity|doc_summary|doc_open_receipt|doc_location/i.test(input.terminalArtifactKind) ||
    /active_doc_identity|doc_summary|doc_open_receipt|doc_location/i.test(input.finalAnswerSource);
  if (activeDocPath && terminalUsesActiveDoc) {
    return [`workspace_snapshot:active_doc_path:${activeDocPath}`];
  }
  return [];
};

const collectRepoEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesRepoEvidence =
    /repo_code_evidence_answer|repo_entity_definition/i.test(input.terminalArtifactKind) ||
    /repo_code_evidence_answer|repo_entity_definition/i.test(input.finalAnswerSource);
  if (!terminalUsesRepoEvidence) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => readString(entry.kind) === "repo_code_evidence_observation")
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const collectReceiptRefs = (input: {
  payload: RecordLike;
  loopTrace: RecordLike | null;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const refs: string[] = [];
  for (const call of collectActualToolCalls(input.loopTrace)) {
    const toolId = readString(call.tool_id);
    const resultRef = readString(call.result_ref);
    if (resultRef && (isReceiptKind(resultRef) || isReceiptKind(toolId))) refs.push(resultRef);
  }
  for (const key of ["workspace_action_receipt", "live_pipeline_turn_receipt", "live_source_pipeline_receipt", "visual_producer_cadence_receipt"]) {
    const receipt = readRecord(input.payload[key]);
    const ref = readString(receipt?.receipt_id) || readString(receipt?.pipeline_receipt_id);
    if (ref) refs.push(ref);
  }
  if (isReceiptKind(input.terminalArtifactKind)) refs.push(input.terminalArtifactKind);
  if (isReceiptKind(input.finalAnswerSource)) refs.push(input.finalAnswerSource);
  return unique(refs);
};

export function buildEvidenceReentryGate(input: {
  turnId: string;
  payload: RecordLike;
  loopTrace?: RecordLike | null;
  primaryIntent: HelixIntentKind;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  finalArbitrationRan: boolean;
  sourceEvidenceRequired?: boolean;
  allowedTerminalProducts?: string[];
}): HelixEvidenceReentryGate {
  const loopTrace = input.loopTrace ?? null;
  const selectedEvidenceRefs = unique([
    ...readStringArray(loopTrace?.evidence_selected_for_answer),
    ...collectWorkspaceSourceEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectRepoEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
  ]);
  const rejectedEvidenceRefs = collectRejectedEvidence(loopTrace);
  const rejectedRefSet = new Set(rejectedEvidenceRefs.map((entry) => entry.ref));
  const evidenceRefSet = new Set([...selectedEvidenceRefs, ...rejectedEvidenceRefs.map((entry) => entry.ref)]);
  const actualToolCalls = collectActualToolCalls(loopTrace);
  const observationRefs = collectObservationRefs(loopTrace);
  const receiptRefs = collectReceiptRefs({
    payload: input.payload,
    loopTrace,
    terminalArtifactKind: input.terminalArtifactKind,
    finalAnswerSource: input.finalAnswerSource,
  });
  const allowedReceiptTerminal = primaryAllowsReceiptTerminal(
    input.primaryIntent,
    input.terminalArtifactKind,
    input.allowedTerminalProducts ?? [],
    input.payload,
  );
  const receiptsReentered = receiptRefs.filter((ref) =>
    evidenceRefSet.has(ref) ||
    (allowedReceiptTerminal &&
      (ref === input.terminalArtifactKind || ref === input.finalAnswerSource || isReceiptKind(ref)))
  );
  const receiptsNotReentered = receiptRefs.filter((ref) => !receiptsReentered.includes(ref));
  const projectionRefs = unique([
    isProjectionKind(input.terminalArtifactKind) ? input.terminalArtifactKind : "",
    isProjectionKind(input.finalAnswerSource) ? input.finalAnswerSource : "",
  ].filter(Boolean));
  const projectionsReentered = projectionRefs.filter((ref) => evidenceRefSet.has(ref) || rejectedRefSet.has(ref));
  const projectionsNotReentered = projectionRefs.filter((ref) => !projectionsReentered.includes(ref));
  const hasTerminalReceipt = isReceiptKind(input.terminalArtifactKind) || isReceiptKind(input.finalAnswerSource);
  const hasTerminalProjection = isProjectionKind(input.terminalArtifactKind) || isProjectionKind(input.finalAnswerSource);
  const required =
    actualToolCalls.length > 0 ||
    observationRefs.length > 0 ||
    selectedEvidenceRefs.length > 0 ||
    input.sourceEvidenceRequired === true ||
    rejectedEvidenceRefs.length > 0 ||
    receiptRefs.length > 0 ||
    projectionRefs.length > 0 ||
    hasTerminalReceipt ||
    hasTerminalProjection;
  const violationCodes = unique<HelixEvidenceReentryViolationCode>([
    hasTerminalReceipt && (!allowedReceiptTerminal || receiptsNotReentered.length > 0)
      ? "receipt_terminal_without_reentry"
      : "",
    hasTerminalProjection && projectionsNotReentered.length > 0
      ? "projection_terminal_without_reentry"
      : "",
    actualToolCalls.length > 0 && hasTerminalReceipt && receiptsNotReentered.length > 0
      ? "tool_result_terminal_without_reentry"
      : "",
    (observationRefs.length > 0 || input.sourceEvidenceRequired === true) &&
      selectedEvidenceRefs.length === 0 &&
      input.primaryIntent !== "control_command" &&
      input.primaryIntent !== "status_question"
      ? "source_observation_terminal_without_selection"
      : "",
    selectedEvidenceRefs.length > 0 && !input.finalArbitrationRan
      ? "evidence_selected_but_finalizer_missing"
      : "",
  ].filter((entry): entry is HelixEvidenceReentryViolationCode => Boolean(entry)));

  return {
    schema: "helix.evidence_reentry_gate.v1",
    turn_id: input.turnId,
    required,
    completed: violationCodes.length === 0 && (!required || input.finalArbitrationRan || allowedReceiptTerminal),
    selected_evidence_refs: selectedEvidenceRefs,
    rejected_evidence_refs: rejectedEvidenceRefs,
    receipts_reentered: receiptsReentered,
    receipts_not_reentered: receiptsNotReentered,
    projections_reentered: projectionsReentered,
    projections_not_reentered: projectionsNotReentered,
    violation_codes: violationCodes,
    assistant_answer: false,
    raw_content_included: false,
  };
}
