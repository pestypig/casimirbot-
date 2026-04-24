import { useEffect, useMemo, useState } from "react";
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
import { runScientificSolve } from "@/lib/scientific-calculator/solver";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";

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

export default function ScientificCalculatorPanel() {
  const { currentLatex, history, lastSolve, steps, ingestLatex, setSolveResult, clear } =
    useScientificCalculatorStore();
  const [input, setInput] = useState(currentLatex);

  useEffect(() => {
    setInput(currentLatex);
  }, [currentLatex]);

  useEffect(() => {
    const onPicked = (event: Event) => {
      const detail = (event as CustomEvent<ScientificCalculatorMathPickedDetail>).detail;
      if (!detail?.latex) return;
      ingestLatex(detail.latex, {
        sourcePath: detail.sourcePath,
        anchor: detail.anchor,
      });
    };
    window.addEventListener(SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT, onPicked as EventListener);
    return () => {
      window.removeEventListener(SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT, onPicked as EventListener);
    };
  }, [ingestLatex]);

  const handlePasteClipboard = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return;
    ingestLatex(text, { sourcePath: "clipboard", anchor: null });
  };

  const solve = (withSteps: boolean) => {
    const result = runScientificSolve(input, withSteps);
    setSolveResult(result);
  };

  const stepItems = useMemo(() => steps ?? [], [steps]);
  const resultMathHtml = useMemo(
    () => renderMathHtml(lastSolve?.result_latex ?? "", true),
    [lastSolve?.result_latex],
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
          onChange={(event) => setInput(event.target.value)}
          placeholder="Example: t_{\\text{proper}} = t_{\\text{shift-driven}} + \\Delta t_{\\text{lapse-driven}}"
        />
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
            onClick={() => {
              const text = lastSolve?.result_text;
              if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
              void navigator.clipboard.writeText(text);
            }}
          >
            Copy Result
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>

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
    </div>
  );
}
