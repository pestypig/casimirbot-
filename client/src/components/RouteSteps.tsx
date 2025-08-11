// client/src/components/RouteSteps.tsx
import * as React from "react";
import { routeSummary } from "@/lib/route-math";
import { Body, RoutePlan, HelixPerf } from "@/lib/galaxy-schema";
import { auToLightMinutes } from "@/lib/solar-adapter";
import { LY_PER_PC, formatETA, hoursAtHighNoon } from "@/lib/eta";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RouteSteps({ bodies, plan, perf, mode = "galactic", etaMode = "model" }: {
  bodies: Body[]; 
  plan: RoutePlan; 
  perf: HelixPerf;
  mode?: "galactic" | "solar";
  etaMode?: "model" | "highnoon";
}) {
  // Create legs with real-time ETA calculation
  const byId = Object.fromEntries(bodies.map(b => [b.id, b]));
  const legs = [];
  
  for (let i = 0; i < plan.waypoints.length - 1; i++) {
    const A = byId[plan.waypoints[i]];
    const B = byId[plan.waypoints[i+1]];
    if (!A || !B) continue;

    const d_pc = Math.hypot(B.x_pc - A.x_pc, B.y_pc - A.y_pc);
    const d_ly = d_pc * LY_PER_PC;

    // --- ETA (default = model / real-time) ---
    let hours: number;
    if (etaMode === "model" && typeof perf.vEffLyPerHour === "function") {
      const vEff = perf.vEffLyPerHour(perf.mode, perf.duty);
      hours = vEff > 0 ? d_ly / vEff : hoursAtHighNoon(d_ly, 0.01);
    } else {
      hours = hoursAtHighNoon(d_ly, 0.01); // High Noon baseline (0.01 c)
    }

    // Energy calculations using existing perf values
    const E_MWh = isFinite(perf.energyPerLyMWh || 0) ? (perf.energyPerLyMWh || 0) * d_ly : Infinity;
    const cycles = isFinite(perf.energyPerCycleJ || 0) && (perf.energyPerCycleJ || 0) > 0 
      ? (E_MWh * 3.6e9) / (perf.energyPerCycleJ || 1) 
      : Infinity;

    legs.push({
      from: A, to: B,
      d_pc, d_ly,
      hours,
      E_MWh,
      cycles,
      etaPretty: formatETA(hours)
    });
  }

  const totalHours = legs.reduce((s, L) => s + L.hours, 0);
  const totalETA = formatETA(totalHours);
  const totalEnergy = legs.reduce((s, L) => s + (isFinite(L.E_MWh) ? L.E_MWh : 0), 0);
  
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
                <div>ETA {leg.etaPretty}</div>
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
            {legs.reduce((s, L) => s + L.d_ly, 0).toFixed(1)} ly · {totalETA} · {totalEnergy.toFixed(1)} MWh
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}