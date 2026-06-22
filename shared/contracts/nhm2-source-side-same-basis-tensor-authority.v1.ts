import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";
import {
  type Nhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartRegion,
} from "./nhm2-tile-effective-counterpart.v1";
import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptStatus,
  type CasimirMaterialReceiptV1,
} from "./casimir-material-receipt.v1";
import type { Nhm2TileSourceAuthorityHandoffV1 } from "./nhm2-tile-source-authority-handoff.v1";
import {
  NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS,
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS,
  type Nhm2TileSourceFullApparatusTensorValuesV1,
} from "./nhm2-tile-source-full-apparatus-tensor-values.v1";

export const NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_CONTRACT_VERSION =
  "nhm2_source_side_same_basis_tensor_authority/v1";

export const NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_STATUS_VALUES = [
  "authoritative_same_basis",
  "diagnostic_only",
  "counterpart_missing",
  "contract_misaligned",
  "metric_echo_forbidden",
  "proxy_limited",
  "blocked",
  "missing",
] as const;

export const NHM2_SOURCE_SIDE_SAME_BASIS_FULL_TENSOR_COMPONENTS =
  NHM2_TENSOR_COMPONENTS;

const NHM2_SOURCE_SIDE_SAME_BASIS_SYMMETRIC_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const satisfies readonly Nhm2TensorComponent[];

export type Nhm2SourceSideSameBasisTensorAuthorityStatus =
  (typeof NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_STATUS_VALUES)[number];

export type Nhm2SourceSideSameBasisTensorAuthorityRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId | string;
  status: Nhm2SourceSideSameBasisTensorAuthorityStatus;
  sourceTensorRef: string | null;
  expectedMetricCounterpartRole: "tile_effective_counterpart";
  comparisonRole: string | null;
  chartId: string | null;
  basisRef: string | null;
  units: "J/m^3" | string | null;
  regionMaskRef: string | null;
  aggregationMode: string | null;
  normalizationBasis: string | null;
  tensorAuthorityMode: string | null;
  derivationMode: string | null;
  notDerivedFromMetricRequiredTensor: boolean | null;
  hasFullTensorComponents: boolean;
  missingComponentIds: string[];
  materialReceiptRef?: string;
  materialReceiptStatus?: CasimirMaterialReceiptStatus;
  blockers: string[];
  warnings: string[];
};

export type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 = {
  contractVersion: typeof NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  chartId: string;
  sourceModelId: string | null;
  sourceTensorArtifactRef?: string;
  counterpartArtifactRef?: string;
  tileSourceAuthorityHandoffRef?: string;
  tileSourceAuthorityHandoffStatus?: string;
  regions: Nhm2SourceSideSameBasisTensorAuthorityRegionV1[];
  summary: {
    hasWallAuthority: boolean;
    allRequiredRegionsAuthoritative: boolean;
    tileSourceHandoffReady: boolean;
    anyMetricEcho: boolean;
    anyProxy: boolean;
    anyMissingCounterpart: boolean;
    missingRegionIds: string[];
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    doesNotValidatePhysicalSource: true;
    metricEchoForbidden: true;
    wallT00ClosureRequiresWallAuthority: true;
  };
};

type SourceClosureRegionLike = {
  regionId?: string | null;
  comparisonBasisStatus?: string | null;
  comparisonBasisAuthorityStatus?: string | null;
  regionalComparisonContractStatus?: string | null;
  resolvedTileCounterpartRef?: string | null;
  tileTensorRef?: string | null;
  tileEffectiveTensor?: Nhm2RegionalTensor | null;
  tileT00Diagnostics?: {
    sourceRef?: string | null;
    trace?: {
      valueRef?: string | null;
      tensorRef?: string | null;
      pathFacts?: {
        comparisonRole?: string | null;
        expectedCounterpartRole?: string | null;
        semanticEquivalenceExpected?: boolean | null;
      } | null;
    } | null;
    normalizationBasis?: string | null;
    aggregationMode?: string | null;
  } | null;
  tileAccounting?: {
    regionMaskRef?: string | null;
    aggregationMode?: string | null;
    normalizationBasis?: string | null;
    sampleCount?: number | null;
  } | null;
  sourceSideSameBasisAuthorityStatus?: string | null;
  sourceSideAuthorityRef?: string | null;
  sourceSideFullTensorMissingComponentIds?: string[] | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
};

