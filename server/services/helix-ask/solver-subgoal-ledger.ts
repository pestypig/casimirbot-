import {
  HELIX_SOLVER_SUBGOAL_LEDGER_SCHEMA,
  HELIX_SOLVER_SUBGOAL_SCHEMA,
  type HelixSolverSubgoal,
  type HelixSolverSubgoalEvaluation,
  type HelixSolverSubgoalKind,
  type HelixSolverSubgoalLedger,
  type HelixSolverSubgoalStatus,
} from "@shared/helix-solver-subgoal";
import { resolveHelixRuntimeObservationReentry } from "./runtime/turn-lifecycle";

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

const lower = (value: string): string => value.toLowerCase();

const makeEval = (ok: boolean, reasons: string[], missing: string[] = []): HelixSolverSubgoalEvaluation => ({
  ok,
  reasons,
  missing,
  retry_recommended: !ok && missing.length > 0,
});

const statusFromEval = (evaluation: HelixSolverSubgoalEvaluation, skipped = false): HelixSolverSubgoalStatus =>
  skipped ? "skipped" : evaluation.ok ? "succeeded" : evaluation.missing.length > 0 ? "blocked" : "failed";

const payloadArtifacts = (payload: RecordLike): RecordLike[] =>
  Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger.map((entry: unknown) => readRecord(entry)).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const collectPayloadRefs = (value: unknown): string[] => {
  const record = readRecord(value);
  if (!record) return [];
  return unique([
    readString(record.artifact_id),
    readString(record.item_id),
    readString(record.receipt_id),
    readString(record.result_id),
    readString(record.selection_id),
    readString(record.context_id),
    readString(record.evaluation_id),
    ...readStringArray(record.evidence_refs),
    ...readStringArray(record.selected_current_refs),
    ...readStringArray(record.selected_prior_refs),
    ...readStringArray(record.selected_epoch_refs),
    ...readStringArray(record.selected_field_evaluation_refs),
    ...readStringArray(record.selected_interpretation_refs),
    ...readStringArray(record.selected_probe_refs),
    ...readStringArray(record.receipt_refs),
  ]);
};

const collectEvidenceRefs = (payload: RecordLike): string[] => {
  const loopTrace = readRecord(payload.loop_parity_trace);
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const evidenceGate = readRecord(solverTrace?.evidence_reentry_gate);
  const retrievalResult = readRecord(payload.procedure_evidence_retrieval_result);
  const capabilityResult = readRecord(payload.capability_result);
  return unique([
    ...readStringArray(loopTrace?.evidence_selected_for_answer),
    ...readStringArray(evidenceGate?.selected_evidence_refs),
    ...readStringArray(retrievalResult?.selected_current_refs),
    ...readStringArray(retrievalResult?.selected_prior_refs),
    ...readStringArray(retrievalResult?.selected_epoch_refs),
    ...readStringArray(retrievalResult?.selected_field_evaluation_refs),
    ...readStringArray(retrievalResult?.selected_interpretation_refs),
    ...readStringArray(retrievalResult?.selected_probe_refs),
    ...readStringArray(capabilityResult?.evidence_refs),
  ]);
};

const collectCapabilityPlanRefs = (payload: RecordLike): string[] => {
  const plan = readRecord(payload.capability_plan);
  return plan?.schema === "helix.capability_plan.v1"
    ? unique([readString(plan.item_id), `capability_plan:${readString(plan.turn_id)}:${readString(plan.capability_family)}:${readString(plan.requested_action)}`])
    : [];
};

const collectCapabilityResultRefs = (payload: RecordLike): string[] => {
  const result = readRecord(payload.capability_result);
  return result?.schema === "helix.capability_result.v1"
    ? unique([readString(result.capability_plan_id), ...readStringArray(result.receipt_refs), ...readStringArray(result.evidence_refs)])
    : [];
};

const collectRetrievalResultRefs = (payload: RecordLike): string[] => {
  const result = readRecord(payload.procedure_evidence_retrieval_result);
  return result?.schema === "helix.procedure_evidence_retrieval_result.v1"
    ? unique([readString(result.retrieval_plan_id), ...collectPayloadRefs(result)])
    : [];
};

