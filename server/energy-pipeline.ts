// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// Model mode switch: raw physics or paper-calibrated targets
// Explicit default: paper-calibrated targets; set HELIX_MODEL_MODE=raw to bypass
const MODEL_MODE: 'calibrated' | 'raw' =
  (process.env.HELIX_MODEL_MODE === 'raw') ? 'raw' : 'calibrated';

// ── Physics Constants (centralized) ──────────────────────────────────────────
import { HBAR } from "./physics-const.js";
import { C } from "./utils/physics-const-safe";

// Keep tau_LC (wall / c) aligned with modulation dwell unless overridden
const DEFAULT_MODULATION_FREQ_GHZ = 15;
const DEFAULT_WALL_THICKNESS_M = C / (DEFAULT_MODULATION_FREQ_GHZ * 1e9);

// Performance guardrails for billion-tile calculations
const TILE_EDGE_MAX = 2048;          // safe cap for any "edge" dimension fed into dynamic helpers
const DYN_TILECOUNT_HARD_SKIP = 5e7; // >50M tiles → skip dynamic per-tile-ish helpers (use aggregate)

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
  toPipelineStressEnergy,
  computeLaplaceRungeLenz,
  type Vec3,
} from '../modules/dynamic/stress-energy-equations.js';
import warpBubbleModule from '../modules/warp/warp-module.js';
import { DEFAULT_GEOMETRY_SWEEP, DEFAULT_PHASE_MICRO_SWEEP } from "../shared/schema.js";
import type {
  DynamicCasimirSweepConfig,
  DynamicConfig,
  VacuumGapSweepRow,
  SweepPoint,
  SweepRuntime,
  GateAnalytics,
  GatePulse,
  QiSettings,
  QiStats,
  PhaseScheduleTelemetry,
  PumpCommand,
  PumpTone,
  HardwareSectorState,
  HardwareQiSample,
  HardwareSpectrumFrame,
} from "../shared/schema.js";
import { appendPhaseCalibrationLog } from "./utils/phase-calibration.js";
import { slewPump } from "./instruments/pump.js";
import { slewPumpMultiTone } from "./instruments/pump-multitone.js";
import { computeSectorPhaseOffsets, applyPhaseScheduleToPulses } from "./energy/phase-scheduler.js";
import { QiMonitor } from "./qi/qi-monitor.js";
import { configuredQiScalarBound } from "./qi/qi-bounds.js";
import type { RawTileInput } from "./qi/qi-saturation.js";
import { updatePipelineQiTiles, getLatestQiTileStats } from "./qi/pipeline-qi-stream.js";

export type MutableDynamicConfig = DynamicConfigLike;

export interface SweepHistoryTotals {
  visible: number;
  total: number;
  dropped: number;
}

export interface HardwareTruthSnapshot {
  lastSweepRow?: VacuumGapSweepRow;
  totals?: SweepHistoryTotals;
  updatedAt?: number;
  sectorState?: (HardwareSectorState & { updatedAt?: number }) | null;
  qiSample?: (HardwareQiSample & { updatedAt?: number }) | null;
  spectrumFrame?: (HardwareSpectrumFrame & { updatedAt?: number }) | null;
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

const DEFAULT_QI_TAU_MS = parseEnvNumber(process.env.QI_TAU_MS, 5);
const DEFAULT_QI_GUARD = parseEnvNumber(process.env.QI_GUARD_FRAC ?? process.env.QI_GUARD, 0.05);
const DEFAULT_QI_DT_MS = parseEnvNumber(process.env.QI_DT_MS, 2);
const DEFAULT_QI_BOUND_SCALAR = configuredQiScalarBound();
const DEFAULT_NEGATIVE_FRACTION = 0.4;
const DEFAULT_PUMP_FREQ_LIMIT_GHZ = Math.max(
  0.01,
  Math.min(parseEnvNumber(process.env.PUMP_FREQ_LIMIT_GHZ, 120), 1_000),
);

const DEFAULT_QI_SETTINGS: QiSettings = {
  sampler: 'gaussian',
  tau_s_ms: DEFAULT_QI_TAU_MS,
  observerId: 'ship',
  guardBand: DEFAULT_QI_GUARD,
};

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
  // ∇(x^2/a^2 + y^2/b^2 + z^2/c^2) normalized
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

// ---------- Physics-side displacement sampling for debug/validation ----------
export interface FieldSample {
  p: [number, number, number];   // sample coordinate (meters)
  rho: number;                   // ellipsoidal radius (unitless)
  bell: number;                  // canonical bell weight
  n: [number, number, number];   // outward normal
  sgn: number;                   // sector sign (+/-)
  disp: number;                  // scalar displacement magnitude used
  dA?: number;                   // proper area element at sample (m^2) — from metric
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
  wallWidth_m?: number; // bell width wρ in meters (default from sag_nm)
  sectors?: number;     // sector count (default state.sectorCount)
  split?: number;       // (+)/(−) split index (default floor(sectors/2))
  clamp?: Partial<SampleClamp>; // ⬅️ new, optional
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

export interface EnergyPipelineState {
  // Input parameters
  tileArea_cm2: number;
  shipRadius_m: number;        // Legacy fallback for field sampler when hull geometry unavailable
  gap_nm: number;
  sag_nm: number;
  temperature_K: number;
  modulationFreq_GHz: number;

  // Hull geometry
  hull?: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number }; // Paper-authentic stack ~1 m; default auto-tunes to modulation dwell

  // Mode parameters
  currentMode: 'hover' | 'taxi' | 'nearzero' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  dutyShip: number;           // Ship-wide effective duty (promoted from any)
  sectorCount: number;        // Total sectors (always 400)
  concurrentSectors: number; // Live concurrent sectors (1-2)
  sectorStrobing: number;     // Legacy alias for UI compatibility
  qSpoilingFactor: number;
  negativeFraction: number;   // Share of sectors assigned to negative lobe (0..1)

  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
  QL?: number;
  gammaVanDenBroeck: number;
  exoticMassTarget_kg: number;  // User-configurable exotic mass target

