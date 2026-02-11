/**
 * Visual Proof Charts Component
 * Implements the three proof visualizations: Radar plot, Energy Pipeline, and Duty vs Power
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, ComposedChart
} from "recharts";
import { TrendingUp, Activity, Target } from "lucide-react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useProofPack } from "@/hooks/useProofPack";
import { useMathStageGate } from "@/hooks/useMathStageGate";
import {
  PROOF_PACK_STAGE_REQUIREMENTS,
  getProofValue,
  isStrictProofPack,
  readProofBooleanStrict,
  readProofNumberStrict,
} from "@/lib/proof-pack";
import { STAGE_BADGE, STAGE_LABELS } from "@/lib/math-stage-gate";
import { cn } from "@/lib/utils";

interface VisualProofChartsProps {
  // Optional overrides; if omitted, live pipeline values are used
  results?: {
    totalEnergy?: number;               // J (we'll use pipeline.U_cycle if missing)
    geometricBlueshiftFactor?: number;  // γ_geo
    qEnhancementFactor?: number;        // Q factor
    totalExoticMass?: number;           // kg
    powerDraw?: number;                 // W (NOTE: pipeline.P_avg is MW → convert)
    quantumInequalityMargin?: number;   // ζ
    dutyFactor?: number;                // d_burst (local ON window, e.g. 0.01)
    effectiveDuty?: number;             // d_eff (shipwide, e.g. S_live/400 * d_burst)
    baselineEnergyDensity?: number;
    amplifiedEnergyDensity?: number;
  };
  targets?: {
    gammaGeo?: number;         // nominal target
    cavityQ?: number;          // Q target
    dutyFactor?: number;       // burst duty target (e.g. 0.01)
    effectiveDuty?: number;    // effective duty target (e.g. 2.5e-5)
    exoticMassTarget?: number; // kg
    powerTarget?: number;      // W  (NOTE: this component expects W)
    zetaSafeLimit?: number;    // ≤ 1.0 typically
  };
}

const isFiniteNumber = (v: unknown): v is number => Number.isFinite(v as number);
const num = (v: unknown, d = 0) => (isFiniteNumber(v) ? (v as number) : d);

export function VisualProofCharts({ results = {}, targets = {} }: VisualProofChartsProps) {
  const { data: pipeline } = useEnergyPipeline();
  const { data: proofPack } = useProofPack({ refetchInterval: 5000, staleTime: 10000 });
  const stageGate = useMathStageGate(PROOF_PACK_STAGE_REQUIREMENTS, { staleTime: 30000 });
  const stageLabel = stageGate.pending ? "STAGE..." : STAGE_LABELS[stageGate.stage];
  const stageProxy = !stageGate.ok || !proofPack;
  const strictMode = isStrictProofPack(proofPack);
  const proofNum = (key: string) => readProofNumberStrict(proofPack, key, strictMode);
  const proofBool = (key: string) => readProofBooleanStrict(proofPack, key, strictMode);
  const proofProxyFrom = (keys: string[]) =>
    stageProxy || keys.some((key) => Boolean(getProofValue(proofPack, key)?.proxy));
  const allowFallback = !strictMode;
  const kTraceMean = proofNum("metric_k_trace_mean");
  const kSqMean = proofNum("metric_k_sq_mean");
  const vdbTwoWallSupport = proofBool("vdb_two_wall_support");
  const vdbTwoWallDerivativeSupport = proofBool("vdb_two_wall_derivative_support");
  const kProxy = proofProxyFrom(["metric_k_trace_mean", "metric_k_sq_mean"]);
  const vdbProxy = proofProxyFrom(["vdb_two_wall_support", "vdb_two_wall_derivative_support"]);


  // --- Live values from pipeline with safe fallbacks ---
  const mode = String((pipeline as any)?.currentMode ?? "").toLowerCase();

  // Power: server sends P_avg in MW — convert to W for this component
  const powerDrawW =
    proofNum("power_avg_W") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.P_avg_W)
      ? ((pipeline as any).P_avg_W as number)
      : allowFallback && isFiniteNumber((pipeline as any)?.P_avg)
        ? ((pipeline as any).P_avg as number) * 1e6
        : allowFallback && isFiniteNumber(results.powerDraw)
          ? (results.powerDraw as number)
          : 0);

  // Mass
  const massKg =
    proofNum("M_exotic_kg") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.M_exotic)
      ? (pipeline as any).M_exotic as number
      : allowFallback && isFiniteNumber(results.totalExoticMass)
        ? (results.totalExoticMass as number)
        : 0);

  // Gamma_geo, Q, ζ
  const gammaGeo =
    proofNum("gamma_geo") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.gammaGeo)
      ? (pipeline as any).gammaGeo as number
      : allowFallback ? num(results.geometricBlueshiftFactor, 26) : 0);

  const qCavity =
    proofNum("q_cavity") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.qCavity)
      ? (pipeline as any).qCavity as number
      : allowFallback ? num(results.qEnhancementFactor, 1e9) : 0);

  const zeta =
    proofNum("zeta") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.zeta)
      ? (pipeline as any).zeta as number
      : allowFallback ? num(results.quantumInequalityMargin, 0.5) : 0);

  // Energy (J): prefer pipeline.U_cycle; else fallback
  const totalEnergyJ =
    proofNum("U_cycle_J") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.U_cycle)
      ? (pipeline as any).U_cycle as number
      : allowFallback ? num(results.totalEnergy, -2.55e-3) : 0);

  // Duty (two notions)
  const dutyBurst =
    proofNum("duty_burst") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.dutyBurst)
      ? (pipeline as any).dutyBurst as number
      : allowFallback ? num(results.dutyFactor, 0.01) : 0);

  const dutyEff =
    proofNum("duty_effective") ??
    (allowFallback && isFiniteNumber((pipeline as any)?.dutyEffective_FR)
      ? (pipeline as any).dutyEffective_FR as number
      : allowFallback ? num(results.effectiveDuty, 2.5e-5) : 0);

  const chartProxy = proofProxyFrom([
    "power_avg_W",
    "M_exotic_kg",
    "gamma_geo",
    "q_cavity",
    "zeta",
    "U_cycle_J",
    "duty_burst",
    "duty_effective",
  ]);
  const proxyBadgeClass = strictMode ? "bg-rose-900/40 text-rose-200" : "bg-slate-800 text-slate-300";
  const proxyBadgeLabel = strictMode ? "NON-ADMISSIBLE" : "PROXY";
  const strictBlocked = strictMode && chartProxy;

  // --- Targets (server-first if exposed; else sane fallbacks) ---
  const exoticMassTarget =
    isFiniteNumber((pipeline as any)?.exoticMassTarget_kg) ? (pipeline as any).exoticMassTarget_kg as number :
    num(targets.exoticMassTarget, 1405);

  const serverCons = (pipeline as any)?.constraints ?? {};

  const zetaSafeLimit =
    isFiniteNumber(serverCons?.zeta_max) ? (serverCons.zeta_max as number) :
    num(targets.zetaSafeLimit, 1.0);

  const targetGammaGeo =
    isFiniteNumber((pipeline as any)?.gammaGeo) ? (pipeline as any).gammaGeo as number :
    num(targets.gammaGeo, 26);

  const targetQ =
    isFiniteNumber((pipeline as any)?.qCavity) ? (pipeline as any).qCavity as number :
    num(targets.cavityQ, 1e9);

  const targetDutyBurst =
    isFiniteNumber((pipeline as any)?.dutyBurst) ? (pipeline as any).dutyBurst as number :
    num(targets.dutyFactor, 0.01);

  const targetDutyEff =
    isFiniteNumber((pipeline as any)?.dutyEffective_FR) ? (pipeline as any).dutyEffective_FR as number :
    num(targets.effectiveDuty, 2.5e-5);

  // Power target by mode — EXPECTS W
  const powerTargetW =
    isFiniteNumber(serverCons?.P_target_W) ? (serverCons.P_target_W as number) :
    mode === "hover"     ? 83.3e6  :
    mode === "cruise"    ? 40e6    : // Mk1 cruise policy
    mode === "emergency" ? 297.5e6 :
    mode === "standby"   ? 0       :
    num(targets.powerTarget, 83e6);

  // A. Radar Plot Data - "Spec vs Achieved"
  const radarData = [
    {
      subject: "γ_geo",
      target: targetGammaGeo,
      achieved: gammaGeo,
      fullMark: Math.max(targetGammaGeo, gammaGeo) * 1.2 || 1,
    },
    {
      subject: "Q (10⁹)",
      target: targetQ / 1e9,
      achieved: qCavity / 1e9,
      fullMark: Math.max(targetQ, qCavity) / 1e9 * 1.2 || 1,
    },
    {
      subject: "duty d (%)",
      target: targetDutyBurst * 100,
      achieved: dutyBurst * 100,
      fullMark: Math.max(targetDutyBurst, dutyBurst) * 100 * 1.2 || 1,
    },
    {
      subject: "1/ζ",
      target: 1 / Math.max(1e-9, zetaSafeLimit),
      achieved: zeta > 0 ? (1 / zeta) : 0,
      fullMark: (1 / Math.max(1e-9, Math.min(zetaSafeLimit, zeta || zetaSafeLimit))) * 1.2,
    },
    {
      subject: "Power (MW)",
      target: powerTargetW / 1e6,
      achieved: powerDrawW / 1e6,
      fullMark: Math.max(powerTargetW, powerDrawW) / 1e6 * 1.2 || 1,
    },
    {
      subject: "Mass (10³kg)",
      target: exoticMassTarget / 1e3,
      achieved: massKg / 1e3,
      fullMark: Math.max(exoticMassTarget, massKg) / 1e3 * 1.2 || 1,
    },
  ];

  // B. Energy Boost Pipeline Data (units: mJ for display)
  const E_flat = -2.55e-3; // J (paper-ish seed)
  const E_bowl = isFiniteNumber(totalEnergyJ) ? totalEnergyJ : E_flat; // J
  const Q_enhancement = Math.max(1, num(qCavity, 1)); // dimensionless

  const energyPipelineData = [
    { stage: "E_flat", energy: Math.abs(E_flat) * 1e3, label: "Flat Plates" },                         // mJ
    { stage: "E_bowl", energy: Math.abs(E_bowl) * 1e3, label: "Bowl Geometry" },                       // mJ
    { stage: "E_Q",    energy: Math.abs(E_bowl) * Q_enhancement * 1e3, label: "+Q Enhancement" },      // mJ
    { stage: "E_duty", energy: Math.abs(E_bowl) * Q_enhancement * dutyBurst * 1e3, label: "+Duty" },   // mJ
    { stage: "E_deff", energy: Math.abs(E_bowl) * Q_enhancement * dutyEff * 1e3, label: "+Strobing" }, // mJ
  ];
  const eVals = energyPipelineData.map(d => d.energy).filter(v => v > 0);
  const xMin = Math.max(1e-6, Math.min(...eVals, Infinity));
  const xMax = Math.max(...eVals, 1);

  // C. Duty vs Power Analysis Data (scale around live baseline)
  const dutyRange = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]; // candidate d values
  const baseDuty = dutyBurst || 0.01;
  const basePowerW = powerDrawW || powerTargetW; // avoid zero dividing; use target if no reading
  const baseZeta = zeta || 0.5;

  const dutyAnalysisData = dutyRange.map((d) => {
    const scale = baseDuty > 0 ? d / baseDuty : 1;
    const power = basePowerW * scale; // proportional scaling assumption
    const zetaScaled = baseZeta * scale;
    return {
      duty: d * 100, // %
      power: power / 1e6, // MW
      zeta: zetaScaled,
      isOptimal: power < 83e6 && zetaScaled < 1.0, // legacy sweet-spot rule
    };
  });

  if (strictBlocked) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Visual Proof Analysis</h3>
          <Badge variant="outline">Real-time Validation</Badge>
          <Badge variant="outline" className={cn("border", STAGE_BADGE[stageGate.stage])}>
            {stageLabel}
          </Badge>
          <Badge className={proxyBadgeClass}>{proxyBadgeLabel}</Badge>
        </div>
        <Card className="border border-rose-500/40 bg-rose-500/10 text-rose-100">
          <CardHeader>
            <CardTitle className="text-sm">Strict mode blocked</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Proof charts are hidden because one or more inputs are proxy-only in strict
            congruence mode. Provide metric-derived values to render these charts.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Visual Proof Analysis</h3>
        <Badge variant="outline">Real-time Validation</Badge>
        <Badge variant="outline" className={cn("border", STAGE_BADGE[stageGate.stage])}>
          {stageLabel}
        </Badge>
        {chartProxy ? (
          <Badge className={proxyBadgeClass}>{proxyBadgeLabel}</Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
        <span>
          metric K: trace={isFiniteNumber(kTraceMean) ? kTraceMean.toExponential(2) : "n/a"} 1/m,{" "}
          sq={isFiniteNumber(kSqMean) ? kSqMean.toExponential(2) : "n/a"} 1/m^2
        </span>
        {kProxy ? <Badge className={proxyBadgeClass}>{proxyBadgeLabel}</Badge> : null}
        <span>
          VdB two-wall derivative:{" "}
          {vdbTwoWallSupport == null
            ? "n/a"
            : vdbTwoWallSupport
              ? "yes"
              : "no"}{" "}
          deriv={vdbTwoWallDerivativeSupport == null ? "n/a" : vdbTwoWallDerivativeSupport ? "yes" : "no"}
        </span>
        {vdbProxy ? <Badge className={proxyBadgeClass}>{proxyBadgeLabel}</Badge> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* A. Radar Plot - Spec vs Achieved */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Spec vs Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-xs" />
                <PolarRadiusAxis angle={90} domain={[0, "dataMax"]} className="text-xs" />
                <Radar name="Target" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Achieved" dataKey="achieved" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} strokeWidth={2} />
                <RTTooltip formatter={(v: number, n: string) => [typeof v === "number" ? v.toFixed(2) : v, n]} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">Green: Target spec | Blue: Achieved values</div>
          </CardContent>
        </Card>

        {/* B. Energy Boost Pipeline */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Energy Boost Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={energyPipelineData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  scale="log"
                  domain={[xMin, xMax]}
                  allowDataOverflow
                  className="text-xs"
                />
                <YAxis type="category" dataKey="stage" className="text-xs" width={80} />
                <RTTooltip
                  formatter={(value: number) => [`${Number(value).toExponential(2)} mJ`, "Energy"]}
                  labelFormatter={(label: string) => {
                    const item = energyPipelineData.find(d => d.stage === label);
                    return item?.label || label;
                  }}
                />
                <Bar dataKey="energy" fill="#8884d8" name="Energy (mJ)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">Energy amplification: Flat → Bowl → Q → Duty</div>
          </CardContent>
        </Card>

        {/* C. Duty vs Power Sweet Spot */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Duty vs Power/Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dutyAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="duty" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <RTTooltip
                  formatter={(value: number, name: string) => [
                    name === "power" ? `${value.toFixed(1)} MW` :
                    name === "zeta"  ? `${value.toFixed(3)}`   : value,
                    name === "power" ? "Power" : "ζ Safety",
                  ]}
                  labelFormatter={(label: number) => `Duty: ${label}%`}
                />
                <Bar yAxisId="left" dataKey="power" fill="#3b82f6" name="power" />
                <Line yAxisId="right" type="monotone" dataKey="zeta" stroke="#ef4444" strokeWidth={2} name="zeta" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">Blue: Power draw | Red: Safety margin (ζ)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
