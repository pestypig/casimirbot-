import type { CasimirMaterialReceiptV1 } from "./casimir-material-receipt.v1";
import type { Nhm2RegionalMaterialSourceTensorModelV1 } from "./nhm2-regional-material-source-tensor-model.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import type { Nhm2RegionalSourceTensorCandidateArtifactV1 } from "./nhm2-regional-source-tensor-candidate.v1";
import type {
  Nhm2RegionalSourceTensorTargetRegionV1,
  Nhm2RegionalSourceTensorTargetsArtifactV1,
} from "./nhm2-regional-source-tensor-targets.v1";

export const NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_CONTROL_CONTRACT_VERSION =
  "nhm2_regional_source_tensor_quality_control/v1";

export const NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_STATUS = [
  "pass",
  "review",
  "fail",
  "missing",
  "blocked",
] as const;

export type Nhm2RegionalSourceTensorQualityStatus =
  (typeof NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_STATUS)[number];

export type Nhm2RegionalSourceTensorQualityRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  currentSourceT00_SI: number | null;
  targetT00_SI: number | null;
  candidateT00_SI: number | null;
  materialModelT00_SI: number | null;
  requiredMultiplier: number | null;
  currentRelativeResidual: number | null;
  candidateRelativeErrorToTarget: number | null;
  materialModelRelativeErrorToTarget: number | null;
  toleranceRelLInf: number | null;
  directionalTarget: "increase_source_magnitude" | "decrease_source_magnitude" | "preserve_alignment" | "missing";
  directionalImprovement: boolean | null;
  candidateKind: string | null;
  candidateTensorAuthorityMode: string | null;
  materialTensorAuthorityMode: string | null;
  materialReceiptStatus: string | null;
  independentSourceEvidence: boolean;
  fullTensorAvailable: boolean;
  materialReceipted: boolean;
  residualWithinTolerance: boolean | null;
  status: Nhm2RegionalSourceTensorQualityStatus;
  sourceEligibilityBlockers: string[];
  numericalBlockers: string[];
  blockers: string[];
  warnings: string[];
};

export type Nhm2RegionalSourceTensorQualityControlArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_CONTROL_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  artifactRefs: {
    regionalSourceTensorTargets: string;
    regionalSourceTensorCandidate: string;
    regionalMaterialSourceTensorModel: string | null;
    materialReceipt: string | null;
  };
  regions: Nhm2RegionalSourceTensorQualityRegionV1[];
  summary: {
    candidateScalarAligned: boolean;
    candidateIsTargetFit: boolean;
    materialModelAvailable: boolean;
    allRegionsIndependentMaterialTensor: boolean;
    allRegionsFullTensor: boolean;
    allRegionsMaterialReceipted: boolean;
    allSourceEligibilityBlockersClear: boolean;
    allDirectionalTargetsImproved: boolean;
    allMaterialT00WithinTolerance: boolean;
    sourceModelEligibleForHarness: boolean;
    regionalNumericalClosurePass: boolean;
    firstNumericalBlocker: string;
    firstBlocker: string;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    targetFitCandidateIsNotSourceEvidence: true;
    qualityControlDoesNotValidatePhysicalSource: true;
    requiresDownstreamHarness: true;
    physicalClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2RegionalSourceTensorQualityControlInput = {
  generatedAt?: string | null;
  artifactRefs: {
    regionalSourceTensorTargets: string;
    regionalSourceTensorCandidate: string;
    regionalMaterialSourceTensorModel?: string | null;
    materialReceipt?: string | null;
  };
  targets: Nhm2RegionalSourceTensorTargetsArtifactV1;
  candidate: Nhm2RegionalSourceTensorCandidateArtifactV1;
  regionalMaterialSourceTensorModel?: Nhm2RegionalMaterialSourceTensorModelV1 | null;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
};

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const safeRelativeError = (value: number | null, target: number | null): number | null => {
  if (value == null || target == null || target === 0) return null;
  return Math.abs(value - target) / Math.abs(target);
};

const abs = (value: number | null): number | null =>
  value == null ? null : Math.abs(value);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

const isFullTensorAuthority = (value: string | null | undefined): boolean =>
  value === "full_tensor" || value === "symmetric_full_tensor";

const targetFor = (
  targets: Nhm2RegionalSourceTensorTargetsArtifactV1,
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2RegionalSourceTensorTargetRegionV1 | null =>
  targets.regions.find((region) => region.regionId === regionId) ?? null;

const directionalTarget = (
  target: Nhm2RegionalSourceTensorTargetRegionV1 | null,
): Nhm2RegionalSourceTensorQualityRegionV1["directionalTarget"] => {
  if (target == null) return "missing";
  if (target.tuningDirection === "increase_magnitude") return "increase_source_magnitude";
  if (target.tuningDirection === "decrease_magnitude") return "decrease_source_magnitude";
  if (target.tuningDirection === "hold") return "preserve_alignment";
  return "missing";
};

const directionalImprovement = (args: {
  target: Nhm2RegionalSourceTensorQualityRegionV1["directionalTarget"];
  currentSourceT00: number | null;
  materialModelT00: number | null;
  currentRelativeResidual: number | null;
  materialRelativeError: number | null;
}): boolean | null => {
  if (args.materialModelT00 == null || args.currentSourceT00 == null) return null;
  if (args.target === "increase_source_magnitude") {
    const material = abs(args.materialModelT00);
    const current = abs(args.currentSourceT00);
    return material == null || current == null ? null : material > current;
  }
  if (args.target === "decrease_source_magnitude") {
    const material = abs(args.materialModelT00);
    const current = abs(args.currentSourceT00);
    return material == null || current == null ? null : material < current;
  }
  if (args.target === "preserve_alignment") {
    return args.currentRelativeResidual == null || args.materialRelativeError == null
      ? null
      : args.materialRelativeError <= Math.max(args.currentRelativeResidual, 0.1);
  }
  return null;
};

const qualityRegion = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  target: Nhm2RegionalSourceTensorTargetRegionV1 | null;
  candidate: Nhm2RegionalSourceTensorCandidateArtifactV1["regions"][number] | null;
  model: Nhm2RegionalMaterialSourceTensorModelV1["regions"][number] | null;
  materialReceipt: CasimirMaterialReceiptV1 | null | undefined;
}): Nhm2RegionalSourceTensorQualityRegionV1 => {
  const currentSourceT00 = finite(args.target?.currentSourceT00_SI);
  const targetT00 = finite(args.target?.targetSourceT00_SI);
  const candidateT00 = finite(args.candidate?.proposedT00_SI);
  const materialModelT00 = finite(args.model?.tensor.T00);
  const requiredMultiplier = finite(args.target?.requiredOverCurrentSource);
  const currentRelativeResidual = finite(args.target?.currentRelativeResidual);
  const tolerance = finite(args.target?.toleranceRelLInf);
  const candidateRelativeError = safeRelativeError(candidateT00, targetT00);
  const materialRelativeError = safeRelativeError(materialModelT00, targetT00);
  const direction = directionalTarget(args.target);
  const directionImproved = directionalImprovement({
    target: direction,
    currentSourceT00,
    materialModelT00,
    currentRelativeResidual,
    materialRelativeError,
  });
  const candidateIsTargetFit =
    args.candidate?.candidateKind === "target_fit_T00_only" ||
    args.candidate?.provenance.notDerivedFromMetricRequiredTensor === false;
  const materialTensorAuthorityMode = args.model?.tensorAuthorityMode ?? null;
  const fullTensorAvailable = isFullTensorAuthority(materialTensorAuthorityMode);
  const materialReceiptStatus =
    args.model?.materialReceiptStatus ?? args.materialReceipt?.status ?? null;
  const materialReceipted =
    materialReceiptStatus === "material_receipted" &&
    args.materialReceipt?.status !== "ideal_scalar_only" &&
    args.materialReceipt?.status !== "blocked";
  const independentSourceEvidence =
    args.model?.notDerivedFromMetricRequiredTensor === true &&
    args.model.status !== "proxy" &&
    args.model.status !== "missing" &&
    args.model.status !== "blocked";
  const residualWithinTolerance =
    materialRelativeError == null || tolerance == null
      ? null
      : materialRelativeError <= tolerance;
  const sourceEligibilityBlockers = unique([
    args.target == null ? "regional_source_tensor_target_missing" : null,
    args.candidate == null ? "regional_source_tensor_candidate_missing" : null,
    args.model == null ? "regional_material_source_tensor_model_missing" : null,
    args.model != null && !independentSourceEvidence
      ? "material_model_not_independent_source_evidence"
      : null,
    args.model != null && !fullTensorAvailable
      ? "material_model_full_tensor_authority_missing"
      : null,
    args.model != null && args.model.missingComponentIds.length > 0
      ? "material_model_tensor_components_missing"
      : null,
    args.model != null && !materialReceipted ? "material_receipt_not_material_receipted" : null,
    ...(args.model?.blockers ?? []).map((blocker) => `material_model:${blocker}`),
  ]);
  const numericalBlockers = unique([
    materialModelT00 == null ? "material_model_T00_missing" : null,
    directionImproved === false ? "material_model_wrong_direction" : null,
    residualWithinTolerance === false ? "material_model_T00_outside_target_tolerance" : null,
  ]);
  const blockers = unique([...sourceEligibilityBlockers, ...numericalBlockers]);
  const status: Nhm2RegionalSourceTensorQualityStatus =
    args.target == null || args.candidate == null || args.model == null
      ? "missing"
      : args.model.status === "blocked" ||
          !independentSourceEvidence ||
          !fullTensorAvailable ||
          !materialReceipted
        ? "blocked"
        : residualWithinTolerance === false
          ? "fail"
          : residualWithinTolerance === null
            ? "review"
          : "pass";
  return {
    regionId: args.regionId,
    currentSourceT00_SI: currentSourceT00,
    targetT00_SI: targetT00,
    candidateT00_SI: candidateT00,
    materialModelT00_SI: materialModelT00,
    requiredMultiplier,
    currentRelativeResidual,
    candidateRelativeErrorToTarget: candidateRelativeError,
    materialModelRelativeErrorToTarget: materialRelativeError,
    toleranceRelLInf: tolerance,
    directionalTarget: direction,
    directionalImprovement: directionImproved,
    candidateKind: args.candidate?.candidateKind ?? null,
    candidateTensorAuthorityMode: args.candidate?.tensorAuthorityMode ?? null,
    materialTensorAuthorityMode,
    materialReceiptStatus,
    independentSourceEvidence,
    fullTensorAvailable,
    materialReceipted,
    residualWithinTolerance,
    status,
    sourceEligibilityBlockers,
    numericalBlockers,
    blockers,
    warnings: unique([
      candidateIsTargetFit
        ? "candidate_T00_is_target_fit_quality_reference_only"
        : null,
      "quality_control_must_be_followed_by_source_authority_residual_conservation_qei_observer_harness",
    ]),
  };
};

