import { expect } from "vitest";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    const record = readRecord(current);
    return record ? record[key] : undefined;
  }, value);

export const expectSolverTrace = (body: unknown): RecordLike => {
  const trace = readRecord(getPath(body, ["ask_turn_solver_trace"]));
  expect(trace, "interpretation failure: ask_turn_solver_trace missing").toBeTruthy();
  expect(trace?.schema, "interpretation failure: wrong solver trace schema").toBe("helix.ask_turn_solver_trace.v1");
  expect(trace?.assistant_answer, "terminal authority failure: trace must not be an assistant answer").toBe(false);
  expect(trace?.raw_content_included, "terminal authority failure: trace must not include raw content").toBe(false);
  expect(readRecord(trace?.prompt_interpretation), "interpretation failure: prompt_interpretation missing").toBeTruthy();
  expect(Array.isArray(trace?.intent_hypotheses), "interpretation failure: intent_hypotheses missing").toBe(true);
  expect(readRecord(trace?.intent_arbitration), "interpretation failure: intent_arbitration missing").toBeTruthy();
  expect(readRecord(trace?.evidence_reentry_gate), "evidence re-entry failure: evidence_reentry_gate missing").toBeTruthy();
  expect(readRecord(trace?.followup_reasoning_gate), "follow-up reasoning failure: followup_reasoning_gate missing").toBeTruthy();
  return trace as RecordLike;
};

export const expectPrimaryIntent = (body: unknown, oneOfKinds: string[]): void => {
  const trace = expectSolverTrace(body);
  expect(
    oneOfKinds,
    `interpretation failure: selected_primary_intent=${readString(trace.selected_primary_intent) ?? "missing"}`,
  ).toContain(readString(trace.selected_primary_intent));
};

export const expectContextualToolMention = (body: unknown, cue: string): void => {
  const trace = expectSolverTrace(body);
  const mentions = Array.isArray(getPath(trace, ["prompt_interpretation", "contextual_tool_mentions"]))
    ? getPath(trace, ["prompt_interpretation", "contextual_tool_mentions"]) as unknown[]
    : [];
  const found = mentions
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .some((entry) => `${readString(entry.verb_or_cue) ?? ""} ${readString(entry.text) ?? ""}`.toLowerCase().includes(cue.toLowerCase()));
  expect(found, `interpretation failure: contextual tool mention ${cue} missing`).toBe(true);
};

export const expectNegativeConstraint = (body: unknown, pattern: RegExp): void => {
  const trace = expectSolverTrace(body);
  const constraints = readStringArray(getPath(trace, ["prompt_interpretation", "negative_constraints"]));
  expect(
    constraints.some((entry) => pattern.test(entry)),
    `interpretation failure: negative constraint ${pattern} missing`,
  ).toBe(true);
};

export const expectNoMutatingToolCalls = (body: unknown): void => {
  const trace = expectSolverTrace(body);
  const loopTrace = readRecord(getPath(body, ["loop_parity_trace"]));
  const actualCalls = Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [];
  const mutating = actualCalls
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => entry.mutating === true || /set_rate|start|stop|click|open|repair|run|write|delete|update/i.test(readString(entry.tool_id) ?? ""));
  const commandCount = Array.isArray(getPath(trace, ["prompt_interpretation", "executable_operator_commands"]))
    ? (getPath(trace, ["prompt_interpretation", "executable_operator_commands"]) as unknown[]).length
    : 0;
  expect(mutating, "admission failure: unexpected mutating tool calls").toEqual([]);
  expect(commandCount, "admission failure: executable operator commands present").toBe(0);
  expect(JSON.stringify(body), "admission failure: set_rate leaked into response").not.toContain("situation-room.live-source.set_rate");
};

export const expectNoTerminalArtifact = (body: unknown, artifacts: string[]): void => {
  const terminalArtifactKind =
    readString(getPath(body, ["terminal_artifact_kind"])) ??
    readString(getPath(body, ["ask_turn_solver_trace", "final_arbitration", "terminal_artifact_kind"]));
  const finalAnswerSource =
    readString(getPath(body, ["final_answer_source"])) ??
    readString(getPath(body, ["ask_turn_solver_trace", "final_arbitration", "final_answer_source"]));
  for (const artifact of artifacts) {
    expect(terminalArtifactKind, `terminal authority failure: forbidden terminal artifact ${artifact}`).not.toBe(artifact);
    expect(finalAnswerSource, `terminal authority failure: forbidden final answer source ${artifact}`).not.toBe(artifact);
  }
};

export const expectRouteNotSelected = (body: unknown, routes: string[]): void => {
  const selectedRoute =
    readString(getPath(body, ["route_reason_code"])) ??
    readString(getPath(body, ["route"])) ??
    readString(getPath(body, ["ask_turn_solver_trace", "final_arbitration", "selected_route"]));
  for (const route of routes) {
    expect(selectedRoute, `admission failure: forbidden route selected ${route}`).not.toBe(route);
  }
};

export const expectRouteAuthorityOk = (body: unknown): void => {
  const trace = expectSolverTrace(body);
  const routeAuthority = readRecord(getPath(body, ["route_authority_audit"]));
  expect(
    trace.route_authority_ok === true || routeAuthority?.route_authority_ok === true,
    "terminal authority failure: route authority did not pass",
  ).toBe(true);
};

export const expectTerminalAuthorityOk = (body: unknown): void => {
  const trace = expectSolverTrace(body);
  const terminalAuthority = readRecord(getPath(body, ["terminal_answer_authority"]));
  expect(
    trace.terminal_authority_ok === true || terminalAuthority?.server_authoritative === true,
    "terminal authority failure: terminal authority did not pass",
  ).toBe(true);
};

export const expectNoShortCircuitFlags = (body: unknown): void => {
  const trace = expectSolverTrace(body);
  const loopTrace = readRecord(getPath(body, ["loop_parity_trace"]));
  expect(readStringArray(loopTrace?.short_circuit_risk_flags), "evidence re-entry failure: loop short-circuit flags present").toEqual([]);
  expect(readStringArray(trace.solver_risk_flags), "follow-up reasoning failure: solver risk flags present").toEqual([]);
};

export const expectAnswerMentionsAny = (body: unknown, patterns: RegExp[], label: string): void => {
  const text = [
    readString(getPath(body, ["answer"])),
    readString(getPath(body, ["text"])),
    readString(getPath(body, ["selected_final_answer"])),
  ].filter(Boolean).join("\n");
  expect(
    patterns.some((pattern) => pattern.test(text)),
    `follow-up reasoning failure: answer did not mention ${label}`,
  ).toBe(true);
};

export const expectArbitrationSuppressesRoute = (body: unknown, route: string): void => {
  const trace = expectSolverTrace(body);
  const suppressed = Array.isArray(getPath(trace, ["intent_arbitration", "route_candidates_suppressed"]))
    ? getPath(trace, ["intent_arbitration", "route_candidates_suppressed"]) as unknown[]
    : [];
  const found = suppressed
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .some((entry) => readString(entry.route) === route);
  expect(found, `admission failure: route ${route} was not suppressed by intent arbitration`).toBe(true);
};
