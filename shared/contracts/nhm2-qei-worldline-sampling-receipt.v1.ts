import {
  NHM2_QEI_WORLDLINE_REGION_IDS,
  type Nhm2QeiWorldlineRegionId,
  type Nhm2QeiWorldlineValueStatus,
} from "./nhm2-qei-worldline-dossier.v1";

export const NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_CONTRACT_VERSION =
  "nhm2_qei_worldline_sampling_receipt/v1";

export const NHM2_QEI_WORLDLINE_SAMPLE_METHODS = [
  "atlas_region_source_tensor",
  "explicit_transition_source_tensor",
  "explicit_source_tensor_sample",
  "missing",
] as const;

export const NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_STATUSES = [
  "pass",
  "review",
  "fail",
  "missing",
] as const;

export type Nhm2QeiWorldlineSampleMethod =
  (typeof NHM2_QEI_WORLDLINE_SAMPLE_METHODS)[number];
export type Nhm2QeiWorldlineSamplingReceiptStatus =
  (typeof NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_STATUSES)[number];

export type Nhm2QeiWorldlineSampleV1 = {
  worldlineId: string;
  regionId: Nhm2QeiWorldlineRegionId;
  chartId: string;
  supportFunctionRef: string | null;
  sampleLocationsRef: string | null;
  sampleMethod: Nhm2QeiWorldlineSampleMethod;
  sampledRho: {
    valueSI: number | null;
    provenanceRef?: string;
    status: Nhm2QeiWorldlineValueStatus;
  };
  sourceTensorRef: string | null;
  blockers: string[];
  warnings: string[];
};

export type Nhm2QeiWorldlineSamplingReceiptV1 = {
  contractVersion: typeof NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  atlasRef: string;
  atlasHash: string;
  tensorRef: string;
  worldlineSamples: Nhm2QeiWorldlineSampleV1[];
  summary: {
    hasWallSample: boolean;
    hasTransitionSamples: boolean;
    allSamplesComputed: boolean;
    anyProxy: boolean;
    samplingComplete: boolean;
  };
  status: Nhm2QeiWorldlineSamplingReceiptStatus;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    samplingReceiptDoesNotProveQeiPass: true;
    transitionSamplesMustNotUseAdjacentRegionAverages: true;
  };
};

export type BuildNhm2QeiWorldlineSamplingReceiptInput = Omit<
  Nhm2QeiWorldlineSamplingReceiptV1,
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

const isRegionId = (value: unknown): value is Nhm2QeiWorldlineRegionId =>
  NHM2_QEI_WORLDLINE_REGION_IDS.includes(value as Nhm2QeiWorldlineRegionId);

const isValueStatus = (value: unknown): value is Nhm2QeiWorldlineValueStatus =>
  value === "computed" || value === "proxy" || value === "missing";

const isSampleMethod = (value: unknown): value is Nhm2QeiWorldlineSampleMethod =>
  NHM2_QEI_WORLDLINE_SAMPLE_METHODS.includes(value as Nhm2QeiWorldlineSampleMethod);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.filter((value): value is string => isText(value))));

const sampleBlockers = (sample: Nhm2QeiWorldlineSampleV1): string[] =>
  uniqueStrings([
    ...sample.blockers,
    sample.sampledRho.status === "missing" ? "sampled_rho_missing" : null,
    sample.sampledRho.status === "proxy" ? "sampled_rho_proxy" : null,
    sample.sampledRho.valueSI == null ? "sampled_rho_value_missing" : null,
    sample.sampledRho.provenanceRef == null ? "sampled_rho_provenance_missing" : null,
    sample.sampleMethod === "missing" ? "worldline_sample_method_missing" : null,
  ]);

