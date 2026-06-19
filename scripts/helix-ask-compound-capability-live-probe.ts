import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type RecordLike = Record<string, unknown>;
type ExpectedValue = string | string[] | null;

export type CompoundCapabilityScenario = {
  id: string;
  prompt: string;
  seed?: "visual_capture";
  expectedRequested: ExpectedValue[];
  expectedRuntime: ExpectedValue[];
  expectedCalculatorExpression?: string;
  expectedSubgoalSatisfaction?: ExpectedValue[];
  expectedRailStatus?: ExpectedValue[];
  expectedRailFailureCode?: ExpectedValue[];
  expectedTerminalErrorCode?: ExpectedValue;
  expectedFinalAnswerSource?: ExpectedValue;
};

export type CompoundCapabilityScenarioSummary = {
  id: string;
  prompt: string;
  ok: boolean;
  failures: string[];
  turn_id: string | null;
  terminal_error_code: string | null;
  terminal_authority_kind: string | null;
  visible_terminal_kind: string | null;
  final_answer_source: string | null;
  requested_capabilities: string[];
  executed_capabilities: Array<string | null>;
  subgoal_satisfactions: Array<string | null>;
  subgoal_rail_statuses: Array<string | null>;
};

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:1498").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_COMPOUND_LIVE_OUT ?? "artifacts/helix-ask-compound-capability-live";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_COMPOUND_LIVE_TIMEOUT_MS ?? 300_000));
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_COMPOUND_LIVE_DRY_RUN === "1";
const SCENARIO_FILTER = (process.env.HELIX_ASK_COMPOUND_LIVE_SCENARIOS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

export type CompoundCapabilityScenarioSelection = {
  scenarios: CompoundCapabilityScenario[];
  requestedIds: string[];
  unknownIds: string[];
  availableIds: string[];
};

export const COMPOUND_CAPABILITY_LIVE_SCENARIOS: CompoundCapabilityScenario[] = [
  {
    id: "workspace_then_calculator",
    prompt:
      "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
    expectedRequested: ["workspace_os.status", "scientific-calculator.solve_expression"],
    expectedRuntime: ["workspace_os.status", "scientific-calculator.solve_expression"],
    expectedCalculatorExpression: "14*23+8",
  },
  {
    id: "docs_then_calculator",
    prompt:
      "Use docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md, then run scientific-calculator.solve_expression with this exact expression: 19+23.",
    expectedRequested: ["docs-viewer.locate_in_doc", "scientific-calculator.solve_expression"],
    expectedRuntime: ["docs-viewer.locate_in_doc", "scientific-calculator.solve_expression"],
    expectedCalculatorExpression: "19+23",
  },
  {
    id: "catalog_then_workspace",
    prompt: "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
    expectedRequested: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
    expectedRuntime: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
  },
  {
    id: "repo_plus_docs",
    prompt:
      "Use repo-code.search_concept to find where terminal authority is enforced, plus docs-viewer.locate_in_doc to locate the same rule in docs/helix-ask-codex-loop-discipline.md.",
    expectedRequested: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
    expectedRuntime: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
  },
  {
    id: "visual_then_calculator",
    seed: "visual_capture",
    prompt:
      "Use situation-room.describe_visual_capture, then run scientific-calculator.solve_expression with this exact expression: 5*9.",
    expectedRequested: [["situation-room.describe_visual_capture", "image_lens.inspect"], "scientific-calculator.solve_expression"],
    expectedRuntime: ["situation-room.describe_visual_capture", "scientific-calculator.solve_expression"],
    expectedCalculatorExpression: "5*9",
  },
  {
    id: "invalid_calculator_args_fail_closed",
    prompt:
      "Use docs-viewer.locate_in_doc to cite the rule of thumb, then call scientific-calculator.solve_expression with this exact expression: explain why receipts matter.",
    expectedRequested: ["docs-viewer.locate_in_doc", "scientific-calculator.solve_expression"],
    expectedRuntime: ["docs-viewer.locate_in_doc", null],
    expectedSubgoalSatisfaction: ["satisfied", "failed"],
    expectedRailStatus: ["complete", "fail_closed"],
    expectedRailFailureCode: [null, "invalid_arg:latex_is_prose"],
    expectedTerminalErrorCode: "compound_subgoal_invalid_args_after_repair",
    expectedFinalAnswerSource: "typed_failure",
  },
];

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as RecordLike)[key];
  }, value);

