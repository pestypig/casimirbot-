import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorAuthorityMode,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_CONTRACT_VERSION =
  "nhm2_regional_full_tensor_residual/v1";

export const NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS = [
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

export type Nhm2RegionalFullTensorResidualComponentV1 = {
  componentId: (typeof NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS)[number];
  metricRequired: number | null;
  tileEffectiveCounterpart: number | null;
  absResidual: number | null;
  relResidual: number | null;
  status: "pass" | "fail" | "missing";
  blockers: string[];
};

export type Nhm2RegionalFullTensorResidualRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "fail" | "missing";
  metricTensorRef: string | null;
  tileTensorRef: string | null;
  metricTensorAuthorityMode: Nhm2TensorAuthorityMode;
  tileTensorAuthorityMode: Nhm2TensorAuthorityMode;
  missingMetricComponentIds: Nhm2TensorComponent[];
  missingTileComponentIds: Nhm2TensorComponent[];
  componentResiduals: Nhm2RegionalFullTensorResidualComponentV1[];
  t00RelResidual: number | null;
  fullRelLInf: number | null;
  fullAbsLInf: number | null;
  toleranceRelLInf: number;
  worstComponentId: Nhm2TensorComponent | null;
  worstComponentRelResidual: number | null;
  blockers: string[];
};

export type Nhm2RegionalFullTensorResidualArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  atlasRef?: string | null;
  atlasHash?: string | null;
  expectedAtlasHash?: string | null;
  regionalSourceClosureEvidenceRef: string | null;
  requiredComponents: typeof NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS;
  requiredRegions: typeof NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS;
  regions: Nhm2RegionalFullTensorResidualRegionV1[];
  summary: {
    allRequiredRegionsPresent: boolean;
    allRequiredComponentsPresent: boolean;
    t00ResidualsPass: boolean;
    fullTensorResidualsPass: boolean;
    anyAtlasMismatch: boolean;
    worstRegionId: Nhm2RegionalSourceClosureRegionId | null;
    worstComponentId: Nhm2TensorComponent | null;
    worstRelResidual: number | null;
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    fullTensorResidualDoesNotValidatePhysicalSource: true;
    missingComponentsCannotBeZeroFilled: true;
    globalResidualCannotMaskRegionalFailure: true;
  };
};

export type BuildNhm2RegionalFullTensorResidualInput = {
  generatedAt?: string | null;
  regionalSourceClosureEvidence: Nhm2RegionalSourceClosureEvidenceArtifact;
  regionalSourceClosureEvidenceRef?: string | null;
  expectedAtlasHash?: string | null;
  toleranceRelLInf?: number | null;
};

const DEFAULT_TOLERANCE_REL_LINF = 0.1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || isText(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const normalizeText = (value: unknown): string | null =>
  isText(value) ? value.trim() : null;

const finiteTensorValue = (
  tensor: Nhm2RegionalTensor,
  componentId: Nhm2TensorComponent,
): number | null => {
  const value = tensor[componentId];
  return isFiniteNumber(value) ? value : null;
};

const missingComponents = (tensor: Nhm2RegionalTensor): Nhm2TensorComponent[] =>
  NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS.filter(
    (componentId) => finiteTensorValue(tensor, componentId) == null,
  );

const fullTensorAuthorityBlocker = (
  authority: Nhm2TensorAuthorityMode,
  side: "metric" | "tile",
): string | null => {
  if (authority === "full_tensor" || authority === "symmetric_full_tensor") {
    return null;
  }
  if (authority === "diagonal_reduced_order") {
    return `${side}_full_tensor_authority_missing`;
  }
  if (authority === "proxy") return `${side}_proxy_tensor_authority`;
  return `${side}_tensor_authority_unknown`;
};

const componentResidual = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  componentId: (typeof NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS)[number],
  metricTensor: Nhm2RegionalTensor,
  tileTensor: Nhm2RegionalTensor,
  toleranceRelLInf: number,
): Nhm2RegionalFullTensorResidualComponentV1 => {
  const metricRequired = finiteTensorValue(metricTensor, componentId);
  const tileEffectiveCounterpart = finiteTensorValue(tileTensor, componentId);
  const blockers: string[] = [];
  if (metricRequired == null) blockers.push("metric_component_missing");
  if (tileEffectiveCounterpart == null) blockers.push("tile_component_missing");
  if (metricRequired == null || tileEffectiveCounterpart == null) {
    return {
      componentId,
      metricRequired,
      tileEffectiveCounterpart,
      absResidual: null,
      relResidual: null,
      status: "missing",
      blockers,
    };
  }
  const absResidual = Math.abs(metricRequired - tileEffectiveCounterpart);
  const relResidual =
    Math.abs(metricRequired) > 0 ? absResidual / Math.abs(metricRequired) : absResidual;
  if (relResidual > toleranceRelLInf) {
    blockers.push(`${regionId}:${componentId}:full_tensor_residual_exceeded`);
  }
  return {
    componentId,
    metricRequired,
    tileEffectiveCounterpart,
    absResidual,
    relResidual,
    status: relResidual <= toleranceRelLInf ? "pass" : "fail",
    blockers,
  };
};

const buildRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  evidence: Nhm2RegionalSourceClosureEvidenceArtifact,
  toleranceRelLInf: number,
): Nhm2RegionalFullTensorResidualRegionV1 => {
  const sourceRegion = evidence.regions.find((region) => region.regionId === regionId);
  if (sourceRegion == null) {
    return {
      regionId,
      status: "missing",
      metricTensorRef: null,
      tileTensorRef: null,
      metricTensorAuthorityMode: "unknown",
      tileTensorAuthorityMode: "unknown",
      missingMetricComponentIds: [...NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS],
      missingTileComponentIds: [...NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS],
      componentResiduals: [],
      t00RelResidual: null,
      fullRelLInf: null,
      fullAbsLInf: null,
      toleranceRelLInf,
      worstComponentId: null,
      worstComponentRelResidual: null,
      blockers: ["regional_full_tensor_residual_region_missing"],
    };
  }
  const components = NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS.map(
    (componentId) =>
      componentResidual(
        regionId,
        componentId,
        sourceRegion.metricRequired.tensor,
        sourceRegion.tileEffectiveCounterpart.tensor,
        toleranceRelLInf,
      ),
  );
  const missingMetricComponentIds = missingComponents(sourceRegion.metricRequired.tensor);
  const missingTileComponentIds = missingComponents(sourceRegion.tileEffectiveCounterpart.tensor);
  const metricAuthorityBlocker = fullTensorAuthorityBlocker(
    sourceRegion.metricRequired.tensorAuthorityMode,
    "metric",
  );
  const tileAuthorityBlocker = fullTensorAuthorityBlocker(
    sourceRegion.tileEffectiveCounterpart.tensorAuthorityMode,
    "tile",
  );
  const relResiduals = components
    .map((component) => component.relResidual)
    .filter((value): value is number => value != null);
  const absResiduals = components
    .map((component) => component.absResidual)
    .filter((value): value is number => value != null);
  const worst = components.reduce<Nhm2RegionalFullTensorResidualComponentV1 | null>(
    (current, next) => {
      if (next.relResidual == null) return current;
      if (current == null || current.relResidual == null) return next;
      return next.relResidual > current.relResidual ? next : current;
    },
    null,
  );
  const blockers = [
    ...(metricAuthorityBlocker == null ? [] : [metricAuthorityBlocker]),
    ...(tileAuthorityBlocker == null ? [] : [tileAuthorityBlocker]),
    ...missingMetricComponentIds.map((componentId) => `${componentId}:metric_component_missing`),
    ...missingTileComponentIds.map((componentId) => `${componentId}:tile_component_missing`),
    ...components.flatMap((component) => component.blockers),
    ...sourceRegion.blockers.map((blocker) => `source_evidence:${blocker}`),
  ];
  const hasMissing = components.some((component) => component.status === "missing");
  const hasFail = components.some((component) => component.status === "fail");
  return {
    regionId,
    status: hasMissing ? "missing" : hasFail || blockers.length > 0 ? "fail" : "pass",
    metricTensorRef: sourceRegion.metricRequired.tensorRef,
    tileTensorRef: sourceRegion.tileEffectiveCounterpart.tensorRef,
    metricTensorAuthorityMode: sourceRegion.metricRequired.tensorAuthorityMode,
    tileTensorAuthorityMode: sourceRegion.tileEffectiveCounterpart.tensorAuthorityMode,
    missingMetricComponentIds,
    missingTileComponentIds,
    componentResiduals: components,
    t00RelResidual:
      components.find((component) => component.componentId === "T00")?.relResidual ?? null,
    fullRelLInf: relResiduals.length === 0 ? null : Math.max(...relResiduals),
    fullAbsLInf: absResiduals.length === 0 ? null : Math.max(...absResiduals),
    toleranceRelLInf,
    worstComponentId: worst?.componentId ?? null,
    worstComponentRelResidual: worst?.relResidual ?? null,
    blockers: Array.from(new Set(blockers)),
  };
};

