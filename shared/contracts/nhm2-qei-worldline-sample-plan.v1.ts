import type { Nhm2QeiWorldlineRegionId } from "./nhm2-qei-worldline-dossier.v1";

export const NHM2_QEI_WORLDLINE_SAMPLE_PLAN_CONTRACT_VERSION =
  "nhm2_qei_worldline_sample_plan/v1";

export const NHM2_QEI_WORLDLINE_SAMPLE_PLAN_REGION_IDS = [
  "wall",
  "hull_wall_transition",
  "wall_exterior_transition",
] as const;

export const NHM2_QEI_WORLDLINE_SAMPLE_PLAN_METHODS = [
  "atlas_support_source_tensor",
  "transition_kernel_source_tensor",
  "missing_pointwise_tensor",
] as const;

export const NHM2_QEI_WORLDLINE_SAMPLE_PLAN_STATUSES = [
  "pass",
  "review",
  "fail",
  "missing",
] as const;

export type Nhm2QeiWorldlineSamplePlanRegionId =
  (typeof NHM2_QEI_WORLDLINE_SAMPLE_PLAN_REGION_IDS)[number];
export type Nhm2QeiWorldlineSamplePlanMethod =
  (typeof NHM2_QEI_WORLDLINE_SAMPLE_PLAN_METHODS)[number];
export type Nhm2QeiWorldlineSamplePlanStatus =
  (typeof NHM2_QEI_WORLDLINE_SAMPLE_PLAN_STATUSES)[number];

export type Nhm2QeiWorldlineSamplePlanEntryV1 = {
  worldlineId: string;
  regionId: Nhm2QeiWorldlineSamplePlanRegionId;
  supportFunctionRef: string | null;
  sampleLocationsRef: string | null;
  sampleCount: number | null;
  sampleMethod: Nhm2QeiWorldlineSamplePlanMethod;
  sourceTensorRef: string | null;
  transitionKernelRef: string | null;
  transitionInterfaceId: string | null;
  blockers: string[];
  warnings: string[];
};

export type Nhm2QeiWorldlineSamplePlanV1 = {
  contractVersion: typeof NHM2_QEI_WORLDLINE_SAMPLE_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  atlasRef: string;
  atlasHash: string;
  tensorRef: string;
  transitionKernelRef: string;
  transitionKernelAtlasHash: string | null;
  worldlines: Nhm2QeiWorldlineSamplePlanEntryV1[];
  summary: {
    hasWallPlan: boolean;
    hasTransitionPlans: boolean;
    pointwiseTensorRequired: boolean;
    planComplete: boolean;
  };
  status: Nhm2QeiWorldlineSamplePlanStatus;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    samplePlanDoesNotProveQeiPass: true;
    samplePlanDoesNotProvidePointwiseStressTensor: true;
  };
};

export type BuildNhm2QeiWorldlineSamplePlanInput = Omit<
  Nhm2QeiWorldlineSamplePlanV1,
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

const isPlanRegionId = (
  value: unknown,
): value is Nhm2QeiWorldlineSamplePlanRegionId =>
  NHM2_QEI_WORLDLINE_SAMPLE_PLAN_REGION_IDS.includes(
    value as Nhm2QeiWorldlineSamplePlanRegionId,
  );

const isSampleMethod = (
  value: unknown,
): value is Nhm2QeiWorldlineSamplePlanMethod =>
  NHM2_QEI_WORLDLINE_SAMPLE_PLAN_METHODS.includes(
    value as Nhm2QeiWorldlineSamplePlanMethod,
  );

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.filter((value): value is string => isText(value))));

const planEntryBlockers = (
  entry: Nhm2QeiWorldlineSamplePlanEntryV1,
): string[] =>
  uniqueStrings([
    ...entry.blockers,
    entry.supportFunctionRef == null ? "support_function_ref_missing" : null,
    entry.sampleLocationsRef == null ? "sample_locations_ref_missing" : null,
    entry.sampleCount == null ? "sample_count_missing" : null,
    entry.sourceTensorRef == null ? "source_tensor_ref_missing" : null,
    entry.regionId.includes("transition") && entry.transitionKernelRef == null
      ? "transition_kernel_ref_missing"
      : null,
    entry.regionId.includes("transition") && entry.transitionInterfaceId == null
      ? "transition_interface_ref_missing"
      : null,
    entry.sampleMethod === "missing_pointwise_tensor"
      ? "pointwise_transition_source_tensor_missing"
      : null,
  ]);

