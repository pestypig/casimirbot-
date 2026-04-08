export const NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID =
  "nhm2_shift_vs_lapse_decomposition";
export const NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION =
  "nhm2_shift_vs_lapse_decomposition/v1";

export const NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_REASON_CODES = [
  "shift_transport_time_missing",
  "proper_time_missing",
  "classical_reference_time_missing",
  "lapse_dial_missing",
  "residual_exceeds_tolerance",
] as const;

export const NHM2_SHIFT_VS_LAPSE_PROJECTION_SOURCE_VALUES = [
  "centerline_dtau_dt",
  "centerline_alpha",
  "missing",
] as const;

export const NHM2_SHIFT_VS_LAPSE_APPROXIMATION_STATUS_VALUES = [
  "approximate",
] as const;

export type Nhm2ShiftVsLapseDecompositionStatus =
  (typeof NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_STATUS_VALUES)[number];
export type Nhm2ShiftVsLapseDecompositionCompleteness =
  (typeof NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_COMPLETENESS_VALUES)[number];
export type Nhm2ShiftVsLapseDecompositionReasonCode =
  (typeof NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_REASON_CODES)[number];
export type Nhm2ShiftVsLapseProjectionSource =
  (typeof NHM2_SHIFT_VS_LAPSE_PROJECTION_SOURCE_VALUES)[number];
export type Nhm2ShiftVsLapseApproximationStatus =
  (typeof NHM2_SHIFT_VS_LAPSE_APPROXIMATION_STATUS_VALUES)[number];

export type Nhm2ShiftVsLapseDecompositionArtifact = {
  artifactId: typeof NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION;
  status: Nhm2ShiftVsLapseDecompositionStatus;
  completeness: Nhm2ShiftVsLapseDecompositionCompleteness;
  reasonCodes: Nhm2ShiftVsLapseDecompositionReasonCode[];
  profile: {
    familyId: string;
    shiftLapseProfileId: string | null;
    shiftLapseProfileStage: string | null;
    shiftLapseProfileNote: string | null;
  };
  sourceArtifacts: {
    missionTimeComparison: string | null;
    worldline: string | null;
  };
  method: {
    decompositionModelId: "fixed_shift_transport_plus_centerline_lapse_projection";
    approximationStatus: Nhm2ShiftVsLapseApproximationStatus;
    note: string;
    residualToleranceSeconds: number | null;
  };
  lapseDial: {
    centerlineAlpha: number | null;
    centerlineDtauDt: number | null;
    projectionSource: Nhm2ShiftVsLapseProjectionSource;
    projectionRatio: number | null;
  };
  timing: {
    interpretationStatus: string | null;
    warpCoordinateTimeSeconds: number | null;
    warpProperTimeSeconds: number | null;
    classicalReferenceTimeSeconds: number | null;
    reportedProperMinusCoordinateSeconds: number | null;
    reportedProperVsCoordinateRatio: number | null;
    coordinateMinusClassicalSeconds: number | null;
  };
  decomposition: {
    fixedShiftFamilyTransportContributionSeconds: number | null;
    lapseProfileClockRateContributionSeconds: number | null;
    residualUnexplainedContributionSeconds: number | null;
    reconstructedProperTimeSeconds: number | null;
    totalMissionTimeDifferentialSeconds: number | null;
    lapseDialTrackedFraction: number | null;
  };
};

export type BuildNhm2ShiftVsLapseDecompositionArtifactInput = {
  familyId?: string | null;
  shiftLapseProfileId?: string | null;
  shiftLapseProfileStage?: string | null;
  shiftLapseProfileNote?: string | null;
  sourceMissionTimeComparisonArtifactPath?: string | null;
  sourceWorldlineArtifactPath?: string | null;
  centerlineAlpha?: number | null;
  centerlineDtauDt?: number | null;
  interpretationStatus?: string | null;
  warpCoordinateTimeSeconds?: number | null;
  warpProperTimeSeconds?: number | null;
  classicalReferenceTimeSeconds?: number | null;
  properMinusCoordinateSeconds?: number | null;
  properVsCoordinateRatio?: number | null;
  coordinateMinusClassicalSeconds?: number | null;
  residualToleranceSeconds?: number | null;
};

