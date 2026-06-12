import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
  type Nhm2SameChartFullTensorProvenanceSource,
} from "./nhm2-same-chart-full-tensor.v1";

export const NHM2_METRIC_REQUIRED_REGIONAL_FULL_TENSOR_SOURCE_CONTRACT_VERSION =
  "nhm2_metric_required_regional_full_tensor_source/v1";

export type Nhm2MetricRequiredRegionalFullTensorSourceRoute =
  | "einstein_tensor_geometry_fd4_v1"
  | "adm_projection"
  | "runtime_artifact";

export type Nhm2MetricRequiredRegionalFullTensorSourceRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "computed" | "partial" | "missing" | "blocked";
  artifactRef: string;
  tensorRef?: string;
  regionMaskRef: string | null;
  aggregationMode: "mean" | "integral" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "unknown";
  sampleCount: number | null;
  sameChartFullTensor: Nhm2SameChartFullTensorArtifactV1;
  blockers: string[];
  warnings: string[];
};

export type Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 = {
  contractVersion: typeof NHM2_METRIC_REQUIRED_REGIONAL_FULL_TENSOR_SOURCE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  chartId: string;
  metricFamily: string;
  sourceRoute: Nhm2MetricRequiredRegionalFullTensorSourceRoute;
  sourceArtifactRefs: string[];
  regions: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1[];
  summary: {
    allRequiredRegionsPresent: boolean;
    allRequiredRegionsFullTensor: boolean;
    allAggregationMetadataKnown: boolean;
    globalOnlySource: boolean;
    blockedRegionIds: Nhm2RegionalSourceClosureRegionId[];
    missingRegionIds: Nhm2RegionalSourceClosureRegionId[];
    firstBlocker: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    metricRequiredGeometryRouteOnly: true;
    validatesPhysicalSource: false;
    promotesViability: false;
  };
};

export type BuildNhm2MetricRequiredRegionalFullTensorSourceInput = Omit<
  Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1,
  "contractVersion" | "summary" | "claimBoundary"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isStatus = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceRegionV1["status"] =>
  value === "computed" ||
  value === "partial" ||
  value === "missing" ||
  value === "blocked";

const isAggregationMode = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceRegionV1["aggregationMode"] =>
  value === "mean" || value === "integral" || value === "unknown";

const isNormalizationBasis = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceRegionV1["normalizationBasis"] =>
  value === "sample_count" || value === "volume" || value === "unknown";

const isSourceRoute = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceRoute =>
  value === "einstein_tensor_geometry_fd4_v1" ||
  value === "adm_projection" ||
  value === "runtime_artifact";

const isCompleteSameChartStatus = (
  status: string,
): boolean => status === "computed" || status === "derived_same_chart";

const sameChartSourceRank = (
  source: Nhm2SameChartFullTensorProvenanceSource,
): number => {
  if (source === "einstein_tensor_geometry_fd4_v1") return 3;
  if (source === "adm_projection") return 2;
  if (source === "runtime_artifact") return 1;
  return 0;
};

const inferSourceRoute = (
  inputRoute: Nhm2MetricRequiredRegionalFullTensorSourceRoute | null | undefined,
  regions: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1[],
): Nhm2MetricRequiredRegionalFullTensorSourceRoute => {
  if (isSourceRoute(inputRoute)) return inputRoute;
  let selected: Nhm2SameChartFullTensorProvenanceSource = "missing";
  for (const region of regions) {
    for (const component of region.sameChartFullTensor.components) {
      if (sameChartSourceRank(component.provenance.source) > sameChartSourceRank(selected)) {
        selected = component.provenance.source;
      }
    }
  }
  return selected === "missing" ? "runtime_artifact" : selected;
};

const normalizeRegion = (
  region: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1,
): Nhm2MetricRequiredRegionalFullTensorSourceRegionV1 => {
  const anyComplete = region.sameChartFullTensor.components.some((component) =>
    isCompleteSameChartStatus(component.status),
  );
  const fullTensorComplete = region.sameChartFullTensor.completeness.fullTensorComplete;
  const normalizedStatus =
    region.status === "computed" && !fullTensorComplete
      ? anyComplete
        ? "partial"
        : "missing"
      : region.status;
  const blockers = new Set(region.blockers);
  if (!fullTensorComplete) blockers.add("metric_required_region_full_tensor_incomplete");
  if (region.regionMaskRef == null) blockers.add("metric_required_region_mask_ref_missing");
  if (region.aggregationMode === "unknown") {
    blockers.add("metric_required_region_full_tensor_aggregation_missing");
  }
  if (region.normalizationBasis === "unknown") {
    blockers.add("metric_required_region_full_tensor_normalization_missing");
  }
  if (region.sampleCount == null) {
    blockers.add("metric_required_region_full_tensor_sample_count_missing");
  }
  return {
    ...region,
    status: normalizedStatus,
    blockers: Array.from(blockers),
  };
};

