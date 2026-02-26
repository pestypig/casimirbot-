import {
  calculateEnergyPipeline,
  initializePipelineState,
  MODE_CONFIGS,
  PAPER_GEO,
  type EnergyPipelineState,
} from "../server/energy-pipeline";
import type {
  ConstraintResult,
  ConstraintSeverity,
  ViabilityResult,
  ViabilityStatus,
  WarpConfig,
  WarpSolverGuardrails,
  WarpViabilitySnapshot,
} from "../types/warpViability";
import type { PipelineSnapshot } from "../types/pipeline";
import { findWarpConstraint, loadWarpAgentsConfig, resolveConstraintSeverity } from "../modules/physics/warpAgents";
import { SI_TO_GEOM_STRESS } from "../shared/gr-units";
import { WARP_TS_RATIO_MIN } from "../shared/clocking";

export type { ConstraintResult, ConstraintSeverity, ViabilityResult, ViabilityStatus, WarpConfig };

const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const CM2_TO_M2 = 1e-4;
const DEFAULT_TS_MIN = WARP_TS_RATIO_MIN;
const TS_IDLE_JITTER_MIN = Math.max(WARP_TS_RATIO_MIN - 0.01, 0); // certificate-side buffer for rounding jitter when idle
const DEFAULT_THETA_MAX = 1e12;
const DEFAULT_MASS_TOL = 0.1; // +/-10% band
const DEFAULT_CL3_RHO_DELTA_MAX = parseEnvNumber(process.env.WARP_CL3_RHO_DELTA_MAX, 0.1);
const VDB_MIN = 0;
const VDB_MAX = 1e16;
const VDB_BPRIME_MIN_ABS = parseEnvNumber(process.env.WARP_VDB_BPRIME_MIN_ABS, 1e-18);
const VDB_BDOUBLE_MIN_ABS = parseEnvNumber(process.env.WARP_VDB_BDOUBLE_MIN_ABS, 1e-18);
const VDB_DFDR_MIN_ABS = parseEnvNumber(process.env.WARP_VDB_DFDR_MIN_ABS, 1e-18);
const strictCongruenceEnabled = () => process.env.WARP_STRICT_CONGRUENCE !== "0";
const G4_QI_REASON_CODES = {
  marginExceeded: "G4_QI_MARGIN_EXCEEDED",
  sourceNotMetric: "G4_QI_SOURCE_NOT_METRIC",
  contractMissing: "G4_QI_CONTRACT_MISSING",
  curvatureWindowFail: "G4_QI_CURVATURE_WINDOW_FAIL",
  applicabilityNotPass: "G4_QI_APPLICABILITY_NOT_PASS",
  signalMissing: "G4_QI_SIGNAL_MISSING",
} as const;
const G4_QI_REASON_CODE_ORDER = [
  G4_QI_REASON_CODES.signalMissing,
  G4_QI_REASON_CODES.sourceNotMetric,
  G4_QI_REASON_CODES.contractMissing,
  G4_QI_REASON_CODES.curvatureWindowFail,
  G4_QI_REASON_CODES.applicabilityNotPass,
  G4_QI_REASON_CODES.marginExceeded,
] as const;

const orderG4ReasonCodes = (codes: string[]): string[] => {
  const unique = Array.from(new Set(codes));
  return unique.sort((a, b) => {
    const ia = G4_QI_REASON_CODE_ORDER.indexOf(a as (typeof G4_QI_REASON_CODE_ORDER)[number]);
    const ib = G4_QI_REASON_CODE_ORDER.indexOf(b as (typeof G4_QI_REASON_CODE_ORDER)[number]);
    const na = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const nb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    return na - nb || a.localeCompare(b);
  });
};

const qiSourceIsMetric = (source: unknown): boolean => {
  const s = typeof source === "string" ? source.toLowerCase() : "";
  return s.startsWith("warp.metric") || s.startsWith("gr.rho_constraint") || s.startsWith("gr.metric");
};

const GR_GUARDRAIL_THRESHOLDS = {
  H_rms: parseEnvNumber(process.env.WARP_GR_H_RMS_MAX, 1e-3),
  M_rms: parseEnvNumber(process.env.WARP_GR_M_RMS_MAX, 1e-3),
  lapseFloor: parseEnvNumber(process.env.WARP_GR_LAPSE_FLOOR_MIN, 0.2),
  betaMaxAbs: parseEnvNumber(process.env.WARP_GR_BETA_MAX_ABS, 1.0),
};

const toNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toFinite = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const finiteOrUndefined = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const resolveVdbDerivativeMaxAbs = (
  region: any,
  minKey: "bprime_min" | "bdouble_min",
  maxKey: "bprime_max" | "bdouble_max",
): number | undefined => {
  const minValue = toFinite(region?.[minKey]);
  const maxValue = toFinite(region?.[maxKey]);
  if (minValue == null && maxValue == null) return undefined;
  return Math.max(Math.abs(minValue ?? 0), Math.abs(maxValue ?? 0));
};

const hasVdbRegionIIMetricSupport = (region: any): boolean => {
  if (region?.support !== true) return false;
  const t00Mean = toFinite(region?.t00_mean);
  const sampleCount = toFinite(region?.sampleCount);
  const bprimeMaxAbs = resolveVdbDerivativeMaxAbs(region, "bprime_min", "bprime_max");
  const bdoubleMaxAbs = resolveVdbDerivativeMaxAbs(region, "bdouble_min", "bdouble_max");
  return (
    t00Mean != null &&
    sampleCount != null &&
    sampleCount > 0 &&
    bprimeMaxAbs != null &&
    bprimeMaxAbs > VDB_BPRIME_MIN_ABS &&
    bdoubleMaxAbs != null &&
    bdoubleMaxAbs > VDB_BDOUBLE_MIN_ABS
  );
};

const hasVdbRegionIVMetricSupport = (region: any): boolean => {
  if (region?.support !== true) return false;
  const t00Mean = toFinite(region?.t00_mean);
  const sampleCount = toFinite(region?.sampleCount);
  const dfdrMaxAbs = toFinite(region?.dfdr_max_abs);
  return (
    t00Mean != null &&
    sampleCount != null &&
    sampleCount > 0 &&
    dfdrMaxAbs != null &&
    Math.abs(dfdrMaxAbs) > VDB_DFDR_MIN_ABS
  );
};

type MetricT00GeomRef = {
  value?: number;
  source?: string;
  chart?: string;
  family?: string;
  observer?: string;
  normalization?: string;
  unitSystem?: string;
  contractStatus?: string;
  contractReason?: string;
  contractOk?: boolean;
};

const hasStrictNatarioContractMetadata = (args: {
  chart?: string;
  chartContractStatus?: string;
  observer?: string;
  normalization?: string;
  unitSystem?: string;
}): boolean => {
  const chartOk = args.chart != null && args.chart !== "" && args.chart !== "unspecified";
  return (
    chartOk &&
    args.chartContractStatus === "ok" &&
    args.observer != null &&
    args.observer !== "" &&
    args.normalization != null &&
    args.normalization !== "" &&
    args.unitSystem === "SI"
  );
};

