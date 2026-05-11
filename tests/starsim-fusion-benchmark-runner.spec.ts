import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  runStarSimFusionBenchmarkPlan,
  type StarSimFusionBenchmarkPlan,
} from "../shared/starsim-fusion-benchmark-runner";

const profileDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");
const tempFixtureDir = mkdtempSync(join(tmpdir(), "starsim-fusion-benchmark-"));

function plan(overrides: Partial<StarSimFusionBenchmarkPlan> = {}): StarSimFusionBenchmarkPlan {
  return {
    schemaVersion: "starsim-fusion-benchmark-plan.v1",
    planId: "test-plan",
    createdAt: "2026-05-11T00:00:00.000Z",
    benchmarkSet: "solar_reference",
    profileRefs: [
      {
        objectId: "solar-mesa-fixture",
        profilePath: join(profileDir, "solar-mesa-profile.fixture.json"),
        profileHash: "fixture-solar-001",
        source: "mesa_fixture",
      },
    ],
    thresholds: { luminosityClosureRelErrMax: 100 },
    uncertaintyPolicy: { mode: "interval", samples: 2, seed: 1, perturb: "profile_shells_only" },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      role: "stellar_quantum_microphysics_prior",
    },
    ...overrides,
  };
}

describe("StarSim fusion benchmark runner", () => {
  it("returns pp_chain for the solar benchmark pack", () => {
    const report = runStarSimFusionBenchmarkPlan(plan());
    expect(report.profileResults[0].integratedFusion.dominantFusionChannel).toBe("pp_chain");
  });

  it("returns cno_cycle for a high-mass benchmark pack", () => {
    const report = runStarSimFusionBenchmarkPlan(
      plan({
        benchmarkSet: "high_mass_cno_grid",
        profileRefs: [
          {
            objectId: "high-mass-cno-fixture",
            profilePath: join(profileDir, "high-mass-cno-profile.fixture.json"),
            profileHash: "fixture-cno-001",
            source: "mesa_fixture",
          },
        ],
      }),
    );
    expect(report.profileResults[0].integratedFusion.dominantFusionChannel).toBe("cno_cycle");
  });

  it("returns shell_fusion for a red giant and compact branch for neutron stars", () => {
    const redGiant = runStarSimFusionBenchmarkPlan(
      plan({
        profileRefs: [
          {
            objectId: "red-giant-shell-fixture",
            profilePath: join(profileDir, "red-giant-shell-profile.fixture.json"),
            profileHash: "fixture-giant-001",
            source: "mesa_fixture",
          },
        ],
      }),
    );
    expect(redGiant.profileResults[0].fusionZone.mode).toBe("shell_fusion");

    const neutron = runStarSimFusionBenchmarkPlan(
      plan({
        benchmarkSet: "compact_object_glitch_context",
        profileRefs: [
          {
            objectId: "neutron-star-glitch-fixture",
            profilePath: join(profileDir, "neutron-star-glitch-profile.fixture.json"),
            profileHash: "fixture-ns-001",
            source: "compact_object_glitch_fixture",
          },
        ],
      }),
    );
    expect(neutron.profileResults[0].integratedFusion.dominantFusionChannel).toBe(
      "compact_object_not_fusing",
    );
  });

  it("blocks Stage2 readiness when hash, uncertainty, or closure fail", () => {
    const missingHash = runStarSimFusionBenchmarkPlan(
      plan({
        profileRefs: [
          {
            objectId: "red-dwarf-no-hash",
            profilePath: join(profileDir, "red-dwarf-profile.fixture.json"),
            source: "mesa_fixture",
          },
        ],
      }),
    );
    expect(missingHash.blockers.map((item) => item.blockerId)).toContain("missing_profile_hash");

    const missingUncertainty = runStarSimFusionBenchmarkPlan(
      plan({ uncertaintyPolicy: { mode: "none", perturb: "profile_shells_only" } }),
    );
    expect(missingUncertainty.blockers.map((item) => item.blockerId)).toContain("missing_uncertainty_model");

    const closureFail = runStarSimFusionBenchmarkPlan(
      plan({
        benchmarkSet: "high_mass_cno_grid",
        profileRefs: [
          {
            objectId: "high-mass-cno-fixture",
            profilePath: join(profileDir, "high-mass-cno-profile.fixture.json"),
            profileHash: "fixture-cno-001",
            source: "mesa_fixture",
          },
        ],
        thresholds: { luminosityClosureRelErrMax: 0.01 },
      }),
    );
    expect(closureFail.blockers.map((item) => item.blockerId)).toContain("luminosity_closure_failed");
  });

  it("returns mesa_import_benchmark_support for a complete MESA import fixture", () => {
    const raw = JSON.parse(readFileSync(join(profileDir, "solar-mesa-profile.fixture.json"), "utf8"));
    raw.source = "mesa_profile";
    raw.sourceHash = "mesa-hash";
    raw.provenance.reproducibilityStatus = "mesa_imported";
    raw.mesaMetadata = {
      profileHash: "mesa-profile-hash",
      inlistHash: "mesa-inlist-hash",
      network: "pp_cno_extras.net",
    };
    const path = join(tempFixtureDir, "tmp-mesa-import.fixture.json");
    writeFileSync(path, JSON.stringify(raw, null, 2));
    const report = runStarSimFusionBenchmarkPlan(
      plan({
        profileRefs: [{ objectId: raw.objectId, profilePath: path, profileHash: "mesa-profile-hash", source: "mesa_profile" }],
      }),
    );
    expect(report.aggregate.strongestVerdict).toBe("mesa_import_benchmark_support");
  });

  it("allows Stage2_candidate_ready only when external metadata and uncertainty pass", () => {
    const raw = JSON.parse(readFileSync(join(profileDir, "solar-mesa-profile.fixture.json"), "utf8"));
    raw.source = "external_profile";
    raw.sourceHash = "external-hash";
    raw.provenance.reproducibilityStatus = "externally_reproduced";
    raw.mesaMetadata = { profileHash: "external-profile-hash" };
    const path = join(tempFixtureDir, "tmp-external.fixture.json");
    writeFileSync(path, JSON.stringify(raw, null, 2));
    const report = runStarSimFusionBenchmarkPlan(
      plan({
        profileRefs: [{ objectId: raw.objectId, profilePath: path, profileHash: "external-profile-hash", source: "external_profile" }],
      }),
    );
    expect(report.aggregate.strongestVerdict).toBe("stage2_candidate_ready");
  });
});
