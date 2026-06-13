import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2TileEffectiveCounterpartArtifact,
  Nhm2TileEffectiveCounterpartRegion,
} from "./nhm2-tile-effective-counterpart.v1";

export const NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER_CONTRACT_VERSION =
  "nhm2_source_component_authority_ledger/v1";

export const NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS = [
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

export type Nhm2SourceComponentAuthority =
  | "source_model"
  | "constitutive_model"
  | "reduced_order_declared"
  | "scalar_proxy"
  | "metric_echo"
  | "missing";

export type Nhm2SourceComponentAuthorityLedgerComponentV1 = {
  componentId: (typeof NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS)[number];
  valueSI: number | null;
  authority: Nhm2SourceComponentAuthority;
  componentGroup:
    | "energy_density"
    | "momentum_density"
    | "spatial_stress_diagonal"
    | "spatial_stress_off_diagonal";
  receiptRef: string | null;
  provenance: {
    counterpartRegionRef: string;
    derivationMode: string | null;
    sourceModelId: string | null;
    sourceModelVersion: string | null;
    notDerivedFromMetricRequiredTensor: boolean | null;
  };
  blockers: string[];
};

export type Nhm2SourceComponentAuthorityLedgerRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "review" | "fail" | "missing";
  comparisonRole: string | null;
  tensorAuthorityMode: string | null;
  chartRef: string | null;
  unitsRef: string | null;
  regionMaskRef: string | null;
  aggregationMode: string | null;
  normalizationBasis: string | null;
  sampleCount: number | null;
  components: Nhm2SourceComponentAuthorityLedgerComponentV1[];
  blockers: string[];
};

export type Nhm2SourceComponentAuthorityLedgerArtifactV1 = {
  contractVersion: typeof NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  counterpartArtifactRef: string | null;
  sourceTensorArtifactRef: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  regions: Nhm2SourceComponentAuthorityLedgerRegionV1[];
  summary: {
    allRequiredRegionsPresent: boolean;
    allRequiredComponentsPresent: boolean;
    allRequiredComponentsAuthoritative: boolean;
    allRequiredComponentsAdmissible: boolean;
    sourceSideComponentAuthorityComplete: boolean;
    hasWallFullTensorAuthority: boolean;
    anyMetricEcho: boolean;
    anyScalarProxy: boolean;
    anyMissing: boolean;
    anyReducedOrder: boolean;
    missingComponentRefs: string[];
    proxyComponentRefs: string[];
    metricEchoComponentRefs: string[];
    reducedOrderComponentRefs: string[];
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    componentAuthorityDoesNotValidateMaterialSource: true;
    metricEchoForbidden: true;
    scalarProxyCannotProvideFullTensorAuthority: true;
    missingComponentsCannotBeZeroFilled: true;
  };
};

export type BuildNhm2SourceComponentAuthorityLedgerInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  counterpartArtifactRef?: string | null;
  sourceTensorArtifactRef?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  counterpartArtifact: Nhm2TileEffectiveCounterpartArtifact;
};

const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isNullableText = (value: unknown): value is string | null =>
  value === null || toText(value) != null;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const normalizeList = (values: string[]): string[] =>
  Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));

const componentGroup = (
  component: Nhm2SourceComponentAuthorityLedgerComponentV1["componentId"],
): Nhm2SourceComponentAuthorityLedgerComponentV1["componentGroup"] => {
  if (component === "T00") return "energy_density";
  if (component === "T01" || component === "T02" || component === "T03") {
    return "momentum_density";
  }
  if (component === "T11" || component === "T22" || component === "T33") {
    return "spatial_stress_diagonal";
  }
  return "spatial_stress_off_diagonal";
};

