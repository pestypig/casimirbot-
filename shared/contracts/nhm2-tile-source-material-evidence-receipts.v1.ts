import type {
  Nhm2FullApparatusTensorTermCoverageV1,
  Nhm2LayerStackReceiptSurfaceId,
} from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";

export const NHM2_TILE_SOURCE_MATERIAL_EVIDENCE_RECEIPTS_CONTRACT_VERSION =
  "nhm2_tile_source_material_evidence_receipts/v1";

export type Nhm2TileSourceEvidenceTier =
  | "measured"
  | "validated_simulation"
  | "declared_model"
  | "missing";

export type Nhm2TileSourceReceiptStatus = "pass" | "review" | "fail" | "missing";

export type Nhm2TileSourceReceiptSurfaceStatusV1 = {
  surfaceId: Nhm2LayerStackReceiptSurfaceId;
  status: Nhm2TileSourceReceiptStatus;
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef: string | null;
  blockers: string[];
  numericalMargins: Record<string, number | null>;
  requiredChange: string;
};

export type Nhm2TileSourceMaterialCouponEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  tensileStressCurveRef?: string | null;
  fractureYieldCurveRef?: string | null;
  cryogenicStateRef?: string | null;
  roughnessMapRef?: string | null;
  fabricationToleranceMapRef?: string | null;
  material: "ultra_high_stress_tin" | "sin" | "aln_alscn" | "custom";
  measuredTensileStressPa: number | null;
  fractureOrYieldStressPa: number | null;
  supportStressPa: number | null;
  cryogenicTemperatureK: number | null;
  dielectricResponseRef?: string | null;
  conductivityRef?: string | null;
  materialResponseFrequencyHz?: number | null;
  dielectricResponseTemperatureK?: number | null;
  conductivityTemperatureK?: number | null;
  dielectricLossTangent?: number | null;
  conductivitySiemensPerMeter?: number | null;
  roughnessRmsMeters: number | null;
  fabricationToleranceMeters: number | null;
};

export type Nhm2TileSourceForceGapPullInEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  forceGapCurveRef?: string | null;
  forceGradientCurveRef?: string | null;
  stiffnessModelRef?: string | null;
  gapMeters: number | null;
  casimirForceN: number | null;
  forceGradientNPerM: number | null;
  effectiveSpringConstantNPerM: number | null;
  stictionMargin: number | null;
  activeGapControlAuthorityN: number | null;
};

export type Nhm2TileSourceRoughnessPatchEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  roughnessMapRef?: string | null;
  asperityDistributionRef?: string | null;
  patchVoltageMapRef?: string | null;
  roughnessRmsMeters: number | null;
  asperityP99Meters: number | null;
  asperityMaxMeters: number | null;
  patchVoltageRmsVolts: number | null;
  residualElectrostaticForceFraction: number | null;
  correctionRef?: string | null;
};

export type Nhm2TileSourceActiveControlEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  energyWaveformRef?: string | null;
  controlTransferFunctionRef?: string | null;
  gapNoiseTraceRef?: string | null;
  thermalModelRef?: string | null;
  heatLoadTraceRef?: string | null;
  timingSyncTraceRef?: string | null;
  energyPerCycleJ: number | null;
  bandwidthHz: number | null;
  switchingRateHz: number | null;
  gapNoiseRmsMeters: number | null;
  noiseSpectrumRef?: string | null;
  heatLoadW: number | null;
  timingJitterSeconds: number | null;
  failureModeRef?: string | null;
  failureModeCoverage?: {
    lossOfLock: boolean;
    thermalRunaway: boolean;
    noiseRunaway: boolean;
    timingDesynchronization: boolean;
    failSafeShutdown: boolean;
  } | null;
};

export type Nhm2TileSourceFatigueLayerScalingEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  cycleProtocolRef?: string | null;
  fatigueCurveRef?: string | null;
  thermalCycleRef?: string | null;
  creepDriftRef?: string | null;
  layerScalingMapRef?: string | null;
  nonadditivityModelRef?: string | null;
  activeAreaMapRef?: string | null;
  supportCouplingMapRef?: string | null;
  multiphysicsCouplingRef?: string | null;
  cycleCountToFailure: number | null;
  requiredCycleCount: number | null;
  thermalCycleDriftFraction?: number | null;
  creepDriftFraction?: number | null;
  layerScalingEfficiency: number | null;
  nonadditivityFraction: number | null;
  activeAreaRetention: number | null;
  supportCouplingStatus: "pass" | "review" | "fail" | "missing";
};

export type Nhm2FullApparatusTensorComponentRefSetV1 = {
  T00?: string | null;
  T01?: string | null;
  T02?: string | null;
  T03?: string | null;
  T11?: string | null;
  T12?: string | null;
  T13?: string | null;
  T22?: string | null;
  T23?: string | null;
  T33?: string | null;
};

export type Nhm2TileSourceFullApparatusTensorEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  tensorValueArtifactRef?: string | null;
  tensorValueArtifactContract?: "nhm2_tile_source_full_apparatus_tensor_values/v1" | null;
  sameChart: boolean;
  sameBasis: boolean;
  sameUnits: boolean;
  noMetricTargetEcho: boolean;
  components: {
    T00: boolean;
    T0i: boolean;
    diagonalTij: boolean;
    offDiagonalTij: boolean;
  };
  componentRefs?: {
    T00?: string | null;
    T0i?: string | null;
    diagonalTij?: string | null;
    offDiagonalTij?: string | null;
  };
  componentDetailRefs?: Nhm2FullApparatusTensorComponentRefSetV1;
  termCoverage: Nhm2FullApparatusTensorTermCoverageV1 & {
    casimirInteractionStressEnergy: boolean;
    materialStrainEnergy: boolean;
  };
  termRefs?: {
    supportStructureStressEnergy?: string | null;
    spacerContactStressEnergy?: string | null;
    activeControlFieldEnergy?: string | null;
    thermalLoadStressEnergy?: string | null;
    patchPotentialElectrostaticStress?: string | null;
    fatigueDamageEvolution?: string | null;
    layerScalingCrossTerms?: string | null;
    casimirInteractionStressEnergy?: string | null;
    materialStrainEnergy?: string | null;
  };
  regionalCoverage: {
    wall: boolean;
    hull: boolean;
    exteriorShell: boolean;
  };
  regionalSupportRefs?: {
    wall?: string | null;
    hull?: string | null;
    exteriorShell?: string | null;
  };
};

export type BuildNhm2TileSourceMaterialEvidenceReceiptsInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  candidateId?: "nhm2_447_layer_topology_optimized_lattice_tin_v1" | null;
  materialCoupon?: Nhm2TileSourceMaterialCouponEvidenceV1 | null;
  forceGapPullIn?: Nhm2TileSourceForceGapPullInEvidenceV1 | null;
  roughnessPatch?: Nhm2TileSourceRoughnessPatchEvidenceV1 | null;
  activeControl?: Nhm2TileSourceActiveControlEvidenceV1 | null;
  fatigueLayerScaling?: Nhm2TileSourceFatigueLayerScalingEvidenceV1 | null;
  fullApparatusTensor?: Nhm2TileSourceFullApparatusTensorEvidenceV1 | null;
};

