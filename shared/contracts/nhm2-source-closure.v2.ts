import {
  NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
  NHM2_SOURCE_CLOSURE_COMPONENTS,
  NHM2_SOURCE_CLOSURE_STATUS_VALUES,
  NHM2_SOURCE_CLOSURE_COMPLETENESS_VALUES,
  type Nhm2SourceClosureComponent,
  type Nhm2SourceClosureCompleteness,
  type Nhm2SourceClosureResidualComponent,
  type Nhm2SourceClosureResidualNorms,
  type Nhm2SourceClosureStatus,
  type Nhm2SourceClosureTensor,
  type Nhm2SourceClosureTensorInput,
  normalizeNhm2SourceClosureTensor,
} from "./nhm2-source-closure.v1";

export const NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION = "nhm2_source_closure/v2";

export const NHM2_SOURCE_CLOSURE_V2_REASON_CODES = [
  "metric_tensor_missing",
  "tile_tensor_missing",
  "metric_tensor_incomplete",
  "tile_tensor_incomplete",
  "tolerance_missing",
  "tensor_residual_exceeded",
  "assumption_drift",
  "region_metric_tensor_missing",
  "region_tile_tensor_missing",
  "region_metric_tensor_incomplete",
  "region_tile_tensor_incomplete",
  "region_basis_diagnostic_only",
] as const;

export const NHM2_SOURCE_CLOSURE_REGION_BASIS_STATUS_VALUES = [
  "same_basis",
  "diagnostic_only",
  "unavailable",
] as const;

export const NHM2_SOURCE_CLOSURE_REGION_AGGREGATION_MODE_VALUES = [
  "mean",
  "weighted_mean",
  "integral",
  "sum",
  "unknown",
] as const;

export const NHM2_SOURCE_CLOSURE_REGION_ACCOUNTING_EVIDENCE_VALUES = [
  "measured",
  "inferred",
  "unknown",
] as const;

export const NHM2_SOURCE_CLOSURE_REGION_T00_DERIVATION_MODE_VALUES = [
  "runtime_integrated_metric_region_mean",
  "gr_matter_brick_region_mean",
  "tensor_snapshot_inferred",
  "unknown",
] as const;

export const NHM2_SOURCE_CLOSURE_REGION_T00_TRACE_STAGE_VALUES = [
  "region_mean_from_shift_field",
  "region_mean_from_gr_matter_brick",
  "tensor_snapshot_fallback",
  "unknown",
] as const;

const NHM2_SOURCE_CLOSURE_PRESSURE_COMPONENTS = ["T11", "T22", "T33"] as const;

export type Nhm2SourceClosureV2ReasonCode =
  (typeof NHM2_SOURCE_CLOSURE_V2_REASON_CODES)[number];
export type Nhm2SourceClosureRegionBasisStatus =
  (typeof NHM2_SOURCE_CLOSURE_REGION_BASIS_STATUS_VALUES)[number];
export type Nhm2SourceClosureRegionAggregationMode =
  (typeof NHM2_SOURCE_CLOSURE_REGION_AGGREGATION_MODE_VALUES)[number];
export type Nhm2SourceClosureV2RegionAccountingEvidenceStatus =
  (typeof NHM2_SOURCE_CLOSURE_REGION_ACCOUNTING_EVIDENCE_VALUES)[number];
export type Nhm2SourceClosureV2RegionT00DerivationMode =
  (typeof NHM2_SOURCE_CLOSURE_REGION_T00_DERIVATION_MODE_VALUES)[number];
export type Nhm2SourceClosureV2RegionT00TraceStage =
  (typeof NHM2_SOURCE_CLOSURE_REGION_T00_TRACE_STAGE_VALUES)[number];
export type Nhm2SourceClosureV2RegionT00MechanismCategory =
  | "t00_mismatch_present"
  | "pressure_proxy_dominant"
  | "unknown"
  | "metric_required_evidence_unknown"
  | "tile_effective_evidence_unknown"
  | "accounting_suspect";
export type Nhm2SourceClosureV2RegionT00MechanismNextStep =
  | "direct_t00_source_model_mapping"
  | "pressure_proxy_mapping"
  | "mixed_followup"
  | "insufficient_evidence";
export type Nhm2SourceClosureV2RegionT00TraceDivergenceStage =
  | "mask_mismatch"
  | "aggregation_mismatch"
  | "source_path_mismatch"
  | "value_mismatch_after_same_trace"
  | "unknown";
export type Nhm2SourceClosureV2RegionT00TraceUpstreamMismatchClass =
  | "producer_function_mismatch"
  | "input_field_mismatch"
  | "derivative_source_mismatch"
  | "support_exclusion_mismatch"
  | "pressure_proxy_contamination"
  | "same_upstream_path_value_mismatch"
  | "unknown";
export type Nhm2SourceClosureV2RegionT00TraceSemanticMismatchClass =
  | "semantic_quantity_mismatch"
  | "construction_stage_mismatch"
  | "domain_mismatch"
  | "units_or_normalization_mismatch"
  | "same_semantic_target_value_mismatch"
  | "unknown";
export type Nhm2SourceClosureV2RegionT00TraceComparisonContractStatus =
  | "semantically_aligned"
  | "semantically_misaligned"
  | "alignment_unproven"
  | "unknown";
export type Nhm2SourceClosureV2RegionT00TraceContractMismatchClass =
  | "comparison_contract_mismatch"
  | "reconstruction_boundary_mismatch"
  | "domain_mapping_mismatch"
  | "same_contract_value_mismatch"
  | "unknown";

export type Nhm2SourceClosureV2RegionAccounting = {
  sampleCount: number | null;
  maskVoxelCount: number | null;
  weightSum: number | null;
  aggregationMode: Nhm2SourceClosureRegionAggregationMode;
  normalizationBasis: string | null;
  regionMaskNote: string | null;
  supportInclusionNote: string | null;
  evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
};

export type Nhm2SourceClosureV2RegionT00Trace = {
  regionMaskRef: string | null;
  sampleCount: number | null;
  normalizationBasis: string | null;
  aggregationMode: Nhm2SourceClosureRegionAggregationMode;
  valueRef: string | null;
  tensorRef: string | null;
  boundaryRef?: string | null;
  maskNote: string | null;
  supportInclusionNote: string | null;
  traceStage: Nhm2SourceClosureV2RegionT00TraceStage;
  pathFacts?: {
    producerModule: string | null;
    producerFunction: string | null;
    inputFieldRef: string | null;
    semanticQuantityRef: string | null;
    semanticQuantityKind: string | null;
    physicalMeaningRef: string | null;
    comparisonRole: string | null;
    expectedCounterpartRole: string | null;
    semanticEquivalenceExpected: boolean | null;
    reconstructionLayer: string | null;
    assumptionBoundaryRef: string | null;
    semanticAlignmentNote: string | null;
    upstreamValueType: string | null;
    constructionDomain: string | null;
    constructionStage: string | null;
    unitsRef: string | null;
    preAggregationValueRef: string | null;
    upstreamAssumptionNote: string | null;
    maskClassifierRef: string | null;
    voxelAveragingMode: string | null;
    derivativeSource: string | null;
    pressureProxyApplied: boolean | null;
    finiteDifferenceSource: string | null;
    samplingDomain: string | null;
    supportExclusionMode: string | null;
    normalizationRef: string | null;
  } | null;
};

export type Nhm2SourceClosureV2RegionT00Diagnostics = {
  sampleCount: number | null;
  includedCount: number | null;
  skippedCount: number | null;
  nonFiniteCount: number | null;
  meanT00: number | null;
  sumT00: number | null;
  sourceRef?: string | null;
  derivationMode?: Nhm2SourceClosureV2RegionT00DerivationMode;
  trace?: Nhm2SourceClosureV2RegionT00Trace | null;
  normalizationBasis: string | null;
  aggregationMode: Nhm2SourceClosureRegionAggregationMode;
  evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
};

export type Nhm2SourceClosureV2RegionProxyMode = "proxy" | "metric" | "unknown";
export type Nhm2SourceClosureV2RegionProxyConstructionMode =
  | "direct_region_mean_t00"
  | "proxy_scaled_from_region_mean_t00"
  | "unknown";

export type Nhm2SourceClosureV2RegionProxyComponentAttribution = {
  constructionMode: Nhm2SourceClosureV2RegionProxyConstructionMode;
  sourceComponent: Nhm2SourceClosureComponent | null;
  proxyFactor: number | null;
  proxyReconstructedValue: number | null;
  proxyReconstructionAbsError: number | null;
  proxyReconstructionRelError: number | null;
  evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
};

