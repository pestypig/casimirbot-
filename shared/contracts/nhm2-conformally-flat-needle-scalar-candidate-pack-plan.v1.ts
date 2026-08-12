import { createHash } from "node:crypto";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";
import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS } from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  type Nhm2SemiclassicalV2ScientificCandidateInputV1,
  type Nhm2SemiclassicalV2ScientificNonSelfInputId,
} from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_scalar_candidate_pack_plan" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_scalar_candidate_pack_plan/v1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_PHASE =
  "pre_execution_output_free_science_pack_plan" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_MISSING_INPUT_IDS =
  Object.freeze([
    "renormalization_prescription",
    "constraint_formulation",
    "regulator_definition",
    "operator_ordering",
    "classical_structure_functions",
    "metric_demand_tensor",
    "metric_demand_absolute_error_bound",
    "metric_demand_derivation_receipt",
  ] as const satisfies readonly Nhm2SemiclassicalV2ScientificNonSelfInputId[]);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_BLOCKERS =
  Object.freeze([
    "metric_demand_tensor_bytes_missing",
    "metric_demand_absolute_error_bound_bytes_missing",
    "metric_demand_derivation_receipt_missing",
    "wald_conservation_restoring_local_term_not_derived",
    "full_gravity_plus_matter_constraint_formulation_missing",
    "full_gravity_plus_matter_regulator_definition_missing",
    "full_gravity_plus_matter_operator_ordering_missing",
    "full_gravity_plus_matter_classical_structure_functions_missing",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_CLAIM_LOCKS =
  Object.freeze({
    candidateManifestMaterialized: false as const,
    scientificPresealEligible: false as const,
    executionEligible: false as const,
    metricDemandDerivationAuthority: false as const,
    metricDemandIntervalTraceReplay: false as const,
    diagnosticPass: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
  });

type CandidateDescriptor =
  Nhm2SemiclassicalV2ScientificCandidateInputV1["descriptor"];

export type Nhm2ConformallyFlatNeedleScalarCandidatePackInputPlanV1 = {
  ordinal: number;
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId;
  relativePath: string;
  mediaType: "application/json" | "application/octet-stream";
  descriptor: CandidateDescriptor;
  byteEncoding: "canonical_json_utf8" | "raw_ieee754_float64_little_endian";
  materializationStatus:
    "canonical_science_bytes_ready" | "missing_required_science";
  canonicalBytesBase64: string | null;
  sha256: string | null;
  sizeBytes: number | null;
  blocker: string | null;
};

export type Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 = {
  artifactId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_ARTIFACT_ID;
  contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CONTRACT_VERSION;
  phase: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_PHASE;
  authority: "server_owned_pure_materialization_plan";
  status: "blocked_incomplete_scientific_input_closure";
  referenceBinding: {
    artifactId: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID;
    contractVersion: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION;
    surrogateId: "conformally_flat_needle_reference";
    referenceSha256: string;
    semanticRelabelingAllowed: false;
    currentNhm2ShiftLapseMetric: false;
  };
  candidateTarget: {
    candidateId: "nhm2.conformally_flat_needle_scalar_reference.candidate/v1";
    candidateManifestId: "nhm2.conformally_flat_needle_scalar_reference.candidate_manifest.pending/v1";
    selectedProfileId: "conformally_flat_needle_reference";
    candidateKind: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND;
    geometryId: string;
    quantumStateId: string;
    chartId: string;
    normalizationId: string;
    tolerancePolicyId: string;
    smearingFunctionId: string;
    samplingBasisId: string;
    nondegeneracyCriterionId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID;
    metricDemandInputId: "metric_demand_tensor";
    metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound";
    metricDemandDerivationReceiptInputId: "metric_demand_derivation_receipt";
    sampleCount: 64;
    candidateFrozenAt: null;
    nondegeneracyEstablished: false;
    metricDemandDerivationReceiptVerified: false;
    metricDemandIntervalTraceServerReplayed: false;
    sourceMode: "state_derived_not_declared_lever";
    declaredLeverTensorUsed: false;
  };
  expectedInputIds: Nhm2SemiclassicalV2ScientificNonSelfInputId[];
  inputPlans: Nhm2ConformallyFlatNeedleScalarCandidatePackInputPlanV1[];
  closure: {
    expectedInputCount: 22;
    readyInputCount: 14;
    missingInputCount: 8;
    complete: false;
    missingInputIds: Nhm2SemiclassicalV2ScientificNonSelfInputId[];
    candidateManifestCanonicalBytesBase64: null;
    candidateManifestSha256: null;
    candidateManifestSizeBytes: null;
    scientificPresealBytesBase64: null;
    refreezeRequiredAfterScientificClosure: true;
  };
  authorityState: {
    status: "blocked";
    firstBlocker: "metric_demand_tensor_bytes_missing";
    blockers: string[];
  };
  claimLocks: typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_CLAIM_LOCKS;
};

const SCIENTIFIC_OBJECT_IDS = Object.freeze({
  geometry: "conformally_flat_needle_reference.geometry/v1",
  quantum_state:
    "conformally_flat_needle_reference.conformal_minkowski_vacuum/v1",
  chart:
    "conformally_flat_needle_reference.global_pulled_back_conformal_inertial_chart/v1",
  normalization:
    "conformally_flat_needle_reference.orthonormal_tetrad_si_normalization/v1",
  tolerance_policy:
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.policyId,
  smearing_definition:
    "conformally_flat_needle_reference.normalized_c_infinity_spacetime_product_bumps/v1",
  sampling_basis:
    "conformally_flat_needle_reference.fixed_64_sampling_basis/v1",
  field_model:
    "conformally_flat_needle_reference.real_massless_conformal_scalar/v1",
  lagrangian:
    "conformally_flat_needle_reference.conformal_scalar_lagrangian/v1",
  field_equations:
    "conformally_flat_needle_reference.conformal_wave_equation/v1",
  boundary_conditions:
    "conformally_flat_needle_reference.no_material_boundary_asymptotic_minkowski/v1",
  state_construction:
    "conformally_flat_needle_reference.conformal_pullback_hadamard_state_construction/v1",
  renormalization_prescription:
    "conformally_flat_needle_reference.wald_point_split_prescription.pending/v1",
  renormalization_counterterms:
    "conformally_flat_needle_reference.wald_named_counterterm_basis/v1",
  finite_renormalization_freedom:
    "conformally_flat_needle_reference.wald_fixed_zero_finite_freedom/v1",
  constraint_formulation:
    "conformally_flat_needle_reference.full_gravity_matter_constraint_formulation.pending/v1",
  regulator_definition:
    "conformally_flat_needle_reference.full_gravity_matter_regulator.pending/v1",
  operator_ordering:
    "conformally_flat_needle_reference.full_gravity_matter_operator_ordering.pending/v1",
  classical_structure_functions:
    "conformally_flat_needle_reference.full_gravity_matter_structure_functions.pending/v1",
  metric_demand_tensor:
    "conformally_flat_needle_reference.metric_demand_tensor.pending/v1",
  metric_demand_absolute_error_bound:
    "conformally_flat_needle_reference.metric_demand_absolute_error_bound.pending/v1",
  metric_demand_derivation_receipt:
    "nhm2.conformally_flat_needle_scalar_reference.candidate/v1",
} as const satisfies Record<
  Nhm2SemiclassicalV2ScientificNonSelfInputId,
  string
>);

const INPUT_BLOCKERS = Object.freeze({
  renormalization_prescription:
    "wald_conservation_restoring_local_term_not_derived",
  constraint_formulation:
    "full_gravity_plus_matter_constraint_formulation_missing",
  regulator_definition: "full_gravity_plus_matter_regulator_definition_missing",
  operator_ordering: "full_gravity_plus_matter_operator_ordering_missing",
  classical_structure_functions:
    "full_gravity_plus_matter_classical_structure_functions_missing",
  metric_demand_tensor: "metric_demand_tensor_bytes_missing",
  metric_demand_absolute_error_bound:
    "metric_demand_absolute_error_bound_bytes_missing",
  metric_demand_derivation_receipt:
    "metric_demand_derivation_receipt_missing",
} as const satisfies Record<
  (typeof NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_MISSING_INPUT_IDS)[number],
  string
>);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isExactPlainJsonDataTree = (
  value: unknown,
  ancestors = new Set<object>(),
): boolean => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || ancestors.has(value)) return false;

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) return false;

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) return false;
    const expectedKeys = [
      ...Array.from({ length: value.length }, (_, index) => String(index)),
      "length",
    ];
    if (
      ownKeys.length !== expectedKeys.length ||
      expectedKeys.some((key, index) => ownKeys[index] !== key)
    ) {
      return false;
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true ||
        !isExactPlainJsonDataTree(descriptor.value, nextAncestors)
      ) {
        return false;
      }
    }
    const lengthDescriptor = descriptors.length;
    return (
      lengthDescriptor != null &&
      "value" in lengthDescriptor &&
      lengthDescriptor.value === value.length &&
      lengthDescriptor.enumerable === false
    );
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  for (const key of ownKeys as string[]) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true ||
      !isExactPlainJsonDataTree(descriptor.value, nextAncestors)
    ) {
      return false;
    }
  }
  return true;
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value))
    return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON requires finite numbers.");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  return `{${Object.keys(value)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const scienceDocument = (
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
  artifactId: string,
  contractVersion: string,
  semantics: unknown,
): Record<string, unknown> => ({
  artifactId,
  contractVersion,
  frozenReferenceBinding: {
    artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
    currentNhm2ShiftLapseMetric: false,
    semanticRelabelingAllowed: false,
    surrogateId: "conformally_flat_needle_reference",
  },
  inputId,
  scientificObjectId: SCIENTIFIC_OBJECT_IDS[inputId],
  semantics,
});

