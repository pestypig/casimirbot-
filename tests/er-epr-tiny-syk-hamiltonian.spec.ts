import { describe, expect, it } from "vitest";
import { buildTinySykHamiltonian } from "../shared/er-epr-tiny-syk-hamiltonian";

describe("tiny SYK Hamiltonian", () => {
  it("is deterministic, Hermitian, and hash-sensitive to seed", () => {
    const base = buildTinySykHamiltonian({ nMajoranasPerSide: 4, qBodyOrder: 4, seed: 7, mu: 0.6, couplingSign: "correct" });
    const again = buildTinySykHamiltonian({ nMajoranasPerSide: 4, qBodyOrder: 4, seed: 7, mu: 0.6, couplingSign: "correct" });
    const changed = buildTinySykHamiltonian({ nMajoranasPerSide: 4, qBodyOrder: 4, seed: 8, mu: 0.6, couplingSign: "correct" });
    expect(base.hermitian).toBe(true);
    expect(base.hamiltonianHash).toBe(again.hamiltonianHash);
    expect(base.hamiltonianHash).not.toBe(changed.hamiltonianHash);
  });

  it("rejects unsupported qBodyOrder and oversized CI dimensions", () => {
    expect(() => buildTinySykHamiltonian({ nMajoranasPerSide: 4, qBodyOrder: 2 as 4, seed: 1, mu: 0.1, couplingSign: "correct" })).toThrow(/qBodyOrder=4/);
    expect(() => buildTinySykHamiltonian({ nMajoranasPerSide: 10 as 4, qBodyOrder: 4, seed: 1, mu: 0.1, couplingSign: "correct" })).toThrow(/allows nMajoranasPerSide/);
  });
});
