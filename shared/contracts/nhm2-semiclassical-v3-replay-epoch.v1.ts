import { createHash } from "node:crypto";

export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_ARTIFACT_ID =
  "nhm2.semiclassical_v3_replay_epoch" as const;
export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_replay_epoch/v1" as const;
export const NHM2_SEMICLASSICAL_V3_REPLAY_POLICY_ID =
  "nhm2.server_owned.semiclassical_v3.diagnostic_replay/v1" as const;

export const NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT = 64 as const;
export const NHM2_SEMICLASSICAL_V3_TENSOR_COMPONENT_COUNT = 10 as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER = Object.freeze([
  "hamiltonian",
  "momentum_x",
  "momentum_y",
  "momentum_z",
] as const);
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS = Object.freeze([
  Object.freeze({ ordinal: 0, levelId: "level_0", hExact: "1/16", h: 1 / 16 }),
  Object.freeze({ ordinal: 1, levelId: "level_1", hExact: "1/32", h: 1 / 32 }),
  Object.freeze({ ordinal: 2, levelId: "level_2", hExact: "1/64", h: 1 / 64 }),
] as const);
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER = Object.freeze([
  "H_H",
  "H_Hi",
  "Hi_Hj",
  "antisymmetry",
  "jacobi",
] as const);
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER = Object.freeze({
  H_H: Object.freeze([
    "computed",
    "target",
    "residual",
    "absolute_uncertainty95",
  ] as const),
  H_Hi: Object.freeze([
    "computed",
    "target",
    "residual",
    "absolute_uncertainty95",
  ] as const),
  Hi_Hj: Object.freeze([
    "computed",
    "target",
    "residual",
    "absolute_uncertainty95",
  ] as const),
  antisymmetry: Object.freeze([
    "forward",
    "reverse",
    "residual",
    "absolute_uncertainty95",
  ] as const),
  jacobi: Object.freeze([
    "term_1",
    "term_2",
    "term_3",
    "residual",
    "absolute_uncertainty95",
  ] as const),
} as const);
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT = 63 as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_COUNT =
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER.length;
export const NHM2_SEMICLASSICAL_V3_REGULATOR_LEVEL_COUNT =
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.length;

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY = Object.freeze(
  {
    artifactId: "nhm2.semiclassical_v3_constraint_arithmetic_policy" as const,
    contractVersion:
      "nhm2_semiclassical_v3_constraint_arithmetic_policy/v1" as const,
    policyId:
      "nhm2.server_owned.semiclassical_v3.constraint_arithmetic/v1" as const,
    residualFormulas: Object.freeze({
      H_H: "server_residual=computed-target",
      H_Hi: "server_residual=computed-target",
      Hi_Hj: "server_residual=computed-target",
      antisymmetry: "server_residual=forward+reverse",
      jacobi: "server_residual=term_1+term_2+term_3",
    }),
    producerResidualConsistencyTolerance: 1e-12,
    centralResidualUpper95Tolerance: 0.1,
    finalRegulatorErrorUpper95Tolerance: 0.1,
    monotonicityAbsoluteTolerance: 1e-12,
    requiredMinimumOrder: 1,
    uncertaintyCoverage:
      "joint_simultaneous_95_percent_or_stronger_deterministic_enclosure_across_all_levels_families_samples_channels" as const,
    interlevelBounds: Object.freeze({
      D01Lower: "max_i(max(0,abs(R_level_0-R_level_1)-(U_level_0+U_level_1)))",
      D01Upper: "max_i(abs(R_level_0-R_level_1)+U_level_0+U_level_1)",
      D12Lower: "max_i(max(0,abs(R_level_1-R_level_2)-(U_level_1+U_level_2)))",
      D12Upper: "max_i(abs(R_level_1-R_level_2)+U_level_1+U_level_2)",
    }),
    conservativeOrderLower: "log(D01Lower/D12Upper)/log(2)",
    orderGate: "D01Lower>0_and_D12Upper>0_and_pLower>=1",
    monotonicityGate: "D12Upper<=D01Lower+1e-12",
    conservativeErrorRoles: Object.freeze({
      E0: "2*abs(R_level_0-R_level_1)",
      E1: "2*abs(R_level_1-R_level_2)",
      E2: "abs(R_level_1-R_level_2)",
      UE0: "2*(U_level_0+U_level_1)",
      UE1: "2*(U_level_1+U_level_2)",
      UE2: "U_level_1+U_level_2",
    }),
    errorUpper95ByLevel:
      "q_k=max_over_samples_channels(abs(E_k)+UE_k)" as const,
    exactZeroDisposition:
      "blocked_as_order_inconclusive_without_synthetic_floor" as const,
    targetDerivationMustBeServerReplayed: true as const,
    submittedResidualIsConsistencyOnly: true as const,
  },
);

