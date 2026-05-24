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

const collectCoverageArtifacts = (debugExport: Record<string, unknown> | null): unknown[] => {
  if (!debugExport) return [];
  if (Array.isArray(debugExport.coverage_artifacts)) return debugExport.coverage_artifacts;
  const ledger = Array.isArray(debugExport.current_turn_artifact_ledger) ? debugExport.current_turn_artifact_ledger : [];
  return ledger.filter((entry) => {
    const kind = readString(asRecord(entry)?.kind);
    return kind === "calculator_plan_coverage" || /_coverage$/.test(kind);
  });
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
  const terminalAuthorityText = readString(terminalAuthority?.terminal_text_preview);
  const selectedFinalAnswer = readString(debugExport?.selected_final_answer);
  const coverageArtifacts = collectCoverageArtifacts(debugExport);
  const calculatorPanelState = await collectCalculatorPanelState(page);
  const parity = asRecord(debugExport?.ui_debug_parity_harness);
  const violations: string[] = [];

  if (!debugExport) violations.push("debug_export_missing");
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
