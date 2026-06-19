import { isNhm2CandidateMetricProfileSpec } from "./nhm2-candidate-metric-profile-spec.v1";
import { isNhm2MetricRequiredRegionalFullTensorSourceArtifact } from "./nhm2-metric-required-regional-full-tensor-source.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_SOURCE_TILE_COUNTERPART_COMPATIBILITY_CONTRACT_VERSION =
  "nhm2_source_tile_counterpart_compatibility/v1";

export type Nhm2SourceTileCounterpartCompatibilityStatus =
  | "pass"
  | "review"
  | "fail"
  | "missing";

export type Nhm2SourceTileCounterpartCompatibilityRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: Nhm2SourceTileCounterpartCompatibilityStatus;
  metricRequiredTensorRef: string | null;
  sourceCounterpartRegionRef: string | null;
  sameProfile: boolean;
  fullMetricRequiredTensorAvailable: boolean;
  sourceCounterpartAvailable: boolean;
  sourceFullTensorAuthorityAvailable: boolean;
  blockers: string[];
};

export type Nhm2SourceTileCounterpartCompatibilityArtifactV1 = {
  contractVersion: typeof NHM2_SOURCE_TILE_COUNTERPART_COMPATIBILITY_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  candidateProfileId: string;
  runtimeProfileId: string | null;
  metricRequiredFullRegionalTensorRef: string;
  sourceCounterpartRef: string | null;
  sourceFullTensorRef: string | null;
  regions: Nhm2SourceTileCounterpartCompatibilityRegionV1[];
  summary: {
    sourceCounterpartAvailable: boolean;
    sameProfileCounterpart: boolean;
    allRegionsCompatible: boolean;
    firstBlocker: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    compatibilityDoesNotValidateSourcePhysics: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2SourceTileCounterpartCompatibilityInput = {
  generatedAt?: string | null;
  candidateProfileSpec: unknown;
  metricRequiredFullRegionalTensor: unknown;
  metricRequiredFullRegionalTensorRef: string;
  sourceCounterpartRef?: string | null;
  sourceCounterpart?: unknown;
  sourceFullTensorRef?: string | null;
  sourceFullTensor?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

const selectedProfileIdFor = (artifact: unknown): string | null => {
  const record = isRecord(artifact) ? artifact : null;
  return isText(record?.selectedProfileId) ? record.selectedProfileId : null;
};

const sourceRegionsFor = (
  sourceCounterpart: unknown,
  sourceFullTensor: unknown,
): Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>> => {
  const regions = new Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>>();
  for (const source of [sourceFullTensor, sourceCounterpart]) {
    const record = isRecord(source) ? source : null;
    const list = Array.isArray(record?.regions) ? record.regions : [];
    for (const entry of list) {
      const region = isRecord(entry) ? entry : null;
      const regionId = region?.regionId as Nhm2RegionalSourceClosureRegionId;
      if (NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(regionId)) {
        regions.set(regionId, region);
      }
    }
  }
  return regions;
};

const hasFullTensorAuthority = (region: Record<string, unknown> | null): boolean => {
  if (region == null) return false;
  if (
    region.tensorAuthorityMode === "full_tensor" ||
    region.tensorAuthorityMode === "symmetric_full_tensor"
  ) {
    return true;
  }
  const tensor = isRecord(region.tensor) ? region.tensor : null;
  return [
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
  ].every((component) => typeof tensor?.[component] === "number");
};

export const buildNhm2SourceTileCounterpartCompatibility = (
  input: BuildNhm2SourceTileCounterpartCompatibilityInput,
): Nhm2SourceTileCounterpartCompatibilityArtifactV1 => {
  if (!isNhm2CandidateMetricProfileSpec(input.candidateProfileSpec)) {
    throw new Error("candidate profile spec must be nhm2_candidate_metric_profile_spec/v1");
  }
  if (
    !isNhm2MetricRequiredRegionalFullTensorSourceArtifact(
      input.metricRequiredFullRegionalTensor,
    )
  ) {
    throw new Error(
      "metric-required full regional tensor must be nhm2_metric_required_regional_full_tensor_source/v1",
    );
  }
  const spec = input.candidateProfileSpec;
  const metric = input.metricRequiredFullRegionalTensor;
  const sourceAvailable = input.sourceCounterpart != null || input.sourceFullTensor != null;
  const sourceProfile =
    selectedProfileIdFor(input.sourceFullTensor) ??
    selectedProfileIdFor(input.sourceCounterpart);
  const sameProfile = sourceAvailable && sourceProfile === spec.candidateProfileId;
  const sourceRegions = sourceRegionsFor(input.sourceCounterpart, input.sourceFullTensor);
  const metricRegionById = new Map(metric.regions.map((region) => [region.regionId, region]));

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const metricRegion = metricRegionById.get(regionId) ?? null;
    const sourceRegion = sourceRegions.get(regionId) ?? null;
    const fullMetricRequiredTensorAvailable =
      metricRegion?.sameChartFullTensor.completeness.fullTensorComplete === true;
    const sourceCounterpartAvailable = sourceRegion != null;
    const sourceFullTensorAuthorityAvailable = hasFullTensorAuthority(sourceRegion);
    const blockers = [
      ...(!fullMetricRequiredTensorAvailable
        ? ["candidate_metric_required_full_regional_tensor_incomplete"]
        : []),
      ...(!sourceAvailable ? ["candidate_tile_effective_counterpart_source_missing"] : []),
      ...(sourceAvailable && !sameProfile
        ? ["candidate_tile_counterpart_profile_mismatch"]
        : []),
      ...(sourceAvailable && !sourceCounterpartAvailable
        ? ["candidate_tile_counterpart_region_missing"]
        : []),
      ...(sourceAvailable &&
      sourceCounterpartAvailable &&
      !sourceFullTensorAuthorityAvailable
        ? ["candidate_tile_counterpart_full_tensor_authority_missing"]
        : []),
      ...stringList(sourceRegion?.blockers).map(
        (blocker) => `candidate_tile_counterpart_source_blocker:${blocker}`,
      ),
    ];
    return {
      regionId,
      status:
        blockers.length === 0
          ? "pass"
          : !sourceAvailable || !sourceCounterpartAvailable
            ? "missing"
            : sameProfile
              ? "review"
              : "fail",
      metricRequiredTensorRef:
        metricRegion?.tensorRef ??
        metricRegion?.artifactRef ??
        `${input.metricRequiredFullRegionalTensorRef}#${regionId}`,
      sourceCounterpartRegionRef:
        sourceRegion == null
          ? null
          : `${input.sourceFullTensorRef ?? input.sourceCounterpartRef ?? "source-counterpart"}#${regionId}`,
      sameProfile,
      fullMetricRequiredTensorAvailable,
      sourceCounterpartAvailable,
      sourceFullTensorAuthorityAvailable,
      blockers,
    };
  });
  const firstBlocker = regions.flatMap((region) => region.blockers)[0] ?? null;
  return {
    contractVersion: NHM2_SOURCE_TILE_COUNTERPART_COMPATIBILITY_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    candidateProfileId: spec.candidateProfileId,
    runtimeProfileId: spec.executableGeometry.runtimeProfileId,
    metricRequiredFullRegionalTensorRef: input.metricRequiredFullRegionalTensorRef,
    sourceCounterpartRef: input.sourceCounterpartRef ?? null,
    sourceFullTensorRef: input.sourceFullTensorRef ?? null,
    regions,
    summary: {
      sourceCounterpartAvailable: sourceAvailable,
      sameProfileCounterpart: sameProfile,
      allRegionsCompatible: firstBlocker == null,
      firstBlocker,
    },
    claimBoundary: {
      diagnosticOnly: true,
      compatibilityDoesNotValidateSourcePhysics: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

const isRegion = (
  value: unknown,
): value is Nhm2SourceTileCounterpartCompatibilityRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
      record.regionId as Nhm2RegionalSourceClosureRegionId,
    ) &&
    ["pass", "review", "fail", "missing"].includes(String(record.status)) &&
    isNullableText(record.metricRequiredTensorRef) &&
    isNullableText(record.sourceCounterpartRegionRef) &&
    typeof record.sameProfile === "boolean" &&
    typeof record.fullMetricRequiredTensorAvailable === "boolean" &&
    typeof record.sourceCounterpartAvailable === "boolean" &&
    typeof record.sourceFullTensorAuthorityAvailable === "boolean" &&
    Array.isArray(record.blockers)
  );
};

export const isNhm2SourceTileCounterpartCompatibility = (
  value: unknown,
): value is Nhm2SourceTileCounterpartCompatibilityArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_SOURCE_TILE_COUNTERPART_COMPATIBILITY_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.candidateProfileId) &&
    isNullableText(record.runtimeProfileId) &&
    isText(record.metricRequiredFullRegionalTensorRef) &&
    isNullableText(record.sourceCounterpartRef) &&
    isNullableText(record.sourceFullTensorRef) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.sourceCounterpartAvailable === "boolean" &&
    typeof summary.sameProfileCounterpart === "boolean" &&
    typeof summary.allRegionsCompatible === "boolean" &&
    isNullableText(summary.firstBlocker) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.compatibilityDoesNotValidateSourcePhysics === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};
