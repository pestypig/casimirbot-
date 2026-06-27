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

type HelixAskTurnSelectedAction = {
  panel_id?: string;
  action_id?: string;
  args?: RecordLike;
} & RecordLike;

type HelixAskTurnRuntimeStepProposal = RecordLike & {
  step?: {
    lane?: string;
    action?: HelixAskTurnSelectedAction | null;
  };
};

type HelixAgentStepDecision = RecordLike & {
  schema?: string;
  decision_id: string;
  next_step?: string;
  decision?: string;
  chosen_capability?: string | null;
  action?: HelixAskTurnSelectedAction | null;
  action_authorization?: RecordLike & {
    authorizes_tool_execution?: boolean;
  };
};

export type HelixRuntimeContinuationHint = RecordLike & {
  schema: "helix.runtime_continuation_hint.v1";
  turn_id: string;
  hint_id: string;
  source:
    | "evaluateAskTurnRuntimeAfterObservation"
    | "executeAskTurnPlanItemsWithArtifactContinuation"
    | "blocked_artifact_recovery"
    | "workstation_tool_plan"
    | "calculator_compound_chain"
    | "domain_continuation"
    | "agent_runtime_loop";
  suggested_capability: string | null;
  suggested_action: HelixAskTurnSelectedAction | null;
  suggested_args: RecordLike;
  missing_artifacts: string[];
  reason: string;
  migrated_to_agent_runtime_loop: boolean;
  accepted_by_agent_step_decision: boolean;
  accepted_decision_ref: string | null;
  rejection_reason: string | null;
  authority: "hint_only_agent_must_decide";
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRuntimeContinuationHintDependencies = {
  capabilityKeyForAction: (action: HelixAskTurnSelectedAction | null | undefined) => string | null;
  normalizeWorkspaceDocPath: (value: unknown) => string | null;
  readArtifactPayloadRecord: (artifact: HelixTurnArtifact) => RecordLike | null;
  readDecisionActionArgs: (decision: HelixAgentStepDecision) => RecordLike;
  readString: (value: unknown) => string | null;
  hashPayloadShort: (value: unknown, length?: number) => string;
  mergeLedgerArtifacts: (artifacts: HelixTurnArtifact[]) => HelixTurnArtifact[];
  nowMs?: () => number;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

export const buildHelixRuntimeContinuationHint = (args: {
  turnId: string;
  source: HelixRuntimeContinuationHint["source"];
  proposal?: HelixAskTurnRuntimeStepProposal | null;
  suggestedAction?: HelixAskTurnSelectedAction | null;
  suggestedCapability?: string | null;
  missingArtifacts?: string[] | null;
  reason: string;
  migratedToAgentRuntimeLoop?: boolean;
  dependencies: HelixRuntimeContinuationHintDependencies;
}): HelixRuntimeContinuationHint => {
  const action = args.suggestedAction ?? args.proposal?.step?.action ?? null;
  const suggestedCapability =
    args.suggestedCapability ??
    args.dependencies.capabilityKeyForAction(action) ??
    (args.proposal?.step?.lane === "reasoning" ? "reasoning.followup" : null);
  const suggestedArgs = readRecord(action?.args) ?? {};
  const missingArtifacts = (args.missingArtifacts ?? [])
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
  return {
    schema: "helix.runtime_continuation_hint.v1",
    turn_id: args.turnId,
    hint_id: `${args.turnId}:runtime_continuation_hint:${args.dependencies.hashPayloadShort([
      args.source,
      suggestedCapability,
      suggestedArgs,
      missingArtifacts,
      args.reason,
    ])}`,
    source: args.source,
    suggested_capability: suggestedCapability,
    suggested_action: action,
    suggested_args: suggestedArgs,
    missing_artifacts: missingArtifacts,
    reason: args.reason,
    migrated_to_agent_runtime_loop: Boolean(args.migratedToAgentRuntimeLoop),
    accepted_by_agent_step_decision: false,
    accepted_decision_ref: null,
    rejection_reason: "runtime_loop_has_not_reviewed_hint_yet",
    authority: "hint_only_agent_must_decide",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const appendHelixRuntimeContinuationHintsToPayload = (args: {
  payload: RecordLike;
  turnId: string;
  hints: HelixRuntimeContinuationHint[];
  dependencies: HelixRuntimeContinuationHintDependencies;
}): void => {
  if (args.hints.length === 0) return;
  const existingHints = Array.isArray(args.payload.runtime_continuation_hints)
    ? (args.payload.runtime_continuation_hints as HelixRuntimeContinuationHint[])
    : [];
  const hints = [...existingHints, ...args.hints].filter((hint, index, all) =>
    all.findIndex((candidate) => candidate.hint_id === hint.hint_id) === index,
  );
  args.payload.runtime_continuation_hints = hints;
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const hintArtifacts: HelixTurnArtifact[] = hints.map((hint) => ({
    artifact_id: hint.hint_id,
    turn_id: args.turnId,
    producer_item_id: "runtime_continuation_hint",
    kind: "runtime_continuation_hint",
    created_at_ms: args.dependencies.nowMs?.() ?? Date.now(),
    source_scope: "current_turn",
    goal_hash: args.dependencies.hashPayloadShort([args.turnId, "runtime_continuation_hint", hint.suggested_capability]),
    payload: hint as unknown as RecordLike,
  }));
  args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
    ...ledger.filter((artifact) => artifact.kind !== "runtime_continuation_hint"),
    ...hintArtifacts,
  ]);
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_continuation_hints = hints;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
};

export const collectHelixRuntimeObservationRefsForHint = (args: {
  hint: HelixRuntimeContinuationHint;
  artifacts: HelixTurnArtifact[];
  dependencies: Pick<
    HelixRuntimeContinuationHintDependencies,
    "capabilityKeyForAction" | "normalizeWorkspaceDocPath" | "readArtifactPayloadRecord" | "readString"
  >;
}): { producedArtifacts: string[]; observedArtifactRefs: string[] } => {
  const hintedCapability = args.hint.suggested_capability;
  const hintedAction = args.hint.suggested_action;
  const hintedActionKey = args.dependencies.capabilityKeyForAction(hintedAction);
  const subgoalId =
    args.dependencies.readString(args.hint.suggested_args?.compound_subgoal_id) ??
    args.dependencies.readString(args.hint.suggested_action?.args?.compound_subgoal_id) ??
    null;
  const expression =
    args.dependencies.readString(args.hint.suggested_args?.latex) ??
    args.dependencies.readString(args.hint.suggested_action?.args?.latex) ??
    null;
  const path =
    args.dependencies.normalizeWorkspaceDocPath(args.hint.suggested_args?.path) ??
    args.dependencies.normalizeWorkspaceDocPath(args.hint.suggested_action?.args?.path) ??
    args.dependencies.normalizeWorkspaceDocPath(args.hint.suggested_args?.selected_path) ??
    args.dependencies.normalizeWorkspaceDocPath(args.hint.suggested_action?.args?.selected_path) ??
    null;
  const query =
    args.dependencies.readString(args.hint.suggested_args?.query) ??
    args.dependencies.readString(args.hint.suggested_action?.args?.query) ??
    null;
  const matches = args.artifacts.filter((artifact) => {
    if (
      ![
        "calculator_receipt",
        "calculator_subgoal_receipt",
        "calculator_result_validation",
        "workspace_action_receipt",
        "doc_search_results",
        "doc_open_receipt",
        "doc_location_matches",
        "doc_evidence_location",
        "process_graph_overview",
      ].includes(artifact.kind)
    ) {
      return false;
    }
    const payload = args.dependencies.readArtifactPayloadRecord(artifact);
    if (artifact.kind === "workspace_action_receipt") {
      const actionKey =
        args.dependencies.readString(payload?.action_key) ??
        (args.dependencies.readString(payload?.target_id) && args.dependencies.readString(payload?.action_id)
          ? `${args.dependencies.readString(payload?.target_id)}.${args.dependencies.readString(payload?.action_id)}`
          : null);
      if (hintedCapability && actionKey === hintedCapability) return true;
      if (hintedActionKey && actionKey === hintedActionKey) return true;
      if (
        hintedAction?.panel_id &&
        hintedAction.action_id &&
        args.dependencies.readString(payload?.target_id) === hintedAction.panel_id &&
        args.dependencies.readString(payload?.action_id) === hintedAction.action_id
      ) {
        return true;
      }
      return false;
    }
    if (artifact.kind === "process_graph_overview") {
      return hintedCapability === "process-graph.inspect" || hintedActionKey === "process-graph.inspect";
    }
    if (artifact.kind === "doc_open_receipt") {
      const artifactPath =
        args.dependencies.normalizeWorkspaceDocPath(payload?.path) ??
        args.dependencies.normalizeWorkspaceDocPath(payload?.selected_path);
      return Boolean(path && artifactPath === path);
    }
    if (artifact.kind === "doc_search_results") {
      const artifactQuery = args.dependencies.readString(payload?.query);
      return Boolean(query && artifactQuery === query);
    }
    if (artifact.kind === "doc_location_matches" || artifact.kind === "doc_evidence_location") {
      const artifactQuery = args.dependencies.readString(payload?.query);
      const artifactPath =
        args.dependencies.normalizeWorkspaceDocPath(payload?.source_path) ??
        args.dependencies.normalizeWorkspaceDocPath(payload?.path);
      return Boolean((query && artifactQuery === query) || (path && artifactPath === path));
    }
    const artifactSubgoalId = args.dependencies.readString(payload?.subgoal_id);
    const artifactExpression = args.dependencies.readString(payload?.expression);
    if (subgoalId && artifactSubgoalId === subgoalId) return true;
    if (expression && artifactExpression === expression) return true;
    return false;
  });
  return {
    producedArtifacts: Array.from(new Set(matches.map((artifact) => artifact.kind))),
    observedArtifactRefs: matches.map((artifact) => artifact.artifact_id),
  };
};

const isHelixAgentStepDecisionLike = (value: unknown): value is HelixAgentStepDecision =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as RecordLike).schema === "helix.agent_step_decision.v1" &&
      typeof (value as RecordLike).decision_id === "string",
  );

