type RecordLike = Record<string, any>;
type HelixAskCanonicalGoalFrame = RecordLike;
type HelixTurnArtifact = RecordLike;
type HelixAgentRuntimeLoop = RecordLike & { iterations: any[] };
type HelixAgentStepDecision = RecordLike;
type HelixFinalAnswerDraft = RecordLike & { text: string; authority?: string | null; model_context_economy_report?: unknown; compact_observation_refs?: unknown };
type HelixRepoCodeEvidenceObservation = RecordLike;
type HelixConversationMemoryPacket = RecordLike;
type HelixRollingSessionContextPacket = RecordLike;
type HelixGoalSatisfactionEvaluation = RecordLike;
type HelixGoalTerminalContract = RecordLike;

export type HelixRuntimeFinalAnswerComposerDependencies = {
  readAskTurnString: any;
  readAskTurnArtifactPayloadRecord: any;
  buildHelixRuntimeDocSummaryFallbackText: any;
  buildHelixRuntimeRepoEvidenceFallbackText: any;
  buildHelixRuntimeWorkspaceOsStatusFallbackText: any;
  buildHelixRuntimeInterimVoiceCalloutFallbackText: any;
  buildHelixRuntimeLiveSourceMailFallbackText: any;
  buildHelixRuntimeStagePlayFallbackText: any;
  buildHelixRuntimeLiveEnvironmentFallbackText: any;
  formatAskTurnWorkspaceActionReceiptMessage: any;
  resolveAskTurnPanelControlLabel: any;
  resolveCompoundCapabilitySynthesisReadiness: any;
  HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY: any;
  HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY: any;
  buildHelixScholarlyResearchFallbackText: any;
  buildHelixInternetSearchFallbackText: any;
  buildRepoDocsSynthesisPacket: any;
  evaluateRepoEvidenceRelevanceGate: any;
  HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA: any;
  HELIX_REPO_SYNTHESIS_STEP_IDENTITY_REPAIR_SCHEMA: any;
  buildHelixConversationMemoryPacket: any;
  buildHelixRollingSessionContextPacket: any;
  HELIX_ASK_LOCAL_CONTEXT_TOKENS: any;
  buildHelixRollingSessionContextDebug: any;
  syncAskLanguageContractDebugMirrors: any;
  invokeHelixPostObservationComposerLlm: any;
  collectHelixRuntimeComposerReceipts: any;
  collectHelixRuntimeComposerCoverageArtifacts: any;
  collectHelixRuntimeComposerToolObservations: any;
  collectHelixRuntimeComposerInternetSearchObservationRefs: any;
  hashDebugExportPayloadShort: any;
  mergeAskTurnLedgerArtifacts: any;
  materializeFinalAnswerDraftTerminal: any;
  collectRepoDocsSynthesisPacketSupportRefs: any;
  attachSynthesisSupportRefs: any;
  evaluateRepoAnswerTextQualityGate: any;
  classifyRepoDocsSynthesisAttemptStatus: any;
  buildRepoDocsSynthesisRepairInstruction: any;
  repoDocsSynthesisTerminalErrorCode: any;
  isInterimVoiceCalloutFinalStatus: any;
  readLatestInterimVoiceCalloutToolResult: any;
  resolveTerminalAnswerEnvelope: any;
  applyTerminalAnswerEnvelope: any;
  arbitrateAskSourceTarget: any;
  buildRouteProductContract: any;
  buildToolCallAdmissionDecision: any;
  guardTerminalArtifactSelection: any;
  guardProductAuthority: any;
  auditRouteAuthority: any;
  recordHelixTurnTerminalAuthority: any;
  auditHelixAskContextForPoison: any;
  buildLoopParityTrace: any;
  buildAskTurnSolverTrace: any;
  maybeRecordStagePlayAskCheckpointReceipt: any;
  buildHelixPromptRequirementCoverage: any;
  buildHelixDocRetrievalCoverage: any;
};

export const createHelixRuntimeFinalAnswerComposer = (dependencies: HelixRuntimeFinalAnswerComposerDependencies) => {
  const {
    readAskTurnString,
    readAskTurnArtifactPayloadRecord,
    buildHelixRuntimeDocSummaryFallbackText,
    buildHelixRuntimeRepoEvidenceFallbackText,
    buildHelixRuntimeWorkspaceOsStatusFallbackText,
    buildHelixRuntimeInterimVoiceCalloutFallbackText,
    buildHelixRuntimeLiveSourceMailFallbackText,
    buildHelixRuntimeStagePlayFallbackText,
    buildHelixRuntimeLiveEnvironmentFallbackText,
    formatAskTurnWorkspaceActionReceiptMessage,
    resolveAskTurnPanelControlLabel,
    resolveCompoundCapabilitySynthesisReadiness,
    HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
    HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY,
    buildHelixScholarlyResearchFallbackText,
    buildHelixInternetSearchFallbackText,
    buildRepoDocsSynthesisPacket,
    evaluateRepoEvidenceRelevanceGate,
    HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
    HELIX_REPO_SYNTHESIS_STEP_IDENTITY_REPAIR_SCHEMA,
    buildHelixConversationMemoryPacket,
    buildHelixRollingSessionContextPacket,
    HELIX_ASK_LOCAL_CONTEXT_TOKENS,
    buildHelixRollingSessionContextDebug,
    syncAskLanguageContractDebugMirrors,
    invokeHelixPostObservationComposerLlm,
    collectHelixRuntimeComposerReceipts,
    collectHelixRuntimeComposerCoverageArtifacts,
    collectHelixRuntimeComposerToolObservations,
    collectHelixRuntimeComposerInternetSearchObservationRefs,
    hashDebugExportPayloadShort,
    mergeAskTurnLedgerArtifacts,
    materializeFinalAnswerDraftTerminal,
    collectRepoDocsSynthesisPacketSupportRefs,
    attachSynthesisSupportRefs,
    evaluateRepoAnswerTextQualityGate,
    classifyRepoDocsSynthesisAttemptStatus,
    buildRepoDocsSynthesisRepairInstruction,
    repoDocsSynthesisTerminalErrorCode,
    isInterimVoiceCalloutFinalStatus,
    readLatestInterimVoiceCalloutToolResult,
    resolveTerminalAnswerEnvelope,
    applyTerminalAnswerEnvelope,
    arbitrateAskSourceTarget,
    buildRouteProductContract,
    buildToolCallAdmissionDecision,
    guardTerminalArtifactSelection,
    guardProductAuthority,
    auditRouteAuthority,
    recordHelixTurnTerminalAuthority,
    auditHelixAskContextForPoison,
    buildLoopParityTrace,
    buildAskTurnSolverTrace,
    maybeRecordStagePlayAskCheckpointReceipt,
    buildHelixPromptRequirementCoverage,
    buildHelixDocRetrievalCoverage,
  } = dependencies;

const isHelixRuntimeRepoEvidenceGoalFrame = (frame: HelixAskCanonicalGoalFrame): boolean =>
  frame.goal_kind === "repo_code_evidence_question" ||
  frame.goal_kind === "repo_entity_definition" ||
  frame.required_terminal_kind === "repo_code_evidence_answer" ||
  frame.required_terminal_kind === "repo_code_evidence_observation";

const collectHelixRuntimeRepoEvidenceObservationRefs = (artifacts: HelixTurnArtifact[]): string[] =>
  Array.from(new Set(
    artifacts
      .filter((artifact) => artifact.kind === "repo_code_evidence_observation")
      .map((artifact) => artifact.artifact_id)
      .filter(Boolean),
  ));

const hasHelixRuntimeRepoEvidenceObservation = (artifacts: HelixTurnArtifact[]): boolean =>
  collectHelixRuntimeRepoEvidenceObservationRefs(artifacts).length > 0;

const collectHelixRuntimeRepoEvidenceSupportRefs = (artifacts: HelixTurnArtifact[]): string[] =>
  Array.from(new Set(
    artifacts
      .filter((artifact) => artifact.kind === "repo_code_evidence_observation")
      .flatMap((artifact) => {
        const payload = readAskTurnArtifactPayloadRecord(artifact);
        const evidenceRefs = Array.isArray(payload?.evidence_refs)
          ? payload.evidence_refs.map((entry) => readAskTurnString(entry)).filter((entry): entry is string => Boolean(entry))
          : [];
        const spanRefs = Array.isArray(payload?.spans)
          ? payload.spans
              .map((entry) => (entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as Record<string, unknown>) : null))
              .map((entry) => readAskTurnString(entry?.ref) ?? readAskTurnString(entry?.path))
              .filter((entry): entry is string => Boolean(entry))
          : [];
        return [...evidenceRefs, ...spanRefs];
      })
      .filter(Boolean),
  )).slice(0, 12);

const isHelixRepoEvidenceStaleFallbackText = (value: unknown): boolean => {
  const text = readAskTurnString(value) ?? "";
  return /\b(?:pending|could not complete|could not answer|could not produce|repo_code_evidence_unavailable|terminal answer|terminal boundary blocked|source\/capability answer before the agent runtime loop|turn stopped before required artifacts|missing required artifacts|required artifacts (?:were|are) satisfied|workspace_step_failed|failed to execute)\b/i.test(text);
};

const isStagePlayPostObservationSynthesisText = (value: unknown): boolean =>
  /^(?:Stage Play reflected\b|Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b|Stage Play reflection succeeded\b)/i.test(
    readAskTurnString(value) ?? "",
  );

const stagePlayModelAnswerConflictsWithReceipt = (modelText: string, fallbackText: string): boolean => {
  if (!isStagePlayPostObservationSynthesisText(fallbackText)) return false;
  const model = modelText.toLowerCase();
  const fallback = fallbackText.toLowerCase();
  const fallbackReason = fallback.match(/projection reason code:\s*([a-z_]+)/i)?.[1] ?? null;
  if (fallbackReason === "no_line_changes" && /\b(?:absence|no|without)\s+(?:of\s+)?an?\s+active environment\b/i.test(modelText)) {
    return true;
  }
  if (fallbackReason === "no_active_environment" && /\bno line changes\b/i.test(modelText)) {
    return true;
  }
  if (fallback.includes("projected risk, possibilities, unknowns, and next_check") && !model.includes("risk")) {
    return true;
  }
  if (
    /\bVisual evidence:\s*visual_evidence:/i.test(fallbackText) &&
    /\b(?:visual (?:capture )?evidence (?:is )?(?:unavailable|missing|absent)|no visual evidence|without visual evidence|absence of visual evidence)\b/i.test(modelText)
  ) {
    return true;
  }
  if (/\bgraph includes\s+\d+\s+badges\b/i.test(modelText) && !/\bgraph summary:/i.test(fallbackText)) {
    return true;
  }
  return false;
};

