import { createHash } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID,
  type Nhm2SphericalBosonStarV2PairNormalizedOutcomeV1,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-pair-agreement.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-regulator-definition.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS,
  Nhm2SphericalBosonStarV2RawFilesystemObserverError,
  observeNhm2SphericalBosonStarV2RawInventoryFromFilesystem,
  type Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1,
} from "./nhm2-spherical-boson-star-v2-raw-inventory-replayer";

export const NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_primary_science_replay_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_primary_science_replay_adapter/v1" as const;

type Descriptor =
  (typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS)[number];
type ConstraintDescriptor = Extract<Descriptor, { familyId: string }>;
type FamilyId = ConstraintDescriptor["familyId"];
type LevelId = ConstraintDescriptor["levelId"];
type Disposition = "blocked" | "fail";

export type Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode =
  | "filesystem_ingress_invalid"
  | "filesystem_platform_inadmissible"
  | "filesystem_observation_failed"
  | "filesystem_observation_binding_invalid"
  | "filesystem_entry_changed_after_observation"
  | "filesystem_secure_reread_failed"
  | "private_filesystem_capability_required"
  | "decoded_inventory_invalid"
  | "decoded_nonfinite"
  | "decoded_negative_zero"
  | "decoded_role_sensitive_negative"
  | "metric_demand_static_input_capability_missing"
  | "smearing_weights_not_frozen_exact"
  | "numeric_replay_nonfinite"
  | "smearing_weights_not_normalized"
  | "noise_exchange_symmetry_exceeds_tolerance"
  | "noise_psd_negative_witness"
  | "noise_psd_numerically_inconclusive"
  | "fluctuation_ratio_exceeds_tolerance"
  | "server_recomputed_classical_target_capability_missing"
  | "server_recomputed_classical_target_capability_unauthenticated"
  | "server_recomputed_classical_target_capability_invalid"
  | "submitted_target_echo_mismatch"
  | "submitted_residual_echo_mismatch"
  | "constraint_residual_recompute_nonfinite"
  | "residual_upper95_exceeds_frozen_tolerance"
  | "regulator_exact_zero_order_blocked"
  | "regulator_nonfinite"
  | "regulator_not_monotone"
  | "regulator_order_below_minimum"
  | "regulator_final_residual_exceeds_tolerance"
  | "regulator_final_error_exceeds_tolerance"
  | "si_normalization_content_binding_missing"
  | "execution_provenance_and_preseal_unverified"
  | "independent_implementation_agreement_missing";

export type Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue = Readonly<{
  code: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode;
  disposition: Disposition;
  detail: string;
}>;

type ResidualMetrics = Readonly<{
  levelId: LevelId;
  familyId: FamilyId;
  residualLInf: number;
  residualUpper95: number;
  submittedResidualMismatchLInf: number;
  frozenTolerance: number;
  authoritativeTargetAuthenticated: boolean;
  submittedTargetEchoMismatchLInf: number | null;
}>;

type RegulatorMetrics = Readonly<{
  familyId: FamilyId;
  d01Lower: number;
  d01Upper: number;
  d12Lower: number;
  d12Upper: number;
  pLower: number | null;
  qByLevel: readonly [number, number, number];
  centralResidualUpper95: number;
  monotone: boolean;
  pass: boolean;
}>;

export type Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_CONTRACT_VERSION;
  candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID;
  stage: "stage_2_candidate_specific_primary_server_science_replay";
  calculationOnly: true;
  serverOwned: true;
  overallDisposition: "blocked";
  readiness: false;
  primaryReplayComplete: false;
  candidateDisposition: "blocked_pending_authority" | "failed_without_retuning";
  issues: readonly Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue[];
  blockers: readonly Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode[];
  failures: readonly Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode[];
  normalizedOutcomeProjection: readonly Nhm2SphericalBosonStarV2PairNormalizedOutcomeV1[];
  filesystemBinding: Readonly<{
    observationAccepted: boolean;
    exact68RolesBound: boolean;
    rawHashClosureSha256: string | null;
    rootRealPath: string | null;
    boundedSequentialCurrentReadOnly: true;
    atomicSnapshotOrStabilityThroughReturnClaimed: false;
  }>;
  targetBoundary: Readonly<{
    callerTargetArraysAccepted: false;
    submittedRawTargetsAuthoritative: false;
    authenticatedServerTargetCapabilityAccepted: boolean;
    authenticatedTargetBinding: string | null;
    targetCapabilityIssuerPresent: false;
  }>;
  metrics: Readonly<{
    input: Readonly<{
      fileCount: 68;
      float64ValueCount: number;
      allValuesFinite: boolean;
      allNegativeZeroExcluded: boolean;
      allRoleSensitiveValuesNonnegative: boolean;
    }> | null;
    noise: Readonly<{
      exchangeResidualUpper95SI: number;
      exchangeToleranceSI: number;
      psdDisposition:
        "tolerance_certified" | "negative_witness" | "numerically_inconclusive";
      psdMethod: "gershgorin_lower_bound_then_diagonal_and_two_coordinate_rayleigh_witness_then_shifted_cholesky_with_residual_bound";
      psdToleranceSI: number;
      minimumGershgorinLowerSI: number;
      minimumRayleighWitnessUpperSI: number | null;
      maximumEigenvalueUpper95SI: number;
    }> | null;
    fluctuation: Readonly<{
      smearingWeightSum: number;
      symmetricTensorFrobeniusSI: number;
      fluctuationAmplitudeUpper95SI: number;
      fluctuationToMeanRatioUpper95: number;
      frozenTolerance: number;
    }> | null;
    residuals: readonly ResidualMetrics[];
    regulator: readonly RegulatorMetrics[];
  }>;
  replayTrace: Readonly<{
    genuineObserverInvokedInternally: boolean;
    exact68DescriptorInventoryRebound: boolean;
    allSizesPreflightedBeforeReplayAllocation: boolean;
    everyFileSecurelyReopenedAndHashMatchedObserver: boolean;
    everyFileFinalSweepIdentityAndHashMatchedObserver: boolean;
    finalExactDirectoryInventoryReenumerated: boolean;
    privateOneShotFilesystemCapabilityMintedAndConsumed: boolean;
    finitenessRecomputed: boolean;
    metricDemandNondegeneracyRecomputed: false;
    meanMetricDemandClosureRecomputed: false;
    metricDemandErrorEnclosureRecomputed: false;
    smearingWeightFreezeRecomputed: boolean;
    smearingNormalizationRecomputed: boolean;
    exchangeSymmetryRecomputed: boolean;
    psdRecomputed: boolean;
    fluctuationRecomputed: boolean;
    bracketResidualsRequireAuthenticatedServerTargets: true;
    antisymmetryRecomputedAtAllThreeLevels: boolean;
    jacobiRecomputedAtAllThreeLevels: boolean;
    candidateSpecificConservativeRegulatorRecomputedForAvailableNonTargetFamilies: boolean;
    allFiveFamilyRegulatorsRecomputed: false;
    legacySpacingRegulatorUsed: false;
    failureRetuningPerformed: false;
  }>;
  authorityBoundary: Readonly<{
    filesystemFreshnessOrExecutionProvenance: false;
    scientificPresealVerified: false;
    staticScientificInputClosureVerified: false;
    serverClassicalTargetDerivationVerified: false;
    primaryReplayAuthority: false;
    independentAgreement: false;
    semiclassicalStressNoiseLamp: false;
    semiclassicalConstraintAlgebraLamp: false;
    diagnosticPass: false;
    theoryGraphPromotion: false;
    physicalViability: false;
    propulsion: false;
    transport: false;
    certificateAuthority: false;
  }>;
}>;

type FilesystemIdentity = Readonly<{
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
  nlink: bigint;
}>;

type DirectoryGuard = Readonly<{
  absolutePath: string;
  realPath: string;
  identity: FilesystemIdentity;
}>;

type PreflightFile = Readonly<{
  descriptor: Descriptor;
  relativePath: string;
  absolutePath: string;
  identity: FilesystemIdentity;
  expectedSha256: string;
}>;

type RawCapabilityState = Readonly<{
  arraysByOrdinal: readonly Float64Array[];
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1;
}>;

type AuthenticatedTargetState = Readonly<{
  binding: string;
  provenance: Readonly<{
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID;
    rawReplaySchemaSha256: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.sha256;
    derivationOrigin: "server_recomputed_from_frozen_dirac_structure_functions";
    exactTargetCount: 9;
    independentlyAllocatedImmutableSnapshot: true;
  }>;
  targets: ReadonlyMap<string, Float64Array>;
}>;

const RAW_CAPABILITIES = new WeakMap<object, RawCapabilityState>();
// There is deliberately no issuer in this adapter. A future target producer
// must add an authenticated server-only integration; caller arrays never mint
// target authority here.
const AUTHENTICATED_TARGET_CAPABILITIES = new WeakMap<
  object,
  AuthenticatedTargetState
>();

const OUTPUT_PREFIX = "{outputDirectory}/";
const NONNEGATIVE_ORDINALS = new Set<number>([
  1, 3, 4, 8, 12, 16, 20, 25, 29, 33, 37, 41, 46, 50, 54, 58, 62, 67,
]);
const MULTIPLICITIES = Object.freeze([1, 2, 2, 2, 1, 2, 2, 1, 2, 1]);
const TOLERANCES =
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.toleranceEquivalence
    .commonThresholds;
