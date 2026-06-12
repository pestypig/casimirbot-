import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_TILE_EFFECTIVE_COUNTERPART_ARTIFACT_ID =
  "nhm2_tile_effective_counterpart";
export const NHM2_TILE_EFFECTIVE_COUNTERPART_SCHEMA_VERSION =
  "nhm2_tile_effective_counterpart/v1";

export type Nhm2TileEffectiveCounterpartSourceAuthorityMode =
  | "renormalized_qft_declared"
  | "cycle_averaged_tile_model"
  | "reconstituted_full_tensor_from_tile_model"
  | "diagonal_reduced_order"
  | "proxy"
  | "metric_echo_forbidden"
  | "unknown";

export type Nhm2TileEffectiveCounterpartTensorAuthorityMode =
  | "full_tensor"
  | "symmetric_full_tensor"
  | "diagonal_reduced_order"
  | "proxy"
  | "unknown";

export type Nhm2TileEffectiveCounterpartComparisonRole =
  | "tile_effective_counterpart"
  | "gr_matter_channel_observation"
  | "metric_echo_diagnostic_only"
  | "unknown";

export type Nhm2TileEffectiveCounterpartRegion = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "review" | "fail" | "missing";
  comparisonRole: Nhm2TileEffectiveCounterpartComparisonRole;
  tensorAuthorityMode: Nhm2TileEffectiveCounterpartTensorAuthorityMode;
  tensor: Nhm2RegionalTensor;
  chartRef: "comoving_cartesian" | string;
  unitsRef: "J/m^3" | string;
  regionMaskRef: string | null;
  aggregationMode: "mean" | "integral" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "unknown";
  sampleCount: number | null;
  provenance: {
    producerModule: string | null;
    producerFunction: string | null;
    inputRefs: string[];
    sourceModelId: string | null;
    sourceModelVersion: string | null;
    derivationMode:
      | "explicit_global_source_row"
      | "tile_model_direct_full_tensor"
      | "tile_model_reconstituted_full_tensor"
      | "diagonal_proxy"
      | "metric_echo"
      | "unknown";
    notDerivedFromMetricRequiredTensor: boolean;
  };
  blockers: string[];
};

export type Nhm2TileEffectiveCounterpartArtifact = {
  artifactId: typeof NHM2_TILE_EFFECTIVE_COUNTERPART_ARTIFACT_ID;
  schemaVersion: typeof NHM2_TILE_EFFECTIVE_COUNTERPART_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  overallState: "pass" | "review" | "fail" | "missing";
  claimEffect: "diagnostic_only" | "source_counterpart_candidate" | "blocked";
  sourceAuthorityMode: Nhm2TileEffectiveCounterpartSourceAuthorityMode;
  promotionAllowed: false;
  physicalMechanismClaimAllowed: false;
  validationClaimAllowed: false;
  sourceTensorArtifactRef?: string | null;
  sourceTensorAuthorityMode?: string | null;
  conservationRef?: string | null;
  conservationStatus?: "pass" | "review" | "fail" | "missing" | "unknown";
  qeiDossierRef: string | null;
  qeiApplicabilityStatus: "PASS" | "REVIEW" | "FAIL" | "UNKNOWN";
  quantumStateAssumptions: string[];
  renormalizationConvention: string | null;
  cavityBoundaryModel: string | null;
  cycleAverageClosureStatus: "pass" | "review" | "fail" | "unknown";
  dutyCycleStatus: "pass" | "review" | "fail" | "unknown";
  lightCrossingConsistencyStatus: "pass" | "review" | "fail" | "unknown";
  conservationDiagnostics: {
    divTStatus: "pass" | "review" | "fail" | "unknown";
    divTResidualLInf: number | null;
    continuityResidualLInf: number | null;
    momentumResidualLInf: number | null;
  };
  regions: Nhm2TileEffectiveCounterpartRegion[];
  literatureRefs: string[];
  reasonCodes: string[];
};

