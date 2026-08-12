import { createHash } from "node:crypto";
import path from "node:path";

import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN } from "./nhm2-conformally-flat-needle-scalar-candidate-pack-plan.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
  type Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1,
} from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_metric_demand_midpoint_hessian_interval_trace" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_metric_demand_interval_trace/v2" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_metric_demand_midpoint_hessian_interval_run" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_metric_demand_interval_run/v2" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_CONFIGURATION_ID =
  "conformally_flat_needle_reference.normalized_static_smear_midpoint_hessian_interval/v2" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID =
  "composite_midpoint_pure_second_derivative_interval_remainder_with_natural_denominator_intersection/v2" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID =
  "nhm2.conformally_flat_needle_scalar_reference.candidate/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME =
  "metric-demand.float64le.bin" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME =
  "metric-demand-absolute-error-bound.float64le.bin" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME =
  "metric-demand-interval-trace.v2.json" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME =
  "metric-demand-derivation-receipt.v1.json" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_RECEIPT_FILE_NAME =
  "metric-demand-interval-run.v2.json" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_SAMPLE_COUNT =
  64 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT =
  10 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES =
  64 * 10 * 8;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS =
  Object.freeze([8, 16, 32] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS =
  Object.freeze({
    executorProvenanceIndependentlyVerified: false as const,
    intervalTraceServerReplayed: false as const,
    deterministicErrorBoundAuthority: false as const,
    candidateManifestAuthority: false as const,
    scientificPresealAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    diagnosticPass: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS =
  Object.freeze([
    "metric_demand_derivation_executor_provenance_unverified",
    "interval_trace_not_server_replayed",
    "independent_metric_demand_implementation_not_compared",
  ] as const);

/** Receipt-only blockers; deliberately excluded from the frozen v2 trace bytes. */
export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_AUTHORITY_BLOCKERS =
  Object.freeze([
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS,
    "midpoint_hessian_enclosure_target_failed",
    "first_terminal_partial_executor_provenance_unavailable",
    "resource_envelope_not_independently_verified",
  ] as const);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const canonicalMetricDemandJson = (
  value: unknown,
  ancestors: Set<object>,
): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON requires finite numbers.");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      ancestors.has(value)
    ) {
      throw new TypeError("Canonical JSON requires acyclic plain arrays.");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const ownKeys = Reflect.ownKeys(value);
    const expectedKeys = [
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      "length",
    ];
    if (
      ownKeys.length !== expectedKeys.length ||
      expectedKeys.some((key, index) => ownKeys[index] !== key)
    ) {
      throw new TypeError("Canonical JSON forbids sparse or decorated arrays.");
    }
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(value);
    const entries: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        throw new TypeError("Canonical JSON forbids array accessors.");
      }
      entries.push(canonicalMetricDemandJson(descriptor.value, nextAncestors));
    }
    return `[${entries.join(",")}]`;
  }
  if (
    !isRecord(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    ancestors.has(value)
  ) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string")) {
    throw new TypeError("Canonical JSON forbids symbol keys.");
  }
  if (
    ["__proto__", "constructor", "prototype"].some((key) =>
      Object.hasOwn(descriptors, key),
    )
  ) {
    throw new TypeError("Canonical JSON forbids prototype-sensitive keys.");
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  return `{${Object.keys(descriptors)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => {
      const descriptor = descriptors[key];
      if (!("value" in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError("Canonical JSON forbids object accessors.");
      }
      return `${JSON.stringify(key)}:${canonicalMetricDemandJson(
        descriptor.value,
        nextAncestors,
      )}`;
    })
    .join(",")}}`;
};

export const canonicalNhm2ConformallyFlatNeedleMetricDemandJson = (
  value: unknown,
): string => canonicalMetricDemandJson(value, new Set<object>());

export const sha256Nhm2ConformallyFlatNeedleMetricDemandBytes = (
  bytes: Uint8Array | string,
): string => createHash("sha256").update(bytes).digest("hex");

const readyInputSha256 = (
  inputId:
    | "geometry"
    | "chart"
    | "sampling_basis"
    | "smearing_definition"
    | "normalization",
): string => {
  const entry =
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN.inputPlans.find(
      (candidate) => candidate.inputId === inputId,
    );
  if (
    entry?.materializationStatus !== "canonical_science_bytes_ready" ||
    entry.sha256 == null
  ) {
    throw new TypeError(
      `Frozen candidate-pack binding is unavailable: ${inputId}.`,
    );
  }
  return entry.sha256;
};

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFERENCE_SHA256 =
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
    ),
  );

const tolerancePolicyEntry =
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN.inputPlans.find(
    (candidate) => candidate.inputId === "tolerance_policy",
  );
