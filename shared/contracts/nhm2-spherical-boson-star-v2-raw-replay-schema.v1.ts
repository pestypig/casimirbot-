import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
} from "./nhm2-semiclassical-v2-constraint-operand-replay.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
} from "./nhm2-spherical-boson-star-v2-classical-structure-functions.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256,
} from "./nhm2-spherical-boson-star-v2-constraint-formulation.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256,
} from "./nhm2-spherical-boson-star-v2-regulator-definition.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256,
} from "./nhm2-spherical-boson-star-v2-operator-ordering.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-counterterms.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
} from "./nhm2-spherical-boson-star-v2-renormalization-prescription.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_raw_replay_schema" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_raw_replay_schema/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_PHASE =
  "stage_2_preexecution_additive_successor_schema" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-raw-replay-schema/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_raw_replay_manifest" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_raw_replay_manifest/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_preexecution_output_skeleton" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS =
  Object.freeze({
    candidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    candidateFreezeCanonicalSizeBytes: 55_997,
    regulatorDefinitionSha256:
      "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade",
    regulatorDefinitionCanonicalSizeBytes: 62_592,
    constraintFormulationSha256:
      "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
    constraintFormulationCanonicalSizeBytes: 11_571,
    classicalStructureFunctionsSha256:
      "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
    classicalStructureFunctionsCanonicalSizeBytes: 8_870,
    renormalizationPrescriptionSha256:
      "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
    renormalizationPrescriptionCanonicalSizeBytes: 10_670,
    renormalizationCountertermsSha256:
      "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa",
    renormalizationCountertermsCanonicalSizeBytes: 10_182,
    operatorOrderingSha256:
      "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e",
    operatorOrderingCanonicalSizeBytes: 17_662,
    approvedReplayPolicySha256:
      "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00",
    approvedReplayPolicyCanonicalSizeBytes: 3_827,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 2_097_152,
  } as const);

const REGULATOR = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const NONCONSTRAINT_FILES =
  REGULATOR.successorOutputInventory.nonconstraintFiles.files;
const CONSTRAINT_FILES =
  REGULATOR.successorOutputInventory.constraintOperandFiles.arrays;
