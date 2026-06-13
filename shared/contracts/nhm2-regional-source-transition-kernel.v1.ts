import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_REGIONAL_SOURCE_TRANSITION_KERNEL_CONTRACT_VERSION =
  "nhm2_regional_source_transition_kernel/v1";

export type Nhm2RegionalSourceTransitionKernelKind =
  | "cosine_blend"
  | "declared_transition_average"
  | "not_available";

export type Nhm2RegionalSourceTransitionInterfaceId =
  | "global_hull"
  | "global_wall"
  | "global_exterior_shell"
  | "hull_wall"
  | "wall_exterior_shell";

export type Nhm2RegionalSourceTransitionInterfaceV1 = {
  interfaceId: Nhm2RegionalSourceTransitionInterfaceId;
  leftRegionId: Nhm2RegionalSourceClosureRegionId;
  rightRegionId: Nhm2RegionalSourceClosureRegionId;
  kernelKind: Nhm2RegionalSourceTransitionKernelKind;
  smoothingWeight: number;
  blendWidthMeters: number | null;
  rawJumpLInf: number | null;
  postKernelJumpLInf: number | null;
  targetToleranceLInf: number;
  dominantComponentId: Nhm2TensorComponent | null;
  hotspotRef: string | null;
  status: "pass" | "review" | "fail" | "missing";
  blockers: string[];
  warnings: string[];
};

export type Nhm2RegionalSourceTransitionKernelV1 = {
  contractVersion: typeof NHM2_REGIONAL_SOURCE_TRANSITION_KERNEL_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  chartId: "comoving_cartesian" | string;
  unitsRef: "dimensionless_normalized_tensor_jump" | string;
  sourceTensorRef: string;
  targetToleranceLInf: number;
  maxAllowedSmoothingWeight: number;
  interfaces: Nhm2RegionalSourceTransitionInterfaceV1[];
  summary: {
    maxRawJumpLInf: number | null;
    maxPostKernelJumpLInf: number | null;
    requiredSmoothingWeightMax: number | null;
    allInterfacesWithinTolerance: boolean;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    transitionKernelDoesNotProveLocalCovariantConservation: true;
    doesNotAlterRegionalClosureResiduals: true;
    metricEchoForbidden: true;
  };
};

export type BuildNhm2RegionalSourceTransitionKernelInput = Omit<
  Nhm2RegionalSourceTransitionKernelV1,
  "contractVersion" | "summary" | "claimBoundary"
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

const isInterfaceId = (
  value: unknown,
): value is Nhm2RegionalSourceTransitionInterfaceId =>
  value === "global_hull" ||
  value === "global_wall" ||
  value === "global_exterior_shell" ||
  value === "hull_wall" ||
  value === "wall_exterior_shell";

const isKernelKind = (
  value: unknown,
): value is Nhm2RegionalSourceTransitionKernelKind =>
  value === "cosine_blend" ||
  value === "declared_transition_average" ||
  value === "not_available";

const isTensorComponent = (value: unknown): value is Nhm2TensorComponent | null =>
  value === null || NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const isStatus = (
  value: unknown,
): value is Nhm2RegionalSourceTransitionInterfaceV1["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const deriveInterface = (
  entry: Nhm2RegionalSourceTransitionInterfaceV1,
): Nhm2RegionalSourceTransitionInterfaceV1 => {
  const blockers = new Set(entry.blockers);
  const smoothingWeight = clamp01(entry.smoothingWeight);
  if (entry.rawJumpLInf == null) blockers.add("raw_transition_jump_missing");
  if (entry.postKernelJumpLInf == null) blockers.add("post_transition_jump_missing");
  if (entry.kernelKind === "not_available") blockers.add("transition_kernel_missing");
  if (
    entry.postKernelJumpLInf != null &&
    entry.postKernelJumpLInf > entry.targetToleranceLInf
  ) {
    blockers.add("transition_residual_exceeded");
  }
  return {
    ...entry,
    smoothingWeight,
    status:
      entry.status === "missing"
        ? "missing"
        : blockers.has("transition_residual_exceeded")
          ? "fail"
          : blockers.size > 0
            ? "review"
            : "pass",
    blockers: Array.from(blockers),
  };
};

