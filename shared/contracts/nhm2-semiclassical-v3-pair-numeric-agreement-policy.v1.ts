import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ARTIFACT_ID =
  "nhm2.semiclassical_v3_pair_numeric_agreement_policy" as const;
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_pair_numeric_agreement_policy/v1" as const;
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ID =
  "nhm2.server_owned.semiclassical_v3.independent_numeric_agreement/v1" as const;
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-pair-numeric-agreement-policy/v1\n" as const;

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS =
  Object.freeze({
    inputRoleOrderSha256:
      "a2d6c6c256b7dbfcbb87873a9cd5659d471a8a92b38e9720192aa83d6023994b",
    scientificInputRoleOrderSha256:
      "fbefe8a647f1a11c81148a931258a850b6b41041927552bb76429197f12e238b",
    implementationInputRoleOrderSha256:
      "4977f5339269383309287bf5f3e81a33c108e8e212eebc281591cbee020b9406",
    outputRoleOrderSha256:
      "95ce1862e00c151f7bb36e483e7fffbe7c08b23791f8682dff4a0268b688f227",
    derivationSidecarRoleOrderSha256:
      "9ec55cfe0f5b109166abc72e35b08a5e2dbc0dfbf2ec1c43341cda01a40a917b",
    replayEpochPolicySha256:
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    constraintArithmeticPolicySha256:
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
  } as const);

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_IDS =
  Object.freeze([
    "noise_kernel",
    "noise_kernel_absolute_uncertainty95",
    "mean_rset",
    "mean_rset_absolute_uncertainty95",
    "smearing_weights",
    "normalized_constraint_operand",
    "normalized_constraint_absolute_uncertainty95",
  ] as const);

export type Nhm2SemiclassicalV3PairNumericAgreementGroupId =
  (typeof NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_IDS)[number];

export type Nhm2SemiclassicalV3PairNumericAgreementUnit =
  "(J/m^3)^2" | "J/m^3" | "dimensionless";

export type Nhm2SemiclassicalV3PairNumericAgreementGroupPolicyV1 = Readonly<{
  groupId: Nhm2SemiclassicalV3PairNumericAgreementGroupId;
  unit: Nhm2SemiclassicalV3PairNumericAgreementUnit;
  absoluteTolerance: number;
  relativeTolerance: number;
  comparisonKind:
    | "scientific_value_with_uncertainty_envelope"
    | "scientific_value_without_uncertainty_envelope"
    | "uncertainty_estimator_factor_four";
}>;

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES =
  Object.freeze({
    noise_kernel: Object.freeze({
      groupId: "noise_kernel",
      unit: "(J/m^3)^2",
      absoluteTolerance: 1e-12,
      relativeTolerance: 1e-5,
      comparisonKind: "scientific_value_with_uncertainty_envelope",
    }),
    noise_kernel_absolute_uncertainty95: Object.freeze({
      groupId: "noise_kernel_absolute_uncertainty95",
      unit: "(J/m^3)^2",
      absoluteTolerance: 1e-12,
      relativeTolerance: 0.75,
      comparisonKind: "uncertainty_estimator_factor_four",
    }),
    mean_rset: Object.freeze({
      groupId: "mean_rset",
      unit: "J/m^3",
      absoluteTolerance: 1e-12,
      relativeTolerance: 1e-6,
      comparisonKind: "scientific_value_with_uncertainty_envelope",
    }),
    mean_rset_absolute_uncertainty95: Object.freeze({
      groupId: "mean_rset_absolute_uncertainty95",
      unit: "J/m^3",
      absoluteTolerance: 1e-12,
      relativeTolerance: 0.75,
      comparisonKind: "uncertainty_estimator_factor_four",
    }),
    smearing_weights: Object.freeze({
      groupId: "smearing_weights",
      unit: "dimensionless",
      absoluteTolerance: 1e-12,
      relativeTolerance: 1e-10,
      comparisonKind: "scientific_value_without_uncertainty_envelope",
    }),
    normalized_constraint_operand: Object.freeze({
      groupId: "normalized_constraint_operand",
      unit: "dimensionless",
      absoluteTolerance: 1e-12,
      relativeTolerance: 1e-6,
      comparisonKind: "scientific_value_with_uncertainty_envelope",
    }),
    normalized_constraint_absolute_uncertainty95: Object.freeze({
      groupId: "normalized_constraint_absolute_uncertainty95",
      unit: "dimensionless",
      absoluteTolerance: 1e-12,
      relativeTolerance: 0.75,
      comparisonKind: "uncertainty_estimator_factor_four",
    }),
  } satisfies Record<
    Nhm2SemiclassicalV3PairNumericAgreementGroupId,
    Nhm2SemiclassicalV3PairNumericAgreementGroupPolicyV1
  >);

