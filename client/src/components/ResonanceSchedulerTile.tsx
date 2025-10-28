import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

type Props = {
  mode: 'standby'|'hover'|'taxi'|'nearzero'|'cruise'|'emergency';
  duty: number;
  sectors: number;
  freqGHz: number;
  sectorPeriod_ms?: number;
  currentSector?: number;
  hull?: { a: number; b: number; c: number };
  wallWidth_m?: number;
};

export default function ResonanceSchedulerTile({
  mode, duty, sectors, freqGHz, sectorPeriod_ms = 1.0, currentSector = 0,
  hull, wallWidth_m
}: Props) {

  // Use shared light-crossing loop for synchronized timeline
  const lightLoop = useLightCrossingLoop({
    sectorStrobing: sectors,
    currentSector,
    sectorPeriod_ms,
    duty,
    freqGHz,
    hull,
    wallWidth_m,
  });
  const { sweepResults } = useEnergyPipeline({
    refetchInterval: 2000,
    refetchOnWindowFocus: false,
    staleTime: 2000,
  });
  const latestSweep = sweepResults.length ? sweepResults[sweepResults.length - 1] : undefined;

  const bars = useMemo(() => {
    const S = Math.max(1, lightLoop.sectorCount);
    return Array.from({ length: S }, (_, i) => i);
  }, [lightLoop.sectorCount]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Resonance Scheduler
        </CardTitle>
        <CardDescription>
          Auto-duty strobe timeline (mode-coupled)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-slate-950 rounded">
            <div className="text-slate-400">Mode</div>
            <div className="font-mono">{mode}</div>
          </div>
          <div className="p-2 bg-slate-950 rounded">
            <div className="text-slate-400">Duty</div>
            <div className="font-mono">{(duty*100).toFixed(2)}%</div>
          </div>
          <div className="p-2 bg-slate-950 rounded">
            <div className="text-slate-400">Sectors</div>
            <div className="font-mono">{sectors}</div>
          </div>
        </div>

        <div className="mb-2 text-[10px] text-slate-400 font-mono">
          f = {freqGHz.toFixed(3)} GHz • τ<sub>sector</sub> ≈ {lightLoop.dwell_ms.toFixed(3)} ms • burst ≈ {lightLoop.burst_ms.toFixed(3)} ms
        </div>

        {/* Timeline */}
        <div className="h-28 rounded-lg bg-slate-950 p-2 overflow-hidden border border-slate-800 relative">
          {latestSweep && (
            <div className="absolute right-2 top-2 px-2 py-1 rounded bg-slate-900/80 text-slate-100 text-[10px] border border-slate-700">
              d={latestSweep.d_nm.toFixed(0)} nm | Omega={latestSweep.Omega_GHz.toFixed(2)} GHz | phi={latestSweep.phi_deg.toFixed(1)} deg | G={latestSweep.G.toFixed(1)} dB
            </div>
          )}
          <div className="flex gap-1 h-full items-end">
            {bars.map((i) => {
              const active = i === lightLoop.sectorIdx;
              const h = active ? 100 : 45 + 45 * Math.sin(i * 0.37) * 0.3;
              const burstFrac = lightLoop.burst_ms / lightLoop.dwell_ms; // fraction of dwell time
              return (
                <div
                  key={i}
                  className={`flex-1 relative rounded-t ${active ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  style={{ height: `${h}%`, opacity: active ? 0.95 : 0.6 }}
                  title={`S${i+1}`}
                >
                  {/* thin burst marker */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded"
                    style={{
                      width: 3,
                      height: Math.max(2, (h/100) * (burstFrac*100)) + '%',
                      background: active ? 'white' : 'rgba(255,255,255,0.6)',
                      opacity: active && lightLoop.onWindow ? 1.0 : 0.6
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-1">
          The small white marker shows the ~1% local ON window within each sector's dwell; sector sweep is paced to stay below the light-crossing constraint.
        </div>
      </CardContent>
    </Card>
  );
}
