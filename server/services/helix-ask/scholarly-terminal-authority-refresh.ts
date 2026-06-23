type RecordLike = Record<string, unknown>;

type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: string;
  goal_hash?: string;
  payload?: unknown;
};

type HelixAskTurnSatisfactionReport = RecordLike;
type HelixAskTerminalConsistencyCheck = RecordLike & { violations: string[] };
type HelixAskCanonicalGoalKind = string;
type HelixAskCanonicalAnswerScope = string;
type HelixAskRequiredTerminalKind = string;

export type RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies = {
  readAskTurnString: (value: unknown) => string | null;
  readAskTurnStringList: (value: unknown) => string[];
  readAskTurnArtifactPayloadRecord: (artifact: HelixTurnArtifact) => RecordLike | null;
  mergeAskTurnLedgerArtifacts: (artifacts: HelixTurnArtifact[]) => HelixTurnArtifact[];
  hashDebugExportPayloadShort: (value: unknown) => string;
  buildRouteProductContract: (args: RecordLike) => RecordLike;
  buildToolCallAdmissionDecision: (args: RecordLike) => RecordLike;
  guardTerminalArtifactSelection: (args: RecordLike) => RecordLike;
  guardProductAuthority: (args: RecordLike) => RecordLike;
  auditRouteAuthority: (args: RecordLike) => RecordLike;
  recordHelixTurnTerminalAuthority: (args: RecordLike) => RecordLike;
  auditHelixAskContextForPoison: (args: RecordLike) => RecordLike;
  buildLoopParityTrace: (args: RecordLike) => RecordLike;
  buildAskTurnSolverTrace: (args: RecordLike) => RecordLike;
  buildTerminalEquivalenceHarnessResult: (args: RecordLike) => RecordLike;
  buildTurnIdIntegrityAudit: (args: RecordLike) => RecordLike;
  buildFinalRouteReconciliation: (args: RecordLike) => RecordLike;
  buildSolverControllerDecision: (args: RecordLike) => RecordLike;
};

export type RefreshScholarlyTerminalAuthorityAfterMaterializationInput = {
  payload: RecordLike;
  threadId: string;
  turnId: string;
  route: string;
  prompt: string;
  dependencies: RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies;
};
const materializedScholarlyTerminalAuthorityRefreshApplies = (
  payload: Record<string, unknown>,
  dependencies: RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies,
): boolean => {
  const { readAskTurnString } = dependencies;
  const writer =
    payload.terminal_authority_single_writer && typeof payload.terminal_authority_single_writer === "object" && !Array.isArray(payload.terminal_authority_single_writer)
      ? (payload.terminal_authority_single_writer as Record<string, unknown>)
      : null;
  const canonicalGoal =
    payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object" && !Array.isArray(payload.canonical_goal_frame)
      ? (payload.canonical_goal_frame as Record<string, unknown>)
      : {};
  const currentLedger = Array.isArray(payload.current_turn_artifact_ledger)
    ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const finalAnswerDraft = readScholarlySourceBackedFinalAnswerDraft(payload, currentLedger, dependencies);
  const finalAnswerDraftText = readAskTurnString(finalAnswerDraft?.text);
  const hasScholarlyObservation = currentLedger.some((artifact) =>
    artifact.kind === "scholarly_research_observation" ||
    artifact.kind === "scholarly_full_text_observation"
  );
  const hardGate =
    payload.solver_hard_gate && typeof payload.solver_hard_gate === "object" && !Array.isArray(payload.solver_hard_gate)
      ? (payload.solver_hard_gate as Record<string, unknown>)
      : null;
  const itineraryState =
    payload.capability_itinerary_execution_state && typeof payload.capability_itinerary_execution_state === "object" && !Array.isArray(payload.capability_itinerary_execution_state)
      ? (payload.capability_itinerary_execution_state as Record<string, unknown>)
      : null;
  const itineraryIncomplete =
    itineraryState?.applies === true &&
    itineraryState.complete !== true;
  const sourceBackedDraftReady =
    readAskTurnString(canonicalGoal.goal_kind) === "scholarly_research_lookup" &&
    readAskTurnString(canonicalGoal.required_terminal_kind) === "scholarly_research_answer" &&
    readAskTurnString(finalAnswerDraft?.authority) === "llm_post_observation_composer" &&
    readAskTurnString(finalAnswerDraft?.composer_scope) === "source_tool_backed" &&
    Boolean(finalAnswerDraftText) &&
    hasScholarlyObservation &&
    hardGate?.failed !== true &&
    !itineraryIncomplete;
  return (
    (
      readAskTurnString(payload.terminal_artifact_kind) === "scholarly_research_answer" &&
      readAskTurnString(payload.final_answer_source) === "final_answer_draft" &&
      readAskTurnString(writer?.selected_terminal_artifact_kind) === "scholarly_research_answer" &&
      Boolean(readAskTurnString(payload.selected_final_answer) ?? readAskTurnString(payload.answer) ?? readAskTurnString(payload.text))
    ) ||
    sourceBackedDraftReady
  );
};

