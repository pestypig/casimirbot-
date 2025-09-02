/**
 * Pipeline → WarpEngine Adapter
 *
 * Drives renderer uniforms from pipeline state (single source of truth, strict)
 */
import { gatedUpdateUniforms } from "./warp-uniforms-gate";
import type { GreensPayload } from "@/hooks/use-energy-pipeline";

function aHarmonic(ax: number, ay: number, az: number) {
  const a = +ax || 0, b = +ay || 0, c = +az || 0;
  const d = (a>0?1/a:0) + (b>0?1/b:0) + (c>0?1/c:0);
  return d > 0 ? 3 / d : NaN;
}

function req(cond: any, msg: string) {
  if (!cond) throw new Error(`adapter: ${msg}`);
}

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
  dutyShip?: number;
  sectorCount?: number;
  sectorStrobing?: number;
  gammaGeo: number;
  gammaVanDenBroeck: number;
  gammaVanDenBroeck_vis?: number;
  gammaVanDenBroeck_mass?: number;
  qCavity: number;
  qSpoilingFactor: number;
  currentMode: string;
  modelMode?: "calibrated" | "raw";

  // Optional for fallbacks
  dutyEffective_FR?: number;
  thetaScaleExpected?: number;
  thetaScale?: number;

  // Strongly recommended fields (strict mode)
  axesHull?: [number,number,number];
  wallWidth_m?: number;
  wallWidth_rho?: number;
  dutyLocal?: number;
  dutyEffectiveFR?: number;
}

export type DriveMetricOpts = {
  greens?: GreensPayload;   // φ samples (normalized or raw; we use as-is)
  metricKappa?: number;     // required to enable metric mode; no default
};

/**
 * Drop-in adapter: pipeline → WarpEngine (single source of truth, strict)
 * Call this every time the pipeline state changes (or on a fixed tick)
 */
export function driveWarpFromPipeline(engine: any, s: EnergyPipelineState, opts?: DriveMetricOpts): void {
  if (!engine || !s) return;

  // Resolve axes
  const ax = +(s.axesHull?.[0] ?? s.hull?.a ?? s.hull?.Lx_m ?? NaN);
  const ay = +(s.axesHull?.[1] ?? s.hull?.b ?? s.hull?.Ly_m ?? NaN);
  const az = +(s.axesHull?.[2] ?? s.hull?.c ?? s.hull?.Lz_m ?? NaN);
  req(Number.isFinite(ax)&&Number.isFinite(ay)&&Number.isFinite(az), 'missing axesHull[a,b,c]');
  const axesHull: [number,number,number] = [ax,ay,az];
  const aH = aHarmonic(ax,ay,az);
  req(Number.isFinite(aH), 'bad harmonic radius (axes)');

  // Wall width (prefer meters; compute rho)
  const w_m  = Number.isFinite(s.wallWidth_m)   ? +s.wallWidth_m   : (Number.isFinite(s.wallWidth_rho) ? +s.wallWidth_rho * aH : Math.max(1e-9, (s.sag_nm ?? 16) * 1e-9));
  const w_rho= Number.isFinite(s.wallWidth_rho) ? +s.wallWidth_rho : (Number.isFinite(s.wallWidth_m)   ? +s.wallWidth_m / aH   : (Number.isFinite(aH) ? Math.max(1e-6, w_m / aH) : NaN));
  req(Number.isFinite(w_m) && Number.isFinite(w_rho), 'missing wallWidth_m or wallWidth_rho');

  // Sectors / duty
  const S_total = +(s.sectorCount ?? 400);
  const S_live  = +(s.sectorStrobing ?? 1);
  req(Number.isFinite(S_total)&&Number.isFinite(S_live)&&S_total>=1&&S_live>=1, 'missing sectorCount/sectorStrobing');
  const dutyLocal = Number.isFinite(s.dutyLocal) ? +s.dutyLocal : (Number.isFinite(s.dutyCycle) ? +s.dutyCycle : NaN);
  req(Number.isFinite(dutyLocal), 'missing dutyLocal/dutyCycle');
  const dutyEffectiveFR = Number.isFinite(s.dutyEffectiveFR) ? +s.dutyEffectiveFR : 
                         (Number.isFinite(s.dutyEffective_FR) ? +s.dutyEffective_FR : 
                         (dutyLocal * (S_live/S_total)));

  // Physics gains
  const gammaGeo  = +s.gammaGeo;
  const gammaVdB  = +(s.gammaVanDenBroeck_vis ?? s.gammaVanDenBroeck);
  const qSpoil    = +(s.qSpoilingFactor ?? 1);
  req(Number.isFinite(gammaGeo)&&Number.isFinite(gammaVdB)&&Number.isFinite(qSpoil), 'missing gammaGeo/gammaVdB/qSpoilingFactor');

  // Optional authoritative theta
  const thetaScale = Number.isFinite(s.thetaScale) ? +s.thetaScale : undefined;

  // --- Optional: conformal metric from Greens φ --------------------------------
  // Enable metric only if BOTH greens and kappa are provided.
  let metricMode = false;
  let gSpatialDiag: [number, number, number] | undefined;
  if (opts?.greens && Number.isFinite(opts?.metricKappa)) {
    const phi = opts.greens.phi;
    if (phi && phi.length > 0) {
      // Simple mean as a first diagnostic scalar (no hidden normalization here)
      let sum = 0;
      for (let i = 0; i < phi.length; i++) sum += phi[i];
      const phiMean = sum / phi.length;
      const kappa = Number(opts.metricKappa);
      const conformal = 1 + kappa * phiMean;
      gSpatialDiag = [conformal, conformal, conformal];
      metricMode = true;
    }
  }

  // Burst Q for visuals
  const Qburst = +(s.qCavity ?? 1e9);

  gatedUpdateUniforms(engine, {
    strictPhysics: true,
    ...(metricMode ? { metricMode: true } : {}),
    ...(gSpatialDiag ? { gSpatialDiag } : {}),
    axesHull,
    // keep axesScene derived in engine
    wallWidth: w_rho,
    wallWidth_rho: w_rho,
    wallWidth_m: w_m,
    sectorCount: S_total|0,
    sectorStrobing: S_live|0,
    dutyCycle: dutyLocal,
    dutyEffectiveFR,
    gammaGeo,
    gammaVanDenBroeck: gammaVdB,
    qSpoilingFactor: qSpoil,
    qBurst: Qburst,
    currentMode: s.currentMode,
    lockFraming: true,
    ...(Number.isFinite(thetaScale) ? { thetaScale } : {})
  }, "server");
}