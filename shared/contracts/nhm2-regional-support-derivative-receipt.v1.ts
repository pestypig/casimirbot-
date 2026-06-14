export const NHM2_REGIONAL_SUPPORT_DERIVATIVE_RECEIPT_CONTRACT_VERSION =
  "nhm2_regional_support_derivative_receipt/v1";

export const NHM2_REQUIRED_SUPPORT_DERIVATIVE_KERNEL_IDS = [
  "kernel:hull_wall:smootherstep_c2",
  "kernel:wall_exterior:smootherstep_c2",
] as const;

export type Nhm2SupportDerivativeComponentAvailabilityV1 = {
  dt: boolean;
  dx: boolean;
  dy: boolean;
  dz: boolean;
};

export type Nhm2RegionalSupportDerivativeKernelReceiptV1 = {
  kernelId: string;
  supportRegion: "hull_wall_transition" | "wall_exterior_transition";
  derivativeTermsAvailable: boolean;
  derivativeRef: string | null;
  partialDerivativeComponents: Nhm2SupportDerivativeComponentAvailabilityV1;
  maxAbsPartialMuW: number | null;
  widthMeters: number | null;
  blockers: string[];
};

export type Nhm2RegionalSupportDerivativeReceiptV1 = {
  contractVersion: typeof NHM2_REGIONAL_SUPPORT_DERIVATIVE_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  chartId: string;
  derivativeBasis: "chart";
  derivativeRef: string | null;
  partialMuWAvailable: boolean;
  covariantDerivativeSupportAvailable: boolean;
  transitionKernels: Nhm2RegionalSupportDerivativeKernelReceiptV1[];
  summary: {
    allRequiredKernelsPresent: boolean;
    derivativeSupportComplete: boolean;
    missingKernelIds: string[];
    blockers: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    derivativeReceiptDoesNotValidatePhysicalSource: true;
    conservationStillRequiresTensorDivergenceAudit: true;
  };
};

export type BuildNhm2RegionalSupportDerivativeReceiptInput = Omit<
  Nhm2RegionalSupportDerivativeReceiptV1,
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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isComponentAvailability = (
  value: unknown,
): value is Nhm2SupportDerivativeComponentAvailabilityV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.dt === "boolean" &&
    typeof record.dx === "boolean" &&
    typeof record.dy === "boolean" &&
    typeof record.dz === "boolean"
  );
};

const allComponentsAvailable = (
  value: Nhm2SupportDerivativeComponentAvailabilityV1,
): boolean => value.dt && value.dx && value.dy && value.dz;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => isText(value))));

const isKernelReceipt = (
  value: unknown,
): value is Nhm2RegionalSupportDerivativeKernelReceiptV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.kernelId) &&
    (record.supportRegion === "hull_wall_transition" ||
      record.supportRegion === "wall_exterior_transition") &&
    typeof record.derivativeTermsAvailable === "boolean" &&
    isNullableText(record.derivativeRef) &&
    isComponentAvailability(record.partialDerivativeComponents) &&
    isNullableNumber(record.maxAbsPartialMuW) &&
    isNullableNumber(record.widthMeters) &&
    isStringArray(record.blockers)
  );
};

export const buildNhm2RegionalSupportDerivativeReceipt = (
  input: BuildNhm2RegionalSupportDerivativeReceiptInput,
): Nhm2RegionalSupportDerivativeReceiptV1 => {
  const kernelById = new Map(
    input.transitionKernels.map((kernel) => [kernel.kernelId, kernel]),
  );
  const missingKernelIds = NHM2_REQUIRED_SUPPORT_DERIVATIVE_KERNEL_IDS.filter(
    (kernelId) => !kernelById.has(kernelId),
  );
  const kernelBlockers = input.transitionKernels.flatMap((kernel) => [
    ...kernel.blockers.map((blocker) => `${kernel.kernelId}:${blocker}`),
    kernel.derivativeTermsAvailable ? null : `${kernel.kernelId}:derivative_terms_missing`,
    allComponentsAvailable(kernel.partialDerivativeComponents)
      ? null
      : `${kernel.kernelId}:partial_derivative_component_missing`,
    kernel.derivativeRef == null ? `${kernel.kernelId}:derivative_ref_missing` : null,
  ]);
  const blockers = uniqueText([
    input.partialMuWAvailable ? null : "partial_mu_W_R_missing",
    input.covariantDerivativeSupportAvailable ? null : "covariant_derivative_support_missing",
    input.derivativeRef == null ? "support_derivative_ref_missing" : null,
    ...missingKernelIds.map((kernelId) => `${kernelId}:required_kernel_missing`),
    ...kernelBlockers,
  ]);
  const derivativeSupportComplete =
    input.partialMuWAvailable &&
    input.covariantDerivativeSupportAvailable &&
    missingKernelIds.length === 0 &&
    blockers.length === 0;

  return {
    contractVersion: NHM2_REGIONAL_SUPPORT_DERIVATIVE_RECEIPT_CONTRACT_VERSION,
    ...input,
    summary: {
      allRequiredKernelsPresent: missingKernelIds.length === 0,
      derivativeSupportComplete,
      missingKernelIds,
      blockers,
    },
    claimBoundary: {
      diagnosticOnly: true,
      derivativeReceiptDoesNotValidatePhysicalSource: true,
      conservationStillRequiresTensorDivergenceAudit: true,
    },
  };
};

export const isNhm2RegionalSupportDerivativeReceipt = (
  value: unknown,
): value is Nhm2RegionalSupportDerivativeReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_REGIONAL_SUPPORT_DERIVATIVE_RECEIPT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    isText(record.runId) &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    record.derivativeBasis === "chart" &&
    isNullableText(record.derivativeRef) &&
    typeof record.partialMuWAvailable === "boolean" &&
    typeof record.covariantDerivativeSupportAvailable === "boolean" &&
    Array.isArray(record.transitionKernels) &&
    record.transitionKernels.every(isKernelReceipt) &&
    summary != null &&
    typeof summary.allRequiredKernelsPresent === "boolean" &&
    typeof summary.derivativeSupportComplete === "boolean" &&
    isStringArray(summary.missingKernelIds) &&
    isStringArray(summary.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.derivativeReceiptDoesNotValidatePhysicalSource === true &&
    claimBoundary?.conservationStillRequiresTensorDivergenceAudit === true
  );
};
