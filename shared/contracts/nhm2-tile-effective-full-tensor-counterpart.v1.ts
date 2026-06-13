import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2SourceComponentAuthorityLedgerArtifactV1,
  Nhm2SourceComponentAuthorityLedgerRegionV1,
} from "./nhm2-source-component-authority-ledger.v1";
import type { Nhm2TileEffectiveCounterpartArtifact } from "./nhm2-tile-effective-counterpart.v1";

export const NHM2_TILE_EFFECTIVE_FULL_TENSOR_COUNTERPART_CONTRACT_VERSION =
  "nhm2_tile_effective_full_tensor_counterpart/v1";

export type Nhm2TileEffectiveFullTensorCounterpartRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "review" | "fail" | "missing";
  counterpartRegionRef: string;
  componentLedgerRegionRef: string;
  comparisonRole: string | null;
  tensorAuthorityMode: string | null;
  sourceTensorRef: string | null;
  chartRef: string | null;
  unitsRef: string | null;
  regionMaskRef: string | null;
  aggregationMode: string | null;
  normalizationBasis: string | null;
  sampleCount: number | null;
  missingComponentIds: string[];
  blockerCount: number;
  blockers: string[];
};

export type Nhm2TileEffectiveFullTensorCounterpartArtifactV1 = {
  contractVersion: typeof NHM2_TILE_EFFECTIVE_FULL_TENSOR_COUNTERPART_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  counterpartArtifactRef: string;
  componentAuthorityLedgerRef: string;
  sourceTensorArtifactRef: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  regions: Nhm2TileEffectiveFullTensorCounterpartRegionV1[];
  summary: {
    tileEffectiveCounterpartFullTensorAvailable: boolean;
    sourceSideComponentAuthorityComplete: boolean;
    allRequiredRegionsPresent: boolean;
    wallCounterpartFullTensorAvailable: boolean;
    anyMetricEcho: boolean;
    anyScalarProxy: boolean;
    anyMissingComponent: boolean;
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    doesNotValidatePhysicalSource: true;
    doesNotProveMaterialCredibility: true;
    targetEchoForbidden: true;
  };
};

export type BuildNhm2TileEffectiveFullTensorCounterpartInput = {
  generatedAt?: string | null;
  counterpartArtifactRef: string;
  componentAuthorityLedgerRef: string;
  counterpartArtifact: Nhm2TileEffectiveCounterpartArtifact;
  componentAuthorityLedger: Nhm2SourceComponentAuthorityLedgerArtifactV1;
};

const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isNullableText = (value: unknown): value is string | null =>
  value === null || toText(value) != null;

const isStatus = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorCounterpartRegionV1["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const normalizeList = (values: string[]): string[] =>
  Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));

const regionFromLedger = (
  region: Nhm2SourceComponentAuthorityLedgerRegionV1,
  input: BuildNhm2TileEffectiveFullTensorCounterpartInput,
): Nhm2TileEffectiveFullTensorCounterpartRegionV1 => {
  const counterpartRegion = input.counterpartArtifact.regions.find(
    (entry) => entry.regionId === region.regionId,
  );
  const blockers = normalizeList([
    ...region.blockers,
    ...(counterpartRegion?.blockers ?? []),
  ]);
  return {
    regionId: region.regionId,
    status: region.status,
    counterpartRegionRef: `${input.counterpartArtifactRef}#${region.regionId}`,
    componentLedgerRegionRef: `${input.componentAuthorityLedgerRef}#${region.regionId}`,
    comparisonRole: region.comparisonRole,
    tensorAuthorityMode: region.tensorAuthorityMode,
    sourceTensorRef: counterpartRegion?.provenance.inputRefs[0] ?? null,
    chartRef: region.chartRef,
    unitsRef: region.unitsRef,
    regionMaskRef: region.regionMaskRef,
    aggregationMode: region.aggregationMode,
    normalizationBasis: region.normalizationBasis,
    sampleCount: region.sampleCount,
    missingComponentIds: region.components
      .filter((component) => component.authority === "missing")
      .map((component) => component.componentId),
    blockerCount: blockers.length,
    blockers,
  };
};

