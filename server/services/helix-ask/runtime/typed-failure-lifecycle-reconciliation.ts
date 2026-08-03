import { auditRouteAuthority } from "../route-authority-audit";
import { buildRouteProductContract } from "../route-product-contract";
import { resolveToolFamilyContract } from "../tool-family-contract";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const hasCurrentTurnObservation = (payload: RecordLike): boolean => {
  const loopTrace = readRecord(payload.loop_parity_trace);
  if (
    Array.isArray(loopTrace?.observations_created) &&
    loopTrace.observations_created.length > 0
  ) {
    return true;
  }
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  return ledger.some((entry) => {
    const artifact = readRecord(entry);
    const kind = readString(artifact?.kind) ?? "";
    return /(?:tool|source|environment|document|scholarly|calculator|workspace)[-_.:]?(?:observation|receipt|evaluation)$/i.test(
      kind,
    );
  });
};

const readTypedFailure = (payload: RecordLike): RecordLike | null => {
  const direct = readRecord(payload.typed_failure);
  if (direct) return direct;
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  for (const value of [...ledger].reverse()) {
    const artifact = readRecord(value);
    if (readString(artifact?.kind) !== "typed_failure") continue;
    const artifactPayload = readRecord(artifact?.payload);
    if (artifactPayload) return artifactPayload;
  }
  return null;
};

const isSettledSourceObservationTypedFailure = (
  payload: RecordLike,
): boolean => {
  if (!hasCurrentTurnObservation(payload)) return false;
  const loopTrace = readRecord(payload.loop_parity_trace);
  if (
    Array.isArray(loopTrace?.actual_tool_calls) &&
    loopTrace.actual_tool_calls.length > 0
  ) {
    return false;
  }
  const failure = readTypedFailure(payload);
  const errorCode =
    readString(failure?.error_code) ?? readString(payload.terminal_error_code);
  const nextRequiredAction = readString(failure?.next_required_action);
  return Boolean(
    errorCode &&
      [
        "procedure_epoch_current_unavailable",
        "procedure_epoch_previous_unavailable",
        "procedure_memory_unavailable",
        "procedure_epoch_replay_evidence_unavailable",
        "visual_scene_memory_no_match",
        "visual_scene_memory_current_missing",
      ].includes(errorCode) &&
      (!nextRequiredAction ||
        [
          "none",
          "capture_current_visual_epoch",
          "wait_for_scene_memory_index",
          "repair_procedure_memory",
        ].includes(nextRequiredAction)),
  );
};

export const authoritativeTypedFailureRequiresNoContinuation = (
  payload: RecordLike,
): boolean => {
  if (
    readString(payload.terminal_artifact_kind) !== "typed_failure" ||
    readString(payload.final_answer_source) !== "typed_failure"
  ) {
    return false;
  }

  const failure = readTypedFailure(payload);
  const errorCode =
    readString(failure?.error_code) ?? readString(payload.terminal_error_code);
  if (!errorCode) return false;

  const routeProductContract = readRecord(payload.route_product_contract);
  const allowedTerminalKinds = Array.isArray(
    routeProductContract?.allowed_terminal_artifact_kinds,
  )
    ? routeProductContract.allowed_terminal_artifact_kinds
        .map((value) => readString(value))
        .filter((value): value is string => Boolean(value))
    : [];
  if (
    readString(routeProductContract?.schema) !==
      "helix.route_product_contract.v1" ||
    !allowedTerminalKinds.includes("typed_failure")
  ) {
    return false;
  }

  const routeAuthorityAudit = readRecord(payload.route_authority_audit);
  const loopParityTrace = readRecord(payload.loop_parity_trace);
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const authorityEstablished =
    routeAuthorityAudit?.route_authority_ok === true ||
    loopParityTrace?.route_authority_ok === true ||
    terminalAuthority?.server_authoritative === true;
  if (!authorityEstablished) return false;

  return (
    !hasCurrentTurnObservation(payload) ||
    isSettledSourceObservationTypedFailure(payload)
  );
};

const selectedRouteForPayload = (payload: RecordLike): string =>
  readString(readRecord(payload.loop_parity_trace)?.selected_route) ??
  readString(readRecord(payload.route_authority_audit)?.selected_route) ??
  readString(readRecord(payload.committed_ask_route)?.route_id) ??
  readString(payload.route_reason_code) ??
  readString(payload.route) ??
  "typed_failure";

