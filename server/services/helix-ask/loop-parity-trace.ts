import crypto from "node:crypto";

type RecordLike = Record<string, unknown>;

export type HelixLoopParityTrace = {
  schema: "helix.loop_parity_trace.v1";
  trace_id: string;
  turn_id: string;
  prompt_hash: string;
  source_target_intent: {
    target_source: string;
    target_kind: string;
    strength: string;
    must_enter_backend_ask: boolean;
    allow_client_shortcut: boolean;
    allow_no_tool_direct: boolean;
  } | null;
  selected_route: string;
  route_candidates: Array<{
    route: string;
    reason: string;
    admitted: boolean;
    rejected_reason?: string;
  }>;
  codex_owned_touched: string[];
  helix_owned_touched: string[];
  admitted_tool_families: string[];
  actual_tool_calls: Array<{
    tool_id: string;
    family: string;
    admitted: boolean;
    mutating: boolean;
    result_ref?: string;
  }>;
  unexpected_tool_calls: string[];
  observations_created: Array<{
    observation_id: string;
    source_kind: string;
    source_id: string;
    provenance: string;
    freshness_ms?: number;
    content_role: "evidence_not_assistant_answer" | "observation_not_assistant_answer";
  }>;
  evidence_selected_for_answer: string[];
  evidence_rejected_for_answer: Array<{
    ref: string;
    reason: string;
  }>;
  tool_results_returned_to_turn: boolean;
  post_observation_finalizer_ran: boolean;
  followup_reasoning_ran: boolean | "not_applicable";
  terminal_selection_ran_after_observations: boolean;
  terminal_artifact_kind: string;
  final_answer_source: string;
  route_authority_audit_ref: string | null;
  route_authority_ok: boolean;
  poison_audit_ok: boolean;
  terminal_authority_ok: boolean;
  short_circuit_risk_flags: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const inferToolFamily = (toolId: string): string => {
  if (/^live_env\./i.test(toolId)) return "live_environment";
  if (/^situation-room\.live-source\.|^situation-room\.pipeline\./i.test(toolId)) return "live_pipeline";
  if (/workspace[_-]?os|workspace_diagnostic/i.test(toolId)) return "workspace_diagnostic";
  if (/workspace[-_.]?directory/i.test(toolId)) return "workspace_directory";
  if (/situation[-_. ]?run|situation-room\.(?:attach|repair|replay|source-binding)/i.test(toolId)) return "situation_run";
  if (/^docs-viewer\.|doc[_-]?viewer|docs_viewer/i.test(toolId)) return "docs_viewer";
  if (/calculator/i.test(toolId)) return "calculator";
  if (/workstation-notes|note/i.test(toolId)) return "notes";
  if (/process[-_. ]?graph|workstation\.process/i.test(toolId)) return "process_graph";
  if (/repo|code|source-tree/i.test(toolId)) return "repo_code";
  if (/minecraft|world/i.test(toolId)) return "world_event";
  if (/click|open|close|panel|workspace-action|workspace_action/i.test(toolId)) return "workstation_action";
  return "unknown";
};

const isMutatingTool = (toolId: string): boolean =>
  /(?:^|[-_.:])(?:set|start|stop|open|close|click|repair|attach|adopt|refresh|run|write|create|delete|update)(?:$|[-_.:])/i.test(toolId);

const collectRouteCandidates = (payload: RecordLike, selectedRoute: string): HelixLoopParityTrace["route_candidates"] => {
  const preflight = readRecord(payload.ask_turn_preflight_context);
  const routeCandidates = Array.isArray(preflight?.route_candidates) ? preflight.route_candidates : [];
  const admitted = routeCandidates
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      route: readString(entry.route) || "unknown",
      reason: readString(entry.reason) || "route_candidate",
      admitted: (readString(entry.route) || "unknown") === selectedRoute,
    }));
  const routeHistory = readRecord(payload.route_history_debug);
  const rejected = Array.isArray(routeHistory?.rejected_route_candidates) ? routeHistory.rejected_route_candidates : [];
  return [
    ...admitted,
    ...rejected
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry))
      .map((entry) => ({
        route: readString(entry.route) || "unknown",
        reason: readString(entry.reason) || "route_rejected",
        admitted: false,
        rejected_reason: readString(entry.reason) || "route_rejected",
      })),
  ];
};