if (
  tolerancePolicyEntry?.materializationStatus !==
    "canonical_science_bytes_ready" ||
  tolerancePolicyEntry.sha256 == null
) {
  throw new TypeError("Frozen tolerance-policy binding is unavailable.");
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS =
  Object.freeze({
    geometrySha256: readyInputSha256("geometry"),
    chartSha256: readyInputSha256("chart"),
    samplingBasisSha256: readyInputSha256("sampling_basis"),
    smearingDefinitionSha256: readyInputSha256("smearing_definition"),
    normalizationSha256: readyInputSha256("normalization"),
    tolerancePolicySha256: tolerancePolicyEntry.sha256,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION =
  Object.freeze({
    artifactId:
      "nhm2.conformally_flat_needle_metric_demand_darboux_v1_development_observation" as const,
    contractVersion:
      "nhm2_conformally_flat_needle_metric_demand_darboux_development_observation/v1" as const,
    authority: "unauthenticated_development_observation_only" as const,
    configurationId:
      "conformally_flat_needle_reference.normalized_static_smear_interval_darboux/v1" as const,
    configuration: Object.freeze({
      integrationMethod:
        "cellwise_natural_interval_darboux_sums_intersected_across_refinement_levels" as const,
      refinementLevels: Object.freeze([8, 16, 32] as const),
      relativeEnclosureTarget: 0.01 as const,
      inputBindings: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
    }),
    observedMaximumFrobeniusEnclosureRatio: 0.5489588496881855 as const,
    numericalGate: "failed_0p01_enclosure_target" as const,
    scientificCandidateDisposition:
      "inconclusive_not_a_candidate_failure" as const,
    executorAuthenticated: false as const,
    outputBytesPersisted: false as const,
    retuned: false as const,
    claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256 =
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION,
    ),
  );

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION =
  Object.freeze({
    configurationId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_CONFIGURATION_ID,
    reference: {
      artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFERENCE_SHA256,
      surrogateId: "conformally_flat_needle_reference" as const,
      currentNhm2ShiftLapseMetric: false as const,
      semanticRelabelingAllowed: false as const,
    },
    candidateId: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID,
    inputBindings: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
    formulaId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
    algorithmId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
    enclosureMethod: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
    coverage: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
    sampleCount: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_SAMPLE_COUNT,
    componentCount: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT,
    componentOrder: Object.freeze([...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS]),
    relativeEnclosureTarget: 0.01 as const,
    refinementLevels:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS,
    dimensionReduction:
      "exact_static_time_factor_cancellation_in_normalized_spacetime_smear" as const,
    integrationDomain:
      "normalized_spatial_cube_u_in_closed_-1_1_cubed" as const,
    intervalArithmetic:
      "binary64_software_outward_power_of_two_ulp_padding_after_every_primitive" as const,
    exponentialEnclosure:
      "positive_taylor_series_96_terms_geometric_positive_tail_then_reciprocal" as const,
    integrationAlgorithmId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID,
    integrationEnclosure:
      "cellwise_composite_midpoint_center_interval_plus_interval_bounded_pure_second_derivative_remainder_then_intersection_across_levels" as const,
    denominatorEnclosure:
      "midpoint_hessian_enclosure_intersected_with_positive_natural_interval_darboux_enclosure" as const,
    symmetryReduction:
      "exact_even_compact_bump_and_centered_product_smear_parity_reconstruction_from_8_absolute_multiplier_classes" as const,
    denominatorProof:
      "strictly_positive_lower_darboux_sum_for_normalized_omega_four_denominator" as const,
    centerPointSubstitutionAllowed: false as const,
    refinementDeltaAloneIsErrorProof: false as const,
    workLimitFailureDisposition:
      "blocked_validated_enclosure_target_not_met_without_retuning" as const,
    constants: Object.freeze({
      speedOfLightMetersPerSecond: 299792458 as const,
      newtonianGravitationalConstantSI: 6.6743e-11 as const,
      newtonianGravitationalConstantStandardUncertaintySI: 1.5e-15 as const,
      einsteinCouplingConvention: "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab" as const,
      deterministicBoundExcludesPhysicalConstantUncertainty: true as const,
      cosmologicalConstant: 0 as const,
      higherCurvatureGravitationalCouplings: "all_fixed_zero" as const,
      riemannConvention:
        "R^rho_{ sigma mu nu}=partial_mu_Gamma^rho_{nu sigma}-partial_nu_Gamma^rho_{mu sigma}+Gamma^rho_{mu lambda}Gamma^lambda_{nu sigma}-Gamma^rho_{nu lambda}Gamma^lambda_{mu sigma}" as const,
    }),
    individualSmearWeighting:
      "each_D_n_is_individually_normalized_no_1_over_64_campaign_weight" as const,
    coordinateFlowDisposition:
      "F_cancels_exactly_by_pullback_normalization_and_pulled_back_tetrad_equivalence" as const,
    priorProtocolLineage: Object.freeze({
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.artifactId,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.contractVersion,
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
      authority:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.authority,
    }),
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 =
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
    ),
  );

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION =
  Object.freeze({
    authority: "unauthenticated_partial_terminal_output_observation" as const,
    configurationSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
    implementationSourceSha256: null,
    executorReceiptPresent: false as const,
    numericalGate: "frozen_enclosure_target_failed_without_retuning" as const,
    maximumRelativeFrobeniusEnclosure: 0.12854082269732725 as const,
    frozenRelativeEnclosureTarget: 0.01 as const,
    outputs: Object.freeze([
      Object.freeze({
        role: "metric_demand_tensor" as const,
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
        sha256:
          "e4adfe5dc175e310bb6d7deb007c4b76aebc69a700243a1373b91b38e4282bf4" as const,
        sizeBytes: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
      }),
      Object.freeze({
        role: "metric_demand_absolute_error_bound" as const,
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
        sha256:
          "0eef92b84317299e801d47414e5b8344746b545a7bed66f65bd90efb12dd5669" as const,
        sizeBytes: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
      }),
      Object.freeze({
        role: "metric_demand_interval_trace" as const,
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
        sha256:
          "cc1c48dc70e9cc9265227e6ff9dab65101d7a02ecb530ccfca4da387d04425c2" as const,
        sizeBytes: 382907 as const,
      }),
    ]),
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION_SHA256 =
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION,
    ),
  );

export type Nhm2ConformallyFlatNeedleClosedIntervalV1 = readonly [
  number,
  number,
];

export type Nhm2ConformallyFlatNeedleMetricDemandIntervalLevelTraceV1 = {
  partitionsPerAxis: number;
  cellCount: number;
  denominatorIntegral: Nhm2ConformallyFlatNeedleClosedIntervalV1;
  denominatorStrictlyPositive: true;
  componentDemandIntervalsSI: Nhm2ConformallyFlatNeedleClosedIntervalV1[];
  cumulativeIntersectionIntervalsSI: Nhm2ConformallyFlatNeedleClosedIntervalV1[];
  cumulativeWidthsSI: number[];
};

export type Nhm2ConformallyFlatNeedleMetricDemandIntervalSampleTraceV1 = {
  ordinal: number;
  multiplier: { x: string; y: string; z: string };
  inertialConformalCoordinatesM: {
    X0: string;
    X: string;
    Y: string;
    Z: string;
  };
  symmetrySourceKey: string;
  parityTransform: readonly [1, 1, 1, 1, 1, 1 | -1, 1 | -1, 1, 1 | -1, 1];
  levels: Nhm2ConformallyFlatNeedleMetricDemandIntervalLevelTraceV1[];
  selectedComponentIntervalsSI: Nhm2ConformallyFlatNeedleClosedIntervalV1[];
  centralComponentsSI: number[];
  deterministicAbsoluteErrorBoundsSI: number[];
  centralFrobeniusSI: number;
  deterministicErrorFrobeniusSI: number;
  relativeFrobeniusEnclosure: number;
  outwardSquaredSelfCheck: {
    deterministicErrorFrobeniusSquaredUpperSI2: number;
    centralFrobeniusSquaredLowerSI2: number;
    onePercentCentralFrobeniusSquaredLowerSI2: number;
    passed: boolean;
  };
};

export type Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1 = {
  artifactId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID;
  contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION;
  authority: "producer_generated_diagnostic_interval_trace_not_server_replay";
  configuration: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION;
  configurationSha256: string;
  derivation: {
    conformalEinsteinTensorFormula: string;
    orthonormalSmearFormula: string;
    compactBumpDerivativeIdentities: {
      first: string;
      second: string;
    };
    integrationEnclosureFormula: string;
    compactTestBumpBoundaryDerivativeProof: string;
    exactZeroComponents: readonly ["T01", "T02", "T03"];
    exactZeroReason: "static_conformal_factor_and_diagonal_conformal_inertial_metric";
  };
  arithmeticEvidence: {
    primitiveOutwardRoundingApplied: true;
    elementaryExponentialRemainderBoundApplied: true;
    refinementDeltaUsedAsSoleErrorProof: false;
    eachLevelIndependentlyEnclosesTheIntegral: true;
    cumulativeIntersectionOfValidEnclosures: true;
    denominatorPositiveAtEverySampleAndLevel: true;
    compositeMidpointPureSecondDerivativeRemainderApplied: true;
    naturalDenominatorIntersectionApplied: true;
    hardTargetUsesOutwardSquaredComparison: true;
    producerSelfCheckIsNotServerProof: true;
  };
  samples: Nhm2ConformallyFlatNeedleMetricDemandIntervalSampleTraceV1[];
  summary: {
    sampleCount: 64;
    componentCount: 10;
    strictlyPositiveComponentErrorBoundCount: 640;
    allComponentErrorBoundsStrictlyPositive: true;
    maximumRelativeFrobeniusEnclosure: number;
    frozenRelativeEnclosureTarget: 0.01;
    targetMetAtEverySample: boolean;
    frozenGateDisposition:
      | "producer_self_check_met_but_not_server_replayed"
      | "frozen_enclosure_target_failed_without_retuning";
    minimumDenominatorLowerBound: number;
    allDenominatorLowerBoundsStrictlyPositive: true;
    allCumulativeWidthsNonincreasing: true;
  };
  authorityBlockers: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS;
  claimLocks: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS;
};

export type Nhm2ConformallyFlatNeedleMetricDemandOutputFileV1 = {
  role:
    | "metric_demand_tensor"
    | "metric_demand_absolute_error_bound"
    | "metric_demand_interval_trace"
    | "metric_demand_derivation_receipt";
  relativePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  freshness: "created_new_during_execution";
  prestate: "absent_observed_before_exclusive_create";
  secureReadbackVerified: true;
  filesystemIdentity: {
    dev: string;
    ino: string;
    sizeBytes: string;
    mtimeNs: string;
    ctimeNs: string;
  };
};

export type Nhm2ConformallyFlatNeedleMetricDemandPriorTerminalOutputV1 = {
  role:
    | "metric_demand_tensor"
    | "metric_demand_absolute_error_bound"
    | "metric_demand_interval_trace";
  relativePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  freshness: "preexisting_terminal_partial_securely_reread_for_reproduction";
  filesystemIdentity: {
    dev: string;
    ino: string;
    sizeBytes: string;
    mtimeNs: string;
    ctimeNs: string;
  };
};

export type Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1 = {
  artifactId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_ARTIFACT_ID;
  contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_CONTRACT_VERSION;
  authority: "server_executor_observation_diagnostic_only";
  status: "outputs_exclusively_created_and_securely_reread";
  runMode: "receipt_capture_reproduction_of_terminal_v2_failure";
  configurationSha256: string;
  executionObservation: {
    invocationId: string;
    repositoryRoot: string;
    gitCommitSha: string;
    gitWorktreeState: "clean" | "dirty";
    command: string;
    argv: string[];
    startedAt: string;
    completedAt: string;
    durationMs: number;
    exitCode: 0;
    implementationSourceSha256: string;
    dependencyLockSha256: string;
    toolchainArtifactSha256: string;
    executableSha256: string;
    observationLimit: "host_process_observed_in_process_operation_not_independent_replay";
    implementationHashesStableAcrossCalculation: true;
  };
  outputDirectory: {
    absolutePath: string;
    prestate: "absent_observed_before_exclusive_create";
    creation: "directory_created_exclusively";
    freshness: "new";
  };
  outputs: Nhm2ConformallyFlatNeedleMetricDemandOutputFileV1[];
  priorTerminalObservation: {
    authority: "unauthenticated_partial_terminal_output_observation";
    outputDirectoryAbsolutePath: string;
    configurationSha256: string;
    implementationSourceSha256: null;
    executorReceiptPresent: false;
    numericalGate: "frozen_enclosure_target_failed_without_retuning";
    maximumRelativeFrobeniusEnclosure: 0.12854082269732725;
    frozenRelativeEnclosureTarget: 0.01;
    outputs: Nhm2ConformallyFlatNeedleMetricDemandPriorTerminalOutputV1[];
  };
  bitwiseReproduction: {
    centralTensorSha256Identical: true;
    deterministicErrorBoundSha256Identical: true;
    intervalTraceSha256Identical: true;
    allThreeOutputsBitwiseIdentical: true;
  };
  resourceObservation: {
    requestedNodeHeapCeilingMegabytes: 2304;
    nodeHeapCeilingProcessArgumentObserved: true;
    observedNodeHeapLimitBytes: number;
    callerDeclaredExternalWallTimeCeilingMs: 600000;
    externalWallTimeEnforcement: "caller_wrapper_declared_not_in_process_verified";
    traceMaximumBytes: 8388608;
    traceSizeBytes: number;
    processPeakRssBytes: number | null;
    peakRssObservationScope: "host_process_lifetime_not_run_exclusive";
    resourceEnvelopeIndependentlyVerified: false;
  };
  derivationReceipt: Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1;
  candidateInputAdmissible: false;
  scientificCandidateDisposition: "numerical_enclosure_protocol_failure_not_scientific_candidate_failure";
  frozenEnclosureGate: "frozen_enclosure_target_failed_without_retuning";
  intervalTraceVerificationStatus: "producer_self_check_only_not_server_replayed";
  authorityBlockers: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_AUTHORITY_BLOCKERS;
  claimLocks: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS;
  integrity: {
    hashAlgorithm: "sha256";
    canonicalization: "utf8_lexicographic_object_keys_json_v1";
    receiptSha256: string;
  };
};

type UnsignedRunReceipt = Omit<
  Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
  "integrity"
> & {
  integrity: Omit<
    Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["integrity"],
    "receiptSha256"
  >;
};

export const computeNhm2ConformallyFlatNeedleMetricDemandRunReceiptSha256 = (
  value: UnsignedRunReceipt,
): string =>
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(value),
  );

const SHA256 = /^[a-f0-9]{64}$/;
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const isGitSha1 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

type PlainSnapshot = { ok: true; value: unknown } | { ok: false };

const snapshotExactPlainJsonData = (
  value: unknown,
  ancestors = new Set<object>(),
): PlainSnapshot => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false };
  }
  if (typeof value !== "object" || ancestors.has(value)) return { ok: false };
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return { ok: false };
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) return { ok: false };
    const expectedKeys = [
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      "length",
    ];
    if (
      ownKeys.length !== expectedKeys.length ||
      expectedKeys.some((key, index) => ownKeys[index] !== key)
    ) {
      return { ok: false };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return { ok: false };
      }
      const nested = snapshotExactPlainJsonData(
        descriptor.value,
        nextAncestors,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    const length = descriptors.length;
    if (
      length == null ||
      !("value" in length) ||
      length.value !== value.length ||
      length.enumerable !== false
    ) {
      return { ok: false };
    }
    return { ok: true, value: output };
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) return { ok: false };
  if (
    ["__proto__", "constructor", "prototype"].some((key) =>
      Object.hasOwn(descriptors, key),
    )
  ) {
    return { ok: false };
  }
  const output: Record<string, unknown> = {};
  for (const key of ownKeys as string[]) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return { ok: false };
    }
    const nested = snapshotExactPlainJsonData(descriptor.value, nextAncestors);
    if (!nested.ok) return nested;
    output[key] = nested.value;
  }
  return { ok: true, value: output };
};

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => expected.includes(key))
  );
};

