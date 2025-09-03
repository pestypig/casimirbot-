// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// Model mode switch: raw physics or paper-calibrated targets
// Explicit default: paper-calibrated targets; set HELIX_MODEL_MODE=raw to bypass
const MODEL_MODE: 'calibrated' | 'raw' =
  (process.env.HELIX_MODEL_MODE === 'raw') ? 'raw' : 'calibrated';

// ── Physics Constants (centralized) ──────────────────────────────────────────
import { HBAR, C } from "./physics-const.js";

// Performance guardrails for billion-tile calculations
const TILE_EDGE_MAX = 2048;          // safe cap for any "edge" dimension fed into dynamic helpers
const DYN_TILECOUNT_HARD_SKIP = 5e7; // >50M tiles → skip dynamic per-tile-ish helpers (use aggregate)

// Production-quiet logging toggle
const DEBUG_PIPE = process.env.NODE_ENV !== 'production' && (process.env.HELIX_DEBUG?.includes('pipeline') ?? false);
import { calculateNatarioMetric } from '../modules/dynamic/natario-metric.js';
import { calculateDynamicCasimirWithNatario } from '../modules/dynamic/dynamic-casimir.js';
import { calculateCasimirEnergy } from '../modules/sim_core/static-casimir.js';
import { toPipelineStressEnergy } from '../modules/dynamic/stress-energy-equations.js';
import warpBubbleModule from '../modules/warp/warp-module.js';

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
  hull?: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number }; // Paper-authentic: ~1.0m (0.3 booster + 0.5 lattice + 0.2 service)

  // Mode parameters
  currentMode: 'hover' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  dutyShip: number;           // Ship-wide effective duty (promoted from any)
  sectorCount: number;        // Total sectors (always 400)
  concurrentSectors: number; // Live concurrent sectors (1-2)
  sectorStrobing: number;     // Legacy alias for UI compatibility
  qSpoilingFactor: number;

  // Physics parameters
  gammaGeo: number;
  qMechanical: number;
  qCavity: number;
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

  // Internal calculation helpers (optional fields)
  __sectors?: any;          // Sector calculation cache
  __fr?: any;               // Ford-Roman calculation cache

  // System status
  fordRomanCompliance: boolean;
  natarioConstraint: boolean;
  curvatureLimit: boolean;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';

  // Strobing and timing properties
  strobeHz?: number;
  sectorPeriod_ms?: number;
  dutyBurst?: number;
  dutyEffective_FR?: number;

  // Model mode for client consistency
  modelMode?: 'calibrated' | 'raw';
}

// Physical constants
const HBAR_C = HBAR * C;             // ℏc ≈ 3.16152677e-26 [J·m] for Casimir calculations
const NM_TO_M = 1e-9;
const CM2_TO_M2 = 1e-4;

// ── Paper-backed constants (consolidated physics)
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

// ── Metric imports (induced surface metric on hull)
import {
  firstFundamentalForm,
} from "../src/metric.js";

