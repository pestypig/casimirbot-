import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
} from "./nhm2-semiclassical-v2-constraint-operand-replay.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";
import { NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER } from "./nhm2-semiclassical-state-realizability.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256_DOMAIN,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_regulator_definition" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_regulator_definition/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_PHASE =
  "pre_execution_additive_scientific_input_completion" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-regulator-definition/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS =
  Object.freeze({
    candidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    candidateFreezeCanonicalSizeBytes: 55997,
    constraintOperandReplaySourcePath:
      "shared/contracts/nhm2-semiclassical-v2-constraint-operand-replay.v1.ts",
    constraintOperandReplaySourceRawSha256:
      "9da1aef198b083b89c06a38e62d63e048f0dd131ba3f2d62077a7d632bcddaec",
    constraintOperandReplaySourceRawSizeBytes: 39679,
    constraintOperandReplayPolicyCanonicalJsonRawSha256:
      "42e68ad31cbe1b0af3eb13fb39f0771dc8692a0eec03ad09d290effbc37fe6fa",
    constraintOperandReplayPolicyDomainSealedSha256:
      "5a774ce79d8fd7686aeeaa26d9821f31ed2ed8619c2dac4d184f9e022a623e6d",
    constraintOperandReplayPolicyCanonicalSizeBytes: 5777,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER = Object.freeze(
  [
    Object.freeze({
      ordinal: 0,
      levelId: "level_0",
      hExact: "1/16",
      h: 1 / 16,
    }),
    Object.freeze({
      ordinal: 1,
      levelId: "level_1",
      hExact: "1/32",
      h: 1 / 32,
    }),
    Object.freeze({
      ordinal: 2,
      levelId: "level_2",
      hExact: "1/64",
      h: 1 / 64,
    }),
  ] as const,
);
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER =
  Object.freeze(["H_H", "H_Hi", "Hi_Hj", "antisymmetry", "jacobi"] as const);
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER =
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER;
export const NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT =
  5 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT =
  63 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT =
  21 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT =
  68 as const;

const makeNonconstraintArrayInventory = () =>
  [
    {
      role: "noise_kernel",
      path: "{outputDirectory}/fixed/00-noise_kernel.f64le",
      shape: [64, 64, 100],
      componentOrder: [...NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER],
      sampleOrder:
        "candidate_sampling_ordinal_0_to_63_x_candidate_sampling_ordinal_0_to_63_then_component_pair_order",
      unit: "(J/m^3)^2",
      sizeBytes: 3_276_800,
    },
    {
      role: "noise_kernel_absolute_uncertainty95",
      path: "{outputDirectory}/fixed/01-noise_kernel_absolute_uncertainty95.f64le",
      shape: [64, 64, 100],
      componentOrder: [...NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER],
      sampleOrder:
        "candidate_sampling_ordinal_0_to_63_x_candidate_sampling_ordinal_0_to_63_then_component_pair_order",
      unit: "(J/m^3)^2",
      sizeBytes: 3_276_800,
    },
    {
      role: "mean_rset",
      path: "{outputDirectory}/fixed/02-mean_rset.f64le",
      shape: [64, 10],
      componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
      sampleOrder:
        "candidate_sampling_ordinal_0_to_63_then_symmetric_tensor_component_order",
      unit: "J/m^3",
      sizeBytes: 5_120,
    },
    {
      role: "mean_rset_absolute_uncertainty95",
      path: "{outputDirectory}/fixed/03-mean_rset_absolute_uncertainty95.f64le",
      shape: [64, 10],
      componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
      sampleOrder:
        "candidate_sampling_ordinal_0_to_63_then_symmetric_tensor_component_order",
      unit: "J/m^3",
      sizeBytes: 5_120,
    },
    {
      role: "smearing_weights",
      path: "{outputDirectory}/fixed/04-smearing_weights.f64le",
      shape: [64],
      componentOrder: ["weight"],
      sampleOrder: "candidate_sampling_ordinal_0_to_63",
      unit: "dimensionless",
      sizeBytes: 512,
    },
  ].map((entry, fileOrdinal) =>
    Object.freeze({
      fileOrdinal,
      ...entry,
      dtype: "float64" as const,
      binaryEncoding: "raw_ieee754" as const,
      endianness: "little" as const,
      storageOrder: "row-major" as const,
      mediaType: "application/octet-stream" as const,
      finiteValuesRequired: true as const,
      negativeZeroAllowed: false as const,
    }),
  );

const makeConstraintOperandArrayInventory = () => {
  const entries = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER.flatMap(
    (level) =>
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER.flatMap((familyId) =>
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER[familyId].map(
          (operandRole) => ({
            levelOrdinal: level.ordinal,
            levelId: level.levelId,
            hExact: level.hExact,
            familyId,
            operandRole,
          }),
        ),
      ),
  );
  return entries.map((entry, constraintOrdinal) =>
    Object.freeze({
      constraintOrdinal,
      fileOrdinal:
        NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT +
        constraintOrdinal,
      ...entry,
      role: `constraint_operand.${entry.levelId}.${entry.familyId}.${entry.operandRole}`,
      path: `{outputDirectory}/${entry.levelId}/${entry.familyId}/${entry.operandRole}.f64le`,
      dtype: "float64" as const,
      binaryEncoding: "raw_ieee754" as const,
      endianness: "little" as const,
      shape: Object.freeze([64, 4] as const),
      storageOrder: "row-major" as const,
      componentOrder: Object.freeze([
        ...NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
      ]),
      sampleOrder: "candidate_sampling_ordinal_0_to_63" as const,
      unit: "dimensionless_barred_constraint_generator" as const,
      sizeBytes: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      mediaType: "application/octet-stream" as const,
      finiteValuesRequired: true as const,
      negativeZeroAllowed: false as const,
    }),
  );
};

const legacyCentralLogicalRole = (
  familyId: string,
  operandRole: string,
): string =>
  familyId === "H_H" || familyId === "H_Hi" || familyId === "Hi_Hj"
    ? `constraint_bracket.${familyId}.${operandRole}`
    : `${familyId}.${operandRole}`;

const makeCentralLevelAliases = () =>
  makeConstraintOperandArrayInventory()
    .filter((entry) => entry.levelId === "level_2")
    .map((entry, aliasOrdinal) =>
      Object.freeze({
        aliasOrdinal,
        legacyLogicalRole: legacyCentralLogicalRole(
          entry.familyId,
          entry.operandRole,
        ),
        canonicalConstraintOrdinal: entry.constraintOrdinal,
        canonicalFileOrdinal: entry.fileOrdinal,
        canonicalRole: entry.role,
        canonicalPath: entry.path,
        pathEqualityRequired: true,
        sha256EqualityRequired: true,
        relation: "same_canonical_level_2_file_and_sha256_no_duplicate",
        additionalPhysicalFile: false,
      }),
    );

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_AUTHORITY_LOCKS =
  Object.freeze({
    implementationComplete: false as const,
    implementationArtifact: null,
    runtimeBound: false as const,
    runtimeManifest: null,
    scientificPresealMaterialized: false as const,
    scientificPresealReceipt: null,
    executionAuthorized: false as const,
    executionObserved: false as const,
    resultsPresent: false as const,
    resultReceipt: null,
    replayAuthority: false as const,
    replayReceipt: null,
    independentAgreement: false as const,
    pairAgreementReceipt: null,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

const POLICY_CONVERGENCE =
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.convergence;

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_PHASE,
  authority: "preregistered_candidate_specific_definition_no_execution",
  maturity: "stage_2_diagnostic_contract_only",
  candidateFreezeBinding: {
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.candidateFreezeSha256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.candidateFreezeCanonicalSizeBytes,
    mediaType: "application/json",
  },
  constraintOperandReplayBinding: {
    artifactId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION,
    policyArtifactId:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID,
    policyContractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID,
    source: {
      path: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplaySourcePath,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplaySourceRawSha256,
      sizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplaySourceRawSizeBytes,
      mediaType: "text/typescript; charset=utf-8",
    },
    canonicalPolicy: {
      sha256Domain:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
      canonicalJsonRawSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplayPolicyCanonicalJsonRawSha256,
      domainSealedSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplayPolicyDomainSealedSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS.constraintOperandReplayPolicyCanonicalSizeBytes,
      mediaType: "application/json",
    },
  },
  additiveCompletion: {
    scientificInputId: "regulator_definition",
    relation: "additive_successor_completion_without_source_mutation",
    regulatorDefinitionComplete: true,
    successorOutputInventoryComplete: true,
    sourceCandidateFreezeMutated: false,
    sourcePlaceholder:
      "v2OutputDuty.regulator.aggregate_only_minimum_three_level_placeholder",
    supersedesForThisCandidate:
      "ambiguous_aggregate_only_regulator_output_duty_placeholder",
    doesNotSupersede:
      "candidate_identity_geometry_state_chart_normalization_tolerances_or_other_scientific_inputs",
    exactDefinitionMustBeBoundBySuccessorScientificCandidateManifest: true,
    sourceFreezeMissingInputListRemainsHistoricalEvidence: true,
  },
  integrationBoundary: {
    currentAggregateOnlyRawReplayProjectionCompatible: false,
    successorRawReplayManifestSchemaRequired: true,
    allConstraintOperandFilesUniqueAcrossLevelFamilyRole: true,
    centralHistoricalLogicalRolesAliasCanonicalLevel2Files: true,
    centralAliasesAddNoPhysicalFiles: true,
    constraintOperandReplayPathLayoutIsTheFrozenArrayLayout: true,
    schemaIntegrationComplete: false,
    executionRemainsBlockedUntilSchemaIntegrationAndPreseal: true,
  },
  declaredLeverExclusion: {
    declaredLeverTensorUsed: false,
    declaredTileEffectiveTensorLeverModelUsed: false,
    forbiddenInputIds: [
      "declared_lever_tensor",
      "candidate_declared_tile_effective_tensor_lever_model",
    ],
  },
  levels: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER,
  familyOrder: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER,
  familyAggregation: "none",
  operandRoleOrder: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER,
  successorOutputInventory: {
    ordering:
      "five_nonconstraint_files_in_frozen_role_order_then_constraint_files_level_family_operand_role",
    exactUniquePhysicalFileCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
    nonconstraintFiles: {
      exactFileCount: NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT,
      canonicalPathPattern: "{outputDirectory}/fixed/{ordinal}-{role}.f64le",
      files: makeNonconstraintArrayInventory(),
    },
    constraintOperandFiles: {
      ordering: "level_ordinal_major_then_family_order_then_operand_role_order",
      canonicalPathPattern:
        "{outputDirectory}/{levelId}/{familyId}/{operandRole}.f64le",
      rolePattern: "constraint_operand.{levelId}.{familyId}.{operandRole}",
      exactArraysPerLevel:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
      exactArrayCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
      arrays: makeConstraintOperandArrayInventory(),
    },
    centralLevel2LogicalAliases: {
      centralLevelOrdinal: 2,
      centralLevelId: "level_2",
      purpose:
        "historical_fixed_bracket_antisymmetry_and_jacobi_role_projection",
      aliasBinding:
        "same_path_and_sha256_as_canonical_level_2_constraint_operand_file",
      aliasesAreManifestProjectionsNotAdditionalFiles: true,
      exactAliasCount: NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT,
      aliases: makeCentralLevelAliases(),
    },
  },
  operandReplayEnforcement: {
    derivedOnlySubmissionAllowed:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .derivedOnlySubmissionAllowed,
    decodeEveryRawOperand:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .decodeEveryRawOperand,
    recomputeEveryFamilyResidualAtEveryLevel:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .recomputeEveryFamilyResidualAtEveryLevel,
    submittedResidualUse:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .submittedResidualUse,
    rejectSubmittedResidualMismatch:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .rejectSubmittedResidualMismatch,
    targetMustBeRecomputedFromFrozenDiracStructureFunctions:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .targetDerivationPolicy
        .targetMustBeRecomputedFromFrozenDiracStructureFunctions,
    suppliedTargetBytesAloneEstablishDerivation:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation
        .targetDerivationPolicy.suppliedTargetBytesAloneEstablishDerivation,
    centralLevelAliasesMustResolveBeforeDecode: true,
    decodeUniqueCanonicalFilesExactlyOnce: true,
    recomputeAllFiveFamiliesAtAllThreeLevelsFromPrimitiveOperands: true,
  },
  convergence: {
    familyAggregation: POLICY_CONVERGENCE.familyAggregation,
    pMinimum: POLICY_CONVERGENCE.pMinimum,
    interlevelDifferences: POLICY_CONVERGENCE.interlevelDifferences,
    conservativeErrorRoles: POLICY_CONVERGENCE.conservativeErrorRoles,
    conservativeUncertaintyRoles:
      POLICY_CONVERGENCE.conservativeUncertaintyRoles,
    errorEnvelopeUpperDefinition:
      POLICY_CONVERGENCE.errorEnvelopeUpperDefinition,
    interlevelBoundDefinitions: POLICY_CONVERGENCE.interlevelBoundDefinitions,
    conservativeOrderLowerDefinition:
      POLICY_CONVERGENCE.conservativeOrderLowerDefinition,
    exactZeroDisposition: POLICY_CONVERGENCE.exactZeroDisposition,
    monotonicityDefinition: POLICY_CONVERGENCE.monotonicityDefinition,
    monotonicityAbsoluteTolerance:
      POLICY_CONVERGENCE.monotonicityAbsoluteTolerance,
    minimumObservedOrder: POLICY_CONVERGENCE.minimumObservedOrder,
    finalResidualUpper95Tolerance:
      POLICY_CONVERGENCE.finalResidualUpper95Tolerance,
    finalRegulatorErrorUpper95Tolerance:
      POLICY_CONVERGENCE.finalRegulatorErrorUpper95Tolerance,
    everyFamilyMustPassSeparately:
      POLICY_CONVERGENCE.everyFamilyMustPassSeparately,
    globalPassDefinition: POLICY_CONVERGENCE.globalPassDefinition,
    producerReportedOrderAuthoritative:
      POLICY_CONVERGENCE.producerReportedOrderAuthoritative,
    finiteDerivedRoleOrder: POLICY_CONVERGENCE.finiteDerivedRoleOrder,
    everyDerivedRoleMustBeFiniteBeforeComparison:
      POLICY_CONVERGENCE.everyDerivedRoleMustBeFiniteBeforeComparison,
    finiteCheckCadence: POLICY_CONVERGENCE.finiteCheckCadence,
    nonfiniteOrOverflowDisposition:
      POLICY_CONVERGENCE.nonfiniteOrOverflowDisposition,
  },
  executionDisposition: {
    definitionFrozenBeforeExecution: true,
    rolesShapesEncodingAndPathOrderMayChangeAfterExecution: false,
    producerSummariesAuthoritative: false,
    recomputeEveryFamilyFromRawBytes: true,
    candidateFailureOnAnyFrozenGateExceedance:
      "fail_this_v2_candidate_without_retuning",
    postObservationToleranceGridFamilyOrFormulaRetuningAllowed: false,
  },
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2RegulatorDefinitionV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION);
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_SHA256 =
  "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_CANONICAL_SIZE_BYTES =
  62592 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16384,
    maximumArrayLength: 1024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4096,
    maximumStringUtf8Bytes: 32768,
    maximumAggregateUtf8Bytes: 1048576,
  } as const);

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
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_VALIDATOR_LIMITS;
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
  if (typeof value === "string") {
    const byteLength = Buffer.byteLength(value, "utf8");
    if (byteLength > limits.maximumStringUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += byteLength;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
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
    const keyByteLength = Buffer.byteLength(key, "utf8");
    if (keyByteLength > limits.maximumPropertyKeyUtf8Bytes) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `property_key_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += keyByteLength;
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
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS;
  const canonicalPolicyRawSha256 = createHash("sha256")
    .update(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.candidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.candidateFreezeCanonicalSizeBytes ||
    canonicalPolicyRawSha256 !==
      pins.constraintOperandReplayPolicyCanonicalJsonRawSha256 ||
    NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256 !==
      pins.constraintOperandReplayPolicyDomainSealedSha256 ||
    NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES !==
      pins.constraintOperandReplayPolicyCanonicalSizeBytes
  ) {
    throw new Error("nhm2_spherical_v2_regulator_dependency_pin_drift");
  }
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
  const inventory = contract.successorOutputInventory;
  const nonconstraintFiles = inventory.nonconstraintFiles.files;
  const arrays = inventory.constraintOperandFiles.arrays;
  const aliases = inventory.centralLevel2LogicalAliases.aliases;
  const paths = arrays.map((entry) => entry.path.toLocaleLowerCase("en-US"));
  const roles = arrays.map((entry) => entry.role);
  const expectedOperandKeys =
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER.flatMap((level) =>
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER.flatMap((familyId) =>
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER[familyId].map(
          (operandRole) =>
            `${level.ordinal}:${level.levelId}:${familyId}:${operandRole}`,
        ),
      ),
    );
  const observedOperandKeys = arrays.map(
    (entry) =>
      `${entry.levelOrdinal}:${entry.levelId}:${entry.familyId}:${entry.operandRole}`,
  );
  const expectedNonconstraintRoles = [
    "noise_kernel",
    "noise_kernel_absolute_uncertainty95",
    "mean_rset",
    "mean_rset_absolute_uncertainty95",
    "smearing_weights",
  ];
  const centralFiles = arrays.filter((entry) => entry.levelId === "level_2");
  if (
    JSON.stringify(contract.levels) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS) ||
    JSON.stringify(contract.familyOrder) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER) ||
    JSON.stringify(contract.operandRoleOrder) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER) ||
    JSON.stringify(arrays.map((entry) => entry.componentOrder)) !==
      JSON.stringify(
        arrays.map(
          () => NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
        ),
      ) ||
    NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT ||
    arrays.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT ||
    JSON.stringify(observedOperandKeys) !==
      JSON.stringify(expectedOperandKeys) ||
    arrays.some(
      (entry, index) =>
        entry.constraintOrdinal !== index ||
        entry.fileOrdinal !==
          NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT + index,
    ) ||
    new Set(paths).size !== arrays.length ||
    new Set(roles).size !== arrays.length ||
    nonconstraintFiles.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT ||
    JSON.stringify(nonconstraintFiles.map((entry) => entry.role)) !==
      JSON.stringify(expectedNonconstraintRoles) ||
    nonconstraintFiles.some((entry, index) => entry.fileOrdinal !== index) ||
    new Set(
      [...nonconstraintFiles, ...arrays].map((entry) =>
        entry.path.toLocaleLowerCase("en-US"),
      ),
    ).size !== NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT ||
    inventory.exactUniquePhysicalFileCount !==
      nonconstraintFiles.length + arrays.length ||
    aliases.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT ||
    centralFiles.length !== aliases.length ||
    aliases.some(
      (alias, index) =>
        alias.aliasOrdinal !== index ||
        alias.canonicalConstraintOrdinal !==
          centralFiles[index].constraintOrdinal ||
        alias.canonicalFileOrdinal !== centralFiles[index].fileOrdinal ||
        alias.canonicalRole !== centralFiles[index].role ||
        alias.canonicalPath !== centralFiles[index].path ||
        alias.additionalPhysicalFile !== false ||
        alias.pathEqualityRequired !== true ||
        alias.sha256EqualityRequired !== true,
    ) ||
    contract.familyAggregation !== "none" ||
    contract.convergence.familyAggregation !== "none" ||
    contract.operandReplayEnforcement.derivedOnlySubmissionAllowed !== false ||
    contract.operandReplayEnforcement.decodeEveryRawOperand !== true ||
    contract.operandReplayEnforcement
      .recomputeEveryFamilyResidualAtEveryLevel !== true ||
    contract.operandReplayEnforcement
      .recomputeAllFiveFamiliesAtAllThreeLevelsFromPrimitiveOperands !== true ||
    contract.additiveCompletion.regulatorDefinitionComplete !== true ||
    contract.additiveCompletion.successorOutputInventoryComplete !== true ||
    contract.additiveCompletion.sourceCandidateFreezeMutated !== false ||
    contract.integrationBoundary.schemaIntegrationComplete !== false ||
    contract.integrationBoundary
      .executionRemainsBlockedUntilSchemaIntegrationAndPreseal !== true ||
    contract.declaredLeverExclusion.declaredLeverTensorUsed !== false ||
    contract.executionDisposition
      .postObservationToleranceGridFamilyOrFormulaRetuningAllowed !== false ||
    Object.entries(contract.authorityLocks).some(([, value]) =>
      value === null ? false : value !== false,
    )
  ) {
    throw new Error("nhm2_spherical_v2_regulator_authority_invariant");
  }
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_CANONICAL_SIZE_BYTES
  ) {
    throw new Error("nhm2_spherical_v2_regulator_literal_seal_drift");
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2RegulatorDefinitionViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON
      ? []
      : ["spherical_v2_regulator_definition_semantic_drift"];
  } catch {
    return ["spherical_v2_regulator_definition_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2RegulatorDefinitionV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2RegulatorDefinitionV1 =>
  nhm2SphericalBosonStarV2RegulatorDefinitionViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2RegulatorDefinition = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2RegulatorDefinitionV1;
