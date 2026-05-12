import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runTinySykSolver, tinySykPlanSchema } from "../shared/er-epr-tiny-syk";
import { runTinySykEntropyWashoutSweep } from "../shared/er-epr-tiny-syk-washout-sweep";

describe("tiny SYK entropy washout sweep", () => {
  it("decreases visibility-adjusted signal monotonically", () => {
    const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json", "utf8")));
    const run = runTinySykSolver(plan);
    const sweep = runTinySykEntropyWashoutSweep(run.adapterRaw, [0, 1, 2, 3]);
    expect(sweep.monotonic).toBe(true);
    expect(sweep.points[3].entropyVisibility).toBeLessThan(sweep.points[0].entropyVisibility);
    expect(sweep.points[3].visibilityAdjustedSignal).toBeLessThan(sweep.points[0].visibilityAdjustedSignal);
  });
});