export type Nhm2SourceClosureV2RegionProxyDiagnostics = {
  pressureModel: string | null;
  pressureFactor: number | null;
  pressureSource: string | null;
  proxyMode: Nhm2SourceClosureV2RegionProxyMode;
  brickProxyMode: Nhm2SourceClosureV2RegionProxyMode;
  componentAttribution?: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureV2RegionProxyComponentAttribution
  > | null;
};

export type Nhm2SourceClosureV2RegionScaleComponent = {
  metricValue: number | null;
  tileValue: number | null;
  metricAbs: number | null;
  tileAbs: number | null;
  signedDelta: number | null;
  absDelta: number | null;
  ratioTileToMetric: number | null;
  ratioMetricToTile: number | null;
  signedRatioTileToMetric: number | null;
  signMatch: boolean | null;
};

export type Nhm2SourceClosureV2RegionMismatchDiagnostics = {
  diagonalMeanMetric: number | null;
  diagonalMeanTile: number | null;
  diagonalMeanSignedRatio: number | null;
  diagonalMeanMetricAbs: number | null;
  diagonalMeanTileAbs: number | null;
  diagonalMeanRatio: number | null;
  diagonalMeanSide: "metric" | "tile" | "tie" | null;
  diagonalSignStatus: "match" | "flip" | "mixed" | "unknown" | null;
  signMatchCount: number | null;
  signFlipCount: number | null;
  signUnknownCount: number | null;
  signFlipComponents: Nhm2SourceClosureComponent[];
  dominantComponent: Nhm2SourceClosureComponent | null;
  dominantAbsRatio: number | null;
  dominantSide: "metric" | "tile" | "tie" | null;
  t00MechanismCategory: Nhm2SourceClosureV2RegionT00MechanismCategory;
  t00MechanismEvidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
  t00MechanismNextStep: Nhm2SourceClosureV2RegionT00MechanismNextStep;
  t00TraceDivergenceStage: Nhm2SourceClosureV2RegionT00TraceDivergenceStage;
  t00TraceUpstreamMismatchClass: Nhm2SourceClosureV2RegionT00TraceUpstreamMismatchClass;
  t00TraceSemanticMismatchClass: Nhm2SourceClosureV2RegionT00TraceSemanticMismatchClass;
  t00TraceComparisonContractStatus: Nhm2SourceClosureV2RegionT00TraceComparisonContractStatus;
  t00TraceContractMismatchClass: Nhm2SourceClosureV2RegionT00TraceContractMismatchClass;
  t00TraceFirstSemanticBoundary: string | null;
  t00TraceNextInspectionTarget: string | null;
  components: Record<Nhm2SourceClosureComponent, Nhm2SourceClosureV2RegionScaleComponent>;
};

export type Nhm2SourceClosureV2RegionComparisonInput = {
  regionId: string;
  comparisonBasisStatus?: Nhm2SourceClosureRegionBasisStatus | null;
  metricTensorRef?: string | null;
  tileTensorRef?: string | null;
  metricRequiredTensor?: Nhm2SourceClosureTensorInput | null;
  tileEffectiveTensor?: Nhm2SourceClosureTensorInput | null;
  sampleCount?: number | null;
  metricAccounting?: Nhm2SourceClosureV2RegionAccounting | null;
  tileAccounting?: Nhm2SourceClosureV2RegionAccounting | null;
  metricT00Diagnostics?: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics?: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileProxyDiagnostics?: Nhm2SourceClosureV2RegionProxyDiagnostics | null;
  note?: string | null;
};

export type Nhm2SourceClosureV2RegionComparison = {
  regionId: string;
  comparisonBasisStatus: Nhm2SourceClosureRegionBasisStatus;
  status: Nhm2SourceClosureStatus;
  completeness: Nhm2SourceClosureCompleteness;
  metricTensorRef: string | null;
  tileTensorRef: string | null;
  metricRequiredTensor: Nhm2SourceClosureTensor;
  tileEffectiveTensor: Nhm2SourceClosureTensor;
  sampleCount: number | null;
  metricAccounting: Nhm2SourceClosureV2RegionAccounting | null;
  tileAccounting: Nhm2SourceClosureV2RegionAccounting | null;
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileProxyDiagnostics: Nhm2SourceClosureV2RegionProxyDiagnostics | null;
  mismatchDiagnostics: Nhm2SourceClosureV2RegionMismatchDiagnostics | null;
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >;
  residualNorms: Nhm2SourceClosureResidualNorms;
  dominantResidualComponent: Nhm2SourceClosureComponent | null;
  dominantResidualAbs: number | null;
  dominantResidualRel: number | null;
  note: string | null;
};

export type Nhm2SourceClosureV2Artifact = {
  artifactId: typeof NHM2_SOURCE_CLOSURE_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION;
  status: Nhm2SourceClosureStatus;
  completeness: Nhm2SourceClosureCompleteness;
  reasonCodes: Nhm2SourceClosureV2ReasonCode[];
  comparedComponents: readonly Nhm2SourceClosureComponent[];
  tensorRefs: {
    metricRequired: string | null;
    tileEffective: string | null;
  };
  tensors: {
    metricRequired: Nhm2SourceClosureTensor;
    tileEffective: Nhm2SourceClosureTensor;
  };
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >;
  residualNorms: Nhm2SourceClosureResidualNorms;
  regionComparisons: {
    status: "available" | "unavailable";
    requiredRegionIds: string[];
    regions: Nhm2SourceClosureV2RegionComparison[];
  };
  scalarProjections: {
    cl3RhoDeltaRel: number | null;
    metricVsTileT00Rel: number | null;
    traceRel: number | null;
    isotropicPressureRel: number | null;
  };
  distinction: {
    scalarCongruenceSecondary: true;
    scalarSurfaceId: "CL3_RhoDelta";
    tensorSurfaceId: typeof NHM2_SOURCE_CLOSURE_ARTIFACT_ID;
  };
  assumptionsDrifted: boolean | null;
};

export type BuildNhm2SourceClosureArtifactV2Input = {
  metricTensorRef?: string | null;
  tileEffectiveTensorRef?: string | null;
  metricRequiredTensor?: Nhm2SourceClosureTensorInput | null;
  tileEffectiveTensor?: Nhm2SourceClosureTensorInput | null;
  requiredRegionIds?: string[] | null;
  regionComparisons?: Nhm2SourceClosureV2RegionComparisonInput[] | null;
  toleranceRelLInf?: number | null;
  scalarCl3RhoDeltaRel?: number | null;
  assumptionsDrifted?: boolean | null;
};

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toFiniteOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toRepoPath = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim().replace(/\\/g, "/")
    : null;

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const tensorHasAnyComponent = (tensor: Nhm2SourceClosureTensor): boolean =>
  NHM2_SOURCE_CLOSURE_COMPONENTS.some((component) => tensor[component] != null);

const missingComponents = (
  tensor: Nhm2SourceClosureTensor,
): Nhm2SourceClosureComponent[] =>
  NHM2_SOURCE_CLOSURE_COMPONENTS.filter((component) => tensor[component] == null);

const relDelta = (value: number, baseline: number, eps = 1e-12): number =>
  Math.abs(value - baseline) / Math.max(Math.abs(baseline), eps);

const relRatio = (value: number, baseline: number, eps = 1e-12): number =>
  Math.abs(value) / Math.max(Math.abs(baseline), eps);

const hasConsistentMeanSampleCount = (
  sampleCount: number | null,
  weightSum: number | null,
  tolerance = 1e-9,
): boolean => {
  if (sampleCount == null || weightSum == null) return false;
  if (sampleCount === 0 && weightSum === 0) return true;
  return relDelta(weightSum, sampleCount, 1e-12) <= tolerance;
};

const isAccountingConsistencyVerified = (
  accounting: Nhm2SourceClosureV2RegionAccounting,
): boolean => {
  if (
    accounting.aggregationMode === "mean" &&
    accounting.normalizationBasis === "sample_count"
  ) {
    return hasConsistentMeanSampleCount(
      accounting.sampleCount,
      accounting.weightSum,
    );
  }
  return false;
};

const buildResidualComponents = (
  metricTensor: Nhm2SourceClosureTensor,
  tileTensor: Nhm2SourceClosureTensor,
): Record<Nhm2SourceClosureComponent, Nhm2SourceClosureResidualComponent> => {
  const entries = NHM2_SOURCE_CLOSURE_COMPONENTS.map((component) => {
    const metricRequired = metricTensor[component];
    const tileEffective = tileTensor[component];
    const absResidual =
      metricRequired != null && tileEffective != null
        ? Math.abs(metricRequired - tileEffective)
        : null;
    const relResidual =
      metricRequired != null && tileEffective != null
        ? relDelta(tileEffective, metricRequired)
        : null;
    return [
      component,
      {
        metricRequired,
        tileEffective,
        absResidual,
        relResidual,
      },
    ] as const;
  });

  return Object.fromEntries(entries) as Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >;
};