const EPS = 1e-12;

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toRepoStylePath = (value: unknown): string | null => {
  const text = asText(value);
  return text ? text.replace(/\\/g, "/") : null;
};

const toFinite = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toReasonCodeSet = (
  values: Iterable<Nhm2ShiftVsLapseDecompositionReasonCode>,
): Nhm2ShiftVsLapseDecompositionReasonCode[] =>
  [...new Set(values)].sort();

const resolveProjection = (args: {
  centerlineAlpha: number | null;
  centerlineDtauDt: number | null;
}): {
  projectionSource: Nhm2ShiftVsLapseProjectionSource;
  projectionRatio: number | null;
} => {
  if (args.centerlineDtauDt != null) {
    return {
      projectionSource: "centerline_dtau_dt",
      projectionRatio: args.centerlineDtauDt,
    };
  }
  if (args.centerlineAlpha != null) {
    return {
      projectionSource: "centerline_alpha",
      projectionRatio: args.centerlineAlpha,
    };
  }
  return {
    projectionSource: "missing",
    projectionRatio: null,
  };
};

const finiteRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator != null &&
  denominator != null &&
  Math.abs(denominator) > EPS
    ? numerator / denominator
    : null;

export const buildNhm2ShiftVsLapseDecompositionArtifact = (
  input: BuildNhm2ShiftVsLapseDecompositionArtifactInput,
): Nhm2ShiftVsLapseDecompositionArtifact => {
  const centerlineAlpha = toFinite(input.centerlineAlpha);
  const centerlineDtauDt = toFinite(input.centerlineDtauDt);
  const warpCoordinateTimeSeconds = toFinite(input.warpCoordinateTimeSeconds);
  const warpProperTimeSeconds = toFinite(input.warpProperTimeSeconds);
  const classicalReferenceTimeSeconds = toFinite(input.classicalReferenceTimeSeconds);
  const residualToleranceSeconds = toFinite(input.residualToleranceSeconds);
  const projection = resolveProjection({
    centerlineAlpha,
    centerlineDtauDt,
  });
  const reportedProperMinusCoordinateSeconds =
    toFinite(input.properMinusCoordinateSeconds) ??
    (warpProperTimeSeconds != null && warpCoordinateTimeSeconds != null
      ? warpProperTimeSeconds - warpCoordinateTimeSeconds
      : null);
  const reportedProperVsCoordinateRatio =
    toFinite(input.properVsCoordinateRatio) ??
    finiteRatio(warpProperTimeSeconds, warpCoordinateTimeSeconds);
  const coordinateMinusClassicalSeconds =
    toFinite(input.coordinateMinusClassicalSeconds) ??
    (warpCoordinateTimeSeconds != null && classicalReferenceTimeSeconds != null
      ? warpCoordinateTimeSeconds - classicalReferenceTimeSeconds
      : null);

  const fixedShiftFamilyTransportContributionSeconds = warpCoordinateTimeSeconds;
  const lapseProfileClockRateContributionSeconds =
    warpCoordinateTimeSeconds != null && projection.projectionRatio != null
      ? warpCoordinateTimeSeconds * (projection.projectionRatio - 1)
      : null;
  const reconstructedProperTimeSeconds =
    fixedShiftFamilyTransportContributionSeconds != null &&
    lapseProfileClockRateContributionSeconds != null
      ? fixedShiftFamilyTransportContributionSeconds +
        lapseProfileClockRateContributionSeconds
      : null;
  const residualUnexplainedContributionSeconds =
    warpProperTimeSeconds != null && reconstructedProperTimeSeconds != null
      ? warpProperTimeSeconds - reconstructedProperTimeSeconds
      : null;
  const totalMissionTimeDifferentialSeconds =
    warpProperTimeSeconds != null && classicalReferenceTimeSeconds != null
      ? warpProperTimeSeconds - classicalReferenceTimeSeconds
      : reportedProperMinusCoordinateSeconds != null &&
          coordinateMinusClassicalSeconds != null
        ? reportedProperMinusCoordinateSeconds + coordinateMinusClassicalSeconds
        : reportedProperMinusCoordinateSeconds;
  const lapseDialTrackedFraction =
    lapseProfileClockRateContributionSeconds != null &&
    totalMissionTimeDifferentialSeconds != null &&
    Math.abs(totalMissionTimeDifferentialSeconds) > EPS
      ? lapseProfileClockRateContributionSeconds /
        totalMissionTimeDifferentialSeconds
      : null;

  const reasonCodes = toReasonCodeSet([
    ...(warpCoordinateTimeSeconds == null ? ["shift_transport_time_missing"] : []),
    ...(warpProperTimeSeconds == null ? ["proper_time_missing"] : []),
    ...(classicalReferenceTimeSeconds == null
      ? ["classical_reference_time_missing"]
      : []),
    ...(projection.projectionRatio == null ? ["lapse_dial_missing"] : []),
    ...(residualUnexplainedContributionSeconds != null &&
    residualToleranceSeconds != null &&
    Math.abs(residualUnexplainedContributionSeconds) >
      Math.max(residualToleranceSeconds, 0)
      ? ["residual_exceeds_tolerance"]
      : []),
  ] satisfies Nhm2ShiftVsLapseDecompositionReasonCode[]);

  const completeness =
    reasonCodes.includes("shift_transport_time_missing") ||
    reasonCodes.includes("proper_time_missing") ||
    reasonCodes.includes("classical_reference_time_missing") ||
    reasonCodes.includes("lapse_dial_missing")
      ? "incomplete"
      : "complete";
  const status =
    completeness === "incomplete"
      ? "unavailable"
      : reasonCodes.includes("residual_exceeds_tolerance")
        ? "review"
        : "pass";

  return {
    artifactId: NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID,
    schemaVersion: NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION,
    status,
    completeness,
    reasonCodes,
    profile: {
      familyId: asText(input.familyId) ?? "nhm2_shift_lapse",
      shiftLapseProfileId: asText(input.shiftLapseProfileId),
      shiftLapseProfileStage: asText(input.shiftLapseProfileStage),
      shiftLapseProfileNote: asText(input.shiftLapseProfileNote),
    },
    sourceArtifacts: {
      missionTimeComparison: toRepoStylePath(
        input.sourceMissionTimeComparisonArtifactPath,
      ),
      worldline: toRepoStylePath(input.sourceWorldlineArtifactPath),
    },
    method: {
      decompositionModelId:
        "fixed_shift_transport_plus_centerline_lapse_projection",
      approximationStatus: "approximate",
      note:
        "The fixed shift-family transport contribution is the bounded warp coordinate transport time. The lapse contribution is projected from the metric-derived centerline lapse dial, and any nonuniform or off-center clocking drift remains in the residual term.",
      residualToleranceSeconds,
    },
    lapseDial: {
      centerlineAlpha,
      centerlineDtauDt,
      projectionSource: projection.projectionSource,
      projectionRatio: projection.projectionRatio,
    },
    timing: {
      interpretationStatus: asText(input.interpretationStatus),
      warpCoordinateTimeSeconds,
      warpProperTimeSeconds,
      classicalReferenceTimeSeconds,
      reportedProperMinusCoordinateSeconds,
      reportedProperVsCoordinateRatio,
      coordinateMinusClassicalSeconds,
    },
    decomposition: {
      fixedShiftFamilyTransportContributionSeconds,
      lapseProfileClockRateContributionSeconds,
      residualUnexplainedContributionSeconds,
      reconstructedProperTimeSeconds,
      totalMissionTimeDifferentialSeconds,
      lapseDialTrackedFraction,
    },
  };
};