  // Calculated values
  U_static: number;         // Static Casimir energy per tile
  U_geo: number;            // Geometry-amplified energy
  U_Q: number;              // Q-enhanced energy
  U_cycle: number;          // Duty-cycled energy
  P_loss_raw: number;       // Raw power loss per tile
  P_avg: number;            // Average power (throttled)
  M_exotic: number;         // Exotic mass generated
  M_exotic_raw: number;     // Raw physics exotic mass (before calibration)
  massCalibration: number;  // Mass calibration factor
  TS_ratio: number;         // Time-scale separation ratio (conservative)
  TS_long?: number;         // Time-scale using longest dimension
  TS_geom?: number;         // Time-scale using geometric mean
  zeta: number;             // Quantum inequality parameter
  N_tiles: number;          // Total number of tiles
  hullArea_m2?: number;     // Hull surface area (for Bridge display)

  // Sector management
  tilesPerSector: number;   // Tiles per sector
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

  // Strobing and timing properties
  strobeHz?: number;
  sectorPeriod_ms?: number;
  dutyBurst?: number;
  localBurstFrac?: number;
  dutyEffective_FR?: number;
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

  // Model mode for client consistency
  modelMode?: 'calibrated' | 'raw';

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
}

// Physical constants
const HBAR_C = HBAR * C;             // ℏc ≈ 3.16152677e-26 [J·m] for Casimir calculations
const NM_TO_M = 1e-9;
const CM2_TO_M2 = 1e-4;

// ── Paper-backed constants (consolidated physics)
/**
 * TheoryRefs:
 *  - ford-roman-qi-1995: derives dutyEffectiveFR ceiling (tau/K)
 */
const TOTAL_SECTORS    = 400;
const BURST_DUTY_LOCAL = 0.01;   // 10 µs / 1 ms
const Q_BURST          = 1e9;    // active-window Q for dissipation and DCE
const GAMMA_VDB        = 1e11;   // fixed seed (raw physics)
const RADIAL_LAYERS    = 10;     // surface × radial lattice

// Public clamp constants for display-only symmetry (do not affect θ/mass)
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

// ── Metric imports (induced surface metric on hull)
import { firstFundamentalForm } from "../src/metric.js";

// --- Mode power/mass policy (targets are *hit* by scaling qMechanical for power and γ_VdB for mass) ---
// NOTE: All P_target_* values are in **watts** (W).
const MODE_POLICY = {
  hover:     { S_live: 1 as const,     P_target_W: 83.3e6,   M_target_kg: 1405 },
  taxi:      { S_live: 1 as const,     P_target_W: 83.3e6,   M_target_kg: 1405 },
  nearzero:  { S_live: 1 as const,     P_target_W: 83.3e6,   M_target_kg: 1405 },
  cruise:    { S_live: 1 as const,     P_target_W: 83.3e6,   M_target_kg: 1405 },
  emergency: { S_live: 2 as const,     P_target_W: 297.5e6,  M_target_kg: 1405 },
  standby:   { S_live: 0 as const,     P_target_W: 0,        M_target_kg: 0     },
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

/** Ellipsoid surface area via induced metric integral (replaces Knud-Thomsen).
 *  a = Lx/2, b = Ly/2, c = Lz/2 (meters). Numerical quadrature over (theta, phi).
 */
function surfaceAreaEllipsoidMetric(
  Lx_m: number,
  Ly_m: number,
  Lz_m: number,
  nTheta = 256,
  nPhi = 128,
): number {
  const a = Lx_m / 2;
  const b = Ly_m / 2;
  const c = Lz_m / 2;
  const dTheta = (2 * Math.PI) / nTheta;
  const dPhi = Math.PI / (nPhi - 1); // phi in [-pi/2, pi/2]
  let area = 0;
  for (let i = 0; i < nTheta; i++) {
    const theta = i * dTheta;
    for (let j = 0; j < nPhi; j++) {
      const phi = -Math.PI / 2 + j * dPhi;
      const { dA } = firstFundamentalForm(a, b, c, theta, phi);
      area += dA * dTheta * dPhi;
    }
  }
  return area;
}

// Initialize pipeline state with defaults
export function initializePipelineState(): EnergyPipelineState {
  return {
    // Needle Hull full scale defaults for HELIX-CORE (paper-authentic)
    tileArea_cm2: 25,  // 5×5 cm tiles (was 5 cm², now 25 cm²)
    shipRadius_m: 86.5,
    gap_nm: 1.0,
    sag_nm: 16,
    temperature_K: 20,
    modulationFreq_GHz: DEFAULT_MODULATION_FREQ_GHZ,

    // Hull geometry (actual 1.007 km needle dimensions)
    hull: {
      Lx_m: 1007,  // length (needle axis)
      Ly_m: 264,   // width  
      Lz_m: 173,   // height
      wallThickness_m: DEFAULT_WALL_THICKNESS_M  // Matches 15 GHz dwell (~0.02 m); override for paper 1 m stack
    },

    // Mode defaults (hover)
    currentMode: 'hover',
    dutyCycle: 0.14,
    dutyShip: 0.000025,      // Ship-wide effective duty (will be recalculated)
    sectorCount: 400,        // Total sectors (always 400)
    concurrentSectors: 1,    // Live concurrent sectors (default 1)
    sectorStrobing: 1,       // Legacy alias
    qSpoilingFactor: 1,
    negativeFraction: DEFAULT_NEGATIVE_FRACTION,

    // Physics defaults (paper-backed)
    gammaGeo: 26,
    qMechanical: 1,               // Set to 1 (was 5e4) - power knob only
    qCavity: PAPER_Q.Q_BURST,             // Use paper-backed Q_BURST 
    gammaVanDenBroeck: PAPER_VDB.GAMMA_VDB, // Use paper-backed γ_VdB seed
    exoticMassTarget_kg: 1405,    // Reference target (not a lock)

    // Initial calculated values
    U_static: 0,
    U_geo: 0,
    U_Q: 0,
    U_cycle: 0,
    P_loss_raw: 0,
    P_avg: 0,
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
    },
    gateAnalytics: null,
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
  // --- Surface area & tile count from actual hull dims ---
  const tileArea_m2 = state.tileArea_cm2 * CM2_TO_M2;

  // If a full rectangular needle + rounded caps is added later, we can refine this.
  // For now, the ellipsoid (a=Lx/2, b=Ly/2, c=Lz/2) is an excellent approximation.
  const hullDims = state.hull ?? {
    Lx_m: state.shipRadius_m * 2,
    Ly_m: state.shipRadius_m * 2,
    Lz_m: state.shipRadius_m * 2,
  };
  // Proper surface area from induced metric (ellipsoid shell)
  const hullArea_m2 = surfaceAreaEllipsoidMetric(
    hullDims.Lx_m, hullDims.Ly_m, hullDims.Lz_m
  );

  // Store hull area for Bridge display
  state.hullArea_m2 = hullArea_m2;

  // 1) N_tiles — paper-authentic tile census
  const surfaceTiles = Math.floor(hullArea_m2 / tileArea_m2);
  // Use centralized PAPER_GEO constants
  state.N_tiles = Math.max(1, Math.round(surfaceTiles * PAPER_GEO.RADIAL_LAYERS * PAPER_GEO.PACKING));

  // Surface packing factor for future geometry modules to replace fudge
  (state as any).__packing = PAPER_GEO.PACKING;

  // Step 1: Static Casimir energy
  state.U_static = calculateStaticCasimir(state.gap_nm, tileArea_m2);

  // 3) Apply mode config EARLY (right after reading currentMode)
  const modeConfig = MODE_CONFIGS[state.currentMode];
  if (!modeConfig) {
    if (DEBUG_PIPE) console.warn("[PIPELINE_UI] Unknown mode", state.currentMode, "- defaulting to hover");
    state.currentMode = 'hover';
  }
  const ui = modeConfig ?? MODE_CONFIGS.hover;
  state.dutyCycle = ui.dutyCycle;
  state.qSpoilingFactor = ui.qSpoilingFactor;
  // keep sector policy from resolveSLive just below; don't touch sectorCount here

  // 4) Sector scheduling — per-mode policy
  state.sectorCount = Math.max(1, state.sectorCount || PAPER_DUTY.TOTAL_SECTORS); // respect override; else default to 400
  state.concurrentSectors = resolveSLive(state.currentMode); // ✅ Concurrent live sectors (emergency=2, others=1)
  const S_total = state.sectorCount;
  const S_live = state.concurrentSectors;

  // if standby, FR duty must be exactly zero for viewers/clients
  const isStandby = String(state.currentMode || '').toLowerCase() === 'standby';
  const d_eff = isStandby
    ? 0
    : PAPER_DUTY.BURST_DUTY_LOCAL * (S_live / Math.max(1, S_total)); // existing calc

  state.activeSectors   = S_live;
  state.activeFraction  = S_live / S_total;

  // 🔎 HINT for clients: fraction of the bubble "visible" from a single concurrent pane.
  // The REAL pane can multiply this with its band/slice coverage to scale extrema and mass proxy.
  (state as any).viewMassFractionHint = S_live / Math.max(1, S_total);
  state.tilesPerSector  = Math.floor(state.N_tiles / Math.max(1, S_total));
  state.activeTiles     = state.tilesPerSector * S_live;
  (state as any).tiles = {
    total: state.N_tiles,
    active: state.activeTiles,
    tileArea_cm2: state.tileArea_cm2,
    hullArea_m2: state.hullArea_m2,
  };

  // Safety alias for consumers that assume ≥1 sectors for math
  (state as any).concurrentSectorsSafe = Math.max(1, state.concurrentSectors);

  // 🔧 expose both duties explicitly and consistently
  state.dutyBurst        = PAPER_DUTY.BURST_DUTY_LOCAL;  // keep as *local* ON-window = 0.01
  state.dutyEffective_FR = d_eff;             // ship-wide effective duty (for ζ & audits)
  (state as any).dutyEffectiveFR = d_eff; // legacy/camel alias
  // (dutyCycle already set from MODE_CONFIGS above)

  // ✅ First-class fields for UI display
  state.dutyShip = d_eff;          // Ship-wide effective duty (promoted from any)
  (state as any).dutyEff = d_eff;  // Legacy alias

  // 5) Stored energy (raw core): ensure valid input values
  // ⚠️ Fix: ensure qMechanical is never 0 unless standby mode
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
  state.U_Q   = state.U_geo * state.qMechanical;  // ✅ apply qMechanical from start

  // 6) Power — raw first, then power-only calibration via qMechanical
  const omega = 2 * Math.PI * (state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ) * 1e9;
  const Q = state.qCavity ?? PAPER_Q.Q_BURST;
  const P_tile_raw = Math.abs(state.U_Q) * omega / Q; // J/s per tile during ON
  let   P_total_W  = P_tile_raw * state.N_tiles * d_eff;        // ship average

  // Power-only calibration (qMechanical): hit per-mode target *without* touching mass
  const CALIBRATED = (MODEL_MODE === 'calibrated');
  const P_target_W = MODE_POLICY[state.currentMode].P_target_W;
  if (CALIBRATED && P_target_W > 0 && P_total_W > 0) {
    const scaleP = P_target_W / P_total_W;
    const qMech_raw = state.qMechanical * scaleP;
    state.qMechanical = Math.max(1e-6, Math.min(1e6, qMech_raw)); // knob #1: power only (clamped)
    state.U_Q         = state.U_geo * state.qMechanical;
    const P_tile_cal  = Math.abs(state.U_Q) * omega / Q;
    P_total_W         = P_tile_cal * state.N_tiles * d_eff;
  } else if (P_target_W === 0) {
    // standby: force qMechanical→0 so stored-energy dissipation is zero
    state.qMechanical = 0;
    state.U_Q         = 0;
    P_total_W         = 0;
  }

  // Post-calibration clamping check for qMechanical
  const qMech_before = state.qMechanical;
  if (!isStandby) {
    state.qMechanical = Math.max(1e-6, Math.min(1e6, state.qMechanical));
  }
  (state as any).qMechanicalClamped = (state.qMechanical !== qMech_before);
  state.P_loss_raw = Math.abs(state.U_Q) * omega / Q;  // per-tile (with qMechanical)
  state.P_avg      = P_total_W / 1e6; // MW for HUD
  (state as any).P_avg_W = P_total_W; // W (explicit)

  // Expose labeled electrical power for dual-bar dashboards
  (state as any).P_elec_MW = state.P_avg;  // Electrical power (same as P_avg, but clearly labeled)

  // --- Cryo power AFTER calibration and AFTER mode qSpoilingFactor is applied ---
  const Q_on  = Q;
  // qSpoilingFactor is idle Q multiplier: >1 ⇒ less idle loss (higher Q_off)
  const Q_off = Math.max(1, Q_on * state.qSpoilingFactor); // use mode-specific qSpoilingFactor
  const P_tile_on   = Math.abs(state.U_Q) * omega / Q_on;
  const P_tile_idle = Math.abs(state.U_Q) * omega / Q_off;
  (state as any).P_cryo_MW = ((P_tile_on * d_eff + P_tile_idle * (1 - d_eff)) * state.N_tiles) / 1e6;

  // 7) Mass — raw first, then mass-only calibration via γ_VdB
  state.gammaVanDenBroeck = PAPER_VDB.GAMMA_VDB;     // seed (paper)
  const U_abs = Math.abs(state.U_static);
  const geo3  = Math.pow(state.gammaGeo ?? 26, 3);
  let   E_tile = U_abs * geo3 * PAPER_Q.Q_BURST * state.gammaVanDenBroeck * d_eff; // J per tile (burst-window Q for mass)
  let   M_total = (E_tile / (C * C)) * state.N_tiles;

  // Mass-only calibration: hit per-mode mass target without changing power
  const M_target = MODE_POLICY[state.currentMode].M_target_kg;
  const userM = state.exoticMassTarget_kg ?? M_target;
  if (CALIBRATED && userM > 0 && M_total > 0) {
    const scaleM = userM / M_total;
    const gammaVdB_raw = state.gammaVanDenBroeck * scaleM;
    state.gammaVanDenBroeck = Math.max(0, Math.min(1e16, gammaVdB_raw)); // knob #2: mass only (clamped)
    E_tile  = U_abs * geo3 * PAPER_Q.Q_BURST * state.gammaVanDenBroeck * d_eff;
    M_total = (E_tile / (C * C)) * state.N_tiles;
  } else if (userM <= 0) {
    state.gammaVanDenBroeck = 0;
    M_total = 0;
  }
  state.M_exotic_raw = M_total;
  state.M_exotic     = M_total;

  // Post-calibration clamping check for gammaVanDenBroeck
  const gammaVdB_before = state.gammaVanDenBroeck;
  state.gammaVanDenBroeck = Math.max(0, Math.min(1e16, state.gammaVanDenBroeck));
  (state as any).gammaVanDenBroeckClamped = (state.gammaVanDenBroeck !== gammaVdB_before);

  // Mass calibration readout
  state.massCalibration = state.gammaVanDenBroeck / PAPER_VDB.GAMMA_VDB;

  // Split γ_VdB into visual vs mass knobs to keep calibrator away from renderer
  (state as any).gammaVanDenBroeck_mass = state.gammaVanDenBroeck;   // ← calibrated value used to hit M_target
  (state as any).gammaVanDenBroeck_vis  = PAPER_VDB.GAMMA_VDB;                 // ← fixed "physics/visual" seed for renderer

  // Make visual factor mode-invariant (except standby)
  if (state.currentMode !== 'standby') {
    (state as any).gammaVanDenBroeck_vis = PAPER_VDB.GAMMA_VDB; // constant across modes
  } else {
    (state as any).gammaVanDenBroeck_vis = 1; // keep standby dark
  }

  // Precomputed physics-only θ gain for client verification
  // Canonical ship-wide θ (authoritative):
  //   θ = γ_geo^3 · q · γ_VdB · duty_FR
  // Use the calibrated/mass γ_VdB when available; fall back to visual seed if not.
  const _gammaVdB_forTheta = Number.isFinite(state.gammaVanDenBroeck)
    ? state.gammaVanDenBroeck
    : ((state as any).gammaVanDenBroeck_vis ?? PAPER_VDB.GAMMA_VDB);

  // DEBUG: θ-Scale Field Strength Audit (dual-value: raw vs calibrated)
  const gammaVdB_raw = PAPER_VDB.GAMMA_VDB;  // Raw paper value (1e11)
  const gammaVdB_cal = _gammaVdB_forTheta;   // Calibrated value (mass-adjusted)

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
  (state as any).modelMode = MODEL_MODE;

  // Store both values for audit
  (state as any).thetaRaw = thetaRaw;
  (state as any).thetaCal = thetaCal;

  // Publish compact thetaAudit for UI consumption
  (state as any).uniformsExplain ??= {};
  (state as any).uniformsExplain.thetaAudit = {
    mode: MODEL_MODE,
    eq: "θ = γ_geo^3 · q · γ_VdB · d_eff",
    inputs: {
      gammaGeo: state.gammaGeo,
      q: state.qSpoilingFactor,
      gammaVdB_raw: PAPER_VDB.GAMMA_VDB,
      gammaVdB_cal: state.gammaVanDenBroeck,
      d_eff: Math.max(1e-12, state.dutyEffective_FR ?? d_eff)
    },
    results: { thetaRaw, thetaCal }
  };

  console.log('🔍 θ-Scale Field Strength Audit (Raw vs Calibrated):', {
    mode: MODEL_MODE,
    formula: 'θ = γ_geo^3 · q · γ_VdB · d_eff',
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

  /* ──────────────────────────────
     "Explain-it" counters for HUD/debug
  ──────────────────────────────── */
  (state as any).E_tile_static_J = Math.abs(state.U_static);  // Static Casimir energy per tile
  (state as any).E_tile_geo_J = Math.abs(state.U_geo);        // Geometric amplified energy per tile  
  (state as any).E_tile_on_J = Math.abs(state.U_Q);           // Stored energy per tile in on-window
  (state as any).P_tile_on_W = state.P_loss_raw;              // Power per tile during on-window
  (state as any).d_eff = d_eff;                               // Ship-wide effective duty (first-class)
  (state as any).M_per_tile_kg = state.N_tiles > 0 ? state.M_exotic / state.N_tiles : 0; // Mass per tile

  // 7) Quantum-safety proxy (scaled against baseline ship-wide duty)
  const d_ship = d_eff;                              // ship-wide
  const d0 = PAPER_DUTY.BURST_DUTY_LOCAL / PAPER_DUTY.TOTAL_SECTORS;       // 0.01/400
  const zeta0 = 0.84;                                // baseline fit
  state.zeta = zeta0 * (d_ship / d0);                // keeps ζ≈0.84 at baseline
  state.fordRomanCompliance = state.zeta < ((ui as any).zeta_max ?? 1.0); // Use mode-specific max

  // Physics logging for debugging (before UI field updates)
  if (DEBUG_PIPE) console.log("[PIPELINE]", {
    mode: state.currentMode, model: MODEL_MODE,
    dutyShip: d_eff, dutyUI_before: state.dutyCycle, S_live, N: state.N_tiles,
    gammaGeo: state.gammaGeo, qCavity: state.qCavity, gammaVdB: state.gammaVanDenBroeck,
    U_static: state.U_static, U_Q: state.U_Q, P_loss_raw: state.P_loss_raw,
    P_avg_MW: state.P_avg, M_raw: state.M_exotic_raw, M_final: state.M_exotic,
    massCal: state.massCalibration
  });

  /* ──────────────────────────────
     Additional metrics (derived)
  ──────────────────────────────── */

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
    zeta_baseline: zeta0,   // Baseline ζ = 0.84 for scaling reference
  };

  // 9) Mode policy calibration already applied above - power and mass targets hit automatically

  // Duty-cycled energy and curvature limit (corrected)
  state.U_cycle = state.U_Q * d_eff;

  // Expose timing details for metrics API (corrected naming)
  state.strobeHz            = Number(process.env.STROBE_HZ ?? 1000); // sectors/sec (1ms macro-tick)
  state.sectorPeriod_ms     = 1000 / Math.max(1, state.strobeHz);
  state.modelMode           = MODEL_MODE; // for client consistency

  // Compliance flags (physics-based safety)
  state.natarioConstraint   = true;
  state.curvatureLimit      = state.fordRomanCompliance; // explicit alias

  // Audit guard (pipeline self-consistency check)
  (function audit() {
    const P_tile = Math.abs(state.U_Q) * omega / Q;
    const P_exp  = P_tile * state.N_tiles * d_eff / 1e6;
    if (Math.abs(state.P_avg - P_exp) > 1e-6 * Math.max(1, P_exp)) {
      if (DEBUG_PIPE) console.warn("[AUDIT] P_avg drift; correcting", {reported: state.P_avg, expected: P_exp});
      state.P_avg = P_exp;
      (state as any).P_avg_W = P_exp * 1e6; // W (explicit)
    }

    const E_tile_mass = Math.abs(state.U_static) * Math.pow(state.gammaGeo,3)
                 * PAPER_Q.Q_BURST * state.gammaVanDenBroeck * d_eff;
    const M_exp  = (E_tile_mass / (C*C)) * state.N_tiles;
    if (Math.abs(state.M_exotic - M_exp) > 1e-6 * Math.max(1, M_exp)) {
      if (DEBUG_PIPE) console.warn("[AUDIT] M_exotic drift; correcting", {reported: state.M_exotic, expected: M_exp});
      state.M_exotic_raw = state.M_exotic = M_exp;
    }
  })();

  // Overall status (mode-aware power thresholds)
  const P_warn = MODE_POLICY[state.currentMode].P_target_W * 1.2 / 1e6; // +20% headroom in MW
  if (!state.fordRomanCompliance || !state.curvatureLimit || state.zeta >= 1.0) {
    state.overallStatus = 'CRITICAL';
  } else if (state.zeta >= 0.95 || (state.currentMode !== 'emergency' && state.P_avg > P_warn)) {
    state.overallStatus = 'WARNING';
  } else {
    state.overallStatus = 'NOMINAL';
  }

  // Mode configuration already applied early in function - no need to duplicate
  state.sectorStrobing  = state.concurrentSectors;         // ✅ Legacy alias for UI compatibility
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
  state.sectorPeriod_ms = sectorPeriodMs;
  const normalizePhase01 = (value: number) => ((value % 1) + 1) % 1;
  const derivedPhase01 =
    sectorPeriodMs > 0 ? ((Date.now() % sectorPeriodMs) / sectorPeriodMs) : 0;
  const hwPhase01 = Number(hw?.phase01);
  const phase01 = Number.isFinite(hwPhase01) ? normalizePhase01(hwPhase01) : derivedPhase01;
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

  // UI field updates logging (after MODE_CONFIGS applied)
  if (DEBUG_PIPE) console.log("[PIPELINE_UI]", {
    dutyUI_after: state.dutyCycle, 
    sectorCount: state.sectorCount,
    concurrentSectors: state.concurrentSectors,
    sectorStrobing: state.sectorStrobing,
    qSpoilingFactor: state.qSpoilingFactor
  });

  // --- Construct light-crossing packet (filled correctly below) ---
  const f_m = (state.modulationFreq_GHz ?? DEFAULT_MODULATION_FREQ_GHZ) * 1e9;     // Hz
  const T_m_s = 1 / f_m;                                  // s
  const tauLC_s = (state.hull?.wallThickness_m ?? DEFAULT_WALL_THICKNESS_M) / C;
  const lightCrossing = {
    tauLC_ms: tauLC_s * 1e3,
    burst_ms: PAPER_DUTY.BURST_DUTY_LOCAL * T_m_s * 1e3,
    dwell_ms: T_m_s * 1e3,
  };
  if (Number.isFinite(hwTauLcMs)) {
    lightCrossing.tauLC_ms = hwTauLcMs;
  }
  if (Number.isFinite(hwBurstMs)) {
    lightCrossing.burst_ms = hwBurstMs;
  }
  if (Number.isFinite(hwDwellMs)) {
    lightCrossing.dwell_ms = hwDwellMs;
  }
  (state as any).lightCrossing = lightCrossing;
  (state as any).tauLC_ms = lightCrossing.tauLC_ms;

  // Calculate Natário metrics using pipeline state
  const natario = calculateNatarioMetric({
      gap: state.gap_nm,
      hull: state.hull ? { a: state.hull.Lx_m / 2, b: state.hull.Ly_m / 2, c: state.hull.Lz_m / 2 } : { a: 503.5, b: 132, c: 86.5 },
      N_tiles: state.N_tiles,
      tileArea_m2: state.tileArea_cm2 * CM2_TO_M2,
      dutyEffectiveFR: d_eff,
      lightCrossing,
      gammaGeo: state.gammaGeo,
      gammaVanDenBroeck: state.gammaVanDenBroeck,
      qSpoilingFactor: state.qSpoilingFactor,
      cavityQ: state.qCavity,
      modulationFreq_GHz: state.modulationFreq_GHz,
      sectorStrobing: state.concurrentSectors,   // concurrent live sectors
      dynamicConfig: {
        sectorCount: state.sectorCount,          // TOTAL sectors (e.g. 400)
        concurrentSectors: state.concurrentSectors,
        sectorDuty: d_eff,                       // FR duty, not UI duty
        cavityQ: state.qCavity,
        qSpoilingFactor: state.qSpoilingFactor,
        gammaGeo: state.gammaGeo,
        gammaVanDenBroeck: state.gammaVanDenBroeck,
        pulseFrequencyGHz: state.modulationFreq_GHz,
        lightCrossingTimeNs: tauLC_s * 1e9
      }
    } as any, state.U_static * state.N_tiles);

  // Store Natário metrics in state for API access
  (state as any).natario = natario;

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
      geometry: 'parallel_plates',
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
      R_geom_m: geomR
    });

    // Expose stress-energy tensor components in the shared snapshot
    (state as any).stressEnergy = SE;
  } catch (e) {
    if (DEBUG_PIPE) console.warn('Stress-energy calculation failed:', e);
  }

