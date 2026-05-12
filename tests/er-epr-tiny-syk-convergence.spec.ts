import { describe, expect, it } from "vitest";
import { evaluateTinySykNumericalAgreement } from "../shared/er-epr-tiny-syk-convergence";

describe("tiny SYK numerical convergence", () => {
  it("accepts deterministic Taylor tolerance sweeps", () => {
    const result = evaluateTinySykNumericalAgreement({
      methods: ["matrix_exponential_taylor"],
      tolerances: [1e-8, 1e-7],
      requireMethodAgreement: true,
      maxAllowedMethodDelta: 1e-6,
    });
    expect(result.passed).toBe(true);
    expect(result.notes.join(" ")).toContain("Taylor matrix evolution");
  });

  it("rejects exact diagonalization labels without an eigensolver", () => {
    const result = evaluateTinySykNumericalAgreement({
      methods: ["exact_diagonalization"],
      tolerances: [1e-8],
      requireMethodAgreement: true,
      maxAllowedMethodDelta: 1e-6,
    });
    expect(result.passed).toBe(false);
    expect(result.blocker).toBe("exact_diagonalization_not_implemented");
  });
});
