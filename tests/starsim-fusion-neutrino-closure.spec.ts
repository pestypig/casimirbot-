import { describe, expect, it } from "vitest";
import { computeStarSimFusionNeutrinoClosure } from "../shared/starsim-fusion-neutrino-closure";

describe("StarSim fusion neutrino closure", () => {
  it("passes a pp-chain solar neutrino fixture within threshold", () => {
    const closure = computeStarSimFusionNeutrinoClosure({
      objectId: "Sun",
      modelFluxes: { pp: 6.05e10, be7: 4.85e9, units: "cm^-2 s^-1" },
      referenceFluxes: {
        pp: 6.1e10,
        be7: 4.99e9,
        units: "cm^-2 s^-1",
        sourceRef: "Borexino",
      },
      warnRelErrMax: 0.1,
      failRelErrMax: 0.3,
    });
    expect(closure.status).toBe("pass");
  });

  it("returns warn or fail according to residual threshold", () => {
    const warn = computeStarSimFusionNeutrinoClosure({
      objectId: "Sun",
      modelFluxes: { pp: 5.2e10, units: "cm^-2 s^-1" },
      referenceFluxes: { pp: 6.1e10, units: "cm^-2 s^-1", sourceRef: "Borexino" },
      warnRelErrMax: 0.1,
      failRelErrMax: 0.3,
    });
    expect(warn.status).toBe("warn");

    const fail = computeStarSimFusionNeutrinoClosure({
      objectId: "Sun",
      modelFluxes: { pp: 3e10, units: "cm^-2 s^-1" },
      referenceFluxes: { pp: 6.1e10, units: "cm^-2 s^-1", sourceRef: "Borexino" },
      warnRelErrMax: 0.1,
      failRelErrMax: 0.3,
    });
    expect(fail.status).toBe("fail");
  });

  it("rejects missing units", () => {
    expect(() =>
      computeStarSimFusionNeutrinoClosure({
        objectId: "Sun",
        modelFluxes: { pp: 6e10 } as any,
        referenceFluxes: { pp: 6.1e10, units: "cm^-2 s^-1", sourceRef: "Borexino" },
      }),
    ).toThrow();
  });

  it("returns not_tested for non-solar objects", () => {
    const closure = computeStarSimFusionNeutrinoClosure({
      objectId: "alpha-centauri-a",
      modelFluxes: { pp: 6e10, units: "cm^-2 s^-1" },
      referenceFluxes: { pp: 6.1e10, units: "cm^-2 s^-1", sourceRef: "Borexino" },
    });
    expect(closure.status).toBe("not_tested");
  });
});
