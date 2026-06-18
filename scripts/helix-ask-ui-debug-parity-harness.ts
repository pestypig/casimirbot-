import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

type HarnessPrompt = {
  prompt: string;
  expectCoverage?: boolean;
  expectCalculatorPanel?: boolean;
};

type HarnessResult = {
  prompt: string;
  visible_final_answer: string;
  debug_export: Record<string, unknown> | null;
  terminal_authority: unknown;
  codex_parity_agent_spine_rail_table: unknown;
  goal_satisfaction: unknown;
  agent_runtime_loop: unknown;
  coverage_artifacts: unknown[];
  calculator_panel_state: Record<string, unknown> | null;
  violations: string[];
};

const BASE_URL = process.env.HELIX_ASK_UI_URL ?? process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:5050/desktop";
const OUT_PATH =
  process.env.HELIX_ASK_UI_DEBUG_PARITY_OUT ??
  path.resolve(process.cwd(), "artifacts/helix-ask/ui-debug-parity-latest.json");

const DEFAULT_PROMPTS: HarnessPrompt[] = [
  { prompt: "Open docs panel." },
  { prompt: "What doc are we looking at right now?" },
  { prompt: "Use calculator solve x^2-9=0.", expectCoverage: true, expectCalculatorPanel: true },
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];

const getPath = (value: unknown, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);

const CODEX_PARITY_AGENT_SPINE_CLASSES = [
  "complete",
  "tool_surface_missing",
  "explicit_capability_demoted",
  "tool_admission_rejected",
  "selected_not_executed",
  "observation_missing",
  "observation_not_reentered",
  "goal_contract_mismatch",
  "terminal_product_not_allowed",
  "terminal_authority_mismatch",
  "visible_projection_mismatch",
  "debug_mirror_stale",
  "provider_config_missing",
] as const;

const collectCoverageArtifacts = (debugExport: Record<string, unknown> | null): unknown[] => {
  if (!debugExport) return [];
  if (Array.isArray(debugExport.coverage_artifacts)) return debugExport.coverage_artifacts;
  const ledger = Array.isArray(debugExport.current_turn_artifact_ledger) ? debugExport.current_turn_artifact_ledger : [];
  return ledger.filter((entry) => {
    const kind = readString(asRecord(entry)?.kind);
    return kind === "calculator_plan_coverage" || /_coverage$/.test(kind);
  });
};

const findRailTable = (debugExport: Record<string, unknown> | null): Record<string, unknown> | null =>
  asRecord(debugExport?.codex_parity_agent_spine_rail_table) ??
  asRecord(getPath(debugExport, ["debug", "codex_parity_agent_spine_rail_table"])) ??
  asRecord(getPath(debugExport, ["artifact_query_index", "codex_parity_agent_spine_rail_table"])) ??
  asRecord(getPath(debugExport, ["debug", "artifact_query_index", "codex_parity_agent_spine_rail_table"]));

