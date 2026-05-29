import { describe, expect, it } from "vitest";
import { isTheorySweepRunV1 } from "../../contracts/theory-sweep-run.v1";
import { runTheoryScalarSweep } from "../theory-scalar-sweep-runner";

describe("runTheoryScalarSweep", () => {
  it("produces one stable result for a fixed distribution", () => {
    const sweep = runTheoryScalarSweep({
      expression: "y = x*2",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "grid" },
      variables: [{ symbol: "x", unit: "m", distribution: { kind: "fixed", value: 3 } }],
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(isTheorySweepRunV1(sweep)).toBe(true);
    expect(sweep.samples).toHaveLength(1);
    expect(sweep.samples[0].scalarResults.y).toBe(6);
    expect(sweep.aggregate.mean).toBe(6);
  });

  it("uses samples distribution length for grid sample count", () => {
    const sweep = runTheoryScalarSweep({
      expression: "y = x*2",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "grid" },
      variables: [{ symbol: "x", unit: "m", distribution: { kind: "samples", values: [1, 2, 3] } }],
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(sweep.samples).toHaveLength(3);
    expect(sweep.samples.map((sample) => sample.scalarResults.y)).toEqual([2, 4, 6]);
    expect(sweep.aggregate.okCount).toBe(3);
  });

  it("is deterministic for seeded monte carlo samples", () => {
    const input = {
      expression: "y = x+1",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "monte_carlo" as const, sampleCount: 4, seed: "seed:test" },
      variables: [{ symbol: "x", unit: null, distribution: { kind: "uniform" as const, min: 0, max: 1 } }],
      generatedAt: "2026-05-29T00:00:00.000Z",
    };

    const first = runTheoryScalarSweep(input);
    const second = runTheoryScalarSweep(input);

    expect(first.samples.map((sample) => sample.inputs.x)).toEqual(second.samples.map((sample) => sample.inputs.x));
    expect(first.aggregate).toEqual(second.aggregate);
  });

  it("allows energy_to_frequency projection only for energy dimension signatures", () => {
    const compatible = runTheoryScalarSweep({
      expression: "E = x",
      resultDimensionSignature: "M L^2 T^-2",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "grid" },
      variables: [{ symbol: "x", unit: "J", distribution: { kind: "fixed", value: 1 } }],
      rateProjections: [{ kind: "energy_to_frequency", inputSymbol: "E", outputSymbol: "f", unit: "Hz" }],
      generatedAt: "2026-05-29T00:00:00.000Z",
    });
    const incompatible = runTheoryScalarSweep({
      expression: "E = x",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "grid" },
      variables: [{ symbol: "x", unit: "m", distribution: { kind: "fixed", value: 1 } }],
      rateProjections: [{ kind: "energy_to_frequency", inputSymbol: "E", outputSymbol: "f", unit: "Hz" }],
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(compatible.rateProjections[0].aggregate.okCount).toBe(1);
    expect(compatible.rateProjections[0].aggregate.mean).toBeGreaterThan(1e33);
    expect(incompatible.rateProjections[0].aggregate.okCount).toBe(0);
    expect(incompatible.rateProjections[0].aggregate.failedCount).toBe(1);
  });

  it("preserves diagnostic-only claim boundaries", () => {
    const sweep = runTheoryScalarSweep({
      expression: "y = x",
      graphId: "graph:test",
      targetBadgeIds: ["badge:test"],
      samplePolicy: { kind: "grid" },
      variables: [{ symbol: "x", unit: null, distribution: { kind: "fixed", value: 1 } }],
      claimBoundaryNotes: ["Diagnostic-only sweep; no validation claim."],
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(sweep.claimBoundary.diagnosticOnly).toBe(true);
    expect(sweep.claimBoundary.validationClaimAllowed).toBe(false);
    expect(sweep.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(sweep.claimBoundary.promotionAllowed).toBe(false);
    expect(sweep.claimBoundary.notes).toContain("Diagnostic-only sweep; no validation claim.");
  });
});