const resolveDominantResidualComponent = (
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >,
): {
  component: Nhm2SourceClosureComponent | null;
  absResidual: number | null;
  relResidual: number | null;
} => {
  let component: Nhm2SourceClosureComponent | null = null;
  let absResidual: number | null = null;
  let relResidual: number | null = null;

  for (const candidate of NHM2_SOURCE_CLOSURE_COMPONENTS) {
    const entry = residualComponents[candidate];
    const candidateAbs = toFinite(entry.absResidual);
    const candidateRel = toFinite(entry.relResidual);
    if (candidateAbs == null && candidateRel == null) continue;
    if (component == null) {
      component = candidate;
      absResidual = candidateAbs;
      relResidual = candidateRel;
      continue;
    }
    if (candidateRel != null) {
      if (relResidual == null || candidateRel > relResidual) {
        component = candidate;
        absResidual = candidateAbs;
        relResidual = candidateRel;
      }
      continue;
    }
    if (relResidual == null && candidateAbs != null) {
      if (absResidual == null || candidateAbs > absResidual) {
        component = candidate;
        absResidual = candidateAbs;
        relResidual = candidateRel;
      }
    }
  }

  return {
    component,
    absResidual,
    relResidual,
  };
};

const buildResidualNorms = (
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >,
  toleranceRelLInf: number | null,
): Nhm2SourceClosureResidualNorms => {
  const absResiduals = NHM2_SOURCE_CLOSURE_COMPONENTS.map(
    (component) => residualComponents[component].absResidual,
  );
  const relResiduals = NHM2_SOURCE_CLOSURE_COMPONENTS.map(
    (component) => residualComponents[component].relResidual,
  );

  if (
    absResiduals.some((value) => value == null) ||
    relResiduals.some((value) => value == null)
  ) {
    return {
      absL1: null,
      absL2: null,
      absLInf: null,
      relL1: null,
      relL2: null,
      relLInf: null,
      toleranceRelLInf,
      pass: null,
    };
  }

  const absValues = absResiduals as number[];
  const relValues = relResiduals as number[];
  const absL1 = absValues.reduce((sum, value) => sum + Math.abs(value), 0);
  const absL2 = Math.sqrt(
    absValues.reduce((sum, value) => sum + value * value, 0),
  );
  const absLInf = absValues.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    0,
  );
  const relL1 = relValues.reduce((sum, value) => sum + Math.abs(value), 0);
  const relL2 = Math.sqrt(
    relValues.reduce((sum, value) => sum + value * value, 0),
  );
  const relLInf = relValues.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    0,
  );

  return {
    absL1,
    absL2,
    absLInf,
    relL1,
    relL2,
    relLInf,
    toleranceRelLInf,
    pass:
      toleranceRelLInf != null ? relLInf <= Math.max(0, toleranceRelLInf) : null,
  };
};

const buildScalarProjections = (args: {
  metricTensor: Nhm2SourceClosureTensor;
  tileTensor: Nhm2SourceClosureTensor;
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >;
  scalarCl3RhoDeltaRel: number | null;
}) => {
  const metricTrace = NHM2_SOURCE_CLOSURE_COMPONENTS.reduce(
    (sum, component) => sum + (args.metricTensor[component] ?? 0),
    0,
  );
  const tileTrace = NHM2_SOURCE_CLOSURE_COMPONENTS.reduce(
    (sum, component) => sum + (args.tileTensor[component] ?? 0),
    0,
  );
  const metricPressure = [
    args.metricTensor.T11,
    args.metricTensor.T22,
    args.metricTensor.T33,
  ];
  const tilePressure = [
    args.tileTensor.T11,
    args.tileTensor.T22,
    args.tileTensor.T33,
  ];
  const metricPressureMean =
    metricPressure.every((value) => value != null)
      ? (metricPressure[0]! + metricPressure[1]! + metricPressure[2]!) / 3
      : null;
  const tilePressureMean =
    tilePressure.every((value) => value != null)
      ? (tilePressure[0]! + tilePressure[1]! + tilePressure[2]!) / 3
      : null;

  return {
    cl3RhoDeltaRel: args.scalarCl3RhoDeltaRel,
    metricVsTileT00Rel: args.residualComponents.T00.relResidual,
    traceRel:
      tensorHasAnyComponent(args.metricTensor) && tensorHasAnyComponent(args.tileTensor)
        ? relDelta(tileTrace, metricTrace)
        : null,
    isotropicPressureRel:
      metricPressureMean != null && tilePressureMean != null
        ? relDelta(tilePressureMean, metricPressureMean)
        : null,
  };
};

const normalizeRegionBasisStatus = (
  value: unknown,
): Nhm2SourceClosureRegionBasisStatus =>
  value === "same_basis" ||
  value === "diagnostic_only" ||
  value === "unavailable"
    ? value
    : "unavailable";

const normalizeRegionAggregationMode = (
  value: unknown,
): Nhm2SourceClosureRegionAggregationMode =>
  NHM2_SOURCE_CLOSURE_REGION_AGGREGATION_MODE_VALUES.includes(
    value as Nhm2SourceClosureRegionAggregationMode,
  )
    ? (value as Nhm2SourceClosureRegionAggregationMode)
    : "unknown";

const normalizeAccountingEvidenceStatus = (
  value: unknown,
): Nhm2SourceClosureV2RegionAccountingEvidenceStatus =>
  NHM2_SOURCE_CLOSURE_REGION_ACCOUNTING_EVIDENCE_VALUES.includes(
    value as Nhm2SourceClosureV2RegionAccountingEvidenceStatus,
  )
    ? (value as Nhm2SourceClosureV2RegionAccountingEvidenceStatus)
    : "unknown";

const normalizeRegionAccounting = (
  value: Nhm2SourceClosureV2RegionAccounting | null | undefined,
): Nhm2SourceClosureV2RegionAccounting | null => {
  if (!value) return null;
  const normalized: Nhm2SourceClosureV2RegionAccounting = {
    sampleCount: toFiniteOrNull(value.sampleCount),
    maskVoxelCount: toFiniteOrNull(value.maskVoxelCount),
    weightSum: toFiniteOrNull(value.weightSum),
    aggregationMode: normalizeRegionAggregationMode(value.aggregationMode),
    normalizationBasis: toText(value.normalizationBasis),
    regionMaskNote: toText(value.regionMaskNote),
    supportInclusionNote: toText(value.supportInclusionNote),
    evidenceStatus: normalizeAccountingEvidenceStatus(value.evidenceStatus),
  };
  if (normalized.evidenceStatus === "measured") {
    const hasMeasuredEvidence =
      normalized.sampleCount != null &&
      normalized.weightSum != null &&
      normalized.aggregationMode !== "unknown" &&
      normalized.normalizationBasis != null;
    if (!hasMeasuredEvidence || !isAccountingConsistencyVerified(normalized)) {
      normalized.evidenceStatus = "unknown";
    }
  }
  return normalized;
};

const normalizeRegionT00Diagnostics = (
  value: Nhm2SourceClosureV2RegionT00Diagnostics | null | undefined,
): Nhm2SourceClosureV2RegionT00Diagnostics | null => {
  if (!value) return null;
  const normalized: Nhm2SourceClosureV2RegionT00Diagnostics = {
    sampleCount: toFiniteOrNull(value.sampleCount),
    includedCount: toFiniteOrNull(value.includedCount),
    skippedCount: toFiniteOrNull(value.skippedCount),
    nonFiniteCount: toFiniteOrNull(value.nonFiniteCount),
    meanT00: toFiniteOrNull(value.meanT00),
    sumT00: toFiniteOrNull(value.sumT00),
    sourceRef: toText(value.sourceRef),
    derivationMode: normalizeT00DerivationMode(value.derivationMode),
    trace: normalizeRegionT00Trace(value.trace),
    normalizationBasis: toText(value.normalizationBasis),
    aggregationMode: normalizeRegionAggregationMode(value.aggregationMode),
    evidenceStatus: normalizeAccountingEvidenceStatus(value.evidenceStatus),
  };
  if (normalized.evidenceStatus === "measured") {
    const hasRequiredMeasuredFields =
      normalized.sampleCount != null &&
      normalized.meanT00 != null &&
      normalized.aggregationMode !== "unknown";
    if (!hasRequiredMeasuredFields) {
      normalized.evidenceStatus = "unknown";
    }
  }
  return normalized;
};

