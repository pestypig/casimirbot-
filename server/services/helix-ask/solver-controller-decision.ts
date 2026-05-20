import type { HelixFinalRouteReconciliation } from "@shared/helix-final-route-reconciliation";
import type { HelixSolverControllerBlockingReason, HelixSolverControllerDecision } from "@shared/helix-solver-controller-decision";
import type { HelixTurnIdIntegrityAudit, HelixTurnIdIntegrityViolationCode } from "@shared/helix-turn-id-integrity-audit";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export const normalizeHelixRouteBase = (route: string | null | undefined): string | null => {
  const trimmed = readString(route);
  if (!trimmed) return null;
  if (trimmed === "unknown" || trimmed === "/ask" || trimmed === "/ask/turn") return null;
  return trimmed.split("/")[0]?.trim() || trimmed;
};

const isNonAnswerTerminal = (payload: RecordLike): boolean => {
  const terminalArtifactKind = readString(payload.terminal_artifact_kind);
  const finalAnswerSource = readString(payload.final_answer_source);
  const responseType = readString(payload.response_type);
  const finalStatus = readString(payload.final_status);
  return (
    terminalArtifactKind === "typed_failure" ||
    terminalArtifactKind === "request_user_input" ||
    finalAnswerSource === "typed_failure" ||
    finalAnswerSource === "request_user_input" ||
    responseType === "final_failure" ||
    responseType === "pending_input" ||
    finalStatus === "final_failure" ||
    finalStatus === "pending_input"
  );
};

const pushUnique = <T extends string>(items: T[], item: T): void => {
  if (!items.includes(item)) items.push(item);
};

const hasPromptObjectExtractionProblem = (payload: RecordLike): boolean => {
  const prompt = readString(payload.active_prompt) ?? readString(payload.prompt) ?? readString(payload.question) ?? "";
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const goalKind = readString(canonicalGoal?.goal_kind);
  if (goalKind !== "doc_open_best") return false;
  if (!/\bopen\s+(?:the\s+)?docs?\s+for\s+me\b/i.test(prompt)) return false;
  const stepResults = readArray(payload.step_results);
  const ledger = readArray(payload.current_turn_artifact_ledger);
  const queryValues = [
    ...stepResults.map((entry) => readRecord(readRecord(entry)?.result_artifact)?.query),
    ...ledger.map((entry) => readRecord(readRecord(entry)?.payload)?.query),
  ].map(readString).filter(Boolean);
  return queryValues.some((query) => query?.toLowerCase() === "me");
};