const isScholarlySourceBackedFinalAnswerDraft = (
  draft: Record<string, unknown> | null | undefined,
  dependencies: RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies,
): boolean => {
  const { readAskTurnString } = dependencies;
  return readAskTurnString(draft?.authority) === "llm_post_observation_composer" &&
    readAskTurnString(draft?.composer_scope) === "source_tool_backed" &&
    Boolean(readAskTurnString(draft?.text));
};

const readScholarlySourceBackedFinalAnswerDraft = (
  payload: Record<string, unknown>,
  currentLedger: HelixTurnArtifact[],
  dependencies: RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies,
): Record<string, unknown> | null => {
  const { readAskTurnArtifactPayloadRecord } = dependencies;
  const topLevelDraft =
    payload.final_answer_draft && typeof payload.final_answer_draft === "object" && !Array.isArray(payload.final_answer_draft)
      ? (payload.final_answer_draft as Record<string, unknown>)
      : null;
  if (isScholarlySourceBackedFinalAnswerDraft(topLevelDraft, dependencies)) {
    return topLevelDraft;
  }
  return [...currentLedger]
    .reverse()
    .map((artifact) => {
      if (artifact.kind !== "final_answer_draft") return null;
      const artifactPayload = readAskTurnArtifactPayloadRecord(artifact);
      return artifactPayload && typeof artifactPayload === "object"
        ? (artifactPayload as Record<string, unknown>)
        : null;
    })
    .find((draft): draft is Record<string, unknown> => isScholarlySourceBackedFinalAnswerDraft(draft, dependencies)) ?? null;
};

