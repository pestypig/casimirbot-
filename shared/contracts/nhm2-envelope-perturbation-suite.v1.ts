export const NHM2_ENVELOPE_PERTURBATION_SUITE_ARTIFACT_ID =
  "nhm2_envelope_perturbation_suite";
export const NHM2_ENVELOPE_PERTURBATION_SUITE_SCHEMA_VERSION =
  "nhm2_envelope_perturbation_suite/v1";

export const NHM2_ENVELOPE_PERTURBATION_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_SUITE_ID_VALUES = [
  "resolution_sensitivity",
  "boundary_condition_sensitivity",
  "local_lapse_profile_perturbations",
  "stronger_boundary_lapse_perturbations",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_AXIS_VALUES = [
  "resolution",
  "boundary_condition",
  "lapse_profile",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_PROVENANCE_VALUES = [
  "published_selected_bundle",
  "direct_gr_perturbation",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_MISSION_TIME_SOURCE_VALUES = [
  "live_pipeline_contracts",
  "selected_bundle_contracts_reused",
  "missing",
] as const;

export const NHM2_ENVELOPE_PERTURBATION_REASON_CODES = [
  "transport_not_admitted",
  "authoritative_low_expansion_failed",
  "authoritative_low_expansion_missing",
  "wall_safety_failed",
  "wall_safety_missing",
  "solver_health_unstable",
  "solver_health_missing",
  "mission_time_missing",
  "mission_time_reused_from_selected_bundle",
  "negative_result_preserved",
] as const;

export type Nhm2EnvelopePerturbationStatus =
  (typeof NHM2_ENVELOPE_PERTURBATION_STATUS_VALUES)[number];
export type Nhm2EnvelopePerturbationCompleteness =
  (typeof NHM2_ENVELOPE_PERTURBATION_COMPLETENESS_VALUES)[number];
export type Nhm2EnvelopePerturbationSuiteId =
  (typeof NHM2_ENVELOPE_PERTURBATION_SUITE_ID_VALUES)[number];
export type Nhm2EnvelopePerturbationAxis =
  (typeof NHM2_ENVELOPE_PERTURBATION_AXIS_VALUES)[number];
export type Nhm2EnvelopePerturbationProvenance =
  (typeof NHM2_ENVELOPE_PERTURBATION_PROVENANCE_VALUES)[number];
export type Nhm2EnvelopePerturbationMissionTimeSource =
  (typeof NHM2_ENVELOPE_PERTURBATION_MISSION_TIME_SOURCE_VALUES)[number];
export type Nhm2EnvelopePerturbationReasonCode =
  (typeof NHM2_ENVELOPE_PERTURBATION_REASON_CODES)[number];

export type Nhm2EnvelopePerturbationStatusCounts = Record<
  Nhm2EnvelopePerturbationStatus,
  number
>;

export type Nhm2EnvelopePerturbationSelectors = {
  metricT00Ref: string | null;
  metricT00Source: string | null;
  warpFieldType: string | null;
  shiftLapseProfileId: string | null;
  requireCongruentSolve: boolean;
  requireNhm2CongruentFullSolve: boolean;
};

export type Nhm2EnvelopePerturbationDescriptor = {
  dimension: string | null;
  valueId: string | null;
  valueLabel: string | null;
  numericValue: number | null;
  baseline: boolean;
};

export type Nhm2EnvelopePerturbationGrid = {
  dims: [number, number, number] | null;
  voxelSize_m: [number, number, number] | null;
  boundaryMode: string | null;
  spongeCells: number | null;
};

export type Nhm2EnvelopePerturbationTransport = {
  transportCertificationStatus: string | null;
  promotionGateStatus: string | null;
  promotionGateReason: string | null;
  centerlineAlpha: number | null;
  centerlineDtauDt: number | null;
  boundedTimingDifferentialDetected: boolean | null;
  missionTimeInterpretationStatus: string | null;
};

export type Nhm2EnvelopePerturbationLowExpansion = {
  status: string | null;
  source: string | null;
  divergenceRms: number | null;
  divergenceMaxAbs: number | null;
  divergenceTolerance: number | null;
  thetaKConsistencyStatus: string | null;
  thetaKResidualAbs: number | null;
  thetaKTolerance: number | null;
  worstUsage: number | null;
  worstMargin: number | null;
};

export type Nhm2EnvelopePerturbationWallSafety = {
  status: string | null;
  reason: string | null;
  betaOverAlphaMax: number | null;
  betaOutwardOverAlphaWallMax: number | null;
  wallHorizonMargin: number | null;
  worstUsage: number | null;
  worstMargin: number | null;
};

export type Nhm2EnvelopePerturbationSolverHealth = {
  status: string | null;
  reasons: string[];
  alphaClampFraction: number | null;
  kClampFraction: number | null;
  totalClampFraction: number | null;
  maxAlphaBeforeClamp: number | null;
  maxKBeforeClamp: number | null;
  clampFractionLimit: number | null;
  alphaMultiplierLimit: number | null;
  kMultiplierLimit: number | null;
  clampFractionHeadroom: number | null;
  alphaMultiplierHeadroom: number | null;
  kMultiplierHeadroom: number | null;
};

export type Nhm2EnvelopePerturbationMissionTime = {
  source: Nhm2EnvelopePerturbationMissionTimeSource;
  estimatorStatus: string | null;
  comparisonStatus: string | null;
  interpretationStatus: string | null;
  coordinateYears: number | null;
  properYears: number | null;
  classicalYears: number | null;
  properMinusCoordinateSeconds: number | null;
  properMinusClassicalSeconds: number | null;
  sourceArtifactPath: string | null;
  reportPath: string | null;
};

export type Nhm2EnvelopePerturbationArtifactRefs = {
  transportResultLatestJsonPath: string | null;
  transportResultLatestMdPath: string | null;
  worldlineLatestJsonPath: string | null;
  missionTimeEstimatorLatestJsonPath: string | null;
  missionTimeComparisonLatestJsonPath: string | null;
};

export type Nhm2EnvelopePerturbationCase = {
  caseId: string;
  label: string;
  suiteId: Nhm2EnvelopePerturbationSuiteId;
  axis: Nhm2EnvelopePerturbationAxis;
  provenance: Nhm2EnvelopePerturbationProvenance;
  status: Nhm2EnvelopePerturbationStatus;
  completeness: Nhm2EnvelopePerturbationCompleteness;
  reasonCodes: Nhm2EnvelopePerturbationReasonCode[];
  summary: string | null;
  selectors: Nhm2EnvelopePerturbationSelectors;
  perturbation: Nhm2EnvelopePerturbationDescriptor;
  grid: Nhm2EnvelopePerturbationGrid;
  transport: Nhm2EnvelopePerturbationTransport;
  lowExpansion: Nhm2EnvelopePerturbationLowExpansion;
  wallSafety: Nhm2EnvelopePerturbationWallSafety;
  solverHealth: Nhm2EnvelopePerturbationSolverHealth;
  missionTime: Nhm2EnvelopePerturbationMissionTime;
  artifactRefs: Nhm2EnvelopePerturbationArtifactRefs;
};

export type Nhm2EnvelopePerturbationSuite = {
  suiteId: Nhm2EnvelopePerturbationSuiteId;
  suiteLabel: string;
  axis: Nhm2EnvelopePerturbationAxis;
  referenceCaseId: string | null;
  status: Nhm2EnvelopePerturbationStatus;
  completeness: Nhm2EnvelopePerturbationCompleteness;
  caseCount: number;
  caseOrder: string[];
  summary: string | null;
  statusCounts: Nhm2EnvelopePerturbationStatusCounts;
  negativeCaseIds: string[];
  incompleteCaseIds: string[];
  worstWallSafetyMargin: number | null;
  tightestSolverHealthClampHeadroom: number | null;
  missionTimeInterpretationStatuses: string[];
  cases: Nhm2EnvelopePerturbationCase[];
};

export type Nhm2EnvelopePerturbationArtifact = {
  artifactId: typeof NHM2_ENVELOPE_PERTURBATION_SUITE_ARTIFACT_ID;
  schemaVersion: typeof NHM2_ENVELOPE_PERTURBATION_SUITE_SCHEMA_VERSION;
  generatedOn: string;
  generatedAt: string;
  status: Nhm2EnvelopePerturbationStatus;
  completeness: Nhm2EnvelopePerturbationCompleteness;
  boundaryStatement: string;
  publicationCommand: string | null;
  family: {
    warpFieldType: string | null;
    metricT00Ref: string | null;
    metricT00Source: string | null;
    shiftLapseProfileId: string | null;
    shiftLapseProfileStage: string | null;
    referenceTransportResultPath: string | null;
    referenceProfileSweepPath: string | null;
    referenceBoundarySweepPath: string | null;
  };
  suiteOrder: Nhm2EnvelopePerturbationSuiteId[];
  suites: Nhm2EnvelopePerturbationSuite[];
  summary: {
    suiteCount: number;
    caseCount: number;
    statusCounts: Nhm2EnvelopePerturbationStatusCounts;
    negativeCaseIds: string[];
    incompleteCaseIds: string[];
    missionTimeInterpretationStatuses: string[];
    worstWallSafetyMargin: number | null;
    tightestSolverHealthClampHeadroom: number | null;
  };
  reproducibility: {
    deterministicCaseOrder: true;
    caseGenerationPolicyId: string;
    publicationCommand: string | null;
    supportingCommands: string[];
    sourceArtifactPaths: string[];
  };
  nonClaims: string[];
};

export type BuildNhm2EnvelopePerturbationCaseInput = Partial<
  Omit<Nhm2EnvelopePerturbationCase, "caseId" | "label" | "suiteId" | "axis">
> & {
  caseId: string;
  label: string;
  suiteId: Nhm2EnvelopePerturbationSuiteId;
  axis: Nhm2EnvelopePerturbationAxis;
};

export type BuildNhm2EnvelopePerturbationSuiteInput = {
  suiteId: Nhm2EnvelopePerturbationSuiteId;
  suiteLabel?: string | null;
  axis?: Nhm2EnvelopePerturbationAxis | null;
  referenceCaseId?: string | null;
  summary?: string | null;
  cases: BuildNhm2EnvelopePerturbationCaseInput[];
};

export type BuildNhm2EnvelopePerturbationArtifactInput = {
  generatedOn: string;
  generatedAt?: string | null;
  boundaryStatement?: string | null;
  publicationCommand?: string | null;
  family?: Partial<Nhm2EnvelopePerturbationArtifact["family"]> | null;
  suites: BuildNhm2EnvelopePerturbationSuiteInput[];
  reproducibility?: Partial<Nhm2EnvelopePerturbationArtifact["reproducibility"]> | null;
  nonClaims?: string[] | null;
};

const SUITE_LABELS: Record<Nhm2EnvelopePerturbationSuiteId, string> = {
  resolution_sensitivity: "Resolution Sensitivity",
  boundary_condition_sensitivity: "Boundary-Condition Sensitivity",
  local_lapse_profile_perturbations: "Local Lapse-Profile Perturbations",
  stronger_boundary_lapse_perturbations: "Stronger-Boundary Lapse Perturbations",
};

const SUITE_AXIS_BY_ID: Record<
  Nhm2EnvelopePerturbationSuiteId,
  Nhm2EnvelopePerturbationAxis
> = {
  resolution_sensitivity: "resolution",
  boundary_condition_sensitivity: "boundary_condition",
  local_lapse_profile_perturbations: "lapse_profile",
  stronger_boundary_lapse_perturbations: "lapse_profile",
};

const STATUS_RANK: Record<Nhm2EnvelopePerturbationStatus, number> = {
  pass: 0,
  unavailable: 1,
  review: 2,
  fail: 3,
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const toTextList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => asText(entry)).filter((entry): entry is string => entry != null)
    : [];

const toVec3 = (value: unknown): [number, number, number] | null => {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const normalized = value.map((entry) => toFinite(entry));
  return normalized.every((entry) => entry != null)
    ? ([normalized[0], normalized[1], normalized[2]] as [number, number, number])
    : null;
};

const isStatus = (value: unknown): value is Nhm2EnvelopePerturbationStatus =>
  NHM2_ENVELOPE_PERTURBATION_STATUS_VALUES.includes(
    value as Nhm2EnvelopePerturbationStatus,
  );

const isCompleteness = (
  value: unknown,
): value is Nhm2EnvelopePerturbationCompleteness =>
  NHM2_ENVELOPE_PERTURBATION_COMPLETENESS_VALUES.includes(
    value as Nhm2EnvelopePerturbationCompleteness,
  );

const isSuiteId = (value: unknown): value is Nhm2EnvelopePerturbationSuiteId =>
  NHM2_ENVELOPE_PERTURBATION_SUITE_ID_VALUES.includes(
    value as Nhm2EnvelopePerturbationSuiteId,
  );

const isAxis = (value: unknown): value is Nhm2EnvelopePerturbationAxis =>
  NHM2_ENVELOPE_PERTURBATION_AXIS_VALUES.includes(
    value as Nhm2EnvelopePerturbationAxis,
  );

const isProvenance = (
  value: unknown,
): value is Nhm2EnvelopePerturbationProvenance =>
  NHM2_ENVELOPE_PERTURBATION_PROVENANCE_VALUES.includes(
    value as Nhm2EnvelopePerturbationProvenance,
  );

const isMissionTimeSource = (
  value: unknown,
): value is Nhm2EnvelopePerturbationMissionTimeSource =>
  NHM2_ENVELOPE_PERTURBATION_MISSION_TIME_SOURCE_VALUES.includes(
    value as Nhm2EnvelopePerturbationMissionTimeSource,
  );

const orderReasonCodes = (
  value: unknown,
): Nhm2EnvelopePerturbationReasonCode[] =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => asText(entry))
        .filter(
          (entry): entry is Nhm2EnvelopePerturbationReasonCode =>
            entry != null &&
            NHM2_ENVELOPE_PERTURBATION_REASON_CODES.includes(
              entry as Nhm2EnvelopePerturbationReasonCode,
            ),
        ),
    ),
  ).sort(
    (lhs, rhs) =>
      NHM2_ENVELOPE_PERTURBATION_REASON_CODES.indexOf(lhs) -
      NHM2_ENVELOPE_PERTURBATION_REASON_CODES.indexOf(rhs),
  );