const valueFor = (
  region: Nhm2TileEffectiveCounterpartRegion,
  component: Nhm2SourceComponentAuthorityLedgerComponentV1["componentId"],
): number | null => {
  const value = region.tensor[component];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const componentAuthorityFor = (
  region: Nhm2TileEffectiveCounterpartRegion,
  component: Nhm2SourceComponentAuthorityLedgerComponentV1["componentId"],
): Nhm2SourceComponentAuthority => {
  const value = valueFor(region, component);
  const metricEcho =
    region.comparisonRole === "metric_echo_diagnostic_only" ||
    region.provenance.derivationMode === "metric_echo" ||
    region.provenance.notDerivedFromMetricRequiredTensor === false;
  if (metricEcho) return "metric_echo";
  if (region.comparisonRole !== "tile_effective_counterpart") return "missing";
  if (region.tensorAuthorityMode === "proxy") return "scalar_proxy";
  if (region.tensorAuthorityMode === "unknown") return "missing";
  if (region.tensorAuthorityMode === "diagonal_reduced_order") {
    if (value == null) return "missing";
    return component === "T00" ||
      component === "T11" ||
      component === "T22" ||
      component === "T33"
      ? "reduced_order_declared"
      : "missing";
  }
  if (value == null) return "missing";
  if (region.provenance.derivationMode === "explicit_global_source_row") {
    return "reduced_order_declared";
  }
  if (
    region.provenance.derivationMode === "tile_model_direct_full_tensor" ||
    region.provenance.derivationMode === "tile_model_reconstituted_full_tensor"
  ) {
    return "source_model";
  }
  if (
    (region.tensorAuthorityMode === "full_tensor" ||
      region.tensorAuthorityMode === "symmetric_full_tensor") &&
    region.provenance.sourceModelId != null
  ) {
    return "source_model";
  }
  return "reduced_order_declared";
};

const blockersForComponent = (
  authority: Nhm2SourceComponentAuthority,
): string[] => {
  switch (authority) {
    case "source_model":
    case "constitutive_model":
      return [];
    case "reduced_order_declared":
      return ["component_authority_reduced_order_declared"];
    case "scalar_proxy":
      return ["component_authority_scalar_proxy"];
    case "metric_echo":
      return ["component_authority_metric_echo"];
    case "missing":
      return ["component_authority_missing"];
  }
};

const buildRegionFromCounterpart = (
  region: Nhm2TileEffectiveCounterpartRegion,
  counterpartArtifactRef: string | null,
): Nhm2SourceComponentAuthorityLedgerRegionV1 => {
  const components = NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS.map(
    (componentId): Nhm2SourceComponentAuthorityLedgerComponentV1 => {
      const authority = componentAuthorityFor(region, componentId);
      return {
        componentId,
        valueSI: valueFor(region, componentId),
        authority,
        componentGroup: componentGroup(componentId),
        receiptRef: region.provenance.inputRefs[0] ?? counterpartArtifactRef,
        provenance: {
          counterpartRegionRef: `${counterpartArtifactRef ?? "tile_effective_counterpart"}#${region.regionId}`,
          derivationMode: region.provenance.derivationMode,
          sourceModelId: region.provenance.sourceModelId,
          sourceModelVersion: region.provenance.sourceModelVersion,
          notDerivedFromMetricRequiredTensor:
            region.provenance.notDerivedFromMetricRequiredTensor,
        },
        blockers: blockersForComponent(authority),
      };
    },
  );
  const blockers = normalizeList([
    ...region.blockers,
    ...components.flatMap((component) =>
      component.blockers.map((blocker) => `${component.componentId}:${blocker}`),
    ),
  ]);
  const hasMetricEcho = components.some((component) => component.authority === "metric_echo");
  const hasScalarProxy = components.some((component) => component.authority === "scalar_proxy");
  const hasMissing = components.some((component) => component.authority === "missing");
  const hasReducedOrder = components.some(
    (component) => component.authority === "reduced_order_declared",
  );
  return {
    regionId: region.regionId,
    status:
      hasMetricEcho || hasScalarProxy
        ? "fail"
        : hasMissing || hasReducedOrder || blockers.length > 0
          ? "review"
          : "pass",
    comparisonRole: region.comparisonRole,
    tensorAuthorityMode: region.tensorAuthorityMode,
    chartRef: region.chartRef,
    unitsRef: region.unitsRef,
    regionMaskRef: region.regionMaskRef,
    aggregationMode: region.aggregationMode,
    normalizationBasis: region.normalizationBasis,
    sampleCount: region.sampleCount,
    components,
    blockers,
  };
};

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  counterpartArtifactRef: string | null,
): Nhm2SourceComponentAuthorityLedgerRegionV1 => ({
  regionId,
  status: "missing",
  comparisonRole: null,
  tensorAuthorityMode: null,
  chartRef: null,
  unitsRef: null,
  regionMaskRef: null,
  aggregationMode: null,
  normalizationBasis: null,
  sampleCount: null,
  components: NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS.map((componentId) => ({
    componentId,
    valueSI: null,
    authority: "missing",
    componentGroup: componentGroup(componentId),
    receiptRef: null,
    provenance: {
      counterpartRegionRef: `${counterpartArtifactRef ?? "tile_effective_counterpart"}#${regionId}`,
      derivationMode: null,
      sourceModelId: null,
      sourceModelVersion: null,
      notDerivedFromMetricRequiredTensor: null,
    },
    blockers: ["component_authority_missing"],
  })),
  blockers: ["source_component_region_missing"],
});

