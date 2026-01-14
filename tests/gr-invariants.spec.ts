import { describe, expect, it } from "vitest";
import { buildEvolutionBrick } from "../server/gr/evolution/index.js";
import { createMinkowskiState, gridFromBounds } from "../modules/gr/bssn-state";

const maxAbs = (data: Float32Array) => {
  let out = 0;
  for (let i = 0; i < data.length; i += 1) {
    const value = Math.abs(data[i]);
    if (value > out) out = value;
  }
  return out;
};

describe("GR invariants", () => {
  it("keeps Minkowski invariants near zero", () => {
    const bounds = { min: [-1, -1, -1] as const, max: [1, 1, 1] as const };
    const grid = gridFromBounds([6, 6, 6], bounds);
    const state = createMinkowskiState(grid);
    const brick = buildEvolutionBrick({
      state,
      includeConstraints: false,
      includeInvariants: true,
    });
    const kretschmann = brick.channels.kretschmann?.data ?? new Float32Array();
    const ricci4 = brick.channels.ricci4?.data ?? new Float32Array();

    expect(maxAbs(kretschmann)).toBeLessThan(1e-6);
    expect(maxAbs(ricci4)).toBeLessThan(1e-6);
  });
});