const withoutSettledTypedFailureFlags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" &&
          ![
            "route_contract_missing",
            "route_authority_missing",
            "poison_clean_but_authority_failed",
            "missing_followup_reasoning",
            "goal_satisfaction_incomplete",
            "tool_result_terminal_without_reasoning",
            "terminal_selected_before_observation_finalizer",
            "terminal_authority_before_solver_completion",
          ].includes(entry),
      )
    : [];

const reconcileRailObservationContract = (
  payload: RecordLike,
  sourceTarget: string | null,
): void => {
  if (!sourceTarget) return;
  const contract = resolveToolFamilyContract({
    toolName: sourceTarget,
    toolFamily: sourceTarget,
  });
  if (!contract || contract.requiredObservationKinds.length === 0) return;

  const admission = readRecord(payload.tool_call_admission_decision);
  if (
    admission &&
    (!Array.isArray(
      admission.required_observation_kinds_for_requested_capability,
    ) ||
      admission.required_observation_kinds_for_requested_capability.length ===
        0)
  ) {
    admission.required_observation_kinds_for_requested_capability = [
      ...contract.requiredObservationKinds,
    ];
  }
  const debug = readRecord(payload.debug);
  const artifactQueryIndex = readRecord(payload.artifact_query_index);
  const debugArtifactQueryIndex = readRecord(debug?.artifact_query_index);
  const candidates = [
    readRecord(payload.codex_parity_agent_spine_rail_table),
    readRecord(payload.tool_rail_failure_triage),
    readRecord(payload.tool_turn_chain_audit),
    readRecord(artifactQueryIndex?.codex_parity_agent_spine_rail_table),
    readRecord(artifactQueryIndex?.tool_rail_failure_triage),
    readRecord(artifactQueryIndex?.tool_turn_chain_audit),
    readRecord(debug?.codex_parity_agent_spine_rail_table),
    readRecord(debug?.tool_rail_failure_triage),
    readRecord(debug?.tool_turn_chain_audit),
    readRecord(debugArtifactQueryIndex?.codex_parity_agent_spine_rail_table),
    readRecord(debugArtifactQueryIndex?.tool_rail_failure_triage),
    readRecord(debugArtifactQueryIndex?.tool_turn_chain_audit),
  ].filter((entry): entry is RecordLike => Boolean(entry));
  for (const rail of candidates) {
    if (
      !Array.isArray(
        rail.required_observation_kinds_for_requested_capability,
      ) ||
      rail.required_observation_kinds_for_requested_capability.length === 0
    ) {
      rail.required_observation_kinds_for_requested_capability = [
        ...contract.requiredObservationKinds,
      ];
      rail.observed_artifact_supports_requested_capability = false;
    }
  }
};