  // Calculate Natário warp bubble results (now pipeline-true)
  try {
    const hullGeomWarp = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 };
    const a_warp = hullGeomWarp.Lx_m / 2;
    const b_warp = hullGeomWarp.Ly_m / 2;
    const c_warp = hullGeomWarp.Lz_m / 2;
    const geomR_warp = Math.cbrt(a_warp * b_warp * c_warp); // meters

    const warpParams = {
      geometry: 'bowl' as const,
      gap: state.gap_nm ?? 1,
      radius: geomR_warp * 1e6, // Convert meters to micrometers for compatibility
      sagDepth: state.sag_nm ?? 16,
      material: 'PEC' as const,
      temperature: state.temperature_K ?? 20,
      moduleType: 'warp' as const,
      hull: hullGeomWarp,
      // **CRITICAL FIX**: Pass calibrated pipeline mass to avoid independent calculation
      exoticMassTarget_kg: state.M_exotic, // Use calibrated mass (1405 kg) from pipeline
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
        warpFieldType: 'natario' as const
      },
      // Add amps field for validation bounds
      amps: {
        gammaGeo: state.gammaGeo ?? 26,
        gammaVanDenBroeck: state.gammaVanDenBroeck ?? 3.83e1,
        qSpoilingFactor: state.qSpoilingFactor ?? 1
      }
    };

    const warp = await warpBubbleModule.calculate(warpParams);

    // Store warp results in state for API access
    (state as any).warp = warp;
  } catch (e) {
    if (DEBUG_PIPE) console.warn('Warp bubble calculation failed:', e);
  }

  flushPendingPumpCommand();
  updateQiTelemetry(state);

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

