import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-fixed-background-pair-agreement.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-fixed-background-run.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../../../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_fixed_background_content_replay/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_CONVENTION_EXPECTED_SHA256 =
  "539ffe78e91f20a93eb1dcdf07f68af26529da4fd1062b7bd336434cea27c336" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_CONVENTION_EXPECTED_SIZE_BYTES =
  9209 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256 =
  "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES =
  20280 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 =
  "e1ce8527fc9bef68d31e76ff122ece1d633400137256e4dc5e7bdd325effbb73" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES =
  16791 as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_ARRAY_ROLES =
  Object.freeze([
    "fixed_background_mean_rset",
    "fixed_background_mean_rset_absolute_uncertainty95",
    "fixed_background_connected_noise_kernel",
    "fixed_background_connected_noise_absolute_uncertainty95",
    "fixed_background_sample_weights",
  ] as const);

export type Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole =
  (typeof NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_ARRAY_ROLES)[number];

const SAMPLE_COUNT = 64 as const;
const TENSOR_COMPONENT_COUNT = 10 as const;
const COVARIANCE_DIMENSION = 640 as const;
const NOISE_COMPONENT_PAIR_COUNT =
  TENSOR_COMPONENT_COUNT * TENSOR_COMPONENT_COUNT;
const TENSOR_MULTIPLICITIES =
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.tensorConvention
    .symmetricTensorMultiplicities;
const EXACT_SAMPLE_WEIGHT = 1 / SAMPLE_COUNT;

const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const TYPED_ARRAY_BUFFER_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "buffer",
)?.get;
const TYPED_ARRAY_BYTE_OFFSET_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "byteOffset",
)?.get;
const TYPED_ARRAY_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "byteLength",
)?.get;
const ARRAY_BUFFER_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  ArrayBuffer.prototype,
  "byteLength",
)?.get;

if (
  typeof TYPED_ARRAY_BUFFER_GETTER !== "function" ||
  typeof TYPED_ARRAY_BYTE_OFFSET_GETTER !== "function" ||
  typeof TYPED_ARRAY_BYTE_LENGTH_GETTER !== "function" ||
  typeof ARRAY_BUFFER_BYTE_LENGTH_GETTER !== "function"
) {
  throw new Error("nhm2_fixed_background_typed_array_intrinsics_unavailable");
}

const ARRAY_SPECS = Object.freeze([
  {
    role: "fixed_background_mean_rset",
    shape: [64, 10] as const,
    elementCount: 640,
    expectedSizeBytes: 5_120,
    uncertainty: false,
    weights: false,
  },
  {
    role: "fixed_background_mean_rset_absolute_uncertainty95",
    shape: [64, 10] as const,
    elementCount: 640,
    expectedSizeBytes: 5_120,
    uncertainty: true,
    weights: false,
  },
  {
    role: "fixed_background_connected_noise_kernel",
    shape: [64, 64, 100] as const,
    elementCount: 409_600,
    expectedSizeBytes: 3_276_800,
    uncertainty: false,
    weights: false,
  },
  {
    role: "fixed_background_connected_noise_absolute_uncertainty95",
    shape: [64, 64, 100] as const,
    elementCount: 409_600,
    expectedSizeBytes: 3_276_800,
    uncertainty: true,
    weights: false,
  },
  {
    role: "fixed_background_sample_weights",
    shape: [64] as const,
    elementCount: 64,
    expectedSizeBytes: 512,
    uncertainty: false,
    weights: true,
  },
] as const);

const CONTRACT_OUTPUTS =
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
    .outputBoundary.allowedArrayOutputs;
const RUN_OUTPUTS =
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
    .plannedArtifactInventory.arrayOutputs;

const outputContractMatchesReplay =
  CONTRACT_OUTPUTS.length === ARRAY_SPECS.length &&
  CONTRACT_OUTPUTS.every((output, index) => {
    const spec = ARRAY_SPECS[index];
    return (
      output.role === spec.role &&
      output.encoding === "raw_ieee754_float64_little_endian" &&
      output.shape.length === spec.shape.length &&
      output.shape.every((axis, axisIndex) => axis === spec.shape[axisIndex]) &&
      Array.from(output.shape).reduce<number>(
        (product, axis) => product * axis,
        1,
      ) === spec.elementCount &&
      spec.elementCount * 8 === spec.expectedSizeBytes
    );
  });
const runInventoryMatchesReplay =
  RUN_OUTPUTS.length === ARRAY_SPECS.length &&
  RUN_OUTPUTS.every((output, index) => {
    const spec = ARRAY_SPECS[index];
    return (
      output.ordinal === index &&
      output.role === spec.role &&
      output.encoding === "raw_ieee754_float64_little_endian" &&
      output.headerBytes === 0 &&
      output.framingAllowed === false &&
      output.elementSizeBytes === 8 &&
      output.elementCount === spec.elementCount &&
      output.expectedSizeBytes === spec.expectedSizeBytes &&
      output.shape.length === spec.shape.length &&
      output.shape.every((axis, axisIndex) => axis === spec.shape[axisIndex])
    );
  });

