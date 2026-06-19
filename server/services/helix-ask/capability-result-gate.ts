import type { HelixCapabilityPlan } from "@shared/helix-capability-plan";
import {
  HELIX_CAPABILITY_RESULT_SCHEMA,
  type HelixCapabilityResult,
  type HelixCapabilityResultStatus,
} from "@shared/helix-capability-result";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => String(value ?? "").trim()).filter(Boolean)));

export const capabilityPlanId = (plan: HelixCapabilityPlan): string =>
  `capability_plan:${plan.turn_id}:${plan.capability_family}:${plan.requested_action}`;

const isReceiptKind = (kind: string): boolean => /receipt|tool_evaluation|workstation_tool_evaluation/i.test(kind);

const isEvidenceKind = (kind: string): boolean =>
  /^(?:workspace_directory_resolution|doc_search_results|doc_candidate_validation|doc_location_matches|doc_evidence_location|doc_location_result|doc_equation_context|situation_context_pack|procedure_epoch_replay|visual_scene_comparison_result|repo_code_evidence_answer|scholarly_research_observation|scholarly_full_text_observation|scholarly_research_answer|internet_search_observation|internet_search_answer|process_graph_overview|source_binding_status|source_binding_repair_candidate|capability_registry|capability_help_summary|reasoning_context|validation)$/.test(kind);

const collectRefs = (artifacts: RecordLike[]): { receiptRefs: string[]; evidenceRefs: string[] } => {
  const receiptRefs: string[] = [];
  const evidenceRefs: string[] = [];
  for (const artifact of artifacts) {
    const kind = readString(artifact.kind);
    const artifactId = readString(artifact.artifact_id);
    const payload = readRecord(artifact.payload);
    const payloadRefs = unique([
      readString(payload?.receipt_id),
      readString(payload?.result_id),
      readString(payload?.selection_id),
      readString(payload?.context_id),
      readString(payload?.evaluation_id),
      ...readStringArray(payload?.evidence_refs),
    ]);
    if (isReceiptKind(kind)) {
      receiptRefs.push(artifactId, ...payloadRefs);
      continue;
    }
    if (isEvidenceKind(kind)) {
      evidenceRefs.push(artifactId, ...payloadRefs);
    }
  }
  return {
    receiptRefs: unique(receiptRefs),
    evidenceRefs: unique(evidenceRefs),
  };
};

const resultStatus = (input: {
  plan: HelixCapabilityPlan;
  receiptRefs: string[];
  evidenceRefs: string[];
  selectedForAnswer: boolean;
  failureReason?: string;
}): HelixCapabilityResultStatus => {
  if (input.plan.admission_status === "rejected" || input.plan.admission_status === "needs_user_confirmation") return "not_run";
  if (input.failureReason) return "failed";
  if (input.receiptRefs.length === 0 && input.evidenceRefs.length === 0) return "not_run";
  if (input.plan.admission_status === "needs_evidence" && input.evidenceRefs.length === 0) return "partial";
  if (!input.selectedForAnswer && input.receiptRefs.length > 0) return "partial";
  return "succeeded";
};

export const buildCapabilityResultGate = (input: {
  plan: HelixCapabilityPlan;
  currentTurnArtifacts?: RecordLike[];
  terminalArtifactKind?: string | null;
  terminalArtifactId?: string | null;
  reenteredRefs?: string[];
  explicitEvidenceRefs?: string[];
  explicitReceiptRefs?: string[];
}): HelixCapabilityResult => {
  const collected = collectRefs(input.currentTurnArtifacts ?? []);
  const receiptRefs = unique([
    ...collected.receiptRefs,
    ...(input.explicitReceiptRefs ?? []),
  ]);
  const evidenceRefs = unique([
    ...collected.evidenceRefs,
    ...(input.explicitEvidenceRefs ?? []),
  ]);
  const terminalKind = readString(input.terminalArtifactKind);
  const terminalArtifactId = readString(input.terminalArtifactId);
  const terminalIsReceipt = isReceiptKind(terminalKind);
  const calculatorToolTerminalAllowed =
    input.plan.source_target === "calculator_stream" &&
    ["workspace_action_receipt", "calculator_receipt", "tool_evaluation", "workstation_tool_evaluation"].includes(terminalKind);
  const receiptTerminalAllowed =
    !terminalIsReceipt ||
    calculatorToolTerminalAllowed ||
    (input.plan.required_terminal_kind !== null && input.plan.required_terminal_kind === terminalKind);
  const selectedForAnswer =
    Boolean(terminalKind) &&
    (
      evidenceRefs.includes(terminalArtifactId) ||
      receiptRefs.includes(terminalArtifactId) ||
      evidenceRefs.some((ref: string) => ref.includes(terminalKind)) ||
      receiptRefs.some((ref: string) => ref.includes(terminalKind)) ||
      (!terminalIsReceipt && evidenceRefs.length > 0)
    ) &&
    receiptTerminalAllowed;
  const reenteredSet = new Set(input.reenteredRefs ?? []);
  const refsToReenter = selectedForAnswer ? unique([terminalArtifactId, ...receiptRefs, ...evidenceRefs]) : unique([...receiptRefs, ...evidenceRefs]);
  const reenteredSolver = refsToReenter.length > 0 && refsToReenter.some((ref: string) => reenteredSet.has(ref));
  const failureReason =
    terminalIsReceipt && !receiptTerminalAllowed
      ? "receipt_terminal_without_goal_authority"
      : input.plan.admission_status === "rejected"
        ? input.plan.rejection_reason ?? "capability_plan_rejected"
        : undefined;
  const status = resultStatus({
    plan: input.plan,
    receiptRefs,
    evidenceRefs,
    selectedForAnswer,
    failureReason,
  });
  return {
    schema: HELIX_CAPABILITY_RESULT_SCHEMA,
    turn_id: input.plan.turn_id,
    capability_plan_id: capabilityPlanId(input.plan),
    status,
    receipt_refs: receiptRefs,
    evidence_refs: evidenceRefs,
    selected_for_answer: selectedForAnswer,
    reentered_solver: reenteredSolver,
    ...(failureReason ? { failure_reason: failureReason } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
};
