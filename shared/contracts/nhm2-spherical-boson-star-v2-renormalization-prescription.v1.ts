import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID =
  "nhm2.semiclassical_v2.renormalization_prescription" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_renormalization_prescription/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID =
  "renormalization_prescription" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS =
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
    scienceDerivationDagSha256:
      "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BLOCKERS =
  Object.freeze([
    "primary_source_byte_packet_not_bound",
    "curvature_and_point_split_convention_derivation_packet_not_bound",
    "complex_as_two_real_normalization_derivation_not_replayed",
    "hadamard_transport_recurrence_implementation_absent",
    "n3_subtraction_implementation_absent",
    "moretti_eta_one_third_conservation_derivation_not_replayed",
    "decanini_folacci_equivalence_derivation_not_replayed",
    "coincidence_limit_implementation_absent",
    "directed_rounding_error_budget_absent",
    "renormalization_counterterms_binding_absent_by_one_way_design",
    "candidate_execution_not_observed",
    "independent_implementation_agreement_absent",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    derivationPacketAuthority: false as const,
    formulaExecutionAuthority: false as const,
    recurrenceAuthority: false as const,
    coincidenceLimitAuthority: false as const,
    meanRsetOutputAuthority: false as const,
    noiseKernelOutputAuthority: false as const,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_VALIDATOR_LIMITS =
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
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
  );

if (SCIENCE_INPUT_INTERFACE == null) {
  throw new Error(
    "nhm2_spherical_v2_renormalization_prescription_interface_missing",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
  phase: "pre_execution_candidate_specific_science_bytes",
  authority:
    "canonical_formula_convention_only_no_source_or_execution_authority",
  maturity:
    "stage_2_candidate_specific_renormalization_prescription_derivation_blocked",
  materialization: {
    canonicalScienceBytesPresent: true,
    mathematicalConventionFrozen: true,
    frozenBeforeCandidateExecution: true,
    primarySourceBytePacketBinding: null,
    derivationPacketBinding: null,
    derivationReceipt: null,
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
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.sourceCandidatePlanSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.sourceCandidatePlanCanonicalSizeBytes,
      role: "frozen_scientific_semantics_source_without_v3_authority_inheritance",
    },
    v2CandidateFreeze: {
      artifactId: FREEZE.artifactId,
      contractVersion: FREEZE.contractVersion,
      candidateId: FREEZE.candidateIdentity.candidateId,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.v2CandidateFreezeSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.v2CandidateFreezeCanonicalSizeBytes,
      role: "sole_v2_candidate_geometry_state_chart_normalization_identity",
    },
    branchBvp: {
      artifactId: BVP.artifactId,
      contractVersion: BVP.contractVersion,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.branchBvpSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.branchBvpCanonicalSizeBytes,
      role: "frozen_covariant_field_operator_and_boundary_value_semantics",
    },
    scienceDerivationDag: {
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS.scienceDerivationDagSha256,
      role: "historical_base_dag_identity_not_derivation_evidence",
    },
  },
  complexAsTwoRealNormalization: {
    complexFieldDefinition: "Phi=(phi1+i*phi2)/sqrt(2)",
    realFieldOrder: ["phi1", "phi2"],
    complexAction:
      "S_C=-integral_d4x_sqrt(-g)*(nabla_a(Phi^*)*nabla^a(Phi)+mu^2*Phi^*Phi)",
    reducedAction:
      "S_C=sum_(j=1)^2[-(1/2)*integral_d4x_sqrt(-g)*(nabla_a(phi_j)*nabla^a(phi_j)+mu^2*phi_j^2)]",
    canonicalRealScalarCount: 2,
    eachRealScalarCanonicalFactorOneHalf: true,
    fieldJacobianOrAdditionalMultiplicityAllowed: false,
    multiplicityMustBeAppliedExactlyOnce: true,
  },
  geometricAndOperatorConventions: {
    spacetimeDimension: 4,
    signature: "(-,+,+,+)",
    naturalUnits: "hbar=c=1",
    scalarMass: "mu>0",
    curvatureCouplingXi: { exact: "0", value: 0 },
    selfCouplingLambda: { exact: "0", value: 0 },
    dAlembertian: "Box=g^ab*nabla_a*nabla_b",
    kleinGordonOperator: "P=-Box+mu^2",
    fieldEquation: "P*phi_j=0_for_j_in_{1,2}",
    hadamardLength: { expression: "ell=mu^-1", exact: "1/mu" },
    curvatureAndParallelPropagatorConventionDerivationPacketRequired: true,
    curvatureAndParallelPropagatorConventionDerivationPacketBinding: null,
  },
  twoPointAndParametrixNormalization: {
    perRealSymmetricKernel:
      "S_j(x,y)=(1/2)*omega(phi_j(x)*phi_j(y)+phi_j(y)*phi_j(x))",
    totalComplexAsTwoRealKernel: "S_C(x,y)=S_1(x,y)+S_2(x,y)",
    perRealWightmanParametrix:
      "H^+_ell=lim_(epsilon_down_to_0)[1/(8*pi^2)]*[u/sigma_epsilon+sum_(n>=0)(v_n*sigma^n*log(sigma_epsilon/ell^2))]",
    perRealSymmetricParametrix: "H_S=Re(H^+_ell)",
    totalSmoothRemainder: "K_C=S_C-2*H_S",
    perRealParametrixMultiplicity: 2,
    smoothW0AddedToParametrix: false,
    noSmoothW0Rule:
      "no_smooth_w0_is_admitted_into_H_plus_H_S_or_the_subtraction_kernel",
    relativeFactorAmbiguous: false,
    allBidifferentialOperatorsActBeforeCovariantCoincidence: true,
  },
  hadamardTransportRecurrences: {
    recurrenceDomain: "geodesically_convex_neighborhood",
    uTransport: "2*u_;alpha*sigma^;alpha+(Box(sigma)-4)*u=0_with_[u]=1",
    v0Transport: "-P(u)+2*v0_;alpha*sigma^;alpha+(Box(sigma)-2)*v0=0",
    vnTransport:
      "-P(v_n)+2*(n+1)*v_(n+1);alpha*sigma^;alpha+((n+1)*Box(sigma)+2*n*(n+1))*v_(n+1)=0_for_n>=0",
    formulasFrozen: true,
    sourceDerivationPacketBinding: null,
    executableRecurrenceImplementation: null,
    recurrenceExecuted: false,
  },
  symmetricPointSplitOperator: {
    basePoint: "z",
    splitPointsInOrder: ["x", "y"],
    parallelPropagatorDirection:
      "I_a^{a'}(z,x)_and_I_a^{a'}(z,y)_carry_split_indices_to_z",
    familyFormula:
      "D^(eta)_ab(z;x,y)=(1/2)*(I_a^{a'}(z,x)*I_b^{b'}(z,y)*nabla^x_{a'}*nabla^y_{b'}+I_a^{a'}(z,y)*I_b^{b'}(z,x)*nabla^y_{a'}*nabla^x_{b'})-(1/2)*g_ab(z)*(g^{cd}(z)*I_c^{c'}(z,x)*I_d^{d'}(z,y)*nabla^x_{c'}*nabla^y_{d'}+mu^2)+(eta/2)*g_ab(z)*(P_x+P_y)",
    etaDimensionRule: "eta_D=D/(2*(D+2))",
    etaNumerator: 1,
    etaDenominator: 3,
    selectedOperator: "D^(1/3)_ab",
    derivativesActBeforeCovariantCoincidence: true,
    coincidenceNotation:
      "square_brackets_mean_x_and_y_to_z_covariant_coincidence_after_all_derivatives",
    conservationRestoringRouteSelected: true,
    conservationRuntimeVerified: false,
  },
  frozenPrescriptionRoutes: {
    selectedImprovedMoretti: {
      routeId: "improved_moretti_eta_one_third",
      formula: "<T_ab>_ren=[D^(1/3)_ab*K_C]+Theta_ab",
      eta: { exact: "1/3", numerator: 1, denominator: 3 },
      totalComplexMultiplicityAlreadyInKc: true,
      explicitV1TermAdded: false,
    },
    exclusiveDecaniniFolacciAlternative: {
      routeId: "decanini_folacci_canonical_plus_explicit_v1",
      canonicalOperator: "D^(0)_ab",
      v1: "v1=mu^4/8-mu^2*R/24+Box(R)/120+R^2/288-R_cd*R^cd/720+R_cdef*R^cdef/720",
      formula: "<T_ab>_ren=[D^(0)_ab*K_C]+(1/(2*pi^2))*g_ab*v1+Theta_ab",
      explicitV1CoefficientIsTotalComplex: true,
      formulaEquivalenceDerivationPacketBinding: null,
      formulaEquivalenceReplayed: false,
    },
    exactOneRoutePerEvaluationRequired: true,
    cumulativeUseOfBothRoutesAllowed: false,
    explicitV1MayBeAddedToImprovedOperator: false,
    alternativeIsEquivalenceCrosscheckNotAdditionalTerm: true,
  },
  subtractionDuty: {
    regulatorSymbol: "Z_lambda,3",
    subtractionOrderSymbol: "n=3",
    subtractionOrder: 3,
    duty: "freeze_Z_lambda,3_and_subtract_through_Hadamard_order_n=3_before_execution",
    regulatorScaleSequenceDefinedHere: false,
    algorithmDefinedHere: false,
    implementationBinding: null,
    truncationReceipt: null,
    executed: false,
  },
  finiteCountertermInterface: {
    countertermInputId: "renormalization_counterterms",
    countertermArtifactId: "nhm2.semiclassical_v2.renormalization_counterterms",
    dependencyDirection:
      "renormalization_counterterms_exact_binds_this_prescription_never_the_reverse",
    countertermBinding: null,
    reverseImportOrBindingAllowed: false,
    thetaSymbol: "Theta_ab",
    thetaFormulaDefinedByCountertermsContractOnly: true,
  },
  connectedNoiseBoundary: {
    centeredOperator: "t_ab=T_ab_ren-omega(T_ab_ren)*1",
    connectedSymmetrizedNoise:
      "N_abcd(x,y)=(1/2)*omega(t_ab(x)*t_cd(y)+t_cd(y)*t_ab(x))",
    localCountertermsAreCNumberTensorShifts: true,
    cNumberCountertermsCancelExactlyAfterCentering: true,
    cNumberCountertermsInjectedIntoNumericalNoiseKernel: false,
    onlyCNumberCountertermsMayBeRemovedByThisRule: true,
    stateDependentConnectedTermsMayBeDropped: false,
    noiseImplementationBinding: null,
    noiseExecutionObserved: false,
  },
  futureDerivationPacketRequirements: {
    exactPrimarySourceByteEntriesRequired: true,
    eachSourceEntryRequiresPathMediaTypeSizeAndSha256: true,
    requiredDerivationsInOrder: [
      "complex_action_to_two_canonical_real_actions",
      "per_real_parametrix_and_K_C_multiplicity",
      "u_v0_vn_transport_recurrences",
      "symmetric_D_eta_operator_with_parallel_propagators",
      "eta_4_one_third_conservation_identity",
      "massive_minimal_v1_coincidence_coefficient",
      "improved_moretti_DF_route_equivalence_and_no_double_count",
      "Z_lambda_3_n3_subtraction_remainder_bound",
      "connected_noise_c_number_cancellation",
    ],
    curvatureConventionCrosswalkRequired: true,
    everyFormulaRequiresSourceAnchorAndTranscriptionHash: true,
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
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2RenormalizationPrescriptionV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION);
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-renormalization-prescription/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_EXPECTED_SHA256 =
  "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_EXPECTED_CANONICAL_SIZE_BYTES =
  10670 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_LITERAL_SEAL_STATUS =
  "sealed_before_v2_candidate_execution" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION,
    inputId: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
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
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_VALIDATOR_LIMITS;
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

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS;
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
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
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      pins.scienceDerivationDagSha256
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_prescription_dependency_pin_drift",
    );
  }
  if (
    SCIENCE_INPUT_INTERFACE.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_ARTIFACT_ID ||
    SCIENCE_INPUT_INTERFACE.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CONTRACT_VERSION ||
    !NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS.includes(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_INPUT_ID,
    ) ||
    contract.candidateIdentity.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    contract.complexAsTwoRealNormalization.canonicalRealScalarCount !== 2 ||
    contract.twoPointAndParametrixNormalization.totalSmoothRemainder !==
      "K_C=S_C-2*H_S" ||
    contract.twoPointAndParametrixNormalization.smoothW0AddedToParametrix !==
      false
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_prescription_science_invariant",
    );
  }
  if (
    contract.symmetricPointSplitOperator.etaNumerator !== 1 ||
    contract.symmetricPointSplitOperator.etaDenominator !== 3 ||
    contract.geometricAndOperatorConventions.kleinGordonOperator !==
      "P=-Box+mu^2" ||
    contract.frozenPrescriptionRoutes.selectedImprovedMoretti.formula !==
      "<T_ab>_ren=[D^(1/3)_ab*K_C]+Theta_ab" ||
    contract.frozenPrescriptionRoutes.exclusiveDecaniniFolacciAlternative
      .formula !== "<T_ab>_ren=[D^(0)_ab*K_C]+(1/(2*pi^2))*g_ab*v1+Theta_ab" ||
    contract.frozenPrescriptionRoutes.exactOneRoutePerEvaluationRequired !==
      true ||
    contract.frozenPrescriptionRoutes.cumulativeUseOfBothRoutesAllowed !==
      false ||
    contract.frozenPrescriptionRoutes.explicitV1MayBeAddedToImprovedOperator !==
      false ||
    contract.subtractionDuty.regulatorSymbol !== "Z_lambda,3" ||
    contract.subtractionDuty.subtractionOrder !== 3
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_prescription_route_invariant",
    );
  }
  if (
    contract.connectedNoiseBoundary
      .cNumberCountertermsInjectedIntoNumericalNoiseKernel !== false ||
    contract.connectedNoiseBoundary
      .cNumberCountertermsCancelExactlyAfterCentering !== true ||
    contract.finiteCountertermInterface.countertermBinding !== null ||
    contract.finiteCountertermInterface.reverseImportOrBindingAllowed !==
      false ||
    contract.futureDerivationPacketRequirements.complete !== false ||
    Object.values(contract.executionBoundary).some(
      (value) => value !== false,
    ) ||
    Object.values(contract.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_v2_renormalization_prescription_authority_invariant",
    );
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_renormalization_prescription_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES}`,
  );
}

export const nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON
      ? []
      : ["spherical_v2_renormalization_prescription_semantic_drift"];
  } catch {
    return ["spherical_v2_renormalization_prescription_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2RenormalizationPrescriptionV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2RenormalizationPrescriptionV1 =>
  nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(value)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2RenormalizationPrescription = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2RenormalizationPrescriptionV1;
