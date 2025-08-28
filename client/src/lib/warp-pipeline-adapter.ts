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
  dutyShip?: number;                     // was required → optional (not present on server state)
  sectorCount?: number;                  // was required → optional
  sectorStrobing?: number;               // present on server state; treat as sectors fallback
  gammaGeo: number;
  gammaVanDenBroeck: number;             // mass-calibrated version
  gammaVanDenBroeck_vis?: number;        // visual-only version (physics seed)
  gammaVanDenBroeck_mass?: number;       // mass calibration version
  qCavity: number;
  qSpoilingFactor: number;
  currentMode: string;
  modelMode?: "calibrated" | "raw";

  // Optional for fallbacks
  dutyEffective_FR?: number;
  thetaScaleExpected?: number;           // precomputed server value for verification
}

/**
 * Drop-in adapter: pipeline → WarpEngine (single source of truth)
 * Call this every time the pipeline state changes (or on a fixed tick)
 */
export function driveWarpFromPipeline(engine: any, s: EnergyPipelineState): void {
  if (!engine || !s) return;

  // Helpers
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // --- Hull semi-axes in meters (renderer expects [a,b,c]) ---
  const a = num(s.hull?.Lx_m) ?? s.shipRadius_m;
  const b = num(s.hull?.Ly_m) ?? s.shipRadius_m;
  const c = num(s.hull?.Lz_m) ?? s.shipRadius_m;

  // --- Canonical wall width in ρ-units (matches HELIX sampler) ---
  const aEff = Math.max(1e-6, Math.cbrt(Math.max(1e-12, a * b * c))); // guard zero/NaN
  const w_m = Math.max(1e-9, (s.sag_nm ?? 16) * 1e-9);
  const w_rho = Math.max(1e-6, w_m / aEff);

  // --- Sectoring: use *total* wedges for York & geometry, never "concurrent" ---
  const sectorsTotal =
    Math.max(
      1,
      Math.floor(
        num(s.sectorCount) ??
          num(s.sectorStrobing) ?? // server field name
          400
      )
    );

  const split = Math.floor(sectorsTotal / 2); // canonical (+/–) split

  // --- Ship-wide effective duty (exactly HELIX's d_eff) ---
  // Priority: precomputed FR → explicit ship duty → derive from UI dutyCycle & strobing
  let d_ship =
    num(s.dutyEffective_FR) ??
    num(s.dutyShip) ??
    (() => {
      const d_ui = clamp(s.dutyCycle ?? 0.14, 0, 1);
      const strobe = Math.max(1, num(s.sectorStrobing) ?? sectorsTotal);
      const qSpoil = Math.max(1e-12, num(s.qSpoilingFactor) ?? 1);
      // HELIX effective duty ≈ UI duty × qSpoiling × (1 / sectors)
      return clamp((d_ui * qSpoil) / strobe, 0, 1);
    })();

  d_ship = clamp(d_ship, 0, 1);

  // --- Physics amplitude chain (renderer consumes this as u_thetaScale) ---
  // Include qSpoilingFactor in theta calculation for mode differences.
  // Use visual-only γ_VdB to keep mass calibration away from renderer.
  const gammaGeo = Math.max(1, num(s.gammaGeo) ?? 26);
  const gammaVdB = Math.max(0, num(s.gammaVanDenBroeck_vis) ?? num(s.gammaVanDenBroeck) ?? 0);
  const qSpoil = Math.max(1e-12, num(s.qSpoilingFactor) ?? 1);

  const thetaScale =
    Math.pow(gammaGeo, 3) *
    qSpoil *
    gammaVdB *
    Math.max(1e-12, d_ship / sectorsTotal);

  // --- Burst Q for visuals (matches HELIX Q_BURST semantics) ---
  const Qburst = num(s.qCavity) ?? 1e9;

  // Push everything into the renderer in one shot using gated uniforms
  gatedUpdateUniforms(
    engine,
    {
      // Physics/ops - include qSpoilingFactor in physics chain
      currentMode: s.currentMode,
      // Do not set physicsParityMode/ridgeMode here; pass them from the caller (REAL/SHOW)
      dutyCycle: d_ship, // ship-wide effective duty
      dutyEffectiveFR: d_ship, // FR duty for calculations
      sectorCount: sectorsTotal, // total wedges
      sectors: split, // +/- split for viz that expects half-count
      gammaGeo,
      gammaVanDenBroeck: gammaVdB,
      qSpoilingFactor: qSpoil,
      qBurst: Qburst,

      // Geometry
      hullAxes: [a, b, c],
      wallWidth_rho: w_rho,

      // Unified amplitude with qSpoiling included
      thetaScale,

      // Visual defaults locked by gating system
      colorMode: "theta",
      viewAvg: true,
    },
    "pipeline-adapter"
  );
}