export type Nhm2TileSourceMaterialEvidenceReceiptsV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_MATERIAL_EVIDENCE_RECEIPTS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  thresholds: {
    requiredGapMeters: 8e-9;
    materialSafetyFactor: 2;
    roughnessRmsMaxMeters: 1e-10;
    asperityMaxFractionOfGap: 0.5;
    materialResponseFrequencyHz: 15e9;
    materialResponseTemperatureK: 4;
    forceGradientConsistencyMin: 0.75;
    patchVoltageRmsMaxVolts: 0.01;
    residualElectrostaticForceFractionMax: 0.05;
    patchVoltageDerivedElectrostaticFractionMax: 0.05;
    activeControlAuthorityFactorMin: 1.2;
    activeControlBandwidthFactorMin: 2;
    gapNoiseFractionMax: 0.01;
    timingJitterCycleFractionMax: 0.1;
    layerScalingEfficiencyMin: 0.9;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
    sourceTensorRetentionFractionMin: 0.9;
    thermalCycleDriftFractionMax: 0.01;
    creepDriftFractionMax: 0.01;
  };
  receiptSurfaces: Nhm2TileSourceReceiptSurfaceStatusV1[];
  derivedReceiptInputs: {
    suppliedReceiptSurfaces: Partial<Record<Nhm2LayerStackReceiptSurfaceId, boolean>>;
    tensorTermCoverage: Partial<Nhm2FullApparatusTensorTermCoverageV1>;
    tensorAuthorityEvidenceSupplied: boolean;
  };
  falsificationMap: Array<{
    blocker: string;
    surfaceId: Nhm2LayerStackReceiptSurfaceId;
    numericalMargin: number | null;
    marginUnit: string | null;
    requiredChange: string;
    falsifiesCurrentCandidate: boolean;
  }>;
  summary: {
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    sourceAuthorityEvidenceReady: boolean;
    firstBlocker: string;
    candidateDisposition: "receipt_ready" | "review" | "falsified";
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    experimentalReceiptBundleOnly: true;
    simulationOnlyIsNotExperimentalValidation: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    fullApparatusTensorRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

const REQUIRED_GAP_METERS = 8e-9;
const MATERIAL_SAFETY_FACTOR = 2;
const ROUGHNESS_RMS_MAX_METERS = 1e-10;
const ASPERITY_MAX_FRACTION_OF_GAP = 0.5;
const MATERIAL_RESPONSE_FREQUENCY_HZ = 15e9;
const MATERIAL_RESPONSE_TEMPERATURE_K = 4;
const FORCE_GRADIENT_CONSISTENCY_MIN = 0.75;
const PATCH_VOLTAGE_RMS_MAX_VOLTS = 0.01;
const RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX = 0.05;
const PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX = 0.05;
const ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN = 1.2;
const ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN = 2;
const GAP_NOISE_FRACTION_MAX = 0.01;
const TIMING_JITTER_CYCLE_FRACTION_MAX = 0.1;
const SWITCHING_RATE_HZ = 15e9;
const LAYER_SCALING_EFFICIENCY_MIN = 0.9;
const LAYER_NONADDITIVITY_FRACTION_MAX = 0.1;
const ACTIVE_AREA_RETENTION_MIN = 0.6;
const SOURCE_TENSOR_RETENTION_FRACTION_MIN = 0.9;
const THERMAL_CYCLE_DRIFT_FRACTION_MAX = 0.01;
const CREEP_DRIFT_FRACTION_MAX = 0.01;
const EPSILON_0_SI = 8.8541878128e-12;
const HBAR_SI = 1.054571817e-34;
const C_SI = 299792458;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const measuredOrValidated = (tier: Nhm2TileSourceEvidenceTier): boolean =>
  tier === "measured" || tier === "validated_simulation";

const symmetricRatioMargin = (actual: number | null, expected: number | null): number | null => {
  if (actual == null || expected == null || actual <= 0 || expected <= 0) return null;
  const ratio = actual / expected;
  return round(Math.min(ratio, 1 / ratio));
};

const upperBoundMargin = (limit: number, value: number | null | undefined): number | null => {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return round(limit / value);
};

const missingSurface = (
  surfaceId: Nhm2LayerStackReceiptSurfaceId,
  blocker: string,
  requiredChange: string,
): Nhm2TileSourceReceiptSurfaceStatusV1 => ({
  surfaceId,
  status: "missing",
  evidenceTier: "missing",
  evidenceRef: null,
  blockers: [blocker],
  numericalMargins: {},
  requiredChange,
});

const statusFromBlockers = (
  tier: Nhm2TileSourceEvidenceTier,
  blockers: string[],
): Nhm2TileSourceReceiptStatus => {
  if (tier === "missing") return "missing";
  if (!measuredOrValidated(tier)) return "review";
  return blockers.length === 0 ? "pass" : "fail";
};

const evidenceRefBlocker = (
  evidence: { evidenceTier: Nhm2TileSourceEvidenceTier; evidenceRef?: string | null },
  blocker: string,
): string[] => (measuredOrValidated(evidence.evidenceTier) && evidence.evidenceRef == null ? [blocker] : []);

const materialCouponSurface = (
  evidence: Nhm2TileSourceMaterialCouponEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply measured or validated coupon data and provenance for tensile/fracture stress curves, cryogenic state, dielectric response, conductivity, roughness maps, and fabrication tolerance maps.";
  if (evidence == null) {
    return missingSurface("material_coupon", "material_coupon_receipt_missing", requiredChange);
  }
  const supportStressPa = evidence.supportStressPa ?? null;
  const requiredStressPa =
    supportStressPa == null ? null : supportStressPa * MATERIAL_SAFETY_FACTOR;
  const stressMargin =
    evidence.fractureOrYieldStressPa == null || requiredStressPa == null
      ? null
      : evidence.fractureOrYieldStressPa / requiredStressPa;
  const materialResponseFrequencyMargin =
    evidence.materialResponseFrequencyHz == null || evidence.materialResponseFrequencyHz <= 0
      ? null
      : round(
          Math.min(
            evidence.materialResponseFrequencyHz / MATERIAL_RESPONSE_FREQUENCY_HZ,
            MATERIAL_RESPONSE_FREQUENCY_HZ / evidence.materialResponseFrequencyHz,
          ),
        );
  const dielectricTemperatureMargin =
    evidence.dielectricResponseTemperatureK == null ||
    evidence.dielectricResponseTemperatureK <= 0
      ? null
      : round(MATERIAL_RESPONSE_TEMPERATURE_K / evidence.dielectricResponseTemperatureK);
  const conductivityTemperatureMargin =
    evidence.conductivityTemperatureK == null || evidence.conductivityTemperatureK <= 0
      ? null
      : round(MATERIAL_RESPONSE_TEMPERATURE_K / evidence.conductivityTemperatureK);
  const materialResponseValuesAvailable =
    evidence.dielectricLossTangent != null &&
    Number.isFinite(evidence.dielectricLossTangent) &&
    evidence.dielectricLossTangent >= 0 &&
    evidence.conductivitySiemensPerMeter != null &&
    Number.isFinite(evidence.conductivitySiemensPerMeter) &&
    evidence.conductivitySiemensPerMeter > 0;
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["material_coupon_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "material_coupon_evidence_ref_missing"),
    ...(evidence.tensileStressCurveRef == null ? ["tensile_stress_curve_ref_missing"] : []),
    ...(evidence.fractureYieldCurveRef == null ? ["fracture_yield_curve_ref_missing"] : []),
    ...(evidence.cryogenicStateRef == null ? ["cryogenic_state_ref_missing"] : []),
    ...(evidence.roughnessMapRef == null ? ["coupon_roughness_map_ref_missing"] : []),
    ...(evidence.fabricationToleranceMapRef == null ? ["fabrication_tolerance_map_ref_missing"] : []),
    ...(evidence.material !== "ultra_high_stress_tin" ? ["candidate_material_mismatch"] : []),
    ...(stressMargin == null ? ["fracture_or_yield_margin_missing"] : stressMargin < 1 ? ["fracture_or_yield_margin_below_2x_support_stress"] : []),
    ...(evidence.measuredTensileStressPa == null ? ["measured_tensile_stress_missing"] : []),
    ...(evidence.cryogenicTemperatureK == null || evidence.cryogenicTemperatureK > 4 ? ["cryogenic_4k_coupon_receipt_missing"] : []),
    ...(evidence.dielectricResponseRef == null ? ["dielectric_response_ref_missing"] : []),
    ...(evidence.conductivityRef == null ? ["conductivity_ref_missing"] : []),
    ...(materialResponseFrequencyMargin == null
      ? ["material_response_frequency_missing"]
      : materialResponseFrequencyMargin < 1
        ? ["material_response_frequency_not_15ghz"]
        : []),
    ...(dielectricTemperatureMargin == null
      ? ["dielectric_response_temperature_missing"]
      : dielectricTemperatureMargin < 1
        ? ["dielectric_response_temperature_above_4k"]
        : []),
    ...(conductivityTemperatureMargin == null
      ? ["conductivity_temperature_missing"]
      : conductivityTemperatureMargin < 1
        ? ["conductivity_temperature_above_4k"]
        : []),
    ...(!materialResponseValuesAvailable
      ? ["material_response_numeric_values_missing"]
      : []),
    ...(evidence.roughnessRmsMeters == null || evidence.roughnessRmsMeters > ROUGHNESS_RMS_MAX_METERS ? ["coupon_roughness_rms_above_0p1nm_or_missing"] : []),
    ...(evidence.fabricationToleranceMeters == null ? ["fabrication_tolerance_receipt_missing"] : []),
  ];
  return {
    surfaceId: "material_coupon",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      stressMargin,
      requiredStressPa,
      measuredTensileStressPa: evidence.measuredTensileStressPa,
      materialResponseFrequencyMargin,
      dielectricTemperatureMargin,
      conductivityTemperatureMargin,
      dielectricLossTangent: evidence.dielectricLossTangent ?? null,
      conductivitySiemensPerMeter: evidence.conductivitySiemensPerMeter ?? null,
      materialResponseValuesAvailable: materialResponseValuesAvailable ? 1 : 0,
      roughnessRmsMeters: evidence.roughnessRmsMeters,
      couponProvenanceRefsAvailable:
        evidence.tensileStressCurveRef != null &&
        evidence.fractureYieldCurveRef != null &&
        evidence.cryogenicStateRef != null &&
        evidence.roughnessMapRef != null &&
        evidence.fabricationToleranceMapRef != null
          ? 1
          : 0,
    },
    requiredChange,
  };
};