const pushToolCall = (
  calls: Map<string, HelixLoopParityTrace["actual_tool_calls"][number]>,
  toolId: string,
  admittedFamilies: Set<string>,
  resultRef?: string,
): void => {
  const normalized = toolId.trim();
  if (!normalized) return;
  const family = inferToolFamily(normalized);
  const admitted = admittedFamilies.has(family);
  const existing = calls.get(normalized);
  calls.set(normalized, {
    tool_id: normalized,
    family,
    admitted,
    mutating: isMutatingTool(normalized),
    result_ref: resultRef ?? existing?.result_ref,
  });
};

const collectActualToolCalls = (payload: RecordLike, admittedToolFamilies: string[]): HelixLoopParityTrace["actual_tool_calls"] => {
  const admittedFamilies = new Set(admittedToolFamilies);
  const calls = new Map<string, HelixLoopParityTrace["actual_tool_calls"][number]>();
  const workspaceReceipt = readRecord(payload.workspace_action_receipt);
  pushToolCall(calls, readString(workspaceReceipt?.action_id) || readString(workspaceReceipt?.action_key), admittedFamilies, readString(workspaceReceipt?.receipt_id));
  const liveReceipt = readRecord(payload.live_pipeline_turn_receipt) ?? readRecord(payload.live_source_pipeline_receipt);
  pushToolCall(calls, readString(liveReceipt?.action_id), admittedFamilies, readString(liveReceipt?.pipeline_receipt_id) || readString(liveReceipt?.receipt_id));
  for (const action of readStringArray(liveReceipt?.actions)) {
    pushToolCall(calls, action, admittedFamilies, readString(liveReceipt?.pipeline_receipt_id) || readString(liveReceipt?.receipt_id));
  }
  const ledger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  for (const artifact of ledger) {
    const artifactRecord = readRecord(artifact);
    const artifactPayload = readRecord(artifactRecord?.payload);
    const resultRef = readString(artifactRecord?.artifact_id) || readString(artifactPayload?.receipt_id);
    if (artifactRecord?.kind === "dynamic_tool_call") {
      for (const toolId of readStringArray(artifactPayload?.tool_ids)) {
        pushToolCall(calls, toolId, admittedFamilies, resultRef);
      }
    }
    pushToolCall(calls, readString(artifactPayload?.capability_key), admittedFamilies, resultRef);
    pushToolCall(calls, readString(artifactPayload?.action_id) || readString(artifactPayload?.action_key), admittedFamilies, resultRef);
    for (const action of readStringArray(artifactPayload?.actions)) {
      pushToolCall(calls, action, admittedFamilies, resultRef);
    }
  }
  return Array.from(calls.values());
};

const collectObservationRefs = (selection: RecordLike | null): { selected: string[]; rejected: HelixLoopParityTrace["evidence_rejected_for_answer"] } => {
  if (!selection) return { selected: [], rejected: [] };
  const selected = unique([
    ...readStringArray(selection.selected_observation_refs),
    ...readStringArray(selection.selected_field_evaluation_refs),
    ...readStringArray(selection.selected_interpretation_run_refs),
    ...readStringArray(selection.selected_interpretation_worker_run_refs),
    ...readStringArray(selection.selected_interpretation_hypothesis_refs),
    ...readStringArray(selection.selected_interpretation_graph_refs),
    ...readStringArray(selection.selected_probe_result_refs),
    ...readStringArray(selection.selected_epoch_closure_refs),
    ...readStringArray(selection.selected_source_descriptor_refs),
  ]);
  const rejected = readStringArray(selection.rejected_unbound_source_refs).map((ref) => ({
    ref,
    reason: "rejected_unbound_source",
  }));
  return { selected, rejected };
};