export const buildNhm2SourceComponentAuthorityLedger = (
  input: BuildNhm2SourceComponentAuthorityLedgerInput,
): Nhm2SourceComponentAuthorityLedgerArtifactV1 => {
  const regionMap = new Map(
    input.counterpartArtifact.regions.map((region) => [region.regionId, region]),
  );
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const region = regionMap.get(regionId);
    return region == null
      ? missingRegion(regionId, input.counterpartArtifactRef ?? null)
      : buildRegionFromCounterpart(region, input.counterpartArtifactRef ?? null);
  });
  const componentRefs = (authority: Nhm2SourceComponentAuthority): string[] =>
    regions.flatMap((region) =>
      region.components
        .filter((component) => component.authority === authority)
        .map((component) => `${region.regionId}:${component.componentId}`),
    );
  const missingComponentRefs = componentRefs("missing");
  const proxyComponentRefs = componentRefs("scalar_proxy");
  const metricEchoComponentRefs = componentRefs("metric_echo");
  const reducedOrderComponentRefs = componentRefs("reduced_order_declared");
  const allComponents = regions.flatMap((region) => region.components);
  const blockers = normalizeList([
    ...regions.flatMap((region) =>
      region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
    ),
  ]);
  const allRequiredRegionsPresent = regions.every((region) => region.status !== "missing");
  const allRequiredComponentsPresent = missingComponentRefs.length === 0;
  const allRequiredComponentsAuthoritative = allComponents.every(
    (component) =>
      component.authority === "source_model" ||
      component.authority === "constitutive_model",
  );
  const allRequiredComponentsAdmissible = allComponents.every(
    (component) =>
      component.authority === "source_model" ||
      component.authority === "constitutive_model" ||
      component.authority === "reduced_order_declared",
  );
  return {
    contractVersion: NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER_CONTRACT_VERSION,
    generatedAt: toText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    laneId: toText(input.laneId) ?? input.counterpartArtifact.laneId,
    selectedProfileId:
      toText(input.selectedProfileId) ?? input.counterpartArtifact.selectedProfileId,
    runId: toText(input.runId) ?? input.counterpartArtifact.runId,
    counterpartArtifactRef: toText(input.counterpartArtifactRef),
    sourceTensorArtifactRef:
      toText(input.sourceTensorArtifactRef) ??
      input.counterpartArtifact.sourceTensorArtifactRef ??
      null,
    ...(input.atlasRef === undefined ? {} : { atlasRef: toText(input.atlasRef) }),
    ...(input.atlasHash === undefined ? {} : { atlasHash: toText(input.atlasHash) }),
    regions,
    summary: {
      allRequiredRegionsPresent,
      allRequiredComponentsPresent,
      allRequiredComponentsAuthoritative,
      allRequiredComponentsAdmissible,
      sourceSideComponentAuthorityComplete: allRequiredComponentsAuthoritative,
      hasWallFullTensorAuthority:
        regions.find((region) => region.regionId === "wall")?.status === "pass",
      anyMetricEcho: metricEchoComponentRefs.length > 0,
      anyScalarProxy: proxyComponentRefs.length > 0,
      anyMissing: missingComponentRefs.length > 0,
      anyReducedOrder: reducedOrderComponentRefs.length > 0,
      missingComponentRefs,
      proxyComponentRefs,
      metricEchoComponentRefs,
      reducedOrderComponentRefs,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      componentAuthorityDoesNotValidateMaterialSource: true,
      metricEchoForbidden: true,
      scalarProxyCannotProvideFullTensorAuthority: true,
      missingComponentsCannotBeZeroFilled: true,
    },
  };
};

const isAuthority = (value: unknown): value is Nhm2SourceComponentAuthority =>
  value === "source_model" ||
  value === "constitutive_model" ||
  value === "reduced_order_declared" ||
  value === "scalar_proxy" ||
  value === "metric_echo" ||
  value === "missing";

const isComponentId = (
  value: unknown,
): value is Nhm2SourceComponentAuthorityLedgerComponentV1["componentId"] =>
  NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS.includes(
    value as Nhm2SourceComponentAuthorityLedgerComponentV1["componentId"],
  );

