import { createHash } from "node:crypto";

import {
  NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID,
  NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PrimaryRawRequiredObservableId,
} from "./nhm2-primary-raw-content-policy.v1";

export const NHM2_PREDICTION_RUN1_BOOTSTRAP_ARTIFACT_ID =
  "nhm2_prediction_run1_bootstrap" as const;
export const NHM2_PREDICTION_RUN1_BOOTSTRAP_CONTRACT_VERSION =
  "nhm2_prediction_run1_bootstrap/v2" as const;
export const NHM2_PREDICTION_RUN1_BINDING_SET_ARTIFACT_ID =
  "nhm2_prediction_run1_projection_binding_set" as const;
export const NHM2_PREDICTION_RUN1_BINDING_SET_CONTRACT_VERSION =
  "nhm2_prediction_run1_projection_binding_set/v2" as const;
export const NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS =
  "target_prediction_freeze_ready_for_reproduction" as const;
export const NHM2_PREDICTION_RUN1_BOOTSTRAP_SUPERSEDES =
  "nhm2_prediction_bootstrap_freeze/v1" as const;
export const NHM2_PREDICTION_RUN1_OBSERVABLE_ORDERING =
  "nhm2_frozen_six_observables/v1" as const;
export const NHM2_PREDICTION_RUN1_SOURCE_FILE_ORDERING =
  "portable_path_utf8_ascending/v1" as const;
export const NHM2_PREDICTION_RUN1_PREDICTION_SET_HASH_DOMAIN =
  "nhm2_prediction_run1_prediction_set_sha256/v2\n" as const;
export const NHM2_PREDICTION_RUN1_SOURCE_SET_HASH_DOMAIN =
  "nhm2_prediction_run1_source_set_sha256/v2\n" as const;
export const NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_ARTIFACT_ID =
  "nhm2_prediction_run1_unit_dimension_registry" as const;
export const NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_CONTRACT_VERSION =
  "nhm2_prediction_run1_unit_dimension_registry/v1" as const;

export const NHM2_PREDICTION_RUN1_NORMALIZATION_EQUATION_IDS = [
  "identity_source_normalization/v1",
] as const;
export const NHM2_PREDICTION_RUN1_CONVERSION_EQUATION_IDS = [
  "identity_unit_conversion/v1",
  "linear_scale_offset_unit_conversion/v1",
] as const;
export const NHM2_PREDICTION_RUN1_UNCERTAINTY_EQUATION_IDS = [
  "independent_interval95_linear_propagation/v1",
] as const;
export const NHM2_PREDICTION_RUN1_OPERATOR_NORMALIZATION_EQUATION_ID =
  "candidate_normalized_dimensionless_operator_coefficient/v1" as const;

export type Nhm2PredictionRun1UnitDimensionV1 = Readonly<{
  mass: number;
  length: number;
  time: number;
  angle: number;
  normalized: number;
}>;

const dimension = (
  mass: number,
  length: number,
  time: number,
  angle: number,
  normalized: number,
): Nhm2PredictionRun1UnitDimensionV1 =>
  Object.freeze({ mass, length, time, angle, normalized });

/**
 * Closed dimensional vocabulary for the run-1 prediction contract.  The
 * `candidate_normalized` storage token is deliberately not dimensionless: an
 * explicit governed normalization is required before it can participate in a
 * physical-unit computation.
 */
export const NHM2_PREDICTION_RUN1_UNIT_DIMENSIONS = Object.freeze({
  "1": dimension(0, 0, 0, 0, 0),
  candidate_normalized: dimension(0, 0, 0, 0, 1),
  rad: dimension(0, 0, 0, 1, 0),
  s: dimension(0, 0, 1, 0, 0),
  N: dimension(1, 1, -2, 0, 0),
  "J/m^3": dimension(1, -1, -2, 0, 0),
  "1/s^2": dimension(0, 0, -2, 0, 0),
} as const);

export type Nhm2PredictionRun1GovernedUnit =
  keyof typeof NHM2_PREDICTION_RUN1_UNIT_DIMENSIONS;

/**
 * Cross-dimensional affine calibrations are opt-in model bindings, not an
 * arbitrary string interpolation escape hatch.  Identity conversions for any
 * governed unit are admitted separately.
 */
export const NHM2_PREDICTION_RUN1_AFFINE_CALIBRATION_PAIRS = Object.freeze([
  Object.freeze({
    sourceUnit: "candidate_normalized",
    targetUnit: "J/m^3",
  }),
  Object.freeze({ sourceUnit: "candidate_normalized", targetUnit: "rad" }),
  Object.freeze({ sourceUnit: "candidate_normalized", targetUnit: "s" }),
  Object.freeze({ sourceUnit: "candidate_normalized", targetUnit: "N" }),
  Object.freeze({ sourceUnit: "candidate_normalized", targetUnit: "1" }),
  Object.freeze({
    sourceUnit: "candidate_normalized",
    targetUnit: "1/s^2",
  }),
] as const);

export type Nhm2PredictionRun1ConversionEquationId =
  (typeof NHM2_PREDICTION_RUN1_CONVERSION_EQUATION_IDS)[number];