const contractFor = (
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
): { artifactId: string; contractVersion: string } => {
  if (inputId === "normalization") {
    return {
      artifactId: "nhm2.semiclassical_v2.normalization",
      contractVersion: "nhm2_semiclassical_v2_normalization/v1",
    };
  }
  if (inputId === "tolerance_policy") {
    return {
      artifactId:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.artifactId,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.contractVersion,
    };
  }
  if (inputId === "metric_demand_derivation_receipt") {
    return {
      artifactId:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
    };
  }
  const contract =
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.find(
      (entry) => entry.inputId === inputId,
    );
  if (contract == null) {
    throw new TypeError(`No semantic contract is registered for ${inputId}.`);
  }
  return contract;
};

const readyScienceDocuments = (): Partial<
  Record<Nhm2SemiclassicalV2ScientificNonSelfInputId, Record<string, unknown>>
> => {
  const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
  const make = (
    inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
    semantics: unknown,
  ) => {
    const contract = contractFor(inputId);
    return scienceDocument(
      inputId,
      contract.artifactId,
      contract.contractVersion,
      semantics,
    );
  };
  return {
    geometry: make("geometry", {
      boundaryAndAsymptotics: reference.geometry.boundaryAndAsymptotics,
      compactBump: reference.geometry.compactBump,
      conformalFactor: reference.geometry.conformalFactor,
      coordinateFlow: reference.geometry.coordinateFlow,
      ellipsoidalCompactCoordinate:
        reference.geometry.ellipsoidalCompactCoordinate,
      metric: reference.geometry.metric,
      signature: reference.geometry.signature,
      spacetimeDimension: reference.geometry.spacetimeDimension,
    }),
    quantum_state: make("quantum_state", {
      stateClass: reference.state.stateClass,
      stateId: reference.state.stateId,
      unitConventionForTwoPointFunction:
        reference.state.unitConventionForTwoPointFunction,
    }),
    chart: make("chart", {
      coordinateFlow: reference.geometry.coordinateFlow,
      inertialConformalCoordinates:
        reference.geometry.inertialConformalCoordinates,
      tetrad: reference.geometry.tetrad,
    }),
    normalization: make("normalization", {
      connectedNoiseKernelSiRestoration:
        reference.renormalization.siRestoration.connectedNoiseKernel,
      meanStressTensorSiRestoration:
        reference.renormalization.siRestoration.meanStressTensor,
      tensorConvention: reference.tensorConvention,
    }),
    smearing_definition: make(
      "smearing_definition",
      reference.sampling.smearing,
    ),
    sampling_basis: make("sampling_basis", {
      enumerationOrder: reference.sampling.enumerationOrder,
      multiplierOrder: reference.sampling.multiplierOrder,
      ordinalFormula: reference.sampling.ordinalFormula,
      pointFormula: reference.sampling.pointFormula,
      sampleCount: reference.sampling.sampleCount,
      samplePoints: reference.sampling.samplePoints,
      sampleWeights: reference.sampling.sampleWeights,
      variationRule: reference.sampling.variationRule,
    }),
    field_model: make("field_model", {
      curvatureCoupling: reference.fieldTheory.curvatureCoupling,
      field: reference.fieldTheory.field,
      fieldKind: reference.fieldTheory.fieldKind,
      mass: reference.fieldTheory.mass,
      materialCoupling: reference.fieldTheory.materialCoupling,
      selfInteraction: reference.fieldTheory.selfInteraction,
      spacetimeDimension: reference.fieldTheory.spacetimeDimension,
    }),
    lagrangian: make("lagrangian", {
      action: reference.fieldTheory.action,
      curvatureCoupling: reference.fieldTheory.curvatureCoupling,
      field: reference.fieldTheory.field,
    }),
    field_equations: make("field_equations", {
      equation: reference.fieldTheory.fieldEquation,
      field: reference.fieldTheory.field,
      geometryBinding: reference.geometry.metric,
    }),
    boundary_conditions: make(
      "boundary_conditions",
      reference.geometry.boundaryAndAsymptotics,
    ),
    state_construction: make("state_construction", {
      curvedTwoPointFunction: reference.state.curvedTwoPointFunction,
      minkowskiTwoPointFunction: reference.state.minkowskiTwoPointFunction,
      stateClass: reference.state.stateClass,
      stateId: reference.state.stateId,
      unitConventionForTwoPointFunction:
        reference.state.unitConventionForTwoPointFunction,
    }),
    renormalization_counterterms: make("renormalization_counterterms", {
      basis: reference.renormalization.waldCountertermBasis,
      unnamedCountertermsAllowed:
        reference.renormalization.countertermPolicy.unnamedCountertermsAllowed,
    }),
    finite_renormalization_freedom: make(
      "finite_renormalization_freedom",
      reference.renormalization.countertermPolicy,
    ),
  };
};

