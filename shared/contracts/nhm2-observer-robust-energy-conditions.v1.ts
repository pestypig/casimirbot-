export const NHM2_OBSERVER_ROBUST_ENERGY_CONDITIONS_CONTRACT_VERSION =
  "nhm2_observer_robust_energy_conditions/v1";

export const NHM2_OBSERVER_FAMILY_IDS = [
  "eulerian",
  "boosted_timelike_grid",
  "null_direction_grid",
  "algebraic_type_i",
  "continuous_optimizer",
  "not_available",
] as const;

export const NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_STATUS_VALUES = [
  "pass",
  "fail",
  "missing",
  "not_run",
  "proxy",
] as const;

export const NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_KEYS = [
  "WEC",
  "NEC",
  "DEC",
  "SEC",
] as const;

export const NHM2_OBSERVER_MISSED_VIOLATION_RISK_VALUES = [
  "low",
  "medium",
  "high",
  "unknown",
] as const;

export type Nhm2ObserverFamilyId =
  (typeof NHM2_OBSERVER_FAMILY_IDS)[number];

export type Nhm2ObserverRobustEnergyConditionStatus =
  (typeof NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_STATUS_VALUES)[number];

export type Nhm2ObserverRobustEnergyCondition =
  (typeof NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_KEYS)[number];

export type Nhm2ObserverMissedViolationRisk =
  (typeof NHM2_OBSERVER_MISSED_VIOLATION_RISK_VALUES)[number];

export type Nhm2ObserverRobustEnergyConditionFamilyV1 = {
  familyId: Nhm2ObserverFamilyId;
  status: Nhm2ObserverRobustEnergyConditionStatus;
  sampleCount?: number;
  optimizerUsed?: boolean;
  worstCase?: {
    condition: Nhm2ObserverRobustEnergyCondition;
    value: number | null;
    locationRef?: string;
    observerParams?: Record<string, number>;
  };
  blockers: string[];
};

export type Nhm2ObserverRobustEnergyConditionArtifactV1 = {
  contractVersion: typeof NHM2_OBSERVER_ROBUST_ENERGY_CONDITIONS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  tensorRef: string;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sampleRegionCoverage?: Record<string, number>;
  observerFamilies: Nhm2ObserverRobustEnergyConditionFamilyV1[];
  summary: {
    eulerianOnly: boolean;
    robustCheckComplete: boolean;
    anyViolation: boolean;
    missedViolationRisk: Nhm2ObserverMissedViolationRisk;
  };
  literatureRefs: [
    "le_2026_observer_robust_warp_energy_conditions",
    "santiago_schuster_visser_2021_generic_warp_nec",
  ];
  claimBoundary: {
    diagnosticOnly: true;
    friendlyObserverCannotProveWec: true;
  };
};

export type Nhm2ObserverRobustEnergyConditionFamilyInput = {
  familyId?: Nhm2ObserverFamilyId | null;
  status?: Nhm2ObserverRobustEnergyConditionStatus | null;
  sampleCount?: number | null;
  optimizerUsed?: boolean | null;
  worstCase?: {
    condition?: Nhm2ObserverRobustEnergyCondition | string | null;
    value?: number | null;
    locationRef?: string | null;
    observerParams?: Record<string, unknown> | null;
  } | null;
  blockers?: string[] | null;
};

export type BuildNhm2ObserverRobustEnergyConditionArtifactInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  tensorRef?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sampleRegionCoverage?: Record<string, number> | null;
  observerFamilies?:
    | Nhm2ObserverRobustEnergyConditionFamilyInput[]
    | null;
};

type ObserverAuditConditionLike = {
  eulerianMin?: number | null;
  robustMin?: number | null;
  worstCase?: {
    index?: number | null;
    value?: number | null;
    direction?: [number, number, number] | null;
    rapidity?: number | null;
    source?: string | null;
  } | null;
};

export type Nhm2ObserverRobustEnergyConditionTensorLike = {
  tensorRef?: string | null;
  sampleCount?: number | null;
  rapidityCap?: number | null;
  rapidityCapBeta?: number | null;
  typeI?: {
    count?: number | null;
    fraction?: number | null;
    tolerance?: number | null;
  } | null;
  conditions?: Partial<{
    nec: ObserverAuditConditionLike | null;
    wec: ObserverAuditConditionLike | null;
    sec: ObserverAuditConditionLike | null;
    dec: ObserverAuditConditionLike | null;
  }> | null;
  model?: {
    limitationNotes?: string[] | null;
  } | null;
  missingInputs?: string[] | null;
};

