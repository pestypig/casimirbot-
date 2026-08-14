import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256_DOMAIN,
} from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
} from "./nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_pair_agreement_and_lamp_gate_contract" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_pair_agreement_and_lamp_gate_contract/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_PHASE =
  "stage_2_preexecution_pair_agreement_successor_contract" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-pair-agreement-and-lamp-gate-contract/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256 =
  "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES =
  163_818 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT = 68 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT =
  30 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 1_048_576,
    maximumWireUtf8Bytes: 1_048_576,
    maximumDepth: 24,
    maximumNodes: 16_384,
    maximumArrayLength: 256,
    maximumObjectPropertyCount: 128,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 16_384,
    maximumAggregateUtf8Bytes: 1_048_576,
  } as const);

const RAW_SCHEMA_LITERAL_BINDING = Object.freeze({
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CONTRACT_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.candidateIdentity
      .candidateId,
  sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256_DOMAIN,
  sha256: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES,
  mediaType: "application/json" as const,
});

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_BINDINGS =
  Object.freeze(
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.map(
      (entry) =>
        Object.freeze({
          ordinal: entry.fileOrdinal,
          role: entry.role,
          path: entry.path,
          expectedSizeBytes: entry.sizeBytes,
          hashAlgorithm: "sha256" as const,
          primaryHashSource:
            "server_rehashed_primary_successor_manifest_physical_file_entry" as const,
          independentHashSource:
            "server_rehashed_independent_successor_manifest_physical_file_entry" as const,
          comparator: "identical_sha256_and_size" as const,
          requiredStatus: "pass" as const,
        }),
    ),
  );

type PairCheckOutcomeRole = Readonly<{
  ordinal: number;
  checkId: string;
  scopeId: string;
  appliedToleranceIds: readonly string[];
}>;

export type Nhm2SphericalBosonStarV2PairNormalizedToleranceResultV1 = Readonly<{
  toleranceId: string;
  comparisonRelation: string;
  satisfied: boolean;
}>;

