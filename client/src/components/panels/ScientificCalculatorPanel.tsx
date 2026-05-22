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

function setupVariableText(variable: { symbol: string; value: string; unit?: string | null; meaning?: string | null }): string {
  const unit = variable.unit ? ` ${variable.unit}` : "";
  const meaning = variable.meaning ? ` (${variable.meaning})` : "";
  return `${variable.symbol} = ${variable.value}${unit}${meaning}`;
}

export default function ScientificCalculatorPanel() {
  const { currentLatex, history, lastSolve, lastSetup, steps, debugEvents, ingestLatex, setSolveResult, recordDebugEvent, clear } =
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

  const stepItems = useMemo(() => steps ?? [], [steps]);
  const resultMathHtml = useMemo(
    () => renderMathHtml(lastSolve?.result_latex ?? "", true),
    [lastSolve?.result_latex],
  );
  const inputPreviewHtml = useMemo(() => renderMathHtml(input, true), [input]);
  const solveTrace = useMemo(() => resolveSolveTrace(lastSolve), [lastSolve]);

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
                {lastSetup.variables.map((variable) => (
                  <Badge key={`${variable.symbol}:${variable.value}`} variant="outline" className="border-slate-600 text-slate-200">
                    {setupVariableText(variable)}
                  </Badge>
                ))}
              </div>
            ) : null}
            {lastSetup.result_unit ? <div className="mt-2 text-slate-400">Result unit: {lastSetup.result_unit}</div> : null}
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
            {stepItems.length > 0 ? (
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
          {history.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1 text-[11px] text-slate-300">
              <div className="font-mono text-slate-200">{entry.latex}</div>
              <div className="text-slate-500">{entry.sourcePath ?? "unknown"}{entry.anchor ? ` #${entry.anchor}` : ""}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">Calculator Event Log</div>
        <div className="mt-2 space-y-1" data-testid="scientific-calculator-debug-log">
          {debugEvents.slice(0, 8).map((entry) => (
            <div
              key={entry.id}
              className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1 text-[11px] text-slate-300"
              data-testid="scientific-calculator-debug-event"
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