export function buildTurnIdIntegrityAudit(input: {
  turnId: string;
  backendTurnId?: string | null;
  clientTurnId?: string | null;
  payload: RecordLike;
}): HelixTurnIdIntegrityAudit {
  const violations: HelixTurnIdIntegrityAudit["violations"] = [];
  const checkedRefs: string[] = [];

  const check = (code: HelixTurnIdIntegrityViolationCode, ref: string, observed: unknown): void => {
    const observedTurnId = readString(observed);
    if (!observedTurnId) return;
    checkedRefs.push(ref);
    if (observedTurnId !== input.turnId) {
      violations.push({ code, ref, observed_turn_id: observedTurnId, expected_turn_id: input.turnId });
    }
  };

  check("canonical_goal_turn_mismatch", "canonical_goal_frame.turn_id", readRecord(input.payload.canonical_goal_frame)?.turn_id);
  check("solver_trace_turn_mismatch", "ask_turn_solver_trace.turn_id", readRecord(input.payload.ask_turn_solver_trace)?.turn_id);
  check("solver_trace_turn_mismatch", "loop_parity_trace.turn_id", readRecord(input.payload.loop_parity_trace)?.turn_id);
  check("terminal_authority_turn_mismatch", "terminal_answer_authority.turn_id", readRecord(input.payload.terminal_answer_authority)?.turn_id);

  for (const [index, entry] of readArray(input.payload.current_turn_artifact_ledger).entries()) {
    const record = readRecord(entry);
    if (!record) continue;
    const sourceScope = readString(record.source_scope);
    if (sourceScope === "prior_context" || sourceScope === "prior_turn_context" || sourceScope === "prior_artifact") continue;
    check("artifact_ledger_turn_mismatch", `current_turn_artifact_ledger[${index}].turn_id`, record.turn_id);
  }

  for (const [index, entry] of readArray(input.payload.turn_events ?? input.payload.current_turn_events).entries()) {
    const record = readRecord(entry);
    if (!record) continue;
    check("event_turn_mismatch", `current_turn_events[${index}].turn_id`, record.turn_id);
  }

  const backendTurnId = readString(input.backendTurnId);
  if (backendTurnId && backendTurnId !== input.turnId) {
    violations.push({
      code: "client_backend_turn_unmapped",
      ref: "backend_turn_id",
      observed_turn_id: backendTurnId,
      expected_turn_id: input.turnId,
    });
  }

  return {
    schema: "helix.turn_id_integrity_audit.v1",
    turn_id: input.turnId,
    backend_turn_id: backendTurnId,
    client_turn_id: readString(input.clientTurnId),
    ok: violations.length === 0,
    violations,
    checked_refs: checkedRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildFinalRouteReconciliation(input: {
  turnId: string;
  finalRoute?: string | null;
  payload: RecordLike;
}): HelixFinalRouteReconciliation {
  const finalRoute = readString(input.finalRoute) ?? readString(input.payload.route_reason_code) ?? readString(input.payload.route);
  const finalRouteBase = normalizeHelixRouteBase(finalRoute);
  const terminalAuthority = readRecord(input.payload.terminal_answer_authority);
  const terminalAuthorityRoute = readString(terminalAuthority?.route);
  const terminalAuthorityRouteBase = normalizeHelixRouteBase(terminalAuthorityRoute);
  const terminalArtifactKind = readString(input.payload.terminal_artifact_kind) ?? readString(terminalAuthority?.terminal_artifact_kind);
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  const canonicalGoalKind = readString(canonicalGoal?.goal_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const canonicalTerminal =
    Boolean(canonicalGoalKind && requiredTerminalKind && finalRouteBase === canonicalGoalKind && terminalArtifactKind === requiredTerminalKind);
  const routeAuthority = readRecord(input.payload.route_authority_audit);
  const terminalGuard = readRecord(input.payload.terminal_artifact_selection_guard);
  const productGuard = readRecord(input.payload.product_authority_guard);
  const routeMismatch = Boolean(
    finalRouteBase &&
    terminalAuthorityRouteBase &&
    finalRouteBase !== terminalAuthorityRouteBase
  );
  const routeProductRejected =
    !canonicalTerminal &&
    (readBoolean(terminalGuard?.allowed) === false ||
      readBoolean(productGuard?.allowed) === false);

  const violations: HelixFinalRouteReconciliation["violations"] = [];
  if (routeMismatch) {
    violations.push({
      code: "terminal_authority_route_stale",
      summary: `Terminal authority route ${terminalAuthorityRouteBase} does not match final route ${finalRouteBase}.`,
    });
  }
  if (routeProductRejected) {
    violations.push({
      code: "terminal_artifact_forbidden_by_final_route",
      summary: "Terminal artifact was rejected by the route/product authority chain.",
    });
  }

  return {
    schema: "helix.final_route_reconciliation.v1",
    turn_id: input.turnId,
    ok: violations.length === 0,
    final_route: finalRoute,
    final_route_base: finalRouteBase,
    terminal_authority_route: terminalAuthorityRoute,
    terminal_authority_route_base: terminalAuthorityRouteBase,
    selected_terminal_artifact_kind: terminalArtifactKind,
    route_difference_changes_terminal_products: routeMismatch && routeProductRejected,
    violations,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildSolverControllerDecision(input: {
  turnId: string;
  finalRoute?: string | null;
  payload: RecordLike;
  turnIdIntegrityAudit?: HelixTurnIdIntegrityAudit | null;
  finalRouteReconciliation?: HelixFinalRouteReconciliation | null;
}): HelixSolverControllerDecision {
  const payload = input.payload;
  const nonAnswerTerminal = isNonAnswerTerminal(payload);
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const retrievalResult = readRecord(payload.procedure_evidence_retrieval_result ?? solverTrace?.procedure_evidence_retrieval_result);
  const routeAuthority = readRecord(payload.route_authority_audit);
  const poisonAudit = readRecord(payload.poison_audit);
  const liveSourceIdentity = readRecord(payload.live_source_identity_audit ?? solverTrace?.live_source_identity_audit);
  const terminalArtifactKind = readString(payload.terminal_artifact_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const finalRoute = readString(input.finalRoute) ?? readString(payload.route_reason_code) ?? readString(payload.route);
  const finalRouteBase = normalizeHelixRouteBase(finalRoute);
  const canonicalTerminal =
    Boolean(readString(canonicalGoal?.goal_kind) && requiredTerminalKind && finalRouteBase === readString(canonicalGoal?.goal_kind) && terminalArtifactKind === requiredTerminalKind);
  const turnIdIntegrityAudit = input.turnIdIntegrityAudit ?? buildTurnIdIntegrityAudit({ turnId: input.turnId, payload });
  const finalRouteReconciliation = input.finalRouteReconciliation ?? buildFinalRouteReconciliation({ turnId: input.turnId, finalRoute, payload });

  const blockingReasons: HelixSolverControllerBlockingReason[] = [];
  const consumedRefs: string[] = [
    "canonical_goal_frame",
    "terminal_answer_authority",
    "route_authority_audit",
    "poison_audit",
    "ask_turn_solver_trace",
    "turn_id_integrity_audit",
    "final_route_reconciliation",
  ];

  if (!turnIdIntegrityAudit.ok) pushUnique(blockingReasons, "turn_id_integrity_failed");
  if (!finalRouteReconciliation.ok) {
    pushUnique(blockingReasons, "terminal_route_mismatch");
    if (finalRouteReconciliation.violations.some((entry) => entry.code === "terminal_artifact_forbidden_by_final_route")) {
      pushUnique(blockingReasons, "route_product_contract_rejected_terminal");
    }
  }
  const poisonViolations = readArray(poisonAudit?.violations).map((entry) => readString(readRecord(entry)?.kind)).filter(Boolean);
  const poisonFailed = readBoolean(poisonAudit?.ok) === false;
  const staleRouteOnlyPoisonFailure =
    canonicalTerminal &&
    poisonViolations.length > 0 &&
    poisonViolations.every((kind) => kind === "terminal_artifact_forbidden_by_route_contract");
  if (poisonFailed && !staleRouteOnlyPoisonFailure) pushUnique(blockingReasons, "poison_audit_failed");
  if (
    readBoolean(routeAuthority?.route_authority_ok) === false &&
    (
      (poisonFailed && !staleRouteOnlyPoisonFailure) ||
      readString(routeAuthority?.primary_violation_code) === "terminal_artifact_forbidden_by_route_contract" ||
      readString(routeAuthority?.route_authority_violation_code) === "terminal_artifact_forbidden_by_route_contract"
    ) &&
    !canonicalTerminal
  ) {
    pushUnique(blockingReasons, "route_authority_failed");
  }
  if (readString(retrievalResult?.answerability) === "not_answerable") pushUnique(blockingReasons, "retrieval_not_answerable");
  if (hasPromptObjectExtractionProblem(payload)) pushUnique(blockingReasons, "prompt_object_extraction_invalid");

  const sourceTarget = readRecord(payload.source_target_intent);
  const activeSituationContext = readRecord(payload.active_situation_context);
  const situationEvidenceSelection = readRecord(payload.situation_evidence_selection);
  const deicticReference = readRecord(payload.deictic_reference);
  const visualSourceRequired =
    readString(sourceTarget?.target_source) === "visual_capture" ||
    readString(deicticReference?.reference_type) === "current_screen" ||
    readString(deicticReference?.reference_type) === "selected_visible_file" ||
    /\b(?:screen\s*capture|visual\s*capture|screenshot|visual|visible)\b/i.test(
      readString(payload.active_prompt) ?? readString(payload.prompt) ?? readString(payload.question) ?? "",
    );
  const liveSourceIdentityDiagnosis = readString(liveSourceIdentity?.diagnosis);
  const liveSourceIdentityHardFailure =
    liveSourceIdentity &&
    (
      readBoolean(liveSourceIdentity.environment_binding_ok) === false ||
      readBoolean(liveSourceIdentity.situation_run_binding_ok) === false ||
      liveSourceIdentityDiagnosis === "active_environment_missing" ||
      liveSourceIdentityDiagnosis === "active_environment_source_missing" ||
      liveSourceIdentityDiagnosis === "producer_source_mismatch" ||
      liveSourceIdentityDiagnosis === "fresh_source_unbound" ||
      liveSourceIdentityDiagnosis === "fresh_source_wrong_environment" ||
      liveSourceIdentityDiagnosis === "situation_run_missing" ||
      liveSourceIdentityDiagnosis === "fresh_observation_not_in_situation_run" ||
      liveSourceIdentityDiagnosis === "field_evaluations_missing"
    );
  if (
    visualSourceRequired &&
    terminalArtifactKind !== "typed_failure" &&
    (
      liveSourceIdentityHardFailure ||
      readString(activeSituationContext?.status) === "missing" ||
      readBoolean(situationEvidenceSelection?.answerable) === false
    )
  ) {
    pushUnique(blockingReasons, "visual_evidence_missing");
  }

  if (
    readBoolean(solverTrace?.completed_solver_path) === false &&
    blockingReasons.some((reason) =>
      reason === "poison_audit_failed" ||
      reason === "route_authority_failed" ||
      reason === "terminal_route_mismatch" ||
      reason === "route_product_contract_rejected_terminal" ||
      reason === "retrieval_not_answerable" ||
      reason === "turn_id_integrity_failed" ||
      reason === "visual_evidence_missing" ||
      reason === "prompt_object_extraction_invalid"
    )
  ) {
    pushUnique(blockingReasons, "solver_path_incomplete");
  }

  const effectiveBlockingReasons = nonAnswerTerminal ? [] : blockingReasons;
  const typedFailureCode =
    effectiveBlockingReasons.includes("visual_evidence_missing")
      ? liveSourceIdentityDiagnosis ??
        (readString(activeSituationContext?.status) === "missing" ? "active_environment_missing" : undefined) ??
        "visual_evidence_missing"
      : effectiveBlockingReasons[0] ?? undefined;

  return {
    schema: "helix.solver_controller_decision.v1",
    turn_id: input.turnId,
    final_route: finalRoute,
    canonical_goal_kind: readString(canonicalGoal?.goal_kind),
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: terminalArtifactKind,
    decision: effectiveBlockingReasons.length === 0 ? "allow_terminal" : "fail_closed",
    blocking_reasons: effectiveBlockingReasons,
    consumed_artifact_refs: consumedRefs,
    typed_failure_code: typedFailureCode,
    assistant_answer: false,
    raw_content_included: false,
  };
}
