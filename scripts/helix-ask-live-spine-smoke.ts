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

type Verdict = "PASS" | "FAIL";
type ExpectedValue = string | null | Array<string | null>;
type LiveSpineCoverage =
  | "calculator"
  | "docs"
  | "repo_code"
  | "workspace_status"
  | "live_source_mail"
  | "internet_search"
  | "visual_capture"
  | "image_lens"
  | "capability_catalog"
  | "negated_contextual_tool_mentions";

type LiveSmokePreflight = {
  ok: boolean;
  status: number;
  reason: string;
  message: string;
  hint?: string;
};

type LiveSpineScenario = {
  id: string;
  prompt: string;
  coverage: LiveSpineCoverage[];
  seed?: "visual_capture";
  expected: {
    requestedCapability?: string | null;
    selectedCapability?: ExpectedValue;
    admittedCapability?: ExpectedValue;
    executedCapability?: ExpectedValue;
    observationKind?: ExpectedValue;
    requiredTerminalKind?: ExpectedValue;
    selectedTerminalKind?: ExpectedValue;
    visibleTerminalKind?: ExpectedValue;
    reentryStatus?: ExpectedValue;
    goalSatisfaction?: ExpectedValue;
    railStatus?: ExpectedValue;
    codexParityClass?: ExpectedValue;
    railFailureCode?: ExpectedValue;
    firstBrokenRail?: ExpectedValue;
    repairTarget?: ExpectedValue;
    visibleToolSurfaceIncludes?: string[];
    visibleToolSurfaceExcludes?: string[];
    forbidTerminalErrorCodes?: string[];
  };
};