export const NHM2_SEMICLASSICAL_V3_NONCONSTRAINT_OUTPUT_ROLES = Object.freeze([
  "noise_kernel",
  "noise_kernel_absolute_uncertainty95",
  "mean_rset",
  "mean_rset_absolute_uncertainty95",
  "smearing_weights",
] as const);

export const NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS = Object.freeze([
  "candidate_manifest",
  "geometry",
  "quantum_state",
  "chart",
  "normalization",
  "tolerance_policy",
  "smearing_definition",
  "sampling_basis",
  "field_model",
  "lagrangian",
  "field_equations",
  "boundary_conditions",
  "state_construction",
  "renormalization_prescription",
  "renormalization_counterterms",
  "finite_renormalization_freedom",
  "constraint_formulation",
  "constraint_probe_definition",
  "constraint_uncertainty_model",
  "regulator_definition",
  "operator_ordering",
  "classical_structure_functions",
  "metric_demand_tensor",
  "metric_demand_absolute_error_bound",
  "metric_demand_derivation_receipt",
] as const);
export const NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS = Object.freeze([
  "implementation_source",
  "dependency_lock",
  "executable",
] as const);
export const NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS = Object.freeze([
  ...NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
  ...NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
]);
export const NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES =
  Object.freeze([
    "constraint_operand_derivation_receipt",
    "constraint_uncertainty_derivation_receipt",
    "constraint_target_derivation_receipt",
  ] as const);
export const NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT =
  3 as const;
export const NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT =
  71 as const;

const constraintOutputRoles = (): string[] =>
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.flatMap((level) =>
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER.flatMap((familyId) =>
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER[familyId].map(
        (operandRole) =>
          `constraint_operand.${level.levelId}.${familyId}.${operandRole}`,
      ),
    ),
  );

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES = Object.freeze(
  constraintOutputRoles(),
);
export const NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES = Object.freeze([
  ...NHM2_SEMICLASSICAL_V3_NONCONSTRAINT_OUTPUT_ROLES,
  ...NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
]);

export const NHM2_SEMICLASSICAL_V3_NONCONSTRAINT_OUTPUT_ARRAY_COUNT =
  5 as const;
export const NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT = 68 as const;
export const NHM2_SEMICLASSICAL_V3_METRIC_DEMAND_INPUT_ARRAY_COUNT = 2 as const;
export const NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT = 70 as const;

const noiseKernelValueCount =
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V3_TENSOR_COMPONENT_COUNT *
  NHM2_SEMICLASSICAL_V3_TENSOR_COMPONENT_COUNT;
const tensorSampleValueCount =
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V3_TENSOR_COMPONENT_COUNT;
const constraintArrayValueCount =
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_COUNT;

export const NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT =
  2 * noiseKernelValueCount +
  2 * tensorSampleValueCount +
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT +
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT * constraintArrayValueCount;
export const NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES =
  NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT *
  Float64Array.BYTES_PER_ELEMENT;
export const NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT =
  NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT +
  NHM2_SEMICLASSICAL_V3_METRIC_DEMAND_INPUT_ARRAY_COUNT *
    tensorSampleValueCount;
export const NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES =
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT *
  Float64Array.BYTES_PER_ELEMENT;

export type Nhm2SemiclassicalV3ReplayLeafValueKind =
  "boolean" | "integer" | "number" | "nullable_number" | "string";

export type Nhm2SemiclassicalV3ReplayMetricLeaf = Readonly<{
  leafId: string;
  valueKind: Nhm2SemiclassicalV3ReplayLeafValueKind;
}>;

const replayLeaf = (
  leafId: string,
  valueKind: Nhm2SemiclassicalV3ReplayLeafValueKind,
): Nhm2SemiclassicalV3ReplayMetricLeaf => Object.freeze({ leafId, valueKind });

