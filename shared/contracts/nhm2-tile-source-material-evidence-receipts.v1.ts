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
  loadCaseRef?: string | null;
  layerStackCompatibilityRef?: string | null;
  tensileStressCurveRef?: string | null;
  fractureYieldCurveRef?: string | null;
  cryogenicStateRef?: string | null;
  cryogenicCycleRef?: string | null;
  couponFatigueCurveRef?: string | null;
  roughnessMapRef?: string | null;
  fabricationToleranceMapRef?: string | null;
  tensileStressCouponSampleCount?: number | null;
  fractureYieldCouponSampleCount?: number | null;
  cryogenicCycleSampleCount?: number | null;
  couponFatigueCurveSampleCount?: number | null;
  dielectricResponseFrequencySampleCount?: number | null;
  conductivityTemperatureSampleCount?: number | null;
  roughnessMapSampleCount?: number | null;
  fabricationToleranceMapSampleCount?: number | null;
  material: "ultra_high_stress_tin" | "sin" | "aln_alscn" | "custom";
  measuredTensileStressPa: number | null;
  fractureOrYieldStressPa: number | null;
  supportStressPa: number | null;
  couponCycleCountToFailure?: number | null;
  couponRequiredCycleCount?: number | null;
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
  gapMetrologyRef?: string | null;
  forceGapCurveRef?: string | null;
  forceGradientCurveRef?: string | null;
  stiffnessModelRef?: string | null;
  pullInSweepRef?: string | null;
  stictionProtocolRef?: string | null;
  activeControlAuthorityRef?: string | null;
  curveMinGapMeters?: number | null;
  curveMaxGapMeters?: number | null;
  localSampleWindowMeters?: number | null;
  forceGapCurveSampleCountNearOperatingGap?: number | null;
  forceGradientCurveSampleCountNearOperatingGap?: number | null;
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
  gapMetrologyRef?: string | null;
  surfacePairingRef?: string | null;
  roughnessMapRef?: string | null;
  asperityDistributionRef?: string | null;
  asperityTailFitRef?: string | null;
  patchVoltageMapRef?: string | null;
  patchVoltageCalibrationRef?: string | null;
  residualElectrostaticModelRef?: string | null;
  mapLateralResolutionMeters?: number | null;
  roughnessMapSampleCount?: number | null;
  asperityTailSampleCount?: number | null;
  patchVoltageMapSampleCount?: number | null;
  scanAreaFraction?: number | null;
  roughnessRmsMeters: number | null;
  asperityP99Meters: number | null;
  asperityP999Meters?: number | null;
  asperityMaxMeters: number | null;
  patchVoltageRmsVolts: number | null;
  patchVoltageCorrelationLengthMeters?: number | null;
  residualElectrostaticForceFraction: number | null;
  correctionRef?: string | null;
};

