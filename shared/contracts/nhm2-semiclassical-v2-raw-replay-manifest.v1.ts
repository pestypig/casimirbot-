import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
  NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA,
  NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY,
  type Nhm2SemiclassicalConstraintBracketId,
} from "./nhm2-semiclassical-state-realizability.v2";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID =
  "nhm2.semiclassical_v2_raw_replay_manifest" as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_raw_replay_manifest/v1" as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_SAMPLE_COUNT = 64;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS = 3;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM =
  "sha256_canonical_semiclassical_v2_input_inventory_v1" as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING =
  "frozen_input_id_order_v1" as const;
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID =
  "nhm2.semiclassical_v2_approved_replay_policy" as const;
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_approved_replay_policy/v1" as const;
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID =
  "nhm2.server_owned.semiclassical_v2.diagnostic_replay/v1" as const;

export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS = [
  "candidate_manifest",
  "geometry",
  "quantum_state",
  "chart",
  "normalization",
  "tolerance_policy",
  "smearing_definition",
  "sampling_basis",
  "field_model",
  "lagrangian",
  "field_equations",
  "boundary_conditions",
  "state_construction",
  "renormalization_prescription",
  "renormalization_counterterms",
  "finite_renormalization_freedom",
  "constraint_formulation",
  "regulator_definition",
  "operator_ordering",
  "classical_structure_functions",
  "metric_demand_tensor",
] as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS = [
  "implementation_source",
  "dependency_lock",
  "executable",
] as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS = [
  ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
  ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS,
] as const;
export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS = [
  "declared_lever_tensor",
  "candidate_declared_tile_effective_tensor_lever_model",
] as const;

export const NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS = Object.freeze({
  finiteness: "every_decoded_float64_value_is_finite",
  smearingNormalization:
    "all_weights_nonnegative_and_abs(sum(weights)-1)<=smearing_weight_sum_tolerance",
  exchangeSymmetry: NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY,
  psd:
    "S=diag(sqrt(point_weights))tensor_diag(sqrt([1,2,2,2,1,2,2,1,2,1]));C_sym=0.5*(S*connected_noise*S+(S*connected_noise*S)^T);certify_C_sym+psd_tolerance_SI*I_is_PSD_by_symmetric_semidefinite_cholesky_or_pivoted_LDLT",
  maximumEigenvalueUpper95:
    "U_w=abs(S)*noise_absolute_uncertainty95*abs(S);lambda_max_upper95=max_i(C_sym[i,i]+U_w[i,i]+sum_j_ne_i(abs(C_sym[i,j])+U_w[i,j]))",
  symmetricTensorBasis:
    "orthonormal_symmetric_tensor_component_multiplicities=[1,2,2,2,1,2,2,1,2,1]",
  fluctuationRatio: NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA,
  meanNormalization: NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD,
  bracketResidual:
    "normalized_residual=normalized_computed-normalized_classical_structure_function_target",
  antisymmetry:
    "normalized_antisymmetry_residual=normalized_forward+normalized_reverse",
  jacobi:
    "normalized_jacobi_residual=normalized_term_1+normalized_term_2+normalized_term_3",
  upper95:
    "upper95=linf(abs(residual)+abs(pointwise_absolute_uncertainty95))",
  regulatorConvergence:
    "q_k=max_i(abs(residual_k[i])+absolute_uncertainty95_k[i]);p_k=log(q_k/q_k+1)/log(scale_k/scale_k+1);observed_p=min(p_k)",
} as const);

export const NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES =
  Object.freeze([1, 2, 2, 2, 1, 2, 2, 1, 2, 1] as const);

