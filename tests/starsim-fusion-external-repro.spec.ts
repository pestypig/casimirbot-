import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseStarSimFusionExternalReproManifest } from "../shared/starsim-fusion-external-repro";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-stage2-gate");

describe("StarSim fusion external reproduction manifest", () => {
  it("accepts a MESA/GYRE reproduction fixture", () => {
    const raw = JSON.parse(readFileSync(join(fixtureDir, "solar-mesa-repro.fixture.json"), "utf8"));
    const manifest = parseStarSimFusionExternalReproManifest(raw.externalReproManifest);
    expect(manifest.reproducibilityStatus).toBe("mesa_gyre_reproduced");
    expect(manifest.mesa?.profileHash).toBeTruthy();
    expect(manifest.mesa?.inlistHash).toBeTruthy();
  });

  it("preserves overclaim fields for gate blocking", () => {
    const raw = JSON.parse(readFileSync(join(fixtureDir, "blocked-overclaim.fixture.json"), "utf8"));
    const manifest = parseStarSimFusionExternalReproManifest(raw.externalReproManifest);
    expect(manifest.claimRole).toBe("direct_er_epr_evidence");
    expect(manifest.requestedSpacetimeCL).toBe("CL4");
  });
});
