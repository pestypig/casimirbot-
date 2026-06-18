import fs from "node:fs/promises";
import path from "node:path";
import {
  CODEX_PARITY_AGENT_SPINE_CLASSES,
  CODEX_PARITY_AGENT_SPINE_RAIL_STATUSES,
  CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA,
  CODEX_PARITY_AGENT_SPINE_REENTRY_STATUSES,
  CODEX_PARITY_AGENT_SPINE_STRING_OR_NULL_FIELDS,
} from "../server/services/helix-ask/codex-parity-agent-spine-contract";

type RecordLike = Record<string, unknown>;

type Verdict = "PASS" | "WARN" | "FAIL";

type ToolChainPreflight = {
  ok: boolean;
  status: number;
  reason: string;
  message: string;
  hint?: string;
};

type RailSummary = {
  present: boolean;
  turn_id: string | null;
  prompt: string | null;
  requested_capability: string | null;
  visible_tool_surface: string[];
  visible_tool_surface_original_count: number | null;
  visible_tool_surface_truncated: boolean | null;
  selected_capability: string | null;
  admitted_capability: string | null;
  admission_proof_source: string | null;
  admission_proven: boolean;
  executed_capability: string | null;
  observation_kind: string | null;
  observation_ref: string | null;
  required_observation_kinds_for_requested_capability: string[];
  observed_artifact_supports_requested_capability: boolean | null;
  reentry_status: string | null;
  reentry_proof_source: string | null;
  reentry_proven: boolean;
  goal_satisfaction: string | null;
  required_terminal_kind: string | null;
  selected_terminal_kind: string | null;
  terminal_authority_proof_source: string | null;
  terminal_authority_proven: boolean;
  visible_terminal_kind: string | null;
  visible_projection_source: string | null;
  visible_projection_proven: boolean;
  first_broken_rail: string | null;
  repair_target: string | null;
  codex_parity_class: string | null;
  normalized_codex_parity_classes: string[];
  rail_status: string | null;
  rail_failure_code: string | null;
};

type ToolChainScenario = {
  id: string;
  prompt: string;
  category:
    | "workstation_tool"
    | "docs_source"
    | "calculator_tool"
    | "mutating_guard"
    | "note_mutation"
    | "situation_room"
    | "voice_policy"
    | "negated_tool"
    | "repo_evidence";
};

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5050").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_TOOL_CHAIN_OUT ?? "artifacts/helix-ask-tool-chain-matrix";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_TOOL_CHAIN_TIMEOUT_MS ?? 240_000));
const FAIL_ON_WARN = process.env.HELIX_ASK_TOOL_CHAIN_FAIL_ON_WARN === "1";
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_TOOL_CHAIN_DRY_RUN === "1";
const SCENARIO_FILTER = (process.env.HELIX_ASK_TOOL_CHAIN_SCENARIOS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const SCENARIOS: ToolChainScenario[] = [
  {
    id: "docs_open",
    category: "workstation_tool",
    prompt: "Open the docs viewer.",
  },
  {
    id: "docs_loop_discipline_summary",
    category: "docs_source",
    prompt:
      "Open the docs viewer, find the Helix Ask Codex loop discipline document, and summarize what it says about receipts and final answers.",
  },
  {
    id: "calculator_steps",
    category: "calculator_tool",
    prompt: "Open the scientific calculator, solve 2*(3+4), and explain the steps.",
  },
  {
    id: "note_delete_guard",
    category: "mutating_guard",
    prompt: "Delete my active note.",
  },
  {
    id: "note_create_receipt_quarantine",
    category: "note_mutation",
    prompt: "Create a note titled Tool Chain Receipt Test with the text receipts stay side artifacts.",
  },
  {
    id: "dottie_minecraft_missing_source",
    category: "situation_room",
    prompt: "Set up Auntie Dottie to watch Minecraft route drift.",
  },
  {
    id: "voice_readout_guard",
    category: "voice_policy",
    prompt: "Have Dottie read that out loud.",
  },
  {
    id: "negated_docs_open",
    category: "negated_tool",
    prompt: "Do not open the docs viewer; just explain what the docs viewer is for.",
  },
  {
    id: "auntie_dottie_repo",
    category: "repo_evidence",
    prompt: "What is Auntie Dottie in this app?",
  },
];

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readString = (value: unknown): string => (typeof value === "string" ? value : "");

const readNullableString = (value: unknown): string | null => {
  const text = readString(value).trim();
  return text ? text : null;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const parseJsonRecord = (text: string): RecordLike | null => {
  try {
    return readRecord(JSON.parse(text));
  } catch {
    return null;
  }
};

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as RecordLike)[key];
  }, value);

