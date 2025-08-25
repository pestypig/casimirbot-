/**
 * Warp Uniforms Gate - Single Source of Truth
 * Prevents renderer conflicts by gating all engine uniform writes
 */

export type WarpUniforms = {
  gammaGeo: number;
  qSpoilingFactor: number;
  gammaVanDenBroeck: number;
  dutyEffectiveFR: number;
  sectorCount: number;
  sectors: number;
  thetaScale?: number;         // optional precomputed (server)
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
  const v = uniforms.__version ?? Date.now();
  const src = uniforms.__src || 'legacy';
  
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
  const θ = uniforms.thetaScale ?? (
    Math.pow(uniforms.gammaGeo, 3) *
    uniforms.qSpoilingFactor *
    uniforms.gammaVanDenBroeck *
    uniforms.dutyEffectiveFR
  );

  // Debug echo (what we actually bind)
  (window as any).__warpEcho = {
    v, src: uniforms.__src, θ_used: θ,
    terms: {
      γ_geo: uniforms.gammaGeo,
      q: uniforms.qSpoilingFactor,
      γ_VdB: uniforms.gammaVanDenBroeck,
      d_FR: uniforms.dutyEffectiveFR,
      sectors: { total: uniforms.sectorCount, live: uniforms.sectors }
    }
  };

  engine.updateUniforms({ ...uniforms, thetaScale: θ });
}

/**
 * Convenience wrapper for legacy updateUniforms calls
 * Automatically adds version and source tracking
 */
export function gatedUpdateUniforms(
  engine: { updateUniforms: (u: any) => void },
  uniforms: any,
  source: string = 'legacy'
) {
  const gatedUniforms: WarpUniforms = {
    ...uniforms,
    __src: source,
    __version: Date.now()
  };
  
  applyToEngine(engine, gatedUniforms);
}

/**
 * Reset gating state (for testing or debugging)
 */
export function resetGate() {
  lastVersion = 0;
  lastSrc = undefined;
}