import { createHash } from "node:crypto";
import path from "node:path";

import {
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v2-scientific-preseal.v1";

export const NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_ARTIFACT_ID =
  "nhm2.semiclassical_v2_pair_agreement" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_agreement/v2" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID =
  "nhm2.semiclassical_v2_pair_comparison_policy" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_comparison_policy/v2" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID =
  "nhm2.server_owned.semiclassical_v2.strict_raw_pair/v2" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_ARTIFACT_ID =
  "nhm2.semiclassical_v2_pair_launch_seal" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_launch_seal/v2" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_ARTIFACT_ID =
  "nhm2.semiclassical_v2_pair_launch_seal_server_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_launch_seal_server_receipt/v2" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_MAX_PERSISTED_BYTES =
  1024 * 1024;
export const NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_run_replayer/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_ARTIFACT_ID =
  "nhm2.semiclassical_v2_scientific_preseal_server_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_scientific_preseal_server_receipt/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES =
  4 * 1024 * 1024;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_LOCKS =
  Object.freeze({
    executionChronologyEstablished: false as const,
    serverAuthorizedRootLeaseEstablished: false as const,
    sameUserMutationExclusionEstablished: false as const,
    osReadOnlyIsolationEstablished: false as const,
    notMountedIsolationEstablished: false as const,
    independentExecutionEstablished: false as const,
    independentAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_LOCKS =
  Object.freeze({
    schemaValidationAuthenticatesServerOrigin: false as const,
    receiptSelfHashAuthenticatesServerOrigin: false as const,
    executionChronologyEstablished: false as const,
    serverAuthorizedRootLeaseEstablished: false as const,
    sameUserMutationExclusionEstablished: false as const,
    osReadOnlyIsolationEstablished: false as const,
    notMountedIsolationEstablished: false as const,
    independentExecutionEstablished: false as const,
    independentAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
    empiricalValidation: false as const,
  });

export const NHM2_SEMICLASSICAL_V2_PAIR_ROLES = [
  "primary",
  "independent",
] as const;
export type Nhm2SemiclassicalV2PairRole =
  (typeof NHM2_SEMICLASSICAL_V2_PAIR_ROLES)[number];

/**
 * Exactly three regulator levels make the raw manifest contain 32 arrays.
 * This order is the pair-comparison order and is not producer selectable.
 */
export const NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES = [
  "noise_kernel",
  "noise_kernel_absolute_uncertainty95",
  "mean_rset",
  "mean_rset_absolute_uncertainty95",
  "smearing_weights",
  "constraint_bracket.H_H.computed",
  "constraint_bracket.H_H.target",
  "constraint_bracket.H_H.residual",
  "constraint_bracket.H_H.absolute_uncertainty95",
  "constraint_bracket.H_Hi.computed",
  "constraint_bracket.H_Hi.target",
  "constraint_bracket.H_Hi.residual",
  "constraint_bracket.H_Hi.absolute_uncertainty95",
  "constraint_bracket.Hi_Hj.computed",
  "constraint_bracket.Hi_Hj.target",
  "constraint_bracket.Hi_Hj.residual",
  "constraint_bracket.Hi_Hj.absolute_uncertainty95",
  "antisymmetry.forward",
  "antisymmetry.reverse",
  "antisymmetry.residual",
  "antisymmetry.absolute_uncertainty95",
  "jacobi.term_1",
  "jacobi.term_2",
  "jacobi.term_3",
  "jacobi.residual",
  "jacobi.absolute_uncertainty95",
  "regulator_level.0.residual",
  "regulator_level.0.absolute_uncertainty95",
  "regulator_level.1.residual",
  "regulator_level.1.absolute_uncertainty95",
  "regulator_level.2.residual",
  "regulator_level.2.absolute_uncertainty95",
] as const;
export type Nhm2SemiclassicalV2PairArrayRole =
  (typeof NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES)[number];
export const NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT = 32 as const;

export type Nhm2SemiclassicalV2ReplayLeafValueKind =
  | "boolean"
  | "integer"
  | "number"
  | "nullable_number"
  | "string"
  | "nullable_string"
  | "number_array"
  | "string_array"
  | "issue_array";

export type Nhm2SemiclassicalV2ReplayLeafDescriptorV1 = Readonly<{
  leafId: string;
  valueKind: Nhm2SemiclassicalV2ReplayLeafValueKind;
}>;

const replayLeaf = (
  leafId: string,
  valueKind: Nhm2SemiclassicalV2ReplayLeafValueKind,
): Nhm2SemiclassicalV2ReplayLeafDescriptorV1 =>
  Object.freeze({ leafId, valueKind });

const residualMetricLeaves = (prefix: string) => [
  replayLeaf(`${prefix}.residualLInf`, "number"),
  replayLeaf(`${prefix}.absoluteUncertainty95`, "number"),
  replayLeaf(`${prefix}.residualUpper95`, "number"),
  replayLeaf(`${prefix}.producerResidualMismatchLInf`, "number"),
  replayLeaf(`${prefix}.tolerance`, "number"),
];

/**
 * Frozen leaf projection of the scientific `metrics` subtree in
 * Nhm2SemiclassicalV2ContentReplayResult. Fixed-size numeric arrays are
 * expanded to indexed scalar leaves. The comparator validates the exact
 * replay-result object keys separately, then compares all 108 leaves.
 */
export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE =
  Object.freeze([
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
    replayLeaf(
      "metrics.noise.minimumShiftedCholeskyPivotSI",
      "nullable_number",
    ),
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
    replayLeaf(
      "metrics.meanMetricDemandClosure.argmaxComponentIndex",
      "integer",
    ),
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
    replayLeaf("metrics.regulator.levelCount", "integer"),
    ...Array.from({ length: 2 }, (_, index) =>
      replayLeaf(`metrics.regulator.spacing[${index}]`, "number"),
    ),
    ...Array.from({ length: 3 }, (_, index) =>
      replayLeaf(
        `metrics.regulator.residualUpper95ByLevel[${index}]`,
        "number",
      ),
    ),
    ...Array.from({ length: 2 }, (_, index) =>
      replayLeaf(`metrics.regulator.observedOrders[${index}]`, "number"),
    ),
    replayLeaf("metrics.regulator.minimumObservedOrder", "number"),
    replayLeaf("metrics.regulator.requiredMinimumOrder", "number"),
    replayLeaf("metrics.regulator.monotone", "boolean"),
    replayLeaf("metrics.regulator.finalResidualUpper95", "number"),
    replayLeaf("metrics.regulator.tolerance", "number"),
  ] as const);

export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS = Object.freeze(
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map(
    (entry) => entry.leafId,
  ),
);
export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT = 108 as const;

export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_COVERAGE_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-replay-metric-coverage/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-replay-metric-leaf-ids/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_VALUE_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-replay-metric-leaf-value/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_POLICY_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-comparison-policy/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-launch-seal/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-pair-agreement-receipt/v2\n" as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};

const sha256Text = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(JSON.stringify(canonicalizeJson(value)), "utf8")
    .digest("hex");

export const computeNhm2SemiclassicalV2PairReplayMetricCoverageSha256 = (
  coverage: readonly Nhm2SemiclassicalV2ReplayLeafDescriptorV1[],
): string =>
  sha256Text(
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_COVERAGE_SHA256_DOMAIN,
    coverage,
  );

export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256 =
  computeNhm2SemiclassicalV2PairReplayMetricCoverageSha256(
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE,
  );
export const NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS_SHA256 =
  sha256Text(
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS_SHA256_DOMAIN,
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
  );

/**
 * Hashes one already schema-admitted replay leaf. Float64 big-endian bytes
 * preserve Object.is distinctions such as +0 versus -0; non-finite numbers
 * fail closed before hashing.
 */
export const computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256 =
  (value: string | number | boolean | null): string => {
    let canonicalValue: string;
    if (value === null) canonicalValue = "null";
    else if (typeof value === "string")
      canonicalValue = `string:${JSON.stringify(value)}`;
    else if (typeof value === "boolean")
      canonicalValue = `boolean:${value ? "true" : "false"}`;
    else {
      if (!Number.isFinite(value)) {
        throw new TypeError("replay_metric_leaf_value_must_be_finite");
      }
      const bytes = Buffer.allocUnsafe(8);
      bytes.writeDoubleBE(value, 0);
      canonicalValue = `number:float64_be:${bytes.toString("hex")}`;
    }
    return createHash("sha256")
      .update(
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_VALUE_SHA256_DOMAIN,
        "utf8",
      )
      .update(canonicalValue, "utf8")
      .digest("hex");
  };

export type Nhm2SemiclassicalV2PairPreregisteredAbsRelRuleV1 = Readonly<{
  arrayRole: Nhm2SemiclassicalV2PairArrayRole;
  comparator: "absolute_or_relative";
  absoluteTolerance: number;
  relativeTolerance: number;
  preregisteredAt: string;
  registrationSha256: string;
}>;

export type Nhm2SemiclassicalV2PairComparisonPolicyV1 = Readonly<{
  artifactId: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION;
  policyId: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID;
  authority: "server_owned";
  frozenAt: string;
  defaultComparator: "strict_byte_equality";
  arrayComparator: "strict_byte_equality";
  overrideAdmission: "exact_per_role_abs_rel_rule_preregistered_before_launch_only";
  roleRules: readonly Nhm2SemiclassicalV2PairPreregisteredAbsRelRuleV1[];
  retuningAfterLaunchPermitted: false;
  float64NonfinitePolicy: "replayer_rejects_before_pair_comparison";
  regulatorLevelCount: 3;
  arrayRoleOrdering: "frozen_array_role_order_v1";
  arrayRoles: typeof NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES;
  arrayRoleCount: typeof NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT;
  replayMetricLeafCoverageSha256: string;
}>;

/** Current task policy: every raw array must have identical bytes. */
export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY = Object.freeze({
  artifactId: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION,
  policyId: NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID,
  authority: "server_owned" as const,
  frozenAt: "2026-08-10T00:00:00.000Z",
  defaultComparator: "strict_byte_equality" as const,
  arrayComparator: "strict_byte_equality" as const,
  overrideAdmission:
    "exact_per_role_abs_rel_rule_preregistered_before_launch_only" as const,
  roleRules: Object.freeze(
    [],
  ) as readonly Nhm2SemiclassicalV2PairPreregisteredAbsRelRuleV1[],
  retuningAfterLaunchPermitted: false as const,
  float64NonfinitePolicy: "replayer_rejects_before_pair_comparison" as const,
  regulatorLevelCount: 3 as const,
  arrayRoleOrdering: "frozen_array_role_order_v1" as const,
  arrayRoles: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES,
  arrayRoleCount: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT,
  replayMetricLeafCoverageSha256:
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
}) satisfies Nhm2SemiclassicalV2PairComparisonPolicyV1;

export const canonicalNhm2SemiclassicalV2PairComparisonPolicyJson = (
  value: Nhm2SemiclassicalV2PairComparisonPolicyV1,
): string => JSON.stringify(canonicalizeJson(value));

export const computeNhm2SemiclassicalV2PairComparisonPolicySha256 = (
  value: Nhm2SemiclassicalV2PairComparisonPolicyV1,
): string => sha256Text(NHM2_SEMICLASSICAL_V2_PAIR_POLICY_SHA256_DOMAIN, value);

export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256 =
  computeNhm2SemiclassicalV2PairComparisonPolicySha256(
    NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY,
  );

/** Stable aliases used by the server pair-comparator surface. */
export const NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY =
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY;
export const NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY_SHA256 =
  NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256;

export type Nhm2SemiclassicalV2PairArtifactRefV1 = {
  artifactId: string;
  contractVersion: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2SemiclassicalV2PairEnrollmentCapabilityBindingV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  opaqueEnrollmentId: string;
  capabilityBindingSha256: string;
  capabilityDisclosure: "opaque_server_binding_only";
  authority: "server";
  serverAuthorized: true;
};

export type Nhm2SemiclassicalV2PairRootLeaseV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  leaseId: string;
  authority: "server";
  authorizedAt: string;
  scientificRootDirectory: string;
  scientificRootAccess: "read_only_exact_sealed_inventory";
  implementationRootDirectory: string;
  implementationRootAccess: "read_only_lane_private";
  outputRootDirectory: string;
  outputRootAccess: "read_write_lane_private";
  leaseBindingSha256: string;
  serverAuthorized: true;
};

export type Nhm2SemiclassicalV2PairEmptyOutputPrestateV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  receiptId: string;
  authority: "server_filesystem_observer";
  observedAt: string;
  outputRootDirectory: string;
  directoryExisted: true;
  entryCount: 0;
  aggregateSizeBytes: 0;
  directoryEmpty: true;
  manifestAbsent: true;
  producerDeclarationAcceptedAsEvidence: false;
  receiptSha256: string;
};

export type Nhm2SemiclassicalV2PairOsIsolationAttestationV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  attestationId: string;
  authority: "server_os_isolation_observer";
  observedAt: string;
  executionDomainId: string;
  processNamespaceIsolated: true;
  mountNamespaceIsolated: true;
  networkNamespaceIsolated: true;
  networkPolicy: "no_external_or_cross_lane_connectivity";
  scientificRootReadOnlyMountVerified: true;
  implementationRootLanePrivateMountVerified: true;
  outputRootLanePrivateMountVerified: true;
  counterpartOutputNotMountedVerified: true;
  ambientRepositoryNotMountedVerified: true;
  producerNotMountedDeclarationAcceptedAsEvidence: false;
  attestationSha256: string;
};

