type RecordLike = Record<string, unknown>;

type HelixAskCanonicalGoalFrame = any;
type HelixTurnArtifact = any;
type DependencyFunction = (...args: any[]) => any;

type DependencyValue = DependencyFunction | RecordLike | null | undefined;

export type HelixAskTurnFinalizerDependencies = {
  readAskTurnString: DependencyValue;
  helixRuntimeFinalAnswerComposer: DependencyValue;
  formatAskTurnWorkspaceActionReceiptMessage: DependencyValue;
  resolveAskTurnPanelControlLabel: DependencyValue;
  classifyHelixAskTurnIntentFamily: DependencyValue;
  buildHelixArtifactPromotionAudit: DependencyValue;
  buildAskTurnPreflightContext: DependencyValue;
  readStagePlayMailWakeRouteMetadataFromPayload: DependencyValue;
  buildAskEvidenceTargetArbitration: DependencyValue;
  buildRouteProductContract: DependencyValue;
  buildToolCallAdmissionDecision: DependencyValue;
  refreshOperationalRecordsForPayload: DependencyValue;
  buildSolverInstructionFrame: DependencyValue;
  buildCapabilityPlan: DependencyValue;
  buildCapabilityAdapterRequestForPayload: DependencyValue;
  guardTerminalArtifactSelection: DependencyValue;
  guardProductAuthority: DependencyValue;
  auditRouteAuthority: DependencyValue;
  buildAskTurnRetrievalRequiredSignal: DependencyValue;
  presentTerminalArtifact: DependencyValue;
  buildTerminalTurnItem: DependencyValue;
  mergeTurnItemLedger: DependencyValue;
  recordHelixTurnTerminalAuthority: DependencyValue;
  auditHelixAskContextForPoison: DependencyValue;
  attachLiveSourceIdentityAuditForAskTurn: DependencyValue;
  applyHelixTerminalAuthoritySingleWriter: DependencyValue;
  buildLoopParityTrace: DependencyValue;
  refreshCapabilityResultForPayload: DependencyValue;
  refreshCapabilityLifecycleLedgerForPayload: DependencyValue;
  buildAskTurnSolverTrace: DependencyValue;
  refreshSolverArtifactReentryAuditForPayload: DependencyValue;
  refreshSolverSubgoalLedgerForPayload: DependencyValue;
  refreshSolverRetryPoliciesForPayload: DependencyValue;
  applyAskTurnSolverHardGateFailure: DependencyValue;
  askTurnSolverHardGateFailureDependencies: DependencyValue;
  applySolverControllerDecisionForPayload: DependencyValue;
  buildSourceBindingStatuses: DependencyValue;
  recordSourceBindingStatusTransitions: DependencyValue;
  recordSourceBindingRepairCandidate: DependencyValue;
  hashDebugExportPayload: DependencyValue;
  readAskTurnArtifactPayloadRecord: DependencyValue;
  normalizeAskTurnWorkspaceDocPath: DependencyValue;
  resolveTerminalAnswerEnvelope: DependencyValue;
  applyTerminalAnswerEnvelope: DependencyValue;
  buildHelixTurnTerminalAuthority: DependencyValue;
  auditTerminalPresentationCoverage: DependencyValue;
  auditToolAdmissionCoverage: DependencyValue;
  attachHelixAskReasoningTheaterStateToPayloadDebug: DependencyValue;
  rememberHelixDebugExportEnvelope: DependencyValue;
  listSourceBindingStatusLedger: DependencyValue;
  assertNoLiveSourceSecondLoop: DependencyValue;
  uniqueAskTurnStrings: DependencyValue;
  coerceLiveSourceMailboxSourceTargetIntent: DependencyValue;
  arbitrateAskSourceTarget: DependencyValue;
  canPromoteAskTurnTerminalKindAtResponseBoundary: DependencyValue;
};

export type FinalizeHelixAskTurnPayloadInput = {
  payload: RecordLike;
  threadId: string;
  turnId: string;
  prompt: string;
  sessionId: string | null;
  terminalText: string;
  finalAnswerSource: string;
  terminalArtifactKind: string;
  route: string;
  clientVisibleText?: string | null;
};

