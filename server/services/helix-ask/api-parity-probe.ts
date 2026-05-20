import type { HelixApiParityExpected, HelixApiParityScenario } from "./api-parity-matrix";

type RecordLike = Record<string, unknown>;

export type HelixApiParityProbeResult = {
  schema: "helix.api_parity_probe_result.v1";
  scenario_id: string;
  prompt: string;
  non_stream_turn_id: string;
  stream_turn_id?: string;
  debug_export_available: boolean;
  terminal_event_seen: boolean;
  stream_closed_after_terminal: boolean;
  source_target: string | null;
  target_kind: string | null;
  selected_route: string | null;
  terminal_artifact_kind: string | null;
  final_answer_source: string | null;
  loop_parity_trace: {
    admitted_tool_families: string[];
    actual_tool_calls: string[];
    unexpected_tool_calls: string[];
    observations_created_count: number;
    evidence_selected_for_answer_count: number;
    short_circuit_risk_flags: string[];
  };
  ask_turn_solver_trace: {
    present: boolean;
    completed_solver_path: boolean;
    prompt_shape: string | null;
    selected_primary_intent: string | null;
    primary_intent_route: string | null;
    contextual_tool_mentions: string[];
    executable_operator_commands_count: number;
    solver_short_circuit_flags: string[];
    live_source_identity_diagnosis: string | null;
    live_source_identity_ok: boolean | null;
  };
  capability_selection: {
    capability_id: string | null;
    selected_capabilities: string[];
  };
  route_authority: {
    ok: boolean;
    primary_violation_code: string | null;
    violation_codes: string[];
  };
  poison_audit_ok: boolean;
  terminal_authority_ok: boolean;
  procedural_ok: boolean;
  failures: string[];
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current: unknown, key: string) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as RecordLike)[key];
  }, value);

export const extractHelixDebugPayload = (debugExport: unknown): RecordLike | null => {
  const debugRecord = readRecord(debugExport);
  const payload = readRecord(debugRecord?.payload);
  return payload ?? debugRecord;
};

const readSourceTarget = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.source_target_intent) ??
  readRecord(debug?.source_target_intent) ??
  readRecord(getPath(debug, ["ask_turn_preflight_context", "source_target_intent"]));

const readLoopTrace = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.loop_parity_trace) ?? readRecord(debug?.loop_parity_trace);

const readSolverTrace = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.ask_turn_solver_trace) ?? readRecord(debug?.ask_turn_solver_trace);

const readLiveSourceIdentityAudit = (ask: RecordLike, debug: RecordLike | null, solverTrace: RecordLike | null): RecordLike | null =>
  readRecord(ask.live_source_identity_audit) ??
  readRecord(debug?.live_source_identity_audit) ??
  readRecord(solverTrace?.live_source_identity_audit);

const readRouteAuthority = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.route_authority_audit) ?? readRecord(debug?.route_authority_audit);

const readPoisonAudit = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.poison_audit) ?? readRecord(debug?.poison_audit);

const readTerminalAuthority = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.terminal_answer_authority) ?? readRecord(debug?.terminal_answer_authority);

const readCapabilitySelectionResult = (ask: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.capability_selection_result) ?? readRecord(debug?.capability_selection_result);

const readCapabilitySelectionTrace = (ask: RecordLike, debug: RecordLike | null): RecordLike[] =>
  (Array.isArray(ask.capability_selection_trace)
    ? ask.capability_selection_trace
    : Array.isArray(debug?.capability_selection_trace)
      ? debug?.capability_selection_trace
      : [])
    .map((entry: unknown) => readRecord(entry))
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));

const readActualToolIds = (loopTrace: RecordLike | null): string[] =>
  (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry: unknown) => readRecord(entry))
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry))
    .map((entry: RecordLike) => readString(entry.tool_id))
    .filter((entry: string | null): entry is string => Boolean(entry));

const actualToolCalls = (loopTrace: RecordLike | null): RecordLike[] =>
  (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry: unknown) => readRecord(entry))
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));