const buildStatusCounts = (
  cases: Array<{ status: Nhm2EnvelopePerturbationStatus }>,
): Nhm2EnvelopePerturbationStatusCounts => {
  const counts: Nhm2EnvelopePerturbationStatusCounts = {
    pass: 0,
    fail: 0,
    review: 0,
    unavailable: 0,
  };
  for (const entry of cases) counts[entry.status] += 1;
  return counts;
};

const aggregateStatus = (
  statuses: Nhm2EnvelopePerturbationStatus[],
): Nhm2EnvelopePerturbationStatus =>
  statuses.reduce<Nhm2EnvelopePerturbationStatus>(
    (worst, entry) => (STATUS_RANK[entry] > STATUS_RANK[worst] ? entry : worst),
    "pass",
  );

const aggregateCompleteness = (
  entries: Array<{ completeness: Nhm2EnvelopePerturbationCompleteness }>,
): Nhm2EnvelopePerturbationCompleteness =>
  entries.some((entry) => entry.completeness === "incomplete")
    ? "incomplete"
    : "complete";

const minFinite = (values: Array<number | null | undefined>): number | null => {
  const finite = values.filter((entry): entry is number => Number.isFinite(entry));
  return finite.length > 0 ? Math.min(...finite) : null;
};

const buildCase = (
  input: BuildNhm2EnvelopePerturbationCaseInput,
): Nhm2EnvelopePerturbationCase => {
  const transport = asRecord(input.transport);
  const lowExpansion = asRecord(input.lowExpansion);
  const wallSafety = asRecord(input.wallSafety);
  const solverHealth = asRecord(input.solverHealth);
  const missionTime = asRecord(input.missionTime);
  const artifactRefs = asRecord(input.artifactRefs);
  const missionTimeSource = isMissionTimeSource(missionTime.source)
    ? missionTime.source
    : "missing";
  const defaultStatus: Nhm2EnvelopePerturbationStatus =
    asText(transport.transportCertificationStatus) ===
      "bounded_transport_fail_closed_reference_only" ||
    asText(lowExpansion.status) === "fail" ||
    asText(wallSafety.status) === "fail" ||
    asText(solverHealth.status) === "UNSTABLE"
      ? "fail"
      : missionTimeSource === "missing"
        ? "unavailable"
        : "pass";
  const completeness: Nhm2EnvelopePerturbationCompleteness =
    isCompleteness(input.completeness)
      ? input.completeness
      : missionTimeSource === "missing" || asText(solverHealth.status) == null
        ? "incomplete"
        : "complete";
  const inferredReasonCodes: Nhm2EnvelopePerturbationReasonCode[] = [];
  if (
    asText(transport.transportCertificationStatus) != null &&
    asText(transport.transportCertificationStatus) !==
      "bounded_transport_proof_bearing_gate_admitted"
  ) {
    inferredReasonCodes.push("transport_not_admitted");
  }
  if (asText(lowExpansion.status) === "fail") {
    inferredReasonCodes.push("authoritative_low_expansion_failed");
  } else if (asText(lowExpansion.status) == null) {
    inferredReasonCodes.push("authoritative_low_expansion_missing");
  }
  if (asText(wallSafety.status) === "fail") {
    inferredReasonCodes.push("wall_safety_failed");
  } else if (asText(wallSafety.status) == null) {
    inferredReasonCodes.push("wall_safety_missing");
  }
  if (asText(solverHealth.status) === "UNSTABLE") {
    inferredReasonCodes.push("solver_health_unstable");
  } else if (asText(solverHealth.status) == null) {
    inferredReasonCodes.push("solver_health_missing");
  }
  if (missionTimeSource === "missing") {
    inferredReasonCodes.push("mission_time_missing");
  } else if (missionTimeSource === "selected_bundle_contracts_reused") {
    inferredReasonCodes.push("mission_time_reused_from_selected_bundle");
  }
  if (defaultStatus === "fail") {
    inferredReasonCodes.push("negative_result_preserved");
  }
  return {
    caseId: asText(input.caseId) ?? "unnamed_case",
    label: asText(input.label) ?? "Unnamed Case",
    suiteId: input.suiteId,
    axis: input.axis,
    provenance: isProvenance(input.provenance)
      ? input.provenance
      : "published_selected_bundle",
    status: isStatus(input.status) ? input.status : defaultStatus,
    completeness,
    reasonCodes: orderReasonCodes([
      ...inferredReasonCodes,
      ...(Array.isArray(input.reasonCodes) ? input.reasonCodes : []),
    ]),
    summary: asText(input.summary),
    selectors: {
      metricT00Ref: asText(input.selectors?.metricT00Ref),
      metricT00Source: asText(input.selectors?.metricT00Source),
      warpFieldType: asText(input.selectors?.warpFieldType),
      shiftLapseProfileId: asText(input.selectors?.shiftLapseProfileId),
      requireCongruentSolve: toBoolean(input.selectors?.requireCongruentSolve),
      requireNhm2CongruentFullSolve: toBoolean(
        input.selectors?.requireNhm2CongruentFullSolve,
      ),
    },
    perturbation: {
      dimension: asText(input.perturbation?.dimension),
      valueId: asText(input.perturbation?.valueId),
      valueLabel: asText(input.perturbation?.valueLabel),
      numericValue: toFinite(input.perturbation?.numericValue),
      baseline: toBoolean(input.perturbation?.baseline),
    },
    grid: {
      dims: toVec3(input.grid?.dims),
      voxelSize_m: toVec3(input.grid?.voxelSize_m),
      boundaryMode: asText(input.grid?.boundaryMode),
      spongeCells: toFinite(input.grid?.spongeCells),
    },
    transport: {
      transportCertificationStatus: asText(transport.transportCertificationStatus),
      promotionGateStatus: asText(transport.promotionGateStatus),
      promotionGateReason: asText(transport.promotionGateReason),
      centerlineAlpha: toFinite(transport.centerlineAlpha),
      centerlineDtauDt: toFinite(transport.centerlineDtauDt),
      boundedTimingDifferentialDetected:
        typeof transport.boundedTimingDifferentialDetected === "boolean"
          ? transport.boundedTimingDifferentialDetected
          : null,
      missionTimeInterpretationStatus: asText(transport.missionTimeInterpretationStatus),
    },
    lowExpansion: {
      status: asText(lowExpansion.status),
      source: asText(lowExpansion.source),
      divergenceRms: toFinite(lowExpansion.divergenceRms),
      divergenceMaxAbs: toFinite(lowExpansion.divergenceMaxAbs),
      divergenceTolerance: toFinite(lowExpansion.divergenceTolerance),
      thetaKConsistencyStatus: asText(lowExpansion.thetaKConsistencyStatus),
      thetaKResidualAbs: toFinite(lowExpansion.thetaKResidualAbs),
      thetaKTolerance: toFinite(lowExpansion.thetaKTolerance),
      worstUsage: toFinite(lowExpansion.worstUsage),
      worstMargin: toFinite(lowExpansion.worstMargin),
    },
    wallSafety: {
      status: asText(wallSafety.status),
      reason: asText(wallSafety.reason),
      betaOverAlphaMax: toFinite(wallSafety.betaOverAlphaMax),
      betaOutwardOverAlphaWallMax: toFinite(wallSafety.betaOutwardOverAlphaWallMax),
      wallHorizonMargin: toFinite(wallSafety.wallHorizonMargin),
      worstUsage: toFinite(wallSafety.worstUsage),
      worstMargin: toFinite(wallSafety.worstMargin),
    },
    solverHealth: {
      status: asText(solverHealth.status),
      reasons: toTextList(solverHealth.reasons),
      alphaClampFraction: toFinite(solverHealth.alphaClampFraction),
      kClampFraction: toFinite(solverHealth.kClampFraction),
      totalClampFraction: toFinite(solverHealth.totalClampFraction),
      maxAlphaBeforeClamp: toFinite(solverHealth.maxAlphaBeforeClamp),
      maxKBeforeClamp: toFinite(solverHealth.maxKBeforeClamp),
      clampFractionLimit: toFinite(solverHealth.clampFractionLimit),
      alphaMultiplierLimit: toFinite(solverHealth.alphaMultiplierLimit),
      kMultiplierLimit: toFinite(solverHealth.kMultiplierLimit),
      clampFractionHeadroom: toFinite(solverHealth.clampFractionHeadroom),
      alphaMultiplierHeadroom: toFinite(solverHealth.alphaMultiplierHeadroom),
      kMultiplierHeadroom: toFinite(solverHealth.kMultiplierHeadroom),
    },
    missionTime: {
      source: missionTimeSource,
      estimatorStatus: asText(missionTime.estimatorStatus),
      comparisonStatus: asText(missionTime.comparisonStatus),
      interpretationStatus: asText(missionTime.interpretationStatus),
      coordinateYears: toFinite(missionTime.coordinateYears),
      properYears: toFinite(missionTime.properYears),
      classicalYears: toFinite(missionTime.classicalYears),
      properMinusCoordinateSeconds: toFinite(missionTime.properMinusCoordinateSeconds),
      properMinusClassicalSeconds: toFinite(missionTime.properMinusClassicalSeconds),
      sourceArtifactPath: asText(missionTime.sourceArtifactPath),
      reportPath: asText(missionTime.reportPath),
    },
    artifactRefs: {
      transportResultLatestJsonPath: asText(artifactRefs.transportResultLatestJsonPath),
      transportResultLatestMdPath: asText(artifactRefs.transportResultLatestMdPath),
      worldlineLatestJsonPath: asText(artifactRefs.worldlineLatestJsonPath),
      missionTimeEstimatorLatestJsonPath: asText(
        artifactRefs.missionTimeEstimatorLatestJsonPath,
      ),
      missionTimeComparisonLatestJsonPath: asText(
        artifactRefs.missionTimeComparisonLatestJsonPath,
      ),
    },
  };
};