const residualMetricLeaves = (prefix: string) => [
  replayLeaf(`${prefix}.residualLInf`, "number"),
  replayLeaf(`${prefix}.absoluteUncertainty95`, "number"),
  replayLeaf(`${prefix}.residualUpper95`, "number"),
  replayLeaf(`${prefix}.producerResidualMismatchLInf`, "number"),
  replayLeaf(`${prefix}.tolerance`, "number"),
];

const nonRegulatorLeaves = Object.freeze([
  replayLeaf("metrics.inputContent.float64ArrayCount", "integer"),
  replayLeaf("metrics.inputContent.float64ValueCount", "integer"),
  replayLeaf("metrics.inputContent.allValuesFinite", "boolean"),
  replayLeaf(
    "metrics.inputContent.allAbsoluteUncertaintiesNonnegative",
    "boolean",
  ),
  replayLeaf("metrics.inputContent.buffersUniqueAndNonShared", "boolean"),
  replayLeaf("metrics.inputContent.arraysAreFullBufferViews", "boolean"),
  replayLeaf("metrics.noise.sampleCount", "integer"),
  replayLeaf("metrics.noise.covarianceDimension", "integer"),
  replayLeaf("metrics.noise.exchangeResidualUpper95SI", "number"),
  replayLeaf("metrics.noise.exchangeToleranceSI", "number"),
  replayLeaf("metrics.noise.exchangeSymmetryBasis", "string"),
  replayLeaf("metrics.noise.symmetricTensorBasis", "string"),
  replayLeaf("metrics.noise.covarianceSmearingMethod", "string"),
  replayLeaf("metrics.noise.psdCertificateMethod", "string"),
  replayLeaf("metrics.noise.psdInput", "string"),
  replayLeaf("metrics.noise.psdCertificationDisposition", "string"),
  replayLeaf("metrics.noise.psdDiagonalShiftSI", "number"),
  replayLeaf("metrics.noise.psdResidualAllowanceSI", "number"),
  replayLeaf("metrics.noise.minimumShiftedCholeskyPivotSI", "nullable_number"),
  replayLeaf("metrics.noise.psdToleranceSI", "number"),
  replayLeaf(
    "metrics.noise.factorizationResidualInfinityNormUpperSI",
    "nullable_number",
  ),
  replayLeaf("metrics.noise.factorizationRoundoffModel", "string"),
  replayLeaf("metrics.noise.maximumZeroPivotCouplingResidualSI", "number"),
  replayLeaf(
    "metrics.noise.negativeWitnessRayleighQuotientSI",
    "nullable_number",
  ),
  replayLeaf("metrics.noise.maximumGershgorinRadiusUpper95SI", "number"),
  replayLeaf("metrics.noise.maximumEigenvalueUpper95SI", "number"),
  replayLeaf(
    "metrics.noise.covarianceTolerancePositiveSemidefiniteCertified",
    "boolean",
  ),
  replayLeaf("metrics.mean.smearingWeightSum", "number"),
  ...Array.from({ length: 10 }, (_, index) =>
    replayLeaf(`metrics.mean.smearedTensorComponentsSI[${index}]`, "number"),
  ),
  replayLeaf("metrics.mean.symmetricTensorFrobeniusSI", "number"),
  replayLeaf("metrics.mean.normalizationFloorSI", "number"),
  replayLeaf("metrics.mean.normalizationScaleSI", "number"),
  replayLeaf("metrics.mean.fluctuationAmplitudeUpper95SI", "number"),
  replayLeaf("metrics.mean.fluctuationToMeanRatioUpper95", "number"),
  replayLeaf("metrics.mean.fluctuationRatioTolerance", "number"),
  replayLeaf(
    "metrics.metricDemand.minimumPointwiseSymmetricTensorFrobeniusSI",
    "number",
  ),
  replayLeaf("metrics.metricDemand.argminPointIndex", "integer"),
  replayLeaf(
    "metrics.metricDemand.maximumPointwiseSymmetricTensorFrobeniusSI",
    "number",
  ),
  replayLeaf("metrics.metricDemand.argmaxPointIndex", "integer"),
  replayLeaf(
    "metrics.metricDemand.minimumPointwiseSymmetricTensorFrobeniusLowerBoundSI",
    "number",
  ),
  replayLeaf("metrics.metricDemand.argminLowerBoundPointIndex", "integer"),
  replayLeaf(
    "metrics.metricDemand.maximumPointwiseDeterministicErrorFrobeniusSI",
    "number",
  ),
  replayLeaf(
    "metrics.metricDemand.argmaxDeterministicErrorPointIndex",
    "integer",
  ),
  replayLeaf("metrics.metricDemand.minimumRequiredFrobeniusSI", "number"),
  replayLeaf("metrics.metricDemand.qualifyingSampleCount", "integer"),
  replayLeaf("metrics.metricDemand.qualifyingSampleFraction", "number"),
  replayLeaf("metrics.metricDemand.requiredSampleFraction", "number"),
  replayLeaf("metrics.metricDemand.strictlyNondegenerate", "boolean"),
  replayLeaf("metrics.meanMetricDemandClosure.sampleCount", "integer"),
  replayLeaf(
    "metrics.meanMetricDemandClosure.relativeUpper95Tolerance",
    "number",
  ),
  replayLeaf(
    "metrics.meanMetricDemandClosure.requiredPassingSampleCount",
    "integer",
  ),
  replayLeaf("metrics.meanMetricDemandClosure.passingSampleCount", "integer"),
  replayLeaf(
    "metrics.meanMetricDemandClosure.maximumPointwiseRelativeUpper95",
    "number",
  ),
  replayLeaf("metrics.meanMetricDemandClosure.argmaxPointIndex", "integer"),
  replayLeaf(
    "metrics.meanMetricDemandClosure.residualFrobeniusUpper95AtWorstPointSI",
    "number",
  ),
  replayLeaf(
    "metrics.meanMetricDemandClosure.metricDemandDeterministicErrorFrobeniusAtWorstPointSI",
    "number",
  ),
  replayLeaf(
    "metrics.meanMetricDemandClosure.metricDemandFrobeniusLowerBoundAtWorstPointSI",
    "number",
  ),
  replayLeaf(
    "metrics.meanMetricDemandClosure.denominatorAtWorstPointSI",
    "number",
  ),
  replayLeaf("metrics.meanMetricDemandClosure.argmaxComponentIndex", "integer"),
  replayLeaf(
    "metrics.meanMetricDemandClosure.argmaxComponentContributionRelativeUpper95",
    "number",
  ),
  replayLeaf(
    "metrics.meanMetricDemandClosure.allSamplesWithinTolerance",
    "boolean",
  ),
  ...residualMetricLeaves("metrics.brackets.H_H"),
  ...residualMetricLeaves("metrics.brackets.H_Hi"),
  ...residualMetricLeaves("metrics.brackets.Hi_Hj"),
  ...residualMetricLeaves("metrics.antisymmetry"),
  ...residualMetricLeaves("metrics.jacobi"),
]);