if (
  !outputContractMatchesReplay ||
  !runInventoryMatchesReplay ||
  SAMPLE_COUNT * TENSOR_COMPONENT_COUNT !== COVARIANCE_DIMENSION ||
  TENSOR_MULTIPLICITIES.length !== TENSOR_COMPONENT_COUNT ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.sampleWeights.value !==
    "1/64" ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.sampleWeights.count !==
    SAMPLE_COUNT ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.sampleWeights.sum !==
    1 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
    .sourceBoundary.declaredLeverTensorPresent !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
    .outputBoundary.constraintArraysAuthorized !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_CONVENTION_EXPECTED_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content
    .executionAdmissible !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content
    .distributionProductBoundary.batesEquation2_11ExecutionAllowed !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content
      .authority.locks,
  ).some((lock) => lock !== false) ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
    .semanticConventionFrozen !== true ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
    .executionAdmissible !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
    .authority.status !== "blocked" ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
      .authority.locks,
  ).some((lock) => lock !== false) ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .executionAdmissible !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.artifactId !== null ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.contractVersion !== null ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.canonicalSha256 !== null ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.canonicalSizeBytes !== null ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.canonicalization !== null ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.bindingAvailable !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.requiredBeforeExecution !== true ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding
    .runtimeOrConcurrentContractImportAllowedInV1 !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding.nullBindingAuthorizesExecution !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .authority.status !== "blocked" ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .authority.firstBlocker !==
    "required_mean_renormalization_convention_binding_absent" ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
      .content.authority.locks,
  ).some((lock) => lock !== false)
) {
  throw new Error(
    "nhm2_fixed_background_content_replay_contract_boundary_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_AUTHORITY_BLOCKERS =
  Object.freeze([
    "connected_noise_distribution_execution_freeze_incomplete",
    "mean_rset_renormalization_execution_freeze_incomplete",
    "connected_noise_numerical_representation_required_mean_convention_binding_absent",
    "connected_noise_numerical_representation_execution_freeze_incomplete",
    "primary_and_independent_derivation_algorithms_absent",
    "runtime_execution_evidence_absent",
    "independent_pair_agreement_absent",
  ] as const);

const CLAIM_LOCKS = Object.freeze({
  meanRsetDiagnosticPass: false as const,
  connectedNoiseDiagnosticPass: false as const,
  fixedBackgroundWardIdentityDiagnosticPass: false as const,
  serverByteReplayAuthority: false as const,
  independentAgreementEstablished: false as const,
  semiclassicalStressNoiseLamp: false as const,
  constraintClosureLamp: false as const,
  fullAdmConstraintClosure: false as const,
  theoryGraphPromotion: false as const,
  theoryClosure: false as const,
  experimentReadyTheoryClosure: false as const,
  empiricalValidation: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  certificateEligibility: false as const,
  certificateIssued: false as const,
});

export type Nhm2ConformallyFlatNeedleFixedBackgroundRawArrayBytes = Readonly<{
  role: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole;
  bytes: Buffer;
}>;

export type Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayInput =
  Readonly<{
    arrays: readonly Nhm2ConformallyFlatNeedleFixedBackgroundRawArrayBytes[];
  }>;

export type Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssueCode =
  | "input_not_plain_object"
  | "input_keys_invalid"
  | "input_accessor_forbidden"
  | "arrays_not_plain_array"
  | "array_inventory_length_invalid"
  | "array_inventory_keys_invalid"
  | "array_entry_not_plain_object"
  | "array_entry_alias_forbidden"
  | "array_entry_keys_invalid"
  | "array_entry_accessor_forbidden"
  | "array_role_order_invalid"
  | "declared_lever_tensor_role_forbidden"
  | "constraint_array_role_forbidden"
  | "raw_bytes_not_full_owned_buffer"
  | "raw_bytes_shared_array_buffer_forbidden"
  | "raw_bytes_alias_forbidden"
  | "raw_bytes_size_invalid"
  | "raw_array_nonfinite"
  | "raw_array_negative_zero"
  | "absolute_uncertainty_negative"
  | "sample_weight_negative"
  | "sample_weights_not_exact_frozen_normalization"
  | "numeric_replay_overflow"
  | "noise_exchange_intervals_inconsistent"
  | "noise_psd_negative_witness"
  | "noise_psd_numerically_inconclusive";

export type Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue =
  Readonly<{
    code: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssueCode;
    disposition:
      "blocked_input" | "diagnostic_failure" | "diagnostic_inconclusive";
    role: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole | null;
    elementIndex: number | null;
  }>;

export type Nhm2ConformallyFlatNeedleFixedBackgroundMeanDiagnostic = Readonly<{
  diagnosticOnly: true;
  sampleCount: 64;
  tensorComponentCount: 10;
  exactSampleWeight: number;
  smearingWeightSum: number;
  smearedTensorComponentsSI: readonly number[];
  smearedAbsoluteUncertainty95ByComponentSI: readonly number[];
  symmetricTensorFrobeniusSI: number;
  establishesSemiclassicalClosure: false;
}>;

export type Nhm2ConformallyFlatNeedleFixedBackgroundNoiseDiagnostic = Readonly<{
  diagnosticOnly: true;
  sampleCount: 64;
  covarianceDimension: 640;
  exchangePairCount: number;
  exchangeMaximumAbsoluteResidualSI: number;
  exchangeMaximumUncertaintyBudget95SI: number;
  exchangeMaximumIntervalExcessSI: number;
  exchangeIntervalsConsistent: boolean;
  centralSymmetrization: "one_half_of_raw_pair_plus_exchange_transpose";
  covarianceWeighting: "diag_sqrt_sample_weight_times_sqrt_tensor_multiplicity_bilateral";
  psdMethod: "bounded_unshifted_cholesky_with_residual_eigen_lower_bound_and_uncertainty_robust_diagonal_and_2x2_rayleigh_witnesses";
  psdDisposition:
    "exact_psd_certified" | "negative_witness" | "numerically_inconclusive";
  negativeWitness: Readonly<{
    kind: "diagonal_basis" | "two_by_two_principal_mode";
    indices: readonly number[];
    normalizedComponents: readonly number[];
    centralRayleighQuotientSI: number;
    centralRoundingUpperSI: number;
    reportedUncertaintyRadius95SI: number;
    upper95SI: number;
    robustToReportedUncertainty95: true;
  }> | null;
  gershgorinMinimumEigenvalueLowerBoundSI: number;
  gershgorinMaximumEigenvalueUpperBoundSI: number;
  gershgorinUsedAsPsdPassAuthority: false;
  fullCholeskyAttempted: boolean;
  fullCholeskyDisposition:
    "not_attempted_work_policy_unfrozen" | "attempted_residual_bounded";
  fullCholeskyEstimatedScalarOperations: number;
  fullCholeskyScalarOperationLimit: number;
  fullCholeskyMinimumPivotSI: number | null;
  factorizationResidualInfinityNormUpperSI: number | null;
  factorizationEigenvalueLowerBoundSI: number | null;
  frozenPsdTolerancePresent: false;
  establishesConstraintClosure: false;
}>;

export type Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayResult =
  Readonly<{
    contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONTRACT_VERSION;
    status: "blocked";
    calculationOnly: true;
    serverCalculationImplementation: true;
    diagnosticReplayState:
      | "input_rejected"
      | "replayed_with_detected_failure"
      | "replayed_inconclusive"
      | "replayed_without_authority";
    contractBindings: Readonly<{
      observables: Readonly<{
        sha256: string;
        sizeBytes: number;
      }>;
      runPlan: Readonly<{ sha256: string; sizeBytes: number }>;
      pairAgreementPlan: Readonly<{ sha256: string; sizeBytes: number }>;
      connectedNoiseDistributionConvention: Readonly<{
        sha256: string;
        sizeBytes: number;
        semanticBaselineOnly: true;
        executionAdmissible: false;
      }>;
      meanRsetRenormalizationConvention: Readonly<{
        sha256: string;
        sizeBytes: number;
        semanticConventionOnly: true;
        semanticConventionFrozen: true;
        executionAdmissible: false;
        authorityGranted: false;
      }>;
      connectedNoiseNumericalRepresentation: Readonly<{
        sha256: string;
        sizeBytes: number;
        designOverlayOnly: true;
        requiredMeanConventionBindingAvailable: false;
        executionAdmissible: false;
        authorityGranted: false;
      }>;
      bindingsGrantAuthority: false;
    }>;
    sourceBoundary: Readonly<{
      rawBytesProvenanceVerified: false;
      declaredLeverTensorRoleDetectedBeforeRejection: boolean;
      declaredLeverTensorUsed: false;
      declaredLeverTensorAccepted: false;
    }>;
    inputSnapshot: Readonly<{
      captured: boolean;
      accessorFreeCaptureRequired: true;
      callerBuffersRetained: false;
      buffersUniqueNonsharedAndFull: boolean;
      arrays: readonly Readonly<{
        ordinal: number;
        role: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole;
        sha256: string;
        sizeBytes: number;
        elementCount: number;
        authority: false;
      }>[];
    }>;
    diagnostics: Readonly<{
      inputContent: Readonly<{
        rawArrayCount: 5;
        float64ValueCount: number;
        allValuesFinite: true;
        negativeZeroAbsent: true;
        absoluteUncertaintiesNonnegative: true;
        exactFrozenWeightsVerified: true;
      }> | null;
      mean: Nhm2ConformallyFlatNeedleFixedBackgroundMeanDiagnostic | null;
      noise: Nhm2ConformallyFlatNeedleFixedBackgroundNoiseDiagnostic | null;
      ward: Readonly<{
        status: "not_replayed_no_derivative_or_connection_outputs";
        diagnosticOnly: true;
        inputRolePresent: false;
        establishesFullAdmConstraintClosure: false;
      }>;
    }>;
    issues: readonly Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue[];
    firstFailure: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssueCode | null;
    authority: Readonly<{
      status: "blocked";
      firstBlocker: "connected_noise_distribution_execution_freeze_incomplete";
      blockers: readonly string[];
      capabilityIssued: false;
      issuerPresent: false;
      replayReceiptAuthority: false;
    }>;
    constraintBoundary: Readonly<{
      constraintArrayRolesAccepted: false;
      constraintBracketRolesAccepted: false;
      normalizedConstraintBracketRolesAccepted: false;
      wardDiagnosticIsConstraintClosure: false;
    }>;
    claimLocks: typeof CLAIM_LOCKS;
  }>;

type CapturedArray = Readonly<{
  ordinal: number;
  role: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  elementCount: number;
}>;

type CaptureResult =
  | { ok: true; arrays: readonly CapturedArray[] }
  | {
      ok: false;
      arrays: readonly CapturedArray[];
      issue: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue;
    };

type DecodedArrays = Readonly<{
  fixed_background_mean_rset: Float64Array;
  fixed_background_mean_rset_absolute_uncertainty95: Float64Array;
  fixed_background_connected_noise_kernel: Float64Array;
  fixed_background_connected_noise_absolute_uncertainty95: Float64Array;
  fixed_background_sample_weights: Float64Array;
}>;

const issue = (
  code: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssueCode,
  disposition: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue["disposition"],
  role: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole | null = null,
  elementIndex: number | null = null,
): Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue => ({
  code,
  disposition,
  role,
  elementIndex,
});

const sameOrderedStrings = (
  actual: readonly (string | symbol)[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every(
    (entry, index) => typeof entry === "string" && entry === expected[index],
  );

const sameStringSet = (
  actual: readonly (string | symbol)[],
  expected: readonly string[],
): boolean => {
  if (
    actual.length !== expected.length ||
    actual.some((entry) => typeof entry !== "string")
  ) {
    return false;
  }
  const actualStrings = [...actual] as string[];
  return expected.every((entry) => actualStrings.includes(entry));
};

const captureInput = (input: unknown): CaptureResult => {
  const captured: CapturedArray[] = [];
  if (
    input == null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    nodeUtilTypes.isProxy(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("input_not_plain_object", "blocked_input"),
    };
  }
  const rootDescriptors = Object.getOwnPropertyDescriptors(input);
  const rootKeys = Reflect.ownKeys(input);
  if (!sameStringSet(rootKeys, ["arrays"])) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("input_keys_invalid", "blocked_input"),
    };
  }
  const arraysDescriptor = rootDescriptors.arrays;
  if (
    arraysDescriptor == null ||
    !("value" in arraysDescriptor) ||
    arraysDescriptor.enumerable !== true
  ) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("input_accessor_forbidden", "blocked_input"),
    };
  }
  const arrays = arraysDescriptor.value;
  if (
    !Array.isArray(arrays) ||
    nodeUtilTypes.isProxy(arrays) ||
    Object.getPrototypeOf(arrays) !== Array.prototype
  ) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("arrays_not_plain_array", "blocked_input"),
    };
  }
  if (arrays.length !== ARRAY_SPECS.length) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("array_inventory_length_invalid", "blocked_input"),
    };
  }
  const arrayDescriptors = Object.getOwnPropertyDescriptors(arrays);
  const expectedArrayKeys = [
    ...ARRAY_SPECS.map((_entry, index) => String(index)),
    "length",
  ];
  if (!sameOrderedStrings(Reflect.ownKeys(arrays), expectedArrayKeys)) {
    return {
      ok: false,
      arrays: captured,
      issue: issue("array_inventory_keys_invalid", "blocked_input"),
    };
  }

  const entryObjects = new Set<object>();
  const sourceBuffers = new Set<ArrayBufferLike>();
  for (let ordinal = 0; ordinal < ARRAY_SPECS.length; ordinal += 1) {
    const spec = ARRAY_SPECS[ordinal];
    const arrayDescriptor = arrayDescriptors[String(ordinal)];
    if (
      arrayDescriptor == null ||
      !("value" in arrayDescriptor) ||
      arrayDescriptor.enumerable !== true
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("input_accessor_forbidden", "blocked_input"),
      };
    }
    const entry = arrayDescriptor.value;
    if (
      entry == null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      nodeUtilTypes.isProxy(entry) ||
      Object.getPrototypeOf(entry) !== Object.prototype
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("array_entry_not_plain_object", "blocked_input"),
      };
    }
    if (entryObjects.has(entry)) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("array_entry_alias_forbidden", "blocked_input"),
      };
    }
    entryObjects.add(entry);
    const entryDescriptors = Object.getOwnPropertyDescriptors(entry);
    if (!sameStringSet(Reflect.ownKeys(entry), ["role", "bytes"])) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("array_entry_keys_invalid", "blocked_input"),
      };
    }
    const roleDescriptor = entryDescriptors.role;
    const bytesDescriptor = entryDescriptors.bytes;
    if (
      roleDescriptor == null ||
      !("value" in roleDescriptor) ||
      roleDescriptor.enumerable !== true ||
      bytesDescriptor == null ||
      !("value" in bytesDescriptor) ||
      bytesDescriptor.enumerable !== true
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("array_entry_accessor_forbidden", "blocked_input"),
      };
    }
    const rawRole = roleDescriptor.value;
    if (
      typeof rawRole === "string" &&
      /(?:declared[_-]?lever|lever[_-]?tensor)/i.test(rawRole)
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("declared_lever_tensor_role_forbidden", "blocked_input"),
      };
    }
    if (
      typeof rawRole === "string" &&
      /(?:^H$|^H_i$|constraint|hamiltonian|momentum|bracket|antisymmetry|jacobi|regulator)/i.test(
        rawRole,
      )
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("constraint_array_role_forbidden", "blocked_input"),
      };
    }
    if (rawRole !== spec.role) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("array_role_order_invalid", "blocked_input"),
      };
    }
    const role =
      rawRole as Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole;
    const rawBytes = bytesDescriptor.value;
    if (
      nodeUtilTypes.isProxy(rawBytes) ||
      !Buffer.isBuffer(rawBytes) ||
      Object.getPrototypeOf(rawBytes) !== Buffer.prototype
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_not_full_owned_buffer", "blocked_input", role),
      };
    }
    let intrinsicBuffer: ArrayBufferLike;
    let intrinsicByteOffset: number;
    let intrinsicByteLength: number;
    let intrinsicBackingByteLength: number;
    try {
      intrinsicBuffer = Reflect.apply(TYPED_ARRAY_BUFFER_GETTER, rawBytes, []);
      intrinsicByteOffset = Reflect.apply(
        TYPED_ARRAY_BYTE_OFFSET_GETTER,
        rawBytes,
        [],
      );
      intrinsicByteLength = Reflect.apply(
        TYPED_ARRAY_BYTE_LENGTH_GETTER,
        rawBytes,
        [],
      );
    } catch {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_not_full_owned_buffer", "blocked_input", role),
      };
    }
    if (
      typeof SharedArrayBuffer !== "undefined" &&
      intrinsicBuffer instanceof SharedArrayBuffer
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue(
          "raw_bytes_shared_array_buffer_forbidden",
          "blocked_input",
          role,
        ),
      };
    }
    try {
      intrinsicBackingByteLength = Reflect.apply(
        ARRAY_BUFFER_BYTE_LENGTH_GETTER,
        intrinsicBuffer,
        [],
      );
    } catch {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_not_full_owned_buffer", "blocked_input", role),
      };
    }
    if (
      intrinsicByteOffset !== 0 ||
      intrinsicByteLength !== intrinsicBackingByteLength
    ) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_not_full_owned_buffer", "blocked_input", role),
      };
    }
    if (sourceBuffers.has(intrinsicBuffer)) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_alias_forbidden", "blocked_input", role),
      };
    }
    sourceBuffers.add(intrinsicBuffer);
    if (intrinsicByteLength !== spec.expectedSizeBytes) {
      return {
        ok: false,
        arrays: captured,
        issue: issue("raw_bytes_size_invalid", "blocked_input", role),
      };
    }

    // No caller-owned bytes survive this point. Shared memory and partial
    // views were rejected first, so this synchronous copy is an isolated
    // snapshot rather than an alias of producer-controlled storage.
    const intrinsicView = new Uint8Array(
      intrinsicBuffer,
      intrinsicByteOffset,
      intrinsicByteLength,
    );
    const bytes = Buffer.from(intrinsicView);
    captured.push({
      ordinal,
      role,
      bytes,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      sizeBytes: bytes.byteLength,
      elementCount: spec.elementCount,
    });
  }
  return { ok: true, arrays: captured };
};

