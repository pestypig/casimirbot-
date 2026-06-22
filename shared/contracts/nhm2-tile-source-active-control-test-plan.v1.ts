import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_ACTIVE_CONTROL_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_active_control_test_plan/v1";

export type Nhm2ActiveControlTestId =
  | "active_control_provenance"
  | "energy_per_cycle"
  | "control_bandwidth"
  | "gap_noise"
  | "heat_load"
  | "source_tensor_contamination"
  | "timing_jitter"
  | "failure_mode";

export type Nhm2ActiveControlTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2ActiveControlBlockedCampaignDomain =
  | "force_gap_pull_in"
  | "roughness_patch_potential"
  | "fatigue_layer_scaling"
  | "full_apparatus_tensor"
  | "material_credibility_gate"
  | "covariant_conservation"
  | "time_dependent_source_campaign";

export type Nhm2ActiveControlTargetValue = string | number | boolean | null;

export type Nhm2ActiveControlTestPlanItemV1 = {
  testId: Nhm2ActiveControlTestId;
  status: Nhm2ActiveControlTestStatus;
  blockerIds: string[];
  measurementTargets: Record<string, Nhm2ActiveControlTargetValue>;
  requiredMeasurement: string;
  acceptanceCriterion: string;
  falsificationRule: string;
  blocksCampaignDomains: Nhm2ActiveControlBlockedCampaignDomain[];
  artifactToProduce: string;
};