const RUN_ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "authority",
  "status",
  "runMode",
  "configurationSha256",
  "executionObservation",
  "outputDirectory",
  "outputs",
  "priorTerminalObservation",
  "bitwiseReproduction",
  "resourceObservation",
  "derivationReceipt",
  "candidateInputAdmissible",
  "scientificCandidateDisposition",
  "frozenEnclosureGate",
  "intervalTraceVerificationStatus",
  "authorityBlockers",
  "claimLocks",
  "integrity",
] as const;
const EXECUTION_KEYS = [
  "invocationId",
  "repositoryRoot",
  "gitCommitSha",
  "gitWorktreeState",
  "command",
  "argv",
  "startedAt",
  "completedAt",
  "durationMs",
  "exitCode",
  "implementationSourceSha256",
  "dependencyLockSha256",
  "toolchainArtifactSha256",
  "executableSha256",
  "observationLimit",
  "implementationHashesStableAcrossCalculation",
] as const;
const OUTPUT_DIRECTORY_KEYS = [
  "absolutePath",
  "prestate",
  "creation",
  "freshness",
] as const;
const OUTPUT_KEYS = [
  "role",
  "relativePath",
  "absolutePath",
  "sha256",
  "sizeBytes",
  "freshness",
  "prestate",
  "secureReadbackVerified",
  "filesystemIdentity",
] as const;
const FILESYSTEM_IDENTITY_KEYS = [
  "dev",
  "ino",
  "sizeBytes",
  "mtimeNs",
  "ctimeNs",
] as const;
const INTEGRITY_KEYS = [
  "hashAlgorithm",
  "canonicalization",
  "receiptSha256",
] as const;
const PRIOR_OBSERVATION_KEYS = [
  "authority",
  "outputDirectoryAbsolutePath",
  "configurationSha256",
  "implementationSourceSha256",
  "executorReceiptPresent",
  "numericalGate",
  "maximumRelativeFrobeniusEnclosure",
  "frozenRelativeEnclosureTarget",
  "outputs",
] as const;
const PRIOR_OUTPUT_KEYS = [
  "role",
  "relativePath",
  "absolutePath",
  "sha256",
  "sizeBytes",
  "freshness",
  "filesystemIdentity",
] as const;
const BITWISE_REPRODUCTION_KEYS = [
  "centralTensorSha256Identical",
  "deterministicErrorBoundSha256Identical",
  "intervalTraceSha256Identical",
  "allThreeOutputsBitwiseIdentical",
] as const;
const RESOURCE_OBSERVATION_KEYS = [
  "requestedNodeHeapCeilingMegabytes",
  "nodeHeapCeilingProcessArgumentObserved",
  "observedNodeHeapLimitBytes",
  "callerDeclaredExternalWallTimeCeilingMs",
  "externalWallTimeEnforcement",
  "traceMaximumBytes",
  "traceSizeBytes",
  "processPeakRssBytes",
  "peakRssObservationScope",
  "resourceEnvelopeIndependentlyVerified",
] as const;
const DERIVATION_ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "candidateId",
  "inputBindings",
  "derivation",
  "implementation",
  "execution",
  "outputs",
  "verificationStatus",
  "claimLocks",
  "integrity",
] as const;
const DERIVATION_INPUT_BINDING_KEYS = [
  "geometrySha256",
  "chartSha256",
  "samplingBasisSha256",
  "smearingDefinitionSha256",
  "normalizationSha256",
  "tolerancePolicySha256",
] as const;
const DERIVATION_KEYS = [
  "formulaId",
  "algorithmId",
  "enclosureMethod",
  "coverage",
  "relativeEnclosureTarget",
  "boundScope",
  "zeroBoundDisposition",
  "constants",
  "intervalTraceSha256",
] as const;
const DERIVATION_CONSTANT_KEYS = [
  "speedOfLightMetersPerSecond",
  "newtonianGravitationalConstantSI",
  "newtonianGravitationalConstantStandardUncertaintySI",
  "einsteinCouplingConvention",
] as const;
const DERIVATION_IMPLEMENTATION_KEYS = [
  "sourceSha256",
  "dependencyLockSha256",
  "toolchainArtifactSha256",
  "executableSha256",
] as const;
const DERIVATION_EXECUTION_KEYS = [
  "authority",
  "gitCommitSha",
  "command",
  "argv",
  "startedAt",
  "completedAt",
  "durationMs",
  "exitCode",
] as const;
const DERIVATION_OUTPUTS_KEYS = [
  "centralTensor",
  "deterministicAbsoluteErrorBound",
  "intervalTrace",
] as const;
const DERIVATION_CENTRAL_OUTPUT_KEYS = [
  "inputId",
  "sha256",
  "sizeBytes",
  "freshness",
] as const;
const DERIVATION_ERROR_OUTPUT_KEYS = [
  "inputId",
  "sha256",
  "sizeBytes",
  "unit",
  "shape",
  "componentOrder",
  "freshness",
] as const;
const DERIVATION_TRACE_OUTPUT_KEYS = [
  "sha256",
  "sizeBytes",
  "freshness",
] as const;

