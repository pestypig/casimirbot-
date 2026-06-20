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
  expectedInputBindingFromCapabilities?: Array<string | string[] | null>;
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
  selected_capabilities: Array<string | null>;
  executed_capabilities: Array<string | null>;
  observation_kinds: Array<string | null>;
  observation_refs: Array<string | null>;
  subgoal_satisfactions: Array<string | null>;
  subgoal_rail_statuses: Array<string | null>;
  subgoal_first_broken_rails: Array<string | null>;
  subgoal_rail_failure_codes: Array<string | null>;
  subgoal_repair_targets: Array<string | null>;
};

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:1498").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_COMPOUND_LIVE_OUT ?? "artifacts/helix-ask-compound-capability-live";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_COMPOUND_LIVE_TIMEOUT_MS ?? 300_000));
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_COMPOUND_LIVE_DRY_RUN === "1";
const ALLOW_ALL_LIVE_SCENARIOS =
  process.argv.includes("--allow-all-live-scenarios") ||
  process.env.HELIX_ASK_COMPOUND_LIVE_ALLOW_ALL === "1";
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

export type CompoundCapabilityLiveRunPolicy = {
  blocked: boolean;
  blocked_reason: string | null;
  message: string | null;
};

export const BROAD_LIVE_PROBE_BLOCK_MESSAGE =
  "Refusing to run every live compound scenario against a keyed server. Set HELIX_ASK_COMPOUND_LIVE_SCENARIOS to a comma-separated scenario list, or pass --allow-all-live-scenarios / HELIX_ASK_COMPOUND_LIVE_ALLOW_ALL=1.";

