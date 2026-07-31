import { describe, expect, it } from "vitest";

import {
  buildScientificEvidenceConformanceManifestV1,
  validateScientificEvidenceConformanceManifestV1,
} from "../scientific-evidence-conformance-manifest.v1";

const hash = (character: string) => character.repeat(64);

const build = () =>
  buildScientificEvidenceConformanceManifestV1({
    generatedAt: "2026-07-30T12:00:00.000Z",
    manifestId: "scientific-evidence:advection-diffusion-dxx:v1",
    orientation: {
      orientationId: "orientation:advection-diffusion-dxx-closure",
      graphId: "nhm2-theory-badge-graph",
      selectedBadgeIds: [
        "science.evidence.advection_diffusion_diffusivity_intervention",
        "science.transport.advection_diffusion_full_1d",
        "science.transport.zero_gradient_diffusive_flux_contract",
      ],
      orderedEdgeIds: [
        "advection_diffusion_model_feeds_diffusivity_intervention",
        "zero_gradient_contract_checks_diffusivity_intervention",
      ],
      operation: "compare_parameter_intervention",
    },
    sourceClaim: {
      sourceClaimId: "lanyon:advection_diffusion_full_1d:diffusive_flux",
      producerId: "lanyon",
      repositoryUri: "https://github.com/lanyonai/AdvectionDiffusion",
      commitSha: "3d19be11e101121d8187230977f5a5aeba0daefe",
      caseId: "advection_diffusion_full_1d",
      sourceArtifact: {
        role: "scientific_specification",
        logicalPath: "specifications/advection_diffusion_full_1d.rkt",
        sha256: hash("a"),
      },
      extraction: {
        language: "racket",
        selector: "diffusive-flux/x",
        extractedStatementSha256: hash("b"),
      },
    },
    semanticBindings: {
      formalCasimirSpec: {
        specId: "casimir-spec:zero-gradient-diffusive-flux",
        semanticSha256: hash("c"),
        artifactSha256: hash("d"),
        claimId: "claim:zero-gradient-zero-diffusive-flux",
        propositionSha256: hash("e"),
      },
      numericalCasimirSpec: {
        specId: "casimir-spec:advection-diffusion-full-1d",
        semanticSha256: hash("f"),
        artifactSha256: hash("1"),
        claimId: "claim:advection-diffusion-equation",
        propositionSha256: hash("2"),
      },
    },
    parameterPolicy: {
      mutableParameterId: "parameter:diffusivity",
      sourceSymbol: "Dxx",
      unit: "m^2 s^-1",
      canonicalEncoding: "exact_decimal_string",
      minimumInclusive: "0.01",
      maximumInclusive: "0.02",
      baselineValue: "0.01",
      permittedValues: ["0.01", "0.02"],
      frozenParameters: [
        {
          parameterId: "parameter:advection-velocity",
          sourceSymbol: "a",
          unit: "m s^-1",
          value: "0.5",
        },
        {
          parameterId: "parameter:final-time",
          sourceSymbol: "t_final",
          unit: "s",
          value: "0.05",
        },
      ],
    },
    formalContract: {
      formalArtifactId:
        "lanyon:advection_diffusion_full_1d:xDiffusiveFluxConsistency",
      theoremModule: "advection_diffusion_full_1d",
      theoremName:
        "advection_diffusion_full_1d.xDiffusiveFluxConsistency",
      sourceLogicalPath: "proofs/advection_diffusion_full_1d.lean",
      sourceSha256: hash("3"),
      propositionScope: "contract_subclaim",
      requiredClaimCeiling: "formal_contract_checked",
    },
    numericalContract: {
      baselineCaseId: "advection_diffusion_full_1d:dxx=0.01",
      interventionCaseId: "advection_diffusion_full_1d:dxx=0.02",
      primaryLineageId: "lanyon-generated-kernel-with-casimir-driver",
      independentLineageId: "casimir-centered-method-of-lines-rk2",
      independentLaneKind: "numerical_solver",
      observableIds: ["solution_l2_congruence"],
      minimumRefinementLevels: 3,
      replayCount: 2,
    },
    closurePolicy: {
      requiredAxes: [
        "comparison",
        "formal",
        "graph",
        "independent_numerical",
        "semantic",
        "source",
      ],
      empiricalEvidenceRequired: false,
      maximumClaimCeiling: "synthetic_computational",
      currentTurnEvidenceReentryRequired: true,
      immutableReceiptRequired: true,
    },
  });

describe("scientific_evidence_conformance_manifest/v1", () => {
  it("accepts a hash-bound generic vertical-slice enrollment", async () => {
    const manifest = await build();
    expect(
      await validateScientificEvidenceConformanceManifestV1(manifest),
    ).toEqual([]);
    expect(manifest.authority.assistantAnswer).toBe(false);
    expect(manifest.numericalContract.independentLaneKind).toBe(
      "numerical_solver",
    );
  });

  it("rejects tampering and an analytic-only comparison lane", async () => {
    const manifest = await build();
    const tampered = structuredClone(manifest);
    tampered.parameterPolicy.baselineValue = "0.02";
    expect(
      await validateScientificEvidenceConformanceManifestV1(tampered),
    ).toContain("artifactSha256 does not match manifest content");

    const analyticOnly = structuredClone(manifest) as unknown as {
      numericalContract: { independentLaneKind: string };
    };
    analyticOnly.numericalContract.independentLaneKind = "analytic_reference";
    expect(
      (await validateScientificEvidenceConformanceManifestV1(analyticOnly)).some(
        (issue) => issue.includes("independentLaneKind"),
      ),
    ).toBe(true);
  });
});