const CODEX_PARITY_CLASSES = CODEX_PARITY_AGENT_SPINE_CLASSES;

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:1498").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_LIVE_SPINE_OUT ?? "artifacts/helix-ask-live-spine-smoke";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_LIVE_SPINE_TIMEOUT_MS ?? 240_000));
const FAIL_ON_WARN = process.env.HELIX_ASK_LIVE_SPINE_FAIL_ON_WARN === "1";
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_LIVE_SPINE_DRY_RUN === "1";
const SCENARIO_FILTER = (process.env.HELIX_ASK_LIVE_SPINE_SCENARIOS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const SCENARIOS: LiveSpineScenario[] = [
  {
    id: "calculator_explicit",
    coverage: ["calculator"],
    prompt:
      "Call scientific-calculator.solve_expression with this exact expression: 2 + 2. Wait for calculator_receipt and answer from workstation_tool_evaluation.",
    expected: {
      requestedCapability: "scientific-calculator.solve_expression",
      selectedCapability: "scientific-calculator.solve_expression",
      admittedCapability: "scientific-calculator.solve_expression",
      executedCapability: "scientific-calculator.solve_expression",
      observationKind: "calculator_receipt",
      reentryStatus: "reentered",
      goalSatisfaction: "satisfied",
      requiredTerminalKind: "workstation_tool_evaluation",
      selectedTerminalKind: "workstation_tool_evaluation",
      visibleTerminalKind: "workstation_tool_evaluation",
      railStatus: "complete",
      codexParityClass: "complete",
      railFailureCode: null,
      firstBrokenRail: null,
      repairTarget: null,
      visibleToolSurfaceIncludes: ["scientific-calculator.solve_expression"],
    },
  },
  {
    id: "workspace_status_explicit",
    coverage: ["workspace_status"],
    prompt: "Use workspace_os.status to inspect workstation status.",
    expected: {
      requestedCapability: "workspace_os.status",
      selectedCapability: "workspace_os.status",
      admittedCapability: "workspace_os.status",
      executedCapability: "workspace_os.status",
      observationKind: "workspace_os_status_observation",
      reentryStatus: "reentered",
      goalSatisfaction: "satisfied",
      requiredTerminalKind: ["model_synthesized_answer", "workspace_status_answer", "workstation_tool_evaluation"],
      selectedTerminalKind: ["model_synthesized_answer", "workspace_status_answer", "workstation_tool_evaluation"],
      visibleTerminalKind: ["model_synthesized_answer", "workspace_status_answer", "workstation_tool_evaluation"],
      railStatus: "complete",
      codexParityClass: "complete",
      firstBrokenRail: null,
      visibleToolSurfaceIncludes: ["workspace_os.status"],
    },
  },
  {
    id: "docs_locate_explicit",
    coverage: ["docs"],
    prompt: "Use docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md.",
    expected: {
      requestedCapability: "docs-viewer.locate_in_doc",
      selectedCapability: "docs-viewer.locate_in_doc",
      admittedCapability: "docs-viewer.locate_in_doc",
      executedCapability: "docs-viewer.locate_in_doc",
      observationKind: ["doc_location_matches", "doc_evidence_location"],
      reentryStatus: "reentered",
      requiredTerminalKind: ["doc_location_matches", "doc_evidence_location", "doc_location_result"],
      railStatus: ["complete", "fail_closed"],
      codexParityClass: ["complete", "goal_contract_mismatch"],
      firstBrokenRail: [null, "terminal_materialization"],
      repairTarget: [null, "terminal_materializer"],
      visibleToolSurfaceIncludes: ["docs-viewer.locate_in_doc"],
    },
  },
  {
    id: "repo_search_explicit",
    coverage: ["repo_code"],
    prompt: "Use repo-code.search_concept to find where terminal authority selects the answer.",
    expected: {
      requestedCapability: "repo-code.search_concept",
      selectedCapability: "repo-code.search_concept",
      admittedCapability: "repo-code.search_concept",
      executedCapability: "repo-code.search_concept",
      observationKind: "repo_code_evidence_observation",
      reentryStatus: "reentered",
      requiredTerminalKind: "repo_code_evidence_answer",
      railStatus: ["complete", "fail_closed"],
      codexParityClass: ["complete", "observation_not_reentered"],
      firstBrokenRail: [null, "evidence_reentry"],
      repairTarget: [null, "repo_retrieval_repair_policy"],
      visibleToolSurfaceIncludes: ["repo-code.search_concept"],
    },
  },
  {
    id: "internet_search_config_or_complete",
    coverage: ["internet_search"],
    prompt: "Use internet_search.web_research to find current public evidence about OpenAI Codex.",
    expected: {
      requestedCapability: "internet_search.web_research",
      selectedCapability: ["internet-search.search_web", "internet_search.web_research"],
      admittedCapability: ["internet-search.search_web", "internet_search.web_research"],
      executedCapability: ["internet-search.search_web", "internet_search.web_research"],
      observationKind: ["internet_search_observation", "reasoning_context"],
      reentryStatus: ["reentered", "no_observation"],
      requiredTerminalKind: "internet_search_answer",
      railStatus: ["complete", "fail_closed"],
      codexParityClass: ["complete", "provider_config_missing"],
      firstBrokenRail: [null, "config"],
      repairTarget: [null, "operator_config"],
      visibleToolSurfaceIncludes: ["internet_search.web_research"],
    },
  },
  {
    id: "live_source_mail_observation_or_fail_closed",
    coverage: ["live_source_mail"],
    prompt: "Use live_env.read_processed_live_source_mail to inspect the latest processed live-source mail.",
    expected: {
      requestedCapability: "live_env.read_processed_live_source_mail",
      selectedCapability: "live_env.read_processed_live_source_mail",
      admittedCapability: "live_env.read_processed_live_source_mail",
      executedCapability: "live_env.read_processed_live_source_mail",
      reentryStatus: ["reentered", "no_observation"],
      railStatus: ["complete", "fail_closed"],
      codexParityClass: ["complete", "observation_missing"],
      firstBrokenRail: [null, "observation_artifact"],
      repairTarget: [null, "observation_materializer"],
      visibleToolSurfaceIncludes: ["live_env.read_processed_live_source_mail"],
    },
  },
  {
    id: "capability_catalog_runtime",
    coverage: ["capability_catalog"],
    prompt: "What tools are available for the helix ask to use?",
    expected: {
      requestedCapability: null,
      selectedCapability: "helix_ask.inspect_capability_catalog",
      admittedCapability: "helix_ask.inspect_capability_catalog",
      executedCapability: "helix_ask.inspect_capability_catalog",
      observationKind: "capability_registry",
      requiredTerminalKind: "capability_help_summary",
      selectedTerminalKind: "capability_help_summary",
      visibleTerminalKind: "capability_help_summary",
      reentryStatus: "reentered",
      goalSatisfaction: "satisfied",
      railStatus: "complete",
      codexParityClass: "complete",
      firstBrokenRail: null,
      visibleToolSurfaceIncludes: ["helix_ask.inspect_capability_catalog"],
      forbidTerminalErrorCodes: ["terminal_kind_not_required", "agent_loop_budget_exhausted"],
    },
  },
  {
    id: "negated_calculator_context",
    coverage: ["negated_contextual_tool_mentions"],
    prompt:
      "Do not call scientific-calculator.solve_expression. Explain why calculator receipts are observations rather than terminal authority.",
    expected: {
      requestedCapability: null,
      selectedCapability: "model.direct_answer",
      admittedCapability: "model.direct_answer",
      executedCapability: "model.direct_answer",
      requiredTerminalKind: "direct_answer_text",
      selectedTerminalKind: "direct_answer_text",
      visibleTerminalKind: "direct_answer_text",
      railStatus: "complete",
      codexParityClass: "complete",
      firstBrokenRail: null,
      visibleToolSurfaceIncludes: ["model.direct_answer"],
      visibleToolSurfaceExcludes: ["scientific-calculator.solve_expression", "repo-code.search_concept"],
    },
  },
  {
    id: "visual_capture_current_screen",
    coverage: ["visual_capture"],
    seed: "visual_capture",
    prompt: "What is happening right now in the visual screen capture?",
    expected: {
      selectedCapability: "situation-room.describe_visual_capture",
      admittedCapability: "situation-room.describe_visual_capture",
      executedCapability: "situation-room.describe_visual_capture",
      railStatus: "complete",
      codexParityClass: "complete",
      firstBrokenRail: null,
      visibleToolSurfaceIncludes: ["situation-room.describe_visual_capture"],
    },
  },
  {
    id: "image_lens_alias",
    coverage: ["image_lens", "visual_capture"],
    seed: "visual_capture",
    prompt: "Use image_lens.inspect to inspect the current image lens visual source.",
    expected: {
      requestedCapability: "image_lens.inspect",
      selectedCapability: "situation-room.describe_visual_capture",
      admittedCapability: "situation-room.describe_visual_capture",
      executedCapability: "situation-room.describe_visual_capture",
      observationKind: ["visual_frame_evidence", "situation_context_pack", "visual_context_pack"],
      reentryStatus: "reentered",
      goalSatisfaction: "satisfied",
      requiredTerminalKind: "situation_context_pack",
      railStatus: "complete",
      codexParityClass: "complete",
      firstBrokenRail: null,
      visibleToolSurfaceIncludes: ["image_lens.inspect", "situation-room.describe_visual_capture"],
    },
  },
];

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as RecordLike)[key];
  }, value);

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

