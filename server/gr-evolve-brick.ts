import { Buffer } from "node:buffer";
import { performance } from "node:perf_hooks";
import { getGlobalPipelineState } from "./energy-pipeline";
import type { Vec3 } from "./curvature-brick";
import {
  buildEvolutionBrick,
  runInitialDataSolve,
  runBssnEvolution,
  computeShiftStiffnessMetrics,
  type BoundaryParams,
  type FixupParams,
  type FixupStats,
  type GaugeParams,
  type ShiftStiffnessMetrics,
  type StencilParams,
  type BssnState,
  type StressEnergyFieldSet,
  type StressEnergyBuildOptions,
} from "./gr/evolution/index.js";
import { toGeometricTime, toSiTime, type GrUnitSystem } from "../shared/gr-units.js";
import type { GrPipelineDiagnostics } from "./energy-pipeline";
import type { WarpMetricAdapterSnapshot } from "../modules/warp/warp-metric-adapter.js";
import type { StressEnergyBrickParams, StressEnergyStats } from "./stress-energy-brick";

const SIXTEEN_PI = 16 * Math.PI;

export interface GrEvolveBrickParams {
  dims: [number, number, number];
  bounds?: { min: Vec3; max: Vec3 };
  time_s?: number;
  dt_s?: number;
  steps?: number;
  iterations?: number;
  tolerance?: number;
  koEps?: number;
  koTargets?: "gauge" | "all";
  shockMode?: "off" | "diagnostic" | "stabilize";
  advectScheme?: "centered" | "upwind1";
  useInitialData?: boolean;
  initialIterations?: number;
  initialTolerance?: number;
  gauge?: GaugeParams;
  stencils?: StencilParams;
  boundary?: BoundaryParams;
  fixups?: FixupParams;
  unitSystem?: GrUnitSystem;
  includeExtra?: boolean;
  includeMatter?: boolean;
  includeKij?: boolean;
  invariantWallFraction?: number;
  invariantBandFraction?: number;
  invariantSampleMax?: number;
  invariantPercentile?: number;
  initialState?: BssnState;
  matter?: StressEnergyFieldSet | null;
  sourceParams?: Partial<StressEnergyBrickParams>;
  sourceOptions?: StressEnergyBuildOptions;
}

export interface GrEvolveBrickChannel {
  data: Float32Array;
  min: number;
  max: number;
}

export interface GrEvolveBrickStats {
  steps: number;
  iterations: number;
  tolerance: number;
  cfl: number;
  H_rms: number;
  M_rms: number;
  thetaPeakAbs?: number;
  thetaGrowthPerStep?: number;
  rhoConstraint?: GrPipelineDiagnostics["constraints"]["H_constraint"];
  invariants?: GrInvariantStatsSet;
  dissipation?: {
    koEpsUsed: number;
    koTargets: "gauge" | "all";
  };
  advectScheme?: "centered" | "upwind1";
  stiffness?: ShiftStiffnessMetrics;
  fixups?: FixupStats;
  solverHealth?: GrSolverHealth;
  stressEnergy?: StressEnergyStats;
  perf?: GrEvolveBrickPerfStats;
}

export type GrSolverHealthStatus = "CERTIFIED" | "UNSTABLE" | "NOT_CERTIFIED";

export interface GrSolverHealth {
  status: GrSolverHealthStatus;
  reasons: string[];
  alphaClampFraction: number;
  kClampFraction: number;
  totalClampFraction: number;
  maxAlphaBeforeClamp: number;
  maxKBeforeClamp: number;
}

export type GrBrickMetaStatus = "CERTIFIED" | "NOT_CERTIFIED";

export interface GrBrickMeta {
  status: GrBrickMetaStatus;
  reasons: string[];
}

export interface GrEvolveBrickPerfStats {
  totalMs: number;
  evolveMs: number;
  brickMs: number;
  voxels: number;
  channelCount: number;
  bytesEstimate: number;
  msPerStep: number;
}

export interface GrInvariantStats {
  min: number;
  max: number;
  mean: number;
  p98: number;
  sampleCount: number;
  abs: boolean;
  wallFraction: number;
  bandFraction: number;
  threshold: number;
  bandMin: number;
  bandMax: number;
}

export interface GrInvariantStatsSet {
  kretschmann?: GrInvariantStats;
  ricci4?: GrInvariantStats;
}

export interface GrEvolveBrick {
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  bounds: { min: Vec3; max: Vec3 };
  voxelSize_m: Vec3;
  time_s: number;
  dt_s: number;
  channelOrder?: string[];
  channels: {
    alpha: GrEvolveBrickChannel;
    beta_x: GrEvolveBrickChannel;
    beta_y: GrEvolveBrickChannel;
    beta_z: GrEvolveBrickChannel;
    gamma_xx: GrEvolveBrickChannel;
    gamma_yy: GrEvolveBrickChannel;
    gamma_zz: GrEvolveBrickChannel;
    K_trace: GrEvolveBrickChannel;
    H_constraint: GrEvolveBrickChannel;
    M_constraint_x: GrEvolveBrickChannel;
    M_constraint_y: GrEvolveBrickChannel;
    M_constraint_z: GrEvolveBrickChannel;
    [key: string]: GrEvolveBrickChannel;
  };
  stats: GrEvolveBrickStats;
  meta?: GrBrickMeta;
}

