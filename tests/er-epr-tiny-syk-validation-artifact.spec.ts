import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runTinySykValidationSweep, tinySykValidationSweepPlanSchema } from "../shared/er-epr-tiny-syk-validation-sweep";
import { tinySykValidationSweepReportSchema } from "../shared/er-epr-tiny-syk-validation-artifact";

describe("tiny SYK validation artifact", () => {
  it("accepts a report with citations, claim IDs, caveats, and per-seed summaries", () => {
    const plan = tinySykValidationSweepPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk-validation/sweep-plan.fixture.json", "utf8")));
    const report = tinySykValidationSweepReportSchema.parse(runTinySykValidationSweep(plan));
    expect(report.evidence.claimIds.length).toBeGreaterThan(0);
    expect(report.evidence.citations.length).toBeGreaterThan(0);
    expect(report.qstBoundary.mayPromoteToCL4).toBe(false);
  });

  it("rejects CL promotion and missing hashes", () => {
    const plan = tinySykValidationSweepPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk-validation/sweep-plan.fixture.json", "utf8")));
    const report = runTinySykValidationSweep(plan);
    expect(() => tinySykValidationSweepReportSchema.parse({ ...report, qstBoundary: { ...report.qstBoundary, spacetimeCL: "CL4" } })).toThrow();
    expect(() => tinySykValidationSweepReportSchema.parse({ ...report, perSeedSummaries: [{ ...report.perSeedSummaries[0], hamiltonianHash: "" }] })).toThrow();
  });
});
