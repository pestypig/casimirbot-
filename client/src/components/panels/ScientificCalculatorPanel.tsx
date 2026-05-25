import { useEffect, useMemo, useRef, useState } from "react";
import { renderToString as renderKatexToString } from "katex";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT,
  type ScientificCalculatorMathPickedDetail,
} from "@/lib/scientific-calculator/events";
import { formatScientificCalculatorDebugLog } from "@/lib/scientific-calculator/debugLog";
import { runScientificSolve, type ScientificSolveTrace } from "@/lib/scientific-calculator/solver";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useWorkstationSessionMemoryStore } from "@/store/useWorkstationSessionMemoryStore";
import { ScientificCalculatorLiveSourceControls } from "./ScientificCalculatorLiveSourceControls";
import type { HelixCalculatorSetupVariable } from "@shared/helix-calculator-setup-context";
import type { ScientificCalculatorDebugEvent, ScientificCalculatorHistoryEntry } from "@/store/useScientificCalculatorStore";
import type { ScientificCalculatorStepTraceArtifactV1 } from "@shared/contracts/scientific-calculator-step-schema.v1";

const SCIENTIFIC_CALCULATOR_DRAFT_KEY = "scientific-calculator:input";

function isLiveRegisterSummary(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return (
    /\bcandidate\s*=/.test(normalized) &&
    /\bisPrime\(candidate\)\s*=/.test(normalized) &&
    /\bpreviousPrime\s*=/.test(normalized) &&
    /\blatestPrime\s*=/.test(normalized) &&
    /\bprimeCount\s*=/.test(normalized) &&
    /\bnextCandidate\s*=/.test(normalized)
  );
}

function isGeneratedLiveEquation(value: string | null | undefined): boolean {
  return /^\s*\d+\s*\\bmod\s+\d+\s*=\s*-?\d+\s*$/i.test(String(value ?? "").trim());
}

function normalizeCalculatorInputDraft(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  return isLiveRegisterSummary(text) ? "" : text;
}

function resolveInitialCalculatorInput(draft: string | null | undefined, currentLatex: string): string {
  const draftInput = normalizeCalculatorInputDraft(draft);
  const currentInput = normalizeCalculatorInputDraft(currentLatex);
  if (draftInput && isGeneratedLiveEquation(draftInput) && currentInput && currentInput !== draftInput) {
    return currentInput;
  }
  return draftInput || currentInput;
}

