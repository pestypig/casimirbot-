// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// Model mode switch: raw physics or paper-calibrated power targets.
// Explicit default: paper-calibrated power targets; set HELIX_MODEL_MODE=raw to bypass.
const MODEL_MODE: 'calibrated' | 'raw' =
  (process.env.HELIX_MODEL_MODE === 'raw') ? 'raw' : 'calibrated';

export type MassMode =
  | "MODEL_DERIVED"
  | "TARGET_CALIBRATED"
  | "MEASURED_FORCE_INFERRED";
export type MassSource = "model" | "measured" | "target";
export type ControlSource = "measured" | "design" | "policy" | "schedule" | "target";

const DEFAULT_MASS_MODE: MassMode = "MODEL_DERIVED";

const resolveMassMode = (value: unknown): MassMode => {
  if (
    value === "MODEL_DERIVED" ||
    value === "TARGET_CALIBRATED" ||
    value === "MEASURED_FORCE_INFERRED"
  ) {
    return value;
  }
  return DEFAULT_MASS_MODE;
};

// G├╢├çG├╢├ç Physics Constants (centralized) G├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├ç
import { HBAR } from "./physics-const.js";
import { C } from "./utils/physics-const-safe";
import { GEOM_TO_SI_STRESS, SI_TO_GEOM_STRESS } from "../shared/gr-units.js";
import { computeClocking, type ClockingSnapshot } from "../shared/clocking.js";
import type { StressEnergyStats } from "./stress-energy-brick";
import type { WarpMetricAdapterSnapshot } from "../modules/warp/warp-metric-adapter.js";
import type { CongruenceMeta } from "../types/pipeline";
import type { SectorControlLiveEvent } from "../shared/schema.js";

// Keep tau_LC (wall / c) aligned with modulation dwell unless overridden
const DEFAULT_MODULATION_FREQ_GHZ = 15;
const DEFAULT_WALL_THICKNESS_M = C / (DEFAULT_MODULATION_FREQ_GHZ * 1e9);
const STROBE_DUTY_WINDOW_MS_DEFAULT = 12_000;
const STROBE_DUTY_STALE_MS = 20_000;

// Performance guardrails for billion-tile calculations
const TILE_EDGE_MAX = 2048;          // safe cap for any "edge" dimension fed into dynamic helpers
const DYN_TILECOUNT_HARD_SKIP = 5e7; // >50M tiles G├Ñ├å skip dynamic per-tile-ish helpers (use aggregate)
const INV16PI = 1 / (16 * Math.PI);

// Production-quiet logging toggle
const DEBUG_PIPE = process.env.NODE_ENV !== 'production' && (process.env.HELIX_DEBUG?.includes('pipeline') ?? false);
import { calculateNatarioMetric } from '../modules/dynamic/natario-metric.js';
import {
  calculateDynamicCasimirWithNatario,
  runVacuumGapSweep,
  defaultSweepConfigFromDynamic,
  computeSweepPoint,
  detectPlateau,
  getPumpCommandForQi,
  type DynamicConfigLike,
} from '../modules/dynamic/dynamic-casimir.js';
import { assignGateSummaries } from "../modules/dynamic/gates/index.js";
import { calculateCasimirEnergy, omega0_from_gap } from '../modules/sim_core/static-casimir.js';
import {
  inferCasimirForceScale,
  inferEnergyFromForceSeries,
} from "../modules/sim_core/casimir-inference.js";
import {
  toPipelineStressEnergy,
  enhancedAvgEnergyDensity,
  computeLaplaceRungeLenz,
  type Vec3,
} from '../modules/dynamic/stress-energy-equations.js';
import warpBubbleModule from '../modules/warp/warp-module.js';
import { buildWarpMetricAdapterSnapshot } from "../modules/warp/warp-metric-adapter.js";
import { DEFAULT_GEOMETRY_SWEEP, DEFAULT_PHASE_MICRO_SWEEP } from "../shared/schema.js";
import type {
  CardRecipe,
  CardMeshMetadata,
  CardLatticeMetadata,
  HullPreviewPayload,
} from "../shared/schema.js";
import type {
  WarpViabilityCertificate,
  ViabilityConstraint,
  ViabilityStatus,
  WarpSnapshot,
} from "../types/warpViability";
import { CARD_RECIPE_SCHEMA_VERSION } from "../shared/schema.js";
import {
  applyQiAutothrottleStep,
  applyScaleToGatePulses,
  applyScaleToPumpCommand,
  initQiAutothrottle,
  type QiAutothrottleState,
} from "./controls/qi-autothrottle.js";
import {
  initQiAutoscaleState,
  stepQiAutoscale,
  type QiAutoscaleClampReason,
  type QiAutoscaleState,
} from "./controls/qi-autoscale.js";
import {
  QI_AUTOSCALE_ENABLE,
  QI_AUTOSCALE_MIN_SCALE,
  QI_AUTOSCALE_SLEW,
  QI_AUTOSCALE_TARGET,
  QI_AUTOSCALE_WINDOW_TOL,
  QI_AUTOSCALE_SOURCE,
} from "./config/env.js";
import type {
  DynamicCasimirSweepConfig,
  DynamicConfig,
  VacuumGapSweepRow,
  SweepPoint,
  SweepRuntime,
  GateAnalytics,
  GatePulse,
  QiFieldType,
  QiSettings,
  QiStats,
  SamplingKind,
  PhaseScheduleTelemetry,
  PumpCommand,
  PumpTone,
  HardwareSectorState,
  HardwareQiSample,
  HardwareSpectrumFrame,
  CasimirForceDataset,
  MaterialModel,
  MaterialProps,
} from "../shared/schema.js";
import { appendPhaseCalibrationLog } from "./utils/phase-calibration.js";
import { slewPump } from "./instruments/pump.js";
import { slewPumpMultiTone } from "./instruments/pump-multitone.js";
import { computeSectorPhaseOffsets, applyPhaseScheduleToPulses, type PhaseSchedule } from "./energy/phase-scheduler.js";
import { QiMonitor } from "./qi/qi-monitor.js";
import { configuredQiScalarBound, qiBound_Jm3 } from "./qi/qi-bounds.js";
import { buildWindow, type RawTileInput } from "./qi/qi-saturation.js";
import { updatePipelineQiTiles, getLatestQiTileStats } from "./qi/pipeline-qi-stream.js";
import { stepTsAutoscale, type TsAutoscaleState } from "./ts/ts-autoscale.js";

export type MutableDynamicConfig = DynamicConfigLike;

export interface SweepHistoryTotals {
  visible: number;
  total: number;
  dropped: number;
}

export interface StrobeDutySummary {
  dutyAvg: number;
  windowMs: number;
  samples: number;
  lastSampleAt: number;
  lastDuty: number;
  sLive?: number;
  sTotal?: number;
  source?: string;
}

export interface HardwareTruthSnapshot {
  lastSweepRow?: VacuumGapSweepRow;
  totals?: SweepHistoryTotals;
  updatedAt?: number;
  sectorState?: (HardwareSectorState & { updatedAt?: number }) | null;
  qiSample?: (HardwareQiSample & { updatedAt?: number }) | null;
  spectrumFrame?: (HardwareSpectrumFrame & { updatedAt?: number }) | null;
  strobeDuty?: StrobeDutySummary | null;
}

export interface ScheduleSweepRequest {
  activeSlew: boolean;
  reason?: string;
}

export interface PipelineRunOptions {
  sweepMode?: "auto" | "skip" | "force" | "async";
  scheduleSweep?: (request: ScheduleSweepRequest) => void;
  sweepReason?: string;
}

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const strictCongruenceEnabled = (): boolean =>
  process.env.WARP_STRICT_CONGRUENCE !== "0";
const DEFAULT_CL3_RHO_DELTA_MAX = parseEnvNumber(process.env.WARP_CL3_RHO_DELTA_MAX, 0.1);

type TsMetricDerivedStatus = {
  metricDerived: boolean;
  source: string;
  reason?: string;
  chart?: string;
};

const hasPositiveFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const resolveTsMetricDerivedStatus = (
  state: EnergyPipelineState,
  clockingProvenance: "derived" | "hardware" | "simulated",
): TsMetricDerivedStatus => {
  if (clockingProvenance === "hardware") {
    return {
      metricDerived: false,
      source: "hardware_timing",
      reason: "clocking provenance is hardware telemetry",
    };
  }

  const tsRatio = Number(state.TS_ratio);
  const tauLCms = Number((state as any).tauLC_ms ?? state.ts?.tauLC_ms);
  if (!hasPositiveFinite(tsRatio) || !hasPositiveFinite(tauLCms)) {
    return {
      metricDerived: false,
      source: "timing_missing",
      reason: "TS_ratio or tauLC_ms missing/non-positive",
    };
  }

  const hull = state.hull;
  const hasHullDims =
    hasPositiveFinite(hull?.Lx_m) &&
    hasPositiveFinite(hull?.Ly_m) &&
    hasPositiveFinite(hull?.Lz_m);
  if (!hasHullDims) {
    return {
      metricDerived: false,
      source: "hull_missing",
      reason: "hull dimensions unavailable for proper-distance timing",
    };
  }

  const metricAdapter = (state as any)?.warp?.metricAdapter as
    | WarpMetricAdapterSnapshot
    | undefined;
  if (!metricAdapter) {
    return {
      metricDerived: false,
      source: "metric_adapter_missing",
      reason: "warp metric adapter not available",
    };
  }

  const chartLabel = metricAdapter.chart?.label;
  const dtGammaPolicy = metricAdapter.chart?.dtGammaPolicy;
  const contractStatus = metricAdapter.chart?.contractStatus;
  const chartKnown =
    typeof chartLabel === "string" &&
    chartLabel !== "unspecified" &&
    dtGammaPolicy !== "unknown" &&
    contractStatus !== "unknown";
  if (!chartKnown) {
    return {
      metricDerived: false,
      source: "chart_unknown",
      reason: "metric adapter chart contract is unspecified/unknown",
      chart: typeof chartLabel === "string" ? chartLabel : undefined,
    };
  }

  const gammaDiag = metricAdapter.gammaDiag;
  const gammaDiagValid =
    Array.isArray(gammaDiag) &&
    gammaDiag.length === 3 &&
    gammaDiag.every((v) => hasPositiveFinite(v));
  if (!gammaDiagValid) {
    return {
      metricDerived: false,
      source: "gamma_diag_missing",
      reason: "metric adapter gamma diagonal missing/non-positive",
      chart: chartLabel,
    };
  }

  return {
    metricDerived: true,
    source: "warp.metricAdapter+clocking",
    reason: "TS_ratio from proper-distance timing with explicit chart contract",
    chart: chartLabel,
  };
};

export const DEFAULT_PULSED_CURRENT_LIMITS_A = {
  midi: parseEnvNumber(process.env.IPEAK_MAX_MIDI_A, 31_623), // 5 kJ @ 10 uH @ 10 us -> ~31.6 kA
  sector: parseEnvNumber(process.env.IPEAK_MAX_SECTOR_A, 31_623), // Tile bank provisional cap (~31.6 kA @ 1 uH, 1 us)
  launcher: parseEnvNumber(process.env.IPEAK_MAX_LAUNCHER_A, 14_142), // 10 kJ @ 100 uH @ 20 us -> ~14.1 kA
} as const;

export const TAU_LC_UNIT_DRIFT_LIMIT = 50; // reject >50x unit drift (ms vs ┬╡s)

export function computeTauLcMsFromHull(hull?: {
  Lx_m?: number;
  Ly_m?: number;
  Lz_m?: number;
  wallThickness_m?: number | null;
} | null): number | null {
  if (!hull) return null;
  const dims = [hull.Lx_m, hull.Ly_m, hull.Lz_m]
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  const longest = dims.length ? Math.max(...dims) : null;
  const wall = Number(hull.wallThickness_m);
  const path_m = longest && longest > 0
    ? longest
    : (Number.isFinite(wall) && wall > 0 ? wall : null);
  if (!(path_m && path_m > 0)) return null;
  return (path_m / C) * 1e3;
}

const resolveMetricPathLengthFromAdapter = (
  state: EnergyPipelineState,
): number | undefined => {
  const metricAdapter = (state as any)?.warp?.metricAdapter as
    | WarpMetricAdapterSnapshot
    | undefined;
  if (!metricAdapter) return undefined;
  const gammaDiag = metricAdapter.gammaDiag;
  if (!Array.isArray(gammaDiag) || gammaDiag.length !== 3) return undefined;
  const scales = gammaDiag.map((value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.sqrt(n) : Number.NaN;
  });
  if (!scales.every((value) => Number.isFinite(value) && value > 0)) return undefined;
  const hull = state.hull;
  if (!hull) return undefined;
  const dims = [Number(hull.Lx_m), Number(hull.Ly_m), Number(hull.Lz_m)];
  const scaledDims = dims
    .map((dim, idx) => (Number.isFinite(dim) && dim > 0 ? dim * scales[idx] : Number.NaN))
    .filter((dim) => Number.isFinite(dim) && dim > 0);
  if (scaledDims.length > 0) return Math.max(...scaledDims);
  const wall = Number(hull.wallThickness_m);
  if (Number.isFinite(wall) && wall > 0) {
    return wall * Math.max(...scales);
  }
  return undefined;
};

const toFiniteNumber = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toFiniteVec3 = (
  value: unknown,
  fallback: [number, number, number],
): [number, number, number] => {
  if (Array.isArray(value) && value.length >= 3) {
    const x = toFiniteNumber(value[0]);
    const y = toFiniteNumber(value[1]);
    const z = toFiniteNumber(value[2]);
    if (x != null && y != null && z != null) {
      return [x, y, z];
    }
  }
  return fallback;
};

const resolveCanonicalMetricT00Ref = (
  warp: Record<string, any>,
  adapter: WarpMetricAdapterSnapshot | undefined,
): string | undefined => {
  if (typeof warp.metricT00Ref === "string" && warp.metricT00Ref.length > 0) {
    return String(warp.metricT00Ref);
  }
  const family = adapter?.family;
  if (family === "alcubierre") return "warp.metric.T00.alcubierre.analytic";
  if (family === "vdb") return "warp.metric.T00.vdb.regionII";
  if (family === "natario_sdf") return "warp.metric.T00.natario_sdf.shift";
  if (family === "natario") {
    if (adapter?.requestedFieldType === "irrotational") {
      return "warp.metric.T00.irrotational.shift";
    }
    return "warp.metric.T00.natario.shift";
  }
  return undefined;
};

type MetricT00Observer = "eulerian_n" | "orthonormal_region_ii";
type MetricT00Normalization = "si_stress";
type MetricT00UnitSystem = "SI";
type MetricT00ContractStatus = "ok" | "unknown";

type MetricT00Contract = {
  status: MetricT00ContractStatus;
  reason?: string;
  sourceRef: string;
  family: string;
  chart: string;
  observer: MetricT00Observer;
  normalization: MetricT00Normalization;
  unitSystem: MetricT00UnitSystem;
  derivation: string;
};

const resolveMetricT00Observer = (metricT00Ref: string): MetricT00Observer =>
  metricT00Ref === "warp.metric.T00.vdb.regionII"
    ? "orthonormal_region_ii"
    : "eulerian_n";

const resolveMetricFamilyFromRef = (
  metricT00Ref: string,
  adapter: WarpMetricAdapterSnapshot | undefined,
): string => {
  if (typeof adapter?.family === "string" && adapter.family.length > 0) {
    return adapter.family;
  }
  if (metricT00Ref.includes(".vdb.")) return "vdb";
  if (metricT00Ref.includes(".natario_sdf.")) return "natario_sdf";
  if (metricT00Ref.includes(".irrotational.")) return "natario";
  if (metricT00Ref.includes(".natario.")) return "natario";
  if (metricT00Ref.includes(".alcubierre.")) return "alcubierre";
  return "unknown";
};

const buildMetricT00Contract = (params: {
  adapter?: WarpMetricAdapterSnapshot;
  metricT00Ref: string;
  observer?: string;
  normalization?: string;
  unitSystem?: string;
  derivation: string;
}): MetricT00Contract => {
  const adapter = params.adapter;
  const observer =
    params.observer === "orthonormal_region_ii" || params.observer === "eulerian_n"
      ? (params.observer as MetricT00Observer)
      : resolveMetricT00Observer(params.metricT00Ref);
  const normalization: MetricT00Normalization =
    params.normalization === "si_stress" ? "si_stress" : "si_stress";
  const unitSystem: MetricT00UnitSystem = params.unitSystem === "SI" ? "SI" : "SI";
  const chart =
    typeof adapter?.chart?.label === "string" && adapter.chart.label.length > 0
      ? adapter.chart.label
      : "unspecified";
  const family = resolveMetricFamilyFromRef(params.metricT00Ref, adapter);
  const chartContractStatus = adapter?.chart?.contractStatus;
  let status: MetricT00ContractStatus = "ok";
  const reasons: string[] = [];
  if (chart === "unspecified") {
    status = "unknown";
    reasons.push("chart_unspecified");
  }
  if (chartContractStatus === "unknown") {
    status = "unknown";
    reasons.push("chart_contract_unknown");
  }
  if (!params.metricT00Ref.startsWith("warp.metric.T00")) {
    status = "unknown";
    reasons.push("metric_ref_noncanonical");
  }
  return {
    status,
    ...(reasons.length ? { reason: reasons.join(",") } : {}),
    sourceRef: params.metricT00Ref,
    family,
    chart,
    observer,
    normalization,
    unitSystem,
    derivation: params.derivation,
  };
};

const buildNatarioRuntimePayload = (
  state: EnergyPipelineState,
  fallback?: Record<string, unknown> | null,
): Record<string, unknown> => {
  const warp = ((state as any).warp ?? {}) as Record<string, any>;
  const adapter = warp.metricAdapter as WarpMetricAdapterSnapshot | undefined;
  const alpha = toFiniteNumber(adapter?.alpha) ?? 1;
  const gammaDiagRaw = Array.isArray(adapter?.gammaDiag) ? adapter.gammaDiag : undefined;
  const gammaDiag: [number, number, number] =
    gammaDiagRaw &&
    gammaDiagRaw.length >= 3 &&
    toFiniteNumber(gammaDiagRaw[0]) != null &&
    toFiniteNumber(gammaDiagRaw[1]) != null &&
    toFiniteNumber(gammaDiagRaw[2]) != null
      ? [
          Number(gammaDiagRaw[0]),
          Number(gammaDiagRaw[1]),
          Number(gammaDiagRaw[2]),
        ]
      : [1, 1, 1];

  const shiftAmplitude =
    firstFinite(
      warp.betaAvg,
      warp.natarioShiftAmplitude,
      warp?.shiftVectorField?.amplitude,
      (state as any).beta_avg,
    ) ?? 0;
  const shiftBeta = toFiniteVec3((fallback as any)?.shiftBeta, [shiftAmplitude, 0, 0]);
  const stress = (warp.stressEnergyTensor ??
    (state as any).stressEnergy ??
    (fallback as any)?.stressEnergyTensor ??
    {}) as Record<string, unknown>;
  const metricT00Ref = resolveCanonicalMetricT00Ref(warp, adapter);
  const metricT00SourceRaw =
    typeof warp.metricT00Source === "string" && warp.metricT00Source.length > 0
      ? String(warp.metricT00Source)
      : undefined;
  const stressEnergySourceRaw =
    typeof warp.stressEnergySource === "string" && warp.stressEnergySource.length > 0
      ? String(warp.stressEnergySource)
      : undefined;
  const metricT00 = firstFinite(warp.metricT00, stress.T00 as number | undefined);
  const metricMode =
    metricT00 != null &&
    (metricT00SourceRaw === "metric" ||
      stressEnergySourceRaw === "metric" ||
      (metricT00Ref != null && metricT00Ref.startsWith("warp.metric.T00")));
  const metricT00Source = metricMode ? "metric" : metricT00SourceRaw;
  const metricT00Derivation =
    metricMode && metricT00Ref != null
      ? metricT00Ref === "warp.metric.T00.vdb.regionII"
        ? "forward_B_to_derivatives_to_rho_E"
        : metricT00Ref === "warp.metric.T00.vdb.regionIV"
          ? "forward_fwall_to_rho_E"
        : "forward_shift_to_K_to_rho_E"
      : "proxy_or_pipeline";
  const metricT00Contract = metricMode && metricT00Ref != null
    ? buildMetricT00Contract({
        adapter,
        metricT00Ref,
        observer:
          typeof warp.metricT00Observer === "string" ? String(warp.metricT00Observer) : undefined,
        normalization:
          typeof warp.metricT00Normalization === "string"
            ? String(warp.metricT00Normalization)
            : undefined,
        unitSystem:
          typeof warp.metricT00UnitSystem === "string"
            ? String(warp.metricT00UnitSystem)
            : undefined,
        derivation: metricT00Derivation,
      })
    : undefined;

  const t00 = toFiniteNumber(stress.T00) ?? 0;
  const t11 = toFiniteNumber(stress.T11) ?? 0;
  const t22 = toFiniteNumber(stress.T22) ?? 0;
  const t33 = toFiniteNumber(stress.T33) ?? 0;

  return {
    ...(fallback ?? {}),
    metricMode,
    lapseN: alpha,
    shiftBeta,
    gSpatialDiag: gammaDiag,
    gSpatialSym: [gammaDiag[0], 0, 0, gammaDiag[1], 0, gammaDiag[2]],
    g0i: [-shiftBeta[0], -shiftBeta[1], -shiftBeta[2]],
    viewForward: [1, 0, 0],
    stressEnergyTensor: {
      T00: t00,
      T11: t11,
      T22: t22,
      T33: t33,
    },
    stressEnergySource:
      stressEnergySourceRaw ??
      (metricMode
        ? "metric"
        : "proxy"),
    metricT00,
    metricT00Source: metricT00Source ?? undefined,
    metricT00Ref,
    metricT00Derivation,
    metricT00Observer: metricT00Contract?.observer,
    metricT00Normalization: metricT00Contract?.normalization,
    metricT00UnitSystem: metricT00Contract?.unitSystem,
    metricT00ContractStatus: metricT00Contract?.status,
    metricT00ContractReason: metricT00Contract?.reason,
    chartLabel: adapter?.chart?.label ?? "unspecified",
    chartDtGammaPolicy: adapter?.chart?.dtGammaPolicy ?? "unknown",
    chartContractStatus: adapter?.chart?.contractStatus ?? "unknown",
    dutyFactor:
      firstFinite(
        warp.dutyFactor,
        (state as any).dutyEffective_FR,
        (state as any).dutyShip,
        (state as any).dutyCycle,
      ) ?? undefined,
    thetaScaleCore_sqrtDuty: firstFinite(
      warp.thetaScaleCore_sqrtDuty,
      warp.thetaScaleCore,
      (fallback as any)?.thetaScaleCore_sqrtDuty,
      (fallback as any)?.thetaScaleCore,
    ),
    thetaScaleCore: firstFinite(
      warp.thetaScaleCore,
      warp.thetaScaleCore_sqrtDuty,
      (fallback as any)?.thetaScaleCore,
      (fallback as any)?.thetaScaleCore_sqrtDuty,
    ),
  };
};

const DEFAULT_QI_TAU_MS = parseEnvNumber(process.env.QI_TAU_MS, 5);
const DEFAULT_QI_GUARD = parseEnvNumber(process.env.QI_GUARD_FRAC ?? process.env.QI_GUARD, 0.05);
const DEFAULT_QI_DT_MS = parseEnvNumber(process.env.QI_DT_MS, 2);
const DEFAULT_QI_FIELD = (process.env.QI_FIELD_TYPE as QiFieldType | undefined) ?? "em";
const DEFAULT_NEGATIVE_FRACTION = 0.4;
const DEFAULT_QI_INTEREST_RATE = parseEnvNumber(process.env.QI_INTEREST_RATE, 0.2);
const DEFAULT_QI_INTEREST_WINDOW_MULT = parseEnvNumber(process.env.QI_INTEREST_WINDOW_MULT, 2);
const DEFAULT_QI_CURVATURE_RATIO_MAX = parseEnvNumber(process.env.QI_CURVATURE_RATIO_MAX, 0.1);
const QI_CURVATURE_ENFORCE = (process.env.QI_CURVATURE_ENFORCE ?? "1") !== "0";
const DEFAULT_PUMP_FREQ_LIMIT_GHZ = Math.max(
  0.01,
  Math.min(parseEnvNumber(process.env.PUMP_FREQ_LIMIT_GHZ, 120), 1_000),
);

const DEFAULT_QI_SETTINGS: QiSettings = {
  sampler: 'gaussian',
  tau_s_ms: DEFAULT_QI_TAU_MS,
  observerId: 'ship',
  guardBand: DEFAULT_QI_GUARD,
  fieldType: DEFAULT_QI_FIELD,
};
const DEFAULT_QI_BOUND_SCALAR = configuredQiScalarBound({
  tau_s_ms: DEFAULT_QI_SETTINGS.tau_s_ms,
  fieldType: DEFAULT_QI_SETTINGS.fieldType,
  kernelType: DEFAULT_QI_SETTINGS.sampler,
});
const QI_POLICY_MAX_ZETA = Number.isFinite(Number(process.env.QI_POLICY_MAX_ZETA))
  ? Math.max(1e-12, Number(process.env.QI_POLICY_MAX_ZETA))
  : 1;
const QI_POLICY_ENFORCE = (process.env.QI_POLICY_ENFORCE ?? "1") !== "0";

const QI_STREAM_GRID_MIN = Math.max(4, Math.floor(parseEnvNumber(process.env.QI_STREAM_GRID_MIN, 8)));
const QI_STREAM_GRID_MAX = Math.max(
  QI_STREAM_GRID_MIN,
  Math.floor(parseEnvNumber(process.env.QI_STREAM_GRID_MAX, 24)),
);
const QI_STREAM_GRID_DEFAULT = Math.min(
  QI_STREAM_GRID_MAX,
  Math.max(
    QI_STREAM_GRID_MIN,
    Math.floor(parseEnvNumber(process.env.QI_STREAM_GRID_DEFAULT, 16)),
  ),
);

const qiMonitor = new QiMonitor(DEFAULT_QI_SETTINGS, DEFAULT_QI_DT_MS, DEFAULT_QI_BOUND_SCALAR);
let qiMonitorDt_ms = DEFAULT_QI_DT_MS;
let qiMonitorTau_ms = DEFAULT_QI_SETTINGS.tau_s_ms;
let qiSampleAccumulator_ms = 0;
let qiSampleLastTs = Date.now();
const qiLrlHistory: { lastPosition: Vec3 | null; lastTimestamp: number } = {
  lastPosition: null,
  lastTimestamp: 0,
};
let lastQiStats: QiStats | null = null;

const PUMP_EPOCH_ENV = Number(process.env.PUMP_EPOCH_MS);
const GLOBAL_PUMP_EPOCH_MS = Number.isFinite(PUMP_EPOCH_ENV) ? PUMP_EPOCH_ENV : 0;
const PUMP_TONE_ENABLE = process.env.PUMP_TONE_ENABLE === '1';
const PUMP_CMD_MIN_INTERVAL_MS = Math.max(
  0,
  parseEnvNumber(process.env.PUMP_CMD_MIN_INTERVAL_MS, 250),
);
const PUMP_CMD_KEEPALIVE_MS = Math.max(
  PUMP_CMD_MIN_INTERVAL_MS,
  parseEnvNumber(process.env.PUMP_CMD_KEEPALIVE_MS, 2000),
);
let lastPublishedPumpHash = '';
let lastPublishedPumpAt = 0;

const SECTORS_TOTAL_ENV = Number(process.env.SECTORS_TOTAL);
const DEFAULT_SECTORS_TOTAL = Number.isFinite(SECTORS_TOTAL_ENV)
  ? Math.max(1, Math.floor(SECTORS_TOTAL_ENV))
  : 32;

const SECTOR_PERIOD_ENV = Number(process.env.SECTOR_PERIOD_MS);
const DEFAULT_SECTOR_PERIOD_MS = Number.isFinite(SECTOR_PERIOD_ENV)
  ? Math.max(1, SECTOR_PERIOD_ENV)
  : 100;

let pendingPumpCommand: PumpCommand | undefined;
let lastPumpCommandSnapshot: PumpCommand | undefined;

export function publishPumpCommand(cmd: PumpCommand): void {
  if (!cmd) return;
  pendingPumpCommand = cmd;
  lastPumpCommandSnapshot = cmd;
  if (PUMP_TONE_ENABLE) {
    lastPublishedPumpHash = hashPumpCommand(cmd);
    lastPublishedPumpAt = Date.now();
  }
}

function roundToDigits(value: number | null | undefined, digits: number): number {
  const v = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(v)) return 0;
  const factor = 10 ** digits;
  return Math.round(v * factor) / factor;
}

function hashPumpCommand(cmd: PumpCommand): string {
  const tones = Array.isArray(cmd.tones)
    ? [...cmd.tones]
        .sort((a, b) => a.omega_hz - b.omega_hz)
        .map((tone) => ({
          f: roundToDigits(tone.omega_hz, 3),
          d: roundToDigits(tone.depth, 3),
          p: roundToDigits(tone.phase_deg, 1),
        }))
    : [];
  const rho0 = roundToDigits(cmd.rho0 ?? 0, 3);
  return JSON.stringify({ tones, rho0 });
}

// ---------- Ellipsoid helpers (match renderer math) ----------
export type HullAxes = { a: number; b: number; c: number };

function rhoEllipsoid(p: [number, number, number], ax: HullAxes) {
  return Math.hypot(p[0] / ax.a, p[1] / ax.b, p[2] / ax.c);
}

function nEllipsoid(p: [number, number, number], ax: HullAxes): [number, number, number] {
  // G├¬├º(x^2/a^2 + y^2/b^2 + z^2/c^2) normalized
  const nx = p[0] / (ax.a * ax.a);
  const ny = p[1] / (ax.b * ax.b);
  const nz = p[2] / (ax.c * ax.c);
  const L = Math.hypot(
    p[0] / ax.a,
    p[1] / ax.b,
    p[2] / ax.c
  ) || 1;
  const n0 = nx / L, n1 = ny / L, n2 = nz / L;
  const m = Math.hypot(n0, n1, n2) || 1;
  return [n0 / m, n1 / m, n2 / m];
}

const vecLen = (v: [number, number, number]) => Math.hypot(v[0], v[1], v[2]);
export const normalizeVec = (v: [number, number, number]): [number, number, number] => {
  const m = vecLen(v) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};

export const sectorSign = (theta: number, sectors: number, split: number) => {
  const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
  const sectorIdx = Math.floor(u * sectors);
  const distToSplit = (sectorIdx - split + 0.5);
  const strobeWidth = 0.75; // matches renderer
  const softSign = (x: number) => Math.tanh(x);
  return softSign(-distToSplit / strobeWidth);
};
// ---------- Physics-side displacement sampling for debug/validation ----------
export interface FieldSample {
  p: [number, number, number];   // sample coordinate (meters)
  rho: number;                   // ellipsoidal radius (unitless)
  bell: number;                  // canonical bell weight
  n: [number, number, number];   // outward normal
  sgn: number;                   // sector sign (+/-)
  disp: number;                  // scalar displacement magnitude used
  dA?: number;                   // proper area element at sample (m^2) G├ç├╢ from metric
}

export interface FieldSampleBuffer {
  length: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
  nz: Float32Array;
  rho: Float32Array;
  bell: Float32Array;
  sgn: Float32Array;
  disp: Float32Array;
  dA: Float32Array;
}

const FIELD_SAMPLE_POOL_CAP = 1_000_000;
let sampleBufferCapacity = 0;
let sampleX = new Float32Array(0);
let sampleY = new Float32Array(0);
let sampleZ = new Float32Array(0);
let sampleNX = new Float32Array(0);
let sampleNY = new Float32Array(0);
let sampleNZ = new Float32Array(0);
let sampleRho = new Float32Array(0);
let sampleBell = new Float32Array(0);
let sampleSgn = new Float32Array(0);
let sampleDisp = new Float32Array(0);
let sampleDA = new Float32Array(0);

function ensureFieldSampleCapacity(required: number) {
  if (required > FIELD_SAMPLE_POOL_CAP) {
    throw new Error(`field sample request exceeds pool cap (${required} > ${FIELD_SAMPLE_POOL_CAP})`);
  }
  if (required <= sampleBufferCapacity) return;
  const nextBase = sampleBufferCapacity > 0 ? Math.min(FIELD_SAMPLE_POOL_CAP, sampleBufferCapacity * 2) : Math.min(FIELD_SAMPLE_POOL_CAP, 1024);
  const next = Math.max(required, nextBase);
  sampleX = new Float32Array(next);
  sampleY = new Float32Array(next);
  sampleZ = new Float32Array(next);
  sampleNX = new Float32Array(next);
  sampleNY = new Float32Array(next);
  sampleNZ = new Float32Array(next);
  sampleRho = new Float32Array(next);
  sampleBell = new Float32Array(next);
  sampleSgn = new Float32Array(next);
  sampleDisp = new Float32Array(next);
  sampleDA = new Float32Array(next);
  sampleBufferCapacity = next;
}

export interface FieldRequest {
  // sampling grid
  nTheta?: number;   // default 64
  nPhi?: number;     // default 32
  shellOffset?: number; // meters; 0 = on shell, >0 outside, <0 inside (default 0)
  // physics
  wallWidth_m?: number; // bell width w-├╝ in meters (default from sag_nm)
  sectors?: number;     // sector count (default state.sectorCount)
  split?: number;       // (+)/(G├¬├å) split index (default floor(sectors/2))
  clamp?: Partial<SampleClamp>; // G┬╝├án+├à new, optional
}

export type GeometryKind = "ellipsoid" | "radial" | "sdf";

export type SurfaceSampleInput = {
  p: [number, number, number];
  n?: [number, number, number];
  dA?: number;
  signedDistance_m?: number; // optional signed distance to iso-surface (meters)
};

export type RadialSampleInput = {
  theta?: number;
  phi?: number;
  r: number;
  n?: [number, number, number];
  dA?: number;
};

export interface FieldGeometryRequest extends FieldRequest {
  geometryKind?: GeometryKind;
  radial?: {
    samples?: RadialSampleInput[];
    radiusAt?: (dir: [number, number, number]) => number | { r: number; n?: [number, number, number]; dA?: number };
    nTheta?: number;
    nPhi?: number;
  };
  sdf?: {
    samples: SurfaceSampleInput[];
  };
}

export type WarpFieldType = "natario" | "natario_sdf" | "alcubierre" | "irrotational";

export type WarpSdfPreview = {
  key?: string | null;
  hash?: string | null;
  meshHash?: string | null;
  basisSignature?: string | null;
  dims?: [number, number, number] | null;
  bounds?: [number, number, number] | null;
  voxelSize?: number | null;
  band?: number | null;
  format?: "float" | "byte" | null;
  clampReasons?: string[] | null;
  stats?: {
    sampleCount?: number;
    voxelsTouched?: number;
    voxelCoverage?: number;
    trianglesTouched?: number;
    triangleCoverage?: number;
    maxAbsDistance?: number;
    maxQuantizationError?: number;
  } | null;
  updatedAt?: number | null;
};

export type GeometryPreviewSnapshot = {
  preview?: HullPreviewPayload | null;
  mesh?: CardMeshMetadata | null;
  sdf?: WarpSdfPreview | null;
  lattice?: CardLatticeMetadata | null;
  updatedAt?: number | null;
};

export interface WarpGeometrySpec extends FieldGeometryRequest {
  assetId?: string;
  resolution?: number;
  band_m?: number;
  bounds_m?: [number, number, number];
  format?: "float" | "byte";
  wallThickness_m?: number;
  driveDirection?: [number, number, number];
}
export interface TileParams {
  gap_nm: number;           // Casimir cavity gap in nanometers
  radius_mm: number;        // Radius of curvature in millimeters
  sag_nm?: number;          // Optional sag depth in nanometers
  temperature_K?: number;   // Temperature in Kelvin
  Q_factor?: number;        // Quality factor for dynamic Casimir
  gammaGeo?: number;        // Geometric amplification factor
  dutyCycle?: number;       // Duty cycle (0-1)
  sectorCount?: number;     // Number of sectors for strobing
}

export type AmpFactors = {
  // Design values (pipeline prefers measured overrides when present).
  gammaGeo?: number;
  gammaVanDenBroeck?: number;
  qSpoilingFactor?: number;
  qMechanical?: number;
  qCavity?: number;
  // Measured overrides (telemetry or lab calibration).
  measuredGammaGeo?: number;
  measuredGammaVanDenBroeck?: number;
  measuredQSpoilingFactor?: number;
  measuredQMechanical?: number;
  measuredCavityQ?: number;
};

export type TsTelemetry = {
  TS_ratio?: number;
  tauLC_ms?: number;
  tauPulse_ns?: number;
  metricDerived?: boolean;
  metricDerivedSource?: string;
  metricDerivedReason?: string;
  metricDerivedChart?: string;
  autoscale?: TsAutoscaleState;
};

export type QuantumInterestBook = {
  neg_Jm3: number;        // Scheduled negative burst (window-normalized)       
  pos_Jm3: number;        // Scheduled positive payback (window-normalized)     
  debt_Jm3: number;       // Required positive overcompensation (with interest) 
  credit_Jm3: number;     // Available positive energy scheduled in window      
  margin_Jm3: number;     // credit - debt (>=0 means paid)
  netCycle_Jm3: number;   // pos - neg over a full cycle (without interest)     
  window_ms: number;      // payback window allocated
  rate: number;           // interest fraction applied to debt
};

export type CasimirForceInference = {
  datasetId?: string;
  referenceSeparation_m?: number;
  energy_J_at_a0?: number;
  sigmaEnergy_J?: number;
  kCasimir?: number;
  sigmaK?: number;
  sampleCount?: number;
  fitResiduals?: {
    rms_N?: number;
    rms_rel?: number;
    sampleCount?: number;
  };
  forceSign?: {
    expected?: "negative" | "positive";
    observed?: "negative" | "positive" | "mixed" | "unknown";
    positiveFraction?: number;
    negativeFraction?: number;
    sampleCount?: number;
    autoFlipApplied?: boolean;
    note?: string;
  };
  note?: string;
};

export interface MechanicalFeasibility {
  requestedGap_nm: number;
  requestedStroke_pm: number;
  recommendedGap_nm: number;
  minGap_nm: number;
  safetyFactorMin: number;
  mechSafetyFactor: number;
  sigmaYield_Pa: number;
  sigmaAllow_Pa: number;
  loadPressure_Pa: number;
  maxStroke_pm: number;
  casimirPressure_Pa: number;
  electrostaticPressure_Pa: number;
  restoringPressure_Pa: number;
  roughnessGuard_nm: number;
  margin_Pa: number;
  safetyFeasible: boolean;
  feasible: boolean;
  strokeFeasible: boolean;
  constrainedGap_nm?: number;
  casimirGap_nm?: number;
  modelMode?: 'calibrated' | 'raw';
  unattainable?: boolean;
  note?: string;
  sweep?: Array<{ gap_nm: number; margin_Pa: number; feasible: boolean }>;
}

export type MechanicalGuard = {
  qMechDemand: number;    // stroke factor needed to hit target power (may exceed 1)
  qMechApplied: number;   // stroke factor actually applied (clamped to safety band)
  mechSpoilage: number;   // demand/applied: >=1 shows how far past the safe limit we are
  pCap_W: number;         // ship-average power deliverable at q_mech = 1
  pApplied_W: number;     // ship-average power with the applied q_mech
  pShortfall_W: number;   // max(0, P_target - pApplied_W)
  status: 'ok' | 'saturated' | 'fail';
};

export type VdbRegionIIDiagnostics = {
  alpha: number;
  n: number;
  r_tilde_m: number;
  delta_tilde_m: number;
  sampleCount: number;
  b_min: number;
  b_max: number;
  bprime_min: number;
  bprime_max: number;
  bprime_rms: number;
  bdouble_min: number;
  bdouble_max: number;
  bdouble_rms: number;
  t00_min: number;
  t00_max: number;
  t00_mean: number;
  t00_rms: number;
  support: boolean;
  note?: string;
};

export type VdbRegionIVDiagnostics = {
  R_m: number;
  sigma: number;
  sampleCount: number;
  dfdr_max_abs: number;
  dfdr_rms: number;
  beta?: number;
  r_min_m?: number;
  r_max_m?: number;
  step_m?: number;
  t00_min?: number;
  t00_max?: number;
  t00_mean?: number;
  t00_rms?: number;
  k_trace_mean?: number;
  k_squared_mean?: number;
  support: boolean;
  note?: string;
};

export type SurfaceAreaEstimate = {
  value: number; // preferred estimate (metric quadrature)
  uncertainty: number; // +- absolute m^2
  band: { min: number; max: number };
  sectorAreas?: number[]; // optional per-sector estimate aligned with sectorCount
  sectors?: number;
  components: {
    metric: number;
    monteCarlo?: { value: number; stderr: number; samples: number };
    prolateApprox?: number | null;
    oblateApprox?: number | null;
  };
};

export type HullBrickChannel = {
  data: string;
  min?: number;
  max?: number;
};

export type HullBrickBounds = {
  min?: [number, number, number];
  max?: [number, number, number];
  center?: [number, number, number];
  extent?: [number, number, number];
  axes?: [number, number, number];
  wall?: number;
};

export type HullBrickPayload = {
  dims: [number, number, number];
  voxelBytes?: number;
  format?: "r32f";
  channels: {
    hullDist?: HullBrickChannel;
    hullMask?: HullBrickChannel;
  };
  bounds?: HullBrickBounds;
  meta?: unknown;
};

export type GrConstraintDiagnostics = {
  min: number;
  max: number;
  maxAbs: number;
  rms?: number;
  mean?: number;
  sampleCount?: number;
};

export type GrMomentumConstraintDiagnostics = {
  rms: number;
  maxAbs: number;
  components: {
    x: GrConstraintDiagnostics;
    y: GrConstraintDiagnostics;
    z: GrConstraintDiagnostics;
  };
};

export type GrPipelineDiagnostics = {
  updatedAt: number;
  source: "gr-evolve-brick";
  meta?: import("./gr-evolve-brick").GrBrickMeta;
  metricAdapter?: WarpMetricAdapterSnapshot;
  grid: {
    dims: [number, number, number];
    bounds: { min: Vec3; max: Vec3 };
    voxelSize_m: Vec3;
    time_s: number;
    dt_s: number;
  };
  solver: {
    steps: number;
    iterations: number;
    tolerance: number;
    cfl: number;
    fixups?: import("./gr-evolve-brick").GrEvolveBrickStats["fixups"];
    health?: import("./gr-evolve-brick").GrEvolveBrickStats["solverHealth"];
  };
  gauge?: {
    lapseMin: number;
    lapseMax: number;
    betaMaxAbs: number;
  };
  stiffness?: import("./gr-evolve-brick").GrEvolveBrickStats["stiffness"];
  constraints: {
    H_constraint: GrConstraintDiagnostics;
    M_constraint: GrMomentumConstraintDiagnostics;
    rho_constraint?: GrConstraintDiagnostics;
  };
  invariants?: import("./gr-evolve-brick").GrInvariantStatsSet;
  matter?: {
    stressEnergy?: StressEnergyStats;
  };
  perf?: {
    totalMs: number;
    evolveMs: number;
    brickMs: number;
    voxels: number;
    channelCount: number;
    bytesEstimate: number;
    msPerStep: number;
  };
};

export type MetricConstraintAudit = {
  updatedAt: number;
  source: string;
  chart?: string;
  family?: string;
  observer?: string;
  normalization?: string;
  unitSystem?: string;
  rho_constraint: GrConstraintDiagnostics;
};

export type GrInvariantBaseline = {
  invariants?: import("./gr-evolve-brick").GrInvariantStatsSet;
  source?: string;
  updatedAt?: number;
};

export type GrRequestPayload = {
  P_avg_W: number;
  dutyEffectiveFR: number;
  gammaGeo: number;
  gammaVdB: number;
  qSpoil: number;
  TS_ratio: number;
  hull: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  hullArea_m2?: number;
  N_tiles: number;
  tilesPerSector: number;
  warp?: {
    metricAdapter?: {
      chart?: { label?: string };
    };
    metricT00Contract?: {
      observer?: string;
      normalization?: string;
      unitSystem?: string;
    };
  };
};

export interface EnergyPipelineState {
  // Input parameters
  tileArea_cm2: number;
  tilePitch_m?: number;
  shipRadius_m: number;        // Legacy fallback for field sampler when hull geometry unavailable
  gap_nm: number;
  sag_nm: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  couplingChiOverride?: number;       // manual chi override (0..1)
  couplingSupercellTiles?: number;    // tiles in measured supercell
  couplingSupercellEnergy_J?: number; // measured supercell energy
  couplingFrameFill?: number;         // packing/coverage fraction for coupling calc
  experimental?: {
    casimirForce?: CasimirForceDataset;
  };

  // Hull geometry
  hull?: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number }; // Paper-authentic stack ~1 m; default auto-tunes to modulation dwell
  driveDir?: [number, number, number];
  warpFieldType?: WarpFieldType;
  warpGeometry?: WarpGeometrySpec | null;
  warpGeometryKind?: GeometryKind;
  warpGeometryAssetId?: string;
  geometryPreview?: GeometryPreviewSnapshot | null;
  hullBrick?: HullBrickPayload | null;
  bubble?: {
    R?: number;
    sigma?: number;
    beta?: number;
    dutyGate?: number;
  };
  // Legacy top-level bubble mirrors
  beta?: number;
  sigma?: number;
  R?: number;
  cardRecipe?: CardRecipe;

  // Mode parameters
  currentMode: 'hover' | 'taxi' | 'nearzero' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  dutyShip: number;           // Ship-wide effective duty (promoted from any)
  sectorCount: number;        // Total sectors (always 400)
  concurrentSectors: number; // Live concurrent sectors (1-2)
  sectorStrobing: number;     // Legacy alias for UI compatibility
  qSpoilingFactor: number;
  negativeFraction: number;   // Share of sectors assigned to negative lobe (0..1)

  // Pulsed-load current ceilings (enforced by command helpers)
  iPeakMaxMidi_A?: number;
  iPeakMaxSector_A?: number;
  iPeakMaxLauncher_A?: number;

  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  QL?: number;
  gammaVanDenBroeck: number;
  exoticMassTarget_kg: number;  // User-configurable exotic mass target
  casimirModel?: MaterialModel;
  materialProps?: MaterialProps;
  ampFactors?: AmpFactors;      // Amplification factors (gamma, q) surfaced for UI + warp module
  /** @deprecated use ampFactors */
  amps?: AmpFactors;

  // Calculated values
  U_static: number;         // Static Casimir energy per tile
  U_static_nominal?: number;
  U_static_realistic?: number;
  U_static_uncoupled?: number;
  U_static_band?: { min: number; max: number };
  casimirRatio?: number;
  lifshitzSweep?: Array<{ gap_nm: number; ratio: number }>;
  couplingChi?: number;
  couplingMethod?: string;
  couplingNote?: string;
  casimirForceInference?: CasimirForceInference;
  supercellRatio?: number;
  U_geo: number;            // Geometry-amplified energy
  U_Q: number;              // Q-enhanced energy
  U_cycle: number;          // Duty-cycled energy
  P_loss_raw: number;       // Raw power loss per tile
  P_avg: number;            // Average power (throttled)
  P_target_W?: number;      // Mode policy target (ship-average, W)
  P_cap_W?: number;         // Mode policy cap (ship-average, W)
  physicsCap_W?: number;    // Ship-average cap at q_mech=1 (no policy cap)
  P_applied_W?: number;     // Applied ship-average power after caps/guards (W)
  // Speed/beta closure (derived)
  beta_trans_power?: number; // Power throttle fraction (0..1)
  beta_policy?: number;      // ╬▓ from policy throttle
  shipBeta?: number;         // Effective ╬▓ (v/c proxy)
  vShip_mps?: number;        // Outside-frame coordinate speed
  speedClosure?: 'policyA' | 'proxyB';
  M_exotic: number;         // Exotic mass generated
  M_exotic_raw: number;     // Raw physics exotic mass (before calibration)
  massCalibration: number;  // Mass calibration factor
  rho_static?: number;      // Static Casimir energy density (J/m^3)
  rho_inst?: number;        // Instantaneous (on-window) energy density (J/m^3)
  rho_avg?: number;         // Cycle-averaged energy density (J/m^3)
  rho_constraint?: GrConstraintDiagnostics; // Constraint-derived energy density (geometry-based)
  rho_constraint_source?: string;           // Source tag for rho_constraint
  rho_delta_metric_mean?: number;           // Relative delta vs metric-derived T00
  rho_delta_pipeline_mean?: number;         // Relative delta vs pipeline rho_avg
  rho_delta_threshold?: number;             // CL3 threshold (relative)
  rho_delta_gate?: boolean;                 // CL3 gate pass/fail
  rho_delta_gate_reason?: string;           // CL3 gate reason
  rho_delta_gate_source?: string;           // CL3 gate source tag
  rho_delta_missing_parts?: string[];       // Missing input list for CL3 delta
  U_static_total?: number;  // Aggregate static energy across hull (N_tiles * U_static)
  U_static_total_band?: { min: number; max: number };
  gammaChain?: {
    geo_cubed?: number;
    qGain?: number;
    pocketCompression?: number;
    dutyEffective?: number;
    qSpoiling?: number;
    note?: string;
  };
  gammaVanDenBroeckGuard?: {
    limit: number;
    greenBand: { min: number; max: number };
    pocketRadius_m: number;
    pocketThickness_m: number;
    planckMargin: number;
    admissible: boolean;
    reason: string;
    requested?: number;
    targetHit?: boolean;
    targetShortfall?: number;
  };
  vdbRegionII?: VdbRegionIIDiagnostics;
  vdbRegionIV?: VdbRegionIVDiagnostics;
  TS_ratio: number;         // Time-scale separation ratio (conservative)
  TS_long?: number;         // Time-scale using longest dimension
  TS_geom?: number;         // Time-scale using geometric mean
  tsAutoscale?: TsAutoscaleState; // Averaging guard servo telemetry
  ts?: TsTelemetry;         // TS guard snapshot for UI/certs
  zeta: number;             // Quantum inequality parameter
  hullArea?: SurfaceAreaEstimate; // Detailed surface area estimate with uncertainty
  N_tiles: number;          // Total number of tiles
  N_tiles_band?: { min: number; max: number }; // Census range propagated from geometry uncertainty
  hullArea_m2?: number;     // Hull surface area (for Bridge display)
  hullAreaOverride_m2?: number;
  hullAreaOverride_uncertainty_m2?: number;
  hullAreaPerSector_m2?: number[]; // Optional per-sector surface area map (m^2)
  __hullAreaSource?: "override" | "ellipsoid";
  __hullAreaEllipsoid_m2?: number;
  __hullAreaPerSectorSource?: "override" | "ellipsoid" | "uniform";

  latestSectorControlLiveEvent?: SectorControlLiveEvent & {
    source: "server";
    updatedAt: number;
  };

  // Sector management
  tilesPerSector: number;   // Tiles per sector
  tilesPerSectorVector?: number[]; // Geometry-aware allocation (sums to N_tiles)
  tilesPerSectorUniform?: number[]; // Uniform allocation (legacy baseline)
  tilePowerDensityScale?: Array<number | null>; // Desired/actual tile ratio if uniform allocation is forced
  tilesPerSectorStrategy?: "area-weighted" | "uniform";
  activeSectors: number;    // Currently active sectors
  activeTiles: number;      // Currently active tiles
  activeFraction: number;   // Active sectors / total sectors
  phaseSchedule?: PhaseScheduleTelemetry;

  // Internal calculation helpers (optional fields)
  __sectors?: any;          // Sector calculation cache
  __fr?: any;               // Ford-Roman calculation cache

  // System status
  fordRomanCompliance: boolean;
  natarioConstraint: boolean;
  curvatureLimit: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  qi?: QiStats;
  qiBadge?: 'ok' | 'near' | 'violation';
  clocking?: ClockingSnapshot;
  clockingProvenance?: "derived" | "hardware" | "simulated";
  tsMetricDerived?: boolean;
  tsMetricDerivedSource?: string;
  tsMetricDerivedReason?: string;
  mechanical?: MechanicalFeasibility;
  mechGuard?: MechanicalGuard;

  // GR diagnostics (optional)
  grEnabled?: boolean;
  gr?: GrPipelineDiagnostics;
  grBaseline?: GrInvariantBaseline;
  grRequest?: GrRequestPayload;
  warpViability?: {
    certificate: WarpViabilityCertificate;
    certificateHash?: string;
    certificateId?: string;
    integrityOk?: boolean;
    status?: ViabilityStatus;
    constraints?: ViabilityConstraint[];
    snapshot?: WarpSnapshot;
    updatedAt?: number;
  };

  // Strobing and timing properties
  strobeHz?: number;
  sectorPeriod_ms?: number;
  dutyBurst?: number;
  localBurstFrac?: number;
  dutyEffective_FR?: number;
  dutyMeasuredFR?: number;
  sigmaSector?: number;
  splitEnabled?: boolean;
  splitFrac?: number;
  phase01?: number;
  pumpPhase_deg?: number;
  tauLC_ms?: number;

  // --- Compatibility / adapter fields (optional) ---
  // Alternative or legacy keys that may be emitted/consumed by adapters or clients.
  lc?: any;
  lightCrossing?: any;
  dutyUsed?: number;
  dutyEffectiveFR?: number; // camel-case alias
  dutyFR_slice?: number;
  dutyFR_ship?: number;
  dutyEff?: number;
  natario?: any;
  P_avg_W?: number;
  busVoltage_kV?: number;
  busCurrent_A?: number;

  // Model mode for client consistency
  modelMode?: 'calibrated' | 'raw';
  // Mass provenance mode for client consistency
  massMode?: MassMode;
  // Mass provenance for downstream modules
  massSource?: MassSource;
  massDatasetId?: string;
  massFitResiduals?: {
    rms_N?: number;
    rms_rel?: number;
    sampleCount?: number;
  };
  massSigma_kg?: number;
  invariantMassSigma_kg?: number;
  // Experimental control provenance (measured vs design/policy)
  gammaGeoSource?: ControlSource;
  gammaVanDenBroeckSource?: ControlSource;
  qSpoilingFactorSource?: ControlSource;
  qCavitySource?: ControlSource;
  modulationFreqSource?: ControlSource;
  dutyCycleSource?: ControlSource;
  dutyBurstSource?: ControlSource;
  sectorCountSource?: ControlSource;
  sectorDutySource?: ControlSource;

  // Environment telemetry (optional; surfaced to /metrics)
  atmDensity_kg_m3?: number | null;
  altitude_m?: number | null;

  // Dynamic sweep cache
  dynamicConfig?: MutableDynamicConfig | null;
  vacuumGapSweepResults?: VacuumGapSweepRow[];
  vacuumGapSweepRowsTotal?: number;
  vacuumGapSweepRowsDropped?: number;
  hardwareTruth?: HardwareTruthSnapshot | null;
  sweep?: SweepRuntime;
  gateAnalytics?: GateAnalytics | null;
  qiInterest?: QuantumInterestBook | null;
  qiAutothrottle?: QiAutothrottleState | null;
  qiAutoscale?: QiAutoscaleState | null;
  curvatureMeta?: CongruenceMeta;
  stressMeta?: CongruenceMeta;
  metricConstraint?: MetricConstraintAudit;
}

export const buildGrRequestPayload = (state: EnergyPipelineState): GrRequestPayload => {
  const shipRadius = Number.isFinite(state.shipRadius_m) ? state.shipRadius_m : 1;
  const fallbackDim = shipRadius * 2;
  const hullRaw = state.hull ?? { Lx_m: fallbackDim, Ly_m: fallbackDim, Lz_m: fallbackDim };
  const hull = {
    Lx_m: Number.isFinite(hullRaw.Lx_m) && hullRaw.Lx_m > 0 ? hullRaw.Lx_m : fallbackDim,
    Ly_m: Number.isFinite(hullRaw.Ly_m) && hullRaw.Ly_m > 0 ? hullRaw.Ly_m : fallbackDim,
    Lz_m: Number.isFinite(hullRaw.Lz_m) && hullRaw.Lz_m > 0 ? hullRaw.Lz_m : fallbackDim,
    ...(Number.isFinite(hullRaw.wallThickness_m) && (hullRaw.wallThickness_m as number) > 0
      ? { wallThickness_m: hullRaw.wallThickness_m as number }
      : {}),
  };

  const pAvgRaw = (state as any).P_avg_W;
  const P_avg_W = Number.isFinite(pAvgRaw)
    ? Number(pAvgRaw)
    : Number.isFinite(state.P_applied_W)
    ? Number(state.P_applied_W)
    : Number.isFinite(state.P_avg)
    ? Number(state.P_avg) * 1e6
    : 0;
  const dutyRaw =
    state.dutyEffective_FR ??
    (state as any).dutyEffectiveFR ??
    state.dutyShip ??
    (state as any).dutyEff ??
    state.dutyCycle;
  const dutyEffectiveFR = Number.isFinite(dutyRaw) ? Number(dutyRaw) : 0;
  const gammaGeo = Number.isFinite(state.gammaGeo) ? Number(state.gammaGeo) : 0;
  const gammaVdB = Number.isFinite(state.gammaVanDenBroeck) ? Number(state.gammaVanDenBroeck) : 0;
  const qSpoil = Number.isFinite(state.qSpoilingFactor) ? Number(state.qSpoilingFactor) : 0;
  const TS_ratio = Number.isFinite(state.TS_ratio) ? Number(state.TS_ratio) : 0;
  const hullArea_m2 = Number.isFinite(state.hullArea_m2) ? Number(state.hullArea_m2) : undefined;
  const N_tiles = Number.isFinite(state.N_tiles) ? Math.round(state.N_tiles) : 0;
  const tilesPerSector = Number.isFinite(state.tilesPerSector)
    ? Math.round(state.tilesPerSector)
    : 0;
  const warpState = ((state as any).warp ?? {}) as Record<string, any>;
  const metricAdapter = (warpState.metricAdapter ?? {}) as Record<string, any>;
  const chart = (metricAdapter.chart ?? {}) as Record<string, any>;
  const metricContract = (warpState.metricT00Contract ?? {}) as Record<string, any>;

  return {
    P_avg_W,
    dutyEffectiveFR,
    gammaGeo,
    gammaVdB,
    qSpoil,
    TS_ratio,
    hull,
    hullArea_m2,
    N_tiles,
    tilesPerSector,
    warp: {
      metricAdapter: {
        chart: {
          label: typeof chart.label === 'string' ? chart.label : 'unspecified',
        },
      },
      metricT00Contract: {
        observer:
          typeof metricContract.observer === 'string'
            ? metricContract.observer
            : typeof warpState.metricT00Observer === 'string'
              ? warpState.metricT00Observer
              : 'unknown',
        normalization:
          typeof metricContract.normalization === 'string'
            ? metricContract.normalization
            : typeof warpState.metricT00Normalization === 'string'
              ? warpState.metricT00Normalization
              : 'unknown',
        unitSystem:
          typeof metricContract.unitSystem === 'string'
            ? metricContract.unitSystem
            : typeof warpState.metricT00UnitSystem === 'string'
              ? warpState.metricT00UnitSystem
              : 'unknown',
      },
    },
  };
};

export function buildCardRecipeFromPipeline(state: EnergyPipelineState): CardRecipe {
  const clamp01 = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0, Math.min(1, n));
  };
  const toVec3 = (value: unknown): [number, number, number] | undefined => {
    if (!Array.isArray(value) || value.length < 3) return undefined;
    const [x, y, z] = value;
    const nx = Number(x);
    const ny = Number(y);
    const nz = Number(z);
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return undefined;
    return [nx, ny, nz];
  };

  const shipRadius = Number.isFinite(state.shipRadius_m) && (state.shipRadius_m as number) > 0
    ? (state.shipRadius_m as number)
    : 1;
  const hullRaw = state.hull ?? {
    Lx_m: shipRadius * 2,
    Ly_m: shipRadius * 2,
    Lz_m: shipRadius * 2,
  };
  const hull: CardRecipe["hull"] = {
    Lx_m: Number.isFinite(hullRaw.Lx_m) && (hullRaw.Lx_m as number) > 0 ? (hullRaw.Lx_m as number) : shipRadius * 2,
    Ly_m: Number.isFinite(hullRaw.Ly_m) && (hullRaw.Ly_m as number) > 0 ? (hullRaw.Ly_m as number) : shipRadius * 2,
    Lz_m: Number.isFinite(hullRaw.Lz_m) && (hullRaw.Lz_m as number) > 0 ? (hullRaw.Lz_m as number) : shipRadius * 2,
    ...(Number.isFinite((hullRaw as any).wallThickness_m) && (hullRaw as any).wallThickness_m > 0
      ? { wallThickness_m: (hullRaw as any).wallThickness_m as number }
      : {}),
  };

  const overrideArea = Number.isFinite(state.hullAreaOverride_m2) && (state.hullAreaOverride_m2 as number) > 0
    ? (state.hullAreaOverride_m2 as number)
    : undefined;
  const overrideUnc = Number.isFinite(state.hullAreaOverride_uncertainty_m2)
    ? Math.max(0, Number(state.hullAreaOverride_uncertainty_m2))
    : undefined;
  const area: CardRecipe["area"] = {
    hullAreaOverride_m2: overrideArea,
    hullAreaOverride_uncertainty_m2: overrideUnc,
    hullArea_m2: Number.isFinite(state.hullArea_m2) ? Number(state.hullArea_m2) : undefined,
    __hullAreaSource: typeof state.__hullAreaSource === "string"
      ? (state.__hullAreaSource as CardRecipe["area"]["__hullAreaSource"])
      : undefined,
  };

  const tilesPerSectorVector = Array.isArray(state.tilesPerSectorVector)
    ? state.tilesPerSectorVector.map((value) => {
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      })
    : undefined;
  const blanket: CardRecipe["blanket"] = {
    tilesPerSectorVector: tilesPerSectorVector && tilesPerSectorVector.length ? tilesPerSectorVector : undefined,
    activeFraction: clamp01(state.activeFraction),
  };

  const gateSourceRaw = typeof (state as any).gateSource === "string" ? (state as any).gateSource : undefined;
  const gateSource =
    gateSourceRaw === "blanket" || gateSourceRaw === "combined" ? gateSourceRaw : "schedule";
  const gateViewRaw = (state as any).gateView;
  const volumeDomainRaw = (state as any).volumeDomain;
  const volumeDomain: CardRecipe["viz"]["volumeDomain"] =
    volumeDomainRaw === "bubbleBox" ? "bubbleBox" : "wallBand";
  const volumeSourceRaw = (state as any).volumeSource;
  const volumeSource: CardRecipe["viz"]["volumeSource"] =
    volumeSourceRaw === "analytic" || volumeSourceRaw === "brick" || volumeSourceRaw === "lattice"
      ? volumeSourceRaw
      : "lattice";
  const viz: CardRecipe["viz"] = {
    volumeViz: "theta_drive",
    volumeDomain,
    volumeSource,
    gateSource,
    gateView: typeof gateViewRaw === "boolean" ? gateViewRaw : true,
    ...(typeof (state as any).forceFlatGate === "boolean"
      ? { forceFlatGate: (state as any).forceFlatGate as boolean }
      : {}),
  };

  const warpGeometryRaw = state.warpGeometry ?? undefined;
  const warpGeometry =
    warpGeometryRaw && typeof warpGeometryRaw === "object"
      ? (({ geometryKind: _gk, ...rest }) => rest)(warpGeometryRaw as Record<string, unknown>)
      : undefined;
  const geometry: CardRecipe["geometry"] = {
    warpFieldType: state.warpFieldType,
    warpGeometryKind: state.warpGeometryKind ?? (warpGeometryRaw as any)?.geometryKind,
    warpGeometryAssetId: state.warpGeometryAssetId ?? (warpGeometryRaw as any)?.assetId,
    warpGeometry: warpGeometry as any,
  };

  const cameraSource = (state as any).camera ?? (state as any).hullCamera ?? null;
  let camera: CardRecipe["camera"] = undefined;
  if (cameraSource && typeof cameraSource === "object") {
    const eye = toVec3((cameraSource as any).eye);
    const target = toVec3((cameraSource as any).target ?? (cameraSource as any).center);
    const up = toVec3((cameraSource as any).up);
    const radius_m = Number.isFinite((cameraSource as any).radius)
      ? Math.max(0, Number((cameraSource as any).radius))
      : undefined;
    const yaw_deg = Number.isFinite((cameraSource as any).yaw_deg ?? (cameraSource as any).yaw)
      ? Number((cameraSource as any).yaw_deg ?? (cameraSource as any).yaw)
      : undefined;
    const pitch_deg = Number.isFinite((cameraSource as any).pitch_deg ?? (cameraSource as any).pitch)
      ? Number((cameraSource as any).pitch_deg ?? (cameraSource as any).pitch)
      : undefined;
    const fov_deg = Number.isFinite((cameraSource as any).fov_deg ?? (cameraSource as any).fov)
      ? Number((cameraSource as any).fov_deg ?? (cameraSource as any).fov)
      : undefined;
    const presetRaw = (cameraSource as any).preset;
    const preset =
      presetRaw === "threeQuarterFront" || presetRaw === "broadside" || presetRaw === "topDown"
        ? presetRaw
        : undefined;

    if (
      eye ||
      target ||
      up ||
      radius_m !== undefined ||
      yaw_deg !== undefined ||
      pitch_deg !== undefined ||
      fov_deg !== undefined ||
      preset
    ) {
      camera = { eye, target, up, radius_m, yaw_deg, pitch_deg, fov_deg, preset };
    }
  }

  return {
    schemaVersion: CARD_RECIPE_SCHEMA_VERSION,
    hull,
    area,
    blanket,
    viz,
    geometry,
    camera,
    ...(state.geometryPreview?.mesh ? { mesh: state.geometryPreview.mesh as CardMeshMetadata } : {}),
    ...(state.geometryPreview?.lattice
      ? { lattice: state.geometryPreview.lattice as CardLatticeMetadata }
      : {}),
  };
}

// Physical constants
const HBAR_C = HBAR * C;             // G├ñ├àc G├½├¬ 3.16152677e-26 [J-+m] for Casimir calculations
const NM_TO_M = 1e-9;
const CM2_TO_M2 = 1e-4;

// G├╢├çG├╢├ç Paper-backed constants (consolidated physics)
/**
 * TheoryRefs:
 *  - ford-roman-qi-1995: derives dutyEffectiveFR ceiling (tau/K)
 */
const TOTAL_SECTORS    = 400;
const BURST_DUTY_LOCAL = 0.01;   // 10 -┬ªs / 1 ms
const Q_BURST          = 1e9;    // active-window Q for dissipation and DCE
const GAMMA_VDB        = 1e11;   // fixed seed (raw physics)
const RADIAL_LAYERS    = 10;     // surface +├╣ radial lattice

// Public clamp constants for display-only symmetry (do not affect ++/mass)
export const SAMPLE_CLAMP = { maxPush: 0.10, softness: 0.60 } as const;
export type SampleClamp = typeof SAMPLE_CLAMP;

// Export paper constants so UI and docs can reference the single source of truth
export const PAPER_GEO = { PACKING: 0.88, RADIAL_LAYERS: 10 } as const;
export const PAPER_DUTY = { TOTAL_SECTORS, BURST_DUTY_LOCAL } as const;
export const PAPER_Q    = { Q_BURST } as const;
export const PAPER_VDB  = { GAMMA_VDB } as const;
export const SWEEP_HISTORY_MAX = 2000;
const sweepHistory: VacuumGapSweepRow[] = [];
let sweepHistoryTotal = 0;
let sweepHistoryDropped = 0;
const PLANCK_LENGTH_M = 1.616255e-35; // m
const PLANCK_SAFETY_MULT = 1e6;       // keep pockets many orders above l_P
const POCKET_WALL_FLOOR_FRAC = 0.01;  // require VdB pocket >1% of wall thickness
const VDB_PROFILE_N = 80;            // Van Den Broeck polynomial order (paper example)
const VDB_REGION_SAMPLES = 64;       // sample count across region II band
const VDB_BPRIME_MIN_ABS = parseEnvNumber(process.env.WARP_VDB_BPRIME_MIN_ABS, 1e-18);
const VDB_BDOUBLE_MIN_ABS = parseEnvNumber(
  process.env.WARP_VDB_BDOUBLE_MIN_ABS,
  1e-18,
);
const VDB_DFDR_MIN_ABS = parseEnvNumber(process.env.WARP_VDB_DFDR_MIN_ABS, 1e-18);

// Mechanical feasibility defaults (nm-scale gap over 25 cm^2 plate)
const EPSILON_0 = 8.8541878128e-12; // F/m
const MECH_TILE_THICKNESS_M = parseEnvNumber(process.env.MECH_TILE_THICKNESS_M, 1e-3); // 1 mm slab unless overridden
const MECH_ELASTIC_MODULUS_PA = parseEnvNumber(process.env.MECH_YOUNG_MODULUS_PA, 170e9); // silicon-ish stiffness
const MECH_POISSON = parseEnvNumber(process.env.MECH_POISSON_RATIO, 0.27);
const MECH_DEFLECTION_COEFF = 0.0138; // clamped square plate under uniform load (Roark)
const MECH_ROUGHNESS_RMS_NM = parseEnvNumber(process.env.MECH_ROUGHNESS_RMS_NM, 0.2);
const MECH_ROUGHNESS_SIGMA = parseEnvNumber(process.env.MECH_ROUGHNESS_SIGMA, 5); // 5╧â separation guard
const MECH_PATCH_V_RMS = parseEnvNumber(process.env.MECH_PATCH_V_RMS, 0.05); // volts (50 mV patch noise)
const MECH_GAP_SWEEP = { min_nm: 0.5, max_nm: 200, step_nm: 0.5 } as const;
const MECH_SPAN_SCALE_RAW = parseEnvNumber(process.env.MECH_SPAN_SCALE_RAW, 0.2); // compress effective span to represent ribbed sub-tiles (raw)
const MECH_SPAN_SCALE_CAL = parseEnvNumber(process.env.MECH_SPAN_SCALE_CAL, 1);   // calibrated keeps full tile span
const MECH_TILE_THICKNESS_RAW_M = parseEnvNumber(process.env.MECH_TILE_THICKNESS_RAW_M, 0.004); // 4 mm diamond backbone
const MECH_ELASTIC_MODULUS_RAW_PA = parseEnvNumber(process.env.MECH_YOUNG_MODULUS_RAW_PA, 900e9); // diamond-class stiffness for raw
const MECH_YIELD_STRESS_PA = parseEnvNumber(process.env.MECH_YIELD_STRESS_PA, 60e9); // CNT/DNT frame design target
const MECH_SAFETY_FACTOR_DESIGN = parseEnvNumber(process.env.MECH_SAFETY_FACTOR_DESIGN ?? process.env.MECH_SAFETY_FACTOR, 10);
const MECH_SAFETY_MIN_RAW = parseEnvNumber(process.env.MECH_SAFETY_MIN_RAW, 3);
const MECH_SAFETY_MIN_CAL = parseEnvNumber(process.env.MECH_SAFETY_MIN_CAL, 1);

const ACTIVE_SLEW_LIMITS = {
  gaps: 12,
  modDepth: 3,
  phase: 9,
  pump: 3,
  delayMs: 5,
} as const;
const TWO_PHASE_TARGET_RHO = 0.85;
const TWO_PHASE_MIN_MOD_DEPTH_PCT = 0.001;

function resolveActiveSlewLimit(value: unknown, fallback: number, min = 1, max?: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const upper = Number.isFinite(max ?? NaN) ? Math.max(min, Number(max)) : undefined;
  const clamped = Math.floor(Math.max(min, upper != null ? Math.min(num, upper) : num));
  return clamped;
}

type PumpGuardStats = {
  clamped: number;
  rejected: number;
};

function normalizePumpFreqLimit(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_PUMP_FREQ_LIMIT_GHZ;
  }
  return Math.max(0.01, Math.min(numeric, DEFAULT_PUMP_FREQ_LIMIT_GHZ));
}

function sanitizePumpFrequencies(
  freqs: number[] | undefined,
  limit: number,
  stats?: PumpGuardStats,
  digits = 6,
): number[] {
  if (!Array.isArray(freqs) || !freqs.length) return [];
  const sanitized: number[] = [];
  for (const value of freqs) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      if (stats) stats.rejected += 1;
      continue;
    }
    let freq = numeric;
    if (Number.isFinite(limit) && limit > 0 && freq > limit) {
      if (stats) stats.clamped += 1;
      freq = limit;
    }
    sanitized.push(freq);
  }
  return dedupeNumericList(sanitized, digits);
}

function pickRepresentativeValues(values: number[], limit: number): number[] {
  if (!Array.isArray(values)) return [];
  const unique = Array.from(new Set(values.map((v) => Number(v)))).filter((v) => Number.isFinite(v));
  unique.sort((a, b) => a - b);
  if (unique.length <= limit) {
    return unique.slice();
  }
  if (limit <= 0) return [];
  if (limit === 1) {
    return [unique[Math.floor(unique.length / 2)]];
  }
  const step = (unique.length - 1) / (limit - 1);
  const result: number[] = [];
  for (let i = 0; i < limit; i++) {
    const idx = Math.round(i * step);
    const boundedIdx = Math.min(unique.length - 1, Math.max(0, idx));
    const value = unique[boundedIdx];
    if (!result.includes(value)) {
      result.push(value);
    }
  }
  if (result.length < limit) {
    for (const value of unique) {
      if (!result.includes(value)) {
        result.push(value);
        if (result.length >= limit) break;
      }
    }
  }
  result.sort((a, b) => a - b);
  return result.slice(0, limit);
}

function guardGammaVdB(params: {
  hull: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  gammaRequested: number;
}) {
  const halfAxes = [
    Math.max(1e-9, params.hull.Lx_m / 2),
    Math.max(1e-9, params.hull.Ly_m / 2),
    Math.max(1e-9, params.hull.Lz_m / 2),
  ];
  const minRadius = Math.min(...halfAxes);
  const wall = Math.max(
    PLANCK_LENGTH_M,
    Number.isFinite(params.hull.wallThickness_m)
      ? (params.hull.wallThickness_m as number)
      : DEFAULT_WALL_THICKNESS_M,
  );
  const pocketFloor = Math.max(
    wall * POCKET_WALL_FLOOR_FRAC,
    PLANCK_LENGTH_M * PLANCK_SAFETY_MULT,
  );
  const limitWall = minRadius / pocketFloor;
  const limitPlanck = minRadius / (PLANCK_LENGTH_M * PLANCK_SAFETY_MULT);
  const limit = Math.max(1, Math.min(limitWall, limitPlanck, 1e16));
  const gammaClamped = Math.max(0, Math.min(params.gammaRequested, limit));
  const pocketRadius_m = minRadius / Math.max(1, gammaClamped);
  const pocketThickness_m = wall / Math.max(1, gammaClamped);
  const planckMargin = pocketRadius_m / PLANCK_LENGTH_M;
  const admissible = params.gammaRequested <= limit;
  const reason = `╬│_VdB bounded by pocket floor ${pocketFloor.toExponential(
    2,
  )} m (wall=${wall.toExponential(2)} m, minRadius=${minRadius.toExponential(2)} m)`;
  return {
    gammaClamped,
    limit,
    admissible,
    greenBand: { min: 1, max: limit },
    pocketRadius_m,
    pocketThickness_m,
    planckMargin,
    requested: params.gammaRequested,
    reason,
  };
}

const computeVdbRegionII = (params: {
  gammaVdB: number;
  pocketRadius_m: number;
  pocketThickness_m: number;
  n?: number;
  samples?: number;
}): VdbRegionIIDiagnostics | null => {
  const gammaVdB = Number(params.gammaVdB);
  const r0 = Number(params.pocketRadius_m);
  const delta = Number(params.pocketThickness_m);
  if (!Number.isFinite(gammaVdB) || !Number.isFinite(r0) || !Number.isFinite(delta)) return null;
  if (r0 <= 0 || delta <= 0) return null;

  const alpha = Math.max(0, gammaVdB - 1);
  const n = Math.max(3, Math.round(Number.isFinite(params.n) ? (params.n as number) : VDB_PROFILE_N));
  const samples = Math.max(4, Math.floor(Number.isFinite(params.samples) ? (params.samples as number) : VDB_REGION_SAMPLES));

  let bMin = Number.POSITIVE_INFINITY;
  let bMax = Number.NEGATIVE_INFINITY;
  let bPrimeMin = Number.POSITIVE_INFINITY;
  let bPrimeMax = Number.NEGATIVE_INFINITY;
  let bDoubleMin = Number.POSITIVE_INFINITY;
  let bDoubleMax = Number.NEGATIVE_INFINITY;
  let t00Min = Number.POSITIVE_INFINITY;
  let t00Max = Number.NEGATIVE_INFINITY;
  let bPrimeSumSq = 0;
  let bDoubleSumSq = 0;
  let t00Sum = 0;
  let t00SumSq = 0;

  for (let i = 0; i < samples; i += 1) {
    const t = (i + 0.5) / samples;
    const w = Math.max(0, Math.min(1, 1 - t));
    const r = r0 + t * delta;
    const rSafe = Math.max(r, 1e-18);

    const wPowN = Math.pow(w, n);
    const wPowNMinus1 = Math.pow(w, n - 1);
    const wPowNMinus2 = Math.pow(w, n - 2);
    const wPowNMinus3 = Math.pow(w, n - 3);

    const B = 1 + alpha * (-(n - 1) * wPowN + n * wPowNMinus1);
    const dBdw = alpha * n * (n - 1) * wPowNMinus2 * (1 - w);
    const d2Bdw2 = alpha * n * (n - 1) * wPowNMinus3 * ((n - 2) - (n - 1) * w);
    const invDelta = 1 / delta;
    const Bprime = -dBdw * invDelta;
    const Bdouble = d2Bdw2 * invDelta * invDelta;

    const invB3 = 1 / (B * B * B);
    const invB4 = invB3 / B;
    const t00 =
      (1 / (8 * Math.PI)) *
      ((Bprime * Bprime) * invB4 - (2 * Bdouble) * invB3 - (4 * Bprime) * invB3 / rSafe);

    if (B < bMin) bMin = B;
    if (B > bMax) bMax = B;
    if (Bprime < bPrimeMin) bPrimeMin = Bprime;
    if (Bprime > bPrimeMax) bPrimeMax = Bprime;
    if (Bdouble < bDoubleMin) bDoubleMin = Bdouble;
    if (Bdouble > bDoubleMax) bDoubleMax = Bdouble;
    if (t00 < t00Min) t00Min = t00;
    if (t00 > t00Max) t00Max = t00;
    bPrimeSumSq += Bprime * Bprime;
    bDoubleSumSq += Bdouble * Bdouble;
    t00Sum += t00;
    t00SumSq += t00 * t00;
  }

  if (!Number.isFinite(bMin)) bMin = 0;
  if (!Number.isFinite(bMax)) bMax = 0;
  if (!Number.isFinite(bPrimeMin)) bPrimeMin = 0;
  if (!Number.isFinite(bPrimeMax)) bPrimeMax = 0;
  if (!Number.isFinite(bDoubleMin)) bDoubleMin = 0;
  if (!Number.isFinite(bDoubleMax)) bDoubleMax = 0;
  if (!Number.isFinite(t00Min)) t00Min = 0;
  if (!Number.isFinite(t00Max)) t00Max = 0;

  const bPrimeRms = Math.sqrt(bPrimeSumSq / samples);
  const bDoubleRms = Math.sqrt(bDoubleSumSq / samples);
  const t00Mean = t00Sum / samples;
  const t00Rms = Math.sqrt(t00SumSq / samples);
  const maxAbsBprime = Math.max(Math.abs(bPrimeMin), Math.abs(bPrimeMax));
  const maxAbsBdouble = Math.max(Math.abs(bDoubleMin), Math.abs(bDoubleMax));

  return {
    alpha,
    n,
    r_tilde_m: r0,
    delta_tilde_m: delta,
    sampleCount: samples,
    b_min: bMin,
    b_max: bMax,
    bprime_min: bPrimeMin,
    bprime_max: bPrimeMax,
    bprime_rms: bPrimeRms,
    bdouble_min: bDoubleMin,
    bdouble_max: bDoubleMax,
    bdouble_rms: bDoubleRms,
    t00_min: t00Min,
    t00_max: t00Max,
    t00_mean: t00Mean,
    t00_rms: t00Rms,
    support: maxAbsBprime > 0 || maxAbsBdouble > 0,
    note: "Region II only; outer f-wall not evaluated.",
  };
};

const hasVdbRegionIIMetricSupport = (
  diag: VdbRegionIIDiagnostics | null | undefined,
): boolean => {
  if (!diag || diag.support !== true) return false;
  const sampleCount = Number(diag.sampleCount);
  const t00Mean = Number(diag.t00_mean);
  const bprimeMaxAbs = Math.max(
    Math.abs(Number(diag.bprime_min)),
    Math.abs(Number(diag.bprime_max)),
  );
  const bdoubleMaxAbs = Math.max(
    Math.abs(Number(diag.bdouble_min)),
    Math.abs(Number(diag.bdouble_max)),
  );
  return (
    Number.isFinite(sampleCount) &&
    sampleCount > 0 &&
    Number.isFinite(t00Mean) &&
    Number.isFinite(bprimeMaxAbs) &&
    bprimeMaxAbs > VDB_BPRIME_MIN_ABS &&
    Number.isFinite(bdoubleMaxAbs) &&
    bdoubleMaxAbs > VDB_BDOUBLE_MIN_ABS
  );
};

const hasVdbRegionIVMetricSupport = (
  diag: VdbRegionIVDiagnostics | null | undefined,
): boolean => {
  if (!diag || diag.support !== true) return false;
  const sampleCount = Number(diag.sampleCount);
  const t00Mean = Number(diag.t00_mean);
  const dfdrMaxAbs = Math.abs(Number(diag.dfdr_max_abs));
  return (
    Number.isFinite(sampleCount) &&
    sampleCount > 0 &&
    Number.isFinite(t00Mean) &&
    Number.isFinite(dfdrMaxAbs) &&
    dfdrMaxAbs > VDB_DFDR_MIN_ABS
  );
};

const hasVdbRegionIIDerivatives = (
  diag: VdbRegionIIDiagnostics | null | undefined,
): boolean => {
  if (!diag) return false;
  const bprimeMaxAbs = Math.max(
    Math.abs(Number(diag.bprime_min)),
    Math.abs(Number(diag.bprime_max)),
  );
  const bdoubleMaxAbs = Math.max(
    Math.abs(Number(diag.bdouble_min)),
    Math.abs(Number(diag.bdouble_max)),
  );
  return (
    Number.isFinite(bprimeMaxAbs) &&
    bprimeMaxAbs > VDB_BPRIME_MIN_ABS &&
    Number.isFinite(bdoubleMaxAbs) &&
    bdoubleMaxAbs > VDB_BDOUBLE_MIN_ABS
  );
};

const buildVdbConformalDiagnostics = (
  diag: VdbRegionIIDiagnostics | null | undefined,
  betaAmplitude?: number,
): {
  bMin?: number;
  bMax?: number;
  bprimeMin?: number;
  bprimeMax?: number;
  bdoubleMin?: number;
  bdoubleMax?: number;
  betaAmplitude?: number;
} | undefined => {
  if (!diag) return undefined;
  return {
    bMin: Number.isFinite(diag.b_min) ? Number(diag.b_min) : undefined,
    bMax: Number.isFinite(diag.b_max) ? Number(diag.b_max) : undefined,
    bprimeMin: Number.isFinite(diag.bprime_min) ? Number(diag.bprime_min) : undefined,
    bprimeMax: Number.isFinite(diag.bprime_max) ? Number(diag.bprime_max) : undefined,
    bdoubleMin: Number.isFinite(diag.bdouble_min) ? Number(diag.bdouble_min) : undefined,
    bdoubleMax: Number.isFinite(diag.bdouble_max) ? Number(diag.bdouble_max) : undefined,
    betaAmplitude:
      Number.isFinite(betaAmplitude as number) && (betaAmplitude as number) >= 0
        ? Number(betaAmplitude)
        : undefined,
  };
};

const resolveBubbleWallParams = (state: EnergyPipelineState): { R: number; sigma: number } | null => {
  const bubble = (state as any)?.bubble ?? {};
  const rawR = Number.isFinite(bubble.R)
    ? Number(bubble.R)
    : Number.isFinite((state as any).R)
      ? Number((state as any).R)
      : Number.isFinite((state as any).radius)
        ? Number((state as any).radius)
        : Number.NaN;
  const rawSigma = Number.isFinite(bubble.sigma)
    ? Number(bubble.sigma)
    : Number.isFinite((state as any).sigma)
      ? Number((state as any).sigma)
      : Number.NaN;
  if (!Number.isFinite(rawR) || !Number.isFinite(rawSigma)) return null;
  const R = Math.max(1e-6, rawR);
  const sigma = Math.max(1e-6, rawSigma);
  return { R, sigma };
};

const buildVdbFallbackShiftField = (
  state: EnergyPipelineState,
): { amplitude: number; evaluateShiftVector: (x: number, y: number, z: number) => [number, number, number] } | undefined => {
  const bubble = resolveBubbleWallParams(state);
  if (!bubble) return undefined;

  const den = Math.max(1e-8, 2 * Math.tanh(bubble.sigma * bubble.R));
  const rawBeta = firstFinite(
    (state as any).beta_avg,
    Number((state as any)?.bubble?.beta),
    Number((state as any)?.beta),
    Number((state as any)?.dynamicConfig?.beta),
  );
  const amplitude = Math.max(0, Math.min(0.99, Math.abs(rawBeta ?? 0.15)));
  const driveDirection = normalizeVec(
    toFiniteVec3(
      (state as any)?.dynamicConfig?.warpDriveDirection ??
        (state as any)?.warpGeometry?.driveDirection ??
        [1, 0, 0],
      [1, 0, 0],
    ),
  );
  const evaluateShiftVector = (x: number, y: number, z: number): [number, number, number] => {
    const rs = Math.hypot(x, y, z);
    const f =
      (Math.tanh(bubble.sigma * (rs + bubble.R)) -
        Math.tanh(bubble.sigma * (rs - bubble.R))) /
      den;
    const beta = -amplitude * f;
    return [
      beta * driveDirection[0],
      beta * driveDirection[1],
      beta * driveDirection[2],
    ];
  };
  return { amplitude, evaluateShiftVector };
};

const refreshMetricT00Contract = (state: EnergyPipelineState): void => {
  const warpState = (state as any).warp as Record<string, any> | undefined;
  if (!warpState) return;
  const metricT00 = firstFinite(warpState.metricT00);
  const metricT00Source = warpState.metricT00Source ?? warpState.stressEnergySource;
  if (metricT00Source !== "metric" || metricT00 == null) return;
  const adapter = warpState.metricAdapter as WarpMetricAdapterSnapshot | undefined;
  const metricT00Ref =
    typeof warpState.metricT00Ref === "string" && warpState.metricT00Ref.length > 0
      ? String(warpState.metricT00Ref)
      : resolveCanonicalMetricT00Ref(warpState, adapter) ?? "warp.metric.T00";
  const derivation =
    typeof warpState.metricT00Derivation === "string" && warpState.metricT00Derivation.length > 0
      ? String(warpState.metricT00Derivation)
      : metricT00Ref === "warp.metric.T00.vdb.regionII"
        ? "forward_B_to_derivatives_to_rho_E"
        : metricT00Ref === "warp.metric.T00.vdb.regionIV"
          ? "forward_fwall_to_rho_E"
        : "forward_shift_to_K_to_rho_E";
  const contract = buildMetricT00Contract({
    adapter,
    metricT00Ref,
    observer:
      typeof warpState.metricT00Observer === "string"
        ? String(warpState.metricT00Observer)
        : undefined,
    normalization:
      typeof warpState.metricT00Normalization === "string"
        ? String(warpState.metricT00Normalization)
        : undefined,
    unitSystem:
      typeof warpState.metricT00UnitSystem === "string"
        ? String(warpState.metricT00UnitSystem)
        : undefined,
    derivation,
  });
  warpState.metricT00Ref = metricT00Ref;
  warpState.metricT00Derivation = derivation;
  warpState.metricT00Observer = contract.observer;
  warpState.metricT00Normalization = contract.normalization;
  warpState.metricT00UnitSystem = contract.unitSystem;
  warpState.metricT00Contract = contract;
};

const refreshMetricConstraintAudit = (state: EnergyPipelineState): void => {
  const warpState = (state as any).warp as Record<string, any> | undefined;
  if (!warpState) {
    state.metricConstraint = undefined;
    return;
  }
  const diagnostics = warpState.metricStressDiagnostics;
  const rhoGeomMean = firstFinite(diagnostics?.rhoGeomMean);
  if (rhoGeomMean == null) {
    state.metricConstraint = undefined;
    return;
  }
  const sampleCount = Number.isFinite(diagnostics?.sampleCount)
    ? Number(diagnostics.sampleCount)
    : undefined;
  const absMean = Math.abs(rhoGeomMean);
  const rho_constraint: GrConstraintDiagnostics = {
    min: rhoGeomMean,
    max: rhoGeomMean,
    maxAbs: absMean,
    rms: absMean,
    mean: rhoGeomMean,
    ...(sampleCount != null ? { sampleCount } : {}),
  };
  const adapter = warpState.metricAdapter as WarpMetricAdapterSnapshot | undefined;
  const metricT00Ref =
    typeof warpState.metricT00Ref === "string" && warpState.metricT00Ref.length > 0
      ? String(warpState.metricT00Ref)
      : resolveCanonicalMetricT00Ref(warpState, adapter) ?? "warp.metric.T00";
  const contract = warpState.metricT00Contract as MetricT00Contract | undefined;
  const observerRaw =
    (contract?.observer as string | undefined) ??
    (typeof warpState.metricT00Observer === "string"
      ? String(warpState.metricT00Observer)
      : undefined);
  const normalizationRaw =
    (contract?.normalization as string | undefined) ??
    (typeof warpState.metricT00Normalization === "string"
      ? String(warpState.metricT00Normalization)
      : undefined);
  const unitSystemRaw =
    (contract?.unitSystem as string | undefined) ??
    (typeof warpState.metricT00UnitSystem === "string"
      ? String(warpState.metricT00UnitSystem)
      : undefined);
  state.metricConstraint = {
    updatedAt: Date.now(),
    source: metricT00Ref,
    chart: adapter?.chart?.label,
    family: adapter?.family,
    observer: observerRaw,
    normalization: normalizationRaw,
    unitSystem: unitSystemRaw,
    rho_constraint,
  };
};

const refreshCl3Telemetry = (state: EnergyPipelineState): void => {
  const strict = strictCongruenceEnabled();
  const missingParts: string[] = [];
  const grConstraint = state.gr?.constraints?.rho_constraint;
  const metricConstraint = state.metricConstraint?.rho_constraint;
  const rhoConstraint = grConstraint ?? metricConstraint;
  const rhoConstraintMean = firstFinite(rhoConstraint?.mean);
  const rhoConstraintSource = grConstraint
    ? "gr.rho_constraint"
    : metricConstraint
      ? state.metricConstraint?.source
        ? `metricConstraint:${state.metricConstraint.source}`
        : "metricConstraint"
      : undefined;

  const metricDebug: EffectiveRhoDebug = {};
  const metricRhoSi = resolveMetricRhoFromState(state, metricDebug, {
    allowConstraintFallback: false,
  });
  const metricSource = metricDebug.source;
  const metricRhoGeom =
    metricRhoSi != null ? metricRhoSi * SI_TO_GEOM_STRESS : undefined;

  const pipelineRhoAvg = firstFinite(state.rho_avg);
  const pipelineRhoAvgGeom =
    pipelineRhoAvg != null ? pipelineRhoAvg * SI_TO_GEOM_STRESS : undefined;

  const deltaMetric =
    rhoConstraintMean != null && metricRhoGeom != null
      ? relDelta(rhoConstraintMean, metricRhoGeom)
      : undefined;
  const deltaPipeline =
    rhoConstraintMean != null && pipelineRhoAvgGeom != null
      ? relDelta(rhoConstraintMean, pipelineRhoAvgGeom)
      : undefined;

  const warpState = (state as any).warp as Record<string, any> | undefined;
  const metricContractStatus =
    (warpState as any)?.metricT00Contract?.status ??
    (warpState as any)?.metricT00ContractStatus ??
    (state as any)?.natario?.metricT00ContractStatus;
  const metricContractOk =
    typeof metricContractStatus === "string" ? metricContractStatus === "ok" : undefined;

  if (rhoConstraintMean == null) missingParts.push("missing_rho_constraint");
  if (metricRhoGeom == null || !metricSource) missingParts.push("missing_metric_t00");
  if (strict && metricRhoGeom != null && metricContractOk === false) {
    missingParts.push("missing_metric_contract");
  }

  const missingReason = missingParts.length
    ? missingParts.includes("missing_metric_t00")
      ? "metric_source_missing"
      : missingParts.includes("missing_metric_contract")
        ? "metric_contract_missing"
        : "constraint_rho_missing"
    : undefined;

  const gateDelta = deltaMetric;
  const gateSource =
    gateDelta != null
      ? metricSource
      : missingReason === "metric_source_missing"
        ? "metric-missing"
        : missingReason === "metric_contract_missing"
          ? "metric-contract-missing"
          : missingReason === "constraint_rho_missing"
            ? "constraint-missing"
            : "missing_inputs";
  const gatePass = gateDelta != null ? gateDelta <= DEFAULT_CL3_RHO_DELTA_MAX : false;
  const gateReason =
    gateDelta != null
      ? gatePass
        ? "within_threshold"
        : "above_threshold"
      : missingReason ?? "missing_inputs";

  state.rho_constraint = rhoConstraint;
  state.rho_constraint_source = rhoConstraintSource;
  state.rho_delta_metric_mean = deltaMetric;
  state.rho_delta_pipeline_mean = deltaPipeline;
  state.rho_delta_threshold = gateDelta != null ? DEFAULT_CL3_RHO_DELTA_MAX : undefined;
  state.rho_delta_gate = gatePass;
  state.rho_delta_gate_reason = gateReason;
  state.rho_delta_gate_source = gateSource;
  state.rho_delta_missing_parts = missingParts.length ? missingParts : undefined;
};

const refreshThetaAuditFromMetricAdapter = (state: EnergyPipelineState): void => {
  const metricBeta = (state as any).warp?.metricAdapter?.betaDiagnostics;
  const thetaGeomCandidate = metricBeta?.thetaMax ?? metricBeta?.thetaRms;
  const thetaGeom =
    Number.isFinite(thetaGeomCandidate) ? Number(thetaGeomCandidate) : undefined;
  const thetaGeomProxy = metricBeta?.method === "not-computed";
  const thetaGeomUsable = thetaGeom != null && !thetaGeomProxy;
  const thetaProxySource =
    (state as any).thetaCal != null
      ? "pipeline.thetaCal"
      : (state as any).thetaScaleExpected != null
        ? "pipeline.thetaScaleExpected"
        : undefined;
  const thetaGeomSource =
    thetaGeom != null
      ? metricBeta?.thetaMax != null
        ? "warp.metricAdapter.betaDiagnostics.thetaMax"
        : "warp.metricAdapter.betaDiagnostics.thetaRms"
      : undefined;
  const thetaProxy = (state as any).thetaCal ?? (state as any).thetaScaleExpected;
  const thetaAudit = thetaGeomUsable ? thetaGeom : thetaProxy;
  const thetaMetricReason = thetaGeomUsable
    ? "metric_adapter_divergence"
    : thetaGeom == null
      ? "missing_theta_geom"
      : "theta_geom_proxy";

  (state as any).theta_geom = thetaGeom;
  (state as any).theta_geom_source = thetaGeomSource;
  (state as any).theta_geom_proxy = thetaGeomProxy;
  (state as any).theta_proxy = thetaProxy;
  (state as any).theta_proxy_source = thetaProxySource;
  (state as any).theta_audit = thetaAudit;
  (state as any).theta_metric_derived = thetaGeomUsable;
  (state as any).theta_metric_source = thetaGeomUsable ? thetaGeomSource : undefined;
  (state as any).theta_metric_reason = thetaMetricReason;
  (state as any).theta_source = thetaGeomUsable ? thetaGeomSource : thetaProxySource;
  if ((state as any).uniformsExplain?.thetaAudit) {
    (state as any).uniformsExplain.thetaAudit.thetaGeom = thetaGeom;
    (state as any).uniformsExplain.thetaAudit.thetaGeomSource =
      (state as any).theta_geom_source;
    (state as any).uniformsExplain.thetaAudit.thetaGeomProxy =
      (state as any).theta_geom_proxy;
    (state as any).uniformsExplain.thetaAudit.thetaAudit = thetaAudit;
    (state as any).uniformsExplain.thetaAudit.thetaMetricDerived = thetaGeomUsable;
    (state as any).uniformsExplain.thetaAudit.thetaMetricReason = thetaMetricReason;
  }
};

const refreshCongruenceMeta = (state: EnergyPipelineState): void => {
  const warpState = (state as any).warp as Record<string, any> | undefined;
  const metricT00 = firstFinite(
    warpState?.metricT00,
    warpState?.metricStressEnergy?.T00,
    warpState?.stressEnergyTensor?.T00,
  );
  const metricSource =
    warpState?.metricT00Source ??
    warpState?.metricStressSource ??
    warpState?.stressEnergySource;
  const metricMode = metricSource === "metric" && metricT00 != null;
  const curvatureSource = metricMode ? "metric" : state ? "pipeline" : "unknown";
  const curvatureCongruence = metricMode ? "conditional" : "proxy-only";
  const curvatureProxy = curvatureCongruence !== "geometry-derived";

  const stressSource =
    warpState?.stressEnergySource ??
    (state as any)?.stressEnergySource ??
    (state as any)?.metricStressSource;
  const stressMetricMode = stressSource === "metric";
  const stressMetaSource = stressMetricMode ? "metric" : state ? "pipeline" : "unknown";
  const stressMetaCongruence = stressMetricMode ? "conditional" : "proxy-only";
  const stressMetaProxy = stressMetaCongruence !== "geometry-derived";

  state.curvatureMeta = {
    source: curvatureSource,
    congruence: curvatureCongruence,
    proxy: curvatureProxy,
  };
  state.stressMeta = {
    source: stressMetaSource,
    congruence: stressMetaCongruence,
    proxy: stressMetaProxy,
  };
};

const refreshUniversalCoverageStatus = (state: EnergyPipelineState): void => {
  const missing: string[] = [];
  const warpState = (state as any).warp as Record<string, any> | undefined;
  const metricT00 = firstFinite(
    warpState?.metricT00,
    warpState?.metricStressEnergy?.T00,
    warpState?.stressEnergyTensor?.T00,
  );
  const metricSource =
    warpState?.metricT00Source ?? warpState?.metricStressSource ?? warpState?.stressEnergySource;
  const metricMode = metricSource === "metric" && metricT00 != null;
  if (!metricMode) missing.push("missing_metric_t00");

  const metricContractStatus =
    (warpState as any)?.metricT00Contract?.status ??
    (warpState as any)?.metricT00ContractStatus ??
    (state as any)?.natario?.metricT00ContractStatus;
  if (metricMode && metricContractStatus !== "ok") {
    missing.push("missing_metric_contract");
  }

  const chartContractStatus =
    (warpState as any)?.metricAdapter?.chart?.contractStatus ??
    (warpState as any)?.metricAdapter?.chart?.contract_status;
  if (metricMode && chartContractStatus !== "ok") {
    missing.push("missing_chart_contract");
  }

  const thetaMetricDerived = (state as any).theta_metric_derived === true;
  if (!thetaMetricDerived) missing.push("missing_theta_geom");

  const rhoConstraint = state.rho_constraint ?? state.metricConstraint?.rho_constraint;
  if (!Number.isFinite(rhoConstraint?.mean)) missing.push("missing_rho_constraint");

  const gammaVdB = Number(state.gammaVanDenBroeck);
  if (Number.isFinite(gammaVdB) && gammaVdB > 1) {
    const vdbRegionIIDeriv = (state as any).vdb_region_ii_derivative_support === true;
    const vdbRegionIVDeriv = (state as any).vdb_region_iv_derivative_support === true;
    const vdbTwoWallDeriv = (state as any).vdb_two_wall_derivative_support === true;
    if (!vdbRegionIIDeriv) missing.push("missing_vdb_region_ii_derivatives");
    if (!vdbRegionIVDeriv) missing.push("missing_vdb_region_iv_derivatives");
    if (!vdbTwoWallDeriv) missing.push("missing_vdb_two_wall_derivatives");
  }

  (state as any).congruence_missing_parts = missing.length ? missing : undefined;
  (state as any).congruence_missing_count = missing.length;
  (state as any).congruence_missing_reason = missing.length ? missing[0] : undefined;
};

const computeVdbRegionIV = (params: {
  R: number;
  sigma: number;
  beta?: number;
  samples?: number;
}): VdbRegionIVDiagnostics | null => {
  const R = Number(params.R);
  const sigma = Number(params.sigma);
  if (!Number.isFinite(R) || !Number.isFinite(sigma)) return null;
  if (R <= 0 || sigma <= 0) return null;
  const rawBeta = Number.isFinite(params.beta) ? Number(params.beta) : Number.NaN;
  const amplitude =
    Number.isFinite(rawBeta)
      ? Math.max(0, Math.min(0.99, Math.abs(rawBeta)))
      : Math.max(0, Math.min(0.99, 0.15));
  const samples = Math.max(4, Math.floor(Number.isFinite(params.samples) ? (params.samples as number) : VDB_REGION_SAMPLES));
  const span = 3 / sigma;
  const rMin = Math.max(0, R - span);
  const rMax = R + span;
  const den = Math.max(1e-8, 2 * Math.tanh(sigma * R));
  const sech2 = (x: number) => {
    const c = Math.cosh(x);
    return c === 0 ? 0 : 1 / (c * c);
  };
  const dTopHatDr = (r: number) =>
    sigma * (sech2(sigma * (r + R)) - sech2(sigma * (r - R))) / den;

  let maxAbs = 0;
  let sumSq = 0;
  let t00Min = Number.POSITIVE_INFINITY;
  let t00Max = Number.NEGATIVE_INFINITY;
  let t00Sum = 0;
  let t00SumSq = 0;
  let traceSum = 0;
  let kSquaredSum = 0;
  const yOverR = 1 / Math.sqrt(2);
  const zOverR = yOverR;
  for (let i = 0; i < samples; i += 1) {
    const t = (i + 0.5) / samples;
    const r = rMin + (rMax - rMin) * t;
    const dfdr = dTopHatDr(r);
    const abs = Math.abs(dfdr);
    if (abs > maxAbs) maxAbs = abs;
    sumSq += dfdr * dfdr;
    const Kxx = -amplitude * dfdr;
    const Kxy = -0.5 * amplitude * dfdr * yOverR;
    const Kxz = -0.5 * amplitude * dfdr * zOverR;
    const trace = Kxx;
    const kSquared = Kxx * Kxx + 2 * (Kxy * Kxy + Kxz * Kxz);
    const rhoGeom = (trace * trace - kSquared) * INV16PI;
    if (rhoGeom < t00Min) t00Min = rhoGeom;
    if (rhoGeom > t00Max) t00Max = rhoGeom;
    t00Sum += rhoGeom;
    t00SumSq += rhoGeom * rhoGeom;
    traceSum += trace;
    kSquaredSum += kSquared;
  }
  const rms = Math.sqrt(sumSq / samples);
  const t00Mean = t00Sum / samples;
  const t00Rms = Math.sqrt(t00SumSq / samples);
  const kTraceMean = traceSum / samples;
  const kSquaredMean = kSquaredSum / samples;
  if (!Number.isFinite(t00Min)) t00Min = 0;
  if (!Number.isFinite(t00Max)) t00Max = 0;
  return {
    R_m: R,
    sigma,
    sampleCount: samples,
    dfdr_max_abs: maxAbs,
    dfdr_rms: rms,
    beta: amplitude,
    r_min_m: rMin,
    r_max_m: rMax,
    step_m: (rMax - rMin) / samples,
    t00_min: t00Min,
    t00_max: t00Max,
    t00_mean: t00Mean,
    t00_rms: t00Rms,
    k_trace_mean: kTraceMean,
    k_squared_mean: kSquaredMean,
    support: maxAbs > 0,
    note: Number.isFinite(rawBeta)
      ? "Region IV f-wall derivative sample around R."
      : "Region IV f-wall derivative sample around R (beta defaulted).",
  };
};

export function appendSweepRows(rows: VacuumGapSweepRow[]) {
  if (!rows.length) return;
  sweepHistoryTotal += rows.length;
  sweepHistory.push(...rows);
  if (sweepHistory.length > SWEEP_HISTORY_MAX) {
    const over = sweepHistory.length - SWEEP_HISTORY_MAX;
    sweepHistory.splice(0, over);
    sweepHistoryDropped += over;
  }
}

export function getSweepHistoryTotals(): SweepHistoryTotals {
  return {
    visible: sweepHistory.length,
    total: sweepHistoryTotal,
    dropped: sweepHistoryDropped,
  };
}
const SWEEP_TOP_LIMIT = 10;

function deriveMeasuredPumpFrequency(rows: VacuumGapSweepRow[]): number | undefined {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const candidates = rows.filter(
    (row) => Number.isFinite(row.Omega_GHz) && typeof row.Omega_GHz === "number",
  );
  if (!candidates.length) return undefined;
  const stable = candidates.filter((row) => row.stable !== false && row.status !== "UNSTABLE");
  const source = stable.length ? stable : candidates;
  const stats = new Map<number, { count: number; gainSum: number }>();
  for (const row of source) {
    const freq = Number(row.Omega_GHz);
    if (!Number.isFinite(freq) || freq <= 0) continue;
    const key = Number(freq.toFixed(6));
    const entry = stats.get(key);
    if (entry) {
      entry.count += 1;
      entry.gainSum += Number(row.G ?? 0);
    } else {
      stats.set(key, { count: 1, gainSum: Number(row.G ?? 0) });
    }
  }
  if (!stats.size) {
    const fallback = source[0]?.Omega_GHz;
    return Number.isFinite(fallback) && (fallback ?? 0) > 0 ? Number(fallback) : undefined;
  }
  let bestKey: number | undefined;
  let bestCount = -1;
  let bestAvg = -Infinity;
  for (const [key, value] of stats) {
    const avg = value.gainSum / Math.max(1, value.count);
    if (value.count > bestCount || (value.count === bestCount && avg > bestAvg)) {
      bestKey = key;
      bestCount = value.count;
      bestAvg = avg;
    }
  }
  if (bestKey != null) return bestKey;
  const fallback = source[0]?.Omega_GHz;
  return Number.isFinite(fallback) && (fallback ?? 0) > 0 ? Number(fallback) : undefined;
}

function dedupeNumericList(values: number[], digits = 4): number[] {
  if (!Array.isArray(values) || !values.length) return [];
  const scale = 10 ** digits;
  const unique = new Set<number>();
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    const rounded = Math.round(value * scale) / scale;
    if (!Number.isFinite(rounded)) continue;
    unique.add(rounded);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

function mechanicalFeasibility(
  state: EnergyPipelineState,
  tileArea_m2: number,
  safetyFactorMin: number,
  opts?: {
    elasticModulus_Pa?: number;
    thickness_m?: number;
    spanScale?: number;
  },
): MechanicalFeasibility {
  const requestedGap_nm = Number.isFinite(state.gap_nm) ? Number(state.gap_nm) : 1;
  const requestedStroke_pm = Number.isFinite((state as any).strokeAmplitude_pm)
    ? Number((state as any).strokeAmplitude_pm)
    : Number.isFinite((state as any).strokeAmplitudePm)
      ? Number((state as any).strokeAmplitudePm)
      : Number.isFinite(state.dynamicConfig?.strokeAmplitudePm)
        ? Number(state.dynamicConfig?.strokeAmplitudePm)
        : 0;

  const area_m2 = Math.max(1e-9, tileArea_m2);
  const spanScale = Number.isFinite(opts?.spanScale) ? Math.max(1e-3, opts!.spanScale as number) : 1;
  const span_m = Math.sqrt(area_m2) * spanScale; // treat tile as square plate for stiffness budget
  const stroke_m = Math.max(0, requestedStroke_pm * 1e-12);
  const roughnessGuard_nm = Math.max(0, MECH_ROUGHNESS_RMS_NM * MECH_ROUGHNESS_SIGMA);
  const roughnessGuard_m = roughnessGuard_nm * NM_TO_M;

  const thickness_m = Number.isFinite(opts?.thickness_m) ? Math.max(1e-9, opts!.thickness_m as number) : MECH_TILE_THICKNESS_M;
  const elasticModulus_Pa = Number.isFinite(opts?.elasticModulus_Pa)
    ? Math.max(1e6, opts!.elasticModulus_Pa as number)
    : MECH_ELASTIC_MODULUS_PA;
  const D =
    elasticModulus_Pa *
    Math.pow(Math.max(1e-9, thickness_m), 3) /
    (12 * (1 - MECH_POISSON * MECH_POISSON));

  const sigmaAllow_Pa = MECH_YIELD_STRESS_PA / Math.max(1e-6, MECH_SAFETY_FACTOR_DESIGN);
  const safetyFloor = Math.max(1e-6, safetyFactorMin);

  const calcForGap = (gap_nm: number) => {
    const gap_m = Math.max(1e-12, gap_nm * NM_TO_M);
    const casimirPressure_Pa = (Math.PI * Math.PI * HBAR_C) / (240 * Math.pow(gap_m, 4));
    const electrostaticPressure_Pa = 0.5 * EPSILON_0 * Math.pow(MECH_PATCH_V_RMS / gap_m, 2);
    const totalLoad_Pa = casimirPressure_Pa + electrostaticPressure_Pa;
    const mechSafetyFactor = sigmaAllow_Pa / Math.max(totalLoad_Pa, 1e-12);
    const safetyFeasible = mechSafetyFactor >= safetyFloor;

    const clearance_m = Math.max(0, gap_m - roughnessGuard_m - stroke_m);
    const restoringPressure_Pa =
      clearance_m > 0 && D > 0
        ? (D * clearance_m) / (MECH_DEFLECTION_COEFF * Math.pow(span_m, 4))
        : 0;
    const margin_Pa = restoringPressure_Pa - totalLoad_Pa;

    const deflectionForLoad_m =
      (totalLoad_Pa * MECH_DEFLECTION_COEFF * Math.pow(span_m, 4)) / Math.max(D, 1e-30);
    const strokeBudget_m = Math.max(0, gap_m - roughnessGuard_m - deflectionForLoad_m);
    const maxStroke_pm = strokeBudget_m * 1e12;
    const strokeFeasible = requestedStroke_pm <= maxStroke_pm + 1e-9;

    let note: string | undefined;
    if (!safetyFeasible) {
      note = "Casimir load exceeds allowable stress budget";
    } else if (clearance_m <= 0) {
      note = "Stroke + roughness exceed available gap";
    } else if (margin_Pa <= 0) {
      note = "Restoring stiffness is below Casimir + patch load";
    } else if (!strokeFeasible) {
      note = "Commanded stroke exceeds stiffness budget";
    }

    const feasible = clearance_m > 0 && safetyFeasible && strokeFeasible && margin_Pa >= 0;

    return {
      gap_nm,
      casimirPressure_Pa,
      electrostaticPressure_Pa,
      totalLoad_Pa,
      mechSafetyFactor,
      safetyFeasible,
      clearance_m,
      restoringPressure_Pa,
      margin_Pa,
      deflectionForLoad_m,
      maxStroke_pm,
      strokeFeasible,
      feasible,
      note,
    };
  };

  const sweep: NonNullable<MechanicalFeasibility["sweep"]> = [];
  for (
    let g = MECH_GAP_SWEEP.min_nm;
    g <= MECH_GAP_SWEEP.max_nm + 1e-9;
    g += MECH_GAP_SWEEP.step_nm
  ) {
    const calc = calcForGap(g);
    sweep.push({ gap_nm: g, margin_Pa: calc.margin_Pa, feasible: calc.feasible });
  }

  const firstFeasible = sweep.find((row) => row.feasible);
  const minGap_nm = Math.max(
    roughnessGuard_nm,
    firstFeasible ? firstFeasible.gap_nm : requestedGap_nm,
  );
  const recommendedGap_nm = Math.max(requestedGap_nm, minGap_nm);
  const applied = calcForGap(recommendedGap_nm);

  return {
    requestedGap_nm,
    requestedStroke_pm,
    recommendedGap_nm,
    minGap_nm,
    maxStroke_pm: applied.maxStroke_pm,
    casimirPressure_Pa: applied.casimirPressure_Pa,
    electrostaticPressure_Pa: applied.electrostaticPressure_Pa,
    restoringPressure_Pa: applied.restoringPressure_Pa,
    roughnessGuard_nm,
    margin_Pa: applied.margin_Pa,
    safetyFactorMin,
    mechSafetyFactor: applied.mechSafetyFactor,
    sigmaYield_Pa: MECH_YIELD_STRESS_PA,
    sigmaAllow_Pa,
    loadPressure_Pa: applied.totalLoad_Pa,
    safetyFeasible: applied.safetyFeasible,
    feasible: applied.feasible,
    strokeFeasible: applied.strokeFeasible,
    note: applied.note,
    sweep,
  };
}

function toSweepPoint(row: VacuumGapSweepRow): SweepPoint {
  return {
    d_nm: row.d_nm,
    m: row.m,
    phi_deg: row.phi_deg,
    Omega_GHz: row.Omega_GHz,
    G: row.G,
    QL: row.QL ?? row.QL_base ?? undefined,
    stable: row.stable,
    status: row.status,
    detune_MHz: row.detune_MHz,
    kappa_MHz: row.kappa_MHz,
    kappaEff_MHz: row.kappaEff_MHz,
    pumpRatio: row.pumpRatio,
    plateau: !!row.plateau,
  };
}

function upsertTopRows(
  rows: VacuumGapSweepRow[],
  candidate: VacuumGapSweepRow,
  limit = SWEEP_TOP_LIMIT,
): VacuumGapSweepRow[] {
  const next = rows.concat(candidate);
  next.sort((a, b) => {
    const gainDiff = b.G - a.G;
    if (Math.abs(gainDiff) > 1e-6) return gainDiff;
    const qlA = a.QL ?? a.QL_base ?? 0;
    const qlB = b.QL ?? b.QL_base ?? 0;
    return qlB - qlA;
  });
  if (next.length > limit) {
    next.length = limit;
  }
  return next;
}

function ensureDefaultSweepConfig(state: EnergyPipelineState) {
  if (!state.dynamicConfig) state.dynamicConfig = {};
  if (!state.dynamicConfig.sweep) {
    const sweepDefaults = DEFAULT_GEOMETRY_SWEEP;
    state.dynamicConfig.sweep = {
      ...sweepDefaults,
      gaps_nm: [...sweepDefaults.gaps_nm],
      mod_depth_pct: sweepDefaults.mod_depth_pct ? [...sweepDefaults.mod_depth_pct] : [],
      pump_freq_GHz:
        typeof sweepDefaults.pump_freq_GHz === "string"
          ? sweepDefaults.pump_freq_GHz
          : sweepDefaults.pump_freq_GHz
          ? [...sweepDefaults.pump_freq_GHz]
          : [],
      phase_deg: sweepDefaults.phase_deg ? [...sweepDefaults.phase_deg] : [],
      plateau: sweepDefaults.plateau ? { ...sweepDefaults.plateau } : undefined,
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

const roundToStep = (value: number, step: number) =>
  step > 0 ? Math.round(value / step) * step : value;

type RidgeScore = {
  key: { d_nm: number; m: number; Omega_GHz: number };
  plateauWidth: number;
  Gcrest: number;
  QL: number;
  crestPhiDeg: number;
};

function rankRidges(rows: VacuumGapSweepRow[]): RidgeScore[] {
  const groups = new Map<string, VacuumGapSweepRow[]>();
  for (const row of rows) {
    const key = `${row.d_nm}|${row.m}|${row.Omega_GHz}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const scored: RidgeScore[] = [];
  for (const bucket of groups.values()) {
    const crest = bucket.find((r) => r.crest) ?? bucket.reduce((best, row) => (row.G > best.G ? row : best), bucket[0]);
    if (!crest) continue;
    scored.push({
      key: { d_nm: crest.d_nm, m: crest.m, Omega_GHz: crest.Omega_GHz },
      plateauWidth: crest.plateau?.width_deg ?? 0,
      Gcrest: crest.G,
      QL: crest.QL ?? crest.QL_base ?? 0,
      crestPhiDeg: crest.phi_deg,
    });
  }

  scored.sort((a, b) => {
    const widthDiff = b.plateauWidth - a.plateauWidth;
    if (Math.abs(widthDiff) > 1e-6) return widthDiff;
    const gainDiff = b.Gcrest - a.Gcrest;
    if (Math.abs(gainDiff) > 1e-6) return gainDiff;
    return (b.QL ?? 0) - (a.QL ?? 0);
  });
  return scored;
}

export async function orchestrateVacuumGapSweep(state: EnergyPipelineState): Promise<VacuumGapSweepRow[] | void> {
  ensureDefaultSweepConfig(state);

  if (!state.sweep) {
    state.sweep = { active: false, top: [], last: null };
  } else {
    state.sweep.top ??= [];
    state.sweep.last ??= null;
  }
  const sweepRuntime = state.sweep;

  const dynamicConfig = state.dynamicConfig;
  const runCfg = defaultSweepConfigFromDynamic(dynamicConfig);
  if (!runCfg) {
    sweepRuntime.active = false;
    sweepRuntime.cancelRequested = false;
    return;
  }

  const hardwareProfileSeed =
    ((state.dynamicConfig?.sweep as any)?.hardwareProfile as Record<string, unknown> | undefined) ??
    runCfg.hardwareProfile ??
    {};
  const pumpFreqLimit_GHz = normalizePumpFreqLimit(
    (hardwareProfileSeed as any).pumpFreqLimit_GHz ?? (runCfg as any).pumpFreqLimit_GHz,
  );
  const pumpGuardStats: PumpGuardStats = { clamped: 0, rejected: 0 };
  runCfg.pumpFreqLimit_GHz = pumpFreqLimit_GHz;
  runCfg.hardwareProfile = {
    ...(runCfg.hardwareProfile ?? {}),
    pumpFreqLimit_GHz,
  };
  if (Array.isArray(runCfg.pump_freq_GHz) && runCfg.pump_freq_GHz.length) {
    runCfg.pump_freq_GHz = sanitizePumpFrequencies(runCfg.pump_freq_GHz, pumpFreqLimit_GHz, pumpGuardStats);
  }

  let gateAnalytics: GateAnalytics | null = null;
  const gateAnalyticsSink = (analytics: GateAnalytics | null) => {
    gateAnalytics = analytics ?? null;
  };

  if (runCfg.activeSlew) {
    const hardwareProfile = (state.dynamicConfig?.sweep as any)?.hardwareProfile ?? {};
    const gapLimit = resolveActiveSlewLimit(
      hardwareProfile?.gapLimit,
      ACTIVE_SLEW_LIMITS.gaps,
      1,
      runCfg.gaps_nm.length,
    );
    const modDepthLimit = resolveActiveSlewLimit(
      hardwareProfile?.modDepthLimit,
      ACTIVE_SLEW_LIMITS.modDepth,
      1,
      runCfg.mod_depth_pct.length,
    );
    const phaseLimit = resolveActiveSlewLimit(
      hardwareProfile?.phaseLimit,
      ACTIVE_SLEW_LIMITS.phase,
      1,
      runCfg.phase_deg.length,
    );
    const pumpLimit = resolveActiveSlewLimit(
      hardwareProfile?.pumpLimit,
      ACTIVE_SLEW_LIMITS.pump,
      1,
      runCfg.pump_freq_GHz.length || 1,
    );

    runCfg.gaps_nm = pickRepresentativeValues(runCfg.gaps_nm, gapLimit);
    runCfg.mod_depth_pct = pickRepresentativeValues(runCfg.mod_depth_pct, modDepthLimit);
    runCfg.phase_deg = pickRepresentativeValues(runCfg.phase_deg, phaseLimit);
    if (Array.isArray(runCfg.pump_freq_GHz) && runCfg.pump_freq_GHz.length) {
      runCfg.pump_freq_GHz = pickRepresentativeValues(runCfg.pump_freq_GHz, pumpLimit);
      runCfg.pump_freq_GHz = sanitizePumpFrequencies(runCfg.pump_freq_GHz, pumpFreqLimit_GHz, pumpGuardStats);
    }

    const requestedDelay =
      hardwareProfile?.delayMs ?? hardwareProfile?.slewDelayMs ?? runCfg.slewDelayMs ?? ACTIVE_SLEW_LIMITS.delayMs;
    runCfg.slewDelayMs = Math.max(0, Number.isFinite(requestedDelay) ? Number(requestedDelay) : ACTIVE_SLEW_LIMITS.delayMs);

    const sweepConfig = state.dynamicConfig?.sweep;
    if (sweepConfig) {
      sweepConfig.slewDelayMs = runCfg.slewDelayMs;
      sweepConfig.hardwareProfile = {
        ...(sweepConfig.hardwareProfile ?? {}),
        gapLimit,
        modDepthLimit,
        phaseLimit,
        pumpLimit,
        pumpFreqLimit_GHz,
        delayMs: runCfg.slewDelayMs,
      };
      sweepConfig.gaps_nm = [...runCfg.gaps_nm];
      sweepConfig.mod_depth_pct = [...runCfg.mod_depth_pct];
      sweepConfig.phase_deg = [...runCfg.phase_deg];
      if (Array.isArray(runCfg.pump_freq_GHz) && sweepConfig.pump_freq_GHz !== "auto") {
        sweepConfig.pump_freq_GHz = [...runCfg.pump_freq_GHz];
      }
      sweepConfig.activeSlew = true;
      if (runCfg.twoPhase !== undefined) {
        (sweepConfig as any).twoPhase = runCfg.twoPhase;
      }
    }
    sweepRuntime.activeSlew = true;
  } else if (sweepRuntime) {
    sweepRuntime.activeSlew = false;
  }

  if (pumpGuardStats.clamped > 0 && DEBUG_PIPE) {
    console.warn(
      `[PIPELINE] pump frequency guard limited ${pumpGuardStats.clamped} step(s) to <= ${pumpFreqLimit_GHz.toFixed(3)} GHz`,
    );
  }

  const geometry = runCfg.geometry ?? "cpw";
  const gammaGeo = runCfg.gamma_geo ?? state.gammaGeo ?? 1e-3;
  const base_f0 =
    runCfg.base_f0_GHz ??
    (typeof (dynamicConfig as any)?.base_f0_GHz === "number"
      ? (dynamicConfig as any).base_f0_GHz
      : state.modulationFreq_GHz
      ? state.modulationFreq_GHz / 2
      : 6);
  const Qc = runCfg.Qc ?? state.qCavity ?? 5e5;
  const T_K = runCfg.T_K ?? state.temperature_K ?? 2;

  const ctx = { geom: geometry, gammaGeo, base_f0_GHz: base_f0, Qc, T_K };
  const phaseLog =
    Array.isArray(dynamicConfig?.phase_deg)
      ? (dynamicConfig?.phase_deg as number[])[0] ?? 0
      : (dynamicConfig?.phase_deg as number) ?? 0;
  const pumpArray = Array.isArray(runCfg.pump_freq_GHz) ? runCfg.pump_freq_GHz : [];
  const pumpLogBaseSource = pumpArray.length ? pumpArray[0] : base_f0 * 2;
  const pumpLogBase = Math.min(pumpFreqLimit_GHz, pumpLogBaseSource);

  const logSweep = async (
    rows: VacuumGapSweepRow[],
    meta: Record<string, unknown>,
    pumpHz?: number,
  ) => {
    if (!rows.length) return;
    const pumpForLog = pumpHz ?? pumpLogBase;
    try {
      await appendPhaseCalibrationLog({
        phase_deg_set: phaseLog,
        pump_freq_GHz: pumpForLog,
        rows: rows.slice(0, 512),
        meta: {
          geometry,
          gamma_geo: gammaGeo,
          base_f0_GHz: base_f0,
          ...meta,
        },
      });
    } catch (err) {
      if (DEBUG_PIPE) console.warn("[PIPELINE] phase-calibration log append failed:", err);
    }
  };

  if (runCfg.activeSlew) {
    const delayMs =
      Number.isFinite(runCfg.slewDelayMs) && runCfg.slewDelayMs != null
        ? Math.max(0, runCfg.slewDelayMs)
        : 50;
    let modDepthList =
      runCfg.mod_depth_pct && runCfg.mod_depth_pct.length ? [...runCfg.mod_depth_pct] : [0.5];
    const phaseList = runCfg.phase_deg && runCfg.phase_deg.length ? runCfg.phase_deg : [0];

    const autoPumpForGap = (d_nm: number) => {
      const d_m = d_nm * 1e-9;
      const f0_auto = omega0_from_gap(d_m, base_f0, geometry, gammaGeo);
      return sanitizePumpFrequencies([2 * f0_auto], pumpFreqLimit_GHz);
    };

    const defaultPumpListForGap = (d_nm: number) => {
      if (runCfg.pumpStrategy === "auto") {
        return autoPumpForGap(d_nm);
      }
      if (Array.isArray(runCfg.pump_freq_GHz) && runCfg.pump_freq_GHz.length) {
        return sanitizePumpFrequencies(runCfg.pump_freq_GHz, pumpFreqLimit_GHz);
      }
      if (typeof runCfg.pump_freq_GHz === "number") {
        return sanitizePumpFrequencies([runCfg.pump_freq_GHz], pumpFreqLimit_GHz);
      }
      return sanitizePumpFrequencies([2 * base_f0], pumpFreqLimit_GHz);
    };

    let twoPhaseEnabled =
      runCfg.twoPhase === true ||
      (runCfg.twoPhase !== false && runCfg.pumpStrategy === "auto");
    if (!modDepthList.length || !phaseList.length) {
      twoPhaseEnabled = false;
    }

    const primePumpResolver = twoPhaseEnabled ? autoPumpForGap : defaultPumpListForGap;
    const computePhaseTotal = (resolver: (gap: number) => number[], depths: number[]) => {
      let total = 0;
      for (const d_nm of runCfg.gaps_nm) {
        const pumpList = sanitizePumpFrequencies(resolver(d_nm), pumpFreqLimit_GHz);
        total += depths.length * pumpList.length * phaseList.length;
      }
      return total;
    };

    const primeSteps = computePhaseTotal(primePumpResolver, modDepthList);
    const refineSteps = twoPhaseEnabled
      ? runCfg.gaps_nm.length * modDepthList.length * phaseList.length
      : 0;
    let totalSteps = primeSteps + refineSteps;

    sweepRuntime.active = totalSteps > 0;
    sweepRuntime.startedAt = Date.now();
    sweepRuntime.completedAt = undefined;
    sweepRuntime.cancelRequested = false;
    sweepRuntime.cancelled = false;
    sweepRuntime.iter = 0;
    sweepRuntime.total = totalSteps;
    sweepRuntime.etaMs = totalSteps > 0 ? undefined : 0;
    sweepRuntime.slewDelayMs = delayMs;
    sweepRuntime.top = [];
    sweepRuntime.last = null;

    if (totalSteps <= 0) {
      state.vacuumGapSweepResults = [];
      state.gateAnalytics = gateAnalytics;
      return;
    }

    const primeRows: VacuumGapSweepRow[] = [];
    const refineRows: VacuumGapSweepRow[] = [];
    let topRows: VacuumGapSweepRow[] = [];
    let lastAcceptedRow: VacuumGapSweepRow | null = null;
    let cancelled = false;

    const updateEta = () => {
      if (sweepRuntime.total && sweepRuntime.iter) {
        const elapsed = Date.now() - (sweepRuntime.startedAt ?? Date.now());
        const remaining = Math.max(0, sweepRuntime.total - sweepRuntime.iter);
        sweepRuntime.etaMs =
          sweepRuntime.iter > 0
            ? Math.max(0, Math.round((elapsed / Math.max(1, sweepRuntime.iter)) * remaining))
            : undefined;
      } else {
        sweepRuntime.etaMs = undefined;
      }
    };

    const runPhase = async (
      phaseLabel: "prime" | "refine",
      pumpResolver: (gap: number) => number[],
      rowsCollector: VacuumGapSweepRow[],
      depths: number[],
    ) => {
      for (const d_nm of runCfg.gaps_nm) {
        const pumpList = sanitizePumpFrequencies(pumpResolver(d_nm), pumpFreqLimit_GHz, pumpGuardStats);
        if (!pumpList.length) continue;
        for (const m_pct of depths) {
          const m = m_pct / 100;
          for (const pumpHz of pumpList) {
            const phaseRows: VacuumGapSweepRow[] = [];
            for (const phase of phaseList) {
              if (state.sweep?.cancelRequested) {
                cancelled = true;
                return;
              }

              await slewPump({ f_Hz: pumpHz * 1e9, m, phi_deg: phase });
              const row = computeSweepPoint({ d_nm, m, Omega_GHz: pumpHz, phi_deg: phase }, ctx);

              sweepRuntime.iter = (sweepRuntime.iter ?? 0) + 1;
              sweepRuntime.last = toSweepPoint(row);
              updateEta();

              if (row.G > (runCfg.maxGain_dB ?? 15) && (row.QL ?? Infinity) < (runCfg.minQL ?? 1e3)) {
                continue;
              }

              phaseRows.push(row);
              rowsCollector.push(row);
              appendSweepRows([row]);
              topRows = upsertTopRows(topRows, row);
              sweepRuntime.top = topRows.map(toSweepPoint);
              lastAcceptedRow = row;
              state.vacuumGapSweepResults = rowsCollector.slice();
              if (delayMs > 0) await sleep(delayMs);
            }
            if (cancelled) {
              return;
            }
            if (phaseRows.length) {
              phaseRows.sort((a, b) => a.phi_deg - b.phi_deg);
              detectPlateau(phaseRows, runCfg);
              sweepRuntime.top = topRows.map(toSweepPoint);
              const latest = lastAcceptedRow ?? phaseRows[phaseRows.length - 1];
              sweepRuntime.last = latest ? toSweepPoint(latest) : sweepRuntime.last ?? null;
            }
          }
        }
      }
    };

    state.vacuumGapSweepResults = [];
    await runPhase("prime", primePumpResolver, primeRows, modDepthList);

    let derivedPumpGHz: number | undefined;
    let refineModDepthList = modDepthList.slice();
    if (!cancelled && twoPhaseEnabled) {
      const rowsForScaling = primeRows.filter(
        (row) =>
          row &&
          typeof row.pumpRatio === "number" &&
          Number.isFinite(row.pumpRatio) &&
          typeof row.m === "number" &&
          row.m > 0,
      );
      if (rowsForScaling.length) {
        let modDepthScale = 1;
        for (const row of rowsForScaling) {
          const rho = Number(row.pumpRatio);
          if (!Number.isFinite(rho) || rho <= 0) continue;
          if (rho > TWO_PHASE_TARGET_RHO) {
            modDepthScale = Math.min(modDepthScale, TWO_PHASE_TARGET_RHO / rho);
          }
        }
        if (modDepthScale < 1) {
          refineModDepthList = dedupeNumericList(
            modDepthList.map((pct) =>
              Math.max(TWO_PHASE_MIN_MOD_DEPTH_PCT, pct * modDepthScale),
            ),
            4,
          );
        }
      }
      if (!refineModDepthList.length) {
        refineModDepthList = [TWO_PHASE_MIN_MOD_DEPTH_PCT];
      }
      derivedPumpGHz = deriveMeasuredPumpFrequency(primeRows);
      if (Number.isFinite(derivedPumpGHz) && (derivedPumpGHz ?? 0) > 0) {
        const sanitized = sanitizePumpFrequencies([Number(derivedPumpGHz)], pumpFreqLimit_GHz, pumpGuardStats);
        derivedPumpGHz = sanitized.length ? sanitized[0] : derivedPumpGHz;
      }
      if (!Number.isFinite(derivedPumpGHz) || (derivedPumpGHz ?? 0) <= 0) {
        twoPhaseEnabled = false;
        sweepRuntime.total = primeSteps;
        totalSteps = primeSteps;
        updateEta();
      } else {
        const adjustedTotal =
          primeSteps + runCfg.gaps_nm.length * refineModDepthList.length * phaseList.length;
        sweepRuntime.total = adjustedTotal;
        totalSteps = adjustedTotal;
        updateEta();
      }
    }

    if (!cancelled && twoPhaseEnabled && derivedPumpGHz != null) {
      topRows = [];
      state.vacuumGapSweepResults = [];
      const refinePumpList = sanitizePumpFrequencies(
        [Number(derivedPumpGHz)],
        pumpFreqLimit_GHz,
        pumpGuardStats,
      );
      if (!refinePumpList.length) {
        cancelled = true;
      } else {
        const pumpValue = refinePumpList[0];
        await runPhase("refine", () => refinePumpList, refineRows, refineModDepthList);
        if (!cancelled) {
          if (state.dynamicConfig?.sweep) {
            state.dynamicConfig.sweep.pump_freq_GHz = [pumpValue];
          }
          if (state.dynamicConfig?.sweep && refineModDepthList.length) {
            state.dynamicConfig.sweep.mod_depth_pct = refineModDepthList.slice();
          }
        }
      }
    } else {
      state.vacuumGapSweepResults = primeRows.slice();
    }
    if (state.dynamicConfig?.sweep) {
      state.dynamicConfig.sweep.twoPhase = runCfg.twoPhase;
    }

    sweepRuntime.active = false;
    sweepRuntime.cancelRequested = false;
    sweepRuntime.cancelled = cancelled;
    sweepRuntime.top = topRows.map(toSweepPoint);
    if (!cancelled) {
      sweepRuntime.completedAt = Date.now();
      sweepRuntime.etaMs = 0;
    } else {
      sweepRuntime.completedAt = undefined;
    }

    const finalRows =
      !cancelled && twoPhaseEnabled && refineRows.length ? refineRows : primeRows;
    const finalPump = finalRows.length ? finalRows[finalRows.length - 1].Omega_GHz : undefined;

    if (runCfg.gateSchedule && runCfg.gateSchedule.length) {
      const { analytics } = assignGateSummaries(
        finalRows,
        runCfg.gateSchedule,
        runCfg.gateRouting,
        runCfg.gateOptions ?? {},
      );
      gateAnalyticsSink(analytics ?? null);
    } else {
      assignGateSummaries(finalRows, undefined, undefined, runCfg.gateOptions ?? {});
      gateAnalyticsSink(null);
    }

    state.vacuumGapSweepResults = finalRows.slice();
    state.gateAnalytics = gateAnalytics;

    await logSweep(
      finalRows,
      {
        activeSlew: true,
        slewDelayMs: delayMs,
        totalSteps: sweepRuntime.total ?? totalSteps,
        cancelled,
        phaseA_rows: primeRows.length,
        phaseB_rows: refineRows.length,
      },
      finalPump,
    );
    return finalRows;
  }

  sweepRuntime.active = false;
  sweepRuntime.cancelRequested = false;

  const coarseCfg = {
    ...runCfg,
    geometry,
    gamma_geo: gammaGeo,
    base_f0_GHz: base_f0,
    Qc,
    T_K,
    gateAnalyticsSink,
  };

  const coarseRows = runVacuumGapSweep(coarseCfg);
  if (!coarseRows.length) {
    state.vacuumGapSweepResults = [];
    state.gateAnalytics = gateAnalytics;
    return;
  }

  appendSweepRows(coarseRows);
  state.vacuumGapSweepResults = coarseRows.slice();

  const ridgeScores = rankRidges(coarseRows);
  const topRidges = ridgeScores.slice(0, 5);
  const microRows: VacuumGapSweepRow[] = [];

  if (topRidges.length) {
    const microTemplate = DEFAULT_PHASE_MICRO_SWEEP.phase_deg ?? [];
    const microStep =
      DEFAULT_PHASE_MICRO_SWEEP.phaseMicroStep_deg ??
      runCfg.phaseMicroStep_deg ??
      0.25;

    for (const ridge of topRidges) {
      const crestPhi = roundToStep(ridge.crestPhiDeg, microStep);
      const phase_deg =
        microTemplate.length > 0
          ? microTemplate.map((offset) => crestPhi + offset)
          : runCfg.phase_deg && runCfg.phase_deg.length
          ? [...runCfg.phase_deg]
          : [crestPhi];
      const microCfg = {
        ...coarseCfg,
        gaps_nm: [ridge.key.d_nm],
        mod_depth_pct: [ridge.key.m * 100],
        pump_freq_GHz: [ridge.key.Omega_GHz],
        pumpStrategy: undefined,
        phase_deg,
      };
      const rows = runVacuumGapSweep(microCfg);
      if (!rows.length) continue;
      appendSweepRows(rows);
      microRows.push(...rows);
    }
  }

  const allRows = coarseRows.concat(microRows);
  state.vacuumGapSweepResults = allRows;
  state.gateAnalytics = gateAnalytics;
  const crestPump = topRidges[0]?.key.Omega_GHz;
  await logSweep(
    allRows,
    {
      activeSlew: false,
      coarseRows: coarseRows.length,
      microRows: microRows.length,
    },
    crestPump,
  );
  return allRows;
}

// G├╢├çG├╢├ç Metric imports (induced surface metric on hull)
import { firstFundamentalForm } from "../src/metric.js";

// --- Mode power/mass policy (targets are *hit* by scaling qMechanical for power and +┬ª_VdB for mass) ---
// NOTE: All P_target_* values are in **watts** (W).
const MODE_POLICY = {
  hover:     { S_live: 1 as const,     P_target_W: 83.3e6,   P_cap_W: 83.3e6,   M_target_kg: 1405, massMode: DEFAULT_MASS_MODE },
  taxi:      { S_live: 1 as const,     P_target_W: 83.3e6,   P_cap_W: 83.3e6,   M_target_kg: 1405, massMode: DEFAULT_MASS_MODE },
  nearzero:  { S_live: 1 as const,     P_target_W: 5e6,      P_cap_W: 5e6,      M_target_kg: 1405, massMode: DEFAULT_MASS_MODE },
  cruise:    { S_live: 1 as const,     P_target_W: 40e6,     P_cap_W: 40e6,     M_target_kg: 1405, massMode: DEFAULT_MASS_MODE },
  emergency: { S_live: 2 as const,     P_target_W: 297.5e6,  P_cap_W: 300e6,    M_target_kg: 1405, massMode: DEFAULT_MASS_MODE },
  standby:   { S_live: 0 as const,     P_target_W: 0,        P_cap_W: 0,        M_target_kg: 0,    massMode: DEFAULT_MASS_MODE },
} as const;

// Ship HV bus voltage policy (per mode), in kilovolts
const BUS_VOLTAGE_POLICY_KV = {
  hover:     17,
  taxi:      17,
  nearzero:  17,
  cruise:    17,
  emergency: 30,
  standby:   0,
} as const;

// Runtime assert in dev to prevent unit confusion
if (process.env.NODE_ENV !== 'production') {
  const bad = Object.entries(MODE_POLICY)
    .filter(([k,v]) => k !== 'standby')
    .some(([,v]) => v.P_target_W < 1e3);
  if (bad && DEBUG_PIPE) console.warn("[PIPELINE] Power targets must be in watts (>= 1kW).");
}

function resolveSLive(mode: EnergyPipelineState['currentMode']): number {
  const pol = MODE_POLICY[mode];
  return Math.max(0, Math.min(PAPER_DUTY.TOTAL_SECTORS, pol.S_live));
}

// Mode configurations (physics parameters only, no hard locks)
// NOTE: Concurrent sectors come from MODE_POLICY.*.S_live, total sectors = PAPER_DUTY.TOTAL_SECTORS = 400
export const MODE_CONFIGS = {
  hover: {
    dutyCycle: 0.14,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    description: "High-power hover mode for station-keeping",
    // New fields for mode-aware physics
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.01,
    zeta_max: 1.0 // standard quantum bound (Ford-Roman limit)
  },
  taxi: {
    dutyCycle: 0.14,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    description: "Ground ops posture; translation suppressed",
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.01,
    zeta_max: 1.0
  },
  nearzero: {
    dutyCycle: 0.12,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    description: "Zero-beta hover-climb regime",
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.0075,
    zeta_max: 1.0
  },
  cruise: {
    dutyCycle: 0.005,
    sectorStrobing: 1,       // Consistent with MODE_POLICY.cruise.S_live: 1 (concurrent sectors)
    qSpoilingFactor: 0.625,  // keep this consistent with UI defaults below
    description: "Low-power cruise mode for sustained travel",
    // New fields for mode-aware physics
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.01
  },
  emergency: {
    dutyCycle: 0.50,
    sectorStrobing: 8,       // Updated to match client-side emergency mode
    qSpoilingFactor: 1,
    description: "Maximum power emergency mode",
    // New fields for mode-aware physics
    sectorsTotal: 400,
    sectorsConcurrent: 8,
    localBurstFrac: 0.50
  },
  standby: {
    dutyCycle: 0.001,
    sectorStrobing: 1,
    qSpoilingFactor: 0.1,
    description: "Minimal power standby mode",
    // New fields for mode-aware physics
    sectorsTotal: 400,
    sectorsConcurrent: 1,
    localBurstFrac: 0.0
  }
};

const AREA_MONTE_CARLO_SAMPLES = 16384;

// Closed-form elliptic-integral approximations for axisymmetric cases (prolate/oblate)
function surfaceAreaProlate(aEq: number, cPol: number): number | null {
  if (!(aEq > 0 && cPol > 0)) return null;
  const e2 = 1 - (aEq * aEq) / (cPol * cPol);
  const e = Math.sqrt(Math.max(0, e2));
  if (e < 1e-12) return 4 * Math.PI * aEq * aEq; // sphere fallback
  return 2 * Math.PI * aEq * aEq * (1 + (cPol / (aEq * e)) * Math.asin(e));
}

function surfaceAreaOblate(aEq: number, cPol: number): number | null {
  if (!(aEq > 0 && cPol > 0)) return null;
  const e2 = 1 - (cPol * cPol) / (aEq * aEq);
  const e = Math.sqrt(Math.max(0, e2));
  if (e < 1e-12) return 4 * Math.PI * aEq * aEq;
  const eClamped = Math.min(1 - 1e-12, e);
  const atanhE = 0.5 * Math.log((1 + eClamped) / (1 - eClamped));
  return 2 * Math.PI * aEq * aEq * (1 + ((1 - e * e) / eClamped) * atanhE);
}

function surfaceAreaAxisymmetricApproximations(axes: HullAxes) {
  const sorted = [Math.abs(axes.a), Math.abs(axes.b), Math.abs(axes.c)].sort((x, y) => x - y);
  const [r0, r1, r2] = sorted; // r0 <= r1 <= r2
  const eqProlate = Math.sqrt(r0 * r1);
  const eqOblate = Math.sqrt(r1 * r2);
  const prolate = r2 > eqProlate ? surfaceAreaProlate(eqProlate, r2) : surfaceAreaProlate(eqProlate, eqProlate);
  const oblate = r0 < eqOblate ? surfaceAreaOblate(eqOblate, r0) : surfaceAreaOblate(eqOblate, eqOblate);
  return { prolate, oblate };
}

// High-res Monte-Carlo cross-check over (theta, phi) parameter space
function surfaceAreaMonteCarlo(axes: HullAxes, samples = AREA_MONTE_CARLO_SAMPLES) {
  const thetaSpan = 2 * Math.PI;
  const eps = 1e-6; // avoid poles where parameterization becomes singular
  const phiMin = -Math.PI / 2 + eps;
  const phiMax = Math.PI / 2 - eps;
  const phiSpan = phiMax - phiMin;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < samples; i++) {
    const theta = Math.random() * thetaSpan;
    const phi = phiMin + Math.random() * phiSpan;
    const { dA } = firstFundamentalForm(axes.a, axes.b, axes.c, theta, phi);
    sum += dA;
    sumSq += dA * dA;
  }
  const mean = sum / Math.max(samples, 1);
  const variance = Math.max(0, sumSq / Math.max(samples, 1) - mean * mean);
  const stderr = Math.sqrt(variance / Math.max(samples, 1));
  const area = mean * thetaSpan * phiSpan;
  return { value: area, stderr: stderr * thetaSpan * phiSpan, samples };
}

/** Ellipsoid surface area via induced metric integral (replaces Knud-Thomsen).
 *  a = Lx/2, b = Ly/2, c = Lz/2 (meters). Numerical quadrature over (theta, phi).
 *  Returns value +- uncertainty (max deviation across metric, Monte-Carlo, and axisymmetric approximations).
 */
function surfaceAreaEllipsoidMetric(
  Lx_m: number,
  Ly_m: number,
  Lz_m: number,
  nTheta = 256,
  nPhi = 128,
  sectorCount?: number,
): SurfaceAreaEstimate {
  const axes: HullAxes = { a: Lx_m / 2, b: Ly_m / 2, c: Lz_m / 2 };
  const dTheta = (2 * Math.PI) / nTheta;
  const dPhi = Math.PI / Math.max(1, nPhi - 1); // phi in [-pi/2, pi/2]
  const sectors = Number.isFinite(sectorCount) && (sectorCount as number) > 0
    ? Math.max(1, Math.floor(sectorCount as number))
    : 0;
  const sectorAreas = sectors > 0 ? new Array(sectors).fill(0) : null;
  let areaMetric = 0;
  for (let i = 0; i < nTheta; i++) {
    const theta = i * dTheta;
    for (let j = 0; j < nPhi; j++) {
      const phi = -Math.PI / 2 + j * dPhi;
      const { dA } = firstFundamentalForm(axes.a, axes.b, axes.c, theta, phi);
      areaMetric += dA * dTheta * dPhi;
      if (sectorAreas) {
        const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
        const idx = Math.min(sectors - 1, Math.floor(u * sectors));
        sectorAreas[idx] += dA * dTheta * dPhi;
      }
    }
  }

  const mc = surfaceAreaMonteCarlo(axes);
  const approx = surfaceAreaAxisymmetricApproximations(axes);

  const deviations: number[] = [];
  if (Number.isFinite(mc.value)) deviations.push(Math.abs(mc.value - areaMetric));
  if (Number.isFinite(approx.prolate ?? NaN)) deviations.push(Math.abs((approx.prolate as number) - areaMetric));
  if (Number.isFinite(approx.oblate ?? NaN)) deviations.push(Math.abs((approx.oblate as number) - areaMetric));

  const maxDeviation = deviations.length ? Math.max(...deviations) : 0;
  const sigmaMc = Number.isFinite(mc.stderr) ? Math.abs(mc.stderr) : 0;
  const uncertainty = Math.max(areaMetric * 1e-6, maxDeviation, sigmaMc); // tiny floor to avoid zero band
  const band = {
    min: Math.max(0, areaMetric - uncertainty),
    max: areaMetric + uncertainty,
  };

  return {
    value: areaMetric,
    uncertainty,
    band,
    sectorAreas: sectorAreas ?? undefined,
    sectors: sectorAreas ? sectors : undefined,
    components: {
      metric: areaMetric,
      monteCarlo: { value: mc.value, stderr: mc.stderr, samples: mc.samples },
      prolateApprox: approx.prolate,
      oblateApprox: approx.oblate,
    },
  };
}

// Initialize pipeline state with defaults
export function initializePipelineState(): EnergyPipelineState {
  return {
    // Needle Hull full scale defaults for HELIX-CORE (paper-authentic)
    tileArea_cm2: 25,  // 5+├╣5 cm tiles (was 5 cm-┬ª, now 25 cm-┬ª)
    tilePitch_m: Math.sqrt((25 * CM2_TO_M2) / PAPER_GEO.PACKING),
    shipRadius_m: 86.5,
    gap_nm: 1.0,
    sag_nm: 16,
    temperature_K: 20,
    modulationFreq_GHz: DEFAULT_MODULATION_FREQ_GHZ,
    couplingFrameFill: PAPER_GEO.PACKING,
    couplingChiOverride: undefined,
    couplingSupercellTiles: undefined,
    couplingSupercellEnergy_J: undefined,

    // Hull geometry (actual 1.007 km needle dimensions)
    hull: {
      Lx_m: 1007,  // length (needle axis)
      Ly_m: 264,   // width  
      Lz_m: 173,   // height
      wallThickness_m: DEFAULT_WALL_THICKNESS_M  // Matches 15 GHz dwell (~0.02 m); override for paper 1 m stack
    },
    warpFieldType: 'natario',
    warpGeometry: null,
    warpGeometryKind: 'ellipsoid',
    warpGeometryAssetId: undefined,

    // Nat├írio / warp-bubble defaults (ensures nonzero snapshot solves)
    bubble: {
      beta: 0.15,   // translation fraction (0..1)
      sigma: 35,    // wall width (m)
      R: 280,       // bubble radius (m)
      dutyGate: undefined,
    },
    // Top-level mirrors for legacy clients
    beta: 0.15,
    sigma: 35,
    R: 280,

    // Mode defaults (hover)
    currentMode: 'hover',
    massMode: DEFAULT_MASS_MODE,
    massSource: "model",
    massDatasetId: undefined,
    massFitResiduals: undefined,
    dutyCycle: 0.14,
    dutyShip: 0.000025,      // Ship-wide effective duty (will be recalculated)
    sectorCount: 400,        // Total sectors (always 400)
    concurrentSectors: 1,    // Live concurrent sectors (default 1)
    sectorStrobing: 1,       // Legacy alias
    qSpoilingFactor: 1,
    negativeFraction: DEFAULT_NEGATIVE_FRACTION,
    strobeHz: Number(process.env.STROBE_HZ ?? 1000),
    phase01: 0,
    sigmaSector: 0.05,
    splitEnabled: false,
    splitFrac: 0.6,

    // Pulsed-load ceilings (defaults mirrored in docs; override when bench data lands)
    iPeakMaxMidi_A: DEFAULT_PULSED_CURRENT_LIMITS_A.midi,
    iPeakMaxSector_A: DEFAULT_PULSED_CURRENT_LIMITS_A.sector,
    iPeakMaxLauncher_A: DEFAULT_PULSED_CURRENT_LIMITS_A.launcher,

    // Physics defaults (paper-backed)
    gammaGeo: 26,
    qMechanical: 1,               // Set to 1 (was 5e4) - power knob only
    qCavity: PAPER_Q.Q_BURST,             // Use paper-backed Q_BURST 
    gammaVanDenBroeck: PAPER_VDB.GAMMA_VDB, // Use paper-backed +┬ª_VdB seed
    exoticMassTarget_kg: 1405,    // Reference target (not a lock)
    casimirModel: 'ideal_retarded',
    ampFactors: {
      gammaGeo: 26,
      gammaVanDenBroeck: PAPER_VDB.GAMMA_VDB,
      qSpoilingFactor: 1,
      qMechanical: 1,
      qCavity: PAPER_Q.Q_BURST,
    },
    amps: {
      gammaGeo: 26,
      gammaVanDenBroeck: PAPER_VDB.GAMMA_VDB,
      qSpoilingFactor: 1,
      qMechanical: 1,
      qCavity: PAPER_Q.Q_BURST,
    },

    // Initial calculated values
    U_static: 0,
    U_static_nominal: 0,
    U_static_realistic: 0,
    U_static_uncoupled: 0,
    U_static_band: { min: 0, max: 0 },
    casimirRatio: 1,
    lifshitzSweep: [],
    couplingChi: 1,
    couplingMethod: 'analytic',
    couplingNote: '',
    supercellRatio: 1,
    U_geo: 0,
    U_Q: 0,
    U_cycle: 0,
    P_loss_raw: 0,
    P_avg: 0,
    P_target_W: 0,
    P_cap_W: 0,
    physicsCap_W: 0,
    P_applied_W: 0,
    beta_trans_power: 0,
    beta_policy: 0,
    shipBeta: 0,
    vShip_mps: 0,
    speedClosure: 'policyA',
    busVoltage_kV: 0,
    busCurrent_A: 0,
    M_exotic: 0,
    M_exotic_raw: 0,
    massCalibration: 1,
    TS_ratio: 0,
    zeta: 0,
    N_tiles: 0,

    // Sector management
    tilesPerSector: 0,
    activeSectors: 1,
    activeTiles: 0,
    activeFraction: 0,

    // Status
    fordRomanCompliance: true,
    natarioConstraint: true,
    curvatureLimit: true,
    overallStatus: 'NOMINAL',

    atmDensity_kg_m3: null,
    altitude_m: null,

    dynamicConfig: null,
    vacuumGapSweepResults: [],
    vacuumGapSweepRowsTotal: 0,
    vacuumGapSweepRowsDropped: 0,
    hardwareTruth: {
      totals: { visible: 0, total: 0, dropped: 0 },
      updatedAt: 0,
      sectorState: null,
      qiSample: null,
      spectrumFrame: null,
      strobeDuty: null,
    },
    gateAnalytics: null,
    qiAutothrottle: initQiAutothrottle(),
    qiAutoscale: initQiAutoscaleState(
      Number.isFinite(QI_AUTOSCALE_TARGET) ? Math.max(1e-6, QI_AUTOSCALE_TARGET) : 0.9,
      Date.now(),
    ),
    sweep: {
      active: false,
      status: 'idle',
      top: [],
      last: null,
      cancelRequested: false,
      cancelled: false,
      activeSlew: false,
    },
  };
}

// Legacy calculateHullArea function removed - now using surfaceAreaEllipsoidFromHullDims

// Calculate static Casimir energy using corrected physics
function calculateStaticCasimir(gap_nm: number, area_m2: number): number {
  const gap_m   = gap_nm * NM_TO_M;
  const E_overA = -(Math.PI * Math.PI * HBAR_C) / (720 * Math.pow(gap_m, 3)); // J/m^2
  return E_overA * area_m2; // J
}

// Cache removed - surfaceAreaEllipsoidMetric is called directly for accuracy

// Main pipeline calculation
export async function calculateEnergyPipeline(
  state: EnergyPipelineState,
  opts: PipelineRunOptions = {},
): Promise<EnergyPipelineState> {
  // Monotonic tick + uptime telemetry for pipeline snapshots
  const nowMs = Date.now();
  const prevTick = Number.isFinite((state as any).__tick) ? Number((state as any).__tick) : -1;
  (state as any).__tick = prevTick + 1;
  (state as any).__uptime_ms = Math.floor(process.uptime() * 1000);
  (state as any).__last_calc_ms = nowMs;

  // Allow callers to override MODEL_MODE for paper/raw profiles (falls back to env default)
  const modelMode: 'calibrated' | 'raw' =
    state.modelMode === 'raw' || state.modelMode === 'calibrated'
      ? state.modelMode
      : MODEL_MODE;
  const policyMassMode = MODE_POLICY[state.currentMode]?.massMode;
  const massMode = resolveMassMode(state.massMode ?? policyMassMode);
  let casimirScaleApplied = 1;
  let measuredScaleApplied = false;
  let measuredScaleValue: number | undefined;
  let measuredScaleSigma: number | undefined;
  let measuredScaleRelSigma: number | undefined;
  let measuredDatasetId: string | undefined;
  let measuredFitResiduals: CasimirForceInference["fitResiduals"] | undefined;

  // Thread warp geometry controls from dynamic config into top-level fields for downstream consumers
  const dynWarpGeom = (state.dynamicConfig as any)?.warpGeometry;
  if ((state.dynamicConfig as any)?.warpFieldType) {
    state.warpFieldType = (state.dynamicConfig as any).warpFieldType as WarpFieldType;
  }
  if (dynWarpGeom) {
    state.warpGeometry = {
      ...(state.warpGeometry ?? {}),
      ...(dynWarpGeom as WarpGeometrySpec),
      geometryKind: (dynWarpGeom as WarpGeometrySpec)?.geometryKind ?? (dynWarpGeom as any)?.kind ?? (state.warpGeometry ?? {}).geometryKind,
    };
    state.warpGeometryKind =
      (dynWarpGeom as WarpGeometrySpec)?.geometryKind ?? (dynWarpGeom as any)?.kind ?? state.warpGeometryKind ?? 'ellipsoid';
    state.warpGeometryAssetId = (dynWarpGeom as WarpGeometrySpec)?.assetId ?? state.warpGeometryAssetId;
  } else {
    state.warpGeometryKind = state.warpGeometryKind ?? state.warpGeometry?.geometryKind ?? 'ellipsoid';
  }
  if (!state.warpFieldType) {
    state.warpFieldType = 'natario';
  }

  // --- Surface area & tile count from actual hull dims ---
  const tileArea_m2 = state.tileArea_cm2 * CM2_TO_M2;
  const sectorCountHint = Math.max(1, Math.floor(state.sectorCount || TOTAL_SECTORS));

  // If a full rectangular needle + rounded caps is added later, we can refine this.
  // For now, the ellipsoid (a=Lx/2, b=Ly/2, c=Lz/2) is an excellent approximation.
  const hullDims = state.hull ?? {
    Lx_m: state.shipRadius_m * 2,
    Ly_m: state.shipRadius_m * 2,
    Lz_m: state.shipRadius_m * 2,
  };
  // Proper surface area from induced metric (ellipsoid shell)
  const hullArea = surfaceAreaEllipsoidMetric(
    hullDims.Lx_m,
    hullDims.Ly_m,
    hullDims.Lz_m,
    256,
    128,
    sectorCountHint,
  );
  const hullAreaEllipsoid_m2 = hullArea.value;
  const ellipsoidSectorAreas = Array.isArray(hullArea.sectorAreas) ? hullArea.sectorAreas.slice() : null;
  const overrideArea = Number(state.hullAreaOverride_m2);
  const hasOverride = Number.isFinite(overrideArea) && overrideArea > 0;
  const overrideUnc = hasOverride
    ? Math.max(0, Number(state.hullAreaOverride_uncertainty_m2) || 0)
    : Math.abs(hullArea.uncertainty ?? 0);
  const hullArea_m2 = hasOverride ? (overrideArea as number) : hullAreaEllipsoid_m2;
  const hullAreaBand = hasOverride
    ? {
        min: Math.max(0, hullArea_m2 - overrideUnc),
        max: hullArea_m2 + overrideUnc,
      }
    : hullArea.band ?? {
        min: Math.max(0, hullArea_m2 - Math.abs(hullArea.uncertainty ?? 0)),
        max: hullArea_m2 + Math.abs(hullArea.uncertainty ?? 0),
      };

  // Store hull area for Bridge display + provenance
  state.hullArea_m2 = hullArea_m2;
  state.hullArea = {
    ...hullArea,
    value: hullArea_m2,
    uncertainty: overrideUnc,
    band: hullAreaBand,
  };
  state.__hullAreaEllipsoid_m2 = hullAreaEllipsoid_m2;
  state.__hullAreaSource = hasOverride ? "override" : "ellipsoid";

  // 1) N_tiles G├ç├╢ paper-authentic tile census
  const surfaceTiles = Math.floor(hullArea_m2 / tileArea_m2);
  const surfaceTilesMin = Math.floor(hullAreaBand.min / tileArea_m2);
  const surfaceTilesMax = Math.ceil(hullAreaBand.max / tileArea_m2);
  const layerPacking = PAPER_GEO.RADIAL_LAYERS * PAPER_GEO.PACKING;
  const tilesNominal = surfaceTiles * layerPacking;
  const tilesBand = {
    min: Math.max(1, Math.floor(surfaceTilesMin * layerPacking)),
    max: Math.max(1, Math.ceil(surfaceTilesMax * layerPacking)),
  };
  // Use centralized PAPER_GEO constants
  state.N_tiles = Math.max(1, Math.round(tilesNominal));
  state.N_tiles_band = tilesBand;

  // Surface packing factor for future geometry modules to replace fudge
  (state as any).__packing = PAPER_GEO.PACKING;
  (state as any).tileArea_m2 = tileArea_m2;
  (state as any).hullArea_band = hullAreaBand;

  // Step 1: Static Casimir energy with coupling/packing correction
  const frameFill = Number.isFinite(state.couplingFrameFill)
    ? Math.max(0, Math.min(1, state.couplingFrameFill as number))
    : PAPER_GEO.PACKING;
  state.couplingFrameFill = frameFill;

  const tilePitch_m = Number.isFinite(state.tilePitch_m) && (state.tilePitch_m as number) > 0
    ? (state.tilePitch_m as number)
    : Math.sqrt(tileArea_m2 / Math.max(frameFill, 1e-9));
  state.tilePitch_m = tilePitch_m;

  // Mechanical feasibility budget (stiction / buckling guard)
  const requestedGap_nm = Number.isFinite(state.gap_nm) ? Number(state.gap_nm) : 1;
  state.gap_nm = requestedGap_nm;
  const safetyFloor = modelMode === 'raw' ? MECH_SAFETY_MIN_RAW : MECH_SAFETY_MIN_CAL;
  const mechConfig =
    modelMode === 'raw'
      ? {
          elasticModulus_Pa: MECH_ELASTIC_MODULUS_RAW_PA,
          thickness_m: MECH_TILE_THICKNESS_RAW_M,
          spanScale: MECH_SPAN_SCALE_RAW,
        }
      : {
          elasticModulus_Pa: MECH_ELASTIC_MODULUS_PA,
          thickness_m: MECH_TILE_THICKNESS_M,
          spanScale: MECH_SPAN_SCALE_CAL,
        };
  const mech = mechanicalFeasibility(state, tileArea_m2, safetyFloor, mechConfig);
  const constrainedGap_nm = Number.isFinite(mech.recommendedGap_nm)
    ? Math.max(requestedGap_nm, mech.recommendedGap_nm)
    : requestedGap_nm;
  const gapForCasimir_nm = modelMode === 'calibrated' ? constrainedGap_nm : requestedGap_nm;
  state.gap_nm = gapForCasimir_nm;
  (state as any).mechanical = {
    ...mech,
    constrainedGap_nm,
    casimirGap_nm: gapForCasimir_nm,
    modelMode,
    unattainable:
      mech.recommendedGap_nm > requestedGap_nm + 1e-9 ||
      !mech.feasible ||
      !mech.safetyFeasible ||
      !mech.strokeFeasible,
    requestedGap_nm,
  };
  (state as any).strokeAmplitude_pm = mech.requestedStroke_pm;

  const tileRadius_m = Math.sqrt(tileArea_m2 / Math.PI);
  const couplingSpec = {
    chi: Number.isFinite(state.couplingChiOverride)
      ? Math.max(0, Math.min(1, state.couplingChiOverride as number))
      : undefined,
    pitch_m: tilePitch_m,
    frameFill,
    supercell:
      Number.isFinite(state.couplingSupercellTiles) || Number.isFinite(state.couplingSupercellEnergy_J)
        ? {
            tiles: Number.isFinite(state.couplingSupercellTiles)
              ? Number(state.couplingSupercellTiles)
              : undefined,
            energy_J: Number.isFinite(state.couplingSupercellEnergy_J)
              ? Number(state.couplingSupercellEnergy_J)
              : undefined,
          }
        : undefined,
  };

  try {
    const casimir = calculateCasimirEnergy({
      geometry: 'parallel_plate',
      gap: state.gap_nm,
      radius: tileRadius_m * 1e6, // ┬╡m
      sagDepth: state.sag_nm,
      temperature: state.temperature_K,
      materialModel: state.casimirModel ?? 'ideal_retarded',
      materialProps: state.materialProps,
      material: 'PEC',
      moduleType: 'static',
      coupling: couplingSpec,
    } as any);

    const energyNominal = casimir.nominalEnergy ?? casimir.totalEnergy;
    const energyRealistic = casimir.realisticEnergy ?? casimir.totalEnergy;
    const energyUncoupled = casimir.uncoupledEnergy ?? energyRealistic ?? casimir.totalEnergy;
    const baseBand = casimir.energyBand ?? {
      min: energyRealistic ?? casimir.totalEnergy,
      max: energyRealistic ?? casimir.totalEnergy,
    };
    const modeScale = modelMode === 'raw' ? 2 : 1;

    state.casimirModel = casimir.model ?? state.casimirModel;
    state.U_static_nominal = energyNominal;
    state.U_static_realistic = energyRealistic;
    state.U_static_uncoupled = energyUncoupled;
    state.U_static_band = {
      min: baseBand.min * modeScale,
      max: baseBand.max * modeScale,
    };
    state.casimirRatio = casimir.modelRatio ?? 1;
    state.lifshitzSweep = casimir.lifshitzSweep ?? state.lifshitzSweep;
    state.couplingChi = casimir.couplingChi ?? couplingSpec.chi ?? state.couplingChi ?? 1;
    state.couplingMethod = casimir.couplingMethod ?? state.couplingMethod;
    state.couplingNote = casimir.couplingNote ?? state.couplingNote;
    state.supercellRatio = casimir.supercellRatio ?? state.supercellRatio;
    state.U_static = (energyRealistic ?? casimir.totalEnergy) * modeScale;
  } catch (err) {
    if (DEBUG_PIPE) console.warn("[PIPELINE] Casimir material model fell back to PEC", err);
    const fallback = calculateStaticCasimir(state.gap_nm, tileArea_m2);
    const chi = Number.isFinite(couplingSpec.chi) ? (couplingSpec.chi as number) : 1;
    state.U_static = fallback * chi;
    state.U_static_nominal = fallback;
    state.U_static_realistic = fallback * chi;
    state.U_static_uncoupled = fallback;
    state.U_static_band = { min: state.U_static, max: state.U_static };
    state.casimirRatio = 1;
    state.couplingChi = chi;
    state.couplingMethod = 'fallback';
    state.supercellRatio = chi;
  }

  const forceDataset = state.experimental?.casimirForce;
  if (massMode === "MEASURED_FORCE_INFERRED" && forceDataset) {
    try {
      const energyInference = inferEnergyFromForceSeries(forceDataset);
      const scaleInference = inferCasimirForceScale(forceDataset);
      const forceSign = energyInference.forceSign ?? scaleInference?.forceSign;
      let note: string | undefined;
      if (
        scaleInference &&
        Number.isFinite(scaleInference.kCasimir) &&
        scaleInference.kCasimir > 0
      ) {
        const scale = scaleInference.kCasimir;
        casimirScaleApplied = scale;
        measuredScaleApplied = true;
        measuredScaleValue = scale;
        measuredScaleSigma = scaleInference.sigmaK;
        measuredDatasetId = forceDataset.datasetId;
        measuredFitResiduals = scaleInference.fitResiduals;
        state.U_static *= scale;
        if (Number.isFinite(state.U_static_nominal)) {
          state.U_static_nominal = state.U_static_nominal * scale;
        }
        if (Number.isFinite(state.U_static_realistic)) {
          state.U_static_realistic = state.U_static_realistic * scale;
        }
        if (Number.isFinite(state.U_static_uncoupled)) {
          state.U_static_uncoupled = state.U_static_uncoupled * scale;
        }
        if (state.U_static_band) {
          state.U_static_band = {
            min: state.U_static_band.min * scale,
            max: state.U_static_band.max * scale,
          };
        } else {
          state.U_static_band = { min: state.U_static, max: state.U_static };
        }
        note = "scale_applied";
      } else {
        note = scaleInference ? "invalid_scale" : "scale_unavailable";
      }

      state.casimirForceInference = {
        datasetId: forceDataset.datasetId,
        referenceSeparation_m: energyInference.referenceSeparation_m,
        energy_J_at_a0: energyInference.energy_J_at_a0,
        sigmaEnergy_J: energyInference.sigmaEnergy_J,
        kCasimir: scaleInference?.kCasimir,
        sigmaK: scaleInference?.sigmaK,
        sampleCount: scaleInference?.sampleCount ?? energyInference.sampleCount,
        fitResiduals: scaleInference?.fitResiduals,
        forceSign,
        note,
      };
    } catch (err) {
      if (DEBUG_PIPE) console.warn("[PIPELINE] Casimir force inference failed", err);
      const errCode =
        err && typeof err === "object" && "code" in err ? (err as any).code : null;
      const forceSign =
        err && typeof err === "object" && "forceSign" in err
          ? (err as any).forceSign
          : undefined;
      state.casimirForceInference = {
        datasetId: forceDataset.datasetId,
        forceSign,
        note:
          errCode === "CASIMIR_FORCE_SIGN_MISMATCH"
            ? "force_sign_mismatch"
            : "inference_failed",
      };
    }
  } else {
    state.casimirForceInference = undefined;
  }
  if (
    measuredScaleApplied &&
    Number.isFinite(measuredScaleValue) &&
    (measuredScaleValue as number) > 0 &&
    Number.isFinite(measuredScaleSigma)
  ) {
    measuredScaleRelSigma = Math.abs(
      (measuredScaleSigma as number) / (measuredScaleValue as number),
    );
  }

  // Aggregate static energy band with geometry uncertainty propagated through tile census
  const perTileBand = state.U_static_band ?? { min: state.U_static, max: state.U_static };
  const tileBand = state.N_tiles_band ?? { min: state.N_tiles, max: state.N_tiles };
  const totalCandidates = [
    perTileBand.min * tileBand.min,
    perTileBand.min * tileBand.max,
    perTileBand.max * tileBand.min,
    perTileBand.max * tileBand.max,
  ];
  state.U_static_total = state.U_static * state.N_tiles;
  state.U_static_total_band = {
    min: Math.min(...totalCandidates),
    max: Math.max(...totalCandidates),
  };

  // 3) Apply mode config EARLY (right after reading currentMode)
  const modeConfig = MODE_CONFIGS[state.currentMode];
  if (!modeConfig) {
    if (DEBUG_PIPE) console.warn("[PIPELINE_UI] Unknown mode", state.currentMode, "- defaulting to hover");
    state.currentMode = 'hover';
  }
  const ui = modeConfig ?? MODE_CONFIGS.hover;
  state.dutyCycle = ui.dutyCycle;
  state.qSpoilingFactor = ui.qSpoilingFactor;
  const ampInputs = (state.ampFactors ?? (state as any).amps ?? {}) as AmpFactors;
  const dynConfig = (state.dynamicConfig ?? {}) as Record<string, unknown>;
  const resolveControl = (
    measured: number | undefined,
    design: number | undefined,
    designSource: ControlSource,
  ): { value: number | undefined; source: ControlSource } => {
    if (Number.isFinite(measured)) {
      return { value: Number(measured), source: "measured" };
    }
    if (Number.isFinite(design)) {
      return { value: Number(design), source: designSource };
    }
    return { value: undefined, source: designSource };
  };

  const modulationResolved = resolveControl(
    firstFinite(
      (dynConfig as any).measuredModulationFreqGHz,
      (state as any).measuredModulationFreq_GHz,
    ),
    firstFinite((dynConfig as any).modulationFreqGHz, state.modulationFreq_GHz),
    "design",
  );
  if (modulationResolved.value != null) {
    state.modulationFreq_GHz = modulationResolved.value;
  }
  state.modulationFreqSource = modulationResolved.source;

  const cavityResolved = resolveControl(
    firstFinite(
      (dynConfig as any).measuredCavityQ,
      (ampInputs as any).measuredCavityQ,
      (state as any).measuredCavityQ,
    ),
    firstFinite((dynConfig as any).cavityQ, ampInputs.qCavity, state.qCavity),
    "design",
  );
  if (cavityResolved.value != null) {
    state.qCavity = cavityResolved.value;
  }
  state.qCavitySource = cavityResolved.source;

  const gammaGeoResolved = resolveControl(
    firstFinite((ampInputs as any).measuredGammaGeo, (state as any).measuredGammaGeo),
    firstFinite(ampInputs.gammaGeo, state.gammaGeo),
    "design",
  );
  if (gammaGeoResolved.value != null) {
    state.gammaGeo = gammaGeoResolved.value;
  }
  state.gammaGeoSource = gammaGeoResolved.source;

  const gammaVdBResolved = resolveControl(
    firstFinite(
      (ampInputs as any).measuredGammaVanDenBroeck,
      (state as any).measuredGammaVanDenBroeck,
    ),
    firstFinite(ampInputs.gammaVanDenBroeck, state.gammaVanDenBroeck),
    "design",
  );
  if (gammaVdBResolved.value != null) {
    state.gammaVanDenBroeck = gammaVdBResolved.value;
  }
  state.gammaVanDenBroeckSource = gammaVdBResolved.source;

  const qSpoilMeasured = firstFinite(
    (ampInputs as any).measuredQSpoilingFactor,
    (state as any).measuredQSpoilingFactor,
  );
  const qSpoilDesign = firstFinite(ampInputs.qSpoilingFactor);
  const qSpoilResolved = resolveControl(
    qSpoilMeasured,
    qSpoilDesign,
    qSpoilDesign != null ? "design" : "policy",
  );
  if (qSpoilResolved.value != null) {
    state.qSpoilingFactor = qSpoilResolved.value;
  }
  state.qSpoilingFactorSource = qSpoilResolved.source;

  const dutyMeasured = firstFinite(
    (dynConfig as any).measuredDutyCycle,
    (state as any).measuredDutyCycle,
  );
  const dutyDesign = firstFinite((dynConfig as any).dutyCycle);
  const dutyResolved = resolveControl(
    dutyMeasured,
    dutyDesign,
    dutyDesign != null ? "design" : "policy",
  );
  if (dutyResolved.value != null) {
    state.dutyCycle = clampNumber(dutyResolved.value, 0, 1);
  }
  state.dutyCycleSource = dutyResolved.source;

  const dutyLocalOverride =
    dutyResolved.source === "policy" ? undefined : dutyResolved.value;
  const dutyShipMeasured = firstFinite(
    (dynConfig as any).measuredSectorDuty,
    (state as any).measuredSectorDuty,
  );
  const dutyShipDesign = firstFinite((dynConfig as any).sectorDuty);
  const dutyShipOverride = firstFinite(dutyShipMeasured, dutyShipDesign);
  const dutyShipSource: ControlSource =
    Number.isFinite(dutyShipMeasured)
      ? "measured"
      : Number.isFinite(dutyShipDesign)
        ? "design"
        : "schedule";
  const sectorCountMeasured = firstFinite(
    (dynConfig as any).measuredSectorCount,
    (state as any).measuredSectorCount,
  );
  const sectorCountDesign = firstFinite((dynConfig as any).sectorCount, state.sectorCount);

  // keep sector policy from resolveSLive just below; don't touch sectorCount here

  // 4) Sector scheduling - prefer measured event stream over schedule
  const strobeDuty = (state.hardwareTruth as any)?.strobeDuty;
  const measuredDutyEffective = (() => {
    if (!strobeDuty) return undefined;
    const duty = Number(
      strobeDuty.dutyAvg ??
      (strobeDuty as any).avg ??
      (strobeDuty as any).dutyEffective ??
      (strobeDuty as any).dutyEffectiveFR
    );
    if (!Number.isFinite(duty)) return undefined;
    const last = Number((strobeDuty as any).lastSampleAt ?? (strobeDuty as any).updatedAt);
    const windowMs = Number(
      (strobeDuty as any).windowMs ?? (strobeDuty as any).window_ms ?? STROBE_DUTY_WINDOW_MS_DEFAULT
    );
    const freshness = Math.max(2500, Number.isFinite(windowMs) && windowMs > 0 ? windowMs * 2 : STROBE_DUTY_STALE_MS);
    if (Number.isFinite(last) && Date.now() - last > freshness) return undefined;
    return clampNumber(duty, 0, 1);
  })();

  const measuredTotal = Number((strobeDuty as any)?.sTotal);
  const measuredLive = Number((strobeDuty as any)?.sLive);
  const scheduledLive = resolveSLive(state.currentMode);
  const sectorTotalResolved = Number.isFinite(measuredTotal) && measuredTotal > 0
    ? measuredTotal
    : Number.isFinite(sectorCountMeasured) && (sectorCountMeasured as number) > 0
      ? sectorCountMeasured
      : Number.isFinite(sectorCountDesign) && (sectorCountDesign as number) > 0
        ? sectorCountDesign
        : state.sectorCount || PAPER_DUTY.TOTAL_SECTORS;
  const sectorCountSource: ControlSource =
    Number.isFinite(measuredTotal) && measuredTotal > 0
      ? "measured"
      : Number.isFinite(sectorCountMeasured) && (sectorCountMeasured as number) > 0
        ? "measured"
        : Number.isFinite(sectorCountDesign) && (sectorCountDesign as number) > 0
          ? "design"
          : "design";
  const S_total = Math.max(
    1,
    Math.round(sectorTotalResolved ?? PAPER_DUTY.TOTAL_SECTORS),
  );
  let S_live = Number.isFinite(measuredLive) && measuredLive >= 0
    ? measuredLive
    : scheduledLive;
  if (!Number.isFinite(measuredLive) && Number.isFinite(state.activeSectors)) {
    S_live = state.activeSectors;
  } else if (!Number.isFinite(measuredLive) && Number.isFinite(state.concurrentSectors)) {
    S_live = state.concurrentSectors;
  }
  S_live = Math.max(0, S_live);
  const S_live_int = Math.max(0, Math.round(S_live));

  // if standby, FR duty must be exactly zero for viewers/clients
  const isStandby = String(state.currentMode || '').toLowerCase() === 'standby';
  const dutyLocal = clampNumber(
    Number.isFinite(dutyLocalOverride)
      ? (dutyLocalOverride as number)
      : Number.isFinite(state.dutyBurst)
        ? (state.dutyBurst as number)
        : Number.isFinite((state as any).localBurstFrac)
          ? (state as any).localBurstFrac
          : Number.isFinite(state.dutyCycle)
            ? state.dutyCycle
            : PAPER_DUTY.BURST_DUTY_LOCAL,
    0,
    1,
  );
  const d_eff_fallback = Number.isFinite(dutyShipOverride)
    ? clampNumber(dutyShipOverride as number, 0, 1)
    : dutyLocal * (S_live / Math.max(1, S_total));
  const d_eff = isStandby ? 0 : (measuredDutyEffective ?? d_eff_fallback);

  state.sectorCount       = S_total;
  state.concurrentSectors = S_live_int;
  state.activeSectors     = S_live_int;
  state.activeFraction    = Math.max(0, Math.min(1, S_total > 0 ? S_live / S_total : 0));
  state.sectorCountSource = sectorCountSource;

  // Normalize per-sector surface areas (override -> ellipsoid -> uniform)
  const normalizeSectorAreas = (areas: number[] | null | undefined, sectors: number): number[] | null => {
    if (!Array.isArray(areas) || sectors <= 0) return null;
    const out = new Array(sectors).fill(0);
    for (let i = 0; i < sectors; i++) {
      const v = Number((areas as any)[i]);
      out[i] = Number.isFinite(v) && v >= 0 ? v : 0;
    }
    const sum = out.reduce((a, b) => a + b, 0);
    return sum > 0 ? out : null;
  };

  const sectorAreasOverride = normalizeSectorAreas(state.hullAreaPerSector_m2, S_total);
  const sectorAreasEllipsoid = normalizeSectorAreas(ellipsoidSectorAreas, S_total);
  let sectorAreas = sectorAreasOverride ?? sectorAreasEllipsoid;
  let sectorAreaSource: "override" | "ellipsoid" | "uniform" =
    sectorAreasOverride ? "override" : sectorAreasEllipsoid ? "ellipsoid" : "uniform";

  if (!sectorAreas) {
    sectorAreas = new Array(S_total).fill(hullArea_m2 / Math.max(1, S_total));
  }
  const sectorAreaSum = sectorAreas.reduce((a, b) => a + b, 0);
  const sectorAreaScale = sectorAreaSum > 0 ? hullArea_m2 / sectorAreaSum : 1;
  sectorAreas = sectorAreas.map((a) => Math.max(0, a * sectorAreaScale));
  const sectorAreaSumScaled = sectorAreas.reduce((a, b) => a + b, 0);

  // Budget-preserving tile allocation by surface area
  const allocateTilesByArea = (areas: number[], totalTiles: number): number[] => {
    const n = Math.max(1, areas.length);
    const sum = areas.reduce((a, b) => a + b, 0);
    const total = Math.max(0, Math.round(totalTiles));
    const ideal = areas.map((a) => (sum > 0 ? (a / sum) * total : total / n));
    const base = ideal.map((v) => Math.floor(Math.max(0, v)));
    let remainder = total - base.reduce((a, b) => a + b, 0);
    const fracOrder = ideal
      .map((v, idx) => ({ idx, frac: v - base[idx] }))
      .sort((a, b) => b.frac - a.frac);
    const result = base.slice();
    if (remainder > 0) {
      for (let k = 0; k < remainder; k++) {
        const target = fracOrder[k % fracOrder.length]?.idx ?? 0;
        result[target] += 1;
      }
    } else if (remainder < 0) {
      let need = -remainder;
      const order = base
        .map((v, idx) => ({ idx, value: v }))
        .sort((a, b) => b.value - a.value);
      for (let i = 0; i < order.length && need > 0; i++) {
        const idx = order[i].idx;
        if (result[idx] > 0) {
          result[idx] -= 1;
          need -= 1;
          i -= 1; // allow multiple decrements on same sector if needed
        }
      }
    }
    return result;
  };

  const tilesPerSectorVector = allocateTilesByArea(sectorAreas, state.N_tiles);
  const tilesUniformVector = allocateTilesByArea(new Array(S_total).fill(1), state.N_tiles);
  const tilesPerSectorMean = tilesPerSectorVector.reduce((a, b) => a + b, 0) / Math.max(1, S_total);
  const powerDensityScale = tilesPerSectorVector.map((desired, idx) => {
    const uniform = tilesUniformVector[idx] ?? 0;
    if (!(uniform > 0)) return desired > 0 ? null : 0;
    return desired / uniform;
  });

  state.hullAreaPerSector_m2 = sectorAreas;
  state.__hullAreaPerSectorSource = sectorAreaSource;
  state.tilesPerSectorVector = tilesPerSectorVector;
  state.tilesPerSectorUniform = tilesUniformVector;
  state.tilePowerDensityScale = powerDensityScale;
  state.tilesPerSectorStrategy = sectorAreaSource === "uniform" ? "uniform" : "area-weighted";
  if (state.hullArea) {
    state.hullArea = { ...state.hullArea, sectorAreas, sectors: S_total };
  }

  // HINT for clients: fraction of the bubble "visible" from a single concurrent pane.
  // The REAL pane can multiply this with its band/slice coverage to scale extrema and mass proxy.
  (state as any).viewMassFractionHint = state.activeFraction;
  state.tilesPerSector  = Math.max(0, Math.round(tilesPerSectorMean));
  const activeTilesBand = {
    min: Math.max(0, Math.floor((tilesBand.min ?? state.N_tiles) * (S_live_int / Math.max(1, S_total)))),
    max: Math.max(0, Math.ceil((tilesBand.max ?? state.N_tiles) * (S_live_int / Math.max(1, S_total)))),
  };
  state.activeTiles     = Math.max(0, Math.round(tilesPerSectorMean * S_live_int));
  (state as any).tiles = {
    total: state.N_tiles,
    active: state.activeTiles,
    totalBand: tilesBand,
    activeBand: activeTilesBand,
    tileArea_cm2: state.tileArea_cm2,
    hullArea_m2: state.hullArea_m2,
    hullAreaBand_m2: hullAreaBand,
    areaPerSector_m2: sectorAreas,
    areaPerSectorSource: sectorAreaSource,
    areaPerSectorSum_m2: sectorAreaSumScaled,
    tilesPerSectorVector,
    tilesPerSectorUniform: tilesUniformVector,
    tilePowerDensityScale: powerDensityScale,
  };

  // Safety alias for consumers that assume G├½├æ1 sectors for math
  (state as any).concurrentSectorsSafe = Math.max(1, state.concurrentSectors);

  // =┬â├╢┬║ expose both duties explicitly and consistently
  const dutyEffectiveSource: ControlSource =
    measuredDutyEffective != null
      ? "measured"
      : Number.isFinite(dutyShipOverride)
        ? dutyShipSource
        : "schedule";
  const dutyBurstSource: ControlSource =
    Number.isFinite(dutyLocalOverride)
      ? (state.dutyCycleSource ?? "design")
      : "schedule";
  state.dutyBurst        = dutyLocal;  // keep as *local* ON-window; prefer measured/local override
  state.dutyBurstSource  = dutyBurstSource;
  state.dutyEffective_FR = d_eff;             // ship-wide effective duty (for +┬ª & audits)
  (state as any).dutyEffectiveFR = d_eff; // legacy/camel alias
  (state as any).dutyMeasuredFR = measuredDutyEffective;
  (state as any).dutyEffectiveFRMeasured = measuredDutyEffective;
  (state as any).dutyEffectiveFRSource = dutyEffectiveSource;
  state.sectorDutySource = dutyEffectiveSource;
  (state as any).dutyMeasuredWindow_ms = measuredDutyEffective != null
    ? Number((strobeDuty as any)?.windowMs ?? (strobeDuty as any)?.window_ms ?? STROBE_DUTY_WINDOW_MS_DEFAULT)
    : undefined;
  state.dutyMeasuredFR = measuredDutyEffective ?? undefined;
  // (dutyCycle already set from MODE_CONFIGS above)

  // G┬ú├á First-class fields for UI display
  state.dutyShip = d_eff;          // Ship-wide effective duty (promoted from any)
  (state as any).dutyEff = d_eff;  // Legacy alias


  // 5) Stored energy (raw core): ensure valid input values
  // Keep qMechanical non-zero outside of standby
  if (state.qMechanical === 0 && state.currentMode !== 'standby') {
    state.qMechanical = 1; // restore default
  }

  // Clamp gammaGeo to sane range for UI inputs
  state.gammaGeo = Math.max(1, Math.min(1e3, state.gammaGeo));

  // Clamp modulationFreq_GHz to prevent divide-by-zero in TS calculations
  state.modulationFreq_GHz = Math.max(0.001, Math.min(1000, state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ));

  // Clamp gap_nm to physically reasonable range for Casimir calculations
  state.gap_nm = Math.max(0.1, Math.min(1000, state.gap_nm));

  // Clamp tileArea_cm2 to prevent invalid tile counting
  state.tileArea_cm2 = Math.max(0.01, Math.min(10000, state.tileArea_cm2));

  const gamma3 = Math.pow(state.gammaGeo, 3);
  state.U_geo = state.U_static * gamma3;
  state.U_Q   = state.U_geo * state.qMechanical;

  // 6) Power ? raw first, then power-only calibration via qMechanical
  const omega = 2 * Math.PI * (state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ) * 1e9;
  const Q = state.qCavity ?? PAPER_Q.Q_BURST;
  const perTilePower = (qMech: number) => Math.abs(state.U_geo * qMech) * omega / Q; // J/s per tile during ON

  const CALIBRATED = (modelMode === 'calibrated');
  const P_target_W = MODE_POLICY[state.currentMode].P_target_W;

  const modeCap_W = MODE_POLICY[state.currentMode]?.P_cap_W ?? Infinity;
  const physicsCap_W = perTilePower(1) * state.N_tiles * d_eff; // Deliverable with q_mech=1, no policy cap
  const P_cap_W = Math.min(physicsCap_W, modeCap_W); // Deliverable with q_mech=1, capped per mode
  state.P_target_W = P_target_W;
  state.physicsCap_W = physicsCap_W;
  state.P_cap_W = P_cap_W;

  let qMechDemand = state.qMechanical;
  let qMechApplied = state.qMechanical;
  let P_total_W = perTilePower(qMechApplied) * state.N_tiles * d_eff; // ship average

  if (CALIBRATED && P_target_W > 0 && !isStandby && P_total_W > 0) {
    const scaleP = P_target_W / P_total_W;
    qMechDemand = state.qMechanical * scaleP;               // what the solver would like
    qMechApplied = Math.min(1, Math.max(1e-6, qMechDemand)); // but clamp at unity
    state.qMechanical = qMechApplied;
    state.U_Q         = state.U_geo * state.qMechanical;
    P_total_W         = perTilePower(qMechApplied) * state.N_tiles * d_eff;
  } else if (P_target_W === 0 || isStandby) {
    // standby: force qMechanical->0 so stored-energy dissipation is zero
    qMechDemand = 0;
    qMechApplied = 0;
    state.qMechanical = 0;
    state.U_Q         = 0;
    P_total_W         = 0;
  } else {
    // Raw mode or no calibration: honor requested, but stay within safety band
    qMechApplied = Math.min(1, Math.max(1e-6, qMechApplied));
    state.qMechanical = qMechApplied;
    state.U_Q         = state.U_geo * state.qMechanical;
    P_total_W         = perTilePower(qMechApplied) * state.N_tiles * d_eff;
  }

  // Enforce per-mode power cap by scaling qMechanical if needed
  if (P_cap_W > 0 && P_total_W > P_cap_W) {
    const scaleToCap = P_cap_W / Math.max(P_total_W, 1e-12);
    qMechApplied = Math.min(1, Math.max(1e-6, qMechApplied * scaleToCap));
    state.qMechanical = qMechApplied;
    state.U_Q = state.U_geo * state.qMechanical;
    P_total_W = perTilePower(qMechApplied) * state.N_tiles * d_eff;
  }

  // Post-calibration clamping check for qMechanical
  const qMech_before = state.qMechanical;
  if (!isStandby) {
    state.qMechanical = Math.max(1e-6, Math.min(1, state.qMechanical));
  }
  (state as any).qMechanicalClamped = (state.qMechanical !== qMech_before);

  // Mechanical guard telemetry: demand vs applied with capacity and shortfall
  const appliedSafe = Math.max(1e-12, state.qMechanical);
  const mechSpoilage = qMechDemand > 0 ? qMechDemand / appliedSafe : 1;
  const pShortfall_W = Math.max(0, P_target_W - P_total_W);
  const mechanicalSafe = (state as any)?.mechanical?.safetyFeasible !== false;
  state.mechGuard = {
    qMechDemand,
    qMechApplied: state.qMechanical,
    mechSpoilage,
    pCap_W: P_cap_W,
    pApplied_W: P_total_W,
    pShortfall_W,
    status: (!mechanicalSafe && !isStandby)
      ? 'saturated'
      : (P_target_W > 0 && (qMechDemand > 1 || P_total_W >= P_cap_W) && !isStandby) ? 'saturated' : 'ok',
  };

  // Applied ship-average power after caps/guards
  state.P_applied_W = P_total_W;
  (state as any).P_applied_W = P_total_W;

  state.P_loss_raw = Math.abs(state.U_Q) * omega / Q;  // per-tile (with qMechanical)
  state.P_avg      = P_total_W / 1e6; // MW for HUD
  (state as any).P_avg_W = P_total_W; // W (explicit)

  // Derive HV bus voltage/current from per-mode policy and live power
  const busMode = (state.currentMode ?? 'hover') as keyof typeof BUS_VOLTAGE_POLICY_KV;
  const V_bus_kV = BUS_VOLTAGE_POLICY_KV[busMode] ?? BUS_VOLTAGE_POLICY_KV.hover;
  const P_bus_W = Number.isFinite((state as any).P_avg_W)
    ? Number((state as any).P_avg_W)
    : MODE_POLICY[busMode].P_target_W;
  const I_bus_A = V_bus_kV > 0 ? P_bus_W / (V_bus_kV * 1e3) : 0;
  state.busVoltage_kV = V_bus_kV;
  state.busCurrent_A = I_bus_A;
  (state as any).busVoltage_kV = V_bus_kV;
  (state as any).busCurrent_A = I_bus_A;

  // Expose labeled electrical power for dual-bar dashboards
  (state as any).P_elec_MW = state.P_avg;  // Electrical power (same as P_avg, but clearly labeled)
  // --- Cryo power AFTER calibration and AFTER mode qSpoilingFactor is applied ---
  const Q_on  = Q;
  // qSpoilingFactor is idle Q multiplier: >1 G├º├å less idle loss (higher Q_off)
  const Q_off = Math.max(1, Q_on * state.qSpoilingFactor); // use mode-specific qSpoilingFactor
  const P_tile_on   = Math.abs(state.U_Q) * omega / Q_on;
  const P_tile_idle = Math.abs(state.U_Q) * omega / Q_off;
  (state as any).P_cryo_MW = ((P_tile_on * d_eff + P_tile_idle * (1 - d_eff)) * state.N_tiles) / 1e6;

  // 7) Mass - derive from cycle-averaged energy density (no free energy knob)
  const gap_m = Math.max(1e-12, state.gap_nm * NM_TO_M);
  const tileVolume_m3 = Math.max(0, tileArea_m2 * gap_m);
  const baseGammaRequest = Number.isFinite(state.gammaVanDenBroeck)
    ? (state.gammaVanDenBroeck as number)
    : PAPER_VDB.GAMMA_VDB;
  const guardInputHull = {
    Lx_m: hullDims.Lx_m,
    Ly_m: hullDims.Ly_m,
    Lz_m: hullDims.Lz_m,
    wallThickness_m: (state.hull ?? {}).wallThickness_m ?? hullDims.wallThickness_m,
  };
  const vdbGuard = guardGammaVdB({
    hull: guardInputHull,
    gammaRequested: baseGammaRequest,
  });
  const gammaSeed = Math.min(PAPER_VDB.GAMMA_VDB, vdbGuard.limit);

  const massFromGamma = (gammaVdBValue: number) => {
    const { rho_avg, rho_inst } = enhancedAvgEnergyDensity({
      gap_m,
      gammaGeo: state.gammaGeo,
      cavityQ: Q,
      gammaVanDenBroeck: gammaVdBValue,
      qSpoilingFactor: state.qSpoilingFactor,
      rho0Scale: casimirScaleApplied,
      dutyEff: d_eff,
    });
    const U_inst = rho_inst * tileVolume_m3;
    const U_avg  = rho_avg * tileVolume_m3;
    const M_tot  = (Math.abs(U_avg) / (C * C)) * state.N_tiles;
    return { rho_avg, rho_inst, U_inst, U_avg, M_tot };
  };

  let gammaVanDenBroeck = gammaSeed;
  let massChain = massFromGamma(gammaVanDenBroeck);

  const M_target = MODE_POLICY[state.currentMode].M_target_kg;
  const userM = state.exoticMassTarget_kg ?? M_target;
  const allowTargetCalibration = CALIBRATED && massMode === "TARGET_CALIBRATED";
  let didTargetCalibration = false;
  let targetShortfall = 0;
  if (allowTargetCalibration && userM > 0 && massChain.M_tot > 0) {
    const scaleM = userM / massChain.M_tot;
    const gammaCandidate = gammaVanDenBroeck * scaleM;
    const gammaClamped = Math.max(0, Math.min(gammaCandidate, vdbGuard.limit));
    gammaVanDenBroeck = gammaClamped;
    massChain = massFromGamma(gammaVanDenBroeck);
    didTargetCalibration = true;
    if (gammaCandidate > vdbGuard.limit) {
      targetShortfall = massChain.M_tot / Math.max(userM, 1e-9);
    }
  } else if (userM <= 0 || isStandby) {
    gammaVanDenBroeck = 0;
    massChain = massFromGamma(gammaVanDenBroeck);
  }

  state.gammaVanDenBroeck = gammaVanDenBroeck;
  if (didTargetCalibration) {
    state.gammaVanDenBroeckSource = "target";
  }
  state.M_exotic_raw = massChain.M_tot;
  state.M_exotic     = massChain.M_tot;

  // Post-calibration clamping check for gammaVanDenBroeck
  const gammaVdB_before = baseGammaRequest;
  (state as any).gammaVanDenBroeckClamped =
    (state.gammaVanDenBroeck !== gammaVdB_before) || gammaVdB_before > vdbGuard.limit;

  // Mass calibration readout
  state.massCalibration = state.gammaVanDenBroeck / PAPER_VDB.GAMMA_VDB;
  state.rho_inst = massChain.rho_inst;
  state.rho_avg  = massChain.rho_avg;
  state.rho_static = tileVolume_m3 > 0 ? state.U_static / tileVolume_m3 : undefined;
  state.gammaChain = {
    geo_cubed: Math.pow(state.gammaGeo, 3),
    qGain: Math.sqrt(Math.max(1, Q) / 1e9),
    pocketCompression: state.gammaVanDenBroeck,
    dutyEffective: d_eff,
    qSpoiling: state.qSpoilingFactor,
    note: "rho_avg = rho0 * gamma_geo^3 * sqrt(Q/1e9) * gamma_VdB * q_spoil * d_eff",
  };

  const massSource: MassSource = didTargetCalibration
    ? "target"
    : measuredScaleApplied
    ? "measured"
    : "model";
  state.massSource = massSource;
  state.massDatasetId = massSource === "measured" ? measuredDatasetId : undefined;
  state.massFitResiduals = massSource === "measured"
    ? measuredFitResiduals
    : undefined;
  if (!state.massSource) {
    state.massSource = "model";
  }
    if (state.massSource === "measured" && !state.massDatasetId) {
      (state as any).massSourceNote = "measured_missing_datasetId";
      if (massMode === "MEASURED_FORCE_INFERRED") {
        throw new Error(
          "MEASURED_FORCE_INFERRED requires experimental.casimirForce.datasetId",
      );
    }
    if (DEBUG_PIPE) {
      console.warn("[PIPELINE] massSource=measured requires datasetId; downgrading to model.");
    }
      state.massSource = "model";
      state.massDatasetId = undefined;
      state.massFitResiduals = undefined;
    }
    if (
      state.massSource === "measured" &&
      Number.isFinite(state.M_exotic) &&
      Number.isFinite(measuredScaleRelSigma)
    ) {
      state.massSigma_kg =
        Math.abs(state.M_exotic) * (measuredScaleRelSigma as number);
    } else {
      state.massSigma_kg = undefined;
    }

  const guardForApplied = guardGammaVdB({
    hull: guardInputHull,
    gammaRequested: state.gammaVanDenBroeck,
  });
    state.gammaVanDenBroeckGuard = {
      ...guardForApplied,
      requested: baseGammaRequest,
      targetHit: allowTargetCalibration ? targetShortfall === 0 : undefined,
      targetShortfall: allowTargetCalibration ? (targetShortfall || undefined) : undefined,
    };
    (state as any).gammaVanDenBroeck_guard = state.gammaVanDenBroeckGuard;
    state.vdbRegionII = computeVdbRegionII({
      gammaVdB: state.gammaVanDenBroeck,
      pocketRadius_m: guardForApplied.pocketRadius_m,
      pocketThickness_m: guardForApplied.pocketThickness_m,
    }) ?? undefined;
    const bubbleParams = resolveBubbleWallParams(state);
    const vdbRegionIVBeta = firstFinite(
      (state as any).beta_avg,
      Number((state as any)?.bubble?.beta),
      Number((state as any)?.beta),
      Number((state as any)?.dynamicConfig?.beta),
    );
    state.vdbRegionIV = bubbleParams
      ? computeVdbRegionIV({
          R: bubbleParams.R,
          sigma: bubbleParams.sigma,
          beta: vdbRegionIVBeta,
        }) ?? undefined
      : undefined;
    const vdbRegionIIDerivativeSupport = hasVdbRegionIIMetricSupport(state.vdbRegionII);
    const vdbRegionIVDfdrMaxAbs = Number(state.vdbRegionIV?.dfdr_max_abs);
    const vdbRegionIVDerivativeSupport =
      state.vdbRegionIV?.support === true &&
      Number.isFinite(vdbRegionIVDfdrMaxAbs) &&
      Math.abs(vdbRegionIVDfdrMaxAbs) > VDB_DFDR_MIN_ABS;
    const vdbTwoWallDerivativeSupport =
      vdbRegionIIDerivativeSupport && vdbRegionIVDerivativeSupport;
    (state as any).vdb_region_ii_derivative_support = vdbRegionIIDerivativeSupport;
    (state as any).vdb_region_iv_derivative_support = vdbRegionIVDerivativeSupport;
    (state as any).vdb_two_wall_derivative_support = vdbTwoWallDerivativeSupport;
    // Split gamma_VdB into visual vs mass knobs to keep calibrator away from renderer
  (state as any).gammaVanDenBroeck_mass = state.gammaVanDenBroeck;   // G├Ñ├ë pipeline value (targeted when enabled)
  (state as any).gammaVanDenBroeck_vis  = PAPER_VDB.GAMMA_VDB;                 // G├Ñ├ë fixed "physics/visual" seed for renderer

  // Make visual factor mode-invariant (except standby)
  if (state.currentMode !== 'standby') {
    (state as any).gammaVanDenBroeck_vis = PAPER_VDB.GAMMA_VDB; // constant across modes
  } else {
    (state as any).gammaVanDenBroeck_vis = 1; // keep standby dark
  }

  // Precomputed physics-only ++ gain for client verification
  // Canonical ship-wide ++ (authoritative):
  //   ++ = +┬ª_geo^3 -+ q -+ +┬ª_VdB -+ duty_FR
  // Use the calibrated/mass +┬ª_VdB when available; fall back to visual seed if not.
  const _gammaVdB_forTheta = Number.isFinite(state.gammaVanDenBroeck)
    ? state.gammaVanDenBroeck
    : ((state as any).gammaVanDenBroeck_vis ?? PAPER_VDB.GAMMA_VDB);

  // DEBUG: ++-Scale Field Strength Audit (dual-value: raw vs calibrated)
  const gammaVdB_raw = PAPER_VDB.GAMMA_VDB;  // Raw paper value (1e11)
  const gammaVdB_cal = _gammaVdB_forTheta;   // Pipeline value (target-adjusted when enabled)

  const thetaComponents = {
    gammaGeo: state.gammaGeo,
    gammaGeo_cubed: Math.pow(state.gammaGeo, 3),
    qSpoilingFactor: state.qSpoilingFactor ?? 1,
    dutyEffective: Math.max(1e-12, state.dutyEffective_FR ?? d_eff),
    gammaVdB_raw,
    gammaVdB_cal
  };

  // Calculate both raw and calibrated theta
  const thetaRaw = thetaComponents.gammaGeo_cubed *
    thetaComponents.qSpoilingFactor *
    gammaVdB_raw *
    thetaComponents.dutyEffective;

  const thetaCal = thetaComponents.gammaGeo_cubed *
    thetaComponents.qSpoilingFactor *
    gammaVdB_cal *
    thetaComponents.dutyEffective;

  // Store calibrated value as the "expected" (what the pipeline actually uses)
  (state as any).thetaScaleExpected = thetaCal;

  // Store model mode for UI fallback
  (state as any).modelMode = modelMode;

  // Store both values for audit
  (state as any).thetaRaw = thetaRaw;
  (state as any).thetaCal = thetaCal;

  // Publish compact thetaAudit for UI consumption
  (state as any).uniformsExplain ??= {};
  (state as any).uniformsExplain.thetaAudit = {
    mode: modelMode,
    eq: "++ = +┬ª_geo^3 -+ q -+ +┬ª_VdB -+ d_eff",
    massMode,
    inputs: {
      gammaGeo: state.gammaGeo,
      q: state.qSpoilingFactor,
      gammaVdB_raw: PAPER_VDB.GAMMA_VDB,
      gammaVdB_cal: state.gammaVanDenBroeck,
      d_eff: Math.max(1e-12, state.dutyEffective_FR ?? d_eff)
    },
    results: { thetaRaw, thetaCal }
  };

  const grEnabled = state.grEnabled === true;
  if (!grEnabled) {
    delete (state as any).gr;
  } else if (state.gr?.constraints) {
    (state as any).uniformsExplain.thetaAudit.gr = {
      H_constraint: state.gr.constraints.H_constraint,
      M_constraint: state.gr.constraints.M_constraint,
      updatedAt: state.gr.updatedAt,
      source: state.gr.source,
    };
  }

  console.log('=┬â├╢├¼ ++-Scale Field Strength Audit (Raw vs Pipeline):', {
    mode: modelMode,
    massMode,
    formula: '++ = +┬ª_geo^3 -+ q -+ +┬ª_VdB -+ d_eff',
    components: thetaComponents,
    results: {
      thetaRaw: thetaRaw,
      thetaRawSci: thetaRaw.toExponential(2),
      thetaCal: thetaCal,
      thetaCalSci: thetaCal.toExponential(2),
      ratio: thetaRaw / thetaCal,
      gammaVdBRatio: gammaVdB_raw / gammaVdB_cal
    },
    expected_raw: 4.4e10,
    ratio_vs_expected: thetaRaw / 4.4e10
  });

  // Overall clamping status for UI warnings
  (state as any).parametersClamped = (state as any).qMechanicalClamped || (state as any).gammaVanDenBroeckClamped;

  /* G├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├ç
     "Explain-it" counters for HUD/debug
  G├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├ç */
  (state as any).E_tile_static_J = Math.abs(state.U_static);  // Static Casimir energy per tile
  (state as any).E_tile_geo_J = Math.abs(state.U_geo);        // Geometric amplified energy per tile  
  (state as any).E_tile_on_J = Math.abs(state.U_Q);           // Stored energy per tile in on-window
  (state as any).P_tile_on_W = state.P_loss_raw;              // Power per tile during on-window
  (state as any).d_eff = d_eff;                               // Ship-wide effective duty (first-class)
  (state as any).M_per_tile_kg = state.N_tiles > 0 ? state.M_exotic / state.N_tiles : 0; // Mass per tile


  // Physics logging for debugging (before UI field updates)
  if (DEBUG_PIPE) console.log("[PIPELINE]", {
    mode: state.currentMode, model: modelMode, massMode,
    dutyShip: d_eff, dutyUI_before: state.dutyCycle, S_live, N: state.N_tiles,
    gammaGeo: state.gammaGeo, qCavity: state.qCavity, gammaVdB: state.gammaVanDenBroeck,
    U_static: state.U_static, U_Q: state.U_Q, P_loss_raw: state.P_loss_raw,
    P_avg_MW: state.P_avg, M_raw: state.M_exotic_raw, M_final: state.M_exotic,
    massCal: state.massCalibration
  });

  /* G├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├ç
     Additional metrics (derived)
  G├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├çG├╢├ç */

  // --- Time-scale separation (TS) using actual hull size ---
  const { Lx_m, Ly_m, Lz_m } = state.hull!;
  const L_long = Math.max(Lx_m, Ly_m, Lz_m);                // conservative: longest light-crossing
  const L_geom = Math.cbrt(Lx_m * Ly_m * Lz_m);             // geometric mean (volume-equivalent length)

  // Recompute f_m and T_m in this scope (fix scope bug)
  const f_m_ts = (state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ) * 1e9; // Hz
  const T_m_ts = 1 / f_m_ts;                              // s

  const T_long = L_long / C;   // s
  const T_geom = L_geom / C;   // s

  state.TS_long = T_long / T_m_ts;   // most conservative
  state.TS_geom = T_geom / T_m_ts;   // typical
  state.TS_ratio = state.TS_long;    // keep existing field = conservative

  // Wall-scale TS (often more relevant than hull-scale)
  const w = state.hull?.wallThickness_m ?? DEFAULT_WALL_THICKNESS_M;
  const T_wall = w / C;
  (state as any).TS_wall = T_wall / T_m_ts;

  // Homogenization status for UI badging
  (state as any).isHomogenized = state.TS_long! > 1e3; // fast-average regime vs borderline

  // Keep these around for the metrics + HUD
  state.__fr = {
    dutyShip: d_eff,        // Ship-wide effective duty (averaged over sectors)
    dutyEffectiveFR: d_eff, // Same as dutyShip (Ford-Roman compliance)
    dutyMeasuredFR: measuredDutyEffective ?? null,
    dutySource: measuredDutyEffective != null ? "measured" : "schedule",
    zeta_baseline: 1,       // Guardrail now computed from sampled waveform
  };

  // 9) Mode policy calibration already applied above - power and mass targets hit automatically

  // Duty-cycled energy and curvature limit (corrected)
  state.U_cycle = state.U_Q * d_eff;

  // Expose timing details for metrics API (corrected naming)
  const strobeHzOverride = Number(state.strobeHz);
  state.strobeHz =
    Number.isFinite(strobeHzOverride) && strobeHzOverride > 0
      ? strobeHzOverride
      : Number(process.env.STROBE_HZ ?? 1000); // sectors/sec (1ms macro-tick)
  state.sectorPeriod_ms     = 1000 / Math.max(1, state.strobeHz);
  state.modelMode           = modelMode; // for client consistency
  state.massMode            = massMode;  // for client consistency

  // Compliance flags (physics-based safety)
  state.natarioConstraint   = true;

  // Audit guard (pipeline self-consistency check)
  (function audit() {
    const P_tile = Math.abs(state.U_Q) * omega / Q;
    const P_exp  = P_tile * state.N_tiles * d_eff / 1e6;
    if (Math.abs(state.P_avg - P_exp) > 1e-6 * Math.max(1, P_exp)) {
      if (DEBUG_PIPE) console.warn("[AUDIT] P_avg drift; correcting", {reported: state.P_avg, expected: P_exp});
      state.P_avg = P_exp;
      (state as any).P_avg_W = P_exp * 1e6; // W (explicit)
    }

    const rhoAvgAudit = Number.isFinite((state as any).rho_avg)
      ? ((state as any).rho_avg as number)
      : null;
    const E_tile_mass = rhoAvgAudit != null
      ? rhoAvgAudit * tileVolume_m3
      : Math.abs(state.U_static) * Math.pow(state.gammaGeo,3) * PAPER_Q.Q_BURST * state.gammaVanDenBroeck * d_eff;
    const M_exp  = (E_tile_mass / (C*C)) * state.N_tiles;
    if (Math.abs(state.M_exotic - M_exp) > 1e-6 * Math.max(1, M_exp)) {
      if (DEBUG_PIPE) console.warn("[AUDIT] M_exotic drift; correcting", {reported: state.M_exotic, expected: M_exp});
      state.M_exotic_raw = state.M_exotic = M_exp;
    }
  })();

  // Overall status (mode-aware power thresholds)
  // Mode configuration already applied early in function - no need to duplicate
  state.sectorStrobing  = state.concurrentSectors;         // G┬ú├á Legacy alias for UI compatibility
  // Phase scheduler (PR-3): compute per-sector phase offsets and assign roles.
  const totalSectors = Math.max(
    1,
    Number.isFinite(state.sectorCount) ? state.sectorCount : DEFAULT_SECTORS_TOTAL,
  );
  const hw = state.hardwareTruth?.sectorState ?? null;
  const hwDwellMs = Number(hw?.dwell_ms);
  const hwBurstMs = Number(hw?.burst_ms);
  const hwTauLcMs = Number(hw?.tauLC_ms);
  const hwTelemetryPeriodMs = Number(hw?.phaseScheduleTelemetry?.sectorPeriod_ms);
  const fallbackPeriodRaw = Number(state.sectorPeriod_ms);
  let fallbackPeriod = Number.isFinite(fallbackPeriodRaw) ? fallbackPeriodRaw : DEFAULT_SECTOR_PERIOD_MS;
  if (!(fallbackPeriod > 0)) fallbackPeriod = DEFAULT_SECTOR_PERIOD_MS;
  let sectorPeriodMs = fallbackPeriod;
  if (Number.isFinite(hwDwellMs) && hwDwellMs > 0) {
    sectorPeriodMs = hwDwellMs;
  } else if (Number.isFinite(hwTelemetryPeriodMs) && hwTelemetryPeriodMs > 0) {
    sectorPeriodMs = hwTelemetryPeriodMs;
  }
  if (!(sectorPeriodMs > 0)) {
    sectorPeriodMs = fallbackPeriod > 0 ? fallbackPeriod : DEFAULT_SECTOR_PERIOD_MS;
  }

  // --- Construct light-crossing packet (single source of truth) ---
  const baseDwell_ms = Number.isFinite(hwDwellMs) && hwDwellMs > 0 ? hwDwellMs : sectorPeriodMs;
  const geometryTau_ms = computeTauLcMsFromHull(state.hull ?? hullDims);
  const baseTauCandidate_ms = Number.isFinite(hwTauLcMs)
    ? hwTauLcMs
    : Number.isFinite(state.tauLC_ms)
    ? state.tauLC_ms
    : (geometryTau_ms ?? (DEFAULT_WALL_THICKNESS_M / C) * 1e3);
  let baseTauLC_ms = baseTauCandidate_ms;
  if (Number.isFinite(baseTauLC_ms) && Number.isFinite(geometryTau_ms)) {
    const candidate = baseTauLC_ms as number;
    const geometry = geometryTau_ms as number;
    const drift = Math.max(candidate, geometry) / Math.max(1e-12, Math.min(candidate, geometry));
    if (drift >= TAU_LC_UNIT_DRIFT_LIMIT) {
      console.warn("[light-crossing][unit-drift]", {
        candidate_ms: candidate,
        geometry_ms: geometry,
        source: Number.isFinite(hwTauLcMs) ? "hardware" : "state",
        limit: TAU_LC_UNIT_DRIFT_LIMIT,
      });
      baseTauLC_ms = geometry;
      (state as any).lightCrossingUnitWarning = { candidate_ms: candidate, geometry_ms: geometry, source: "pipeline" };
    }
  } else if (Number.isFinite(geometryTau_ms)) {
    baseTauLC_ms = geometryTau_ms as number;
  }
  // Prefer the previous autoscaled burst (persisted on state) when hardware does not supply one;
  // otherwise we snap back to the duty-based default each request and TS jumps between 100/50.
  const prevBurstNs =
    Number.isFinite((state as any).__ts_lastBurst_ns) && (state as any).__ts_lastBurst_ns > 0
      ? (state as any).__ts_lastBurst_ns
      : Number.isFinite(state.tsAutoscale?.appliedBurst_ns)
      ? state.tsAutoscale!.appliedBurst_ns!
      : Number.isFinite(state.lightCrossing?.burst_ns)
      ? state.lightCrossing!.burst_ns!
      : undefined;
  const prevBurstMs = Number.isFinite(prevBurstNs) ? (prevBurstNs as number) / 1e6 : undefined;

  const dutyBurst = Number.isFinite(state.dutyBurst) ? Number(state.dutyBurst) : PAPER_DUTY.BURST_DUTY_LOCAL;
  let baseBurst_ms: number;
  let baseBurstSource: string;
  if (Number.isFinite(hwBurstMs)) {
    baseBurst_ms = hwBurstMs as number;
    baseBurstSource = "hardware";
  } else if (Number.isFinite(prevBurstMs) && (prevBurstMs as number) > 0) {
    baseBurst_ms = prevBurstMs as number;
    baseBurstSource = "autoscale_prev";
  } else {
    baseBurst_ms = baseDwell_ms * dutyBurst;
    baseBurstSource = "duty_fallback";
  }
  (state as any).__ts_baseBurst_ms = baseBurst_ms;
  (state as any).__ts_baseBurst_source = baseBurstSource;

  const lightCrossing = {
    tauLC_ms: baseTauLC_ms,
    burst_ms: baseBurst_ms,
    burst_ns: Number.isFinite(baseBurst_ms) ? (baseBurst_ms as number) * 1e6 : undefined,
    dwell_ms: baseDwell_ms,
  };
  const wallNow = nowMs;
  const wallPrev = Number.isFinite((state as any).__wall_ts) ? ((state as any).__wall_ts as number) : null;
  const wallDt_s = wallPrev != null ? Math.max(0, (wallNow - wallPrev) / 1000) : 0;
  (state as any).__wall_prev_ms = wallPrev;
  (state as any).__wall_ts = wallNow;
  (state as any).__dt_wall_s = wallDt_s;
  const tauLC_s = Number.isFinite(lightCrossing.tauLC_ms)
    ? (lightCrossing.tauLC_ms as number) / 1000
    : 0;
  const tauPulse_s = Number.isFinite(lightCrossing.burst_ms)
    ? Math.max(1e-12, (lightCrossing.burst_ms as number) / 1000)
    : 1e-12;
  const tsCurrent = tauPulse_s > 0 ? tauLC_s / tauPulse_s : Number.NaN;
  const tsCfg = {
    enabled: process.env.TS_AUTOSCALE_ENABLE !== "false",
    target: parseEnvNumber(process.env.TS_AUTOSCALE_TARGET, 100),
    slewPerSec: Math.max(0, parseEnvNumber(process.env.TS_AUTOSCALE_SLEW, 0.25)),
    floor_ns: Math.max(
      0,
      parseEnvNumber(
        process.env.TS_AUTOSCALE_FLOOR_NS ?? process.env.TS_AUTOSCALE_MIN_PULSE_NS,
        20,
      ),
    ),
    windowTol: Math.max(0, parseEnvNumber(process.env.TS_AUTOSCALE_WINDOW_TOL, 0.05)),
  };
  const tsNow = wallNow;
  const tsDt_s = Number.isFinite((state as any).__ts_lastUpdate)
    ? Math.max(0, (tsNow - (state as any).__ts_lastUpdate) / 1000)
    : 0;
  let tsAuto: TsAutoscaleState | undefined;
  try {
    const prevBurst_ns = Number.isFinite(lightCrossing.burst_ns)
      ? (lightCrossing.burst_ns as number)
      : Math.max(1, tauPulse_s * 1e9);
    tsAuto = stepTsAutoscale({
      enable: tsCfg.enabled,
      targetTS: tsCfg.target,
      slewPerSec: tsCfg.slewPerSec,
      floor_ns: tsCfg.floor_ns,
      windowTol: tsCfg.windowTol,
      TS_ratio: tsCurrent,
      tauPulse_ns: prevBurst_ns,
      dt_s: tsDt_s,
      prevBurst_ns,
    });
    if (tsAuto) {
      tsAuto.lastTickMs = tsNow;
      tsAuto.dtLast_s = tsDt_s;
    }
    (state as any).__ts_lastUpdate = tsNow;
    (state as any).__ts_lastBurst_ns = tsAuto.appliedBurst_ns;
    (state as any).__ts_dt_s = tsDt_s;
    (state as any).tsAutoscale = tsAuto;
    const scale = prevBurst_ns > 0 ? tsAuto.appliedBurst_ns / prevBurst_ns : 1;
    lightCrossing.burst_ns = tsAuto.appliedBurst_ns;
    lightCrossing.burst_ms = tsAuto.appliedBurst_ns / 1e6;
    if (Number.isFinite(scale) && scale > 0) {
      sectorPeriodMs = Math.max(0.01, sectorPeriodMs * scale);
      lightCrossing.dwell_ms = sectorPeriodMs;
    }
  } catch (err) {
    if (DEBUG_PIPE) console.warn("[TS-autoscale][error]", err);
  }

  // Build clocking snapshot (TS, epsilon) from the best timing data we have.
  // If we are operating purely on derived defaults (no hardware tau_LC or burst),
  // treat the result as tentative so the UI doesn't hard-fail before telemetry arrives.
  const derivedOnlyClocking = !Number.isFinite(hwTauLcMs) && !Number.isFinite(hwBurstMs);
  let clockingProvenance: "derived" | "hardware" | "simulated" =
    derivedOnlyClocking ? "derived" : "hardware";
  let clocking = computeClocking({
    tauLC_ms: lightCrossing.tauLC_ms,
    burst_ms: lightCrossing.burst_ms,
    dwell_ms: lightCrossing.dwell_ms,
    sectorPeriod_ms: sectorPeriodMs,
    hull: state.hull,
    localDuty: state.dutyBurst,
  });
  if (derivedOnlyClocking && (clocking.regime === "fail" || !Number.isFinite(clocking.TS as number))) {
    // Simulate a safe clocking profile by clamping tau_pulse << tau_LC so the UI can show a proxy.
    const tauLCsim_ms = Number.isFinite(lightCrossing.tauLC_ms)
      ? (lightCrossing.tauLC_ms as number)
      : Math.max(1e-3, computeTauLcMsFromHull(state.hull ?? hullDims) ?? 1);
    const dwellSim_ms = Number.isFinite(lightCrossing.dwell_ms)
      ? (lightCrossing.dwell_ms as number)
      : sectorPeriodMs;
    const tauPulseSim_ms = Math.min(
      Math.max(1e-6, lightCrossing.burst_ms ?? tauLCsim_ms * 0.02),
      tauLCsim_ms * 0.02,
    );
    const dutySim = dwellSim_ms > 0 ? tauPulseSim_ms / dwellSim_ms : undefined;
    clocking = computeClocking({
      tauLC_ms: tauLCsim_ms,
      burst_ms: tauPulseSim_ms,
      dwell_ms: dwellSim_ms,
      sectorPeriod_ms: dwellSim_ms,
      hull: state.hull,
      localDuty: dutySim,
    });
    clocking = {
      ...clocking,
      detail: `${clocking.detail}; simulated from hull geometry (no hardware timing)`,
    };
    clockingProvenance = "simulated";
  }
  const tsClockRaw = Number(clocking.TS);
  const tsMissing = !Number.isFinite(tsClockRaw) || tsClockRaw <= 0;
  if (tsMissing || clocking.regime === "unknown") {
    (state as any).averagingNote =
      "Awaiting hardware tau_pulse/tau_LC; supply timing so guardrail can validate cycle-average.";
  } else {
    delete (state as any).averagingNote;
  }
  if (
    DEBUG_PIPE &&
    (!Number.isFinite(clocking.TS as number) || (clocking.TS as number) <= 0)
  ) {
    console.warn("[clocking][TS-zero]", {
      detail: clocking.detail,
      tauPulse_ms: clocking.tauPulse_ms,
      tauLC_ms: clocking.tauLC_ms,
      burst_ms: lightCrossing.burst_ms,
      dwell_ms: lightCrossing.dwell_ms,
      sectorPeriod_ms: sectorPeriodMs,
      duty: state.dutyBurst ?? state.dutyCycle,
    });
  }
  lightCrossing.tauLC_ms = clocking.tauLC_ms ?? lightCrossing.tauLC_ms;
  lightCrossing.burst_ms = clocking.tauPulse_ms ?? lightCrossing.burst_ms;
  lightCrossing.dwell_ms = clocking.dwell_ms ?? lightCrossing.dwell_ms;
  (state as any).lightCrossing = lightCrossing;
  (state as any).tauLC_ms = lightCrossing.tauLC_ms;
  const clockingTS = Number(clocking.TS);
  const clockingWithTS: ClockingSnapshot = {
    ...clocking,
    TS: Number.isFinite(clockingTS) && clockingTS > 0 ? clockingTS : clocking.TS ?? null,
  };
  const tsMetricStatusPreWarp = resolveTsMetricDerivedStatus(
    state,
    clockingProvenance,
  );
  clockingWithTS.metricDerived = tsMetricStatusPreWarp.metricDerived;
  clockingWithTS.metricDerivedSource = tsMetricStatusPreWarp.source;
  clockingWithTS.metricDerivedReason = tsMetricStatusPreWarp.reason;
  clockingWithTS.metricDerivedChart = tsMetricStatusPreWarp.chart;
  state.clocking = clockingWithTS;
  state.clockingProvenance = clockingProvenance;
  state.tsMetricDerived = tsMetricStatusPreWarp.metricDerived;
  state.tsMetricDerivedSource = tsMetricStatusPreWarp.source;
  state.tsMetricDerivedReason = tsMetricStatusPreWarp.reason;
  (state as any).averaging = clockingWithTS;
  (state as any).tsMetricDerived = tsMetricStatusPreWarp.metricDerived;
  (state as any).tsMetricDerivedSource = tsMetricStatusPreWarp.source;
  (state as any).tsMetricDerivedReason = tsMetricStatusPreWarp.reason;
  (state as any).TS_modulation = state.TS_ratio;
  const tsCandidate = Number(clocking.TS);
  const tsFallback = Number.isFinite(state.TS_ratio)
    ? state.TS_ratio
    : Number.isFinite(state.TS_long)
    ? (state.TS_long as number)
    : Number.isFinite(state.TS_geom)
    ? (state.TS_geom as number)
    : 0;
  const tsEffectiveRaw =
    Number.isFinite(tsCandidate) && tsCandidate > 0 ? tsCandidate : tsFallback;
  const tsEffective = Number.isFinite(tsEffectiveRaw) && tsEffectiveRaw > 0 ? tsEffectiveRaw : 1e-9;
  state.TS_long = tsEffective;
  state.TS_ratio = tsEffective;
  (state as any).lightCrossing.TS = tsEffective;

  state.sectorPeriod_ms = sectorPeriodMs;
  const normalizePhase01 = (value: number) => ((value % 1) + 1) % 1;
  const derivedPhase01 =
    sectorPeriodMs > 0 ? ((Date.now() % sectorPeriodMs) / sectorPeriodMs) : 0;
  const hwPhase01 = Number(hw?.phase01);
  const overridePhase01 = Number(state.phase01);
  const phase01 = Number.isFinite(hwPhase01)
    ? normalizePhase01(hwPhase01)
    : Number.isFinite(overridePhase01)
      ? normalizePhase01(overridePhase01)
      : derivedPhase01;
  state.phase01 = phase01;
  const tauMs = Number.isFinite(state.qi?.tau_s_ms)
    ? Number(state.qi!.tau_s_ms)
    : DEFAULT_QI_SETTINGS.tau_s_ms;
  const sampler = state.qi?.sampler ?? DEFAULT_QI_SETTINGS.sampler;
  const negativeFraction =
    Number.isFinite(state.negativeFraction)
      ? Math.max(0, Math.min(1, state.negativeFraction))
      : DEFAULT_NEGATIVE_FRACTION;

  const phaseSchedule = computeSectorPhaseOffsets({
    N: totalSectors,
    sectorPeriod_ms: sectorPeriodMs,
    phase01,
    tau_s_ms: tauMs,
    sampler,
    negativeFraction,
    deltaPos_deg: 90,
    neutral_deg: 45,
  });

  const roleSets = {
    neg: new Set(phaseSchedule.negSectors),
    pos: new Set(phaseSchedule.posSectors),
  };

  if (state.gateAnalytics && Array.isArray(state.gateAnalytics.pulses)) {
    const scheduled = applyPhaseScheduleToPulses(
      state.gateAnalytics.pulses,
      phaseSchedule.phi_deg_by_sector,
      roleSets,
    );
    state.gateAnalytics = {
      ...state.gateAnalytics,
      pulses: scheduled,
    };
  }

  state.phaseSchedule = {
    N: totalSectors,
    sectorPeriod_ms: sectorPeriodMs,
    phase01,
    phi_deg_by_sector: phaseSchedule.phi_deg_by_sector,
    negSectors: phaseSchedule.negSectors,
    posSectors: phaseSchedule.posSectors,
    sampler,
    tau_s_ms: tauMs,
    weights: phaseSchedule.weights,
  };

  const qiGuardPre = evaluateQiGuardrail(state, {
    schedule: phaseSchedule,
    sectorPeriod_ms: sectorPeriodMs,
    sampler,
    tau_ms: tauMs,
  });
  let qiGuard = qiGuardPre;
  const tsTelemetry: TsTelemetry = {
    TS_ratio: Number.isFinite(state.TS_ratio) ? state.TS_ratio : tsCurrent,
    tauLC_ms: lightCrossing.tauLC_ms,
    tauPulse_ns: lightCrossing.burst_ns,
    metricDerived: state.tsMetricDerived,
    metricDerivedSource: state.tsMetricDerivedSource,
    metricDerivedReason: state.tsMetricDerivedReason,
    metricDerivedChart: state.clocking?.metricDerivedChart,
    autoscale: tsAuto
      ? {
          ...tsAuto,
          target: tsCfg.target,
          slew: tsCfg.slewPerSec,
          floor_ns: tsCfg.floor_ns,
          lastTickMs: tsNow,
          dtLast_s: tsDt_s,
        }
      : undefined,
  };
  state.tsAutoscale = tsTelemetry.autoscale;
  state.ts = tsTelemetry;
  (state as any).ts = tsTelemetry;
  const autoscaleTarget = Number.isFinite(QI_AUTOSCALE_TARGET)
    ? clampNumber(QI_AUTOSCALE_TARGET, 1e-6, 1e6)
    : 0.9;
  const autoscaleMinScale = Number.isFinite(QI_AUTOSCALE_MIN_SCALE)
    ? clampNumber(QI_AUTOSCALE_MIN_SCALE, 0, 1)
    : 0.02;
  const autoscaleSlewPerS = Number.isFinite(QI_AUTOSCALE_SLEW) ? Math.max(0, QI_AUTOSCALE_SLEW) : 0.25;
  const autoscaleWindowTol =
    Number.isFinite(QI_AUTOSCALE_WINDOW_TOL) && (QI_AUTOSCALE_WINDOW_TOL as number) >= 0
      ? (QI_AUTOSCALE_WINDOW_TOL as number)
      : 0.05;
  const autoscaleSource = strictCongruenceEnabled()
    ? process.env.QI_AUTOSCALE_SOURCE ?? "metric"
    : QI_AUTOSCALE_SOURCE ?? "tile-telemetry";
  const autoscaleNow = wallNow;
  const autoscaleClamps: QiAutoscaleClampReason[] = [];
  const autoscaleState = stepQiAutoscale({
    enable: QI_AUTOSCALE_ENABLE,
    target: autoscaleTarget,
    minScale: autoscaleMinScale,
    slewPerSec: autoscaleSlewPerS,
    windowTol: autoscaleWindowTol,
    zetaRaw: qiGuard.marginRatioRaw ?? null,
    sumWindowDt: qiGuard.sumWindowDt ?? null,
    rhoSource: qiGuard.rhoSource ?? null,
    dt_s: wallDt_s,
    now: autoscaleNow,
    prev: state.qiAutoscale,
    expectedSource: autoscaleSource,
    clamps: autoscaleClamps,
  });
  autoscaleState.clamps = autoscaleClamps;
  const qiDt_s =
    Number.isFinite(autoscaleState.dtLast_s) && (autoscaleState.dtLast_s as number) >= 0
      ? (autoscaleState.dtLast_s as number)
      : wallDt_s;
  const qiLastTickMs = Number.isFinite(autoscaleState.lastTickMs)
    ? (autoscaleState.lastTickMs as number)
    : autoscaleNow;
  autoscaleState.dt_s = qiDt_s;
  autoscaleState.dtLast_s = qiDt_s;
  autoscaleState.lastTickMs = qiLastTickMs;
  state.qiAutoscale = {
    ...autoscaleState,
    target: autoscaleTarget,
    slew: autoscaleSlewPerS,
    minScale: autoscaleMinScale,
    source: autoscaleSource,
    dt_s: qiDt_s,
    dtLast_s: qiDt_s,
    lastTickMs: qiLastTickMs,
  };
  (state as any).__qi_dt_s = qiDt_s;

  const prevAutothrottle = state.qiAutothrottle ?? initQiAutothrottle();
  state.qiAutothrottle = applyQiAutothrottleStep(prevAutothrottle, qiGuard.marginRatioRaw);
  const qiAutothrottleChanged = state.qiAutothrottle !== prevAutothrottle;
  const qiAutothrottleScale =
    state.qiAutothrottle?.enabled === true && Number.isFinite(state.qiAutothrottle.scale)
      ? clampNumber(state.qiAutothrottle.scale as number, 0, 1)
      : 1;
  const autoscaleRawScale = Number.isFinite(state.qiAutoscale?.appliedScale)
    ? (state.qiAutoscale?.appliedScale as number)
    : Number.isFinite(state.qiAutoscale?.scale)
    ? (state.qiAutoscale?.scale as number)
    : 1;
  const qiAutoscaleScale =
    Number.isFinite(autoscaleRawScale) && (autoscaleRawScale as number) > 0
      ? clampNumber(autoscaleRawScale, 0, 1)
      : 1;
  const qiScale = qiAutothrottleScale * qiAutoscaleScale;

  if (state.gateAnalytics && Array.isArray(state.gateAnalytics.pulses)) {
    const pulses = applyScaleToGatePulses(state.gateAnalytics.pulses, qiScale);
    state.gateAnalytics = {
      ...state.gateAnalytics,
      pulses: pulses ?? [],
    };
  }

  const qiGuardPost = evaluateQiGuardrail(state, {
    schedule: phaseSchedule,
    sectorPeriod_ms: sectorPeriodMs,
    sampler,
    tau_ms: tauMs,
  });
  qiGuard = qiGuardPost ?? qiGuard;
  state.zeta = qiGuard.marginRatio;
  (state as any).zetaRaw = qiGuard.marginRatioRaw;
  (state as any).qiGuardrail = qiGuard;

  const tsLog = {
    TS_ratio: state.TS_ratio,
    target: tsCfg.target,
    tauLC_us: Number.isFinite(lightCrossing.tauLC_ms) ? +(Number(lightCrossing.tauLC_ms) * 1000).toFixed(3) : null,
    tauPulse_ns: Number.isFinite(lightCrossing.burst_ms) ? +(Number(lightCrossing.burst_ms) * 1e6).toFixed(3) : null,
    engaged: tsAuto?.engaged ?? false,
    appliedBurst_ns: tsAuto?.appliedBurst_ns ?? null,
    proposedBurst_ns: tsAuto?.proposedBurst_ns ?? null,
    gating: tsAuto?.gating ?? "idle",
  };
  const tsAutoLog = {
    engaged: tsAuto?.engaged ?? false,
    gating: tsAuto?.gating ?? "idle",
    appliedBurst_ns: tsAuto?.appliedBurst_ns ?? null,
    proposedBurst_ns: tsAuto?.proposedBurst_ns ?? null,
    target: tsCfg.target,
    slew: tsCfg.slewPerSec,
    floor_ns: tsCfg.floor_ns,
  };
  const qiAutoLog = {
    engaged: state.qiAutoscale?.engaged ?? false,
    gating: state.qiAutoscale?.gating ?? "idle",
    appliedScale:
      state.qiAutoscale?.appliedScale ??
      state.qiAutoscale?.scale ??
      1,
    proposedScale: state.qiAutoscale?.proposedScale ?? null,
    target: autoscaleTarget,
    slew: autoscaleSlewPerS,
    floor: autoscaleMinScale,
  };

  if (DEBUG_PIPE) {
    console.log("[TS-guard]", tsLog);
    console.log("[TS-autoscale]", tsAutoLog);
    console.log("[QI-autoscale]", qiAutoLog);
  }

  if (qiAutothrottleChanged && state.qiAutothrottle?.reason) {
    console.warn("[QI-autothrottle]", {
      scale: state.qiAutothrottle.scale,
      reason: state.qiAutothrottle.reason,
    });
  }

  const P_warn = MODE_POLICY[state.currentMode].P_target_W * 1.2 / 1e6; // +20% headroom in MW
  const qiStatus = deriveQiStatus({
    zetaRaw: qiGuard.marginRatioRaw,
    zetaClamped: qiGuard.marginRatio,
    pAvg: state.P_avg,
    pWarn: P_warn,
    mode: state.currentMode,
  });
  state.fordRomanCompliance = qiStatus.compliance;
  state.curvatureLimit = state.fordRomanCompliance;
  state.overallStatus = qiStatus.overallStatus;

  // UI field updates logging (after MODE_CONFIGS applied)
  if (DEBUG_PIPE) console.log("[PIPELINE_UI]", {
    dutyUI_after: state.dutyCycle, 
    sectorCount: state.sectorCount,
    concurrentSectors: state.concurrentSectors,
    sectorStrobing: state.sectorStrobing,
    qSpoilingFactor: state.qSpoilingFactor
  });

  // Legacy Natario proxy payload (kept only for compatibility fallback).
  // Runtime congruence uses solved warp.metric payload below.
  const strictCongruence = strictCongruenceEnabled();
  let natarioLegacy: Record<string, unknown> | null = null;
  if (!strictCongruence) {
    natarioLegacy = calculateNatarioMetric({
      gap: state.gap_nm,
      hull: state.hull
        ? { a: state.hull.Lx_m / 2, b: state.hull.Ly_m / 2, c: state.hull.Lz_m / 2 }
        : { a: 503.5, b: 132, c: 86.5 },
      N_tiles: state.N_tiles,
      tileArea_m2: state.tileArea_cm2 * CM2_TO_M2,
      dutyEffectiveFR: d_eff,
      lightCrossing,
      gammaGeo: state.gammaGeo,
      gammaVanDenBroeck: state.gammaVanDenBroeck,
      qSpoilingFactor: state.qSpoilingFactor,
      cavityQ: state.qCavity,
      modulationFreq_GHz: state.modulationFreq_GHz,
      sectorStrobing: state.concurrentSectors, // concurrent live sectors
      dynamicConfig: {
        sectorCount: state.sectorCount, // TOTAL sectors (e.g. 400)
        concurrentSectors: state.concurrentSectors,
        sectorDuty: d_eff, // FR duty, not UI duty
        cavityQ: state.qCavity,
        qSpoilingFactor: state.qSpoilingFactor,
        gammaGeo: state.gammaGeo,
        gammaVanDenBroeck: state.gammaVanDenBroeck,
        pulseFrequencyGHz: state.modulationFreq_GHz,
        lightCrossingTimeNs: tauLC_s * 1e9,
      },
    } as any, state.U_static * state.N_tiles) as unknown as Record<string, unknown>;
  }
  (state as any).natarioLegacy = natarioLegacy ?? undefined;

  // Calculate dynamic Casimir with pipeline integration + performance guardrails

  // Cap dynamic grid size + short-circuit heavy branches
  const tileEdge = Math.max(1, Math.floor(Math.sqrt(state.N_tiles)));
  const dynEdge  = Math.min(TILE_EDGE_MAX, tileEdge);         // bounded for safety
  const dynTileCount = dynEdge * dynEdge;

  // Expose a note for UIs/debug
  (state as any).tileGrid = { edge: tileEdge, dynEdge, N_tiles: state.N_tiles, dynTileCount };

  // --- Dynamic helpers: feed safe sizes or short-circuit ---
  const shouldSkipDynamic = state.N_tiles > DYN_TILECOUNT_HARD_SKIP;

  try {
    const staticResult = calculateCasimirEnergy({
      gap: state.gap_nm,
      geometry: 'parallel_plate',
      radius: tileRadius_m * 1e6,
      sagDepth: state.sag_nm,
      temperature: state.temperature_K,
      materialModel: state.casimirModel ?? 'ideal_retarded',
      materialProps: state.materialProps,
      coupling: {
        ...couplingSpec,
        pitch_m: state.tilePitch_m ?? couplingSpec.pitch_m,
        frameFill: state.couplingFrameFill ?? couplingSpec.frameFill,
      },
      // bounded edge to keep any internal allocations sane
      arrayConfig: { size: dynEdge }
    } as any);

    if (!shouldSkipDynamic) {
      const dyn = calculateDynamicCasimirWithNatario({
          staticEnergy: staticResult.totalEnergy,
          modulationFreqGHz: state.modulationFreq_GHz,
          strokeAmplitudePm: (state as any).strokeAmplitude_pm ?? 50,
          burstLengthUs: (state as any).burst_us ?? 10,
          cycleLengthUs: (state as any).cycle_us ?? 1000,
          cavityQ: state.qCavity,
          // IMPORTANT: pass *aggregate* count, not an array-sized count
          tileCount: state.N_tiles
        }, {
          ...state,
          dynamicConfig: {
            modulationFreqGHz: state.modulationFreq_GHz,
            cavityQ: state.qCavity,
            qSpoilingFactor: state.qSpoilingFactor,
            sectorCount: state.sectorCount,
            concurrentSectors: state.concurrentSectors,
            sectorDuty: d_eff,  // FR duty
            lightCrossingTimeNs: tauLC_s * 1e9,
            gammaGeo: state.gammaGeo,
            gammaVanDenBroeck: state.gammaVanDenBroeck
          }
        } as any
      );
      (state as any).dynamic = dyn;
    } else {
      (state as any).dynamic = { note: 'skipped (tilecount hard cap)', totalEnergy: staticResult.totalEnergy };
    }
  } catch (e) {
    if (DEBUG_PIPE) console.warn('Dynamic Casimir calculation failed:', e);
  }

  // Vacuum-gap sweep (optional) for pump bias tuning
  try {
    if (state.sweep) {
      state.sweep.activeSlew = Boolean(state.dynamicConfig?.sweep?.activeSlew);
    }
    const sweepMode = opts.sweepMode ?? "auto";
    const wantsActiveSlew = Boolean(state.dynamicConfig?.sweep?.activeSlew);
    const canSchedule = typeof opts.scheduleSweep === "function";
    const shouldSkipSweep = sweepMode === "skip";
    const shouldForceSweep = sweepMode === "force";
    const shouldSchedule =
      !shouldForceSweep &&
      !shouldSkipSweep &&
      wantsActiveSlew &&
      canSchedule &&
      (sweepMode === "async" || sweepMode === "auto");

    if (shouldSkipSweep) {
      // Explicitly skipped by caller
    } else if (shouldForceSweep) {
      await orchestrateVacuumGapSweep(state);
    } else if (shouldSchedule) {
      opts.scheduleSweep?.({
        activeSlew: true,
        reason: opts.sweepReason ?? "pipeline-run",
      });
    } else {
      await orchestrateVacuumGapSweep(state);
    }
  } catch (err) {
    if (DEBUG_PIPE) console.warn("Vacuum-gap sweep skipped:", err);
  }

  // Calculate stress-energy tensor from pipeline parameters
  try {
    const hullGeom = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 };
    const a = hullGeom.Lx_m / 2;
    const b = hullGeom.Ly_m / 2;
    const c = hullGeom.Lz_m / 2;
    const geomR = Math.cbrt(a * b * c); // meters

    const SE = toPipelineStressEnergy({
      gap_nm: state.gap_nm ?? 1,
      gammaGeo: state.gammaGeo ?? 26,
      cavityQ: state.qCavity ?? 1e9,
      gammaVanDenBroeck: state.gammaVanDenBroeck ?? 3.83e1,
      qSpoilingFactor: state.qSpoilingFactor ?? 1,
      dutyCycle: state.dutyCycle,
      sectorStrobing: state.sectorStrobing,
      dutyEffectiveFR: state.dutyEffective_FR,     // stress-energy payload     
      lightCrossing: (state as any).lightCrossing,
      rho0Scale: casimirScaleApplied,
      R_geom_m: geomR
    });

    // Expose stress-energy tensor components in the shared snapshot
    (state as any).stressEnergy = SE;
  } catch (e) {
    if (DEBUG_PIPE) console.warn('Stress-energy calculation failed:', e);
  }

  // Calculate Nat+├¡rio warp bubble results (now pipeline-true)
  try {
    const hullGeomWarp = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 };
    const a_warp = hullGeomWarp.Lx_m / 2;
    const b_warp = hullGeomWarp.Ly_m / 2;
    const c_warp = hullGeomWarp.Lz_m / 2;
    const geomR_warp = Math.cbrt(a_warp * b_warp * c_warp); // meters

    const priorAmpInputs = (state.ampFactors ?? (state as any).amps ?? {}) as AmpFactors;
    const ampFactors: AmpFactors = {
      gammaGeo: state.gammaGeo ?? 26,
      gammaVanDenBroeck: state.gammaVanDenBroeck ?? 3.83e1,
      qSpoilingFactor: state.qSpoilingFactor ?? 1,
      qMechanical: state.qMechanical ?? 1,
      qCavity: state.qCavity ?? PAPER_Q.Q_BURST,
      measuredGammaGeo: priorAmpInputs.measuredGammaGeo,
      measuredGammaVanDenBroeck: priorAmpInputs.measuredGammaVanDenBroeck,
      measuredQSpoilingFactor: priorAmpInputs.measuredQSpoilingFactor,
      measuredQMechanical: priorAmpInputs.measuredQMechanical,
      measuredCavityQ: priorAmpInputs.measuredCavityQ,
    };
    state.ampFactors = ampFactors;
    (state as any).amps = ampFactors; // back-compat alias
    const warpFieldType = (state.dynamicConfig as any)?.warpFieldType ?? state.warpFieldType ?? 'natario';
    const warpGeometry = (state.dynamicConfig as any)?.warpGeometry ?? state.warpGeometry ?? null;
    const warpGeometryKind =
      (warpGeometry as WarpGeometrySpec)?.geometryKind ??
      (warpGeometry as any)?.kind ??
      (state.dynamicConfig as any)?.warpGeometryKind ??
      state.warpGeometryKind ??
      'ellipsoid';
    const bubblePayload = {
      ...(state as any).bubble,
      R: (state as any).bubble?.R ?? (state as any).R,
      sigma: (state as any).bubble?.sigma ?? (state as any).sigma,
      beta: (state as any).bubble?.beta ?? (state as any).beta,
    };
    const allowMassOverride = massMode === "TARGET_CALIBRATED";
    const invariantMass_kg =
      Number.isFinite(state.gr?.matter?.stressEnergy?.invariantMass_kg)
        ? Number(state.gr?.matter?.stressEnergy?.invariantMass_kg)
        : undefined;
    const invariantMassSigma_kg =
      Number.isFinite(measuredScaleRelSigma) && typeof invariantMass_kg === "number"
        ? Math.abs(invariantMass_kg) * (measuredScaleRelSigma as number)
        : undefined;
    state.invariantMassSigma_kg = invariantMassSigma_kg;
    const exoticMassTarget_kg =
      allowMassOverride && Number.isFinite(state.exoticMassTarget_kg)
        ? Number(state.exoticMassTarget_kg)
        : undefined;
    const modeKey = String(state.currentMode ?? "hover").toLowerCase();
    const lowGTargetsByMode: Record<string, number> = {
      standby: 0,
      nearzero: 0.01 * 9.80665,
      taxi: 0.08 * 9.80665,
      hover: 0.10 * 9.80665,
      cruise: 0.05 * 9.80665,
      emergency: 0.30 * 9.80665,
    };
    const gTarget =
      firstFinite(
        Number((state.dynamicConfig as any)?.gTarget),
        Number((state as any).gTarget),
        lowGTargetsByMode[modeKey],
      ) ?? 0;
    const epsilonTilt =
      firstFinite(
        Number((state.dynamicConfig as any)?.epsilonTilt),
        Number((state as any).epsilonTilt),
        Math.min(5e-7, Math.max(0, (gTarget * geomR_warp) / (C * C))),
      ) ?? 0;
    const betaTiltVec = toFiniteVec3(
      (state.dynamicConfig as any)?.betaTiltVec ?? (state as any).betaTiltVec,
      [0, -1, 0],
    );

    const warpParams = {
      geometry: 'bowl' as const,
      gap: state.gap_nm ?? 1,
      radius: geomR_warp * 1e6, // Convert meters to micrometers for compatibility
      sagDepth: state.sag_nm ?? 16,
      material: 'PEC' as const,
      temperature: state.temperature_K ?? 20,
      moduleType: 'warp' as const,
      hull: hullGeomWarp,
      // Pass target only when explicitly calibrating mass; otherwise derive from energy.
      exoticMassTarget_kg,
      invariantMass_kg,
      massMode,
      allowMassOverride,
      dynamicConfig: {
        modulationFreqGHz: state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ,
        strokeAmplitudePm: 50,
        burstLengthUs: 10,
        cycleLengthUs: 1000,
        cavityQ: state.qCavity ?? 1e9,
        sectorCount: state.sectorCount ?? 400,
        sectorDuty: state.dutyEffective_FR ?? 2.5e-5, // warp module payload
        pulseFrequencyGHz: state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ,
        lightCrossingTimeNs: tauLC_s * 1e9,
        shiftAmplitude: 50e-12,
        expansionTolerance: 1e-12,
        gTarget,
        epsilonTilt,
        betaTiltVec,
        warpFieldType,
        warpGeometry: warpGeometry ?? undefined,
        warpGeometryKind
      },
      currentMode: state.currentMode,
      bubble: bubblePayload,
      R: bubblePayload.R,
      sigma: bubblePayload.sigma,
      beta: bubblePayload.beta,
      warpGeometry: warpGeometry ?? undefined,
      warpGeometryKind,
      warpGeometryAssetId: (warpGeometry as WarpGeometrySpec)?.assetId ?? state.warpGeometryAssetId,
      // Amplification factors: prefer ampFactors, keep legacy amps alias
      ampFactors,
      amps: ampFactors
    };

    const sanitizeShiftVectorField = (field: Record<string, unknown>) => {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(field)) {
        if (typeof value === "function") continue;
        sanitized[key] = value;
      }
      return sanitized;
    };

    const buildFallbackMetricAdapter = (note: string) =>
      buildWarpMetricAdapterSnapshot({
        family: "unknown",
        chart: {
          label: "unspecified",
          dtGammaPolicy: "unknown",
          notes: note,
        },
        requestedFieldType: warpFieldType,
        alpha: 1,
        gammaDiag: [1, 1, 1],
        note,
      });

    const sanitizeWarpResult = (warpResult: unknown) => {
      if (!warpResult || typeof warpResult !== "object") return warpResult;
      const result = warpResult as Record<string, unknown>;
      const shiftVectorField = result.shiftVectorField;
      if (shiftVectorField && typeof shiftVectorField === "object") {
        return {
          ...result,
          shiftVectorField: sanitizeShiftVectorField(
            shiftVectorField as Record<string, unknown>,
          ),
        };
      }
      return result;
    };

    const warp = await warpBubbleModule.calculate(warpParams);
    const sanitizedWarp = sanitizeWarpResult(warp) as Record<string, unknown>;
    if (!sanitizedWarp.metricAdapter) {
      sanitizedWarp.metricAdapter = buildFallbackMetricAdapter(
        "metricAdapter missing from warp module result",
      );
    }

    // Store warp results in state for API access
    (state as any).warp = sanitizedWarp;
    (state as any).beta_avg = warp?.betaAvg ?? warp?.natarioShiftAmplitude ?? (state as any).beta_avg;

    refreshThetaAuditFromMetricAdapter(state);
    refreshCongruenceMeta(state);
    refreshUniversalCoverageStatus(state);
  } catch (e) {
    if (DEBUG_PIPE) console.warn('Warp bubble calculation failed:', e);
    if (!(state as any).warp) {
      const requestedFieldType =
        (state.dynamicConfig as any)?.warpFieldType ?? state.warpFieldType ?? "unknown";
      (state as any).warp = {
        metricAdapter: buildWarpMetricAdapterSnapshot({
          family: "unknown",
          chart: {
            label: "unspecified",
            dtGammaPolicy: "unknown",
            notes: "warp bubble calculation failed",
          },
          requestedFieldType,
          alpha: 1,
          gammaDiag: [1, 1, 1],
        }),
      };
    } else if (!(state as any).warp.metricAdapter) {
      (state as any).warp.metricAdapter = buildWarpMetricAdapterSnapshot({
        family: "unknown",
        chart: {
          label: "unspecified",
          dtGammaPolicy: "unknown",
          notes: "warp bubble calculation failed",
        },
        requestedFieldType:
          (state.dynamicConfig as any)?.warpFieldType ?? state.warpFieldType ?? "unknown",
        alpha: 1,
        gammaDiag: [1, 1, 1],
      });
    }
    refreshThetaAuditFromMetricAdapter(state);
    refreshCongruenceMeta(state);
    refreshUniversalCoverageStatus(state);
  }

  // Canonical non-Alcubierre metric source: promote VdB Region II derivatives
  // into warp.metricT00 when warp module does not provide metric stress.
  const warpState = (state as any).warp as Record<string, unknown> | undefined;
  const warpMetricSource = (warpState as any)?.metricT00Source;
  const warpStressSource = (warpState as any)?.stressEnergySource;
  const warpMetricRef =
    typeof (warpState as any)?.metricT00Ref === "string" &&
    (warpState as any).metricT00Ref.length > 0
      ? String((warpState as any).metricT00Ref)
      : undefined;
  const warpMetricValue = firstFinite((warpState as any)?.metricT00);
  const hasCanonicalMetricT00 =
    warpMetricValue !== undefined &&
    (warpMetricSource === "metric" ||
      warpStressSource === "metric" ||
      (warpMetricRef != null && warpMetricRef.startsWith("warp.metric.T00")));
  if (
    hasCanonicalMetricT00 &&
    warpState &&
    (warpMetricSource !== "metric" || warpStressSource !== "metric")
  ) {
    const metricRef =
      warpMetricRef ??
      resolveCanonicalMetricT00Ref(
        warpState as Record<string, any>,
        (warpState as any)?.metricAdapter as WarpMetricAdapterSnapshot | undefined,
      );
    (state as any).warp = {
      ...warpState,
      metricT00Source: "metric",
      stressEnergySource: "metric",
      ...(metricRef ? { metricT00Ref: metricRef } : {}),
    };
  }
  const vdbRegionII = (state as any).vdbRegionII;
  const vdbRegionIIT00Geom = firstFinite(vdbRegionII?.t00_mean);
  let vdbRegionIIPromoted = false;
  if (
    !hasCanonicalMetricT00 &&
    hasVdbRegionIIMetricSupport(vdbRegionII) &&
    vdbRegionIIT00Geom !== undefined
  ) {
    const vdbMetricT00Si = vdbRegionIIT00Geom * GEOM_TO_SI_STRESS;
    const vdbBMin = Number(vdbRegionII?.b_min);
    const vdbBMax = Number(vdbRegionII?.b_max);
    const vdbBRepresentative =
      Number.isFinite(vdbBMin) &&
      vdbBMin > 0 &&
      Number.isFinite(vdbBMax) &&
      vdbBMax > 0
        ? Math.sqrt(vdbBMin * vdbBMax)
        : Number.isFinite(state.gammaVanDenBroeck)
          ? Math.sqrt(Math.max(1, Number(state.gammaVanDenBroeck)))
          : 1;
    const vdbGammaDiagValue = Math.max(1e-12, vdbBRepresentative * vdbBRepresentative);
    const existingAdapter = (warpState as any)?.metricAdapter as
      | WarpMetricAdapterSnapshot
      | undefined;
    const vdbFallbackShiftField = buildVdbFallbackShiftField(state);
    const vdbConformalDiagnostics = buildVdbConformalDiagnostics(
      vdbRegionII,
      vdbFallbackShiftField?.amplitude,
    );
    const existingChartLabel = existingAdapter?.chart?.label;
    const existingContractStatus = existingAdapter?.chart?.contractStatus;
    const useVdbAdapterFallback =
      !existingAdapter ||
      existingChartLabel === "unspecified" ||
      existingContractStatus === "unknown";
    const metricStressDiagnostics = {
      sampleCount: Number.isFinite(vdbRegionII?.sampleCount)
        ? Number(vdbRegionII.sampleCount)
        : 0,
      rhoGeomMean: vdbRegionIIT00Geom,
      rhoSiMean: vdbMetricT00Si,
      kTraceMean: undefined,
      kSquaredMean: undefined,
      step_m: Number.isFinite(vdbRegionII?.delta_tilde_m)
        ? Number(vdbRegionII.delta_tilde_m) /
          Math.max(1, Number(vdbRegionII?.sampleCount) || 1)
        : 0,
      scale_m: Number.isFinite(vdbRegionII?.r_tilde_m)
        ? Number(vdbRegionII.r_tilde_m)
        : 0,
    };
    const rebuiltExistingVdbAdapter =
      !useVdbAdapterFallback &&
      existingAdapter?.family === "vdb" &&
      vdbConformalDiagnostics
        ? buildWarpMetricAdapterSnapshot({
            family: "vdb",
            chart: existingAdapter.chart,
            requestedFieldType: existingAdapter.requestedFieldType,
            alpha: existingAdapter.alpha,
            gammaDiag: existingAdapter.gammaDiag,
            hodgeDiagnostics: {
              maxDiv: existingAdapter.betaDiagnostics?.thetaMax,
              rmsDiv: existingAdapter.betaDiagnostics?.thetaRms,
              maxCurl: existingAdapter.betaDiagnostics?.curlMax,
              rmsCurl: existingAdapter.betaDiagnostics?.curlRms,
            },
            sampleCount: existingAdapter.betaDiagnostics?.sampleCount,
            expansionScalar:
              existingAdapter.betaDiagnostics?.thetaMax ??
              existingAdapter.betaDiagnostics?.thetaRms,
            curlMagnitude:
              existingAdapter.betaDiagnostics?.curlMax ??
              existingAdapter.betaDiagnostics?.curlRms,
            vdbConformalDiagnostics,
            note:
              "Existing VdB adapter rebuilt with region-II conformal derivative diagnostics",
          })
        : undefined;
    (state as any).warp = {
      ...(warpState ?? {}),
      metricT00: vdbMetricT00Si,
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.vdb.regionII",
      metricT00Derivation: "forward_B_to_derivatives_to_rho_E",
      metricStressDiagnostics,
      stressEnergySource: "metric",
      metricAdapter: useVdbAdapterFallback
        ? buildWarpMetricAdapterSnapshot({
            family: "vdb",
            chart: {
              label: "comoving_cartesian",
              dtGammaPolicy: "assumed_zero",
              notes: "Derived from Van Den Broeck region-II diagnostics",
            },
            requestedFieldType:
              (state.dynamicConfig as any)?.warpFieldType ??
              state.warpFieldType ??
              "unknown",
            alpha: 1,
            gammaDiag: [vdbGammaDiagValue, vdbGammaDiagValue, vdbGammaDiagValue],
            shiftVectorField: vdbFallbackShiftField,
            vdbConformalDiagnostics,
            note: `metricT00 promoted from VdB region-II derivative diagnostics; gammaDiag=B_rep^2 (${vdbGammaDiagValue.toExponential(3)})`,
          })
        : rebuiltExistingVdbAdapter ?? existingAdapter,
    };
    vdbRegionIIPromoted = true;
  }
  const vdbRegionIV = (state as any).vdbRegionIV;
  const vdbRegionIVT00Geom = firstFinite(vdbRegionIV?.t00_mean);
  if (
    !hasCanonicalMetricT00 &&
    !vdbRegionIIPromoted &&
    hasVdbRegionIVMetricSupport(vdbRegionIV) &&
    vdbRegionIVT00Geom !== undefined
  ) {
    const vdbMetricT00Si = vdbRegionIVT00Geom * GEOM_TO_SI_STRESS;
    const existingAdapter = (warpState as any)?.metricAdapter as
      | WarpMetricAdapterSnapshot
      | undefined;
    const existingChartLabel = existingAdapter?.chart?.label;
    const existingContractStatus = existingAdapter?.chart?.contractStatus;
    const useVdbAdapterFallback =
      !existingAdapter ||
      existingChartLabel === "unspecified" ||
      existingContractStatus === "unknown";
    const vdbFallbackShiftField = buildVdbFallbackShiftField(state);
    const metricStressDiagnostics = {
      sampleCount: Number.isFinite(vdbRegionIV?.sampleCount)
        ? Number(vdbRegionIV.sampleCount)
        : 0,
      rhoGeomMean: vdbRegionIVT00Geom,
      rhoSiMean: vdbMetricT00Si,
      kTraceMean: Number.isFinite(vdbRegionIV?.k_trace_mean)
        ? Number(vdbRegionIV.k_trace_mean)
        : undefined,
      kSquaredMean: Number.isFinite(vdbRegionIV?.k_squared_mean)
        ? Number(vdbRegionIV.k_squared_mean)
        : undefined,
      step_m: Number.isFinite(vdbRegionIV?.step_m) ? Number(vdbRegionIV.step_m) : 0,
      scale_m: Number.isFinite(vdbRegionIV?.R_m) ? Number(vdbRegionIV.R_m) : 0,
    };
    const rebuiltExistingVdbAdapter =
      !useVdbAdapterFallback &&
      existingAdapter?.family === "vdb"
        ? buildWarpMetricAdapterSnapshot({
            family: "vdb",
            chart: existingAdapter.chart,
            requestedFieldType: existingAdapter.requestedFieldType,
            alpha: existingAdapter.alpha,
            gammaDiag: existingAdapter.gammaDiag,
            hodgeDiagnostics: {
              maxDiv: existingAdapter.betaDiagnostics?.thetaMax,
              rmsDiv: existingAdapter.betaDiagnostics?.thetaRms,
              maxCurl: existingAdapter.betaDiagnostics?.curlMax,
              rmsCurl: existingAdapter.betaDiagnostics?.curlRms,
            },
            sampleCount: existingAdapter.betaDiagnostics?.sampleCount,
            expansionScalar:
              existingAdapter.betaDiagnostics?.thetaMax ??
              existingAdapter.betaDiagnostics?.thetaRms,
            curlMagnitude:
              existingAdapter.betaDiagnostics?.curlMax ??
              existingAdapter.betaDiagnostics?.curlRms,
            note: "Existing VdB adapter retained for region-IV metric fallback",
          })
        : undefined;
    (state as any).warp = {
      ...(warpState ?? {}),
      metricT00: vdbMetricT00Si,
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.vdb.regionIV",
      metricT00Derivation: "forward_fwall_to_rho_E",
      metricStressDiagnostics,
      stressEnergySource: "metric",
      metricAdapter: useVdbAdapterFallback
        ? buildWarpMetricAdapterSnapshot({
            family: "vdb",
            chart: {
              label: "comoving_cartesian",
              dtGammaPolicy: "assumed_zero",
              notes: "Derived from Van Den Broeck region-IV f-wall diagnostics",
            },
            requestedFieldType:
              (state.dynamicConfig as any)?.warpFieldType ??
              state.warpFieldType ??
              "unknown",
            alpha: 1,
            gammaDiag: [1, 1, 1],
            shiftVectorField: vdbFallbackShiftField,
            sampleScale_m: Number.isFinite(vdbRegionIV?.R_m)
              ? Number(vdbRegionIV.R_m)
              : undefined,
            note: "Fallback VdB adapter seeded from region-IV f-wall diagnostics",
          })
        : rebuiltExistingVdbAdapter ?? existingAdapter,
    };
    if ((state as any).uniformsExplain?.warpMetric) {
      (state as any).uniformsExplain.warpMetric.metricT00Derivation =
        "forward_fwall_to_rho_E";
      (state as any).uniformsExplain.warpMetric.note =
        "metricT00 promoted from VdB region-IV f-wall diagnostics";
    }
  }

  const vdbConformalDiagnostics = buildVdbConformalDiagnostics(
    vdbRegionII,
    firstFinite(
      (warpState as any)?.shiftVectorField?.amplitude,
      (warpState as any)?.betaAvg,
      (state as any)?.beta_avg,
    ),
  );
  const gammaVdB = Number(state.gammaVanDenBroeck);
  const needsConformal =
    Number.isFinite(gammaVdB) && gammaVdB > 1 && hasVdbRegionIIDerivatives(vdbRegionII);
  const warpStateLatest = (state as any).warp as Record<string, any> | undefined;
  if (needsConformal && vdbConformalDiagnostics && warpStateLatest?.metricAdapter) {
    const adapter = warpStateLatest.metricAdapter as WarpMetricAdapterSnapshot;
    warpStateLatest.metricAdapter = buildWarpMetricAdapterSnapshot({
      family: adapter.family,
      chart: adapter.chart,
      requestedFieldType: adapter.requestedFieldType,
      alpha: adapter.alpha,
      gammaDiag: adapter.gammaDiag,
      betaDiagnostics: adapter.betaDiagnostics,
      vdbConformalDiagnostics,
      note: "VdB conformal diagnostics injected from region-II",
    });
  }
  refreshMetricT00Contract(state);
  refreshMetricConstraintAudit(state);
  refreshCl3Telemetry(state);
  refreshThetaAuditFromMetricAdapter(state);
  refreshCongruenceMeta(state);
  refreshUniversalCoverageStatus(state);

  // Recompute tau_LC/TS from metric adapter path length once the adapter is finalized.
  const metricPath_m = resolveMetricPathLengthFromAdapter(state);
  if (
    clockingProvenance !== "hardware" &&
    Number.isFinite(metricPath_m) &&
    (metricPath_m as number) > 0
  ) {
    const metricClocking = computeClocking({
      path_m: metricPath_m as number,
      burst_ms: Number.isFinite((state as any)?.lightCrossing?.burst_ms)
        ? Number((state as any).lightCrossing.burst_ms)
        : undefined,
      dwell_ms: Number.isFinite((state as any)?.lightCrossing?.dwell_ms)
        ? Number((state as any).lightCrossing.dwell_ms)
        : sectorPeriodMs,
      sectorPeriod_ms: sectorPeriodMs,
      localDuty: state.dutyBurst,
    });
    if (
      Number.isFinite(metricClocking.tauLC_ms as number) &&
      (metricClocking.tauLC_ms as number) > 0
    ) {
      const lightCrossingState = ((state as any).lightCrossing ?? {}) as Record<string, unknown>;
      lightCrossingState.tauLC_ms = metricClocking.tauLC_ms;
      lightCrossingState.burst_ms =
        metricClocking.tauPulse_ms ?? lightCrossingState.burst_ms;
      lightCrossingState.dwell_ms = metricClocking.dwell_ms ?? lightCrossingState.dwell_ms;
      const metricTs = Number(metricClocking.TS);
      if (Number.isFinite(metricTs) && metricTs > 0) {
        state.TS_long = metricTs;
        state.TS_ratio = metricTs;
        lightCrossingState.TS = metricTs;
      }
      (state as any).lightCrossing = lightCrossingState;
      (state as any).tauLC_ms = lightCrossingState.tauLC_ms;
      state.clocking = {
        ...(state.clocking ?? metricClocking),
        ...metricClocking,
        detail: `${metricClocking.detail}; tau_LC from metric adapter gammaDiag`,
      };
    }
  }

  // Re-evaluate TS metric derivation after warp adapter / metric promotion is available.
  const tsMetricStatus = resolveTsMetricDerivedStatus(state, clockingProvenance);
  state.tsMetricDerived = tsMetricStatus.metricDerived;
  state.tsMetricDerivedSource = tsMetricStatus.source;
  state.tsMetricDerivedReason = tsMetricStatus.reason;
  (state as any).tsMetricDerived = tsMetricStatus.metricDerived;
  (state as any).tsMetricDerivedSource = tsMetricStatus.source;
  (state as any).tsMetricDerivedReason = tsMetricStatus.reason;
  if (state.clocking) {
    state.clocking = {
      ...state.clocking,
      metricDerived: tsMetricStatus.metricDerived,
      metricDerivedSource: tsMetricStatus.source,
      metricDerivedReason: tsMetricStatus.reason,
      metricDerivedChart: tsMetricStatus.chart,
    };
  }
  if (state.ts) {
    state.ts = {
      ...state.ts,
      metricDerived: tsMetricStatus.metricDerived,
      metricDerivedSource: tsMetricStatus.source,
      metricDerivedReason: tsMetricStatus.reason,
      metricDerivedChart: tsMetricStatus.chart,
    };
    (state as any).ts = state.ts;
  }

  // Refresh QI guardrail after warp metric promotion so exported QI status/source
  // reflects the final metric adapter and clocking contract in this tick.
  const qiGuardLate = evaluateQiGuardrail(state, {
    schedule: phaseSchedule,
    sectorPeriod_ms: sectorPeriodMs,
    sampler,
    tau_ms: tauMs,
  });
  if (qiGuardLate) {
    state.zeta = qiGuardLate.marginRatio;
    (state as any).zetaRaw = qiGuardLate.marginRatioRaw;
    (state as any).qiGuardrail = qiGuardLate;
    const qiStatusLate = deriveQiStatus({
      zetaRaw: qiGuardLate.marginRatioRaw,
      zetaClamped: qiGuardLate.marginRatio,
      pAvg: state.P_avg,
      pWarn: P_warn,
      mode: state.currentMode,
    });
    state.fordRomanCompliance = qiStatusLate.compliance;
    state.curvatureLimit = state.fordRomanCompliance;
    state.overallStatus = qiStatusLate.overallStatus;
  }
  // Canonical Natario payload now mirrors solved warp metric output.
  // Legacy inverse/proxy Natario is retained under `natarioLegacy` for diagnostics.
  (state as any).natario = buildNatarioRuntimePayload(
    state,
    ((state as any).natarioLegacy as Record<string, unknown> | undefined) ??
      ((state as any).natario as Record<string, unknown> | undefined),
  );
  emitQiGuardLog(state, (state as any).qiGuardrail ?? qiGuard);

  // Speed/beta closure: derive effective translation from power and warp proxy
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const clampBeta = (b: number) => Math.max(0, Math.min(0.99, b));
  const BETA_BASE_BY_MODE: Record<string, number> = {
    standby: 0.0,
    taxi: 0.0,
    nearzero: 0.02,
    hover: 0.1,
    cruise: 0.6,
    emergency: 0.95,
  };

  const betaBase = BETA_BASE_BY_MODE[String(state.currentMode).toLowerCase()] ?? 0.3;
  const beta_trans_power = P_target_W > 0 ? clamp01(P_total_W / P_target_W) : 0;
  const beta_policy = clampBeta(betaBase * beta_trans_power);
  const beta_proxy = Number((state as any)?.warp?.betaAvg ?? (state as any)?.warp?.natarioShiftAmplitude ?? (state as any).beta_avg);
  const useProxy = Number.isFinite(beta_proxy) && Math.abs(beta_proxy) > 1e-6;
  const shipBeta = useProxy ? clampBeta(beta_proxy) : beta_policy;

  state.beta_trans_power = beta_trans_power;
  state.beta_policy = beta_policy;
  state.shipBeta = shipBeta;
  state.speedClosure = useProxy ? 'proxyB' : 'policyA';
  state.vShip_mps = shipBeta * C;
  // Surface the closure inputs for downstream panels/scripts
  state.P_target_W = P_target_W;
  state.P_cap_W = P_cap_W;
  state.physicsCap_W = physicsCap_W;

  flushPendingPumpCommand();
  updateQiTelemetry(state);
  const guardForStats = (state as any).qiGuardrail;
  if (state.qi && guardForStats) {
    state.qi.fieldType = (state.qi.fieldType ?? guardForStats.fieldType) as any;
    state.qi.sampledIntegral_Jm3 = guardForStats.lhs_Jm3;
    state.qi.boundTight_Jm3 = guardForStats.bound_Jm3;
    state.qi.marginRatio = guardForStats.marginRatio;
    state.qi.marginRatioRaw = guardForStats.marginRatioRaw;
    state.qi.policyLimit = guardForStats.policyLimit;
  }

  try {
    const tail = sweepHistory.slice(-SWEEP_HISTORY_MAX);
    state.vacuumGapSweepResults = tail;
    const lifetimes = getSweepHistoryTotals();
    state.vacuumGapSweepRowsTotal = lifetimes.total;
    state.vacuumGapSweepRowsDropped = lifetimes.dropped;
    const prevTruth = state.hardwareTruth ?? {};
    state.hardwareTruth = {
      ...prevTruth,
      totals: lifetimes,
    };
  } catch {
    // non-fatal
  }

  try {
    state.cardRecipe = buildCardRecipeFromPipeline(state);
  } catch (err) {
    if (DEBUG_PIPE) console.warn("[pipeline] card recipe build failed:", err);
  }

  state.grRequest = buildGrRequestPayload(state);

  return state;
}

function flushPendingPumpCommand(): void {
  if (!pendingPumpCommand) return;
  const next = pendingPumpCommand;
  pendingPumpCommand = undefined;
  void slewPumpMultiTone(next).catch((err) => {
    if (!DEBUG_PIPE) return;
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[pipeline] multi-tone pump slew failed: ${message}`);
  });
}

function emitQiGuardLog(state: EnergyPipelineState, qiGuard: any): void {
  if (!qiGuard) return;
  const zetaForStatus = Number.isFinite(qiGuard.marginRatioRaw)
    ? qiGuard.marginRatioRaw
    : Number.isFinite(qiGuard.marginRatio)
    ? qiGuard.marginRatio
    : null;
  const guardLog = {
    margin: qiGuard.marginRatio,
    marginRaw: qiGuard.marginRatioRaw,
    lhs_Jm3: qiGuard.lhs_Jm3,
    bound_Jm3: qiGuard.bound_Jm3,
    sampler: qiGuard.sampler,
    fieldType: qiGuard.fieldType,
    window_ms: qiGuard.window_ms,
    sumWindowDt: qiGuard.sumWindowDt,
    duty: qiGuard.duty,
    patternDuty: qiGuard.patternDuty,
    maskSum: qiGuard.maskSum,
    effectiveRho: qiGuard.effectiveRho,
    rhoOn: qiGuard.rhoOn,
    rhoOnDuty: qiGuard.rhoOnDuty,
    rhoSource: qiGuard.rhoSource,
    curvatureRadius_m: qiGuard.curvatureRadius_m,
    curvatureRatio: qiGuard.curvatureRatio,
    curvatureOk: qiGuard.curvatureOk,
    curvatureSource: qiGuard.curvatureSource,
    metricDerived: qiGuard.metricDerived,
    metricDerivedSource: qiGuard.metricDerivedSource,
    metricDerivedReason: qiGuard.metricDerivedReason,
    metricDerivedChart: qiGuard.metricDerivedChart,
    TS: state.clocking?.TS ?? state.TS_ratio ?? null,
    clockingDetail: state.clocking ?? null,
  };

  if (!Number.isFinite(zetaForStatus) || (zetaForStatus as number) >= 1) {
    console.warn("[QI-guard] sampled integral exceeds bound", guardLog);
  } else if (DEBUG_PIPE) {
    console.log("[QI-guard]", guardLog);
  }
}

function updateQiTelemetry(state: EnergyPipelineState) {
  const desiredTau = Number.isFinite(state.qi?.tau_s_ms)
    ? Number(state.qi?.tau_s_ms)
    : DEFAULT_QI_TAU_MS;
  const desiredField = (state.qi as any)?.fieldType ?? DEFAULT_QI_FIELD;
  const desiredDt = desiredQiSampleDt(state);
  reconfigureQiMonitor(desiredTau, desiredDt, desiredField as QiFieldType);
  const effectiveRho = estimateEffectiveRhoFromState(state);
  const baseStats = advanceQiMonitor(effectiveRho);
  const { tiles: synthesizedTiles, metrics, source } = buildQiTilesFromState(state, baseStats);
  const lrlTelemetry = deriveQiLaplaceRungeLenz(state, baseStats);
  const stats: QiStats = metrics
    ? {
        ...baseStats,
        ...metrics,
        homogenizerSource: source,
        ...(lrlTelemetry ?? {}),
      }
    : {
        ...baseStats,
        ...(lrlTelemetry ?? {}),
      };
  const interest = computeQuantumInterestBook(state);
  // Reduced-order only: repayment bookkeeping is heuristic unless theorem-mapped for the active regime.
  (stats as any).repayment_label = "repayment_heuristic";
  if (interest) {
    state.qiInterest = interest;
    stats.interestRate = interest.rate;
    stats.interestWindow_ms = interest.window_ms;
    stats.interestDebt = interest.debt_Jm3;
    stats.interestCredit = interest.credit_Jm3;
    stats.interestMargin = interest.margin_Jm3;
    stats.interestNetCycle = interest.netCycle_Jm3;
    stats.interestNeg = interest.neg_Jm3;
    stats.interestPos = interest.pos_Jm3;
    (stats as any).repayment_label = "repayment_heuristic";
  } else {
    state.qiInterest = null;
  }
  state.qi = stats;
  if (synthesizedTiles.length) {
    updatePipelineQiTiles(synthesizedTiles, { source: "synthetic" });
  } else {
    updatePipelineQiTiles([], { source: "synthetic" });
  }

  const qiAutothrottleScale =
    state.qiAutothrottle?.enabled === true && Number.isFinite(state.qiAutothrottle.scale)
      ? clampNumber(state.qiAutothrottle.scale as number, 0, 1)
      : 1;
  const autoscaleRawScale = Number.isFinite(state.qiAutoscale?.appliedScale)
    ? (state.qiAutoscale?.appliedScale as number)
    : Number.isFinite(state.qiAutoscale?.scale)
    ? (state.qiAutoscale?.scale as number)
    : 1;
  const qiAutoscaleScale =
    Number.isFinite(autoscaleRawScale) && (autoscaleRawScale as number) > 0
      ? clampNumber(autoscaleRawScale, 0, 1)
      : 1;
  const qiScale = qiAutothrottleScale * qiAutoscaleScale;

  const autoscaleTarget = Number.isFinite(state.qiAutoscale?.targetZeta)
    ? clampNumber(state.qiAutoscale?.targetZeta as number, 1e-6, 1e6)
    : Number.isFinite(QI_AUTOSCALE_TARGET)
    ? clampNumber(QI_AUTOSCALE_TARGET, 1e-6, 1e6)
    : 0.9;
  const autoscaleSlewPerS =
    Number.isFinite(QI_AUTOSCALE_SLEW) ? Math.max(0, QI_AUTOSCALE_SLEW) : 0.25;

  if (PUMP_TONE_ENABLE) {
    const cmd = getPumpCommandForQi(stats, { epoch_ms: GLOBAL_PUMP_EPOCH_MS });
    if (cmd) {
      const scaledCmd = applyScaleToPumpCommand(cmd, qiScale, state.qiAutoscale?.clamps) ?? cmd;
      const now = Date.now();
      const hash = hashPumpCommand(scaledCmd);
      const since = Math.max(0, now - lastPublishedPumpAt);
      const changed = hash !== lastPublishedPumpHash;
      const pastMinInterval = since >= PUMP_CMD_MIN_INTERVAL_MS;
      const keepAliveDue = since >= PUMP_CMD_KEEPALIVE_MS;

      if ((changed && pastMinInterval) || (keepAliveDue && pastMinInterval)) {
        publishPumpCommand(scaledCmd);
        lastPublishedPumpHash = hash;
        lastPublishedPumpAt = now;
      }
    }
  }

  if (DEBUG_PIPE) {
    const qiAutoMin =
      Number.isFinite(state.qiAutoscale?.minScale) && (state.qiAutoscale?.minScale as number) > 0
        ? (state.qiAutoscale?.minScale as number)
        : Number.isFinite(QI_AUTOSCALE_MIN_SCALE)
        ? (QI_AUTOSCALE_MIN_SCALE as number)
        : 0.02;
    const qiAutoSlew =
      Number.isFinite(state.qiAutoscale?.slewPerSec)
        ? (state.qiAutoscale?.slewPerSec as number)
        : Number.isFinite(state.qiAutoscale?.slew)
        ? (state.qiAutoscale?.slew as number)
        : autoscaleSlewPerS;
    console.log("[QI-autoscale]", {
      gating: state.qiAutoscale?.gating ?? "idle",
      engaged: state.qiAutoscale?.engaged ?? false,
      scale: state.qiAutoscale?.appliedScale ?? state.qiAutoscale?.scale ?? 1,
      proposedScale: state.qiAutoscale?.proposedScale ?? null,
      target: state.qiAutoscale?.targetZeta ?? autoscaleTarget,
      slew: qiAutoSlew,
      floor: qiAutoMin,
      zetaRaw: state.qiAutoscale?.rawZeta ?? null,
      sumWindowDt: state.qiAutoscale?.sumWindowDt ?? null,
      source: state.qiAutoscale?.rhoSource ?? null,
      note: state.qiAutoscale?.note ?? null,
      clamps: Array.isArray(state.qiAutoscale?.clamps)
        ? (state.qiAutoscale?.clamps ?? []).slice(-2)
        : [],
    });
  }

  const guardFrac = DEFAULT_QI_SETTINGS.guardBand ?? 0;
  const guardThreshold = Math.abs(stats.bound) * guardFrac;
  const interestDebt = Number(stats.interestDebt);
  const interestMargin = Number(stats.interestMargin);
  const hasInterestDebt = Number.isFinite(interestDebt) && interestDebt > 0;
  const interestGuardThreshold = hasInterestDebt ? Math.abs(interestDebt) * guardFrac : 0;
  let badge: 'ok' | 'near' | 'violation';

  if (!Number.isFinite(stats.margin)) {
    badge = 'violation';
  } else if (stats.margin < 0 || (hasInterestDebt && Number.isFinite(interestMargin) && interestMargin < 0)) {
    badge = 'violation';
  } else if (stats.margin < guardThreshold || (hasInterestDebt && interestMargin < interestGuardThreshold)) {
    badge = 'near';
  } else {
    badge = 'ok';
  }

  state.qiBadge = badge;
}

type HomogenizerSource = "synthetic" | "hardware" | "offline";

type LatticeHomogenizationMetrics = {
  varT00_lattice: number;
  gradT00_norm: number;
  C_warp: number;
  QI_envelope_okPct: number;
  sigmaT00_norm: number;
  sigmaT00_Jm3: number;
  maxTileSigma: number;
  trimEnergy_pct: number;
  meanT00_abs: number;
};

type LatticeHomogenizationResult = {
  tiles: RawTileInput[];
  metrics: LatticeHomogenizationMetrics;
  source: HomogenizerSource;
};

type TileTemplate = {
  id: string;
  ijk: [number, number, number];
  center: [number, number, number];
  envelope: number;
};

const EMPTY_LATTICE_RESULT: LatticeHomogenizationResult = {
  tiles: [],
  source: "offline",
  metrics: {
    varT00_lattice: 0,
    gradT00_norm: 0,
    C_warp: 1,
    QI_envelope_okPct: 100,
    sigmaT00_norm: 0,
    sigmaT00_Jm3: 0,
    maxTileSigma: 0,
    trimEnergy_pct: 0,
    meanT00_abs: 0,
  },
};

function buildQiTilesFromState(
  state: EnergyPipelineState,
  stats: QiStats,
): LatticeHomogenizationResult {
  const tileHint = firstFinite(
    state.activeTiles,
    (state as any)?.tiles?.active,
    state.N_tiles,
    state.tilesPerSector,
  );
  const gridEdgeRaw =
    tileHint && tileHint > 0
      ? Math.round(Math.sqrt(Math.min(tileHint, QI_STREAM_GRID_MAX * QI_STREAM_GRID_MAX)))
      : QI_STREAM_GRID_DEFAULT;
  const gridEdge = clampInt(gridEdgeRaw, QI_STREAM_GRID_MIN, QI_STREAM_GRID_MAX);
  const cols = Math.max(1, gridEdge);
  const rows = Math.max(1, gridEdge);
  const total = cols * rows;
  if (total <= 0) return EMPTY_LATTICE_RESULT;

  const tau_s =
    Number.isFinite(stats.tau_s_ms) && stats.tau_s_ms > 0
      ? (stats.tau_s_ms as number) / 1000
      : DEFAULT_QI_TAU_MS / 1000;
  const limit = Math.max(
    1e-6,
    Math.abs(Number(stats.bound)) || Math.abs(DEFAULT_QI_BOUND_SCALAR) || 1,
  );
  const baseAvg = Math.abs(Math.min(0, Number(stats.avg) || 0)) / limit;
  const baseS = clampNumber(Number.isFinite(baseAvg) ? baseAvg : 0, 0, 1.5);
  const activity = clampNumber(state.activeFraction ?? 0.25, 0, 1);
  const guardRatio = clampNumber(
    Math.abs(Number(stats.margin) || 0) / Math.max(limit, 1e-6),
    0,
    1.5,
  );
  const qFactor = Number.isFinite(state.qCavity) ? (state.qCavity as number) : undefined;
  const temperature = Number.isFinite(state.temperature_K)
    ? (state.temperature_K as number)
    : undefined;
  const shipRadius = Number.isFinite(state.shipRadius_m)
    ? Math.max(1, state.shipRadius_m as number)
    : 100;
  const span = Math.max(1, shipRadius * 2);
  const spacing = span / Math.max(cols, rows);
  const origin = -span / 2;
  const diagNorm = Math.max(1, Math.hypot(cols, rows));
  const phase = Date.now() * 0.0007;

  const rhoField: number[] = new Array(total);
  const saturationField: number[] = new Array(total);
  const templates: TileTemplate[] = new Array(total);
  let minSat = Number.POSITIVE_INFINITY;
  let maxSat = Number.NEGATIVE_INFINITY;
  const guardPenalty = clampNumber(1 - 0.6 * guardRatio, 0.15, 1);
  const rippleAmpBase = 0.15 + 0.35 * (0.5 + 0.5 * guardPenalty);
  const envelopeAmpBase = 0.2 + 0.4 * guardPenalty;
  const checkerAmp = 0.06 * guardPenalty;
  const bias = 0.05 * guardPenalty;
  for (let idx = 0; idx < total; idx += 1) {
    const i = idx % cols;
    const j = Math.floor(idx / cols);
    const radial = Math.hypot(i - cols / 2, j - rows / 2) / (diagNorm / 2);
    const envelope = 1 - clampNumber(radial, 0, 1);
    const ripple = Math.sin(phase + 0.23 * i + 0.31 * j) * Math.cos(0.07 * phase + 0.19 * i - 0.13 * j);
    const checker = ((i + j) & 1) === 0 ? 1 : -1;
    const stress =
      guardPenalty * baseS +
      rippleAmpBase * ripple +
      envelopeAmpBase * envelope +
      checkerAmp * checker +
      bias;
    const S = clampNumber(stress, 0.02, 1.5);
    const rho = -limit * S;
    rhoField[idx] = rho;
    saturationField[idx] = S;
    if (S < minSat) minSat = S;
    if (S > maxSat) maxSat = S;
    templates[idx] = {
      id: `sim-${i}-${j}`,
      ijk: [i, j, 0],
      center: [origin + (i + 0.5) * spacing, origin + (j + 0.5) * spacing, 0],
      envelope,
    };
  }
  if (maxSat - minSat < 1e-4) {
    for (let idx = 0; idx < total; idx += 1) {
      const i = idx % cols;
      const j = Math.floor(idx / cols);
      const envelope = templates[idx]?.envelope ?? 0.5;
      const ripple = Math.sin(0.37 * phase + 0.29 * i - 0.11 * j);
      const fallback = clampNumber(0.08 + 0.25 * envelope + 0.12 * ripple, 0.01, 0.6);
      saturationField[idx] = fallback;
      rhoField[idx] = -limit * fallback;
    }
  }
  const metrics = deriveLatticeHomogenizationMetrics(rhoField, saturationField, cols, rows, limit);
  const meanAbs = metrics.meanT00_abs ?? 0;
  const sigmaAbs = metrics.sigmaT00_Jm3 ?? 0;
  const invSigma = sigmaAbs > 1e-9 ? 1 / sigmaAbs : 0;
  const tiles: RawTileInput[] = new Array(total);
  for (let idx = 0; idx < total; idx += 1) {
    const template = templates[idx];
    const rho = rhoField[idx];
    const absRho = Math.abs(rho);
    const deviation = absRho - meanAbs;
    const sigmaNorm = invSigma ? deviation * invSigma : 0;
    const envelope = template?.envelope ?? 0;
    const guardPenalty = 1 - clampNumber(guardRatio, 0, 1);
    const weight = clampNumber(0.25 + 0.75 * envelope * guardPenalty, 0.05, 1);
    tiles[idx] = {
      id: template?.id ?? `sim-${idx}`,
      ijk: template?.ijk ?? [idx % cols, Math.floor(idx / cols), 0],
      center_m:
        template?.center ?? [origin + ((idx % cols) + 0.5) * spacing, origin + (Math.floor(idx / cols) + 0.5) * spacing, 0],
      rho_neg_Jm3: rho,
      tau_eff_s: tau_s,
      qi_limit: limit,
      Q_factor: qFactor,
      T_K: temperature,
      absRho_Jm3: absRho,
      deviation_Jm3: deviation,
      sigmaNorm,
      weight,
    };
  }
  return { tiles, metrics, source: "synthetic" };
}

function deriveLatticeHomogenizationMetrics(
  rhoField: number[],
  saturationField: number[],
  cols: number,
  rows: number,
  limit: number,
): LatticeHomogenizationMetrics {
  const total = rhoField.length;
  if (!total) return EMPTY_LATTICE_RESULT.metrics;

  const limitAbs = Math.max(Math.abs(limit), 1e-6);
  let meanSat = 0;
  for (const sat of saturationField) meanSat += sat;
  meanSat /= total;

  let varianceSat = 0;
  let maxSatDelta = 0;
  let satDeviationSum = 0;
  for (const sat of saturationField) {
    const delta = sat - meanSat;
    varianceSat += delta * delta;
    const mag = Math.abs(delta);
    if (mag > maxSatDelta) maxSatDelta = mag;
    satDeviationSum += mag;
  }
  varianceSat /= total;
  const sigmaSat = Math.sqrt(Math.max(varianceSat, 0));
  const sigmaAbs = sigmaSat * limitAbs;
  const sigmaNorm = sigmaSat;
  const maxTileSigma = sigmaSat > 1e-9 ? maxSatDelta / sigmaSat : 0;
  const trimEnergyPct = (satDeviationSum / Math.max(total, 1)) * 100;

  const gradNorm = computeNormalizedGradient(saturationField, cols, rows, 1);

  let okCount = 0;
  for (const sat of saturationField) {
    if (sat <= 1) okCount += 1;
  }
  const okPct = total ? (okCount / total) * 100 : 0;

  const absValues = rhoField.map((value) => Math.abs(value)).sort((a, b) => a - b);
  const median = absValues[Math.floor(absValues.length / 2)] ?? 0;
  const peak = absValues[absValues.length - 1] ?? 0;
  const ratio =
    median > 1e-6 ? peak / median : peak > 0 ? Number.POSITIVE_INFINITY : 1;
  const ratioPenalty = clampNumber((ratio - 1) / 4, 0, 4);

  const cWarp = clampNumber(
    1 -
      (0.5 * clampNumber(sigmaNorm, 0, 4) +
        0.3 * clampNumber(gradNorm, 0, 4) +
        0.2 * ratioPenalty),
    0,
    1,
  );

  return {
    varT00_lattice: clampNumber(sigmaNorm, 0, 4),
    gradT00_norm: clampNumber(gradNorm, 0, 4),
    C_warp: cWarp,
    QI_envelope_okPct: clampNumber(okPct, 0, 100),
    sigmaT00_norm: clampNumber(sigmaNorm, 0, 4),
    sigmaT00_Jm3: sigmaAbs,
    maxTileSigma: clampNumber(maxTileSigma, 0, 8),
    trimEnergy_pct: clampNumber(trimEnergyPct, 0, 400),
    meanT00_abs: meanSat * limitAbs,
  };
}

function computeNormalizedGradient(
  field: number[],
  cols: number,
  rows: number,
  scale: number,
): number {
  if (!(cols > 0 && rows > 0)) return 0;
  let accum = 0;
  let samples = 0;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const idx = j * cols + i;
      const center = field[idx];
      if (i + 1 < cols) {
        accum += Math.abs(center - field[idx + 1]);
        samples += 1;
      }
      if (j + 1 < rows) {
        accum += Math.abs(center - field[idx + cols]);
        samples += 1;
      }
    }
  }
  if (!samples) return 0;
  const avgDiff = accum / samples;
  return avgDiff / Math.max(scale, 1e-6);
}

function firstFinite(...values: Array<number | null | undefined>): number | undefined {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return Number(value);
    }
  }
  return undefined;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.round(clampNumber(value, min, max));
}

const relDelta = (current: number, baseline: number, eps = 1e-12) =>
  Math.abs(current - baseline) / Math.max(Math.abs(baseline), eps);

type EffectiveRhoDebug = {
  source?: string;
  value?: number;
  note?: string;
  reason?: string;
};

function resolveTileTelemetryScale(): number {
  const scale = parseEnvNumber(process.env.QI_TILE_TELEMETRY_SCALE, 1);
  return Math.max(0, Math.abs(scale));
}

function resolveMetricRhoFromState(
  state: EnergyPipelineState,
  debug?: EffectiveRhoDebug,
  opts?: { allowConstraintFallback?: boolean },
): number | undefined {
  const allowConstraintFallback = opts?.allowConstraintFallback !== false;
  const warp = (state as any)?.warp;
  const warpMetricSource =
    warp?.metricT00Source ?? warp?.metricStressSource ?? warp?.stressEnergySource;
  const warpMetricT00 = firstFinite(
    warp?.metricT00,
    warp?.metricStressEnergy?.T00,
    warp?.metricStressDiagnostics?.rhoSiMean,
  );
  const warpMetricRef =
    typeof warp?.metricT00Ref === "string" && warp.metricT00Ref.length > 0
      ? String(warp.metricT00Ref)
      : "warp.metricT00";
  if (warpMetricSource === "metric" && warpMetricT00 !== undefined) {
    if (debug) {
      debug.source = warpMetricRef;
      debug.value = warpMetricT00;
      debug.note = "metric-derived";
    }
    return warpMetricT00;
  }

  const natario = (state as any)?.natario;
  const natarioMetricSource = natario?.metricT00Source ?? natario?.metricSource;
  const natarioMetricT00 = firstFinite(
    natario?.metricT00,
    natario?.stressEnergyTensor?.T00,
  );
  const natarioMetricRef =
    typeof natario?.metricT00Ref === "string" && natario.metricT00Ref.length > 0
      ? String(natario.metricT00Ref)
      : "warp.metric.T00.natario.shift";
  if (natarioMetricSource === "metric" && natarioMetricT00 !== undefined) {
    if (debug) {
      debug.source = natarioMetricRef;
      debug.value = natarioMetricT00;
      debug.note = "metric-derived (natario payload)";
    }
    return natarioMetricT00;
  }

  const vdbRegionII = (state as any)?.vdbRegionII;
  const vdbT00Geom = firstFinite(vdbRegionII?.t00_mean);
  if (hasVdbRegionIIMetricSupport(vdbRegionII) && vdbT00Geom !== undefined) {
    const rhoSi = vdbT00Geom * GEOM_TO_SI_STRESS;
    if (debug) {
      debug.source = "warp.metric.T00.vdb.regionII";
      debug.value = rhoSi;
      debug.note = "metric-derived (VdB region II, geometric -> SI)";
    }
    return rhoSi;
  }

  if (allowConstraintFallback) {
    const rhoConstraint = state.gr?.constraints?.rho_constraint?.mean;
    if (Number.isFinite(rhoConstraint as number)) {
      const rhoSi = Number(rhoConstraint) * GEOM_TO_SI_STRESS;
      if (debug) {
        debug.source = "gr.rho_constraint.mean";
        debug.value = rhoSi;
        debug.note = "constraint-derived (geometric -> SI)";
      }
      return rhoSi;
    }
  }

  return undefined;
}

type QiCurvatureInfo = {
  radius_m?: number;
  ratio?: number;
  ok?: boolean;
  source?: string;
  note?: string;
  scalar?: number;
  signalState?: "available" | "missing";
  reasonCode?: "G4_QI_CURVATURE_WINDOW_FAIL" | "G4_QI_SIGNAL_MISSING";
};

function pickInvariantScalar(
  stats?: import("./gr-evolve-brick").GrInvariantStats,
): number | undefined {
  if (!stats) return undefined;
  const candidates = [stats.p98, stats.max, stats.mean]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.abs(value));
  if (candidates.length === 0) return undefined;
  const positive = candidates.find((value) => value > 0);
  if (positive !== undefined) return positive;
  return 0;
}

function resolveQiCurvature(
  state: EnergyPipelineState,
  tau_ms: number,
): QiCurvatureInfo {
  const invariants = state.gr?.invariants;
  if (!invariants) return { signalState: "missing", reasonCode: "G4_QI_SIGNAL_MISSING", note: "missing curvature invariants" };

  const kretschmann = pickInvariantScalar(invariants.kretschmann);
  const ricci4 = pickInvariantScalar(invariants.ricci4);
  const scalar = kretschmann ?? ricci4;
  const source = kretschmann != null
    ? "gr.invariants.kretschmann"
    : ricci4 != null
      ? "gr.invariants.ricci4"
      : undefined;

  if (scalar == null) {
    return { source, signalState: "missing", reasonCode: "G4_QI_SIGNAL_MISSING", note: "missing curvature invariants" };
  }
  if (!(scalar > 0)) {
    return { source, scalar, signalState: "available", reasonCode: "G4_QI_CURVATURE_WINDOW_FAIL", note: "non-positive curvature scalar" };
  }

  const radius_m = Math.pow(1 / scalar, 0.25);
  if (!Number.isFinite(radius_m) || radius_m <= 0) {
    return { source, scalar, signalState: "available", reasonCode: "G4_QI_CURVATURE_WINDOW_FAIL", note: "non-finite curvature radius" };
  }

  const tau_s = Math.max(0, tau_ms) / 1000;
  const tau_m = C * tau_s;
  const ratio = tau_m / radius_m;
  if (!Number.isFinite(ratio)) {
    return { source, scalar, radius_m, ratio, signalState: "available", reasonCode: "G4_QI_CURVATURE_WINDOW_FAIL", note: "non-finite curvature ratio" };
  }
  const ok = ratio <= DEFAULT_QI_CURVATURE_RATIO_MAX;

  return {
    radius_m,
    ratio,
    ok,
    source,
    scalar,
    signalState: "available",
    ...(ok ? {} : { reasonCode: "G4_QI_CURVATURE_WINDOW_FAIL" as const }),
  };
}

function estimateEffectiveRhoFromState(state: EnergyPipelineState, debug?: EffectiveRhoDebug): number {
  const metricRho = resolveMetricRhoFromState(state, debug);
  if (Number.isFinite(metricRho as number)) {
    return Number(metricRho);
  }
  if (strictCongruenceEnabled()) {
    if (debug) {
      debug.source = "metric-missing";
      debug.value = Number.NaN;
      debug.reason = "strict_metric_required";
      debug.note = "WARP_STRICT_CONGRUENCE=1 disables proxy rho fallbacks";
    }
    return Number.NaN;
  }

  const nowMs = Date.now();
  const tilesTelemetry = getLatestQiTileStats();
  if (
    tilesTelemetry?.avgNeg != null &&
    tilesTelemetry.source != null &&
    tilesTelemetry.source !== "synthetic"
  ) {
    const scale = resolveTileTelemetryScale();
    const scaled = tilesTelemetry.avgNeg * scale;
    if (debug) {
      debug.source = "tile-telemetry";
      debug.value = scaled;
      debug.note = scale !== 1 ? `${tilesTelemetry.source} (scale ${scale})` : tilesTelemetry.source;
    }
    return scaled;
  }
  const pulses = state.gateAnalytics?.pulses;

  if (Array.isArray(pulses) && pulses.length) {
    let accum = 0;
    for (const pulse of pulses) {
      accum += rhoFromPulse(nowMs, pulse);
    }
    if (Number.isFinite(accum)) {
      if (debug) {
        debug.source = "gate-pulses";
        debug.value = accum;
        debug.note = `${pulses.length} pulse(s)`;
      }
      return accum;
    }
  }

  if (lastPumpCommandSnapshot?.tones?.length) {
    const val = rhoFromTones(
      nowMs,
      lastPumpCommandSnapshot.tones,
      lastPumpCommandSnapshot.rho0 ?? 0,
      lastPumpCommandSnapshot.epoch_ms,
    );
    if (debug) {
      debug.source = "pump-tones";
      debug.value = val;
      debug.note = `${lastPumpCommandSnapshot.tones.length} tone(s)`;
    }
    return val;
  }

  const effDuty =
    Number((state as any).dutyEffectiveFR ?? state.dutyEffective_FR ?? state.dutyCycle ?? 0);
  if (!Number.isFinite(effDuty) || effDuty <= 0) {
    if (debug) {
      debug.source = "duty-fallback";
      debug.value = 0;
      debug.reason = !Number.isFinite(effDuty) ? "non-finite duty" : "duty <= 0";
    }
    return 0;
  }
  if (debug) {
    debug.source = "duty-fallback";
    debug.value = -Math.abs(effDuty);
    debug.note = "using dutyEffectiveFR/dutyCycle";
  }
  return -Math.abs(effDuty);
}

function rhoFromPulse(nowMs: number, pulse: GatePulse | undefined): number {
  if (!pulse) return 0;
  if (Array.isArray(pulse.tones) && pulse.tones.length) {
    const baseRho = Number.isFinite(pulse.rho) ? Number(pulse.rho) : 0;
    return rhoFromTones(nowMs, pulse.tones, baseRho);
  }
  return Number.isFinite(pulse.rho) ? Number(pulse.rho) : 0;
}

function rhoFromTones(
  nowMs: number,
  tones: PumpTone[],
  rho0: number,
  epochOverride?: number,
): number {
  if (!Array.isArray(tones) || tones.length === 0) {
    return Number.isFinite(rho0) ? Number(rho0) : 0;
  }
  const epoch = Number.isFinite(epochOverride) ? Number(epochOverride) : GLOBAL_PUMP_EPOCH_MS;
  const t_s = (nowMs - epoch) / 1000;
  let acc = Number.isFinite(rho0) ? Number(rho0) : 0;
  for (const tone of tones) {
    if (!tone) continue;
    const freqHz = Number(tone.omega_hz);
    const depth = Number(tone.depth ?? 0);
    if (!Number.isFinite(freqHz) || !Number.isFinite(depth) || depth === 0) continue;
    const phaseDeg = Number.isFinite(tone.phase_deg) ? Number(tone.phase_deg) : 0;
    const phaseRad = (phaseDeg * Math.PI) / 180;
    const theta = 2 * Math.PI * freqHz * t_s + phaseRad;
    acc += depth * Math.cos(theta);
  }
  return acc;
}

function resolvePulseRole(
  pulse: GatePulse | undefined,
  schedule?: PhaseSchedule | null,
): "neg" | "pos" | null {
  if (!pulse) return null;
  const explicit = (pulse as any).role;
  if (explicit === "neg" || explicit === "pos") return explicit;
  if (Array.isArray(pulse.tags)) {
    for (const tag of pulse.tags) {
      const t = typeof tag === "string" ? tag.toLowerCase() : "";
      if (t.includes("neg")) return "neg";
      if (t.includes("pos")) return "pos";
    }
  }
  const sector = Number((pulse as any).sectorIndex);
  if (Number.isInteger(sector) && schedule) {
    if (Array.isArray(schedule.negSectors) && schedule.negSectors.includes(sector)) return "neg";
    if (Array.isArray(schedule.posSectors) && schedule.posSectors.includes(sector)) return "pos";
  }
  return null;
}

function pulseDurationMs(
  state: EnergyPipelineState,
  pulse: GatePulse | undefined,
  sectorPeriod_ms: number,
  dutyFallback?: number,
): number {
  const durNs = Number((pulse as any)?.dur_ns);
  if (Number.isFinite(durNs) && durNs > 0) {
    return durNs / 1e6;
  }
  const tauPulse_ms = Number(
    (state.clocking as any)?.tauPulse_ms ??
      (state.lightCrossing as any)?.burst_ms ??
      (state as any)?.burst_ms ??
      (state as any)?.lightCrossing?.burst_ms,
  );
  if (Number.isFinite(tauPulse_ms) && tauPulse_ms > 0) {
    return tauPulse_ms;
  }
  const duty =
    Number.isFinite(dutyFallback) && dutyFallback != null
      ? Number(dutyFallback)
      : Number.isFinite(state.dutyBurst)
      ? Number(state.dutyBurst)
      : Number(state.dutyCycle);
  if (Number.isFinite(duty) && duty > 0 && sectorPeriod_ms > 0) {
    return sectorPeriod_ms * Math.min(1, Math.max(0, duty));
  }
  const sectors = Math.max(1, Math.floor(state.sectorCount ?? DEFAULT_SECTORS_TOTAL));
  return sectorPeriod_ms > 0 ? Math.max(1e-3, sectorPeriod_ms / sectors) : 1;
}

function computeQuantumInterestBook(state: EnergyPipelineState): QuantumInterestBook | null {
  const pulses = state.gateAnalytics?.pulses;
  if (!Array.isArray(pulses) || pulses.length === 0) return null;
  const guard = (state as any).qiGuardrail ?? {};
  const nowMs = Date.now();
  const tau_ms = Number.isFinite(state.qi?.tau_s_ms)
    ? Number(state.qi?.tau_s_ms)
    : Number(guard.window_ms) || DEFAULT_QI_TAU_MS;
  const sectorPeriod_ms = clampNumber(
    Number(state.sectorPeriod_ms ?? guard.sectorPeriod_ms ?? DEFAULT_SECTOR_PERIOD_MS),
    0.1,
    10_000,
  );
  const guardWindow = Number(guard.window_ms);
  const baseWindow =
    Number.isFinite(guardWindow) && guardWindow > 0 ? guardWindow : tau_ms * DEFAULT_QI_INTEREST_WINDOW_MULT;
  const window_ms = Math.max(baseWindow, tau_ms * DEFAULT_QI_INTEREST_WINDOW_MULT, sectorPeriod_ms * 2);
  const schedule = (state.phaseSchedule as PhaseSchedule | undefined) ?? null;
  let neg = 0;
  let pos = 0;

  for (const pulse of pulses) {
    const role = resolvePulseRole(pulse, schedule);
    if (role !== "neg" && role !== "pos") continue;
    const rho = Math.abs(rhoFromPulse(nowMs, pulse));
    if (!Number.isFinite(rho) || rho <= 0) continue;
    const dur_ms = pulseDurationMs(state, pulse, sectorPeriod_ms, guard.patternDuty ?? guard.duty);
    const weight = Math.min(1, Math.max(0, dur_ms) / Math.max(window_ms, 1e-3));
    const contribution = rho * weight;
    if (role === "neg") neg += contribution;
    else pos += contribution;
  }

  if (!(neg > 0 || pos > 0)) return null;

  const rate = Math.max(0, DEFAULT_QI_INTEREST_RATE);
  const debt = neg * (1 + rate);
  const credit = pos;
  const margin = credit - debt;
  const netCycle = credit - neg;

  const book: QuantumInterestBook = {
    neg_Jm3: neg,
    pos_Jm3: pos,
    debt_Jm3: debt,
    credit_Jm3: credit,
    margin_Jm3: margin,
    netCycle_Jm3: netCycle,
    window_ms,
    rate,
  };

  return book;
}

type QiGuardPattern = {
  key: string;
  mask: Float64Array;
  window: Float64Array;
  dt_s: number;
  duty: number;
  window_ms: number;
};

const qiGuardPatternCache = new Map<string, QiGuardPattern>();

function guardPatternKey(params: {
  sectorCount: number;
  concurrentSectors: number;
  sectorPeriod_ms: number;
  tau_ms: number;
  sampler: SamplingKind;
  negSectors: number[];
}): string {
  return [
    params.sectorCount,
    params.concurrentSectors,
    params.sectorPeriod_ms.toFixed(6),
    params.tau_ms.toFixed(6),
    params.sampler,
    params.negSectors.join(","),
  ].join("|");
}

function buildQiGuardPattern(params: {
  sectorCount: number;
  concurrentSectors: number;
  sectorPeriod_ms: number;
  tau_ms: number;
  sampler: SamplingKind;
  negSectors: number[];
}): QiGuardPattern {
  const key = guardPatternKey(params);
  const cached = qiGuardPatternCache.get(key);
  if (cached) return cached;

  const cycleSamples = Math.max(1, Math.floor(params.sectorCount));
  const dt_s = Math.max(params.sectorPeriod_ms, 1e-3) / cycleSamples / 1000;
  const repeats = Math.max(
    1,
    Math.ceil((8 * Math.max(params.tau_ms, 1e-3)) / Math.max(params.sectorPeriod_ms, 1e-3)),
  );
  const totalSamples = cycleSamples * repeats;
  const mask = new Float64Array(totalSamples);
  const negSet = new Set(params.negSectors ?? []);
  const activeWeight = Math.max(1, Math.floor(params.concurrentSectors) || 1);
  for (let r = 0; r < repeats; r += 1) {
    const offset = r * cycleSamples;
    for (const idx of negSet) {
      const j = (idx % cycleSamples) + offset;
      mask[j] = activeWeight;
    }
  }
  let sum = 0;
  for (const v of mask) sum += v;
  const duty = sum / Math.max(totalSamples, 1);
  const window = buildWindow(
    totalSamples,
    dt_s,
    Math.max(params.tau_ms, 1e-3) / 1000,
    params.sampler,
  );
  const pattern: QiGuardPattern = {
    key,
    mask,
    window,
    dt_s,
    duty,
    window_ms: totalSamples * dt_s * 1000,
  };
  qiGuardPatternCache.set(key, pattern);
  return pattern;
}

function clampNegativeBound(value: number, fallback?: number): number {
  const envFloorAbs = Number(process.env.QI_BOUND_FLOOR_ABS);
  const floorAbs = Number.isFinite(envFloorAbs)
    ? Math.max(Math.abs(envFloorAbs as number), 1e-12)
    : 1e-12;
  const fbMag = Number.isFinite(fallback) ? Math.max(Math.abs(fallback as number), floorAbs) : floorAbs;
  if (!Number.isFinite(value)) return -fbMag;
  const mag = Math.max(Math.abs(value) || 0, floorAbs, fbMag);
  return -mag;
}

function rhoSourceIsDutyFallback(rhoDebug: EffectiveRhoDebug): boolean {
  const src = (rhoDebug.source ?? "").toLowerCase();
  return src === "duty-fallback" || src === "duty" || src === "schedule";
}

function rhoSourceIsMetric(rhoDebug: EffectiveRhoDebug): boolean {
  const src = (rhoDebug.source ?? "").toLowerCase();
  return (
    src.startsWith("warp.metric") ||
    src.startsWith("gr.rho_constraint") ||
    src.startsWith("gr.metric")
  );
}

type QiStatusInput = {
  zetaRaw?: number;
  zetaClamped?: number;
  pAvg?: number;
  pWarn?: number;
  mode?: string;
};

type QiStatusColor = 'red' | 'amber' | 'green' | 'muted';

export function deriveQiStatus(
  input: QiStatusInput,
): {
  zetaForStatus: number | null;
  compliance: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  color: QiStatusColor;
} {
  const raw = Number(input.zetaRaw);
  const clamped = Number(input.zetaClamped);
  const hasRaw = Number.isFinite(raw);
  const hasClamped = Number.isFinite(clamped);
  const zetaForStatus = hasRaw ? raw : hasClamped ? clamped : null;

  let color: QiStatusColor = 'muted';
  if (zetaForStatus != null) {
    color = zetaForStatus >= 1
      ? 'red'
      : zetaForStatus >= 0.95
      ? 'amber'
      : 'green';
  }

  const compliance = Number.isFinite(zetaForStatus) && (zetaForStatus as number) < 1;
  const guardFail = !compliance || (zetaForStatus != null && (zetaForStatus as number) >= 1);
  const warnByZeta = Number.isFinite(zetaForStatus) && (zetaForStatus as number) >= 0.95;
  const warnByPower =
    (input.mode ?? "hover") !== "emergency" &&
    Number.isFinite(input.pWarn) &&
    Number.isFinite(input.pAvg) &&
    (input.pAvg as number) > (input.pWarn as number);

  let overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  if (guardFail) {
    overallStatus = 'CRITICAL';
  } else if (warnByZeta || warnByPower) {
    overallStatus = 'WARNING';
  } else {
    overallStatus = 'NOMINAL';
  }

  return { zetaForStatus, compliance, overallStatus, color };
}

export function evaluateQiGuardrail(
  state: EnergyPipelineState,
  opts: {
    schedule?: PhaseSchedule;
    sectorPeriod_ms?: number;
    sampler?: SamplingKind;
    tau_ms?: number;
    qiPolicyMaxZeta?: number;
  } = {},
): {
  lhs_Jm3: number;
  bound_Jm3: number;
  marginRatio: number;
  marginRatioRaw: number;
  policyLimit?: number;
  window_ms: number;
  sampler: SamplingKind;
  fieldType: string;
  samples: number;
  duty: number;
  patternDuty: number;
  maskSum: number;
  effectiveRho: number;
  rhoOn: number;
  rhoSource?: string;
  rhoNote?: string;
  sumWindowDt: number;
  rhoOnDuty?: number;
  curvatureRadius_m?: number;
  curvatureRatio?: number;
  curvatureOk?: boolean;
  curvatureSource?: string;
  curvatureNote?: string;
  curvatureEnforced?: boolean;
  applicabilityStatus?: "PASS" | "FAIL" | "NOT_APPLICABLE" | "UNKNOWN";
  applicabilityReasonCode?: "G4_QI_CURVATURE_WINDOW_FAIL" | "G4_QI_SIGNAL_MISSING";
  strictMode?: boolean;
  metricContractOk?: boolean;
  metricDerived?: boolean;
  metricDerivedSource?: string;
  metricDerivedReason?: string;
  metricDerivedChart?: string;
} {
  const sampler = opts.sampler ?? state.phaseSchedule?.sampler ?? state.qi?.sampler ?? DEFAULT_QI_SETTINGS.sampler;
  const tau_ms =
    Number.isFinite(opts.tau_ms) && (opts.tau_ms as number) > 0
      ? (opts.tau_ms as number)
      : Number.isFinite(state.qi?.tau_s_ms)
      ? Number(state.qi?.tau_s_ms)
      : DEFAULT_QI_SETTINGS.tau_s_ms;
  const sectorPeriod_ms = clampNumber(
    Number(opts.sectorPeriod_ms ?? state.phaseSchedule?.sectorPeriod_ms ?? state.sectorPeriod_ms) ||
      DEFAULT_SECTOR_PERIOD_MS,
    0.1,
    10_000,
  );
  const sectorCount = Math.max(
    1,
    Math.floor(state.phaseSchedule?.phi_deg_by_sector?.length ?? state.sectorCount ?? DEFAULT_SECTORS_TOTAL),
  );
  const concurrentSectors = Math.max(
    1,
    Math.floor(state.concurrentSectors ?? state.sectorStrobing ?? 1),
  );
  const schedule =
    opts.schedule ??
    (state.phaseSchedule as PhaseSchedule | undefined) ??
    computeSectorPhaseOffsets({
      N: sectorCount,
      sectorPeriod_ms,
      phase01: 0,
      tau_s_ms: tau_ms,
      sampler,
      negativeFraction: state.negativeFraction ?? DEFAULT_NEGATIVE_FRACTION,
    });
  const negSectors = Array.isArray(schedule?.negSectors) ? schedule!.negSectors : [];
  const pattern = buildQiGuardPattern({
    sectorCount,
    concurrentSectors,
    sectorPeriod_ms,
    tau_ms,
    sampler,
    negSectors,
  });
  const patternDuty = pattern.duty;
  const maskSum = pattern.mask.reduce((acc, v) => acc + v, 0);
  const duty = patternDuty > 0 ? patternDuty : Math.max(negSectors.length / Math.max(sectorCount, 1), 1e-6);
  const rhoDebug: EffectiveRhoDebug = {};
  const effectiveRho = estimateEffectiveRhoFromState(state, rhoDebug);
  const metricRho = rhoSourceIsMetric(rhoDebug);
  const rhoOn = metricRho ? effectiveRho : duty > 0 ? effectiveRho / duty : effectiveRho;
  const curvatureInfo = resolveQiCurvature(state, tau_ms);
  const curvatureRatio = curvatureInfo.ratio;
  const curvatureOk = curvatureInfo.ok;
  const curvatureNote = curvatureInfo.note;
  const curvatureEnforced = QI_CURVATURE_ENFORCE;
  const applicabilityReasonCode = curvatureInfo.reasonCode;
  const applicabilityStatus: "PASS" | "FAIL" | "NOT_APPLICABLE" | "UNKNOWN" =
    curvatureInfo.signalState === "missing"
      ? "UNKNOWN"
      : curvatureOk === false
        ? "NOT_APPLICABLE"
        : curvatureOk === true
          ? "PASS"
          : "NOT_APPLICABLE";
  const dt_s = pattern.dt_s;
  const sumWindowDt = pattern.window.reduce((acc, v) => acc + v * dt_s, 0);
  let lhs = 0;
  for (let i = 0; i < pattern.mask.length; i += 1) {
    const rho = pattern.mask[i] ? rhoOn * pattern.mask[i] : 0;
    lhs += rho * pattern.window[i] * dt_s;
  }
  if (
    DEBUG_PIPE &&
    (duty <= 0 || maskSum <= 0 || !Number.isFinite(effectiveRho) || effectiveRho === 0)
  ) {
    console.warn("[QI-guard][zero-input]", {
      duty,
      patternDuty,
      maskSum,
      effectiveRho,
      rhoSource: rhoDebug.source ?? "unknown",
      negSectors: negSectors.length,
    });
  }
  const fieldType = (state.qi as any)?.fieldType ?? DEFAULT_QI_FIELD;
  const boundResult = qiBound_Jm3({
    tau_s: Math.max(1e-9, tau_ms / 1000),
    fieldType,
    kernelType: sampler,
  });
  const candidateBound = boundResult.bound_Jm3 - Math.abs(boundResult.safetySigma_Jm3);
  const policyMaxZeta =
    Number.isFinite(opts.qiPolicyMaxZeta) && (opts.qiPolicyMaxZeta as number) > 0
      ? Math.max(1e-12, Number(opts.qiPolicyMaxZeta))
      : QI_POLICY_MAX_ZETA;
  const policyFloorAbs =
    QI_POLICY_ENFORCE && policyMaxZeta > 0 ? Math.abs(lhs) / policyMaxZeta : 0;
  const envFloorAbsRaw = Number(process.env.QI_BOUND_FLOOR_ABS);
  const envFloorAbs = Number.isFinite(envFloorAbsRaw)
    ? Math.abs(envFloorAbsRaw as number)
    : 0;
  const fallbackAbs = Math.max(
    Math.abs(DEFAULT_QI_BOUND_SCALAR),
    envFloorAbs,
    policyFloorAbs,
    1e-12,
  );
  const bound_Jm3 = clampNegativeBound(candidateBound, -fallbackAbs);
  const rawRatio =
    bound_Jm3 < 0 && Number.isFinite(bound_Jm3) ? Math.abs(lhs) / Math.abs(bound_Jm3) : Infinity;
  const marginRatio = QI_POLICY_ENFORCE ? Math.min(rawRatio, policyMaxZeta) : rawRatio;

  const rhoNote = [rhoDebug.note ?? rhoDebug.reason, curvatureNote].filter(Boolean).join("; ") || undefined;
  const timingMetricDerived = Boolean(
    state.ts?.metricDerived ?? state.clocking?.metricDerived ?? state.tsMetricDerived,
  );
  const timingMetricDerivedSource = String(
    state.ts?.metricDerivedSource ??
      state.clocking?.metricDerivedSource ??
      state.tsMetricDerivedSource ??
      "unknown",
  );
  const timingMetricDerivedReason = String(
    state.ts?.metricDerivedReason ??
      state.clocking?.metricDerivedReason ??
      state.tsMetricDerivedReason ??
      "metric-derivation-status unavailable",
  );
  const metricDerivedChart = String(
    state.ts?.metricDerivedChart ?? state.clocking?.metricDerivedChart ?? "unknown",
  );
  const metricDerived = metricRho && timingMetricDerived;
  const metricDerivedSource = metricDerived
    ? `${rhoDebug.source ?? "unknown"}+${timingMetricDerivedSource}`
    : metricRho
      ? rhoDebug.source ?? "unknown"
      : timingMetricDerivedSource;
  const metricDerivedReason = metricDerived
    ? "rho_source_metric;timing_metric"
    : metricRho
      ? "timing_non_metric"
      : timingMetricDerived
        ? "rho_source_non_metric"
        : `rho_source_non_metric;timing_non_metric;timing_reason=${timingMetricDerivedReason}`;
  const strictMode = strictCongruenceEnabled();
  const warpState = (state as any).warp as Record<string, unknown> | undefined;
  const natarioState = (state as any).natario as Record<string, unknown> | undefined;
  const metricContractStatus =
    (warpState as any)?.metricT00Contract?.status ??
    (warpState as any)?.metricT00ContractStatus ??
    (natarioState as any)?.metricT00ContractStatus;
  const metricChartContractStatus =
    (warpState as any)?.metricAdapter?.chart?.contractStatus ??
    (warpState as any)?.metricAdapter?.chart?.contract_status ??
    (natarioState as any)?.chartContractStatus;
  const metricChart =
    (warpState as any)?.metricAdapter?.chart?.label ??
    (natarioState as any)?.chartLabel;
  const metricObserver =
    (warpState as any)?.metricT00Contract?.observer ??
    (warpState as any)?.metricT00Observer ??
    (natarioState as any)?.metricT00Observer;
  const metricNormalization =
    (warpState as any)?.metricT00Contract?.normalization ??
    (warpState as any)?.metricT00Normalization ??
    (natarioState as any)?.metricT00Normalization;
  const metricUnitSystem =
    (warpState as any)?.metricT00Contract?.unitSystem ??
    (warpState as any)?.metricT00UnitSystem ??
    (natarioState as any)?.metricT00UnitSystem;
  const metricContractOk =
    metricContractStatus === "ok" &&
    metricChartContractStatus === "ok" &&
    typeof metricChart === "string" &&
    metricChart.length > 0 &&
    metricChart !== "unspecified" &&
    typeof metricObserver === "string" &&
    metricObserver.length > 0 &&
    typeof metricNormalization === "string" &&
    metricNormalization.length > 0 &&
    metricUnitSystem === "SI";

  return {
    lhs_Jm3: lhs,
    bound_Jm3,
    marginRatio: Number.isFinite(marginRatio) ? marginRatio : Infinity,
    marginRatioRaw: Number.isFinite(rawRatio) ? rawRatio : Infinity,
    policyLimit: QI_POLICY_ENFORCE ? policyMaxZeta : undefined,
    window_ms: pattern.window_ms,
    sampler,
    fieldType: String(fieldType ?? "em"),
    samples: pattern.window.length,
    duty,
    patternDuty,
    maskSum,
    effectiveRho,
    rhoOn,
    rhoSource: rhoDebug.source,
    rhoNote,
    sumWindowDt,
    rhoOnDuty: rhoSourceIsDutyFallback(rhoDebug) ? rhoOn * duty : undefined,
    curvatureRadius_m: curvatureInfo.radius_m,
    curvatureRatio,
    curvatureOk,
    curvatureSource: curvatureInfo.source,
    curvatureNote,
    curvatureEnforced,
    applicabilityStatus,
    applicabilityReasonCode,
    strictMode,
    metricContractOk,
    metricDerived,
    metricDerivedSource,
    metricDerivedReason,
    metricDerivedChart,
  };
}

function deriveQiLaplaceRungeLenz(state: EnergyPipelineState, stats: QiStats) {
  const position: Vec3 = [
    finiteNumber(stats.avg),
    finiteNumber(stats.bound),
    finiteNumber(stats.margin),
  ];
  const now = Date.now();
  const last = qiLrlHistory.lastPosition;
  const dtSeconds =
    last && qiLrlHistory.lastTimestamp
      ? Math.max((now - qiLrlHistory.lastTimestamp) / 1000, 1e-3)
      : null;
  const velocity: Vec3 =
    last && dtSeconds
      ? [
          (position[0] - last[0]) / dtSeconds,
          (position[1] - last[1]) / dtSeconds,
          (position[2] - last[2]) / dtSeconds,
        ]
      : [0, 0, 0];

  qiLrlHistory.lastPosition = position;
  qiLrlHistory.lastTimestamp = now;

  const mass = positiveOrFallback(state.M_exotic ?? state.exoticMassTarget_kg ?? 1, 1);
  const centralMass = positiveOrFallback(state.exoticMassTarget_kg ?? mass, mass);

  const result = computeLaplaceRungeLenz({
    position,
    velocity,
    mass,
    centralMass,
  });

  if (!Number.isFinite(result.eccentricity) || !Number.isFinite(result.periapsisAngle)) {
    return null;
  }

  const lrlVector: [number, number, number] = [
    result.vector[0],
    result.vector[1],
    result.vector[2],
  ];

  return {
    eccentricity: result.eccentricity,
    periapsisAngle: result.periapsisAngle,
    lrlVector,
    lrlMagnitude: result.magnitude,
    lrlActionRate: result.actionRate,
    lrlOscillatorCoordinate: result.oscillatorCoordinate,
    lrlOscillatorVelocity: result.oscillatorVelocity,
    lrlOscillatorEnergy: result.oscillatorEnergy,
    lrlPlanarResidual: result.planarResidual,
    lrlGeometryResidual: result.geometryResidual,
  };
}

function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function positiveOrFallback(value: unknown, fallback = 1, min = 1e-6, max = 1e12): number {
  const raw = Number(value);
  const n = Number.isFinite(raw) ? Math.abs(raw) : NaN;
  if (!Number.isFinite(n) || n < min) {
    return fallback;
  }
  if (n > max) {
    return max;
  }
  return n;
}

function desiredQiSampleDt(state: EnergyPipelineState): number {
  const sectorPeriod =
    Number(state.phaseSchedule?.sectorPeriod_ms ?? state.sectorPeriod_ms) || DEFAULT_SECTOR_PERIOD_MS;
  const sectors = Math.max(1, Math.floor(state.phaseSchedule?.N ?? state.sectorCount ?? DEFAULT_SECTORS_TOTAL));
  const concurrent = Math.max(1, Math.floor(state.concurrentSectors ?? state.sectorStrobing ?? 1));
  const dwellPerSample = sectorPeriod / Math.max(1, sectors / concurrent);
  return clampNumber(dwellPerSample, 0.25, 10);
}

function reconfigureQiMonitor(tauMs: number, dtMs: number, fieldType?: QiFieldType): void {
  const clampedTau = Math.max(0.5, tauMs);
  const clampedDt = clampNumber(dtMs, 0.25, 10);
  const tauChanged = Math.abs(clampedTau - qiMonitorTau_ms) > 1e-3;
  const dtChanged = Math.abs(clampedDt - qiMonitorDt_ms) > 1e-3;
  const next: Partial<QiSettings> & { dt_ms?: number } = { tau_s_ms: clampedTau, dt_ms: clampedDt };
  if (fieldType) next.fieldType = fieldType;
  if (!tauChanged && !dtChanged && !fieldType) return;
  qiMonitor.reconfigure(next);
  qiMonitorTau_ms = clampedTau;
  qiMonitorDt_ms = clampedDt;
  qiSampleAccumulator_ms = 0;
  qiSampleLastTs = Date.now();
  lastQiStats = null;
}

function advanceQiMonitor(effectiveRho: number): QiStats {
  const now = Date.now();
  qiSampleAccumulator_ms += now - qiSampleLastTs;
  qiSampleLastTs = now;
  let steps =
    qiMonitorDt_ms > 0 ? Math.floor(qiSampleAccumulator_ms / qiMonitorDt_ms) : 0;
  steps = Math.max(1, steps);
  let latest: QiStats | null = null;
  for (let i = 0; i < steps; i += 1) {
    latest = qiMonitor.tick(effectiveRho);
    if (qiMonitorDt_ms > 0 && qiSampleAccumulator_ms >= qiMonitorDt_ms) {
      qiSampleAccumulator_ms -= qiMonitorDt_ms;
    }
  }
  qiSampleAccumulator_ms = clampNumber(
    qiSampleAccumulator_ms,
    0,
    qiMonitorDt_ms * 8,
  );
  if (!latest && lastQiStats) {
    return lastQiStats;
  }
  lastQiStats = latest;
  return latest ?? qiMonitor.tick(effectiveRho);
}

// Mode switching function
export async function switchMode(
  state: EnergyPipelineState,
  newMode: EnergyPipelineState['currentMode'],
  opts: PipelineRunOptions = {},
): Promise<EnergyPipelineState> {
  state.currentMode = newMode;
  return await calculateEnergyPipeline(state, opts);
}

// Parameter update function
export async function updateParameters(
  state: EnergyPipelineState,
  params: Partial<EnergyPipelineState>,
  opts: PipelineRunOptions = {},
): Promise<EnergyPipelineState> {
  const nextParams: Partial<EnergyPipelineState> = { ...params };
  const clampPulseCap = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? (n as number) : fallback;
  };

  if (nextParams.dynamicConfig) {
    const incoming = nextParams.dynamicConfig as MutableDynamicConfig;
    const current = state.dynamicConfig ?? {};
    const nextDynamic: MutableDynamicConfig = {
      ...current,
      ...incoming,
    };
    if (incoming.sweep || current.sweep) {
      nextDynamic.sweep = {
        ...(current.sweep ?? {}),
        ...(incoming.sweep ?? {}),
      };
    }
    state.dynamicConfig = nextDynamic;
    delete (nextParams as any).dynamicConfig;
  }

  if (typeof nextParams.negativeFraction === "number" && Number.isFinite(nextParams.negativeFraction)) {
    nextParams.negativeFraction = Math.max(0, Math.min(1, nextParams.negativeFraction));
  }

  if ("iPeakMaxMidi_A" in nextParams) {
    nextParams.iPeakMaxMidi_A = clampPulseCap(
      nextParams.iPeakMaxMidi_A,
      state.iPeakMaxMidi_A ?? DEFAULT_PULSED_CURRENT_LIMITS_A.midi,
    );
  }
  if ("iPeakMaxSector_A" in nextParams) {
    nextParams.iPeakMaxSector_A = clampPulseCap(
      nextParams.iPeakMaxSector_A,
      state.iPeakMaxSector_A ?? DEFAULT_PULSED_CURRENT_LIMITS_A.sector,
    );
  }
  if ("iPeakMaxLauncher_A" in nextParams) {
    nextParams.iPeakMaxLauncher_A = clampPulseCap(
      nextParams.iPeakMaxLauncher_A,
      state.iPeakMaxLauncher_A ?? DEFAULT_PULSED_CURRENT_LIMITS_A.launcher,
    );
  }

  Object.assign(state, nextParams);
  return await calculateEnergyPipeline(state, opts);
}

// Export current pipeline state for external access
let globalPipelineState = initializePipelineState();

export function getGlobalPipelineState(): EnergyPipelineState {
  return globalPipelineState;
}

export function setGlobalPipelineState(state: EnergyPipelineState): void {
  globalPipelineState = state;
}

// Helper functions for normalization
function finite(n: any){ const x = +n; return Number.isFinite(x) ? x : undefined; }
function arrN(a:any, k:number){ return (Array.isArray(a) && a.length>=k) ? a : undefined; }

/**
 * Compute energy snapshot for unified client consumption
 * Calls the central pipeline and merges outputs into shared snapshot
 */
export async function computeEnergySnapshot(sim: any) {
  const ampFactorsInput = (sim as any)?.ampFactors ?? sim.amps ?? {};
  const resolvePulseCap = (value: unknown, fallback: number): number =>
    Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
  // Convert sim to pipeline state format
  const state = {
    ...initializePipelineState(),
    gap_nm: sim.gap ?? 1,
    sag_nm: sim.sagDepth ?? 16,
    temperature_K: sim.temperature ?? 20,
    modulationFreq_GHz: sim.dynamicConfig?.modulationFreqGHz ?? DEFAULT_MODULATION_FREQ_GHZ,
    currentMode: sim.mode ?? 'hover',
    massMode: (sim as any)?.massMode ?? sim.massMode,
    gammaGeo: ampFactorsInput?.gammaGeo ?? 26,
    qMechanical: ampFactorsInput?.qMechanical ?? 1,
    qCavity: sim.dynamicConfig?.cavityQ ?? ampFactorsInput?.qCavity ?? 1e9,
    gammaVanDenBroeck: ampFactorsInput?.gammaVanDenBroeck ?? 3.83e1,
    qSpoilingFactor: ampFactorsInput?.qSpoilingFactor ?? 1,
    dutyCycle: sim.dynamicConfig?.dutyCycle ?? 0.14,
    sectorCount: sim.dynamicConfig?.sectorCount ?? 400,
    exoticMassTarget_kg: sim.exoticMassTarget_kg ?? 1405,
    warpFieldType: sim.dynamicConfig?.warpFieldType ?? (sim as any)?.warpFieldType ?? 'natario',
    warpGeometry: (sim as any)?.warpGeometry ?? sim.dynamicConfig?.warpGeometry ?? null,
    warpGeometryKind: (sim as any)?.warpGeometryKind ?? (sim as any)?.warpGeometry?.kind,
    warpGeometryAssetId: (sim as any)?.warpGeometryAssetId ?? (sim as any)?.warpGeometry?.assetId,
    dynamicConfig: sim.dynamicConfig ?? null,
    experimental: (sim as any)?.experimental ?? sim.experimental,
    iPeakMaxMidi_A: resolvePulseCap(sim.iPeakMaxMidi_A, DEFAULT_PULSED_CURRENT_LIMITS_A.midi),
    iPeakMaxSector_A: resolvePulseCap(sim.iPeakMaxSector_A, DEFAULT_PULSED_CURRENT_LIMITS_A.sector),
    iPeakMaxLauncher_A: resolvePulseCap(sim.iPeakMaxLauncher_A, DEFAULT_PULSED_CURRENT_LIMITS_A.launcher),
  } as EnergyPipelineState;

  const ampFactorsSnapshot: AmpFactors = {
    gammaGeo: state.gammaGeo,
    gammaVanDenBroeck: state.gammaVanDenBroeck,
    qSpoilingFactor: state.qSpoilingFactor,
    qMechanical: state.qMechanical,
    qCavity: state.qCavity,
    measuredGammaGeo: ampFactorsInput?.measuredGammaGeo,
    measuredGammaVanDenBroeck: ampFactorsInput?.measuredGammaVanDenBroeck,
    measuredQSpoilingFactor: ampFactorsInput?.measuredQSpoilingFactor,
    measuredQMechanical: ampFactorsInput?.measuredQMechanical,
    measuredCavityQ: ampFactorsInput?.measuredCavityQ,
  };
  state.ampFactors = ampFactorsSnapshot;
  (state as any).amps = ampFactorsSnapshot; // legacy alias

  // Run the unified pipeline calculation
  const result = await calculateEnergyPipeline(state);

  // ---- Normalize LightG├ç├┤Crossing payload for the client API -------------------
  const lcSrc = (result.lc ?? result.lightCrossing ?? {}) as any;
  const lc = {
    tauLC_ms:   finite(lcSrc.tauLC_ms ?? lcSrc.tau_ms ?? (lcSrc.tau_us!=null ? lcSrc.tau_us/1000 : undefined)),
    dwell_ms:   finite(lcSrc.dwell_ms ?? (lcSrc.dwell_us!=null ? lcSrc.dwell_us/1000 : lcSrc.dwell_ms)),
    burst_ms:   finite(lcSrc.burst_ms ?? (lcSrc.burst_us!=null ? lcSrc.burst_us/1000 : lcSrc.burst_ms)),
    phase:      finite(lcSrc.phase),
    onWindow:   !!lcSrc.onWindow,
    sectorIdx:  Number.isFinite(+lcSrc.sectorIdx) ? Math.floor(+lcSrc.sectorIdx) : undefined,
    sectorCount:Number.isFinite(+result.sectorCount) ? Math.floor(+result.sectorCount) : undefined,
  };

  // ---- Duty (renderer authority) by mode; keep explicit fields too ----------
  // Trust the pipeline's FR duty (ship-wide, sector-averaged)
  const dutyEffectiveFR = result.dutyEffective_FR ?? result.dutyShip ?? (result as any).dutyEff ?? 2.5e-5;

  const duty = {
    dutyUsed:        finite(result.dutyUsed),
    dutyEffectiveFR: finite(dutyEffectiveFR),
    dutyFR_slice:    finite(result.dutyFR_slice),
    dutyFR_ship:     finite(result.dutyFR_ship),
  };

  // ---- Nat+├¡rio tensors (kept under natario.*; adapter also accepts top-level)
  const natario = {
    metricMode:  !!(result.natario?.metricMode),
    lapseN:      finite(result.natario?.lapseN),
    shiftBeta:   arrN(result.natario?.shiftBeta, 3),
    gSpatialDiag:arrN(result.natario?.gSpatialDiag, 3),
    gSpatialSym: arrN(result.natario?.gSpatialSym, 6),
    viewForward: arrN(result.natario?.viewForward, 3),
    g0i:         arrN(result.natario?.g0i, 3),
  // pass-through diagnostics from Nat+├¡rio (unit-annotated upstream)
  dutyFactor:      finite(result.natario?.dutyFactor),       // unitless (++s/++s)
  // NOTE: natario.thetaScaleCore_sqrtDuty is the explicit Nat+├¡rio sqrt-duty
  // diagnostic (G├¬├£duty semantics). Prefer `_sqrtDuty` when inspecting Nat+├¡rio
  // outputs; it intentionally excludes +┬ª_VdB and is NOT the canonical ship-wide
  // theta used by engines (engines should use `thetaScale` / `thetaScaleExpected`).
  // Keep the legacy `thetaScaleCore` key for back-compat but mark it deprecated
  // here by mapping it from the `_sqrtDuty` alias when present.
  thetaScaleCore_sqrtDuty: finite((result as any).natario?.thetaScaleCore_sqrtDuty ?? (result as any).natario?.thetaScaleCore),
  /* @deprecated legacy key; prefer thetaScaleCore_sqrtDuty */
  thetaScaleCore: finite((result as any).natario?.thetaScaleCore ?? (result as any).natario?.thetaScaleCore_sqrtDuty),
  metricSource: typeof (result as any).natario?.stressEnergySource === "string"
    ? String((result as any).natario.stressEnergySource)
    : undefined,
  metricT00: finite((result as any).natario?.metricT00),
  metricT00Source: typeof (result as any).natario?.metricT00Source === "string"
    ? String((result as any).natario.metricT00Source)
    : undefined,
  metricT00Ref: typeof (result as any).natario?.metricT00Ref === "string"
    ? String((result as any).natario.metricT00Ref)
    : undefined,
  metricT00Observer: typeof (result as any).natario?.metricT00Observer === "string"
    ? String((result as any).natario.metricT00Observer)
    : undefined,
  metricT00Normalization: typeof (result as any).natario?.metricT00Normalization === "string"
    ? String((result as any).natario.metricT00Normalization)
    : undefined,
  metricT00UnitSystem: typeof (result as any).natario?.metricT00UnitSystem === "string"
    ? String((result as any).natario.metricT00UnitSystem)
    : undefined,
  metricT00ContractStatus: typeof (result as any).natario?.metricT00ContractStatus === "string"
    ? String((result as any).natario.metricT00ContractStatus)
    : undefined,
  metricT00ContractReason: typeof (result as any).natario?.metricT00ContractReason === "string"
    ? String((result as any).natario.metricT00ContractReason)
    : undefined,
  metricT00Derivation: typeof (result as any).natario?.metricT00Derivation === "string"
    ? String((result as any).natario.metricT00Derivation)
    : undefined,
  chartLabel: typeof (result as any).natario?.chartLabel === "string"
    ? String((result as any).natario.chartLabel)
    : undefined,
  chartDtGammaPolicy: typeof (result as any).natario?.chartDtGammaPolicy === "string"
    ? String((result as any).natario.chartDtGammaPolicy)
    : undefined,
  chartContractStatus: typeof (result as any).natario?.chartContractStatus === "string"
    ? String((result as any).natario.chartContractStatus)
    : undefined,
  stressEnergyTensor: {
    T00: finite((result as any).natario?.stressEnergyTensor?.T00),
    T11: finite((result as any).natario?.stressEnergyTensor?.T11),
    T22: finite((result as any).natario?.stressEnergyTensor?.T22),
    T33: finite((result as any).natario?.stressEnergyTensor?.T33),
  },
  };

  // --- Compatibility aliases: accept alternate server keys and provide both forms ---
  // Some older code emits dutyEffective_FR or nests light-crossing under `lc`.
  const compat = {} as any;
  // dutyEffective_FR -> dutyEffectiveFR
  if ((result as any).dutyEffective_FR != null && (result as any).dutyEffectiveFR == null) {
    compat.dutyEffectiveFR = finite((result as any).dutyEffective_FR);
  }
  // lightCrossing vs lc
  if ((result as any).lightCrossing == null && (result as any).lc != null) {
    compat.lightCrossing = (result as any).lc;
  }
  // natario may be missing in some shapes; ensure it exists
  if ((result as any).natario == null) {
    compat.natario = {};
  }

  // Merge compat back into result for downstream consumers
  const normalizedResult = { ...(result as any), lc, duty, natario, ...compat } as any;

  // Ensure warp.stressEnergyTensor is always populated (fallback to root stressEnergy)
  const warpStress = (result as any).warp?.stressEnergyTensor ?? (result as any).stressEnergy;
  const warpOut = {
    ...(result as any).warp,
    ...(warpStress ? { stressEnergyTensor: warpStress } : {}),
  };

  const warpUniforms = {
    // physics (visual) G├ç├╢ mass stays split and separate
    gammaGeo: result.gammaGeo,
    qSpoilingFactor: result.qSpoilingFactor,
    gammaVanDenBroeck: (result as any).gammaVanDenBroeck_vis,   // visual gamma
    gammaVanDenBroeck_vis: (result as any).gammaVanDenBroeck_vis,
    gammaVanDenBroeck_mass: (result as any).gammaVanDenBroeck_mass,
      chi_coupling: result.couplingChi,

    // FordG├ç├┤Roman duty (ship-wide, sector-averaged)
    dutyEffectiveFR,

    // UI label fields (harmless to include)
    dutyCycle: result.dutyCycle,
    sectorCount: result.sectorCount,
    sectors: result.concurrentSectors,   // concurrent/live
    currentMode: result.currentMode,

    // viewer defaults G├ç├╢ visual policy only; parity/ridge set client-side
    viewAvg: true,
    colorMode: 'theta',

    // optional: hull/wall for overlays
    hull: result.hull,
    wallWidth_m: result.hull?.wallThickness_m ?? DEFAULT_WALL_THICKNESS_M,

    // meta
    __src: 'server',
    __version: Number((result as any)?.seq ?? Date.now()),
  };

  // PATCH START: uniformsExplain debug metadata for /bridge
  const gammaGeoSource = (result as any).gammaGeoSource ?? "design";
  const gammaVdBSource = (result as any).gammaVanDenBroeckSource ?? "design";
  const qSpoilSource = (result as any).qSpoilingFactorSource ?? "policy";
  const qCavitySource = (result as any).qCavitySource ?? "design";
  const modulationSource = (result as any).modulationFreqSource ?? "design";
  const dutyCycleSource = (result as any).dutyCycleSource ?? "policy";
  const sectorCountSource = (result as any).sectorCountSource ?? "design";
  const dutyEffectiveSource =
    (result as any).sectorDutySource ??
    (result as any).dutyEffectiveFRSource ??
    "schedule";
  const uniformsExplain = {
    // Human-readable G├ç┬úwhere did this come from?G├ç┬Ñ pointers
    sources: {
      gammaGeo:               `server.result.gammaGeo (${gammaGeoSource})`,
      qSpoilingFactor:        `server.result.qSpoilingFactor (${qSpoilSource})`,
      qCavity:                `server.result.qCavity (${qCavitySource})`,
      modulationFreq_GHz:     `server.result.modulationFreq_GHz (${modulationSource})`,
      gammaVanDenBroeck_vis:  "server.(gammaVanDenBroeck_vis) G├ç├╢ fixed visual seed unless standby",
      gammaVanDenBroeck_mass: `server.(gammaVanDenBroeck_mass) (${gammaVdBSource})`,
      dutyEffectiveFR:        `server.derived (${dutyEffectiveSource})`,
      dutyCycle:              `server.result.dutyCycle (${dutyCycleSource})`,
      sectorCount:            `server.result.sectorCount (${sectorCountSource})`,
      sectors:                "server.result.concurrentSectors (live concurrent sectors)",
      currentMode:            "server.result.currentMode (authoritative)",
      hull:                   "server.result.hull (Lx,Ly,Lz,wallThickness_m)",
      wallWidth_m:            "server.result.hull.wallThickness_m",
      viewAvg:                "policy: true (clients render FR-averaged ++ by default)",
    },

    // FordG├ç├┤Roman duty derivation (numbers)
    fordRomanDuty: {
      formula: "d_eff = measuredDuty || (dutyBurst * S_live / S_total)",
      burstLocal: result.dutyBurst ?? PAPER_DUTY.BURST_DUTY_LOCAL,
      S_total: result.sectorCount,
      S_live: result.concurrentSectors,
      measured_d_eff: result.dutyMeasuredFR,
      computed_d_eff: dutyEffectiveFR,
      duty_source: (result as any)?.dutyEffectiveFRSource ?? ((result as any)?.dutyMeasuredFR != null ? "measured" : "schedule"),
      window_ms: (result as any)?.dutyMeasuredWindow_ms,
    },

    // ++ audit + the inputs used to compute it (for transparency)
    thetaAudit: {
      note: "++ audit - raw vs pipeline VdB (targeting optional)",
      equation: "++ = +┬ª_geo^3 -+ q -+ +┬ª_VdB -+ d_eff",
      mode: (result as any).modelMode ?? MODEL_MODE, // "raw" | "calibrated"
      massMode: (result as any).massMode ?? DEFAULT_MASS_MODE,
      inputs: {
        gammaGeo: result.gammaGeo,
        q: result.qSpoilingFactor,
        d_eff: dutyEffectiveFR,
        gammaVdB_raw: PAPER_VDB.GAMMA_VDB,
        gammaVdB_cal: (result as any).gammaVanDenBroeck_mass ?? (result as any).gammaVanDenBroeck_vis,
      },
      results: {
        thetaRaw: (result as any).thetaRaw,
        thetaCal: (result as any).thetaCal,
        thetaScaleExpected: (result as any).thetaScaleExpected, // same as thetaCal
        ratio_raw_vs_cal: ((result as any).thetaRaw || 0) / Math.max(1e-12, (result as any).thetaCal || 1e-12),
        gammaVdB_ratio: PAPER_VDB.GAMMA_VDB / Math.max(1e-12, (result as any).gammaVanDenBroeck_mass ?? (result as any).gammaVanDenBroeck_vis ?? 1e-12)
      }
    },

    // Live numeric values the cards can render directly
  live: {
      // sectors / duty
      S_total: result.sectorCount,
      S_live: result.concurrentSectors,
      dutyCycle: result.dutyCycle,
  // dutyEffectiveFR is included in thetaAudit.inputs and elsewhere; omit duplicate here to avoid overwrites

      // amp factors and Q
      gammaGeo: result.gammaGeo,
      qSpoilingFactor: result.qSpoilingFactor,
      qCavity: result.qCavity,
      gammaVanDenBroeck_vis: (result as any).gammaVanDenBroeck_vis,
      gammaVanDenBroeck_mass: (result as any).gammaVanDenBroeck_mass,

      // census + power
      N_tiles: result.N_tiles,
      tilesPerSector: result.tilesPerSector,
      activeTiles: result.activeTiles,
      P_avg_W: (result as any).P_avg_W,
      P_avg_MW: result.P_avg,

      // safety
      zeta: result.zeta,
      TS_ratio: result.TS_ratio,
      ts_metric_derived: (result as any).tsMetricDerived === true,
      strict_congruence: strictCongruenceEnabled(),
    },

    // Base equations (render these + a line below with the live values)
    equations: {
      d_eff: "d_eff = burstLocal -+ S_live / S_total",
      theta_expected: "++_expected = +┬ª_geo^3 -+ q -+ +┬ª_VdB(vis) -+ G├¬├£d_eff",
      U_static: "U_static = chi_coupling * [-pi^2 * hbar * c/(720 * a^3)] * A_tile",
      U_geo: "U_geo = +┬ª_geo^3 -+ U_static",
      U_Q: "U_Q = q_mech -+ U_geo",
      P_avg: "P_avg = |U_Q| -+ -├½ / Q -+ N_tiles -+ d_eff",
      M_exotic: "M = [U_static -+ +┬ª_geo^3 -+ Q_burst -+ +┬ª_VdB -+ d_eff] -+ N_tiles / c-┬ª",
      TS_long: "TS_long = (L_long / c) / (1/f_m)",
    },
  };
  // PATCH END


  // Expose to clients (names match what adapters expect)
  return {
    // Core pipeline state
    ...result,
    warpUniforms,
    // PATCH START: add uniformsExplain to client payload
    uniformsExplain,
    // PATCH END

    // Amplification parameters 
    gammaGeo: result.gammaGeo,
    gammaVanDenBroeck: result.gammaVanDenBroeck,
    gammaVanDenBroeck_vis: (result as any).gammaVanDenBroeck_vis,
    gammaVanDenBroeck_mass: (result as any).gammaVanDenBroeck_mass,
    thetaScaleExpected: (result as any).thetaScaleExpected,
    // Dual-value theta audit
    thetaRaw: (result as any).thetaRaw,
    thetaCal: (result as any).thetaCal,
    modelMode: (result as any).modelMode,
    massMode: (result as any).massMode,
    qCavity: result.qCavity,
    qSpoilingFactor: result.qSpoilingFactor,

  // Strobing parameters
  dutyCycle: result.dutyCycle,
  sectorStrobing: result.sectorStrobing,

    // Nat+├¡rio / stress-energy surface (time-averaged)
    T00_avg: (result as any).warp?.stressEnergyTensor?.T00 ?? (result as any).stressEnergy?.T00,
    T11_avg: (result as any).warp?.stressEnergyTensor?.T11 ?? (result as any).stressEnergy?.T11,
    T22_avg: (result as any).warp?.stressEnergyTensor?.T22 ?? (result as any).stressEnergy?.T22,
    T33_avg: (result as any).warp?.stressEnergyTensor?.T33 ?? (result as any).stressEnergy?.T33,
    // Explicit stress-energy projection for clients that only read root fields
    stressEnergy: {
      ...(result as any).stressEnergy,
      ...(result as any).warp?.stressEnergyTensor
        ? {
            T00: (result as any).warp.stressEnergyTensor.T00,
            T11: (result as any).warp.stressEnergyTensor.T11,
            T22: (result as any).warp.stressEnergyTensor.T22,
            T33: (result as any).warp.stressEnergyTensor.T33,
          }
        : {},
    },
    beta_avg: (result as any).warp?.betaAvg ?? (result as any).warp?.natarioShiftAmplitude ?? (result as any).stressEnergy?.beta_avg,
    gr_ok: (result as any).warp?.validationSummary?.warpFieldStable ?? true,
    natarioConstraint: (result as any).warp?.isZeroExpansion ?? result.natarioConstraint,

    // Diagnostics
    warpModule: (result as any).warp ? {
      timeMs: (result as any).warp.calculationTime ?? 0,
      status: (result as any).warp.validationSummary?.overallStatus ?? 'optimal'
    } : { timeMs: 0, status: 'optimal' },
    // Ensure warp tensor emitted for clients
    warp: warpOut,

    // Normalized, renderer-ready data structures
    lc,
    natario,
    // Duty authority (adapter selects by mode; renderer never fabricates)
    ...duty,
    // For adapter mode selection & viewers
    mode: sim.mode ?? result.currentMode ?? 'hover',
    strictCongruence: strictCongruenceEnabled(),
  };
}

/**
 * Sample the Nat+├¡rio bell displacement on an ellipsoidal shell using the same math as the renderer.
 * Returns ~ nTheta*nPhi points, suitable for JSON compare or CSV export.
 */
/**
 * Sample the Nat+├¡rio bell displacement on an ellipsoidal shell using the same math as the renderer.
 * Returns typed buffers suitable for JSON compare or CSV export without allocating per-sample objects.
 */
export function sampleDisplacementField(state: EnergyPipelineState, req: FieldRequest = {}): FieldSampleBuffer {
  // Hull geometry: convert from Needle Hull format to ellipsoid axes
  const hullGeom = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 }; // fallback only
  const a = hullGeom.Lx_m / 2;  // Semi-axis X (length/2)
  const b = hullGeom.Ly_m / 2;  // Semi-axis Y (width/2)
  const c = hullGeom.Lz_m / 2;  // Semi-axis Z (height/2)
  const axes: HullAxes = { a, b, c };

  const nTheta = Math.max(1, req.nTheta ?? 64);
  const nPhi   = Math.max(2, req.nPhi ?? 32); // need G├½├æ2 to avoid (nPhi-1)=0
  const sectors = Math.max(1, Math.floor(req.sectors ?? state.sectorCount ?? TOTAL_SECTORS));
  const split   = Number.isFinite(req.split as number) ? Math.max(0, Math.floor(req.split!)) : Math.floor(sectors / 2);

  const totalSamples = nTheta * nPhi;
  ensureFieldSampleCapacity(totalSamples);

  // Canonical bell width in *ellipsoidal* radius units: w-├╝ = w_m / a_eff.
  // Use harmonic-mean effective radius to match viewer/renderer -├╝-units.
  const aEff = 3 / (1/axes.a + 1/axes.b + 1/axes.c);  // G┬ú├á harmonic mean (matches viewer)
  const w_m = req.wallWidth_m ?? Math.max(1e-6, (state.sag_nm ?? 16) * 1e-9); // meters
  const w_rho = Math.max(1e-6, w_m / aEff);

  // Match renderer's gain chain (display-focused): disp ~ +┬ª_geo^3 * q_spoil * bell * sgn
  const gammaGeo   = state.gammaGeo ?? 26;
  const qSpoil     = state.qSpoilingFactor ?? 1;
  const geoAmp     = Math.pow(gammaGeo, 3);               // *** cubic, same as pipeline ***
  const vizGain    = 1.0;                                 // keep physics-scale here; renderer may apply extra gain

  let idx = 0;

  for (let i = 0; i < nTheta; i++) {
    const theta = (i / nTheta) * 2 * Math.PI;      // [--├ç, -├ç] ring index
    // --- Smooth sector strobing (matches renderer exactly) ---
    const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
    const sectorIdx = Math.floor(u * sectors);
    const distToSplit = (sectorIdx - split + 0.5);
    const strobeWidth = 0.75;                 // same as renderer
    const softSign = (x: number) => Math.tanh(x); // smooth -┬ª1 transition
    const sgn = softSign(-distToSplit / strobeWidth); // smooth sector sign

    for (let j = 0; j < nPhi; j++) {
      const phi = -Math.PI / 2 + (j / (nPhi - 1)) * Math.PI; // [--├ç/2, -├ç/2]
      const onShell: [number, number, number] = [
        axes.a * Math.cos(phi) * Math.cos(theta),
        axes.b * Math.sin(phi),
        axes.c * Math.cos(phi) * Math.sin(theta),
      ];

      const n = nEllipsoid(onShell, axes);
      const p: [number, number, number] = [
        onShell[0] + (req.shellOffset ?? 0) * n[0],
        onShell[1] + (req.shellOffset ?? 0) * n[1],
        onShell[2] + (req.shellOffset ?? 0) * n[2],
      ];

      const rho = rhoEllipsoid(p, axes);
      const sd  = rho - 1.0;

      // --- Soft wall envelope (removes hard band cutoff) ---
      const asd = Math.abs(sd);
      const a_band = 2.5 * w_rho, b_band = 3.5 * w_rho; // pass band, stop band
      let wallWin: number;
      if (asd <= a_band) wallWin = 1.0;
      else if (asd >= b_band) wallWin = 0.0;
      else wallWin = 0.5 * (1 + Math.cos(Math.PI * (asd - a_band) / (b_band - a_band))); // smooth to 0

      const bell = Math.exp(- (sd / w_rho) * (sd / w_rho)); // Nat+├¡rio canonical bell

      // --- Soft front/back polarity (if needed) ---
      const front = 1.0; // placeholder - can add soft polarity later if needed

      // --- Physics-consistent amplitude with soft clamp ---
      let disp = vizGain * geoAmp * qSpoil * wallWin * bell * sgn * front;

      const maxPush = 0.10;
      const softness = 0.6;
      disp = maxPush * Math.tanh(disp / (softness * maxPush));

      const { dA } = firstFundamentalForm(axes.a, axes.b, axes.c, theta, phi);

      sampleX[idx] = p[0];
      sampleY[idx] = p[1];
      sampleZ[idx] = p[2];
      sampleNX[idx] = n[0];
      sampleNY[idx] = n[1];
      sampleNZ[idx] = n[2];
      sampleRho[idx] = rho;
      sampleBell[idx] = bell;
      sampleSgn[idx] = sgn;
      sampleDisp[idx] = disp;
      sampleDA[idx] = dA;
      idx += 1;
    }
  }

  return {
    length: idx,
    x: sampleX.subarray(0, idx),
    y: sampleY.subarray(0, idx),
    z: sampleZ.subarray(0, idx),
    nx: sampleNX.subarray(0, idx),
    ny: sampleNY.subarray(0, idx),
    nz: sampleNZ.subarray(0, idx),
    rho: sampleRho.subarray(0, idx),
    bell: sampleBell.subarray(0, idx),
    sgn: sampleSgn.subarray(0, idx),
    disp: sampleDisp.subarray(0, idx),
    dA: sampleDA.subarray(0, idx),
  };
}

// Truth sampler that can operate on ellipsoid (legacy), radial profile, or explicit surface samples (SDF/meshes)
export function sampleDisplacementFieldGeometry(state: EnergyPipelineState, req: FieldGeometryRequest = {}): FieldSampleBuffer {
  const geometryKind = req.geometryKind ?? "ellipsoid";
  if (geometryKind === "ellipsoid" || (geometryKind !== "radial" && geometryKind !== "sdf")) {
    return sampleDisplacementField(state, req);
  }

  const hullGeom = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 };
  const a = hullGeom.Lx_m / 2;
  const b = hullGeom.Ly_m / 2;
  const c = hullGeom.Lz_m / 2;
  const axes: HullAxes = { a, b, c };

  const sectors = Math.max(1, Math.floor(req.sectors ?? state.sectorCount ?? TOTAL_SECTORS));
  const split = Number.isFinite(req.split as number) ? Math.max(0, Math.floor(req.split!)) : Math.floor(sectors / 2);

  const aEff = 3 / (1/axes.a + 1/axes.b + 1/axes.c);
  const w_m = req.wallWidth_m ?? Math.max(1e-6, (state.sag_nm ?? 16) * 1e-9);
  const w_rho = Math.max(1e-6, w_m / aEff);
  const gammaGeo   = state.gammaGeo ?? 26;
  const qSpoil     = state.qSpoilingFactor ?? 1;
  const geoAmp     = Math.pow(gammaGeo, 3);
  const vizGain    = 1.0;
  const shellOffset = req.shellOffset ?? 0;

  const radialReq = req.radial ?? {};
  const nTheta = Math.max(1, radialReq.nTheta ?? req.nTheta ?? 64);
  const nPhi   = Math.max(2, radialReq.nPhi ?? req.nPhi ?? 32);

  const sdfSamples = Array.isArray(req.sdf?.samples) ? req.sdf!.samples : [];
  const radialSamples = Array.isArray(radialReq.samples) ? radialReq.samples : null;
  const totalSamples = geometryKind === "sdf"
    ? sdfSamples.length
    : (radialSamples?.length ?? (nTheta * nPhi));

  ensureFieldSampleCapacity(Math.max(totalSamples, 0));
  let idx = 0;

  const emitSample = (pOn: [number, number, number], nInput: [number, number, number], dAInput?: number, signedDistance_m?: number) => {
    const n = normalizeVec(nInput);
    const p: [number, number, number] = [
      pOn[0] + shellOffset * n[0],
      pOn[1] + shellOffset * n[1],
      pOn[2] + shellOffset * n[2],
    ];
    const radius = vecLen(p);
    const rho = radius / Math.max(aEff, 1e-9);
    const sd_rho = (rho - 1) + ((signedDistance_m ?? 0) / Math.max(aEff, 1e-9));

    const asd = Math.abs(sd_rho);
    const a_band = 2.5 * w_rho, b_band = 3.5 * w_rho;
    let wallWin: number;
    if (asd <= a_band) wallWin = 1.0;
    else if (asd >= b_band) wallWin = 0.0;
    else wallWin = 0.5 * (1 + Math.cos(Math.PI * (asd - a_band) / (b_band - a_band)));

    const bell = Math.exp(- (sd_rho / w_rho) * (sd_rho / w_rho));

    const theta = Math.atan2(p[2], p[0]);
    const sgn = sectorSign(theta, sectors, split);
    let disp = vizGain * geoAmp * qSpoil * wallWin * bell * sgn;

    const maxPush = 0.10;
    const softness = 0.6;
    disp = maxPush * Math.tanh(disp / (softness * maxPush));

    const phi = Math.atan2(p[1], Math.hypot(p[0], p[2]));
    const dThetaApprox = (2 * Math.PI) / Math.max(1, sectors);
    const dPhiApprox = Math.PI / Math.max(1, nPhi - 1);
    const dA = Number.isFinite(dAInput as number) && (dAInput as number) > 0
      ? (dAInput as number)
      : Math.max(1e-12, radius * radius * Math.max(1e-3, Math.cos(phi)) * dThetaApprox * dPhiApprox);

    sampleX[idx] = p[0];
    sampleY[idx] = p[1];
    sampleZ[idx] = p[2];
    sampleNX[idx] = n[0];
    sampleNY[idx] = n[1];
    sampleNZ[idx] = n[2];
    sampleRho[idx] = rho;
    sampleBell[idx] = bell;
    sampleSgn[idx] = sgn;
    sampleDisp[idx] = disp;
    sampleDA[idx] = dA;
    idx += 1;
  };

  if (geometryKind === "sdf" && sdfSamples.length) {
    for (const s of sdfSamples) {
      const n = s.n ? normalizeVec(s.n) : normalizeVec(s.p);
      emitSample(s.p, n, s.dA, s.signedDistance_m);
    }
  } else if (geometryKind === "radial") {
    if (radialSamples && radialSamples.length) {
      for (const s of radialSamples) {
        const theta = Number.isFinite(s.theta) ? (s.theta as number) : 0;
        const phi = Number.isFinite(s.phi) ? (s.phi as number) : 0;
        const dir: [number, number, number] = [
          Math.cos(phi) * Math.cos(theta),
          Math.sin(phi),
          Math.cos(phi) * Math.sin(theta),
        ];
        const r = Number.isFinite(s.r) ? Math.max(1e-9, s.r) : Math.max(1e-9, aEff);
        const pOn: [number, number, number] = [dir[0] * r, dir[1] * r, dir[2] * r];
        emitSample(pOn, s.n ?? dir, s.dA);
      }
    } else {
      const dTheta = (2 * Math.PI) / Math.max(1, nTheta);
      const dPhi = Math.PI / Math.max(1, nPhi - 1);
      for (let i = 0; i < nTheta; i++) {
        const theta = (i / nTheta) * 2 * Math.PI;
        for (let j = 0; j < nPhi; j++) {
          const phi = -Math.PI / 2 + (j / Math.max(1, nPhi - 1)) * Math.PI;
          const dir: [number, number, number] = [
            Math.cos(phi) * Math.cos(theta),
            Math.sin(phi),
            Math.cos(phi) * Math.sin(theta),
          ];
          const evalRadius = radialReq.radiusAt ? radialReq.radiusAt(dir) : undefined;
          let r = typeof evalRadius === "number" ? evalRadius : (evalRadius as any)?.r;
          const nFromEval = (evalRadius as any)?.n;
          const dAOverride = (evalRadius as any)?.dA;
          if (!Number.isFinite(r)) r = aEff;
          const pOn: [number, number, number] = [dir[0] * r, dir[1] * r, dir[2] * r];
          const areaApprox = Math.max(1e-12, r * r * Math.max(1e-3, Math.cos(phi)) * dTheta * dPhi);
          emitSample(pOn, nFromEval ?? dir, Number.isFinite(dAOverride as number) ? (dAOverride as number) : areaApprox);
        }
      }
    }
  }

  return {
    length: idx,
    x: sampleX.subarray(0, idx),
    y: sampleY.subarray(0, idx),
    z: sampleZ.subarray(0, idx),
    nx: sampleNX.subarray(0, idx),
    ny: sampleNY.subarray(0, idx),
    nz: sampleNZ.subarray(0, idx),
    rho: sampleRho.subarray(0, idx),
    bell: sampleBell.subarray(0, idx),
    sgn: sampleSgn.subarray(0, idx),
    disp: sampleDisp.subarray(0, idx),
    dA: sampleDA.subarray(0, idx),
  };
}

export function fieldSamplesToCsv(buffer: FieldSampleBuffer): string {
  const header = ["x","y","z","nx","ny","nz","rho","bell","sgn","disp","dA"].join(",");
  const rows: string[] = new Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    rows[i] = [
      buffer.x[i], buffer.y[i], buffer.z[i],
      buffer.nx[i], buffer.ny[i], buffer.nz[i],
      buffer.rho[i], buffer.bell[i], buffer.sgn[i],
      buffer.disp[i], buffer.dA[i],
    ].join(",");
  }
  return [header, ...rows].join("\n");
}