export type Nhm2PredictionRun1ArtifactRefV2 = {
  artifactId: string;
  contractVersion: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2PredictionRun1FileRefV2 = {
  familyId: string;
  semanticRole: string;
  fileId: string;
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2PredictionRun1UnitConversionV2 = {
  equationId: Nhm2PredictionRun1ConversionEquationId;
  equationVersion: "1.0.0";
  sourceUnit: string;
  targetUnit: string;
  parameters: {
    scale: number;
    offset: number;
    scaleUnit: string;
    offsetUnit: string;
  };
};

export type Nhm2PredictionRun1ObservableBindingV2 = {
  observableId: Nhm2PrimaryRawRequiredObservableId;
  projectionId: string;
  sourceComponent: {
    familyId: string;
    semanticRole: string;
    fileId: string;
    sha256: string;
    rowIndex: number;
    componentIndex: number;
    component: string;
    sourceUnit: string;
  };
  operator: {
    fileId: string;
    sha256: string;
    rowIndex: number;
    sourceIndex: number;
    coefficient: number;
    coefficientStorageUnit: "candidate_normalized";
    coefficientNormalization: {
      equationId: typeof NHM2_PREDICTION_RUN1_OPERATOR_NORMALIZATION_EQUATION_ID;
      equationVersion: "1.0.0";
      inputUnit: "candidate_normalized";
      outputUnit: "1";
      parameters: { scale: 1; offset: 0 };
    };
    coefficientUnit: "1";
  };
  normalization: {
    equationId: "identity_source_normalization/v1";
    equationVersion: "1.0.0";
    inputUnit: string;
    outputUnit: string;
    parameters: { scale: 1; offset: 0 };
  };
  conversion: Nhm2PredictionRun1UnitConversionV2;
  uncertainty: {
    fileId: string;
    sha256: string;
    rowIndex: number;
    lowerComponent: "lower95";
    centralComponent: "central";
    upperComponent: "upper95";
    sourceUnit: string;
    targetUnit: string;
    conversion: Nhm2PredictionRun1UnitConversionV2;
    propagationEquationId: "independent_interval95_linear_propagation/v1";
    propagationEquationVersion: "1.0.0";
    coverageProbability: 0.95;
    correlationAssumption: "independent_terms";
  };
};

export type Nhm2PredictionRun1BindingSetV2 = {
  artifactId: typeof NHM2_PREDICTION_RUN1_BINDING_SET_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_RUN1_BINDING_SET_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  bindingSetId: string;
  plannedSourceRun: {
    candidateId: string;
    selectedProfileId: string;
    requestId: string;
    runId: string;
    runtimeId: string;
  };
  model: {
    modelId: string;
    parameterSetId: string;
    uncertaintyBudgetId: string;
  };
  unitDimensionRegistry: {
    artifactId: typeof NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_ARTIFACT_ID;
    contractVersion: typeof NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_CONTRACT_VERSION;
    sha256: string;
  };
  observableBindings: Nhm2PredictionRun1ObservableBindingV2[];
  claimBoundary: Nhm2PredictionRun1ClaimBoundaryV2;
};

export type Nhm2PredictionRun1PredictionV2 = {
  observableId: Nhm2PrimaryRawRequiredObservableId;
  projectionId: string;
  targetTime: string;
  unit: string;
  centralValue: number;
  interval95: {
    lower: number;
    upper: number;
    coverageProbability: 0.95;
  };
  derivation: {
    sourceComponent: Nhm2PredictionRun1ObservableBindingV2["sourceComponent"];
    operator: Nhm2PredictionRun1ObservableBindingV2["operator"];
    normalization: Nhm2PredictionRun1ObservableBindingV2["normalization"];
    conversion: Nhm2PredictionRun1UnitConversionV2;
    uncertainty: Nhm2PredictionRun1ObservableBindingV2["uncertainty"];
  };
};

export type Nhm2PredictionRun1ClaimBoundaryV2 = {
  runOneTheoryBootstrapOnly: true;
  targetRunExecuted: false;
  targetReceiptPresent: false;
  theoryClosureEstablished: false;
  physicalViabilityEstablished: false;
  transportEstablished: false;
  propulsionEstablished: false;
  routeEtaEstablished: false;
  certifiedSpeedEstablished: false;
  empiricalValidationEstablished: false;
};

export type Nhm2PredictionRun1BootstrapArtifactV2 = {
  artifactId: typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_CONTRACT_VERSION;
  supersedesContractVersion: typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_SUPERSEDES;
  status: typeof NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS;
  generatedAt: string;
  frozenAt: string;
  bootstrapId: string;
  sourceRun: {
    candidateId: string;
    selectedProfileId: string;
    requestId: string;
    runId: string;
    runtimeId: string;
    receiptId: string;
    sourceCommitSha: string;
    startedAt: string;
    completedAt: string;
    manifest: Nhm2PredictionRun1ArtifactRefV2;
    receipt: Nhm2PredictionRun1ArtifactRefV2 & {
      status: "completed";
      freshness: "new";
    };
    materialDynamicsReplay: Nhm2PredictionRun1ArtifactRefV2 & {
      fileClosureSha256: string;
    };
    bindingSet: Nhm2PredictionRun1ArtifactRefV2 & {
      frozenAt: string;
    };
    sourceFileSet: {
      ordering: typeof NHM2_PREDICTION_RUN1_SOURCE_FILE_ORDERING;
      sha256: string;
      entries: Nhm2PredictionRun1FileRefV2[];
    };
  };
  targetRunReservation: {
    candidateId: string;
    manifestId: string;
    requestId: string;
    runId: string;
    runtimeId: string;
    plannedStartAt: string;
    receipt: null;
  };
  predictionSet: {
    ordering: typeof NHM2_PREDICTION_RUN1_OBSERVABLE_ORDERING;
    sha256: string;
    entries: Nhm2PredictionRun1PredictionV2[];
  };
  claimBoundary: Nhm2PredictionRun1ClaimBoundaryV2;
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const CONTRACT = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const TEXT = /^[^\u0000-\u001f\u007f]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const onlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
};

const isText = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim() === value &&
  value.length > 0 &&
  value.length <= 512 &&
  TEXT.test(value);

const isIso = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const safeIndex = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const exactClaimBoundary = (
  value: unknown,
): value is Nhm2PredictionRun1ClaimBoundaryV2 =>
  isRecord(value) &&
  onlyKeys(value, [
    "runOneTheoryBootstrapOnly",
    "targetRunExecuted",
    "targetReceiptPresent",
    "theoryClosureEstablished",
    "physicalViabilityEstablished",
    "transportEstablished",
    "propulsionEstablished",
    "routeEtaEstablished",
    "certifiedSpeedEstablished",
    "empiricalValidationEstablished",
  ]) &&
  value.runOneTheoryBootstrapOnly === true &&
  value.targetRunExecuted === false &&
  value.targetReceiptPresent === false &&
  value.theoryClosureEstablished === false &&
  value.physicalViabilityEstablished === false &&
  value.transportEstablished === false &&
  value.propulsionEstablished === false &&
  value.routeEtaEstablished === false &&
  value.certifiedSpeedEstablished === false &&
  value.empiricalValidationEstablished === false;

export const NHM2_PREDICTION_RUN1_CLAIM_BOUNDARY = Object.freeze({
  runOneTheoryBootstrapOnly: true,
  targetRunExecuted: false,
  targetReceiptPresent: false,
  theoryClosureEstablished: false,
  physicalViabilityEstablished: false,
  transportEstablished: false,
  propulsionEstablished: false,
  routeEtaEstablished: false,
  certifiedSpeedEstablished: false,
  empiricalValidationEstablished: false,
} as const satisfies Nhm2PredictionRun1ClaimBoundaryV2);

export const canonicalizeNhm2PredictionRun1Json = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined)
      throw new TypeError("value is not JSON encodable");
    return encoded;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeNhm2PredictionRun1Json).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    )
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalizeNhm2PredictionRun1Json(record[key])}`,
    )
    .join(",")}}`;
};