const resolveMetricT00GeomFromPipeline = (
  pipeline: EnergyPipelineState,
): MetricT00GeomRef => {
  const warpAdapter = (pipeline as any).warp?.metricAdapter;
  const warpChart =
    typeof warpAdapter?.chart?.label === "string" && warpAdapter.chart.label.length > 0
      ? String(warpAdapter.chart.label)
      : undefined;
  const warpFamily =
    typeof warpAdapter?.family === "string" && warpAdapter.family.length > 0
      ? String(warpAdapter.family)
      : undefined;
  const warpMetricT00 = toFinite((pipeline as any).warp?.metricT00);
  const warpMetricSource =
    (pipeline as any).warp?.metricT00Source ??
    ((pipeline as any).warp?.metricT00 != null ? "metric" : undefined);
  const warpMetricRef =
    typeof (pipeline as any).warp?.metricT00Ref === "string" &&
    (pipeline as any).warp.metricT00Ref.length > 0
      ? String((pipeline as any).warp.metricT00Ref)
      : "warp.metric.T00";
  const warpMetricContract =
    (pipeline as any).warp?.metricT00Contract &&
    typeof (pipeline as any).warp.metricT00Contract === "object"
      ? ((pipeline as any).warp.metricT00Contract as Record<string, unknown>)
      : undefined;
  const warpObserverRaw =
    (pipeline as any).warp?.metricT00Observer ??
    warpMetricContract?.observer;
  const warpNormalizationRaw =
    (pipeline as any).warp?.metricT00Normalization ??
    warpMetricContract?.normalization;
  const warpUnitSystemRaw =
    (pipeline as any).warp?.metricT00UnitSystem ??
    warpMetricContract?.unitSystem;
  const warpContractStatusRaw =
    warpMetricContract?.status ??
    (pipeline as any).natario?.metricT00ContractStatus;
  const warpContractReasonRaw =
    warpMetricContract?.reason ??
    (pipeline as any).natario?.metricT00ContractReason;
  const warpObserver =
    typeof warpObserverRaw === "string" && warpObserverRaw.length > 0
      ? String(warpObserverRaw)
      : undefined;
  const warpNormalization =
    typeof warpNormalizationRaw === "string" && warpNormalizationRaw.length > 0
      ? String(warpNormalizationRaw)
      : undefined;
  const warpUnitSystem =
    typeof warpUnitSystemRaw === "string" && warpUnitSystemRaw.length > 0
      ? String(warpUnitSystemRaw)
      : undefined;
  const warpContractStatus =
    typeof warpContractStatusRaw === "string" && warpContractStatusRaw.length > 0
      ? String(warpContractStatusRaw)
      : undefined;
  const warpContractReason =
    typeof warpContractReasonRaw === "string" && warpContractReasonRaw.length > 0
      ? String(warpContractReasonRaw)
      : undefined;
  const warpChartContractStatus =
    typeof warpAdapter?.chart?.contractStatus === "string" && warpAdapter.chart.contractStatus.length > 0
      ? String(warpAdapter.chart.contractStatus)
      : "unknown";
  const warpContractOk = hasStrictNatarioContractMetadata({
    chart: warpChart,
    chartContractStatus: warpChartContractStatus,
    observer: warpObserver,
    normalization: warpNormalization,
    unitSystem: warpUnitSystem,
  }) && warpContractStatus === "ok";
  if (warpMetricSource === "metric" && warpMetricT00 != null) {
    return {
      value: warpMetricT00 * SI_TO_GEOM_STRESS,
      source: warpMetricRef,
      chart: warpChart,
      family: warpFamily,
      observer: warpObserver,
      normalization: warpNormalization,
      unitSystem: warpUnitSystem,
      contractStatus: warpContractStatus,
      contractReason: warpContractReason,
      contractOk: warpContractOk,
    };
  }

  const natarioMetricT00 = toFinite((pipeline as any).natario?.metricT00);
  const natarioMetricSource =
    (pipeline as any).natario?.metricT00Source ??
    (pipeline as any).natario?.metricSource;
  const natarioMetricRef =
    typeof (pipeline as any).natario?.metricT00Ref === "string" &&
    (pipeline as any).natario.metricT00Ref.length > 0
      ? String((pipeline as any).natario.metricT00Ref)
      : "warp.metric.T00.natario.shift";
  const natarioChart =
    typeof (pipeline as any).natario?.chartLabel === "string" &&
    (pipeline as any).natario.chartLabel.length > 0
      ? String((pipeline as any).natario.chartLabel)
      : undefined;
  const natarioObserver =
    typeof (pipeline as any).natario?.metricT00Observer === "string" &&
    (pipeline as any).natario.metricT00Observer.length > 0
      ? String((pipeline as any).natario.metricT00Observer)
      : undefined;
  const natarioNormalization =
    typeof (pipeline as any).natario?.metricT00Normalization === "string" &&
    (pipeline as any).natario.metricT00Normalization.length > 0
      ? String((pipeline as any).natario.metricT00Normalization)
      : undefined;
  const natarioUnitSystem =
    typeof (pipeline as any).natario?.metricT00UnitSystem === "string" &&
    (pipeline as any).natario.metricT00UnitSystem.length > 0
      ? String((pipeline as any).natario.metricT00UnitSystem)
      : undefined;
  const natarioContractStatus =
    typeof (pipeline as any).natario?.metricT00ContractStatus === "string" &&
    (pipeline as any).natario.metricT00ContractStatus.length > 0
      ? String((pipeline as any).natario.metricT00ContractStatus)
      : undefined;
  const natarioChartContractStatus =
    typeof (pipeline as any).natario?.chartContractStatus === "string" &&
    (pipeline as any).natario.chartContractStatus.length > 0
      ? String((pipeline as any).natario.chartContractStatus)
      : warpChartContractStatus;
  const natarioContractReason =
    typeof (pipeline as any).natario?.metricT00ContractReason === "string" &&
    (pipeline as any).natario.metricT00ContractReason.length > 0
      ? String((pipeline as any).natario.metricT00ContractReason)
      : undefined;
  const natarioContractOk = hasStrictNatarioContractMetadata({
    chart: natarioChart ?? warpChart,
    chartContractStatus: natarioChartContractStatus,
    observer: natarioObserver,
    normalization: natarioNormalization,
    unitSystem: natarioUnitSystem,
  }) && natarioContractStatus === "ok";
  if (natarioMetricSource === "metric" && natarioMetricT00 != null) {
    return {
      value: natarioMetricT00 * SI_TO_GEOM_STRESS,
      source: natarioMetricRef,
      chart: natarioChart ?? warpChart,
      family: "natario",
      observer: natarioObserver,
      normalization: natarioNormalization,
      unitSystem: natarioUnitSystem,
      contractStatus: natarioContractStatus,
      contractReason: natarioContractReason,
      contractOk: natarioContractOk,
    };
  }

  const vdbRegionII = (pipeline as any).vdbRegionII;
  const vdbRegionIIT00Mean = toFinite(vdbRegionII?.t00_mean);
  if (hasVdbRegionIIMetricSupport(vdbRegionII) && vdbRegionIIT00Mean != null) {
    return {
      value: vdbRegionIIT00Mean,
      source: "warp.metric.T00.vdb.regionII",
      chart: warpChart ?? "comoving_cartesian",
      family: "vdb",
      observer: "orthonormal_region_ii",
      normalization: "si_stress",
      unitSystem: "SI",
      contractStatus: "ok",
      contractReason: undefined,
      contractOk: true,
    };
  }

  const vdbRegionIV = (pipeline as any).vdbRegionIV;
  const vdbRegionIVT00Mean = toFinite(vdbRegionIV?.t00_mean);
  if (hasVdbRegionIVMetricSupport(vdbRegionIV) && vdbRegionIVT00Mean != null) {
    return {
      value: vdbRegionIVT00Mean,
      source: "warp.metric.T00.vdb.regionIV",
      chart: warpChart ?? "comoving_cartesian",
      family: "vdb",
      observer: "eulerian_n",
      normalization: "si_stress",
      unitSystem: "SI",
      contractStatus: "ok",
      contractReason: undefined,
      contractOk: true,
    };
  }

  return {};
};

const relDelta = (current: number, baseline: number, eps = 1e-12): number =>
  Math.abs(current - baseline) / Math.max(Math.abs(baseline), eps);

