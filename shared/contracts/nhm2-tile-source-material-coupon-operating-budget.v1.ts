import type {
  Nhm2TileSourceMaterialCouponEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_MATERIAL_COUPON_OPERATING_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_material_coupon_operating_budget/v1";

export type Nhm2TileSourceMaterialCouponOperatingBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_MATERIAL_COUPON_OPERATING_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialCouponEvidenceRef: string | null;
  };
  operatingTargets: {
    material: "ultra_high_stress_tin";
    architectureId: "topology_optimized_lattice_tin";
    layerCount: 447;
    supportFraction: 0.26;
    activeAreaLostFraction: 0.08;
    operatingTemperatureK: 4;
    campaignLoadCaseRefRequired: true;
    layerStackCompatibilityRefRequired: true;
    topologyOptimizationRefRequired: true;
    depositionProcessRefRequired: true;
    residualStressUniformityMapRefRequired: true;
    interlayerAdhesionProtocolRefRequired: true;
    supportStressPa: number;
    tensileStressMinPa: number;
    materialSafetyFactor: 2;
    requiredFractureOrYieldStressPa: number;
    couponRequiredCycleCount: number;
    roughnessRmsMaxMeters: 1e-10;
    fabricationToleranceMaxMeters: 5e-10;
    materialResponseFrequencyHz: 15e9;
    materialResponseTemperatureK: 4;
    dielectricResponseRefRequired: true;
    conductivityRefRequired: true;
    mechanicalCouponSampleCountMin: number;
    stackCompatibilityCouponSampleCountMin: number;
    cryogenicCycleSampleCountMin: number;
    materialResponseSweepSampleCountMin: number;
    surfaceMapSampleCountMin: number;
  };
  suppliedMaterialCouponEvidence: {
    evidenceTier: string;
    architectureId: string | null;
    loadCaseRef: string | null;
    layerStackCompatibilityRef: string | null;
    topologyOptimizationRef: string | null;
    depositionProcessRef: string | null;
    residualStressUniformityMapRef: string | null;
    interlayerAdhesionProtocolRef: string | null;
    tensileStressCurveRef: string | null;
    fractureYieldCurveRef: string | null;
    cryogenicStateRef: string | null;
    cryogenicCycleRef: string | null;
    couponFatigueCurveRef: string | null;
    roughnessMapRef: string | null;
    fabricationToleranceMapRef: string | null;
    tensileStressCouponSampleCount: number | null;
    fractureYieldCouponSampleCount: number | null;
    cryogenicCycleSampleCount: number | null;
    couponFatigueCurveSampleCount: number | null;
    dielectricResponseFrequencySampleCount: number | null;
    conductivityTemperatureSampleCount: number | null;
    roughnessMapSampleCount: number | null;
    fabricationToleranceMapSampleCount: number | null;
    stackCompatibilityCouponSampleCount: number | null;
    stackCompatibilityLayerCount: number | null;
    stackCompatibilitySupportFraction: number | null;
    stackCompatibilityActiveAreaLostFraction: number | null;
    material: string | null;
    measuredTensileStressPa: number | null;
    fractureOrYieldStressPa: number | null;
    supportStressPa: number | null;
    couponCycleCountToFailure: number | null;
    couponRequiredCycleCount: number | null;
    cryogenicTemperatureK: number | null;
    dielectricResponseRef: string | null;
    conductivityRef: string | null;
    materialResponseFrequencyHz: number | null;
    dielectricResponseTemperatureK: number | null;
    conductivityTemperatureK: number | null;
    dielectricLossTangent: number | null;
    conductivitySiemensPerMeter: number | null;
    roughnessRmsMeters: number | null;
    fabricationToleranceMeters: number | null;
  };
  derivedOperatingBudget: {
    curveAndMapRefsAvailable: boolean;
    campaignCompatibilityRefsAvailable: boolean;
    architectureCompatibilityRefsAvailable: boolean;
    architectureIdMatches: boolean;
    stackLayerCountMargin: number | null;
    supportFractionMargin: number | null;
    activeAreaLostFractionMargin: number | null;
    tensileStressMargin: number | null;
    fractureOrYieldStressMargin: number | null;
    couponFatigueCycleMargin: number | null;
    cryogenicTemperatureMargin: number | null;
    materialResponseFrequencyMargin: number | null;
    dielectricTemperatureMargin: number | null;
    conductivityTemperatureMargin: number | null;
    materialResponseValuesAvailable: boolean;
    couponSamplingComplete: boolean;
    stackCompatibilityCouponSampleCountMargin: number | null;
    tensileStressCouponSampleCountMargin: number | null;
    fractureYieldCouponSampleCountMargin: number | null;
    cryogenicCycleSampleCountMargin: number | null;
    couponFatigueCurveSampleCountMargin: number | null;
    dielectricResponseFrequencySampleCountMargin: number | null;
    conductivityTemperatureSampleCountMargin: number | null;
    roughnessMapSampleCountMargin: number | null;
    fabricationToleranceMapSampleCountMargin: number | null;
    roughnessRmsMargin: number | null;
    fabricationToleranceMargin: number | null;
  };
  requiredCorrections: {
    materialRequired: "ultra_high_stress_tin";
    architectureIdRequired: "topology_optimized_lattice_tin";
    architectureIdMismatch: boolean;
    layerCountRequired: 447;
    stackCompatibilityLayerCountShortfall: number | null;
    supportFractionRequired: 0.26;
    supportFractionAbsDelta: number | null;
    activeAreaLostFractionRequired: 0.08;
    activeAreaLostFractionAbsDelta: number | null;
    materialMismatch: boolean;
    supportStressPa: number;
    tensileStressMinPa: number;
    tensileStressShortfallPa: number | null;
    materialSafetyFactor: 2;
    requiredFractureOrYieldStressPa: number;
    fractureOrYieldStressShortfallPa: number | null;
    couponRequiredCycleCount: number;
    couponCycleCountShortfall: number | null;
    operatingTemperatureK: 4;
    cryogenicTemperatureReductionK: number | null;
    materialResponseFrequencyHz: 15e9;
    materialResponseFrequencyAbsDeltaHz: number | null;
    materialResponseTemperatureK: 4;
    dielectricTemperatureReductionK: number | null;
    conductivityTemperatureReductionK: number | null;
    roughnessRmsMaxMeters: 1e-10;
    roughnessRmsReductionMeters: number | null;
    fabricationToleranceMaxMeters: 5e-10;
    fabricationToleranceReductionMeters: number | null;
    requiredCurveAndMapRefCount: 7;
    missingCurveAndMapRefCount: number;
    requiredCampaignCompatibilityRefCount: 7;
    missingCampaignCompatibilityRefCount: number;
    stackCompatibilityCouponSampleCountMin: number;
    stackCompatibilityCouponSampleCountShortfall: number | null;
    dielectricResponseRefRequired: true;
    dielectricResponseReceiptComplete: boolean;
    dielectricResponseNumericValueAvailable: boolean;
    conductivityRefRequired: true;
    conductivityReceiptComplete: boolean;
    conductivityNumericValueAvailable: boolean;
    requiredMaterialResponseRefCount: 2;
    missingMaterialResponseRefCount: number;
    materialResponseNumericValuesAvailable: boolean;
    mechanicalCouponSampleCountMin: number;
    cryogenicCycleSampleCountMin: number;
    materialResponseSweepSampleCountMin: number;
    surfaceMapSampleCountMin: number;
    tensileStressCouponSampleCountShortfall: number | null;
    fractureYieldCouponSampleCountShortfall: number | null;
    cryogenicCycleSampleCountShortfall: number | null;
    couponFatigueCurveSampleCountShortfall: number | null;
    dielectricResponseFrequencySampleCountShortfall: number | null;
    conductivityTemperatureSampleCountShortfall: number | null;
    roughnessMapSampleCountShortfall: number | null;
    fabricationToleranceMapSampleCountShortfall: number | null;
  };
  blockers: string[];
  summary: {
    operatingBudgetComputed: boolean;
    materialCouponEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetOnly: true;
    materialCouponEvidenceDoesNotSupplyFullApparatusTensor: true;
    materialResponseRefsDoNotSubstituteForFullTensor: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceMaterialCouponOperatingBudgetInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  materialCouponEvidence?: Nhm2TileSourceMaterialCouponEvidenceV1 | null;
};

