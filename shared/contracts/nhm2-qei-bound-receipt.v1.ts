import type {
  Nhm2QeiWorldlineConsistencyStatus,
  Nhm2QeiWorldlineRegionId,
  Nhm2QeiWorldlineSamplingFunctionKind,
} from "./nhm2-qei-worldline-dossier.v1";

export const NHM2_QEI_BOUND_RECEIPT_CONTRACT_VERSION =
  "nhm2_qei_bound_receipt/v1";

export const NHM2_QEI_BOUND_MODEL_KINDS = [
  "ford_roman_lorentzian",
  "fewster_thompson_stationary",
  "declared_reduced_order",
  "missing",
] as const;

export const NHM2_QEI_BOUND_RECEIPT_BOUND_STATUSES = [
  "computed",
  "literature_bound",
  "declared_reduced_order",
  "proxy",
  "missing",
] as const;

export const NHM2_QEI_BOUND_RECEIPT_STATUSES = [
  "pass",
  "review",
  "fail",
  "missing",
] as const;

export type Nhm2QeiBoundModelKind =
  (typeof NHM2_QEI_BOUND_MODEL_KINDS)[number];
export type Nhm2QeiBoundReceiptBoundStatus =
  (typeof NHM2_QEI_BOUND_RECEIPT_BOUND_STATUSES)[number];
export type Nhm2QeiBoundReceiptStatus =
  (typeof NHM2_QEI_BOUND_RECEIPT_STATUSES)[number];

export type Nhm2QeiBoundReceiptV1 = {
  contractVersion: typeof NHM2_QEI_BOUND_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  atlasRef: string;
  atlasHash: string;
  tensorRef: string;
  boundModelKind: Nhm2QeiBoundModelKind;
  samplingFunction: {
    kind: Nhm2QeiWorldlineSamplingFunctionKind;
    tauSeconds: number | null;
    normalized: boolean;
  };
  bound: {
    valueSI: number | null;
    unit: "J/m^3" | null;
    provenanceRef?: string;
    status: Nhm2QeiBoundReceiptBoundStatus;
  };
  tauPolicy: {
    tauVsDuty: Nhm2QeiWorldlineConsistencyStatus;
    tauVsLightCrossing: Nhm2QeiWorldlineConsistencyStatus;
    tauVsModulation: Nhm2QeiWorldlineConsistencyStatus;
    dutyCycle: number | null;
    lightCrossingSeconds: number | null;
    modulationSeconds: number | null;
  };
  applicability: {
    appliesToRegions: Nhm2QeiWorldlineRegionId[];
    stationaryWorldlineAssumption: boolean;
    reducedOrderOnly: boolean;
    qftStateSpecified: boolean;
    renormalizationConventionSpecified: boolean;
  };
  status: Nhm2QeiBoundReceiptStatus;
  blockers: string[];
  warnings: string[];
  claimBoundary: {
    diagnosticOnly: true;
    qeiBoundReceiptDoesNotProvePhysicalViability: true;
    scalarMarginCannotSubstituteForWorldlineDossier: true;
  };
};

export type BuildNhm2QeiBoundReceiptInput = Omit<
  Nhm2QeiBoundReceiptV1,
  "contractVersion" | "status" | "blockers" | "warnings" | "claimBoundary"
> & {
  blockers?: string[] | null;
  warnings?: string[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => isText(value))),
  );

const receiptStatus = (
  input: BuildNhm2QeiBoundReceiptInput,
  blockers: string[],
): Nhm2QeiBoundReceiptStatus => {
  if (
    input.boundModelKind === "missing" ||
    input.bound.valueSI == null ||
    input.samplingFunction.tauSeconds == null
  ) {
    return "missing";
  }
  if (
    input.bound.status === "proxy" ||
    input.tauPolicy.tauVsDuty === "fail" ||
    input.tauPolicy.tauVsLightCrossing === "fail" ||
    input.tauPolicy.tauVsModulation === "fail"
  ) {
    return "fail";
  }
  if (
    blockers.length > 0 ||
    input.boundModelKind === "declared_reduced_order" ||
    input.bound.status === "declared_reduced_order" ||
    input.applicability.reducedOrderOnly
  ) {
    return "review";
  }
  return "pass";
};