export const sha256Nhm2PredictionRun1Bytes = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

export const sha256Nhm2PredictionRun1Canonical = (value: unknown): string =>
  createHash("sha256")
    .update(canonicalizeNhm2PredictionRun1Json(value), "utf8")
    .digest("hex");

export const NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY = Object.freeze({
  artifactId: NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_ARTIFACT_ID,
  contractVersion:
    NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_CONTRACT_VERSION,
  baseDimensions: Object.freeze([
    "mass",
    "length",
    "time",
    "angle",
    "normalized",
  ]),
  units: NHM2_PREDICTION_RUN1_UNIT_DIMENSIONS,
  affineCalibrationPairs: NHM2_PREDICTION_RUN1_AFFINE_CALIBRATION_PAIRS,
  candidateNormalizedIsDimensionless: false,
} as const);

export const NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_SHA256 =
  sha256Nhm2PredictionRun1Canonical(
    NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY,
  );

const governedUnitDimension = (
  unit: unknown,
): Nhm2PredictionRun1UnitDimensionV1 | null =>
  typeof unit === "string" &&
  Object.prototype.hasOwnProperty.call(
    NHM2_PREDICTION_RUN1_UNIT_DIMENSIONS,
    unit,
  )
    ? NHM2_PREDICTION_RUN1_UNIT_DIMENSIONS[
        unit as Nhm2PredictionRun1GovernedUnit
      ]
    : null;

const addDimensions = (
  left: Nhm2PredictionRun1UnitDimensionV1,
  right: Nhm2PredictionRun1UnitDimensionV1,
): Nhm2PredictionRun1UnitDimensionV1 =>
  dimension(
    left.mass + right.mass,
    left.length + right.length,
    left.time + right.time,
    left.angle + right.angle,
    left.normalized + right.normalized,
  );

const subtractDimensions = (
  left: Nhm2PredictionRun1UnitDimensionV1,
  right: Nhm2PredictionRun1UnitDimensionV1,
): Nhm2PredictionRun1UnitDimensionV1 =>
  dimension(
    left.mass - right.mass,
    left.length - right.length,
    left.time - right.time,
    left.angle - right.angle,
    left.normalized - right.normalized,
  );

const sameDimension = (
  left: Nhm2PredictionRun1UnitDimensionV1,
  right: Nhm2PredictionRun1UnitDimensionV1,
): boolean =>
  left.mass === right.mass &&
  left.length === right.length &&
  left.time === right.time &&
  left.angle === right.angle &&
  left.normalized === right.normalized;

const affineScaleDimension = (
  scaleUnit: unknown,
  sourceUnit: unknown,
  targetUnit: unknown,
): Nhm2PredictionRun1UnitDimensionV1 | null => {
  if (
    typeof sourceUnit !== "string" ||
    typeof targetUnit !== "string" ||
    scaleUnit !== `${targetUnit} per ${sourceUnit}`
  ) {
    return null;
  }
  const source = governedUnitDimension(sourceUnit);
  const target = governedUnitDimension(targetUnit);
  return source == null || target == null
    ? null
    : subtractDimensions(target, source);
};

