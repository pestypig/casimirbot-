import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";
import {
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
} from "./nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ARTIFACT_ID =
  "nhm2.spherical_boson_star_1s_v3_tolerance_policy" as const;
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_1s_v3_tolerance_policy/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ID =
  "nhm2.server_owned.spherical_boson_star_1s.semiclassical_v3.tolerances/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANDIDATE_ID =
  "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING_PINS =
  Object.freeze({
    replayEpochPolicySha256:
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    constraintArithmeticPolicySha256:
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
    pairNumericAgreementPolicySha256:
      "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 24,
    maximumNodes: 4096,
    maximumArrayLength: 256,
    maximumObjectPropertyCount: 128,
    maximumStringUtf8Bytes: 4096,
  } as const);

const copiedPairGroupTolerances = Object.freeze({
  noise_kernel: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 1e-5,
  }),
  noise_kernel_absolute_uncertainty95: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 0.75,
  }),
  mean_rset: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 1e-6,
  }),
  mean_rset_absolute_uncertainty95: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 0.75,
  }),
  smearing_weights: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 1e-10,
  }),
  normalized_constraint_operand: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 1e-6,
  }),
  normalized_constraint_absolute_uncertainty95: Object.freeze({
    absoluteTolerance: 1e-12,
    relativeTolerance: 0.75,
  }),
});

const POLICY = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CONTRACT_VERSION,
  policyId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ID,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANDIDATE_ID,
  authority: "preregistered_numeric_policy_identity_only",
  maturity: "frozen_before_execution_no_scientific_or_replay_authority",
  valuesFrozenBeforeExecution: true,
  provenance: {
    legacyV2PolicyImportedOrBound: false,
    numericValuesCopiedIntoThisNewCandidateSpecificV3Artifact: true,
    issuer: null,
    builder: null,
    execution: null,
    presealReceipt: null,
  },
  frozenThresholds: {
    selfConsistencyRelativeLInf: 1e-3,
    smearingWeightSumAbsolute: 1e-12,
    exchangeSymmetryUpper95SI: 1e-12,
    psdNegativeEigenvalueSI: 1e-12,
    meanNormalizationFloorSI: 1e-12,
    fluctuationToMeanRatioUpper95: 1,
    meanMetricDemandPointwiseRelativeUpper95: 0.1,
    metricDemandRelativeErrorBound: 0.01,
    bracketResidualUpper95: 0.1,
    antisymmetryResidualUpper95: 0.1,
    jacobiResidualUpper95: 0.1,
    regulatorResidualUpper95: 0.1,
    regulatorMonotonicityAbsolute: 1e-12,
    minimumRegulatorConvergenceOrder: 1,
    producerResidualConsistency: 1e-12,
    float64RecomputeAbsolute: 1e-12,
  },
  nondegeneracyPresealGate: {
    criterion:
      "all_64_metric_demand_symmetric_tensor_Frobenius_lower_bounds_strictly_exceed_the_frozen_floor_after_subtracting_the_registered_error_enclosure",
    minimumMetricDemandFrobeniusSI: 1e-12,
    requiredNondegenerateSampleFraction: 1,
    maximumRelativeErrorBound: 0.01,
    metricDemandLowerBoundReceiptRequired: true,
    metricDemandLowerBoundReceipt: null,
    established: false,
    mayBeAssertedFromCandidatePlausibilityOrSelection: false,
    scientificPresealAdmission: false,
  },
  uncertaintyCoverage: {
    perRunMinimumJointSimultaneousCoverage: 0.975,
    pairMinimumJointSimultaneousCoverage: 0.95,
    marginalOrPointwise95Sufficient: false,
    strongerDeterministicEnclosureAllowed: true,
  },
  pairGroupTolerances: copiedPairGroupTolerances,
  exactV3Bindings: {
    replayEpoch: {
      ...NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
      sha256Domain: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
    },
    constraintArithmetic:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    pairNumericAgreement: {
      ...NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
      sha256Domain:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
    },
    literalSha256Pins:
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING_PINS,
  },
  versioning: {
    producerSelectedToleranceAllowed: false,
    postObservationRetuningAllowed: false,
    automaticLegacyUpgradeAllowed: false,
    anyValueChangeRequiresNewPolicyContractVersion: true,
    anyValueChangeRequiresNewCandidateId: true,
    failedFrozenLimitDisposition: "fail_candidate_without_retuning",
  },
  result: null,
  authorityBoundary: {
    candidateAuthority: false,
    scientificCandidateAdmissible: false,
    issuerAuthority: false,
    builderAuthority: false,
    executionAuthority: false,
    presealAuthority: false,
    rawReplayAuthority: false,
    runReplayAuthority: false,
    pairAgreementAuthority: false,
    diagnosticPass: false,
    semiclassicalStressNoiseLamp: false,
    semiclassicalConstraintAlgebraLamp: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  },
  claimLockKeys: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY =
  deepFreeze(POLICY);

const assertPolicyInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING_PINS;
  const currentPairGroups =
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES;
  if (
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256 !==
      pins.replayEpochPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256 !==
      pins.constraintArithmeticPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING.sha256 !==
      pins.pairNumericAgreementPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.centralResidualUpper95Tolerance !==
      POLICY.frozenThresholds.bracketResidualUpper95 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.finalRegulatorErrorUpper95Tolerance !==
      POLICY.frozenThresholds.regulatorResidualUpper95 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.monotonicityAbsoluteTolerance !==
      POLICY.frozenThresholds.regulatorMonotonicityAbsolute ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.requiredMinimumOrder !==
      POLICY.frozenThresholds.minimumRegulatorConvergenceOrder ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.producerResidualConsistencyTolerance !==
      POLICY.frozenThresholds.producerResidualConsistency ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.coverage
      .perRunMinimumJointSimultaneousCoverage !==
      POLICY.uncertaintyCoverage.perRunMinimumJointSimultaneousCoverage ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.coverage
      .pairMinimumJointSimultaneousCoverage !==
      POLICY.uncertaintyCoverage.pairMinimumJointSimultaneousCoverage ||
    Object.keys(copiedPairGroupTolerances).some((groupId) => {
      const key = groupId as keyof typeof copiedPairGroupTolerances;
      return (
        copiedPairGroupTolerances[key].absoluteTolerance !==
          currentPairGroups[key].absoluteTolerance ||
        copiedPairGroupTolerances[key].relativeTolerance !==
          currentPairGroups[key].relativeTolerance
      );
    }) ||
    Object.values(POLICY.authorityBoundary).some((value) => value !== false) ||
    Object.values(POLICY.claimLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_1s_v3_tolerance_policy_invariant_violation",
    );
  }
};

assertPolicyInvariants();

export type Nhm2SphericalBosonStar1sV3TolerancePolicyV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { visitedNodes: number };

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
  budget: SnapshotBudget = { visitedNodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.visitedNodes += 1;
  if (budget.visitedNodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    return Buffer.byteLength(value, "utf8") <= limits.maximumStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `string_byte_length_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cyclic_value:${pointer || "/"}`,
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
      length < 0
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length:${pointer || "/"}`,
      });
    }
    if (length > limits.maximumArrayLength) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indexKeys = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indexKeys.length !== length ||
      indexKeys.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
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
  if (keys.some((key) => typeof key !== "string")) {
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
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
        violation: `object_property_surface:${pointer}/${key}`,
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

export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY);
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-1s-v3-tolerance-policy/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_CANONICAL_JSON;

export const nhm2SphericalBosonStar1sV3TolerancePolicyViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_1s_v3_tolerance_policy_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_1s_v3_tolerance_policy_external_copy_not_authoritative"]
      : ["spherical_1s_v3_tolerance_policy_semantic_mismatch"];
  } catch {
    return ["spherical_1s_v3_tolerance_policy_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStar1sV3TolerancePolicy = (
  value: unknown,
): value is Nhm2SphericalBosonStar1sV3TolerancePolicyV1 =>
  nhm2SphericalBosonStar1sV3TolerancePolicyViolations(value).length === 0;