const probeAskTurnApi = async (): Promise<LiveSmokePreflight> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(TIMEOUT_MS, 10_000));
  const url = `${BASE_URL}/api/agi/ask/turn/__helix_live_spine_preflight__/debug-export?view=rail`;
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
        hint: readString(payload?.hint) ?? "Start the keyed bundle with ENABLE_AGI=1 and the Ask turn API enabled.",
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
      hint: "Start the operator-owned keyed Helix Ask server before running live spine smoke.",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const extractPayload = (debugExport: unknown): RecordLike | null => {
  const debug = readRecord(debugExport);
  return readRecord(debug?.payload) ?? debug;
};

const railCandidates = (ask: RecordLike, debugExport: unknown): RecordLike[] => {
  const payload = extractPayload(debugExport);
  return [
    readRecord(ask.codex_parity_agent_spine_rail_table),
    readRecord(payload?.codex_parity_agent_spine_rail_table),
    readRecord(getPath(payload, ["debug", "codex_parity_agent_spine_rail_table"])),
    readRecord(getPath(payload, ["artifact_query_index", "codex_parity_agent_spine_rail_table"])),
    readRecord(getPath(payload, ["debug", "artifact_query_index", "codex_parity_agent_spine_rail_table"])),
  ].filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));
};

const terminalErrorCode = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_error_code) ??
    readString(payload?.terminal_error_code) ??
    readString(getPath(payload, ["resolved_turn_summary", "terminal_error_code"]))
  );
};

