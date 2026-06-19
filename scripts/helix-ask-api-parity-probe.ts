import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  API_PARITY_SCENARIOS,
  getEnabledApiParityScenarios,
  type HelixApiParityScenario,
} from "../server/services/helix-ask/api-parity-matrix";
import { buildApiParityProbeResult } from "../server/services/helix-ask/api-parity-probe";

type RecordLike = Record<string, unknown>;

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:1498").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_API_PARITY_OUT ?? "artifacts/helix-ask-api-parity";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_API_PARITY_TIMEOUT_MS ?? 180_000));
const INCLUDE_DISABLED = process.env.HELIX_ASK_API_PARITY_INCLUDE_DISABLED === "1";
const DRY_RUN = process.argv.includes("--dry-run") || process.env.HELIX_ASK_API_PARITY_DRY_RUN === "1";
const SCENARIO_FILTER = (process.env.HELIX_ASK_API_PARITY_SCENARIOS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

export type HelixApiParityScenarioSelection = {
  scenarios: HelixApiParityScenario[];
  requestedIds: string[];
  unknownIds: string[];
  availableIds: string[];
};

export const selectApiParityScenarios = (
  requestedIds: string[] = SCENARIO_FILTER,
  includeDisabled = INCLUDE_DISABLED,
): HelixApiParityScenarioSelection => {
  const normalizedRequestedIds = Array.from(new Set(requestedIds.map((entry) => entry.trim()).filter(Boolean)));
  const availableScenarios = includeDisabled ? API_PARITY_SCENARIOS : getEnabledApiParityScenarios(false);
  const availableIds = API_PARITY_SCENARIOS.map((scenario) => scenario.id);
  if (normalizedRequestedIds.length === 0) {
    return {
      scenarios: availableScenarios,
      requestedIds: [],
      unknownIds: [],
      availableIds,
    };
  }
  const allKnownIds = new Set(API_PARITY_SCENARIOS.map((scenario) => scenario.id));
  return {
    scenarios: API_PARITY_SCENARIOS.filter((scenario) => normalizedRequestedIds.includes(scenario.id)),
    requestedIds: normalizedRequestedIds,
    unknownIds: normalizedRequestedIds.filter((id) => !allKnownIds.has(id)),
    availableIds,
  };
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
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 800)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const seedBodyFor = (scenario: HelixApiParityScenario, threadId: string): RecordLike | null => {
  if (scenario.seed === "none") return null;
  if (scenario.seed === "active_run_with_unbound_visual_source") {
    return {
      scenario: "active_run_with_unbound_visual_source",
      thread_id: threadId,
      bound_source_id: `visual_source:${scenario.id}:bound`,
      unbound_source_id: `visual_source:${scenario.id}:fresh`,
      bound_scene_text: "A backend-seeded visual capture shows File Explorer open to a research folder.",
      unbound_scene_text: "A fresh visual capture shows the Helix Ask UI with worker-lane debug output.",
      confidence: 0.82,
    };
  }
  const startButton = scenario.seed === "visual_frame_with_start_button";
  return {
    thread_id: threadId,
    source_id: `visual_source:${scenario.id}`,
    scene_text: startButton
      ? "A backend-seeded visual capture shows a workstation panel with a visible Start button and status controls."
      : "A backend-seeded visual capture shows File Explorer open to a research folder.",
    activity: startButton
      ? "Reviewing a workstation panel that includes a Start button."
      : "Reviewing a research folder in File Explorer.",
    objects: startButton
      ? "workstation panel, Start button, status controls"
      : "File Explorer window, research folder, visible file list",
    confidence: 0.82,
  };
};

const runScenario = async (scenario: HelixApiParityScenario, runId: string, outputDir: string): Promise<RecordLike> => {
  const threadId = `helix-ask:api-parity:${runId}:${scenario.id}`;
  const scenarioDir = path.join(outputDir, scenario.id);
  await fs.mkdir(scenarioDir, { recursive: true });

  const seedBody = seedBodyFor(scenario, threadId);
  const seed = seedBody
    ? await fetchJson<RecordLike>(`${BASE_URL}/api/agi/situation/test-harness/live-visual-source`, {
        method: "POST",
        body: JSON.stringify(seedBody),
      })
    : null;

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
  const turnId = typeof ask.turn_id === "string" ? ask.turn_id : "";
  const debug = turnId
    ? await fetchJson<RecordLike>(`${BASE_URL}/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
    : null;
  const result = buildApiParityProbeResult({
    scenario,
    askTurn: ask,
    debugExport: debug,
    terminalEventSeen: true,
    streamClosedAfterTerminal: true,
  });

  await fs.writeFile(path.join(scenarioDir, "ask-response.json"), `${JSON.stringify(ask, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "debug-export.json"), `${JSON.stringify(debug, null, 2)}\n`);
  await fs.writeFile(path.join(scenarioDir, "probe-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
};

const renderMarkdownSummary = (input: { runId: string; results: RecordLike[] }): string => {
  const lines = [
    "# Helix Ask API Parity Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    "",
    "## Scenarios",
  ];
  for (const result of input.results) {
    const ok = result.procedural_ok === true;
    lines.push(
      "",
      `### ${ok ? "PASS" : "FAIL"} ${result.scenario_id}`,
      "",
      `- prompt: ${result.prompt}`,
      `- turn_id: ${result.non_stream_turn_id}`,
      `- source_target: ${result.source_target}`,
      `- route: ${result.selected_route}`,
      `- terminal: ${result.terminal_artifact_kind}`,
      `- rail_class: ${String((result.rail_table as RecordLike | undefined)?.codex_parity_class ?? null)}`,
      `- first_broken_rail: ${String((result.rail_table as RecordLike | undefined)?.first_broken_rail ?? null)}`,
      `- repair_target: ${String((result.rail_table as RecordLike | undefined)?.repair_target ?? null)}`,
      `- selected/admitted/executed: ${String((result.rail_table as RecordLike | undefined)?.selected_capability ?? null)} / ${String((result.rail_table as RecordLike | undefined)?.admitted_capability ?? null)} / ${String((result.rail_table as RecordLike | undefined)?.executed_capability ?? null)}`,
      `- observation: ${String((result.rail_table as RecordLike | undefined)?.observation_kind ?? null)} ${String((result.rail_table as RecordLike | undefined)?.observation_ref ?? null)}`,
      `- visible_tool_surface: ${JSON.stringify((result.rail_table as RecordLike | undefined)?.visible_tool_surface ?? [])}`,
      `- route_authority_ok: ${String((result.route_authority as RecordLike | undefined)?.ok ?? null)}`,
      `- terminal_authority_ok: ${String(result.terminal_authority_ok)}`,
      `- failures: ${JSON.stringify(result.failures ?? [])}`,
    );
  }
  return `${lines.join("\n")}\n`;
};

const main = async (): Promise<void> => {
  const selection = selectApiParityScenarios();
  const scenarios = selection.scenarios;
  const runId = `api-parity-${Date.now()}`;
  const outputDir = path.resolve(OUT_DIR, runId);
  await fs.mkdir(outputDir, { recursive: true });

  if (selection.unknownIds.length || scenarios.length === 0) {
    const summary = {
      ok: false,
      blocked: true,
      blocked_reason: selection.unknownIds.length ? "unknown_scenario_filter" : "no_scenarios_selected",
      run_id: runId,
      base_url: BASE_URL,
      output_dir: outputDir,
      requested_scenarios: selection.requestedIds,
      selected_scenarios: scenarios.map((scenario) => scenario.id),
      unknown_scenarios: selection.unknownIds,
      available_scenarios: selection.availableIds,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results: [] }));
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
      requested_scenarios: selection.requestedIds,
      selected_scenarios: scenarios.map((scenario) => scenario.id),
      available_scenarios: selection.availableIds,
      scenarios,
      results: [],
    };
    await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results: [] }));
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const results: RecordLike[] = [];
  for (const scenario of scenarios) {
    try {
      results.push(await runScenario(scenario, runId, outputDir));
    } catch (error) {
      results.push({
        schema: "helix.api_parity_probe_result.v1",
        scenario_id: scenario.id,
        prompt: scenario.prompt,
        procedural_ok: false,
        failures: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  const summary = {
    ok: results.every((result) => result.procedural_ok === true),
    run_id: runId,
    output_dir: outputDir,
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
