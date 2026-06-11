import {
  isCasimirMaterialReceipt,
  isMaterialReceiptedCasimirMaterialReceipt,
  type CasimirMaterialReceiptStatus,
  type CasimirMaterialReceiptV1,
} from "./casimir-material-receipt.v1";

export const NHM2_WALL_SOURCE_CLOSURE_CONTRACT_VERSION =
  "nhm2_wall_source_closure/v1";

export const NHM2_WALL_SOURCE_CLOSURE_SOURCE_KIND_VALUES = [
  "tile_effective",
  "material_receipted",
  "proxy",
  "missing",
] as const;

export type Nhm2WallSourceClosureSourceKind =
  (typeof NHM2_WALL_SOURCE_CLOSURE_SOURCE_KIND_VALUES)[number];

export type Nhm2WallSourceClosureArtifactV1 = {
  contractVersion: typeof NHM2_WALL_SOURCE_CLOSURE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  regionId: "wall";
  chartId: string;
  required: {
    tensorRef: string;
    T00_SI: number | null;
    componentStatus: string;
  };
  available: {
    sourceKind: Nhm2WallSourceClosureSourceKind;
    tensorRef?: string;
    materialReceiptRef?: string;
    materialReceiptStatus?: CasimirMaterialReceiptStatus;
    sourceAuthorityRef?: string;
    sourceAuthorityStatus?: string;
    T00_SI: number | null;
    componentStatus: string;
  };
  residual: {
    absolute: number | null;
    relative: number | null;
    tolerance: number;
    pass: boolean | null;
  };
  blockers: string[];
  warnings: string[];
  claimBoundary: {
    diagnosticOnly: true;
    globalResidualCannotOverrideWallFailure: true;
  };
};

export type BuildNhm2WallSourceClosureArtifactInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  chartId?: string | null;
  required?: {
    tensorRef?: string | null;
    T00_SI?: number | null;
    componentStatus?: string | null;
  } | null;
  available?: {
    sourceKind?: Nhm2WallSourceClosureSourceKind | null;
    tensorRef?: string | null;
    materialReceiptRef?: string | null;
    materialReceiptStatus?: CasimirMaterialReceiptStatus | null;
    materialReceipt?: CasimirMaterialReceiptV1 | null;
    sourceAuthorityRef?: string | null;
    sourceAuthorityStatus?: string | null;
    T00_SI?: number | null;
    componentStatus?: string | null;
  } | null;
  tolerance?: number | null;
  blockers?: string[] | null;
  warnings?: string[] | null;
};

type Nhm2WallSourceClosureRegionLike = {
  regionId?: string | null;
  metricTensorRef?: string | null;
  tileTensorRef?: string | null;
  metricRequiredTensor?: { T00?: number | null } | null;
  tileEffectiveTensor?: { T00?: number | null } | null;
  metricT00Diagnostics?: {
    sourceRef?: string | null;
    meanT00?: number | null;
    evidenceStatus?: string | null;
    trace?: { valueRef?: string | null; tensorRef?: string | null } | null;
  } | null;
  tileT00Diagnostics?: {
    sourceRef?: string | null;
    meanT00?: number | null;
    evidenceStatus?: string | null;
    trace?: { valueRef?: string | null; tensorRef?: string | null } | null;
  } | null;
  tileProxyDiagnostics?: {
    proxyMode?: string | null;
    brickProxyMode?: string | null;
    pressureSource?: string | null;
  } | null;
  comparisonBasisAuthorityStatus?: string | null;
  regionalComparisonContractStatus?: string | null;
  sourceSideSameBasisAuthorityStatus?: string | null;
  sourceSideAuthorityRef?: string | null;
  sourceSideFullTensorMissingComponentIds?: string[] | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
};

export type BuildNhm2WallSourceClosureFromRegionInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  chartId?: string | null;
  regionComparison?: Nhm2WallSourceClosureRegionLike | null;
  tolerance?: number | null;
  blockers?: string[] | null;
  warnings?: string[] | null;
};

const DEFAULT_WALL_SOURCE_CLOSURE_TOLERANCE = 0.1;
const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const toFiniteOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const normalizeTextList = (values: string[] | null | undefined): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((entry) => toText(entry))
        .filter((entry): entry is string => entry != null),
    ),
  );

const normalizeSourceKind = (
  value: unknown,
): Nhm2WallSourceClosureSourceKind =>
  NHM2_WALL_SOURCE_CLOSURE_SOURCE_KIND_VALUES.includes(
    value as Nhm2WallSourceClosureSourceKind,
  )
    ? (value as Nhm2WallSourceClosureSourceKind)
    : "missing";

