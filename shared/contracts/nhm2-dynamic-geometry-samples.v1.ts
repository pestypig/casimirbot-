export const NHM2_DYNAMIC_GEOMETRY_SAMPLES_CONTRACT_VERSION =
  "nhm2_dynamic_geometry_samples/v1";

export const NHM2_DYNAMIC_GEOMETRY_SAMPLE_STATUS_VALUES = [
  "computed",
  "missing",
  "proxy",
  "not_run",
] as const;

export type Nhm2DynamicGeometrySampleStatus =
  (typeof NHM2_DYNAMIC_GEOMETRY_SAMPLE_STATUS_VALUES)[number];

export const NHM2_DYNAMIC_GEOMETRY_SAMPLE_SOURCE_KIND_VALUES = [
  "gr_evolve_brick",
  "runtime_artifact",
  "missing",
] as const;

export type Nhm2DynamicGeometrySampleSourceKind =
  (typeof NHM2_DYNAMIC_GEOMETRY_SAMPLE_SOURCE_KIND_VALUES)[number];

export const NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "gamma_xx",
  "gamma_yy",
  "gamma_zz",
  "gamma_xy",
  "gamma_xz",
  "gamma_yz",
  "K_xx",
  "K_yy",
  "K_zz",
  "K_xy",
  "K_xz",
  "K_yz",
  "H_constraint",
  "M_constraint_x",
  "M_constraint_y",
  "M_constraint_z",
] as const;

export type Nhm2DynamicGeometrySampleV1 = {
  sampleId: string;
  timeSeconds: number | null;
  geometryRef: string | null;
  sourceKind: Nhm2DynamicGeometrySampleSourceKind;
  requiredChannels: string[];
  availableChannels: string[];
  missingChannels: string[];
  status: Nhm2DynamicGeometrySampleStatus;
  blockers: string[];
};

export type Nhm2DynamicGeometrySamplesArtifactV1 = {
  contractVersion: typeof NHM2_DYNAMIC_GEOMETRY_SAMPLES_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  sourceTensorRef: string | null;
  switchingConservationRef: string | null;
  frequencyConvergenceRef: string | null;
  samplePlan: {
    timeSliceCount: number;
    cycleCount: number | null;
    averagingWindowSeconds: number | null;
    fixedCycleAverageSource: boolean | null;
  };
  samples: Nhm2DynamicGeometrySampleV1[];
  summary: {
    dynamicGeometrySamplesAvailable: boolean;
    sampleCount: number;
    computedSampleCount: number;
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    staticGeometryCannotSubstituteForDynamicSamples: true;
    physicalViabilityClaimAllowed: false;
  };
};

export type BuildNhm2DynamicGeometrySamplesInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sourceTensorRef?: string | null;
  switchingConservationRef?: string | null;
  frequencyConvergenceRef?: string | null;
  cycleCount?: number | null;
  averagingWindowSeconds?: number | null;
  fixedCycleAverageSource?: boolean | null;
  samples?: Array<{
    sampleId?: string | null;
    timeSeconds?: number | null;
    geometryRef?: string | null;
    sourceKind?: Nhm2DynamicGeometrySampleSourceKind | null;
    requiredChannels?: string[] | null;
    availableChannels?: string[] | null;
    missingChannels?: string[] | null;
    status?: Nhm2DynamicGeometrySampleStatus | null;
    blockers?: string[] | null;
  }> | null;
  blockers?: string[] | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const isStatus = (value: unknown): value is Nhm2DynamicGeometrySampleStatus =>
  NHM2_DYNAMIC_GEOMETRY_SAMPLE_STATUS_VALUES.includes(
    value as Nhm2DynamicGeometrySampleStatus,
  );

const isSourceKind = (
  value: unknown,
): value is Nhm2DynamicGeometrySampleSourceKind =>
  NHM2_DYNAMIC_GEOMETRY_SAMPLE_SOURCE_KIND_VALUES.includes(
    value as Nhm2DynamicGeometrySampleSourceKind,
  );

const asTextArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? uniqueText(
        value.map((entry) => (typeof entry === "string" ? entry : null)),
      )
    : [];

