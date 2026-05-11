import { describe, expect, it } from "vitest";
import { starSimSolarReferenceRunArtifactSchema } from "../shared/starsim-solar-reference-artifact";

const baseArtifact = {
  schemaVersion: "starsim-solar-reference-run-artifact.v1",
  runId: "solar-ref-test",
  planId: "plan",
  createdAt: "2026-05-11T00:00:00.000Z",
  reproducibilityStatus: "fixture_only",
  mesaMetadata: { profileHash: "profile", inlistHash: "inlist" },
  importedProfileRef: "profile.json",
  fusionProfileValidationRef: "validation.json",
  benchmarkReportRef: "benchmark.json",
  stage2GateReportRef: "gate.json",
  closures: {
    luminosityClosureStatus: "pass",
    neutrinoClosureStatus: "pass",
    asteroseismicClosureStatus: "pass",
  },
  evidence: {
    stage: "STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1",
    claimTier: "fixture_only_solar_reference",
    claimIds: ["solar_reference_run_fixture_not_external_reproduction.v1"],
    citations: ["https://arxiv.org/abs/1009.1622"],
    sourceRoles: {
      "solar_reference_run_fixture_not_external_reproduction.v1": "supports_guardrail",
    },
    uncertaintyNotes: ["Fixture-only runs are not external reproduction."],
  },
  qstBoundary: {
    spacetimeCL: "proxy_only",
    mayPromoteToCL4: false,
    caveats: ["Proxy-only."],
  },
};

describe("StarSim solar reference artifact", () => {
  it("accepts fixture, imported, and reproduced solar references", () => {
    expect(starSimSolarReferenceRunArtifactSchema.parse(baseArtifact).reproducibilityStatus).toBe(
      "fixture_only",
    );
    expect(
      starSimSolarReferenceRunArtifactSchema.parse({
        ...baseArtifact,
        reproducibilityStatus: "mesa_imported",
        evidence: { ...baseArtifact.evidence, claimTier: "solver_imported_solar_reference" },
      }).reproducibilityStatus,
    ).toBe("mesa_imported");
    expect(
      starSimSolarReferenceRunArtifactSchema.parse({
        ...baseArtifact,
        reproducibilityStatus: "mesa_gyre_reproduced",
        evidence: { ...baseArtifact.evidence, claimTier: "solver_reproduced_solar_reference" },
      }).reproducibilityStatus,
    ).toBe("mesa_gyre_reproduced");
  });

  it("rejects missing evidence and forbidden language", () => {
    expect(() =>
      starSimSolarReferenceRunArtifactSchema.parse({
        ...baseArtifact,
        evidence: { ...baseArtifact.evidence, claimIds: [] },
      }),
    ).toThrow();
    expect(() =>
      starSimSolarReferenceRunArtifactSchema.parse({
        ...baseArtifact,
        safeSummary: "certified Stage 2",
      }),
    ).toThrow();
  });
});