const readContextualToolMentionCues = (solverTrace: RecordLike | null): string[] =>
  (Array.isArray(getPath(solverTrace, ["prompt_interpretation", "contextual_tool_mentions"]))
    ? (getPath(solverTrace, ["prompt_interpretation", "contextual_tool_mentions"]) as unknown[])
    : [])
    .map((entry: unknown) => readRecord(entry))
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry))
    .map((entry: RecordLike) => `${readString(entry.verb_or_cue) ?? ""} ${readString(entry.text) ?? ""}`.trim())
    .filter(Boolean);

const readExecutableOperatorCommandCount = (solverTrace: RecordLike | null): number =>
  Array.isArray(getPath(solverTrace, ["prompt_interpretation", "executable_operator_commands"]))
    ? (getPath(solverTrace, ["prompt_interpretation", "executable_operator_commands"]) as unknown[]).length
    : 0;

const addExpectationFailures = (input: {
  failures: string[];
  expected: HelixApiParityExpected;
  sourceTarget: string | null;
  targetKind: string | null;
  selectedRoute: string | null;
  terminalArtifactKind: string | null;
  finalAnswerSource: string | null;
  loopTrace: RecordLike | null;
  solverTrace: RecordLike | null;
  selectedCapabilities: string[];
}): void => {
  const {
    failures,
    expected,
    sourceTarget,
    targetKind,
    selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    loopTrace,
    solverTrace,
    selectedCapabilities,
  } = input;
  if (expected.source_target && sourceTarget !== expected.source_target) {
    failures.push(`source_target_mismatch:${sourceTarget ?? "missing"}!=${expected.source_target}`);
  }
  if (expected.target_kind && targetKind !== expected.target_kind) {
    failures.push(`target_kind_mismatch:${targetKind ?? "missing"}!=${expected.target_kind}`);
  }
  if (expected.terminal_artifact_kind && terminalArtifactKind !== expected.terminal_artifact_kind) {
    failures.push(`terminal_artifact_mismatch:${terminalArtifactKind ?? "missing"}!=${expected.terminal_artifact_kind}`);
  }
  for (const route of expected.forbidden_routes ?? []) {
    if (selectedRoute === route) failures.push(`forbidden_route_selected:${route}`);
  }
  for (const artifact of expected.forbidden_terminal_artifacts ?? []) {
    if (terminalArtifactKind === artifact || finalAnswerSource === artifact) {
      failures.push(`forbidden_terminal_artifact:${artifact}`);
    }
  }
  const actualIds = readActualToolIds(loopTrace);
  const actualJson = JSON.stringify(actualToolCalls(loopTrace));
  for (const tool of expected.forbidden_tool_calls ?? []) {
    if (actualIds.includes(tool) || actualJson.includes(tool)) failures.push(`forbidden_tool_call:${tool}`);
  }
  for (const tool of expected.allowed_tool_calls ?? []) {
    if (!actualIds.includes(tool) && !actualJson.includes(tool)) failures.push(`required_allowed_tool_call_missing:${tool}`);
  }
  for (const family of expected.forbidden_tool_families ?? []) {
    if (actualToolCalls(loopTrace).some((call: RecordLike) => readString(call.family) === family)) {
      failures.push(`forbidden_tool_family:${family}`);
    }
  }
  for (const capabilityId of expected.forbidden_capability_ids ?? []) {
    if (selectedCapabilities.includes(capabilityId)) failures.push(`forbidden_capability_selected:${capabilityId}`);
  }
  const selectedPrimaryIntent = readString(solverTrace?.selected_primary_intent);
  if (expected.selected_primary_intent && selectedPrimaryIntent !== expected.selected_primary_intent) {
    failures.push(`selected_primary_intent_mismatch:${selectedPrimaryIntent ?? "missing"}!=${expected.selected_primary_intent}`);
  }
  const contextualMentions = readContextualToolMentionCues(solverTrace);
  for (const cue of expected.required_contextual_tool_mentions ?? []) {
    if (!contextualMentions.some((mention) => mention.toLowerCase().includes(cue.toLowerCase()))) {
      failures.push(`contextual_tool_mention_missing:${cue}`);
    }
  }
  if (
    typeof expected.executable_operator_commands_count === "number" &&
    readExecutableOperatorCommandCount(solverTrace) !== expected.executable_operator_commands_count
  ) {
    failures.push(`executable_operator_commands_count_mismatch:${readExecutableOperatorCommandCount(solverTrace)}!=${expected.executable_operator_commands_count}`);
  }
  const flags = readStringArray(loopTrace?.short_circuit_risk_flags);
  for (const flag of [...(expected.required_trace_flags_absent ?? []), ...(expected.forbidden_trace_flags ?? [])]) {
    if (flags.includes(flag)) failures.push(`forbidden_trace_flag:${flag}`);
  }
};