type DecodeResult =
  | { ok: true; arrays: DecodedArrays }
  | {
      ok: false;
      issue: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue;
    };

const decodeArrays = (captured: readonly CapturedArray[]): DecodeResult => {
  const decoded = new Map<
    Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayArrayRole,
    Float64Array
  >();
  for (const [ordinal, entry] of captured.entries()) {
    const spec = ARRAY_SPECS[ordinal];
    const values = new Float64Array(spec.elementCount);
    const view = new DataView(
      entry.bytes.buffer,
      entry.bytes.byteOffset,
      entry.bytes.byteLength,
    );
    for (let index = 0; index < values.length; index += 1) {
      const value = view.getFloat64(index * 8, true);
      if (!Number.isFinite(value)) {
        return {
          ok: false,
          issue: issue(
            "raw_array_nonfinite",
            "blocked_input",
            entry.role,
            index,
          ),
        };
      }
      if (Object.is(value, -0)) {
        return {
          ok: false,
          issue: issue(
            "raw_array_negative_zero",
            "blocked_input",
            entry.role,
            index,
          ),
        };
      }
      if (spec.uncertainty && value < 0) {
        return {
          ok: false,
          issue: issue(
            "absolute_uncertainty_negative",
            "blocked_input",
            entry.role,
            index,
          ),
        };
      }
      if (spec.weights && value < 0) {
        return {
          ok: false,
          issue: issue(
            "sample_weight_negative",
            "blocked_input",
            entry.role,
            index,
          ),
        };
      }
      values[index] = value;
    }
    decoded.set(entry.role, values);
  }
  return {
    ok: true,
    arrays: {
      fixed_background_mean_rset: decoded.get("fixed_background_mean_rset")!,
      fixed_background_mean_rset_absolute_uncertainty95: decoded.get(
        "fixed_background_mean_rset_absolute_uncertainty95",
      )!,
      fixed_background_connected_noise_kernel: decoded.get(
        "fixed_background_connected_noise_kernel",
      )!,
      fixed_background_connected_noise_absolute_uncertainty95: decoded.get(
        "fixed_background_connected_noise_absolute_uncertainty95",
      )!,
      fixed_background_sample_weights: decoded.get(
        "fixed_background_sample_weights",
      )!,
    },
  };
};

