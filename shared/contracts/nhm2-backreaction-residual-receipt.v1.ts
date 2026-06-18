export const NHM2_BACKREACTION_RESIDUAL_RECEIPT_CONTRACT_VERSION =
  "nhm2_backreaction_residual_receipt/v1";

export const NHM2_BACKREACTION_CHANNEL_STATUS_VALUES = [
  "pass",
  "fail",
  "missing",
] as const;

export type Nhm2BackreactionChannelStatus =
  (typeof NHM2_BACKREACTION_CHANNEL_STATUS_VALUES)[number];

export type Nhm2BackreactionResidualChannelV1 = {
  channelId: string;
  sampleCount: number;
  dynamicLInf: number | null;
  effectiveLInf: number | null;
  absoluteLInf: number | null;
  relativeLInf: number | null;
  relativeL2: number | null;
  toleranceLInf: number;
  status: Nhm2BackreactionChannelStatus;
  blockers: string[];
};

export type Nhm2BackreactionResidualReceiptV1 = {
  contractVersion: typeof NHM2_BACKREACTION_RESIDUAL_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  dynamicGeometrySamplesRef: string | null;
  effectiveGeometryReferenceRef: string | null;
  averagedSourceTensorRef: string | null;
  comparedChannelIds: string[];
  channels: Nhm2BackreactionResidualChannelV1[];
  summary: {
    residualLInf: number | null;
    residualL2: number | null;
    toleranceLInf: number;
    bounded: boolean;
    computedChannelCount: number;
    firstBlocker: string | null;
    blockerCount: number;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    boundsBackreactionResidualOnly: true;
    doesNotProvePhysicalViability: true;
    physicalViabilityClaimAllowed: false;
  };
};

export type BuildNhm2BackreactionResidualReceiptInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  dynamicGeometrySamplesRef?: string | null;
  effectiveGeometryReferenceRef?: string | null;
  averagedSourceTensorRef?: string | null;
  toleranceLInf?: number | null;
  channels?: Array<{
    channelId?: string | null;
    sampleCount?: number | null;
    dynamicLInf?: number | null;
    effectiveLInf?: number | null;
    absoluteLInf?: number | null;
    relativeLInf?: number | null;
    relativeL2?: number | null;
    blockers?: string[] | null;
  }> | null;
  blockers?: string[] | null;
};

const DEFAULT_TOLERANCE_LINF = 0.1;

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

const maxFinite = (values: Array<number | null>): number | null => {
  const finite = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finite.length === 0 ? null : Math.max(...finite);
};

