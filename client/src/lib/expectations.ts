// expectations.ts
export function thetaScaleExpected({ gammaGeo=26, q=1, gammaVdB=1.4e5, dFR=0.000025 }) {
  // matches your "engine θ-scale (γ_geo^3 · q · γ_VdB · √d_FR)"
  return Math.pow(gammaGeo,3) * q * gammaVdB * Math.sqrt(dFR);
}

/**
 * Convert "expected" (which already includes √d_FR) into what the renderer
 * actually uses. When view averaging is ON, the engine applies no further duty
 * scaling—only the view-mass fraction matters. When view averaging is OFF, the
 * engine drops the √d_FR factor; undo it here for apples-to-apples checks.
 */
export function thetaScaleUsed(
  expected: number,
  { concurrent=1, total=400, dutyLocal=0.01, viewFraction=1, viewAveraging=true }
){
  const dFR = Math.max(1e-12, dutyLocal * (concurrent / Math.max(1, total)));
  if (viewAveraging) {
    // Renderer law matches expected; just scale by view fraction.
    return expected * Math.max(0, viewFraction);
  }
  // No averaging: engine omits √d_FR, so remove it from expected.
  return expected / Math.sqrt(dFR);
}