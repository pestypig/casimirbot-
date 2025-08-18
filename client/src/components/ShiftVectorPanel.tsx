import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const ok = !!shift;
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
        {!ok && <div className="text-slate-400">No shift-vector data (standby or unavailable).</div>}

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
                <div className="text-cyan-300">{fstd(shift!.gTarget, 3)} m/s²</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">R<sub>geom</sub></div>
                <div className="text-cyan-300">{fstd(shift!.R_geom, 1)} m</div>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      <div className="text-slate-400">ε<sub>tilt</sub> (dimensionless)</div>
                      <div className="text-purple-300">{fmt(shift!.epsilonTilt, 3)}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Kept ≪ 1e-6 ("whisper" regime) to preserve QI headroom and keep tilt visual-only inside.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <div className="text-slate-400">β⃗<sub>tilt</sub></div>
                <div className="text-emerald-300">[{shift!.betaTiltVec.join(", ")}]</div>
              </div>
              <div className="col-span-2 p-3 bg-slate-950 rounded">
                <div className="text-slate-400">g<sub>eff</sub> (check)</div>
                <div className="text-amber-300">{fstd(shift!.gEff_check, 3)} m/s²</div>
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