const isComparisonPrompt = (prompt: string, payload: RecordLike): boolean => {
  const plan = readRecord(payload.procedure_evidence_retrieval_plan);
  return /\b(?:compare|changed|difference|since|previous|last epochs?|prior)\b/i.test(prompt) ||
    readString(plan?.task) === "comparison" ||
    readString(plan?.compare_against).length > 0;
};

const isDebugPrompt = (prompt: string, payload: RecordLike): boolean => {
  const plan = readRecord(payload.procedure_evidence_retrieval_plan);
  return /\b(?:why|debug|diagnos|trace|authority|failed|failure|last turn|tool call|set_rate)\b/i.test(prompt) ||
    readString(plan?.task) === "debug_diagnosis";
};

const typedMissingPriorFailure = (payload: RecordLike): boolean => {
  const typedFailure = readRecord(payload.typed_failure);
  const terminalCode = lower(readString(payload.terminal_error_code) || readString(typedFailure?.error_code));
  const terminalText = lower(readString(payload.terminal_failure_text) || readString(typedFailure?.text) || readString(typedFailure?.answer_text));
  return /missing[_ -]?prior|prior[_ -]?evidence|no[_ -]?prior|previous[_ -]?epoch/.test(`${terminalCode} ${terminalText}`);
};

const findDocPath = (payload: RecordLike, keys: string[]): string => {
  const haystack: unknown[] = [
    payload,
    readRecord(payload.workspace_snapshot),
    readRecord(payload.workspace_context_snapshot),
    readRecord(readRecord(payload.ask_turn_preflight_context)?.workspace_snapshot),
    ...payloadArtifacts(payload).map((artifact) => readRecord(artifact.payload)),
  ];
  for (const record of haystack) {
    const candidate = readRecord(record);
    if (!candidate) continue;
    for (const key of keys) {
      const path = readString(candidate[key]);
      if (path) return path;
    }
  }
  return "";
};

const evaluateRetrieveEvidence = (payload: RecordLike, prompt: string): HelixSolverSubgoalEvaluation => {
  const retrievalResult = readRecord(payload.procedure_evidence_retrieval_result);
  if (isComparisonPrompt(prompt, payload)) {
    const currentRefs = readStringArray(retrievalResult?.selected_current_refs);
    const priorRefs = unique([
      ...readStringArray(retrievalResult?.selected_prior_refs),
      ...readStringArray(retrievalResult?.selected_epoch_refs),
    ]);
    const ok = currentRefs.length > 0 && (priorRefs.length > 0 || typedMissingPriorFailure(payload));
    return makeEval(
      ok,
      ok ? ["comparison_retrieval_has_current_and_prior_or_missing_prior_failure"] : ["comparison_retrieval_incomplete"],
      [
        ...(currentRefs.length === 0 ? ["selected_current_refs"] : []),
        ...(priorRefs.length === 0 && !typedMissingPriorFailure(payload) ? ["selected_prior_refs_or_typed_missing_prior_failure"] : []),
      ],
    );
  }
  const evidenceRefs = collectEvidenceRefs(payload);
  return makeEval(evidenceRefs.length > 0, evidenceRefs.length > 0 ? ["evidence_refs_available"] : ["evidence_missing"], evidenceRefs.length > 0 ? [] : ["evidence_refs"]);
};