const normalizeT00DerivationMode = (
  value: unknown,
): Nhm2SourceClosureV2RegionT00DerivationMode =>
  value === "runtime_integrated_metric_region_mean" ||
  value === "gr_matter_brick_region_mean" ||
  value === "tensor_snapshot_inferred" ||
  value === "unknown"
    ? value
    : "unknown";

const normalizeT00TraceStage = (
  value: unknown,
): Nhm2SourceClosureV2RegionT00TraceStage =>
  value === "region_mean_from_shift_field" ||
  value === "region_mean_from_gr_matter_brick" ||
  value === "tensor_snapshot_fallback" ||
  value === "unknown"
    ? value
    : "unknown";

const normalizeRegionT00Trace = (
  value: Nhm2SourceClosureV2RegionT00Trace | null | undefined,
): Nhm2SourceClosureV2RegionT00Trace | null => {
  if (!value) return null;
  return {
    regionMaskRef: toText(value.regionMaskRef),
    sampleCount: toFiniteOrNull(value.sampleCount),
    normalizationBasis: toText(value.normalizationBasis),
    aggregationMode: normalizeRegionAggregationMode(value.aggregationMode),
    valueRef: toText(value.valueRef),
    tensorRef: toText(value.tensorRef),
    boundaryRef: toText(value.boundaryRef),
    maskNote: toText(value.maskNote),
    supportInclusionNote: toText(value.supportInclusionNote),
    traceStage: normalizeT00TraceStage(value.traceStage),
    pathFacts: normalizeRegionT00PathFacts(value.pathFacts),
  };
};

const normalizeRegionT00PathFacts = (
  value: Nhm2SourceClosureV2RegionT00Trace["pathFacts"],
): NonNullable<Nhm2SourceClosureV2RegionT00Trace["pathFacts"]> | null => {
  if (!value) return null;
  return {
    producerModule: toRepoPath(value.producerModule),
    producerFunction: toText(value.producerFunction),
    inputFieldRef: toText(value.inputFieldRef),
    semanticQuantityRef: toText(value.semanticQuantityRef),
    semanticQuantityKind: toText(value.semanticQuantityKind),
    physicalMeaningRef: toText(value.physicalMeaningRef),
    comparisonRole: toText(value.comparisonRole),
    expectedCounterpartRole: toText(value.expectedCounterpartRole),
    semanticEquivalenceExpected:
      typeof value.semanticEquivalenceExpected === "boolean"
        ? value.semanticEquivalenceExpected
        : null,
    reconstructionLayer: toText(value.reconstructionLayer),
    assumptionBoundaryRef: toRepoPath(value.assumptionBoundaryRef),
    semanticAlignmentNote: toText(value.semanticAlignmentNote),
    upstreamValueType: toText(value.upstreamValueType),
    constructionDomain: toText(value.constructionDomain),
    constructionStage: toText(value.constructionStage),
    unitsRef: toText(value.unitsRef),
    preAggregationValueRef: toText(value.preAggregationValueRef),
    upstreamAssumptionNote: toText(value.upstreamAssumptionNote),
    maskClassifierRef: toText(value.maskClassifierRef),
    voxelAveragingMode: toText(value.voxelAveragingMode),
    derivativeSource: toText(value.derivativeSource),
    pressureProxyApplied:
      typeof value.pressureProxyApplied === "boolean" ? value.pressureProxyApplied : null,
    finiteDifferenceSource: toText(value.finiteDifferenceSource),
    samplingDomain: toText(value.samplingDomain),
    supportExclusionMode: toText(value.supportExclusionMode),
    normalizationRef: toText(value.normalizationRef),
  };
};

const normalizeProxyMode = (
  value: unknown,
): Nhm2SourceClosureV2RegionProxyMode =>
  value === "proxy" || value === "metric" || value === "unknown"
    ? value
    : "unknown";

const normalizeProxyConstructionMode = (
  value: unknown,
): Nhm2SourceClosureV2RegionProxyConstructionMode =>
  value === "direct_region_mean_t00" ||
  value === "proxy_scaled_from_region_mean_t00" ||
  value === "unknown"
    ? value
    : "unknown";

const normalizeProxySourceComponent = (
  value: unknown,
): Nhm2SourceClosureComponent | null =>
  NHM2_SOURCE_CLOSURE_COMPONENTS.includes(
    value as Nhm2SourceClosureComponent,
  )
    ? (value as Nhm2SourceClosureComponent)
    : null;

const buildUnknownProxyComponentAttribution =
  (): Nhm2SourceClosureV2RegionProxyComponentAttribution => ({
    constructionMode: "unknown",
    sourceComponent: null,
    proxyFactor: null,
    proxyReconstructedValue: null,
    proxyReconstructionAbsError: null,
    proxyReconstructionRelError: null,
    evidenceStatus: "unknown",
  });

const normalizeProxyComponentAttribution = (
  value: unknown,
): Nhm2SourceClosureV2RegionProxyComponentAttribution => {
  if (!value || typeof value !== "object") {
    return buildUnknownProxyComponentAttribution();
  }
  const record = value as Record<string, unknown>;
  return {
    constructionMode: normalizeProxyConstructionMode(record.constructionMode),
    sourceComponent: normalizeProxySourceComponent(record.sourceComponent),
    proxyFactor: toFiniteOrNull(record.proxyFactor),
    proxyReconstructedValue: toFiniteOrNull(record.proxyReconstructedValue),
    proxyReconstructionAbsError: toFiniteOrNull(record.proxyReconstructionAbsError),
    proxyReconstructionRelError: toFiniteOrNull(record.proxyReconstructionRelError),
    evidenceStatus: normalizeAccountingEvidenceStatus(record.evidenceStatus),
  };
};

const normalizeProxyComponentAttributionMap = (
  value: unknown,
): Record<
  Nhm2SourceClosureComponent,
  Nhm2SourceClosureV2RegionProxyComponentAttribution
> | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const normalized = {} as Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureV2RegionProxyComponentAttribution
  >;
  for (const component of NHM2_SOURCE_CLOSURE_COMPONENTS) {
    normalized[component] = normalizeProxyComponentAttribution(record[component]);
  }
  return normalized;
};

const normalizeProxyDiagnostics = (
  value: Nhm2SourceClosureV2RegionProxyDiagnostics | null | undefined,
): Nhm2SourceClosureV2RegionProxyDiagnostics | null => {
  if (!value) return null;
  return {
    pressureModel: toText(value.pressureModel),
    pressureFactor: toFiniteOrNull(value.pressureFactor),
    pressureSource: toText(value.pressureSource),
    proxyMode: normalizeProxyMode(value.proxyMode),
    brickProxyMode: normalizeProxyMode(value.brickProxyMode),
    componentAttribution: normalizeProxyComponentAttributionMap(
      value.componentAttribution,
    ),
  };
};