const buildHelixRuntimeComposerFallbackText = (args: {
  prompt: string;
  payload: Record<string, unknown>;
  canonicalGoalFrame: HelixAskCanonicalGoalFrame;
  artifacts: HelixTurnArtifact[];
}): string => {
  const hasPostToolObservationReentry = args.artifacts.some((artifact) => {
    if (artifact.kind !== "agent_step_observation_packet") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    return payload?.post_tool_model_step_required === true && payload?.terminal_eligible === false;
  });
  if (hasPostToolObservationReentry) {
    const workspaceReceipt = args.artifacts.find((artifact) => artifact.kind === "workspace_action_receipt") ?? null;
    const receiptPayload = workspaceReceipt ? readAskTurnArtifactPayloadRecord(workspaceReceipt) : null;
    const panelLabel =
      readAskTurnString(receiptPayload?.label) ??
      readAskTurnString(receiptPayload?.target_label) ??
      readAskTurnString(receiptPayload?.target_id);
    if (args.canonicalGoalFrame.goal_kind === "panel_control" && panelLabel) {
      return formatAskTurnWorkspaceActionReceiptMessage(
        readAskTurnString(receiptPayload?.target_id) ?? panelLabel,
        "open",
        resolveAskTurnPanelControlLabel(panelLabel),
      );
    }
    if (args.canonicalGoalFrame.goal_kind === "panel_control") {
      return "The requested workspace panel action completed successfully.";
    }
  }
  if (
    args.canonicalGoalFrame.goal_kind === "doc_summary" ||
    args.canonicalGoalFrame.goal_kind === "active_doc_summary" ||
    args.canonicalGoalFrame.required_terminal_kind === "doc_summary"
  ) {
    const docSummaryText = buildHelixRuntimeDocSummaryFallbackText({
      prompt: args.prompt,
      artifacts: args.artifacts,
    });
    if (docSummaryText) return docSummaryText;
  }
  if (
    args.canonicalGoalFrame.goal_kind === "repo_code_evidence_question" ||
    args.canonicalGoalFrame.goal_kind === "repo_entity_definition" ||
    args.canonicalGoalFrame.required_terminal_kind === "repo_code_evidence_answer"
  ) {
    const repoEvidenceText = buildHelixRuntimeRepoEvidenceFallbackText({
      canonicalGoalFrame: args.canonicalGoalFrame,
      artifacts: args.artifacts,
    });
    if (repoEvidenceText) return repoEvidenceText;
  }
  if (args.canonicalGoalFrame.goal_kind === "workspace_status_diagnostic") {
    const workspaceOsText = buildHelixRuntimeWorkspaceOsStatusFallbackText(args.artifacts);
    if (workspaceOsText) return workspaceOsText;
  }
  if (
    args.canonicalGoalFrame.goal_kind === "live_environment_review" ||
    args.canonicalGoalFrame.goal_kind === "live_source_processed_mail_interpretation" ||
    args.canonicalGoalFrame.required_terminal_kind === "live_environment_tool_observation"
  ) {
    const interimVoiceText = buildHelixRuntimeInterimVoiceCalloutFallbackText(args.artifacts);
    if (interimVoiceText) return interimVoiceText;
    const liveSourceMailText = buildHelixRuntimeLiveSourceMailFallbackText({
      prompt: args.prompt,
      artifacts: args.artifacts,
    });
    if (liveSourceMailText) return liveSourceMailText;
    const stagePlayText = buildHelixRuntimeStagePlayFallbackText({
      artifacts: args.artifacts,
    });
    if (stagePlayText) return stagePlayText;
    const liveEnvironmentText = buildHelixRuntimeLiveEnvironmentFallbackText({
      prompt: args.prompt,
      artifacts: args.artifacts,
    });
    if (liveEnvironmentText) return liveEnvironmentText;
  }
  const existingText =
    readAskTurnString(args.payload.selected_final_answer) ??
    readAskTurnString(args.payload.answer) ??
    readAskTurnString(args.payload.text) ??
    "";
  return /I could not produce a terminal answer for this turn/i.test(existingText) ? "" : existingText;
};

const hasHelixCodexStyleToolObservationReentry = (payload: Record<string, unknown>): boolean =>
  Array.isArray(payload.agent_step_observation_packets) &&
  payload.agent_step_observation_packets.some((entry) =>
    entry &&
    typeof entry === "object" &&
    (entry as Record<string, unknown>).post_tool_model_step_required === true,
  );

const hasHelixCodexStyleToolObservationReentryArtifact = (artifacts: HelixTurnArtifact[]): boolean =>
  artifacts.some((artifact) => {
    if (artifact.kind !== "agent_step_observation_packet") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    return payload?.post_tool_model_step_required === true || payload?.terminal_eligible === false || payload?.status === "succeeded";
  }) &&
  artifacts.some((artifact) => artifact.kind === "final_answer_draft");

const hasHelixFinalAnswerDraftSelectionCandidate = (artifacts: HelixTurnArtifact[]): boolean =>
  artifacts.some((artifact) => {
    if (artifact.kind !== "final_answer_draft") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    return Boolean(readAskTurnString(payload?.text) ?? readAskTurnString(payload?.answer_text));
  });

const hasHelixWorkstationToolEvaluationTerminalCandidate = (artifacts: HelixTurnArtifact[]): boolean =>
  artifacts.some((artifact) => {
    if (artifact.kind !== "workstation_tool_evaluation") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    if (payload?.supports_goal === false) return false;
    const artifactRecord = artifact as Record<string, unknown>;
    return Boolean(
      readAskTurnString(payload?.text) ??
        readAskTurnString(payload?.answer_text) ??
        readAskTurnString(payload?.summary) ??
        readAskTurnString(payload?.result_summary) ??
        readAskTurnString(payload?.text_preview) ??
        readAskTurnString(payload?.terminal_text_preview) ??
        readAskTurnString(artifactRecord.text_preview) ??
        readAskTurnString(artifactRecord.terminal_text_preview),
    );
  });

const shouldApplyHelixTerminalDraftSelectionGate = (artifacts: HelixTurnArtifact[]): boolean =>
  hasHelixCodexStyleToolObservationReentryArtifact(artifacts) ||
  hasHelixFinalAnswerDraftSelectionCandidate(artifacts);

const shouldApplyHelixTerminalDraftSelectionGateForPayload = (
  payload: Record<string, unknown>,
  artifacts: HelixTurnArtifact[],
): boolean => {
  if (hasHelixCodexStyleToolObservationReentryArtifact(artifacts)) return true;
  if (!hasHelixFinalAnswerDraftSelectionCandidate(artifacts)) return false;

  const terminalKind = readAskTurnString(payload.terminal_artifact_kind);
  const finalAnswerSource = readAskTurnString(payload.final_answer_source);
  const terminalErrorCode = readAskTurnString(payload.terminal_error_code);
  const routeReasonCode = readAskTurnString(payload.route_reason_code);
  const dispatchPolicy = readAskTurnString(payload.dispatch_policy);

  if (terminalKind === "no_tool_direct" || finalAnswerSource === "no_tool_direct") return false;
  if (routeReasonCode === "conversation:simple" || dispatchPolicy === "direct_answer_only") return false;
  if (terminalKind === "direct_answer_text" || finalAnswerSource === "model_direct_answer") return true;
  if (terminalKind === "typed_failure" || finalAnswerSource === "typed_failure") return true;
  if (/missing_allowed_terminal_artifact|terminal_projection_missed_valid_final_draft|visible_selected_stale_direct_answer/i.test(terminalErrorCode ?? "")) {
    return true;
  }
  return false;
};

const shouldApplyCompletedCompoundTerminalSingleWriterBridge = (
  payload: Record<string, unknown>,
  artifacts: HelixTurnArtifact[],
): boolean => {
  const readiness = resolveCompoundCapabilitySynthesisReadiness({
    payload,
    artifacts,
  });
  const applies =
    readiness.applies === true &&
    readiness.complete === true &&
    readiness.synthesis_required === true;
  if (!applies) return false;

  payload.compound_capability_synthesis_readiness = readiness;
  const bridge = {
    schema: "helix.completed_compound_terminal_single_writer_bridge.v1",
    applies: true,
    reason: "completed_compound_subgoals_require_terminal_single_writer",
    required_terminal_kind: readiness.required_terminal_kind ?? null,
    synthesis_terminal_kind: readiness.synthesis_terminal_kind ?? null,
    support_refs: readiness.support_refs,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.completed_compound_terminal_single_writer_bridge = bridge;
  const debug =
    payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)
      ? (payload.debug as Record<string, unknown>)
      : null;
  if (debug) {
    debug.compound_capability_synthesis_readiness = readiness;
    debug.completed_compound_terminal_single_writer_bridge = bridge;
  }
  return true;
};

const shouldApplyHelixTerminalSingleWriterForPayload = (
  payload: Record<string, unknown>,
  artifacts: HelixTurnArtifact[],
): boolean =>
  shouldApplyHelixTerminalDraftSelectionGateForPayload(payload, artifacts) ||
  shouldApplyCompletedCompoundTerminalSingleWriterBridge(payload, artifacts);

