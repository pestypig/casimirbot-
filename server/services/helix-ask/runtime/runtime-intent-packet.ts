type RecordLike = Record<string, unknown>;

export type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: "current_turn" | "prior_turn_context" | "workspace_state" | string;
  goal_hash?: string;
  payload?: RecordLike;
};

type HelixRuntimeIntentGoalFrame = RecordLike & {
  goal_kind?: string;
  answer_scope?: string;
};

type HelixRuntimeIntentAvailableCapabilities = RecordLike & {
  capabilities?: Array<RecordLike & { goal_fit?: string; requires_action?: boolean }>;
};

type HelixRuntimeIntentGoalSatisfactionEvaluation = RecordLike & {
  terminal_contract?: HelixRuntimeIntentTerminalContract | null;
};

type HelixRuntimeIntentTerminalContract = RecordLike & {
  required_actions?: string[];
  required_evidence?: string[];
  required_terminal_kinds?: string[];
  forbidden_terminal_kinds?: string[];
};

type HelixRuntimeContinuationHint = RecordLike & {
  hint_id?: string;
  suggested_capability?: string | null;
  suggested_action?: unknown;
  missing_artifacts?: unknown;
  migrated_to_agent_runtime_loop?: unknown;
  reason?: string;
};

type HelixRuntimeIntentHint = {
  source:
    | "classifier"
    | "source_target_intent"
    | "legacy_route"
    | "planner"
    | "workspace_context"
    | "runtime_continuation_hint";
  hint_key: string;
  value: unknown;
  reason: string;
  authority: "hint_only";
};

type HelixRuntimeIntentPacket = {
  schema: "helix.runtime_intent_packet.v1";
  turn_id: string;
  user_prompt: string;
  canonical_goal_frame: HelixRuntimeIntentGoalFrame | null;
  available_capabilities: HelixRuntimeIntentAvailableCapabilities | null;
  capability_itinerary: RecordLike | null;
  terminal_contract: HelixRuntimeIntentTerminalContract | null;
  hints: HelixRuntimeIntentHint[];
  required_actions: string[];
  required_evidence: string[];
  required_terminal_kinds: string[];
  forbidden_terminal_kinds: string[];
  completion_authority: "agent_runtime_loop_and_goal_satisfaction";
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRuntimeSemanticRouteProposal = {
  schema: "helix.runtime_semantic_route_proposal.v1";
  turn_id: string;
  proposal_id: string;
  prompt_hash: string;
  proposal_source: "agent_runtime" | "runtime_intent_packet_projection";
  proposed_route: string | null;
  proposed_tool_family: string | null;
  proposed_capability_id: string | null;
  proposed_capability_ids: string[];
  confidence: "low" | "medium" | "high" | "unknown";
  uncertainty: string[];
  reason_summary: string;
  supporting_hint_refs: string[];
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRuntimeIntentPacketDependencies = {
  readString: (value: unknown) => string | null;
  resolveTerminalContract: (args: {
    canonicalGoalFrame: HelixRuntimeIntentGoalFrame;
    transcript: string;
    selectedAction: RecordLike | null;
  }) => HelixRuntimeIntentTerminalContract | null;
  hashPayloadShort: (value: unknown, length?: number) => string;
  mergeLedgerArtifacts: (artifacts: HelixTurnArtifact[]) => HelixTurnArtifact[];
  nowMs?: () => number;
};

type ReadStringDependency = Pick<HelixRuntimeIntentPacketDependencies, "readString">;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readFirstString = (record: RecordLike | null | undefined, keys: string[], readString: (value: unknown) => string | null): string | null => {
  if (!record) return null;
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) return value;
  }
  return null;
};

const inferToolFamilyFromCapabilityId = (capabilityId: string | null): string | null => {
  if (!capabilityId) return null;
  const normalized = capabilityId.toLowerCase();
  if (normalized.includes("moral")) return "moral_graph";
  if (normalized.includes("theory") || normalized.includes("badge")) return "theory_graph";
  if (normalized.includes("calculator") || normalized.includes("calc")) return "calculator";
  if (normalized.includes("image") || normalized.includes("vision") || normalized.includes("visual")) return "image_lens";
  if (normalized.includes("scholarly") || normalized.includes("paper")) return "scholarly_research";
  if (normalized.includes("internet") || normalized.includes("web")) return "internet_search";
  if (normalized.includes("repo") || normalized.includes("code")) return "repo";
  if (normalized.includes("doc")) return "docs";
  if (normalized.includes("note")) return "notes";
  if (normalized.includes("model") || normalized.includes("direct")) return "model_only";
  return null;
};