export interface GrEvolveBrickResponseChannel {
  data: string;
  min: number;
  max: number;
}

export interface GrEvolveBrickResponse {
  kind: "gr-evolve-brick";
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  bounds: { min: Vec3; max: Vec3 };
  voxelSize_m: Vec3;
  time_s: number;
  dt_s: number;
  channelOrder?: string[];
  channels: {
    alpha: GrEvolveBrickResponseChannel;
    beta_x: GrEvolveBrickResponseChannel;
    beta_y: GrEvolveBrickResponseChannel;
    beta_z: GrEvolveBrickResponseChannel;
    gamma_xx: GrEvolveBrickResponseChannel;
    gamma_yy: GrEvolveBrickResponseChannel;
    gamma_zz: GrEvolveBrickResponseChannel;
    K_trace: GrEvolveBrickResponseChannel;
    H_constraint: GrEvolveBrickResponseChannel;
    M_constraint_x: GrEvolveBrickResponseChannel;
    M_constraint_y: GrEvolveBrickResponseChannel;
    M_constraint_z: GrEvolveBrickResponseChannel;
    [key: string]: GrEvolveBrickResponseChannel;
  };
  stats: GrEvolveBrickStats;
  meta?: GrBrickMeta;
}

export interface GrEvolveBrickBinaryHeader {
  kind: "gr-evolve-brick";
  version: 1;
  dims: [number, number, number];
  voxelBytes: number;
  format: "r32f";
  bounds: { min: Vec3; max: Vec3 };
  voxelSize_m: Vec3;
  time_s: number;
  dt_s: number;
  channelOrder: readonly string[];
  channels: Record<string, { min: number; max: number; bytes: number }>;
  stats: GrEvolveBrickStats;
  meta?: GrBrickMeta;
}

export type GrEvolveBrickBinaryPayload = {
  header: GrEvolveBrickBinaryHeader;
  buffers: Buffer[];
};

const GR_EVOLVE_CHANNEL_ORDER = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "gamma_xx",
  "gamma_yy",
  "gamma_zz",
  "K_trace",
  "g_tt",
  "clockRate_static",
  "theta",
  "det_gamma",
  "ricci3",
  "KijKij",
  "kretschmann",
  "weylI",
  "ricci4",
  "ricci2",
  "H_constraint",
  "M_constraint_x",
  "M_constraint_y",
  "M_constraint_z",
] as const;

const GR_EVOLVE_KIJ_CHANNELS = [
  "K_xx",
  "K_yy",
  "K_zz",
  "K_xy",
  "K_xz",
  "K_yz",
] as const;

const GR_EVOLVE_MATTER_CHANNELS = [
  "rho",
  "Sx",
  "Sy",
  "Sz",
  "S_xx",
  "S_yy",
  "S_zz",
  "S_xy",
  "S_xz",
  "S_yz",
] as const;

const FIXUP_CLAMP_FRACTION_MAX = 0.01;
const FIXUP_MAX_ALPHA_MULT = 2;
const FIXUP_MAX_K_MULT = 2;
const GR_CFL_MAX = 0.5;
const GR_CFL_MIN = 1e-6;
const INVARIANT_SAMPLE_MAX = 50_000;
const INVARIANT_P98 = 0.98;
const INVARIANT_WALL_FRACTION = 0.25;
const INVARIANT_BAND_FRACTION = 0.2;

const filterChannelOrder = (
  order: readonly string[],
  channels: Record<string, GrEvolveBrickChannel>,
): string[] => {
  const filtered: string[] = [];
  const seen = new Set<string>();
  for (const key of order) {
    if (!channels[key]) continue;
    filtered.push(key);
    seen.add(key);
  }
  for (const key of Object.keys(channels)) {
    if (seen.has(key)) continue;
    filtered.push(key);
    seen.add(key);
  }
  return filtered;
};

const defaultHullBounds = () => {
  const state = getGlobalPipelineState();
  const hull = state?.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };
  const min: Vec3 = [-hull.Lx_m / 2, -hull.Ly_m / 2, -hull.Lz_m / 2];
  const max: Vec3 = [hull.Lx_m / 2, hull.Ly_m / 2, hull.Lz_m / 2];
  return { min, max };
};

const resolveVoxelSize = (
  dims: [number, number, number],
  bounds: { min: Vec3; max: Vec3 },
): Vec3 => [
  (bounds.max[0] - bounds.min[0]) / Math.max(1, dims[0]),
  (bounds.max[1] - bounds.min[1]) / Math.max(1, dims[1]),
  (bounds.max[2] - bounds.min[2]) / Math.max(1, dims[2]),
];

