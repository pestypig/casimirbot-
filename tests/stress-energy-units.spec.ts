import { describe, expect, it } from "vitest";
import type { GridSpec } from "../modules/gr/bssn-state";
import type {
  StressEnergyBrick,
  StressEnergyStats,
} from "../server/stress-energy-brick";
import { buildStressEnergyFieldSetFromBrick } from "../server/gr/evolution/stress-energy";
import { SI_TO_GEOM_STRESS } from "../shared/gr-units";

const makeBrick = (): StressEnergyBrick => {
  const t00 = new Float32Array([2]);
  const Sx = new Float32Array([3]);
  const Sy = new Float32Array([0]);
  const Sz = new Float32Array([0]);
  const divS = new Float32Array([0]);
  const stats: StressEnergyStats = {
    totalEnergy_J: 2,
    avgT00: 2,
    avgFluxMagnitude: 0,
    netFlux: [0, 0, 0],
    divMin: 0,
    divMax: 0,
    dutyFR: 1,
    strobePhase: 0,
    conservation: {
      divMean: 0,
      divAbsMean: 0,
      divRms: 0,
      divMaxAbs: 0,
      netFluxMagnitude: 0,
      netFluxNorm: 0,
      divRmsNorm: 0,
    },
  };
  return {
    dims: [1, 1, 1],
    voxelBytes: 4,
    format: "r32f",
    channels: {
      t00: { data: t00, min: 2, max: 2 },
      Sx: { data: Sx, min: 3, max: 3 },
      Sy: { data: Sy, min: 0, max: 0 },
      Sz: { data: Sz, min: 0, max: 0 },
      divS: { data: divS, min: 0, max: 0 },
    },
    stats,
  };
};

describe("stress-energy unit scaling", () => {
  it("scales SI stress-energy into geometric units", () => {
    const grid: GridSpec = {
      dims: [1, 1, 1],
      spacing: [1, 1, 1],
      bounds: { min: [0, 0, 0], max: [1, 1, 1] },
    };
    const brick = makeBrick();

    const geom = buildStressEnergyFieldSetFromBrick(grid, brick, {
      unitSystem: "geometric",
    });
    const si = buildStressEnergyFieldSetFromBrick(grid, brick, {
      unitSystem: "SI",
    });

    expect(geom.rho[0]).toBeCloseTo(2, 12);
    expect(si.rho[0]).toBeCloseTo(2 * SI_TO_GEOM_STRESS, 12);
    expect(si.Sx[0]).toBeCloseTo(3 * SI_TO_GEOM_STRESS, 12);
  });
});