const buildSuite = (
  input: BuildNhm2EnvelopePerturbationSuiteInput,
): Nhm2EnvelopePerturbationSuite => {
  const cases = input.cases.map((entry) => buildCase(entry));
  const statusCounts = buildStatusCounts(cases);
  return {
    suiteId: input.suiteId,
    suiteLabel: asText(input.suiteLabel) ?? SUITE_LABELS[input.suiteId],
    axis: isAxis(input.axis) ? input.axis : SUITE_AXIS_BY_ID[input.suiteId],
    referenceCaseId: asText(input.referenceCaseId),
    status: aggregateStatus(cases.map((entry) => entry.status)),
    completeness: aggregateCompleteness(cases),
    caseCount: cases.length,
    caseOrder: cases.map((entry) => entry.caseId),
    summary: asText(input.summary),
    statusCounts,
    negativeCaseIds: cases
      .filter((entry) => entry.status === "fail")
      .map((entry) => entry.caseId),
    incompleteCaseIds: cases
      .filter((entry) => entry.completeness === "incomplete")
      .map((entry) => entry.caseId),
    worstWallSafetyMargin: minFinite(
      cases.map((entry) => entry.wallSafety.worstMargin),
    ),
    tightestSolverHealthClampHeadroom: minFinite(
      cases.map((entry) => entry.solverHealth.clampFractionHeadroom),
    ),
    missionTimeInterpretationStatuses: Array.from(
      new Set(
        cases
          .map((entry) => entry.missionTime.interpretationStatus)
          .filter((entry): entry is string => entry != null),
      ),
    ),
    cases,
  };
};

