import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  runStarSimAccordionGalacticNullModel,
  starSimAccordionGalacticNullPlanSchema,
} from "../shared/starsim-accordion-galactic-null-model";
import {
  renderStarSimGalacticDynamicsReport,
  validateStarSimGalacticDynamicsSafeLanguage,
} from "../shared/starsim-galactic-dynamics-safe-language";

describe("StarSim galactic dynamics safe language", () => {
  it.each([
    "star positions prove ER=EPR",
    "wormhole density",
    "fusion proves spacetime entanglement",
    "hydrostatic equilibrium explains galactic rotation",
  ])("rejects forbidden phrase: %s", (phrase) => {
    const result = validateStarSimGalacticDynamicsSafeLanguage(phrase);
    expect(result.ok).toBe(false);
  });

  it("accepts bounded report language with claim IDs and uncertainty notes", () => {
    const plan = starSimAccordionGalacticNullPlanSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/starsim-accordion/accordion-local-volume.fixture.json", "utf8")),
    );
    const text = renderStarSimGalacticDynamicsReport(runStarSimAccordionGalacticNullModel(plan));
    expect(text).toContain("galactic dynamics null model");
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("Citations:");
    expect(text).toContain("Uncertainty notes:");
    expect(text).toContain("proxy_only");
  });
});
