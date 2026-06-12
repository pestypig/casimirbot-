import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_REGIONAL_SOURCE_TENSOR_TARGETS_CONTRACT_VERSION =
  "nhm2_regional_source_tensor_targets/v1";

export type Nhm2RegionalSourceTensorTuningDirection =
  | "increase_magnitude"
  | "decrease_magnitude"
  | "hold"
  | "missing";

export type Nhm2RegionalSourceTensorTargetRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  requiredT00_SI: number | null;
  currentSourceT00_SI: number | null;
  requiredOverCurrentSource: number | null;
  currentSourceOverRequired: number | null;
  currentRelativeResidual: number | null;
  toleranceRelLInf: number | null;
  targetSourceT00_SI: number | null;
  tuningDirection: Nhm2RegionalSourceTensorTuningDirection;
  scalarT00WithinTolerance: boolean | null;
  tensorAuthorityRequired: true;
  materialReceiptRequired: true;
  blockers: string[];
};

export type Nhm2RegionalSourceTensorTargetsArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_SOURCE_TENSOR_TARGETS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  sourceEvidenceRef: string;
  regions: Nhm2RegionalSourceTensorTargetRegionV1[];
  summary: {
    allScalarT00WithinTolerance: boolean;
    allRegionsHaveTargets: boolean;
    regionalTensorTuningReady: boolean;
    firstBlocker: string;
  };
  claimBoundary: {
    diagnosticOnly: true;
    scalarTargetsDoNotValidateSource: true;
    regionalTensorAuthorityStillRequired: true;
    physicalClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2RegionalSourceTensorTargetsInput = {
  generatedAt?: string | null;
  sourceEvidenceRef: string;
  regionalSourceClosureEvidence: Nhm2RegionalSourceClosureEvidenceArtifact;
};

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const safeDivide = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : numerator / denominator;

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

const scalarWithinTolerance = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
): boolean | null => {
  if (region.residuals.pass != null) return region.residuals.pass;
  const residual = asFiniteNumber(region.residuals.relLInf);
  const tolerance = asFiniteNumber(region.residuals.toleranceRelLInf);
  return residual == null || tolerance == null ? null : residual <= tolerance;
};

const tuningDirection = (args: {
  requiredT00: number | null;
  sourceT00: number | null;
  scalarWithin: boolean | null;
}): Nhm2RegionalSourceTensorTuningDirection => {
  if (args.requiredT00 == null || args.sourceT00 == null || args.sourceT00 === 0) {
    return "missing";
  }
  if (args.scalarWithin === true) return "hold";
  return Math.abs(args.sourceT00) < Math.abs(args.requiredT00)
    ? "increase_magnitude"
    : "decrease_magnitude";
};

const hasAny = (values: string[], patterns: RegExp[]): boolean =>
  values.some((value) => patterns.some((pattern) => pattern.test(value)));