const affinePairGoverned = (sourceUnit: string, targetUnit: string): boolean =>
  sourceUnit === targetUnit ||
  NHM2_PREDICTION_RUN1_AFFINE_CALIBRATION_PAIRS.some(
    (pair) => pair.sourceUnit === sourceUnit && pair.targetUnit === targetUnit,
  );

export const computeNhm2PredictionRun1PredictionSetSha256 = (
  entries: readonly Nhm2PredictionRun1PredictionV2[],
): string =>
  createHash("sha256")
    .update(NHM2_PREDICTION_RUN1_PREDICTION_SET_HASH_DOMAIN, "utf8")
    .update(canonicalizeNhm2PredictionRun1Json(entries), "utf8")
    .digest("hex");

export const computeNhm2PredictionRun1SourceSetSha256 = (
  entries: readonly Nhm2PredictionRun1FileRefV2[],
): string =>
  createHash("sha256")
    .update(NHM2_PREDICTION_RUN1_SOURCE_SET_HASH_DOMAIN, "utf8")
    .update(canonicalizeNhm2PredictionRun1Json(entries), "utf8")
    .digest("hex");

const isArtifactRef = (
  value: unknown,
  extraKeys: readonly string[] = [],
): value is Nhm2PredictionRun1ArtifactRefV2 =>
  isRecord(value) &&
  onlyKeys(value, [
    "artifactId",
    "contractVersion",
    "sha256",
    "sizeBytes",
    ...extraKeys,
  ]) &&
  isText(value.artifactId) &&
  typeof value.contractVersion === "string" &&
  CONTRACT.test(value.contractVersion) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 1;

