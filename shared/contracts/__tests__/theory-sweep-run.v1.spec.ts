import { describe, expect, it } from "vitest";
import {
  buildTheorySweepRunV1,
  isTheorySweepRunV1,
  validateTheorySweepRunV1,
  type TheorySweepRunV1,
} from "../theory-sweep-run.v1";

function validSweepRun(): TheorySweepRunV1 {
  return buildTheorySweepRunV1({
    generatedAt: "2026-05-29T00:00:00.000Z",
    sweepId: "sweep:test",
    graphId: "graph:test",
    targetBadgeIds: ["badge:test"],
    sourceRunId: null,
    samplePolicy: {
      kind: "grid",
      sampleCount: 1,
      seed: null,
    },
    variables: [
      {
        symbol: "x",
        unit: "m",
        distribution: { kind: "fixed", value: 2 },
      },
    ],
    samples: [
      {
        index: 1,
        inputs: { x: 2 },
        scalarResults: { y: 4 },
        status: "ok",
        warnings: [],
      },
    ],
    aggregate: {
      resultSymbol: "y",
      mean: 4,
      median: 4,
      min: 4,
      max: 4,
      stddev: 0,
      p05: 4,
      p95: 4,
      failedCount: 0,
      okCount: 1,
    },
    rateProjections: [],
    quality: {
      confidence: 0.82,
      uncertaintyModel: "grid",
      fallbackReason: null,
    },
    claimBoundary: {
      diagnosticOnly: true,
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      notes: ["Diagnostic sweep only."],
    },
  });
}

describe("theory_sweep_run/v1 contract", () => {
  it("accepts a valid fixture", () => {
    const fixture = validSweepRun();

    expect(isTheorySweepRunV1(fixture)).toBe(true);
    expect(validateTheorySweepRunV1(fixture)).toEqual([]);
  });

  it("rejects a missing artifactId", () => {
    const fixture = { ...validSweepRun(), artifactId: undefined };

    expect(validateTheorySweepRunV1(fixture).join(" ")).toMatch(/artifactId/);
  });

  it("rejects an invalid sample policy kind", () => {
    const fixture = {
      ...validSweepRun(),
      samplePolicy: { kind: "random_walk", sampleCount: 1, seed: null },
    };

    expect(validateTheorySweepRunV1(fixture).join(" ")).toMatch(/samplePolicy\.kind/);
  });

  it("rejects an invalid distribution kind", () => {
    const fixture = {
      ...validSweepRun(),
      variables: [{ symbol: "x", unit: "m", distribution: { kind: "triangle", value: 2 } }],
    };

    expect(validateTheorySweepRunV1(fixture).join(" ")).toMatch(/distribution\.kind/);
  });

  it("rejects an invalid rate projection kind", () => {
    const fixture = {
      ...validSweepRun(),
      rateProjections: [
        {
          kind: "mystery_projection",
          inputSymbol: "E",
          outputSymbol: "f",
          unit: "Hz",
          aggregate: validSweepRun().aggregate,
        },
      ],
    };

    expect(validateTheorySweepRunV1(fixture).join(" ")).toMatch(/rateProjections\[0\]\.kind/);
  });

  it("requires fail-closed claim boundary fields", () => {
    const fixture = {
      ...validSweepRun(),
      claimBoundary: {
        diagnosticOnly: true,
        validationClaimAllowed: true,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
        notes: [],
      },
    };

    expect(validateTheorySweepRunV1(fixture).join(" ")).toMatch(/validationClaimAllowed/);
  });
});