const CENTRAL_ALIASES =
  REGULATOR.successorOutputInventory.centralLevel2LogicalAliases.aliases;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS =
  Object.freeze(
    [...NONCONSTRAINT_FILES, ...CONSTRAINT_FILES].map((entry) =>
      Object.freeze({ ...entry }),
    ),
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES =
  Object.freeze(
    CENTRAL_ALIASES.map((alias) =>
      Object.freeze({
        ...alias,
        manifestProjectionFields: Object.freeze([
          "legacyLogicalRole",
          "canonicalFileOrdinal",
          "canonicalPath",
          "canonicalSha256",
        ] as const),
        canonicalSha256MustEqualPhysicalFileEntrySha256: true,
      }),
    ),
  );

const NONNEGATIVE_OUTPUT_FILE_BINDINGS = Object.freeze(
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.filter(
    (entry) =>
      entry.role === "noise_kernel_absolute_uncertainty95" ||
      entry.role === "mean_rset_absolute_uncertainty95" ||
      entry.role === "smearing_weights" ||
      ("operandRole" in entry &&
        entry.operandRole === "absolute_uncertainty95"),
  ).map((entry) =>
    Object.freeze({
      physicalFileOrdinal: entry.fileOrdinal,
      role: entry.role,
      path: entry.path,
      rule: "every_decoded_value_greater_than_or_equal_to_zero" as const,
    }),
  ),
);

type ConstraintFamilyId = (typeof REGULATOR.familyOrder)[number];
type ConstraintLevel = (typeof REGULATOR.levels)[number];

const fileFor = (
  level: ConstraintLevel,
  familyId: ConstraintFamilyId,
  operandRole: string,
) => {
  const entry = CONSTRAINT_FILES.find(
    (candidate) =>
      candidate.levelId === level.levelId &&
      candidate.familyId === familyId &&
      candidate.operandRole === operandRole,
  );
  if (entry == null) {
    throw new Error(
      `spherical_v2_raw_schema_operand_missing:${level.levelId}:${familyId}:${operandRole}`,
    );
  }
  return entry;
};

const EXACT_RESIDUAL_FORMULA_SOURCE_ROLE_ORDER = Object.freeze({
  H_H: Object.freeze(["computed", "target"] as const),
  H_Hi: Object.freeze(["computed", "target"] as const),
  Hi_Hj: Object.freeze(["computed", "target"] as const),
  antisymmetry: Object.freeze(["forward", "reverse"] as const),
  jacobi: Object.freeze(["term_1", "term_2", "term_3"] as const),
});

const makeResidualRecomputationMap = () =>
  REGULATOR.levels.flatMap((level) =>
    REGULATOR.familyOrder.map((familyId) => {
      const operandRoles = REGULATOR.operandRoleOrder[familyId];
      const formulaSourceRoles =
        EXACT_RESIDUAL_FORMULA_SOURCE_ROLE_ORDER[familyId];
      return Object.freeze({
        mappingId: `${level.levelId}.${familyId}`,
        levelOrdinal: level.ordinal,
        levelId: level.levelId,
        hExact: level.hExact,
        familyId,
        exactOperandRoleOrder: Object.freeze([...operandRoles]),
        exactPrimitiveFilesByRole: Object.freeze(
          operandRoles.map((operandRole) => {
            const file = fileFor(level, familyId, operandRole);
            return Object.freeze({
              operandRole,
              physicalFileOrdinal: file.fileOrdinal,
              canonicalRole: file.role,
              canonicalPath: file.path,
              sha256ReadFromSuccessorManifestEntry: true,
              serverRehashRequiredBeforeDecode: true,
            });
          }),
        ),
        formulaSourcesInOrder: Object.freeze(
          formulaSourceRoles.map((formulaRole, formulaInputOrdinal) => {
            const submittedFile = fileFor(level, familyId, formulaRole);
            const serverRecomputedClassicalTarget = formulaRole === "target";
            return Object.freeze({
              formulaInputOrdinal,
              formulaRole,
              authoritativeValueOrigin: serverRecomputedClassicalTarget
                ? ("server_recomputed_from_frozen_classical_structure_functions" as const)
                : ("persisted_raw_operand_bytes_after_server_rehash_and_decode" as const),
              submittedPhysicalFileOrdinal: submittedFile.fileOrdinal,
              submittedCanonicalRole: submittedFile.role,
              submittedCanonicalPath: submittedFile.path,
              submittedBytesUse: serverRecomputedClassicalTarget
                ? ("consistency_echo_only_never_formula_or_convergence_authority" as const)
                : ("authoritative_formula_input_only_after_server_byte_admission" as const),
              submittedBytesAuthoritative: !serverRecomputedClassicalTarget,
              serverRecomputationRequired: serverRecomputedClassicalTarget,
              serverRecomputationBinding: serverRecomputedClassicalTarget
                ? NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING
                : null,
              resolvedValueIsAuthoritativeFormulaInput: true,
            });
          }),
        ),
        submittedResidualRole: "residual",
        uncertaintyRole: "absolute_uncertainty95",
        uncertaintyUsedAsResidualFormulaOperand: false,
        submittedResidualUse:
          "consistency_check_only_never_residual_or_convergence_authority",
        serverResidualFormula:
          NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS[familyId],
        targetPolicy:
          familyId === "H_H" || familyId === "H_Hi" || familyId === "Hi_Hj"
            ? Object.freeze({
                targetFileRole: "target",
                authoritativeTargetOrigin:
                  "server_recomputed_from_frozen_classical_structure_functions",
                serverMustRecomputeTargetFromFrozenClassicalStructureFunctions: true,
                submittedTargetUse:
                  "consistency_echo_only_never_formula_or_convergence_authority",
                submittedTargetMustMatchServerRecomputedTargetWithinFrozenTolerance: true,
                submittedTargetAuthoritative: false,
                suppliedTargetBytesAloneEstablishDerivation: false,
              })
            : Object.freeze({
                targetFileRole: null,
                authoritativeTargetOrigin: null,
                serverMustRecomputeTargetFromFrozenClassicalStructureFunctions: false,
                submittedTargetUse: null,
                submittedTargetMustMatchServerRecomputedTargetWithinFrozenTolerance: false,
                submittedTargetAuthoritative: false,
                suppliedTargetBytesAloneEstablishDerivation: false,
              }),
        resultDerivationsInOrder: Object.freeze([
          "decode_every_exact_primitive_file_after_size_hash_finiteness_and_negative_zero_checks",
          "recompute_server_classical_targets_for_bracket_families_before_residual",
          "compare_submitted_target_echo_to_server_target_and_fail_on_frozen_tolerance",
          "recompute_server_residual_elementwise_from_typed_formula_sources",
          "compute_submitted_residual_mismatch_linf_against_residual_echo",
          "reject_if_mismatch_exceeds_frozen_float64_recompute_absolute_tolerance",
          "compute_central_or_interlevel_upper95_only_from_server_residual_and_absolute_uncertainty95",
        ] as const),
      });
    }),
  );

const RESIDUAL_RECOMPUTATION_MAP = Object.freeze(
  makeResidualRecomputationMap(),
);

const makeConvergenceRecomputationMap = () =>
  REGULATOR.familyOrder.map((familyId) =>
    Object.freeze({
      familyId,
      familyAggregation: "none",
      exactLevelInputs: Object.freeze(
        REGULATOR.levels.map((level) => {
          const residual = fileFor(level, familyId, "residual");
          const uncertainty = fileFor(
            level,
            familyId,
            "absolute_uncertainty95",
          );
          return Object.freeze({
            levelOrdinal: level.ordinal,
            levelId: level.levelId,
            hExact: level.hExact,
            residualSource:
              "server_recomputed_residual_not_submitted_residual_bytes",
            submittedResidualEchoPath: residual.path,
            absoluteUncertainty95Path: uncertainty.path,
          });
        }),
      ),
      formulas: REGULATOR.convergence,
      everyPrimitiveAndDerivedValueFiniteBeforeComparison: true,
      nonfiniteOrOverflowDisposition: "fail_candidate_before_family_pass",
      resultUse: "diagnostic_replay_gate_only",
    }),
  );

const CONVERGENCE_RECOMPUTATION_MAP = Object.freeze(
  makeConvergenceRecomputationMap(),
);

const PROPAGATED_OPERATOR_ORDERING_BLOCKERS = Object.freeze(
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS.map(
    (blocker) => `operator_ordering:${blocker}` as const,
  ),
);

const SCIENCE_INPUT_COMPLETENESS_BLOCKERS = Object.freeze([
  ...PROPAGATED_OPERATOR_ORDERING_BLOCKERS,
  "natural_units_to_si_j_per_m3_conversion_constants_and_uncertainty_graph_absent",
  "scientific_candidate_manifest_preseal_implementations_and_runtime_absent",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_AUTHORITY_LOCKS =
  Object.freeze({
    outputArraysPresent: false as const,
    outputArrayReceipt: null,
    primaryImplementationPresent: false as const,
    primaryImplementationBinding: null,
    independentImplementationPresent: false as const,
    independentImplementationBinding: null,
    runtimeBound: false as const,
    runtimeBinding: null,
    scientificPresealPresent: false as const,
    scientificPresealReceipt: null,
    staticInputClosureComplete: false as const,
    staticInputClosureReceipt: null,
    executionAuthorized: false as const,
    executionObserved: false as const,
    executionReceipt: null,
    replayPerformed: false as const,
    replayReceipt: null,
    independentAgreement: false as const,
    independentAgreementReceipt: null,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_PHASE,
  authority: "canonical_successor_schema_only_no_runtime_or_result_authority",
  maturity:
    "stage_2_candidate_specific_raw_replay_schema_no_runtime_or_numeric_evidence",
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    candidateManifestId: FREEZE.candidateIdentity.candidateManifestId,
    selectedProfileId: FREEZE.candidateIdentity.selectedProfileId,
    geometryId: FREEZE.candidateIdentity.geometryId,
    quantumStateId: FREEZE.candidateIdentity.quantumStateId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    samplingBasisId: FREEZE.candidateIdentity.samplingBasisId,
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  exactBindings: {
    candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    regulatorDefinition:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
    constraintFormulation:
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
    classicalStructureFunctions:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
    renormalizationPrescription:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
    renormalizationCounterterms:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
    approvedV2ReplayPolicy:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    operatorOrdering: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
  },
  scienceInputCompleteness: {
    operatorOrderingRequiredInputId: "operator_ordering",
    operatorOrderingArtifactStatus: {
      exactBinding: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
      canonicalArtifactPresent: true,
      deterministicSymbolicCallOrderFrozen:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .deterministicSymbolicCallOrderFrozen,
      pointSplitInsertionOrderFrozen:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .pointSplitInsertionOrderFrozen,
      regulatorChronologyFrozen:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .regulatorChronologyFrozen,
      sourceAndDerivationClosureComplete:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .sourceAndDerivationClosureComplete,
      executableNumericalOrderingComplete:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .executableNumericalOrderingComplete,
      anomalyAnalysisComplete:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .anomalyAnalysisComplete,
      scientificInputComplete:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .scientificInputComplete,
      candidateExecutionMayStart:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.completion
          .candidateExecutionMayStart,
      propagatedBlockers:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS,
      exactBindingHashPresenceSatisfiesScientificCompleteness: false,
      exactBindingHashPresenceSatisfiesExecutionAdmission: false,
      allPropagatedBlockersMustBeClearedByANewExactBoundArtifact: true,
      complete: false,
    },
    normalizationConversionDependency: {
      parentScientificInputId: "normalization",
      requirementId:
        "natural_units_to_si_j_per_m3_conversion_constants_and_uncertainty_graph",
      exactCanonicalBinding: null,
      constantsEdition: null,
      exactConstantsAndUnits: null,
      naturalUnitsToJPerM3FormulaGraph: null,
      naturalUnitsSquaredToJPerM3SquaredFormulaGraph: null,
      roundingModeAndOperationOrder: null,
      uncertaintyPropagationGraph: null,
      present: false,
      complete: false,
      normalizationIdAloneSatisfiesRequirement: false,
      requiredBeforeScientificPreseal: true,
      requiredBeforeExecutionAdmission: true,
    },
    allOtherSchemaSpecificBindingPinsPresent: true,
    bindingPinPresenceDoesNotImplyScientificCompleteness: true,
    staticScientificInputClosureComplete: false,
    successorManifestMayBePresealed: false,
    executionMayBeAdmitted: false,
    blockers: SCIENCE_INPUT_COMPLETENESS_BLOCKERS,
  },
  additiveSuccessor: {
    relation: "additive_successor_without_legacy_manifest_mutation",
    preexecutionOutputSkeleton: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
      lifecycleRole:
        "hashless_output_plan_frozen_and_server_persisted_before_scientific_preseal_and_execution",
    },
    successorManifest: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      lifecycleRole:
        "hash_bearing_postrun_observation_generated_only_after_execution_and_file_observation",
    },
    legacyAggregateManifest: {
      artifactId: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      sourceMutated: false,
      acceptedAsSuccessorManifest: false,
      structurallyCompatible: false,
      incompatibility:
        "legacy_central_aggregate_constraint_and_generic_regulator_summary_layout_cannot_identify_all_3x21_unique_level_family_operand_files",
      reinterpretLegacyAggregateFilesAsPrimitiveFilesAllowed: false,
      migrationWithoutFreshExecutionAllowed: false,
    },
    regulatorInventoryIntegratedIntoSuccessorSchema: true,
    schemaDefinitionCompleteForTheFrozenRegulatorInventory: true,
    integrationGrantsExecutionOrReplayAuthority: false,
  },
  successorArtifactLifecycle: {
    preexecutionOutputSkeletonShape: {
      exactRootFieldOrder: Object.freeze([
        "artifactId",
        "contractVersion",
        "skeletonFrozenAt",
        "candidate",
        "sourceProvenance",
        "numericalPolicyBinding",
        "implementation",
        "staticInputClosure",
        "plannedPhysicalFiles",
        "centralLevel2LogicalAliases",
        "claimLocks",
      ] as const),
      exactArtifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
      exactContractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
      unknownFieldsAllowed: false,
      exactPlannedPhysicalFileCount: 68,
      plannedPhysicalFilesUseOnlyFrozenSchemaDescriptors: true,
      expectedSizeBytesFromFrozenDescriptorRequired: true,
      outputSha256FreshnessObservedAtOrExecutionReceiptFieldsAllowed: false,
      frozenAndServerPersistedBeforeScientificPreseal: true,
      frozenAndServerPersistedBeforeExecution: true,
      scientificPresealMustBindExactSkeletonSha256AndSize: true,
      skeletonMayBeCompletedFromPostrunObservationsInPlace: false,
    },
    postrunHashManifestShape: {
      exactRootFieldOrder: Object.freeze([
        "artifactId",
        "contractVersion",
        "generatedAt",
        "preexecutionSkeletonBinding",
        "scientificPresealBinding",
        "candidate",
        "sourceProvenance",
        "numericalPolicyBinding",
        "implementation",
        "execution",
        "staticInputClosure",
        "physicalFiles",
        "centralLevel2LogicalAliases",
        "claimLocks",
      ] as const),
      exactArtifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
      exactContractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      unknownFieldsAllowed: false,
      exactPhysicalFileCount: 68,
      everyPhysicalFileEntryCarriesObservedSha256SizeFreshnessAndObservedAt: true,
      generatedOnlyAfterExecutionCompletionAndEveryFileObservation: true,
      generatedAtNotEarlierThanEveryObservedAtAndExecutionCompletedAt: true,
      bindsExactPreexecutionSkeletonSha256AndSize: true,
      bindsExactPersistedScientificPresealSha256AndSize: true,
      mayBeFrozenOrUsedAsInputBeforeItsPostrunGeneration: false,
      mayReplaceOrMutateThePreexecutionSkeleton: false,
    },
    chronology: {
      exactBoundaryOrder: Object.freeze([
        "persist_hashless_preexecution_output_skeleton",
        "persist_scientific_preseal_binding_the_skeleton",
        "admit_and_start_execution",
        "complete_execution",
        "observe_and_rehash_every_output_file",
        "generate_hash_bearing_postrun_manifest",
      ] as const),
      preexecutionAndPostrunArtifactsMustHaveDistinctArtifactIds: true,
      preexecutionAndPostrunArtifactsMustHaveDistinctContractVersions: true,
      postrunManifestCannotBeAnInputToItsOwnScientificPreseal: true,
      onlyPreexecutionSkeletonBindingMayAppearInScientificPreseal: true,
      scientificPresealOrExecutionBeforeDurableSkeletonPersistenceAllowed: false,
      outputObservationOrPostrunManifestGenerationBeforeExecutionCompletionAllowed: false,
    },
  },
  provenanceSchema: {
    sourceProvenance: {
      exactFields: Object.freeze([
        "sourceMode",
        "meanRsetOrigin",
        "noiseKernelOrigin",
        "declaredLeverTensorUsed",
        "inputClosureExcludesDeclaredLeverTensor",
      ] as const),
      sourceMode: "state_derived_not_declared_lever",
      meanRsetOrigin: "renormalized_quantum_state_expectation_value",
      noiseKernelOrigin:
        "connected_symmetrized_quantum_state_two_point_function",
      declaredLeverTensorUsed: false,
      inputClosureExcludesDeclaredLeverTensor: true,
    },
    execution: {
      exactFieldOrder: Object.freeze([
        "commitSha",
        "command",
        "argv",
        "workingDirectory",
        "outputDirectory",
        "startedAt",
        "completedAt",
        "durationMs",
        "exitCode",
        "terminationSignal",
      ] as const),
      commitSha: "lowercase_hex_40_or_64_exactly_rehashed_source_commit",
      command: "nonempty_exact_display_command",
      argv: "nonempty_exact_argument_vector_no_shell_reconstruction",
      timestamps: "strict_utc_rfc3339_with_calendar_validity",
      duration: "durationMs_equals_completedAt_minus_startedAt_exactly",
      successfulExitCode: 0,
      terminationSignal: null,
      dirtyTreeExecutionAllowed: false,
      serverMustVerifyCommitCommandTimingAndExecutableHash: true,
    },
    fileHashAndFreshness: {
      hashAlgorithm: "sha256",
      hashEncoding: "lowercase_hex",
      hashScope: "exact_raw_file_bytes",
      exactSizeVerifiedBeforeDecode: true,
      serverRehashEveryFileBeforeDecode: true,
      outputFreshnessLiteral: "new",
      outputObservedAtInterval:
        "completedAt_less_than_or_equal_to_observedAt_less_than_or_equal_to_generatedAt",
      serverMustVerifyRunSpecificNewnessUsingPreexecutionAbsenceInventory: true,
      producerFreshnessClassificationAuthoritative: false,
    },
  },
  staticInputClosureSchema: {
    closureMustBeFrozenAndServerPersistedBeforeExecution: true,
    preexecutionOutputSkeletonBindingRequired: true,
    preexecutionOutputSkeletonBindingPresentInThisSchemaArtifact: false,
    preexecutionOutputSkeletonReceipt: null,
    scientificPresealBindingRequired: true,
    scientificPresealBindingPresentInThisSchemaArtifact: false,
    scientificPresealReceipt: null,
    exactScientificInputIdOrder: Object.freeze([
      ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
    ]),
    exactImplementationInputIdOrder: Object.freeze([
      ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS,
    ]),
    exactForbiddenInputIdOrder: Object.freeze([
      ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
    ]),
    closureAlgorithm: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM,
    closureOrdering: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING,
    inputEntryExactFields: Object.freeze([
      "inputId",
      "path",
      "sha256",
      "sizeBytes",
      "mediaType",
      "freshness",
      "observedAt",
    ] as const),
    inputFreshnessLiteral: "preexisting_unchanged",
    inputObservedStrictlyBeforeExecutionStart: true,
    everyInputPathInsideItsDeclaredReadOnlyRoot: true,
    everyInputRehashedImmediatelyBeforeExecution: true,
    rootsDisjointByPortablePathRealpathAndFilesystemIdentity: true,
    excludedDeclaredLeverInputsMayNotAppear: true,
    requiredExactPinnedInputBindings: Object.freeze([
      "candidate_manifest",
      "tolerance_policy",
      "renormalization_prescription",
      "renormalization_counterterms",
      "constraint_formulation",
      "regulator_definition",
      "operator_ordering",
      "classical_structure_functions",
    ] as const),
    normalizationInputContentRequirements: {
      normalizationIdAcceptedWithoutCanonicalContentGraph: false,
      exactConversionConstantsAndUncertaintyGraphBindingRequired: true,
      requirementId:
        "natural_units_to_si_j_per_m3_conversion_constants_and_uncertainty_graph",
      exactBinding: null,
      requiredOutputUnitsInOrder: Object.freeze([
        "J/m^3",
        "(J/m^3)^2",
      ] as const),
      requiredContentInOrder: Object.freeze([
        "constants_edition_and_exact_constant_values_with_units",
        "natural_units_to_J_per_m3_formula_graph",
        "natural_units_squared_to_J_per_m3_squared_formula_graph",
        "binary64_rounding_mode_and_operation_order",
        "correlated_uncertainty_propagation_graph",
      ] as const),
      complete: false,
    },
    operatorOrderingInputRequirements: {
      exactBinding: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
      canonicalArtifactPresent: true,
      propagatedBlockers:
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS,
      sourceAndDerivationClosureComplete: false,
      executableNumericalOrderingComplete: false,
      anomalyAnalysisComplete: false,
      scientificInputComplete: false,
      bindingHashPresenceSatisfiesClosure: false,
      bindingHashPresenceSatisfiesExecutionAdmission: false,
      complete: false,
    },
    exactCandidateSpecificPins: {
      candidateFreezeSchemaSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.candidateFreezeSha256,
      candidateManifestSha256: null,
      tolerancePolicySha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.approvedReplayPolicySha256,
      renormalizationPrescriptionSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.renormalizationPrescriptionSha256,
      renormalizationCountertermsSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.renormalizationCountertermsSha256,
      constraintFormulationSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.constraintFormulationSha256,
      regulatorDefinitionSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.regulatorDefinitionSha256,
      operatorOrderingSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.operatorOrderingSha256,
      classicalStructureFunctionsSha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS.classicalStructureFunctionsSha256,
    },
    closureComplete: false,
  },
  implementationPairSchema: {
    exactRoleOrder: Object.freeze(["primary", "independent"] as const),
    sameFrozenScientificRootAndScientificClosureSha256Required: true,
    separateImplementationRootsRequired: true,
    separateOutputRootsRequired: true,
    implementationAndOutputRootsPairwiseDisjointByPortablePathRealpathAndFilesystemIdentity: true,
    counterpartOutputsMounted: false,
    ambientRepositoryMounted: false,
    exactIdentityInputsPerRole: Object.freeze([
      "implementation_source",
      "dependency_lock",
      "executable",
    ] as const),
    sourceDependencyAndExecutableHashesMustDifferAcrossRoles: true,
    independentlyAuthoredNumericalPathRequired: true,
    sharedWrapperKernelOrDerivedArrayCodeAllowed: false,
    implementationBindingsPresent: false,
    pairRuntimeBinding: null,
  },
  exactRawOutputInventory: {
    ordering:
      "fileOrdinal_0_to_67_five_fixed_nonconstraint_then_level_family_operand",
    exactUniquePhysicalFileCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
    exactNonconstraintFileCount: 5,
    exactConstraintPrimitiveFileCount: 63,
    physicalFileEntryExactFields: Object.freeze([
      "fileOrdinal",
      "role",
      "path",
      "sha256",
      "sizeBytes",
      "freshness",
      "observedAt",
      "dtype",
      "binaryEncoding",
      "endianness",
      "shape",
      "storageOrder",
      "componentOrder",
      "sampleOrder",
      "unit",
      "mediaType",
      "finiteValuesRequired",
      "negativeZeroAllowed",
    ] as const),
    descriptors:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
    pathMaterializationRules: {
      descriptorPrefix: "{outputDirectory}/",
      runtimePathFormula:
        "execution.outputDirectory+'/'+descriptor.path_after_exact_{outputDirectory}/_prefix",
      portableForwardSlashRelativePathsOnly: true,
      emptyDotDotDotSegmentsAndBackslashesAllowed: false,
      runtimePathMustRemainInsideOutputRootAfterRealpath: true,
      symlinkJunctionOrReparsePointTraversalAllowed: false,
      runtimeFileOrdinalRoleAndPathMustExactlyMatchDescriptor: true,
    },
    representationRules: {
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      storageOrder: "row-major",
      finiteValuesRequired: true,
      negativeZeroAllowed: false,
      byteTraversal:
        "file_offset_major_decode_exactly_shape_product_binary64_words",
      trailingBytesAllowed: false,
      duplicatePhysicalPathsForDistinctOrdinalsAllowed: false,
      duplicateRolesOrOrdinalsAllowed: false,
      identicalContentHashesAcrossDistinctPhysicalFilesAllowed: true,
      identicalContentHashDoesNotCreateAnAliasOrRemoveAFile: true,
    },
    centralLevel2LogicalAliases: {
      exactAliasCount: 21,
      aliases:
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
      additionalPhysicalFiles: 0,
      aliasPathsMustEqualCanonicalLevel2Paths: true,
      aliasHashesMustEqualCanonicalLevel2Hashes: true,
      aliasDecodeCreatesSecondArray: false,
    },
    manifestEntriesOrBytesPresent: false,
  },
  serverRecomputation: {
    primitiveDecodePolicy: {
      decodeAll68UniquePhysicalFilesExactlyOnce: true,
      verifyExactPathOrdinalRoleShapeEncodingSizeHashFreshnessBeforeDecode: true,
      rejectAnyNonfiniteDecodedValue: true,
      rejectAnyNegativeZeroDecodedValue: true,
      producerSummariesAuthoritative: false,
      derivedOnlySubmissionAllowed: false,
      admissionChecksInOrder: Object.freeze([
        "finiteness",
        "negativeZeroExclusion",
        "roleSensitiveNonnegativity",
      ] as const),
      roleSensitiveNonnegativeAdmission: {
        outputPhysicalFilesInOrdinalOrder: NONNEGATIVE_OUTPUT_FILE_BINDINGS,
        exactOutputPhysicalFileCount: 18,
        constraintAbsoluteUncertainty95FileCount: 15,
        nonconstraintAbsoluteUncertainty95FileCount: 2,
        smearingWeightFileCount: 1,
        staticInputIdsInCheckOrder: Object.freeze([
          "metric_demand_absolute_error_bound",
        ] as const),
        everyAbsoluteUncertainty95ValueMustBeGreaterThanOrEqualToZero: true,
        everyMetricDemandAbsoluteErrorBoundValueMustBeGreaterThanOrEqualToZero: true,
        everySmearingWeightMustBeGreaterThanOrEqualToZero: true,
        negativeValueDisposition: "fail_candidate_before_any_derived_gate",
        smearingNormalizationStillRecomputedSeparately: true,
      },
    },
    exactResidualMappingCount: 15,
    exactResidualFormulaInputRoleOrder:
      EXACT_RESIDUAL_FORMULA_SOURCE_ROLE_ORDER,
    formulaSourceEntriesAreTypedByAuthoritativeValueOrigin: true,
    submittedClassicalTargetBytesAreConsistencyOnlyNeverAuthority: true,
    residualMappings: RESIDUAL_RECOMPUTATION_MAP,
    exactConvergenceMappingCount: 5,
    convergenceMappings: CONVERGENCE_RECOMPUTATION_MAP,
    requiredNoiseAndMeanChecksInOrder: Object.freeze([
      ...FREEZE.replayAndAgreementDuty.requiredChecksInOrder.slice(1, 9),
    ] as const),
    requiredConstraintChecksInOrder: Object.freeze([
      "all_H_H_residuals_at_all_three_levels",
      "all_H_Hi_residuals_at_all_three_levels",
      "all_Hi_Hj_residuals_at_all_three_levels",
      "all_antisymmetry_residuals_at_all_three_levels",
      "all_jacobi_residuals_at_all_three_levels",
      "submitted_residual_echo_consistency",
      "per_family_regulator_convergence_without_aggregation",
    ] as const),
    independentServerRecomputeMustReadOnlyPersistedRawBytes: true,
    producerDerivedResultsMayNotReplaceAnyRequiredRecomputation: true,
    recomputationImplementationPresent: false,
    recomputationReceipt: null,
  },
  frozenFailurePolicy: {
    geometryStateChartNormalizationToleranceAndInventoryFrozenBeforeExecution: true,
    anyFrozenLimitExceeded:
      "fail_this_v2_candidate_without_retuning_or_relabeling",
    postObservationToleranceChangeAllowed: false,
    postObservationRegulatorGridChangeAllowed: false,
    postObservationFamilyFormulaOrOperandChangeAllowed: false,
    discardAndRerunUnderChangedInputsAsSameCandidateAllowed: false,
    diagnosticFailureMayUnlockPhysicalClaims: false,
  },
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2RawReplaySchemaV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA);
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256 =
  "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES =
  163_818 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES,
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
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS;
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
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.candidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.candidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256 !==
      pins.regulatorDefinitionSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES !==
      pins.regulatorDefinitionCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256 !==
      pins.constraintFormulationSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES !==
      pins.constraintFormulationCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256 !==
      pins.classicalStructureFunctionsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES !==
      pins.classicalStructureFunctionsCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256 !==
      pins.renormalizationPrescriptionSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES !==
      pins.renormalizationPrescriptionCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256 !==
      pins.renormalizationCountertermsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES !==
      pins.renormalizationCountertermsCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256 !==
      pins.operatorOrderingSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES !==
      pins.operatorOrderingCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256 !==
      pins.approvedReplayPolicySha256 ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES !==
      pins.approvedReplayPolicyCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.artifactId !==
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.contractVersion !==
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.policyId !==
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID
  ) {
    throw new Error("spherical_v2_raw_replay_schema_dependency_pin_drift");
  }

  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
  const files = contract.exactRawOutputInventory.descriptors;
  const aliases =
    contract.exactRawOutputInventory.centralLevel2LogicalAliases.aliases;
  const centralFiles = files.filter(
    (entry) => "levelId" in entry && entry.levelId === "level_2",
  );
  const paths = files.map((entry) => entry.path.toLocaleLowerCase("en-US"));
  const roles = files.map((entry) => entry.role);
  if (
    files.length !== 68 ||
    files.some((entry, index) => entry.fileOrdinal !== index) ||
    new Set(paths).size !== 68 ||
    new Set(roles).size !== 68 ||
    files.some(
      (entry) =>
        entry.dtype !== "float64" ||
        entry.binaryEncoding !== "raw_ieee754" ||
        entry.endianness !== "little" ||
        entry.storageOrder !== "row-major" ||
        entry.finiteValuesRequired !== true ||
        entry.negativeZeroAllowed !== false,
    ) ||
    aliases.length !== 21 ||
    centralFiles.length !== 21 ||
    aliases.some(
      (alias, index) =>
        alias.additionalPhysicalFile !== false ||
        alias.canonicalFileOrdinal !== centralFiles[index].fileOrdinal ||
        alias.canonicalPath !== centralFiles[index].path ||
        alias.canonicalRole !== centralFiles[index].role ||
        alias.pathEqualityRequired !== true ||
        alias.sha256EqualityRequired !== true ||
        alias.canonicalSha256MustEqualPhysicalFileEntrySha256 !== true,
    ) ||
    contract.serverRecomputation.residualMappings.length !== 15 ||
    contract.serverRecomputation.convergenceMappings.length !== 5 ||
    JSON.stringify(
      contract.serverRecomputation.requiredNoiseAndMeanChecksInOrder,
    ) !==
      JSON.stringify(
        FREEZE.replayAndAgreementDuty.requiredChecksInOrder.slice(1, 9),
      ) ||
    JSON.stringify(
      contract.serverRecomputation.primitiveDecodePolicy.admissionChecksInOrder,
    ) !==
      JSON.stringify([
        "finiteness",
        "negativeZeroExclusion",
        "roleSensitiveNonnegativity",
      ]) ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission.outputPhysicalFilesInOrdinalOrder
      .length !== 18 ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission
      .constraintAbsoluteUncertainty95FileCount !== 15 ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission
      .nonconstraintAbsoluteUncertainty95FileCount !== 2 ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission.smearingWeightFileCount !== 1 ||
    JSON.stringify(
      contract.serverRecomputation.primitiveDecodePolicy
        .roleSensitiveNonnegativeAdmission.staticInputIdsInCheckOrder,
    ) !== JSON.stringify(["metric_demand_absolute_error_bound"]) ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission
      .everyAbsoluteUncertainty95ValueMustBeGreaterThanOrEqualToZero !== true ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission
      .everyMetricDemandAbsoluteErrorBoundValueMustBeGreaterThanOrEqualToZero !==
      true ||
    contract.serverRecomputation.primitiveDecodePolicy
      .roleSensitiveNonnegativeAdmission
      .everySmearingWeightMustBeGreaterThanOrEqualToZero !== true ||
    contract.serverRecomputation.primitiveDecodePolicy.roleSensitiveNonnegativeAdmission.outputPhysicalFilesInOrdinalOrder.some(
      (entry, index) =>
        entry !== NONNEGATIVE_OUTPUT_FILE_BINDINGS[index] ||
        entry.rule !== "every_decoded_value_greater_than_or_equal_to_zero",
    ) ||
    contract.serverRecomputation.residualMappings.some(
      (mapping) =>
        mapping.exactPrimitiveFilesByRole.length !==
          REGULATOR.operandRoleOrder[mapping.familyId].length ||
        mapping.serverResidualFormula !==
          NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS[
            mapping.familyId
          ] ||
        mapping.formulaSourcesInOrder.length !==
          EXACT_RESIDUAL_FORMULA_SOURCE_ROLE_ORDER[mapping.familyId].length ||
        mapping.formulaSourcesInOrder.some((source, index) => {
          const expectedRole =
            EXACT_RESIDUAL_FORMULA_SOURCE_ROLE_ORDER[mapping.familyId][index];
          const submittedFile = fileFor(
            REGULATOR.levels[mapping.levelOrdinal],
            mapping.familyId,
            expectedRole,
          );
          const target = expectedRole === "target";
          return (
            source.formulaInputOrdinal !== index ||
            source.formulaRole !== expectedRole ||
            source.submittedPhysicalFileOrdinal !== submittedFile.fileOrdinal ||
            source.submittedCanonicalRole !== submittedFile.role ||
            source.submittedCanonicalPath !== submittedFile.path ||
            source.authoritativeValueOrigin !==
              (target
                ? "server_recomputed_from_frozen_classical_structure_functions"
                : "persisted_raw_operand_bytes_after_server_rehash_and_decode") ||
            source.submittedBytesUse !==
              (target
                ? "consistency_echo_only_never_formula_or_convergence_authority"
                : "authoritative_formula_input_only_after_server_byte_admission") ||
            source.submittedBytesAuthoritative !== !target ||
            source.serverRecomputationRequired !== target ||
            source.serverRecomputationBinding !==
              (target
                ? NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING
                : null) ||
            source.resolvedValueIsAuthoritativeFormulaInput !== true
          );
        }) ||
        mapping.uncertaintyRole !== "absolute_uncertainty95" ||
        mapping.uncertaintyUsedAsResidualFormulaOperand !== false ||
        mapping.targetPolicy.submittedTargetAuthoritative !== false ||
        (mapping.familyId === "H_H" ||
        mapping.familyId === "H_Hi" ||
        mapping.familyId === "Hi_Hj"
          ? mapping.targetPolicy.authoritativeTargetOrigin !==
              "server_recomputed_from_frozen_classical_structure_functions" ||
            mapping.targetPolicy
              .serverMustRecomputeTargetFromFrozenClassicalStructureFunctions !==
              true ||
            mapping.targetPolicy.submittedTargetUse !==
              "consistency_echo_only_never_formula_or_convergence_authority" ||
            mapping.targetPolicy
              .submittedTargetMustMatchServerRecomputedTargetWithinFrozenTolerance !==
              true
          : mapping.targetPolicy.authoritativeTargetOrigin !== null ||
            mapping.targetPolicy
              .serverMustRecomputeTargetFromFrozenClassicalStructureFunctions !==
              false ||
            mapping.targetPolicy.submittedTargetUse !== null ||
            mapping.targetPolicy
              .submittedTargetMustMatchServerRecomputedTargetWithinFrozenTolerance !==
              false),
    ) ||
    contract.additiveSuccessor.legacyAggregateManifest.sourceMutated !==
      false ||
    contract.additiveSuccessor.legacyAggregateManifest
      .structurallyCompatible !== false ||
    contract.additiveSuccessor.preexecutionOutputSkeleton.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID ||
    contract.additiveSuccessor.preexecutionOutputSkeleton.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION ||
    contract.additiveSuccessor.successorManifest.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID ||
    contract.successorArtifactLifecycle.preexecutionOutputSkeletonShape
      .expectedSizeBytesFromFrozenDescriptorRequired !== true ||
    contract.successorArtifactLifecycle.preexecutionOutputSkeletonShape
      .outputSha256FreshnessObservedAtOrExecutionReceiptFieldsAllowed !==
      false ||
    contract.successorArtifactLifecycle.preexecutionOutputSkeletonShape
      .frozenAndServerPersistedBeforeScientificPreseal !== true ||
    contract.successorArtifactLifecycle.preexecutionOutputSkeletonShape
      .scientificPresealMustBindExactSkeletonSha256AndSize !== true ||
    contract.successorArtifactLifecycle.postrunHashManifestShape
      .generatedOnlyAfterExecutionCompletionAndEveryFileObservation !== true ||
    contract.successorArtifactLifecycle.postrunHashManifestShape
      .mayBeFrozenOrUsedAsInputBeforeItsPostrunGeneration !== false ||
    contract.successorArtifactLifecycle.postrunHashManifestShape
      .mayReplaceOrMutateThePreexecutionSkeleton !== false ||
    contract.successorArtifactLifecycle.chronology
      .postrunManifestCannotBeAnInputToItsOwnScientificPreseal !== true ||
    contract.successorArtifactLifecycle.chronology
      .preexecutionAndPostrunArtifactsMustHaveDistinctArtifactIds !== true ||
    contract.successorArtifactLifecycle.chronology
      .preexecutionAndPostrunArtifactsMustHaveDistinctContractVersions !==
      true ||
    contract.successorArtifactLifecycle.chronology
      .scientificPresealOrExecutionBeforeDurableSkeletonPersistenceAllowed !==
      false ||
    contract.provenanceSchema.sourceProvenance.meanRsetOrigin !==
      FREEZE.sourceProvenance.meanRsetOrigin ||
    contract.provenanceSchema.sourceProvenance.noiseKernelOrigin !==
      FREEZE.sourceProvenance.noiseKernelOrigin ||
    contract.exactBindings.operatorOrdering !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .exactBinding !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .canonicalArtifactPresent !== true ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .sourceAndDerivationClosureComplete !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .executableNumericalOrderingComplete !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .anomalyAnalysisComplete !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .scientificInputComplete !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .candidateExecutionMayStart !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .propagatedBlockers !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .exactBindingHashPresenceSatisfiesScientificCompleteness !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .exactBindingHashPresenceSatisfiesExecutionAdmission !== false ||
    contract.scienceInputCompleteness.operatorOrderingArtifactStatus
      .complete !== false ||
    contract.scienceInputCompleteness.normalizationConversionDependency
      .exactCanonicalBinding !== null ||
    contract.scienceInputCompleteness.normalizationConversionDependency
      .normalizationIdAloneSatisfiesRequirement !== false ||
    contract.scienceInputCompleteness.normalizationConversionDependency
      .complete !== false ||
    contract.scienceInputCompleteness.blockers !==
      SCIENCE_INPUT_COMPLETENESS_BLOCKERS ||
    contract.scienceInputCompleteness.staticScientificInputClosureComplete !==
      false ||
    contract.staticInputClosureSchema.closureComplete !== false ||
    contract.staticInputClosureSchema.normalizationInputContentRequirements
      .exactBinding !== null ||
    contract.staticInputClosureSchema.normalizationInputContentRequirements
      .normalizationIdAcceptedWithoutCanonicalContentGraph !== false ||
    contract.staticInputClosureSchema.normalizationInputContentRequirements
      .complete !== false ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .exactBinding !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .propagatedBlockers !==
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BLOCKERS ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .scientificInputComplete !== false ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .bindingHashPresenceSatisfiesClosure !== false ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .bindingHashPresenceSatisfiesExecutionAdmission !== false ||
    contract.staticInputClosureSchema.operatorOrderingInputRequirements
      .complete !== false ||
    contract.staticInputClosureSchema
      .preexecutionOutputSkeletonBindingRequired !== true ||
    contract.staticInputClosureSchema
      .preexecutionOutputSkeletonBindingPresentInThisSchemaArtifact !== false ||
    contract.staticInputClosureSchema.exactCandidateSpecificPins
      .operatorOrderingSha256 !== pins.operatorOrderingSha256 ||
    contract.staticInputClosureSchema.exactCandidateSpecificPins
      .candidateManifestSha256 !== null ||
    contract.exactRawOutputInventory.representationRules
      .duplicatePhysicalPathsForDistinctOrdinalsAllowed !== false ||
    contract.exactRawOutputInventory.representationRules
      .identicalContentHashesAcrossDistinctPhysicalFilesAllowed !== true ||
    contract.exactRawOutputInventory.representationRules
      .identicalContentHashDoesNotCreateAnAliasOrRemoveAFile !== true ||
    contract.exactRawOutputInventory.pathMaterializationRules
      .runtimeFileOrdinalRoleAndPathMustExactlyMatchDescriptor !== true ||
    contract.exactRawOutputInventory.pathMaterializationRules
      .runtimePathMustRemainInsideOutputRootAfterRealpath !== true ||
    contract.frozenFailurePolicy.postObservationToleranceChangeAllowed !==
      false ||
    Object.entries(contract.authorityLocks).some(([, value]) =>
      value === null ? false : value !== false,
    )
  ) {
    throw new Error("spherical_v2_raw_replay_schema_authority_invariant");
  }

  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES
  ) {
    throw new Error("spherical_v2_raw_replay_schema_literal_seal_drift");
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2RawReplaySchemaViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON
      ? []
      : ["spherical_v2_raw_replay_schema_semantic_drift"];
  } catch {
    return ["spherical_v2_raw_replay_schema_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2RawReplaySchemaV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2RawReplaySchemaV1 =>
  nhm2SphericalBosonStarV2RawReplaySchemaViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2RawReplaySchema = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2RawReplaySchemaV1;