const REGULATOR = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.convergence;
const FAMILY_ORDER = Object.freeze([
  ...NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.familyOrder,
]);
const BRACKET_FAMILY_ORDER = Object.freeze(["H_H", "H_Hi", "Hi_Hj"] as const);
const LEVEL_ORDER = Object.freeze([
  ...NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.levels,
]);
const EXPECTED_TARGET_KEYS = Object.freeze(
  LEVEL_ORDER.flatMap((level) =>
    BRACKET_FAMILY_ORDER.map(
      (familyId) => `${level.levelId}.${familyId}` as const,
    ),
  ),
);

const AUTHORITY_BOUNDARY = Object.freeze({
  filesystemFreshnessOrExecutionProvenance: false as const,
  scientificPresealVerified: false as const,
  staticScientificInputClosureVerified: false as const,
  serverClassicalTargetDerivationVerified: false as const,
  primaryReplayAuthority: false as const,
  independentAgreement: false as const,
  semiclassicalStressNoiseLamp: false as const,
  semiclassicalConstraintAlgebraLamp: false as const,
  diagnosticPass: false as const,
  theoryGraphPromotion: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  certificateAuthority: false as const,
});

class ReplayFilesystemError extends Error {
  constructor(
    readonly code:
      | "filesystem_observation_binding_invalid"
      | "filesystem_entry_changed_after_observation"
      | "filesystem_secure_reread_failed"
      | "decoded_inventory_invalid"
      | "decoded_nonfinite"
      | "decoded_negative_zero"
      | "decoded_role_sensitive_negative"
      | "smearing_weights_not_frozen_exact",
    message: string,
  ) {
    super(message);
    this.name = "ReplayFilesystemError";
  }
}

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

const issue = (
  code: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode,
  disposition: Disposition,
  detail: string,
): Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue => ({
  code,
  disposition,
  detail,
});

const addIssue = (
  issues: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue[],
  code: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode,
  disposition: Disposition,
  detail: string,
): void => {
  if (!issues.some((entry) => entry.code === code))
    issues.push(issue(code, disposition, detail));
};

type NormalizedOutcomeStatus = Readonly<{
  disposition: "pass" | "fail" | "blocked";
  toleranceSatisfied?: Readonly<Record<string, boolean>>;
  incompleteAfterObservedFail?: boolean;
}>;

const normalizedOutcome = (
  role: (typeof NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES)[number],
  status: NormalizedOutcomeStatus,
): Nhm2SphericalBosonStarV2PairNormalizedOutcomeV1 => {
  const appliedToleranceResults = role.appliedToleranceIds.map(
    (toleranceId) => ({
      toleranceId,
      comparisonRelation:
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID[
          toleranceId as keyof typeof NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID
        ],
      satisfied: status.toleranceSatisfied?.[toleranceId] === true,
    }),
  );
  const orderedIssueCodes =
    status.disposition === "pass"
      ? []
      : status.disposition === "blocked"
        ? [
            NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES.blocked,
          ]
        : [
            ...(role.appliedToleranceIds.length === 0
              ? [
                  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES[
                    role.checkId as keyof typeof NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES
                  ] ??
                    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES.blocked,
                ]
              : appliedToleranceResults
                  .filter((entry) => !entry.satisfied)
                  .map(
                    (entry) =>
                      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID[
                        entry.toleranceId
                      ],
                  )),
            ...(status.incompleteAfterObservedFail
              ? [
                  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES.blocked,
                ]
              : []),
          ];
  return {
    ordinal: role.ordinal,
    checkId: role.checkId,
    scopeId: role.scopeId,
    disposition: status.disposition,
    appliedToleranceIds: [...role.appliedToleranceIds],
    appliedToleranceResults,
    orderedIssueCodes,
  };
};

const primaryNormalizedOutcomeProjection = (input: {
  issues: readonly Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue[];
  metrics: Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1["metrics"];
  trace: Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1["replayTrace"];
}): readonly Nhm2SphericalBosonStarV2PairNormalizedOutcomeV1[] => {
  const statuses: NormalizedOutcomeStatus[] = Array.from(
    { length: 30 },
    () => ({ disposition: "blocked" as const }),
  );
  const issueCodes = new Set(input.issues.map((entry) => entry.code));
  const definitiveFinitenessFailure = (
    [
      "decoded_nonfinite",
      "decoded_negative_zero",
      "decoded_role_sensitive_negative",
    ] as const satisfies readonly Nhm2SphericalBosonStarV2PrimaryScienceReplayIssueCode[]
  ).some((code) => issueCodes.has(code));
  if (definitiveFinitenessFailure) statuses[0] = { disposition: "fail" };
  else if (input.trace.finitenessRecomputed && input.metrics.input != null)
    statuses[0] = { disposition: "pass" };

  if (issueCodes.has("smearing_weights_not_frozen_exact"))
    statuses[4] = { disposition: "fail" };
  else if (input.trace.smearingWeightFreezeRecomputed)
    statuses[4] = { disposition: "pass" };

  if (input.trace.smearingNormalizationRecomputed) {
    const satisfied = !issueCodes.has("smearing_weights_not_normalized");
    statuses[5] = {
      disposition: satisfied ? "pass" : "fail",
      toleranceSatisfied: { smearingWeightSumAbsolute: satisfied },
    };
  }

  const noise = input.metrics.noise;
  if (input.trace.exchangeSymmetryRecomputed && noise != null) {
    const satisfied =
      noise.exchangeResidualUpper95SI <= noise.exchangeToleranceSI;
    statuses[6] = {
      disposition: satisfied ? "pass" : "fail",
      toleranceSatisfied: { exchangeSymmetryUpper95SI: satisfied },
    };
  }
  if (input.trace.psdRecomputed && noise != null) {
    const satisfied = noise.psdDisposition === "tolerance_certified";
    statuses[7] = {
      disposition:
        noise.psdDisposition === "numerically_inconclusive"
          ? "blocked"
          : satisfied
            ? "pass"
            : "fail",
      toleranceSatisfied: { psdNegativeEigenvalueSI: satisfied },
    };
    if (Number.isFinite(noise.maximumEigenvalueUpper95SI))
      statuses[8] = { disposition: "pass" };
  }
  const fluctuation = input.metrics.fluctuation;
  if (input.trace.fluctuationRecomputed && fluctuation != null) {
    const ratioSatisfied =
      fluctuation.fluctuationToMeanRatioUpper95 <= fluctuation.frozenTolerance;
    statuses[9] = {
      disposition: ratioSatisfied ? "pass" : "fail",
      toleranceSatisfied: {
        fluctuationToMeanRatioUpper95: ratioSatisfied,
        meanNormalizationFloorSI: true,
      },
    };
  }

  const residualByScope = new Map(
    input.metrics.residuals.map((entry) => [
      `${entry.levelId}.${entry.familyId}`,
      entry,
    ]),
  );
  for (let ordinal = 10; ordinal < 25; ordinal += 1) {
    const role = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES[ordinal];
    const metric = residualByScope.get(role.scopeId);
    if (metric == null) continue;
    const float64Satisfied =
      metric.submittedResidualMismatchLInf <=
        TOLERANCES.float64RecomputeAbsolute &&
      (metric.submittedTargetEchoMismatchLInf == null ||
        metric.submittedTargetEchoMismatchLInf <=
          TOLERANCES.float64RecomputeAbsolute);
    const toleranceSatisfied: Record<string, boolean> = {
      float64RecomputeAbsolute: float64Satisfied,
    };
    if (role.appliedToleranceIds.length === 2)
      toleranceSatisfied[role.appliedToleranceIds[0]] =
        metric.residualUpper95 <= metric.frozenTolerance;
    const satisfied = role.appliedToleranceIds.every(
      (toleranceId) => toleranceSatisfied[toleranceId] === true,
    );
    statuses[ordinal] = {
      disposition: satisfied ? "pass" : "fail",
      toleranceSatisfied,
    };
  }

  const regulatorByFamily = new Map(
    input.metrics.regulator.map((entry) => [entry.familyId, entry]),
  );
  for (let ordinal = 25; ordinal < 30; ordinal += 1) {
    const role = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES[ordinal];
    const metric = regulatorByFamily.get(role.scopeId as FamilyId);
    if (metric == null) continue;
    const residualSatisfied =
      metric.centralResidualUpper95 <= TOLERANCES.regulatorResidualUpper95;
    const finalErrorSatisfied =
      metric.qByLevel[2] <= REGULATOR.finalRegulatorErrorUpper95Tolerance;
    const orderAvailable = metric.pLower != null;
    const orderSatisfied =
      orderAvailable && metric.pLower! >= REGULATOR.minimumObservedOrder;
    const toleranceSatisfied = {
      regulatorResidualUpper95: residualSatisfied,
      finalRegulatorErrorUpper95Tolerance: finalErrorSatisfied,
      regulatorMonotonicityAbsolute: metric.monotone,
      minimumRegulatorConvergenceOrder: orderSatisfied,
    };
    const anyDefinitiveFailure =
      !residualSatisfied ||
      !finalErrorSatisfied ||
      !metric.monotone ||
      (orderAvailable && !orderSatisfied);
    statuses[ordinal] = {
      disposition: anyDefinitiveFailure
        ? "fail"
        : orderAvailable
          ? "pass"
          : "blocked",
      toleranceSatisfied,
      incompleteAfterObservedFail: anyDefinitiveFailure && !orderAvailable,
    };
  }

  return NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_ROLES.map((role) =>
    normalizedOutcome(role, statuses[role.ordinal]),
  );
};