export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY = Object.freeze({
  artifactId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  policyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  authority: "server_owned" as const,
  maturity: "diagnostic_only" as const,
  minimumSampleCount:
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_SAMPLE_COUNT,
  minimumRegulatorLevelCount:
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS,
  minimumMetricDemandFrobeniusSI: 1e-12,
  units: Object.freeze({
    noiseKernel: "(J/m^3)^2" as const,
    meanRset: "J/m^3" as const,
    smearingWeights: "dimensionless" as const,
    normalizedConstraints: "dimensionless" as const,
    regulatorScale: "dimensionless" as const,
  }),
  symmetricTensorMultiplicities:
    NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES,
  formulas: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
  tolerances: Object.freeze({
    smearingWeightSumAbsolute: 1e-12,
    exchangeSymmetryUpper95SI: 1e-12,
    psdNegativeEigenvalueSI: 1e-12,
    meanNormalizationFloorSI: 1e-12,
    fluctuationToMeanRatioUpper95: 1,
    bracketResidualUpper95: 0.1,
    antisymmetryResidualUpper95: 0.1,
    jacobiResidualUpper95: 0.1,
    regulatorResidualUpper95: 0.1,
    regulatorMonotonicityAbsolute: 1e-12,
    minimumRegulatorConvergenceOrder: 1,
    float64RecomputeAbsolute: 1e-12,
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

export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON =
  JSON.stringify(canonicalizeJson(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY));
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING =
  Object.freeze({
    artifactId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
    policyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
    sha256: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
    sizeBytes: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export type Nhm2SemiclassicalV2RawReplayImplementationRole =
  | "primary"
  | "independent";
export type Nhm2SemiclassicalV2RawReplayInputId =
  (typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS)[number];

export type Nhm2SemiclassicalV2RawReplayInputFileV1 = {
  inputId: Exclude<
    Nhm2SemiclassicalV2RawReplayInputId,
    "metric_demand_tensor"
  >;
  path: string;
  sha256: string;
  sizeBytes: number;
  mediaType: string;
  freshness: "preexisting_unchanged";
  observedAt: string;
};

export type Nhm2SemiclassicalV2RawReplayMetricDemandInputFileV1 = Omit<
  Nhm2SemiclassicalV2RawReplayInputFileV1,
  "inputId"
> & {
  inputId: "metric_demand_tensor";
  dtype: "float64";
  binaryEncoding: "raw_ieee754";
  endianness: "little";
  shape: [number, 10];
  storageOrder: "row-major";
  componentOrder: string[];
  unit: "J/m^3";
};

export type Nhm2SemiclassicalV2RawReplayInputEntryV1 =
  | Nhm2SemiclassicalV2RawReplayInputFileV1
  | Nhm2SemiclassicalV2RawReplayMetricDemandInputFileV1;

export type Nhm2SemiclassicalV2RawReplayInputRootsV1 = {
  scientificRootDirectory: string;
  implementationRootDirectory: string;
};

export type Nhm2SemiclassicalV2RawReplayArrayV1 = {
  role: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  freshness: "new";
  observedAt: string;
  dtype: "float64";
  binaryEncoding: "raw_ieee754";
  endianness: "little";
  shape: number[];
  storageOrder: "row-major";
  componentOrder: string[];
  unit: string;
};

export type Nhm2SemiclassicalV2RawReplayManifestV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION;
  manifestFrozenAt: string;
  generatedAt: string;
  candidate: {
    candidateId: string;
    candidateManifestId: string;
    selectedProfileId: string;
    candidateKind: "frozen_nondegenerate_nhm2_semiclassical_candidate";
    geometryId: string;
    quantumStateId: string;
    chartId: string;
    normalizationId: string;
    tolerancePolicyId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID;
    smearingFunctionId: string;
    samplingBasisId: string;
    nondegeneracyCriterionId: string;
    metricDemandInputId: "metric_demand_tensor";
    minimumMetricDemandFrobeniusSI: number;
    sampleCount: number;
    frozenAt: string;
  };
  sourceProvenance: {
    sourceMode: "state_derived_not_declared_lever";
    meanRsetOrigin: "renormalized_quantum_state_expectation_value";
    noiseKernelOrigin: "connected_symmetrized_quantum_state_two_point_function";
    declaredLeverTensorUsed: false;
    inputClosureExcludesDeclaredLeverTensor: true;
  };
  numericalPolicy: {
    frozenAt: string;
    formulas: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS;
    units: {
      noiseKernel: "(J/m^3)^2";
      meanRset: "J/m^3";
      smearingWeights: "dimensionless";
      normalizedConstraints: "dimensionless";
      regulatorScale: "dimensionless";
    };
    tolerances: {
      smearingWeightSumAbsolute: number;
      exchangeSymmetryUpper95SI: number;
      psdNegativeEigenvalueSI: number;
      meanNormalizationFloorSI: number;
      fluctuationToMeanRatioUpper95: number;
      bracketResidualUpper95: number;
      antisymmetryResidualUpper95: number;
      jacobiResidualUpper95: number;
      regulatorResidualUpper95: number;
      regulatorMonotonicityAbsolute: number;
      minimumRegulatorConvergenceOrder: number;
      float64RecomputeAbsolute: number;
    };
  };
  implementation: {
    comparisonPairId: string;
    role: Nhm2SemiclassicalV2RawReplayImplementationRole;
    implementationId: string;
    implementationVersion: string;
    sourceIdentity: {
      identityId: string;
      inputId: "implementation_source";
      sha256: string;
    };
    dependencyIdentity: {
      identityId: string;
      inputId: "dependency_lock";
      sha256: string;
    };
    executableIdentity: {
      identityId: string;
      inputId: "executable";
      sha256: string;
    };
    inputExposure: {
      scientificRoot: "read_only_exact_inventory";
      implementationRoot: "executor_owned_toolchain_not_data_input";
      counterpartOutputs: "not_mounted";
      ambientRepository: "not_mounted";
    };
  };
  execution: {
    commitSha: string;
    command: string;
    argv: string[];
    workingDirectory: string;
    outputDirectory: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    exitCode: 0;
    terminationSignal: null;
  };
  inputClosure: {
    frozenBeforeExecution: true;
    scientificRootDirectory: string;
    implementationRootDirectory: string;
    algorithm: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM;
    ordering: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING;
    entries: Nhm2SemiclassicalV2RawReplayInputEntryV1[];
    excludedInputIds: typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS;
    scientificClosureSha256: string;
    completeClosureSha256: string;
  };
  arrays: {
    noiseKernel: Nhm2SemiclassicalV2RawReplayArrayV1;
    noiseKernelAbsoluteUncertainty95: Nhm2SemiclassicalV2RawReplayArrayV1;
    meanRset: Nhm2SemiclassicalV2RawReplayArrayV1;
    smearingWeights: Nhm2SemiclassicalV2RawReplayArrayV1;
    brackets: Array<{
      bracketId: Nhm2SemiclassicalConstraintBracketId;
      computed: Nhm2SemiclassicalV2RawReplayArrayV1;
      target: Nhm2SemiclassicalV2RawReplayArrayV1;
      residual: Nhm2SemiclassicalV2RawReplayArrayV1;
      absoluteUncertainty95: Nhm2SemiclassicalV2RawReplayArrayV1;
    }>;
    antisymmetry: {
      forward: Nhm2SemiclassicalV2RawReplayArrayV1;
      reverse: Nhm2SemiclassicalV2RawReplayArrayV1;
      residual: Nhm2SemiclassicalV2RawReplayArrayV1;
      absoluteUncertainty95: Nhm2SemiclassicalV2RawReplayArrayV1;
    };
    jacobi: {
      term1: Nhm2SemiclassicalV2RawReplayArrayV1;
      term2: Nhm2SemiclassicalV2RawReplayArrayV1;
      term3: Nhm2SemiclassicalV2RawReplayArrayV1;
      residual: Nhm2SemiclassicalV2RawReplayArrayV1;
      absoluteUncertainty95: Nhm2SemiclassicalV2RawReplayArrayV1;
    };
    regulatorLevels: Array<{
      ordinal: number;
      levelId: string;
      scale: number;
      residual: Nhm2SemiclassicalV2RawReplayArrayV1;
      absoluteUncertainty95: Nhm2SemiclassicalV2RawReplayArrayV1;
    }>;
  };
  claimLocks: {
    diagnosticOnly: true;
    replayAuthority: false;
    theoryGraphPromotion: false;
    theoryClosure: false;
    physicalViability: false;
    propulsion: false;
    transport: false;
    routeEta: false;
    certifiedSpeed: false;
    empiricalValidation: false;
  };
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "manifestFrozenAt",
  "generatedAt",
  "candidate",
  "sourceProvenance",
  "numericalPolicy",
  "implementation",
  "execution",
  "inputClosure",
  "arrays",
  "claimLocks",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestId",
  "selectedProfileId",
  "candidateKind",
  "geometryId",
  "quantumStateId",
  "chartId",
  "normalizationId",
  "tolerancePolicyId",
  "smearingFunctionId",
  "samplingBasisId",
  "nondegeneracyCriterionId",
  "metricDemandInputId",
  "minimumMetricDemandFrobeniusSI",
  "sampleCount",
  "frozenAt",
] as const;
const SOURCE_PROVENANCE_KEYS = [
  "sourceMode",
  "meanRsetOrigin",
  "noiseKernelOrigin",
  "declaredLeverTensorUsed",
  "inputClosureExcludesDeclaredLeverTensor",
] as const;
const NUMERICAL_POLICY_KEYS = ["frozenAt", "formulas", "units", "tolerances"] as const;
const FORMULA_KEYS = Object.keys(NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS);
const UNIT_KEYS = [
  "noiseKernel",
  "meanRset",
  "smearingWeights",
  "normalizedConstraints",
  "regulatorScale",
] as const;
const TOLERANCE_KEYS = [
  "smearingWeightSumAbsolute",
  "exchangeSymmetryUpper95SI",
  "psdNegativeEigenvalueSI",
  "meanNormalizationFloorSI",
  "fluctuationToMeanRatioUpper95",
  "bracketResidualUpper95",
  "antisymmetryResidualUpper95",
  "jacobiResidualUpper95",
  "regulatorResidualUpper95",
  "regulatorMonotonicityAbsolute",
  "minimumRegulatorConvergenceOrder",
  "float64RecomputeAbsolute",
] as const;
const IMPLEMENTATION_KEYS = [
  "comparisonPairId",
  "role",
  "implementationId",
  "implementationVersion",
  "sourceIdentity",
  "dependencyIdentity",
  "executableIdentity",
  "inputExposure",
] as const;
const IMPLEMENTATION_IDENTITY_KEYS = ["identityId", "inputId", "sha256"] as const;
const INPUT_EXPOSURE_KEYS = [
  "scientificRoot",
  "implementationRoot",
  "counterpartOutputs",
  "ambientRepository",
] as const;
const EXECUTION_KEYS = [
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
] as const;
const INPUT_CLOSURE_KEYS = [
  "frozenBeforeExecution",
  "scientificRootDirectory",
  "implementationRootDirectory",
  "algorithm",
  "ordering",
  "entries",
  "excludedInputIds",
  "scientificClosureSha256",
  "completeClosureSha256",
] as const;
const INPUT_KEYS = [
  "inputId",
  "path",
  "sha256",
  "sizeBytes",
  "mediaType",
  "freshness",
  "observedAt",
] as const;
const METRIC_DEMAND_INPUT_KEYS = [
  ...INPUT_KEYS,
  "dtype",
  "binaryEncoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "unit",
] as const;
const ARRAYS_KEYS = [
  "noiseKernel",
  "noiseKernelAbsoluteUncertainty95",
  "meanRset",
  "smearingWeights",
  "brackets",
  "antisymmetry",
  "jacobi",
  "regulatorLevels",
] as const;
const ARRAY_KEYS = [
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
  "unit",
] as const;
const BRACKET_KEYS = [
  "bracketId",
  "computed",
  "target",
  "residual",
  "absoluteUncertainty95",
] as const;
const ANTISYMMETRY_KEYS = [
  "forward",
  "reverse",
  "residual",
  "absoluteUncertainty95",
] as const;
const JACOBI_KEYS = [
  "term1",
  "term2",
  "term3",
  "residual",
  "absoluteUncertainty95",
] as const;
const REGULATOR_LEVEL_KEYS = [
  "ordinal",
  "levelId",
  "scale",
  "residual",
  "absoluteUncertainty95",
] as const;
const CLAIM_LOCK_KEYS = [
  "diagnosticOnly",
  "replayAuthority",
  "theoryGraphPromotion",
  "theoryClosure",
  "physicalViability",
  "propulsion",
  "transport",
  "routeEta",
  "certifiedSpeed",
  "empiricalValidation",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
};
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  value.trim() === value &&
  IDENTIFIER.test(value) &&
  !value.includes("//");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const isGitSha = (value: unknown): value is string =>
  typeof value === "string" && GIT_SHA.test(value) && !/^0+$/.test(value);
const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
};
const isPortableRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  !value.includes("//") &&
  value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
const portableRootsOverlap = (left: string, right: string): boolean =>
  left === right ||
  left.startsWith(`${right}/`) ||
  right.startsWith(`${left}/`);
const isPositiveFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const sameStrings = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);
const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
const unique = (values: string[]): string[] => [...new Set(values)];

const INPUT_CLOSURE_DOMAIN = "nhm2-semiclassical-v2-raw-replay-input-closure/v1\n";

export const computeNhm2SemiclassicalV2RawReplayInputClosureSha256 = (
  entries: readonly Nhm2SemiclassicalV2RawReplayInputEntryV1[],
  scope: "scientific" | "complete",
  roots: Nhm2SemiclassicalV2RawReplayInputRootsV1,
): string => {
  const included =
    scope === "scientific"
      ? entries.filter((entry) =>
          (NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS as readonly string[]).includes(
            entry.inputId,
          ),
        )
      : [...entries];
  const payload = included.map((entry) => {
    const metricDemand =
      entry.inputId === "metric_demand_tensor"
        ? (entry as Nhm2SemiclassicalV2RawReplayMetricDemandInputFileV1)
        : null;
    return [
      entry.inputId,
      entry.path,
      entry.sha256,
      entry.sizeBytes,
      entry.mediaType,
      entry.freshness,
      entry.observedAt,
      metricDemand?.dtype ?? null,
      metricDemand?.binaryEncoding ?? null,
      metricDemand?.endianness ?? null,
      metricDemand?.shape ?? null,
      metricDemand?.storageOrder ?? null,
      metricDemand?.componentOrder ?? null,
      metricDemand?.unit ?? null,
    ];
  });
  return createHash("sha256")
    .update(INPUT_CLOSURE_DOMAIN, "utf8")
    .update(scope, "utf8")
    .update("\n", "utf8")
    .update(roots.scientificRootDirectory, "utf8")
    .update("\n", "utf8")
    .update(
      scope === "complete" ? roots.implementationRootDirectory : "",
      "utf8",
    )
    .update("\n", "utf8")
    .update(JSON.stringify(payload), "utf8")
    .digest("hex");
};

type ArrayExpectation = {
  role: string;
  shape: readonly number[];
  componentOrder: readonly string[];
  unit: string;
};

const rawArrayViolations = (
  value: unknown,
  pointer: string,
  expected: ArrayExpectation,
  outputDirectory: string,
  completedAtMs: number,
  generatedAtMs: number,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ARRAY_KEYS)) {
    return [`array_shape_invalid:${pointer}`];
  }
  const violations: string[] = [];
  const expectedSize = expected.shape.reduce((product, axis) => product * axis, 1) * 8;
  if (
    value.role !== expected.role ||
    !isPortableRelativePath(value.path) ||
    typeof value.path !== "string" ||
    !value.path.startsWith(`${outputDirectory}/`) ||
    !isSha256(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes !== expectedSize ||
    value.freshness !== "new"
  ) {
    violations.push(`array_file_binding_invalid:${pointer}`);
  }
  const observedAtMs = isIsoTimestamp(value.observedAt)
    ? Date.parse(value.observedAt)
    : Number.NaN;
  if (
    !Number.isFinite(observedAtMs) ||
    observedAtMs < completedAtMs ||
    observedAtMs > generatedAtMs
  ) {
    violations.push(`array_freshness_interval_invalid:${pointer}`);
  }
  if (
    value.dtype !== "float64" ||
    value.binaryEncoding !== "raw_ieee754" ||
    value.endianness !== "little" ||
    value.storageOrder !== "row-major"
  ) {
    violations.push(`array_encoding_invalid:${pointer}`);
  }
  if (
    !Array.isArray(value.shape) ||
    value.shape.length !== expected.shape.length ||
    !value.shape.every((axis, index) => axis === expected.shape[index])
  ) {
    violations.push(`array_shape_axes_invalid:${pointer}`);
  }
  if (!sameStrings(value.componentOrder, expected.componentOrder)) {
    violations.push(`array_component_order_invalid:${pointer}`);
  }
  if (value.unit !== expected.unit) {
    violations.push(`array_unit_invalid:${pointer}`);
  }
  return violations;
};

const implementationIdentityViolations = (
  value: unknown,
  pointer: string,
  expectedInputId: (typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_IMPLEMENTATION_INPUT_IDS)[number],
  entriesById: Map<string, Nhm2SemiclassicalV2RawReplayInputEntryV1>,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, IMPLEMENTATION_IDENTITY_KEYS)) {
    return [`implementation_identity_shape_invalid:${pointer}`];
  }
  if (
    !isIdentifier(value.identityId) ||
    value.inputId !== expectedInputId ||
    !isSha256(value.sha256) ||
    entriesById.get(expectedInputId)?.sha256 !== value.sha256
  ) {
    return [`implementation_identity_binding_invalid:${pointer}`];
  }
  return [];
};

