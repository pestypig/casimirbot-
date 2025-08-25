import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Copy } from "lucide-react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

/**
 * CurvaturePhysicsPanel
 *
 * A compact, drop-down style panel that shows the REAL-pane physics chain as
 * single-line equations with a second line that plugs-in live numbers and the
 * solved value. Designed to mirror the feel of the Checkpoints panel.
 *
 * Displays (per current mode):
 *   (1) duty_local = burst_ms / dwell_ms
 *   (2) duty_FR    = duty_local * (S_concurrent / S_total)
 *   (3) ΔA/A       = qSpoilingFactor
 *   (4) ℛ ∝ γ_geo * γ_VdB * (ΔA/A) * duty_FR
 *
 * Props allow you to override anything if you already computed it in the parent.
 */

export type LightCrossingLike = {
  burst_ms?: number;
  dwell_ms?: number;
};

export type CurvaturePhysicsPanelProps = {
  className?: string;
  // Optional live timing (useLightCrossingLoop)
  lightCrossing?: LightCrossingLike;
  // Optional sectoring overrides
  totalSectors?: number;         // e.g., 400
  concurrentSectors?: number;    // e.g., 1 (hover) or 400 (cruise)
  // Engine reference for reading uniforms directly
  leftEngineRef?: React.RefObject<any>;
  // Optional physics overrides
  gammaGeo?: number;             // γ_geo
  gammaVdB?: number;             // γ_VdB
  qSpoilingFactor?: number;      // ΔA/A
  dutyEffectiveFR?: number;      // ship-wide FR duty, if you have it precomputed
  // Header controls
  title?: string;
  description?: string;
  defaultOpen?: boolean;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const fmt = (v: unknown, d = 3) => (isNum(v) ? v.toFixed(d) : "—");
const fexp = (v: unknown, d = 2) => (isNum(v) ? v.toExponential(d) : "—");
const pct = (v: unknown, d = 3) => (isNum(v) ? `${(v * 100).toFixed(d)}%` : "—");

function CopyLine({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => navigator.clipboard.writeText(text)}
      title="Copy values"
    >
      <Copy className="w-3.5 h-3.5" />
    </Button>
  );
}