export type Nhm2TileSourceActiveControlEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  energyWaveformRef?: string | null;
  actuatorAuthorityTraceRef?: string | null;
  gapSensorCalibrationRef?: string | null;
  controlTransferFunctionRef?: string | null;
  controllerStabilityRef?: string | null;
  gapNoiseTraceRef?: string | null;
  thermalModelRef?: string | null;
  heatSinkCapacityTraceRef?: string | null;
  heatLoadTraceRef?: string | null;
  timingSyncTraceRef?: string | null;
  sectorLightCrossingSyncRef?: string | null;
  sectorBoundaryTimingMapRef?: string | null;
  phaseNoiseSpectrumRef?: string | null;
  lockAcquisitionTraceRef?: string | null;
  energyWaveformSampleCount?: number | null;
  actuatorAuthorityTraceSampleCount?: number | null;
  gapNoiseTraceSampleCount?: number | null;
  heatLoadTraceSampleCount?: number | null;
  timingSyncTraceSampleCount?: number | null;
  phaseNoiseSpectrumBinCount?: number | null;
  lockAcquisitionTrialCount?: number | null;
  energyPerCycleJ: number | null;
  actuatorAuthorityN?: number | null;
  bandwidthHz: number | null;
  switchingRateHz: number | null;
  gapNoiseRmsMeters: number | null;
  noiseSpectrumRef?: string | null;
  heatLoadW: number | null;
  heatSinkCapacityW?: number | null;
  sourceTensorContaminationRef?: string | null;
  sourceTensorContaminationFraction?: number | null;
  timingJitterSeconds: number | null;
  sectorBoundarySkewSeconds?: number | null;
  lightCrossingSyncMargin?: number | null;
  phaseNoiseRmsSeconds?: number | null;
  controllerPhaseMarginDegrees?: number | null;
  controllerGainMarginDb?: number | null;
  lockAcquisitionTimeSeconds?: number | null;
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
  loadSpectrumRef?: string | null;
  cycleProtocolRef?: string | null;
  cryogenicFatigueRef?: string | null;
  fatigueCurveRef?: string | null;
  thermalCycleRef?: string | null;
  creepDriftRef?: string | null;
  delaminationProtocolRef?: string | null;
  interlayerAdhesionRef?: string | null;
  layerScalingMapRef?: string | null;
  perLayerVariationMapRef?: string | null;
  nonadditivityModelRef?: string | null;
  activeAreaMapRef?: string | null;
  supportCouplingMapRef?: string | null;
  electromagneticCouplingMapRef?: string | null;
  mechanicalCouplingMapRef?: string | null;
  multiphysicsCouplingRef?: string | null;
  sourceTensorRetentionMapRef?: string | null;
  layerScalingSampledLayerCount?: number | null;
  perLayerVariationSampledLayerCount?: number | null;
  activeAreaMapSampledLayerCount?: number | null;
  sourceTensorRetentionSampledLayerCount?: number | null;
  supportCouplingSampledInterfaceCount?: number | null;
  electromagneticCouplingSampledInterfaceCount?: number | null;
  mechanicalCouplingSampledInterfaceCount?: number | null;
  cycleCountToFailure: number | null;
  requiredCycleCount: number | null;
  thermalCycleDriftFraction?: number | null;
  creepDriftFraction?: number | null;
  delaminationMargin?: number | null;
  interlayerAdhesionMargin?: number | null;
  layerScalingEfficiency: number | null;
  perLayerVariationFraction?: number | null;
  nonadditivityFraction: number | null;
  activeAreaRetention: number | null;
  supportCouplingFraction?: number | null;
  electromagneticCouplingFraction?: number | null;
  mechanicalCouplingFraction?: number | null;
  sourceTensorRetentionFraction?: number | null;
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
  subsystemReceiptRefs?: {
    materialCoupon?: string | null;
    forceGapPullIn?: string | null;
    roughnessPatch?: string | null;
    activeControl?: string | null;
    fatigueLayerScaling?: string | null;
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
  regionalSampleCounts?: {
    wall?: number | null;
    hull?: number | null;
    exteriorShell?: number | null;
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
    fabricationToleranceMaxMeters: 5e-10;
    roughnessMapLateralResolutionMaxMeters: 5e-10;
    roughnessScanAreaFractionMin: 0.95;
    asperityP99MaxMeters: 2e-9;
    asperityP999MaxMeters: 3e-9;
    asperityMaxFractionOfGap: 0.5;
    materialResponseFrequencyHz: 15e9;
    materialResponseTemperatureK: 4;
    ideal447LayerStackForceAbsN: number;
    forceGradientConsistencyMin: 0.75;
    patchVoltageRmsMaxVolts: 0.01;
    residualElectrostaticForceFractionMax: 0.05;
    patchVoltageDerivedElectrostaticFractionMax: 0.05;
    activeControlAuthorityFactorMin: 1.2;
    activeControlAuthorityMinN: number;
    activeControlBandwidthFactorMin: 2;
    gapNoiseFractionMax: 0.01;
    timingJitterCycleFractionMax: 0.1;
    sectorBoundarySkewMaxSeconds: number;
    lightCrossingSyncMarginMin: 1;
    phaseNoiseCycleFractionMax: 0.05;
    controllerPhaseMarginMinDegrees: 45;
    controllerGainMarginMinDb: 6;
    thermalSinkCapacityFactorMin: 1.2;
    activeControlTimeTraceSampleCountMin: number;
    activeControlPhaseNoiseSpectrumBinCountMin: number;
    activeControlLockAcquisitionTrialCountMin: number;
    layerScalingSampleLayerCountMin: number;
    layerScalingSampleInterfaceCountMin: number;
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
const FABRICATION_TOLERANCE_MAX_METERS = 5e-10;
const ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS = 5e-10;
const ROUGHNESS_SCAN_AREA_FRACTION_MIN = 0.95;
const ROUGHNESS_PATCH_MAP_SAMPLE_COUNT_MIN = 10000;
const ASPERITY_TAIL_SAMPLE_COUNT_MIN = 1000;
const PATCH_VOLTAGE_MAP_SAMPLE_COUNT_MIN = 10000;
const ASPERITY_P99_MAX_METERS = 2e-9;
const ASPERITY_P999_MAX_METERS = 3e-9;
const ASPERITY_MAX_FRACTION_OF_GAP = 0.5;
const MATERIAL_RESPONSE_FREQUENCY_HZ = 15e9;
const MATERIAL_RESPONSE_TEMPERATURE_K = 4;
const MATERIAL_COUPON_MECHANICAL_SAMPLE_COUNT_MIN = 5;
const MATERIAL_COUPON_CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN = 10;
const MATERIAL_COUPON_RESPONSE_SWEEP_SAMPLE_COUNT_MIN = 16;
const MATERIAL_COUPON_SURFACE_MAP_SAMPLE_COUNT_MIN = 10000;
const IDEAL_447_LAYER_STACK_FORCE_ABS_N = 14188.384284280897;
const FORCE_GRADIENT_CONSISTENCY_MIN = 0.75;
const FORCE_GAP_LOCAL_SAMPLE_WINDOW_METERS = 1e-9;
const FORCE_GAP_LOCAL_SAMPLE_COUNT_MIN = 9;
const PATCH_VOLTAGE_RMS_MAX_VOLTS = 0.01;
const RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX = 0.05;
const PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX = 0.05;
const ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN = 1.2;
const ACTIVE_CONTROL_AUTHORITY_MIN_N =
  IDEAL_447_LAYER_STACK_FORCE_ABS_N * ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN;
const ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN = 2;
const GAP_NOISE_FRACTION_MAX = 0.01;
const TIMING_JITTER_CYCLE_FRACTION_MAX = 0.1;
const PHASE_NOISE_CYCLE_FRACTION_MAX = 0.05;
const LIGHT_CROSSING_SYNC_MARGIN_MIN = 1;
const CONTROLLER_PHASE_MARGIN_MIN_DEGREES = 45;
const CONTROLLER_GAIN_MARGIN_MIN_DB = 6;
const THERMAL_SINK_CAPACITY_FACTOR_MIN = 1.2;
const ACTIVE_CONTROL_SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX = 0.05;
const ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN = 4096;
const ACTIVE_CONTROL_PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN = 512;
const ACTIVE_CONTROL_LOCK_ACQUISITION_TRIAL_COUNT_MIN = 100;
const SWITCHING_RATE_HZ = 15e9;
const LAYER_SCALING_EFFICIENCY_MIN = 0.9;
const LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN = 447;
const LAYER_SCALING_SAMPLE_INTERFACE_COUNT_MIN = 446;
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

const lowerBoundMargin = (minimum: number, value: number | null | undefined): number | null => {
  if (value == null || !Number.isFinite(value)) return null;
  return round(value / minimum);
};

const isPositiveFinite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isPositiveInteger = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value > 0;

const isNonNegativeFinite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isUnitFraction = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

const upperBoundUnitFractionMargin = (
  limit: number,
  value: number | null | undefined,
): number | null => {
  if (!isUnitFraction(value)) return null;
  return value === 0 ? Number.MAX_SAFE_INTEGER : round(limit / value);
};

const upperBoundFiniteMargin = (
  limit: number,
  value: number | null | undefined,
): number | null => {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return value === 0 ? Number.MAX_SAFE_INTEGER : round(limit / value);
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
    isPositiveFinite(supportStressPa) ? supportStressPa * MATERIAL_SAFETY_FACTOR : null;
  const stressMargin =
    !isPositiveFinite(evidence.fractureOrYieldStressPa) || requiredStressPa == null
      ? null
      : evidence.fractureOrYieldStressPa / requiredStressPa;
  const tensileStressMargin =
    !isPositiveFinite(evidence.measuredTensileStressPa) || !isPositiveFinite(supportStressPa)
      ? null
      : round(evidence.measuredTensileStressPa / supportStressPa);
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
  const couponFatigueCycleMargin =
    evidence.couponCycleCountToFailure == null ||
    evidence.couponRequiredCycleCount == null ||
    evidence.couponRequiredCycleCount <= 0
      ? null
      : round(evidence.couponCycleCountToFailure / evidence.couponRequiredCycleCount);
  const tensileStressCouponSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_MECHANICAL_SAMPLE_COUNT_MIN,
    evidence.tensileStressCouponSampleCount,
  );
  const fractureYieldCouponSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_MECHANICAL_SAMPLE_COUNT_MIN,
    evidence.fractureYieldCouponSampleCount,
  );
  const cryogenicCycleSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_CRYOGENIC_CYCLE_SAMPLE_COUNT_MIN,
    evidence.cryogenicCycleSampleCount,
  );
  const couponFatigueCurveSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_MECHANICAL_SAMPLE_COUNT_MIN,
    evidence.couponFatigueCurveSampleCount,
  );
  const dielectricResponseFrequencySampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
    evidence.dielectricResponseFrequencySampleCount,
  );
  const conductivityTemperatureSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_RESPONSE_SWEEP_SAMPLE_COUNT_MIN,
    evidence.conductivityTemperatureSampleCount,
  );
  const roughnessMapSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_SURFACE_MAP_SAMPLE_COUNT_MIN,
    evidence.roughnessMapSampleCount,
  );
  const fabricationToleranceMapSampleCountMargin = lowerBoundMargin(
    MATERIAL_COUPON_SURFACE_MAP_SAMPLE_COUNT_MIN,
    evidence.fabricationToleranceMapSampleCount,
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
  const fabricationToleranceMargin =
    evidence.fabricationToleranceMeters == null || evidence.fabricationToleranceMeters <= 0
      ? null
      : round(FABRICATION_TOLERANCE_MAX_METERS / evidence.fabricationToleranceMeters);
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["material_coupon_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "material_coupon_evidence_ref_missing"),
    ...(evidence.loadCaseRef == null ? ["candidate_stack_load_case_ref_missing"] : []),
    ...(evidence.layerStackCompatibilityRef == null
      ? ["candidate_stack_layer_compatibility_ref_missing"]
      : []),
    ...(evidence.tensileStressCurveRef == null ? ["tensile_stress_curve_ref_missing"] : []),
    ...(evidence.fractureYieldCurveRef == null ? ["fracture_yield_curve_ref_missing"] : []),
    ...(evidence.cryogenicStateRef == null ? ["cryogenic_state_ref_missing"] : []),
    ...(evidence.cryogenicCycleRef == null ? ["cryogenic_cycle_ref_missing"] : []),
    ...(evidence.couponFatigueCurveRef == null ? ["coupon_fatigue_curve_ref_missing"] : []),
    ...(evidence.roughnessMapRef == null ? ["coupon_roughness_map_ref_missing"] : []),
    ...(evidence.fabricationToleranceMapRef == null ? ["fabrication_tolerance_map_ref_missing"] : []),
    ...(evidence.tensileStressCouponSampleCount == null
      ? ["tensile_stress_coupon_sample_count_missing"]
      : !isPositiveInteger(evidence.tensileStressCouponSampleCount)
        ? ["tensile_stress_coupon_sample_count_invalid"]
        : tensileStressCouponSampleCountMargin == null ||
            tensileStressCouponSampleCountMargin < 1
          ? ["tensile_stress_coupon_sample_count_below_5"]
          : []),
    ...(evidence.fractureYieldCouponSampleCount == null
      ? ["fracture_yield_coupon_sample_count_missing"]
      : !isPositiveInteger(evidence.fractureYieldCouponSampleCount)
        ? ["fracture_yield_coupon_sample_count_invalid"]
        : fractureYieldCouponSampleCountMargin == null ||
            fractureYieldCouponSampleCountMargin < 1
          ? ["fracture_yield_coupon_sample_count_below_5"]
          : []),
    ...(evidence.cryogenicCycleSampleCount == null
      ? ["cryogenic_cycle_sample_count_missing"]
      : !isPositiveInteger(evidence.cryogenicCycleSampleCount)
        ? ["cryogenic_cycle_sample_count_invalid"]
        : cryogenicCycleSampleCountMargin == null || cryogenicCycleSampleCountMargin < 1
          ? ["cryogenic_cycle_sample_count_below_10"]
          : []),
    ...(evidence.couponFatigueCurveSampleCount == null
      ? ["coupon_fatigue_curve_sample_count_missing"]
      : !isPositiveInteger(evidence.couponFatigueCurveSampleCount)
        ? ["coupon_fatigue_curve_sample_count_invalid"]
        : couponFatigueCurveSampleCountMargin == null ||
            couponFatigueCurveSampleCountMargin < 1
          ? ["coupon_fatigue_curve_sample_count_below_5"]
          : []),
    ...(evidence.dielectricResponseFrequencySampleCount == null
      ? ["dielectric_response_frequency_sample_count_missing"]
      : !isPositiveInteger(evidence.dielectricResponseFrequencySampleCount)
        ? ["dielectric_response_frequency_sample_count_invalid"]
        : dielectricResponseFrequencySampleCountMargin == null ||
            dielectricResponseFrequencySampleCountMargin < 1
          ? ["dielectric_response_frequency_sample_count_below_16"]
          : []),
    ...(evidence.conductivityTemperatureSampleCount == null
      ? ["conductivity_temperature_sample_count_missing"]
      : !isPositiveInteger(evidence.conductivityTemperatureSampleCount)
        ? ["conductivity_temperature_sample_count_invalid"]
        : conductivityTemperatureSampleCountMargin == null ||
            conductivityTemperatureSampleCountMargin < 1
          ? ["conductivity_temperature_sample_count_below_16"]
          : []),
    ...(evidence.roughnessMapSampleCount == null
      ? ["coupon_roughness_map_sample_count_missing"]
      : !isPositiveInteger(evidence.roughnessMapSampleCount)
        ? ["coupon_roughness_map_sample_count_invalid"]
        : roughnessMapSampleCountMargin == null || roughnessMapSampleCountMargin < 1
          ? ["coupon_roughness_map_sample_count_below_10000"]
          : []),
    ...(evidence.fabricationToleranceMapSampleCount == null
      ? ["fabrication_tolerance_map_sample_count_missing"]
      : !isPositiveInteger(evidence.fabricationToleranceMapSampleCount)
        ? ["fabrication_tolerance_map_sample_count_invalid"]
        : fabricationToleranceMapSampleCountMargin == null ||
            fabricationToleranceMapSampleCountMargin < 1
          ? ["fabrication_tolerance_map_sample_count_below_10000"]
          : []),
    ...(evidence.material !== "ultra_high_stress_tin" ? ["candidate_material_mismatch"] : []),
    ...(evidence.supportStressPa != null && !isPositiveFinite(evidence.supportStressPa)
      ? ["support_stress_invalid"]
      : []),
    ...(evidence.fractureOrYieldStressPa != null &&
    !isPositiveFinite(evidence.fractureOrYieldStressPa)
      ? ["fracture_or_yield_stress_invalid"]
      : []),
    ...(stressMargin == null ? ["fracture_or_yield_margin_missing"] : stressMargin < 1 ? ["fracture_or_yield_margin_below_2x_support_stress"] : []),
    ...(evidence.measuredTensileStressPa != null &&
    !isPositiveFinite(evidence.measuredTensileStressPa)
      ? ["measured_tensile_stress_invalid"]
      : []),
    ...(tensileStressMargin == null
      ? ["measured_tensile_stress_missing"]
      : tensileStressMargin < 1
        ? ["measured_tensile_stress_below_support_stress"]
        : []),
    ...(couponFatigueCycleMargin == null
      ? ["coupon_fatigue_cycle_margin_missing"]
      : couponFatigueCycleMargin < 1
        ? ["coupon_fatigue_cycle_margin_below_required_campaign_cycles"]
        : []),
    ...(evidence.cryogenicTemperatureK != null && !isPositiveFinite(evidence.cryogenicTemperatureK)
      ? ["cryogenic_temperature_invalid"]
      : []),
    ...(evidence.cryogenicTemperatureK == null ||
    !isPositiveFinite(evidence.cryogenicTemperatureK) ||
    evidence.cryogenicTemperatureK > 4 ? ["cryogenic_4k_coupon_receipt_missing"] : []),
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
    ...(evidence.roughnessRmsMeters != null &&
    !isNonNegativeFinite(evidence.roughnessRmsMeters)
      ? ["coupon_roughness_rms_invalid"]
      : []),
    ...(evidence.roughnessRmsMeters == null ||
    !isNonNegativeFinite(evidence.roughnessRmsMeters) ||
    evidence.roughnessRmsMeters > ROUGHNESS_RMS_MAX_METERS ? ["coupon_roughness_rms_above_0p1nm_or_missing"] : []),
    ...(fabricationToleranceMargin == null
      ? ["fabrication_tolerance_receipt_missing"]
      : fabricationToleranceMargin < 1
        ? ["fabrication_tolerance_above_0p5nm"]
        : []),
  ];
  return {
    surfaceId: "material_coupon",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      stressMargin,
      tensileStressMargin,
      requiredStressPa,
      supportStressPa,
      measuredTensileStressPa: evidence.measuredTensileStressPa,
      couponFatigueCycleMargin,
      couponCycleCountToFailure: evidence.couponCycleCountToFailure ?? null,
      couponRequiredCycleCount: evidence.couponRequiredCycleCount ?? null,
      tensileStressCouponSampleCount: evidence.tensileStressCouponSampleCount ?? null,
      tensileStressCouponSampleCountMargin,
      fractureYieldCouponSampleCount: evidence.fractureYieldCouponSampleCount ?? null,
      fractureYieldCouponSampleCountMargin,
      cryogenicCycleSampleCount: evidence.cryogenicCycleSampleCount ?? null,
      cryogenicCycleSampleCountMargin,
      couponFatigueCurveSampleCount: evidence.couponFatigueCurveSampleCount ?? null,
      couponFatigueCurveSampleCountMargin,
      materialResponseFrequencyMargin,
      dielectricResponseFrequencySampleCount:
        evidence.dielectricResponseFrequencySampleCount ?? null,
      dielectricResponseFrequencySampleCountMargin,
      dielectricTemperatureMargin,
      conductivityTemperatureSampleCount: evidence.conductivityTemperatureSampleCount ?? null,
      conductivityTemperatureSampleCountMargin,
      conductivityTemperatureMargin,
      dielectricLossTangent: evidence.dielectricLossTangent ?? null,
      conductivitySiemensPerMeter: evidence.conductivitySiemensPerMeter ?? null,
      materialResponseValuesAvailable: materialResponseValuesAvailable ? 1 : 0,
      roughnessRmsMeters: evidence.roughnessRmsMeters,
      roughnessMapSampleCount: evidence.roughnessMapSampleCount ?? null,
      roughnessMapSampleCountMargin,
      fabricationToleranceMargin,
      fabricationToleranceMeters: evidence.fabricationToleranceMeters,
      fabricationToleranceMapSampleCount: evidence.fabricationToleranceMapSampleCount ?? null,
      fabricationToleranceMapSampleCountMargin,
      couponSamplingComplete: couponSamplingComplete ? 1 : 0,
      couponProvenanceRefsAvailable:
        evidence.loadCaseRef != null &&
        evidence.layerStackCompatibilityRef != null &&
        evidence.tensileStressCurveRef != null &&
        evidence.fractureYieldCurveRef != null &&
        evidence.cryogenicStateRef != null &&
        evidence.cryogenicCycleRef != null &&
        evidence.couponFatigueCurveRef != null &&
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
  const gapAtOperatingPoint =
    isPositiveFinite(evidence.gapMeters) &&
    Math.abs(evidence.gapMeters - REQUIRED_GAP_METERS) <= 1e-12;
  const forceMagnitudeValid =
    typeof evidence.casimirForceN === "number" &&
    Number.isFinite(evidence.casimirForceN) &&
    evidence.casimirForceN !== 0;
  const forceGradientValid = isPositiveFinite(evidence.forceGradientNPerM);
  const springConstantValid = isPositiveFinite(evidence.effectiveSpringConstantNPerM);
  const stictionMarginValid = isPositiveFinite(evidence.stictionMargin);
  const activeAuthorityValid = isPositiveFinite(evidence.activeGapControlAuthorityN);
  const curveBoundsValid =
    isPositiveFinite(evidence.curveMinGapMeters) &&
    isPositiveFinite(evidence.curveMaxGapMeters) &&
    evidence.curveMinGapMeters <= evidence.curveMaxGapMeters;
  const localSampleWindowValid = isPositiveFinite(evidence.localSampleWindowMeters);
  const localSampleWindowMargin =
    !localSampleWindowValid
      ? null
      : round(evidence.localSampleWindowMeters / FORCE_GAP_LOCAL_SAMPLE_WINDOW_METERS);
  const forceGapCurveSampleCountValid = isPositiveInteger(
    evidence.forceGapCurveSampleCountNearOperatingGap,
  );
  const forceGradientCurveSampleCountValid = isPositiveInteger(
    evidence.forceGradientCurveSampleCountNearOperatingGap,
  );
  const forceGapCurveLocalSampleMargin =
    !forceGapCurveSampleCountValid
      ? null
      : round(
          evidence.forceGapCurveSampleCountNearOperatingGap /
            FORCE_GAP_LOCAL_SAMPLE_COUNT_MIN,
        );
  const forceGradientCurveLocalSampleMargin =
    !forceGradientCurveSampleCountValid
      ? null
      : round(
          evidence.forceGradientCurveSampleCountNearOperatingGap /
            FORCE_GAP_LOCAL_SAMPLE_COUNT_MIN,
        );
  const pullInMargin =
    !springConstantValid || !forceGradientValid
      ? null
      : evidence.effectiveSpringConstantNPerM / evidence.forceGradientNPerM;
  const activeAuthorityMargin =
    !activeAuthorityValid || !forceMagnitudeValid
      ? null
      : evidence.activeGapControlAuthorityN /
        (Math.abs(evidence.casimirForceN) * ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN);
  const expectedGradientFromSuppliedForce =
    !forceMagnitudeValid
      ? null
      : round((4 * Math.abs(evidence.casimirForceN)) / REQUIRED_GAP_METERS);
  const forceGradientConsistencyMargin = symmetricRatioMargin(
    evidence.forceGradientNPerM,
    expectedGradientFromSuppliedForce,
  );
  const curveBracketsOperatingGap =
    curveBoundsValid &&
    evidence.curveMinGapMeters <= REQUIRED_GAP_METERS &&
    evidence.curveMaxGapMeters >= REQUIRED_GAP_METERS;
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["force_gap_tier_not_measured_or_validated"] : []),
    ...evidenceRefBlocker(evidence, "force_gap_evidence_ref_missing"),
    ...(evidence.gapMetrologyRef == null ? ["force_gap_metrology_ref_missing"] : []),
    ...(evidence.forceGapCurveRef == null ? ["force_gap_curve_ref_missing"] : []),
    ...(evidence.forceGradientCurveRef == null ? ["force_gradient_curve_ref_missing"] : []),
    ...(evidence.stiffnessModelRef == null ? ["force_gap_stiffness_model_ref_missing"] : []),
    ...(evidence.pullInSweepRef == null ? ["pull_in_sweep_ref_missing"] : []),
    ...(evidence.stictionProtocolRef == null ? ["stiction_protocol_ref_missing"] : []),
    ...(evidence.activeControlAuthorityRef == null
      ? ["active_gap_control_authority_ref_missing"]
      : []),
    ...(evidence.curveMinGapMeters != null || evidence.curveMaxGapMeters != null
      ? curveBoundsValid
        ? []
        : ["force_gap_curve_bounds_invalid"]
      : []),
    ...(!curveBracketsOperatingGap ? ["force_gap_curve_does_not_bracket_8nm"] : []),
    ...(evidence.localSampleWindowMeters == null
      ? ["force_gap_local_sample_window_missing"]
      : !localSampleWindowValid
        ? ["force_gap_local_sample_window_invalid"]
        : localSampleWindowMargin == null || localSampleWindowMargin < 1
          ? ["force_gap_local_sample_window_below_1nm"]
          : []),
    ...(evidence.forceGapCurveSampleCountNearOperatingGap == null
      ? ["force_gap_curve_local_sample_count_missing"]
      : !forceGapCurveSampleCountValid
        ? ["force_gap_curve_local_sample_count_invalid"]
        : forceGapCurveLocalSampleMargin == null || forceGapCurveLocalSampleMargin < 1
          ? ["force_gap_curve_local_sample_count_below_9"]
          : []),
    ...(evidence.forceGradientCurveSampleCountNearOperatingGap == null
      ? ["force_gradient_curve_local_sample_count_missing"]
      : !forceGradientCurveSampleCountValid
        ? ["force_gradient_curve_local_sample_count_invalid"]
        : forceGradientCurveLocalSampleMargin == null ||
            forceGradientCurveLocalSampleMargin < 1
          ? ["force_gradient_curve_local_sample_count_below_9"]
          : []),
    ...(evidence.gapMeters != null && !isPositiveFinite(evidence.gapMeters)
      ? ["force_gap_value_invalid"]
      : []),
    ...(!gapAtOperatingPoint ? ["force_gap_not_at_8nm"] : []),
    ...(evidence.casimirForceN == null
      ? ["casimir_force_at_gap_missing"]
      : !forceMagnitudeValid
        ? ["casimir_force_at_gap_invalid"]
        : []),
    ...(evidence.forceGradientNPerM != null && !forceGradientValid
      ? ["force_gradient_at_gap_invalid"]
      : []),
    ...(forceGradientConsistencyMargin == null
      ? ["force_gradient_consistency_with_force_curve_missing"]
      : forceGradientConsistencyMargin < FORCE_GRADIENT_CONSISTENCY_MIN
        ? ["force_gradient_inconsistent_with_force_curve_at_8nm"]
        : []),
    ...(evidence.effectiveSpringConstantNPerM != null && !springConstantValid
      ? ["effective_spring_constant_invalid"]
      : []),
    ...(pullInMargin == null ? ["pull_in_margin_missing"] : pullInMargin < 1 ? ["pull_in_margin_below_one"] : []),
    ...(evidence.stictionMargin == null
      ? ["stiction_margin_missing"]
      : !stictionMarginValid
        ? ["stiction_margin_invalid"]
        : evidence.stictionMargin < 1
          ? ["stiction_margin_below_one"]
          : []),
    ...(evidence.activeGapControlAuthorityN != null && !activeAuthorityValid
      ? ["active_gap_control_authority_invalid"]
      : []),
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
      curveMinGapMeters: evidence.curveMinGapMeters ?? null,
      curveMaxGapMeters: evidence.curveMaxGapMeters ?? null,
      curveBracketsOperatingGap: curveBracketsOperatingGap ? 1 : 0,
      localSampleWindowMeters: evidence.localSampleWindowMeters ?? null,
      localSampleWindowMargin,
      forceGapCurveSampleCountNearOperatingGap:
        evidence.forceGapCurveSampleCountNearOperatingGap ?? null,
      forceGapCurveLocalSampleMargin,
      forceGradientCurveSampleCountNearOperatingGap:
        evidence.forceGradientCurveSampleCountNearOperatingGap ?? null,
      forceGradientCurveLocalSampleMargin,
      curveRefsAvailable:
        evidence.gapMetrologyRef != null &&
        evidence.forceGapCurveRef != null &&
        evidence.forceGradientCurveRef != null &&
        evidence.stiffnessModelRef != null &&
        evidence.pullInSweepRef != null &&
        evidence.stictionProtocolRef != null &&
        evidence.activeControlAuthorityRef != null
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
    "Supply measured or validated paired-surface 8 nm gap metrology, roughness maps, asperity-tail fits, patch-voltage calibration, and residual electrostatic correction maps for the operating stack.";
  if (evidence == null) {
    return missingSurface("roughness_patch_metrology", "roughness_asperity_tail_and_patch_potential_map_missing", requiredChange);
  }
  const roughnessMapResolutionValid = isPositiveFinite(evidence.mapLateralResolutionMeters);
  const roughnessMapSampleCountValid = isPositiveInteger(evidence.roughnessMapSampleCount);
  const asperityTailSampleCountValid = isPositiveInteger(evidence.asperityTailSampleCount);
  const patchVoltageMapSampleCountValid = isPositiveInteger(evidence.patchVoltageMapSampleCount);
  const scanAreaFractionValid =
    typeof evidence.scanAreaFraction === "number" &&
    Number.isFinite(evidence.scanAreaFraction) &&
    evidence.scanAreaFraction > 0 &&
    evidence.scanAreaFraction <= 1;
  const roughnessRmsValid = isNonNegativeFinite(evidence.roughnessRmsMeters);
  const asperityP99Valid = isPositiveFinite(evidence.asperityP99Meters);
  const asperityP999Valid = isPositiveFinite(evidence.asperityP999Meters);
  const asperityMaxValid = isPositiveFinite(evidence.asperityMaxMeters);
  const patchVoltageRmsValid = isNonNegativeFinite(evidence.patchVoltageRmsVolts);
  const patchVoltageCorrelationLengthValid = isPositiveFinite(
    evidence.patchVoltageCorrelationLengthMeters,
  );
  const residualElectrostaticForceFractionValid = isNonNegativeFinite(
    evidence.residualElectrostaticForceFraction,
  );
  const roughnessMapResolutionMargin =
    !roughnessMapResolutionValid
      ? null
      : round(ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS / evidence.mapLateralResolutionMeters);
  const roughnessMapSampleCountMargin =
    !roughnessMapSampleCountValid
      ? null
      : round(evidence.roughnessMapSampleCount / ROUGHNESS_PATCH_MAP_SAMPLE_COUNT_MIN);
  const asperityTailSampleCountMargin =
    !asperityTailSampleCountValid
      ? null
      : round(evidence.asperityTailSampleCount / ASPERITY_TAIL_SAMPLE_COUNT_MIN);
  const patchVoltageMapSampleCountMargin =
    !patchVoltageMapSampleCountValid
      ? null
      : round(evidence.patchVoltageMapSampleCount / PATCH_VOLTAGE_MAP_SAMPLE_COUNT_MIN);
  const scanAreaCoverageMargin =
    !scanAreaFractionValid
      ? null
      : round(evidence.scanAreaFraction / ROUGHNESS_SCAN_AREA_FRACTION_MIN);
  const asperityP99Margin =
    !asperityP99Valid
      ? null
      : round(ASPERITY_P99_MAX_METERS / evidence.asperityP99Meters);
  const asperityP999Margin =
    !asperityP999Valid
      ? null
      : round(ASPERITY_P999_MAX_METERS / evidence.asperityP999Meters);
  const asperityMaxMargin =
    !asperityMaxValid
      ? null
      : (REQUIRED_GAP_METERS * ASPERITY_MAX_FRACTION_OF_GAP) / evidence.asperityMaxMeters;
  const idealCasimirPressureAbsPa =
    (Math.PI ** 2 * HBAR_SI * C_SI) / (240 * REQUIRED_GAP_METERS ** 4);
  const patchVoltageDerivedElectrostaticPressurePa =
    !patchVoltageRmsValid
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
    ...(evidence.gapMetrologyRef == null ? ["roughness_gap_metrology_ref_missing"] : []),
    ...(evidence.surfacePairingRef == null ? ["roughness_surface_pairing_ref_missing"] : []),
    ...(evidence.roughnessMapRef == null ? ["roughness_map_ref_missing"] : []),
    ...(evidence.asperityDistributionRef == null ? ["asperity_tail_distribution_ref_missing"] : []),
    ...(evidence.asperityTailFitRef == null ? ["asperity_tail_fit_ref_missing"] : []),
    ...(evidence.patchVoltageMapRef == null ? ["patch_voltage_map_ref_missing"] : []),
    ...(evidence.patchVoltageCalibrationRef == null
      ? ["patch_voltage_calibration_ref_missing"]
      : []),
    ...(evidence.residualElectrostaticModelRef == null
      ? ["residual_electrostatic_model_ref_missing"]
      : []),
    ...(evidence.mapLateralResolutionMeters != null && !roughnessMapResolutionValid
      ? ["roughness_map_lateral_resolution_invalid"]
      : []),
    ...(roughnessMapResolutionMargin == null
      ? ["roughness_map_lateral_resolution_missing"]
      : roughnessMapResolutionMargin < 1
        ? ["roughness_map_lateral_resolution_above_0p5nm"]
        : []),
    ...(evidence.roughnessMapSampleCount == null
      ? ["roughness_map_sample_count_missing"]
      : !roughnessMapSampleCountValid
        ? ["roughness_map_sample_count_invalid"]
        : roughnessMapSampleCountMargin == null || roughnessMapSampleCountMargin < 1
          ? ["roughness_map_sample_count_below_10000"]
          : []),
    ...(evidence.asperityTailSampleCount == null
      ? ["asperity_tail_sample_count_missing"]
      : !asperityTailSampleCountValid
        ? ["asperity_tail_sample_count_invalid"]
        : asperityTailSampleCountMargin == null || asperityTailSampleCountMargin < 1
          ? ["asperity_tail_sample_count_below_1000"]
          : []),
    ...(evidence.patchVoltageMapSampleCount == null
      ? ["patch_voltage_map_sample_count_missing"]
      : !patchVoltageMapSampleCountValid
        ? ["patch_voltage_map_sample_count_invalid"]
        : patchVoltageMapSampleCountMargin == null ||
            patchVoltageMapSampleCountMargin < 1
          ? ["patch_voltage_map_sample_count_below_10000"]
          : []),
    ...(evidence.scanAreaFraction != null && !scanAreaFractionValid
      ? ["roughness_scan_area_fraction_invalid"]
      : []),
    ...(scanAreaCoverageMargin == null
      ? ["roughness_scan_area_fraction_missing"]
      : scanAreaCoverageMargin < 1
        ? ["roughness_scan_area_fraction_below_0p95"]
        : []),
    ...(evidence.roughnessRmsMeters != null && !roughnessRmsValid
      ? ["roughness_rms_invalid"]
      : []),
    ...(evidence.roughnessRmsMeters == null ||
    !roughnessRmsValid ||
    evidence.roughnessRmsMeters > ROUGHNESS_RMS_MAX_METERS
      ? ["roughness_rms_above_0p1nm_or_missing"]
      : []),
    ...(evidence.asperityP99Meters != null && !asperityP99Valid
      ? ["asperity_p99_invalid"]
      : []),
    ...(asperityP99Margin == null
      ? ["asperity_p99_missing"]
      : asperityP99Margin < 1
        ? ["asperity_p99_above_2nm"]
        : []),
    ...(evidence.asperityP999Meters != null && !asperityP999Valid
      ? ["asperity_p999_invalid"]
      : []),
    ...(asperityP999Margin == null
      ? ["asperity_p999_missing"]
      : asperityP999Margin < 1
        ? ["asperity_p999_above_3nm"]
        : []),
    ...(evidence.asperityMaxMeters != null && !asperityMaxValid
      ? ["asperity_tail_margin_invalid"]
      : []),
    ...(asperityMaxMargin == null ? ["asperity_tail_margin_missing"] : asperityMaxMargin < 1 ? ["asperity_tail_exceeds_half_gap"] : []),
    ...(evidence.patchVoltageCorrelationLengthMeters != null &&
    !patchVoltageCorrelationLengthValid
      ? ["patch_voltage_correlation_length_invalid"]
      : []),
    ...(evidence.patchVoltageCorrelationLengthMeters == null ||
    !patchVoltageCorrelationLengthValid
      ? ["patch_voltage_correlation_length_missing"]
      : []),
    ...(evidence.patchVoltageRmsVolts != null && !patchVoltageRmsValid
      ? ["patch_voltage_rms_invalid"]
      : []),
    ...(evidence.patchVoltageRmsVolts == null ||
    !patchVoltageRmsValid ||
    evidence.patchVoltageRmsVolts > PATCH_VOLTAGE_RMS_MAX_VOLTS
      ? ["patch_voltage_rms_above_10mv_or_missing"]
      : []),
    ...(evidence.residualElectrostaticForceFraction != null &&
    !residualElectrostaticForceFractionValid
      ? ["residual_electrostatic_force_fraction_invalid"]
      : []),
    ...(evidence.residualElectrostaticForceFraction == null ||
    !residualElectrostaticForceFractionValid ||
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
      roughnessMapResolutionMargin,
      roughnessMapSampleCount: evidence.roughnessMapSampleCount ?? null,
      roughnessMapSampleCountMargin,
      asperityTailSampleCount: evidence.asperityTailSampleCount ?? null,
      asperityTailSampleCountMargin,
      patchVoltageMapSampleCount: evidence.patchVoltageMapSampleCount ?? null,
      patchVoltageMapSampleCountMargin,
      scanAreaCoverageMargin,
      asperityP99Margin,
      asperityP999Margin,
      asperityMaxMargin,
      mapLateralResolutionMeters: evidence.mapLateralResolutionMeters ?? null,
      scanAreaFraction: evidence.scanAreaFraction ?? null,
      asperityP999Meters: evidence.asperityP999Meters ?? null,
      patchVoltageRmsVolts: evidence.patchVoltageRmsVolts,
      patchVoltageCorrelationLengthMeters:
        evidence.patchVoltageCorrelationLengthMeters ?? null,
      residualElectrostaticForceFraction: evidence.residualElectrostaticForceFraction,
      patchVoltageDerivedElectrostaticPressurePa,
      patchVoltageDerivedElectrostaticForceFraction,
      patchVoltageDerivedElectrostaticMargin,
      mapRefsAvailable:
        evidence.gapMetrologyRef != null &&
        evidence.surfacePairingRef != null &&
        evidence.roughnessMapRef != null &&
        evidence.asperityDistributionRef != null &&
        evidence.asperityTailFitRef != null &&
        evidence.patchVoltageMapRef != null &&
        evidence.patchVoltageCalibrationRef != null &&
        evidence.residualElectrostaticModelRef != null
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
    "Supply active-control actuator authority, sensor calibration, energy waveform, controller transfer/stability, noise spectrum/trace, thermal sink, heat-load trace, timing synchronization, phase-noise, lock-acquisition, and failure-mode receipts.";
  if (evidence == null) {
    return missingSurface("active_control_energy", "active_gap_control_energy_and_noise_missing", requiredChange);
  }
  const energyPerCycleValid = isPositiveFinite(evidence.energyPerCycleJ);
  const actuatorAuthorityValid = isPositiveFinite(evidence.actuatorAuthorityN);
  const switchingRateValid = isPositiveFinite(evidence.switchingRateHz);
  const bandwidthValid = isPositiveFinite(evidence.bandwidthHz);
  const gapNoiseValid = isPositiveFinite(evidence.gapNoiseRmsMeters);
  const timingJitterValid = isPositiveFinite(evidence.timingJitterSeconds);
  const sectorBoundarySkewValid = isNonNegativeFinite(evidence.sectorBoundarySkewSeconds);
  const lightCrossingSyncMarginValid = isPositiveFinite(evidence.lightCrossingSyncMargin);
  const phaseNoiseValid = isPositiveFinite(evidence.phaseNoiseRmsSeconds);
  const controllerPhaseMarginValid = isPositiveFinite(evidence.controllerPhaseMarginDegrees);
  const controllerGainMarginValid = isPositiveFinite(evidence.controllerGainMarginDb);
  const heatLoadValid = isNonNegativeFinite(evidence.heatLoadW);
  const heatSinkCapacityValid = isPositiveFinite(evidence.heatSinkCapacityW);
  const sourceTensorContaminationValid = isUnitFraction(
    evidence.sourceTensorContaminationFraction,
  );
  const lockAcquisitionTimeValid = isPositiveFinite(evidence.lockAcquisitionTimeSeconds);
  const energyWaveformSampleCountValid = isPositiveInteger(evidence.energyWaveformSampleCount);
  const actuatorAuthorityTraceSampleCountValid = isPositiveInteger(
    evidence.actuatorAuthorityTraceSampleCount,
  );
  const gapNoiseTraceSampleCountValid = isPositiveInteger(evidence.gapNoiseTraceSampleCount);
  const heatLoadTraceSampleCountValid = isPositiveInteger(evidence.heatLoadTraceSampleCount);
  const timingSyncTraceSampleCountValid = isPositiveInteger(evidence.timingSyncTraceSampleCount);
  const phaseNoiseSpectrumBinCountValid = isPositiveInteger(
    evidence.phaseNoiseSpectrumBinCount,
  );
  const lockAcquisitionTrialCountValid = isPositiveInteger(evidence.lockAcquisitionTrialCount);
  const energyPerCycleJ = energyPerCycleValid ? evidence.energyPerCycleJ : null;
  const actuatorAuthorityN = actuatorAuthorityValid ? evidence.actuatorAuthorityN : null;
  const switchingRateHz = switchingRateValid ? evidence.switchingRateHz : null;
  const bandwidthHz = bandwidthValid ? evidence.bandwidthHz : null;
  const gapNoiseRmsMeters = gapNoiseValid ? evidence.gapNoiseRmsMeters : null;
  const timingJitterSeconds = timingJitterValid ? evidence.timingJitterSeconds : null;
  const phaseNoiseRmsSeconds = phaseNoiseValid ? evidence.phaseNoiseRmsSeconds : null;
  const controllerPhaseMarginDegrees = controllerPhaseMarginValid
    ? evidence.controllerPhaseMarginDegrees
    : null;
  const controllerGainMarginDb = controllerGainMarginValid
    ? evidence.controllerGainMarginDb
    : null;
  const heatLoadW = heatLoadValid ? evidence.heatLoadW : null;
  const heatSinkCapacityW = heatSinkCapacityValid ? evidence.heatSinkCapacityW : null;
  const bandwidthMargin =
    bandwidthHz == null || switchingRateHz == null
      ? null
      : bandwidthHz / (switchingRateHz * ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN);
  const noiseMargin =
    gapNoiseRmsMeters == null
      ? null
      : (REQUIRED_GAP_METERS * GAP_NOISE_FRACTION_MAX) / gapNoiseRmsMeters;
  const timingMargin =
    timingJitterSeconds == null || switchingRateHz == null
      ? null
      : (TIMING_JITTER_CYCLE_FRACTION_MAX / switchingRateHz) / timingJitterSeconds;
  const sectorBoundarySkewMargin =
    switchingRateHz == null
      ? null
      : upperBoundFiniteMargin(
          TIMING_JITTER_CYCLE_FRACTION_MAX / switchingRateHz,
          evidence.sectorBoundarySkewSeconds,
        );
  const lightCrossingSyncMargin =
    lightCrossingSyncMarginValid && evidence.lightCrossingSyncMargin != null
      ? round(evidence.lightCrossingSyncMargin / LIGHT_CROSSING_SYNC_MARGIN_MIN)
      : null;
  const phaseNoiseMargin =
    phaseNoiseRmsSeconds == null || switchingRateHz == null
      ? null
      : (PHASE_NOISE_CYCLE_FRACTION_MAX / switchingRateHz) / phaseNoiseRmsSeconds;
  const controllerPhaseMargin =
    controllerPhaseMarginDegrees == null
      ? null
      : round(controllerPhaseMarginDegrees / CONTROLLER_PHASE_MARGIN_MIN_DEGREES);
  const controllerGainMargin =
    controllerGainMarginDb == null
      ? null
      : round(controllerGainMarginDb / CONTROLLER_GAIN_MARGIN_MIN_DB);
  const activeControlActuatorAuthorityMargin =
    actuatorAuthorityN == null
      ? null
      : round(actuatorAuthorityN / ACTIVE_CONTROL_AUTHORITY_MIN_N);
  const controlPowerW =
    energyPerCycleJ == null || switchingRateHz == null ? null : round(energyPerCycleJ * switchingRateHz);
  const thermalAccountingMargin =
    heatLoadW == null || controlPowerW == null || controlPowerW <= 0
      ? null
      : round(heatLoadW / controlPowerW);
  const heatSinkReferenceLoadW =
    heatLoadW == null
      ? controlPowerW
      : controlPowerW == null
        ? heatLoadW
        : Math.max(heatLoadW, controlPowerW);
  const thermalSinkMargin =
    heatSinkCapacityW == null || heatSinkReferenceLoadW == null || heatSinkReferenceLoadW <= 0
      ? null
      : round(heatSinkCapacityW / (heatSinkReferenceLoadW * THERMAL_SINK_CAPACITY_FACTOR_MIN));
  const sourceTensorContaminationMargin =
    evidence.sourceTensorContaminationFraction == null
      ? null
      : upperBoundUnitFractionMargin(
          ACTIVE_CONTROL_SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
          evidence.sourceTensorContaminationFraction,
        );
  const energyWaveformSampleCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence.energyWaveformSampleCount,
  );
  const actuatorAuthorityTraceSampleCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence.actuatorAuthorityTraceSampleCount,
  );
  const gapNoiseTraceSampleCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence.gapNoiseTraceSampleCount,
  );
  const heatLoadTraceSampleCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence.heatLoadTraceSampleCount,
  );
  const timingSyncTraceSampleCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence.timingSyncTraceSampleCount,
  );
  const phaseNoiseSpectrumBinCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
    evidence.phaseNoiseSpectrumBinCount,
  );
  const lockAcquisitionTrialCountMargin = lowerBoundMargin(
    ACTIVE_CONTROL_LOCK_ACQUISITION_TRIAL_COUNT_MIN,
    evidence.lockAcquisitionTrialCount,
  );
  const switchingRateMargin =
    switchingRateHz == null
      ? null
      : round(Math.min(switchingRateHz, SWITCHING_RATE_HZ) / SWITCHING_RATE_HZ);
  const switchingRateMatchesTarget =
    switchingRateValid &&
    switchingRateHz != null &&
    Math.abs(switchingRateHz - SWITCHING_RATE_HZ) <= SWITCHING_RATE_HZ * 1e-9;
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
    ...(evidence.energyWaveformSampleCount == null
      ? ["active_control_energy_waveform_sample_count_missing"]
      : !energyWaveformSampleCountValid
        ? ["active_control_energy_waveform_sample_count_invalid"]
        : energyWaveformSampleCountMargin == null
          ? ["active_control_energy_waveform_sample_count_missing"]
          : energyWaveformSampleCountMargin < 1
            ? ["active_control_energy_waveform_sample_count_below_4096"]
            : []),
    ...(evidence.actuatorAuthorityTraceRef == null
      ? ["active_control_actuator_authority_trace_ref_missing"]
      : []),
    ...(evidence.actuatorAuthorityTraceSampleCount == null
      ? ["active_control_actuator_authority_trace_sample_count_missing"]
      : !actuatorAuthorityTraceSampleCountValid
        ? ["active_control_actuator_authority_trace_sample_count_invalid"]
        : actuatorAuthorityTraceSampleCountMargin == null
          ? ["active_control_actuator_authority_trace_sample_count_missing"]
          : actuatorAuthorityTraceSampleCountMargin < 1
            ? ["active_control_actuator_authority_trace_sample_count_below_4096"]
            : []),
    ...(evidence.gapSensorCalibrationRef == null
      ? ["active_control_gap_sensor_calibration_ref_missing"]
      : []),
    ...(evidence.controlTransferFunctionRef == null ? ["active_control_transfer_function_ref_missing"] : []),
    ...(evidence.controllerStabilityRef == null
      ? ["active_control_controller_stability_ref_missing"]
      : []),
    ...(evidence.gapNoiseTraceRef == null ? ["active_control_gap_noise_trace_ref_missing"] : []),
    ...(evidence.gapNoiseTraceSampleCount == null
      ? ["active_control_gap_noise_trace_sample_count_missing"]
      : !gapNoiseTraceSampleCountValid
        ? ["active_control_gap_noise_trace_sample_count_invalid"]
        : gapNoiseTraceSampleCountMargin == null
          ? ["active_control_gap_noise_trace_sample_count_missing"]
          : gapNoiseTraceSampleCountMargin < 1
            ? ["active_control_gap_noise_trace_sample_count_below_4096"]
            : []),
    ...(evidence.thermalModelRef == null ? ["active_control_thermal_model_ref_missing"] : []),
    ...(evidence.heatSinkCapacityTraceRef == null
      ? ["active_control_heat_sink_capacity_trace_ref_missing"]
      : []),
    ...(evidence.heatLoadTraceRef == null ? ["active_control_heat_load_trace_ref_missing"] : []),
    ...(evidence.heatLoadTraceSampleCount == null
      ? ["active_control_heat_load_trace_sample_count_missing"]
      : !heatLoadTraceSampleCountValid
        ? ["active_control_heat_load_trace_sample_count_invalid"]
        : heatLoadTraceSampleCountMargin == null
          ? ["active_control_heat_load_trace_sample_count_missing"]
          : heatLoadTraceSampleCountMargin < 1
            ? ["active_control_heat_load_trace_sample_count_below_4096"]
            : []),
    ...(evidence.timingSyncTraceRef == null ? ["active_control_timing_sync_trace_ref_missing"] : []),
    ...(evidence.sectorLightCrossingSyncRef == null
      ? ["active_control_sector_light_crossing_sync_ref_missing"]
      : []),
    ...(evidence.sectorBoundaryTimingMapRef == null
      ? ["active_control_sector_boundary_timing_map_ref_missing"]
      : []),
    ...(evidence.timingSyncTraceSampleCount == null
      ? ["active_control_timing_sync_trace_sample_count_missing"]
      : !timingSyncTraceSampleCountValid
        ? ["active_control_timing_sync_trace_sample_count_invalid"]
        : timingSyncTraceSampleCountMargin == null
          ? ["active_control_timing_sync_trace_sample_count_missing"]
          : timingSyncTraceSampleCountMargin < 1
            ? ["active_control_timing_sync_trace_sample_count_below_4096"]
            : []),
    ...(evidence.phaseNoiseSpectrumRef == null
      ? ["active_control_phase_noise_spectrum_ref_missing"]
      : []),
    ...(evidence.phaseNoiseSpectrumBinCount == null
      ? ["active_control_phase_noise_spectrum_bin_count_missing"]
      : !phaseNoiseSpectrumBinCountValid
        ? ["active_control_phase_noise_spectrum_bin_count_invalid"]
        : phaseNoiseSpectrumBinCountMargin == null
          ? ["active_control_phase_noise_spectrum_bin_count_missing"]
          : phaseNoiseSpectrumBinCountMargin < 1
            ? ["active_control_phase_noise_spectrum_bin_count_below_512"]
            : []),
    ...(evidence.lockAcquisitionTraceRef == null
      ? ["active_control_lock_acquisition_trace_ref_missing"]
      : []),
    ...(evidence.lockAcquisitionTrialCount == null
      ? ["active_control_lock_acquisition_trial_count_missing"]
      : !lockAcquisitionTrialCountValid
        ? ["active_control_lock_acquisition_trial_count_invalid"]
        : lockAcquisitionTrialCountMargin == null
          ? ["active_control_lock_acquisition_trial_count_missing"]
          : lockAcquisitionTrialCountMargin < 1
            ? ["active_control_lock_acquisition_trial_count_below_100"]
            : []),
    ...(evidence.energyPerCycleJ == null
      ? ["active_control_energy_per_cycle_missing"]
      : !energyPerCycleValid
        ? ["active_control_energy_per_cycle_invalid"]
        : []),
    ...(evidence.actuatorAuthorityN == null
      ? ["active_control_actuator_authority_missing"]
      : !actuatorAuthorityValid
        ? ["active_control_actuator_authority_invalid"]
        : activeControlActuatorAuthorityMargin == null
          ? ["active_control_actuator_authority_missing"]
          : activeControlActuatorAuthorityMargin < 1
            ? ["active_control_actuator_authority_below_447_layer_load"]
            : []),
    ...(evidence.switchingRateHz == null
      ? ["active_control_switching_rate_missing"]
      : !switchingRateValid
        ? ["active_control_switching_rate_invalid"]
        : switchingRateMatchesTarget
          ? []
          : ["active_control_switching_rate_not_15ghz"]),
    ...(evidence.bandwidthHz == null
      ? ["gap_lock_bandwidth_missing"]
      : !bandwidthValid
        ? ["active_control_bandwidth_invalid"]
        : bandwidthMargin == null
          ? ["gap_lock_bandwidth_missing"]
          : bandwidthMargin < 1
            ? ["gap_lock_bandwidth_below_2x_switching_rate"]
            : []),
    ...(evidence.gapNoiseRmsMeters == null
      ? ["gap_noise_receipt_missing"]
      : !gapNoiseValid
        ? ["gap_noise_rms_invalid"]
        : noiseMargin == null
          ? ["gap_noise_receipt_missing"]
          : noiseMargin < 1
            ? ["gap_noise_above_1pct_gap"]
            : []),
    ...(evidence.noiseSpectrumRef == null ? ["active_control_noise_spectrum_ref_missing"] : []),
    ...(evidence.heatLoadW == null
      ? ["active_control_heat_load_missing"]
      : !heatLoadValid
        ? ["active_control_heat_load_invalid"]
        : []),
    ...(thermalAccountingMargin == null
      ? []
      : thermalAccountingMargin < 1
          ? ["active_control_heat_load_below_computed_control_power"]
          : []),
    ...(evidence.sourceTensorContaminationFraction == null
      ? ["active_control_source_tensor_contamination_receipt_missing"]
      : !sourceTensorContaminationValid
        ? ["active_control_source_tensor_contamination_fraction_invalid"]
        : sourceTensorContaminationMargin == null
          ? ["active_control_source_tensor_contamination_receipt_missing"]
          : sourceTensorContaminationMargin < 1
            ? ["active_control_source_tensor_contamination_above_5pct"]
            : []),
    ...(evidence.sourceTensorContaminationRef == null
      ? ["active_control_source_tensor_contamination_ref_missing"]
      : []),
    ...(evidence.heatSinkCapacityW == null
      ? ["active_control_heat_sink_capacity_missing"]
      : !heatSinkCapacityValid
        ? ["active_control_heat_sink_capacity_invalid"]
        : thermalSinkMargin == null
          ? ["active_control_heat_sink_capacity_missing"]
          : thermalSinkMargin < 1
            ? ["active_control_heat_sink_capacity_below_1p2x_heat_load"]
            : []),
    ...(evidence.timingJitterSeconds == null
      ? ["timing_jitter_receipt_missing"]
      : !timingJitterValid
        ? ["timing_jitter_invalid"]
        : timingMargin == null
          ? ["timing_jitter_receipt_missing"]
          : timingMargin < 1
            ? ["timing_jitter_above_0p1_cycle"]
            : []),
    ...(evidence.sectorBoundarySkewSeconds == null
      ? ["active_control_sector_boundary_skew_missing"]
      : !sectorBoundarySkewValid
        ? ["active_control_sector_boundary_skew_invalid"]
        : sectorBoundarySkewMargin == null
          ? ["active_control_sector_boundary_skew_missing"]
          : sectorBoundarySkewMargin < 1
            ? ["active_control_sector_boundary_skew_above_0p1_cycle"]
            : []),
    ...(evidence.lightCrossingSyncMargin == null
      ? ["active_control_light_crossing_sync_margin_missing"]
      : !lightCrossingSyncMarginValid
        ? ["active_control_light_crossing_sync_margin_invalid"]
        : lightCrossingSyncMargin == null
          ? ["active_control_light_crossing_sync_margin_missing"]
          : lightCrossingSyncMargin < 1
            ? ["active_control_light_crossing_sync_margin_below_1"]
            : []),
    ...(evidence.phaseNoiseRmsSeconds == null
      ? ["phase_noise_receipt_missing"]
      : !phaseNoiseValid
        ? ["phase_noise_invalid"]
        : phaseNoiseMargin == null
          ? ["phase_noise_receipt_missing"]
          : phaseNoiseMargin < 1
            ? ["phase_noise_above_0p05_cycle"]
            : []),
    ...(evidence.controllerPhaseMarginDegrees == null
      ? ["controller_phase_margin_missing"]
      : !controllerPhaseMarginValid
        ? ["controller_phase_margin_invalid"]
        : controllerPhaseMargin == null
          ? ["controller_phase_margin_missing"]
          : controllerPhaseMargin < 1
            ? ["controller_phase_margin_below_45deg"]
            : []),
    ...(evidence.controllerGainMarginDb == null
      ? ["controller_gain_margin_missing"]
      : !controllerGainMarginValid
        ? ["controller_gain_margin_invalid"]
        : controllerGainMargin == null
          ? ["controller_gain_margin_missing"]
          : controllerGainMargin < 1
            ? ["controller_gain_margin_below_6db"]
            : []),
    ...(evidence.lockAcquisitionTimeSeconds == null
      ? ["active_control_lock_acquisition_time_missing"]
      : !lockAcquisitionTimeValid
        ? ["active_control_lock_acquisition_time_invalid"]
      : []),
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
      sectorBoundarySkewMargin,
      lightCrossingSyncMargin,
      phaseNoiseMargin,
      controllerPhaseMargin,
      controllerGainMargin,
      activeControlActuatorAuthorityMargin,
      activeControlAuthorityMinN: ACTIVE_CONTROL_AUTHORITY_MIN_N,
      ideal447LayerStackForceAbsN: IDEAL_447_LAYER_STACK_FORCE_ABS_N,
      controlPowerW,
      thermalAccountingMargin,
      thermalSinkMargin,
      heatSinkReferenceLoadW,
      energyPerCycleJ: evidence.energyPerCycleJ,
      actuatorAuthorityN: evidence.actuatorAuthorityN ?? null,
      heatLoadW: evidence.heatLoadW,
      heatSinkCapacityW: evidence.heatSinkCapacityW ?? null,
      sourceTensorContaminationFraction: evidence.sourceTensorContaminationFraction ?? null,
      sourceTensorContaminationMargin,
      energyWaveformSampleCountMargin,
      actuatorAuthorityTraceSampleCountMargin,
      gapNoiseTraceSampleCountMargin,
      heatLoadTraceSampleCountMargin,
      timingSyncTraceSampleCountMargin,
      phaseNoiseSpectrumBinCountMargin,
      lockAcquisitionTrialCountMargin,
      sectorBoundarySkewSeconds: evidence.sectorBoundarySkewSeconds ?? null,
      lightCrossingSyncMarginSupplied: evidence.lightCrossingSyncMargin ?? null,
      phaseNoiseRmsSeconds: evidence.phaseNoiseRmsSeconds ?? null,
      lockAcquisitionTimeSeconds: evidence.lockAcquisitionTimeSeconds ?? null,
      failureModeCoverageComplete: failureModeCoverageComplete ? 1 : 0,
      activeControlProvenanceRefsAvailable:
        evidence.energyWaveformRef != null &&
        evidence.actuatorAuthorityTraceRef != null &&
        evidence.gapSensorCalibrationRef != null &&
        evidence.controlTransferFunctionRef != null &&
        evidence.controllerStabilityRef != null &&
        evidence.gapNoiseTraceRef != null &&
        evidence.noiseSpectrumRef != null &&
        evidence.thermalModelRef != null &&
        evidence.heatSinkCapacityTraceRef != null &&
        evidence.heatLoadTraceRef != null &&
        evidence.sourceTensorContaminationRef != null &&
        evidence.timingSyncTraceRef != null &&
        evidence.sectorLightCrossingSyncRef != null &&
        evidence.sectorBoundaryTimingMapRef != null &&
        evidence.phaseNoiseSpectrumRef != null &&
        evidence.lockAcquisitionTraceRef != null &&
        evidence.failureModeRef != null &&
        (energyWaveformSampleCountMargin ?? 0) >= 1 &&
        (actuatorAuthorityTraceSampleCountMargin ?? 0) >= 1 &&
        (gapNoiseTraceSampleCountMargin ?? 0) >= 1 &&
        (heatLoadTraceSampleCountMargin ?? 0) >= 1 &&
        (timingSyncTraceSampleCountMargin ?? 0) >= 1 &&
        (phaseNoiseSpectrumBinCountMargin ?? 0) >= 1 &&
        (lockAcquisitionTrialCountMargin ?? 0) >= 1
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
    "Supply load spectrum, cryogenic fatigue curve, cycle protocol, thermal cycling, creep/drift, delamination, interlayer adhesion, and cycling lifetime evidence for the selected 447-layer architecture.";
  const scalingRequiredChange =
    "Supply 447-layer scaling maps, per-layer variation map, nonadditivity model, support/electromagnetic/mechanical coupling maps, active-area-retention map, source-tensor-retention map, and multiphysics coupling evidence.";
  if (evidence == null) {
    return [
      missingSurface("fatigue_lifetime", "fatigue_lifetime_receipt_missing", fatigueRequiredChange),
      missingSurface("layer_scaling", "layer_scaling_nonadditivity_measurement_missing", scalingRequiredChange),
    ];
  }
  const cycleCountValid = isPositiveFinite(evidence.cycleCountToFailure);
  const requiredCycleCountValid = isPositiveFinite(evidence.requiredCycleCount);
  const thermalCycleDriftValid = isUnitFraction(evidence.thermalCycleDriftFraction);
  const creepDriftValid = isUnitFraction(evidence.creepDriftFraction);
  const delaminationMarginValid = isPositiveFinite(evidence.delaminationMargin);
  const interlayerAdhesionMarginValid = isPositiveFinite(evidence.interlayerAdhesionMargin);
  const layerScalingEfficiencyValid = isUnitFraction(evidence.layerScalingEfficiency);
  const perLayerVariationValid = isUnitFraction(evidence.perLayerVariationFraction);
  const nonadditivityValid = isUnitFraction(evidence.nonadditivityFraction);
  const activeAreaRetentionValid = isUnitFraction(evidence.activeAreaRetention);
  const supportCouplingValid = isUnitFraction(evidence.supportCouplingFraction);
  const electromagneticCouplingValid = isUnitFraction(evidence.electromagneticCouplingFraction);
  const mechanicalCouplingValid = isUnitFraction(evidence.mechanicalCouplingFraction);
  const sourceTensorRetentionValid = isUnitFraction(evidence.sourceTensorRetentionFraction);
  const cycleMargin =
    !cycleCountValid || !requiredCycleCountValid
      ? null
      : evidence.cycleCountToFailure / evidence.requiredCycleCount;
  const thermalCycleDriftMargin = upperBoundUnitFractionMargin(
    THERMAL_CYCLE_DRIFT_FRACTION_MAX,
    evidence.thermalCycleDriftFraction,
  );
  const creepDriftMargin = upperBoundUnitFractionMargin(
    CREEP_DRIFT_FRACTION_MAX,
    evidence.creepDriftFraction,
  );
  const delaminationMargin = lowerBoundMargin(
    DELAMINATION_MARGIN_MIN,
    delaminationMarginValid ? evidence.delaminationMargin : null,
  );
  const interlayerAdhesionMargin = lowerBoundMargin(
    INTERLAYER_ADHESION_MARGIN_MIN,
    interlayerAdhesionMarginValid ? evidence.interlayerAdhesionMargin : null,
  );
  const scalingMargin =
    !layerScalingEfficiencyValid
      ? null
      : evidence.layerScalingEfficiency / LAYER_SCALING_EFFICIENCY_MIN;
  const perLayerVariationMargin = upperBoundUnitFractionMargin(
    PER_LAYER_VARIATION_FRACTION_MAX,
    evidence.perLayerVariationFraction,
  );
  const nonadditivityMargin = upperBoundUnitFractionMargin(
    LAYER_NONADDITIVITY_FRACTION_MAX,
    evidence.nonadditivityFraction,
  );
  const activeAreaMargin =
    !activeAreaRetentionValid
      ? null
      : evidence.activeAreaRetention / ACTIVE_AREA_RETENTION_MIN;
  const supportCouplingMargin = upperBoundUnitFractionMargin(
    SUPPORT_COUPLING_FRACTION_MAX,
    evidence.supportCouplingFraction,
  );
  const electromagneticCouplingMargin = upperBoundUnitFractionMargin(
    ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
    evidence.electromagneticCouplingFraction,
  );
  const mechanicalCouplingMargin = upperBoundUnitFractionMargin(
    MECHANICAL_COUPLING_FRACTION_MAX,
    evidence.mechanicalCouplingFraction,
  );
  const scalarRetentionEstimate =
    !layerScalingEfficiencyValid ||
    !nonadditivityValid ||
    !activeAreaRetentionValid
      ? null
      : round(
          evidence.layerScalingEfficiency *
            (1 - evidence.nonadditivityFraction) *
            evidence.activeAreaRetention,
        );
  const sourceTensorRetentionFraction = sourceTensorRetentionValid
    ? evidence.sourceTensorRetentionFraction
    : null;
  const sourceTensorRetentionMargin =
    sourceTensorRetentionFraction == null
      ? null
      : sourceTensorRetentionFraction / SOURCE_TENSOR_RETENTION_FRACTION_MIN;
  const scalarRetentionEstimateMargin =
    scalarRetentionEstimate == null
      ? null
      : scalarRetentionEstimate / SOURCE_TENSOR_RETENTION_FRACTION_MIN;
  const sourceTensorRetentionConsistencyMargin =
    scalarRetentionEstimate == null ||
    sourceTensorRetentionFraction == null ||
    sourceTensorRetentionFraction <= 0
      ? null
      : scalarRetentionEstimate / sourceTensorRetentionFraction;
  const layerScalingSampledLayerCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN,
    evidence.layerScalingSampledLayerCount,
  );
  const perLayerVariationSampledLayerCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN,
    evidence.perLayerVariationSampledLayerCount,
  );
  const activeAreaMapSampledLayerCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN,
    evidence.activeAreaMapSampledLayerCount,
  );
  const sourceTensorRetentionSampledLayerCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN,
    evidence.sourceTensorRetentionSampledLayerCount,
  );
  const supportCouplingSampledInterfaceCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_INTERFACE_COUNT_MIN,
    evidence.supportCouplingSampledInterfaceCount,
  );
  const electromagneticCouplingSampledInterfaceCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_INTERFACE_COUNT_MIN,
    evidence.electromagneticCouplingSampledInterfaceCount,
  );
  const mechanicalCouplingSampledInterfaceCountMargin = lowerBoundMargin(
    LAYER_SCALING_SAMPLE_INTERFACE_COUNT_MIN,
    evidence.mechanicalCouplingSampledInterfaceCount,
  );
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
    ...(evidence.loadSpectrumRef == null ? ["fatigue_load_spectrum_ref_missing"] : []),
    ...(evidence.cycleProtocolRef == null ? ["fatigue_cycle_protocol_ref_missing"] : []),
    ...(evidence.cryogenicFatigueRef == null ? ["cryogenic_fatigue_ref_missing"] : []),
    ...(evidence.fatigueCurveRef == null ? ["fatigue_curve_ref_missing"] : []),
    ...(evidence.thermalCycleRef == null ? ["thermal_cycle_ref_missing"] : []),
    ...(evidence.creepDriftRef == null ? ["creep_drift_ref_missing"] : []),
    ...(evidence.delaminationProtocolRef == null ? ["delamination_protocol_ref_missing"] : []),
    ...(evidence.interlayerAdhesionRef == null ? ["interlayer_adhesion_ref_missing"] : []),
    ...(evidence.cycleCountToFailure != null && !cycleCountValid
      ? ["cycle_count_to_failure_invalid"]
      : []),
    ...(evidence.requiredCycleCount != null && !requiredCycleCountValid
      ? ["required_cycle_count_invalid"]
      : []),
    ...(cycleMargin == null ? ["fatigue_cycle_margin_missing"] : cycleMargin < 1 ? ["fatigue_cycle_margin_below_required"] : []),
    ...(evidence.thermalCycleDriftFraction != null && !thermalCycleDriftValid
      ? ["thermal_cycle_drift_fraction_invalid"]
      : []),
    ...(thermalCycleDriftMargin == null
      ? ["thermal_cycle_drift_fraction_missing"]
      : thermalCycleDriftMargin < 1
        ? ["thermal_cycle_drift_above_0p01"]
        : []),
    ...(evidence.creepDriftFraction != null && !creepDriftValid
      ? ["creep_drift_fraction_invalid"]
      : []),
    ...(creepDriftMargin == null
      ? ["creep_drift_fraction_missing"]
      : creepDriftMargin < 1
        ? ["creep_drift_above_0p01"]
        : []),
    ...(evidence.delaminationMargin != null && !delaminationMarginValid
      ? ["delamination_margin_invalid"]
      : []),
    ...(delaminationMargin == null
      ? ["delamination_margin_missing"]
      : delaminationMargin < 1
        ? ["delamination_margin_below_one"]
        : []),
    ...(evidence.interlayerAdhesionMargin != null && !interlayerAdhesionMarginValid
      ? ["interlayer_adhesion_margin_invalid"]
      : []),
    ...(interlayerAdhesionMargin == null
      ? ["interlayer_adhesion_margin_missing"]
      : interlayerAdhesionMargin < 1
        ? ["interlayer_adhesion_margin_below_one"]
        : []),
  ];
  const scalingBlockers = [
    ...tierBlockers,
    ...receiptRefBlockers,
    ...(evidence.layerScalingMapRef == null ? ["layer_scaling_map_ref_missing"] : []),
    ...(evidence.layerScalingSampledLayerCount == null
      ? ["layer_scaling_sampled_layer_count_missing"]
      : !isPositiveInteger(evidence.layerScalingSampledLayerCount)
        ? ["layer_scaling_sampled_layer_count_invalid"]
        : layerScalingSampledLayerCountMargin == null
          ? ["layer_scaling_sampled_layer_count_missing"]
          : layerScalingSampledLayerCountMargin < 1
            ? ["layer_scaling_sampled_layer_count_below_447"]
            : []),
    ...(evidence.perLayerVariationMapRef == null ? ["per_layer_variation_map_ref_missing"] : []),
    ...(evidence.perLayerVariationSampledLayerCount == null
      ? ["per_layer_variation_sampled_layer_count_missing"]
      : !isPositiveInteger(evidence.perLayerVariationSampledLayerCount)
        ? ["per_layer_variation_sampled_layer_count_invalid"]
        : perLayerVariationSampledLayerCountMargin == null
          ? ["per_layer_variation_sampled_layer_count_missing"]
          : perLayerVariationSampledLayerCountMargin < 1
            ? ["per_layer_variation_sampled_layer_count_below_447"]
            : []),
    ...(evidence.nonadditivityModelRef == null ? ["layer_nonadditivity_model_ref_missing"] : []),
    ...(evidence.activeAreaMapRef == null ? ["active_area_map_ref_missing"] : []),
    ...(evidence.activeAreaMapSampledLayerCount == null
      ? ["active_area_map_sampled_layer_count_missing"]
      : !isPositiveInteger(evidence.activeAreaMapSampledLayerCount)
        ? ["active_area_map_sampled_layer_count_invalid"]
        : activeAreaMapSampledLayerCountMargin == null
          ? ["active_area_map_sampled_layer_count_missing"]
          : activeAreaMapSampledLayerCountMargin < 1
            ? ["active_area_map_sampled_layer_count_below_447"]
            : []),
    ...(evidence.supportCouplingMapRef == null ? ["support_coupling_map_ref_missing"] : []),
    ...(evidence.supportCouplingSampledInterfaceCount == null
      ? ["support_coupling_sampled_interface_count_missing"]
      : !isPositiveInteger(evidence.supportCouplingSampledInterfaceCount)
        ? ["support_coupling_sampled_interface_count_invalid"]
        : supportCouplingSampledInterfaceCountMargin == null
          ? ["support_coupling_sampled_interface_count_missing"]
          : supportCouplingSampledInterfaceCountMargin < 1
            ? ["support_coupling_sampled_interface_count_below_446"]
            : []),
    ...(evidence.electromagneticCouplingMapRef == null ? ["electromagnetic_coupling_map_ref_missing"] : []),
    ...(evidence.electromagneticCouplingSampledInterfaceCount == null
      ? ["electromagnetic_coupling_sampled_interface_count_missing"]
      : !isPositiveInteger(evidence.electromagneticCouplingSampledInterfaceCount)
        ? ["electromagnetic_coupling_sampled_interface_count_invalid"]
        : electromagneticCouplingSampledInterfaceCountMargin == null
          ? ["electromagnetic_coupling_sampled_interface_count_missing"]
          : electromagneticCouplingSampledInterfaceCountMargin < 1
            ? ["electromagnetic_coupling_sampled_interface_count_below_446"]
            : []),
    ...(evidence.mechanicalCouplingMapRef == null ? ["mechanical_coupling_map_ref_missing"] : []),
    ...(evidence.mechanicalCouplingSampledInterfaceCount == null
      ? ["mechanical_coupling_sampled_interface_count_missing"]
      : !isPositiveInteger(evidence.mechanicalCouplingSampledInterfaceCount)
        ? ["mechanical_coupling_sampled_interface_count_invalid"]
        : mechanicalCouplingSampledInterfaceCountMargin == null
          ? ["mechanical_coupling_sampled_interface_count_missing"]
          : mechanicalCouplingSampledInterfaceCountMargin < 1
            ? ["mechanical_coupling_sampled_interface_count_below_446"]
            : []),
    ...(evidence.multiphysicsCouplingRef == null ? ["multiphysics_coupling_ref_missing"] : []),
    ...(evidence.sourceTensorRetentionMapRef == null ? ["source_tensor_retention_map_ref_missing"] : []),
    ...(evidence.sourceTensorRetentionSampledLayerCount == null
      ? ["source_tensor_retention_sampled_layer_count_missing"]
      : !isPositiveInteger(evidence.sourceTensorRetentionSampledLayerCount)
        ? ["source_tensor_retention_sampled_layer_count_invalid"]
        : sourceTensorRetentionSampledLayerCountMargin == null
          ? ["source_tensor_retention_sampled_layer_count_missing"]
          : sourceTensorRetentionSampledLayerCountMargin < 1
            ? ["source_tensor_retention_sampled_layer_count_below_447"]
            : []),
    ...(evidence.layerScalingEfficiency != null && !layerScalingEfficiencyValid
      ? ["layer_scaling_efficiency_invalid"]
      : []),
    ...(scalingMargin == null ? ["layer_scaling_efficiency_missing"] : scalingMargin < 1 ? ["layer_scaling_efficiency_below_0p9"] : []),
    ...(evidence.perLayerVariationFraction != null && !perLayerVariationValid
      ? ["per_layer_variation_fraction_invalid"]
      : []),
    ...(perLayerVariationMargin == null
      ? ["per_layer_variation_fraction_missing"]
      : perLayerVariationMargin < 1
        ? ["per_layer_variation_above_0p05"]
        : []),
    ...(evidence.nonadditivityFraction != null && !nonadditivityValid
      ? ["layer_nonadditivity_fraction_invalid"]
      : []),
    ...(nonadditivityMargin == null ? ["layer_nonadditivity_fraction_missing"] : nonadditivityMargin < 1 ? ["layer_nonadditivity_above_0p1"] : []),
    ...(evidence.activeAreaRetention != null && !activeAreaRetentionValid
      ? ["active_area_retention_invalid"]
      : []),
    ...(activeAreaMargin == null ? ["active_area_retention_missing"] : activeAreaMargin < 1 ? ["active_area_retention_below_0p6"] : []),
    ...(evidence.supportCouplingFraction != null && !supportCouplingValid
      ? ["support_coupling_fraction_invalid"]
      : []),
    ...(supportCouplingMargin == null
      ? ["support_coupling_fraction_missing"]
      : supportCouplingMargin < 1
        ? ["support_coupling_fraction_above_0p1"]
        : []),
    ...(evidence.electromagneticCouplingFraction != null && !electromagneticCouplingValid
      ? ["electromagnetic_coupling_fraction_invalid"]
      : []),
    ...(electromagneticCouplingMargin == null
      ? ["electromagnetic_coupling_fraction_missing"]
      : electromagneticCouplingMargin < 1
        ? ["electromagnetic_coupling_fraction_above_0p1"]
        : []),
    ...(evidence.mechanicalCouplingFraction != null && !mechanicalCouplingValid
      ? ["mechanical_coupling_fraction_invalid"]
      : []),
    ...(mechanicalCouplingMargin == null
      ? ["mechanical_coupling_fraction_missing"]
      : mechanicalCouplingMargin < 1
        ? ["mechanical_coupling_fraction_above_0p1"]
        : []),
    ...(evidence.sourceTensorRetentionFraction != null && !sourceTensorRetentionValid
      ? ["source_tensor_retention_fraction_invalid"]
      : []),
    ...(sourceTensorRetentionMargin == null
      ? ["source_tensor_retention_fraction_missing"]
      : sourceTensorRetentionMargin < 1
        ? ["source_tensor_retention_below_0p9"]
        : []),
    ...(scalarRetentionEstimateMargin == null
      ? ["scalar_retention_estimate_missing"]
      : scalarRetentionEstimateMargin < 1
        ? ["scalar_retention_estimate_below_0p9"]
        : []),
    ...(sourceTensorRetentionConsistencyMargin == null
      ? []
      : sourceTensorRetentionConsistencyMargin < 1
        ? ["source_tensor_retention_exceeds_scaling_area_estimate"]
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
        delaminationMargin,
        interlayerAdhesionMargin,
        fatigueProvenanceRefsAvailable:
          evidence.loadSpectrumRef != null &&
          evidence.cycleProtocolRef != null &&
          evidence.cryogenicFatigueRef != null &&
          evidence.fatigueCurveRef != null &&
          evidence.thermalCycleRef != null &&
          evidence.creepDriftRef != null &&
          evidence.delaminationProtocolRef != null &&
          evidence.interlayerAdhesionRef != null
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
        perLayerVariationMargin,
        nonadditivityMargin,
        activeAreaMargin,
        supportCouplingMargin,
        electromagneticCouplingMargin,
        mechanicalCouplingMargin,
        scalarRetentionEstimate,
        scalarRetentionEstimateMargin,
        sourceTensorRetentionFraction,
        sourceTensorRetentionMargin,
        sourceTensorRetentionConsistencyMargin,
        layerScalingSampledLayerCountMargin,
        perLayerVariationSampledLayerCountMargin,
        activeAreaMapSampledLayerCountMargin,
        sourceTensorRetentionSampledLayerCountMargin,
        supportCouplingSampledInterfaceCountMargin,
        electromagneticCouplingSampledInterfaceCountMargin,
        mechanicalCouplingSampledInterfaceCountMargin,
        layerMapCoverageComplete:
          (layerScalingSampledLayerCountMargin ?? 0) >= 1 &&
          (perLayerVariationSampledLayerCountMargin ?? 0) >= 1 &&
          (activeAreaMapSampledLayerCountMargin ?? 0) >= 1 &&
          (sourceTensorRetentionSampledLayerCountMargin ?? 0) >= 1 &&
          (supportCouplingSampledInterfaceCountMargin ?? 0) >= 1 &&
          (electromagneticCouplingSampledInterfaceCountMargin ?? 0) >= 1 &&
          (mechanicalCouplingSampledInterfaceCountMargin ?? 0) >= 1
            ? 1
            : 0,
        layerScalingProvenanceRefsAvailable:
          evidence.layerScalingMapRef != null &&
          evidence.perLayerVariationMapRef != null &&
          evidence.nonadditivityModelRef != null &&
          evidence.activeAreaMapRef != null &&
          evidence.supportCouplingMapRef != null &&
          evidence.electromagneticCouplingMapRef != null &&
          evidence.mechanicalCouplingMapRef != null &&
          evidence.multiphysicsCouplingRef != null &&
          evidence.sourceTensorRetentionMapRef != null
            ? 1
            : 0,
      },
      requiredChange: scalingRequiredChange,
    },
  ];
};