const readHelixCodexStyleToolReentryFinalTextFromArtifacts = (artifacts: HelixTurnArtifact[]): string | null => {
  const observationPacket = artifacts.find((artifact) => {
    if (artifact.kind !== "agent_step_observation_packet") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    return payload?.post_tool_model_step_required === true && payload?.terminal_eligible === false;
  }) ?? null;
  if (!observationPacket) return null;

  const observationPayload = readAskTurnArtifactPayloadRecord(observationPacket);
  const observationSucceeded = observationPayload?.status === "succeeded";
  const draftArtifact = [...artifacts].reverse().find((artifact) => artifact.kind === "final_answer_draft") ?? null;
  const draftPayload = draftArtifact ? readAskTurnArtifactPayloadRecord(draftArtifact) : null;
  const draftText = readAskTurnString(draftPayload?.text);
  if (draftText && !(observationSucceeded && /(?:workspace_step_failed|Failed to execute)/i.test(draftText))) {
    return draftText;
  }

  const action = readAskTurnString(observationPayload?.action);
  if (observationSucceeded && action === "open") {
    const receiptArtifact = artifacts.find((artifact) => artifact.kind === "workspace_action_receipt") ?? null;
    const receiptPayload = receiptArtifact ? readAskTurnArtifactPayloadRecord(receiptArtifact) : null;
    const label =
      readAskTurnString(receiptPayload?.label) ??
      readAskTurnString(receiptPayload?.target_label) ??
      readAskTurnString(receiptPayload?.target_id) ??
      readAskTurnString(observationPayload?.panel_id);
    return label
      ? formatAskTurnWorkspaceActionReceiptMessage(
          readAskTurnString(receiptPayload?.target_id) ?? readAskTurnString(observationPayload?.panel_id) ?? label,
          "open",
          resolveAskTurnPanelControlLabel(label),
        )
      : "The requested workspace panel action completed successfully.";
  }

  return null;
};

const isHelixRuntimeConciseReceiptTerminal = (payload: Record<string, unknown>): boolean => {
  const terminalKind = readAskTurnString(payload.terminal_artifact_kind);
  const goalKind =
    payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
      ? readAskTurnString((payload.canonical_goal_frame as Record<string, unknown>).goal_kind)
      : null;
  if (hasHelixCodexStyleToolObservationReentry(payload)) return false;
  if (terminalKind !== "workspace_action_receipt") return false;
  return ["docs_panel_open", "live_interval_set", "calculator_panel_open", "workstation_panel_open"].includes(goalKind ?? "");
};

