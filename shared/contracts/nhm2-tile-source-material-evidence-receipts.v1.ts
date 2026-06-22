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
  material: "ultra_high_stress_tin" | "sin" | "aln_alscn" | "custom";
  measuredTensileStressPa: number | null;
  fractureOrYieldStressPa: number | null;
  supportStressPa: number | null;
  cryogenicTemperatureK: number | null;
  dielectricResponseRef?: string | null;
  conductivityRef?: string | null;
  roughnessRmsMeters: number | null;
  fabricationToleranceMeters: number | null;
};

export type Nhm2TileSourceForceGapPullInEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
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
  energyPerCycleJ: number | null;
  bandwidthHz: number | null;
  switchingRateHz: number | null;
  gapNoiseRmsMeters: number | null;
  heatLoadW: number | null;
  timingJitterSeconds: number | null;
  failureModeRef?: string | null;
};

export type Nhm2TileSourceFatigueLayerScalingEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
  cycleCountToFailure: number | null;
  requiredCycleCount: number | null;
  layerScalingEfficiency: number | null;
  nonadditivityFraction: number | null;
  activeAreaRetention: number | null;
  supportCouplingStatus: "pass" | "review" | "fail" | "missing";
};

export type Nhm2TileSourceFullApparatusTensorEvidenceV1 = {
  evidenceTier: Nhm2TileSourceEvidenceTier;
  evidenceRef?: string | null;
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
  termCoverage: Nhm2FullApparatusTensorTermCoverageV1 & {
    casimirInteractionStressEnergy: boolean;
    materialStrainEnergy: boolean;
  };
  regionalCoverage: {
    wall: boolean;
    hull: boolean;
    exteriorShell: boolean;
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
    patchVoltageRmsMaxVolts: 0.01;
    residualElectrostaticForceFractionMax: 0.05;
    activeControlAuthorityFactorMin: 1.2;
    activeControlBandwidthFactorMin: 2;
    gapNoiseFractionMax: 0.01;
    timingJitterCycleFractionMax: 0.1;
    layerScalingEfficiencyMin: 0.9;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
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
const PATCH_VOLTAGE_RMS_MAX_VOLTS = 0.01;
const RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX = 0.05;
const ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN = 1.2;
const ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN = 2;
const GAP_NOISE_FRACTION_MAX = 0.01;
const TIMING_JITTER_CYCLE_FRACTION_MAX = 0.1;
const LAYER_SCALING_EFFICIENCY_MIN = 0.9;
const LAYER_NONADDITIVITY_FRACTION_MAX = 0.1;
const ACTIVE_AREA_RETENTION_MIN = 0.6;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const measuredOrValidated = (tier: Nhm2TileSourceEvidenceTier): boolean =>
  tier === "measured" || tier === "validated_simulation";

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

const materialCouponSurface = (
  evidence: Nhm2TileSourceMaterialCouponEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply measured or validated coupon data for tensile/fracture stress, cryogenic state, dielectric response, conductivity, roughness, and fabrication tolerance.";
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
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["material_coupon_tier_not_measured_or_validated"] : []),
    ...(evidence.material !== "ultra_high_stress_tin" ? ["candidate_material_mismatch"] : []),
    ...(stressMargin == null ? ["fracture_or_yield_margin_missing"] : stressMargin < 1 ? ["fracture_or_yield_margin_below_2x_support_stress"] : []),
    ...(evidence.measuredTensileStressPa == null ? ["measured_tensile_stress_missing"] : []),
    ...(evidence.cryogenicTemperatureK == null || evidence.cryogenicTemperatureK > 4 ? ["cryogenic_4k_coupon_receipt_missing"] : []),
    ...(evidence.dielectricResponseRef == null ? ["dielectric_response_ref_missing"] : []),
    ...(evidence.conductivityRef == null ? ["conductivity_ref_missing"] : []),
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
      roughnessRmsMeters: evidence.roughnessRmsMeters,
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
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["force_gap_tier_not_measured_or_validated"] : []),
    ...(evidence.gapMeters == null || Math.abs(evidence.gapMeters - REQUIRED_GAP_METERS) > 1e-12 ? ["force_gap_not_at_8nm"] : []),
    ...(evidence.casimirForceN == null ? ["casimir_force_at_gap_missing"] : []),
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
      gapMeters: evidence.gapMeters,
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
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["roughness_patch_tier_not_measured_or_validated"] : []),
    ...(evidence.roughnessRmsMeters == null || evidence.roughnessRmsMeters > ROUGHNESS_RMS_MAX_METERS ? ["roughness_rms_above_0p1nm_or_missing"] : []),
    ...(evidence.asperityP99Meters == null ? ["asperity_p99_missing"] : []),
    ...(asperityMaxMargin == null ? ["asperity_tail_margin_missing"] : asperityMaxMargin < 1 ? ["asperity_tail_exceeds_half_gap"] : []),
    ...(evidence.patchVoltageRmsVolts == null || evidence.patchVoltageRmsVolts > PATCH_VOLTAGE_RMS_MAX_VOLTS ? ["patch_voltage_rms_above_10mv_or_missing"] : []),
    ...(evidence.residualElectrostaticForceFraction == null ||
    evidence.residualElectrostaticForceFraction > RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX
      ? ["residual_electrostatic_force_correction_above_5pct_or_missing"]
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
    },
    requiredChange,
  };
};

