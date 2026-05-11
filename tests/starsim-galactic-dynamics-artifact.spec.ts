import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  runStarSimAccordionGalacticNullModel,
  starSimAccordionGalacticNullPlanSchema,
} from "../shared/starsim-accordion-galactic-null-model";
import { starSimGalacticDynamicsArtifactSchema } from "../shared/starsim-galactic-dynamics-artifact";

describe("StarSim galactic dynamics artifact", () => {
  it("accepts a complete proxy-only artifact", () => {
    const plan = starSimAccordionGalacticNullPlanSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/starsim-accordion/accordion-local-volume.fixture.json", "utf8")),
    );
    const artifact = starSimGalacticDynamicsArtifactSchema.parse(
      runStarSimAccordionGalacticNullModel(plan),
    );
    expect(artifact.evidence.claimIds.length).toBeGreaterThan(0);
    expect(artifact.evidence.citations.length).toBeGreaterThan(0);
  });

  it("rejects missing claim IDs", () => {
    const plan = starSimAccordionGalacticNullPlanSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/starsim-accordion/accordion-local-volume.fixture.json", "utf8")),
    );
    const artifact = runStarSimAccordionGalacticNullModel(plan);
    expect(() =>
      starSimGalacticDynamicsArtifactSchema.parse({
        ...artifact,
        evidence: { ...artifact.evidence, claimIds: [] },
      }),
    ).toThrow();
  });

  it("rejects CL promotion", () => {
    const plan = starSimAccordionGalacticNullPlanSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/starsim-accordion/accordion-local-volume.fixture.json", "utf8")),
    );
    const artifact = runStarSimAccordionGalacticNullModel(plan);
    expect(() =>
      starSimGalacticDynamicsArtifactSchema.parse({
        ...artifact,
        qstBoundary: { ...artifact.qstBoundary, mayPromoteToCL4: true },
      }),
    ).toThrow();
  });
});
