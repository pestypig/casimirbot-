import {
  fullTensorSourceHasRequiredSamplingAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "./nhm2-tile-effective-full-tensor-source.v1";
import {
  isNhm2FrequencyConvergenceEvidence,
  isNhm2SwitchingConservationEvidence,
  type Nhm2FrequencyConvergenceEvidenceV1,
  type Nhm2SwitchingConservationEvidenceV1,
} from "./nhm2-time-dependent-source-campaign.v1";

export const NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT_CONTRACT_VERSION =
  "nhm2_averaged_source_tensor_receipt/v1";

export type Nhm2AveragedSourceTensorReceiptStatus =
  | "pass"
  | "review"
  | "fail"
  | "missing";

export type Nhm2AveragedSourceTensorReceiptV1 = {
  contractVersion: typeof NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  sourceTensorRef: string | null;
  frequencyConvergenceRef: string | null;
  switchingConservationRef: string | null;
  averagingWindowSeconds: number | null;
  cycleAverageSourceFixed: boolean | null;
  sourceModelClass: string | null;
  regionStatuses: Array<{
    regionId: string;
    cycleAverageStatus: string;
    tensorAuthorityMode: string;
    samplingAuthority: boolean;
    blockers: string[];
  }>;
  summary: {
    averagedSourceTensorAvailable: boolean;
    sourceSideOnly: boolean;
    notDerivedFromMetricRequiredTensor: boolean;
    noMetricRequiredInputRefs: boolean;
    fullTensorSamplingAuthority: boolean;
    allRegionsCycleAveragePass: boolean;
    frequencyConvergencePass: boolean;
    switchingConservationPass: boolean;
    firstBlocker: string | null;
    blockerCount: number;
  };
  status: Nhm2AveragedSourceTensorReceiptStatus;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    averagedSourceDoesNotProveDynamicGeometryAgreement: true;
    averagedSourceDoesNotBoundBackreaction: true;
    physicalViabilityClaimAllowed: false;
  };
};

export type BuildNhm2AveragedSourceTensorReceiptInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sourceTensorRef?: string | null;
  sourceTensor?: Nhm2TileEffectiveFullTensorSourceArtifact | null;
  frequencyConvergenceRef?: string | null;
  frequencyConvergence?: Nhm2FrequencyConvergenceEvidenceV1 | null;
  switchingConservationRef?: string | null;
  switchingConservation?: Nhm2SwitchingConservationEvidenceV1 | null;
  averagingWindowSeconds?: number | null;
  cycleAverageSourceFixed?: boolean | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const sourceRegionSamplingAuthority = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number],
): boolean =>
  region.status !== "missing" &&
  region.status !== "fail" &&
  region.provenance.derivationMode !== "metric_echo" &&
  region.provenance.derivationMode !== "unknown" &&
  region.provenance.notDerivedFromMetricRequiredTensor === true &&
  region.regionMaskRef != null &&
  region.aggregationMode !== "unknown" &&
  region.normalizationBasis !== "unknown" &&
  region.sampleCount != null;