export const reconcileAuthoritativeTypedFailureLifecycle = (args: {
  payload: RecordLike;
  turnId: string;
  promptText?: string | null;
  selectedTerminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
}): boolean => {
  const terminalArtifactKind =
    readString(args.selectedTerminalArtifactKind) ??
    readString(args.payload.terminal_artifact_kind);
  const finalAnswerSource =
    readString(args.finalAnswerSource) ??
    readString(args.payload.final_answer_source);
  const currentTurnObservationPresent = hasCurrentTurnObservation(
    args.payload,
  );
  const settledSourceObservationFailure =
    isSettledSourceObservationTypedFailure(args.payload);
  if (
    terminalArtifactKind !== "typed_failure" ||
    finalAnswerSource !== "typed_failure" ||
    (currentTurnObservationPresent && !settledSourceObservationFailure)
  ) {
    return false;
  }
  const sourceTargetIntent =
    readRecord(args.payload.source_target_intent) ??
    readRecord(args.payload.sourceTargetIntent);
  let routeProductContract = readRecord(args.payload.route_product_contract);
  if (
    readString(routeProductContract?.schema) !==
      "helix.route_product_contract.v1" &&
    readString(sourceTargetIntent?.strength) === "hard"
  ) {
    routeProductContract = buildRouteProductContract({
      turnId: args.turnId,
      threadId:
        readString(sourceTargetIntent?.thread_id) ??
        readString(args.payload.thread_id) ??
        "helix-ask:desktop",
      sourceTargetIntent:
        sourceTargetIntent as Parameters<
          typeof buildRouteProductContract
        >[0]["sourceTargetIntent"],
      promptText: readString(args.promptText) ?? "",
    }) as unknown as RecordLike;
    args.payload.route_product_contract = routeProductContract;
  }
  if (
    readString(routeProductContract?.schema) !==
    "helix.route_product_contract.v1"
  ) {
    return false;
  }

  const promptText = readString(args.promptText) ?? "";
  const selectedRoute = selectedRouteForPayload(args.payload);
  const establishedAuthority =
    authoritativeTypedFailureRequiresNoContinuation(args.payload);
  const routeAuthorityAudit = auditRouteAuthority({
    turnId: args.turnId,
    promptText,
    selectedRoute,
    payload: args.payload,
    terminalArtifactKind,
    finalAnswerSource,
    sourceTargetIntent,
    routeProductContract,
    toolCallAdmissionDecision: readRecord(
      args.payload.tool_call_admission_decision,
    ),
    terminalArtifactSelectionGuard: readRecord(
      args.payload.terminal_artifact_selection_guard,
    ),
    productAuthorityGuard: readRecord(args.payload.product_authority_guard),
    committedAskRoute: readRecord(args.payload.committed_ask_route),
  });
  if (!routeAuthorityAudit.route_authority_ok && !establishedAuthority) {
    return false;
  }
  const existingRouteAuthorityAudit = readRecord(
    args.payload.route_authority_audit,
  );
  const effectiveRouteAuthorityAudit = routeAuthorityAudit.route_authority_ok
    ? routeAuthorityAudit
    : existingRouteAuthorityAudit ?? routeAuthorityAudit;

  const canonicalGoalFrame =
    readRecord(args.payload.canonical_goal_frame) ?? {};
  if (settledSourceObservationFailure) {
    canonicalGoalFrame.authoritative_source_observation_typed_failure = true;
  } else {
    canonicalGoalFrame.authoritative_zero_observation_typed_failure = true;
  }
  args.payload.canonical_goal_frame = canonicalGoalFrame;
  args.payload.route_authority_audit = effectiveRouteAuthorityAudit;
  const loopParityTrace = readRecord(args.payload.loop_parity_trace);
  if (loopParityTrace) {
    loopParityTrace.route_authority_audit_ref =
      effectiveRouteAuthorityAudit.audit_id;
    loopParityTrace.route_authority_ok = true;
    loopParityTrace.terminal_selection_ran_after_observations = true;
    loopParityTrace.terminal_artifact_kind = terminalArtifactKind;
    loopParityTrace.final_answer_source = finalAnswerSource;
    loopParityTrace.short_circuit_risk_flags =
      withoutSettledTypedFailureFlags(
        loopParityTrace.short_circuit_risk_flags,
      );
  }
  const solverTrace = readRecord(args.payload.ask_turn_solver_trace);
  if (solverTrace) {
    solverTrace.route_authority_ok = true;
    solverTrace.solver_risk_flags = withoutSettledTypedFailureFlags(
      solverTrace.solver_risk_flags,
    );
    solverTrace.solver_short_circuit_flags =
      withoutSettledTypedFailureFlags(
        solverTrace.solver_short_circuit_flags,
      );
    const finalArbitration = readRecord(solverTrace.final_arbitration);
    if (finalArbitration) {
      finalArbitration.terminal_artifact_kind = terminalArtifactKind;
      finalArbitration.final_answer_source = finalAnswerSource;
      finalArbitration.remaining_uncertainty =
        withoutSettledTypedFailureFlags(
          finalArbitration.remaining_uncertainty,
        );
      finalArbitration.why_complete = settledSourceObservationFailure
        ? "authoritative source-observation typed failure settled by terminal policy"
        : "authoritative zero-observation typed failure settled by terminal policy";
    }
    for (const gate of [
      readRecord(solverTrace.evidence_reentry),
      readRecord(solverTrace.evidence_reentry_gate),
      readRecord(solverTrace.followup_reasoning),
      readRecord(solverTrace.followup_reasoning_gate),
    ]) {
      if (!gate) continue;
      gate.required = false;
      gate.completed = true;
      gate.reason = settledSourceObservationFailure
        ? "authoritative_source_observation_typed_failure"
        : "authoritative_typed_failure_no_observation";
      delete gate.skipped_reason;
      if (Array.isArray(gate.violation_codes)) gate.violation_codes = [];
    }
    solverTrace.completed_solver_path = true;
  }
  reconcileRailObservationContract(
    args.payload,
    readString(sourceTargetIntent?.target_source),
  );

  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.route_authority_audit = args.payload.route_authority_audit;
    debug.loop_parity_trace = args.payload.loop_parity_trace;
    if (solverTrace) {
      debug.ask_turn_solver_trace = args.payload.ask_turn_solver_trace;
    }
  }
  return true;
};