const isExactAbsoluteChildPath = (
  root: unknown,
  relativePath: string,
  candidate: unknown,
): boolean =>
  typeof root === "string" &&
  path.isAbsolute(root) &&
  typeof candidate === "string" &&
  path.isAbsolute(candidate) &&
  path.resolve(candidate) === path.resolve(root, relativePath) &&
  path.dirname(path.resolve(candidate)) === path.resolve(root);

const hasValidFilesystemIdentity = (value: unknown): boolean =>
  isRecord(value) &&
  hasExactKeys(value, FILESYSTEM_IDENTITY_KEYS) &&
  FILESYSTEM_IDENTITY_KEYS.every(
    (key) => typeof value[key] === "string" && /^\d+$/.test(String(value[key])),
  );

const isCanonicalIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const canonicalEquals = (left: unknown, right: unknown): boolean =>
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson(left) ===
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson(right);

export const hasValidNhm2ConformallyFlatNeedleMetricDemandRunReceiptIntegrity =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1 => {
    try {
      const snapshot = snapshotExactPlainJsonData(value);
      if (!snapshot.ok || !isRecord(snapshot.value)) return false;
      const receipt = snapshot.value;
      const execution = (
        isRecord(receipt.executionObservation)
          ? receipt.executionObservation
          : null
      ) as
        | Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["executionObservation"]
        | null;
      const outputDirectory = isRecord(receipt.outputDirectory)
        ? receipt.outputDirectory
        : null;
      const integrityRecord = (
        isRecord(receipt.integrity) ? receipt.integrity : null
      ) as
        | Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1["integrity"]
        | null;
      const outputs = Array.isArray(receipt.outputs) ? receipt.outputs : [];
      const priorObservation = isRecord(receipt.priorTerminalObservation)
        ? receipt.priorTerminalObservation
        : null;
      const priorOutputs = Array.isArray(priorObservation?.outputs)
        ? priorObservation.outputs
        : [];
      const bitwiseReproduction = isRecord(receipt.bitwiseReproduction)
        ? receipt.bitwiseReproduction
        : null;
      const resourceObservation = isRecord(receipt.resourceObservation)
        ? receipt.resourceObservation
        : null;
      const expectedOutputs = [
        {
          role: "metric_demand_tensor",
          relativePath:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
          sizeBytes:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
        },
        {
          role: "metric_demand_absolute_error_bound",
          relativePath:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
          sizeBytes:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
        },
        {
          role: "metric_demand_interval_trace",
          relativePath:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
          sizeBytes: null,
        },
        {
          role: "metric_demand_derivation_receipt",
          relativePath:
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
          sizeBytes: null,
        },
      ] as const;
      const outputsValid =
        outputDirectory != null &&
        outputs.length === expectedOutputs.length &&
        outputs.every((output, index) => {
          const expected = expectedOutputs[index];
          if (!isRecord(output) || !hasExactKeys(output, OUTPUT_KEYS)) {
            return false;
          }
          const filesystemIdentity = isRecord(output.filesystemIdentity)
            ? output.filesystemIdentity
            : null;
          return (
            output.role === expected.role &&
            output.relativePath === expected.relativePath &&
            isExactAbsoluteChildPath(
              outputDirectory.absolutePath,
              expected.relativePath,
              output.absolutePath,
            ) &&
            isSha256(output.sha256) &&
            Number.isSafeInteger(output.sizeBytes) &&
            Number(output.sizeBytes) > 0 &&
            (expected.sizeBytes == null ||
              output.sizeBytes === expected.sizeBytes) &&
            output.freshness === "created_new_during_execution" &&
            output.prestate === "absent_observed_before_exclusive_create" &&
            output.secureReadbackVerified === true &&
            hasValidFilesystemIdentity(filesystemIdentity)
          );
        });
      const outputPathsUnique =
        new Set(outputs.map((output) => output.relativePath)).size ===
          outputs.length &&
        new Set(
          outputs.map((output) =>
            String(
              (output as Record<string, unknown>).absolutePath,
            ).toLocaleLowerCase("en-US"),
          ),
        ).size === outputs.length;
      const priorOutputsValid =
        priorObservation != null &&
        typeof priorObservation.outputDirectoryAbsolutePath === "string" &&
        path.isAbsolute(priorObservation.outputDirectoryAbsolutePath) &&
        priorOutputs.length ===
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION
            .outputs.length &&
        priorOutputs.every((output, index) => {
          const expected =
            NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION
              .outputs[index];
          return (
            expected != null &&
            isRecord(output) &&
            hasExactKeys(output, PRIOR_OUTPUT_KEYS) &&
            output.role === expected.role &&
            output.relativePath === expected.relativePath &&
            isExactAbsoluteChildPath(
              priorObservation.outputDirectoryAbsolutePath,
              expected.relativePath,
              output.absolutePath,
            ) &&
            output.sha256 === expected.sha256 &&
            output.sizeBytes === expected.sizeBytes &&
            output.freshness ===
              "preexisting_terminal_partial_securely_reread_for_reproduction" &&
            hasValidFilesystemIdentity(output.filesystemIdentity)
          );
        });
      const derivation = isRecord(receipt.derivationReceipt)
        ? receipt.derivationReceipt
        : null;
      const derivationInputBindings = isRecord(derivation?.inputBindings)
        ? derivation.inputBindings
        : null;
      const derivationDefinition = isRecord(derivation?.derivation)
        ? derivation.derivation
        : null;
      const derivationConstants = isRecord(derivationDefinition?.constants)
        ? derivationDefinition.constants
        : null;
      const derivationImplementation = isRecord(derivation?.implementation)
        ? derivation.implementation
        : null;
      const derivationExecution = (
        isRecord(derivation?.execution) ? derivation.execution : null
      ) as
        Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1["execution"] | null;
      const derivationOutputs = isRecord(derivation?.outputs)
        ? derivation.outputs
        : null;
      const derivationCentralOutput = isRecord(derivationOutputs?.centralTensor)
        ? derivationOutputs.centralTensor
        : null;
      const derivationErrorOutput = isRecord(
        derivationOutputs?.deterministicAbsoluteErrorBound,
      )
        ? derivationOutputs.deterministicAbsoluteErrorBound
        : null;
      const derivationTraceOutput = isRecord(derivationOutputs?.intervalTrace)
        ? derivationOutputs.intervalTrace
        : null;
      const derivationIntegrity = isRecord(derivation?.integrity)
        ? derivation.integrity
        : null;
      const derivationReceiptIntegrityValid = (() => {
        if (
          !isRecord(derivationIntegrity) ||
          !isSha256(derivationIntegrity.receiptSha256)
        ) {
          return false;
        }
        const { receiptSha256, ...unsignedIntegrity } = derivationIntegrity;
        return (
          receiptSha256 ===
          sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
            canonicalNhm2ConformallyFlatNeedleMetricDemandJson({
              ...derivation,
              integrity: unsignedIntegrity,
            }),
          )
        );
      })();
      const derivationCanonicalBytes =
        derivation == null
          ? null
          : Buffer.from(
              canonicalNhm2ConformallyFlatNeedleMetricDemandJson(derivation),
              "utf8",
            );
      if (
        !hasExactKeys(receipt, RUN_ROOT_KEYS) ||
        execution == null ||
        !hasExactKeys(execution, EXECUTION_KEYS) ||
        outputDirectory == null ||
        !hasExactKeys(outputDirectory, OUTPUT_DIRECTORY_KEYS) ||
        typeof outputDirectory.absolutePath !== "string" ||
        !path.isAbsolute(outputDirectory.absolutePath) ||
        outputDirectory.prestate !==
          "absent_observed_before_exclusive_create" ||
        outputDirectory.creation !== "directory_created_exclusively" ||
        outputDirectory.freshness !== "new" ||
        integrityRecord == null ||
        !hasExactKeys(integrityRecord, INTEGRITY_KEYS) ||
        receipt.artifactId !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_ARTIFACT_ID ||
        receipt.contractVersion !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_CONTRACT_VERSION ||
        receipt.authority !== "server_executor_observation_diagnostic_only" ||
        receipt.status !== "outputs_exclusively_created_and_securely_reread" ||
        receipt.runMode !==
          "receipt_capture_reproduction_of_terminal_v2_failure" ||
        receipt.configurationSha256 !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
        receipt.intervalTraceVerificationStatus !==
          "producer_self_check_only_not_server_replayed" ||
        receipt.candidateInputAdmissible !== false ||
        receipt.scientificCandidateDisposition !==
          "numerical_enclosure_protocol_failure_not_scientific_candidate_failure" ||
        receipt.frozenEnclosureGate !==
          "frozen_enclosure_target_failed_without_retuning" ||
        !isSha256(integrityRecord.receiptSha256) ||
        integrityRecord.hashAlgorithm !== "sha256" ||
        integrityRecord.canonicalization !==
          "utf8_lexicographic_object_keys_json_v1" ||
        !isSha256(execution.invocationId) ||
        !isGitSha1(execution.gitCommitSha) ||
        !isSha256(execution.implementationSourceSha256) ||
        !isSha256(execution.dependencyLockSha256) ||
        !isSha256(execution.toolchainArtifactSha256) ||
        !isSha256(execution.executableSha256) ||
        typeof execution.repositoryRoot !== "string" ||
        !path.isAbsolute(execution.repositoryRoot) ||
        typeof execution.command !== "string" ||
        execution.command.length === 0 ||
        !Array.isArray(execution.argv) ||
        execution.argv.some((entry) => typeof entry !== "string") ||
        !isCanonicalIsoTimestamp(execution.startedAt) ||
        !isCanonicalIsoTimestamp(execution.completedAt) ||
        Date.parse(execution.startedAt) > Date.parse(execution.completedAt) ||
        (execution.gitWorktreeState !== "clean" &&
          execution.gitWorktreeState !== "dirty") ||
        execution.exitCode !== 0 ||
        !Number.isFinite(execution.durationMs) ||
        execution.durationMs < 0 ||
        execution.observationLimit !==
          "host_process_observed_in_process_operation_not_independent_replay" ||
        execution.implementationHashesStableAcrossCalculation !== true ||
        !outputsValid ||
        !outputPathsUnique ||
        priorObservation == null ||
        !hasExactKeys(priorObservation, PRIOR_OBSERVATION_KEYS) ||
        priorObservation.authority !==
          "unauthenticated_partial_terminal_output_observation" ||
        priorObservation.outputDirectoryAbsolutePath ===
          outputDirectory.absolutePath ||
        priorObservation.configurationSha256 !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
        priorObservation.implementationSourceSha256 !== null ||
        priorObservation.executorReceiptPresent !== false ||
        priorObservation.numericalGate !==
          "frozen_enclosure_target_failed_without_retuning" ||
        !Object.is(
          priorObservation.maximumRelativeFrobeniusEnclosure,
          0.12854082269732725,
        ) ||
        priorObservation.frozenRelativeEnclosureTarget !== 0.01 ||
        !priorOutputsValid ||
        bitwiseReproduction == null ||
        !hasExactKeys(bitwiseReproduction, BITWISE_REPRODUCTION_KEYS) ||
        BITWISE_REPRODUCTION_KEYS.some(
          (key) => bitwiseReproduction[key] !== true,
        ) ||
        resourceObservation == null ||
        !hasExactKeys(resourceObservation, RESOURCE_OBSERVATION_KEYS) ||
        resourceObservation.requestedNodeHeapCeilingMegabytes !== 2304 ||
        resourceObservation.nodeHeapCeilingProcessArgumentObserved !== true ||
        !Number.isSafeInteger(resourceObservation.observedNodeHeapLimitBytes) ||
        Number(resourceObservation.observedNodeHeapLimitBytes) <= 0 ||
        resourceObservation.callerDeclaredExternalWallTimeCeilingMs !==
          600000 ||
        resourceObservation.externalWallTimeEnforcement !==
          "caller_wrapper_declared_not_in_process_verified" ||
        resourceObservation.traceMaximumBytes !== 8388608 ||
        !Number.isSafeInteger(resourceObservation.traceSizeBytes) ||
        Number(resourceObservation.traceSizeBytes) <= 0 ||
        Number(resourceObservation.traceSizeBytes) > 8388608 ||
        (resourceObservation.processPeakRssBytes !== null &&
          (!Number.isSafeInteger(resourceObservation.processPeakRssBytes) ||
            Number(resourceObservation.processPeakRssBytes) <= 0)) ||
        resourceObservation.peakRssObservationScope !==
          "host_process_lifetime_not_run_exclusive" ||
        resourceObservation.resourceEnvelopeIndependentlyVerified !== false ||
        !isRecord(outputs[2]) ||
        resourceObservation.traceSizeBytes !== outputs[2].sizeBytes ||
        outputs
          .slice(0, 3)
          .some(
            (output, index) =>
              !isRecord(output) ||
              !isRecord(priorOutputs[index]) ||
              output.sha256 !== priorOutputs[index].sha256,
          ) ||
        derivation == null ||
        !hasExactKeys(derivation, DERIVATION_ROOT_KEYS) ||
        derivation.artifactId !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
        derivation.contractVersion !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
        derivation.candidateId !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID ||
        derivation.verificationStatus !==
          "metric_demand_derivation_executor_provenance_unverified" ||
        derivationInputBindings == null ||
        !hasExactKeys(derivationInputBindings, DERIVATION_INPUT_BINDING_KEYS) ||
        !canonicalEquals(
          derivationInputBindings,
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
        ) ||
        derivationDefinition == null ||
        !hasExactKeys(derivationDefinition, DERIVATION_KEYS) ||
        derivationDefinition.formulaId !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID ||
        derivationDefinition.algorithmId !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID ||
        derivationDefinition.enclosureMethod !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD ||
        derivationDefinition.coverage !==
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE ||
        derivationDefinition.relativeEnclosureTarget !== 0.01 ||
        derivationDefinition.boundScope !==
          "deterministic_numerical_error_only_physical_constant_uncertainty_excluded" ||
        derivationDefinition.zeroBoundDisposition !==
          "strictly_positive_componentwise_bounds_required_pending_exact_zero_derivation_replay" ||
        derivationDefinition.intervalTraceSha256 !== outputs[2]?.sha256 ||
        derivationConstants == null ||
        !hasExactKeys(derivationConstants, DERIVATION_CONSTANT_KEYS) ||
        derivationConstants.speedOfLightMetersPerSecond !== 299792458 ||
        derivationConstants.newtonianGravitationalConstantSI !== 6.6743e-11 ||
        derivationConstants.newtonianGravitationalConstantStandardUncertaintySI !==
          1.5e-15 ||
        derivationConstants.einsteinCouplingConvention !==
          "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab" ||
        derivationImplementation == null ||
        !hasExactKeys(
          derivationImplementation,
          DERIVATION_IMPLEMENTATION_KEYS,
        ) ||
        derivationImplementation.sourceSha256 !==
          execution.implementationSourceSha256 ||
        derivationImplementation.dependencyLockSha256 !==
          execution.dependencyLockSha256 ||
        derivationImplementation.toolchainArtifactSha256 !==
          execution.toolchainArtifactSha256 ||
        derivationImplementation.executableSha256 !==
          execution.executableSha256 ||
        derivationExecution == null ||
        !hasExactKeys(derivationExecution, DERIVATION_EXECUTION_KEYS) ||
        derivationExecution.authority !== "executor_observed" ||
        derivationExecution.gitCommitSha !== execution.gitCommitSha ||
        derivationExecution.command !== execution.command ||
        !canonicalEquals(derivationExecution.argv, execution.argv) ||
        derivationExecution.startedAt !== execution.startedAt ||
        !isCanonicalIsoTimestamp(derivationExecution.completedAt) ||
        Date.parse(derivationExecution.completedAt) <
          Date.parse(execution.startedAt) ||
        Date.parse(derivationExecution.completedAt) >
          Date.parse(execution.completedAt) ||
        !Number.isFinite(derivationExecution.durationMs) ||
        derivationExecution.durationMs < 0 ||
        derivationExecution.exitCode !== 0 ||
        derivationOutputs == null ||
        !hasExactKeys(derivationOutputs, DERIVATION_OUTPUTS_KEYS) ||
        derivationCentralOutput == null ||
        !hasExactKeys(
          derivationCentralOutput,
          DERIVATION_CENTRAL_OUTPUT_KEYS,
        ) ||
        derivationCentralOutput.inputId !== "metric_demand_tensor" ||
        derivationCentralOutput.sha256 !== outputs[0]?.sha256 ||
        derivationCentralOutput.sizeBytes !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES ||
        derivationCentralOutput.freshness !==
          "created_or_modified_during_execution" ||
        derivationErrorOutput == null ||
        !hasExactKeys(derivationErrorOutput, DERIVATION_ERROR_OUTPUT_KEYS) ||
        derivationErrorOutput.inputId !==
          "metric_demand_absolute_error_bound" ||
        derivationErrorOutput.sha256 !== outputs[1]?.sha256 ||
        derivationErrorOutput.sizeBytes !==
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES ||
        derivationErrorOutput.unit !== "J/m^3" ||
        !canonicalEquals(derivationErrorOutput.shape, [64, 10]) ||
        !canonicalEquals(
          derivationErrorOutput.componentOrder,
          NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
        ) ||
        derivationErrorOutput.freshness !==
          "created_or_modified_during_execution" ||
        derivationTraceOutput == null ||
        !hasExactKeys(derivationTraceOutput, DERIVATION_TRACE_OUTPUT_KEYS) ||
        derivationTraceOutput.sha256 !== outputs[2]?.sha256 ||
        derivationTraceOutput.sizeBytes !==
          (outputs[2] as Record<string, unknown> | undefined)?.sizeBytes ||
        derivationTraceOutput.freshness !==
          "created_or_modified_during_execution" ||
        !isRecord(derivation.claimLocks) ||
        !canonicalEquals(
          derivation.claimLocks,
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
        ) ||
        derivationIntegrity == null ||
        !hasExactKeys(derivationIntegrity, INTEGRITY_KEYS) ||
        derivationIntegrity.hashAlgorithm !== "sha256" ||
        derivationIntegrity.canonicalization !==
          "utf8_lexicographic_object_keys_json_v1" ||
        !derivationReceiptIntegrityValid ||
        derivationCanonicalBytes == null ||
        !isRecord(outputs[3]) ||
        outputs[3].sha256 !==
          sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
            derivationCanonicalBytes,
          ) ||
        outputs[3].sizeBytes !== derivationCanonicalBytes.byteLength ||
        !canonicalEquals(
          receipt.authorityBlockers,
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_AUTHORITY_BLOCKERS,
        ) ||
        !canonicalEquals(
          receipt.claimLocks,
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
        )
      ) {
        return false;
      }
      const typedReceipt =
        receipt as Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1;
      const { receiptSha256, ...integrity } = typedReceipt.integrity;
      return (
        receiptSha256 ===
        computeNhm2ConformallyFlatNeedleMetricDemandRunReceiptSha256({
          ...typedReceipt,
          integrity,
        })
      );
    } catch {
      return false;
    }
  };

export {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
};
