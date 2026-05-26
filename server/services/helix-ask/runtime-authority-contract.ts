export type HelixRuntimeAuthoritySeverity = "pass" | "p0" | "p1" | "p2";

export type HelixRuntimeAuthorityBoundaryReport = {
  schema: "helix.runtime_authority_boundary_report.v1";
  source_capability_diagnostic_turn: boolean;
  requires_runtime_loop: boolean;
  terminal_kind: string | null;
  final_answer_source: string | null;
  checks: {
    agent_runtime_loop: boolean;
    agent_step_decision: boolean;
    selected_capability_observation: boolean;
    post_observation_model_decision: boolean;
    goal_satisfaction_allows_terminal: boolean;
    typed_failure_clean: boolean;
  };
  eligible: boolean;
  severity: HelixRuntimeAuthoritySeverity;
  blocking_reasons: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const SOURCE_CAPABILITY_GOAL_KINDS = new Set([
  "active_doc_identity",
  "active_doc_summary",
  "calculator_live_source",
  "calculator_solve",
  "debug_diagnosis",
  "doc_evidence_location",
  "doc_evidence_synthesis",
  "doc_open",
  "doc_open_best",
  "doc_summary",
  "docs_panel_open",
  "latest_doc_navigation",
  "live_interval_set",
  "live_pipeline_control",
  "live_pipeline_repair",
  "note_mutation",
  "panel_control",
  "process_graph_overview",
  "situation_context_question",
  "visual_capture_describe",
]);

const MODEL_DIRECT_ANSWER_GOAL_KINDS = new Set([
  "model_only_concept",
  "workspace_help",
  "conversation",
]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const readStringArray = (value: unknown): string[] =>
  readArray(value).filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim());

const payloadGoalKind = (payload: Record<string, unknown>): string | null =>
  readString(readRecord(payload.canonical_goal_frame)?.goal_kind) ??
  readString(readRecord(payload.goal_satisfaction_evaluation)?.canonical_goal_kind) ??
  readString(readRecord(payload.terminal_contract)?.goal_kind);

const artifactKindMatchesCapability = (
  capability: string,
  artifact: Record<string, unknown> | null,
): boolean => {
  const kind = readString(artifact?.kind);
  const payload = readRecord(artifact?.payload);
  const payloadKind = readString(payload?.kind);
  const schema = readString(payload?.schema);
  const actionId = readString(payload?.action_id) ?? readString(readRecord(payload?.action)?.action_id);
  const panelId = readString(payload?.panel_id) ?? readString(readRecord(payload?.action)?.panel_id);
  const joined = [kind, payloadKind, schema, actionId, panelId].filter(Boolean).join(" ");

  if (capability === "docs-viewer.open") return /workspace_action_receipt|docs-viewer|docs_viewer|open/i.test(joined);
  if (capability === "docs-viewer.identify_current_doc") return /active_doc_identity|active_doc_path|doc_summary/i.test(joined);
  if (capability === "docs-viewer.search_docs") return /doc_search_results|doc_candidate_validation|retrieval_context/i.test(joined);
  if (capability === "docs-viewer.validate_doc_candidates") return /doc_candidate_validation|doc_search_results/i.test(joined);
  if (capability === "docs-viewer.open_doc_by_path") return /doc_open_receipt|active_doc_path|workspace_action_receipt|doc_summary/i.test(joined);
  if (capability === "docs-viewer.summarize_doc") return /doc_summary/i.test(joined);
  if (capability === "docs-viewer.locate_in_doc") return /doc_location_result|doc_location_matches|doc_evidence_location|line_backed_locations/i.test(joined);
  if (capability.startsWith("scientific-calculator.")) return /calculator_receipt|calculator_result|workstation_tool_evaluation|tool_evaluation/i.test(joined);
  if (capability.startsWith("workstation-notes.")) return /note_update_receipt|workspace_action_receipt|note_/i.test(joined);
  if (capability.startsWith("live-source.") || capability.startsWith("situation-room.")) return /live_pipeline_receipt|live_source|visual_context_pack|situation_context_pack|permission_denied|workspace_action_receipt/i.test(joined);
  if (capability.startsWith("process-graph.")) return /process_graph_overview|workspace_action_receipt/i.test(joined);
  if (capability.includes(".")) return /tool_observation|workspace_action_receipt/i.test(joined);
  return false;
};

const observedArtifactRefsForIteration = (iteration: Record<string, unknown>): string[] => {
  const toolObservation = readRecord(iteration.tool_observation);
  return Array.from(new Set([
    ...readStringArray(iteration.observed_artifact_refs),
    ...readStringArray(iteration.observation_refs),
    ...readStringArray(iteration.artifact_refs),
    ...readStringArray(iteration.created_artifact_refs),
    ...readStringArray(toolObservation?.artifact_refs),
    ...readStringArray(toolObservation?.observed_artifact_refs),
    ...(readString(toolObservation?.artifact_id) ? [readString(toolObservation?.artifact_id) as string] : []),
  ]));
};

const artifactLinkedToIteration = (
  artifact: Record<string, unknown> | null,
  iteration: Record<string, unknown>,
): boolean => {
  if (!artifact) return false;
  const decisionId = readString(iteration.decision_id) ?? readString(iteration.decision_ref);
  const payload = readRecord(artifact.payload);
  const explicitDecisionRefs = [
    readString(artifact.decision_ref),
    readString(artifact.agent_step_decision_ref),
    readString(artifact.runtime_decision_ref),
    readString(artifact.prior_agent_step_decision_ref),
    readString(payload?.decision_ref),
    readString(payload?.agent_step_decision_ref),
    readString(payload?.runtime_decision_ref),
    readString(payload?.prior_agent_step_decision_ref),
  ].filter((entry): entry is string => Boolean(entry));
  if (explicitDecisionRefs.length > 0) return Boolean(decisionId && explicitDecisionRefs.includes(decisionId));
  const artifactId = readString(artifact.artifact_id);
  if (!artifactId) return false;
  return observedArtifactRefsForIteration(iteration).includes(artifactId);
};

export function isSourceCapabilityDiagnosticTurn(payload: Record<string, unknown>): boolean {
  const goalKind = payloadGoalKind(payload);
  if (goalKind && MODEL_DIRECT_ANSWER_GOAL_KINDS.has(goalKind)) return false;
  if (goalKind && SOURCE_CAPABILITY_GOAL_KINDS.has(goalKind)) return true;
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const targetSource = readString(sourceTargetIntent?.target_source);
  const targetKind = readString(sourceTargetIntent?.target_kind);
  if (targetSource && !["unknown", "none", "model_only", "general_background"].includes(targetSource)) return true;
  if (targetKind && !["unknown", "none", "model_only", "general_background"].includes(targetKind)) return true;
  const route = `${readString(payload.route_reason_code) ?? ""} ${readString(payload.route) ?? ""}`;
  return /\b(?:calculator|docs?|doc_|visual|live|note|panel|debug|process_graph|workspace)\b/i.test(route);
}

export function isModelDirectAnswerTurn(payload: Record<string, unknown>): boolean {
  const goalKind = payloadGoalKind(payload);
  const terminalKind = readString(payload.terminal_artifact_kind);
  const finalAnswerSource = readString(payload.final_answer_source);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  return Boolean(
    (goalKind && MODEL_DIRECT_ANSWER_GOAL_KINDS.has(goalKind)) ||
      terminalKind === "direct_answer_text" ||
      finalAnswerSource === "model_direct_answer" ||
      readString(sourceTargetIntent?.target_source) === "model_only" ||
      readString(sourceTargetIntent?.target_kind) === "general_background",
  );
}

export function hasAgentRuntimeLoopDecisionChain(payload: Record<string, unknown>): boolean {
  const loop = readRecord(payload.agent_runtime_loop);
  const iterations = readArray(loop?.iterations);
  if (iterations.length > 0) {
    return iterations.some((iteration) => {
      const record = readRecord(iteration);
      return Boolean(
        readString(record?.decision_id) ||
          readString(record?.chosen_capability) ||
          readRecord(record?.agent_step_decision),
      );
    });
  }
  const decision = readRecord(payload.agent_step_decision);
  return Boolean(readString(decision?.decision_id) || readString(decision?.chosen_capability));
}

export function hasSelectedCapabilityObservation(payload: Record<string, unknown>): boolean {
  const loop = readRecord(payload.agent_runtime_loop);
  const iterations = readArray(loop?.iterations);
  const agentStepLoop = readRecord(payload.agent_step_loop);
  const agentStepLoopSteps = readArray(agentStepLoop?.steps);
  const artifacts = readArray(payload.current_turn_artifact_ledger);
  const artifactById = new Map<string, Record<string, unknown>>();
  for (const artifact of artifacts) {
    const record = readRecord(artifact);
    const artifactId = readString(record?.artifact_id);
    if (record && artifactId) artifactById.set(artifactId, record);
  }

  const runtimeLoopHasObservation = iterations.some((iteration) => {
    const record = readRecord(iteration);
    const capability = readString(record?.chosen_capability);
    if (!record || !capability || capability === "model.direct_answer") return false;
    const refs = observedArtifactRefsForIteration(record);
    if (refs.some((ref) => {
      const artifact = artifactById.get(ref) ?? null;
      return artifactLinkedToIteration(artifact, record) && artifactKindMatchesCapability(capability, artifact);
    })) return true;
    const toolObservation = readRecord(record.tool_observation);
    if (!toolObservation) return false;
    const status = readString(toolObservation.status);
    return /completed|observed|ok|success/i.test(status ?? "") && artifactKindMatchesCapability(capability, toolObservation);
  });
  if (runtimeLoopHasObservation) return true;

  return agentStepLoopSteps.some((step, index) => {
    const record = readRecord(step);
    const capability = readString(record?.chosen_capability);
    if (!record || !capability || capability === "model.direct_answer") return false;
    const candidateSteps = agentStepLoopSteps.slice(index)
      .map((entry) => readRecord(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const refs = Array.from(new Set(candidateSteps.flatMap((entry) => observedArtifactRefsForIteration(entry))));
    return refs.some((ref) => {
      const artifact = artifactById.get(ref) ?? null;
      return Boolean(artifact) && artifactKindMatchesCapability(capability, artifact);
    });
  });
}

export function hasPostObservationModelDecision(payload: Record<string, unknown>): boolean {
  const loop = readRecord(payload.agent_runtime_loop);
  const iterations = readArray(loop?.iterations);
  if (iterations.some((iteration) => {
    const record = readRecord(iteration);
    const timing = readString(record?.decision_timing);
    const authority = readString(record?.decision_authority) ?? readString(record?.sampling_mode);
    const nextStep = readString(record?.next_step);
    const observationRole = readString(record?.observation_role);
    const decisionAuthorityOk = /llm|model|deterministic_policy_fallback/i.test(authority ?? "");
    return (
      (/post_observation|terminal_review/i.test(timing ?? "") && decisionAuthorityOk) ||
      (nextStep === "answer" && decisionAuthorityOk && (!observationRole || /model_answer_draft|terminal_decision/i.test(observationRole)))
    );
  })) {
    return true;
  }
  const artifacts = readArray(payload.current_turn_artifact_ledger);
  return artifacts.some((artifact) => {
    const record = readRecord(artifact);
    const kind = readString(record?.kind);
    const payloadRecord = readRecord(record?.payload);
    return kind === "post_tool_observation_review" || readString(payloadRecord?.schema) === "helix.post_tool_observation_review.v1";
  });
}

export function hasDirectAnswerDraft(payload: Record<string, unknown>): boolean {
  if (readString(readRecord(payload.direct_answer_text)?.text)) return true;
  if (readString(readRecord(payload.final_answer_draft)?.text)) return true;
  const artifacts = readArray(payload.current_turn_artifact_ledger);
  return artifacts.some((artifact) => {
    const record = readRecord(artifact);
    const kind = readString(record?.kind);
    const artifactPayload = readRecord(record?.payload);
    const schema = readString(artifactPayload?.schema);
    return (
      kind === "direct_answer_text" ||
      kind === "final_answer_draft" ||
      schema === "helix.direct_answer_text.v1" ||
      schema === "helix.final_answer_draft.v1"
    );
  });
}

export function goalSatisfactionAllowsTerminal(payload: Record<string, unknown>): boolean {
  const goalSatisfaction =
    readRecord(payload.goal_satisfaction_evaluation) ??
    readRecord(payload.runtime_goal_satisfaction_observation) ??
    readRecord(payload.satisfaction_report);
  const satisfaction = readString(goalSatisfaction?.satisfaction);
  const nextDecision = readString(goalSatisfaction?.next_decision);
  const terminalKind = readString(payload.terminal_artifact_kind);
  if (terminalKind === "typed_failure") return hasCleanTypedFailure(payload);
  if (satisfaction === "satisfied" && (!nextDecision || nextDecision === "allow_terminal")) return true;
  if (readString(goalSatisfaction?.terminal_kind) === "final_answer" && goalSatisfaction?.satisfied === true) return true;
  return false;
}

export function hasCleanTypedFailure(payload: Record<string, unknown>): boolean {
  if (readString(payload.terminal_artifact_kind) !== "typed_failure" && readString(payload.final_answer_source) !== "typed_failure") return false;
  return Boolean(
    readString(payload.terminal_error_code) ||
      readString(readRecord(payload.typed_failure)?.error_code) ||
      readString(readRecord(payload.typed_failure)?.failure_code) ||
      readString(readRecord(payload.satisfaction_report)?.missing_reason),
  );
}

export function evaluateTerminalBoundaryEligibility(payload: Record<string, unknown>): HelixRuntimeAuthorityBoundaryReport {
  const sourceCapabilityDiagnosticTurn = isSourceCapabilityDiagnosticTurn(payload);
  const modelDirectAnswerTurn = isModelDirectAnswerTurn(payload);
  const runtimeBoundTurn = sourceCapabilityDiagnosticTurn || modelDirectAnswerTurn;
  const terminalKind = readString(payload.terminal_artifact_kind);
  const finalAnswerSource = readString(payload.final_answer_source);
  const checks = {
    agent_runtime_loop: hasAgentRuntimeLoopDecisionChain(payload),
    agent_step_decision: Boolean(readRecord(payload.agent_step_decision)) || hasAgentRuntimeLoopDecisionChain(payload),
    selected_capability_observation: hasSelectedCapabilityObservation(payload),
    post_observation_model_decision: hasPostObservationModelDecision(payload),
    goal_satisfaction_allows_terminal: goalSatisfactionAllowsTerminal(payload),
    typed_failure_clean: hasCleanTypedFailure(payload),
  };
  const requiresRuntimeLoop = runtimeBoundTurn && terminalKind !== "typed_failure";
  const blockingReasons: string[] = [];
  if (runtimeBoundTurn) {
    if (!checks.goal_satisfaction_allows_terminal) blockingReasons.push("goal_satisfaction_not_terminal");
    if (terminalKind === "typed_failure") {
      if (!checks.typed_failure_clean) blockingReasons.push("typed_failure_missing_code");
    } else {
      if (!checks.agent_runtime_loop) blockingReasons.push("agent_runtime_loop_missing");
      if (!checks.agent_step_decision) blockingReasons.push("agent_step_decision_missing");
      if (modelDirectAnswerTurn) {
        if (!hasDirectAnswerDraft(payload)) blockingReasons.push("direct_answer_text_missing");
      } else if (!checks.selected_capability_observation) {
        blockingReasons.push("selected_capability_observation_missing");
      }
      if (!checks.post_observation_model_decision) blockingReasons.push("post_observation_model_decision_missing");
    }
  }
  const eligible = blockingReasons.length === 0;
  const severity: HelixRuntimeAuthoritySeverity =
    eligible
      ? "pass"
      : blockingReasons.some((reason) => /agent_runtime_loop_missing|agent_step_decision_missing|selected_capability_observation_missing/.test(reason))
        ? "p0"
        : blockingReasons.some((reason) => /goal_satisfaction|post_observation|typed_failure/.test(reason))
          ? "p1"
          : "p2";
  return {
    schema: "helix.runtime_authority_boundary_report.v1",
    source_capability_diagnostic_turn: runtimeBoundTurn,
    requires_runtime_loop: requiresRuntimeLoop,
    terminal_kind: terminalKind,
    final_answer_source: finalAnswerSource,
    checks,
    eligible,
    severity,
    blocking_reasons: blockingReasons,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function assertTerminalBoundaryEligible(payload: Record<string, unknown>): HelixRuntimeAuthorityBoundaryReport {
  return evaluateTerminalBoundaryEligibility(payload);
}
