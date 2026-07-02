export const CIVILIZATION_SOURCE_MEASUREMENT_ARTIFACT_ID =
  "civilization_source_measurement" as const;

export const CIVILIZATION_SOURCE_MEASUREMENT_SCHEMA_VERSION =
  "civilization_source_measurement/v1" as const;

export const CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_ARTIFACT_ID =
  "civilization_source_measurement_collection" as const;

export const CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_SCHEMA_VERSION =
  "civilization_source_measurement_collection/v1" as const;

export const CIVILIZATION_MEASUREMENT_SOURCE_KINDS = [
  "usgs_earthquake",
  "noaa_coops",
  "nws_weather",
  "copernicus_marine",
  "declared_fixture",
] as const;

export const CIVILIZATION_MEASUREMENT_DOMAINS = [
  "seismic_activity",
  "tide_height",
  "water_level",
  "current_velocity",
  "wind_vector",
  "weather_alert",
  "temperature_gradient",
  "ocean_current",
  "atmospheric_observation",
] as const;

export const CIVILIZATION_MEASUREMENT_GEOMETRY_KINDS = [
  "point",
  "polyline",
  "polygon",
  "raster",
  "station",
  "external",
] as const;

export type CivilizationMeasurementSourceKindV1 =
  (typeof CIVILIZATION_MEASUREMENT_SOURCE_KINDS)[number];

export type CivilizationMeasurementDomainV1 =
  (typeof CIVILIZATION_MEASUREMENT_DOMAINS)[number];

export type CivilizationMeasurementGeometryKindV1 =
  (typeof CIVILIZATION_MEASUREMENT_GEOMETRY_KINDS)[number];

export type CivilizationSourceMeasurementGeometryV1 = {
  kind: CivilizationMeasurementGeometryKindV1;
  refId: string;
  label: string;
  coordinates?: { lat: number; lon: number; depthKm?: number | null } | null;
  bbox?: [number, number, number, number] | null;
  sourceGeometryRef?: string | null;
};

export type CivilizationSourceMeasurementQuantityV1 = {
  name: string;
  value: number | null;
  unit: string;
  vector?: {
    speed?: number | null;
    directionDegrees?: number | null;
    u?: number | null;
    v?: number | null;
  };
  qualifier?: string;
};

export type CivilizationSourceMeasurementAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  prediction_finality: false;
  policy_finality: false;
  moral_finality: false;
  execution_permission: false;
};

export type CivilizationSourceMeasurementV1 = {
  artifactId: typeof CIVILIZATION_SOURCE_MEASUREMENT_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_SOURCE_MEASUREMENT_SCHEMA_VERSION;
  measurementId: string;
  sourceKind: CivilizationMeasurementSourceKindV1;
  sourceId: string;
  sourceUrl?: string;
  fetchedAt: string;
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  domain: CivilizationMeasurementDomainV1;
  label: string;
  geometry: CivilizationSourceMeasurementGeometryV1;
  quantity: CivilizationSourceMeasurementQuantityV1;
  confidence: number;
  uncertainty?: number;
  sourceRefs: string[];
  evidenceRefs: string[];
  rawRecordRefs: string[];
  missingEvidence: string[];
  authority: CivilizationSourceMeasurementAuthorityV1;
};

export type CivilizationSourceMeasurementCollectionV1 = {
  artifactId: typeof CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_SCHEMA_VERSION;
  collectionId: string;
  generatedAt: string;
  sourceKind: CivilizationMeasurementSourceKindV1;
  sourceId: string;
  sourceUrl?: string;
  measurements: CivilizationSourceMeasurementV1[];
  missingEvidence: string[];
  authority: CivilizationSourceMeasurementAuthorityV1;
};

export type BuildCivilizationSourceMeasurementInput = Omit<
  CivilizationSourceMeasurementV1,
  "artifactId" | "schemaVersion" | "authority"
>;

export type BuildCivilizationSourceMeasurementCollectionInput = Omit<
  CivilizationSourceMeasurementCollectionV1,
  "artifactId" | "schemaVersion" | "authority"
>;

const AUTHORITY: CivilizationSourceMeasurementAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  prediction_finality: false,
  policy_finality: false,
  moral_finality: false,
  execution_permission: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(
  items: T,
  value: unknown,
): value is T[number] => typeof value === "string" && items.includes(value);

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateOptionalScore(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined) validateScore(prefix, value, issues);
}

function validateAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of [
    "assistant_answer",
    "raw_content_included",
    "terminal_eligible",
    "agent_executable",
    "prediction_finality",
    "policy_finality",
    "moral_finality",
    "execution_permission",
  ] as const) {
    if (value[field] !== false) issues.push(`${prefix}.${field} must be false`);
  }
  if (value.context_role !== "tool_evidence") {
    issues.push(`${prefix}.context_role must be tool_evidence`);
  }
  if (value.ask_context_policy !== "evidence_only") {
    issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  }
}

