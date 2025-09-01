/**
 * Warp Uniforms Gate - Single Source of Truth
 * Prevents renderer conflicts by gating all engine uniform writes
 */

import { DebounceConfig, createDebouncedFunction } from './usePollingSmart';

// Canonical uniform name mapping to prevent shader header duplication
// Match shader uniform names exactly (underscored)
const CANON = {
  physicsParityMode: 'u_physicsParityMode',
  ridgeMode:         'u_ridgeMode',
  epsilonTilt:       'u_epsilonTilt',
  betaTiltVec:       'u_betaTiltVec'
} as const;

// Create a debounced uniform update function per engine instance
const engineDebouncers = new WeakMap<any, ReturnType<typeof createDebouncedFunction>>();

function getDebouncedUpdate(engine: any): ReturnType<typeof createDebouncedFunction> {
  if (!engineDebouncers.has(engine)) {
    const config: DebounceConfig = {
      delay: 16, // ~60fps
      maxDelay: 100, // Force update after 100ms max
      immediate: false
    };

    const debouncedFn = createDebouncedFunction((uniforms: any) => {
      if (engine && typeof engine.updateUniforms === 'function') {
        engine.updateUniforms(uniforms);
      }
      if (engine && typeof engine.forceRedraw === 'function') {
        engine.forceRedraw();
      }
    }, config);

    engineDebouncers.set(engine, debouncedFn);
  }

  return engineDebouncers.get(engine)!;
}

export type WarpUniforms = {
  // geometry
  hull?: { a:number; b:number; c:number };
  axesScene?: [number,number,number];
  axesClip?: [number,number,number];
  cameraZ?: number;
  lockFraming?: boolean;

  // duty / sectoring
  sectorCount: number;      // total sectors
  sectors: number;          // concurrent live sectors
  dutyCycle?: number;       // UI duty (0..1)
  dutyLocal?: number;       // local on-window duty (defaults to 0.01 if missing)
  dutyEffectiveFR: number;  // Ford–Roman ship-wide duty (0..1)

  // physics amps
  gammaGeo: number;

  // q (ΔA/A) aliases
  deltaAOverA?: number;
  qSpoilingFactor?: number;
  qSpoil?: number;

  // γ_VdB aliases
  gammaVanDenBroeck?: number;      // legacy/visual
  gammaVdB?: number;               // short alias
  gammaVanDenBroeck_vis?: number;  // explicit visual version
  gammaVanDenBroeck_mass?: number; // mass-calibrated (pass-through)

  // mech/cavity Q aliases (pass-through for consumers that need them)
  qMechanical?: number;
  qMech?: number;
  qCavity?: number;
  qCav?: number;

  // θ scaling
  thetaScale?: number;             // server-precomputed θ (authoritative if present)
  thetaScaleExpected?: number;     // server verification value (for audit)
  thetaDutyExponent?: number;      // optional duty exponent (default 1.0). Viz may set 0.5
  __vizDutySqrt?: boolean;         // legacy viz toggle → exponent 0.5

  // view
  colorMode?: 'theta'|'rho';
  viewAvg?: boolean;
  viewMassFraction?: number;       // 0..1
  physicsParityMode?: boolean;
  ridgeMode?: number;
  exposure?: number;
  zeroStop?: number;

  // provenance
  __src?: 'server'|'client'|'legacy';
  __version?: number;              // monotone

  // timing hints (pass-through)
  onWindowDisplay?: boolean;
  cyclesPerBurst?: number;
  dwell_ms?: number;
  tauLC_ms?: number;

  [key: string]: any;              // allow other engine-specific uniforms
};

let lastVersion = 0;
let lastSrc: string | undefined;

const EPS = 1e-12;
const N = (x:any, d:number) => (Number.isFinite(+x) ? +x : d);
const POS = (x:any, d:number) => Math.max(d, N(x, d));