const kahanSum = (values: Iterable<number>): number => {
  let sum = 0;
  let compensation = 0;
  for (const value of values) {
    const adjusted = value - compensation;
    const next = sum + adjusted;
    compensation = next - sum - adjusted;
    sum = next;
  }
  return sum;
};

const computeMeanDiagnostic = (
  arrays: DecodedArrays,
): Nhm2ConformallyFlatNeedleFixedBackgroundMeanDiagnostic | null => {
  const mean = arrays.fixed_background_mean_rset;
  const uncertainty = arrays.fixed_background_mean_rset_absolute_uncertainty95;
  const weights = arrays.fixed_background_sample_weights;
  const smeared = new Array<number>(TENSOR_COMPONENT_COUNT).fill(0);
  const smearedCompensation = new Array<number>(TENSOR_COMPONENT_COUNT).fill(0);
  const smearedUncertainty = new Array<number>(TENSOR_COMPONENT_COUNT).fill(0);
  const uncertaintyCompensation = new Array<number>(
    TENSOR_COMPONENT_COUNT,
  ).fill(0);
  for (let point = 0; point < SAMPLE_COUNT; point += 1) {
    const weight = weights[point];
    for (
      let component = 0;
      component < TENSOR_COMPONENT_COUNT;
      component += 1
    ) {
      const offset = point * TENSOR_COMPONENT_COUNT + component;
      const meanProduct = weight * mean[offset];
      const meanAdjusted = meanProduct - smearedCompensation[component];
      const meanNext = smeared[component] + meanAdjusted;
      smearedCompensation[component] =
        meanNext - smeared[component] - meanAdjusted;
      smeared[component] = meanNext;

      const uncertaintyProduct = weight * uncertainty[offset];
      const uncertaintyAdjusted =
        uncertaintyProduct - uncertaintyCompensation[component];
      const uncertaintyNext =
        smearedUncertainty[component] + uncertaintyAdjusted;
      uncertaintyCompensation[component] =
        uncertaintyNext - smearedUncertainty[component] - uncertaintyAdjusted;
      smearedUncertainty[component] = uncertaintyNext;
    }
  }
  const symmetricTensorFrobeniusSI = Math.hypot(
    ...smeared.map(
      (value, component) => value * Math.sqrt(TENSOR_MULTIPLICITIES[component]),
    ),
  );
  const smearingWeightSum = kahanSum(weights);
  if (
    !Number.isFinite(symmetricTensorFrobeniusSI) ||
    !Number.isFinite(smearingWeightSum) ||
    !smeared.every(Number.isFinite) ||
    !smearedUncertainty.every(Number.isFinite)
  ) {
    return null;
  }
  return {
    diagnosticOnly: true,
    sampleCount: SAMPLE_COUNT,
    tensorComponentCount: TENSOR_COMPONENT_COUNT,
    exactSampleWeight: EXACT_SAMPLE_WEIGHT,
    smearingWeightSum,
    smearedTensorComponentsSI: smeared,
    smearedAbsoluteUncertainty95ByComponentSI: smearedUncertainty,
    symmetricTensorFrobeniusSI,
    establishesSemiclassicalClosure: false,
  };
};