export type Nhm2SemiclassicalV2PairImplementationLineageV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  implementationId: string;
  lineageId: string;
  implementationDomainId: string;
  sourceSha256: string;
  dependencyLockSha256: string;
  executableSha256: string;
  buildRecipeSha256: string;
};

export type Nhm2SemiclassicalV2PairScientificPresealServerReceiptBindingV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_CONTRACT_VERSION;
  authority: "server_observed_persistence_readback";
  persistenceState: "created_exclusively" | "exact_idempotent_readback";
  sealKey: string;
  sealedAt: string;
  persistenceObservedAt: string;
  artifact: {
    absolutePath: string;
    sha256: string;
    sizeBytes: string;
    filesystemIdentity: {
      dev: string;
      ino: string;
      sizeBytes: string;
      mtimeNs: string;
      ctimeNs: string;
    };
  };
  locks: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_LOCKS;
  receiptHashAlgorithm: "sha256";
  receiptCanonicalization: "utf8_lexicographic_object_keys_json_v1";
  receiptSha256: string;
};

export type Nhm2SemiclassicalV2PairScientificPresealPersistedArtifactBindingV1 =
  {
    artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION;
    verificationState: "server_reopened_rehashed_and_validated_persisted_preseal";
    artifactSha256: string;
    artifactSizeBytes: string;
    sealKey: string;
    candidateId: string;
    candidateManifestId: string;
    candidateFrozenAt: string;
    sealedScientificRootDirectory: string;
    candidateManifestSha256: string;
    scientificContentSha256: string;
    sealedInventorySha256: string;
    sealedAt: string;
  };

export type Nhm2SemiclassicalV2PairLaunchSealV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION;
  launchSealId: string;
  pairId: string;
  persistedAt: string;
  comparisonPolicySha256: string;
  scientificPresealReceiptSha256: string;
  primaryCapabilityBindingSha256: string;
  independentCapabilityBindingSha256: string;
  primaryRootLeaseBindingSha256: string;
  independentRootLeaseBindingSha256: string;
  primaryEmptyOutputPrestateReceiptSha256: string;
  independentEmptyOutputPrestateReceiptSha256: string;
  primaryIsolationAttestationSha256: string;
  independentIsolationAttestationSha256: string;
  persistedBeforeBothStarts: true;
  launchSealSha256: string;
};

export type Nhm2SemiclassicalV2PairLaunchSealUnsignedV1 = Omit<
  Nhm2SemiclassicalV2PairLaunchSealV1,
  "launchSealSha256"
>;

export type Nhm2SemiclassicalV2PairLaunchSealServerReceiptV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION;
  authority: "server_observed_persistence_readback";
  persistenceState: "created_exclusively" | "exact_idempotent_readback";
  launchSealId: string;
  pairId: string;
  persistedAt: string;
  persistenceObservedAt: string;
  artifact: {
    absolutePath: string;
    sha256: string;
    sizeBytes: string;
    filesystemIdentity: {
      dev: string;
      ino: string;
      sizeBytes: string;
      mtimeNs: string;
      ctimeNs: string;
    };
  };
  locks: typeof NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_LOCKS;
  receiptHashAlgorithm: "sha256";
  receiptCanonicalization: "utf8_lexicographic_object_keys_json_v1";
  receiptSha256: string;
};

export type Nhm2SemiclassicalV2PairLaunchSealUnsignedServerReceiptV1 = Omit<
  Nhm2SemiclassicalV2PairLaunchSealServerReceiptV1,
  "receiptSha256"
>;