export function applyToEngine(
  engine: { updateUniforms: (u: any) => void },
  uniforms: WarpUniforms
) {
  // --- 1) Normalize aliases --------------------------------------------------
  const u: any = { ...uniforms };

  // γ_VdB aliases ↔ mirror both ways
  if (typeof u.gammaVanDenBroeck === 'number' && typeof u.gammaVdB !== 'number') {
    u.gammaVdB = u.gammaVanDenBroeck;
  }
  if (typeof u.gammaVdB === 'number' && typeof u.gammaVanDenBroeck !== 'number') {
    u.gammaVanDenBroeck = u.gammaVdB;
  }
  if (typeof u.gammaVanDenBroeck_vis !== 'number') {
    u.gammaVanDenBroeck_vis = (typeof u.gammaVdB === 'number' ? u.gammaVdB : u.gammaVanDenBroeck);
  }

  // q (ΔA/A) aliases ↔ mirror
  const qCanon = POS(u.deltaAOverA ?? u.qSpoilingFactor ?? u.qSpoil, 1);
  u.deltaAOverA     = qCanon;
  u.qSpoilingFactor = qCanon;
  u.qSpoil          = qCanon;

  // qMechanical / qMech aliases ↔ mirror (pass-through; not used here but useful to consumers)
  const qMechCanon = N(u.qMechanical ?? u.qMech, NaN);
  if (Number.isFinite(qMechCanon)) {
    u.qMechanical = qMechCanon;
    u.qMech = qMechCanon;
  }

  // qCavity / qCav aliases ↔ mirror (pass-through)
  const qCavCanon = N(u.qCavity ?? u.qCav, NaN);
  if (Number.isFinite(qCavCanon)) {
    u.qCavity = qCavCanon;
    u.qCav = qCavCanon;
  }

  // --- 2) Version / source gate --------------------------------------------
  const v = N(u.__version, Date.now());
  const src = u.__src || 'legacy';

  if (src === 'server') {
    if (v >= lastVersion) {
      lastVersion = v;
      lastSrc = src;
    } else {
      console.warn('[warp:gating] drop older server uniforms v=', v, 'last=', lastVersion);
      return;
    }
  } else if (lastSrc === 'server' && src === 'legacy') {
    console.warn('[warp:gating] blocked legacy uniforms (server canonical active)');
    return;
  } else if (v < lastVersion) {
    console.warn('[warp:gating] drop older uniforms from', src, 'v=', v, 'last=', lastVersion);
    return;
  } else {
    lastVersion = v;
    lastSrc = src;
  }

  // --- 3) Compute canonical θ ----------------------------------------------
  const gammaGeo = POS(u.gammaGeo, 26);
  const q = POS(u.qSpoilingFactor, 1);

  // Select appropriate γ_VdB based on parity mode
  const isREAL = !!u.physicsParityMode;
  const gammaVdB_vis = isREAL
    ? POS(u.gammaVanDenBroeck_mass ?? u.gammaVanDenBroeck ?? u.gammaVdB, 1)
    : POS(u.gammaVanDenBroeck_vis ?? u.gammaVanDenBroeck ?? u.gammaVdB, 1);

  // Sectors / Duties
  const sectorsTotal = Math.max(1, N(u.sectorCount, 400));
  const sectorsLive  = Math.max(1, Math.min(sectorsTotal, N(u.sectors, 1)));

  // Local duty for provenance (UI/local)
  const dutyLocal = POS(u.dutyLocal ?? u.dutyCycle, 0.01);

  // Ford–Roman ship-wide duty: authoritative if provided, else derive
  const dutyFR = POS(
    u.dutyEffectiveFR ?? (dutyLocal * (sectorsLive / sectorsTotal)),
    1e-12
  );

  // Duty exponent: when view-averaged, default to √(d_FR)
  const dutyExp = Number.isFinite(+u.thetaDutyExponent)
    ? +u.thetaDutyExponent
    : ((u.__vizDutySqrt || (u.viewAvg ?? false)) ? 0.5 : 1.0);

  // Fallback chain matches backend physics by default (exp=1). Viz may compress range with exp=0.5.
  const thetaFromChain = Math.pow(gammaGeo, 3) * q * gammaVdB_vis * Math.pow(dutyFR, dutyExp);

  // Always use chain; never adopt a raw thetaScale from payloads
  const thetaUsed = thetaFromChain;

  // Optional audit vs expected
  if (Number.isFinite(+u.thetaScaleExpected) && Number.isFinite(+thetaUsed)) {
    const exp = +u.thetaScaleExpected;
    const rel = Math.abs(thetaUsed - exp) / Math.max(EPS, Math.abs(exp));
    if (rel > 0.10) {
      console.warn('[warp:gating] θ mismatch vs expected (>|10%|): used=', thetaUsed, 'expected=', exp, 'rel=', (rel*100).toFixed(1)+'%');
    }
  }

  // --- 4) Display/fit helpers ----------------------------------------------
  const colorMode = (u.colorMode === 'rho' ? 'rho' : 'theta');
  const viewAvg = (u.viewAvg ?? false) ? true : false;

  // Ensure viewMassFraction present
  const viewMassFraction = Math.max(0, Math.min(1, N(u.viewMassFraction, sectorsLive / sectorsTotal)));

  // Exposure / zeroStop defaults (non-physics)
  const exposure = Number.isFinite(+u.exposure) ? +u.exposure : 5.0;
  const zeroStop = Number.isFinite(+u.zeroStop) ? +u.zeroStop : 1e-7;

  // Ridge mode: respect caller; else infer from parity (REAL→0, SHOW→1)
  let ridgeMode = u.ridgeMode;
  if (ridgeMode == null && typeof u.physicsParityMode === 'boolean') {
    ridgeMode = u.physicsParityMode ? 0 : 1;
  }

  // axesClip → derive from axesClip | axesScene | hull
  let axesClip: [number,number,number] | undefined = u.axesClip;
  if (!axesClip) {
    if (Array.isArray(u.axesScene) && u.axesScene.length === 3) {
      axesClip = [ Math.abs(u.axesScene[0]||0), Math.abs(u.axesScene[1]||0), Math.abs(u.axesScene[2]||0) ];
    } else if (u.hull && Number.isFinite(u.hull.a) && Number.isFinite(u.hull.b) && Number.isFinite(u.hull.c)) {
      axesClip = [ Math.abs(u.hull.a), Math.abs(u.hull.b), Math.abs(u.hull.c) ];
    }
  }

  // CameraZ helper (prevents "CameraZ unset" warnings) — only fill if missing
  let cameraZ = u.cameraZ as any;
  let lockFraming = u.lockFraming as any;
  if (!Number.isFinite(cameraZ) && axesClip) {
    const R = Math.max(1e-6, Math.max(axesClip[0], axesClip[1], axesClip[2]));
    const fov = Math.PI / 3.2; // ~56°
    cameraZ = (1.8 * R) / Math.tan(fov * 0.5);
    lockFraming = true;
  }

  // --- 5) Final locked uniforms pushed to engine ----------------------------
  const locked: any = {
    ...u,
    // canonical outputs (don't override engine's authoritative theta)
    // thetaScale: thetaUsed, // REMOVED - let engine compute authoritatively
    dutyEffectiveFR: dutyFR,
    // mirrored aliases (so downstream can use any)
    gammaVdB: gammaVdB_vis,
    gammaVanDenBroeck: gammaVdB_vis,
    deltaAOverA: q,
    qSpoilingFactor: q,
    qSpoil: q,
    // view locks
    colorMode,
    viewAvg,
    viewMassFraction,
    exposure,
    zeroStop,
    ridgeMode,
    // geometry / framing
    axesClip: axesClip ?? u.axesClip,
    cameraZ: Number.isFinite(cameraZ) ? cameraZ : u.cameraZ,
    lockFraming: (lockFraming ?? u.lockFraming ?? false),
  };

  // Debug echo (what we actually bind)
  (window as any).__warpEcho = {
    v, src,
    theta_used: thetaUsed,
    theta_dutyExp: dutyExp,
    terms: {
      gammaGeo, q, gammaVdB_vis, dutyFR,
      sectors: { total: sectorsTotal, live: sectorsLive },
      viewAvg, viewMassFraction
    }
  };

  engine.updateUniforms(locked);
}

