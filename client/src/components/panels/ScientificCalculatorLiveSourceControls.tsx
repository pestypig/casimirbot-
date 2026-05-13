import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useScientificCalculatorLiveSourceStore } from "@/store/useScientificCalculatorLiveSourceStore";

export function ScientificCalculatorLiveSourceControls({ currentEquation }: { currentEquation: string }) {
  const {
    status,
    mode,
    sourceId,
    environmentId,
    tickRateMs,
    maxTicks,
    state,
    equationState,
    sourceEquation,
    latestTick,
    liveWorkbenchExpression,
    liveSolveSteps,
    activeLiveStepId,
    debugLog,
    startEquationLiveSource,
    startPrimeStream,
    stopPrimeStream,
    restartPrimeStream,
    copyDebugLog,
  } = useScientificCalculatorLiveSourceStore();
  const [sourceMode, setSourceMode] = useState<"current_equation" | "prime_trial_division">("current_equation");
  const [start, setStart] = useState("2");
  const [rate, setRate] = useState("1000");
  const [max, setMax] = useState("1");
  const [equationContext, setEquationContext] = useState("Explain each solved value in the big-picture context of what this equation is used for.");
  const sourceEquationPreview = sourceMode === "prime_trial_division"
    ? "n \\bmod d = r"
    : currentEquation.trim();
  const missingCurrentEquation = sourceMode === "current_equation" && !sourceEquationPreview;
  const activeSeq = mode === "current_equation" ? equationState.seq : state.seq;

  const startStream = () => {
    if (sourceMode === "prime_trial_division") {
      void startPrimeStream({
        start: Number(start),
        tickRateMs: Number(rate),
        maxTicks: Number(max) || 100,
      });
      return;
    }
    void startEquationLiveSource({
      equation: currentEquation,
      equationContext,
      tickRateMs: Number(rate),
      maxTicks: Number(max) || 1,
      mode: "current_equation",
    });
  };

  const copyLog = () => {
    const log = copyDebugLog();
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(log);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-cyan-900/60 bg-cyan-950/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-cyan-300">Equation Live Source</div>
          <div className="text-xs text-slate-400">
            Uses the calculator equation as the live source; prime trial division is only a preset.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">status: {status}</Badge>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">mode: {mode}</Badge>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">seq: {activeSeq}</Badge>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">rate: {tickRateMs}ms</Badge>
        </div>
      </div>
      <div className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Source equation</div>
            <div className={`mt-1 break-words font-mono text-[11px] ${missingCurrentEquation ? "text-red-300" : "text-cyan-50"}`}>
              {sourceEquationPreview || "Missing: add or click an equation in the calculator first."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={sourceMode === "current_equation" ? "default" : "outline"}
              className={sourceMode === "current_equation" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
              onClick={() => {
                setSourceMode("current_equation");
                setMax("1");
              }}
            >
              Current equation
            </Button>
            <Button
              size="sm"
              variant={sourceMode === "prime_trial_division" ? "default" : "outline"}
              className={sourceMode === "prime_trial_division" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
              onClick={() => {
                setSourceMode("prime_trial_division");
                setMax("100");
              }}
            >
              Prime preset
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div>
          <Label className="text-[11px] text-slate-300">{sourceMode === "prime_trial_division" ? "Candidate Start" : "Repeats"}</Label>
          <Input
            value={sourceMode === "prime_trial_division" ? start : max}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (sourceMode === "prime_trial_division") setStart(event.target.value);
              else setMax(event.target.value);
            }}
            className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100"
          />
        </div>
        <div>
          <Label className="text-[11px] text-slate-300">Tick Rate Ms</Label>
          <Input value={rate} onChange={(event: ChangeEvent<HTMLInputElement>) => setRate(event.target.value)} className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100" />
        </div>
        <div>
          <Label className="text-[11px] text-slate-300">Max Ticks</Label>
          <Input
            value={max}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setMax(event.target.value)}
            className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100"
          />
        </div>
      </div>
      {sourceMode === "current_equation" ? (
        <div className="mt-3">
          <Label className="text-[11px] text-slate-300">Interpretation context</Label>
          <Input
            value={equationContext}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEquationContext(event.target.value)}
            className="mt-1 h-8 border-slate-700 bg-slate-950 text-xs text-slate-100"
            placeholder="What is this equation used for?"
          />
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={startStream} disabled={missingCurrentEquation}>Start Live Source</Button>
        <Button size="sm" variant="outline" onClick={stopPrimeStream}>Stop</Button>
        <Button size="sm" variant="outline" onClick={() => void restartPrimeStream()}>Restart</Button>
        <Button size="sm" variant="outline" onClick={copyLog}>Copy Live Debug Log</Button>
      </div>
      <div className="mt-3 grid gap-2 text-[11px] text-slate-300 lg:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-slate-500">attached environment</div>
          <div className="break-all font-mono">{environmentId ?? "active thread environment will be resolved on start"}</div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-slate-500">latest event</div>
          <div className="font-mono">
            {latestTick
              ? latestTick.event_type === "equation_evaluated"
                ? `${latestTick.event_type} ${latestTick.payload.ok ? "ok" : "blocked"}`
                : `${latestTick.event_type} ${latestTick.payload.candidate}`
              : "none"}
          </div>
          <div className="text-slate-500">{sourceId}</div>
        </div>
      </div>
      <div className="mt-3 rounded border border-cyan-800/70 bg-slate-950/60 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-cyan-300">Visible workbench solve</div>
            <div className="text-[11px] text-slate-400">
              Live ticks use the same equation shown in the calculator workbench; output lines stay in the live answer trace.
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">
            {latestTick ? latestTick.trace.algorithm : sourceEquation || "waiting"}
          </Badge>
        </div>
        <pre className="mt-2 max-h-32 overflow-auto rounded border border-slate-800 bg-black/30 p-2 font-mono text-[11px] leading-relaxed text-cyan-50">
          {liveWorkbenchExpression || sourceEquationPreview || "Start the live source to populate the active equation."}
        </pre>
        {liveSolveSteps.length > 0 ? (
          <div className="mt-2 grid gap-1.5 md:grid-cols-5">
            {liveSolveSteps.map((step) => (
              <div
                key={step.id}
                className={`rounded border px-2 py-1.5 text-[10px] ${
                  step.id === activeLiveStepId
                    ? "border-cyan-300 bg-cyan-400/15 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                    : "border-slate-800 bg-slate-950/50 text-slate-300"
                }`}
              >
                <div className="uppercase tracking-wide text-slate-500">{step.label}</div>
                <div className="mt-1 break-words font-mono">{step.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {debugLog.length > 0 ? (
        <div className="mt-2 max-h-24 overflow-auto rounded border border-slate-800 bg-slate-950/40 p-2 font-mono text-[10px] text-slate-400">
          {debugLog.slice(0, 8).map((entry: string, index: number) => <div key={`${entry}:${index}`}>{entry}</div>)}
        </div>
      ) : null}
    </div>
  );
}