const familyRegulatorLeaves = (familyId: string) => {
  const prefix = `metrics.regulator.families.${familyId}`;
  return [
    ...Array.from({ length: 3 }, (_, index) =>
      replayLeaf(`${prefix}.errorUpper95ByLevel[${index}]`, "number"),
    ),
    ...Array.from({ length: 2 }, (_, index) =>
      replayLeaf(`${prefix}.interlevelDifferenceLower95[${index}]`, "number"),
    ),
    ...Array.from({ length: 2 }, (_, index) =>
      replayLeaf(`${prefix}.interlevelDifferenceUpper95[${index}]`, "number"),
    ),
    replayLeaf(`${prefix}.observedOrderLower95`, "number"),
    replayLeaf(`${prefix}.requiredMinimumOrder`, "number"),
    replayLeaf(`${prefix}.monotone`, "boolean"),
    replayLeaf(`${prefix}.finalErrorUpper95`, "number"),
    replayLeaf(`${prefix}.tolerance`, "number"),
  ];
};

export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE = Object.freeze([
  ...nonRegulatorLeaves,
  replayLeaf("metrics.regulator.levelCount", "integer"),
  ...Array.from({ length: 3 }, (_, index) =>
    replayLeaf(`metrics.regulator.levelScales[${index}]`, "number"),
  ),
  ...NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER.flatMap((familyId) =>
    familyRegulatorLeaves(familyId),
  ),
]);
export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS = Object.freeze(
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE.map(
    (entry) => entry.leafId,
  ),
);
export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT = 159 as const;

