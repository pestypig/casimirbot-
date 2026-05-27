import fs from "node:fs/promises";
import path from "node:path";

type RecordLike = Record<string, unknown>;

type Verdict = "PASS" | "WARN" | "FAIL";

type ToolChainScenario = {
  id: string;
  prompt: string;
  category:
    | "workstation_tool"
    | "docs_source"
    | "calculator_tool"
    | "mutating_guard"
    | "situation_room"
    | "voice_policy"
    | "negated_tool"
    | "repo_evidence";
};

const BASE_URL = (process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5050").replace(/\/+$/, "");
const OUT_DIR = process.env.HELIX_ASK_TOOL_CHAIN_OUT ?? "artifacts/helix-ask-tool-chain-matrix";
const TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_TOOL_CHAIN_TIMEOUT_MS ?? 240_000));
const FAIL_ON_WARN = process.env.HELIX_ASK_TOOL_CHAIN_FAIL_ON_WARN === "1";
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

const getPayload = (ask: RecordLike, debug: RecordLike | null): RecordLike => {
  const debugPayload = readRecord(debug?.payload);
  if (debugPayload) return debugPayload;
  const nestedDebug = readRecord(debug?.debug);
  const nestedPayload = readRecord(nestedDebug?.payload);
  if (nestedPayload) return nestedPayload;
  return ask;
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
    debugAvailable,
    repoPacketPresent,
  } = input;

  if (!debugAvailable) warnings.push("debug_export_missing");
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

const renderMarkdownSummary = (input: { runId: string; results: RecordLike[]; outputDir: string }): string => {
  const lines = [
    "# Helix Ask Tool Chain Matrix Probe",
    "",
    `- run_id: ${input.runId}`,
    `- base_url: ${BASE_URL}`,
    `- output_dir: ${input.outputDir}`,
    "",
    "| Verdict | Scenario | Terminal | Error | Key findings |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const result of input.results) {
    const findings = [...readArray(result.failures), ...readArray(result.warnings)]
      .map(String)
      .join("; ");
    lines.push(
      `| ${readString(result.verdict)} | ${readString(result.scenario_id)} | ${readString(result.terminal_artifact_kind) || "-"} | ${
        readString(result.terminal_error_code) || "-"
      } | ${findings || "none"} |`,
    );
  }
  return `${lines.join("\n")}\n`;
};

const main = async (): Promise<void> => {
  const selected = new Set(SCENARIO_FILTER);
  const scenarios = SCENARIO_FILTER.length ? SCENARIOS.filter((scenario) => selected.has(scenario.id)) : SCENARIOS;
  const runId = `tool-chain-${Date.now()}`;
  const outputDir = path.resolve(OUT_DIR, runId);
  await fs.mkdir(outputDir, { recursive: true });

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
    results,
  };
  await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, "summary.md"), renderMarkdownSummary({ runId, results, outputDir }));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