export const buildNhm2RegionalFullTensorResidual = (
  input: BuildNhm2RegionalFullTensorResidualInput,
): Nhm2RegionalFullTensorResidualArtifactV1 => {
  const evidence = input.regionalSourceClosureEvidence;
  const toleranceRelLInf = input.toleranceRelLInf ?? DEFAULT_TOLERANCE_REL_LINF;
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    buildRegion(regionId, evidence, toleranceRelLInf),
  );
  const atlasMismatch =
    input.expectedAtlasHash != null &&
    evidence.atlasHash != null &&
    input.expectedAtlasHash !== evidence.atlasHash;
  if (atlasMismatch) {
    for (const region of regions) {
      region.status = "fail";
      region.blockers = Array.from(new Set([...region.blockers, "atlas_hash_mismatch"]));
    }
  }
  const allRequiredRegionsPresent = regions.every((region) => region.status !== "missing");
  const allRequiredComponentsPresent = regions.every(
    (region) =>
      region.missingMetricComponentIds.length === 0 &&
      region.missingTileComponentIds.length === 0,
  );
  const t00ResidualsPass = regions.every((region) => {
    const t00 = region.componentResiduals.find((component) => component.componentId === "T00");
    return t00?.status === "pass";
  });
  const fullTensorResidualsPass =
    !atlasMismatch &&
    allRequiredRegionsPresent &&
    allRequiredComponentsPresent &&
    regions.every((region) => region.status === "pass");
  const worstRegion = regions.reduce<Nhm2RegionalFullTensorResidualRegionV1 | null>(
    (current, next) => {
      if (next.worstComponentRelResidual == null) return current;
      if (current == null || current.worstComponentRelResidual == null) return next;
      return next.worstComponentRelResidual > current.worstComponentRelResidual
        ? next
        : current;
    },
    null,
  );
  const blockers = regions.flatMap((region) =>
    region.blockers.map((blocker) =>
      blocker.startsWith(`${region.regionId}:`) ? blocker : `${region.regionId}:${blocker}`,
    ),
  );
  return {
    contractVersion: NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: evidence.laneId,
    selectedProfileId: evidence.selectedProfileId,
    runId: evidence.runId,
    ...(evidence.atlasRef === undefined ? {} : { atlasRef: evidence.atlasRef }),
    ...(evidence.atlasHash === undefined ? {} : { atlasHash: evidence.atlasHash }),
    expectedAtlasHash: input.expectedAtlasHash ?? null,
    regionalSourceClosureEvidenceRef:
      normalizeText(input.regionalSourceClosureEvidenceRef) ?? null,
    requiredComponents: NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS,
    requiredRegions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
    regions,
    summary: {
      allRequiredRegionsPresent,
      allRequiredComponentsPresent,
      t00ResidualsPass,
      fullTensorResidualsPass,
      anyAtlasMismatch: atlasMismatch,
      worstRegionId: worstRegion?.regionId ?? null,
      worstComponentId: worstRegion?.worstComponentId ?? null,
      worstRelResidual: worstRegion?.worstComponentRelResidual ?? null,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fullTensorResidualDoesNotValidatePhysicalSource: true,
      missingComponentsCannotBeZeroFilled: true,
      globalResidualCannotMaskRegionalFailure: true,
    },
  };
};

