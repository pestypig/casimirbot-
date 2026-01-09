import { describe, expect, it } from "vitest";
import { buildFluxBandMasks } from "../shared/tokamak-flux-coords";

const countOn = (mask: Float32Array) =>
  Array.from(mask).reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0);

describe("tokamak flux coordinate banding", () => {
  it("creates deterministic core/edge/sol masks", () => {
    const psi = new Float32Array([0.1, 0.4, 0.6, 0.9, 1.0, 1.2]);
    const first = buildFluxBandMasks(psi, { core_max: 0.5, edge_max: 1.0 });
    const second = buildFluxBandMasks(psi, { core_max: 0.5, edge_max: 1.0 });

    expect(countOn(first.core)).toBe(2);
    expect(countOn(first.edge)).toBe(3);
    expect(countOn(first.sol)).toBe(1);
    expect(first.coverage.total).toBe(6);
    expect(second.core).toEqual(first.core);
    expect(second.edge).toEqual(first.edge);
    expect(second.sol).toEqual(first.sol);
  });

  it("honors mask exclusions", () => {
    const psi = new Float32Array([0.1, 0.4, 0.6, 0.9, 1.0, 1.2]);
    const mask = new Float32Array([1, 1, 1, 0, 1, 1]);
    const result = buildFluxBandMasks(psi, {
      core_max: 0.5,
      edge_max: 1.0,
      mask,
    });

    expect(countOn(result.core)).toBe(2);
    expect(countOn(result.edge)).toBe(2);
    expect(countOn(result.sol)).toBe(1);
    expect(result.coverage.total).toBe(5);
  });
});