const firstRecord = (...values: unknown[]): RecordLike | null => {
  for (const value of values) {
    const record = readRecord(value);
    if (record) return record;
  }
  return null;
};

const firstArray = (...values: unknown[]): unknown[] => {
  for (const value of values) {
    const array = readArray(value);
    if (array.length > 0) return array;
  }
  return [];
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 1200)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const parseJsonRecord = (text: string): RecordLike | null => {
  try {
    return readRecord(JSON.parse(text));
  } catch {
    return null;
  }
};

const probeAskTurnApi = async (): Promise<{ ok: boolean; reason: string; message: string }> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(TIMEOUT_MS, 10_000));
  try {
    const response = await fetch(`${BASE_URL}/api/agi/ask/turn/__helix_compound_live_preflight__/debug-export?view=rail`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    const payload = parseJsonRecord(text);
    const error = readString(payload?.error);
    const terminalError = readString(payload?.terminal_error_code);
    if (response.ok || error === "debug_export_not_found" || terminalError === "debug_export_turn_not_found") {
      return {
        ok: true,
        reason: response.ok ? "ask_turn_debug_export_available" : "ask_turn_routes_available",
        message: "Ask turn routes are mounted.",
      };
    }
    return {
      ok: false,
      reason: error ?? terminalError ?? `status_${response.status}`,
      message: text.slice(0, 1200) || response.statusText,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error && error.name === "AbortError" ? "ask_turn_api_preflight_timeout" : "ask_turn_api_unreachable",
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const extractPayload = (debugExport: unknown): RecordLike | null => {
  const debug = readRecord(debugExport);
  return readRecord(debug?.payload) ?? debug;
};

const compoundContractFor = (ask: RecordLike, debugExport: unknown): RecordLike | null => {
  const payload = extractPayload(debugExport);
  return firstRecord(
    ask.compound_capability_contract,
    payload?.compound_capability_contract,
    getPath(payload, ["debug", "compound_capability_contract"]),
    getPath(payload, ["artifact_query_index", "compound_capability_contract"]),
    getPath(payload, ["debug", "artifact_query_index", "compound_capability_contract"]),
    getPath(payload, ["capability_itinerary", "compound_capability_contract"]),
  );
};

const compoundLedgerFor = (ask: RecordLike, debugExport: unknown): RecordLike[] => {
  const payload = extractPayload(debugExport);
  const entries = firstArray(
    ask.compound_subgoal_ledger,
    payload?.compound_subgoal_ledger,
    getPath(payload, ["debug", "compound_subgoal_ledger"]),
    getPath(payload, ["artifact_query_index", "compound_subgoal_ledger"]),
    getPath(payload, ["debug", "artifact_query_index", "compound_subgoal_ledger"]),
    getPath(payload, ["capability_itinerary_execution_state", "compound_subgoal_ledger"]),
    getPath(payload, ["debug", "capability_itinerary_execution_state", "compound_subgoal_ledger"]),
  );
  return entries.map(readRecord).filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));
};

const compoundRailStatusesFor = (ask: RecordLike, debugExport: unknown): RecordLike[] => {
  const payload = extractPayload(debugExport);
  const entries = firstArray(
    ask.compound_subgoal_rail_statuses,
    payload?.compound_subgoal_rail_statuses,
    getPath(payload, ["debug", "compound_subgoal_rail_statuses"]),
    getPath(payload, ["artifact_query_index", "compound_subgoal_rail_statuses"]),
    getPath(payload, ["debug", "artifact_query_index", "compound_subgoal_rail_statuses"]),
  );
  return entries.map(readRecord).filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));
};

const terminalErrorCodeFor = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_error_code) ??
    readString(payload?.terminal_error_code) ??
    readString(getPath(payload, ["typed_failure", "error_code"])) ??
    readString(getPath(payload, ["resolved_turn_summary", "terminal_error_code"]))
  );
};

const terminalAuthorityKindFor = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_artifact_kind) ??
    readString(payload?.terminal_artifact_kind) ??
    readString(getPath(payload, ["terminal_answer_authority", "terminal_artifact_kind"])) ??
    readString(getPath(payload, ["terminal_authority_single_writer", "selected_terminal_artifact_kind"]))
  );
};