const relativePathFor = (
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
): string => {
  if (inputId === "tolerance_policy") {
    return "policy/approved-replay-policy.v1.json";
  }
  if (inputId === "metric_demand_tensor") {
    return "metric/metric-demand.float64le.bin";
  }
  if (inputId === "metric_demand_absolute_error_bound") {
    return "metric/metric-demand-absolute-error-bound.float64le.bin";
  }
  if (inputId === "metric_demand_derivation_receipt") {
    return "metric/metric-demand-derivation-receipt.v1.json";
  }
  return `science/${inputId}.v1.json`;
};

const descriptorFor = (
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
): CandidateDescriptor => {
  if (inputId === "tolerance_policy") {
    return {
      descriptorKind: "approved_replay_policy",
      scientificInputId: "tolerance_policy",
      artifactId:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.artifactId,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.contractVersion,
      policyId:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.policyId,
    };
  }
  if (
    inputId === "metric_demand_tensor" ||
    inputId === "metric_demand_absolute_error_bound"
  ) {
    return {
      descriptorKind:
        inputId === "metric_demand_tensor"
          ? "metric_demand_tensor_float64"
          : "metric_demand_absolute_error_bound_float64",
      scientificInputId: inputId,
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      shape: [64, 10],
      storageOrder: "row-major",
      componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
      unit: "J/m^3",
    };
  }
  if (inputId === "metric_demand_derivation_receipt") {
    return {
      descriptorKind: "metric_demand_derivation_receipt",
      scientificInputId: "metric_demand_derivation_receipt",
      artifactId:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
      scientificObjectId:
        "nhm2.conformally_flat_needle_scalar_reference.candidate/v1",
    };
  }
  const contract = contractFor(inputId);
  return {
    descriptorKind: "frozen_scientific_artifact",
    scientificInputId: inputId,
    artifactId: contract.artifactId,
    contractVersion: contract.contractVersion,
    scientificObjectId: SCIENTIFIC_OBJECT_IDS[inputId],
  };
};