/**
 * Convenience wrapper for legacy updateUniforms calls
 * Automatically adds version and source tracking
 */
export function gatedUpdateUniforms(
  engine: any,
  patch: any,
  source: 'server'|'client'|'legacy' = 'legacy'
) {
  if (!engine || !patch) return;

  try {
    const u: Record<string, any> = {...patch};

    // sanitize + rename to prevent shader header duplication
    if ('physicsParityMode' in u) u[CANON.physicsParityMode] = !!u.physicsParityMode;
    if ('ridgeMode' in u)         u[CANON.ridgeMode]         = (u.ridgeMode|0) ? 1 : 0;

    if ('epsilonTilt' in u)       u[CANON.epsilonTilt]       = Math.max(0, +u.epsilonTilt || 0);
    if ('betaTiltVec' in u && Array.isArray(u.betaTiltVec)) {
      const [x=0,y=0,z=0] = u.betaTiltVec.map(Number);
      const n = Math.hypot(x,y,z) || 1;
      u[CANON.betaTiltVec] = [x/n, y/n, z/n];
    }

    // strip legacy keys so we never double-write engine params
    delete u.physicsParityMode; delete u.ridgeMode;
    delete u.epsilonTilt; delete u.betaTiltVec;

    const debouncedUpdate = getDebouncedUpdate(engine);
    debouncedUpdate(u);
  } catch (error) {
    console.warn(`[warp-uniforms-gate] Error updating uniforms from ${source}:`, error);
    // Fallback to direct update
    try {
      if (engine && typeof engine.updateUniforms === 'function') {
        engine.updateUniforms(patch);
      }
      if (engine && typeof engine.forceRedraw === 'function') {
        engine.forceRedraw();
      }
    } catch (fallbackError) {
      console.error(`[warp-uniforms-gate] Fallback update also failed:`, fallbackError);
    }
  }
}

/**
 * Reset gating state (for testing or debugging)
 */
export function resetGate() {
  lastVersion = 0;
  lastSrc = undefined;
}