const isStatus = (
  value: unknown,
): value is Nhm2ShiftVsLapseDecompositionStatus =>
  NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_STATUS_VALUES.includes(
    value as Nhm2ShiftVsLapseDecompositionStatus,
  );

const isCompleteness = (
  value: unknown,
): value is Nhm2ShiftVsLapseDecompositionCompleteness =>
  NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_COMPLETENESS_VALUES.includes(
    value as Nhm2ShiftVsLapseDecompositionCompleteness,
  );

const isReasonCode = (
  value: unknown,
): value is Nhm2ShiftVsLapseDecompositionReasonCode =>
  NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_REASON_CODES.includes(
    value as Nhm2ShiftVsLapseDecompositionReasonCode,
  );

const isProjectionSource = (
  value: unknown,
): value is Nhm2ShiftVsLapseProjectionSource =>
  NHM2_SHIFT_VS_LAPSE_PROJECTION_SOURCE_VALUES.includes(
    value as Nhm2ShiftVsLapseProjectionSource,
  );

const isApproximationStatus = (
  value: unknown,
): value is Nhm2ShiftVsLapseApproximationStatus =>
  NHM2_SHIFT_VS_LAPSE_APPROXIMATION_STATUS_VALUES.includes(
    value as Nhm2ShiftVsLapseApproximationStatus,
  );

