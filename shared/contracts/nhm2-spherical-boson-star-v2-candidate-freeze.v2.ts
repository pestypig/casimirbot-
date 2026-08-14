import { createHash } from "node:crypto";

import { NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS } from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { computeNhm2SemiclassicalV2ScientificSealKey } from "./nhm2-semiclassical-v2-scientific-preseal.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING } from "./nhm2-spherical-boson-star-v2-branch-execution-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING } from "./nhm2-spherical-boson-star-v2-classical-structure-functions.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING } from "./nhm2-spherical-boson-star-v2-constraint-formulation.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING } from "./nhm2-spherical-boson-star-v2-metric-demand-program.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING } from "./nhm2-spherical-boson-star-v2-operator-ordering-derivation-closure.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING } from "./nhm2-spherical-boson-star-v2-operator-ordering.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT,
} from "./nhm2-spherical-boson-star-v2-pair-agreement.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
} from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER,
} from "./nhm2-spherical-boson-star-v2-regulator-definition.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING } from "./nhm2-spherical-boson-star-v2-renormalization-counterterms.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING } from "./nhm2-spherical-boson-star-v2-renormalization-prescription.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING } from "./nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
} from "./nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_candidate_freeze" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_candidate_freeze/v2" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHASE =
  "stage_2_preexecution_selected_identity_and_exact_68_role_abi_closure" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SELECTED_IDENTITY_COUNT =
  1 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ADMITTED_CANDIDATE_INSTANCE_COUNT =
  0 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REGULATOR_LEVEL_COUNT =
  3 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_OPERANDS_PER_LEVEL =
  21 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_NONCONSTRAINT_PHYSICAL_FILE_COUNT =
  5 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT =
  63 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE =
  68 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE =
  21 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ALIAS_ADDITIONAL_PHYSICAL_FILE_COUNT =
  0 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE =
  836_672 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE =
  6_693_376 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_PHYSICAL_FILE_COUNT =
  136 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_ROLE_COUNT =
  68 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_BYTE_COUNT =
  13_386_752 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_OUTPUT_INSTANCE_COUNT =
  0 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 131_072,
    maximumWireUtf8Bytes: 131_072,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REQUIRED_BINDING_PINS =
  Object.freeze({
    predecessorCandidateFreeze: Object.freeze({
      semanticSha256:
        "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
      plainCanonicalSha256:
        "0a961dea8a620132efb8d669bbca1509ef53de6bf0073d1a174b2a743dfd112f",
      canonicalSizeBytes: 55_997,
    }),
    branchExecutionPolicy: Object.freeze({
      semanticSha256:
        "55238947c0a21f71ff3b0b28d095733376527479214806790990aea4317b7cf8",
      canonicalSizeBytes: 21_266,
    }),
    rawReplaySchema: Object.freeze({
      semanticSha256:
        "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
      canonicalSizeBytes: 163_818,
    }),
    finalSiOutputNormalizationV2: Object.freeze({
      semanticSha256:
        "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb",
      canonicalSizeBytes: 15_246,
    }),
    staleSiOutputNormalizationV1: Object.freeze({
      semanticSha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      canonicalSizeBytes: 23_822,
    }),
    meanNoiseRealization: Object.freeze({
      semanticSha256:
        "bf9875496a7aa8f5bde0509e597b373454ddea072f1d1af2ae18b746f7646467",
      canonicalSizeBytes: 25_213,
    }),
    renormalizationPrescription: Object.freeze({
      semanticSha256:
        "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
      canonicalSizeBytes: 10_670,
    }),
    renormalizationCounterterms: Object.freeze({
      semanticSha256:
        "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa",
      canonicalSizeBytes: 10_182,
    }),
    constraintFormulation: Object.freeze({
      semanticSha256:
        "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
      canonicalSizeBytes: 11_571,
    }),
    classicalStructureFunctions: Object.freeze({
      semanticSha256:
        "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
      canonicalSizeBytes: 8_870,
    }),
    operatorOrdering: Object.freeze({
      semanticSha256:
        "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e",
      canonicalSizeBytes: 17_662,
    }),
    operatorDerivationClosure: Object.freeze({
      semanticSha256:
        "70aee3e44231eaa537964595acd6378394c4f7a8fabeb5d79307b7966d6ac3eb",
      canonicalSizeBytes: 16_310,
    }),
    regulatorDefinition: Object.freeze({
      semanticSha256:
        "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade",
      canonicalSizeBytes: 62_592,
    }),
    metricDemandProgram: Object.freeze({
      semanticSha256:
        "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee",
      canonicalSizeBytes: 48_595,
    }),
    smearingWeightFreeze: Object.freeze({
      semanticSha256:
        "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446",
      canonicalSizeBytes: 6_764,
      observedRawSha256:
        "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd",
      observedRawSizeBytes: 512,
    }),
    pairAgreementPlan: Object.freeze({
      semanticSha256:
        "9385daf2e311f28bd5a563ceb0f22e0a647cee568e8ae4baeeabe5bcd5b4d1f4",
      canonicalSizeBytes: 45_302,
    }),
    runArtifactWireV2: Object.freeze({
      semanticSha256:
        "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
      canonicalSizeBytes: 11_117,
    }),
  } as const);