const forceGapSurface = (
  evidence: Nhm2TileSourceForceGapPullInEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply measured or validated F(g), dF/dg, spring constant, stiction margin, and active gap-control authority at the 8 nm operating gap.";
  if (evidence == null) {
    return missingSurface("force_gap_pull_in", "force_gap_curve_and_pull_in_margin_at_8nm_missing", requiredChange);
  }
  const pullInMargin =
    evidence.effectiveSpringConstantNPerM == null || evidence.forceGradientNPerM == null
      ? null
      : evidence.effectiveSpringConstantNPerM / evidence.forceGradientNPerM;
  const activeAuthorityMargin =
    evidence.activeGapControlAuthorityN == null || evidence.casimirForceN == null
      ? null
      : evidence.activeGapControlAuthorityN /
        (Math.abs(evidence.casimirForceN) * ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN);
  const expectedGradientFromSuppliedForce =
    evidence.casimirForceN == null
      ? null
      : round((4 * Math.abs(evidence.casimirForceN)) / REQUIRED_GAP_METERS);
  const forceGradientConsistencyMargin = symmetricRatioMargin(
    evidence.forceGradientNPerM,
    expectedGradientFromSuppliedForce,
  );
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["force_gap_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "force_gap_evidence_ref_missing"),
    ...(evidence.forceGapCurveRef == null ? ["force_gap_curve_ref_missing"] : []),
    ...(evidence.forceGradientCurveRef == null ? ["force_gradient_curve_ref_missing"] : []),
    ...(evidence.stiffnessModelRef == null ? ["force_gap_stiffness_model_ref_missing"] : []),
    ...(evidence.gapMeters == null || Math.abs(evidence.gapMeters - REQUIRED_GAP_METERS) > 1e-12 ? ["force_gap_not_at_8nm"] : []),
    ...(evidence.casimirForceN == null ? ["casimir_force_at_gap_missing"] : []),
    ...(forceGradientConsistencyMargin == null
      ? ["force_gradient_consistency_with_force_curve_missing"]
      : forceGradientConsistencyMargin < FORCE_GRADIENT_CONSISTENCY_MIN
        ? ["force_gradient_inconsistent_with_force_curve_at_8nm"]
        : []),
    ...(pullInMargin == null ? ["pull_in_margin_missing"] : pullInMargin < 1 ? ["pull_in_margin_below_one"] : []),
    ...(evidence.stictionMargin == null ? ["stiction_margin_missing"] : evidence.stictionMargin < 1 ? ["stiction_margin_below_one"] : []),
    ...(activeAuthorityMargin == null ? ["active_gap_control_authority_missing"] : activeAuthorityMargin < 1 ? ["active_gap_control_authority_below_1p2x_force"] : []),
  ];
  return {
    surfaceId: "force_gap_pull_in",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      pullInMargin,
      stictionMargin: evidence.stictionMargin,
      activeAuthorityMargin,
      expectedGradientFromSuppliedForce,
      forceGradientConsistencyMargin,
      gapMeters: evidence.gapMeters,
      curveRefsAvailable:
        evidence.forceGapCurveRef != null &&
        evidence.forceGradientCurveRef != null &&
        evidence.stiffnessModelRef != null
          ? 1
          : 0,
    },
    requiredChange,
  };
};

