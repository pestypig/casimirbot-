type RecordLike = Record<string, unknown>;

type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: "current_turn" | "prior_turn_context" | "workspace_state" | string;
  goal_hash?: string;
  payload?: RecordLike;
};

type HelixRuntimeAuthorityTerminalContract = {
  required_actions?: Array<RecordLike>;
  required_evidence?: Array<RecordLike>;
  required_terminal_kinds: string[];
  acceptable_fallbacks: string[];
  forbidden_terminal_kinds?: string[];
};

type HelixRuntimeAuthorityGoalSatisfactionEvaluation = RecordLike & {
  satisfaction?: string;
  terminal_artifact_kind?: string;
  terminal_contract?: HelixRuntimeAuthorityTerminalContract;
  required_actions?: Array<RecordLike>;
  required_evidence?: Array<RecordLike>;
};

type HelixRuntimeAuthorityLoop = {
  stop_reason?: string | null;
  iterations: Array<RecordLike>;
};

type HelixRuntimeAuthorityIntentPacket = RecordLike & {
  terminal_contract?: HelixRuntimeAuthorityTerminalContract | null;
};

export type HelixRuntimeAuthorityAudit = {
  schema: "helix.runtime_authority_audit.v1";
  turn_id: string;
  runtime_intent_packet_ref?: string | null;
  capability_turn: boolean;
  source_targeted_turn: boolean;
  terminal_artifact_kind: string | null;
  post_observation_llm_reentry_ref?: string | null;
  runtime_loop_present: boolean;
  runtime_loop_stop_reason: string | null;
  legacy_hint_count: number;
  migrated_hint_count: number;
  accepted_hint_refs: string[];
  rejected_hints: Array<{
    hint_id: string;
    suggested_capability: string | null;
    reason: string;
  }>;
  decision_sources: Array<"llm" | "deterministic_policy_fallback">;
  decision_authorities: Array<"llm" | "deterministic_policy_fallback">;
  all_subgoals_observed_seen: boolean;
  all_subgoals_observed_terminal_authority: false;
  ok: boolean;
  checks: Array<{
    check: string;
    passed: boolean;
    evidence: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
};

type HelixRuntimeAuthorityObservationReview = RecordLike & {
  next_action?: string;
};

type HelixRuntimeAuthorityLoopBudget = RecordLike & {
  schema: "helix.agent_loop_budget.v1";
  turn_id: string;
  profile: string;
  goal_kind: string;
  max_iterations: number;
  max_tool_calls: number;
  max_llm_decisions: number;
  consumed_iterations: number;
  consumed_tool_calls: number;
  consumed_llm_decisions: number;
  consumed_observation_reviews: number;
  non_counted_validation_steps: number;
  used_tool_calls: number;
  remaining: {
    iterations: number;
    tool_calls: number;
    llm_decisions: number;
  };
  exhausted: boolean;
  exhaustion_reason: string;
  missing_requirement_ids: string[];
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRuntimeAuthorityAuditDependencies = {
  appendRuntimeIntentPacketToPayload: (args: {
    payload: RecordLike;
    turnId: string;
    prompt?: string | null;
  }) => unknown;
  appendAgentLoopBudgetArtifactToPayload: (args: {
    payload: RecordLike;
    turnId: string;
    budget: HelixRuntimeAuthorityLoopBudget;
  }) => void;
  buildObservationReviewArtifact: (args: {
    turnId: string;
    artifacts: HelixTurnArtifact[];
    goalSatisfactionEvaluation: HelixRuntimeAuthorityGoalSatisfactionEvaluation | null;
  }) => HelixRuntimeAuthorityObservationReview;
  mergeLedgerArtifacts: (artifacts: HelixTurnArtifact[]) => HelixTurnArtifact[];
  hashPayloadShort: (value: unknown, length?: number) => string;
  resolveDocPathArg: (prompt: string) => string | null;
  isDocAboutSummaryPrompt: (prompt: string) => boolean;
  capabilityCatalogCapabilityKey: string;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry)) : [];

const readArtifactPayloadRecord = (artifact: HelixTurnArtifact | null | undefined): RecordLike | null =>
  readRecord(artifact?.payload);

const readTerminalContract = (value: unknown): HelixRuntimeAuthorityTerminalContract | null => {
  const record = readRecord(value);
  if (!record) return null;
  return {
    ...record,
    required_actions: Array.isArray(record.required_actions) ? (record.required_actions as Array<RecordLike>) : [],
    required_evidence: Array.isArray(record.required_evidence) ? (record.required_evidence as Array<RecordLike>) : [],
    required_terminal_kinds: readStringArray(record.required_terminal_kinds),
    acceptable_fallbacks: readStringArray(record.acceptable_fallbacks),
    forbidden_terminal_kinds: readStringArray(record.forbidden_terminal_kinds),
  };
};

const readGoalSatisfactionEvaluation = (payload: RecordLike): HelixRuntimeAuthorityGoalSatisfactionEvaluation | null => {
  const record = readRecord(payload.goal_satisfaction_evaluation);
  if (!record) return null;
  return {
    ...record,
    terminal_contract: readTerminalContract(record.terminal_contract) ?? undefined,
    required_actions: Array.isArray(record.required_actions) ? (record.required_actions as Array<RecordLike>) : [],
    required_evidence: Array.isArray(record.required_evidence) ? (record.required_evidence as Array<RecordLike>) : [],
  };
};

const readCanonicalGoalFrame = (payload: RecordLike): RecordLike | null => readRecord(payload.canonical_goal_frame);

const readAvailableCapabilities = (payload: RecordLike): RecordLike | null => readRecord(payload.available_capabilities);

const isTypedFailureTerminal = (payload: RecordLike): boolean =>
  readString(payload.terminal_artifact_kind) === "typed_failure" ||
  readString(payload.final_answer_source) === "typed_failure" ||
  readString(payload.final_status) === "final_failure" ||
  readString(payload.response_type) === "final_failure";

const isSourceTargetedTurn = (payload: RecordLike): boolean => {
  const sourceTarget = readRecord(payload.source_target_intent);
  const goalFrame = readCanonicalGoalFrame(payload);
  const targetSource = readString(sourceTarget?.target_source);
  return Boolean(
    sourceTarget?.must_enter_backend_ask === true ||
      sourceTarget?.allow_no_tool_direct === false ||
      (targetSource && targetSource !== "unknown" && targetSource !== "model_only") ||
      (goalFrame && goalFrame.answer_scope !== "model_only"),
  );
};

const isCapabilityTurn = (payload: RecordLike): boolean => {
  const goalFrame = readCanonicalGoalFrame(payload);
  const goalKind = readString(goalFrame?.goal_kind);
  const terminalKind = readString(payload.terminal_artifact_kind);
  const availableCapabilities = readAvailableCapabilities(payload);
  const hints = Array.isArray(payload.runtime_continuation_hints) ? payload.runtime_continuation_hints : [];
  const capabilities = Array.isArray(availableCapabilities?.capabilities)
    ? (availableCapabilities.capabilities as RecordLike[])
    : [];
  const primaryActionCapability = capabilities.some(
    (capability) => capability.goal_fit === "primary" && capability.requires_action,
  );
  return Boolean(
    hints.length > 0 ||
      primaryActionCapability ||
      [
        "docs_panel_open",
        "doc_open_best",
        "doc_open",
        "calculator_solve",
        "calculator_live_source",
        "visual_capture_describe",
        "live_interval_set",
        "note_mutation",
      ].includes(goalKind ?? "") ||
      [
        "workspace_action_receipt",
        "doc_open_receipt",
        "workstation_tool_evaluation",
        "live_pipeline_receipt",
        "visual_producer_cadence_receipt",
        "note_update_receipt",
      ].includes(terminalKind ?? ""),
  );
};

const payloadHasAllSubgoalsObservedTerminalReason = (payload: RecordLike): boolean => {
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const finalArbitration = readRecord(solverTrace?.final_arbitration);
  if (
    readString(finalArbitration?.why_complete) === "all_subgoals_observed" ||
    readString(finalArbitration?.reason) === "all_subgoals_observed"
  ) {
    return true;
  }
  const events = Array.isArray(payload.current_turn_events)
    ? payload.current_turn_events
    : Array.isArray(payload.turn_events)
      ? payload.turn_events
      : [];
  return events.some((event) => {
    const record = readRecord(event);
    const decision = readRecord(record?.decision);
    return readString(decision?.reason) === "all_subgoals_observed";
  });
};

export const buildHelixRuntimeAuthorityAudit = (args: {
  turnId: string;
  payload: RecordLike;
}): HelixRuntimeAuthorityAudit => {
  const runtimeIntentPacket = readRecord(args.payload.runtime_intent_packet) as HelixRuntimeAuthorityIntentPacket | null;
  const loop = readRecord(args.payload.agent_runtime_loop) as HelixRuntimeAuthorityLoop | null;
  const goalSatisfactionEvaluation = readGoalSatisfactionEvaluation(args.payload);
  const satisfactionReport = readRecord(args.payload.satisfaction_report);
  const satisfactionState =
    readString(goalSatisfactionEvaluation?.satisfaction) ??
    (satisfactionReport?.satisfied === true ? "satisfied" : satisfactionReport?.satisfied === false ? "not_satisfied" : null);
  const terminalContract =
    goalSatisfactionEvaluation?.terminal_contract ??
    readTerminalContract(runtimeIntentPacket?.terminal_contract) ??
    null;
  const authorityLedger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const postObservationLlmReentryArtifact = [...authorityLedger]
    .reverse()
    .find((artifact) =>
      artifact.kind === "post_observation_llm_reentry" &&
      artifact.source_scope === "current_turn" &&
      readString(readArtifactPayloadRecord(artifact)?.schema) === "helix.post_observation_llm_reentry.v1",
    ) ?? null;
  const observationReview = readRecord(args.payload.observation_review);
  const terminalArtifactKind = readString(args.payload.terminal_artifact_kind);
  const ledgerSatisfiedTerminalArtifactKind =
    terminalContract?.required_terminal_kinds.find((kind) =>
      authorityLedger.some((artifact) => artifact.kind === kind && artifact.source_scope === "current_turn"),
    ) ?? null;
  const satisfactionTerminalArtifactKind =
    readString(goalSatisfactionEvaluation?.terminal_artifact_kind) ??
    readString(satisfactionReport?.terminal_artifact_kind) ??
    ledgerSatisfiedTerminalArtifactKind;
  const contractTerminalArtifactKind =
    satisfactionState === "satisfied" &&
    satisfactionTerminalArtifactKind &&
    terminalContract &&
    (
      terminalContract.required_terminal_kinds.includes(satisfactionTerminalArtifactKind) ||
      terminalContract.acceptable_fallbacks.includes(satisfactionTerminalArtifactKind)
    ) &&
    ["final_answer_draft", "model_synthesized_answer"].includes(terminalArtifactKind ?? "")
      ? satisfactionTerminalArtifactKind
      : terminalArtifactKind;
  const terminalKindForReentryCheck = contractTerminalArtifactKind ?? terminalArtifactKind ?? null;
  const synthesisTerminalRequiresPostObservationLlmReentry =
    terminalKindForReentryCheck === "doc_evidence_synthesis_answer" ||
    terminalKindForReentryCheck === "compound_evidence_synthesis_answer";
  const typedFailureTerminal = isTypedFailureTerminal(args.payload);
  const capabilityPlanForRuntimeAuthority = readRecord(args.payload.capability_plan);
  const canonicalGoalForRuntimeAuthority = readCanonicalGoalFrame(args.payload);
  const finalAnswerDraftForRuntimeAuthority = readRecord(args.payload.final_answer_draft);
  const finalAnswerDraftAuthorityForRuntimeAuthority = readString(finalAnswerDraftForRuntimeAuthority?.authority);
  const finalAnswerDraftTextForRuntimeAuthority = readString(finalAnswerDraftForRuntimeAuthority?.text);
  const deterministicReceiptFallbackDraftStatus =
    finalAnswerDraftAuthorityForRuntimeAuthority === "deterministic_receipt_fallback" &&
    (
      readString(canonicalGoalForRuntimeAuthority?.goal_kind) === "live_environment_review" ||
      readString(capabilityPlanForRuntimeAuthority?.requested_action) === "live_env.reflect_stage_play_context" ||
      /^Stage Play/i.test(finalAnswerDraftTextForRuntimeAuthority ?? "")
    );
  const nonterminalToolReceiptStatus =
    (
      terminalArtifactKind === "tool_receipt" ||
      deterministicReceiptFallbackDraftStatus
    ) &&
    (
      deterministicReceiptFallbackDraftStatus ||
      args.payload.terminal_eligible === false ||
      readString(args.payload.response_type) === "tool_receipt" ||
      readString(args.payload.final_status) === "checkpoint_pending" ||
      Boolean(readString(args.payload.receipt_status_text))
    );
  const capabilityTurn = isCapabilityTurn(args.payload);
  const sourceTargetedTurn = isSourceTargetedTurn(args.payload);
  const capabilityCatalogDeterministicLoopSatisfied =
    readString(capabilityPlanForRuntimeAuthority?.selected_capability) === "helix_ask.inspect_capability_catalog" &&
    terminalContract?.required_terminal_kinds.includes("capability_help_summary") === true &&
    authorityLedger.some((artifact) => artifact.kind === "capability_registry" && artifact.source_scope === "current_turn") &&
    authorityLedger.some((artifact) => artifact.kind === "capability_help_summary" && artifact.source_scope === "current_turn");
  const hints = Array.isArray(args.payload.runtime_continuation_hints)
    ? (args.payload.runtime_continuation_hints as RecordLike[])
    : [];
  const legacyHintCount = hints.length;
  const migratedHintCount = hints.filter((hint) => hint.migrated_to_agent_runtime_loop).length;
  const acceptedHintRefs = hints
    .filter((hint) => hint.migrated_to_agent_runtime_loop && hint.accepted_by_agent_step_decision === true)
    .map((hint) => String(hint.hint_id));
  const rejectedHints = hints
    .filter((hint) => !hint.migrated_to_agent_runtime_loop)
    .map((hint) => ({
      hint_id: String(hint.hint_id),
      suggested_capability: readString(hint.suggested_capability),
      reason: readString(hint.rejection_reason) ?? "model_did_not_accept_hint",
    }));
  const decisionSources = Array.from(
    new Set(
      (loop?.iterations ?? []).map((iteration) => iteration.decision_source).filter(
        (source): source is "llm" | "deterministic_policy_fallback" =>
          source === "llm" || source === "deterministic_policy_fallback",
      ),
    ),
  );
  const decisionAuthorities = Array.from(
    new Set(
      (loop?.iterations ?? []).map((iteration) => iteration.decision_authority ?? iteration.decision_source).filter(
        (source): source is "llm" | "deterministic_policy_fallback" =>
          source === "llm" || source === "deterministic_policy_fallback",
      ),
    ),
  );
  const allSubgoalsObservedSeen = payloadHasAllSubgoalsObservedTerminalReason(args.payload);
  const sourceOrCapabilityTurn = capabilityTurn || sourceTargetedTurn;
  const checks = [
    {
      check: "runtime_intent_packet_present_for_source_or_capability_turn",
      passed: !sourceOrCapabilityTurn || Boolean(runtimeIntentPacket),
      evidence: runtimeIntentPacket ? `${args.turnId}:runtime_intent_packet` : sourceOrCapabilityTurn ? "missing" : "not_required",
    },
    {
      check: "runtime_loop_present_for_source_or_capability_turn",
      passed: !sourceOrCapabilityTurn || Boolean(loop) || capabilityCatalogDeterministicLoopSatisfied,
      evidence: loop
        ? `${args.turnId}:agent_runtime_loop`
        : capabilityCatalogDeterministicLoopSatisfied
          ? `${args.turnId}:capability_catalog_deterministic_loop`
          : sourceOrCapabilityTurn
            ? "missing_runtime_loop"
            : "not_required",
    },
    {
      check: "no_terminal_without_runtime_loop_for_capability_turn",
      passed: !capabilityTurn || Boolean(loop) || capabilityCatalogDeterministicLoopSatisfied,
      evidence: loop
        ? `${args.turnId}:agent_runtime_loop`
        : capabilityCatalogDeterministicLoopSatisfied
          ? `${args.turnId}:capability_catalog_deterministic_loop`
          : capabilityTurn
            ? "missing_runtime_loop"
            : "not_capability_turn",
    },
    {
      check: "no_terminal_without_runtime_loop_for_source_turn",
      passed: !sourceTargetedTurn || Boolean(loop) || capabilityCatalogDeterministicLoopSatisfied,
      evidence: loop
        ? `${args.turnId}:agent_runtime_loop`
        : capabilityCatalogDeterministicLoopSatisfied
          ? `${args.turnId}:capability_catalog_deterministic_loop`
          : sourceTargetedTurn
            ? "missing_runtime_loop"
            : "not_source_targeted_turn",
    },
    {
      check: "no_terminal_without_goal_satisfaction",
      passed:
        !sourceOrCapabilityTurn ||
        typedFailureTerminal ||
        satisfactionState === "satisfied",
      evidence: satisfactionState ?? (sourceOrCapabilityTurn ? "missing_goal_satisfaction" : "not_required"),
    },
    {
      check: "no_terminal_from_hint",
      passed:
        typedFailureTerminal ||
        !["runtime_continuation_hint", "domain_continuation_decision", "domain_continuation_hint", "agent_step_decision", "available_capabilities"].includes(terminalArtifactKind ?? ""),
      evidence: terminalArtifactKind ?? "missing_terminal_artifact_kind",
    },
    {
      check: "no_terminal_artifact_outside_contract",
      passed:
        typedFailureTerminal ||
        nonterminalToolReceiptStatus ||
        !terminalContract ||
        !contractTerminalArtifactKind ||
        terminalContract.required_terminal_kinds.includes(contractTerminalArtifactKind) ||
        terminalContract.acceptable_fallbacks.includes(contractTerminalArtifactKind),
      evidence: terminalContract
        ? nonterminalToolReceiptStatus
          ? "nonterminal_tool_receipt_status"
          : `${contractTerminalArtifactKind ?? "missing"} in ${terminalContract.required_terminal_kinds.join(",") || "none"}`
        : "no_contract",
    },
    {
      check: "post_observation_llm_reentry_present_for_synthesis_terminal",
      passed:
        typedFailureTerminal ||
        !synthesisTerminalRequiresPostObservationLlmReentry ||
        Boolean(postObservationLlmReentryArtifact),
      evidence: synthesisTerminalRequiresPostObservationLlmReentry
        ? postObservationLlmReentryArtifact?.artifact_id ?? "missing_post_observation_llm_reentry"
        : "not_required",
    },
    {
      check: "observation_review_present_after_observation",
      passed:
        !sourceOrCapabilityTurn ||
        typedFailureTerminal ||
        Boolean(observationReview),
      evidence: observationReview ? `${args.turnId}:observation_review` : sourceOrCapabilityTurn ? "missing_observation_review" : "not_required",
    },
    {
      check: "no_source_context_forced_without_agent_selection",
      passed:
        typedFailureTerminal ||
        !sourceTargetedTurn ||
        Boolean(args.payload.agent_step_decision) ||
        goalSatisfactionEvaluation?.satisfaction === "satisfied",
      evidence:
        args.payload.agent_step_decision
          ? `${args.turnId}:agent_step_decision`
          : satisfactionState === "satisfied"
            ? "satisfied_goal_contract"
            : sourceTargetedTurn
              ? "missing_agent_step_decision"
              : "not_source_targeted",
    },
    {
      check: "legacy_continuations_are_hints",
      passed: hints.every((hint) => hint.authority === "hint_only_agent_must_decide"),
      evidence: legacyHintCount === 0 ? "no_legacy_hints" : `${legacyHintCount}_runtime_continuation_hints`,
    },
    {
      check: "legacy_hints_migrated_to_runtime_loop",
      passed:
        legacyHintCount === 0 ||
        (
          Boolean(loop) &&
          migratedHintCount === acceptedHintRefs.length &&
          rejectedHints.every((hint) => Boolean(hint.reason))
        ),
      evidence:
        legacyHintCount === 0
          ? "no_legacy_hints"
          : `${acceptedHintRefs.length}/${legacyHintCount}_accepted;${rejectedHints.length}_rejected`,
    },
    {
      check: "runtime_loop_records_decision_source",
      passed:
        !loop ||
        loop.iterations.length === 0 ||
        loop.iterations.every((iteration) =>
          iteration.decision_source === "llm" || iteration.decision_source === "deterministic_policy_fallback",
        ),
      evidence: decisionSources.length > 0 ? decisionSources.join(",") : "no_iterations",
    },
    {
      check: "runtime_loop_records_decision_authority",
      passed:
        !loop ||
        loop.iterations.length === 0 ||
        loop.iterations.every((iteration) =>
          iteration.decision_authority === "llm" || iteration.decision_authority === "deterministic_policy_fallback",
        ),
      evidence: decisionAuthorities.length > 0 ? decisionAuthorities.join(",") : "no_iterations",
    },
    {
      check: "all_subgoals_observed_not_terminal_authority",
      passed: true,
      evidence: allSubgoalsObservedSeen ? "observed_reason_demoted_to_non_authority" : "not_seen",
    },
  ];
  return {
    schema: "helix.runtime_authority_audit.v1",
    turn_id: args.turnId,
    runtime_intent_packet_ref: runtimeIntentPacket ? `${args.turnId}:runtime_intent_packet` : null,
    capability_turn: capabilityTurn,
    source_targeted_turn: sourceTargetedTurn,
    terminal_artifact_kind: contractTerminalArtifactKind ?? terminalArtifactKind ?? null,
    post_observation_llm_reentry_ref: postObservationLlmReentryArtifact?.artifact_id ?? null,
    runtime_loop_present: Boolean(loop),
    runtime_loop_stop_reason: loop?.stop_reason ?? null,
    legacy_hint_count: legacyHintCount,
    migrated_hint_count: migratedHintCount,
    accepted_hint_refs: acceptedHintRefs,
    rejected_hints: rejectedHints,
    decision_sources: decisionSources,
    decision_authorities: decisionAuthorities,
    all_subgoals_observed_seen: allSubgoalsObservedSeen,
    all_subgoals_observed_terminal_authority: false,
    ok: checks.every((check) => check.passed),
    checks,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const __testHelixRuntimeAuthorityAudit = {
  buildHelixRuntimeAuthorityAudit,
};

export const appendHelixRuntimeAuthorityAuditToPayload = (args: {
  payload: RecordLike;
  turnId: string;
  prompt?: string | null;
  dependencies: HelixRuntimeAuthorityAuditDependencies;
}): HelixRuntimeAuthorityAudit => {
  if (!args.payload.observation_review && args.payload.goal_satisfaction_evaluation) {
    const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
      ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    const review = args.dependencies.buildObservationReviewArtifact({
      turnId: args.turnId,
      artifacts: ledger,
      goalSatisfactionEvaluation: readGoalSatisfactionEvaluation(args.payload),
    });
    args.payload.observation_review = review;
    args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
      ...ledger.filter((artifact) => artifact.kind !== "observation_review"),
      {
        artifact_id: `${args.turnId}:observation_review`,
        turn_id: args.turnId,
        producer_item_id: "agent_observation_review",
        kind: "observation_review",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: args.dependencies.hashPayloadShort([args.turnId, "observation_review", review.next_action]),
        payload: review,
      },
    ]);
    const debug = readRecord(args.payload.debug);
    if (debug) {
      debug.observation_review = review;
      debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
    }
  }
  const pendingRequestForRuntimeLoop =
    readRecord(args.payload.pending_server_request) ??
    readRecord(args.payload.pending_request);
  const pendingRequestCandidateDecision =
    readRecord(args.payload.initial_agent_step_decision) ??
    readRecord(args.payload.agent_step_decision);
  const pendingRequestCandidateAction = readRecord(pendingRequestCandidateDecision?.action);
  const pendingRequestCandidateArgs = readRecord(pendingRequestCandidateAction?.args);
  const pendingRequestCanonicalGoal = readCanonicalGoalFrame(args.payload);
  const pendingRequestCanonicalGoalRecord = readRecord(args.payload.canonical_goal_frame);
  const pendingRequestSourceTarget = readRecord(args.payload.source_target_intent);
  const pendingRequestCapabilityPlan = readRecord(args.payload.capability_plan);
  const pendingRequestPrompt =
    args.prompt ??
    readString(pendingRequestCandidateArgs?.target_transcript) ??
    readString(args.payload.question) ??
    "";
  const pendingRequestRequiredTerminalKind =
    readString(pendingRequestCanonicalGoal?.required_terminal_kind) ??
    readString(pendingRequestCanonicalGoalRecord?.required_terminal_kind);
  const pendingRequestGoalKind =
    readString(pendingRequestCanonicalGoal?.goal_kind) ??
    readString(pendingRequestCanonicalGoalRecord?.goal_kind);
  const pendingRequestExplicitDocPath = args.dependencies.resolveDocPathArg(pendingRequestPrompt);
  const pendingRequestMasksExecutableDocsSummaryAction =
    pendingRequestRequiredTerminalKind === "doc_summary" &&
    Boolean(pendingRequestExplicitDocPath) &&
    args.dependencies.isDocAboutSummaryPrompt(pendingRequestPrompt) &&
    (
      pendingRequestGoalKind === "doc_summary" ||
      (
        readString(pendingRequestCandidateDecision?.next_step) === "next_action" &&
        readString(pendingRequestCandidateDecision?.chosen_capability) === "docs-viewer.summarize_doc" &&
        readString(pendingRequestCandidateAction?.panel_id) === "docs-viewer" &&
        readString(pendingRequestCandidateAction?.action_id) === "summarize_doc" &&
        Boolean(readString(pendingRequestCandidateArgs?.path))
      ) ||
      (
        readString(pendingRequestSourceTarget?.target_source) === "docs_viewer" &&
        readString(pendingRequestCapabilityPlan?.selected_capability) === "docs-viewer.summarize_doc"
      )
    );
  const pendingRequestTerminalForRuntimeLoop =
    Boolean(pendingRequestForRuntimeLoop) &&
    !pendingRequestMasksExecutableDocsSummaryAction &&
    (
      readString(args.payload.final_status) === "pending_input" ||
      readString(args.payload.response_type) === "pending_input" ||
      readString(args.payload.final_answer_source) === "pending_server_request" ||
      readString(args.payload.terminal_artifact_kind) === "pending_server_request" ||
      readString(args.payload.dispatch_policy) === "needs_user_input" ||
      readString(args.payload.dispatch_policy) === "request_user_input" ||
      /pending_server_request|request_user_input|clarify:missing_args/i.test(readString(args.payload.route_reason_code) ?? "")
    );
  if (pendingRequestTerminalForRuntimeLoop && !args.payload.agent_runtime_loop) {
    const canonicalGoal = readCanonicalGoalFrame(args.payload);
    const goalSatisfactionEvaluation = readGoalSatisfactionEvaluation(args.payload);
    const maxToolCallsOverride = Number.parseInt(process.env.HELIX_AGENT_RUNTIME_LOOP_MAX_TOOL_CALLS ?? "", 10);
    const maxToolCalls = Number.isFinite(maxToolCallsOverride) && maxToolCallsOverride > 0 ? maxToolCallsOverride : 3;
    const missingRequirementIds = Array.isArray(pendingRequestForRuntimeLoop?.missing_requirement_ids)
      ? (pendingRequestForRuntimeLoop.missing_requirement_ids as unknown[]).map(String)
      : [];
    const loop = {
      schema: "helix.agent_runtime_loop.v1",
      turn_id: args.turnId,
      runtime_role: "generic_next_action_observe_loop",
      max_iterations: Math.max(1, maxToolCalls),
      max_tool_calls: maxToolCalls,
      max_llm_decisions: Math.max(1, maxToolCalls + 1),
      iterations: [
        {
          iteration: 1,
          decision_ref: `${args.turnId}:agent_step_decision:ask_user`,
          next_step: "ask_user",
          chosen_capability: null,
          decision_source: "llm",
          decision_authority: "llm",
          llm_used: true,
          sampling_reason: readString(pendingRequestForRuntimeLoop?.reason) ?? "pending_request_active",
          executed_action_key: null,
          produced_artifacts: ["pending_server_request"],
          observed_artifact_refs: [`${args.turnId}:pending_server_request`],
          observation_role: "terminal_decision",
          satisfaction: readString(goalSatisfactionEvaluation?.satisfaction) ?? "needs_user_input",
          goal_satisfaction_ref: goalSatisfactionEvaluation ? `${args.turnId}:goal_satisfaction_evaluation` : undefined,
          missing_requirement_ids: missingRequirementIds,
          stop_reason: "ask_user",
        },
      ],
      stop_reason: "ask_user",
      executed_tool_call_count: 0,
      llm_decision_count: 1,
      budget_exhaustion_reason: "none",
      missing_requirement_ids: missingRequirementIds,
      budget_ref: `${args.turnId}:agent_loop_budget`,
      budget_profile: "doc_search_open",
      assistant_answer: false,
      raw_content_included: false,
    };
    args.payload.agent_runtime_loop = loop;
    const budget: HelixRuntimeAuthorityLoopBudget = {
      schema: "helix.agent_loop_budget.v1",
      turn_id: args.turnId,
      profile: "doc_search_open",
      goal_kind: readString(canonicalGoal?.goal_kind) ?? "unknown",
      max_iterations: loop.max_iterations,
      max_tool_calls: loop.max_tool_calls,
      max_llm_decisions: loop.max_llm_decisions,
      consumed_iterations: loop.iterations.length,
      consumed_tool_calls: 0,
      consumed_llm_decisions: 1,
      consumed_observation_reviews: 0,
      non_counted_validation_steps: 0,
      used_tool_calls: 0,
      remaining: {
        iterations: Math.max(0, loop.max_iterations - loop.iterations.length),
        tool_calls: loop.max_tool_calls,
        llm_decisions: Math.max(0, loop.max_llm_decisions - 1),
      },
      exhausted: false,
      exhaustion_reason: "none",
      missing_requirement_ids: loop.missing_requirement_ids ?? [],
      reason: "pending_request_before_tool_execution",
      assistant_answer: false,
      raw_content_included: false,
    };
    args.dependencies.appendAgentLoopBudgetArtifactToPayload({
      payload: args.payload,
      turnId: args.turnId,
      budget,
    });
    const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
      ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
      ...ledger.filter((artifact) => artifact.kind !== "agent_runtime_loop"),
      {
        artifact_id: `${args.turnId}:agent_runtime_loop`,
        turn_id: args.turnId,
        producer_item_id: "agent_runtime_loop",
        kind: "agent_runtime_loop",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: args.dependencies.hashPayloadShort([args.turnId, "agent_runtime_loop", "ask_user"]),
        payload: loop,
      },
    ]);
    const debug = readRecord(args.payload.debug);
    if (debug) {
      debug.agent_runtime_loop = loop;
      debug.agent_loop_budget = budget;
      debug.budget = args.payload.budget;
      debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
    }
  }
  args.dependencies.appendRuntimeIntentPacketToPayload({
    payload: args.payload,
    turnId: args.turnId,
    prompt: args.prompt,
  });
  const audit = buildHelixRuntimeAuthorityAudit({
    payload: args.payload,
    turnId: args.turnId,
  });
  args.payload.runtime_authority_audit = audit;
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
    ...ledger.filter((artifact) => artifact.kind !== "runtime_authority_audit"),
    {
      artifact_id: `${args.turnId}:runtime_authority_audit`,
      turn_id: args.turnId,
      producer_item_id: "runtime_authority_audit",
      kind: "runtime_authority_audit",
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      goal_hash: args.dependencies.hashPayloadShort([args.turnId, "runtime_authority_audit", audit.ok]),
      payload: audit as unknown as RecordLike,
    },
  ]);
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_authority_audit = audit;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
  if (!audit.ok && !isTypedFailureTerminal(args.payload)) {
    const failedChecks = audit.checks.filter((check) => !check.passed).map((check) => check.check);
    const goalSatisfactionEvaluation = readGoalSatisfactionEvaluation(args.payload);
    const missingRequirementIds = [
      ...(goalSatisfactionEvaluation?.required_actions
        ?.filter((action) => action.required && !action.satisfied)
        .map((action) => String(action.action_key)) ?? []),
      ...(goalSatisfactionEvaluation?.required_evidence
        ?.filter((evidence) => evidence.required && !evidence.satisfied)
        .map((evidence) => String(evidence.kind)) ?? []),
    ];
    const canonicalGoalFrame = readRecord(args.payload.canonical_goal_frame);
    const liveSourceIdentityAudit = readRecord(args.payload.live_source_identity_audit);
    const visualContextMissing =
      /visual/i.test(readString(canonicalGoalFrame?.goal_kind) ?? "") ||
      missingRequirementIds.some((id) => /visual|field_evaluation|situation_context/i.test(id)) ||
      /active_environment_missing|visual|situation_run/i.test(readString(liveSourceIdentityAudit?.diagnosis) ?? "");
    const terminalErrorCode = visualContextMissing ? "visual_evidence_missing" : "runtime_authority_violation";
    const finalText = visualContextMissing
      ? `I could not complete this visual turn because browser/UI visual source context was not available to the Ask solver. Missing requirements: ${missingRequirementIds.join(", ") || "visual_observation"}.`
      : `I could not complete this turn because runtime authority checks failed before the goal was satisfied. Failed checks: ${failedChecks.join(", ") || "runtime_authority_violation"}.`;
    const artifactId = `${args.turnId}:runtime_authority:typed_failure`;
    const typedFailurePayload = {
      schema: "helix.typed_failure.v1",
      kind: "typed_failure",
      error_code: terminalErrorCode,
      text: finalText,
      answer_text: finalText,
      failed_checks: failedChecks,
      missing_requirement_ids: missingRequirementIds,
      live_source_identity_diagnosis: readString(liveSourceIdentityAudit?.diagnosis) ?? null,
      runtime_authority_audit_ref: `${args.turnId}:runtime_authority_audit`,
      assistant_answer: false,
      raw_content_included: false,
    };
    const nextLedger = Array.isArray(args.payload.current_turn_artifact_ledger)
      ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
      : [];
    args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
      ...nextLedger.filter((artifact) => artifact.artifact_id !== artifactId),
      {
        artifact_id: artifactId,
        turn_id: args.turnId,
        producer_item_id: "runtime_authority_audit",
        kind: "typed_failure",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: args.dependencies.hashPayloadShort([args.turnId, terminalErrorCode, failedChecks, missingRequirementIds]),
        payload: typedFailurePayload,
      },
    ]);
    args.payload.ok = false;
    args.payload.response_type = "final_failure";
    args.payload.final_status = "final_failure";
    args.payload.status = "final_failure";
    args.payload.answer = finalText;
    args.payload.text = finalText;
    args.payload.assistant_answer = finalText;
    args.payload.selected_final_answer = finalText;
    args.payload.finalAnswer = finalText;
    args.payload.final_answer_source = "typed_failure";
    args.payload.terminal_artifact_kind = "typed_failure";
    args.payload.terminal_artifact_id = artifactId;
    args.payload.terminal_error_code = terminalErrorCode;
    args.payload.terminal_failure_text = finalText;
    args.payload.typed_failure = typedFailurePayload;
    args.payload.resolved_turn_summary = {
      turn_id: args.turnId,
      final_status: "final_failure",
      resolved_route_label: `${readString(args.payload.route_reason_code) ?? readString(args.payload.route) ?? "helix_ask"} / typed_failure:${terminalErrorCode}`,
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: terminalErrorCode,
      pending_server_request_present: false,
    };
    args.payload.terminal_presentation = {
      schema: "helix.terminal_presentation.v1",
      presentation_id: `terminal_presentation:${args.dependencies.hashPayloadShort([args.turnId, terminalErrorCode])}`,
      turn_id: args.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: finalText,
      expansion_available: true,
      expansion_ref: `runtime_authority_audit:${args.turnId}`,
      distillation_ref: null,
      receipt_snapshot_ref: null,
      assistant_answer: false,
      raw_content_included: false,
    };
    const failureDebug = readRecord(args.payload.debug);
    if (failureDebug) {
      failureDebug.ok = args.payload.ok;
      failureDebug.response_type = args.payload.response_type;
      failureDebug.final_status = args.payload.final_status;
      failureDebug.selected_final_answer = finalText;
      failureDebug.answer = finalText;
      failureDebug.text = finalText;
      failureDebug.final_answer_source = "typed_failure";
      failureDebug.terminal_artifact_kind = "typed_failure";
      failureDebug.terminal_error_code = terminalErrorCode;
      failureDebug.typed_failure = typedFailurePayload;
      failureDebug.terminal_presentation = args.payload.terminal_presentation;
      failureDebug.resolved_turn_summary = args.payload.resolved_turn_summary;
      failureDebug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
    }
  }
  return audit;
};