const selectedFinalText = (ask: RecordLike, debugExport: unknown): string => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.selected_final_answer) ??
    readString(ask.finalAnswer) ??
    readString(ask.answer) ??
    readString(payload?.selected_final_answer) ??
    readString(payload?.answer) ??
    ""
  );
};

const completeRailEnvelopeFailures = (input: {
  rail: RecordLike | null;
  ask: RecordLike;
  debugExport: unknown;
}): string[] => {
  if (!input.rail) return [];
  const railComplete =
    readString(input.rail.codex_parity_class) === "complete" ||
    readString(input.rail.rail_status) === "complete";
  if (!railComplete) return [];
  const failures: string[] = [];
  const payload = extractPayload(input.debugExport);
  const errorCode = terminalErrorCode(input.ask, input.debugExport);
  const finalStatus = readString(input.ask.final_status) ?? readString(payload?.final_status);
  const responseType = readString(input.ask.response_type) ?? readString(payload?.response_type);
  const finalAnswerSource = readString(input.ask.final_answer_source) ?? readString(payload?.final_answer_source);
  const terminalArtifactKind =
    readString(input.ask.terminal_artifact_kind) ??
    readString(payload?.terminal_artifact_kind) ??
    readString(getPath(payload, ["terminal_answer_authority", "terminal_artifact_kind"]));
  const text = selectedFinalText(input.ask, input.debugExport);

  if (errorCode) failures.push(`complete_rail_terminal_error:${errorCode}`);
  if (finalAnswerSource === "typed_failure" || terminalArtifactKind === "typed_failure") {
    failures.push("complete_rail_typed_failure_terminal");
  }
  if ((finalStatus && finalStatus !== "final_answer") || (responseType && responseType !== "final_answer")) {
    failures.push(`complete_rail_non_final_response:${finalStatus ?? "missing"}/${responseType ?? "missing"}`);
  }
  if (!text) failures.push("complete_rail_missing_final_answer_text");
  return failures;
};

const matchesExpected = (actual: unknown, expected: ExpectedValue | undefined): boolean => {
  const value = actual === null || actual === undefined ? null : String(actual);
  if (expected === undefined) return true;
  if (expected === null) return value === null;
  const expectedValues = Array.isArray(expected) ? expected : expected.includes("|") ? expected.split("|") : [expected];
  return expectedValues.some((entry) => entry === null ? value === null : value === entry);
};

const expectField = (failures: string[], rail: RecordLike, key: string, expected: ExpectedValue | undefined): void => {
  if (expected === undefined) return;
  if (!matchesExpected(rail[key], expected)) {
    failures.push(`${key}_mismatch:${String(rail[key] ?? "null")}!=${Array.isArray(expected) ? expected.join("|") : String(expected)}`);
  }
};

const terminalArtifactKindFor = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_artifact_kind) ??
    readString(payload?.terminal_artifact_kind) ??
    readString(getPath(payload, ["terminal_answer_authority", "terminal_artifact_kind"]))
  );
};

