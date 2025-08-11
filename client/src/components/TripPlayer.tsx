import * as React from "react";
import { Button } from "@/components/ui/button";

type Phase = "Preflight" | "SpoolUp" | "Cruise" | "StationKeep" | "Return" | "Complete";
type TripPlan = {
  distanceLy: number;
  cruiseDuty: number;
  cruiseMode?: "Cruise";
  hoverMode?: "Hover";
  stationKeepHours?: number;
};

type Telemetry = {
  energyJ: number;              // total J
  distanceLy: number;           // total ly
  byMode: Record<string, { tSec: number; energyJ: number; distanceLy: number }>;
};

type TripPlayerProps = {
  plan: TripPlan;
  getState: () => { zeta:number; tsRatio:number; powerMW:number; freqGHz:number };
  setMode: (m:"Hover"|"Cruise"|"Emergency"|"Standby" | string)=>void;
  setDuty: (d:number)=>void;
  onTick?: (phase:Phase, t:number)=>void; // optional progress callback
};

// helper: effective ly/hour (use same logic as FuelGauge)
function computeEffectiveLyPerHour(mode: string, duty=0, gammaGeo=26, qFactor=1e9, zeta=0, tsRatio=0) {
  const base: Record<string, number> = { Hover: 0.002, Cruise: 0.02, Emergency: 0.03, Standby: 0 };
  let v = base[mode] ?? 0;

  const g = Math.min(40, Math.max(10, gammaGeo));
  const qn = Math.log10(Math.max(1, qFactor)) - 6;
  const dutyBoost = Math.sqrt(Math.max(0, duty));
  const safety = Math.max(0, Math.min(1, zeta / 0.84)) * Math.max(0, Math.min(1, tsRatio / 100));

  v *= (1 + 0.01*(g - 26)) * (1 + 0.05*qn) * (0.5 + 0.5*dutyBoost) * (0.5 + 0.5*safety);
  return v;
}

export function TripPlayer({ plan, getState, setMode, setDuty, onTick }: TripPlayerProps) {
  const [phase, setPhase] = React.useState<Phase>("Preflight");
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0..1 within current phase
  const [tele, setTele] = React.useState<Telemetry>({ energyJ:0, distanceLy:0, byMode:{} });

  // simple durations (seconds) — tune as you like
  const DUR = { 
    Preflight: 5, 
    SpoolUp: 8, 
    Cruise: Math.max(6, plan.distanceLy*2), 
    StationKeep: (plan.stationKeepHours??1)*3, 
    Return: Math.max(6, plan.distanceLy*2) 
  };

  React.useEffect(() => {
    if (!running) return;
    let t = 0, id: any;

    function step() {
      const total = DUR[phase];
      t += 0.5; // tick every 0.5s
      setProgress(Math.min(1, t/total));
      onTick?.(phase, t);

      // Telemetry tracking
      const dt = 0.5;
      const s = getState();
      const curMode = phase; // Use phase as mode for simplicity
      const pW = (s.powerMW ?? 0) * 1e6;
      const vLyPerHour = computeEffectiveLyPerHour(curMode);
      const dLy = vLyPerHour * (dt / 3600);
      const dE = pW * dt;

      setTele(prev => {
        const m = prev.byMode[curMode] ?? { tSec:0, energyJ:0, distanceLy:0 };
        m.tSec += dt; 
        m.energyJ += dE; 
        m.distanceLy += dLy;
        return {
          energyJ: prev.energyJ + dE,
          distanceLy: prev.distanceLy + dLy,
          byMode: { ...prev.byMode, [curMode]: m },
        };
      });

      // micro-guard: if constraints look bad, ease duty
      if (s.zeta < 0.6 || s.tsRatio < 80) setDuty(Math.max(0.05, plan.cruiseDuty * 0.7));

      if (t >= total) {
        // advance
        if (phase === "Preflight") { setMode(plan.hoverMode ?? "Hover"); setDuty(0.10); setPhase("SpoolUp"); t=0; }
        else if (phase === "SpoolUp") { setMode(plan.cruiseMode ?? "Cruise"); setDuty(plan.cruiseDuty); setPhase("Cruise"); t=0; }
        else if (phase === "Cruise") { setMode(plan.hoverMode ?? "Hover"); setDuty(0.08); setPhase("StationKeep"); t=0; }
        else if (phase === "StationKeep") { setMode(plan.cruiseMode ?? "Cruise"); setDuty(plan.cruiseDuty*0.9); setPhase("Return"); t=0; }
        else if (phase === "Return") { setMode("Standby"); setDuty(0); setPhase("Complete"); setRunning(false); }
      } else {
        id = setTimeout(step, 500);
      }
    }
    id = setTimeout(step, 500);
    return () => clearTimeout(id);
  }, [running, phase, plan, getState, setMode, setDuty, onTick]);

  const resetTrip = () => {
    setRunning(false);
    setPhase("Preflight");
    setProgress(0);
    setTele({ energyJ:0, distanceLy:0, byMode:{} });
  };

  return (
    <div className="p-3 rounded-lg border">
      <div className="text-sm font-semibold mb-2">Trip Player</div>
      <div className="text-xs mb-2">Phase: <span className="font-mono">{phase}</span> — {Math.round(progress*100)}%</div>
      <div className="flex gap-2 mb-3">
        <Button onClick={()=>{ resetTrip(); setRunning(true); }}>Start</Button>
        <Button variant="secondary" onClick={()=>setRunning(false)} disabled={!running}>Pause</Button>
        <Button variant="outline" onClick={resetTrip}>Reset</Button>
      </div>

      {phase === "Complete" && (
        <div className="mt-3 text-xs space-y-1 bg-slate-950 rounded p-2">
          <div><b>Trip Summary</b></div>
          <div>Total distance: {(tele.distanceLy).toFixed(3)} ly</div>
          <div>Total energy: {(tele.energyJ/3.6e9).toFixed(2)} MWh</div>
          {Object.entries(tele.byMode).map(([m,v])=>(
            <div key={m} className="flex justify-between text-xs">
              <span>{m}</span>
              <span>
                {(v.tSec/3600).toFixed(2)} h · {(v.distanceLy).toFixed(3)} ly · {(v.energyJ/3.6e9).toFixed(2)} MWh
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}