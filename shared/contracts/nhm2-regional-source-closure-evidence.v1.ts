export const NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT_ID =
  "nhm2_regional_source_closure_evidence";
export const NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_SCHEMA_VERSION =
  "nhm2_regional_source_closure_evidence/v1";

export const NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
] as const;

export const NHM2_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T10",
  "T11",
  "T12",
  "T13",
  "T20",
  "T21",
  "T22",
  "T23",
  "T30",
  "T31",
  "T32",
  "T33",
] as const;

export type Nhm2RegionalSourceClosureRegionId =
  (typeof NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS)[number];
export type Nhm2TensorComponent = (typeof NHM2_TENSOR_COMPONENTS)[number];
export type Nhm2RegionalTensor = Partial<Record<Nhm2TensorComponent, number | null>>;

export type Nhm2TensorAuthorityMode =
  | "full_tensor"
  | "symmetric_full_tensor"
  | "diagonal_reduced_order"
  | "proxy"
  | "unknown";

export type Nhm2ComparisonBasisStatus =
  | "same_basis"
  | "diagnostic_only"
  | "counterpart_missing"
  | "profile_mismatch"
  | "chart_mismatch"
  | "unit_mismatch"
  | "aggregation_mismatch"
  | "unknown";

export type Nhm2RegionalSourceClosureEvidenceRegion = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "review" | "fail" | "missing";
  comparisonBasisStatus: Nhm2ComparisonBasisStatus;
  metricRequired: {
    tensorRef: string | null;
    tensorAuthorityMode: Nhm2TensorAuthorityMode;
    tensor: Nhm2RegionalTensor;
    chartRef: "comoving_cartesian" | string;
    unitsRef: "J/m^3" | string;
    aggregationMode: "mean" | "integral" | "unknown";
    normalizationBasis: "sample_count" | "volume" | "unknown";
    sampleCount: number | null;
  };
  tileEffectiveCounterpart: {
    tensorRef: string | null;
    tensorAuthorityMode: Nhm2TensorAuthorityMode;
    tensor: Nhm2RegionalTensor;
    chartRef: "comoving_cartesian" | string;
    unitsRef: "J/m^3" | string;
    aggregationMode: "mean" | "integral" | "unknown";
    normalizationBasis: "sample_count" | "volume" | "unknown";
    sampleCount: number | null;
    comparisonRole:
      | "tile_effective_counterpart"
      | "gr_matter_channel_observation"
      | "metric_echo_diagnostic_only"
      | "unknown";
  };
  residuals: {
    componentResiduals: Partial<
      Record<
        Nhm2TensorComponent,
        {
          metricRequired: number | null;
          tileEffectiveCounterpart: number | null;
          absResidual: number | null;
          relResidual: number | null;
        }
      >
    >;
    relLInf: number | null;
    absLInf: number | null;
    toleranceRelLInf: number | null;
    pass: boolean | null;
  };
  blockers: string[];
};

export type Nhm2RegionalSourceClosureEvidenceArtifact = {
  artifactId: typeof NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT_ID;
  schemaVersion: typeof NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  atlasRef?: string | null;
  atlasHash?: string | null;
  overallState: "pass" | "review" | "fail";
  claimEffect:
    | "diagnostic_only"
    | "reduced_order_candidate_blocker_retired"
    | "blocked";
  regions: Nhm2RegionalSourceClosureEvidenceRegion[];
  requiredRegions: Nhm2RegionalSourceClosureRegionId[];
  missingRequiredRegions: Nhm2RegionalSourceClosureRegionId[];
  fullTensorRequiredForPromotion: true;
  diagonalProxyAllowedForPromotion: false;
  literatureRefs: string[];
  reasonCodes: string[];
};

export type BuildNhm2RegionalSourceClosureEvidenceArtifactInput = Omit<
  Nhm2RegionalSourceClosureEvidenceArtifact,
  | "artifactId"
  | "schemaVersion"
  | "profileMatch"
  | "overallState"
  | "claimEffect"
  | "requiredRegions"
  | "missingRequiredRegions"
  | "fullTensorRequiredForPromotion"
  | "diagonalProxyAllowedForPromotion"
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