const buildInputPlans =
  (): Nhm2ConformallyFlatNeedleScalarCandidatePackInputPlanV1[] => {
    const documents = readyScienceDocuments();
    return NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS.map(
      (inputId, ordinal) => {
        const descriptor = descriptorFor(inputId);
        const relativePath = relativePathFor(inputId);
        const missing = (
          NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_MISSING_INPUT_IDS as readonly string[]
        ).includes(inputId);
        if (missing) {
          const blocker =
            INPUT_BLOCKERS[inputId as keyof typeof INPUT_BLOCKERS];
          return {
            ordinal,
            inputId,
            relativePath,
            mediaType:
              inputId === "metric_demand_tensor" ||
              inputId === "metric_demand_absolute_error_bound"
                ? "application/octet-stream"
                : "application/json",
            descriptor,
            byteEncoding:
              inputId === "metric_demand_tensor" ||
              inputId === "metric_demand_absolute_error_bound"
                ? "raw_ieee754_float64_little_endian"
                : "canonical_json_utf8",
            materializationStatus: "missing_required_science",
            canonicalBytesBase64: null,
            sha256: null,
            sizeBytes: null,
            blocker,
          };
        }
        const canonical =
          inputId === "tolerance_policy"
            ? NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON
            : canonicalJson(documents[inputId]);
        const bytes = Buffer.from(canonical, "utf8");
        return {
          ordinal,
          inputId,
          relativePath,
          mediaType: "application/json",
          descriptor,
          byteEncoding: "canonical_json_utf8",
          materializationStatus: "canonical_science_bytes_ready",
          canonicalBytesBase64: bytes.toString("base64"),
          sha256: sha256(bytes),
          sizeBytes: bytes.byteLength,
          blocker: null,
        };
      },
    );
  };

