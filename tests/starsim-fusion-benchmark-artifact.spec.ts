import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { starSimFusionBenchmarkArtifactSchema } from "../shared/starsim-fusion-benchmark-artifact";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import { renderStarSimFusionBenchmarkReport } from "../shared/starsim-fusion-benchmark-safe-language";

const profileDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function artifact() {
  const report = runStarSimFusionBenchmarkPlan({
    schemaVersion: "starsim-fusion-benchmark-plan.v1",
    planId: "artifact-plan",
    createdAt: "2026-05-11T00:00:00.000Z",
    benchmarkSet: "solar_reference",
    profileRefs: [{ objectId: "solar", profilePath: join(profileDir, "solar-mesa-profile.fixture.json"), profileHash: "fixture-solar-001", source: "mesa_fixture" }],
    thresholds: { luminosityClosureRelErrMax: 100 },
    uncertaintyPolicy: { mode: "interval", samples: 2, perturb: "profile_shells_only" },
    qstBoundary: { spacetimeCL: "proxy_only", mayPromoteToCL4: false, role: "stellar_quantum_microphysics_prior" },
  });
  return {
    schemaVersion: "starsim-fusion-benchmark-artifact.v1",
    artifactId: "artifact-1",
    createdAt: "2026-05-11T00:00:00.000Z",
    report,
    claimIds: report.evidence.claimIds,
    citations: report.evidence.citations,
    uncertaintyNotes: report.evidence.uncertaintyNotes,
    safeSummary: renderStarSimFusionBenchmarkReport(report),
  };
}

describe("StarSim fusion benchmark artifacts", () => {
  it("accepts fixture, mesa, and external report shapes", () => {
    expect(() => starSimFusionBenchmarkArtifactSchema.parse(artifact())).not.toThrow();
  });

  it("rejects missing claim IDs, citations, uncertainty notes, forbidden language, and CL promotion", () => {
    const base = artifact();
    expect(() => starSimFusionBenchmarkArtifactSchema.parse({ ...base, claimIds: [] })).toThrow();
    expect(() => starSimFusionBenchmarkArtifactSchema.parse({ ...base, citations: [] })).toThrow();
    expect(() => starSimFusionBenchmarkArtifactSchema.parse({ ...base, uncertaintyNotes: [] })).toThrow();
    expect(() => starSimFusionBenchmarkArtifactSchema.parse({ ...base, safeSummary: "CL4 support" })).toThrow();
    const promoted = JSON.parse(JSON.stringify(base));
    promoted.report.qstBoundary.mayPromoteToCL4 = true;
    expect(() => starSimFusionBenchmarkArtifactSchema.parse(promoted)).toThrow();
  });
});
