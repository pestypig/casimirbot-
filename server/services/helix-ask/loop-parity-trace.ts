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
  rejected_tool_calls: Array<{
    tool_id: string;
    family: string;
    call_id: string;
    reason: string;
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
  if (/helix_ask\.inspect_capability_catalog|inspect_capability_catalog|capability[_-]?catalog|capability[_-]?registry/i.test(toolId)) return "capability_catalog";
  if (/scholarly[-_.]?research|lookup[_-]?papers|fetch[_-]?full[_-]?text|semantic[-_.]?scholar|openalex|pubmed|crossref/i.test(toolId)) return "scholarly_research";
  if (/theory[-_.]?locator|reflect[_-]?theory[_-]?context|theory[_-]?context[_-]?reflection|badge[_-]?graph|frontierVectorFieldTrace|frontier[_-]?vector[_-]?field|relation[_-]?tensor/i.test(toolId)) return "theory_locator";
  if (/internet[-_.]?search|web[-_.]?research|web\.search/i.test(toolId)) return "internet_search";
  if (/^live_env\./i.test(toolId)) return "live_environment";
  if (/^situation-room\.live-source\.|^situation-room\.pipeline\./i.test(toolId)) return "live_pipeline";
  if (/workspace[_-]?os|workspace_diagnostic/i.test(toolId)) return "workspace_diagnostic";
  if (/workspace[-_.]?directory/i.test(toolId)) return "workspace_directory";
  if (/situation[-_. ]?run|situation-room\.(?:attach|repair|replay|source-binding)/i.test(toolId)) return "situation_run";
  if (/^docs-viewer\.|doc[_-]?viewer|docs_viewer/i.test(toolId)) return "docs_viewer";
  if (/calculator|^solve_expression$/i.test(toolId)) return "calculator";
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

const isAdmissionDeniedValidation = (validation: RecordLike | null): boolean => {
  if (!validation || validation.valid === true) return false;
  const errors = readStringArray(validation.errors);
  return errors.some((error) =>
    /forbidden_capability_for_goal|runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy|contextual_tool_reference_suppressed|capability_permission_denied|capability_not_available/i.test(error),
  );
};

const canonicalToolIdForArtifactContext = (
  toolId: string,
  artifactRecord: RecordLike | null,
  artifactPayload: RecordLike | null,
): string => {
  const normalized = toolId.trim();
  if (!normalized) return "";
  const haystack = [
    normalized,
    readString(artifactRecord?.kind),
    readString(artifactRecord?.artifact_id),
    readString(artifactPayload?.kind),
    readString(artifactPayload?.schema),
    readString(artifactPayload?.trace_source),
    readString(artifactPayload?.source_kind),
    readString(artifactPayload?.receipt_id),
    readString(artifactPayload?.result_ref),
  ].join(" ");
  if (/^solve_expression$/i.test(normalized) && /calculator|scientific[-_.:]calculator/i.test(haystack)) {
    return "scientific-calculator.solve_expression";
  }
  return normalized;
};

const collectRejectedToolCalls = (payload: RecordLike): HelixLoopParityTrace["rejected_tool_calls"] => {
  const rejected = new Map<string, HelixLoopParityTrace["rejected_tool_calls"][number]>();
  const ledger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  for (const artifact of ledger) {
    const artifactRecord = readRecord(artifact);
    if (readString(artifactRecord?.kind) !== "runtime_tool_call_validation") continue;
    const artifactPayload = readRecord(artifactRecord?.payload);
    if (!isAdmissionDeniedValidation(artifactPayload)) continue;
    const toolId = readString(artifactPayload?.capability_key);
    const callId = readString(artifactPayload?.call_id) || toolId || readString(artifactRecord?.artifact_id);
    if (!toolId || !callId) continue;
    const reason = readStringArray(artifactPayload?.errors).join("; ") || "admission_denied";
    rejected.set(`${callId}:${toolId}`, {
      tool_id: toolId,
      family: inferToolFamily(toolId),
      call_id: callId,
      reason,
      result_ref: readString(artifactRecord?.artifact_id) || `${callId}:runtime_tool_call_validation`,
    });
  }
  return Array.from(rejected.values());
};

const collectActualToolCalls = (
  payload: RecordLike,
  admittedToolFamilies: string[],
  rejectedToolCalls: HelixLoopParityTrace["rejected_tool_calls"],
): HelixLoopParityTrace["actual_tool_calls"] => {
  const admittedFamilies = new Set(admittedToolFamilies);
  const rejectedCallIds = new Set(rejectedToolCalls.map((call) => call.call_id).filter(Boolean));
  const rejectedToolIds = new Set(rejectedToolCalls.map((call) => call.tool_id).filter(Boolean));
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
    const callId = readString(artifactPayload?.call_id);
    const capabilityKey = readString(artifactPayload?.capability_key);
    if (
      rejectedCallIds.has(callId) ||
      (capabilityKey && rejectedToolIds.has(capabilityKey) && /runtime_tool_call|runtime_tool_call_validation|runtime_tool_observation/i.test(readString(artifactRecord?.kind)))
    ) {
      continue;
    }
    const resultRef = readString(artifactRecord?.artifact_id) || readString(artifactPayload?.receipt_id);
    if (artifactRecord?.kind === "dynamic_tool_call") {
      for (const toolId of readStringArray(artifactPayload?.tool_ids)) {
        pushToolCall(calls, toolId, admittedFamilies, resultRef);
      }
    }
    pushToolCall(calls, readString(artifactPayload?.capability_key), admittedFamilies, resultRef);
    const artifactActionToolId = canonicalToolIdForArtifactContext(
      readString(artifactPayload?.action_id) || readString(artifactPayload?.action_key),
      artifactRecord,
      artifactPayload,
    );
    pushToolCall(calls, artifactActionToolId, admittedFamilies, resultRef);
    for (const action of readStringArray(artifactPayload?.actions)) {
      pushToolCall(calls, canonicalToolIdForArtifactContext(action, artifactRecord, artifactPayload), admittedFamilies, resultRef);
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

const collectSelectedEvidencePackRefs = (payload: RecordLike): string[] => {
  const pack = readRecord(payload.selected_evidence_pack);
  return unique([
    ...readStringArray(pack?.selected_evidence_ids),
    ...readStringArray(pack?.selected_validation_refs),
    ...readStringArray(pack?.selected_tool_receipts),
    ...readStringArray(pack?.selected_memory_refs),
    ...readStringArray(pack?.conversation_memory_refs),
  ]);
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
    const artifactRecord = readRecord(artifact);
    const artifactPayload = readRecord(artifactRecord?.payload);
    const artifactKind =
      readString(artifactRecord?.kind) ||
      readString(artifactPayload?.kind) ||
      readString(artifactPayload?.artifactId) ||
      readString(artifactPayload?.artifact_id);
    const artifactSchema = readString(artifactPayload?.schema) || readString(artifactPayload?.schemaVersion);
    const artifactText = [artifactKind, artifactSchema].filter(Boolean).join(" ");
    const observationLike =
      /observation|receipt|search_results|candidate_validation|open_receipt|latest_doc_selection|active_doc_path/i.test(artifactText);
    if (observationLike) {
      const ref =
        readString(artifactRecord?.artifact_id) ||
        readString(artifactPayload?.artifact_id) ||
        readString(artifactPayload?.observation_id) ||
        readString(artifactPayload?.receipt_id) ||
        readString(artifactPayload?.call_id) ||
        readString(artifactPayload?.path) ||
        artifactKind;
      addObservation(
        ref,
        artifactKind || "artifact_observation",
        readString(artifactPayload?.source_id) || readString(artifactPayload?.call_id) || "current_turn",
        "artifact_ledger",
      );
    }
    for (const ref of readStringArray(artifactPayload?.latest_observation_refs)) {
      addObservation(ref, readString(artifactPayload?.source_kind) || "unknown", readString(artifactPayload?.source_id) || "unknown", "artifact_ledger");
    }
    for (const ref of readStringArray(artifactPayload?.included_observation_refs)) {
      addObservation(ref, readString(artifactPayload?.source_kind) || "unknown", readString(artifactPayload?.source_id) || "unknown", "artifact_ledger");
    }
  }
  return Array.from(observations.values());
};

const toolResultsReturnedToTurn = (payload: RecordLike, actualToolCalls: HelixLoopParityTrace["actual_tool_calls"], observationsCreated: HelixLoopParityTrace["observations_created"]): boolean => {
  if (actualToolCalls.length === 0) return true;
  if (observationsCreated.length > 0) return true;
  if (readRecord(payload.workspace_action_receipt) || readRecord(payload.live_pipeline_turn_receipt) || readRecord(payload.live_source_pipeline_receipt)) return true;
  const ledger = Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [];
  return ledger
    .map((entry) => readRecord(entry))
    .some((entry) => {
      const payloadRecord = readRecord(entry?.payload);
      const kindText = [
        readString(entry?.kind),
        readString(payloadRecord?.kind),
        readString(payloadRecord?.schema),
        readString(payloadRecord?.schemaVersion),
      ].filter(Boolean).join(" ");
      return /runtime_tool_observation|agent_step_observation_packet|receipt|search_results|candidate_validation|open_receipt/i.test(kindText);
    });
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
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const policyAdmittedCapability = readString(operationalTrace?.policy_admitted_capability);
  const admittedToolFamilies = unique([
    ...readStringArray(admission?.admitted_tool_families),
    policyAdmittedCapability ? inferToolFamily(policyAdmittedCapability) : "",
  ].filter(Boolean));
  const rejectedToolCalls = collectRejectedToolCalls(payload);
  const actualToolCalls = collectActualToolCalls(payload, admittedToolFamilies, rejectedToolCalls);
  const unexpectedToolCalls = actualToolCalls.filter((call) => !call.admitted).map((call) => call.tool_id);
  const selection = readRecord(payload.situation_evidence_selection);
  const evidence = collectObservationRefs(selection);
  const selectedEvidencePackRefs = collectSelectedEvidencePackRefs(payload);
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
    rejected_tool_calls: rejectedToolCalls,
    unexpected_tool_calls: unexpectedToolCalls,
    observations_created: observationsCreated,
    evidence_selected_for_answer: unique([...evidence.selected, ...selectedEvidencePackRefs]),
    evidence_rejected_for_answer: evidenceRejectedForAnswer,
    tool_results_returned_to_turn: toolResultsReturnedToTurn(payload, actualToolCalls, observationsCreated),
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
