import type {
  Nhm2TileSourceFatigueLayerScalingEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_OPERATING_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_fatigue_layer_scaling_operating_budget/v1";

export type Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_OPERATING_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    fatigueLayerScalingEvidenceRef: string | null;
  };
  operatingTargets: {
    layerCount: 447;
    cycleMarginMin: 1;
    layerScalingEfficiencyMin: 0.9;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
    sourceTensorRetentionFractionMin: 0.9;
    thermalCycleDriftFractionMax: 0.01;
    creepDriftFractionMax: 0.01;
    supportCouplingStatusRequired: "pass";
    effectiveActiveLayerCountMin: number;
    effectiveSourceTensorLayerCountMin: number;
  };
  suppliedFatigueLayerScalingEvidence: {
    evidenceTier: string;
    cycleProtocolRef: string | null;
    fatigueCurveRef: string | null;
    thermalCycleRef: string | null;
    creepDriftRef: string | null;
    layerScalingMapRef: string | null;
    nonadditivityModelRef: string | null;
    activeAreaMapRef: string | null;
    supportCouplingMapRef: string | null;
    multiphysicsCouplingRef: string | null;
    cycleCountToFailure: number | null;
    requiredCycleCount: number | null;
    thermalCycleDriftFraction: number | null;
    creepDriftFraction: number | null;
    layerScalingEfficiency: number | null;
    nonadditivityFraction: number | null;
    activeAreaRetention: number | null;
    supportCouplingStatus: "pass" | "review" | "fail" | "missing";
  };
  derivedOperatingBudget: {
    fatigueProvenanceRefsAvailable: boolean;
    layerScalingProvenanceRefsAvailable: boolean;
    cycleMargin: number | null;
    thermalCycleDriftMargin: number | null;
    creepDriftMargin: number | null;
    scalingMargin: number | null;
    nonadditivityMargin: number | null;
    activeAreaMargin: number | null;
    effectiveActiveLayerCount: number | null;
    effectiveActiveLayerCountMargin: number | null;
    sourceTensorRetentionFraction: number | null;
    sourceTensorRetentionMargin: number | null;
  };
  blockers: string[];
  summary: {
    operatingBudgetComputed: boolean;
    fatigueLayerScalingEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetOnly: true;
    fatigueLayerScalingEvidenceDoesNotSupplyFullApparatusTensor: true;
    layerScalingCrossTermsMustEnterFullTensor: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFatigueLayerScalingOperatingBudgetInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  fatigueLayerScalingEvidence?: Nhm2TileSourceFatigueLayerScalingEvidenceV1 | null;
};

const DEFAULT_SELECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const LAYER_COUNT = 447;
const LAYER_SCALING_EFFICIENCY_MIN = 0.9;
const LAYER_NONADDITIVITY_FRACTION_MAX = 0.1;
const ACTIVE_AREA_RETENTION_MIN = 0.6;
const SOURCE_TENSOR_RETENTION_FRACTION_MIN = 0.9;
const THERMAL_CYCLE_DRIFT_FRACTION_MAX = 0.01;
const CREEP_DRIFT_FRACTION_MAX = 0.01;
const EFFECTIVE_ACTIVE_LAYER_COUNT_MIN =
  LAYER_COUNT *
  LAYER_SCALING_EFFICIENCY_MIN *
  (1 - LAYER_NONADDITIVITY_FRACTION_MAX) *
  ACTIVE_AREA_RETENTION_MIN;
const EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN =
  LAYER_COUNT * SOURCE_TENSOR_RETENTION_FRACTION_MIN;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

const upperBoundMargin = (limit: number, value: number | null | undefined): number | null =>
  value == null || !Number.isFinite(value) || value <= 0 ? null : round(limit / value);