export type BuildNhm2SourceSideSameBasisTensorAuthorityInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  chartId?: string | null;
  sourceModelId?: string | null;
  sourceTensorArtifactRef?: string | null;
  counterpartArtifactRef?: string | null;
  tileSourceAuthorityHandoffRef?: string | null;
  tileSourceAuthorityHandoff?: Nhm2TileSourceAuthorityHandoffV1 | null;
  fullApparatusTensorValues?: Nhm2TileSourceFullApparatusTensorValuesV1 | null;
  counterpartArtifact?: Nhm2TileEffectiveCounterpartArtifact | null;
  sourceClosureRegions?: SourceClosureRegionLike[] | null;
  requiredRegionIds?: string[] | null;
  casimirMaterialReceipt?: CasimirMaterialReceiptV1 | null;
  blockers?: string[] | null;
  warnings?: string[] | null;
};

const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const normalizeList = (values: string[] | null | undefined): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((entry) => toText(entry))
        .filter((entry): entry is string => entry != null),
    ),
  );

const normalizeStatus = (
  value: unknown,
): Nhm2SourceSideSameBasisTensorAuthorityStatus | null =>
  NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_STATUS_VALUES.includes(
    value as Nhm2SourceSideSameBasisTensorAuthorityStatus,
  )
    ? (value as Nhm2SourceSideSameBasisTensorAuthorityStatus)
    : null;

const materialReceiptStatus = (
  receipt: CasimirMaterialReceiptV1 | null | undefined,
): CasimirMaterialReceiptStatus | null =>
  isCasimirMaterialReceipt(receipt) ? receipt.status : null;

const requiredComponentsForAuthority = (
  mode: string | null,
): readonly Nhm2TensorComponent[] => {
  if (mode === "symmetric_full_tensor") {
    return NHM2_SOURCE_SIDE_SAME_BASIS_SYMMETRIC_TENSOR_COMPONENTS;
  }
  return NHM2_SOURCE_SIDE_SAME_BASIS_FULL_TENSOR_COMPONENTS;
};

const missingComponentsForTensor = (
  tensor: Nhm2RegionalTensor | null | undefined,
  mode: string | null,
): string[] => {
  const required = requiredComponentsForAuthority(mode);
  const record = isRecord(tensor) ? tensor : {};
  return required.filter((component) => record[component] == null);
};

const tensorModeHasFullAuthority = (mode: string | null): boolean =>
  mode === "full_tensor" || mode === "symmetric_full_tensor";

const statusFromBlockers = (args: {
  blockers: Set<string>;
  comparisonRole: string | null;
  tensorAuthorityMode: string | null;
  derivationMode: string | null;
  explicitStatus?: Nhm2SourceSideSameBasisTensorAuthorityStatus | null;
}): Nhm2SourceSideSameBasisTensorAuthorityStatus => {
  if (args.explicitStatus != null) return args.explicitStatus;
  if (args.blockers.has("metric_echo_not_source_tensor")) return "metric_echo_forbidden";
  if (args.blockers.has("source_side_counterpart_missing")) return "counterpart_missing";
  if (args.blockers.has("same_basis_contract_misaligned")) return "contract_misaligned";
  if (
    args.tensorAuthorityMode === "proxy" ||
    args.tensorAuthorityMode === "diagonal_reduced_order" ||
    args.derivationMode === "diagonal_proxy"
  ) {
    return "proxy_limited";
  }
  if (args.blockers.size > 0) return "blocked";
  if (
    (args.comparisonRole === "tile_effective_counterpart" ||
      args.comparisonRole === "tile_source_full_apparatus_tensor_values") &&
    tensorModeHasFullAuthority(args.tensorAuthorityMode)
  ) {
    return "authoritative_same_basis";
  }
  return "diagnostic_only";
};

