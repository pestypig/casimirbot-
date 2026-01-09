import type { GridSpec, Vec3 } from "./bssn-state.js";
import type { StressEnergyFieldSet } from "./stress-energy.js";
import { PHYSICS_CONSTANTS } from "../core/physics-constants.js";

export type StressEnergyFluxFields = Pick<
  StressEnergyFieldSet,
  "rho" | "Sx" | "Sy" | "Sz"
>;

export type StressEnergyInvariantTotals = {
  totalEnergy_J: number;
  totalMomentum_kg_m_s: Vec3;
  momentumMagnitude_kg_m_s: number;
  invariantMass_kg: number;
  invariantMassEnergy_J: number;
  cellVolume_m3: number;
  sampleCount: number;
};

export type StressEnergyInvariantOptions = {
  c?: number;
  momentumScale?: number;
  clampInvariantMass?: boolean;
};

const resolveC = (options?: StressEnergyInvariantOptions) => {
  const c = options?.c;
  return Number.isFinite(c) && c! > 0 ? (c as number) : PHYSICS_CONSTANTS.C;
};

const resolveMomentumScale = (
  c: number,
  options?: StressEnergyInvariantOptions,
) => {
  const scale = options?.momentumScale;
  if (Number.isFinite(scale)) return scale as number;
  return 1 / Math.max(c, 1e-12);
};

const resolveCellVolume = (grid: GridSpec) => {
  const spacing = grid.spacing ?? ([1, 1, 1] as Vec3);
  const dx = Number.isFinite(spacing[0]) ? spacing[0] : 1;
  const dy = Number.isFinite(spacing[1]) ? spacing[1] : 1;
  const dz = Number.isFinite(spacing[2]) ? spacing[2] : 1;
  const volume = Math.abs(dx * dy * dz);
  return Number.isFinite(volume) && volume > 0 ? volume : 1;
};

export function computeInvariantMassFromTotals(
  totalEnergy_J: number,
  totalMomentum_kg_m_s: Vec3,
  options: StressEnergyInvariantOptions = {},
): Omit<StressEnergyInvariantTotals, "cellVolume_m3" | "sampleCount"> {
  const c = resolveC(options);
  const px = Number.isFinite(totalMomentum_kg_m_s[0])
    ? totalMomentum_kg_m_s[0]
    : 0;
  const py = Number.isFinite(totalMomentum_kg_m_s[1])
    ? totalMomentum_kg_m_s[1]
    : 0;
  const pz = Number.isFinite(totalMomentum_kg_m_s[2])
    ? totalMomentum_kg_m_s[2]
    : 0;
  const momentumMagnitude_kg_m_s = Math.hypot(px, py, pz);
  const E = Number.isFinite(totalEnergy_J) ? totalEnergy_J : 0;
  const mc2Squared = E * E - Math.pow(momentumMagnitude_kg_m_s * c, 2);
  const clamp = options.clampInvariantMass ?? true;
  const safeMc2Squared = clamp ? Math.max(0, mc2Squared) : mc2Squared;
  const invariantMassEnergy_J = Math.sqrt(Math.max(0, safeMc2Squared));
  const invariantMass_kg =
    Math.abs(c) > 0 ? invariantMassEnergy_J / (c * c) : 0;
  return {
    totalEnergy_J: E,
    totalMomentum_kg_m_s: [px, py, pz],
    momentumMagnitude_kg_m_s,
    invariantMass_kg: Number.isFinite(invariantMass_kg) ? invariantMass_kg : 0,
    invariantMassEnergy_J: Number.isFinite(invariantMassEnergy_J)
      ? invariantMassEnergy_J
      : 0,
  };
}

export function computeInvariantMassFromFluxTotals(
  totalEnergy_J: number,
  totalFlux_J: Vec3,
  options: StressEnergyInvariantOptions = {},
): Omit<StressEnergyInvariantTotals, "cellVolume_m3" | "sampleCount"> {
  const c = resolveC(options);
  const momentumScale = resolveMomentumScale(c, options);
  const totalMomentum: Vec3 = [
    totalFlux_J[0] * momentumScale,
    totalFlux_J[1] * momentumScale,
    totalFlux_J[2] * momentumScale,
  ];
  return computeInvariantMassFromTotals(totalEnergy_J, totalMomentum, {
    ...options,
    c,
  });
}

export function integrateStressEnergyTotals(
  fields: StressEnergyFluxFields,
  grid: GridSpec,
  options: StressEnergyInvariantOptions = {},
): StressEnergyInvariantTotals {
  const cellVolume_m3 = resolveCellVolume(grid);
  const count = Math.max(
    0,
    Math.min(fields.rho.length, fields.Sx.length, fields.Sy.length, fields.Sz.length),
  );
  let sumRho = 0;
  let sumSx = 0;
  let sumSy = 0;
  let sumSz = 0;
  for (let i = 0; i < count; i += 1) {
    const rho = fields.rho[i];
    if (Number.isFinite(rho)) sumRho += rho;
    const sX = fields.Sx[i];
    if (Number.isFinite(sX)) sumSx += sX;
    const sY = fields.Sy[i];
    if (Number.isFinite(sY)) sumSy += sY;
    const sZ = fields.Sz[i];
    if (Number.isFinite(sZ)) sumSz += sZ;
  }
  const totalEnergy_J = sumRho * cellVolume_m3;
  const totalFlux_J: Vec3 = [
    sumSx * cellVolume_m3,
    sumSy * cellVolume_m3,
    sumSz * cellVolume_m3,
  ];
  const invariants = computeInvariantMassFromFluxTotals(
    totalEnergy_J,
    totalFlux_J,
    options,
  );
  return {
    ...invariants,
    cellVolume_m3,
    sampleCount: count,
  };
}