export const buildNhm2TileSourceFatigueLayerScalingOperatingBudget = (
  input: BuildNhm2TileSourceFatigueLayerScalingOperatingBudgetInput = {},
): Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1 => {
  const evidence = input.fatigueLayerScalingEvidence ?? null;
  const cycleMargin = safeRatio(
    evidence?.cycleCountToFailure ?? null,
    evidence?.requiredCycleCount ?? null,
  );
  const thermalCycleDriftMargin = upperBoundMargin(
    THERMAL_CYCLE_DRIFT_FRACTION_MAX,
    evidence?.thermalCycleDriftFraction,
  );
  const creepDriftMargin = upperBoundMargin(
    CREEP_DRIFT_FRACTION_MAX,
    evidence?.creepDriftFraction,
  );
  const scalingMargin = safeRatio(
    evidence?.layerScalingEfficiency ?? null,
    LAYER_SCALING_EFFICIENCY_MIN,
  );
  const nonadditivityMargin = safeRatio(
    LAYER_NONADDITIVITY_FRACTION_MAX,
    evidence?.nonadditivityFraction ?? null,
  );
  const activeAreaMargin = safeRatio(
    evidence?.activeAreaRetention ?? null,
    ACTIVE_AREA_RETENTION_MIN,
  );
  const effectiveActiveLayerCount =
    evidence?.layerScalingEfficiency == null ||
    evidence.nonadditivityFraction == null ||
    evidence.activeAreaRetention == null
      ? null
      : round(
          LAYER_COUNT *
            evidence.layerScalingEfficiency *
            (1 - evidence.nonadditivityFraction) *
            evidence.activeAreaRetention,
        );
  const effectiveActiveLayerCountMargin = safeRatio(
    effectiveActiveLayerCount,
    EFFECTIVE_ACTIVE_LAYER_COUNT_MIN,
  );
  const sourceTensorRetentionFraction =
    effectiveActiveLayerCount == null ? null : round(effectiveActiveLayerCount / LAYER_COUNT);
  const sourceTensorRetentionMargin = safeRatio(
    sourceTensorRetentionFraction,
    SOURCE_TENSOR_RETENTION_FRACTION_MIN,
  );
  const blockers = [
    ...(evidence == null || evidence.evidenceTier === "missing"
      ? ["fatigue_layer_scaling_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence?.evidenceTier !== "measured" &&
    evidence?.evidenceTier !== "validated_simulation"
      ? ["fatigue_layer_scaling_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence?.cycleCountToFailure == null
      ? ["cycle_count_to_failure_missing_for_operating_budget"]
      : []),
    ...(evidence?.requiredCycleCount == null
      ? ["required_cycle_count_missing_for_operating_budget"]
      : []),
    ...(evidence?.cycleProtocolRef == null
      ? ["fatigue_cycle_protocol_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.fatigueCurveRef == null
      ? ["fatigue_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.thermalCycleRef == null
      ? ["thermal_cycle_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.creepDriftRef == null
      ? ["creep_drift_ref_missing_for_operating_budget"]
      : []),
    ...(cycleMargin != null && cycleMargin < 1
      ? ["fatigue_cycle_margin_below_one_operating_budget"]
      : []),
    ...(thermalCycleDriftMargin == null
      ? ["thermal_cycle_drift_fraction_missing_for_operating_budget"]
      : thermalCycleDriftMargin < 1
        ? ["thermal_cycle_drift_above_0p01_operating_budget"]
        : []),
    ...(creepDriftMargin == null
      ? ["creep_drift_fraction_missing_for_operating_budget"]
      : creepDriftMargin < 1
        ? ["creep_drift_above_0p01_operating_budget"]
        : []),
    ...(evidence?.layerScalingEfficiency == null
      ? ["layer_scaling_efficiency_missing_for_operating_budget"]
      : scalingMargin != null && scalingMargin < 1
        ? ["layer_scaling_efficiency_below_0p9_operating_budget"]
        : []),
    ...(evidence?.layerScalingMapRef == null
      ? ["layer_scaling_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.nonadditivityFraction == null
      ? ["layer_nonadditivity_fraction_missing_for_operating_budget"]
      : nonadditivityMargin != null && nonadditivityMargin < 1
        ? ["layer_nonadditivity_above_0p1_operating_budget"]
        : []),
    ...(evidence?.nonadditivityModelRef == null
      ? ["layer_nonadditivity_model_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.activeAreaRetention == null
      ? ["active_area_retention_missing_for_operating_budget"]
      : activeAreaMargin != null && activeAreaMargin < 1
        ? ["active_area_retention_below_0p6_operating_budget"]
        : []),
    ...(evidence?.activeAreaMapRef == null
      ? ["active_area_map_ref_missing_for_operating_budget"]
      : []),
    ...(effectiveActiveLayerCountMargin != null && effectiveActiveLayerCountMargin < 1
      ? ["effective_active_layer_count_below_operating_budget"]
      : []),
    ...(sourceTensorRetentionMargin == null
      ? ["source_tensor_retention_fraction_missing_for_operating_budget"]
      : sourceTensorRetentionMargin < 1
        ? ["source_tensor_retention_below_0p9_operating_budget"]
        : []),
    ...(evidence?.supportCouplingStatus !== "pass"
      ? ["support_coupling_status_not_pass_for_operating_budget"]
      : []),
    ...(evidence?.supportCouplingMapRef == null
      ? ["support_coupling_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.multiphysicsCouplingRef == null
      ? ["multiphysics_coupling_ref_missing_for_operating_budget"]
      : []),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "fatigue_cycle_margin_below_one_operating_budget",
            "thermal_cycle_drift_above_0p01_operating_budget",
            "creep_drift_above_0p01_operating_budget",
            "layer_scaling_efficiency_below_0p9_operating_budget",
            "layer_nonadditivity_above_0p1_operating_budget",
            "active_area_retention_below_0p6_operating_budget",
            "effective_active_layer_count_below_operating_budget",
            "source_tensor_retention_below_0p9_operating_budget",
            "support_coupling_status_not_pass_for_operating_budget",
          ].includes(blocker),
        )
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_OPERATING_BUDGET_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_SELECTED_PROFILE_ID,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      fatigueLayerScalingEvidenceRef: evidence?.evidenceRef ?? null,
    },
    operatingTargets: {
      layerCount: 447,
      cycleMarginMin: 1,
      layerScalingEfficiencyMin: LAYER_SCALING_EFFICIENCY_MIN,
      layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
      activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
      sourceTensorRetentionFractionMin: SOURCE_TENSOR_RETENTION_FRACTION_MIN,
      thermalCycleDriftFractionMax: THERMAL_CYCLE_DRIFT_FRACTION_MAX,
      creepDriftFractionMax: CREEP_DRIFT_FRACTION_MAX,
      supportCouplingStatusRequired: "pass",
      effectiveActiveLayerCountMin: round(EFFECTIVE_ACTIVE_LAYER_COUNT_MIN),
      effectiveSourceTensorLayerCountMin: round(EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN),
    },
    suppliedFatigueLayerScalingEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      cycleProtocolRef: stringOrNull(evidence?.cycleProtocolRef),
      fatigueCurveRef: stringOrNull(evidence?.fatigueCurveRef),
      thermalCycleRef: stringOrNull(evidence?.thermalCycleRef),
      creepDriftRef: stringOrNull(evidence?.creepDriftRef),
      layerScalingMapRef: stringOrNull(evidence?.layerScalingMapRef),
      nonadditivityModelRef: stringOrNull(evidence?.nonadditivityModelRef),
      activeAreaMapRef: stringOrNull(evidence?.activeAreaMapRef),
      supportCouplingMapRef: stringOrNull(evidence?.supportCouplingMapRef),
      multiphysicsCouplingRef: stringOrNull(evidence?.multiphysicsCouplingRef),
      cycleCountToFailure: finiteOrNull(evidence?.cycleCountToFailure),
      requiredCycleCount: finiteOrNull(evidence?.requiredCycleCount),
      thermalCycleDriftFraction: finiteOrNull(evidence?.thermalCycleDriftFraction),
      creepDriftFraction: finiteOrNull(evidence?.creepDriftFraction),
      layerScalingEfficiency: finiteOrNull(evidence?.layerScalingEfficiency),
      nonadditivityFraction: finiteOrNull(evidence?.nonadditivityFraction),
      activeAreaRetention: finiteOrNull(evidence?.activeAreaRetention),
      supportCouplingStatus: evidence?.supportCouplingStatus ?? "missing",
    },
    derivedOperatingBudget: {
      fatigueProvenanceRefsAvailable:
        evidence?.cycleProtocolRef != null &&
        evidence.fatigueCurveRef != null &&
        evidence.thermalCycleRef != null &&
        evidence.creepDriftRef != null,
      layerScalingProvenanceRefsAvailable:
        evidence?.layerScalingMapRef != null &&
        evidence.nonadditivityModelRef != null &&
        evidence.activeAreaMapRef != null &&
        evidence.supportCouplingMapRef != null &&
        evidence.multiphysicsCouplingRef != null,
      cycleMargin,
      thermalCycleDriftMargin,
      creepDriftMargin,
      scalingMargin,
      nonadditivityMargin,
      activeAreaMargin,
      effectiveActiveLayerCount,
      effectiveActiveLayerCountMargin,
      sourceTensorRetentionFraction,
      sourceTensorRetentionMargin,
    },
    blockers,
    summary: {
      operatingBudgetComputed: true,
      fatigueLayerScalingEvidenceReady: blockers.length === 0,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetOnly: true,
      fatigueLayerScalingEvidenceDoesNotSupplyFullApparatusTensor: true,
      layerScalingCrossTermsMustEnterFullTensor: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceFatigueLayerScalingOperatingBudget = (
  value: unknown,
): value is Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1 => {
  if (!isRecord(value)) return false;
  const targets = isRecord(value.operatingTargets) ? value.operatingTargets : null;
  const supplied = isRecord(value.suppliedFatigueLayerScalingEvidence)
    ? value.suppliedFatigueLayerScalingEvidence
    : null;
  const budget = isRecord(value.derivedOperatingBudget)
    ? value.derivedOperatingBudget
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion ===
      NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_OPERATING_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    targets != null &&
    targets.layerCount === 447 &&
    targets.cycleMarginMin === 1 &&
    targets.layerScalingEfficiencyMin === 0.9 &&
    targets.layerNonadditivityFractionMax === 0.1 &&
    targets.activeAreaRetentionMin === 0.6 &&
    targets.sourceTensorRetentionFractionMin === 0.9 &&
    targets.thermalCycleDriftFractionMax === 0.01 &&
    targets.creepDriftFractionMax === 0.01 &&
    targets.supportCouplingStatusRequired === "pass" &&
    typeof targets.effectiveActiveLayerCountMin === "number" &&
    typeof targets.effectiveSourceTensorLayerCountMin === "number" &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    summary.operatingBudgetComputed === true &&
    typeof summary.fatigueLayerScalingEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetOnly === true &&
    boundary.fatigueLayerScalingEvidenceDoesNotSupplyFullApparatusTensor === true &&
    boundary.layerScalingCrossTermsMustEnterFullTensor === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