export type Nhm2SphericalBosonStarV2PairNormalizedOutcomeV1 = Readonly<{
  ordinal: number;
  checkId: string;
  scopeId: string;
  disposition: "pass" | "fail" | "blocked";
  appliedToleranceIds: readonly string[];
  appliedToleranceResults: readonly Nhm2SphericalBosonStarV2PairNormalizedToleranceResultV1[];
  orderedIssueCodes: readonly string[];
}>;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID =
  Object.freeze({
    minimumMetricDemandFrobeniusSI:
      "observed_lower_bound_strictly_greater_than_frozen_minimum",
    requiredMetricDemandSampleFraction:
      "observed_fraction_greater_than_or_equal_to_frozen_minimum",
    meanMetricDemandPointwiseRelativeUpper95:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    meanNormalizationFloorSI: "frozen_floor_applied_to_denominator",
    metricDemandRelativeErrorBound:
      "observed_relative_error_less_than_or_equal_to_frozen_maximum",
    smearingWeightSumAbsolute:
      "absolute_sum_minus_one_less_than_or_equal_to_frozen_maximum",
    exchangeSymmetryUpper95SI:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    psdNegativeEigenvalueSI:
      "minimum_eigenvalue_greater_than_or_equal_to_negative_frozen_tolerance",
    fluctuationToMeanRatioUpper95:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    bracketResidualUpper95:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    antisymmetryResidualUpper95:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    jacobiResidualUpper95:
      "observed_upper95_less_than_or_equal_to_frozen_maximum",
    float64RecomputeAbsolute:
      "every_absolute_recompute_difference_less_than_or_equal_to_frozen_maximum",
    regulatorResidualUpper95:
      "final_residual_upper95_less_than_or_equal_to_frozen_maximum",
    finalRegulatorErrorUpper95Tolerance:
      "final_regulator_error_upper95_less_than_or_equal_to_frozen_maximum",
    regulatorMonotonicityAbsolute:
      "D12Upper_less_than_or_equal_to_D01Lower_plus_frozen_tolerance",
    minimumRegulatorConvergenceOrder:
      "observed_lower_order_greater_than_or_equal_to_frozen_minimum",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID =
  Object.freeze(
    Object.fromEntries(
      Object.keys(
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID,
      ).map((toleranceId) => [
        toleranceId,
        `tolerance_not_satisfied:${toleranceId}`,
      ]),
    ) as Readonly<Record<string, string>>,
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES =
  Object.freeze({
    blocked: "outcome_not_recomputed",
    finiteness: "finiteness_not_satisfied",
    smearingWeightFreeze: "smearing_weight_freeze_not_satisfied",
    maximumEigenvalueUpper95: "maximum_eigenvalue_upper95_not_finite",
  } as const);

const outcomeRole = (
  ordinal: number,
  checkId: string,
  scopeId: string,
  appliedToleranceIds: readonly string[],
): PairCheckOutcomeRole =>
  Object.freeze({
    ordinal,
    checkId,
    scopeId,
    appliedToleranceIds: Object.freeze([...appliedToleranceIds]),
  });

const TOP_LEVEL_OUTCOME_ROLES = [
  outcomeRole(0, "finiteness", "all_raw_and_auxiliary_values", []),
  outcomeRole(1, "metricDemandNondegeneracy", "all_64_samples", [
    "minimumMetricDemandFrobeniusSI",
    "requiredMetricDemandSampleFraction",
  ]),
  outcomeRole(2, "meanMetricDemandClosure", "all_64_samples", [
    "meanMetricDemandPointwiseRelativeUpper95",
    "meanNormalizationFloorSI",
  ]),
  outcomeRole(3, "metricDemandErrorEnclosure", "all_64_samples", [
    "metricDemandRelativeErrorBound",
  ]),
  outcomeRole(4, "smearingWeightFreeze", "raw_file_ordinal_4", []),
  outcomeRole(5, "smearingNormalization", "all_64_weights", [
    "smearingWeightSumAbsolute",
  ]),
  outcomeRole(6, "exchangeSymmetry", "full_bilocal_tensor", [
    "exchangeSymmetryUpper95SI",
  ]),
  outcomeRole(7, "psd", "weighted_640_by_640_covariance", [
    "psdNegativeEigenvalueSI",
  ]),
  outcomeRole(
    8,
    "maximumEigenvalueUpper95",
    "weighted_640_by_640_covariance",
    [],
  ),
  outcomeRole(9, "fluctuationRatio", "smeared_symmetric_tensor", [
    "fluctuationToMeanRatioUpper95",
    "meanNormalizationFloorSI",
  ]),
] as const;

const CONSTRAINT_OUTCOME_ROLES =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation.residualMappings.map(
    (mapping, index) => {
      const checkId =
        mapping.familyId === "antisymmetry"
          ? "antisymmetry"
          : mapping.familyId === "jacobi"
            ? "jacobi"
            : "bracketResidual";
      const residualTolerance =
        mapping.familyId === "antisymmetry"
          ? "antisymmetryResidualUpper95"
          : mapping.familyId === "jacobi"
            ? "jacobiResidualUpper95"
            : "bracketResidualUpper95";
      return outcomeRole(
        10 + index,
        checkId,
        mapping.mappingId,
        mapping.levelOrdinal === 2
          ? [residualTolerance, "float64RecomputeAbsolute"]
          : ["float64RecomputeAbsolute"],
      );
    },
  );

const REGULATOR_OUTCOME_ROLES =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation.convergenceMappings.map(
    (mapping, index) =>
      outcomeRole(25 + index, "regulatorConvergence", mapping.familyId, [
        "regulatorResidualUpper95",
        "finalRegulatorErrorUpper95Tolerance",
        "regulatorMonotonicityAbsolute",
        "minimumRegulatorConvergenceOrder",
      ]),
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES =
  Object.freeze([
    ...TOP_LEVEL_OUTCOME_ROLES,
    ...CONSTRAINT_OUTCOME_ROLES,
    ...REGULATOR_OUTCOME_ROLES,
  ]);

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_AUTHORITY_LOCKS =
  Object.freeze({
    scientificInputClosureComplete: false as const,
    executionAuthorized: false as const,
    primaryExecutionObserved: false as const,
    primaryExecutionInstance: null,
    independentExecutionObserved: false as const,
    independentExecutionInstance: null,
    primaryReplayPerformed: false as const,
    primaryReplayReceipt: null,
    independentReplayPerformed: false as const,
    independentReplayReceipt: null,
    allRawHashesAgreed: false as const,
    allCheckAndToleranceOutcomesAgreed: false as const,
    independentAgreement: false as const,
    independentAgreementReceipt: null,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_ARTIFACT_ID,
  contractVersion: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_PHASE,
  authority:
    "canonical_successor_contract_only_no_execution_replay_agreement_or_lamp_state_authority",
  maturity:
    "stage_2_preexecution_pair_agreement_plan_no_runtime_or_numeric_evidence",
  candidateIdentity:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.candidateIdentity,
  exactRawReplaySchemaBinding: RAW_SCHEMA_LITERAL_BINDING,
  exactSmearingWeightFreezeBinding:
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  additiveSuccessor: {
    relation: "additive_successor_without_legacy_pair_contract_mutation",
    legacyPairContract: {
      artifactId: "nhm2.semiclassical_v2_pair_agreement",
      contractVersion: "nhm2_semiclassical_v2_pair_agreement/v2",
      legacyArrayRoleCount: 32,
      sourceMutated: false,
      acceptedAsThis68RoleSuccessor: false,
      incompatibility:
        "legacy_pair_contract_compares_32_aggregate_roles_not_68_unique_spherical_v2_physical_roles",
    },
    thisContractGrantsExecutionAdmission: false,
    thisContractGrantsReplayOrAgreementEvidence: false,
  },
  readinessBoundary: {
    rawSchemaScientificInputClosureComplete:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.scienceInputCompleteness
        .staticScientificInputClosureComplete,
    rawSchemaExecutionMayBeAdmitted:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.scienceInputCompleteness
        .executionMayBeAdmitted,
    rawSchemaRecomputationImplementationPresent:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .recomputationImplementationPresent,
    rawSchemaRecomputationReceipt:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .recomputationReceipt,
    exactSchemaBindingDoesNotClearReadinessBlockers: true,
    executionInstancesMustRemainNullUntilSeparatelyAuthorizedAndObserved: true,
  },
  laneIsolationPolicy: {
    exactLaneOrder: Object.freeze(["primary", "independent"] as const),
    sameFrozenScientificInputBytesAndClosureSha256Required: true,
    sourceDependencyLockExecutableAndOutputRootsMustDiffer: true,
    separateReadOnlyImplementationRootsRequired: true,
    separateOutputRootsRequired: true,
    counterpartOutputMounted: false,
    ambientRepositoryMounted: false,
    crossLaneResultReadBeforeBothReplayReceiptsPersistedAllowed: false,
    copyingCounterpartDerivedOutcomesAllowed: false,
    bothLanesMustIndependentlyDecodeAndRecomputeFromPersistedRawBytes: true,
  },
  rawHashAgreementPolicy: {
    ordering: "raw_schema_file_ordinal_0_to_67",
    exactRoleCount: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT,
    roles: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_BINDINGS,
    bothSuccessorManifestsMustBindExactRawSchema: true,
    serverMustRehashEveryPhysicalFileInEachLaneBeforeComparison: true,
    producerReportedHashAcceptedWithoutServerRehash: false,
    comparator: "identical_sha256_and_size_for_every_role",
    allRolesMustPass: true,
    aggregateHashEqualityMayReplacePerRoleEquality: false,
    candidateFrozenContent: Object.freeze({
      fileOrdinal: 4,
      role: "smearing_weights",
      exactRawSha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
      exactRawSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
      bothLanesMustCheckExactHashBeforeFloatDecode: true,
      decodedBitCheckAndNormalizationRemainDefenseInDepth: true,
      pairMustCompareBothLaneHashesToThisValueNotOnlyToEachOther: true,
    }),
  },
  checkAndToleranceOutcomeAgreementPolicy: {
    ordering:
      "frozen_check_then_level_family_scope_order_from_exact_raw_schema",
    exactOutcomeCount: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
    outcomeRoles: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES,
    normalizedOutcomeExactFields: Object.freeze([
      "ordinal",
      "checkId",
      "scopeId",
      "disposition",
      "appliedToleranceIds",
      "appliedToleranceResults",
      "orderedIssueCodes",
    ] as const),
    laneProjectionReceiptFieldByRole: Object.freeze({
      primary: "normalizedOutcomeProjection" as const,
      independent: "normalized_outcome_projection" as const,
    }),
    comparisonRelationByToleranceId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID,
    canonicalIssueCodeByToleranceId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID,
    canonicalOutcomeIssueCodes:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES,
    normalizedProjectionPolicy: Object.freeze({
      exactLength: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
      everyOutcomeAlwaysPresent: true,
      unreachedOutcomeDisposition: "blocked" as const,
      unreachedOutcomeOrderedIssueCodes: Object.freeze([
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES.blocked,
      ] as const),
      appliedToleranceResultsExactlyFollowAppliedToleranceIds: true,
      falseToleranceResultsDoNotByThemselvesDistinguishFailFromBlocked: true,
      anyObservedFailDominatesAnyLaterBlockedOutcomeForCandidateDisposition: true,
      laterBlockedOutcomeMayEraseEarlierObservedFail: false,
      laneNativeIssueNamesAcceptedWithoutCanonicalMapping: false,
    }),
    appliedToleranceResultExactFields: Object.freeze([
      "toleranceId",
      "comparisonRelation",
      "satisfied",
    ] as const),
    allowedDispositions: Object.freeze(["pass", "fail", "blocked"] as const),
    toleranceAuthority:
      "exact_raw_schema_bound_frozen_policy_and_constraint_arithmetic_only",
    eachLaneMustRecomputeEveryOutcomeIndependently: true,
    producerSuppliedDerivedOutcomeAcceptedAsAuthority: false,
    comparisonMethod:
      "canonical_exact_equality_of_schema_admitted_check_and_tolerance_outcome_projection",
    everyOutcomeMustBePresentFiniteOrderedAndEqual: true,
    bothReplayCalculationDispositionsMustBePassForPairPass: true,
    anyOutcomeMismatchDisposition:
      "fail_this_v2_candidate_without_retuning_or_relabeling",
  },
  pairPassRule: {
    prerequisitesInOrder: Object.freeze([
      "primary_replay_receipt_schema_valid_and_calculation_pass",
      "independent_replay_receipt_schema_valid_and_calculation_pass",
      "all_68_server_rehashed_raw_role_sha256_and_size_comparisons_pass",
      "all_30_independently_recomputed_check_and_tolerance_outcomes_equal",
      "pair_agreement_receipt_schema_and_integrity_valid",
    ] as const),
    firstNonPassInFrozenOrderIsAuthoritative: true,
    mixedPrerequisiteDisposition: Object.freeze({
      earlierObservedFailThenLaterMissingInvalidOrBlocked:
        "fail_this_v2_candidate_without_retuning_or_relabeling",
      laterMissingInvalidOrBlockedMayOverwriteEarlierFail: false,
      retuningPermitted: false,
    }),
    everyPrerequisiteRequired: true,
    missingOrInvalidEvidenceDisposition: "blocked_without_candidate_result",
    observedMismatchOrFrozenLimitFailureDisposition:
      "fail_this_v2_candidate_without_retuning_or_relabeling",
    pairAgreementStatusOnSuccess: "pass",
  },
  diagnosticLampGate: {
    exactDiagnosticLampIds: Object.freeze([
      "semiclassicalStressNoiseLamp",
      "semiclassicalConstraintAlgebraLamp",
    ] as const),
    exactDiagnosticLampCount: 2,
    bothReplayPassesRequired: true,
    fullPairAgreementPassRequired: true,
    all68RawHashComparisonsRequired: true,
    all30CheckAndToleranceOutcomeComparisonsRequired: true,
    pairAgreementReceiptRequiredBeforeLampPromotion: true,
    thisContractSetsLampState: false,
    currentLampState: Object.freeze({
      semiclassicalStressNoiseLamp: false as const,
      semiclassicalConstraintAlgebraLamp: false as const,
    }),
    stressNoiseOutcomeOrdinals: Object.freeze(
      TOP_LEVEL_OUTCOME_ROLES.map((entry) => entry.ordinal),
    ),
    constraintAlgebraOutcomeOrdinals: Object.freeze([
      0,
      ...CONSTRAINT_OUTCOME_ROLES.map((entry) => entry.ordinal),
      ...REGULATOR_OUTCOME_ROLES.map((entry) => entry.ordinal),
    ]),
    lampPromotionGrantsTheoryGraphPromotion: false,
    lampPromotionGrantsPhysicalViability: false,
    lampPromotionGrantsPropulsionOrTransport: false,
  },
  instances: {
    primaryExecution: null,
    independentExecution: null,
    primaryReplayReceipt: null,
    independentReplayReceipt: null,
    pairAgreementReceipt: null,
    diagnosticLampPromotionReceipt: null,
  },
  frozenFailurePolicy: {
    candidateAndRawSchemaFrozenBeforeAnyFutureExecution: true,
    postObservationToleranceChangeAllowed: false,
    postObservationCheckOrOutcomeProjectionChangeAllowed: false,
    postObservationRawRoleInventoryChangeAllowed: false,
    mismatchMayBeDiscardedAndRerunAsSameCandidate: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning_or_relabeling",
    retuningPermitted: false,
  },
  authorityLocks: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor)
      deepFreeze(descriptor.value, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT = deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2PairAgreementV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_SHA256 =
  "9385daf2e311f28bd5a563ceb0f22e0a647cee568e8ae4baeeabe5bcd5b4d1f4" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_CANONICAL_SIZE_BYTES =
  45_302 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.candidateIdentity.candidateId,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_SIZE_BYTES,
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
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth)
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes)
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  if (value === null || typeof value === "boolean")
    return Object.freeze({ ok: true, value });
  if (typeof value === "string") {
    const size = Buffer.byteLength(value, "utf8");
    if (size > limits.maximumStringUtf8Bytes)
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    budget.utf8Bytes += size;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number")
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  if (typeof value !== "object")
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  if (isProxy(value))
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  if (ancestors.has(value))
    return Object.freeze({
      ok: false,
      violation: `cycle_forbidden:${pointer || "/"}`,
    });
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
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
      ancestors.delete(value);
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
      ancestors.delete(value);
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
        ancestors.delete(value);
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
    ancestors.delete(value);
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
    ancestors.delete(value);
    return Object.freeze({
      ok: false,
      violation: `object_surface:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keySize = Buffer.byteLength(key, "utf8");
    if (keySize > limits.maximumPropertyKeyUtf8Bytes) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `property_key_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += keySize;
    if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
      });
    }
    if (FORBIDDEN_KEYS.has(key)) {
      ancestors.delete(value);
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
      ancestors.delete(value);
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
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;
  const rawRoles = contract.rawHashAgreementPolicy.roles;
  const outcomes =
    contract.checkAndToleranceOutcomeAgreementPolicy.outcomeRoles;
  const outcomeKeys = outcomes.map(
    (entry) => `${entry.checkId}/${entry.scopeId}`,
  );
  const toleranceIds = [
    ...new Set(outcomes.flatMap((entry) => entry.appliedToleranceIds)),
  ].sort();
  const relationToleranceIds = Object.keys(
    contract.checkAndToleranceOutcomeAgreementPolicy
      .comparisonRelationByToleranceId,
  ).sort();
  const issueToleranceIds = Object.keys(
    contract.checkAndToleranceOutcomeAgreementPolicy
      .canonicalIssueCodeByToleranceId,
  ).sort();
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES ||
    JSON.stringify(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING) !==
      JSON.stringify(RAW_SCHEMA_LITERAL_BINDING) ||
    JSON.stringify(contract.exactSmearingWeightFreezeBinding) !==
      JSON.stringify(
        NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
      ) ||
    contract.rawHashAgreementPolicy.candidateFrozenContent.fileOrdinal !== 4 ||
    contract.rawHashAgreementPolicy.candidateFrozenContent.role !==
      "smearing_weights" ||
    contract.rawHashAgreementPolicy.candidateFrozenContent.exactRawSha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 ||
    contract.rawHashAgreementPolicy.candidateFrozenContent.exactRawSizeBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES ||
    contract.rawHashAgreementPolicy.candidateFrozenContent
      .bothLanesMustCheckExactHashBeforeFloatDecode !== true ||
    contract.rawHashAgreementPolicy.candidateFrozenContent
      .pairMustCompareBothLaneHashesToThisValueNotOnlyToEachOther !== true ||
    rawRoles.length !== NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT ||
    rawRoles.some(
      (entry, index) =>
        entry.ordinal !== index ||
        entry.ordinal !==
          NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
            index
          ]?.fileOrdinal ||
        entry.role !==
          NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
            index
          ]?.role ||
        entry.path !==
          NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
            index
          ]?.path ||
        entry.expectedSizeBytes !==
          NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
            index
          ]?.sizeBytes ||
        entry.comparator !== "identical_sha256_and_size" ||
        entry.requiredStatus !== "pass",
    ) ||
    new Set(rawRoles.map((entry) => entry.role)).size !== 68 ||
    new Set(rawRoles.map((entry) => entry.path)).size !== 68 ||
    outcomes.length !== NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT ||
    outcomes.some((entry, index) => entry.ordinal !== index) ||
    new Set(outcomeKeys).size !== outcomes.length ||
    JSON.stringify(toleranceIds) !== JSON.stringify(relationToleranceIds) ||
    JSON.stringify(toleranceIds) !== JSON.stringify(issueToleranceIds) ||
    toleranceIds.some(
      (toleranceId) =>
        contract.checkAndToleranceOutcomeAgreementPolicy
          .comparisonRelationByToleranceId[
          toleranceId as keyof typeof NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID
        ] == null ||
        contract.checkAndToleranceOutcomeAgreementPolicy
          .canonicalIssueCodeByToleranceId[toleranceId] !==
          `tolerance_not_satisfied:${toleranceId}`,
    ) ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy
        .normalizedOutcomeExactFields,
    ) !==
      JSON.stringify([
        "ordinal",
        "checkId",
        "scopeId",
        "disposition",
        "appliedToleranceIds",
        "appliedToleranceResults",
        "orderedIssueCodes",
      ]) ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy
        .laneProjectionReceiptFieldByRole,
    ) !==
      JSON.stringify({
        primary: "normalizedOutcomeProjection",
        independent: "normalized_outcome_projection",
      }) ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy
        .appliedToleranceResultExactFields,
    ) !== JSON.stringify(["toleranceId", "comparisonRelation", "satisfied"]) ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy.allowedDispositions,
    ) !== JSON.stringify(["pass", "fail", "blocked"]) ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy
        .canonicalOutcomeIssueCodes,
    ) !==
      JSON.stringify({
        blocked: "outcome_not_recomputed",
        finiteness: "finiteness_not_satisfied",
        smearingWeightFreeze: "smearing_weight_freeze_not_satisfied",
        maximumEigenvalueUpper95: "maximum_eigenvalue_upper95_not_finite",
      }) ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .exactLength !== 30 ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .everyOutcomeAlwaysPresent !== true ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .unreachedOutcomeDisposition !== "blocked" ||
    JSON.stringify(
      contract.checkAndToleranceOutcomeAgreementPolicy
        .normalizedProjectionPolicy.unreachedOutcomeOrderedIssueCodes,
    ) !== JSON.stringify(["outcome_not_recomputed"]) ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .appliedToleranceResultsExactlyFollowAppliedToleranceIds !== true ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .anyObservedFailDominatesAnyLaterBlockedOutcomeForCandidateDisposition !==
      true ||
    contract.checkAndToleranceOutcomeAgreementPolicy.normalizedProjectionPolicy
      .laterBlockedOutcomeMayEraseEarlierObservedFail !== false ||
    contract.readinessBoundary.rawSchemaScientificInputClosureComplete !==
      false ||
    contract.readinessBoundary.rawSchemaExecutionMayBeAdmitted !== false ||
    contract.readinessBoundary.rawSchemaRecomputationImplementationPresent !==
      false ||
    Object.values(contract.instances).some((value) => value !== null) ||
    contract.frozenFailurePolicy.retuningPermitted !== false ||
    contract.diagnosticLampGate.exactDiagnosticLampCount !== 2 ||
    contract.diagnosticLampGate.bothReplayPassesRequired !== true ||
    contract.diagnosticLampGate.fullPairAgreementPassRequired !== true ||
    Object.entries(contract.authorityLocks).some(([, value]) =>
      value === null ? false : value !== false,
    ) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_CANONICAL_SIZE_BYTES
  ) {
    throw new Error("spherical_v2_pair_agreement_contract_invariant");
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2PairAgreementViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT) return [];
  if (typeof value !== "string") return ["pair_agreement_wire_required"];
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_VALIDATOR_LIMITS;
  if (value.length > limits.maximumWireUtf16CodeUnits)
    return ["pair_agreement_wire_code_unit_limit"];
  if (Buffer.byteLength(value, "utf8") > limits.maximumWireUtf8Bytes)
    return ["pair_agreement_wire_byte_limit"];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    return ["pair_agreement_wire_json_invalid"];
  }
  try {
    const snapshot = snapshotPlainData(parsed);
    if (snapshot.ok === false) return [snapshot.violation];
    const canonical = canonicalJson(snapshot.value);
    if (canonical !== value) return ["pair_agreement_wire_not_canonical"];
    return canonical ===
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON
      ? ["pair_agreement_external_copy_not_authoritative"]
      : ["spherical_v2_pair_agreement_contract_semantic_drift"];
  } catch {
    return ["spherical_v2_pair_agreement_contract_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2PairAgreementV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2PairAgreementV1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;

export const cloneNhm2SphericalBosonStarV2PairAgreement = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2PairAgreementV1;