export const buildNhm2QeiWorldlineSamplePlan = (
  input: BuildNhm2QeiWorldlineSamplePlanInput,
): Nhm2QeiWorldlineSamplePlanV1 => {
  const worldlines = input.worldlines.map((entry) => ({
    ...entry,
    blockers: planEntryBlockers(entry),
    warnings: uniqueStrings(entry.warnings),
  }));
  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    ...worldlines.flatMap((entry) =>
      entry.blockers.map((blocker) => `${entry.worldlineId}:${blocker}`),
    ),
  ]);
  const hasWallPlan = worldlines.some(
    (entry) => entry.regionId === "wall" && entry.blockers.length === 0,
  );
  const transitionPlans = worldlines.filter((entry) =>
    entry.regionId.includes("transition"),
  );
  const hasTransitionPlans =
    transitionPlans.length >= 2 &&
    transitionPlans.every(
      (entry) =>
        entry.supportFunctionRef != null &&
        entry.sampleLocationsRef != null &&
        entry.transitionKernelRef != null &&
        entry.transitionInterfaceId != null,
    );
  const pointwiseTensorRequired = worldlines.some(
    (entry) => entry.sampleMethod === "missing_pointwise_tensor",
  );
  const planComplete =
    worldlines.length > 0 &&
    hasWallPlan &&
    hasTransitionPlans &&
    !pointwiseTensorRequired &&
    blockers.length === 0;
  const status: Nhm2QeiWorldlineSamplePlanStatus =
    worldlines.length === 0
      ? "missing"
      : blockers.some((blocker) => blocker.includes("atlas_hash_mismatch"))
        ? "fail"
        : planComplete
          ? "pass"
          : "review";
  return {
    contractVersion: NHM2_QEI_WORLDLINE_SAMPLE_PLAN_CONTRACT_VERSION,
    ...input,
    worldlines,
    summary: {
      hasWallPlan,
      hasTransitionPlans,
      pointwiseTensorRequired,
      planComplete,
    },
    status,
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      samplePlanDoesNotProveQeiPass: true,
      samplePlanDoesNotProvidePointwiseStressTensor: true,
    },
  };
};

const isEntry = (value: unknown): value is Nhm2QeiWorldlineSamplePlanEntryV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.worldlineId) &&
    isPlanRegionId(record.regionId) &&
    isNullableText(record.supportFunctionRef) &&
    isNullableText(record.sampleLocationsRef) &&
    isFiniteOrNull(record.sampleCount) &&
    isSampleMethod(record.sampleMethod) &&
    isNullableText(record.sourceTensorRef) &&
    isNullableText(record.transitionKernelRef) &&
    isNullableText(record.transitionInterfaceId) &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2QeiWorldlineSamplePlan = (
  value: unknown,
): value is Nhm2QeiWorldlineSamplePlanV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_QEI_WORLDLINE_SAMPLE_PLAN_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.atlasRef) &&
    isText(record.atlasHash) &&
    isText(record.tensorRef) &&
    isText(record.transitionKernelRef) &&
    isNullableText(record.transitionKernelAtlasHash) &&
    Array.isArray(record.worldlines) &&
    record.worldlines.every(isEntry) &&
    summary != null &&
    typeof summary.hasWallPlan === "boolean" &&
    typeof summary.hasTransitionPlans === "boolean" &&
    typeof summary.pointwiseTensorRequired === "boolean" &&
    typeof summary.planComplete === "boolean" &&
    NHM2_QEI_WORLDLINE_SAMPLE_PLAN_STATUSES.includes(
      record.status as Nhm2QeiWorldlineSamplePlanStatus,
    ) &&
    isStringArray(record.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.samplePlanDoesNotProveQeiPass === true &&
    claimBoundary?.samplePlanDoesNotProvidePointwiseStressTensor === true
  );
};

export const isNhm2QeiWorldlineSamplePlanRegionId = (
  value: Nhm2QeiWorldlineRegionId,
): value is Nhm2QeiWorldlineSamplePlanRegionId => isPlanRegionId(value);
