import type { CasimirMaterialReceiptStatus } from "./casimir-material-receipt.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorAuthorityMode,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION =
  "nhm2_regional_material_source_tensor_model/v1";

export type Nhm2RegionalMaterialSourceTensorModelKind =
  | "lifshitz_regional_tensor"
  | "measured_material_tensor"
  | "declared_research_tensor"
  | "missing";

export type Nhm2RegionalMaterialSourceTensorComponentStatus =
  | "computed"
  | "material_receipted"
  | "proxy"
  | "missing"
  | "blocked";

export type Nhm2RegionalMaterialSourceComponentAuthority =
  | "source_model"
  | "constitutive_model"
  | "reduced_order_declared"
  | "scalar_proxy"
  | "metric_echo"
  | "missing";

export type Nhm2RegionalMaterialReceiptTier =
  | "none"
  | "declared_model_receipt"
  | "simulated_material_receipt"
  | "lifshitz_material_receipt"
  | "measured_material_receipt";

export type Nhm2RegionalMaterialSourceTensorRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "material_receipted" | "computed" | "proxy" | "missing" | "blocked";
  tensor: Nhm2RegionalTensor;
  componentStatus: Partial<
    Record<Nhm2TensorComponent, Nhm2RegionalMaterialSourceTensorComponentStatus>
  >;
  componentAuthority: Partial<
    Record<Nhm2TensorComponent, Nhm2RegionalMaterialSourceComponentAuthority>
  >;
  tensorAuthorityMode: Nhm2TensorAuthorityMode;
  missingComponentIds: Nhm2TensorComponent[];
  chartId: "comoving_cartesian" | string;
  basisRef: "same_basis" | "local_material_basis" | "unknown" | string;
  units: "J/m^3" | string;
  regionMaskRef: string | null;
  aggregationMode: "direct_region_model" | "aggregate_from_regions" | "representative_sector_bin" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "area" | "unknown";
  sampleCount: number | null;
  materialReceiptRef: string | null;
  materialReceiptStatus: CasimirMaterialReceiptStatus | "missing";
  provenanceRef: string;
  notDerivedFromMetricRequiredTensor: true;
  blockers: string[];
  warnings: string[];
};

export type Nhm2RegionalMaterialSourceTensorModelV1 = {
  contractVersion: typeof NHM2_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  chartId: "comoving_cartesian" | string;
  modelKind: Nhm2RegionalMaterialSourceTensorModelKind;
  materialReceiptRef: string | null;
  materialReceiptTier: Nhm2RegionalMaterialReceiptTier;
  sourceModelRef: string | null;
  sourceSideOnly: true;
  notDerivedFromMetricRequiredTensor: true;
  metricRequiredInputRefs: string[];
  targetEchoForbidden: true;
  targetDerivedFieldsUsed: false;
  regions: Nhm2RegionalMaterialSourceTensorRegionV1[];
  summary: {
    hasWallAuthority: boolean;
    allRequiredRegionsPresent: boolean;
    allRequiredRegionsFullTensor: boolean;
    allRequiredRegionsMaterialReceipted: boolean;
    allRequiredRegionsComponentAuthoritative: boolean;
    allRequiredRegionsComponentAdmissible: boolean;
    anyMetricEchoComponent: boolean;
    anyScalarProxyComponent: boolean;
    anyMissingComponent: boolean;
    missingRegionIds: Nhm2RegionalSourceClosureRegionId[];
    proxyRegionIds: Nhm2RegionalSourceClosureRegionId[];
    reducedOrderComponentRefs: string[];
    inadmissibleComponentRefs: string[];
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    sourceTensorModelDoesNotValidatePhysicalSource: true;
    globalCannotBeCopiedFromWallWithoutAggregationReceipt: true;
    metricEchoForbidden: true;
    missingRegionsAreBlockers: true;
    declaredModelReceiptIsQcOnly: true;
    materialReceiptTierDoesNotAllowTransportClaim: true;
  };
};

