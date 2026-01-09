import { describe, expect, it } from "vitest";
import type { GridSpec } from "../modules/gr/bssn-state";
import { integrateStressEnergyTotals } from "../modules/gr/stress-energy-integrals";

const makeGrid = (): GridSpec => ({
  dims: [2, 1, 1],
  spacing: [2, 1, 1],
  bounds: { min: [0, 0, 0], max: [4, 1, 1] },
});

describe("integrateStressEnergyTotals", () => {
  it("reduces to E = m c^2 when momentum is zero", () => {
    const grid = makeGrid();
    const fields = {
      rho: new Float32Array([5, 5]),
      Sx: new Float32Array([0, 0]),
      Sy: new Float32Array([0, 0]),
      Sz: new Float32Array([0, 0]),
    };

    const totals = integrateStressEnergyTotals(fields, grid, {
      c: 1,
      momentumScale: 1,
    });

    expect(totals.totalEnergy_J).toBeCloseTo(20, 12);
    expect(totals.momentumMagnitude_kg_m_s).toBeCloseTo(0, 12);
    expect(totals.invariantMassEnergy_J).toBeCloseTo(20, 12);
    expect(totals.invariantMass_kg).toBeCloseTo(20, 12);
  });

  it("drops invariant mass when net momentum is present", () => {
    const grid = makeGrid();
    const fields = {
      rho: new Float32Array([5, 5]),
      Sx: new Float32Array([3, 3]),
      Sy: new Float32Array([0, 0]),
      Sz: new Float32Array([0, 0]),
    };

    const totals = integrateStressEnergyTotals(fields, grid, {
      c: 1,
      momentumScale: 1,
    });

    expect(totals.totalEnergy_J).toBeCloseTo(20, 12);
    expect(totals.momentumMagnitude_kg_m_s).toBeCloseTo(12, 12);
    expect(totals.invariantMassEnergy_J).toBeCloseTo(16, 12);
    expect(totals.invariantMass_kg).toBeCloseTo(16, 12);
  });
});