const applyHelixRuntimeFinalAnswerComposerToPayload = async (args: {
  payload: Record<string, unknown>;
  turnId: string;
  transcript: string;
  canonicalGoalFrame: HelixAskCanonicalGoalFrame;
  goalSatisfactionEvaluation: HelixGoalSatisfactionEvaluation | null;
  terminalContract?: HelixGoalTerminalContract | null;
}): Promise<boolean> => {
  const loop =
    args.payload.agent_runtime_loop && typeof args.payload.agent_runtime_loop === "object"
      ? (args.payload.agent_runtime_loop as HelixAgentRuntimeLoop)
      : null;
  if (!loop) return false;
  const answerIteration = [...loop.iterations].reverse().find((iteration) => iteration.next_step === "answer") ?? null;
  if (!answerIteration) return false;
  const artifacts = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const compoundSynthesisReadiness = resolveCompoundCapabilitySynthesisReadiness({
    payload: args.payload,
    capabilityItinerary: args.payload.capability_itinerary,
    artifacts,
  });
  args.payload.compound_capability_synthesis_readiness = compoundSynthesisReadiness;
  if (args.payload.debug && typeof args.payload.debug === "object" && !Array.isArray(args.payload.debug)) {
    (args.payload.debug as Record<string, unknown>).compound_capability_synthesis_readiness =
      compoundSynthesisReadiness;
  }
  const compoundGoalKind = readAskTurnString(compoundSynthesisReadiness.goal_kind);
  const compoundRequiredTerminalKind = readAskTurnString(compoundSynthesisReadiness.required_terminal_kind);
  const compoundTerminalOverride =
    compoundSynthesisReadiness.applies &&
    compoundSynthesisReadiness.complete &&
    Boolean(compoundGoalKind && compoundRequiredTerminalKind);
  const effectiveCanonicalGoalFrame = compoundTerminalOverride
    ? {
        ...args.canonicalGoalFrame,
        goal_kind: compoundGoalKind,
        required_terminal_kind: compoundRequiredTerminalKind,
      } as HelixAskCanonicalGoalFrame
    : args.canonicalGoalFrame;
  if (compoundTerminalOverride) {
    args.payload.canonical_goal_frame = effectiveCanonicalGoalFrame as unknown as Record<string, unknown>;
    const routeProductContract =
      args.payload.route_product_contract &&
      typeof args.payload.route_product_contract === "object" &&
      !Array.isArray(args.payload.route_product_contract)
        ? (args.payload.route_product_contract as Record<string, unknown>)
        : null;
    if (routeProductContract) {
      routeProductContract.required_terminal_kind = compoundRequiredTerminalKind;
      routeProductContract.allowed_terminal_artifact_kinds = Array.from(new Set([
        ...(
          Array.isArray(routeProductContract.allowed_terminal_artifact_kinds)
            ? routeProductContract.allowed_terminal_artifact_kinds
                .map(readAskTurnString)
                .filter((entry): entry is string => Boolean(entry))
            : []
        ),
        "final_answer_draft",
        "model_synthesized_answer",
        compoundRequiredTerminalKind,
      ].filter((entry): entry is string => Boolean(entry))));
    }
    const committedRoute =
      args.payload.committed_ask_route &&
      typeof args.payload.committed_ask_route === "object" &&
      !Array.isArray(args.payload.committed_ask_route)
        ? (args.payload.committed_ask_route as Record<string, unknown>)
        : null;
    const committedCanonicalGoal =
      committedRoute?.canonical_goal &&
      typeof committedRoute.canonical_goal === "object" &&
      !Array.isArray(committedRoute.canonical_goal)
        ? (committedRoute.canonical_goal as Record<string, unknown>)
        : null;
    if (committedCanonicalGoal) {
      committedCanonicalGoal.goal_kind = compoundGoalKind;
      committedCanonicalGoal.required_terminal_kind = compoundRequiredTerminalKind;
      committedCanonicalGoal.allowed_terminal_artifact_kinds = Array.from(new Set([
        ...(
          Array.isArray(committedCanonicalGoal.allowed_terminal_artifact_kinds)
            ? committedCanonicalGoal.allowed_terminal_artifact_kinds
                .map(readAskTurnString)
                .filter((entry): entry is string => Boolean(entry))
            : []
        ),
        "final_answer_draft",
        "model_synthesized_answer",
        compoundRequiredTerminalKind,
      ].filter((entry): entry is string => Boolean(entry))));
      committedCanonicalGoal.forbidden_terminal_artifact_kinds = (
        Array.isArray(committedCanonicalGoal.forbidden_terminal_artifact_kinds)
          ? committedCanonicalGoal.forbidden_terminal_artifact_kinds
              .map(readAskTurnString)
              .filter((entry): entry is string => Boolean(entry))
          : []
      ).filter((entry) => entry !== compoundRequiredTerminalKind);
    }
    if (args.payload.debug && typeof args.payload.debug === "object" && !Array.isArray(args.payload.debug)) {
      const debug = args.payload.debug as Record<string, unknown>;
      debug.canonical_goal_frame = args.payload.canonical_goal_frame;
      debug.route_product_contract = args.payload.route_product_contract;
      debug.committed_ask_route = args.payload.committed_ask_route;
      debug.compound_terminal_contract_override = {
        schema: "helix.compound_terminal_contract_override.v1",
        goal_kind: compoundGoalKind,
        required_terminal_kind: compoundRequiredTerminalKind,
        support_refs: compoundSynthesisReadiness.support_refs,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
  }
  const repoEvidenceGoalFrame = isHelixRuntimeRepoEvidenceGoalFrame(args.canonicalGoalFrame);
  const repoEvidenceObservationRefs = collectHelixRuntimeRepoEvidenceObservationRefs(artifacts);
  const repoEvidenceSynthesisStepRequired = repoEvidenceGoalFrame && repoEvidenceObservationRefs.length > 0;
  const internetSearchGoalFrame = args.canonicalGoalFrame.goal_kind === "internet_search_lookup";
  const internetSearchObservationRefs = collectHelixRuntimeComposerInternetSearchObservationRefs(artifacts);
  const internetSearchSynthesisStepRequired = internetSearchGoalFrame && internetSearchObservationRefs.length > 0;
  if (
    repoEvidenceSynthesisStepRequired &&
    answerIteration.chosen_capability !== HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY
  ) {
    answerIteration.chosen_capability = HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY;
    answerIteration.decision_authority = "llm";
    answerIteration.observation_role = "repo_evidence_synthesis_draft";
    answerIteration.observed_artifact_refs = Array.from(new Set([
      ...(answerIteration.observed_artifact_refs ?? []),
      ...repoEvidenceObservationRefs,
    ]));
    answerIteration.produced_artifacts = Array.from(new Set([
      ...answerIteration.produced_artifacts,
      "repo_evidence_synthesis_attempt",
    ]));
    const currentDecision = args.payload.agent_step_decision && typeof args.payload.agent_step_decision === "object"
      ? (args.payload.agent_step_decision as HelixAgentStepDecision)
      : null;
    if (
      currentDecision?.decision_id === answerIteration.decision_ref &&
      currentDecision.chosen_capability !== HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY
    ) {
      args.payload.agent_step_decision = {
        ...currentDecision,
        chosen_capability: HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
        why_this_capability_satisfies_goal:
          "Repo evidence observations are present and the required terminal product is repo_code_evidence_answer, so the answer step is scoped repo evidence synthesis.",
      };
    }
  }
  if (
    internetSearchSynthesisStepRequired &&
    answerIteration.chosen_capability !== HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY
  ) {
    answerIteration.chosen_capability = HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY;
    answerIteration.decision_authority = "llm";
    answerIteration.observation_role = "internet_search_synthesis_draft";
    answerIteration.observed_artifact_refs = Array.from(new Set([
      ...(answerIteration.observed_artifact_refs ?? []),
      ...internetSearchObservationRefs,
    ]));
    answerIteration.produced_artifacts = Array.from(new Set([
      ...answerIteration.produced_artifacts,
      "internet_search_synthesis_attempt",
    ]));
    const currentDecision = args.payload.agent_step_decision && typeof args.payload.agent_step_decision === "object"
      ? (args.payload.agent_step_decision as HelixAgentStepDecision)
      : null;
    if (
      currentDecision?.decision_id === answerIteration.decision_ref &&
      currentDecision.chosen_capability !== HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY
    ) {
      args.payload.agent_step_decision = {
        ...currentDecision,
        chosen_capability: HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY,
        why_this_capability_satisfies_goal:
          "Internet search observations are present and the required terminal product is internet_search_answer, so the answer step is scoped web evidence synthesis.",
      };
    }
  }
  const existingDraft =
    args.payload.final_answer_draft && typeof args.payload.final_answer_draft === "object"
      ? (args.payload.final_answer_draft as HelixFinalAnswerDraft)
      : null;
  const existingDraftTerminalKind = readAskTurnString((existingDraft as unknown as Record<string, unknown> | null)?.required_terminal_kind);
  const existingTerminalKind = readAskTurnString(args.payload.terminal_artifact_kind);
  const staleCompoundDraft =
    compoundTerminalOverride &&
    (
      existingDraftTerminalKind !== compoundRequiredTerminalKind ||
      existingTerminalKind !== compoundRequiredTerminalKind
    );
  if (
    existingDraft?.composer_trigger_decision_ref &&
    existingDraft.composer_trigger_decision_ref === answerIteration.decision_ref &&
    !staleCompoundDraft
  ) {
    return false;
  }
  const answerDecisionArtifact = artifacts.find((artifact) => artifact.artifact_id === answerIteration.decision_ref);
  const answerDecision =
    answerDecisionArtifact?.payload && typeof answerDecisionArtifact.payload === "object"
      ? (answerDecisionArtifact.payload as HelixAgentStepDecision)
      : args.payload.agent_step_decision && typeof args.payload.agent_step_decision === "object"
        ? (args.payload.agent_step_decision as HelixAgentStepDecision)
        : null;
  const effectiveAnswerDecision =
    repoEvidenceSynthesisStepRequired && answerDecision
      ? {
          ...answerDecision,
          next_step: "answer" as const,
          chosen_capability: HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
          why_this_capability_satisfies_goal:
            "Repo evidence observations are present and the required terminal product is repo_code_evidence_answer, so this is a scoped repo evidence synthesis step.",
        }
      : internetSearchSynthesisStepRequired && answerDecision
        ? {
            ...answerDecision,
            next_step: "answer" as const,
            chosen_capability: HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY,
            why_this_capability_satisfies_goal:
              "Internet search observations are present and the required terminal product is internet_search_answer, so this is a scoped web evidence synthesis step.",
          }
      : answerDecision;
  const scholarlyFallbackText =
    effectiveCanonicalGoalFrame.goal_kind === "scholarly_research_lookup"
      ? buildHelixScholarlyResearchFallbackText({
          prompt: args.transcript,
          artifacts,
        })
      : null;
  const internetSearchFallbackText =
    effectiveCanonicalGoalFrame.goal_kind === "internet_search_lookup"
      ? buildHelixInternetSearchFallbackText({
          prompt: args.transcript,
          artifacts,
        })
      : null;
  const fallbackText = scholarlyFallbackText ?? internetSearchFallbackText ?? buildHelixRuntimeComposerFallbackText({
    prompt: args.transcript,
    payload: args.payload,
    canonicalGoalFrame: effectiveCanonicalGoalFrame,
    artifacts,
  });
  const repoDocsSynthesisPacket = repoEvidenceSynthesisStepRequired
      ? buildRepoDocsSynthesisPacket({
        turnId: args.turnId,
        promptText: args.transcript,
        routeFamily: "repo_evidence",
        artifactLedger: artifacts,
        maxEvidenceItems: 14,
      })
    : null;
  if (repoDocsSynthesisPacket) {
    args.payload.repo_docs_synthesis_packet = repoDocsSynthesisPacket;
    args.payload.repo_docs_synthesis_packet_summary = {
      packet_ref: repoDocsSynthesisPacket.packet_id,
      route_family: repoDocsSynthesisPacket.route_family,
      compact_evidence_count: repoDocsSynthesisPacket.compact_evidence.length,
      source_observation_refs: repoDocsSynthesisPacket.source_observation_refs,
      has_code_evidence: repoDocsSynthesisPacket.evidence_summary.has_code_evidence,
      has_doc_evidence: repoDocsSynthesisPacket.evidence_summary.has_doc_evidence,
      has_test_evidence: repoDocsSynthesisPacket.evidence_summary.has_test_evidence,
      source_target_exact_contract_ref: repoDocsSynthesisPacket.source_target_exact_contract?.contract_id,
      exact_source_terminal_allowed: repoDocsSynthesisPacket.source_target_exact_contract?.terminal_allowed,
    };
    if (repoDocsSynthesisPacket.source_target_exact_contract) {
      args.payload.source_target_exact_contract = repoDocsSynthesisPacket.source_target_exact_contract;
      const sourceTargetIntent =
        args.payload.source_target_intent && typeof args.payload.source_target_intent === "object" && !Array.isArray(args.payload.source_target_intent)
          ? (args.payload.source_target_intent as Record<string, unknown>)
          : null;
      if (sourceTargetIntent) {
        sourceTargetIntent.source_target_exact_contract_ref = repoDocsSynthesisPacket.source_target_exact_contract.contract_id;
        sourceTargetIntent.source_target_exact_contract = repoDocsSynthesisPacket.source_target_exact_contract;
      }
    }
  }
  const repoDocsSynthesisRelevanceGate = repoDocsSynthesisPacket
    ? evaluateRepoEvidenceRelevanceGate({
        turnId: args.turnId,
        concept:
          repoDocsSynthesisPacket.concept ??
          args.canonicalGoalFrame.corpus_anchors?.[0] ??
          args.canonicalGoalFrame.concept_tokens?.[0] ??
          "repo concept",
        query: args.transcript,
        observation: {
          schema: HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
          artifact_id: `${args.turnId}:repo_docs_synthesis_packet_observation`,
          turn_id: args.turnId,
          concept:
            repoDocsSynthesisPacket.concept ??
            args.canonicalGoalFrame.corpus_anchors?.[0] ??
            args.canonicalGoalFrame.concept_tokens?.[0] ??
            "repo concept",
          query: args.transcript,
          normalized_terms: [
            repoDocsSynthesisPacket.concept ??
              args.canonicalGoalFrame.corpus_anchors?.[0] ??
              args.canonicalGoalFrame.concept_tokens?.[0] ??
              "repo concept",
          ],
          search_strategy: {
            exact_terms: [args.transcript],
            symbol_terms: [],
            path_globs_considered: repoDocsSynthesisPacket.compact_evidence.map((entry) => entry.path),
            max_spans: repoDocsSynthesisPacket.compact_evidence.length,
          },
          evidence_refs: repoDocsSynthesisPacket.compact_evidence.map((entry) => entry.ref),
          observations: [],
          spans: repoDocsSynthesisPacket.compact_evidence.map((entry) => {
            const lineMatch = entry.ref.match(/:(\d+)(?:-(\d+))?$/);
            const startLine = lineMatch?.[1] ? Number(lineMatch[1]) : 1;
            const endLine = lineMatch?.[2] ? Number(lineMatch[2]) : startLine;
            return {
              ref: entry.ref,
              path: entry.path,
              start_line: Number.isFinite(startLine) && startLine > 0 ? startLine : 1,
              end_line: Number.isFinite(endLine) && endLine > 0 ? endLine : (Number.isFinite(startLine) && startLine > 0 ? startLine : 1),
              excerpt: entry.excerpt,
              reason: entry.why_relevant,
              source_kind: entry.source_kind === "repo_doc" || entry.source_kind === "docs_source" ? "repo_doc" : "repo_code",
              score: 1,
            };
          }),
          ...(repoDocsSynthesisPacket.source_target_exact_contract
            ? { source_target_exact_contract: repoDocsSynthesisPacket.source_target_exact_contract }
            : {}),
          selected_for_answer: true,
          assistant_answer: false,
          raw_content_included: false,
        } satisfies HelixRepoCodeEvidenceObservation,
        sourceTargetExactContract: repoDocsSynthesisPacket.source_target_exact_contract ?? null,
      })
    : null;
  if (repoDocsSynthesisRelevanceGate) {
    args.payload.repo_evidence_relevance_gate = repoDocsSynthesisRelevanceGate as unknown as Record<string, unknown>;
    if (args.payload.debug && typeof args.payload.debug === "object" && !Array.isArray(args.payload.debug)) {
      (args.payload.debug as Record<string, unknown>).repo_evidence_relevance_gate =
        repoDocsSynthesisRelevanceGate as unknown as Record<string, unknown>;
    }
  }
  const runtimeConversationMemoryPacket =
    args.payload.conversation_memory_packet &&
    typeof args.payload.conversation_memory_packet === "object"
      ? (args.payload.conversation_memory_packet as HelixConversationMemoryPacket)
      : buildHelixConversationMemoryPacket({
          threadId:
            readAskTurnString(args.payload.thread_id) ??
            readAskTurnString(args.payload.threadId) ??
            "helix-ask:desktop",
          currentTurnId: args.turnId,
          sessionId:
            readAskTurnString(args.payload.session_id) ??
            readAskTurnString(args.payload.sessionId) ??
            null,
          promptText: args.transcript,
          allowsPriorArtifacts: false,
        });
  args.payload.conversation_memory_packet = runtimeConversationMemoryPacket;
  const runtimeRollingSessionContextPacket =
    args.payload.rolling_session_context_packet &&
    typeof args.payload.rolling_session_context_packet === "object"
      ? (args.payload.rolling_session_context_packet as HelixRollingSessionContextPacket)
      : process.env.HELIX_ASK_ROLLING_SESSION_CONTEXT === "0"
        ? null
        : buildHelixRollingSessionContextPacket({
            threadId:
              readAskTurnString(args.payload.thread_id) ??
              readAskTurnString(args.payload.threadId) ??
              "helix-ask:desktop",
            currentTurnId: args.turnId,
            sessionId:
              readAskTurnString(args.payload.session_id) ??
              readAskTurnString(args.payload.sessionId) ??
              null,
            promptText: args.transcript,
            conversationMemoryPacket: runtimeConversationMemoryPacket,
            modelContextWindowTokens: HELIX_ASK_LOCAL_CONTEXT_TOKENS,
          });
  if (runtimeRollingSessionContextPacket) {
    args.payload.rolling_session_context_packet = runtimeRollingSessionContextPacket;
    const debug =
      args.payload.debug && typeof args.payload.debug === "object"
        ? (args.payload.debug as Record<string, unknown>)
        : {};
    debug.rolling_session_context_packet = runtimeRollingSessionContextPacket;
    debug.rolling_session_context_selector = buildHelixRollingSessionContextDebug(runtimeRollingSessionContextPacket);
    args.payload.debug = debug;
  }
  const runtimeLanguageContract = syncAskLanguageContractDebugMirrors(args.payload).language_contract;
  let draft = await invokeHelixPostObservationComposerLlm({
    turnId: args.turnId,
    prompt: args.transcript,
    canonicalGoalFrame: effectiveCanonicalGoalFrame,
    goalSatisfactionEvaluation: args.goalSatisfactionEvaluation,
    terminalContract: args.terminalContract ?? args.goalSatisfactionEvaluation?.terminal_contract ?? null,
    selectedArtifacts: artifacts,
    receipts: collectHelixRuntimeComposerReceipts(artifacts),
    coverageArtifacts: collectHelixRuntimeComposerCoverageArtifacts(artifacts),
    toolObservations: collectHelixRuntimeComposerToolObservations(artifacts),
    repoDocsSynthesisPacket,
    languageContract: runtimeLanguageContract,
    conversationMemoryPacket: runtimeConversationMemoryPacket,
    rollingSessionContextPacket: runtimeRollingSessionContextPacket,
    budgetState: args.payload.agent_loop_budget ?? null,
    agentStepLoop: loop,
    answerDecision: effectiveAnswerDecision,
    fallbackText,
    testResponseEnv: "HELIX_RUNTIME_FINAL_ANSWER_TEST_RESPONSE",
  });
  const workspaceStatusSynthesisReady =
    effectiveCanonicalGoalFrame.goal_kind === "workspace_status_diagnostic" &&
    artifacts.some((artifact) => artifact.kind === "workspace_os_status_observation") &&
    String(draft.text ?? "").trim().length > 0;
  if (workspaceStatusSynthesisReady && draft.authority === "deterministic_receipt_fallback") {
    const workspaceSupportRefs = Array.from(new Set([
      ...(
        Array.isArray((draft as unknown as Record<string, unknown>).artifact_refs)
          ? ((draft as unknown as Record<string, unknown>).artifact_refs as unknown[])
              .map(readAskTurnString)
              .filter((entry): entry is string => Boolean(entry))
          : []
      ),
      ...artifacts
        .filter((artifact) => artifact.kind === "workspace_os_status_observation")
        .map((artifact) => artifact.artifact_id),
    ]));
    draft = {
      ...draft,
      goal_kind: "workspace_status_diagnostic",
      required_terminal_kind: "model_synthesized_answer",
      artifact_refs: workspaceSupportRefs,
      support_refs: workspaceSupportRefs,
      evidence_refs: workspaceSupportRefs,
      authority: "deterministic_workspace_status_synthesis",
      synthesis_mode: "workspace_status_observation_synthesis",
    } as unknown as HelixFinalAnswerDraft;
  }
  if (compoundTerminalOverride) {
    const supportRefs = Array.from(new Set([
      ...compoundSynthesisReadiness.support_refs,
      ...(
        Array.isArray((draft as unknown as Record<string, unknown>).support_refs)
          ? ((draft as unknown as Record<string, unknown>).support_refs as unknown[])
              .map(readAskTurnString)
              .filter((entry): entry is string => Boolean(entry))
          : []
      ),
      ...(
        Array.isArray((draft as unknown as Record<string, unknown>).artifact_refs)
          ? ((draft as unknown as Record<string, unknown>).artifact_refs as unknown[])
              .map(readAskTurnString)
              .filter((entry): entry is string => Boolean(entry))
          : []
      ),
    ]));
    draft = {
      ...draft,
      goal_kind: compoundGoalKind,
      required_terminal_kind: compoundRequiredTerminalKind,
      artifact_refs: supportRefs,
      support_refs: supportRefs,
      evidence_refs: supportRefs,
      authority: draft.authority ?? "llm_post_observation_compound_synthesis",
      synthesis_mode: "compound_capability_synthesis",
    } as unknown as HelixFinalAnswerDraft;
  }
  const draftArtifact: HelixTurnArtifact = {
    artifact_id: `${args.turnId}:final_answer_draft`,
    turn_id: args.turnId,
    producer_item_id: "runtime_final_answer_composer",
    kind: "final_answer_draft",
    created_at_ms: Date.now(),
    source_scope: "current_turn",
    goal_hash: hashDebugExportPayloadShort([args.turnId, "runtime_final_answer_composer", answerIteration.decision_ref]),
    payload: draft as unknown as Record<string, unknown>,
  };
  const repoDocsSynthesisPacketArtifact: HelixTurnArtifact | null = repoDocsSynthesisPacket
    ? {
        artifact_id: repoDocsSynthesisPacket.packet_id,
        turn_id: args.turnId,
        producer_item_id: "repo_docs_synthesis_packet_builder",
        kind: "repo_docs_synthesis_packet",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_docs_synthesis_packet", repoDocsSynthesisPacket.compact_evidence.length]),
        payload: repoDocsSynthesisPacket as unknown as Record<string, unknown>,
      }
    : null;
  const repoDocsSynthesisRelevanceGateArtifact: HelixTurnArtifact | null = repoDocsSynthesisRelevanceGate
    ? {
        artifact_id: `${args.turnId}:repo_evidence_relevance_gate`,
        turn_id: args.turnId,
        producer_item_id: "repo_docs_synthesis_packet_builder",
        kind: "repo_evidence_relevance_gate",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_evidence_relevance_gate", repoDocsSynthesisRelevanceGate.coverage]),
        payload: repoDocsSynthesisRelevanceGate as unknown as Record<string, unknown>,
      }
    : null;
  args.payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
    ...artifacts.filter((artifact) =>
      artifact.artifact_id !== draftArtifact.artifact_id &&
      artifact.artifact_id !== repoDocsSynthesisPacketArtifact?.artifact_id &&
      artifact.artifact_id !== repoDocsSynthesisRelevanceGateArtifact?.artifact_id
    ),
    ...(repoDocsSynthesisPacketArtifact ? [repoDocsSynthesisPacketArtifact] : []),
    ...(repoDocsSynthesisRelevanceGateArtifact ? [repoDocsSynthesisRelevanceGateArtifact] : []),
    draftArtifact,
  ]);
  args.payload.final_answer_draft = draft;
  args.payload.model_context_economy_report = draft.model_context_economy_report;
  args.payload.compact_observation_refs = draft.compact_observation_refs;
  let compoundSynthesisMaterializerResult: Record<string, unknown> | null = null;
  let compoundMaterializedTerminalKind: string | null = null;
  if (compoundTerminalOverride) {
    const routeProductContract =
      args.payload.route_product_contract &&
      typeof args.payload.route_product_contract === "object" &&
      !Array.isArray(args.payload.route_product_contract)
        ? {
            ...(args.payload.route_product_contract as Record<string, unknown>),
            allowed_terminal_artifact_kinds: Array.from(new Set([
              ...(
                Array.isArray((args.payload.route_product_contract as Record<string, unknown>).allowed_terminal_artifact_kinds)
                  ? ((args.payload.route_product_contract as Record<string, unknown>).allowed_terminal_artifact_kinds as unknown[])
                      .map(readAskTurnString)
                      .filter((entry): entry is string => Boolean(entry))
                  : []
              ),
              "final_answer_draft",
              "model_synthesized_answer",
              ...(compoundRequiredTerminalKind ? [compoundRequiredTerminalKind] : []),
            ])),
          }
        : {
            allowed_terminal_artifact_kinds: Array.from(new Set([
              "final_answer_draft",
              "model_synthesized_answer",
              ...(compoundRequiredTerminalKind ? [compoundRequiredTerminalKind] : []),
            ])),
          };
    const terminalMaterialized = materializeFinalAnswerDraftTerminal({
      turnId: args.turnId,
      payload: args.payload,
      artifactLedger: Array.isArray(args.payload.current_turn_artifact_ledger)
        ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : [],
      routeProductContract,
      finalAnswerDraftRef: draftArtifact.artifact_id,
    });
    compoundSynthesisMaterializerResult = terminalMaterialized as Record<string, unknown> | null;
    args.payload.compound_synthesis_materializer_result = compoundSynthesisMaterializerResult;
    compoundMaterializedTerminalKind = readAskTurnString(terminalMaterialized?.materialized_terminal_artifact_kind);
    if (terminalMaterialized?.ok) {
      delete args.payload.terminal_error_code;
      delete args.payload.terminal_failure_text;
    }
    if (args.payload.debug && typeof args.payload.debug === "object" && !Array.isArray(args.payload.debug)) {
      (args.payload.debug as Record<string, unknown>).compound_synthesis_materializer_result =
        compoundSynthesisMaterializerResult;
    }
  }
  let repoEvidenceQualityGateOk = true;
  let repoEvidenceTerminalErrorCode: string | null = null;
  if (repoEvidenceGoalFrame) {
    const observationRefs = repoEvidenceObservationRefs;
    const supportRefs = Array.from(new Set([
      ...collectHelixRuntimeRepoEvidenceSupportRefs(artifacts),
      ...(repoDocsSynthesisPacket ? collectRepoDocsSynthesisPacketSupportRefs(repoDocsSynthesisPacket) : []),
    ])).slice(0, 12);
    const synthesisAttemptId = `${args.turnId}:repo_evidence_synthesis_attempt`;
    const repoAnswerArtifactId = `${args.turnId}:repo_code_evidence_answer`;
    const writeRepoEvidenceAnswerForDraft = (activeDraft: HelixFinalAnswerDraft): void => {
      const repoSynthesisAuthority =
        activeDraft.authority === "llm_post_observation_composer" ||
        (
          activeDraft.authority === "deterministic_repo_evidence_synthesis" &&
          Boolean(repoDocsSynthesisPacket?.compact_evidence.length)
        );
      if (!repoSynthesisAuthority) {
        delete args.payload.repo_code_evidence_answer;
        return;
      }
      args.payload.repo_code_evidence_answer = {
        schema: "helix.repo_code_evidence_answer.v1",
        artifact_id: repoAnswerArtifactId,
        turn_id: args.turnId,
        concept: args.canonicalGoalFrame.corpus_anchors?.[0] ?? args.canonicalGoalFrame.concept_tokens?.[0] ?? "repo concept",
        answer_text: activeDraft.text,
        final_answer_draft_ref: draftArtifact.artifact_id,
        final_answer_draft_authority: activeDraft.authority,
        model_step_capability: HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
        model_authored: activeDraft.authority === "llm_post_observation_composer",
        synthesis_mode: activeDraft.authority,
        synthesis_attempt_ref: synthesisAttemptId,
        source_observation_refs: observationRefs,
        support_refs: supportRefs,
        source_target_exact_contract_ref: repoDocsSynthesisPacket?.source_target_exact_contract?.contract_id,
        uncertainty: [],
        evidence_observation_ref: observationRefs[0] ?? "",
        raw_spans_debug_ref: observationRefs[0] ?? "",
        assistant_answer: Boolean("repo_code_evidence_answer_terminal"),
        raw_content_included: false,
      };
      if (repoDocsSynthesisPacket) {
        args.payload.final_answer_draft = attachSynthesisSupportRefs({
          draft: activeDraft as unknown as Record<string, unknown>,
          packet: repoDocsSynthesisPacket,
          observation: artifacts
            .filter((artifact) => artifact.kind === "repo_code_evidence_observation")
            .map((artifact) => readAskTurnArtifactPayloadRecord(artifact))
            .find((entry): entry is Record<string, unknown> => Boolean(entry)) ?? null,
        }) as unknown as HelixFinalAnswerDraft;
      } else {
        args.payload.final_answer_draft = activeDraft;
      }
    };
    writeRepoEvidenceAnswerForDraft(draft);
    let qualityGate = evaluateRepoAnswerTextQualityGate({
      turnId: args.turnId,
      answerRef: repoAnswerArtifactId,
      answerText: draft.text,
      payload: args.payload,
    });
    const firstAttemptStatus = classifyRepoDocsSynthesisAttemptStatus({
      ok: qualityGate.ok,
      violations: qualityGate.violations,
      staleFallbackText: isHelixRepoEvidenceStaleFallbackText(draft.text),
    });
    const firstAttemptQualityViolations = [...qualityGate.violations];
    const stepIdentityRepairObservation =
      repoEvidenceSynthesisStepRequired && answerDecision?.chosen_capability === "model.direct_answer"
        ? {
            schema: HELIX_REPO_SYNTHESIS_STEP_IDENTITY_REPAIR_SCHEMA,
            turn_id: args.turnId,
            observation_id: `${args.turnId}:repo_synthesis_step_identity_repair`,
            rejected_capability: "model.direct_answer",
            required_capability: HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
            required_terminal_kind: "repo_code_evidence_answer",
            reason: "repo_evidence_observation_present",
            assistant_answer: false,
            raw_content_included: false,
          }
        : null;
    if (stepIdentityRepairObservation) {
      args.payload.repo_synthesis_step_identity_repair = stepIdentityRepairObservation;
    }
    let repairObservation: Record<string, unknown> | null = !qualityGate.ok
      ? {
          schema: "helix.repo_evidence_synthesis_repair_observation.v1",
          observation_id: `${args.turnId}:repo_evidence_synthesis_repair_observation`,
          turn_id: args.turnId,
          failed_attempt_ref: synthesisAttemptId,
          source_observation_refs: observationRefs,
          repair_reason: qualityGate.violations.includes("empty_answer")
            ? "empty_answer"
            : qualityGate.violations.includes("canned_fallback_text")
              ? "canned_fallback_text"
              : qualityGate.violations.includes("renderer_hostile_text")
                ? "renderer_hostile_answer"
                : qualityGate.violations.includes("missing_support_refs")
                  ? "missing_support_refs"
                  : qualityGate.violations.includes("unsupported_repo_claim")
                    ? "unsupported_claims"
                    : qualityGate.violations.includes("policy_claim_inversion")
                      ? "policy_claim_inversion"
                  : "excerpt_like_answer",
          instruction_to_model: buildRepoDocsSynthesisRepairInstruction({
            violations: qualityGate.violations,
            packet: repoDocsSynthesisPacket,
          }),
          assistant_answer: false,
          raw_content_included: false,
        }
      : null;
    let repairAttempted = false;
    let retryStatus: string | null = null;
    let retryQualityViolations: string[] = [];
    if (!qualityGate.ok && repairObservation && repoDocsSynthesisPacket) {
      repairAttempted = true;
      const repairedDraft = await invokeHelixPostObservationComposerLlm({
        turnId: args.turnId,
        prompt: args.transcript,
        canonicalGoalFrame: args.canonicalGoalFrame,
        goalSatisfactionEvaluation: args.goalSatisfactionEvaluation,
        terminalContract: args.terminalContract ?? args.goalSatisfactionEvaluation?.terminal_contract ?? null,
        selectedArtifacts: artifacts,
        receipts: collectHelixRuntimeComposerReceipts(artifacts),
        coverageArtifacts: collectHelixRuntimeComposerCoverageArtifacts(artifacts),
        toolObservations: collectHelixRuntimeComposerToolObservations(artifacts),
        repoDocsSynthesisPacket,
        repoDocsRepairInstruction: readAskTurnString(repairObservation.instruction_to_model),
        languageContract: runtimeLanguageContract,
        conversationMemoryPacket: runtimeConversationMemoryPacket,
        rollingSessionContextPacket: runtimeRollingSessionContextPacket,
        budgetState: args.payload.agent_loop_budget ?? null,
        agentStepLoop: loop,
        answerDecision: effectiveAnswerDecision,
        fallbackText,
        testResponseEnv: "HELIX_RUNTIME_FINAL_ANSWER_REPAIR_TEST_RESPONSE",
      });
      draft = repairedDraft;
      draftArtifact.payload = repairedDraft as unknown as Record<string, unknown>;
      args.payload.final_answer_draft = repairedDraft;
      writeRepoEvidenceAnswerForDraft(repairedDraft);
      qualityGate = evaluateRepoAnswerTextQualityGate({
        turnId: args.turnId,
        answerRef: repoAnswerArtifactId,
        answerText: repairedDraft.text,
        payload: args.payload,
      });
      retryStatus = classifyRepoDocsSynthesisAttemptStatus({
        ok: qualityGate.ok,
        violations: qualityGate.violations,
        staleFallbackText: isHelixRepoEvidenceStaleFallbackText(repairedDraft.text),
      });
      retryQualityViolations = [...qualityGate.violations];
      args.payload.repo_docs_synthesis_repair = {
        schema: "helix.repo_docs_synthesis_repair.v1",
        turn_id: args.turnId,
        attempted: true,
        reason: readAskTurnString(repairObservation.repair_reason) ?? "repo_docs_synthesis_quality_failed",
        first_attempt_status: firstAttemptStatus,
        first_attempt_quality_violations: firstAttemptQualityViolations,
        retry_status: retryStatus,
        retry_quality_violations: retryQualityViolations,
        retry_succeeded: qualityGate.ok,
        repaired_final_answer_draft_ref: draftArtifact.artifact_id,
        assistant_answer: false,
        raw_content_included: false,
      };
    } else if (repairObservation) {
      args.payload.repo_docs_synthesis_repair = {
        schema: "helix.repo_docs_synthesis_repair.v1",
        turn_id: args.turnId,
        attempted: false,
        reason: readAskTurnString(repairObservation.repair_reason) ?? "repo_docs_synthesis_quality_failed",
        first_attempt_status: firstAttemptStatus,
        first_attempt_quality_violations: firstAttemptQualityViolations,
        retry_status: null,
        retry_quality_violations: [],
        retry_succeeded: false,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const finalAttemptStatus = classifyRepoDocsSynthesisAttemptStatus({
      ok: qualityGate.ok,
      violations: qualityGate.violations,
      staleFallbackText: isHelixRepoEvidenceStaleFallbackText(draft.text),
    });
    repoEvidenceQualityGateOk = qualityGate.ok;
    repoEvidenceTerminalErrorCode = qualityGate.ok
      ? null
      : repoDocsSynthesisTerminalErrorCode({
          status: finalAttemptStatus,
          repairAttempted,
          violations: qualityGate.violations,
        });
    if (!qualityGate.ok) {
      delete args.payload.repo_code_evidence_answer;
    }
    const synthesisAttempt = {
      schema: "helix.repo_evidence_synthesis_attempt.v1",
      attempt_id: synthesisAttemptId,
      turn_id: args.turnId,
      route_family: "repo_evidence",
      packet_ref: repoDocsSynthesisPacket?.packet_id,
        source_observation_refs: observationRefs,
      source_target_exact_contract_ref: repoDocsSynthesisPacket?.source_target_exact_contract?.contract_id,
      model_input_refs: [
        ...(answerIteration.decision_ref ? [answerIteration.decision_ref] : []),
        `${args.turnId}:agent_runtime_loop`,
        ...(repoDocsSynthesisPacket ? [repoDocsSynthesisPacket.packet_id] : []),
        ...observationRefs,
      ],
      produced_final_answer_draft_ref: draftArtifact.artifact_id,
      produced_repo_code_evidence_answer_ref: qualityGate.ok ? repoAnswerArtifactId : undefined,
      model_invoked: true,
      model_step_kind: "post_observation_synthesis",
      model_step_capability: HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY,
      required_terminal_kind: "repo_code_evidence_answer",
      status: finalAttemptStatus,
      first_attempt_status: firstAttemptStatus,
      first_attempt_quality_violations: firstAttemptQualityViolations,
      repair_attempted: repairAttempted,
      retry_status: retryStatus,
      retry_quality_violations: retryQualityViolations,
      quality_violations: qualityGate.violations,
      assistant_answer: false,
      raw_content_included: false,
    };
    const currentLedger = Array.isArray(args.payload.current_turn_artifact_ledger)
      ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const repoEvidenceAnswerPayload =
      qualityGate.ok &&
      args.payload.repo_code_evidence_answer &&
      typeof args.payload.repo_code_evidence_answer === "object" &&
      !Array.isArray(args.payload.repo_code_evidence_answer)
        ? (args.payload.repo_code_evidence_answer as Record<string, unknown>)
        : null;
    args.payload.repo_answer_text_quality_gate = qualityGate as unknown as Record<string, unknown>;
    args.payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
      ...currentLedger.filter((artifact) => ![
        `${args.turnId}:repo_code_evidence_answer`,
        `${args.turnId}:repo_evidence_synthesis_attempt`,
        `${args.turnId}:repo_answer_text_quality_gate`,
        `${args.turnId}:repo_evidence_synthesis_repair_observation`,
        `${args.turnId}:repo_synthesis_step_identity_repair`,
      ].includes(artifact.artifact_id)),
      ...(repoEvidenceAnswerPayload
        ? [{
            artifact_id: repoAnswerArtifactId,
            turn_id: args.turnId,
            producer_item_id: "runtime_final_answer_composer",
            kind: "repo_code_evidence_answer",
            created_at_ms: Date.now(),
            source_scope: "current_turn",
            goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_code_evidence_answer", draft.authority]),
            payload: repoEvidenceAnswerPayload,
          } satisfies HelixTurnArtifact]
        : []),
      {
        artifact_id: synthesisAttemptId,
        turn_id: args.turnId,
        producer_item_id: "runtime_final_answer_composer",
        kind: "repo_evidence_synthesis_attempt",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_evidence_synthesis_attempt", draft.authority]),
        payload: synthesisAttempt,
      },
      {
        artifact_id: `${args.turnId}:repo_answer_text_quality_gate`,
        turn_id: args.turnId,
        producer_item_id: "runtime_final_answer_composer",
        kind: "repo_answer_text_quality_gate",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_answer_text_quality_gate", qualityGate.ok]),
        payload: qualityGate as unknown as Record<string, unknown>,
      },
      ...(repairObservation
        ? [{
            artifact_id: `${args.turnId}:repo_evidence_synthesis_repair_observation`,
            turn_id: args.turnId,
            producer_item_id: "runtime_final_answer_composer",
            kind: "repo_evidence_synthesis_repair_observation",
            created_at_ms: Date.now(),
            source_scope: "current_turn",
            goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_evidence_synthesis_repair_observation", repairObservation.repair_reason]),
            payload: repairObservation,
          } satisfies HelixTurnArtifact]
        : []),
      ...(stepIdentityRepairObservation
        ? [{
            artifact_id: `${args.turnId}:repo_synthesis_step_identity_repair`,
            turn_id: args.turnId,
            producer_item_id: "runtime_final_answer_composer",
            kind: "repo_synthesis_step_identity_repair",
            created_at_ms: Date.now(),
            source_scope: "current_turn",
            goal_hash: hashDebugExportPayloadShort([args.turnId, "repo_synthesis_step_identity_repair", stepIdentityRepairObservation.required_capability]),
            payload: stepIdentityRepairObservation,
          } satisfies HelixTurnArtifact]
        : []),
    ]);
  }
  args.payload.runtime_final_answer_composer = {
    schema: "helix.runtime_final_answer_composer.v1",
    turn_id: args.turnId,
    composer_ref: draftArtifact.artifact_id,
    answer_decision_ref: answerIteration.decision_ref,
    answer_iteration: answerIteration.iteration,
    final_answer_generated_after_model_answer_decision: true,
    preserved_concise_receipt_text: isHelixRuntimeConciseReceiptTerminal(args.payload),
    assistant_answer: false,
    raw_content_included: false,
  };
  const shouldPreserveConciseReceipt = isHelixRuntimeConciseReceiptTerminal(args.payload);
  const terminalIsFailure =
    readAskTurnString(args.payload.terminal_artifact_kind) === "typed_failure" ||
    readAskTurnString(args.payload.final_answer_source) === "typed_failure";
  const goalSatisfiedForTerminal =
    args.goalSatisfactionEvaluation?.satisfaction === "satisfied" &&
    args.goalSatisfactionEvaluation?.next_decision === "allow_terminal";
  const compoundGoalSatisfiedForTerminal =
    compoundTerminalOverride &&
    compoundSynthesisMaterializerResult?.ok === true;
  const repoEvidenceTerminalAllowed = !repoEvidenceGoalFrame || repoEvidenceQualityGateOk;
  const interimVoiceCalloutStatusTerminal =
    effectiveCanonicalGoalFrame.goal_kind === "live_environment_review" &&
    isInterimVoiceCalloutFinalStatus(readLatestInterimVoiceCalloutToolResult(
      Array.isArray(args.payload.current_turn_artifact_ledger)
        ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : artifacts,
    )?.receiptStatus ?? null);
  const currentArtifactsForTerminal = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : artifacts;
  const workspaceStatusTerminalReady =
    effectiveCanonicalGoalFrame.goal_kind === "workspace_status_diagnostic" &&
    currentArtifactsForTerminal.some((artifact) => artifact.kind === "workspace_os_status_observation") &&
    draft.text.trim().length > 0;
  if (!repoEvidenceTerminalAllowed) {
    const failureText =
      repoEvidenceTerminalErrorCode === "repo_docs_synthesis_excerpt_like_after_repair"
        ? "I could not synthesize a repo/docs answer because the evidence-backed draft was still excerpt-like after repair."
        : repoEvidenceTerminalErrorCode === "repo_docs_synthesis_file_inventory_after_repair"
          ? "I could not synthesize a repo/docs answer because the evidence-backed draft was still a file inventory after repair."
          : repoEvidenceTerminalErrorCode === "repo_docs_synthesis_policy_claim_inversion_after_repair"
            ? "I could not synthesize a repo/docs answer because the evidence-backed draft still inverted an authority claim after repair."
          : "I could not synthesize a supported repo/docs answer from the current evidence packet.";
    args.payload.answer = failureText;
    args.payload.text = failureText;
    args.payload.assistant_answer = failureText;
    args.payload.selected_final_answer = failureText;
    args.payload.final_answer_source = "typed_failure";
    args.payload.final_status = "failed";
    args.payload.response_type = "typed_failure";
    args.payload.terminal_artifact_kind = "typed_failure";
    args.payload.terminal_error_code = repoEvidenceTerminalErrorCode ?? "repo_docs_synthesis_quality_failed";
    args.payload.terminal_presentation = {
      ...(args.payload.terminal_presentation && typeof args.payload.terminal_presentation === "object"
        ? (args.payload.terminal_presentation as Record<string, unknown>)
        : {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: args.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: failureText,
      assistant_answer: false,
      raw_content_included: false,
    };
  } else if (
    !shouldPreserveConciseReceipt &&
    (!terminalIsFailure || goalSatisfiedForTerminal || compoundGoalSatisfiedForTerminal || workspaceStatusTerminalReady) &&
    draft.text.trim()
  ) {
    args.payload.answer = draft.text;
    args.payload.text = draft.text;
    args.payload.assistant_answer = draft.text;
    args.payload.selected_final_answer = draft.text;
    args.payload.final_answer_source = interimVoiceCalloutStatusTerminal
      ? "final_answer_draft"
      : effectiveCanonicalGoalFrame.answer_scope === "model_only"
      ? "model_direct_answer"
      : repoEvidenceGoalFrame
        ? "model_synthesis_from_repo_evidence"
        : "final_answer_draft";
    args.payload.final_status = "final_answer";
    args.payload.response_type = "final_answer";
    delete args.payload.terminal_error_code;
    if (interimVoiceCalloutStatusTerminal) {
      args.payload.terminal_artifact_kind = "model_synthesized_answer";
    } else if (effectiveCanonicalGoalFrame.answer_scope === "model_only") {
      args.payload.terminal_artifact_kind = "direct_answer_text";
    } else if (compoundTerminalOverride) {
      args.payload.terminal_artifact_kind =
        compoundMaterializedTerminalKind ?? compoundRequiredTerminalKind;
    } else {
      args.payload.terminal_artifact_kind =
        effectiveCanonicalGoalFrame.goal_kind === "repo_code_evidence_question" ||
        effectiveCanonicalGoalFrame.goal_kind === "repo_entity_definition" ||
        effectiveCanonicalGoalFrame.required_terminal_kind === "repo_code_evidence_observation"
          ? "repo_code_evidence_answer"
          : effectiveCanonicalGoalFrame.required_terminal_kind;
    }
    args.payload.terminal_presentation = {
      ...(args.payload.terminal_presentation && typeof args.payload.terminal_presentation === "object"
        ? (args.payload.terminal_presentation as Record<string, unknown>)
        : {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: args.turnId,
      terminal_artifact_kind: args.payload.terminal_artifact_kind,
      concise_text: draft.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    const composerThreadId =
      readAskTurnString(args.payload.thread_id) ??
      readAskTurnString(args.payload.threadId) ??
      "helix-ask:desktop";
    if (args.goalSatisfactionEvaluation) {
      args.payload.goal_satisfaction_evaluation = args.goalSatisfactionEvaluation as unknown as Record<string, unknown>;
    }
    const composerTerminalEnvelope = resolveTerminalAnswerEnvelope(args.payload, {
      threadId: composerThreadId,
      turnId: args.turnId,
    });
    applyTerminalAnswerEnvelope(args.payload, composerTerminalEnvelope);
    const finalComposerTerminalKind =
      readAskTurnString(args.payload.terminal_artifact_kind) ?? effectiveCanonicalGoalFrame.required_terminal_kind;
    const finalComposerAnswerSource =
      readAskTurnString(args.payload.final_answer_source) ?? "final_answer_draft";
    const finalComposerRoute =
      effectiveCanonicalGoalFrame.goal_kind === "live_environment_review"
        ? "live_environment_review"
        : readAskTurnString(args.payload.route_reason_code) ??
          readAskTurnString(args.payload.route) ??
          "helix_ask_turn";
    if (effectiveCanonicalGoalFrame.goal_kind === "live_environment_review") {
      args.payload.route_reason_code = finalComposerRoute;
      args.payload.route = finalComposerRoute;
    }
    const composerSourceTargetIntent =
      args.payload.source_target_intent && typeof args.payload.source_target_intent === "object"
        ? (args.payload.source_target_intent as Record<string, unknown>)
        : arbitrateAskSourceTarget({
            turnId: args.turnId,
            threadId: composerThreadId,
            promptText: args.transcript,
          });
    args.payload.source_target_intent = composerSourceTargetIntent;
    const composerRouteProductContractBase =
      args.payload.route_product_contract && typeof args.payload.route_product_contract === "object"
        ? (args.payload.route_product_contract as Record<string, unknown>)
        : buildRouteProductContract({
            turnId: args.turnId,
            threadId: composerThreadId,
            sourceTargetIntent: composerSourceTargetIntent,
            promptText: args.transcript,
          });
    const composerRouteProductContract = compoundTerminalOverride
      ? {
          ...composerRouteProductContractBase,
          allowed_terminal_artifact_kinds: Array.from(new Set([
            ...(
              Array.isArray(composerRouteProductContractBase.allowed_terminal_artifact_kinds)
                ? (composerRouteProductContractBase.allowed_terminal_artifact_kinds as unknown[])
                    .map(readAskTurnString)
                    .filter((entry): entry is string => Boolean(entry))
                : []
            ),
            "final_answer_draft",
            "model_synthesized_answer",
            ...(compoundRequiredTerminalKind ? [compoundRequiredTerminalKind] : []),
          ])),
        }
      : composerRouteProductContractBase;
    args.payload.route_product_contract = composerRouteProductContract;
    const composerToolAdmissionDecision =
      args.payload.tool_call_admission_decision && typeof args.payload.tool_call_admission_decision === "object"
        ? (args.payload.tool_call_admission_decision as Record<string, unknown>)
        : buildToolCallAdmissionDecision({
            turnId: args.turnId,
            sourceTargetIntent: composerSourceTargetIntent,
            routeProductContract: composerRouteProductContract,
            promptText: args.transcript,
          });
    args.payload.tool_call_admission_decision = composerToolAdmissionDecision;
    const composerTerminalSelectionGuard = guardTerminalArtifactSelection({
      contract: composerRouteProductContract,
      terminalArtifactKind: finalComposerTerminalKind,
    });
    args.payload.terminal_artifact_selection_guard = composerTerminalSelectionGuard;
    args.payload.product_authority_guard = guardProductAuthority({
      sourceTargetIntent: composerSourceTargetIntent,
      toolCallAdmissionDecision: composerToolAdmissionDecision,
      routeProductContract: composerRouteProductContract,
      terminalArtifactSelectionGuard: composerTerminalSelectionGuard,
      terminalArtifactKind: finalComposerTerminalKind,
    });
    args.payload.route_authority_audit = auditRouteAuthority({
      turnId: args.turnId,
      promptText: args.transcript,
      selectedRoute: finalComposerRoute,
      payload: args.payload,
      terminalArtifactKind: finalComposerTerminalKind,
      finalAnswerSource: finalComposerAnswerSource,
      sourceTargetIntent: composerSourceTargetIntent,
      routeProductContract: composerRouteProductContract,
      toolCallAdmissionDecision: composerToolAdmissionDecision,
      terminalArtifactSelectionGuard: composerTerminalSelectionGuard,
      productAuthorityGuard: args.payload.product_authority_guard as Record<string, unknown>,
      committedAskRoute: args.payload.committed_ask_route as Record<string, unknown>,
    });
    args.payload.terminal_answer_authority = recordHelixTurnTerminalAuthority({
      thread_id: composerThreadId,
      turn_id: args.turnId,
      final_answer_source: finalComposerAnswerSource,
      terminal_artifact_kind: finalComposerTerminalKind,
      terminal_text: composerTerminalEnvelope.terminal_text,
      route: finalComposerRoute,
    });
    args.payload.poison_audit = auditHelixAskContextForPoison({
      thread_id: composerThreadId,
      turn_id: args.turnId,
      payload: args.payload,
      terminal_authority: args.payload.terminal_answer_authority as Record<string, unknown>,
      client_visible_text: composerTerminalEnvelope.terminal_text,
    });
    args.payload.loop_parity_trace = buildLoopParityTrace({
      turnId: args.turnId,
      promptText: args.transcript,
      selectedRoute: finalComposerRoute,
      terminalArtifactKind: finalComposerTerminalKind,
      finalAnswerSource: finalComposerAnswerSource,
      payload: args.payload,
    });
    args.payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.transcript,
      selectedRoute: finalComposerRoute,
      terminalArtifactKind: finalComposerTerminalKind,
      finalAnswerSource: finalComposerAnswerSource,
      payload: args.payload,
      loopParityTrace: args.payload.loop_parity_trace as Record<string, unknown>,
    });
    maybeRecordStagePlayAskCheckpointReceipt({
      payload: args.payload,
      turnId: args.turnId,
      artifacts,
      finalAnswerDraft: draft,
      finalAnswerDraftRef: draftArtifact.artifact_id,
    });
  }
  const refreshedArtifacts = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const refreshedPromptCoverage = buildHelixPromptRequirementCoverage({
    turnId: args.turnId,
    prompt: args.transcript,
    canonicalGoalFrame: effectiveCanonicalGoalFrame,
    payload: args.payload,
    artifacts: refreshedArtifacts,
  });
  if (refreshedPromptCoverage) {
    const coverageArtifact: HelixTurnArtifact = {
      artifact_id: `${args.turnId}:prompt_requirement_coverage`,
      turn_id: args.turnId,
      producer_item_id: "prompt_requirement_coverage",
      kind: "prompt_requirement_coverage",
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      goal_hash: hashDebugExportPayloadShort([args.turnId, "runtime_final_answer_composer", "prompt_requirement_coverage", refreshedPromptCoverage.coverage]),
      payload: refreshedPromptCoverage as unknown as Record<string, unknown>,
    };
    args.payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
      ...refreshedArtifacts.filter((artifact) => artifact.kind !== "prompt_requirement_coverage"),
      coverageArtifact,
    ]);
    args.payload.prompt_requirement_coverage = refreshedPromptCoverage;
  }
  const artifactsAfterPromptCoverage = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : refreshedArtifacts;
  const refreshedDocCoverage = buildHelixDocRetrievalCoverage({
    turnId: args.turnId,
    prompt: args.transcript,
    canonicalGoalFrame: effectiveCanonicalGoalFrame,
    payload: args.payload,
    artifacts: artifactsAfterPromptCoverage,
  });
  if (refreshedDocCoverage) {
    const coverageArtifact: HelixTurnArtifact = {
      artifact_id: `${args.turnId}:doc_retrieval_coverage`,
      turn_id: args.turnId,
      producer_item_id: "doc_retrieval_coverage",
      kind: "doc_retrieval_coverage",
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      goal_hash: hashDebugExportPayloadShort([args.turnId, "runtime_final_answer_composer", "doc_retrieval_coverage", refreshedDocCoverage.coverage]),
      payload: refreshedDocCoverage as unknown as Record<string, unknown>,
    };
    args.payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
      ...artifactsAfterPromptCoverage.filter((artifact) => artifact.kind !== "doc_retrieval_coverage"),
      coverageArtifact,
    ]);
    args.payload.doc_retrieval_coverage = refreshedDocCoverage;
  }
  if (args.payload.debug && typeof args.payload.debug === "object") {
    const debug = args.payload.debug as Record<string, unknown>;
    debug.final_answer_draft = draft;
    debug.model_context_economy_report = draft.model_context_economy_report;
    debug.compact_observation_refs = draft.compact_observation_refs;
    if (repoDocsSynthesisPacket) {
      debug.repo_docs_synthesis_packet = repoDocsSynthesisPacket;
      debug.repo_docs_synthesis_packet_summary = args.payload.repo_docs_synthesis_packet_summary;
    }
    if (args.payload.repo_answer_text_quality_gate) {
      debug.repo_answer_text_quality_gate = args.payload.repo_answer_text_quality_gate;
    }
    if (args.payload.repo_code_evidence_answer) {
      debug.repo_code_evidence_answer = args.payload.repo_code_evidence_answer;
    }
    debug.runtime_final_answer_composer = args.payload.runtime_final_answer_composer;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
    debug.route_authority_audit = args.payload.route_authority_audit;
    debug.terminal_answer_authority = args.payload.terminal_answer_authority;
    debug.poison_audit = args.payload.poison_audit;
    debug.loop_parity_trace = args.payload.loop_parity_trace;
    debug.ask_turn_solver_trace = args.payload.ask_turn_solver_trace;
    if (refreshedPromptCoverage) debug.prompt_requirement_coverage = refreshedPromptCoverage;
    if (refreshedDocCoverage) debug.doc_retrieval_coverage = refreshedDocCoverage;
    if (!shouldPreserveConciseReceipt && (!terminalIsFailure || goalSatisfiedForTerminal || compoundGoalSatisfiedForTerminal) && draft.text.trim()) {
      debug.selected_final_answer = draft.text;
      debug.final_answer_source = interimVoiceCalloutStatusTerminal
        ? "final_answer_draft"
        : effectiveCanonicalGoalFrame.answer_scope === "model_only"
        ? "model_direct_answer"
        : repoEvidenceGoalFrame
          ? "model_synthesis_from_repo_evidence"
          : effectiveCanonicalGoalFrame.goal_kind === "internet_search_lookup"
            ? "model_synthesis_from_internet_search"
          : "final_answer_draft";
      debug.final_status = "final_answer";
      debug.response_type = "final_answer";
      delete debug.terminal_error_code;
      if (interimVoiceCalloutStatusTerminal) {
        debug.terminal_artifact_kind = "model_synthesized_answer";
      } else if (effectiveCanonicalGoalFrame.answer_scope === "model_only") {
        debug.terminal_artifact_kind = "direct_answer_text";
      } else if (compoundTerminalOverride) {
        debug.terminal_artifact_kind =
          compoundMaterializedTerminalKind ?? compoundRequiredTerminalKind;
      } else {
        debug.terminal_artifact_kind = repoEvidenceGoalFrame
          ? "repo_code_evidence_answer"
          : effectiveCanonicalGoalFrame.required_terminal_kind;
      }
    }
  }
  return true;
};



  return {
    isHelixRuntimeRepoEvidenceGoalFrame,
    collectHelixRuntimeRepoEvidenceObservationRefs,
    hasHelixRuntimeRepoEvidenceObservation,
    collectHelixRuntimeRepoEvidenceSupportRefs,
    isHelixRepoEvidenceStaleFallbackText,
    isStagePlayPostObservationSynthesisText,
    stagePlayModelAnswerConflictsWithReceipt,
    buildHelixRuntimeComposerFallbackText,
    hasHelixCodexStyleToolObservationReentry,
    hasHelixCodexStyleToolObservationReentryArtifact,
    hasHelixFinalAnswerDraftSelectionCandidate,
    hasHelixWorkstationToolEvaluationTerminalCandidate,
    shouldApplyHelixTerminalDraftSelectionGate,
    shouldApplyHelixTerminalDraftSelectionGateForPayload,
    shouldApplyCompletedCompoundTerminalSingleWriterBridge,
    shouldApplyHelixTerminalSingleWriterForPayload,
    readHelixCodexStyleToolReentryFinalTextFromArtifacts,
    isHelixRuntimeConciseReceiptTerminal,
    applyHelixRuntimeFinalAnswerComposerToPayload,
  };
};

export type HelixRuntimeFinalAnswerComposer = ReturnType<typeof createHelixRuntimeFinalAnswerComposer>;