const isStatus = (
  value: unknown,
): value is Nhm2SourceComponentAuthorityLedgerRegionV1["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => toText(entry) != null);

const isComponent = (
  value: unknown,
): value is Nhm2SourceComponentAuthorityLedgerComponentV1 => {
  const record = isRecord(value) ? value : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  return (
    record != null &&
    isComponentId(record.componentId) &&
    isNullableNumber(record.valueSI) &&
    isAuthority(record.authority) &&
    (record.componentGroup === "energy_density" ||
      record.componentGroup === "momentum_density" ||
      record.componentGroup === "spatial_stress_diagonal" ||
      record.componentGroup === "spatial_stress_off_diagonal") &&
    isNullableText(record.receiptRef) &&
    provenance != null &&
    toText(provenance.counterpartRegionRef) != null &&
    isNullableText(provenance.derivationMode) &&
    isNullableText(provenance.sourceModelId) &&
    isNullableText(provenance.sourceModelVersion) &&
    (provenance.notDerivedFromMetricRequiredTensor === null ||
      typeof provenance.notDerivedFromMetricRequiredTensor === "boolean") &&
    isStringArray(record.blockers)
  );
};

const isRegion = (
  value: unknown,
): value is Nhm2SourceComponentAuthorityLedgerRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isStatus(record.status) &&
    isNullableText(record.comparisonRole) &&
    isNullableText(record.tensorAuthorityMode) &&
    isNullableText(record.chartRef) &&
    isNullableText(record.unitsRef) &&
    isNullableText(record.regionMaskRef) &&
    isNullableText(record.aggregationMode) &&
    isNullableText(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    Array.isArray(record.components) &&
    record.components.length === NHM2_SOURCE_COMPONENT_AUTHORITY_REQUIRED_COMPONENTS.length &&
    record.components.every(isComponent) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2SourceComponentAuthorityLedger = (
  value: unknown,
): value is Nhm2SourceComponentAuthorityLedgerArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  if (
    record == null ||
    record.contractVersion !== NHM2_SOURCE_COMPONENT_AUTHORITY_LEDGER_CONTRACT_VERSION ||
    toText(record.generatedAt) == null ||
    toText(record.laneId) == null ||
    toText(record.selectedProfileId) == null ||
    toText(record.runId) == null ||
    !isNullableText(record.counterpartArtifactRef) ||
    !isNullableText(record.sourceTensorArtifactRef) ||
    !(record.atlasRef === undefined || isNullableText(record.atlasRef)) ||
    !(record.atlasHash === undefined || isNullableText(record.atlasHash)) ||
    !Array.isArray(record.regions) ||
    record.regions.length !== NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length ||
    !record.regions.every(isRegion) ||
    summary == null ||
    typeof summary.allRequiredRegionsPresent !== "boolean" ||
    typeof summary.allRequiredComponentsPresent !== "boolean" ||
    typeof summary.allRequiredComponentsAuthoritative !== "boolean" ||
    typeof summary.allRequiredComponentsAdmissible !== "boolean" ||
    typeof summary.sourceSideComponentAuthorityComplete !== "boolean" ||
    typeof summary.hasWallFullTensorAuthority !== "boolean" ||
    typeof summary.anyMetricEcho !== "boolean" ||
    typeof summary.anyScalarProxy !== "boolean" ||
    typeof summary.anyMissing !== "boolean" ||
    typeof summary.anyReducedOrder !== "boolean" ||
    !isStringArray(summary.missingComponentRefs) ||
    !isStringArray(summary.proxyComponentRefs) ||
    !isStringArray(summary.metricEchoComponentRefs) ||
    !isStringArray(summary.reducedOrderComponentRefs) ||
    !(summary.firstBlocker === null || toText(summary.firstBlocker) != null) ||
    typeof summary.blockerCount !== "number" ||
    !Number.isFinite(summary.blockerCount) ||
    claimBoundary?.diagnosticOnly !== true ||
    claimBoundary?.componentAuthorityDoesNotValidateMaterialSource !== true ||
    claimBoundary?.metricEchoForbidden !== true ||
    claimBoundary?.scalarProxyCannotProvideFullTensorAuthority !== true ||
    claimBoundary?.missingComponentsCannotBeZeroFilled !== true
  ) {
    return false;
  }
  const regions = record.regions as Nhm2SourceComponentAuthorityLedgerRegionV1[];
  const present = new Set(regions.map((region) => region.regionId));
  if (!NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) => present.has(regionId))) {
    return false;
  }
  return true;
};
