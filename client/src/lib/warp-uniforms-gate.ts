/**
 * Warp Uniforms Gate - Single Source of Truth
 * Prevents renderer conflicts by gating all engine uniform writes
 */

export type WarpUniforms = {
  gammaGeo: number;
  qSpoilingFactor: number;
  gammaVanDenBroeck: number;    // visual-only version for rendering
  gammaVanDenBroeck_vis?: number;  // explicit visual version
  gammaVanDenBroeck_mass?: number; // mass-calibrated version
  dutyEffectiveFR: number;
  sectorCount: number;
  sectors: number;
  thetaScale?: number;         // optional precomputed (server)
  thetaScaleExpected?: number; // server verification value
  colorMode?: 'theta'|'rho';
  physicsParityMode?: boolean;
  ridgeMode?: number;
  __src?: 'server'|'client'|'legacy';
  __version?: number;          // monotone
  [key: string]: any;          // Allow other engine-specific uniforms
};

let lastVersion = 0;
let lastSrc: string | undefined;

export function applyToEngine(
  engine: { updateUniforms: (u: any) => void },
  uniforms: WarpUniforms
) {
  // Normalize uniform names to ensure both spellings exist
  const normalizedUniforms = { ...uniforms };
  
  // Ensure both spellings exist for gamma VdB
  if (typeof normalizedUniforms.gammaVanDenBroeck === 'number' && typeof normalizedUniforms.gammaVdB !== 'number') {
    normalizedUniforms.gammaVdB = normalizedUniforms.gammaVanDenBroeck;
  }
  if (typeof normalizedUniforms.gammaVdB === 'number' && typeof normalizedUniforms.gammaVanDenBroeck !== 'number') {
    normalizedUniforms.gammaVanDenBroeck = normalizedUniforms.gammaVdB;
  }

  // Ensure both spellings exist for q spoiling
  if (typeof normalizedUniforms.qSpoilingFactor === 'number' && typeof normalizedUniforms.qSpoil !== 'number') {
    normalizedUniforms.qSpoil = normalizedUniforms.qSpoilingFactor;
  }
  if (typeof normalizedUniforms.qSpoil === 'number' && typeof normalizedUniforms.qSpoilingFactor !== 'number') {
    normalizedUniforms.qSpoilingFactor = normalizedUniforms.qSpoil;
  }
  
  const v = normalizedUniforms.__version ?? Date.now();
  const src = normalizedUniforms.__src || 'legacy';
  
  // Server canonical source always wins if it has newer or equal version
  if (src === 'server') {
    if (v >= lastVersion) {
      lastVersion = v;
      lastSrc = src;
    } else {
      console.warn('[warp:gating] drop older server uniforms v=', v, 'last=', lastVersion);
      return;
    }
  }
  // Legacy sources blocked if server has written
  else if (lastSrc === 'server' && src === 'legacy') {
    console.warn('[warp:gating] blocked legacy uniforms (server canonical active)');
    return;
  }
  // Standard version check for non-server sources
  else if (v < lastVersion) {
    console.warn('[warp:gating] drop older uniforms from', src, 'v=', v, 'last=', lastVersion);
    return;
  } else {
    lastVersion = v;
    lastSrc = src;
  }

  // Canonical θ if server didn't precompute
  // Use visual-only γ_VdB to keep mass calibration away from theta calculations
  const gammaVdB_vis = normalizedUniforms.gammaVanDenBroeck_vis ?? normalizedUniforms.gammaVanDenBroeck;
  const θ = normalizedUniforms.thetaScale ?? (
    Math.pow(normalizedUniforms.gammaGeo, 3) *
    normalizedUniforms.qSpoilingFactor *
    gammaVdB_vis *
    normalizedUniforms.dutyEffectiveFR
  );

  // Apply locked display settings - modes only change physics, not visuals
  const lockedUniforms = {
    ...normalizedUniforms,
    thetaScale: θ,
    ridgeMode: 0,
    exposure: 5.0,
    zeroStop: 1e-7,
    colorMode: 'theta',
    viewAvg: true,
    // Always ensure viewMassFraction is available and defaulted
    viewMassFraction: Number.isFinite(normalizedUniforms?.viewMassFraction) ? normalizedUniforms.viewMassFraction : 1.0,
  };

  // Debug echo (what we actually bind)
  (window as any).__warpEcho = {
    v, src: normalizedUniforms.__src, θ_used: θ,
    terms: {
      γ_geo: normalizedUniforms.gammaGeo,
      q: normalizedUniforms.qSpoilingFactor,
      γ_VdB: gammaVdB_vis,  // use visual version for debug display
      γ_VdB_mass: normalizedUniforms.gammaVanDenBroeck_mass, // also show mass version  
      d_FR: normalizedUniforms.dutyEffectiveFR,
      sectors: { total: normalizedUniforms.sectorCount, live: normalizedUniforms.sectors }
    }
  };

  engine.updateUniforms(lockedUniforms);
}

/**
 * Convenience wrapper for legacy updateUniforms calls
 * Automatically adds version and source tracking
 */
export function gatedUpdateUniforms(engineLike: any, uniforms: any, source = 'legacy') {
  // Normalize engine input: we allow either a real engine or a {updateUniforms} shim
  const eng = engineLike && typeof engineLike.updateUniforms === 'function'
    ? engineLike
    : engineLike && engineLike.updateUniforms != null
      ? engineLike     // allow undefined here; we'll defer
      : null;

  if (!eng) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[gatedUpdateUniforms] missing engine; skip', { source, patch: uniforms });
    }
    return;
  }

  // Compute your lockedUniforms as before
  const gatedUniforms: WarpUniforms = {
    ...uniforms,
    __src: source,
    __version: Date.now()
  };

  const send = () => {
    try {
      if (typeof eng.updateUniforms === 'function') {
        applyToEngine(eng, gatedUniforms);
      } else {
        // try once after init completes if the engine exposes a ready hook
        if (typeof eng.onceReady === 'function') {
          eng.onceReady(() => eng.updateUniforms && applyToEngine(eng, gatedUniforms));
        } else {
          // last-resort microtask; harmless no-op if still not available
          queueMicrotask(() => eng.updateUniforms && applyToEngine(eng, gatedUniforms));
        }
      }
    } catch (e) {
      console.error('[gatedUpdateUniforms] failed', { source, e });
    }
  };

  // If the engine exposes readiness signals, honor them
  if (eng.isLoaded && eng.gridProgram) {
    send();
  } else if (typeof eng.onceReady === 'function') {
    eng.onceReady(send);
  } else {
    queueMicrotask(send);
  }
}

/**
 * Reset gating state (for testing or debugging)
 */
export function resetGate() {
  lastVersion = 0;
  lastSrc = undefined;
}