const blockersForRegion = (args: {
  region: Nhm2RegionalSourceClosureEvidenceRegion;
  requiredT00: number | null;
  sourceT00: number | null;
  scalarWithin: boolean | null;
  requiredOverSource: number | null;
}): string[] => {
  const evidenceBlockers = args.region.blockers;
  const blockers: Array<string | null> = [
    args.requiredT00 == null ? "required_T00_missing" : null,
    args.sourceT00 == null ? "current_source_T00_missing" : null,
    args.sourceT00 === 0 ? "current_source_T00_zero" : null,
    args.requiredOverSource == null ? "regional_T00_multiplier_unavailable" : null,
    args.scalarWithin === false ? "scalar_T00_outside_tolerance" : null,
    args.scalarWithin == null ? "scalar_T00_tolerance_status_missing" : null,
    args.region.status !== "pass" ? `regional_evidence_status:${args.region.status}` : null,
    args.region.metricRequired.tensorAuthorityMode !== "full_tensor" &&
    args.region.metricRequired.tensorAuthorityMode !== "symmetric_full_tensor"
      ? "metric_required_tensor_authority_incomplete"
      : null,
    args.region.tileEffectiveCounterpart.tensorAuthorityMode !== "full_tensor" &&
    args.region.tileEffectiveCounterpart.tensorAuthorityMode !== "symmetric_full_tensor"
      ? "source_tensor_authority_incomplete"
      : null,
    args.region.tileEffectiveCounterpart.comparisonRole !== "tile_effective_counterpart"
      ? `source_comparison_role_not_counterpart:${args.region.tileEffectiveCounterpart.comparisonRole}`
      : null,
    args.region.comparisonBasisStatus !== "same_basis"
      ? `comparison_basis_not_same:${args.region.comparisonBasisStatus}`
      : null,
    hasAny(evidenceBlockers, [/metadata|sample_count|normalization|aggregation/i])
      ? "same_basis_metadata_or_aggregation_incomplete"
      : null,
    hasAny(evidenceBlockers, [/counterpart_missing|tile_effective_counterpart_missing/i])
      ? "source_counterpart_missing_or_not_authoritative"
      : null,
    hasAny(evidenceBlockers, [/diagonal|proxy|full_tensor_authority/i])
      ? "regional_tensor_authority_incomplete"
      : null,
    "material_receipt_required_for_source_authority",
    "full_regional_tensor_required_for_source_authority",
    ...evidenceBlockers.map((blocker) => `evidence:${blocker}`),
  ];
  return unique(blockers);
};

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2RegionalSourceTensorTargetRegionV1 => ({
  regionId,
  requiredT00_SI: null,
  currentSourceT00_SI: null,
  requiredOverCurrentSource: null,
  currentSourceOverRequired: null,
  currentRelativeResidual: null,
  toleranceRelLInf: null,
  targetSourceT00_SI: null,
  tuningDirection: "missing",
  scalarT00WithinTolerance: null,
  tensorAuthorityRequired: true,
  materialReceiptRequired: true,
  blockers: [
    "regional_source_closure_evidence_missing",
    "regional_T00_multiplier_unavailable",
    "material_receipt_required_for_source_authority",
    "full_regional_tensor_required_for_source_authority",
  ],
});

const targetRegion = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
): Nhm2RegionalSourceTensorTargetRegionV1 => {
  const requiredT00 = asFiniteNumber(region.metricRequired.tensor.T00);
  const sourceT00 = asFiniteNumber(region.tileEffectiveCounterpart.tensor.T00);
  const requiredOverSource = safeDivide(requiredT00, sourceT00);
  const sourceOverRequired = safeDivide(sourceT00, requiredT00);
  const scalarWithin = scalarWithinTolerance(region);
  return {
    regionId: region.regionId,
    requiredT00_SI: requiredT00,
    currentSourceT00_SI: sourceT00,
    requiredOverCurrentSource: requiredOverSource,
    currentSourceOverRequired: sourceOverRequired,
    currentRelativeResidual: asFiniteNumber(region.residuals.relLInf),
    toleranceRelLInf: asFiniteNumber(region.residuals.toleranceRelLInf),
    targetSourceT00_SI: requiredT00,
    tuningDirection: tuningDirection({
      requiredT00,
      sourceT00,
      scalarWithin,
    }),
    scalarT00WithinTolerance: scalarWithin,
    tensorAuthorityRequired: true,
    materialReceiptRequired: true,
    blockers: blockersForRegion({
      region,
      requiredT00,
      sourceT00,
      scalarWithin,
      requiredOverSource,
    }),
  };
};

const firstBlocker = (regions: Nhm2RegionalSourceTensorTargetRegionV1[]): string => {
  const missing = regions.find((region) => region.requiredOverCurrentSource == null);
  if (missing != null) return `${missing.regionId}:regional_T00_multiplier_unavailable`;
  const scalarFail = regions.find((region) => region.scalarT00WithinTolerance !== true);
  if (scalarFail != null) return `${scalarFail.regionId}:scalar_T00_outside_tolerance`;
  const blocked = regions.find((region) => region.blockers.length > 0);
  if (blocked != null) return `${blocked.regionId}:${blocked.blockers[0]}`;
  return "none";
};

