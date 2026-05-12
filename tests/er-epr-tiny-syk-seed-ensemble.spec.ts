import { describe, expect, it } from "vitest";
import { buildTinySykSeedEnsemble } from "../shared/er-epr-tiny-syk-seed-ensemble";

describe("tiny SYK seed ensemble", () => {
  it("expands seeds and parameter grids into candidate plans", () => {
    const plans = buildTinySykSeedEnsemble({
      planId: "ensemble",
      createdAt: "2026-05-11T00:00:00.000Z",
      seeds: [1, 2],
      nMajoranasPerSide: [4],
      betaValues: [2, 3],
      couplingMuValues: [0.5],
    });
    expect(plans).toHaveLength(4);
    expect(plans.every((plan) => plan.controls.includeWrongSign && plan.controls.includeSpinChain)).toBe(true);
  });
});