const buildMismatchDiagnostics = (
  metricTensor: Nhm2SourceClosureTensor,
  tileTensor: Nhm2SourceClosureTensor,
): Nhm2SourceClosureV2RegionMismatchDiagnostics | null => {
  if (!tensorHasAnyComponent(metricTensor) && !tensorHasAnyComponent(tileTensor)) {
    return null;
  }
  const eps = 1e-12;
  const components = {} as Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureV2RegionScaleComponent
  >;
  const metricSignedValues: number[] = [];
  const tileSignedValues: number[] = [];
  const metricAbsValues: number[] = [];
  const tileAbsValues: number[] = [];
  const signFlipComponents: Nhm2SourceClosureComponent[] = [];
  let signMatchCount = 0;
  let signFlipCount = 0;
  let signUnknownCount = 0;
  let dominantComponent: Nhm2SourceClosureComponent | null = null;
  let dominantAbsRatio: number | null = null;
  let dominantSide: "metric" | "tile" | "tie" | null = null;

  for (const component of NHM2_SOURCE_CLOSURE_COMPONENTS) {
    const metricValue = metricTensor[component];
    const tileValue = tileTensor[component];
    const metricAbs = metricValue != null ? Math.abs(metricValue) : null;
    const tileAbs = tileValue != null ? Math.abs(tileValue) : null;
    const signedDelta =
      metricValue != null && tileValue != null ? tileValue - metricValue : null;
    const absDelta = signedDelta != null ? Math.abs(signedDelta) : null;
    const ratioTileToMetric =
      metricAbs != null && tileAbs != null
        ? relRatio(tileAbs, metricAbs, eps)
        : null;
    const ratioMetricToTile =
      metricAbs != null && tileAbs != null
        ? relRatio(metricAbs, tileAbs, eps)
        : null;
    const signedRatioTileToMetric =
      metricValue != null &&
      tileValue != null &&
      Math.abs(metricValue) > eps
        ? tileValue / metricValue
        : null;
    let signMatch: boolean | null = null;
    if (
      metricValue != null &&
      tileValue != null &&
      Math.abs(metricValue) > eps &&
      Math.abs(tileValue) > eps
    ) {
      signMatch = Math.sign(metricValue) === Math.sign(tileValue);
      if (signMatch) {
        signMatchCount += 1;
      } else {
        signFlipCount += 1;
        signFlipComponents.push(component);
      }
    } else {
      signUnknownCount += 1;
    }

    components[component] = {
      metricValue,
      tileValue,
      metricAbs,
      tileAbs,
      signedDelta,
      absDelta,
      ratioTileToMetric,
      ratioMetricToTile,
      signedRatioTileToMetric,
      signMatch,
    };

    if (metricValue != null) metricSignedValues.push(metricValue);
    if (tileValue != null) tileSignedValues.push(tileValue);
    if (metricAbs != null) metricAbsValues.push(metricAbs);
    if (tileAbs != null) tileAbsValues.push(tileAbs);

    if (ratioTileToMetric != null) {
      const absRatio =
        ratioTileToMetric >= 1 ? ratioTileToMetric : 1 / ratioTileToMetric;
      if (dominantAbsRatio == null || absRatio > dominantAbsRatio) {
        dominantComponent = component;
        dominantAbsRatio = absRatio;
        dominantSide =
          Math.abs(ratioTileToMetric - 1) <= eps
            ? "tie"
            : ratioTileToMetric > 1
              ? "tile"
              : "metric";
      }
    }
  }

  const diagonalMeanMetric =
    metricSignedValues.length > 0
      ? metricSignedValues.reduce((sum, value) => sum + value, 0) /
        metricSignedValues.length
      : null;
  const diagonalMeanTile =
    tileSignedValues.length > 0
      ? tileSignedValues.reduce((sum, value) => sum + value, 0) /
        tileSignedValues.length
      : null;
  const diagonalMeanSignedRatio =
    diagonalMeanMetric != null &&
    diagonalMeanTile != null &&
    Math.abs(diagonalMeanMetric) > eps
      ? diagonalMeanTile / diagonalMeanMetric
      : null;
  const diagonalMeanMetricAbs =
    metricAbsValues.length > 0
      ? metricAbsValues.reduce((sum, value) => sum + value, 0) /
        metricAbsValues.length
      : null;
  const diagonalMeanTileAbs =
    tileAbsValues.length > 0
      ? tileAbsValues.reduce((sum, value) => sum + value, 0) / tileAbsValues.length
      : null;
  const diagonalMeanRatio =
    diagonalMeanMetricAbs != null && diagonalMeanTileAbs != null
      ? relRatio(diagonalMeanTileAbs, diagonalMeanMetricAbs, eps)
      : null;
  const diagonalMeanSide =
    diagonalMeanRatio == null
      ? null
      : Math.abs(diagonalMeanRatio - 1) <= eps
        ? "tie"
        : diagonalMeanRatio > 1
          ? "tile"
          : "metric";
  const diagonalSignStatus =
    signMatchCount === 0 && signFlipCount === 0
      ? "unknown"
      : signFlipCount === 0
        ? "match"
        : signMatchCount === 0
          ? "flip"
          : "mixed";
  const totalSignObservations =
    signMatchCount + signFlipCount + signUnknownCount;

  return {
    diagonalMeanMetric,
    diagonalMeanTile,
    diagonalMeanSignedRatio,
    diagonalMeanMetricAbs,
    diagonalMeanTileAbs,
    diagonalMeanRatio,
    diagonalMeanSide,
    diagonalSignStatus,
    signMatchCount: totalSignObservations > 0 ? signMatchCount : null,
    signFlipCount: totalSignObservations > 0 ? signFlipCount : null,
    signUnknownCount: totalSignObservations > 0 ? signUnknownCount : null,
    signFlipComponents,
    dominantComponent,
    dominantAbsRatio,
    dominantSide,
    t00MechanismCategory: "unknown",
    t00MechanismEvidenceStatus: "unknown",
    t00MechanismNextStep: "insufficient_evidence",
    t00TraceDivergenceStage: "unknown",
    t00TraceUpstreamMismatchClass: "unknown",
    t00TraceSemanticMismatchClass: "unknown",
    t00TraceComparisonContractStatus: "unknown",
    t00TraceContractMismatchClass: "unknown",
    t00TraceFirstSemanticBoundary: null,
    t00TraceNextInspectionTarget: null,
    components,
  };
};

export const computeNhm2PressureSignificanceFloor = (
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >,
  eps = 1e-12,
): number => {
  const pressureMagnitudeScale = NHM2_SOURCE_CLOSURE_PRESSURE_COMPONENTS.reduce(
    (best, component) => {
      const metricAbs = Math.abs(residualComponents[component]?.metricRequired ?? 0);
      const tileAbs = Math.abs(residualComponents[component]?.tileEffective ?? 0);
      return Math.max(best, metricAbs, tileAbs);
    },
    0,
  );
  return Math.max(eps, pressureMagnitudeScale * Number.EPSILON * 16);
};

const resolveT00MechanismNextStep = (args: {
  category: Nhm2SourceClosureV2RegionT00MechanismCategory;
  evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
}): Nhm2SourceClosureV2RegionT00MechanismNextStep => {
  const { category, evidenceStatus } = args;
  if (evidenceStatus === "unknown") {
    return "insufficient_evidence";
  }
  if (category === "t00_mismatch_present") {
    return "direct_t00_source_model_mapping";
  }
  if (category === "pressure_proxy_dominant") {
    return "pressure_proxy_mapping";
  }
  return "insufficient_evidence";
};

const resolveT00TraceDivergenceStage = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): Nhm2SourceClosureV2RegionT00TraceDivergenceStage => {
  const metricT00Diagnostics = args.metricT00Diagnostics;
  const tileT00Diagnostics = args.tileT00Diagnostics;
  const metricTrace = metricT00Diagnostics?.trace ?? null;
  const tileTrace = tileT00Diagnostics?.trace ?? null;
  if (!metricTrace || !tileTrace) {
    return "unknown";
  }

  const metricMaskRef = metricTrace.regionMaskRef;
  const tileMaskRef = tileTrace.regionMaskRef;
  if (metricMaskRef != null && tileMaskRef != null && metricMaskRef !== tileMaskRef) {
    return "mask_mismatch";
  }

  const aggregationMismatch =
    metricTrace.aggregationMode !== "unknown" &&
    tileTrace.aggregationMode !== "unknown" &&
    metricTrace.aggregationMode !== tileTrace.aggregationMode;
  const normalizationMismatch =
    metricTrace.normalizationBasis != null &&
    tileTrace.normalizationBasis != null &&
    metricTrace.normalizationBasis !== tileTrace.normalizationBasis;
  if (aggregationMismatch || normalizationMismatch) {
    return "aggregation_mismatch";
  }

  const traceStageMismatch =
    metricTrace.traceStage !== "unknown" &&
    tileTrace.traceStage !== "unknown" &&
    metricTrace.traceStage !== tileTrace.traceStage;
  const derivationModeMismatch =
    metricT00Diagnostics?.derivationMode != null &&
    tileT00Diagnostics?.derivationMode != null &&
    metricT00Diagnostics.derivationMode !== "unknown" &&
    tileT00Diagnostics.derivationMode !== "unknown" &&
    metricT00Diagnostics.derivationMode !== tileT00Diagnostics.derivationMode;
  if (traceStageMismatch || derivationModeMismatch) {
    return "source_path_mismatch";
  }

  const metricMean = metricT00Diagnostics?.meanT00 ?? null;
  const tileMean = tileT00Diagnostics?.meanT00 ?? null;
  if (metricMean != null && tileMean != null && Math.abs(tileMean - metricMean) > 1e-12) {
    return "value_mismatch_after_same_trace";
  }

  return "unknown";
};