const visibleTerminalKindFor = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.visible_terminal_kind) ??
    readString(getPath(payload, ["terminal_presentation", "terminal_artifact_kind"])) ??
    readString(payload?.visible_terminal_kind) ??
    terminalAuthorityKindFor(ask, debugExport)
  );
};

const finalAnswerSourceFor = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return readString(ask.final_answer_source) ?? readString(payload?.final_answer_source);
};

const matchesExpected = (actual: string | null, expected: ExpectedValue): boolean => {
  if (expected === null) return actual === null;
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  return actual !== null && expectedValues.includes(actual);
};

const maybeCapability = (entry: RecordLike, key: string): string | null => readString(entry[key]);

const subgoalArgsFor = (contractSubgoal: RecordLike | null, ledgerEntry: RecordLike | null): RecordLike | null =>
  firstRecord(
    ledgerEntry?.args,
    ledgerEntry?.args_hint,
    contractSubgoal?.args,
    contractSubgoal?.args_hint,
  );

const expressionFor = (args: RecordLike | null): string | null =>
  readString(args?.latex) ?? readString(args?.expression) ?? readString(args?.input);

export const evaluateCompoundCapabilityScenario = (input: {
  scenario: CompoundCapabilityScenario;
  ask: RecordLike;
  debugExport: unknown;
}): CompoundCapabilityScenarioSummary => {
  const failures: string[] = [];
  const turnId = readString(input.ask.turn_id);
  const payload = extractPayload(input.debugExport);
  const contract = compoundContractFor(input.ask, input.debugExport);
  const contractSubgoals = readArray(contract?.subgoals)
    .map(readRecord)
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));
  const ledger = compoundLedgerFor(input.ask, input.debugExport);
  const railStatuses = compoundRailStatusesFor(input.ask, input.debugExport);
  const terminalErrorCode = terminalErrorCodeFor(input.ask, input.debugExport);
  const terminalAuthorityKind = terminalAuthorityKindFor(input.ask, input.debugExport);
  const visibleTerminalKind = visibleTerminalKindFor(input.ask, input.debugExport);
  const finalAnswerSource = finalAnswerSourceFor(input.ask, input.debugExport);

  if (!turnId) failures.push("ask_response_missing_turn_id");
  if (!contract) failures.push("compound_capability_contract_missing");
  if (contract && contract.schema !== "helix.compound_capability_contract.v1") failures.push("compound_capability_contract_schema_mismatch");
  if (contractSubgoals.length < input.scenario.expectedRequested.length) {
    failures.push(`compound_subgoals_dropped:${contractSubgoals.length}<${input.scenario.expectedRequested.length}`);
  }
  if (ledger.length < input.scenario.expectedRequested.length) {
    failures.push(`compound_subgoal_ledger_dropped:${ledger.length}<${input.scenario.expectedRequested.length}`);
  }
  if (railStatuses.length < input.scenario.expectedRequested.length) {
    failures.push(`compound_subgoal_rail_statuses_dropped:${railStatuses.length}<${input.scenario.expectedRequested.length}`);
  }

  const requestedCapabilities = contractSubgoals.map((entry) => maybeCapability(entry, "requested_capability") ?? "");
  const executedCapabilities = ledger.map((entry) => maybeCapability(entry, "executed_capability"));
  const subgoalSatisfactions = ledger.map((entry) => maybeCapability(entry, "satisfaction"));
  const subgoalRailStatuses = railStatuses.map((entry) => maybeCapability(entry, "rail_status"));

  input.scenario.expectedRequested.forEach((expected, index) => {
    const contractSubgoal = contractSubgoals[index] ?? null;
    const ledgerEntry = ledger[index] ?? null;
    const railEntry = railStatuses[index] ?? null;
    const requested = maybeCapability(contractSubgoal ?? {}, "requested_capability");
    const selected = maybeCapability(ledgerEntry ?? {}, "selected_capability");
    const executed = maybeCapability(ledgerEntry ?? {}, "executed_capability");
    const observationKind = maybeCapability(ledgerEntry ?? {}, "observation_kind");
    const observationRef = maybeCapability(ledgerEntry ?? {}, "observation_ref");
    const satisfaction = maybeCapability(ledgerEntry ?? {}, "satisfaction");
    const railRequested = maybeCapability(railEntry ?? {}, "requested_capability");
    const railExecuted = maybeCapability(railEntry ?? {}, "executed_capability");
    const railObservationKind = maybeCapability(railEntry ?? {}, "observation_kind");
    const railObservationRef = maybeCapability(railEntry ?? {}, "observation_ref");
    const railSatisfaction = maybeCapability(railEntry ?? {}, "satisfaction");
    const railStatus = maybeCapability(railEntry ?? {}, "rail_status");
    const railFailureCode = maybeCapability(railEntry ?? {}, "rail_failure_code");
    const expectedRuntime = index < input.scenario.expectedRuntime.length ? input.scenario.expectedRuntime[index] : expected;
    const expectedSatisfaction =
      input.scenario.expectedSubgoalSatisfaction && index < input.scenario.expectedSubgoalSatisfaction.length
        ? input.scenario.expectedSubgoalSatisfaction[index]
        : "satisfied";
    const expectedRailStatus =
      input.scenario.expectedRailStatus && index < input.scenario.expectedRailStatus.length
        ? input.scenario.expectedRailStatus[index]
        : (
      expectedSatisfaction === "satisfied" ? "complete" : "fail_closed"
    );
    const expectedRailFailureCode = input.scenario.expectedRailFailureCode?.[index];

    if (!matchesExpected(requested, expected)) {
      failures.push(`subgoal_${index + 1}_requested_mismatch:${requested ?? "null"}`);
    }
    if (!selected) failures.push(`subgoal_${index + 1}_selected_capability_missing`);
    if (!matchesExpected(executed, expectedRuntime)) {
      failures.push(`subgoal_${index + 1}_executed_mismatch:${executed ?? "null"}`);
    }
    if (expectedSatisfaction === "satisfied") {
      if (!observationKind) failures.push(`subgoal_${index + 1}_observation_kind_missing`);
      if (!observationRef) failures.push(`subgoal_${index + 1}_observation_ref_missing`);
    }
    if (!matchesExpected(satisfaction, expectedSatisfaction)) {
      failures.push(`subgoal_${index + 1}_satisfaction_mismatch:${satisfaction ?? "null"}`);
    }
    if (!railEntry) {
      failures.push(`subgoal_${index + 1}_rail_status_entry_missing`);
    } else {
      if (!matchesExpected(railRequested, expected)) {
        failures.push(`subgoal_${index + 1}_rail_requested_mismatch:${railRequested ?? "null"}`);
      }
      if (!matchesExpected(railExecuted, expectedRuntime)) {
        failures.push(`subgoal_${index + 1}_rail_executed_mismatch:${railExecuted ?? "null"}`);
      }
      if (expectedSatisfaction === "satisfied") {
        if (!railObservationKind) failures.push(`subgoal_${index + 1}_rail_observation_kind_missing`);
        if (!railObservationRef) failures.push(`subgoal_${index + 1}_rail_observation_ref_missing`);
      }
      if (railSatisfaction !== satisfaction) {
        failures.push(`subgoal_${index + 1}_rail_satisfaction_mismatch:${railSatisfaction ?? "null"}!=${satisfaction ?? "null"}`);
      }
      if (!matchesExpected(railStatus, expectedRailStatus)) {
        failures.push(`subgoal_${index + 1}_rail_status_mismatch:${railStatus ?? "null"}`);
      }
      if (expectedRailFailureCode !== undefined && !matchesExpected(railFailureCode, expectedRailFailureCode)) {
        failures.push(`subgoal_${index + 1}_rail_failure_code_mismatch:${railFailureCode ?? "null"}`);
      }
    }
  });

  if (input.scenario.expectedCalculatorExpression) {
    const calculatorIndex = input.scenario.expectedRuntime.findIndex((entry) =>
      Array.isArray(entry)
        ? entry.includes("scientific-calculator.solve_expression")
        : entry === "scientific-calculator.solve_expression",
    );
    const args = subgoalArgsFor(contractSubgoals[calculatorIndex] ?? null, ledger[calculatorIndex] ?? null);
    const expression = expressionFor(args);
    if (expression !== input.scenario.expectedCalculatorExpression) {
      failures.push(`calculator_expression_mismatch:${expression ?? "null"}`);
    }
    if (expression && /workspace_os\.status|docs-viewer|repo-code|situation-room|then|plus/i.test(expression)) {
      failures.push("calculator_expression_contains_non_math_prompt_text");
    }
  }

  if (terminalErrorCode === "agent_loop_budget_exhausted" || terminalErrorCode === "agent_tool_call_budget_exhausted") {
    failures.push(`budget_exhaustion:${terminalErrorCode}`);
  }
  if (input.scenario.expectedTerminalErrorCode !== undefined) {
    if (!matchesExpected(terminalErrorCode, input.scenario.expectedTerminalErrorCode)) {
      failures.push(`terminal_error_code_mismatch:${terminalErrorCode ?? "null"}`);
    }
  } else if (terminalErrorCode) {
    failures.push(`unexpected_terminal_error_code:${terminalErrorCode}`);
  }
  if (
    input.scenario.expectedFinalAnswerSource !== undefined &&
    !matchesExpected(finalAnswerSource, input.scenario.expectedFinalAnswerSource)
  ) {
    failures.push(`final_answer_source_mismatch:${finalAnswerSource ?? "null"}`);
  }
  if (terminalAuthorityKind && visibleTerminalKind && terminalAuthorityKind !== visibleTerminalKind) {
    failures.push(`terminal_projection_mismatch:${terminalAuthorityKind}!=${visibleTerminalKind}`);
  }
  if (terminalErrorCode === "compound_subgoal_support_refs_missing") {
    const coverage = readRecord(payload?.compound_subgoal_draft_support_coverage);
    const missingRefs = readStringArray(coverage?.missing_observation_refs);
    failures.push(`compound_draft_missing_subgoal_support_refs:${missingRefs.join(",") || "unknown"}`);
  }

  return {
    id: input.scenario.id,
    prompt: input.scenario.prompt,
    ok: failures.length === 0,
    failures,
    turn_id: turnId,
    terminal_error_code: terminalErrorCode,
    terminal_authority_kind: terminalAuthorityKind,
    visible_terminal_kind: visibleTerminalKind,
    final_answer_source: finalAnswerSource,
    requested_capabilities: requestedCapabilities,
    executed_capabilities: executedCapabilities,
    subgoal_satisfactions: subgoalSatisfactions,
    subgoal_rail_statuses: subgoalRailStatuses,
  };
};