const firstBlocker = (regions: Nhm2RegionalSourceTensorQualityRegionV1[]): string => {
  const blocked = regions.find((region) => region.status !== "pass");
  if (blocked == null) return "none";
  return `${blocked.regionId}:${blocked.blockers[0] ?? "quality_control_non_pass"}`;
};

const firstNumericalBlocker = (
  regions: Nhm2RegionalSourceTensorQualityRegionV1[],
): string => {
  const blocked = regions.find((region) => region.numericalBlockers.length > 0);
  if (blocked == null) return "none";
  return `${blocked.regionId}:${blocked.numericalBlockers[0]}`;
};

export const buildNhm2RegionalSourceTensorQualityControl = (
  input: BuildNhm2RegionalSourceTensorQualityControlInput,
): Nhm2RegionalSourceTensorQualityControlArtifactV1 => {
  const modelByRegion = new Map(
    (input.regionalMaterialSourceTensorModel?.regions ?? []).map((region) => [
      region.regionId,
      region,
    ]),
  );
  const candidateByRegion = new Map(
    input.candidate.regions.map((region) => [region.regionId, region]),
  );
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    qualityRegion({
      regionId,
      target: targetFor(input.targets, regionId),
      candidate: candidateByRegion.get(regionId) ?? null,
      model: modelByRegion.get(regionId) ?? null,
      materialReceipt: input.materialReceipt,
    }),
  );
  const blockerCount = regions.reduce((sum, region) => sum + region.blockers.length, 0);
  const allRegionsIndependentMaterialTensor = regions.every(
    (region) => region.independentSourceEvidence,
  );
  const allRegionsFullTensor = regions.every((region) => region.fullTensorAvailable);
  const allRegionsMaterialReceipted = regions.every((region) => region.materialReceipted);
  const allSourceEligibilityBlockersClear = regions.every(
    (region) => region.sourceEligibilityBlockers.length === 0,
  );
  const allDirectionalTargetsImproved = regions.every(
    (region) => region.directionalImprovement === true,
  );
  const allMaterialT00WithinTolerance = regions.every(
    (region) => region.residualWithinTolerance === true,
  );
  const sourceModelEligibleForHarness =
    allRegionsIndependentMaterialTensor &&
    allRegionsFullTensor &&
    allRegionsMaterialReceipted &&
    allSourceEligibilityBlockersClear;
  return {
    contractVersion: NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_CONTROL_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.targets.laneId,
    selectedProfileId: input.targets.selectedProfileId,
    runId: input.targets.runId,
    artifactRefs: {
      regionalSourceTensorTargets: input.artifactRefs.regionalSourceTensorTargets,
      regionalSourceTensorCandidate: input.artifactRefs.regionalSourceTensorCandidate,
      regionalMaterialSourceTensorModel:
        input.artifactRefs.regionalMaterialSourceTensorModel ?? null,
      materialReceipt: input.artifactRefs.materialReceipt ?? null,
    },
    regions,
    summary: {
      candidateScalarAligned: input.candidate.summary.allRegionsScalarAligned,
      candidateIsTargetFit: input.candidate.regions.some(
        (region) =>
          region.candidateKind === "target_fit_T00_only" ||
          region.provenance.notDerivedFromMetricRequiredTensor === false,
      ),
      materialModelAvailable: input.regionalMaterialSourceTensorModel != null,
      allRegionsIndependentMaterialTensor,
      allRegionsFullTensor,
      allRegionsMaterialReceipted,
      allSourceEligibilityBlockersClear,
      allDirectionalTargetsImproved,
      allMaterialT00WithinTolerance,
      sourceModelEligibleForHarness,
      regionalNumericalClosurePass:
        sourceModelEligibleForHarness && allMaterialT00WithinTolerance,
      firstNumericalBlocker: firstNumericalBlocker(regions),
      firstBlocker: firstBlocker(regions),
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      targetFitCandidateIsNotSourceEvidence: true,
      qualityControlDoesNotValidatePhysicalSource: true,
      requiresDownstreamHarness: true,
      physicalClaimAllowed: false,
      transportClaimAllowed: false,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isStatus = (value: unknown): value is Nhm2RegionalSourceTensorQualityStatus =>
  NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_STATUS.includes(
    value as Nhm2RegionalSourceTensorQualityStatus,
  );

const isRegion = (
  value: unknown,
): value is Nhm2RegionalSourceTensorQualityRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isNullableNumber(record.currentSourceT00_SI) &&
    isNullableNumber(record.targetT00_SI) &&
    isNullableNumber(record.candidateT00_SI) &&
    isNullableNumber(record.materialModelT00_SI) &&
    isNullableNumber(record.requiredMultiplier) &&
    isNullableNumber(record.currentRelativeResidual) &&
    isNullableNumber(record.candidateRelativeErrorToTarget) &&
    isNullableNumber(record.materialModelRelativeErrorToTarget) &&
    isNullableNumber(record.toleranceRelLInf) &&
    (record.directionalTarget === "increase_source_magnitude" ||
      record.directionalTarget === "decrease_source_magnitude" ||
      record.directionalTarget === "preserve_alignment" ||
      record.directionalTarget === "missing") &&
    (record.directionalImprovement === null ||
      typeof record.directionalImprovement === "boolean") &&
    isNullableText(record.candidateKind) &&
    isNullableText(record.candidateTensorAuthorityMode) &&
    isNullableText(record.materialTensorAuthorityMode) &&
    isNullableText(record.materialReceiptStatus) &&
    typeof record.independentSourceEvidence === "boolean" &&
    typeof record.fullTensorAvailable === "boolean" &&
    typeof record.materialReceipted === "boolean" &&
    (record.residualWithinTolerance === null ||
      typeof record.residualWithinTolerance === "boolean") &&
    isStatus(record.status) &&
    isStringArray(record.sourceEligibilityBlockers) &&
    isStringArray(record.numericalBlockers) &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2RegionalSourceTensorQualityControlArtifact = (
  value: unknown,
): value is Nhm2RegionalSourceTensorQualityControlArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const refs = isRecord(record?.artifactRefs) ? record?.artifactRefs : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const boundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  if (
    record == null ||
    record.contractVersion !==
      NHM2_REGIONAL_SOURCE_TENSOR_QUALITY_CONTROL_CONTRACT_VERSION ||
    !isText(record.generatedAt) ||
    record.laneId !== "nhm2_shift_lapse" ||
    !isText(record.selectedProfileId) ||
    !isText(record.runId) ||
    refs == null ||
    !isText(refs.regionalSourceTensorTargets) ||
    !isText(refs.regionalSourceTensorCandidate) ||
    !isNullableText(refs.regionalMaterialSourceTensorModel) ||
    !isNullableText(refs.materialReceipt) ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isRegion) ||
    summary == null ||
    typeof summary.candidateScalarAligned !== "boolean" ||
    typeof summary.candidateIsTargetFit !== "boolean" ||
    typeof summary.materialModelAvailable !== "boolean" ||
    typeof summary.allRegionsIndependentMaterialTensor !== "boolean" ||
    typeof summary.allRegionsFullTensor !== "boolean" ||
    typeof summary.allRegionsMaterialReceipted !== "boolean" ||
    typeof summary.allSourceEligibilityBlockersClear !== "boolean" ||
    typeof summary.allDirectionalTargetsImproved !== "boolean" ||
    typeof summary.allMaterialT00WithinTolerance !== "boolean" ||
    typeof summary.sourceModelEligibleForHarness !== "boolean" ||
    typeof summary.regionalNumericalClosurePass !== "boolean" ||
    !isText(summary.firstNumericalBlocker) ||
    !isText(summary.firstBlocker) ||
    typeof summary.blockerCount !== "number" ||
    !Number.isFinite(summary.blockerCount) ||
    boundary?.diagnosticOnly !== true ||
    boundary?.targetFitCandidateIsNotSourceEvidence !== true ||
    boundary?.qualityControlDoesNotValidatePhysicalSource !== true ||
    boundary?.requiresDownstreamHarness !== true ||
    boundary?.physicalClaimAllowed !== false ||
    boundary?.transportClaimAllowed !== false
  ) {
    return false;
  }
  const regions = record.regions as Nhm2RegionalSourceTensorQualityRegionV1[];
  const ids = new Set(regions.map((region) => region.regionId));
  if (ids.size !== NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length) return false;
  return NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) =>
    ids.has(regionId),
  );
};