const REFERENCE_SHA256 = sha256(
  Buffer.from(
    canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE),
    "utf8",
  ),
);

const PLAN: Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CONTRACT_VERSION,
  phase: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_PHASE,
  authority: "server_owned_pure_materialization_plan",
  status: "blocked_incomplete_scientific_input_closure",
  referenceBinding: {
    artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
    surrogateId: "conformally_flat_needle_reference",
    referenceSha256: REFERENCE_SHA256,
    semanticRelabelingAllowed: false,
    currentNhm2ShiftLapseMetric: false,
  },
  candidateTarget: {
    candidateId: "nhm2.conformally_flat_needle_scalar_reference.candidate/v1",
    candidateManifestId:
      "nhm2.conformally_flat_needle_scalar_reference.candidate_manifest.pending/v1",
    selectedProfileId: "conformally_flat_needle_reference",
    candidateKind: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
    geometryId: SCIENTIFIC_OBJECT_IDS.geometry,
    quantumStateId: SCIENTIFIC_OBJECT_IDS.quantum_state,
    chartId: SCIENTIFIC_OBJECT_IDS.chart,
    normalizationId: SCIENTIFIC_OBJECT_IDS.normalization,
    tolerancePolicyId:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.policyId,
    smearingFunctionId: SCIENTIFIC_OBJECT_IDS.smearing_definition,
    samplingBasisId: SCIENTIFIC_OBJECT_IDS.sampling_basis,
    nondegeneracyCriterionId:
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
    metricDemandInputId: "metric_demand_tensor",
    metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound",
    metricDemandDerivationReceiptInputId:
      "metric_demand_derivation_receipt",
    sampleCount: 64,
    candidateFrozenAt: null,
    nondegeneracyEstablished: false,
    metricDemandDerivationReceiptVerified: false,
    metricDemandIntervalTraceServerReplayed: false,
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
  },
  expectedInputIds: [
    ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  ],
  inputPlans: buildInputPlans(),
  closure: {
    expectedInputCount: 22,
    readyInputCount: 14,
    missingInputCount: 8,
    complete: false,
    missingInputIds: [
      ...NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_MISSING_INPUT_IDS,
    ],
    candidateManifestCanonicalBytesBase64: null,
    candidateManifestSha256: null,
    candidateManifestSizeBytes: null,
    scientificPresealBytesBase64: null,
    refreezeRequiredAfterScientificClosure: true,
  },
  authorityState: {
    status: "blocked",
    firstBlocker: "metric_demand_tensor_bytes_missing",
    blockers: [...NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_BLOCKERS],
  },
  claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_CLAIM_LOCKS,
};

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN =
  deepFreeze(PLAN);