const PREDECESSOR = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const PREDECESSOR_PLAIN_CANONICAL_SHA256 = createHash("sha256")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON, "utf8")
  .digest("hex");
const CANDIDATE_IDENTITY_SEAL_KEY = computeNhm2SemiclassicalV2ScientificSealKey(
  PREDECESSOR.candidateIdentity.candidateId,
);

const NULL_CONSTRAINT_OPERAND_RAW_BINDINGS = Object.freeze(
  Array.from(
    {
      length:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT,
    },
    () => null,
  ),
);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_AUTHORITY_LOCKS =
  Object.freeze({
    candidateManifestMaterialized: false,
    candidateAdmissible: false,
    nondegeneracyEstablished: false,
    branchScienceReady: false,
    siV2DefinitionIntegrationReady: false,
    geometryStateReady: false,
    metricDemandReady: false,
    meanNoiseReady: false,
    constraintOperandsReady: false,
    outputManifestReady: false,
    scientificPresealReady: false,
    executionPresealReady: false,
    executionAuthorized: false,
    executionObserved: false,
    primaryReplayReady: false,
    independentReplayReady: false,
    pairAgreementObserved: false,
    diagnosticPass: false,
    stressNoiseLamp: false,
    constraintAlgebraLamp: false,
    authorityPromoted: false,
    registryPromoted: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  } as const);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHASE,
  authority:
    "semantic_and_output_abi_closure_only_no_candidate_instance_execution_receipt_or_promotion_authority",
  maturity:
    "stage_2_selected_identity_frozen_nondegeneracy_and_all_scientific_instances_absent",
  additiveSuccessorBoundary: {
    predecessor: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    predecessorMutated: false,
    predecessorV1AdmissionInherited: false,
    relation:
      "additive_successor_freezes_exact_semantic_dependencies_and_existing_68_role_abi",
    scientificChoicesIntroducedBySuccessor: false,
    thresholdsIntroducedBySuccessor: false,
  },
  selectedCandidateIdentity: {
    exactSelectedIdentityCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SELECTED_IDENTITY_COUNT,
    candidateId: PREDECESSOR.candidateIdentity.candidateId,
    candidateManifestId: PREDECESSOR.candidateIdentity.candidateManifestId,
    selectedProfileId: PREDECESSOR.candidateIdentity.selectedProfileId,
    candidateKind: PREDECESSOR.candidateIdentity.candidateKind,
    geometryId: PREDECESSOR.candidateIdentity.geometryId,
    quantumStateId: PREDECESSOR.candidateIdentity.quantumStateId,
    chartId: PREDECESSOR.candidateIdentity.chartId,
    normalizationId: PREDECESSOR.candidateIdentity.normalizationId,
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
    declaredTileTensorUsed: false,
    retuningAfterObservationAllowed: false,
    alternateCandidateFallbackAllowed: false,
  },
  candidateAdmission: {
    selectedIdentityRequiresNondegeneracy: true,
    exactAdmittedCandidateInstanceCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ADMITTED_CANDIDATE_INSTANCE_COUNT,
    nondegeneracyEstablished: false,
    candidateAdmissible: false,
    candidateInstance: null,
    candidateManifestSemanticInstance: null,
    candidateManifestObservedRawBinding: null,
    admissionReceipt: null,
  },
  hashNamespaces: {
    candidateIdentityDeterministicSealKey: CANDIDATE_IDENTITY_SEAL_KEY,
    candidateIdentitySealKeyPurpose:
      "deterministic_preseal_namespace_key_only_not_candidate_bytes_or_proof",
    predecessorSemanticContractSeal:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.sha256,
    predecessorPlainCanonicalJsonSha256: PREDECESSOR_PLAIN_CANONICAL_SHA256,
    candidateManifestObservedRawBinding: null,
    semanticContractSealMayStandInForObservedRawFileHash: false,
    plainCanonicalHashMayStandInForDomainSeparatedSemanticSeal: false,
    candidateIdentityStringMayStandInForCandidateManifestBytes: false,
    candidateIdentitySealKeyMayStandInForNondegeneracyProof: false,
  },
  exactDefinitionBindings: {
    branchExecutionPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
    rawReplaySchema: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    finalSiOutputNormalizationV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    renormalizationPrescription:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
    renormalizationCounterterms:
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
    meanNoiseRealization:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
    constraintFormulation:
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
    classicalStructureFunctions:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
    operatorOrdering: NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
    operatorDerivationClosure:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
    regulatorDefinition:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
    metricDemandProgram:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
    smearingWeightFreeze:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
    pairAgreementPlan: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
  },
  staleSiIntegrationLedger: {
    finalRequiredNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    staleEmbeddedNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    staleConsumers: [
      {
        consumer:
          NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
        embeddedNormalization:
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
        integrationRepaired: false,
      },
      {
        consumer: NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
        embeddedNormalization:
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
        integrationRepaired: false,
      },
      {
        consumer: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
        embeddedNormalization:
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
        integrationRepaired: false,
      },
    ],
    finalSiV2MayBeClaimedTransitivelyIntegrated: false,
    successorScienceDefinitionIntegrationComplete: false,
    additiveSuccessorsRequiredBeforeCandidateAdmission: true,
  },
  scientificInputInventoryBoundary: {
    candidateManifestRawEntryCount: 1,
    exactNonSelfScientificInputCount:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS.length,
    exactTotalScientificInputCount:
      1 + NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS.length,
    candidateManifestMustBeCanonicalUtf8Bytes: true,
    candidateManifestSelfHashFieldForbidden: true,
    externalRawHashAndSizeMustOccupyInputOrdinalZero: true,
    candidateManifestObservedRawBinding: null,
    stagedScientificInputInventory: null,
    scientificInputClosureReceipt: null,
  },
  unresolvedScientificChoices: {
    candidateGrid: {
      family: null,
      levelIds: null,
      pointCounts: null,
      domainMap: null,
    },
    refinement: {
      schedule: null,
      chronology: null,
      projection: null,
      selectionRule: null,
    },
    crossGridConvergence: {
      levels: null,
      projection: null,
      stateOrdering: null,
      norm: null,
      absoluteTolerance: null,
      relativeTolerance: null,
      consecutivePairCount: null,
      failureDisposition: null,
    },
    continuousVacuumConnection: {
      path: null,
      proof: null,
      receipt: null,
    },
    noFold: {
      tangentDefinition: null,
      orientationDefinition: null,
      observable: null,
      threshold: null,
      receipt: null,
    },
    origin: {
      allOrderRecurrence: null,
      remainderBound: null,
      proof: null,
      receipt: null,
    },
    tail: {
      finiteRepresentative: null,
      recurrence: null,
      remainderBound: null,
      proof: null,
      receipt: null,
    },
    initializer: {
      instance: null,
      receipt: null,
    },
    geometryState: {
      jointAlgorithm: null,
      geometryInstance: null,
      quantumStateInstance: null,
      jointWitness: null,
      receipt: null,
    },
    metricDemand: {
      tensor: null,
      absoluteErrorBound: null,
      derivationReceipt: null,
      replayReceipt: null,
    },
  },
  outputAbi: {
    descriptorAuthority: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    regulatorDefinitionAuthority:
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
    definitionOnlyNoSkeletonDuplication: true,
    perLane: {
      exactNonconstraintPhysicalFileCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_NONCONSTRAINT_PHYSICAL_FILE_COUNT,
      exactRegulatorLevelCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REGULATOR_LEVEL_COUNT,
      exactConstraintOperandCountPerLevel:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_OPERANDS_PER_LEVEL,
      exactConstraintPhysicalFileCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT,
      exactPhysicalFileCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE,
      exactCentralLogicalAliasCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE,
      exactAdditionalPhysicalFileCountFromAliases:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ALIAS_ADDITIONAL_PHYSICAL_FILE_COUNT,
      exactFloat64ValueCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE,
      exactByteCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE,
    },
    futurePair: {
      exactLaneCount: 2,
      exactPhysicalFileCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_PHYSICAL_FILE_COUNT,
      exactPairedRoleCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_ROLE_COUNT,
      exactByteCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_BYTE_COUNT,
      exactCheckAndToleranceOutcomeCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
    },
    exactOutputInstanceCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_OUTPUT_INSTANCE_COUNT,
    outputRoot: null,
    outputManifest: null,
    physicalFileRawBindings: null,
  },
  outputScientificInstances: {
    meanNoise: [
      { role: "noise_kernel", rawBinding: null, values: null },
      {
        role: "noise_kernel_absolute_uncertainty95",
        rawBinding: null,
        values: null,
      },
      { role: "mean_rset", rawBinding: null, values: null },
      {
        role: "mean_rset_absolute_uncertainty95",
        rawBinding: null,
        values: null,
      },
    ],
    smearingWeights: {
      frozenSourceRawPayload: {
        sha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
        sizeBytes: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
      },
      outputRawBinding: null,
      outputValues: null,
      frozenSourceRawPayloadIsNotAnObservedOutputInstance: true,
    },
    constraintOperands: {
      exactExpectedOperandCount:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT,
      rawBindingsInSchemaOrder: NULL_CONSTRAINT_OPERAND_RAW_BINDINGS,
      decodedValues: null,
    },
  },
  runtimePresealAndReplayInstances: {
    implementationClosure: null,
    dependencyClosure: null,
    executableClosure: null,
    runtimeEnvironment: null,
    primaryRootIdentity: null,
    independentRootIdentity: null,
    inputRootIdentity: null,
    outputRootIdentity: null,
    scientificPreseal: null,
    executionPreseal: null,
    preexecutionFreshnessReceipt: null,
    executionReceipt: null,
    postexecutionFreshnessReceipt: null,
    primaryReplayReceipt: null,
    independentReplayReceipt: null,
    pairAgreementReceipt: null,
  },
  ownershipBoundary: {
    existingOutputSkeletonAuthority:
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    existingPairPlanAuthority:
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
    definesOutputSkeleton: false,
    definesExecutionAdapter: false,
    definesReceiptIssuer: false,
    definesOutputRoot: false,
    executesCandidate: false,
    observesOutputBytes: false,
    createsRegistryEntry: false,
    promotesAuthority: false,
    invokesCasimirVerification: false,
  },
  selfSealPolicy: {
    domainSeparatedSemanticSealRequired: true,
    plainCanonicalHashRequiredAndDistinctlyNamed: true,
    expectedLiteralsExcludedFromSemanticPayload: true,
    parentAcknowledgementRequiredBeforeExpectedLiteralFreeze: true,
    observedRawBindingExcludedBecauseNoArtifactFileWasObserved: true,
  },
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2 =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2CandidateFreezeV2 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2);
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-candidate-freeze/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON,
    "utf8",
  );

