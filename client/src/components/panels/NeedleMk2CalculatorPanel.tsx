import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";
import type { ObserverConditionKey, ObserverFrameKey } from "@/lib/stress-energy-brick";
import {
  buildWarpCalculatorInputPayload,
  runWarpCalculatorViaApi,
  type WarpCalculatorRunResponse,
} from "@/lib/warp-calculator";

const DEFAULT_OUT_PATH = "artifacts/research/full-solve/g4-calculator-helix-core.json";

const formatRatio = (value: number | null | undefined) =>
  Number.isFinite(value) ? Number(value).toFixed(4) : "n/a";

export default function NeedleMk2CalculatorPanel() {
  const { data: pipeline } = useEnergyPipeline({
    staleTime: 10_000,
    refetchInterval: 3_000,
    refetchOnWindowFocus: false,
  });
  const stressBrickQuery = useStressEnergyBrick({ quality: "medium", refetchMs: 1_500 });
  const observerRobustStats = stressBrickQuery.data?.stats?.observerRobust;

  const [observerCondition, setObserverCondition] = useState<ObserverConditionKey>("nec");
  const [observerFrame, setObserverFrame] = useState<ObserverFrameKey>("Eulerian");
  const [persist, setPersist] = useState(false);
  const [injectCurvatureSignals, setInjectCurvatureSignals] = useState(true);
  const [outPath, setOutPath] = useState(DEFAULT_OUT_PATH);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WarpCalculatorRunResponse | null>(null);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);

  const canRun = useMemo(() => !running, [running]);

  const handleRun = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      const inputPayload = buildWarpCalculatorInputPayload({
        pipeline: (pipeline as unknown as Record<string, unknown>) ?? null,
        observerCondition,
        observerFrame,
        observerRapidityCap: observerRobustStats?.rapidityCap ?? null,
        observerTypeITolerance: observerRobustStats?.typeI?.tolerance ?? null,
      });
      const response = await runWarpCalculatorViaApi({
        persist,
        outPath: persist ? outPath : undefined,
        injectCurvatureSignals,
        inputPayload,
      });
      setResult(response);
      setLastRunAt(Date.now());
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : String(runError));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-950/80 p-4 text-slate-100">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide text-cyan-300">Needle Hull Mark 2</div>
        <div className="text-sm text-slate-300">
          Registry panel coupling the visualizer context to `/api/physics/warp/calculator`.
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-slate-300">Condition</Label>
            <Select
              value={observerCondition.toUpperCase()}
              onValueChange={(value) => setObserverCondition(value.toLowerCase() as ObserverConditionKey)}
            >
              <SelectTrigger className="mt-1 border-slate-700 bg-slate-900/70 text-slate-100">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100">
                <SelectItem value="NEC">NEC</SelectItem>
                <SelectItem value="WEC">WEC</SelectItem>
                <SelectItem value="SEC">SEC</SelectItem>
                <SelectItem value="DEC">DEC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-300">Frame</Label>
            <Select value={observerFrame} onValueChange={(value) => setObserverFrame(value as ObserverFrameKey)}>
              <SelectTrigger className="mt-1 border-slate-700 bg-slate-900/70 text-slate-100">
                <SelectValue placeholder="Frame" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100">
                <SelectItem value="Eulerian">Eulerian</SelectItem>
                <SelectItem value="Robust">Robust</SelectItem>
                <SelectItem value="Delta">Delta</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div>
              <div className="text-xs font-medium text-slate-200">Inject Curvature Signals</div>
              <div className="text-[11px] text-slate-400">Recommended for campaign parity.</div>
            </div>
            <Switch checked={injectCurvatureSignals} onCheckedChange={(checked) => setInjectCurvatureSignals(Boolean(checked))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div>
              <div className="text-xs font-medium text-slate-200">Persist Artifact</div>
              <div className="text-[11px] text-slate-400">Write result under `artifacts/research/full-solve`.</div>
            </div>
            <Switch checked={persist} onCheckedChange={(checked) => setPersist(Boolean(checked))} />
          </div>
        </div>

        {persist && (
          <div>
            <Label className="text-xs text-slate-300">Artifact Out Path</Label>
            <Input
              className="mt-1 border-slate-700 bg-slate-900/70 text-slate-100"
              value={outPath}
              onChange={(event) => setOutPath(event.target.value)}
              placeholder={DEFAULT_OUT_PATH}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={handleRun} disabled={!canRun}>
            {running ? "Running calculator..." : "Run MK2 Calculator Snapshot"}
          </Button>
          <Badge variant="outline" className="border-slate-600 text-slate-200">
            condition: {observerCondition.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="border-slate-600 text-slate-200">
            frame: {observerFrame}
          </Badge>
          {observerRobustStats && (
            <Badge variant="outline" className="border-slate-600 text-slate-200">
              rapidity cap: {observerRobustStats.rapidityCap.toFixed(3)}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3 rounded-md border border-slate-800 bg-slate-900/40 p-3">
        {result ? (
          <>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-200 sm:grid-cols-2">
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Decision</div>
                <div className="font-mono text-slate-100">{result.decisionClass}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Congruent Solve</div>
                <div className="font-mono text-slate-100">{result.congruentSolvePass === true ? "PASS" : "FAIL"}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">marginRatioRaw</div>
                <div className="font-mono text-slate-100">{formatRatio(result.marginRatioRaw)}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">marginRatioRawComputed</div>
                <div className="font-mono text-slate-100">{formatRatio(result.marginRatioRawComputed)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {result.outPath && (
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  artifact: {result.outPath}
                </Badge>
              )}
              {lastRunAt && (
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  last run: {new Date(lastRunAt).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400">No MK2 calculator run yet in this session.</p>
        )}

        {error && (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
