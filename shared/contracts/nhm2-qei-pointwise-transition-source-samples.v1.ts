import type { Nhm2QeiWorldlineSamplePlanRegionId } from "./nhm2-qei-worldline-sample-plan.v1";
import type { Nhm2RegionalSourceClosureRegionId } from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_QEI_POINTWISE_TRANSITION_SOURCE_SAMPLES_CONTRACT_VERSION =
  "nhm2_qei_pointwise_transition_source_samples/v1";

export const NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_MODELS = [
  "transition_kernel_support_weighted_source_tensor",
  "explicit_pointwise_source_tensor",
  "missing",
] as const;

export const NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_STATUSES = [
  "computed",
  "proxy",
  "missing",
] as const;

export type Nhm2QeiPointwiseTransitionSampleRegionId = Extract<
  Nhm2QeiWorldlineSamplePlanRegionId,
  "hull_wall_transition" | "wall_exterior_transition"
>;
export type Nhm2QeiPointwiseTransitionSampleModel =
  (typeof NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_MODELS)[number];
export type Nhm2QeiPointwiseTransitionSampleStatus =
  (typeof NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_STATUSES)[number];

export type Nhm2QeiPointwiseTransitionSourceSampleV1 = {
  worldlineId: string;
  regionId: Nhm2QeiPointwiseTransitionSampleRegionId;
  valueSI: number | null;
  unit: "J/m^3";
  provenanceRef?: string;
  sourceTensorRef: string | null;
  supportFunctionRef: string | null;
  sampleLocationsRef: string | null;
  samplingModel: Nhm2QeiPointwiseTransitionSampleModel;
  transitionKernelRef: string | null;
  transitionInterfaceId: string | null;
  leftRegionId: Nhm2RegionalSourceClosureRegionId | null;
  rightRegionId: Nhm2RegionalSourceClosureRegionId | null;
  leftT00_SI: number | null;
  rightT00_SI: number | null;
  blendWeight: number | null;
  status: Nhm2QeiPointwiseTransitionSampleStatus;
  blockers: string[];
  warnings: string[];
};

export type Nhm2QeiPointwiseTransitionSourceSamplesV1 = {
  contractVersion: typeof NHM2_QEI_POINTWISE_TRANSITION_SOURCE_SAMPLES_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  atlasRef: string;
  atlasHash: string;
  tensorRef: string;
  samplePlanRef: string;
  transitionKernelRef: string;
  samples: Nhm2QeiPointwiseTransitionSourceSampleV1[];
  summary: {
    hasHullWallTransitionSample: boolean;
    hasWallExteriorTransitionSample: boolean;
    allTransitionSamplesComputed: boolean;
    anyProxy: boolean;
    samplingComplete: boolean;
  };
  status: "pass" | "review" | "fail" | "missing";
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    pointwiseSamplesDoNotProveQeiPass: true;
    transitionKernelBlendIsReducedOrder: true;
    notMaterialReceipt: true;
  };
};

export type BuildNhm2QeiPointwiseTransitionSourceSamplesInput = Omit<
  Nhm2QeiPointwiseTransitionSourceSamplesV1,
  "contractVersion" | "summary" | "status" | "blockers" | "claimBoundary"
> & {
  blockers?: string[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isFiniteOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isRegionId = (
  value: unknown,
): value is Nhm2QeiPointwiseTransitionSampleRegionId =>
  value === "hull_wall_transition" || value === "wall_exterior_transition";

const isClosureRegionId = (
  value: unknown,
): value is Nhm2RegionalSourceClosureRegionId =>
  value === "global" ||
  value === "hull" ||
  value === "wall" ||
  value === "exterior_shell";

const isSamplingModel = (
  value: unknown,
): value is Nhm2QeiPointwiseTransitionSampleModel =>
  NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_MODELS.includes(
    value as Nhm2QeiPointwiseTransitionSampleModel,
  );

const isSampleStatus = (
  value: unknown,
): value is Nhm2QeiPointwiseTransitionSampleStatus =>
  NHM2_QEI_POINTWISE_TRANSITION_SAMPLE_STATUSES.includes(
    value as Nhm2QeiPointwiseTransitionSampleStatus,
  );

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.filter((value): value is string => isText(value))));

const sampleBlockers = (
  sample: Nhm2QeiPointwiseTransitionSourceSampleV1,
): string[] =>
  uniqueStrings([
    ...sample.blockers,
    sample.status === "missing" ? "pointwise_transition_source_tensor_missing" : null,
    sample.status === "proxy" ? "pointwise_transition_source_tensor_proxy" : null,
    sample.valueSI == null ? "transition_sample_value_missing" : null,
    sample.provenanceRef == null ? "transition_sample_provenance_missing" : null,
    sample.sourceTensorRef == null ? "source_tensor_ref_missing" : null,
    sample.supportFunctionRef == null ? "support_function_ref_missing" : null,
    sample.sampleLocationsRef == null ? "sample_locations_ref_missing" : null,
    sample.transitionKernelRef == null ? "transition_kernel_ref_missing" : null,
    sample.transitionInterfaceId == null ? "transition_interface_ref_missing" : null,
    sample.leftRegionId == null ? "left_region_missing" : null,
    sample.rightRegionId == null ? "right_region_missing" : null,
    sample.leftT00_SI == null ? "left_t00_missing" : null,
    sample.rightT00_SI == null ? "right_t00_missing" : null,
    sample.blendWeight == null ? "blend_weight_missing" : null,
  ]);

