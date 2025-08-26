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

  // ---- Canonical θ (renderer law √d_FR) with safe defaults -----------------
  // visual-only γ_VdB to keep mass calibration away from renderer
  const gammaVdB_vis =
    (typeof normalizedUniforms.gammaVanDenBroeck_vis === 'number' && normalizedUniforms.gammaVanDenBroeck_vis) ??
    (typeof normalizedUniforms.gammaVanDenBroeck === 'number' && normalizedUniforms.gammaVanDenBroeck) ??
    (typeof normalizedUniforms.gammaVdB === 'number' && normalizedUniforms.gammaVdB) ?? 1;

  const gammaGeo = Math.max(1, Number(normalizedUniforms.gammaGeo ?? 26));
  const q = Math.max(1e-12, Number(
    normalizedUniforms.qSpoilingFactor ?? normalizedUniforms.deltaAOverA ?? 1
  ));

  // FR duty guard: use provided value or compute 0.01 × (S_live / S_total)
  const sectorsTotal = Math.max(1, Number(normalizedUniforms.sectorCount ?? 400));
  const sectorsLive  = Math.max(1, Number(normalizedUniforms.sectors ?? 1));
  const dutyLocal    = Number.isFinite(+normalizedUniforms.dutyLocal)
    ? Math.max(1e-12, Number(normalizedUniforms.dutyLocal))
    : 0.01;
  const dutyFR = Math.max(
    1e-12,
    Number(normalizedUniforms.dutyEffectiveFR ??
      (dutyLocal * (sectorsLive / sectorsTotal)))
  );

  const thetaFromChain =
    Math.pow(gammaGeo, 3) * q * Math.max(1, Number(gammaVdB_vis)) * Math.sqrt(dutyFR);
  const θ = (normalizedUniforms.thetaScale != null && Number.isFinite(+normalizedUniforms.thetaScale))
    ? Number(normalizedUniforms.thetaScale)
    : thetaFromChain;

  // ---- Display locks (non-physics) ----------------------------------------
  const viewAvg = (normalizedUniforms.viewAvg ?? true) ? true : false;
  const exposure = Number.isFinite(+normalizedUniforms.exposure) ? +normalizedUniforms.exposure : 5.0;
  const zeroStop = Number.isFinite(+normalizedUniforms.zeroStop) ? +normalizedUniforms.zeroStop : 1e-7;
  const colorMode = normalizedUniforms.colorMode ?? 'theta';

  // Respect caller's ridgeMode; if absent, infer from parity (REAL→0, SHOW→1)
  let ridgeMode = normalizedUniforms.ridgeMode;
  if (ridgeMode == null && typeof normalizedUniforms.physicsParityMode === 'boolean') {
    ridgeMode = normalizedUniforms.physicsParityMode ? 0 : 1;
  }

  // Ensure viewMassFraction always present
  const viewMassFraction = Number.isFinite(+normalizedUniforms.viewMassFraction)
    ? Number(normalizedUniforms.viewMassFraction)
    : 1.0;

  // CameraZ helper (prevents "CameraZ unset" warnings)
  let cameraZ = normalizedUniforms.cameraZ as any;
  let lockFraming = normalizedUniforms.lockFraming as any;
  if (!Number.isFinite(cameraZ)) {
    const ax = (normalizedUniforms as any).axesClip;
    if (Array.isArray(ax) && ax.length === 3) {
      const R = Math.max(1e-6, Math.max(ax[0]||0, ax[1]||0, ax[2]||0));
      const fov = Math.PI / 3.2; // ~56°
      cameraZ = (1.8 * R) / Math.tan(fov * 0.5);
      lockFraming = true;
    }
  }

  const lockedUniforms: any = {
    ...normalizedUniforms,
    thetaScale: θ,
    dutyEffectiveFR: dutyFR,   // echo back the authoritative duty
    exposure,
    zeroStop,
    colorMode,
    viewAvg,
    viewMassFraction,
  };
  if (ridgeMode != null) lockedUniforms.ridgeMode = ridgeMode;
  if (Number.isFinite(cameraZ)) {
    lockedUniforms.cameraZ = cameraZ;
    lockedUniforms.lockFraming = (lockFraming ?? true);
  }

  // Debug echo (what we actually bind)
  (window as any).__warpEcho = {
    v, src: normalizedUniforms.__src, θ_used: θ,
    terms: {
      γ_geo: gammaGeo,
      q,
      γ_VdB: gammaVdB_vis,
      γ_VdB_mass: normalizedUniforms.gammaVanDenBroeck_mass,
      d_FR: dutyFR,
      viewAvg,
      viewMassFraction,
      sectors: { total: sectorsTotal, live: sectorsLive }
    }
  };
  engine.updateUniforms(lockedUniforms);
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