const activeControlSurface = (
  evidence: Nhm2TileSourceActiveControlEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply active-control energy, noise, heat, bandwidth, timing synchronization, and failure-mode receipts.";
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
  const blockers = [
    ...(!measuredOrValidated(evidence.evidenceTier) ? ["active_control_tier_not_measured_or_validated"] : []),
    ...(evidence.energyPerCycleJ == null || !Number.isFinite(evidence.energyPerCycleJ) ? ["active_control_energy_per_cycle_missing"] : []),
    ...(bandwidthMargin == null ? ["gap_lock_bandwidth_missing"] : bandwidthMargin < 1 ? ["gap_lock_bandwidth_below_2x_switching_rate"] : []),
    ...(noiseMargin == null ? ["gap_noise_receipt_missing"] : noiseMargin < 1 ? ["gap_noise_above_1pct_gap"] : []),
    ...(evidence.heatLoadW == null || !Number.isFinite(evidence.heatLoadW) ? ["active_control_heat_load_missing"] : []),
    ...(timingMargin == null ? ["timing_jitter_receipt_missing"] : timingMargin < 1 ? ["timing_jitter_above_0p1_cycle"] : []),
    ...(evidence.failureModeRef == null ? ["active_control_failure_mode_ref_missing"] : []),
  ];
  return {
    surfaceId: "active_control_energy",
    status: statusFromBlockers(evidence.evidenceTier, blockers),
    evidenceTier: evidence.evidenceTier,
    evidenceRef: evidence.evidenceRef ?? null,
    blockers,
    numericalMargins: {
      bandwidthMargin,
      noiseMargin,
      timingMargin,
      energyPerCycleJ: evidence.energyPerCycleJ,
      heatLoadW: evidence.heatLoadW,
    },
    requiredChange,
  };
};