export const resolveCompoundCapabilityLiveRunPolicy = (input: {
  dryRun: boolean;
  scenarioFilter: string[];
  allowAllLiveScenarios: boolean;
}): CompoundCapabilityLiveRunPolicy => {
  if (input.dryRun) {
    return {
      blocked: false,
      blocked_reason: null,
      message: null,
    };
  }
  const filteredScenarioCount = input.scenarioFilter
    .map((entry) => entry.trim())
    .filter(Boolean).length;
  if (filteredScenarioCount > 0 || input.allowAllLiveScenarios) {
    return {
      blocked: false,
      blocked_reason: null,
      message: null,
    };
  }
  return {
    blocked: true,
    blocked_reason: "scenario_filter_required_for_live_probe",
    message: BROAD_LIVE_PROBE_BLOCK_MESSAGE,
  };
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
    id: "workspace_directory_then_docs",
    prompt:
      "Call workspace-directory.resolve for docs/helix-ask-codex-loop-discipline.md, then use docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md.",
    expectedRequested: ["workspace-directory.resolve", "docs-viewer.locate_in_doc"],
    expectedRuntime: ["workspace-directory.resolve", "docs-viewer.locate_in_doc"],
  },
  {
    id: "catalog_then_workspace",
    prompt: "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
    expectedRequested: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
    expectedRuntime: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
  },
  {
    id: "micro_reasoner_presets_then_draft",
    prompt:
      "Call live_env.query_micro_reasoner_presets to inspect the micro reasoner preset catalog, then call live_env.draft_micro_reasoner_preset to draft a live-source micro reasoner preset.",
    expectedRequested: ["live_env.query_micro_reasoner_presets", "live_env.draft_micro_reasoner_preset"],
    expectedRuntime: ["live_env.query_micro_reasoner_presets", "live_env.draft_micro_reasoner_preset"],
  },
  {
    id: "repo_plus_docs",
    prompt:
      "Use repo-code.search_concept to find where terminal authority is enforced, plus docs-viewer.locate_in_doc to locate the same rule in docs/helix-ask-codex-loop-discipline.md.",
    expectedRequested: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
    expectedRuntime: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
  },
  {
    id: "internet_reflection_calculator",
    prompt:
      "Use internet_search.web_research to find a cited research-paper source for Alcubierre metric energy estimates, then use helix_ask.reflect_theory_context to connect that source to the Helix Ask receipts-as-observations rule, then run scientific-calculator.solve_expression with this exact expression: (9+3)*7-25.",
    expectedRequested: [
      "internet_search.web_research",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ],
    expectedRuntime: [
      ["internet-search.search_web", "internet_search.web_research"],
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ],
    expectedInputBindingFromCapabilities: [null, "internet_search.web_research", null],
    expectedCalculatorExpression: "(9+3)*7-25",
  },
  {
    id: "scholarly_reflection_calculator",
    prompt:
      "Use scholarly-research.lookup_papers for Alcubierre metric energy estimates, then use helix_ask.reflect_theory_context to connect that scholarly source to the Helix Ask receipts-as-observations rule, then run scientific-calculator.solve_expression with this exact expression: (12+5)*3.",
    expectedRequested: [
      "scholarly-research.lookup_papers",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ],
    expectedRuntime: [
      "scholarly-research.lookup_papers",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ],
    expectedInputBindingFromCapabilities: [null, "scholarly-research.lookup_papers", null],
    expectedCalculatorExpression: "(12+5)*3",
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
    id: "civilization_bounds_reflection",
    prompt:
      "Call helix_ask.build_civilization_scenario_frame for a long-range settlement scenario, then call helix_ask.reflect_civilization_bounds to reflect collaboration and falsification bounds.",
    expectedRequested: [
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ],
    expectedRuntime: [
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ],
    expectedInputBindingFromCapabilities: [null, "helix_ask.build_civilization_scenario_frame"],
  },
  {
    id: "zen_graph_reflection_bridge",
    prompt:
      "Call helix_ask.reflect_ideology_context for wisdom under uncertainty, then call helix_ask.bridge_theory_ideology_context to bridge the theory and ideology context.",
    expectedRequested: [
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ],
    expectedRuntime: [
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ],
    expectedInputBindingFromCapabilities: [null, "helix_ask.reflect_ideology_context"],
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

const RECEIPT_TERMINAL_KINDS = new Set([
  "tool_receipt",
  "calculator_receipt",
  "workspace_action_receipt",
  "docs_viewer_receipt",
  "live_pipeline_receipt",
  "voice_receipt",
]);

const hasOwn = (record: RecordLike | null, key: string): boolean =>
  Boolean(record && Object.prototype.hasOwnProperty.call(record, key));

const jsonEqual = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

const stringArraysEqual = (left: unknown, right: unknown): boolean =>
  jsonEqual(readStringArray(left), readStringArray(right));

const mirrorArray = (input: {
  failures: string[];
  index: number;
  ledgerEntry: RecordLike | null;
  railEntry: RecordLike | null;
  key: string;
  requiredWhenLedgerHasKey?: boolean;
}): void => {
  const { failures, index, ledgerEntry, railEntry, key, requiredWhenLedgerHasKey = true } = input;
  if (!ledgerEntry || !railEntry) return;
  if (!hasOwn(ledgerEntry, key) && !requiredWhenLedgerHasKey) return;
  if (!Array.isArray(railEntry[key])) {
    failures.push(`subgoal_${index + 1}_rail_${key}_missing`);
    return;
  }
  if (Array.isArray(ledgerEntry[key]) && !jsonEqual(railEntry[key], ledgerEntry[key])) {
    failures.push(`subgoal_${index + 1}_rail_${key}_mismatch`);
  }
};

const requiredInputBindingsFor = (entry: RecordLike | null): RecordLike[] =>
  readArray(entry?.input_bindings)
    .map(readRecord)
    .filter((binding: RecordLike | null): binding is RecordLike => Boolean(binding))
    .filter((binding) => binding.required === true);

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
  const selectedCapabilities = ledger.map((entry) => maybeCapability(entry, "selected_capability"));
  const executedCapabilities = ledger.map((entry) => maybeCapability(entry, "executed_capability"));
  const observationKinds = ledger.map((entry) => maybeCapability(entry, "observation_kind"));
  const observationRefs = ledger.map((entry) => maybeCapability(entry, "observation_ref"));
  const subgoalSatisfactions = ledger.map((entry) => maybeCapability(entry, "satisfaction"));
  const subgoalRailStatuses = railStatuses.map((entry) => maybeCapability(entry, "rail_status"));
  const subgoalFirstBrokenRails = ledger.map((entry) => maybeCapability(entry, "first_broken_rail"));
  const subgoalRailFailureCodes = ledger.map((entry) => maybeCapability(entry, "rail_failure_code"));
  const subgoalRepairTargets = ledger.map((entry) => maybeCapability(entry, "repair_target"));

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
    const firstBrokenRail = maybeCapability(ledgerEntry ?? {}, "first_broken_rail");
    const repairTarget = maybeCapability(ledgerEntry ?? {}, "repair_target");
    const railFirstBrokenRail = maybeCapability(railEntry ?? {}, "first_broken_rail");
    const railFailureCode = maybeCapability(railEntry ?? {}, "rail_failure_code");
    const railRepairTarget = maybeCapability(railEntry ?? {}, "repair_target");
    const ledgerArgs = subgoalArgsFor(contractSubgoal, ledgerEntry);
    const railArgs = readRecord(railEntry?.args);
    const requiredInputBindings = requiredInputBindingsFor(ledgerEntry);
    const boundInputRefs = readArray(ledgerEntry?.bound_input_refs).map(readRecord).filter(Boolean);
    const unresolvedInputBindings = readArray(ledgerEntry?.unresolved_input_bindings).map(readRecord).filter(Boolean);
    const expectedInputBindingFromCapability = input.scenario.expectedInputBindingFromCapabilities?.[index];
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
    if (!ledgerArgs) failures.push(`subgoal_${index + 1}_args_missing`);
    if (expectedSatisfaction === "satisfied") {
      if (!observationKind) failures.push(`subgoal_${index + 1}_observation_kind_missing`);
      if (!observationRef) failures.push(`subgoal_${index + 1}_observation_ref_missing`);
    }
    if (!matchesExpected(satisfaction, expectedSatisfaction)) {
      failures.push(`subgoal_${index + 1}_satisfaction_mismatch:${satisfaction ?? "null"}`);
    }
    if (satisfaction && satisfaction !== "satisfied") {
      if (!firstBrokenRail) failures.push(`subgoal_${index + 1}_first_broken_rail_missing`);
      if (!repairTarget) failures.push(`subgoal_${index + 1}_repair_target_missing`);
    }
    if (expectedInputBindingFromCapability !== undefined) {
      if (expectedInputBindingFromCapability === null) {
        if (requiredInputBindings.length > 0) failures.push(`subgoal_${index + 1}_unexpected_required_input_binding`);
      } else {
        const expectedFromCapabilities = Array.isArray(expectedInputBindingFromCapability)
          ? expectedInputBindingFromCapability
          : [expectedInputBindingFromCapability];
        const actualFromCapabilities = requiredInputBindings
          .map((binding) => readString(binding.from_capability))
          .filter((entry: string | null): entry is string => Boolean(entry));
        const missing = expectedFromCapabilities.filter((entry) => !actualFromCapabilities.includes(entry));
        if (missing.length > 0) {
          failures.push(`subgoal_${index + 1}_input_binding_from_capability_missing:${missing.join(",")}`);
        }
      }
    }
    if (expectedSatisfaction === "satisfied" && requiredInputBindings.length > 0) {
      if (boundInputRefs.length === 0) failures.push(`subgoal_${index + 1}_bound_input_refs_missing`);
      if (unresolvedInputBindings.length > 0) failures.push(`subgoal_${index + 1}_unresolved_input_bindings_present`);
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
      if (railFirstBrokenRail !== firstBrokenRail) {
        failures.push(`subgoal_${index + 1}_rail_first_broken_rail_mismatch:${railFirstBrokenRail ?? "null"}!=${firstBrokenRail ?? "null"}`);
      }
      if (railRepairTarget !== repairTarget) {
        failures.push(`subgoal_${index + 1}_rail_repair_target_mismatch:${railRepairTarget ?? "null"}!=${repairTarget ?? "null"}`);
      }
      if (railSatisfaction && railSatisfaction !== "satisfied") {
        if (!railFirstBrokenRail) failures.push(`subgoal_${index + 1}_rail_first_broken_rail_missing`);
        if (!railRepairTarget) failures.push(`subgoal_${index + 1}_rail_repair_target_missing`);
      }
      if (!railArgs) {
        failures.push(`subgoal_${index + 1}_rail_args_missing`);
      } else if (ledgerArgs && !jsonEqual(railArgs, ledgerArgs)) {
        failures.push(`subgoal_${index + 1}_rail_args_mismatch`);
      }
      mirrorArray({ failures, index, ledgerEntry, railEntry, key: "required_args" });
      mirrorArray({ failures, index, ledgerEntry, railEntry, key: "optional_args" });
      mirrorArray({ failures, index, ledgerEntry, railEntry, key: "input_bindings" });
      mirrorArray({ failures, index, ledgerEntry, railEntry, key: "bound_input_refs" });
      mirrorArray({ failures, index, ledgerEntry, railEntry, key: "unresolved_input_bindings" });
      if (ledgerEntry && railEntry && hasOwn(ledgerEntry, "support_refs")) {
        if (!Array.isArray(railEntry.support_refs)) {
          failures.push(`subgoal_${index + 1}_rail_support_refs_missing`);
        } else if (!stringArraysEqual(railEntry.support_refs, ledgerEntry.support_refs)) {
          failures.push(`subgoal_${index + 1}_rail_support_refs_mismatch`);
        }
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
    const railExpression = expressionFor(readRecord(railStatuses[calculatorIndex]?.args));
    if (railExpression !== input.scenario.expectedCalculatorExpression) {
      failures.push(`calculator_rail_expression_mismatch:${railExpression ?? "null"}`);
    }
    if (railExpression && /workspace_os\.status|docs-viewer|repo-code|situation-room|then|plus/i.test(railExpression)) {
      failures.push("calculator_rail_expression_contains_non_math_prompt_text");
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
  if (input.scenario.expectedTerminalErrorCode === undefined) {
    if (!terminalAuthorityKind) failures.push("terminal_authority_kind_missing");
    if (!visibleTerminalKind) failures.push("visible_terminal_kind_missing");
  }
  if (terminalAuthorityKind && visibleTerminalKind && terminalAuthorityKind !== visibleTerminalKind) {
    failures.push(`terminal_projection_mismatch:${terminalAuthorityKind}!=${visibleTerminalKind}`);
  }
  if (input.scenario.expectedTerminalErrorCode === undefined) {
    if (terminalAuthorityKind && RECEIPT_TERMINAL_KINDS.has(terminalAuthorityKind)) {
      failures.push(`receipt_terminal_forbidden:${terminalAuthorityKind}`);
    }
    if (finalAnswerSource && RECEIPT_TERMINAL_KINDS.has(finalAnswerSource)) {
      failures.push(`receipt_final_answer_source_forbidden:${finalAnswerSource}`);
    }
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
    selected_capabilities: selectedCapabilities,
    executed_capabilities: executedCapabilities,
    observation_kinds: observationKinds,
    observation_refs: observationRefs,
    subgoal_satisfactions: subgoalSatisfactions,
    subgoal_rail_statuses: subgoalRailStatuses,
    subgoal_first_broken_rails: subgoalFirstBrokenRails,
    subgoal_rail_failure_codes: subgoalRailFailureCodes,
    subgoal_repair_targets: subgoalRepairTargets,
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
  selectedScenarioIds?: string[];
  results: CompoundCapabilityScenarioSummary[];
}): string => {
  const lines = [
    "# Helix Ask Compound Capability Live Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    `- output_dir: ${input.outputDir}`,
    `- selected_scenarios: ${JSON.stringify(input.selectedScenarioIds ?? input.results.map((result) => result.id))}`,
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
      `- selected_capabilities: ${JSON.stringify(result.selected_capabilities)}`,
      `- executed_capabilities: ${JSON.stringify(result.executed_capabilities)}`,
      `- observation_kinds: ${JSON.stringify(result.observation_kinds)}`,
      `- observation_refs: ${JSON.stringify(result.observation_refs)}`,
      `- subgoal_satisfactions: ${JSON.stringify(result.subgoal_satisfactions)}`,
      `- subgoal_rail_statuses: ${JSON.stringify(result.subgoal_rail_statuses)}`,
      `- subgoal_first_broken_rails: ${JSON.stringify(result.subgoal_first_broken_rails)}`,
      `- subgoal_rail_failure_codes: ${JSON.stringify(result.subgoal_rail_failure_codes)}`,
      `- subgoal_repair_targets: ${JSON.stringify(result.subgoal_repair_targets)}`,
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
  const selectedScenarioIds = selection.scenarios.map((scenario) => scenario.id);

  if (selection.unknownIds.length || selection.scenarios.length === 0) {
    const summary = {
      ok: false,
      blocked: true,
      blocked_reason: selection.unknownIds.length ? "unknown_scenario_filter" : "no_scenarios_selected",
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      selected_scenarios: selectedScenarioIds,
      scenario_count: selection.scenarios.length,
      unknown_scenarios: selection.unknownIds,
      available_scenarios: selection.availableIds,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, selectedScenarioIds, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  const liveRunPolicy = resolveCompoundCapabilityLiveRunPolicy({
    dryRun: DRY_RUN,
    scenarioFilter: SCENARIO_FILTER,
    allowAllLiveScenarios: ALLOW_ALL_LIVE_SCENARIOS,
  });

  if (liveRunPolicy.blocked) {
    const summary = {
      ok: false,
      blocked: true,
      blocked_reason: liveRunPolicy.blocked_reason,
      message: liveRunPolicy.message,
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      selected_scenarios: selectedScenarioIds,
      scenario_count: selection.scenarios.length,
      available_scenarios: selection.availableIds,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, selectedScenarioIds, results: [] }));
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
      selected_scenarios: selectedScenarioIds,
      scenario_count: selection.scenarios.length,
      scenarios: selection.scenarios,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, selectedScenarioIds, results: [] }));
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
      selected_scenarios: selectedScenarioIds,
      scenario_count: selection.scenarios.length,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, selectedScenarioIds, results: [] }));
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
        selected_capabilities: [],
        executed_capabilities: [],
        observation_kinds: [],
        observation_refs: [],
        subgoal_satisfactions: [],
        subgoal_rail_statuses: [],
        subgoal_first_broken_rails: [],
        subgoal_rail_failure_codes: [],
        subgoal_repair_targets: [],
      });
    }
  }

  const summary = {
    ok: results.every((result) => result.ok),
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    selected_scenarios: selectedScenarioIds,
    scenario_count: selection.scenarios.length,
    passed_count: results.filter((result) => result.ok).length,
    failed_count: results.filter((result) => !result.ok).length,
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, selectedScenarioIds, results }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
