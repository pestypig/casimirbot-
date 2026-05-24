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

const readStringArray = (value: unknown): string[] =>
  readArray(value).map(readString).filter((entry): entry is string => Boolean(entry));

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

const isSourceTargetedOrCapabilityTurn = (payload: RecordLike): boolean => {
  const sourceTarget = readRecord(payload.source_target_intent);
  const targetSource = readString(sourceTarget?.target_source);
  const targetKind = readString(sourceTarget?.target_kind);
  const strength = readString(sourceTarget?.strength);
  const explicitSourceTarget =
    Boolean(targetSource && targetSource !== "unknown") ||
    Boolean(targetKind && targetKind !== "unknown") ||
    strength === "hard" ||
    readBoolean(sourceTarget?.must_enter_backend_ask) === true ||
    readBoolean(sourceTarget?.allow_no_tool_direct) === false ||
    readArray(sourceTarget?.requested_outputs).length > 0;
  return (
    explicitSourceTarget ||
    Boolean(
      readRecord(payload.capability_plan) ||
        readRecord(payload.capability_result) ||
        readRecord(payload.capability_lifecycle_ledger) ||
        readRecord(payload.tool_call_admission_decision) ||
        readRecord(payload.active_workspace_source_resolution),
    )
  );
};

const hasRequiredArtifactContract = (terminalContract: RecordLike | null): boolean =>
  Boolean(
    terminalContract &&
      readString(terminalContract.goal_kind) &&
      readStringArray(terminalContract.required_terminal_kinds).length > 0,
  );

const isCapabilityTerminalKind = (terminalArtifactKind: string | null): boolean =>
  Boolean(
    terminalArtifactKind &&
      /^(?:workspace_action_receipt|workstation_tool_evaluation|live_pipeline_receipt|live_pipeline_turn_receipt|live_source_pipeline_receipt)$/i.test(
        terminalArtifactKind,
      ),
  );

const hasSatisfiedWorkstationToolEvaluation = (payload: RecordLike, terminalArtifactKind: string | null): boolean => {
  if (terminalArtifactKind !== "workstation_tool_evaluation" && terminalArtifactKind !== "tool_evaluation") return false;
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  if (
    readString(goalSatisfaction?.satisfaction) !== "satisfied" ||
    readString(goalSatisfaction?.next_decision) !== "allow_terminal"
  ) {
    return false;
  }
  const terminalContract = readRecord(goalSatisfaction?.terminal_contract);
  const requiredTerminalKinds = readStringArray(terminalContract?.required_terminal_kinds);
  if (requiredTerminalKinds.length > 0 && !requiredTerminalKinds.includes(terminalArtifactKind)) return false;
  const observationReview = readRecord(payload.observation_review);
  if (observationReview && readBoolean(observationReview.does_it_satisfy_goal) !== true) return false;
  return readArray(payload.current_turn_artifact_ledger).some((entry) => {
    const artifact = readRecord(entry);
    if (readString(artifact?.kind) !== "workstation_tool_evaluation") return false;
    const artifactPayload = readRecord(artifact?.payload);
    return readBoolean(artifactPayload?.supports_goal) === true;
  });
};

const hasSatisfiedLivePipelineReceipt = (payload: RecordLike, terminalArtifactKind: string | null): boolean => {
  if (terminalArtifactKind !== "live_pipeline_receipt") return false;
  const liveTurnReceipt = readRecord(payload.live_pipeline_turn_receipt);
  const pipelineReceiptId = readString(payload.pipeline_receipt_id);
  const pipelineId = readString(payload.pipeline_id);
  if (liveTurnReceipt || pipelineReceiptId || pipelineId) return true;
  return readArray(payload.current_turn_artifact_ledger).some((entry) => {
    const artifact = readRecord(entry);
    if (!artifact) return false;
    const artifactKind = readString(artifact.kind);
    const artifactPayload = readRecord(artifact.payload);
    return (
      artifactKind === "live_pipeline_receipt" ||
      (
        artifactKind === "tool_observation" &&
        (
          readString(artifactPayload?.schema) === "helix.live_pipeline_turn_receipt.v1" ||
          Boolean(readString(artifactPayload?.pipeline_receipt_id) || readString(artifactPayload?.pipeline_id))
        )
      )
    );
  });
};

const hasIncompletePromptRequirementCoverage = (payload: RecordLike): boolean => {
  const coverage = readRecord(payload.prompt_requirement_coverage);
  const coverageState = readString(coverage?.coverage);
  return Boolean(coverageState && coverageState !== "complete");
};