export type BuildNhm2ObserverRobustEnergyConditionFromTensorInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  tensor: Nhm2ObserverRobustEnergyConditionTensorLike | null | undefined;
  tensorRef?: string | null;
};

const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";
const CONDITION_KEY_PAIRS = [
  ["WEC", "wec"],
  ["NEC", "nec"],
  ["DEC", "dec"],
  ["SEC", "sec"],
] as const;

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeTextList = (values: string[] | null | undefined): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null),
    ),
  );

const isFamilyId = (value: unknown): value is Nhm2ObserverFamilyId =>
  NHM2_OBSERVER_FAMILY_IDS.includes(value as Nhm2ObserverFamilyId);

const isFamilyStatus = (
  value: unknown,
): value is Nhm2ObserverRobustEnergyConditionStatus =>
  NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_STATUS_VALUES.includes(
    value as Nhm2ObserverRobustEnergyConditionStatus,
  );

const isCondition = (
  value: unknown,
): value is Nhm2ObserverRobustEnergyCondition =>
  NHM2_OBSERVER_ROBUST_ENERGY_CONDITION_KEYS.includes(
    value as Nhm2ObserverRobustEnergyCondition,
  );

const normalizeCondition = (
  value: unknown,
): Nhm2ObserverRobustEnergyCondition => {
  if (isCondition(value)) return value;
  const upper = asText(value)?.toUpperCase();
  return isCondition(upper) ? upper : "WEC";
};