const clampDtForCfl = (
  dt_s: number,
  dims: [number, number, number],
  bounds: { min: Vec3; max: Vec3 },
  unitSystem: GrUnitSystem,
) => {
  if (!(dt_s > 0)) {
    return { dt_s: Math.max(0, dt_s), clamped: false };
  }
  const spacing = resolveVoxelSize(dims, bounds);
  const minSpacing = Math.max(1e-12, Math.min(spacing[0], spacing[1], spacing[2]));
  const dtGeom = unitSystem === "SI" ? toGeometricTime(dt_s) : dt_s;
  const dtGeomMax = minSpacing * GR_CFL_MAX;
  if (!(dtGeom > 0) || !(dtGeomMax > 0)) {
    return { dt_s, clamped: false };
  }
  if (dtGeom <= dtGeomMax) {
    return { dt_s, clamped: false };
  }
  const dtGeomClamped = dtGeomMax;
  const dtClamped = unitSystem === "SI" ? toSiTime(dtGeomClamped) : dtGeomClamped;
  return { dt_s: dtClamped, clamped: true };
};

const buildConstantChannel = (total: number, value: number): GrEvolveBrickChannel => {
  const data = new Float32Array(total);
  if (value !== 0) data.fill(value);
  return { data, min: value, max: value };
};

const buildChannelFromArray = (data: Float32Array): GrEvolveBrickChannel => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  return { data, min, max };
};

const rmsFromChannel = (channel: GrEvolveBrickChannel) => {
  const data = channel.data;
  if (!data.length) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = data[i];
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
};

const rmsFromVector = (
  x: GrEvolveBrickChannel,
  y: GrEvolveBrickChannel,
  z: GrEvolveBrickChannel,
) => {
  const len = Math.min(x.data.length, y.data.length, z.data.length);
  if (!len) return 0;
  let sum = 0;
  for (let i = 0; i < len; i += 1) {
    const vx = x.data[i];
    const vy = y.data[i];
    const vz = z.data[i];
    sum += vx * vx + vy * vy + vz * vz;
  }
  return Math.sqrt(sum / len);
};

const maxAbsBeta = (
  x: GrEvolveBrickChannel,
  y: GrEvolveBrickChannel,
  z: GrEvolveBrickChannel,
) => {
  const len = Math.min(x.data.length, y.data.length, z.data.length);
  if (!len) return 0;
  let maxAbs = 0;
  for (let i = 0; i < len; i += 1) {
    const mag = Math.hypot(x.data[i], y.data[i], z.data[i]);
    if (mag > maxAbs) maxAbs = mag;
  }
  return maxAbs;
};

const maxAbsFromChannel = (channel: GrEvolveBrickChannel) => {
  const min = Number(channel.min);
  const max = Number(channel.max);
  const absMin = Number.isFinite(min) ? Math.abs(min) : 0;
  const absMax = Number.isFinite(max) ? Math.abs(max) : 0;
  return Math.max(absMin, absMax);
};

const percentileFromSamples = (samples: number[], p: number) => {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const q = Math.min(Math.max(p, 0), 1);
  const index = Math.floor((sorted.length - 1) * q);
  return sorted[index] ?? 0;
};

const buildInvariantStats = (
  channel: GrEvolveBrickChannel | undefined,
  options: {
    wallFraction: number;
    bandFraction: number;
    sampleMax: number;
    percentile: number;
    useAbs: boolean;
  },
): GrInvariantStats | null => {
  if (!channel) return null;
  const data = channel.data;
  const total = Math.max(0, data.length);
  if (!total) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      p98: 0,
      sampleCount: 0,
      abs: options.useAbs,
      wallFraction: options.wallFraction,
      bandFraction: options.bandFraction,
      threshold: 0,
      bandMin: 0,
      bandMax: 0,
    };
  }
  const sampleMax = Math.max(1, Math.floor(options.sampleMax));
  const stride = Math.max(1, Math.floor(total / sampleMax));
  const samples: number[] = [];
  let sum = 0;
  let count = 0;
  for (let i = 0; i < total; i += stride) {
    const raw = data[i];
    if (!Number.isFinite(raw)) continue;
    const value = options.useAbs ? Math.abs(raw) : raw;
    samples.push(value);
    sum += value;
    count += 1;
  }
  const p98 = percentileFromSamples(samples, options.percentile);
  const mean = count > 0 ? sum / count : 0;
  const wallFraction = Math.min(1, Math.max(0, options.wallFraction));
  const bandFraction = Math.min(1, Math.max(0, options.bandFraction));
  const threshold = p98 * wallFraction;
  const bandMin = threshold > 0 ? threshold * (1 - bandFraction) : 0;
  const bandMax = threshold > 0 ? threshold * (1 + bandFraction) : 0;
  return {
    min: Number.isFinite(channel.min) ? channel.min : 0,
    max: Number.isFinite(channel.max) ? channel.max : 0,
    mean: Number.isFinite(mean) ? mean : 0,
    p98: Number.isFinite(p98) ? p98 : 0,
    sampleCount: count,
    abs: options.useAbs,
    wallFraction,
    bandFraction,
    threshold: Number.isFinite(threshold) ? threshold : 0,
    bandMin: Number.isFinite(bandMin) ? bandMin : 0,
    bandMax: Number.isFinite(bandMax) ? bandMax : 0,
  };
};