const resolveT00TraceUpstreamMismatchClass = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): Nhm2SourceClosureV2RegionT00TraceUpstreamMismatchClass => {
  const metricT00Diagnostics = args.metricT00Diagnostics;
  const tileT00Diagnostics = args.tileT00Diagnostics;
  const metricTrace = metricT00Diagnostics?.trace ?? null;
  const tileTrace = tileT00Diagnostics?.trace ?? null;
  const metricFacts = metricTrace?.pathFacts ?? null;
  const tileFacts = tileTrace?.pathFacts ?? null;
  if (!metricTrace || !tileTrace || !metricFacts || !tileFacts) {
    return "unknown";
  }

  const factsDiffer = (
    metricValue: string | boolean | null | undefined,
    tileValue: string | boolean | null | undefined,
  ): boolean => metricValue != null && tileValue != null && metricValue !== tileValue;

  if (
    metricFacts.pressureProxyApplied === true ||
    tileFacts.pressureProxyApplied === true
  ) {
    return "pressure_proxy_contamination";
  }

  if (factsDiffer(metricFacts.inputFieldRef, tileFacts.inputFieldRef)) {
    return "input_field_mismatch";
  }

  if (
    factsDiffer(metricFacts.derivativeSource, tileFacts.derivativeSource) ||
    factsDiffer(metricFacts.finiteDifferenceSource, tileFacts.finiteDifferenceSource)
  ) {
    return "derivative_source_mismatch";
  }

  if (
    factsDiffer(metricFacts.maskClassifierRef, tileFacts.maskClassifierRef) ||
    factsDiffer(metricFacts.voxelAveragingMode, tileFacts.voxelAveragingMode) ||
    factsDiffer(metricFacts.supportExclusionMode, tileFacts.supportExclusionMode) ||
    factsDiffer(metricFacts.normalizationRef, tileFacts.normalizationRef)
  ) {
    return "support_exclusion_mismatch";
  }

  if (
    factsDiffer(metricFacts.producerModule, tileFacts.producerModule) ||
    factsDiffer(metricFacts.producerFunction, tileFacts.producerFunction)
  ) {
    return "producer_function_mismatch";
  }

  const metricMean = metricT00Diagnostics?.meanT00 ?? null;
  const tileMean = tileT00Diagnostics?.meanT00 ?? null;
  if (metricMean != null && tileMean != null && Math.abs(tileMean - metricMean) > 1e-12) {
    return "same_upstream_path_value_mismatch";
  }

  return "unknown";
};

const resolveT00TraceSemanticMismatchClass = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): Nhm2SourceClosureV2RegionT00TraceSemanticMismatchClass => {
  const metricT00Diagnostics = args.metricT00Diagnostics;
  const tileT00Diagnostics = args.tileT00Diagnostics;
  const metricTrace = metricT00Diagnostics?.trace ?? null;
  const tileTrace = tileT00Diagnostics?.trace ?? null;
  const metricFacts = metricTrace?.pathFacts ?? null;
  const tileFacts = tileTrace?.pathFacts ?? null;
  if (!metricTrace || !tileTrace || !metricFacts || !tileFacts) {
    return "unknown";
  }

  const factsDiffer = (
    metricValue: string | null | undefined,
    tileValue: string | null | undefined,
  ): boolean => metricValue != null && tileValue != null && metricValue !== tileValue;

  if (
    factsDiffer(metricFacts.semanticQuantityRef, tileFacts.semanticQuantityRef) ||
    factsDiffer(metricFacts.semanticQuantityKind, tileFacts.semanticQuantityKind) ||
    factsDiffer(metricFacts.upstreamValueType, tileFacts.upstreamValueType)
  ) {
    return "semantic_quantity_mismatch";
  }

  if (factsDiffer(metricFacts.constructionStage, tileFacts.constructionStage)) {
    return "construction_stage_mismatch";
  }

  if (factsDiffer(metricFacts.constructionDomain, tileFacts.constructionDomain)) {
    return "domain_mismatch";
  }

  if (
    factsDiffer(metricFacts.unitsRef, tileFacts.unitsRef) ||
    factsDiffer(metricFacts.normalizationRef, tileFacts.normalizationRef)
  ) {
    return "units_or_normalization_mismatch";
  }

  const metricMean = metricT00Diagnostics?.meanT00 ?? null;
  const tileMean = tileT00Diagnostics?.meanT00 ?? null;
  if (metricMean != null && tileMean != null && Math.abs(tileMean - metricMean) > 1e-12) {
    return "same_semantic_target_value_mismatch";
  }

  return "unknown";
};

const resolveT00TraceComparisonContractStatus = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): Nhm2SourceClosureV2RegionT00TraceComparisonContractStatus => {
  const metricFacts = args.metricT00Diagnostics?.trace?.pathFacts ?? null;
  const tileFacts = args.tileT00Diagnostics?.trace?.pathFacts ?? null;
  if (!metricFacts || !tileFacts) {
    return "unknown";
  }

  const factsDiffer = (
    metricValue: string | null | undefined,
    tileValue: string | null | undefined,
  ): boolean => metricValue != null && tileValue != null && metricValue !== tileValue;

  const metricRoleMatches =
    metricFacts.expectedCounterpartRole != null && tileFacts.comparisonRole != null
      ? metricFacts.expectedCounterpartRole === tileFacts.comparisonRole
      : null;
  const tileRoleMatches =
    tileFacts.expectedCounterpartRole != null && metricFacts.comparisonRole != null
      ? tileFacts.expectedCounterpartRole === metricFacts.comparisonRole
      : null;

  if (
    metricFacts.semanticEquivalenceExpected === false ||
    tileFacts.semanticEquivalenceExpected === false ||
    metricRoleMatches === false ||
    tileRoleMatches === false
  ) {
    return "semantically_misaligned";
  }

  if (
    metricFacts.semanticEquivalenceExpected === true &&
    tileFacts.semanticEquivalenceExpected === true &&
    metricRoleMatches === true &&
    tileRoleMatches === true &&
    !factsDiffer(metricFacts.physicalMeaningRef, tileFacts.physicalMeaningRef) &&
    !factsDiffer(metricFacts.semanticQuantityRef, tileFacts.semanticQuantityRef) &&
    !factsDiffer(metricFacts.semanticQuantityKind, tileFacts.semanticQuantityKind)
  ) {
    return "semantically_aligned";
  }

  if (
    metricFacts.semanticEquivalenceExpected != null ||
    tileFacts.semanticEquivalenceExpected != null ||
    metricFacts.expectedCounterpartRole != null ||
    tileFacts.expectedCounterpartRole != null ||
    metricFacts.comparisonRole != null ||
    tileFacts.comparisonRole != null ||
    metricFacts.physicalMeaningRef != null ||
    tileFacts.physicalMeaningRef != null
  ) {
    return "alignment_unproven";
  }

  return "unknown";
};

const resolveT00TraceContractMismatchClass = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): Nhm2SourceClosureV2RegionT00TraceContractMismatchClass => {
  const metricT00Diagnostics = args.metricT00Diagnostics;
  const tileT00Diagnostics = args.tileT00Diagnostics;
  const metricFacts = metricT00Diagnostics?.trace?.pathFacts ?? null;
  const tileFacts = tileT00Diagnostics?.trace?.pathFacts ?? null;
  if (!metricFacts || !tileFacts) {
    return "unknown";
  }

  const contractStatus = resolveT00TraceComparisonContractStatus(args);
  const factsDiffer = (
    metricValue: string | null | undefined,
    tileValue: string | null | undefined,
  ): boolean => metricValue != null && tileValue != null && metricValue !== tileValue;

  const metricRoleMatches =
    metricFacts.expectedCounterpartRole != null && tileFacts.comparisonRole != null
      ? metricFacts.expectedCounterpartRole === tileFacts.comparisonRole
      : null;
  const tileRoleMatches =
    tileFacts.expectedCounterpartRole != null && metricFacts.comparisonRole != null
      ? tileFacts.expectedCounterpartRole === metricFacts.comparisonRole
      : null;

  if (
    contractStatus === "semantically_misaligned" &&
    (metricFacts.semanticEquivalenceExpected === false ||
      tileFacts.semanticEquivalenceExpected === false ||
      metricRoleMatches === false ||
      tileRoleMatches === false)
  ) {
    return "comparison_contract_mismatch";
  }

  if (
    factsDiffer(metricFacts.reconstructionLayer, tileFacts.reconstructionLayer) ||
    factsDiffer(metricFacts.constructionStage, tileFacts.constructionStage)
  ) {
    return "reconstruction_boundary_mismatch";
  }

  if (
    factsDiffer(metricFacts.constructionDomain, tileFacts.constructionDomain) ||
    factsDiffer(metricFacts.samplingDomain, tileFacts.samplingDomain)
  ) {
    return "domain_mapping_mismatch";
  }

  const metricMean = metricT00Diagnostics?.meanT00 ?? null;
  const tileMean = tileT00Diagnostics?.meanT00 ?? null;
  if (
    contractStatus === "semantically_aligned" &&
    metricMean != null &&
    tileMean != null &&
    Math.abs(tileMean - metricMean) > 1e-12
  ) {
    return "same_contract_value_mismatch";
  }

  return "unknown";
};

