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

export const NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES = [
  "negative_energy_density",
  "dec_downstream_of_negative_energy",
  "null_violation_independent",
  "strong_condition_independent",
  "mixed_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES = [
  "primary_only",
  "dec_downstream_of_wec",
  "independent_cofailure",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES = [
  "shared_root_driver_confirmed",
  "surface_specific_drivers",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES = [
  "metric_t00_density",
  "tile_t00_density",
  "metric_energy_density_proxy",
  "tile_energy_density_proxy",
  "mixed_upstream",
  "unknown",
] as const;

export const NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES = [
  "direct_same_surface_driver",
  "same_family_different_ref",
  "proxy_derived_driver",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES = [
  "shared_exact_ref",
  "shared_driver_class",
  "surface_specific_upstream_refs",
  "mixed",
  "unknown",
] as const;

export const NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES = [
  "shared_propagation_detected",
  "metric_only_propagation",
  "weak_cross_surface_propagation",
  "tile_proxy_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES = [
  "shared_metric_first",
  "metric_then_tile_proxy",
  "tile_proxy_independent",
  "unknown",
] as const;

export const NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES = [
  "productive",
  "likely_stop_territory",
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
export type Nhm2ObserverRootCauseClass =
  (typeof NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES)[number];
export type Nhm2ObserverBlockingDependencyStatus =
  (typeof NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES)[number];
export type Nhm2ObserverSharedRootDriverStatus =
  (typeof NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES)[number];
export type Nhm2ObserverUpstreamDriverClass =
  (typeof NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES)[number];
export type Nhm2ObserverUpstreamDriverDependencyStatus =
  (typeof NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES)[number];
export type Nhm2ObserverSharedUpstreamDriverStatus =
  (typeof NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES)[number];
export type Nhm2ObserverWecPropagationStatus =
  (typeof NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES)[number];
export type Nhm2ObserverRemediationSequenceStatus =
  (typeof NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES)[number];
export type Nhm2ObserverTileDiminishingReturnStatus =
  (typeof NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES)[number];

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
  rootCauseClass: Nhm2ObserverRootCauseClass;
  blockingDependencyStatus: Nhm2ObserverBlockingDependencyStatus;
  blockingDependencyNote: string | null;
  firstRemediationTarget: string | null;
  firstRemediationWhy: string | null;
  upstreamDriverRef: string | null;
  upstreamDriverClass: Nhm2ObserverUpstreamDriverClass;
  upstreamDriverDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  upstreamDriverNote: string | null;
  firstUpstreamRemediationTarget: string | null;
  firstUpstreamRemediationWhy: string | null;
  wecProbeApplied: boolean;
  wecProbeScale: number | null;
  wecProbeBaseline: number | null;
  wecProbeResult: number | null;
  wecProbeDelta: number | null;
  decProbeBaseline: number | null;
  decProbeResult: number | null;
  decProbeDelta: number | null;
  wecProbeInterpretation: string | null;
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
  observerSharedRootDriverStatus: Nhm2ObserverSharedRootDriverStatus;
  observerSharedRootDriverNote: string | null;
  observerSharedUpstreamDriverStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  observerSharedUpstreamDriverNote: string | null;
  observerWecPropagationStatus: Nhm2ObserverWecPropagationStatus;
  observerWecPropagationNote: string | null;
  observerRemediationSequenceStatus: Nhm2ObserverRemediationSequenceStatus;
  observerTileDiminishingReturnStatus: Nhm2ObserverTileDiminishingReturnStatus;
  observerTileDiminishingReturnNote: string | null;
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
  upstreamDriverRef?: string | null;
  upstreamDriverClass?: Nhm2ObserverUpstreamDriverClass | null;
  upstreamDriverDependencyStatus?:
    | Nhm2ObserverUpstreamDriverDependencyStatus
    | null;
  upstreamDriverNote?: string | null;
  firstUpstreamRemediationTarget?: string | null;
  firstUpstreamRemediationWhy?: string | null;
  wecProbeScale?: number | null;
  wecProbeResponseFactor?: number | null;
} | null;

export type BuildNhm2ObserverAuditArtifactInput = {
  familyId?: string | null;
  shiftLapseProfileId?: string | null;
  metricRequired?: BuildNhm2ObserverAuditTensorInput;
  tileEffective?: BuildNhm2ObserverAuditTensorInput;
  observerTileDiminishingReturnStatus?:
    | Nhm2ObserverTileDiminishingReturnStatus
    | null;
  observerTileDiminishingReturnNote?: string | null;
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

const NHM2_OBSERVER_WEC_PROBE_DEFAULT_SCALE = 0.5;
const NHM2_OBSERVER_WEC_SHARED_PROPAGATION_RATIO = 0.25;
const NHM2_OBSERVER_WEC_WEAK_PROPAGATION_RATIO = 0.05;

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
    rootCauseClass: "unknown",
    blockingDependencyStatus: "unknown",
    blockingDependencyNote: null,
    firstRemediationTarget: null,
    firstRemediationWhy: null,
    upstreamDriverRef: null,
    upstreamDriverClass: "unknown",
    upstreamDriverDependencyStatus: "unknown",
    upstreamDriverNote: null,
    firstUpstreamRemediationTarget: null,
    firstUpstreamRemediationWhy: null,
    wecProbeApplied: false,
    wecProbeScale: null,
    wecProbeBaseline: null,
    wecProbeResult: null,
    wecProbeDelta: null,
    decProbeBaseline: null,
    decProbeResult: null,
    decProbeDelta: null,
    wecProbeInterpretation: null,
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

type Nhm2ObserverRootCauseLocalization = {
  rootCauseClass: Nhm2ObserverRootCauseClass;
  blockingDependencyStatus: Nhm2ObserverBlockingDependencyStatus;
  blockingDependencyNote: string | null;
  firstRemediationTarget: string | null;
  firstRemediationWhy: string | null;
};

type Nhm2ObserverUpstreamDriverLocalization = {
  upstreamDriverRef: string | null;
  upstreamDriverClass: Nhm2ObserverUpstreamDriverClass;
  upstreamDriverDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  upstreamDriverNote: string | null;
  firstUpstreamRemediationTarget: string | null;
  firstUpstreamRemediationWhy: string | null;
};

type Nhm2ObserverWecProbeLocalization = {
  wecProbeApplied: boolean;
  wecProbeScale: number | null;
  wecProbeBaseline: number | null;
  wecProbeResult: number | null;
  wecProbeDelta: number | null;
  decProbeBaseline: number | null;
  decProbeResult: number | null;
  decProbeDelta: number | null;
  wecProbeInterpretation: string | null;
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

const hasFailingNegative = (condition: Nhm2ObserverAuditCondition): boolean =>
  condition.status === "fail" &&
  condition.robustMin != null &&
  condition.robustMin < 0;

const hasEulerianNegative = (condition: Nhm2ObserverAuditCondition): boolean =>
  condition.eulerianMin != null && condition.eulerianMin < 0;

const isRobustOnlyFailure = (condition: Nhm2ObserverAuditCondition): boolean =>
  hasFailingNegative(condition) && !hasEulerianNegative(condition);

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

const localizeRootCause = (
  tensor: Nhm2ObserverAuditTensor,
): Nhm2ObserverRootCauseLocalization => {
  const primaryCondition = tensor.primaryBlockingCondition;
  const primaryReference =
    tensor.primaryBlockingReference ??
    (primaryCondition === "unknown" || primaryCondition === "mixed"
      ? null
      : `${tensor.tensorId}.conditions.${primaryCondition}`);
  const wecFails = hasFailingNegative(tensor.conditions.wec);
  const necFails = hasFailingNegative(tensor.conditions.nec);
  const decFails = hasFailingNegative(tensor.conditions.dec);
  const secFails = hasFailingNegative(tensor.conditions.sec);
  const robustOnlySecondary = (
    [
      ["nec", tensor.conditions.nec],
      ["sec", tensor.conditions.sec],
      ["dec", tensor.conditions.dec],
    ] as const
  )
    .filter(([conditionKey, condition]) => {
      if (conditionKey === primaryCondition) return false;
      return isRobustOnlyFailure(condition);
    })
    .map(([conditionKey]) => conditionKey.toUpperCase());

  if (primaryCondition === "wec") {
    const dependencyNotes: string[] = [];
    if (decFails) {
      dependencyNotes.push(
        "DEC fails on the same surface and is treated as downstream of the emitted WEC negativity.",
      );
    }
    if (robustOnlySecondary.length > 0) {
      dependencyNotes.push(
        `${asNaturalList(robustOnlySecondary)} remain secondary robust-only co-failures and are not treated as independent primary blockers.`,
      );
    }
    return {
      rootCauseClass: "negative_energy_density",
      blockingDependencyStatus: decFails ? "dec_downstream_of_wec" : "primary_only",
      blockingDependencyNote:
        dependencyNotes.length > 0
          ? dependencyNotes.join(" ")
          : "WEC is the first emitted negative-energy blocker on this surface.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy: decFails
        ? "Start at the emitted WEC surface because DEC is downstream of the same negative energy density."
        : "Start at the emitted WEC surface because it is the first localized blocking condition.",
    };
  }

  if (primaryCondition === "dec") {
    if (wecFails) {
      return {
        rootCauseClass: "dec_downstream_of_negative_energy",
        blockingDependencyStatus: "dec_downstream_of_wec",
        blockingDependencyNote:
          "DEC localizes first on this surface, but emitted WEC is also negative, so DEC is treated as downstream of the same negative-energy driver.",
        firstRemediationTarget: `${tensor.tensorId}.conditions.wec`,
        firstRemediationWhy:
          "Start at the emitted WEC surface because DEC is downstream of the same negative energy density.",
      };
    }
    return {
      rootCauseClass: "mixed_independent",
      blockingDependencyStatus:
        necFails || secFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "DEC is the first emitted blocker on this surface and no upstream WEC failure is present.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted DEC surface because no upstream WEC blocker is present on this tensor.",
    };
  }

  if (primaryCondition === "nec") {
    return {
      rootCauseClass: "null_violation_independent",
      blockingDependencyStatus:
        wecFails || decFails || secFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "NEC is the first emitted blocker on this surface and is treated as an independent null-direction violation.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted NEC surface because it is the first independent null-direction blocker.",
    };
  }

  if (primaryCondition === "sec") {
    return {
      rootCauseClass: "strong_condition_independent",
      blockingDependencyStatus:
        wecFails || necFails || decFails ? "independent_cofailure" : "primary_only",
      blockingDependencyNote:
        "SEC is the first emitted blocker on this surface and is treated as an independent strong-condition failure.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "Start at the emitted SEC surface because it is the first independent strong-condition blocker.",
    };
  }

  if (primaryCondition === "mixed") {
    return {
      rootCauseClass: "mixed_independent",
      blockingDependencyStatus: "mixed",
      blockingDependencyNote:
        "Multiple emitted observer conditions compete as primary blockers on this surface.",
      firstRemediationTarget: primaryReference,
      firstRemediationWhy:
        "No single emitted condition dominates strongly enough for a narrower remediation target.",
    };
  }

  return {
    rootCauseClass: "unknown",
    blockingDependencyStatus: "unknown",
    blockingDependencyNote: null,
    firstRemediationTarget: null,
    firstRemediationWhy: null,
  };
};

const normalizeRootCauseFamily = (
  value: Nhm2ObserverRootCauseClass,
): string | null => {
  switch (value) {
    case "negative_energy_density":
    case "dec_downstream_of_negative_energy":
      return "negative_energy_density";
    case "null_violation_independent":
      return "null_violation_independent";
    case "strong_condition_independent":
      return "strong_condition_independent";
    case "mixed_independent":
      return "mixed_independent";
    default:
      return null;
  }
};

const normalizeUpstreamDriverFamily = (
  value: Nhm2ObserverUpstreamDriverClass,
): string | null => {
  switch (value) {
    case "metric_t00_density":
    case "tile_t00_density":
      return "t00_density";
    case "metric_energy_density_proxy":
    case "tile_energy_density_proxy":
      return "energy_density_proxy";
    default:
      return null;
  }
};

const isUpstreamDriverClass = (
  value: unknown,
): value is Nhm2ObserverUpstreamDriverClass =>
  NHM2_OBSERVER_UPSTREAM_DRIVER_CLASS_VALUES.includes(
    value as Nhm2ObserverUpstreamDriverClass,
  );

const isUpstreamDriverDependencyStatus = (
  value: unknown,
): value is Nhm2ObserverUpstreamDriverDependencyStatus =>
  NHM2_OBSERVER_UPSTREAM_DRIVER_DEPENDENCY_STATUS_VALUES.includes(
    value as Nhm2ObserverUpstreamDriverDependencyStatus,
  );

const isSharedUpstreamDriverStatus = (
  value: unknown,
): value is Nhm2ObserverSharedUpstreamDriverStatus =>
  NHM2_OBSERVER_SHARED_UPSTREAM_DRIVER_STATUS_VALUES.includes(
    value as Nhm2ObserverSharedUpstreamDriverStatus,
  );

const isWecPropagationStatus = (
  value: unknown,
): value is Nhm2ObserverWecPropagationStatus =>
  NHM2_OBSERVER_WEC_PROPAGATION_STATUS_VALUES.includes(
    value as Nhm2ObserverWecPropagationStatus,
  );

const isRemediationSequenceStatus = (
  value: unknown,
): value is Nhm2ObserverRemediationSequenceStatus =>
  NHM2_OBSERVER_REMEDIATION_SEQUENCE_STATUS_VALUES.includes(
    value as Nhm2ObserverRemediationSequenceStatus,
  );

const isTileDiminishingReturnStatus = (
  value: unknown,
): value is Nhm2ObserverTileDiminishingReturnStatus =>
  NHM2_OBSERVER_TILE_DIMINISHING_RETURN_STATUS_VALUES.includes(
    value as Nhm2ObserverTileDiminishingReturnStatus,
  );

const inferUpstreamDriverClass = (args: {
  tensor: Nhm2ObserverAuditTensor;
  rootCauseClass: Nhm2ObserverRootCauseClass;
}): Nhm2ObserverUpstreamDriverClass => {
  if (
    args.rootCauseClass !== "negative_energy_density" &&
    args.rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return "unknown";
  }
  if (args.tensor.tensorId === "metric_required") {
    return "metric_t00_density";
  }
  return args.tensor.model.pressureModel === "diagonal_tensor_components"
    ? "tile_energy_density_proxy"
    : "tile_energy_density_proxy";
};

const inferUpstreamDriverDependencyStatus = (
  driverClass: Nhm2ObserverUpstreamDriverClass,
): Nhm2ObserverUpstreamDriverDependencyStatus => {
  if (
    driverClass === "metric_energy_density_proxy" ||
    driverClass === "tile_energy_density_proxy"
  ) {
    return "proxy_derived_driver";
  }
  if (
    driverClass === "metric_t00_density" ||
    driverClass === "tile_t00_density"
  ) {
    return "direct_same_surface_driver";
  }
  return "unknown";
};

const inferUpstreamDriverRef = (
  tensor: Nhm2ObserverAuditTensor,
  driverClass: Nhm2ObserverUpstreamDriverClass,
  rootCauseClass: Nhm2ObserverRootCauseClass,
): string | null => {
  if (
    rootCauseClass !== "negative_energy_density" &&
    rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return null;
  }
  if (tensor.tensorId === "metric_required") {
    return asText(tensor.tensorRef) ?? "metric_required.conditions.wec.source_t00";
  }
  if (driverClass === "tile_energy_density_proxy") {
    return asText(tensor.tensorRef) ?? "tile_effective.conditions.wec.source_density_proxy";
  }
  return asText(tensor.tensorRef) ?? "tile_effective.conditions.wec.source_t00";
};

const buildUpstreamDriverNote = (args: {
  tensor: Nhm2ObserverAuditTensor;
  driverClass: Nhm2ObserverUpstreamDriverClass;
  dependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  ref: string | null;
}): string | null => {
  if (args.ref == null || args.driverClass === "unknown") return null;
  if (
    args.driverClass === "metric_t00_density" ||
    args.driverClass === "tile_t00_density"
  ) {
    return `${args.tensor.tensorId} WEC traces directly to emitted density at ${args.ref}.`;
  }
  if (
    args.driverClass === "metric_energy_density_proxy" ||
    args.driverClass === "tile_energy_density_proxy"
  ) {
    return `${args.tensor.tensorId} WEC traces to emitted proxy-derived density at ${args.ref}.`;
  }
  if (args.dependencyStatus === "mixed") {
    return `${args.tensor.tensorId} WEC upstream driver remains mixed across current emitted surfaces.`;
  }
  return null;
};

const buildUpstreamRemediationWhy = (args: {
  tensor: Nhm2ObserverAuditTensor;
  driverClass: Nhm2ObserverUpstreamDriverClass;
}): string | null => {
  if (args.driverClass === "unknown") return null;
  if (
    args.driverClass === "metric_t00_density" ||
    args.driverClass === "tile_t00_density"
  ) {
    return `Inspect emitted ${args.tensor.tensorId} T00 density first because WEC algebra reduces directly to rho on this surface.`;
  }
  if (
    args.driverClass === "metric_energy_density_proxy" ||
    args.driverClass === "tile_energy_density_proxy"
  ) {
    return `Inspect emitted ${args.tensor.tensorId} energy-density proxy first because WEC negativity is inherited from that published proxy surface.`;
  }
  return null;
};

const localizeUpstreamDriver = (
  tensor: Nhm2ObserverAuditTensor,
  rootCause: Nhm2ObserverRootCauseLocalization,
  input: BuildNhm2ObserverAuditTensorInput,
): Nhm2ObserverUpstreamDriverLocalization => {
  if (
    tensor.primaryBlockingCondition !== "wec" &&
    rootCause.rootCauseClass !== "negative_energy_density" &&
    rootCause.rootCauseClass !== "dec_downstream_of_negative_energy"
  ) {
    return {
      upstreamDriverRef: null,
      upstreamDriverClass: "unknown",
      upstreamDriverDependencyStatus: "unknown",
      upstreamDriverNote: null,
      firstUpstreamRemediationTarget: null,
      firstUpstreamRemediationWhy: null,
    };
  }
  const upstreamDriverClass = isUpstreamDriverClass(input?.upstreamDriverClass)
    ? input.upstreamDriverClass
    : inferUpstreamDriverClass({
        tensor,
        rootCauseClass: rootCause.rootCauseClass,
      });
  const upstreamDriverRef =
    asText(input?.upstreamDriverRef) ??
    inferUpstreamDriverRef(tensor, upstreamDriverClass, rootCause.rootCauseClass);
  const upstreamDriverDependencyStatus = isUpstreamDriverDependencyStatus(
    input?.upstreamDriverDependencyStatus,
  )
    ? input.upstreamDriverDependencyStatus
    : inferUpstreamDriverDependencyStatus(upstreamDriverClass);
  return {
    upstreamDriverRef,
    upstreamDriverClass,
    upstreamDriverDependencyStatus,
    upstreamDriverNote:
      asText(input?.upstreamDriverNote) ??
      buildUpstreamDriverNote({
        tensor,
        driverClass: upstreamDriverClass,
        dependencyStatus: upstreamDriverDependencyStatus,
        ref: upstreamDriverRef,
      }),
    firstUpstreamRemediationTarget:
      asText(input?.firstUpstreamRemediationTarget) ?? upstreamDriverRef,
    firstUpstreamRemediationWhy:
      asText(input?.firstUpstreamRemediationWhy) ??
      buildUpstreamRemediationWhy({
        tensor,
        driverClass: upstreamDriverClass,
      }),
  };
};

const summarizeSharedRootDriver = (args: {
  metric: Nhm2ObserverRootCauseLocalization;
  tile: Nhm2ObserverRootCauseLocalization;
}): {
  status: Nhm2ObserverSharedRootDriverStatus;
  note: string | null;
} => {
  const metricFamily = normalizeRootCauseFamily(args.metric.rootCauseClass);
  const tileFamily = normalizeRootCauseFamily(args.tile.rootCauseClass);
  if (metricFamily == null || tileFamily == null) {
    return {
      status: "unknown",
      note: null,
    };
  }
  if (metricFamily === tileFamily && metricFamily !== "mixed_independent") {
    return {
      status: "shared_root_driver_confirmed",
      note:
        metricFamily === "negative_energy_density"
          ? "metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first."
          : `metric_required and tile_effective both trace back to ${metricFamily}.`,
    };
  }
  if (
    metricFamily === "mixed_independent" ||
    tileFamily === "mixed_independent"
  ) {
    return {
      status: "mixed",
      note:
        "At least one emitted observer surface still presents mixed independent blockers, so a single shared remediation path is not yet justified.",
    };
  }
  return {
    status: "surface_specific_drivers",
    note: `metric_required traces to ${args.metric.rootCauseClass}, while tile_effective traces to ${args.tile.rootCauseClass}.`,
  };
};

const summarizeSharedUpstreamDriver = (args: {
  metric: Nhm2ObserverUpstreamDriverLocalization;
  tile: Nhm2ObserverUpstreamDriverLocalization;
}): {
  status: Nhm2ObserverSharedUpstreamDriverStatus;
  note: string | null;
} => {
  const metricRef = args.metric.upstreamDriverRef;
  const tileRef = args.tile.upstreamDriverRef;
  if (
    metricRef != null &&
    tileRef != null &&
    metricRef === tileRef &&
    args.metric.upstreamDriverClass !== "unknown" &&
    args.tile.upstreamDriverClass !== "unknown"
  ) {
    return {
      status: "shared_exact_ref",
      note: `metric_required and tile_effective both trace their first upstream WEC driver to ${metricRef}.`,
    };
  }
  const metricFamily = normalizeUpstreamDriverFamily(
    args.metric.upstreamDriverClass,
  );
  const tileFamily = normalizeUpstreamDriverFamily(args.tile.upstreamDriverClass);
  if (
    metricFamily != null &&
    tileFamily != null &&
    metricFamily === tileFamily
  ) {
    return {
      status: "shared_driver_class",
      note:
        metricRef != null && tileRef != null
          ? `metric_required traces to ${metricRef} while tile_effective traces to ${tileRef}; both belong to the same emitted ${metricFamily} driver family.`
          : `metric_required and tile_effective share the same emitted ${metricFamily} driver family.`,
    };
  }
  if (
    args.metric.upstreamDriverClass === "mixed_upstream" ||
    args.tile.upstreamDriverClass === "mixed_upstream" ||
    args.metric.upstreamDriverDependencyStatus === "mixed" ||
    args.tile.upstreamDriverDependencyStatus === "mixed"
  ) {
    return {
      status: "mixed",
      note:
        "At least one observer surface still has mixed upstream evidence, so a single emitted upstream driver is not yet justified.",
    };
  }
  if (
    args.metric.upstreamDriverClass === "unknown" ||
    args.tile.upstreamDriverClass === "unknown"
  ) {
    return {
      status: "unknown",
      note: null,
    };
  }
  return {
    status: "surface_specific_upstream_refs",
    note:
      metricRef != null && tileRef != null
        ? `metric_required traces upstream to ${metricRef}, while tile_effective traces upstream to ${tileRef}; they share the same negative-energy root class but not the same emitted upstream driver.`
        : "metric_required and tile_effective do not share the same emitted upstream WEC driver.",
  };
};

const normalizeProbeScale = (value: unknown): number | null => {
  const finite = toFinite(value);
  if (finite == null) return null;
  return Math.max(0, Math.min(1, finite));
};

const applyProbeRelaxation = (
  baseline: number | null,
  effectiveScale: number | null,
): number | null => {
  if (baseline == null || effectiveScale == null) return baseline;
  if (baseline >= 0) return baseline;
  return baseline * (1 - effectiveScale);
};

const buildProbeInterpretation = (args: {
  tensor: Nhm2ObserverAuditTensor;
  effectiveScale: number | null;
  sharedUpstreamStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  upstreamDependencyStatus: Nhm2ObserverUpstreamDriverDependencyStatus;
  wecDelta: number | null;
  decDelta: number | null;
}): string | null => {
  if (args.effectiveScale == null) return null;
  if (args.effectiveScale <= 1e-12) {
    if (
      args.tensor.tensorId === "tile_effective" &&
      args.upstreamDependencyStatus === "proxy_derived_driver"
    ) {
      return "Metric-side WEC probe does not automatically lift this tile proxy surface because it depends on a separate proxy-derived upstream ref.";
    }
    return "Probe leaves this surface effectively unchanged on current emitted dependencies.";
  }
  if (args.tensor.tensorId === "metric_required") {
    return "Metric-side probe directly relaxes emitted WEC and downstream DEC because this surface depends on the same emitted density ref.";
  }
  if (args.sharedUpstreamStatus === "shared_exact_ref") {
    return "Tile surface lifts under the same probe because both surfaces share the exact emitted upstream WEC driver.";
  }
  if (args.wecDelta != null && args.wecDelta > 0 && args.decDelta != null && args.decDelta > 0) {
    return "Tile surface shows cross-surface WEC/DEC relief under the same probe, but the emitted upstream ref remains distinct.";
  }
  if (args.wecDelta != null && args.wecDelta > 0) {
    return "Tile WEC shows limited cross-surface relief under the metric-side probe.";
  }
  return "Probe interpretation remains unresolved on this surface.";
};

const localizeWecProbe = (args: {
  tensor: Nhm2ObserverAuditTensor;
  rootCause: Nhm2ObserverRootCauseLocalization;
  upstream: Nhm2ObserverUpstreamDriverLocalization;
  sharedUpstreamStatus: Nhm2ObserverSharedUpstreamDriverStatus;
  input: BuildNhm2ObserverAuditTensorInput;
}): Nhm2ObserverWecProbeLocalization => {
  if (
    args.tensor.primaryBlockingCondition !== "wec" ||
    args.rootCause.rootCauseClass !== "negative_energy_density"
  ) {
    return {
      wecProbeApplied: false,
      wecProbeScale: null,
      wecProbeBaseline: null,
      wecProbeResult: null,
      wecProbeDelta: null,
      decProbeBaseline: null,
      decProbeResult: null,
      decProbeDelta: null,
      wecProbeInterpretation: null,
    };
  }
  const requestedScale =
    normalizeProbeScale(args.input?.wecProbeScale) ??
    NHM2_OBSERVER_WEC_PROBE_DEFAULT_SCALE;
  const requestedResponse =
    normalizeProbeScale(args.input?.wecProbeResponseFactor) ??
    (args.tensor.tensorId === "metric_required"
      ? 1
      : args.sharedUpstreamStatus === "shared_exact_ref"
        ? 1
        : 0);
  const effectiveScale = requestedScale * requestedResponse;
  const wecBaseline = args.tensor.conditions.wec.robustMin;
  const wecResult = applyProbeRelaxation(wecBaseline, effectiveScale);
  const decBaseline = args.tensor.conditions.dec.robustMin;
  const decResult =
    args.rootCause.blockingDependencyStatus === "dec_downstream_of_wec"
      ? applyProbeRelaxation(decBaseline, effectiveScale)
      : decBaseline;
  const wecDelta =
    wecBaseline != null && wecResult != null ? wecResult - wecBaseline : null;
  const decDelta =
    decBaseline != null && decResult != null ? decResult - decBaseline : null;
  return {
    wecProbeApplied: true,
    wecProbeScale: requestedScale,
    wecProbeBaseline: wecBaseline,
    wecProbeResult: wecResult,
    wecProbeDelta: wecDelta,
    decProbeBaseline: decBaseline,
    decProbeResult: decResult,
    decProbeDelta: decDelta,
    wecProbeInterpretation: buildProbeInterpretation({
      tensor: args.tensor,
      effectiveScale,
      sharedUpstreamStatus: args.sharedUpstreamStatus,
      upstreamDependencyStatus: args.upstream.upstreamDriverDependencyStatus,
      wecDelta,
      decDelta,
    }),
  };
};

const computeProbeReliefRatio = (
  baseline: number | null,
  delta: number | null,
): number | null => {
  if (baseline == null || delta == null || baseline >= 0) return null;
  if (Math.abs(baseline) <= 1e-12) return null;
  return Math.max(0, delta / Math.abs(baseline));
};

const summarizeWecPropagation = (args: {
  metric: Nhm2ObserverWecProbeLocalization;
  tile: Nhm2ObserverWecProbeLocalization;
  tileUpstream: Nhm2ObserverUpstreamDriverLocalization;
}): {
  status: Nhm2ObserverWecPropagationStatus;
  note: string | null;
  sequence: Nhm2ObserverRemediationSequenceStatus;
} => {
  const metricRelief = computeProbeReliefRatio(
    args.metric.wecProbeBaseline,
    args.metric.wecProbeDelta,
  );
  const tileRelief = computeProbeReliefRatio(
    args.tile.wecProbeBaseline,
    args.tile.wecProbeDelta,
  );
  if (metricRelief == null || !args.metric.wecProbeApplied) {
    return { status: "unknown", note: null, sequence: "unknown" };
  }
  const scaleText =
    args.metric.wecProbeScale != null
      ? `${Math.round(args.metric.wecProbeScale * 100)}%`
      : "probe";
  if (
    tileRelief != null &&
    tileRelief >= NHM2_OBSERVER_WEC_SHARED_PROPAGATION_RATIO
  ) {
    return {
      status: "shared_propagation_detected",
      note: `${scaleText} metric-side WEC probe relaxes both metric_required and tile_effective WEC materially, so a shared metric-first remediation path is supported.`,
      sequence: "shared_metric_first",
    };
  }
  if (
    tileRelief != null &&
    tileRelief >= NHM2_OBSERVER_WEC_WEAK_PROPAGATION_RATIO
  ) {
    return {
      status: "weak_cross_surface_propagation",
      note: `${scaleText} metric-side WEC probe strongly relaxes metric_required WEC but only weakly lifts tile_effective, so the tile proxy likely needs a second explicit remediation pass.`,
      sequence: "metric_then_tile_proxy",
    };
  }
  if (args.tile.wecProbeApplied) {
    if (
      args.tileUpstream.upstreamDriverDependencyStatus === "proxy_derived_driver"
    ) {
      return {
        status: "tile_proxy_independent",
        note: `${scaleText} metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane.`,
        sequence: "metric_then_tile_proxy",
      };
    }
    return {
      status: "metric_only_propagation",
      note: `${scaleText} metric-side WEC probe relaxes metric_required WEC/DEC, but no meaningful automatic lift appears on tile_effective under the same probe.`,
      sequence: "metric_then_tile_proxy",
    };
  }
  return {
    status: "unknown",
    note: "WEC probe could not resolve cross-surface propagation on current emitted observer surfaces.",
    sequence: "unknown",
  };
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
  const metricRootCauseLocalization = localizeRootCause(metricRequired);
  const tileRootCauseLocalization = localizeRootCause(tileEffective);
  const metricUpstreamLocalization = localizeUpstreamDriver(
    metricRequired,
    metricRootCauseLocalization,
    input.metricRequired ?? null,
  );
  const tileUpstreamLocalization = localizeUpstreamDriver(
    tileEffective,
    tileRootCauseLocalization,
    input.tileEffective ?? null,
  );
  metricRequired.rootCauseClass = metricRootCauseLocalization.rootCauseClass;
  metricRequired.blockingDependencyStatus =
    metricRootCauseLocalization.blockingDependencyStatus;
  metricRequired.blockingDependencyNote =
    metricRootCauseLocalization.blockingDependencyNote;
  metricRequired.firstRemediationTarget =
    metricRootCauseLocalization.firstRemediationTarget;
  metricRequired.firstRemediationWhy =
    metricRootCauseLocalization.firstRemediationWhy;
  metricRequired.upstreamDriverRef = metricUpstreamLocalization.upstreamDriverRef;
  metricRequired.upstreamDriverClass =
    metricUpstreamLocalization.upstreamDriverClass;
  metricRequired.upstreamDriverDependencyStatus =
    metricUpstreamLocalization.upstreamDriverDependencyStatus;
  metricRequired.upstreamDriverNote =
    metricUpstreamLocalization.upstreamDriverNote;
  metricRequired.firstUpstreamRemediationTarget =
    metricUpstreamLocalization.firstUpstreamRemediationTarget;
  metricRequired.firstUpstreamRemediationWhy =
    metricUpstreamLocalization.firstUpstreamRemediationWhy;
  tileEffective.rootCauseClass = tileRootCauseLocalization.rootCauseClass;
  tileEffective.blockingDependencyStatus =
    tileRootCauseLocalization.blockingDependencyStatus;
  tileEffective.blockingDependencyNote =
    tileRootCauseLocalization.blockingDependencyNote;
  tileEffective.firstRemediationTarget =
    tileRootCauseLocalization.firstRemediationTarget;
  tileEffective.firstRemediationWhy =
    tileRootCauseLocalization.firstRemediationWhy;
  tileEffective.upstreamDriverRef = tileUpstreamLocalization.upstreamDriverRef;
  tileEffective.upstreamDriverClass = tileUpstreamLocalization.upstreamDriverClass;
  tileEffective.upstreamDriverDependencyStatus =
    tileUpstreamLocalization.upstreamDriverDependencyStatus;
  tileEffective.upstreamDriverNote =
    tileUpstreamLocalization.upstreamDriverNote;
  tileEffective.firstUpstreamRemediationTarget =
    tileUpstreamLocalization.firstUpstreamRemediationTarget;
  tileEffective.firstUpstreamRemediationWhy =
    tileUpstreamLocalization.firstUpstreamRemediationWhy;
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
  const observerSharedRootDriver = summarizeSharedRootDriver({
    metric: metricRootCauseLocalization,
    tile: tileRootCauseLocalization,
  });
  const observerSharedUpstreamDriver = summarizeSharedUpstreamDriver({
    metric: metricUpstreamLocalization,
    tile: tileUpstreamLocalization,
  });
  const metricWecProbeLocalization = localizeWecProbe({
    tensor: metricRequired,
    rootCause: metricRootCauseLocalization,
    upstream: metricUpstreamLocalization,
    sharedUpstreamStatus: observerSharedUpstreamDriver.status,
    input: input.metricRequired ?? null,
  });
  const tileWecProbeLocalization = localizeWecProbe({
    tensor: tileEffective,
    rootCause: tileRootCauseLocalization,
    upstream: tileUpstreamLocalization,
    sharedUpstreamStatus: observerSharedUpstreamDriver.status,
    input: input.tileEffective ?? null,
  });
  metricRequired.wecProbeApplied = metricWecProbeLocalization.wecProbeApplied;
  metricRequired.wecProbeScale = metricWecProbeLocalization.wecProbeScale;
  metricRequired.wecProbeBaseline = metricWecProbeLocalization.wecProbeBaseline;
  metricRequired.wecProbeResult = metricWecProbeLocalization.wecProbeResult;
  metricRequired.wecProbeDelta = metricWecProbeLocalization.wecProbeDelta;
  metricRequired.decProbeBaseline = metricWecProbeLocalization.decProbeBaseline;
  metricRequired.decProbeResult = metricWecProbeLocalization.decProbeResult;
  metricRequired.decProbeDelta = metricWecProbeLocalization.decProbeDelta;
  metricRequired.wecProbeInterpretation =
    metricWecProbeLocalization.wecProbeInterpretation;
  tileEffective.wecProbeApplied = tileWecProbeLocalization.wecProbeApplied;
  tileEffective.wecProbeScale = tileWecProbeLocalization.wecProbeScale;
  tileEffective.wecProbeBaseline = tileWecProbeLocalization.wecProbeBaseline;
  tileEffective.wecProbeResult = tileWecProbeLocalization.wecProbeResult;
  tileEffective.wecProbeDelta = tileWecProbeLocalization.wecProbeDelta;
  tileEffective.decProbeBaseline = tileWecProbeLocalization.decProbeBaseline;
  tileEffective.decProbeResult = tileWecProbeLocalization.decProbeResult;
  tileEffective.decProbeDelta = tileWecProbeLocalization.decProbeDelta;
  tileEffective.wecProbeInterpretation =
    tileWecProbeLocalization.wecProbeInterpretation;
  const observerWecPropagation = summarizeWecPropagation({
    metric: metricWecProbeLocalization,
    tile: tileWecProbeLocalization,
    tileUpstream: tileUpstreamLocalization,
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
    observerSharedRootDriverStatus: observerSharedRootDriver.status,
    observerSharedRootDriverNote: observerSharedRootDriver.note,
    observerSharedUpstreamDriverStatus: observerSharedUpstreamDriver.status,
    observerSharedUpstreamDriverNote: observerSharedUpstreamDriver.note,
    observerWecPropagationStatus: observerWecPropagation.status,
    observerWecPropagationNote: observerWecPropagation.note,
    observerRemediationSequenceStatus: observerWecPropagation.sequence,
    observerTileDiminishingReturnStatus:
      input.observerTileDiminishingReturnStatus ?? "unknown",
    observerTileDiminishingReturnNote:
      input.observerTileDiminishingReturnNote ?? null,
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

const isRootCauseClass = (
  value: unknown,
): value is Nhm2ObserverRootCauseClass =>
  NHM2_OBSERVER_ROOT_CAUSE_CLASS_VALUES.includes(
    value as Nhm2ObserverRootCauseClass,
  );

const isBlockingDependencyStatus = (
  value: unknown,
): value is Nhm2ObserverBlockingDependencyStatus =>
  NHM2_OBSERVER_BLOCKING_DEPENDENCY_STATUS_VALUES.includes(
    value as Nhm2ObserverBlockingDependencyStatus,
  );

const isSharedRootDriverStatus = (
  value: unknown,
): value is Nhm2ObserverSharedRootDriverStatus =>
  NHM2_OBSERVER_SHARED_ROOT_DRIVER_STATUS_VALUES.includes(
    value as Nhm2ObserverSharedRootDriverStatus,
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
    isRootCauseClass(record.rootCauseClass) &&
    isBlockingDependencyStatus(record.blockingDependencyStatus) &&
    (record.blockingDependencyNote === null ||
      typeof record.blockingDependencyNote === "string") &&
    (record.firstRemediationTarget === null ||
      typeof record.firstRemediationTarget === "string") &&
    (record.firstRemediationWhy === null ||
      typeof record.firstRemediationWhy === "string") &&
    (record.upstreamDriverRef === null ||
      typeof record.upstreamDriverRef === "string") &&
    isUpstreamDriverClass(record.upstreamDriverClass) &&
    isUpstreamDriverDependencyStatus(record.upstreamDriverDependencyStatus) &&
    (record.upstreamDriverNote === null ||
      typeof record.upstreamDriverNote === "string") &&
    (record.firstUpstreamRemediationTarget === null ||
      typeof record.firstUpstreamRemediationTarget === "string") &&
    (record.firstUpstreamRemediationWhy === null ||
      typeof record.firstUpstreamRemediationWhy === "string") &&
    typeof record.wecProbeApplied === "boolean" &&
    (record.wecProbeScale === null ||
      Number.isFinite(Number(record.wecProbeScale))) &&
    (record.wecProbeBaseline === null ||
      Number.isFinite(Number(record.wecProbeBaseline))) &&
    (record.wecProbeResult === null ||
      Number.isFinite(Number(record.wecProbeResult))) &&
    (record.wecProbeDelta === null ||
      Number.isFinite(Number(record.wecProbeDelta))) &&
    (record.decProbeBaseline === null ||
      Number.isFinite(Number(record.decProbeBaseline))) &&
    (record.decProbeResult === null ||
      Number.isFinite(Number(record.decProbeResult))) &&
    (record.decProbeDelta === null ||
      Number.isFinite(Number(record.decProbeDelta))) &&
    (record.wecProbeInterpretation === null ||
      typeof record.wecProbeInterpretation === "string") &&
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
    isSharedRootDriverStatus(record.observerSharedRootDriverStatus) &&
    (record.observerSharedRootDriverNote === null ||
      typeof record.observerSharedRootDriverNote === "string") &&
    isSharedUpstreamDriverStatus(record.observerSharedUpstreamDriverStatus) &&
    (record.observerSharedUpstreamDriverNote === null ||
      typeof record.observerSharedUpstreamDriverNote === "string") &&
    isWecPropagationStatus(record.observerWecPropagationStatus) &&
    (record.observerWecPropagationNote === null ||
      typeof record.observerWecPropagationNote === "string") &&
    isRemediationSequenceStatus(record.observerRemediationSequenceStatus) &&
    isTileDiminishingReturnStatus(record.observerTileDiminishingReturnStatus) &&
    (record.observerTileDiminishingReturnNote === null ||
      typeof record.observerTileDiminishingReturnNote === "string") &&
    tensors != null &&
    isTensor(tensors.metricRequired) &&
    isTensor(tensors.tileEffective)
  );
};
