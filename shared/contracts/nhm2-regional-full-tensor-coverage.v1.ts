import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import {
  NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS,
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
} from "./nhm2-same-chart-full-tensor.v1";

export const NHM2_REGIONAL_FULL_TENSOR_COVERAGE_CONTRACT_VERSION =
  "nhm2_regional_full_tensor_coverage/v1";

export type Nhm2RegionalFullTensorCoverageRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  artifactRef: string | null;
  sampleCount: number | null;
  hasMetricRequiredSameChartFullTensor: boolean;
  fullTensorComplete: boolean | null;
  missingComponentIds: string[];
  zeroSampleBlocked: boolean;
  blockers: string[];
  warnings: string[];
};

export type Nhm2RegionalFullTensorCoverageArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_FULL_TENSOR_COVERAGE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  sourceClosureRef: string;
  runtimeArtifactRef: string;
  requiredRegionIds: Nhm2RegionalSourceClosureRegionId[];
  regions: Nhm2RegionalFullTensorCoverageRegionV1[];
  summary: {
    allRegionsHaveArtifacts: boolean;
    allRegionsHaveSamples: boolean;
    metricSideFullTensorReady: boolean;
    zeroSampleRegionIds: Nhm2RegionalSourceClosureRegionId[];
    missingArtifactRegionIds: Nhm2RegionalSourceClosureRegionId[];
    incompleteRegionIds: Nhm2RegionalSourceClosureRegionId[];
    firstBlocker: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    metricSideCoverageOnly: true;
    doesNotValidateSourceSide: true;
    doesNotPromotePhysicalViability: true;
  };
};

export type BuildNhm2RegionalFullTensorCoverageRegionInput = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  artifactRef?: string | null;
  sampleCount?: number | null;
  sameChartFullTensor?: Nhm2SameChartFullTensorArtifactV1 | null;
  blockers?: string[] | null;
  warnings?: string[] | null;
};

export type BuildNhm2RegionalFullTensorCoverageInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  sourceClosureRef: string;
  runtimeArtifactRef: string;
  regions: BuildNhm2RegionalFullTensorCoverageRegionInput[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const asText = (value: unknown): string | null =>
  isText(value) ? value.trim() : null;

const asNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.filter((entry) => entry.trim().length > 0)));

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const normalizeRegion = (
  input: BuildNhm2RegionalFullTensorCoverageRegionInput,
): Nhm2RegionalFullTensorCoverageRegionV1 => {
  const sampleCount = asNullableNumber(input.sampleCount);
  const tensor = isNhm2SameChartFullTensorArtifact(input.sameChartFullTensor)
    ? input.sameChartFullTensor
    : null;
  const hasTensor = tensor != null;
  const fullTensorComplete = tensor?.completeness.fullTensorComplete ?? null;
  const missingComponentIds =
    tensor?.completeness.missingComponentIds.slice() ??
    NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS.slice();
  const zeroSampleBlocked = sampleCount == null || sampleCount <= 0;
  const blockers = new Set(input.blockers ?? []);

  if (!hasTensor) {
    blockers.add("metric_required_region_same_chart_full_tensor_missing");
  }
  if (zeroSampleBlocked) {
    blockers.add(
      sampleCount == null
        ? "metric_required_region_sample_count_missing"
        : "metric_required_region_zero_samples",
    );
  }
  if (fullTensorComplete !== true) {
    blockers.add("metric_required_region_same_chart_full_tensor_incomplete");
  }

  return {
    regionId: input.regionId,
    artifactRef: asText(input.artifactRef),
    sampleCount,
    hasMetricRequiredSameChartFullTensor: hasTensor,
    fullTensorComplete,
    missingComponentIds,
    zeroSampleBlocked,
    blockers: Array.from(blockers),
    warnings: unique(input.warnings ?? []),
  };
};