const buildConstraintDiagnostics = (
  channel: GrEvolveBrickChannel,
  rms?: number,
): GrPipelineDiagnostics["constraints"]["H_constraint"] => {
  const min = channel.min;
  const max = channel.max;
  const maxAbs = Math.max(Math.abs(min), Math.abs(max));
  return {
    min,
    max,
    maxAbs,
    ...(Number.isFinite(rms) ? { rms: rms as number } : {}),
  };
};

const buildRhoConstraintDiagnostics = (
  ricci3?: GrEvolveBrickChannel,
  K_trace?: GrEvolveBrickChannel,
  KijKij?: GrEvolveBrickChannel,
): GrPipelineDiagnostics["constraints"]["H_constraint"] | null => {
  if (!ricci3 || !K_trace || !KijKij) return null;
  const total = Math.min(
    ricci3.data.length,
    K_trace.data.length,
    KijKij.data.length,
  );
  if (!total) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let maxAbs = 0;
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let i = 0; i < total; i += 1) {
    const R3 = ricci3.data[i];
    const K = K_trace.data[i];
    const K2 = K * K;
    const KijVal = KijKij.data[i];
    if (!Number.isFinite(R3) || !Number.isFinite(K2) || !Number.isFinite(KijVal)) {
      continue;
    }
    const rho = (R3 + K2 - KijVal) / SIXTEEN_PI;
    if (!Number.isFinite(rho)) continue;
    if (rho < min) min = rho;
    if (rho > max) max = rho;
    const abs = Math.abs(rho);
    if (abs > maxAbs) maxAbs = abs;
    sum += rho;
    sumSq += rho * rho;
    count += 1;
  }
  if (!count) return null;
  const mean = sum / count;
  const rms = Math.sqrt(sumSq / count);
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    maxAbs: Number.isFinite(maxAbs) ? maxAbs : 0,
    mean: Number.isFinite(mean) ? mean : 0,
    rms: Number.isFinite(rms) ? rms : 0,
    sampleCount: count,
  };
};

const buildSolverHealth = (
  fixups: FixupStats | undefined,
  steps: number,
): GrSolverHealth | undefined => {
  if (!fixups) {
    return {
      status: "NOT_CERTIFIED",
      reasons: ["missing fixup stats"],
      alphaClampFraction: 0,
      kClampFraction: 0,
      totalClampFraction: 0,
      maxAlphaBeforeClamp: 0,
      maxKBeforeClamp: 0,
    };
  }
  const totalCells = Math.max(0, fixups.totalCells);
  const totalPasses = Math.max(1, steps + (fixups.postStep ? 1 : 0));
  const denom = totalCells * totalPasses;
  const alphaClampFraction =
    denom > 0 ? fixups.alphaClampCount / denom : 0;
  const kClampFraction =
    denom > 0 ? fixups.kClampCount / denom : 0;
  const totalClampFraction =
    denom > 0 ? (fixups.alphaClampCount + fixups.kClampCount) / denom : 0;
  const maxAlphaBeforeClamp = fixups.maxAlphaBeforeClamp;
  const maxKBeforeClamp = fixups.maxKBeforeClamp;
  const reasons: string[] = [];
  let status: GrSolverHealthStatus = "CERTIFIED";

  if (!(denom > 0)) {
    status = "NOT_CERTIFIED";
    reasons.push("missing clamp denominator");
  }
  if (alphaClampFraction > FIXUP_CLAMP_FRACTION_MAX) {
    status = "UNSTABLE";
    reasons.push("alpha clamp fraction high");
  }
  if (kClampFraction > FIXUP_CLAMP_FRACTION_MAX) {
    status = "UNSTABLE";
    reasons.push("K clamp fraction high");
  }
  if (
    Number.isFinite(fixups.alphaClampMax) &&
    fixups.alphaClampMax > 0 &&
    maxAlphaBeforeClamp > fixups.alphaClampMax * FIXUP_MAX_ALPHA_MULT
  ) {
    status = "UNSTABLE";
    reasons.push("alpha overshoot beyond clamp limit");
  }
  if (
    Number.isFinite(fixups.kClampMaxAbs) &&
    fixups.kClampMaxAbs > 0 &&
    maxKBeforeClamp > fixups.kClampMaxAbs * FIXUP_MAX_K_MULT
  ) {
    status = "UNSTABLE";
    reasons.push("K overshoot beyond clamp limit");
  }

  return {
    status,
    reasons,
    alphaClampFraction,
    kClampFraction,
    totalClampFraction,
    maxAlphaBeforeClamp,
    maxKBeforeClamp,
  };
};

const computeClampFraction = (
  fixups: FixupStats | undefined,
  steps: number,
): number => {
  if (!fixups) return 0;
  const totalCells = Math.max(0, fixups.totalCells);
  const totalPasses = Math.max(1, steps + (fixups.postStep ? 1 : 0));
  const denom = totalCells * totalPasses;
  if (!(denom > 0)) return 0;
  const totalClamps = fixups.alphaClampCount + fixups.kClampCount;
  return totalClamps / denom;
};

