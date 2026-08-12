import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
  computeNhm2SemiclassicalV2ScientificSealKey,
} from "./nhm2-semiclassical-v2-scientific-preseal.v1";

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID =
  "nhm2.semiclassical_v2_constraint_operand_replay" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_replay/v2" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID =
  "nhm2.semiclassical_v2_constraint_operand_replay_policy" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_replay_policy/v2" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID =
  "nhm2.server_owned.semiclassical_v2.constraint_operand_replay/v2" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-constraint-operand-replay-policy/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-constraint-operand-inventory/v2\n" as const;

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_SAMPLE_COUNT = 64;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER =
  Object.freeze([
    "hamiltonian",
    "momentum_x",
    "momentum_y",
    "momentum_z",
  ] as const);

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS = Object.freeze([
  Object.freeze({ ordinal: 0, levelId: "level_0", hExact: "1/16", h: 1 / 16 }),
  Object.freeze({ ordinal: 1, levelId: "level_1", hExact: "1/32", h: 1 / 32 }),
  Object.freeze({ ordinal: 2, levelId: "level_2", hExact: "1/64", h: 1 / 64 }),
] as const);

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER =
  Object.freeze(["H_H", "H_Hi", "Hi_Hj", "antisymmetry", "jacobi"] as const);

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER =
  Object.freeze({
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

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL = 21;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT = 63;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES =
  2_048 as const;

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS =
  Object.freeze({
    H_H: "server_residual=computed-target",
    H_Hi: "server_residual=computed-target",
    Hi_Hj: "server_residual=computed-target",
    antisymmetry: "server_residual=forward+reverse",
    jacobi: "server_residual=term_1+term_2+term_3",
  } as const);

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY =
  Object.freeze({
    artifactId:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID,
    maturity: "schema_only_no_replay_authority" as const,
    sampleCount: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_SAMPLE_COUNT,
    channelOrder: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
    levels: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
    familyOrder: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
    operandRoleOrder: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
    arraysPerLevel: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
    totalArrayCount: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
    arrayRepresentation: Object.freeze({
      dtype: "float64" as const,
      binaryEncoding: "raw_ieee754" as const,
      endianness: "little" as const,
      shape: Object.freeze([64, 4] as const),
      storageOrder: "row-major" as const,
      unit: "dimensionless_barred_constraint_generator" as const,
      sampleOrder: "candidate_sampling_ordinal_0_to_63" as const,
      canonicalPath:
        "{outputDirectory}/{levelId}/{familyId}/{operandRole}.f64le" as const,
      sizeBytes: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
    }),
    serverRecomputation: Object.freeze({
      residualFormulas:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS,
      submittedResidualUse:
        "consistency_check_only_never_residual_authority" as const,
      submittedResidualMismatchLInf:
        "submittedResidualMismatchLInf=max(abs(submittedResidual-serverResidual))" as const,
      submittedAbsoluteUncertainty95Use:
        "joint_simultaneous_95_percent_bound_across_all_levels_families_samples_channels_or_stronger_deterministic_enclosure" as const,
      centralLevelOrdinal: 2 as const,
      centralResidualUpper95:
        "residualUpper95=max(abs(serverResidual)+submittedU95)" as const,
      producerResidualOrConvergenceSummaryAuthoritative: false as const,
      derivedOnlySubmissionAllowed: false as const,
      decodeEveryRawOperand: true as const,
      rejectNonfiniteDecodedValues: true as const,
      rejectNegativeAbsoluteUncertainty95: true as const,
      recomputeEveryFamilyResidualAtEveryLevel: true as const,
      rejectSubmittedResidualMismatch: true as const,
      producerResidualConsistencyTolerance: 1e-12,
      computedTargetEchoPolicy: Object.freeze({
        bracketFamilies: Object.freeze(["H_H", "H_Hi", "Hi_Hj"] as const),
        rejectExactPerLevelComputedTargetEquality: true as const,
      }),
      targetDerivationPolicy: Object.freeze({
        targetMustBeRecomputedFromFrozenDiracStructureFunctions: true as const,
        suppliedTargetBytesAloneEstablishDerivation: false as const,
        serverDerivationReplayReceiptIntegrated: false as const,
      }),
    }),
    uncertaintyCoverage: Object.freeze({
      coverageKind:
        "joint_simultaneous_95_percent_or_stronger_deterministic_enclosure" as const,
      scope:
        "all_3_levels_x_5_families_x_64_samples_x_4_channels_and_all_residual_derivations" as const,
      componentwiseMarginalCoverageSufficient: false as const,
      serverDerivationReceiptRequired: true as const,
      serverDerivationReceiptIntegrated: false as const,
      producerCoverageDeclarationAuthoritative: false as const,
    }),
    provenanceVerification: Object.freeze({
      serverMustRehashEveryOperandFileBeforeDecode: true as const,
      serverMustVerifyExactByteSizeBeforeDecode: true as const,
      serverMustVerifyCanonicalPathInsideRunOutputRoot: true as const,
      serverMustVerifyRunSpecificNewness: true as const,
      producerFreshnessClassificationAuthoritative: false as const,
      serverMustResolveAndMatchPersistedScientificPreseal: true as const,
      producerScientificPresealEchoAuthoritative: false as const,
    }),
    convergence: Object.freeze({
      familyAggregation: "none" as const,
      pMinimum: 1 as const,
      interlevelDifferences: Object.freeze({
        d01: "abs(server_residual_level_0-server_residual_level_1)",
        d12: "abs(server_residual_level_1-server_residual_level_2)",
      }),
      conservativeErrorRoles: Object.freeze({
        level_0: "E_0=2*d01",
        level_1: "E_1=2*d12",
        level_2: "E_2=d12",
      }),
      conservativeUncertaintyRoles: Object.freeze({
        level_0: "U_E0=2*(U_level_0+U_level_1)",
        level_1: "U_E1=2*(U_level_1+U_level_2)",
        level_2: "U_E2=U_level_1+U_level_2",
      }),
      errorEnvelopeUpperDefinition:
        "q_family_level=max_over_64x4(abs(E_family_level)+U_E_family_level)",
      interlevelBoundDefinitions: Object.freeze({
        D01Lower:
          "D01Lower=max_i(max(0,abs(R_level_0-R_level_1)-(U_level_0+U_level_1)))",
        D01Upper:
          "D01Upper=max_i(abs(R_level_0-R_level_1)+U_level_0+U_level_1)",
        D12Lower:
          "D12Lower=max_i(max(0,abs(R_level_1-R_level_2)-(U_level_1+U_level_2)))",
        D12Upper:
          "D12Upper=max_i(abs(R_level_1-R_level_2)+U_level_1+U_level_2)",
      }),
      conservativeOrderLowerDefinition: "pLower=log(D01Lower/D12Upper)/log(2)",
      exactZeroDisposition:
        "D01Lower_less_than_or_equal_to_zero_or_D12Upper_less_than_or_equal_to_zero_is_blocked_without_synthetic_floor" as const,
      monotonicityDefinition:
        "D12Upper<=D01Lower+monotonicity_absolute_tolerance" as const,
      monotonicityAbsoluteTolerance: 1e-12,
      minimumObservedOrder: 1 as const,
      finalResidualUpper95Tolerance: 0.1,
      finalRegulatorErrorUpper95Tolerance: 0.1,
      everyFamilyMustPassSeparately: true as const,
      globalPassDefinition:
        "every_frozen_family_passes_its_own_residual_error_and_order_gates" as const,
      producerReportedOrderAuthoritative: false as const,
      finiteDerivedRoleOrder: Object.freeze([
        "R_level_0",
        "R_level_1",
        "R_level_2",
        "d01",
        "d12",
        "E_0",
        "E_1",
        "E_2",
        "U_E0",
        "U_E1",
        "U_E2",
        "q_0",
        "q_1",
        "q_2",
        "D01Lower",
        "D01Upper",
        "D12Lower",
        "D12Upper",
        "pLower",
        "submitted_residual_mismatch_linf",
        "central_residual_upper95",
      ] as const),
      everyDerivedRoleMustBeFiniteBeforeComparison: true as const,
      finiteCheckCadence:
        "after_every_primitive_operation_reduction_and_derived_role" as const,
      nonfiniteOrOverflowDisposition:
        "blocked_before_any_family_or_global_pass" as const,
    }),
    pairBinding: Object.freeze({
      lexicalPathComparison:
        "portable_forward_slash_paths_case_folded_before_equal_or_ancestor_descendant_comparison" as const,
      rejectCaseInsensitiveEqualOutputRoots: true as const,
      rejectAncestorOrDescendantOutputRoots: true as const,
      realpathFilesystemIdentityVerified: false as const,
      symlinkJunctionHardlinkIdentityVerified: false as const,
      pairBindingGrantsReplayOrAgreementAuthority: false as const,
    }),
  });

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

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON =
  JSON.stringify(
    canonicalizeJson(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY),
  );
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY =
  Object.freeze({
    schemaImplemented: true as const,
    integrationComplete: false as const,
    candidateAdmission: false as const,
    candidateAuthority: false as const,
    scientificCandidateAdmissible: false as const,
    scientificPresealAdmission: false as const,
    scientificPresealAuthority: false as const,
    rawReplayAdmission: false as const,
    rawReplayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    currentNhm2MetricIdentity: false as const,
    currentNhm2SourceIdentity: false as const,
    casimirSourceIdentity: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

export type Nhm2SemiclassicalV2ConstraintOperandFamilyId =
  (typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER)[number];
export type Nhm2SemiclassicalV2ConstraintOperandLevelId =
  (typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS)[number]["levelId"];
export type Nhm2SemiclassicalV2ConstraintOperandRole =
  (typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER)[keyof typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER][number];

export type Nhm2SemiclassicalV2ConstraintOperandArrayV1 = {
  operandRole: Nhm2SemiclassicalV2ConstraintOperandRole;
  path: string;
  sha256: string;
  sizeBytes: 2048;
  freshness: "new";
  observedAt: string;
  scientificPresealSealKey: string;
  dtype: "float64";
  binaryEncoding: "raw_ieee754";
  endianness: "little";
  shape: [64, 4];
  storageOrder: "row-major";
  componentOrder: ["hamiltonian", "momentum_x", "momentum_y", "momentum_z"];
  sampleOrder: "candidate_sampling_ordinal_0_to_63";
  unit: "dimensionless_barred_constraint_generator";
};

export type Nhm2SemiclassicalV2ConstraintOperandFamilyV1 = {
  familyId: Nhm2SemiclassicalV2ConstraintOperandFamilyId;
  operandOrder: Nhm2SemiclassicalV2ConstraintOperandRole[];
  residualFormula: string;
  operands: Nhm2SemiclassicalV2ConstraintOperandArrayV1[];
};

export type Nhm2SemiclassicalV2ConstraintOperandLevelV1 = {
  ordinal: 0 | 1 | 2;
  levelId: Nhm2SemiclassicalV2ConstraintOperandLevelId;
  hExact: "1/16" | "1/32" | "1/64";
  h: number;
  families: Nhm2SemiclassicalV2ConstraintOperandFamilyV1[];
};

export type Nhm2SemiclassicalV2ConstraintOperandReplayV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION;
  generatedAt: string;
  policyBinding: {
    artifactId: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION;
    policyId: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID;
    sha256: string;
    sizeBytes: number;
  };
  candidateBinding: {
    candidateId: string;
    candidateManifestSha256: string;
    scientificPresealBinding: {
      artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID;
      contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION;
      sealKey: string;
      candidateManifestSha256: string;
      scientificContentSha256: string;
      sealedInventorySha256: string;
      sealedAt: string;
    };
  };
  implementation: {
    comparisonPairId: string;
    role: "primary" | "independent";
    implementationId: string;
    sourceIdentityId: string;
    sourceSha256: string;
    dependencyLockIdentityId: string;
    dependencyLockSha256: string;
    executableIdentityId: string;
    executableSha256: string;
  };
  execution: {
    commitSha: string;
    command: string;
    argv: string[];
    outputDirectory: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    exitCode: 0;
    terminationSignal: null;
  };
  levels: Nhm2SemiclassicalV2ConstraintOperandLevelV1[];
  operandInventorySha256: string;
  authorityBoundary: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY;
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "policyBinding",
  "candidateBinding",
  "implementation",
  "execution",
  "levels",
  "operandInventorySha256",
  "authorityBoundary",
] as const;
const POLICY_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
  "sizeBytes",
] as const;
const CANDIDATE_BINDING_KEYS = [
  "candidateId",
  "candidateManifestSha256",
  "scientificPresealBinding",
] as const;
const PRESEAL_KEYS = [
  "artifactId",
  "contractVersion",
  "sealKey",
  "candidateManifestSha256",
  "scientificContentSha256",
  "sealedInventorySha256",
  "sealedAt",
] as const;
const IMPLEMENTATION_KEYS = [
  "comparisonPairId",
  "role",
  "implementationId",
  "sourceIdentityId",
  "sourceSha256",
  "dependencyLockIdentityId",
  "dependencyLockSha256",
  "executableIdentityId",
  "executableSha256",
] as const;
const EXECUTION_KEYS = [
  "commitSha",
  "command",
  "argv",
  "outputDirectory",
  "startedAt",
  "completedAt",
  "durationMs",
  "exitCode",
  "terminationSignal",
] as const;
const LEVEL_KEYS = ["ordinal", "levelId", "hExact", "h", "families"] as const;
const FAMILY_KEYS = [
  "familyId",
  "operandOrder",
  "residualFormula",
  "operands",
] as const;
const OPERAND_KEYS = [
  "operandRole",
  "path",
  "sha256",
  "sizeBytes",
  "freshness",
  "observedAt",
  "scientificPresealSealKey",
  "dtype",
  "binaryEncoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "sampleOrder",
  "unit",
] as const;
const AUTHORITY_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
);

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
      actualKeys
        .map(String)
        .sort()
        .some((key, index) => key !== expectedKeys[index]) ||
      actualKeys.length !== expectedKeys.length
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

const deepFreezePlainData = (value: unknown): unknown => {
  if (value != null && typeof value === "object") {
    for (const entry of Object.values(value)) deepFreezePlainData(entry);
    Object.freeze(value);
  }
  return value;
};

/**
 * Detach accepted data from caller-owned objects before validation. Accessors,
 * symbols, exotic prototypes, repeated references, cycles, and Proxy objects
 * fail before the detached snapshot can be treated as schema-conformant.
 */
const detachedPlainDataSnapshot = (value: unknown): unknown => {
  assertPlainJsonGraph(value, new Set<object>());
  const detached = structuredClone(value);
  assertPlainJsonGraph(detached, new Set<object>());
  return deepFreezePlainData(detached);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
};
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isGitCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  !/[\u0000-\u001f\u007f]/.test(value);
const timestampMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
};
const isPortableRelativePath = (value: unknown): value is string => {
  if (!isNonemptyString(value) || value.includes("\\") || value.startsWith("/"))
    return false;
  if (/^[A-Za-z]:/.test(value)) return false;
  const segments = value.split("/");
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== "..",
  );
};
const caseFoldPortablePath = (value: string): string =>
  value.toLocaleLowerCase("en-US");