const makeReceipt = (input: {
  issues: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue[];
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1 | null;
  targetAccepted: boolean;
  targetBinding: string | null;
  metrics?: Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1["metrics"];
  trace?: Partial<
    Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1["replayTrace"]
  >;
}): Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1 => {
  const failures = input.issues
    .filter((entry) => entry.disposition === "fail")
    .map((entry) => entry.code);
  const blockers = input.issues
    .filter((entry) => entry.disposition === "blocked")
    .map((entry) => entry.code);
  const metrics = input.metrics ?? {
    input: null,
    noise: null,
    fluctuation: null,
    residuals: [],
    regulator: [],
  };
  const replayTrace = {
    genuineObserverInvokedInternally: false,
    exact68DescriptorInventoryRebound: false,
    allSizesPreflightedBeforeReplayAllocation: false,
    everyFileSecurelyReopenedAndHashMatchedObserver: false,
    everyFileFinalSweepIdentityAndHashMatchedObserver: false,
    finalExactDirectoryInventoryReenumerated: false,
    privateOneShotFilesystemCapabilityMintedAndConsumed: false,
    finitenessRecomputed: false,
    metricDemandNondegeneracyRecomputed: false as const,
    meanMetricDemandClosureRecomputed: false as const,
    metricDemandErrorEnclosureRecomputed: false as const,
    smearingWeightFreezeRecomputed: false,
    smearingNormalizationRecomputed: false,
    exchangeSymmetryRecomputed: false,
    psdRecomputed: false,
    fluctuationRecomputed: false,
    bracketResidualsRequireAuthenticatedServerTargets: true as const,
    antisymmetryRecomputedAtAllThreeLevels: false,
    jacobiRecomputedAtAllThreeLevels: false,
    candidateSpecificConservativeRegulatorRecomputedForAvailableNonTargetFamilies: false,
    allFiveFamilyRegulatorsRecomputed: false as const,
    legacySpacingRegulatorUsed: false as const,
    failureRetuningPerformed: false as const,
    ...input.trace,
  };
  const normalizedOutcomeProjection = primaryNormalizedOutcomeProjection({
    issues: input.issues,
    metrics,
    trace: replayTrace,
  });
  return deepFreeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRIMARY_SCIENCE_REPLAY_ADAPTER_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    stage: "stage_2_candidate_specific_primary_server_science_replay" as const,
    calculationOnly: true as const,
    serverOwned: true as const,
    overallDisposition: "blocked" as const,
    readiness: false as const,
    primaryReplayComplete: false as const,
    candidateDisposition:
      failures.length > 0
        ? ("failed_without_retuning" as const)
        : ("blocked_pending_authority" as const),
    issues: input.issues,
    blockers,
    failures,
    normalizedOutcomeProjection,
    filesystemBinding: {
      observationAccepted: input.observation != null,
      exact68RolesBound: input.observation?.fileCount === 68,
      rawHashClosureSha256:
        input.observation?.contentAdmission.observedInputBinding
          .rawHashClosureSha256 ?? null,
      rootRealPath: input.observation?.rootRealPath ?? null,
      boundedSequentialCurrentReadOnly: true as const,
      atomicSnapshotOrStabilityThroughReturnClaimed: false as const,
    },
    targetBoundary: {
      callerTargetArraysAccepted: false as const,
      submittedRawTargetsAuthoritative: false as const,
      authenticatedServerTargetCapabilityAccepted: input.targetAccepted,
      authenticatedTargetBinding: input.targetBinding,
      targetCapabilityIssuerPresent: false as const,
    },
    metrics,
    replayTrace,
    authorityBoundary: { ...AUTHORITY_BOUNDARY },
  });
};

const statIdentity = (stat: BigIntStats): FilesystemIdentity => ({
  dev: stat.dev,
  ino: stat.ino,
  mode: stat.mode,
  size: stat.size,
  mtimeNs: stat.mtimeNs,
  ctimeNs: stat.ctimeNs,
  nlink: stat.nlink,
});

const sameIdentity = (
  left: FilesystemIdentity,
  right: FilesystemIdentity,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs &&
  left.nlink === right.nlink;

const identityMatchesObservation = (
  identity: FilesystemIdentity,
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1["files"][number]["filesystemIdentity"],
): boolean =>
  identity.dev.toString() === observation.dev &&
  identity.ino.toString() === observation.ino &&
  identity.size.toString() === observation.sizeBytes &&
  identity.mtimeNs.toString() === observation.mtimeNs &&
  identity.ctimeNs.toString() === observation.ctimeNs;

const exactRelativePath = (descriptor: Descriptor): string => {
  if (!descriptor.path.startsWith(OUTPUT_PREFIX))
    throw new ReplayFilesystemError(
      "filesystem_observation_binding_invalid",
      "A compiled descriptor is outside the sealed output prefix.",
    );
  const relativePath = descriptor.path.slice(OUTPUT_PREFIX.length);
  if (
    relativePath.length === 0 ||
    relativePath.includes("\\") ||
    relativePath
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  )
    throw new ReplayFilesystemError(
      "filesystem_observation_binding_invalid",
      "A compiled descriptor has a nonportable relative path.",
    );
  return relativePath;
};

const childPath = (root: string, relativePath: string): string => {
  const absolutePath = path.resolve(root, ...relativePath.split("/"));
  if (!absolutePath.startsWith(`${root}${path.sep}`))
    throw new ReplayFilesystemError(
      "filesystem_observation_binding_invalid",
      "A compiled descriptor escaped the authenticated root.",
    );
  return absolutePath;
};

type ExpectedDirectoryChildren = ReadonlyMap<
  string,
  ReadonlyMap<string, "directory" | "file">
>;

const makeExpectedDirectoryChildren = (): ExpectedDirectoryChildren => {
  const directories = new Map<string, Map<string, "directory" | "file">>();
  directories.set("", new Map());
  for (const descriptor of NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS) {
    const segments = exactRelativePath(descriptor).split("/");
    let parent = "";
    for (let index = 0; index < segments.length; index += 1) {
      const name = segments[index];
      const kind = index === segments.length - 1 ? "file" : "directory";
      const children = directories.get(parent);
      if (children == null)
        throw new ReplayFilesystemError(
          "filesystem_observation_binding_invalid",
          "The compiled replay directory tree is incomplete.",
        );
      const prior = children.get(name);
      if (prior != null && prior !== kind)
        throw new ReplayFilesystemError(
          "filesystem_observation_binding_invalid",
          "The compiled replay directory tree contains a file-directory collision.",
        );
      children.set(name, kind);
      if (kind === "directory") {
        parent = parent.length === 0 ? name : `${parent}/${name}`;
        if (!directories.has(parent)) directories.set(parent, new Map());
      }
    }
  }
  return directories;
};

const EXPECTED_DIRECTORY_CHILDREN = makeExpectedDirectoryChildren();

const directoryPath = (root: string, relativeDirectory: string): string =>
  relativeDirectory.length === 0 ? root : childPath(root, relativeDirectory);

const observeDirectoryGuard = async (
  absolutePath: string,
): Promise<DirectoryGuard> => {
  const stat = await fs.lstat(absolutePath, { bigint: true });
  const realPath = await fs.realpath(absolutePath);
  if (stat.isSymbolicLink() || !stat.isDirectory() || realPath !== absolutePath)
    throw new ReplayFilesystemError(
      "filesystem_entry_changed_after_observation",
      "An authenticated output directory became indirect or non-directory.",
    );
  return { absolutePath, realPath, identity: statIdentity(stat) };
};

const collectDirectoryGuards = async (
  root: string,
): Promise<readonly DirectoryGuard[]> => {
  const ordered = [...EXPECTED_DIRECTORY_CHILDREN.keys()]
    .map((relativeDirectory) => directoryPath(root, relativeDirectory))
    .sort(
      (left, right) => left.length - right.length || left.localeCompare(right),
    );
  const guards: DirectoryGuard[] = [];
  for (const absolutePath of ordered)
    guards.push(await observeDirectoryGuard(absolutePath));
  return guards;
};

const verifyDirectoryGuards = async (
  guards: readonly DirectoryGuard[],
): Promise<void> => {
  for (const guard of guards) {
    const current = await observeDirectoryGuard(guard.absolutePath);
    if (
      current.realPath !== guard.realPath ||
      !sameIdentity(current.identity, guard.identity)
    )
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        "An authenticated output directory changed during the bounded reread.",
      );
  }
};