const DEFAULT_SELECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const FROZEN_TOPOLOGY_ARCHITECTURE_ID = "topology_optimized_lattice_tin";
const FROZEN_TOPOLOGY_LAYER_COUNT = 447;
const FROZEN_TOPOLOGY_SUPPORT_FRACTION = 0.26;
const FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION = 0.08;
const SUPPORT_STRESS_PA = 5.45707087858e8;
const MATERIAL_SAFETY_FACTOR = 2;
const ROUGHNESS_RMS_MAX_METERS = 1e-10;
const FABRICATION_TOLERANCE_MAX_METERS = 5e-10;
const OPERATING_TEMPERATURE_K = 4;
const MATERIAL_RESPONSE_FREQUENCY_HZ = 15e9;
const COUPON_REQUIRED_CYCLE_COUNT = 1e9;
const MECHANICAL_COUPON_SAMPLE_COUNT_MIN = 5;
const STACK_COMPATIBILITY_COUPON_SAMPLE_COUNT_MIN = 5;
const CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN = 10;
const MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN = 16;
const SURFACE_MAP_SAMPLE_COUNT_MIN = 10000;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isPositiveInteger = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value > 0;

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

const shortfallToMinimum = (value: number | null | undefined, minimum: number): number | null =>
  value == null ? null : round(Math.max(0, minimum - value));

const reductionToMaximum = (value: number | null | undefined, maximum: number): number | null =>
  value == null ? null : round(Math.max(0, value - maximum));

const absDeltaToTarget = (value: number | null | undefined, target: number): number | null =>
  value == null ? null : round(Math.abs(value - target));

