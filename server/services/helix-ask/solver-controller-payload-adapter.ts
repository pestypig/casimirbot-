type RecordLike = Record<string, unknown>;

type HelixAskCanonicalGoalFrame = any;
type HelixAskTurnSatisfactionReport = any;
type HelixTurnArtifact = any;
type HelixAskTurnSelectedAction = any;
type HelixAskTurnWorkspaceSessionSnapshot = any;
type HelixAgentStepDecision = any;
type HelixAskTurnPlanStep = any;
type HelixCompoundPromptCoverageGate = any;

type DependencyFunction = (...args: any[]) => any;

export type SolverControllerPayloadAdapterDependencies = {
  readAskTurnString: DependencyFunction;
  buildRouteProductContract: DependencyFunction;
  buildToolCallAdmissionDecision: DependencyFunction;
  guardTerminalArtifactSelection: DependencyFunction;
  guardProductAuthority: DependencyFunction;
  auditRouteAuthority: DependencyFunction;
  recordHelixTurnTerminalAuthority: DependencyFunction;
  auditHelixAskContextForPoison: DependencyFunction;
  buildTerminalEquivalenceHarnessResult: DependencyFunction;
  refreshHelixGoalSatisfactionEvaluationArtifact: DependencyFunction;
  mergeAskTurnLedgerArtifacts: DependencyFunction;
  hashDebugExportPayloadShort: DependencyFunction;
  buildHelixPromptRequirementCoverage: DependencyFunction;
  buildHelixDocRetrievalCoverage: DependencyFunction;
  evaluateCompoundPromptCoverageGateFromAnswerArtifacts: DependencyFunction;
  buildHelixAvailableCapabilitiesArtifact: DependencyFunction;
  buildHelixAgentStepDecisionArtifact: DependencyFunction;
  attachHelixRouteCoverageArtifactsToRecord: DependencyFunction;
  isExplicitDocsPathComparePrompt: DependencyFunction;
  isExplicitDocsPathLocateSynthesisPrompt: DependencyFunction;
  hasStagePlayLiveSourceWatchJobPolicyObservation: DependencyFunction;
  isStagePlayLiveSourceWatchJobPolicyObservationArtifact: DependencyFunction;
  hasAskTurnInterpreterProfileConfigCue: DependencyFunction;
  hasStagePlayInterpreterProfileConfigObservation: DependencyFunction;
  buildHelixRuntimeLiveSourceMailFallbackText: DependencyFunction;
  isStagePlayInterpreterProfileConfigObservationArtifact: DependencyFunction;
  buildTurnIdIntegrityAudit: DependencyFunction;
  buildFinalRouteReconciliation: DependencyFunction;
  buildCapabilityBindingMismatchObservation: DependencyFunction;
  buildSolverControllerDecision: DependencyFunction;
  buildAskTurnStepResults: DependencyFunction;
  readAskTurnResultArtifact: DependencyFunction;
  resolveAskTurnNoteTargetWithWorkspace: DependencyFunction;
  readAskTurnWorkspaceSnapshotPath: DependencyFunction;
  buildHelixTurnTerminalAuthority: DependencyFunction;
  readLatestInterimVoiceCalloutToolResult: DependencyFunction;
  isInterimVoiceCalloutFinalStatus: DependencyFunction;
  isCompoundInterimVoiceCalloutPromptText: DependencyFunction;
  buildHelixDomainContinuationDecision: DependencyFunction;
  buildHelixRuntimeContinuationHint: DependencyFunction;
  appendHelixRuntimeContinuationHintsToPayload: DependencyFunction;
  buildCompoundCoverageFailureMessage: DependencyFunction;
  resolveTerminalAnswerEnvelope: DependencyFunction;
  applyTerminalAnswerEnvelope: DependencyFunction;
  buildLoopParityTrace: DependencyFunction;
  buildAskTurnSolverTrace: DependencyFunction;
  summarizeAskTurnNoteUpdateReceiptForFinal: DependencyFunction;
  reconcileDebugExportAuthorityParity: DependencyFunction;
  latestStagePlayLiveSourceWatchJobPolicyObservation: DependencyFunction;
  uniqueAskTurnStrings: DependencyFunction;
  attachHelixDocRetrievalCoverageToRecord: DependencyFunction;
  attachHelixPromptRequirementCoverageToRecord: DependencyFunction;
  attachHelixAgentDisciplineArtifacts: DependencyFunction;
};