export const nhm2SemiclassicalV2RawReplayManifestViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
      return ["manifest_shape_invalid"];
    }
    const violations: string[] = [];
    if (
      value.artifactId !== NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID ||
      value.contractVersion !==
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION
    ) {
      violations.push("manifest_identity_invalid");
    }

    const frozenAtMs = isIsoTimestamp(value.manifestFrozenAt)
      ? Date.parse(value.manifestFrozenAt)
      : Number.NaN;
    const generatedAtMs = isIsoTimestamp(value.generatedAt)
      ? Date.parse(value.generatedAt)
      : Number.NaN;

    const candidate = isRecord(value.candidate) ? value.candidate : null;
    if (candidate == null || !hasExactKeys(candidate, CANDIDATE_KEYS)) {
      violations.push("candidate_shape_invalid");
    } else {
      for (const key of [
        "candidateId",
        "candidateManifestId",
        "selectedProfileId",
        "geometryId",
        "quantumStateId",
        "chartId",
        "normalizationId",
        "tolerancePolicyId",
        "smearingFunctionId",
        "samplingBasisId",
        "nondegeneracyCriterionId",
      ]) {
        if (!isIdentifier(candidate[key])) violations.push(`candidate_identity_invalid:/${key}`);
      }
      if (
        candidate.candidateKind !==
          "frozen_nondegenerate_nhm2_semiclassical_candidate" ||
        candidate.metricDemandInputId !== "metric_demand_tensor" ||
        candidate.tolerancePolicyId !==
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID ||
        candidate.minimumMetricDemandFrobeniusSI !==
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI ||
        !Number.isSafeInteger(candidate.sampleCount) ||
        Number(candidate.sampleCount) < NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_SAMPLE_COUNT ||
        candidate.frozenAt !== value.manifestFrozenAt
      ) {
        violations.push("candidate_freeze_invalid");
      }
    }

    const sourceProvenance = isRecord(value.sourceProvenance)
      ? value.sourceProvenance
      : null;
    if (
      sourceProvenance == null ||
      !hasExactKeys(sourceProvenance, SOURCE_PROVENANCE_KEYS) ||
      sourceProvenance.sourceMode !== "state_derived_not_declared_lever" ||
      sourceProvenance.meanRsetOrigin !==
        "renormalized_quantum_state_expectation_value" ||
      sourceProvenance.noiseKernelOrigin !==
        "connected_symmetrized_quantum_state_two_point_function" ||
      sourceProvenance.declaredLeverTensorUsed !== false ||
      sourceProvenance.inputClosureExcludesDeclaredLeverTensor !== true
    ) {
      violations.push("source_provenance_invalid");
    }

    const numericalPolicy = isRecord(value.numericalPolicy)
      ? value.numericalPolicy
      : null;
    if (
      numericalPolicy == null ||
      !hasExactKeys(numericalPolicy, NUMERICAL_POLICY_KEYS)
    ) {
      violations.push("numerical_policy_shape_invalid");
    } else {
      const formulas = isRecord(numericalPolicy.formulas)
        ? numericalPolicy.formulas
        : null;
      const units = isRecord(numericalPolicy.units) ? numericalPolicy.units : null;
      const tolerances = isRecord(numericalPolicy.tolerances)
        ? numericalPolicy.tolerances
        : null;
      if (
        numericalPolicy.frozenAt !== value.manifestFrozenAt ||
        formulas == null ||
        !hasExactKeys(formulas, FORMULA_KEYS) ||
        !FORMULA_KEYS.every(
          (key) =>
            formulas[key] ===
            NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.formulas[
              key as keyof typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.formulas
            ],
        )
      ) {
        violations.push("numerical_policy_formula_binding_invalid");
      }
      if (
        units == null ||
        !hasExactKeys(units, UNIT_KEYS) ||
        !UNIT_KEYS.every(
          (key) =>
            units[key] ===
            NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.units[key],
        )
      ) {
        violations.push("numerical_policy_units_invalid");
      }
      if (
        tolerances == null ||
        !hasExactKeys(tolerances, TOLERANCE_KEYS) ||
        !TOLERANCE_KEYS.every(
          (key) =>
            tolerances[key] ===
            NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances[key],
        )
      ) {
        violations.push("numerical_policy_tolerances_invalid");
      }
    }

    const execution = isRecord(value.execution) ? value.execution : null;
    let startedAtMs = Number.NaN;
    let completedAtMs = Number.NaN;
    let outputDirectory = "__invalid_output_directory__";
    if (execution == null || !hasExactKeys(execution, EXECUTION_KEYS)) {
      violations.push("execution_shape_invalid");
    } else {
      startedAtMs = isIsoTimestamp(execution.startedAt)
        ? Date.parse(execution.startedAt)
        : Number.NaN;
      completedAtMs = isIsoTimestamp(execution.completedAt)
        ? Date.parse(execution.completedAt)
        : Number.NaN;
      outputDirectory =
        typeof execution.outputDirectory === "string"
          ? execution.outputDirectory
          : outputDirectory;
      if (
        !isGitSha(execution.commitSha) ||
        typeof execution.command !== "string" ||
        execution.command.trim() !== execution.command ||
        execution.command.length === 0 ||
        !Array.isArray(execution.argv) ||
        execution.argv.length === 0 ||
        !execution.argv.every(
          (entry) =>
            typeof entry === "string" && entry.length > 0 && entry.length <= 4096,
        ) ||
        !(
          execution.workingDirectory === "." ||
          isPortableRelativePath(execution.workingDirectory)
        ) ||
        !isPortableRelativePath(execution.outputDirectory) ||
        execution.exitCode !== 0 ||
        execution.terminationSignal !== null
      ) {
        violations.push("execution_binding_invalid");
      }
      if (
        !Number.isFinite(startedAtMs) ||
        !Number.isFinite(completedAtMs) ||
        !Number.isSafeInteger(execution.durationMs) ||
        Number(execution.durationMs) <= 0 ||
        completedAtMs - startedAtMs !== execution.durationMs ||
        !Number.isFinite(frozenAtMs) ||
        frozenAtMs > startedAtMs ||
        !Number.isFinite(generatedAtMs) ||
        generatedAtMs < completedAtMs
      ) {
        violations.push("execution_interval_invalid");
      }
    }

    const inputClosure = isRecord(value.inputClosure) ? value.inputClosure : null;
    const entriesById = new Map<string, Nhm2SemiclassicalV2RawReplayInputEntryV1>();
    if (inputClosure == null || !hasExactKeys(inputClosure, INPUT_CLOSURE_KEYS)) {
      violations.push("input_closure_shape_invalid");
    } else {
      const entries = Array.isArray(inputClosure.entries)
        ? inputClosure.entries
        : [];
      const scientificRootDirectory =
        typeof inputClosure.scientificRootDirectory === "string"
          ? inputClosure.scientificRootDirectory
          : "__invalid_scientific_input_root__";
      const implementationRootDirectory =
        typeof inputClosure.implementationRootDirectory === "string"
          ? inputClosure.implementationRootDirectory
          : "__invalid_implementation_input_root__";
      if (
        inputClosure.frozenBeforeExecution !== true ||
        !isPortableRelativePath(inputClosure.scientificRootDirectory) ||
        !isPortableRelativePath(inputClosure.implementationRootDirectory) ||
        inputClosure.scientificRootDirectory ===
          inputClosure.implementationRootDirectory ||
        inputClosure.algorithm !==
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM ||
        inputClosure.ordering !== NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING ||
        entries.length !== NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.length
      ) {
        violations.push("input_closure_policy_invalid");
      }
      if (
        !isPortableRelativePath(scientificRootDirectory) ||
        !isPortableRelativePath(implementationRootDirectory) ||
        !isPortableRelativePath(outputDirectory) ||
        portableRootsOverlap(
          scientificRootDirectory,
          implementationRootDirectory,
        ) ||
        portableRootsOverlap(scientificRootDirectory, outputDirectory) ||
        portableRootsOverlap(implementationRootDirectory, outputDirectory)
      ) {
        violations.push("root_topology_invalid");
      }
      entries.forEach((entry, index) => {
        const pointer = `/inputClosure/entries/${index}`;
        const expectedId = NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS[index];
        const expectedRoot = (
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS as readonly string[]
        ).includes(String(expectedId))
          ? scientificRootDirectory
          : implementationRootDirectory;
        const expectedKeys =
          expectedId === "metric_demand_tensor"
            ? METRIC_DEMAND_INPUT_KEYS
            : INPUT_KEYS;
        if (!isRecord(entry) || !hasExactKeys(entry, expectedKeys)) {
          violations.push(`input_shape_invalid:${pointer}`);
          return;
        }
        const observedAtMs = isIsoTimestamp(entry.observedAt)
          ? Date.parse(entry.observedAt)
          : Number.NaN;
        if (
          entry.inputId !== expectedId ||
          !isPortableRelativePath(entry.path) ||
          typeof entry.path !== "string" ||
          !entry.path.startsWith(`${expectedRoot}/`) ||
          !isSha256(entry.sha256) ||
          !Number.isSafeInteger(entry.sizeBytes) ||
          Number(entry.sizeBytes) <= 0 ||
          typeof entry.mediaType !== "string" ||
          entry.mediaType.length === 0 ||
          entry.freshness !== "preexisting_unchanged"
        ) {
          violations.push(`input_binding_invalid:${pointer}`);
        }
        if (!Number.isFinite(observedAtMs) || observedAtMs > frozenAtMs) {
          violations.push(`input_freshness_interval_invalid:${pointer}`);
        }
        if (
          expectedId === "metric_demand_tensor" &&
          (entry.dtype !== "float64" ||
            entry.binaryEncoding !== "raw_ieee754" ||
            entry.endianness !== "little" ||
            entry.storageOrder !== "row-major" ||
            !Array.isArray(entry.shape) ||
            entry.shape.length !== 2 ||
            entry.shape[0] !== (candidate?.sampleCount ?? Number.NaN) ||
            entry.shape[1] !== NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
            !sameStrings(entry.componentOrder, NHM2_SEMICLASSICAL_TENSOR_COMPONENTS) ||
            entry.unit !== "J/m^3" ||
            entry.sizeBytes !==
              Number(candidate?.sampleCount ?? 0) *
                NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length *
                8)
        ) {
          violations.push(`metric_demand_input_descriptor_invalid:${pointer}`);
        }
        if (typeof entry.inputId === "string") {
          entriesById.set(
            entry.inputId,
            entry as Nhm2SemiclassicalV2RawReplayInputEntryV1,
          );
        }
      });
      if (
        entriesById.size !== NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.length
      ) {
        violations.push("input_ids_not_exact_unique");
      }
      const tolerancePolicyInput = entriesById.get("tolerance_policy");
      if (
        tolerancePolicyInput == null ||
        tolerancePolicyInput.sha256 !==
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256 ||
        tolerancePolicyInput.sizeBytes !==
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES ||
        tolerancePolicyInput.mediaType !== "application/json"
      ) {
        violations.push("approved_tolerance_policy_input_binding_invalid");
      }
      if (
        entries.length === NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.length &&
        inputClosure.scientificClosureSha256 !==
          computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
            entries as Nhm2SemiclassicalV2RawReplayInputEntryV1[],
            "scientific",
            { scientificRootDirectory, implementationRootDirectory },
          )
      ) {
        violations.push("scientific_input_closure_sha256_mismatch");
      }
      if (
        entries.length === NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.length &&
        inputClosure.completeClosureSha256 !==
          computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
            entries as Nhm2SemiclassicalV2RawReplayInputEntryV1[],
            "complete",
            { scientificRootDirectory, implementationRootDirectory },
          )
      ) {
        violations.push("complete_input_closure_sha256_mismatch");
      }
      if (
        !sameStrings(
          inputClosure.excludedInputIds,
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
        ) ||
        entries.some(
          (entry) =>
            isRecord(entry) &&
            (NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS as readonly string[]).includes(
              String(entry.inputId),
            ),
        )
      ) {
        violations.push("declared_lever_input_exclusion_invalid");
      }
    }

    const implementation = isRecord(value.implementation)
      ? value.implementation
      : null;
    if (
      implementation == null ||
      !hasExactKeys(implementation, IMPLEMENTATION_KEYS)
    ) {
      violations.push("implementation_shape_invalid");
    } else {
      if (
        !isIdentifier(implementation.comparisonPairId) ||
        (implementation.role !== "primary" && implementation.role !== "independent") ||
        !isIdentifier(implementation.implementationId) ||
        !isIdentifier(implementation.implementationVersion)
      ) {
        violations.push("implementation_identity_invalid");
      }
      const inputExposure = isRecord(implementation.inputExposure)
        ? implementation.inputExposure
        : null;
      if (
        inputExposure == null ||
        !hasExactKeys(inputExposure, INPUT_EXPOSURE_KEYS) ||
        inputExposure.scientificRoot !== "read_only_exact_inventory" ||
        inputExposure.implementationRoot !==
          "executor_owned_toolchain_not_data_input" ||
        inputExposure.counterpartOutputs !== "not_mounted" ||
        inputExposure.ambientRepository !== "not_mounted"
      ) {
        violations.push("implementation_input_exposure_invalid");
      }
      violations.push(
        ...implementationIdentityViolations(
          implementation.sourceIdentity,
          "/implementation/sourceIdentity",
          "implementation_source",
          entriesById,
        ),
        ...implementationIdentityViolations(
          implementation.dependencyIdentity,
          "/implementation/dependencyIdentity",
          "dependency_lock",
          entriesById,
        ),
        ...implementationIdentityViolations(
          implementation.executableIdentity,
          "/implementation/executableIdentity",
          "executable",
          entriesById,
        ),
      );
      const identities = [
        implementation.implementationId,
        isRecord(implementation.sourceIdentity)
          ? implementation.sourceIdentity.identityId
          : null,
        isRecord(implementation.dependencyIdentity)
          ? implementation.dependencyIdentity.identityId
          : null,
        isRecord(implementation.executableIdentity)
          ? implementation.executableIdentity.identityId
          : null,
      ];
      const hashes = [
        isRecord(implementation.sourceIdentity)
          ? implementation.sourceIdentity.sha256
          : null,
        isRecord(implementation.dependencyIdentity)
          ? implementation.dependencyIdentity.sha256
          : null,
        isRecord(implementation.executableIdentity)
          ? implementation.executableIdentity.sha256
          : null,
      ];
      if (new Set(identities).size !== identities.length || new Set(hashes).size !== hashes.length) {
        violations.push("implementation_internal_identities_not_distinct");
      }
    }

    const arrays = isRecord(value.arrays) ? value.arrays : null;
    const sampleCount =
      candidate != null && Number.isSafeInteger(candidate.sampleCount)
        ? Number(candidate.sampleCount)
        : 0;
    const outputPaths: string[] = [];
    const addArray = (
      array: unknown,
      pointer: string,
      expected: ArrayExpectation,
    ): void => {
      violations.push(
        ...rawArrayViolations(
          array,
          pointer,
          expected,
          outputDirectory,
          completedAtMs,
          generatedAtMs,
        ),
      );
      if (isRecord(array) && typeof array.path === "string") outputPaths.push(array.path);
    };
    const constraintExpectation = (role: string): ArrayExpectation => ({
      role,
      shape: [sampleCount, NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER.length],
      componentOrder: NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
      unit: "dimensionless",
    });
    if (arrays == null || !hasExactKeys(arrays, ARRAYS_KEYS)) {
      violations.push("arrays_shape_invalid");
    } else {
      addArray(arrays.noiseKernel, "/arrays/noiseKernel", {
        role: "noise_kernel",
        shape: [sampleCount, sampleCount, NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER.length],
        componentOrder: NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        unit: "(J/m^3)^2",
      });
      addArray(
        arrays.noiseKernelAbsoluteUncertainty95,
        "/arrays/noiseKernelAbsoluteUncertainty95",
        {
          role: "noise_kernel_absolute_uncertainty95",
          shape: [
            sampleCount,
            sampleCount,
            NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER.length,
          ],
          componentOrder: NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
          unit: "(J/m^3)^2",
        },
      );
      addArray(arrays.meanRset, "/arrays/meanRset", {
        role: "mean_rset",
        shape: [sampleCount, NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length],
        componentOrder: NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
        unit: "J/m^3",
      });
      addArray(arrays.smearingWeights, "/arrays/smearingWeights", {
        role: "smearing_weights",
        shape: [sampleCount],
        componentOrder: ["weight"],
        unit: "dimensionless",
      });

      const brackets = Array.isArray(arrays.brackets) ? arrays.brackets : [];
      if (brackets.length !== NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.length) {
        violations.push("bracket_set_not_exact");
      }
      brackets.forEach((entry, index) => {
        const pointer = `/arrays/brackets/${index}`;
        if (!isRecord(entry) || !hasExactKeys(entry, BRACKET_KEYS)) {
          violations.push(`bracket_shape_invalid:${pointer}`);
          return;
        }
        const bracketId = NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS[index];
        if (entry.bracketId !== bracketId) {
          violations.push(`bracket_id_order_invalid:${pointer}`);
        }
        for (const slot of ["computed", "target", "residual", "absoluteUncertainty95"] as const) {
          const roleSlot = slot === "absoluteUncertainty95" ? "absolute_uncertainty95" : slot;
          addArray(
            entry[slot],
            `${pointer}/${slot}`,
            constraintExpectation(`constraint_bracket.${bracketId}.${roleSlot}`),
          );
        }
      });

      const antisymmetry = isRecord(arrays.antisymmetry) ? arrays.antisymmetry : null;
      if (antisymmetry == null || !hasExactKeys(antisymmetry, ANTISYMMETRY_KEYS)) {
        violations.push("antisymmetry_shape_invalid");
      } else {
        for (const slot of ["forward", "reverse", "residual", "absoluteUncertainty95"] as const) {
          const roleSlot = slot === "absoluteUncertainty95" ? "absolute_uncertainty95" : slot;
          addArray(
            antisymmetry[slot],
            `/arrays/antisymmetry/${slot}`,
            constraintExpectation(`antisymmetry.${roleSlot}`),
          );
        }
      }

      const jacobi = isRecord(arrays.jacobi) ? arrays.jacobi : null;
      if (jacobi == null || !hasExactKeys(jacobi, JACOBI_KEYS)) {
        violations.push("jacobi_shape_invalid");
      } else {
        for (const slot of ["term1", "term2", "term3", "residual", "absoluteUncertainty95"] as const) {
          const roleSlot =
            slot === "absoluteUncertainty95"
              ? "absolute_uncertainty95"
              : slot.replace("term", "term_");
          addArray(
            jacobi[slot],
            `/arrays/jacobi/${slot}`,
            constraintExpectation(`jacobi.${roleSlot}`),
          );
        }
      }

      const regulatorLevels = Array.isArray(arrays.regulatorLevels)
        ? arrays.regulatorLevels
        : [];
      if (
        regulatorLevels.length < NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS
      ) {
        violations.push("regulator_level_count_invalid");
      }
      let priorScale = Number.POSITIVE_INFINITY;
      const levelIds = new Set<string>();
      regulatorLevels.forEach((entry, index) => {
        const pointer = `/arrays/regulatorLevels/${index}`;
        if (!isRecord(entry) || !hasExactKeys(entry, REGULATOR_LEVEL_KEYS)) {
          violations.push(`regulator_level_shape_invalid:${pointer}`);
          return;
        }
        if (
          entry.ordinal !== index ||
          !isIdentifier(entry.levelId) ||
          levelIds.has(String(entry.levelId)) ||
          !isPositiveFinite(entry.scale) ||
          Number(entry.scale) >= priorScale
        ) {
          violations.push(`regulator_level_binding_invalid:${pointer}`);
        }
        if (typeof entry.levelId === "string") levelIds.add(entry.levelId);
        if (typeof entry.scale === "number") priorScale = entry.scale;
        addArray(
          entry.residual,
          `${pointer}/residual`,
          constraintExpectation(`regulator_level.${index}.residual`),
        );
        addArray(
          entry.absoluteUncertainty95,
          `${pointer}/absoluteUncertainty95`,
          constraintExpectation(
            `regulator_level.${index}.absolute_uncertainty95`,
          ),
        );
      });
    }
    if (new Set(outputPaths).size !== outputPaths.length) {
      violations.push("output_paths_not_unique");
    }
    for (const entry of entriesById.values()) {
      if (outputPaths.includes(entry.path)) violations.push("input_output_path_overlap");
    }

    const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      claimLocks == null ||
      !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
      claimLocks.diagnosticOnly !== true ||
      CLAIM_LOCK_KEYS.filter((key) => key !== "diagnosticOnly").some(
        (key) => claimLocks[key] !== false,
      )
    ) {
      violations.push("claim_locks_invalid");
    }

    return unique(violations);
  } catch {
    return ["manifest_shape_invalid"];
  }
};

