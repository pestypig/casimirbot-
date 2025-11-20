import { buildStressEnergyBrick } from "./server/stress-energy-brick";
const params = {
  dims: [20, 12, 12] as [number, number, number],
  phase01: 0.125,
  sigmaSector: 0.05,
  splitEnabled: true,
  splitFrac: 0.6,
  dutyFR: 0.0025,
  q: 1,
  gammaGeo: 26,
  gammaVdB: 1e5,
  ampBase: 0.15,
  zeta: 0.82,
};
const brick = buildStressEnergyBrick(params);
const stats = brick.stats;
const netMag = Math.hypot(stats.netFlux[0], stats.netFlux[1], stats.netFlux[2]);
const divPeak = Math.max(Math.abs(stats.divMin ?? 0), Math.abs(stats.divMax ?? 0));
console.log(JSON.stringify({
  avgFlux: stats.avgFluxMagnitude,
  netMag,
  divPeak,
  natario: stats.natario,
}, null, 2));