const buildRegionFromFullApparatusTensorValues = (args: {
  artifact: Nhm2TileSourceFullApparatusTensorValuesV1;
  region: Nhm2TileSourceFullApparatusTensorValuesV1["regions"][number];
  materialReceipt: CasimirMaterialReceiptV1 | null;
  warnings: string[];
}): Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => {
  const missingComponentIds = NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.filter(
    (componentId) =>
      args.region.tensor[componentId] == null ||
      args.region.componentStatus[componentId] === "missing" ||
      args.region.componentStatus[componentId] === "blocked",
  );
  const blockers = new Set(args.region.blockers);
  if (!args.artifact.sourceSideOnly) blockers.add("source_side_only_not_asserted");
  if (!args.artifact.notDerivedFromMetricRequiredTensor) {
    blockers.add("metric_required_derivation_not_allowed");
  }
  if (!args.artifact.targetEchoForbidden || args.artifact.targetDerivedFieldsUsed) {
    blockers.add("metric_echo_not_source_tensor");
  }
  if (args.region.chartRef !== "comoving_cartesian") blockers.add("chart_mismatch");
  if (args.region.basisRef !== "same_basis") blockers.add("same_basis_contract_misaligned");
  if (args.region.unitsRef !== "J/m^3") blockers.add("unit_mismatch");
  if (args.region.regionSupportRef == null) blockers.add("region_mask_ref_missing");
  if (args.region.aggregationMode === "unknown") blockers.add("aggregation_mode_unknown");
  if (args.region.normalizationBasis === "unknown") blockers.add("normalization_basis_unknown");
  if (args.region.sampleCount == null) blockers.add("sample_count_missing");
  if (args.region.valueReceiptRef == null) blockers.add("tensor_value_receipt_ref_missing");
  if (missingComponentIds.length > 0) blockers.add("source_side_full_tensor_components_missing");

  for (const componentId of NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS) {
    const authority = args.region.componentAuthority[componentId];
    if (authority === "metric_echo") blockers.add("metric_echo_not_source_tensor");
    if (authority === "scalar_proxy") blockers.add("source_side_full_tensor_authority_missing");
    if (authority === "missing") blockers.add("source_side_full_tensor_components_missing");
  }
  for (const termId of NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS) {
    const contribution = args.region.termContributions[termId];
    if (contribution == null) {
      blockers.add(`full_apparatus_${termId}_term_missing`);
    }
  }

  const receiptStatus = materialReceiptStatus(args.materialReceipt);
  const warnings = normalizeList(args.warnings);
  if (receiptStatus == null || receiptStatus === "missing") {
    warnings.push("material_receipt_not_attached_to_source_authority");
  } else if (receiptStatus !== "material_receipted") {
    warnings.push(`material_receipt_status_${receiptStatus}`);
  }

  return {
    regionId: args.region.regionId,
    status: statusFromBlockers({
      blockers,
      comparisonRole: "tile_source_full_apparatus_tensor_values",
      tensorAuthorityMode: "symmetric_full_tensor",
      derivationMode: "full_apparatus_tensor_values",
    }),
    sourceTensorRef: args.region.valueReceiptRef ?? args.artifact.artifactRef,
    expectedMetricCounterpartRole: "tile_effective_counterpart",
    comparisonRole: "tile_source_full_apparatus_tensor_values",
    chartId: args.region.chartRef,
    basisRef: args.region.basisRef,
    units: args.region.unitsRef,
    regionMaskRef: args.region.regionSupportRef,
    aggregationMode: args.region.aggregationMode,
    normalizationBasis: args.region.normalizationBasis,
    tensorAuthorityMode: "symmetric_full_tensor",
    derivationMode: "full_apparatus_tensor_values",
    notDerivedFromMetricRequiredTensor:
      args.artifact.notDerivedFromMetricRequiredTensor &&
      !args.artifact.targetDerivedFieldsUsed,
    hasFullTensorComponents: missingComponentIds.length === 0,
    missingComponentIds,
    ...(receiptStatus != null ? { materialReceiptStatus: receiptStatus } : {}),
    blockers: normalizeList(Array.from(blockers)),
    warnings,
  };
};

