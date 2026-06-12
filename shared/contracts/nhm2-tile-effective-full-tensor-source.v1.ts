import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_ARTIFACT_ID =
  "nhm2_tile_effective_full_tensor_source";
export const NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_SCHEMA_VERSION =
  "nhm2_tile_effective_full_tensor_source/v1";

export type Nhm2TileEffectiveFullTensorSourceAuthorityMode =
  | "full_tensor"
  | "symmetric_full_tensor"
  | "diagonal_reduced_order"
  | "proxy"
  | "metric_echo_forbidden"
  | "unknown";

export type Nhm2TileEffectiveFullTensorSourceArtifact = {
  artifactId: typeof NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_ARTIFACT_ID;
  schemaVersion: typeof NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  overallState: "pass" | "review" | "fail" | "missing";
  claimEffect: "diagnostic_only" | "source_tensor_candidate" | "blocked";
  sourceModel: {
    sourceModelId: string;
    sourceModelVersion: string;
    sourceModelClass:
      | "cycle_averaged_tile_model"
      | "renormalized_qft_declared"
      | "reconstituted_from_source_channels"
      | "diagonal_proxy"
      | "metric_echo_forbidden"
      | "unknown";
    sourceSideOnly: boolean;
    notDerivedFromMetricRequiredTensor: boolean;
    metricRequiredInputRefs: string[];
    sourceInputRefs: string[];
    qeiDossierRef: string | null;
    conservationRef: string | null;
  };
  regions: Array<{
    regionId: Nhm2RegionalSourceClosureRegionId;
    status: "pass" | "review" | "fail" | "missing";
    tensorAuthorityMode: Nhm2TileEffectiveFullTensorSourceAuthorityMode;
    tensor: Nhm2RegionalTensor;
    symmetry: {
      declared: boolean;
      kind: "symmetric" | "none" | "unknown";
      lowerComponentsDerivedBySymmetry: boolean;
    };
    chartRef: "comoving_cartesian" | string;
    unitsRef: "J/m^3" | string;
    regionMaskRef: string | null;
    aggregationMode: "mean" | "integral" | "unknown";
    normalizationBasis: "sample_count" | "volume" | "unknown";
    sampleCount: number | null;
    sourceSupport: {
      supportKernelId: string | null;
      cycleAverageStatus: "pass" | "review" | "fail" | "unknown";
      dutyCycleStatus: "pass" | "review" | "fail" | "unknown";
      lightCrossingConsistencyStatus: "pass" | "review" | "fail" | "unknown";
    };
    provenance: {
      producerModule: string | null;
      producerFunction: string | null;
      derivationMode:
        | "source_model_direct_full_tensor"
        | "source_model_reconstituted_full_tensor"
        | "diagonal_proxy"
        | "metric_echo"
        | "unknown";
      inputRefs: string[];
      preAggregationValueRefs: string[];
      notDerivedFromMetricRequiredTensor: boolean;
    };
    blockers: string[];
  }>;
  promotionAllowed: false;
  physicalMechanismClaimAllowed: false;
  validationClaimAllowed: false;
  literatureRefs: string[];
  reasonCodes: string[];
};

export type BuildNhm2TileEffectiveFullTensorSourceArtifactInput = Omit<
  Nhm2TileEffectiveFullTensorSourceArtifact,
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
  return (
    record != null &&
    Object.entries(record).every(
      ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
    )
  );
};

const isLowerStatus = (value: unknown): value is "pass" | "review" | "fail" | "unknown" =>
  value === "pass" || value === "review" || value === "fail" || value === "unknown";

const isRegionStatus = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isAuthority = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "metric_echo_forbidden" ||
  value === "unknown";

const isAggregation = (value: unknown): value is "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" || value === "unknown";

const isNormalization = (value: unknown): value is "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" || value === "unknown";

const isDerivationMode = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["provenance"]["derivationMode"] =>
  value === "source_model_direct_full_tensor" ||
  value === "source_model_reconstituted_full_tensor" ||
  value === "diagonal_proxy" ||
  value === "metric_echo" ||
  value === "unknown";

const isSourceModelClass = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact["sourceModel"]["sourceModelClass"] =>
  value === "cycle_averaged_tile_model" ||
  value === "renormalized_qft_declared" ||
  value === "reconstituted_from_source_channels" ||
  value === "diagonal_proxy" ||
  value === "metric_echo_forbidden" ||
  value === "unknown";