const ieee754Gamma = (operationCount: number): number => {
  const product = operationCount * Number.EPSILON;
  return product < 1 ? product / (1 - product) : Number.POSITIVE_INFINITY;
};

type IntervalRobustNegativeWitness = NonNullable<
  Nhm2ConformallyFlatNeedleFixedBackgroundNoiseDiagnostic["negativeWitness"]
>;

const findIntervalRobustNegativeRayleighWitness = (
  dimension: number,
  centralValue: (row: number, column: number) => number,
  uncertaintyRadius95: (row: number, column: number) => number,
): IntervalRobustNegativeWitness | null => {
  let strongest: IntervalRobustNegativeWitness | null = null;
  const consider = (
    kind: IntervalRobustNegativeWitness["kind"],
    indices: readonly number[],
    normalizedComponents: readonly number[],
    quotient: number,
    absoluteScale: number,
    operationCount: number,
    reportedUncertaintyRadius95SI: number,
  ): void => {
    const centralRoundingUpperSI =
      ieee754Gamma(operationCount) * (Math.abs(quotient) + absoluteScale);
    const upper95SI =
      quotient + centralRoundingUpperSI + reportedUncertaintyRadius95SI;
    if (
      !Number.isFinite(quotient) ||
      !Number.isFinite(centralRoundingUpperSI) ||
      !Number.isFinite(reportedUncertaintyRadius95SI) ||
      !(upper95SI < 0)
    ) {
      return;
    }
    const candidate: IntervalRobustNegativeWitness = {
      kind,
      indices,
      normalizedComponents,
      centralRayleighQuotientSI: quotient,
      centralRoundingUpperSI,
      reportedUncertaintyRadius95SI,
      upper95SI,
      robustToReportedUncertainty95: true,
    };
    if (strongest == null || upper95SI < strongest.upper95SI) {
      strongest = candidate;
    }
  };

  for (let index = 0; index < dimension; index += 1) {
    const diagonal = centralValue(index, index);
    consider(
      "diagonal_basis",
      [index],
      [1],
      diagonal,
      Math.abs(diagonal),
      4,
      uncertaintyRadius95(index, index),
    );
  }

  for (let left = 0; left < dimension; left += 1) {
    const diagonalLeft = centralValue(left, left);
    for (let right = left + 1; right < dimension; right += 1) {
      const diagonalRight = centralValue(right, right);
      const coupling = centralValue(left, right);
      const eigenvalue =
        0.5 *
        (diagonalLeft +
          diagonalRight -
          Math.hypot(diagonalLeft - diagonalRight, 2 * coupling));
      if (!(eigenvalue < 0) || coupling === 0) continue;
      let leftComponent = coupling;
      let rightComponent = eigenvalue - diagonalLeft;
      if (leftComponent === 0 && rightComponent === 0) {
        leftComponent = eigenvalue - diagonalRight;
        rightComponent = coupling;
      }
      const norm = Math.hypot(leftComponent, rightComponent);
      if (!(norm > 0) || !Number.isFinite(norm)) continue;
      const normalizedLeft = leftComponent / norm;
      const normalizedRight = rightComponent / norm;
      const quotient =
        diagonalLeft * normalizedLeft * normalizedLeft +
        2 * coupling * normalizedLeft * normalizedRight +
        diagonalRight * normalizedRight * normalizedRight;
      const absoluteScale =
        Math.abs(diagonalLeft * normalizedLeft * normalizedLeft) +
        Math.abs(2 * coupling * normalizedLeft * normalizedRight) +
        Math.abs(diagonalRight * normalizedRight * normalizedRight);
      const reportedUncertaintyRadius95SI =
        uncertaintyRadius95(left, left) * normalizedLeft * normalizedLeft +
        2 *
          uncertaintyRadius95(left, right) *
          Math.abs(normalizedLeft * normalizedRight) +
        uncertaintyRadius95(right, right) * normalizedRight * normalizedRight;
      consider(
        "two_by_two_principal_mode",
        [left, right],
        [normalizedLeft, normalizedRight],
        quotient,
        absoluteScale,
        32,
        reportedUncertaintyRadius95SI,
      );
    }
  }

  return strongest;
};

const FULL_CHOLESKY_SCALAR_OPERATION_LIMIT = 8_000_000 as const;

type BoundedCholeskyResult = Readonly<{
  attempted: boolean;
  estimatedScalarOperations: number;
  scalarOperationLimit: number;
  minimumPivot: number | null;
  residualInfinityNormUpper: number | null;
  eigenvalueLowerBound: number | null;
  exactPsdCertified: boolean;
}>;

