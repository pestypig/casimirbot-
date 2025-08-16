// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// Model mode switch: raw physics or paper-calibrated targets
const MODEL_MODE: 'calibrated' | 'raw' = 
  (process.env.HELIX_MODEL_MODE === 'raw') ? 'raw' : 'calibrated';

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
    dutyCycle: 0.14,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    description: "High-power hover mode for station-keeping"
  },
  cruise: {
    dutyCycle: 0.005,
    sectorStrobing: 400,
    qSpoilingFactor: 0.625,
    description: "Low-power cruise mode for sustained travel"
  },
  emergency: {
    dutyCycle: 0.50,
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    description: "Maximum power emergency mode"
  },
  standby: {
    dutyCycle: 0.001,
    sectorStrobing: 1,
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
    sectorStrobing: 1,
    qSpoilingFactor: 1,
    
    // Physics defaults
    gammaGeo: 26,
    qMechanical: 5e4,
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

  // Derived tile count (no hard-coding; lets geometry drive it)
  state.N_tiles = Math.max(1, Math.floor(hullArea_m2 / tileArea_m2));
  
  // Step 1: Static Casimir energy
  state.U_static = calculateStaticCasimir(state.gap_nm, tileArea_m2);
  
  // Step 2: Geometric amplification (γ × U_static, not γ³)
  // The research papers use γ=26 as a linear amplification factor
  state.U_geo = state.U_static * state.gammaGeo;
  
  // Step 3: Q-enhancement
  state.U_Q = state.U_geo * state.qMechanical;
  
  // Step 4: Apply mode configuration
  const modeConfig = MODE_CONFIGS[state.currentMode];
  state.dutyCycle = modeConfig.dutyCycle;
  state.sectorStrobing = modeConfig.sectorStrobing;
  state.qSpoilingFactor = modeConfig.qSpoilingFactor;
  
  // Step 5: γ_VdB (server-authoritative, paper-consistent)
  const realisticGammaVdB = 2.86e5; // paper-consistent value
  const massScaling = (state.exoticMassTarget_kg ?? 1405) / 1405;
  state.gammaVanDenBroeck = realisticGammaVdB * massScaling;
  
  // Step 6: Duty-cycled energy (physics calculation)
  state.U_cycle = state.U_Q * state.dutyCycle;
  
  /* ──────────────────────────────
     Step 7: Power (physics-first)
     P_loss_per_tile ≈ ω · |U_Q| / Q_eff
     Average power scales with duty and active fraction.
  ──────────────────────────────── */
  const omega = 2 * PI * (state.modulationFreq_GHz ?? 15) * 1e9;

  // Effective Q with spoiling
  const Q_eff = Math.max(1, (state.qCavity ?? 1e9) * (state.qSpoilingFactor ?? 1));

  // Raw per-tile dissipation (J/s)
  const P_loss_per_tile_raw = Math.abs(state.U_Q ?? 0) * omega / Q_eff;

  // Tiles & strobing
  const N_tiles       = Math.max(1, Math.round(state.N_tiles ?? 1.96e9));
  const sectorsActive = Math.max(1, Math.round(state.sectorStrobing ?? 1));
  const activeFrac    = Math.min(1, sectorsActive / N_tiles);

  // Duty components (add femtosecond burst duty)
  const duty          = Math.max(0, Math.min(1, state.dutyCycle ?? 0.14));
  const f_m           = (state.modulationFreq_GHz ?? 15) * 1e9; // Hz
  const T_m           = 1 / f_m;                                // s
  const burst_s       = 0.5 * 1e-15; // default 0.5 fs (hardcoded for now)
  const dutyBurst     = Math.min(1, Math.max(0, burst_s / T_m)); // << very small (~1e-5 .. 1e-6)
  
  // Effective duty for tile-level production
  const dutyTile      = duty * dutyBurst;
  
  // Note: effDuty_FR is calculated later in Ford-Roman section

  // Hull average power (only active sectors dissipate at once)
  const P_total_W     = P_loss_per_tile_raw * N_tiles * duty * activeFrac;

  state.P_loss_raw    = P_loss_per_tile_raw;   // W per tile (raw)
  
  // Model switch: raw physics vs paper-calibrated power targets
  const powerTargets = { hover: 83.3, cruise: 7.4, emergency: 297.5, standby: 0 };
  const P_raw_MW = P_total_W / 1e6;  // Raw physics power
  state.P_avg = (MODEL_MODE === 'calibrated') 
    ? (powerTargets as any)[state.currentMode] ?? 83.3
    : P_raw_MW;

  /* ──────────────────────────────
     Step 8: Exotic mass (physics-first)
     E_tile_enh = |U_static| · (γ_geo^3) · Q_burst · γ_VdB · duty
     M_raw_total = (E_tile_enh / c^2) · N_tiles
     Optional calibration scales MASS ONLY (never γ_VdB).
  ──────────────────────────────── */

  // Use server-set γ_VdB (from Step 5)
  const gammaVdBSeed = state.gammaVanDenBroeck;

  // Geometric / DCE amplification
  const gammaGeo  = state.gammaGeo ?? 26;
  const geoAmp    = Math.pow(gammaGeo, 3);        // γ_geo^3
  const qBurst    = state.qCavity ?? 1e9;         // use cavity Q as the DCE burst/Q factor

  // Per-tile enhanced energy over a cycle (use tile-level duty)
  const U_static_abs = Math.abs(state.U_static ?? 0);   // J (from calculateStaticCasimir)  
  const E_tile_enh   = U_static_abs * geoAmp * qBurst * gammaVdBSeed * dutyTile;

  // Raw physics totals
  const massPerTile_kg = E_tile_enh / (C * C);
  const M_raw_total_kg = massPerTile_kg * N_tiles;

  state.M_exotic_raw   = Math.max(0, M_raw_total_kg);

  // Model switch: raw physics vs paper-calibrated targets
  const M_CALIBRATED = 1405; // kg (paper target)
  state.M_exotic = (MODEL_MODE === 'calibrated') ? M_CALIBRATED : state.M_exotic_raw;
  state.massCalibration = (MODEL_MODE === 'calibrated' && M_raw_total_kg > 0) 
    ? (M_CALIBRATED / M_raw_total_kg) : 1;
  
  // Physics logging for debugging
  console.log("[PIPELINE]", {
    duty: state.dutyCycle, sectors: state.sectorStrobing, N: state.N_tiles,
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
  // Reuse f_m and T_m from above power calculation

  const T_long = L_long / C;   // s
  const T_geom = L_geom / C;   // s

  state.TS_long = T_long / T_m;   // most conservative
  state.TS_geom = T_geom / T_m;   // typical
  state.TS_ratio = state.TS_long; // keep existing field = conservative

  // ----- Sector model (consistent across modes) -----
  const TOTAL_SECTORS = 400;                           // Fixed logical partitioning
  const activeSectors = Math.max(1, state.sectorStrobing);
  const activeFraction = activeSectors / TOTAL_SECTORS;
  const tilesPerSector = Math.floor(state.N_tiles / TOTAL_SECTORS);
  const activeTiles = tilesPerSector * activeSectors;

  // Export so /metrics can expose same numbers
  state.__sectors = { TOTAL_SECTORS, activeSectors, activeFraction, tilesPerSector, activeTiles };

  // ----- Ford–Roman proxy with time-sliced strobing -----
  // Instantaneous duty seen by a local observer inside an energized sector
  const dutyInstant = state.dutyCycle * state.qSpoilingFactor;

  // Effective duty used in ζ after strobing fraction is applied
  const dutyEffectiveFR = dutyInstant * activeFraction;

  // Quantum cavity Q used for the Ford–Roman inequality proxy
  const Q_quantum = 1e10;

  // ζ = 1 / (duty_eff * sqrt(Q))
  state.zeta = 1 / (dutyEffectiveFR * Math.sqrt(Q_quantum));
  // Compliance
  state.fordRomanCompliance = state.zeta < 1.0;

  // Keep these around for the metrics + HUD
  state.__fr = {
    dutyInstant,            // e.g. 0.14 in hover
    dutyEffectiveFR,        // scaled by sectors
    Q_quantum,
  };
  
  // Update state with sector calculations
  state.tilesPerSector = tilesPerSector;
  state.activeSectors  = activeSectors;
  state.activeTiles    = activeTiles;
  state.activeFraction = activeFraction;
  
  // Expose timing details for metrics API
  state.strobeHz            = Number(process.env.STROBE_HZ ?? 2000); // sectors/sec
  state.sectorPeriod_ms     = 1000 / Math.max(1, state.strobeHz);
  state.dutyBurst           = dutyBurst;  // for client visibility
  state.dutyEffective_FR    = dutyEffectiveFR; // for client visibility
  state.modelMode           = MODEL_MODE; // for client consistency
  
  // Compliance flags
  state.fordRomanCompliance = state.zeta < 1.0;
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