const buildBrickMeta = (params: {
  fixups: FixupStats | undefined;
  solverHealth: GrSolverHealth | undefined;
  stiffness: ShiftStiffnessMetrics | undefined;
  steps: number;
  dtGeom: number;
  minSpacing: number;
}): GrBrickMeta => {
  const reasons: string[] = [];
  let status: GrBrickMetaStatus = "CERTIFIED";
  const clampFraction = computeClampFraction(params.fixups, params.steps);
  const shockMode = params.stiffness?.shockMode ?? "off";
  const shockSevere = params.stiffness?.shockSeverity === "severe";
  const dtMin = params.minSpacing * GR_CFL_MIN;

  if (!params.fixups) {
    status = "NOT_CERTIFIED";
    reasons.push("missing fixup stats");
  }
  if (clampFraction > FIXUP_CLAMP_FRACTION_MAX) {
    status = "NOT_CERTIFIED";
    reasons.push("clamp fraction high");
  }
  if (params.solverHealth?.status === "UNSTABLE") {
    status = "NOT_CERTIFIED";
    reasons.push("solver health unstable");
  }
  if (shockSevere && shockMode !== "off") {
    status = "NOT_CERTIFIED";
    reasons.push("severe shift shock");
  }
  if (params.dtGeom > 0 && params.dtGeom < dtMin) {
    status = "NOT_CERTIFIED";
    reasons.push("dt below minimum threshold");
  }

  return { status, reasons };
};

const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const buildGrDiagnostics = (
  brick: GrEvolveBrick,
  context?: { metricAdapter?: WarpMetricAdapterSnapshot | null },
): GrPipelineDiagnostics => {
  const H_constraint = buildConstraintDiagnostics(
    brick.channels.H_constraint,
    brick.stats.H_rms,
  );
  const Mx = buildConstraintDiagnostics(brick.channels.M_constraint_x);
  const My = buildConstraintDiagnostics(brick.channels.M_constraint_y);
  const Mz = buildConstraintDiagnostics(brick.channels.M_constraint_z);
  const M_maxAbs = Math.max(Mx.maxAbs, My.maxAbs, Mz.maxAbs);
  const alpha = brick.channels.alpha;
  const lapseMin = Number.isFinite(alpha?.min) ? alpha.min : 0;
  const lapseMax = Number.isFinite(alpha?.max) ? alpha.max : 0;
  const stiffness = brick.stats.stiffness;
  const betaMaxAbs = maxAbsBeta(
    brick.channels.beta_x,
    brick.channels.beta_y,
    brick.channels.beta_z,
  );

  return {
    updatedAt: Date.now(),
    source: "gr-evolve-brick",
    ...(context?.metricAdapter ? { metricAdapter: context.metricAdapter } : {}),
    ...(brick.meta ? { meta: brick.meta } : {}),
    grid: {
      dims: brick.dims,
      bounds: brick.bounds,
      voxelSize_m: brick.voxelSize_m,
      time_s: brick.time_s,
      dt_s: brick.dt_s,
    },
    solver: {
      steps: brick.stats.steps,
      iterations: brick.stats.iterations,
      tolerance: brick.stats.tolerance,
      cfl: brick.stats.cfl,
      ...(brick.stats.fixups ? { fixups: brick.stats.fixups } : {}),
      ...(brick.stats.solverHealth ? { health: brick.stats.solverHealth } : {}),
    },
    gauge: {
      lapseMin,
      lapseMax,
      betaMaxAbs: Number.isFinite(betaMaxAbs) ? betaMaxAbs : 0,
    },
    ...(stiffness ? { stiffness } : {}),
    constraints: {
      H_constraint,
      M_constraint: {
        rms: brick.stats.M_rms,
        maxAbs: M_maxAbs,
        components: {
          x: Mx,
          y: My,
          z: Mz,
        },
      },
      ...(brick.stats.rhoConstraint
        ? { rho_constraint: brick.stats.rhoConstraint }
        : {}),
    },
    ...(brick.stats.invariants ? { invariants: brick.stats.invariants } : {}),
    ...(brick.stats.stressEnergy ? { matter: { stressEnergy: brick.stats.stressEnergy } } : {}),
    ...(brick.stats.perf ? { perf: brick.stats.perf } : {}),
  };
};

const clampNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function buildGrEvolveBrick(input: Partial<GrEvolveBrickParams>): GrEvolveBrick {
  const dims: [number, number, number] = input.dims ?? [128, 128, 128];
  const bounds = input.bounds ?? defaultHullBounds();
  const time_s = Math.max(0, clampNumber(input.time_s, 0));
  const dt_s_input = Math.max(0, clampNumber(input.dt_s, 0));
  const steps = Math.max(0, Math.floor(clampNumber(input.steps, 0)));
  const evolveIterations = Math.max(
    0,
    Math.floor(clampNumber(input.iterations, 0)),
  );
  const evolveTolerance = Math.max(0, clampNumber(input.tolerance, 0));
  const koEps = Math.max(0, clampNumber(input.koEps, 0));
  const koTargets = input.koTargets === "all" ? "all" : "gauge";
  const shockMode =
    input.shockMode === "diagnostic" || input.shockMode === "stabilize"
      ? input.shockMode
      : "off";
  const advectScheme = input.advectScheme === "upwind1" ? "upwind1" : "centered";
  const useInitialData = input.useInitialData ?? false;
  const initialIterations = Math.max(
    0,
    Math.floor(clampNumber(input.initialIterations, evolveIterations)),
  );
  const initialTolerance = Math.max(
    0,
    clampNumber(input.initialTolerance, evolveTolerance),
  );
  const iterations = useInitialData ? initialIterations : evolveIterations;
  const tolerance = useInitialData ? initialTolerance : evolveTolerance;
  const includeExtra = input.includeExtra ?? false;
  const includeMatter = input.includeMatter ?? includeExtra;
  const includeKij = input.includeKij ?? includeExtra;
  const includeInvariants = includeExtra;
  const invariantWallFraction = Math.min(
    1,
    Math.max(
      0,
      clampNumber(input.invariantWallFraction, INVARIANT_WALL_FRACTION),
    ),
  );
  const invariantBandFraction = Math.min(
    1,
    Math.max(
      0,
      clampNumber(input.invariantBandFraction, INVARIANT_BAND_FRACTION),
    ),
  );
  const invariantSampleMax = Math.max(
    1,
    Math.floor(clampNumber(input.invariantSampleMax, INVARIANT_SAMPLE_MAX)),
  );
  const invariantPercentile = Math.min(
    1,
    Math.max(0, clampNumber(input.invariantPercentile, INVARIANT_P98)),
  );
  const unitSystem = input.unitSystem ?? "SI";
  const dtClamp = clampDtForCfl(dt_s_input, dims, bounds, unitSystem);
  const dt_s = dtClamp.dt_s;
  if (dtClamp.clamped && dt_s_input > 0) {
    console.warn("[gr-evolve-brick] dt_s clamped for CFL stability", {
      dt_s_input,
      dt_s,
      cfl_max: GR_CFL_MAX,
    });
  }
  let initialState = input.initialState;
  let matter = input.matter ?? null;

  if (useInitialData && !initialState) {
    const initial = runInitialDataSolve({
      dims,
      bounds,
      iterations: initialIterations,
      tolerance: initialTolerance,
      stencils: input.stencils,
      unitSystem,
      matter,
      sourceParams: input.sourceParams,
      sourceOptions: input.sourceOptions,
    });
    if (initial.solver.status !== "CERTIFIED") {
      const detail = initial.solver.reason
        ? ` (${initial.solver.reason})`
        : "";
      throw new Error(`GR initial data not certified${detail}`);
    }
    initialState = initial.state;
    matter = initial.matter ?? null;
  }

  const perfStart = nowMs();
  const evolveStart = nowMs();
  const evolution = runBssnEvolution({
    dims,
    bounds,
    dt: dt_s,
    steps,
    time_s,
    unitSystem,
    gauge: input.gauge,
    stencils: input.stencils,
    boundary: input.boundary,
    fixups: input.fixups,
    koEps,
    koTargets,
    shockMode,
    advectScheme,
    initialState,
    matter,
    usePipelineMatter: true,
    sourceParams: input.sourceParams,
    sourceOptions: input.sourceOptions,
  });
  const evolveMs = nowMs() - evolveStart;
  const grid = evolution.grid;
  const voxelSize_m: Vec3 = [
    grid.spacing[0],
    grid.spacing[1],
    grid.spacing[2],
  ];
  const minSpacing = Math.max(1e-12, Math.min(...voxelSize_m));
  const dt_geom = unitSystem === "SI" ? toGeometricTime(dt_s) : dt_s;
  const cfl = dt_geom > 0 ? dt_geom / minSpacing : 0;
  const stiffness = computeShiftStiffnessMetrics(evolution.state, input.stencils, {
    cflTarget: GR_CFL_MAX,
  });
  stiffness.shockMode = evolution.shockMode;
  if (evolution.stabilizersApplied?.length) {
    stiffness.stabilizersApplied = evolution.stabilizersApplied;
  }

  const includeMatterChannels = includeMatter && !!evolution.matter;
  const brickStart = nowMs();
  const evolutionBrick = buildEvolutionBrick({
    state: evolution.state,
    constraints: evolution.constraints,
    includeConstraints: true,
    includeMatter: includeMatterChannels,
    includeKij,
    includeInvariants,
    matter: evolution.matter ?? null,
    stencils: input.stencils,
    gauge: input.gauge,
    time_s: evolution.time_s,
    dt_s,
  });
  const brickMs = nowMs() - brickStart;
  const evolutionChannels = evolutionBrick.channels;

  const alpha = evolutionChannels.alpha ?? buildChannelFromArray(evolution.state.alpha);
  const beta_x = evolutionChannels.beta_x ?? buildChannelFromArray(evolution.state.beta_x);
  const beta_y = evolutionChannels.beta_y ?? buildChannelFromArray(evolution.state.beta_y);
  const beta_z = evolutionChannels.beta_z ?? buildChannelFromArray(evolution.state.beta_z);
  const gamma_xx = evolutionChannels.gamma_xx ?? buildChannelFromArray(evolution.state.gamma_xx);
  const gamma_yy = evolutionChannels.gamma_yy ?? buildChannelFromArray(evolution.state.gamma_yy);
  const gamma_zz = evolutionChannels.gamma_zz ?? buildChannelFromArray(evolution.state.gamma_zz);
  const K_trace = evolutionChannels.K ?? buildChannelFromArray(evolution.state.K);
  const g_tt = evolutionChannels.g_tt;
  const clockRate_static = evolutionChannels.clockRate_static;
  const theta = evolutionChannels.theta;
  const det_gamma = evolutionChannels.det_gamma;
  const ricci3 = evolutionChannels.ricci3;
  const KijKij = evolutionChannels.KijKij;
  const rhoConstraint = buildRhoConstraintDiagnostics(ricci3, K_trace, KijKij);
  const kretschmann = evolutionChannels.kretschmann;
  const weylI = evolutionChannels.weylI;
  const ricci4 = evolutionChannels.ricci4;
  const ricci2 = evolutionChannels.ricci2;
  const H_constraint =
    evolutionChannels.H_constraint ?? buildChannelFromArray(evolution.constraints.H);
  const M_constraint_x =
    evolutionChannels.M_constraint_x ?? buildChannelFromArray(evolution.constraints.Mx);
  const M_constraint_y =
    evolutionChannels.M_constraint_y ?? buildChannelFromArray(evolution.constraints.My);
  const M_constraint_z =
    evolutionChannels.M_constraint_z ?? buildChannelFromArray(evolution.constraints.Mz);

  const channelOrder: string[] = [...GR_EVOLVE_CHANNEL_ORDER];
  const channels: GrEvolveBrick["channels"] = {
    alpha,
    beta_x,
    beta_y,
    beta_z,
    gamma_xx,
    gamma_yy,
    gamma_zz,
    K_trace,
    H_constraint,
    M_constraint_x,
    M_constraint_y,
    M_constraint_z,
  };

  if (g_tt) channels.g_tt = g_tt;
  if (clockRate_static) channels.clockRate_static = clockRate_static;
  if (theta) channels.theta = theta;
  if (det_gamma) channels.det_gamma = det_gamma;
  if (ricci3) channels.ricci3 = ricci3;
  if (KijKij) channels.KijKij = KijKij;
  if (kretschmann) channels.kretschmann = kretschmann;
  if (weylI) channels.weylI = weylI;
  if (ricci4) channels.ricci4 = ricci4;
  if (ricci2) channels.ricci2 = ricci2;

  if (includeKij) {
    for (const key of GR_EVOLVE_KIJ_CHANNELS) {
      const channel = evolutionChannels[key];
      if (channel) {
        channels[key] = channel;
        channelOrder.push(key);
      }
    }
  }

  if (includeMatterChannels) {
    for (const key of GR_EVOLVE_MATTER_CHANNELS) {
      const channel = evolutionChannels[key];
      if (channel) {
        channels[key] = channel;
        channelOrder.push(key);
      }
    }
  }

  const resolvedChannelOrder = filterChannelOrder(channelOrder, channels);
  const totalVoxels = Math.max(0, dims[0] * dims[1] * dims[2]);
  const channelCount = Math.max(1, resolvedChannelOrder.length);
  const bytesEstimate = totalVoxels * channelCount * 4;
  const totalMs = nowMs() - perfStart;
  const msPerStep = steps > 0 ? evolveMs / steps : 0;

  const time_s_end = evolution.time_s;
  const thetaPeakAbs = maxAbsFromChannel(K_trace);
  const thetaGrowthPerStep = steps > 0 ? thetaPeakAbs / steps : 0;
  const solverHealth = buildSolverHealth(evolution.fixups, steps);
  const clampFraction = computeClampFraction(evolution.fixups, steps);
  if (evolution.fixups) {
    evolution.fixups.clampFraction = clampFraction;
  }
  const brickMeta = buildBrickMeta({
    fixups: evolution.fixups,
    solverHealth,
    stiffness,
    steps,
    dtGeom: dt_geom,
    minSpacing,
  });
  const kretschmannStats = includeInvariants
    ? buildInvariantStats(kretschmann, {
        wallFraction: invariantWallFraction,
        bandFraction: invariantBandFraction,
        sampleMax: invariantSampleMax,
        percentile: invariantPercentile,
        useAbs: false,
      })
    : null;
  const ricci4Stats = includeInvariants
    ? buildInvariantStats(ricci4, {
        wallFraction: invariantWallFraction,
        bandFraction: invariantBandFraction,
        sampleMax: invariantSampleMax,
        percentile: invariantPercentile,
        useAbs: true,
      })
    : null;
  const invariantStats: GrInvariantStatsSet | undefined =
    kretschmannStats || ricci4Stats
      ? {
          ...(kretschmannStats ? { kretschmann: kretschmannStats } : {}),
          ...(ricci4Stats ? { ricci4: ricci4Stats } : {}),
        }
      : undefined;

  const stats: GrEvolveBrickStats = {
    steps,
    iterations,
    tolerance,
    cfl: Number.isFinite(cfl) ? cfl : 0,
    H_rms: evolutionBrick.stats?.H_rms ?? rmsFromChannel(H_constraint),
    M_rms: evolutionBrick.stats?.M_rms ?? rmsFromVector(M_constraint_x, M_constraint_y, M_constraint_z),
    thetaPeakAbs: Number.isFinite(thetaPeakAbs) ? thetaPeakAbs : 0,
    thetaGrowthPerStep: Number.isFinite(thetaGrowthPerStep) ? thetaGrowthPerStep : 0,
    dissipation: {
      koEpsUsed: evolution.koEpsUsed ?? koEps,
      koTargets: evolution.koTargetsUsed ?? koTargets,
    },
    advectScheme: evolution.advectSchemeUsed ?? advectScheme,
    stiffness,
    fixups: evolution.fixups,
    solverHealth,
    ...(rhoConstraint ? { rhoConstraint } : {}),
    ...(invariantStats ? { invariants: invariantStats } : {}),
    stressEnergy: evolution.sourceBrick?.stats,
    perf: {
      totalMs: Number.isFinite(totalMs) ? totalMs : 0,
      evolveMs: Number.isFinite(evolveMs) ? evolveMs : 0,
      brickMs: Number.isFinite(brickMs) ? brickMs : 0,
      voxels: Number.isFinite(totalVoxels) ? totalVoxels : 0,
      channelCount,
      bytesEstimate: Number.isFinite(bytesEstimate) ? bytesEstimate : 0,
      msPerStep: Number.isFinite(msPerStep) ? msPerStep : 0,
    },
  };

  const brick: GrEvolveBrick = {
    dims,
    voxelBytes: 4,
    format: "r32f",
    bounds,
    voxelSize_m,
    time_s: time_s_end,
    dt_s,
    channelOrder: resolvedChannelOrder,
    channels,
    stats,
    meta: brickMeta,
  };

  const pipelineState = getGlobalPipelineState();
  if (pipelineState?.grEnabled === true) {
    const metricAdapter = (pipelineState as any)?.warp?.metricAdapter ?? null;
    const diagnostics = buildGrDiagnostics(brick, { metricAdapter });
    pipelineState.gr = diagnostics;
  }

  return brick;
}

