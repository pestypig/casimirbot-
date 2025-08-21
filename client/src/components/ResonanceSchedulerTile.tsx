import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  mode: 'standby'|'hover'|'cruise'|'emergency';
  duty: number;
  sectors: number;
  freqGHz: number;
  sectorPeriod_ms?: number;
  currentSector?: number;
};

export default function ResonanceSchedulerTile({
  mode, duty, sectors, freqGHz, sectorPeriod_ms = 1.0, currentSector = 0
}: Props) {

  const bars = useMemo(() => {
    const S = Math.max(1, sectors);
    return Array.from({ length: S }, (_, i) => i);
  }, [sectors]);

  const burstLocal = 0.01; // 1% local ON window
  const dwell_ms   = sectorPeriod_ms;        // per-sector dwell time from server
  const burst_ms   = Math.max(0.02, dwell_ms * burstLocal);

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
          f = {freqGHz.toFixed(3)} GHz • τ<sub>sector</sub> ≈ {dwell_ms.toFixed(3)} ms • burst ≈ {burst_ms.toFixed(3)} ms
        </div>

        {/* Timeline */}
        <div className="h-28 rounded-lg bg-slate-950 p-2 overflow-hidden border border-slate-800">
          <div className="flex gap-1 h-full items-end">
            {bars.map((i) => {
              const active = i === (currentSector % Math.max(1, sectors));
              const h = active ? 100 : 45 + 45 * Math.sin(i * 0.37) * 0.3;
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
                      height: Math.max(2, (h/100) * (burstLocal*100)) + '%',
                      background: active ? 'white' : 'rgba(255,255,255,0.6)',
                      opacity: 0.9
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