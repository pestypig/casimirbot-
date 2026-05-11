import { describe, expect, it } from "vitest";
import { starSimSolarMesaReproArtifactSchema } from "../shared/starsim-solar-mesa-repro-artifact";

const baseArtifact = {
  schemaVersion: "starsim-solar-mesa-repro-artifact.v1",
  runId: "mesa-repro-test",
  createdAt: "2026-05-11T00:00:00.000Z",
  runtime: {
    runtimeKind: "local",
    exitCode: 0,
    runLogPath: "run.log",
    runLogHash: "run-log-hash",
  },
  inputs: {
    inlistProjectPath: "inlist_project",
    inlistProjectHash: "inlist-hash",
  },
  outputs: {
    profilePath: "profile.data",
    profileHash: "profile-hash",
    historyPath: "history.data",
    historyHash: "history-hash",
  },
  parsed: {
    profileImportRef: "profile-import.json",
    profileValidationRef: "profile-validation.json",
    benchmarkReportRef: "benchmark.json",
    stage2GateReportRef: "gate.json",
  },
  evidence: {
    stage: "STARSIM_SOLAR_MESA_DOCKER_REPRO_V1",
    claimTier: "mesa_imported_solar_reference",
    claimIds: ["mesa_external_runtime_requires_hashes.v1"],
    citations: ["https://arxiv.org/abs/1009.1622"],
    uncertaintyNotes: ["Requires hashes."],
    caveats: ["Import only."],
  },
  qstBoundary: {
    spacetimeCL: "proxy_only",
    mayPromoteToCL4: false,
    caveats: ["Proxy only."],
  },
};

describe("StarSim solar MESA repro artifact", () => {
  it("accepts imported and reproduced artifacts with hashes", () => {
    expect(starSimSolarMesaReproArtifactSchema.parse(baseArtifact).evidence.claimTier).toBe(
      "mesa_imported_solar_reference",
    );
    expect(
      starSimSolarMesaReproArtifactSchema.parse({
        ...baseArtifact,
        evidence: { ...baseArtifact.evidence, claimTier: "mesa_reproduced_solar_reference" },
      }).evidence.claimTier,
    ).toBe("mesa_reproduced_solar_reference");
  });

  it("rejects missing hashes for reproduced mode", () => {
    expect(() =>
      starSimSolarMesaReproArtifactSchema.parse({
        ...baseArtifact,
        runtime: { ...baseArtifact.runtime, runLogHash: "" },
        evidence: { ...baseArtifact.evidence, claimTier: "mesa_reproduced_solar_reference" },
      }),
    ).toThrow();
  });

  it("rejects missing evidence and CL promotion", () => {
    expect(() =>
      starSimSolarMesaReproArtifactSchema.parse({
        ...baseArtifact,
        evidence: { ...baseArtifact.evidence, claimIds: [] },
      }),
    ).toThrow();
    expect(() =>
      starSimSolarMesaReproArtifactSchema.parse({
        ...baseArtifact,
        qstBoundary: { spacetimeCL: "CL4", mayPromoteToCL4: true, caveats: ["bad"] },
      }),
    ).toThrow();
  });
});
