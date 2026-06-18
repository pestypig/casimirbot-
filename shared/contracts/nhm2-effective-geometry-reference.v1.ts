import { NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS } from "./nhm2-dynamic-geometry-samples.v1";

export const NHM2_EFFECTIVE_GEOMETRY_REFERENCE_CONTRACT_VERSION =
  "nhm2_effective_geometry_reference/v1";

export const NHM2_EFFECTIVE_GEOMETRY_REFERENCE_STATUS_VALUES = [
  "computed",
  "missing",
  "proxy",
  "not_run",
] as const;

export type Nhm2EffectiveGeometryReferenceStatus =
  (typeof NHM2_EFFECTIVE_GEOMETRY_REFERENCE_STATUS_VALUES)[number];

export const NHM2_EFFECTIVE_GEOMETRY_REFERENCE_SOURCE_KIND_VALUES = [
  "gr_evolve_brick_static_reference",
  "runtime_artifact",
  "missing",
] as const;

export type Nhm2EffectiveGeometryReferenceSourceKind =
  (typeof NHM2_EFFECTIVE_GEOMETRY_REFERENCE_SOURCE_KIND_VALUES)[number];

export type Nhm2EffectiveGeometryReferenceArtifactV1 = {
  contractVersion: typeof NHM2_EFFECTIVE_GEOMETRY_REFERENCE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  atlasRef: string | null;
  atlasHash: string | null;
  effectiveGeometryRef: string | null;
  sourceKind: Nhm2EffectiveGeometryReferenceSourceKind;
  requiredChannels: string[];
  availableChannels: string[];
  missingChannels: string[];
  status: Nhm2EffectiveGeometryReferenceStatus;
  summary: {
    effectiveGeometryAvailable: boolean;
    firstBlocker: string | null;
    blockerCount: number;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    effectiveGeometryReferenceDoesNotProveDynamicAgreement: true;
    backreactionResidualStillRequired: true;
    physicalViabilityClaimAllowed: false;
  };
};

export type BuildNhm2EffectiveGeometryReferenceInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  effectiveGeometryRef?: string | null;
  sourceKind?: Nhm2EffectiveGeometryReferenceSourceKind | null;
  requiredChannels?: string[] | null;
  availableChannels?: string[] | null;
  missingChannels?: string[] | null;
  status?: Nhm2EffectiveGeometryReferenceStatus | null;
  blockers?: string[] | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const asTextArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? uniqueText(value.map((entry) => (typeof entry === "string" ? entry : null)))
    : [];

const isStatus = (value: unknown): value is Nhm2EffectiveGeometryReferenceStatus =>
  NHM2_EFFECTIVE_GEOMETRY_REFERENCE_STATUS_VALUES.includes(
    value as Nhm2EffectiveGeometryReferenceStatus,
  );

const isSourceKind = (
  value: unknown,
): value is Nhm2EffectiveGeometryReferenceSourceKind =>
  NHM2_EFFECTIVE_GEOMETRY_REFERENCE_SOURCE_KIND_VALUES.includes(
    value as Nhm2EffectiveGeometryReferenceSourceKind,
  );

export const buildNhm2EffectiveGeometryReference = (
  input: BuildNhm2EffectiveGeometryReferenceInput,
): Nhm2EffectiveGeometryReferenceArtifactV1 => {
  const effectiveGeometryRef = asText(input.effectiveGeometryRef);
  const sourceKind = isSourceKind(input.sourceKind)
    ? input.sourceKind
    : effectiveGeometryRef == null
      ? "missing"
      : "runtime_artifact";
  const status = isStatus(input.status) ? input.status : "missing";
  const requiredChannels =
    asTextArray(input.requiredChannels).length > 0
      ? asTextArray(input.requiredChannels)
      : [...NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS];
  const availableChannels = asTextArray(input.availableChannels);
  const inferredMissingChannels = requiredChannels.filter(
    (channel) => !availableChannels.includes(channel),
  );
  const missingChannels = uniqueText([
    ...asTextArray(input.missingChannels),
    ...inferredMissingChannels,
  ]);
  const blockers = uniqueText([
    ...(input.blockers ?? []),
    status === "computed" ? null : "effective_geometry_reference_not_computed",
    effectiveGeometryRef == null ? "effective_geometry_reference_ref_missing" : null,
    sourceKind === "missing" ? "effective_geometry_reference_source_missing" : null,
    status === "computed" && sourceKind !== "gr_evolve_brick_static_reference"
      ? "effective_geometry_source_not_gr_evolve_brick_static_reference"
      : null,
    status === "computed" && missingChannels.length > 0
      ? "effective_geometry_required_channels_missing"
      : null,
    status === "proxy" ? "effective_geometry_proxy_inadmissible" : null,
  ]);
  return {
    contractVersion: NHM2_EFFECTIVE_GEOMETRY_REFERENCE_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId:
      asText(input.selectedProfileId) ?? "stage1_centerline_alpha_0p995_v1",
    runId: asText(input.runId) ?? "unknown",
    chartId: asText(input.chartId) ?? "comoving_cartesian",
    atlasRef: asText(input.atlasRef),
    atlasHash: asText(input.atlasHash),
    effectiveGeometryRef,
    sourceKind,
    requiredChannels,
    availableChannels,
    missingChannels,
    status,
    summary: {
      effectiveGeometryAvailable: blockers.length === 0,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      effectiveGeometryReferenceDoesNotProveDynamicAgreement: true,
      backreactionResidualStillRequired: true,
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

export const isNhm2EffectiveGeometryReference = (
  value: unknown,
): value is Nhm2EffectiveGeometryReferenceArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_EFFECTIVE_GEOMETRY_REFERENCE_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    typeof record.chartId === "string" &&
    isNullableText(record.atlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.effectiveGeometryRef) &&
    isSourceKind(record.sourceKind) &&
    isStringArray(record.requiredChannels) &&
    isStringArray(record.availableChannels) &&
    isStringArray(record.missingChannels) &&
    isStatus(record.status) &&
    summary != null &&
    typeof summary.effectiveGeometryAvailable === "boolean" &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    isStringArray(record.blockers) &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.effectiveGeometryReferenceDoesNotProveDynamicAgreement === true &&
    claimBoundary.backreactionResidualStillRequired === true &&
    claimBoundary.physicalViabilityClaimAllowed === false
  );
};