// --- Mode power/mass policy (targets are *hit* by scaling qMechanical for power and γ_VdB for mass) ---
// NOTE: All P_target_* values are in **watts** (W).
const MODE_POLICY = {
  hover:     { S_live: 1 as const,     P_target_W: 83.3e6,   M_target_kg: 1405 },
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

/** Ellipsoid surface area via induced metric integral (replaces Knud–Thomsen).
 *  a = Lx/2, b = Ly/2, c = Lz/2 (meters). Numerical quadrature over (θ,φ).
 */
function surfaceAreaEllipsoidMetric(Lx_m: number, Ly_m: number, Lz_m: number,
  nTheta = 256, nPhi = 128): number {
  const a = Lx_m/2, b = Ly_m/2, c = Lz_m/2;
  const dθ = (2*Math.PI) / nTheta;
  const dφ = Math.PI / (nPhi-1); // φ ∈ [-π/2, π/2]
  let A = 0;
  for (let i=0; i<nTheta; i++) {
    const θ = i * dθ;
    for (let j=0; j<nPhi; j++) {
      const φ = -Math.PI/2 + j * dφ;
      const { dA } = firstFundamentalForm(a,b,c, θ, φ);
      A += dA * dθ * dφ;
    }
  }
  return A;
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
    modulationFreq_GHz: 15,

    // Hull geometry (actual 1.007 km needle dimensions)
    hull: {
      Lx_m: 1007,  // length (needle axis)
      Ly_m: 264,   // width  
      Lz_m: 173,   // height
      wallThickness_m: 1.0  // Paper-authentic: ~1.0m (0.3 booster + 0.5 lattice + 0.2 service)
    },

    // Mode defaults (hover)
    currentMode: 'hover',
    dutyCycle: 0.14,
    dutyShip: 0.000025,      // Ship-wide effective duty (will be recalculated)
    sectorCount: 400,        // Total sectors (always 400)
    concurrentSectors: 1,    // Live concurrent sectors (default 1)
    sectorStrobing: 1,       // Legacy alias
    qSpoilingFactor: 1,

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
    overallStatus: 'NOMINAL'
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
export async function calculateEnergyPipeline(state: EnergyPipelineState): Promise<EnergyPipelineState> {
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
  const ui = MODE_CONFIGS[state.currentMode];
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
  state.modulationFreq_GHz = Math.max(0.001, Math.min(1000, state.modulationFreq_GHz ?? 15));

  // Clamp gap_nm to physically reasonable range for Casimir calculations
  state.gap_nm = Math.max(0.1, Math.min(1000, state.gap_nm));

  // Clamp tileArea_cm2 to prevent invalid tile counting
  state.tileArea_cm2 = Math.max(0.01, Math.min(10000, state.tileArea_cm2));

  const gamma3 = Math.pow(state.gammaGeo, 3);
  state.U_geo = state.U_static * gamma3;
  state.U_Q   = state.U_geo * state.qMechanical;  // ✅ apply qMechanical from start

  // 6) Power — raw first, then power-only calibration via qMechanical
  const omega = 2 * Math.PI * (state.modulationFreq_GHz ?? 15) * 1e9;
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
  (state as any).thetaScaleExpected = 
    Math.pow(state.gammaGeo, 3) *
    (state.qSpoilingFactor ?? 1) *
    ((state as any).gammaVanDenBroeck_vis ?? PAPER_VDB.GAMMA_VDB) *
    Math.sqrt(Math.max(1e-12, state.dutyEffective_FR ?? d_eff));

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
  state.fordRomanCompliance = state.zeta < (ui.zeta_max ?? 1.0); // Use mode-specific max

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
  const f_m_ts = (state.modulationFreq_GHz ?? 15) * 1e9; // Hz
  const T_m_ts = 1 / f_m_ts;                              // s

  const T_long = L_long / C;   // s
  const T_geom = L_geom / C;   // s

  state.TS_long = T_long / T_m_ts;   // most conservative
  state.TS_geom = T_geom / T_m_ts;   // typical
  state.TS_ratio = state.TS_long;    // keep existing field = conservative

  // Wall-scale TS (often more relevant than hull-scale)
  const w = state.hull?.wallThickness_m ?? 1.0;
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

  // UI field updates logging (after MODE_CONFIGS applied)
  if (DEBUG_PIPE) console.log("[PIPELINE_UI]", {
    dutyUI_after: state.dutyCycle, 
    sectorCount: state.sectorCount,
    concurrentSectors: state.concurrentSectors,
    sectorStrobing: state.sectorStrobing,
    qSpoilingFactor: state.qSpoilingFactor
  });

  // --- Construct light-crossing packet (filled correctly below) ---
  const f_m = (state.modulationFreq_GHz ?? 15) * 1e9;     // Hz
  const T_m_s = 1 / f_m;                                  // s
  const tauLC_s = (state.hull?.wallThickness_m ?? 1.0) / C;
  const lightCrossing = {
    tauLC_ms: tauLC_s * 1e3,
    burst_ms: PAPER_DUTY.BURST_DUTY_LOCAL * T_m_s * 1e3,
    dwell_ms: T_m_s * 1e3,
  };
  (state as any).lightCrossing = lightCrossing;

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
      // **CRITICAL FIX**: Pass calibrated pipeline mass to avoid independent calculation
      exoticMassTarget_kg: state.M_exotic, // Use calibrated mass (1405 kg) from pipeline
      dynamicConfig: {
        modulationFreqGHz: state.modulationFreq_GHz ?? 15,
        strokeAmplitudePm: 50,
        burstLengthUs: 10,
        cycleLengthUs: 1000,
        cavityQ: state.qCavity ?? 1e9,
        sectorCount: state.sectorCount ?? 400,
        sectorDuty: state.dutyEffective_FR ?? 2.5e-5, // warp module payload
        pulseFrequencyGHz: state.modulationFreq_GHz ?? 15,
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

  return state;
}

// Mode switching function
export async function switchMode(state: EnergyPipelineState, newMode: EnergyPipelineState['currentMode']): Promise<EnergyPipelineState> {
  state.currentMode = newMode;
  return await calculateEnergyPipeline(state);
}

// Parameter update function
export async function updateParameters(state: EnergyPipelineState, params: Partial<EnergyPipelineState>): Promise<EnergyPipelineState> {
  Object.assign(state, params);
  return await calculateEnergyPipeline(state);
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
    modulationFreq_GHz: sim.dynamicConfig?.modulationFreqGHz ?? 15,
    currentMode: sim.mode ?? 'hover',
    gammaGeo: sim.amps?.gammaGeo ?? 26,
    qMechanical: sim.amps?.qMechanical ?? 1,
    qCavity: sim.dynamicConfig?.cavityQ ?? 1e9,
    gammaVanDenBroeck: sim.amps?.gammaVanDenBroeck ?? 3.83e1,
    qSpoilingFactor: sim.amps?.qSpoilingFactor ?? 1,
    dutyCycle: sim.dynamicConfig?.dutyCycle ?? 0.14,
    sectorCount: sim.dynamicConfig?.sectorCount ?? 400,
    exoticMassTarget_kg: sim.exoticMassTarget_kg ?? 1405
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
  const duty = {
    dutyUsed:        finite(result.dutyUsed),
    dutyEffectiveFR: finite(result.dutyEffectiveFR),
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
  };

  // Trust the pipeline's FR duty (ship-wide, sector-averaged)
  const dutyEffectiveFR = result.dutyEffective_FR ?? result.dutyShip ?? (result as any).dutyEff ?? 2.5e-5;

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
    wallWidth_m: result.hull?.wallThickness_m ?? 1.0,

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
      note: "Expected θ: γ_geo^3 · q · γ_VdB(vis) · √d_eff",
      thetaScaleExpected: (result as any).thetaScaleExpected,
      inputs: {
        gammaGeo: result.gammaGeo,
        q: result.qSpoilingFactor,
        gammaVdB_vis: (result as any).gammaVanDenBroeck_vis,
        d_eff: dutyEffectiveFR,
      },
    },

    // Live numeric values the cards can render directly
    live: {
      // sectors / duty
      S_total: result.sectorCount,
      S_live: result.concurrentSectors,
      dutyCycle: result.dutyCycle,
      dutyEffectiveFR,

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
    qCavity: result.qCavity,
    qSpoilingFactor: result.qSpoilingFactor,

    // Strobing parameters
    dutyCycle: result.dutyCycle,
    sectorStrobing: result.sectorStrobing,
    dutyEffectiveFR,  // authoritative

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
export function sampleDisplacementField(state: EnergyPipelineState, req: FieldRequest = {}): FieldSample[] {
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

  // Canonical bell width in *ellipsoidal* radius units: wρ = w_m / a_eff.
  // Use harmonic-mean effective radius to match viewer/renderer ρ-units.
  const aEff = 3 / (1/axes.a + 1/axes.b + 1/axes.c);  // ✅ harmonic mean (matches viewer)
  const w_m = req.wallWidth_m ?? Math.max(1e-6, (state.sag_nm ?? 16) * 1e-9); // meters
  const w_rho = Math.max(1e-6, w_m / aEff);

  // Match renderer's gain chain (display-focused): disp ∝ γ_geo^3 * q_spoil * bell * sgn
  const gammaGeo   = state.gammaGeo ?? 26;
  const qSpoil     = state.qSpoilingFactor ?? 1;
  const geoAmp     = Math.pow(gammaGeo, 3);               // *** cubic, same as pipeline ***
  const vizGain    = 1.0;                                 // keep physics-scale here; renderer may apply extra gain

  const samples: FieldSample[] = [];

  for (let i = 0; i < nTheta; i++) {
    const theta = (i / nTheta) * 2 * Math.PI;      // [-π, π] ring index
    // --- Smooth sector strobing (matches renderer exactly) ---
    const u = (theta < 0 ? theta + 2 * Math.PI : theta) / (2 * Math.PI);
    const sectorIdx = Math.floor(u * sectors);
    // Distance from current split boundary in sector units
    const distToSplit = (sectorIdx - split + 0.5);
    // Wider width => softer transition across boundary
    const strobeWidth = 0.75;                 // same as renderer
    const softSign = (x: number) => Math.tanh(x); // smooth ±1 transition
    const sgn = softSign(-distToSplit / strobeWidth); // smooth sector sign

    for (let j = 0; j < nPhi; j++) {
      const phi = -Math.PI / 2 + (j / (nPhi - 1)) * Math.PI; // [-π/2, π/2]
      // Base shell point (ρ≈1). Optional radial offset in meters.
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
      // For future implementation: calculate normal vectors and use softSign for smooth polarity
      const front = 1.0; // placeholder - can add soft polarity later if needed

      // --- Physics-consistent amplitude with soft clamp ---
      let disp = vizGain * geoAmp * qSpoil * wallWin * bell * sgn * front;

      // Soft clamp (same as renderer to avoid flat shelves)
      const maxPush = 0.10;
      const softness = 0.6;
      disp = maxPush * Math.tanh(disp / (softness * maxPush));

      // Calculate proper area element from metric at this surface point
      const { dA } = firstFundamentalForm(axes.a, axes.b, axes.c, theta, phi);

      samples.push({ p, rho, bell, n, sgn, disp, dA });
    }
  }
  return samples;
}