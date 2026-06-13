export const NHM2_QEI_WORLDLINE_DOSSIER_CONTRACT_VERSION =
  "nhm2_qei_worldline_dossier/v1";
export const NHM2_QEI_WORLDLINE_DOSSIER_ARTIFACT_REF =
  "nhm2_qei_worldline_dossier";

export const NHM2_QEI_WORLDLINE_REGION_IDS = [
  "hull",
  "wall",
  "exterior_shell",
  "hull_wall_transition",
  "wall_exterior_transition",
  "centerline",
  "custom",
] as const;

export const NHM2_QEI_WORLDLINE_SAMPLING_FUNCTION_KINDS = [
  "lorentzian",
  "gaussian",
  "compact_support",
  "unknown",
] as const;

export const NHM2_QEI_WORLDLINE_VALUE_STATUS_VALUES = [
  "computed",
  "proxy",
  "missing",
] as const;

export const NHM2_QEI_WORLDLINE_BOUND_STATUS_VALUES = [
  "computed",
  "literature_bound",
  "proxy",
  "missing",
] as const;

export const NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES = [
  "pass",
  "fail",
  "missing",
] as const;

export type Nhm2QeiWorldlineRegionId =
  (typeof NHM2_QEI_WORLDLINE_REGION_IDS)[number];
export type Nhm2QeiWorldlineSamplingFunctionKind =
  (typeof NHM2_QEI_WORLDLINE_SAMPLING_FUNCTION_KINDS)[number];
export type Nhm2QeiWorldlineValueStatus =
  (typeof NHM2_QEI_WORLDLINE_VALUE_STATUS_VALUES)[number];
export type Nhm2QeiWorldlineBoundStatus =
  (typeof NHM2_QEI_WORLDLINE_BOUND_STATUS_VALUES)[number];
export type Nhm2QeiWorldlineConsistencyStatus =
  (typeof NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES)[number];

export type Nhm2QeiWorldlineDossierWorldlineV1 = {
  worldlineId: string;
  regionId: Nhm2QeiWorldlineRegionId;
  chartId: string;
  samplingFunction: {
    kind: Nhm2QeiWorldlineSamplingFunctionKind;
    tauSeconds: number | null;
    normalized: boolean;
  };
  sampledRho: {
    valueSI: number | null;
    provenanceRef?: string;
    status: Nhm2QeiWorldlineValueStatus;
  };
  bound: {
    valueSI: number | null;
    provenanceRef?: string;
    status: Nhm2QeiWorldlineBoundStatus;
  };
  margin: {
    valueSI: number | null;
    pass: boolean | null;
  };
  consistency: {
    tauVsDuty: Nhm2QeiWorldlineConsistencyStatus;
    tauVsLightCrossing: Nhm2QeiWorldlineConsistencyStatus;
    tauVsModulation: Nhm2QeiWorldlineConsistencyStatus;
  };
  blockers: string[];
};

export type Nhm2QeiWorldlineDossierV1 = {
  contractVersion: typeof NHM2_QEI_WORLDLINE_DOSSIER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  atlasRef?: string | null;
  atlasHash?: string | null;
  worldlines: Nhm2QeiWorldlineDossierWorldlineV1[];
  summary: {
    hasWallWorldline: boolean;
    allMarginsPass: boolean | null;
    anyProxy: boolean;
    dossierComplete: boolean;
  };
  literatureRefs: ["ford_roman_1996_quantum_inequality"];
  claimBoundary: {
    diagnosticOnly: true;
    scalarMarginCannotSubstituteForDossier: true;
  };
};

type PartialWorldlineInput = Partial<Nhm2QeiWorldlineDossierWorldlineV1> & {
  sampledRho?: Partial<Nhm2QeiWorldlineDossierWorldlineV1["sampledRho"]>;
  bound?: Partial<Nhm2QeiWorldlineDossierWorldlineV1["bound"]>;
  margin?: Partial<Nhm2QeiWorldlineDossierWorldlineV1["margin"]>;
  samplingFunction?: Partial<Nhm2QeiWorldlineDossierWorldlineV1["samplingFunction"]>;
  consistency?: Partial<Nhm2QeiWorldlineDossierWorldlineV1["consistency"]>;
};