const roughnessPatchSurface = (
  evidence: Nhm2TileSourceRoughnessPatchEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply measured or validated roughness, asperity-tail, patch-voltage, and residual electrostatic correction maps for the 8 nm gap.";
  if (evidence == null) {
    return missingSurface("roughness_patch_metrology", "roughness_asperity_tail_and_patch_potential_map_missing", requiredChange);
  }
  const asperityMaxMargin =
    evidence.asperityMaxMeters == null
      ? null
      : (REQUIRED_GAP_METERS * ASPERITY_MAX_FRACTION_OF_GAP) / evidence.asperityMaxMeters;
  const idealCasimirPressureAbsPa =
    (Math.PI ** 2 * HBAR_SI * C_SI) / (240 * REQUIRED_GAP_METERS ** 4);
  const patchVoltageDerivedElectrostaticPressurePa =
    evidence.patchVoltageRmsVolts == null
      ? null
      : round((0.5 * EPSILON_0_SI * evidence.patchVoltageRmsVolts ** 2) / REQUIRED_GAP_METERS ** 2);
  const patchVoltageDerivedElectrostaticForceFraction =
    patchVoltageDerivedElectrostaticPressurePa == null
      ? null
      : round(patchVoltageDerivedElectrostaticPressurePa / idealCasimirPressureAbsPa);
  const patchVoltageDerivedElectrostaticMargin =
    patchVoltageDerivedElectrostaticForceFraction == null ||
    patchVoltageDerivedElectrostaticForceFraction <= 0
      ? null
      : PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX /
        patchVoltageDerivedElectrostaticForceFraction;
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["roughness_patch_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "roughness_patch_evidence_ref_missing"),
    ...(evidence.roughnessMapRef == null ? ["roughness_map_ref_missing"] : []),
    ...(evidence.asperityDistributionRef == null ? ["asperity_tail_distribution_ref_missing"] : []),
    ...(evidence.patchVoltageMapRef == null ? ["patch_voltage_map_ref_missing"] : []),
    ...(evidence.roughnessRmsMeters == null || evidence.roughnessRmsMeters > ROUGHNESS_RMS_MAX_METERS ? ["roughness_rms_above_0p1nm_or_missing"] : []),
    ...(evidence.asperityP99Meters == null ? ["asperity_p99_missing"] : []),
    ...(asperityMaxMargin == null ? ["asperity_tail_margin_missing"] : asperityMaxMargin < 1 ? ["asperity_tail_exceeds_half_gap"] : []),
    ...(evidence.patchVoltageRmsVolts == null || evidence.patchVoltageRmsVolts > PATCH_VOLTAGE_RMS_MAX_VOLTS ? ["patch_voltage_rms_above_10mv_or_missing"] : []),
    ...(evidence.residualElectrostaticForceFraction == null ||
    evidence.residualElectrostaticForceFraction > RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX
      ? ["residual_electrostatic_force_correction_above_5pct_or_missing"]
      : []),
    ...(patchVoltageDerivedElectrostaticForceFraction == null
      ? ["patch_voltage_derived_electrostatic_fraction_missing"]
      : patchVoltageDerivedElectrostaticForceFraction >
          PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX
        ? ["patch_voltage_derived_electrostatic_fraction_above_5pct"]
        : []),
    ...(evidence.correctionRef == null ? ["roughness_patch_correction_ref_missing"] : []),
  ];
  return {
    surfaceId: "roughness_patch_metrology",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      roughnessRmsMeters: evidence.roughnessRmsMeters,
      asperityMaxMargin,
      patchVoltageRmsVolts: evidence.patchVoltageRmsVolts,
      residualElectrostaticForceFraction: evidence.residualElectrostaticForceFraction,
      patchVoltageDerivedElectrostaticPressurePa,
      patchVoltageDerivedElectrostaticForceFraction,
      patchVoltageDerivedElectrostaticMargin,
      mapRefsAvailable:
        evidence.roughnessMapRef != null &&
        evidence.asperityDistributionRef != null &&
        evidence.patchVoltageMapRef != null
          ? 1
          : 0,
    },
    requiredChange,
  };
};