const seedScenario = async (scenario: CompoundCapabilityScenario, threadId: string, scenarioDir: string): Promise<void> => {
  if (scenario.seed !== "visual_capture") return;
  const seed = await fetchJson<RecordLike>(`${BASE_URL}/api/agi/situation/test-harness/live-visual-source`, {
    method: "POST",
    body: JSON.stringify({
      thread_id: threadId,
      source_id: `visual_source:${scenario.id}`,
      scene_text: "A backend-seeded visual capture shows the Helix Ask desktop with the scientific calculator panel open.",
      activity: "Inspecting a calculator panel and debug workspace.",
      objects: "desktop, Helix Ask UI, scientific calculator panel, debug viewer",
      confidence: 0.82,
    }),
  });
  await fs.writeFile(path.join(scenarioDir, "seed.json"), `${JSON.stringify(seed, null, 2)}\n`);
};

const runScenario = async (scenario: CompoundCapabilityScenario, runId: string, outputDir: string): Promise<CompoundCapabilityScenarioSummary> => {
  const threadId = `helix-ask:compound-live:${runId}:${scenario.id}`;
  const scenarioDir = path.join(outputDir, scenario.id);
  await fs.mkdir(scenarioDir, { recursive: true });
  await seedScenario(scenario, threadId, scenarioDir);

  const ask = await fetchJson<RecordLike>(`${BASE_URL}/api/agi/ask/turn`, {
    method: "POST",
    body: JSON.stringify({
      sessionId: threadId,
      question: scenario.prompt,
      mode: "read",
      debug: true,
    }),
  });
  const turnId = readString(ask.turn_id);
  const debug = turnId
    ? await fetchJson<RecordLike>(`${BASE_URL}/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
    : null;
  const summary = evaluateCompoundCapabilityScenario({ scenario, ask, debugExport: debug });
  await fs.writeFile(path.join(scenarioDir, "ask-response.json"), `${JSON.stringify(ask, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "debug-export.json"), `${JSON.stringify(debug, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "compound-probe-result.json"), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
};

const renderMarkdownSummary = (input: {
  runId: string;
  outputDir: string;
  results: CompoundCapabilityScenarioSummary[];
}): string => {
  const lines = [
    "# Helix Ask Compound Capability Live Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    `- output_dir: ${input.outputDir}`,
    "",
    "## Scenarios",
  ];
  for (const result of input.results) {
    lines.push(
      "",
      `### ${result.ok ? "PASS" : "FAIL"} ${result.id}`,
      "",
      `- turn_id: ${result.turn_id ?? "missing"}`,
      `- terminal_error_code: ${result.terminal_error_code ?? "none"}`,
      `- terminal_authority_kind: ${result.terminal_authority_kind ?? "missing"}`,
      `- visible_terminal_kind: ${result.visible_terminal_kind ?? "missing"}`,
      `- final_answer_source: ${result.final_answer_source ?? "missing"}`,
      `- requested_capabilities: ${JSON.stringify(result.requested_capabilities)}`,
      `- executed_capabilities: ${JSON.stringify(result.executed_capabilities)}`,
      `- subgoal_satisfactions: ${JSON.stringify(result.subgoal_satisfactions)}`,
      `- subgoal_rail_statuses: ${JSON.stringify(result.subgoal_rail_statuses)}`,
      `- failures: ${JSON.stringify(result.failures)}`,
    );
  }
  return `${lines.join("\n")}\n`;
};