export type BuildNhm2QeiWorldlineDossierInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  worldlines?: PartialWorldlineInput[] | null;
};

export type BuildNhm2QeiWorldlineDossierFromGuardrailInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  chartId?: string | null;
  qiGuardrail?: Record<string, unknown> | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" ? (value as Record<string, unknown>) : null;

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(
    new Set(
      values
        .map(asText)
        .filter((value): value is string => value != null),
    ),
  );

const normalizeRegionId = (value: unknown): Nhm2QeiWorldlineRegionId => {
  const text = asText(value);
  return NHM2_QEI_WORLDLINE_REGION_IDS.includes(text as Nhm2QeiWorldlineRegionId)
    ? (text as Nhm2QeiWorldlineRegionId)
    : "custom";
};

const normalizeSamplingKind = (
  value: unknown,
): Nhm2QeiWorldlineSamplingFunctionKind => {
  const text = asText(value)?.toLowerCase();
  if (text === "compact" || text === "compact-support") return "compact_support";
  return NHM2_QEI_WORLDLINE_SAMPLING_FUNCTION_KINDS.includes(
    text as Nhm2QeiWorldlineSamplingFunctionKind,
  )
    ? (text as Nhm2QeiWorldlineSamplingFunctionKind)
    : "unknown";
};

const normalizeValueStatus = (value: unknown): Nhm2QeiWorldlineValueStatus => {
  const text = asText(value);
  return NHM2_QEI_WORLDLINE_VALUE_STATUS_VALUES.includes(
    text as Nhm2QeiWorldlineValueStatus,
  )
    ? (text as Nhm2QeiWorldlineValueStatus)
    : "missing";
};

const normalizeBoundStatus = (value: unknown): Nhm2QeiWorldlineBoundStatus => {
  const text = asText(value);
  return NHM2_QEI_WORLDLINE_BOUND_STATUS_VALUES.includes(
    text as Nhm2QeiWorldlineBoundStatus,
  )
    ? (text as Nhm2QeiWorldlineBoundStatus)
    : "missing";
};

const normalizeConsistencyStatus = (
  value: unknown,
): Nhm2QeiWorldlineConsistencyStatus => {
  const text = asText(value);
  return NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES.includes(
    text as Nhm2QeiWorldlineConsistencyStatus,
  )
    ? (text as Nhm2QeiWorldlineConsistencyStatus)
    : "missing";
};

const consistencyBlockers = (
  consistency: Nhm2QeiWorldlineDossierWorldlineV1["consistency"],
): string[] => {
  const blockers: string[] = [];
  if (consistency.tauVsDuty !== "pass") {
    blockers.push(`tau_vs_duty_${consistency.tauVsDuty}`);
  }
  if (consistency.tauVsLightCrossing !== "pass") {
    blockers.push(`tau_vs_light_crossing_${consistency.tauVsLightCrossing}`);
  }
  if (consistency.tauVsModulation !== "pass") {
    blockers.push(`tau_vs_modulation_${consistency.tauVsModulation}`);
  }
  return blockers;
};

