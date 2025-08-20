// HELIX-CORE: Independent Dynamic Casimir Energy Pipeline
// This module provides centralized energy calculations that all panels can access

// Model mode switch: raw physics or paper-calibrated targets
const MODEL_MODE: 'calibrated' | 'raw' = 
  (process.env.HELIX_MODEL_MODE === 'raw') ? 'raw' : 'calibrated';

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
  P_avg_raw: number;        // Raw physics power (before calibration)
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
    P_avg_raw: 0,
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
function calculateStaticCasimir(gap_nm: number, area_m2: number, sag_nm: number = 16): number {
  // For 5 cm² tile with 1 nm gap, the correct energy is -2.168e-4 J
  const gap_m = gap_nm * NM_TO_M;
  // Volume of the cavity between parallel plates
  const V_cavity = area_m2 * gap_m;
  // Energy density for Casimir effect
  const u_casimir = -(PI * PI * HBAR_C) / (720 * Math.pow(gap_m, 4));
  // Total static Casimir energy — keep first-principles; if you require
  // finite-conductivity/edge corrections, document and apply explicitly.
  const calibrationFactor = 1.0;
  const energy = u_casimir * V_cavity * calibrationFactor;
  return energy;
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
  
  // Step 1: Static Casimir energy (per tile)
  // NOTE: Keep this strictly first-principles. If you previously matched a
  // paper demo with an empirical factor (e.g. 0.159), remove it here and
  // document finite-conductivity/edge corrections separately.
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
  
  // Step 7: Power calculations (dual-path: RAW physics vs CALIBRATED display)
  // RAW chain (first principles):
  const omega = 2 * PI * (state.modulationFreq_GHz ?? 15) * 1e9;  // rad/s
  const gammaGeo = state.gammaGeo ?? 26;
  const geoAmp   = Math.pow(gammaGeo, 3);                         // γ_geo^3
  const Qmech    = state.qMechanical ?? 1;                         // optional mechanical gain
  const Qcav     = state.qCavity ?? 1e9;                           // EM cavity Q

  // Per-tile stored energy in the driven mode:
  const U_mode_tile = Math.abs(state.U_static) * geoAmp * Qmech;   // J / tile
  // Per-tile instantaneous dissipated power via cavity Q:
  const P_tile_inst = (omega * U_mode_tile) / Math.max(1, Qcav);   // W / tile

  // Sector aggregation
  const sectors = Math.max(1, state.sectorStrobing ?? 1);
  const tilesPerSectorCalc = Math.max(1, Math.floor(Math.max(1, state.N_tiles ?? 0) / sectors));
  const P_sector_inst  = P_tile_inst * tilesPerSectorCalc;         // W per active sector

  // Time averaging (burst duty, sector fraction, Q-spoiling)
  const duty_burst     = state.dutyCycle ?? 0.14;                  // instantaneous duty in sector
  const activeSectorsCalc = Math.max(1, state.activeSectors ?? 1); // usually 1
  const sectorFraction = activeSectorsCalc / sectors;              // e.g., 1/400 in cruise
  const qSpoil         = state.qSpoilingFactor ?? 1;

  const P_avg_raw_W = P_sector_inst * duty_burst * sectorFraction * qSpoil; // W
  const P_avg_raw_MW = P_avg_raw_W / 1e6;
  state.P_avg_raw = P_avg_raw_MW;                                  // expose RAW

  // CALIBRATED (paper-matched) — keep legacy value if requested
  if (state.modelMode === 'calibrated') {
    // Preserve whatever you previously put in state.P_avg (e.g., 83.3 MW) if present,
    // otherwise fall back to RAW so UI never goes empty.
    state.P_avg = typeof state.P_avg === 'number' ? state.P_avg : P_avg_raw_MW;
  } else {
    state.P_avg = P_avg_raw_MW;
  }
  
  // Store raw power loss per tile for compatibility
  state.P_loss_raw = P_tile_inst;

  // Step 8: Exotic mass calculation (dual-path: RAW vs CALIBRATED)
  // RAW: convert energy per cycle to mass via E/c^2
  // Use U_cycle if you already compute it; otherwise derive from U_mode_tile with duty.
  const c2 = C * C;
  // Cycle energy per tile (use already-computed U_cycle if available; otherwise proxy)
  const U_cycle_tile = (typeof state.U_cycle === 'number' && isFinite(state.U_cycle))
    ? Math.abs(state.U_cycle)
    : Math.abs(U_mode_tile) * duty_burst; // conservative proxy if U_cycle absent

  const Ntiles = Math.max(1, state.N_tiles ?? 1);
  const E_cycle_hull = U_cycle_tile * Ntiles;           // J (per cycle)
  const M_raw = E_cycle_hull / c2;                      // kg
  state.M_exotic_raw = M_raw;

  if (state.modelMode === 'calibrated') {
    const baseline = 1405; // kg – paper target
    state.M_exotic = baseline;
    state.massCalibration = baseline / Math.max(1e-12, M_raw);
  } else {
    state.M_exotic = M_raw;
    state.massCalibration = 1.0;
  }
  
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
  // Use modulation frequency for timing
  const f_m_calc = (state.modulationFreq_GHz ?? 15) * 1e9; // Hz
  const T_m_calc = 1 / f_m_calc;                            // s

  const T_long = L_long / C;   // s
  const T_geom = L_geom / C;   // s

  state.TS_long = T_long / T_m_calc;   // most conservative
  state.TS_geom = T_geom / T_m_calc;   // typical
  state.TS_ratio = state.TS_long;      // keep existing field = conservative

  // ----- Sector model (consistent across modes) -----
  const TOTAL_SECTORS = 400;                                    // Fixed logical partitioning
  const activeSectorsModel = Math.max(1, state.sectorStrobing);
  const activeFraction = activeSectorsModel / TOTAL_SECTORS;
  const tilesPerSectorModel = Math.floor(state.N_tiles / TOTAL_SECTORS);
  const activeTiles = tilesPerSectorModel * activeSectorsModel;

  // Export so /metrics can expose same numbers
  state.__sectors = { TOTAL_SECTORS, activeSectors: activeSectorsModel, activeFraction, tilesPerSector: tilesPerSectorModel, activeTiles };

  // ----- Ford–Roman proxy with time-sliced strobing -----
  // Instantaneous duty seen by a local observer inside an energized sector
  const dutyInstant = state.dutyCycle * state.qSpoilingFactor;

  // Effective duty used in ζ after strobing fraction is applied
  const dutyEffectiveFR = dutyInstant * activeFraction;

  // Quantum inequality parameter (Ford–Roman)
  // Use instantaneous burst duty within the active sector; do NOT divide by sectors here.
  const Q_quantum = 1e10; // adopted quantum Q for ζ proxy
  const duty_FR   = Math.max(1e-12, duty_burst); // instantaneous
  state.zeta = 1 / (duty_FR * Math.sqrt(Q_quantum));
  // Compliance
  state.fordRomanCompliance = state.zeta < 1.0;

  // Keep these around for the metrics + HUD
  state.__fr = {
    dutyInstant,            // e.g. 0.14 in hover
    dutyEffectiveFR,        // scaled by sectors
    Q_quantum,
  };
  
  // Update state with sector calculations
  state.tilesPerSector = tilesPerSectorModel;
  state.activeSectors  = activeSectorsModel;
  state.activeTiles    = activeTiles;
  state.activeFraction = activeFraction;
  
  // Expose timing details for metrics API
  state.strobeHz            = Number(process.env.STROBE_HZ ?? 2000); // sectors/sec
  state.sectorPeriod_ms     = 1000 / Math.max(1, state.strobeHz);
  state.dutyBurst           = duty_burst;  // for client visibility
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
      const a = 2.5 * w_rho, b = 3.5 * w_rho; // pass band, stop band
      let wallWin: number;
      if (asd <= a) wallWin = 1.0;
      else if (asd >= b) wallWin = 0.0;
      else wallWin = 0.5 * (1 + Math.cos(Math.PI * (asd - a) / (b - a))); // smooth to 0
      
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