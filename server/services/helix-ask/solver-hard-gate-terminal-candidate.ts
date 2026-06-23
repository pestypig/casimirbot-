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

type HelixCompoundPromptCoverageGate = RecordLike;

type SolverHardGateLike = RecordLike & {
  failed: boolean;
  failure_codes: string[];
  primary_failure_code?: string | null;
};

type CompoundCoverageFromArtifacts = {
  gate: unknown;
  model_only_compound_coverage_from_answer: RecordLike & {
    passed?: boolean;
    route_scope?: string;
  };
  selected_answer_artifact_ref?: string | null;
};

export type ApplyAskTurnSolverHardGateFailureDependencies = {
  readAskTurnString: (value: unknown) => string | null;
  evaluateCompoundPromptCoverageGateFromAnswerArtifacts: (args: {
    turnId: string;
    payload: RecordLike;
    artifactLedger: HelixTurnArtifact[];
    promptText: string;
    contract: RecordLike;
    routeScope: "model_only" | "source_targeted";
  }) => CompoundCoverageFromArtifacts;
  evaluateAskTurnSolverHardGate: (args: {
    turnId: string;
    payload: RecordLike;
    trace: RecordLike | null;
    loopParityTrace: RecordLike | null;
  }) => SolverHardGateLike;
  buildHelixTurnTerminalAuthority: (args: RecordLike) => unknown;
  buildHelixRuntimeLiveSourceMailFallbackText: (args: { prompt: string; artifacts: HelixTurnArtifact[] }) => string;
  buildSolverContinuationObservation: (args: RecordLike) => unknown;
  appendSolverContinuationObservation: (args: { payload: RecordLike; observation: unknown }) => void;
  buildCodexStyleTurnStatePacket: (args: RecordLike) => unknown;
  buildCompoundCoverageFailureMessage: (gate: HelixCompoundPromptCoverageGate) => string;
  hashDebugExportPayloadShort: (value: unknown, length?: number) => string;
  guardTerminalArtifactSelection: (args: RecordLike) => unknown;
  guardProductAuthority: (args: RecordLike) => unknown;
  auditRouteAuthority: (args: RecordLike) => unknown;
  resolveTerminalAnswerEnvelope: (payload: RecordLike, args: { threadId: string; turnId: string }) => unknown;
  applyTerminalAnswerEnvelope: (payload: RecordLike, envelope: unknown) => void;
  buildLoopParityTrace: (args: RecordLike) => unknown;
  buildSolverInstructionFrame: (args: RecordLike) => unknown;
  buildAskTurnSolverTrace: (args: RecordLike) => unknown;
  refreshSolverArtifactReentryAuditForPayload: (args: RecordLike) => void;
  refreshSolverSubgoalLedgerForPayload: (args: RecordLike) => void;
  refreshCapabilityLifecycleLedgerForPayload: (args: RecordLike) => void;
  refreshSolverRetryPoliciesForPayload: (args: RecordLike) => void;
};