const verifyExactDirectoryInventory = async (
  root: string,
  guards: readonly DirectoryGuard[],
): Promise<void> => {
  const guardsByPath = new Map(
    guards.map((guard) => [guard.absolutePath, guard] as const),
  );
  const relativeDirectories = [...EXPECTED_DIRECTORY_CHILDREN.keys()].sort(
    (left, right) => left.length - right.length || left.localeCompare(right),
  );
  for (const relativeDirectory of relativeDirectories) {
    const absolutePath = directoryPath(root, relativeDirectory);
    const expected = EXPECTED_DIRECTORY_CHILDREN.get(relativeDirectory);
    const guard = guardsByPath.get(absolutePath);
    if (expected == null || guard == null)
      throw new ReplayFilesystemError(
        "filesystem_observation_binding_invalid",
        "The exact compiled replay directory inventory is unavailable.",
      );
    const before = await observeDirectoryGuard(absolutePath);
    if (
      before.realPath !== guard.realPath ||
      !sameIdentity(before.identity, guard.identity)
    )
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        "An authenticated output directory changed before final re-enumeration.",
      );

    let directory: Awaited<ReturnType<typeof fs.opendir>> | null = null;
    let caught: unknown = null;
    const observed = new Set<string>();
    try {
      directory = await fs.opendir(absolutePath);
      while (true) {
        const entry = await directory.read();
        if (entry == null) break;
        const expectedKind = expected.get(entry.name);
        if (
          expectedKind == null ||
          observed.has(entry.name) ||
          observed.size >= expected.size ||
          entry.isSymbolicLink() ||
          (expectedKind === "directory" && !entry.isDirectory()) ||
          (expectedKind === "file" && !entry.isFile())
        )
          throw new ReplayFilesystemError(
            "filesystem_entry_changed_after_observation",
            "The final replay directory inventory contains an extra, duplicate, indirect, or mistyped entry.",
          );
        observed.add(entry.name);
      }
      if (observed.size !== expected.size)
        throw new ReplayFilesystemError(
          "filesystem_entry_changed_after_observation",
          "The final replay directory inventory is missing a predeclared entry.",
        );
    } catch (error) {
      caught = error;
    } finally {
      if (directory != null) {
        try {
          await directory.close();
        } catch (error) {
          if (
            caught == null &&
            (error as NodeJS.ErrnoException).code !== "ERR_DIR_CLOSED"
          )
            caught = error;
        }
      }
    }
    if (caught != null) {
      if (caught instanceof ReplayFilesystemError) throw caught;
      throw new ReplayFilesystemError(
        "filesystem_secure_reread_failed",
        `The final exact directory re-enumeration failed (${(caught as NodeJS.ErrnoException).code ?? "unknown"}).`,
      );
    }
    const after = await observeDirectoryGuard(absolutePath);
    if (
      after.realPath !== guard.realPath ||
      !sameIdentity(after.identity, guard.identity)
    )
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        "An authenticated output directory changed during final re-enumeration.",
      );
  }
};

const validateObservationBinding = (
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1,
): void => {
  const descriptors =
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS;
  if (
    observation.fileCount !== 68 ||
    observation.files.length !== descriptors.length ||
    observation.aggregateBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactAggregateBytes ||
    observation.contentAdmission.observedInputBinding.rawReplaySchema.sha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.sha256
  )
    throw new ReplayFilesystemError(
      "filesystem_observation_binding_invalid",
      "The genuine observer receipt does not bind the exact compiled inventory.",
    );
  for (let index = 0; index < descriptors.length; index += 1) {
    const descriptor = descriptors[index];
    const file = observation.files[index];
    if (
      descriptor.fileOrdinal !== index ||
      file.fileOrdinal !== index ||
      file.relativePath !== exactRelativePath(descriptor) ||
      file.role !== descriptor.role ||
      file.sizeBytes !== descriptor.sizeBytes ||
      !/^[a-f0-9]{64}$/.test(file.sha256)
    )
      throw new ReplayFilesystemError(
        "filesystem_observation_binding_invalid",
        `Observer role binding ${index} does not match the compiled schema.`,
      );
  }
  if (
    observation.files[4].sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256
  )
    throw new ReplayFilesystemError(
      "smearing_weights_not_frozen_exact",
      "The authenticated smearing-weight file hash is not the candidate-bound exact 64-copy 1/64 byte string.",
    );
};

const preflightFiles = async (
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1,
): Promise<readonly PreflightFile[]> => {
  let aggregate = BigInt(0);
  const files: PreflightFile[] = [];
  for (const descriptor of NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS) {
    const relativePath = exactRelativePath(descriptor);
    const absolutePath = childPath(observation.rootRealPath, relativePath);
    const stat = await fs.lstat(absolutePath, { bigint: true });
    const realPath = await fs.realpath(absolutePath);
    const identity = statIdentity(stat);
    const observed = observation.files[descriptor.fileOrdinal];
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      stat.nlink !== BigInt(1) ||
      stat.size !== BigInt(descriptor.sizeBytes) ||
      realPath !== absolutePath ||
      !identityMatchesObservation(identity, observed.filesystemIdentity)
    )
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        `The authenticated file ${relativePath} changed before science replay.`,
      );
    aggregate += stat.size;
    if (
      aggregate >
      BigInt(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.maximumAggregateBytes,
      )
    )
      throw new ReplayFilesystemError(
        "filesystem_secure_reread_failed",
        "The science-reread inventory exceeds its fixed aggregate cap.",
      );
    files.push({
      descriptor,
      relativePath,
      absolutePath,
      identity,
      expectedSha256: observed.sha256,
    });
  }
  if (
    files.length !== 68 ||
    aggregate !==
      BigInt(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_INVENTORY_LIMITS.exactAggregateBytes,
      )
  )
    throw new ReplayFilesystemError(
      "filesystem_secure_reread_failed",
      "The science-reread preflight is not the exact sealed inventory.",
    );
  return files;
};

const openFlags = (): number =>
  fsConstants.O_RDONLY |
  (typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0) |
  (typeof fsConstants.O_NONBLOCK === "number" ? fsConstants.O_NONBLOCK : 0);

const readPreflightedFile = async (
  file: PreflightFile,
): Promise<Uint8Array> => {
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  let caught: unknown = null;
  let bytes: Uint8Array | null = null;
  try {
    handle = await fs.open(file.absolutePath, openFlags());
    const before = await handle.stat({ bigint: true });
    const openedIdentity = statIdentity(before);
    if (
      !before.isFile() ||
      before.nlink !== BigInt(1) ||
      !sameIdentity(openedIdentity, file.identity)
    )
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        `The opened descriptor for ${file.relativePath} changed identity.`,
      );
    bytes = new Uint8Array(file.descriptor.sizeBytes);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const read = await handle.read(
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (read.bytesRead <= 0)
        throw new ReplayFilesystemError(
          "filesystem_secure_reread_failed",
          `The bounded read of ${file.relativePath} ended early.`,
        );
      offset += read.bytesRead;
    }
    const trailing = new Uint8Array(1);
    if (
      (await handle.read(trailing, 0, 1, file.descriptor.sizeBytes))
        .bytesRead !== 0
    )
      throw new ReplayFilesystemError(
        "filesystem_secure_reread_failed",
        `The bounded read of ${file.relativePath} found trailing bytes.`,
      );
    const after = await handle.stat({ bigint: true });
    if (!sameIdentity(openedIdentity, statIdentity(after)))
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        `The descriptor for ${file.relativePath} changed during reread.`,
      );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== file.expectedSha256)
      throw new ReplayFilesystemError(
        "filesystem_entry_changed_after_observation",
        `The bytes for ${file.relativePath} no longer match the authenticated observation.`,
      );
  } catch (error) {
    caught = error;
  } finally {
    if (handle != null) {
      try {
        await handle.close();
      } catch (error) {
        if (caught == null) caught = error;
      }
    }
  }
  if (caught != null) {
    if (caught instanceof ReplayFilesystemError) throw caught;
    throw new ReplayFilesystemError(
      "filesystem_secure_reread_failed",
      `The secure bounded reread failed (${(caught as NodeJS.ErrnoException).code ?? "unknown"}).`,
    );
  }
  const afterClose = await fs.lstat(file.absolutePath, { bigint: true });
  const afterCloseRealPath = await fs.realpath(file.absolutePath);
  if (
    afterClose.isSymbolicLink() ||
    !afterClose.isFile() ||
    afterCloseRealPath !== file.absolutePath ||
    !sameIdentity(statIdentity(afterClose), file.identity)
  )
    throw new ReplayFilesystemError(
      "filesystem_entry_changed_after_observation",
      `The path for ${file.relativePath} changed after descriptor close.`,
    );
  return bytes!;
};

const decodeInventory = (
  bytesByOrdinal: readonly Uint8Array[],
): Float64Array[] => {
  const arrays: Float64Array[] = [];
  for (
    let fileOrdinal = 0;
    fileOrdinal < bytesByOrdinal.length;
    fileOrdinal += 1
  ) {
    const bytes = bytesByOrdinal[fileOrdinal];
    const descriptor =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
        fileOrdinal
      ];
    if (bytes.byteLength !== descriptor.sizeBytes || bytes.byteLength % 8 !== 0)
      throw new ReplayFilesystemError(
        "decoded_inventory_invalid",
        `File ${fileOrdinal} cannot be decoded as its sealed float64 shape.`,
      );
    const values = new Float64Array(bytes.byteLength / 8);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let index = 0; index < values.length; index += 1) {
      const value = view.getFloat64(index * 8, true);
      if (!Number.isFinite(value))
        throw new ReplayFilesystemError(
          "decoded_nonfinite",
          `File ${fileOrdinal} contains a nonfinite float64 value.`,
        );
      if (Object.is(value, -0))
        throw new ReplayFilesystemError(
          "decoded_negative_zero",
          `File ${fileOrdinal} contains forbidden negative zero.`,
        );
      if (NONNEGATIVE_ORDINALS.has(fileOrdinal) && value < 0)
        throw new ReplayFilesystemError(
          "decoded_role_sensitive_negative",
          `File ${fileOrdinal} contains a forbidden negative value.`,
        );
      values[index] = value;
    }
    arrays.push(values);
  }
  if (arrays.length !== 68)
    throw new ReplayFilesystemError(
      "decoded_inventory_invalid",
      "The decoded inventory is not exactly 68 arrays.",
    );
  return arrays;
};

