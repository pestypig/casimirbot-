import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type RecordLike = Record<string, unknown>;
type Verdict = "PASS" | "WARN" | "FAIL" | "BLOCKED";

export type UserPromptScenario = {
  id: string;
  prompt: string;
  category:
    | "capability_catalog"
    | "calculator"
    | "workspace_status"
    | "docs"
    | "repo_code"
    | "theory_reflection"
    | "compound"
    | "negated_context";
  notes?: string;
};

type ProbePreflight = {
  ok: boolean;
  status: number;
  reason: string;
  message: string;
  hint?: string;
};

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:1498").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_USER_PROMPT_OUT ?? "artifacts/helix-ask-user-prompt-corpus";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_USER_PROMPT_TIMEOUT_MS ?? 240_000));
const DELAY_MS = Math.max(0, Number(process.env.HELIX_ASK_USER_PROMPT_DELAY_MS ?? 1000));
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_USER_PROMPT_DRY_RUN === "1";
const FAIL_ON_WARN = process.env.HELIX_ASK_USER_PROMPT_FAIL_ON_WARN === "1";
const SCENARIO_FILTER = (process.env.HELIX_ASK_USER_PROMPT_SCENARIOS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

export const USER_PROMPT_CORPUS_SCENARIOS: UserPromptScenario[] = [
  {
    id: "catalog_available_tools",
    category: "capability_catalog",
    prompt: "What tools are available for Helix Ask to use?",
  },
  {
    id: "catalog_live_answer_tool_goals",
    category: "capability_catalog",
    prompt: "What about the live answer tool call goals?",
  },
  {
    id: "calculator_explicit_2_plus_2",
    category: "calculator",
    prompt: "Call scientific-calculator.solve_expression with this exact expression: 2 + 2.",
  },
  {
    id: "workspace_status_explicit",
    category: "workspace_status",
    prompt: "Use workspace_os.status to inspect workstation status.",
  },
  {
    id: "docs_terminal_authority_locate",
    category: "docs",
    prompt:
      "Use docs-viewer.locate_in_doc to find where terminal authority is discussed in docs/helix-ask-codex-loop-discipline.md.",
  },
  {
    id: "repo_receipts_observations",
    category: "repo_code",
    prompt: "Use repo-code.search_concept to explain receipts are observations, not answers.",
  },
  {
    id: "theory_context_reflection",
    category: "theory_reflection",
    prompt: "Use helix_ask.reflect_theory_context to locate Casimir cavities in the theory graph.",
  },
  {
    id: "docs_then_calculator",
    category: "compound",
    prompt:
      "Use docs-viewer.locate_in_doc to find where terminal authority is discussed, then call scientific-calculator.solve_expression with this exact expression: 19 + 23.",
  },
  {
    id: "catalog_then_workspace",
    category: "compound",
    prompt: "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
  },
  {
    id: "negated_tool_receipts_explanation",
    category: "negated_context",
    prompt: "Do not call tools; explain why calculator receipts are observations, not answers.",
  },
];

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readRecordArray = (value: unknown): RecordLike[] =>
  readArray(value)
    .map((entry) => readRecord(entry))
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as RecordLike)[key];
  }, value);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const slug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "scenario";