const isNullableFinite = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

export const isNhm2ShiftVsLapseDecompositionArtifact = (
  value: unknown,
): value is Nhm2ShiftVsLapseDecompositionArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    record.artifactId !== NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID ||
    record.schemaVersion !== NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION ||
    !isStatus(record.status) ||
    !isCompleteness(record.completeness) ||
    !Array.isArray(record.reasonCodes) ||
    !record.reasonCodes.every(isReasonCode)
  ) {
    return false;
  }

  const profile =
    record.profile && typeof record.profile === "object"
      ? (record.profile as Record<string, unknown>)
      : null;
  const sourceArtifacts =
    record.sourceArtifacts && typeof record.sourceArtifacts === "object"
      ? (record.sourceArtifacts as Record<string, unknown>)
      : null;
  const method =
    record.method && typeof record.method === "object"
      ? (record.method as Record<string, unknown>)
      : null;
  const lapseDial =
    record.lapseDial && typeof record.lapseDial === "object"
      ? (record.lapseDial as Record<string, unknown>)
      : null;
  const timing =
    record.timing && typeof record.timing === "object"
      ? (record.timing as Record<string, unknown>)
      : null;
  const decomposition =
    record.decomposition && typeof record.decomposition === "object"
      ? (record.decomposition as Record<string, unknown>)
      : null;

  return Boolean(
    profile &&
      typeof profile.familyId === "string" &&
      isNullableString(profile.shiftLapseProfileId) &&
      isNullableString(profile.shiftLapseProfileStage) &&
      isNullableString(profile.shiftLapseProfileNote) &&
      sourceArtifacts &&
      isNullableString(sourceArtifacts.missionTimeComparison) &&
      isNullableString(sourceArtifacts.worldline) &&
      method &&
      method.decompositionModelId ===
        "fixed_shift_transport_plus_centerline_lapse_projection" &&
      isApproximationStatus(method.approximationStatus) &&
      typeof method.note === "string" &&
      isNullableFinite(method.residualToleranceSeconds) &&
      lapseDial &&
      isNullableFinite(lapseDial.centerlineAlpha) &&
      isNullableFinite(lapseDial.centerlineDtauDt) &&
      isProjectionSource(lapseDial.projectionSource) &&
      isNullableFinite(lapseDial.projectionRatio) &&
      timing &&
      isNullableString(timing.interpretationStatus) &&
      isNullableFinite(timing.warpCoordinateTimeSeconds) &&
      isNullableFinite(timing.warpProperTimeSeconds) &&
      isNullableFinite(timing.classicalReferenceTimeSeconds) &&
      isNullableFinite(timing.reportedProperMinusCoordinateSeconds) &&
      isNullableFinite(timing.reportedProperVsCoordinateRatio) &&
      isNullableFinite(timing.coordinateMinusClassicalSeconds) &&
      decomposition &&
      isNullableFinite(
        decomposition.fixedShiftFamilyTransportContributionSeconds,
      ) &&
      isNullableFinite(
        decomposition.lapseProfileClockRateContributionSeconds,
      ) &&
      isNullableFinite(
        decomposition.residualUnexplainedContributionSeconds,
      ) &&
      isNullableFinite(decomposition.reconstructedProperTimeSeconds) &&
      isNullableFinite(decomposition.totalMissionTimeDifferentialSeconds) &&
      isNullableFinite(decomposition.lapseDialTrackedFraction),
  );
};