function validateGeometry(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!includes(CIVILIZATION_MEASUREMENT_GEOMETRY_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  if (!isNonEmptyString(value.refId)) issues.push(`${prefix}.refId must be a non-empty string`);
  if (!isNonEmptyString(value.label)) issues.push(`${prefix}.label must be a non-empty string`);
  if (value.coordinates !== undefined && value.coordinates !== null) {
    if (!isRecord(value.coordinates)) {
      issues.push(`${prefix}.coordinates must be an object when present`);
    } else {
      validateScorelessNumber(`${prefix}.coordinates.lat`, value.coordinates.lat, issues);
      validateScorelessNumber(`${prefix}.coordinates.lon`, value.coordinates.lon, issues);
      if (value.coordinates.depthKm !== undefined && value.coordinates.depthKm !== null) {
        validateScorelessNumber(`${prefix}.coordinates.depthKm`, value.coordinates.depthKm, issues);
      }
    }
  }
}

function validateScorelessNumber(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) issues.push(`${prefix} must be a finite number`);
}

function validateQuantity(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.name)) issues.push(`${prefix}.name must be a non-empty string`);
  if (value.value !== null) validateScorelessNumber(`${prefix}.value`, value.value, issues);
  if (!isNonEmptyString(value.unit)) issues.push(`${prefix}.unit must be a non-empty string`);
  if (value.vector !== undefined) {
    if (!isRecord(value.vector)) {
      issues.push(`${prefix}.vector must be an object when present`);
    } else {
      for (const field of ["speed", "directionDegrees", "u", "v"] as const) {
        const vectorValue = value.vector[field];
        if (vectorValue !== undefined && vectorValue !== null) {
          validateScorelessNumber(`${prefix}.vector.${field}`, vectorValue, issues);
        }
      }
    }
  }
}

export function buildCivilizationSourceMeasurementV1(
  input: BuildCivilizationSourceMeasurementInput,
): CivilizationSourceMeasurementV1 {
  return {
    artifactId: CIVILIZATION_SOURCE_MEASUREMENT_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_SOURCE_MEASUREMENT_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

export function buildCivilizationSourceMeasurementCollectionV1(
  input: BuildCivilizationSourceMeasurementCollectionInput,
): CivilizationSourceMeasurementCollectionV1 {
  return {
    artifactId: CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

export function validateCivilizationSourceMeasurementV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["civilization source measurement must be an object"];
  if (value.artifactId !== CIVILIZATION_SOURCE_MEASUREMENT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CIVILIZATION_SOURCE_MEASUREMENT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CIVILIZATION_SOURCE_MEASUREMENT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CIVILIZATION_SOURCE_MEASUREMENT_SCHEMA_VERSION}`);
  }
  for (const field of ["measurementId", "sourceId", "fetchedAt", "observedAt", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_MEASUREMENT_SOURCE_KINDS, value.sourceKind)) {
    issues.push("sourceKind is invalid");
  }
  if (!includes(CIVILIZATION_MEASUREMENT_DOMAINS, value.domain)) {
    issues.push("domain is invalid");
  }
  if (value.sourceUrl !== undefined && !isNonEmptyString(value.sourceUrl)) {
    issues.push("sourceUrl must be a non-empty string when present");
  }
  validateGeometry("geometry", value.geometry, issues);
  validateQuantity("quantity", value.quantity, issues);
  validateScore("confidence", value.confidence, issues);
  validateOptionalScore("uncertainty", value.uncertainty, issues);
  validateStringArray("sourceRefs", value.sourceRefs, issues);
  validateStringArray("evidenceRefs", value.evidenceRefs, issues);
  validateStringArray("rawRecordRefs", value.rawRecordRefs, issues);
  validateStringArray("missingEvidence", value.missingEvidence, issues);
  validateAuthority("authority", value.authority, issues);
  return issues;
}

export function validateCivilizationSourceMeasurementCollectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["civilization source measurement collection must be an object"];
  if (value.artifactId !== CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CIVILIZATION_SOURCE_MEASUREMENT_COLLECTION_SCHEMA_VERSION}`);
  }
  for (const field of ["collectionId", "generatedAt", "sourceId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_MEASUREMENT_SOURCE_KINDS, value.sourceKind)) {
    issues.push("sourceKind is invalid");
  }
  if (!Array.isArray(value.measurements)) {
    issues.push("measurements must be an array");
  } else {
    value.measurements.forEach((measurement, index) => {
      validateCivilizationSourceMeasurementV1(measurement).forEach((issue) =>
        issues.push(`measurements[${index}].${issue}`),
      );
    });
  }
  validateStringArray("missingEvidence", value.missingEvidence, issues);
  validateAuthority("authority", value.authority, issues);
  return issues;
}

export function isCivilizationSourceMeasurementV1(
  value: unknown,
): value is CivilizationSourceMeasurementV1 {
  return validateCivilizationSourceMeasurementV1(value).length === 0;
}

