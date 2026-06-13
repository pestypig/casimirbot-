import {
  NHM2_TENSOR_COMPONENTS,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_TILE_COUNTERPART_CONSERVATION_ARTIFACT_ID =
  "nhm2_tile_counterpart_conservation";
export const NHM2_TILE_COUNTERPART_CONSERVATION_SCHEMA_VERSION =
  "nhm2_tile_counterpart_conservation/v1";

export type Nhm2TileCounterpartConservationArtifact = {
  artifactId: typeof NHM2_TILE_COUNTERPART_CONSERVATION_ARTIFACT_ID;
  schemaVersion: typeof NHM2_TILE_COUNTERPART_CONSERVATION_SCHEMA_VERSION;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  chartRef: "comoving_cartesian" | string;
  derivativeStencil: string;
  unitsRef: string;
  atlasRef?: string | null;
  atlasHash?: string | null;
  overallState: "pass" | "review" | "fail" | "missing";
  regions: Array<{
    regionId: Nhm2RegionalSourceClosureRegionId;
    status: "pass" | "review" | "fail" | "missing";
    divTResidualLInf: number | null;
    continuityResidualLInf: number | null;
    momentumResidualLInf: number | null;
    toleranceLInf: number | null;
    sampleCount: number | null;
    diagnosticMode?:
      | "regional_jump_linf_v1"
      | "regional_jump_linf_with_transition_kernel_v1"
      | "not_computed_validation_hardening_placeholder";
    neighborRegionIds?: Nhm2RegionalSourceClosureRegionId[];
    transitionKernelRef?: string | null;
    preTransitionResidualLInf?: number | null;
    postTransitionResidualLInf?: number | null;
    transitionSmoothingWeight?: number | null;
    transitionLayerResidualLInf?: number | null;
    dominantComponentId?: Nhm2TensorComponent | null;
    maxHotspotRef?: string | null;
    warnings?: string[];
    blockers: string[];
  }>;
  claimEffect: "diagnostic_only" | "conservation_candidate" | "blocked";
  promotionAllowed: false;
  reasonCodes: string[];
};

export type BuildNhm2TileCounterpartConservationArtifactInput = Omit<
  Nhm2TileCounterpartConservationArtifact,
  "artifactId" | "schemaVersion" | "profileMatch" | "overallState" | "claimEffect" | "promotionAllowed" | "reasonCodes"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isStatus = (value: unknown): value is "pass" | "review" | "fail" | "missing" =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isOptionalDiagnosticMode = (
  value: unknown,
): value is
  | "regional_jump_linf_v1"
  | "regional_jump_linf_with_transition_kernel_v1"
  | "not_computed_validation_hardening_placeholder"
  | undefined =>
  value === undefined ||
  value === "regional_jump_linf_v1" ||
  value === "regional_jump_linf_with_transition_kernel_v1" ||
  value === "not_computed_validation_hardening_placeholder";

const isOptionalRegionIds = (
  value: unknown,
): value is Nhm2RegionalSourceClosureRegionId[] | undefined =>
  value === undefined ||
  (Array.isArray(value) && value.every(isRegionId));

const isOptionalNullableNumber = (
  value: unknown,
): value is number | null | undefined =>
  value === undefined || isNullableNumber(value);

const isOptionalTensorComponent = (
  value: unknown,
): value is Nhm2TensorComponent | null | undefined =>
  value === undefined ||
  value === null ||
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const isOptionalNullableText = (
  value: unknown,
): value is string | null | undefined =>
  value === undefined || value === null || isText(value);

const isOptionalTextArray = (value: unknown): value is string[] | undefined =>
  value === undefined || (Array.isArray(value) && value.every(isText));

const deriveRegionBlockers = (
  region: Nhm2TileCounterpartConservationArtifact["regions"][number],
): string[] => {
  const blockers = new Set(region.blockers);
  if (region.divTResidualLInf == null) blockers.add("divT_residual_missing");
  if (region.continuityResidualLInf == null) blockers.add("continuity_residual_missing");
  if (region.momentumResidualLInf == null) blockers.add("momentum_residual_missing");
  if (region.toleranceLInf == null) blockers.add("tolerance_missing");
  if (region.sampleCount == null) blockers.add("sample_count_missing");
  if (
    region.toleranceLInf != null &&
    ((region.divTResidualLInf ?? 0) > region.toleranceLInf ||
      (region.continuityResidualLInf ?? 0) > region.toleranceLInf ||
      (region.momentumResidualLInf ?? 0) > region.toleranceLInf)
  ) {
    blockers.add("conservation_residual_exceeded");
  }
  return Array.from(blockers);
};

export const buildNhm2TileCounterpartConservationArtifact = (
  input: BuildNhm2TileCounterpartConservationArtifactInput,
): Nhm2TileCounterpartConservationArtifact => {
  const profileMatch = input.selectedProfileId === input.expectedProfileId;
  const present = new Set(input.regions.map((region) => region.regionId));
  const reasonCodes = new Set<string>();
  if (!profileMatch) reasonCodes.add("profile_mismatch");
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!present.has(regionId)) reasonCodes.add(`missing_required_region:${regionId}`);
  }
  const regions = input.regions.map((region) => {
    const blockers = deriveRegionBlockers(region);
    for (const blocker of blockers) reasonCodes.add(`${region.regionId}:${blocker}`);
    const status: Nhm2TileCounterpartConservationArtifact["regions"][number]["status"] =
      region.status === "missing"
        ? "missing"
        : blockers.includes("conservation_residual_exceeded")
          ? "fail"
          : blockers.length > 0
            ? "review"
            : region.status;
    return { ...region, status, blockers };
  });
  const allPresent = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) => present.has(regionId));
  const hasFail = !profileMatch || !allPresent || regions.some((region) => region.status === "fail");
  const hasReview = regions.some((region) => region.status === "review" || region.status === "missing");
  const overallState = hasFail ? "fail" : hasReview ? "review" : "pass";
  return {
    artifactId: NHM2_TILE_COUNTERPART_CONSERVATION_ARTIFACT_ID,
    schemaVersion: NHM2_TILE_COUNTERPART_CONSERVATION_SCHEMA_VERSION,
    ...input,
    profileMatch,
    regions,
    overallState,
    claimEffect: overallState === "pass" ? "conservation_candidate" : overallState === "review" ? "diagnostic_only" : "blocked",
    promotionAllowed: false,
    reasonCodes: Array.from(reasonCodes),
  };
};

