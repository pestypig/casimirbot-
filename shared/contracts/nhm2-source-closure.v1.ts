export const NHM2_SOURCE_CLOSURE_ARTIFACT_ID = "nhm2_source_closure";
export const NHM2_SOURCE_CLOSURE_SCHEMA_VERSION = "nhm2_source_closure/v1";

export const NHM2_SOURCE_CLOSURE_COMPONENTS = [
  "T00",
  "T11",
  "T22",
  "T33",
] as const;

export const NHM2_SOURCE_CLOSURE_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_SOURCE_CLOSURE_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_SOURCE_CLOSURE_REASON_CODES = [
  "metric_tensor_missing",
  "tile_tensor_missing",
  "metric_tensor_incomplete",
  "tile_tensor_incomplete",
  "tolerance_missing",
  "tensor_residual_exceeded",
  "assumption_drift",
] as const;

export type Nhm2SourceClosureComponent =
  (typeof NHM2_SOURCE_CLOSURE_COMPONENTS)[number];
export type Nhm2SourceClosureStatus =
  (typeof NHM2_SOURCE_CLOSURE_STATUS_VALUES)[number];
export type Nhm2SourceClosureCompleteness =
  (typeof NHM2_SOURCE_CLOSURE_COMPLETENESS_VALUES)[number];
export type Nhm2SourceClosureReasonCode =
  (typeof NHM2_SOURCE_CLOSURE_REASON_CODES)[number];

export type Nhm2SourceClosureTensorInput = Partial<
  Record<Nhm2SourceClosureComponent, number | null | undefined>
>;

export type Nhm2SourceClosureTensor = Record<
  Nhm2SourceClosureComponent,
  number | null
>;

export type Nhm2SourceClosureResidualComponent = {
  metricRequired: number | null;
  tileEffective: number | null;
  absResidual: number | null;
  relResidual: number | null;
};

export type Nhm2SourceClosureResidualNorms = {
  absL1: number | null;
  absL2: number | null;
  absLInf: number | null;
  relL1: number | null;
  relL2: number | null;
  relLInf: number | null;
  toleranceRelLInf: number | null;
  pass: boolean | null;
};

export type Nhm2SourceClosureSampledSummaryInput = {
  regionId: string;
  sampleCount: number | null;
  tileTensor: Nhm2SourceClosureTensorInput | null | undefined;
  note?: string | null;
};

export type Nhm2SourceClosureSampledSummary = {
  regionId: string;
  sampleCount: number | null;
  tileTensor: Nhm2SourceClosureTensor;
  residualComponents: Record<
    Nhm2SourceClosureComponent,
    Nhm2SourceClosureResidualComponent
  >;
  residualNorms: Nhm2SourceClosureResidualNorms;
  note: string | null;
};

