import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorAuthorityMode,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_METRIC_REQUIRED_REGIONAL_TENSOR_RECEIPT_CONTRACT_VERSION =
  "nhm2_metric_required_regional_tensor_receipt/v1";

export type Nhm2MetricRequiredRegionalTensorComponentStatus =
  | "computed"
  | "missing"
  | "blocked"
  | "proxy";

export type Nhm2MetricRequiredRegionalTensorReceiptRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "computed" | "partial" | "missing" | "blocked";
  tensor: Nhm2RegionalTensor;
  tensorAuthorityMode: Nhm2TensorAuthorityMode;
  componentStatus: Partial<
    Record<Nhm2TensorComponent, Nhm2MetricRequiredRegionalTensorComponentStatus>
  >;
  missingComponentIds: Nhm2TensorComponent[];
  chartRef: "comoving_cartesian" | string;
  basisRef: "same_basis" | "unknown" | string;
  unitsRef: "J/m^3" | string;
  regionMaskRef: string | null;
  aggregationMode: "mean" | "integral" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "unknown";
  sampleCount: number | null;
  tensorRef: string | null;
  derivationMode:
    | "einstein_tensor_geometry_fd4_v1"
    | "adm_projection"
    | "source_closure_existing_metric_required"
    | "missing";
  blockers: string[];
  warnings: string[];
};

export type Nhm2MetricRequiredRegionalTensorReceiptV1 = {
  contractVersion: typeof NHM2_METRIC_REQUIRED_REGIONAL_TENSOR_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  chartId: "comoving_cartesian" | string;
  metricFamily: string;
  sourceArtifactRefs: string[];
  regions: Nhm2MetricRequiredRegionalTensorReceiptRegionV1[];
  summary: {
    allRequiredRegionsPresent: boolean;
    allRequiredRegionsFullTensor: boolean;
    allAggregationMetadataKnown: boolean;
    sameBasisComparisonReady: boolean;
    missingRegionIds: Nhm2RegionalSourceClosureRegionId[];
    missingComponentIds: Nhm2TensorComponent[];
    firstBlocker: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    metricRequiredReceiptDoesNotValidateSource: true;
    diagonalOnlyCannotCloseFullTensor: true;
  };
};

export type BuildNhm2MetricRequiredRegionalTensorReceiptInput = Omit<
  Nhm2MetricRequiredRegionalTensorReceiptV1,
  "contractVersion" | "summary" | "claimBoundary"
>;

const SYMMETRIC_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const satisfies readonly Nhm2TensorComponent[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isTensorComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const isTensorAuthorityMode = (value: unknown): value is Nhm2TensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isRegionStatus = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptRegionV1["status"] =>
  value === "computed" ||
  value === "partial" ||
  value === "missing" ||
  value === "blocked";

const isComponentStatus = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorComponentStatus =>
  value === "computed" ||
  value === "missing" ||
  value === "blocked" ||
  value === "proxy";

const isAggregationMode = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptRegionV1["aggregationMode"] =>
  value === "mean" || value === "integral" || value === "unknown";

const isNormalizationBasis = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptRegionV1["normalizationBasis"] =>
  value === "sample_count" || value === "volume" || value === "unknown";

const isDerivationMode = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptRegionV1["derivationMode"] =>
  value === "einstein_tensor_geometry_fd4_v1" ||
  value === "adm_projection" ||
  value === "source_closure_existing_metric_required" ||
  value === "missing";

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    Object.entries(record).every(
      ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
    )
  );
};

export const inferNhm2MetricRequiredRegionalTensorAuthorityMode = (
  tensor: Nhm2RegionalTensor,
): Nhm2TensorAuthorityMode => {
  const available = new Set(
    NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null),
  );
  if (NHM2_TENSOR_COMPONENTS.every((component) => available.has(component))) {
    return "full_tensor";
  }
  if (SYMMETRIC_TENSOR_COMPONENTS.every((component) => available.has(component))) {
    return "symmetric_full_tensor";
  }
  if (["T00", "T11", "T22", "T33"].every((component) => available.has(component as Nhm2TensorComponent))) {
    return "diagonal_reduced_order";
  }
  return available.size > 0 ? "proxy" : "unknown";
};

