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
};

export type Nhm2ObserverAuditArtifact = {
  artifactId: typeof NHM2_OBSERVER_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof NHM2_OBSERVER_AUDIT_SCHEMA_VERSION;
  familyId: string;
  shiftLapseProfileId?: string | null;
  status: Nhm2ObserverAuditStatus;
  completeness: Nhm2ObserverAuditCompleteness;
  reasonCodes: Nhm2ObserverAuditReasonCode[];
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
  };
};

export const buildNhm2ObserverAuditArtifact = (
  input: BuildNhm2ObserverAuditArtifactInput,
): Nhm2ObserverAuditArtifact => {
  const metricRequired = buildTensor("metric_required", input.metricRequired);
  const tileEffective = buildTensor("tile_effective", input.tileEffective);
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

  return {
    artifactId: NHM2_OBSERVER_AUDIT_ARTIFACT_ID,
    schemaVersion: NHM2_OBSERVER_AUDIT_SCHEMA_VERSION,
    familyId: asText(input.familyId) ?? "nhm2_shift_lapse",
    shiftLapseProfileId: asText(input.shiftLapseProfileId),
    status,
    completeness,
    reasonCodes,
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
    tensors != null &&
    isTensor(tensors.metricRequired) &&
    isTensor(tensors.tileEffective)
  );
};