export const canonicalNhm2ConformallyFlatNeedleScalarCandidatePackPlanJson = (
  value: Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1,
): string => canonicalJson(value);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CANONICAL_JSON =
  canonicalNhm2ConformallyFlatNeedleScalarCandidatePackPlanJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN,
  );

export const NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_SHA256 =
  sha256(
    Buffer.from(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CANONICAL_JSON,
      "utf8",
    ),
  );

const clonePlain = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value));

const sameJson = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);

const strictlyDecodedBase64 = (value: string): Buffer | null => {
  if (
    value.length === 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return null;
  }
  const bytes = Buffer.from(value, "base64");
  return bytes.toString("base64") === value ? bytes : null;
};

const containsForbiddenLeverIdentity = (value: unknown): boolean => {
  if (typeof value === "string") {
    const folded = value.toLocaleLowerCase("en-US");
    return NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS.some(
      (identity) => folded.includes(identity.toLocaleLowerCase("en-US")),
    );
  }
  if (Array.isArray(value)) return value.some(containsForbiddenLeverIdentity);
  return (
    isRecord(value) && Object.values(value).some(containsForbiddenLeverIdentity)
  );
};

const scienceDocumentContainsOperationalPathOrRuntimeField = (
  value: unknown,
): boolean => {
  if (typeof value === "string") {
    return (
      /^(?:[A-Za-z]:[\\/]|\/|\\\\)/.test(value) ||
      /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(value)
    );
  }
  if (Array.isArray(value)) {
    return value.some(scienceDocumentContainsOperationalPathOrRuntimeField);
  }
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    const folded = key.toLocaleLowerCase("en-US");
    const forbiddenKey =
      /(?:^|_)(?:path|directory|output|command|execution|receipt|implementation)(?:$|_)/.test(
        folded,
      );
    return (
      forbiddenKey ||
      scienceDocumentContainsOperationalPathOrRuntimeField(entry)
    );
  });
};

const unique = (values: string[]): string[] => [...new Set(values)];

/**
 * Validates both the exact static plan and every embedded ready science byte
 * sequence. Missing science is intentionally represented by null bytes and
 * cannot be promoted into a candidate-manifest input by this contract.
 */