export const collectHelixAgentStepDecisionsFromPayload = (
  payload: RecordLike,
  dependencies: Pick<HelixRuntimeContinuationHintDependencies, "readArtifactPayloadRecord">,
): HelixAgentStepDecision[] => {
  const decisions: HelixAgentStepDecision[] = [];
  const push = (value: unknown): void => {
    if (isHelixAgentStepDecisionLike(value)) decisions.push(value);
  };
  push(payload.initial_agent_step_decision);
  push(payload.agent_step_decision);
  if (Array.isArray(payload.calculator_agent_subgoal_decisions)) {
    payload.calculator_agent_subgoal_decisions.forEach(push);
  }
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? (payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  for (const artifact of ledger) {
    if (artifact.kind === "agent_step_decision") push(dependencies.readArtifactPayloadRecord(artifact));
  }
  return decisions.filter(
    (decision, index, all) => all.findIndex((candidate) => candidate.decision_id === decision.decision_id) === index,
  );
};

export const helixRuntimeHintMatchesAgentStepDecision = (
  hint: HelixRuntimeContinuationHint,
  decision: HelixAgentStepDecision,
  dependencies: Pick<
    HelixRuntimeContinuationHintDependencies,
    "capabilityKeyForAction" | "readDecisionActionArgs" | "readString"
  >,
): boolean => {
  const decisionCapability = decision.chosen_capability ?? dependencies.capabilityKeyForAction(decision.action);
  if (!hint.suggested_capability || decisionCapability !== hint.suggested_capability) return false;
  if (decision.next_step !== "next_action" && decision.next_step !== "repair") return false;
  if (decision.decision !== "execute") return false;
  if (decision.action_authorization?.authorizes_tool_execution !== true) return false;
  const decisionArgs = dependencies.readDecisionActionArgs(decision);
  const hintArgs = readRecord(hint.suggested_args) ?? {};
  const comparableKeys = [
    "compound_subgoal_id",
    "latex",
    "path",
    "selected_path",
    "doc_path",
    "query",
    "rate_ms",
    "interval_ms",
    "title",
  ];
  for (const key of comparableKeys) {
    const hintValue = dependencies.readString(hintArgs[key]);
    if (!hintValue) continue;
    const decisionValue = dependencies.readString(decisionArgs[key]);
    if (decisionValue !== hintValue) return false;
  }
  return true;
};

export const resolveHelixRuntimeHintAcceptance = (
  hint: HelixRuntimeContinuationHint,
  decisions: HelixAgentStepDecision[],
  dependencies: Pick<
    HelixRuntimeContinuationHintDependencies,
    "capabilityKeyForAction" | "readDecisionActionArgs" | "readString"
  >,
): { accepted: boolean; decision: HelixAgentStepDecision | null; rejectionReason: string | null } => {
  const matchingDecision =
    decisions.find((decision) => helixRuntimeHintMatchesAgentStepDecision(hint, decision, dependencies)) ?? null;
  if (matchingDecision) {
    return { accepted: true, decision: matchingDecision, rejectionReason: null };
  }
  const capabilitySeen = decisions.some((decision) => {
    const decisionCapability = decision.chosen_capability ?? dependencies.capabilityKeyForAction(decision.action);
    return decisionCapability === hint.suggested_capability;
  });
  return {
    accepted: false,
    decision: null,
    rejectionReason: capabilitySeen
      ? "model_selected_same_capability_but_not_this_hint_args"
      : "model_did_not_select_this_hint",
  };
};

export const markHelixRuntimeContinuationHintsMigratedToAgentRuntimeLoop = (args: {
  payload: RecordLike;
  turnId: string;
  dependencies: HelixRuntimeContinuationHintDependencies;
}): void => {
  const hints = Array.isArray(args.payload.runtime_continuation_hints)
    ? (args.payload.runtime_continuation_hints as HelixRuntimeContinuationHint[])
    : [];
  if (hints.length === 0) return;
  const decisions = collectHelixAgentStepDecisionsFromPayload(args.payload, args.dependencies);
  const migratedHints = hints.map((hint) => ({
    ...hint,
    ...(() => {
      if (
        hint.source === "calculator_compound_chain" &&
        hint.suggested_capability === "scientific-calculator.solve_expression"
      ) {
        return {
          migrated_to_agent_runtime_loop: false,
          accepted_by_agent_step_decision: false,
          accepted_decision_ref: null,
          rejection_reason: "calculator_hint_requires_live_agent_selected_tool_execution",
        };
      }
      const acceptance = resolveHelixRuntimeHintAcceptance(hint, decisions, args.dependencies);
      return {
        migrated_to_agent_runtime_loop: acceptance.accepted,
        accepted_by_agent_step_decision: acceptance.accepted,
        accepted_decision_ref: acceptance.decision?.decision_id ?? null,
        rejection_reason: acceptance.rejectionReason,
      };
    })(),
  }));
  args.payload.runtime_continuation_hints = migratedHints;
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const migratedHintIds = new Set(migratedHints.map((hint) => hint.hint_id));
  args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
    ...ledger.filter((artifact) => !(artifact.kind === "runtime_continuation_hint" && migratedHintIds.has(artifact.artifact_id))),
    ...migratedHints.map((hint) => ({
      artifact_id: hint.hint_id,
      turn_id: args.turnId,
      producer_item_id: "runtime_continuation_hint",
      kind: "runtime_continuation_hint",
      created_at_ms: args.dependencies.nowMs?.() ?? Date.now(),
      source_scope: "current_turn" as const,
      goal_hash: args.dependencies.hashPayloadShort([
        args.turnId,
        "runtime_continuation_hint",
        hint.suggested_capability,
        "migrated",
      ]),
      payload: hint as unknown as RecordLike,
    })),
  ]);
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_continuation_hints = migratedHints;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
};
