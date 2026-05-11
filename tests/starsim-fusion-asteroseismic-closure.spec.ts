import { describe, expect, it } from "vitest";
import { computeStarSimFusionAsteroseismicClosure } from "../shared/starsim-fusion-asteroseismic-closure";

describe("StarSim fusion asteroseismic closure", () => {
  it("passes a GYRE summary fixture", () => {
    const closure = computeStarSimFusionAsteroseismicClosure({
      objectId: "Sun",
      source: "gyre_imported_summary",
      modelSummary: {
        largeSeparation_uHz: 134.9,
        smallSeparation_uHz: 9.0,
        modeCount: 32,
        lowDegreeModesAvailable: true,
      },
      referenceSummary: {
        largeSeparation_uHz: 135.1,
        smallSeparation_uHz: 9.05,
        modeCount: 32,
        sourceRef: "solar-modes",
      },
    });
    expect(closure.status).toBe("pass");
  });

  it("warns when GYRE metadata is incomplete", () => {
    const closure = computeStarSimFusionAsteroseismicClosure({
      objectId: "Sun",
      source: "gyre_imported_summary",
      modelSummary: { largeSeparation_uHz: 134.9 },
      referenceSummary: { largeSeparation_uHz: 135.1 },
    });
    expect(closure.status).toBe("warn");
  });

  it("fails when residuals exceed threshold", () => {
    const closure = computeStarSimFusionAsteroseismicClosure({
      objectId: "Sun",
      source: "helioseismic_fixture",
      modelSummary: { largeSeparation_uHz: 100 },
      referenceSummary: { largeSeparation_uHz: 135.1, sourceRef: "solar-modes" },
      warnRelErrMax: 0.02,
      failRelErrMax: 0.08,
    });
    expect(closure.status).toBe("fail");
  });

  it("returns not_tested when not available", () => {
    const closure = computeStarSimFusionAsteroseismicClosure({
      objectId: "Sun",
      source: "not_available",
      modelSummary: {},
      referenceSummary: {},
    });
    expect(closure.status).toBe("not_tested");
  });
});
