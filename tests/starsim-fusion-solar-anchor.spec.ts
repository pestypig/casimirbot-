import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseStarSimSolarFusionAnchor } from "../shared/starsim-fusion-solar-anchor";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-stage2-gate");

describe("StarSim solar fusion anchor", () => {
  it("accepts solar calibration observables and neutrino targets", () => {
    const anchor = parseStarSimSolarFusionAnchor(
      JSON.parse(readFileSync(join(fixtureDir, "solar-anchor.fixture.json"), "utf8")),
    );
    expect(anchor.objectId).toBe("Sun");
    expect(anchor.referenceObservables.mass_Msun).toBe(1);
    expect(anchor.neutrinoTargets?.sourceRef).toBe("Borexino");
  });
});
