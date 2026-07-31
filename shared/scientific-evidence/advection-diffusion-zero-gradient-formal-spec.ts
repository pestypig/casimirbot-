import {
  buildCasimirSpecScientificClaimIrV1,
  computeCasimirSpecValueSha256V1,
  type CasimirSpecDimensionVectorV1,
  type CasimirSpecExpressionV1,
  type CasimirSpecScientificClaimIrV1,
} from "../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
  ADVECTION_DIFFUSION_MODEL_BADGE_ID,
} from "../theory/advection-diffusion-scientific-evidence-badges";

export const ADVECTION_DIFFUSION_ZERO_GRADIENT_SPEC_ID =
  "casimir-spec:advection-diffusion-zero-gradient-flux:v1" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID =
  "claim:zero-gradient-zero-diffusive-flux" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME =
  "advection_diffusion_full_1d.xDiffusiveFluxConsistency" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_MODULE =
  "advection_diffusion_full_1d" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_PATH =
  "proofs/advection_diffusion_full_1d.lean" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_SHA256 =
  "e1fab3be5a2aa3117477c996d7bed494fb3b0d382526e40e3a5e57008ac7d870" as const;
export const ADVECTION_DIFFUSION_LANYON_SPEC_PATH =
  "specifications/advection_diffusion_full_1d.rkt" as const;
export const ADVECTION_DIFFUSION_LANYON_SPEC_SHA256 =
  "9eae33f713875c567fcae890af1de1a58e0610e46ba45ff3ee423d2e138605e9" as const;
export const ADVECTION_DIFFUSION_FORMAL_PROFILE_ID =
  "lean4-mathlib-contract-replay:4.31.0" as const;

const dimensions = (
  length: string,
  time: string,
): CasimirSpecDimensionVectorV1 => ({
  mass: "0",
  length,
  time,
  current: "0",
  temperature: "0",
  amount: "0",
  luminousIntensity: "0",
});

const symbol = (symbolId: string): CasimirSpecExpressionV1 => ({
  kind: "symbol_ref",
  symbolId,
});

const applies = (
  operatorId: string,
  ...operands: CasimirSpecExpressionV1[]
): CasimirSpecExpressionV1 => ({
  kind: "apply",
  operatorId,
  arguments: operands,
});