const buildRegionFromCounterpart = (args: {
  region: Nhm2TileEffectiveCounterpartRegion;
  materialReceipt: CasimirMaterialReceiptV1 | null;
  warnings: string[];
}): Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => {
  const missingComponentIds = missingComponentsForTensor(
    args.region.tensor,
    args.region.tensorAuthorityMode,
  );
  const blockers = new Set(args.region.blockers);
  if (args.region.comparisonRole !== "tile_effective_counterpart") {
    blockers.add("source_side_counterpart_missing");
  }
  if (args.region.comparisonRole === "metric_echo_diagnostic_only") {
    blockers.add("metric_echo_not_source_tensor");
  }
  if (args.region.provenance.derivationMode === "metric_echo") {
    blockers.add("metric_echo_not_source_tensor");
  }
  if (!args.region.provenance.notDerivedFromMetricRequiredTensor) {
    blockers.add("metric_required_derivation_not_allowed");
  }
  if (!tensorModeHasFullAuthority(args.region.tensorAuthorityMode)) {
    blockers.add("source_side_full_tensor_authority_missing");
  }
  if (missingComponentIds.length > 0) {
    blockers.add("source_side_full_tensor_components_missing");
  }
  if (args.region.regionMaskRef == null) blockers.add("region_mask_ref_missing");
  if (args.region.aggregationMode === "unknown") blockers.add("aggregation_mode_unknown");
  if (args.region.normalizationBasis === "unknown") blockers.add("normalization_basis_unknown");
  if (args.region.sampleCount == null) blockers.add("sample_count_missing");

  const receiptStatus = materialReceiptStatus(args.materialReceipt);
  const warnings = normalizeList(args.warnings);
  if (receiptStatus == null || receiptStatus === "missing") {
    warnings.push("material_receipt_not_attached_to_source_authority");
  } else if (receiptStatus !== "material_receipted") {
    warnings.push(`material_receipt_status_${receiptStatus}`);
  }

  return {
    regionId: args.region.regionId,
    status: statusFromBlockers({
      blockers,
      comparisonRole: args.region.comparisonRole,
      tensorAuthorityMode: args.region.tensorAuthorityMode,
      derivationMode: args.region.provenance.derivationMode,
    }),
    sourceTensorRef: toText(args.region.provenance.inputRefs[0]) ?? null,
    expectedMetricCounterpartRole: "tile_effective_counterpart",
    comparisonRole: args.region.comparisonRole,
    chartId: args.region.chartRef,
    basisRef: "same_basis",
    units: args.region.unitsRef,
    regionMaskRef: args.region.regionMaskRef,
    aggregationMode: args.region.aggregationMode,
    normalizationBasis: args.region.normalizationBasis,
    tensorAuthorityMode: args.region.tensorAuthorityMode,
    derivationMode: args.region.provenance.derivationMode,
    notDerivedFromMetricRequiredTensor:
      args.region.provenance.notDerivedFromMetricRequiredTensor,
    hasFullTensorComponents: missingComponentIds.length === 0,
    missingComponentIds,
    ...(receiptStatus != null ? { materialReceiptStatus: receiptStatus } : {}),
    blockers: normalizeList(Array.from(blockers)),
    warnings,
  };
};

