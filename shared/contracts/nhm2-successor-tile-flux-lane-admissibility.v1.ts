export const NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_ARTIFACT_ID =
  "nhm2_successor_tile_flux_lane_admissibility";
export const NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SCHEMA_VERSION =
  "nhm2_successor_tile_flux_lane_admissibility/v1";

export const NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_GATE_VERDICT_VALUES = [
  "successor_lane_admissibility_preflight_published",
  "successor_lane_admissibility_blocked",
] as const;

export const NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SURFACE_STATUS_VALUES =
  [
    "candidate_identified_without_semantics_widening",
    "candidate_requires_new_model_semantics",
    "candidate_not_present",
  ] as const;

export type Nhm2SuccessorTileFluxLaneAdmissibilityGateVerdict =
  (typeof NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_GATE_VERDICT_VALUES)[number];

export type Nhm2SuccessorTileFluxLaneAdmissibilitySurfaceStatus =
  (typeof NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SURFACE_STATUS_VALUES)[number];

export type Nhm2SuccessorTileFluxLaneAdmissibilityArtifactRef = {
  label: string;
  path: string | null;
};

export type Nhm2SuccessorTileFluxLaneAdmissibilitySurface = {
  surfaceId: string;
  status: Nhm2SuccessorTileFluxLaneAdmissibilitySurfaceStatus;
  note: string;
};

export type Nhm2SuccessorTileFluxLaneAdmissibilityArtifact = {
  artifactId: typeof NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SCHEMA_VERSION;
  generatedAt: string;
  assessmentId: string;
  currentLaneId: string;
  successorLaneId: string;
  selectedProfileLocked: string;
  currentLaneDisposition: string;
  currentPublishedProfileId: string | null;
  metricFluxPresent: boolean;
  tileEffectiveFluxPresent: boolean;
  tileEffectiveModelStatus: string;
  candidateAdmissibleSurfaces: Nhm2SuccessorTileFluxLaneAdmissibilitySurface[];
  candidateRejectedSurfaces: Nhm2SuccessorTileFluxLaneAdmissibilitySurface[];
  requiredNewEvidence: string[];
  forbiddenShortcuts: string[];
  blockingReasons: string[];
  admissibilityStatus: string;
  nextTechnicalAction: string;
  artifactRefs: Nhm2SuccessorTileFluxLaneAdmissibilityArtifactRef[];
  gateVerdict: Nhm2SuccessorTileFluxLaneAdmissibilityGateVerdict;
};

export type BuildNhm2SuccessorTileFluxLaneAdmissibilityArtifactInput = Omit<
  Nhm2SuccessorTileFluxLaneAdmissibilityArtifact,
  "artifactId" | "schemaVersion"
>;

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];

const toArtifactRefs = (
  value: unknown,
): Nhm2SuccessorTileFluxLaneAdmissibilityArtifactRef[] =>
  Array.isArray(value)
    ? value
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const record = entry as Record<string, unknown>;
          const label = asText(record.label);
          if (label == null) return null;
          return {
            label,
            path: asText(record.path),
          };
        })
        .filter(
          (
            entry,
          ): entry is Nhm2SuccessorTileFluxLaneAdmissibilityArtifactRef =>
            entry != null,
        )
    : [];

const toSurfaceAssessments = (
  value: unknown,
): Nhm2SuccessorTileFluxLaneAdmissibilitySurface[] =>
  Array.isArray(value)
    ? value
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const record = entry as Record<string, unknown>;
          const surfaceId = asText(record.surfaceId);
          const note = asText(record.note);
          const status = record.status;
          if (
            surfaceId == null ||
            note == null ||
            !NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SURFACE_STATUS_VALUES.includes(
              status as Nhm2SuccessorTileFluxLaneAdmissibilitySurfaceStatus,
            )
          ) {
            return null;
          }
          return {
            surfaceId,
            status,
            note,
          };
        })
        .filter(
          (
            entry,
          ): entry is Nhm2SuccessorTileFluxLaneAdmissibilitySurface =>
            entry != null,
        )
    : [];

