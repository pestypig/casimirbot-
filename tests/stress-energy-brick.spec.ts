import { describe, it, expect } from "vitest";
import { buildStressEnergyBrick } from "../server/stress-energy-brick";

const baseParams = {
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

describe("stress-energy brick builder", () => {
  it("preserves average density after normalization", () => {
    const brick = buildStressEnergyBrick(baseParams);
    const { dims, channels, stats } = brick;
    const total = dims[0] * dims[1] * dims[2];
    const sum = channels.t00.data.reduce((acc, value) => acc + value, 0);
    const directAvg = sum / Math.max(total, 1);
    expect(Number.isFinite(stats.avgT00)).toBe(true);
    expect(Math.abs(directAvg - stats.avgT00)).toBeLessThan(Math.max(1e-8, Math.abs(stats.avgT00) * 1e-3));
  });

  it("yields near-zero integrated divergence", () => {
    const brick = buildStressEnergyBrick({ ...baseParams, phase01: 0.36 });
    const totalDiv = brick.channels.divS.data.reduce((acc, value) => acc + value, 0);
    expect(Math.abs(totalDiv)).toBeLessThan(5e-3);
  });

  it("embeds Natario diagnostics", () => {
    const brick = buildStressEnergyBrick(baseParams);
    expect(brick.stats.natario).toBeDefined();
    expect(brick.stats.natario?.gateLimit).toBeGreaterThan(0);
    expect(Number.isFinite(brick.stats.natario?.divBetaMax)).toBe(true);
  });
});
