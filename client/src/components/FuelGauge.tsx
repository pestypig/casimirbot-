import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function fmt(x?: number, d=2) {
  if (x == null || !isFinite(x)) return "—";
  const a = Math.abs(x);
  return (a >= 1e4 || a < 1e-3) ? x.toExponential(2) : x.toFixed(d);
}

// 1c in ly/h
const C_LY_PER_HOUR = 1 / (365 * 24); // ≈ 1.14155e-4 ly/h

export type FuelGaugeProps = {
  mode: "Hover" | "Cruise" | "Emergency" | "Standby" | string;
  powerMW: number;      // P_avg (throttled)
  zeta: number;         // ζ margin (e.g., 0.032)
  tsRatio: number;      // T_s / T_LC (e.g., 4102.74)
  frOk?: boolean;
  natarioOk?: boolean;
  curvatureOk?: boolean;

  // Optional extras for better estimates
  freqGHz?: number;     // modulation frequency (cycles/sec = GHz * 1e9)
  duty?: number;        // 0..1
  gammaGeo?: number;
  qFactor?: number;
  pMaxMW?: number;      // constraint panel "Max Power"
};

/** Derive effective velocity (ly/hour) from current parameters.
 *  v_eff is provisional: tuned constants today, later replace with warp visual slope -> metric factor.
 */
export function computeEffectiveLyPerHour(
  mode: string, duty=0, gammaGeo=0, q=0, zeta=0, tsRatio=0
) {
  // Base FRACTIONS of c (keeps us subluminal by construction)
  const baseFrac: Record<string, number> = {
    Hover:     0.001,  // 0.1% c
    Cruise:    0.010,  // 1.0% c
    Emergency: 0.015,  // 1.5% c
    Standby:   0
  };
  let v = (baseFrac[mode] ?? 0) * C_LY_PER_HOUR;

  // gentle scaling with current tuning (kept bounded)
  const g = Math.min(40, Math.max(10, gammaGeo || 26));
  const qn = Math.log10(Math.max(1, q || 1e9)) - 6; // ~3 when q~1e9
  const dutyBoost = Math.max(0, duty || 0);     // 0..1
  const safety = clamp01(zeta / 0.84) * clamp01(tsRatio / 100);

  // small multipliers so we don't explode estimates
  v *= (1 + 0.01*(g - 26))
     * (1 + 0.05*qn)
     * (0.5 + 0.5*dutyBoost)
     * (0.5 + 0.5*safety);
  // Hard ceiling to stay sane
  const VMAX = 0.05 * C_LY_PER_HOUR; // 5% c
  return Math.min(v, VMAX);
}

/** Derive safe continuous window (hours) using constraints/budgets. */
function computeSafeWindowHours(mode: string, zeta=0, tsRatio=0, frOk?: boolean, natarioOk?: boolean, curvatureOk?: boolean, powerMW?: number, pMaxMW?: number) {
  const base: Record<string, number> = { Hover: 24, Cruise: 8, Emergency: 2, Standby: 168 };
  const baseWin = base[mode] ?? 0;

  const fZ  = clamp01(zeta / 0.84);
  const fT  = clamp01(tsRatio / 100);
  const fFR = frOk === false ? 0.6 : 1.0;
  const fNa = natarioOk === false ? 0.7 : 1.0;
  const fCu = curvatureOk === false ? 0.7 : 1.0;
  const fPw = pMaxMW && powerMW ? clamp01(pMaxMW / Math.max(1e-9, powerMW)) : 1.0; // throttle if near cap

  return baseWin * clamp01(fZ * fT * fFR * fNa * fCu * fPw);
}