const inferToolFamilyFromGoalKind = (goalKind: string | null): string | null => {
  if (!goalKind) return null;
  const normalized = goalKind.toLowerCase();
  if (normalized.includes("moral")) return "moral_graph";
  if (normalized.includes("theory") || normalized.includes("badge")) return "theory_graph";
  if (normalized.includes("calculator") || normalized.includes("calc")) return "calculator";
  if (normalized.includes("image") || normalized.includes("visual")) return "image_lens";
  if (normalized.includes("scholarly") || normalized.includes("paper")) return "scholarly_research";
  if (normalized.includes("internet") || normalized.includes("web")) return "internet_search";
  if (normalized.includes("repo") || normalized.includes("code")) return "repo";
  if (normalized.includes("doc")) return "docs";
  if (normalized.includes("note")) return "notes";
  if (normalized.includes("model") || normalized.includes("answer") || normalized.includes("concept")) return "model_only";
  return null;
};

export const normalizeHelixRuntimeSemanticRouteProposal = (args: {
  value: unknown;
  turnId: string;
  promptHash: string;
  dependencies: Pick<HelixRuntimeIntentPacketDependencies, "readString" | "hashPayloadShort">;
}): HelixRuntimeSemanticRouteProposal | null => {
  const record = readRecord(args.value);
  if (!record || args.dependencies.readString(record.schema) !== "helix.runtime_semantic_route_proposal.v1") {
    return null;
  }
  if (args.dependencies.readString(record.proposal_source) !== "agent_runtime") return null;
  const proposalTurnId = args.dependencies.readString(record.turn_id);
  if (proposalTurnId && proposalTurnId !== args.turnId) return null;
  const proposedRoute = args.dependencies.readString(record.proposed_route);
  const proposedCapabilityIds = Array.from(new Set([
    args.dependencies.readString(record.proposed_capability_id),
    ...(Array.isArray(record.proposed_capability_ids)
      ? record.proposed_capability_ids.map((entry: unknown) => args.dependencies.readString(entry))
      : []),
  ].filter((entry: string | null): entry is string => Boolean(entry)))).slice(0, 32);
  const proposedCapabilityId = proposedCapabilityIds[0] ?? null;
  const proposedToolFamily =
    args.dependencies.readString(record.proposed_tool_family) ??
    inferToolFamilyFromCapabilityId(proposedCapabilityId) ??
    inferToolFamilyFromGoalKind(proposedRoute);
  const rawConfidence = args.dependencies.readString(record.confidence);
  const confidence: HelixRuntimeSemanticRouteProposal["confidence"] =
    rawConfidence === "low" || rawConfidence === "medium" || rawConfidence === "high" || rawConfidence === "unknown"
      ? rawConfidence
      : proposedRoute || proposedToolFamily || proposedCapabilityId
        ? "medium"
        : "unknown";
  const uncertainty = Array.isArray(record.uncertainty)
    ? record.uncertainty
        .map((entry: unknown) => args.dependencies.readString(entry))
        .filter((entry: string | null): entry is string => Boolean(entry))
    : [];
  const supportingHintRefs = Array.isArray(record.supporting_hint_refs)
    ? record.supporting_hint_refs
        .map((entry: unknown) => args.dependencies.readString(entry))
        .filter((entry: string | null): entry is string => Boolean(entry))
    : [];
  return {
    schema: "helix.runtime_semantic_route_proposal.v1",
    turn_id: args.turnId,
    proposal_id:
      args.dependencies.readString(record.proposal_id) ??
      `${args.turnId}:runtime_semantic_route_proposal:agent_runtime:${args.dependencies.hashPayloadShort([
        args.turnId,
        proposedRoute,
        proposedToolFamily,
        proposedCapabilityIds,
      ])}`,
    prompt_hash: args.dependencies.readString(record.prompt_hash) ?? args.promptHash,
    proposal_source: "agent_runtime",
    proposed_route: proposedRoute,
    proposed_tool_family: proposedToolFamily,
    proposed_capability_id: proposedCapabilityId,
    proposed_capability_ids: proposedCapabilityIds,
    confidence,
    uncertainty,
    reason_summary:
      args.dependencies.readString(record.reason_summary) ??
      "Runtime provider supplied a semantic route proposal; Helix route admission still decides allowed tools and terminal products.",
    supporting_hint_refs: supportingHintRefs,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const readHelixRuntimeCanonicalGoalFrame = (payload: RecordLike): HelixRuntimeIntentGoalFrame | null =>
  readRecord(payload.canonical_goal_frame) as HelixRuntimeIntentGoalFrame | null;

export const readHelixRuntimeAvailableCapabilities = (payload: RecordLike): HelixRuntimeIntentAvailableCapabilities | null =>
  readRecord(payload.available_capabilities) as HelixRuntimeIntentAvailableCapabilities | null;

export const readHelixRuntimeGoalSatisfactionEvaluation = (
  payload: RecordLike,
): HelixRuntimeIntentGoalSatisfactionEvaluation | null =>
  readRecord(payload.goal_satisfaction_evaluation) as HelixRuntimeIntentGoalSatisfactionEvaluation | null;

export const isHelixRuntimeSourceTargetedTurn = (payload: RecordLike, dependencies: ReadStringDependency): boolean => {
  const sourceTarget = readRecord(payload.source_target_intent);
  const goalFrame = readHelixRuntimeCanonicalGoalFrame(payload);
  const targetSource = dependencies.readString(sourceTarget?.target_source);
  return Boolean(
    sourceTarget?.must_enter_backend_ask === true ||
      sourceTarget?.allow_no_tool_direct === false ||
      (targetSource && targetSource !== "unknown" && targetSource !== "model_only") ||
      (goalFrame && goalFrame.answer_scope !== "model_only"),
  );
};

export const isHelixRuntimeCapabilityTurn = (payload: RecordLike, dependencies: ReadStringDependency): boolean => {
  const goalFrame = readHelixRuntimeCanonicalGoalFrame(payload);
  const goalKind = dependencies.readString(goalFrame?.goal_kind);
  const terminalKind = dependencies.readString(payload.terminal_artifact_kind);
  const availableCapabilities = readHelixRuntimeAvailableCapabilities(payload);
  const hints = Array.isArray(payload.runtime_continuation_hints) ? payload.runtime_continuation_hints : [];
  const primaryActionCapability = availableCapabilities?.capabilities?.some(
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

export const buildHelixRuntimeIntentPacket = (args: {
  payload: RecordLike;
  turnId: string;
  prompt?: string | null;
  dependencies: HelixRuntimeIntentPacketDependencies;
}): HelixRuntimeIntentPacket | null => {
  const canonicalGoalFrame = readHelixRuntimeCanonicalGoalFrame(args.payload);
  const availableCapabilities = readHelixRuntimeAvailableCapabilities(args.payload);
  const capabilityItinerary = readRecord(args.payload.capability_itinerary);
  const selectedAction = readRecord(args.payload.workspace_action);
  const terminalContract =
    readHelixRuntimeGoalSatisfactionEvaluation(args.payload)?.terminal_contract ??
    (canonicalGoalFrame
      ? args.dependencies.resolveTerminalContract({
          canonicalGoalFrame,
          transcript: args.prompt ?? args.dependencies.readString(args.payload.active_prompt) ?? "",
          selectedAction,
        })
      : null);
  if (!canonicalGoalFrame && !availableCapabilities && !terminalContract) return null;
  const prompt =
    args.prompt ??
    args.dependencies.readString(args.payload.active_prompt) ??
    args.dependencies.readString(args.payload.question) ??
    args.dependencies.readString(args.payload.prompt) ??
    "";
  const sourceTarget = readRecord(args.payload.source_target_intent);
  const planner = readRecord(args.payload.planner_contract);
  const runtimeHints = Array.isArray(args.payload.runtime_continuation_hints)
    ? (args.payload.runtime_continuation_hints as HelixRuntimeContinuationHint[])
    : [];
  const hints: HelixRuntimeIntentHint[] = [];
  const pushHint = (hint: Omit<HelixRuntimeIntentHint, "authority">): void => {
    if (hint.value === undefined || hint.value === null || hint.value === "") return;
    hints.push({ ...hint, authority: "hint_only" });
  };
  pushHint({
    source: "classifier",
    hint_key: "route_reason_code",
    value: args.dependencies.readString(args.payload.route_reason_code) ?? args.dependencies.readString(args.payload.route),
    reason: "Classifier/route result can suggest a lane but cannot complete the turn.",
  });
  pushHint({
    source: "classifier",
    hint_key: "canonical_goal_kind",
    value: canonicalGoalFrame?.goal_kind,
    reason: "Goal classification constrains contracts but is not terminal authority.",
  });
  pushHint({
    source: "source_target_intent",
    hint_key: "target_source",
    value: sourceTarget?.target_source,
    reason: "Source targeting is a hint for tool choice; the runtime loop must select any source/tool use.",
  });
  pushHint({
    source: "planner",
    hint_key: "capability_itinerary",
    value: capabilityItinerary
      ? {
          prompt_shape: capabilityItinerary.prompt_shape,
          relevant_tool_families: capabilityItinerary.relevant_tool_families,
          missing_tool_families: capabilityItinerary.missing_tool_families,
        }
      : null,
    reason: "The itinerary states pre-execution tool and reasoning criteria, but is not terminal authority.",
  });
  pushHint({
    source: "legacy_route",
    hint_key: "terminal_artifact_kind",
    value: args.dependencies.readString(args.payload.terminal_artifact_kind),
    reason: "A selected artifact is evidence to review, not completion authority.",
  });
  pushHint({
    source: "planner",
    hint_key: "selected_action",
    value: planner?.selected_action ?? args.payload.workspace_action,
    reason: "Legacy planner actions are non-authoritative hints for agent_step_decision.",
  });
  pushHint({
    source: "workspace_context",
    hint_key: "active_panel",
    value: readRecord(args.payload.workspace_context_snapshot)?.activePanel,
    reason: "Ambient workspace context is visible context, not forced source selection.",
  });
  for (const hint of runtimeHints) {
    pushHint({
      source: "runtime_continuation_hint",
      hint_key: hint.suggested_capability ?? hint.hint_id ?? "",
      value: {
        suggested_capability: hint.suggested_capability,
        suggested_action: hint.suggested_action,
        missing_artifacts: hint.missing_artifacts,
        migrated_to_agent_runtime_loop: hint.migrated_to_agent_runtime_loop,
      },
      reason: hint.reason ?? "",
    });
  }
  return {
    schema: "helix.runtime_intent_packet.v1",
    turn_id: args.turnId,
    user_prompt: prompt,
    canonical_goal_frame: canonicalGoalFrame,
    available_capabilities: availableCapabilities,
    capability_itinerary: capabilityItinerary,
    terminal_contract: terminalContract,
    hints,
    required_actions: terminalContract?.required_actions ?? [],
    required_evidence: terminalContract?.required_evidence ?? [],
    required_terminal_kinds: terminalContract?.required_terminal_kinds ?? [],
    forbidden_terminal_kinds: terminalContract?.forbidden_terminal_kinds ?? [],
    completion_authority: "agent_runtime_loop_and_goal_satisfaction",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildHelixRuntimeSemanticRouteProposal = (args: {
  packet: HelixRuntimeIntentPacket;
  dependencies: Pick<HelixRuntimeIntentPacketDependencies, "readString" | "hashPayloadShort">;
}): HelixRuntimeSemanticRouteProposal => {
  const primaryCapability =
    args.packet.available_capabilities?.capabilities?.find((capability: RecordLike & { goal_fit?: string }) => capability.goal_fit === "primary") ??
    args.packet.available_capabilities?.capabilities?.[0] ??
    null;
  const proposedCapabilityId = readFirstString(
    primaryCapability,
    ["capability_id", "capabilityId", "id", "key", "name"],
    args.dependencies.readString,
  );
  const proposedRoute =
    args.dependencies.readString(args.packet.canonical_goal_frame?.goal_kind) ??
    args.dependencies.readString(args.packet.canonical_goal_frame?.answer_scope) ??
    args.packet.hints
      .map((hint: HelixRuntimeIntentHint) => args.dependencies.readString(hint.value))
      .find((value: string | null): value is string => Boolean(value)) ??
    null;
  const proposedToolFamily =
    inferToolFamilyFromCapabilityId(proposedCapabilityId) ?? inferToolFamilyFromGoalKind(proposedRoute);
  const supportingHintRefs = args.packet.hints.map((hint: HelixRuntimeIntentHint, index: number) => `${args.packet.turn_id}:runtime_intent_packet:hints:${hint.source}:${hint.hint_key || index}`);
  const uncertainty: string[] = [];
  if (!proposedRoute) uncertainty.push("no_canonical_goal_route_available");
  if (!proposedCapabilityId && !proposedToolFamily) uncertainty.push("no_primary_capability_or_tool_family_available");
  if (args.packet.hints.length > 0) uncertainty.push("classifier_and_planner_inputs_are_hint_only");
  const confidence =
    proposedRoute && proposedCapabilityId
      ? "high"
      : proposedRoute || proposedToolFamily
        ? "medium"
        : args.packet.hints.length > 0
          ? "low"
          : "unknown";
  const promptHash = args.dependencies.hashPayloadShort([
    args.packet.turn_id,
    args.packet.user_prompt,
    args.packet.canonical_goal_frame?.goal_kind,
  ]);
  return {
    schema: "helix.runtime_semantic_route_proposal.v1",
    turn_id: args.packet.turn_id,
    proposal_id: `${args.packet.turn_id}:runtime_semantic_route_proposal`,
    prompt_hash: promptHash,
    proposal_source: "runtime_intent_packet_projection",
    proposed_route: proposedRoute,
    proposed_tool_family: proposedToolFamily,
    proposed_capability_id: proposedCapabilityId,
    proposed_capability_ids: proposedCapabilityId ? [proposedCapabilityId] : [],
    confidence,
    uncertainty,
    reason_summary:
      "Projected from the current runtime intent packet for audit comparison only; Helix route admission still decides allowed tools and terminal products.",
    supporting_hint_refs: supportingHintRefs,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const appendHelixRuntimeIntentPacketToPayload = (args: {
  payload: RecordLike;
  turnId: string;
  prompt?: string | null;
  dependencies: HelixRuntimeIntentPacketDependencies;
}): HelixRuntimeIntentPacket | null => {
  const packet = buildHelixRuntimeIntentPacket(args);
  if (!packet) return null;
  const promptHash = args.dependencies.hashPayloadShort([
    packet.turn_id,
    packet.user_prompt,
    packet.canonical_goal_frame?.goal_kind,
  ]);
  const semanticRouteProposal =
    normalizeHelixRuntimeSemanticRouteProposal({
      value: args.payload.runtime_semantic_route_proposal ?? args.payload.agent_runtime_semantic_route_proposal,
      turnId: args.turnId,
      promptHash,
      dependencies: args.dependencies,
    }) ??
    buildHelixRuntimeSemanticRouteProposal({
      packet,
      dependencies: args.dependencies,
    });
  args.payload.runtime_intent_packet = packet;
  args.payload.runtime_semantic_route_proposal = semanticRouteProposal;
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  args.payload.current_turn_artifact_ledger = args.dependencies.mergeLedgerArtifacts([
    ...ledger.filter((artifact: HelixTurnArtifact) => artifact.kind !== "runtime_intent_packet" && artifact.kind !== "runtime_semantic_route_proposal"),
    {
      artifact_id: `${args.turnId}:runtime_intent_packet`,
      turn_id: args.turnId,
      producer_item_id: "runtime_intent_packet",
      kind: "runtime_intent_packet",
      created_at_ms: args.dependencies.nowMs?.() ?? Date.now(),
      source_scope: "current_turn",
      goal_hash: args.dependencies.hashPayloadShort([
        args.turnId,
        "runtime_intent_packet",
        packet.canonical_goal_frame?.goal_kind,
      ]),
      payload: packet as unknown as RecordLike,
    },
    {
      artifact_id: semanticRouteProposal.proposal_id,
      turn_id: args.turnId,
      producer_item_id: "runtime_semantic_route_proposal",
      kind: "runtime_semantic_route_proposal",
      created_at_ms: args.dependencies.nowMs?.() ?? Date.now(),
      source_scope: "current_turn",
      goal_hash: args.dependencies.hashPayloadShort([
        args.turnId,
        "runtime_semantic_route_proposal",
        semanticRouteProposal.proposed_route,
        semanticRouteProposal.proposed_tool_family,
      ]),
      payload: semanticRouteProposal as unknown as RecordLike,
    },
  ]);
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_intent_packet = packet;
    debug.runtime_semantic_route_proposal = semanticRouteProposal;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
  return packet;
};

export const refreshHelixRuntimeAuthorityAuditForIntentPacket = (args: {
  payload: RecordLike;
  turnId: string;
  dependencies: HelixRuntimeIntentPacketDependencies;
}): void => {
  const audit = readRecord(args.payload.runtime_authority_audit);
  if (!audit || !args.payload.runtime_intent_packet) return;
  audit.runtime_intent_packet_ref = `${args.turnId}:runtime_intent_packet`;
  audit.source_targeted_turn = isHelixRuntimeSourceTargetedTurn(args.payload, args.dependencies);
  audit.capability_turn = isHelixRuntimeCapabilityTurn(args.payload, args.dependencies);
  const checks = Array.isArray(audit.checks)
    ? (audit.checks as Array<RecordLike>)
    : [];
  for (const check of checks) {
    if (args.dependencies.readString(check.check) === "runtime_intent_packet_present_for_source_or_capability_turn") {
      check.passed = true;
      check.evidence = `${args.turnId}:runtime_intent_packet`;
    }
  }
  audit.ok = checks.length > 0 ? checks.every((check: RecordLike) => check.passed === true) : audit.ok;
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_authority_audit = audit;
  }
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  const auditArtifact = ledger.find((artifact: HelixTurnArtifact) => artifact.kind === "runtime_authority_audit");
  if (auditArtifact) {
    auditArtifact.payload = audit;
  }
};