const mintRawFilesystemCapability = async (
  observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1,
): Promise<object> => {
  validateObservationBinding(observation);
  const directoryGuards = await collectDirectoryGuards(
    observation.rootRealPath,
  );
  const files = await preflightFiles(observation);
  const bytes: Uint8Array[] = [];
  for (const file of files) bytes.push(await readPreflightedFile(file));
  // Close the retired-entry window in the adapter's own reread with a second
  // complete identity-and-hash sweep. These are still bounded sequential read
  // points, not an atomic snapshot or a stability-through-return claim.
  for (const file of files) await readPreflightedFile(file);
  await verifyDirectoryGuards(directoryGuards);
  await verifyExactDirectoryInventory(
    observation.rootRealPath,
    directoryGuards,
  );
  const capability = Object.freeze(Object.create(null)) as object;
  RAW_CAPABILITIES.set(capability, {
    arraysByOrdinal: decodeInventory(bytes),
    observation,
  });
  return capability;
};

const kahanSum = (values: Float64Array): number => {
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

const sharesFloat64Storage = (
  left: Float64Array,
  right: Float64Array,
): boolean => left === right || left.buffer === right.buffer;

const maximumAbsoluteDifference = (
  left: Float64Array,
  right: Float64Array,
): number | null => {
  if (left.length !== right.length) return null;
  let maximum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = Math.abs(left[index] - right[index]);
    if (!Number.isFinite(difference)) return null;
    maximum = Math.max(maximum, difference);
  }
  return maximum;
};

const constraintDescriptor = (
  levelId: LevelId,
  familyId: FamilyId,
  operandRole: string,
): ConstraintDescriptor => {
  const descriptor =
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.find(
      (entry): entry is ConstraintDescriptor =>
        "familyId" in entry &&
        entry.levelId === levelId &&
        entry.familyId === familyId &&
        entry.operandRole === operandRole,
    );
  if (descriptor == null)
    throw new ReplayFilesystemError(
      "decoded_inventory_invalid",
      `Missing constraint role ${levelId}.${familyId}.${operandRole}.`,
    );
  return descriptor;
};

const validateAuthenticatedTargetState = (
  state: AuthenticatedTargetState,
  arrays: readonly Float64Array[],
): boolean => {
  if (
    !/^[a-f0-9]{64}$/.test(state.binding) ||
    state.provenance.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    state.provenance.rawReplaySchemaSha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.sha256 ||
    state.provenance.derivationOrigin !==
      "server_recomputed_from_frozen_dirac_structure_functions" ||
    state.provenance.exactTargetCount !== 9 ||
    state.provenance.independentlyAllocatedImmutableSnapshot !== true ||
    !(state.targets instanceof Map) ||
    Object.getPrototypeOf(state.targets) !== Map.prototype ||
    state.targets.size !== EXPECTED_TARGET_KEYS.length
  )
    return false;
  const targetBuffers = new Set<ArrayBufferLike>();
  for (const key of EXPECTED_TARGET_KEYS) {
    const [levelId, familyId] = key.split(".") as [
      LevelId,
      (typeof BRACKET_FAMILY_ORDER)[number],
    ];
    const computed =
      arrays[constraintDescriptor(levelId, familyId, "computed").fileOrdinal];
    const target = state.targets.get(key);
    if (
      !(target instanceof Float64Array) ||
      target.length !== computed.length ||
      arrays.some((entry) => sharesFloat64Storage(entry, target)) ||
      targetBuffers.has(target.buffer)
    )
      return false;
    for (const value of target)
      if (!Number.isFinite(value) || Object.is(value, -0)) return false;
    targetBuffers.add(target.buffer);
  }
  return true;
};

const sumResidual = (terms: readonly Float64Array[]): Float64Array | null => {
  if (terms.length < 2 || terms.some((term) => term.length !== terms[0].length))
    return null;
  const residual = new Float64Array(terms[0].length);
  for (let index = 0; index < residual.length; index += 1) {
    let value = terms[0][index];
    for (let term = 1; term < terms.length; term += 1) {
      value += terms[term][index];
      if (!Number.isFinite(value)) return null;
    }
    residual[index] = value;
  }
  return residual;
};

type PsdResult = Readonly<{
  disposition:
    "tolerance_certified" | "negative_witness" | "numerically_inconclusive";
  minimumRayleighWitnessUpperSI: number | null;
}>;

const gamma = (operations: number): number => {
  const product = operations * Number.EPSILON;
  return product < 1 ? product / (1 - product) : Number.POSITIVE_INFINITY;
};

const rayleighUpperBound = (
  value: number,
  absoluteTermSum: number,
  operations: number,
): number => value + gamma(operations) * (Math.abs(value) + absoluteTermSum);

const certifyPsd = (
  dimension: number,
  value: (row: number, column: number) => number,
  tolerance: number,
  minimumGershgorinLower: number,
): PsdResult => {
  if (minimumGershgorinLower >= -tolerance)
    return {
      disposition: "tolerance_certified",
      minimumRayleighWitnessUpperSI: null,
    };
  let minimumRayleighWitnessUpperSI = Number.POSITIVE_INFINITY;
  for (let index = 0; index < dimension; index += 1) {
    const diagonal = value(index, index);
    const upper = rayleighUpperBound(diagonal, Math.abs(diagonal), 4);
    if (!Number.isFinite(upper))
      return {
        disposition: "numerically_inconclusive",
        minimumRayleighWitnessUpperSI: null,
      };
    minimumRayleighWitnessUpperSI = Math.min(
      minimumRayleighWitnessUpperSI,
      upper,
    );
    if (upper < -tolerance)
      return {
        disposition: "negative_witness",
        minimumRayleighWitnessUpperSI: upper,
      };
  }
  // Deterministic normalized (e_i +/- e_j)/sqrt(2) Rayleigh witnesses catch
  // off-diagonal two-coordinate negative modes without importing the
  // independently authored full eigensolver.
  for (let row = 0; row < dimension; row += 1) {
    const rowDiagonal = value(row, row);
    for (let column = row + 1; column < dimension; column += 1) {
      const columnDiagonal = value(column, column);
      const offDiagonal = value(row, column);
      const halfTrace = 0.5 * rowDiagonal + 0.5 * columnDiagonal;
      const absoluteTermSum =
        0.5 * Math.abs(rowDiagonal) +
        0.5 * Math.abs(columnDiagonal) +
        Math.abs(offDiagonal);
      for (const sign of [-1, 1] as const) {
        const quotient = halfTrace + sign * offDiagonal;
        const upper = rayleighUpperBound(quotient, absoluteTermSum, 12);
        if (!Number.isFinite(upper))
          return {
            disposition: "numerically_inconclusive",
            minimumRayleighWitnessUpperSI: null,
          };
        minimumRayleighWitnessUpperSI = Math.min(
          minimumRayleighWitnessUpperSI,
          upper,
        );
        if (upper < -tolerance)
          return {
            disposition: "negative_witness",
            minimumRayleighWitnessUpperSI: upper,
          };
      }
    }
  }
  const shift = tolerance / 2;
  const residualAllowance = tolerance - shift;
  const lower = new Float64Array(dimension * dimension);
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let reduced = value(row, column) + (row === column ? shift : 0);
      for (let inner = 0; inner < column; inner += 1)
        reduced -=
          lower[row * dimension + inner] * lower[column * dimension + inner];
      if (!Number.isFinite(reduced) || (row === column && reduced < 0))
        return {
          disposition: "numerically_inconclusive",
          minimumRayleighWitnessUpperSI: Number.isFinite(
            minimumRayleighWitnessUpperSI,
          )
            ? minimumRayleighWitnessUpperSI
            : null,
        };
      if (row === column) {
        lower[row * dimension + column] = Math.sqrt(reduced);
      } else {
        const pivot = lower[column * dimension + column];
        if (pivot === 0) {
          if (reduced !== 0)
            return {
              disposition: "numerically_inconclusive",
              minimumRayleighWitnessUpperSI: Number.isFinite(
                minimumRayleighWitnessUpperSI,
              )
                ? minimumRayleighWitnessUpperSI
                : null,
            };
        } else {
          const factor = reduced / pivot;
          if (!Number.isFinite(factor))
            return {
              disposition: "numerically_inconclusive",
              minimumRayleighWitnessUpperSI: Number.isFinite(
                minimumRayleighWitnessUpperSI,
              )
                ? minimumRayleighWitnessUpperSI
                : null,
            };
          lower[row * dimension + column] = factor;
        }
      }
    }
  }
  let residualInfinityUpper = 0;
  for (let row = 0; row < dimension; row += 1) {
    let rowUpper = 0;
    for (let column = 0; column < dimension; column += 1) {
      const count = Math.min(row, column) + 1;
      let reconstructed = 0;
      let absoluteProducts = 0;
      for (let inner = 0; inner < count; inner += 1) {
        const product =
          lower[row * dimension + inner] * lower[column * dimension + inner];
        reconstructed += product;
        absoluteProducts += Math.abs(product);
      }
      const expected = value(row, column) + (row === column ? shift : 0);
      rowUpper +=
        Math.abs(expected - reconstructed) +
        gamma(2 * count + 4) * (Math.abs(expected) + absoluteProducts);
    }
    residualInfinityUpper = Math.max(
      residualInfinityUpper,
      rowUpper * (1 + gamma(dimension + 1)),
    );
  }
  return {
    disposition:
      Number.isFinite(residualInfinityUpper) &&
      residualInfinityUpper <= residualAllowance
        ? "tolerance_certified"
        : "numerically_inconclusive",
    minimumRayleighWitnessUpperSI: Number.isFinite(
      minimumRayleighWitnessUpperSI,
    )
      ? minimumRayleighWitnessUpperSI
      : null,
  };
};

