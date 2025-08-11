import * as React from "react";
import { routeSummary } from "@/lib/route-math";
import { Body, RoutePlan, HelixPerf } from "@/lib/galaxy-schema";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function RouteSteps({ bodies, plan, perf }:{
  bodies: Body[]; plan: RoutePlan; perf: HelixPerf;
}) {
  const { legs, totals } = routeSummary(bodies, plan, perf);
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-semibold mb-2">Route Steps</div>
      <ol className="space-y-2 text-sm">
        {legs.map((leg,i)=>(
          <li key={i} className="flex justify-between items-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="font-medium">{leg.from.name} → {leg.to.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {leg.d_pc.toFixed(1)} pc · {leg.d_ly.toFixed(1)} ly
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md text-sm leading-snug">
                <strong>Theory</strong><br/>
                Straight-line hop over {leg.d_pc.toFixed(1)} pc. ETA scales with effective warp velocity v_eff(mode, duty). Energy per leg = (E/ly) × distance; cycles ≈ E_leg / E_cycle.<br/><br/>
                <em>Moving Zen:</em> Navigation is maai at stellar scale—right distance and right moment, repeated without waste.
              </TooltipContent>
            </Tooltip>
            <div className="text-right">
              <div>ETA {isFinite(leg.hours)? (leg.hours/24).toFixed(2)+" d" : "—"}</div>
              <div className="text-xs text-muted-foreground">
                {isFinite(leg.E_MWh)? leg.E_MWh.toFixed(1)+" MWh" : "—"}{(leg.cycles && isFinite(leg.cycles))? ` · ${leg.cycles.toExponential(2)} cycles`:""}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3 pt-2 border-t text-sm flex justify-between">
        <span className="text-muted-foreground">Total</span>
        <span>{totals.d_ly.toFixed(1)} ly · {(totals.hours/24).toFixed(2)} d · {totals.E_MWh.toFixed(1)} MWh</span>
      </div>
    </div>
  );
}