function updateQiTelemetry(state: EnergyPipelineState) {
  const desiredTau = Number.isFinite(state.qi?.tau_s_ms)
    ? Number(state.qi?.tau_s_ms)
    : DEFAULT_QI_TAU_MS;
  const desiredDt = desiredQiSampleDt(state);
  reconfigureQiMonitor(desiredTau, desiredDt);
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
  state.qi = stats;
  if (synthesizedTiles.length) {
    updatePipelineQiTiles(synthesizedTiles, { source: "synthetic" });
  } else {
    updatePipelineQiTiles([], { source: "synthetic" });
  }

  if (PUMP_TONE_ENABLE) {
    const cmd = getPumpCommandForQi(stats, { epoch_ms: GLOBAL_PUMP_EPOCH_MS });
    if (cmd) {
      const now = Date.now();
      const hash = hashPumpCommand(cmd);
      const since = Math.max(0, now - lastPublishedPumpAt);
      const changed = hash !== lastPublishedPumpHash;
      const pastMinInterval = since >= PUMP_CMD_MIN_INTERVAL_MS;
      const keepAliveDue = since >= PUMP_CMD_KEEPALIVE_MS;

      if ((changed && pastMinInterval) || (keepAliveDue && pastMinInterval)) {
        publishPumpCommand(cmd);
        lastPublishedPumpHash = hash;
        lastPublishedPumpAt = now;
      }
    }
  }

  const guardFrac = DEFAULT_QI_SETTINGS.guardBand ?? 0;
  const guardThreshold = Math.abs(stats.bound) * guardFrac;
  let badge: 'ok' | 'near' | 'violation';

  if (!Number.isFinite(stats.margin)) {
    badge = 'violation';
  } else if (stats.margin < 0) {
    badge = 'violation';
  } else if (stats.margin < guardThreshold) {
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

function estimateEffectiveRhoFromState(state: EnergyPipelineState): number {
  const nowMs = Date.now();
  const tilesTelemetry = getLatestQiTileStats();
  if (
    tilesTelemetry?.avgNeg != null &&
    tilesTelemetry.source != null &&
    tilesTelemetry.source !== "synthetic"
  ) {
    return tilesTelemetry.avgNeg;
  }
  const pulses = state.gateAnalytics?.pulses;

  if (Array.isArray(pulses) && pulses.length) {
    let accum = 0;
    for (const pulse of pulses) {
      accum += rhoFromPulse(nowMs, pulse);
    }
    if (Number.isFinite(accum)) {
      return accum;
    }
  }

  if (lastPumpCommandSnapshot?.tones?.length) {
    return rhoFromTones(
      nowMs,
      lastPumpCommandSnapshot.tones,
      lastPumpCommandSnapshot.rho0 ?? 0,
      lastPumpCommandSnapshot.epoch_ms,
    );
  }

  const effDuty =
    Number((state as any).dutyEffectiveFR ?? state.dutyEffective_FR ?? state.dutyCycle ?? 0);
  if (!Number.isFinite(effDuty) || effDuty <= 0) return 0;
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

function reconfigureQiMonitor(tauMs: number, dtMs: number): void {
  const clampedTau = Math.max(0.5, tauMs);
  const clampedDt = clampNumber(dtMs, 0.25, 10);
  const tauChanged = Math.abs(clampedTau - qiMonitorTau_ms) > 1e-3;
  const dtChanged = Math.abs(clampedDt - qiMonitorDt_ms) > 1e-3;
  if (!tauChanged && !dtChanged) return;
  qiMonitor.reconfigure({ tau_s_ms: clampedTau, dt_ms: clampedDt });
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
  // Convert sim to pipeline state format
  const state = {
    ...initializePipelineState(),
    gap_nm: sim.gap ?? 1,
    sag_nm: sim.sagDepth ?? 16,
    temperature_K: sim.temperature ?? 20,
    modulationFreq_GHz: sim.dynamicConfig?.modulationFreqGHz ?? DEFAULT_MODULATION_FREQ_GHZ,
    currentMode: sim.mode ?? 'hover',
    gammaGeo: sim.amps?.gammaGeo ?? 26,
    qMechanical: sim.amps?.qMechanical ?? 1,
    qCavity: sim.dynamicConfig?.cavityQ ?? 1e9,
    gammaVanDenBroeck: sim.amps?.gammaVanDenBroeck ?? 3.83e1,
    qSpoilingFactor: sim.amps?.qSpoilingFactor ?? 1,
    dutyCycle: sim.dynamicConfig?.dutyCycle ?? 0.14,
    sectorCount: sim.dynamicConfig?.sectorCount ?? 400,
    exoticMassTarget_kg: sim.exoticMassTarget_kg ?? 1405,
    dynamicConfig: sim.dynamicConfig ?? null,
  };

  // Run the unified pipeline calculation
  const result = await calculateEnergyPipeline(state);

  // ---- Normalize Light–Crossing payload for the client API -------------------
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

  // ---- Natário tensors (kept under natario.*; adapter also accepts top-level)
  const natario = {
    metricMode:  !!(result.natario?.metricMode),
    lapseN:      finite(result.natario?.lapseN),
    shiftBeta:   arrN(result.natario?.shiftBeta, 3),
    gSpatialDiag:arrN(result.natario?.gSpatialDiag, 3),
    gSpatialSym: arrN(result.natario?.gSpatialSym, 6),
    viewForward: arrN(result.natario?.viewForward, 3),
    g0i:         arrN(result.natario?.g0i, 3),
  // pass-through diagnostics from Natário (unit-annotated upstream)
  dutyFactor:      finite(result.natario?.dutyFactor),       // unitless (μs/μs)
  // NOTE: natario.thetaScaleCore_sqrtDuty is the explicit Natário sqrt-duty
  // diagnostic (√duty semantics). Prefer `_sqrtDuty` when inspecting Natário
  // outputs; it intentionally excludes γ_VdB and is NOT the canonical ship-wide
  // theta used by engines (engines should use `thetaScale` / `thetaScaleExpected`).
  // Keep the legacy `thetaScaleCore` key for back-compat but mark it deprecated
  // here by mapping it from the `_sqrtDuty` alias when present.
  thetaScaleCore_sqrtDuty: finite((result as any).natario?.thetaScaleCore_sqrtDuty ?? (result as any).natario?.thetaScaleCore),
  /* @deprecated legacy key; prefer thetaScaleCore_sqrtDuty */
  thetaScaleCore: finite((result as any).natario?.thetaScaleCore ?? (result as any).natario?.thetaScaleCore_sqrtDuty),
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



  const warpUniforms = {
    // physics (visual) — mass stays split and separate
    gammaGeo: result.gammaGeo,
    qSpoilingFactor: result.qSpoilingFactor,
    gammaVanDenBroeck: (result as any).gammaVanDenBroeck_vis,   // visual gamma
    gammaVanDenBroeck_vis: (result as any).gammaVanDenBroeck_vis,
    gammaVanDenBroeck_mass: (result as any).gammaVanDenBroeck_mass,

    // Ford–Roman duty (ship-wide, sector-averaged)
    dutyEffectiveFR,

    // UI label fields (harmless to include)
    dutyCycle: result.dutyCycle,
    sectorCount: result.sectorCount,
    sectors: result.concurrentSectors,   // concurrent/live
    currentMode: result.currentMode,

    // viewer defaults — visual policy only; parity/ridge set client-side
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
  const uniformsExplain = {
    // Human-readable “where did this come from?” pointers
    sources: {
      gammaGeo:               "server.result.gammaGeo (pipeline state)",
      qSpoilingFactor:        "server.result.qSpoilingFactor (mode policy / pipeline)",
      qCavity:                "server.result.qCavity (dynamic cavity Q)",
      gammaVanDenBroeck_vis:  "server.(gammaVanDenBroeck_vis) — fixed visual seed unless standby",
      gammaVanDenBroeck_mass: "server.(gammaVanDenBroeck_mass) — calibrated to hit M_target",
      dutyEffectiveFR:        "server.derived (burstLocal × S_live / S_total; Ford–Roman window)",
      dutyCycle:              "server.result.dutyCycle (UI duty from MODE_CONFIGS)",
      sectorCount:            "server.result.sectorCount (TOTAL sectors; usually 400)",
      sectors:                "server.result.concurrentSectors (live concurrent sectors)",
      currentMode:            "server.result.currentMode (authoritative)",
      hull:                   "server.result.hull (Lx,Ly,Lz,wallThickness_m)",
      wallWidth_m:            "server.result.hull.wallThickness_m",
      viewAvg:                "policy: true (clients render FR-averaged θ by default)",
    },

    // Ford–Roman duty derivation (numbers)
    fordRomanDuty: {
      formula: "d_eff = burstLocal × S_live / S_total",
      burstLocal: PAPER_DUTY.BURST_DUTY_LOCAL, // 0.01
      S_total: result.sectorCount,
      S_live: result.concurrentSectors,
      computed_d_eff: dutyEffectiveFR,
    },

    // θ audit + the inputs used to compute it (for transparency)
    thetaAudit: {
      note: "θ audit — raw vs calibrated VdB",
      equation: "θ = γ_geo^3 · q · γ_VdB · d_eff", 
      mode: MODEL_MODE, // "raw" | "calibrated"
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

      // amps and Q
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
    },

    // Base equations (render these + a line below with the live values)
    equations: {
      d_eff: "d_eff = burstLocal · S_live / S_total",
      theta_expected: "θ_expected = γ_geo^3 · q · γ_VdB(vis) · √d_eff",
      U_static: "U_static = [-π²·ℏ·c/(720·a⁴)] · A_tile",
      U_geo: "U_geo = γ_geo^3 · U_static",
      U_Q: "U_Q = q_mech · U_geo",
      P_avg: "P_avg = |U_Q| · ω / Q · N_tiles · d_eff",
      M_exotic: "M = [U_static · γ_geo^3 · Q_burst · γ_VdB · d_eff] · N_tiles / c²",
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
    qCavity: result.qCavity,
    qSpoilingFactor: result.qSpoilingFactor,

  // Strobing parameters
  dutyCycle: result.dutyCycle,
  sectorStrobing: result.sectorStrobing,

    // Natário / stress-energy surface (time-averaged)
    T00_avg: (result as any).warp?.stressEnergyTensor?.T00 ?? (result as any).stressEnergy?.T00,
    T11_avg: (result as any).warp?.stressEnergyTensor?.T11 ?? (result as any).stressEnergy?.T11,
    T22_avg: (result as any).warp?.stressEnergyTensor?.T22 ?? (result as any).stressEnergy?.T22,
    T33_avg: (result as any).warp?.stressEnergyTensor?.T33 ?? (result as any).stressEnergy?.T33,
    beta_avg: (result as any).warp?.betaAvg ?? (result as any).warp?.natarioShiftAmplitude ?? (result as any).stressEnergy?.beta_avg,
    gr_ok: (result as any).warp?.validationSummary?.warpFieldStable ?? true,
    natarioConstraint: (result as any).warp?.isZeroExpansion ?? result.natarioConstraint,

    // Diagnostics
    warpModule: (result as any).warp ? {
      timeMs: (result as any).warp.calculationTime ?? 0,
      status: (result as any).warp.validationSummary?.overallStatus ?? 'optimal'
    } : { timeMs: 0, status: 'optimal' },

    // Normalized, renderer-ready data structures
    lc,
    natario,
    // Duty authority (adapter selects by mode; renderer never fabricates)
    ...duty,
    // For adapter mode selection & viewers
    mode: sim.mode ?? result.currentMode ?? 'hover'
  };
}

/**
 * Sample the Natário bell displacement on an ellipsoidal shell using the same math as the renderer.
 * Returns ~ nTheta*nPhi points, suitable for JSON compare or CSV export.
 */
/**
 * Sample the Natário bell displacement on an ellipsoidal shell using the same math as the renderer.
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
  const nPhi   = Math.max(2, req.nPhi ?? 32); // need ≥2 to avoid (nPhi-1)=0
  const sectors = Math.max(1, Math.floor(req.sectors ?? state.sectorCount ?? TOTAL_SECTORS));
  const split   = Number.isFinite(req.split as number) ? Math.max(0, Math.floor(req.split!)) : Math.floor(sectors / 2);

  const totalSamples = nTheta * nPhi;
  ensureFieldSampleCapacity(totalSamples);

  // Canonical bell width in *ellipsoidal* radius units: wρ = w_m / a_eff.
  // Use harmonic-mean effective radius to match viewer/renderer ρ-units.
  const aEff = 3 / (1/axes.a + 1/axes.b + 1/axes.c);  // ✅ harmonic mean (matches viewer)
  const w_m = req.wallWidth_m ?? Math.max(1e-6, (state.sag_nm ?? 16) * 1e-9); // meters
  const w_rho = Math.max(1e-6, w_m / aEff);

  // Match renderer's gain chain (display-focused): disp ~ γ_geo^3 * q_spoil * bell * sgn
  const gammaGeo   = state.gammaGeo ?? 26;
  const qSpoil     = state.qSpoilingFactor ?? 1;
  const geoAmp     = Math.pow(gammaGeo, 3);               // *** cubic, same as pipeline ***
  const vizGain    = 1.0;                                 // keep physics-scale here; renderer may apply extra gain

  let idx = 0;

  for (let i = 0; i < nTheta; i++) {
    const theta = (i / nTheta) * 2 * Math.PI;      // [-π, π] ring index
    // --- Smooth sector strobing (matches renderer exactly) ---
    const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
    const sectorIdx = Math.floor(u * sectors);
    const distToSplit = (sectorIdx - split + 0.5);
    const strobeWidth = 0.75;                 // same as renderer
    const softSign = (x: number) => Math.tanh(x); // smooth ±1 transition
    const sgn = softSign(-distToSplit / strobeWidth); // smooth sector sign

    for (let j = 0; j < nPhi; j++) {
      const phi = -Math.PI / 2 + (j / (nPhi - 1)) * Math.PI; // [-π/2, π/2]
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

      const bell = Math.exp(- (sd / w_rho) * (sd / w_rho)); // Natário canonical bell

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