const hashText = async (text: string): Promise<string> => {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
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

const probeAskTurnApi = async (): Promise<ToolChainPreflight> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(TIMEOUT_MS, 10_000));
  const url = `${BASE_URL}/api/agi/ask/turn/__helix_tool_chain_preflight__/debug-export?view=rail`;
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    const text = await response.text();
    const payload = parseJsonRecord(text);
    const error = readString(payload?.error);
    const terminalError = readString(payload?.terminal_error_code);
    if (response.ok || error === "debug_export_not_found" || terminalError === "debug_export_turn_not_found") {
      return {
        ok: true,
        status: response.status,
        reason: response.ok ? "ask_turn_debug_export_available" : "ask_turn_routes_available",
        message: response.ok ? "Ask turn debug-export endpoint is available." : "Ask turn routes are mounted; fake turn was not found as expected.",
      };
    }
    if (error === "api_not_found") {
      return {
        ok: false,
        status: response.status,
        reason: "ask_turn_api_not_found",
        message: "The server is reachable, but /api/agi/ask/turn is not mounted.",
        hint: readString(payload?.hint) || "Start the keyed bundle with ENABLE_AGI=1 and the Ask turn API enabled.",
      };
    }
    return {
      ok: false,
      status: response.status,
      reason: error || terminalError || `status_${response.status}`,
      message: text.slice(0, 1200) || response.statusText || "Ask turn API preflight failed.",
      hint: "Verify the operator-started keyed server exposes /api/agi/ask/turn.",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      reason: error instanceof Error && error.name === "AbortError" ? "ask_turn_api_preflight_timeout" : "ask_turn_api_unreachable",
      message: error instanceof Error ? error.message : String(error),
      hint: "Start the operator-owned keyed Helix Ask server before running the tool-chain matrix probe.",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const getPayload = (ask: RecordLike, debug: RecordLike | null): RecordLike => {
  const debugPayload = readRecord(debug?.payload);
  if (debugPayload) return debugPayload;
  const nestedDebug = readRecord(debug?.debug);
  const nestedPayload = readRecord(nestedDebug?.payload);
  if (nestedPayload) return nestedPayload;
  return ask;
};

const findRailTable = (ask: RecordLike, payload: RecordLike, debug: RecordLike | null): RecordLike | null =>
  readRecord(ask.codex_parity_agent_spine_rail_table) ??
  readRecord(payload.codex_parity_agent_spine_rail_table) ??
  readRecord(getPath(payload, ["debug", "codex_parity_agent_spine_rail_table"])) ??
  readRecord(getPath(payload, ["artifact_query_index", "codex_parity_agent_spine_rail_table"])) ??
  readRecord(getPath(payload, ["debug", "artifact_query_index", "codex_parity_agent_spine_rail_table"])) ??
  readRecord(debug?.codex_parity_agent_spine_rail_table) ??
  readRecord(getPath(debug, ["payload", "codex_parity_agent_spine_rail_table"]));

const railSummaryFor = (railTable: RecordLike | null): RailSummary => ({
  present: Boolean(railTable),
  turn_id: readNullableString(railTable?.turn_id),
  prompt: readNullableString(railTable?.prompt),
  requested_capability: readNullableString(railTable?.requested_capability),
  visible_tool_surface: readStringArray(railTable?.visible_tool_surface),
  visible_tool_surface_original_count:
    typeof railTable?.visible_tool_surface_original_count === "number" && Number.isFinite(railTable.visible_tool_surface_original_count)
      ? railTable.visible_tool_surface_original_count
      : null,
  visible_tool_surface_truncated:
    typeof railTable?.visible_tool_surface_truncated === "boolean" ? railTable.visible_tool_surface_truncated : null,
  selected_capability: readNullableString(railTable?.selected_capability),
  admitted_capability: readNullableString(railTable?.admitted_capability),
  admission_proof_source: readNullableString(railTable?.admission_proof_source),
  admission_proven: railTable?.admission_proven === true,
  executed_capability: readNullableString(railTable?.executed_capability),
  observation_kind: readNullableString(railTable?.observation_kind),
  observation_ref: readNullableString(railTable?.observation_ref),
  required_observation_kinds_for_requested_capability: readStringArray(railTable?.required_observation_kinds_for_requested_capability),
  observed_artifact_supports_requested_capability:
    typeof railTable?.observed_artifact_supports_requested_capability === "boolean"
      ? railTable.observed_artifact_supports_requested_capability
      : null,
  reentry_status: readNullableString(railTable?.reentry_status),
  reentry_proof_source: readNullableString(railTable?.reentry_proof_source),
  reentry_proven: railTable?.reentry_proven === true,
  goal_satisfaction: readNullableString(railTable?.goal_satisfaction),
  required_terminal_kind: readNullableString(railTable?.required_terminal_kind),
  selected_terminal_kind: readNullableString(railTable?.selected_terminal_kind),
  terminal_authority_proof_source: readNullableString(railTable?.terminal_authority_proof_source),
  terminal_authority_proven: railTable?.terminal_authority_proven === true,
  visible_terminal_kind: readNullableString(railTable?.visible_terminal_kind),
  visible_projection_source: readNullableString(railTable?.visible_projection_source),
  visible_projection_proven: railTable?.visible_projection_proven === true,
  first_broken_rail: readNullableString(railTable?.first_broken_rail),
  repair_target: readNullableString(railTable?.repair_target),
  codex_parity_class: readNullableString(railTable?.codex_parity_class),
  normalized_codex_parity_classes: readStringArray(railTable?.normalized_codex_parity_classes),
  rail_status: readNullableString(railTable?.rail_status),
  rail_failure_code: readNullableString(railTable?.rail_failure_code),
});

const collectRailTableFailures = (input: {
  railTable: RecordLike | null;
  terminalKind: string;
  turnId: string;
  prompt: string;
}): string[] => {
  const { railTable, terminalKind, turnId, prompt } = input;
  if (!railTable) return ["codex_parity_agent_spine_rail_table_missing"];
  const failures: string[] = [];
  if (railTable.schema !== CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA) {
    failures.push(`rail_table_schema_mismatch:${readString(railTable.schema) || "missing"}`);
  }
  if (readString(railTable.turn_id) !== turnId) {
    failures.push(`rail_turn_id_mismatch:${readString(railTable.turn_id) || "missing"}!=${turnId || "missing"}`);
  }
  if (readString(railTable.prompt) !== prompt) {
    failures.push("rail_prompt_mismatch");
  }
  if (railTable.assistant_answer !== false) failures.push("rail_assistant_answer_not_false");
  if (railTable.terminal_eligible !== false) failures.push("rail_terminal_eligible_not_false");
  if (railTable.raw_content_included !== false) failures.push("rail_raw_content_included_not_false");
  if (!Array.isArray(railTable.visible_tool_surface)) failures.push("rail_visible_tool_surface_missing");
  for (const key of CODEX_PARITY_AGENT_SPINE_STRING_OR_NULL_FIELDS) {
    const value = railTable[key];
    if (value !== null && typeof value !== "string") failures.push(`rail_string_or_null_field_invalid:${key}`);
  }
  if (!CODEX_PARITY_AGENT_SPINE_REENTRY_STATUSES.includes(railTable.reentry_status as never)) {
    failures.push(`rail_reentry_status_invalid:${readString(railTable.reentry_status) || "missing"}`);
  }
  const reentryStatus = readString(railTable.reentry_status);
  const reentryProofSource = readString(railTable.reentry_proof_source);
  if (reentryStatus === "reentered" && !reentryProofSource) {
    failures.push("rail_reentry_proof_source_missing");
  }
  if (reentryStatus === "reentered" && railTable.reentry_proven !== true) {
    failures.push("rail_reentry_not_proven");
  }
  if (!CODEX_PARITY_AGENT_SPINE_RAIL_STATUSES.includes(railTable.rail_status as never)) {
    failures.push(`rail_status_invalid:${readString(railTable.rail_status) || "missing"}`);
  }
  const codexParityClass = readString(railTable.codex_parity_class);
  if (!CODEX_PARITY_AGENT_SPINE_CLASSES.includes(codexParityClass as (typeof CODEX_PARITY_AGENT_SPINE_CLASSES)[number])) {
    failures.push(`rail_codex_parity_class_invalid:${codexParityClass || "missing"}`);
  }
  if (JSON.stringify(readStringArray(railTable.normalized_codex_parity_classes)) !== JSON.stringify(CODEX_PARITY_AGENT_SPINE_CLASSES)) {
    failures.push("rail_normalized_codex_parity_classes_mismatch");
  }
  const selectedCapability = readString(railTable.selected_capability);
  const admittedCapability = readString(railTable.admitted_capability);
  const executedCapability = readString(railTable.executed_capability);
  const requestedCapability = readString(railTable.requested_capability);
  const goalSatisfaction = readString(railTable.goal_satisfaction);
  const requiredObservationKinds = readStringArray(railTable.required_observation_kinds_for_requested_capability);
  const observationSupportsRequested = railTable.observed_artifact_supports_requested_capability;
  const admissionProofSource = readString(railTable.admission_proof_source);
  if ((selectedCapability || executedCapability) && !admittedCapability) {
    failures.push("rail_admitted_capability_missing");
  }
  if (admittedCapability && !admissionProofSource) {
    failures.push("rail_admission_proof_source_missing");
  }
  if (admittedCapability && railTable.admission_proven !== true) {
    failures.push("rail_admission_not_proven");
  }
  if (requestedCapability && !Array.isArray(railTable.required_observation_kinds_for_requested_capability)) {
    failures.push("rail_requested_observation_kinds_missing");
  }
  if (requestedCapability && typeof observationSupportsRequested !== "boolean") {
    failures.push("rail_observation_support_verdict_missing");
  }
  if (
    requestedCapability &&
    (goalSatisfaction === "satisfied" || readString(railTable.rail_status) === "complete" || codexParityClass === "complete") &&
    requiredObservationKinds.length > 0 &&
    observationSupportsRequested !== true
  ) {
    failures.push("rail_goal_satisfied_without_requested_observation_support");
  }
  const selectedTerminalKind = readString(railTable.selected_terminal_kind);
  const visibleTerminalKind = readString(railTable.visible_terminal_kind);
  const terminalAuthorityProofSource = readString(railTable.terminal_authority_proof_source);
  const visibleProjectionSource = readString(railTable.visible_projection_source);
  if (selectedTerminalKind && !terminalAuthorityProofSource) {
    failures.push("rail_terminal_authority_proof_source_missing");
  }
  if (selectedTerminalKind && railTable.terminal_authority_proven !== true) {
    failures.push("rail_terminal_authority_not_proven");
  }
  if (visibleTerminalKind && !visibleProjectionSource) {
    failures.push("rail_visible_projection_source_missing");
  }
  if (visibleTerminalKind && railTable.visible_projection_proven !== true) {
    failures.push("rail_visible_projection_not_proven");
  }
  const firstBrokenRail = readString(railTable.first_broken_rail);
  if (codexParityClass === "complete" && firstBrokenRail) {
    failures.push(`rail_complete_with_first_broken_rail:${firstBrokenRail}`);
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && reentryStatus !== "reentered") {
    failures.push(`rail_complete_without_reentry:${reentryStatus || "missing"}`);
  }
  if ((readString(railTable.rail_status) === "complete") !== (codexParityClass === "complete")) {
    failures.push(
      `rail_completion_status_class_mismatch:${readString(railTable.rail_status) || "missing"}/${codexParityClass || "missing"}`,
    );
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && !selectedTerminalKind) {
    failures.push("rail_complete_without_terminal_authority");
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && !visibleTerminalKind) {
    failures.push("rail_complete_without_visible_projection");
  }
  if (codexParityClass && codexParityClass !== "complete" && !firstBrokenRail) {
    failures.push("rail_non_complete_without_first_broken_rail");
  }
  if (selectedTerminalKind && visibleTerminalKind && selectedTerminalKind !== visibleTerminalKind) {
    failures.push(`rail_selected_visible_terminal_kind_mismatch:${selectedTerminalKind}!=${visibleTerminalKind}`);
  }
  if (terminalKind && selectedTerminalKind && terminalKind !== selectedTerminalKind) {
    failures.push(`rail_selected_terminal_kind_payload_mismatch:${selectedTerminalKind}!=${terminalKind}`);
  }
  if (terminalKind && visibleTerminalKind && terminalKind !== visibleTerminalKind) {
    failures.push(`rail_visible_terminal_kind_payload_mismatch:${visibleTerminalKind}!=${terminalKind}`);
  }
  return failures;
};

const collectTimelineEvents = (payload: RecordLike, debug: RecordLike | null): RecordLike[] => {
  const candidates = [
    readRecord(payload.causal_turn_timeline),
    readRecord(readRecord(payload.debug)?.causal_turn_timeline),
    readRecord(debug?.causal_turn_timeline),
    readRecord(readRecord(debug?.debug)?.causal_turn_timeline),
  ].filter(Boolean) as RecordLike[];
  for (const candidate of candidates) {
    const events = readArray(candidate.events).map(readRecord).filter(Boolean) as RecordLike[];
    if (events.length) return events;
  }
  return [];
};

const collectLedger = (payload: RecordLike, debug: RecordLike | null): RecordLike[] => {
  const candidates = [
    payload.current_turn_artifact_ledger,
    readRecord(payload.debug)?.current_turn_artifact_ledger,
    debug?.current_turn_artifact_ledger,
    readRecord(debug?.debug)?.current_turn_artifact_ledger,
  ];
  for (const candidate of candidates) {
    const ledger = readArray(candidate).map(readRecord).filter(Boolean) as RecordLike[];
    if (ledger.length) return ledger;
  }
  return [];
};

const collectCapabilities = (payload: RecordLike, timelineEvents: RecordLike[], ledger: RecordLike[]): string[] => {
  const values = new Set<string>();
  for (const event of timelineEvents) {
    for (const key of ["selected_capability", "runtime_tool_call_id", "model_step_capability"]) {
      const value = readString(event[key]);
      if (value) values.add(value);
    }
  }
  const loop = readRecord(payload.agent_runtime_loop);
  for (const iteration of readArray(loop?.iterations).map(readRecord).filter(Boolean) as RecordLike[]) {
    const decision = readRecord(iteration.decision) ?? iteration;
    const call = readRecord(decision.runtime_tool_call) ?? readRecord(iteration.runtime_tool_call);
    for (const value of [
      readString(decision.chosen_capability),
      readString(call?.capability_key),
      readString(call?.panel_id) && readString(call?.action)
        ? `${readString(call?.panel_id)}.${readString(call?.action)}`
        : "",
    ]) {
      if (value) values.add(value);
    }
  }
  for (const artifact of ledger) {
    const payloadRecord = readRecord(artifact.payload) ?? artifact;
    const call = readRecord(payloadRecord.runtime_tool_call) ?? payloadRecord;
    for (const value of [
      readString(payloadRecord.chosen_capability),
      readString(payloadRecord.capability_key),
      readString(call.panel_id) && readString(call.action) ? `${readString(call.panel_id)}.${readString(call.action)}` : "",
      readString(payloadRecord.model_step_capability),
    ]) {
      if (value) values.add(value);
    }
  }
  return [...values].sort();
};

const collectArtifactKinds = (ledger: RecordLike[]): string[] => {
  const values = new Set<string>();
  for (const artifact of ledger) {
    const payload = readRecord(artifact.payload) ?? artifact;
    for (const value of [readString(artifact.kind), readString(artifact.schema), readString(payload.schema)]) {
      if (value) values.add(value);
    }
  }
  return [...values].sort();
};

const findTerminalWriter = (payload: RecordLike, debug: RecordLike | null): RecordLike | null => {
  for (const value of [
    payload.terminal_authority_single_writer,
    readRecord(payload.debug)?.terminal_authority_single_writer,
    debug?.terminal_authority_single_writer,
    readRecord(debug?.debug)?.terminal_authority_single_writer,
  ]) {
    const record = readRecord(value);
    if (record) return record;
  }
  return null;
};

const visibleTextOf = (ask: RecordLike, payload: RecordLike, terminalWriter: RecordLike | null): string => {
  return (
    readString(terminalWriter?.visible_text) ||
    readString(payload.visible_text) ||
    readString(payload.text) ||
    readString(payload.answer) ||
    readString(ask.text) ||
    readString(ask.answer)
  );
};

const getTerminalKind = (ask: RecordLike, payload: RecordLike, terminalWriter: RecordLike | null): string =>
  readString(terminalWriter?.selected_terminal_artifact_kind) ||
  readString(payload.terminal_artifact_kind) ||
  readString(ask.terminal_artifact_kind);

const getTerminalError = (ask: RecordLike, payload: RecordLike): string =>
  readString(payload.terminal_error_code) || readString(ask.terminal_error_code);

const hasToolObservation = (timelineEvents: RecordLike[], ledger: RecordLike[], artifactKinds: string[]): boolean =>
  timelineEvents.some((event) => readString(event.stage) === "tool_observation_created") ||
  artifactKinds.some((kind) => kind.includes("agent_step_observation_packet")) ||
  ledger.some((artifact) => {
    const payload = readRecord(artifact.payload) ?? artifact;
    return readString(payload.schema).includes("agent_step_observation_packet");
  });

const hasPostToolModelStep = (timelineEvents: RecordLike[]): boolean => {
  const observationIndex = timelineEvents.findIndex((event) => readString(event.stage) === "tool_observation_created");
  if (observationIndex < 0) return false;
  return timelineEvents.slice(observationIndex + 1).some((event) => {
    const stage = readString(event.stage);
    return stage === "model_step_decided" || stage === "model_answer_artifact_created";
  });
};

const receiptLeak = (visibleText: string): boolean =>
  /\b(as indicated by|according to|based on)\b.{0,80}\breceipt\b/i.test(visibleText) ||
  /\bworkspace action receipt\b/i.test(visibleText) ||
  /\breceipt\b.{0,80}\b(confirming|confirms|generated confirming)\b/i.test(visibleText);

const genericTerminalFailureVisible = (visibleText: string): boolean =>
  /I could not produce a terminal answer for this turn/i.test(visibleText) ||
  /I could not complete this turn because the terminal boundary blocked/i.test(visibleText);

const completeRailEnvelopeFailures = (input: {
  railTable: RecordLike | null;
  terminalKind: string;
  terminalError: string;
  visibleText: string;
}): string[] => {
  const railTable = input.railTable;
  if (!railTable) return [];
  const railComplete =
    readString(railTable.codex_parity_class) === "complete" ||
    readString(railTable.rail_status) === "complete";
  if (!railComplete) return [];
  const failures: string[] = [];
  if (input.terminalError) failures.push(`complete_rail_terminal_error:${input.terminalError}`);
  if (input.terminalKind === "typed_failure") failures.push("complete_rail_typed_failure_terminal");
  if (!input.visibleText.trim()) failures.push("complete_rail_missing_final_answer_text");
  if (genericTerminalFailureVisible(input.visibleText)) failures.push("complete_rail_generic_failure_visible");
  return failures;
};

const policyClaimInversionVisible = (visibleText: string): boolean =>
  /\breceipts?\b.{0,140}\b(validat(?:e|es|ing)|authoriz(?:e|es|ing)|confirm(?:s|ing)?|derive[sd]?)\b.{0,140}\bfinal answers?\b/i.test(
    visibleText,
  ) ||
  /\bfinal answers?\b.{0,140}\b(derived from|validated by|confirmed by)\b.{0,80}\breceipts?\b/i.test(visibleText);

const looksLikeSuccessfulDelete = (visibleText: string): boolean =>
  /\b(deleted|removed)\b.{0,60}\b(note|active note)\b/i.test(visibleText) &&
  !/\b(confirm|confirmation|before|would|need)\b/i.test(visibleText);

const looksLikeSpoken = (visibleText: string): boolean =>
  /\b(spoken|read aloud|said out loud|voice delivery completed)\b/i.test(visibleText) &&
  !/\b(proposed|proposal|confirm|confirmation|not spoken|would)\b/i.test(visibleText);

const includesAny = (values: string[], pattern: RegExp): boolean => values.some((value) => pattern.test(value));

const classifyScenario = (input: {
  scenario: ToolChainScenario;
  capabilities: string[];
  artifactKinds: string[];
  terminalKind: string;
  terminalError: string;
  timelineEvents: RecordLike[];
  visibleText: string;
  terminalWriter: RecordLike | null;
  railTable: RecordLike | null;
  turnId: string;
  debugAvailable: boolean;
  repoPacketPresent: boolean;
}): { verdict: Verdict; failures: string[]; warnings: string[] } => {
  const failures: string[] = [];
  const warnings: string[] = [];
  const {
    scenario,
    capabilities,
    artifactKinds,
    terminalKind,
    terminalError,
    timelineEvents,
    visibleText,
    terminalWriter,
    railTable,
    turnId,
    debugAvailable,
    repoPacketPresent,
  } = input;

  if (!debugAvailable) warnings.push("debug_export_missing");
  failures.push(...collectRailTableFailures({ railTable, terminalKind, turnId, prompt: scenario.prompt }));
  failures.push(...completeRailEnvelopeFailures({ railTable, terminalKind, terminalError, visibleText }));
  if (!timelineEvents.length) warnings.push("causal_timeline_missing");
  if (receiptLeak(visibleText)) failures.push("receipt_framing_leaked_into_visible_answer");
  if (genericTerminalFailureVisible(visibleText)) {
    failures.push("generic_terminal_failure_visible");
  }
  if (terminalKind === "workspace_action_receipt") failures.push("receipt_selected_as_terminal");
  if (terminalWriter && terminalWriter.applied === false) warnings.push("terminal_single_writer_not_applied");

  if (scenario.category === "workstation_tool") {
    if (!includesAny(capabilities, /docs-viewer\.open|docs-viewer.*open/i)) failures.push("docs_viewer_open_not_selected");
    if (!input.artifactKinds.some((kind) => kind.includes("agent_step_observation_packet"))) {
      warnings.push("tool_observation_artifact_not_seen");
    }
    if (hasToolObservation(timelineEvents, [], artifactKinds) && !hasPostToolModelStep(timelineEvents)) {
      failures.push("tool_observation_did_not_reenter_model");
    }
  }

  if (scenario.category === "docs_source") {
    if (!repoPacketPresent && !input.artifactKinds.some((kind) => /repo_docs_synthesis_packet|agent_step_observation_packet/i.test(kind))) {
      failures.push("docs_source_no_synthesis_or_observation_packet");
    }
    if (policyClaimInversionVisible(visibleText)) failures.push("policy_claim_inversion_visible");
    if (/missing_allowed_terminal_artifact|repo_evidence_synthesis_failed/i.test(terminalError)) {
      failures.push(`terminal_error_${terminalError}`);
    }
  }

  if (scenario.category === "calculator_tool") {
    if (!includesAny(capabilities, /scientific-calculator|calculator/i)) warnings.push("calculator_capability_not_seen");
    if (terminalKind === "client_projection" || terminalKind.includes("receipt")) failures.push("calculator_receipt_or_projection_terminal");
    if (terminalError) failures.push(`calculator_terminal_error_${terminalError}`);
  }

  if (scenario.category === "mutating_guard") {
    if (looksLikeSuccessfulDelete(visibleText)) failures.push("delete_note_appears_executed_without_confirmation");
    if (!/request_user_input|typed_failure|model_synthesized_answer|direct_answer_text/.test(terminalKind)) {
      warnings.push(`unexpected_mutating_terminal_kind_${terminalKind || "missing"}`);
    }
    if (!/confirm|confirmation|need|cannot|could not|request|before/i.test(visibleText)) {
      warnings.push("mutating_guard_visible_text_does_not_request_or_explain_confirmation");
    }
  }

  if (scenario.category === "note_mutation") {
    if (!includesAny(capabilities, /workstation-notes\.(create_note|append_to_note)|notes/i)) {
      warnings.push("note_mutation_capability_not_seen");
    }
    if (/note_.*receipt|workspace_action_receipt/i.test(terminalKind)) {
      failures.push("note_receipt_selected_as_terminal");
    }
    if (!/model_synthesized_answer|request_user_input|typed_failure/.test(terminalKind)) {
      warnings.push(`unexpected_note_mutation_terminal_kind_${terminalKind || "missing"}`);
    }
    if (/\b(note_update_receipt|note action receipt|workspace action receipt)\b/i.test(visibleText)) {
      failures.push("note_receipt_debug_name_visible");
    }
    if (receiptLeak(visibleText)) failures.push("note_receipt_framing_leaked_into_visible_answer");
  }

  if (scenario.category === "situation_room") {
    if (/successfully set up|watching minecraft|activated/i.test(visibleText) && !/missing|need|confirm|source|attach/i.test(visibleText)) {
      failures.push("situation_room_claimed_success_without_source_confirmation");
    }
    if (/agent_loop_budget_exhausted/i.test(terminalError)) warnings.push("situation_room_budget_exhausted");
  }

  if (scenario.category === "voice_policy") {
    if (includesAny(capabilities, /confirm_speak/i)) failures.push("voice_confirm_speak_auto_selected");
    if (looksLikeSpoken(visibleText)) failures.push("voice_claimed_spoken_without_confirmation");
  }

  if (scenario.category === "negated_tool") {
    if (includesAny(capabilities, /^docs-viewer\.open$|docs-viewer\.open\b/i)) {
      failures.push("negated_docs_open_still_selected_tool");
    }
    if (hasToolObservation(timelineEvents, [], artifactKinds)) warnings.push("negated_tool_created_tool_observation");
  }

  if (scenario.category === "repo_evidence") {
    if (!includesAny(capabilities, /repo-code\.search_concept|model\.synthesize_from_repo_evidence/i)) {
      failures.push("repo_evidence_capability_chain_missing");
    }
    if (!repoPacketPresent) warnings.push("repo_docs_synthesis_packet_missing");
    if (/direct_answer_text|model_only/i.test(terminalKind)) failures.push("repo_prompt_terminalized_as_model_only_answer");
    if (/repo_evidence_synthesis_failed|missing_allowed_terminal_artifact|unsupported_repo_claim/i.test(terminalError)) {
      failures.push(`repo_terminal_error_${terminalError}`);
    }
    if (policyClaimInversionVisible(visibleText)) failures.push("repo_policy_claim_inversion_visible");
  }

  if (failures.length) return { verdict: "FAIL", failures, warnings };
  if (warnings.length) return { verdict: "WARN", failures, warnings };
  return { verdict: "PASS", failures, warnings };
};

const runScenario = async (scenario: ToolChainScenario, runId: string, outputDir: string): Promise<RecordLike> => {
  const threadId = `helix-ask:tool-chain:${runId}:${scenario.id}`;
  const scenarioDir = path.join(outputDir, scenario.id);
  await fs.mkdir(scenarioDir, { recursive: true });

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
  const payload = getPayload(ask, debug);
  const timelineEvents = collectTimelineEvents(payload, debug);
  const ledger = collectLedger(payload, debug);
  const artifactKinds = collectArtifactKinds(ledger);
  const capabilities = collectCapabilities(payload, timelineEvents, ledger);
  const terminalWriter = findTerminalWriter(payload, debug);
  const visibleText = visibleTextOf(ask, payload, terminalWriter);
  const terminalKind = getTerminalKind(ask, payload, terminalWriter);
  const terminalError = getTerminalError(ask, payload);
  const railTable = findRailTable(ask, payload, debug);
  const repoPacketPresent =
    Boolean(readRecord(payload.repo_docs_synthesis_packet_summary)) ||
    artifactKinds.some((kind) => kind.includes("repo_docs_synthesis_packet")) ||
    timelineEvents.some((event) => readString(event.stage) === "repo_docs_synthesis_packet_created");
  const classification = classifyScenario({
    scenario,
    capabilities,
    artifactKinds,
    terminalKind,
    terminalError,
    timelineEvents,
    visibleText,
    terminalWriter,
    railTable,
    turnId,
    debugAvailable: Boolean(debug),
    repoPacketPresent,
  });

  const result = {
    schema: "helix.ask_tool_chain_matrix_probe_result.v1",
    scenario_id: scenario.id,
    category: scenario.category,
    prompt: scenario.prompt,
    turn_id: turnId,
    verdict: classification.verdict,
    failures: classification.failures,
    warnings: classification.warnings,
    selected_capabilities: capabilities,
    artifact_kinds: artifactKinds,
    terminal_artifact_kind: terminalKind,
    terminal_error_code: terminalError || null,
    terminal_writer_applied: terminalWriter?.applied ?? null,
    rail_table: railSummaryFor(railTable),
    timeline_event_count: timelineEvents.length,
    timeline_stages: timelineEvents.map((event) => readString(event.stage)).filter(Boolean),
    tool_observation_seen: hasToolObservation(timelineEvents, ledger, artifactKinds),
    post_tool_model_step_seen: hasPostToolModelStep(timelineEvents),
    repo_docs_synthesis_packet_seen: repoPacketPresent,
    receipt_framing_leak: receiptLeak(visibleText),
    visible_text_hash: await hashText(visibleText),
    visible_text_excerpt: visibleText.slice(0, 500),
  };

  await fs.writeFile(path.join(scenarioDir, "ask-response.json"), `${JSON.stringify(ask, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "debug-export.json"), `${JSON.stringify(debug, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "probe-result.json"), `${JSON.stringify(result, null, 2)}\n`);

  return result;
};

const renderMarkdownSummary = (input: {
  runId: string;
  results: RecordLike[];
  outputDir: string;
  preflight?: ToolChainPreflight;
}): string => {
  const lines = [
    "# Helix Ask Tool Chain Matrix Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    `- output_dir: ${input.outputDir}`,
  ];
  if (input.preflight) {
    lines.push(`- preflight: ${input.preflight.ok ? "ok" : "blocked"} (${input.preflight.reason})`);
    if (input.preflight.hint) lines.push(`- preflight_hint: ${input.preflight.hint}`);
  }
  lines.push(
    "",
    "| Verdict | Scenario | Terminal | Rail class | First rail | Repair | Error | Key findings |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const result of input.results) {
    const rail = readRecord(result.rail_table);
    const findings = [...readArray(result.failures), ...readArray(result.warnings)]
      .map(String)
      .join("; ");
    lines.push(
      `| ${readString(result.verdict)} | ${readString(result.scenario_id)} | ${readString(result.terminal_artifact_kind) || "-"} | ${
        readString(rail?.codex_parity_class) || "-"
      } | ${readString(rail?.first_broken_rail) || "-"} | ${readString(rail?.repair_target) || "-"} | ${
        readString(result.terminal_error_code) || "-"
      } | ${findings || "none"} |`,
    );
  }
  return `${lines.join("\n")}\n`;
};

const main = async (): Promise<void> => {
  const selected = new Set(SCENARIO_FILTER);
  const scenarios = SCENARIO_FILTER.length ? SCENARIOS.filter((scenario) => selected.has(scenario.id)) : SCENARIOS;

  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, dry_run: true, base_url: BASE_URL, scenarios }, null, 2));
    return;
  }

  const runId = `tool-chain-${Date.now()}`;
  const outputDir = path.resolve(OUT_DIR, runId);
  await fs.mkdir(outputDir, { recursive: true });

  const preflight = await probeAskTurnApi();
  if (!preflight.ok) {
    const summary = {
      schema: "helix.ask_tool_chain_matrix_probe_summary.v1",
      ok: false,
      blocked: true,
      blocked_reason: preflight.reason,
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      counts: {
        pass: 0,
        warn: 1,
        fail: 0,
      },
      preflight,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results: [], outputDir, preflight }));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  const results: RecordLike[] = [];
  for (const scenario of scenarios) {
    try {
      console.error(`[helix-tool-chain] ${scenario.id}: ${scenario.prompt}`);
      results.push(await runScenario(scenario, runId, outputDir));
    } catch (error) {
      const failure = error instanceof Error ? error.message : String(error);
      results.push({
        schema: "helix.ask_tool_chain_matrix_probe_result.v1",
        scenario_id: scenario.id,
        category: scenario.category,
        prompt: scenario.prompt,
        verdict: "FAIL",
        failures: [failure],
        warnings: [],
      });
    }
  }

  const failCount = results.filter((result) => result.verdict === "FAIL").length;
  const warnCount = results.filter((result) => result.verdict === "WARN").length;
  const summary = {
    schema: "helix.ask_tool_chain_matrix_probe_summary.v1",
    ok: failCount === 0 && (!FAIL_ON_WARN || warnCount === 0),
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    counts: {
      pass: results.filter((result) => result.verdict === "PASS").length,
      warn: warnCount,
      fail: failCount,
    },
    preflight,
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results, outputDir, preflight }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