export const missingNhm2MetricRequiredRegionalTensorComponents = (
  tensor: Nhm2RegionalTensor,
): Nhm2TensorComponent[] => {
  const authority = inferNhm2MetricRequiredRegionalTensorAuthorityMode(tensor);
  const required =
    authority === "symmetric_full_tensor"
      ? SYMMETRIC_TENSOR_COMPONENTS
      : NHM2_TENSOR_COMPONENTS;
  return required.filter((component) => tensor[component] == null);
};

const componentStatusFromTensor = (
  tensor: Nhm2RegionalTensor,
  missingComponentIds: Nhm2TensorComponent[],
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1["componentStatus"] => {
  const status: Nhm2MetricRequiredRegionalTensorReceiptRegionV1["componentStatus"] = {};
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (tensor[component] != null) status[component] = "computed";
  }
  for (const component of missingComponentIds) {
    status[component] = "missing";
  }
  return status;
};

const deriveRegionBlockers = (
  region: Nhm2MetricRequiredRegionalTensorReceiptRegionV1,
): string[] => {
  const blockers = new Set(region.blockers);
  if (region.status === "missing") blockers.add("metric_required_region_missing");
  if (region.status === "blocked") blockers.add("metric_required_region_blocked");
  if (
    region.tensorAuthorityMode !== "full_tensor" &&
    region.tensorAuthorityMode !== "symmetric_full_tensor"
  ) {
    blockers.add("metric_required_full_tensor_authority_missing");
  }
  if (region.missingComponentIds.length > 0) {
    blockers.add("metric_required_full_tensor_components_missing");
  }
  if (region.basisRef !== "same_basis") {
    blockers.add("metric_required_same_basis_metadata_missing");
  }
  if (region.regionMaskRef == null) blockers.add("metric_required_region_mask_ref_missing");
  if (region.aggregationMode === "unknown") {
    blockers.add("metric_required_aggregation_mode_unknown");
  }
  if (region.normalizationBasis === "unknown") {
    blockers.add("metric_required_normalization_basis_unknown");
  }
  if (region.sampleCount == null) blockers.add("metric_required_sample_count_missing");
  return Array.from(blockers);
};

