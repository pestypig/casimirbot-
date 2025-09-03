


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
  pipeline: any,
  options?: { mode?: 'REAL'|'SHOW'; strict?: boolean }
) {
  if (!engine || !pipeline) return;
  const mode   = options?.mode ?? 'REAL';
  const strict = options?.strict ?? true;

  // ---- 1) Normalize Light-Crossing (accept alt keys; convert μs→ms) ----------
  const lcSrc: any = (pipeline.lc ?? pipeline.lightCrossing ?? {});
  const tauLC_ms = _finite(lcSrc.tauLC_ms ?? (lcSrc.tau_ms) ?? (lcSrc.tau_us != null ? lcSrc.tau_us/1000 : undefined));
  const dwell_ms = _finite(lcSrc.dwell_ms ?? (lcSrc.dwell_ms) ?? (lcSrc.dwell_us != null ? lcSrc.dwell_us/1000 : undefined));
  const burst_ms = _finite(lcSrc.burst_ms ?? (lcSrc.burst_ms) ?? (lcSrc.burst_us != null ? lcSrc.burst_us/1000 : undefined));
  const phase    = _finite(lcSrc.phase);
  const onWindow = _booly(lcSrc.onWindow);
  const sectorIdx   = _inty(lcSrc.sectorIdx);
  const sectorCount = _inty(pipeline.sectorCount ?? lcSrc.sectorCount);
  const lcPayload = { tauLC_ms, dwell_ms, burst_ms, phase, onWindow, sectorIdx, sectorCount };

  // ---- 2) Duty used by renderer (Ford–Roman), selected by MODE --------------
  // prefer explicit dutyUsed → dutyEffectiveFR → (slice/ship by mode)
  let dutyUsed = _finite((pipeline as any).dutyUsed);
  if (!_isFinite(dutyUsed)) dutyUsed = _finite((pipeline as any).dutyEffectiveFR);
  if (!_isFinite(dutyUsed)) {
    const dSlice = _finite((pipeline as any).dutyFR_slice);
    const dShip  = _finite((pipeline as any).dutyFR_ship);
    if (mode === 'REAL'  && _isFinite(dSlice)) dutyUsed = dSlice!;
    if (mode === 'SHOW'  && _isFinite(dShip))  dutyUsed = dShip!;
  }

  // ---- 3) Physics & tensors verbatim from pipeline --------------------------
  const uniforms: any = {
    // primary physics
    gammaGeo:        _finite(pipeline.gammaGeo),
    qSpoilingFactor: _finite((pipeline as any).qSpoilingFactor ?? (pipeline as any).deltaAOverA),
    gammaVdB:        _finite((pipeline as any).gammaVdB ?? (pipeline as any).gammaVanDenBroeck),
    thetaScale:      _finite((pipeline as any).thetaScale ?? (pipeline as any).thetaUniform),
    sectorCount:     _inty(pipeline.sectorCount),
    dutyUsed,
    // explicit rendering mode flags (no boosts; just authority tags)
    physicsParityMode: (mode === 'REAL'),
    ridgeMode:          (mode === 'SHOW') ? 1 : 0,
    // axes & wall width pass-through if present
    axesHull:      _arrN((pipeline as any).axesHull, 3),
    axesMeters:    _arrN((pipeline as any).axesMeters ?? (pipeline as any).axesHull_m, 3),
    wallWidth_m:   _finite((pipeline as any).wallWidth_m),
    wallWidth_rho: _finite((pipeline as any).wallWidth_rho),
    // tensors (optional)
    metricMode:    _booly((pipeline as any).metricMode),
    gSpatialDiag:  _arrN((pipeline as any).gSpatialDiag, 3),
    gSpatialSym:   _arrN((pipeline as any).gSpatialSym, 6),
    lapseN:        _finite((pipeline as any).lapseN),
    shiftBeta:     _arrN((pipeline as any).shiftBeta, 3),
    viewForward:   _arrN((pipeline as any).viewForward, 3),
    g0i:           _arrN((pipeline as any).g0i, 3),
  };

  // ---- 4) Strict gate: refuse to push partial physics -----------------------
  if (strict) {
    const miss: string[] = [];
    if (!_isFinite(uniforms.thetaScale))      miss.push('thetaScale');
    if (!_isFinite(uniforms.gammaGeo))        miss.push('gammaGeo');
    if (!_isFinite(uniforms.qSpoilingFactor)) miss.push('qSpoilingFactor');
    if (!_isFinite(uniforms.gammaVdB))        miss.push('gammaVdB');
    if (!_isFinite(uniforms.sectorCount))     miss.push('sectorCount');
    if (!_isFinite(uniforms.dutyUsed))        miss.push('dutyUsed');
    if (!_isFinite(tauLC_ms) || !_isFinite(dwell_ms) || !_isFinite(burst_ms)) {
      miss.push('LC(tauLC_ms/dwell_ms/burst_ms)');
    }
    if (miss.length) {
      engine.uniforms = engine.uniforms || {};
      engine.uniforms.__error = `adapter: missing ${miss.join(', ')}`;
      return; // stop here; viewers will show the error string
    }
  }

  // ---- 5) Push to engine (single source of truth) ---------------------------
  engine.setLightCrossing?.(lcPayload);     // mirrors into uniforms
  engine.updateUniforms?.(uniforms);        // verbatim physics/tensors
  engine.requestRewarp?.();                 // optional: force rebind/recalc
}

// ---------- tiny helpers (scoped to this module) ----------
function _finite(x:any){ const n = +x; return Number.isFinite(n) ? n : undefined; }
function _inty(x:any){ const n = Math.floor(+x); return Number.isFinite(n) ? n : undefined; }
function _booly(x:any){ return x===true || x===1 || x==='1'; }
function _isFinite(x:any){ return Number.isFinite(+x); }
function _arrN(a:any, k:number){
  return (Array.isArray(a) && a.length>=k) ? a : undefined;
}

function finite(x: any){ const n = +x; return Number.isFinite(n) ? n : undefined; }
function inty(x: any){ const n = Math.floor(+x); return Number.isFinite(n) ? n : undefined; }
function booly(x: any){ return x === true || x === 1 || x === '1'; }
function arrayOrUndef(arr: any, needLen: number){ return (Array.isArray(arr) && arr.length >= needLen) ? arr : undefined; }
