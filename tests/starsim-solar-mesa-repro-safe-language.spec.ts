import { describe, expect, it } from "vitest";
import { validateStarSimSolarMesaReproSafeLanguage } from "../shared/starsim-solar-mesa-repro-safe-language";

describe("StarSim solar MESA repro safe language", () => {
  it("rejects forbidden overclaim language", () => {
    for (const phrase of [
      "fixture reproduced externally",
      "certified Stage 2",
      "direct ER=EPR evidence",
      "wormhole inventory",
      "propulsion evidence",
      "stress-energy source",
      "CL4 support",
      "derived Planck constant",
    ]) {
      expect(validateStarSimSolarMesaReproSafeLanguage(phrase).ok).toBe(false);
    }
  });

  it("allows proxy-only bounded language", () => {
    expect(
      validateStarSimSolarMesaReproSafeLanguage(
        "MESA-imported solar reference evidence for proxy-only QST context; not direct ER=EPR evidence.",
      ).ok,
    ).toBe(true);
  });
});