const fullApparatusTensorSurface = (
  evidence: Nhm2TileSourceFullApparatusTensorEvidenceV1 | null | undefined,
  subsystemSurfaces: Nhm2TileSourceReceiptSurfaceStatusV1[] = [],
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
  const subsystemReceiptRefBlockers = [
    ...(evidence.subsystemReceiptRefs?.materialCoupon == null
      ? ["full_apparatus_material_coupon_receipt_ref_missing"]
      : []),
    ...(evidence.subsystemReceiptRefs?.forceGapPullIn == null
      ? ["full_apparatus_force_gap_receipt_ref_missing"]
      : []),
    ...(evidence.subsystemReceiptRefs?.roughnessPatch == null
      ? ["full_apparatus_roughness_patch_receipt_ref_missing"]
      : []),
    ...(evidence.subsystemReceiptRefs?.activeControl == null
      ? ["full_apparatus_active_control_receipt_ref_missing"]
      : []),
    ...(evidence.subsystemReceiptRefs?.fatigueLayerScaling == null
      ? ["full_apparatus_fatigue_layer_scaling_receipt_ref_missing"]
      : []),
  ];
  const subsystemReceiptBackingBlockers = (() => {
    if (evidence.subsystemReceiptRefs == null) return [];
    const surfaceById = new Map(subsystemSurfaces.map((surface) => [surface.surfaceId, surface]));
    const checks = [
      {
        ref: evidence.subsystemReceiptRefs.materialCoupon,
        blockerPrefix: "material_coupon",
        surfaceIds: ["material_coupon"],
      },
      {
        ref: evidence.subsystemReceiptRefs.forceGapPullIn,
        blockerPrefix: "force_gap",
        surfaceIds: ["force_gap_pull_in"],
      },
      {
        ref: evidence.subsystemReceiptRefs.roughnessPatch,
        blockerPrefix: "roughness_patch",
        surfaceIds: ["roughness_patch_metrology"],
      },
      {
        ref: evidence.subsystemReceiptRefs.activeControl,
        blockerPrefix: "active_control",
        surfaceIds: ["active_control_energy"],
      },
      {
        ref: evidence.subsystemReceiptRefs.fatigueLayerScaling,
        blockerPrefix: "fatigue_layer_scaling",
        surfaceIds: ["fatigue_lifetime", "layer_scaling"],
      },
    ] as const;
    return checks.flatMap((check) => {
      if (check.ref == null) return [];
      return check.surfaceIds.flatMap((surfaceId) => {
        const surface = surfaceById.get(surfaceId);
        if (surface?.status !== "pass") {
          return [`full_apparatus_${check.blockerPrefix}_receipt_ref_not_backed_by_passed_surface`];
        }
        return surface.evidenceRef === check.ref
          ? []
          : [`full_apparatus_${check.blockerPrefix}_receipt_ref_mismatch`];
      });
    });
  })();
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
  const regionalSampleCountBlockers = [
    ...(evidence.regionalCoverage.wall && !isPositiveFinite(evidence.regionalSampleCounts?.wall)
      ? ["full_apparatus_wall_region_sample_count_missing_or_invalid"]
      : []),
    ...(evidence.regionalCoverage.hull && !isPositiveFinite(evidence.regionalSampleCounts?.hull)
      ? ["full_apparatus_hull_region_sample_count_missing_or_invalid"]
      : []),
    ...(evidence.regionalCoverage.exteriorShell &&
    !isPositiveFinite(evidence.regionalSampleCounts?.exteriorShell)
      ? ["full_apparatus_exterior_shell_region_sample_count_missing_or_invalid"]
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
    ...subsystemReceiptRefBlockers,
    ...subsystemReceiptBackingBlockers,
    ...(!evidence.regionalCoverage.wall ? ["full_apparatus_wall_region_missing"] : []),
    ...(!evidence.regionalCoverage.hull ? ["full_apparatus_hull_region_missing"] : []),
    ...(!evidence.regionalCoverage.exteriorShell ? ["full_apparatus_exterior_shell_region_missing"] : []),
    ...regionalRefBlockers,
    ...regionalSampleCountBlockers,
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
      subsystemReceiptRefsAvailable: subsystemReceiptRefBlockers.length === 0 ? 1 : 0,
      subsystemReceiptRefsBacked: subsystemReceiptBackingBlockers.length === 0 ? 1 : 0,
      regionalSupportRefsAvailable: regionalRefBlockers.length === 0 ? 1 : 0,
      regionalSampleCountsAvailable: regionalSampleCountBlockers.length === 0 ? 1 : 0,
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
  const prerequisiteSurfaces = [
    materialCouponSurface(input.materialCoupon),
    forceGapSurface(input.forceGapPullIn),
    roughnessPatchSurface(input.roughnessPatch),
    activeControlSurface(input.activeControl),
    fatigueSurface,
    layerScalingSurface,
  ];
  const receiptSurfaces = [
    ...prerequisiteSurfaces,
    fullApparatusTensorSurface(input.fullApparatusTensor, prerequisiteSurfaces),
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
      fabricationToleranceMaxMeters: FABRICATION_TOLERANCE_MAX_METERS,
      roughnessMapLateralResolutionMaxMeters: ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS,
      roughnessScanAreaFractionMin: ROUGHNESS_SCAN_AREA_FRACTION_MIN,
      asperityP99MaxMeters: ASPERITY_P99_MAX_METERS,
      asperityP999MaxMeters: ASPERITY_P999_MAX_METERS,
      asperityMaxFractionOfGap: ASPERITY_MAX_FRACTION_OF_GAP,
      materialResponseFrequencyHz: MATERIAL_RESPONSE_FREQUENCY_HZ,
      materialResponseTemperatureK: MATERIAL_RESPONSE_TEMPERATURE_K,
      ideal447LayerStackForceAbsN: IDEAL_447_LAYER_STACK_FORCE_ABS_N,
      forceGradientConsistencyMin: FORCE_GRADIENT_CONSISTENCY_MIN,
      patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
      residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      patchVoltageDerivedElectrostaticFractionMax: PATCH_VOLTAGE_DERIVED_ELECTROSTATIC_FRACTION_MAX,
      activeControlAuthorityFactorMin: ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN,
      activeControlAuthorityMinN: ACTIVE_CONTROL_AUTHORITY_MIN_N,
      activeControlBandwidthFactorMin: ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN,
      gapNoiseFractionMax: GAP_NOISE_FRACTION_MAX,
      timingJitterCycleFractionMax: TIMING_JITTER_CYCLE_FRACTION_MAX,
      sectorBoundarySkewMaxSeconds: TIMING_JITTER_CYCLE_FRACTION_MAX / SWITCHING_RATE_HZ,
      lightCrossingSyncMarginMin: LIGHT_CROSSING_SYNC_MARGIN_MIN,
      phaseNoiseCycleFractionMax: PHASE_NOISE_CYCLE_FRACTION_MAX,
      controllerPhaseMarginMinDegrees: CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
      controllerGainMarginMinDb: CONTROLLER_GAIN_MARGIN_MIN_DB,
      thermalSinkCapacityFactorMin: THERMAL_SINK_CAPACITY_FACTOR_MIN,
      activeControlTimeTraceSampleCountMin: ACTIVE_CONTROL_TIME_TRACE_SAMPLE_COUNT_MIN,
      activeControlPhaseNoiseSpectrumBinCountMin:
        ACTIVE_CONTROL_PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
      activeControlLockAcquisitionTrialCountMin:
        ACTIVE_CONTROL_LOCK_ACQUISITION_TRIAL_COUNT_MIN,
      layerScalingSampleLayerCountMin: LAYER_SCALING_SAMPLE_LAYER_COUNT_MIN,
      layerScalingSampleInterfaceCountMin: LAYER_SCALING_SAMPLE_INTERFACE_COUNT_MIN,
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