export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS = Object.freeze(
  [
    "candidateAdmission",
    "candidateAuthority",
    "scientificCandidateAdmissible",
    "scientificPresealAdmission",
    "scientificPresealAuthority",
    "preexecutionFreezeVerified",
    "rawReplayAdmission",
    "rawReplayAuthority",
    "runReplayAuthority",
    "pairAgreementAuthority",
    "independentImplementationAgreementEstablished",
    "semiclassicalStressNoiseLamp",
    "semiclassicalConstraintAlgebraLamp",
    "diagnosticPass",
    "theoryGraphAuthority",
    "theoryGraphPromotion",
    "theoryClosure",
    "experimentReadyTheoryClosure",
    "currentNhm2MetricIdentity",
    "currentNhm2SourceIdentity",
    "casimirSourceIdentity",
    "empiricalValidation",
    "physicalViability",
    "propulsion",
    "transport",
    "routeEta",
    "certifiedSpeed",
  ] as const,
);

export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS = Object.freeze(
  Object.fromEntries(
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS.map((key) => [
      key,
      false,
    ]),
  ) as Readonly<
    Record<
      (typeof NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS)[number],
      false
    >
  >,
);

const assertReplayEpochInvariants = (): void => {
  const regulatorLeafCount =
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.filter((leafId) =>
      leafId.startsWith("metrics.regulator."),
    ).length;
  if (
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length !== 25 ||
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS.length !== 3 ||
    NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length !== 28 ||
    NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES.length !==
      NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT ||
    new Set(NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES).size !==
      NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.length +
      NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES.length !==
      NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES.length !== 63 ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.length !==
      NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT ||
    new Set(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES).size !==
      NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.length !==
      NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT ||
    new Set(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS).size !==
      NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT ||
    regulatorLeafCount !== 64 ||
    !NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.includes(
      "metrics.regulator.levelScales[2]",
    ) ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.some((leafId) =>
      leafId.startsWith("metrics.regulator.spacing["),
    ) ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT !== 836_672 ||
    NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT !== 837_952
  ) {
    throw new Error("nhm2_semiclassical_v3_replay_epoch_invariant_violation");
  }
};

assertReplayEpochInvariants();

export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-replay-metric-coverage/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-replay-metric-leaf-ids/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-output-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_INPUT_ROLE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-input-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-scientific-input-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-implementation-input-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-derivation-sidecar-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-arithmetic-policy/v1\n" as const;

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};

const sha256Json = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(JSON.stringify(canonicalizeJson(value)), "utf8")
    .digest("hex");

export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256 = sha256Json(
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE,
);
export const NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256 = sha256Json(
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
);
export const NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256 = sha256Json(
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
);
export const NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256 = sha256Json(
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
);
export const NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256 =
  sha256Json(
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_SHA256_DOMAIN,
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
  );
export const NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256 =
  sha256Json(
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_SHA256_DOMAIN,
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
  );
