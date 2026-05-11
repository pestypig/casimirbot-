import { describe, expect, it } from "vitest";
import { buildTinySykHamiltonian } from "../shared/er-epr-tiny-syk-hamiltonian";
import { evolveStateTaylor, makeEntangledPairState } from "../shared/er-epr-tiny-syk-evolution";
import { runTinySykSolver, tinySykPlanSchema } from "../shared/er-epr-tiny-syk";
import { readFileSync } from "node:fs";

describe("tiny SYK evolution", () => {
  it("preserves norm and records numerical method", () => {
    const h = buildTinySykHamiltonian({ nMajoranasPerSide: 4, qBodyOrder: 4, seed: 7, mu: 0.5, couplingSign: "correct" });
    const result = evolveStateTaylor(makeEntangledPairState(h.dimension), h.total, 0.2);
    expect(result.numericalMethod).toBe("matrix_exponential_taylor");
    expect(result.normError).toBeLessThan(0.05);
  });

  it("is deterministic for the same plan hash and Hamiltonian hash", () => {
    const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json", "utf8")));
    const first = runTinySykSolver(plan);
    const second = runTinySykSolver(plan);
    expect(first.hashes.planHash).toBe(second.hashes.planHash);
    expect(first.hashes.hamiltonianHash).toBe(second.hashes.hamiltonianHash);
    expect(first.rawTelemetry.model.hamiltonianHash).toBeTruthy();
  });
});