const portablePathsEqualOrNested = (left: string, right: string): boolean => {
  const foldedLeft = caseFoldPortablePath(left);
  const foldedRight = caseFoldPortablePath(right);
  return (
    foldedLeft === foldedRight ||
    foldedLeft.startsWith(`${foldedRight}/`) ||
    foldedRight.startsWith(`${foldedLeft}/`)
  );
};
const arraysEqual = (left: unknown, right: readonly unknown[]): boolean =>
  Array.isArray(left) &&
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);
const recordsEqual = (left: unknown, right: Record<string, unknown>): boolean =>
  isRecord(left) &&
  hasExactKeys(left, Object.keys(right)) &&
  Object.entries(right).every(([key, value]) => left[key] === value);

const inventoryPayload = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
) => ({
  artifactId: manifest.artifactId,
  contractVersion: manifest.contractVersion,
  generatedAt: manifest.generatedAt,
  policyBinding: manifest.policyBinding,
  candidateBinding: manifest.candidateBinding,
  implementation: manifest.implementation,
  execution: manifest.execution,
  levels: manifest.levels,
  authorityBoundary: manifest.authorityBoundary,
});

export const computeNhm2SemiclassicalV2ConstraintOperandInventorySha256 = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
): string =>
  createHash("sha256")
    .update(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      JSON.stringify(canonicalizeJson(inventoryPayload(manifest))),
      "utf8",
    )
    .digest("hex");