export const buildNhm2RegionalSourceTensorTargets = (
  input: BuildNhm2RegionalSourceTensorTargetsInput,
): Nhm2RegionalSourceTensorTargetsArtifactV1 => {
  const byRegion = new Map(
    input.regionalSourceClosureEvidence.regions.map((region) => [
      region.regionId,
      region,
    ]),
  );
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const region = byRegion.get(regionId);
    return region == null ? missingRegion(regionId) : targetRegion(region);
  });
  const allRegionsHaveTargets = regions.every(
    (region) => region.requiredOverCurrentSource != null && region.targetSourceT00_SI != null,
  );
  const allScalarT00WithinTolerance = regions.every(
    (region) => region.scalarT00WithinTolerance === true,
  );
  return {
    contractVersion: NHM2_REGIONAL_SOURCE_TENSOR_TARGETS_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.regionalSourceClosureEvidence.laneId,
    selectedProfileId: input.regionalSourceClosureEvidence.selectedProfileId,
    runId: input.regionalSourceClosureEvidence.runId,
    sourceEvidenceRef: input.sourceEvidenceRef,
    regions,
    summary: {
      allScalarT00WithinTolerance,
      allRegionsHaveTargets,
      regionalTensorTuningReady: allRegionsHaveTargets,
      firstBlocker: firstBlocker(regions),
    },
    claimBoundary: {
      diagnosticOnly: true,
      scalarTargetsDoNotValidateSource: true,
      regionalTensorAuthorityStillRequired: true,
      physicalClaimAllowed: false,
      transportClaimAllowed: false,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isDirection = (
  value: unknown,
): value is Nhm2RegionalSourceTensorTuningDirection =>
  value === "increase_magnitude" ||
  value === "decrease_magnitude" ||
  value === "hold" ||
  value === "missing";

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isTargetRegion = (
  value: unknown,
): value is Nhm2RegionalSourceTensorTargetRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isNullableNumber(record.requiredT00_SI) &&
    isNullableNumber(record.currentSourceT00_SI) &&
    isNullableNumber(record.requiredOverCurrentSource) &&
    isNullableNumber(record.currentSourceOverRequired) &&
    isNullableNumber(record.currentRelativeResidual) &&
    isNullableNumber(record.toleranceRelLInf) &&
    isNullableNumber(record.targetSourceT00_SI) &&
    isDirection(record.tuningDirection) &&
    (record.scalarT00WithinTolerance === null ||
      typeof record.scalarT00WithinTolerance === "boolean") &&
    record.tensorAuthorityRequired === true &&
    record.materialReceiptRequired === true &&
    isStringArray(record.blockers)
  );
};

export const isNhm2RegionalSourceTensorTargetsArtifact = (
  value: unknown,
): value is Nhm2RegionalSourceTensorTargetsArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const boundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  if (
    record == null ||
    record.contractVersion !== NHM2_REGIONAL_SOURCE_TENSOR_TARGETS_CONTRACT_VERSION ||
    !isText(record.generatedAt) ||
    record.laneId !== "nhm2_shift_lapse" ||
    !isText(record.selectedProfileId) ||
    !isText(record.runId) ||
    !isText(record.sourceEvidenceRef) ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isTargetRegion) ||
    summary == null ||
    typeof summary.allScalarT00WithinTolerance !== "boolean" ||
    typeof summary.allRegionsHaveTargets !== "boolean" ||
    typeof summary.regionalTensorTuningReady !== "boolean" ||
    !isText(summary.firstBlocker) ||
    boundary?.diagnosticOnly !== true ||
    boundary?.scalarTargetsDoNotValidateSource !== true ||
    boundary?.regionalTensorAuthorityStillRequired !== true ||
    boundary?.physicalClaimAllowed !== false ||
    boundary?.transportClaimAllowed !== false
  ) {
    return false;
  }
  const regions = record.regions as Nhm2RegionalSourceTensorTargetRegionV1[];
  const ids = new Set(regions.map((region) => region.regionId));
  if (ids.size !== NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length) return false;
  return NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) =>
    ids.has(regionId),
  );
};
