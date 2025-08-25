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
  if (v < lastVersion) {
    console.warn('[warp:gating] drop older uniforms from', uniforms.__src, 'v=', v, 'last=', lastVersion);
    return;
  }
  lastVersion = v;
  lastSrc = uniforms.__src;

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