const fatigueLayerScalingSurfaces = (
  evidence: Nhm2TileSourceFatigueLayerScalingEvidenceV1 | null | undefined,
): [Nhm2TileSourceReceiptSurfaceStatusV1, Nhm2TileSourceReceiptSurfaceStatusV1] => {
  const fatigueRequiredChange =
    "Supply fatigue, creep/drift, and cycling lifetime evidence for the selected 447-layer architecture.";
  const scalingRequiredChange =
    "Supply 447-layer scaling, nonadditivity, support-coupling, and active-area-retention evidence.";
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
  const tierBlockers = !measuredOrValidated(evidence.evidenceTier)
    ? ["fatigue_layer_scaling_tier_not_measured_or_validated"]
    : [];
  const fatigueBlockers = [
    ...tierBlockers,
    ...(cycleMargin == null ? ["fatigue_cycle_margin_missing"] : cycleMargin < 1 ? ["fatigue_cycle_margin_below_required"] : []),
  ];
  const scalingBlockers = [
    ...tierBlockers,
    ...(scalingMargin == null ? ["layer_scaling_efficiency_missing"] : scalingMargin < 1 ? ["layer_scaling_efficiency_below_0p9"] : []),
    ...(nonadditivityMargin == null ? ["layer_nonadditivity_fraction_missing"] : nonadditivityMargin < 1 ? ["layer_nonadditivity_above_0p1"] : []),
    ...(activeAreaMargin == null ? ["active_area_retention_missing"] : activeAreaMargin < 1 ? ["active_area_retention_below_0p6"] : []),
    ...(evidence.supportCouplingStatus !== "pass" ? ["support_coupling_status_not_pass"] : []),
  ];
  return [
    {
      surfaceId: "fatigue_lifetime",
      status: statusFromBlockers(evidence.evidenceTier, fatigueBlockers),
      evidenceTier: evidence.evidenceTier,
      evidenceRef: evidence.evidenceRef ?? null,
      blockers: fatigueBlockers,
      numericalMargins: { cycleMargin },
      requiredChange: fatigueRequiredChange,
    },
    {
      surfaceId: "layer_scaling",
      status: statusFromBlockers(evidence.evidenceTier, scalingBlockers),
      evidenceTier: evidence.evidenceTier,
      evidenceRef: evidence.evidenceRef ?? null,
      blockers: scalingBlockers,
      numericalMargins: { scalingMargin, nonadditivityMargin, activeAreaMargin },
      requiredChange: scalingRequiredChange,
    },
  ];
};

const fullApparatusTensorSurface = (
  evidence: Nhm2TileSourceFullApparatusTensorEvidenceV1 | null | undefined,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const requiredChange =
    "Supply source-side full apparatus T_munu with all components, support/control/thermal/electrostatic/material terms, regional coverage, and no metric-target echo.";
  if (evidence == null) {
    return missingSurface("full_apparatus_tensor", "support_drive_terms_in_full_apparatus_Tmunu_missing", requiredChange);
  }
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
    ...(!evidence.sameChart ? ["full_apparatus_tensor_not_same_chart"] : []),
    ...(!evidence.sameBasis ? ["full_apparatus_tensor_not_same_basis"] : []),
    ...(!evidence.sameUnits ? ["full_apparatus_tensor_not_same_units"] : []),
    ...(!evidence.noMetricTargetEcho ? ["full_apparatus_tensor_metric_echo_detected_or_not_checked"] : []),
    ...(!evidence.components.T00 ? ["full_apparatus_T00_missing"] : []),
    ...(!evidence.components.T0i ? ["full_apparatus_T0i_missing"] : []),
    ...(!evidence.components.diagonalTij ? ["full_apparatus_diagonal_Tij_missing"] : []),
    ...(!evidence.components.offDiagonalTij ? ["full_apparatus_off_diagonal_Tij_missing"] : []),
    ...missingTermBlockers,
    ...(missingTermBlockers.length > 0 ? ["full_apparatus_tensor_term_coverage_incomplete"] : []),
    ...(!evidence.regionalCoverage.wall ? ["full_apparatus_wall_region_missing"] : []),
    ...(!evidence.regionalCoverage.hull ? ["full_apparatus_hull_region_missing"] : []),
    ...(!evidence.regionalCoverage.exteriorShell ? ["full_apparatus_exterior_shell_region_missing"] : []),
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
      patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
      residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      activeControlAuthorityFactorMin: ACTIVE_CONTROL_AUTHORITY_FACTOR_MIN,
      activeControlBandwidthFactorMin: ACTIVE_CONTROL_BANDWIDTH_FACTOR_MIN,
      gapNoiseFractionMax: GAP_NOISE_FRACTION_MAX,
      timingJitterCycleFractionMax: TIMING_JITTER_CYCLE_FRACTION_MAX,
      layerScalingEfficiencyMin: LAYER_SCALING_EFFICIENCY_MIN,
      layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
      activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
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