const evaluateCapability = (payload: RecordLike, prompt: string, turnId: string): HelixSolverSubgoalEvaluation => {
  const plan = readRecord(payload.capability_plan);
  const result = readRecord(payload.capability_result);
  const family = readString(plan?.capability_family);
  const action = readString(plan?.requested_action);
  if (family === "docs" || /\b(?:open|show|pull up|bring up)\b[\s\S]{0,80}\b(?:doc|docs|paper|whitepaper|white paper)\b/i.test(prompt)) {
    const selectedPath = findDocPath(payload, ["selected_doc_path", "candidate_path", "doc_path", "source_path", "path"]);
    const openedPath = findDocPath(payload, ["opened_path", "activeDocPath", "docContextPath", "active_doc_path"]);
    const ok = Boolean(selectedPath && openedPath && selectedPath === openedPath);
    return makeEval(
      ok,
      ok ? ["selected_doc_candidate_matches_opened_path"] : ["doc_candidate_open_path_mismatch_or_missing"],
      [
        ...(selectedPath ? [] : ["selected_doc_candidate_path"]),
        ...(openedPath ? [] : ["opened_doc_path"]),
        ...(selectedPath && openedPath && selectedPath !== openedPath ? ["matching_doc_paths"] : []),
      ],
    );
  }
  if (family === "workstation_action" || action === "click_or_activate_control" || /\b(?:click|press|tap)\b/i.test(prompt)) {
    const receiptRefs = readStringArray(result?.receipt_refs);
    const receiptText = JSON.stringify(payloadArtifacts(payload).map((artifact) => readRecord(artifact.payload)));
    const ok = receiptRefs.length > 0 && /\b(?:accepted|completed|succeeded|success)\b/i.test(receiptText);
    return makeEval(ok, ok ? ["action_receipt_confirmed_accepted_or_completed"] : ["action_receipt_missing_acceptance"], ok ? [] : ["accepted_or_completed_action_receipt"]);
  }
  const reentry = resolveHelixRuntimeObservationReentry({
    payload,
    turnId,
    candidateRefs: unique([
      ...readStringArray(result?.receipt_refs),
      ...readStringArray(result?.evidence_refs),
    ]),
    compatibilityProjected: result?.reentered_solver === true,
  });
  const ok = readString(result?.status) === "succeeded" && reentry.reentered;
  return makeEval(ok, ok ? ["capability_result_succeeded_and_reentered"] : ["capability_result_missing_or_not_reentered"], ok ? [] : ["capability_result_reentered_solver"]);
};

const evaluateDebugDiagnosis = (payload: RecordLike): HelixSolverSubgoalEvaluation => {
  const retrievalResult = readRecord(payload.procedure_evidence_retrieval_result);
  const selectedRefs = collectEvidenceRefs(payload);
  const uncertainty = Array.isArray(retrievalResult?.uncertainty) ? retrievalResult.uncertainty : [];
  const citedDebugFields =
    /terminal_authority|route_authority|solver|poison|debug|tool|set_rate|failure/i.test(JSON.stringify({
      selected_current_refs: readStringArray(retrievalResult?.selected_current_refs),
      selected_prior_refs: readStringArray(retrievalResult?.selected_prior_refs),
      changed_facts: Array.isArray(retrievalResult?.changed_facts) ? retrievalResult.changed_facts : [],
      stable_facts: Array.isArray(retrievalResult?.stable_facts) ? retrievalResult.stable_facts : [],
    })) ||
    selectedRefs.some((ref) => /debug|terminal|authority|solver|tool|set_rate/i.test(ref));
  const missingEvidenceStated = uncertainty.length > 0 || Boolean(readRecord(payload.typed_failure));
  const ok = citedDebugFields || missingEvidenceStated;
  return makeEval(ok, ok ? ["debug_fields_cited_or_missing_evidence_stated"] : ["debug_diagnosis_without_debug_evidence"], ok ? [] : ["debug_field_refs_or_missing_evidence_statement"]);
};

const evaluateTerminalAuthority = (payload: RecordLike): HelixSolverSubgoalEvaluation => {
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const routeAuthority = readRecord(payload.route_authority_audit);
  const artifactAudit = readRecord(payload.solver_artifact_reentry_audit);
  const ok =
    terminalAuthority?.server_authoritative === true &&
    routeAuthority?.route_authority_ok !== false &&
    artifactAudit?.ok !== false;
  return makeEval(ok, ok ? ["terminal_route_and_artifact_authority_ok"] : ["terminal_authority_or_artifact_audit_failed"], ok ? [] : ["terminal_authority_route_authority_solver_artifact_audit"]);
};

