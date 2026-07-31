import {
  buildScientificEvidenceConformanceManifestV1,
  type ScientificEvidenceConformanceManifestV1,
} from "../contracts/scientific-evidence-conformance-manifest.v1";
import { computeCasimirSpecValueSha256V1 } from "../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  buildScientificEvidenceExecutionPlanV1,
  type ScientificEvidenceExecutionPlanV1,
} from "../contracts/scientific-evidence-execution-plan.v1";
import {
  ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
  ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
  ADVECTION_DIFFUSION_MODEL_BADGE_ID,
  buildAdvectionDiffusionScientificEvidenceBadgesV1,
} from "../theory/advection-diffusion-scientific-evidence-badges";
import {
  ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID,
  buildAdvectionDiffusionNumericalSpecV1,
} from "./advection-diffusion-numerical-spec";
import {
  ADVECTION_DIFFUSION_EMITTED_FORMAL_ARTIFACT_ID,
  ADVECTION_DIFFUSION_EMITTED_SOURCE_PATH,
  ADVECTION_DIFFUSION_EMITTED_SOURCE_SHA256,
  ADVECTION_DIFFUSION_EMITTED_THEOREM_MODULE,
  ADVECTION_DIFFUSION_LANYON_COMMIT_SHA,
  ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI,
  ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
  buildAdvectionDiffusionZeroGradientLeanBindingV1,
} from "./advection-diffusion-zero-gradient-lean-binding";
import {
  ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
  ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
  buildAdvectionDiffusionZeroGradientFormalSpecV1,
} from "./advection-diffusion-zero-gradient-formal-spec";

export const ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_MANIFEST_ID =
  "scientific-evidence:advection-diffusion-dxx:v1" as const;
export const ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_ORIENTATION_ID =
  "orientation:advection-diffusion-dxx-closure:v1" as const;
export const ADVECTION_DIFFUSION_SOURCE_CLAIM_ID =
  "source-claim:lanyon:advection_diffusion_full_1d:v1" as const;
export const ADVECTION_DIFFUSION_GRAPH_ID =
  "nhm2-theory-badge-graph" as const;
export const ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID =
  "lanyon-generated-finite-volume-kernel-with-casimir-driver:v1" as const;
export const ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID =
  "casimir-centered-method-of-lines-rk2:v1" as const;
export const ADVECTION_DIFFUSION_BASELINE_CASE_ID =
  "advection_diffusion_full_1d:dxx=0.01" as const;
export const ADVECTION_DIFFUSION_INTERVENTION_CASE_ID =
  "advection_diffusion_full_1d:dxx=0.02" as const;

export const ADVECTION_DIFFUSION_SELECTED_BADGE_IDS = [
  ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
  ADVECTION_DIFFUSION_MODEL_BADGE_ID,
  ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
].sort() as [
  typeof ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
  typeof ADVECTION_DIFFUSION_MODEL_BADGE_ID,
  typeof ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
];

export const ADVECTION_DIFFUSION_ORIENTATION_EDGE_IDS = [
  "advection_diffusion_model_feeds_diffusivity_intervention",
  "zero_gradient_contract_checks_diffusivity_intervention",
] as const;

export type AdvectionDiffusionScientificEvidenceEnrollmentV1 = {
  manifest: ScientificEvidenceConformanceManifestV1;
  sourceClaim: {
    artifactId: "scientific_source_claim";
    schemaVersion: "scientific_source_claim/v1";
    sourceClaimId: typeof ADVECTION_DIFFUSION_SOURCE_CLAIM_ID;
    artifactSha256: string;
    extractedStatementSha256: string;
    authority: {
      sourceIdentityOnly: true;
      assistantAnswer: false;
      terminalEligible: false;
    };
  };
  graphSnapshot: {
    artifactId: "theory_badge_graph_snapshot";
    schemaVersion: "theory_badge_graph_snapshot/v1";
    graphId: typeof ADVECTION_DIFFUSION_GRAPH_ID;
    artifactSha256: string;
    badgeIds: string[];
    edgeIds: string[];
    authority: {
      orientationIdentityOnly: true;
      assistantAnswer: false;
      terminalEligible: false;
    };
  };
  semanticToLeanBindingArtifactSha256: string;
};

