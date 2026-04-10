export const NHM2_OBSERVER_AUDIT_ARTIFACT_ID = "nhm2_observer_audit";
export const NHM2_OBSERVER_AUDIT_SCHEMA_VERSION =
  "nhm2_observer_audit/v1";

export const NHM2_OBSERVER_AUDIT_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_OBSERVER_AUDIT_REASON_CODES = [
  "metric_tensor_missing",
  "tile_tensor_missing",
  "metric_audit_incomplete",
  "tile_audit_incomplete",
  "observer_condition_failed",
  "surrogate_model_limited",
] as const;

export const NHM2_OBSERVER_AUDIT_CONDITION_KEYS = [
  "nec",
  "wec",
  "sec",
  "dec",
] as const;

export const NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES = [
  "pass",
  "fail",
  "unavailable",
] as const;

export const NHM2_OBSERVER_AUDIT_FLUX_STATUS_VALUES = [
  "available",
  "assumed_zero",
  "unavailable",
] as const;

export const NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES = [
  "same_surface_violation_confirmed",
  "observer_contract_incomplete",
  "policy_review_only",
  "unknown",
] as const;

export const NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES = [
  "metric_required",
  "tile_effective",
  "both",
  "none",
  "unknown",
] as const;

export const NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES = [
  "wec",
  "nec",
  "dec",
  "sec",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES = [
  "eulerian_native",
  "robust_search_amplified",
  "robust_only",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES = [
  "aligned",
  "diverged",
  "unknown",
] as const;

export type Nhm2ObserverAuditStatus =
  (typeof NHM2_OBSERVER_AUDIT_STATUS_VALUES)[number];
export type Nhm2ObserverAuditCompleteness =
  (typeof NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES)[number];
export type Nhm2ObserverAuditReasonCode =
  (typeof NHM2_OBSERVER_AUDIT_REASON_CODES)[number];
export type Nhm2ObserverAuditConditionKey =
  (typeof NHM2_OBSERVER_AUDIT_CONDITION_KEYS)[number];
export type Nhm2ObserverAuditConditionStatus =
  (typeof NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES)[number];
export type Nhm2ObserverAuditFluxStatus =
  (typeof NHM2_OBSERVER_AUDIT_FLUX_STATUS_VALUES)[number];
export type Nhm2ObserverBlockingAssessmentStatus =
  (typeof NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES)[number];
export type Nhm2ObserverPromotionBlockingSurface =
  (typeof NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES)[number];
export type Nhm2ObserverPromotionBlockingCondition =
  (typeof NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES)[number];
export type Nhm2ObserverPrimaryBlockingMode =
  (typeof NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES)[number];
export type Nhm2ObserverPrimaryDriverAgreement =
  (typeof NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES)[number];

export type Nhm2ObserverAuditDirection = [number, number, number];

export type Nhm2ObserverAuditCondition = {
  status: Nhm2ObserverAuditConditionStatus;
  eulerianMin: number | null;
  eulerianMean: number | null;
  robustMin: number | null;
  robustMean: number | null;
  eulerianViolationFraction: number | null;
  robustViolationFraction: number | null;
  missedViolationFraction: number | null;
  severityGainMin: number | null;
  severityGainMean: number | null;
  maxRobustMinusEulerian: number | null;
  worstCase: {
    index: number | null;
    value: number | null;
    direction: Nhm2ObserverAuditDirection | null;
    rapidity: number | null;
    source: string | null;
  };
};

export type Nhm2ObserverAuditTensor = {
  tensorId: "metric_required" | "tile_effective";
  status: Nhm2ObserverAuditStatus;
  completeness: Nhm2ObserverAuditCompleteness;
  tensorRef: string | null;
  sampleCount: number | null;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  rapidityCap: number | null;
  rapidityCapBeta: number | null;
  typeI: {
    count: number | null;
    fraction: number | null;
    tolerance: number | null;
  };
  conditions: Record<
    Nhm2ObserverAuditConditionKey,
    Nhm2ObserverAuditCondition
  >;
  fluxDiagnostics: {
    status: Nhm2ObserverAuditFluxStatus;
    meanMagnitude: number | null;
    maxMagnitude: number | null;
    netMagnitude: number | null;
    netDirection: Nhm2ObserverAuditDirection | null;
    note: string | null;
  };
  consistency: {
    robustNotGreaterThanEulerian: boolean | null;
    maxRobustMinusEulerian: number | null;
  };
  model: {
    pressureModel: string | null;
    fluxHandling: string | null;
    shearHandling: string | null;
    limitationNotes: string[];
    note: string | null;
  };
  missingInputs: string[];
  primaryBlockingCondition: Nhm2ObserverPromotionBlockingCondition;
  primaryBlockingMode: Nhm2ObserverPrimaryBlockingMode;
  primaryBlockingValue: number | null;
  primaryBlockingReference: string | null;
  primaryBlockingWhy: string | null;
};

export type Nhm2ObserverAuditArtifact = {
  artifactId: typeof NHM2_OBSERVER_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof NHM2_OBSERVER_AUDIT_SCHEMA_VERSION;
  familyId: string;
  shiftLapseProfileId?: string | null;
  status: Nhm2ObserverAuditStatus;
  completeness: Nhm2ObserverAuditCompleteness;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  observerBlockingAssessmentStatus: Nhm2ObserverBlockingAssessmentStatus;
  observerBlockingAssessmentNote: string | null;
  observerPromotionBlockingSurface: Nhm2ObserverPromotionBlockingSurface;
  observerPromotionBlockingCondition: Nhm2ObserverPromotionBlockingCondition;
  observerMetricPrimaryDriver: Nhm2ObserverPromotionBlockingCondition;
  observerTilePrimaryDriver: Nhm2ObserverPromotionBlockingCondition;
  observerPrimaryDriverAgreement: Nhm2ObserverPrimaryDriverAgreement;
  observerPrimaryDriverNote: string | null;
  observerMetricFirstInspectionTarget: string | null;
  observerTileFirstInspectionTarget: string | null;
  tensors: {
    metricRequired: Nhm2ObserverAuditTensor;
    tileEffective: Nhm2ObserverAuditTensor;
  };
  distinction: {
    preserveNegativeAndMixedResults: true;
    metricTensorId: "metric_required";
    tileTensorId: "tile_effective";
  };
};

type BuildNhm2ObserverAuditConditionInput = {
  eulerianMin?: number | null;
  eulerianMean?: number | null;
  robustMin?: number | null;
  robustMean?: number | null;
  eulerianViolationFraction?: number | null;
  robustViolationFraction?: number | null;
  missedViolationFraction?: number | null;
  severityGainMin?: number | null;
  severityGainMean?: number | null;
  maxRobustMinusEulerian?: number | null;
  worstCase?: {
    index?: number | null;
    value?: number | null;
    direction?: [number, number, number] | null;
    rapidity?: number | null;
    source?: string | null;
  } | null;
} | null;

export type BuildNhm2ObserverAuditTensorInput = {
  tensorRef?: string | null;
  sampleCount?: number | null;
  rapidityCap?: number | null;
  rapidityCapBeta?: number | null;
  typeI?: {
    count?: number | null;
    fraction?: number | null;
    tolerance?: number | null;
  } | null;
  conditions?: Partial<
    Record<Nhm2ObserverAuditConditionKey, BuildNhm2ObserverAuditConditionInput>
  > | null;
  fluxDiagnostics?: {
    status?: Nhm2ObserverAuditFluxStatus | null;
    meanMagnitude?: number | null;
    maxMagnitude?: number | null;
    netMagnitude?: number | null;
    netDirection?: [number, number, number] | null;
    note?: string | null;
  } | null;
  consistency?: {
    robustNotGreaterThanEulerian?: boolean | null;
    maxRobustMinusEulerian?: number | null;
  } | null;
  model?: {
    pressureModel?: string | null;
    fluxHandling?: string | null;
    shearHandling?: string | null;
    limitationNotes?: string[] | null;
    note?: string | null;
  } | null;
  missingInputs?: string[] | null;
} | null;

export type BuildNhm2ObserverAuditArtifactInput = {
  familyId?: string | null;
  shiftLapseProfileId?: string | null;
  metricRequired?: BuildNhm2ObserverAuditTensorInput;
  tileEffective?: BuildNhm2ObserverAuditTensorInput;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toDirection = (value: unknown): Nhm2ObserverAuditDirection | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = toFinite(value[0]);
  const y = toFinite(value[1]);
  const z = toFinite(value[2]);
  return x != null && y != null && z != null ? [x, y, z] : null;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const orderReasonCodes = (
  values: Nhm2ObserverAuditReasonCode[],
): Nhm2ObserverAuditReasonCode[] =>
  unique(values).sort(
    (lhs, rhs) =>
      NHM2_OBSERVER_AUDIT_REASON_CODES.indexOf(lhs) -
      NHM2_OBSERVER_AUDIT_REASON_CODES.indexOf(rhs),
  );

const approximatelyEqual = (
  lhs: number | null,
  rhs: number | null,
  epsilon = 1e-12,
): boolean =>
  lhs != null && rhs != null && Math.abs(lhs - rhs) <= epsilon;

const buildCondition = (
  input: BuildNhm2ObserverAuditConditionInput,
): Nhm2ObserverAuditCondition => {
  const robustMin = toFinite(input?.robustMin);
  return {
    status:
      robustMin == null
        ? "unavailable"
        : robustMin < 0
          ? "fail"
          : "pass",
    eulerianMin: toFinite(input?.eulerianMin),
    eulerianMean: toFinite(input?.eulerianMean),
    robustMin,
    robustMean: toFinite(input?.robustMean),
    eulerianViolationFraction: toFinite(input?.eulerianViolationFraction),
    robustViolationFraction: toFinite(input?.robustViolationFraction),
    missedViolationFraction: toFinite(input?.missedViolationFraction),
    severityGainMin: toFinite(input?.severityGainMin),
    severityGainMean: toFinite(input?.severityGainMean),
    maxRobustMinusEulerian: toFinite(input?.maxRobustMinusEulerian),
    worstCase: {
      index: Number.isInteger(input?.worstCase?.index)
        ? Number(input?.worstCase?.index)
        : null,
      value: toFinite(input?.worstCase?.value),
      direction: toDirection(input?.worstCase?.direction),
      rapidity: toFinite(input?.worstCase?.rapidity),
      source: asText(input?.worstCase?.source),
    },
  };
};

const buildTensor = (
  tensorId: Nhm2ObserverAuditTensor["tensorId"],
  input: BuildNhm2ObserverAuditTensorInput,
): Nhm2ObserverAuditTensor => {
  const conditions = Object.fromEntries(
    NHM2_OBSERVER_AUDIT_CONDITION_KEYS.map((key) => [
      key,
      buildCondition(input?.conditions?.[key] ?? null),
    ]),
  ) as Record<Nhm2ObserverAuditConditionKey, Nhm2ObserverAuditCondition>;

  const missingInputs = Array.isArray(input?.missingInputs)
    ? input!.missingInputs
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const limitationNotes = Array.isArray(input?.model?.limitationNotes)
    ? input!.model!.limitationNotes
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null)
    : [];
  const hasConditionData = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.some(
    (key) =>
      conditions[key].robustMin != null || conditions[key].eulerianMin != null,
  );
  const hasAnyData =
    hasConditionData ||
    toFinite(input?.typeI?.fraction) != null ||
    toFinite(input?.rapidityCap) != null ||
    asText(input?.tensorRef) != null;
  const anyConditionFail = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.some(
    (key) => conditions[key].status === "fail",
  );
  const tensorMissing = !hasAnyData;
  const completeness: Nhm2ObserverAuditCompleteness =
    missingInputs.length > 0 || tensorMissing ? "incomplete" : "complete";
  const status: Nhm2ObserverAuditStatus = tensorMissing
    ? "unavailable"
    : anyConditionFail
      ? "fail"
      : hasConditionData
        ? limitationNotes.length > 0 || completeness === "incomplete"
          ? "review"
          : "pass"
        : "unavailable";
  const reasonCodes: Nhm2ObserverAuditReasonCode[] = [];
  if (tensorMissing) {
    reasonCodes.push(
      tensorId === "metric_required"
        ? "metric_tensor_missing"
        : "tile_tensor_missing",
    );
  }
  if (completeness === "incomplete") {
    reasonCodes.push(
      tensorId === "metric_required"
        ? "metric_audit_incomplete"
        : "tile_audit_incomplete",
    );
  }
  if (anyConditionFail) reasonCodes.push("observer_condition_failed");
  if (limitationNotes.length > 0) reasonCodes.push("surrogate_model_limited");

  return {
    tensorId,
    status,
    completeness,
    tensorRef: asText(input?.tensorRef),
    sampleCount: toFinite(input?.sampleCount),
    reasonCodes: orderReasonCodes(reasonCodes),
    rapidityCap: toFinite(input?.rapidityCap),
    rapidityCapBeta: toFinite(input?.rapidityCapBeta),
    typeI: {
      count: toFinite(input?.typeI?.count),
      fraction: toFinite(input?.typeI?.fraction),
      tolerance: toFinite(input?.typeI?.tolerance),
    },
    conditions,
    fluxDiagnostics: {
      status:
        input?.fluxDiagnostics?.status === "available" ||
        input?.fluxDiagnostics?.status === "assumed_zero"
          ? input.fluxDiagnostics.status
          : "unavailable",
      meanMagnitude: toFinite(input?.fluxDiagnostics?.meanMagnitude),
      maxMagnitude: toFinite(input?.fluxDiagnostics?.maxMagnitude),
      netMagnitude: toFinite(input?.fluxDiagnostics?.netMagnitude),
      netDirection: toDirection(input?.fluxDiagnostics?.netDirection),
      note: asText(input?.fluxDiagnostics?.note),
    },
    consistency: {
      robustNotGreaterThanEulerian: toNullableBoolean(
        input?.consistency?.robustNotGreaterThanEulerian,
      ),
      maxRobustMinusEulerian: toFinite(
        input?.consistency?.maxRobustMinusEulerian,
      ),
    },
    model: {
      pressureModel: asText(input?.model?.pressureModel),
      fluxHandling: asText(input?.model?.fluxHandling),
      shearHandling: asText(input?.model?.shearHandling),
      limitationNotes,
      note: asText(input?.model?.note),
    },
    missingInputs,
    primaryBlockingCondition: "unknown",
    primaryBlockingMode: "unknown",
    primaryBlockingValue: null,
    primaryBlockingReference: null,
    primaryBlockingWhy: null,
  };
};

type Nhm2ObserverBlockingHit = {
  surface: Nhm2ObserverAuditTensor["tensorId"];
  condition: Nhm2ObserverAuditConditionKey;
};

type Nhm2ObserverPrimaryBlockingLocalization = {
  condition: Nhm2ObserverPromotionBlockingCondition;
  mode: Nhm2ObserverPrimaryBlockingMode;
  value: number | null;
  reference: string | null;
  why: string | null;
  inspectionTarget: string | null;
};

const collectConfirmedBlockingHits = (
  surface: Nhm2ObserverAuditTensor["tensorId"],
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverBlockingHit[] =>
  NHM2_OBSERVER_AUDIT_CONDITION_KEYS.flatMap((condition) => {
    const summary = tensor.conditions[condition];
    return summary.status === "fail" &&
      summary.robustMin != null &&
      summary.robustMin < 0 &&
      summary.missedViolationFraction === 0 &&
      summary.maxRobustMinusEulerian != null &&
      summary.maxRobustMinusEulerian <= 0
      ? [{ surface, condition }]
      : [];
  });

const asNaturalList = (values: string[]): string => {
  if (values.length === 0) return "none";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const PRIMARY_MODE_PRIORITY: Record<Nhm2ObserverPrimaryBlockingMode, number> = {
  eulerian_native: 0,
  robust_search_amplified: 1,
  robust_only: 2,
  mixed: 3,
  unknown: 4,
};

const PRIMARY_CONDITION_PRIORITY: Record<
  Nhm2ObserverAuditConditionKey,
  number
> = {
  wec: 0,
  nec: 1,
  dec: 2,
  sec: 3,
};

const classifyPrimaryBlockingMode = (
  condition: Nhm2ObserverAuditCondition,
): Nhm2ObserverPrimaryBlockingMode => {
  if (condition.status !== "fail" || condition.robustMin == null) return "unknown";
  const eulerianNegative =
    condition.eulerianMin != null && condition.eulerianMin < 0;
  if (!eulerianNegative) return "robust_only";
  if (
    (condition.maxRobustMinusEulerian != null &&
      condition.maxRobustMinusEulerian < -1e-12) ||
    (condition.eulerianMin != null &&
      condition.robustMin < condition.eulerianMin - 1e-12)
  ) {
    return "robust_search_amplified";
  }
  if (
    (condition.maxRobustMinusEulerian != null &&
      Math.abs(condition.maxRobustMinusEulerian) <= 1e-12) ||
    approximatelyEqual(condition.robustMin, condition.eulerianMin)
  ) {
    return "eulerian_native";
  }
  return "mixed";
};

const buildPrimaryBlockingWhy = (
  tensor: Nhm2ObserverAuditTensor,
  conditionKey: Nhm2ObserverAuditConditionKey,
  mode: Nhm2ObserverPrimaryBlockingMode,
): string => {
  const notes: string[] = [];
  if (mode === "eulerian_native") {
    notes.push(
      `${conditionKey.toUpperCase()} is already negative on the Eulerian sample and robust search does not deepen the minimum.`,
    );
  } else if (mode === "robust_search_amplified") {
    notes.push(
      `${conditionKey.toUpperCase()} is negative on the Eulerian sample and robust search drives the emitted minimum lower.`,
    );
  } else if (mode === "robust_only") {
    notes.push(
      `${conditionKey.toUpperCase()} is Eulerian-clean on the emitted sample but turns negative under the robust observer search.`,
    );
  } else if (mode === "mixed") {
    notes.push(
      `${conditionKey.toUpperCase()} mixes Eulerian negativity with additional robust-search deformation on the emitted surface.`,
    );
  } else {
    notes.push(
      `${conditionKey.toUpperCase()} primary blocking mode could not be resolved from current emitted evidence.`,
    );
  }

  if (
    conditionKey === "wec" &&
    tensor.conditions.dec.status === "fail" &&
    tensor.conditions.dec.robustMin != null &&
    tensor.conditions.dec.robustMin < 0
  ) {
    notes.push("DEC co-fails downstream of the same negative energy density.");
  }
  if (
    tensor.tensorId === "tile_effective" &&
    conditionKey === "wec" &&
    ((tensor.conditions.nec.status === "fail" &&
      tensor.conditions.nec.robustMin != null &&
      tensor.conditions.nec.robustMin < 0) ||
      (tensor.conditions.sec.status === "fail" &&
        tensor.conditions.sec.robustMin != null &&
        tensor.conditions.sec.robustMin < 0))
  ) {
    notes.push(
      "NEC/SEC remain secondary search-driven failures on the tile-effective surface.",
    );
  }

  return notes.join(" ");
};

const localizePrimaryBlocking = (
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverPrimaryBlockingLocalization => {
  const wecFails =
    tensor.conditions.wec.status === "fail" &&
    tensor.conditions.wec.robustMin != null &&
    tensor.conditions.wec.robustMin < 0;

  const candidates = NHM2_OBSERVER_AUDIT_CONDITION_KEYS.flatMap((conditionKey) => {
    const condition = tensor.conditions[conditionKey];
    if (condition.status !== "fail" || condition.robustMin == null) return [];
    return [
      {
        conditionKey,
        mode: classifyPrimaryBlockingMode(condition),
        value: condition.robustMin,
        missedViolationFraction:
          condition.missedViolationFraction == null
            ? Number.POSITIVE_INFINITY
            : condition.missedViolationFraction,
        downstreamPenalty: conditionKey === "dec" && wecFails ? 1 : 0,
      },
    ];
  });

  if (candidates.length === 0) {
    return {
      condition: "unknown",
      mode: "unknown",
      value: null,
      reference: null,
      why: null,
      inspectionTarget: null,
    };
  }

  candidates.sort((lhs, rhs) => {
    const byMode =
      PRIMARY_MODE_PRIORITY[lhs.mode] - PRIMARY_MODE_PRIORITY[rhs.mode];
    if (byMode !== 0) return byMode;
    const byPenalty = lhs.downstreamPenalty - rhs.downstreamPenalty;
    if (byPenalty !== 0) return byPenalty;
    const byMissed =
      lhs.missedViolationFraction - rhs.missedViolationFraction;
    if (byMissed !== 0) return byMissed;
    const byCondition =
      PRIMARY_CONDITION_PRIORITY[lhs.conditionKey] -
      PRIMARY_CONDITION_PRIORITY[rhs.conditionKey];
    if (byCondition !== 0) return byCondition;
    return Math.abs(rhs.value) - Math.abs(lhs.value);
  });

  const primary = candidates[0];
  const reference = `${tensor.tensorId}.conditions.${primary.conditionKey}`;
  return {
    condition: primary.conditionKey,
    mode: primary.mode,
    value: primary.value,
    reference,
    why: buildPrimaryBlockingWhy(tensor, primary.conditionKey, primary.mode),
    inspectionTarget: reference,
  };
};

const summarizePrimaryDriverAgreement = (
  metric: Nhm2ObserverPrimaryBlockingLocalization,
  tile: Nhm2ObserverPrimaryBlockingLocalization,
): Nhm2ObserverPrimaryDriverAgreement => {
  if (metric.condition === "unknown" || tile.condition === "unknown") {
    return "unknown";
  }
  return metric.condition === tile.condition ? "aligned" : "diverged";
};

const buildPrimaryDriverNote = (args: {
  metric: Nhm2ObserverPrimaryBlockingLocalization;
  tile: Nhm2ObserverPrimaryBlockingLocalization;
}): string | null => {
  if (args.metric.condition === "unknown" && args.tile.condition === "unknown") {
    return null;
  }
  const notes: string[] = [];
  if (args.metric.condition !== "unknown") {
    notes.push(
      `metric_required first localizes to ${args.metric.condition.toUpperCase()} (${args.metric.mode}) at ${args.metric.reference}. ${args.metric.why}`,
    );
  }
  if (args.tile.condition !== "unknown") {
    notes.push(
      `tile_effective first localizes to ${args.tile.condition.toUpperCase()} (${args.tile.mode}) at ${args.tile.reference}. ${args.tile.why}`,
    );
  }
  return notes.join(" ");
};

const summarizeBlockingSurface = (
  hits: Nhm2ObserverBlockingHit[],
): Nhm2ObserverPromotionBlockingSurface => {
  const surfaces = unique(hits.map((entry) => entry.surface));
  if (surfaces.length === 0) return "none";
  if (surfaces.length > 1) return "both";
  return surfaces[0];
};

const summarizeBlockingCondition = (
  hits: Nhm2ObserverBlockingHit[],
): Nhm2ObserverPromotionBlockingCondition => {
  const conditions = unique(hits.map((entry) => entry.condition));
  if (conditions.length === 0) return "unknown";
  if (conditions.length > 1) return "mixed";
  return conditions[0];
};

const buildObserverBlockingAssessment = (args: {
  metricRequired: Nhm2ObserverAuditTensor;
  tileEffective: Nhm2ObserverAuditTensor;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
  completeness: Nhm2ObserverAuditCompleteness;
}): {
  status: Nhm2ObserverBlockingAssessmentStatus;
  note: string | null;
  surface: Nhm2ObserverPromotionBlockingSurface;
  condition: Nhm2ObserverPromotionBlockingCondition;
} => {
  const hits = [
    ...collectConfirmedBlockingHits("metric_required", args.metricRequired),
    ...collectConfirmedBlockingHits("tile_effective", args.tileEffective),
  ];
  if (hits.length > 0) {
    const surface = summarizeBlockingSurface(hits);
    const condition = summarizeBlockingCondition(hits);
    const hitConditions = unique(hits.map((entry) => entry.condition.toUpperCase()));
    const conditionText =
      condition === "mixed"
        ? `mixed ${asNaturalList(hitConditions)} conditions`
        : `${condition.toUpperCase()} condition`;
    const surfaceText =
      surface === "both" ? "metric_required and tile_effective tensors" : `${surface} tensor`;
    const noteParts = [
      `${surfaceText} emit concrete failing ${conditionText} with missedViolationFraction=0 and non-positive maxRobustMinusEulerian.`,
    ];
    if (args.reasonCodes.includes("surrogate_model_limited")) {
      noteParts.push(
        "Policy review remains required because surrogate-model limitations are still present.",
      );
    }
    return {
      status: "same_surface_violation_confirmed",
      note: noteParts.join(" "),
      surface,
      condition,
    };
  }

  if (args.completeness === "incomplete") {
    const incompleteNotes = [
      args.metricRequired.status === "unavailable"
        ? "metric_required tensor unavailable"
        : null,
      args.metricRequired.missingInputs.length > 0
        ? `metric_required missing ${args.metricRequired.missingInputs.join(", ")}`
        : null,
      args.metricRequired.fluxDiagnostics.status !== "available"
        ? `metric_required fluxDiagnostics=${args.metricRequired.fluxDiagnostics.status}`
        : null,
      args.tileEffective.status === "unavailable"
        ? "tile_effective tensor unavailable"
        : null,
      args.tileEffective.missingInputs.length > 0
        ? `tile_effective missing ${args.tileEffective.missingInputs.join(", ")}`
        : null,
      args.tileEffective.fluxDiagnostics.status !== "available"
        ? `tile_effective fluxDiagnostics=${args.tileEffective.fluxDiagnostics.status}`
        : null,
    ].filter((entry): entry is string => entry != null);
    return {
      status: "observer_contract_incomplete",
      note:
        incompleteNotes.length > 0
          ? incompleteNotes.join("; ")
          : "Observer audit remains incomplete on current runtime surfaces.",
      surface: "unknown",
      condition: "unknown",
    };
  }

  if (args.reasonCodes.includes("surrogate_model_limited")) {
    return {
      status: "policy_review_only",
      note:
        "Current observer conditions do not emit a confirmed same-surface blocker, but surrogate-model limitations still require policy review.",
      surface: "none",
      condition: "unknown",
    };
  }

  return {
    status: "unknown",
    note: "Observer blocking assessment could not be resolved from current runtime evidence.",
    surface: "unknown",
    condition: "unknown",
  };
};

export const buildNhm2ObserverAuditArtifact = (
  input: BuildNhm2ObserverAuditArtifactInput,
): Nhm2ObserverAuditArtifact => {
  const metricTensor = buildTensor("metric_required", input.metricRequired);
  const tileTensor = buildTensor("tile_effective", input.tileEffective);
  const metricPrimaryLocalization = localizePrimaryBlocking(metricTensor);
  const tilePrimaryLocalization = localizePrimaryBlocking(tileTensor);
  const metricRequired: Nhm2ObserverAuditTensor = {
    ...metricTensor,
    primaryBlockingCondition: metricPrimaryLocalization.condition,
    primaryBlockingMode: metricPrimaryLocalization.mode,
    primaryBlockingValue: metricPrimaryLocalization.value,
    primaryBlockingReference: metricPrimaryLocalization.reference,
    primaryBlockingWhy: metricPrimaryLocalization.why,
  };
  const tileEffective: Nhm2ObserverAuditTensor = {
    ...tileTensor,
    primaryBlockingCondition: tilePrimaryLocalization.condition,
    primaryBlockingMode: tilePrimaryLocalization.mode,
    primaryBlockingValue: tilePrimaryLocalization.value,
    primaryBlockingReference: tilePrimaryLocalization.reference,
    primaryBlockingWhy: tilePrimaryLocalization.why,
  };
  const reasonCodes = orderReasonCodes([
    ...metricRequired.reasonCodes,
    ...tileEffective.reasonCodes,
  ]);
  const completeness: Nhm2ObserverAuditCompleteness =
    metricRequired.completeness === "incomplete" ||
    tileEffective.completeness === "incomplete"
      ? "incomplete"
      : "complete";
  const status: Nhm2ObserverAuditStatus =
    metricRequired.status === "fail" || tileEffective.status === "fail"
      ? "fail"
      : metricRequired.status === "review" || tileEffective.status === "review"
        ? "review"
        : metricRequired.status === "pass" && tileEffective.status === "pass"
          ? "pass"
          : "unavailable";
  const observerBlockingAssessment = buildObserverBlockingAssessment({
    metricRequired,
    tileEffective,
    reasonCodes,
    completeness,
  });
  const observerPrimaryDriverAgreement = summarizePrimaryDriverAgreement(
    metricPrimaryLocalization,
    tilePrimaryLocalization,
  );
  const observerPrimaryDriverNote = buildPrimaryDriverNote({
    metric: metricPrimaryLocalization,
    tile: tilePrimaryLocalization,
  });

  return {
    artifactId: NHM2_OBSERVER_AUDIT_ARTIFACT_ID,
    schemaVersion: NHM2_OBSERVER_AUDIT_SCHEMA_VERSION,
    familyId: asText(input.familyId) ?? "nhm2_shift_lapse",
    shiftLapseProfileId: asText(input.shiftLapseProfileId),
    status,
    completeness,
    reasonCodes,
    observerBlockingAssessmentStatus: observerBlockingAssessment.status,
    observerBlockingAssessmentNote: observerBlockingAssessment.note,
    observerPromotionBlockingSurface: observerBlockingAssessment.surface,
    observerPromotionBlockingCondition: observerBlockingAssessment.condition,
    observerMetricPrimaryDriver: metricPrimaryLocalization.condition,
    observerTilePrimaryDriver: tilePrimaryLocalization.condition,
    observerPrimaryDriverAgreement,
    observerPrimaryDriverNote,
    observerMetricFirstInspectionTarget:
      metricPrimaryLocalization.inspectionTarget,
    observerTileFirstInspectionTarget:
      tilePrimaryLocalization.inspectionTarget,
    tensors: {
      metricRequired,
      tileEffective,
    },
    distinction: {
      preserveNegativeAndMixedResults: true,
      metricTensorId: "metric_required",
      tileTensorId: "tile_effective",
    },
  };
};

const isReasonCodeArray = (
  value: unknown,
): value is Nhm2ObserverAuditReasonCode[] =>
  Array.isArray(value) &&
  value.every((entry) =>
    NHM2_OBSERVER_AUDIT_REASON_CODES.includes(entry as Nhm2ObserverAuditReasonCode),
  );

const isBlockingAssessmentStatus = (
  value: unknown,
): value is Nhm2ObserverBlockingAssessmentStatus =>
  NHM2_OBSERVER_BLOCKING_ASSESSMENT_STATUS_VALUES.includes(
    value as Nhm2ObserverBlockingAssessmentStatus,
  );

const isBlockingSurface = (
  value: unknown,
): value is Nhm2ObserverPromotionBlockingSurface =>
  NHM2_OBSERVER_PROMOTION_BLOCKING_SURFACE_VALUES.includes(
    value as Nhm2ObserverPromotionBlockingSurface,
  );

const isBlockingCondition = (
  value: unknown,
): value is Nhm2ObserverPromotionBlockingCondition =>
  NHM2_OBSERVER_PROMOTION_BLOCKING_CONDITION_VALUES.includes(
    value as Nhm2ObserverPromotionBlockingCondition,
  );

const isPrimaryBlockingMode = (
  value: unknown,
): value is Nhm2ObserverPrimaryBlockingMode =>
  NHM2_OBSERVER_PRIMARY_BLOCKING_MODE_VALUES.includes(
    value as Nhm2ObserverPrimaryBlockingMode,
  );

const isPrimaryDriverAgreement = (
  value: unknown,
): value is Nhm2ObserverPrimaryDriverAgreement =>
  NHM2_OBSERVER_PRIMARY_DRIVER_AGREEMENT_VALUES.includes(
    value as Nhm2ObserverPrimaryDriverAgreement,
  );

const isDirection = (value: unknown): value is Nhm2ObserverAuditDirection =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => Number.isFinite(Number(entry)));

const isCondition = (value: unknown): value is Nhm2ObserverAuditCondition => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const status = record.status;
  return (
    NHM2_OBSERVER_AUDIT_CONDITION_STATUS_VALUES.includes(
      status as Nhm2ObserverAuditConditionStatus,
    ) &&
    (record.eulerianMin === null || Number.isFinite(Number(record.eulerianMin))) &&
    (record.robustMin === null || Number.isFinite(Number(record.robustMin))) &&
    record.worstCase != null &&
    typeof record.worstCase === "object" &&
    ((record.worstCase as Record<string, unknown>).direction === null ||
      isDirection((record.worstCase as Record<string, unknown>).direction))
  );
};

const isTensor = (value: unknown): value is Nhm2ObserverAuditTensor => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const conditions = record.conditions as Record<string, unknown> | undefined;
  return (
    (record.tensorId === "metric_required" || record.tensorId === "tile_effective") &&
    NHM2_OBSERVER_AUDIT_STATUS_VALUES.includes(
      record.status as Nhm2ObserverAuditStatus,
    ) &&
    NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2ObserverAuditCompleteness,
    ) &&
    isReasonCodeArray(record.reasonCodes) &&
    Array.isArray(record.missingInputs) &&
    record.missingInputs.every((entry) => typeof entry === "string") &&
    isBlockingCondition(record.primaryBlockingCondition) &&
    isPrimaryBlockingMode(record.primaryBlockingMode) &&
    (record.primaryBlockingValue === null ||
      Number.isFinite(Number(record.primaryBlockingValue))) &&
    (record.primaryBlockingReference === null ||
      typeof record.primaryBlockingReference === "string") &&
    (record.primaryBlockingWhy === null ||
      typeof record.primaryBlockingWhy === "string") &&
    conditions != null &&
    NHM2_OBSERVER_AUDIT_CONDITION_KEYS.every((key) => isCondition(conditions[key]))
  );
};

export const isNhm2ObserverAuditArtifact = (
  value: unknown,
): value is Nhm2ObserverAuditArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const tensors = record.tensors as Record<string, unknown> | undefined;
  return (
    record.artifactId === NHM2_OBSERVER_AUDIT_ARTIFACT_ID &&
    record.schemaVersion === NHM2_OBSERVER_AUDIT_SCHEMA_VERSION &&
    typeof record.familyId === "string" &&
    (record.shiftLapseProfileId === undefined ||
      record.shiftLapseProfileId === null ||
      typeof record.shiftLapseProfileId === "string") &&
    NHM2_OBSERVER_AUDIT_STATUS_VALUES.includes(
      record.status as Nhm2ObserverAuditStatus,
    ) &&
    NHM2_OBSERVER_AUDIT_COMPLETENESS_VALUES.includes(
      record.completeness as Nhm2ObserverAuditCompleteness,
    ) &&
    isReasonCodeArray(record.reasonCodes) &&
    isBlockingAssessmentStatus(record.observerBlockingAssessmentStatus) &&
    (record.observerBlockingAssessmentNote === null ||
      typeof record.observerBlockingAssessmentNote === "string") &&
    isBlockingSurface(record.observerPromotionBlockingSurface) &&
    isBlockingCondition(record.observerPromotionBlockingCondition) &&
    isBlockingCondition(record.observerMetricPrimaryDriver) &&
    isBlockingCondition(record.observerTilePrimaryDriver) &&
    isPrimaryDriverAgreement(record.observerPrimaryDriverAgreement) &&
    (record.observerPrimaryDriverNote === null ||
      typeof record.observerPrimaryDriverNote === "string") &&
    (record.observerMetricFirstInspectionTarget === null ||
      typeof record.observerMetricFirstInspectionTarget === "string") &&
    (record.observerTileFirstInspectionTarget === null ||
      typeof record.observerTileFirstInspectionTarget === "string") &&
    tensors != null &&
    isTensor(tensors.metricRequired) &&
    isTensor(tensors.tileEffective)
  );
};