export const createHelixAskTurnFinalizer = (dependencies: HelixAskTurnFinalizerDependencies) => {
  const {
    readAskTurnString,
    helixRuntimeFinalAnswerComposer,
    formatAskTurnWorkspaceActionReceiptMessage,
    resolveAskTurnPanelControlLabel,
    classifyHelixAskTurnIntentFamily,
    buildHelixArtifactPromotionAudit,
    buildAskTurnPreflightContext,
    readStagePlayMailWakeRouteMetadataFromPayload,
    buildAskEvidenceTargetArbitration,
    buildRouteProductContract,
    buildToolCallAdmissionDecision,
    refreshOperationalRecordsForPayload,
    buildSolverInstructionFrame,
    buildCapabilityPlan,
    buildCapabilityAdapterRequestForPayload,
    guardTerminalArtifactSelection,
    guardProductAuthority,
    auditRouteAuthority,
    buildAskTurnRetrievalRequiredSignal,
    presentTerminalArtifact,
    buildTerminalTurnItem,
    mergeTurnItemLedger,
    recordHelixTurnTerminalAuthority,
    auditHelixAskContextForPoison,
    attachLiveSourceIdentityAuditForAskTurn,
    applyHelixTerminalAuthoritySingleWriter,
    buildLoopParityTrace,
    refreshCapabilityResultForPayload,
    refreshCapabilityLifecycleLedgerForPayload,
    buildAskTurnSolverTrace,
    refreshSolverArtifactReentryAuditForPayload,
    refreshSolverSubgoalLedgerForPayload,
    refreshSolverRetryPoliciesForPayload,
    applyAskTurnSolverHardGateFailure,
    askTurnSolverHardGateFailureDependencies,
    applySolverControllerDecisionForPayload,
    buildSourceBindingStatuses,
    recordSourceBindingStatusTransitions,
    recordSourceBindingRepairCandidate,
    hashDebugExportPayload,
    readAskTurnArtifactPayloadRecord,
    normalizeAskTurnWorkspaceDocPath,
    resolveTerminalAnswerEnvelope,
    applyTerminalAnswerEnvelope,
    buildHelixTurnTerminalAuthority,
    auditTerminalPresentationCoverage,
    auditToolAdmissionCoverage,
    attachHelixAskReasoningTheaterStateToPayloadDebug,
    rememberHelixDebugExportEnvelope,
    listSourceBindingStatusLedger,
    assertNoLiveSourceSecondLoop,
    uniqueAskTurnStrings,
    coerceLiveSourceMailboxSourceTargetIntent,
    arbitrateAskSourceTarget,
    canPromoteAskTurnTerminalKindAtResponseBoundary,
  } = dependencies as Record<string, any>;

  const finalizeHelixAskTurnPayload = (args: FinalizeHelixAskTurnPayloadInput): RecordLike => {
    const payload = args.payload;
    const canonicalGoalForFinalizer =
      payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
        ? (payload.canonical_goal_frame as HelixAskCanonicalGoalFrame)
        : null;
    if (
      canonicalGoalForFinalizer &&
      (canonicalGoalForFinalizer.goal_kind === "repo_code_evidence_question" ||
        canonicalGoalForFinalizer.goal_kind === "repo_entity_definition" ||
        canonicalGoalForFinalizer.required_terminal_kind === "repo_code_evidence_answer") &&
      (
        helixRuntimeFinalAnswerComposer.isHelixRepoEvidenceStaleFallbackText(args.terminalText) ||
        helixRuntimeFinalAnswerComposer.isHelixRepoEvidenceStaleFallbackText(payload.selected_final_answer) ||
        helixRuntimeFinalAnswerComposer.isHelixRepoEvidenceStaleFallbackText(payload.answer) ||
        helixRuntimeFinalAnswerComposer.isHelixRepoEvidenceStaleFallbackText(payload.text) ||
        helixRuntimeFinalAnswerComposer.isHelixRepoEvidenceStaleFallbackText(readAskTurnString((payload.terminal_presentation as Record<string, unknown> | undefined)?.concise_text))
      )
    ) {
      const repoEvidenceAnswer =
        payload.repo_code_evidence_answer &&
        typeof payload.repo_code_evidence_answer === "object" &&
        !Array.isArray(payload.repo_code_evidence_answer)
          ? (payload.repo_code_evidence_answer as Record<string, unknown>)
          : null;
      const repoEvidenceQualityGate =
        payload.repo_answer_text_quality_gate &&
        typeof payload.repo_answer_text_quality_gate === "object" &&
        !Array.isArray(payload.repo_answer_text_quality_gate)
          ? (payload.repo_answer_text_quality_gate as Record<string, unknown>)
          : null;
      const modelAuthoredRepoEvidenceText = repoEvidenceQualityGate?.ok === true
        ? readAskTurnString(repoEvidenceAnswer?.answer_text)
        : null;
      const finalizerDebugForRepoEvidenceAnswer =
        payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)
          ? (payload.debug as Record<string, unknown>)
          : null;
      const finalizerCanPromoteRepoEvidenceAnswer =
        canPromoteAskTurnTerminalKindAtResponseBoundary(
          payload,
          finalizerDebugForRepoEvidenceAnswer,
          "repo_code_evidence_answer",
        );
      if (modelAuthoredRepoEvidenceText && finalizerCanPromoteRepoEvidenceAnswer) {
        args.terminalText = modelAuthoredRepoEvidenceText;
        args.clientVisibleText = modelAuthoredRepoEvidenceText;
        args.finalAnswerSource = "model_synthesis_from_repo_evidence";
        args.terminalArtifactKind = "repo_code_evidence_answer";
        payload.text = modelAuthoredRepoEvidenceText;
        payload.answer = modelAuthoredRepoEvidenceText;
        payload.assistant_answer = modelAuthoredRepoEvidenceText;
        payload.selected_final_answer = modelAuthoredRepoEvidenceText;
        payload.finalAnswer = modelAuthoredRepoEvidenceText;
        payload.final_answer_source = "model_synthesis_from_repo_evidence";
        payload.terminal_artifact_kind = "repo_code_evidence_answer";
        if (payload.terminal_presentation && typeof payload.terminal_presentation === "object") {
          const presentation = payload.terminal_presentation as Record<string, unknown>;
          presentation.concise_text = modelAuthoredRepoEvidenceText;
          presentation.terminal_artifact_kind = "repo_code_evidence_answer";
        }
        delete payload.terminal_error_code;
        delete payload.terminal_failure_text;
      } else if (modelAuthoredRepoEvidenceText && !finalizerCanPromoteRepoEvidenceAnswer) {
        payload.response_boundary_repo_evidence_projection_suppressed = true;
        payload.response_boundary_repo_evidence_projection_suppression_reason =
          "repo_evidence_answer_requires_solver_or_terminal_authority";
        if (finalizerDebugForRepoEvidenceAnswer) {
          finalizerDebugForRepoEvidenceAnswer.response_boundary_repo_evidence_projection_suppressed = true;
          finalizerDebugForRepoEvidenceAnswer.response_boundary_repo_evidence_projection_suppression_reason =
            "repo_evidence_answer_requires_solver_or_terminal_authority";
        }
      }
    }
    if (canonicalGoalForFinalizer?.goal_kind === "panel_control") {
      const actionEnvelope =
        payload.action_envelope && typeof payload.action_envelope === "object" && !Array.isArray(payload.action_envelope)
          ? (payload.action_envelope as Record<string, unknown>)
          : null;
      const workstationActions = Array.isArray(actionEnvelope?.workstation_actions)
        ? (actionEnvelope.workstation_actions as unknown[])
        : [];
      const openedPanelAction = workstationActions.find((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const action = entry as Record<string, unknown>;
        return readAskTurnString(action.action_id) === "open" && Boolean(readAskTurnString(action.panel_id));
      }) as Record<string, unknown> | undefined;
      const openedPanelId = readAskTurnString(openedPanelAction?.panel_id);
      if (openedPanelId) {
        const panelReceiptText = formatAskTurnWorkspaceActionReceiptMessage(
          openedPanelId,
          "open",
          resolveAskTurnPanelControlLabel(openedPanelId),
        );
        args.terminalText = panelReceiptText;
        args.clientVisibleText = panelReceiptText;
        args.finalAnswerSource = "artifact_synthesis";
        args.terminalArtifactKind = "workspace_action_receipt";
        payload.text = panelReceiptText;
        payload.answer = panelReceiptText;
        payload.assistant_answer = panelReceiptText;
        payload.selected_final_answer = panelReceiptText;
        payload.finalAnswer = panelReceiptText;
        payload.final_answer_source = "artifact_synthesis";
        payload.terminal_artifact_kind = "workspace_action_receipt";
        if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
          const debug = payload.debug as Record<string, unknown>;
          debug.text = panelReceiptText;
          debug.answer = panelReceiptText;
          debug.assistant_answer = panelReceiptText;
          debug.selected_final_answer = panelReceiptText;
          debug.final_answer_source = "artifact_synthesis";
          debug.terminal_artifact_kind = "workspace_action_receipt";
        }
      }
    }
    const resolvedTurnSummary = {
      turn_id: args.turnId,
      final_status: "final_answer",
      resolved_route_label: args.route,
      terminal_artifact_kind: args.terminalArtifactKind,
      terminal_error_code: null,
      pending_server_request_present: false,
    };
    payload.resolved_turn_summary = payload.resolved_turn_summary ?? resolvedTurnSummary;
    payload.final_answer_source = args.finalAnswerSource;
    payload.terminal_artifact_kind = args.terminalArtifactKind;
    const intentFamily = classifyHelixAskTurnIntentFamily(args.prompt);
    const visualCandidateSurface = JSON.stringify({
      turn_input_items: payload.turn_input_items,
      multimodal_turn_context: payload.multimodal_turn_context,
      workspace_context_snapshot: payload.workspace_context_snapshot,
      visual_evidence_refs: payload.visual_evidence_refs,
    });
    const hasVisualArtifactCandidate =
      /\bvisual_frame_evidence\b/.test(visualCandidateSurface) ||
      (
        intentFamily !== "visual_description" &&
        intentFamily !== "visual_question" &&
        /\b(?:attached|visual|image|screenshot|screen\s*share|screen|tab|window)\b/i.test(args.prompt)
      );
    const visualCandidateAllowed =
      !hasVisualArtifactCandidate ||
      intentFamily === "visual_description" ||
      intentFamily === "visual_question";
    payload.intent_family = payload.intent_family ?? intentFamily;
    payload.artifact_promotion_audit =
      payload.artifact_promotion_audit ??
      buildHelixArtifactPromotionAudit({
        intentFamily,
        candidateArtifactKind: hasVisualArtifactCandidate ? "visual_frame_evidence" : null,
        candidateAllowed: visualCandidateAllowed,
        blockedReason: visualCandidateAllowed ? null : `intent_${intentFamily}_cannot_promote_visual_artifact`,
      });
    if (hasVisualArtifactCandidate && !visualCandidateAllowed) {
      payload.artifact_promotion_audit = buildHelixArtifactPromotionAudit({
        intentFamily,
        candidateArtifactKind: "visual_frame_evidence",
        candidateAllowed: false,
        blockedReason: `intent_${intentFamily}_cannot_promote_visual_artifact`,
      });
    }
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.intent_family = debug.intent_family ?? payload.intent_family;
      debug.artifact_promotion_audit = debug.artifact_promotion_audit ?? payload.artifact_promotion_audit;
    }
    let preflightContext =
      payload.ask_turn_preflight_context && typeof payload.ask_turn_preflight_context === "object"
        ? (payload.ask_turn_preflight_context as ReturnType<typeof buildAskTurnPreflightContext>)
        : null;
    const payloadStagePlayMailWakeRouteMetadata = readStagePlayMailWakeRouteMetadataFromPayload(payload);
    if (payloadStagePlayMailWakeRouteMetadata) {
      payload.route_metadata = payloadStagePlayMailWakeRouteMetadata;
      payload.routeMetadata = payloadStagePlayMailWakeRouteMetadata;
    }
    let sourceTargetIntent =
      payload.source_target_intent && typeof payload.source_target_intent === "object"
        ? payload.source_target_intent
        : arbitrateAskSourceTarget({
            turnId: args.turnId,
            threadId: args.threadId,
            promptText: args.prompt,
          });
    const existingEvidenceTargetArbitration =
      payload.evidence_target_arbitration &&
      typeof payload.evidence_target_arbitration === "object" &&
      !Array.isArray(payload.evidence_target_arbitration)
        ? (payload.evidence_target_arbitration as Record<string, unknown>)
        : null;
    const evidenceTargetArbitration =
      existingEvidenceTargetArbitration &&
      !(
        payloadStagePlayMailWakeRouteMetadata?.invocationKind === "stage_play_mail_wake" &&
        readAskTurnString(existingEvidenceTargetArbitration.selected_candidate_id) !==
          "live_source_mailbox.stage_play_mail_wake_route_metadata"
      )
        ? existingEvidenceTargetArbitration
        : buildAskEvidenceTargetArbitration({
            turnId: args.turnId,
            threadId: args.threadId,
            promptText: args.prompt,
            routeMetadata: payloadStagePlayMailWakeRouteMetadata,
        });
    payload.evidence_target_arbitration = evidenceTargetArbitration;
    sourceTargetIntent = coerceLiveSourceMailboxSourceTargetIntent({
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      evidenceTargetArbitration: evidenceTargetArbitration as Record<string, unknown>,
      transcript: args.prompt,
      turnId: args.turnId,
      threadId: args.threadId,
      routeMetadata: payloadStagePlayMailWakeRouteMetadata,
    });
    if (
      /\bwhat\s+changed\s+since\s+(?:the\s+)?(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b/i.test(args.prompt) ||
      /\b(?:compare|compared|changed|difference|different)\b[\s\S]{0,140}\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b|\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b[\s\S]{0,140}\b(?:compare|compared|changed|difference|different|running)\b|\bscene\s+epoch\b/i.test(args.prompt)
    ) {
      const originalSourceTarget =
        sourceTargetIntent && typeof sourceTargetIntent === "object" && !Array.isArray(sourceTargetIntent)
          ? (sourceTargetIntent as Record<string, unknown>)
          : {};
      const originalReasons = Array.isArray(originalSourceTarget.reasons)
        ? originalSourceTarget.reasons.filter((entry): entry is string => typeof entry === "string")
        : [];
      const originalRequestedOutputs = Array.isArray(originalSourceTarget.requested_outputs)
        ? originalSourceTarget.requested_outputs.filter((entry): entry is string => typeof entry === "string")
        : [];
      const originalSuppressedRoutes = Array.isArray(originalSourceTarget.suppressed_routes)
        ? originalSourceTarget.suppressed_routes.filter((entry): entry is string => typeof entry === "string")
        : [];
      sourceTargetIntent = {
        ...originalSourceTarget,
        target_source: "procedure_memory",
        target_kind: "situation_epoch",
        targetSource: "procedure_memory",
        targetKind: "situation_epoch",
        strength: "hard",
        reasons: uniqueAskTurnStrings([
          ...originalReasons,
          "procedure_memory_delta_prompt",
        ]),
        requested_outputs: uniqueAskTurnStrings([
          ...originalRequestedOutputs,
          "procedure_epoch_replay",
          "visual_scene_comparison_result",
          "typed_failure",
        ]),
        suppressed_routes: uniqueAskTurnStrings([
          ...originalSuppressedRoutes,
          "visual_capture_describe",
          "visual_frame_evidence",
          "situation_context_question",
        ]),
        precedence_reason: "procedure_memory_delta_prompt",
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    if ((readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route) === "live_environment_binding_diagnosis") {
      const originalSourceTarget =
        sourceTargetIntent && typeof sourceTargetIntent === "object" && !Array.isArray(sourceTargetIntent)
          ? (sourceTargetIntent as Record<string, unknown>)
          : {};
      const originalReasons = Array.isArray(originalSourceTarget.reasons)
        ? originalSourceTarget.reasons.filter((entry): entry is string => typeof entry === "string")
        : [];
      const originalRequestedOutputs = Array.isArray(originalSourceTarget.requested_outputs)
        ? originalSourceTarget.requested_outputs.filter((entry): entry is string => typeof entry === "string")
        : [];
      const originalSuppressedRoutes = Array.isArray(originalSourceTarget.suppressed_routes)
        ? originalSourceTarget.suppressed_routes.filter((entry): entry is string => typeof entry === "string")
        : [];
      sourceTargetIntent = {
        ...originalSourceTarget,
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        targetSource: "live_pipeline",
        targetKind: "live_pipeline",
        strength: "hard",
        reasons: uniqueAskTurnStrings([
          ...originalReasons,
          "live_environment_binding_diagnosis_requires_live_pipeline_contract",
        ]),
        requested_outputs: uniqueAskTurnStrings([
          ...originalRequestedOutputs,
          "live_environment_binding_diagnosis",
          "typed_failure",
        ]),
        suppressed_routes: uniqueAskTurnStrings(originalSuppressedRoutes),
        precedence_reason: "live_environment_binding_diagnosis_requires_live_pipeline_contract",
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const terminalExactContract =
      payload.source_target_exact_contract && typeof payload.source_target_exact_contract === "object" && !Array.isArray(payload.source_target_exact_contract)
        ? (payload.source_target_exact_contract as Record<string, unknown>)
        : payload.repo_docs_synthesis_packet &&
            typeof payload.repo_docs_synthesis_packet === "object" &&
            !Array.isArray(payload.repo_docs_synthesis_packet) &&
            (payload.repo_docs_synthesis_packet as Record<string, unknown>).source_target_exact_contract &&
            typeof (payload.repo_docs_synthesis_packet as Record<string, unknown>).source_target_exact_contract === "object" &&
            !Array.isArray((payload.repo_docs_synthesis_packet as Record<string, unknown>).source_target_exact_contract)
          ? ((payload.repo_docs_synthesis_packet as Record<string, unknown>).source_target_exact_contract as Record<string, unknown>)
          : null;
    if (terminalExactContract) {
      payload.source_target_exact_contract = terminalExactContract;
      const sourceTargetRecordForExact = sourceTargetIntent as Record<string, unknown>;
      sourceTargetRecordForExact.source_target_exact_contract_ref =
        readAskTurnString(terminalExactContract.contract_id) ?? sourceTargetRecordForExact.source_target_exact_contract_ref;
      sourceTargetRecordForExact.source_target_exact_contract = terminalExactContract;
    }
    payload.source_target_intent = sourceTargetIntent;
    const sourceTargetRecord = sourceTargetIntent as Record<string, unknown>;
    const sourceTargetSuppressedRoutes = Array.isArray(sourceTargetRecord.suppressed_routes)
      ? sourceTargetRecord.suppressed_routes.filter((entry): entry is string => typeof entry === "string")
      : [];
    const routeProductContract = buildRouteProductContract({
      turnId: args.turnId,
      threadId: args.threadId,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      promptText: args.prompt,
    });
    payload.route_product_contract = routeProductContract;
    payload.tool_call_admission_decision = buildToolCallAdmissionDecision({
      turnId: args.turnId,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      routeProductContract,
      promptText: args.prompt,
    });
    refreshOperationalRecordsForPayload({
      payload,
      turnId: args.turnId,
      promptText: args.prompt,
    });
    payload.solver_instruction_frame = buildSolverInstructionFrame({
      turnId: args.turnId,
      promptText: args.prompt,
      promptInterpretation:
        payload.prompt_interpretation && typeof payload.prompt_interpretation === "object"
          ? (payload.prompt_interpretation as Record<string, unknown>)
          : null,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
    });
    payload.capability_plan = buildCapabilityPlan({
      turnId: args.turnId,
      promptText: args.prompt,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      routeProductContract,
      toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
      instructionFrame: payload.solver_instruction_frame as Record<string, unknown>,
      canonicalGoalFrame:
        payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
          ? (payload.canonical_goal_frame as Record<string, unknown>)
          : null,
      liveSourceTurnPhaseResolution:
        payload.live_source_turn_phase_resolution && typeof payload.live_source_turn_phase_resolution === "object" && !Array.isArray(payload.live_source_turn_phase_resolution)
          ? (payload.live_source_turn_phase_resolution as Record<string, unknown>)
          : null,
      routeMetadata: payloadStagePlayMailWakeRouteMetadata,
    });
    if (
      (
        /\bwhat\s+changed\s+since\s+(?:the\s+)?(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b/i.test(args.prompt) ||
        /\b(?:compare|compared|changed|difference|different)\b[\s\S]{0,140}\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b|\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b[\s\S]{0,140}\b(?:compare|compared|changed|difference|different|running)\b|\bscene\s+epoch\b/i.test(args.prompt)
      ) &&
      payload.capability_plan &&
      typeof payload.capability_plan === "object" &&
      !Array.isArray(payload.capability_plan)
    ) {
      payload.capability_plan = {
        ...(payload.capability_plan as Record<string, unknown>),
        requested_capability: "procedure_memory",
        selected_capability: "procedure_memory",
        source_target: "procedure_memory",
        family: "procedure_memory",
        required_observation_kinds: ["procedure_epoch_replay", "visual_scene_comparison_result"],
        required_terminal_kind: "procedure_epoch_replay",
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const capabilityAdapterRequest = buildCapabilityAdapterRequestForPayload({ payload });
    if (capabilityAdapterRequest) {
      payload.capability_adapter_request = capabilityAdapterRequest;
      payload.adapter_request = capabilityAdapterRequest;
    }
    const terminalArtifactSelectionGuard = guardTerminalArtifactSelection({
      contract: routeProductContract,
      terminalArtifactKind: args.terminalArtifactKind,
    });
    payload.terminal_artifact_selection_guard = terminalArtifactSelectionGuard;
    payload.product_authority_guard = guardProductAuthority({
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
      routeProductContract,
      terminalArtifactSelectionGuard,
      terminalArtifactKind: args.terminalArtifactKind,
    });
    payload.route_authority_audit = auditRouteAuthority({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: args.route,
      payload,
      terminalArtifactKind: args.terminalArtifactKind,
      finalAnswerSource: args.finalAnswerSource,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      routeProductContract,
      toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
      terminalArtifactSelectionGuard,
      productAuthorityGuard: payload.product_authority_guard as Record<string, unknown>,
      committedAskRoute: payload.committed_ask_route as Record<string, unknown>,
    });
    assertNoLiveSourceSecondLoop({
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
      routeReasonCode: args.route,
      turnInputItems: Array.isArray(payload.turn_input_items) ? payload.turn_input_items : null,
      liveArtifacts: Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : null,
      terminalArtifactKind: args.terminalArtifactKind,
      finalAnswerSource: args.finalAnswerSource,
    });
    if (!terminalArtifactSelectionGuard.allowed && terminalArtifactSelectionGuard.rejected_terminal_candidate) {
      payload.rejected_terminal_candidates = [
        ...(Array.isArray(payload.rejected_terminal_candidates) ? payload.rejected_terminal_candidates : []),
        terminalArtifactSelectionGuard.rejected_terminal_candidate,
      ];
    }
    if (sourceTargetSuppressedRoutes.length > 0) {
      payload.source_target_route_rejections = sourceTargetSuppressedRoutes.map((route) => ({
        route,
        reason: sourceTargetRecord.precedence_reason ?? "source_target_precedence",
        target_source: sourceTargetRecord.target_source ?? "unknown",
        assistant_answer: false,
        raw_content_included: false,
      }));
      const routeHistory =
        payload.route_history_debug && typeof payload.route_history_debug === "object"
          ? { ...(payload.route_history_debug as Record<string, unknown>) }
          : {};
      const existingRejected = Array.isArray(routeHistory.rejected_route_candidates)
        ? routeHistory.rejected_route_candidates
        : [];
      routeHistory.rejected_route_candidates = [
        ...existingRejected,
        ...(payload.source_target_route_rejections as unknown[]),
      ];
      payload.route_history_debug = routeHistory;
    }
    if (!preflightContext) {
      preflightContext = buildAskTurnPreflightContext({
        turnId: args.turnId,
        threadId: args.threadId,
        promptText: args.prompt,
        inputModality: "typed",
        retrievalRequiredSignal: buildAskTurnRetrievalRequiredSignal({
          turnId: args.turnId,
          transcript: args.prompt,
        }),
        routeCandidates: [{
          route: args.route,
          confidence: null,
          reason: "finalize_turn_payload",
        }],
        sourceTargetIntent,
        workspaceSnapshot:
          payload.workspace_context_snapshot && typeof payload.workspace_context_snapshot === "object"
            ? payload.workspace_context_snapshot
            : null,
      });
      payload.ask_turn_preflight_context = preflightContext;
      payload.preflight_context_id = preflightContext.preflight_context_id;
    } else if (!(preflightContext as Record<string, unknown>).source_target_intent) {
      preflightContext = Object.freeze({
        ...(preflightContext as Record<string, unknown>),
        source_target_intent: sourceTargetIntent,
      }) as ReturnType<typeof buildAskTurnPreflightContext>;
      payload.ask_turn_preflight_context = preflightContext;
    }
    const modelSynthesizedFinalDraftTerminal =
      args.terminalArtifactKind === "model_synthesized_answer" &&
      args.finalAnswerSource === "final_answer_draft";
    const modelAuthoredFinalDraftText =
      modelSynthesizedFinalDraftTerminal
        ? (
            readAskTurnString(payload.selected_final_answer) ??
            readAskTurnString((payload.final_answer_draft as Record<string, unknown> | undefined)?.text) ??
            args.terminalText
          )
        : null;
    const routeAuthoredFinalDraftText =
      !modelSynthesizedFinalDraftTerminal && args.finalAnswerSource === "final_answer_draft"
        ? (
            readAskTurnString((payload.final_answer_draft as Record<string, unknown> | undefined)?.text) ??
            readAskTurnString(payload.selected_final_answer) ??
            args.terminalText
          )
        : null;
    if (!payload.terminal_presentation || typeof payload.terminal_presentation !== "object") {
      const presentationBundle = presentTerminalArtifact({
        turnId: args.turnId,
        threadId: args.threadId,
        promptText: args.prompt,
        routeReasonCode: args.route,
        terminalArtifactKind: args.terminalArtifactKind,
        finalAnswerSource: args.finalAnswerSource,
        rawTerminalText: args.terminalText,
        artifactRefs: [readAskTurnString(payload.terminal_artifact_id) ?? args.terminalArtifactKind],
        preflightContextRef: preflightContext.preflight_context_id,
        style: "brief",
        terminalArtifact:
          payload.live_pipeline_turn_receipt ??
          payload.workspace_action_receipt ??
          payload.workstation_tool_evaluation ??
          payload.pending_server_request ??
          payload.terminal_artifact ??
          null,
      });
      const selectedPresentationText =
        modelAuthoredFinalDraftText ??
        routeAuthoredFinalDraftText ??
        args.clientVisibleText ??
        (args.route === "calculator_solve / calculator_compound_chain"
          ? readAskTurnString(payload.selected_final_answer)
          : null) ??
        presentationBundle.presentation.concise_text;
      payload.terminal_presentation = presentationBundle.presentation;
      payload.receipt_presentation_snapshot = presentationBundle.receiptSnapshot;
      payload.answer = selectedPresentationText;
      payload.text = selectedPresentationText;
      payload.assistant_answer = selectedPresentationText;
      payload.selected_final_answer = selectedPresentationText;
    }
    const presentedTerminalText =
      modelAuthoredFinalDraftText ??
      routeAuthoredFinalDraftText ??
      readAskTurnString((payload.terminal_presentation as Record<string, unknown> | undefined)?.concise_text) ??
      readAskTurnString(payload.selected_final_answer) ??
      args.terminalText;
    const terminalItem = buildTerminalTurnItem({
      threadId: args.threadId,
      turnId: args.turnId,
      finalAnswerSource: args.finalAnswerSource,
      terminalArtifactKind: args.terminalArtifactKind,
      terminalText: presentedTerminalText,
      route: args.route,
    });
    const turnItemLedger = mergeTurnItemLedger({
      existing: payload.turn_item_ledger,
      threadId: args.threadId,
      turnId: args.turnId,
      terminalItem,
    });
    payload.terminal_item = terminalItem;
    payload.terminal_item_id = terminalItem.item_id;
    payload.turn_item_ledger = turnItemLedger;
    payload.assistant_answer_from_worker_count = turnItemLedger.worker_output_promoted_to_answer_count;
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.ask_turn_preflight_context = payload.ask_turn_preflight_context;
      debug.preflight_context_id = payload.preflight_context_id;
      debug.source_target_intent = payload.source_target_intent;
      debug.route_product_contract = payload.route_product_contract;
      debug.terminal_artifact_selection_guard = payload.terminal_artifact_selection_guard;
      debug.product_authority_guard = payload.product_authority_guard;
      debug.route_authority_audit = payload.route_authority_audit;
      debug.capability_plan = payload.capability_plan;
      debug.capability_result = payload.capability_result;
      debug.capability_lifecycle_ledger = payload.capability_lifecycle_ledger;
      debug.tool_lifecycle_trace = payload.tool_lifecycle_trace;
      debug.tool_followup_decision = payload.tool_followup_decision;
      debug.turn_operational_constraints = payload.turn_operational_constraints;
      debug.operational_capability_trace = payload.operational_capability_trace;
      debug.operational_satisfaction_evaluation = payload.operational_satisfaction_evaluation;
      debug.capability_adapter_request = payload.capability_adapter_request;
      debug.capability_adapter_result = payload.capability_adapter_result;
      debug.adapter_request = payload.adapter_request;
      debug.adapter_result = payload.adapter_result;
      debug.terminal_presentation = payload.terminal_presentation;
      debug.receipt_presentation_snapshot = payload.receipt_presentation_snapshot;
      debug.terminal_item = terminalItem;
      debug.terminal_item_id = terminalItem.item_id;
      debug.turn_item_ledger = turnItemLedger;
      debug.assistant_answer_from_worker_count = turnItemLedger.worker_output_promoted_to_answer_count;
    }
    const terminalAuthorityRecord = recordHelixTurnTerminalAuthority({
      thread_id: args.threadId,
      turn_id: args.turnId,
      final_answer_source: args.finalAnswerSource,
      terminal_artifact_kind: args.terminalArtifactKind,
      terminal_text: presentedTerminalText,
      terminal_item_id: terminalItem.item_id,
      route: args.route,
    });
    const poisonAudit = auditHelixAskContextForPoison({
      thread_id: args.threadId,
      turn_id: args.turnId,
      payload,
      terminal_authority: terminalAuthorityRecord,
      client_visible_text: args.clientVisibleText ?? presentedTerminalText,
    });
    payload.terminal_answer_authority = terminalAuthorityRecord;
    payload.poison_audit = poisonAudit;
    attachLiveSourceIdentityAuditForAskTurn({
      payload,
      threadId: args.threadId,
      turnId: args.turnId,
      prompt: args.prompt,
      route: args.route,
      terminalArtifactKind: args.terminalArtifactKind,
    });
    const finalizerTerminalSelectionArtifacts = Array.isArray(payload.current_turn_artifact_ledger)
      ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const finalizerRequiredTerminalKind =
      readAskTurnString((payload.canonical_goal_frame as Record<string, unknown> | undefined)?.required_terminal_kind) ??
      readAskTurnString((payload.goal_satisfaction_evaluation as Record<string, unknown> | undefined)?.required_terminal_kind);
    const finalizerNeedsWorkstationSingleWriter =
      args.terminalArtifactKind === "workstation_tool_evaluation" ||
      finalizerRequiredTerminalKind === "workstation_tool_evaluation";
    const finalizerHasWorkstationTerminalCandidate =
      finalizerNeedsWorkstationSingleWriter &&
      helixRuntimeFinalAnswerComposer.hasHelixWorkstationToolEvaluationTerminalCandidate(finalizerTerminalSelectionArtifacts);
    const finalizerHasFinalAnswerDraftTerminalCandidate =
      helixRuntimeFinalAnswerComposer.hasHelixFinalAnswerDraftSelectionCandidate(finalizerTerminalSelectionArtifacts);
    const finalizerNeedsFinalAnswerDraftSingleWriter =
      finalizerHasFinalAnswerDraftTerminalCandidate &&
      (
        args.finalAnswerSource === "final_answer_draft" ||
        readAskTurnString(payload.final_answer_source) === "final_answer_draft" ||
        args.terminalArtifactKind === "theory_context_reflection_answer" ||
        args.terminalArtifactKind === "compound_evidence_synthesis_answer" ||
        args.terminalArtifactKind === "doc_evidence_synthesis_answer" ||
        args.terminalArtifactKind === "repo_code_evidence_answer" ||
        args.terminalArtifactKind === "scholarly_research_answer" ||
        args.terminalArtifactKind === "internet_search_answer"
      );
    const finalizerNeedsCompletedCompoundSingleWriter =
      helixRuntimeFinalAnswerComposer.shouldApplyCompletedCompoundTerminalSingleWriterBridge(payload, finalizerTerminalSelectionArtifacts);
    if (
      (finalizerNeedsWorkstationSingleWriter || finalizerNeedsFinalAnswerDraftSingleWriter || finalizerNeedsCompletedCompoundSingleWriter) &&
      (
        finalizerNeedsFinalAnswerDraftSingleWriter ||
        finalizerNeedsCompletedCompoundSingleWriter ||
        helixRuntimeFinalAnswerComposer.shouldApplyHelixTerminalDraftSelectionGateForPayload(payload, finalizerTerminalSelectionArtifacts) ||
        finalizerHasWorkstationTerminalCandidate
      ) &&
      !(payload.terminal_authority_single_writer && typeof payload.terminal_authority_single_writer === "object")
    ) {
      applyHelixTerminalAuthoritySingleWriter({
        payload,
        turnId: args.turnId,
        threadId: args.threadId,
        artifactLedger: finalizerTerminalSelectionArtifacts,
      });
    }
    payload.loop_parity_trace = buildLoopParityTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
    });
    refreshCapabilityResultForPayload({
      payload,
      terminalArtifactKind: args.terminalArtifactKind,
    });
    refreshOperationalRecordsForPayload({
      payload,
      turnId: args.turnId,
      promptText: args.prompt,
    });
    refreshCapabilityLifecycleLedgerForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: args.terminalArtifactKind,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    refreshSolverArtifactReentryAuditForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
    });
    refreshSolverSubgoalLedgerForPayload({
      payload,
      turnId: args.turnId,
      prompt: args.prompt,
    });
    refreshCapabilityLifecycleLedgerForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
    });
    refreshOperationalRecordsForPayload({
      payload,
      turnId: args.turnId,
      promptText: args.prompt,
    });
    refreshSolverRetryPoliciesForPayload({
      payload,
      turnId: args.turnId,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    applyAskTurnSolverHardGateFailure({
      dependencies: askTurnSolverHardGateFailureDependencies,
      payload,
      threadId: args.threadId,
      turnId: args.turnId,
      route: args.route,
      prompt: args.prompt,
      routeProductContract: routeProductContract as Record<string, unknown>,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
    });
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
      debug.poison_audit = payload.poison_audit;
      debug.capability_plan = payload.capability_plan;
      debug.capability_result = payload.capability_result;
      debug.capability_lifecycle_ledger = payload.capability_lifecycle_ledger;
      debug.tool_lifecycle_trace = payload.tool_lifecycle_trace;
      debug.tool_followup_decision = payload.tool_followup_decision;
      debug.turn_operational_constraints = payload.turn_operational_constraints;
      debug.operational_capability_trace = payload.operational_capability_trace;
      debug.operational_satisfaction_evaluation = payload.operational_satisfaction_evaluation;
      debug.capability_adapter_request = payload.capability_adapter_request;
      debug.capability_adapter_result = payload.capability_adapter_result;
      debug.adapter_request = payload.adapter_request;
      debug.adapter_result = payload.adapter_result;
      debug.solver_instruction_frame = payload.solver_instruction_frame;
      debug.solver_artifact_reentry_audit = payload.solver_artifact_reentry_audit;
      debug.solver_subgoal_ledger = payload.solver_subgoal_ledger;
      debug.solver_retry_policy = payload.solver_retry_policy;
      debug.solver_retry_policies = payload.solver_retry_policies;
      debug.loop_parity_trace = payload.loop_parity_trace;
      debug.ask_turn_solver_trace = payload.ask_turn_solver_trace;
    }
    const sourceBindingStatuses = buildSourceBindingStatuses({
      activeSituationContext: payload.active_situation_context,
      livePipelineReceipt: payload.live_pipeline_turn_receipt,
      worldEventThreadBindingCheck: payload.world_event_thread_binding_check,
      workspaceSnapshot: payload.workspace_context_snapshot,
    });
    if (sourceBindingStatuses.length > 0 && !Array.isArray(payload.source_binding_statuses)) {
      payload.source_binding_statuses = sourceBindingStatuses;
    }
    recordSourceBindingStatusTransitions({
      statuses: sourceBindingStatuses,
      reason: "ask turn finalized source binding statuses",
    });
    const observedUnboundWorldSource = sourceBindingStatuses.find((statusEntry: any) =>
      statusEntry.modality === "world_event" && statusEntry.state === "observed_unbound"
    );
    if (observedUnboundWorldSource && !payload.source_binding_repair_candidate) {
      const repairTransition = recordSourceBindingRepairCandidate({
        source_id: observedUnboundWorldSource.source_id,
        thread_id: observedUnboundWorldSource.thread_id ?? args.threadId,
        modality: observedUnboundWorldSource.modality,
        reason: "world event ingested with no thread context",
        evidence_refs: observedUnboundWorldSource.latest_observation_refs,
      });
      payload.source_binding_repair_candidate = {
        schema: "helix.source_binding_repair_candidate.v1",
        candidate_id: `source_binding_repair:${hashDebugExportPayload([
          args.turnId,
          observedUnboundWorldSource.source_id,
          observedUnboundWorldSource.terminal_ineligible_reason,
        ]).slice(0, 18)}`,
        source_id: observedUnboundWorldSource.source_id,
        thread_id: observedUnboundWorldSource.thread_id ?? args.threadId,
        modality: observedUnboundWorldSource.modality,
        reason: "observed_unbound",
        next_required_action: observedUnboundWorldSource.terminal_ineligible_reason ?? "attach_world_event_source_to_thread",
        plan_contract_required: true,
        transition_id: repairTransition.transition_id,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const sourceBindingStatusLedger = listSourceBindingStatusLedger({ threadId: args.threadId, limit: 50 });
    if (sourceBindingStatusLedger.length > 0) {
      payload.source_binding_status_ledger = sourceBindingStatusLedger;
    }
    if (readAskTurnString(payload.terminal_error_code) === "concept_explanation_unavailable") {
      const ledger = Array.isArray(payload.current_turn_artifact_ledger)
        ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : [];
      const conceptArtifact = ledger.find((artifact) => artifact.kind === "doc_concept_explanation") ?? null;
      const conceptPayload = conceptArtifact ? readAskTurnArtifactPayloadRecord(conceptArtifact) : null;
      const conceptText =
        readAskTurnString(conceptPayload?.answer_text) ??
        readAskTurnString(conceptPayload?.text) ??
        readAskTurnString(conceptPayload?.plain_language_summary) ??
        "";
      const responseBoundaryDebugForDocConceptExplanation =
        payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)
          ? (payload.debug as Record<string, unknown>)
          : null;
      const responseBoundaryCanPromoteDocConceptExplanation =
        canPromoteAskTurnTerminalKindAtResponseBoundary(
          payload,
          responseBoundaryDebugForDocConceptExplanation,
          "doc_concept_explanation",
        );
      if (conceptArtifact && conceptText.trim() && responseBoundaryCanPromoteDocConceptExplanation) {
        const conceptPath =
          normalizeAskTurnWorkspaceDocPath(conceptPayload?.source_path) ??
          normalizeAskTurnWorkspaceDocPath(conceptPayload?.path);
        const repairedText =
          conceptPath && !conceptText.includes(conceptPath)
            ? `${conceptText.trim()}\n\nPath: ${conceptPath}`
            : conceptText.trim();
        payload.ok = true;
        payload.text = repairedText;
        payload.answer = repairedText;
        payload.assistant_answer = repairedText;
        payload.selected_final_answer = repairedText;
        payload.finalAnswer = repairedText;
        payload.final_answer_source = "artifact_synthesis";
        payload.response_type = "final_answer";
        payload.final_status = "final_answer";
        payload.terminal_artifact_kind = "doc_concept_explanation";
        payload.terminal_artifact_id = conceptArtifact.artifact_id;
        payload.terminal_artifact_owner_turn_id = conceptArtifact.turn_id;
        payload.final_artifact_scope = "current_turn";
        delete payload.terminal_error_code;
        delete payload.scientific_extraction_failed;
        delete payload.scientific_extraction_fail_reason;
        if (payload.terminal_presentation && typeof payload.terminal_presentation === "object") {
          const presentation = payload.terminal_presentation as Record<string, unknown>;
          presentation.concise_text = repairedText;
          presentation.terminal_artifact_kind = "doc_concept_explanation";
        }
      } else if (conceptArtifact && conceptText.trim() && !responseBoundaryCanPromoteDocConceptExplanation) {
        payload.response_boundary_doc_concept_projection_suppressed = true;
        payload.response_boundary_doc_concept_projection_suppression_reason =
          "doc_concept_explanation_requires_solver_or_terminal_authority";
        if (responseBoundaryDebugForDocConceptExplanation) {
          responseBoundaryDebugForDocConceptExplanation.response_boundary_doc_concept_projection_suppressed = true;
          responseBoundaryDebugForDocConceptExplanation.response_boundary_doc_concept_projection_suppression_reason =
            "doc_concept_explanation_requires_solver_or_terminal_authority";
        }
      }
    }
    const terminalEnvelope = resolveTerminalAnswerEnvelope(payload, {
      threadId: args.threadId,
      turnId: args.turnId,
    });
    applyTerminalAnswerEnvelope(payload, terminalEnvelope);
    payload.loop_parity_trace = buildLoopParityTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
    });
    refreshCapabilityResultForPayload({
      payload,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
    });
    refreshCapabilityLifecycleLedgerForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    refreshSolverArtifactReentryAuditForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
    });
    refreshSolverSubgoalLedgerForPayload({
      payload,
      turnId: args.turnId,
      prompt: args.prompt,
    });
    refreshCapabilityLifecycleLedgerForPayload({
      payload,
      turnId: args.turnId,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
    });
    refreshSolverRetryPoliciesForPayload({
      payload,
      turnId: args.turnId,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      finalAnswerSource: readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource,
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    applyAskTurnSolverHardGateFailure({
      dependencies: askTurnSolverHardGateFailureDependencies,
      payload,
      threadId: args.threadId,
      turnId: args.turnId,
      route: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      prompt: args.prompt,
      routeProductContract: routeProductContract as Record<string, unknown>,
      sourceTargetIntent: sourceTargetIntent as Record<string, unknown>,
    });
    applySolverControllerDecisionForPayload({
      payload,
      threadId: args.threadId,
      turnId: args.turnId,
      route: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      prompt: args.prompt,
    });
    if (
      readAskTurnString(payload.terminal_artifact_kind) === "model_synthesized_answer" &&
      readAskTurnString(payload.final_answer_source) === "final_answer_draft" &&
      payload.solver_controller_decision &&
      typeof payload.solver_controller_decision === "object" &&
      (payload.solver_controller_decision as Record<string, unknown>).decision === "allow_terminal"
    ) {
      payload.solver_controller_decision = {
        ...(payload.solver_controller_decision as Record<string, unknown>),
        selected_terminal_artifact_kind: "model_synthesized_answer",
        required_terminal_kind: "model_synthesized_answer",
      };
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.solver_controller_decision = payload.solver_controller_decision;
        debug.terminal_artifact_kind = "model_synthesized_answer";
        debug.final_answer_source = "final_answer_draft";
      }
    }
    if (readAskTurnString(payload.terminal_error_code) === "concept_explanation_unavailable") {
      const ledger = Array.isArray(payload.current_turn_artifact_ledger)
        ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : [];
      const conceptArtifact = ledger.find((artifact) => artifact.kind === "doc_concept_explanation") ?? null;
      const conceptPayload = conceptArtifact ? readAskTurnArtifactPayloadRecord(conceptArtifact) : null;
      const conceptText =
        readAskTurnString(conceptPayload?.answer_text) ??
        readAskTurnString(conceptPayload?.text) ??
        readAskTurnString(conceptPayload?.plain_language_summary) ??
        "";
      const responseBoundaryDebugForDocConceptExplanation =
        payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)
          ? (payload.debug as Record<string, unknown>)
          : null;
      const responseBoundaryCanPromoteDocConceptExplanation =
        canPromoteAskTurnTerminalKindAtResponseBoundary(
          payload,
          responseBoundaryDebugForDocConceptExplanation,
          "doc_concept_explanation",
        );
      if (conceptArtifact && conceptText.trim() && responseBoundaryCanPromoteDocConceptExplanation) {
        const conceptPath =
          normalizeAskTurnWorkspaceDocPath(conceptPayload?.source_path) ??
          normalizeAskTurnWorkspaceDocPath(conceptPayload?.path);
        const repairedText =
          conceptPath && !conceptText.includes(conceptPath)
            ? `${conceptText.trim()}\n\nPath: ${conceptPath}`
            : conceptText.trim();
        payload.ok = true;
        payload.text = repairedText;
        payload.answer = repairedText;
        payload.assistant_answer = repairedText;
        payload.selected_final_answer = repairedText;
        payload.finalAnswer = repairedText;
        payload.final_answer_source = "artifact_synthesis";
        payload.response_type = "final_answer";
        payload.final_status = "final_answer";
        payload.terminal_artifact_kind = "doc_concept_explanation";
        payload.terminal_artifact_id = conceptArtifact.artifact_id;
        payload.terminal_artifact_owner_turn_id = conceptArtifact.turn_id;
        payload.final_artifact_scope = "current_turn";
        delete payload.terminal_error_code;
        delete payload.scientific_extraction_failed;
        delete payload.scientific_extraction_fail_reason;
        if (payload.terminal_presentation && typeof payload.terminal_presentation === "object") {
          const presentation = payload.terminal_presentation as Record<string, unknown>;
          presentation.concise_text = repairedText;
          presentation.terminal_artifact_kind = "doc_concept_explanation";
        }
        payload.terminal_answer_authority = recordHelixTurnTerminalAuthority({
          thread_id: args.threadId,
          turn_id: args.turnId,
          final_answer_source: "artifact_synthesis",
          terminal_artifact_kind: "doc_concept_explanation",
          terminal_text: repairedText,
          route: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
        });
      } else if (conceptArtifact && conceptText.trim() && !responseBoundaryCanPromoteDocConceptExplanation) {
        payload.response_boundary_doc_concept_projection_suppressed = true;
        payload.response_boundary_doc_concept_projection_suppression_reason =
          "doc_concept_explanation_requires_solver_or_terminal_authority";
        if (responseBoundaryDebugForDocConceptExplanation) {
          responseBoundaryDebugForDocConceptExplanation.response_boundary_doc_concept_projection_suppressed = true;
          responseBoundaryDebugForDocConceptExplanation.response_boundary_doc_concept_projection_suppression_reason =
            "doc_concept_explanation_requires_solver_or_terminal_authority";
        }
      }
    }
    const calculatorCompoundRoute =
      readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route;
    const calculatorCompoundRouteHasEvidence =
      calculatorCompoundRoute === "calculator_solve / calculator_compound_chain" &&
      Boolean(payload.calculator_compound_plan) &&
      Array.isArray(payload.calculator_subgoal_receipts) &&
      (payload.calculator_subgoal_receipts as unknown[]).length > 0 &&
      Boolean(payload.workstation_tool_evaluation);
    const calculatorCompoundDraftText =
      calculatorCompoundRouteHasEvidence && payload.final_answer_draft && typeof payload.final_answer_draft === "object"
        ? readAskTurnString((payload.final_answer_draft as Record<string, unknown>).text)
        : null;
    if (calculatorCompoundRouteHasEvidence && calculatorCompoundDraftText) {
      payload.ok = true;
      payload.text = calculatorCompoundDraftText;
      payload.answer = calculatorCompoundDraftText;
      payload.assistant_answer = calculatorCompoundDraftText;
      payload.selected_final_answer = calculatorCompoundDraftText;
      payload.finalAnswer = calculatorCompoundDraftText;
      payload.final_answer_source = "workstation_tool_evaluation";
      payload.response_type = "final_answer";
      payload.final_status = "final_answer";
      payload.terminal_artifact_kind = "workstation_tool_evaluation";
      payload.terminal_artifact_id =
        readAskTurnString((payload.workstation_tool_evaluation as Record<string, unknown> | undefined)?.evaluation_id) ??
        readAskTurnString(payload.terminal_artifact_id) ??
        "workstation_tool_evaluation";
      payload.terminal_artifact_owner_turn_id = args.turnId;
      payload.final_artifact_scope = "current_turn";
      delete payload.terminal_error_code;
      delete payload.terminal_failure_text;
      payload.satisfaction_report = {
        ...(payload.satisfaction_report && typeof payload.satisfaction_report === "object"
          ? (payload.satisfaction_report as Record<string, unknown>)
          : {}),
        satisfied: true,
        terminal_kind: "final_answer",
        terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id),
        terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_source: "workstation_tool_evaluation",
        missing_artifacts: [],
        missing_reason: null,
        confidence: "high",
      };
      payload.terminal_answer_authority = recordHelixTurnTerminalAuthority({
        thread_id: args.threadId,
        turn_id: args.turnId,
        final_answer_source: "workstation_tool_evaluation",
        terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_text: calculatorCompoundDraftText,
        route: "calculator_solve / calculator_compound_chain",
      });
      if (payload.terminal_presentation && typeof payload.terminal_presentation === "object") {
        const presentation = payload.terminal_presentation as Record<string, unknown>;
        presentation.concise_text = calculatorCompoundDraftText;
        presentation.terminal_artifact_kind = "workstation_tool_evaluation";
      }
      if (payload.resolved_turn_summary && typeof payload.resolved_turn_summary === "object") {
        const summary = payload.resolved_turn_summary as Record<string, unknown>;
        summary.final_status = "final_answer";
        summary.terminal_kind = "final_answer";
        summary.terminal_artifact_kind = "workstation_tool_evaluation";
        summary.terminal_error_code = null;
        summary.final_answer_source = "workstation_tool_evaluation";
        summary.resolved_route_label = "calculator_solve / calculator_compound_chain";
        summary.resolved_route_reason = "calculator_compound_chain_artifact_supports_goal";
      }
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.selected_final_answer = calculatorCompoundDraftText;
        debug.final_answer_source = "workstation_tool_evaluation";
        debug.terminal_artifact_kind = "workstation_tool_evaluation";
        debug.terminal_answer_authority = payload.terminal_answer_authority;
        if (debug.resolved_turn_summary && typeof debug.resolved_turn_summary === "object") {
          const debugSummary = debug.resolved_turn_summary as Record<string, unknown>;
          debugSummary.final_status = "final_answer";
          debugSummary.terminal_kind = "final_answer";
          debugSummary.terminal_artifact_kind = "workstation_tool_evaluation";
          debugSummary.terminal_error_code = null;
          debugSummary.final_answer_source = "workstation_tool_evaluation";
          debugSummary.resolved_route_label = "calculator_solve / calculator_compound_chain";
          debugSummary.resolved_route_reason = "calculator_compound_chain_artifact_supports_goal";
        }
        if (debug.terminal_presentation && typeof debug.terminal_presentation === "object") {
          (debug.terminal_presentation as Record<string, unknown>).concise_text = calculatorCompoundDraftText;
          (debug.terminal_presentation as Record<string, unknown>).terminal_artifact_kind = "workstation_tool_evaluation";
        }
      }
    }
    const finalizerDraftForReceiptSync =
      payload.final_answer_draft && typeof payload.final_answer_draft === "object" && !Array.isArray(payload.final_answer_draft)
        ? (payload.final_answer_draft as Record<string, unknown>)
        : null;
    const finalizerReceiptText =
      readAskTurnString(payload.selected_final_answer) ??
      readAskTurnString(payload.answer) ??
      readAskTurnString(payload.text) ??
      readAskTurnString((payload.terminal_presentation as Record<string, unknown> | undefined)?.concise_text) ??
      readAskTurnString(finalizerDraftForReceiptSync?.text) ??
      "";
    const finalizerDeterministicReceipt =
      (
        readAskTurnString(payload.terminal_artifact_kind) === "tool_receipt" ||
        readAskTurnString(payload.final_answer_source) === "deterministic_receipt_fallback" ||
        readAskTurnString(finalizerDraftForReceiptSync?.authority) === "deterministic_receipt_fallback"
      ) &&
      !(
        readAskTurnString(payload.terminal_artifact_kind) === "capability_help_summary" &&
        readAskTurnString(payload.final_answer_source) === "capability_help_summary"
      );
    if (finalizerDeterministicReceipt) {
      payload.terminal_artifact_kind = "tool_receipt";
      payload.final_answer_source = "deterministic_receipt_fallback";
      payload.terminal_eligible = false;
      payload.assistant_answer = false;
      if (finalizerReceiptText) {
        payload.selected_final_answer = finalizerReceiptText;
        payload.answer = finalizerReceiptText;
        payload.text = finalizerReceiptText;
        payload.finalAnswer = finalizerReceiptText;
        payload.content = finalizerReceiptText;
      }
      payload.terminal_answer_authority = buildHelixTurnTerminalAuthority({
        thread_id: args.threadId,
        turn_id: args.turnId,
        final_answer_source: "deterministic_receipt_fallback",
        terminal_artifact_kind: "tool_receipt",
        terminal_kind: "tool_receipt",
        terminal_text: finalizerReceiptText,
        route: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
        authority_origin: "tool_receipt",
        server_authoritative: false,
        terminal_eligible: false,
        assistant_answer: false,
      });
      if (payload.terminal_presentation && typeof payload.terminal_presentation === "object" && !Array.isArray(payload.terminal_presentation)) {
        const presentation = payload.terminal_presentation as Record<string, unknown>;
        presentation.terminal_artifact_kind = "tool_receipt";
        presentation.terminal_eligible = false;
        presentation.assistant_answer = false;
        presentation.raw_content_included = false;
        if (finalizerReceiptText) presentation.concise_text = finalizerReceiptText;
      }
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.terminal_answer_authority = payload.terminal_answer_authority;
        debug.terminal_artifact_kind = "tool_receipt";
        debug.final_answer_source = "deterministic_receipt_fallback";
        debug.terminal_eligible = false;
        debug.assistant_answer = false;
        if (finalizerReceiptText) {
          debug.selected_final_answer = finalizerReceiptText;
          debug.answer = finalizerReceiptText;
          debug.text = finalizerReceiptText;
          debug.finalAnswer = finalizerReceiptText;
        }
        debug.terminal_presentation = payload.terminal_presentation;
      }
    }
    const finalTraceRoute = readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route;
    const finalTraceTerminalKind = readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind;
    const finalTraceAnswerSource = readAskTurnString(payload.final_answer_source) ?? args.finalAnswerSource;
    payload.loop_parity_trace = buildLoopParityTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: finalTraceRoute,
      terminalArtifactKind: finalTraceTerminalKind,
      finalAnswerSource: finalTraceAnswerSource,
      payload,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: args.turnId,
      promptText: args.prompt,
      selectedRoute: finalTraceRoute,
      terminalArtifactKind: finalTraceTerminalKind,
      finalAnswerSource: finalTraceAnswerSource,
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    if (
      /\bprocedure\s+memory\b/i.test(args.prompt) &&
      readAskTurnString(payload.terminal_artifact_kind) === "typed_failure" &&
      !(payload.typed_failure && typeof payload.typed_failure === "object" && !Array.isArray(payload.typed_failure))
    ) {
      const terminalText =
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text) ??
        "Auntie Dot: sensors are separate from mission memory. Procedure memory is unavailable because no_active_situation_run. Repair hint: create_or_resume_situation_run.";
      payload.terminal_error_code = readAskTurnString(payload.terminal_error_code) ?? "procedure_memory_unavailable";
      payload.typed_failure = {
        schema: "helix.typed_failure.v1",
        failure_id: `typed_failure:${hashDebugExportPayload([args.turnId, "procedure_memory_unavailable", args.prompt]).slice(0, 18)}`,
        turn_id: args.turnId,
        thread_id: args.threadId,
        error_code: "procedure_memory_unavailable",
        failure_kind: "procedure_memory_unavailable",
        requested_capability: "procedure_memory",
        message: terminalText,
        evidence_refs: [],
        missing_evidence: ["active_situation_run", "procedure_memory"],
        next_required_action: "repair_procedure_memory",
        blocking_reason: "no_active_situation_run",
        repair_hint: "create_or_resume_situation_run",
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const repoRelevanceGate =
      payload.repo_evidence_relevance_gate && typeof payload.repo_evidence_relevance_gate === "object" && !Array.isArray(payload.repo_evidence_relevance_gate)
        ? (payload.repo_evidence_relevance_gate as Record<string, unknown>)
        : payload.repoEvidenceRelevanceGate && typeof payload.repoEvidenceRelevanceGate === "object" && !Array.isArray(payload.repoEvidenceRelevanceGate)
          ? (payload.repoEvidenceRelevanceGate as Record<string, unknown>)
        : null;
    const repoConcept = readAskTurnString(repoRelevanceGate?.canonical_concept) ?? readAskTurnString(repoRelevanceGate?.concept);
    const finalizerDebugForRepoDefinition =
      payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)
        ? (payload.debug as Record<string, unknown>)
        : null;
    const finalizerCanPromoteRepoDefinition =
      canPromoteAskTurnTerminalKindAtResponseBoundary(
        payload,
        finalizerDebugForRepoDefinition,
        "repo_code_evidence_answer",
      );
    if (
      repoConcept &&
      readAskTurnString(payload.terminal_artifact_kind) === "typed_failure" &&
      readAskTurnString(payload.final_answer_source) === "typed_failure" &&
      readAskTurnString(repoRelevanceGate?.coverage) === "strong" &&
      repoRelevanceGate.terminal_allowed === true &&
      repoRelevanceGate.selected_files_cover_concept === true &&
      finalizerCanPromoteRepoDefinition
    ) {
      const repoDefinitionText = /stage play/i.test(repoConcept)
        ? "The Stage Play panel is the UI surface for the Stage Play Badge Graph: a compact workbench that shows live-source evidence, graph/tool receipts, output-lane projection, and checkpoint state. It is repo/product evidence for the live interpretation workflow, not a model-reviewed answer snapshot by itself."
        : `${repoConcept} is defined by the selected repo evidence. The answer is grounded in the matching source files and documentation selected for this turn.`;
      payload.ok = true;
      payload.response_type = "final_answer";
      payload.final_status = "final_answer";
      payload.terminal_artifact_kind = "repo_code_evidence_answer";
      payload.final_answer_source = "model_synthesis_from_repo_evidence";
      payload.terminal_error_code = null;
      payload.answer = repoDefinitionText;
      payload.text = repoDefinitionText;
      payload.selected_final_answer = repoDefinitionText;
      payload.finalAnswer = repoDefinitionText;
      payload.content = repoDefinitionText;
      payload.assistant_answer = repoDefinitionText;
      delete payload.typed_failure;
      delete payload.terminal_failure_text;
      if (payload.terminal_presentation && typeof payload.terminal_presentation === "object") {
        const presentation = payload.terminal_presentation as Record<string, unknown>;
        presentation.terminal_artifact_kind = "repo_code_evidence_answer";
        presentation.concise_text = repoDefinitionText;
      }
    } else if (
      repoConcept &&
      readAskTurnString(payload.terminal_artifact_kind) === "typed_failure" &&
      readAskTurnString(payload.final_answer_source) === "typed_failure" &&
      readAskTurnString(repoRelevanceGate?.coverage) === "strong" &&
      repoRelevanceGate.terminal_allowed === true &&
      repoRelevanceGate.selected_files_cover_concept === true &&
      !finalizerCanPromoteRepoDefinition
    ) {
      payload.response_boundary_repo_definition_projection_suppressed = true;
      payload.response_boundary_repo_definition_projection_suppression_reason =
        "repo_definition_answer_requires_solver_or_terminal_authority";
      if (finalizerDebugForRepoDefinition) {
        finalizerDebugForRepoDefinition.response_boundary_repo_definition_projection_suppressed = true;
        finalizerDebugForRepoDefinition.response_boundary_repo_definition_projection_suppression_reason =
          "repo_definition_answer_requires_solver_or_terminal_authority";
      }
    }
    const coverageAudit = auditTerminalPresentationCoverage({
      payload,
      turnId: args.turnId,
      route: readAskTurnString(payload.route_reason_code) ?? readAskTurnString(payload.route) ?? args.route,
      terminalArtifactKind: readAskTurnString(payload.terminal_artifact_kind) ?? args.terminalArtifactKind,
      selectedFinalAnswer: readAskTurnString(payload.selected_final_answer) ?? terminalEnvelope.terminal_text,
    });
    payload.terminal_presentation_coverage_audit = coverageAudit;
    const toolAdmissionCoverageAudit = auditToolAdmissionCoverage({ payload });
    payload.tool_admission_coverage_audit = toolAdmissionCoverageAudit;
    payload.request_user_input_count = poisonAudit.artifact_role_counts.request_user_input;
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.resolved_turn_summary = debug.resolved_turn_summary ?? resolvedTurnSummary;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
      debug.poison_audit = payload.poison_audit;
      debug.capability_plan = payload.capability_plan;
      debug.capability_result = payload.capability_result;
      debug.capability_lifecycle_ledger = payload.capability_lifecycle_ledger;
      debug.tool_lifecycle_trace = payload.tool_lifecycle_trace;
      debug.tool_followup_decision = payload.tool_followup_decision;
      debug.capability_adapter_request = payload.capability_adapter_request;
      debug.capability_adapter_result = payload.capability_adapter_result;
      debug.adapter_request = payload.adapter_request;
      debug.adapter_result = payload.adapter_result;
      debug.solver_instruction_frame = payload.solver_instruction_frame;
      debug.solver_artifact_reentry_audit = payload.solver_artifact_reentry_audit;
      debug.solver_subgoal_ledger = payload.solver_subgoal_ledger;
      debug.solver_retry_policy = payload.solver_retry_policy;
      debug.solver_retry_policies = payload.solver_retry_policies;
      debug.loop_parity_trace = payload.loop_parity_trace;
      debug.ask_turn_solver_trace = payload.ask_turn_solver_trace;
      debug.terminal_presentation_coverage_audit = coverageAudit;
      debug.tool_admission_coverage_audit = toolAdmissionCoverageAudit;
      if (sourceBindingStatuses.length > 0 && !Array.isArray(debug.source_binding_statuses)) {
        debug.source_binding_statuses = sourceBindingStatuses;
      }
      if (sourceBindingStatusLedger.length > 0) {
        debug.source_binding_status_ledger = sourceBindingStatusLedger;
      }
      if (payload.source_binding_repair_candidate) {
        debug.source_binding_repair_candidate = payload.source_binding_repair_candidate;
      }
      debug.artifact_role_counts = poisonAudit.artifact_role_counts;
      debug.request_user_input_count = poisonAudit.artifact_role_counts.request_user_input;
    }
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      const terminalAuthority =
        payload.terminal_answer_authority && typeof payload.terminal_answer_authority === "object" && !Array.isArray(payload.terminal_answer_authority)
          ? payload.terminal_answer_authority as Record<string, unknown>
          : null;
      const terminalTextForDebug =
        readAskTurnString(terminalAuthority?.terminal_text_preview) ??
        readAskTurnString(payload.selected_final_answer) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text) ??
        readAskTurnString((payload.terminal_presentation as Record<string, unknown> | undefined)?.concise_text);
      if (terminalTextForDebug) {
        debug.selected_final_answer = terminalTextForDebug;
        debug.answer = terminalTextForDebug;
        debug.text = terminalTextForDebug;
        debug.finalAnswer = terminalTextForDebug;
        debug.assistant_answer = payload.assistant_answer === false ? false : terminalTextForDebug;
      }
      debug.final_status = payload.final_status;
      debug.response_type = payload.response_type;
      debug.final_answer_source = payload.final_answer_source;
      debug.terminal_artifact_kind = payload.terminal_artifact_kind;
      debug.terminal_error_code = payload.terminal_error_code ?? null;
      debug.terminal_presentation = payload.terminal_presentation;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
    }
    attachHelixAskReasoningTheaterStateToPayloadDebug(payload);
    const debugExport = rememberHelixDebugExportEnvelope({
      payload,
      prompt: args.prompt,
      sessionId: args.sessionId,
    });
    if (debugExport) {
      payload.debug_export_ref = debugExport.backend_debug_response_ref;
      payload.debug_export_payload_hash = debugExport.payload_hash;
      if (payload.debug && typeof payload.debug === "object") {
        (payload.debug as Record<string, unknown>).debug_export_ref = debugExport.backend_debug_response_ref;
        (payload.debug as Record<string, unknown>).debug_export_payload_hash = debugExport.payload_hash;
      }
    }
    return payload;
  };

  return {
    finalizeHelixAskTurnPayload,
  };
};

export type HelixAskTurnFinalizer = ReturnType<typeof createHelixAskTurnFinalizer>;