export type Nhm2SemiclassicalV3PairNumericAgreementRolePolicyV1 = Readonly<{
  role: string;
  groupId: Nhm2SemiclassicalV3PairNumericAgreementGroupId;
  unit: Nhm2SemiclassicalV3PairNumericAgreementUnit;
  absoluteTolerance: number;
  relativeTolerance: number;
  comparisonKind:
    | "scientific_value_with_uncertainty_envelope"
    | "scientific_value_without_uncertainty_envelope"
    | "uncertainty_estimator_factor_four";
  uncertaintyRole: string | null;
}>;

const constraintRolePattern =
  /^constraint_operand\.(level_[012])\.(H_H|H_Hi|Hi_Hj|antisymmetry|jacobi)\.([a-z0-9_]+)$/;

const roleGroupAndUncertainty = (
  role: string,
): Readonly<{
  groupId: Nhm2SemiclassicalV3PairNumericAgreementGroupId;
  uncertaintyRole: string | null;
}> => {
  if (role === "noise_kernel") {
    return Object.freeze({
      groupId: "noise_kernel",
      uncertaintyRole: "noise_kernel_absolute_uncertainty95",
    });
  }
  if (role === "noise_kernel_absolute_uncertainty95") {
    return Object.freeze({
      groupId: "noise_kernel_absolute_uncertainty95",
      uncertaintyRole: null,
    });
  }
  if (role === "mean_rset") {
    return Object.freeze({
      groupId: "mean_rset",
      uncertaintyRole: "mean_rset_absolute_uncertainty95",
    });
  }
  if (role === "mean_rset_absolute_uncertainty95") {
    return Object.freeze({
      groupId: "mean_rset_absolute_uncertainty95",
      uncertaintyRole: null,
    });
  }
  if (role === "smearing_weights") {
    return Object.freeze({
      groupId: "smearing_weights",
      uncertaintyRole: null,
    });
  }

  const match = constraintRolePattern.exec(role);
  if (match == null) throw new Error(`unmapped_v3_scientific_role:${role}`);
  if (match[3] === "absolute_uncertainty95") {
    return Object.freeze({
      groupId: "normalized_constraint_absolute_uncertainty95",
      uncertaintyRole: null,
    });
  }
  return Object.freeze({
    groupId: "normalized_constraint_operand",
    uncertaintyRole: `constraint_operand.${match[1]}.${match[2]}.absolute_uncertainty95`,
  });
};

const rolePolicies =
  (): Nhm2SemiclassicalV3PairNumericAgreementRolePolicyV1[] =>
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.map((role) => {
      const mapping = roleGroupAndUncertainty(role);
      const group =
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES[
          mapping.groupId
        ];
      return Object.freeze({
        role,
        groupId: mapping.groupId,
        unit: group.unit,
        absoluteTolerance: group.absoluteTolerance,
        relativeTolerance: group.relativeTolerance,
        comparisonKind: group.comparisonKind,
        uncertaintyRole: mapping.uncertaintyRole,
      });
    });

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES =
  Object.freeze(rolePolicies());

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE =
  Object.freeze(
    Object.fromEntries(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.map(
        (entry) => [entry.role, entry.uncertaintyRole],
      ),
    ) as Readonly<Record<string, string | null>>,
  );

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES =
  Object.freeze(
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.filter(
      (entry) =>
        entry.comparisonKind === "scientific_value_with_uncertainty_envelope",
    ).map((entry) => entry.role),
  );
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-pair-numeric-agreement-coverage-role-order/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      JSON.stringify(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
      ),
      "utf8",
    )
    .digest("hex");

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