export const buildNhm2BackreactionResidualReceipt = (
  input: BuildNhm2BackreactionResidualReceiptInput,
): Nhm2BackreactionResidualReceiptV1 => {
  const toleranceLInf = toFinite(input.toleranceLInf) ?? DEFAULT_TOLERANCE_LINF;
  const channels = (input.channels ?? []).map((channel, index) => {
    const channelId = asText(channel.channelId) ?? `channel_${index}`;
    const sampleCount = toFinite(channel.sampleCount) ?? 0;
    const dynamicLInf = toFinite(channel.dynamicLInf);
    const effectiveLInf = toFinite(channel.effectiveLInf);
    const absoluteLInf = toFinite(channel.absoluteLInf);
    const relativeLInf = toFinite(channel.relativeLInf);
    const relativeL2 = toFinite(channel.relativeL2);
    const blockers = uniqueText([
      ...(channel.blockers ?? []),
      sampleCount > 0 ? null : "backreaction_channel_samples_missing",
      dynamicLInf == null ? "backreaction_dynamic_channel_linf_missing" : null,
      effectiveLInf == null ? "backreaction_effective_channel_linf_missing" : null,
      absoluteLInf == null ? "backreaction_absolute_linf_missing" : null,
      relativeLInf == null ? "backreaction_relative_linf_missing" : null,
      relativeLInf != null && relativeLInf > toleranceLInf
        ? "backreaction_relative_linf_exceeds_tolerance"
        : null,
    ]);
    return {
      channelId,
      sampleCount,
      dynamicLInf,
      effectiveLInf,
      absoluteLInf,
      relativeLInf,
      relativeL2,
      toleranceLInf,
      status:
        blockers.length === 0
          ? "pass"
          : sampleCount > 0
            ? "fail"
            : "missing",
      blockers,
    };
  });
  const computedChannelCount = channels.filter(
    (channel) => channel.status === "pass",
  ).length;
  const blockers = uniqueText([
    ...(input.blockers ?? []),
    asText(input.dynamicGeometrySamplesRef) == null
      ? "dynamic_geometry_samples_ref_missing"
      : null,
    asText(input.effectiveGeometryReferenceRef) == null
      ? "effective_geometry_reference_ref_missing"
      : null,
    asText(input.averagedSourceTensorRef) == null
      ? "averaged_source_tensor_ref_missing"
      : null,
    channels.length === 0 ? "backreaction_channels_missing" : null,
    computedChannelCount === 0 ? "backreaction_computed_channels_missing" : null,
    ...channels.flatMap((channel) =>
      channel.status === "pass"
        ? []
        : channel.blockers.map((blocker) => `${channel.channelId}:${blocker}`),
    ),
  ]);
  const residualLInf = maxFinite(channels.map((channel) => channel.relativeLInf));
  const residualL2 = maxFinite(channels.map((channel) => channel.relativeL2));
  return {
    contractVersion: NHM2_BACKREACTION_RESIDUAL_RECEIPT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId:
      asText(input.selectedProfileId) ?? "stage1_centerline_alpha_0p995_v1",
    runId: asText(input.runId) ?? "unknown",
    chartId: asText(input.chartId) ?? "comoving_cartesian",
    atlasRef: asText(input.atlasRef),
    atlasHash: asText(input.atlasHash),
    dynamicGeometrySamplesRef: asText(input.dynamicGeometrySamplesRef),
    effectiveGeometryReferenceRef: asText(input.effectiveGeometryReferenceRef),
    averagedSourceTensorRef: asText(input.averagedSourceTensorRef),
    comparedChannelIds: channels.map((channel) => channel.channelId),
    channels,
    summary: {
      residualLInf,
      residualL2,
      toleranceLInf,
      bounded: blockers.length === 0 && residualLInf != null && residualLInf <= toleranceLInf,
      computedChannelCount,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      boundsBackreactionResidualOnly: true,
      doesNotProvePhysicalViability: true,
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

const isStatus = (value: unknown): value is Nhm2BackreactionChannelStatus =>
  NHM2_BACKREACTION_CHANNEL_STATUS_VALUES.includes(
    value as Nhm2BackreactionChannelStatus,
  );

const isChannel = (value: unknown): value is Nhm2BackreactionResidualChannelV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.channelId === "string" &&
    record.channelId.trim().length > 0 &&
    typeof record.sampleCount === "number" &&
    Number.isFinite(record.sampleCount) &&
    isNullableNumber(record.dynamicLInf) &&
    isNullableNumber(record.effectiveLInf) &&
    isNullableNumber(record.absoluteLInf) &&
    isNullableNumber(record.relativeLInf) &&
    isNullableNumber(record.relativeL2) &&
    typeof record.toleranceLInf === "number" &&
    Number.isFinite(record.toleranceLInf) &&
    isStatus(record.status) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2BackreactionResidualReceipt = (
  value: unknown,
): value is Nhm2BackreactionResidualReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_BACKREACTION_RESIDUAL_RECEIPT_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    typeof record.chartId === "string" &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.dynamicGeometrySamplesRef) &&
    isNullableText(record.effectiveGeometryReferenceRef) &&
    isNullableText(record.averagedSourceTensorRef) &&
    isStringArray(record.comparedChannelIds) &&
    Array.isArray(record.channels) &&
    record.channels.every(isChannel) &&
    summary != null &&
    isNullableNumber(summary.residualLInf) &&
    isNullableNumber(summary.residualL2) &&
    typeof summary.toleranceLInf === "number" &&
    Number.isFinite(summary.toleranceLInf) &&
    typeof summary.bounded === "boolean" &&
    typeof summary.computedChannelCount === "number" &&
    Number.isFinite(summary.computedChannelCount) &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    isStringArray(record.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.boundsBackreactionResidualOnly === true &&
    claimBoundary.doesNotProvePhysicalViability === true &&
    claimBoundary.physicalViabilityClaimAllowed === false
  );
};