const parseJsonRecord = (text: string): RecordLike | null => {
  try {
    return readRecord(JSON.parse(text));
  } catch {
    return null;
  }
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
        Accept: "application/json",
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

const probeAskTurnApi = async (): Promise<ProbePreflight> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(TIMEOUT_MS, 10_000));
  const url = `${BASE_URL}/api/agi/ask/turn/__helix_user_prompt_corpus_preflight__/debug-export?view=rail`;
  try {
    const response = await fetch(url, {
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
        status: response.status,
        reason: response.ok ? "ask_turn_debug_export_available" : "ask_turn_routes_available",
        message: response.ok
          ? "Ask turn debug-export endpoint is available."
          : "Ask turn routes are mounted; fake turn was not found as expected.",
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
      hint: "Start the operator-owned keyed Helix Ask server before running this live corpus probe.",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const extractPayload = (debugExport: unknown): RecordLike | null => {
  const debug = readRecord(debugExport);
  return readRecord(debug?.payload) ?? debug;
};

const firstRecord = (...values: unknown[]): RecordLike | null => {
  for (const value of values) {
    const record = readRecord(value);
    if (record) return record;
  }
  return null;
};

const firstNonEmptyRecords = (...values: unknown[]): RecordLike[] => {
  for (const value of values) {
    const records = readRecordArray(value);
    if (records.length > 0) return records;
  }
  return [];
};

const railTable = (ask: RecordLike, debugExport: unknown): RecordLike | null => {
  const debug = readRecord(debugExport);
  const payload = extractPayload(debugExport);
  return firstRecord(
    ask.codex_parity_agent_spine_rail_table,
    payload?.codex_parity_agent_spine_rail_table,
    getPath(payload, ["debug", "codex_parity_agent_spine_rail_table"]),
    getPath(payload, ["artifact_query_index", "codex_parity_agent_spine_rail_table"]),
    getPath(payload, ["debug", "artifact_query_index", "codex_parity_agent_spine_rail_table"]),
    debug?.codex_parity_agent_spine_rail_table,
    getPath(debug, ["payload", "codex_parity_agent_spine_rail_table"]),
    getPath(debug, ["payload", "debug", "codex_parity_agent_spine_rail_table"]),
  );
};

const compoundSubgoals = (ask: RecordLike, debugExport: unknown): RecordLike[] => {
  const debug = readRecord(debugExport);
  const payload = extractPayload(debugExport);
  return firstNonEmptyRecords(
    ask.compound_subgoal_rail_statuses,
    payload?.compound_subgoal_rail_statuses,
    getPath(payload, ["debug", "compound_subgoal_rail_statuses"]),
    getPath(payload, ["artifact_query_index", "compound_subgoal_rail_statuses"]),
    getPath(payload, ["debug", "artifact_query_index", "compound_subgoal_rail_statuses"]),
    debug?.compound_subgoal_rail_statuses,
    getPath(debug, ["payload", "compound_subgoal_rail_statuses"]),
    getPath(debug, ["payload", "debug", "compound_subgoal_rail_statuses"]),
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

const compoundSynthesisTerminalKinds = new Set([
  "compound_evidence_synthesis_answer",
  "compound_research_locator_answer",
  "doc_evidence_synthesis_answer",
  "capability_workspace_synthesis_answer",
]);

const singleSubgoalTerminalKinds = new Set([
  "workstation_tool_evaluation",
  "capability_help_summary",
  "doc_location_matches",
  "doc_summary",
  "workspace_status_answer",
]);

const terminalErrorCode = (ask: RecordLike, debugExport: unknown): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_error_code) ??
    readString(payload?.terminal_error_code) ??
    readString(getPath(payload, ["resolved_turn_summary", "terminal_error_code"]))
  );
};

const readTerminalKind = (ask: RecordLike, debugExport: unknown, rail: RecordLike | null): string | null => {
  const payload = extractPayload(debugExport);
  return (
    readString(ask.terminal_artifact_kind) ??
    readString(payload?.terminal_artifact_kind) ??
    readString(rail?.selected_terminal_kind) ??
    readString(getPath(payload, ["terminal_answer_authority", "terminal_artifact_kind"]))
  );
};

const summarizeTurn = (scenario: UserPromptScenario, ask: RecordLike, debugExport: unknown): RecordLike => {
  const payload = extractPayload(debugExport);
  const rail = railTable(ask, debugExport);
  const subgoals = compoundSubgoals(ask, debugExport);
  const text = selectedFinalText(ask, debugExport);
  const terminalKind = readTerminalKind(ask, debugExport, rail);
  const visibleKind =
    readString(ask.visible_terminal_kind) ??
    readString(payload?.visible_terminal_kind) ??
    readString(rail?.visible_terminal_kind);
  const terminalError = terminalErrorCode(ask, debugExport);
  const finalAnswerSource = readString(ask.final_answer_source) ?? readString(payload?.final_answer_source);
  const railStatus = readString(rail?.rail_status);
  const codexParityClass = readString(rail?.codex_parity_class);
  const firstBrokenRail = readString(rail?.first_broken_rail);
  const railFailureCode = readString(rail?.rail_failure_code);
  const repairTarget = readString(rail?.repair_target);
  const requestedCapability = readString(rail?.requested_capability);
  const selectedCapability = readString(rail?.selected_capability);
  const executedCapability = readString(rail?.executed_capability);
  const observationKind = readString(rail?.observation_kind);
  const observationRef = readString(rail?.observation_ref);
  const goalSatisfaction =
    readString(rail?.goal_satisfaction) ??
    readString(getPath(payload, ["goal_satisfaction", "status"])) ??
    readString(getPath(payload, ["current_turn_goal_satisfaction", "status"]));
  const terminalAuthorityProven =
    typeof rail?.terminal_authority_proven === "boolean" ? rail.terminal_authority_proven : null;
  const visibleProjectionProven =
    typeof rail?.visible_projection_proven === "boolean" ? rail.visible_projection_proven : null;
  const compoundTerminalNotSynthesis =
    subgoals.length > 1 &&
    Boolean(terminalKind) &&
    !compoundSynthesisTerminalKinds.has(terminalKind ?? "") &&
    singleSubgoalTerminalKinds.has(terminalKind ?? "");

  const qualityFlags = [
    !debugExport ? "debug_export_missing" : "",
    !rail ? "rail_table_missing" : "",
    terminalError ? `terminal_error:${terminalError}` : "",
    terminalKind === "typed_failure" || finalAnswerSource === "typed_failure" ? "typed_failure" : "",
    text.trim().length === 0 ? "empty_answer" : "",
    text.trim().length > 0 && text.trim().length < 80 && terminalKind !== "typed_failure" ? "short_answer" : "",
    terminalKind && visibleKind && terminalKind !== visibleKind ? `terminal_projection_mismatch:${terminalKind}!=${visibleKind}` : "",
    compoundTerminalNotSynthesis ? `compound_terminal_not_synthesis:${terminalKind}` : "",
    railStatus && !["complete", "satisfied"].includes(railStatus) ? `rail_status:${railStatus}` : "",
    codexParityClass && codexParityClass !== "complete" ? `codex_parity_class:${codexParityClass}` : "",
  ].filter(Boolean);

  const verdict: Verdict =
    terminalError || terminalKind === "typed_failure" || finalAnswerSource === "typed_failure" || firstBrokenRail
      ? "FAIL"
      : !rail || qualityFlags.length > 0 || railStatus !== "complete" || codexParityClass !== "complete"
      ? "WARN"
      : "PASS";

  return {
    schema: "helix.ask_user_prompt_corpus_probe_result.v1",
    id: scenario.id,
    category: scenario.category,
    prompt: scenario.prompt,
    verdict,
    answer_quality_status: verdict === "PASS" ? "usable" : verdict === "WARN" ? "needs_review" : "failed",
    answer_quality_flags: qualityFlags,
    answer_excerpt: text.trim().slice(0, 500),
    final_answer_source: finalAnswerSource,
    terminal_artifact_kind: terminalKind,
    visible_terminal_kind: visibleKind,
    terminal_error_code: terminalError,
    requested_capability: requestedCapability,
    selected_capability: selectedCapability,
    executed_capability: executedCapability,
    observation_kind: observationKind,
    observation_ref: observationRef,
    goal_satisfaction: goalSatisfaction,
    terminal_authority_proven: terminalAuthorityProven,
    visible_projection_proven: visibleProjectionProven,
    rail_status: railStatus,
    codex_parity_class: codexParityClass,
    first_broken_rail: firstBrokenRail,
    rail_failure_code: railFailureCode,
    repair_target: repairTarget,
    compound_subgoal_count: subgoals.length,
    compound_subgoals: subgoals.map((entry) => ({
      subgoal_id: readString(entry.subgoal_id),
      requested_capability: readString(entry.requested_capability),
      selected_capability: readString(entry.selected_capability),
      executed_capability: readString(entry.executed_capability),
      observation_kind: readString(entry.observation_kind),
      observation_ref: readString(entry.observation_ref),
      satisfaction: readString(entry.satisfaction),
      rail_status: readString(entry.rail_status),
      first_broken_rail: readString(entry.first_broken_rail),
      rail_failure_code: readString(entry.rail_failure_code),
    })),
  };
};

const loadScenarioFile = async (filePath: string): Promise<UserPromptScenario[]> => {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : readArray(readRecord(parsed)?.scenarios);
  return entries.map((entry, index) => {
    const record = readRecord(entry);
    const prompt = readString(record?.prompt);
    if (!record || !prompt) throw new Error(`Invalid prompt corpus scenario at index ${index}`);
    return {
      id: readString(record.id) ?? `custom_${index + 1}`,
      category: (readString(record.category) as UserPromptScenario["category"] | null) ?? "compound",
      prompt,
      notes: readString(record.notes) ?? undefined,
    };
  });
};

export const selectUserPromptCorpusScenarios = async (): Promise<UserPromptScenario[]> => {
  const customFile = readString(process.env.HELIX_ASK_USER_PROMPT_CORPUS_FILE);
  const scenarios = customFile ? await loadScenarioFile(customFile) : USER_PROMPT_CORPUS_SCENARIOS;
  if (SCENARIO_FILTER.length === 0) return scenarios;
  const requested = new Set(SCENARIO_FILTER);
  return scenarios.filter((scenario) => requested.has(scenario.id));
};

const runScenario = async (
  scenario: UserPromptScenario,
  runId: string,
  outputDir: string,
): Promise<RecordLike> => {
  const threadId = `helix-ask:user-prompt-corpus:${runId}:${scenario.id}`;
  const scenarioDir = path.join(outputDir, slug(scenario.id));
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
  const result = summarizeTurn(scenario, ask, debug);

  await fs.writeFile(path.join(scenarioDir, "ask-response.json"), `${JSON.stringify(ask, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "debug-export.json"), `${JSON.stringify(debug, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "probe-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  return {
    ...result,
    turn_id: turnId,
    artifact_dir: scenarioDir,
  };
};

const verdictRank = (verdict: unknown): number =>
  verdict === "FAIL" ? 3 : verdict === "WARN" ? 2 : verdict === "BLOCKED" ? 1 : 0;

const renderMarkdownSummary = (input: {
  runId: string;
  outputDir: string;
  scenarios: UserPromptScenario[];
  results: RecordLike[];
  preflight?: ProbePreflight;
}): string => {
  const lines = [
    "# Helix Ask User Prompt Corpus Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    `- output_dir: ${input.outputDir}`,
    `- scenario_count: ${input.scenarios.length}`,
    `- delay_ms: ${DELAY_MS}`,
  ];
  if (input.preflight) {
    lines.push(`- preflight: ${input.preflight.ok ? "ok" : "blocked"} (${input.preflight.reason})`);
    if (input.preflight.hint) lines.push(`- preflight_hint: ${input.preflight.hint}`);
  }
  lines.push("", "| Scenario | Verdict | Terminal | Rail | First Broken Rail | Capability | Answer Quality |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const result of input.results) {
    const id = readString(result.id) ?? "unknown";
    const verdict = readString(result.verdict) ?? "WARN";
    const terminal = readString(result.terminal_artifact_kind) ?? "missing";
    const rail = [readString(result.rail_status), readString(result.codex_parity_class)].filter(Boolean).join(" / ") || "missing";
    const firstBroken = readString(result.first_broken_rail) ?? "-";
    const capability = [
      readString(result.requested_capability),
      readString(result.selected_capability),
      readString(result.executed_capability),
    ].map((entry) => entry ?? "-").join(" -> ");
    const quality = readArray(result.answer_quality_flags).join("<br>") || readString(result.answer_quality_status) || "needs_review";
    lines.push(`| ${id} | ${verdict} | ${terminal} | ${rail} | ${firstBroken} | ${capability} | ${quality} |`);
  }
  lines.push("");
  lines.push("## Prompt Excerpts");
  for (const result of input.results) {
    lines.push("");
    lines.push(`### ${readString(result.id) ?? "unknown"} (${readString(result.verdict) ?? "WARN"})`);
    lines.push("");
    lines.push(`Prompt: ${readString(result.prompt) ?? ""}`);
    lines.push("");
    lines.push(readString(result.answer_excerpt) ?? "");
  }
  return `${lines.join("\n")}\n`;
};

const writeBlockedSummary = async (
  outputDir: string,
  runId: string,
  scenarios: UserPromptScenario[],
  preflight: ProbePreflight,
): Promise<RecordLike> => {
  const summary = {
    schema: "helix.ask_user_prompt_corpus_probe_summary.v1",
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    ok: false,
    blocked: true,
    preflight,
    scenario_count: scenarios.length,
    results: [],
  };
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, scenarios, results: [], preflight }));
  return summary;
};

const main = async (): Promise<void> => {
  const runId = `user-prompt-corpus-${Date.now()}`;
  const outputDir = path.join(OUT_DIR, runId);
  const scenarios = await selectUserPromptCorpusScenarios();

  if (DRY_RUN) {
    const summary = {
      schema: "helix.ask_user_prompt_corpus_probe_summary.v1",
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      dry_run: true,
      ok: true,
      scenario_count: scenarios.length,
      scenario_ids: scenarios.map((scenario) => scenario.id),
      scenarios,
    };
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, scenarios, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const preflight = await probeAskTurnApi();
  if (!preflight.ok) {
    const summary = await writeBlockedSummary(outputDir, runId, scenarios, preflight);
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });
  const results: RecordLike[] = [];
  for (const [index, scenario] of scenarios.entries()) {
    if (index > 0 && DELAY_MS > 0) await sleep(DELAY_MS);
    console.log(`[helix-user-prompt-corpus] ${scenario.id}: ${scenario.prompt}`);
    try {
      results.push(await runScenario(scenario, runId, outputDir));
    } catch (error) {
      const scenarioDir = path.join(outputDir, slug(scenario.id));
      await fs.mkdir(scenarioDir, { recursive: true });
      const result = {
        schema: "helix.ask_user_prompt_corpus_probe_result.v1",
        id: scenario.id,
        category: scenario.category,
        prompt: scenario.prompt,
        verdict: "FAIL" as Verdict,
        answer_quality_status: "failed",
        answer_quality_flags: ["probe_exception"],
        error: error instanceof Error ? error.message : String(error),
        artifact_dir: scenarioDir,
      };
      await fs.writeFile(path.join(scenarioDir, "probe-result.json"), `${JSON.stringify(result, null, 2)}\n`);
      results.push(result);
    }
  }

  const counts = results.reduce<Record<string, number>>((acc, result) => {
    const verdict = readString(result.verdict) ?? "WARN";
    acc[verdict] = (acc[verdict] ?? 0) + 1;
    return acc;
  }, {});
  const worst = results.reduce((max, result) => Math.max(max, verdictRank(result.verdict)), 0);
  const ok = worst < 3 && (!FAIL_ON_WARN || worst < 2);
  const summary = {
    schema: "helix.ask_user_prompt_corpus_probe_summary.v1",
    run_id: runId,
    base_url: BASE_URL,
    output_dir: outputDir,
    ok,
    blocked: false,
    preflight,
    scenario_count: scenarios.length,
    verdict_counts: counts,
    results,
  };

  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, outputDir, scenarios, results, preflight }));
  console.log(JSON.stringify(summary, null, 2));
  if (!ok) process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