export const selectCompoundCapabilityLiveScenarios = (
  requestedIds: string[] = SCENARIO_FILTER,
): CompoundCapabilityScenarioSelection => {
  const normalizedRequestedIds = Array.from(new Set(requestedIds.map((entry) => entry.trim()).filter(Boolean)));
  const availableIds = COMPOUND_CAPABILITY_LIVE_SCENARIOS.map((scenario) => scenario.id);
  if (normalizedRequestedIds.length === 0) {
    return {
      scenarios: COMPOUND_CAPABILITY_LIVE_SCENARIOS,
      requestedIds: [],
      unknownIds: [],
      availableIds,
    };
  }
  const knownIds = new Set(availableIds);
  return {
    scenarios: COMPOUND_CAPABILITY_LIVE_SCENARIOS.filter((scenario) => normalizedRequestedIds.includes(scenario.id)),
    requestedIds: normalizedRequestedIds,
    unknownIds: normalizedRequestedIds.filter((id) => !knownIds.has(id)),
    availableIds,
  };
};

const main = async (): Promise<void> => {
  const runId = `compound-live-${Date.now()}`;
  const outputDir = path.resolve(OUT_DIR, runId);
  await fs.mkdir(outputDir, { recursive: true });
  const selection = selectCompoundCapabilityLiveScenarios();

  if (selection.unknownIds.length || selection.scenarios.length === 0) {
    const summary = {
      ok: false,
      blocked: true,
      blocked_reason: selection.unknownIds.length ? "unknown_scenario_filter" : "no_scenarios_selected",
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      unknown_scenarios: selection.unknownIds,
      available_scenarios: selection.availableIds,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  if (DRY_RUN) {
    const summary = {
      ok: true,
      dry_run: true,
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      selected_scenarios: selection.scenarios.map((scenario) => scenario.id),
      scenarios: selection.scenarios,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const preflight = await probeAskTurnApi();
  if (!preflight.ok) {
    const summary = {
      ok: false,
      blocked: true,
      blocked_reason: preflight.reason,
      message: preflight.message,
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  const results: CompoundCapabilityScenarioSummary[] = [];
  for (const scenario of selection.scenarios) {
    try {
      results.push(await runScenario(scenario, runId, outputDir));
    } catch (error) {
      results.push({
        id: scenario.id,
        prompt: scenario.prompt,
        ok: false,
        failures: [error instanceof Error ? error.message : String(error)],
        turn_id: null,
        terminal_error_code: null,
        terminal_authority_kind: null,
        visible_terminal_kind: null,
        final_answer_source: null,
        requested_capabilities: [],
        executed_capabilities: [],
        subgoal_satisfactions: [],
        subgoal_rail_statuses: [],
      });
    }
  }

  const summary = {
    ok: results.every((result) => result.ok),
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