export type Nhm2TileSourceActiveControlTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_ACTIVE_CONTROL_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  activeControlTarget: {
    operatingGapMeters: 8e-9;
    switchingRateHz: 15e9;
    bandwidthFactorMin: 2;
    gapNoiseRmsMaxMeters: number;
    timingJitterMaxSeconds: number;
    phaseNoiseMaxSeconds: number;
    controllerPhaseMarginMinDegrees: 45;
    controllerGainMarginMinDb: 6;
    thermalSinkCapacityFactorMin: 1.2;
    sourceTensorContaminationFractionMax: 0.05;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2ActiveControlTestPlanItemV1[];
  summary: {
    activeControlReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2ActiveControlTestId | "none";
    nextRequiredArtifactToProduce: string | null;
    nextRequiredFalsificationRule: string | null;
    nextBlockedCampaignDomains: Nhm2ActiveControlBlockedCampaignDomain[];
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    bandwidthMargin: number | null;
    noiseMargin: number | null;
    timingMargin: number | null;
    energyPerCycleJ: number | null;
    heatLoadW: number | null;
    activeControlEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    activeControlPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    activeControlPassIsNotFullApparatusTensor: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceActiveControlTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const OPERATING_GAP_METERS = 8e-9;
const SWITCHING_RATE_HZ = 15e9;
const BANDWIDTH_FACTOR_MIN = 2;
const TIMING_JITTER_CYCLE_FRACTION_MAX = 0.1;
const PHASE_NOISE_CYCLE_FRACTION_MAX = 0.05;
const CONTROLLER_PHASE_MARGIN_MIN_DEGREES = 45;
const CONTROLLER_GAIN_MARGIN_MIN_DB = 6;
const THERMAL_SINK_CAPACITY_FACTOR_MIN = 1.2;
const BANDWIDTH_MIN_HZ = SWITCHING_RATE_HZ * BANDWIDTH_FACTOR_MIN;
const GAP_NOISE_RMS_MAX_METERS = 8e-11;
const TIMING_JITTER_MAX_SECONDS = TIMING_JITTER_CYCLE_FRACTION_MAX / SWITCHING_RATE_HZ;
const PHASE_NOISE_MAX_SECONDS = PHASE_NOISE_CYCLE_FRACTION_MAX / SWITCHING_RATE_HZ;
const REQUIRED_GAP_CONTROL_AUTHORITY_N = 17026.061141137077;
const REQUIRED_TRACE_REF_COUNT = 15;
const REQUIRED_FAILURE_MODE_COUNT = 5;
const SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX = 0.05;

const DEFAULT_BLOCKED_DOMAINS: Nhm2ActiveControlBlockedCampaignDomain[] = [
  "force_gap_pull_in",
  "roughness_patch_potential",
  "full_apparatus_tensor",
  "material_credibility_gate",
  "covariant_conservation",
  "time_dependent_source_campaign",
];

const TEST_POLICY: Record<
  Nhm2ActiveControlTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    falsificationRule: string;
    blocksCampaignDomains: Nhm2ActiveControlBlockedCampaignDomain[];
    artifactToProduce: string;
  }
> = {
  active_control_provenance: {
    blockers: [
      "active_gap_control_energy_and_noise_missing",
      "active_control_tier_not_measured_or_validated",
      "active_control_energy_waveform_ref_missing",
      "active_control_actuator_authority_trace_ref_missing",
      "active_control_gap_sensor_calibration_ref_missing",
      "active_control_transfer_function_ref_missing",
      "active_control_controller_stability_ref_missing",
      "active_control_gap_noise_trace_ref_missing",
      "active_control_noise_spectrum_ref_missing",
      "active_control_thermal_model_ref_missing",
      "active_control_heat_sink_capacity_trace_ref_missing",
      "active_control_heat_load_trace_ref_missing",
      "active_control_source_tensor_contamination_ref_missing",
      "active_control_timing_sync_trace_ref_missing",
      "active_control_phase_noise_spectrum_ref_missing",
      "active_control_lock_acquisition_trace_ref_missing",
      "active_control_failure_mode_ref_missing",
    ],
    requiredMeasurement:
      "Measured or validated-simulation active-control receipt with actuator authority, sensor calibration, controller transfer/stability, energy waveform, noise trace/spectrum, thermal model/sink, heat trace, timing/phase trace, lock acquisition, and failure-mode provenance.",
    acceptanceCriterion:
      "Evidence tier is measured or validated_simulation and all required active-control trace/model refs are present.",
    falsificationRule:
      "If active-control trace, model, calibration, timing, thermal, and failure-mode provenance is missing, the campaign cannot admit active control into source tensor, conservation, or time-dependent evidence.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://active_control/provenance_v1",
  },
  energy_per_cycle: {
    blockers: [
      "active_control_energy_per_cycle_missing",
      "active_control_energy_waveform_ref_missing",
      "active_control_actuator_authority_missing",
      "active_control_actuator_authority_trace_ref_missing",
    ],
    requiredMeasurement:
      "Active-control energy per cycle and waveform trace for the selected 447-layer operating mode.",
    acceptanceCriterion: "Finite energy per cycle is supplied with waveform provenance.",
    falsificationRule:
      "If finite energy per cycle, waveform provenance, or actuator authority is missing, active-control power and full-apparatus stress-energy terms remain inadmissible.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://active_control/energy_per_cycle_v1",
  },
  control_bandwidth: {
    blockers: [
      "gap_lock_bandwidth_missing",
      "gap_lock_bandwidth_below_2x_switching_rate",
      "active_control_transfer_function_ref_missing",
      "active_control_controller_stability_ref_missing",
      "controller_phase_margin_missing",
      "controller_phase_margin_below_45deg",
      "controller_gain_margin_missing",
      "controller_gain_margin_below_6db",
    ],
    requiredMeasurement:
      "Closed-loop gap-lock bandwidth and controller transfer function at the selected switching rate.",
    acceptanceCriterion:
      "Control bandwidth is at least 2x the 15 GHz switching rate and traceable to a transfer-function receipt.",
    falsificationRule:
      "If closed-loop bandwidth is below 30 GHz, transfer/stability refs are missing, phase margin is below 45 deg, or gain margin is below 6 dB, the 15 GHz gap-lock cadence is falsified for the frozen candidate.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://active_control/gap_lock_bandwidth_v1",
  },
  gap_noise: {
    blockers: [
      "gap_noise_receipt_missing",
      "gap_noise_above_1pct_gap",
      "active_control_gap_noise_trace_ref_missing",
      "active_control_noise_spectrum_ref_missing",
      "active_control_gap_sensor_calibration_ref_missing",
    ],
    requiredMeasurement: "Gap-noise RMS trace and spectrum for the 8 nm operating gap.",
    acceptanceCriterion:
      "Gap-noise RMS is no greater than 1% of the 8 nm operating gap and traceable to time/frequency evidence.",
    falsificationRule:
      "If RMS gap noise exceeds 80 pm or lacks trace, spectrum, and sensor calibration provenance, the 8 nm force-gap and source-tensor assumptions remain inadmissible.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://active_control/gap_noise_spectrum_v1",
  },
  heat_load: {
    blockers: [
      "active_control_heat_load_missing",
      "active_control_heat_sink_capacity_missing",
      "active_control_heat_sink_capacity_below_1p2x_heat_load",
      "active_control_thermal_model_ref_missing",
      "active_control_heat_sink_capacity_trace_ref_missing",
      "active_control_heat_load_trace_ref_missing",
    ],
    requiredMeasurement: "Thermal model and heat-load trace from active control at operating cadence.",
    acceptanceCriterion: "Finite heat load is supplied with thermal model and heat trace provenance.",
    falsificationRule:
      "If heat load is missing, below computed control power, or heat-sink capacity is below 1.2x heat load, active-control operation cannot be admitted into material or time-dependent source evidence.",
    blocksCampaignDomains: ["fatigue_layer_scaling", "full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://active_control/heat_load_v1",
  },
  source_tensor_contamination: {
    blockers: [
      "active_control_source_tensor_contamination_receipt_missing",
      "active_control_source_tensor_contamination_above_5pct",
      "active_control_source_tensor_contamination_ref_missing",
    ],
    requiredMeasurement:
      "Active-control source-tensor contamination receipt converting actuator fields, gap noise, and heat/timing sidebands into a fractional full-apparatus T_mu_nu contribution.",
    acceptanceCriterion:
      "Active-control contamination is no more than 5% of the intended source tensor and is backed by a contamination-model receipt.",
    falsificationRule:
      "If active-control fields, noise, or timing sidebands contaminate more than 5% of the apparatus source tensor, controller lock cannot be admitted as source-side T_mu_nu evidence.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://active_control/source_tensor_contamination_v1",
  },
  timing_jitter: {
    blockers: [
      "timing_jitter_receipt_missing",
      "timing_jitter_above_0p1_cycle",
      "phase_noise_receipt_missing",
      "phase_noise_above_0p05_cycle",
      "active_control_timing_sync_trace_ref_missing",
      "active_control_phase_noise_spectrum_ref_missing",
      "active_control_lock_acquisition_trace_ref_missing",
      "active_control_lock_acquisition_time_missing",
    ],
    requiredMeasurement: "Timing-jitter and synchronization trace for control action relative to switching cycle.",
    acceptanceCriterion: "Timing jitter is no greater than 0.1 cycle at 15 GHz with trace provenance.",
    falsificationRule:
      "If timing jitter exceeds 0.1 cycle, phase noise exceeds 0.05 cycle, or synchronization/lock acquisition traces are missing at 15 GHz, the synchronized time-dependent campaign is blocked.",
    blocksCampaignDomains: ["force_gap_pull_in", "full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://active_control/timing_jitter_v1",
  },
  failure_mode: {
    blockers: [
      "active_control_failure_mode_ref_missing",
      "active_control_loss_of_lock_failure_mode_missing",
      "active_control_thermal_runaway_failure_mode_missing",
      "active_control_noise_runaway_failure_mode_missing",
      "active_control_timing_desynchronization_failure_mode_missing",
      "active_control_fail_safe_shutdown_missing",
    ],
    requiredMeasurement:
      "Failure-mode receipt covering loss of lock, thermal runaway, noise runaway, timing desynchronization, and fail-safe shutdown.",
    acceptanceCriterion:
      "Failure-mode reference is present and explicitly covers all required active-control hazard classes.",
    falsificationRule:
      "If loss-of-lock, thermal-runaway, noise-runaway, timing-desynchronization, or fail-safe shutdown coverage is missing, the active-control campaign remains unsafe for full-apparatus tensor admission.",
    blocksCampaignDomains: ["force_gap_pull_in", "fatigue_layer_scaling", "full_apparatus_tensor", "material_credibility_gate", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://active_control/failure_modes_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const activeControlSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === "active_control_energy");
  if (surface == null) {
    throw new Error("active_control_energy surface missing from nhm2 material evidence receipts");
  }
  return surface;
};

const itemStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  blockers: string[],
): Nhm2ActiveControlTestStatus => {
  if (!blockers.some((blocker) => surface.blockers.includes(blocker))) return "satisfied";
  return surface.status === "fail" ? "falsifying" : "open";
};

const measurementTargetsForTest = (
  testId: Nhm2ActiveControlTestId,
): Record<string, Nhm2ActiveControlTargetValue> => {
  switch (testId) {
    case "active_control_provenance":
      return {
        requiredEvidenceTier: "measured_or_validated_simulation",
        requiredTraceRefCount: REQUIRED_TRACE_REF_COUNT,
        requiredFailureModeCount: REQUIRED_FAILURE_MODE_COUNT,
        switchingRateHz: SWITCHING_RATE_HZ,
      };
    case "energy_per_cycle":
      return {
        finiteEnergyPerCycleRequired: true,
        energyWaveformRefRequired: true,
        actuatorAuthorityMinN: REQUIRED_GAP_CONTROL_AUTHORITY_N,
      };
    case "control_bandwidth":
      return {
        switchingRateHz: SWITCHING_RATE_HZ,
        bandwidthMinHz: BANDWIDTH_MIN_HZ,
        controllerPhaseMarginMinDegrees: CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
        controllerGainMarginMinDb: CONTROLLER_GAIN_MARGIN_MIN_DB,
      };
    case "gap_noise":
      return {
        operatingGapMeters: OPERATING_GAP_METERS,
        gapNoiseRmsMaxMeters: GAP_NOISE_RMS_MAX_METERS,
        noiseSpectrumRefRequired: true,
        gapSensorCalibrationRefRequired: true,
      };
    case "heat_load":
      return {
        thermalSinkCapacityFactorMin: THERMAL_SINK_CAPACITY_FACTOR_MIN,
        heatLoadTraceRefRequired: true,
        thermalModelRefRequired: true,
      };
    case "source_tensor_contamination":
      return {
        sourceTensorContaminationFractionMax:
          SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
        sourceTensorContaminationRefRequired: true,
        activeControlFieldEnergyTermRequired: true,
      };
    case "timing_jitter":
      return {
        switchingRateHz: SWITCHING_RATE_HZ,
        timingJitterMaxSeconds: TIMING_JITTER_MAX_SECONDS,
        phaseNoiseMaxSeconds: PHASE_NOISE_MAX_SECONDS,
        lockAcquisitionTraceRefRequired: true,
      };
    case "failure_mode":
      return {
        requiredFailureModeCount: REQUIRED_FAILURE_MODE_COUNT,
        lossOfLockCoverageRequired: true,
        thermalRunawayCoverageRequired: true,
        noiseRunawayCoverageRequired: true,
        timingDesynchronizationCoverageRequired: true,
        failSafeShutdownCoverageRequired: true,
      };
  }
};

export const buildNhm2TileSourceActiveControlTestPlan = (
  input: BuildNhm2TileSourceActiveControlTestPlanInput,
): Nhm2TileSourceActiveControlTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const surface = activeControlSurface(receipts);
  const testItems = (Object.keys(TEST_POLICY) as Nhm2ActiveControlTestId[]).map((testId) => {
    const policy = TEST_POLICY[testId];
    const blockerIds = surface.blockers.filter((blocker) => policy.blockers.includes(blocker));
    return {
      testId,
      status: itemStatus(surface, policy.blockers),
      blockerIds,
      measurementTargets: measurementTargetsForTest(testId),
      requiredMeasurement: policy.requiredMeasurement,
      acceptanceCriterion: policy.acceptanceCriterion,
      falsificationRule: policy.falsificationRule,
      blocksCampaignDomains: policy.blocksCampaignDomains,
      artifactToProduce: policy.artifactToProduce,
    };
  });
  const openItems = testItems.filter((item) => item.status === "open");
  const falsifyingItems = testItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = testItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_ACTIVE_CONTROL_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    activeControlTarget: {
      operatingGapMeters: OPERATING_GAP_METERS,
      switchingRateHz: SWITCHING_RATE_HZ,
      bandwidthFactorMin: BANDWIDTH_FACTOR_MIN,
      gapNoiseRmsMaxMeters: GAP_NOISE_RMS_MAX_METERS,
      timingJitterMaxSeconds: TIMING_JITTER_MAX_SECONDS,
      phaseNoiseMaxSeconds: PHASE_NOISE_MAX_SECONDS,
      controllerPhaseMarginMinDegrees: CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
      controllerGainMarginMinDb: CONTROLLER_GAIN_MARGIN_MIN_DB,
      thermalSinkCapacityFactorMin: THERMAL_SINK_CAPACITY_FACTOR_MIN,
      sourceTensorContaminationFractionMax: SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      activeControlReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
      nextRequiredArtifactToProduce: nextItem?.artifactToProduce ?? null,
      nextRequiredFalsificationRule: nextItem?.falsificationRule ?? null,
      nextBlockedCampaignDomains: nextItem?.blocksCampaignDomains ?? [],
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      bandwidthMargin: surface.numericalMargins.bandwidthMargin ?? null,
      noiseMargin: surface.numericalMargins.noiseMargin ?? null,
      timingMargin: surface.numericalMargins.timingMargin ?? null,
      energyPerCycleJ: surface.numericalMargins.energyPerCycleJ ?? null,
      heatLoadW: surface.numericalMargins.heatLoadW ?? null,
      activeControlEvidenceReady: surface.status === "pass",
      falsifiesCurrentCandidate: surface.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      activeControlPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      activeControlPassIsNotFullApparatusTensor: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceActiveControlTestPlan = (
  value: unknown,
): value is Nhm2TileSourceActiveControlTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.activeControlTarget) ? value.activeControlTarget : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_ACTIVE_CONTROL_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.operatingGapMeters === 8e-9 &&
    target.switchingRateHz === 15e9 &&
    target.bandwidthFactorMin === 2 &&
    typeof target.gapNoiseRmsMaxMeters === "number" &&
    typeof target.timingJitterMaxSeconds === "number" &&
    typeof target.phaseNoiseMaxSeconds === "number" &&
    target.controllerPhaseMarginMinDegrees === 45 &&
    target.controllerGainMarginMinDb === 6 &&
    target.thermalSinkCapacityFactorMin === 1.2 &&
    target.sourceTensorContaminationFractionMax === 0.05 &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 8 &&
    value.testItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.testId === "string" &&
        ["satisfied", "open", "falsifying"].includes(String(item.status)) &&
        Array.isArray(item.blockerIds) &&
        isRecord(item.measurementTargets) &&
        Object.values(item.measurementTargets).every(
          (entry) =>
            entry === null ||
            typeof entry === "string" ||
            typeof entry === "number" ||
            typeof entry === "boolean",
        ) &&
        typeof item.requiredMeasurement === "string" &&
        typeof item.acceptanceCriterion === "string" &&
        typeof item.falsificationRule === "string" &&
        Array.isArray(item.blocksCampaignDomains) &&
        item.blocksCampaignDomains.every((domain) => typeof domain === "string") &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.activeControlReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    (summary.nextRequiredArtifactToProduce === null ||
      typeof summary.nextRequiredArtifactToProduce === "string") &&
    (summary.nextRequiredFalsificationRule === null ||
      typeof summary.nextRequiredFalsificationRule === "string") &&
    Array.isArray(summary.nextBlockedCampaignDomains) &&
    summary.nextBlockedCampaignDomains.every((domain) => typeof domain === "string") &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    (summary.bandwidthMargin === null || typeof summary.bandwidthMargin === "number") &&
    (summary.noiseMargin === null || typeof summary.noiseMargin === "number") &&
    (summary.timingMargin === null || typeof summary.timingMargin === "number") &&
    (summary.energyPerCycleJ === null || typeof summary.energyPerCycleJ === "number") &&
    (summary.heatLoadW === null || typeof summary.heatLoadW === "number") &&
    typeof summary.activeControlEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.activeControlPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.activeControlPassIsNotFullApparatusTensor === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
