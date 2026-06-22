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
    layerCount: 447;
    operatingTemperatureK: 4;
    supportStressPa: number;
    tensileStressMinPa: number;
    materialSafetyFactor: 2;
    requiredFractureOrYieldStressPa: number;
    roughnessRmsMaxMeters: 1e-10;
    fabricationToleranceMaxMeters: 5e-10;
    materialResponseFrequencyHz: 15e9;
    materialResponseTemperatureK: 4;
    dielectricResponseRefRequired: true;
    conductivityRefRequired: true;
  };
  suppliedMaterialCouponEvidence: {
    evidenceTier: string;
    tensileStressCurveRef: string | null;
    fractureYieldCurveRef: string | null;
    cryogenicStateRef: string | null;
    roughnessMapRef: string | null;
    fabricationToleranceMapRef: string | null;
    material: string | null;
    measuredTensileStressPa: number | null;
    fractureOrYieldStressPa: number | null;
    supportStressPa: number | null;
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
    tensileStressMargin: number | null;
    fractureOrYieldStressMargin: number | null;
    cryogenicTemperatureMargin: number | null;
    materialResponseFrequencyMargin: number | null;
    dielectricTemperatureMargin: number | null;
    conductivityTemperatureMargin: number | null;
    materialResponseValuesAvailable: boolean;
    roughnessRmsMargin: number | null;
    fabricationToleranceMargin: number | null;
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
const SUPPORT_STRESS_PA = 5.45707087858e8;
const MATERIAL_SAFETY_FACTOR = 2;
const ROUGHNESS_RMS_MAX_METERS = 1e-10;
const FABRICATION_TOLERANCE_MAX_METERS = 5e-10;
const OPERATING_TEMPERATURE_K = 4;
const MATERIAL_RESPONSE_FREQUENCY_HZ = 15e9;

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
  const materialResponseValuesAvailable =
    evidence?.dielectricLossTangent != null &&
    Number.isFinite(evidence.dielectricLossTangent) &&
    evidence.dielectricLossTangent >= 0 &&
    evidence.conductivitySiemensPerMeter != null &&
    Number.isFinite(evidence.conductivitySiemensPerMeter) &&
    evidence.conductivitySiemensPerMeter > 0;
  const roughnessRmsMargin = safeRatio(
    ROUGHNESS_RMS_MAX_METERS,
    evidence?.roughnessRmsMeters ?? null,
  );
  const fabricationToleranceMargin = safeRatio(
    FABRICATION_TOLERANCE_MAX_METERS,
    evidence?.fabricationToleranceMeters ?? null,
  );
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
    ...(evidence?.tensileStressCurveRef == null
      ? ["tensile_stress_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.fractureYieldCurveRef == null
      ? ["fracture_yield_curve_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.cryogenicStateRef == null
      ? ["cryogenic_state_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.roughnessMapRef == null
      ? ["coupon_roughness_map_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.fabricationToleranceMapRef == null
      ? ["fabrication_tolerance_map_ref_missing_for_operating_budget"]
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
    ...(cryogenicTemperatureMargin == null
      ? ["cryogenic_temperature_missing_for_operating_budget"]
      : cryogenicTemperatureMargin < 1
        ? ["cryogenic_temperature_above_4k_operating_budget"]
        : []),
    ...(evidence?.dielectricResponseRef == null
      ? ["dielectric_response_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.conductivityRef == null
      ? ["conductivity_ref_missing_for_operating_budget"]
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
    ...(fabricationToleranceMargin == null
      ? ["fabrication_tolerance_missing_for_operating_budget"]
      : fabricationToleranceMargin < 1
        ? ["fabrication_tolerance_above_0p5nm_operating_budget"]
        : []),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "material_coupon_candidate_material_mismatch_for_operating_budget",
            "measured_tensile_stress_below_support_stress_operating_budget",
            "fracture_or_yield_margin_below_2x_support_stress_operating_budget",
            "cryogenic_temperature_above_4k_operating_budget",
            "material_response_frequency_not_15ghz_for_operating_budget",
            "dielectric_response_temperature_above_4k_for_operating_budget",
            "conductivity_temperature_above_4k_for_operating_budget",
            "material_response_numeric_values_missing_for_operating_budget",
            "coupon_roughness_rms_above_0p1nm_operating_budget",
            "fabrication_tolerance_above_0p5nm_operating_budget",
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
      layerCount: 447,
      operatingTemperatureK: OPERATING_TEMPERATURE_K,
      supportStressPa,
      tensileStressMinPa: supportStressPa,
      materialSafetyFactor: 2,
      requiredFractureOrYieldStressPa,
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      fabricationToleranceMaxMeters: FABRICATION_TOLERANCE_MAX_METERS,
      materialResponseFrequencyHz: MATERIAL_RESPONSE_FREQUENCY_HZ,
      materialResponseTemperatureK: OPERATING_TEMPERATURE_K,
      dielectricResponseRefRequired: true,
      conductivityRefRequired: true,
    },
    suppliedMaterialCouponEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      tensileStressCurveRef: stringOrNull(evidence?.tensileStressCurveRef),
      fractureYieldCurveRef: stringOrNull(evidence?.fractureYieldCurveRef),
      cryogenicStateRef: stringOrNull(evidence?.cryogenicStateRef),
      roughnessMapRef: stringOrNull(evidence?.roughnessMapRef),
      fabricationToleranceMapRef: stringOrNull(evidence?.fabricationToleranceMapRef),
      material: stringOrNull(evidence?.material),
      measuredTensileStressPa: finiteOrNull(evidence?.measuredTensileStressPa),
      fractureOrYieldStressPa: finiteOrNull(evidence?.fractureOrYieldStressPa),
      supportStressPa: finiteOrNull(evidence?.supportStressPa),
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
        evidence.roughnessMapRef != null &&
        evidence.fabricationToleranceMapRef != null,
      tensileStressMargin,
      fractureOrYieldStressMargin,
      cryogenicTemperatureMargin,
      materialResponseFrequencyMargin,
      dielectricTemperatureMargin,
      conductivityTemperatureMargin,
      materialResponseValuesAvailable,
      roughnessRmsMargin,
      fabricationToleranceMargin,
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
    targets.layerCount === 447 &&
    targets.operatingTemperatureK === 4 &&
    typeof targets.supportStressPa === "number" &&
    typeof targets.tensileStressMinPa === "number" &&
    targets.materialSafetyFactor === 2 &&
    typeof targets.requiredFractureOrYieldStressPa === "number" &&
    targets.roughnessRmsMaxMeters === 1e-10 &&
    targets.fabricationToleranceMaxMeters === 5e-10 &&
    targets.materialResponseFrequencyHz === 15e9 &&
    targets.materialResponseTemperatureK === 4 &&
    targets.dielectricResponseRefRequired === true &&
    targets.conductivityRefRequired === true &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
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