export type Nhm2SemiclassicalV2PairArrayOutputBindingV1 = {
  ordinal: number;
  arrayRole: Nhm2SemiclassicalV2PairArrayRole;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2SemiclassicalV2PairLaneBindingV1 = {
  role: Nhm2SemiclassicalV2PairRole;
  enrollmentCapability: Nhm2SemiclassicalV2PairEnrollmentCapabilityBindingV1;
  rootLease: Nhm2SemiclassicalV2PairRootLeaseV1;
  emptyOutputPrestate: Nhm2SemiclassicalV2PairEmptyOutputPrestateV1;
  isolationAttestation: Nhm2SemiclassicalV2PairOsIsolationAttestationV1;
  implementationLineage: Nhm2SemiclassicalV2PairImplementationLineageV1;
  execution: {
    runId: string;
    rawReplayManifest: Nhm2SemiclassicalV2PairArtifactRefV1;
    manifestFrozenAt: string;
    startedAt: string;
    completedAt: string;
    exitCode: 0;
    outputRootDirectory: string;
    serverObserved: true;
  };
  replayer: {
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION;
    resultSha256: string;
    manifestSha256: string;
    readbackClosureSha256: string;
    calculationDisposition: "pass";
    candidateDisposition: "single_run_replay_only";
    serverOwned: true;
    replayMetricCoverageSha256: string;
    replayMetricLeafCount: number;
    issuesCount: 0;
    blockersCount: 0;
  };
  arrays: Nhm2SemiclassicalV2PairArrayOutputBindingV1[];
};

export type Nhm2SemiclassicalV2PairArrayComparisonV1 = {
  ordinal: number;
  arrayRole: Nhm2SemiclassicalV2PairArrayRole;
  comparator: "strict_byte_equality";
  primary: { sha256: string; sizeBytes: number };
  independent: { sha256: string; sizeBytes: number };
  bytesEqual: true;
  status: "pass";
};

export type Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1 = {
  ordinal: number;
  leafId: string;
  valueKind: Nhm2SemiclassicalV2ReplayLeafValueKind;
  comparator: "canonical_json_value_equality";
  primaryCanonicalValueSha256: string;
  independentCanonicalValueSha256: string;
  valuesEqual: true;
  status: "pass";
};

export const NHM2_SEMICLASSICAL_V2_PAIR_DIAGNOSTIC_INPUT_IDS = [
  "semiclassical_stress_noise_lamp_candidate_input",
  "constraint_closure_lamp_candidate_input",
] as const;

/**
 * Receipt shape, canonical hashes, and cross-bindings are integrity checks,
 * not origin authentication. They never authorize either diagnostic lamp.
 */
export const NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS = Object.freeze({
  schemaValidationAuthenticatesServerOrigin: false as const,
  receiptSelfHashAuthenticatesServerOrigin: false as const,
  diagnosticLampStateAuthority: false as const,
  diagnosticLampPromotionAuthority: false as const,
  semiclassicalStressNoiseLamp: false as const,
  constraintClosureLamp: false as const,
  theoryGraphPromotion: false as const,
  theoryClosure: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  routeEta: false as const,
  certifiedSpeed: false as const,
  empiricalValidation: false as const,
});

export type Nhm2SemiclassicalV2PairAgreementReceiptV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_CONTRACT_VERSION;
  authority: "server_owned";
  generatedAt: string;
  pairAgreementId: string;
  pairId: string;
  candidate: {
    candidateId: string;
    candidateManifestId: string;
    candidateFrozenAt: string;
  };
  comparisonPolicy: {
    artifactId: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION;
    policyId: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID;
    sha256: string;
  };
  scientificPresealReceipt: Nhm2SemiclassicalV2PairScientificPresealServerReceiptBindingV1;
  scientificPresealArtifactBinding: Nhm2SemiclassicalV2PairScientificPresealPersistedArtifactBindingV1;
  pairLaunchSeal: Nhm2SemiclassicalV2PairLaunchSealV1;
  pairLaunchSealReceipt: Nhm2SemiclassicalV2PairLaunchSealServerReceiptV1;
  lanes: [
    Nhm2SemiclassicalV2PairLaneBindingV1,
    Nhm2SemiclassicalV2PairLaneBindingV1,
  ];
  arrayComparisons: Nhm2SemiclassicalV2PairArrayComparisonV1[];
  replayMetricCoverage: {
    ordering: "frozen_content_replay_leaf_order_v2";
    leafDescriptors: Nhm2SemiclassicalV2ReplayLeafDescriptorV1[];
    leafCount: number;
    coverageSha256: string;
  };
  replayMetricComparisons: Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1[];
  diagnosticInputAuthorization: {
    authorizationKind: "candidate_scoped_diagnostic_input_only";
    candidateId: string;
    authorizedInputIds: typeof NHM2_SEMICLASSICAL_V2_PAIR_DIAGNOSTIC_INPUT_IDS;
    authorizedInputCount: 2;
    lampStateAuthority: false;
    lampPromotionAuthority: false;
  };
  status: "pass";
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS;
  receiptIntegrity: {
    algorithm: "sha256";
    canonicalization: "recursive_lexicographic_object_keys_preserve_array_order_v1";
    hashDomain: typeof NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN;
    receiptSha256: string;
  };
};

export type Nhm2SemiclassicalV2PairAgreementUnsignedReceiptV1 = Omit<
  Nhm2SemiclassicalV2PairAgreementReceiptV1,
  "receiptIntegrity"
>;

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  value.trim() === value &&
  IDENTIFIER.test(value) &&
  !value.includes("//");
const isContractVersion = (value: unknown): value is string =>
  typeof value === "string" && CONTRACT_VERSION.test(value);
const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
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
const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeJson(left)) ===
  JSON.stringify(canonicalizeJson(right));
const unique = (values: string[]): string[] => [...new Set(values)];
const sameOrderedStrings = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);

const isPortableRoot = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
const isNormalizedNonRootAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 1 &&
  value.length <= 4096 &&
  value.trim() === value &&
  !value.includes("\0") &&
  path.isAbsolute(value) &&
  path.normalize(value) === value &&
  path.parse(value).root !== value;
const isNonnegativeIntegerString = (value: unknown): value is string =>
  typeof value === "string" && /^(?:0|[1-9][0-9]*)$/.test(value);
const isPositiveBoundedIntegerString = (
  value: unknown,
  maximum: number,
): value is string => {
  if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value)) return false;
  try {
    const parsed = BigInt(value);
    return parsed > 0n && parsed <= BigInt(maximum);
  } catch {
    return false;
  }
};