const clamp01 = (value: number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  return Math.max(0, Math.min(1, value));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProvenanceClass = "measured" | "proxy" | "inferred";
type ConfidenceBand = { low: number; high: number };
type ClaimTier = "diagnostic" | "reduced-order" | "certified";

type PromotionDecision = {
  tier: ClaimTier;
  reason:
    | "insufficient_provenance"
    | "strict_mode_disabled"
    | "hard_constraint_failed"
    | "status_non_admissible"
    | "strict_signal_missing"
    | "eligible";
};

type PromotionCounterexampleClass =
  | "none"
  | "provenance_missing"
  | "strict_disabled"
  | "hard_constraint_regression"
  | "status_regression"
  | "strict_signal_gap";

const PROMOTION_COUNTEREXAMPLE_CLASS_BY_REASON: Record<PromotionDecision["reason"], PromotionCounterexampleClass> = {
  insufficient_provenance: "provenance_missing",
  strict_mode_disabled: "strict_disabled",
  hard_constraint_failed: "hard_constraint_regression",
  status_non_admissible: "status_regression",
  strict_signal_missing: "strict_signal_gap",
  eligible: "none",
};

const resolvePromotionCounterexampleClass = (
  reason: PromotionDecision["reason"],
): PromotionCounterexampleClass =>
  PROMOTION_COUNTEREXAMPLE_CLASS_BY_REASON[reason] ?? "status_regression";

const buildPromotionReplayPack = (args: {
  strictMode: boolean;
  decision: PromotionDecision;
  status: ViabilityStatus;
  hardConstraintPass: boolean;
  thetaMetricDerived: boolean;
  tsMetricDerived: boolean;
  qiMetricDerived: boolean;
  provenanceClass: ProvenanceClass;
}) => {
  const counterexampleClass = resolvePromotionCounterexampleClass(args.decision.reason);
  const deterministicKey = [
    `strict=${args.strictMode ? 1 : 0}`,
    `provenance=${args.provenanceClass}`,
    `hard=${args.hardConstraintPass ? 1 : 0}`,
    `status=${args.status}`,
    `theta=${args.thetaMetricDerived ? 1 : 0}`,
    `ts=${args.tsMetricDerived ? 1 : 0}`,
    `qi=${args.qiMetricDerived ? 1 : 0}`,
    `reason=${args.decision.reason}`,
    `tier=${args.decision.tier}`,
    `cx=${counterexampleClass}`,
  ].join("|");

  return {
    version: "promotion-replay-pack/v1",
    deterministic_key: deterministicKey,
    outcome: {
      tier: args.decision.tier,
      reason: args.decision.reason,
      status: args.status,
      conservative_downgrade: args.decision.tier !== "certified",
      counterexample_class: counterexampleClass,
    },
    inputs: {
      strict_mode: args.strictMode,
      hard_constraint_pass: args.hardConstraintPass,
      theta_metric_derived: args.thetaMetricDerived,
      ts_metric_derived: args.tsMetricDerived,
      qi_metric_derived: args.qiMetricDerived,
      provenance_class: args.provenanceClass,
    },
  };
};

const CONFIDENCE_BY_PROVENANCE: Record<ProvenanceClass, ConfidenceBand> = {
  measured: { low: 0.8, high: 0.99 },
  inferred: { low: 0.5, high: 0.79 },
  proxy: { low: 0.2, high: 0.49 },
};

const CLAIM_TIER_BY_PROVENANCE: Record<ProvenanceClass, ClaimTier> = {
  measured: "reduced-order",
  inferred: "diagnostic",
  proxy: "diagnostic",
};

const determineClaimTier = (
  provenanceClass: ProvenanceClass | undefined,
  strictMode: boolean,
  passed: boolean,
): ClaimTier => {
  if (!provenanceClass) return "diagnostic";
  if (provenanceClass === "measured" && strictMode && passed) return "certified";
  return CLAIM_TIER_BY_PROVENANCE[provenanceClass];
};

const resolvePromotionDecision = (args: {
  strictMode: boolean;
  warpMechanicsProvenanceClass: ProvenanceClass;
  hardConstraintPass: boolean;
  status: ViabilityStatus;
  thetaMetricDerived: boolean;
  tsMetricDerived: boolean;
  qiMetricDerived: boolean;
  qiApplicabilityStatus?: string;
}): PromotionDecision => {
  if (args.warpMechanicsProvenanceClass !== "measured") {
    return { tier: "diagnostic", reason: "insufficient_provenance" };
  }
  if (!args.strictMode) {
    return { tier: "reduced-order", reason: "strict_mode_disabled" };
  }
  if (!args.hardConstraintPass) {
    return { tier: "reduced-order", reason: "hard_constraint_failed" };
  }
  if (args.status !== "ADMISSIBLE") {
    return { tier: "reduced-order", reason: "status_non_admissible" };
  }
  if (!args.thetaMetricDerived || !args.tsMetricDerived || !args.qiMetricDerived) {
    return { tier: "reduced-order", reason: "strict_signal_missing" };
  }

  if (args.qiApplicabilityStatus == null || String(args.qiApplicabilityStatus).toUpperCase() !== "PASS") {
    return { tier: "reduced-order", reason: "strict_signal_missing" };
  }

  return { tier: "certified", reason: "eligible" };
};

const resolveProvenanceClass = (value: unknown): ProvenanceClass => {
  const source = typeof value === "string" ? value.toLowerCase() : "";
  if (!source) return "proxy";
  if (source.startsWith("warp.metric") || source.startsWith("gr.metric") || source.startsWith("gr.rho_constraint")) {
    return "measured";
  }
  if (source.includes("legacy") || source.includes("fallback")) {
    return "inferred";
  }
  return "proxy";
};

const constraint = (
  id: string,
  description: string,
  severity: ConstraintSeverity,
  passed: boolean,
  lhs?: number,
  rhs?: number,
  details?: string,
  note?: string,
  provenanceClass?: ProvenanceClass,
  confidenceBand?: ConfidenceBand,
  enforceProvenanceInStrict = false,
  strictMode = false,
  claimTier?: ClaimTier,
): ConstraintResult => {
  const provenanceMissing = enforceProvenanceInStrict && strictMode && provenanceClass == null;
  const strictProvenanceReason = provenanceMissing
    ? "strict_provenance_missing"
    : enforceProvenanceInStrict && strictMode && provenanceClass !== "measured"
      ? "strict_provenance_non_measured"
      : undefined;
  const effectivePassed = provenanceMissing ? false : passed;
  const effectiveNote = provenanceMissing
    ? strictProvenanceReason
    : !effectivePassed && strictProvenanceReason && !note
      ? strictProvenanceReason
      : note;
  const effectiveClaimTier = claimTier ?? determineClaimTier(provenanceClass, strictMode, effectivePassed);
  const margin = lhs !== undefined && rhs !== undefined ? lhs - rhs : undefined;
  return {
    id,
    description,
    severity,
    passed: effectivePassed,
    lhs,
    rhs,
    margin,
    details,
    note: effectiveNote,
    provenance_class: provenanceClass,
    claim_tier: effectiveClaimTier,
    confidence_band: confidenceBand,
    strict_provenance_reason: strictProvenanceReason,
  } as ConstraintResult;
};

function buildPipelineState(config: WarpConfig): EnergyPipelineState {
  const base = initializePipelineState();
  const radius = toNumber(config.bubbleRadius_m, base.shipRadius_m);
  const wall = config.wallThickness_m ?? base.hull?.wallThickness_m;
  const dutyCycle = clamp01(config.dutyCycle) ?? base.dutyCycle;

  const hull = {
    Lx_m: radius * 2,
    Ly_m: radius * 2,
    Lz_m: radius * 2,
    wallThickness_m: wall,
  };

  // Approximate tile area to honor an explicit tileCount request
  let tileArea_cm2 = base.tileArea_cm2;
  if (Number.isFinite(config.tileCount) && (config.tileCount as number) > 0) {
    const packing = PAPER_GEO.RADIAL_LAYERS * PAPER_GEO.PACKING;
    const sphereArea = 4 * Math.PI * Math.pow(radius, 2); // m^2
    const perTileArea_m2 = sphereArea / Math.max(1, (config.tileCount as number) / packing);
    tileArea_cm2 = Math.max(0.01, perTileArea_m2 / CM2_TO_M2);
  }

  const gammaGeo = toNumber(config.gammaGeoOverride, base.gammaGeo);

  return {
    ...base,
    hull,
    shipRadius_m: radius,
    dutyCycle,
    dutyShip: dutyCycle,
    tileArea_cm2,
    gammaGeo,
    ampFactors: {
      ...(base.ampFactors ?? {}),
      gammaGeo,
    },
  };
}

const extractDutyEffective = (state: EnergyPipelineState): number | undefined => {
  const dEff =
    (state as any).d_eff ??
    state.dutyEffective_FR ??
    (state as any).dutyEffectiveFR ??
    state.dutyShip ??
    state.dutyCycle;
  return typeof dEff === "number" && Number.isFinite(dEff) ? dEff : undefined;
};

const buildGrGuardrails = (
  pipeline: EnergyPipelineState,
  liveSnapshot?: PipelineSnapshot,
): WarpSolverGuardrails => {
  const gr = (liveSnapshot as any)?.gr ?? (pipeline as any)?.gr;
  const H_rms = toFinite(gr?.constraints?.H_constraint?.rms);
  const H_maxAbs = toFinite(gr?.constraints?.H_constraint?.maxAbs);
  const M_rms = toFinite(gr?.constraints?.M_constraint?.rms);
  const M_maxAbs = toFinite(gr?.constraints?.M_constraint?.maxAbs);
  const lapseMin = toFinite(gr?.gauge?.lapseMin);
  const betaMaxAbs = toFinite(gr?.gauge?.betaMaxAbs);

  const missing: string[] = [];
  if (!Number.isFinite(H_rms)) missing.push("H_constraint_rms");
  if (!Number.isFinite(M_rms)) missing.push("M_constraint_rms");
  if (!Number.isFinite(lapseMin)) missing.push("lapse_floor");
  if (!Number.isFinite(betaMaxAbs)) missing.push("beta_max_abs");

  return {
    source: gr ? "pipeline-gr" : "proxy",
    proxy: missing.length > 0,
    ...(missing.length ? { missing } : {}),
    H_constraint: {
      rms: H_rms,
      maxAbs: H_maxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.H_rms,
      exceeded: Number.isFinite(H_rms)
        ? (H_rms as number) > GR_GUARDRAIL_THRESHOLDS.H_rms
        : undefined,
    },
    M_constraint: {
      rms: M_rms,
      maxAbs: M_maxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.M_rms,
      exceeded: Number.isFinite(M_rms)
        ? (M_rms as number) > GR_GUARDRAIL_THRESHOLDS.M_rms
        : undefined,
    },
    lapse: {
      floor: lapseMin,
      threshold: GR_GUARDRAIL_THRESHOLDS.lapseFloor,
      exceeded: Number.isFinite(lapseMin)
        ? (lapseMin as number) < GR_GUARDRAIL_THRESHOLDS.lapseFloor
        : undefined,
    },
    beta: {
      maxAbs: betaMaxAbs,
      threshold: GR_GUARDRAIL_THRESHOLDS.betaMaxAbs,
      exceeded: Number.isFinite(betaMaxAbs)
        ? (betaMaxAbs as number) > GR_GUARDRAIL_THRESHOLDS.betaMaxAbs
        : undefined,
    },
  };
};

type EvaluateOpts = {
  snapshot?: PipelineSnapshot;
  telemetrySource?: string;
  telemetryHeaders?: Record<string, string | number | undefined>;
};

export async function evaluateWarpViability(
  config: WarpConfig,
  opts: EvaluateOpts = {},
): Promise<ViabilityResult> {
  const liveSnapshot = opts.snapshot;
  const agentsConfig = await loadWarpAgentsConfig().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load WARP_AGENTS.md: ${message}`);
  });

  const applySpec = (
    id: string,
    fallback: { severity: ConstraintSeverity; description: string },
  ): { severity: ConstraintSeverity; description: string } => {
    const spec = findWarpConstraint(agentsConfig, id);
    return {
      severity: resolveConstraintSeverity(agentsConfig, id, fallback.severity),
      description: spec?.description ?? fallback.description,
    };
  };

  const pipelineState = buildPipelineState(config);
  if (liveSnapshot?.gr && typeof liveSnapshot.gr === "object") {
    (pipelineState as any).grEnabled = true;
    (pipelineState as any).gr = liveSnapshot.gr;
  }
  let pipeline = await calculateEnergyPipeline(pipelineState);

  const dutyEffective = extractDutyEffective(pipeline);
  const gammaGeoCubed = Math.pow(pipeline.gammaGeo ?? 0, 3);
  const gammaVdB = (pipeline as any).gammaVanDenBroeck_mass ?? pipeline.gammaVanDenBroeck;
  const vdbRegionII = (pipeline as any).vdbRegionII;
  const vdbRegionIV = (pipeline as any).vdbRegionIV;
  const vdbRegionIISupport =
    typeof vdbRegionII?.support === "boolean" ? vdbRegionII.support : undefined;
  const vdbRegionIVSupport =
    typeof vdbRegionIV?.support === "boolean" ? vdbRegionIV.support : undefined;
  const vdbTwoWallSupport =
    vdbRegionIISupport === true && vdbRegionIVSupport === true
      ? true
      : vdbRegionIISupport === false || vdbRegionIVSupport === false
        ? false
        : undefined;
  const vdbBprimeMaxAbs = resolveVdbDerivativeMaxAbs(vdbRegionII, "bprime_min", "bprime_max");
  const vdbBdoubleMaxAbs = resolveVdbDerivativeMaxAbs(
    vdbRegionII,
    "bdouble_min",
    "bdouble_max",
  );
  const vdbRegionIIT00Mean = toFinite(vdbRegionII?.t00_mean);
  const vdbRegionIVDfdrMaxAbs = toFinite(vdbRegionIV?.dfdr_max_abs);
  const vdbRegionIIDerivativeSupport = hasVdbRegionIIMetricSupport(vdbRegionII);
  const vdbRegionIVDerivativeSupport =
    vdbRegionIVSupport === true &&
    vdbRegionIVDfdrMaxAbs != null &&
    Math.abs(vdbRegionIVDfdrMaxAbs) > VDB_DFDR_MIN_ABS;
  const vdbTwoWallDerivativeSupport =
    vdbRegionIIDerivativeSupport && vdbRegionIVDerivativeSupport;
  const qiGuard = (liveSnapshot?.qiGuardrail as any) ?? (pipeline as any).qiGuardrail;
  const qiProvenanceClass = resolveProvenanceClass(qiGuard?.rhoSource);
  const qiConfidenceBand = CONFIDENCE_BY_PROVENANCE[qiProvenanceClass];
  const modeConfig = MODE_CONFIGS[pipeline.currentMode] as { zeta_max?: number } | undefined;
  const zetaMax = modeConfig?.zeta_max ?? 1;
  const strictCongruence = strictCongruenceEnabled();
  const tsMetricDerived = (pipeline as any).tsMetricDerived === true;
  const tsMetricSource =
    typeof (pipeline as any).tsMetricDerivedSource === "string" &&
    (pipeline as any).tsMetricDerivedSource.length > 0
      ? String((pipeline as any).tsMetricDerivedSource)
      : undefined;
  const tsMetricReason =
    typeof (pipeline as any).tsMetricDerivedReason === "string" &&
    (pipeline as any).tsMetricDerivedReason.length > 0
      ? String((pipeline as any).tsMetricDerivedReason)
      : undefined;
  const tsProvenanceClass: ProvenanceClass = tsMetricDerived ? "measured" : "proxy";
  const tsConfidenceBand = CONFIDENCE_BY_PROVENANCE[tsProvenanceClass];
  const betaDiagnostics = (pipeline as any).warp?.metricAdapter?.betaDiagnostics;
  const thetaGeom = toFinite(betaDiagnostics?.thetaMax ?? betaDiagnostics?.thetaRms);
  const thetaGeomProxy = betaDiagnostics?.method === "not-computed";
  const thetaMetricDerived = thetaGeom != null && !thetaGeomProxy;
  const thetaProxySource =
    (pipeline as any).thetaCal != null
      ? "pipeline.thetaCal"
      : (pipeline as any).thetaScaleExpected != null
        ? "pipeline.thetaScaleExpected"
        : undefined;
  const thetaProxy = toFinite(
    (pipeline as any).thetaCal ?? (pipeline as any).thetaScaleExpected,
  );
  const thetaGeomSource =
    thetaGeom != null
      ? `warp.metricAdapter.betaDiagnostics.${
          betaDiagnostics?.thetaMax != null ? "thetaMax" : "thetaRms"
        }`
      : undefined;
  const thetaMetricReason = thetaMetricDerived
    ? "metric_adapter_divergence"
    : thetaGeom == null
      ? "missing_theta_geom"
      : "theta_geom_proxy";
  const thetaProvenanceClass: ProvenanceClass = thetaMetricDerived ? "measured" : "proxy";
  const thetaConfidenceBand = CONFIDENCE_BY_PROVENANCE[thetaProvenanceClass];
  const theta = thetaMetricDerived ? thetaGeom : thetaProxy;
  const thetaSource = thetaMetricDerived ? thetaGeomSource : thetaProxySource;
  const mTarget = pipeline.exoticMassTarget_kg ?? pipelineState.exoticMassTarget_kg;
  const T00Value =
    (pipeline as any).warp?.stressEnergyTensor?.T00 ??
    (pipeline as any).stressEnergy?.T00 ??
    (pipeline as any).T00_avg;
  const rebuildTsTelemetry = (pipe: any, override?: PipelineSnapshot) => {
    const lc = pipe?.lightCrossing ?? {};
    const liveTs = override?.ts;
    const tauLC_ms_val = Number.isFinite(lc.tauLC_ms)
      ? Number(lc.tauLC_ms)
      : Number.isFinite(pipe?.tauLC_ms)
      ? Number(pipe.tauLC_ms)
      : Number.isFinite(liveTs?.tauLC_ms)
      ? Number(liveTs?.tauLC_ms)
      : undefined;
    const tauPulse_ms_val = Number.isFinite(lc.burst_ms)
      ? Number(lc.burst_ms)
      : Number.isFinite(pipe?.burst_ms)
      ? Number(pipe.burst_ms)
      : Number.isFinite(liveTs?.tauPulse_ns)
      ? Number(liveTs?.tauPulse_ns) / 1e6
      : undefined;
    const tauPulse_ns_val =
      Number.isFinite(tauPulse_ms_val) && tauPulse_ms_val !== undefined
        ? tauPulse_ms_val * 1e6
      : undefined;
    const baseTelemetry = (pipe as any)?.ts ?? {};
    const telemetry = {
      ...baseTelemetry,
      TS_ratio: liveTs?.ratio ?? baseTelemetry?.TS_ratio ?? (pipe as any)?.TS_ratio,
      tauLC_ms: liveTs?.tauLC_ms ?? baseTelemetry?.tauLC_ms ?? tauLC_ms_val,
      tauPulse_ns: liveTs?.tauPulse_ns ?? baseTelemetry?.tauPulse_ns ?? tauPulse_ns_val,
      autoscale: liveTs?.autoscale ?? baseTelemetry?.autoscale ?? (pipe as any)?.tsAutoscale,
    };
    return { telemetry, lc, tauLC_ms: tauLC_ms_val, tauPulse_ms: tauPulse_ms_val };
  };

  const deriveTsParts = (pipe: any, override?: PipelineSnapshot) => {
    const { telemetry, lc, tauLC_ms, tauPulse_ms } = rebuildTsTelemetry(pipe, override);
    const tauLC_s =
      Number.isFinite(telemetry?.tauLC_ms) && (telemetry as any).tauLC_ms > 0
        ? ((telemetry as any).tauLC_ms as number) / 1000
        : Number.isFinite(tauLC_ms) && (tauLC_ms as number) > 0
        ? (tauLC_ms as number) / 1000
        : undefined;
    const tauPulse_s =
      Number.isFinite(telemetry?.tauPulse_ns) && (telemetry as any).tauPulse_ns > 0
      ? ((telemetry as any).tauPulse_ns as number) / 1e9
        : Number.isFinite(tauPulse_ms) && (tauPulse_ms as number) > 0
        ? (tauPulse_ms as number) / 1000
        : undefined;
    const tauLC_ns =
      Number.isFinite((lc as any)?.tauLC_ns) && (lc as any).tauLC_ns > 0
        ? Number((lc as any).tauLC_ns)
        : Number.isFinite(tauLC_ms) && (tauLC_ms as number) > 0
        ? (tauLC_ms as number) * 1e6
        : undefined;
    const tsAutoscale = liveSnapshot?.ts?.autoscale ?? (pipe as any).tsAutoscale ?? (telemetry as any).autoscale;
    const appliedBurst_ns =
      Number.isFinite((tsAutoscale as any)?.appliedBurst_ns) && (tsAutoscale as any).appliedBurst_ns > 0
        ? Number((tsAutoscale as any).appliedBurst_ns)
        : undefined;
    const tsFromRatio = Number.isFinite((telemetry as any)?.TS_ratio)
      ? Number((telemetry as any).TS_ratio)
      : undefined;
    const tsFromTimes =
      Number.isFinite(tauLC_s) && Number.isFinite(tauPulse_s) && (tauPulse_s as number) > 0
        ? (tauLC_s as number) / (tauPulse_s as number)
        : undefined;
    const tsFromApplied =
      Number.isFinite(tauLC_ns) && Number.isFinite(appliedBurst_ns) && (appliedBurst_ns as number) > 0
        ? (tauLC_ns as number) / (appliedBurst_ns as number)
        : undefined;

    const tsOverride = Number.isFinite(liveSnapshot?.ts?.ratio) ? Number(liveSnapshot?.ts?.ratio) : undefined;
    const tsValue = tsOverride ?? tsFromRatio ?? tsFromTimes ?? pipeline.TS_ratio;

    return {
      telemetry,
      lc,
      tauLC_ms,
      tauPulse_ms,
      tauLC_s,
      tauPulse_s,
      tsFromRatio,
      tsFromTimes,
      tsFromApplied,
      tsValue,
      tsAutoscale,
    };
  };

  let tsParts = deriveTsParts(pipeline, liveSnapshot);
  let tsAutoscale = tsParts.tsAutoscale;
  const tsAutoscaleEngagedInitial = Boolean((tsAutoscale as any)?.engaged);
  const tsAutoscaleGatingInitial = (tsAutoscale as any)?.gating ?? "idle";
  const settleWaitMs = Math.max(
    Number.isFinite((pipeline as any).sectorPeriod_ms) ? Number((pipeline as any).sectorPeriod_ms) : 0,
    100,
  );
  let resampleCount = 0;
  while (tsAutoscaleEngagedInitial && (tsAutoscale as any)?.gating === "active" && resampleCount < 2) {
    await sleep(settleWaitMs);
    pipeline = await calculateEnergyPipeline(pipeline);
    tsParts = deriveTsParts(pipeline, liveSnapshot);
    tsAutoscale = tsParts.tsAutoscale;
    resampleCount += 1;
    if ((tsAutoscale as any)?.gating !== "active") break;
  }
  const tsAutoscaleEngaged = Boolean((tsAutoscale as any)?.engaged);
  const tsAutoscaleGating = (tsAutoscale as any)?.gating ?? "idle";
  const tsResolved =
    tsAutoscaleGating === "active"
      ? tsParts.tsFromRatio ?? tsParts.tsFromApplied ?? tsParts.tsFromTimes ?? pipeline.TS_ratio
      : tsParts.tsFromRatio ?? tsParts.tsFromTimes ?? tsParts.tsFromApplied ?? pipeline.TS_ratio;
  const tsOverride = Number.isFinite(liveSnapshot?.ts?.ratio) ? Number(liveSnapshot?.ts?.ratio) : undefined;
  const TS = Number.isFinite(tsOverride)
    ? (tsOverride as number)
    : Number.isFinite(tsResolved)
    ? (tsResolved as number)
    : pipeline.TS_ratio;
  const tsAutoscaleResampled =
    tsAutoscaleEngagedInitial && tsAutoscaleGatingInitial === "active" && resampleCount > 0;
  const tsTelemetry = tsParts.telemetry;
  const lightCrossing = tsParts.lc ?? {};
  const tauPulse_ms = tsParts.tauPulse_ms;
  const grGuardrails = buildGrGuardrails(pipeline, liveSnapshot);
  const gr = (liveSnapshot as any)?.gr ?? (pipeline as any)?.gr;
  const metricConstraint = (pipeline as any)?.metricConstraint?.rho_constraint;
  const rhoConstraintMean = toFinite(
    gr?.constraints?.rho_constraint?.mean ?? metricConstraint?.mean,
  );
  const matterAvgT00 = toFinite(gr?.matter?.stressEnergy?.avgT00);
  const pipelineRhoAvg = toFinite(pipeline.rho_avg ?? (pipeline as any).rho_avg);
  const pipelineRhoAvgGeom =
    pipelineRhoAvg == null ? undefined : pipelineRhoAvg * SI_TO_GEOM_STRESS;
  const metricT00Ref = resolveMetricT00GeomFromPipeline(pipeline);
  const warpMetricT00Geom = metricT00Ref.value;
  const warpMetricSource = metricT00Ref.source;
  const warpMetricChart = metricT00Ref.chart;
  const warpMetricFamily = metricT00Ref.family;
  const warpMetricObserver = metricT00Ref.observer;
  const warpMetricNormalization = metricT00Ref.normalization;
  const warpMetricUnitSystem = metricT00Ref.unitSystem;
  const warpMetricContractStatus = metricT00Ref.contractStatus;
  const warpMetricContractReason = metricT00Ref.contractReason;
  const warpMetricContractOk = metricT00Ref.contractOk === true;
  const warpMetricT00SiObserved =
    toFinite((pipeline as any)?.warp?.metricT00) ?? toFinite(qiGuard?.effectiveRho);
  const warpMetricT00GeomDirect = warpMetricT00Geom;
  const warpMetricT00GeomForAudit =
    warpMetricT00GeomDirect != null
      ? warpMetricT00GeomDirect
      : warpMetricT00SiObserved != null
      ? warpMetricT00SiObserved * SI_TO_GEOM_STRESS
      : undefined;
  const warpMetricT00GeomSource =
    warpMetricT00GeomDirect != null
      ? "direct_metric_pipeline"
      : warpMetricT00SiObserved != null
      ? "derived_from_si"
      : undefined;
  const warpMetricT00SiFromGeom =
    warpMetricT00GeomDirect != null ? warpMetricT00GeomDirect / SI_TO_GEOM_STRESS : undefined;
  const warpMetricT00SiRelError =
    warpMetricT00SiObserved != null && warpMetricT00SiFromGeom != null
      ? relDelta(warpMetricT00SiObserved, warpMetricT00SiFromGeom)
      : undefined;
  const thetaChartContractStatus =
    typeof (pipeline as any)?.warp?.metricAdapter?.chart?.contractStatus === "string"
      ? String((pipeline as any).warp.metricAdapter.chart.contractStatus)
      : "unknown";
  const thetaContractPass = thetaChartContractStatus === "ok";
  const cl3DeltaMatter =
    rhoConstraintMean != null && matterAvgT00 != null
      ? relDelta(rhoConstraintMean, matterAvgT00)
      : undefined;
  const cl3DeltaMetric =
    rhoConstraintMean != null && warpMetricT00Geom != null
      ? relDelta(rhoConstraintMean, warpMetricT00Geom)
      : undefined;
  const cl3DeltaPipeline =
    rhoConstraintMean != null && pipelineRhoAvgGeom != null
      ? relDelta(rhoConstraintMean, pipelineRhoAvgGeom)
      : undefined;
  const cl3Delta = cl3DeltaMetric;
  const cl3Source = cl3DeltaMetric != null ? warpMetricSource : undefined;
  const cl3MissingParts: string[] = [];
  if (rhoConstraintMean == null) cl3MissingParts.push("missing_rho_constraint");
  if (warpMetricT00Geom == null || !warpMetricSource) cl3MissingParts.push("missing_metric_t00");
  if (
    strictCongruence &&
    warpMetricT00Geom != null &&
    !warpMetricContractOk
  ) {
    cl3MissingParts.push("missing_metric_contract");
  }
  const cl3MissingReason = cl3MissingParts.join(",");
  const cl3MissingNote =
    cl3MissingParts.includes("missing_metric_t00")
      ? "metric_source_missing"
      : cl3MissingParts.includes("missing_metric_contract")
        ? "metric_contract_missing"
      : cl3MissingParts.includes("missing_rho_constraint")
        ? "constraint_rho_missing"
        : undefined;

  const warpMechanicsProvenanceClass: ProvenanceClass =
    thetaProvenanceClass === "measured" &&
    qiProvenanceClass === "measured" &&
    tsProvenanceClass === "measured"
      ? "measured"
      : thetaProvenanceClass === "inferred" ||
          qiProvenanceClass === "inferred" ||
          tsProvenanceClass === "inferred"
        ? "inferred"
        : "proxy";
  const promotionDecision = resolvePromotionDecision({
    strictMode: strictCongruence,
    warpMechanicsProvenanceClass,
    hardConstraintPass: false,
    status: "INADMISSIBLE",
    thetaMetricDerived,
    tsMetricDerived,
    qiMetricDerived: qiSourceIsMetric(qiGuard?.rhoSource),
    qiApplicabilityStatus: qiGuard?.applicabilityStatus,
  });
  const warpMechanicsClaimTier = promotionDecision.tier;

  const snapshot: WarpViabilitySnapshot = {
    bubbleRadius_m: config.bubbleRadius_m ?? pipeline.shipRadius_m,
    wallThickness_m: config.wallThickness_m ?? pipeline.hull?.wallThickness_m,
    targetVelocity_c: config.targetVelocity_c,
    tileCount: pipeline.N_tiles,
    tileArea_cm2: pipeline.tileArea_cm2,
    dutyCycle: pipeline.dutyCycle,
    d_eff: dutyEffective,
    U_static: pipeline.U_static,
    TS_ratio: Number.isFinite(TS) ? TS : pipeline.TS_ratio,
    gamma_geo_cubed: gammaGeoCubed,
    gamma_VdB: gammaVdB,
    vdb_region_ii_support: vdbRegionIISupport,
    vdb_region_ii_bprime_max_abs: vdbBprimeMaxAbs,
    vdb_region_ii_bdouble_max_abs: vdbBdoubleMaxAbs,
    vdb_region_ii_t00_mean: vdbRegionIIT00Mean,
    vdb_region_iv_support: vdbRegionIVSupport,
    vdb_region_iv_dfdr_max_abs: vdbRegionIVDfdrMaxAbs,
    vdb_two_wall_support: vdbTwoWallSupport,
    vdb_region_ii_derivative_support: vdbRegionIIDerivativeSupport,
    vdb_region_iv_derivative_support: vdbRegionIVDerivativeSupport,
    vdb_two_wall_derivative_support: vdbTwoWallDerivativeSupport,
    gammaGeo: pipeline.gammaGeo,
    M_exotic: pipeline.M_exotic,
    thetaCal: thetaProxy,
    theta_audit: theta,
    theta_geom: thetaGeom,
    theta_proxy: thetaProxy,
    theta_source: thetaSource,
    theta_proxy_source: thetaProxySource,
    theta_metric_derived: thetaMetricDerived,
    theta_metric_source: thetaMetricDerived ? thetaGeomSource : undefined,
    theta_metric_reason: thetaMetricReason,
    theta_provenance_class: thetaProvenanceClass,
    theta_confidence_band: thetaConfidenceBand,
    zeta: (pipeline as any).zeta,
    zetaRaw: (pipeline as any).zetaRaw,
    qiGuardrail: qiGuard?.marginRatio,
    qi_applicability_status: qiGuard?.applicabilityStatus,
    qi_lhs_Jm3: finiteOrUndefined(qiGuard?.lhs_Jm3),
    qi_bound_Jm3: finiteOrUndefined(qiGuard?.bound_Jm3),
    qi_bound_computed_Jm3: finiteOrUndefined(qiGuard?.boundComputed_Jm3),
    qi_bound_floor_Jm3: finiteOrUndefined(qiGuard?.boundFloor_Jm3),
    qi_bound_policy_floor_Jm3: finiteOrUndefined(qiGuard?.boundPolicyFloor_Jm3),
    qi_bound_env_floor_Jm3: finiteOrUndefined(qiGuard?.boundEnvFloor_Jm3),
    qi_bound_default_floor_Jm3: finiteOrUndefined(qiGuard?.boundDefaultFloor_Jm3),
    qi_bound_fallback_abs_Jm3: finiteOrUndefined(qiGuard?.boundFallbackAbs_Jm3),
    qi_bound_used_Jm3: finiteOrUndefined(qiGuard?.boundUsed_Jm3),
    qi_bound_floor_applied: qiGuard?.boundFloorApplied === true,
    qi_margin_ratio: finiteOrUndefined(qiGuard?.marginRatio),
    qi_margin_ratio_raw: finiteOrUndefined(qiGuard?.marginRatioRaw),
    qi_margin_ratio_raw_computed: finiteOrUndefined((qiGuard as any)?.marginRatioRawComputed),
    qi_rho_source: qiGuard?.rhoSource,
    qi_metric_t00_ref:
      warpMetricSource ??
      (typeof qiGuard?.rhoSource === "string" && qiGuard.rhoSource.length > 0 ? qiGuard.rhoSource : undefined),
    qi_metric_t00_geom: finiteOrUndefined(warpMetricT00GeomForAudit),
    qi_metric_t00_geom_source: warpMetricT00GeomSource,
    qi_metric_t00_si: finiteOrUndefined(warpMetricT00SiObserved),
    qi_metric_t00_si_from_geom: finiteOrUndefined(warpMetricT00SiFromGeom),
    qi_metric_t00_si_rel_error: finiteOrUndefined(warpMetricT00SiRelError),
    qi_metric_contract_status:
      qiGuard?.metricContractOk == null ? undefined : qiGuard.metricContractOk ? "ok" : "missing",
    qi_curvature_ok: qiGuard?.curvatureOk,
    qi_curvature_ratio: finiteOrUndefined(qiGuard?.curvatureRatio),
    qi_curvature_enforced: qiGuard?.curvatureEnforced,
    qi_bound_tau_s:
      Number.isFinite((pipeline as any).qi?.tau_s_ms) && Number((pipeline as any).qi?.tau_s_ms) > 0
        ? Number((pipeline as any).qi?.tau_s_ms) / 1000
        : undefined,
    qi_bound_K: finiteOrUndefined(qiGuard?.K),
    qi_bound_K_null_reason:
      typeof qiGuard?.KNullReason === "string" && qiGuard.KNullReason.length > 0
        ? qiGuard.KNullReason
        : undefined,
    qi_safetySigma_Jm3: finiteOrUndefined(qiGuard?.safetySigma_Jm3),
    qi_safetySigma_null_reason:
      typeof qiGuard?.safetySigmaNullReason === "string" && qiGuard.safetySigmaNullReason.length > 0
        ? qiGuard.safetySigmaNullReason
        : undefined,
    qi_provenance_class: qiProvenanceClass,
    qi_confidence_band: qiConfidenceBand,
    warp_mechanics_provenance_class: warpMechanicsProvenanceClass,
    warp_mechanics_claim_tier: warpMechanicsClaimTier,
    warp_mechanics_promotion_reason: promotionDecision.reason,
    T00_min: (pipeline as any).T00_min ?? T00Value,
    T00_avg: T00Value,
    sectorPeriod_ms: pipeline.sectorPeriod_ms,
    dwell_ms: Number.isFinite(lightCrossing.dwell_ms) ? Number(lightCrossing.dwell_ms) : undefined,
    burst_ms: Number.isFinite(tauPulse_ms) ? Number(tauPulse_ms) : undefined,
    ts: tsTelemetry,
    ts_metric_derived: tsMetricDerived,
    ts_metric_source: tsMetricSource,
    ts_metric_reason: tsMetricReason,
    ts_provenance_class: tsProvenanceClass,
    ts_confidence_band: tsConfidenceBand,
    grGuardrails,
    rho_constraint_mean: rhoConstraintMean,
    rho_delta_mean: cl3Delta,
    rho_delta_metric_mean: cl3DeltaMetric,
    rho_delta_pipeline_mean: cl3DeltaPipeline,
    rho_delta_threshold: cl3Delta != null ? DEFAULT_CL3_RHO_DELTA_MAX : undefined,
    rho_delta_source: cl3Source ?? (strictCongruence ? "metric-missing" : undefined),
    rho_delta_metric_source: warpMetricT00Geom != null ? warpMetricSource : undefined,
    rho_delta_metric_chart: warpMetricT00Geom != null ? warpMetricChart : undefined,
    rho_delta_metric_family: warpMetricT00Geom != null ? warpMetricFamily : undefined,
    rho_delta_metric_observer: warpMetricT00Geom != null ? warpMetricObserver : undefined,
    rho_delta_metric_normalization:
      warpMetricT00Geom != null ? warpMetricNormalization : undefined,
    rho_delta_metric_unit_system: warpMetricT00Geom != null ? warpMetricUnitSystem : undefined,
    rho_delta_metric_contract_status:
      warpMetricT00Geom != null ? warpMetricContractStatus : undefined,
    rho_delta_metric_contract_reason:
      warpMetricT00Geom != null ? warpMetricContractReason : undefined,
    rho_delta_metric_contract_ok:
      warpMetricT00Geom != null ? warpMetricContractOk : undefined,
    theta_chart_contract_status: thetaChartContractStatus,
    theta_chart_contract_ok: thetaContractPass,
    telemetrySource: liveSnapshot ? opts.telemetrySource ?? "pipeline-live" : opts.telemetrySource ?? "solver",
    pipelineHeaders: opts.telemetryHeaders,
  };

  const results: ConstraintResult[] = [];

  // Fordâ€“Roman / QI guardrail
  if (qiGuard && Number.isFinite(qiGuard.marginRatio)) {
    const meta = applySpec("FordRomanQI", {
      severity: "HARD",
      description: "Quantum inequality (Fordâ€“Roman) margin < 1.0",
    });
    const curvatureOk = qiGuard.curvatureOk;
    const curvatureEnforced = qiGuard.curvatureEnforced === true;
    const curvaturePass = !curvatureEnforced || curvatureOk !== false;
    const metricRhoSource = qiSourceIsMetric(qiGuard.rhoSource);
    const qiSourceRaw =
      typeof qiGuard.rhoSource === "string" ? String(qiGuard.rhoSource).toLowerCase() : "";
    const qiConstraintSource = qiSourceRaw.startsWith("gr.rho_constraint");
    const contractPass = qiConstraintSource || warpMetricContractOk;
    const sourcePass = !strictCongruence || (metricRhoSource && contractPass);
    const passed = qiGuard.marginRatio < 1 && curvaturePass && sourcePass;
    const applicabilityStatus = String(qiGuard.applicabilityStatus ?? "UNKNOWN").toUpperCase();
    const g4ReasonCodes: string[] = [];
    if (!metricRhoSource) g4ReasonCodes.push(G4_QI_REASON_CODES.sourceNotMetric);
    if (metricRhoSource && !contractPass) g4ReasonCodes.push(G4_QI_REASON_CODES.contractMissing);
    if (curvatureOk === false) g4ReasonCodes.push(G4_QI_REASON_CODES.curvatureWindowFail);
    if (applicabilityStatus !== "PASS") g4ReasonCodes.push(G4_QI_REASON_CODES.applicabilityNotPass);
    if (qiGuard.marginRatio >= 1) g4ReasonCodes.push(G4_QI_REASON_CODES.marginExceeded);
    if (qiGuard.applicabilityReasonCode === G4_QI_REASON_CODES.signalMissing) {
      g4ReasonCodes.push(G4_QI_REASON_CODES.signalMissing);
    }
    if (qiGuard.applicabilityReasonCode === G4_QI_REASON_CODES.curvatureWindowFail) {
      g4ReasonCodes.push(G4_QI_REASON_CODES.curvatureWindowFail);
    }
    const orderedReasonCodes = orderG4ReasonCodes(g4ReasonCodes);
    const curvatureDetail =
      curvatureOk === undefined
        ? "curvature=unknown"
        : `curvature_ok=${curvatureOk}`;
    const ratioDetail =
      qiGuard.curvatureRatio != null
        ? `curvature_ratio=${qiGuard.curvatureRatio}`
        : undefined;
    const curvatureNote = [
      curvatureDetail,
      ratioDetail,
      `rho_source=${qiGuard.rhoSource ?? "unknown"}`,
      strictCongruence ? `metric_source=${metricRhoSource}` : null,
      strictCongruence ? `metric_contract=${contractPass}` : null,
      strictCongruence ? `metric_contract_status=${warpMetricContractStatus ?? "unknown"}` : null,
      curvatureEnforced ? "curvature_enforced" : null,
    ]
      .filter(Boolean)
      .join("; ");
    results.push(
      constraint(
        "FordRomanQI",
        meta.description,
        meta.severity,
        passed,
        qiGuard.marginRatio,
        1,
        [
          orderedReasonCodes.map((code) => `reasonCode=${code}`).join(";"),
          `lhs_Jm3=${qiGuard.lhs_Jm3 ?? "n/a"}`,
          `bound_Jm3=${qiGuard.bound_Jm3 ?? "n/a"}`,
          `boundComputed_Jm3=${qiGuard.boundComputed_Jm3 ?? "n/a"}`,
          `boundFloor_Jm3=${qiGuard.boundFloor_Jm3 ?? "n/a"}`,
          `boundPolicyFloor_Jm3=${qiGuard.boundPolicyFloor_Jm3 ?? "n/a"}`,
          `boundEnvFloor_Jm3=${qiGuard.boundEnvFloor_Jm3 ?? "n/a"}`,
          `boundDefaultFloor_Jm3=${qiGuard.boundDefaultFloor_Jm3 ?? "n/a"}`,
          `boundFallbackAbs_Jm3=${qiGuard.boundFallbackAbs_Jm3 ?? "n/a"}`,
          `boundUsed_Jm3=${qiGuard.boundUsed_Jm3 ?? "n/a"}`,
          `boundFloorApplied=${qiGuard.boundFloorApplied === true}`,
          `marginRatio=${qiGuard.marginRatio ?? "n/a"}`,
          `marginRatioRaw=${qiGuard.marginRatioRaw ?? "n/a"}`,
          `marginRatioRawComputed=${(qiGuard as any).marginRatioRawComputed ?? "n/a"}`,
          `rhoSource=${qiGuard.rhoSource ?? "unknown"}`,
          `metricT00Ref=${warpMetricSource ?? "n/a"}`,
          `metricT00Geom=${warpMetricT00GeomForAudit ?? "n/a"}`,
          `metricT00GeomSource=${warpMetricT00GeomSource ?? "n/a"}`,
          `metricT00Si=${warpMetricT00SiObserved ?? "n/a"}`,
          `metricT00SiFromGeom=${warpMetricT00SiFromGeom ?? "n/a"}`,
          `metricT00SiRelError=${warpMetricT00SiRelError ?? "n/a"}`,
          `metricContractStatus=${contractPass ? "ok" : "missing"}`,
          `applicabilityStatus=${applicabilityStatus}`,
          `applicabilityReasonCode=${qiGuard.applicabilityReasonCode ?? "none"}`,
          `curvatureOk=${qiGuard.curvatureOk ?? "unknown"}`,
          `curvatureRatio=${qiGuard.curvatureRatio ?? "n/a"}`,
          `curvatureEnforced=${curvatureEnforced}`,
          `tau_s=${Number.isFinite((pipeline as any).qi?.tau_s_ms) ? Number((pipeline as any).qi?.tau_s_ms) / 1000 : "n/a"}`,
          `K=${qiGuard.K ?? "n/a"}`,
          `KNullReason=${qiGuard.KNullReason ?? "none"}`,
          `safetySigma_Jm3=${qiGuard.safetySigma_Jm3 ?? "n/a"}`,
          `safetySigmaNullReason=${qiGuard.safetySigmaNullReason ?? "none"}`,
          curvatureNote,
        ].join("; "),
        !sourcePass
          ? !metricRhoSource
            ? "proxy_input"
            : "contract_missing"
          : curvatureOk === false
            ? "curvature_window"
            : undefined,
        qiProvenanceClass,
        qiConfidenceBand,
        true,
        strictCongruence,
      ),
    );
  } else if (pipeline.fordRomanCompliance !== undefined) {
    const meta = applySpec("FordRomanQI", {
      severity: "HARD",
      description: "Quantum inequality (Fordâ€“Roman) margin < 1.0",
    });
    const sourcePass = !strictCongruence;
    const passed = Boolean(pipeline.fordRomanCompliance) && sourcePass;
    results.push(
      constraint(
        "FordRomanQI",
        meta.description,
        meta.severity,
        passed,
        (pipeline as any).zeta,
        zetaMax,
        `strict=${strictCongruence}; source=${sourcePass ? "legacy_boolean" : "proxy_fallback_blocked"}`,
        !sourcePass ? "proxy_input" : undefined,
        "inferred",
        CONFIDENCE_BY_PROVENANCE.inferred,
        true,
        strictCongruence,
      ),
    );
  }

  // TS ratio ladder
  const tsValue = Number(TS);
  if (Number.isFinite(tsValue)) {
    const meta = applySpec("TS_ratio_min", {
      severity: "SOFT",
      description: "Canonical minimum TS_ratio gate for operational timing proxy semantics",
    });
    const tsDetail = `TS_ratio=${tsValue} required>=${DEFAULT_TS_MIN}`;
    const idleJitterPass = tsAutoscaleGating === "idle" && tsValue >= TS_IDLE_JITTER_MIN;
    const tsBandPass = tsValue >= DEFAULT_TS_MIN || idleJitterPass;
    const sourcePass = !strictCongruence || tsMetricDerived;
    const passed = tsBandPass && sourcePass;
    const noteParts = [];
    if (tsAutoscaleEngaged && tsValue < DEFAULT_TS_MIN) noteParts.push("mitigation:ts_autoscale");
    else if (tsAutoscaleEngaged) noteParts.push("TS_autoscale_active");
    if (idleJitterPass) noteParts.push("idle_jitter_buffer");
    const note = !sourcePass
      ? "proxy_input"
      : noteParts.length
        ? noteParts.join(";")
        : undefined;
    const strictSourceDetail = `strict=${strictCongruence}; metric_source=${sourcePass}; ts_source=${tsMetricSource ?? "unknown"}; ts_reason=${tsMetricReason ?? "n/a"}`;
    const details = tsAutoscaleEngaged
      ? `${tsDetail}; ${strictSourceDetail}; TS_autoscale_active=true; gating=${tsAutoscaleGating}; resamples=${resampleCount}`
      : `${tsDetail}; ${strictSourceDetail}`;
    const tsConstraint = constraint(
      "TS_ratio_min",
      meta.description,
      meta.severity,
      passed,
      tsValue,
      DEFAULT_TS_MIN,
      details,
      note,
      tsProvenanceClass,
      tsConfidenceBand,
      true,
      strictCongruence,
    );
    results.push(tsConstraint);
  }

  // Theta calibration band
  if (theta !== undefined || strictCongruence) {
    const meta = applySpec("ThetaAudit", {
      severity: "HARD",
      description: "Theta calibration within allowed band",
    });
    const hasGeometryTheta = thetaMetricDerived;
    const thetaAbs = theta != null ? Math.abs(theta) : undefined;
    const thetaBandPass = thetaAbs != null ? thetaAbs <= DEFAULT_THETA_MAX : false;
    const thetaPass = strictCongruence
      ? hasGeometryTheta && thetaContractPass && thetaBandPass
      : thetaBandPass;
    results.push(
      constraint(
        "ThetaAudit",
        meta.description,
        meta.severity,
        thetaPass,
        thetaAbs,
        DEFAULT_THETA_MAX,
        `|theta|=${thetaAbs ?? "n/a"} max=${DEFAULT_THETA_MAX} source=${thetaSource ?? "unknown"} strict=${strictCongruence} geometryTheta=${hasGeometryTheta} chartContract=${thetaChartContractStatus} metricReason=${thetaMetricReason}`,
        strictCongruence && !hasGeometryTheta
          ? "proxy_input"
          : strictCongruence && !thetaContractPass
            ? "chart_contract_missing"
            : undefined,
        thetaProvenanceClass,
        thetaConfidenceBand,
        true,
        strictCongruence,
      ),
    );
  }

  if (cl3Delta != null) {
    const meta = applySpec("CL3_RhoDelta", {
      severity: "SOFT",
      description: "CL3 stress-energy congruence (constraint rho vs T00).",
    });
    const passed = cl3Delta <= DEFAULT_CL3_RHO_DELTA_MAX;
    const reference =
      cl3DeltaMetric != null
        ? warpMetricT00Geom
        : cl3Source === "gr.matter.avgT00"
          ? matterAvgT00
          : cl3Source === "pipeline.rho_avg"
            ? pipelineRhoAvgGeom
            : undefined;
    const details = `source=${cl3Source ?? "unknown"} chart=${warpMetricChart ?? "n/a"} family=${
      warpMetricFamily ?? "n/a"
    } observer=${warpMetricObserver ?? "n/a"} norm=${warpMetricNormalization ?? "n/a"} contract=${
      warpMetricContractStatus ?? "unknown"
    } rho_constraint_mean=${rhoConstraintMean ?? "n/a"} T00_ref=${reference ?? "n/a"} delta=${cl3Delta}`;
    results.push(
      constraint(
        "CL3_RhoDelta",
        meta.description,
        meta.severity,
        passed,
        cl3Delta,
        DEFAULT_CL3_RHO_DELTA_MAX,
        details,
        cl3Source ? `source=${cl3Source}` : undefined,
      ),
    );
  } else {
    const meta = applySpec("CL3_RhoDelta", {
      severity: "SOFT",
      description: "CL3 stress-energy congruence (constraint rho vs T00).",
    });
    const details = `source=${warpMetricSource ?? "metric-missing"} chart=${warpMetricChart ?? "n/a"} family=${
      warpMetricFamily ?? "n/a"
    } observer=${warpMetricObserver ?? "n/a"} norm=${warpMetricNormalization ?? "n/a"} contract=${
      warpMetricContractStatus ?? "unknown"
    } rho_constraint_mean=${
      rhoConstraintMean ?? "n/a"
    } T00_ref=${warpMetricT00Geom ?? "n/a"} delta=n/a strict=${strictCongruence} reason=${
      cl3MissingReason || "missing_inputs"
    }`;
    results.push(
      constraint(
        "CL3_RhoDelta",
        meta.description,
        meta.severity,
        false,
        undefined,
        DEFAULT_CL3_RHO_DELTA_MAX,
        details,
        cl3MissingNote ??
          (strictCongruence ? "missing_inputs" : "missing_inputs_relaxed"),
      ),
    );
  }

  // Exotic mass budget
  if (pipeline.M_exotic !== undefined) {
    const meta = applySpec("M_exotic_budget", {
      severity: "SOFT",
      description: "Exotic mass within configured budget",
    });
    const limit = Math.abs(mTarget) * (1 + DEFAULT_MASS_TOL);
    results.push(
      constraint(
        "M_exotic_budget",
        meta.description,
        meta.severity,
        Math.abs(pipeline.M_exotic) <= limit,
        Math.abs(pipeline.M_exotic),
        limit,
        `|M_exotic|=${Math.abs(pipeline.M_exotic)} budget=${limit}`,
      ),
    );
  }

  // Van den Broeck compression band
  if (gammaVdB !== undefined) {
    const meta = applySpec("VdB_band", {
      severity: "SOFT",
      description: "Van den Broeck compression factor in configured band",
    });
    const inBand = gammaVdB >= VDB_MIN && gammaVdB <= VDB_MAX;
    const requiresSupport = gammaVdB > 1 + 1e-6;
    const supportOk =
      !requiresSupport ||
      vdbTwoWallDerivativeSupport;
    const pass = inBand && supportOk;
    const hasVdbSupport =
      vdbRegionIISupport !== undefined ||
      vdbRegionIVSupport !== undefined ||
      vdbTwoWallSupport !== undefined ||
      vdbRegionIIDerivativeSupport ||
      vdbRegionIVDerivativeSupport;
    const supportLabel = (value: boolean | undefined) =>
      value === true ? "on" : value === false ? "off" : "n/a";
    const supportDetail = hasVdbSupport
      ? `regionII=${supportLabel(vdbRegionIISupport)} regionIV=${supportLabel(vdbRegionIVSupport)} twoWall=${supportLabel(vdbTwoWallSupport)} derivII=${vdbRegionIIDerivativeSupport} derivIV=${vdbRegionIVDerivativeSupport} derivTwoWall=${vdbTwoWallDerivativeSupport} supportOk=${supportOk} requiresSupport=${requiresSupport}`
      : undefined;
    const derivativeDetail =
      hasVdbSupport || requiresSupport
        ? `bprime_max_abs=${vdbBprimeMaxAbs ?? "n/a"} bdouble_max_abs=${vdbBdoubleMaxAbs ?? "n/a"} dfdr_max_abs=${vdbRegionIVDfdrMaxAbs ?? "n/a"} thresholds=[${VDB_BPRIME_MIN_ABS},${VDB_BDOUBLE_MIN_ABS},${VDB_DFDR_MIN_ABS}]`
        : undefined;
    const detailParts = [
      `gamma_VdB=${gammaVdB} band=[${VDB_MIN}, ${VDB_MAX}]`,
      supportDetail,
      derivativeDetail,
    ].filter(Boolean);
    results.push(
      constraint(
        "VdB_band",
        meta.description,
        meta.severity,
        pass,
        gammaVdB,
        VDB_MAX,
        detailParts.join(" "),
      ),
    );
  }

  const anyHardFail = results.some((c) => c.severity === "HARD" && !c.passed);
  const anySoftFail = results.some((c) => c.severity === "SOFT" && !c.passed);
  const status: ViabilityStatus = anyHardFail ? "INADMISSIBLE" : anySoftFail ? "MARGINAL" : "ADMISSIBLE";
  const qiMetricDerived = qiSourceIsMetric(qiGuard?.rhoSource);
  const promotionDecisionFinal = resolvePromotionDecision({
    strictMode: strictCongruence,
    warpMechanicsProvenanceClass,
    hardConstraintPass: !anyHardFail,
    status,
    thetaMetricDerived,
    tsMetricDerived,
    qiMetricDerived,
    qiApplicabilityStatus: qiGuard?.applicabilityStatus,
  });
  const promotionReplayPack = buildPromotionReplayPack({
    strictMode: strictCongruence,
    decision: promotionDecisionFinal,
    status,
    hardConstraintPass: !anyHardFail,
    thetaMetricDerived,
    tsMetricDerived,
    qiMetricDerived,
    provenanceClass: warpMechanicsProvenanceClass,
  });
  snapshot.warp_mechanics_claim_tier = promotionDecisionFinal.tier;
  snapshot.warp_mechanics_promotion_reason = promotionDecisionFinal.reason;
  snapshot.warp_mechanics_promotion_counterexample_class =
    promotionReplayPack.outcome.counterexample_class;
  snapshot.warp_mechanics_promotion_replay = promotionReplayPack;

  return {
    status,
    constraints: results,
    snapshot,
    mitigation: tsAutoscaleResampled ? ["TS_autoscale_resampled"] : undefined,
    citations: [
      "docs/alcubierre-alignment.md",
      "server/energy-pipeline.ts",
      "modules/dynamic/stress-energy-equations.ts",
      "tests/theory-checks.spec.ts",
    ],
  };
}