export const buildNhm2EnvelopePerturbationArtifact = (
  input: BuildNhm2EnvelopePerturbationArtifactInput,
): Nhm2EnvelopePerturbationArtifact => {
  const suites = input.suites.map((entry) => buildSuite(entry));
  const allCases = suites.flatMap((entry) => entry.cases);
  const summaryStatusCounts = buildStatusCounts(allCases);
  const family = asRecord(input.family);
  const reproducibility = asRecord(input.reproducibility);
  return {
    artifactId: NHM2_ENVELOPE_PERTURBATION_SUITE_ARTIFACT_ID,
    schemaVersion: NHM2_ENVELOPE_PERTURBATION_SUITE_SCHEMA_VERSION,
    generatedOn: asText(input.generatedOn) ?? new Date().toISOString().slice(0, 10),
    generatedAt: asText(input.generatedAt) ?? new Date().toISOString(),
    status: aggregateStatus(suites.map((entry) => entry.status)),
    completeness: aggregateCompleteness(suites),
    boundaryStatement:
      asText(input.boundaryStatement) ??
      "This artifact records deterministic NHM2 envelope and perturbation evidence over the selected family without widening transport, speed, viability, or ETA claims.",
    publicationCommand: asText(input.publicationCommand),
    family: {
      warpFieldType: asText(family.warpFieldType),
      metricT00Ref: asText(family.metricT00Ref),
      metricT00Source: asText(family.metricT00Source),
      shiftLapseProfileId: asText(family.shiftLapseProfileId),
      shiftLapseProfileStage: asText(family.shiftLapseProfileStage),
      referenceTransportResultPath: asText(family.referenceTransportResultPath),
      referenceProfileSweepPath: asText(family.referenceProfileSweepPath),
      referenceBoundarySweepPath: asText(family.referenceBoundarySweepPath),
    },
    suiteOrder: suites.map((entry) => entry.suiteId),
    suites,
    summary: {
      suiteCount: suites.length,
      caseCount: allCases.length,
      statusCounts: summaryStatusCounts,
      negativeCaseIds: allCases
        .filter((entry) => entry.status === "fail")
        .map((entry) => entry.caseId),
      incompleteCaseIds: allCases
        .filter((entry) => entry.completeness === "incomplete")
        .map((entry) => entry.caseId),
      missionTimeInterpretationStatuses: Array.from(
        new Set(
          allCases
            .map((entry) => entry.missionTime.interpretationStatus)
            .filter((entry): entry is string => entry != null),
        ),
      ),
      worstWallSafetyMargin: minFinite(
        allCases.map((entry) => entry.wallSafety.worstMargin),
      ),
      tightestSolverHealthClampHeadroom: minFinite(
        allCases.map((entry) => entry.solverHealth.clampFractionHeadroom),
      ),
    },
    reproducibility: {
      deterministicCaseOrder: true,
      caseGenerationPolicyId:
        asText(reproducibility.caseGenerationPolicyId) ??
        "nhm2_selected_family_envelope_v1",
      publicationCommand:
        asText(reproducibility.publicationCommand) ??
        asText(input.publicationCommand),
      supportingCommands: toTextList(reproducibility.supportingCommands),
      sourceArtifactPaths: toTextList(reproducibility.sourceArtifactPaths),
    },
    nonClaims:
      toTextList(input.nonClaims).length > 0
        ? toTextList(input.nonClaims)
        : [
            "does not widen speed claims",
            "does not widen ETA claims",
            "does not widen viability claims",
            "preserves negative and incomplete envelope cases as evidence",
          ],
  };
};