const maxFinite = (values: Array<number | null>): number | null => {
  const finiteValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finiteValues.length > 0 ? Math.max(...finiteValues) : null;
};

export const buildNhm2RegionalSourceTransitionKernel = (
  input: BuildNhm2RegionalSourceTransitionKernelInput,
): Nhm2RegionalSourceTransitionKernelV1 => {
  const interfaces = input.interfaces.map(deriveInterface);
  const blockerCount = interfaces.reduce(
    (sum, entry) => sum + entry.blockers.length,
    0,
  );
  const maxRawJumpLInf = maxFinite(interfaces.map((entry) => entry.rawJumpLInf));
  const maxPostKernelJumpLInf = maxFinite(
    interfaces.map((entry) => entry.postKernelJumpLInf),
  );
  const requiredSmoothingWeightMax = maxFinite(
    interfaces.map((entry) =>
      entry.rawJumpLInf == null || entry.rawJumpLInf <= input.targetToleranceLInf
        ? 0
        : 1 - input.targetToleranceLInf / entry.rawJumpLInf,
    ),
  );
  return {
    contractVersion: NHM2_REGIONAL_SOURCE_TRANSITION_KERNEL_CONTRACT_VERSION,
    ...input,
    maxAllowedSmoothingWeight: clamp01(input.maxAllowedSmoothingWeight),
    interfaces,
    summary: {
      maxRawJumpLInf,
      maxPostKernelJumpLInf,
      requiredSmoothingWeightMax,
      allInterfacesWithinTolerance:
        blockerCount === 0 &&
        interfaces.every((entry) => entry.postKernelJumpLInf != null) &&
        (maxPostKernelJumpLInf ?? Number.POSITIVE_INFINITY) <= input.targetToleranceLInf,
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      transitionKernelDoesNotProveLocalCovariantConservation: true,
      doesNotAlterRegionalClosureResiduals: true,
      metricEchoForbidden: true,
    },
  };
};

const isInterface = (
  value: unknown,
): value is Nhm2RegionalSourceTransitionInterfaceV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isInterfaceId(record.interfaceId) &&
    isRegionId(record.leftRegionId) &&
    isRegionId(record.rightRegionId) &&
    isKernelKind(record.kernelKind) &&
    typeof record.smoothingWeight === "number" &&
    Number.isFinite(record.smoothingWeight) &&
    isNullableNumber(record.blendWidthMeters) &&
    isNullableNumber(record.rawJumpLInf) &&
    isNullableNumber(record.postKernelJumpLInf) &&
    typeof record.targetToleranceLInf === "number" &&
    Number.isFinite(record.targetToleranceLInf) &&
    isTensorComponent(record.dominantComponentId) &&
    isNullableText(record.hotspotRef) &&
    isStatus(record.status) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    Array.isArray(record.warnings) &&
    record.warnings.every(isText)
  );
};

export const isNhm2RegionalSourceTransitionKernel = (
  value: unknown,
): value is Nhm2RegionalSourceTransitionKernelV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_REGIONAL_SOURCE_TRANSITION_KERNEL_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    isText(record.unitsRef) &&
    isText(record.sourceTensorRef) &&
    typeof record.targetToleranceLInf === "number" &&
    Number.isFinite(record.targetToleranceLInf) &&
    typeof record.maxAllowedSmoothingWeight === "number" &&
    Number.isFinite(record.maxAllowedSmoothingWeight) &&
    Array.isArray(record.interfaces) &&
    record.interfaces.every(isInterface) &&
    summary != null &&
    isNullableNumber(summary.maxRawJumpLInf) &&
    isNullableNumber(summary.maxPostKernelJumpLInf) &&
    isNullableNumber(summary.requiredSmoothingWeightMax) &&
    typeof summary.allInterfacesWithinTolerance === "boolean" &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.transitionKernelDoesNotProveLocalCovariantConservation === true &&
    claimBoundary?.doesNotAlterRegionalClosureResiduals === true &&
    claimBoundary?.metricEchoForbidden === true
  );
};