// These literals were frozen only after independent parent recomputation and
// explicit acknowledgement of the semantic seal, plain hash, and byte size.
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2";
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null =
  "ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932";
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 20_843;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_LITERAL_SEAL_STATUS =
  "sealed_after_independent_parent_acknowledgement_before_candidate_execution" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONTRACT_VERSION,
    hashSemantics:
      "domain_separated_semantic_contract_seal_distinct_from_plain_canonical_hash_and_observed_raw_binding" as const,
    semanticSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256_DOMAIN,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
    observedRawBinding: null,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_LITERAL_SEAL_STATUS,
  });

const exactBinding = (
  binding: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  pin: Readonly<{ semanticSha256: string; canonicalSizeBytes: number }>,
): boolean =>
  binding.sha256 === pin.semanticSha256 &&
  binding.canonicalSizeBytes === pin.canonicalSizeBytes;

const allNullLeaves = (value: unknown): boolean => {
  if (value === null) return true;
  if (Array.isArray(value)) return value.every(allNullLeaves);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(allNullLeaves);
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REQUIRED_BINDING_PINS;
  const descriptors =
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS;
  const aliases =
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES;
  const totalBytes = descriptors.reduce(
    (sum, descriptor) => sum + descriptor.sizeBytes,
    0,
  );
  const expectedLiterals = [
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
  ];
  const expectedLiteralNullCount = expectedLiterals.filter(
    (value) => value === null,
  ).length;

  if (
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      pins.predecessorCandidateFreeze,
    ) ||
    PREDECESSOR_PLAIN_CANONICAL_SHA256 !==
      pins.predecessorCandidateFreeze.plainCanonicalSha256 ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
      pins.branchExecutionPolicy,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
      pins.rawReplaySchema,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
      pins.finalSiOutputNormalizationV2,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
      pins.staleSiOutputNormalizationV1,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
      pins.meanNoiseRealization,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING,
      pins.renormalizationPrescription,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING,
      pins.renormalizationCounterterms,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
      pins.constraintFormulation,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
      pins.classicalStructureFunctions,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
      pins.operatorOrdering,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
      pins.operatorDerivationClosure,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
      pins.regulatorDefinition,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
      pins.metricDemandProgram,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
      pins.smearingWeightFreeze,
    ) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 !==
      pins.smearingWeightFreeze.observedRawSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES !==
      pins.smearingWeightFreeze.observedRawSizeBytes ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
      pins.pairAgreementPlan,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
      pins.runArtifactWireV2,
    )
  ) {
    throw new Error("spherical_v2_candidate_freeze_v2_dependency_pin_drift");
  }

  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_REGULATOR_LEVEL_COUNT ||
    NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_NONCONSTRAINT_PHYSICAL_FILE_COUNT ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT ||
    NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE ||
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_FUTURE_PAIR_ROLE_COUNT ||
    descriptors.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PHYSICAL_FILE_COUNT_PER_LANE ||
    aliases.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CENTRAL_ALIAS_COUNT_PER_LANE ||
    aliases.some((alias) => alias.additionalPhysicalFile !== false) ||
    totalBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BYTE_COUNT_PER_LANE ||
    totalBytes / 8 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALUE_COUNT_PER_LANE ||
    NULL_CONSTRAINT_OPERAND_RAW_BINDINGS.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CONSTRAINT_PHYSICAL_FILE_COUNT ||
    !NULL_CONSTRAINT_OPERAND_RAW_BINDINGS.every((binding) => binding === null)
  ) {
    throw new Error("spherical_v2_candidate_freeze_v2_output_count_drift");
  }

  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2;
  if (
    contract.selectedCandidateIdentity.exactSelectedIdentityCount !== 1 ||
    contract.candidateAdmission.exactAdmittedCandidateInstanceCount !== 0 ||
    contract.candidateAdmission.nondegeneracyEstablished !== false ||
    contract.candidateAdmission.candidateAdmissible !== false ||
    contract.candidateAdmission.candidateManifestObservedRawBinding !== null ||
    contract.scientificInputInventoryBoundary
      .exactNonSelfScientificInputCount !== 22 ||
    contract.scientificInputInventoryBoundary.exactTotalScientificInputCount !==
      23 ||
    !allNullLeaves(contract.unresolvedScientificChoices) ||
    contract.outputScientificInstances.meanNoise.length !== 4 ||
    !contract.outputScientificInstances.meanNoise.every(
      (instance) => instance.rawBinding === null && instance.values === null,
    ) ||
    contract.outputAbi.exactOutputInstanceCount !== 0 ||
    contract.outputAbi.outputRoot !== null ||
    contract.outputAbi.outputManifest !== null ||
    contract.outputAbi.physicalFileRawBindings !== null ||
    !allNullLeaves(contract.runtimePresealAndReplayInstances) ||
    contract.selectedCandidateIdentity.declaredLeverTensorUsed !== false ||
    contract.selectedCandidateIdentity.declaredTileTensorUsed !== false ||
    Object.values(contract.authorityLocks).some((value) => value !== false) ||
    Object.entries(contract.ownershipBoundary)
      .filter(([, value]) => typeof value === "boolean")
      .some(([, value]) => value !== false)
  ) {
    throw new Error("spherical_v2_candidate_freeze_v2_authority_invariant");
  }

  if (
    expectedLiteralNullCount !== 0 &&
    expectedLiteralNullCount !== expectedLiterals.length
  ) {
    throw new Error("spherical_v2_candidate_freeze_v2_partial_literal_seal");
  }
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256 !==
      null &&
    (NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_SEMANTIC_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_SEMANTIC_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_PLAIN_CANONICAL_SHA256 !==
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_PLAIN_CANONICAL_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_SIZE_BYTES !==
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_EXPECTED_CANONICAL_SIZE_BYTES)
  ) {
    throw new Error("spherical_v2_candidate_freeze_v2_literal_seal_drift");
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations = (
  wire: unknown,
): string[] => {
  if (typeof wire !== "string") {
    return ["spherical_v2_candidate_freeze_v2_wire_must_be_primitive_string"];
  }
  if (
    wire.length >
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits
  ) {
    return ["spherical_v2_candidate_freeze_v2_wire_utf16_limit"];
  }
  if (
    Buffer.byteLength(wire, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_VALIDATOR_LIMITS.maximumWireUtf8Bytes
  ) {
    return ["spherical_v2_candidate_freeze_v2_wire_utf8_limit"];
  }
  return wire ===
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON
    ? []
    : ["spherical_v2_candidate_freeze_v2_canonical_wire_mismatch"];
};

export const isNhm2SphericalBosonStarV2CandidateFreezeV2Wire = (
  wire: unknown,
): wire is string =>
  nhm2SphericalBosonStarV2CandidateFreezeV2WireViolations(wire).length === 0;

export const cloneNhm2SphericalBosonStarV2CandidateFreezeV2CanonicalWire =
  (): string => NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_CANONICAL_JSON;