const boundedUnshiftedCholesky = (
  dimension: number,
  centralValue: (row: number, column: number) => number,
): BoundedCholeskyResult => {
  const factorizationReductions =
    (dimension * (dimension - 1) * (dimension + 1)) / 6;
  const reconstructionTerms =
    (dimension * (dimension - 1) * (2 * dimension - 1)) / 6 +
    dimension * dimension;
  const estimatedScalarOperations =
    factorizationReductions + reconstructionTerms;
  if (estimatedScalarOperations > FULL_CHOLESKY_SCALAR_OPERATION_LIMIT) {
    return {
      attempted: false,
      estimatedScalarOperations,
      scalarOperationLimit: FULL_CHOLESKY_SCALAR_OPERATION_LIMIT,
      minimumPivot: null,
      residualInfinityNormUpper: null,
      eigenvalueLowerBound: null,
      exactPsdCertified: false,
    };
  }

  const lower = new Float64Array(dimension * dimension);
  let minimumPivot = Number.POSITIVE_INFINITY;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let reduced = centralValue(row, column);
      for (let inner = 0; inner < column; inner += 1) {
        reduced -=
          lower[row * dimension + inner] * lower[column * dimension + inner];
      }
      if (!Number.isFinite(reduced) || reduced < 0) {
        return {
          attempted: true,
          estimatedScalarOperations,
          scalarOperationLimit: FULL_CHOLESKY_SCALAR_OPERATION_LIMIT,
          minimumPivot: Number.isFinite(minimumPivot) ? minimumPivot : null,
          residualInfinityNormUpper: null,
          eigenvalueLowerBound: null,
          exactPsdCertified: false,
        };
      }
      if (row === column) {
        minimumPivot = Math.min(minimumPivot, reduced);
        lower[row * dimension + column] = Math.sqrt(reduced);
        continue;
      }
      const pivotRoot = lower[column * dimension + column];
      if (pivotRoot === 0) {
        if (reduced !== 0) {
          return {
            attempted: true,
            estimatedScalarOperations,
            scalarOperationLimit: FULL_CHOLESKY_SCALAR_OPERATION_LIMIT,
            minimumPivot: Number.isFinite(minimumPivot) ? minimumPivot : null,
            residualInfinityNormUpper: null,
            eigenvalueLowerBound: null,
            exactPsdCertified: false,
          };
        }
        continue;
      }
      const factor = reduced / pivotRoot;
      if (!Number.isFinite(factor)) {
        return {
          attempted: true,
          estimatedScalarOperations,
          scalarOperationLimit: FULL_CHOLESKY_SCALAR_OPERATION_LIMIT,
          minimumPivot: Number.isFinite(minimumPivot) ? minimumPivot : null,
          residualInfinityNormUpper: null,
          eigenvalueLowerBound: null,
          exactPsdCertified: false,
        };
      }
      lower[row * dimension + column] = factor;
    }
  }

  let residualInfinityNormUpper = 0;
  for (let row = 0; row < dimension; row += 1) {
    let rowResidualUpper = 0;
    for (let column = 0; column < dimension; column += 1) {
      const termCount = Math.min(row, column) + 1;
      let reconstructed = 0;
      let absoluteProductSum = 0;
      for (let inner = 0; inner < termCount; inner += 1) {
        const product =
          lower[row * dimension + inner] * lower[column * dimension + inner];
        reconstructed += product;
        absoluteProductSum += Math.abs(product);
      }
      const central = centralValue(row, column);
      const roundingUpper =
        ieee754Gamma(2 * termCount + 4) *
        (Math.abs(central) + absoluteProductSum);
      rowResidualUpper += Math.abs(central - reconstructed) + roundingUpper;
    }
    const inflated = rowResidualUpper * (1 + ieee754Gamma(dimension + 1));
    residualInfinityNormUpper = Math.max(residualInfinityNormUpper, inflated);
  }
  const finite = Number.isFinite(residualInfinityNormUpper);
  return {
    attempted: true,
    estimatedScalarOperations,
    scalarOperationLimit: FULL_CHOLESKY_SCALAR_OPERATION_LIMIT,
    minimumPivot: Number.isFinite(minimumPivot) ? minimumPivot : null,
    residualInfinityNormUpper: finite ? residualInfinityNormUpper : null,
    eigenvalueLowerBound: finite ? -residualInfinityNormUpper : null,
    // No project PSD tolerance is frozen. Only an exactly zero,
    // residual-bounded reconstruction can be called a certificate here.
    exactPsdCertified: finite && residualInfinityNormUpper === 0,
  };
};

type NoiseComputation =
  | {
      ok: true;
      diagnostic: Nhm2ConformallyFlatNeedleFixedBackgroundNoiseDiagnostic;
      issues: readonly Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue[];
    }
  | {
      ok: false;
      issue: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue;
    };