const normalizeWorldline = (
  input: PartialWorldlineInput,
  index: number,
): Nhm2QeiWorldlineDossierWorldlineV1 => {
  const sampledRhoValue = toFinite(input.sampledRho?.valueSI);
  const boundValue = toFinite(input.bound?.valueSI);
  const marginValue =
    toFinite(input.margin?.valueSI) ??
    (sampledRhoValue != null && boundValue != null ? boundValue - sampledRhoValue : null);
  const sampledRhoStatus =
    normalizeValueStatus(input.sampledRho?.status) === "missing" && sampledRhoValue != null
      ? "computed"
      : normalizeValueStatus(input.sampledRho?.status);
  const boundStatus =
    normalizeBoundStatus(input.bound?.status) === "missing" && boundValue != null
      ? "computed"
      : normalizeBoundStatus(input.bound?.status);
  const consistency = {
    tauVsDuty: normalizeConsistencyStatus(input.consistency?.tauVsDuty),
    tauVsLightCrossing: normalizeConsistencyStatus(input.consistency?.tauVsLightCrossing),
    tauVsModulation: normalizeConsistencyStatus(input.consistency?.tauVsModulation),
  };
  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    sampledRhoStatus === "missing" ? "sampled_rho_missing" : null,
    boundStatus === "missing" ? "qei_bound_missing" : null,
    marginValue == null ? "qei_margin_missing" : null,
    ...(marginValue != null && marginValue < 0 ? ["qei_margin_failed"] : []),
    ...consistencyBlockers(consistency),
  ]);
  const sampledRhoProvenanceRef = asText(input.sampledRho?.provenanceRef);
  const boundProvenanceRef = asText(input.bound?.provenanceRef);
  return {
    worldlineId: asText(input.worldlineId) ?? `worldline:${index + 1}`,
    regionId: normalizeRegionId(input.regionId),
    chartId: asText(input.chartId) ?? "unknown",
    samplingFunction: {
      kind: normalizeSamplingKind(input.samplingFunction?.kind),
      tauSeconds: toFinite(input.samplingFunction?.tauSeconds),
      normalized: input.samplingFunction?.normalized === true,
    },
    sampledRho: {
      valueSI: sampledRhoValue,
      ...(sampledRhoProvenanceRef != null
        ? { provenanceRef: sampledRhoProvenanceRef }
        : {}),
      status: sampledRhoStatus,
    },
    bound: {
      valueSI: boundValue,
      ...(boundProvenanceRef != null ? { provenanceRef: boundProvenanceRef } : {}),
      status: boundStatus,
    },
    margin: {
      valueSI: marginValue,
      pass:
        typeof input.margin?.pass === "boolean"
          ? input.margin.pass
          : marginValue == null
            ? null
            : marginValue >= 0,
    },
    consistency,
    blockers,
  };
};

const summarizeWorldlines = (
  worldlines: Nhm2QeiWorldlineDossierWorldlineV1[],
): Nhm2QeiWorldlineDossierV1["summary"] => {
  const hasWallWorldline = worldlines.some((worldline) => worldline.regionId === "wall");
  const marginPassValues = worldlines.map((worldline) => worldline.margin.pass);
  const allMarginsPass =
    worldlines.length === 0 || marginPassValues.some((value) => value == null)
      ? null
      : marginPassValues.every((value) => value === true);
  const anyProxy = worldlines.some(
    (worldline) =>
      worldline.sampledRho.status === "proxy" || worldline.bound.status === "proxy",
  );
  const allValuesPresent =
    worldlines.length > 0 &&
    worldlines.every(
      (worldline) =>
        worldline.blockers.length === 0 &&
        worldline.sampledRho.status !== "missing" &&
        worldline.bound.status !== "missing" &&
        worldline.margin.pass === true &&
        worldline.samplingFunction.tauSeconds != null &&
        worldline.samplingFunction.normalized === true &&
        worldline.consistency.tauVsDuty === "pass" &&
        worldline.consistency.tauVsLightCrossing === "pass" &&
        worldline.consistency.tauVsModulation === "pass",
    );
  return {
    hasWallWorldline,
    allMarginsPass,
    anyProxy,
    dossierComplete: hasWallWorldline && allValuesPresent && !anyProxy,
  };
};

export const buildNhm2QeiWorldlineDossier = (
  input: BuildNhm2QeiWorldlineDossierInput,
): Nhm2QeiWorldlineDossierV1 => {
  const worldlines = (input.worldlines ?? []).map(normalizeWorldline);
  return {
    contractVersion: NHM2_QEI_WORLDLINE_DOSSIER_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? new Date(0).toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: asText(input.selectedProfileId) ?? "runtime",
    ...(asText(input.atlasRef) == null ? {} : { atlasRef: asText(input.atlasRef) }),
    ...(asText(input.atlasHash) == null ? {} : { atlasHash: asText(input.atlasHash) }),
    worldlines,
    summary: summarizeWorldlines(worldlines),
    literatureRefs: ["ford_roman_1996_quantum_inequality"],
    claimBoundary: {
      diagnosticOnly: true,
      scalarMarginCannotSubstituteForDossier: true,
    },
  };
};

