import { describe, expect, it } from "vitest";
import { buildMajoranaOperators, isHermitian, verifyMajoranaAlgebra } from "../shared/er-epr-majorana-operators";

describe("ER=EPR Majorana operators", () => {
  it("builds Hermitian operators with gamma anticommutation normalization", () => {
    const ops = buildMajoranaOperators(8);
    expect(ops).toHaveLength(8);
    expect(ops[0]).toHaveLength(16);
    expect(ops.every((op) => isHermitian(op))).toBe(true);
    const check = verifyMajoranaAlgebra(ops);
    expect(check.passed).toBe(true);
    expect(check.normalization).toBe("gamma_anticommutator_2_delta");
    expect(check.maxDiagonalError).toBeLessThan(1e-9);
    expect(check.maxOffDiagonalError).toBeLessThan(1e-9);
  });
});