const isAuthorityMode = (value: unknown): value is Nhm2TensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isBasisStatus = (value: unknown): value is Nhm2ComparisonBasisStatus =>
  value === "same_basis" ||
  value === "diagnostic_only" ||
  value === "counterpart_missing" ||
  value === "profile_mismatch" ||
  value === "chart_mismatch" ||
  value === "unit_mismatch" ||
  value === "aggregation_mismatch" ||
  value === "unknown";

const isRegionStatus = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isAggregationMode = (
  value: unknown,
): value is "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" || value === "unknown";

const isNormalizationBasis = (
  value: unknown,
): value is "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" || value === "unknown";

const isComparisonRole = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"]["comparisonRole"] =>
  value === "tile_effective_counterpart" ||
  value === "gr_matter_channel_observation" ||
  value === "metric_echo_diagnostic_only" ||
  value === "unknown";

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  return Object.entries(record).every(
    ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
  );
};

const isMetricSide = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion["metricRequired"] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isNullableText(record.tensorRef) &&
    isAuthorityMode(record.tensorAuthorityMode) &&
    isTensor(record.tensor) &&
    isText(record.chartRef) &&
    isText(record.unitsRef) &&
    isAggregationMode(record.aggregationMode) &&
    isNormalizationBasis(record.normalizationBasis) &&
    isNullableNumber(record.sampleCount)
  );
};

const isTileSide = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"] => {
  const record = isRecord(value) ? value : null;
  return (
    isMetricSide(value) &&
    record != null &&
    isComparisonRole(record.comparisonRole)
  );
};

const isResiduals = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion["residuals"] => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  const components = isRecord(record.componentResiduals)
    ? record.componentResiduals
    : null;
  return (
    components != null &&
    Object.entries(components).every(([key, entry]) => {
      const component = isRecord(entry) ? entry : null;
      return (
        isTensorComponent(key) &&
        component != null &&
        isNullableNumber(component.metricRequired) &&
        isNullableNumber(component.tileEffectiveCounterpart) &&
        isNullableNumber(component.absResidual) &&
        isNullableNumber(component.relResidual)
      );
    }) &&
    isNullableNumber(record.relLInf) &&
    isNullableNumber(record.absLInf) &&
    isNullableNumber(record.toleranceRelLInf) &&
    (record.pass === null || typeof record.pass === "boolean")
  );
};

const isRegion = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceRegion => {
  const record = isRecord(value) ? value : null;
  if (
    record == null ||
    !isRegionId(record.regionId) ||
    !isRegionStatus(record.status) ||
    !isBasisStatus(record.comparisonBasisStatus) ||
    !isMetricSide(record.metricRequired) ||
    !isTileSide(record.tileEffectiveCounterpart) ||
    !isResiduals(record.residuals) ||
    !Array.isArray(record.blockers) ||
    !record.blockers.every(isText)
  ) {
    return false;
  }
  if (record.comparisonBasisStatus === "same_basis") {
    const metric = record.metricRequired;
    const tile = record.tileEffectiveCounterpart;
    return (
      metric.chartRef === tile.chartRef &&
      metric.unitsRef === tile.unitsRef &&
      metric.aggregationMode === tile.aggregationMode &&
      metric.normalizationBasis === tile.normalizationBasis
    );
  }
  return true;
};