export const fullTensorSourceHasFullAuthority = (
  tensor: Nhm2RegionalTensor,
  authority: Nhm2TileEffectiveFullTensorSourceAuthorityMode,
): boolean => {
  if (authority === "full_tensor") {
    return NHM2_TENSOR_COMPONENTS.every((component) => tensor[component] != null);
  }
  if (authority === "symmetric_full_tensor") {
    return (["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"] as const)
      .every((component) => tensor[component] != null);
  }
  return false;
};

export const deriveFullTensorSourceRegionBlockers = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number],
): string[] => {
  const blockers = new Set(region.blockers);
  if (region.provenance.derivationMode === "metric_echo") {
    blockers.add("metric_echo_not_source_tensor");
  }
  if (!region.provenance.notDerivedFromMetricRequiredTensor) {
    blockers.add("metric_required_derivation_not_allowed");
  }
  if (region.tensorAuthorityMode === "proxy") blockers.add("proxy_tensor_authority");
  if (region.tensorAuthorityMode === "diagonal_reduced_order") {
    blockers.add("full_tensor_authority_missing");
  }
  if (region.tensorAuthorityMode === "metric_echo_forbidden") {
    blockers.add("metric_echo_not_source_tensor");
  }
  if (!fullTensorSourceHasFullAuthority(region.tensor, region.tensorAuthorityMode)) {
    blockers.add("full_tensor_components_missing");
  }
  if (region.regionMaskRef == null) blockers.add("region_mask_ref_missing");
  if (region.aggregationMode === "unknown") blockers.add("aggregation_mode_unknown");
  if (region.normalizationBasis === "unknown") blockers.add("normalization_basis_unknown");
  if (region.sampleCount == null) blockers.add("sample_count_missing");
  return Array.from(blockers);
};

export const buildNhm2TileEffectiveFullTensorSourceArtifact = (
  input: BuildNhm2TileEffectiveFullTensorSourceArtifactInput,
): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const profileMatch = input.selectedProfileId === input.expectedProfileId;
  const present = new Set(input.regions.map((region) => region.regionId));
  const reasonCodes = new Set<string>();
  if (!profileMatch) reasonCodes.add("profile_mismatch");
  if (!input.sourceModel.sourceSideOnly) reasonCodes.add("source_model_not_source_side_only");
  if (!input.sourceModel.notDerivedFromMetricRequiredTensor) {
    reasonCodes.add("metric_required_derivation_not_allowed");
  }
  if (input.sourceModel.metricRequiredInputRefs.length > 0) {
    reasonCodes.add("metric_required_input_refs_present");
  }
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!present.has(regionId)) reasonCodes.add(`missing_required_region:${regionId}`);
  }
  const regions = input.regions.map((region) => {
    const blockers = deriveFullTensorSourceRegionBlockers(region);
    const status: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["status"] =
      region.status === "missing"
        ? "missing"
        : blockers.some((blocker) =>
            blocker === "metric_echo_not_source_tensor" ||
            blocker === "metric_required_derivation_not_allowed" ||
            blocker === "proxy_tensor_authority"
          )
          ? "fail"
          : blockers.length > 0
            ? "review"
            : region.status;
    for (const blocker of blockers) reasonCodes.add(`${region.regionId}:${blocker}`);
    return { ...region, status, blockers };
  });
  const allRegionsPresent = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every(
    (regionId) => present.has(regionId),
  );
  const hasFail =
    !profileMatch ||
    !allRegionsPresent ||
    !input.sourceModel.sourceSideOnly ||
    !input.sourceModel.notDerivedFromMetricRequiredTensor ||
    input.sourceModel.metricRequiredInputRefs.length > 0 ||
    regions.some((region) => region.status === "fail" || region.status === "missing");
  const hasReview = regions.some((region) => region.status === "review");
  const overallState = hasFail ? "fail" : hasReview ? "review" : "pass";
  return {
    artifactId: NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_ARTIFACT_ID,
    schemaVersion: NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_SCHEMA_VERSION,
    ...input,
    profileMatch,
    overallState,
    claimEffect:
      overallState === "pass" ? "source_tensor_candidate" : overallState === "review" ? "diagnostic_only" : "blocked",
    regions,
    promotionAllowed: false,
    physicalMechanismClaimAllowed: false,
    validationClaimAllowed: false,
    reasonCodes: Array.from(reasonCodes),
  };
};

const isSourceSupport = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["sourceSupport"] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isNullableText(record.supportKernelId) &&
    isLowerStatus(record.cycleAverageStatus) &&
    isLowerStatus(record.dutyCycleStatus) &&
    isLowerStatus(record.lightCrossingConsistencyStatus)
  );
};