const pathKey = (value: string): string => value.toLocaleLowerCase("en-US");
const rootsOverlap = (left: string, right: string): boolean => {
  const a = pathKey(left);
  const b = pathKey(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "authority",
  "generatedAt",
  "pairAgreementId",
  "pairId",
  "candidate",
  "comparisonPolicy",
  "scientificPresealReceipt",
  "scientificPresealArtifactBinding",
  "pairLaunchSeal",
  "pairLaunchSealReceipt",
  "lanes",
  "arrayComparisons",
  "replayMetricCoverage",
  "replayMetricComparisons",
  "diagnosticInputAuthorization",
  "status",
  "claimLocks",
  "receiptIntegrity",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestId",
  "candidateFrozenAt",
] as const;
const POLICY_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
] as const;
const PRESEAL_KEYS = [
  "artifactId",
  "contractVersion",
  "authority",
  "persistenceState",
  "sealKey",
  "sealedAt",
  "persistenceObservedAt",
  "artifact",
  "locks",
  "receiptHashAlgorithm",
  "receiptCanonicalization",
  "receiptSha256",
] as const;
const PRESEAL_RECEIPT_ARTIFACT_KEYS = [
  "absolutePath",
  "sha256",
  "sizeBytes",
  "filesystemIdentity",
] as const;
const FILESYSTEM_IDENTITY_KEYS = [
  "dev",
  "ino",
  "sizeBytes",
  "mtimeNs",
  "ctimeNs",
] as const;
const PRESEAL_RECEIPT_LOCK_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_LOCKS,
);
const PRESEAL_ARTIFACT_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "verificationState",
  "artifactSha256",
  "artifactSizeBytes",
  "sealKey",
  "candidateId",
  "candidateManifestId",
  "candidateFrozenAt",
  "sealedScientificRootDirectory",
  "candidateManifestSha256",
  "scientificContentSha256",
  "sealedInventorySha256",
  "sealedAt",
] as const;
const LAUNCH_SEAL_KEYS = [
  "artifactId",
  "contractVersion",
  "launchSealId",
  "pairId",
  "persistedAt",
  "comparisonPolicySha256",
  "scientificPresealReceiptSha256",
  "primaryCapabilityBindingSha256",
  "independentCapabilityBindingSha256",
  "primaryRootLeaseBindingSha256",
  "independentRootLeaseBindingSha256",
  "primaryEmptyOutputPrestateReceiptSha256",
  "independentEmptyOutputPrestateReceiptSha256",
  "primaryIsolationAttestationSha256",
  "independentIsolationAttestationSha256",
  "persistedBeforeBothStarts",
  "launchSealSha256",
] as const;
const LAUNCH_SEAL_RECEIPT_KEYS = [
  "artifactId",
  "contractVersion",
  "authority",
  "persistenceState",
  "launchSealId",
  "pairId",
  "persistedAt",
  "persistenceObservedAt",
  "artifact",
  "locks",
  "receiptHashAlgorithm",
  "receiptCanonicalization",
  "receiptSha256",
] as const;
const LAUNCH_SEAL_RECEIPT_LOCK_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_LOCKS,
);
const LANE_KEYS = [
  "role",
  "enrollmentCapability",
  "rootLease",
  "emptyOutputPrestate",
  "isolationAttestation",
  "implementationLineage",
  "execution",
  "replayer",
  "arrays",
] as const;
const CAPABILITY_KEYS = [
  "role",
  "opaqueEnrollmentId",
  "capabilityBindingSha256",
  "capabilityDisclosure",
  "authority",
  "serverAuthorized",
] as const;
const ROOT_LEASE_KEYS = [
  "role",
  "leaseId",
  "authority",
  "authorizedAt",
  "scientificRootDirectory",
  "scientificRootAccess",
  "implementationRootDirectory",
  "implementationRootAccess",
  "outputRootDirectory",
  "outputRootAccess",
  "leaseBindingSha256",
  "serverAuthorized",
] as const;
const PRESTATE_KEYS = [
  "role",
  "receiptId",
  "authority",
  "observedAt",
  "outputRootDirectory",
  "directoryExisted",
  "entryCount",
  "aggregateSizeBytes",
  "directoryEmpty",
  "manifestAbsent",
  "producerDeclarationAcceptedAsEvidence",
  "receiptSha256",
] as const;
const ISOLATION_KEYS = [
  "role",
  "attestationId",
  "authority",
  "observedAt",
  "executionDomainId",
  "processNamespaceIsolated",
  "mountNamespaceIsolated",
  "networkNamespaceIsolated",
  "networkPolicy",
  "scientificRootReadOnlyMountVerified",
  "implementationRootLanePrivateMountVerified",
  "outputRootLanePrivateMountVerified",
  "counterpartOutputNotMountedVerified",
  "ambientRepositoryNotMountedVerified",
  "producerNotMountedDeclarationAcceptedAsEvidence",
  "attestationSha256",
] as const;
const LINEAGE_KEYS = [
  "role",
  "implementationId",
  "lineageId",
  "implementationDomainId",
  "sourceSha256",
  "dependencyLockSha256",
  "executableSha256",
  "buildRecipeSha256",
] as const;
const EXECUTION_KEYS = [
  "runId",
  "rawReplayManifest",
  "manifestFrozenAt",
  "startedAt",
  "completedAt",
  "exitCode",
  "outputRootDirectory",
  "serverObserved",
] as const;
const ARTIFACT_KEYS = [
  "artifactId",
  "contractVersion",
  "sha256",
  "sizeBytes",
] as const;
const REPLAYER_KEYS = [
  "contractVersion",
  "resultSha256",
  "manifestSha256",
  "readbackClosureSha256",
  "calculationDisposition",
  "candidateDisposition",
  "serverOwned",
  "replayMetricCoverageSha256",
  "replayMetricLeafCount",
  "issuesCount",
  "blockersCount",
] as const;
const ARRAY_OUTPUT_KEYS = [
  "ordinal",
  "arrayRole",
  "sha256",
  "sizeBytes",
] as const;
const ARRAY_COMPARISON_KEYS = [
  "ordinal",
  "arrayRole",
  "comparator",
  "primary",
  "independent",
  "bytesEqual",
  "status",
] as const;
const ARRAY_SIDE_KEYS = ["sha256", "sizeBytes"] as const;
const REPLAY_COVERAGE_KEYS = [
  "ordering",
  "leafDescriptors",
  "leafCount",
  "coverageSha256",
] as const;
const LEAF_DESCRIPTOR_KEYS = ["leafId", "valueKind"] as const;
const LEAF_COMPARISON_KEYS = [
  "ordinal",
  "leafId",
  "valueKind",
  "comparator",
  "primaryCanonicalValueSha256",
  "independentCanonicalValueSha256",
  "valuesEqual",
  "status",
] as const;
const DIAGNOSTIC_KEYS = [
  "authorizationKind",
  "candidateId",
  "authorizedInputIds",
  "authorizedInputCount",
  "lampStateAuthority",
  "lampPromotionAuthority",
] as const;
const CLAIM_LOCK_KEYS = Object.keys(NHM2_SEMICLASSICAL_V2_PAIR_CLAIM_LOCKS);
const INTEGRITY_KEYS = [
  "algorithm",
  "canonicalization",
  "hashDomain",
  "receiptSha256",
] as const;

export const computeNhm2SemiclassicalV2PairLaunchSealSha256 = (
  value: Nhm2SemiclassicalV2PairLaunchSealUnsignedV1,
): string =>
  sha256Text(NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SHA256_DOMAIN, value);

/** Exact persisted v1 launch-seal bytes: compact canonical JSON, no newline. */
export const canonicalNhm2SemiclassicalV2PairLaunchSealJson = (
  value: Nhm2SemiclassicalV2PairLaunchSealV1,
): string => JSON.stringify(canonicalizeJson(value));

export const computeNhm2SemiclassicalV2PairLaunchSealArtifactSha256 = (
  value: Nhm2SemiclassicalV2PairLaunchSealV1,
): string =>
  createHash("sha256")
    .update(canonicalNhm2SemiclassicalV2PairLaunchSealJson(value), "utf8")
    .digest("hex");

export const computeNhm2SemiclassicalV2PairLaunchSealArtifactSizeBytes = (
  value: Nhm2SemiclassicalV2PairLaunchSealV1,
): number =>
  Buffer.byteLength(
    canonicalNhm2SemiclassicalV2PairLaunchSealJson(value),
    "utf8",
  );

export const computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256 = (
  value: Nhm2SemiclassicalV2PairLaunchSealUnsignedServerReceiptV1,
): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalizeJson(value)), "utf8")
    .digest("hex");

export type Nhm2SemiclassicalV2PairScientificPresealUnsignedServerReceiptBindingV1 =
  Omit<
    Nhm2SemiclassicalV2PairScientificPresealServerReceiptBindingV1,
    "receiptSha256"
  >;

export const computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256 =
  (
    value: Nhm2SemiclassicalV2PairScientificPresealUnsignedServerReceiptBindingV1,
  ): string =>
    createHash("sha256")
      .update(JSON.stringify(canonicalizeJson(value)), "utf8")
      .digest("hex");

export const canonicalNhm2SemiclassicalV2PairAgreementJson = (
  value: Nhm2SemiclassicalV2PairAgreementReceiptV1,
): string => JSON.stringify(canonicalizeJson(value));

export const computeNhm2SemiclassicalV2PairAgreementReceiptSha256 = (
  value: Nhm2SemiclassicalV2PairAgreementUnsignedReceiptV1,
): string =>
  sha256Text(NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN, value);

export const nhm2SemiclassicalV2PairComparisonPolicyViolations = (
  value: unknown,
): string[] => {
  if (!isRecord(value)) return ["comparison_policy_shape_invalid"];
  if (!sameJson(value, NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY)) {
    return ["comparison_policy_not_exact_frozen_server_policy"];
  }
  return [];
};

const artifactViolations = (
  value: unknown,
  pointer: string,
  expected?: { artifactId: string; contractVersion: string },
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ARTIFACT_KEYS)) {
    return [`artifact_shape_invalid:${pointer}`];
  }
  if (
    !isIdentifier(value.artifactId) ||
    !isContractVersion(value.contractVersion) ||
    !isSha256(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    Number(value.sizeBytes) <= 0 ||
    (expected != null &&
      (value.artifactId !== expected.artifactId ||
        value.contractVersion !== expected.contractVersion))
  ) {
    return [`artifact_binding_invalid:${pointer}`];
  }
  return [];
};