const normalizeMaterialReceipt = (
  value: unknown,
): CasimirMaterialReceiptV1 | null =>
  isCasimirMaterialReceipt(value) ? value : null;

const normalizeMaterialReceiptStatus = (
  value: unknown,
): CasimirMaterialReceiptStatus | null => {
  if (
    value === "material_receipted" ||
    value === "ideal_scalar_only" ||
    value === "blocked" ||
    value === "missing"
  ) {
    return value;
  }
  return null;
};

const resolveRelativeResidual = (
  required: number,
  available: number,
  eps = 1e-12,
): number =>
  Math.abs(required - available) / Math.max(Math.abs(required), eps);

const statusFromT00 = (
  value: number | null,
  fallback: string | null,
): string => fallback ?? (value == null ? "missing" : "computed");

const inferAvailableSourceKind = (
  region: Nhm2WallSourceClosureRegionLike | null | undefined,
  availableT00: number | null,
): Nhm2WallSourceClosureSourceKind => {
  if (availableT00 == null || region == null) return "missing";
  const materialReceipt =
    normalizeMaterialReceipt(region.casimirMaterialReceipt) ??
    normalizeMaterialReceipt(region.materialReceipt);
  if (isMaterialReceiptedCasimirMaterialReceipt(materialReceipt)) {
    return "material_receipted";
  }
  const sourceText = [
    region.tileT00Diagnostics?.sourceRef,
    region.tileT00Diagnostics?.trace?.valueRef,
    region.tileT00Diagnostics?.trace?.tensorRef,
    region.tileTensorRef,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
  if (sourceText.includes("tileeffective") || sourceText.includes("tile_effective")) {
    return "tile_effective";
  }
  if (
    sourceText.includes("gr.matter") ||
    sourceText.includes("material") ||
    sourceText.includes("stressenergy")
  ) {
    return "tile_effective";
  }
  const proxy = region.tileProxyDiagnostics;
  if (
    proxy?.proxyMode === "proxy" ||
    proxy?.brickProxyMode === "proxy" ||
    proxy?.pressureSource === "proxy"
  ) {
    return "proxy";
  }
  return "tile_effective";
};

export const buildNhm2WallSourceClosureArtifact = (
  input: BuildNhm2WallSourceClosureArtifactInput,
): Nhm2WallSourceClosureArtifactV1 => {
  const requiredT00 = toFiniteOrNull(input.required?.T00_SI);
  const availableT00 = toFiniteOrNull(input.available?.T00_SI);
  const tolerance = Math.max(
    0,
    toFiniteOrNull(input.tolerance) ?? DEFAULT_WALL_SOURCE_CLOSURE_TOLERANCE,
  );
  const absolute =
    requiredT00 != null && availableT00 != null
      ? Math.abs(requiredT00 - availableT00)
      : null;
  const relative =
    requiredT00 != null && availableT00 != null
      ? resolveRelativeResidual(requiredT00, availableT00)
      : null;
  const sourceKind = normalizeSourceKind(input.available?.sourceKind);
  const materialReceipt = normalizeMaterialReceipt(input.available?.materialReceipt);
  const materialReceiptStatus =
    normalizeMaterialReceiptStatus(input.available?.materialReceiptStatus) ??
    materialReceipt?.status ??
    null;
  const materialReceiptRef =
    toText(input.available?.materialReceiptRef) ??
    (materialReceipt != null
      ? `runtime://pipeline/casimirMaterialReceipt/${materialReceipt.tileBatchId}`
      : null);
  const sourceAuthorityStatus = toText(input.available?.sourceAuthorityStatus);
  const sourceAuthorityRef = toText(input.available?.sourceAuthorityRef);
  const resolvedSourceKind =
    sourceKind === "material_receipted" &&
    !isMaterialReceiptedCasimirMaterialReceipt(materialReceipt)
      ? availableT00 == null
        ? "missing"
        : "tile_effective"
      : sourceKind;
  const blockers = normalizeTextList(input.blockers);
  const warnings = normalizeTextList(input.warnings);

  if (requiredT00 == null) blockers.push("wall_required_T00_missing");
  if (availableT00 == null) blockers.push("wall_available_T00_missing");
  if (relative != null && relative > tolerance) {
    blockers.push("wall_T00_source_residual_exceeds_tolerance");
  }
  if (sourceKind === "material_receipted" && resolvedSourceKind !== "material_receipted") {
    blockers.push("casimir_material_receipt_required_for_material_source");
  }
  if (materialReceiptStatus === "blocked") {
    blockers.push("casimir_material_receipt_blocked");
  }
  if (
    sourceAuthorityStatus != null &&
    sourceAuthorityStatus !== "authoritative_same_basis"
  ) {
    blockers.push("wall_source_side_same_basis_authority_missing");
  }
  if (resolvedSourceKind === "proxy") warnings.push("wall_available_source_is_proxy");
  if (materialReceiptStatus === "ideal_scalar_only") {
    warnings.push("casimir_material_receipt_ideal_scalar_only");
  }
  if (materialReceiptStatus === "missing") {
    warnings.push("casimir_material_receipt_missing");
  }

  return {
    contractVersion: NHM2_WALL_SOURCE_CLOSURE_CONTRACT_VERSION,
    generatedAt: toText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    laneId: toText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: toText(input.selectedProfileId) ?? "unknown",
    regionId: "wall",
    chartId: toText(input.chartId) ?? "unknown",
    required: {
      tensorRef: toText(input.required?.tensorRef) ?? "missing",
      T00_SI: requiredT00,
      componentStatus: statusFromT00(
        requiredT00,
        toText(input.required?.componentStatus),
      ),
    },
    available: {
      sourceKind: resolvedSourceKind,
      ...(toText(input.available?.tensorRef) != null
        ? { tensorRef: toText(input.available?.tensorRef) as string }
        : {}),
      ...(materialReceiptRef != null ? { materialReceiptRef } : {}),
      ...(materialReceiptStatus != null ? { materialReceiptStatus } : {}),
      ...(sourceAuthorityRef != null ? { sourceAuthorityRef } : {}),
      ...(sourceAuthorityStatus != null ? { sourceAuthorityStatus } : {}),
      T00_SI: availableT00,
      componentStatus: statusFromT00(
        availableT00,
        toText(input.available?.componentStatus),
      ),
    },
    residual: {
      absolute,
      relative,
      tolerance,
      pass: relative == null ? null : relative <= tolerance,
    },
    blockers: normalizeTextList(blockers),
    warnings: normalizeTextList(warnings),
    claimBoundary: {
      diagnosticOnly: true,
      globalResidualCannotOverrideWallFailure: true,
    },
  };
};

export const buildNhm2WallSourceClosureFromRegionComparison = (
  input: BuildNhm2WallSourceClosureFromRegionInput,
): Nhm2WallSourceClosureArtifactV1 => {
  const region = input.regionComparison ?? null;
  const regionIsWall = toText(region?.regionId)?.toLowerCase() === "wall";
  const requiredT00 =
    toFiniteOrNull(region?.metricT00Diagnostics?.meanT00) ??
    toFiniteOrNull(region?.metricRequiredTensor?.T00);
  const availableT00 =
    toFiniteOrNull(region?.tileT00Diagnostics?.meanT00) ??
    toFiniteOrNull(region?.tileEffectiveTensor?.T00);
  const requiredTensorRef =
    toText(region?.metricT00Diagnostics?.sourceRef) ??
    toText(region?.metricT00Diagnostics?.trace?.valueRef) ??
    toText(region?.metricT00Diagnostics?.trace?.tensorRef) ??
    toText(region?.metricTensorRef) ??
    "missing";
  const availableTensorRef =
    toText(region?.tileT00Diagnostics?.sourceRef) ??
    toText(region?.tileT00Diagnostics?.trace?.valueRef) ??
    toText(region?.tileT00Diagnostics?.trace?.tensorRef) ??
    toText(region?.tileTensorRef) ??
    null;
  const blockers = normalizeTextList(input.blockers);
  const warnings = normalizeTextList(input.warnings);
  const materialReceipt =
    normalizeMaterialReceipt(region?.casimirMaterialReceipt) ??
    normalizeMaterialReceipt(region?.materialReceipt);
  const sourceAuthorityStatus =
    toText(region?.sourceSideSameBasisAuthorityStatus) ??
    (toText(region?.comparisonBasisAuthorityStatus) === "authoritative_same_basis" &&
    toText(region?.regionalComparisonContractStatus) === "same_basis_counterpart_available"
      ? "diagnostic_only"
      : toText(region?.comparisonBasisAuthorityStatus) ?? "missing");
  const sourceAuthorityRef =
    toText(region?.sourceSideAuthorityRef) ??
    toText(region?.tileT00Diagnostics?.sourceRef) ??
    toText(region?.tileT00Diagnostics?.trace?.valueRef) ??
    toText(region?.tileT00Diagnostics?.trace?.tensorRef) ??
    toText(region?.tileTensorRef);
  const sourceText = [
    region?.tileT00Diagnostics?.sourceRef,
    region?.tileT00Diagnostics?.trace?.valueRef,
    region?.tileT00Diagnostics?.trace?.tensorRef,
    region?.tileTensorRef,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
  if (
    availableT00 != null &&
    (sourceText.includes("gr.matter") ||
      sourceText.includes("material") ||
      sourceText.includes("stressenergy")) &&
    !isMaterialReceiptedCasimirMaterialReceipt(materialReceipt)
  ) {
    warnings.push("casimir_material_receipt_required_before_material_source_evidence");
  }
  if (!regionIsWall) {
    blockers.push("wall_region_comparison_missing");
  }

  return buildNhm2WallSourceClosureArtifact({
    generatedAt: input.generatedAt,
    laneId: input.laneId,
    selectedProfileId: input.selectedProfileId,
    chartId: input.chartId,
    required: {
      tensorRef: requiredTensorRef,
      T00_SI: requiredT00,
      componentStatus: statusFromT00(
        requiredT00,
        toText(region?.metricT00Diagnostics?.evidenceStatus),
      ),
    },
    available: {
      sourceKind: inferAvailableSourceKind(region, availableT00),
      tensorRef: availableTensorRef,
      materialReceipt,
      sourceAuthorityRef,
      sourceAuthorityStatus,
      T00_SI: availableT00,
      componentStatus: statusFromT00(
        availableT00,
        toText(region?.tileT00Diagnostics?.evidenceStatus),
      ),
    },
    tolerance: input.tolerance,
    blockers,
    warnings,
  });
};

export const isNhm2WallSourceClosureArtifact = (
  value: unknown,
): value is Nhm2WallSourceClosureArtifactV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const required =
    record.required && typeof record.required === "object"
      ? (record.required as Record<string, unknown>)
      : null;
  const available =
    record.available && typeof record.available === "object"
      ? (record.available as Record<string, unknown>)
      : null;
  const residual =
    record.residual && typeof record.residual === "object"
      ? (record.residual as Record<string, unknown>)
      : null;
  const claimBoundary =
    record.claimBoundary && typeof record.claimBoundary === "object"
      ? (record.claimBoundary as Record<string, unknown>)
      : null;
  return (
    record.contractVersion === NHM2_WALL_SOURCE_CLOSURE_CONTRACT_VERSION &&
    toText(record.generatedAt) != null &&
    toText(record.laneId) != null &&
    toText(record.selectedProfileId) != null &&
    record.regionId === "wall" &&
    toText(record.chartId) != null &&
    required != null &&
    toText(required.tensorRef) != null &&
    (required.T00_SI === null || toFiniteOrNull(required.T00_SI) != null) &&
    toText(required.componentStatus) != null &&
    available != null &&
    NHM2_WALL_SOURCE_CLOSURE_SOURCE_KIND_VALUES.includes(
      available.sourceKind as Nhm2WallSourceClosureSourceKind,
    ) &&
    (available.tensorRef === undefined || toText(available.tensorRef) != null) &&
    (available.materialReceiptRef === undefined ||
      toText(available.materialReceiptRef) != null) &&
    (available.materialReceiptStatus === undefined ||
      normalizeMaterialReceiptStatus(available.materialReceiptStatus) != null) &&
    (available.sourceAuthorityRef === undefined ||
      toText(available.sourceAuthorityRef) != null) &&
    (available.sourceAuthorityStatus === undefined ||
      toText(available.sourceAuthorityStatus) != null) &&
    (available.T00_SI === null || toFiniteOrNull(available.T00_SI) != null) &&
    toText(available.componentStatus) != null &&
    residual != null &&
    (residual.absolute === null || toFiniteOrNull(residual.absolute) != null) &&
    (residual.relative === null || toFiniteOrNull(residual.relative) != null) &&
    toFiniteOrNull(residual.tolerance) != null &&
    (residual.pass === true || residual.pass === false || residual.pass === null) &&
    Array.isArray(record.blockers) &&
    record.blockers.every((entry) => toText(entry) != null) &&
    Array.isArray(record.warnings) &&
    record.warnings.every((entry) => toText(entry) != null) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.globalResidualCannotOverrideWallFailure === true
  );
};