export default function CurvaturePhysicsPanel({
  className,
  lightCrossing,
  totalSectors,
  concurrentSectors,
  leftEngineRef,
  gammaGeo,
  gammaVdB,
  qSpoilingFactor,
  dutyEffectiveFR,
  title = "Curvature Physics (REAL)",
  description = "Live numbers for the parity chain driving the REAL pane",
  defaultOpen = false,
}: CurvaturePhysicsPanelProps) {
  const { data: pipeline } = useEnergyPipeline();

  // Live mode + defaults
  const mode = (pipeline as any)?.currentMode ?? "hover";
  
  // derive S_concurrent / S_total straight from the left engine uniforms
  const U = leftEngineRef?.current?.uniforms ?? {};
  const sConc = Math.max(1, +(U.sectors ?? 1));
  const sTot  = Math.max(1, +(totalSectors ?? (pipeline as any)?.sectorCount ?? 400));
  
  const S_total = sTot;
  const S_live = sConc;

  // Timing: prefer actual loop measurements if provided
  const burst_ms = isNum(lightCrossing?.burst_ms) ? lightCrossing!.burst_ms! : undefined;
  const dwell_ms = isNum(lightCrossing?.dwell_ms) ? lightCrossing!.dwell_ms! : undefined;
  const duty_local_measured = (isNum(burst_ms) && isNum(dwell_ms) && dwell_ms! > 0)
    ? clamp01(burst_ms! / dwell_ms!) : undefined;

  // If not measured, fall back to the paper/CFG local window (~1%)
  const duty_local_default = 0.01;
  const duty_local = isNum(duty_local_measured) ? duty_local_measured : duty_local_default;

  // FR duty: use explicit override if provided, else compute from local × sector ratio
  const duty_FR_calc = clamp01(duty_local * (S_live / S_total));
  const duty_FR = isNum(dutyEffectiveFR) ? clamp01(dutyEffectiveFR!) : duty_FR_calc;

  // Physics factors
  const gGeo = isNum(gammaGeo) ? gammaGeo! : (pipeline as any)?.gammaGeo ?? 26;
  const gVdB = isNum(gammaVdB) ? gammaVdB! : (pipeline as any)?.gammaVanDenBroeck ?? 1.4e5;
  const dAoA = isNum(qSpoilingFactor) ? qSpoilingFactor! : (pipeline as any)?.qSpoilingFactor ?? 1.0;

  // Amplitude proxy for the REAL pane (unitless scale factor)
  const ampREAL = gGeo * gVdB * dAoA * duty_FR;

  // Pretty second-line strings
  const line1 = `duty_local = burst_ms / dwell_ms`;
  const line1Filled = `= ${isNum(burst_ms) ? `${fmt(burst_ms, 3)} ms` : `${(duty_local_default*100).toFixed(2)}% (default)`} / ${isNum(dwell_ms) ? `${fmt(dwell_ms, 3)} ms` : `—`} = ${pct(duty_local, 3)}`;

  const line2 = `duty_FR = duty_local × (S_concurrent / S_total)`;
  const line2Filled = `= ${pct(duty_local, 3)} × (${S_live} / ${S_total}) = ${pct(duty_FR, 3)}`;

  const line3 = `ΔA/A = qSpoilingFactor`;
  const line3Filled = `= ${fmt(dAoA, 3)}`;

  const line4 = `ℛ ∝ γ_geo × γ_VdB × (ΔA/A) × duty_FR`;
  const line4Filled = `= ${fmt(gGeo, 3)} × ${fexp(gVdB, 2)} × ${fmt(dAoA, 3)} × ${pct(duty_FR, 5)} ≈ ${fexp(ampREAL, 2)} (arb. units)`;

  // Copy payload text (one-per-line values)
  const asText = [
    `${line1}\n${line1Filled}`,
    `${line2}\n${line2Filled}`,
    `${line3}\n${line3Filled}`,
    `${line4}\n${line4Filled}`,
  ].join("\n\n");

  return (
    <TooltipProvider>
      <Card className={"bg-slate-900/50 border-slate-800 "+(className||"")}> 
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {title}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1">REAL Pane Chain</div>
                    <p className="text-xs">
                      The inspector's REAL canvas scales curvature with γ_geo · γ_VdB · (ΔA/A) · duty_FR.
                      Grid framing and hull axes set what volume is shown; they don't change this amplitude.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="text-xs">Mode: <span className="uppercase">{String(mode)}</span></CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-cyan-400/40 text-cyan-300">
                S: {S_live}/{S_total}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-emerald-400/40 text-emerald-300">
                duty_FR: {pct(duty_FR, 3)}
              </Badge>
              <CopyLine text={asText} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Collapsible body */}
          <details className="group open:animate-in open:fade-in-50">
            <summary className="cursor-pointer list-none -mx-2 px-2 py-1 rounded hover:bg-slate-800/40 flex items-center justify-between">
              <span className="text-sm text-slate-200">Show derivation</span>
              <span className="text-xs text-slate-400 group-open:hidden">(expand)</span>
              <span className="text-xs text-slate-400 hidden group-open:inline">(collapse)</span>
            </summary>

            <div className="mt-3 space-y-3 font-mono text-[12.5px] leading-5">
              {/* duty_local */}
              <div className="rounded-md bg-slate-950/60 border border-slate-800 p-2">
                <div className="text-slate-300">{line1}</div>
                <div className="text-slate-400">{line1Filled}</div>
              </div>

              {/* duty_FR */}
              <div className="rounded-md bg-slate-950/60 border border-slate-800 p-2">
                <div className="text-slate-300">{line2}</div>
                <div className="text-slate-400">{line2Filled}</div>
              </div>

              {/* q-spoil */}
              <div className="rounded-md bg-slate-950/60 border border-slate-800 p-2">
                <div className="text-slate-300">{line3}</div>
                <div className="text-slate-400">{line3Filled}</div>
              </div>

              {/* amplitude chain */}
              <div className="rounded-md bg-slate-950/60 border border-slate-800 p-2">
                <div className="text-slate-300">{line4}</div>
                <div className="text-slate-400">{line4Filled}</div>
              </div>

              {/* Footnote */}
              <div className="text-[11px] text-slate-500">
                Note: <span className="font-mono">gridSpan</span> and <span className="font-mono">hull {"{a,b,c}"}</span> control framing and sampling only; they do not affect the REAL amplitude above.
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}