export type BuildNhm2RegionalMaterialSourceTensorModelInput = Omit<
  Nhm2RegionalMaterialSourceTensorModelV1,
  | "contractVersion"
  | "summary"
  | "claimBoundary"
  | "sourceSideOnly"
  | "metricRequiredInputRefs"
  | "targetEchoForbidden"
  | "targetDerivedFieldsUsed"
> &
  Partial<
    Pick<
      Nhm2RegionalMaterialSourceTensorModelV1,
      | "sourceSideOnly"
      | "metricRequiredInputRefs"
      | "targetEchoForbidden"
      | "targetDerivedFieldsUsed"
    >
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

const isModelKind = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceTensorModelKind =>
  value === "lifshitz_regional_tensor" ||
  value === "measured_material_tensor" ||
  value === "declared_research_tensor" ||
  value === "missing";

const isComponentStatus = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceTensorComponentStatus =>
  value === "computed" ||
  value === "material_receipted" ||
  value === "proxy" ||
  value === "missing" ||
  value === "blocked";

const isComponentAuthority = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceComponentAuthority =>
  value === "source_model" ||
  value === "constitutive_model" ||
  value === "reduced_order_declared" ||
  value === "scalar_proxy" ||
  value === "metric_echo" ||
  value === "missing";

const isMaterialReceiptTier = (
  value: unknown,
): value is Nhm2RegionalMaterialReceiptTier =>
  value === "none" ||
  value === "declared_model_receipt" ||
  value === "simulated_material_receipt" ||
  value === "lifshitz_material_receipt" ||
  value === "measured_material_receipt";

const isRegionStatus = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceTensorRegionV1["status"] =>
  value === "material_receipted" ||
  value === "computed" ||
  value === "proxy" ||
  value === "missing" ||
  value === "blocked";

const isTensorAuthorityMode = (value: unknown): value is Nhm2TensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isMaterialReceiptStatus = (
  value: unknown,
): value is CasimirMaterialReceiptStatus | "missing" =>
  value === "material_receipted" ||
  value === "ideal_scalar_only" ||
  value === "blocked" ||
  value === "missing";

const authoritativeComponentAuthorities = new Set<Nhm2RegionalMaterialSourceComponentAuthority>([
  "source_model",
  "constitutive_model",
]);

const admissibleComponentAuthorities = new Set<Nhm2RegionalMaterialSourceComponentAuthority>([
  "source_model",
  "constitutive_model",
  "reduced_order_declared",
]);