const isRegion = (
  value: unknown,
): value is Nhm2TileCounterpartConservationArtifact["regions"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isStatus(record.status) &&
    isNullableNumber(record.divTResidualLInf) &&
    isNullableNumber(record.continuityResidualLInf) &&
    isNullableNumber(record.momentumResidualLInf) &&
    isNullableNumber(record.toleranceLInf) &&
    isNullableNumber(record.sampleCount) &&
    isOptionalDiagnosticMode(record.diagnosticMode) &&
    isOptionalRegionIds(record.neighborRegionIds) &&
    isOptionalNullableText(record.transitionKernelRef) &&
    isOptionalNullableNumber(record.preTransitionResidualLInf) &&
    isOptionalNullableNumber(record.postTransitionResidualLInf) &&
    isOptionalNullableNumber(record.transitionSmoothingWeight) &&
    isOptionalNullableNumber(record.transitionLayerResidualLInf) &&
    isOptionalTensorComponent(record.dominantComponentId) &&
    isOptionalNullableText(record.maxHotspotRef) &&
    isOptionalTextArray(record.warnings) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2TileCounterpartConservationArtifact = (
  value: unknown,
): value is Nhm2TileCounterpartConservationArtifact => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.artifactId === NHM2_TILE_COUNTERPART_CONSERVATION_ARTIFACT_ID &&
    record.schemaVersion === NHM2_TILE_COUNTERPART_CONSERVATION_SCHEMA_VERSION &&
    isText(record.runId) &&
    isText(record.selectedProfileId) &&
    isText(record.expectedProfileId) &&
    record.profileMatch === (record.selectedProfileId === record.expectedProfileId) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.chartRef) &&
    isText(record.derivativeStencil) &&
    isText(record.unitsRef) &&
    isOptionalNullableText(record.atlasRef) &&
    isOptionalNullableText(record.atlasHash) &&
    isStatus(record.overallState) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    (record.claimEffect === "diagnostic_only" ||
      record.claimEffect === "conservation_candidate" ||
      record.claimEffect === "blocked") &&
    record.promotionAllowed === false &&
    Array.isArray(record.reasonCodes) &&
    record.reasonCodes.every(isText)
  );
};
