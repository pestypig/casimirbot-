import { describe, expect, it } from "vitest";
import {
  citationsForStarSimSolarReferenceClaims,
  STARSIM_SOLAR_REFERENCE_CLAIM_IDS,
} from "../shared/starsim-solar-reference-claims";

describe("StarSim solar reference claims", () => {
  it("returns citations for required claims", () => {
    const citations = citationsForStarSimSolarReferenceClaims([
      STARSIM_SOLAR_REFERENCE_CLAIM_IDS.mesaSolarProfileReproductionContext,
      STARSIM_SOLAR_REFERENCE_CLAIM_IDS.borexinoNeutrinoClosureContext,
    ]);
    expect(citations).toContain("https://arxiv.org/abs/1009.1622");
    expect(citations).toContain("https://www.nature.com/articles/s41586-018-0624-y");
  });
});