export const isNhm2SemiclassicalV2RawReplayManifest = (
  value: unknown,
): value is Nhm2SemiclassicalV2RawReplayManifestV1 =>
  nhm2SemiclassicalV2RawReplayManifestViolations(value).length === 0;

export const nhm2SemiclassicalV2RawReplayManifestPairViolations = (
  primaryValue: unknown,
  independentValue: unknown,
): string[] => {
  const primaryViolations = nhm2SemiclassicalV2RawReplayManifestViolations(primaryValue);
  const independentViolations =
    nhm2SemiclassicalV2RawReplayManifestViolations(independentValue);
  const violations = [
    ...primaryViolations.map((entry) => `primary:${entry}`),
    ...independentViolations.map((entry) => `independent:${entry}`),
  ];
  if (
    primaryViolations.length > 0 ||
    independentViolations.length > 0 ||
    !isRecord(primaryValue) ||
    !isRecord(independentValue)
  ) {
    return unique(violations);
  }
  const primary = primaryValue as Nhm2SemiclassicalV2RawReplayManifestV1;
  const independent = independentValue as Nhm2SemiclassicalV2RawReplayManifestV1;
  if (primary.implementation.role !== "primary" || independent.implementation.role !== "independent") {
    violations.push("implementation_roles_invalid");
  }
  if (primary.implementation.comparisonPairId !== independent.implementation.comparisonPairId) {
    violations.push("comparison_pair_id_mismatch");
  }
  if (
    primary.manifestFrozenAt !== independent.manifestFrozenAt ||
    !sameJson(primary.candidate, independent.candidate) ||
    !sameJson(primary.numericalPolicy, independent.numericalPolicy) ||
    primary.inputClosure.scientificClosureSha256 !==
      independent.inputClosure.scientificClosureSha256
  ) {
    violations.push("frozen_scientific_inputs_mismatch");
  }
  const primaryScientific = primary.inputClosure.entries.slice(
    0,
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length,
  );
  const independentScientific = independent.inputClosure.entries.slice(
    0,
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length,
  );
  if (!sameJson(primaryScientific, independentScientific)) {
    violations.push("scientific_input_inventory_mismatch");
  }
  if (
    primary.inputClosure.scientificRootDirectory !==
    independent.inputClosure.scientificRootDirectory
  ) {
    violations.push("scientific_root_directory_mismatch");
  }
  if (
    primary.inputClosure.implementationRootDirectory ===
    independent.inputClosure.implementationRootDirectory
  ) {
    violations.push("implementation_root_directories_not_distinct");
  }
  const pairPrivateRoots = [
    primary.inputClosure.implementationRootDirectory,
    primary.execution.outputDirectory,
    independent.inputClosure.implementationRootDirectory,
    independent.execution.outputDirectory,
  ];
  if (
    pairPrivateRoots.some((root, index) =>
      pairPrivateRoots
        .slice(index + 1)
        .some((otherRoot) => portableRootsOverlap(root, otherRoot)),
    ) ||
    pairPrivateRoots.some((root) =>
      portableRootsOverlap(primary.inputClosure.scientificRootDirectory, root),
    )
  ) {
    violations.push("pair_root_topology_invalid");
  }
  const distinctPairs: Array<[unknown, unknown]> = [
    [primary.implementation.implementationId, independent.implementation.implementationId],
    [primary.implementation.sourceIdentity.identityId, independent.implementation.sourceIdentity.identityId],
    [primary.implementation.sourceIdentity.sha256, independent.implementation.sourceIdentity.sha256],
    [primary.implementation.dependencyIdentity.identityId, independent.implementation.dependencyIdentity.identityId],
    [primary.implementation.dependencyIdentity.sha256, independent.implementation.dependencyIdentity.sha256],
    [primary.implementation.executableIdentity.identityId, independent.implementation.executableIdentity.identityId],
    [primary.implementation.executableIdentity.sha256, independent.implementation.executableIdentity.sha256],
    [primary.inputClosure.completeClosureSha256, independent.inputClosure.completeClosureSha256],
    [
      primary.inputClosure.implementationRootDirectory,
      independent.inputClosure.implementationRootDirectory,
    ],
    [primary.execution.outputDirectory, independent.execution.outputDirectory],
  ];
  if (distinctPairs.some(([left, right]) => left === right)) {
    violations.push("implementations_not_genuinely_distinct");
  }
  const primaryOutputPaths = new Set(
    collectNhm2SemiclassicalV2RawReplayOutputArrays(primary).map((entry) => entry.path),
  );
  if (
    collectNhm2SemiclassicalV2RawReplayOutputArrays(independent).some((entry) =>
      primaryOutputPaths.has(entry.path),
    )
  ) {
    violations.push("implementation_output_paths_overlap");
  }
  return unique(violations);
};

export const collectNhm2SemiclassicalV2RawReplayOutputArrays = (
  manifest: Nhm2SemiclassicalV2RawReplayManifestV1,
): Nhm2SemiclassicalV2RawReplayArrayV1[] => [
  manifest.arrays.noiseKernel,
  manifest.arrays.noiseKernelAbsoluteUncertainty95,
  manifest.arrays.meanRset,
  manifest.arrays.smearingWeights,
  ...manifest.arrays.brackets.flatMap((entry) => [
    entry.computed,
    entry.target,
    entry.residual,
    entry.absoluteUncertainty95,
  ]),
  manifest.arrays.antisymmetry.forward,
  manifest.arrays.antisymmetry.reverse,
  manifest.arrays.antisymmetry.residual,
  manifest.arrays.antisymmetry.absoluteUncertainty95,
  manifest.arrays.jacobi.term1,
  manifest.arrays.jacobi.term2,
  manifest.arrays.jacobi.term3,
  manifest.arrays.jacobi.residual,
  manifest.arrays.jacobi.absoluteUncertainty95,
  ...manifest.arrays.regulatorLevels.flatMap((entry) => [
    entry.residual,
    entry.absoluteUncertainty95,
  ]),
];