const buildRegionFromSourceClosure = (args: {
  region: SourceClosureRegionLike;
  materialReceipt: CasimirMaterialReceiptV1 | null;
  warnings: string[];
}): Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => {
  const trace = args.region.tileT00Diagnostics?.trace ?? null;
  const pathFacts = trace?.pathFacts ?? null;
  const comparisonRole =
    toText(pathFacts?.comparisonRole) ??
    (args.region.comparisonBasisAuthorityStatus === "authoritative_same_basis"
      ? "tile_effective_counterpart"
      : null);
  const sourceTensorRef =
    toText(args.region.sourceSideAuthorityRef) ??
    toText(args.region.resolvedTileCounterpartRef) ??
    toText(args.region.tileT00Diagnostics?.sourceRef) ??
    toText(trace?.valueRef) ??
    toText(trace?.tensorRef) ??
    toText(args.region.tileTensorRef);
  const tensorAuthorityMode = "diagonal_reduced_order";
  const missingComponentIds =
    Array.isArray(args.region.sourceSideFullTensorMissingComponentIds)
      ? normalizeList(args.region.sourceSideFullTensorMissingComponentIds)
      : missingComponentsForTensor(args.region.tileEffectiveTensor, tensorAuthorityMode);
  const blockers = new Set<string>();
  const explicitStatus = normalizeStatus(args.region.sourceSideSameBasisAuthorityStatus);
  const authorityStatus = toText(args.region.comparisonBasisAuthorityStatus);
  const contractStatus = toText(args.region.regionalComparisonContractStatus);
  if (authorityStatus === "counterpart_missing" || contractStatus === "narrowed_to_observation_only") {
    blockers.add("source_side_counterpart_missing");
  }
  if (authorityStatus === "contract_misaligned" || contractStatus === "pending_counterpart_surface") {
    blockers.add("same_basis_contract_misaligned");
  }
  if (comparisonRole !== "tile_effective_counterpart") {
    blockers.add("source_side_counterpart_missing");
  }
  if (
    missingComponentIds.length > 0 &&
    explicitStatus !== "authoritative_same_basis"
  ) {
    blockers.add("source_side_full_tensor_components_missing");
  }
  if (explicitStatus !== "authoritative_same_basis") {
    blockers.add("source_closure_region_is_not_source_side_full_tensor_receipt");
  }

  const receiptStatus = materialReceiptStatus(args.materialReceipt);
  const warnings = normalizeList(args.warnings);
  if (receiptStatus == null || receiptStatus === "missing") {
    warnings.push("material_receipt_not_attached_to_source_authority");
  } else if (receiptStatus !== "material_receipted") {
    warnings.push(`material_receipt_status_${receiptStatus}`);
  }

  return {
    regionId: toText(args.region.regionId) ?? "unknown",
    status: statusFromBlockers({
      blockers,
      comparisonRole,
      tensorAuthorityMode,
      derivationMode: "source_closure_region_projection",
      explicitStatus,
    }),
    sourceTensorRef,
    expectedMetricCounterpartRole: "tile_effective_counterpart",
    comparisonRole,
    chartId: null,
    basisRef: args.region.comparisonBasisStatus ?? null,
    units: "J/m^3",
    regionMaskRef: args.region.tileAccounting?.regionMaskRef ?? null,
    aggregationMode:
      args.region.tileAccounting?.aggregationMode ??
      args.region.tileT00Diagnostics?.aggregationMode ??
      null,
    normalizationBasis:
      args.region.tileAccounting?.normalizationBasis ??
      args.region.tileT00Diagnostics?.normalizationBasis ??
      null,
    tensorAuthorityMode,
    derivationMode: "source_closure_region_projection",
    notDerivedFromMetricRequiredTensor:
      pathFacts?.semanticEquivalenceExpected === true ? true : null,
    hasFullTensorComponents: missingComponentIds.length === 0,
    missingComponentIds,
    ...(receiptStatus != null ? { materialReceiptStatus: receiptStatus } : {}),
    blockers: normalizeList(Array.from(blockers)),
    warnings,
  };
};

const normalizeRegionId = (value: string): string =>
  value.trim().toLowerCase().replace(/-/g, "_");