const encodeFloat32 = (payload: Float32Array) =>
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).toString("base64");

export const serializeGrEvolveBrick = (brick: GrEvolveBrick): GrEvolveBrickResponse => {
  const channelOrder = brick.channelOrder ? [...brick.channelOrder] : [...GR_EVOLVE_CHANNEL_ORDER];
  const channels: Record<string, GrEvolveBrickResponseChannel> = {};
  for (const key of channelOrder) {
    const channel = brick.channels[key];
    if (!channel) continue;
    channels[key] = {
      data: encodeFloat32(channel.data),
      min: channel.min,
      max: channel.max,
    };
  }
  return {
    kind: "gr-evolve-brick",
    dims: brick.dims,
    voxelBytes: brick.voxelBytes,
    format: brick.format,
    bounds: brick.bounds,
    voxelSize_m: brick.voxelSize_m,
    time_s: brick.time_s,
    dt_s: brick.dt_s,
    channelOrder,
    channels: channels as GrEvolveBrickResponse["channels"],
    stats: brick.stats,
    ...(brick.meta ? { meta: brick.meta } : {}),
  };
};

export const serializeGrEvolveBrickBinary = (brick: GrEvolveBrick): GrEvolveBrickBinaryPayload => {
  const channelOrder = brick.channelOrder ? [...brick.channelOrder] : [...GR_EVOLVE_CHANNEL_ORDER];
  const channels = brick.channels;
  const headerChannels: Record<string, { min: number; max: number; bytes: number }> = {};
  const buffers: Buffer[] = [];
  for (const key of channelOrder) {
    const channel = channels[key];
    if (!channel) continue;
    headerChannels[key] = {
      min: channel.min,
      max: channel.max,
      bytes: channel.data.byteLength,
    };
    buffers.push(
      Buffer.from(channel.data.buffer, channel.data.byteOffset, channel.data.byteLength),
    );
  }
  return {
    header: {
      kind: "gr-evolve-brick",
      version: 1,
      dims: brick.dims,
      voxelBytes: brick.voxelBytes,
      format: brick.format,
      bounds: brick.bounds,
      voxelSize_m: brick.voxelSize_m,
      time_s: brick.time_s,
      dt_s: brick.dt_s,
      channelOrder,
      channels: headerChannels,
      stats: brick.stats,
      ...(brick.meta ? { meta: brick.meta } : {}),
    },
    buffers,
  };
};