const collectRailTableViolations = (
  railTable: Record<string, unknown> | null,
  terminalAuthority: Record<string, unknown> | null,
): string[] => {
  if (!railTable) return ["codex_parity_agent_spine_rail_table_missing"];
  const violations: string[] = [];
  if (railTable.schema !== "helix.codex_parity_agent_spine_rail_table.v1") {
    violations.push("codex_parity_agent_spine_rail_table_schema_mismatch");
  }
  if (!Array.isArray(railTable.visible_tool_surface)) {
    violations.push("rail_visible_tool_surface_missing");
  }
  const normalizedClasses = readStringArray(railTable.normalized_codex_parity_classes);
  if (JSON.stringify(normalizedClasses) !== JSON.stringify(CODEX_PARITY_AGENT_SPINE_CLASSES)) {
    violations.push("rail_normalized_codex_parity_classes_mismatch");
  }
  const codexParityClass = readString(railTable.codex_parity_class);
  if (!CODEX_PARITY_AGENT_SPINE_CLASSES.includes(codexParityClass as (typeof CODEX_PARITY_AGENT_SPINE_CLASSES)[number])) {
    violations.push("rail_codex_parity_class_invalid");
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
    violations.push("rail_admitted_capability_missing");
  }
  if (admittedCapability && !admissionProofSource) {
    violations.push("rail_admission_proof_source_missing");
  }
  if (admittedCapability && railTable.admission_proven !== true) {
    violations.push("rail_admission_not_proven");
  }
  if (requestedCapability && !Array.isArray(railTable.required_observation_kinds_for_requested_capability)) {
    violations.push("rail_requested_observation_kinds_missing");
  }
  if (requestedCapability && typeof observationSupportsRequested !== "boolean") {
    violations.push("rail_observation_support_verdict_missing");
  }
  if (
    requestedCapability &&
    (goalSatisfaction === "satisfied" || readString(railTable.rail_status) === "complete" || codexParityClass === "complete") &&
    requiredObservationKinds.length > 0 &&
    observationSupportsRequested !== true
  ) {
    violations.push("rail_goal_satisfied_without_requested_observation_support");
  }
  const firstBrokenRail = readString(railTable.first_broken_rail);
  const reentryStatus = readString(railTable.reentry_status);
  const reentryProofSource = readString(railTable.reentry_proof_source);
  if (reentryStatus === "reentered" && !reentryProofSource) {
    violations.push("rail_reentry_proof_source_missing");
  }
  if (reentryStatus === "reentered" && railTable.reentry_proven !== true) {
    violations.push("rail_reentry_not_proven");
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && reentryStatus !== "reentered") {
    violations.push("rail_complete_without_reentry");
  }
  if ((readString(railTable.rail_status) === "complete") !== (codexParityClass === "complete")) {
    violations.push("rail_completion_status_class_mismatch");
  }
  if (codexParityClass === "complete" && firstBrokenRail) {
    violations.push("rail_complete_with_first_broken_rail");
  }
  if (codexParityClass && codexParityClass !== "complete" && !firstBrokenRail) {
    violations.push("rail_non_complete_without_first_broken_rail");
  }
  const selectedTerminalKind = readString(railTable.selected_terminal_kind);
  const visibleTerminalKind = readString(railTable.visible_terminal_kind);
  const terminalAuthorityProofSource = readString(railTable.terminal_authority_proof_source);
  const visibleProjectionSource = readString(railTable.visible_projection_source);
  if (selectedTerminalKind && !terminalAuthorityProofSource) {
    violations.push("rail_terminal_authority_proof_source_missing");
  }
  if (selectedTerminalKind && railTable.terminal_authority_proven !== true) {
    violations.push("rail_terminal_authority_not_proven");
  }
  if (visibleTerminalKind && !visibleProjectionSource) {
    violations.push("rail_visible_projection_source_missing");
  }
  if (visibleTerminalKind && railTable.visible_projection_proven !== true) {
    violations.push("rail_visible_projection_not_proven");
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && !selectedTerminalKind) {
    violations.push("rail_complete_without_terminal_authority");
  }
  if ((codexParityClass === "complete" || readString(railTable.rail_status) === "complete") && !visibleTerminalKind) {
    violations.push("rail_complete_without_visible_projection");
  }
  if (selectedTerminalKind && visibleTerminalKind && selectedTerminalKind !== visibleTerminalKind) {
    violations.push("rail_selected_visible_terminal_kind_mismatch");
  }
  const terminalAuthorityKind =
    readString(terminalAuthority?.selected_terminal_artifact_kind) ||
    readString(terminalAuthority?.terminal_artifact_kind);
  if (terminalAuthorityKind && selectedTerminalKind && terminalAuthorityKind !== selectedTerminalKind) {
    violations.push("rail_terminal_authority_kind_mismatch");
  }
  return violations;
};