const residualTolerance = (familyId: FamilyId): number =>
  familyId === "antisymmetry"
    ? TOLERANCES.antisymmetryResidualUpper95
    : familyId === "jacobi"
      ? TOLERANCES.jacobiResidualUpper95
      : TOLERANCES.bracketResidualUpper95;

const computeResidualMetrics = (
  familyId: FamilyId,
  levelId: LevelId,
  residual: Float64Array,
  submittedResidual: Float64Array,
  uncertainty: Float64Array,
  authoritativeTargetAuthenticated: boolean,
  submittedTargetEchoMismatchLInf: number | null,
): ResidualMetrics | null => {
  if (
    residual.length !== submittedResidual.length ||
    residual.length !== uncertainty.length
  )
    return null;
  let residualLInf = 0;
  let residualUpper95 = 0;
  let submittedResidualMismatchLInf = 0;
  for (let index = 0; index < residual.length; index += 1) {
    residualLInf = Math.max(residualLInf, Math.abs(residual[index]));
    residualUpper95 = Math.max(
      residualUpper95,
      Math.abs(residual[index]) + uncertainty[index],
    );
    submittedResidualMismatchLInf = Math.max(
      submittedResidualMismatchLInf,
      Math.abs(submittedResidual[index] - residual[index]),
    );
  }
  if (
    ![residualLInf, residualUpper95, submittedResidualMismatchLInf].every(
      Number.isFinite,
    )
  )
    return null;
  return {
    levelId,
    familyId,
    residualLInf,
    residualUpper95,
    submittedResidualMismatchLInf,
    frozenTolerance: residualTolerance(familyId),
    authoritativeTargetAuthenticated,
    submittedTargetEchoMismatchLInf,
  };
};

const computeRegulator = (
  familyId: FamilyId,
  residuals: readonly [Float64Array, Float64Array, Float64Array],
  uncertainties: readonly [Float64Array, Float64Array, Float64Array],
): RegulatorMetrics | null => {
  const length = residuals[0].length;
  if (
    residuals.some((entry) => entry.length !== length) ||
    uncertainties.some((entry) => entry.length !== length)
  )
    return null;
  let d01Lower = 0;
  let d01Upper = 0;
  let d12Lower = 0;
  let d12Upper = 0;
  const q = [0, 0, 0];
  let centralResidualUpper95 = 0;
  for (let index = 0; index < length; index += 1) {
    const d01 = Math.abs(residuals[0][index] - residuals[1][index]);
    const d12 = Math.abs(residuals[1][index] - residuals[2][index]);
    const u01 = uncertainties[0][index] + uncertainties[1][index];
    const u12 = uncertainties[1][index] + uncertainties[2][index];
    const e0 = 2 * d01;
    const e1 = 2 * d12;
    const e2 = d12;
    const ue0 = 2 * u01;
    const ue1 = 2 * u12;
    const ue2 = u12;
    const derived = [d01, d12, u01, u12, e0, e1, e2, ue0, ue1, ue2];
    if (!derived.every(Number.isFinite)) return null;
    d01Lower = Math.max(d01Lower, Math.max(0, d01 - u01));
    d01Upper = Math.max(d01Upper, d01 + u01);
    d12Lower = Math.max(d12Lower, Math.max(0, d12 - u12));
    d12Upper = Math.max(d12Upper, d12 + u12);
    q[0] = Math.max(q[0], Math.abs(e0) + ue0);
    q[1] = Math.max(q[1], Math.abs(e1) + ue1);
    q[2] = Math.max(q[2], Math.abs(e2) + ue2);
    centralResidualUpper95 = Math.max(
      centralResidualUpper95,
      Math.abs(residuals[2][index]) + uncertainties[2][index],
    );
  }
  if (
    ![
      d01Lower,
      d01Upper,
      d12Lower,
      d12Upper,
      ...q,
      centralResidualUpper95,
    ].every(Number.isFinite)
  )
    return null;
  const pLower =
    d01Lower > 0 && d12Upper > 0
      ? Math.log(d01Lower / d12Upper) / Math.log(2)
      : null;
  if (pLower != null && !Number.isFinite(pLower)) return null;
  const monotone =
    d12Upper <= d01Lower + REGULATOR.monotonicityAbsoluteTolerance;
  const pass =
    pLower != null &&
    pLower >= REGULATOR.minimumObservedOrder &&
    monotone &&
    centralResidualUpper95 <= REGULATOR.finalResidualUpper95Tolerance &&
    q[2] <= REGULATOR.finalRegulatorErrorUpper95Tolerance;
  return {
    familyId,
    d01Lower,
    d01Upper,
    d12Lower,
    d12Upper,
    pLower,
    qByLevel: [q[0], q[1], q[2]],
    centralResidualUpper95,
    monotone,
    pass,
  };
};

const inspectTargetCapability = (
  capability: unknown,
): AuthenticatedTargetState | null =>
  capability != null && typeof capability === "object"
    ? (AUTHENTICATED_TARGET_CAPABILITIES.get(capability) ?? null)
    : null;

