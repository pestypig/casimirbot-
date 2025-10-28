// live-energy-pipeline.tsx
import { startTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Zap, Atom, Settings } from "lucide-react";
import { zenLongToast } from "@/lib/zen-long-toasts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEnergyPipeline, useSwitchMode, MODE_CONFIGS, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";

interface LiveEnergyPipelineProps {
  // Physics parameters
  gammaGeo: number;
  qFactor: number;
  duty: number;
  sagDepth: number;
  temperature: number;
  tileArea: number; // cm²
  shipRadius: number; // m
  gapDistance?: number; // nm, default 1.0
  sectorCount?: number; // Number of sectors for strobing (default 400)
  exoticMassTarget?: number; // kg, user-configurable exotic mass target

  // Show calculations in real-time
  isRunning?: boolean;

  // Mode selection and callbacks
  selectedMode?: string;
  onModeChange?: (mode: string) => void;
  onParameterUpdate?: (params: { duty: number; qFactor?: number; gammaGeo?: number; exoticMassTarget?: number }) => void;
}

export function LiveEnergyPipeline({
  gammaGeo,
  qFactor,
  duty,
  sagDepth,
  temperature,
  tileArea,
  shipRadius,
  gapDistance = 1.0,
  sectorCount = 400,
  exoticMassTarget = 1405,
  isRunning = false,
  selectedMode = "hover",
  onModeChange,
  onParameterUpdate
}: LiveEnergyPipelineProps) {
  // Pull live state once and map names
  const { data: pipelineState } = useEnergyPipeline();  // authoritative operational values
  const switchMode = useSwitchMode(); 

  const P: Partial<EnergyPipelineState> = pipelineState ?? {};
  const live = {
    currentMode: (P.currentMode ?? selectedMode ?? "hover") as "standby"|"hover"|"nearzero"|"cruise"|"emergency",
    dutyCycle:    Number.isFinite(P.dutyCycle) ? P.dutyCycle! : duty ?? 0.14,
    sectorStrobing: Number.isFinite(P.sectorStrobing) ? P.sectorStrobing! : (Number.isFinite(P.concurrentSectors) ? Number(P.concurrentSectors) : 1),
    qSpoilingFactor: Number.isFinite(P.qSpoilingFactor) ? P.qSpoilingFactor! : 1,
    qCavity:      Number.isFinite(P.qCavity) ? P.qCavity! : (qFactor ?? 1e9),
    gammaGeo:     Number.isFinite(P.gammaGeo) ? P.gammaGeo! : (gammaGeo ?? 26),
    // Use server's calibrated γ_VdB if present; fallback to paper seed 1e11 (keeps UI aligned with backend)
    gammaVanDenBroeck: Number.isFinite(P.gammaVanDenBroeck) ? P.gammaVanDenBroeck! : 1e11,
    modulationFreq_GHz: Number.isFinite(P.modulationFreq_GHz) ? P.modulationFreq_GHz! : 15,
    P_avg_MW:     Number.isFinite(P.P_avg) ? P.P_avg! : NaN,
    M_exotic_kg:  Number.isFinite(P.M_exotic) ? P.M_exotic! : NaN,
    zeta:         Number.isFinite(P.zeta) ? P.zeta! : NaN,
    TS_ratio:     Number.isFinite(P.TS_ratio) ? P.TS_ratio! : NaN,
  };

  // Guard MODE_CONFIGS lookups (prevents a crash if keys ever drift or arrive late)
  const modes = MODE_CONFIGS as Record<string, { name?: string; powerTarget_W?: number; P_target_W?: number }>;
  const currentModeKey = live.currentMode in modes ? live.currentMode : "hover";
  const currentModeCfg = modes[currentModeKey] ?? { name: currentModeKey };

  // Helper: read target power (W) regardless of the property name used upstream
  const getPowerTargetW = (cfg: any | undefined): number | undefined => {
    if (!cfg) return undefined;
    if (Number.isFinite(cfg.powerTarget_W)) return Number(cfg.powerTarget_W);
    if (Number.isFinite(cfg.P_target_W))    return Number(cfg.P_target_W);
    if (Number.isFinite(cfg.powerTargetW))  return Number(cfg.powerTargetW);
    if (Number.isFinite(cfg.powerTarget))   return Number(cfg.powerTarget);
    return undefined;
  };

  // Build live descriptions for all modes using actual pipeline values
  const buildLiveDesc = (P_MW: number, M_kg: number, zeta: number) => [
    Number.isFinite(P_MW) ? `${P_MW.toFixed(1)} MW` : "— MW",
    Number.isFinite(M_kg) ? `${M_kg.toFixed(0)} kg` : "— kg", 
    Number.isFinite(zeta) ? `ζ=${zeta.toFixed(3)}` : "ζ=—"
  ].join(" • ");

  // Current mode live description
  const liveDesc = buildLiveDesc(live.P_avg_MW, live.M_exotic_kg, live.zeta);

  // Harden formatting
  const fmt = (v: unknown, d = "—", n?: number) => {
    const x = Number(v);
    if (!Number.isFinite(x)) return d;
    return typeof n === "number" ? x.toFixed(n) : String(x);
  };
  const fexp = (v: unknown, d = "—", n = 1) => {
    const x = Number(v);
    return Number.isFinite(x) ? x.toExponential(n) : d;
  };

  // Utility formatting for the equations section
  const formatScientific = (value: number, decimals = 3) => {
    if (value === undefined || value === null || isNaN(value)) return "—";
    if (Math.abs(value) === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(decimals)} × 10^${exp}`;
  };
  const clampPos = (x: number, d: number) => (Number.isFinite(x) && x > 0 ? x : d);

  // === Equations (live substitution) — purely explanatory; backend remains authoritative ===
  // Constants
  const PI = Math.PI;
  const HBAR = 1.054571817e-34; // J·s
  const C = 299_792_458;        // m/s

  // Inputs & conversions
  const a_m = clampPos((gapDistance ?? 1.0) * 1e-9, 1e-12); // gap in meters, lower-bounded to keep formula finite
  const A_tile_m2 = clampPos((tileArea ?? 1) * 1e-4, 1e-12); // cm² → m²
  const f_mod_Hz = clampPos((live.modulationFreq_GHz ?? 15) * 1e9, 1); // Hz
  const S_total = clampPos(sectorCount ?? 400, 1);
  const S_live = clampPos(live.sectorStrobing ?? 1, 1);
  const burstLocal = clampPos(live.dutyCycle ?? duty ?? 0.14, 0); // interpret UI duty as local on-fraction
  const d_eff = Math.min(1, burstLocal * (S_live / S_total));     // Ford–Roman averaged duty (illustrative)
  const L_long_m = clampPos(2 * (shipRadius ?? 82.0), 1e-3);      // simple geometric proxy

  // Casimir energy density and derived energies
  const uCasimir = -((PI ** 2) * HBAR * C) / (720 * (a_m ** 4));          // J/m³
  const U_static = uCasimir * (A_tile_m2 * a_m);                           // J (density × volume per tile)
  const U_geo = (live.gammaGeo ?? 1) * U_static;                           // J
  const U_Q = (live.qCavity ?? 1) * U_geo;                                 // J

  // Indicative average power from cycle energy, frequency, and FR duty
  const P_est_W = U_Q * f_mod_Hz * d_eff;                                  // W (illustrative, not authoritative)
  const P_est_MW = P_est_W / 1e6;                                          // MW

  // Time-scale separation estimate (Natário coherence proxy)
  const T_LC_s = L_long_m / C;
  const T_m_s = 1 / f_mod_Hz;
  const TS_est = T_LC_s / T_m_s;                                           // ≈ f_mod * L_long / c

  // Required Van den Broeck amplification to hit target exotic mass (proportionality model)
  const gammaVdB_required =
    Number.isFinite(live.M_exotic_kg) && live.M_exotic_kg > 0
      ? (exoticMassTarget / (live.M_exotic_kg as number)) * (live.gammaVanDenBroeck || 1)
      : NaN;

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-lg cursor-help">
                  Live Energy Pipeline: {currentModeCfg?.name ?? currentModeKey} Mode
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-md text-sm leading-snug">
                <strong>Pipeline overview</strong><br/>
                This view assembles cavity energy, geometric amplification (γ_geo), Q-enhancement, duty, sector strobing, and safety guards (ζ, Natário, curvature) into a single operational picture.<br/><br/>
                <em>Moving Zen:</em> Presence before action—see the whole garden before you rake a single line.
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>{isRunning ? "Running" : "Real-time"}</span>
          </Badge>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-4 mt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Operational Mode:</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Theory</strong><br/>
              Mode rebalances contraction/expansion zones, duty, sector strobing, and Q-spoiling. It changes power, ζ, and viable payload.<br/><br/>
              <em>Moving Zen:</em> Every journey begins in stillness. Choose bearing; then move without hesitation (maai).
            </TooltipContent>
          </Tooltip>
          <Select
            value={currentModeKey}
            onValueChange={(value) => {
              startTransition(() => {
                switchMode.mutate(value as any); // authoritative mode change
              });
              onModeChange?.(value);
              // Defensive access in the toast
              zenLongToast("mode:switch", {
                mode: modes[value]?.name ?? value,
                duty: live.dutyCycle,
                powerMW: live.P_avg_MW,
                zeta: live.zeta,
                tsRatio: live.TS_ratio,
                exoticKg: live.M_exotic_kg,
                gammaGeo: live.gammaGeo,
                qFactor: live.qCavity,
                freqGHz: live.modulationFreq_GHz,
                sectors: live.sectorStrobing,
                frOk: Number.isFinite(live.zeta)
                        ? live.zeta <= (value==="hover"?0.05:value==="cruise"?1.0:0.02)
                        : true,
                natarioOk: Number.isFinite(live.TS_ratio) ? live.TS_ratio >= 100 : true,
                curvatureOk: true
              });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modes).map(([key, cfg]) => {
                // Current mode → live values; others → target power or live + targets
                const getModeDesc = () => {
                  if (key === currentModeKey) return liveDesc;
                  if (Number.isFinite(live.P_avg_MW) && Number.isFinite(live.M_exotic_kg) && Number.isFinite(live.zeta)) {
                    const powerTargetW = getPowerTargetW(MODE_CONFIGS[key as keyof typeof MODE_CONFIGS]);
                    if (Number.isFinite(powerTargetW)) {
                      const powerMW = (powerTargetW as number) / 1e6;
                      return buildLiveDesc(powerMW, live.M_exotic_kg, live.zeta);
                    }
                  }
                  const powerTargetW = getPowerTargetW(MODE_CONFIGS[key as keyof typeof MODE_CONFIGS]);
                  if (Number.isFinite(powerTargetW)) {
                    const powerW = powerTargetW as number;
                    if (powerW >= 1e6) return `${(powerW / 1e6).toFixed(1)} MW target`;
                    if (powerW >= 1e3) return `${(powerW / 1e3).toFixed(1)} kW target`;
                    return `${powerW.toFixed(1)} W target`;
                  }
                  return "";
                };
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cfg?.name ?? key}</span>
                      <span className="text-xs text-muted-foreground">{getModeDesc()}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Exotic Mass Target Control */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Exotic Mass Target:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={exoticMassTarget}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  onParameterUpdate?.({ 
                    duty: live.dutyCycle, 
                    qFactor, 
                    gammaGeo,
                    exoticMassTarget: value 
                  });
                }
              }}
              className="w-20 px-2 py-1 text-sm border rounded"
              min="1"
              max="10000"
            />
            <span className="text-sm text-muted-foreground">kg</span>
            <span className="text-xs text-muted-foreground ml-2">
              (required γ_VdB ≈ {Number.isFinite(gammaVdB_required) ? fexp(gammaVdB_required, "—", 2) : "—"})
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Current: {liveDesc}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Foundation: Cycle-Averaged Cavity Energy */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">∞</span>
                Foundation: Cycle-Averaged Cavity Energy
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Theory</strong><br/>
              u<sub>Casimir</sub> = −π²ℏc/(720a⁴) sets the baseline energy density.<br/>
              U<sub>static</sub> = u · (A<sub>tile</sub> · a), U<sub>geo</sub> = γ<sub>geo</sub> · U<sub>static</sub>, U<sub>Q</sub> = Q · U<sub>geo</sub>.<br/><br/>
              <em>Moving Zen:</em> Posture before movement. Quiet stance, accurate cuts.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-xs space-y-1">
            <div>γ_geo = {fmt(live.gammaGeo, "—", 1)}, Q_cavity = {fexp(live.qCavity)}, f_mod = {fmt(live.modulationFreq_GHz)} GHz</div>
            <div>a = {formatScientific(a_m)} m, A_tile = {formatScientific(A_tile_m2)} m²</div>
          </div>
        </div>

        {/* Live Average Power (authoritative) */}
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">P</span>
                Live Average Power
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Pipeline Value</strong><br/>
              Authoritative power from backend pipeline (Casimir foundations + γ_geo + Q + duty + strobing).<br/><br/>
              <em>Note:</em> An indicative P̂ from the equations is shown in the math section below for transparency only.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-green-700 dark:text-green-300 font-semibold text-lg">
              P_avg = {fmt(live.P_avg_MW, "—", 1)} MW
            </div>
            <div className="text-muted-foreground">
              Mode: {live.currentMode} • Duty: {fmt(live.dutyCycle * 100, "—", 1)}% • Sectors(live) = {live.sectorStrobing}
            </div>
          </div>
        </div>

        {/* Live Exotic Mass */}
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">M</span>
                Live Exotic Mass
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Pipeline Value</strong><br/>
              Total exotic mass budget from the energy pipeline (incorporates Van den Broeck pocket amplification).
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-purple-700 dark:text-purple-300 font-semibold text-lg">
              M_exotic = {fmt(live.M_exotic_kg, "—", 0)} kg
            </div>
            <div className="text-muted-foreground">
              γ_VdB = {fexp(live.gammaVanDenBroeck, "—", 2)} • target γ_VdB ≈ {Number.isFinite(gammaVdB_required) ? fexp(gammaVdB_required, "—", 2) : "—"}
            </div>
          </div>
        </div>

        {/* Live Quantum Safety */}
        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">ζ</span>
                Live Quantum Safety (Ford–Roman ζ)
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Pipeline Value</strong><br/>
              Ford–Roman quantum inequality parameter (ANE C-compliance proxy). Lower is safer.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-orange-700 dark:text-orange-300 font-semibold text-lg">
              ζ = {fmt(live.zeta, "—", 3)} {Number.isFinite(live.zeta) && live.zeta <= 1 ? "✓" : "✗"}
            </div>
            <div className="text-muted-foreground">
              Ford–Roman compliance: {Number.isFinite(live.zeta) && live.zeta <= 1 ? "SAFE" : "CHECK PARAMETERS"}
            </div>
          </div>
        </div>

        {/* Live Time-Scale Separation */}
        <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">T</span>
                Live Time-Scale Separation
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Pipeline Value</strong><br/>
              Ratio ensuring field homogenization outpaces modulation. Values ≥ 100 maintain Natário coherence.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-cyan-700 dark:text-cyan-300 font-semibold text-lg">
              TS_ratio = {fmt(live.TS_ratio, "—", 1)} {Number.isFinite(live.TS_ratio) && live.TS_ratio >= 100 ? "✓" : "✗"}
            </div>
            <div className="text-muted-foreground">
              Natário coherence: {Number.isFinite(live.TS_ratio) && live.TS_ratio >= 100 ? "MAINTAINED" : "CHECK FREQUENCY"}
            </div>
          </div>
        </div>

        {/* === NEW: Equations (live substitution) === */}
        <div className="rounded-lg p-4 border border-slate-300/40 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/30">
          <h4 className="font-semibold text-sm mb-3">Equations (with live values)</h4>

          <div className="font-mono text-[12px] leading-6 space-y-2">
            {/* Casimir density */}
            <div>
              <div>u<sub>Casimir</sub> = −π²ℏc / (720 a⁴)</div>
              <div className="text-slate-500">
                = −({PI.toFixed(4)}² · {HBAR.toExponential(3)} J·s · {C.toLocaleString()} m/s) / (720 · {a_m.toExponential(3)} m)⁴
                {" "}= <strong>{uCasimir.toExponential(3)} J/m³</strong>
              </div>
            </div>

            {/* Static energy per tile volume */}
            <div>
              <div>U<sub>static</sub> = u · (A<sub>tile</sub> · a)</div>
              <div className="text-slate-500">
                = ({uCasimir.toExponential(3)} J/m³) · ({A_tile_m2.toExponential(3)} m² · {a_m.toExponential(3)} m)
                {" "}= <strong>{U_static.toExponential(3)} J</strong>
              </div>
            </div>

            {/* Geometric amplification */}
            <div>
              <div>U<sub>geo</sub> = γ<sub>geo</sub> · U<sub>static</sub></div>
              <div className="text-slate-500">
                = ({fmt(live.gammaGeo, "—")}) · ({U_static.toExponential(3)} J)
                {" "}= <strong>{U_geo.toExponential(3)} J</strong>
              </div>
            </div>

            {/* Q lift */}
            <div>
              <div>U<sub>Q</sub> = Q · U<sub>geo</sub></div>
              <div className="text-slate-500">
                = ({fexp(live.qCavity, "—", 2)}) · ({U_geo.toExponential(3)} J)
                {" "}= <strong>{U_Q.toExponential(3)} J</strong>
              </div>
            </div>

            {/* FR effective duty */}
            <div>
              <div>d<sub>eff</sub> ≈ burst<sub>local</sub> · S<sub>live</sub> / S<sub>total</sub></div>
              <div className="text-slate-500">
                = ({fmt(burstLocal, "—", 3)}) · {S_live} / {S_total}
                {" "}= <strong>{d_eff.toPrecision(3)}</strong>
                <span className="ml-2 text-[11px] opacity-70">(illustrative; backend may compute FR duty differently)</span>
              </div>
            </div>

            {/* Indicative power (equation-based, not authoritative) */}
            <div>
              <div>P̂ ≈ U<sub>Q</sub> · f<sub>mod</sub> · d<sub>eff</sub></div>
              <div className="text-slate-500">
                = ({U_Q.toExponential(3)} J) · ({f_mod_Hz.toExponential(3)} Hz) · ({d_eff.toPrecision(3)})
                {" "}= <strong>{P_est_W.toExponential(3)} W</strong> ({P_est_MW.toFixed(2)} MW)
              </div>
            </div>

            {/* Time-scale separation estimate */}
            <div>
              <div>TS ≈ T<sub>LC</sub> / T<sub>m</sub> = (L<sub>long</sub>/c) / (1/f<sub>mod</sub>) = f<sub>mod</sub> · L<sub>long</sub> / c</div>
              <div className="text-slate-500">
                = ({f_mod_Hz.toExponential(3)} Hz · {L_long_m.toExponential(3)} m) / {C.toLocaleString()} m/s
                {" "}= <strong>{TS_est.toPrecision(3)}</strong>
                <span className="ml-2 text-[11px] opacity-70">(using L<sub>long</sub> ≈ 2·shipRadius)</span>
              </div>
            </div>

            {/* Van den Broeck requirement */}
            <div>
              <div>γ<sub>VdB,req</sub> ≈ γ<sub>VdB</sub> · (M<sub>target</sub> / M<sub>live</sub>)</div>
              <div className="text-slate-500">
                = ({fexp(live.gammaVanDenBroeck, "—", 2)}) · ({exoticMassTarget.toFixed(0)} / {fmt(live.M_exotic_kg, "—")})
                {" "}= <strong>{Number.isFinite(gammaVdB_required) ? gammaVdB_required.toExponential(2) : "—"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Pipeline Summary */}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center text-primary">
            <Atom className="h-4 w-4 mr-2" />
            Live Pipeline Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Power:</span>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {fmt(live.P_avg_MW, "—", 1)} MW
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Exotic Mass:</span>
              <div className="font-semibold text-purple-600 dark:text-purple-400">
                {fmt(live.M_exotic_kg, "—", 0)} kg
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Quantum Safety:</span>
              <div className="font-semibold">ζ = {fmt(live.zeta, "—", 3)} {Number.isFinite(live.zeta) && live.zeta <= 1 ? "✓" : "✗"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Time-Scale:</span>
              <div className="font-semibold">
                {fmt(live.TS_ratio, "—", 1)} {Number.isFinite(live.TS_ratio) && live.TS_ratio >= 100 ? "✓" : "✗"}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            P̂ (equation estimate) shown above is for transparency only; the backend P_avg is authoritative.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