const completeRailEnvelopeViolations = (input: {
  railTable: Record<string, unknown> | null;
  debugExport: Record<string, unknown> | null;
  visibleFinalAnswer: string;
}): string[] => {
  const railTable = input.railTable;
  if (!railTable) return [];
  const railComplete =
    readString(railTable.codex_parity_class) === "complete" ||
    readString(railTable.rail_status) === "complete";
  if (!railComplete) return [];
  const violations: string[] = [];
  const terminalErrorCode =
    readString(input.debugExport?.terminal_error_code) ||
    readString(getPath(input.debugExport, ["resolved_turn_summary", "terminal_error_code"]));
  const finalStatus = readString(input.debugExport?.final_status);
  const responseType = readString(input.debugExport?.response_type);
  const finalAnswerSource = readString(input.debugExport?.final_answer_source);
  const terminalKind =
    readString(input.debugExport?.terminal_artifact_kind) ||
    readString(getPath(input.debugExport, ["terminal_answer_authority", "terminal_artifact_kind"]));

  if (terminalErrorCode) violations.push(`complete_rail_terminal_error:${terminalErrorCode}`);
  if (finalAnswerSource === "typed_failure" || terminalKind === "typed_failure") {
    violations.push("complete_rail_typed_failure_terminal");
  }
  if ((finalStatus && finalStatus !== "final_answer") || (responseType && responseType !== "final_answer")) {
    violations.push(`complete_rail_non_final_response:${finalStatus ?? "missing"}/${responseType ?? "missing"}`);
  }
  if (!input.visibleFinalAnswer) violations.push("complete_rail_missing_visible_final_answer");
  return violations;
};

async function installClipboardFailureShim(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("harness_clipboard_write_denied");
        },
        readText: async () => {
          throw new Error("harness_clipboard_read_denied");
        },
      },
    });
  });
}

async function submitPrompt(page: Page, prompt: string): Promise<void> {
  const input = page.locator('textarea[aria-label="Ask Helix"]');
  await input.fill(prompt);
  await page.locator('button[aria-label="Submit prompt"]').click();
  await page.waitForFunction(
    (expected) => {
      const question = document.querySelector('[data-testid="helix-ask-latest-question"]')?.textContent ?? "";
      const final = document.querySelector('[data-testid="helix-ask-latest-final-answer"]');
      return question.includes(String(expected)) && Boolean(final);
    },
    prompt,
    { timeout: 90_000 },
  );
}