export const buildNhm2QeiBoundReceipt = (
  input: BuildNhm2QeiBoundReceiptInput,
): Nhm2QeiBoundReceiptV1 => {
  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    input.samplingFunction.tauSeconds == null ? "sampling_tau_missing" : null,
    input.samplingFunction.normalized ? null : "sampling_function_not_normalized",
    input.bound.valueSI == null ? "qei_bound_missing" : null,
    input.bound.provenanceRef == null ? "qei_bound_provenance_missing" : null,
    input.bound.status === "proxy" ? "qei_bound_proxy" : null,
    input.tauPolicy.tauVsDuty !== "pass"
      ? `tau_vs_duty_${input.tauPolicy.tauVsDuty}`
      : null,
    input.tauPolicy.tauVsLightCrossing !== "pass"
      ? `tau_vs_light_crossing_${input.tauPolicy.tauVsLightCrossing}`
      : null,
    input.tauPolicy.tauVsModulation !== "pass"
      ? `tau_vs_modulation_${input.tauPolicy.tauVsModulation}`
      : null,
    input.applicability.qftStateSpecified ? null : "qei_qft_state_missing",
    input.applicability.renormalizationConventionSpecified
      ? null
      : "qei_renormalization_convention_missing",
  ]);
  const warnings = uniqueStrings([
    ...(input.warnings ?? []),
    input.boundModelKind === "declared_reduced_order"
      ? "qei_bound_declared_reduced_order_only"
      : null,
    input.applicability.reducedOrderOnly
      ? "qei_receipt_reduced_order_only"
      : null,
  ]);
  return {
    contractVersion: NHM2_QEI_BOUND_RECEIPT_CONTRACT_VERSION,
    ...input,
    status: receiptStatus(input, blockers),
    blockers,
    warnings,
    claimBoundary: {
      diagnosticOnly: true,
      qeiBoundReceiptDoesNotProvePhysicalViability: true,
      scalarMarginCannotSubstituteForWorldlineDossier: true,
    },
  };
};

const isSamplingKind = (
  value: unknown,
): value is Nhm2QeiWorldlineSamplingFunctionKind =>
  value === "lorentzian" ||
  value === "gaussian" ||
  value === "compact_support" ||
  value === "unknown";

const isConsistency = (
  value: unknown,
): value is Nhm2QeiWorldlineConsistencyStatus =>
  value === "pass" || value === "fail" || value === "missing";

const isRegionId = (value: unknown): value is Nhm2QeiWorldlineRegionId =>
  value === "hull" ||
  value === "wall" ||
  value === "exterior_shell" ||
  value === "hull_wall_transition" ||
  value === "wall_exterior_transition" ||
  value === "centerline" ||
  value === "custom";

export const isNhm2QeiBoundReceipt = (
  value: unknown,
): value is Nhm2QeiBoundReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const sampling = isRecord(record?.samplingFunction)
    ? record?.samplingFunction
    : null;
  const bound = isRecord(record?.bound) ? record?.bound : null;
  const tauPolicy = isRecord(record?.tauPolicy) ? record?.tauPolicy : null;
  const applicability = isRecord(record?.applicability)
    ? record?.applicability
    : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_QEI_BOUND_RECEIPT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    isText(record.laneId) &&
    isText(record.selectedProfileId) &&
    isText(record.atlasRef) &&
    isText(record.atlasHash) &&
    isText(record.tensorRef) &&
    NHM2_QEI_BOUND_MODEL_KINDS.includes(
      record.boundModelKind as Nhm2QeiBoundModelKind,
    ) &&
    sampling != null &&
    isSamplingKind(sampling.kind) &&
    isFiniteOrNull(sampling.tauSeconds) &&
    typeof sampling.normalized === "boolean" &&
    bound != null &&
    isFiniteOrNull(bound.valueSI) &&
    (bound.unit === "J/m^3" || bound.unit === null) &&
    (bound.provenanceRef === undefined || isText(bound.provenanceRef)) &&
    NHM2_QEI_BOUND_RECEIPT_BOUND_STATUSES.includes(
      bound.status as Nhm2QeiBoundReceiptBoundStatus,
    ) &&
    tauPolicy != null &&
    isConsistency(tauPolicy.tauVsDuty) &&
    isConsistency(tauPolicy.tauVsLightCrossing) &&
    isConsistency(tauPolicy.tauVsModulation) &&
    isFiniteOrNull(tauPolicy.dutyCycle) &&
    isFiniteOrNull(tauPolicy.lightCrossingSeconds) &&
    isFiniteOrNull(tauPolicy.modulationSeconds) &&
    applicability != null &&
    Array.isArray(applicability.appliesToRegions) &&
    applicability.appliesToRegions.every(isRegionId) &&
    typeof applicability.stationaryWorldlineAssumption === "boolean" &&
    typeof applicability.reducedOrderOnly === "boolean" &&
    typeof applicability.qftStateSpecified === "boolean" &&
    typeof applicability.renormalizationConventionSpecified === "boolean" &&
    NHM2_QEI_BOUND_RECEIPT_STATUSES.includes(
      record.status as Nhm2QeiBoundReceiptStatus,
    ) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    Array.isArray(record.warnings) &&
    record.warnings.every(isText) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.qeiBoundReceiptDoesNotProvePhysicalViability === true &&
    claimBoundary?.scalarMarginCannotSubstituteForWorldlineDossier === true
  );
};
