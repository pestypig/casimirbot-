import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS,
} from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "./nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-prescription.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_ARTIFACT_ID =
  "nhm2.semiclassical_v2.renormalization_counterterms" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_renormalization_counterterms/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_INPUT_ID =
  "renormalization_counterterms" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS =
  Object.freeze({
    sourceCandidatePlanSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    sourceCandidatePlanCanonicalSizeBytes: 93214,
    v2CandidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    v2CandidateFreezeCanonicalSizeBytes: 55997,
    branchBvpSha256:
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    branchBvpCanonicalSizeBytes: 13847,
    renormalizationPrescriptionSha256:
      "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
    renormalizationPrescriptionCanonicalSizeBytes: 10670,
    scienceDerivationDagSha256:
      "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BLOCKERS =
  Object.freeze([
    "primary_source_byte_packet_not_bound",
    "counterterm_derivation_packet_not_bound",
    "cLambda_symbolic_derivation_not_server_replayed",
    "cLambda_f64_rounding_derivation_not_independently_replayed",
    "finite_renormalization_conditions_not_replayed_against_minkowski_and_scale_mu",
    "H1_H2_conservation_and_gauss_bonnet_reduction_not_replayed",
    "prescription_DF_equivalence_not_replayed",
    "counterterm_implementation_binding_absent",
    "candidate_execution_not_observed",
    "independent_implementation_agreement_absent",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    derivationPacketAuthority: false as const,
    coefficientAuthority: false as const,
    finiteFreedomAuthority: false as const,
    formulaExecutionAuthority: false as const,
    meanRsetOutputAuthority: false as const,
    constraintOperandAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    independentAgreementAuthority: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 2048,
    maximumStringUtf8Bytes: 32768,
    maximumAggregateUtf8Bytes: 524288,
  } as const);

const SOURCE = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const BVP = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1;
const SCIENCE_INPUT_INTERFACE =
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.find(
    ({ inputId }) =>
      inputId ===
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_INPUT_ID,
  );

if (SCIENCE_INPUT_INTERFACE == null) {
  throw new Error(
    "nhm2_spherical_v2_renormalization_counterterms_interface_missing",
  );
}

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY =
  Object.freeze([
    Object.freeze({
      from: "renormalization_prescription",
      to: "renormalization_counterterms",
      relation: "prescription_defines_counterterm_convention",
    }),
    Object.freeze({
      from: "finite_renormalization_freedom",
      to: "renormalization_counterterms",
      relation: "finite_freedom_selects_counterterm_coefficients",
    }),
  ] as const);

const C_LAMBDA_VALUE = -0.005440592307388723;

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_INPUT_ID,
  phase: "pre_execution_candidate_specific_science_bytes",
  authority:
    "canonical_counterterm_choice_only_no_source_or_execution_authority",
  maturity:
    "stage_2_candidate_specific_finite_counterterm_choice_derivation_blocked",
  materialization: {
    canonicalScienceBytesPresent: true,
    countertermChoiceFrozen: true,
    frozenBeforeCandidateExecution: true,
    primarySourceBytePacketBinding: null,
    derivationPacketBinding: null,
    derivationReceipt: null,
    coefficientReplayReceipt: null,
    implementationBinding: null,
    executionReceipt: null,
    independentAgreementReceipt: null,
    sourcePinsComplete: false,
    derivationComplete: false,
    implementationComplete: false,
    executionObserved: false,
  },
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    candidateManifestId: FREEZE.candidateIdentity.candidateManifestId,
    selectedProfileId: FREEZE.candidateIdentity.selectedProfileId,
    geometryId: FREEZE.candidateIdentity.geometryId,
    quantumStateId: FREEZE.candidateIdentity.quantumStateId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  approvedInputInterface: {
    inputId: SCIENCE_INPUT_INTERFACE.inputId,
    artifactId: SCIENCE_INPUT_INTERFACE.artifactId,
    contractVersion: SCIENCE_INPUT_INTERFACE.contractVersion,
  },
  exactUpstreamPins: {
    sourceCandidatePlan: {
      artifactId: SOURCE.artifactId,
      contractVersion: SOURCE.contractVersion,
      candidateId: SOURCE.candidateIdentity.candidateId,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.sourceCandidatePlanSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.sourceCandidatePlanCanonicalSizeBytes,
      role: "finite_renormalization_conditions_and_complex_scalar_normalization",
    },
    v2CandidateFreeze: {
      artifactId: FREEZE.artifactId,
      contractVersion: FREEZE.contractVersion,
      candidateId: FREEZE.candidateIdentity.candidateId,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.v2CandidateFreezeSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.v2CandidateFreezeCanonicalSizeBytes,
      role: "sole_v2_candidate_geometry_state_chart_normalization_identity",
    },
    branchBvp: {
      artifactId: BVP.artifactId,
      contractVersion: BVP.contractVersion,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.branchBvpSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.branchBvpCanonicalSizeBytes,
      role: "frozen_mass_field_and_curved_geometry_semantics",
    },
    renormalizationPrescription: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION,
      inputId:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
      binding:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.renormalizationPrescriptionSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.renormalizationPrescriptionCanonicalSizeBytes,
      role: "one_way_exact_prescription_dependency",
    },
    scienceDerivationDag: {
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.scienceDerivationDagSha256,
      role: "historical_base_dag_identity_not_derivation_evidence",
    },
  },
  dependencyDirection: {
    countertermsImportAndExactBindPrescription: true,
    prescriptionImportsOrBindsCounterterms: false,
    reverseDependencyAllowed: false,
    dependencyCycleAllowed: false,
  },
  additiveDerivationDagOverlay: {
    baseDagSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS.scienceDerivationDagSha256,
    baseDagMutated: false,
    overlayOnly: true,
    edges:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY,
    edgeCount: 2,
    overlayGrantsDerivationOrExecutionAuthority: false,
    futureClosureArtifactMustBindBaseDagAndOverlayBytes: true,
  },
  finiteRenormalizationConditions: {
    copiedFromFrozenCandidatePlan: true,
    conditionsInOrder: SOURCE.renormalization.finiteAmbiguityConditions,
    hadamardLength: SOURCE.renormalization.hadamardLength,
    producerSelectedFiniteCountertermsAllowed: false,
    referenceScale: "mu",
    zeroCoefficientsMeanChosenSchemeNotAbsenceOfWaldAmbiguity: true,
  },
  finiteBasis: {
    orderedBasisNames: ["mu4_g", "mu2_G", "H1", "H2"],
    entries: [
      {
        ordinal: 0,
        name: "mu4_g",
        tensorFormula: "mu^4*g_ab",
        coefficientSymbol: "cLambda",
      },
      {
        ordinal: 1,
        name: "mu2_G",
        tensorFormula: "mu^2*G_ab",
        coefficientSymbol: "cG",
      },
      {
        ordinal: 2,
        name: "H1",
        tensorFormula:
          "H1_ab=2*nabla_a*nabla_b(R)-2*R*R_ab+g_ab*(-2*Box(R)+R^2/2)",
        coefficientSymbol: "c1",
      },
      {
        ordinal: 3,
        name: "H2",
        tensorFormula:
          "H2_ab=nabla_a*nabla_b(R)-Box(R_ab)-2*R^cd*R_cadb+g_ab*(-Box(R)/2+R_cd*R^cd/2)",
        coefficientSymbol: "c2",
      },
    ],
    eliminatedTensor: "H3",
    gaussBonnetIdentity: "H1_ab-4*H2_ab+H3_ab=0",
    unnamedOrProducerSelectedBasisTermsAllowed: false,
  },
  frozenCoefficients: {
    cLambda: {
      exactExpression: "2*(2*gamma_E-ln(2)-7/4)/(3*(4*pi)^2)",
      f64Value: C_LAMBDA_VALUE,
      f64HexBigEndian: "0xbf7648dfe07f66a4",
      complexMultiplicityFactor: 2,
      complexMultiplicityAlreadyAbsorbedExactlyOnce: true,
      furtherFactorTwoAllowed: false,
    },
    cG: { exactExpression: "0", f64Value: 0 },
    c1: { exactExpression: "0", f64Value: 0 },
    c2: { exactExpression: "0", f64Value: 0 },
    coefficientOrder: ["cLambda", "cG", "c1", "c2"],
    coefficientDerivationPacketBinding: null,
    coefficientReplayReceipt: null,
    independentlyVerified: false,
  },
  selectedLocalTensor: {
    symbol: "Theta_ab",
    exactFormula: "Theta_ab=cLambda*mu^4*g_ab+cG*mu^2*G_ab+c1*H1_ab+c2*H2_ab",
    substitutedFormula:
      "Theta_ab=[2*(2*gamma_E-ln(2)-7/4)/(3*(4*pi)^2)]*mu^4*g_ab",
    finiteBasisOrder: ["mu4_g", "mu2_G", "H1", "H2"],
    multiplicityAlreadyAbsorbedExactlyOnce: true,
    derivationExecuted: false,
  },
  prescriptionCompatibility: {
    selectedMeanRoute: "improved_moretti_eta_one_third",
    meanFormula: "<T_ab>_ren=[D^(1/3)_ab*K_C]+Theta_ab",
    exclusiveAlternativeMeanFormula:
      "<T_ab>_ren=[D^(0)_ab*K_C]+(1/(2*pi^2))*g_ab*v1+Theta_ab",
    explicitV1AddedToImprovedRoute: false,
    bothRoutesAccumulated: false,
    exactOneRoutePerEvaluationRequired: true,
  },
  connectedNoiseBoundary: {
    centeredOperator: "t_ab=T_ab_ren-omega(T_ab_ren)*1",
    deterministicShift: "T_ab_ren_to_T_ab_ren+Theta_ab*1",
    centeredShiftIdentity:
      "(T_ab_ren+Theta_ab*1)-omega(T_ab_ren+Theta_ab*1)*1=t_ab",
    cNumberCountertermsCancelExactlyAfterCentering: true,
    countertermArraysInjectedIntoNumericalNoiseKernel: false,
    countertermContributionAddedToConnectedNoiseOutput: false,
    stateDependentConnectedTermsMayBeDropped: false,
    cancellationDerivationPacketBinding: null,
    cancellationReplayReceipt: null,
  },
  futureDerivationPacketRequirements: {
    exactPrimarySourceByteEntriesRequired: true,
    eachSourceEntryRequiresPathMediaTypeSizeAndSha256: true,
    requiredDerivationsInOrder: [
      "finite_local_covariant_tensor_basis_for_massive_minimal_scalar",
      "H1_and_H2_inverse_metric_variations",
      "four_dimensional_gauss_bonnet_reduction",
      "Minkowski_vacuum_zero_condition_at_ell_equals_mu_inverse",
      "registered_G_and_zero_curvature_squared_coefficients_at_scale_mu",
      "cLambda_exact_expression_with_complex_multiplicity_once",
      "cLambda_binary64_round_to_0xbf7648dfe07f66a4",
      "improved_moretti_DF_route_equivalence_without_double_count",
      "connected_noise_c_number_counterterm_cancellation",
    ],
    everyFormulaRequiresSourceAnchorAndTranscriptionHash: true,
    symbolicDerivationTranscriptRequired: true,
    exactBinary64ConversionTranscriptRequired: true,
    serverRecomputeFromPacketBytesRequired: true,
    independentDerivationAgreementRequired: true,
    primarySourceByteEntries: null,
    derivationEntries: null,
    serverReplayReceipt: null,
    independentAgreementReceipt: null,
    complete: false,
  },
  executionBoundary: {
    thisArtifactIsExecutable: false,
    sourceAuthorityPresent: false,
    derivationAuthorityPresent: false,
    coefficientAuthorityPresent: false,
    implementationPresent: false,
    scientificPresealComplete: false,
    executionAuthorized: false,
    executionObserved: false,
    outputProduced: false,
    replayPerformed: false,
    independentAgreementEstablished: false,
    lampPromotionAllowed: false,
    physicalClaimUnlockAllowed: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2RenormalizationCountertermsV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS);
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-renormalization-counterterms/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_EXPECTED_SHA256 =
  "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_EXPECTED_CANONICAL_SIZE_BYTES =
  10182 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_LITERAL_SEAL_STATUS =
  "sealed_before_v2_candidate_execution" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CONTRACT_VERSION,
    inputId: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { nodes: number; utf8Bytes: number };

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value === "string") {
    const size = Buffer.byteLength(value, "utf8");
    if (size > limits.maximumStringUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += size;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (isProxy(value)) {
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cycle_forbidden:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > limits.maximumArrayLength
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.some((key) => typeof key !== "string") ||
      keys.length !== length + 1
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length > limits.maximumObjectPropertyCount
  ) {
    return Object.freeze({
      ok: false,
      violation: `object_surface:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keySize = Buffer.byteLength(key, "utf8");
    if (keySize > limits.maximumPropertyKeyUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `property_key_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += keySize;
    if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
      });
    }
    if (FORBIDDEN_KEYS.has(key)) {
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_entry_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

const f64HexBigEndian = (value: number): string => {
  const bytes = Buffer.allocUnsafe(8);
  bytes.writeDoubleBE(value, 0);
  return `0x${bytes.toString("hex")}`;
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS;
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.sourceCandidatePlanSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.sourceCandidatePlanCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.v2CandidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.v2CandidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256 !== pins.branchBvpSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES !==
      pins.branchBvpCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256 !==
      pins.renormalizationPrescriptionSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES !==
      pins.renormalizationPrescriptionCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      pins.scienceDerivationDagSha256
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_counterterms_dependency_pin_drift",
    );
  }
  if (
    SCIENCE_INPUT_INTERFACE.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_ARTIFACT_ID ||
    SCIENCE_INPUT_INTERFACE.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CONTRACT_VERSION ||
    !NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS.includes(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_INPUT_ID,
    ) ||
    contract.candidateIdentity.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    contract.dependencyDirection.countertermsImportAndExactBindPrescription !==
      true ||
    contract.dependencyDirection.prescriptionImportsOrBindsCounterterms !==
      false
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_counterterms_science_invariant",
    );
  }
  const baseHasOverlayEdge =
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY.some(
      (overlay) =>
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.some(
          (base) => base.from === overlay.from && base.to === overlay.to,
        ),
    );
  if (
    baseHasOverlayEdge ||
    contract.additiveDerivationDagOverlay.baseDagMutated !== false ||
    contract.additiveDerivationDagOverlay.overlayOnly !== true ||
    contract.additiveDerivationDagOverlay.edgeCount !== 2 ||
    contract.additiveDerivationDagOverlay
      .overlayGrantsDerivationOrExecutionAuthority !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_counterterms_dag_overlay_invariant",
    );
  }
  if (
    contract.finiteBasis.orderedBasisNames.join("|") !== "mu4_g|mu2_G|H1|H2" ||
    contract.finiteBasis.gaussBonnetIdentity !== "H1_ab-4*H2_ab+H3_ab=0" ||
    contract.frozenCoefficients.cLambda.f64Value !== C_LAMBDA_VALUE ||
    f64HexBigEndian(contract.frozenCoefficients.cLambda.f64Value) !==
      "0xbf7648dfe07f66a4" ||
    contract.frozenCoefficients.cG.f64Value !== 0 ||
    contract.frozenCoefficients.c1.f64Value !== 0 ||
    contract.frozenCoefficients.c2.f64Value !== 0 ||
    contract.frozenCoefficients.cLambda
      .complexMultiplicityAlreadyAbsorbedExactlyOnce !== true ||
    contract.frozenCoefficients.cLambda.furtherFactorTwoAllowed !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_counterterms_coefficient_invariant",
    );
  }
  if (
    contract.connectedNoiseBoundary
      .cNumberCountertermsCancelExactlyAfterCentering !== true ||
    contract.connectedNoiseBoundary
      .countertermArraysInjectedIntoNumericalNoiseKernel !== false ||
    contract.connectedNoiseBoundary
      .countertermContributionAddedToConnectedNoiseOutput !== false ||
    contract.futureDerivationPacketRequirements.complete !== false ||
    Object.values(contract.executionBoundary).some(
      (value) => value !== false,
    ) ||
    Object.values(contract.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_counterterms_authority_invariant",
    );
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_renormalization_counterterms_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES}`,
  );
}

export const nhm2SphericalBosonStarV2RenormalizationCountertermsViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON
      ? []
      : ["spherical_v2_renormalization_counterterms_semantic_drift"];
  } catch {
    return ["spherical_v2_renormalization_counterterms_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2RenormalizationCountertermsV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2RenormalizationCountertermsV1 =>
  nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(value)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2RenormalizationCounterterms = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2RenormalizationCountertermsV1;