export function refreshScholarlyTerminalAuthorityAfterMaterialization(input: {
  payload: Record<string, unknown>;
  threadId: string;
  turnId: string;
  route: string;
  prompt: string;
  dependencies: RefreshScholarlyTerminalAuthorityAfterMaterializationDependencies;
}): boolean {
  const payload = input.payload;
  const {
    readAskTurnString,
    readAskTurnStringList,
    mergeAskTurnLedgerArtifacts,
    hashDebugExportPayloadShort,
    buildRouteProductContract,
    buildToolCallAdmissionDecision,
    guardTerminalArtifactSelection,
    guardProductAuthority,
    auditRouteAuthority,
    recordHelixTurnTerminalAuthority,
    auditHelixAskContextForPoison,
    buildLoopParityTrace,
    buildAskTurnSolverTrace,
    buildTerminalEquivalenceHarnessResult,
    buildTurnIdIntegrityAudit,
    buildFinalRouteReconciliation,
    buildSolverControllerDecision,
  } = input.dependencies;
  if (!materializedScholarlyTerminalAuthorityRefreshApplies(payload, input.dependencies)) return false;

  const terminalArtifactKind = "scholarly_research_answer";
  const finalAnswerSource = "final_answer_draft";
  const currentLedger = Array.isArray(payload.current_turn_artifact_ledger)
    ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const finalAnswerDraft = readScholarlySourceBackedFinalAnswerDraft(payload, currentLedger, input.dependencies);
  const finalAnswerDraftText = readAskTurnString(finalAnswerDraft?.text);
  const staleOrUnmaterializedScholarlyTerminal =
    readAskTurnString(payload.terminal_artifact_kind) !== terminalArtifactKind ||
    readAskTurnString(payload.final_answer_source) !== finalAnswerSource ||
    Boolean(readAskTurnString(payload.terminal_error_code));
  const terminalText =
    staleOrUnmaterializedScholarlyTerminal
      ? (
          finalAnswerDraftText ??
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text)
        )
      : (
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text) ??
          finalAnswerDraftText
        );
  if (!terminalText) return false;
  if (finalAnswerDraft) {
    payload.final_answer_draft = finalAnswerDraft;
  }
  const scholarlySupportRefs = Array.from(new Set([
    ...currentLedger
      .filter((artifact) =>
        artifact.kind === "scholarly_research_observation" ||
        artifact.kind === "scholarly_full_text_observation" ||
        artifact.kind === "helix_theory_context_reflection_tool_receipt" ||
        artifact.kind === "workstation_tool_evaluation"
      )
      .map((artifact) => artifact.artifact_id),
    ...readAskTurnStringList(finalAnswerDraft?.support_refs),
    ...readAskTurnStringList(finalAnswerDraft?.grounded_in_observation_refs),
  ].filter((entry): entry is string => Boolean(entry))));
  const scholarlyReceiptRefs = Array.from(new Set([
    ...readAskTurnStringList(finalAnswerDraft?.receipt_refs),
    ...currentLedger
      .filter((artifact) => artifact.kind === "helix_theory_context_reflection_tool_receipt")
      .map((artifact) => artifact.artifact_id),
  ].filter((entry): entry is string => Boolean(entry))));
  const scholarlyCoverageRefs = readAskTurnStringList(finalAnswerDraft?.coverage_refs);
  const existingScholarlyAnswer =
    payload.scholarly_research_answer && typeof payload.scholarly_research_answer === "object" && !Array.isArray(payload.scholarly_research_answer)
      ? (payload.scholarly_research_answer as Record<string, unknown>)
      : null;
  const scholarlyAnswerArtifactId =
    readAskTurnString(existingScholarlyAnswer?.artifact_id) ??
    (
      readAskTurnString(payload.terminal_artifact_kind) === terminalArtifactKind
        ? readAskTurnString(payload.terminal_artifact_id)
        : null
    ) ??
    `${input.turnId}:scholarly_research_answer`;
  const scholarlyResearchAnswer = {
    schema: "helix.scholarly_research_answer.v1",
    artifact_id: scholarlyAnswerArtifactId,
    turn_id: input.turnId,
    answer_text: terminalText,
    text: terminalText,
    final_answer_draft_ref:
      readAskTurnString(finalAnswerDraft?.artifact_id) ??
      `${input.turnId}:final_answer_draft`,
    support_refs: scholarlySupportRefs,
    receipt_refs: scholarlyReceiptRefs,
    coverage_refs: scholarlyCoverageRefs,
    source_observation_refs: currentLedger
      .filter((artifact) => artifact.kind === "scholarly_research_observation" || artifact.kind === "scholarly_full_text_observation")
      .map((artifact) => artifact.artifact_id),
    terminal_source: finalAnswerSource,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.scholarly_research_answer = scholarlyResearchAnswer;
  payload.terminal_artifact_id = scholarlyAnswerArtifactId;
  payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
    ...currentLedger.filter((artifact) => artifact.artifact_id !== scholarlyAnswerArtifactId),
    {
      artifact_id: scholarlyAnswerArtifactId,
      turn_id: input.turnId,
      producer_item_id: "scholarly_terminal_materializer",
      kind: terminalArtifactKind,
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      goal_hash: hashDebugExportPayloadShort([input.turnId, terminalArtifactKind, finalAnswerSource]),
      payload: scholarlyResearchAnswer,
    },
  ]);

  const previousRouteAuthority =
    payload.route_authority_audit && typeof payload.route_authority_audit === "object" && !Array.isArray(payload.route_authority_audit)
      ? (payload.route_authority_audit as Record<string, unknown>)
      : null;
  const previousController =
    payload.solver_controller_decision && typeof payload.solver_controller_decision === "object" && !Array.isArray(payload.solver_controller_decision)
      ? (payload.solver_controller_decision as Record<string, unknown>)
      : null;

  const canonicalGoal =
    payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object" && !Array.isArray(payload.canonical_goal_frame)
      ? (payload.canonical_goal_frame as Record<string, unknown>)
      : {};
  const canonicalGoalKind = readAskTurnString(canonicalGoal.goal_kind) ?? "scholarly_research_lookup";
  const requiredTerminalKind = readAskTurnString(canonicalGoal.required_terminal_kind) ?? terminalArtifactKind;
  let sourceTargetIntent =
    payload.source_target_intent && typeof payload.source_target_intent === "object" && !Array.isArray(payload.source_target_intent)
      ? (payload.source_target_intent as Record<string, unknown>)
      : {};
  const sourceTarget = readAskTurnString(sourceTargetIntent.target_source);
  if (
    (!sourceTarget || sourceTarget === "unknown") &&
    canonicalGoalKind === "scholarly_research_lookup" &&
    requiredTerminalKind === terminalArtifactKind
  ) {
    sourceTargetIntent = {
      schema: "helix.ask_source_target_intent.v1",
      turn_id: input.turnId,
      thread_id: input.threadId,
      target_source: "scholarly_research",
      target_kind: "scholarly_research_lookup",
      strength: "hard",
      explicit_cues: ["canonical_scholarly_research_terminal"],
      reasons: ["canonical_scholarly_research_terminal_materialized"],
      requested_outputs: ["scholarly_research_answer"],
      suppressed_routes: ["model_only_concept", "no_tool_direct"],
      precedence_reason: "canonical_scholarly_research_terminal_materialized",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      confidence: 0.88,
      assistant_answer: false,
      raw_content_included: false,
    };
    payload.source_target_intent = sourceTargetIntent;
  }

  const selectedRoute = input.route || readAskTurnString(payload.route_reason_code) || "dispatch:act";
  const routeProductContract = buildRouteProductContract({
    turnId: input.turnId,
    threadId: input.threadId,
    sourceTargetIntent,
    promptText: input.prompt,
  });
  payload.route_product_contract = routeProductContract;
  payload.tool_call_admission_decision = buildToolCallAdmissionDecision({
    turnId: input.turnId,
    sourceTargetIntent,
    routeProductContract,
    promptText: input.prompt,
  });
  payload.terminal_artifact_selection_guard = guardTerminalArtifactSelection({
    contract: routeProductContract,
    terminalArtifactKind,
  });
  payload.product_authority_guard = guardProductAuthority({
    sourceTargetIntent,
    toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
    routeProductContract,
    terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
    terminalArtifactKind,
  });
  payload.route_authority_audit = auditRouteAuthority({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute,
    payload,
    terminalArtifactKind,
    finalAnswerSource,
    sourceTargetIntent,
    routeProductContract,
    toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
    terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
    productAuthorityGuard: payload.product_authority_guard as Record<string, unknown>,
    committedAskRoute: payload.committed_ask_route as Record<string, unknown>,
  });

  const previousGoalEvaluation =
    payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object" && !Array.isArray(payload.goal_satisfaction_evaluation)
      ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
      : {};
  const previousTerminalContract =
    previousGoalEvaluation.terminal_contract && typeof previousGoalEvaluation.terminal_contract === "object" && !Array.isArray(previousGoalEvaluation.terminal_contract)
      ? (previousGoalEvaluation.terminal_contract as Record<string, unknown>)
      : {};
  const contractRequiredKinds = readAskTurnStringList(previousTerminalContract.required_terminal_kinds);
  const refreshedRequiredKinds = Array.from(new Set([
    ...(contractRequiredKinds.length > 0 ? contractRequiredKinds : [requiredTerminalKind]),
    terminalArtifactKind,
  ]));
  payload.goal_satisfaction_evaluation = {
    ...previousGoalEvaluation,
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: input.turnId,
    canonical_goal_kind: canonicalGoalKind,
    required_terminal_kind: requiredTerminalKind,
    terminal_contract: {
      ...previousTerminalContract,
      goal_kind: readAskTurnString(previousTerminalContract.goal_kind) ?? canonicalGoalKind,
      required_terminal_kinds: refreshedRequiredKinds,
      acceptable_fallbacks: readAskTurnStringList(previousTerminalContract.acceptable_fallbacks),
      forbidden_terminal_kinds: readAskTurnStringList(previousTerminalContract.forbidden_terminal_kinds),
      required_actions: readAskTurnStringList(previousTerminalContract.required_actions),
      required_evidence: readAskTurnStringList(previousTerminalContract.required_evidence),
    },
    required_actions: Array.isArray(previousGoalEvaluation.required_actions) ? previousGoalEvaluation.required_actions : [],
    required_evidence: Array.isArray(previousGoalEvaluation.required_evidence) ? previousGoalEvaluation.required_evidence : [],
    observed_results: Array.isArray(previousGoalEvaluation.observed_results) ? previousGoalEvaluation.observed_results : [],
    satisfaction: "satisfied",
    next_decision: "allow_terminal",
    reason: "materialized_scholarly_terminal_selected_by_single_writer",
    supporting_artifact_refs: [
      readAskTurnString(payload.terminal_artifact_id),
      readAskTurnString((payload.scholarly_research_answer as Record<string, unknown> | undefined)?.artifact_id),
      ...scholarlySupportRefs,
    ].filter((entry): entry is string => Boolean(entry)),
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.satisfaction_report = {
    satisfied: true,
    terminal_kind: "final_answer",
    terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id) ?? `${input.turnId}:scholarly_research_answer`,
    terminal_artifact_kind: terminalArtifactKind,
    terminal_source: finalAnswerSource,
    missing_artifacts: [],
    confidence: "high",
    rejected_terminal_candidates: [],
  } satisfies HelixAskTurnSatisfactionReport;

  const terminalConsistencyViolations: HelixAskTerminalConsistencyCheck["violations"] = [];
  if (requiredTerminalKind && requiredTerminalKind !== terminalArtifactKind) {
    terminalConsistencyViolations.push("invalid_terminal_artifact_shape");
  }
  const terminalConsistencyCheck: HelixAskTerminalConsistencyCheck = {
    turn_id: input.turnId,
    goal_kind: canonicalGoalKind as HelixAskCanonicalGoalKind,
    answer_scope: (readAskTurnString(canonicalGoal.answer_scope) ?? "source_targeted") as HelixAskCanonicalAnswerScope,
    required_terminal_kind: requiredTerminalKind as HelixAskRequiredTerminalKind,
    selected_terminal_kind: terminalArtifactKind,
    satisfaction_terminal_kind: "final_answer",
    final_answer_source: finalAnswerSource,
    consistent: terminalConsistencyViolations.length === 0,
    violations: terminalConsistencyViolations,
  };
  payload.terminal_consistency_check = terminalConsistencyCheck;

  payload.ok = true;
  payload.response_type = "final_answer";
  payload.final_status = "final_answer";
  payload.terminal_artifact_kind = terminalArtifactKind;
  payload.final_answer_source = finalAnswerSource;
  payload.selected_final_answer = terminalText;
  payload.answer = terminalText;
  payload.text = terminalText;
  payload.finalAnswer = terminalText;
  payload.content = terminalText;
  payload.assistant_answer = terminalText;
  delete payload.terminal_error_code;
  delete payload.terminal_failure_text;
  const terminalPresentation =
    payload.terminal_presentation && typeof payload.terminal_presentation === "object" && !Array.isArray(payload.terminal_presentation)
      ? (payload.terminal_presentation as Record<string, unknown>)
      : {};
  payload.terminal_presentation = {
    ...terminalPresentation,
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    terminal_artifact_kind: terminalArtifactKind,
    concise_text: terminalText,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  if (payload.resolved_turn_summary && typeof payload.resolved_turn_summary === "object" && !Array.isArray(payload.resolved_turn_summary)) {
    const summary = payload.resolved_turn_summary as Record<string, unknown>;
    summary.final_status = "final_answer";
    summary.terminal_artifact_kind = terminalArtifactKind;
    summary.final_answer_source = finalAnswerSource;
    summary.terminal_error_code = null;
  }
  const terminalAnswerEvent = {
    type: "terminal_answer",
    turn_id: input.turnId,
    text: terminalText,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    assistant_answer: false,
    raw_content_included: false,
  };
  const refreshTerminalAnswerEvents = (value: unknown): Record<string, unknown>[] => [
    ...(Array.isArray(value)
      ? value
        .filter((event) => !(event && typeof event === "object" && !Array.isArray(event) && (event as Record<string, unknown>).type === "terminal_answer"))
        .filter((event): event is Record<string, unknown> => Boolean(event && typeof event === "object" && !Array.isArray(event)))
      : []),
    terminalAnswerEvent,
  ];
  payload.current_turn_events = refreshTerminalAnswerEvents(payload.current_turn_events ?? payload.turn_events);
  payload.turn_events = refreshTerminalAnswerEvents(payload.turn_events ?? payload.current_turn_events);

  const terminalAuthorityRecord = recordHelixTurnTerminalAuthority({
    thread_id: input.threadId,
    turn_id: input.turnId,
    final_answer_source: finalAnswerSource,
    terminal_artifact_kind: terminalArtifactKind,
    terminal_text: terminalText,
    route: selectedRoute,
  });
  payload.terminal_answer_authority = terminalAuthorityRecord;
  payload.poison_audit = auditHelixAskContextForPoison({
    thread_id: input.threadId,
    turn_id: input.turnId,
    payload,
    terminal_authority: terminalAuthorityRecord,
    client_visible_text: terminalText,
  });
  payload.loop_parity_trace = buildLoopParityTrace({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    payload,
  });
  payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    payload,
    loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
  });

  delete payload.solver_controller_decision;
  if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
    delete (payload.debug as Record<string, unknown>).solver_controller_decision;
  }
  payload.terminal_equivalence_harness_result = buildTerminalEquivalenceHarnessResult({
    nonStreamResponse: payload,
    visibleUiAnswerState: {
      question: input.prompt,
      finalAnswer: terminalText,
    },
    requireControllerParity: false,
    suppressDisciplineAutoRequire: true,
  });
  payload.terminal_surface_parity_invariant = payload.terminal_equivalence_harness_result;

  const turnIdIntegrityAudit = buildTurnIdIntegrityAudit({
    turnId: input.turnId,
    backendTurnId: readAskTurnString(payload.backend_turn_id),
    clientTurnId: readAskTurnString(payload.client_active_turn_id),
    payload,
  });
  const finalRouteReconciliation = buildFinalRouteReconciliation({
    turnId: input.turnId,
    finalRoute: selectedRoute,
    payload,
  });
  const controllerDecision = buildSolverControllerDecision({
    turnId: input.turnId,
    finalRoute: selectedRoute,
    payload,
    turnIdIntegrityAudit,
    finalRouteReconciliation,
  });
  payload.turn_id_integrity_audit = turnIdIntegrityAudit;
  payload.final_route_reconciliation = finalRouteReconciliation;
  payload.solver_controller_decision = controllerDecision;
  if (controllerDecision.decision === "allow_terminal") {
    payload.terminal_equivalence_harness_result = buildTerminalEquivalenceHarnessResult({
      nonStreamResponse: payload,
      visibleUiAnswerState: {
        question: input.prompt,
        finalAnswer: terminalText,
      },
      requireControllerParity: true,
      suppressDisciplineAutoRequire: false,
    });
    payload.terminal_surface_parity_invariant = payload.terminal_equivalence_harness_result;
  }

  payload.terminal_authority_refresh = {
    schema: "helix.terminal_authority_refresh.v1",
    turn_id: input.turnId,
    refreshed: true,
    reason: "scholarly_terminal_materialized_after_prior_authority_audit",
    previous_terminal_artifact_kind: readAskTurnString(previousRouteAuthority?.terminal_artifact_kind) ?? null,
    previous_controller_decision: readAskTurnString(previousController?.decision) ?? null,
    selected_terminal_artifact_kind: terminalArtifactKind,
    solver_controller_decision: controllerDecision.decision,
    route_authority_ok:
      payload.route_authority_audit && typeof payload.route_authority_audit === "object"
        ? (payload.route_authority_audit as Record<string, unknown>).route_authority_ok === true
        : false,
    assistant_answer: false,
    raw_content_included: false,
  };

  if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
    const debug = payload.debug as Record<string, unknown>;
    debug.ok = payload.ok;
    debug.response_type = payload.response_type;
    debug.final_status = payload.final_status;
    debug.final_answer_source = finalAnswerSource;
    debug.terminal_artifact_kind = terminalArtifactKind;
    debug.selected_final_answer = terminalText;
    debug.answer = terminalText;
    debug.text = terminalText;
    debug.finalAnswer = terminalText;
    debug.assistant_answer = terminalText;
    debug.terminal_presentation = payload.terminal_presentation;
    debug.resolved_turn_summary = payload.resolved_turn_summary;
    debug.source_target_intent = payload.source_target_intent;
    debug.route_product_contract = payload.route_product_contract;
    debug.tool_call_admission_decision = payload.tool_call_admission_decision;
    debug.terminal_artifact_selection_guard = payload.terminal_artifact_selection_guard;
    debug.product_authority_guard = payload.product_authority_guard;
    debug.route_authority_audit = payload.route_authority_audit;
    debug.goal_satisfaction_evaluation = payload.goal_satisfaction_evaluation;
    debug.satisfaction_report = payload.satisfaction_report;
    debug.terminal_consistency_check = payload.terminal_consistency_check;
    debug.terminal_answer_authority = payload.terminal_answer_authority;
    debug.poison_audit = payload.poison_audit;
    debug.loop_parity_trace = payload.loop_parity_trace;
    debug.ask_turn_solver_trace = payload.ask_turn_solver_trace;
    debug.current_turn_events = payload.current_turn_events;
    debug.turn_events = payload.turn_events;
    debug.terminal_equivalence_harness_result = payload.terminal_equivalence_harness_result;
    debug.terminal_surface_parity_invariant = payload.terminal_surface_parity_invariant;
    debug.turn_id_integrity_audit = payload.turn_id_integrity_audit;
    debug.final_route_reconciliation = payload.final_route_reconciliation;
    debug.solver_controller_decision = payload.solver_controller_decision;
    debug.terminal_authority_refresh = payload.terminal_authority_refresh;
    delete debug.terminal_error_code;
    delete debug.terminal_failure_text;
  }

  return true;
}

export const __testHelixScholarlyTerminalAuthorityRefresh = {
  refreshScholarlyTerminalAuthorityAfterMaterialization,
};

