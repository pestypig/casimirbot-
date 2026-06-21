import type { HelixCapabilityPlan } from "@shared/helix-capability-plan";
import type { HelixCapabilityResult } from "@shared/helix-capability-result";
import {
  HELIX_CAPABILITY_LIFECYCLE_LEDGER_SCHEMA,
  type HelixCapabilityLifecycleFailureCode,
  type HelixCapabilityLifecycleLedger,
  type HelixCapabilityLifecycleStage,
  type HelixCapabilityLifecycleStageName,
  type HelixCapabilityLifecycleStageStatus,
} from "@shared/helix-capability-lifecycle-ledger";
import { capabilityPlanId } from "./capability-result-gate";
import { evaluateToolFamilyTerminalPolicy, isReceiptTerminalKind } from "./tool-family-terminal-policy";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const isReceiptKind = (kind: string): boolean => isReceiptTerminalKind(kind);

const artifacts = (payload: RecordLike): RecordLike[] =>
  Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger.map((entry: unknown) => readRecord(entry)).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const artifactPayload = (artifact: RecordLike): RecordLike | null => readRecord(artifact.payload);

const receiptArtifacts = (payload: RecordLike): RecordLike[] =>
  artifacts(payload).filter((artifact) => isReceiptKind(readString(artifact.kind)));

const actualToolCalls = (payload: RecordLike): RecordLike[] => {
  const loopTrace = readRecord(payload.loop_parity_trace);
  const calls = Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [];
  return calls.map((entry: unknown) => readRecord(entry)).filter((entry): entry is RecordLike => Boolean(entry));
};

const topLevelReceiptRefs = (payload: RecordLike): string[] => unique([
  ...["workspace_action_receipt", "doc_open_receipt", "live_pipeline_turn_receipt", "live_source_pipeline_receipt"]
    .flatMap((key) => {
      const receipt = readRecord(payload[key]);
      return receipt ? [key, readString(receipt.receipt_id), readString(receipt.action_id)] : [];
    }),
]);

const observedActionRefs = (payload: RecordLike): string[] => unique([
  ...actualToolCalls(payload).map((call) => readString(call.tool_name) || readString(call.name) || readString(call.action_id)),
  ...receiptArtifacts(payload).flatMap((artifact) => [
    readString(artifact.artifact_id),
    readString(artifact.kind),
    readString(artifactPayload(artifact)?.action_id),
    readString(artifactPayload(artifact)?.action_key),
  ]),
  ...topLevelReceiptRefs(payload),
]);

const receiptAcked = (payload: RecordLike): boolean => {
  const haystack = [
    ...receiptArtifacts(payload).map((artifact) => artifactPayload(artifact)),
    readRecord(payload.workspace_action_receipt),
    readRecord(payload.doc_open_receipt),
    readRecord(payload.live_pipeline_turn_receipt),
  ].filter((entry): entry is RecordLike => Boolean(entry));
  return haystack.some((entry) => {
    const text = JSON.stringify(entry).toLowerCase();
    return /\b(?:accepted|completed|succeeded|success|ok|opened)\b/.test(text) || entry.ok === true;
  });
};

const hasSatisfiedWorkstationToolEvaluation = (payload: RecordLike, terminalArtifactKind?: string | null): boolean => {
  const terminalKind = readString(terminalArtifactKind ?? payload.terminal_artifact_kind);
  if (terminalKind !== "workstation_tool_evaluation" && terminalKind !== "tool_evaluation") return false;
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  if (
    readString(goalSatisfaction?.satisfaction) !== "satisfied" ||
    readString(goalSatisfaction?.next_decision) !== "allow_terminal"
  ) {
    return false;
  }
  const terminalContract = readRecord(goalSatisfaction?.terminal_contract);
  const requiredTerminalKinds = readStringArray(terminalContract?.required_terminal_kinds);
  if (requiredTerminalKinds.length > 0 && !requiredTerminalKinds.includes(terminalKind)) return false;
  const observationReview = readRecord(payload.observation_review);
  if (observationReview && observationReview.does_it_satisfy_goal !== true) return false;
  return artifacts(payload).some((artifact) => {
    if (readString(artifact.kind) !== "workstation_tool_evaluation") return false;
    return artifactPayload(artifact)?.supports_goal === true;
  });
};

const goalSatisfied = (payload: RecordLike): boolean | undefined => {
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  if (!goalSatisfaction) return undefined;
  return (
    readString(goalSatisfaction?.satisfaction) === "satisfied" ||
    readString(goalSatisfaction?.next_decision) === "allow_terminal"
  );
};