export const buildNhm2TileEffectiveFullTensorCounterpart = (
  input: BuildNhm2TileEffectiveFullTensorCounterpartInput,
): Nhm2TileEffectiveFullTensorCounterpartArtifactV1 => {
  const regions = input.componentAuthorityLedger.regions.map((region) =>
    regionFromLedger(region, input),
  );
  const blockers = normalizeList(
    regions.flatMap((region) =>
      region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
    ),
  );
  return {
    contractVersion: NHM2_TILE_EFFECTIVE_FULL_TENSOR_COUNTERPART_CONTRACT_VERSION,
    generatedAt: toText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    laneId: input.counterpartArtifact.laneId,
    selectedProfileId: input.counterpartArtifact.selectedProfileId,
    runId: input.counterpartArtifact.runId,
    counterpartArtifactRef: input.counterpartArtifactRef,
    componentAuthorityLedgerRef: input.componentAuthorityLedgerRef,
    sourceTensorArtifactRef: input.counterpartArtifact.sourceTensorArtifactRef ?? null,
    ...(input.componentAuthorityLedger.atlasRef === undefined
      ? {}
      : { atlasRef: input.componentAuthorityLedger.atlasRef }),
    ...(input.componentAuthorityLedger.atlasHash === undefined
      ? {}
      : { atlasHash: input.componentAuthorityLedger.atlasHash }),
    regions,
    summary: {
      tileEffectiveCounterpartFullTensorAvailable:
        input.componentAuthorityLedger.summary.allRequiredComponentsPresent &&
        input.componentAuthorityLedger.summary.allRequiredComponentsAdmissible,
      sourceSideComponentAuthorityComplete:
        input.componentAuthorityLedger.summary.sourceSideComponentAuthorityComplete,
      allRequiredRegionsPresent:
        input.componentAuthorityLedger.summary.allRequiredRegionsPresent,
      wallCounterpartFullTensorAvailable:
        regions.find((region) => region.regionId === "wall")?.status === "pass",
      anyMetricEcho: input.componentAuthorityLedger.summary.anyMetricEcho,
      anyScalarProxy: input.componentAuthorityLedger.summary.anyScalarProxy,
      anyMissingComponent: input.componentAuthorityLedger.summary.anyMissing,
      firstBlocker: blockers[0] ?? input.componentAuthorityLedger.summary.firstBlocker,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      doesNotValidatePhysicalSource: true,
      doesNotProveMaterialCredibility: true,
      targetEchoForbidden: true,
    },
  };
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => toText(entry) != null);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isRegion = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorCounterpartRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isStatus(record.status) &&
    toText(record.counterpartRegionRef) != null &&
    toText(record.componentLedgerRegionRef) != null &&
    isNullableText(record.comparisonRole) &&
    isNullableText(record.tensorAuthorityMode) &&
    isNullableText(record.sourceTensorRef) &&
    isNullableText(record.chartRef) &&
    isNullableText(record.unitsRef) &&
    isNullableText(record.regionMaskRef) &&
    isNullableText(record.aggregationMode) &&
    isNullableText(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    isStringArray(record.missingComponentIds) &&
    typeof record.blockerCount === "number" &&
    Number.isFinite(record.blockerCount) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2TileEffectiveFullTensorCounterpart = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorCounterpartArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_TILE_EFFECTIVE_FULL_TENSOR_COUNTERPART_CONTRACT_VERSION &&
    toText(record.generatedAt) != null &&
    toText(record.laneId) != null &&
    toText(record.selectedProfileId) != null &&
    toText(record.runId) != null &&
    toText(record.counterpartArtifactRef) != null &&
    toText(record.componentAuthorityLedgerRef) != null &&
    isNullableText(record.sourceTensorArtifactRef) &&
    (record.atlasRef === undefined || isNullableText(record.atlasRef)) &&
    (record.atlasHash === undefined || isNullableText(record.atlasHash)) &&
    Array.isArray(record.regions) &&
    record.regions.length === NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.tileEffectiveCounterpartFullTensorAvailable === "boolean" &&
    typeof summary.sourceSideComponentAuthorityComplete === "boolean" &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.wallCounterpartFullTensorAvailable === "boolean" &&
    typeof summary.anyMetricEcho === "boolean" &&
    typeof summary.anyScalarProxy === "boolean" &&
    typeof summary.anyMissingComponent === "boolean" &&
    (summary.firstBlocker === null || toText(summary.firstBlocker) != null) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.doesNotValidatePhysicalSource === true &&
    claimBoundary?.doesNotProveMaterialCredibility === true &&
    claimBoundary?.targetEchoForbidden === true
  );
};