const laneViolations = (
  value: unknown,
  expectedRole: Nhm2SemiclassicalV2PairRole,
  pointer: string,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, LANE_KEYS)) {
    return [`lane_shape_invalid:${pointer}`];
  }
  const violations: string[] = [];
  if (value.role !== expectedRole)
    violations.push(`lane_role_invalid:${pointer}`);

  const capability = isRecord(value.enrollmentCapability)
    ? value.enrollmentCapability
    : null;
  if (
    capability == null ||
    !hasExactKeys(capability, CAPABILITY_KEYS) ||
    capability.role !== expectedRole ||
    !isIdentifier(capability.opaqueEnrollmentId) ||
    !isSha256(capability.capabilityBindingSha256) ||
    capability.capabilityDisclosure !== "opaque_server_binding_only" ||
    capability.authority !== "server" ||
    capability.serverAuthorized !== true
  ) {
    violations.push(`opaque_enrollment_capability_binding_invalid:${pointer}`);
  }

  const lease = isRecord(value.rootLease) ? value.rootLease : null;
  if (
    lease == null ||
    !hasExactKeys(lease, ROOT_LEASE_KEYS) ||
    lease.role !== expectedRole ||
    !isIdentifier(lease.leaseId) ||
    lease.authority !== "server" ||
    !isIsoTimestamp(lease.authorizedAt) ||
    !isPortableRoot(lease.scientificRootDirectory) ||
    lease.scientificRootAccess !== "read_only_exact_sealed_inventory" ||
    !isPortableRoot(lease.implementationRootDirectory) ||
    lease.implementationRootAccess !== "read_only_lane_private" ||
    !isPortableRoot(lease.outputRootDirectory) ||
    lease.outputRootAccess !== "read_write_lane_private" ||
    !isSha256(lease.leaseBindingSha256) ||
    lease.serverAuthorized !== true
  ) {
    violations.push(`server_authorized_root_lease_invalid:${pointer}`);
  }

  const prestate = isRecord(value.emptyOutputPrestate)
    ? value.emptyOutputPrestate
    : null;
  if (
    prestate == null ||
    !hasExactKeys(prestate, PRESTATE_KEYS) ||
    prestate.role !== expectedRole ||
    !isIdentifier(prestate.receiptId) ||
    prestate.authority !== "server_filesystem_observer" ||
    !isIsoTimestamp(prestate.observedAt) ||
    !isPortableRoot(prestate.outputRootDirectory) ||
    prestate.directoryExisted !== true ||
    prestate.entryCount !== 0 ||
    prestate.aggregateSizeBytes !== 0 ||
    prestate.directoryEmpty !== true ||
    prestate.manifestAbsent !== true ||
    prestate.producerDeclarationAcceptedAsEvidence !== false ||
    !isSha256(prestate.receiptSha256)
  ) {
    violations.push(`server_observed_empty_output_prestate_invalid:${pointer}`);
  }

  const isolation = isRecord(value.isolationAttestation)
    ? value.isolationAttestation
    : null;
  if (
    isolation == null ||
    !hasExactKeys(isolation, ISOLATION_KEYS) ||
    isolation.role !== expectedRole ||
    !isIdentifier(isolation.attestationId) ||
    isolation.authority !== "server_os_isolation_observer" ||
    !isIsoTimestamp(isolation.observedAt) ||
    !isIdentifier(isolation.executionDomainId) ||
    isolation.processNamespaceIsolated !== true ||
    isolation.mountNamespaceIsolated !== true ||
    isolation.networkNamespaceIsolated !== true ||
    isolation.networkPolicy !== "no_external_or_cross_lane_connectivity" ||
    isolation.scientificRootReadOnlyMountVerified !== true ||
    isolation.implementationRootLanePrivateMountVerified !== true ||
    isolation.outputRootLanePrivateMountVerified !== true ||
    isolation.counterpartOutputNotMountedVerified !== true ||
    isolation.ambientRepositoryNotMountedVerified !== true ||
    isolation.producerNotMountedDeclarationAcceptedAsEvidence !== false ||
    !isSha256(isolation.attestationSha256)
  ) {
    violations.push(`server_os_isolation_attestation_invalid:${pointer}`);
  }

  const lineage = isRecord(value.implementationLineage)
    ? value.implementationLineage
    : null;
  if (
    lineage == null ||
    !hasExactKeys(lineage, LINEAGE_KEYS) ||
    lineage.role !== expectedRole ||
    !isIdentifier(lineage.implementationId) ||
    !isIdentifier(lineage.lineageId) ||
    !isIdentifier(lineage.implementationDomainId) ||
    !isSha256(lineage.sourceSha256) ||
    !isSha256(lineage.dependencyLockSha256) ||
    !isSha256(lineage.executableSha256) ||
    !isSha256(lineage.buildRecipeSha256)
  ) {
    violations.push(`implementation_lineage_invalid:${pointer}`);
  }

  const execution = isRecord(value.execution) ? value.execution : null;
  if (
    execution == null ||
    !hasExactKeys(execution, EXECUTION_KEYS) ||
    !isIdentifier(execution.runId) ||
    !isIsoTimestamp(execution.manifestFrozenAt) ||
    !isIsoTimestamp(execution.startedAt) ||
    !isIsoTimestamp(execution.completedAt) ||
    Date.parse(String(execution.manifestFrozenAt)) >=
      Date.parse(String(execution.startedAt)) ||
    Date.parse(String(execution.startedAt)) >=
      Date.parse(String(execution.completedAt)) ||
    execution.exitCode !== 0 ||
    !isPortableRoot(execution.outputRootDirectory) ||
    execution.serverObserved !== true
  ) {
    violations.push(`lane_execution_binding_invalid:${pointer}`);
  }
  violations.push(
    ...artifactViolations(
      execution?.rawReplayManifest,
      `${pointer}/execution/rawReplayManifest`,
      {
        artifactId: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      },
    ),
  );

  const replayer = isRecord(value.replayer) ? value.replayer : null;
  if (
    replayer == null ||
    !hasExactKeys(replayer, REPLAYER_KEYS) ||
    replayer.contractVersion !==
      NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION ||
    !isSha256(replayer.resultSha256) ||
    !isSha256(replayer.manifestSha256) ||
    !isSha256(replayer.readbackClosureSha256) ||
    replayer.calculationDisposition !== "pass" ||
    replayer.candidateDisposition !== "single_run_replay_only" ||
    replayer.serverOwned !== true ||
    replayer.replayMetricCoverageSha256 !==
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256 ||
    replayer.replayMetricLeafCount !==
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT ||
    replayer.issuesCount !== 0 ||
    replayer.blockersCount !== 0
  ) {
    violations.push(`lane_replayer_binding_invalid:${pointer}`);
  }

  const arrays = Array.isArray(value.arrays) ? value.arrays : [];
  if (arrays.length !== NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT) {
    violations.push(`array_role_coverage_count_invalid:${pointer}`);
  }
  arrays.forEach((entry, index) => {
    const expectedRoleId = NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES[index];
    if (
      !isRecord(entry) ||
      !hasExactKeys(entry, ARRAY_OUTPUT_KEYS) ||
      entry.ordinal !== index ||
      entry.arrayRole !== expectedRoleId ||
      !isSha256(entry.sha256) ||
      !Number.isSafeInteger(entry.sizeBytes) ||
      Number(entry.sizeBytes) <= 0
    ) {
      violations.push(`array_role_binding_invalid:${pointer}/arrays/${index}`);
    }
  });

  if (lease != null && prestate != null && execution != null) {
    if (
      lease.outputRootDirectory !== prestate.outputRootDirectory ||
      lease.outputRootDirectory !== execution.outputRootDirectory
    ) {
      violations.push(`lane_output_root_binding_mismatch:${pointer}`);
    }
    const authorized = Date.parse(String(lease.authorizedAt));
    const preObserved = Date.parse(String(prestate.observedAt));
    const isolationObserved = Date.parse(String(isolation?.observedAt));
    const started = Date.parse(String(execution.startedAt));
    if (
      !Number.isFinite(authorized) ||
      !Number.isFinite(preObserved) ||
      !Number.isFinite(isolationObserved) ||
      !Number.isFinite(started) ||
      authorized > preObserved ||
      preObserved >= started ||
      isolationObserved >= started
    ) {
      violations.push(`lane_preexecution_evidence_interval_invalid:${pointer}`);
    }
  }
  if (
    execution != null &&
    replayer != null &&
    isRecord(execution.rawReplayManifest) &&
    replayer.manifestSha256 !== execution.rawReplayManifest.sha256
  ) {
    violations.push(`lane_replayer_manifest_binding_mismatch:${pointer}`);
  }
  return violations;
};

/**
 * Fail-closed structural and self-integrity validation only. A caller cannot
 * establish server origin by presenting an object that passes this function:
 * the coordinator must independently supply trusted catalog capabilities,
 * OS observations, exclusive-create/readback receipts, and immutable bytes.
 * A valid pair receipt can authorize only its two candidate-scoped diagnostic
 * inputs; it cannot set, promote, or authenticate either lamp.
 */
