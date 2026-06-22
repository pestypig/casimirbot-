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
    perLayerVariationFractionMax: 0.05;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
    supportCouplingFractionMax: 0.1;
    electromagneticCouplingFractionMax: 0.1;
    mechanicalCouplingFractionMax: 0.1;
    sourceTensorRetentionFractionMin: 0.9;
    thermalCycleDriftFractionMax: 0.01;
    creepDriftFractionMax: 0.01;
    delaminationMarginMin: 1;
    interlayerAdhesionMarginMin: 1;
    supportCouplingStatusRequired: "pass";
    effectiveActiveLayerCountMin: number;
    effectiveSourceTensorLayerCountMin: number;
  };
  suppliedFatigueLayerScalingEvidence: {
    evidenceTier: string;
    loadSpectrumRef: string | null;
    cycleProtocolRef: string | null;
    cryogenicFatigueRef: string | null;
    fatigueCurveRef: string | null;
    thermalCycleRef: string | null;
    creepDriftRef: string | null;
    delaminationProtocolRef: string | null;
    interlayerAdhesionRef: string | null;
    layerScalingMapRef: string | null;
    perLayerVariationMapRef: string | null;
    nonadditivityModelRef: string | null;
    activeAreaMapRef: string | null;
    supportCouplingMapRef: string | null;
    electromagneticCouplingMapRef: string | null;
    mechanicalCouplingMapRef: string | null;
    multiphysicsCouplingRef: string | null;
    sourceTensorRetentionMapRef: string | null;
    cycleCountToFailure: number | null;
    requiredCycleCount: number | null;
    thermalCycleDriftFraction: number | null;
    creepDriftFraction: number | null;
    delaminationMargin: number | null;
    interlayerAdhesionMargin: number | null;
    layerScalingEfficiency: number | null;
    perLayerVariationFraction: number | null;
    nonadditivityFraction: number | null;
    activeAreaRetention: number | null;
    supportCouplingFraction: number | null;
    electromagneticCouplingFraction: number | null;
    mechanicalCouplingFraction: number | null;
    sourceTensorRetentionFraction: number | null;
    supportCouplingStatus: "pass" | "review" | "fail" | "missing";
  };
  derivedOperatingBudget: {
    fatigueProvenanceRefsAvailable: boolean;
    layerScalingProvenanceRefsAvailable: boolean;
    cycleMargin: number | null;
    thermalCycleDriftMargin: number | null;
    creepDriftMargin: number | null;
    delaminationMargin: number | null;
    interlayerAdhesionMargin: number | null;
    scalingMargin: number | null;
    perLayerVariationMargin: number | null;
    nonadditivityMargin: number | null;
    activeAreaMargin: number | null;
    supportCouplingMargin: number | null;
    electromagneticCouplingMargin: number | null;
    mechanicalCouplingMargin: number | null;
    effectiveActiveLayerCount: number | null;
    effectiveActiveLayerCountMargin: number | null;
    sourceTensorRetentionFraction: number | null;
    sourceTensorRetentionMargin: number | null;
  };
  requiredCorrections: {
    cycleMarginMin: 1;
    cycleCountRequired: number | null;
    cycleCountShortfall: number | null;
    thermalCycleDriftFractionMax: 0.01;
    thermalCycleDriftReduction: number | null;
    creepDriftFractionMax: 0.01;
    creepDriftReduction: number | null;
    delaminationMarginMin: 1;
    delaminationMarginShortfall: number | null;
    interlayerAdhesionMarginMin: 1;
    interlayerAdhesionMarginShortfall: number | null;
    layerScalingEfficiencyMin: 0.9;
    layerScalingEfficiencyShortfall: number | null;
    perLayerVariationFractionMax: 0.05;
    perLayerVariationReduction: number | null;
    layerNonadditivityFractionMax: 0.1;
    layerNonadditivityReduction: number | null;
    activeAreaRetentionMin: 0.6;
    activeAreaRetentionShortfall: number | null;
    supportCouplingFractionMax: 0.1;
    supportCouplingFractionReduction: number | null;
    electromagneticCouplingFractionMax: 0.1;
    electromagneticCouplingFractionReduction: number | null;
    mechanicalCouplingFractionMax: 0.1;
    mechanicalCouplingFractionReduction: number | null;
    effectiveActiveLayerCountMin: number;
    effectiveActiveLayerCountShortfall: number | null;
    sourceTensorRetentionFractionMin: 0.9;
    sourceTensorRetentionFractionShortfall: number | null;
    effectiveSourceTensorLayerCountMin: number;
    effectiveSourceTensorLayerCountShortfall: number | null;
    requiredFatigueProvenanceRefCount: 8;
    missingFatigueProvenanceRefCount: number;
    requiredLayerScalingProvenanceRefCount: 9;
    missingLayerScalingProvenanceRefCount: number;
    supportCouplingStatusRequired: "pass";
    supportCouplingStatusSatisfied: boolean;
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
const PER_LAYER_VARIATION_FRACTION_MAX = 0.05;
const LAYER_NONADDITIVITY_FRACTION_MAX = 0.1;
const ACTIVE_AREA_RETENTION_MIN = 0.6;
const SUPPORT_COUPLING_FRACTION_MAX = 0.1;
const ELECTROMAGNETIC_COUPLING_FRACTION_MAX = 0.1;
const MECHANICAL_COUPLING_FRACTION_MAX = 0.1;
const SOURCE_TENSOR_RETENTION_FRACTION_MIN = 0.9;
const THERMAL_CYCLE_DRIFT_FRACTION_MAX = 0.01;
const CREEP_DRIFT_FRACTION_MAX = 0.01;
const DELAMINATION_MARGIN_MIN = 1;
const INTERLAYER_ADHESION_MARGIN_MIN = 1;
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

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

const upperBoundMargin = (limit: number, value: number | null | undefined): number | null =>
  value == null || !Number.isFinite(value) || value <= 0 ? null : round(limit / value);

const shortfallToMinimum = (value: number | null | undefined, minimum: number): number | null =>
  value == null ? null : round(Math.max(0, minimum - value));

const reductionToMaximum = (value: number | null | undefined, maximum: number): number | null =>
  value == null ? null : round(Math.max(0, value - maximum));

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
  const delaminationMargin = safeRatio(
    evidence?.delaminationMargin ?? null,
    DELAMINATION_MARGIN_MIN,
  );
  const interlayerAdhesionMargin = safeRatio(
    evidence?.interlayerAdhesionMargin ?? null,
    INTERLAYER_ADHESION_MARGIN_MIN,
  );
  const scalingMargin = safeRatio(
    evidence?.layerScalingEfficiency ?? null,
    LAYER_SCALING_EFFICIENCY_MIN,
  );
  const perLayerVariationMargin = upperBoundMargin(
    PER_LAYER_VARIATION_FRACTION_MAX,
    evidence?.perLayerVariationFraction,
  );
  const nonadditivityMargin = safeRatio(
    LAYER_NONADDITIVITY_FRACTION_MAX,
    evidence?.nonadditivityFraction ?? null,
  );
  const activeAreaMargin = safeRatio(
    evidence?.activeAreaRetention ?? null,
    ACTIVE_AREA_RETENTION_MIN,
  );
  const supportCouplingMargin = upperBoundMargin(
    SUPPORT_COUPLING_FRACTION_MAX,
    evidence?.supportCouplingFraction,
  );
  const electromagneticCouplingMargin = upperBoundMargin(
    ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
    evidence?.electromagneticCouplingFraction,
  );
  const mechanicalCouplingMargin = upperBoundMargin(
    MECHANICAL_COUPLING_FRACTION_MAX,
    evidence?.mechanicalCouplingFraction,
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
    evidence?.sourceTensorRetentionFraction == null
      ? null
      : round(evidence.sourceTensorRetentionFraction);
  const sourceTensorRetentionMargin = safeRatio(
    sourceTensorRetentionFraction,
    SOURCE_TENSOR_RETENTION_FRACTION_MIN,
  );
  const effectiveSourceTensorLayerCount =
    sourceTensorRetentionFraction == null
      ? null
      : round(sourceTensorRetentionFraction * LAYER_COUNT);
  const fatigueRefs = [
    evidence?.loadSpectrumRef,
    evidence?.cycleProtocolRef,
    evidence?.cryogenicFatigueRef,
    evidence?.fatigueCurveRef,
    evidence?.thermalCycleRef,
    evidence?.creepDriftRef,
    evidence?.delaminationProtocolRef,
    evidence?.interlayerAdhesionRef,
  ];
  const layerScalingRefs = [
    evidence?.layerScalingMapRef,
    evidence?.perLayerVariationMapRef,
    evidence?.nonadditivityModelRef,
    evidence?.activeAreaMapRef,
    evidence?.supportCouplingMapRef,
    evidence?.electromagneticCouplingMapRef,
    evidence?.mechanicalCouplingMapRef,
    evidence?.multiphysicsCouplingRef,
    evidence?.sourceTensorRetentionMapRef,
  ];
  const missingFatigueProvenanceRefCount = fatigueRefs.filter((ref) => ref == null).length;
  const missingLayerScalingProvenanceRefCount = layerScalingRefs.filter((ref) => ref == null).length;
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
    ...(evidence?.loadSpectrumRef == null
      ? ["fatigue_load_spectrum_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.cycleProtocolRef == null
      ? ["fatigue_cycle_protocol_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.cryogenicFatigueRef == null
      ? ["cryogenic_fatigue_ref_missing_for_operating_budget"]
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
    ...(evidence?.delaminationProtocolRef == null
      ? ["delamination_protocol_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.interlayerAdhesionRef == null
      ? ["interlayer_adhesion_ref_missing_for_operating_budget"]
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
    ...(delaminationMargin == null
      ? ["delamination_margin_missing_for_operating_budget"]
      : delaminationMargin < 1
        ? ["delamination_margin_below_one_operating_budget"]
        : []),
    ...(interlayerAdhesionMargin == null
      ? ["interlayer_adhesion_margin_missing_for_operating_budget"]
      : interlayerAdhesionMargin < 1
        ? ["interlayer_adhesion_margin_below_one_operating_budget"]
        : []),
    ...(evidence?.layerScalingEfficiency == null
      ? ["layer_scaling_efficiency_missing_for_operating_budget"]
      : scalingMargin != null && scalingMargin < 1
        ? ["layer_scaling_efficiency_below_0p9_operating_budget"]
        : []),
    ...(evidence?.layerScalingMapRef == null
      ? ["layer_scaling_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.perLayerVariationFraction == null
      ? ["per_layer_variation_fraction_missing_for_operating_budget"]
      : perLayerVariationMargin != null && perLayerVariationMargin < 1
        ? ["per_layer_variation_above_0p05_operating_budget"]
        : []),
    ...(evidence?.perLayerVariationMapRef == null
      ? ["per_layer_variation_map_ref_missing_for_operating_budget"]
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
    ...(evidence?.supportCouplingFraction == null
      ? ["support_coupling_fraction_missing_for_operating_budget"]
      : supportCouplingMargin != null && supportCouplingMargin < 1
        ? ["support_coupling_fraction_above_0p1_operating_budget"]
        : []),
    ...(evidence?.electromagneticCouplingFraction == null
      ? ["electromagnetic_coupling_fraction_missing_for_operating_budget"]
      : electromagneticCouplingMargin != null && electromagneticCouplingMargin < 1
        ? ["electromagnetic_coupling_fraction_above_0p1_operating_budget"]
        : []),
    ...(evidence?.electromagneticCouplingMapRef == null
      ? ["electromagnetic_coupling_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.mechanicalCouplingFraction == null
      ? ["mechanical_coupling_fraction_missing_for_operating_budget"]
      : mechanicalCouplingMargin != null && mechanicalCouplingMargin < 1
        ? ["mechanical_coupling_fraction_above_0p1_operating_budget"]
        : []),
    ...(evidence?.mechanicalCouplingMapRef == null
      ? ["mechanical_coupling_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.multiphysicsCouplingRef == null
      ? ["multiphysics_coupling_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.sourceTensorRetentionMapRef == null
      ? ["source_tensor_retention_map_ref_missing_for_operating_budget"]
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
            "delamination_margin_below_one_operating_budget",
            "interlayer_adhesion_margin_below_one_operating_budget",
            "layer_scaling_efficiency_below_0p9_operating_budget",
            "per_layer_variation_above_0p05_operating_budget",
            "layer_nonadditivity_above_0p1_operating_budget",
            "active_area_retention_below_0p6_operating_budget",
            "effective_active_layer_count_below_operating_budget",
            "support_coupling_fraction_above_0p1_operating_budget",
            "electromagnetic_coupling_fraction_above_0p1_operating_budget",
            "mechanical_coupling_fraction_above_0p1_operating_budget",
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
      perLayerVariationFractionMax: PER_LAYER_VARIATION_FRACTION_MAX,
      layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
      activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
      supportCouplingFractionMax: SUPPORT_COUPLING_FRACTION_MAX,
      electromagneticCouplingFractionMax: ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
      mechanicalCouplingFractionMax: MECHANICAL_COUPLING_FRACTION_MAX,
      sourceTensorRetentionFractionMin: SOURCE_TENSOR_RETENTION_FRACTION_MIN,
      thermalCycleDriftFractionMax: THERMAL_CYCLE_DRIFT_FRACTION_MAX,
      creepDriftFractionMax: CREEP_DRIFT_FRACTION_MAX,
      delaminationMarginMin: DELAMINATION_MARGIN_MIN,
      interlayerAdhesionMarginMin: INTERLAYER_ADHESION_MARGIN_MIN,
      supportCouplingStatusRequired: "pass",
      effectiveActiveLayerCountMin: round(EFFECTIVE_ACTIVE_LAYER_COUNT_MIN),
      effectiveSourceTensorLayerCountMin: round(EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN),
    },
    suppliedFatigueLayerScalingEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      loadSpectrumRef: stringOrNull(evidence?.loadSpectrumRef),
      cycleProtocolRef: stringOrNull(evidence?.cycleProtocolRef),
      cryogenicFatigueRef: stringOrNull(evidence?.cryogenicFatigueRef),
      fatigueCurveRef: stringOrNull(evidence?.fatigueCurveRef),
      thermalCycleRef: stringOrNull(evidence?.thermalCycleRef),
      creepDriftRef: stringOrNull(evidence?.creepDriftRef),
      delaminationProtocolRef: stringOrNull(evidence?.delaminationProtocolRef),
      interlayerAdhesionRef: stringOrNull(evidence?.interlayerAdhesionRef),
      layerScalingMapRef: stringOrNull(evidence?.layerScalingMapRef),
      perLayerVariationMapRef: stringOrNull(evidence?.perLayerVariationMapRef),
      nonadditivityModelRef: stringOrNull(evidence?.nonadditivityModelRef),
      activeAreaMapRef: stringOrNull(evidence?.activeAreaMapRef),
      supportCouplingMapRef: stringOrNull(evidence?.supportCouplingMapRef),
      electromagneticCouplingMapRef: stringOrNull(evidence?.electromagneticCouplingMapRef),
      mechanicalCouplingMapRef: stringOrNull(evidence?.mechanicalCouplingMapRef),
      multiphysicsCouplingRef: stringOrNull(evidence?.multiphysicsCouplingRef),
      sourceTensorRetentionMapRef: stringOrNull(evidence?.sourceTensorRetentionMapRef),
      cycleCountToFailure: finiteOrNull(evidence?.cycleCountToFailure),
      requiredCycleCount: finiteOrNull(evidence?.requiredCycleCount),
      thermalCycleDriftFraction: finiteOrNull(evidence?.thermalCycleDriftFraction),
      creepDriftFraction: finiteOrNull(evidence?.creepDriftFraction),
      delaminationMargin: finiteOrNull(evidence?.delaminationMargin),
      interlayerAdhesionMargin: finiteOrNull(evidence?.interlayerAdhesionMargin),
      layerScalingEfficiency: finiteOrNull(evidence?.layerScalingEfficiency),
      perLayerVariationFraction: finiteOrNull(evidence?.perLayerVariationFraction),
      nonadditivityFraction: finiteOrNull(evidence?.nonadditivityFraction),
      activeAreaRetention: finiteOrNull(evidence?.activeAreaRetention),
      supportCouplingFraction: finiteOrNull(evidence?.supportCouplingFraction),
      electromagneticCouplingFraction: finiteOrNull(evidence?.electromagneticCouplingFraction),
      mechanicalCouplingFraction: finiteOrNull(evidence?.mechanicalCouplingFraction),
      sourceTensorRetentionFraction: finiteOrNull(evidence?.sourceTensorRetentionFraction),
      supportCouplingStatus: evidence?.supportCouplingStatus ?? "missing",
    },
    derivedOperatingBudget: {
      fatigueProvenanceRefsAvailable:
        evidence?.loadSpectrumRef != null &&
        evidence.cycleProtocolRef != null &&
        evidence.cryogenicFatigueRef != null &&
        evidence.fatigueCurveRef != null &&
        evidence.thermalCycleRef != null &&
        evidence.creepDriftRef != null &&
        evidence.delaminationProtocolRef != null &&
        evidence.interlayerAdhesionRef != null,
      layerScalingProvenanceRefsAvailable:
        evidence?.layerScalingMapRef != null &&
        evidence.perLayerVariationMapRef != null &&
        evidence.nonadditivityModelRef != null &&
        evidence.activeAreaMapRef != null &&
        evidence.supportCouplingMapRef != null &&
        evidence.electromagneticCouplingMapRef != null &&
        evidence.mechanicalCouplingMapRef != null &&
        evidence.multiphysicsCouplingRef != null &&
        evidence.sourceTensorRetentionMapRef != null,
      cycleMargin,
      thermalCycleDriftMargin,
      creepDriftMargin,
      delaminationMargin,
      interlayerAdhesionMargin,
      scalingMargin,
      perLayerVariationMargin,
      nonadditivityMargin,
      activeAreaMargin,
      supportCouplingMargin,
      electromagneticCouplingMargin,
      mechanicalCouplingMargin,
      effectiveActiveLayerCount,
      effectiveActiveLayerCountMargin,
      sourceTensorRetentionFraction,
      sourceTensorRetentionMargin,
    },
    requiredCorrections: {
      cycleMarginMin: 1,
      cycleCountRequired: evidence?.requiredCycleCount ?? null,
      cycleCountShortfall:
        evidence?.cycleCountToFailure == null || evidence?.requiredCycleCount == null
          ? null
          : round(Math.max(0, evidence.requiredCycleCount - evidence.cycleCountToFailure)),
      thermalCycleDriftFractionMax: THERMAL_CYCLE_DRIFT_FRACTION_MAX,
      thermalCycleDriftReduction: reductionToMaximum(
        evidence?.thermalCycleDriftFraction,
        THERMAL_CYCLE_DRIFT_FRACTION_MAX,
      ),
      creepDriftFractionMax: CREEP_DRIFT_FRACTION_MAX,
      creepDriftReduction: reductionToMaximum(
        evidence?.creepDriftFraction,
        CREEP_DRIFT_FRACTION_MAX,
      ),
      delaminationMarginMin: DELAMINATION_MARGIN_MIN,
      delaminationMarginShortfall: shortfallToMinimum(
        evidence?.delaminationMargin,
        DELAMINATION_MARGIN_MIN,
      ),
      interlayerAdhesionMarginMin: INTERLAYER_ADHESION_MARGIN_MIN,
      interlayerAdhesionMarginShortfall: shortfallToMinimum(
        evidence?.interlayerAdhesionMargin,
        INTERLAYER_ADHESION_MARGIN_MIN,
      ),
      layerScalingEfficiencyMin: LAYER_SCALING_EFFICIENCY_MIN,
      layerScalingEfficiencyShortfall: shortfallToMinimum(
        evidence?.layerScalingEfficiency,
        LAYER_SCALING_EFFICIENCY_MIN,
      ),
      perLayerVariationFractionMax: PER_LAYER_VARIATION_FRACTION_MAX,
      perLayerVariationReduction: reductionToMaximum(
        evidence?.perLayerVariationFraction,
        PER_LAYER_VARIATION_FRACTION_MAX,
      ),
      layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
      layerNonadditivityReduction: reductionToMaximum(
        evidence?.nonadditivityFraction,
        LAYER_NONADDITIVITY_FRACTION_MAX,
      ),
      activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
      activeAreaRetentionShortfall: shortfallToMinimum(
        evidence?.activeAreaRetention,
        ACTIVE_AREA_RETENTION_MIN,
      ),
      supportCouplingFractionMax: SUPPORT_COUPLING_FRACTION_MAX,
      supportCouplingFractionReduction: reductionToMaximum(
        evidence?.supportCouplingFraction,
        SUPPORT_COUPLING_FRACTION_MAX,
      ),
      electromagneticCouplingFractionMax: ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
      electromagneticCouplingFractionReduction: reductionToMaximum(
        evidence?.electromagneticCouplingFraction,
        ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
      ),
      mechanicalCouplingFractionMax: MECHANICAL_COUPLING_FRACTION_MAX,
      mechanicalCouplingFractionReduction: reductionToMaximum(
        evidence?.mechanicalCouplingFraction,
        MECHANICAL_COUPLING_FRACTION_MAX,
      ),
      effectiveActiveLayerCountMin: round(EFFECTIVE_ACTIVE_LAYER_COUNT_MIN),
      effectiveActiveLayerCountShortfall: shortfallToMinimum(
        effectiveActiveLayerCount,
        EFFECTIVE_ACTIVE_LAYER_COUNT_MIN,
      ),
      sourceTensorRetentionFractionMin: SOURCE_TENSOR_RETENTION_FRACTION_MIN,
      sourceTensorRetentionFractionShortfall: shortfallToMinimum(
        sourceTensorRetentionFraction,
        SOURCE_TENSOR_RETENTION_FRACTION_MIN,
      ),
      effectiveSourceTensorLayerCountMin: round(EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN),
      effectiveSourceTensorLayerCountShortfall: shortfallToMinimum(
        effectiveSourceTensorLayerCount,
        EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN,
      ),
      requiredFatigueProvenanceRefCount: 8,
      missingFatigueProvenanceRefCount,
      requiredLayerScalingProvenanceRefCount: 9,
      missingLayerScalingProvenanceRefCount,
      supportCouplingStatusRequired: "pass",
      supportCouplingStatusSatisfied: evidence?.supportCouplingStatus === "pass",
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
  const requiredCorrections = isRecord(value.requiredCorrections)
    ? value.requiredCorrections
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
    targets.perLayerVariationFractionMax === 0.05 &&
    targets.layerNonadditivityFractionMax === 0.1 &&
    targets.activeAreaRetentionMin === 0.6 &&
    targets.supportCouplingFractionMax === 0.1 &&
    targets.electromagneticCouplingFractionMax === 0.1 &&
    targets.mechanicalCouplingFractionMax === 0.1 &&
    targets.sourceTensorRetentionFractionMin === 0.9 &&
    targets.thermalCycleDriftFractionMax === 0.01 &&
    targets.creepDriftFractionMax === 0.01 &&
    targets.delaminationMarginMin === 1 &&
    targets.interlayerAdhesionMarginMin === 1 &&
    targets.supportCouplingStatusRequired === "pass" &&
    typeof targets.effectiveActiveLayerCountMin === "number" &&
    typeof targets.effectiveSourceTensorLayerCountMin === "number" &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    requiredCorrections != null &&
    requiredCorrections.cycleMarginMin === 1 &&
    isNumberOrNull(requiredCorrections.cycleCountRequired) &&
    isNumberOrNull(requiredCorrections.cycleCountShortfall) &&
    requiredCorrections.thermalCycleDriftFractionMax === 0.01 &&
    isNumberOrNull(requiredCorrections.thermalCycleDriftReduction) &&
    requiredCorrections.creepDriftFractionMax === 0.01 &&
    isNumberOrNull(requiredCorrections.creepDriftReduction) &&
    requiredCorrections.delaminationMarginMin === 1 &&
    isNumberOrNull(requiredCorrections.delaminationMarginShortfall) &&
    requiredCorrections.interlayerAdhesionMarginMin === 1 &&
    isNumberOrNull(requiredCorrections.interlayerAdhesionMarginShortfall) &&
    requiredCorrections.layerScalingEfficiencyMin === 0.9 &&
    isNumberOrNull(requiredCorrections.layerScalingEfficiencyShortfall) &&
    requiredCorrections.perLayerVariationFractionMax === 0.05 &&
    isNumberOrNull(requiredCorrections.perLayerVariationReduction) &&
    requiredCorrections.layerNonadditivityFractionMax === 0.1 &&
    isNumberOrNull(requiredCorrections.layerNonadditivityReduction) &&
    requiredCorrections.activeAreaRetentionMin === 0.6 &&
    isNumberOrNull(requiredCorrections.activeAreaRetentionShortfall) &&
    requiredCorrections.supportCouplingFractionMax === 0.1 &&
    isNumberOrNull(requiredCorrections.supportCouplingFractionReduction) &&
    requiredCorrections.electromagneticCouplingFractionMax === 0.1 &&
    isNumberOrNull(requiredCorrections.electromagneticCouplingFractionReduction) &&
    requiredCorrections.mechanicalCouplingFractionMax === 0.1 &&
    isNumberOrNull(requiredCorrections.mechanicalCouplingFractionReduction) &&
    typeof requiredCorrections.effectiveActiveLayerCountMin === "number" &&
    isNumberOrNull(requiredCorrections.effectiveActiveLayerCountShortfall) &&
    requiredCorrections.sourceTensorRetentionFractionMin === 0.9 &&
    isNumberOrNull(requiredCorrections.sourceTensorRetentionFractionShortfall) &&
    typeof requiredCorrections.effectiveSourceTensorLayerCountMin === "number" &&
    isNumberOrNull(requiredCorrections.effectiveSourceTensorLayerCountShortfall) &&
    requiredCorrections.requiredFatigueProvenanceRefCount === 8 &&
    typeof requiredCorrections.missingFatigueProvenanceRefCount === "number" &&
    requiredCorrections.requiredLayerScalingProvenanceRefCount === 9 &&
    typeof requiredCorrections.missingLayerScalingProvenanceRefCount === "number" &&
    requiredCorrections.supportCouplingStatusRequired === "pass" &&
    typeof requiredCorrections.supportCouplingStatusSatisfied === "boolean" &&
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
