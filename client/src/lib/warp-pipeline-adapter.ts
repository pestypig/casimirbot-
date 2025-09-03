

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
export function driveWarpFromPipeline(engine: any, pipeline: any, options?: { mode?: 'REAL'|'SHOW', strict?: boolean }) {
  if (!engine || !pipeline) return;
  const mode   = options?.mode ?? 'REAL';
  const strict = options?.strict ?? true;

  // ---------- 1) Light-Crossing timing pass-through (no fabrication) ----------
  const lcSrc = (pipeline.lc ?? pipeline.lightCrossing ?? {}) as any;
  const lcPayload = {
    tauLC_ms:   finite(lcSrc.tauLC_ms),
    dwell_ms:   finite(lcSrc.dwell_ms),
    burst_ms:   finite(lcSrc.burst_ms),
    phase:      finite(lcSrc.phase),
    onWindow:   booly(lcSrc.onWindow),
    sectorIdx:  inty(lcSrc.sectorIdx),
    sectorCount:inty(pipeline.sectorCount ?? lcSrc.sectorCount),
  };

  // ---------- 2) Duty selection by MODE (no recompute on client) -------------
  // Prefer pipeline duty used for rendering; if multiple, choose by mode.
  // Accepted keys (in priority order):
  //   dutyUsed, dutyEffectiveFR, dutyFR_slice (REAL), dutyFR_ship (SHOW)
  let dUsed: number | undefined = finite((pipeline as any).dutyUsed);
  if (!isFinite(dUsed as number)) dUsed = finite((pipeline as any).dutyEffectiveFR);
  if (!isFinite(dUsed as number)) {
    const dSlice = finite((pipeline as any).dutyFR_slice);
    const dShip  = finite((pipeline as any).dutyFR_ship);
    if (mode === 'REAL' && isFinite(dSlice as number)) dUsed = dSlice!;
    if (mode === 'SHOW' && isFinite(dShip as number))  dUsed = dShip!;
  }

  // ---------- 3) Physics gains & θ verbatim from pipeline --------------------
  const uniforms: any = {
    // wall width & axes are passed elsewhere in your pipeline; keep as-is
    gammaGeo:         finite(pipeline.gammaGeo),
    qSpoilingFactor:  finite((pipeline as any).qSpoilingFactor ?? (pipeline as any).deltaAOverA),
    gammaVdB:         finite((pipeline as any).gammaVdB ?? (pipeline as any).gammaVanDenBroeck),
    thetaScale:       finite((pipeline as any).thetaScale ?? (pipeline as any).thetaUniform),
    sectorCount:      inty(pipeline.sectorCount),
    // tensors (if present)
    metricMode:       booly((pipeline as any).metricMode),
    gSpatialDiag:     arrayOrUndef((pipeline as any).gSpatialDiag, 3),
    gSpatialSym:      arrayOrUndef((pipeline as any).gSpatialSym, 6),
    lapseN:           finite((pipeline as any).lapseN),
    shiftBeta:        arrayOrUndef((pipeline as any).shiftBeta, 3),
    // duty used by renderer (Ford–Roman)
    dutyUsed:         dUsed,
  };

  // Strict scientific mode: do not push partial physics
  if (strict) {
    const missing: string[] = [];
    if (!isFinite(uniforms.thetaScale as number)) missing.push('thetaScale');
    if (!isFinite(uniforms.gammaGeo as number))   missing.push('gammaGeo');
    if (!isFinite(uniforms.qSpoilingFactor as number)) missing.push('q (spoiling)');
    if (!isFinite(uniforms.gammaVdB as number))   missing.push('gammaVdB');
    if (!isFinite(uniforms.sectorCount as number))missing.push('sectorCount');
    if (!isFinite(dUsed as number))               missing.push('dutyUsed');
    if (!isFinite(lcPayload.tauLC_ms as number) || !isFinite(lcPayload.dwell_ms as number) || !isFinite(lcPayload.burst_ms as number)) {
      missing.push('LC(tauLC_ms/dwell_ms/burst_ms)');
    }
    if (missing.length) {
      engine.uniforms = engine.uniforms || {};
      engine.uniforms.__error = `adapter: missing ${missing.join(', ')}`;
      return; // do not push
    }
  }

  // Mirror LC to engine (engine will also publish to uniforms)
  engine.setLightCrossing?.(lcPayload);
  // Push physics verbatim (single write)
  engine.updateUniforms?.(uniforms);
}

function finite(x: any){ const n = +x; return Number.isFinite(n) ? n : undefined; }
function inty(x: any){ const n = Math.floor(+x); return Number.isFinite(n) ? n : undefined; }
function booly(x: any){ return x === true || x === 1 || x === '1'; }
function arrayOrUndef(arr: any, needLen: number){ return (Array.isArray(arr) && arr.length >= needLen) ? arr : undefined; }