export const buildNhm2DynamicGeometrySamples = (
  input: BuildNhm2DynamicGeometrySamplesInput,
): Nhm2DynamicGeometrySamplesArtifactV1 => {
  const samples = (input.samples ?? []).map((sample, index) => {
    const status = isStatus(sample.status) ? sample.status : "missing";
    const geometryRef = asText(sample.geometryRef);
    const sourceKind = isSourceKind(sample.sourceKind)
      ? sample.sourceKind
      : geometryRef == null
        ? "missing"
        : "runtime_artifact";
    const requiredChannels = asTextArray(sample.requiredChannels);
    const availableChannels = asTextArray(sample.availableChannels);
    const inferredMissingChannels = requiredChannels.filter(
      (channel) => !availableChannels.includes(channel),
    );
    const missingChannels = uniqueText([
      ...asTextArray(sample.missingChannels),
      ...inferredMissingChannels,
    ]);
    const blockers = uniqueText([
      ...(sample.blockers ?? []),
      status === "computed" ? null : "dynamic_geometry_sample_not_computed",
      geometryRef == null ? "dynamic_geometry_sample_ref_missing" : null,
      sourceKind === "missing" ? "dynamic_geometry_sample_source_missing" : null,
      status === "computed" && sourceKind !== "gr_evolve_brick"
        ? "dynamic_geometry_sample_source_not_gr_evolve_brick"
        : null,
      status === "computed" && requiredChannels.length === 0
        ? "dynamic_geometry_required_channels_missing"
        : null,
      status === "computed" && missingChannels.length > 0
        ? "dynamic_geometry_required_channels_missing"
        : null,
      status === "proxy" ? "dynamic_geometry_proxy_inadmissible" : null,
    ]);
    return {
      sampleId: asText(sample.sampleId) ?? `sample_${index}`,
      timeSeconds: toFinite(sample.timeSeconds),
      geometryRef,
      sourceKind,
      requiredChannels,
      availableChannels,
      missingChannels,
      status,
      blockers,
    };
  });
  const computedSampleCount = samples.filter(
    (sample) => sample.status === "computed" && sample.blockers.length === 0,
  ).length;
  const topLevelBlockers = uniqueText([
    ...(input.blockers ?? []),
    samples.length === 0 ? "dynamic_geometry_samples_missing" : null,
    computedSampleCount === 0 ? "dynamic_geometry_samples_missing" : null,
    input.fixedCycleAverageSource === true ? null : "cycle_average_source_not_fixed",
    toFinite(input.averagingWindowSeconds) == null
      ? "averaging_window_seconds_missing"
      : null,
    ...samples.flatMap((sample) =>
      sample.blockers.map((blocker) => `${sample.sampleId}:${blocker}`),
    ),
  ]);
  return {
    contractVersion: NHM2_DYNAMIC_GEOMETRY_SAMPLES_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId:
      asText(input.selectedProfileId) ?? "stage1_centerline_alpha_0p995_v1",
    runId: asText(input.runId) ?? "unknown",
    chartId: asText(input.chartId) ?? "comoving_cartesian",
    atlasRef: asText(input.atlasRef),
    atlasHash: asText(input.atlasHash),
    sourceTensorRef: asText(input.sourceTensorRef),
    switchingConservationRef: asText(input.switchingConservationRef),
    frequencyConvergenceRef: asText(input.frequencyConvergenceRef),
    samplePlan: {
      timeSliceCount: samples.length,
      cycleCount: toFinite(input.cycleCount),
      averagingWindowSeconds: toFinite(input.averagingWindowSeconds),
      fixedCycleAverageSource: input.fixedCycleAverageSource ?? null,
    },
    samples,
    summary: {
      dynamicGeometrySamplesAvailable: topLevelBlockers.length === 0,
      sampleCount: samples.length,
      computedSampleCount,
      firstBlocker: topLevelBlockers[0] ?? null,
      blockerCount: topLevelBlockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      staticGeometryCannotSubstituteForDynamicSamples: true,
      physicalViabilityClaimAllowed: false,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isSample = (value: unknown): value is Nhm2DynamicGeometrySampleV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.sampleId === "string" &&
    record.sampleId.trim().length > 0 &&
    isNullableNumber(record.timeSeconds) &&
    isNullableText(record.geometryRef) &&
    isSourceKind(record.sourceKind) &&
    isStringArray(record.requiredChannels) &&
    isStringArray(record.availableChannels) &&
    isStringArray(record.missingChannels) &&
    isStatus(record.status) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2DynamicGeometrySamplesArtifact = (
  value: unknown,
): value is Nhm2DynamicGeometrySamplesArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const samplePlan = isRecord(record?.samplePlan) ? record.samplePlan : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_DYNAMIC_GEOMETRY_SAMPLES_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    typeof record.chartId === "string" &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.sourceTensorRef) &&
    isNullableText(record.switchingConservationRef) &&
    isNullableText(record.frequencyConvergenceRef) &&
    samplePlan != null &&
    typeof samplePlan.timeSliceCount === "number" &&
    Number.isInteger(samplePlan.timeSliceCount) &&
    isNullableNumber(samplePlan.cycleCount) &&
    isNullableNumber(samplePlan.averagingWindowSeconds) &&
    (samplePlan.fixedCycleAverageSource === null ||
      typeof samplePlan.fixedCycleAverageSource === "boolean") &&
    Array.isArray(record.samples) &&
    record.samples.every(isSample) &&
    summary != null &&
    typeof summary.dynamicGeometrySamplesAvailable === "boolean" &&
    typeof summary.sampleCount === "number" &&
    typeof summary.computedSampleCount === "number" &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.staticGeometryCannotSubstituteForDynamicSamples === true &&
    claimBoundary.physicalViabilityClaimAllowed === false
  );
};
