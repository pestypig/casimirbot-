import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useScientificCalculatorLiveSourceStore } from "@/store/useScientificCalculatorLiveSourceStore";

export function ScientificCalculatorLiveSourceControls() {
  const {
    status,
    sourceId,
    environmentId,
    tickRateMs,
    maxTicks,
    state,
    latestTick,
    debugLog,
    startPrimeStream,
    stopPrimeStream,
    restartPrimeStream,
    copyDebugLog,
  } = useScientificCalculatorLiveSourceStore();
  const [start, setStart] = useState("2");
  const [rate, setRate] = useState("1000");
  const [max, setMax] = useState("100");

  const startStream = () => {
    void startPrimeStream({
      start: Number(start),
      tickRateMs: Number(rate),
      maxTicks: Number(max),
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
          <div className="text-[10px] uppercase tracking-wide text-cyan-300">Live Source: Prime Stream</div>
          <div className="text-xs text-slate-400">Emits deterministic calculator ticks into the active live answer environment.</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">status: {status}</Badge>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">seq: {state.seq}</Badge>
          <Badge variant="outline" className="border-cyan-700 text-cyan-100">rate: {tickRateMs}ms</Badge>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div>
          <Label className="text-[11px] text-slate-300">Start</Label>
          <Input value={start} onChange={(event: ChangeEvent<HTMLInputElement>) => setStart(event.target.value)} className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100" />
        </div>
        <div>
          <Label className="text-[11px] text-slate-300">Tick Rate Ms</Label>
          <Input value={rate} onChange={(event: ChangeEvent<HTMLInputElement>) => setRate(event.target.value)} className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100" />
        </div>
        <div>
          <Label className="text-[11px] text-slate-300">Max Ticks</Label>
          <Input value={max} onChange={(event: ChangeEvent<HTMLInputElement>) => setMax(event.target.value)} className="h-8 border-slate-700 bg-slate-950 text-xs text-slate-100" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={startStream}>Start Live Source</Button>
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
          <div className="font-mono">{latestTick ? `${latestTick.event_type} ${latestTick.payload.candidate}` : "none"}</div>
          <div className="text-slate-500">{sourceId}</div>
        </div>
      </div>
      {debugLog.length > 0 ? (
        <div className="mt-2 max-h-24 overflow-auto rounded border border-slate-800 bg-slate-950/40 p-2 font-mono text-[10px] text-slate-400">
          {debugLog.slice(0, 8).map((entry: string, index: number) => <div key={`${entry}:${index}`}>{entry}</div>)}
        </div>
      ) : null}
    </div>
  );
}