export const buildNhm2QeiPointwiseTransitionSourceSamples = (
  input: BuildNhm2QeiPointwiseTransitionSourceSamplesInput,
): Nhm2QeiPointwiseTransitionSourceSamplesV1 => {
  const samples = input.samples.map((sample) => ({
    ...sample,
    blendWeight:
      typeof sample.blendWeight === "number"
        ? Math.min(1, Math.max(0, sample.blendWeight))
        : sample.blendWeight,
    blockers: sampleBlockers(sample),
    warnings: uniqueStrings(sample.warnings),
  }));
  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    ...samples.flatMap((sample) =>
      sample.blockers.map((blocker) => `${sample.worldlineId}:${blocker}`),
    ),
  ]);
  const hasHullWallTransitionSample = samples.some(
    (sample) => sample.regionId === "hull_wall_transition" && sample.status === "computed",
  );
  const hasWallExteriorTransitionSample = samples.some(
    (sample) =>
      sample.regionId === "wall_exterior_transition" && sample.status === "computed",
  );
  const allTransitionSamplesComputed =
    samples.length >= 2 &&
    samples.every(
      (sample) =>
        sample.status === "computed" &&
        sample.valueSI != null &&
        sample.blockers.length === 0,
    );
  const anyProxy = samples.some((sample) => sample.status === "proxy");
  const samplingComplete =
    hasHullWallTransitionSample &&
    hasWallExteriorTransitionSample &&
    allTransitionSamplesComputed &&
    !anyProxy &&
    blockers.length === 0;
  const status =
    samples.length === 0
      ? "missing"
      : anyProxy
        ? "fail"
        : samplingComplete
          ? "pass"
          : "review";
  return {
    contractVersion: NHM2_QEI_POINTWISE_TRANSITION_SOURCE_SAMPLES_CONTRACT_VERSION,
    ...input,
    samples,
    summary: {
      hasHullWallTransitionSample,
      hasWallExteriorTransitionSample,
      allTransitionSamplesComputed,
      anyProxy,
      samplingComplete,
    },
    status,
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      pointwiseSamplesDoNotProveQeiPass: true,
      transitionKernelBlendIsReducedOrder: true,
      notMaterialReceipt: true,
    },
  };
};

const isSample = (
  value: unknown,
): value is Nhm2QeiPointwiseTransitionSourceSampleV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.worldlineId) &&
    isRegionId(record.regionId) &&
    isFiniteOrNull(record.valueSI) &&
    record.unit === "J/m^3" &&
    (record.provenanceRef === undefined || isText(record.provenanceRef)) &&
    isNullableText(record.sourceTensorRef) &&
    isNullableText(record.supportFunctionRef) &&
    isNullableText(record.sampleLocationsRef) &&
    isSamplingModel(record.samplingModel) &&
    isNullableText(record.transitionKernelRef) &&
    isNullableText(record.transitionInterfaceId) &&
    (record.leftRegionId === null || isClosureRegionId(record.leftRegionId)) &&
    (record.rightRegionId === null || isClosureRegionId(record.rightRegionId)) &&
    isFiniteOrNull(record.leftT00_SI) &&
    isFiniteOrNull(record.rightT00_SI) &&
    isFiniteOrNull(record.blendWeight) &&
    isSampleStatus(record.status) &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2QeiPointwiseTransitionSourceSamples = (
  value: unknown,
): value is Nhm2QeiPointwiseTransitionSourceSamplesV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_QEI_POINTWISE_TRANSITION_SOURCE_SAMPLES_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.atlasRef) &&
    isText(record.atlasHash) &&
    isText(record.tensorRef) &&
    isText(record.samplePlanRef) &&
    isText(record.transitionKernelRef) &&
    Array.isArray(record.samples) &&
    record.samples.every(isSample) &&
    summary != null &&
    typeof summary.hasHullWallTransitionSample === "boolean" &&
    typeof summary.hasWallExteriorTransitionSample === "boolean" &&
    typeof summary.allTransitionSamplesComputed === "boolean" &&
    typeof summary.anyProxy === "boolean" &&
    typeof summary.samplingComplete === "boolean" &&
    (record.status === "pass" ||
      record.status === "review" ||
      record.status === "fail" ||
      record.status === "missing") &&
    isStringArray(record.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.pointwiseSamplesDoNotProveQeiPass === true &&
    claimBoundary?.transitionKernelBlendIsReducedOrder === true &&
    claimBoundary?.notMaterialReceipt === true
  );
};