const isRegion = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] => {
  const record = isRecord(value) ? value : null;
  const symmetry = isRecord(record?.symmetry) ? record?.symmetry : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isRegionStatus(record.status) &&
    isAuthority(record.tensorAuthorityMode) &&
    isTensor(record.tensor) &&
    symmetry != null &&
    typeof symmetry.declared === "boolean" &&
    (symmetry.kind === "symmetric" || symmetry.kind === "none" || symmetry.kind === "unknown") &&
    typeof symmetry.lowerComponentsDerivedBySymmetry === "boolean" &&
    isText(record.chartRef) &&
    isText(record.unitsRef) &&
    isNullableText(record.regionMaskRef) &&
    isAggregation(record.aggregationMode) &&
    isNormalization(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount) &&
    isSourceSupport(record.sourceSupport) &&
    provenance != null &&
    isNullableText(provenance.producerModule) &&
    isNullableText(provenance.producerFunction) &&
    isDerivationMode(provenance.derivationMode) &&
    Array.isArray(provenance.inputRefs) &&
    provenance.inputRefs.every(isText) &&
    Array.isArray(provenance.preAggregationValueRefs) &&
    provenance.preAggregationValueRefs.every(isText) &&
    typeof provenance.notDerivedFromMetricRequiredTensor === "boolean" &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2TileEffectiveFullTensorSourceArtifact = (
  value: unknown,
): value is Nhm2TileEffectiveFullTensorSourceArtifact => {
  const record = isRecord(value) ? value : null;
  const sourceModel = isRecord(record?.sourceModel) ? record?.sourceModel : null;
  if (
    record == null ||
    record.artifactId !== NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_ARTIFACT_ID ||
    record.schemaVersion !== NHM2_TILE_EFFECTIVE_FULL_TENSOR_SOURCE_SCHEMA_VERSION ||
    !isText(record.generatedAt) ||
    !isText(record.runId) ||
    !isText(record.selectedProfileId) ||
    !isText(record.expectedProfileId) ||
    record.profileMatch !== (record.selectedProfileId === record.expectedProfileId) ||
    record.laneId !== "nhm2_shift_lapse" ||
    (record.overallState !== "pass" &&
      record.overallState !== "review" &&
      record.overallState !== "fail" &&
      record.overallState !== "missing") ||
    (record.claimEffect !== "diagnostic_only" &&
      record.claimEffect !== "source_tensor_candidate" &&
      record.claimEffect !== "blocked") ||
    sourceModel == null ||
    !isText(sourceModel.sourceModelId) ||
    !isText(sourceModel.sourceModelVersion) ||
    !isSourceModelClass(sourceModel.sourceModelClass) ||
    typeof sourceModel.sourceSideOnly !== "boolean" ||
    typeof sourceModel.notDerivedFromMetricRequiredTensor !== "boolean" ||
    !Array.isArray(sourceModel.metricRequiredInputRefs) ||
    !sourceModel.metricRequiredInputRefs.every(isText) ||
    !Array.isArray(sourceModel.sourceInputRefs) ||
    !sourceModel.sourceInputRefs.every(isText) ||
    !isNullableText(sourceModel.qeiDossierRef) ||
    !isNullableText(sourceModel.conservationRef) ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isRegion) ||
    record.promotionAllowed !== false ||
    record.physicalMechanismClaimAllowed !== false ||
    record.validationClaimAllowed !== false ||
    !Array.isArray(record.literatureRefs) ||
    !record.literatureRefs.every(isText) ||
    !Array.isArray(record.reasonCodes) ||
    !record.reasonCodes.every(isText)
  ) {
    return false;
  }
  if (record.overallState === "pass") {
    if (!sourceModel.sourceSideOnly) return false;
    if (!sourceModel.notDerivedFromMetricRequiredTensor) return false;
    if (sourceModel.metricRequiredInputRefs.length > 0) return false;
    const present = new Set(record.regions.map((region) => region.regionId));
    if (!NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) => present.has(regionId))) {
      return false;
    }
    return record.regions.every((region) =>
      region.status === "pass" &&
      fullTensorSourceHasFullAuthority(region.tensor, region.tensorAuthorityMode) &&
      region.provenance.derivationMode !== "metric_echo" &&
      region.provenance.notDerivedFromMetricRequiredTensor === true &&
      region.regionMaskRef != null &&
      region.aggregationMode !== "unknown" &&
      region.normalizationBasis !== "unknown" &&
      region.sampleCount != null,
    );
  }
  return true;
};