const resolveT00TraceFirstSemanticBoundary = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): string | null => {
  const metricBoundary = toRepoPath(
    args.metricT00Diagnostics?.trace?.pathFacts?.assumptionBoundaryRef ??
      args.metricT00Diagnostics?.trace?.boundaryRef,
  );
  const tileBoundary = toRepoPath(
    args.tileT00Diagnostics?.trace?.pathFacts?.assumptionBoundaryRef ??
      args.tileT00Diagnostics?.trace?.boundaryRef,
  );
  if (metricBoundary != null && tileBoundary != null) {
    return metricBoundary === tileBoundary
      ? metricBoundary
      : `${metricBoundary} vs ${tileBoundary}`;
  }
  return metricBoundary ?? tileBoundary ?? null;
};

const resolveT00TraceNextInspectionTarget = (args: {
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): string | null => {
  const metricBoundary = toText(args.metricT00Diagnostics?.trace?.boundaryRef);
  const tileBoundary = toText(args.tileT00Diagnostics?.trace?.boundaryRef);
  if (metricBoundary != null && tileBoundary != null) {
    return metricBoundary === tileBoundary
      ? metricBoundary
      : `${metricBoundary} vs ${tileBoundary}`;
  }
  return metricBoundary ?? tileBoundary ?? null;
};

const summarizeT00Mechanism = (args: {
  residualComponents: Record<Nhm2SourceClosureComponent, Nhm2SourceClosureResidualComponent>;
  residualTolerance: number;
  metricT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
  tileT00Diagnostics: Nhm2SourceClosureV2RegionT00Diagnostics | null;
}): {
  category: Nhm2SourceClosureV2RegionT00MechanismCategory;
  evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus;
} => {
  const { residualComponents, residualTolerance, metricT00Diagnostics, tileT00Diagnostics } = args;
  const eps = 1e-12;
  const metricEvidence = metricT00Diagnostics?.evidenceStatus ?? "unknown";
  const tileEvidence = tileT00Diagnostics?.evidenceStatus ?? "unknown";
  const metricMean = metricT00Diagnostics?.meanT00 ?? null;
  const tileMean = tileT00Diagnostics?.meanT00 ?? null;
  const evidenceStatus: Nhm2SourceClosureV2RegionAccountingEvidenceStatus =
    metricEvidence === "unknown" || tileEvidence === "unknown"
      ? "unknown"
      : metricEvidence === "measured" && tileEvidence === "measured"
        ? "measured"
        : "inferred";

  if (metricMean == null && tileMean != null) {
    return { category: "metric_required_evidence_unknown", evidenceStatus: "unknown" };
  }
  if (tileMean == null && metricMean != null) {
    return { category: "tile_effective_evidence_unknown", evidenceStatus: "unknown" };
  }
  if (metricEvidence === "unknown" && tileEvidence !== "unknown") {
    return { category: "metric_required_evidence_unknown", evidenceStatus: "unknown" };
  }
  if (tileEvidence === "unknown" && metricEvidence !== "unknown") {
    return { category: "tile_effective_evidence_unknown", evidenceStatus: "unknown" };
  }
  if (metricEvidence === "unknown" && tileEvidence === "unknown") {
    return { category: "accounting_suspect", evidenceStatus: "unknown" };
  }
  if (metricMean == null || tileMean == null) {
    return { category: "accounting_suspect", evidenceStatus };
  }

  const absDelta = Math.abs(tileMean - metricMean);
  const relDelta = absDelta / Math.max(Math.abs(metricMean), Math.abs(tileMean), eps);
  if (absDelta > eps && relDelta > residualTolerance) {
    return { category: "t00_mismatch_present", evidenceStatus };
  }

  const pressureAbsDeltaMax = NHM2_SOURCE_CLOSURE_PRESSURE_COMPONENTS.reduce(
    (best, component) => {
      const delta = residualComponents[component]?.absResidual;
      return delta != null ? Math.max(best, Math.abs(delta)) : best;
    },
    0,
  );
  const pressureResidualMax = NHM2_SOURCE_CLOSURE_PRESSURE_COMPONENTS.reduce(
    (best, component) => {
      const relResidual = residualComponents[component]?.relResidual;
      return relResidual != null ? Math.max(best, Math.abs(relResidual)) : best;
    },
    0,
  );
  const pressureSignificanceFloor = computeNhm2PressureSignificanceFloor(
    residualComponents,
    eps,
  );
  const pressureMismatchIsSignificant = pressureAbsDeltaMax > pressureSignificanceFloor;

  if (
    relDelta <= residualTolerance &&
    pressureResidualMax > residualTolerance &&
    pressureMismatchIsSignificant
  ) {
    return { category: "pressure_proxy_dominant", evidenceStatus };
  }

  return { category: "unknown", evidenceStatus };
};

const buildRegionComparison = (args: {
  input: Nhm2SourceClosureV2RegionComparisonInput;
  toleranceRelLInf: number | null;
}): {
  region: Nhm2SourceClosureV2RegionComparison;
  reasonCodes: Nhm2SourceClosureV2ReasonCode[];
  indicatesAssumptionDrift: boolean;
} => {
  const metricTensor = normalizeNhm2SourceClosureTensor(
    args.input.metricRequiredTensor,
  );
  const tileTensor = normalizeNhm2SourceClosureTensor(args.input.tileEffectiveTensor);
  const metricMissing = !tensorHasAnyComponent(metricTensor);
  const tileMissing = !tensorHasAnyComponent(tileTensor);
  const metricMissingComponents = missingComponents(metricTensor);
  const tileMissingComponents = missingComponents(tileTensor);
  const completeness: Nhm2SourceClosureCompleteness =
    !metricMissing &&
    !tileMissing &&
    metricMissingComponents.length === 0 &&
    tileMissingComponents.length === 0
      ? "complete"
      : "incomplete";
  const residualComponents = buildResidualComponents(metricTensor, tileTensor);
  const residualNorms = buildResidualNorms(
    residualComponents,
    args.toleranceRelLInf,
  );
  const comparisonBasisStatus = normalizeRegionBasisStatus(
    args.input.comparisonBasisStatus,
  );
  const dominantResidual = resolveDominantResidualComponent(residualComponents);
  const metricAccounting = normalizeRegionAccounting(args.input.metricAccounting);
  const tileAccounting = normalizeRegionAccounting(args.input.tileAccounting);
  const metricT00Diagnostics = normalizeRegionT00Diagnostics(
    args.input.metricT00Diagnostics,
  );
  const tileT00Diagnostics = normalizeRegionT00Diagnostics(args.input.tileT00Diagnostics);
  const tileProxyDiagnostics = normalizeProxyDiagnostics(args.input.tileProxyDiagnostics);
  const mismatchDiagnostics = buildMismatchDiagnostics(metricTensor, tileTensor);
  const t00Mechanism = summarizeT00Mechanism({
    residualComponents,
    residualTolerance: Math.max(residualNorms.toleranceRelLInf ?? 0.1, 1e-12),
    metricT00Diagnostics,
    tileT00Diagnostics,
  });
  if (mismatchDiagnostics != null) {
    mismatchDiagnostics.t00MechanismCategory = t00Mechanism.category;
    mismatchDiagnostics.t00MechanismEvidenceStatus = t00Mechanism.evidenceStatus;
    mismatchDiagnostics.t00MechanismNextStep = resolveT00MechanismNextStep(t00Mechanism);
    mismatchDiagnostics.t00TraceDivergenceStage = resolveT00TraceDivergenceStage({
      metricT00Diagnostics,
      tileT00Diagnostics,
    });
    mismatchDiagnostics.t00TraceUpstreamMismatchClass =
      resolveT00TraceUpstreamMismatchClass({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
    mismatchDiagnostics.t00TraceSemanticMismatchClass =
      resolveT00TraceSemanticMismatchClass({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
    mismatchDiagnostics.t00TraceComparisonContractStatus =
      resolveT00TraceComparisonContractStatus({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
    mismatchDiagnostics.t00TraceContractMismatchClass =
      resolveT00TraceContractMismatchClass({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
    mismatchDiagnostics.t00TraceFirstSemanticBoundary =
      resolveT00TraceFirstSemanticBoundary({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
    mismatchDiagnostics.t00TraceNextInspectionTarget =
      resolveT00TraceNextInspectionTarget({
        metricT00Diagnostics,
        tileT00Diagnostics,
      });
  }
  const sampleCount = toFiniteOrNull(args.input.sampleCount);
  const resolvedSampleCount =
    metricAccounting?.sampleCount ?? tileAccounting?.sampleCount ?? sampleCount;

  const reasonCodes = new Set<Nhm2SourceClosureV2ReasonCode>();
  if (metricMissing) reasonCodes.add("region_metric_tensor_missing");
  if (tileMissing) reasonCodes.add("region_tile_tensor_missing");
  if (!metricMissing && metricMissingComponents.length > 0) {
    reasonCodes.add("region_metric_tensor_incomplete");
  }
  if (!tileMissing && tileMissingComponents.length > 0) {
    reasonCodes.add("region_tile_tensor_incomplete");
  }
  if (comparisonBasisStatus === "diagnostic_only") {
    reasonCodes.add("region_basis_diagnostic_only");
  }
  if (comparisonBasisStatus === "same_basis" && completeness === "complete" && residualNorms.pass === false) {
    reasonCodes.add("tensor_residual_exceeded");
  }

  let status: Nhm2SourceClosureStatus = "unavailable";
  if (comparisonBasisStatus === "same_basis") {
    if (completeness === "complete" && residualNorms.toleranceRelLInf != null) {
      status = residualNorms.pass === false ? "fail" : "pass";
    }
  } else if (comparisonBasisStatus === "diagnostic_only") {
    status = completeness === "complete" ? "review" : "unavailable";
  }

  return {
    region: {
      regionId: args.input.regionId,
      comparisonBasisStatus,
      status,
      completeness,
      metricTensorRef: toRepoPath(args.input.metricTensorRef),
      tileTensorRef: toRepoPath(args.input.tileTensorRef),
      metricRequiredTensor: metricTensor,
      tileEffectiveTensor: tileTensor,
      sampleCount: resolvedSampleCount,
      metricAccounting,
      tileAccounting,
      metricT00Diagnostics,
      tileT00Diagnostics,
      tileProxyDiagnostics,
      mismatchDiagnostics,
      residualComponents,
      residualNorms,
      dominantResidualComponent: dominantResidual.component,
      dominantResidualAbs: dominantResidual.absResidual,
      dominantResidualRel: dominantResidual.relResidual,
      note:
        typeof args.input.note === "string" && args.input.note.trim().length > 0
          ? args.input.note.trim()
          : null,
    },
    reasonCodes: Array.from(reasonCodes),
    indicatesAssumptionDrift: comparisonBasisStatus !== "same_basis",
  };
};

export const buildNhm2SourceClosureArtifactV2 = (
  input: BuildNhm2SourceClosureArtifactV2Input,
): Nhm2SourceClosureV2Artifact => {
  const metricTensor = normalizeNhm2SourceClosureTensor(input.metricRequiredTensor);
  const tileTensor = normalizeNhm2SourceClosureTensor(input.tileEffectiveTensor);
  const toleranceRelLInf = toFiniteOrNull(input.toleranceRelLInf);
  const metricMissing = !tensorHasAnyComponent(metricTensor);
  const tileMissing = !tensorHasAnyComponent(tileTensor);
  const metricMissingComponents = missingComponents(metricTensor);
  const tileMissingComponents = missingComponents(tileTensor);
  const globalCompleteness: Nhm2SourceClosureCompleteness =
    !metricMissing &&
    !tileMissing &&
    metricMissingComponents.length === 0 &&
    tileMissingComponents.length === 0
      ? "complete"
      : "incomplete";
  const residualComponents = buildResidualComponents(metricTensor, tileTensor);
  const residualNorms = buildResidualNorms(residualComponents, toleranceRelLInf);
  const reasonCodes = new Set<Nhm2SourceClosureV2ReasonCode>();
  if (metricMissing) reasonCodes.add("metric_tensor_missing");
  if (tileMissing) reasonCodes.add("tile_tensor_missing");
  if (!metricMissing && metricMissingComponents.length > 0) {
    reasonCodes.add("metric_tensor_incomplete");
  }
  if (!tileMissing && tileMissingComponents.length > 0) {
    reasonCodes.add("tile_tensor_incomplete");
  }
  if (globalCompleteness === "complete" && residualNorms.toleranceRelLInf == null) {
    reasonCodes.add("tolerance_missing");
  }
  if (globalCompleteness === "complete" && residualNorms.pass === false) {
    reasonCodes.add("tensor_residual_exceeded");
  }

  const requiredRegionIds = Array.from(
    new Set(
      (input.requiredRegionIds ?? []).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

  const regionResults = (input.regionComparisons ?? []).map((entry) =>
    buildRegionComparison({
      input: entry,
      toleranceRelLInf,
    }),
  );
  for (const entry of regionResults) {
    for (const reasonCode of entry.reasonCodes) {
      reasonCodes.add(reasonCode);
    }
  }

  const regions = regionResults.map((entry) => entry.region);
  const requiredRegions = requiredRegionIds.map((regionId) =>
    regions.find((entry) => entry.regionId === regionId) ?? null,
  );
  const missingRequiredRegionRecord = requiredRegions.some((entry) => entry == null);
  const anyRequiredRegionUnavailable = requiredRegions.some(
    (entry) =>
      entry == null ||
      entry.comparisonBasisStatus === "unavailable" ||
      entry.completeness !== "complete",
  );
  const anyRequiredRegionDiagnosticOnly = requiredRegions.some(
    (entry) => entry != null && entry.comparisonBasisStatus === "diagnostic_only",
  );
  const anyRequiredRegionResidualExceeded = requiredRegions.some(
    (entry) =>
      entry != null &&
      entry.comparisonBasisStatus === "same_basis" &&
      entry.residualNorms.pass === false,
  );
  const assumptionsDrifted =
    input.assumptionsDrifted === true ||
    anyRequiredRegionDiagnosticOnly ||
    regionResults.some((entry) => entry.indicatesAssumptionDrift);
  if (assumptionsDrifted) {
    reasonCodes.add("assumption_drift");
  }

  let completeness: Nhm2SourceClosureCompleteness = globalCompleteness;
  if (missingRequiredRegionRecord || anyRequiredRegionUnavailable) {
    completeness = "incomplete";
  }

  let status: Nhm2SourceClosureStatus = "unavailable";
  const toleranceMissing = reasonCodes.has("tolerance_missing");
  if (!missingRequiredRegionRecord && globalCompleteness === "complete" && !toleranceMissing) {
    if (anyRequiredRegionUnavailable) {
      status = "unavailable";
    } else if (residualNorms.pass === false || anyRequiredRegionResidualExceeded) {
      status = "fail";
    } else if (assumptionsDrifted || anyRequiredRegionDiagnosticOnly) {
      status = "review";
    } else {
      status = "pass";
    }
  }

  const scalarProjections = buildScalarProjections({
    metricTensor,
    tileTensor,
    residualComponents,
    scalarCl3RhoDeltaRel: toFiniteOrNull(input.scalarCl3RhoDeltaRel),
  });

  return {
    artifactId: NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
    schemaVersion: NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION,
    status,
    completeness,
    reasonCodes: Array.from(reasonCodes),
    comparedComponents: NHM2_SOURCE_CLOSURE_COMPONENTS,
    tensorRefs: {
      metricRequired: toRepoPath(input.metricTensorRef),
      tileEffective: toRepoPath(input.tileEffectiveTensorRef),
    },
    tensors: {
      metricRequired: metricTensor,
      tileEffective: tileTensor,
    },
    residualComponents,
    residualNorms,
    regionComparisons: {
      status: regions.length > 0 ? "available" : "unavailable",
      requiredRegionIds,
      regions,
    },
    scalarProjections,
    distinction: {
      scalarCongruenceSecondary: true,
      scalarSurfaceId: "CL3_RhoDelta",
      tensorSurfaceId: NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
    },
    assumptionsDrifted: input.assumptionsDrifted == null ? assumptionsDrifted : assumptionsDrifted,
  };
};

export const isNhm2SourceClosureV2Artifact = (
  value: unknown,
): value is Nhm2SourceClosureV2Artifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const regionComparisons =
    record.regionComparisons && typeof record.regionComparisons === "object"
      ? (record.regionComparisons as Record<string, unknown>)
      : null;
  const regions = Array.isArray(regionComparisons?.regions)
    ? (regionComparisons?.regions as Array<Record<string, unknown>>)
    : null;
  return (
    record.artifactId === NHM2_SOURCE_CLOSURE_ARTIFACT_ID &&
    record.schemaVersion === NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION &&
    NHM2_SOURCE_CLOSURE_STATUS_VALUES.includes(record.status as Nhm2SourceClosureStatus) &&
    NHM2_SOURCE_CLOSURE_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2SourceClosureCompleteness,
    ) &&
    record.tensorRefs != null &&
    record.residualNorms != null &&
    Array.isArray(record.reasonCodes) &&
    regionComparisons != null &&
    regions != null &&
    regions.every((entry) => {
      const basisStatus = entry.comparisonBasisStatus;
      return (
        typeof entry.regionId === "string" &&
        NHM2_SOURCE_CLOSURE_REGION_BASIS_STATUS_VALUES.includes(
          basisStatus as Nhm2SourceClosureRegionBasisStatus,
        )
      );
    })
  );
};