const activeControlSurface = (
  evidence: Nhm2TileSourceActiveControlEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply active-control energy waveform, controller transfer function, noise spectrum/trace, thermal model, heat-load trace, timing synchronization trace, and failure-mode receipts.";
  if (evidence == null) {
    return missingSurface("active_control_energy", "active_gap_control_energy_and_noise_missing", requiredChange);
  }
  const bandwidthMargin =
    evidence.bandwidthHz == null || evidence.switchingRateHz == null
      ? null
      : evidence.bandwidthHz / (evidence.switchingRateHz * ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN);
  const noiseMargin =
    evidence.gapNoiseRmsMeters == null
      ? null
      : (REQUIRED_GAP_METERS * GAP_NOISE_FRACTION_MAX) / evidence.gapNoiseRmsMeters;
  const timingMargin =
    evidence.timingJitterSeconds == null || evidence.switchingRateHz == null
      ? null
      : (TIMING_JITTER_CYCLE_FRACTION_MAX / evidence.switchingRateHz) /
        evidence.timingJitterSeconds;
  const switchingRateMargin =
    evidence.switchingRateHz == null
      ? null
      : round(Math.min(evidence.switchingRateHz, SWITCHING_RATE_HZ) / SWITCHING_RATE_HZ);
  const switchingRateMatchesTarget =
    evidence.switchingRateHz != null &&
    Math.abs(evidence.switchingRateHz - SWITCHING_RATE_HZ) <= SWITCHING_RATE_HZ * 1e-9;
  const failureModeCoverage = evidence.failureModeCoverage ?? null;
  const failureModeCoverageComplete =
    failureModeCoverage?.lossOfLock === true &&
    failureModeCoverage.thermalRunaway === true &&
    failureModeCoverage.noiseRunaway === true &&
    failureModeCoverage.timingDesynchronization === true &&
    failureModeCoverage.failSafeShutdown === true;
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["active_control_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "active_control_evidence_ref_missing"),
    ...(evidence.energyWaveformRef == null ? ["active_control_energy_waveform_ref_missing"] : []),
    ...(evidence.controlTransferFunctionRef == null ? ["active_control_transfer_function_ref_missing"] : []),
    ...(evidence.gapNoiseTraceRef == null ? ["active_control_gap_noise_trace_ref_missing"] : []),
    ...(evidence.thermalModelRef == null ? ["active_control_thermal_model_ref_missing"] : []),
    ...(evidence.heatLoadTraceRef == null ? ["active_control_heat_load_trace_ref_missing"] : []),
    ...(evidence.timingSyncTraceRef == null ? ["active_control_timing_sync_trace_ref_missing"] : []),
    ...(evidence.energyPerCycleJ == null || !Number.isFinite(evidence.energyPerCycleJ) ? ["active_control_energy_per_cycle_missing"] : []),
    ...(evidence.switchingRateHz == null
      ? ["active_control_switching_rate_missing"]
      : switchingRateMatchesTarget
        ? []
        : ["active_control_switching_rate_not_15ghz"]),
    ...(bandwidthMargin == null ? ["gap_lock_bandwidth_missing"] : bandwidthMargin < 1 ? ["gap_lock_bandwidth_below_2x_switching_rate"] : []),
    ...(noiseMargin == null ? ["gap_noise_receipt_missing"] : noiseMargin < 1 ? ["gap_noise_above_1pct_gap"] : []),
    ...(evidence.noiseSpectrumRef == null ? ["active_control_noise_spectrum_ref_missing"] : []),
    ...(evidence.heatLoadW == null || !Number.isFinite(evidence.heatLoadW) ? ["active_control_heat_load_missing"] : []),
    ...(timingMargin == null ? ["timing_jitter_receipt_missing"] : timingMargin < 1 ? ["timing_jitter_above_0p1_cycle"] : []),
    ...(evidence.failureModeRef == null ? ["active_control_failure_mode_ref_missing"] : []),
    ...(failureModeCoverage?.lossOfLock === true
      ? []
      : ["active_control_loss_of_lock_failure_mode_missing"]),
    ...(failureModeCoverage?.thermalRunaway === true
      ? []
      : ["active_control_thermal_runaway_failure_mode_missing"]),
    ...(failureModeCoverage?.noiseRunaway === true
      ? []
      : ["active_control_noise_runaway_failure_mode_missing"]),
    ...(failureModeCoverage?.timingDesynchronization === true
      ? []
      : ["active_control_timing_desynchronization_failure_mode_missing"]),
    ...(failureModeCoverage?.failSafeShutdown === true
      ? []
      : ["active_control_fail_safe_shutdown_missing"]),
  ];
  return {
    surfaceId: "active_control_energy",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      bandwidthMargin,
      switchingRateMargin,
      noiseMargin,
      timingMargin,
      energyPerCycleJ: evidence.energyPerCycleJ,
      heatLoadW: evidence.heatLoadW,
      failureModeCoverageComplete: failureModeCoverageComplete ? 1 : 0,
      activeControlProvenanceRefsAvailable:
        evidence.energyWaveformRef != null &&
        evidence.controlTransferFunctionRef != null &&
        evidence.gapNoiseTraceRef != null &&
        evidence.noiseSpectrumRef != null &&
        evidence.thermalModelRef != null &&
        evidence.heatLoadTraceRef != null &&
        evidence.timingSyncTraceRef != null &&
        evidence.failureModeRef != null
          ? 1
          : 0,
    },
    requiredChange,
  };
};

const fatigueLayerScalingSurfaces = (
  evidence: Nhm2TileSourceFatigueLayerScalingEvidenceV1 | null | undefined,
): [Nhm2TileSourceReceiptSurfaceStatusV1, Nhm2TileSourceReceiptSurfaceStatusV1] => {
  const fatigueRequiredChange =
    "Supply fatigue curve, cycle protocol, thermal cycling, creep/drift, and cycling lifetime evidence for the selected 447-layer architecture.";
  const scalingRequiredChange =
    "Supply 447-layer scaling maps, nonadditivity model, support-coupling map, active-area-retention map, and multiphysics coupling evidence.";
  if (evidence == null) {
    return [
      missingSurface("fatigue_lifetime", "fatigue_lifetime_receipt_missing", fatigueRequiredChange),
      missingSurface("layer_scaling", "layer_scaling_nonadditivity_measurement_missing", scalingRequiredChange),
    ];
  }
  const cycleMargin =
    evidence.cycleCountToFailure == null || evidence.requiredCycleCount == null
      ? null
      : evidence.cycleCountToFailure / evidence.requiredCycleCount;
  const thermalCycleDriftMargin = upperBoundMargin(
    THERMAL_CYCLE_DRIFT_FRACTION_MAX,
    evidence.thermalCycleDriftFraction,
  );
  const creepDriftMargin = upperBoundMargin(
    CREEP_DRIFT_FRACTION_MAX,
    evidence.creepDriftFraction,
  );
  const scalingMargin =
    evidence.layerScalingEfficiency == null
      ? null
      : evidence.layerScalingEfficiency / LAYER_SCALING_EFFICIENCY_MIN;
  const nonadditivityMargin =
    evidence.nonadditivityFraction == null
      ? null
      : LAYER_NONADDITIVITY_FRACTION_MAX / evidence.nonadditivityFraction;
  const activeAreaMargin =
    evidence.activeAreaRetention == null
      ? null
      : evidence.activeAreaRetention / ACTIVE_AREA_RETENTION_MIN;
  const sourceTensorRetentionFraction =
    evidence.layerScalingEfficiency == null ||
    evidence.nonadditivityFraction == null ||
    evidence.activeAreaRetention == null
      ? null
      : round(
          evidence.layerScalingEfficiency *
            (1 - evidence.nonadditivityFraction) *
            evidence.activeAreaRetention,
        );
  const sourceTensorRetentionMargin =
    sourceTensorRetentionFraction == null
      ? null
      : sourceTensorRetentionFraction / SOURCE_TENSOR_RETENTION_FRACTION_MIN;
  const tierBlockers = !measuredOrValidated(evidence.evidenceTier)
    ? ["fatigue_layer_scaling_tier_not_measured_or_validated"]
    : [];
  const receiptRefBlockers = evidenceRefBlocker(
    evidence,
    "fatigue_layer_scaling_evidence_ref_missing",
  );
  const fatigueBlockers = [
    ...tierBlockers,
    ...receiptRefBlockers,
    ...(evidence.cycleProtocolRef == null ? ["fatigue_cycle_protocol_ref_missing"] : []),
    ...(evidence.fatigueCurveRef == null ? ["fatigue_curve_ref_missing"] : []),
    ...(evidence.thermalCycleRef == null ? ["thermal_cycle_ref_missing"] : []),
    ...(evidence.creepDriftRef == null ? ["creep_drift_ref_missing"] : []),
    ...(cycleMargin == null ? ["fatigue_cycle_margin_missing"] : cycleMargin < 1 ? ["fatigue_cycle_margin_below_required"] : []),
    ...(thermalCycleDriftMargin == null
      ? ["thermal_cycle_drift_fraction_missing"]
      : thermalCycleDriftMargin < 1
        ? ["thermal_cycle_drift_above_0p01"]
        : []),
    ...(creepDriftMargin == null
      ? ["creep_drift_fraction_missing"]
      : creepDriftMargin < 1
        ? ["creep_drift_above_0p01"]
        : []),
  ];
  const scalingBlockers = [
    ...tierBlockers,
    ...receiptRefBlockers,
    ...(evidence.layerScalingMapRef == null ? ["layer_scaling_map_ref_missing"] : []),
    ...(evidence.nonadditivityModelRef == null ? ["layer_nonadditivity_model_ref_missing"] : []),
    ...(evidence.activeAreaMapRef == null ? ["active_area_map_ref_missing"] : []),
    ...(evidence.supportCouplingMapRef == null ? ["support_coupling_map_ref_missing"] : []),
    ...(evidence.multiphysicsCouplingRef == null ? ["multiphysics_coupling_ref_missing"] : []),
    ...(scalingMargin == null ? ["layer_scaling_efficiency_missing"] : scalingMargin < 1 ? ["layer_scaling_efficiency_below_0p9"] : []),
    ...(nonadditivityMargin == null ? ["layer_nonadditivity_fraction_missing"] : nonadditivityMargin < 1 ? ["layer_nonadditivity_above_0p1"] : []),
    ...(activeAreaMargin == null ? ["active_area_retention_missing"] : activeAreaMargin < 1 ? ["active_area_retention_below_0p6"] : []),
    ...(sourceTensorRetentionMargin == null
      ? ["source_tensor_retention_fraction_missing"]
      : sourceTensorRetentionMargin < 1
        ? ["source_tensor_retention_below_0p9"]
        : []),
    ...(evidence.supportCouplingStatus !== "pass" ? ["support_coupling_status_not_pass"] : []),
  ];
  return [
    {
      surfaceId: "fatigue_lifetime",
      status: statusFromBlockers(evidence.evidenceTier, fatigueBlockers),
      evidenceTier: evidence.evidenceTier,
      evidenceRef: evidence.evidenceRef ?? null,
      blockers: fatigueBlockers,
      numericalMargins: {
        cycleMargin,
        thermalCycleDriftFraction: evidence.thermalCycleDriftFraction ?? null,
        thermalCycleDriftMargin,
        creepDriftFraction: evidence.creepDriftFraction ?? null,
        creepDriftMargin,
        fatigueProvenanceRefsAvailable:
          evidence.cycleProtocolRef != null &&
          evidence.fatigueCurveRef != null &&
          evidence.thermalCycleRef != null &&
          evidence.creepDriftRef != null
            ? 1
            : 0,
      },
      requiredChange: fatigueRequiredChange,
    },
    {
      surfaceId: "layer_scaling",
      status: statusFromBlockers(evidence.evidenceTier, scalingBlockers),
      evidenceTier: evidence.evidenceTier,
      evidenceRef: evidence.evidenceRef ?? null,
      blockers: scalingBlockers,
      numericalMargins: {
        scalingMargin,
        nonadditivityMargin,
        activeAreaMargin,
        sourceTensorRetentionFraction,
        sourceTensorRetentionMargin,
        layerScalingProvenanceRefsAvailable:
          evidence.layerScalingMapRef != null &&
          evidence.nonadditivityModelRef != null &&
          evidence.activeAreaMapRef != null &&
          evidence.supportCouplingMapRef != null &&
          evidence.multiphysicsCouplingRef != null
            ? 1
            : 0,
      },
      requiredChange: scalingRequiredChange,
    },
  ];
};