export const buildNhm2MetricRequiredRegionalFullTensorSourceArtifact = (
  input: BuildNhm2MetricRequiredRegionalFullTensorSourceInput,
): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  const byRegion = new Map<
    Nhm2RegionalSourceClosureRegionId,
    Nhm2MetricRequiredRegionalFullTensorSourceRegionV1
  >();
  for (const region of input.regions) byRegion.set(region.regionId, normalizeRegion(region));
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    byRegion.get(regionId),
  ).filter(
    (region): region is Nhm2MetricRequiredRegionalFullTensorSourceRegionV1 =>
      region != null,
  );
  const missingRegionIds = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.filter(
    (regionId) => !byRegion.has(regionId),
  );
  const blockedRegionIds = regions
    .filter((region) => region.status === "blocked" || region.blockers.length > 0)
    .map((region) => region.regionId);
  const allRequiredRegionsPresent = missingRegionIds.length === 0;
  const allRequiredRegionsFullTensor =
    allRequiredRegionsPresent &&
    regions.every((region) => region.sameChartFullTensor.completeness.fullTensorComplete);
  const allAggregationMetadataKnown =
    allRequiredRegionsPresent &&
    regions.every(
      (region) =>
        region.aggregationMode !== "unknown" &&
        region.normalizationBasis !== "unknown" &&
        region.sampleCount != null,
    );
  const firstBlocker =
    regions.flatMap((region) => region.blockers)[0] ??
    (missingRegionIds.length > 0 ? "metric_required_region_full_tensor_source_missing" : null);
  return {
    contractVersion: NHM2_METRIC_REQUIRED_REGIONAL_FULL_TENSOR_SOURCE_CONTRACT_VERSION,
    ...input,
    sourceRoute: inferSourceRoute(input.sourceRoute, regions),
    regions,
    summary: {
      allRequiredRegionsPresent,
      allRequiredRegionsFullTensor,
      allAggregationMetadataKnown,
      globalOnlySource:
        regions.length === 1 && regions[0]?.regionId === "global" && missingRegionIds.length > 0,
      blockedRegionIds,
      missingRegionIds,
      firstBlocker,
    },
    claimBoundary: {
      diagnosticOnly: true,
      metricRequiredGeometryRouteOnly: true,
      validatesPhysicalSource: false,
      promotesViability: false,
    },
  };
};

const isRegion = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isStatus(record.status) &&
    isText(record.artifactRef) &&
    (record.tensorRef === undefined || isText(record.tensorRef)) &&
    isNullableText(record.regionMaskRef) &&
    isAggregationMode(record.aggregationMode) &&
    isNormalizationBasis(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    isNhm2SameChartFullTensorArtifact(record.sameChartFullTensor) &&
    isStringList(record.blockers) &&
    isStringList(record.warnings)
  );
};

export const isNhm2MetricRequiredRegionalFullTensorSourceArtifact = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_METRIC_REQUIRED_REGIONAL_FULL_TENSOR_SOURCE_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    isText(record.laneId) &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    isText(record.metricFamily) &&
    isSourceRoute(record.sourceRoute) &&
    isStringList(record.sourceArtifactRefs) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.allRequiredRegionsFullTensor === "boolean" &&
    typeof summary.allAggregationMetadataKnown === "boolean" &&
    typeof summary.globalOnlySource === "boolean" &&
    Array.isArray(summary.blockedRegionIds) &&
    summary.blockedRegionIds.every(isRegionId) &&
    Array.isArray(summary.missingRegionIds) &&
    summary.missingRegionIds.every(isRegionId) &&
    isNullableText(summary.firstBlocker) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.metricRequiredGeometryRouteOnly === true &&
    claimBoundary?.validatesPhysicalSource === false &&
    claimBoundary?.promotesViability === false
  );
};