const stage = (
  stageName: HelixCapabilityLifecycleStageName,
  status: HelixCapabilityLifecycleStageStatus,
  refs: string[],
  reason: string,
): HelixCapabilityLifecycleStage => ({
  stage: stageName,
  status,
  refs: unique(refs),
  reason,
});

const hasExplicitNotRunReason = (plan: HelixCapabilityPlan | null, result: HelixCapabilityResult | null): boolean =>
  Boolean(
    result?.failure_reason ||
    plan?.rejection_reason ||
    plan?.admission_status === "rejected" ||
    plan?.admission_status === "needs_user_confirmation",
  );

const terminalReceiptAllowed = (input: {
  terminalArtifactKind?: string | null;
  plan: HelixCapabilityPlan | null;
  payload: RecordLike;
}): boolean => {
  const terminalKind = readString(input.terminalArtifactKind ?? input.payload.terminal_artifact_kind);
  if (!isReceiptKind(terminalKind)) return true;
  const goal = readRecord(input.payload.canonical_goal_frame);
  const goalKind = readString(goal?.goal_kind);
  const requiredTerminalKind = readString(goal?.required_terminal_kind);
  if (
    terminalKind === "doc_open_receipt" &&
    (goalKind === "doc_open_best" || goalKind === "doc_open") &&
    requiredTerminalKind === "doc_open_receipt" &&
    goalSatisfied(input.payload) === true
  ) {
    input.payload.tool_family_terminal_policy = {
      schema: "helix.tool_family_terminal_policy.v1",
      candidate_artifact_kind: terminalKind,
      allowed: true,
      reason: "doc_open_receipt_matches_doc_open_goal",
      assistant_answer: false,
      raw_content_included: false,
    };
    return true;
  }
  const policy = evaluateToolFamilyTerminalPolicy({
    toolName: input.plan?.requested_action,
    toolFamily: input.plan?.capability_family,
    terminalArtifactKind: terminalKind,
    routeProductContract: readRecord(input.payload.route_product_contract),
    canonicalGoalFrame: goal,
    admitted: Boolean(input.plan && (input.plan.admission_status === "admitted" || input.plan.admission_status === "needs_evidence")),
    goalSatisfied: goalSatisfied(input.payload),
    operatorCommandPresent: input.plan?.operator_command_present,
    mutating: input.plan?.mutating,
  });
  input.payload.tool_family_terminal_policy = policy;
  return policy.allowed;
};

const resultRefs = (result: HelixCapabilityResult | null): string[] =>
  result ? unique([result.capability_plan_id, ...result.receipt_refs, ...result.evidence_refs]) : [];