export function FuelGauge(props: FuelGaugeProps) {
  const { mode, powerMW, zeta, tsRatio, frOk, natarioOk, curvatureOk, freqGHz=0, duty=0, gammaGeo=26, qFactor=1e9, pMaxMW } = props;

  const safeHours = computeSafeWindowHours(mode, zeta, tsRatio, frOk, natarioOk, curvatureOk, powerMW, pMaxMW);

  // --- Speed band (min / avg / max) from *existing* inputs only ---
  const vAvgLyH = computeEffectiveLyPerHour(mode, duty,     gammaGeo, qFactor, zeta, tsRatio);
  const vMinLyH = computeEffectiveLyPerHour(mode, Math.max(0, (duty||0)*0.5), gammaGeo, qFactor, zeta, tsRatio); // pessimistic duty
  const vMaxLyH = computeEffectiveLyPerHour(mode, 1,        gammaGeo, qFactor, zeta, tsRatio);                    // optimistic duty=1

  // ----- Energy / ly & Range -----
  const hoursPerLy = vAvgLyH > 0 ? 1 / vAvgLyH : Infinity;
  const energyPerLyMWh = isFinite(hoursPerLy) ? powerMW * hoursPerLy : Infinity;
  const rangeLyAvg = vAvgLyH * safeHours;
  const rangeLyMin = vMinLyH * safeHours;
  const rangeLyMax = vMaxLyH * safeHours;

  // Baseline (0.01c) for verification
  const baselineFracC = 0.01;
  const baselineLyH = baselineFracC * C_LY_PER_HOUR;
  const fracC_avg = vAvgLyH / C_LY_PER_HOUR;
  const fracC_min = vMinLyH / C_LY_PER_HOUR;
  const fracC_max = vMaxLyH / C_LY_PER_HOUR;

  // ----- Cycles (simple, useful now) -----
  // Per-cycle energy ≈ P_avg / f.  P[MW]*1e6 W  /  (GHz*1e9)  =  J per cycle.
  const cyclesPerSec = freqGHz > 0 ? freqGHz * 1e9 : 0;
  const energyPerCycleJ = cyclesPerSec > 0 ? (powerMW * 1e6) / cyclesPerSec : Infinity;

  // Energy per ly in Joules: MWh * 3.6e9
  const energyPerLyJ = isFinite(energyPerLyMWh) ? energyPerLyMWh * 3.6e9 : Infinity;
  const cyclesPerLy = (isFinite(energyPerLyJ) && isFinite(energyPerCycleJ)) ? (energyPerLyJ / energyPerCycleJ) : Infinity;

  // Gauge fill
  const baseWindow = { Hover: 24, Cruise: 8, Emergency: 2, Standby: 168 }[mode] ?? 0;
  const percent = baseWindow > 0 ? clamp01(safeHours / baseWindow) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <CardTitle className="text-sm font-semibold capitalize cursor-help">
              Mission Fuel / Range (mode: {String(mode).toLowerCase()})
            </CardTitle>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-sm leading-snug">
            <strong>Theory</strong><br/>
            Usable negative-energy "fuel" is the throttled Casimir power P<span className="align-[0.1em]">avg</span> times a safe operating window from constraints (ζ, T<sub>s</sub>/T<sub>LC</sub>, Natário, curvature, power cap).<br/>
            Energy/ly = P<span className="align-[0.1em]">avg</span> × hours/ly.  Per-cycle yield ≈ P<span className="align-[0.1em]">avg</span>/f.<br/><br/>
            <em>Moving Zen:</em> Restraint extends reach; the longest journey is walked by preserving each step.
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-muted-foreground">Safe window</div>
          <div className="text-right tabular-nums">{fmt(safeHours,2)} h</div>

          <div className="text-muted-foreground">Energy / light-year</div>
          <div className="text-right tabular-nums">
            {isFinite(energyPerLyMWh) ? `${fmt(energyPerLyMWh,1)} MWh/ly` : "—"}
          </div>

          <div className="text-muted-foreground">Range @ current</div>
          <div className="text-right tabular-nums">{fmt(rangeLyAvg,3)} ly</div>

          <div className="text-muted-foreground">Speed (avg)</div>
          <div className="text-right tabular-nums">
            {(fracC_avg*100).toFixed(3)}% c · {vAvgLyH.toExponential(3)} ly/h
          </div>

          <div className="text-muted-foreground">Speed band</div>
          <div className="text-right tabular-nums">
            {(fracC_min*100).toFixed(3)}–{(fracC_max*100).toFixed(3)}% c
          </div>

          <div className="text-muted-foreground">Range band</div>
          <div className="text-right tabular-nums">
            {fmt(rangeLyMin,3)}–{fmt(rangeLyMax,3)} ly
          </div>

          <div className="text-muted-foreground">P_avg</div>
          <div className="text-right tabular-nums">{fmt(powerMW,1)} MW</div>

          <div className="text-muted-foreground">Cycles / light-year</div>
          <div className="text-right tabular-nums">
            {isFinite(cyclesPerLy) ? `${fmt(cyclesPerLy,2)}` : "—"}
          </div>

          <div className="text-muted-foreground">Per-cycle energy</div>
          <div className="text-right tabular-nums">
            {isFinite(energyPerCycleJ) ? `${fmt(energyPerCycleJ,2)} J` : "—"}
          </div>

          <div className="text-muted-foreground">Baseline (0.01c)</div>
          <div className="text-right tabular-nums">
            {(baselineFracC*100).toFixed(2)}% c · {baselineLyH.toExponential(3)} ly/h
          </div>
        </div>

        <Progress value={percent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>constraints</span>
          <span>window {fmt(baseWindow,0)} h</span>
        </div>
      </CardContent>
    </Card>
  );
}