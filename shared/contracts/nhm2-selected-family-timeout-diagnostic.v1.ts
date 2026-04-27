export const NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_ARTIFACT_ID =
  "nhm2_selected_family_timeout_diagnostic";
export const NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_SCHEMA_VERSION =
  "nhm2_selected_family_timeout_diagnostic/v1";

export const NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_STAGE_VALUES = [
  "selected_transport_bundle",
  "full_loop_audit",
] as const;

export const NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_FAILURE_CLASS_VALUES = [
  "solver_timeout",
] as const;

export type Nhm2SelectedFamilyTimeoutDiagnosticStage =
  (typeof NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_STAGE_VALUES)[number];
export type Nhm2SelectedFamilyTimeoutDiagnosticFailureClass =
  (typeof NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_FAILURE_CLASS_VALUES)[number];

export type Nhm2SelectedFamilyTimeoutDiagnosticLatestSurface = {
  artifactId: string;
  profileId: string | null;
  path: string;
  exists: boolean;
  status: string | null;
  lastWriteTimeIso: string | null;
};

export type Nhm2SelectedFamilyTimeoutDiagnosticArtifact = {
  artifactId: typeof NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_SCHEMA_VERSION;
  generatedOn: string;
  generatedAt: string;
  stage: Nhm2SelectedFamilyTimeoutDiagnosticStage;
  profileId: string | null;
  attempt: number;
  maxRetries: number;
  timeoutMs: number;
  elapsedMs: number;
  failureClass: Nhm2SelectedFamilyTimeoutDiagnosticFailureClass;
  message: string;
  lastKnownGateState: {
    surfaces: Nhm2SelectedFamilyTimeoutDiagnosticLatestSurface[];
  };
};

type BuildNhm2SelectedFamilyTimeoutDiagnosticInput = {
  generatedOn: string;
  generatedAt: string;
  stage: Nhm2SelectedFamilyTimeoutDiagnosticStage;
  profileId: string | null;
  attempt: number;
  maxRetries: number;
  timeoutMs: number;
  elapsedMs: number;
  message: string;
  surfaces: Nhm2SelectedFamilyTimeoutDiagnosticLatestSurface[];
};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isNullableText = (value: unknown): value is string | null =>
  value === null || asText(value) != null;

const isStage = (
  value: unknown,
): value is Nhm2SelectedFamilyTimeoutDiagnosticStage =>
  NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_STAGE_VALUES.includes(
    value as Nhm2SelectedFamilyTimeoutDiagnosticStage,
  );

const isFailureClass = (
  value: unknown,
): value is Nhm2SelectedFamilyTimeoutDiagnosticFailureClass =>
  NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_FAILURE_CLASS_VALUES.includes(
    value as Nhm2SelectedFamilyTimeoutDiagnosticFailureClass,
  );

const isSurface = (
  value: unknown,
): value is Nhm2SelectedFamilyTimeoutDiagnosticLatestSurface => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    asText(record.artifactId) != null &&
    isNullableText(record.profileId) &&
    asText(record.path) != null &&
    typeof record.exists === "boolean" &&
    isNullableText(record.status) &&
    isNullableText(record.lastWriteTimeIso)
  );
};

export const buildNhm2SelectedFamilyTimeoutDiagnosticArtifact = (
  args: BuildNhm2SelectedFamilyTimeoutDiagnosticInput,
): Nhm2SelectedFamilyTimeoutDiagnosticArtifact => ({
  artifactId: NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_ARTIFACT_ID,
  schemaVersion: NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_SCHEMA_VERSION,
  generatedOn: args.generatedOn,
  generatedAt: args.generatedAt,
  stage: args.stage,
  profileId: args.profileId,
  attempt: args.attempt,
  maxRetries: args.maxRetries,
  timeoutMs: args.timeoutMs,
  elapsedMs: args.elapsedMs,
  failureClass: "solver_timeout",
  message: args.message,
  lastKnownGateState: {
    surfaces: [...args.surfaces],
  },
});

export const isNhm2SelectedFamilyTimeoutDiagnosticArtifact = (
  value: unknown,
): value is Nhm2SelectedFamilyTimeoutDiagnosticArtifact => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const gateState = record.lastKnownGateState as Record<string, unknown> | undefined;
  const surfaces = gateState?.surfaces;
  return (
    record.artifactId === NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_ARTIFACT_ID &&
    record.schemaVersion === NHM2_SELECTED_FAMILY_TIMEOUT_DIAGNOSTIC_SCHEMA_VERSION &&
    asText(record.generatedOn) != null &&
    asText(record.generatedAt) != null &&
    isStage(record.stage) &&
    isNullableText(record.profileId) &&
    typeof record.attempt === "number" &&
    Number.isInteger(record.attempt) &&
    record.attempt >= 1 &&
    typeof record.maxRetries === "number" &&
    Number.isInteger(record.maxRetries) &&
    record.maxRetries >= 0 &&
    typeof record.timeoutMs === "number" &&
    Number.isFinite(record.timeoutMs) &&
    record.timeoutMs > 0 &&
    typeof record.elapsedMs === "number" &&
    Number.isFinite(record.elapsedMs) &&
    record.elapsedMs >= 0 &&
    isFailureClass(record.failureClass) &&
    asText(record.message) != null &&
    Array.isArray(surfaces) &&
    surfaces.every((entry) => isSurface(entry))
  );
};