async function collectDebugExport(page: Page): Promise<Record<string, unknown> | null> {
  const debugButton = page.locator('[data-testid="helix-ask-latest-debug-copy"]');
  if ((await debugButton.count()) === 0) return null;
  await debugButton.click();
  await page.waitForFunction(
    () => Boolean((window as unknown as { __HELIX_LAST_UNIFIED_DEBUG_COPY__?: string }).__HELIX_LAST_UNIFIED_DEBUG_COPY__),
    undefined,
    { timeout: 15_000 },
  );
  const raw = await page.evaluate(() => (window as unknown as { __HELIX_LAST_UNIFIED_DEBUG_COPY__?: string }).__HELIX_LAST_UNIFIED_DEBUG_COPY__ ?? "");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function collectCalculatorPanelState(page: Page): Promise<Record<string, unknown> | null> {
  const log = page.locator('[data-testid="scientific-calculator-debug-log"]');
  if ((await log.count()) === 0) return null;
  return await log.evaluate((node) => {
    const element = node as HTMLElement;
    const events = [...element.querySelectorAll('[data-testid="scientific-calculator-debug-event"]')].map((entry) => ({
      text: (entry.textContent ?? "").trim(),
      compound_run_id: (entry as HTMLElement).dataset.compoundRunId ?? "",
      compound_subgoal_id: (entry as HTMLElement).dataset.compoundSubgoalId ?? "",
    }));
    return {
      current_compound_run_id: element.dataset.currentCompoundRunId ?? "",
      visible_compound_run_ids: (element.dataset.visibleCompoundRunIds ?? "").split(",").filter(Boolean),
      stale_compound_run_visible: element.dataset.staleCompoundRunVisible === "true",
      visible_events: events,
    };
  });
}

async function runPrompt(page: Page, item: HarnessPrompt): Promise<HarnessResult> {
  await submitPrompt(page, item.prompt);
  const visibleFinalAnswer = await page
    .locator('[data-testid="helix-ask-latest-final-answer"]')
    .getAttribute("data-final-answer-text")
    .then((value) => value ?? "");
  const debugExport = await collectDebugExport(page);
  const terminalAuthority = asRecord(debugExport?.terminal_answer_authority);
  const railTable = findRailTable(debugExport);
  const terminalAuthorityText = readString(terminalAuthority?.terminal_text_preview);
  const selectedFinalAnswer = readString(debugExport?.selected_final_answer);
  const coverageArtifacts = collectCoverageArtifacts(debugExport);
  const calculatorPanelState = await collectCalculatorPanelState(page);
  const parity = asRecord(debugExport?.ui_debug_parity_harness);
  const violations: string[] = [];

  if (!debugExport) violations.push("debug_export_missing");
  violations.push(...collectRailTableViolations(railTable, terminalAuthority));
  violations.push(...completeRailEnvelopeViolations({ railTable, debugExport, visibleFinalAnswer }));
  if (!visibleFinalAnswer) violations.push("visible_final_answer_missing");
  if (terminalAuthorityText && visibleFinalAnswer !== terminalAuthorityText) {
    violations.push("ui_terminal_authority_text_mismatch");
  }
  if (selectedFinalAnswer && visibleFinalAnswer !== selectedFinalAnswer) {
    violations.push("ui_selected_final_answer_mismatch");
  }
  if (!terminalAuthority) violations.push("terminal_authority_missing");
  if (!asRecord(debugExport?.goal_satisfaction_evaluation)) violations.push("goal_satisfaction_missing");
  if (!asRecord(debugExport?.agent_runtime_loop) && !asRecord(debugExport?.agent_step_loop)) {
    violations.push("agent_loop_missing");
  }
  if (item.expectCoverage && coverageArtifacts.length === 0) violations.push("coverage_artifact_missing");
  if (item.expectCalculatorPanel) {
    if (!calculatorPanelState) violations.push("calculator_panel_state_missing");
    if (calculatorPanelState?.stale_compound_run_visible === true) violations.push("calculator_panel_stale_compound_run_visible");
  }
  if (parity?.clipboard_debug_copy_required_for_prompt_submission !== false) {
    violations.push("clipboard_debug_copy_can_block_prompt_submission");
  }

  return {
    prompt: item.prompt,
    visible_final_answer: visibleFinalAnswer,
    debug_export: debugExport,
    terminal_authority: terminalAuthority,
    codex_parity_agent_spine_rail_table: railTable,
    goal_satisfaction: debugExport?.goal_satisfaction_evaluation ?? null,
    agent_runtime_loop: debugExport?.agent_runtime_loop ?? debugExport?.agent_step_loop ?? null,
    coverage_artifacts: coverageArtifacts,
    calculator_panel_state: calculatorPanelState,
    violations,
  };
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await installClipboardFailureShim(page);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  const results: HarnessResult[] = [];
  try {
    for (const item of DEFAULT_PROMPTS) {
      results.push(await runPrompt(page, item));
    }
  } finally {
    await browser.close();
  }

  const output = {
    schema: "helix.ask.ui_debug_parity_harness_report.v1",
    url: BASE_URL,
    created_at: new Date().toISOString(),
    results,
    ok: results.every((result) => result.violations.length === 0),
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  if (!output.ok) {
    console.error(JSON.stringify(output, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Helix Ask UI/debug parity passed: ${OUT_PATH}`);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