const isCapabilityLifecycleComplete = (payload: RecordLike, terminalArtifactKind: string | null): boolean => {
  if (hasSatisfiedWorkstationToolEvaluation(payload, terminalArtifactKind)) return true;
  if (hasSatisfiedLivePipelineReceipt(payload, terminalArtifactKind)) return true;
  const plan = readRecord(payload.capability_plan);
  const result = readRecord(payload.capability_result);
  const ledger = readRecord(payload.capability_lifecycle_ledger);
  const adapterRequest = readRecord(payload.capability_adapter_request ?? payload.adapter_request);
  const adapterResult = readRecord(payload.capability_adapter_result ?? payload.adapter_result);
  if (!plan || !result || !ledger || !adapterRequest || !adapterResult) return false;
  if (readBoolean(ledger.ok) !== true) return false;
  const resultStatus = readString(result.status);
  if (resultStatus !== "succeeded" && resultStatus !== "not_run") return false;
  if (isCapabilityTerminalKind(terminalArtifactKind)) {
    if (readBoolean(result.selected_for_answer) !== true) return false;
    if (readBoolean(result.reentered_solver) !== true) return false;
  }
  return true;
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
  const nonAnswerTerminal =
    terminalArtifactKind === "typed_failure" ||
    terminalArtifactKind === "request_user_input" ||
    readString(input.payload.final_answer_source) === "typed_failure" ||
    readString(input.payload.final_answer_source) === "request_user_input";
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  const canonicalGoalKind = readString(canonicalGoal?.goal_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const canonicalTerminal =
    Boolean(canonicalGoalKind && requiredTerminalKind && finalRouteBase === canonicalGoalKind && terminalArtifactKind === requiredTerminalKind);
  const routeAuthority = readRecord(input.payload.route_authority_audit);
  const terminalGuard = readRecord(input.payload.terminal_artifact_selection_guard);
  const productGuard = readRecord(input.payload.product_authority_guard);
  const routeMismatch = Boolean(
    !nonAnswerTerminal &&
    finalRouteBase &&
    terminalAuthorityRouteBase &&
    finalRouteBase !== terminalAuthorityRouteBase
  );
  const routeProductRejected =
    !nonAnswerTerminal &&
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
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  const terminalContract = readRecord(goalSatisfaction?.terminal_contract);
  const terminalEquivalence = readRecord(payload.terminal_equivalence_harness_result);
  const liveSourceIdentity = readRecord(payload.live_source_identity_audit ?? solverTrace?.live_source_identity_audit);
  const terminalArtifactKind = readString(payload.terminal_artifact_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const requiredTerminalKindsFromContract = readStringArray(terminalContract?.required_terminal_kinds);
  const requiredTerminalKinds =
    requiredTerminalKindsFromContract.length > 0
      ? requiredTerminalKindsFromContract
      : requiredTerminalKind
        ? [requiredTerminalKind]
        : [];
  const forbiddenTerminalKinds = readStringArray(terminalContract?.forbidden_terminal_kinds);
  const goalSatisfactionState = readString(goalSatisfaction?.satisfaction);
  const goalNextDecision = readString(goalSatisfaction?.next_decision);
  const terminalContractGoalKind = readString(terminalContract?.goal_kind);
  const finalRoute = readString(input.finalRoute) ?? readString(payload.route_reason_code) ?? readString(payload.route);
  const finalRouteBase = normalizeHelixRouteBase(finalRoute);
  const canonicalGoalKind = readString(canonicalGoal?.goal_kind);
  const liveMaintenanceTerminal = Boolean(
    (canonicalGoalKind && /^live_(?:source_continuation|pipeline_control|runtime_repair|environment_binding_diagnosis)$/.test(canonicalGoalKind)) ||
      (finalRouteBase && /^live_(?:source_continuation|pipeline_control|runtime_repair|environment_binding_diagnosis)$/.test(finalRouteBase)),
  ) && ["live_pipeline_receipt", "live_environment_binding_diagnosis"].includes(terminalArtifactKind ?? "");
  const noteMutationTerminal =
    canonicalGoalKind === "note_mutation" &&
    goalSatisfactionState === "satisfied" &&
    goalNextDecision === "allow_terminal" &&
    terminalArtifactKind === "note_update_receipt" &&
    readBoolean(readRecord(payload.terminal_consistency_check)?.consistent) === true;
  const canonicalTerminal =
    noteMutationTerminal ||
    Boolean(canonicalGoalKind && requiredTerminalKind && finalRouteBase === canonicalGoalKind && terminalArtifactKind === requiredTerminalKind);
  const turnIdIntegrityAudit = input.turnIdIntegrityAudit ?? buildTurnIdIntegrityAudit({ turnId: input.turnId, payload });
  const finalRouteReconciliation = input.finalRouteReconciliation ?? buildFinalRouteReconciliation({ turnId: input.turnId, finalRoute, payload });
  const disciplineGuardRequired = isSourceTargetedOrCapabilityTurn(payload);
  const capabilityTerminal = isCapabilityTerminalKind(terminalArtifactKind);
  const capabilityGuardRequired =
    capabilityTerminal ||
    Boolean(
      readRecord(payload.capability_plan) ||
        readRecord(payload.capability_result) ||
        readRecord(payload.capability_lifecycle_ledger),
    );

  const blockingReasons: HelixSolverControllerBlockingReason[] = [];
  const consumedRefs: string[] = [
    "canonical_goal_frame",
    "terminal_answer_authority",
    "route_authority_audit",
    "poison_audit",
    "ask_turn_solver_trace",
    "turn_id_integrity_audit",
    "final_route_reconciliation",
    "goal_satisfaction_evaluation",
    "prompt_requirement_coverage",
    "terminal_equivalence_harness_result",
    "capability_plan",
    "capability_result",
    "capability_lifecycle_ledger",
    "capability_adapter_request",
    "capability_adapter_result",
  ];

  if (!nonAnswerTerminal) {
    if (!goalSatisfaction) {
      pushUnique(blockingReasons, "goal_satisfaction_missing");
    } else if (goalSatisfactionState !== "satisfied" || goalNextDecision !== "allow_terminal") {
      pushUnique(blockingReasons, "goal_not_satisfied");
    }
    if (disciplineGuardRequired && !hasRequiredArtifactContract(terminalContract)) {
      pushUnique(blockingReasons, "required_artifact_contract_missing");
    }
    if (terminalArtifactKind && requiredTerminalKinds.length > 0 && !requiredTerminalKinds.includes(terminalArtifactKind)) {
      pushUnique(blockingReasons, "terminal_kind_not_required");
    }
    if (terminalArtifactKind && forbiddenTerminalKinds.includes(terminalArtifactKind)) {
      pushUnique(blockingReasons, "terminal_kind_not_required");
    }
    if (!terminalEquivalence) {
      pushUnique(blockingReasons, "terminal_equivalence_missing");
    } else if (readBoolean(terminalEquivalence.ok) !== true) {
      pushUnique(blockingReasons, "terminal_equivalence_failed");
    }
    if (capabilityGuardRequired && !isCapabilityLifecycleComplete(payload, terminalArtifactKind)) {
      pushUnique(blockingReasons, "capability_lifecycle_incomplete");
    }
    if (hasIncompletePromptRequirementCoverage(payload)) {
      pushUnique(blockingReasons, "prompt_requirement_coverage_incomplete");
    }
  }

  if (!turnIdIntegrityAudit.ok) pushUnique(blockingReasons, "turn_id_integrity_failed");
  if (!finalRouteReconciliation.ok && !noteMutationTerminal) {
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
  if (!nonAnswerTerminal && readBoolean(poisonAudit?.ok) !== true && !noteMutationTerminal && !liveMaintenanceTerminal) pushUnique(blockingReasons, "poison_audit_failed");
  if (poisonFailed && !staleRouteOnlyPoisonFailure && !noteMutationTerminal && !liveMaintenanceTerminal) pushUnique(blockingReasons, "poison_audit_failed");
  if (!nonAnswerTerminal && readBoolean(routeAuthority?.route_authority_ok) !== true && !noteMutationTerminal && !liveMaintenanceTerminal) {
    pushUnique(blockingReasons, "route_authority_failed");
  }
  if (
    readBoolean(routeAuthority?.route_authority_ok) === false &&
    !noteMutationTerminal &&
    !liveMaintenanceTerminal &&
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

  const solverFinalArbitration = readRecord(solverTrace?.final_arbitration);
  const allSubgoalsObservedOnly =
    readString(solverFinalArbitration?.why_complete) === "all_subgoals_observed" ||
    readString(solverFinalArbitration?.reason) === "all_subgoals_observed" ||
    readArray(payload.current_turn_events ?? payload.turn_events).some((event) => {
      const eventRecord = readRecord(event);
      const decision = readRecord(eventRecord?.decision);
      return readString(decision?.reason) === "all_subgoals_observed";
    });
  if (!nonAnswerTerminal && allSubgoalsObservedOnly && goalSatisfactionState !== "satisfied") {
    pushUnique(blockingReasons, "subgoals_observed_not_satisfied");
  }

  const sourceTarget = readRecord(payload.source_target_intent);
  const sourceTargetName = readString(sourceTarget?.target_source);
  const promptText = readString(payload.active_prompt) ?? readString(payload.prompt) ?? readString(payload.question) ?? "";
  const visualContentPrompt =
    /\b(?:describe|review|analy[sz]e|what\s+(?:do\s+you\s+)?see|what(?:'s|\s+is)\s+(?:happening|on|visible))\b[\s\S]{0,140}\b(?:live|screen|visual|display)\s+(?:capture|source|frame|screen)\b/i.test(promptText) ||
    /\b(?:live|screen|visual|display)\s+(?:capture|source|frame|screen)\b[\s\S]{0,140}\b(?:describe|review|analy[sz]e|see|happening|visible)\b/i.test(promptText);
  const controlReceiptTerminal =
    terminalArtifactKind === "live_pipeline_receipt" ||
    terminalArtifactKind === "visual_producer_cadence_receipt" ||
    terminalArtifactKind === "live_answer_environment_receipt" ||
    (terminalArtifactKind === "workspace_action_receipt" &&
      /\b(?:set_rate|live-source\.set_rate|interval|cadence|rate)\b/i.test(promptText));
  if (!nonAnswerTerminal && visualContentPrompt && terminalContractGoalKind !== "live_interval_set" && controlReceiptTerminal) {
    pushUnique(blockingReasons, "terminal_kind_not_required");
    pushUnique(blockingReasons, "visual_evidence_missing");
  }
  if (
    !nonAnswerTerminal &&
    !liveMaintenanceTerminal &&
    (sourceTargetName === "live_pipeline" || sourceTargetName === "visual_capture") &&
    (
      terminalArtifactKind === "direct_answer_text" ||
      terminalArtifactKind === "no_tool_direct" ||
      terminalArtifactKind === "model_only_concept" ||
      readString(payload.final_answer_source) === "no_tool_direct"
    )
  ) {
    pushUnique(blockingReasons, sourceTargetName === "visual_capture" ? "visual_evidence_missing" : "route_product_contract_rejected_terminal");
  }
  const activeSituationContext = readRecord(payload.active_situation_context);
  const situationEvidenceSelection = readRecord(payload.situation_evidence_selection);
  const deicticReference = readRecord(payload.deictic_reference);
  const visualSourceRequired =
    readString(sourceTarget?.target_source) === "visual_capture" ||
    readString(deicticReference?.reference_type) === "current_screen" ||
    readString(deicticReference?.reference_type) === "selected_visible_file" ||
    /\b(?:live\s+capture|screen\s*capture|visual\s*capture|screenshot|visual|visible)\b/i.test(
      promptText,
    );
  if (
    !nonAnswerTerminal &&
    visualSourceRequired &&
    (
      terminalArtifactKind === "direct_answer_text" ||
      terminalArtifactKind === "no_tool_direct" ||
      terminalArtifactKind === "model_only_concept" ||
      readString(payload.final_answer_source) === "no_tool_direct"
    )
  ) {
    pushUnique(blockingReasons, "visual_evidence_missing");
  }
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
    !liveMaintenanceTerminal &&
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
      reason === "prompt_object_extraction_invalid" ||
      reason === "goal_satisfaction_missing" ||
      reason === "goal_not_satisfied" ||
      reason === "required_artifact_contract_missing" ||
      reason === "terminal_kind_not_required" ||
      reason === "terminal_equivalence_missing" ||
      reason === "terminal_equivalence_failed" ||
      reason === "capability_lifecycle_incomplete" ||
      reason === "subgoals_observed_not_satisfied" ||
      reason === "prompt_requirement_coverage_incomplete"
    )
  ) {
    pushUnique(blockingReasons, "solver_path_incomplete");
  }

  const effectiveBlockingReasons = nonAnswerTerminal ? [] : blockingReasons;
  const goalBlocked = effectiveBlockingReasons.some((reason) =>
    reason === "goal_satisfaction_missing" ||
    reason === "goal_not_satisfied" ||
    reason === "required_artifact_contract_missing" ||
    reason === "terminal_kind_not_required" ||
    reason === "subgoals_observed_not_satisfied" ||
    reason === "prompt_requirement_coverage_incomplete"
  );
  const requestedGoalDecision =
    goalNextDecision === "continue" ||
    goalNextDecision === "retry" ||
    goalNextDecision === "request_user_input"
      ? goalNextDecision
      : null;
  const controllerDecision =
    effectiveBlockingReasons.length === 0
      ? "allow_terminal"
      : requestedGoalDecision
        ? requestedGoalDecision
        : goalBlocked
          ? "typed_failure"
          : "fail_closed";
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
    decision: controllerDecision,
    blocking_reasons: effectiveBlockingReasons,
    consumed_artifact_refs: consumedRefs,
    typed_failure_code: typedFailureCode,
    assistant_answer: false,
    raw_content_included: false,
  };
}
