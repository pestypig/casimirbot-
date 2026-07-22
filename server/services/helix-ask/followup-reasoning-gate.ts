import type { HelixIntentKind } from "./intent-hypothesis";

export type HelixFollowupReasoningReason =
  | "visual_content_requires_post_evidence_reasoning"
  | "repo_evidence_requires_post_evidence_reasoning"
  | "debug_diagnosis_requires_post_evidence_reasoning"
  | "procedure_memory_requires_post_evidence_reasoning"
  | "mixed_intent_requires_post_evidence_reasoning"
  | "conflicting_hypotheses_require_reasoning"
  | "route_terminal_product_does_not_require_followup"
  | "pure_control_receipt"
  | "pure_status_receipt"
  | "simple_no_source_turn";

export type HelixFollowupReasoningGate = {
  schema: "helix.followup_reasoning_gate.v1";
  turn_id: string;
  required: boolean;
  completed: boolean;
  skipped_reason?: string;
  reason: HelixFollowupReasoningReason;
  assistant_answer: false;
  raw_content_included: false;
};

const isReceiptKind = (value: string): boolean =>
  /receipt|tool_evaluation|workstation_tool_evaluation/i.test(value);

const reasonFor = (input: {
  primaryIntent: HelixIntentKind;
  secondaryIntentKinds: HelixIntentKind[];
  sourceTarget: string;
  terminalArtifactKind: string;
  selectedEvidenceCount: number;
  conflictingHypotheses: boolean;
}): HelixFollowupReasoningReason => {
  const onlyAcceptanceStatusSecondary =
    input.secondaryIntentKinds.length === 0 ||
    input.secondaryIntentKinds.every((kind) => kind === "status_question");
  if (input.primaryIntent === "control_command" && isReceiptKind(input.terminalArtifactKind) && onlyAcceptanceStatusSecondary) {
    return "pure_control_receipt";
  }
  if (input.primaryIntent === "status_question" && isReceiptKind(input.terminalArtifactKind) && input.secondaryIntentKinds.length === 0) {
    return "pure_status_receipt";
  }
  if (
    /active_doc|docs_viewer/i.test(input.sourceTarget) &&
    /active_doc_identity|doc_open_receipt|typed_failure/i.test(input.terminalArtifactKind)
  ) {
    return "simple_no_source_turn";
  }
  if (input.primaryIntent === "content_question" || /visual_capture|visual_scene/i.test(input.sourceTarget)) {
    return "visual_content_requires_post_evidence_reasoning";
  }
  if (
    input.primaryIntent === "repo_evidence_question" ||
    input.primaryIntent === "implementation_question" ||
    /repo_code/i.test(input.sourceTarget) ||
    /repo_code_evidence_answer|repo_entity_definition/i.test(input.terminalArtifactKind)
  ) {
    return "repo_evidence_requires_post_evidence_reasoning";
  }
  if (input.primaryIntent === "debug_diagnosis" || /runtime_evidence/i.test(input.sourceTarget)) {
    return "debug_diagnosis_requires_post_evidence_reasoning";
  }
  if (input.primaryIntent === "procedure_memory_question" || /procedure_memory|situation_epoch/i.test(input.sourceTarget)) {
    return "procedure_memory_requires_post_evidence_reasoning";
  }
  if (input.conflictingHypotheses) return "conflicting_hypotheses_require_reasoning";
  if (input.secondaryIntentKinds.length > 0) return "mixed_intent_requires_post_evidence_reasoning";
  return input.selectedEvidenceCount > 0
    ? "conflicting_hypotheses_require_reasoning"
    : "simple_no_source_turn";
};

export function buildFollowupReasoningGate(input: {
  turnId: string;
  primaryIntent: HelixIntentKind;
  secondaryIntentKinds: HelixIntentKind[];
  sourceTarget: string;
  terminalArtifactKind: string;
  selectedEvidenceCount: number;
  conflictingHypotheses?: boolean;
  finalArbitrationRan: boolean;
  postEvidenceReasoningCompleted?: boolean;
  routeFollowupReasoningRequired?: boolean;
}): HelixFollowupReasoningGate {
  const reason = reasonFor({
    primaryIntent: input.primaryIntent,
    secondaryIntentKinds: input.secondaryIntentKinds,
    sourceTarget: input.sourceTarget,
    terminalArtifactKind: input.terminalArtifactKind,
    selectedEvidenceCount: input.selectedEvidenceCount,
    conflictingHypotheses: input.conflictingHypotheses === true,
  });
  if (input.routeFollowupReasoningRequired === false) {
    return {
      schema: "helix.followup_reasoning_gate.v1",
      turn_id: input.turnId,
      required: false,
      completed: true,
      reason: "route_terminal_product_does_not_require_followup",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const maySkip = reason === "pure_control_receipt" || reason === "pure_status_receipt" || reason === "simple_no_source_turn";
  const required = !maySkip;
  const completed = required
    ? input.postEvidenceReasoningCompleted ?? input.finalArbitrationRan
    : true;

  return {
    schema: "helix.followup_reasoning_gate.v1",
    turn_id: input.turnId,
    required,
    completed,
    ...(completed ? {} : { skipped_reason: "post_evidence_reasoning_missing_before_terminal_selection" }),
    reason,
    assistant_answer: false,
    raw_content_included: false,
  };
}
