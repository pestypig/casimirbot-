import { describe, expect, it } from "vitest";
import { starSimFusionArtifactSchema } from "../shared/starsim-fusion-artifact";
import {
  evaluateStarSimFusionMicrophysics,
  type StarSimFusionMicrophysicsInput,
} from "../shared/starsim-fusion-microphysics";

function input(
  overrides: Partial<StarSimFusionMicrophysicsInput> = {},
): StarSimFusionMicrophysicsInput {
  return {
    objectId: "artifact-star",
    objectClass: "main_sequence",
    observables: {
      spectralType: "G2V",
      luminosity_Lsun: 1,
      radius_Rsun: 1,
      mass_Msun: 1,
    },
    modelMode: "surface_observable_proxy",
    qstUse: {
      role: "stellar_quantum_microphysics_prior",
      spacetimeCL: "proxy_only",
      quantumCL: "QCL0_dimensionless_bookkeeping",
      mayPromoteToCL4: false,
    },
    ...overrides,
  };
}

function artifactFor(rawInput: StarSimFusionMicrophysicsInput, status = "fixture_only") {
  const evaluation = evaluateStarSimFusionMicrophysics(rawInput);
  return {
    schemaVersion: "1.0.0",
    artifactId: `${rawInput.objectId}-artifact`,
    createdAt: "2026-05-11T00:00:00.000Z",
    input: rawInput,
    evaluation,
    claimIds: evaluation.evidence.claimIds,
    citations: evaluation.evidence.citations,
    caveats: evaluation.qstPrior.caveats,
    reproducibilityStatus: status,
  };
}

describe("StarSim fusion artifacts", () => {
  it("accepts a surface observable proxy fixture", () => {
    expect(() => starSimFusionArtifactSchema.parse(artifactFor(input()))).not.toThrow();
  });

  it("accepts a MESA-profile import fixture", () => {
    const mesaInput = input({
      objectId: "mesa-star",
      modelMode: "mesa_profile_import",
      observables: {
        spectralType: "F8V",
        mass_Msun: 1.2,
        radius_Rsun: 1.25,
        luminosity_Lsun: 2.0,
      },
    });
    expect(() =>
      starSimFusionArtifactSchema.parse(artifactFor(mesaInput, "mesa_imported")),
    ).not.toThrow();
  });

  it("rejects missing claim IDs", () => {
    const artifact = artifactFor(input());
    expect(() =>
      starSimFusionArtifactSchema.parse({ ...artifact, claimIds: [] }),
    ).toThrow();
  });

  it("rejects missing caveats", () => {
    const artifact = artifactFor(input());
    expect(() =>
      starSimFusionArtifactSchema.parse({ ...artifact, caveats: [] }),
    ).toThrow();
  });

  it("rejects direct ER=EPR evidence role", () => {
    const rawInput = input({
      qstUse: {
        role: "direct_er_epr_evidence",
        spacetimeCL: "proxy_only",
        quantumCL: "QCL1_entropy_stretch_proxy",
        mayPromoteToCL4: false,
      },
    });
    expect(() => starSimFusionArtifactSchema.parse(artifactFor(rawInput))).toThrow(
      /direct ER=EPR evidence/,
    );
  });

  it("requires a declared reproducibility status", () => {
    const artifact = artifactFor(input());
    expect(() =>
      starSimFusionArtifactSchema.parse({
        ...artifact,
        reproducibilityStatus: "unknown",
      }),
    ).toThrow();
    for (const reproducibilityStatus of [
      "fixture_only",
      "reduced_order_simulated",
      "mesa_imported",
      "externally_reproduced",
    ]) {
      expect(() =>
        starSimFusionArtifactSchema.parse({ ...artifact, reproducibilityStatus }),
      ).not.toThrow();
    }
  });
});