export type BuildNhm2TileEffectiveCounterpartArtifactInput = Omit<
  Nhm2TileEffectiveCounterpartArtifact,
  | "artifactId"
  | "schemaVersion"
  | "profileMatch"
  | "overallState"
  | "claimEffect"
  | "promotionAllowed"
  | "physicalMechanismClaimAllowed"
  | "validationClaimAllowed"
  | "reasonCodes"
>;

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

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  return Object.entries(record).every(
    ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
  );
};

const isSourceAuthorityMode = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartSourceAuthorityMode =>
  value === "renormalized_qft_declared" ||
  value === "cycle_averaged_tile_model" ||
  value === "reconstituted_full_tensor_from_tile_model" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "metric_echo_forbidden" ||
  value === "unknown";

const isTensorAuthorityMode = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartTensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isComparisonRole = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartComparisonRole =>
  value === "tile_effective_counterpart" ||
  value === "gr_matter_channel_observation" ||
  value === "metric_echo_diagnostic_only" ||
  value === "unknown";

const isLowerStatus = (value: unknown): value is "pass" | "review" | "fail" | "unknown" =>
  value === "pass" || value === "review" || value === "fail" || value === "unknown";

const isRegionStatus = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartRegion["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isAggregationMode = (value: unknown): value is "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" || value === "unknown";

const isNormalizationBasis = (
  value: unknown,
): value is "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" || value === "unknown";

const isQeiApplicability = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartArtifact["qeiApplicabilityStatus"] =>
  value === "PASS" || value === "REVIEW" || value === "FAIL" || value === "UNKNOWN";

const isDerivationMode = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartRegion["provenance"]["derivationMode"] =>
  value === "explicit_global_source_row" ||
  value === "tile_model_direct_full_tensor" ||
  value === "tile_model_reconstituted_full_tensor" ||
  value === "diagonal_proxy" ||
  value === "metric_echo" ||
  value === "unknown";

const tensorHasFullAuthority = (
  mode: Nhm2TileEffectiveCounterpartTensorAuthorityMode,
): boolean => mode === "full_tensor" || mode === "symmetric_full_tensor";

export const deriveNhm2TileEffectiveCounterpartRegionBlockers = (
  region: Nhm2TileEffectiveCounterpartRegion,
): string[] => {
  const blockers = new Set(region.blockers);
  if (region.comparisonRole === "gr_matter_channel_observation") {
    blockers.add("tile_effective_counterpart_missing");
  }
  if (region.comparisonRole === "metric_echo_diagnostic_only") {
    blockers.add("metric_echo_not_source_closure");
  }
  if (region.provenance.derivationMode === "metric_echo") {
    blockers.add("metric_echo_not_source_closure");
  }
  if (!region.provenance.notDerivedFromMetricRequiredTensor) {
    blockers.add("metric_required_derivation_not_allowed");
  }
  if (region.tensorAuthorityMode === "proxy") {
    blockers.add("proxy_tensor_authority");
  }
  if (region.tensorAuthorityMode === "diagonal_reduced_order") {
    blockers.add("full_tensor_authority_missing");
  }
  if (region.tensorAuthorityMode === "unknown") {
    blockers.add("tensor_authority_unknown");
  }
  if (region.regionMaskRef == null) blockers.add("region_mask_ref_missing");
  if (region.aggregationMode === "unknown") blockers.add("aggregation_mode_unknown");
  if (region.normalizationBasis === "unknown") blockers.add("normalization_basis_unknown");
  if (region.sampleCount == null) blockers.add("sample_count_missing");
  return Array.from(blockers);
};

const normalizeRegionStatus = (
  region: Nhm2TileEffectiveCounterpartRegion,
): Nhm2TileEffectiveCounterpartRegion["status"] => {
  if (region.status === "missing") return "missing";
  const blockers = deriveNhm2TileEffectiveCounterpartRegionBlockers(region);
  if (
    region.status === "fail" ||
    blockers.includes("metric_echo_not_source_closure") ||
    blockers.includes("metric_required_derivation_not_allowed") ||
    blockers.includes("proxy_tensor_authority")
  ) {
    return "fail";
  }
  return blockers.length > 0 ? "review" : "pass";
};

const aggregateSourceAuthority = (
  regions: Nhm2TileEffectiveCounterpartRegion[],
): Nhm2TileEffectiveCounterpartSourceAuthorityMode => {
  if (regions.some((region) => region.provenance.derivationMode === "metric_echo")) {
    return "metric_echo_forbidden";
  }
  if (regions.some((region) => region.tensorAuthorityMode === "proxy")) return "proxy";
  if (regions.some((region) => region.tensorAuthorityMode === "diagonal_reduced_order")) {
    return "diagonal_reduced_order";
  }
  if (regions.every((region) => region.provenance.derivationMode === "tile_model_direct_full_tensor")) {
    return "cycle_averaged_tile_model";
  }
  if (regions.every((region) => region.provenance.derivationMode === "tile_model_reconstituted_full_tensor")) {
    return "reconstituted_full_tensor_from_tile_model";
  }
  if (
    regions.every(
      (region) =>
        region.provenance.derivationMode === "tile_model_direct_full_tensor" ||
        region.provenance.derivationMode === "tile_model_reconstituted_full_tensor" ||
        region.provenance.derivationMode === "explicit_global_source_row",
    )
  ) {
    return "cycle_averaged_tile_model";
  }
  return "unknown";
};

export const buildNhm2TileEffectiveCounterpartArtifact = (
  input: BuildNhm2TileEffectiveCounterpartArtifactInput,
): Nhm2TileEffectiveCounterpartArtifact => {
  const profileMatch = input.selectedProfileId === input.expectedProfileId;
  const present = new Set(input.regions.map((region) => region.regionId));
  const regions = input.regions.map((region) => {
    const blockers = deriveNhm2TileEffectiveCounterpartRegionBlockers(region);
    return {
      ...region,
      status: normalizeRegionStatus({ ...region, blockers }),
      blockers,
    };
  });
  const reasonCodes = new Set<string>();
  if (!profileMatch) reasonCodes.add("profile_mismatch");
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!present.has(regionId)) reasonCodes.add(`missing_required_region:${regionId}`);
  }
  if (input.qeiApplicabilityStatus !== "PASS") {
    reasonCodes.add("qei_not_promotion_safe");
  }
  for (const region of regions) {
    for (const blocker of region.blockers) {
      reasonCodes.add(`${region.regionId}:${blocker}`);
    }
  }
  const allRegionsPresent = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every(
    (regionId) => present.has(regionId),
  );
  const hasFail = !profileMatch || !allRegionsPresent || regions.some((region) => region.status === "fail");
  const hasReview = regions.some((region) => region.status === "review");
  const overallState = hasFail ? "fail" : hasReview ? "review" : "pass";
  return {
    artifactId: NHM2_TILE_EFFECTIVE_COUNTERPART_ARTIFACT_ID,
    schemaVersion: NHM2_TILE_EFFECTIVE_COUNTERPART_SCHEMA_VERSION,
    ...input,
    profileMatch,
    overallState,
    claimEffect:
      overallState === "pass" ? "source_counterpart_candidate" : overallState === "review" ? "diagnostic_only" : "blocked",
    sourceAuthorityMode: input.sourceAuthorityMode === "unknown" ? aggregateSourceAuthority(regions) : input.sourceAuthorityMode,
    promotionAllowed: false,
    physicalMechanismClaimAllowed: false,
    validationClaimAllowed: false,
    regions,
    reasonCodes: Array.from(reasonCodes),
  };
};

