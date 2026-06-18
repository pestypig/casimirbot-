import { hashHelixTerminalText } from "./turn-terminal-authority";

type RecordLike = Record<string, unknown>;

export const HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION =
  "helix.tool_rail_terminal_failure_reconciliation.runtime.v1";

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry))
    : [];

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const isBudgetExhaustionCode = (value: string | null): boolean =>
  value === "agent_loop_budget_exhausted" || value === "max_tool_calls_budget_exhausted";

const runtimeMarker = (): RecordLike => ({
  schema: "helix.tool_rail_terminal_failure_reconciliation.runtime.v1",
  version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
  available: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const markTerminalFailureReconciliationRuntime = (payload: RecordLike): void => {
  payload.tool_rail_terminal_failure_reconciliation_runtime = runtimeMarker();
  const debug = readRecord(payload.debug);
  if (debug) debug.tool_rail_terminal_failure_reconciliation_runtime = runtimeMarker();
};

const firstRailRecord = (payload: RecordLike): RecordLike | null => {
  const debug = readRecord(payload.debug);
  const artifactQueryIndex = readRecord(payload.artifact_query_index);
  const debugArtifactQueryIndex = readRecord(debug?.artifact_query_index);
  return (
    readRecord(payload.codex_parity_agent_spine_rail_table) ??
    readRecord(payload.tool_rail_failure_triage) ??
    readRecord(payload.tool_turn_chain_audit) ??
    readRecord(artifactQueryIndex?.codex_parity_agent_spine_rail_table) ??
    readRecord(artifactQueryIndex?.tool_rail_failure_triage) ??
    readRecord(artifactQueryIndex?.tool_turn_chain_audit) ??
    readRecord(debug?.codex_parity_agent_spine_rail_table) ??
    readRecord(debug?.tool_rail_failure_triage) ??
    readRecord(debug?.tool_turn_chain_audit) ??
    readRecord(debugArtifactQueryIndex?.codex_parity_agent_spine_rail_table) ??
    readRecord(debugArtifactQueryIndex?.tool_rail_failure_triage) ??
    readRecord(debugArtifactQueryIndex?.tool_turn_chain_audit)
  );
};

const terminalErrorCodeForRail = (rail: RecordLike): string => {
  const requestedCapability = readString(rail.requested_capability);
  const requiredObservationKinds = readStringArray(rail.required_observation_kinds_for_requested_capability);
  if (
    requestedCapability?.startsWith("live_env.") &&
    requiredObservationKinds.some((kind) => kind.startsWith("stage_play_"))
  ) {
    return "missing_required_live_source_mailbox_observation";
  }
  return readString(rail.rail_failure_code) ?? "required_observation_missing";
};

const terminalTextForRail = (rail: RecordLike, terminalErrorCode: string): string => {
  const requestedCapability = readString(rail.requested_capability) ?? "the requested capability";
  const executedCapability = readString(rail.executed_capability);
  const observationKind = readString(rail.observation_kind) ?? readString(rail.observation_artifact_kind);
  const requiredObservationKinds = uniqueStrings(readStringArray(rail.required_observation_kinds_for_requested_capability));
  const requiredObservationText = requiredObservationKinds.length
    ? requiredObservationKinds.join(", ")
    : "the required observation";
  if (terminalErrorCode === "missing_required_live_source_mailbox_observation") {
    return [
      "I could not complete this live-source mailbox turn because the required mailbox observation was not materialized.",
      `Requested capability: ${requestedCapability}.`,
      `Required observation: ${requiredObservationText}.`,
      executedCapability ? `Executed capability: ${executedCapability}.` : null,
      observationKind ? `Observed artifact: ${observationKind}.` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  }
  return [
    "I could not complete this turn because the requested capability did not produce the required observation.",
    `Requested capability: ${requestedCapability}.`,
    `Required observation: ${requiredObservationText}.`,
    executedCapability ? `Executed capability: ${executedCapability}.` : null,
    observationKind ? `Observed artifact: ${observationKind}.` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
};

const syncTypedFailureMirror = (
  target: RecordLike | null,
  input: {
    turnId: string | null;
    terminalErrorCode: string;
    terminalText: string;
    rail: RecordLike;
  },
): void => {
  if (!target) return;
  target.ok = false;
  target.answer = input.terminalText;
  target.text = input.terminalText;
  target.assistant_answer = input.terminalText;
  target.selected_final_answer = input.terminalText;
  target.finalAnswer = input.terminalText;
  target.content = input.terminalText;
  target.final_answer_source = "typed_failure";
  target.response_type = "final_failure";
  target.final_status = "final_failure";
  target.terminal_artifact_kind = "typed_failure";
  target.terminal_error_code = input.terminalErrorCode;
  target.terminal_failure_text = input.terminalText;
  target.typed_failure = {
    ...(readRecord(target.typed_failure) ?? {}),
    schema: "helix.typed_failure.v1",
    error_code: input.terminalErrorCode,
    message: input.terminalText,
    text: input.terminalText,
    answer_text: input.terminalText,
    first_broken_rail: readString(input.rail.first_broken_rail) ?? null,
    rail_failure_code: readString(input.rail.rail_failure_code) ?? null,
    repair_target: readString(input.rail.repair_target) ?? null,
    assistant_answer: false,
    raw_content_included: false,
  };

  const resolvedSummary = readRecord(target.resolved_turn_summary);
  target.resolved_turn_summary = {
    ...(resolvedSummary ?? {}),
    turn_id: readString(resolvedSummary?.turn_id) ?? input.turnId,
    final_status: "final_failure",
    terminal_kind: "final_failure",
    terminal_artifact_kind: "typed_failure",
    terminal_error_code: input.terminalErrorCode,
    final_answer_source: "typed_failure",
    pending_server_request_present: false,
    resolved_route_label: `${readString(input.rail.route_family) ?? "tool"} / typed_failure:${input.terminalErrorCode}`,
    resolved_route_reason: readString(input.rail.rail_failure_code) ?? "required_observation_missing",
  };

  const terminalPresentation = readRecord(target.terminal_presentation);
  target.terminal_presentation = {
    ...(terminalPresentation ?? {}),
    schema: "helix.terminal_presentation.v1",
    terminal_artifact_kind: "typed_failure",
    terminal_error_code: input.terminalErrorCode,
    final_answer_source: "typed_failure",
    concise_text: input.terminalText,
    assistant_answer: false,
    raw_content_included: false,
  };

  const terminalAuthority = readRecord(target.terminal_answer_authority);
  target.terminal_answer_authority = {
    ...(terminalAuthority ?? {}),
    schema: "helix.turn_terminal_authority.v1",
    turn_id: readString(terminalAuthority?.turn_id) ?? input.turnId,
    terminal_kind: "failure",
    final_answer_source: "typed_failure",
    terminal_artifact_kind: "typed_failure",
    terminal_error_code: input.terminalErrorCode,
    terminal_text_hash: hashHelixTerminalText(input.terminalText),
    terminal_text_preview: input.terminalText,
    authority_origin: "tool_rail_failure_triage",
    server_authoritative: true,
    debug_export_synchronized: true,
  };

  const solverSummary = readRecord(target.solver_controller_summary);
  if (solverSummary) {
    solverSummary.decision = "block_terminal";
    solverSummary.selected_terminal_artifact_kind = "typed_failure";
    solverSummary.blocking_reasons = uniqueStrings([
      ...readStringArray(solverSummary.blocking_reasons),
      input.terminalErrorCode,
    ]);
  }
};

export const reconcileTerminalFailureWithToolRail = (payload: RecordLike): boolean => {
  markTerminalFailureReconciliationRuntime(payload);

  const currentErrorCode = readString(payload.terminal_error_code);
  if (!isBudgetExhaustionCode(currentErrorCode)) return false;

  const rail = firstRailRecord(payload);
  if (!rail) return false;
  if (readString(rail.rail_status) !== "fail_closed") return false;
  if (readString(rail.rail_failure_code) !== "required_observation_missing") return false;
  if (readString(rail.first_broken_rail) !== "observation_artifact") return false;

  const terminalErrorCode = terminalErrorCodeForRail(rail);
  const terminalText = terminalTextForRail(rail, terminalErrorCode);
  const turnId =
    readString(payload.turn_id) ??
    readString(payload.turnId) ??
    readString(rail.turn_id) ??
    readString(readRecord(payload.resolved_turn_summary)?.turn_id);

  syncTypedFailureMirror(payload, { turnId, terminalErrorCode, terminalText, rail });
  const debug = readRecord(payload.debug);
  if (debug) {
    syncTypedFailureMirror(debug, { turnId, terminalErrorCode, terminalText, rail });
    debug.tool_rail_terminal_failure_reconciliation = {
      schema: "helix.tool_rail_terminal_failure_reconciliation.v1",
      applied: true,
      replaced_terminal_error_code: currentErrorCode,
      terminal_error_code: terminalErrorCode,
      rail_failure_code: readString(rail.rail_failure_code),
      first_broken_rail: readString(rail.first_broken_rail),
      repair_target: readString(rail.repair_target),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  payload.tool_rail_terminal_failure_reconciliation = {
    schema: "helix.tool_rail_terminal_failure_reconciliation.v1",
    applied: true,
    replaced_terminal_error_code: currentErrorCode,
    terminal_error_code: terminalErrorCode,
    rail_failure_code: readString(rail.rail_failure_code),
    first_broken_rail: readString(rail.first_broken_rail),
    repair_target: readString(rail.repair_target),
    assistant_answer: false,
    raw_content_included: false,
  };
  return true;
};