const buildRegionFromTileSourceHandoff = (args: {
  regionId: string;
  handoff: Nhm2TileSourceAuthorityHandoffV1;
  warnings: string[];
}): Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => {
  const blockers = new Set<string>();
  if (!args.handoff.summary.handoffReadyForSameBasisAuthority) {
    blockers.add("tile_source_authority_handoff_not_ready");
    const firstBlocker = toText(args.handoff.summary.firstBlocker);
    if (firstBlocker != null && firstBlocker !== "none") blockers.add(firstBlocker);
  }
  blockers.add("tile_source_handoff_does_not_supply_tensor_values");
  if (!args.handoff.summary.fullApparatusComponentDetailRefsReady) {
    blockers.add("full_apparatus_component_detail_refs_incomplete");
  }

  return {
    regionId: args.regionId,
    status: "blocked",
    sourceTensorRef: null,
    expectedMetricCounterpartRole: "tile_effective_counterpart",
    comparisonRole: "tile_source_material_evidence_handoff",
    chartId: null,
    basisRef: null,
    units: null,
    regionMaskRef: null,
    aggregationMode: null,
    normalizationBasis: null,
    tensorAuthorityMode: null,
    derivationMode: "tile_source_material_evidence_handoff",
    notDerivedFromMetricRequiredTensor:
      args.handoff.summary.handoffReadyForSameBasisAuthority ? true : null,
    hasFullTensorComponents: false,
    missingComponentIds: [...NHM2_SOURCE_SIDE_SAME_BASIS_FULL_TENSOR_COMPONENTS],
    blockers: normalizeList(Array.from(blockers)),
    warnings: normalizeList([
      ...args.warnings,
      "tile_source_handoff_is_evidence_intake_not_tensor_authority",
      ...(args.handoff.sourceRefs.fullApparatusTensorOperatingBudgetRef != null
        ? [`full_apparatus_tensor_operating_budget_ref:${args.handoff.sourceRefs.fullApparatusTensorOperatingBudgetRef}`]
        : []),
    ]),
  };
};

const handoffAdmissionBlockers = (
  handoff: Nhm2TileSourceAuthorityHandoffV1,
): string[] => {
  if (handoff.summary.handoffReadyForSameBasisAuthority) return [];
  return normalizeList([
    "tile_source_authority_handoff_not_ready",
    toText(handoff.summary.firstBlocker),
    ...handoff.gates.flatMap((gate) => gate.blockers),
  ]);
};

const applyHandoffAdmissionGate = (
  region: Nhm2SourceSideSameBasisTensorAuthorityRegionV1,
  handoff: Nhm2TileSourceAuthorityHandoffV1 | null,
): Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => {
  if (handoff == null || handoff.summary.handoffReadyForSameBasisAuthority) {
    return region;
  }
  const blockers = normalizeList([
    ...region.blockers,
    ...handoffAdmissionBlockers(handoff),
  ]);
  const warnings = normalizeList([
    ...region.warnings,
    "tile_source_handoff_admission_gate_blocks_source_authority",
  ]);
  const status: Nhm2SourceSideSameBasisTensorAuthorityStatus =
    region.status === "metric_echo_forbidden" || region.status === "proxy_limited"
      ? region.status
      : "blocked";
  return {
    ...region,
    status,
    notDerivedFromMetricRequiredTensor:
      region.notDerivedFromMetricRequiredTensor === true ? true : null,
    blockers,
    warnings,
  };
};