export const applyAskTurnSolverHardGateFailure = (input: {
  dependencies: ApplyAskTurnSolverHardGateFailureDependencies;
  payload: Record<string, unknown>;
  threadId: string;
  turnId: string;
  route: string;
  prompt: string;
  routeProductContract: Record<string, unknown>;
  sourceTargetIntent: Record<string, unknown>;
}): boolean => {
  const {
    readAskTurnString,
    evaluateCompoundPromptCoverageGateFromAnswerArtifacts,
    evaluateAskTurnSolverHardGate,
    buildHelixTurnTerminalAuthority,
    buildHelixRuntimeLiveSourceMailFallbackText,
    buildSolverContinuationObservation,
    appendSolverContinuationObservation,
    buildCodexStyleTurnStatePacket,
    buildCompoundCoverageFailureMessage,
    hashDebugExportPayloadShort,
    guardTerminalArtifactSelection,
    guardProductAuthority,
    auditRouteAuthority,
    resolveTerminalAnswerEnvelope,
    applyTerminalAnswerEnvelope,
    buildLoopParityTrace,
    buildSolverInstructionFrame,
    buildAskTurnSolverTrace,
    refreshSolverArtifactReentryAuditForPayload,
    refreshSolverSubgoalLedgerForPayload,
    refreshCapabilityLifecycleLedgerForPayload,
    refreshSolverRetryPoliciesForPayload,
  } = input.dependencies;
  const payload = input.payload;
  const canonicalGoalFrameForCompoundGate =
    payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object" && !Array.isArray(payload.canonical_goal_frame)
      ? (payload.canonical_goal_frame as Record<string, unknown>)
      : null;
  const sourceTargetIntentForCompoundGate =
    payload.source_target_intent && typeof payload.source_target_intent === "object" && !Array.isArray(payload.source_target_intent)
      ? (payload.source_target_intent as Record<string, unknown>)
      : null;
  const traceForCompoundGate =
    payload.ask_turn_solver_trace && typeof payload.ask_turn_solver_trace === "object" && !Array.isArray(payload.ask_turn_solver_trace)
      ? (payload.ask_turn_solver_trace as Record<string, unknown>)
      : null;
  const promptInterpretationForCompoundGate =
    traceForCompoundGate?.prompt_interpretation && typeof traceForCompoundGate.prompt_interpretation === "object" && !Array.isArray(traceForCompoundGate.prompt_interpretation)
      ? (traceForCompoundGate.prompt_interpretation as Record<string, unknown>)
      : payload.prompt_interpretation && typeof payload.prompt_interpretation === "object" && !Array.isArray(payload.prompt_interpretation)
        ? (payload.prompt_interpretation as Record<string, unknown>)
        : null;
  const compoundContractForGate =
    traceForCompoundGate?.compound_prompt_contract && typeof traceForCompoundGate.compound_prompt_contract === "object" && !Array.isArray(traceForCompoundGate.compound_prompt_contract)
      ? (traceForCompoundGate.compound_prompt_contract as Record<string, unknown>)
      : promptInterpretationForCompoundGate?.compound_contract && typeof promptInterpretationForCompoundGate.compound_contract === "object" && !Array.isArray(promptInterpretationForCompoundGate.compound_contract)
        ? (promptInterpretationForCompoundGate.compound_contract as Record<string, unknown>)
        : null;
  const routeScopeForCompoundGate =
    readAskTurnString(canonicalGoalFrameForCompoundGate?.goal_kind) === "model_only_concept" ||
    readAskTurnString(canonicalGoalFrameForCompoundGate?.goal_kind) === "conversation" ||
    readAskTurnString(canonicalGoalFrameForCompoundGate?.goal_kind) === "workspace_help" ||
    readAskTurnString(canonicalGoalFrameForCompoundGate?.answer_scope) === "model_only" ||
    (
      !["repo_code", "docs_viewer", "active_doc", "runtime_evidence", "workstation_panel", "workspace_action", "calculator_stream", "situation_room", "live_pipeline", "visual_capture"].includes(readAskTurnString(sourceTargetIntentForCompoundGate?.target_source) ?? "") &&
      readAskTurnString(sourceTargetIntentForCompoundGate?.strength) !== "hard"
    )
      ? "model_only" as const
      : "source_targeted" as const;
  const existingModelOnlyCoverage =
    payload.model_only_compound_coverage_from_answer && typeof payload.model_only_compound_coverage_from_answer === "object" && !Array.isArray(payload.model_only_compound_coverage_from_answer)
      ? (payload.model_only_compound_coverage_from_answer as Record<string, unknown>)
      : null;
  if (!existingModelOnlyCoverage && compoundContractForGate) {
    const compoundArtifacts = Array.isArray(payload.current_turn_artifact_ledger)
      ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const compoundCoverageFromArtifacts = evaluateCompoundPromptCoverageGateFromAnswerArtifacts({
      turnId: input.turnId,
      payload,
      artifactLedger: compoundArtifacts,
      promptText: input.prompt,
      contract: compoundContractForGate,
      routeScope: routeScopeForCompoundGate,
    });
    payload.compound_prompt_coverage_gate = compoundCoverageFromArtifacts.gate;
    payload.model_only_compound_coverage_from_answer = compoundCoverageFromArtifacts.model_only_compound_coverage_from_answer;
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
    if (payload.debug && typeof payload.debug === "object") {
      (payload.debug as Record<string, unknown>).compound_prompt_coverage_gate = payload.compound_prompt_coverage_gate;
      (payload.debug as Record<string, unknown>).model_only_compound_coverage_from_answer = payload.model_only_compound_coverage_from_answer;
    }
  }
  const hardGate = evaluateAskTurnSolverHardGate({
    turnId: input.turnId,
    payload,
    trace: payload.ask_turn_solver_trace as Record<string, unknown> | null,
    loopParityTrace: payload.loop_parity_trace as Record<string, unknown> | null,
  });
  payload.solver_hard_gate = hardGate;
  if (payload.debug && typeof payload.debug === "object") {
    (payload.debug as Record<string, unknown>).solver_hard_gate = hardGate;
  }
  const canonicalGoalFrame = payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object"
    ? (payload.canonical_goal_frame as Record<string, unknown>)
    : null;
  const goalSatisfaction = payload.goal_satisfaction_evaluation && typeof payload.goal_satisfaction_evaluation === "object"
    ? (payload.goal_satisfaction_evaluation as Record<string, unknown>)
    : null;
  const terminalConsistency = payload.terminal_consistency_check && typeof payload.terminal_consistency_check === "object"
    ? (payload.terminal_consistency_check as Record<string, unknown>)
    : null;
  const pendingRequestTerminal =
    Boolean(
      (payload.pending_server_request && typeof payload.pending_server_request === "object") ||
        (payload.pending_request && typeof payload.pending_request === "object"),
    ) &&
    (
      readAskTurnString(payload.final_status) === "pending_input" ||
      readAskTurnString(payload.response_type) === "pending_input" ||
      readAskTurnString(payload.final_answer_source) === "pending_server_request" ||
      readAskTurnString(payload.terminal_artifact_kind) === "pending_server_request" ||
      readAskTurnString(payload.dispatch_policy) === "needs_user_input" ||
      /pending_server_request|request_user_input|clarify:missing_args/i.test(readAskTurnString(payload.route_reason_code) ?? "")
    );
  if (hardGate.failed && pendingRequestTerminal) {
    const pendingHardGate = {
      ...hardGate,
      failed: false,
      failure_codes: [],
      primary_failure_code: null,
      failure_details: [],
    };
    payload.solver_hard_gate = pendingHardGate;
    if (payload.debug && typeof payload.debug === "object") {
      (payload.debug as Record<string, unknown>).solver_hard_gate = pendingHardGate;
    }
    return false;
  }
  const finalAnswerDraftForHardGate =
    payload.final_answer_draft && typeof payload.final_answer_draft === "object" && !Array.isArray(payload.final_answer_draft)
      ? (payload.final_answer_draft as Record<string, unknown>)
      : null;
  const finalAnswerDraftTextForHardGate = readAskTurnString(finalAnswerDraftForHardGate?.text);
  const deterministicStagePlayReceiptFallback =
    readAskTurnString(finalAnswerDraftForHardGate?.authority) === "deterministic_receipt_fallback" ||
    /^Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b/i.test(finalAnswerDraftTextForHardGate ?? "");
  if (hardGate.failed && deterministicStagePlayReceiptFallback) {
    const receiptText = /^Stage Play checkpoint request (?:queued|running|completed):/i.test(finalAnswerDraftTextForHardGate ?? "")
      ? finalAnswerDraftTextForHardGate!
      : /^Stage Play/i.test(finalAnswerDraftTextForHardGate ?? "")
        ? "Stage Play reflected the active visual source and queued a checkpoint.\nNo model-reviewed answer snapshot exists yet."
        : finalAnswerDraftTextForHardGate || "The live-environment tool step completed, but no model-reviewed answer was produced.";
    payload.ok = true;
    payload.response_type = "tool_receipt";
    payload.final_status = "checkpoint_pending";
    payload.terminal_artifact_kind = "tool_receipt";
    payload.final_answer_source = "deterministic_receipt_fallback";
    payload.terminal_eligible = false;
    payload.receipt_status_text = receiptText;
    payload.answer = receiptText;
    payload.text = receiptText;
    payload.content = receiptText;
    payload.assistant_answer = false;
    delete payload.selected_final_answer;
    delete payload.finalAnswer;
    payload.terminal_answer_authority = buildHelixTurnTerminalAuthority({
      thread_id: input.threadId,
      turn_id: input.turnId,
      final_answer_source: "deterministic_receipt_fallback",
      terminal_artifact_kind: "tool_receipt",
      terminal_kind: "tool_receipt",
      terminal_text: receiptText,
      route: input.route,
      authority_origin: "tool_receipt",
      server_authoritative: false,
      terminal_eligible: false,
      assistant_answer: false,
    });
    payload.solver_hard_gate_nonterminal_receipt = {
      schema: "helix.solver_hard_gate_nonterminal_receipt.v1",
      turn_id: input.turnId,
      preserved: true,
      reason: "deterministic_receipt_fallback_not_answer_authority",
      failure_codes: hardGate.failure_codes,
      assistant_answer: false,
      raw_content_included: false,
    };
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
      terminal_artifact_kind: "tool_receipt",
      concise_text: receiptText,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.solver_hard_gate = hardGate;
      debug.solver_hard_gate_nonterminal_receipt = payload.solver_hard_gate_nonterminal_receipt;
      debug.response_type = payload.response_type;
      debug.final_status = payload.final_status;
      debug.final_answer_source = payload.final_answer_source;
      debug.terminal_artifact_kind = payload.terminal_artifact_kind;
      debug.terminal_eligible = false;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
      debug.receipt_status_text = receiptText;
      debug.answer = receiptText;
      debug.text = receiptText;
      debug.assistant_answer = false;
      debug.terminal_presentation = payload.terminal_presentation;
      delete debug.selected_final_answer;
      delete debug.finalAnswer;
    }
    return false;
  }
  if (hardGate.failed) {
    const profileReceiptLedger = Array.isArray(payload.current_turn_artifact_ledger)
      ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const profileReceiptText = buildHelixRuntimeLiveSourceMailFallbackText({
      prompt: input.prompt,
      artifacts: profileReceiptLedger,
    });
    if (/^Interpreter profile\b/i.test(profileReceiptText)) {
      payload.ok = true;
      payload.response_type = "tool_receipt";
      payload.final_status = "profile_configured";
      payload.terminal_artifact_kind = "tool_receipt";
      payload.final_answer_source = "deterministic_receipt_fallback";
      payload.terminal_eligible = false;
      payload.receipt_status_text = profileReceiptText;
      payload.answer = profileReceiptText;
      payload.text = profileReceiptText;
      payload.content = profileReceiptText;
      payload.assistant_answer = false;
      delete payload.selected_final_answer;
      delete payload.finalAnswer;
      payload.solver_hard_gate_nonterminal_receipt = {
        schema: "helix.solver_hard_gate_nonterminal_receipt.v1",
        turn_id: input.turnId,
        preserved: true,
        reason: "interpreter_profile_receipt_not_answer_authority",
        failure_codes: hardGate.failure_codes,
        assistant_answer: false,
        raw_content_included: false,
      };
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
        terminal_artifact_kind: "tool_receipt",
        concise_text: profileReceiptText,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      };
      if (payload.debug && typeof payload.debug === "object") {
        const debug = payload.debug as Record<string, unknown>;
        debug.solver_hard_gate = hardGate;
        debug.solver_hard_gate_nonterminal_receipt = payload.solver_hard_gate_nonterminal_receipt;
        debug.response_type = payload.response_type;
        debug.final_status = payload.final_status;
        debug.final_answer_source = payload.final_answer_source;
        debug.terminal_artifact_kind = payload.terminal_artifact_kind;
        debug.terminal_eligible = false;
        debug.receipt_status_text = profileReceiptText;
        debug.answer = profileReceiptText;
        debug.text = profileReceiptText;
        debug.assistant_answer = false;
        debug.terminal_presentation = payload.terminal_presentation;
        delete debug.selected_final_answer;
        delete debug.finalAnswer;
      }
      return false;
    }
  }
  if (!hardGate.failed) return false;
  const hardGateArtifactLedger = Array.isArray(payload.current_turn_artifact_ledger)
    ? (payload.current_turn_artifact_ledger as Record<string, unknown>[])
    : [];
  const solverContinuationObservation = buildSolverContinuationObservation({
    turnId: input.turnId,
    payload,
    hardGateCode: hardGate.primary_failure_code ?? hardGate.failure_codes[0] ?? "terminal_authority_before_solver_completion",
    finalRoute: input.route,
    terminalKind: readAskTurnString(payload.terminal_artifact_kind),
    artifactLedger: hardGateArtifactLedger,
  });
  if (solverContinuationObservation) {
    appendSolverContinuationObservation({
      payload,
      observation: solverContinuationObservation,
    });
    const postContinuationLedger = Array.isArray(payload.current_turn_artifact_ledger)
      ? (payload.current_turn_artifact_ledger as Record<string, unknown>[])
      : hardGateArtifactLedger;
    payload.ask_codex_style_turn_state_packet = buildCodexStyleTurnStatePacket({
      turnId: input.turnId,
      payload,
      artifactLedger: postContinuationLedger,
      unresolvedReasons: hardGate.failure_codes,
      terminalForbiddenReasons: hardGate.failure_codes,
    });
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.solver_continuation_observation = solverContinuationObservation;
      debug.solver_continuation_count = payload.solver_continuation_count;
      debug.ask_codex_style_turn_state_packet = payload.ask_codex_style_turn_state_packet;
    }
  }
  const existingTypedFailure =
    readAskTurnString(payload.terminal_artifact_kind) === "typed_failure" &&
    payload.typed_failure &&
    typeof payload.typed_failure === "object" &&
    !Array.isArray(payload.typed_failure)
      ? (payload.typed_failure as Record<string, unknown>)
      : null;
  if (existingTypedFailure) {
    const failureCode = hardGate.primary_failure_code ?? readAskTurnString(existingTypedFailure.error_code) ?? "terminal_authority_before_solver_completion";
    const failureText =
      failureCode === "compound_prompt_coverage_incomplete" &&
      payload.compound_prompt_coverage_gate &&
      typeof payload.compound_prompt_coverage_gate === "object" &&
      !Array.isArray(payload.compound_prompt_coverage_gate)
        ? buildCompoundCoverageFailureMessage(payload.compound_prompt_coverage_gate as HelixCompoundPromptCoverageGate)
        :
      readAskTurnString(existingTypedFailure.message) ??
      readAskTurnString(payload.terminal_failure_text) ??
      `I could not complete this Ask turn because solver authority failed (${failureCode}).`;
    existingTypedFailure.solver_hard_gate_failure_codes = hardGate.failure_codes;
    existingTypedFailure.solver_hard_gate_primary_failure_code = hardGate.primary_failure_code;
    existingTypedFailure.message = failureText;
    existingTypedFailure.error_code = readAskTurnString(existingTypedFailure.error_code) ?? failureCode;
    existingTypedFailure.failure_code = readAskTurnString(existingTypedFailure.failure_code) ?? failureCode;
    payload.ok = false;
    payload.response_type = "final_failure";
    payload.final_status = "final_failure";
    payload.terminal_error_code = failureCode;
    payload.final_answer_source = readAskTurnString(payload.final_answer_source) ?? "typed_failure";
    payload.terminal_artifact_kind = "typed_failure";
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
    if (payload.debug && typeof payload.debug === "object") {
      const debug = payload.debug as Record<string, unknown>;
      debug.solver_hard_gate = hardGate;
      debug.typed_failure = existingTypedFailure;
      debug.response_type = payload.response_type;
      debug.final_status = payload.final_status;
      debug.terminal_error_code = payload.terminal_error_code;
      debug.terminal_failure_text = failureText;
      debug.selected_final_answer = failureText;
      debug.answer = failureText;
      debug.text = failureText;
      debug.finalAnswer = failureText;
      debug.terminal_presentation = payload.terminal_presentation;
    }
    return false;
  }

  const procedureMemoryUnavailablePrompt = /\bprocedure\s+memory\b/i.test(input.prompt);
  const failureCode = procedureMemoryUnavailablePrompt
    ? "procedure_memory_unavailable"
    : hardGate.primary_failure_code ?? "terminal_authority_before_solver_completion";
  const failureId = `typed_failure:${hashDebugExportPayloadShort([input.turnId, "solver_hard_gate", failureCode])}`;
  const failureText =
    procedureMemoryUnavailablePrompt
      ? "Auntie Dot: sensors are separate from mission memory.\nVisual capture status: unavailable or not bound into procedure memory.\nProcedure memory is unavailable because no_active_situation_run.\nRepair hint: create_or_resume_situation_run."
      : failureCode === "compound_prompt_coverage_incomplete" &&
    payload.compound_prompt_coverage_gate &&
    typeof payload.compound_prompt_coverage_gate === "object" &&
    !Array.isArray(payload.compound_prompt_coverage_gate)
      ? buildCompoundCoverageFailureMessage(payload.compound_prompt_coverage_gate as HelixCompoundPromptCoverageGate)
      : `I could not complete this Ask turn because solver authority failed (${failureCode}).`;
  const typedFailure = {
    schema: "helix.typed_failure.v1",
    failure_id: failureId,
    error_code: failureCode,
    failure_code: failureCode,
    message: failureText,
    solver_hard_gate_failure_codes: hardGate.failure_codes,
    ...(procedureMemoryUnavailablePrompt
      ? {
          failure_kind: "procedure_memory_unavailable",
          requested_capability: "procedure_memory",
          missing_evidence: ["active_situation_run", "procedure_memory"],
          next_required_action: "repair_procedure_memory",
          blocking_reason: "no_active_situation_run",
          repair_hint: "create_or_resume_situation_run",
        }
      : {
          repair_hint: "Re-run the turn through prompt interpretation, intent arbitration, evidence re-entry, follow-up reasoning, and route authority before selecting a terminal product.",
        }),
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

  payload.terminal_artifact_selection_guard = guardTerminalArtifactSelection({
    contract: input.routeProductContract,
    terminalArtifactKind: "typed_failure",
  });
  payload.product_authority_guard = guardProductAuthority({
    sourceTargetIntent: input.sourceTargetIntent,
    toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
    routeProductContract: input.routeProductContract,
    terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
    terminalArtifactKind: "typed_failure",
  });
  const routeAuthorityAudit = auditRouteAuthority({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute: input.route,
    payload,
    terminalArtifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
    sourceTargetIntent: input.sourceTargetIntent,
    routeProductContract: input.routeProductContract,
    toolCallAdmissionDecision: payload.tool_call_admission_decision as Record<string, unknown>,
    terminalArtifactSelectionGuard: payload.terminal_artifact_selection_guard as Record<string, unknown>,
    productAuthorityGuard: payload.product_authority_guard as Record<string, unknown>,
    committedAskRoute: payload.committed_ask_route as Record<string, unknown>,
  }) as Record<string, unknown>;
  routeAuthorityAudit.solver_hard_gate_failure_codes = hardGate.failure_codes;
  routeAuthorityAudit.route_authority_ok = false;
  routeAuthorityAudit.primary_violation_code = failureCode;
  routeAuthorityAudit.route_authority_violation_code = failureCode;
  routeAuthorityAudit.violation_codes = Array.from(new Set([
    ...(Array.isArray(routeAuthorityAudit.violation_codes) ? routeAuthorityAudit.violation_codes : []),
    ...hardGate.failure_codes,
  ]));
  payload.route_authority_audit = routeAuthorityAudit;

  const terminalEnvelope = resolveTerminalAnswerEnvelope(payload, {
    threadId: input.threadId,
    turnId: input.turnId,
  });
  applyTerminalAnswerEnvelope(payload, terminalEnvelope);
  payload.solver_hard_gate = hardGate;
  payload.loop_parity_trace = buildLoopParityTrace({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute: input.route,
    terminalArtifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
    payload,
  });
  payload.solver_instruction_frame = payload.solver_instruction_frame ?? buildSolverInstructionFrame({
    turnId: input.turnId,
    promptText: input.prompt,
    promptInterpretation:
      payload.prompt_interpretation && typeof payload.prompt_interpretation === "object"
        ? (payload.prompt_interpretation as Record<string, unknown>)
        : null,
    sourceTargetIntent:
      payload.source_target_intent && typeof payload.source_target_intent === "object"
        ? (payload.source_target_intent as Record<string, unknown>)
        : null,
  });
  payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute: input.route,
    terminalArtifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
    payload,
    loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
  });
  refreshSolverArtifactReentryAuditForPayload({
    payload,
    turnId: input.turnId,
    terminalArtifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
  });
  refreshSolverSubgoalLedgerForPayload({
    payload,
    turnId: input.turnId,
    prompt: input.prompt,
  });
  refreshCapabilityLifecycleLedgerForPayload({
    payload,
    turnId: input.turnId,
    terminalArtifactKind: "typed_failure",
  });
  refreshSolverRetryPoliciesForPayload({
    payload,
    turnId: input.turnId,
  });
  payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
    turnId: input.turnId,
    promptText: input.prompt,
    selectedRoute: input.route,
    terminalArtifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
    payload,
    loopParityTrace: payload.loop_parity_trace as Record<string, unknown>,
  });

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
    debug.terminal_presentation = payload.terminal_presentation;
    debug.terminal_artifact_selection_guard = payload.terminal_artifact_selection_guard;
    debug.product_authority_guard = payload.product_authority_guard;
    debug.route_authority_audit = payload.route_authority_audit;
    debug.terminal_answer_authority = payload.terminal_answer_authority;
    debug.poison_audit = payload.poison_audit;
    debug.capability_lifecycle_ledger = payload.capability_lifecycle_ledger;
    debug.tool_lifecycle_trace = payload.tool_lifecycle_trace;
    debug.tool_followup_decision = payload.tool_followup_decision;
    debug.solver_instruction_frame = payload.solver_instruction_frame;
    debug.solver_artifact_reentry_audit = payload.solver_artifact_reentry_audit;
    debug.solver_subgoal_ledger = payload.solver_subgoal_ledger;
    debug.solver_retry_policy = payload.solver_retry_policy;
    debug.solver_retry_policies = payload.solver_retry_policies;
    debug.loop_parity_trace = payload.loop_parity_trace;
    debug.ask_turn_solver_trace = payload.ask_turn_solver_trace;
    debug.solver_hard_gate = hardGate;
  }
  return true;
};