const replayCapability = (
  capability: unknown,
  targetCapability: unknown,
): Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1 => {
  const state =
    capability != null && typeof capability === "object"
      ? RAW_CAPABILITIES.get(capability)
      : null;
  if (state == null)
    return makeReceipt({
      issues: [
        issue(
          "private_filesystem_capability_required",
          "blocked",
          "Science replay requires the module-private one-shot filesystem capability.",
        ),
      ],
      observation: null,
      targetAccepted: false,
      targetBinding: null,
    });
  RAW_CAPABILITIES.delete(capability as object);
  const arrays = state.arraysByOrdinal;
  const issues: Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue[] = [];
  const inspectedTarget = inspectTargetCapability(targetCapability);
  const target =
    inspectedTarget != null &&
    validateAuthenticatedTargetState(inspectedTarget, arrays)
      ? inspectedTarget
      : null;
  addIssue(
    issues,
    "metric_demand_static_input_capability_missing",
    "blocked",
    "The authenticated metric-demand tensor and absolute-error capability is absent, so nondegeneracy, mean-demand closure, and error-enclosure gates remain honestly unrecomputed.",
  );

  const weights = arrays[4];
  const smearingWeightsFrozenExact = weights.every(
    (value) => value === NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
  );
  if (!smearingWeightsFrozenExact)
    addIssue(
      issues,
      "smearing_weights_not_frozen_exact",
      "fail",
      "Every replay aggregation weight must equal the candidate-bound exact binary64 value 2^-6 before the normalization defense-in-depth check.",
    );
  const weightSum = kahanSum(weights);
  if (
    !Number.isFinite(weightSum) ||
    Math.abs(weightSum - 1) > TOLERANCES.smearingWeightSumAbsolute
  )
    addIssue(
      issues,
      "smearing_weights_not_normalized",
      "fail",
      "The independently summed smearing weights exceed the frozen normalization tolerance.",
    );

  const sampleCount = 64;
  const tensorComponents = 10;
  const dimension = sampleCount * tensorComponents;
  const noise = arrays[0];
  const noiseUncertainty = arrays[1];
  const mean = arrays[2];
  const point = (matrixIndex: number): number =>
    Math.floor(matrixIndex / tensorComponents);
  const component = (matrixIndex: number): number =>
    matrixIndex % tensorComponents;
  const offset = (row: number, column: number): number =>
    (point(row) * sampleCount + point(column)) * 100 +
    component(row) * tensorComponents +
    component(column);
  const scales = Float64Array.from({ length: dimension }, (_, index) =>
    Math.sqrt(weights[point(index)] * MULTIPLICITIES[component(index)]),
  );
  const central = (row: number, column: number): number =>
    0.5 *
    (noise[offset(row, column)] + noise[offset(column, row)]) *
    scales[row] *
    scales[column];
  let exchangeResidualUpper95SI = 0;
  let maximumEigenvalueUpper95SI = Number.NEGATIVE_INFINITY;
  let minimumGershgorinLowerSI = Number.POSITIVE_INFINITY;
  for (let row = 0; row < dimension; row += 1) {
    let centralRadius = 0;
    let upperRadius = 0;
    for (let column = 0; column < dimension; column += 1) {
      const directOffset = offset(row, column);
      const reverseOffset = offset(column, row);
      const direct = noise[directOffset];
      const reverse = noise[reverseOffset];
      const directUncertainty = noiseUncertainty[directOffset];
      const reverseUncertainty = noiseUncertainty[reverseOffset];
      if (row !== column) {
        exchangeResidualUpper95SI = Math.max(
          exchangeResidualUpper95SI,
          Math.abs(direct - reverse) + directUncertainty + reverseUncertainty,
        );
        const scale = scales[row] * scales[column];
        const midpoint = 0.5 * (direct + reverse) * scale;
        const radius =
          0.5 *
          (directUncertainty +
            reverseUncertainty +
            Math.abs(direct - reverse)) *
          scale;
        centralRadius += Math.abs(midpoint);
        upperRadius += Math.abs(midpoint) + radius;
      }
    }
    const diagonalOffset = offset(row, row);
    const diagonalScale = scales[row] * scales[row];
    const diagonal = noise[diagonalOffset] * diagonalScale;
    const diagonalUncertainty =
      noiseUncertainty[diagonalOffset] * diagonalScale;
    minimumGershgorinLowerSI = Math.min(
      minimumGershgorinLowerSI,
      diagonal - centralRadius,
    );
    maximumEigenvalueUpper95SI = Math.max(
      maximumEigenvalueUpper95SI,
      diagonal + diagonalUncertainty + upperRadius,
    );
  }
  const noiseDerivedFinite = [
    exchangeResidualUpper95SI,
    maximumEigenvalueUpper95SI,
    minimumGershgorinLowerSI,
  ].every(Number.isFinite);
  if (!noiseDerivedFinite)
    addIssue(
      issues,
      "numeric_replay_nonfinite",
      "blocked",
      "Noise recomputation produced a nonfinite derived value.",
    );
  if (exchangeResidualUpper95SI > TOLERANCES.exchangeSymmetryUpper95SI)
    addIssue(
      issues,
      "noise_exchange_symmetry_exceeds_tolerance",
      "fail",
      "Noise exchange symmetry exceeds the frozen upper-95 tolerance.",
    );
  const psd: PsdResult = noiseDerivedFinite
    ? certifyPsd(
        dimension,
        central,
        TOLERANCES.psdNegativeEigenvalueSI,
        minimumGershgorinLowerSI,
      )
    : {
        disposition: "numerically_inconclusive",
        minimumRayleighWitnessUpperSI: null,
      };
  if (noiseDerivedFinite && psd.disposition !== "tolerance_certified")
    addIssue(
      issues,
      psd.disposition === "negative_witness"
        ? "noise_psd_negative_witness"
        : "noise_psd_numerically_inconclusive",
      psd.disposition === "negative_witness" ? "fail" : "blocked",
      "The independently recomputed covariance did not obtain a tolerance-certified PSD result.",
    );

  const smeared = new Array<number>(tensorComponents).fill(0);
  const compensation = new Array<number>(tensorComponents).fill(0);
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (
      let componentOrdinal = 0;
      componentOrdinal < tensorComponents;
      componentOrdinal += 1
    ) {
      const product =
        weights[sample] * mean[sample * tensorComponents + componentOrdinal];
      const adjusted = product - compensation[componentOrdinal];
      const next = smeared[componentOrdinal] + adjusted;
      compensation[componentOrdinal] =
        next - smeared[componentOrdinal] - adjusted;
      smeared[componentOrdinal] = next;
    }
  }
  const symmetricTensorFrobeniusSI = Math.hypot(
    ...smeared.map((value, index) => value * Math.sqrt(MULTIPLICITIES[index])),
  );
  const fluctuationAmplitudeUpper95SI = Math.sqrt(
    Math.max(0, maximumEigenvalueUpper95SI),
  );
  const fluctuationToMeanRatioUpper95 =
    fluctuationAmplitudeUpper95SI /
    Math.max(symmetricTensorFrobeniusSI, TOLERANCES.meanNormalizationFloorSI);
  const fluctuationDerivedFinite = [
    symmetricTensorFrobeniusSI,
    fluctuationAmplitudeUpper95SI,
    fluctuationToMeanRatioUpper95,
  ].every(Number.isFinite);
  if (!fluctuationDerivedFinite)
    addIssue(
      issues,
      "numeric_replay_nonfinite",
      "blocked",
      "Fluctuation recomputation produced a nonfinite derived value.",
    );
  else if (
    fluctuationToMeanRatioUpper95 > TOLERANCES.fluctuationToMeanRatioUpper95
  )
    addIssue(
      issues,
      "fluctuation_ratio_exceeds_tolerance",
      "fail",
      "The independently recomputed fluctuation ratio exceeds its frozen tolerance.",
    );

  if (target == null)
    addIssue(
      issues,
      inspectedTarget != null
        ? "server_recomputed_classical_target_capability_invalid"
        : targetCapability == null
          ? "server_recomputed_classical_target_capability_missing"
          : "server_recomputed_classical_target_capability_unauthenticated",
      "blocked",
      inspectedTarget != null
        ? "The private target capability lacks the exact candidate/schema provenance, nine independently allocated finite targets, or alias exclusion required for bracket authority."
        : "No genuine server-recomputed classical-target capability is available; submitted target files remain non-authoritative echoes.",
    );

  const residualMetrics: ResidualMetrics[] = [];
  const regulatorMetrics: RegulatorMetrics[] = [];
  const residualArrays = new Map<string, Float64Array>();
  const uncertaintyArrays = new Map<string, Float64Array>();
  // Preserve the frozen global constraint order: finish every level of each
  // bracket family before antisymmetry, then Jacobi, and only then regulate.
  for (const familyId of FAMILY_ORDER) {
    for (const level of LEVEL_ORDER) {
      const submittedResidual =
        arrays[
          constraintDescriptor(level.levelId, familyId, "residual").fileOrdinal
        ];
      const uncertainty =
        arrays[
          constraintDescriptor(
            level.levelId,
            familyId,
            "absolute_uncertainty95",
          ).fileOrdinal
        ];
      let residual: Float64Array | null = null;
      let targetAuthenticated = false;
      let targetEchoMismatch: number | null = null;
      if (familyId === "H_H" || familyId === "H_Hi" || familyId === "Hi_Hj") {
        const computed =
          arrays[
            constraintDescriptor(level.levelId, familyId, "computed")
              .fileOrdinal
          ];
        const submittedTarget =
          arrays[
            constraintDescriptor(level.levelId, familyId, "target").fileOrdinal
          ];
        const authenticatedTarget = target?.targets.get(
          `${level.levelId}.${familyId}`,
        );
        if (authenticatedTarget != null) {
          targetAuthenticated = true;
          const recomputedTargetEchoMismatch = maximumAbsoluteDifference(
            submittedTarget,
            authenticatedTarget,
          );
          if (recomputedTargetEchoMismatch == null)
            addIssue(
              issues,
              "constraint_residual_recompute_nonfinite",
              "blocked",
              "A submitted-target echo comparison overflowed despite finite admitted operands.",
            );
          else {
            targetEchoMismatch = recomputedTargetEchoMismatch;
            if (targetEchoMismatch > TOLERANCES.float64RecomputeAbsolute)
              addIssue(
                issues,
                "submitted_target_echo_mismatch",
                "fail",
                "A submitted target echo differs from an authenticated server target beyond the frozen float64 tolerance.",
              );
          }
          const negativeTarget = Float64Array.from(
            authenticatedTarget,
            (value) => -value,
          );
          residual = sumResidual([computed, negativeTarget]);
        }
      } else if (familyId === "antisymmetry") {
        residual = sumResidual([
          arrays[
            constraintDescriptor(level.levelId, familyId, "forward").fileOrdinal
          ],
          arrays[
            constraintDescriptor(level.levelId, familyId, "reverse").fileOrdinal
          ],
        ]);
      } else {
        residual = sumResidual([
          arrays[
            constraintDescriptor(level.levelId, familyId, "term_1").fileOrdinal
          ],
          arrays[
            constraintDescriptor(level.levelId, familyId, "term_2").fileOrdinal
          ],
          arrays[
            constraintDescriptor(level.levelId, familyId, "term_3").fileOrdinal
          ],
        ]);
      }
      if (residual == null) {
        if (
          targetAuthenticated ||
          familyId === "antisymmetry" ||
          familyId === "jacobi"
        )
          addIssue(
            issues,
            "constraint_residual_recompute_nonfinite",
            "blocked",
            `The ${level.levelId}.${familyId} residual recomputation overflowed or produced a nonfinite value.`,
          );
        continue;
      }
      const metrics = computeResidualMetrics(
        familyId,
        level.levelId,
        residual,
        submittedResidual,
        uncertainty,
        targetAuthenticated,
        targetEchoMismatch,
      );
      if (metrics == null) {
        addIssue(
          issues,
          "constraint_residual_recompute_nonfinite",
          "blocked",
          "A residual recomputation produced a nonfinite derived value.",
        );
        continue;
      }
      residualMetrics.push(metrics);
      residualArrays.set(`${level.levelId}.${familyId}`, residual);
      uncertaintyArrays.set(`${level.levelId}.${familyId}`, uncertainty);
      if (
        metrics.submittedResidualMismatchLInf >
        TOLERANCES.float64RecomputeAbsolute
      )
        addIssue(
          issues,
          "submitted_residual_echo_mismatch",
          "fail",
          "A submitted residual echo differs from the independent recomputation beyond the frozen float64 tolerance.",
        );
      if (metrics.residualUpper95 > metrics.frozenTolerance)
        addIssue(
          issues,
          "residual_upper95_exceeds_frozen_tolerance",
          "fail",
          "A recomputed residual upper-95 envelope exceeds its frozen family tolerance.",
        );
    }
  }

  for (const familyId of FAMILY_ORDER) {
    const familyResiduals = LEVEL_ORDER.map((level) =>
      residualArrays.get(`${level.levelId}.${familyId}`),
    );
    const familyUncertainties = LEVEL_ORDER.map((level) =>
      uncertaintyArrays.get(`${level.levelId}.${familyId}`),
    );
    if (
      familyResiduals.some((entry) => entry == null) ||
      familyUncertainties.some((entry) => entry == null)
    )
      continue;
    const metrics = computeRegulator(
      familyId,
      familyResiduals as [Float64Array, Float64Array, Float64Array],
      familyUncertainties as [Float64Array, Float64Array, Float64Array],
    );
    if (metrics == null) {
      addIssue(
        issues,
        "regulator_nonfinite",
        "blocked",
        "The conservative candidate regulator produced a nonfinite derived role.",
      );
      continue;
    }
    regulatorMetrics.push(metrics);
    if (metrics.pLower == null)
      addIssue(
        issues,
        "regulator_exact_zero_order_blocked",
        "blocked",
        "The frozen exact-zero regulator disposition blocks order inference without a synthetic floor.",
      );
    else if (metrics.pLower < REGULATOR.minimumObservedOrder)
      addIssue(
        issues,
        "regulator_order_below_minimum",
        "fail",
        "The conservative lower convergence order is below the frozen minimum.",
      );
    if (!metrics.monotone)
      addIssue(
        issues,
        "regulator_not_monotone",
        "fail",
        "The conservative interlevel bounds fail frozen monotonicity.",
      );
    if (
      metrics.centralResidualUpper95 > REGULATOR.finalResidualUpper95Tolerance
    )
      addIssue(
        issues,
        "regulator_final_residual_exceeds_tolerance",
        "fail",
        "The central residual upper-95 envelope exceeds its frozen regulator tolerance.",
      );
    if (metrics.qByLevel[2] > REGULATOR.finalRegulatorErrorUpper95Tolerance)
      addIssue(
        issues,
        "regulator_final_error_exceeds_tolerance",
        "fail",
        "The conservative central regulator-error envelope exceeds its frozen tolerance.",
      );
  }

  addIssue(
    issues,
    "si_normalization_content_binding_missing",
    "blocked",
    "The candidate schema has no authenticated natural-units-to-SI constants and uncertainty graph binding.",
  );
  addIssue(
    issues,
    "execution_provenance_and_preseal_unverified",
    "blocked",
    "Current filesystem bytes do not prove a scientific preseal, run chronology, freshness, or execution provenance.",
  );
  addIssue(
    issues,
    "independent_implementation_agreement_missing",
    "blocked",
    "No independently authored replay receipt and hash-bound pair agreement are present.",
  );

  return makeReceipt({
    issues,
    observation: state.observation,
    targetAccepted: target != null,
    targetBinding: target?.binding ?? null,
    metrics: {
      input: {
        fileCount: 68,
        float64ValueCount: arrays.reduce((sum, entry) => sum + entry.length, 0),
        allValuesFinite: true,
        allNegativeZeroExcluded: true,
        allRoleSensitiveValuesNonnegative: true,
      },
      noise: noiseDerivedFinite
        ? {
            exchangeResidualUpper95SI,
            exchangeToleranceSI: TOLERANCES.exchangeSymmetryUpper95SI,
            psdDisposition: psd.disposition,
            psdMethod:
              "gershgorin_lower_bound_then_diagonal_and_two_coordinate_rayleigh_witness_then_shifted_cholesky_with_residual_bound",
            psdToleranceSI: TOLERANCES.psdNegativeEigenvalueSI,
            minimumGershgorinLowerSI,
            minimumRayleighWitnessUpperSI: psd.minimumRayleighWitnessUpperSI,
            maximumEigenvalueUpper95SI: Math.max(0, maximumEigenvalueUpper95SI),
          }
        : null,
      fluctuation: fluctuationDerivedFinite
        ? {
            smearingWeightSum: weightSum,
            symmetricTensorFrobeniusSI,
            fluctuationAmplitudeUpper95SI,
            fluctuationToMeanRatioUpper95,
            frozenTolerance: TOLERANCES.fluctuationToMeanRatioUpper95,
          }
        : null,
      residuals: residualMetrics,
      regulator: regulatorMetrics,
    },
    trace: {
      genuineObserverInvokedInternally: true,
      exact68DescriptorInventoryRebound: true,
      allSizesPreflightedBeforeReplayAllocation: true,
      everyFileSecurelyReopenedAndHashMatchedObserver: true,
      everyFileFinalSweepIdentityAndHashMatchedObserver: true,
      finalExactDirectoryInventoryReenumerated: true,
      privateOneShotFilesystemCapabilityMintedAndConsumed: true,
      finitenessRecomputed: true,
      smearingWeightFreezeRecomputed: true,
      smearingNormalizationRecomputed: true,
      exchangeSymmetryRecomputed: true,
      psdRecomputed: true,
      fluctuationRecomputed: true,
      antisymmetryRecomputedAtAllThreeLevels:
        residualMetrics.filter((entry) => entry.familyId === "antisymmetry")
          .length === 3,
      jacobiRecomputedAtAllThreeLevels:
        residualMetrics.filter((entry) => entry.familyId === "jacobi")
          .length === 3,
      candidateSpecificConservativeRegulatorRecomputedForAvailableNonTargetFamilies:
        regulatorMetrics.some((entry) => entry.familyId === "antisymmetry") &&
        regulatorMetrics.some((entry) => entry.familyId === "jacobi"),
      allFiveFamilyRegulatorsRecomputed: false,
    },
  });
};