const buildSubgoal = (input: {
  turnId: string;
  kind: HelixSolverSubgoalKind;
  successCriteria: string[];
  evaluation: HelixSolverSubgoalEvaluation;
  evidenceRefs: string[];
  capabilityPlanRefs: string[];
  capabilityResultRefs: string[];
  retrievalResultRefs: string[];
  skipped?: boolean;
}): HelixSolverSubgoal => ({
  schema: HELIX_SOLVER_SUBGOAL_SCHEMA,
  subgoal_id: `${input.turnId}:solver_subgoal:${input.kind}`,
  turn_id: input.turnId,
  kind: input.kind,
  status: statusFromEval(input.evaluation, input.skipped),
  success_criteria: input.successCriteria,
  evidence_refs: input.evidenceRefs,
  capability_plan_refs: input.capabilityPlanRefs,
  capability_result_refs: input.capabilityResultRefs,
  retrieval_result_refs: input.retrievalResultRefs,
  evaluation: input.evaluation,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildSolverSubgoalLedger = (input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
}): HelixSolverSubgoalLedger => {
  const evidenceRefs = collectEvidenceRefs(input.payload);
  const capabilityPlanRefs = collectCapabilityPlanRefs(input.payload);
  const capabilityResultRefs = collectCapabilityResultRefs(input.payload);
  const retrievalResultRefs = collectRetrievalResultRefs(input.payload);
  const subgoals: HelixSolverSubgoal[] = [];
  const add = (kind: HelixSolverSubgoalKind, successCriteria: string[], evaluation: HelixSolverSubgoalEvaluation, skipped = false): void => {
    subgoals.push(buildSubgoal({
      turnId: input.turnId,
      kind,
      successCriteria,
      evaluation,
      evidenceRefs,
      capabilityPlanRefs,
      capabilityResultRefs,
      retrievalResultRefs,
      skipped,
    }));
  };

  add("interpret_prompt", ["prompt interpretation exists"], makeEval(true, ["prompt_interpretation_available"]));
  if (readRecord(input.payload.procedure_evidence_retrieval_plan) || isComparisonPrompt(input.promptText, input.payload)) {
    add("retrieve_evidence", ["required evidence was retrieved or missing evidence was explicitly terminal"], evaluateRetrieveEvidence(input.payload, input.promptText));
  }
  if (readRecord(input.payload.capability_plan) || /\b(?:open|click|press|tap|show|pull up|bring up)\b/i.test(input.promptText)) {
    add("execute_capability", ["capability result proves the requested action completed"], evaluateCapability(input.payload, input.promptText, input.turnId));
  }
  if (isComparisonPrompt(input.promptText, input.payload)) {
    const retrievalEval = evaluateRetrieveEvidence(input.payload, input.promptText);
    add("compare_evidence", ["comparison has current and prior evidence or explicit missing-prior failure"], retrievalEval);
  }
  if (isDebugPrompt(input.promptText, input.payload)) {
    add("diagnose_debug", ["debug fields are cited or missing evidence is stated"], evaluateDebugDiagnosis(input.payload));
  }
  add("verify_result", ["artifact re-entry audit is clean"], makeEval(readRecord(input.payload.solver_artifact_reentry_audit)?.ok !== false, readRecord(input.payload.solver_artifact_reentry_audit)?.ok === false ? ["solver_artifact_reentry_audit_failed"] : ["solver_artifact_reentry_audit_clean"]));
  add("compose_answer", ["terminal presentation or final answer exists"], makeEval(Boolean(readString(input.payload.selected_final_answer) || readRecord(input.payload.terminal_presentation)), ["terminal_text_available"], Boolean(readString(input.payload.selected_final_answer) || readRecord(input.payload.terminal_presentation)) ? [] : ["selected_final_answer_or_terminal_presentation"]));
  add("terminal_authority", ["terminal authority, route authority, and artifact authority agree"], evaluateTerminalAuthority(input.payload));

  const failed = subgoals.filter((subgoal) => subgoal.status === "failed").map((subgoal) => subgoal.subgoal_id);
  const blocked = subgoals.filter((subgoal) => subgoal.status === "blocked").map((subgoal) => subgoal.subgoal_id);
  return {
    schema: HELIX_SOLVER_SUBGOAL_LEDGER_SCHEMA,
    turn_id: input.turnId,
    subgoals,
    ok: failed.length === 0 && blocked.length === 0,
    failed_subgoal_ids: failed,
    blocked_subgoal_ids: blocked,
    assistant_answer: false,
    raw_content_included: false,
  };
};