export function buildApiParityProbeResult(input: {
  scenario: HelixApiParityScenario;
  askTurn: unknown;
  debugExport?: unknown;
  streamTurn?: unknown;
  terminalEventSeen?: boolean;
  streamClosedAfterTerminal?: boolean;
}): HelixApiParityProbeResult {
  const ask = readRecord(input.askTurn) ?? {};
  const debug = extractHelixDebugPayload(input.debugExport);
  const loopTrace = readLoopTrace(ask, debug);
  const solverTrace = readSolverTrace(ask, debug);
  const liveSourceIdentityAudit = readLiveSourceIdentityAudit(ask, debug, solverTrace);
  const routeAuthority = readRouteAuthority(ask, debug);
  const poisonAudit = readPoisonAudit(ask, debug);
  const terminalAuthority = readTerminalAuthority(ask, debug);
  const capabilitySelectionResult = readCapabilitySelectionResult(ask, debug);
  const selectedCapabilities = [
    readString(capabilitySelectionResult?.capability_id),
    ...readCapabilitySelectionTrace(ask, debug).map((entry) => readString(entry.selected_capability)),
  ].filter((entry: string | null): entry is string => Boolean(entry));
  const sourceTargetIntent = readSourceTarget(ask, debug);
  const terminalArtifactKind =
    readString(ask.terminal_artifact_kind) ??
    readString(debug?.terminal_artifact_kind) ??
    readString(getPath(debug, ["terminal_answer_authority", "terminal_artifact_kind"]));
  const finalAnswerSource =
    readString(ask.final_answer_source) ??
    readString(debug?.final_answer_source) ??
    readString(getPath(debug, ["terminal_answer_authority", "final_answer_source"]));
  const selectedRoute =
    readString(ask.route_reason_code) ??
    readString(debug?.route_reason_code) ??
    readString(loopTrace?.selected_route) ??
    readString(getPath(debug, ["resolved_turn_summary", "resolved_route_label"]));
  const sourceTarget = readString(sourceTargetIntent?.target_source) ?? readString(routeAuthority?.source_target);
  const targetKind = readString(sourceTargetIntent?.target_kind) ?? null;
  const poisonAuditOk = poisonAudit?.ok === true;
  const routeAuthorityOk = routeAuthority?.route_authority_ok === true;
  const terminalAuthorityOk = terminalAuthority?.server_authoritative === true;
  const unexpectedToolCalls = readStringArray(loopTrace?.unexpected_tool_calls);
  const shortCircuitRiskFlags = readStringArray(loopTrace?.short_circuit_risk_flags);
  const solverShortCircuitFlags = readStringArray(solverTrace?.solver_short_circuit_flags);
  const failures: string[] = [];
  const expectedIdentityDiagnosis = typeof input.scenario.expected.live_source_identity_ok === "boolean" && input.scenario.expected.live_source_identity_ok === false;

  if (!debug) failures.push("debug_export_missing");
  if (!solverTrace) failures.push("ask_turn_solver_trace_missing");
  if (solverTrace) {
    const expectedSolverCompleted = input.scenario.expected.solver_completed ?? true;
    if (solverTrace.completed_solver_path !== expectedSolverCompleted) {
      failures.push(`ask_turn_solver_path_${solverTrace.completed_solver_path === true ? "complete" : "incomplete"}_unexpected`);
    }
  }
  if (!input.terminalEventSeen && input.terminalEventSeen !== undefined) failures.push("terminal_event_missing");
  if (!terminalAuthorityOk) failures.push("terminal_authority_not_ok");
  if (!routeAuthorityOk && !expectedIdentityDiagnosis) failures.push("route_authority_not_ok");
  if (unexpectedToolCalls.length > 0) failures.push(`unexpected_tool_calls:${unexpectedToolCalls.join(",")}`);
  if (shortCircuitRiskFlags.length > 0 && !expectedIdentityDiagnosis) failures.push(`short_circuit_risk_flags:${shortCircuitRiskFlags.join(",")}`);
  if (solverShortCircuitFlags.length > 0 && !expectedIdentityDiagnosis) failures.push(`solver_short_circuit_flags:${solverShortCircuitFlags.join(",")}`);
  if (poisonAuditOk && !routeAuthorityOk && !expectedIdentityDiagnosis) failures.push("poison_clean_but_authority_failed");
  if (
    input.scenario.expected.live_source_identity_diagnosis &&
    readString(liveSourceIdentityAudit?.diagnosis) !== input.scenario.expected.live_source_identity_diagnosis
  ) {
    failures.push(`live_source_identity_diagnosis_mismatch:${readString(liveSourceIdentityAudit?.diagnosis) ?? "missing"}!=${input.scenario.expected.live_source_identity_diagnosis}`);
  }
  if (
    typeof input.scenario.expected.live_source_identity_ok === "boolean" &&
    liveSourceIdentityAudit?.identity_ok !== input.scenario.expected.live_source_identity_ok
  ) {
    failures.push(`live_source_identity_ok_mismatch:${String(liveSourceIdentityAudit?.identity_ok)}!=${String(input.scenario.expected.live_source_identity_ok)}`);
  }

  addExpectationFailures({
    failures,
    expected: input.scenario.expected,
    sourceTarget,
    targetKind,
    selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    loopTrace,
    solverTrace,
    selectedCapabilities,
  });

  return {
    schema: "helix.api_parity_probe_result.v1",
    scenario_id: input.scenario.id,
    prompt: input.scenario.prompt,
    non_stream_turn_id: readString(ask.turn_id) ?? "missing",
    stream_turn_id: readString(readRecord(input.streamTurn)?.turn_id) ?? undefined,
    debug_export_available: Boolean(debug),
    terminal_event_seen: input.terminalEventSeen ?? true,
    stream_closed_after_terminal: input.streamClosedAfterTerminal ?? true,
    source_target: sourceTarget,
    target_kind: targetKind,
    selected_route: selectedRoute,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    loop_parity_trace: {
      admitted_tool_families: readStringArray(loopTrace?.admitted_tool_families),
      actual_tool_calls: readActualToolIds(loopTrace),
      unexpected_tool_calls: unexpectedToolCalls,
      observations_created_count: Array.isArray(loopTrace?.observations_created) ? loopTrace.observations_created.length : 0,
      evidence_selected_for_answer_count: Array.isArray(loopTrace?.evidence_selected_for_answer) ? loopTrace.evidence_selected_for_answer.length : 0,
      short_circuit_risk_flags: shortCircuitRiskFlags,
    },
    ask_turn_solver_trace: {
      present: Boolean(solverTrace),
      completed_solver_path: solverTrace?.completed_solver_path === true,
      prompt_shape: readString(getPath(solverTrace, ["prompt_interpretation", "prompt_shape"])),
      selected_primary_intent: readString(solverTrace?.selected_primary_intent),
      primary_intent_route: readString(getPath(solverTrace, ["primary_intent", "route"])),
      contextual_tool_mentions: readContextualToolMentionCues(solverTrace),
      executable_operator_commands_count: readExecutableOperatorCommandCount(solverTrace),
      solver_short_circuit_flags: solverShortCircuitFlags,
      live_source_identity_diagnosis: readString(liveSourceIdentityAudit?.diagnosis),
      live_source_identity_ok: typeof liveSourceIdentityAudit?.identity_ok === "boolean" ? liveSourceIdentityAudit.identity_ok : null,
    },
    capability_selection: {
      capability_id: readString(capabilitySelectionResult?.capability_id),
      selected_capabilities: selectedCapabilities,
    },
    route_authority: {
      ok: routeAuthorityOk,
      primary_violation_code: readString(routeAuthority?.primary_violation_code),
      violation_codes: readStringArray(routeAuthority?.violation_codes),
    },
    poison_audit_ok: poisonAuditOk,
    terminal_authority_ok: terminalAuthorityOk,
    procedural_ok: failures.length === 0,
    failures,
  };
}