export const buildNhm2RegionalFullTensorCoverageArtifact = (
  input: BuildNhm2RegionalFullTensorCoverageInput,
): Nhm2RegionalFullTensorCoverageArtifactV1 => {
  const byRegion = new Map<
    Nhm2RegionalSourceClosureRegionId,
    BuildNhm2RegionalFullTensorCoverageRegionInput
  >();
  for (const region of input.regions) {
    byRegion.set(region.regionId, region);
  }

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    normalizeRegion(
      byRegion.get(regionId) ?? {
        regionId,
        blockers: ["metric_required_region_coverage_missing"],
      },
    ),
  );
  const zeroSampleRegionIds = regions
    .filter((region) => region.zeroSampleBlocked)
    .map((region) => region.regionId);
  const missingArtifactRegionIds = regions
    .filter((region) => !region.hasMetricRequiredSameChartFullTensor)
    .map((region) => region.regionId);
  const incompleteRegionIds = regions
    .filter((region) => region.fullTensorComplete !== true)
    .map((region) => region.regionId);
  const allRegionsHaveArtifacts = missingArtifactRegionIds.length === 0;
  const allRegionsHaveSamples = zeroSampleRegionIds.length === 0;
  const metricSideFullTensorReady =
    allRegionsHaveArtifacts &&
    allRegionsHaveSamples &&
    incompleteRegionIds.length === 0;
  const allBlockers = regions.flatMap((region) => region.blockers);
  const firstBlocker =
    allBlockers.find((blocker) => blocker.includes("same_chart_full_tensor_missing")) ??
    allBlockers.find((blocker) => blocker.includes("same_chart_full_tensor_incomplete")) ??
    allBlockers[0] ??
    null;

  return {
    contractVersion: NHM2_REGIONAL_FULL_TENSOR_COVERAGE_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: asText(input.selectedProfileId) ?? "unknown",
    sourceClosureRef: input.sourceClosureRef,
    runtimeArtifactRef: input.runtimeArtifactRef,
    requiredRegionIds: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
    regions,
    summary: {
      allRegionsHaveArtifacts,
      allRegionsHaveSamples,
      metricSideFullTensorReady,
      zeroSampleRegionIds,
      missingArtifactRegionIds,
      incompleteRegionIds,
      firstBlocker,
    },
    claimBoundary: {
      diagnosticOnly: true,
      metricSideCoverageOnly: true,
      doesNotValidateSourceSide: true,
      doesNotPromotePhysicalViability: true,
    },
  };
};

const isCoverageRegion = (
  value: unknown,
): value is Nhm2RegionalFullTensorCoverageRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    (record.artifactRef === null || isText(record.artifactRef)) &&
    (record.sampleCount === null || Number.isFinite(Number(record.sampleCount))) &&
    typeof record.hasMetricRequiredSameChartFullTensor === "boolean" &&
    (record.fullTensorComplete === null || typeof record.fullTensorComplete === "boolean") &&
    isStringList(record.missingComponentIds) &&
    typeof record.zeroSampleBlocked === "boolean" &&
    isStringList(record.blockers) &&
    isStringList(record.warnings)
  );
};

export const isNhm2RegionalFullTensorCoverageArtifact = (
  value: unknown,
): value is Nhm2RegionalFullTensorCoverageArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_REGIONAL_FULL_TENSOR_COVERAGE_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    isText(record.laneId) &&
    isText(record.selectedProfileId) &&
    isText(record.sourceClosureRef) &&
    isText(record.runtimeArtifactRef) &&
    Array.isArray(record.requiredRegionIds) &&
    record.requiredRegionIds.every(isRegionId) &&
    Array.isArray(record.regions) &&
    record.regions.every(isCoverageRegion) &&
    summary != null &&
    typeof summary.allRegionsHaveArtifacts === "boolean" &&
    typeof summary.allRegionsHaveSamples === "boolean" &&
    typeof summary.metricSideFullTensorReady === "boolean" &&
    Array.isArray(summary.zeroSampleRegionIds) &&
    summary.zeroSampleRegionIds.every(isRegionId) &&
    Array.isArray(summary.missingArtifactRegionIds) &&
    summary.missingArtifactRegionIds.every(isRegionId) &&
    Array.isArray(summary.incompleteRegionIds) &&
    summary.incompleteRegionIds.every(isRegionId) &&
    (summary.firstBlocker === null || isText(summary.firstBlocker)) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.metricSideCoverageOnly === true &&
    claimBoundary.doesNotValidateSourceSide === true &&
    claimBoundary.doesNotPromotePhysicalViability === true
  );
};