export const buildNhm2AveragedSourceTensorReceipt = (
  input: BuildNhm2AveragedSourceTensorReceiptInput,
): Nhm2AveragedSourceTensorReceiptV1 => {
  const sourceTensor = input.sourceTensor ?? null;
  const frequency = input.frequencyConvergence ?? null;
  const switching = input.switchingConservation ?? null;
  const sourceSideOnly = sourceTensor?.sourceModel.sourceSideOnly === true;
  const notDerivedFromMetricRequiredTensor =
    sourceTensor?.sourceModel.notDerivedFromMetricRequiredTensor === true;
  const noMetricRequiredInputRefs =
    (sourceTensor?.sourceModel.metricRequiredInputRefs.length ?? 1) === 0;
  const fullTensorSamplingAuthority =
    sourceTensor != null && fullTensorSourceHasRequiredSamplingAuthority(sourceTensor);
  const regionStatuses =
    sourceTensor?.regions.map((region) => {
      const samplingAuthority = sourceRegionSamplingAuthority(region);
      const blockers = uniqueText([
        region.sourceSupport.cycleAverageStatus === "pass"
          ? null
          : "region_cycle_average_not_pass",
        samplingAuthority ? null : "region_sampling_authority_missing",
        ...region.blockers
          .filter(
            (blocker) =>
              blocker !== "qei_dossier_not_pass" &&
              blocker !== "conservation_unknown" &&
              blocker !== "qei_not_promotion_safe",
          )
          .map((blocker) => `source_region:${blocker}`),
      ]);
      return {
        regionId: region.regionId,
        cycleAverageStatus: region.sourceSupport.cycleAverageStatus,
        tensorAuthorityMode: region.tensorAuthorityMode,
        samplingAuthority,
        blockers,
      };
    }) ?? [];
  const allRegionsCycleAveragePass =
    regionStatuses.length > 0 &&
    regionStatuses.every((region) => region.cycleAverageStatus === "pass");
  const frequencyConvergencePass =
    frequency != null &&
    frequency.fixedCycleAverageSource === true &&
    frequency.convergenceStatus === "pass" &&
    frequency.blockers.length === 0;
  const switchingConservationPass =
    switching != null &&
    switching.conservationStatus === "pass" &&
    switching.blockers.length === 0;
  const blockers = uniqueText([
    sourceTensor == null ? "source_tensor_ref_missing" : null,
    sourceSideOnly ? null : "source_tensor_not_source_side_only",
    notDerivedFromMetricRequiredTensor ? null : "source_tensor_metric_required_derivation",
    noMetricRequiredInputRefs ? null : "source_tensor_metric_required_input_refs_present",
    fullTensorSamplingAuthority ? null : "source_tensor_sampling_authority_missing",
    allRegionsCycleAveragePass ? null : "source_tensor_cycle_average_not_pass",
    input.cycleAverageSourceFixed === true ? null : "cycle_average_source_not_fixed",
    toFinite(input.averagingWindowSeconds) == null
      ? "averaging_window_seconds_missing"
      : null,
    frequencyConvergencePass ? null : "frequency_convergence_not_pass",
    switchingConservationPass ? null : "switching_conservation_not_pass",
    ...regionStatuses.flatMap((region) =>
      region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
    ),
  ]);
  const averagedSourceTensorAvailable = blockers.length === 0;
  return {
    contractVersion: NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId:
      asText(input.selectedProfileId) ??
      sourceTensor?.selectedProfileId ??
      "stage1_centerline_alpha_0p995_v1",
    runId: asText(input.runId) ?? sourceTensor?.runId ?? "unknown",
    chartId: asText(input.chartId) ?? "comoving_cartesian",
    atlasRef: asText(input.atlasRef),
    atlasHash: asText(input.atlasHash),
    sourceTensorRef: asText(input.sourceTensorRef),
    frequencyConvergenceRef: asText(input.frequencyConvergenceRef),
    switchingConservationRef: asText(input.switchingConservationRef),
    averagingWindowSeconds: toFinite(input.averagingWindowSeconds),
    cycleAverageSourceFixed: input.cycleAverageSourceFixed ?? null,
    sourceModelClass: sourceTensor?.sourceModel.sourceModelClass ?? null,
    regionStatuses,
    summary: {
      averagedSourceTensorAvailable,
      sourceSideOnly,
      notDerivedFromMetricRequiredTensor,
      noMetricRequiredInputRefs,
      fullTensorSamplingAuthority,
      allRegionsCycleAveragePass,
      frequencyConvergencePass,
      switchingConservationPass,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    status: averagedSourceTensorAvailable ? "pass" : sourceTensor == null ? "missing" : "review",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      averagedSourceDoesNotProveDynamicGeometryAgreement: true,
      averagedSourceDoesNotBoundBackreaction: true,
      physicalViabilityClaimAllowed: false,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === "boolean";

const isStatus = (value: unknown): value is Nhm2AveragedSourceTensorReceiptStatus =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isRegionStatus = (value: unknown): boolean => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.regionId === "string" &&
    typeof record.cycleAverageStatus === "string" &&
    typeof record.tensorAuthorityMode === "string" &&
    typeof record.samplingAuthority === "boolean" &&
    isStringArray(record.blockers)
  );
};

export const isNhm2AveragedSourceTensorReceipt = (
  value: unknown,
): value is Nhm2AveragedSourceTensorReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_AVERAGED_SOURCE_TENSOR_RECEIPT_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    typeof record.chartId === "string" &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.sourceTensorRef) &&
    isNullableText(record.frequencyConvergenceRef) &&
    isNullableText(record.switchingConservationRef) &&
    isNullableNumber(record.averagingWindowSeconds) &&
    isNullableBoolean(record.cycleAverageSourceFixed) &&
    isNullableText(record.sourceModelClass) &&
    Array.isArray(record.regionStatuses) &&
    record.regionStatuses.every(isRegionStatus) &&
    summary != null &&
    typeof summary.averagedSourceTensorAvailable === "boolean" &&
    typeof summary.sourceSideOnly === "boolean" &&
    typeof summary.notDerivedFromMetricRequiredTensor === "boolean" &&
    typeof summary.noMetricRequiredInputRefs === "boolean" &&
    typeof summary.fullTensorSamplingAuthority === "boolean" &&
    typeof summary.allRegionsCycleAveragePass === "boolean" &&
    typeof summary.frequencyConvergencePass === "boolean" &&
    typeof summary.switchingConservationPass === "boolean" &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    isStatus(record.status) &&
    isStringArray(record.blockers) &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.averagedSourceDoesNotProveDynamicGeometryAgreement === true &&
    claimBoundary.averagedSourceDoesNotBoundBackreaction === true &&
    claimBoundary.physicalViabilityClaimAllowed === false
  );
};

export const parseNhm2AveragedSourceReceiptInputs = (
  sourceTensor: unknown,
  frequencyConvergence: unknown,
  switchingConservation: unknown,
) => ({
  sourceTensor: isNhm2TileEffectiveFullTensorSourceArtifact(sourceTensor)
    ? sourceTensor
    : null,
  frequencyConvergence: isNhm2FrequencyConvergenceEvidence(frequencyConvergence)
    ? frequencyConvergence
    : null,
  switchingConservation: isNhm2SwitchingConservationEvidence(switchingConservation)
    ? switchingConservation
    : null,
});