export const collectNhm2SemiclassicalV2ConstraintOperandArrays = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
): Nhm2SemiclassicalV2ConstraintOperandArrayV1[] =>
  manifest.levels.flatMap((level) =>
    level.families.flatMap((family) => family.operands),
  );

export const nhm2SemiclassicalV2ConstraintOperandReplayViolations = (
  input: unknown,
): string[] => {
  let raw: unknown;
  try {
    raw = detachedPlainDataSnapshot(input);
  } catch {
    return ["manifest_plain_data_snapshot_invalid"];
  }
  const violations: string[] = [];
  try {
    if (!isRecord(raw) || !hasExactKeys(raw, ROOT_KEYS)) {
      return ["manifest_shape_invalid"];
    }
    if (
      raw.artifactId !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID ||
      raw.contractVersion !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION
    ) {
      violations.push("artifact_identity_invalid");
    }

    const policyBinding = isRecord(raw.policyBinding)
      ? raw.policyBinding
      : null;
    if (
      policyBinding == null ||
      !hasExactKeys(policyBinding, POLICY_BINDING_KEYS) ||
      policyBinding.artifactId !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID ||
      policyBinding.contractVersion !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION ||
      policyBinding.policyId !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID ||
      policyBinding.sha256 !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256 ||
      policyBinding.sizeBytes !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES
    ) {
      violations.push("policy_binding_invalid");
    }

    const candidate = isRecord(raw.candidateBinding)
      ? raw.candidateBinding
      : null;
    const preseal =
      candidate != null && isRecord(candidate.scientificPresealBinding)
        ? candidate.scientificPresealBinding
        : null;
    if (
      candidate == null ||
      !hasExactKeys(candidate, CANDIDATE_BINDING_KEYS) ||
      !isNonemptyString(candidate.candidateId) ||
      !isSha256(candidate.candidateManifestSha256) ||
      preseal == null
    ) {
      violations.push("candidate_binding_invalid");
    }
    if (
      candidate == null ||
      preseal == null ||
      !hasExactKeys(preseal, PRESEAL_KEYS) ||
      preseal.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID ||
      preseal.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION ||
      !isSha256(preseal.sealKey) ||
      preseal.sealKey !==
        computeNhm2SemiclassicalV2ScientificSealKey(
          typeof candidate.candidateId === "string"
            ? candidate.candidateId
            : "invalid",
        ) ||
      !isSha256(preseal.candidateManifestSha256) ||
      preseal.candidateManifestSha256 !== candidate.candidateManifestSha256 ||
      !isSha256(preseal.scientificContentSha256) ||
      !isSha256(preseal.sealedInventorySha256) ||
      timestampMs(preseal.sealedAt) == null
    ) {
      violations.push("scientific_preseal_binding_invalid");
    }

    const implementation = isRecord(raw.implementation)
      ? raw.implementation
      : null;
    if (
      implementation == null ||
      !hasExactKeys(implementation, IMPLEMENTATION_KEYS) ||
      !isNonemptyString(implementation.comparisonPairId) ||
      (implementation.role !== "primary" &&
        implementation.role !== "independent") ||
      !isNonemptyString(implementation.implementationId) ||
      !isNonemptyString(implementation.sourceIdentityId) ||
      !isSha256(implementation.sourceSha256) ||
      !isNonemptyString(implementation.dependencyLockIdentityId) ||
      !isSha256(implementation.dependencyLockSha256) ||
      !isNonemptyString(implementation.executableIdentityId) ||
      !isSha256(implementation.executableSha256)
    ) {
      violations.push("implementation_binding_invalid");
    }

    const execution = isRecord(raw.execution) ? raw.execution : null;
    const startedAt =
      execution == null ? null : timestampMs(execution.startedAt);
    const completedAt =
      execution == null ? null : timestampMs(execution.completedAt);
    const generatedAt = timestampMs(raw.generatedAt);
    if (
      execution == null ||
      !hasExactKeys(execution, EXECUTION_KEYS) ||
      !isGitCommitSha(execution.commitSha) ||
      !isNonemptyString(execution.command) ||
      !Array.isArray(execution.argv) ||
      execution.argv.some((entry) => !isNonemptyString(entry)) ||
      !isPortableRelativePath(execution.outputDirectory) ||
      startedAt == null ||
      completedAt == null ||
      generatedAt == null ||
      !(startedAt < completedAt && completedAt <= generatedAt) ||
      !Number.isSafeInteger(execution.durationMs) ||
      execution.durationMs !== completedAt - startedAt ||
      execution.exitCode !== 0 ||
      execution.terminationSignal !== null
    ) {
      violations.push("execution_binding_invalid");
    }
    if (
      preseal != null &&
      timestampMs(preseal.sealedAt) != null &&
      startedAt != null &&
      !(timestampMs(preseal.sealedAt)! < startedAt)
    ) {
      violations.push("preseal_execution_chronology_invalid");
    }

    const levels = Array.isArray(raw.levels) ? raw.levels : [];
    if (
      levels.length !== NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS.length
    ) {
      violations.push("level_count_invalid");
    }
    const paths: string[] = [];
    let operandCount = 0;
    for (
      let levelIndex = 0;
      levelIndex < NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS.length;
      levelIndex += 1
    ) {
      const expectedLevel =
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS[levelIndex];
      const level = isRecord(levels[levelIndex]) ? levels[levelIndex] : null;
      if (
        level == null ||
        !hasExactKeys(level, LEVEL_KEYS) ||
        level.ordinal !== expectedLevel.ordinal ||
        level.levelId !== expectedLevel.levelId ||
        level.hExact !== expectedLevel.hExact ||
        level.h !== expectedLevel.h
      ) {
        violations.push(`level_binding_invalid:/levels/${levelIndex}`);
      }
      const families =
        level != null && Array.isArray(level.families) ? level.families : [];
      if (
        families.length !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER.length
      ) {
        violations.push(`family_count_invalid:/levels/${levelIndex}`);
      }
      for (
        let familyIndex = 0;
        familyIndex <
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER.length;
        familyIndex += 1
      ) {
        const familyId =
          NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER[familyIndex];
        const roleOrder =
          NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER[familyId];
        const family = isRecord(families[familyIndex])
          ? families[familyIndex]
          : null;
        const familyPath = `/levels/${levelIndex}/families/${familyIndex}`;
        if (
          family == null ||
          !hasExactKeys(family, FAMILY_KEYS) ||
          family.familyId !== familyId ||
          !arraysEqual(family.operandOrder, roleOrder) ||
          family.residualFormula !==
            NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS[familyId]
        ) {
          violations.push(`family_binding_invalid:${familyPath}`);
        }
        const operands =
          family != null && Array.isArray(family.operands)
            ? family.operands
            : [];
        if (operands.length !== roleOrder.length) {
          violations.push(`operand_count_invalid:${familyPath}`);
        }
        for (let roleIndex = 0; roleIndex < roleOrder.length; roleIndex += 1) {
          const operand = isRecord(operands[roleIndex])
            ? operands[roleIndex]
            : null;
          const operandPath = `${familyPath}/operands/${roleIndex}`;
          operandCount += 1;
          if (operand != null && typeof operand.path === "string") {
            paths.push(operand.path);
          }
          const observedAt =
            operand == null ? null : timestampMs(operand.observedAt);
          const outputDirectory =
            execution != null && typeof execution.outputDirectory === "string"
              ? execution.outputDirectory
              : null;
          const expectedPath =
            outputDirectory == null
              ? null
              : `${outputDirectory}/${expectedLevel.levelId}/${familyId}/${roleOrder[roleIndex]}.f64le`;
          if (
            operand == null ||
            !hasExactKeys(operand, OPERAND_KEYS) ||
            operand.operandRole !== roleOrder[roleIndex] ||
            !isPortableRelativePath(operand.path) ||
            expectedPath == null ||
            operand.path !== expectedPath ||
            !isSha256(operand.sha256) ||
            operand.sizeBytes !==
              NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES ||
            operand.freshness !== "new" ||
            observedAt == null ||
            completedAt == null ||
            generatedAt == null ||
            !(completedAt <= observedAt && observedAt <= generatedAt) ||
            preseal == null ||
            operand.scientificPresealSealKey !== preseal.sealKey ||
            operand.dtype !== "float64" ||
            operand.binaryEncoding !== "raw_ieee754" ||
            operand.endianness !== "little" ||
            !arraysEqual(operand.shape, [64, 4]) ||
            operand.storageOrder !== "row-major" ||
            !arraysEqual(
              operand.componentOrder,
              NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
            ) ||
            operand.sampleOrder !== "candidate_sampling_ordinal_0_to_63" ||
            operand.unit !== "dimensionless_barred_constraint_generator"
          ) {
            violations.push(`operand_descriptor_invalid:${operandPath}`);
          }
        }
      }
    }
    if (operandCount !== NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT) {
      violations.push("operand_inventory_cardinality_invalid");
    }
    if (
      new Set(paths.map((path) => path.toLocaleLowerCase("en-US"))).size !==
      paths.length
    ) {
      violations.push("operand_paths_not_unique");
    }

    if (!isSha256(raw.operandInventorySha256)) {
      violations.push("operand_inventory_sha256_invalid");
    } else {
      try {
        const recomputed =
          computeNhm2SemiclassicalV2ConstraintOperandInventorySha256(
            raw as Nhm2SemiclassicalV2ConstraintOperandReplayV1,
          );
        if (raw.operandInventorySha256 !== recomputed) {
          violations.push("operand_inventory_sha256_mismatch");
        }
      } catch {
        violations.push("operand_inventory_sha256_unrecomputable");
      }
    }

    if (
      !hasExactKeys(
        isRecord(raw.authorityBoundary) ? raw.authorityBoundary : {},
        AUTHORITY_KEYS,
      ) ||
      !recordsEqual(
        raw.authorityBoundary,
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
      )
    ) {
      violations.push("authority_boundary_invalid");
    }
  } catch {
    return violations.length > 0
      ? [...new Set([...violations, "manifest_validation_exception"])]
      : ["manifest_validation_exception"];
  }
  return [...new Set(violations)];
};