const computeNoiseDiagnostic = (arrays: DecodedArrays): NoiseComputation => {
  const noise = arrays.fixed_background_connected_noise_kernel;
  const uncertainty =
    arrays.fixed_background_connected_noise_absolute_uncertainty95;
  const weights = arrays.fixed_background_sample_weights;
  const noiseOffset = (matrixRow: number, matrixColumn: number): number => {
    const leftPoint = Math.floor(matrixRow / TENSOR_COMPONENT_COUNT);
    const leftComponent = matrixRow % TENSOR_COMPONENT_COUNT;
    const rightPoint = Math.floor(matrixColumn / TENSOR_COMPONENT_COUNT);
    const rightComponent = matrixColumn % TENSOR_COMPONENT_COUNT;
    return (
      (leftPoint * SAMPLE_COUNT + rightPoint) * NOISE_COMPONENT_PAIR_COUNT +
      leftComponent * TENSOR_COMPONENT_COUNT +
      rightComponent
    );
  };
  const basisScales = Float64Array.from(
    { length: COVARIANCE_DIMENSION },
    (_unused, index) => {
      const point = Math.floor(index / TENSOR_COMPONENT_COUNT);
      const component = index % TENSOR_COMPONENT_COUNT;
      return Math.sqrt(weights[point] * TENSOR_MULTIPLICITIES[component]);
    },
  );
  const centralValue = (row: number, column: number): number => {
    const offset = noiseOffset(row, column);
    const transposeOffset = noiseOffset(column, row);
    const stableMidpoint = noise[offset] / 2 + noise[transposeOffset] / 2;
    return stableMidpoint * basisScales[row] * basisScales[column];
  };
  const centralUncertaintyRadius95 = (row: number, column: number): number => {
    const offset = noiseOffset(row, column);
    const transposeOffset = noiseOffset(column, row);
    return (
      0.5 *
      (uncertainty[offset] +
        uncertainty[transposeOffset] +
        Math.abs(noise[offset] - noise[transposeOffset])) *
      basisScales[row] *
      basisScales[column]
    );
  };

  let exchangeMaximumAbsoluteResidualSI = 0;
  let exchangeMaximumUncertaintyBudget95SI = 0;
  let exchangeMaximumIntervalExcessSI = 0;
  let exchangePairCount = 0;
  for (let row = 0; row < COVARIANCE_DIMENSION; row += 1) {
    for (let column = row + 1; column < COVARIANCE_DIMENSION; column += 1) {
      const offset = noiseOffset(row, column);
      const transposeOffset = noiseOffset(column, row);
      const residual = Math.abs(noise[offset] - noise[transposeOffset]);
      const uncertaintyBudget =
        uncertainty[offset] + uncertainty[transposeOffset];
      const intervalExcess = Math.max(0, residual - uncertaintyBudget);
      if (
        !Number.isFinite(residual) ||
        !Number.isFinite(uncertaintyBudget) ||
        !Number.isFinite(intervalExcess)
      ) {
        return {
          ok: false,
          issue: issue("numeric_replay_overflow", "blocked_input"),
        };
      }
      exchangeMaximumAbsoluteResidualSI = Math.max(
        exchangeMaximumAbsoluteResidualSI,
        residual,
      );
      exchangeMaximumUncertaintyBudget95SI = Math.max(
        exchangeMaximumUncertaintyBudget95SI,
        uncertaintyBudget,
      );
      exchangeMaximumIntervalExcessSI = Math.max(
        exchangeMaximumIntervalExcessSI,
        intervalExcess,
      );
      exchangePairCount += 1;
    }
  }

  let gershgorinMinimumEigenvalueLowerBoundSI = Number.POSITIVE_INFINITY;
  let gershgorinMaximumEigenvalueUpperBoundSI = Number.NEGATIVE_INFINITY;
  const rowSumGamma = ieee754Gamma(COVARIANCE_DIMENSION + 4);
  for (let row = 0; row < COVARIANCE_DIMENSION; row += 1) {
    const offDiagonalEnvelope95: number[] = [];
    for (let column = 0; column < COVARIANCE_DIMENSION; column += 1) {
      if (row === column) continue;
      const offset = noiseOffset(row, column);
      const transposeOffset = noiseOffset(column, row);
      const basisScale = basisScales[row] * basisScales[column];
      const value = centralValue(row, column);
      const intervalRadius95 =
        0.5 *
        (uncertainty[offset] +
          uncertainty[transposeOffset] +
          Math.abs(noise[offset] - noise[transposeOffset])) *
        basisScale;
      const envelope95 = Math.abs(value) + intervalRadius95;
      if (
        !Number.isFinite(value) ||
        !Number.isFinite(intervalRadius95) ||
        !Number.isFinite(envelope95)
      ) {
        return {
          ok: false,
          issue: issue("numeric_replay_overflow", "blocked_input"),
        };
      }
      offDiagonalEnvelope95.push(envelope95);
    }
    const diagonal = centralValue(row, row);
    const diagonalOffset = noiseOffset(row, row);
    const diagonalUncertainty95 =
      uncertainty[diagonalOffset] * basisScales[row] * basisScales[row];
    const radius = kahanSum(offDiagonalEnvelope95);
    const radiusUpper = radius * (1 + rowSumGamma);
    const diagonalRoundoff = Math.abs(diagonal) * ieee754Gamma(8);
    const lower =
      diagonal - diagonalUncertainty95 - diagonalRoundoff - radiusUpper;
    const upper =
      diagonal + diagonalUncertainty95 + diagonalRoundoff + radiusUpper;
    if (
      ![diagonal, diagonalUncertainty95, radius, lower, upper].every(
        Number.isFinite,
      )
    ) {
      return {
        ok: false,
        issue: issue("numeric_replay_overflow", "blocked_input"),
      };
    }
    gershgorinMinimumEigenvalueLowerBoundSI = Math.min(
      gershgorinMinimumEigenvalueLowerBoundSI,
      lower,
    );
    gershgorinMaximumEigenvalueUpperBoundSI = Math.max(
      gershgorinMaximumEigenvalueUpperBoundSI,
      upper,
    );
  }

  const negativeWitness = findIntervalRobustNegativeRayleighWitness(
    COVARIANCE_DIMENSION,
    centralValue,
    centralUncertaintyRadius95,
  );
  const cholesky = boundedUnshiftedCholesky(COVARIANCE_DIMENSION, centralValue);
  const psdDisposition =
    negativeWitness != null
      ? "negative_witness"
      : cholesky.exactPsdCertified
        ? "exact_psd_certified"
        : "numerically_inconclusive";
  const diagnosticIssues: Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue[] =
    [];
  if (exchangeMaximumIntervalExcessSI > 0) {
    diagnosticIssues.push(
      issue("noise_exchange_intervals_inconsistent", "diagnostic_failure"),
    );
  }
  if (psdDisposition === "negative_witness") {
    diagnosticIssues.push(
      issue("noise_psd_negative_witness", "diagnostic_failure"),
    );
  } else if (psdDisposition === "numerically_inconclusive") {
    diagnosticIssues.push(
      issue("noise_psd_numerically_inconclusive", "diagnostic_inconclusive"),
    );
  }

  return {
    ok: true,
    diagnostic: {
      diagnosticOnly: true,
      sampleCount: SAMPLE_COUNT,
      covarianceDimension: COVARIANCE_DIMENSION,
      exchangePairCount,
      exchangeMaximumAbsoluteResidualSI,
      exchangeMaximumUncertaintyBudget95SI,
      exchangeMaximumIntervalExcessSI,
      exchangeIntervalsConsistent: exchangeMaximumIntervalExcessSI === 0,
      centralSymmetrization: "one_half_of_raw_pair_plus_exchange_transpose",
      covarianceWeighting:
        "diag_sqrt_sample_weight_times_sqrt_tensor_multiplicity_bilateral",
      psdMethod:
        "bounded_unshifted_cholesky_with_residual_eigen_lower_bound_and_uncertainty_robust_diagonal_and_2x2_rayleigh_witnesses",
      psdDisposition,
      negativeWitness,
      gershgorinMinimumEigenvalueLowerBoundSI,
      gershgorinMaximumEigenvalueUpperBoundSI,
      gershgorinUsedAsPsdPassAuthority: false,
      fullCholeskyAttempted: cholesky.attempted,
      fullCholeskyDisposition: cholesky.attempted
        ? "attempted_residual_bounded"
        : "not_attempted_work_policy_unfrozen",
      fullCholeskyEstimatedScalarOperations: cholesky.estimatedScalarOperations,
      fullCholeskyScalarOperationLimit: cholesky.scalarOperationLimit,
      fullCholeskyMinimumPivotSI: cholesky.minimumPivot,
      factorizationResidualInfinityNormUpperSI:
        cholesky.residualInfinityNormUpper,
      factorizationEigenvalueLowerBoundSI: cholesky.eigenvalueLowerBound,
      frozenPsdTolerancePresent: false,
      establishesConstraintClosure: false,
    },
    issues: diagnosticIssues,
  };
};