export type Nhm2SourceClosureArtifact = {
  artifactId: typeof NHM2_SOURCE_CLOSURE_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SOURCE_CLOSURE_SCHEMA_VERSION;
  status: Nhm2SourceClosureStatus;
  completeness: Nhm2SourceClosureCompleteness;
  reasonCodes: Nhm2SourceClosureReasonCode[];
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
  sampledSummaries: {
    status: "available" | "unavailable";
    regions: Nhm2SourceClosureSampledSummary[];
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

export type BuildNhm2SourceClosureArtifactInput = {
  metricTensorRef?: string | null;
  tileEffectiveTensorRef?: string | null;
  metricRequiredTensor?: Nhm2SourceClosureTensorInput | null;
  tileEffectiveTensor?: Nhm2SourceClosureTensorInput | null;
  sampledSummaries?: Nhm2SourceClosureSampledSummaryInput[] | null;
  toleranceRelLInf?: number | null;
  scalarCl3RhoDeltaRel?: number | null;
  assumptionsDrifted?: boolean | null;
};

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

export const normalizeNhm2SourceClosureTensor = (
  tensor: Nhm2SourceClosureTensorInput | null | undefined,
): Nhm2SourceClosureTensor => ({
  T00: toFinite(tensor?.T00),
  T11: toFinite(tensor?.T11),
  T22: toFinite(tensor?.T22),
  T33: toFinite(tensor?.T33),
});

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
  const metricPressure = [args.metricTensor.T11, args.metricTensor.T22, args.metricTensor.T33];
  const tilePressure = [args.tileTensor.T11, args.tileTensor.T22, args.tileTensor.T33];
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

const buildSampledSummaries = (args: {
  metricTensor: Nhm2SourceClosureTensor;
  tileTensor: Nhm2SourceClosureTensor;
  sampledSummaries: Nhm2SourceClosureSampledSummaryInput[] | null | undefined;
  toleranceRelLInf: number | null;
}): {
  status: "available" | "unavailable";
  regions: Nhm2SourceClosureSampledSummary[];
} => {
  const inputs =
    args.sampledSummaries != null && args.sampledSummaries.length > 0
      ? args.sampledSummaries
      : tensorHasAnyComponent(args.tileTensor)
      ? [
          {
            regionId: "global",
            sampleCount: null,
            tileTensor: args.tileTensor,
            note: "global tensor summary fallback",
          },
        ]
      : [];

  const regions = inputs.map((summary) => {
    const tileTensor = normalizeNhm2SourceClosureTensor(summary.tileTensor);
    const residualComponents = buildResidualComponents(args.metricTensor, tileTensor);
    const residualNorms = buildResidualNorms(
      residualComponents,
      args.toleranceRelLInf,
    );
    return {
      regionId: summary.regionId,
      sampleCount: toFinite(summary.sampleCount),
      tileTensor,
      residualComponents,
      residualNorms,
      note:
        typeof summary.note === "string" && summary.note.length > 0
          ? summary.note
          : null,
    };
  });

  return {
    status: regions.length > 0 ? "available" : "unavailable",
    regions,
  };
};

export const buildNhm2SourceClosureArtifact = (
  input: BuildNhm2SourceClosureArtifactInput,
): Nhm2SourceClosureArtifact => {
  const metricTensor = normalizeNhm2SourceClosureTensor(input.metricRequiredTensor);
  const tileTensor = normalizeNhm2SourceClosureTensor(input.tileEffectiveTensor);
  const toleranceRelLInf = toFinite(input.toleranceRelLInf);
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
  const reasonCodes = new Set<Nhm2SourceClosureReasonCode>();
  if (metricMissing) reasonCodes.add("metric_tensor_missing");
  if (tileMissing) reasonCodes.add("tile_tensor_missing");
  if (!metricMissing && metricMissingComponents.length > 0) {
    reasonCodes.add("metric_tensor_incomplete");
  }
  if (!tileMissing && tileMissingComponents.length > 0) {
    reasonCodes.add("tile_tensor_incomplete");
  }

  const residualComponents = buildResidualComponents(metricTensor, tileTensor);
  const residualNorms = buildResidualNorms(residualComponents, toleranceRelLInf);
  const assumptionsDrifted = input.assumptionsDrifted === true;
  const toleranceMissing =
    completeness === "complete" && residualNorms.toleranceRelLInf == null;
  if (toleranceMissing) {
    reasonCodes.add("tolerance_missing");
  }
  if (completeness === "complete" && residualNorms.pass === false) {
    reasonCodes.add("tensor_residual_exceeded");
  }
  if (assumptionsDrifted) {
    reasonCodes.add("assumption_drift");
  }

  let status: Nhm2SourceClosureStatus = "unavailable";
  if (completeness === "complete") {
    if (toleranceMissing) {
      status = "unavailable";
    } else if (residualNorms.pass === false) {
      status = "fail";
    } else {
      status = "pass";
    }
    if (assumptionsDrifted && status === "pass") {
      status = "review";
    }
  }

  const sampledSummaries = buildSampledSummaries({
    metricTensor,
    tileTensor,
    sampledSummaries: input.sampledSummaries,
    toleranceRelLInf,
  });
  const scalarProjections = buildScalarProjections({
    metricTensor,
    tileTensor,
    residualComponents,
    scalarCl3RhoDeltaRel: toFinite(input.scalarCl3RhoDeltaRel),
  });

  return {
    artifactId: NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
    schemaVersion: NHM2_SOURCE_CLOSURE_SCHEMA_VERSION,
    status,
    completeness,
    reasonCodes: Array.from(reasonCodes),
    comparedComponents: NHM2_SOURCE_CLOSURE_COMPONENTS,
    tensorRefs: {
      metricRequired:
        typeof input.metricTensorRef === "string" && input.metricTensorRef.length > 0
          ? input.metricTensorRef
          : null,
      tileEffective:
        typeof input.tileEffectiveTensorRef === "string" &&
        input.tileEffectiveTensorRef.length > 0
          ? input.tileEffectiveTensorRef
          : null,
    },
    tensors: {
      metricRequired: metricTensor,
      tileEffective: tileTensor,
    },
    residualComponents,
    residualNorms,
    sampledSummaries,
    scalarProjections,
    distinction: {
      scalarCongruenceSecondary: true,
      scalarSurfaceId: "CL3_RhoDelta",
      tensorSurfaceId: NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
    },
    assumptionsDrifted:
      input.assumptionsDrifted == null ? null : input.assumptionsDrifted === true,
  };
};

export const isNhm2SourceClosureArtifact = (
  value: unknown,
): value is Nhm2SourceClosureArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const sampledSummaries =
    record.sampledSummaries && typeof record.sampledSummaries === "object"
      ? (record.sampledSummaries as Record<string, unknown>)
      : null;
  const regions = Array.isArray(sampledSummaries?.regions)
    ? (sampledSummaries?.regions as Array<Record<string, unknown>>)
    : null;
  return (
    record.artifactId === NHM2_SOURCE_CLOSURE_ARTIFACT_ID &&
    record.schemaVersion === NHM2_SOURCE_CLOSURE_SCHEMA_VERSION &&
    NHM2_SOURCE_CLOSURE_STATUS_VALUES.includes(record.status as Nhm2SourceClosureStatus) &&
    NHM2_SOURCE_CLOSURE_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2SourceClosureCompleteness,
    ) &&
    record.tensorRefs != null &&
    record.residualNorms != null &&
    Array.isArray(record.reasonCodes) &&
    sampledSummaries != null &&
    regions != null &&
    regions.every((entry) => typeof entry.regionId === "string")
  );
};
