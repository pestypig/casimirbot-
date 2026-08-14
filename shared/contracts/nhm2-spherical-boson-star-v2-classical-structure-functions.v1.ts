import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS,
} from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
} from "./nhm2-semiclassical-state-realizability.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_ARTIFACT_ID =
  "nhm2.semiclassical_v2.classical_structure_functions" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_classical_structure_functions/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID =
  "classical_structure_functions" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_PHASE =
  "pre_execution_candidate_specific_science_bytes" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS =
  Object.freeze({
    sourceCandidatePlanSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    sourceCandidatePlanCanonicalSizeBytes: 93214,
    v2CandidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    v2CandidateFreezeCanonicalSizeBytes: 55997,
    approvedV2ReplayPolicySha256:
      "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00",
    approvedV2ReplayPolicySizeBytes: 3827,
    scienceDerivationDagSha256:
      "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_AUTHORITY_LOCKS =
  Object.freeze({
    candidateAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    solveAuthority: false as const,
    outputAuthority: false as const,
    replayAuthority: false as const,
    independentAgreementAuthority: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 24,
    maximumNodes: 4096,
    maximumArrayLength: 256,
    maximumObjectPropertyCount: 128,
    maximumPropertyKeyUtf8Bytes: 1024,
    maximumStringUtf8Bytes: 16384,
    maximumAggregateUtf8Bytes: 262144,
  } as const);

const SOURCE = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const TARGET_WITNESS_NODE = "classical_bracket_targets_witness" as const;

const SCIENCE_INPUT_INTERFACE =
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.find(
    ({ inputId }) =>
      inputId ===
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID,
  );

if (SCIENCE_INPUT_INTERFACE == null) {
  throw new Error(
    "nhm2_spherical_v2_classical_structure_functions_interface_missing",
  );
}

const TARGET_WITNESS_EDGES = Object.freeze(
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.filter(
    ({ to }) => to === TARGET_WITNESS_NODE,
  ).map((entry) => Object.freeze({ ...entry })),
);

const TARGET_FAMILIES = Object.freeze([
  Object.freeze({
    ordinal: 0,
    bracketId: "H_H" as const,
    targetFormula: SOURCE.totalConstraintDuty.targetConstruction.H_H,
    probeSymbolsInFormulaOrder: Object.freeze(["N", "M"] as const),
    sealedGeometrySymbolsInFormulaOrder: Object.freeze(["qbar^ab"] as const),
    targetMayReadComputedOrResidualArrays:
      SOURCE.totalConstraintDuty.targetConstruction
        .targetMayReadComputedOrResidualArrays,
  }),
  Object.freeze({
    ordinal: 1,
    bracketId: "H_Hi" as const,
    targetFormula: SOURCE.totalConstraintDuty.targetConstruction.H_Hi,
    probeSymbolsInFormulaOrder: Object.freeze(["X", "N"] as const),
    sealedGeometrySymbolsInFormulaOrder: Object.freeze([] as const),
    targetMayReadComputedOrResidualArrays:
      SOURCE.totalConstraintDuty.targetConstruction
        .targetMayReadComputedOrResidualArrays,
  }),
  Object.freeze({
    ordinal: 2,
    bracketId: "Hi_Hj" as const,
    targetFormula: SOURCE.totalConstraintDuty.targetConstruction.Hi_Hj,
    probeSymbolsInFormulaOrder: Object.freeze(["X", "Y"] as const),
    sealedGeometrySymbolsInFormulaOrder: Object.freeze([] as const),
    targetMayReadComputedOrResidualArrays:
      SOURCE.totalConstraintDuty.targetConstruction
        .targetMayReadComputedOrResidualArrays,
  }),
] as const);

const FORBIDDEN_TARGET_INPUT_ROLES = Object.freeze(
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.flatMap((bracketId) => [
    `constraint_bracket.${bracketId}.computed`,
    `constraint_bracket.${bracketId}.residual`,
  ]),
);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_PHASE,
  authority: "canonical_pre_execution_scientific_input_bytes_only",
  maturity:
    "stage_2_candidate_specific_dirac_target_semantics_no_numeric_evidence",
  materialization: {
    canonicalScienceBytesPresent: true,
    frozenBeforeCandidateExecution: true,
    candidateExecutionObserved: false,
    targetValuesPresent: false,
    outputArraysPresent: false,
    solveReceipt: null,
    replayReceipt: null,
    independentAgreementReceipt: null,
  },
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    candidateManifestId: FREEZE.candidateIdentity.candidateManifestId,
    selectedProfileId: FREEZE.candidateIdentity.selectedProfileId,
    geometryId: FREEZE.candidateIdentity.geometryId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    samplingBasisId: FREEZE.candidateIdentity.samplingBasisId,
    sourceMode: FREEZE.candidateIdentity.sourceMode,
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: FREEZE.candidateIdentity.failureDisposition,
  },
  exactSourceBindings: {
    sphericalCoherentCandidatePlan: {
      binding: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS.sourceCandidatePlanSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS.sourceCandidatePlanCanonicalSizeBytes,
      role: "sole_source_of_the_three_candidate_specific_target_formulas",
    },
    v2CandidateFreeze: {
      binding: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS.v2CandidateFreezeSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS.v2CandidateFreezeCanonicalSizeBytes,
      role: "candidate_identity_component_order_normalization_and_v2_lane_binding",
    },
    approvedV2ReplayPolicy:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    approvedScienceDerivationDag: {
      sha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
      targetWitnessNode: TARGET_WITNESS_NODE,
    },
  },
  approvedInputInterface: {
    inputId: SCIENCE_INPUT_INTERFACE.inputId,
    artifactId: SCIENCE_INPUT_INTERFACE.artifactId,
    contractVersion: SCIENCE_INPUT_INTERFACE.contractVersion,
  },
  targetArrayInterface: {
    valuesPresent: false,
    familyOrder: Object.freeze([...NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS]),
    sampleCount: FREEZE.frozenScience.samplingBasis.sampleCount,
    shape: Object.freeze([...FREEZE.v2OutputDuty.brackets.shape]),
    storageOrder: FREEZE.v2OutputDuty.encoding.storageOrder,
    componentOrder: Object.freeze([
      ...NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
    ]),
    rolePattern: "constraint_bracket.{bracket_id}.target",
    unit: FREEZE.v2OutputDuty.brackets.unit,
    noComponentMixing: true,
  },
  classicalDiracTargets: {
    formulaAuthorityPath:
      "nhm2_spherical_boson_star_coherent_candidate_plan.totalConstraintDuty.targetConstruction",
    exactSourceFormulaCopy: true,
    additionalCandidateSpecificFormulaAllowed: false,
    familyOrder: Object.freeze([...NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS]),
    families: TARGET_FAMILIES,
  },
  normalization: {
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    coordinates: SOURCE.totalConstraintDuty.normalization.coordinates,
    scalar: SOURCE.totalConstraintDuty.normalization.scalar,
    generatorDefinition:
      SOURCE.totalConstraintDuty.normalization.generatorDefinition,
    scale: SOURCE.totalConstraintDuty.normalization.scale,
    normalizedValue: SOURCE.totalConstraintDuty.normalization.normalizedValue,
    inputOnly: SOURCE.totalConstraintDuty.normalization.inputOnly,
    outputDependentRescalingAllowed:
      SOURCE.totalConstraintDuty.normalization.outputDependentRescalingAllowed,
    targetUnit: FREEZE.v2OutputDuty.brackets.unit,
    v2ReplayResidualFormula:
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS.bracketResidual,
  },
  probeDependencies: {
    targetWitnessNode: TARGET_WITNESS_NODE,
    approvedWitnessEdges: TARGET_WITNESS_EDGES,
    requiredScientificInputIdsInApprovedOrder: Object.freeze(
      TARGET_WITNESS_EDGES.map(({ from }) => from),
    ),
    externalScientificInputIdsInApprovedOrder: Object.freeze(
      TARGET_WITNESS_EDGES.map(({ from }) => from).filter(
        (inputId) =>
          inputId !==
          NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID,
      ),
    ),
    sealedGeometryInputId: "geometry",
    externalProbeSemanticInputIdsInOrder: Object.freeze([
      "constraint_formulation",
      "chart",
      "sampling_basis",
    ] as const),
    formulaProbeSymbolsByFamily: Object.freeze({
      H_H: TARGET_FAMILIES[0].probeSymbolsInFormulaOrder,
      H_Hi: TARGET_FAMILIES[1].probeSymbolsInFormulaOrder,
      Hi_Hj: TARGET_FAMILIES[2].probeSymbolsInFormulaOrder,
    }),
    probeBindingsRequiredFromConstraintFormulationChartAndSamplingBasis: true,
    probeVariationalTreatmentSpecifiedByThisContract: false,
    probeValuesInventedOrMaterializedByThisContract: false,
    targetEvaluationAuthorizedByThisContract: false,
  },
  targetInputRule: {
    targetMayReadComputedOrResidualArrays:
      SOURCE.totalConstraintDuty.targetConstruction
        .targetMayReadComputedOrResidualArrays,
    computedArrayMayBeUsedAsTargetInput: false,
    residualArrayMayBeUsedAsTargetInput: false,
    targetArrayMayBeEchoedAsComputedInput: false,
    forbiddenTargetInputRoles: FORBIDDEN_TARGET_INPUT_ROLES,
    serverResidualRecomputeFormula:
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS.bracketResidual,
    residualMustBeRecomputedAfterIndependentComputedAndTargetMaterialization: true,
  },
  declaredLeverBoundary: {
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
    declaredTileTensorUsed: false,
    declaredLeverOrTileTensorAcceptedAsProbe: false,
  },
  executionBoundary: {
    thisArtifactIsExecutable: false,
    implementationPresent: false,
    executionAuthorized: false,
    executionObserved: false,
    solvePerformed: false,
    outputProduced: false,
    replayPerformed: false,
    independentImplementationRun: false,
    lampPromotionAllowed: false,
    physicalClaimUnlockAllowed: false,
  },
  downstreamEvidence: {
    constraintFormulationBinding: null,
    sealedExternalProbeReceipt: null,
    targetArrayManifest: null,
    targetDerivationWitness: null,
    serverReplayReceipt: null,
  },
  downstreamBlockers: Object.freeze([
    "v2_constraint_formulation_science_bytes_remain_separate",
    "sealed_external_probe_receipt_absent",
    "target_arrays_not_computed",
    "target_derivation_not_server_replayed",
    "candidate_not_executed",
  ] as const),
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2ClassicalStructureFunctionsV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS);
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-classical-structure-functions/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_EXPECTED_SHA256 =
  "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_EXPECTED_CANONICAL_SIZE_BYTES =
  8870 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_LITERAL_SEAL_STATUS =
  "sealed_before_v2_candidate_execution" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CONTRACT_VERSION,
    inputId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
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
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_VALIDATOR_LIMITS;
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
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value === "string") {
    const size = Buffer.byteLength(value, "utf8");
    if (size > limits.maximumStringUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += size;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
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
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length > limits.maximumObjectPropertyCount
  ) {
    return Object.freeze({
      ok: false,
      violation: `object_surface:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keySize = Buffer.byteLength(key, "utf8");
    if (keySize > limits.maximumPropertyKeyUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `property_key_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += keySize;
    if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
      });
    }
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
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS;
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.sourceCandidatePlanSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.sourceCandidatePlanCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.v2CandidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.v2CandidateFreezeCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256 !==
      pins.approvedV2ReplayPolicySha256 ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes !==
      pins.approvedV2ReplayPolicySizeBytes ||
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      pins.scienceDerivationDagSha256
  ) {
    throw new Error(
      "nhm2_spherical_v2_classical_structure_functions_dependency_pin_drift",
    );
  }
  if (
    SCIENCE_INPUT_INTERFACE.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_ARTIFACT_ID ||
    SCIENCE_INPUT_INTERFACE.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CONTRACT_VERSION ||
    !NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS.includes(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_INPUT_ID,
    ) ||
    contract.candidateIdentity.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    contract.materialization.canonicalScienceBytesPresent !== true ||
    contract.materialization.candidateExecutionObserved !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_classical_structure_functions_interface_invariant",
    );
  }
  if (
    TARGET_WITNESS_EDGES.length !== 5 ||
    TARGET_WITNESS_EDGES.map(({ from }) => from).join("|") !==
      "constraint_formulation|classical_structure_functions|geometry|chart|sampling_basis" ||
    contract.targetArrayInterface.familyOrder.join("|") !==
      NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.join("|") ||
    contract.targetArrayInterface.componentOrder.join("|") !==
      NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER.join("|") ||
    contract.targetArrayInterface.sampleCount !== 64 ||
    contract.targetArrayInterface.shape.join("|") !== "64|4" ||
    contract.targetArrayInterface.unit !== "dimensionless" ||
    contract.targetArrayInterface.valuesPresent !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_classical_structure_functions_order_invariant",
    );
  }
  const sourceTargets = SOURCE.totalConstraintDuty.targetConstruction;
  if (
    TARGET_FAMILIES.length !== 3 ||
    TARGET_FAMILIES[0].targetFormula !== sourceTargets.H_H ||
    TARGET_FAMILIES[1].targetFormula !== sourceTargets.H_Hi ||
    TARGET_FAMILIES[2].targetFormula !== sourceTargets.Hi_Hj ||
    TARGET_FAMILIES.some(
      (entry) => entry.targetMayReadComputedOrResidualArrays !== false,
    ) ||
    contract.targetInputRule.targetMayReadComputedOrResidualArrays !== false ||
    contract.targetInputRule.computedArrayMayBeUsedAsTargetInput !== false ||
    contract.targetInputRule.residualArrayMayBeUsedAsTargetInput !== false ||
    contract.targetInputRule.forbiddenTargetInputRoles.length !== 6 ||
    contract.normalization.outputDependentRescalingAllowed !== false ||
    contract.normalization.inputOnly !== true ||
    contract.probeDependencies
      .probeBindingsRequiredFromConstraintFormulationChartAndSamplingBasis !==
      true ||
    contract.probeDependencies
      .probeVariationalTreatmentSpecifiedByThisContract !== false ||
    contract.probeDependencies.targetEvaluationAuthorizedByThisContract !==
      false ||
    contract.probeDependencies
      .probeValuesInventedOrMaterializedByThisContract !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_classical_structure_functions_target_invariant",
    );
  }
  if (
    contract.declaredLeverBoundary.declaredLeverTensorUsed !== false ||
    contract.declaredLeverBoundary.declaredTileTensorUsed !== false ||
    Object.values(contract.executionBoundary).some(
      (value) => value !== false,
    ) ||
    Object.values(contract.authorityLocks).some((value) => value !== false) ||
    contract.downstreamEvidence.constraintFormulationBinding !== null ||
    contract.downstreamEvidence.targetArrayManifest !== null ||
    contract.downstreamEvidence.serverReplayReceipt !== null
  ) {
    throw new Error(
      "nhm2_spherical_v2_classical_structure_functions_authority_invariant",
    );
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_classical_structure_functions_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES}`,
  );
}

export const nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON
      ? []
      : ["spherical_v2_classical_structure_functions_semantic_drift"];
  } catch {
    return ["spherical_v2_classical_structure_functions_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2ClassicalStructureFunctionsV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2ClassicalStructureFunctionsV1 =>
  nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(value)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2ClassicalStructureFunctionsV1;
