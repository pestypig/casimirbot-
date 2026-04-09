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

export type Nhm2SourceClosureV2ReasonCode =
  (typeof NHM2_SOURCE_CLOSURE_V2_REASON_CODES)[number];
export type Nhm2SourceClosureRegionBasisStatus =
  (typeof NHM2_SOURCE_CLOSURE_REGION_BASIS_STATUS_VALUES)[number];
export type Nhm2SourceClosureRegionAggregationMode =
  (typeof NHM2_SOURCE_CLOSURE_REGION_AGGREGATION_MODE_VALUES)[number];

export type Nhm2SourceClosureV2RegionAccounting = {
  sampleCount: number | null;
  maskVoxelCount: number | null;
  weightSum: number | null;
  aggregationMode: Nhm2SourceClosureRegionAggregationMode;
  normalizationBasis: string | null;
  regionMaskNote: string | null;
  supportInclusionNote: string | null;
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

const normalizeRegionAccounting = (
  value: Nhm2SourceClosureV2RegionAccounting | null | undefined,
): Nhm2SourceClosureV2RegionAccounting | null => {
  if (!value) return null;
  return {
    sampleCount: toFinite(value.sampleCount),
    maskVoxelCount: toFinite(value.maskVoxelCount),
    weightSum: toFinite(value.weightSum),
    aggregationMode: normalizeRegionAggregationMode(value.aggregationMode),
    normalizationBasis: toText(value.normalizationBasis),
    regionMaskNote: toText(value.regionMaskNote),
    supportInclusionNote: toText(value.supportInclusionNote),
  };
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
  const sampleCount = toFinite(args.input.sampleCount);
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
  const toleranceRelLInf = toFinite(input.toleranceRelLInf);
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
    scalarCl3RhoDeltaRel: toFinite(input.scalarCl3RhoDeltaRel),
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