export const inferNhm2RegionalMaterialSourceTensorAuthorityMode = (
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

export const missingNhm2RegionalMaterialSourceTensorComponents = (
  tensor: Nhm2RegionalTensor,
): Nhm2TensorComponent[] => {
  const authority = inferNhm2RegionalMaterialSourceTensorAuthorityMode(tensor);
  const required =
    authority === "symmetric_full_tensor"
      ? SYMMETRIC_TENSOR_COMPONENTS
      : NHM2_TENSOR_COMPONENTS;
  return required.filter((component) => tensor[component] == null);
};

const componentAuthorityFor = (
  args: {
    component: Nhm2TensorComponent;
    tensor: Nhm2RegionalTensor;
    explicitAuthority?: Nhm2RegionalMaterialSourceComponentAuthority;
    tensorAuthorityMode: Nhm2TensorAuthorityMode;
    modelKind: Nhm2RegionalMaterialSourceTensorModelKind;
    materialReceiptTier: Nhm2RegionalMaterialReceiptTier;
    materialReceiptStatus: CasimirMaterialReceiptStatus | "missing";
    status: Nhm2RegionalMaterialSourceTensorRegionV1["status"];
  },
): Nhm2RegionalMaterialSourceComponentAuthority => {
  if (args.explicitAuthority != null) return args.explicitAuthority;
  if (args.tensor[args.component] == null) return "missing";
  if (args.status === "proxy" || args.tensorAuthorityMode === "proxy") {
    return "scalar_proxy";
  }
  if (args.tensorAuthorityMode === "diagonal_reduced_order") {
    return "reduced_order_declared";
  }
  if (
    args.materialReceiptStatus === "material_receipted" &&
    (args.materialReceiptTier === "lifshitz_material_receipt" ||
      args.materialReceiptTier === "measured_material_receipt" ||
      args.materialReceiptTier === "simulated_material_receipt")
  ) {
    return "constitutive_model";
  }
  if (args.modelKind === "declared_research_tensor") {
    return "source_model";
  }
  if (
    args.modelKind === "lifshitz_regional_tensor" ||
    args.modelKind === "measured_material_tensor"
  ) {
    return "constitutive_model";
  }
  return "reduced_order_declared";
};

const componentAuthorityBlocker = (
  authority: Nhm2RegionalMaterialSourceComponentAuthority,
): string | null => {
  switch (authority) {
    case "source_model":
    case "constitutive_model":
      return null;
    case "reduced_order_declared":
      return "component_authority_reduced_order_declared";
    case "scalar_proxy":
      return "component_authority_scalar_proxy";
    case "metric_echo":
      return "component_authority_metric_echo";
    case "missing":
      return "component_authority_missing";
  }
};

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2RegionalMaterialSourceTensorRegionV1 => ({
  regionId,
  status: "missing",
  tensor: {},
  componentStatus: {},
  componentAuthority: Object.fromEntries(
    NHM2_TENSOR_COMPONENTS.map((component) => [component, "missing"]),
  ) as Partial<Record<Nhm2TensorComponent, Nhm2RegionalMaterialSourceComponentAuthority>>,
  tensorAuthorityMode: "unknown",
  missingComponentIds: [...NHM2_TENSOR_COMPONENTS],
  chartId: "comoving_cartesian",
  basisRef: "unknown",
  units: "J/m^3",
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
  materialReceiptRef: null,
  materialReceiptStatus: "missing",
  provenanceRef: `missing:${regionId}`,
  notDerivedFromMetricRequiredTensor: true,
  blockers: ["regional_source_tensor_missing"],
  warnings: [],
});

const normalizeRegion = (
  region: Nhm2RegionalMaterialSourceTensorRegionV1,
  modelKind: Nhm2RegionalMaterialSourceTensorModelKind,
  materialReceiptTier: Nhm2RegionalMaterialReceiptTier,
): Nhm2RegionalMaterialSourceTensorRegionV1 => {
  const tensorAuthorityMode =
    region.tensorAuthorityMode === "unknown"
      ? inferNhm2RegionalMaterialSourceTensorAuthorityMode(region.tensor)
      : region.tensorAuthorityMode;
  const missingComponentIds =
    region.missingComponentIds.length > 0
      ? region.missingComponentIds
      : missingNhm2RegionalMaterialSourceTensorComponents(region.tensor);
  const blockers = new Set(region.blockers);
  const componentAuthority = Object.fromEntries(
    NHM2_TENSOR_COMPONENTS.map((component) => [
      component,
      componentAuthorityFor({
        component,
        tensor: region.tensor,
        explicitAuthority: region.componentAuthority[component],
        tensorAuthorityMode,
        modelKind,
        materialReceiptTier,
        materialReceiptStatus: region.materialReceiptStatus,
        status: region.status,
      }),
    ]),
  ) as Partial<Record<Nhm2TensorComponent, Nhm2RegionalMaterialSourceComponentAuthority>>;
  if (tensorAuthorityMode !== "full_tensor" && tensorAuthorityMode !== "symmetric_full_tensor") {
    blockers.add("regional_full_tensor_authority_missing");
  }
  if (missingComponentIds.length > 0) {
    blockers.add("regional_full_tensor_components_missing");
  }
  if (region.regionMaskRef == null) blockers.add("region_mask_ref_missing");
  if (
    region.materialReceiptStatus !== "material_receipted" &&
    materialReceiptTier !== "declared_model_receipt"
  ) {
    blockers.add("material_receipt_missing_or_not_receipted");
  }
  for (const [component, authority] of Object.entries(componentAuthority)) {
    const blocker = componentAuthorityBlocker(authority);
    if (blocker != null && blocker !== "component_authority_reduced_order_declared") {
      blockers.add(`${component}:${blocker}`);
    }
  }
  return {
    ...region,
    componentAuthority,
    tensorAuthorityMode,
    missingComponentIds,
    blockers: Array.from(blockers),
  };
};

export const buildNhm2RegionalMaterialSourceTensorModelArtifact = (
  input: BuildNhm2RegionalMaterialSourceTensorModelInput,
): Nhm2RegionalMaterialSourceTensorModelV1 => {
  const byRegion = new Map<Nhm2RegionalSourceClosureRegionId, Nhm2RegionalMaterialSourceTensorRegionV1>();
  for (const region of input.regions) {
    byRegion.set(region.regionId, normalizeRegion(region, input.modelKind, input.materialReceiptTier));
  }
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!byRegion.has(regionId)) byRegion.set(regionId, missingRegion(regionId));
  }
  const regions = [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS].map(
    (regionId) => byRegion.get(regionId) as Nhm2RegionalMaterialSourceTensorRegionV1,
  );
  const missingRegionIds = regions
    .filter((region) => region.status === "missing")
    .map((region) => region.regionId);
  const proxyRegionIds = regions
    .filter(
      (region) =>
        region.tensorAuthorityMode !== "full_tensor" &&
        region.tensorAuthorityMode !== "symmetric_full_tensor",
    )
    .map((region) => region.regionId);
  const authorityRegion = (region: Nhm2RegionalMaterialSourceTensorRegionV1): boolean =>
    (region.tensorAuthorityMode === "full_tensor" ||
      region.tensorAuthorityMode === "symmetric_full_tensor") &&
    region.blockers.length === 0 &&
    region.status !== "missing" &&
    region.status !== "blocked";
  const componentRefs = (
    authority: Nhm2RegionalMaterialSourceComponentAuthority,
  ): string[] =>
    regions.flatMap((region) =>
      NHM2_TENSOR_COMPONENTS.filter(
        (component) => region.componentAuthority[component] === authority,
      ).map((component) => `${region.regionId}:${component}`),
    );
  const reducedOrderComponentRefs = componentRefs("reduced_order_declared");
  const inadmissibleComponentRefs = [
    ...componentRefs("scalar_proxy"),
    ...componentRefs("metric_echo"),
    ...componentRefs("missing"),
  ];
  const allComponentAuthorities = regions.flatMap((region) =>
    NHM2_TENSOR_COMPONENTS.map((component) => region.componentAuthority[component] ?? "missing"),
  );
  return {
    contractVersion: NHM2_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION,
    ...input,
    sourceSideOnly: true,
    metricRequiredInputRefs: input.metricRequiredInputRefs ?? [],
    targetEchoForbidden: true,
    targetDerivedFieldsUsed: false,
    regions,
    summary: {
      hasWallAuthority: authorityRegion(byRegion.get("wall") ?? missingRegion("wall")),
      allRequiredRegionsPresent: missingRegionIds.length === 0,
      allRequiredRegionsFullTensor: regions.every(authorityRegion),
      allRequiredRegionsMaterialReceipted: regions.every(
        (region) => region.materialReceiptStatus === "material_receipted",
      ),
      allRequiredRegionsComponentAuthoritative: allComponentAuthorities.every(
        (authority) => authoritativeComponentAuthorities.has(authority),
      ),
      allRequiredRegionsComponentAdmissible: allComponentAuthorities.every(
        (authority) => admissibleComponentAuthorities.has(authority),
      ),
      anyMetricEchoComponent: componentRefs("metric_echo").length > 0,
      anyScalarProxyComponent: componentRefs("scalar_proxy").length > 0,
      anyMissingComponent: componentRefs("missing").length > 0,
      missingRegionIds,
      proxyRegionIds,
      reducedOrderComponentRefs,
      inadmissibleComponentRefs,
      blockerCount: regions.reduce((sum, region) => sum + region.blockers.length, 0),
    },
    claimBoundary: {
      diagnosticOnly: true,
      sourceTensorModelDoesNotValidatePhysicalSource: true,
      globalCannotBeCopiedFromWallWithoutAggregationReceipt: true,
      metricEchoForbidden: true,
      missingRegionsAreBlockers: true,
      declaredModelReceiptIsQcOnly: true,
      materialReceiptTierDoesNotAllowTransportClaim: true,
    },
  };
};

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    Object.entries(record).every(
      ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
    )
  );
};

