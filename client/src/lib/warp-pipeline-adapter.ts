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

  // --- Sectoring (separate concurrent vs total) ---
  const sectorsTotal =
    Math.max(
      1,
      Math.floor(
        num(s.sectorCount) ??
          num(s.sectorStrobing) ?? // server field name
          400
      )
    );
  // Prefer explicit concurrentSectors/sectorsConcurrent; fallback to sectorStrobing; else 1
  const sectorsConc =
    Math.max(1, Math.floor(
      num((s as any).sectorsConcurrent) ??
      num((s as any).concurrentSectors) ??
      num(s.sectorStrobing) ?? 1
    ));
  const split = Math.floor(sectorsTotal / 2); // viz-only (+/–) split (kept for legacy UI)

  // --- Duty resolution
  // Local burst (sector-local on-fraction). Use explicit field if provided; else default to paper 1%.
  const dutyLocal = clamp(
    num((s as any).localBurstFrac) ?? num((s as any).burstLocal) ?? (s.dutyCycle ?? 0.01),
    0, 1
  );
  // Ford–Roman (ship-wide): d_FR = dutyLocal × (S_concurrent / S_total)
  const d_ship = clamp(
    num(s.dutyEffective_FR) ??
    num(s.dutyShip) ??
    (dutyLocal * (sectorsConc / sectorsTotal)),
    0, 1
  );

  // --- Physics amplitude chain (renderer consumes this as u_thetaScale) ---
  // Include qSpoilingFactor in theta calculation for mode differences.
  // Use visual-only γ_VdB to keep mass calibration away from renderer.
  const gammaGeo = Math.max(1, num(s.gammaGeo) ?? 26);
  const gammaVdB = Math.max(0, num(s.gammaVanDenBroeck_vis) ?? num(s.gammaVanDenBroeck) ?? 0);
  const qSpoil = Math.max(1e-12, num(s.qSpoilingFactor) ?? 1);

  // Let the gate/engine compute authoritative θ. Provide only an audit value.
  const thetaScaleExpected =
    Math.pow(gammaGeo, 3) *
    qSpoil *
    gammaVdB *
    Math.sqrt(Math.max(1e-12, d_ship));

  // --- Burst Q for visuals (matches HELIX Q_BURST semantics) ---
  const Qburst = num(s.qCavity) ?? 1e9;

  // Push everything into the renderer in one shot using gated uniforms
  gatedUpdateUniforms(
    engine,
    {
      // Physics/ops - include qSpoilingFactor in physics chain
      currentMode: s.currentMode,
      // Do not set physicsParityMode/ridgeMode here; caller (REAL/SHOW) decides
      dutyCycle: dutyLocal,            // ⟵ sector-local burst duty
      dutyEffectiveFR: d_ship,         // ⟵ Ford–Roman duty (ship-wide)
      sectorCount: sectorsTotal,       // ⟵ total wedges
      sectors: sectorsConc,            // ⟵ concurrent/live sectors
      gammaGeo,
      gammaVanDenBroeck: gammaVdB,
      qSpoilingFactor: qSpoil,
      qBurst: Qburst,

      // Geometry
      hullAxes: [a, b, c],
      wallWidth_rho: w_rho,

      // Audit-only; do not override engine θ
      thetaScaleExpected,

      // Visual defaults (safe)
      colorMode: "theta",
      viewAvg: true,
    },
    "server"
  );
}