const POLICY = {
  artifactId: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CONTRACT_VERSION,
  policyId: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ID,
  maturity:
    "preregistered_numeric_comparison_policy_only_no_pair_authority" as const,
  epochBindings: Object.freeze({
    inputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
    scientificInputRoleOrderSha256:
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
    implementationInputRoleOrderSha256:
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
    outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
    derivationSidecarRoleOrderSha256:
      NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
    replayEpochPolicySha256:
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256,
    constraintArithmeticPolicySha256:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256,
    replayEpochPolicyBinding: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
    constraintArithmeticPolicyBinding:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    outputRoleCount: 68 as const,
    inputRoleCount: 28 as const,
    scientificInputRoleCount: 25 as const,
    implementationInputRoleCount: 3 as const,
    derivationSidecarRoleCount:
      NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES.length,
  }),
  scalarComparison: Object.freeze({
    formula:
      "d=abs(x_primary-x_independent);scale=max(abs(x_primary),abs(x_independent));budget=A_group+R_group*scale+u_primary+u_independent;pass_iff_d<=budget" as const,
    componentwiseEveryScalarMustPass: true as const,
    normOrMeanAggregationAllowed: false as const,
    uncertaintyEnvelopeCoefficientPerImplementation: 1 as const,
    comparisonSymmetricUnderPairSwap: true as const,
    everyDerivedArithmeticScalarMustBeFinite: true as const,
    derivedOverflowOrNonfiniteDisposition: "blocked" as const,
  }),
  uncertaintyComparison: Object.freeze({
    formula:
      "d_u=abs(u_primary-u_independent);scale_u=max(u_primary,u_independent);budget_u=A_U+0.75*scale_u;pass_iff_d_u<=budget_u" as const,
    relativeTolerance: 0.75 as const,
    factorLimitAboveAbsoluteFloor: 4 as const,
    nonnegativeRequired: true as const,
    independentlyServerReplayedRequired: true as const,
    uncertaintyComparisonCannotValidateCoverageByItself: true as const,
  }),
  coverage: Object.freeze({
    perRunMinimumJointSimultaneousCoverage: 0.975 as const,
    pairMinimumJointSimultaneousCoverage: 0.95 as const,
    coverageRoleCount: 50 as const,
    coverageRoleOrderSha256:
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
    perRunScope:
      "all_50_uncertainty_enveloped_scientific_roles_all_levels_families_samples_channels_jointly_or_stronger_deterministic_enclosure" as const,
    uncertaintyEstimatorAgreementHandledBySeparateUComparison: true as const,
    smearingWeightsHaveNoStatisticalCoverageEnvelope: true as const,
    deterministicEnclosureAllowed: true as const,
    bonferroniPairLowerBoundFormula:
      "pair_coverage_lower=max(0,primary_joint_coverage+independent_joint_coverage-1)" as const,
    implementationIndependenceAssumedForCoverage: false as const,
    marginalOrPointwise95CoverageSufficient: false as const,
    serverReplayOfCoverageDerivationRequired: true as const,
  }),
  constraintUncertaintyScope: Object.freeze({
    oneArrayPerLevelAndFamily: true as const,
    everyPrimitiveOperandErrorBounded: true as const,
    linearResidualErrorBounded: true as const,
    requiredEnvelope:
      "U_family_level[i]>=max(max_over_primitive_roles(e_role[i]),sum_over_residual_terms(abs(c_role)*e_role[i]))" as const,
    bracketResidualCoefficients: Object.freeze([1, -1] as const),
    antisymmetryResidualCoefficients: Object.freeze([1, 1] as const),
    jacobiResidualCoefficients: Object.freeze([1, 1, 1] as const),
    residualOnlyUncertaintyMayEnvelopePrimitiveOperands: false as const,
  }),
  groupPolicies: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
  rolePolicies: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
  roleToUncertaintyRole:
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
  runDecision: Object.freeze({
    bothRunsMustIndependentlyPassBeforePairPass: true as const,
    pairPassCanRescueFailedRun: false as const,
    failedRunDisposition: "fail" as const,
    blockedRunDisposition: "blocked" as const,
    numericDisagreementDisposition: "fail" as const,
    missingInvalidOrNonfiniteEvidenceDisposition: "blocked" as const,
    negativeUncertaintyDisposition: "blocked" as const,
    producerAgreementSummaryAuthoritative: false as const,
  }),
  byteAndSemanticComparison: Object.freeze({
    frozenScientificInputBytesMustMatch: true as const,
    frozenScientificInputDescriptorBytesMustMatch: true as const,
    independentImplementationInputBytesMustMatch: false as const,
    independentImplementationInputBytesMustBeDistinct: true as const,
    independentImplementationDescriptorBytesMustMatch: false as const,
    independentImplementationDescriptorBytesMustBeDistinct: true as const,
    independentScientificOutputBytesMustMatch: false as const,
    independentDerivationSidecarBytesMustMatch: false as const,
    sidecarSchemaHashAndRunCrossBindingRequired: true as const,
    sidecarSemanticEvidenceAgreementRequired: true as const,
    exactSidecarCrossBindingFields: Object.freeze([
      "candidate_id",
      "run_id",
      "implementation_id",
      "scientific_preseal_sha256",
      "numeric_policy_sha256",
      "input_role_order_sha256",
      "scientific_input_role_order_sha256",
      "implementation_input_role_order_sha256",
      "output_role_order_sha256",
      "derivation_sidecar_role_order_sha256",
      "replay_epoch_policy_sha256",
      "constraint_operand_policy_sha256",
    ] as const),
    exactSidecarDynamicBindingSources: Object.freeze({
      candidate_id: "presealed_candidate_id",
      run_id: "lane_run_id",
      implementation_id: "lane_implementation_id",
      scientific_preseal_sha256: "presealed_scientific_preseal_sha256",
      numeric_policy_sha256:
        "mandatory_pair_input.presealed_numeric_policy_binding.sha256",
    } as const),
    exactSidecarFrozenSha256Values: Object.freeze({
      input_role_order_sha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      scientific_input_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      implementation_input_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      output_role_order_sha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
      derivation_sidecar_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
      replay_epoch_policy_sha256:
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256,
      constraint_operand_policy_sha256:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256,
    }),
  }),
  serverDecodedSnapshotBoundary: Object.freeze({
    serverFilesystemReadRequired: true as const,
    serverDecodesFloat64ArraysBeforeComparison: true as const,
    exactlyOneDetachedImmutableSnapshotPerLane: true as const,
    snapshotCompletedBeforeValidationOrArithmetic: true as const,
    comparisonReadsOnlyDetachedSnapshot: true as const,
    producerSuppliedObjectGraphAccepted: false as const,
    proxyAccessorOrMutableAliasDisposition: "blocked" as const,
  }),
  lineageAndCopyControls: Object.freeze({
    distinctImplementationIdRequired: true as const,
    distinctSourceSha256Required: true as const,
    distinctDependencyLockSha256Required: true as const,
    distinctExecutableSha256Required: true as const,
    distinctRunIdRequired: true as const,
    disjointOutputRootsRequired: true as const,
    crossRunScientificOutputReadForbidden: true as const,
    wholeNonstructuralArrayByteIdentityDisposition:
      "blocked_pending_independence_provenance_review" as const,
    wholeDerivationSidecarByteIdentityDisposition:
      "blocked_pending_independence_provenance_review" as const,
    structuralZeroByteIdentityAllowedAfterServerDerivation: true as const,
    exactScientificByteIdentityGrantsAgreement: false as const,
  }),
  preregistrationAndVersioning: Object.freeze({
    policyMustBeHashSealedBeforeEitherRun: true as const,
    toleranceValuesMustBePresealedBeforeEitherRun: true as const,
    postObservationToleranceRetuningAllowed: false as const,
    producerSelectedToleranceAllowed: false as const,
    changeRequiresNewPolicyContractVersion: true as const,
    changeRequiresNewCandidateId: true as const,
    automaticLegacyUpgradeAllowed: false as const,
  }),
  futurePairInputBinding: Object.freeze({
    presealedNumericPolicyBindingIsMandatoryPairInput: true as const,
    primaryLaneNumericPolicySha256Required: true as const,
    independentLaneNumericPolicySha256Required: true as const,
    bothLaneValuesMustEqualPresealedPairPolicyBindingSha256: true as const,
    pairPresealReceiptMustPredateBothRuns: true as const,
    moduleComputedHashWithoutPairPresealReceiptSufficient: false as const,
    missingOrMismatchedBindingDisposition: "blocked" as const,
  }),
  worstCaseDiagnostics: Object.freeze({
    requiredFields: Object.freeze([
      "role",
      "flat_index",
      "delta",
      "budget",
      "normalized_margin",
    ] as const),
    normalizedMarginFormula: "normalized_margin=delta/budget" as const,
    selectMaximumMarginAcrossEveryScalar: true as const,
    producerWorstMarginAuthoritative: false as const,
  }),
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  authorityBoundary: Object.freeze({
    comparatorIntegrated: false as const,
    pairAgreementAuthority: false as const,
    independentAgreementEstablished: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
  }),
};

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY =
  deepFreeze(POLICY);

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