const deepFreeze = <T>(value: T): T => {
  if (
    value == null ||
    typeof value !== "object" ||
    ArrayBuffer.isView(value) ||
    Object.isFrozen(value)
  ) {
    return value;
  }
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  }
  return Object.freeze(value);
};

const buildResult = (
  captured: readonly CapturedArray[],
  inputValid: boolean,
  mean: Nhm2ConformallyFlatNeedleFixedBackgroundMeanDiagnostic | null,
  noise: Nhm2ConformallyFlatNeedleFixedBackgroundNoiseDiagnostic | null,
  issues: readonly Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayIssue[],
): Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayResult => {
  const issueBlockers = issues.map((entry) => entry.code);
  const blockers = [
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_AUTHORITY_BLOCKERS,
    ...issueBlockers.filter(
      (entry, index) => issueBlockers.indexOf(entry) === index,
    ),
  ];
  const diagnosticFailure = issues.some(
    (entry) => entry.disposition === "diagnostic_failure",
  );
  const diagnosticInconclusive = issues.some(
    (entry) => entry.disposition === "diagnostic_inconclusive",
  );
  const inputRejected = issues.some(
    (entry) => entry.disposition === "blocked_input",
  );
  const declaredLeverTensorRoleDetectedBeforeRejection = issues.some(
    (entry) => entry.code === "declared_lever_tensor_role_forbidden",
  );
  const totalValueCount = ARRAY_SPECS.reduce(
    (sum, spec) => sum + spec.elementCount,
    0,
  );
  return deepFreeze({
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_CONTENT_REPLAY_CONTRACT_VERSION,
    status: "blocked",
    calculationOnly: true,
    serverCalculationImplementation: true,
    diagnosticReplayState: inputRejected
      ? "input_rejected"
      : diagnosticFailure
        ? "replayed_with_detected_failure"
        : diagnosticInconclusive
          ? "replayed_inconclusive"
          : "replayed_without_authority",
    contractBindings: {
      observables: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      },
      runPlan: {
        sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256,
        sizeBytes: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES,
      },
      pairAgreementPlan: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES,
      },
      connectedNoiseDistributionConvention: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
        semanticBaselineOnly: true,
        executionAdmissible: false,
      },
      meanRsetRenormalizationConvention: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
        semanticConventionOnly: true,
        semanticConventionFrozen: true,
        executionAdmissible: false,
        authorityGranted: false,
      },
      connectedNoiseNumericalRepresentation: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
        sizeBytes:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
        designOverlayOnly: true,
        requiredMeanConventionBindingAvailable: false,
        executionAdmissible: false,
        authorityGranted: false,
      },
      bindingsGrantAuthority: false,
    },
    sourceBoundary: {
      rawBytesProvenanceVerified: false,
      declaredLeverTensorRoleDetectedBeforeRejection,
      declaredLeverTensorUsed: false,
      declaredLeverTensorAccepted: false,
    },
    inputSnapshot: {
      captured: captured.length === ARRAY_SPECS.length,
      accessorFreeCaptureRequired: true,
      callerBuffersRetained: false,
      buffersUniqueNonsharedAndFull: inputValid,
      arrays: captured.map((entry) => ({
        ordinal: entry.ordinal,
        role: entry.role,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
        elementCount: entry.elementCount,
        authority: false as const,
      })),
    },
    diagnostics: {
      inputContent:
        inputValid && mean != null && noise != null
          ? {
              rawArrayCount: 5,
              float64ValueCount: totalValueCount,
              allValuesFinite: true,
              negativeZeroAbsent: true,
              absoluteUncertaintiesNonnegative: true,
              exactFrozenWeightsVerified: true,
            }
          : null,
      mean,
      noise,
      ward: {
        status: "not_replayed_no_derivative_or_connection_outputs",
        diagnosticOnly: true,
        inputRolePresent: false,
        establishesFullAdmConstraintClosure: false,
      },
    },
    issues,
    firstFailure: issues[0]?.code ?? null,
    authority: {
      status: "blocked",
      firstBlocker: "connected_noise_distribution_execution_freeze_incomplete",
      blockers,
      capabilityIssued: false,
      issuerPresent: false,
      replayReceiptAuthority: false,
    },
    constraintBoundary: {
      constraintArrayRolesAccepted: false,
      constraintBracketRolesAccepted: false,
      normalizedConstraintBracketRolesAccepted: false,
      wardDiagnosticIsConstraintClosure: false,
    },
    claimLocks: CLAIM_LOCKS,
  });
};

/**
 * Replays only detached raw f64le array bytes. This function has no path,
 * process, producer, provenance, receipt, capability, or certificate surface.
 * Numeric diagnostics can add failures, but they can never remove the frozen
 * authority blockers or unlock any semiclassical, constraint, or physical
 * claim.
 */
export const replayNhm2ConformallyFlatNeedleFixedBackgroundContent = (
  input: unknown,
): Nhm2ConformallyFlatNeedleFixedBackgroundContentReplayResult => {
  const capture = captureInput(input);
  if (capture.ok === false) {
    return buildResult(capture.arrays, false, null, null, [capture.issue]);
  }
  const decoded = decodeArrays(capture.arrays);
  if (decoded.ok === false) {
    return buildResult(capture.arrays, false, null, null, [decoded.issue]);
  }
  const weights = decoded.arrays.fixed_background_sample_weights;
  const invalidWeightIndex = weights.findIndex(
    (weight) => weight !== EXACT_SAMPLE_WEIGHT,
  );
  const weightSum = kahanSum(weights);
  if (invalidWeightIndex >= 0 || weightSum !== 1) {
    return buildResult(capture.arrays, false, null, null, [
      issue(
        "sample_weights_not_exact_frozen_normalization",
        "blocked_input",
        "fixed_background_sample_weights",
        invalidWeightIndex >= 0 ? invalidWeightIndex : null,
      ),
    ]);
  }

  const mean = computeMeanDiagnostic(decoded.arrays);
  if (mean == null) {
    return buildResult(capture.arrays, false, null, null, [
      issue("numeric_replay_overflow", "blocked_input"),
    ]);
  }
  const noise = computeNoiseDiagnostic(decoded.arrays);
  if (noise.ok === false) {
    return buildResult(capture.arrays, false, mean, null, [noise.issue]);
  }
  return buildResult(
    capture.arrays,
    true,
    mean,
    noise.diagnostic,
    noise.issues,
  );
};