function renderMathHtml(value: string, displayMode: boolean): string {
  const input = value.trim();
  if (!input) return "";
  try {
    return renderKatexToString(input, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return "";
  }
}

function resolveSolveTrace(lastSolve: { trace?: ScientificSolveTrace; input_latex?: string } | null): ScientificSolveTrace {
  if (lastSolve?.trace) return lastSolve.trace;
  const traceId = `scicalc:legacy:${Date.now().toString(36)}`;
  return {
    traceId,
    runId: traceId,
    route: "scientific-calculator/legacy-result",
    engine: "nerdamer",
    sourceOfTruth: "scientific_calculator",
    capabilityClass: "symbolic_algebra",
    artifactPath: null,
    warnings: ["This result was restored from an older calculator state without trace metadata."],
  };
}

function setupVariableText(variable: { symbol: string; value: string; unit?: string | null; meaning?: string | null; dimension_signature?: string | null }): string {
  const unit = variable.unit ? ` ${variable.unit}` : "";
  const meaning = variable.meaning ? ` (${variable.meaning})` : "";
  const dimension = variable.dimension_signature ? ` [${variable.dimension_signature}]` : "";
  return `${variable.symbol} = ${variable.value}${unit}${meaning}${dimension}`;
}

function setupUnitOptionText(option: { symbol: string; quantity: string; si_factor: number }): string {
  return option.si_factor === 1 ? option.symbol : `${option.symbol} -> SI x ${option.si_factor}`;
}

function formatArtifactStepsMarkdown(artifact: ScientificCalculatorStepTraceArtifactV1): string {
  const lines = [
    "# Scientific Calculator Steps",
    "",
    `Input: ${artifact.request.inputLatex}`,
    `Mode: ${artifact.request.mode}`,
    `Result: ${artifact.result.text}`,
    "",
  ];
  for (const step of artifact.steps) {
    lines.push(`${step.index}. ${step.title}`);
    lines.push(`   Stage: ${step.stage}`);
    lines.push(`   Text: ${step.text}`);
    if (step.latex) lines.push(`   LaTeX: ${step.latex}`);
    if (step.operation) lines.push(`   Operation: ${step.operation.kind} (${step.operation.rule})`);
    if (step.warnings.length > 0) lines.push(`   Warnings: ${step.warnings.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function resolveScientificCalculatorVisibleDebugEvents(
  debugEvents: ScientificCalculatorDebugEvent[],
  limit = 8,
): {
  currentCompoundRunId: string | null;
  visibleEvents: ScientificCalculatorDebugEvent[];
  visibleCompoundRunIds: string[];
  staleCompoundRunVisible: boolean;
} {
  const currentCompoundRunId = debugEvents.find((entry) => Boolean(entry.compound_run_id))?.compound_run_id ?? null;
  const visibleEvents = currentCompoundRunId
    ? debugEvents.filter((entry) => entry.compound_run_id === currentCompoundRunId).slice(0, limit)
    : debugEvents.slice(0, limit);
  const visibleCompoundRunIds = [
    ...new Set(visibleEvents.map((entry) => entry.compound_run_id).filter((value): value is string => Boolean(value))),
  ];
  return {
    currentCompoundRunId,
    visibleEvents,
    visibleCompoundRunIds,
    staleCompoundRunVisible: Boolean(
      currentCompoundRunId && visibleCompoundRunIds.some((runId) => runId !== currentCompoundRunId),
    ),
  };
}

export function resolveScientificCalculatorVisibleHistory(
  history: ScientificCalculatorHistoryEntry[],
  currentCompoundRunId: string | null,
  limit = 6,
): ScientificCalculatorHistoryEntry[] {
  if (!currentCompoundRunId) return history.slice(0, limit);
  return history.filter((entry) => entry.compound_run_id === currentCompoundRunId).slice(0, limit);
}

export default function ScientificCalculatorPanel() {
  const { currentLatex, history, lastSolve, lastArtifactV1, lastSetup, steps, debugEvents, ingestLatex, setSolveResult, recordDebugEvent, clear } =
    useScientificCalculatorStore();
  const rememberDraft = useWorkstationSessionMemoryStore((state) => state.rememberDraft);
  const readDraft = useWorkstationSessionMemoryStore((state) => state.readDraft);
  const clearDraft = useWorkstationSessionMemoryStore((state) => state.clearDraft);
  const [input, setInput] = useState(() =>
    resolveInitialCalculatorInput(readDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY), currentLatex),
  );
  const lastStoredLatexRef = useRef(currentLatex);

  useEffect(() => {
    if (isLiveRegisterSummary(readDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY))) {
      clearDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY);
    }
  }, [clearDraft, readDraft]);

  useEffect(() => {
    if (currentLatex === lastStoredLatexRef.current) return;
    lastStoredLatexRef.current = currentLatex;
    const nextInput = normalizeCalculatorInputDraft(currentLatex);
    setInput(nextInput);
    if (nextInput) {
      rememberDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY, nextInput);
    } else {
      clearDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY);
    }
  }, [clearDraft, currentLatex, rememberDraft]);

  useEffect(() => {
    const onPicked = (event: Event) => {
      const detail = (event as CustomEvent<ScientificCalculatorMathPickedDetail>).detail;
      if (!detail?.latex) return;
      if (useScientificCalculatorStore.getState().currentLatex !== detail.latex) {
        ingestLatex(detail.latex, {
          sourcePath: detail.sourcePath,
          anchor: detail.anchor,
          source: detail.sourcePath === "clipboard" ? "clipboard" : "doc_viewer",
        });
      }
      setInput(detail.latex);
      rememberDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY, detail.latex);
    };
    window.addEventListener(SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT, onPicked as EventListener);
    return () => {
      window.removeEventListener(SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT, onPicked as EventListener);
    };
  }, [ingestLatex, rememberDraft]);

  const handlePasteClipboard = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return;
    ingestLatex(text, { sourcePath: "clipboard", anchor: null, source: "clipboard" });
    setInput(text);
    rememberDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY, text);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    rememberDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY, value);
  };

  const handleClear = () => {
    clear();
    clearDraft(SCIENTIFIC_CALCULATOR_DRAFT_KEY);
    setInput("");
  };

  const solve = (withSteps: boolean) => {
    const result = runScientificSolve(input, withSteps);
    setSolveResult(result, { actionId: withSteps ? "solve_with_steps" : "solve_expression", source: "panel" });
  };

  const handleCopyResult = () => {
    const text = lastSolve?.result_text;
    if (!text) {
      recordDebugEvent({
        action_id: "copy_result",
        source: "panel",
        ok: false,
        message: "No calculator result available to copy.",
      });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
    recordDebugEvent({
      action_id: "copy_result",
      source: "panel",
      ok: true,
      result_text: text,
      input_latex: lastSolve.input_latex,
      normalized_expression: lastSolve.normalized_expression,
      trace_id: lastSolve.trace.traceId,
      route: lastSolve.trace.route,
      engine: lastSolve.trace.engine,
      message: "result_copied",
    });
  };

  const handleCopyDebugLog = () => {
    const payload = formatScientificCalculatorDebugLog(debugEvents);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(payload);
    }
    recordDebugEvent({
      action_id: "copy_debug_log",
      source: "panel",
      ok: true,
      message: "debug_log_copied",
    });
  };

  const handleCopyStepsMarkdown = () => {
    if (!lastArtifactV1) {
      recordDebugEvent({
        action_id: "copy_steps_markdown",
        source: "panel",
        ok: false,
        message: "No schema step artifact available to copy.",
      });
      return;
    }
    const payload = formatArtifactStepsMarkdown(lastArtifactV1);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(payload);
    }
    recordDebugEvent({
      action_id: "copy_steps_markdown",
      source: "panel",
      ok: true,
      input_latex: lastArtifactV1.request.inputLatex,
      result_text: lastArtifactV1.result.text,
      normalized_expression: lastArtifactV1.normalization.canonicalText,
      trace_id: lastSolve?.trace.traceId ?? null,
      route: lastSolve?.trace.route ?? null,
      engine: lastArtifactV1.quality.engine,
      message: "steps_markdown_copied",
    });
  };

  const stepItems = useMemo(() => steps ?? [], [steps]);
  const schemaStepItems = useMemo(() => lastArtifactV1?.steps ?? [], [lastArtifactV1?.steps]);
  const resultMathHtml = useMemo(
    () => renderMathHtml(lastSolve?.result_latex ?? "", true),
    [lastSolve?.result_latex],
  );
  const inputPreviewHtml = useMemo(() => renderMathHtml(input, true), [input]);
  const solveTrace = useMemo(() => resolveSolveTrace(lastSolve), [lastSolve]);
  const compoundSolveEvents = useMemo(
    () => {
      const latestChain: typeof debugEvents = [];
      const seenSubgoals = new Set<string>();
      let newestSolveAtMs: number | null = null;
      let newestCompoundRunId: string | null = null;
      for (const entry of debugEvents) {
        if (
          entry.action_id !== "solve_expression" &&
          entry.action_id !== "solve_with_steps"
        ) {
          continue;
        }
        if (
          entry.source !== "workstation_action" ||
          !entry.input_latex ||
          !entry.result_text ||
          !entry.calculator_setup
        ) {
          continue;
        }
        if (newestCompoundRunId === null && entry.compound_run_id) {
          newestCompoundRunId = entry.compound_run_id;
        }
        if (
          newestCompoundRunId &&
          entry.compound_run_id &&
          entry.compound_run_id !== newestCompoundRunId
        ) {
          break;
        }
        const entryAtMs = Date.parse(entry.ts);
        if (Number.isFinite(entryAtMs)) {
          if (newestSolveAtMs === null) {
            newestSolveAtMs = entryAtMs;
          } else if (newestSolveAtMs - entryAtMs > 30_000) {
            break;
          }
        }
        const subgoalKey = [
          entry.calculator_setup.domain ?? "unknown",
          entry.calculator_setup.subgoal ?? entry.input_latex,
          entry.calculator_setup.result_unit ?? "",
        ].join("|");
        if (seenSubgoals.has(subgoalKey)) break;
        seenSubgoals.add(subgoalKey);
        latestChain.push(entry);
        if (latestChain.length >= 6) break;
      }
      return latestChain.reverse();
    },
    [debugEvents],
  );
  const visibleDebugState = useMemo(
    () => resolveScientificCalculatorVisibleDebugEvents(debugEvents),
    [debugEvents],
  );
  const visibleHistory = useMemo(
    () => resolveScientificCalculatorVisibleHistory(history, visibleDebugState.currentCompoundRunId),
    [history, visibleDebugState.currentCompoundRunId],
  );

  return (
    <div className="h-full w-full overflow-auto bg-slate-950/90 p-4 text-slate-100">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide text-cyan-300">Scientific Calculator</div>
        <div className="text-sm text-slate-300">Paste or click equations from Docs, then solve with step traces.</div>
      </div>

      <div className="space-y-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
        <Label className="text-xs text-slate-300">LaTeX / Expression Input</Label>
        <Textarea
          className="min-h-[130px] border-slate-700 bg-slate-900/70 font-mono text-xs text-slate-100"
          value={input}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Example: t_{\\text{proper}} = t_{\\text{shift-driven}} + \\Delta t_{\\text{lapse-driven}}"
        />
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Scientific Preview</div>
            {inputPreviewHtml ? (
              <div
                className="overflow-x-auto rounded border border-slate-800 bg-slate-900/70 px-2 py-2 text-slate-100"
                dangerouslySetInnerHTML={{ __html: inputPreviewHtml }}
              />
            ) : (
              <div className="text-xs text-slate-500">No renderable math yet.</div>
            )}
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Normalized Expression</div>
            <div className="break-words font-mono text-xs text-slate-200">
              {lastSolve?.normalized_expression || "Solve to inspect normalized form."}
            </div>
          </div>
        </div>
        {lastSetup ? (
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Setup</div>
            <div className="text-slate-200">{lastSetup.subgoal}</div>
            {lastSetup.equation ? <div className="mt-1 font-mono text-slate-300">{lastSetup.equation}</div> : null}
            {lastSetup.variables?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {lastSetup.variables.map((variable: HelixCalculatorSetupVariable) => (
                  <Badge key={`${variable.symbol}:${variable.value}`} variant="outline" className="border-slate-600 text-slate-200">
                    {setupVariableText(variable)}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-3 rounded border border-slate-800 bg-slate-900/50 p-2">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Units & Dimensions</div>
              <div className="flex flex-wrap gap-2">
                {lastSetup.unit_system ? (
                  <Badge variant="outline" className="border-cyan-700/70 text-cyan-100">
                    system: {lastSetup.unit_system}
                  </Badge>
                ) : null}
                {lastSetup.result_quantity ? (
                  <Badge variant="outline" className="border-slate-600 text-slate-200">
                    quantity: {lastSetup.result_quantity}
                  </Badge>
                ) : null}
                {lastSetup.result_unit ? (
                  <Badge variant="outline" className="border-slate-600 text-slate-200">
                    result: {lastSetup.result_unit}
                  </Badge>
                ) : null}
                {lastSetup.result_dimension_signature ? (
                  <Badge variant="outline" className="border-slate-600 text-slate-200">
                    dimension: {lastSetup.result_dimension_signature}
                  </Badge>
                ) : null}
              </div>
              {lastSetup.input_units && Object.keys(lastSetup.input_units).length > 0 ? (
                <div className="mt-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Input Units</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(lastSetup.input_units as Record<string, string>).map(([symbol, unit]: [string, string]) => (
                      <Badge key={`${symbol}:${unit}`} variant="outline" className="border-slate-700 text-slate-300">
                        {symbol}: {unit}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {lastSetup.unit_options?.length ? (
                <div className="mt-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Compatible Units</div>
                  <div className="flex flex-wrap gap-2">
                    {lastSetup.unit_options.slice(0, 8).map((option: { symbol: string; quantity: string; si_factor: number }) => (
                      <Badge key={option.symbol} variant="outline" className="border-slate-700 text-slate-300">
                        {setupUnitOptionText(option)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {lastSetup.assumptions?.length ? (
                <div className="mt-2 space-y-1">
                  {lastSetup.assumptions.map((assumption: string, index: number) => (
                    <div key={`${assumption}:${index}`} className="text-[11px] text-slate-400">
                      {assumption}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handlePasteClipboard}>
            Paste from Clipboard
          </Button>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => solve(false)}>
            Solve
          </Button>
          <Button size="sm" variant="outline" onClick={() => solve(true)}>
            Solve with Steps
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyResult}
          >
            Copy Result
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyDebugLog}>
            Copy Debug Log
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      <ScientificCalculatorLiveSourceControls currentEquation={input} />

      {compoundSolveEvents.length >= 2 ? (
        <div className="mt-3 rounded-md border border-cyan-900/60 bg-cyan-950/20 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-cyan-300">Compound Solve Trace</div>
          <div className="space-y-2">
            {compoundSolveEvents.map((entry, index) => (
              <div key={entry.id} className="rounded border border-cyan-900/40 bg-slate-950/60 p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-cyan-700/70 text-cyan-100">
                    {index + 1}
                  </Badge>
                  <span className="text-slate-200">{entry.calculator_setup?.subgoal ?? "Calculator subgoal"}</span>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Expression</div>
                    <div className="break-all rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono text-slate-200">
                      {entry.input_latex}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Result</div>
                    <div className="break-all rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono text-slate-100">
                      {entry.result_text}
                      {entry.calculator_setup?.result_unit ? ` ${entry.calculator_setup.result_unit}` : ""}
                    </div>
                  </div>
                </div>
                {entry.calculator_setup?.result_dimension_signature ? (
                  <div className="mt-2 text-[11px] text-slate-400">
                    dimension: {entry.calculator_setup.result_dimension_signature}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-3 rounded-md border border-slate-800 bg-slate-900/40 p-3">
        {lastSolve ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="border-slate-600 text-slate-200">
                mode: {lastSolve.mode}
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-200">
                ok: {lastSolve.ok ? "true" : "false"}
              </Badge>
              {lastSolve.variable ? (
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  variable: {lastSolve.variable}
                </Badge>
              ) : null}
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Result</div>
              {resultMathHtml ? (
                <div
                  className="mb-2 overflow-x-auto rounded border border-slate-800 bg-slate-900/70 px-2 py-2 text-slate-100"
                  dangerouslySetInnerHTML={{ __html: resultMathHtml }}
                />
              ) : null}
              <div className="font-mono text-slate-100">{lastSolve.result_text || lastSolve.error || "n/a"}</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3 text-xs">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Trace</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  {solveTrace.route}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  {solveTrace.engine}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  {solveTrace.capabilityClass}
                </Badge>
              </div>
              <div className="mt-2 break-all font-mono text-[11px] text-slate-300">
                traceId: {solveTrace.traceId}
              </div>
              {solveTrace.delegatedTo ? (
                <div className="mt-1 font-mono text-[11px] text-cyan-200">
                  delegatedTo: {solveTrace.delegatedTo}
                </div>
              ) : null}
              {solveTrace.warnings.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {solveTrace.warnings.map((warning, index) => (
                    <div key={`${warning}:${index}`} className="text-[11px] text-amber-200">
                      {warning}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {lastArtifactV1 ? (
              <div className="space-y-3 rounded-md border border-cyan-900/60 bg-cyan-950/20 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] uppercase tracking-wide text-cyan-300">Schema Trace</div>
                  <Button size="sm" variant="outline" onClick={handleCopyStepsMarkdown}>
                    Copy Steps Markdown
                  </Button>
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Method</div>
                    <div className="text-slate-200">{schemaStepItems.find((step) => step.stage === "method")?.text ?? "n/a"}</div>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Assumptions</div>
                    <div className="font-mono text-slate-200">
                      domain={lastArtifactV1.request.assumptions.domain}; angle={lastArtifactV1.request.assumptions.angleMode}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Verification</div>
                    <div className="text-slate-200">
                      {lastArtifactV1.result.verification?.status ?? "not_run"}: {lastArtifactV1.result.verification?.text ?? "n/a"}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Confidence / Fallback</div>
                    <div className="font-mono text-slate-200">
                      {lastArtifactV1.quality.confidence.toFixed(2)} / {lastArtifactV1.quality.fallbackReason ?? "none"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Schema Steps</div>
                  {schemaStepItems.map((step) => (
                    <div key={step.id} className="rounded-md border border-slate-800 bg-slate-950/50 p-2">
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                        <span>{step.index}. {step.title}</span>
                        <span>{step.stage}</span>
                      </div>
                      {step.latex ? (
                        <div
                          className="mt-1 overflow-x-auto rounded border border-slate-800 bg-slate-900/70 px-2 py-2 text-slate-100"
                          dangerouslySetInnerHTML={{ __html: renderMathHtml(step.latex, true) }}
                        />
                      ) : null}
                      <div className="mt-1 font-mono text-slate-100">{step.text}</div>
                      {step.operation ? (
                        <div className="mt-1 font-mono text-[11px] text-slate-400">
                          {step.operation.kind}: {step.operation.rule}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : stepItems.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Steps</div>
                {stepItems.map((step, index) => (
                  <div key={`${step.id}:${index}`} className="rounded-md border border-slate-800 bg-slate-950/50 p-2 text-xs">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">{index + 1}. {step.label}</div>
                    {step.latex ? (
                      <div
                        className="mt-1 overflow-x-auto rounded border border-slate-800 bg-slate-900/70 px-2 py-2 text-slate-100"
                        dangerouslySetInnerHTML={{ __html: renderMathHtml(step.latex, true) }}
                      />
                    ) : null}
                    <div className="mt-1 font-mono text-slate-100">{step.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-slate-400">No solve executed yet.</p>
        )}
      </div>

      <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">Recent Ingest</div>
        <div className="mt-2 space-y-1">
          {visibleHistory.map((entry) => (
            <div
              key={entry.id}
              className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1 text-[11px] text-slate-300"
              data-compound-run-id={entry.compound_run_id ?? ""}
              data-compound-subgoal-id={entry.compound_subgoal_id ?? ""}
            >
              <div className="font-mono text-slate-200">{entry.latex}</div>
              <div className="text-slate-500">{entry.sourcePath ?? "unknown"}{entry.anchor ? ` #${entry.anchor}` : ""}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">Calculator Event Log</div>
        <div
          className="mt-2 space-y-1"
          data-testid="scientific-calculator-debug-log"
          data-current-compound-run-id={visibleDebugState.currentCompoundRunId ?? ""}
          data-visible-compound-run-ids={visibleDebugState.visibleCompoundRunIds.join(",")}
          data-stale-compound-run-visible={visibleDebugState.staleCompoundRunVisible ? "true" : "false"}
        >
          {visibleDebugState.visibleEvents.map((entry) => (
            <div
              key={entry.id}
              className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1 text-[11px] text-slate-300"
              data-testid="scientific-calculator-debug-event"
              data-compound-run-id={entry.compound_run_id ?? ""}
              data-compound-subgoal-id={entry.compound_subgoal_id ?? ""}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-slate-200">{entry.action_id}</span>
                <span className={entry.ok ? "text-emerald-300" : "text-amber-200"}>{entry.ok ? "ok" : "failed"}</span>
                <span className="text-slate-500">{entry.source}</span>
              </div>
              <div className="mt-1 break-all font-mono text-slate-400">
                {entry.trace_id ?? entry.source_path ?? entry.message ?? entry.id}
              </div>
              {entry.calculator_setup ? (
                <div className="mt-1 text-slate-400">
                  setup: {entry.calculator_setup.subgoal}
                </div>
              ) : null}
            </div>
          ))}
          {debugEvents.length === 0 ? <div className="text-xs text-slate-500">No calculator events yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