export const buildCapabilityLifecycleLedger = (input: {
  turnId: string;
  payload: RecordLike;
  terminalArtifactKind?: string | null;
}): HelixCapabilityLifecycleLedger => {
  const planRecord = readRecord(input.payload.capability_plan);
  const resultRecord = readRecord(input.payload.capability_result);
  const plan = planRecord?.schema === "helix.capability_plan.v1" ? (planRecord as unknown as HelixCapabilityPlan) : null;
  const result = resultRecord?.schema === "helix.capability_result.v1" ? (resultRecord as unknown as HelixCapabilityResult) : null;
  const planId = plan ? capabilityPlanId(plan) : null;
  const resultId = result ? result.capability_plan_id : null;
  const actionRefs = observedActionRefs(input.payload);
  const satisfiedWorkstationEvaluation = hasSatisfiedWorkstationToolEvaluation(input.payload, input.terminalArtifactKind);
  const derivedWorkstationRefs = satisfiedWorkstationEvaluation
    ? artifacts(input.payload)
        .filter((artifact) => readString(artifact.kind) === "workstation_tool_evaluation")
        .map((artifact) => readString(artifact.artifact_id))
    : [];
  const dispatched = actionRefs.length > 0;
  const intentionallySuppressed =
    plan?.tool_admission_suppressed === true &&
    plan.requested_action === "suppressed_contextual_tool_reference";
  const admitted =
    satisfiedWorkstationEvaluation ||
    Boolean(plan && (plan.admission_status === "admitted" || plan.admission_status === "needs_evidence"));
  const resultObserved = satisfiedWorkstationEvaluation || Boolean(result) || (Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const validated =
    satisfiedWorkstationEvaluation ||
    Boolean(result && (result.status === "succeeded" || result.status === "not_run" || (result.status === "partial" && result.evidence_refs.length > 0))) ||
    (!result && Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const reentered =
    satisfiedWorkstationEvaluation ||
    Boolean(result?.reentered_solver) ||
    (!result && Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const terminalAllowed = terminalReceiptAllowed({
    terminalArtifactKind: input.terminalArtifactKind,
    plan,
    payload: input.payload,
  });

  const failureCodes: HelixCapabilityLifecycleFailureCode[] = [];
  if (dispatched && !plan && !satisfiedWorkstationEvaluation) failureCodes.push("capability_dispatched_without_admission");
  if (dispatched && plan && !admitted && !intentionallySuppressed) failureCodes.push("capability_dispatched_without_admission");
  if (plan && admitted && !dispatched && !resultObserved) failureCodes.push("capability_admitted_not_dispatched");
  if (plan?.mutating && plan.operator_command_required && !plan.operator_command_present) failureCodes.push("mutating_capability_without_operator_command");
  if (plan && !resultObserved) failureCodes.push("capability_result_missing");
  if (result && !validated) failureCodes.push("capability_result_unvalidated");
  if (result && (result.receipt_refs.length > 0 || result.evidence_refs.length > 0) && !result.reentered_solver) {
    failureCodes.push("capability_result_not_reentered");
  }
  if (!terminalAllowed) failureCodes.push("capability_receipt_terminal_without_goal");

  const stages: HelixCapabilityLifecycleStage[] = [
    stage("planned", plan || satisfiedWorkstationEvaluation ? "succeeded" : dispatched ? "failed" : "skipped", planId ? [planId] : derivedWorkstationRefs, plan ? "capability_plan_present" : satisfiedWorkstationEvaluation ? "workstation_tool_evaluation_present" : dispatched ? "action_observed_without_capability_plan" : "no_capability_required"),
    stage("admitted", admitted ? "succeeded" : plan ? "failed" : "skipped", planId ? [planId] : derivedWorkstationRefs, admitted ? "capability_admitted_or_workstation_goal_satisfied" : plan ? plan.rejection_reason ?? "capability_not_admitted" : "no_capability_plan"),
    stage(
      "dispatched",
      dispatched
        ? admitted || !plan ? "succeeded" : "failed"
        : plan && admitted && !resultObserved ? "failed" : "skipped",
      actionRefs,
      dispatched
        ? "action_or_receipt_observed"
        : plan && admitted && !resultObserved ? "capability_admitted_not_dispatched" : "no_action_dispatched",
    ),
    stage("adapter_acknowledged", dispatched ? receiptAcked(input.payload) ? "succeeded" : "failed" : "skipped", actionRefs, dispatched ? receiptAcked(input.payload) ? "adapter_acknowledgement_observed" : "adapter_acknowledgement_missing" : "no_action_dispatched"),
    stage("result_observed", resultObserved ? "succeeded" : plan ? "failed" : "skipped", resultRefs(result).length ? resultRefs(result) : derivedWorkstationRefs, result ? "capability_result_present" : satisfiedWorkstationEvaluation ? "workstation_tool_evaluation_observed" : hasExplicitNotRunReason(plan, result) ? "explicit_not_run_reason_present" : "capability_result_missing"),
    stage("result_validated", validated ? "succeeded" : result ? "failed" : "skipped", resultRefs(result).length ? resultRefs(result) : derivedWorkstationRefs, validated ? "capability_result_validated_or_workstation_goal_satisfied" : "capability_result_unvalidated"),
    stage("reentered_solver", reentered ? "succeeded" : result ? "failed" : "skipped", resultRefs(result).length ? resultRefs(result) : derivedWorkstationRefs, reentered ? "capability_result_reentered_solver_or_workstation_goal_satisfied" : "capability_result_not_reentered"),
    stage("terminal_considered", terminalAllowed ? "succeeded" : "failed", [readString(input.terminalArtifactKind ?? input.payload.terminal_artifact_kind)], terminalAllowed ? "terminal_receipt_matches_canonical_goal_or_not_receipt" : "terminal_receipt_without_required_goal_kind"),
  ];

  return {
    schema: HELIX_CAPABILITY_LIFECYCLE_LEDGER_SCHEMA,
    turn_id: input.turnId,
    capability_plan_id: planId,
    capability_result_id: resultId,
    stages,
    failure_codes: unique(failureCodes) as HelixCapabilityLifecycleFailureCode[],
    ok: failureCodes.length === 0,
    assistant_answer: false,
    raw_content_included: false,
  };
};
