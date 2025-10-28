import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMetrics } from "@/hooks/use-metrics";
import { C as c } from '@/lib/physics-const';

type Props = {
  mode: string;
  shift?: {
    epsilonTilt: number;
    betaTiltVec: [number, number, number];
    gTarget: number;
    R_geom: number;
    gEff_check: number;
  };
};

const fmt = (x: number, d = 3) => Number.isFinite(x) ? x.toExponential(d) : "—";
const fstd = (x: number, d = 3) => Number.isFinite(x) ? x.toFixed(d) : "—";

export function ShiftVectorPanel({ mode, shift }: Props) {
  const { data: metrics } = useMetrics();
  
  // Debug logging
  console.debug("[ShiftVectorPanel] Props:", { mode, shift });
  console.debug("[ShiftVectorPanel] Metrics shiftVector data:", metrics?.shiftVector);
  
  // Compute fallback values based on mode and hull geometry (for when metrics aren't loaded yet)
  const G = 9.80665; // m/s²
  
  const gTargets: Record<string, number> = {
    hover: 0.10 * G,
    taxi: 0.10 * G,
    nearzero: 0.08 * G,
    cruise: 0.05 * G,
    emergency: 0.30 * G,
    standby: 0.00 * G,
  };
  
  const fallbackGTarget = gTargets[mode?.toLowerCase()] ?? 0;
  const fallbackRGeom = Math.cbrt(503.5 * 132.0 * 86.5); // ∛(a·b·c)
  const fallbackEpsilonTilt = Math.min(5e-7, Math.max(0, (fallbackGTarget * fallbackRGeom) / (c * c)));
  const fallbackBetaTiltVec: [number, number, number] = [0, -1, 0];
  const fallbackGEffCheck = (fallbackEpsilonTilt * c * c) / fallbackRGeom;

  // Use live metrics data first, then props, then fallback calculations
  const liveShift = metrics?.shiftVector;
  const propShift = shift;

  // Helper: pick a numeric value with preference rules and record source
  const pickNum = (live: any, prop: any, fb: number, preferPositive = false) => {
    const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v);
    const wantPos = preferPositive && fb > 0;
    if (isNum(live) && (!wantPos || live > 0)) return { value: live as number, source: 'live' as const };
    if (isNum(prop) && (!wantPos || prop > 0)) return { value: prop as number, source: 'props' as const };
    return { value: fb, source: 'computed' as const };
  };

  // Helper: pick a 3-vector
  const pickVec3 = (live: any, prop: any, fb: [number, number, number]) => {
    const ok = (v: any) => Array.isArray(v) && v.length === 3 && v.every(x => typeof x === 'number' && Number.isFinite(x));
    if (ok(live)) return { value: live as [number, number, number], source: 'live' as const };
    if (ok(prop)) return { value: prop as [number, number, number], source: 'props' as const };
    return { value: fb, source: 'computed' as const };
  };

  // Prefer positive gTarget in modes with nonzero fallback (so Near-Zero won’t show 0 from live)
  const gTargetPick = pickNum(liveShift?.gTarget, propShift?.gTarget, fallbackGTarget, true);
  const RGeomPick = pickNum(liveShift?.R_geom, propShift?.R_geom, fallbackRGeom, true);
  const epsPick = pickNum(liveShift?.epsilonTilt, propShift?.epsilonTilt, fallbackEpsilonTilt, true);
  const betaPick = pickVec3(liveShift?.betaTiltVec, propShift?.betaTiltVec, fallbackBetaTiltVec);
  const gEffPick = pickNum(liveShift?.gEff_check, propShift?.gEff_check, fallbackGEffCheck, true);

  const displayShift = {
    gTarget: gTargetPick.value,
    R_geom: RGeomPick.value,
    epsilonTilt: epsPick.value,
    betaTiltVec: betaPick.value,
    gEff_check: gEffPick.value,
  };

  console.debug("[ShiftVectorPanel] Final display values:", displayShift);

  const hasLiveData = !!(liveShift && Object.keys(liveShift).length > 0);
  const hasPropData = !!(propShift && Object.keys(propShift).length > 0);
  const ok = hasLiveData || hasPropData || fallbackGTarget > 0; // Show panel if we have any data

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Shift Vector • Interior Gravity
          <Badge variant="outline" className="border-cyan-400 text-cyan-300">{mode?.toUpperCase() || "—"}</Badge>
        </CardTitle>
        <CardDescription>Gentle Natário tilt (β-gradient) for cabin "down".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!ok && <div className="text-slate-400">No shift-vector data (standby mode).</div>}

        {ok && (
          <>
            <div className="p-3 bg-slate-950 rounded-lg font-mono">
              <div className="text-slate-300">Equations</div>
              <div className="text-slate-400 mt-1">
                ε<sub>tilt</sub> = (g<sub>target</sub> · R<sub>geom</sub>)/c²<br/>
                R<sub>geom</sub> = (a·b·c)<sup>1/3</sup><br/>
                g<sub>eff</sub> = ε<sub>tilt</sub> · c² / R<sub>geom</sub>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">g<sub>target</sub></div>
                <div className="text-violet-400">{fstd(displayShift.gTarget, 3)} m/s²</div>
                <div className="text-xs text-slate-500">{gTargetPick.source}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">R<sub>geom</sub></div>
                <div className="text-cyan-300">{fstd(displayShift.R_geom, 1)} m</div>
                <div className="text-xs text-slate-500">{RGeomPick.source}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      <div className="text-slate-400">ε<sub>tilt</sub> (dimensionless)</div>
                      <div className="text-violet-400">{fmt(displayShift.epsilonTilt, 3)}</div>
                      <div className="text-xs text-slate-500">{epsPick.source}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Kept ≪ 1e-6 ("whisper" regime) to preserve QI headroom and keep tilt visual-only inside.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">β⃗<sub>tilt</sub></div>
                <div className="text-violet-400">[{displayShift.betaTiltVec.join(", ")}]</div>
                <div className="text-xs text-slate-500">{betaPick.source}</div>
              </div>
              <div className="col-span-2 p-3 bg-slate-950 rounded">
                <div className="text-slate-400">g<sub>eff</sub> (check)</div>
                <div className="text-amber-300">{fstd(displayShift.gEff_check, 3)} m/s²</div>
                <div className="text-xs text-slate-500">{gEffPick.source}</div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Zen note: "Down" is chosen, not imposed. A tiny inclination aligns the cabin with life—just enough to stand, never enough to strain.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}