const collectObservationsCreated = (payload: RecordLike): HelixLoopParityTrace["observations_created"] => {
  const observations = new Map<string, HelixLoopParityTrace["observations_created"][number]>();
  const addObservation = (ref: string, sourceKind = "unknown", sourceId = "unknown", provenance = "payload"): void => {
    const observationId = ref.trim();
    if (!observationId || observations.has(observationId)) return;
    observations.set(observationId, {
      observation_id: observationId,
      source_kind: sourceKind,
      source_id: sourceId,
      provenance,
      content_role: "evidence_not_assistant_answer",
    });
  };
  const activeContext = readRecord(payload.active_situation_context);
  for (const ref of readStringArray(activeContext?.latest_observation_refs)) {
    addObservation(ref, readString(activeContext?.active_modalities) || "visual_frame", readString(activeContext?.environment_id) || "unknown", "active_situation_context");
  }
  const selection = readRecord(payload.situation_evidence_selection);
  for (const ref of readStringArray(selection?.selected_observation_refs)) {
    addObservation(ref, "selected_observation", readString(selection?.situation_run_id) || "unknown", "situation_evidence_selection");
  }
  const ledger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  for (const artifact of ledger) {
    const artifactPayload = readRecord(readRecord(artifact)?.payload);
    for (const ref of readStringArray(artifactPayload?.latest_observation_refs)) {
      addObservation(ref, readString(artifactPayload?.source_kind) || "unknown", readString(artifactPayload?.source_id) || "unknown", "artifact_ledger");
    }
    for (const ref of readStringArray(artifactPayload?.included_observation_refs)) {
      addObservation(ref, readString(artifactPayload?.source_kind) || "unknown", readString(artifactPayload?.source_id) || "unknown", "artifact_ledger");
    }
  }
  return Array.from(observations.values());
};

const collectRejectedEvidence = (payload: RecordLike, selectionRejected: HelixLoopParityTrace["evidence_rejected_for_answer"]): HelixLoopParityTrace["evidence_rejected_for_answer"] => {
  const rejected = [...selectionRejected];
  const liveWindow = readRecord(payload.live_context_window_binding);
  const excluded = Array.isArray(liveWindow?.excluded_observation_refs) ? liveWindow.excluded_observation_refs : [];
  for (const entry of excluded) {
    if (typeof entry === "string") {
      rejected.push({ ref: entry, reason: "excluded_observation" });
      continue;
    }
    const record = readRecord(entry);
    if (record) rejected.push({ ref: readString(record.ref) || "unknown", reason: readString(record.reason) || "excluded_observation" });
  }
  return rejected;
};

const collectHelixOwnedTouched = (payload: RecordLike): string[] =>
  unique([
    readRecord(payload.source_target_intent) ? "source_target_admission" : "",
    readRecord(payload.situation_evidence_selection) || readRecord(payload.active_situation_context) ? "evidence_normalization" : "",
    readRecord(payload.route_product_contract) ? "route_product_contract" : "",
    readRecord(payload.product_authority_guard) ? "proof_gate" : "",
    readRecord(payload.route_authority_audit) ? "route_authority_audit" : "",
    readRecord(payload.terminal_artifact_selection_guard) || readRecord(payload.product_authority_guard) ? "terminal_eligibility" : "",
    readRecord(payload.terminal_presentation) ? "presentation" : "",
  ].filter(Boolean));

const collectCodexOwnedTouched = (actualToolCalls: HelixLoopParityTrace["actual_tool_calls"]): string[] =>
  unique([
    actualToolCalls.length > 0 ? "tool_execution" : "",
    actualToolCalls.length > 0 ? "tool_result_events" : "",
    "terminal_completion",
  ].filter(Boolean));

