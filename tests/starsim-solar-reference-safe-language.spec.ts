import { describe, expect, it } from "vitest";
import { validateStarSimSolarReferenceSafeLanguage } from "../shared/starsim-solar-reference-safe-language";

describe("StarSim solar reference safe language", () => {
  it("rejects forbidden overclaims", () => {
    expect(validateStarSimSolarReferenceSafeLanguage("proves ER=EPR").ok).toBe(false);
    expect(validateStarSimSolarReferenceSafeLanguage("fixture reproduced externally").ok).toBe(false);
    expect(validateStarSimSolarReferenceSafeLanguage("derived Planck constant").ok).toBe(false);
  });

  it("allows bounded solar reference language", () => {
    expect(
      validateStarSimSolarReferenceSafeLanguage(
        "fixture-only solar reference; proxy-only stellar microphysics prior; not direct ER=EPR evidence",
      ).ok,
    ).toBe(true);
  });
});