const fullApparatusTensorSurface = (
  evidence: Nhm2TileSourceFullApparatusTensorEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply source-side full apparatus T_munu with a tensor-value artifact, refs for T00, T01, T02, T03, T11, T12, T13, T22, T23, T33, support/control/thermal/electrostatic/material terms, regional coverage, and no metric-target echo.";
  if (evidence == null) {
    return missingSurface("full_apparatus_tensor", "support_drive_terms_in_full_apparatus_Tmunu_missing", requiredChange);
  }
  const componentRefBlockers = [
    ...(evidence.components.T00 && evidence.componentRefs?.T00 == null
      ? ["full_apparatus_T00_ref_missing"]
      : []),
    ...(evidence.components.T0i && evidence.componentRefs?.T0i == null
      ? ["full_apparatus_T0i_ref_missing"]
      : []),
    ...(evidence.components.diagonalTij && evidence.componentRefs?.diagonalTij == null
      ? ["full_apparatus_diagonal_Tij_ref_missing"]
      : []),
    ...(evidence.components.offDiagonalTij && evidence.componentRefs?.offDiagonalTij == null
      ? ["full_apparatus_off_diagonal_Tij_ref_missing"]
      : []),
  ];
  const componentDetailRefBlockers = [
    ...(evidence.components.T00 && evidence.componentDetailRefs?.T00 == null
      ? ["full_apparatus_T00_detail_ref_missing"]
      : []),
    ...(evidence.components.T0i && evidence.componentDetailRefs?.T01 == null
      ? ["full_apparatus_T01_ref_missing"]
      : []),
    ...(evidence.components.T0i && evidence.componentDetailRefs?.T02 == null
      ? ["full_apparatus_T02_ref_missing"]
      : []),
    ...(evidence.components.T0i && evidence.componentDetailRefs?.T03 == null
      ? ["full_apparatus_T03_ref_missing"]
      : []),
    ...(evidence.components.diagonalTij && evidence.componentDetailRefs?.T11 == null
      ? ["full_apparatus_T11_ref_missing"]
      : []),
    ...(evidence.components.diagonalTij && evidence.componentDetailRefs?.T22 == null
      ? ["full_apparatus_T22_ref_missing"]
      : []),
    ...(evidence.components.diagonalTij && evidence.componentDetailRefs?.T33 == null
      ? ["full_apparatus_T33_ref_missing"]
      : []),
    ...(evidence.components.offDiagonalTij && evidence.componentDetailRefs?.T12 == null
      ? ["full_apparatus_T12_ref_missing"]
      : []),
    ...(evidence.components.offDiagonalTij && evidence.componentDetailRefs?.T13 == null
      ? ["full_apparatus_T13_ref_missing"]
      : []),
    ...(evidence.components.offDiagonalTij && evidence.componentDetailRefs?.T23 == null
      ? ["full_apparatus_T23_ref_missing"]
      : []),
  ];
  const termRefBlockers = [
    ...(evidence.termCoverage.supportStructureStressEnergy &&
    evidence.termRefs?.supportStructureStressEnergy == null
      ? ["full_apparatus_support_structure_stress_energy_ref_missing"]
      : []),
    ...(evidence.termCoverage.spacerContactStressEnergy &&
    evidence.termRefs?.spacerContactStressEnergy == null
      ? ["full_apparatus_spacer_contact_stress_energy_ref_missing"]
      : []),
    ...(evidence.termCoverage.activeControlFieldEnergy &&
    evidence.termRefs?.activeControlFieldEnergy == null
      ? ["full_apparatus_active_control_field_energy_ref_missing"]
      : []),
    ...(evidence.termCoverage.thermalLoadStressEnergy &&
    evidence.termRefs?.thermalLoadStressEnergy == null
      ? ["full_apparatus_thermal_load_stress_energy_ref_missing"]
      : []),
    ...(evidence.termCoverage.patchPotentialElectrostaticStress &&
    evidence.termRefs?.patchPotentialElectrostaticStress == null
      ? ["full_apparatus_patch_potential_electrostatic_stress_ref_missing"]
      : []),
    ...(evidence.termCoverage.fatigueDamageEvolution &&
    evidence.termRefs?.fatigueDamageEvolution == null
      ? ["full_apparatus_fatigue_damage_evolution_ref_missing"]
      : []),
    ...(evidence.termCoverage.layerScalingCrossTerms &&
    evidence.termRefs?.layerScalingCrossTerms == null
      ? ["full_apparatus_layer_scaling_cross_terms_ref_missing"]
      : []),
    ...(evidence.termCoverage.casimirInteractionStressEnergy &&
    evidence.termRefs?.casimirInteractionStressEnergy == null
      ? ["full_apparatus_casimir_interaction_stress_energy_ref_missing"]
      : []),
    ...(evidence.termCoverage.materialStrainEnergy &&
    evidence.termRefs?.materialStrainEnergy == null
      ? ["full_apparatus_material_strain_energy_ref_missing"]
      : []),
  ];
  const regionalRefBlockers = [
    ...(evidence.regionalCoverage.wall && evidence.regionalSupportRefs?.wall == null
      ? ["full_apparatus_wall_region_support_ref_missing"]
      : []),
    ...(evidence.regionalCoverage.hull && evidence.regionalSupportRefs?.hull == null
      ? ["full_apparatus_hull_region_support_ref_missing"]
      : []),
    ...(evidence.regionalCoverage.exteriorShell &&
    evidence.regionalSupportRefs?.exteriorShell == null
      ? ["full_apparatus_exterior_shell_region_support_ref_missing"]
      : []),
  ];
  const missingTermBlockers = [
    ...(!evidence.termCoverage.supportStructureStressEnergy
      ? ["full_apparatus_support_structure_stress_energy_missing"]
      : []),
    ...(!evidence.termCoverage.spacerContactStressEnergy
      ? ["full_apparatus_spacer_contact_stress_energy_missing"]
      : []),
    ...(!evidence.termCoverage.activeControlFieldEnergy
      ? ["full_apparatus_active_control_field_energy_missing"]
      : []),
    ...(!evidence.termCoverage.thermalLoadStressEnergy
      ? ["full_apparatus_thermal_load_stress_energy_missing"]
      : []),
    ...(!evidence.termCoverage.patchPotentialElectrostaticStress
      ? ["full_apparatus_patch_potential_electrostatic_stress_missing"]
      : []),
    ...(!evidence.termCoverage.fatigueDamageEvolution
      ? ["full_apparatus_fatigue_damage_evolution_missing"]
      : []),
    ...(!evidence.termCoverage.layerScalingCrossTerms
      ? ["full_apparatus_layer_scaling_cross_terms_missing"]
      : []),
    ...(!evidence.termCoverage.casimirInteractionStressEnergy
      ? ["full_apparatus_casimir_interaction_stress_energy_missing"]
      : []),
    ...(!evidence.termCoverage.materialStrainEnergy
      ? ["full_apparatus_material_strain_energy_missing"]
      : []),
  ];
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["full_apparatus_tensor_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "full_apparatus_tensor_evidence_ref_missing"),
    ...(evidence.tensorValueArtifactRef == null
      ? ["full_apparatus_tensor_value_artifact_ref_missing"]
      : []),
    ...(evidence.tensorValueArtifactContract !==
    "nhm2_tile_source_full_apparatus_tensor_values/v1"
      ? ["full_apparatus_tensor_value_artifact_contract_missing_or_invalid"]
      : []),
    ...(!evidence.sameChart ? ["full_apparatus_tensor_not_same_chart"] : []),
    ...(!evidence.sameBasis ? ["full_apparatus_tensor_not_same_basis"] : []),
    ...(!evidence.sameUnits ? ["full_apparatus_tensor_not_same_units"] : []),
    ...(!evidence.noMetricTargetEcho ? ["full_apparatus_tensor_metric_echo_detected_or_not_checked"] : []),
    ...(!evidence.components.T00 ? ["full_apparatus_T00_missing"] : []),
    ...(!evidence.components.T0i ? ["full_apparatus_T0i_missing"] : []),
    ...(!evidence.components.diagonalTij ? ["full_apparatus_diagonal_Tij_missing"] : []),
    ...(!evidence.components.offDiagonalTij ? ["full_apparatus_off_diagonal_Tij_missing"] : []),
    ...componentRefBlockers,
    ...componentDetailRefBlockers,
    ...missingTermBlockers,
    ...(missingTermBlockers.length > 0 ? ["full_apparatus_tensor_term_coverage_incomplete"] : []),
    ...termRefBlockers,
    ...(!evidence.regionalCoverage.wall ? ["full_apparatus_wall_region_missing"] : []),
    ...(!evidence.regionalCoverage.hull ? ["full_apparatus_hull_region_missing"] : []),
    ...(!evidence.regionalCoverage.exteriorShell ? ["full_apparatus_exterior_shell_region_missing"] : []),
    ...regionalRefBlockers,
  ];
  return {
    surfaceId: "full_apparatus_tensor",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      componentCoverageFraction:
        Object.values(evidence.components).filter(Boolean).length /
        Object.values(evidence.components).length,
      termCoverageFraction:
        Object.values(evidence.termCoverage).filter(Boolean).length /
        Object.values(evidence.termCoverage).length,
      componentRefsAvailable: componentRefBlockers.length === 0 ? 1 : 0,
      componentDetailRefsAvailable: componentDetailRefBlockers.length === 0 ? 1 : 0,
      tensorValueArtifactAvailable:
        evidence.tensorValueArtifactRef != null &&
        evidence.tensorValueArtifactContract ===
          "nhm2_tile_source_full_apparatus_tensor_values/v1"
          ? 1
          : 0,
      termRefsAvailable: termRefBlockers.length === 0 ? 1 : 0,
      regionalSupportRefsAvailable: regionalRefBlockers.length === 0 ? 1 : 0,
    },
    requiredChange,
  };
};