export const nhm2ConformallyFlatNeedleScalarCandidatePackPlanViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value)) return ["candidate_pack_plan_shape_invalid"];
    if (!isExactPlainJsonDataTree(value)) {
      return ["candidate_pack_plan_noncanonical_object_surface"];
    }
    const violations: string[] = [];
    if (
      !sameJson(value, NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN)
    ) {
      violations.push("candidate_pack_plan_semantic_drift");
    }
    const expectedIds =
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS;
    const actualIds = Array.isArray(value.expectedInputIds)
      ? value.expectedInputIds
      : [];
    const inputPlans = Array.isArray(value.inputPlans) ? value.inputPlans : [];
    if (
      !sameJson(actualIds, expectedIds) ||
      inputPlans.length !== expectedIds.length
    ) {
      violations.push("scientific_input_inventory_invalid");
    }

    const expectedPlans = new Map(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN.inputPlans.map(
        (entry) => [entry.inputId, entry],
      ),
    );
    inputPlans.forEach((entry, ordinal) => {
      if (!isRecord(entry)) {
        violations.push(`input_plan_shape_invalid:${ordinal}`);
        return;
      }
      const inputId = String(entry.inputId);
      const expected = expectedPlans.get(
        inputId as Nhm2SemiclassicalV2ScientificNonSelfInputId,
      );
      if (expected == null || !sameJson(entry, expected)) {
        violations.push(`input_plan_semantic_drift:${inputId}`);
      }
      if (entry.materializationStatus === "missing_required_science") {
        if (
          entry.canonicalBytesBase64 !== null ||
          entry.sha256 !== null ||
          entry.sizeBytes !== null ||
          typeof entry.blocker !== "string"
        ) {
          violations.push(`missing_science_must_not_have_bytes:${inputId}`);
        }
        return;
      }
      if (
        entry.materializationStatus !== "canonical_science_bytes_ready" ||
        typeof entry.canonicalBytesBase64 !== "string" ||
        typeof entry.sha256 !== "string" ||
        !Number.isSafeInteger(entry.sizeBytes) ||
        Number(entry.sizeBytes) <= 0 ||
        entry.blocker !== null
      ) {
        violations.push(`ready_science_binding_invalid:${inputId}`);
        return;
      }
      const bytes = strictlyDecodedBase64(entry.canonicalBytesBase64);
      if (
        bytes == null ||
        bytes.byteLength !== entry.sizeBytes ||
        sha256(bytes) !== entry.sha256
      ) {
        violations.push(`ready_science_hash_or_size_invalid:${inputId}`);
        return;
      }
      let document: unknown;
      try {
        const text = bytes.toString("utf8");
        document = JSON.parse(text);
        if (canonicalJson(document) !== text) {
          violations.push(`science_bytes_noncanonical:${inputId}`);
        }
      } catch {
        violations.push(`science_bytes_noncanonical:${inputId}`);
        return;
      }
      if (containsForbiddenLeverIdentity(document)) {
        violations.push(`declared_lever_identity_forbidden:${inputId}`);
      }
      if (scienceDocumentContainsOperationalPathOrRuntimeField(document)) {
        violations.push(
          `science_bytes_contain_operational_path_or_runtime_fields:${inputId}`,
        );
      }
    });

    if (containsForbiddenLeverIdentity(value)) {
      violations.push("declared_lever_identity_forbidden");
    }
    const closure = isRecord(value.closure) ? value.closure : null;
    if (
      closure == null ||
      closure.complete !== false ||
      closure.candidateManifestCanonicalBytesBase64 !== null ||
      closure.candidateManifestSha256 !== null ||
      closure.candidateManifestSizeBytes !== null ||
      closure.scientificPresealBytesBase64 !== null ||
      closure.refreezeRequiredAfterScientificClosure !== true
    ) {
      violations.push(
        "candidate_manifest_and_preseal_must_remain_unmaterialized",
      );
    }
    const authority = isRecord(value.authorityState)
      ? value.authorityState
      : null;
    if (
      authority == null ||
      authority.status !== "blocked" ||
      authority.firstBlocker !== "metric_demand_tensor_bytes_missing" ||
      !sameJson(
        authority.blockers,
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_BLOCKERS,
      )
    ) {
      violations.push("candidate_pack_authority_not_fail_closed");
    }
    const locks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      locks == null ||
      Object.keys(locks).length !==
        Object.keys(
          NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_CLAIM_LOCKS,
        ).length ||
      Object.values(locks).some((entry) => entry !== false)
    ) {
      violations.push("claim_locks_not_all_false");
    }
    return unique(violations);
  } catch {
    return ["candidate_pack_plan_shape_invalid"];
  }
};

export const isNhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 =>
  nhm2ConformallyFlatNeedleScalarCandidatePackPlanViolations(value).length ===
  0;

export const cloneNhm2ConformallyFlatNeedleScalarCandidatePackPlan = () =>
  clonePlain(
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN,
  ) as Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1;
