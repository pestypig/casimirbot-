import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Zap, Atom, Settings } from "lucide-react";
import { zenLongToast } from "@/lib/zen-long-toasts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEnergyPipeline, useSwitchMode, MODE_CONFIGS } from "@/hooks/use-energy-pipeline";

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
  
  const P = pipelineState || {};
  const live = {
    currentMode: (P.currentMode ?? selectedMode ?? "hover") as "standby"|"hover"|"cruise"|"emergency",
    dutyCycle:    Number.isFinite(P.dutyCycle) ? P.dutyCycle! : duty ?? 0.14,
    sectorStrobing: Number.isFinite(P.sectorStrobing) ? P.sectorStrobing! : 1,
    qSpoilingFactor: Number.isFinite(P.qSpoilingFactor) ? P.qSpoilingFactor! : 1,
    qCavity:      Number.isFinite(P.qCavity) ? P.qCavity! : (qFactor ?? 1e9),
    gammaGeo:     Number.isFinite(P.gammaGeo) ? P.gammaGeo! : (gammaGeo ?? 26),
    gammaVanDenBroeck: Number.isFinite(P.gammaVanDenBroeck) ? P.gammaVanDenBroeck! : 2.86e5,
    modulationFreq_GHz: Number.isFinite(P.modulationFreq_GHz) ? P.modulationFreq_GHz! : 15,
    P_avg_MW:     Number.isFinite(P.P_avg) ? P.P_avg! : NaN,
    M_exotic_kg:  Number.isFinite(P.M_exotic) ? P.M_exotic! : NaN,
    zeta:         Number.isFinite(P.zeta) ? P.zeta! : NaN,
    TS_ratio:     Number.isFinite(P.TS_ratio) ? P.TS_ratio! : NaN,
  };

  // Guard MODE_CONFIGS lookups (prevents a crash if keys ever drift or arrive late)
  const modes = MODE_CONFIGS as Record<string, { name: string; powerTarget?: number }>;
  const currentModeKey = live.currentMode in modes ? live.currentMode : "hover";
  const currentModeCfg = modes[currentModeKey] ?? { name: currentModeKey };

  // human-friendly description built from live values when viewing the current mode
  const liveDesc = [
    Number.isFinite(live.P_avg_MW) ? `${live.P_avg_MW.toFixed(1)} MW` : "— MW",
    Number.isFinite(live.M_exotic_kg) ? `${live.M_exotic_kg.toFixed(0)} kg` : "— kg",
    Number.isFinite(live.zeta) ? `ζ=${live.zeta.toFixed(3)}` : "ζ=—"
  ].join(" • ");

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
  
  // All physics values now come from the authoritative pipeline
  // No local recomputation
  
  // Utility functions (declare before using)
  const formatScientific = (value: number, decimals = 3) => {
    if (value === undefined || value === null || isNaN(value)) return "...";
    if (Math.abs(value) === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(decimals)} × 10^${exp}`;
  };
  
  const formatStandard = (value: number, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) return "...";
    return value.toFixed(decimals);
  };

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
              switchMode.mutate(value as any); // authoritative mode change
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
              {Object.entries(modes).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{cfg?.name ?? key}</span>
                    <span className="text-xs text-muted-foreground">
                      {key === currentModeKey
                        ? liveDesc
                        : (cfg?.powerTarget != null
                            ? `${cfg.powerTarget} MW target`
                            : "")}
                    </span>
                  </div>
                </SelectItem>
              ))}
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
              (required γ_VdB to hit target ≈ {Number.isFinite(live.M_exotic_kg) && live.M_exotic_kg>0
                ? fexp(exoticMassTarget / live.M_exotic_kg * (live.gammaVanDenBroeck || 1), "—", 2)
                : "—"})
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
              u_Casimir = -π²ℏc/(720a⁴) defines the baseline field energy. U_static = u_Casimir·A_tile·a, then geometry sets U_geo = γ·U_static; Q_mech lifts it to U_Q = Q_mech·U_geo—the posture of all later steps.<br/><br/>
              <em>Moving Zen:</em> Posture before movement. A stance you can hold quietly is the root of accurate cuts.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-xs space-y-1">
            <div>Live Pipeline Foundations:</div>
            <div>γ_geo = {fmt(live.gammaGeo, "—", 1)}</div>
            <div>Q_cavity = {fexp(live.qCavity)}</div>
            <div>f_mod = {fmt(live.modulationFreq_GHz)} GHz</div>
            <div className="text-blue-700 dark:text-blue-300 font-semibold">
              Current Mode: {live.currentMode} ({fmt(live.dutyCycle * 100, "—", 1)}% duty)
            </div>
          </div>
        </div>

        {/* Live Average Power */}
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
              Authoritative power calculation from the backend energy pipeline, incorporating all physics: Casimir foundations, geometric amplification, Q-enhancement, duty cycling, and sector strobing.<br/><br/>
              <em>Moving Zen:</em> Truth before technique—authentic values guide authentic action.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-green-700 dark:text-green-300 font-semibold text-lg">
              P_avg = {fmt(live.P_avg_MW, "—", 1)} MW
            </div>
            <div className="text-muted-foreground">
              Mode: {live.currentMode} • Duty: {fmt(live.dutyCycle * 100, "—", 1)}% • Sectors: {live.sectorStrobing}
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
              Total exotic mass budget from the energy pipeline, incorporating Van-den-Broeck pocket amplification and mode-specific scaling.<br/><br/>
              <em>Moving Zen:</em> Mass follows energy—every gram accountable, every calculation honest.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-purple-700 dark:text-purple-300 font-semibold text-lg">
              M_exotic = {fmt(live.M_exotic_kg, "—", 0)} kg
            </div>
            <div className="text-muted-foreground">
              γ_VdB = {fexp(live.gammaVanDenBroeck, "—", 2)}
            </div>
          </div>
        </div>

        {/* Live Quantum Safety */}
        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm mb-2 flex items-center cursor-help">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">ζ</span>
                Live Quantum Safety (Ford-Roman ζ)
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-md text-sm leading-snug">
              <strong>Pipeline Value</strong><br/>
              Ford-Roman quantum inequality parameter ensuring averaged null energy condition compliance. Lower values indicate higher safety margins.<br/><br/>
              <em>Moving Zen:</em> Safety first, speed second—quantum bounds respect no ambition.
            </TooltipContent>
          </Tooltip>
          <div className="font-mono text-sm space-y-1">
            <div className="text-orange-700 dark:text-orange-300 font-semibold text-lg">
              ζ = {fmt(live.zeta, "—", 3)} {Number.isFinite(live.zeta) && live.zeta <= 1 ? "✓" : "✗"}
            </div>
            <div className="text-muted-foreground">
              Ford-Roman compliance: {Number.isFinite(live.zeta) && live.zeta <= 1 ? "SAFE" : "CHECK PARAMETERS"}
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
              Ratio ensuring field homogenization outpaces drive modulation. Values ≥100 maintain Natário spacetime coherence.<br/><br/>
              <em>Moving Zen:</em> Timing is everything—let structure settle before the next change.
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
              <div className="font-semibold">{fmt(live.TS_ratio, "—", 1)} {Number.isFinite(live.TS_ratio) && live.TS_ratio >= 100 ? "✓" : "✗"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}