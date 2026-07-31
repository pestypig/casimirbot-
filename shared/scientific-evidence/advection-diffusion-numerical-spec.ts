import {
  buildCasimirSpecScientificClaimIrV1,
  computeCasimirSpecValueSha256V1,
  type CasimirSpecDimensionVectorV1,
  type CasimirSpecExpressionV1,
  type CasimirSpecScientificClaimIrV1,
} from "../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
  ADVECTION_DIFFUSION_MODEL_BADGE_ID,
} from "../theory/advection-diffusion-scientific-evidence-badges";
import {
  ADVECTION_DIFFUSION_LANYON_COMMIT_SHA,
  ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI,
} from "./advection-diffusion-zero-gradient-lean-binding";
import {
  ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
  ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
} from "./advection-diffusion-zero-gradient-formal-spec";

export const ADVECTION_DIFFUSION_NUMERICAL_SPEC_ID =
  "casimir-spec:advection-diffusion-periodic-numerical-case:v1" as const;
export const ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID =
  "claim:advection-diffusion-periodic-bounded-case" as const;

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
const rational = (
  numerator: string,
  denominator = "1",
): CasimirSpecExpressionV1 => ({
  kind: "rational_literal",
  numerator,
  denominator,
});

export async function buildAdvectionDiffusionNumericalSpecV1(
  generatedAt = "2026-07-30T00:00:00.000Z",
): Promise<CasimirSpecScientificClaimIrV1> {
  const provenanceId = "provenance:lanyon-periodic-numerical-case";
  const profileSemanticSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-numerical-profile/v1",
    value: {
      case: "advection_diffusion_full_1d",
      domain: "[0,1)",
      boundary: "periodic",
      initialCondition: "u(x,0)=1+0.25*sin(2*pi*x)",
      source: "zero",
      velocity: "0.5",
      finalTime: "0.05",
      grids: [64, 128, 256],
      replayCount: 2,
    },
  });

  return buildCasimirSpecScientificClaimIrV1({
    generatedAt,
    specId: ADVECTION_DIFFUSION_NUMERICAL_SPEC_ID,
    title: "Bounded periodic advection-diffusion numerical case",
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
        ADVECTION_DIFFUSION_CLOSURE_BADGE_ID,
        ADVECTION_DIFFUSION_MODEL_BADGE_ID,
      ].sort(),
      coverageBasis: "unmeasured",
      representedProbabilityMass: null,
      outOfGraphProbability: null,
      interpretation: "coverage_uncertainty_not_truth_probability",
    },
    catalogBindings: [],
    foundations: [
      {
        foundationId: "foundation:bounded-numerical-case-v1",
        formalSystem: "numerical_contract",
        formalSystemVersion: "1",
        logicProfileId: "dual-solver-congruence",
        profileSemanticSha256,
        environmentLockProvenanceId: provenanceId,
        provenanceIds: [provenanceId],
      },
    ],
    provenanceLedger: [
      {
        provenanceId,
        kind: "repo_artifact",
        locator: `${ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI}@${ADVECTION_DIFFUSION_LANYON_COMMIT_SHA}/${ADVECTION_DIFFUSION_LANYON_SPEC_PATH}`,
        contentSha256: ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
        fragment: "advection_diffusion_full_1d",
        citation: null,
      },
    ],
    symbols: [
      {
        symbolId: "symbol:concentration",
        localName: "u",
        displayName: "normalized concentration",
        identity: {
          kind: "local",
          semanticId:
            "casimir.local::advection_diffusion.normalized_concentration",
        },
        role: "physical_quantity",
        typeExpression: "Real -> Real",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "1",
          dimensions: dimensions("0", "0"),
        },
        frameBinding: {
          status: "bound",
          frameDefinitionId: "definition:periodic-domain-frame",
        },
        definitionId: "definition:concentration",
        provenanceIds: [provenanceId],
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
        provenanceIds: [provenanceId],
      },
      {
        symbolId: "symbol:velocity",
        localName: "a",
        displayName: "advection velocity",
        identity: {
          kind: "local",
          semanticId: "casimir.local::advection_diffusion.velocity",
        },
        role: "parameter",
        typeExpression: "Real",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "m s^-1",
          dimensions: dimensions("1", "-1"),
        },
        frameBinding: {
          status: "bound",
          frameDefinitionId: "definition:periodic-domain-frame",
        },
        definitionId: "definition:velocity",
        provenanceIds: [provenanceId],
      },
    ],
    definitions: [
      {
        definitionId: "definition:concentration",
        kind: "mathematical",
        name: "NormalizedConcentration",
        display: "u(x,t) is a normalized scalar field on the periodic domain.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:concentration"),
        ),
        definesSymbolIds: ["symbol:concentration"],
        dependencyDefinitionIds: ["definition:periodic-domain-frame"],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:periodic-domain-frame"],
          conditions: ["x is in [0,1) and the boundary is periodic."],
        },
        provenanceIds: [provenanceId],
      },
      {
        definitionId: "definition:diffusivity",
        kind: "model",
        name: "Diffusivity",
        display:
          "Dxx is the sole mutable parameter, restricted to the enrolled values.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:diffusivity"),
        ),
        definesSymbolIds: ["symbol:diffusivity"],
        dependencyDefinitionIds: [],
        assumptionIds: ["assumption:diffusivity-enrolled"],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: [],
          conditions: ["Dxx is either 0.01 or 0.02 m^2 s^-1."],
        },
        provenanceIds: [provenanceId],
      },
      {
        definitionId: "definition:observation",
        kind: "operational",
        name: "FundamentalModeObservation",
        display:
          "The reported amplitude is the magnitude of the first discrete Fourier mode on the finest enrolled grid.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:concentration"),
        ),
        definesSymbolIds: [],
        dependencyDefinitionIds: [
          "definition:concentration",
          "definition:periodic-domain-frame",
        ],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:periodic-domain-frame"],
          conditions: ["Evaluated at the frozen final time."],
        },
        provenanceIds: [provenanceId],
      },
      {
        definitionId: "definition:pde",
        kind: "model",
        name: "AdvectionDiffusionEquation1D",
        display: "partial_t u + a partial_x u = Dxx partial_xx u.",
        expression: applies(
          "casimir.core::eq",
          applies(
            "casimir.core::add",
            applies(
              "casimir.core::partial_t",
              symbol("symbol:concentration"),
            ),
            applies(
              "casimir.core::mul",
              symbol("symbol:velocity"),
              applies(
                "casimir.core::partial_x",
                symbol("symbol:concentration"),
              ),
            ),
          ),
          applies(
            "casimir.core::mul",
            symbol("symbol:diffusivity"),
            applies(
              "casimir.core::partial_xx",
              symbol("symbol:concentration"),
            ),
          ),
        ),
        definesSymbolIds: [],
        dependencyDefinitionIds: [
          "definition:concentration",
          "definition:diffusivity",
          "definition:periodic-domain-frame",
          "definition:velocity",
        ],
        assumptionIds: [
          "assumption:diffusivity-enrolled",
          "assumption:frozen-case",
        ],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:periodic-domain-frame"],
          conditions: ["The case is bounded by the frozen enrollment inputs."],
        },
        provenanceIds: [provenanceId],
      },
      {
        definitionId: "definition:periodic-domain-frame",
        kind: "frame",
        name: "PeriodicUnitDomainFrame",
        display: "The computational coordinate is x in [0,1) with periodic wrap.",
        expression: applies("casimir.core::frame_definition"),
        definesSymbolIds: [],
        dependencyDefinitionIds: [],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: [],
          conditions: ["The domain length is exactly 1 m."],
        },
        provenanceIds: [provenanceId],
      },
      {
        definitionId: "definition:velocity",
        kind: "model",
        name: "FrozenAdvectionVelocity",
        display: "a is fixed at 0.5 m s^-1.",
        expression: applies(
          "casimir.core::declares",
          symbol("symbol:velocity"),
        ),
        definesSymbolIds: ["symbol:velocity"],
        dependencyDefinitionIds: ["definition:periodic-domain-frame"],
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:periodic-domain-frame"],
          conditions: [],
        },
        provenanceIds: [provenanceId],
      },
    ],
    assumptions: [
      {
        assumptionId: "assumption:diffusivity-enrolled",
        kind: "model_assumption",
        displayStatement: "Dxx is nonnegative.",
        proposition: applies(
          "casimir.core::ge",
          symbol("symbol:diffusivity"),
          rational("0"),
        ),
        provenanceIds: [provenanceId],
      },
      {
        assumptionId: "assumption:frozen-case",
        kind: "model_assumption",
        displayStatement:
          "The velocity, domain, periodic boundary, sinusoidal initial field, zero source, final time, grids, observables, and tolerances are frozen.",
        proposition: applies(
          "casimir.core::eq",
          symbol("symbol:velocity"),
          rational("1", "2"),
        ),
        provenanceIds: [provenanceId],
      },
    ],
    axiomLedger: {
      admissionPolicy: "exact_allowlist",
      hiddenAxiomsAllowed: false,
      entries: [],
    },
    observables: [
      {
        observableId: "observable:fundamental-amplitude",
        canonicalObservableId:
          "observable.canonical.advection_diffusion.fundamental_amplitude",
        symbolId: "symbol:concentration",
        quantity:
          "magnitude of the first Fourier mode of the normalized solution at final time",
        mathematicalType: "scalar",
        unitBinding: {
          status: "specified",
          unit: "1",
          dimensions: dimensions("0", "0"),
        },
        frameBinding: {
          status: "bound",
          frameDefinitionId: "definition:periodic-domain-frame",
        },
        operationalDefinitionId: "definition:observation",
        responseModelDefinitionId: null,
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:periodic-domain-frame"],
          conditions: ["Evaluated at t = 0.05 s on the finest enrolled grid."],
        },
        provenanceIds: [provenanceId],
      },
    ],
    bridges: [],
    blockers: [
      {
        blockerId: "blocker:external-numerical-certificates-required",
        kind: "missing_evidence",
        description:
          "The semantic model cannot mark a numerical result executed; both sandboxed solver certificates must re-enter.",
        claimIds: [ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID],
        resolutionRequirement:
          "Replay the primary and independent lanes twice in the enrolled sandbox and admit both certificates.",
        provenanceIds: [provenanceId],
      },
    ],
    excludedClaims: [
      {
        excludedClaimId: "excluded:empirical-validation",
        kind: "empirical_validation",
        statement: "The synthetic case does not establish agreement with measurements.",
        reason: "No measurement or calibration receipt is present.",
        requiredEvidenceKinds: ["measurement_receipt", "uncertainty_budget"],
      },
      {
        excludedClaimId: "excluded:implementation-correctness",
        kind: "implementation_correctness",
        statement:
          "Cross-solver congruence does not prove either implementation correct.",
        reason: "No implementation-refinement proof is enrolled.",
        requiredEvidenceKinds: ["implementation_refinement_certificate"],
      },
      {
        excludedClaimId: "excluded:physical-truth",
        kind: "physical_truth",
        statement:
          "The synthetic computation does not establish physical truth or a realized mechanism.",
        reason: "Computational and empirical evidence are separate axes.",
        requiredEvidenceKinds: ["empirical_validation_receipt"],
      },
      {
        excludedClaimId: "excluded:theory-completeness",
        kind: "theory_completeness",
        statement:
          "The bounded case does not establish completeness of the model or graph.",
        reason: "The conformance world is open and the case is deliberately narrow.",
        requiredEvidenceKinds: ["scope_specific_completeness_argument"],
      },
    ],
    claims: [
      {
        claimId: ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID,
        name: "BoundedPeriodicAdvectionDiffusionCase",
        displayStatement:
          "Under the frozen enrolled inputs, evaluate the periodic one-dimensional advection-diffusion model at Dxx = 0.01 and Dxx = 0.02.",
        proposition: applies(
          "casimir.core::implies",
          applies(
            "casimir.core::and",
            {
              kind: "assumption_ref",
              assumptionId: "assumption:diffusivity-enrolled",
            },
            {
              kind: "assumption_ref",
              assumptionId: "assumption:frozen-case",
            },
          ),
          { kind: "definition_ref", definitionId: "definition:pde" },
        ),
        foundationId: "foundation:bounded-numerical-case-v1",
        definitionIds: [
          "definition:concentration",
          "definition:diffusivity",
          "definition:observation",
          "definition:pde",
          "definition:periodic-domain-frame",
          "definition:velocity",
        ],
        assumptionIds: [
          "assumption:diffusivity-enrolled",
          "assumption:frozen-case",
        ],
        allowedAxiomIds: [],
        symbolIds: [
          "symbol:concentration",
          "symbol:diffusivity",
          "symbol:velocity",
        ],
        observableIds: ["observable:fundamental-amplitude"],
        bridgeIds: [],
        excludedClaimIds: [
          "excluded:empirical-validation",
          "excluded:implementation-correctness",
          "excluded:physical-truth",
          "excluded:theory-completeness",
        ],
        provenanceIds: [provenanceId],
        sourceMap: [
          {
            mapId: "map:lanyon-periodic-numerical-case",
            displayFragment:
              "partial_t u + a partial_x u = Dxx partial_xx u",
            expressionPath: "/",
            definitionIds: [
              "definition:concentration",
              "definition:diffusivity",
              "definition:pde",
              "definition:periodic-domain-frame",
              "definition:velocity",
            ],
            symbolIds: [
              "symbol:concentration",
              "symbol:diffusivity",
              "symbol:velocity",
            ],
          },
        ],
        axes: {
          logical: { declaration: "conjecture", resolution: "unassessed" },
          computational: {
            status: "partial",
            reason:
              "The claim is computable only through the separately enrolled dual-solver runtime.",
            blockerIds: [
              "blocker:external-numerical-certificates-required",
            ],
          },
          scientific: { status: "diagnostic", receiptProvenanceIds: [] },
          coverage: {
            status: "unknown",
            blockerIds: [
              "blocker:external-numerical-certificates-required",
            ],
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