export const deriveNhm2RegionalSourceClosureRegionBlockers = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
  profileMatch: boolean,
): string[] => {
  const blockers = new Set(region.blockers);
  if (!profileMatch) blockers.add("profile_mismatch");
  const metric = region.metricRequired;
  const tile = region.tileEffectiveCounterpart;
  if (metric.chartRef !== tile.chartRef) blockers.add("chart_mismatch");
  if (metric.unitsRef !== tile.unitsRef) blockers.add("unit_mismatch");
  if (
    metric.aggregationMode !== tile.aggregationMode ||
    metric.normalizationBasis !== tile.normalizationBasis
  ) {
    blockers.add("aggregation_mismatch");
  }
  if (
    region.comparisonBasisStatus === "same_basis" &&
    (metric.chartRef !== tile.chartRef ||
      metric.unitsRef !== tile.unitsRef ||
      metric.aggregationMode !== tile.aggregationMode ||
      metric.normalizationBasis !== tile.normalizationBasis ||
      !profileMatch)
  ) {
    blockers.add("same_basis_metadata_mismatch");
  }
  if (
    region.comparisonBasisStatus === "same_basis" &&
    (metric.aggregationMode === "unknown" ||
      tile.aggregationMode === "unknown" ||
      metric.normalizationBasis === "unknown" ||
      tile.normalizationBasis === "unknown" ||
      metric.sampleCount == null ||
      tile.sampleCount == null)
  ) {
    blockers.add("same_basis_metadata_missing");
  }
  if (tile.comparisonRole !== "tile_effective_counterpart") {
    blockers.add(`tile_role_not_counterpart:${tile.comparisonRole}`);
  }
  if (tile.comparisonRole === "metric_echo_diagnostic_only") {
    blockers.add("metric_echo_not_source_closure");
  }
  if (
    metric.tensorAuthorityMode === "proxy" ||
    metric.tensorAuthorityMode === "unknown" ||
    metric.tensorAuthorityMode === "diagonal_reduced_order"
  ) {
    blockers.add("metric_tensor_authority_insufficient");
  }
  if (
    tile.tensorAuthorityMode === "proxy" ||
    tile.tensorAuthorityMode === "unknown" ||
    tile.tensorAuthorityMode === "diagonal_reduced_order"
  ) {
    blockers.add("tile_tensor_authority_insufficient");
  }
  if (
    metric.aggregationMode === "unknown" ||
    metric.normalizationBasis === "unknown"
  ) {
    blockers.add("metric_aggregation_metadata_unknown");
  }
  if (metric.sampleCount == null) blockers.add("metric_sample_count_missing");
  if (
    metric.tensorAuthorityMode === "proxy" ||
    tile.tensorAuthorityMode === "proxy"
  ) {
    blockers.add("proxy_tensor_authority");
  }
  if (
    metric.tensorAuthorityMode === "diagonal_reduced_order" ||
    tile.tensorAuthorityMode === "diagonal_reduced_order"
  ) {
    blockers.add("diagonal_reduced_order_tensor_authority");
  }
  if (region.residuals.pass === false) blockers.add("residual_exceeded");
  if (region.residuals.pass == null) blockers.add("residual_status_unknown");
  return Array.from(blockers);
};

const normalizeRegionStatus = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
  profileMatch: boolean,
): Nhm2RegionalSourceClosureEvidenceRegion["status"] => {
  const blockers = deriveNhm2RegionalSourceClosureRegionBlockers(region, profileMatch);
  if (region.status === "missing") return "missing";
  if (region.status === "fail" || blockers.includes("residual_exceeded")) {
    return "fail";
  }
  return blockers.length > 0 ? "review" : "pass";
};

export const buildNhm2RegionalSourceClosureEvidenceArtifact = (
  input: BuildNhm2RegionalSourceClosureEvidenceArtifactInput,
): Nhm2RegionalSourceClosureEvidenceArtifact => {
  const profileMatch = input.selectedProfileId === input.expectedProfileId;
  const present = new Set(input.regions.map((region) => region.regionId));
  const missingRequiredRegions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.filter(
    (regionId) => !present.has(regionId),
  );
  const regions = input.regions.map((region) => {
    const blockers = deriveNhm2RegionalSourceClosureRegionBlockers(
      region,
      profileMatch,
    );
    return {
      ...region,
      status: normalizeRegionStatus({ ...region, blockers }, profileMatch),
      blockers,
    };
  });
  const reasonCodes = new Set<string>();
  if (!profileMatch) reasonCodes.add("profile_mismatch");
  for (const regionId of missingRequiredRegions) {
    reasonCodes.add(`missing_required_region:${regionId}`);
  }
  for (const region of regions) {
    for (const blocker of region.blockers) {
      reasonCodes.add(`${region.regionId}:${blocker}`);
    }
  }
  const hasFail =
    !profileMatch ||
    regions.some((region) => region.status === "fail") ||
    missingRequiredRegions.length > 0;
  const hasReview = regions.some((region) => region.status === "review");
  const overallState = hasFail ? "fail" : hasReview ? "review" : "pass";
  const claimEffect =
    overallState === "pass"
      ? "reduced_order_candidate_blocker_retired"
      : overallState === "review"
        ? "diagnostic_only"
        : "blocked";

  return {
    artifactId: NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT_ID,
    schemaVersion: NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_SCHEMA_VERSION,
    ...input,
    profileMatch,
    overallState,
    claimEffect,
    regions,
    requiredRegions: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
    missingRequiredRegions,
    fullTensorRequiredForPromotion: true,
    diagonalProxyAllowedForPromotion: false,
    reasonCodes: Array.from(reasonCodes),
  };
};