const rawObserverFailureIssue = (
  error: unknown,
): Nhm2SphericalBosonStarV2PrimaryScienceReplayIssue => {
  if (
    error instanceof Nhm2SphericalBosonStarV2RawFilesystemObserverError &&
    error.code === "filesystem_internal_admission_failed"
  ) {
    for (const code of [
      "decoded_nonfinite",
      "decoded_negative_zero",
      "decoded_role_sensitive_negative",
    ] as const) {
      if (error.message.endsWith(`(${code}).`))
        return issue(
          code,
          "fail",
          `${error.message} The frozen candidate fails without retuning.`,
        );
    }
    if (error.message.endsWith("(candidate_frozen_content_sha256_mismatch)."))
      return issue(
        "smearing_weights_not_frozen_exact",
        "fail",
        `${error.message} The frozen candidate fails without retuning before float64 decode.`,
      );
  }
  return issue(
    "filesystem_observation_failed",
    "blocked",
    `The authenticated 68-file observer failed (${(error as { code?: string }).code ?? "unknown"}).`,
  );
};

/**
 * Candidate-specific primary science replay from a server filesystem root.
 * The API accepts no raw arrays or manifest projections. The optional opaque
 * target value is checked only by WeakMap identity and is never traversed.
 * This adapter currently has no target issuer, so bracket authority remains
 * blocked until a separate server target recomputer is honestly integrated.
 */
export async function replayNhm2SphericalBosonStarV2PrimaryScienceFromFilesystem(
  rootDirectory: string,
  serverRecomputedTargetCapability: unknown = null,
): Promise<Nhm2SphericalBosonStarV2PrimaryScienceReplayReceiptV1> {
  if (typeof rootDirectory !== "string")
    return makeReceipt({
      issues: [
        issue(
          "filesystem_ingress_invalid",
          "blocked",
          "The server filesystem root must be one primitive string; caller arrays are inadmissible.",
        ),
      ],
      observation: null,
      targetAccepted: false,
      targetBinding: null,
    });
  if (process.platform !== "linux")
    return makeReceipt({
      issues: [
        issue(
          "filesystem_platform_inadmissible",
          "blocked",
          "The primary filesystem replay fails closed off the sealed Linux policy before filesystem traversal.",
        ),
      ],
      observation: null,
      targetAccepted: false,
      targetBinding: null,
    });

  let observation: Nhm2SphericalBosonStarV2RawFilesystemObservationReceiptV1;
  try {
    observation =
      await observeNhm2SphericalBosonStarV2RawInventoryFromFilesystem(
        rootDirectory,
      );
  } catch (error) {
    return makeReceipt({
      issues: [rawObserverFailureIssue(error)],
      observation: null,
      targetAccepted: false,
      targetBinding: null,
      trace: { genuineObserverInvokedInternally: true },
    });
  }

  try {
    const capability = await mintRawFilesystemCapability(observation);
    return replayCapability(capability, serverRecomputedTargetCapability);
  } catch (error) {
    const replayError =
      error instanceof ReplayFilesystemError
        ? error
        : new ReplayFilesystemError(
            "filesystem_secure_reread_failed",
            "The private filesystem admission failed closed.",
          );
    return makeReceipt({
      issues: [
        issue(
          replayError.code,
          replayError.code === "smearing_weights_not_frozen_exact"
            ? "fail"
            : "blocked",
          replayError.message,
        ),
      ],
      observation,
      targetAccepted: false,
      targetBinding: null,
      trace: { genuineObserverInvokedInternally: true },
    });
  }
}