const normalizeObserverParams = (
  value: Record<string, unknown> | null | undefined,
): Record<string, number> | undefined => {
  if (value == null) return undefined;
  const entries = Object.entries(value)
    .map(([key, entry]) => [key, toFinite(entry)] as const)
    .filter((entry): entry is readonly [string, number] => entry[1] != null);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const normalizeWorstCase = (
  value: Nhm2ObserverRobustEnergyConditionFamilyInput["worstCase"],
): Nhm2ObserverRobustEnergyConditionFamilyV1["worstCase"] | undefined => {
  if (value == null) return undefined;
  const condition = normalizeCondition(value.condition);
  const worstValue = toFinite(value.value);
  const locationRef = asText(value.locationRef);
  const observerParams = normalizeObserverParams(value.observerParams);
  return {
    condition,
    value: worstValue,
    ...(locationRef != null ? { locationRef } : {}),
    ...(observerParams != null ? { observerParams } : {}),
  };
};

const statusFromWorstCase = (
  worstCase: Nhm2ObserverRobustEnergyConditionFamilyV1["worstCase"],
  fallback: Nhm2ObserverRobustEnergyConditionStatus,
): Nhm2ObserverRobustEnergyConditionStatus => {
  if (worstCase?.value == null) return fallback;
  return worstCase.value < 0 ? "fail" : "pass";
};

const normalizeFamily = (
  input: Nhm2ObserverRobustEnergyConditionFamilyInput,
): Nhm2ObserverRobustEnergyConditionFamilyV1 => {
  const familyId = isFamilyId(input.familyId) ? input.familyId : "not_available";
  const worstCase = normalizeWorstCase(input.worstCase);
  const status = isFamilyStatus(input.status)
    ? input.status
    : statusFromWorstCase(worstCase, familyId === "not_available" ? "missing" : "not_run");
  const sampleCount = toFinite(input.sampleCount);
  const blockers = normalizeTextList(input.blockers);
  if (status === "missing" && blockers.length === 0) {
    blockers.push(`${familyId}_energy_condition_evidence_missing`);
  }
  if (status === "not_run" && blockers.length === 0) {
    blockers.push(`${familyId}_not_implemented`);
  }
  return {
    familyId,
    status,
    ...(sampleCount != null ? { sampleCount } : {}),
    ...(typeof input.optimizerUsed === "boolean"
      ? { optimizerUsed: input.optimizerUsed }
      : {}),
    ...(worstCase != null ? { worstCase } : {}),
    blockers,
  };
};

const requiredFamily = (
  familyId: Nhm2ObserverFamilyId,
): Nhm2ObserverRobustEnergyConditionFamilyV1 => ({
  familyId,
  status:
    familyId === "boosted_timelike_grid" ||
    familyId === "null_direction_grid" ||
    familyId === "continuous_optimizer"
      ? "not_run"
      : "missing",
  ...(familyId === "continuous_optimizer" ? { optimizerUsed: false } : {}),
  blockers: [
    familyId === "continuous_optimizer"
      ? "continuous_optimizer_not_implemented"
      : `${familyId}_energy_condition_evidence_missing`,
  ],
});

const ensureRequiredFamilies = (
  families: Nhm2ObserverRobustEnergyConditionFamilyV1[],
): Nhm2ObserverRobustEnergyConditionFamilyV1[] => {
  const byId = new Map<Nhm2ObserverFamilyId, Nhm2ObserverRobustEnergyConditionFamilyV1>();
  for (const family of families) {
    if (!byId.has(family.familyId)) byId.set(family.familyId, family);
  }
  for (const familyId of [
    "eulerian",
    "boosted_timelike_grid",
    "null_direction_grid",
    "algebraic_type_i",
    "continuous_optimizer",
  ] as const) {
    if (!byId.has(familyId)) byId.set(familyId, requiredFamily(familyId));
  }
  return [
    byId.get("eulerian"),
    byId.get("boosted_timelike_grid"),
    byId.get("null_direction_grid"),
    byId.get("algebraic_type_i"),
    byId.get("continuous_optimizer"),
    byId.get("not_available"),
  ].filter(
    (entry): entry is Nhm2ObserverRobustEnergyConditionFamilyV1 =>
      entry != null,
  );
};

const summarizeFamilies = (
  families: Nhm2ObserverRobustEnergyConditionFamilyV1[],
): Nhm2ObserverRobustEnergyConditionArtifactV1["summary"] => {
  const anyViolation = families.some((family) => family.status === "fail");
  const robustFamilies = families.filter(
    (family) =>
      family.familyId !== "eulerian" && family.familyId !== "not_available",
  );
  const hasRobustPass = robustFamilies.some((family) => family.status === "pass");
  const hasRobustEvidence = robustFamilies.some((family) =>
    ["pass", "fail", "proxy"].includes(family.status),
  );
  const eulerianOnly = !hasRobustEvidence;
  const robustCheckComplete = hasRobustPass && !anyViolation;
  const hasProxyOrMissing = robustFamilies.some((family) =>
    ["missing", "not_run", "proxy"].includes(family.status),
  );
  const missedViolationRisk: Nhm2ObserverMissedViolationRisk = anyViolation
    ? "high"
    : eulerianOnly
      ? "high"
      : robustCheckComplete
        ? hasProxyOrMissing
          ? "medium"
          : "low"
        : hasProxyOrMissing
          ? "medium"
          : "unknown";
  return {
    eulerianOnly,
    robustCheckComplete,
    anyViolation,
    missedViolationRisk,
  };
};

export const buildNhm2ObserverRobustEnergyConditionArtifact = (
  input: BuildNhm2ObserverRobustEnergyConditionArtifactInput,
): Nhm2ObserverRobustEnergyConditionArtifactV1 => {
  const observerFamilies = ensureRequiredFamilies(
    (input.observerFamilies ?? []).map((family) => normalizeFamily(family)),
  );
  return {
    contractVersion: NHM2_OBSERVER_ROBUST_ENERGY_CONDITIONS_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: asText(input.selectedProfileId) ?? "unknown",
    tensorRef: asText(input.tensorRef) ?? "missing",
    ...(asText(input.atlasRef) == null ? {} : { atlasRef: asText(input.atlasRef) }),
    ...(asText(input.atlasHash) == null ? {} : { atlasHash: asText(input.atlasHash) }),
    ...(input.sampleRegionCoverage == null ? {} : { sampleRegionCoverage: input.sampleRegionCoverage }),
    observerFamilies,
    summary: summarizeFamilies(observerFamilies),
    literatureRefs: [
      "le_2026_observer_robust_warp_energy_conditions",
      "santiago_schuster_visser_2021_generic_warp_nec",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      friendlyObserverCannotProveWec: true,
    },
  };
};

const conditionValueForFamily = (
  condition: ObserverAuditConditionLike | null | undefined,
  familyId: "eulerian" | "algebraic_type_i" | "boosted_timelike_grid" | "null_direction_grid",
): number | null => {
  if (familyId === "eulerian") return toFinite(condition?.eulerianMin);
  const source = asText(condition?.worstCase?.source);
  if (source === familyId) return toFinite(condition?.robustMin);
  if (
    familyId === "boosted_timelike_grid" &&
    (source === "capped_search" || source === "capped_timelike_search")
  ) {
    return toFinite(condition?.robustMin);
  }
  if (familyId === "null_direction_grid" && source === "capped_null_search") {
    return toFinite(condition?.robustMin);
  }
  return null;
};

const observerParamsFromCondition = (
  condition: ObserverAuditConditionLike | null | undefined,
): Record<string, number> | undefined => {
  const params: Record<string, number> = {};
  const rapidity = toFinite(condition?.worstCase?.rapidity);
  const index = toFinite(condition?.worstCase?.index);
  if (rapidity != null) params.rapidity = rapidity;
  if (index != null) params.index = index;
  const direction = condition?.worstCase?.direction;
  if (Array.isArray(direction) && direction.length === 3) {
    const [x, y, z] = direction.map((entry) => toFinite(entry));
    if (x != null) params.directionX = x;
    if (y != null) params.directionY = y;
    if (z != null) params.directionZ = z;
  }
  return Object.keys(params).length > 0 ? params : undefined;
};

const buildFamilyFromTensorConditions = (
  familyId: "eulerian" | "algebraic_type_i" | "boosted_timelike_grid" | "null_direction_grid",
  tensor: Nhm2ObserverRobustEnergyConditionTensorLike | null | undefined,
): Nhm2ObserverRobustEnergyConditionFamilyInput => {
  const conditions = tensor?.conditions ?? null;
  const values = CONDITION_KEY_PAIRS.map(([conditionName, key]) => ({
    condition: conditionName,
    value: conditionValueForFamily(conditions?.[key], familyId),
    sourceCondition: conditions?.[key],
  }));
  const finiteValues = values.filter((entry) => entry.value != null);
  const worst = finiteValues.reduce<(typeof finiteValues)[number] | null>(
    (current, entry) =>
      current == null || (entry.value ?? 0) < (current.value ?? 0)
        ? entry
        : current,
    null,
  );
  const allConditionsPresent = finiteValues.length === CONDITION_KEY_PAIRS.length;
  const hasViolation = finiteValues.some((entry) => (entry.value ?? 0) < 0);
  const typeIFraction = toFinite(tensor?.typeI?.fraction);
  const status: Nhm2ObserverRobustEnergyConditionStatus =
    finiteValues.length === 0
      ? familyId === "eulerian" || familyId === "algebraic_type_i"
        ? "missing"
        : "not_run"
      : hasViolation
        ? "fail"
        : !allConditionsPresent
          ? "missing"
          : familyId === "algebraic_type_i" &&
              typeIFraction != null &&
              typeIFraction < 1
            ? "proxy"
            : "pass";
  const blockers: string[] = [];
  if (finiteValues.length === 0) {
    blockers.push(
      familyId === "eulerian" || familyId === "algebraic_type_i"
        ? `${familyId}_energy_condition_evidence_missing`
        : `${familyId}_not_implemented`,
    );
  }
  if (finiteValues.length > 0 && !allConditionsPresent) {
    blockers.push(`${familyId}_condition_set_incomplete`);
  }
  if (familyId === "algebraic_type_i" && status === "proxy") {
    blockers.push("algebraic_type_i_partial_coverage");
  }
  return {
    familyId,
    status,
    sampleCount:
      familyId === "algebraic_type_i"
        ? toFinite(tensor?.typeI?.count) ?? toFinite(tensor?.sampleCount)
        : toFinite(tensor?.sampleCount),
    worstCase:
      worst == null
        ? null
        : {
            condition: worst.condition,
            value: worst.value,
            locationRef: asText(worst.sourceCondition?.worstCase?.source) ?? familyId,
            observerParams: observerParamsFromCondition(worst.sourceCondition),
          },
    blockers,
  };
};

export const buildNhm2ObserverRobustEnergyConditionFromTensor = (
  input: BuildNhm2ObserverRobustEnergyConditionFromTensorInput,
): Nhm2ObserverRobustEnergyConditionArtifactV1 => {
  const tensor = input.tensor ?? null;
  return buildNhm2ObserverRobustEnergyConditionArtifact({
    generatedAt: input.generatedAt,
    laneId: input.laneId,
    selectedProfileId: input.selectedProfileId,
    tensorRef: asText(input.tensorRef) ?? asText(tensor?.tensorRef),
    observerFamilies: [
      buildFamilyFromTensorConditions("eulerian", tensor),
      buildFamilyFromTensorConditions("algebraic_type_i", tensor),
      buildFamilyFromTensorConditions("boosted_timelike_grid", tensor),
      buildFamilyFromTensorConditions("null_direction_grid", tensor),
      {
        familyId: "continuous_optimizer",
        status: "not_run",
        optimizerUsed: false,
        blockers: ["continuous_optimizer_not_implemented"],
      },
    ],
  });
};

const isNumberRecord = (value: unknown): value is Record<string, number> => {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
  return record != null && Object.values(record).every((entry) => Number.isFinite(entry));
};

const isFamily = (
  value: unknown,
): value is Nhm2ObserverRobustEnergyConditionFamilyV1 => {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const worstCase =
    record.worstCase && typeof record.worstCase === "object" && !Array.isArray(record.worstCase)
      ? (record.worstCase as Record<string, unknown>)
      : null;
  return (
    isFamilyId(record.familyId) &&
    isFamilyStatus(record.status) &&
    (record.sampleCount === undefined || Number.isFinite(Number(record.sampleCount))) &&
    (record.optimizerUsed === undefined || typeof record.optimizerUsed === "boolean") &&
    (worstCase == null ||
      (isCondition(worstCase.condition) &&
        (worstCase.value === null || Number.isFinite(Number(worstCase.value))) &&
        (worstCase.locationRef === undefined || asText(worstCase.locationRef) != null) &&
        (worstCase.observerParams === undefined ||
          isNumberRecord(worstCase.observerParams)))) &&
    Array.isArray(record.blockers) &&
    record.blockers.every((entry) => typeof entry === "string")
  );
};

export const isNhm2ObserverRobustEnergyConditionArtifact = (
  value: unknown,
): value is Nhm2ObserverRobustEnergyConditionArtifactV1 => {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const summary =
    record.summary && typeof record.summary === "object" && !Array.isArray(record.summary)
      ? (record.summary as Record<string, unknown>)
      : {};
  return (
    record.contractVersion === NHM2_OBSERVER_ROBUST_ENERGY_CONDITIONS_CONTRACT_VERSION &&
    asText(record.generatedAt) != null &&
    asText(record.laneId) != null &&
    asText(record.selectedProfileId) != null &&
    asText(record.tensorRef) != null &&
    (record.atlasRef === undefined || record.atlasRef === null || asText(record.atlasRef) != null) &&
    (record.atlasHash === undefined || record.atlasHash === null || asText(record.atlasHash) != null) &&
    (record.sampleRegionCoverage === undefined || isNumberRecord(record.sampleRegionCoverage)) &&
    Array.isArray(record.observerFamilies) &&
    record.observerFamilies.every((entry) => isFamily(entry)) &&
    typeof summary.eulerianOnly === "boolean" &&
    typeof summary.robustCheckComplete === "boolean" &&
    typeof summary.anyViolation === "boolean" &&
    NHM2_OBSERVER_MISSED_VIOLATION_RISK_VALUES.includes(
      summary.missedViolationRisk as Nhm2ObserverMissedViolationRisk,
    ) &&
    Array.isArray(record.literatureRefs) &&
    record.literatureRefs[0] ===
      "le_2026_observer_robust_warp_energy_conditions" &&
    record.literatureRefs[1] ===
      "santiago_schuster_visser_2021_generic_warp_nec" &&
    record.literatureRefs.length === 2 &&
    (record.claimBoundary as Record<string, unknown> | undefined)
      ?.diagnosticOnly === true &&
    (record.claimBoundary as Record<string, unknown> | undefined)
      ?.friendlyObserverCannotProveWec === true
  );
};