const shapeFailures = (rail: RecordLike, turnId: string, prompt: string): string[] => {
  const failures: string[] = [];
  if (rail.schema !== CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA) failures.push("rail_schema_mismatch");
  if (rail.turn_id !== turnId) failures.push(`rail_turn_id_mismatch:${String(rail.turn_id ?? "missing")}!=${turnId}`);
  if (readString(rail.prompt) !== prompt) failures.push("rail_prompt_mismatch");
  if (rail.assistant_answer !== false) failures.push("rail_assistant_answer_not_false");
  if (rail.terminal_eligible !== false) failures.push("rail_terminal_eligible_not_false");
  if (rail.raw_content_included !== false) failures.push("rail_raw_content_included_not_false");
  if (!Array.isArray(rail.visible_tool_surface)) failures.push("visible_tool_surface_not_array");
  for (const key of CODEX_PARITY_AGENT_SPINE_STRING_OR_NULL_FIELDS) {
    const value = rail[key];
    if (value !== null && typeof value !== "string") failures.push(`rail_string_or_null_field_invalid:${key}`);
  }
  if (!CODEX_PARITY_AGENT_SPINE_REENTRY_STATUSES.includes(rail.reentry_status as never)) {
    failures.push(`invalid_reentry_status:${String(rail.reentry_status ?? "missing")}`);
  }
  const reentryStatus = readString(rail.reentry_status);
  const reentryProofSource = readString(rail.reentry_proof_source);
  if (reentryStatus === "reentered" && !reentryProofSource) {
    failures.push("reentry_proof_source_missing");
  }
  if (reentryStatus === "reentered" && rail.reentry_proven !== true) {
    failures.push("reentry_not_proven");
  }
  if (!CODEX_PARITY_AGENT_SPINE_RAIL_STATUSES.includes(rail.rail_status as never)) {
    failures.push(`invalid_rail_status:${String(rail.rail_status ?? "missing")}`);
  }
  if (!CODEX_PARITY_CLASSES.includes(rail.codex_parity_class as (typeof CODEX_PARITY_CLASSES)[number])) {
    failures.push(`invalid_codex_parity_class:${String(rail.codex_parity_class ?? "missing")}`);
  }
  if (JSON.stringify(rail.normalized_codex_parity_classes) !== JSON.stringify(CODEX_PARITY_CLASSES)) {
    failures.push("normalized_codex_parity_classes_mismatch");
  }
  const selectedCapability = readString(rail.selected_capability);
  const admittedCapability = readString(rail.admitted_capability);
  const executedCapability = readString(rail.executed_capability);
  const requestedCapability = readString(rail.requested_capability);
  const goalSatisfaction = readString(rail.goal_satisfaction);
  const requiredObservationKinds = readStringArray(rail.required_observation_kinds_for_requested_capability);
  const observationSupportsRequested = rail.observed_artifact_supports_requested_capability;
  const admissionProofSource = readString(rail.admission_proof_source);
  if ((selectedCapability || executedCapability) && !admittedCapability) {
    failures.push("admitted_capability_missing");
  }
  if (admittedCapability && !admissionProofSource) {
    failures.push("admission_proof_source_missing");
  }
  if (admittedCapability && rail.admission_proven !== true) {
    failures.push("admission_not_proven");
  }
  if (requestedCapability && !Array.isArray(rail.required_observation_kinds_for_requested_capability)) {
    failures.push("requested_observation_kinds_missing");
  }
  if (requestedCapability && typeof observationSupportsRequested !== "boolean") {
    failures.push("observation_support_verdict_missing");
  }
  if (
    requestedCapability &&
    (goalSatisfaction === "satisfied" || rail.rail_status === "complete" || rail.codex_parity_class === "complete") &&
    requiredObservationKinds.length > 0 &&
    observationSupportsRequested !== true
  ) {
    failures.push("goal_satisfied_without_requested_observation_support");
  }
  const selectedTerminalKind = readString(rail.selected_terminal_kind);
  const visibleTerminalKind = readString(rail.visible_terminal_kind);
  const terminalAuthorityProofSource = readString(rail.terminal_authority_proof_source);
  const visibleProjectionSource = readString(rail.visible_projection_source);
  if (selectedTerminalKind && !terminalAuthorityProofSource) {
    failures.push("terminal_authority_proof_source_missing");
  }
  if (selectedTerminalKind && rail.terminal_authority_proven !== true) {
    failures.push("terminal_authority_not_proven");
  }
  if (visibleTerminalKind && !visibleProjectionSource) {
    failures.push("visible_projection_source_missing");
  }
  if (visibleTerminalKind && rail.visible_projection_proven !== true) {
    failures.push("visible_projection_not_proven");
  }
  if (rail.codex_parity_class === "complete" && rail.first_broken_rail !== null) {
    failures.push(`complete_with_first_broken_rail:${String(rail.first_broken_rail)}`);
  }
  if ((rail.codex_parity_class === "complete" || rail.rail_status === "complete") && reentryStatus !== "reentered") {
    failures.push(`complete_without_reentry:${reentryStatus || "missing"}`);
  }
  if ((rail.rail_status === "complete") !== (rail.codex_parity_class === "complete")) {
    failures.push(`completion_status_class_mismatch:${String(rail.rail_status ?? "missing")}/${String(rail.codex_parity_class ?? "missing")}`);
  }
  if ((rail.codex_parity_class === "complete" || rail.rail_status === "complete") && !selectedTerminalKind) {
    failures.push("complete_without_terminal_authority");
  }
  if ((rail.codex_parity_class === "complete" || rail.rail_status === "complete") && !visibleTerminalKind) {
    failures.push("complete_without_visible_projection");
  }
  if (rail.codex_parity_class !== "complete" && !readString(rail.first_broken_rail)) {
    failures.push("non_complete_without_first_broken_rail");
  }
  return failures;
};

