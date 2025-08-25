/**
 * Pipeline → WarpEngine Adapter
 * 
 * Eliminates "secret defaults" by driving WarpEngine directly from EnergyPipelineState.
 * Single source of truth for all physics parameters.
 */
import { gatedUpdateUniforms } from "./warp-uniforms-gate";

export interface EnergyPipelineState {
  // Hull geometry
  hull?: { 
    Lx_m: number; 
    Ly_m: number; 
    Lz_m: number; 
    wallThickness_m?: number;
  };
  shipRadius_m: number;
  
  // Physics parameters
  sag_nm?: number;
  dutyCycle: number;
  dutyShip: number;
  sectorCount: number;
  gammaGeo: number;
  gammaVanDenBroeck: number;
  qCavity: number;
  qSpoilingFactor: number;
  currentMode: string;
  modelMode?: 'calibrated' | 'raw';
  
  // Optional for fallbacks
  dutyEffective_FR?: number;
}

/**
 * Drop-in adapter: pipeline → WarpEngine (single source of truth)
 * Call this every time the pipeline state changes (or on a fixed tick)
 */
export function driveWarpFromPipeline(engine: any, s: EnergyPipelineState) {
  if (!engine || !s) return;

  // Do not set global parity flags here; let the caller (REAL/SHOW) control them

  // --- Hull semi-axes in meters (renderer expects [a,b,c]) ---
  const a = (s.hull?.Lx_m ?? s.shipRadius_m * 2) / 2;
  const b = (s.hull?.Ly_m ?? s.shipRadius_m * 2) / 2;
  const c = (s.hull?.Lz_m ?? s.shipRadius_m * 2) / 2;

  // --- Canonical wall width in ρ-units (matches HELIX sampler) ---
  const aEff = Math.cbrt(a * b * c);                 // geometric-mean radius (m)
  const w_m  = Math.max(1e-9, (s.sag_nm ?? 16) * 1e-9);
  const w_rho = Math.max(1e-6, w_m / aEff);

  // --- Ship-wide effective duty (exactly HELIX's d_eff) ---
  const d_ship = s.dutyEffective_FR ?? s.dutyShip ?? 0.01/400; // safe fallback

  // --- Sectoring: use *total* wedges for York & geometry, never "concurrent" ---
  const sectors = Math.max(1, s.sectorCount || 400);
  const split   = Math.floor(sectors / 2); // canonical (+/–) split

  // --- Physics amplitude chain (renderer consumes this as u_thetaScale) ---
  // NOTE: qSpoilingFactor is an *idle cryo* knob in HELIX; it should NOT scale
  // on-window field amplitude. Keep it out of thetaScale.
  const gammaGeo = Math.max(1, s.gammaGeo ?? 26);
  const gammaVdB = Math.max(0, s.gammaVanDenBroeck ?? 0);
  const thetaScale =
    Math.pow(gammaGeo, 3) *
    gammaVdB *
    Math.sqrt(Math.max(1e-12, d_ship / sectors));

  // --- Burst Q for visuals (matches HELIX Q_BURST semantics) ---
  const Qburst = s.qCavity ?? 1e9;

  // --- Mode & parity (MODEL_MODE=raw ⇒ parity visuals) ---

  // Push everything into the renderer in one shot using gated uniforms
  gatedUpdateUniforms(engine, {
    // Physics/ops
    currentMode: s.currentMode,
    // Do not set physicsParityMode/ridgeMode here; pass them from the caller (REAL/SHOW)
    dutyCycle: d_ship,                // ship-wide effective duty
    sectors, split,
    gammaGeo, gammaVdB, Qburst,
    // keep idle spoil around for diagnostics only (not in thetaScale)
    qSpoilingFactor: s.qSpoilingFactor,
    deltaAOverA: 1.0,                 // do not amplitude-scale visuals with spoil
    // Geometry
    hullAxes: [a, b, c],
    wallWidth: w_rho,
    // Unified amplitude handed in numerically
    thetaScale,
    // Optional: keep your existing cosmetics; parity mode will disable them
    // cosmeticLevel: 10,
    // curvatureBoostMax: 40,
    // curvatureGainT: 0.0,
  }, 'pipeline-adapter');
}