const isPinnedPath = (value: unknown): value is string => {
  if (!isText(value) || value.includes("\\") || value.startsWith("/"))
    return false;
  if (/^[a-z]:/i.test(value) || /[?#*{}[\]]/.test(value)) return false;
  const parts = value.split("/");
  return (
    parts.length <= 16 &&
    parts.every((part) => part !== "" && part !== "." && part !== "..") &&
    !parts.some((part) => part.toLowerCase() === "latest")
  );
};

const isFileRef = (value: unknown): value is Nhm2PredictionRun1FileRefV2 =>
  isRecord(value) &&
  onlyKeys(value, [
    "familyId",
    "semanticRole",
    "fileId",
    "path",
    "sha256",
    "sizeBytes",
  ]) &&
  isText(value.familyId) &&
  isText(value.semanticRole) &&
  isText(value.fileId) &&
  isPinnedPath(value.path) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0;

const isConversion = (
  value: unknown,
  targetUnit: string,
): value is Nhm2PredictionRun1UnitConversionV2 => {
  if (
    !isRecord(value) ||
    !onlyKeys(value, [
      "equationId",
      "equationVersion",
      "sourceUnit",
      "targetUnit",
      "parameters",
    ]) ||
    !NHM2_PREDICTION_RUN1_CONVERSION_EQUATION_IDS.includes(
      value.equationId as Nhm2PredictionRun1ConversionEquationId,
    ) ||
    value.equationVersion !== "1.0.0" ||
    governedUnitDimension(value.sourceUnit) == null ||
    governedUnitDimension(targetUnit) == null ||
    value.targetUnit !== targetUnit ||
    !isRecord(value.parameters) ||
    !onlyKeys(value.parameters, [
      "scale",
      "offset",
      "scaleUnit",
      "offsetUnit",
    ]) ||
    !finite(value.parameters.scale) ||
    value.parameters.scale === 0 ||
    !finite(value.parameters.offset) ||
    affineScaleDimension(
      value.parameters.scaleUnit,
      value.sourceUnit,
      targetUnit,
    ) == null ||
    value.parameters.offsetUnit !== targetUnit
  ) {
    return false;
  }
  const sourceUnit = String(value.sourceUnit);
  const sourceDimension = governedUnitDimension(sourceUnit)!;
  const targetDimension = governedUnitDimension(targetUnit)!;
  const scaleDimension = affineScaleDimension(
    value.parameters.scaleUnit,
    sourceUnit,
    targetUnit,
  )!;
  if (
    !affinePairGoverned(sourceUnit, targetUnit) ||
    !sameDimension(
      addDimensions(sourceDimension, scaleDimension),
      targetDimension,
    )
  ) {
    return false;
  }
  return (
    value.equationId !== "identity_unit_conversion/v1" ||
    (value.sourceUnit === targetUnit &&
      value.parameters.scale === 1 &&
      value.parameters.offset === 0)
  );
};

const isSourceComponent = (
  value: unknown,
): value is Nhm2PredictionRun1ObservableBindingV2["sourceComponent"] =>
  isRecord(value) &&
  onlyKeys(value, [
    "familyId",
    "semanticRole",
    "fileId",
    "sha256",
    "rowIndex",
    "componentIndex",
    "component",
    "sourceUnit",
  ]) &&
  isText(value.familyId) &&
  isText(value.semanticRole) &&
  isText(value.fileId) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  safeIndex(value.rowIndex) &&
  safeIndex(value.componentIndex) &&
  isText(value.component) &&
  isText(value.sourceUnit);

const isOperator = (
  value: unknown,
): value is Nhm2PredictionRun1ObservableBindingV2["operator"] =>
  isRecord(value) &&
  onlyKeys(value, [
    "fileId",
    "sha256",
    "rowIndex",
    "sourceIndex",
    "coefficient",
    "coefficientStorageUnit",
    "coefficientNormalization",
    "coefficientUnit",
  ]) &&
  isText(value.fileId) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  safeIndex(value.rowIndex) &&
  safeIndex(value.sourceIndex) &&
  finite(value.coefficient) &&
  value.coefficientStorageUnit === "candidate_normalized" &&
  isRecord(value.coefficientNormalization) &&
  onlyKeys(value.coefficientNormalization, [
    "equationId",
    "equationVersion",
    "inputUnit",
    "outputUnit",
    "parameters",
  ]) &&
  value.coefficientNormalization.equationId ===
    NHM2_PREDICTION_RUN1_OPERATOR_NORMALIZATION_EQUATION_ID &&
  value.coefficientNormalization.equationVersion === "1.0.0" &&
  value.coefficientNormalization.inputUnit === value.coefficientStorageUnit &&
  value.coefficientNormalization.outputUnit === "1" &&
  isRecord(value.coefficientNormalization.parameters) &&
  onlyKeys(value.coefficientNormalization.parameters, ["scale", "offset"]) &&
  value.coefficientNormalization.parameters.scale === 1 &&
  value.coefficientNormalization.parameters.offset === 0 &&
  value.coefficientUnit === value.coefficientNormalization.outputUnit;

const isNormalization = (
  value: unknown,
  sourceUnit: string,
): value is Nhm2PredictionRun1ObservableBindingV2["normalization"] =>
  isRecord(value) &&
  onlyKeys(value, [
    "equationId",
    "equationVersion",
    "inputUnit",
    "outputUnit",
    "parameters",
  ]) &&
  value.equationId === "identity_source_normalization/v1" &&
  value.equationVersion === "1.0.0" &&
  value.inputUnit === sourceUnit &&
  value.outputUnit === sourceUnit &&
  isRecord(value.parameters) &&
  onlyKeys(value.parameters, ["scale", "offset"]) &&
  value.parameters.scale === 1 &&
  value.parameters.offset === 0;

const isUncertainty = (
  value: unknown,
  targetUnit: string,
): value is Nhm2PredictionRun1ObservableBindingV2["uncertainty"] =>
  isRecord(value) &&
  onlyKeys(value, [
    "fileId",
    "sha256",
    "rowIndex",
    "lowerComponent",
    "centralComponent",
    "upperComponent",
    "sourceUnit",
    "targetUnit",
    "conversion",
    "propagationEquationId",
    "propagationEquationVersion",
    "coverageProbability",
    "correlationAssumption",
  ]) &&
  isText(value.fileId) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  safeIndex(value.rowIndex) &&
  value.lowerComponent === "lower95" &&
  value.centralComponent === "central" &&
  value.upperComponent === "upper95" &&
  isText(value.sourceUnit) &&
  value.targetUnit === targetUnit &&
  isConversion(value.conversion, targetUnit) &&
  value.conversion.sourceUnit === value.sourceUnit &&
  value.propagationEquationId ===
    "independent_interval95_linear_propagation/v1" &&
  value.propagationEquationVersion === "1.0.0" &&
  value.coverageProbability === 0.95 &&
  value.correlationAssumption === "independent_terms";

export const nhm2PredictionRun1ObservableUnitCompositionViolations = (
  value: Nhm2PredictionRun1ObservableBindingV2,
  advertisedUnit: string,
): string[] => {
  const violations: string[] = [];
  const source = governedUnitDimension(value.sourceComponent.sourceUnit);
  const normalized = governedUnitDimension(value.normalization.outputUnit);
  const converted = governedUnitDimension(value.conversion.targetUnit);
  const coefficient = governedUnitDimension(value.operator.coefficientUnit);
  const advertised = governedUnitDimension(advertisedUnit);
  const uncertaintySource = governedUnitDimension(value.uncertainty.sourceUnit);
  const uncertaintyConversionSource = governedUnitDimension(
    value.uncertainty.conversion.sourceUnit,
  );
  const uncertaintyConverted = governedUnitDimension(
    value.uncertainty.conversion.targetUnit,
  );
  if (
    source == null ||
    normalized == null ||
    converted == null ||
    coefficient == null ||
    advertised == null ||
    uncertaintySource == null ||
    uncertaintyConversionSource == null ||
    uncertaintyConverted == null
  ) {
    return ["unit_not_governed"];
  }
  if (!sameDimension(source, normalized)) {
    violations.push("source_normalization_dimension_mismatch");
  }
  if (!isConversion(value.conversion, value.conversion.targetUnit)) {
    violations.push("source_affine_conversion_dimension_mismatch");
  }
  if (!sameDimension(addDimensions(converted, coefficient), advertised)) {
    violations.push("operator_output_dimension_mismatch");
  }
  if (!isConversion(value.uncertainty.conversion, advertisedUnit)) {
    violations.push("uncertainty_affine_conversion_dimension_mismatch");
  }
  if (!sameDimension(uncertaintySource, uncertaintyConversionSource)) {
    violations.push("uncertainty_source_dimension_mismatch");
  }
  if (
    !sameDimension(addDimensions(uncertaintyConverted, coefficient), advertised)
  ) {
    violations.push("uncertainty_operator_output_dimension_mismatch");
  }
  return [...new Set(violations)];
};

const isObservableBinding = (
  value: unknown,
  observableId: Nhm2PrimaryRawRequiredObservableId,
): value is Nhm2PredictionRun1ObservableBindingV2 => {
  const targetUnit = NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId];
  return (
    isRecord(value) &&
    onlyKeys(value, [
      "observableId",
      "projectionId",
      "sourceComponent",
      "operator",
      "normalization",
      "conversion",
      "uncertainty",
    ]) &&
    value.observableId === observableId &&
    isText(value.projectionId) &&
    isSourceComponent(value.sourceComponent) &&
    isOperator(value.operator) &&
    isNormalization(value.normalization, value.sourceComponent.sourceUnit) &&
    isConversion(value.conversion, targetUnit) &&
    value.conversion.sourceUnit === value.normalization.outputUnit &&
    isUncertainty(value.uncertainty, targetUnit) &&
    nhm2PredictionRun1ObservableUnitCompositionViolations(
      value as Nhm2PredictionRun1ObservableBindingV2,
      targetUnit,
    ).length === 0
  );
};

export const nhm2PredictionRun1BindingSetViolations = (
  value: unknown,
): string[] => {
  const violations: string[] = [];
  if (!isRecord(value)) return ["binding_set_not_object"];
  if (
    !onlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "bindingSetId",
      "plannedSourceRun",
      "model",
      "unitDimensionRegistry",
      "observableBindings",
      "claimBoundary",
    ])
  ) {
    violations.push("binding_set_shape_invalid");
  }
  if (value.artifactId !== NHM2_PREDICTION_RUN1_BINDING_SET_ARTIFACT_ID)
    violations.push("binding_set_artifact_id_invalid");
  if (
    value.contractVersion !== NHM2_PREDICTION_RUN1_BINDING_SET_CONTRACT_VERSION
  )
    violations.push("binding_set_contract_version_invalid");
  if (
    !isIso(value.generatedAt) ||
    !isIso(value.frozenAt) ||
    (isIso(value.generatedAt) &&
      isIso(value.frozenAt) &&
      Date.parse(value.generatedAt) > Date.parse(value.frozenAt))
  ) {
    violations.push("binding_set_timing_invalid");
  }
  if (!isText(value.bindingSetId)) violations.push("binding_set_id_invalid");
  if (
    !isRecord(value.plannedSourceRun) ||
    !onlyKeys(value.plannedSourceRun, [
      "candidateId",
      "selectedProfileId",
      "requestId",
      "runId",
      "runtimeId",
    ]) ||
    !Object.values(value.plannedSourceRun).every(isText)
  ) {
    violations.push("binding_set_source_run_invalid");
  }
  if (
    !isRecord(value.model) ||
    !onlyKeys(value.model, [
      "modelId",
      "parameterSetId",
      "uncertaintyBudgetId",
    ]) ||
    !Object.values(value.model).every(isText)
  ) {
    violations.push("binding_set_model_invalid");
  }
  if (
    !isRecord(value.unitDimensionRegistry) ||
    !onlyKeys(value.unitDimensionRegistry, [
      "artifactId",
      "contractVersion",
      "sha256",
    ]) ||
    value.unitDimensionRegistry.artifactId !==
      NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_ARTIFACT_ID ||
    value.unitDimensionRegistry.contractVersion !==
      NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_CONTRACT_VERSION ||
    value.unitDimensionRegistry.sha256 !==
      NHM2_PREDICTION_RUN1_UNIT_DIMENSION_REGISTRY_SHA256
  ) {
    violations.push("binding_set_unit_dimension_registry_invalid");
  }
  if (
    !Array.isArray(value.observableBindings) ||
    value.observableBindings.length !==
      NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.length ||
    !NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.every((observableId, index) =>
      isObservableBinding(
        (value.observableBindings as unknown[] | undefined)?.[index],
        observableId,
      ),
    )
  ) {
    violations.push("binding_set_exact_six_bindings_invalid");
  }
  if (Array.isArray(value.observableBindings)) {
    const observableBindings = value.observableBindings as unknown[];
    NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.forEach((observableId, index) => {
      const binding = observableBindings[index];
      if (
        isRecord(binding) &&
        isSourceComponent(binding.sourceComponent) &&
        isOperator(binding.operator) &&
        isNormalization(
          binding.normalization,
          binding.sourceComponent.sourceUnit,
        ) &&
        isConversion(
          binding.conversion,
          NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId],
        ) &&
        isUncertainty(
          binding.uncertainty,
          NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId],
        )
      ) {
        violations.push(
          ...nhm2PredictionRun1ObservableUnitCompositionViolations(
            binding as Nhm2PredictionRun1ObservableBindingV2,
            NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId],
          ).map(
            (issue) =>
              `binding_set_unit_dimension_invalid:${observableId}:${issue}`,
          ),
        );
      }
    });
  }
  if (!exactClaimBoundary(value.claimBoundary))
    violations.push("binding_set_claim_boundary_opened");
  return [...new Set(violations)];
};