const isStatusCounts = (value: unknown): value is Nhm2EnvelopePerturbationStatusCounts => {
  const record = asRecord(value);
  return NHM2_ENVELOPE_PERTURBATION_STATUS_VALUES.every((entry) =>
    Number.isInteger(record[entry]) && Number(record[entry]) >= 0,
  );
};

const isCase = (value: unknown): value is Nhm2EnvelopePerturbationCase => {
  const record = asRecord(value);
  return (
    asText(record.caseId) != null &&
    asText(record.label) != null &&
    isSuiteId(record.suiteId) &&
    isAxis(record.axis) &&
    isProvenance(record.provenance) &&
    isStatus(record.status) &&
    isCompleteness(record.completeness) &&
    Array.isArray(record.reasonCodes) &&
    isMissionTimeSource(asRecord(record.missionTime).source)
  );
};

const isSuite = (value: unknown): value is Nhm2EnvelopePerturbationSuite => {
  const record = asRecord(value);
  const cases = Array.isArray(record.cases) ? record.cases : [];
  return (
    isSuiteId(record.suiteId) &&
    asText(record.suiteLabel) != null &&
    isAxis(record.axis) &&
    isStatus(record.status) &&
    isCompleteness(record.completeness) &&
    Number.isInteger(record.caseCount) &&
    Array.isArray(record.caseOrder) &&
    isStatusCounts(record.statusCounts) &&
    Array.isArray(record.negativeCaseIds) &&
    Array.isArray(record.incompleteCaseIds) &&
    Array.isArray(record.missionTimeInterpretationStatuses) &&
    cases.length === Number(record.caseCount) &&
    cases.every((entry) => isCase(entry))
  );
};

export const isNhm2EnvelopePerturbationArtifact = (
  value: unknown,
): value is Nhm2EnvelopePerturbationArtifact => {
  const record = asRecord(value);
  const suites = Array.isArray(record.suites) ? record.suites : [];
  return (
    record.artifactId === NHM2_ENVELOPE_PERTURBATION_SUITE_ARTIFACT_ID &&
    record.schemaVersion === NHM2_ENVELOPE_PERTURBATION_SUITE_SCHEMA_VERSION &&
    asText(record.generatedOn) != null &&
    asText(record.generatedAt) != null &&
    isStatus(record.status) &&
    isCompleteness(record.completeness) &&
    asText(record.boundaryStatement) != null &&
    Array.isArray(record.suiteOrder) &&
    suites.every((entry) => isSuite(entry)) &&
    Number(record.summary && asRecord(record.summary).suiteCount) === suites.length &&
    isStatusCounts(asRecord(record.summary).statusCounts) &&
    Array.isArray(asRecord(record.reproducibility).supportingCommands) &&
    Array.isArray(asRecord(record.reproducibility).sourceArtifactPaths) &&
    Array.isArray(record.nonClaims)
  );
};
