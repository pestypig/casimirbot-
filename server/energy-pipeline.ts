// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// ── Paper-backed constants (module scope)
const TOTAL_SECTORS    = 400;
const BURST_DUTY_LOCAL = 0.01;  // 10 µs / 1 ms
const Q_BURST          = 1e9;   // active-window Q
const GAMMA_VDB        = 1e11;  // fixed seed
const RADIAL_LAYERS    = 10;    // surface × radial lattice

// Model mode: force to raw physics (no calibration)
const MODEL_MODE: 'calibrated' | 'raw' = 'raw';

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
}

export interface FieldRequest {
  // sampling grid
  nTheta?: number;   // default 64
  nPhi?: number;     // default 32
  shellOffset?: number; // meters; 0 = on shell, >0 outside, <0 inside (default 0)
  // physics
  wallWidth_m?: number; // bell width wρ in meters (default from sag_nm)
  sectors?: number;     // sector count (default state.sectorStrobing)
  split?: number;       // (+)/(−) split index (default floor(sectors/2))
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
  shipRadius_m: number;
  gap_nm: number;
  sag_nm: number;
  temperature_K: number;
  modulationFreq_GHz: number;
  
  // Hull geometry
  hull?: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  
  // Mode parameters
  currentMode: 'hover' | 'cruise' | 'emergency' | 'standby';
  dutyCycle: number;
  sectorStrobing: number;
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
  dutyEff: number;          // Effective duty cycle (BURST_DUTY_LOCAL * frac_active)
  
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
const HBAR = 1.0545718e-34;          // Planck constant over 2π [J·s]
const C = 299792458;                 // Speed of light [m/s]
const HBAR_C = 1.98644586e-25;      // ℏc [J·m] for Casimir calculations
const PI = Math.PI;
const NM_TO_M = 1e-9;
const MM_TO_M = 1e-3;
const CM2_TO_M2 = 1e-4;

// Mode configurations (physics parameters only, no hard locks)
export const MODE_CONFIGS = {
  hover: {
    dutyCycle: 0.14,       // UI parameter
    qSpoilingFactor: 1,
    description: "High-power hover mode for station-keeping"
  },
  cruise: {
    dutyCycle: 0.005,
    qSpoilingFactor: 0.625,
    description: "Low-power cruise mode for sustained travel"
  },
  emergency: {
    dutyCycle: 0.50,
    qSpoilingFactor: 1,
    description: "Maximum power emergency mode"
  },
  standby: {
    dutyCycle: 0.001,
    qSpoilingFactor: 0.1,
    description: "Minimal power standby mode"
  }
};

/** Ellipsoid surface area via Knud–Thomsen (very good for prolate/needle shapes). 
 *  a = Lx/2, b = Ly/2, c = Lz/2 (meters)
 */
function surfaceAreaEllipsoidFromHullDims(Lx_m: number, Ly_m: number, Lz_m: number): number {
  const a = Lx_m / 2;
  const b = Ly_m / 2;
  const c = Lz_m / 2;
  const p = 1.6075; // Knud–Thomsen exponent
  const term1 = Math.pow(a * b, p);
  const term2 = Math.pow(a * c, p);
  const term3 = Math.pow(b * c, p);
  return 4 * Math.PI * Math.pow((term1 + term2 + term3) / 3, 1 / p);
}

// Initialize pipeline state with defaults
export function initializePipelineState(): EnergyPipelineState {
  return {
    // Needle Hull full scale defaults for HELIX-CORE
    tileArea_cm2: 5,
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
      wallThickness_m: 6.0  // physical wall thickness for Natário bell (meters)
    },
    
    // Mode defaults (hover)
    currentMode: 'hover',
    dutyCycle: 0.14,
    sectorStrobing: 400,                   // paper's S=400 partition count for all modes
    qSpoilingFactor: 1,
    
    // Physics defaults
    gammaGeo: 26,
    qMechanical: 1,                        // paper core has no extra mechanical gain
    qCavity: 1e9,
    gammaVanDenBroeck: 1e11,  // Physics seed factor (configurable via env)
    exoticMassTarget_kg: 1405,  // Reference target (not a lock)
    
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
    dutyEff: 0,
    
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
  const E_overA = -(PI * PI * HBAR_C) / (720 * Math.pow(gap_m, 3)); // J/m^2
  return E_overA * area_m2; // J
}

// Main pipeline calculation
export function calculateEnergyPipeline(state: EnergyPipelineState): EnergyPipelineState {
  // --- Surface area & tile count from actual hull dims ---
  const tileArea_m2 = state.tileArea_cm2 * CM2_TO_M2;

  // If a full rectangular needle + rounded caps is added later, we can refine this.
  // For now, the ellipsoid (a=Lx/2, b=Ly/2, c=Lz/2) is an excellent approximation.
  const hullArea_m2 = surfaceAreaEllipsoidFromHullDims(state.hull!.Lx_m, state.hull!.Ly_m, state.hull!.Lz_m);
  
  // Store hull area for Bridge display
  state.hullArea_m2 = hullArea_m2;

  // Derived tile count (surface tiling × 10 radial layers)
  state.N_tiles = Math.max(1, Math.floor(hullArea_m2 / tileArea_m2) * RADIAL_LAYERS);
  
  // Step 1: Static Casimir energy
  state.U_static = calculateStaticCasimir(state.gap_nm, tileArea_m2);
  
  // Step 2: Geometric amplification (γ × U_static, not γ³)
  // The research papers use γ=26 as a linear amplification factor
  state.U_geo = state.U_static * state.gammaGeo;
  
  // Step 3: Stored-energy (paper core): no extra mechanical gain.
  // Keep qMechanical as a *calibration* knob only (optional, below).
  state.U_Q = state.U_geo;
  
  // Step 4: Apply mode configuration
  const modeConfig = MODE_CONFIGS[state.currentMode];
  state.dutyCycle = modeConfig.dutyCycle;
  // sectorStrobing remains the *partition count* S=400 per paper
  state.sectorStrobing = TOTAL_SECTORS;
  state.qSpoilingFactor = modeConfig.qSpoilingFactor;
  
  // Step 5: γ_VdB (fixed, raw physics)
  state.gammaVanDenBroeck = GAMMA_VDB;  // fixed, raw physics
  
  // Step 6: One-live-of-400 schedule at any instant (paper method).
  const S             = TOTAL_SECTORS;
  const S_instant     = 1; // (zero-β hover variant can set 2)
  const frac_active   = S_instant / S;         // always 1/400
  const tilesPerSect  = Math.floor(state.N_tiles / S);

  state.activeSectors  = S_instant;
  state.activeFraction = frac_active;
  state.tilesPerSector = tilesPerSect;
  state.activeTiles    = tilesPerSect * S_instant;

  // Ship-wide effective duty is the LOCAL burst duty times active sector fraction
  const d_eff = BURST_DUTY_LOCAL * frac_active;  // 0.01/400 = 2.5e-5
  state.dutyEff = d_eff;

  // --- Invariants & guard-rails (after computing d_eff) ---
  if (Math.abs(state.U_Q - state.U_geo) > Math.abs(state.U_geo) * 1e-12) {
    console.warn("[PIPELINE][WARN] U_Q drifted from U_geo; forcing raw core U_Q = U_geo");
    state.U_Q = state.U_geo; // ensure no hidden qMechanical gain leaks back in
  }

  // Freeze qMechanical=1 in raw core unless cruise calibration is explicitly enabled
  if (process.env.CRUISE_CALIBRATION !== '1' && Math.abs(state.qMechanical - 1) > 1e-12) {
    console.warn("[PIPELINE][WARN] qMechanical != 1 in raw mode; clamping to 1");
    state.qMechanical = 1;
  }

  // Visibility logs to confirm the expected scaling
  console.log("[CHECK] dutyEff=", state.dutyEff, " (expected ~2.5e-5)");
  console.log("[CHECK] qMechanical=", state.qMechanical, " (expected 1 in raw)");
  console.log("[CHECK] U_static, U_geo, U_Q:", state.U_static, state.U_geo, state.U_Q);

  // Step 7: Duty-cycled energy (physics calculation)
  state.U_cycle = state.U_Q * d_eff;
  
  /* ──────────────────────────────
     Step 8: Power (raw physics - burst-only Q and d_eff)
  ──────────────────────────────── */
  const omega = 2 * PI * (state.modulationFreq_GHz ?? 15) * 1e9;

  const U_geo     = state.U_geo;                  // = γ_geo · U_static
  const U_Q_store = Math.abs(state.U_Q);          // no mech gain in raw core
  // Per-tile dissipation during the 10 μs ON-window
  const P_loss_per_tile_raw = U_Q_store * omega / Q_BURST;

  // Ship-average: only a fraction of tiles are live, and only during d_eff
  const P_total_W = P_loss_per_tile_raw * state.N_tiles * d_eff;

  state.P_loss_raw = P_loss_per_tile_raw;
  state.P_avg      = P_total_W / 1e6;   // MW (paper method)
  
  // ✓ Paper-method physics: Power = P_per_tile × N_tiles × d_eff 
  // ✓ Reduction from old system: only qMechanical (50,000×), duty was already correct

  // Optional cruise power calibration (paper targets via your two knobs)
  if (state.currentMode === 'cruise' && process.env.CRUISE_CALIBRATION === '1') {
    const P_target_W = 7.4e6;            // 7.4 MW target
    const scale = P_target_W / (P_total_W || 1e-30);
    state.qMechanical *= scale;          // knob #1: power only
    state.U_Q        = state.U_geo * state.qMechanical;
    const P_tile_cal = Math.abs(state.U_Q) * omega / Q_BURST;
    state.P_avg      = (P_tile_cal * state.N_tiles * d_eff) / 1e6;
    console.log("[CRUISE CALIBRATION] qMechanical scaled by", scale.toExponential(3), "→", state.qMechanical.toExponential(3));
  }

  /* ──────────────────────────────
     Step 9: Exotic mass (raw physics - use γ_geo³ × Q_burst × γ_VdB × d_eff)
  ──────────────────────────────── */
  const U_abs   = Math.abs(state.U_static);
  const geo3    = Math.pow(state.gammaGeo ?? 26, 3);

  const E_enh   = U_abs * geo3 * Q_BURST * state.gammaVanDenBroeck * d_eff; // J per tile (avg)
  const m_tile  = E_enh / (C * C);
  const M_total = m_tile * state.N_tiles;

  state.M_exotic_raw = M_total;
  state.M_exotic     = M_total;   // physics-first
  state.massCalibration = 1;      // no overwrites
  
  // ✓ Paper-method physics: Mass = E_enh × N_tiles / c²
  // ✓ No change from old system: mass path was already using correct d_eff

  // ---- Physics self-check (audit) -------------------------------------------
  (function audit() {
    const f_m   = (state.modulationFreq_GHz ?? 15) * 1e9;
    const omega = 2 * PI * f_m;

    const d_eff = state.dutyEff;                 // should be 0.01/400
    const N     = state.N_tiles;
    const UQ    = Math.abs(state.U_Q);           // should equal |U_geo| in raw core

    // Expected power (W) from first principles
    const P_tile_W = UQ * omega / Q_BURST;
    const P_W_exp  = P_tile_W * N * d_eff;
    const P_MW_exp = P_W_exp / 1e6;

    // Expected mass (kg) from first principles
    const U_abs  = Math.abs(state.U_static);
    const geo3   = Math.pow(state.gammaGeo, 3);
    const E_tile = U_abs * geo3 * Q_BURST * state.gammaVanDenBroeck * d_eff; // J per tile
    const M_exp  = (E_tile / (C*C)) * N;

    // Tolerances (loose: just catching order-of-mag errors)
    const near = (a:number,b:number,rtol=1e-3,atol=1e-6)=> Math.abs(a-b) <= (atol + rtol*Math.max(1,Math.abs(a),Math.abs(b)));

    if (!near(state.P_avg, P_MW_exp, 5e-3)) {
      console.warn("[AUDIT] P_avg mismatch",
        { reported_MW: state.P_avg, expected_MW: P_MW_exp, ratio: (state.P_avg)/(P_MW_exp||1e-30) });
      // Keep the expected physics authority:
      state.P_avg = P_MW_exp;
    }
    if (!near(state.M_exotic, M_exp, 5e-3)) {
      console.warn("[AUDIT] M_exotic mismatch",
        { reported_kg: state.M_exotic, expected_kg: M_exp, ratio: (state.M_exotic)/(M_exp||1e-30) });
      state.M_exotic = M_exp;
      state.M_exotic_raw = M_exp;
    }
  })();

  // Optional cruise mode mass calibration (dial γ_VdB to hit 1405 kg target)
  if (state.currentMode === 'cruise' && process.env.CRUISE_CALIBRATION === '1') {
    const M_target = 1405;                            // 1.405×10³ kg target
    const scaleVD  = M_target / (state.M_exotic_raw || 1e-30);
    state.gammaVanDenBroeck *= scaleVD;                // adjust Van-den-Broeck boost
    // recompute with updated γ_VdB
    const E_enh_cal = U_abs * geo3 * Q_BURST * state.gammaVanDenBroeck * d_eff;
    state.M_exotic_raw = Math.max(0, E_enh_cal / (C * C) * state.N_tiles);
    state.M_exotic     = state.M_exotic_raw;
    console.log("[CRUISE CALIBRATION] γ_VdB scaled by", scaleVD.toExponential(3), "→", state.gammaVanDenBroeck.toExponential(3));
  }
  
  // Physics logging for debugging
  console.log("[PIPELINE]", {
    duty: state.dutyCycle, sectors: state.sectorStrobing, N: state.N_tiles,
    gammaGeo: state.gammaGeo, qCavity: state.qCavity, gammaVdB: state.gammaVanDenBroeck,
    U_static: state.U_static, U_Q: state.U_Q, P_loss_raw: state.P_loss_raw,
    P_avg_MW: state.P_avg, M_raw: state.M_exotic_raw, M_final: state.M_exotic,
    massCal: state.massCalibration
  });

  console.log("[REPORT]", JSON.stringify({
    N_tiles: state.N_tiles,
    dutyEff: state.dutyEff,
    gammaGeo: state.gammaGeo,
    gammaVdB: state.gammaVanDenBroeck,
    Q_burst: Q_BURST,
    gap_nm: state.gap_nm,
    tileArea_cm2: state.tileArea_cm2,
    U_static_J: state.U_static,
    U_geo_J: state.U_geo,
    U_Q_J: state.U_Q,
    omega: 2*PI*(state.modulationFreq_GHz ?? 15)*1e9,
    P_tile_W: Math.abs(state.U_Q) * (2*PI*(state.modulationFreq_GHz ?? 15)*1e9) / Q_BURST,
    P_avg_MW: state.P_avg,
    M_exotic_kg: state.M_exotic
  }));
  
  /* ──────────────────────────────
     Additional metrics (derived)
  ──────────────────────────────── */

  // --- Time-scale separation (TS) using actual hull size ---
  const { Lx_m, Ly_m, Lz_m } = state.hull!;
  const L_long = Math.max(Lx_m, Ly_m, Lz_m);                // conservative: longest light-crossing
  const L_geom = Math.cbrt(Lx_m * Ly_m * Lz_m);             // geometric mean (volume-equivalent length)
  // Calculate modulation period
  const f_m = (state.modulationFreq_GHz ?? 15) * 1e9; // Hz
  const T_m = 1 / f_m;                                // s

  const T_long = L_long / C;   // s
  const T_geom = L_geom / C;   // s

  state.TS_long = T_long / T_m;   // most conservative
  state.TS_geom = T_geom / T_m;   // typical
  state.TS_ratio = state.TS_long; // keep existing field = conservative

  // Export so /metrics can expose same numbers
  state.__sectors = { TOTAL_SECTORS, activeSectors: S_instant, activeFraction: frac_active, tilesPerSector: tilesPerSect, activeTiles: state.activeTiles };

  // ----- Ford–Roman proxy with time-sliced strobing -----
  const Q_quantum = 1e12; // paper's tight sampling scale
  state.zeta = 1 / (d_eff * Math.sqrt(Q_quantum)); // uses d/S by construction
  state.fordRomanCompliance = state.zeta < 1.0;

  state.__fr = {
    dutyInstant: BURST_DUTY_LOCAL,      // use 0.01 (physical burst), not UI 0.14
    dutyEffectiveFR: d_eff,             // 0.01 * frac_active
    Q_quantum
  };
  
  // Expose timing details for metrics API
  state.strobeHz            = Number(process.env.STROBE_HZ ?? 2000); // sectors/sec
  state.sectorPeriod_ms     = 1000 / Math.max(1, state.strobeHz);
  state.dutyBurst           = BURST_DUTY_LOCAL;  // for client visibility  
  state.dutyEffective_FR    = d_eff; // for client visibility
  state.modelMode           = MODEL_MODE; // for client consistency
  
  // Compliance flags  
  state.natarioConstraint   = true;
  state.curvatureLimit      = Math.abs(state.U_cycle ?? 0) < 1e-10;
  
  // Overall status
  if (!state.fordRomanCompliance || !state.curvatureLimit) {
    state.overallStatus = 'CRITICAL';
  } else if (state.P_avg > 100 || state.zeta > 0.8) {
    state.overallStatus = 'WARNING';
  } else {
    state.overallStatus = 'NOMINAL';
  }
  
  return state;
}

// Mode switching function
export function switchMode(state: EnergyPipelineState, newMode: EnergyPipelineState['currentMode']): EnergyPipelineState {
  state.currentMode = newMode;
  return calculateEnergyPipeline(state);
}

// Parameter update function
export function updateParameters(state: EnergyPipelineState, params: Partial<EnergyPipelineState>): EnergyPipelineState {
  Object.assign(state, params);
  return calculateEnergyPipeline(state);
}

// Export current pipeline state for external access
let globalPipelineState = initializePipelineState();

export function getGlobalPipelineState(): EnergyPipelineState {
  return globalPipelineState;
}

export function setGlobalPipelineState(state: EnergyPipelineState): void {
  globalPipelineState = state;
}

/**
 * Sample the Natário bell displacement on an ellipsoidal shell using the same math as the renderer.
 * Returns ~ nTheta*nPhi points, suitable for JSON compare or CSV export.
 */
export function sampleDisplacementField(state: EnergyPipelineState, req: FieldRequest = {}): FieldSample[] {
  // Hull geometry: convert from Needle Hull format to ellipsoid axes
  const hullGeom = state.hull ?? { Lx_m: state.shipRadius_m * 2, Ly_m: state.shipRadius_m * 2, Lz_m: state.shipRadius_m * 2 };
  const a = hullGeom.Lx_m / 2;  // Semi-axis X (length/2)
  const b = hullGeom.Ly_m / 2;  // Semi-axis Y (width/2)
  const c = hullGeom.Lz_m / 2;  // Semi-axis Z (height/2)
  const axes: HullAxes = { a, b, c };

  const nTheta = req.nTheta ?? 64;
  const nPhi   = req.nPhi ?? 32;
  const sectors = Math.max(1, Math.floor(req.sectors ?? state.sectorStrobing ?? 1));
  const split   = Math.max(1, Math.min(sectors - 1, Math.floor(req.split ?? sectors / 2)));

  // Canonical bell width in *ellipsoidal* radius units: wρ = w_m / a_eff.
  // Use a geometric-mean effective radius so width is scale-invariant with axes.
  const aEff = Math.cbrt(axes.a * axes.b * axes.c);
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
      const aPass = 2.5 * w_rho, bStop = 3.5 * w_rho; // pass/stop band
      let wallWin: number;
      if (asd <= aPass) wallWin = 1.0;
      else if (asd >= bStop) wallWin = 0.0;
      else wallWin = 0.5 * (1 + Math.cos(Math.PI * (asd - aPass) / (bStop - aPass))); // smooth to 0
      
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

      samples.push({ p, rho, bell, n, sgn, disp });
    }
  }
  return samples;
}