export const isNhm2PredictionRun1BindingSetV2 = (
  value: unknown,
): value is Nhm2PredictionRun1BindingSetV2 =>
  nhm2PredictionRun1BindingSetViolations(value).length === 0;

const isPrediction = (
  value: unknown,
  observableId: Nhm2PrimaryRawRequiredObservableId,
): value is Nhm2PredictionRun1PredictionV2 => {
  const unit = NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[observableId];
  if (
    !isRecord(value) ||
    !onlyKeys(value, [
      "observableId",
      "projectionId",
      "targetTime",
      "unit",
      "centralValue",
      "interval95",
      "derivation",
    ]) ||
    value.observableId !== observableId ||
    !isText(value.projectionId) ||
    !isIso(value.targetTime) ||
    value.unit !== unit ||
    !finite(value.centralValue) ||
    !isRecord(value.interval95) ||
    !onlyKeys(value.interval95, ["lower", "upper", "coverageProbability"]) ||
    !finite(value.interval95.lower) ||
    !finite(value.interval95.upper) ||
    value.interval95.lower > value.centralValue ||
    value.interval95.upper < value.centralValue ||
    value.interval95.coverageProbability !== 0.95 ||
    !isRecord(value.derivation) ||
    !onlyKeys(value.derivation, [
      "sourceComponent",
      "operator",
      "normalization",
      "conversion",
      "uncertainty",
    ])
  ) {
    return false;
  }
  return (
    isSourceComponent(value.derivation.sourceComponent) &&
    isOperator(value.derivation.operator) &&
    isNormalization(
      value.derivation.normalization,
      value.derivation.sourceComponent.sourceUnit,
    ) &&
    isConversion(value.derivation.conversion, unit) &&
    isUncertainty(value.derivation.uncertainty, unit) &&
    nhm2PredictionRun1ObservableUnitCompositionViolations(
      {
        observableId,
        projectionId: value.projectionId,
        sourceComponent: value.derivation.sourceComponent,
        operator: value.derivation.operator,
        normalization: value.derivation.normalization,
        conversion: value.derivation.conversion,
        uncertainty: value.derivation.uncertainty,
      },
      unit,
    ).length === 0
  );
};

