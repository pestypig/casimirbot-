import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runTinySykValidationSweep, tinySykValidationSweepPlanSchema } from "../shared/er-epr-tiny-syk-validation-sweep";

function loadPlan() {
  return tinySykValidationSweepPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk-validation/sweep-plan.fixture.json", "utf8")));
}

describe("tiny SYK validation sweep", () => {
  it("runs multiple seeds and computes aggregate pass rate", () => {
    const report = runTinySykValidationSweep(loadPlan());
    expect(report.aggregate.totalCandidateRuns).toBe(3);
    expect(report.aggregate.candidatePassRate).toBeGreaterThanOrEqual(0.66);
    expect(report.aggregate.strongestAllowedVerdict).toBe("model_internal_validation_support_observed");
    expect(report.qstBoundary.spacetimeCL).toBe("proxy_only");
  });

  it("blocks validation with numerical exact-diagonalization overlabeling", () => {
    const report = runTinySykValidationSweep({
      ...loadPlan(),
      numericalSweep: { ...loadPlan().numericalSweep, methods: ["exact_diagonalization"] },
    });
    expect(report.aggregate.strongestAllowedVerdict).toBe("numerical_convergence_failed");
    expect(report.blockers.some((blocker) => blocker.blockerId === "numerical_method_disagreement")).toBe(true);
  });
});