/**
 * Schema-level pair binding only. A clean result proves neither execution
 * provenance nor replay agreement and cannot change the false authority locks.
 */
export const nhm2SemiclassicalV2ConstraintOperandReplayPairViolations = (
  primaryInput: unknown,
  independentInput: unknown,
): string[] => {
  const violations: string[] = [];
  let primarySnapshot: unknown;
  let independentSnapshot: unknown;
  try {
    primarySnapshot = detachedPlainDataSnapshot(primaryInput);
  } catch {
    return ["primary_manifest_invalid:manifest_plain_data_snapshot_invalid"];
  }
  try {
    independentSnapshot = detachedPlainDataSnapshot(independentInput);
  } catch {
    return [
      "independent_manifest_invalid:manifest_plain_data_snapshot_invalid",
    ];
  }

  const primaryViolations =
    nhm2SemiclassicalV2ConstraintOperandReplayViolations(primarySnapshot);
  const independentViolations =
    nhm2SemiclassicalV2ConstraintOperandReplayViolations(independentSnapshot);
  if (primaryViolations.length > 0) {
    violations.push(
      ...primaryViolations.map((entry) => `primary_manifest_invalid:${entry}`),
    );
  }
  if (independentViolations.length > 0) {
    violations.push(
      ...independentViolations.map(
        (entry) => `independent_manifest_invalid:${entry}`,
      ),
    );
  }
  if (violations.length > 0) return [...new Set(violations)];

  const primary =
    primarySnapshot as Nhm2SemiclassicalV2ConstraintOperandReplayV1;
  const independent =
    independentSnapshot as Nhm2SemiclassicalV2ConstraintOperandReplayV1;
  if (primary.implementation.role !== "primary") {
    violations.push("primary_role_invalid");
  }
  if (independent.implementation.role !== "independent") {
    violations.push("independent_role_invalid");
  }
  if (
    JSON.stringify(canonicalizeJson(primary.policyBinding)) !==
    JSON.stringify(canonicalizeJson(independent.policyBinding))
  ) {
    violations.push("pair_policy_binding_mismatch");
  }
  if (
    JSON.stringify(canonicalizeJson(primary.candidateBinding)) !==
    JSON.stringify(canonicalizeJson(independent.candidateBinding))
  ) {
    violations.push("pair_scientific_preseal_binding_mismatch");
  }
  if (
    primary.implementation.comparisonPairId !==
    independent.implementation.comparisonPairId
  ) {
    violations.push("comparison_pair_id_mismatch");
  }

  const identityPairs: ReadonlyArray<
    readonly [keyof typeof primary.implementation, string]
  > = [
    ["implementationId", "implementation_id_not_distinct"],
    ["sourceIdentityId", "source_identity_id_not_distinct"],
    ["sourceSha256", "source_sha256_not_distinct"],
    ["dependencyLockIdentityId", "dependency_lock_identity_id_not_distinct"],
    ["dependencyLockSha256", "dependency_lock_sha256_not_distinct"],
    ["executableIdentityId", "executable_identity_id_not_distinct"],
    ["executableSha256", "executable_sha256_not_distinct"],
  ];
  for (const [key, violation] of identityPairs) {
    if (primary.implementation[key] === independent.implementation[key]) {
      violations.push(violation);
    }
  }
  if (
    portablePathsEqualOrNested(
      primary.execution.outputDirectory,
      independent.execution.outputDirectory,
    )
  ) {
    violations.push("pair_output_root_topology_invalid");
  }
  return [...new Set(violations)];
};

/** Structural conformance only; never server-origin or replay authority. */
export const isNhm2SemiclassicalV2ConstraintOperandReplay = (
  value: unknown,
): value is Nhm2SemiclassicalV2ConstraintOperandReplayV1 =>
  nhm2SemiclassicalV2ConstraintOperandReplayViolations(value).length === 0;
