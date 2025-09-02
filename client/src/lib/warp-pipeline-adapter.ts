
/**
 * Pipeline → WarpEngine Adapter
 *
 * Drives renderer uniforms from pipeline state (single source of truth, strict; no fallbacks)
 */
import { gatedUpdateUniforms } from "./warp-uniforms-gate";
import type { GreensPayload, HelixMetrics, EnergyPipelineState } from "@/hooks/use-energy-pipeline";

// Optional Natário-esque tensor inputs (pass-through; no defaults here)
export type NatarioTensorOpts = {
  lapseN?: number;                           // N
  shiftBeta?: [number,number,number];        // β^i
  gSpatialSym?: [number,number,number,number,number,number]; // gxx,gyy,gzz,gxy,gyz,gzx
};

function aHarmonic(ax: number, ay: number, az: number) {
  const a = +ax || 0, b = +ay || 0, c = +az || 0;
  const d = (a>0?1/a:0) + (b>0?1/b:0) + (c>0?1/c:0);
  return d > 0 ? 3 / d : NaN;
}

function req(cond: any, msg: string) {
  if (!cond) throw new Error(`adapter: ${msg}`);
}

export type DriveMetricOpts = {
  // Optional conformal metric inputs (Commit B)
  greens?: GreensPayload;   // φ samples; when present with kappa → metricMode
  metricKappa?: number;     // required to enable metric
  natario?: NatarioTensorOpts; // optional 3+1 tensors (pass-through)
  // Hooks-fed helpers (no defaults in adapter)
  metrics?: HelixMetrics;   // from use-metrics (for hull)
  wallWidth_m?: number;     // from useLightCrossingLoop or explicit UI
};

/**
 * Drop-in adapter: pipeline → WarpEngine (single source of truth, strict)
 * Call this every time the pipeline state changes (or on a fixed tick)
 */