const resourceSafe = (root: unknown): boolean => {
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: root, depth: 0 },
  ];
  const seen = new Set<object>();
  let nodes = 0;
  let stringBytes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > 100_000 || current.depth > 32) return false;
    if (typeof current.value === "string") {
      stringBytes += Buffer.byteLength(current.value, "utf8");
      if (stringBytes > 4 * 1024 * 1024) return false;
    } else if (current.value && typeof current.value === "object") {
      if (seen.has(current.value)) return false;
      seen.add(current.value);
      const children = Array.isArray(current.value)
        ? current.value
        : Object.values(current.value as Record<string, unknown>);
      for (const child of children)
        stack.push({ value: child, depth: current.depth + 1 });
    } else if (
      current.value !== null &&
      typeof current.value !== "boolean" &&
      typeof current.value !== "number" &&
      typeof current.value !== "undefined"
    ) {
      return false;
    }
  }
  return true;
};

export const nhm2PredictionRun1BootstrapArtifactViolations = (
  value: unknown,
): string[] => {
  const violations: string[] = [];
  if (!resourceSafe(value))
    return ["bootstrap_artifact_resource_limit_exceeded"];
  if (!isRecord(value)) return ["bootstrap_artifact_not_object"];
  if (
    !onlyKeys(value, [
      "artifactId",
      "contractVersion",
      "supersedesContractVersion",
      "status",
      "generatedAt",
      "frozenAt",
      "bootstrapId",
      "sourceRun",
      "targetRunReservation",
      "predictionSet",
      "claimBoundary",
    ])
  ) {
    violations.push("bootstrap_artifact_shape_invalid");
  }
  if (value.artifactId !== NHM2_PREDICTION_RUN1_BOOTSTRAP_ARTIFACT_ID)
    violations.push("bootstrap_artifact_id_invalid");
  if (value.contractVersion !== NHM2_PREDICTION_RUN1_BOOTSTRAP_CONTRACT_VERSION)
    violations.push("bootstrap_contract_version_invalid");
  if (
    value.supersedesContractVersion !==
    NHM2_PREDICTION_RUN1_BOOTSTRAP_SUPERSEDES
  )
    violations.push("bootstrap_supersession_invalid");
  if (value.status !== NHM2_PREDICTION_RUN1_BOOTSTRAP_STATUS)
    violations.push("bootstrap_status_invalid");
  if (
    !isIso(value.generatedAt) ||
    !isIso(value.frozenAt) ||
    (isIso(value.generatedAt) &&
      isIso(value.frozenAt) &&
      Date.parse(value.generatedAt) > Date.parse(value.frozenAt))
  ) {
    violations.push("bootstrap_timing_invalid");
  }
  if (!isText(value.bootstrapId)) violations.push("bootstrap_id_invalid");

  const source = value.sourceRun;
  if (
    !isRecord(source) ||
    !onlyKeys(source, [
      "candidateId",
      "selectedProfileId",
      "requestId",
      "runId",
      "runtimeId",
      "receiptId",
      "sourceCommitSha",
      "startedAt",
      "completedAt",
      "manifest",
      "receipt",
      "materialDynamicsReplay",
      "bindingSet",
      "sourceFileSet",
    ]) ||
    ![
      source?.candidateId,
      source?.selectedProfileId,
      source?.requestId,
      source?.runId,
      source?.runtimeId,
      source?.receiptId,
    ].every(isText) ||
    typeof source?.sourceCommitSha !== "string" ||
    !GIT_SHA.test(source.sourceCommitSha) ||
    !isIso(source.startedAt) ||
    !isIso(source.completedAt) ||
    (isIso(source.startedAt) &&
      isIso(source.completedAt) &&
      Date.parse(source.startedAt) > Date.parse(source.completedAt)) ||
    !isArtifactRef(source.manifest) ||
    !isRecord(source.receipt) ||
    !isArtifactRef(source.receipt, ["status", "freshness"]) ||
    (source.receipt as Record<string, unknown>).status !== "completed" ||
    (source.receipt as Record<string, unknown>).freshness !== "new" ||
    !isRecord(source.materialDynamicsReplay) ||
    !isArtifactRef(source.materialDynamicsReplay, ["fileClosureSha256"]) ||
    typeof (source.materialDynamicsReplay as Record<string, unknown>)
      .fileClosureSha256 !== "string" ||
    !SHA256.test(
      (source.materialDynamicsReplay as Record<string, unknown>)
        .fileClosureSha256 as string,
    ) ||
    !isRecord(source.bindingSet) ||
    !isArtifactRef(source.bindingSet, ["frozenAt"]) ||
    !isIso((source.bindingSet as Record<string, unknown>).frozenAt) ||
    !isRecord(source.sourceFileSet) ||
    source.sourceFileSet.ordering !==
      NHM2_PREDICTION_RUN1_SOURCE_FILE_ORDERING ||
    !Array.isArray(source.sourceFileSet.entries) ||
    source.sourceFileSet.entries.length === 0 ||
    !source.sourceFileSet.entries.every(isFileRef) ||
    typeof source.sourceFileSet.sha256 !== "string" ||
    source.sourceFileSet.sha256 !==
      computeNhm2PredictionRun1SourceSetSha256(source.sourceFileSet.entries)
  ) {
    violations.push("bootstrap_source_run_invalid");
  } else {
    const sourceFileSet = source.sourceFileSet as {
      entries: Nhm2PredictionRun1FileRefV2[];
    };
    const sorted = [...sourceFileSet.entries].sort((left, right) =>
      Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
    );
    if (
      sorted.some(
        (entry, index) => entry.path !== sourceFileSet.entries[index]?.path,
      ) ||
      new Set(sorted.map((entry) => entry.path)).size !== sorted.length ||
      new Set(sorted.map((entry) => entry.fileId)).size !== sorted.length
    ) {
      violations.push("bootstrap_source_file_set_not_exact");
    }
  }

  const target = value.targetRunReservation;
  if (
    !isRecord(target) ||
    !onlyKeys(target, [
      "candidateId",
      "manifestId",
      "requestId",
      "runId",
      "runtimeId",
      "plannedStartAt",
      "receipt",
    ]) ||
    ![
      target?.candidateId,
      target?.manifestId,
      target?.requestId,
      target?.runId,
      target?.runtimeId,
    ].every(isText) ||
    !isIso(target.plannedStartAt) ||
    target.receipt !== null
  ) {
    violations.push("bootstrap_target_reservation_invalid");
  }
  if (
    isRecord(source) &&
    isRecord(target) &&
    ["candidateId", "requestId", "runId", "runtimeId"].some(
      (key) => source[key] === target[key],
    )
  ) {
    violations.push("bootstrap_target_not_distinct");
  }
  if (
    isIso(value.frozenAt) &&
    isRecord(target) &&
    isIso(target.plannedStartAt) &&
    Date.parse(target.plannedStartAt) <= Date.parse(value.frozenAt)
  ) {
    violations.push("bootstrap_target_not_post_freeze");
  }

  const predictionSet = value.predictionSet;
  if (
    !isRecord(predictionSet) ||
    !onlyKeys(predictionSet, ["ordering", "sha256", "entries"]) ||
    predictionSet.ordering !== NHM2_PREDICTION_RUN1_OBSERVABLE_ORDERING ||
    !Array.isArray(predictionSet.entries) ||
    predictionSet.entries.length !==
      NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.length ||
    !NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.every((id, index) =>
      isPrediction(
        (predictionSet.entries as unknown[] | undefined)?.[index],
        id,
      ),
    ) ||
    typeof predictionSet.sha256 !== "string" ||
    predictionSet.sha256 !==
      computeNhm2PredictionRun1PredictionSetSha256(
        predictionSet.entries as Nhm2PredictionRun1PredictionV2[],
      )
  ) {
    violations.push("bootstrap_prediction_set_invalid");
  } else if (
    isRecord(target) &&
    isIso(target.plannedStartAt) &&
    (predictionSet.entries as Nhm2PredictionRun1PredictionV2[]).some(
      (entry) =>
        Date.parse(entry.targetTime) <
        Date.parse(target.plannedStartAt as string),
    )
  ) {
    violations.push("bootstrap_prediction_precedes_target_run");
  }
  if (!exactClaimBoundary(value.claimBoundary))
    violations.push("bootstrap_claim_boundary_opened");
  return [...new Set(violations)];
};

export const isNhm2PredictionRun1BootstrapArtifactV2 = (
  value: unknown,
): value is Nhm2PredictionRun1BootstrapArtifactV2 =>
  nhm2PredictionRun1BootstrapArtifactViolations(value).length === 0;