const isComponentId = (
  value: unknown,
): value is Nhm2RegionalFullTensorResidualComponentV1["componentId"] =>
  NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS.includes(
    value as Nhm2RegionalFullTensorResidualComponentV1["componentId"],
  );

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isAuthority = (value: unknown): value is Nhm2TensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isStatus = (value: unknown): value is "pass" | "fail" | "missing" =>
  value === "pass" || value === "fail" || value === "missing";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isComponent = (
  value: unknown,
): value is Nhm2RegionalFullTensorResidualComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isComponentId(record.componentId) &&
    isNullableNumber(record.metricRequired) &&
    isNullableNumber(record.tileEffectiveCounterpart) &&
    isNullableNumber(record.absResidual) &&
    isNullableNumber(record.relResidual) &&
    isStatus(record.status) &&
    isStringArray(record.blockers)
  );
};

const isRegion = (value: unknown): value is Nhm2RegionalFullTensorResidualRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isStatus(record.status) &&
    isNullableText(record.metricTensorRef) &&
    isNullableText(record.tileTensorRef) &&
    isAuthority(record.metricTensorAuthorityMode) &&
    isAuthority(record.tileTensorAuthorityMode) &&
    Array.isArray(record.missingMetricComponentIds) &&
    record.missingMetricComponentIds.every(isComponentId) &&
    Array.isArray(record.missingTileComponentIds) &&
    record.missingTileComponentIds.every(isComponentId) &&
    Array.isArray(record.componentResiduals) &&
    record.componentResiduals.length ===
      NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS.length &&
    record.componentResiduals.every(isComponent) &&
    isNullableNumber(record.t00RelResidual) &&
    isNullableNumber(record.fullRelLInf) &&
    isNullableNumber(record.fullAbsLInf) &&
    isFiniteNumber(record.toleranceRelLInf) &&
    (record.worstComponentId === null || isComponentId(record.worstComponentId)) &&
    isNullableNumber(record.worstComponentRelResidual) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2RegionalFullTensorResidual = (
  value: unknown,
): value is Nhm2RegionalFullTensorResidualArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.runId) &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.expectedAtlasHash) &&
    isNullableText(record.regionalSourceClosureEvidenceRef) &&
    Array.isArray(record.requiredComponents) &&
    record.requiredComponents.length ===
      NHM2_REGIONAL_FULL_TENSOR_RESIDUAL_REQUIRED_COMPONENTS.length &&
    record.requiredComponents.every(isComponentId) &&
    Array.isArray(record.requiredRegions) &&
    record.requiredRegions.length === NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length &&
    record.requiredRegions.every(isRegionId) &&
    Array.isArray(record.regions) &&
    record.regions.length === NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.allRequiredComponentsPresent === "boolean" &&
    typeof summary.t00ResidualsPass === "boolean" &&
    typeof summary.fullTensorResidualsPass === "boolean" &&
    typeof summary.anyAtlasMismatch === "boolean" &&
    (summary.worstRegionId === null || isRegionId(summary.worstRegionId)) &&
    (summary.worstComponentId === null || isComponentId(summary.worstComponentId)) &&
    isNullableNumber(summary.worstRelResidual) &&
    (summary.firstBlocker === null || isText(summary.firstBlocker)) &&
    isFiniteNumber(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.fullTensorResidualDoesNotValidatePhysicalSource === true &&
    claimBoundary?.missingComponentsCannotBeZeroFilled === true &&
    claimBoundary?.globalResidualCannotMaskRegionalFailure === true
  );
};
