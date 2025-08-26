// expectations.ts
export function thetaScaleExpected({ gammaGeo=26, q=1, gammaVdB=1.4e5, dFR=0.000025 }) {
  // matches your "engine θ-scale (γ_geo^3 · q · γ_VdB · √d_FR)"
  return Math.pow(gammaGeo,3) * q * gammaVdB * Math.sqrt(dFR);
}

export function thetaScaleUsed(expected: number, {
  concurrent=1, total=400, dutyLocal=0.01, viewFraction=1, viewAveraging=true
}) {
  const sectorFrac = concurrent/total;
  const view = viewAveraging ? viewFraction : 1;
  return expected * sectorFrac * dutyLocal * view;
}