export const buildNhm2TileSourceMaterialEvidenceReceipts = (
  input: BuildNhm2TileSourceMaterialEvidenceReceiptsInput = {},
): Nhm2TileSourceMaterialEvidenceReceiptsV1 => {
  const [fatigueSurface, layerScalingSurface] = fatigueLayerScalingSurfaces(
    input.fatigueLayerScaling,
  );
  const receiptSurfaces = [
    materialCouponSurface(input.materialCoupon),
    forceGapSurface(input.forceGapPullIn),
    roughnessPatchSurface(input.roughnessPatch),
    activeControlSurface(input.activeControl),
    fatigueSurface,
    layerScalingSurface,
    fullApparatusTensorSurface(input.fullApparatusTensor),
  ];
  const suppliedReceiptSurfaces = Object.fromEntries(
    receiptSurfaces.map((surface) => [surface.surfaceId, surface.status === "pass"]),
  ) as Partial<Record<Nhm2LayerStackReceiptSurfaceId, boolean>>;
  const tensorCoverageSource = input.fullApparatusTensor?.termCoverage;
  const tensorTermCoverage: Partial<Nhm2FullApparatusTensorTermCoverageV1> =
    tensorCoverageSource == null
      ? {}
      : {
          supportStructureStressEnergy: tensorCoverageSource.supportStructureStressEnergy,
          spacerContactStressEnergy: tensorCoverageSource.spacerContactStressEnergy,
          activeControlFieldEnergy: tensorCoverageSource.activeControlFieldEnergy,
          thermalLoadStressEnergy: tensorCoverageSource.thermalLoadStressEnergy,
          patchPotentialElectrostaticStress: tensorCoverageSource.patchPotentialElectrostaticStress,
          fatigueDamageEvolution: tensorCoverageSource.fatigueDamageEvolution,
          layerScalingCrossTerms: tensorCoverageSource.layerScalingCrossTerms,
        };
  const tensorAuthorityEvidenceSupplied =
    input.fullApparatusTensor != null &&
    receiptSurfaces.find((surface) => surface.surfaceId === "full_apparatus_tensor")?.status ===
      "pass";
  const falsificationMap = receiptSurfaces.flatMap((surface) =>
    surface.status === "pass"
      ? []
      : surface.blockers.map((blocker) => ({
          blocker,
          surfaceId: surface.surfaceId,
          numericalMargin:
            surface.numericalMargins.stressMargin ??
            surface.numericalMargins.pullInMargin ??
            surface.numericalMargins.asperityMaxMargin ??
            surface.numericalMargins.bandwidthMargin ??
            surface.numericalMargins.cycleMargin ??
            surface.numericalMargins.scalingMargin ??
            surface.numericalMargins.componentCoverageFraction ??
            null,
          marginUnit: "dimensionless_margin",
          requiredChange: surface.requiredChange,
          falsifiesCurrentCandidate: surface.status === "fail",
        })),
  );
  const materialEvidenceReady = receiptSurfaces
    .filter((surface) => surface.surfaceId !== "full_apparatus_tensor")
    .every((surface) => surface.status === "pass");
  const fullApparatusTensorReady =
    receiptSurfaces.find((surface) => surface.surfaceId === "full_apparatus_tensor")?.status ===
    "pass";
  const firstBlocker = falsificationMap[0]?.blocker ?? "none";
  const candidateDisposition =
    receiptSurfaces.some((surface) => surface.status === "fail")
      ? "falsified"
      : materialEvidenceReady && fullApparatusTensorReady
        ? "receipt_ready"
        : "review";
  return {
    contractVersion: NHM2_TILE_SOURCE_MATERIAL_EVIDENCE_RECEIPTS_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
    frozenCandidateId: input.candidateId ?? "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    thresholds: {
      requiredGapMeters: REQUIRED_GAP_METERS,
      materialSafetyFactor: MATERIAL_SAFETY_FACTOR,
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      asperityMaxFractionOfGap: ASPERITY_MAX_FRACTION_OF_GAP,
      materialResponseFrequencyHz: MATERIAL_RESPONSE_FREQUENCY_HZ,
      materialResponseTemperatureK: MATERIAL_RESPONSE_TEMPERATURE_K,
      forceGradientConsistencyMin: FORCE_GRADIENT_CONSISTENCY_MIN,
      patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
      residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      patchVoltageDerivedElectrostaticFractionMax: PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX,
      activeControlAuthorityFactorMin: ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN,
      activeControlBandwidthFactorMin: ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN,
      gapNoiseFractionMax: GAP_NOISE_FRACTION_MAX,
      timingJitterCycleFractionMax: TIMING_JITTER_CYCLE_FRACTION_MAX,
      layerScalingEfficiencyMin: LAYER_SCALING_EFFICIENCY_MIN,
      layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
      activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
      sourceTensorRetentionFractionMin: SOURCE_TENSOR_RETENTION_FRACTION_MIN,
      thermalCycleDriftFractionMax: THERMAL_CYCLE_DRIFT_FRACTION_MAX,
      creepDriftFractionMax: CREEP_DRIFT_FRACTION_MAX,
    },
    receiptSurfaces,
    derivedReceiptInputs: {
      suppliedReceiptSurfaces,
      tensorTermCoverage,
      tensorAuthorityEvidenceSupplied,
    },
    falsificationMap,
    summary: {
      materialEvidenceReady,
      fullApparatusTensorReady,
      sourceAuthorityEvidenceReady: tensorAuthorityEvidenceSupplied,
      firstBlocker,
      candidateDisposition,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      experimentalReceiptBundleOnly: true,
      simulationOnlyIsNotExperimentalValidation: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      fullApparatusTensorRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

const isStatus = (value: unknown): value is Nhm2TileSourceReceiptStatus =>
  typeof value === "string" && ["pass", "review", "fail", "missing"].includes(value);

export const isNhm2TileSourceMaterialEvidenceReceipts = (
  value: unknown,
): value is Nhm2TileSourceMaterialEvidenceReceiptsV1 => {
  if (!isRecord(value)) return false;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_MATERIAL_EVIDENCE_RECEIPTS_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    Array.isArray(value.receiptSurfaces) &&
    value.receiptSurfaces.length === 7 &&
    value.receiptSurfaces.every(
      (surface) =>
        isRecord(surface) &&
        typeof surface.surfaceId === "string" &&
        isStatus(surface.status) &&
        typeof surface.evidenceTier === "string" &&
        (surface.evidenceRef === null || typeof surface.evidenceRef === "string") &&
        Array.isArray(surface.blockers) &&
        isRecord(surface.numericalMargins) &&
        typeof surface.requiredChange === "string",
    ) &&
    isRecord(value.derivedReceiptInputs) &&
    Array.isArray(value.falsificationMap) &&
    summary != null &&
    typeof summary.materialEvidenceReady === "boolean" &&
    typeof summary.fullApparatusTensorReady === "boolean" &&
    typeof summary.sourceAuthorityEvidenceReady === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.experimentalReceiptBundleOnly === true &&
    boundary.simulationOnlyIsNotExperimentalValidation === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.fullApparatusTensorRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false
  );
};