const isRegion = (value: unknown): value is Nhm2TileEffectiveCounterpartRegion => {
  const record = isRecord(value) ? value : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isRegionStatus(record.status) &&
    isComparisonRole(record.comparisonRole) &&
    isTensorAuthorityMode(record.tensorAuthorityMode) &&
    isTensor(record.tensor) &&
    isText(record.chartRef) &&
    isText(record.unitsRef) &&
    isNullableText(record.regionMaskRef) &&
    isAggregationMode(record.aggregationMode) &&
    isNormalizationBasis(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    provenance != null &&
    isNullableText(provenance.producerModule) &&
    isNullableText(provenance.producerFunction) &&
    Array.isArray(provenance.inputRefs) &&
    provenance.inputRefs.every(isText) &&
    isNullableText(provenance.sourceModelId) &&
    isNullableText(provenance.sourceModelVersion) &&
    isDerivationMode(provenance.derivationMode) &&
    typeof provenance.notDerivedFromMetricRequiredTensor === "boolean" &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2TileEffectiveCounterpartArtifact = (
  value: unknown,
): value is Nhm2TileEffectiveCounterpartArtifact => {
  const record = isRecord(value) ? value : null;
  const conservation = isRecord(record?.conservationDiagnostics)
    ? record?.conservationDiagnostics
    : null;
  if (
    record == null ||
    record.artifactId !== NHM2_TILE_EFFECTIVE_COUNTERPART_ARTIFACT_ID ||
    record.schemaVersion !== NHM2_TILE_EFFECTIVE_COUNTERPART_SCHEMA_VERSION ||
    !isText(record.generatedAt) ||
    !isText(record.runId) ||
    !isText(record.selectedProfileId) ||
    !isText(record.expectedProfileId) ||
    record.profileMatch !== (record.selectedProfileId === record.expectedProfileId) ||
    record.profileMatch !== true ||
    record.laneId !== "nhm2_shift_lapse" ||
    !isRegionStatus(record.overallState) ||
    record.overallState === "missing" ||
    (record.claimEffect !== "diagnostic_only" &&
      record.claimEffect !== "source_counterpart_candidate" &&
      record.claimEffect !== "blocked") ||
    !isSourceAuthorityMode(record.sourceAuthorityMode) ||
    record.promotionAllowed !== false ||
    record.physicalMechanismClaimAllowed !== false ||
    record.validationClaimAllowed !== false ||
    !isNullableText(record.qeiDossierRef) ||
    !isQeiApplicability(record.qeiApplicabilityStatus) ||
    !Array.isArray(record.quantumStateAssumptions) ||
    !record.quantumStateAssumptions.every(isText) ||
    !isNullableText(record.renormalizationConvention) ||
    !isNullableText(record.cavityBoundaryModel) ||
    !isLowerStatus(record.cycleAverageClosureStatus) ||
    !isLowerStatus(record.dutyCycleStatus) ||
    !isLowerStatus(record.lightCrossingConsistencyStatus) ||
    conservation == null ||
    !isLowerStatus(conservation.divTStatus) ||
    !isNullableNumber(conservation.divTResidualLInf) ||
    !isNullableNumber(conservation.continuityResidualLInf) ||
    !isNullableNumber(conservation.momentumResidualLInf) ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isRegion) ||
    !Array.isArray(record.literatureRefs) ||
    !record.literatureRefs.every(isText) ||
    !Array.isArray(record.reasonCodes) ||
    !record.reasonCodes.every(isText)
  ) {
    return false;
  }
  if (record.overallState === "pass") {
    if (!record.profileMatch) return false;
    const present = new Set(record.regions.map((region) => region.regionId));
    if (!NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) => present.has(regionId))) {
      return false;
    }
    if (record.sourceAuthorityMode === "proxy" || record.sourceAuthorityMode === "metric_echo_forbidden") {
      return false;
    }
    return record.regions.every(
      (region) =>
        region.status === "pass" &&
        region.comparisonRole === "tile_effective_counterpart" &&
        tensorHasFullAuthority(region.tensorAuthorityMode) &&
        region.regionMaskRef != null &&
        region.aggregationMode !== "unknown" &&
        region.normalizationBasis !== "unknown" &&
        region.sampleCount != null &&
        region.provenance.notDerivedFromMetricRequiredTensor === true &&
        region.provenance.derivationMode !== "metric_echo",
    );
  }
  if (record.qeiApplicabilityStatus !== "PASS" && !record.reasonCodes.includes("qei_not_promotion_safe")) {
    return false;
  }
  return true;
};