export const NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256 =
  sha256Json(
    NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_SHA256_DOMAIN,
    NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  );
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256 =
  sha256Json(
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256_DOMAIN,
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  );
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_CANONICAL_JSON =
  JSON.stringify(
    canonicalizeJson(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY),
  );
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING =
  Object.freeze({
    artifactId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.artifactId,
    contractVersion:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.contractVersion,
    policyId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.policyId,
    sha256: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256,
    sizeBytes: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY = Object.freeze({
  artifactId: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_ARTIFACT_ID,
  contractVersion: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CONTRACT_VERSION,
  policyId: NHM2_SEMICLASSICAL_V3_REPLAY_POLICY_ID,
  maturity: "integration_contract_only_no_replay_authority" as const,
  sampleCount: NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT,
  regulatorLevelCount: NHM2_SEMICLASSICAL_V3_REGULATOR_LEVEL_COUNT,
  scientificInputCount: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length,
  implementationInputCount:
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS.length,
  totalInputCount: NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length,
  inputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  scientificInputRoleOrderSha256:
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
  implementationInputRoleOrderSha256:
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  inputClosureTopology: Object.freeze({
    sharedScientificPresealInputCount:
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length,
    roleSpecificImplementationInputCount:
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS.length,
    completeRunInputReceiptCount:
      NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length,
    scientificPresealBindsRoleSpecificImplementationBytes: false as const,
    completeRunInputClosureFrozenBeforeExecutionRequired: true as const,
    pairScientificInputClosureMustMatch: true as const,
    pairImplementationInputClosuresMustBeDistinct: true as const,
  }),
  outputArrayCount: NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
  derivationEvidenceSidecarCount:
    NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT,
  derivationEvidenceSidecarRoleOrderSha256:
    NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  solverSciencePayloadFileCount:
    NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
  decodedFloat64ArrayCount: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
  outputFloat64ValueCount: NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT,
  decodedFloat64ValueCount: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT,
  outputSizeBytes: NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES,
  decodedSizeBytes: NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES,
  outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  replayMetricLeafCount: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT,
  replayMetricCoverageSha256:
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
  replayMetricLeafIdsSha256:
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
  constraintArithmeticPolicySha256:
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256,
  constraintUncertainty: Object.freeze({
    submittedRoleName: "absolute_uncertainty95" as const,
    requiredCoverage:
      "joint_simultaneous_95_percent_or_stronger_deterministic_enclosure_across_all_levels_families_samples_channels" as const,
    componentwiseNonnegativeAloneIsCoverageEvidence: false as const,
    coverageDerivationMustBeServerReplayed: true as const,
  }),
  constraintTargetDerivation: Object.freeze({
    computedEqualsTargetWithoutServerReplayedIndependentDerivationForbidden:
      true as const,
    exactEqualityMayBeAdmittedAfterIndependentTargetDerivationReplay:
      true as const,
    rawSubtractionAloneEstablishesDiracTargetDerivation: false as const,
    targetDerivationMustBeServerReplayedFromSealedGeometryAndProbes:
      true as const,
  }),
  retainedResidualMetricProjection: Object.freeze({
    residualLInfAbsoluteUncertainty95ResidualUpper95AndTolerance:
      "central_level_2" as const,
    producerResidualMismatchLInf:
      "maximum_over_all_three_levels_samples_and_channels" as const,
    coarseLevelMismatchCanBeHiddenByCentralProjection: false as const,
  }),
  pairComparison: Object.freeze({
    frozenInputAndDescriptorByteEqualityRequired: true as const,
    independentScientificOutputByteEqualityRequired: false as const,
    independentDerivationSidecarByteEqualityRequired: false as const,
    derivationSidecarSchemaHashAndRunCrossBindingRequired: true as const,
    derivationSidecarSemanticEvidenceAgreementRequired: true as const,
    presealedAbsoluteRelativeAndUncertaintyEnvelopePolicyRequired:
      true as const,
    postObservationToleranceRetuningAllowed: false as const,
  }),
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  migration: Object.freeze({
    legacyV1Accepted: false as const,
    legacyV2Accepted: false as const,
    automaticUpgradeAllowed: false as const,
    oldAggregateRegulatorArraysAccepted: false as const,
    allThreeRegulatorScalesCovered: true as const,
    perFamilyRegulatorConvergenceRequired: true as const,
  }),
  authorityBoundary: Object.freeze({
    manifestIntegrated: false as const,
    secureDecoderIntegrated: false as const,
    serverArithmeticReplayIntegrated: false as const,
    jointUncertaintyCoverageDerivationReplayed: false as const,
    constraintTargetDerivationReplayed: false as const,
    runReplayIntegrated: false as const,
    pairComparisonIntegrated: false as const,
  }),
});

export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_CANONICAL_JSON =
  JSON.stringify(canonicalizeJson(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY));
export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-replay-epoch-policy/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN, "utf8")
  .update(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING = Object.freeze({
  artifactId: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_ARTIFACT_ID,
  contractVersion: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CONTRACT_VERSION,
  policyId: NHM2_SEMICLASSICAL_V3_REPLAY_POLICY_ID,
  sha256: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256,
  sizeBytes: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SIZE_BYTES,
  mediaType: "application/json" as const,
});

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry, seen);
  }
  return Object.freeze(value);
};

deepFreeze(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE);
deepFreeze(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS);
deepFreeze(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES);