export async function buildAdvectionDiffusionZeroGradientFormalSpecV1(
  generatedAt = new Date().toISOString(),
): Promise<CasimirSpecScientificClaimIrV1> {
  const provenanceIds = [
    "provenance:lanyon-formal-source",
    "provenance:lanyon-specification",
  ];
  const profileSemanticSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-formal-profile/v1",
    value: {
      profileId: ADVECTION_DIFFUSION_FORMAL_PROFILE_ID,
      prover: "lean4",
      leanVersion: "4.31.0",
      mathlibVersion: "4.31.0",
      theoremScope: "contract_subclaim",
      hiddenAxiomsAllowed: false,
      hostExecutionQualifiesAsProductionCertificate: false,
    },
  });
  return buildCasimirSpecScientificClaimIrV1({
    generatedAt,
    specId: ADVECTION_DIFFUSION_ZERO_GRADIENT_SPEC_ID,
    title: "Zero-gradient diffusive-flux formal contract",
    source: {
      kind: "ir_native",
      language: "casimir_spec",
      languageVersion: "casimir_spec/v1",
      artifact: { path: null, sha256: null },
    },
    world: {
      model: "open_world",
      exhaustive: false,
      graphId: "nhm2-theory-badge-graph",
      masterProblemPlanId: null,
      badgeIds: [
        ADVECTION_DIFFUSION_MODEL_BADGE_ID,
        ADVECTION_DIFFUSION_FORMAL_CONTRACT_BADGE_ID,
      ].sort(),
      coverageBasis: "unmeasured",
      representedProbabilityMass: null,
      outOfGraphProbability: null,
      interpretation: "coverage_uncertainty_not_truth_probability",
    },
    catalogBindings: [],
    foundations: [
      {
        foundationId: "foundation:lean4-4.31.0-mathlib-4.31.0",
        formalSystem: "Lean",
        formalSystemVersion: "4.31.0",
        logicProfileId: ADVECTION_DIFFUSION_FORMAL_PROFILE_ID,
        profileSemanticSha256,
        environmentLockProvenanceId: "provenance:lanyon-formal-source",
        provenanceIds,
      },
    ],
    provenanceLedger: [
      {
        provenanceId: "provenance:lanyon-formal-source",
        kind: "repo_artifact",
        locator:
          "https://github.com/lanyonai/AdvectionDiffusion@3d19be11e101121d8187230977f5a5aeba0daefe/proofs/advection_diffusion_full_1d.lean",
        contentSha256: ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_SHA256,
        fragment: ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
        citation: null,
      },
      {
        provenanceId: "provenance:lanyon-specification",
        kind: "repo_artifact",
        locator:
          "https://github.com/lanyonai/AdvectionDiffusion@3d19be11e101121d8187230977f5a5aeba0daefe/specifications/advection_diffusion_full_1d.rkt",
        contentSha256: ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
        fragment: "diffusive-flux",
        citation: null,
      },
    ],
    symbols: [
      {
        symbolId: "symbol:diffusive-flux",
        localName: "F_diff",
        displayName: "diffusive flux",
        identity: {
          kind: "local",
          semanticId: "casimir.local::advection_diffusion.diffusive_flux",
        },
        role: "physical_quantity",
        typeExpression: "Real",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "m s^-1",
          dimensions: dimensions("1", "-1"),
        },
        frameBinding: { status: "not_applicable", frameDefinitionId: null },
        definitionId: "definition:diffusive-flux",
        provenanceIds,
      },
      {
        symbolId: "symbol:diffusivity",
        localName: "Dxx",
        displayName: "diffusivity",
        identity: {
          kind: "local",
          semanticId: "casimir.local::advection_diffusion.diffusivity",
        },
        role: "parameter",
        typeExpression: "Real",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "m^2 s^-1",
          dimensions: dimensions("2", "-1"),
        },
        frameBinding: { status: "not_applicable", frameDefinitionId: null },
        definitionId: "definition:diffusivity",
        provenanceIds,
      },
      {
        symbolId: "symbol:spatial-gradient",
        localName: "f_x",
        displayName: "spatial gradient",
        identity: {
          kind: "local",
          semanticId: "casimir.local::advection_diffusion.spatial_gradient",
        },
        role: "mathematical_object",
        typeExpression: "Real",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "m^-1",
          dimensions: dimensions("-1", "0"),
        },
        frameBinding: { status: "not_applicable", frameDefinitionId: null },
        definitionId: "definition:spatial-gradient",
        provenanceIds,
      },
    ],
    definitions: [
      {
        definitionId: "definition:diffusive-flux",
        kind: "model",
        name: "DiffusiveFlux",
        display:
          "F_diff is defined as Dxx times f_x in the pinned Lanyon convention.",
        expression: applies(
          "casimir.core::eq",
          symbol("symbol:diffusive-flux"),
          applies(
            "casimir.core::mul",
            symbol("symbol:diffusivity"),
            symbol("symbol:spatial-gradient"),
          ),
        ),
        definesSymbolIds: ["symbol:diffusive-flux"],
        dependencyDefinitionIds: [
          "definition:diffusivity",
          "definition:spatial-gradient",
        ],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: [],
          conditions: [
            "One-dimensional constitutive flux contract from the pinned Lanyon case.",
          ],
        },
        provenanceIds,
      },
      {
        definitionId: "definition:diffusivity",
        kind: "model",
        name: "Diffusivity",
        display: "Dxx is the scalar one-dimensional diffusivity.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:diffusivity"),
        ),
        definesSymbolIds: ["symbol:diffusivity"],
        dependencyDefinitionIds: [],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: [],
          conditions: ["Dxx is finite; no empirical value is asserted here."],
        },
        provenanceIds,
      },
      {
        definitionId: "definition:spatial-gradient",
        kind: "mathematical",
        name: "SpatialGradient",
        display: "f_x is the one-dimensional spatial gradient.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:spatial-gradient"),
        ),
        definesSymbolIds: ["symbol:spatial-gradient"],
        dependencyDefinitionIds: [],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: [],
          conditions: [],
        },
        provenanceIds,
      },
    ],
    assumptions: [
      {
        assumptionId: "assumption:zero-spatial-gradient",
        kind: "typed_hypothesis",
        displayStatement: "The spatial gradient f_x is zero.",
        proposition: applies(
          "casimir.core::eq",
          symbol("symbol:spatial-gradient"),
          { kind: "rational_literal", numerator: "0", denominator: "1" },
        ),
        provenanceIds,
      },
    ],
    axiomLedger: {
      admissionPolicy: "exact_allowlist",
      hiddenAxiomsAllowed: false,
      entries: [],
    },
    observables: [],
    bridges: [],
    blockers: [
      {
        blockerId: "blocker:external-formal-certificate-required",
        kind: "formal_proof_not_run",
        description:
          "The semantic claim cannot mark itself proved; an exact pinned external Lean certificate must be re-entered.",
        claimIds: [ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID],
        resolutionRequirement:
          "Replay the reviewed binding in the enrolled Lean 4.31.0/Mathlib environment and admit its certificate.",
        provenanceIds,
      },
    ],
    excludedClaims: [
      {
        excludedClaimId: "excluded:empirical-validation",
        kind: "empirical_validation",
        statement: "This contract does not establish agreement with measurements.",
        reason: "No measurement, calibration, or uncertainty receipt is present.",
        requiredEvidenceKinds: [
          "calibration_receipt",
          "measurement_receipt",
          "uncertainty_budget",
        ],
      },
      {
        excludedClaimId: "excluded:implementation-correctness",
        kind: "implementation_correctness",
        statement:
          "This contract does not prove either numerical implementation correct.",
        reason:
          "Formal elaboration of a constitutive subclaim is distinct from program refinement.",
        requiredEvidenceKinds: [
          "implementation_refinement_certificate",
          "source_map",
        ],
      },
      {
        excludedClaimId: "excluded:numerical-convergence",
        kind: "numerical_convergence",
        statement: "This contract does not establish numerical convergence.",
        reason: "Numerical convergence is evaluated by a separate runtime lane.",
        requiredEvidenceKinds: ["independent_numerical_certificate"],
      },
      {
        excludedClaimId: "excluded:physical-truth",
        kind: "physical_truth",
        statement:
          "This contract does not establish that advection–diffusion is physically true for a system.",
        reason: "Formal consistency and empirical validity are separate axes.",
        requiredEvidenceKinds: ["empirical_validation_receipt"],
      },
      {
        excludedClaimId: "excluded:theory-completeness",
        kind: "theory_completeness",
        statement:
          "This narrow proposition does not establish completeness of the model, graph, or formal system.",
        reason: "The world policy is open and the proposition is a subclaim.",
        requiredEvidenceKinds: ["scope_specific_completeness_argument"],
      },
    ],
    claims: [
      {
        claimId: ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
        name: "ZeroGradientImpliesZeroDiffusiveFlux",
        displayStatement:
          "Under the enrolled diffusive-flux definition, f_x = 0 implies F_diff = 0 for every Dxx.",
        proposition: applies(
          "casimir.core::implies",
          { kind: "assumption_ref", assumptionId: "assumption:zero-spatial-gradient" },
          applies(
            "casimir.core::eq",
            symbol("symbol:diffusive-flux"),
            { kind: "rational_literal", numerator: "0", denominator: "1" },
          ),
        ),
        foundationId: "foundation:lean4-4.31.0-mathlib-4.31.0",
        definitionIds: [
          "definition:diffusive-flux",
          "definition:diffusivity",
          "definition:spatial-gradient",
        ],
        assumptionIds: ["assumption:zero-spatial-gradient"],
        allowedAxiomIds: [],
        symbolIds: [
          "symbol:diffusive-flux",
          "symbol:diffusivity",
          "symbol:spatial-gradient",
        ],
        observableIds: [],
        bridgeIds: [],
        excludedClaimIds: [
          "excluded:empirical-validation",
          "excluded:implementation-correctness",
          "excluded:numerical-convergence",
          "excluded:physical-truth",
          "excluded:theory-completeness",
        ],
        provenanceIds,
        sourceMap: [
          {
            mapId: "map:lanyon-zero-gradient-flux",
            displayFragment: "f_x = 0 implies Dxx * f_x = 0",
            expressionPath: "/",
            definitionIds: [
              "definition:diffusive-flux",
              "definition:diffusivity",
              "definition:spatial-gradient",
            ],
            symbolIds: [
              "symbol:diffusive-flux",
              "symbol:diffusivity",
              "symbol:spatial-gradient",
            ],
          },
        ],
        axes: {
          logical: { declaration: "conjecture", resolution: "unassessed" },
          computational: {
            status: "noncomputable",
            reason:
              "The source IR is a semantic proposition; formal replay is external.",
            blockerIds: [],
          },
          scientific: {
            status: "diagnostic",
            receiptProvenanceIds: [],
          },
          coverage: {
            status: "unknown",
            blockerIds: ["blocker:external-formal-certificate-required"],
          },
        },
        maturityCeiling: "diagnostic",
      },
    ],
    claimBoundary: {
      semanticSpecificationOnly: true,
      externalSemanticAdmissionRequired: true,
      proofStatusRequiresExternalCertificate: true,
      empiricalStatusRequiresExternalReceipt: true,
      humanRenderingAuthority: false,
      semanticIdentityAuthority: false,
      executesTools: false,
      validatesTheory: false,
      validatesPhysicalMechanism: false,
      proofAuthority: false,
      empiricalAuthority: false,
      implementationCorrectnessAuthority: false,
      promotionAllowed: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
    },
  });
}