const isRegion = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceTensorRegionV1 => {
  const record = isRecord(value) ? value : null;
  const componentStatus = isRecord(record?.componentStatus)
    ? record?.componentStatus
    : null;
  const componentAuthority = isRecord(record?.componentAuthority)
    ? record?.componentAuthority
    : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isRegionStatus(record.status) &&
    isTensor(record.tensor) &&
    componentStatus != null &&
    Object.entries(componentStatus).every(
      ([key, entry]) => isTensorComponent(key) && isComponentStatus(entry),
    ) &&
    componentAuthority != null &&
    Object.entries(componentAuthority).every(
      ([key, entry]) => isTensorComponent(key) && isComponentAuthority(entry),
    ) &&
    isTensorAuthorityMode(record.tensorAuthorityMode) &&
    Array.isArray(record.missingComponentIds) &&
    record.missingComponentIds.every(isTensorComponent) &&
    isText(record.chartId) &&
    isText(record.basisRef) &&
    isText(record.units) &&
    isNullableText(record.regionMaskRef) &&
    isText(record.aggregationMode) &&
    isText(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    isNullableText(record.materialReceiptRef) &&
    isMaterialReceiptStatus(record.materialReceiptStatus) &&
    isText(record.provenanceRef) &&
    record.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    Array.isArray(record.warnings) &&
    record.warnings.every(isText)
  );
};