const summarize = (
  samples: Nhm2QeiWorldlineSampleV1[],
  blockers: string[],
): Nhm2QeiWorldlineSamplingReceiptV1["summary"] => {
  const hasWallSample = samples.some(
    (sample) => sample.regionId === "wall" && sample.sampledRho.status === "computed",
  );
  const transitionSamples = samples.filter(
    (sample) =>
      sample.regionId === "hull_wall_transition" ||
      sample.regionId === "wall_exterior_transition",
  );
  const hasTransitionSamples =
    transitionSamples.length >= 2 &&
    transitionSamples.every((sample) => sample.sampledRho.status === "computed");
  const allSamplesComputed =
    samples.length > 0 &&
    samples.every(
      (sample) =>
        sample.sampledRho.status === "computed" &&
        sample.sampledRho.valueSI != null &&
        sample.blockers.length === 0,
    );
  const anyProxy = samples.some((sample) => sample.sampledRho.status === "proxy");
  return {
    hasWallSample,
    hasTransitionSamples,
    allSamplesComputed,
    anyProxy,
    samplingComplete:
      hasWallSample && hasTransitionSamples && allSamplesComputed && !anyProxy && blockers.length === 0,
  };
};

export const buildNhm2QeiWorldlineSamplingReceipt = (
  input: BuildNhm2QeiWorldlineSamplingReceiptInput,
): Nhm2QeiWorldlineSamplingReceiptV1 => {
  const samples = input.worldlineSamples.map((sample) => ({
    ...sample,
    blockers: sampleBlockers(sample),
    warnings: uniqueStrings(sample.warnings),
  }));
  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    ...samples.flatMap((sample) =>
      sample.blockers.map((blocker) => `${sample.worldlineId}:${blocker}`),
    ),
  ]);
  const summary = summarize(samples, blockers);
  const status: Nhm2QeiWorldlineSamplingReceiptStatus =
    samples.length === 0
      ? "missing"
      : samples.some((sample) => sample.sampledRho.status === "proxy")
        ? "fail"
        : summary.samplingComplete
          ? "pass"
          : "review";
  return {
    contractVersion: NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_CONTRACT_VERSION,
    ...input,
    worldlineSamples: samples,
    summary,
    status,
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      samplingReceiptDoesNotProveQeiPass: true,
      transitionSamplesMustNotUseAdjacentRegionAverages: true,
    },
  };
};

const isSample = (value: unknown): value is Nhm2QeiWorldlineSampleV1 => {
  const record = isRecord(value) ? value : null;
  const sampledRho = isRecord(record?.sampledRho) ? record?.sampledRho : null;
  return (
    record != null &&
    isText(record.worldlineId) &&
    isRegionId(record.regionId) &&
    isText(record.chartId) &&
    isNullableText(record.supportFunctionRef) &&
    isNullableText(record.sampleLocationsRef) &&
    isSampleMethod(record.sampleMethod) &&
    sampledRho != null &&
    isFiniteOrNull(sampledRho.valueSI) &&
    (sampledRho.provenanceRef === undefined || isText(sampledRho.provenanceRef)) &&
    isValueStatus(sampledRho.status) &&
    isNullableText(record.sourceTensorRef) &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2QeiWorldlineSamplingReceipt = (
  value: unknown,
): value is Nhm2QeiWorldlineSamplingReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    isText(record.laneId) &&
    isText(record.selectedProfileId) &&
    isText(record.atlasRef) &&
    isText(record.atlasHash) &&
    isText(record.tensorRef) &&
    Array.isArray(record.worldlineSamples) &&
    record.worldlineSamples.every(isSample) &&
    summary != null &&
    typeof summary.hasWallSample === "boolean" &&
    typeof summary.hasTransitionSamples === "boolean" &&
    typeof summary.allSamplesComputed === "boolean" &&
    typeof summary.anyProxy === "boolean" &&
    typeof summary.samplingComplete === "boolean" &&
    NHM2_QEI_WORLDLINE_SAMPLING_RECEIPT_STATUSES.includes(
      record.status as Nhm2QeiWorldlineSamplingReceiptStatus,
    ) &&
    isStringArray(record.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.samplingReceiptDoesNotProveQeiPass === true &&
    claimBoundary?.transitionSamplesMustNotUseAdjacentRegionAverages === true
  );
};