export function driveWarpFromPipeline(
  engine: any,
  s: EnergyPipelineState,
  opts?: DriveMetricOpts
): void {
  if (!engine || !s) return;

  // ---- Axes (meters) -------------------------------------------------------
  // Prefer metrics.hull (full lengths) → semi-axes; else spherical shipRadius_m.
  const mh = opts?.metrics?.hull;
  const ax = Number.isFinite(mh?.Lx_m) ? (mh!.Lx_m/2) : (Number.isFinite((s as any).Lx_m) ? ((s as any).Lx_m/2) : +s.shipRadius_m ?? NaN);
  const ay = Number.isFinite(mh?.Ly_m) ? (mh!.Ly_m/2) : (Number.isFinite((s as any).Ly_m) ? ((s as any).Ly_m/2) : +s.shipRadius_m ?? NaN);
  const az = Number.isFinite(mh?.Lz_m) ? (mh!.Lz_m/2) : (Number.isFinite((s as any).Lz_m) ? ((s as any).Lz_m/2) : +s.shipRadius_m ?? NaN);
  req(Number.isFinite(ax)&&Number.isFinite(ay)&&Number.isFinite(az), "missing hull dimensions (metrics.hull or shipRadius_m)");
  const axesHull: [number,number,number] = [ax,ay,az];
  const aH = aHarmonic(ax,ay,az); req(Number.isFinite(aH), "bad harmonic radius from axes");

  // ---- Wall width (must be provided; no adapter defaults) ------------------
  const w_m_explicit =
    Number.isFinite(opts?.wallWidth_m) ? +opts!.wallWidth_m :
    Number.isFinite((opts?.metrics as any)?.hull?.wallThickness_m) ? +((opts!.metrics as any).hull.wallThickness_m) :
    Number.isFinite((s as any).wallWidth_m) ? +(s as any).wallWidth_m : NaN;
  const w_rho_explicit =
    Number.isFinite((s as any).wallWidth_rho) ? +(s as any).wallWidth_rho : NaN;
  const w_m   = Number.isFinite(w_m_explicit)   ? w_m_explicit   : (Number.isFinite(w_rho_explicit) ? w_rho_explicit * aH : NaN);
  const w_rho = Number.isFinite(w_rho_explicit) ? w_rho_explicit : (Number.isFinite(w_m_explicit)   ? w_m_explicit   / aH : NaN);
  req(Number.isFinite(w_m) && Number.isFinite(w_rho), "missing wallWidth_m or wallWidth_rho (provide via LC hook, metrics.hull, or pipeline)");

  // ---- Sectors / duty (must be explicit; no 400/1 defaults) ----------------
  const S_total = Number.isFinite((s as any).sectorsTotal)     ? +(s as any).sectorsTotal     :
                  Number.isFinite(s.sectorCount)               ? +s.sectorCount               : NaN;
  const S_live  = Number.isFinite((s as any).sectorsConcurrent)? +(s as any).sectorsConcurrent:
                  Number.isFinite(s.sectorStrobing)            ? +s.sectorStrobing            : NaN;
  req(Number.isFinite(S_total)&&Number.isFinite(S_live)&&S_total>=1&&S_live>=1, "missing sectorsTotal/sectorsConcurrent (or sectorCount/sectorStrobing)");
  const dutyLocal = Number.isFinite((s as any).localBurstFrac) ? +(s as any).localBurstFrac :
                    Number.isFinite(s.dutyCycle)               ? +s.dutyCycle                : NaN;
  const dutyEffectiveFR = Number.isFinite(s.dutyEffectiveFR)
    ? +s.dutyEffectiveFR
    : (req(Number.isFinite(dutyLocal), "missing localBurstFrac/dutyCycle for FR duty"), dutyLocal * (S_live/S_total));
  req(Number.isFinite(dutyEffectiveFR), "missing dutyEffectiveFR");

  // ---- Physics gains (must be present) -------------------------------------
  const gammaGeo  = +s.gammaGeo!;
  const gammaVdB  = Number.isFinite((s as any).gammaVanDenBroeck) ? +(s as any).gammaVanDenBroeck : NaN;
  const qSpoil    = Number.isFinite(s.qSpoilingFactor) ? +s.qSpoilingFactor :
                    Number.isFinite((s as any).deltaAOverA) ? +(s as any).deltaAOverA : NaN;
  req(Number.isFinite(gammaGeo)&&Number.isFinite(gammaVdB)&&Number.isFinite(qSpoil), "missing gammaGeo/gammaVanDenBroeck/qSpoilingFactor");

  // ---- Optional authoritative theta (verbatim from pipeline) ----------------
  const thetaScale = Number.isFinite((s as any).thetaScale) ? +(s as any).thetaScale :
                     Number.isFinite((s as any).thetaUniform) ? +(s as any).thetaUniform : undefined;

  // ---- Optional: conformal metric from Greens φ + κ -------------------------
  let metricMode = false; let gSpatialDiag: [number,number,number] | undefined;
  if (opts?.greens && Number.isFinite(opts?.metricKappa)) {
    const φ = opts.greens.phi; if (φ && φ.length>0) {
      let sum = 0; for (let i=0;i<φ.length;i++) sum += φ[i];
      const φ̄ = sum / φ.length; const κ = Number(opts.metricKappa);
      const c = 1 + κ*φ̄; gSpatialDiag = [c,c,c]; metricMode = true;
    }
  }

  // Optional: full symmetric spatial metric, lapse, shift (wins over diag if provided)
  let gSpatialSym: [number,number,number,number,number,number] | undefined;
  let lapseN: number | undefined;
  let shiftBeta: [number,number,number] | undefined;
  if (opts?.natario) {
    if (Array.isArray(opts.natario.gSpatialSym) && opts.natario.gSpatialSym.length>=6) gSpatialSym = opts.natario.gSpatialSym.map(Number) as any;
    if (Number.isFinite(opts.natario.lapseN)) lapseN = Number(opts.natario.lapseN);
    if (Array.isArray(opts.natario.shiftBeta) && opts.natario.shiftBeta.length>=3) shiftBeta = opts.natario.shiftBeta.map(Number) as any;
  }

  gatedUpdateUniforms(engine, {
    strictPhysics: true,
    axesHull,
    wallWidth: w_rho,
    wallWidth_rho: w_rho,
    wallWidth_m: w_m,
    sectorCount: S_total|0,
    sectorStrobing: S_live|0,
    dutyEffectiveFR,
    gammaGeo,
    gammaVanDenBroeck: gammaVdB,
    qSpoilingFactor: qSpoil,
    lockFraming: true,
    ...(typeof thetaScale === "number" ? { thetaScale } : {}),
    ...(metricMode ? { metricMode: true } : {}),
    ...(gSpatialDiag ? { gSpatialDiag } : {}),
    ...(gSpatialSym ?  { gSpatialSym }  : {}),
    ...(Number.isFinite(lapseN) ? { lapseN } : {}),
    ...(shiftBeta ? { shiftBeta } : {}),
  }, "server");
}