const SOURCE_EXTRACTION = {
  caseId: "advection_diffusion_full_1d",
  parameters: ["a", "Dxx"],
  parameterAssumptions: ["Dxx > 0.0"],
  diffusiveFluxes: [["Dxx * f_x"]],
  conservationLaw:
    "partial_t f + partial_x(a * f) = partial_x(Dxx * partial_x f)",
  convention:
    "The pinned source represents diffusive_flux_f as positive Dxx * f_x.",
} as const;

export async function buildAdvectionDiffusionScientificEvidenceEnrollmentV1(
  generatedAt = "2026-07-30T00:00:00.000Z",
): Promise<AdvectionDiffusionScientificEvidenceEnrollmentV1> {
  const [formalSpec, numericalSpec, bindingArtifacts] = await Promise.all([
    buildAdvectionDiffusionZeroGradientFormalSpecV1(generatedAt),
    buildAdvectionDiffusionNumericalSpecV1(generatedAt),
    buildAdvectionDiffusionZeroGradientLeanBindingV1(generatedAt),
  ]);
  const formalClaim = formalSpec.claims.find(
    (claim) =>
      claim.claimId === ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
  );
  const numericalClaim = numericalSpec.claims.find(
    (claim) => claim.claimId === ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID,
  );
  if (!formalClaim || !numericalClaim)
    throw new Error("scientific evidence semantic claim is missing");

  const extractedStatementSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-source-claim-extraction/v1",
      value: SOURCE_EXTRACTION,
    });
  const sourceClaimWithoutHash = {
    artifactId: "scientific_source_claim" as const,
    schemaVersion: "scientific_source_claim/v1" as const,
    sourceClaimId: ADVECTION_DIFFUSION_SOURCE_CLAIM_ID,
    producerId: "lanyon",
    repositoryUri: ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI,
    commitSha: ADVECTION_DIFFUSION_LANYON_COMMIT_SHA,
    caseId: "advection_diffusion_full_1d",
    sourceArtifact: {
      logicalPath: ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
      sha256: ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
    },
    extraction: SOURCE_EXTRACTION,
    extractedStatementSha256,
    authority: {
      sourceIdentityOnly: true as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
    },
  };
  const sourceClaimArtifactSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-source-claim/v1",
      value: sourceClaimWithoutHash,
    });

  const orientation = buildAdvectionDiffusionScientificEvidenceBadgesV1();
  const badgeById = new Map(
    orientation.badges.map((badge) => [badge.id, badge]),
  );
  const edgeById = new Map(
    orientation.edges.map((edge) => [edge.id, edge]),
  );
  const graphSnapshotWithoutHash = {
    artifactId: "theory_badge_graph_snapshot" as const,
    schemaVersion: "theory_badge_graph_snapshot/v1" as const,
    graphId: ADVECTION_DIFFUSION_GRAPH_ID,
    badgeIds: [...ADVECTION_DIFFUSION_SELECTED_BADGE_IDS],
    edgeIds: [...ADVECTION_DIFFUSION_ORIENTATION_EDGE_IDS],
    badges: ADVECTION_DIFFUSION_SELECTED_BADGE_IDS.map((id) => {
      const badge = badgeById.get(id);
      if (!badge) throw new Error(`orientation badge missing: ${id}`);
      return badge;
    }),
    edges: ADVECTION_DIFFUSION_ORIENTATION_EDGE_IDS.map((id) => {
      const edge = edgeById.get(id);
      if (!edge) throw new Error(`orientation edge missing: ${id}`);
      return edge;
    }),
    authority: {
      orientationIdentityOnly: true as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
    },
  };
  const graphArtifactSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-theory-orientation/v1",
    value: graphSnapshotWithoutHash,
  });

  const manifest =
    await buildScientificEvidenceConformanceManifestV1({
      generatedAt,
      manifestId: ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_MANIFEST_ID,
      orientation: {
        orientationId:
          ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_ORIENTATION_ID,
        graphId: ADVECTION_DIFFUSION_GRAPH_ID,
        selectedBadgeIds: [...ADVECTION_DIFFUSION_SELECTED_BADGE_IDS],
        orderedEdgeIds: [...ADVECTION_DIFFUSION_ORIENTATION_EDGE_IDS],
        operation: "compare_parameter_intervention",
      },
      sourceClaim: {
        sourceClaimId: ADVECTION_DIFFUSION_SOURCE_CLAIM_ID,
        producerId: "lanyon",
        repositoryUri: ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI,
        commitSha: ADVECTION_DIFFUSION_LANYON_COMMIT_SHA,
        caseId: "advection_diffusion_full_1d",
        sourceArtifact: {
          role: "scientific_specification",
          logicalPath: ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
          sha256: ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
        },
        extraction: {
          language: "racket",
          selector:
            "parameters, parameters-assumptions, fluxes, diffusive-fluxes",
          extractedStatementSha256,
        },
      },
      semanticBindings: {
        formalCasimirSpec: {
          specId: formalSpec.specId,
          semanticSha256: formalSpec.semanticSha256,
          artifactSha256: formalSpec.artifactSha256,
          claimId: formalClaim.claimId,
          propositionSha256: formalClaim.propositionSha256,
        },
        numericalCasimirSpec: {
          specId: numericalSpec.specId,
          semanticSha256: numericalSpec.semanticSha256,
          artifactSha256: numericalSpec.artifactSha256,
          claimId: numericalClaim.claimId,
          propositionSha256: numericalClaim.propositionSha256,
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
            parameterId: "parameter:domain-length",
            sourceSymbol: "L",
            unit: "m",
            value: "1",
          },
          {
            parameterId: "parameter:final-time",
            sourceSymbol: "t_final",
            unit: "s",
            value: "0.05",
          },
          {
            parameterId: "parameter:grid-coarse",
            sourceSymbol: "N_coarse",
            unit: "1",
            value: "64",
          },
          {
            parameterId: "parameter:grid-fine",
            sourceSymbol: "N_fine",
            unit: "1",
            value: "256",
          },
          {
            parameterId: "parameter:grid-medium",
            sourceSymbol: "N_medium",
            unit: "1",
            value: "128",
          },
          {
            parameterId: "parameter:initial-amplitude",
            sourceSymbol: "A_0",
            unit: "1",
            value: "0.25",
          },
        ],
      },
      formalContract: {
        formalArtifactId:
          ADVECTION_DIFFUSION_EMITTED_FORMAL_ARTIFACT_ID,
        theoremModule: ADVECTION_DIFFUSION_EMITTED_THEOREM_MODULE,
        theoremName: ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
        sourceLogicalPath: ADVECTION_DIFFUSION_EMITTED_SOURCE_PATH,
        sourceSha256: ADVECTION_DIFFUSION_EMITTED_SOURCE_SHA256,
        propositionScope: "contract_subclaim",
        requiredClaimCeiling: "formal_contract_checked",
      },
      numericalContract: {
        baselineCaseId: ADVECTION_DIFFUSION_BASELINE_CASE_ID,
        interventionCaseId:
          ADVECTION_DIFFUSION_INTERVENTION_CASE_ID,
        primaryLineageId:
          ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID,
        independentLineageId:
          ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID,
        independentLaneKind: "numerical_solver",
        observableIds: [
          "fundamental_amplitude",
          "solution_l2_congruence",
        ],
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

  return {
    manifest,
    sourceClaim: {
      artifactId: sourceClaimWithoutHash.artifactId,
      schemaVersion: sourceClaimWithoutHash.schemaVersion,
      sourceClaimId: sourceClaimWithoutHash.sourceClaimId,
      artifactSha256: sourceClaimArtifactSha256,
      extractedStatementSha256,
      authority: sourceClaimWithoutHash.authority,
    },
    graphSnapshot: {
      artifactId: graphSnapshotWithoutHash.artifactId,
      schemaVersion: graphSnapshotWithoutHash.schemaVersion,
      graphId: graphSnapshotWithoutHash.graphId,
      artifactSha256: graphArtifactSha256,
      badgeIds: graphSnapshotWithoutHash.badgeIds,
      edgeIds: graphSnapshotWithoutHash.edgeIds,
      authority: graphSnapshotWithoutHash.authority,
    },
    semanticToLeanBindingArtifactSha256:
      bindingArtifacts.binding.artifactSha256,
  };
}

export async function buildAdvectionDiffusionScientificEvidenceExecutionPlanV1(
  input: {
    turnId: string;
    interventionValue: string;
    generatedAt?: string;
    planId?: string;
  },
): Promise<ScientificEvidenceExecutionPlanV1> {
  const enrollment =
    await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
  const parameterPolicy = enrollment.manifest.parameterPolicy;
  if (
    !parameterPolicy.permittedValues.includes(input.interventionValue) ||
    input.interventionValue === parameterPolicy.baselineValue
  ) {
    throw new Error("scientific_evidence_intervention_not_permitted");
  }
  const frozenParametersSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-frozen-inputs/v1",
      value: parameterPolicy.frozenParameters,
    });
  return buildScientificEvidenceExecutionPlanV1({
    generatedAt: input.generatedAt,
    planId: input.planId,
    turnBinding: { turnId: input.turnId },
    enrollment: {
      manifestId: enrollment.manifest.manifestId,
      manifestArtifactSha256: enrollment.manifest.artifactSha256,
    },
    selection: {
      orientationId: enrollment.manifest.orientation.orientationId,
      graphId: enrollment.manifest.orientation.graphId,
      selectedBadgeIds: [
        ...enrollment.manifest.orientation.selectedBadgeIds,
      ],
      sourceClaimId: enrollment.manifest.sourceClaim.sourceClaimId,
      sourceClaimArtifactSha256:
        enrollment.sourceClaim.artifactSha256,
    },
    intervention: {
      parameterId: parameterPolicy.mutableParameterId,
      sourceSymbol: parameterPolicy.sourceSymbol,
      unit: parameterPolicy.unit,
      baselineValue: parameterPolicy.baselineValue,
      selectedValue: input.interventionValue,
      frozenParametersSha256,
    },
    lanyonStaging: {
      producerId: enrollment.manifest.sourceClaim.producerId,
      repositoryUri: enrollment.manifest.sourceClaim.repositoryUri,
      commitSha: enrollment.manifest.sourceClaim.commitSha,
      caseId: enrollment.manifest.sourceClaim.caseId,
      sourceLogicalPath:
        enrollment.manifest.sourceClaim.sourceArtifact.logicalPath,
      sourceSha256:
        enrollment.manifest.sourceClaim.sourceArtifact.sha256,
      requiredCapabilityIds: [
        "theory-experiment-procedure.prepare",
        "theory-semantic-admitter.normalize",
        "theory-artifact-producer.prepare_lanyon_request",
        "theory-artifact-producer.admit_lanyon_snapshot",
      ],
    },
    formalReplay: {
      specId:
        enrollment.manifest.semanticBindings.formalCasimirSpec.specId,
      claimId:
        enrollment.manifest.semanticBindings.formalCasimirSpec.claimId,
      propositionSha256:
        enrollment.manifest.semanticBindings.formalCasimirSpec
          .propositionSha256,
      theoremName: enrollment.manifest.formalContract.theoremName,
      theoremTypeSha256:
        ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
      requiredCapabilityIds: [
        "theory-formal-verifier.prepare_request",
        "theory-formal-verifier.plan",
        "theory-formal-verifier.start",
        "theory-formal-verifier.read_result",
      ],
    },
    numericalReplay: {
      specId:
        enrollment.manifest.semanticBindings.numericalCasimirSpec.specId,
      claimId:
        enrollment.manifest.semanticBindings.numericalCasimirSpec.claimId,
      propositionSha256:
        enrollment.manifest.semanticBindings.numericalCasimirSpec
          .propositionSha256,
      baselineCaseId:
        enrollment.manifest.numericalContract.baselineCaseId,
      interventionCaseId:
        enrollment.manifest.numericalContract.interventionCaseId,
      primaryLineageId:
        enrollment.manifest.numericalContract.primaryLineageId,
      independentLineageId:
        enrollment.manifest.numericalContract.independentLineageId,
      observableIds: [
        ...enrollment.manifest.numericalContract.observableIds,
      ],
      requiredCapabilityIds: [
        "theory-independent-numerical-verifier.prepare_request",
        "theory-independent-numerical-verifier.plan",
        "theory-independent-numerical-verifier.start",
        "theory-independent-numerical-verifier.read_result",
      ],
    },
    closure: {
      requiredAxes: [...enrollment.manifest.closurePolicy.requiredAxes],
      evaluationCapabilityId: "scientific-evidence-closure.evaluate",
      currentTurnEvidenceReentryRequired: true,
    },
  });
}