export const isNhm2RegionalMaterialSourceTensorModelArtifact = (
  value: unknown,
): value is Nhm2RegionalMaterialSourceTensorModelV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_REGIONAL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    isModelKind(record.modelKind) &&
    isNullableText(record.materialReceiptRef) &&
    isMaterialReceiptTier(record.materialReceiptTier) &&
    isNullableText(record.sourceModelRef) &&
    record.sourceSideOnly === true &&
    record.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(record.metricRequiredInputRefs) &&
    record.metricRequiredInputRefs.every(isText) &&
    record.targetEchoForbidden === true &&
    record.targetDerivedFieldsUsed === false &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.hasWallAuthority === "boolean" &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.allRequiredRegionsFullTensor === "boolean" &&
    typeof summary.allRequiredRegionsMaterialReceipted === "boolean" &&
    typeof summary.allRequiredRegionsComponentAuthoritative === "boolean" &&
    typeof summary.allRequiredRegionsComponentAdmissible === "boolean" &&
    typeof summary.anyMetricEchoComponent === "boolean" &&
    typeof summary.anyScalarProxyComponent === "boolean" &&
    typeof summary.anyMissingComponent === "boolean" &&
    Array.isArray(summary.missingRegionIds) &&
    summary.missingRegionIds.every(isRegionId) &&
    Array.isArray(summary.proxyRegionIds) &&
    summary.proxyRegionIds.every(isRegionId) &&
    Array.isArray(summary.reducedOrderComponentRefs) &&
    summary.reducedOrderComponentRefs.every(isText) &&
    Array.isArray(summary.inadmissibleComponentRefs) &&
    summary.inadmissibleComponentRefs.every(isText) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.sourceTensorModelDoesNotValidatePhysicalSource === true &&
    claimBoundary?.globalCannotBeCopiedFromWallWithoutAggregationReceipt === true &&
    claimBoundary?.metricEchoForbidden === true &&
    claimBoundary?.missingRegionsAreBlockers === true &&
    claimBoundary?.declaredModelReceiptIsQcOnly === true &&
    claimBoundary?.materialReceiptTierDoesNotAllowTransportClaim === true
  );
};