export function buildLoopParityTrace(input: {
  turnId: string;
  promptText: string;
  selectedRoute: string;
  terminalArtifactKind: string | null | undefined;
  finalAnswerSource: string | null | undefined;
  payload: RecordLike;
}): HelixLoopParityTrace {
  const payload = input.payload;
  const sourceTargetIntentRecord = readRecord(payload.source_target_intent);
  const sourceTargetIntent = sourceTargetIntentRecord
    ? {
        target_source: readString(sourceTargetIntentRecord.target_source) || "unknown",
        target_kind: readString(sourceTargetIntentRecord.target_kind) || "unknown",
        strength: readString(sourceTargetIntentRecord.strength) || "unknown",
        must_enter_backend_ask: readBoolean(sourceTargetIntentRecord.must_enter_backend_ask),
        allow_client_shortcut: readBoolean(sourceTargetIntentRecord.allow_client_shortcut),
        allow_no_tool_direct: readBoolean(sourceTargetIntentRecord.allow_no_tool_direct),
      }
    : null;
  const admission = readRecord(payload.tool_call_admission_decision);
  const admittedToolFamilies = readStringArray(admission?.admitted_tool_families);
  const actualToolCalls = collectActualToolCalls(payload, admittedToolFamilies);
  const unexpectedToolCalls = actualToolCalls.filter((call) => !call.admitted).map((call) => call.tool_id);
  const selection = readRecord(payload.situation_evidence_selection);
  const evidence = collectObservationRefs(selection);
  const evidenceRejectedForAnswer = collectRejectedEvidence(payload, evidence.rejected);
  const observationsCreated = collectObservationsCreated(payload);
  const terminalArtifactKind = readString(input.terminalArtifactKind) || "unknown";
  const finalAnswerSource = readString(input.finalAnswerSource) || "unknown";
  const routeAuthorityAudit = readRecord(payload.route_authority_audit);
  const routeProductContract = readRecord(payload.route_product_contract);
  const terminalSelectionGuard = readRecord(payload.terminal_artifact_selection_guard);
  const productAuthorityGuard = readRecord(payload.product_authority_guard);
  const poisonAudit = readRecord(payload.poison_audit);
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const allowedTerminalKinds = readStringArray(routeProductContract?.allowed_terminal_artifact_kinds);
  const forbiddenTerminalKinds = readStringArray(routeProductContract?.forbidden_terminal_artifact_kinds);
  const calculatorContractAuthorityOk =
    !routeAuthorityAudit &&
    sourceTargetIntent?.target_source === "calculator_stream" &&
    readString(routeProductContract?.schema) === "helix.route_product_contract.v1" &&
    terminalSelectionGuard?.allowed !== false &&
    productAuthorityGuard?.allowed !== false &&
    !forbiddenTerminalKinds.includes(terminalArtifactKind) &&
    (allowedTerminalKinds.length === 0 || allowedTerminalKinds.includes(terminalArtifactKind));
  const routeAuthorityOk = routeAuthorityAudit?.route_authority_ok === true || calculatorContractAuthorityOk;
  const terminalAuthorityOk = terminalAuthority?.server_authoritative === true;
  const poisonViolations = Array.isArray(poisonAudit?.violations)
    ? poisonAudit.violations
        .map((entry) => readRecord(entry))
        .filter((entry): entry is RecordLike => Boolean(entry))
    : [];
  const onlyStaleContractPoison =
    poisonViolations.length > 0 &&
    poisonViolations.every((entry) => readString(entry.kind) === "terminal_artifact_forbidden_by_route_contract");
  const poisonAuditOk =
    poisonAudit?.ok === true ||
    (routeAuthorityOk && terminalAuthorityOk && onlyStaleContractPoison);
  const terminalSelectionRan = Boolean(readRecord(payload.terminal_artifact_selection_guard) || readRecord(payload.product_authority_guard) || routeAuthorityAudit);
  const postObservationFinalizerRan = Boolean(readRecord(payload.terminal_presentation) || terminalSelectionRan);
  const modelOnlySourceTarget =
    sourceTargetIntent?.target_source === "model_only" ||
    sourceTargetIntent?.target_kind === "general_background" ||
    readString(readRecord(payload.canonical_goal_frame)?.goal_kind) === "model_only_concept";
  const routeContractMissing =
    Boolean(sourceTargetIntent && sourceTargetIntent.strength === "hard" && !modelOnlySourceTarget) &&
    !readRecord(payload.route_product_contract);
  const violationCodes = readStringArray(routeAuthorityAudit?.violation_codes);
  const shortCircuitRiskFlags = unique([
    sourceTargetIntent && sourceTargetIntent.strength === "hard" && !modelOnlySourceTarget && evidence.selected.length === 0 && !/typed_failure|receipt|tool_evaluation|workstation_tool_evaluation/i.test(terminalArtifactKind)
      ? "classifier_selected_terminal_without_evidence"
      : "",
    violationCodes.includes("receipt_used_as_content_answer") ? "receipt_promoted_to_answer" : "",
    /client_projection|panel_generated_answer|live_card_projection/i.test(`${terminalArtifactKind} ${finalAnswerSource}`) ? "projection_promoted_to_answer" : "",
    unexpectedToolCalls.length > 0 ? "tool_called_without_admission" : "",
    sourceTargetIntent && sourceTargetIntent.strength === "hard" && !modelOnlySourceTarget && (sourceTargetIntent.allow_no_tool_direct || terminalArtifactKind === "no_tool_direct")
      ? "hard_source_target_allowed_no_tool_direct"
      : "",
    routeContractMissing ? "route_contract_missing" : "",
    !routeAuthorityAudit && !calculatorContractAuthorityOk ? "route_authority_missing" : "",
    poisonAuditOk && routeAuthorityAudit && !routeAuthorityOk ? "poison_clean_but_authority_failed" : "",
    observationsCreated.length > 0 && !postObservationFinalizerRan ? "observations_created_but_not_reentered" : "",
    terminalArtifactKind !== "unknown" && !terminalSelectionRan ? "terminal_selected_before_observation_finalizer" : "",
  ].filter(Boolean));

  return {
    schema: "helix.loop_parity_trace.v1",
    trace_id: `loop-parity:${hashShort([input.turnId, input.promptText, input.selectedRoute, terminalArtifactKind])}`,
    turn_id: input.turnId,
    prompt_hash: hashShort(input.promptText),
    source_target_intent: sourceTargetIntent,
    selected_route: input.selectedRoute,
    route_candidates: collectRouteCandidates(payload, input.selectedRoute),
    codex_owned_touched: collectCodexOwnedTouched(actualToolCalls),
    helix_owned_touched: collectHelixOwnedTouched(payload),
    admitted_tool_families: admittedToolFamilies,
    actual_tool_calls: actualToolCalls,
    unexpected_tool_calls: unexpectedToolCalls,
    observations_created: observationsCreated,
    evidence_selected_for_answer: evidence.selected,
    evidence_rejected_for_answer: evidenceRejectedForAnswer,
    tool_results_returned_to_turn: actualToolCalls.length === 0 || Boolean(readRecord(payload.workspace_action_receipt) || readRecord(payload.live_pipeline_turn_receipt) || readRecord(payload.live_source_pipeline_receipt)),
    post_observation_finalizer_ran: postObservationFinalizerRan,
    followup_reasoning_ran: Array.isArray(payload.current_turn_artifact_ledger) && payload.current_turn_artifact_ledger.some((artifact) => readRecord(artifact)?.kind === "reasoning_context")
      ? true
      : "not_applicable",
    terminal_selection_ran_after_observations: terminalSelectionRan,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    route_authority_audit_ref: readString(routeAuthorityAudit?.audit_id) || null,
    route_authority_ok: routeAuthorityOk,
    poison_audit_ok: poisonAuditOk,
    terminal_authority_ok: terminalAuthorityOk,
    short_circuit_risk_flags: shortCircuitRiskFlags,
    assistant_answer: false,
    raw_content_included: false,
  };
}
