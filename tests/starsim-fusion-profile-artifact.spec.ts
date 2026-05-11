import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { starSimFusionProfileArtifactSchema } from "../shared/starsim-fusion-profile-artifact";
import { validateStarSimFusionProfile } from "../shared/starsim-fusion-profile-validation";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function fixture(name: string) {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

function artifactFor(profile: any, safeSummary = "Profile validation is proxy-only and not direct ER=EPR evidence.") {
  const validation = validateStarSimFusionProfile(profile);
  return {
    schemaVersion: "starsim-fusion-profile-artifact.v1",
    artifactId: `${profile.objectId}-artifact`,
    createdAt: "2026-05-11T00:00:00.000Z",
    profile,
    validation,
    claimIds: validation.evidence.claimIds,
    citations: validation.evidence.citations,
    caveats: validation.qstBoundary.caveats,
    uncertaintyNotes: validation.evidence.uncertaintyNotes,
    safeSummary,
  };
}

describe("StarSim fusion profile artifacts", () => {
  it("accepts fixture_only profile validation", () => {
    const artifact = artifactFor(fixture("solar-mesa-profile.fixture.json"));
    expect(() => starSimFusionProfileArtifactSchema.parse(artifact)).not.toThrow();
  });

  it("accepts mesa_imported profile validation", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    profile.provenance.reproducibilityStatus = "mesa_imported";
    const artifact = artifactFor(profile);
    expect(() => starSimFusionProfileArtifactSchema.parse(artifact)).not.toThrow();
  });

  it("rejects missing caveats and uncertainty notes", () => {
    const artifact = artifactFor(fixture("solar-mesa-profile.fixture.json"));
    expect(() =>
      starSimFusionProfileArtifactSchema.parse({ ...artifact, caveats: [] }),
    ).toThrow();
    expect(() =>
      starSimFusionProfileArtifactSchema.parse({ ...artifact, uncertaintyNotes: [] }),
    ).toThrow();
  });

  it("rejects forbidden language", () => {
    const artifact = artifactFor(
      fixture("solar-mesa-profile.fixture.json"),
      "This profile gives CL4 support.",
    );
    expect(() => starSimFusionProfileArtifactSchema.parse(artifact)).toThrow(/Forbidden language/);
  });

  it("rejects hSpectralFit as a new h measurement", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    profile.hSpectralFit.role = "new_measurement_of_h";
    const artifact = artifactFor(profile);
    expect(() => starSimFusionProfileArtifactSchema.parse(artifact)).toThrow(
      /calibration_only/,
    );
  });
});