export const nhm2SemiclassicalV2PairAgreementViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
      return ["pair_agreement_shape_invalid"];
    }
    const violations: string[] = [];
    if (
      value.artifactId !== NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_ARTIFACT_ID ||
      value.contractVersion !==
        NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_CONTRACT_VERSION ||
      value.authority !== "server_owned" ||
      !isIsoTimestamp(value.generatedAt) ||
      !isIdentifier(value.pairAgreementId) ||
      !isIdentifier(value.pairId) ||
      value.status !== "pass"
    ) {
      violations.push("pair_agreement_identity_invalid");
    }

    const candidate = isRecord(value.candidate) ? value.candidate : null;
    if (
      candidate == null ||
      !hasExactKeys(candidate, CANDIDATE_KEYS) ||
      !isIdentifier(candidate.candidateId) ||
      !isIdentifier(candidate.candidateManifestId) ||
      !isIsoTimestamp(candidate.candidateFrozenAt)
    ) {
      violations.push("candidate_binding_invalid");
    }

    const policy = isRecord(value.comparisonPolicy)
      ? value.comparisonPolicy
      : null;
    if (
      policy == null ||
      !hasExactKeys(policy, POLICY_BINDING_KEYS) ||
      policy.artifactId !==
        NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ARTIFACT_ID ||
      policy.contractVersion !==
        NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_CONTRACT_VERSION ||
      policy.policyId !== NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_ID ||
      policy.sha256 !== NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256
    ) {
      violations.push("comparison_policy_binding_invalid_or_retuned");
    }

    const preseal = isRecord(value.scientificPresealReceipt)
      ? value.scientificPresealReceipt
      : null;
    const presealReceiptArtifact = isRecord(preseal?.artifact)
      ? preseal.artifact
      : null;
    const presealReceiptFilesystemIdentity = isRecord(
      presealReceiptArtifact?.filesystemIdentity,
    )
      ? presealReceiptArtifact.filesystemIdentity
      : null;
    const presealLocks = isRecord(preseal?.locks) ? preseal.locks : null;
    if (
      preseal == null ||
      !hasExactKeys(preseal, PRESEAL_KEYS) ||
      preseal.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_ARTIFACT_ID ||
      preseal.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_SERVER_RECEIPT_CONTRACT_VERSION ||
      preseal.authority !== "server_observed_persistence_readback" ||
      (preseal.persistenceState !== "created_exclusively" &&
        preseal.persistenceState !== "exact_idempotent_readback") ||
      !isSha256(preseal.sealKey) ||
      !isIsoTimestamp(preseal.sealedAt) ||
      !isIsoTimestamp(preseal.persistenceObservedAt) ||
      Date.parse(String(preseal.sealedAt)) >=
        Date.parse(String(preseal.persistenceObservedAt)) ||
      presealReceiptArtifact == null ||
      !hasExactKeys(presealReceiptArtifact, PRESEAL_RECEIPT_ARTIFACT_KEYS) ||
      !isNormalizedNonRootAbsolutePath(presealReceiptArtifact.absolutePath) ||
      !isSha256(presealReceiptArtifact.sha256) ||
      !isPositiveBoundedIntegerString(
        presealReceiptArtifact.sizeBytes,
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES,
      ) ||
      presealReceiptFilesystemIdentity == null ||
      !hasExactKeys(
        presealReceiptFilesystemIdentity,
        FILESYSTEM_IDENTITY_KEYS,
      ) ||
      !isNonnegativeIntegerString(presealReceiptFilesystemIdentity.dev) ||
      !isNonnegativeIntegerString(presealReceiptFilesystemIdentity.ino) ||
      !isNonnegativeIntegerString(presealReceiptFilesystemIdentity.sizeBytes) ||
      !isNonnegativeIntegerString(presealReceiptFilesystemIdentity.mtimeNs) ||
      !isNonnegativeIntegerString(presealReceiptFilesystemIdentity.ctimeNs) ||
      presealReceiptFilesystemIdentity.sizeBytes !==
        presealReceiptArtifact.sizeBytes ||
      presealLocks == null ||
      !hasExactKeys(presealLocks, PRESEAL_RECEIPT_LOCK_KEYS) ||
      PRESEAL_RECEIPT_LOCK_KEYS.some((key) => presealLocks[key] !== false) ||
      preseal.receiptHashAlgorithm !== "sha256" ||
      preseal.receiptCanonicalization !==
        "utf8_lexicographic_object_keys_json_v1" ||
      !isSha256(preseal.receiptSha256)
    ) {
      violations.push("scientific_preseal_receipt_binding_invalid");
    } else {
      const { receiptSha256: _receiptHash, ...unsignedPresealReceipt } =
        preseal;
      if (
        preseal.receiptSha256 !==
        computeNhm2SemiclassicalV2PairScientificPresealServerReceiptSha256(
          unsignedPresealReceipt as Nhm2SemiclassicalV2PairScientificPresealUnsignedServerReceiptBindingV1,
        )
      ) {
        violations.push("scientific_preseal_server_receipt_integrity_invalid");
      }
    }

    const presealArtifact = isRecord(value.scientificPresealArtifactBinding)
      ? value.scientificPresealArtifactBinding
      : null;
    if (
      presealArtifact == null ||
      !hasExactKeys(presealArtifact, PRESEAL_ARTIFACT_BINDING_KEYS) ||
      presealArtifact.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID ||
      presealArtifact.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION ||
      presealArtifact.verificationState !==
        "server_reopened_rehashed_and_validated_persisted_preseal" ||
      !isSha256(presealArtifact.artifactSha256) ||
      !isPositiveBoundedIntegerString(
        presealArtifact.artifactSizeBytes,
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_MAX_PERSISTED_BYTES,
      ) ||
      !isSha256(presealArtifact.sealKey) ||
      !isIdentifier(presealArtifact.candidateId) ||
      !isIdentifier(presealArtifact.candidateManifestId) ||
      !isIsoTimestamp(presealArtifact.candidateFrozenAt) ||
      !isPortableRoot(presealArtifact.sealedScientificRootDirectory) ||
      !isSha256(presealArtifact.candidateManifestSha256) ||
      !isSha256(presealArtifact.scientificContentSha256) ||
      !isSha256(presealArtifact.sealedInventorySha256) ||
      !isIsoTimestamp(presealArtifact.sealedAt)
    ) {
      violations.push("scientific_preseal_persisted_artifact_binding_invalid");
    } else if (
      preseal == null ||
      presealReceiptArtifact == null ||
      candidate == null ||
      presealArtifact.artifactSha256 !== presealReceiptArtifact.sha256 ||
      presealArtifact.artifactSizeBytes !== presealReceiptArtifact.sizeBytes ||
      presealArtifact.sealKey !== preseal.sealKey ||
      presealArtifact.sealedAt !== preseal.sealedAt ||
      presealArtifact.candidateId !== candidate.candidateId ||
      presealArtifact.candidateManifestId !== candidate.candidateManifestId ||
      presealArtifact.candidateFrozenAt !== candidate.candidateFrozenAt ||
      Date.parse(presealArtifact.candidateFrozenAt) >=
        Date.parse(presealArtifact.sealedAt)
    ) {
      violations.push(
        "scientific_preseal_receipt_artifact_cross_binding_mismatch",
      );
    }

    const lanes = Array.isArray(value.lanes) ? value.lanes : [];
    if (lanes.length !== 2) violations.push("pair_lane_count_invalid");
    violations.push(
      ...laneViolations(lanes[0], "primary", "/lanes/0"),
      ...laneViolations(lanes[1], "independent", "/lanes/1"),
    );
    const primary = isRecord(lanes[0]) ? lanes[0] : null;
    const independent = isRecord(lanes[1]) ? lanes[1] : null;

    const launch = isRecord(value.pairLaunchSeal) ? value.pairLaunchSeal : null;
    const launchReceipt = isRecord(value.pairLaunchSealReceipt)
      ? value.pairLaunchSealReceipt
      : null;
    const launchReceiptArtifact = isRecord(launchReceipt?.artifact)
      ? launchReceipt.artifact
      : null;
    const launchReceiptFilesystemIdentity = isRecord(
      launchReceiptArtifact?.filesystemIdentity,
    )
      ? launchReceiptArtifact.filesystemIdentity
      : null;
    const launchReceiptLocks = isRecord(launchReceipt?.locks)
      ? launchReceipt.locks
      : null;
    if (
      launchReceipt == null ||
      !hasExactKeys(launchReceipt, LAUNCH_SEAL_RECEIPT_KEYS) ||
      launchReceipt.artifactId !==
        NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_ARTIFACT_ID ||
      launchReceipt.contractVersion !==
        NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_SERVER_RECEIPT_CONTRACT_VERSION ||
      launchReceipt.authority !== "server_observed_persistence_readback" ||
      (launchReceipt.persistenceState !== "created_exclusively" &&
        launchReceipt.persistenceState !== "exact_idempotent_readback") ||
      !isIdentifier(launchReceipt.launchSealId) ||
      !isIdentifier(launchReceipt.pairId) ||
      !isIsoTimestamp(launchReceipt.persistedAt) ||
      !isIsoTimestamp(launchReceipt.persistenceObservedAt) ||
      Date.parse(String(launchReceipt.persistedAt)) >=
        Date.parse(String(launchReceipt.persistenceObservedAt)) ||
      launchReceiptArtifact == null ||
      !hasExactKeys(launchReceiptArtifact, PRESEAL_RECEIPT_ARTIFACT_KEYS) ||
      !isNormalizedNonRootAbsolutePath(launchReceiptArtifact.absolutePath) ||
      !isSha256(launchReceiptArtifact.sha256) ||
      !isPositiveBoundedIntegerString(
        launchReceiptArtifact.sizeBytes,
        NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_MAX_PERSISTED_BYTES,
      ) ||
      launchReceiptFilesystemIdentity == null ||
      !hasExactKeys(
        launchReceiptFilesystemIdentity,
        FILESYSTEM_IDENTITY_KEYS,
      ) ||
      !isNonnegativeIntegerString(launchReceiptFilesystemIdentity.dev) ||
      !isNonnegativeIntegerString(launchReceiptFilesystemIdentity.ino) ||
      !isNonnegativeIntegerString(launchReceiptFilesystemIdentity.sizeBytes) ||
      !isNonnegativeIntegerString(launchReceiptFilesystemIdentity.mtimeNs) ||
      !isNonnegativeIntegerString(launchReceiptFilesystemIdentity.ctimeNs) ||
      launchReceiptFilesystemIdentity.sizeBytes !==
        launchReceiptArtifact.sizeBytes ||
      launchReceiptLocks == null ||
      !hasExactKeys(launchReceiptLocks, LAUNCH_SEAL_RECEIPT_LOCK_KEYS) ||
      LAUNCH_SEAL_RECEIPT_LOCK_KEYS.some(
        (key) => launchReceiptLocks[key] !== false,
      ) ||
      launchReceipt.receiptHashAlgorithm !== "sha256" ||
      launchReceipt.receiptCanonicalization !==
        "utf8_lexicographic_object_keys_json_v1" ||
      !isSha256(launchReceipt.receiptSha256)
    ) {
      violations.push("pair_launch_seal_server_receipt_binding_invalid");
    } else {
      const { receiptSha256: _receiptHash, ...unsignedLaunchReceipt } =
        launchReceipt;
      if (
        launchReceipt.receiptSha256 !==
        computeNhm2SemiclassicalV2PairLaunchSealServerReceiptSha256(
          unsignedLaunchReceipt as Nhm2SemiclassicalV2PairLaunchSealUnsignedServerReceiptV1,
        )
      ) {
        violations.push("pair_launch_seal_server_receipt_integrity_invalid");
      }
    }
    if (launch == null || !hasExactKeys(launch, LAUNCH_SEAL_KEYS)) {
      violations.push("pair_launch_seal_shape_invalid");
    } else {
      const { launchSealSha256: _hash, ...unsigned } = launch;
      if (
        launch.artifactId !==
          NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_ARTIFACT_ID ||
        launch.contractVersion !==
          NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_CONTRACT_VERSION ||
        !isIdentifier(launch.launchSealId) ||
        launch.pairId !== value.pairId ||
        !isIsoTimestamp(launch.persistedAt) ||
        launch.comparisonPolicySha256 !==
          NHM2_SEMICLASSICAL_V2_PAIR_COMPARISON_POLICY_SHA256 ||
        launch.scientificPresealReceiptSha256 !== preseal?.receiptSha256 ||
        launch.primaryCapabilityBindingSha256 !==
          (isRecord(primary?.enrollmentCapability)
            ? primary.enrollmentCapability.capabilityBindingSha256
            : null) ||
        launch.independentCapabilityBindingSha256 !==
          (isRecord(independent?.enrollmentCapability)
            ? independent.enrollmentCapability.capabilityBindingSha256
            : null) ||
        launch.primaryRootLeaseBindingSha256 !==
          (isRecord(primary?.rootLease)
            ? primary.rootLease.leaseBindingSha256
            : null) ||
        launch.independentRootLeaseBindingSha256 !==
          (isRecord(independent?.rootLease)
            ? independent.rootLease.leaseBindingSha256
            : null) ||
        launch.primaryEmptyOutputPrestateReceiptSha256 !==
          (isRecord(primary?.emptyOutputPrestate)
            ? primary.emptyOutputPrestate.receiptSha256
            : null) ||
        launch.independentEmptyOutputPrestateReceiptSha256 !==
          (isRecord(independent?.emptyOutputPrestate)
            ? independent.emptyOutputPrestate.receiptSha256
            : null) ||
        launch.primaryIsolationAttestationSha256 !==
          (isRecord(primary?.isolationAttestation)
            ? primary.isolationAttestation.attestationSha256
            : null) ||
        launch.independentIsolationAttestationSha256 !==
          (isRecord(independent?.isolationAttestation)
            ? independent.isolationAttestation.attestationSha256
            : null) ||
        launch.persistedBeforeBothStarts !== true ||
        !isSha256(launch.launchSealSha256) ||
        launch.launchSealSha256 !==
          computeNhm2SemiclassicalV2PairLaunchSealSha256(
            unsigned as Nhm2SemiclassicalV2PairLaunchSealUnsignedV1,
          )
      ) {
        violations.push("pair_launch_seal_binding_or_integrity_invalid");
      }
      const launchArtifactSizeBytes =
        computeNhm2SemiclassicalV2PairLaunchSealArtifactSizeBytes(
          launch as unknown as Nhm2SemiclassicalV2PairLaunchSealV1,
        );
      if (
        launchReceipt == null ||
        launchReceiptArtifact == null ||
        launchReceipt.launchSealId !== launch.launchSealId ||
        launchReceipt.pairId !== launch.pairId ||
        launchReceipt.persistedAt !== launch.persistedAt ||
        launchReceiptArtifact.sha256 !==
          computeNhm2SemiclassicalV2PairLaunchSealArtifactSha256(
            launch as unknown as Nhm2SemiclassicalV2PairLaunchSealV1,
          ) ||
        launchReceiptArtifact.sizeBytes !== String(launchArtifactSizeBytes) ||
        launchArtifactSizeBytes <= 0 ||
        launchArtifactSizeBytes >
          NHM2_SEMICLASSICAL_V2_PAIR_LAUNCH_SEAL_MAX_PERSISTED_BYTES
      ) {
        violations.push(
          "pair_launch_seal_receipt_artifact_cross_binding_mismatch",
        );
      }
      const persistedAt = Date.parse(String(launch.persistedAt));
      const launchPersistenceObservedAt = Date.parse(
        String(launchReceipt?.persistenceObservedAt),
      );
      const presealPersistenceObservedAt = Date.parse(
        String(preseal?.persistenceObservedAt),
      );
      const primaryStarted = Date.parse(
        String(isRecord(primary?.execution) ? primary.execution.startedAt : ""),
      );
      const independentStarted = Date.parse(
        String(
          isRecord(independent?.execution)
            ? independent.execution.startedAt
            : "",
        ),
      );
      const prerequisiteObservedAt = [
        isRecord(primary?.rootLease) ? primary.rootLease.authorizedAt : null,
        isRecord(primary?.emptyOutputPrestate)
          ? primary.emptyOutputPrestate.observedAt
          : null,
        isRecord(primary?.isolationAttestation)
          ? primary.isolationAttestation.observedAt
          : null,
        isRecord(independent?.rootLease)
          ? independent.rootLease.authorizedAt
          : null,
        isRecord(independent?.emptyOutputPrestate)
          ? independent.emptyOutputPrestate.observedAt
          : null,
        isRecord(independent?.isolationAttestation)
          ? independent.isolationAttestation.observedAt
          : null,
      ].map((entry) => Date.parse(String(entry)));
      if (
        !Number.isFinite(presealPersistenceObservedAt) ||
        !Number.isFinite(persistedAt) ||
        !Number.isFinite(launchPersistenceObservedAt) ||
        !Number.isFinite(primaryStarted) ||
        !Number.isFinite(independentStarted) ||
        prerequisiteObservedAt.some(
          (observedAt) =>
            !Number.isFinite(observedAt) || observedAt > persistedAt,
        ) ||
        !(
          presealPersistenceObservedAt < persistedAt &&
          persistedAt < launchPersistenceObservedAt &&
          launchPersistenceObservedAt < primaryStarted &&
          launchPersistenceObservedAt < independentStarted
        )
      ) {
        violations.push("pair_launch_seal_not_persisted_before_both_starts");
      }
    }

    if (primary != null && independent != null) {
      const pLease = isRecord(primary.rootLease) ? primary.rootLease : null;
      const iLease = isRecord(independent.rootLease)
        ? independent.rootLease
        : null;
      const pIsolation = isRecord(primary.isolationAttestation)
        ? primary.isolationAttestation
        : null;
      const iIsolation = isRecord(independent.isolationAttestation)
        ? independent.isolationAttestation
        : null;
      const pLineage = isRecord(primary.implementationLineage)
        ? primary.implementationLineage
        : null;
      const iLineage = isRecord(independent.implementationLineage)
        ? independent.implementationLineage
        : null;
      if (
        pLease == null ||
        iLease == null ||
        pLease.scientificRootDirectory !== iLease.scientificRootDirectory ||
        pLease.scientificRootDirectory !==
          presealArtifact?.sealedScientificRootDirectory
      ) {
        violations.push("sealed_scientific_root_binding_mismatch");
      }
      if (pLease != null && iLease != null) {
        const privateRoots = [
          pLease.implementationRootDirectory,
          pLease.outputRootDirectory,
          iLease.implementationRootDirectory,
          iLease.outputRootDirectory,
        ];
        if (
          privateRoots.some((root) => typeof root !== "string") ||
          privateRoots.some((root, index) =>
            privateRoots
              .slice(index + 1)
              .some(
                (other) =>
                  typeof root === "string" &&
                  typeof other === "string" &&
                  rootsOverlap(root, other),
              ),
          ) ||
          privateRoots.some(
            (root) =>
              typeof root === "string" &&
              typeof pLease.scientificRootDirectory === "string" &&
              rootsOverlap(root, pLease.scientificRootDirectory),
          )
        ) {
          violations.push("pair_private_roots_not_distinct_and_disjoint");
        }
      }
      if (
        pIsolation == null ||
        iIsolation == null ||
        pIsolation.executionDomainId === iIsolation.executionDomainId
      ) {
        violations.push("pair_execution_domains_not_distinct");
      }
      if (
        pLineage == null ||
        iLineage == null ||
        pLineage.implementationId === iLineage.implementationId ||
        pLineage.lineageId === iLineage.lineageId ||
        pLineage.implementationDomainId === iLineage.implementationDomainId ||
        pLineage.sourceSha256 === iLineage.sourceSha256 ||
        pLineage.dependencyLockSha256 === iLineage.dependencyLockSha256 ||
        pLineage.executableSha256 === iLineage.executableSha256 ||
        pLineage.buildRecipeSha256 === iLineage.buildRecipeSha256
      ) {
        violations.push("implementation_lineages_not_genuinely_distinct");
      }
      const pReplayer = isRecord(primary.replayer) ? primary.replayer : null;
      const iReplayer = isRecord(independent.replayer)
        ? independent.replayer
        : null;
      if (
        pReplayer == null ||
        iReplayer == null ||
        pReplayer.resultSha256 !== iReplayer.resultSha256
      ) {
        violations.push("content_replay_envelopes_not_exactly_equal");
      }
      const pExecution = isRecord(primary.execution) ? primary.execution : null;
      const iExecution = isRecord(independent.execution)
        ? independent.execution
        : null;
      const generatedAt = Date.parse(String(value.generatedAt));
      if (
        pExecution == null ||
        iExecution == null ||
        !Number.isFinite(generatedAt) ||
        Date.parse(String(pExecution.completedAt)) >= generatedAt ||
        Date.parse(String(iExecution.completedAt)) >= generatedAt
      ) {
        violations.push("pair_receipt_not_generated_after_both_completions");
      }
    }

    const arrayComparisons = Array.isArray(value.arrayComparisons)
      ? value.arrayComparisons
      : [];
    if (
      arrayComparisons.length !== NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLE_COUNT
    ) {
      violations.push("array_comparison_coverage_count_invalid");
    }
    arrayComparisons.forEach((entry, index) => {
      const expectedRole = NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES[index];
      const pArray = Array.isArray(primary?.arrays)
        ? primary.arrays[index]
        : null;
      const iArray = Array.isArray(independent?.arrays)
        ? independent.arrays[index]
        : null;
      if (
        !isRecord(entry) ||
        !hasExactKeys(entry, ARRAY_COMPARISON_KEYS) ||
        entry.ordinal !== index ||
        entry.arrayRole !== expectedRole ||
        entry.comparator !== "strict_byte_equality" ||
        !isRecord(entry.primary) ||
        !hasExactKeys(entry.primary, ARRAY_SIDE_KEYS) ||
        !isRecord(entry.independent) ||
        !hasExactKeys(entry.independent, ARRAY_SIDE_KEYS) ||
        !isSha256(entry.primary.sha256) ||
        !isSha256(entry.independent.sha256) ||
        !Number.isSafeInteger(entry.primary.sizeBytes) ||
        Number(entry.primary.sizeBytes) <= 0 ||
        !Number.isSafeInteger(entry.independent.sizeBytes) ||
        Number(entry.independent.sizeBytes) <= 0 ||
        entry.primary.sha256 !== entry.independent.sha256 ||
        entry.primary.sizeBytes !== entry.independent.sizeBytes ||
        entry.primary.sha256 !== (isRecord(pArray) ? pArray.sha256 : null) ||
        entry.primary.sizeBytes !==
          (isRecord(pArray) ? pArray.sizeBytes : null) ||
        entry.independent.sha256 !==
          (isRecord(iArray) ? iArray.sha256 : null) ||
        entry.independent.sizeBytes !==
          (isRecord(iArray) ? iArray.sizeBytes : null) ||
        entry.bytesEqual !== true ||
        entry.status !== "pass"
      ) {
        violations.push(
          `strict_array_comparison_invalid:/arrayComparisons/${index}`,
        );
      }
    });

    const coverage = isRecord(value.replayMetricCoverage)
      ? value.replayMetricCoverage
      : null;
    if (
      coverage == null ||
      !hasExactKeys(coverage, REPLAY_COVERAGE_KEYS) ||
      coverage.ordering !== "frozen_content_replay_leaf_order_v2" ||
      !sameJson(
        coverage.leafDescriptors,
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE,
      ) ||
      coverage.leafCount !==
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT ||
      coverage.coverageSha256 !==
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256
    ) {
      violations.push("replay_metric_leaf_coverage_invalid");
    }

    const leafComparisons = Array.isArray(value.replayMetricComparisons)
      ? value.replayMetricComparisons
      : [];
    if (
      leafComparisons.length !==
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT
    ) {
      violations.push("replay_metric_leaf_comparison_count_invalid");
    }
    leafComparisons.forEach((entry, index) => {
      const expected =
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE[index];
      if (
        expected == null ||
        !isRecord(entry) ||
        !hasExactKeys(entry, LEAF_COMPARISON_KEYS) ||
        entry.ordinal !== index ||
        entry.leafId !== expected.leafId ||
        entry.valueKind !== expected.valueKind ||
        entry.comparator !== "canonical_json_value_equality" ||
        !isSha256(entry.primaryCanonicalValueSha256) ||
        entry.primaryCanonicalValueSha256 !==
          entry.independentCanonicalValueSha256 ||
        entry.valuesEqual !== true ||
        entry.status !== "pass"
      ) {
        violations.push(
          `replay_metric_leaf_comparison_invalid:/replayMetricComparisons/${index}`,
        );
      }
    });

    const diagnostic = isRecord(value.diagnosticInputAuthorization)
      ? value.diagnosticInputAuthorization
      : null;
    if (
      diagnostic == null ||
      !hasExactKeys(diagnostic, DIAGNOSTIC_KEYS) ||
      diagnostic.authorizationKind !==
        "candidate_scoped_diagnostic_input_only" ||
      diagnostic.candidateId !== candidate?.candidateId ||
      !sameOrderedStrings(
        diagnostic.authorizedInputIds,
        NHM2_SEMICLASSICAL_V2_PAIR_DIAGNOSTIC_INPUT_IDS,
      ) ||
      diagnostic.authorizedInputCount !== 2 ||
      diagnostic.lampStateAuthority !== false ||
      diagnostic.lampPromotionAuthority !== false
    ) {
      violations.push("diagnostic_input_authorization_invalid");
    }

    const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      claimLocks == null ||
      !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
      CLAIM_LOCK_KEYS.some((key) => claimLocks[key] !== false)
    ) {
      violations.push("claim_locks_invalid");
    }

    const integrity = isRecord(value.receiptIntegrity)
      ? value.receiptIntegrity
      : null;
    if (
      integrity == null ||
      !hasExactKeys(integrity, INTEGRITY_KEYS) ||
      integrity.algorithm !== "sha256" ||
      integrity.canonicalization !==
        "recursive_lexicographic_object_keys_preserve_array_order_v1" ||
      integrity.hashDomain !==
        NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_RECEIPT_SHA256_DOMAIN ||
      !isSha256(integrity.receiptSha256)
    ) {
      violations.push("receipt_integrity_shape_invalid");
    } else {
      const { receiptIntegrity: _integrity, ...unsigned } = value;
      if (
        integrity.receiptSha256 !==
        computeNhm2SemiclassicalV2PairAgreementReceiptSha256(
          unsigned as Nhm2SemiclassicalV2PairAgreementUnsignedReceiptV1,
        )
      ) {
        violations.push("receipt_integrity_sha256_mismatch");
      }
    }
    return unique(violations);
  } catch {
    return ["pair_agreement_shape_invalid"];
  }
};

/** Schema/self-hash type guard; deliberately not a server-origin predicate. */
export const isNhm2SemiclassicalV2PairAgreementV1 = (
  value: unknown,
): value is Nhm2SemiclassicalV2PairAgreementReceiptV1 =>
  nhm2SemiclassicalV2PairAgreementViolations(value).length === 0;