const normalizeRegion = (
  region: Nhm2MetricRequiredRegionalTensorReceiptRegionV1,
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1 => {
  const tensorAuthorityMode =
    region.tensorAuthorityMode === "unknown"
      ? inferNhm2MetricRequiredRegionalTensorAuthorityMode(region.tensor)
      : region.tensorAuthorityMode;
  const missingComponentIds =
    region.missingComponentIds.length > 0
      ? region.missingComponentIds
      : missingNhm2MetricRequiredRegionalTensorComponents(region.tensor);
  const hasTensor = Object.values(region.tensor).some((value) => value != null);
  const status =
    region.status === "computed" && !hasTensor
      ? "missing"
      : region.status === "computed" && missingComponentIds.length > 0
        ? "partial"
        : region.status;
  const normalized = {
    ...region,
    status,
    tensorAuthorityMode,
    missingComponentIds,
    componentStatus: {
      ...componentStatusFromTensor(region.tensor, missingComponentIds),
      ...region.componentStatus,
    },
  };
  return { ...normalized, blockers: deriveRegionBlockers(normalized) };
};

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1 => ({
  regionId,
  status: "missing",
  tensor: {},
  tensorAuthorityMode: "unknown",
  componentStatus: {},
  missingComponentIds: [...NHM2_TENSOR_COMPONENTS],
  chartRef: "comoving_cartesian",
  basisRef: "unknown",
  unitsRef: "J/m^3",
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
  tensorRef: null,
  derivationMode: "missing",
  blockers: ["metric_required_region_missing"],
  warnings: [],
});

export const buildNhm2MetricRequiredRegionalTensorReceiptArtifact = (
  input: BuildNhm2MetricRequiredRegionalTensorReceiptInput,
): Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  const byRegion = new Map<Nhm2RegionalSourceClosureRegionId, Nhm2MetricRequiredRegionalTensorReceiptRegionV1>();
  for (const region of input.regions) byRegion.set(region.regionId, normalizeRegion(region));
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!byRegion.has(regionId)) byRegion.set(regionId, normalizeRegion(missingRegion(regionId)));
  }
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map(
    (regionId) => byRegion.get(regionId) as Nhm2MetricRequiredRegionalTensorReceiptRegionV1,
  );
  const missingRegionIds = regions
    .filter((region) => region.status === "missing")
    .map((region) => region.regionId);
  const missingComponentIds = Array.from(
    new Set(regions.flatMap((region) => region.missingComponentIds)),
  );
  const allRequiredRegionsPresent = missingRegionIds.length === 0;
  const allRequiredRegionsFullTensor = regions.every(
    (region) =>
      region.tensorAuthorityMode === "full_tensor" ||
      region.tensorAuthorityMode === "symmetric_full_tensor",
  );
  const allAggregationMetadataKnown = regions.every(
    (region) =>
      region.aggregationMode !== "unknown" &&
      region.normalizationBasis !== "unknown" &&
      region.sampleCount != null,
  );
  const blockerList = regions.flatMap((region) => region.blockers);
  return {
    contractVersion: NHM2_METRIC_REQUIRED_REGIONAL_TENSOR_RECEIPT_CONTRACT_VERSION,
    ...input,
    regions,
    summary: {
      allRequiredRegionsPresent,
      allRequiredRegionsFullTensor,
      allAggregationMetadataKnown,
      sameBasisComparisonReady:
        allRequiredRegionsPresent &&
        allRequiredRegionsFullTensor &&
        allAggregationMetadataKnown &&
        regions.every((region) => region.basisRef === "same_basis"),
      missingRegionIds,
      missingComponentIds,
      firstBlocker: blockerList[0] ?? null,
    },
    claimBoundary: {
      diagnosticOnly: true,
      metricRequiredReceiptDoesNotValidateSource: true,
      diagonalOnlyCannotCloseFullTensor: true,
    },
  };
};

const isRegion = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptRegionV1 => {
  const record = isRecord(value) ? value : null;
  const componentStatus = isRecord(record?.componentStatus)
    ? record?.componentStatus
    : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isRegionStatus(record.status) &&
    isTensor(record.tensor) &&
    isTensorAuthorityMode(record.tensorAuthorityMode) &&
    componentStatus != null &&
    Object.entries(componentStatus).every(
      ([key, entry]) => isTensorComponent(key) && isComponentStatus(entry),
    ) &&
    Array.isArray(record.missingComponentIds) &&
    record.missingComponentIds.every(isTensorComponent) &&
    isText(record.chartRef) &&
    isText(record.basisRef) &&
    isText(record.unitsRef) &&
    isNullableText(record.regionMaskRef) &&
    isAggregationMode(record.aggregationMode) &&
    isNormalizationBasis(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    isNullableText(record.tensorRef) &&
    isDerivationMode(record.derivationMode) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    Array.isArray(record.warnings) &&
    record.warnings.every(isText)
  );
};

export const isNhm2MetricRequiredRegionalTensorReceipt = (
  value: unknown,
): value is Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_METRIC_REQUIRED_REGIONAL_TENSOR_RECEIPT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    isText(record.metricFamily) &&
    Array.isArray(record.sourceArtifactRefs) &&
    record.sourceArtifactRefs.every(isText) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.allRequiredRegionsFullTensor === "boolean" &&
    typeof summary.allAggregationMetadataKnown === "boolean" &&
    typeof summary.sameBasisComparisonReady === "boolean" &&
    Array.isArray(summary.missingRegionIds) &&
    summary.missingRegionIds.every(isRegionId) &&
    Array.isArray(summary.missingComponentIds) &&
    summary.missingComponentIds.every(isTensorComponent) &&
    isNullableText(summary.firstBlocker) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.metricRequiredReceiptDoesNotValidateSource === true &&
    claimBoundary?.diagonalOnlyCannotCloseFullTensor === true
  );
};
