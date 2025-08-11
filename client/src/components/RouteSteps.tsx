// client/src/components/RouteSteps.tsx
import * as React from "react";
import { routeSummary } from "@/lib/route-math";
import { Body, RoutePlan, HelixPerf } from "@/lib/galaxy-schema";
import { auToLightMinutes } from "@/lib/solar-adapter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RouteSteps({ bodies, plan, perf, mode = "galactic" }: {
  bodies: Body[]; 
  plan: RoutePlan; 
  perf: HelixPerf;
  mode?: "galactic" | "solar";
}) {
  const { legs, totals } = routeSummary(bodies, plan, perf);
  
  // For solar mode, also show AU and light-minutes
  const formatDistance = (d_pc: number, d_ly: number) => {
    if (mode === "solar") {
      const d_au = d_pc * 206265; // 1 pc ≈ 206,265 AU
      const lightMinutes = auToLightMinutes(d_au);
      return `${d_au.toFixed(2)} AU · ${lightMinutes.toFixed(1)} light-min`;
    }
    return `${d_pc.toFixed(1)} pc · ${d_ly.toFixed(1)} ly`;
  };
  
  const getTooltipContent = (leg: any) => {
    if (mode === "solar") {
      const d_au = leg.d_pc * 206265;
      const lightMinutes = auToLightMinutes(d_au);
      return (
        <>
          <strong>Theory</strong><br/>
          Heliocentric transfer over {d_au.toFixed(2)} AU ({lightMinutes.toFixed(1)} light-minutes). ETA scales with effective warp velocity v_eff(mode, duty). Energy per leg = (E/ly) × distance; cycles ≈ E_leg / E_cycle.<br/><br/>
          <em>Moving Zen:</em> Even in near space, posture precedes motion—right trajectory and right timing, without waste.
        </>
      );
    }
    return (
      <>
        <strong>Theory</strong><br/>
        Straight-line hop over {leg.d_pc.toFixed(1)} pc. ETA scales with effective warp velocity v_eff(mode, duty). Energy per leg = (E/ly) × distance; cycles ≈ E_leg / E_cycle.<br/><br/>
        <em>Moving Zen:</em> Navigation is maai at stellar scale—right distance and right moment, repeated without waste.
      </>
    );
  };
  
  return (
    <TooltipProvider>
      <div className="rounded-lg border p-3">
        <div className="text-sm font-semibold mb-2">Route Steps</div>
        <ol className="space-y-2 text-sm">
          {legs.map((leg, i) => (
            <li key={i} className="flex justify-between items-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="font-medium">{leg.from.name} → {leg.to.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistance(leg.d_pc, leg.d_ly)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-md text-sm leading-snug">
                  {getTooltipContent(leg)}
                </TooltipContent>
              </Tooltip>
              <div className="text-right">
                <div>ETA {isFinite(leg.hours) ? (leg.hours / 24).toFixed(2) + " d" : "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {isFinite(leg.E_MWh) ? leg.E_MWh.toFixed(1) + " MWh" : "—"}
                  {(leg.cycles && isFinite(leg.cycles)) ? ` · ${leg.cycles.toExponential(2)} cycles` : ""}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 pt-2 border-t text-sm flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span>
            {totals.d_ly.toFixed(1)} ly · {(totals.hours / 24).toFixed(2)} d · {totals.E_MWh.toFixed(1)} MWh
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}