export const buildNhm2TileSourceMaterialCouponOperatingBudget = (
  input: BuildNhm2TileSourceMaterialCouponOperatingBudgetInput = {},
): Nhm2TileSourceMaterialCouponOperatingBudgetV1 => {
  const evidence = input.materialCouponEvidence ?? null;
  const supportStressPa = evidence?.supportStressPa ?? SUPPORT_STRESS_PA;
  const requiredFractureOrYieldStressPa = round(supportStressPa * MATERIAL_SAFETY_FACTOR);
  const tensileStressMargin = safeRatio(evidence?.measuredTensileStressPa ?? null, supportStressPa);
  const fractureOrYieldStressMargin = safeRatio(
    evidence?.fractureOrYieldStressPa ?? null,
    requiredFractureOrYieldStressPa,
  );
  const couponRequiredCycleCount =
    evidence?.couponRequiredCycleCount ?? COUPON_REQUIRED_CYCLE_COUNT;
  const couponFatigueCycleMargin = safeRatio(
    evidence?.couponCycleCountToFailure ?? null,
    couponRequiredCycleCount,
  );
  const cryogenicTemperatureMargin = safeRatio(
    OPERATING_TEMPERATURE_K,
    evidence?.cryogenicTemperatureK ?? null,
  );
  const materialResponseFrequencyMargin =
    evidence?.materialResponseFrequencyHz == null || evidence.materialResponseFrequencyHz <= 0
      ? null
      : round(
          Math.min(
            evidence.materialResponseFrequencyHz / MATERIAL_RESPONSE_FREQUENCY_HZ,
            MATERIAL_RESPONSE_FREQUENCY_HZ / evidence.materialResponseFrequencyHz,
          ),
        );
  const dielectricTemperatureMargin = safeRatio(
    OPERATING_TEMPERATURE_K,
    evidence?.dielectricResponseTemperatureK ?? null,
  );
  const conductivityTemperatureMargin = safeRatio(
    OPERATING_TEMPERATURE_K,
    evidence?.conductivityTemperatureK ?? null,
  );
  const dielectricResponseNumericValueAvailable =
    evidence?.dielectricLossTangent != null &&
    Number.isFinite(evidence.dielectricLossTangent) &&
    evidence.dielectricLossTangent >= 0;
  const conductivityNumericValueAvailable =
    evidence?.conductivitySiemensPerMeter != null &&
    Number.isFinite(evidence.conductivitySiemensPerMeter) &&
    evidence.conductivitySiemensPerMeter > 0;
  const dielectricResponseReceiptComplete =
    evidence?.dielectricResponseRef != null &&
    materialResponseFrequencyMargin != null &&
    materialResponseFrequencyMargin >= 1 &&
    dielectricTemperatureMargin != null &&
    dielectricTemperatureMargin >= 1 &&
    dielectricResponseNumericValueAvailable;
  const conductivityReceiptComplete =
    evidence?.conductivityRef != null &&
    materialResponseFrequencyMargin != null &&
    materialResponseFrequencyMargin >= 1 &&
    conductivityTemperatureMargin != null &&
    conductivityTemperatureMargin >= 1 &&
    conductivityNumericValueAvailable;
  const materialResponseValuesAvailable =
    dielectricResponseNumericValueAvailable && conductivityNumericValueAvailable;
  const tensileStressCouponSampleCountMargin = safeRatio(
    evidence?.tensileStressCouponSampleCount ?? null,
    MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
  );
  const fractureYieldCouponSampleCountMargin = safeRatio(
    evidence?.fractureYieldCouponSampleCount ?? null,
    MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
  );
  const cryogenicCycleSampleCountMargin = safeRatio(
    evidence?.cryogenicCycleSampleCount ?? null,
    CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN,
  );
  const couponFatigueCurveSampleCountMargin = safeRatio(
    evidence?.couponFatigueCurveSampleCount ?? null,
    MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
  );
  const dielectricResponseFrequencySampleCountMargin = safeRatio(
    evidence?.dielectricResponseFrequencySampleCount ?? null,
    MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
  );
  const conductivityTemperatureSampleCountMargin = safeRatio(
    evidence?.conductivityTemperatureSampleCount ?? null,
    MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
  );
  const roughnessMapSampleCountMargin = safeRatio(
    evidence?.roughnessMapSampleCount ?? null,
    SURFACE_MAP_SAMPLE_COUNT_MIN,
  );
  const fabricationToleranceMapSampleCountMargin = safeRatio(
    evidence?.fabricationToleranceMapSampleCount ?? null,
    SURFACE_MAP_SAMPLE_COUNT_MIN,
  );
  const couponSamplingComplete =
    tensileStressCouponSampleCountMargin != null &&
    tensileStressCouponSampleCountMargin >= 1 &&
    fractureYieldCouponSampleCountMargin != null &&
    fractureYieldCouponSampleCountMargin >= 1 &&
    cryogenicCycleSampleCountMargin != null &&
    cryogenicCycleSampleCountMargin >= 1 &&
    couponFatigueCurveSampleCountMargin != null &&
    couponFatigueCurveSampleCountMargin >= 1 &&
    dielectricResponseFrequencySampleCountMargin != null &&
    dielectricResponseFrequencySampleCountMargin >= 1 &&
    conductivityTemperatureSampleCountMargin != null &&
    conductivityTemperatureSampleCountMargin >= 1 &&
    roughnessMapSampleCountMargin != null &&
    roughnessMapSampleCountMargin >= 1 &&
    fabricationToleranceMapSampleCountMargin != null &&
    fabricationToleranceMapSampleCountMargin >= 1;
  const roughnessRmsMargin = safeRatio(
    ROUGHNESS_RMS_MAX_METERS,
    evidence?.roughnessRmsMeters ?? null,
  );
  const fabricationToleranceMargin = safeRatio(
    FABRICATION_TOLERANCE_MAX_METERS,
    evidence?.fabricationToleranceMeters ?? null,
  );
  const stackCompatibilityCouponSampleCountMargin = safeRatio(
    evidence?.stackCompatibilityCouponSampleCount ?? null,
    STACK_COMPATIBILITY_COUPON_SAMPLE_COUNT_MIN,
  );
  const stackLayerCountMargin =
    evidence?.stackCompatibilityLayerCount == null ||
    evidence.stackCompatibilityLayerCount <= 0
      ? null
      : round(
          Math.min(
            evidence.stackCompatibilityLayerCount / FROZEN_TOPOLOGY_LAYER_COUNT,
            FROZEN_TOPOLOGY_LAYER_COUNT / evidence.stackCompatibilityLayerCount,
          ),
        );
  const supportFractionMargin =
    evidence?.stackCompatibilitySupportFraction == null ||
    evidence.stackCompatibilitySupportFraction <= 0
      ? null
      : round(
          Math.min(
            evidence.stackCompatibilitySupportFraction / FROZEN_TOPOLOGY_SUPPORT_FRACTION,
            FROZEN_TOPOLOGY_SUPPORT_FRACTION / evidence.stackCompatibilitySupportFraction,
          ),
        );
  const activeAreaLostFractionMargin =
    evidence?.stackCompatibilityActiveAreaLostFraction == null ||
    evidence.stackCompatibilityActiveAreaLostFraction < 0
      ? null
      : evidence.stackCompatibilityActiveAreaLostFraction ===
          FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION
        ? 1
        : round(
            Math.min(
              evidence.stackCompatibilityActiveAreaLostFraction /
                FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION,
              FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION /
                evidence.stackCompatibilityActiveAreaLostFraction,
            ),
          );
  const curveAndMapRefs = [
    evidence?.tensileStressCurveRef,
    evidence?.fractureYieldCurveRef,
    evidence?.cryogenicStateRef,
    evidence?.cryogenicCycleRef,
    evidence?.couponFatigueCurveRef,
    evidence?.roughnessMapRef,
    evidence?.fabricationToleranceMapRef,
  ];
  const campaignCompatibilityRefs = [
    evidence?.architectureId === FROZEN_TOPOLOGY_ARCHITECTURE_ID
      ? evidence.architectureId
      : null,
    evidence?.loadCaseRef,
    evidence?.layerStackCompatibilityRef,
    evidence?.topologyOptimizationRef,
    evidence?.depositionProcessRef,
    evidence?.residualStressUniformityMapRef,
    evidence?.interlayerAdhesionProtocolRef,
  ];
  const materialResponseRefs = [
    evidence?.dielectricResponseRef,
    evidence?.conductivityRef,
  ];
  const missingCurveAndMapRefCount = curveAndMapRefs.filter((ref) => ref == null).length;
  const missingCampaignCompatibilityRefCount = campaignCompatibilityRefs.filter(
    (ref) => ref == null,
  ).length;
  const missingMaterialResponseRefCount = materialResponseRefs.filter((ref) => ref == null).length;
  const blockers = [
    ...(evidence == null || evidence.evidenceTier === "missing"
      ? ["material_coupon_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence?.evidenceTier !== "measured" &&
    evidence?.evidenceTier !== "validated_simulation"
      ? ["material_coupon_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence?.material !== "ultra_high_stress_tin"
      ? ["material_coupon_candidate_material_mismatch_for_operating_budget"]
      : []),
    ...(evidence?.architectureId == null
      ? ["candidate_stack_architecture_id_missing_for_operating_budget"]
      : evidence.architectureId !== FROZEN_TOPOLOGY_ARCHITECTURE_ID
        ? ["candidate_stack_architecture_id_mismatch_for_operating_budget"]
        : []),
    ...(evidence?.loadCaseRef == null
      ? ["candidate_stack_load_case_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.layerStackCompatibilityRef == null
      ? ["candidate_stack_layer_compatibility_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.topologyOptimizationRef == null
      ? ["candidate_stack_topology_optimization_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.depositionProcessRef == null
      ? ["candidate_stack_deposition_process_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.residualStressUniformityMapRef == null
      ? ["candidate_stack_residual_stress_uniformity_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.interlayerAdhesionProtocolRef == null
      ? ["candidate_stack_interlayer_adhesion_protocol_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.stackCompatibilityCouponSampleCount == null
      ? ["stack_compatibility_coupon_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.stackCompatibilityCouponSampleCount)
        ? ["stack_compatibility_coupon_sample_count_invalid_for_operating_budget"]
        : stackCompatibilityCouponSampleCountMargin == null ||
            stackCompatibilityCouponSampleCountMargin < 1
          ? ["stack_compatibility_coupon_sample_count_below_5_for_operating_budget"]
          : []),
    ...(evidence?.stackCompatibilityLayerCount == null
      ? ["stack_compatibility_layer_count_missing_for_operating_budget"]
      : evidence.stackCompatibilityLayerCount !== FROZEN_TOPOLOGY_LAYER_COUNT
        ? ["stack_compatibility_layer_count_not_447_for_operating_budget"]
        : []),
    ...(supportFractionMargin == null
      ? ["stack_compatibility_support_fraction_missing_for_operating_budget"]
      : supportFractionMargin < 1
        ? ["stack_compatibility_support_fraction_not_topology_0p26_for_operating_budget"]
        : []),
    ...(activeAreaLostFractionMargin == null
      ? ["stack_compatibility_active_area_lost_fraction_missing_for_operating_budget"]
      : activeAreaLostFractionMargin < 1
        ? ["stack_compatibility_active_area_lost_fraction_not_topology_0p08_for_operating_budget"]
        : []),
    ...(evidence?.tensileStressCurveRef == null
      ? ["tensile_stress_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.fractureYieldCurveRef == null
      ? ["fracture_yield_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.cryogenicStateRef == null
      ? ["cryogenic_state_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.cryogenicCycleRef == null
      ? ["cryogenic_cycle_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.couponFatigueCurveRef == null
      ? ["coupon_fatigue_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.roughnessMapRef == null
      ? ["coupon_roughness_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.fabricationToleranceMapRef == null
      ? ["fabrication_tolerance_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.tensileStressCouponSampleCount == null
      ? ["tensile_stress_coupon_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.tensileStressCouponSampleCount)
        ? ["tensile_stress_coupon_sample_count_invalid_for_operating_budget"]
        : tensileStressCouponSampleCountMargin == null ||
            tensileStressCouponSampleCountMargin < 1
          ? ["tensile_stress_coupon_sample_count_below_5_for_operating_budget"]
          : []),
    ...(evidence?.fractureYieldCouponSampleCount == null
      ? ["fracture_yield_coupon_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.fractureYieldCouponSampleCount)
        ? ["fracture_yield_coupon_sample_count_invalid_for_operating_budget"]
        : fractureYieldCouponSampleCountMargin == null ||
            fractureYieldCouponSampleCountMargin < 1
          ? ["fracture_yield_coupon_sample_count_below_5_for_operating_budget"]
          : []),
    ...(evidence?.cryogenicCycleSampleCount == null
      ? ["cryogenic_cycle_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.cryogenicCycleSampleCount)
        ? ["cryogenic_cycle_sample_count_invalid_for_operating_budget"]
        : cryogenicCycleSampleCountMargin == null || cryogenicCycleSampleCountMargin < 1
          ? ["cryogenic_cycle_sample_count_below_10_for_operating_budget"]
          : []),
    ...(evidence?.couponFatigueCurveSampleCount == null
      ? ["coupon_fatigue_curve_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.couponFatigueCurveSampleCount)
        ? ["coupon_fatigue_curve_sample_count_invalid_for_operating_budget"]
        : couponFatigueCurveSampleCountMargin == null ||
            couponFatigueCurveSampleCountMargin < 1
          ? ["coupon_fatigue_curve_sample_count_below_5_for_operating_budget"]
          : []),
    ...(tensileStressMargin == null
      ? ["measured_tensile_stress_missing_for_operating_budget"]
      : tensileStressMargin < 1
        ? ["measured_tensile_stress_below_support_stress_operating_budget"]
        : []),
    ...(fractureOrYieldStressMargin == null
      ? ["fracture_or_yield_stress_missing_for_operating_budget"]
      : fractureOrYieldStressMargin < 1
        ? ["fracture_or_yield_margin_below_2x_support_stress_operating_budget"]
        : []),
    ...(couponFatigueCycleMargin == null
      ? ["coupon_fatigue_cycle_margin_missing_for_operating_budget"]
      : couponFatigueCycleMargin < 1
        ? ["coupon_fatigue_cycle_margin_below_required_campaign_cycles_operating_budget"]
        : []),
    ...(cryogenicTemperatureMargin == null
      ? ["cryogenic_temperature_missing_for_operating_budget"]
      : cryogenicTemperatureMargin < 1
        ? ["cryogenic_temperature_above_4k_operating_budget"]
        : []),
    ...(evidence?.dielectricResponseRef == null
      ? ["dielectric_response_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.dielectricResponseFrequencySampleCount == null
      ? ["dielectric_response_frequency_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.dielectricResponseFrequencySampleCount)
        ? ["dielectric_response_frequency_sample_count_invalid_for_operating_budget"]
        : dielectricResponseFrequencySampleCountMargin == null ||
            dielectricResponseFrequencySampleCountMargin < 1
          ? ["dielectric_response_frequency_sample_count_below_16_for_operating_budget"]
          : []),
    ...(evidence?.conductivityRef == null
      ? ["conductivity_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.conductivityTemperatureSampleCount == null
      ? ["conductivity_temperature_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.conductivityTemperatureSampleCount)
        ? ["conductivity_temperature_sample_count_invalid_for_operating_budget"]
        : conductivityTemperatureSampleCountMargin == null ||
            conductivityTemperatureSampleCountMargin < 1
          ? ["conductivity_temperature_sample_count_below_16_for_operating_budget"]
          : []),
    ...(materialResponseFrequencyMargin == null
      ? ["material_response_frequency_missing_for_operating_budget"]
      : materialResponseFrequencyMargin < 1
        ? ["material_response_frequency_not_15ghz_for_operating_budget"]
        : []),
    ...(dielectricTemperatureMargin == null
      ? ["dielectric_response_temperature_missing_for_operating_budget"]
      : dielectricTemperatureMargin < 1
        ? ["dielectric_response_temperature_above_4k_for_operating_budget"]
        : []),
    ...(conductivityTemperatureMargin == null
      ? ["conductivity_temperature_missing_for_operating_budget"]
      : conductivityTemperatureMargin < 1
        ? ["conductivity_temperature_above_4k_for_operating_budget"]
        : []),
    ...(!materialResponseValuesAvailable
      ? ["material_response_numeric_values_missing_for_operating_budget"]
      : []),
    ...(roughnessRmsMargin == null
      ? ["coupon_roughness_rms_missing_for_operating_budget"]
      : roughnessRmsMargin < 1
        ? ["coupon_roughness_rms_above_0p1nm_operating_budget"]
        : []),
    ...(evidence?.roughnessMapSampleCount == null
      ? ["coupon_roughness_map_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.roughnessMapSampleCount)
        ? ["coupon_roughness_map_sample_count_invalid_for_operating_budget"]
        : roughnessMapSampleCountMargin == null || roughnessMapSampleCountMargin < 1
          ? ["coupon_roughness_map_sample_count_below_10000_for_operating_budget"]
          : []),
    ...(fabricationToleranceMargin == null
      ? ["fabrication_tolerance_missing_for_operating_budget"]
      : fabricationToleranceMargin < 1
        ? ["fabrication_tolerance_above_0p5nm_operating_budget"]
        : []),
    ...(evidence?.fabricationToleranceMapSampleCount == null
      ? ["fabrication_tolerance_map_sample_count_missing_for_operating_budget"]
      : !isPositiveInteger(evidence.fabricationToleranceMapSampleCount)
        ? ["fabrication_tolerance_map_sample_count_invalid_for_operating_budget"]
        : fabricationToleranceMapSampleCountMargin == null ||
            fabricationToleranceMapSampleCountMargin < 1
          ? ["fabrication_tolerance_map_sample_count_below_10000_for_operating_budget"]
          : []),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "material_coupon_candidate_material_mismatch_for_operating_budget",
            "candidate_stack_architecture_id_mismatch_for_operating_budget",
            "stack_compatibility_coupon_sample_count_invalid_for_operating_budget",
            "stack_compatibility_coupon_sample_count_below_5_for_operating_budget",
            "stack_compatibility_layer_count_not_447_for_operating_budget",
            "stack_compatibility_support_fraction_not_topology_0p26_for_operating_budget",
            "stack_compatibility_active_area_lost_fraction_not_topology_0p08_for_operating_budget",
            "tensile_stress_coupon_sample_count_invalid_for_operating_budget",
            "tensile_stress_coupon_sample_count_below_5_for_operating_budget",
            "fracture_yield_coupon_sample_count_invalid_for_operating_budget",
            "fracture_yield_coupon_sample_count_below_5_for_operating_budget",
            "cryogenic_cycle_sample_count_invalid_for_operating_budget",
            "cryogenic_cycle_sample_count_below_10_for_operating_budget",
            "coupon_fatigue_curve_sample_count_invalid_for_operating_budget",
            "coupon_fatigue_curve_sample_count_below_5_for_operating_budget",
            "measured_tensile_stress_below_support_stress_operating_budget",
            "fracture_or_yield_margin_below_2x_support_stress_operating_budget",
            "coupon_fatigue_cycle_margin_below_required_campaign_cycles_operating_budget",
            "cryogenic_temperature_above_4k_operating_budget",
            "material_response_frequency_not_15ghz_for_operating_budget",
            "dielectric_response_frequency_sample_count_invalid_for_operating_budget",
            "dielectric_response_frequency_sample_count_below_16_for_operating_budget",
            "dielectric_response_temperature_above_4k_for_operating_budget",
            "conductivity_temperature_sample_count_invalid_for_operating_budget",
            "conductivity_temperature_sample_count_below_16_for_operating_budget",
            "conductivity_temperature_above_4k_for_operating_budget",
            "material_response_numeric_values_missing_for_operating_budget",
            "coupon_roughness_rms_above_0p1nm_operating_budget",
            "coupon_roughness_map_sample_count_invalid_for_operating_budget",
            "coupon_roughness_map_sample_count_below_10000_for_operating_budget",
            "fabrication_tolerance_above_0p5nm_operating_budget",
            "fabrication_tolerance_map_sample_count_invalid_for_operating_budget",
            "fabrication_tolerance_map_sample_count_below_10000_for_operating_budget",
          ].includes(blocker),
        )
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_MATERIAL_COUPON_OPERATING_BUDGET_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_SELECTED_PROFILE_ID,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      materialCouponEvidenceRef: evidence?.evidenceRef ?? null,
    },
    operatingTargets: {
      material: "ultra_high_stress_tin",
      architectureId: FROZEN_TOPOLOGY_ARCHITECTURE_ID,
      layerCount: FROZEN_TOPOLOGY_LAYER_COUNT,
      supportFraction: FROZEN_TOPOLOGY_SUPPORT_FRACTION,
      activeAreaLostFraction: FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION,
      operatingTemperatureK: OPERATING_TEMPERATURE_K,
      campaignLoadCaseRefRequired: true,
      layerStackCompatibilityRefRequired: true,
      topologyOptimizationRefRequired: true,
      depositionProcessRefRequired: true,
      residualStressUniformityMapRefRequired: true,
      interlayerAdhesionProtocolRefRequired: true,
      supportStressPa,
      tensileStressMinPa: supportStressPa,
      materialSafetyFactor: 2,
      requiredFractureOrYieldStressPa,
      couponRequiredCycleCount,
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      fabricationToleranceMaxMeters: FABRICATION_TOLERANCE_MAX_METERS,
      materialResponseFrequencyHz: MATERIAL_RESPONSE_FREQUENCY_HZ,
      materialResponseTemperatureK: OPERATING_TEMPERATURE_K,
      dielectricResponseRefRequired: true,
      conductivityRefRequired: true,
      mechanicalCouponSampleCountMin: MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
      stackCompatibilityCouponSampleCountMin:
        STACK_COMPATIBILITY_COUPON_SAMPLE_COUNT_MIN,
      cryogenicCycleSampleCountMin: CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN,
      materialResponseSweepSampleCountMin: MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
      surfaceMapSampleCountMin: SURFACE_MAP_SAMPLE_COUNT_MIN,
    },
    suppliedMaterialCouponEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      architectureId: stringOrNull(evidence?.architectureId),
      loadCaseRef: stringOrNull(evidence?.loadCaseRef),
      layerStackCompatibilityRef: stringOrNull(evidence?.layerStackCompatibilityRef),
      topologyOptimizationRef: stringOrNull(evidence?.topologyOptimizationRef),
      depositionProcessRef: stringOrNull(evidence?.depositionProcessRef),
      residualStressUniformityMapRef: stringOrNull(
        evidence?.residualStressUniformityMapRef,
      ),
      interlayerAdhesionProtocolRef: stringOrNull(
        evidence?.interlayerAdhesionProtocolRef,
      ),
      tensileStressCurveRef: stringOrNull(evidence?.tensileStressCurveRef),
      fractureYieldCurveRef: stringOrNull(evidence?.fractureYieldCurveRef),
      cryogenicStateRef: stringOrNull(evidence?.cryogenicStateRef),
      cryogenicCycleRef: stringOrNull(evidence?.cryogenicCycleRef),
      couponFatigueCurveRef: stringOrNull(evidence?.couponFatigueCurveRef),
      roughnessMapRef: stringOrNull(evidence?.roughnessMapRef),
      fabricationToleranceMapRef: stringOrNull(evidence?.fabricationToleranceMapRef),
      tensileStressCouponSampleCount: finiteOrNull(evidence?.tensileStressCouponSampleCount),
      fractureYieldCouponSampleCount: finiteOrNull(evidence?.fractureYieldCouponSampleCount),
      cryogenicCycleSampleCount: finiteOrNull(evidence?.cryogenicCycleSampleCount),
      couponFatigueCurveSampleCount: finiteOrNull(evidence?.couponFatigueCurveSampleCount),
      dielectricResponseFrequencySampleCount: finiteOrNull(
        evidence?.dielectricResponseFrequencySampleCount,
      ),
      conductivityTemperatureSampleCount: finiteOrNull(
        evidence?.conductivityTemperatureSampleCount,
      ),
      roughnessMapSampleCount: finiteOrNull(evidence?.roughnessMapSampleCount),
      fabricationToleranceMapSampleCount: finiteOrNull(
        evidence?.fabricationToleranceMapSampleCount,
      ),
      stackCompatibilityCouponSampleCount: finiteOrNull(
        evidence?.stackCompatibilityCouponSampleCount,
      ),
      stackCompatibilityLayerCount: finiteOrNull(evidence?.stackCompatibilityLayerCount),
      stackCompatibilitySupportFraction: finiteOrNull(
        evidence?.stackCompatibilitySupportFraction,
      ),
      stackCompatibilityActiveAreaLostFraction: finiteOrNull(
        evidence?.stackCompatibilityActiveAreaLostFraction,
      ),
      material: stringOrNull(evidence?.material),
      measuredTensileStressPa: finiteOrNull(evidence?.measuredTensileStressPa),
      fractureOrYieldStressPa: finiteOrNull(evidence?.fractureOrYieldStressPa),
      supportStressPa: finiteOrNull(evidence?.supportStressPa),
      couponCycleCountToFailure: finiteOrNull(evidence?.couponCycleCountToFailure),
      couponRequiredCycleCount: finiteOrNull(evidence?.couponRequiredCycleCount),
      cryogenicTemperatureK: finiteOrNull(evidence?.cryogenicTemperatureK),
      dielectricResponseRef: stringOrNull(evidence?.dielectricResponseRef),
      conductivityRef: stringOrNull(evidence?.conductivityRef),
      materialResponseFrequencyHz: finiteOrNull(evidence?.materialResponseFrequencyHz),
      dielectricResponseTemperatureK: finiteOrNull(evidence?.dielectricResponseTemperatureK),
      conductivityTemperatureK: finiteOrNull(evidence?.conductivityTemperatureK),
      dielectricLossTangent: finiteOrNull(evidence?.dielectricLossTangent),
      conductivitySiemensPerMeter: finiteOrNull(evidence?.conductivitySiemensPerMeter),
      roughnessRmsMeters: finiteOrNull(evidence?.roughnessRmsMeters),
      fabricationToleranceMeters: finiteOrNull(evidence?.fabricationToleranceMeters),
    },
    derivedOperatingBudget: {
      curveAndMapRefsAvailable:
        evidence?.tensileStressCurveRef != null &&
        evidence.fractureYieldCurveRef != null &&
        evidence.cryogenicStateRef != null &&
        evidence.cryogenicCycleRef != null &&
        evidence.couponFatigueCurveRef != null &&
        evidence.roughnessMapRef != null &&
        evidence.fabricationToleranceMapRef != null,
      campaignCompatibilityRefsAvailable:
        evidence?.architectureId === FROZEN_TOPOLOGY_ARCHITECTURE_ID &&
        evidence.loadCaseRef != null &&
        evidence.layerStackCompatibilityRef != null &&
        evidence.topologyOptimizationRef != null &&
        evidence.depositionProcessRef != null &&
        evidence.residualStressUniformityMapRef != null &&
        evidence.interlayerAdhesionProtocolRef != null,
      architectureCompatibilityRefsAvailable:
        evidence?.topologyOptimizationRef != null &&
        evidence.depositionProcessRef != null &&
        evidence.residualStressUniformityMapRef != null &&
        evidence.interlayerAdhesionProtocolRef != null,
      architectureIdMatches:
        evidence?.architectureId === FROZEN_TOPOLOGY_ARCHITECTURE_ID,
      stackLayerCountMargin,
      supportFractionMargin,
      activeAreaLostFractionMargin,
      tensileStressMargin,
      fractureOrYieldStressMargin,
      couponFatigueCycleMargin,
      cryogenicTemperatureMargin,
      materialResponseFrequencyMargin,
      dielectricTemperatureMargin,
      conductivityTemperatureMargin,
      materialResponseValuesAvailable,
      couponSamplingComplete,
      stackCompatibilityCouponSampleCountMargin,
      tensileStressCouponSampleCountMargin,
      fractureYieldCouponSampleCountMargin,
      cryogenicCycleSampleCountMargin,
      couponFatigueCurveSampleCountMargin,
      dielectricResponseFrequencySampleCountMargin,
      conductivityTemperatureSampleCountMargin,
      roughnessMapSampleCountMargin,
      fabricationToleranceMapSampleCountMargin,
      roughnessRmsMargin,
      fabricationToleranceMargin,
    },
    requiredCorrections: {
      materialRequired: "ultra_high_stress_tin",
      architectureIdRequired: FROZEN_TOPOLOGY_ARCHITECTURE_ID,
      architectureIdMismatch:
        evidence?.architectureId !== FROZEN_TOPOLOGY_ARCHITECTURE_ID,
      layerCountRequired: FROZEN_TOPOLOGY_LAYER_COUNT,
      stackCompatibilityLayerCountShortfall:
        evidence?.stackCompatibilityLayerCount == null
          ? null
          : round(
              Math.abs(
                FROZEN_TOPOLOGY_LAYER_COUNT - evidence.stackCompatibilityLayerCount,
              ),
            ),
      supportFractionRequired: FROZEN_TOPOLOGY_SUPPORT_FRACTION,
      supportFractionAbsDelta:
        evidence?.stackCompatibilitySupportFraction == null
          ? null
          : round(
              Math.abs(
                FROZEN_TOPOLOGY_SUPPORT_FRACTION -
                  evidence.stackCompatibilitySupportFraction,
              ),
            ),
      activeAreaLostFractionRequired: FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION,
      activeAreaLostFractionAbsDelta:
        evidence?.stackCompatibilityActiveAreaLostFraction == null
          ? null
          : round(
              Math.abs(
                FROZEN_TOPOLOGY_ACTIVE_AREA_LOST_FRACTION -
                  evidence.stackCompatibilityActiveAreaLostFraction,
              ),
            ),
      materialMismatch: evidence?.material !== "ultra_high_stress_tin",
      supportStressPa,
      tensileStressMinPa: supportStressPa,
      tensileStressShortfallPa: shortfallToMinimum(evidence?.measuredTensileStressPa, supportStressPa),
      materialSafetyFactor: 2,
      requiredFractureOrYieldStressPa,
      fractureOrYieldStressShortfallPa: shortfallToMinimum(
        evidence?.fractureOrYieldStressPa,
        requiredFractureOrYieldStressPa,
      ),
      couponRequiredCycleCount,
      couponCycleCountShortfall: shortfallToMinimum(
        evidence?.couponCycleCountToFailure,
        couponRequiredCycleCount,
      ),
      operatingTemperatureK: OPERATING_TEMPERATURE_K,
      cryogenicTemperatureReductionK: reductionToMaximum(
        evidence?.cryogenicTemperatureK,
        OPERATING_TEMPERATURE_K,
      ),
      materialResponseFrequencyHz: MATERIAL_RESPONSE_FREQUENCY_HZ,
      materialResponseFrequencyAbsDeltaHz: absDeltaToTarget(
        evidence?.materialResponseFrequencyHz,
        MATERIAL_RESPONSE_FREQUENCY_HZ,
      ),
      materialResponseTemperatureK: OPERATING_TEMPERATURE_K,
      dielectricTemperatureReductionK: reductionToMaximum(
        evidence?.dielectricResponseTemperatureK,
        OPERATING_TEMPERATURE_K,
      ),
      conductivityTemperatureReductionK: reductionToMaximum(
        evidence?.conductivityTemperatureK,
        OPERATING_TEMPERATURE_K,
      ),
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      roughnessRmsReductionMeters: reductionToMaximum(
        evidence?.roughnessRmsMeters,
        ROUGHNESS_RMS_MAX_METERS,
      ),
      fabricationToleranceMaxMeters: FABRICATION_TOLERANCE_MAX_METERS,
      fabricationToleranceReductionMeters: reductionToMaximum(
        evidence?.fabricationToleranceMeters,
        FABRICATION_TOLERANCE_MAX_METERS,
      ),
      requiredCurveAndMapRefCount: 7,
      missingCurveAndMapRefCount,
      requiredCampaignCompatibilityRefCount: 7,
      missingCampaignCompatibilityRefCount,
      stackCompatibilityCouponSampleCountMin:
        STACK_COMPATIBILITY_COUPON_SAMPLE_COUNT_MIN,
      stackCompatibilityCouponSampleCountShortfall: shortfallToMinimum(
        evidence?.stackCompatibilityCouponSampleCount,
        STACK_COMPATIBILITY_COUPON_SAMPLE_COUNT_MIN,
      ),
      dielectricResponseRefRequired: true,
      dielectricResponseReceiptComplete,
      dielectricResponseNumericValueAvailable,
      conductivityRefRequired: true,
      conductivityReceiptComplete,
      conductivityNumericValueAvailable,
      requiredMaterialResponseRefCount: 2,
      missingMaterialResponseRefCount,
      materialResponseNumericValuesAvailable: materialResponseValuesAvailable,
      mechanicalCouponSampleCountMin: MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
      cryogenicCycleSampleCountMin: CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN,
      materialResponseSweepSampleCountMin: MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
      surfaceMapSampleCountMin: SURFACE_MAP_SAMPLE_COUNT_MIN,
      tensileStressCouponSampleCountShortfall: shortfallToMinimum(
        evidence?.tensileStressCouponSampleCount,
        MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
      ),
      fractureYieldCouponSampleCountShortfall: shortfallToMinimum(
        evidence?.fractureYieldCouponSampleCount,
        MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
      ),
      cryogenicCycleSampleCountShortfall: shortfallToMinimum(
        evidence?.cryogenicCycleSampleCount,
        CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN,
      ),
      couponFatigueCurveSampleCountShortfall: shortfallToMinimum(
        evidence?.couponFatigueCurveSampleCount,
        MECHANICAL_COUPON_SAMPLE_COUNT_MIN,
      ),
      dielectricResponseFrequencySampleCountShortfall: shortfallToMinimum(
        evidence?.dielectricResponseFrequencySampleCount,
        MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
      ),
      conductivityTemperatureSampleCountShortfall: shortfallToMinimum(
        evidence?.conductivityTemperatureSampleCount,
        MATERIAL_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
      ),
      roughnessMapSampleCountShortfall: shortfallToMinimum(
        evidence?.roughnessMapSampleCount,
        SURFACE_MAP_SAMPLE_COUNT_MIN,
      ),
      fabricationToleranceMapSampleCountShortfall: shortfallToMinimum(
        evidence?.fabricationToleranceMapSampleCount,
        SURFACE_MAP_SAMPLE_COUNT_MIN,
      ),
    },
    blockers,
    summary: {
      operatingBudgetComputed: true,
      materialCouponEvidenceReady: blockers.length === 0,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetOnly: true,
      materialCouponEvidenceDoesNotSupplyFullApparatusTensor: true,
      materialResponseRefsDoNotSubstituteForFullTensor: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceMaterialCouponOperatingBudget = (
  value: unknown,
): value is Nhm2TileSourceMaterialCouponOperatingBudgetV1 => {
  if (!isRecord(value)) return false;
  const targets = isRecord(value.operatingTargets) ? value.operatingTargets : null;
  const supplied = isRecord(value.suppliedMaterialCouponEvidence)
    ? value.suppliedMaterialCouponEvidence
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
      NHM2_TILE_SOURCE_MATERIAL_COUPON_OPERATING_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    targets != null &&
    targets.material === "ultra_high_stress_tin" &&
    targets.architectureId === "topology_optimized_lattice_tin" &&
    targets.layerCount === 447 &&
    targets.supportFraction === 0.26 &&
    targets.activeAreaLostFraction === 0.08 &&
    targets.operatingTemperatureK === 4 &&
    targets.campaignLoadCaseRefRequired === true &&
    targets.layerStackCompatibilityRefRequired === true &&
    targets.topologyOptimizationRefRequired === true &&
    targets.depositionProcessRefRequired === true &&
    targets.residualStressUniformityMapRefRequired === true &&
    targets.interlayerAdhesionProtocolRefRequired === true &&
    typeof targets.supportStressPa === "number" &&
    typeof targets.tensileStressMinPa === "number" &&
    targets.materialSafetyFactor === 2 &&
    typeof targets.requiredFractureOrYieldStressPa === "number" &&
    typeof targets.couponRequiredCycleCount === "number" &&
    targets.roughnessRmsMaxMeters === 1e-10 &&
    targets.fabricationToleranceMaxMeters === 5e-10 &&
    targets.materialResponseFrequencyHz === 15e9 &&
    targets.materialResponseTemperatureK === 4 &&
    targets.dielectricResponseRefRequired === true &&
    targets.conductivityRefRequired === true &&
    typeof targets.mechanicalCouponSampleCountMin === "number" &&
    typeof targets.stackCompatibilityCouponSampleCountMin === "number" &&
    typeof targets.cryogenicCycleSampleCountMin === "number" &&
    typeof targets.materialResponseSweepSampleCountMin === "number" &&
    typeof targets.surfaceMapSampleCountMin === "number" &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    requiredCorrections != null &&
    requiredCorrections.materialRequired === "ultra_high_stress_tin" &&
    requiredCorrections.architectureIdRequired === "topology_optimized_lattice_tin" &&
    typeof requiredCorrections.architectureIdMismatch === "boolean" &&
    requiredCorrections.layerCountRequired === 447 &&
    isNumberOrNull(requiredCorrections.stackCompatibilityLayerCountShortfall) &&
    requiredCorrections.supportFractionRequired === 0.26 &&
    isNumberOrNull(requiredCorrections.supportFractionAbsDelta) &&
    requiredCorrections.activeAreaLostFractionRequired === 0.08 &&
    isNumberOrNull(requiredCorrections.activeAreaLostFractionAbsDelta) &&
    typeof requiredCorrections.materialMismatch === "boolean" &&
    typeof requiredCorrections.supportStressPa === "number" &&
    typeof requiredCorrections.tensileStressMinPa === "number" &&
    isNumberOrNull(requiredCorrections.tensileStressShortfallPa) &&
    requiredCorrections.materialSafetyFactor === 2 &&
    typeof requiredCorrections.requiredFractureOrYieldStressPa === "number" &&
    isNumberOrNull(requiredCorrections.fractureOrYieldStressShortfallPa) &&
    typeof requiredCorrections.couponRequiredCycleCount === "number" &&
    isNumberOrNull(requiredCorrections.couponCycleCountShortfall) &&
    requiredCorrections.operatingTemperatureK === 4 &&
    isNumberOrNull(requiredCorrections.cryogenicTemperatureReductionK) &&
    requiredCorrections.materialResponseFrequencyHz === 15e9 &&
    isNumberOrNull(requiredCorrections.materialResponseFrequencyAbsDeltaHz) &&
    requiredCorrections.materialResponseTemperatureK === 4 &&
    isNumberOrNull(requiredCorrections.dielectricTemperatureReductionK) &&
    isNumberOrNull(requiredCorrections.conductivityTemperatureReductionK) &&
    requiredCorrections.roughnessRmsMaxMeters === 1e-10 &&
    isNumberOrNull(requiredCorrections.roughnessRmsReductionMeters) &&
    requiredCorrections.fabricationToleranceMaxMeters === 5e-10 &&
    isNumberOrNull(requiredCorrections.fabricationToleranceReductionMeters) &&
    requiredCorrections.requiredCurveAndMapRefCount === 7 &&
    typeof requiredCorrections.missingCurveAndMapRefCount === "number" &&
    requiredCorrections.requiredCampaignCompatibilityRefCount === 7 &&
    typeof requiredCorrections.missingCampaignCompatibilityRefCount === "number" &&
    typeof requiredCorrections.stackCompatibilityCouponSampleCountMin === "number" &&
    isNumberOrNull(requiredCorrections.stackCompatibilityCouponSampleCountShortfall) &&
    requiredCorrections.dielectricResponseRefRequired === true &&
    typeof requiredCorrections.dielectricResponseReceiptComplete === "boolean" &&
    typeof requiredCorrections.dielectricResponseNumericValueAvailable === "boolean" &&
    requiredCorrections.conductivityRefRequired === true &&
    typeof requiredCorrections.conductivityReceiptComplete === "boolean" &&
    typeof requiredCorrections.conductivityNumericValueAvailable === "boolean" &&
    requiredCorrections.requiredMaterialResponseRefCount === 2 &&
    typeof requiredCorrections.missingMaterialResponseRefCount === "number" &&
    typeof requiredCorrections.materialResponseNumericValuesAvailable === "boolean" &&
    typeof requiredCorrections.mechanicalCouponSampleCountMin === "number" &&
    typeof requiredCorrections.cryogenicCycleSampleCountMin === "number" &&
    typeof requiredCorrections.materialResponseSweepSampleCountMin === "number" &&
    typeof requiredCorrections.surfaceMapSampleCountMin === "number" &&
    isNumberOrNull(requiredCorrections.tensileStressCouponSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.fractureYieldCouponSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.cryogenicCycleSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.couponFatigueCurveSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.dielectricResponseFrequencySampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.conductivityTemperatureSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.roughnessMapSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.fabricationToleranceMapSampleCountShortfall) &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    summary.operatingBudgetComputed === true &&
    typeof summary.materialCouponEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetOnly === true &&
    boundary.materialCouponEvidenceDoesNotSupplyFullApparatusTensor === true &&
    boundary.materialResponseRefsDoNotSubstituteForFullTensor === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