export const buildNhm2SuccessorTileFluxLaneAdmissibilityArtifact = (
  input: BuildNhm2SuccessorTileFluxLaneAdmissibilityArtifactInput,
): Nhm2SuccessorTileFluxLaneAdmissibilityArtifact => ({
  artifactId: NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_ARTIFACT_ID,
  schemaVersion: NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SCHEMA_VERSION,
  generatedAt: asText(input.generatedAt) ?? new Date().toISOString(),
  assessmentId:
    asText(input.assessmentId) ??
    NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_ARTIFACT_ID,
  currentLaneId: asText(input.currentLaneId) ?? "unknown",
  successorLaneId: asText(input.successorLaneId) ?? "unknown",
  selectedProfileLocked: asText(input.selectedProfileLocked) ?? "unknown",
  currentLaneDisposition: asText(input.currentLaneDisposition) ?? "unknown",
  currentPublishedProfileId: asText(input.currentPublishedProfileId),
  metricFluxPresent: input.metricFluxPresent === true,
  tileEffectiveFluxPresent: input.tileEffectiveFluxPresent === true,
  tileEffectiveModelStatus:
    asText(input.tileEffectiveModelStatus) ?? "unknown",
  candidateAdmissibleSurfaces: toSurfaceAssessments(
    input.candidateAdmissibleSurfaces,
  ),
  candidateRejectedSurfaces: toSurfaceAssessments(
    input.candidateRejectedSurfaces,
  ),
  requiredNewEvidence: toStringArray(input.requiredNewEvidence),
  forbiddenShortcuts: toStringArray(input.forbiddenShortcuts),
  blockingReasons: toStringArray(input.blockingReasons),
  admissibilityStatus: asText(input.admissibilityStatus) ?? "unknown",
  nextTechnicalAction: asText(input.nextTechnicalAction) ?? "unknown",
  artifactRefs: toArtifactRefs(input.artifactRefs),
  gateVerdict:
    NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_GATE_VERDICT_VALUES.includes(
      input.gateVerdict,
    )
      ? input.gateVerdict
      : "successor_lane_admissibility_blocked",
});

export const isNhm2SuccessorTileFluxLaneAdmissibilityArtifact = (
  value: unknown,
): value is Nhm2SuccessorTileFluxLaneAdmissibilityArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const hasSurfaceArray = (entry: unknown): boolean =>
    Array.isArray(entry) &&
    entry.every((surface) => {
      if (!surface || typeof surface !== "object") return false;
      const surfaceRecord = surface as Record<string, unknown>;
      return (
        asText(surfaceRecord.surfaceId) != null &&
        asText(surfaceRecord.note) != null &&
        NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SURFACE_STATUS_VALUES.includes(
          surfaceRecord.status as Nhm2SuccessorTileFluxLaneAdmissibilitySurfaceStatus,
        )
      );
    });

  return (
    record.artifactId ===
      NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_ARTIFACT_ID &&
    record.schemaVersion ===
      NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_SCHEMA_VERSION &&
    asText(record.generatedAt) != null &&
    asText(record.assessmentId) != null &&
    asText(record.currentLaneId) != null &&
    asText(record.successorLaneId) != null &&
    asText(record.selectedProfileLocked) != null &&
    asText(record.currentLaneDisposition) != null &&
    typeof record.metricFluxPresent === "boolean" &&
    typeof record.tileEffectiveFluxPresent === "boolean" &&
    asText(record.tileEffectiveModelStatus) != null &&
    hasSurfaceArray(record.candidateAdmissibleSurfaces) &&
    hasSurfaceArray(record.candidateRejectedSurfaces) &&
    Array.isArray(record.requiredNewEvidence) &&
    record.requiredNewEvidence.every((entry) => asText(entry) != null) &&
    Array.isArray(record.forbiddenShortcuts) &&
    record.forbiddenShortcuts.every((entry) => asText(entry) != null) &&
    Array.isArray(record.blockingReasons) &&
    record.blockingReasons.every((entry) => asText(entry) != null) &&
    asText(record.admissibilityStatus) != null &&
    asText(record.nextTechnicalAction) != null &&
    Array.isArray(record.artifactRefs) &&
    record.artifactRefs.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const artifactRef = entry as Record<string, unknown>;
      return (
        asText(artifactRef.label) != null &&
        (artifactRef.path === null || asText(artifactRef.path) != null)
      );
    }) &&
    NHM2_SUCCESSOR_TILE_FLUX_LANE_ADMISSIBILITY_GATE_VERDICT_VALUES.includes(
      record.gateVerdict as Nhm2SuccessorTileFluxLaneAdmissibilityGateVerdict,
    )
  );
};