const compareRailMirrors = (rails: RecordLike[]): string[] => {
  if (rails.length < 2) return [];
  const failures: string[] = [];
  const base = rails[0];
  for (const [index, rail] of rails.entries()) {
    for (const key of [
      "requested_capability",
      "selected_capability",
      "admitted_capability",
      "admission_proof_source",
      "admission_proven",
      "executed_capability",
      "required_observation_kinds_for_requested_capability",
      "observed_artifact_supports_requested_capability",
      "reentry_status",
      "reentry_proof_source",
      "reentry_proven",
      "terminal_authority_proof_source",
      "terminal_authority_proven",
      "visible_projection_source",
      "visible_projection_proven",
      "codex_parity_class",
      "first_broken_rail",
      "repair_target",
      "selected_terminal_kind",
      "visible_terminal_kind",
      "rail_failure_code",
    ]) {
      if (JSON.stringify(base[key]) !== JSON.stringify(rail[key])) {
        failures.push(`rail_mirror_${index}_${key}_mismatch:${String(rail[key] ?? "null")}!=${String(base[key] ?? "null")}`);
      }
    }
  }
  return failures;
};

const classify = (scenario: LiveSpineScenario, ask: RecordLike, debugExport: unknown): RecordLike => {
  const failures: string[] = [];
  const warnings: string[] = [];
  const turnId = readString(ask.turn_id) ?? "missing";
  const rails = railCandidates(ask, debugExport);
  const rail = rails[0];
  const errorCode = terminalErrorCode(ask, debugExport);
  const terminalArtifactKind = terminalArtifactKindFor(ask, debugExport);

  if (!debugExport) failures.push("debug_export_missing");
  if (!rail) {
    failures.push("codex_parity_agent_spine_rail_table_missing");
  } else {
    failures.push(...shapeFailures(rail, turnId, scenario.prompt), ...compareRailMirrors(rails));
    expectField(failures, rail, "requested_capability", scenario.expected.requestedCapability);
    expectField(failures, rail, "selected_capability", scenario.expected.selectedCapability);
    expectField(failures, rail, "admitted_capability", scenario.expected.admittedCapability);
    expectField(failures, rail, "executed_capability", scenario.expected.executedCapability);
    expectField(failures, rail, "observation_kind", scenario.expected.observationKind);
    expectField(failures, rail, "reentry_status", scenario.expected.reentryStatus);
    expectField(failures, rail, "goal_satisfaction", scenario.expected.goalSatisfaction);
    expectField(failures, rail, "required_terminal_kind", scenario.expected.requiredTerminalKind);
    expectField(failures, rail, "selected_terminal_kind", scenario.expected.selectedTerminalKind);
    expectField(failures, rail, "visible_terminal_kind", scenario.expected.visibleTerminalKind);
    expectField(failures, rail, "rail_status", scenario.expected.railStatus);
    expectField(failures, rail, "codex_parity_class", scenario.expected.codexParityClass);
    expectField(failures, rail, "rail_failure_code", scenario.expected.railFailureCode);
    expectField(failures, rail, "first_broken_rail", scenario.expected.firstBrokenRail);
    expectField(failures, rail, "repair_target", scenario.expected.repairTarget);

    if (rail.selected_terminal_kind !== rail.visible_terminal_kind) {
      failures.push(
        `terminal_projection_mismatch:${String(rail.selected_terminal_kind ?? "null")}!=${String(rail.visible_terminal_kind ?? "null")}`,
      );
    }
    if (terminalArtifactKind && rail.selected_terminal_kind && rail.selected_terminal_kind !== terminalArtifactKind) {
      failures.push(`rail_selected_terminal_response_mismatch:${String(rail.selected_terminal_kind)}!=${terminalArtifactKind}`);
    }
    if (terminalArtifactKind && rail.visible_terminal_kind && rail.visible_terminal_kind !== terminalArtifactKind) {
      failures.push(`rail_visible_terminal_response_mismatch:${String(rail.visible_terminal_kind)}!=${terminalArtifactKind}`);
    }
    failures.push(...completeRailEnvelopeFailures({ rail, ask, debugExport }));

    const visibleToolSurface = readStringArray(rail.visible_tool_surface);
    for (const required of scenario.expected.visibleToolSurfaceIncludes ?? []) {
      if (!visibleToolSurface.includes(required)) failures.push(`visible_tool_surface_missing:${required}`);
    }
    for (const forbidden of scenario.expected.visibleToolSurfaceExcludes ?? []) {
      if (visibleToolSurface.includes(forbidden)) failures.push(`visible_tool_surface_forbidden:${forbidden}`);
    }
  }

  for (const forbidden of scenario.expected.forbidTerminalErrorCodes ?? []) {
    if (errorCode === forbidden) failures.push(`forbidden_terminal_error_code:${forbidden}`);
  }
  if (/agent_loop_budget_exhausted|max_tool_calls/i.test(errorCode ?? "")) {
    failures.push(`budget_exhaustion_visible:${errorCode}`);
  }

  const verdict: Verdict = failures.length ? "FAIL" : "PASS";
  return {
    schema: "helix.ask_live_spine_smoke_result.v1",
    scenario_id: scenario.id,
    coverage: scenario.coverage,
    prompt: scenario.prompt,
    turn_id: turnId,
    verdict,
    failures,
    warnings,
    terminal_error_code: errorCode,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: readString(ask.final_answer_source) ?? null,
    selected_final_answer_excerpt: selectedFinalText(ask, debugExport).slice(0, 500),
    rail_table: rail
      ? {
          prompt: rail.prompt ?? null,
          requested_capability: rail.requested_capability ?? null,
          visible_tool_surface: rail.visible_tool_surface ?? [],
          visible_tool_surface_original_count: rail.visible_tool_surface_original_count ?? null,
          visible_tool_surface_truncated: rail.visible_tool_surface_truncated ?? null,
          selected_capability: rail.selected_capability ?? null,
          admitted_capability: rail.admitted_capability ?? null,
          admission_proof_source: rail.admission_proof_source ?? null,
          admission_proven: rail.admission_proven ?? null,
          executed_capability: rail.executed_capability ?? null,
          observation_kind: rail.observation_kind ?? null,
          observation_ref: rail.observation_ref ?? null,
          required_observation_kinds_for_requested_capability:
            rail.required_observation_kinds_for_requested_capability ?? [],
          observed_artifact_supports_requested_capability:
            rail.observed_artifact_supports_requested_capability ?? null,
          reentry_status: rail.reentry_status ?? null,
          reentry_proof_source: rail.reentry_proof_source ?? null,
          reentry_proven: rail.reentry_proven ?? null,
          goal_satisfaction: rail.goal_satisfaction ?? null,
          required_terminal_kind: rail.required_terminal_kind ?? null,
          selected_terminal_kind: rail.selected_terminal_kind ?? null,
          terminal_authority_proof_source: rail.terminal_authority_proof_source ?? null,
          terminal_authority_proven: rail.terminal_authority_proven ?? null,
          visible_terminal_kind: rail.visible_terminal_kind ?? null,
          visible_projection_source: rail.visible_projection_source ?? null,
          visible_projection_proven: rail.visible_projection_proven ?? null,
          first_broken_rail: rail.first_broken_rail ?? null,
          repair_target: rail.repair_target ?? null,
          rail_status: rail.rail_status ?? null,
          rail_failure_code: rail.rail_failure_code ?? null,
          codex_parity_class: rail.codex_parity_class ?? null,
          normalized_codex_parity_classes: rail.normalized_codex_parity_classes ?? [],
        }
      : null,
  };
};

