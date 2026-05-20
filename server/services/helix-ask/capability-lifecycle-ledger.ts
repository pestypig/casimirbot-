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

const isReceiptKind = (kind: string): boolean => /receipt|tool_evaluation|workstation_tool_evaluation/i.test(kind);

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
  const required = readString(input.plan?.required_terminal_kind) || readString(goal?.required_terminal_kind);
  return Boolean(required && required === terminalKind);
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
  const dispatched = actionRefs.length > 0;
  const admitted = Boolean(plan && (plan.admission_status === "admitted" || plan.admission_status === "needs_evidence"));
  const resultObserved = Boolean(result) || (Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const validated =
    Boolean(result && (result.status === "succeeded" || result.status === "not_run" || (result.status === "partial" && result.evidence_refs.length > 0))) ||
    (!result && Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const reentered =
    Boolean(result?.reentered_solver) ||
    (!result && Boolean(plan) && hasExplicitNotRunReason(plan, result));
  const terminalAllowed = terminalReceiptAllowed({
    terminalArtifactKind: input.terminalArtifactKind,
    plan,
    payload: input.payload,
  });

  const failureCodes: HelixCapabilityLifecycleFailureCode[] = [];
  if (dispatched && !plan) failureCodes.push("capability_dispatched_without_admission");
  if (dispatched && plan && !admitted) failureCodes.push("capability_dispatched_without_admission");
  if (plan?.mutating && plan.operator_command_required && !plan.operator_command_present) failureCodes.push("mutating_capability_without_operator_command");
  if (plan && !resultObserved) failureCodes.push("capability_result_missing");
  if (result && !validated) failureCodes.push("capability_result_unvalidated");
  if (result && (result.receipt_refs.length > 0 || result.evidence_refs.length > 0) && !result.reentered_solver) {
    failureCodes.push("capability_result_not_reentered");
  }
  if (!terminalAllowed) failureCodes.push("capability_receipt_terminal_without_goal");

  const stages: HelixCapabilityLifecycleStage[] = [
    stage("planned", plan ? "succeeded" : dispatched ? "failed" : "skipped", planId ? [planId] : [], plan ? "capability_plan_present" : dispatched ? "action_observed_without_capability_plan" : "no_capability_required"),
    stage("admitted", admitted ? "succeeded" : plan ? "failed" : "skipped", planId ? [planId] : [], admitted ? "capability_admitted_or_needs_evidence" : plan ? plan.rejection_reason ?? "capability_not_admitted" : "no_capability_plan"),
    stage("dispatched", dispatched ? admitted || !plan ? "succeeded" : "failed" : "skipped", actionRefs, dispatched ? "action_or_receipt_observed" : "no_action_dispatched"),
    stage("adapter_acknowledged", dispatched ? receiptAcked(input.payload) ? "succeeded" : "failed" : "skipped", actionRefs, dispatched ? receiptAcked(input.payload) ? "adapter_acknowledgement_observed" : "adapter_acknowledgement_missing" : "no_action_dispatched"),
    stage("result_observed", resultObserved ? "succeeded" : plan ? "failed" : "skipped", resultRefs(result), result ? "capability_result_present" : hasExplicitNotRunReason(plan, result) ? "explicit_not_run_reason_present" : "capability_result_missing"),
    stage("result_validated", validated ? "succeeded" : result ? "failed" : "skipped", resultRefs(result), validated ? "capability_result_validated_or_explicitly_not_run" : "capability_result_unvalidated"),
    stage("reentered_solver", reentered ? "succeeded" : result ? "failed" : "skipped", resultRefs(result), reentered ? "capability_result_reentered_solver_or_not_run" : "capability_result_not_reentered"),
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