const statusFromFiniteMetric = (
  value: number | null,
  metricDerived: boolean | null,
): Nhm2QeiWorldlineValueStatus => {
  if (value == null) return "missing";
  return metricDerived === true ? "computed" : "proxy";
};

const passIfFinitePositive = (...values: Array<number | null>): Nhm2QeiWorldlineConsistencyStatus =>
  values.every((value) => value != null && value > 0) ? "pass" : "missing";

const resolveTauVsDuty = (
  tauSeconds: number | null,
  duty: number | null,
): Nhm2QeiWorldlineConsistencyStatus => {
  if (tauSeconds == null || duty == null) return "missing";
  return tauSeconds > 0 && duty > 0 && duty <= 1 ? "pass" : "fail";
};

const resolveTauVsLightCrossing = (
  tauSeconds: number | null,
  tauLightCrossingSeconds: number | null,
): Nhm2QeiWorldlineConsistencyStatus => {
  if (tauSeconds == null || tauLightCrossingSeconds == null) return "missing";
  if (tauSeconds <= 0 || tauLightCrossingSeconds <= 0) return "fail";
  return tauSeconds <= tauLightCrossingSeconds ? "pass" : "fail";
};

export const buildNhm2QeiWorldlineDossierFromGuardrail = (
  input: BuildNhm2QeiWorldlineDossierFromGuardrailInput,
): Nhm2QeiWorldlineDossierV1 => {
  const guard = asRecord(input.qiGuardrail);
  if (guard == null) {
    return buildNhm2QeiWorldlineDossier({
      generatedAt: input.generatedAt,
      laneId: input.laneId,
      selectedProfileId: input.selectedProfileId,
      worldlines: [],
    });
  }
  const windowMs = toFinite(guard.window_ms);
  const tauSeconds =
    toFinite(guard.tauSelected_s) ??
    toFinite(guard.tau_s) ??
    toFinite(guard.tauWindow_s) ??
    (windowMs != null ? windowMs / 1000 : null);
  const sampledRho = toFinite(guard.lhs_Jm3);
  const bound = toFinite(guard.bound_Jm3) ?? toFinite(guard.boundUsed_Jm3);
  const metricDerived =
    typeof guard.metricDerived === "boolean" ? Boolean(guard.metricDerived) : null;
  const samplingNormalization = asText(guard.qeiSamplingNormalization);
  const normalized =
    samplingNormalization === "unit_integral" ||
    (toFinite(guard.sumWindowDt) != null && Math.abs((toFinite(guard.sumWindowDt) as number) - 1) <= 1e-3);
  const tauPulseSeconds = toFinite(guard.tauPulse_s);
  const worldline = normalizeWorldline(
    {
      worldlineId: "qei:wall:guardrail",
      regionId: "wall",
      chartId: asText(guard.metricDerivedChart) ?? asText(input.chartId) ?? "unknown",
      samplingFunction: {
        kind: normalizeSamplingKind(guard.sampler),
        tauSeconds,
        normalized,
      },
      sampledRho: {
        valueSI: sampledRho,
        provenanceRef:
          asText(guard.metricDerivedSource) ?? asText(guard.rhoSource) ?? "runtime://pipeline/qiGuardrail",
        status: statusFromFiniteMetric(sampledRho, metricDerived),
      },
      bound: {
        valueSI: bound,
        provenanceRef: "ford_roman_1996_quantum_inequality",
        status: bound == null ? "missing" : "literature_bound",
      },
      margin: {
        valueSI: sampledRho != null && bound != null ? bound - sampledRho : null,
        pass:
          typeof guard.congruentSolvePolicyMarginPass === "boolean"
            ? Boolean(guard.congruentSolvePolicyMarginPass)
            : null,
      },
      consistency: {
        tauVsDuty: resolveTauVsDuty(
          tauSeconds,
          toFinite(guard.duty) ?? toFinite(guard.patternDuty),
        ),
        tauVsLightCrossing: resolveTauVsLightCrossing(
          tauSeconds,
          toFinite(guard.tauLC_s),
        ),
        tauVsModulation: passIfFinitePositive(tauSeconds, tauPulseSeconds),
      },
      blockers: [
        ...(Array.isArray(guard.tauProvenanceMissing)
          ? guard.tauProvenanceMissing
          : []),
        metricDerived === true ? null : "sampled_rho_not_metric_derived",
        normalized ? null : "sampling_function_not_unit_normalized",
      ],
    },
    0,
  );
  return buildNhm2QeiWorldlineDossier({
    generatedAt: input.generatedAt,
    laneId: input.laneId,
    selectedProfileId: input.selectedProfileId,
    worldlines: [worldline],
  });
};

const isFiniteOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

export const isNhm2QeiWorldlineDossier = (
  value: unknown,
): value is Nhm2QeiWorldlineDossierV1 => {
  const record = asRecord(value);
  if (record == null) return false;
  const summary = asRecord(record.summary);
  return (
    record.contractVersion === NHM2_QEI_WORLDLINE_DOSSIER_CONTRACT_VERSION &&
    asText(record.generatedAt) != null &&
    asText(record.laneId) != null &&
    asText(record.selectedProfileId) != null &&
    (record.atlasRef === undefined || record.atlasRef === null || asText(record.atlasRef) != null) &&
    (record.atlasHash === undefined || record.atlasHash === null || asText(record.atlasHash) != null) &&
    Array.isArray(record.worldlines) &&
    record.worldlines.every((entry) => {
      const worldline = asRecord(entry);
      const sampling = asRecord(worldline?.samplingFunction);
      const sampledRho = asRecord(worldline?.sampledRho);
      const bound = asRecord(worldline?.bound);
      const margin = asRecord(worldline?.margin);
      const consistency = asRecord(worldline?.consistency);
      return (
        worldline != null &&
        asText(worldline.worldlineId) != null &&
        NHM2_QEI_WORLDLINE_REGION_IDS.includes(
          worldline.regionId as Nhm2QeiWorldlineRegionId,
        ) &&
        asText(worldline.chartId) != null &&
        sampling != null &&
        NHM2_QEI_WORLDLINE_SAMPLING_FUNCTION_KINDS.includes(
          sampling.kind as Nhm2QeiWorldlineSamplingFunctionKind,
        ) &&
        isFiniteOrNull(sampling.tauSeconds) &&
        typeof sampling.normalized === "boolean" &&
        sampledRho != null &&
        isFiniteOrNull(sampledRho.valueSI) &&
        NHM2_QEI_WORLDLINE_VALUE_STATUS_VALUES.includes(
          sampledRho.status as Nhm2QeiWorldlineValueStatus,
        ) &&
        bound != null &&
        isFiniteOrNull(bound.valueSI) &&
        NHM2_QEI_WORLDLINE_BOUND_STATUS_VALUES.includes(
          bound.status as Nhm2QeiWorldlineBoundStatus,
        ) &&
        margin != null &&
        isFiniteOrNull(margin.valueSI) &&
        (margin.pass === null || typeof margin.pass === "boolean") &&
        consistency != null &&
        NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES.includes(
          consistency.tauVsDuty as Nhm2QeiWorldlineConsistencyStatus,
        ) &&
        NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES.includes(
          consistency.tauVsLightCrossing as Nhm2QeiWorldlineConsistencyStatus,
        ) &&
        NHM2_QEI_WORLDLINE_CONSISTENCY_STATUS_VALUES.includes(
          consistency.tauVsModulation as Nhm2QeiWorldlineConsistencyStatus,
        ) &&
        isStringArray(worldline.blockers)
      );
    }) &&
    summary != null &&
    typeof summary.hasWallWorldline === "boolean" &&
    (summary.allMarginsPass === null || typeof summary.allMarginsPass === "boolean") &&
    typeof summary.anyProxy === "boolean" &&
    typeof summary.dossierComplete === "boolean" &&
    Array.isArray(record.literatureRefs) &&
    record.literatureRefs.length === 1 &&
    record.literatureRefs[0] === "ford_roman_1996_quantum_inequality"
  );
};
