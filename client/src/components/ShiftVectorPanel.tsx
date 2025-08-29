import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMetrics } from "@/hooks/use-metrics";

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
  console.debug("[ShiftVectorPanel] Metrics shift data:", metrics?.shift);
  
  // Compute fallback values based on mode and hull geometry (for when metrics aren't loaded yet)
  const G = 9.80665; // m/s²
  const c = 299792458; // m/s
  
  const gTargets: Record<string, number> = {
    hover: 0.10 * G,
    cruise: 0.05 * G,
    emergency: 0.30 * G,
    standby: 0.00 * G,
  };
  
  const fallbackGTarget = gTargets[mode?.toLowerCase()] ?? 0;
  const fallbackRGeom = Math.cbrt(503.5 * 132.0 * 86.5); // ∛(a·b·c)
  const fallbackEpsilonTilt = Math.min(5e-7, Math.max(0, (fallbackGTarget * fallbackRGeom) / (c * c)));
  const fallbackBetaTiltVec = [0, -1, 0];
  const fallbackGEffCheck = (fallbackEpsilonTilt * c * c) / fallbackRGeom;

  // Use live metrics data first, then props, then fallback calculations
  const liveShift = metrics?.shift;
  const propShift = shift;
  
  const displayShift = {
    gTarget: liveShift?.gTarget ?? propShift?.gTarget ?? fallbackGTarget,
    R_geom: liveShift?.R_geom ?? propShift?.R_geom ?? fallbackRGeom,
    epsilonTilt: liveShift?.epsilonTilt ?? propShift?.epsilonTilt ?? fallbackEpsilonTilt,
    betaTiltVec: liveShift?.betaTiltVec ?? propShift?.betaTiltVec ?? fallbackBetaTiltVec,
    gEff_check: liveShift?.gEff_check ?? propShift?.gEff_check ?? fallbackGEffCheck,
  };
  
  console.debug("[ShiftVectorPanel] Final display values:", displayShift);
  
  const hasLiveData = !!(liveShift && Object.keys(liveShift).length > 0);
  const hasPropData = !!(propShift && Object.keys(propShift).length > 0);
  const ok = hasLiveData || hasPropData || fallbackGTarget > 0; // Show panel if we have any data
  
  const dataSource = hasLiveData ? "live" : hasPropData ? "props" : "computed";
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
                <div className="text-xs text-slate-500">{dataSource}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">R<sub>geom</sub></div>
                <div className="text-cyan-300">{fstd(displayShift.R_geom, 1)} m</div>
                <div className="text-xs text-slate-500">{dataSource}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      <div className="text-slate-400">ε<sub>tilt</sub> (dimensionless)</div>
                      <div className="text-violet-400">{fmt(displayShift.epsilonTilt, 3)}</div>
                      <div className="text-xs text-slate-500">{dataSource}</div>
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
                <div className="text-xs text-slate-500">{dataSource}</div>
              </div>
              <div className="col-span-2 p-3 bg-slate-950 rounded">
                <div className="text-slate-400">g<sub>eff</sub> (check)</div>
                <div className="text-amber-300">{fstd(displayShift.gEff_check, 3)} m/s²</div>
                <div className="text-xs text-slate-500">{dataSource}</div>
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