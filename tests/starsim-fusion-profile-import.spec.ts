import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseStarSimFusionProfileImport } from "../shared/starsim-fusion-profile-import";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function fixture(name: string) {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

describe("StarSim fusion profile import", () => {
  it("accepts MESA-like solar, red-dwarf, red-giant, high-mass, and neutron-star fixtures", () => {
    for (const name of [
      "solar-mesa-profile.fixture.json",
      "red-dwarf-profile.fixture.json",
      "red-giant-shell-profile.fixture.json",
      "high-mass-cno-profile.fixture.json",
      "neutron-star-glitch-profile.fixture.json",
    ]) {
      expect(() => parseStarSimFusionProfileImport(fixture(name))).not.toThrow();
    }
  });

  it("rejects shell arrays with no usable mass or radius integration basis", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    profile.shells = [{ shellIndex: 0, radius_Rstar: 0.1 }];
    expect(() => parseStarSimFusionProfileImport(profile)).toThrow(/integration basis|shellMass/);
  });

  it("rejects missing claimIds and citations", () => {
    const noClaims = fixture("solar-mesa-profile.fixture.json");
    noClaims.provenance.claimIds = [];
    expect(() => parseStarSimFusionProfileImport(noClaims)).toThrow();

    const noCitations = fixture("solar-mesa-profile.fixture.json");
    noCitations.provenance.citations = [];
    expect(() => parseStarSimFusionProfileImport(noCitations)).toThrow();
  });

  it("rejects direct ER=EPR evidence role", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    profile.provenance.qstRole = "direct_er_epr_evidence";
    expect(() => parseStarSimFusionProfileImport(profile)).toThrow(/direct ER=EPR evidence/);
  });
});
