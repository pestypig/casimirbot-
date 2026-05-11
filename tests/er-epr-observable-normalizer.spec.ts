import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeErEprRawObservables } from "../shared/er-epr-observable-normalizer";
import { parseErEprRawSolverObservables } from "../shared/er-epr-raw-observables";

describe("ER=EPR observable normalizer", () => {
  it("normalizes raw telemetry into evaluator observables", () => {
    const request = JSON.parse(readFileSync("tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json", "utf8"));
    const observables = normalizeErEprRawObservables(parseErEprRawSolverObservables(request.raw), {
      timeDelayScale: 1,
      sizeWindingGrowthScale: 1,
      scramblingDropScale: 0.8,
      thermalizationVarianceScale: 0.1,
      entropyAreaProxyScale: 4,
    });
    expect(observables.teleportationFidelity).toBeCloseTo(0.88);
    expect(observables.causalOrderingScore).toBe(1);
    expect(observables.operatorSizeWindingScore).toBeGreaterThan(0.8);
    expect(observables.shuffledHamiltonianControlScore).toBeLessThan(0.35);
  });

  it("makes wrong-sign controls low signal", () => {
    const raw = parseErEprRawSolverObservables(
      JSON.parse(readFileSync("tests/fixtures/er-epr-solver/wrong-sign-control-raw.fixture.json", "utf8")),
    );
    const observables = normalizeErEprRawObservables(raw);
    expect(observables.teleportationFidelity).toBeLessThan(0.35);
    expect(observables.wrongSignCouplingControlScore).toBeLessThan(0.35);
  });
});
