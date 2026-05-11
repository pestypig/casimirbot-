import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import {
  renderStarSimFusionBenchmarkReport,
  validateStarSimFusionBenchmarkSafeLanguage,
} from "../shared/starsim-fusion-benchmark-safe-language";

const profileDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function report() {
  return runStarSimFusionBenchmarkPlan({
    schemaVersion: "starsim-fusion-benchmark-plan.v1",
    planId: "safe-language-plan",
    createdAt: "2026-05-11T00:00:00.000Z",
    benchmarkSet: "solar_reference",
    profileRefs: [{ objectId: "solar", profilePath: join(profileDir, "solar-mesa-profile.fixture.json"), profileHash: "fixture-solar-001", source: "mesa_fixture" }],
    thresholds: { luminosityClosureRelErrMax: 100 },
    uncertaintyPolicy: { mode: "interval", samples: 2, perturb: "profile_shells_only" },
    qstBoundary: { spacetimeCL: "proxy_only", mayPromoteToCL4: false, role: "stellar_quantum_microphysics_prior" },
  });
}

describe("StarSim fusion benchmark safe language", () => {
  it("rejects forbidden language", () => {
    expect(validateStarSimFusionBenchmarkSafeLanguage("This proves ER=EPR.").ok).toBe(false);
    expect(validateStarSimFusionBenchmarkSafeLanguage("This derives a new Planck constant.").ok).toBe(false);
  });

  it("renders claim provenance and proxy-only boundary", () => {
    const text = renderStarSimFusionBenchmarkReport(report());
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("Source roles:");
    expect(text).toContain("Uncertainty notes:");
    expect(text).toContain("proxy_only");
    expect(validateStarSimFusionBenchmarkSafeLanguage(text).ok).toBe(true);
  });
});