export type ApplySolverControllerDecisionForPayloadInput = {
  payload: RecordLike;
  threadId: string;
  turnId: string;
  route: string;
  prompt: string;
  transcript?: unknown;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

export const createSolverControllerPayloadAdapter = (dependencies: SolverControllerPayloadAdapterDependencies) => {
  const {
    readAskTurnString,
    buildRouteProductContract,
    buildToolCallAdmissionDecision,
    guardTerminalArtifactSelection,
    guardProductAuthority,
    auditRouteAuthority,
    recordHelixTurnTerminalAuthority,
    auditHelixAskContextForPoison,
    buildTerminalEquivalenceHarnessResult,
    refreshHelixGoalSatisfactionEvaluationArtifact,
    mergeAskTurnLedgerArtifacts,
    hashDebugExportPayloadShort,
    buildHelixPromptRequirementCoverage,
    buildHelixDocRetrievalCoverage,
    evaluateCompoundPromptCoverageGateFromAnswerArtifacts,
    buildHelixAvailableCapabilitiesArtifact,
    buildHelixAgentStepDecisionArtifact,
    attachHelixRouteCoverageArtifactsToRecord,
    isExplicitDocsPathComparePrompt,
    isExplicitDocsPathLocateSynthesisPrompt,
    hasStagePlayLiveSourceWatchJobPolicyObservation,
    isStagePlayLiveSourceWatchJobPolicyObservationArtifact,
    hasAskTurnInterpreterProfileConfigCue,
    hasStagePlayInterpreterProfileConfigObservation,
    buildHelixRuntimeLiveSourceMailFallbackText,
    isStagePlayInterpreterProfileConfigObservationArtifact,
    buildTurnIdIntegrityAudit,
    buildFinalRouteReconciliation,
    buildCapabilityBindingMismatchObservation,
    buildSolverControllerDecision,
    buildAskTurnStepResults,
    readAskTurnResultArtifact,
    resolveAskTurnNoteTargetWithWorkspace,
    readAskTurnWorkspaceSnapshotPath,
    buildHelixTurnTerminalAuthority,
    readLatestInterimVoiceCalloutToolResult,
    isInterimVoiceCalloutFinalStatus,
    isCompoundInterimVoiceCalloutPromptText,
    buildHelixDomainContinuationDecision,
    buildHelixRuntimeContinuationHint,
    appendHelixRuntimeContinuationHintsToPayload,
    buildCompoundCoverageFailureMessage,
    resolveTerminalAnswerEnvelope,
    applyTerminalAnswerEnvelope,
    buildLoopParityTrace,
    buildAskTurnSolverTrace,
    summarizeAskTurnNoteUpdateReceiptForFinal,
    reconcileDebugExportAuthorityParity,
    latestStagePlayLiveSourceWatchJobPolicyObservation,
    uniqueAskTurnStrings,
    attachHelixDocRetrievalCoverageToRecord,
    attachHelixPromptRequirementCoverageToRecord,
    attachHelixAgentDisciplineArtifacts,
  } = dependencies;

  const applySolverControllerDecisionForPayload = (input: ApplySolverControllerDecisionForPayloadInput): boolean => {
    const payload = input.payload;
    const canonicalGoalFrame =
      payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
        ? (payload.canonical_goal_frame as Record<string, unknown>)
        : null;
    const canonicalGoalKind = readAskTurnString(canonicalGoalFrame?.goal_kind);
    const terminalWriterForController =
      payload.terminal_authority_single_writer &&
      typeof payload.terminal_authority_single_writer === "object" &&
      !Array.isArray(payload.terminal_authority_single_writer)
        ? (payload.terminal_authority_single_writer as Record<string, unknown>)
        : null;
    const terminalWriterIntegrityForController =
      terminalWriterForController?.integrity &&
      typeof terminalWriterForController.integrity === "object" &&
      !Array.isArray(terminalWriterForController.integrity)
        ? (terminalWriterForController.integrity as Record<string, unknown>)
        : null;
    const terminalWriterKindForController = readAskTurnString(
      terminalWriterForController?.selected_terminal_artifact_kind,
    );
    const terminalWriterSourceForController = readAskTurnString(terminalWriterForController?.source);
    const terminalWriterVisibleTextForController = readAskTurnString(terminalWriterForController?.visible_text);
    const terminalAuthorityForController =
      payload.terminal_answer_authority &&
      typeof payload.terminal_answer_authority === "object" &&
      !Array.isArray(payload.terminal_answer_authority)
        ? (payload.terminal_answer_authority as Record<string, unknown>)
        : null;
    const terminalWriterMaterializedKindForController = readAskTurnString(
      terminalWriterIntegrityForController?.materialized_terminal_artifact_kind,
    );
    const canonicalRequiredTerminalKind = readAskTurnString(canonicalGoalFrame?.required_terminal_kind);
    const capabilityHelpSingleWriterSelected =
      canonicalGoalKind === "capability_help" &&
      canonicalRequiredTerminalKind === "capability_help_summary" &&
      terminalWriterKindForController === "capability_help_summary" &&
      (
        terminalWriterSourceForController === "capability_help_summary" ||
        terminalWriterMaterializedKindForController === "capability_help_summary" ||
        Boolean(terminalWriterVisibleTextForController)
      );
    const documentLocationSingleWriterSelected =
      (
        canonicalGoalKind === "locate_in_doc" ||
        canonicalGoalKind === "doc_evidence_location" ||
        canonicalGoalKind === "doc_location_result"
      ) &&
      (
        terminalWriterKindForController === "doc_location_matches" ||
        terminalWriterKindForController === "doc_evidence_location" ||
        terminalWriterKindForController === "doc_location_result"
      ) &&
      (
        terminalWriterSourceForController === terminalWriterKindForController ||
        terminalWriterMaterializedKindForController === terminalWriterKindForController ||
        Boolean(terminalWriterVisibleTextForController)
      );
    const theoryContextReflectionSingleWriterSelected =
      canonicalGoalKind === "theory_context_reflection" &&
      canonicalRequiredTerminalKind === "theory_context_reflection_answer" &&
      terminalWriterKindForController === "theory_context_reflection_answer" &&
      (
        terminalWriterSourceForController === "final_answer_draft" ||
        terminalWriterSourceForController === "theory_context_reflection_answer" ||
        terminalWriterMaterializedKindForController === "theory_context_reflection_answer" ||
        Boolean(terminalWriterVisibleTextForController)
      );
    let selectedTerminalArtifactKind = capabilityHelpSingleWriterSelected
      ? "capability_help_summary"
      : theoryContextReflectionSingleWriterSelected
        ? "theory_context_reflection_answer"
        : documentLocationSingleWriterSelected
          ? terminalWriterKindForController
      : readAskTurnString(payload.terminal_artifact_kind);
    const publishAllowedTerminalMirror = (
      terminalArtifactKind: string | null,
      finalAnswerSource: string | null,
      terminalText: string | null,
    ): void => {
      if (
        !terminalArtifactKind ||
        terminalArtifactKind === "typed_failure" ||
        terminalArtifactKind === "request_user_input" ||
        terminalArtifactKind === "pending_server_request" ||
        !terminalText
      ) {
        return;
      }
      const resolvedFinalAnswerSource =
        finalAnswerSource && finalAnswerSource !== "typed_failure" ? finalAnswerSource : terminalArtifactKind;
      payload.ok = true;
      payload.response_type = "final_answer";
      payload.final_status = "final_answer";
      payload.status = "final_answer";
      payload.terminal_artifact_kind = terminalArtifactKind;
      payload.final_answer_source = resolvedFinalAnswerSource;
      payload.selected_final_answer = terminalText;
      payload.answer = terminalText;
      payload.text = terminalText;
      payload.finalAnswer = terminalText;
      payload.content = terminalText;
      payload.assistant_answer = terminalText;
      delete payload.terminal_error_code;
      delete payload.terminal_failure_text;
      delete payload.typed_failure;
      payload.terminal_presentation = {
        ...(payload.terminal_presentation && typeof payload.terminal_presentation === "object"
          ? (payload.terminal_presentation as Record<string, unknown>)
          : {
              schema: "helix.terminal_presentation.v1",
              presentation_id: `terminal_presentation:${input.turnId}`,
              turn_id: input.turnId,
              expansion_available: false,
              expansion_ref: null,
              distillation_ref: null,
              receipt_snapshot_ref: null,
            }),
        schema: "helix.terminal_presentation.v1",
        turn_id: input.turnId,
        terminal_artifact_kind: terminalArtifactKind,
        final_answer_source: resolvedFinalAnswerSource,
        concise_text: terminalText,
        assistant_answer: terminalText,
        raw_content_included: false,
      };
      if (payload.resolved_turn_summary && typeof payload.resolved_turn_summary === "object" && !Array.isArray(payload.resolved_turn_summary)) {
        const resolvedSummary = payload.resolved_turn_summary as Record<string, unknown>;
        resolvedSummary.final_status = "final_answer";
        resolvedSummary.terminal_artifact_kind = terminalArtifactKind;
        resolvedSummary.final_answer_source = resolvedFinalAnswerSource;
        resolvedSummary.terminal_error_code = null;
      }
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.ok = payload.ok;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.status = payload.status;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_error_code = null;
        debug.selected_final_answer = payload.selected_final_answer;
        debug.answer = payload.answer;
        debug.text = payload.text;
        debug.finalAnswer = payload.finalAnswer;
        debug.assistant_answer = payload.assistant_answer;
        debug.terminal_presentation = payload.terminal_presentation;
        delete debug.typed_failure;
        delete debug.terminal_failure_text;
      }
    };
    if (capabilityHelpSingleWriterSelected) {
      publishAllowedTerminalMirror(
        "capability_help_summary",
        "capability_help_summary",
        terminalWriterVisibleTextForController ??
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text),
      );
      selectedTerminalArtifactKind = "capability_help_summary";
    }
    if (documentLocationSingleWriterSelected) {
      publishAllowedTerminalMirror(
        terminalWriterKindForController,
        terminalWriterKindForController,
        terminalWriterVisibleTextForController ??
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text),
      );
      selectedTerminalArtifactKind = terminalWriterKindForController;
    }
    if (theoryContextReflectionSingleWriterSelected) {
      publishAllowedTerminalMirror(
        "theory_context_reflection_answer",
        "final_answer_draft",
        terminalWriterVisibleTextForController ??
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text),
      );
      selectedTerminalArtifactKind = "theory_context_reflection_answer";
    }
    const inputRouteBase = input.route.split("/")[0]?.trim() || input.route;
    const controllerRoute =
      inputRouteBase === "dispatch:act" &&
      canonicalGoalKind === "doc_open_best" &&
      selectedTerminalArtifactKind === "doc_open_receipt"
        ? "doc_open_best"
        : inputRouteBase === "dispatch:act" &&
            (canonicalGoalKind === "doc_summary" || canonicalGoalKind === "active_doc_summary") &&
            selectedTerminalArtifactKind === "doc_summary"
          ? canonicalGoalKind
        : inputRouteBase === "dispatch:act" &&
            canonicalGoalKind === "calculator_solve" &&
            selectedTerminalArtifactKind === "workstation_tool_evaluation"
          ? "calculator_solve"
        : inputRouteBase === "dispatch:act" &&
            canonicalGoalKind === "calculator_live_source" &&
            selectedTerminalArtifactKind === "workstation_tool_evaluation"
          ? "calculator_live_source"
        : canonicalGoalKind === "capability_help" &&
            selectedTerminalArtifactKind === canonicalRequiredTerminalKind
          ? "capability_help"
        : canonicalGoalKind === "theory_context_reflection" &&
            selectedTerminalArtifactKind === canonicalRequiredTerminalKind
          ? "theory_context_reflection"
        : canonicalGoalKind === "locate_in_doc" &&
            (
              selectedTerminalArtifactKind === "doc_location_matches" ||
              selectedTerminalArtifactKind === "doc_evidence_location" ||
              selectedTerminalArtifactKind === "doc_location_result"
            )
          ? "locate_in_doc"
        : canonicalGoalKind === "live_environment_review" &&
            selectedTerminalArtifactKind === canonicalGoalFrame?.required_terminal_kind
          ? "live_environment_review"
        : (inputRouteBase === "unknown" || inputRouteBase === "/ask" || inputRouteBase === "/ask/turn") &&
            canonicalGoalKind &&
            selectedTerminalArtifactKind === canonicalGoalFrame?.required_terminal_kind
          ? canonicalGoalKind
          : input.route;
    if (
      controllerRoute !== input.route ||
      capabilityHelpSingleWriterSelected ||
      theoryContextReflectionSingleWriterSelected ||
      documentLocationSingleWriterSelected
    ) {
      payload.route_reason_code = controllerRoute;
      let sourceTargetIntent =
        payload.source_target_intent && typeof payload.source_target_intent === "object"
          ? (payload.source_target_intent as Record<string, unknown>)
          : {};
      if (
        (!readAskTurnString(sourceTargetIntent.target_source) || sourceTargetIntent.target_source === "unknown") &&
        canonicalGoalKind === "doc_open_best"
      ) {
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: "docs_viewer",
          target_kind: "doc_open_best",
          strength: "hard",
          explicit_cues: ["doc_open_best"],
          reasons: ["canonical_doc_open_best_terminal_reconciliation"],
          requested_outputs: ["doc_open_receipt"],
          suppressed_routes: ["situation_context_question", "visual_deictic", "visual_frame_evidence"],
          precedence_reason: "canonical_doc_open_best_terminal_reconciliation",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.86,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
      if (
        (!readAskTurnString(sourceTargetIntent.target_source) || sourceTargetIntent.target_source === "unknown") &&
        (canonicalGoalKind === "doc_summary" || canonicalGoalKind === "active_doc_summary") &&
        selectedTerminalArtifactKind === "doc_summary"
      ) {
        const activeDocSummary = canonicalGoalKind === "active_doc_summary";
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: activeDocSummary ? "active_doc" : "docs_viewer",
          target_kind: canonicalGoalKind,
          strength: "hard",
          explicit_cues: [canonicalGoalKind],
          reasons: [`canonical_${canonicalGoalKind}_terminal_reconciliation`],
          requested_outputs: ["doc_summary"],
          suppressed_routes: ["situation_context_question", "visual_deictic", "visual_frame_evidence", "model_only_concept", "no_tool_direct"],
          precedence_reason: `canonical_${canonicalGoalKind}_terminal_reconciliation`,
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.88,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
      if (
        (canonicalGoalKind === "calculator_solve" || canonicalGoalKind === "calculator_live_source") &&
        selectedTerminalArtifactKind === "workstation_tool_evaluation" &&
        readAskTurnString(sourceTargetIntent.target_source) !== "calculator_stream"
      ) {
        const isCalculatorLiveSource = canonicalGoalKind === "calculator_live_source";
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: "calculator_stream",
          target_kind: "calculator_stream",
          strength: "hard",
          explicit_cues: [isCalculatorLiveSource ? "scientific_calculator_live_source" : "scientific_calculator_solve"],
          reasons: [isCalculatorLiveSource ? "canonical_calculator_live_source_terminal_reconciliation" : "canonical_calculator_solve_terminal_reconciliation"],
          requested_outputs: isCalculatorLiveSource
            ? ["workstation_live_source_receipt", "workstation_tool_evaluation"]
            : ["calculator_receipt", "workstation_tool_evaluation"],
          suppressed_routes: ["situation_context_question", "visual_deictic", "visual_frame_evidence", "model_only_concept", "no_tool_direct"],
          precedence_reason: isCalculatorLiveSource
            ? "canonical_calculator_live_source_terminal_reconciliation"
            : "canonical_calculator_solve_terminal_reconciliation",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.88,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
      if (
        capabilityHelpSingleWriterSelected &&
        readAskTurnString(sourceTargetIntent.target_source) !== "runtime_evidence"
      ) {
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: "runtime_evidence",
          target_kind: "capability_help",
          strength: "hard",
          explicit_cues: ["capability_help"],
          reasons: ["canonical_capability_help_terminal_reconciliation"],
          requested_outputs: ["capability_registry", "capability_help_summary"],
          suppressed_routes: ["situation_context_question", "visual_deictic", "visual_frame_evidence", "model_only_concept", "no_tool_direct"],
          precedence_reason: "canonical_capability_help_terminal_reconciliation",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.88,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
      if (
        documentLocationSingleWriterSelected &&
        !["docs_viewer", "active_doc"].includes(readAskTurnString(sourceTargetIntent.target_source) ?? "")
      ) {
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: "docs_viewer",
          target_kind: "locate_in_doc",
          strength: "hard",
          explicit_cues: ["docs-viewer.locate_in_doc"],
          reasons: ["canonical_doc_location_terminal_reconciliation"],
          requested_outputs: ["doc_location_matches", "doc_evidence_location"],
          suppressed_routes: ["situation_context_question", "visual_deictic", "visual_frame_evidence", "model_only_concept", "no_tool_direct"],
          precedence_reason: "canonical_doc_location_terminal_reconciliation",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.88,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
      if (
        theoryContextReflectionSingleWriterSelected &&
        readAskTurnString(sourceTargetIntent.target_source) !== "theory_locator"
      ) {
        sourceTargetIntent = {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: input.turnId,
          thread_id: input.threadId,
          target_source: "theory_locator",
          target_kind: "theory_context_reflection",
          strength: "hard",
          explicit_cues: ["helix_ask.reflect_theory_context"],
          reasons: ["canonical_theory_context_reflection_terminal_reconciliation"],
          requested_outputs: [
            "helix_theory_context_reflection_tool_receipt",
            "workstation_tool_evaluation",
            "theory_context_reflection_answer",
          ],
          suppressed_routes: ["model_only_concept", "no_tool_direct", "panel_generated_answer"],
          precedence_reason: "canonical_theory_context_reflection_terminal_reconciliation",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          confidence: 0.88,
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.source_target_intent = sourceTargetIntent;
      }
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
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
      });
      payload.product_authority_guard = guardProductAuthority({
        sourceTargetIntent,
        toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
        routeProductContract,
        terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
      });
      payload.route_authority_audit = auditRouteAuthority({
        turnId: input.turnId,
        promptText: input.prompt,
        selectedRoute: controllerRoute,
        payload,
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
        finalAnswerSource: readAskTurnString(payload.final_answer_source),
        sourceTargetIntent,
        routeProductContract,
        toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
        terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
        productAuthorityGuard: payload.product_authority_guard as Record<string, unknown>,
        committedAskRoute: payload.committed_ask_route as Record<string, unknown>,
      });
      const terminalText =
        readAskTurnString(payload.selected_final_answer) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text);
      if (terminalText) {
        const terminalAuthorityRecord = recordHelixTurnTerminalAuthority({
          thread_id: input.threadId,
          turn_id: input.turnId,
          final_answer_source: readAskTurnString(payload.final_answer_source),
          terminal_artifact_kind: selectedTerminalArtifactKind,
          terminal_text: terminalText,
          route: controllerRoute,
        });
        payload.terminal_answer_authority = terminalAuthorityRecord;
        payload.poison_audit = auditHelixAskContextForPoison({
          thread_id: input.threadId,
          turn_id: input.turnId,
          payload,
          terminal_authority: terminalAuthorityRecord,
          client_visible_text: terminalText,
        });
      }
    }
    if (!payload.route_authority_audit) {
      const sourceTargetIntent =
        payload.source_target_intent && typeof payload.source_target_intent === "object"
          ? (payload.source_target_intent as Record<string, unknown>)
          : {};
      const routeProductContract = buildRouteProductContract({
        turnId: input.turnId,
        threadId: input.threadId,
        sourceTargetIntent,
        promptText: input.prompt,
      });
      payload.route_product_contract = payload.route_product_contract ?? routeProductContract;
      payload.terminal_artifact_selection_guard = payload.terminal_artifact_selection_guard ?? guardTerminalArtifactSelection({
        contract: routeProductContract,
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
      });
      payload.product_authority_guard = payload.product_authority_guard ?? guardProductAuthority({
        sourceTargetIntent,
        toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
        routeProductContract,
        terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
      });
      payload.route_authority_audit = auditRouteAuthority({
        turnId: input.turnId,
        promptText: input.prompt,
        selectedRoute: controllerRoute,
        payload,
        terminalArtifactKind: selectedTerminalArtifactKind ?? "unknown",
        finalAnswerSource: readAskTurnString(payload.final_answer_source),
        sourceTargetIntent,
        routeProductContract,
        toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
        terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
        productAuthorityGuard: payload.product_authority_guard as Record<string, unknown>,
        committedAskRoute: payload.committed_ask_route as Record<string, unknown>,
      });
    }
    const canonicalGoalForController =
      payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
        ? (payload.canonical_goal_frame as HelixAskCanonicalGoalFrame)
        : null;
    const satisfactionReportForController =
      payload.satisfaction_report && typeof payload.satisfaction_report === "object"
        ? (payload.satisfaction_report as HelixAskTurnSatisfactionReport)
        : canonicalGoalForController && readAskTurnString(payload.terminal_artifact_kind)
          ? {
              satisfied:
                readAskTurnString(payload.final_status) !== "final_failure" &&
                readAskTurnString(payload.response_type) !== "final_failure" &&
                readAskTurnString(payload.terminal_artifact_kind) !== "typed_failure",
              terminal_kind: readAskTurnString(payload.final_status) === "pending_input" ? "pending_input" : "final_answer",
              terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id) ?? undefined,
              terminal_artifact_kind: readAskTurnString(payload.terminal_artifact_kind) ?? undefined,
              terminal_source:
                readAskTurnString(payload.final_answer_source) === "request_user_input"
                  ? "request_user_input"
                  : readAskTurnString(payload.final_answer_source) === "typed_failure"
                    ? "typed_failure"
                    : "artifact_synthesis",
              missing_artifacts: readAskTurnString(payload.terminal_artifact_kind) === "typed_failure"
                ? [canonicalGoalForController.required_terminal_kind]
                : [],
              missing_reason: readAskTurnString(payload.terminal_error_code) ?? undefined,
              confidence: "medium",
              rejected_terminal_candidates: [],
            } as HelixAskTurnSatisfactionReport
          : null;
    const ledgerForController = Array.isArray(payload.current_turn_artifact_ledger)
      ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const refreshTerminalSurfaceParity = (requireControllerParity: boolean): void => {
      const visibleText =
        readAskTurnString(payload.selected_final_answer) ??
        readAskTurnString(payload.finalAnswer) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text);
      if (!visibleText) return;
      const parity = buildTerminalEquivalenceHarnessResult({
        nonStreamResponse: payload,
        visibleUiAnswerState: {
          question: input.prompt,
          finalAnswer: visibleText,
        },
        requireControllerParity,
        suppressDisciplineAutoRequire: !requireControllerParity,
      });
      payload.terminal_equivalence_harness_result = parity;
      payload.terminal_surface_parity_invariant = parity;
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.terminal_equivalence_harness_result = parity;
        debug.terminal_surface_parity_invariant = parity;
      }
    };
    if (canonicalGoalForController && satisfactionReportForController) {
      const actionRecord =
        payload.action_envelope && typeof payload.action_envelope === "object"
          ? (payload.action_envelope as Record<string, unknown>)
          : payload.workspace_action && typeof payload.workspace_action === "object"
            ? (payload.workspace_action as Record<string, unknown>)
            : null;
      const actionEnvelopeActions = Array.isArray(actionRecord?.workstation_actions)
        ? actionRecord.workstation_actions.filter(
            (entry): entry is Record<string, unknown> =>
              Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
          )
        : [];
      const actionFromEnvelope =
        actionEnvelopeActions.find(
          (entry) =>
            readAskTurnString(entry.panel_id) === "narrator" &&
            readAskTurnString(entry.action_id) === "narrator.debug_auto_speak_probe",
        ) ??
        actionEnvelopeActions.find(
          (entry) =>
            Boolean(readAskTurnString(entry.panel_id)) &&
            Boolean(readAskTurnString(entry.action_id)) &&
            readAskTurnString(entry.action_id) !== "open",
        ) ??
        null;
      const selectedActionRecord = actionFromEnvelope ?? actionRecord;
      const actionPanelId = readAskTurnString(selectedActionRecord?.panel_id);
      const actionId = readAskTurnString(selectedActionRecord?.action_id);
      const selectedActionForController =
        actionPanelId && actionId
          ? ({
              schema_version: "helix.workstation.action/v1",
              action: "run_panel_action",
              panel_id: actionPanelId,
              action_id: actionId,
              args: selectedActionRecord?.args && typeof selectedActionRecord.args === "object" ? selectedActionRecord.args : {},
            } as HelixAskTurnSelectedAction)
          : null;
      const refreshedGoalSatisfaction = refreshHelixGoalSatisfactionEvaluationArtifact({
        turnId: input.turnId,
        transcript: input.prompt,
        canonicalGoalFrame: canonicalGoalForController,
        currentTurnArtifacts: ledgerForController,
        satisfactionReport: satisfactionReportForController,
        selectedAction: selectedActionForController,
      });
      const workspaceSnapshotForDiscipline =
        payload.workspace_context_snapshot && typeof payload.workspace_context_snapshot === "object" && !Array.isArray(payload.workspace_context_snapshot)
          ? (payload.workspace_context_snapshot as HelixAskTurnWorkspaceSessionSnapshot)
          : null;
      const refreshedAgentDiscipline = attachHelixAgentDisciplineArtifacts({
        turnId: input.turnId,
        transcript: input.prompt,
        canonicalGoalFrame: canonicalGoalForController,
        artifacts: refreshedGoalSatisfaction.artifacts,
        selectedAction: selectedActionForController,
        workspaceSnapshot: workspaceSnapshotForDiscipline,
        goalSatisfactionEvaluation: refreshedGoalSatisfaction.evaluation,
      });
      const existingAgentStepDecision =
        payload.agent_step_decision && typeof payload.agent_step_decision === "object"
          ? (payload.agent_step_decision as HelixAgentStepDecision)
          : null;
      const finalAgentStepDecision =
        existingAgentStepDecision?.sampling?.mode === "llm" && existingAgentStepDecision.next_step !== "next_action"
          ? existingAgentStepDecision
          : refreshedAgentDiscipline.agentStepDecision;
      const agentDisciplineArtifacts =
        finalAgentStepDecision === refreshedAgentDiscipline.agentStepDecision
          ? refreshedAgentDiscipline.artifacts
          : mergeAskTurnLedgerArtifacts([
              ...refreshedAgentDiscipline.artifacts.filter(
                (artifact) => !(artifact.kind === "agent_step_decision" && artifact.artifact_id === `${input.turnId}:agent_step_decision`),
              ),
              {
                artifact_id: `${input.turnId}:agent_step_decision`,
                turn_id: input.turnId,
                producer_item_id: "agent_step_decision",
                kind: "agent_step_decision",
                created_at_ms: Date.now(),
                source_scope: "current_turn",
                goal_hash: hashDebugExportPayloadShort([input.turnId, "agent_step_decision", "preserved_llm"]),
                payload: finalAgentStepDecision as unknown as Record<string, unknown>,
              },
            ]);
      const mergedAgentDisciplineArtifacts = mergeAskTurnLedgerArtifacts([
        ...ledgerForController,
        ...agentDisciplineArtifacts,
      ]);
      payload.goal_satisfaction_evaluation = refreshedGoalSatisfaction.evaluation;
      payload.available_capabilities = refreshedAgentDiscipline.availableCapabilities;
      payload.agent_step_decision = finalAgentStepDecision;
      payload.observation_review = refreshedAgentDiscipline.observationReview;
      payload.current_turn_artifact_ledger = mergedAgentDisciplineArtifacts;
      attachHelixRouteCoverageArtifactsToRecord(payload, mergedAgentDisciplineArtifacts);
      const promptRequirementCoverage = buildHelixPromptRequirementCoverage({
        turnId: input.turnId,
        prompt: input.prompt,
        canonicalGoalFrame: canonicalGoalForController,
        payload,
        artifacts: mergedAgentDisciplineArtifacts,
      });
      if (promptRequirementCoverage) {
        const promptCoverageArtifact: HelixTurnArtifact = {
          artifact_id: `${input.turnId}:prompt_requirement_coverage`,
          turn_id: input.turnId,
          producer_item_id: "prompt_requirement_coverage",
          kind: "prompt_requirement_coverage",
          created_at_ms: Date.now(),
          source_scope: "current_turn",
          goal_hash: hashDebugExportPayloadShort([input.turnId, "prompt_requirement_coverage", promptRequirementCoverage.coverage]),
          payload: promptRequirementCoverage as unknown as Record<string, unknown>,
        };
        payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
          ...mergedAgentDisciplineArtifacts.filter((artifact) => artifact.kind !== "prompt_requirement_coverage"),
          promptCoverageArtifact,
        ]);
        payload.prompt_requirement_coverage = promptRequirementCoverage;
        if (promptRequirementCoverage.coverage !== "complete") {
          payload.final_answer_repair_request = {
            schema: "helix.final_answer_repair_request.v1",
            turn_id: input.turnId,
            reason: "prompt_requirement_coverage_incomplete",
            missing_requirement_ids: promptRequirementCoverage.missing_requirement_ids,
            coverage_ref: promptCoverageArtifact.artifact_id,
            assistant_answer: false,
            raw_content_included: false,
          };
        }
      }
      const docRetrievalCoverage = buildHelixDocRetrievalCoverage({
        turnId: input.turnId,
        prompt: input.prompt,
        canonicalGoalFrame: canonicalGoalForController,
        payload,
        artifacts: Array.isArray(payload.current_turn_artifact_ledger)
          ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
          : mergedAgentDisciplineArtifacts,
      });
      if (docRetrievalCoverage) {
        const docRetrievalCoverageArtifact: HelixTurnArtifact = {
          artifact_id: `${input.turnId}:doc_retrieval_coverage`,
          turn_id: input.turnId,
          producer_item_id: "doc_retrieval_coverage",
          kind: "doc_retrieval_coverage",
          created_at_ms: Date.now(),
          source_scope: "current_turn",
          goal_hash: hashDebugExportPayloadShort([input.turnId, "doc_retrieval_coverage", docRetrievalCoverage.coverage]),
          payload: docRetrievalCoverage as unknown as Record<string, unknown>,
        };
        payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
          ...(Array.isArray(payload.current_turn_artifact_ledger)
            ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[]).filter((artifact) => artifact.kind !== "doc_retrieval_coverage")
            : mergedAgentDisciplineArtifacts.filter((artifact) => artifact.kind !== "doc_retrieval_coverage")),
          docRetrievalCoverageArtifact,
        ]);
        payload.doc_retrieval_coverage = docRetrievalCoverage;
        if (docRetrievalCoverage.coverage !== "complete") {
          payload.final_answer_repair_request = {
            schema: "helix.final_answer_repair_request.v1",
            turn_id: input.turnId,
            reason: "doc_retrieval_coverage_incomplete",
            missing_requirement_ids: docRetrievalCoverage.missing_requirement_ids,
            coverage_ref: docRetrievalCoverageArtifact.artifact_id,
            assistant_answer: false,
            raw_content_included: false,
          };
        }
      }
      const solverTraceForCompoundGate =
        payload.ask_turn_solver_trace && typeof payload.ask_turn_solver_trace === "object" && !Array.isArray(payload.ask_turn_solver_trace)
          ? (payload.ask_turn_solver_trace as Record<string, unknown>)
          : null;
      const promptInterpretationForCompoundGate =
        solverTraceForCompoundGate?.prompt_interpretation && typeof solverTraceForCompoundGate.prompt_interpretation === "object" && !Array.isArray(solverTraceForCompoundGate.prompt_interpretation)
          ? (solverTraceForCompoundGate.prompt_interpretation as Record<string, unknown>)
          : payload.prompt_interpretation && typeof payload.prompt_interpretation === "object" && !Array.isArray(payload.prompt_interpretation)
            ? (payload.prompt_interpretation as Record<string, unknown>)
            : null;
      const compoundContractForGate =
        solverTraceForCompoundGate?.compound_prompt_contract && typeof solverTraceForCompoundGate.compound_prompt_contract === "object" && !Array.isArray(solverTraceForCompoundGate.compound_prompt_contract)
          ? (solverTraceForCompoundGate.compound_prompt_contract as Record<string, unknown>)
          : promptInterpretationForCompoundGate?.compound_contract && typeof promptInterpretationForCompoundGate.compound_contract === "object" && !Array.isArray(promptInterpretationForCompoundGate.compound_contract)
            ? (promptInterpretationForCompoundGate.compound_contract as Record<string, unknown>)
            : null;
      const sourceTargetIntentForCompoundGate =
        payload.source_target_intent && typeof payload.source_target_intent === "object" && !Array.isArray(payload.source_target_intent)
          ? (payload.source_target_intent as Record<string, unknown>)
          : null;
      const compoundGateRouteScope =
        canonicalGoalForController.goal_kind === "model_only_concept" ||
        canonicalGoalForController.goal_kind === "conversation" ||
        canonicalGoalForController.goal_kind === "workspace_help" ||
        canonicalGoalForController.answer_scope === "model_only" ||
        (
          !["repo_code", "docs_viewer", "active_doc", "runtime_evidence", "workstation_panel", "workspace_action", "calculator_stream", "situation_room", "live_pipeline", "visual_capture"].includes(readAskTurnString(sourceTargetIntentForCompoundGate?.target_source) ?? "") &&
          !["hard"].includes(readAskTurnString(sourceTargetIntentForCompoundGate?.strength) ?? "")
        )
          ? "model_only" as const
          : "source_targeted" as const;
      const compoundGateArtifacts = Array.isArray(payload.current_turn_artifact_ledger)
        ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : mergedAgentDisciplineArtifacts;
      const compoundCoverageFromArtifacts = evaluateCompoundPromptCoverageGateFromAnswerArtifacts({
        turnId: input.turnId,
        payload,
        artifactLedger: compoundGateArtifacts,
        promptText: input.prompt,
        contract: compoundContractForGate,
        routeScope: compoundGateRouteScope,
      });
      const compoundPromptCoverageGate = compoundCoverageFromArtifacts.gate;
      payload.model_only_compound_coverage_from_answer = compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer;
      if (compoundPromptCoverageGate.applies) {
        const compoundCoverageArtifact: HelixTurnArtifact = {
          artifact_id: `${input.turnId}:compound_prompt_coverage_gate`,
          turn_id: input.turnId,
          producer_item_id: "compound_prompt_coverage_gate",
          kind: "compound_prompt_coverage_gate",
          created_at_ms: Date.now(),
          source_scope: "current_turn",
          goal_hash: hashDebugExportPayloadShort([input.turnId, "compound_prompt_coverage_gate", compoundPromptCoverageGate.decision]),
          payload: compoundPromptCoverageGate as unknown as Record<string, unknown>,
        };
        payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
          ...(Array.isArray(payload.current_turn_artifact_ledger)
            ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[]).filter((artifact) =>
                artifact.kind !== "compound_prompt_coverage_gate" &&
                artifact.kind !== "model_only_compound_coverage_from_answer")
            : []),
          compoundCoverageArtifact,
          {
            artifact_id: `${input.turnId}:model_only_compound_coverage_from_answer`,
            turn_id: input.turnId,
            producer_item_id: "model_only_compound_coverage_from_answer",
            kind: "model_only_compound_coverage_from_answer",
            created_at_ms: Date.now(),
            source_scope: "current_turn",
            goal_hash: hashDebugExportPayloadShort([
              input.turnId,
              "model_only_compound_coverage_from_answer",
              compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer.passed,
            ]),
            payload: compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer as unknown as Record<string, unknown>,
          },
        ]);
        payload.compound_prompt_coverage_gate = compoundPromptCoverageGate;
        if (
          compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer.passed &&
          compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer.route_scope === "model_only_allowed"
        ) {
          payload.goal_satisfaction_evaluation = {
            ...(payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object" && !Array.isArray(payload.goal_satisfaction_evaluation)
              ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
              : {}),
            schema: "helix.goal_satisfaction_evaluation.v1",
            turn_id: input.turnId,
            satisfaction: "satisfied",
            next_decision: "allow_terminal",
            reason: "model_only_compound_answer_covers_required_parts",
            supporting_artifact_refs: [
              compoundCoverageFromArtifacts.selected_answer_artifact_ref,
              `${input.turnId}:compound_prompt_coverage_gate`,
            ].filter(Boolean),
            assistant_answer: false,
            raw_content_included: false,
          };
          delete payload.final_answer_repair_request;
        }
        if (!compoundPromptCoverageGate.passed) {
          payload.final_answer_repair_request = {
            schema: "helix.final_answer_repair_request.v1",
            turn_id: input.turnId,
            reason: "compound_prompt_coverage_incomplete",
            missing_requirement_ids: compoundPromptCoverageGate.unresolved_requirement_ids,
            non_visible_blocked_requirement_ids: compoundPromptCoverageGate.non_visible_blocked_requirement_ids,
            coverage_ref: compoundCoverageArtifact.artifact_id,
            assistant_answer: false,
            raw_content_included: false,
          };
        }
      }
      if (!payload.initial_available_capabilities || !payload.initial_agent_step_decision) {
        const initialAvailableCapabilities = buildHelixAvailableCapabilitiesArtifact({
          turnId: input.turnId,
          transcript: input.prompt,
          canonicalGoalFrame: canonicalGoalForController,
          selectedAction: selectedActionForController,
          workspaceSnapshot: workspaceSnapshotForDiscipline,
        });
        const initialAgentStepDecision = buildHelixAgentStepDecisionArtifact({
          turnId: input.turnId,
          transcript: input.prompt,
          canonicalGoalFrame: canonicalGoalForController,
          availableCapabilities: initialAvailableCapabilities,
          selectedAction: selectedActionForController,
          workspaceSnapshot: workspaceSnapshotForDiscipline,
        });
        payload.initial_available_capabilities = initialAvailableCapabilities;
        payload.initial_agent_step_decision = initialAgentStepDecision;
      }
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.goal_satisfaction_evaluation = refreshedGoalSatisfaction.evaluation;
        debug.available_capabilities = refreshedAgentDiscipline.availableCapabilities;
        debug.agent_step_decision = finalAgentStepDecision;
        debug.observation_review = refreshedAgentDiscipline.observationReview;
        debug.current_turn_artifact_ledger = payload.current_turn_artifact_ledger;
        attachHelixRouteCoverageArtifactsToRecord(debug, Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger as HelixTurnArtifact[] : mergedAgentDisciplineArtifacts);
        attachHelixPromptRequirementCoverageToRecord(debug, promptRequirementCoverage);
        attachHelixDocRetrievalCoverageToRecord(debug, docRetrievalCoverage);
        debug.compound_prompt_coverage_gate = payload.compound_prompt_coverage_gate;
        debug.model_only_compound_coverage_from_answer = payload.model_only_compound_coverage_from_answer;
        if (payload.final_answer_repair_request) debug.final_answer_repair_request = payload.final_answer_repair_request;
        debug.initial_available_capabilities = payload.initial_available_capabilities;
        debug.initial_agent_step_decision = payload.initial_agent_step_decision;
      }
    }
    const docsEvidenceSynthesisOperationForCanonicalGoal =
      isExplicitDocsPathComparePrompt(input.prompt) || isExplicitDocsPathLocateSynthesisPrompt(input.prompt);
    if (payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object") {
      const existingCanonicalGoalFrame = payload.canonical_goal_frame as Record<string, unknown>;
      payload.canonical_goal_frame = {
        ...existingCanonicalGoalFrame,
        turn_id: input.turnId,
        ...(docsEvidenceSynthesisOperationForCanonicalGoal
          ? {
              goal_kind: "doc_evidence_synthesis",
              required_terminal_kind: "doc_evidence_synthesis_answer",
              docs_operation: isExplicitDocsPathComparePrompt(input.prompt) ? "multi_doc_compare" : "locate_synthesis",
              terminal_downgrade_forbidden: true,
              classifier_reasons: uniqueAskTurnStrings([
                ...(Array.isArray(existingCanonicalGoalFrame.classifier_reasons)
                  ? existingCanonicalGoalFrame.classifier_reasons.map(String)
                  : []),
                "late_canonical_goal_override_blocks_doc_summary_downgrade",
              ]),
            }
          : {}),
      };
    }
    if (Array.isArray(payload.current_turn_artifact_ledger)) {
      payload.current_turn_artifact_ledger = payload.current_turn_artifact_ledger.map((entry) => {
        if (!entry || typeof entry !== "object") return entry;
        const record = entry as Record<string, unknown>;
        const sourceScope = readAskTurnString(record.source_scope);
        if (sourceScope === "prior_context" || sourceScope === "prior_turn_context" || sourceScope === "prior_artifact") return entry;
        return { ...record, turn_id: input.turnId };
      });
    }
    const plannerContractRecord =
      payload.planner_contract && typeof payload.planner_contract === "object"
        ? (payload.planner_contract as Record<string, unknown>)
        : null;
    if (plannerContractRecord) {
      payload.initial_available_capabilities = plannerContractRecord.available_capabilities ?? payload.initial_available_capabilities;
      payload.initial_agent_step_decision = plannerContractRecord.agent_step_decision ?? payload.initial_agent_step_decision;
      payload.agent_step_authority_check = plannerContractRecord.agent_step_authority_check ?? payload.agent_step_authority_check;
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.initial_available_capabilities = payload.initial_available_capabilities;
        debug.initial_agent_step_decision = payload.initial_agent_step_decision;
        debug.agent_step_authority_check = payload.agent_step_authority_check;
      }
    }
    const currentTurnEvents = Array.isArray(payload.current_turn_events)
      ? payload.current_turn_events
      : Array.isArray(payload.turn_events)
        ? payload.turn_events
        : null;
    if (currentTurnEvents) {
      const normalizedEvents = currentTurnEvents.map((entry) => {
        if (!entry || typeof entry !== "object") return entry;
        const record = entry as Record<string, unknown>;
        return Object.prototype.hasOwnProperty.call(record, "turn_id") ? { ...record, turn_id: input.turnId } : record;
      });
      if (Array.isArray(payload.current_turn_events)) payload.current_turn_events = normalizedEvents;
      if (Array.isArray(payload.turn_events)) payload.turn_events = normalizedEvents;
    }
    const currentLedgerForTerminal =
      Array.isArray(payload.current_turn_artifact_ledger)
        ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
        : [];
    const configureWatchReceiptSatisfied =
      canonicalGoalForController?.goal_kind === "live_environment_review" &&
      Array.isArray(canonicalGoalForController.classifier_reasons) &&
      canonicalGoalForController.classifier_reasons.includes("prefer_configure_live_source_watch_job") &&
      hasStagePlayLiveSourceWatchJobPolicyObservation(currentLedgerForTerminal);
    if (configureWatchReceiptSatisfied) {
      const existingGoal =
        payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object" && !Array.isArray(payload.goal_satisfaction_evaluation)
          ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
          : {};
      const existingContract =
        existingGoal.terminal_contract && typeof existingGoal.terminal_contract === "object" && !Array.isArray(existingGoal.terminal_contract)
          ? (existingGoal.terminal_contract as Record<string, unknown>)
          : {};
      const policyObservation = latestStagePlayLiveSourceWatchJobPolicyObservation(currentLedgerForTerminal);
      const policyRef =
        readAskTurnString(policyObservation?.watchJobPolicyRef) ??
        readAskTurnString(policyObservation?.watch_job_policy_ref) ??
        readAskTurnString(
          policyObservation?.policy && typeof policyObservation.policy === "object" && !Array.isArray(policyObservation.policy)
            ? (policyObservation.policy as Record<string, unknown>).policyId
            : null,
        );
      payload.goal_satisfaction_evaluation = {
        ...existingGoal,
        schema: "helix.goal_satisfaction_evaluation.v1",
        turn_id: input.turnId,
        canonical_goal_kind: "live_environment_review",
        required_terminal_kind: "model_synthesized_answer",
        terminal_contract: {
          ...existingContract,
          goal_kind: "live_environment_review",
          required_terminal_kinds: ["model_synthesized_answer"],
          required_evidence: ["live_environment_tool_observation", "stage_play_live_source_watch_job_policy"],
        },
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        reason: "watch_job_policy_receipt_satisfies_setup_turn",
        supporting_artifact_refs: [
          policyRef,
          ...currentLedgerForTerminal
            .filter((artifact) => isStagePlayLiveSourceWatchJobPolicyObservationArtifact(artifact))
            .map((artifact) => artifact.artifact_id),
        ].filter((entry): entry is string => Boolean(entry)),
        assistant_answer: false,
        raw_content_included: false,
      };
      payload.satisfaction_report = {
        satisfied: true,
        terminal_kind: "final_answer",
        terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id) ?? `${input.turnId}:final_answer_draft`,
        terminal_artifact_kind: readAskTurnString(payload.terminal_artifact_kind) ?? "model_synthesized_answer",
        terminal_source: readAskTurnString(payload.final_answer_source) ?? "final_answer_draft",
        missing_artifacts: [],
        confidence: "high",
        rejected_terminal_candidates: [],
      } satisfies HelixAskTurnSatisfactionReport;
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.goal_satisfaction_evaluation = payload.goal_satisfaction_evaluation;
        debug.satisfaction_report = payload.satisfaction_report;
      }
    }
    const configureInterpreterProfileReceiptSatisfied =
      (
        (
          canonicalGoalForController?.goal_kind === "live_environment_review" &&
          Array.isArray(canonicalGoalForController.classifier_reasons) &&
          canonicalGoalForController.classifier_reasons.includes("prefer_configure_interpreter_profile")
        ) ||
        hasAskTurnInterpreterProfileConfigCue(input.prompt)
      ) &&
      hasStagePlayInterpreterProfileConfigObservation(currentLedgerForTerminal);
    if (configureInterpreterProfileReceiptSatisfied) {
      const existingGoal =
        payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object" && !Array.isArray(payload.goal_satisfaction_evaluation)
          ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
          : {};
      const existingContract =
        existingGoal.terminal_contract && typeof existingGoal.terminal_contract === "object" && !Array.isArray(existingGoal.terminal_contract)
          ? (existingGoal.terminal_contract as Record<string, unknown>)
          : {};
      const profileReceiptText = buildHelixRuntimeLiveSourceMailFallbackText({
        prompt: input.prompt,
        artifacts: currentLedgerForTerminal,
      });
      const terminalText = /^Interpreter profile\b/i.test(profileReceiptText)
        ? profileReceiptText
        : "Interpreter profile configured and active.";
      payload.ok = true;
      payload.response_type = "final_answer";
      payload.final_status = "final_answer";
      payload.status = "final_answer";
      payload.final_answer_source = "final_answer_draft";
      payload.terminal_artifact_kind = "model_synthesized_answer";
      payload.selected_final_answer = terminalText;
      payload.answer = terminalText;
      payload.text = terminalText;
      payload.finalAnswer = terminalText;
      payload.content = terminalText;
      payload.assistant_answer = terminalText;
      delete payload.terminal_error_code;
      payload.goal_satisfaction_evaluation = {
        ...existingGoal,
        schema: "helix.goal_satisfaction_evaluation.v1",
        turn_id: input.turnId,
        canonical_goal_kind: "live_environment_review",
        required_terminal_kind: "model_synthesized_answer",
        terminal_contract: {
          ...existingContract,
          goal_kind: "live_environment_review",
          required_terminal_kinds: ["model_synthesized_answer"],
          required_evidence: ["live_environment_tool_observation", "stage_play_live_source_interpreter_profile"],
        },
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        reason: "interpreter_profile_receipt_satisfies_setup_turn",
        supporting_artifact_refs: currentLedgerForTerminal
          .filter((artifact) => isStagePlayInterpreterProfileConfigObservationArtifact(artifact))
          .map((artifact) => artifact.artifact_id),
        assistant_answer: false,
        raw_content_included: false,
      };
      payload.satisfaction_report = {
        satisfied: true,
        terminal_kind: "final_answer",
        terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id) ?? `${input.turnId}:final_answer_draft`,
        terminal_artifact_kind: "model_synthesized_answer",
        terminal_source: "final_answer_draft",
        missing_artifacts: [],
        confidence: "high",
        rejected_terminal_candidates: [],
      } satisfies HelixAskTurnSatisfactionReport;
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.selected_final_answer = terminalText;
        debug.answer = terminalText;
        debug.text = terminalText;
        debug.finalAnswer = terminalText;
        debug.assistant_answer = terminalText;
        debug.goal_satisfaction_evaluation = payload.goal_satisfaction_evaluation;
        debug.satisfaction_report = payload.satisfaction_report;
      }
    }
    reconcileDebugExportAuthorityParity({
      payload,
      turnId: input.turnId,
      promptText: input.prompt,
    });
    refreshTerminalSurfaceParity(false);
    const turnIdIntegrityAudit = buildTurnIdIntegrityAudit({
      turnId: input.turnId,
      backendTurnId: readAskTurnString(payload.backend_turn_id),
      clientTurnId: readAskTurnString(payload.client_active_turn_id),
      payload,
    });
    const finalRouteReconciliation = buildFinalRouteReconciliation({
      turnId: input.turnId,
      finalRoute: controllerRoute,
      payload,
    });
    const capabilityBindingMismatchObservation = buildCapabilityBindingMismatchObservation(payload);
    if (capabilityBindingMismatchObservation) {
      const mismatchArtifact: HelixTurnArtifact = {
        artifact_id: `${input.turnId}:capability_binding_mismatch_observation`,
        turn_id: input.turnId,
        producer_item_id: "runtime_authority_contract",
        kind: "capability_binding_mismatch_observation",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([
          input.turnId,
          capabilityBindingMismatchObservation.selected_capability,
          capabilityBindingMismatchObservation.suggested_capability,
        ]),
        payload: capabilityBindingMismatchObservation as unknown as Record<string, unknown>,
      };
      payload.capability_binding_mismatch_observation = capabilityBindingMismatchObservation;
      payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
        ...(Array.isArray(payload.current_turn_artifact_ledger)
          ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[]).filter(
              (artifact) => artifact.kind !== "capability_binding_mismatch_observation",
            )
          : []),
        mismatchArtifact,
      ]);
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.capability_binding_mismatch_observation = capabilityBindingMismatchObservation;
        debug.current_turn_artifact_ledger = payload.current_turn_artifact_ledger;
      }
    }
    const controllerDecision = buildSolverControllerDecision({
      turnId: input.turnId,
      finalRoute: controllerRoute,
      payload,
      turnIdIntegrityAudit,
      finalRouteReconciliation,
    });
    payload.turn_id_integrity_audit = turnIdIntegrityAudit;
    payload.final_route_reconciliation = finalRouteReconciliation;
    payload.solver_controller_decision = controllerDecision;
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.turn_id_integrity_audit = turnIdIntegrityAudit;
      debug.final_route_reconciliation = finalRouteReconciliation;
      debug.solver_controller_decision = controllerDecision;
    }
    const controllerStepResults = Array.isArray(payload.step_results)
      ? (payload.step_results as ReturnType<typeof buildAskTurnStepResults>)
      : [];
    const controllerExecutionTrace = Array.isArray(payload.execution_trace)
      ? (payload.execution_trace as HelixAskTurnPlanStep[])
      : [];
    const controllerNoteReceipt =
      readAskTurnResultArtifact(controllerStepResults, "note_update_receipt") ??
      (controllerExecutionTrace.some(
        (step) =>
          step.status === "completed" &&
          step.action?.panel_id === "workstation-notes" &&
          (step.action.action_id === "append_to_note" || step.action.action_id === "copy_receipt_to_note"),
      )
        ? ({ kind: "note_update_receipt", title: resolveAskTurnNoteTargetWithWorkspace(input.prompt, readRecord(payload.workspace_context_snapshot) as HelixAskTurnWorkspaceSessionSnapshot | null) } as Record<string, unknown>)
        : null);
    // A persistence receipt is an observation. It may only become visible final
    // prose after an already-authorized runtime terminal writer has selected a
    // compatible answer product. Do not let this adapter manufacture a model
    // answer from the receipt while the Codex follow-up step is still pending.
    const noteReceiptHasAuthorizedTerminalWriter =
      Boolean(controllerNoteReceipt) &&
      Boolean(terminalWriterForController) &&
      readAskTurnString(terminalWriterForController?.turn_id) === input.turnId &&
      terminalWriterIntegrityForController?.single_writer_applied === true &&
      readAskTurnString(terminalAuthorityForController?.turn_id) === input.turnId &&
      terminalAuthorityForController?.server_authoritative === true &&
      terminalAuthorityForController?.terminal_eligible !== false &&
      terminalWriterKindForController !== "note_update_receipt" &&
      terminalWriterKindForController !== "workspace_action_receipt" &&
      terminalWriterKindForController !== "tool_receipt" &&
      Boolean(terminalWriterVisibleTextForController);
    if (controllerNoteReceipt && noteReceiptHasAuthorizedTerminalWriter) {
      const workspaceSnapshot =
        payload.workspace_context_snapshot && typeof payload.workspace_context_snapshot === "object"
          ? (payload.workspace_context_snapshot as HelixAskTurnWorkspaceSessionSnapshot)
          : null;
      const noteTitle =
        readAskTurnString(controllerNoteReceipt.title) ??
        resolveAskTurnNoteTargetWithWorkspace(input.prompt, workspaceSnapshot) ??
        "the active note";
      const noteFinalText =
        readAskTurnString(payload.selected_final_answer) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text) ??
        summarizeAskTurnNoteUpdateReceiptForFinal({
          transcript: input.prompt,
          noteReceiptArtifact: controllerNoteReceipt,
          title: noteTitle,
          docLocationArtifact: readAskTurnResultArtifact(controllerStepResults, "doc_location_matches"),
          activeDocPath: readAskTurnWorkspaceSnapshotPath(payload),
        });
      payload.ok = true;
      payload.response_type = "final_answer";
      payload.final_status = "final_answer";
      payload.status = "final_answer";
      payload.text = noteFinalText;
      payload.answer = noteFinalText;
      payload.assistant_answer = noteFinalText;
      payload.selected_final_answer = noteFinalText;
      payload.final_answer_source =
        readAskTurnString(payload.final_answer_source) === "pending_server_request" ||
        readAskTurnString(payload.final_answer_source) === "request_user_input"
          ? "universal_composer"
          : readAskTurnString(payload.final_answer_source) ?? "universal_composer";
      payload.terminal_artifact_kind =
        readAskTurnString(payload.terminal_artifact_kind) === "pending_server_request" ||
        readAskTurnString(payload.terminal_artifact_kind) === "request_user_input"
          ? "model_synthesized_answer"
          : readAskTurnString(payload.terminal_artifact_kind) ?? "model_synthesized_answer";
      payload.pending_server_request = null;
      payload.pending_request = null;
      delete payload.terminal_error_code;
      delete payload.terminal_failure_text;
      payload.general_controller_final_decision = "finalize";
      payload.general_controller_stop_reason = "terminal_artifact_satisfied";
      if (Array.isArray(payload.general_controller_decisions)) {
        payload.general_controller_decisions = (payload.general_controller_decisions as unknown[]).filter((entry) => {
          const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null;
          return readAskTurnString(record?.decision) !== "request_user_input";
        });
        (payload.general_controller_decisions as Record<string, unknown>[]).push({
          decision: "finalize",
          source: "deterministic",
          reason: "note_update_receipt_already_satisfied",
          rejected_duplicate_mutation: true,
          error_code: "redundant_note_update_receipt_already_satisfied",
          selected_capability: null,
          missing_required_artifacts: [],
          satisfied_artifacts: ["note_update_receipt"],
        });
      }
      if (payload.turn_runtime && typeof payload.turn_runtime === "object") {
        const turnRuntime = payload.turn_runtime as Record<string, unknown>;
        turnRuntime.general_controller_final_decision = "finalize";
        turnRuntime.missing_required_artifacts = [];
        turnRuntime.satisfied_artifacts = Array.from(new Set([
          ...(Array.isArray(turnRuntime.satisfied_artifacts) ? turnRuntime.satisfied_artifacts.map((entry) => String(entry ?? "")) : []),
          "note_update_receipt",
        ]));
      }
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.status = payload.status;
        debug.answer = payload.answer;
        debug.text = payload.text;
        debug.selected_final_answer = payload.selected_final_answer;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.pending_server_request = null;
        debug.general_controller_final_decision = "finalize";
        debug.general_controller_stop_reason = "terminal_artifact_satisfied";
        debug.general_controller_decisions = payload.general_controller_decisions;
      }
    } else if (controllerNoteReceipt) {
      payload.note_receipt_terminal_projection = {
        schema: "helix.note_receipt_terminal_projection.v1",
        turn_id: input.turnId,
        receipt_kind: "note_update_receipt",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        projection_status: "observation_only",
        reason: "note_receipt_requires_runtime_terminal_writer",
        post_tool_model_step_required: true,
      };
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        (payload.debug as Record<string, unknown>).note_receipt_terminal_projection =
          payload.note_receipt_terminal_projection;
      }
    }
    const pendingRequestCandidate =
      !controllerNoteReceipt
        ? payload.pending_server_request && typeof payload.pending_server_request === "object"
          ? (payload.pending_server_request as Record<string, unknown>)
          : payload.pending_request && typeof payload.pending_request === "object"
            ? (payload.pending_request as Record<string, unknown>)
            : payload.stale_pending_server_request &&
                typeof payload.stale_pending_server_request === "object" &&
                (
                  readAskTurnString(payload.route_reason_code) === "clarify:missing_args" ||
                  readAskTurnString(payload.dispatch_policy) === "needs_user_input" ||
                  readAskTurnString(payload.general_controller_final_decision) === "request_user_input" ||
                  controllerExecutionTrace.some((step) => step.id === "request_user_input" || step.reason === "missing_required_args")
                )
              ? (payload.stale_pending_server_request as Record<string, unknown>)
              : null
        : null;
    if (pendingRequestCandidate) {
      payload.pending_server_request = pendingRequestCandidate;
      payload.pending_request = pendingRequestCandidate;
    }
    const pendingControlPlaneTerminal =
      Boolean(pendingRequestCandidate) &&
      (
        readAskTurnString(payload.response_type) === "pending_input" ||
        readAskTurnString(payload.final_status) === "pending_input" ||
        readAskTurnString(payload.terminal_artifact_kind) === "request_user_input" ||
        readAskTurnString(payload.terminal_artifact_kind) === "pending_server_request" ||
        readAskTurnString(payload.final_answer_source) === "request_user_input" ||
        readAskTurnString(payload.final_answer_source) === "pending_server_request" ||
        readAskTurnString(payload.dispatch_policy) === "needs_user_input" ||
        readAskTurnString(payload.route_reason_code) === "clarify:missing_args"
      );
    if (pendingControlPlaneTerminal) {
      payload.response_type = "pending_input";
      payload.final_status = "pending_input";
      payload.status = "pending_input";
      payload.terminal_artifact_kind =
        readAskTurnString(payload.terminal_artifact_kind) === "pending_server_request"
          ? "pending_server_request"
          : "request_user_input";
      payload.final_answer_source =
        readAskTurnString(payload.final_answer_source) === "pending_server_request"
          ? "pending_server_request"
          : "request_user_input";
      delete payload.terminal_error_code;
      delete payload.terminal_failure_text;
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.status = payload.status;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.terminal_error_code = null;
        debug.pending_server_request = payload.pending_server_request ?? payload.pending_request ?? null;
      }
      refreshTerminalSurfaceParity(true);
      return false;
    }
    if (controllerDecision.decision === "allow_terminal") {
      const terminalAuthority =
        payload.terminal_answer_authority && typeof payload.terminal_answer_authority === "object" && !Array.isArray(payload.terminal_answer_authority)
          ? (payload.terminal_answer_authority as Record<string, unknown>)
          : null;
      const terminalPresentation =
        payload.terminal_presentation && typeof payload.terminal_presentation === "object" && !Array.isArray(payload.terminal_presentation)
          ? (payload.terminal_presentation as Record<string, unknown>)
          : null;
      const allowedTerminalKind =
        readAskTurnString(controllerDecision.selected_terminal_artifact_kind) ??
        readAskTurnString(payload.terminal_artifact_kind) ??
        readAskTurnString(terminalAuthority?.terminal_artifact_kind);
      const allowedTerminalSource =
        readAskTurnString(payload.final_answer_source) ??
        readAskTurnString(terminalAuthority?.final_answer_source) ??
        allowedTerminalKind;
      const allowedTerminalText =
        readAskTurnString(terminalPresentation?.concise_text) ??
        readAskTurnString(terminalAuthority?.terminal_text_preview) ??
        readAskTurnString(payload.selected_final_answer) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text);
      publishAllowedTerminalMirror(allowedTerminalKind, allowedTerminalSource, allowedTerminalText);
      const interimVoiceResult = readLatestInterimVoiceCalloutToolResult(currentLedgerForTerminal);
      const interimVoiceTerminalAllowed =
        canonicalGoalForController?.goal_kind === "live_environment_review" &&
        isInterimVoiceCalloutFinalStatus(interimVoiceResult?.receiptStatus ?? null) &&
        !isCompoundInterimVoiceCalloutPromptText(input.transcript) &&
        readAskTurnString(terminalAuthority?.final_answer_source) === "final_answer_draft" &&
        readAskTurnString(terminalAuthority?.terminal_artifact_kind) === "model_synthesized_answer";
      if (interimVoiceTerminalAllowed) {
        const terminalText =
          readAskTurnString(terminalPresentation?.concise_text) ??
          readAskTurnString(terminalAuthority?.terminal_text_preview) ??
          readAskTurnString(payload.selected_final_answer) ??
          readAskTurnString(payload.answer) ??
          readAskTurnString(payload.text);
        if (terminalText) {
          payload.ok = true;
          payload.response_type = "final_answer";
          payload.final_status = "final_answer";
          payload.status = "final_answer";
          payload.final_answer_source = "final_answer_draft";
          payload.terminal_artifact_kind = "model_synthesized_answer";
          payload.selected_final_answer = terminalText;
          payload.answer = terminalText;
          payload.text = terminalText;
          payload.assistant_answer = terminalText;
          delete payload.terminal_error_code;
        }
        const existingGoal =
          payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object" && !Array.isArray(payload.goal_satisfaction_evaluation)
            ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
            : {};
        payload.goal_satisfaction_evaluation = {
          ...existingGoal,
          schema: "helix.goal_satisfaction_evaluation.v1",
          turn_id: input.turnId,
          canonical_goal_kind: "live_environment_review",
          required_terminal_kind: "model_synthesized_answer",
          satisfaction: "satisfied",
          next_decision: "allow_terminal",
          reason: "interim_voice_callout_receipt_supports_status_answer",
          assistant_answer: false,
          raw_content_included: false,
        };
        payload.satisfaction_report = {
          satisfied: true,
          terminal_kind: "final_answer",
          terminal_artifact_id: readAskTurnString(payload.terminal_artifact_id) ?? `${input.turnId}:final_answer_draft`,
          terminal_artifact_kind: "model_synthesized_answer",
          terminal_source: "final_answer_draft",
          missing_artifacts: [],
          confidence: "high",
          rejected_terminal_candidates: [],
        } satisfies HelixAskTurnSatisfactionReport;
        if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
          const debug = payload.debug as Record<string, unknown>;
          debug.ok = payload.ok;
          debug.response_type = payload.response_type;
          debug.final_status = payload.final_status;
          debug.status = payload.status;
          debug.final_answer_source = payload.final_answer_source;
          debug.terminal_artifact_kind = payload.terminal_artifact_kind;
          debug.selected_final_answer = payload.selected_final_answer;
          debug.answer = payload.answer;
          debug.text = payload.text;
          debug.assistant_answer = payload.assistant_answer;
          debug.goal_satisfaction_evaluation = payload.goal_satisfaction_evaluation;
          debug.satisfaction_report = payload.satisfaction_report;
        }
      }
      refreshTerminalSurfaceParity(true);
      return false;
    }
    if (
      (
        (
          payload.solver_hard_gate_nonterminal_receipt &&
          typeof payload.solver_hard_gate_nonterminal_receipt === "object" &&
          !Array.isArray(payload.solver_hard_gate_nonterminal_receipt)
        ) ||
        (
          terminalWriterKindForController === "tool_receipt" &&
          terminalWriterSourceForController === "tool_receipt"
        )
      ) &&
      (
        readAskTurnString(payload.terminal_artifact_kind) === "tool_receipt" ||
        terminalWriterKindForController === "tool_receipt"
      ) &&
      (
        readAskTurnString(payload.final_answer_source) === "deterministic_receipt_fallback" ||
        terminalWriterSourceForController === "tool_receipt"
      )
    ) {
      const receiptText =
        readAskTurnString(payload.receipt_status_text) ??
        readAskTurnString(payload.answer) ??
        readAskTurnString(payload.text) ??
        readAskTurnString((payload.terminal_presentation as Record<string, unknown> | undefined)?.concise_text) ??
        terminalWriterVisibleTextForController ??
        "";
      payload.ok = true;
      payload.response_type = "tool_receipt";
      payload.final_status = "checkpoint_pending";
      payload.status = "checkpoint_pending";
      payload.final_answer_source = "deterministic_receipt_fallback";
      payload.terminal_artifact_kind = "tool_receipt";
      payload.terminal_eligible = false;
      payload.assistant_answer = false;
      payload.receipt_status_text = receiptText;
      payload.answer = receiptText;
      payload.text = receiptText;
      payload.content = receiptText;
      delete payload.selected_final_answer;
      delete payload.finalAnswer;
      delete payload.terminal_error_code;
      delete payload.terminal_failure_text;
      delete payload.typed_failure;
      payload.terminal_answer_authority = buildHelixTurnTerminalAuthority({
        thread_id: input.threadId,
        turn_id: input.turnId,
        final_answer_source: "deterministic_receipt_fallback",
        terminal_artifact_kind: "tool_receipt",
        terminal_kind: "tool_receipt",
        terminal_text: receiptText,
        route: controllerRoute,
        authority_origin: "tool_receipt",
        server_authoritative: false,
        terminal_eligible: false,
        assistant_answer: false,
      });
      if (payload.terminal_presentation && typeof payload.terminal_presentation === "object" && !Array.isArray(payload.terminal_presentation)) {
        const presentation = payload.terminal_presentation as Record<string, unknown>;
        presentation.terminal_artifact_kind = "tool_receipt";
        presentation.concise_text = receiptText;
        presentation.terminal_eligible = false;
        presentation.assistant_answer = false;
        presentation.raw_content_included = false;
      }
      if (payload.debug && typeof payload.debug === "object" && !Array.isArray(payload.debug)) {
        const debug = payload.debug as Record<string, unknown>;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.status = payload.status;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.terminal_eligible = false;
        debug.terminal_answer_authority = payload.terminal_answer_authority;
        debug.assistant_answer = false;
        debug.receipt_status_text = receiptText;
        debug.answer = receiptText;
        debug.text = receiptText;
        debug.content = receiptText;
        delete debug.selected_final_answer;
        delete debug.finalAnswer;
        delete debug.terminal_error_code;
        delete debug.terminal_failure_text;
        delete debug.typed_failure;
        debug.terminal_presentation = payload.terminal_presentation;
      }
      refreshTerminalSurfaceParity(false);
      return false;
    }
  
    const domainContinuationDecision = buildHelixDomainContinuationDecision({
      turnId: input.turnId,
      prompt: input.prompt,
      payload,
    });
    payload.domain_continuation_decision = domainContinuationDecision;
    if (payload.debug && typeof payload.debug === "object") {
      (payload.debug as Record<string, unknown>).domain_continuation_decision = domainContinuationDecision;
    }
    const continuationAction = domainContinuationDecision.recommended_capability_hint?.suggested_action ?? null;
    if (
      continuationAction &&
      (domainContinuationDecision.decision === "continue" || domainContinuationDecision.decision === "retry")
    ) {
      const domainContinuationRuntimeHint = buildHelixRuntimeContinuationHint({
        turnId: input.turnId,
        source: "domain_continuation",
        suggestedAction: {
          panel_id: continuationAction.panel_id,
          action_id: continuationAction.action_id,
          args: continuationAction.args ?? {},
        },
        missingArtifacts: domainContinuationDecision.expected_artifacts ?? [],
        reason: domainContinuationDecision.reason,
        migratedToAgentRuntimeLoop: false,
      });
      const continuationArtifact: HelixTurnArtifact = {
        artifact_id: `${input.turnId}:domain_continuation:hint`,
        turn_id: input.turnId,
        producer_item_id: "domain_continuation_controller",
        kind: "domain_continuation_hint",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: hashDebugExportPayloadShort([domainContinuationDecision.goal_kind, domainContinuationDecision.reason]),
        payload: domainContinuationDecision,
      };
      payload.runtime_continuation_hints = [domainContinuationRuntimeHint];
      payload.current_turn_artifact_ledger = mergeAskTurnLedgerArtifacts([
        ...(Array.isArray(payload.current_turn_artifact_ledger)
          ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
          : []),
        continuationArtifact,
      ]);
      appendHelixRuntimeContinuationHintsToPayload({
        payload,
        turnId: input.turnId,
        hints: [domainContinuationRuntimeHint],
      });
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.domain_continuation_decision = domainContinuationDecision;
        debug.runtime_continuation_hints = payload.runtime_continuation_hints;
      }
    }
  
    const failureCode =
      controllerDecision.typed_failure_code ??
      controllerDecision.blocking_reasons[0] ??
      "solver_controller_blocked_terminal";
    const visualFailureText =
      failureCode === "field_evaluations_missing"
        ? "I could not complete this Ask turn because the visual source is present but field evaluations are missing."
        : failureCode === "active_environment_missing" || failureCode === "situation_run_missing"
          ? "I need an active visual SituationRun before I can answer from the screen capture."
        : failureCode === "visual_evidence_missing"
          ? "I could not complete this Ask turn because visual evidence is missing or not ready."
          : null;
    const compoundCoverageFailureText =
      failureCode === "compound_prompt_coverage_incomplete" &&
      payload.compound_prompt_coverage_gate &&
      typeof payload.compound_prompt_coverage_gate === "object" &&
      !Array.isArray(payload.compound_prompt_coverage_gate)
        ? buildCompoundCoverageFailureMessage(payload.compound_prompt_coverage_gate as HelixCompoundPromptCoverageGate)
        : null;
    const failureText =
      compoundCoverageFailureText ??
      visualFailureText ??
      `I could not complete this Ask turn because solver controller blocked terminal answer (${failureCode}).`;
    const failureId = `typed_failure:${hashDebugExportPayloadShort([input.turnId, "solver_controller", failureCode])}`;
    const typedFailure = {
      schema: "helix.typed_failure.v1",
      failure_id: failureId,
      error_code: failureCode,
      failure_code: failureCode,
      message: failureText,
      solver_controller_blocking_reasons: controllerDecision.blocking_reasons,
      domain_continuation_decision: domainContinuationDecision,
      repair_candidate: domainContinuationDecision.repair_candidate ?? null,
      repair_hint: "Continue, retry, ask for clarification, or repair the failed evidence/capability path before selecting a normal final answer.",
      assistant_answer: false,
      raw_content_included: false,
    };
  
    payload.ok = false;
    payload.response_type = "final_failure";
    payload.final_status = "final_failure";
    payload.terminal_error_code = failureCode;
    payload.final_answer_source = "typed_failure";
    payload.terminal_artifact_kind = "typed_failure";
    payload.terminal_artifact_id = failureId;
    payload.typed_failure = typedFailure;
    payload.terminal_failure_text = failureText;
    payload.selected_final_answer = failureText;
    payload.answer = failureText;
    payload.text = failureText;
    payload.finalAnswer = failureText;
    payload.content = failureText;
    payload.terminal_presentation = {
      ...(payload.terminal_presentation && typeof payload.terminal_presentation === "object"
        ? (payload.terminal_presentation as Record<string, unknown>)
        : {
            schema: "helix.terminal_presentation.v1",
            presentation_id: `terminal_presentation:${input.turnId}`,
            turn_id: input.turnId,
            expansion_available: false,
            expansion_ref: null,
            distillation_ref: null,
            receipt_snapshot_ref: null,
          }),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: failureText,
      assistant_answer: false,
      raw_content_included: false,
    };
  
    const terminalEnvelope = resolveTerminalAnswerEnvelope(payload, {
      threadId: input.threadId,
      turnId: input.turnId,
    });
    applyTerminalAnswerEnvelope(payload, terminalEnvelope);
    const terminalAuthorityRecord = recordHelixTurnTerminalAuthority({
      thread_id: input.threadId,
      turn_id: input.turnId,
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_text: terminalEnvelope.terminal_text,
      route: controllerRoute,
    });
    payload.terminal_answer_authority = terminalAuthorityRecord;
    payload.poison_audit = auditHelixAskContextForPoison({
      thread_id: input.threadId,
      turn_id: input.turnId,
      payload,
      terminal_authority: terminalAuthorityRecord,
      client_visible_text: terminalEnvelope.terminal_text,
    });
    payload.loop_parity_trace = buildLoopParityTrace({
      turnId: input.turnId,
      promptText: input.prompt,
      selectedRoute: controllerRoute,
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
      payload,
    });
    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId: input.turnId,
      promptText: input.prompt,
      selectedRoute: controllerRoute,
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
      payload,
      loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
    });
    if (payload.ask_turn_solver_trace && typeof payload.ask_turn_solver_trace === "object") {
      const solverTrace = payload.ask_turn_solver_trace as Record<string, unknown>;
      const controllerFlags = controllerDecision.blocking_reasons.map((reason) => `solver_controller:${reason}`);
      solverTrace.completed_solver_path = false;
      solverTrace.solver_risk_flags = Array.from(new Set([
        ...((Array.isArray(solverTrace.solver_risk_flags) ? solverTrace.solver_risk_flags : []) as unknown[]).filter((entry): entry is string => typeof entry === "string"),
        ...controllerFlags,
      ]));
      solverTrace.solver_short_circuit_flags = Array.from(new Set([
        ...((Array.isArray(solverTrace.solver_short_circuit_flags) ? solverTrace.solver_short_circuit_flags : []) as unknown[]).filter((entry): entry is string => typeof entry === "string"),
        ...controllerFlags,
      ]));
      const finalArbitration = solverTrace.final_arbitration && typeof solverTrace.final_arbitration === "object"
        ? (solverTrace.final_arbitration as Record<string, unknown>)
        : {};
      solverTrace.final_arbitration = {
        ...finalArbitration,
        why_complete: "solver controller failed closed before normal terminal authority",
        remaining_uncertainty: solverTrace.solver_risk_flags,
      };
    }
  
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.ok = payload.ok;
      debug.response_type = payload.response_type;
      debug.final_status = payload.final_status;
      debug.terminal_error_code = payload.terminal_error_code;
      debug.final_answer_source = payload.final_answer_source;
      debug.terminal_artifact_kind = payload.terminal_artifact_kind;
      debug.typed_failure = typedFailure;
      debug.terminal_failure_text = failureText;
      debug.selected_final_answer = failureText;
      debug.answer = failureText;
      debug.text = failureText;
      debug.finalAnswer = failureText;
      debug.terminal_presentation = payload.terminal_presentation;
      debug.compound_prompt_coverage_gate = payload.compound_prompt_coverage_gate;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
      debug.poison_audit = payload.poison_audit;
      debug.loop_parity_trace = payload.loop_parity_trace;
      debug.ask_turn_solver_trace = payload.ask_turn_solver_trace;
      debug.turn_id_integrity_audit = payload.turn_id_integrity_audit;
      debug.final_route_reconciliation = payload.final_route_reconciliation;
      debug.solver_controller_decision = payload.solver_controller_decision;
    }
    refreshTerminalSurfaceParity(true);
    return true;
  };

  return {
    applySolverControllerDecisionForPayload,
  };
};

export type SolverControllerPayloadAdapter = ReturnType<typeof createSolverControllerPayloadAdapter>;