export const buildNhm2SourceSideSameBasisTensorAuthorityArtifact = (
  input: BuildNhm2SourceSideSameBasisTensorAuthorityInput,
): Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 => {
  const materialReceipt = isCasimirMaterialReceipt(input.casimirMaterialReceipt)
    ? input.casimirMaterialReceipt
    : null;
  const tileSourceAuthorityHandoff = input.tileSourceAuthorityHandoff ?? null;
  const regionMap = new Map<string, Nhm2SourceSideSameBasisTensorAuthorityRegionV1>();

  for (const region of input.counterpartArtifact?.regions ?? []) {
    const built = buildRegionFromCounterpart({
      region,
      materialReceipt,
      warnings: input.warnings ?? [],
    });
    regionMap.set(normalizeRegionId(String(built.regionId)), built);
  }

  for (const region of input.sourceClosureRegions ?? []) {
    const regionId = toText(region.regionId);
    if (regionId == null) continue;
    const key = normalizeRegionId(regionId);
    if (regionMap.has(key)) continue;
    const built = buildRegionFromSourceClosure({
      region,
      materialReceipt: isCasimirMaterialReceipt(region.casimirMaterialReceipt)
        ? region.casimirMaterialReceipt
        : materialReceipt,
      warnings: input.warnings ?? [],
    });
    regionMap.set(key, built);
  }

  if (input.fullApparatusTensorValues != null) {
    for (const region of input.fullApparatusTensorValues.regions) {
      const key = normalizeRegionId(region.regionId);
      regionMap.set(
        key,
        buildRegionFromFullApparatusTensorValues({
          artifact: input.fullApparatusTensorValues,
          region,
          materialReceipt,
          warnings: input.warnings ?? [],
        }),
      );
    }
  }

  if (tileSourceAuthorityHandoff != null) {
    const requiredRegionIds = normalizeList(
      input.requiredRegionIds ?? [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
    );
    for (const regionId of requiredRegionIds) {
      const key = normalizeRegionId(regionId);
      if (regionMap.has(key)) continue;
      regionMap.set(
        key,
        buildRegionFromTileSourceHandoff({
          regionId,
          handoff: tileSourceAuthorityHandoff,
          warnings: input.warnings ?? [],
        }),
      );
    }
  }

  if (tileSourceAuthorityHandoff != null) {
    for (const [key, region] of regionMap.entries()) {
      regionMap.set(key, applyHandoffAdmissionGate(region, tileSourceAuthorityHandoff));
    }
  }

  const requiredRegionIds = normalizeList(
    input.requiredRegionIds ?? [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
  );
  const missingRegionIds = requiredRegionIds.filter((regionId) => !regionMap.has(normalizeRegionId(regionId)));

  for (const regionId of missingRegionIds) {
    regionMap.set(normalizeRegionId(regionId), {
      regionId,
      status: "missing",
      sourceTensorRef: null,
      expectedMetricCounterpartRole: "tile_effective_counterpart",
      comparisonRole: null,
      chartId: null,
      basisRef: null,
      units: null,
      regionMaskRef: null,
      aggregationMode: null,
      normalizationBasis: null,
      tensorAuthorityMode: null,
      derivationMode: null,
      notDerivedFromMetricRequiredTensor: null,
      hasFullTensorComponents: false,
      missingComponentIds: [...NHM2_SOURCE_SIDE_SAME_BASIS_FULL_TENSOR_COMPONENTS],
      blockers: ["source_side_region_authority_missing"],
      warnings: normalizeList(input.warnings),
    });
  }

  const regions = Array.from(regionMap.values());
  const requiredRegions = requiredRegionIds
    .map((regionId) => regionMap.get(normalizeRegionId(regionId)) ?? null)
    .filter((region): region is Nhm2SourceSideSameBasisTensorAuthorityRegionV1 => region != null);
  const hasWallAuthority =
    regionMap.get("wall")?.status === "authoritative_same_basis";
  const tileSourceHandoffReady =
    tileSourceAuthorityHandoff?.summary.handoffReadyForSameBasisAuthority === true;
  const anyMetricEcho = regions.some((region) => region.status === "metric_echo_forbidden");
  const anyProxy = regions.some((region) => region.status === "proxy_limited");
  const anyMissingCounterpart = regions.some(
    (region) => region.status === "counterpart_missing" || region.status === "missing",
  );
  const blockerCount =
    normalizeList(input.blockers).length +
    regions.reduce((sum, region) => sum + region.blockers.length, 0);

  return {
    contractVersion: NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_CONTRACT_VERSION,
    generatedAt: toText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    laneId: toText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: toText(input.selectedProfileId) ?? "unknown",
    chartId: toText(input.chartId) ?? "unknown",
    sourceModelId:
      toText(input.sourceModelId) ??
      toText(input.counterpartArtifact?.sourceAuthorityMode) ??
      null,
    ...(toText(input.sourceTensorArtifactRef) != null
      ? { sourceTensorArtifactRef: toText(input.sourceTensorArtifactRef) as string }
      : {}),
    ...(toText(input.counterpartArtifactRef) != null
      ? { counterpartArtifactRef: toText(input.counterpartArtifactRef) as string }
      : {}),
    ...(toText(input.tileSourceAuthorityHandoffRef) != null
      ? { tileSourceAuthorityHandoffRef: toText(input.tileSourceAuthorityHandoffRef) as string }
      : {}),
    ...(tileSourceAuthorityHandoff != null
      ? { tileSourceAuthorityHandoffStatus: tileSourceAuthorityHandoff.summary.handoffStatus }
      : {}),
    regions,
    summary: {
      hasWallAuthority,
      allRequiredRegionsAuthoritative:
        requiredRegions.length === requiredRegionIds.length &&
        requiredRegions.every((region) => region.status === "authoritative_same_basis") &&
        (tileSourceAuthorityHandoff == null || tileSourceHandoffReady),
      tileSourceHandoffReady,
      anyMetricEcho,
      anyProxy,
      anyMissingCounterpart,
      missingRegionIds,
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      doesNotValidatePhysicalSource: true,
      metricEchoForbidden: true,
      wallT00ClosureRequiresWallAuthority: true,
    },
  };
};

export const isNhm2SourceSideSameBasisTensorAuthorityArtifact = (
  value: unknown,
): value is Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 => {
  if (!isRecord(value)) return false;
  const summary = isRecord(value.summary) ? value.summary : null;
  const claimBoundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion ===
      NHM2_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY_CONTRACT_VERSION &&
    toText(value.generatedAt) != null &&
    toText(value.laneId) != null &&
    toText(value.selectedProfileId) != null &&
    toText(value.chartId) != null &&
    (value.sourceModelId === null || toText(value.sourceModelId) != null) &&
    (value.sourceTensorArtifactRef === undefined ||
      toText(value.sourceTensorArtifactRef) != null) &&
    (value.counterpartArtifactRef === undefined ||
      toText(value.counterpartArtifactRef) != null) &&
    (value.tileSourceAuthorityHandoffRef === undefined ||
      toText(value.tileSourceAuthorityHandoffRef) != null) &&
    (value.tileSourceAuthorityHandoffStatus === undefined ||
      toText(value.tileSourceAuthorityHandoffStatus) != null) &&
    Array.isArray(value.regions) &&
    value.regions.every((entry) => {
      const region = isRecord(entry) ? entry : null;
      return (
        region != null &&
        toText(region.regionId) != null &&
        normalizeStatus(region.status) != null &&
        (region.sourceTensorRef === null || toText(region.sourceTensorRef) != null) &&
        region.expectedMetricCounterpartRole === "tile_effective_counterpart" &&
        (region.comparisonRole === null || toText(region.comparisonRole) != null) &&
        (region.chartId === null || toText(region.chartId) != null) &&
        (region.basisRef === null || toText(region.basisRef) != null) &&
        (region.units === null || toText(region.units) != null) &&
        (region.regionMaskRef === null || toText(region.regionMaskRef) != null) &&
        (region.aggregationMode === null || toText(region.aggregationMode) != null) &&
        (region.normalizationBasis === null ||
          toText(region.normalizationBasis) != null) &&
        (region.tensorAuthorityMode === null ||
          toText(region.tensorAuthorityMode) != null) &&
        (region.derivationMode === null || toText(region.derivationMode) != null) &&
        (region.notDerivedFromMetricRequiredTensor === null ||
          typeof region.notDerivedFromMetricRequiredTensor === "boolean") &&
        typeof region.hasFullTensorComponents === "boolean" &&
        Array.isArray(region.missingComponentIds) &&
        region.missingComponentIds.every((component) => toText(component) != null) &&
        Array.isArray(region.blockers) &&
        region.blockers.every((blocker) => toText(blocker) != null) &&
        Array.isArray(region.warnings) &&
        region.warnings.every((warning) => toText(warning) != null)
      );
    }) &&
    summary != null &&
    typeof summary.hasWallAuthority === "boolean" &&
    typeof summary.allRequiredRegionsAuthoritative === "boolean" &&
    typeof summary.tileSourceHandoffReady === "boolean" &&
    typeof summary.anyMetricEcho === "boolean" &&
    typeof summary.anyProxy === "boolean" &&
    typeof summary.anyMissingCounterpart === "boolean" &&
    Array.isArray(summary.missingRegionIds) &&
    summary.missingRegionIds.every((entry) => toText(entry) != null) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.doesNotValidatePhysicalSource === true &&
    claimBoundary?.metricEchoForbidden === true &&
    claimBoundary?.wallT00ClosureRequiresWallAuthority === true
  );
};