export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON =
  JSON.stringify(
    canonicalizeJson(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
  );
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING =
  Object.freeze({
    artifactId: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_ID,
    sha256: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256,
    sizeBytes: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const assertPolicyInvariants = (): void => {
  const rolePolicies =
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES;
  const outputRoleSet = new Set(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES);
  const uncertaintyRoles = rolePolicies.filter(
    (entry) => entry.comparisonKind === "uncertainty_estimator_factor_four",
  );
  const scientificRolesWithUncertainty = rolePolicies.filter(
    (entry) =>
      entry.comparisonKind === "scientific_value_with_uncertainty_envelope",
  );
  const everyClaimLockFalse = Object.values(
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  ).every((value) => value === false);
  const epochBindingsMatchPinnedVersion =
    NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.inputRoleOrderSha256 &&
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.scientificInputRoleOrderSha256 &&
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.implementationInputRoleOrderSha256 &&
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.outputRoleOrderSha256 &&
    NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.derivationSidecarRoleOrderSha256 &&
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.replayEpochPolicySha256 &&
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256 ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS.constraintArithmeticPolicySha256;
  if (
    rolePolicies.length !== 68 ||
    new Set(rolePolicies.map((entry) => entry.role)).size !== 68 ||
    rolePolicies.some(
      (entry, index) =>
        entry.role !== NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES[index],
    ) ||
    Object.keys(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
    ).length !== 68 ||
    scientificRolesWithUncertainty.length !== 50 ||
    uncertaintyRoles.length !== 17 ||
    rolePolicies.filter(
      (entry) =>
        entry.comparisonKind ===
        "scientific_value_without_uncertainty_envelope",
    ).length !== 1 ||
    scientificRolesWithUncertainty.some(
      (entry) =>
        entry.uncertaintyRole == null ||
        !outputRoleSet.has(entry.uncertaintyRole) ||
        (entry.role.startsWith("constraint_operand.") &&
          entry.uncertaintyRole !==
            `${entry.role.slice(0, entry.role.lastIndexOf("."))}.absolute_uncertainty95`),
    ) ||
    uncertaintyRoles.some((entry) => entry.uncertaintyRole !== null) ||
    !epochBindingsMatchPinnedVersion ||
    !everyClaimLockFalse ||
    2 *
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.coverage
        .perRunMinimumJointSimultaneousCoverage -
      1 !==
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.coverage
        .pairMinimumJointSimultaneousCoverage
  ) {
    throw new Error(
      "nhm2_semiclassical_v3_pair_numeric_agreement_policy_invariant_violation",
    );
  }
};

assertPolicyInvariants();

export type Nhm2SemiclassicalV3PairNumericScalarComparisonInputV1 = Readonly<{
  role: string;
  primaryValue: number;
  independentValue: number;
  primaryUncertainty?: number;
  independentUncertainty?: number;
}>;

export type Nhm2SemiclassicalV3PairNumericScalarComparisonV1 = Readonly<{
  status: "pass" | "fail" | "blocked";
  reason:
    | "within_presealed_numeric_envelope"
    | "numeric_disagreement"
    | "unknown_role"
    | "comparison_input_invalid"
    | "nonfinite_value"
    | "missing_uncertainty"
    | "nonfinite_uncertainty"
    | "negative_uncertainty"
    | "derived_numeric_overflow";
  role: string;
  groupId: Nhm2SemiclassicalV3PairNumericAgreementGroupId | null;
  delta: number | null;
  budget: number | null;
  normalizedMargin: number | null;
}>;

const blockedComparison = (
  role: string,
  reason: Extract<
    Nhm2SemiclassicalV3PairNumericScalarComparisonV1["reason"],
    | "unknown_role"
    | "comparison_input_invalid"
    | "nonfinite_value"
    | "missing_uncertainty"
    | "nonfinite_uncertainty"
    | "negative_uncertainty"
    | "derived_numeric_overflow"
  >,
  groupId: Nhm2SemiclassicalV3PairNumericAgreementGroupId | null = null,
): Nhm2SemiclassicalV3PairNumericScalarComparisonV1 =>
  Object.freeze({
    status: "blocked",
    reason,
    role,
    groupId,
    delta: null,
    budget: null,
    normalizedMargin: null,
  });

export const compareNhm2SemiclassicalV3PairNumericScalar = (
  input: Nhm2SemiclassicalV3PairNumericScalarComparisonInputV1,
): Nhm2SemiclassicalV3PairNumericScalarComparisonV1 => {
  let snapshot: unknown;
  try {
    snapshot = detachedPlainDataSnapshot(input);
  } catch {
    return blockedComparison("<invalid>", "comparison_input_invalid");
  }
  if (
    snapshot == null ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot)
  ) {
    return blockedComparison("<invalid>", "comparison_input_invalid");
  }
  const scalarInput = snapshot as Record<string, unknown>;
  const scalarInputKeys = Object.keys(scalarInput);
  const allowedInputKeys = new Set([
    "role",
    "primaryValue",
    "independentValue",
    "primaryUncertainty",
    "independentUncertainty",
  ]);
  if (
    typeof scalarInput.role !== "string" ||
    typeof scalarInput.primaryValue !== "number" ||
    typeof scalarInput.independentValue !== "number" ||
    !scalarInputKeys.includes("role") ||
    !scalarInputKeys.includes("primaryValue") ||
    !scalarInputKeys.includes("independentValue") ||
    scalarInputKeys.some((key) => !allowedInputKeys.has(key)) ||
    (scalarInputKeys.includes("primaryUncertainty") &&
      typeof scalarInput.primaryUncertainty !== "number") ||
    (scalarInputKeys.includes("independentUncertainty") &&
      typeof scalarInput.independentUncertainty !== "number")
  ) {
    return blockedComparison("<invalid>", "comparison_input_invalid");
  }
  const role = scalarInput.role;
  const primaryValue = scalarInput.primaryValue;
  const independentValue = scalarInput.independentValue;
  const submittedPrimaryUncertainty = scalarInput.primaryUncertainty as
    number | undefined;
  const submittedIndependentUncertainty = scalarInput.independentUncertainty as
    number | undefined;
  const rolePolicy =
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.find(
      (entry) => entry.role === role,
    );
  if (rolePolicy == null) return blockedComparison(role, "unknown_role");
  if (!Number.isFinite(primaryValue) || !Number.isFinite(independentValue)) {
    return blockedComparison(role, "nonfinite_value", rolePolicy.groupId);
  }
  if (
    rolePolicy.comparisonKind === "uncertainty_estimator_factor_four" &&
    (primaryValue < 0 || independentValue < 0)
  ) {
    return blockedComparison(role, "negative_uncertainty", rolePolicy.groupId);
  }

  let primaryUncertainty = 0;
  let independentUncertainty = 0;
  if (
    rolePolicy.comparisonKind === "scientific_value_with_uncertainty_envelope"
  ) {
    if (
      submittedPrimaryUncertainty == null ||
      submittedIndependentUncertainty == null
    ) {
      return blockedComparison(role, "missing_uncertainty", rolePolicy.groupId);
    }
    if (
      !Number.isFinite(submittedPrimaryUncertainty) ||
      !Number.isFinite(submittedIndependentUncertainty)
    ) {
      return blockedComparison(
        role,
        "nonfinite_uncertainty",
        rolePolicy.groupId,
      );
    }
    if (
      submittedPrimaryUncertainty < 0 ||
      submittedIndependentUncertainty < 0
    ) {
      return blockedComparison(
        role,
        "negative_uncertainty",
        rolePolicy.groupId,
      );
    }
    primaryUncertainty = submittedPrimaryUncertainty;
    independentUncertainty = submittedIndependentUncertainty;
  }

  const delta = Math.abs(primaryValue - independentValue);
  const scale = Math.max(Math.abs(primaryValue), Math.abs(independentValue));
  const budget =
    rolePolicy.absoluteTolerance +
    rolePolicy.relativeTolerance * scale +
    primaryUncertainty +
    independentUncertainty;
  const normalizedMargin = delta / budget;
  if (
    !Number.isFinite(delta) ||
    !Number.isFinite(budget) ||
    !Number.isFinite(normalizedMargin)
  ) {
    return blockedComparison(
      role,
      "derived_numeric_overflow",
      rolePolicy.groupId,
    );
  }
  const pass = delta <= budget;
  return Object.freeze({
    status: pass ? "pass" : "fail",
    reason: pass ? "within_presealed_numeric_envelope" : "numeric_disagreement",
    role,
    groupId: rolePolicy.groupId,
    delta,
    budget,
    normalizedMargin,
  });
};

const assertPlainJsonGraph = (value: unknown, visited: Set<object>): void => {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("nonfinite_number");
    return;
  }
  if (typeof value !== "object") throw new TypeError("non_json_value");
  if (visited.has(value)) throw new TypeError("repeated_object_identity");
  visited.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      throw new TypeError("non_plain_array_prototype");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const lengthDescriptor = descriptors.length;
    if (
      lengthDescriptor == null ||
      !("value" in lengthDescriptor) ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      throw new TypeError("array_length_descriptor_invalid");
    }
    const expectedKeys = [
      ...Array.from({ length: lengthDescriptor.value }, (_, index) =>
        String(index),
      ),
      "length",
    ].sort();
    const actualKeys = Reflect.ownKeys(value);
    if (
      actualKeys.some((key) => typeof key === "symbol") ||
      actualKeys.length !== expectedKeys.length ||
      actualKeys
        .map(String)
        .sort()
        .some((key, index) => key !== expectedKeys[index])
    ) {
      throw new TypeError("array_keys_invalid");
    }
    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.get != null ||
        descriptor.set != null ||
        descriptor.enumerable !== true
      ) {
        throw new TypeError("array_accessor_or_descriptor_invalid");
      }
      assertPlainJsonGraph(descriptor.value, visited);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("non_plain_object_prototype");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key === "symbol")) {
    throw new TypeError("symbol_key_invalid");
  }
  for (const key of keys as string[]) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      throw new TypeError("object_accessor_or_descriptor_invalid");
    }
    assertPlainJsonGraph(descriptor.value, visited);
  }
};

const detachedPlainDataSnapshot = (value: unknown): unknown => {
  assertPlainJsonGraph(value, new Set<object>());
  const detached = structuredClone(value);
  assertPlainJsonGraph(detached, new Set<object>());
  return deepFreeze(detached);
};

export const nhm2SemiclassicalV3PairNumericAgreementPolicyViolations = (
  input: unknown,
): string[] => {
  let snapshot: unknown;
  try {
    snapshot = detachedPlainDataSnapshot(input);
  } catch {
    return ["policy_plain_data_snapshot_invalid"];
  }
  try {
    return JSON.stringify(canonicalizeJson(snapshot)) ===
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON
      ? []
      : ["policy_content_mismatch"];
  } catch {
    return ["policy_content_uncomparable"];
  }
};

export const isNhm2SemiclassicalV3PairNumericAgreementPolicy = (
  input: unknown,
): input is typeof NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY =>
  nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(input).length === 0;
