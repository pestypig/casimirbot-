import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateStarSimFusionProfile } from "../shared/starsim-fusion-profile-validation";
import { evaluateStarSimFusionMicrophysics } from "../shared/starsim-fusion-microphysics";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function fixture(name: string) {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

describe("StarSim fusion profile validation", () => {
  it("integrates a solar-like profile to pp_chain dominant", () => {
    const validation = validateStarSimFusionProfile(fixture("solar-mesa-profile.fixture.json"));
    expect(validation.integratedFusion.dominantFusionChannel).toBe("pp_chain");
    expect(validation.fusionZone.mode).toBe("core_fusion");
    expect(validation.fusionZone.r90_Rstar).toBeCloseTo(0.3);
  });

  it("integrates a high-mass profile to cno_cycle dominant", () => {
    const validation = validateStarSimFusionProfile(fixture("high-mass-cno-profile.fixture.json"));
    expect(validation.integratedFusion.dominantFusionChannel).toBe("cno_cycle");
    expect(validation.fusionZone.mode).toBe("distributed_convective_core");
  });

  it("returns shell_fusion for a red-giant fixture", () => {
    const validation = validateStarSimFusionProfile(fixture("red-giant-shell-profile.fixture.json"));
    expect(validation.fusionZone.mode).toBe("shell_fusion");
  });

  it("returns core_fusion for the red-dwarf fixture", () => {
    const validation = validateStarSimFusionProfile(fixture("red-dwarf-profile.fixture.json"));
    expect(validation.integratedFusion.dominantFusionChannel).toBe("pp_chain");
    expect(validation.fusionZone.mode).toBe("core_fusion");
  });

  it("keeps neutron-star fixtures in the compact-object branch", () => {
    const validation = validateStarSimFusionProfile(
      fixture("neutron-star-glitch-profile.fixture.json"),
    );
    expect(validation.integratedFusion.dominantFusionChannel).toBe(
      "compact_object_not_fusing",
    );
    expect(validation.fusionZone.mode).toBe("compact_object_not_applicable");
  });

  it("compares Stage 1 proxy estimates without promotion", () => {
    const stage1 = evaluateStarSimFusionMicrophysics({
      objectId: "solar-mesa-fixture",
      objectClass: "main_sequence",
      observables: { spectralType: "G2V", mass_Msun: 1, radius_Rsun: 1, luminosity_Lsun: 1 },
      modelMode: "mesa_profile_import",
      qstUse: {
        role: "stellar_quantum_microphysics_prior",
        spacetimeCL: "proxy_only",
        quantumCL: "QCL1_entropy_stretch_proxy",
        mayPromoteToCL4: false,
      },
    });
    const validation = validateStarSimFusionProfile(
      fixture("solar-mesa-profile.fixture.json"),
      stage1,
    );
    expect(validation.comparisonToStage1Proxy.compared).toBe(true);
    expect(validation.comparisonToStage1Proxy.dominantChannelAgrees).toBe(true);
    expect(validation.qstBoundary.spacetimeCL).toBe("proxy_only");
    expect(validation.qstBoundary.mayPromoteToCL4).toBe(false);
  });

  it("emits a luminosity closure warning when surface and nuclear luminosity differ", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    profile.global.luminosity_Lsun = 10;
    const validation = validateStarSimFusionProfile(profile);
    expect(validation.integratedFusion.luminosityClosureRelErr).toBeGreaterThan(0.25);
    expect(validation.qstBoundary.caveats.join(" ")).toContain("Luminosity closure warning");
  });
});