export const isNhm2RegionalSourceClosureEvidenceArtifact = (
  value: unknown,
): value is Nhm2RegionalSourceClosureEvidenceArtifact => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  if (
    record.artifactId !== NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT_ID ||
    record.schemaVersion !== NHM2_REGIONAL_SOURCE_CLOSURE_EVIDENCE_SCHEMA_VERSION ||
    !isText(record.generatedAt) ||
    !isText(record.runId) ||
    !isText(record.selectedProfileId) ||
    !isText(record.expectedProfileId) ||
    record.profileMatch !== true ||
    record.selectedProfileId !== record.expectedProfileId ||
    record.laneId !== "nhm2_shift_lapse" ||
    !(record.atlasRef === undefined || isNullableText(record.atlasRef)) ||
    !(record.atlasHash === undefined || isNullableText(record.atlasHash)) ||
    (record.overallState !== "pass" &&
      record.overallState !== "review" &&
      record.overallState !== "fail") ||
    (record.claimEffect !== "diagnostic_only" &&
      record.claimEffect !== "reduced_order_candidate_blocker_retired" &&
      record.claimEffect !== "blocked") ||
    record.fullTensorRequiredForPromotion !== true ||
    record.diagonalProxyAllowedForPromotion !== false ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isRegion) ||
    !Array.isArray(record.requiredRegions) ||
    !record.requiredRegions.every(isRegionId) ||
    !Array.isArray(record.missingRequiredRegions) ||
    !record.missingRequiredRegions.every(isRegionId) ||
    !Array.isArray(record.literatureRefs) ||
    !record.literatureRefs.every(isText) ||
    !Array.isArray(record.reasonCodes) ||
    !record.reasonCodes.every(isText)
  ) {
    return false;
  }

  const requiredRegions = record.requiredRegions as Nhm2RegionalSourceClosureRegionId[];
  const missingRequiredRegions =
    record.missingRequiredRegions as Nhm2RegionalSourceClosureRegionId[];
  const regions = record.regions as Nhm2RegionalSourceClosureEvidenceRegion[];
  const required = new Set(requiredRegions);
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    if (!required.has(regionId)) return false;
  }
  const present = new Set(regions.map((region) => region.regionId));
  const missing = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.filter(
    (regionId) => !present.has(regionId),
  );
  if (missing.length !== missingRequiredRegions.length) return false;
  if (!missing.every((regionId) => missingRequiredRegions.includes(regionId))) {
    return false;
  }
  if (record.overallState === "pass") {
    if (missing.length > 0) return false;
    return regions.every(
      (region) =>
        region.status === "pass" &&
        region.comparisonBasisStatus === "same_basis" &&
        region.tileEffectiveCounterpart.comparisonRole ===
          "tile_effective_counterpart" &&
        region.residuals.pass === true &&
        region.metricRequired.tensorAuthorityMode !== "diagonal_reduced_order" &&
        region.tileEffectiveCounterpart.tensorAuthorityMode !==
          "diagonal_reduced_order" &&
        region.metricRequired.tensorAuthorityMode !== "proxy" &&
        region.tileEffectiveCounterpart.tensorAuthorityMode !== "proxy",
    );
  }
  return true;
};