const seedVisualCapture = async (threadId: string): Promise<RecordLike> =>
  fetchJson<RecordLike>(`${BASE_URL}/api/agi/situation/test-harness/live-visual-source`, {
    method: "POST",
    body: JSON.stringify({
      thread_id: threadId,
      source_id: `visual_source:live-spine:${Date.now()}`,
      scene_text: "A backend-seeded visual capture shows a workstation panel with a visible status table.",
      activity: "Reviewing a workstation panel with status rows.",
      objects: "workstation panel, status table, visible controls",
      confidence: 0.82,
    }),
  });

const runScenario = async (scenario: LiveSpineScenario, runId: string, outputDir: string): Promise<RecordLike> => {
  const threadId = `helix-ask:live-spine:${runId}:${scenario.id}`;
  const scenarioDir = path.join(outputDir, scenario.id);
  await fs.mkdir(scenarioDir, { recursive: true });

  const seed = scenario.seed === "visual_capture" ? await seedVisualCapture(threadId) : null;
  if (seed) await fs.writeFile(path.join(scenarioDir, "seed.json"), `${JSON.stringify(seed, null, 2)}\n`);

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
  const result = classify(scenario, ask, debug);

  await fs.writeFile(path.join(scenarioDir, "ask-response.json"), `${JSON.stringify(ask, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "debug-export.json"), `${JSON.stringify(debug, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "probe-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
};

const renderMarkdownSummary = (input: {
  runId: string;
  outputDir: string;
  results: RecordLike[];
  preflight?: LiveSmokePreflight;
}): string => {
  const lines = [
    "# Helix Ask Live Spine Smoke",
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
    "| Verdict | Scenario | Class | Rail | Repair | Terminal Error |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const result of input.results) {
    const rail = readRecord(result.rail_table);
    lines.push(
      `| ${readString(result.verdict) || "FAIL"} | ${readString(result.scenario_id)} | ${String(rail?.codex_parity_class ?? "-")} | ${
        String(rail?.first_broken_rail ?? "-")
      } | ${String(rail?.repair_target ?? "-")} | ${String(result.terminal_error_code ?? "-")} |`,
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

  const runId = `live-spine-${Date.now()}`;
  const outputDir = path.resolve(OUT_DIR, runId);
  await fs.mkdir(outputDir, { recursive: true });

  const preflight = await probeAskTurnApi();
  if (!preflight.ok) {
    const summary = {
      schema: "helix.ask_live_spine_smoke_summary.v1",
      ok: false,
      blocked: true,
      blocked_reason: preflight.reason,
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      counts: {
        pass: 0,
        fail: 0,
        warn: 1,
      },
      preflight,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results: [], preflight }));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  const results: RecordLike[] = [];
  for (const scenario of scenarios) {
    try {
      console.error(`[helix-live-spine] ${scenario.id}: ${scenario.prompt}`);
      results.push(await runScenario(scenario, runId, outputDir));
    } catch (error) {
      const failure = error instanceof Error ? error.message : String(error);
      results.push({
        schema: "helix.ask_live_spine_smoke_result.v1",
        scenario_id: scenario.id,
        prompt: scenario.prompt,
        verdict: "FAIL",
        failures: [failure],
        warnings: [],
      });
    }
  }

  const failCount = results.filter((result) => result.verdict === "FAIL").length;
  const warnCount = results.reduce((count, result) => count + (Array.isArray(result.warnings) && result.warnings.length ? 1 : 0), 0);
  const summary = {
    schema: "helix.ask_live_spine_smoke_summary.v1",
    ok: failCount === 0 && (!FAIL_ON_WARN || warnCount === 0),
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    counts: {
      pass: results.filter((result) => result.verdict === "PASS").length,
      fail: failCount,
      warn: warnCount,
    },
    preflight,
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, results, preflight }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
