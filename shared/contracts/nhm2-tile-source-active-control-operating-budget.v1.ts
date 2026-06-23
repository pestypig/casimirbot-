import type {
  Nhm2TileSourceActiveControlEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";
import {
  buildNhm2TileSourceForceGapLoadBudget,
  isNhm2TileSourceForceGapLoadBudget,
  type Nhm2TileSourceForceGapLoadBudgetV1,
} from "./nhm2-tile-source-force-gap-load-budget.v1";

export const NHM2_TILE_SOURCE_ACTIVE_CONTROL_OPERATING_BUDGET_CONTRACT_VERSION =
  "nhm2_tile_source_active_control_operating_budget/v1";

export type Nhm2TileSourceActiveControlOperatingBudgetV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_ACTIVE_CONTROL_OPERATING_BUDGET_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    forceGapLoadBudgetRef: string | null;
    activeControlEvidenceRef: string | null;
  };
  operatingTargets: {
    gapMeters: 8e-9;
    switchingRateHz: 15e9;
    bandwidthMinHz: 30e9;
    gapNoiseRmsMaxMeters: 8e-11;
    timingJitterMaxSeconds: number;
    phaseNoiseMaxSeconds: number;
    controllerPhaseMarginMinDegrees: 45;
    controllerGainMarginMinDb: 6;
    thermalSinkCapacityFactorMin: 1.2;
    sourceTensorContaminationFractionMax: 0.05;
    requiredGapControlAuthorityN: number;
    timeTraceSampleCountMin: number;
    phaseNoiseSpectrumBinCountMin: number;
    lockAcquisitionTrialCountMin: number;
  };
  suppliedActiveControlEvidence: {
    evidenceTier: string;
    energyWaveformRef: string | null;
    actuatorAuthorityTraceRef: string | null;
    gapSensorCalibrationRef: string | null;
    controlTransferFunctionRef: string | null;
    controllerStabilityRef: string | null;
    gapNoiseTraceRef: string | null;
    thermalModelRef: string | null;
    heatSinkCapacityTraceRef: string | null;
    heatLoadTraceRef: string | null;
    sourceTensorContaminationRef: string | null;
    timingSyncTraceRef: string | null;
    phaseNoiseSpectrumRef: string | null;
    lockAcquisitionTraceRef: string | null;
    energyWaveformSampleCount: number | null;
    actuatorAuthorityTraceSampleCount: number | null;
    gapNoiseTraceSampleCount: number | null;
    heatLoadTraceSampleCount: number | null;
    timingSyncTraceSampleCount: number | null;
    phaseNoiseSpectrumBinCount: number | null;
    lockAcquisitionTrialCount: number | null;
    energyPerCycleJ: number | null;
    actuatorAuthorityN: number | null;
    bandwidthHz: number | null;
    switchingRateHz: number | null;
    gapNoiseRmsMeters: number | null;
    noiseSpectrumRef: string | null;
    heatLoadW: number | null;
    heatSinkCapacityW: number | null;
    sourceTensorContaminationFraction: number | null;
    timingJitterSeconds: number | null;
    phaseNoiseRmsSeconds: number | null;
    controllerPhaseMarginDegrees: number | null;
    controllerGainMarginDb: number | null;
    lockAcquisitionTimeSeconds: number | null;
    failureModeRef: string | null;
    failureModeCoverage: {
      lossOfLock: boolean;
      thermalRunaway: boolean;
      noiseRunaway: boolean;
      timingDesynchronization: boolean;
      failSafeShutdown: boolean;
    } | null;
  };
  derivedOperatingBudget: {
    controlPowerW: number | null;
    gapControlAuthorityMargin: number | null;
    suppliedActuatorAuthorityMargin: number | null;
    activeControlTraceRefsAvailable: boolean;
    activeControlCalibrationRefsAvailable: boolean;
    noiseSpectrumAvailable: boolean;
    failureModeCoverageComplete: boolean;
    activeControlTraceSamplingComplete: boolean;
    switchingRateMargin: number | null;
    bandwidthMargin: number | null;
    noiseMargin: number | null;
    timingMargin: number | null;
    phaseNoiseMargin: number | null;
    controllerPhaseMargin: number | null;
    controllerGainMargin: number | null;
    thermalAccountingMargin: number | null;
    thermalSinkCapacityMargin: number | null;
    sourceTensorContaminationMargin: number | null;
    energyWaveformSampleCountMargin: number | null;
    actuatorAuthorityTraceSampleCountMargin: number | null;
    gapNoiseTraceSampleCountMargin: number | null;
    heatLoadTraceSampleCountMargin: number | null;
    timingSyncTraceSampleCountMargin: number | null;
    phaseNoiseSpectrumBinCountMargin: number | null;
    lockAcquisitionTrialCountMargin: number | null;
  };
  requiredCorrections: {
    switchingRateTargetHz: 15e9;
    switchingRateAbsDeltaHz: number | null;
    bandwidthMinHz: 30e9;
    bandwidthShortfallHz: number | null;
    gapControlAuthorityMinN: number;
    suppliedGapControlAuthorityN: number | null;
    suppliedActuatorAuthorityN: number | null;
    gapControlAuthorityShortfallN: number | null;
    actuatorAuthorityShortfallN: number | null;
    gapNoiseRmsMaxMeters: 8e-11;
    gapNoiseRmsReductionMeters: number | null;
    timingJitterMaxSeconds: number;
    timingJitterReductionSeconds: number | null;
    phaseNoiseMaxSeconds: number;
    phaseNoiseReductionSeconds: number | null;
    controllerPhaseMarginMinDegrees: 45;
    controllerPhaseMarginShortfallDegrees: number | null;
    controllerGainMarginMinDb: 6;
    controllerGainMarginShortfallDb: number | null;
    controlPowerW: number | null;
    heatLoadMinW: number | null;
    heatLoadShortfallW: number | null;
    heatSinkCapacityCriterion: string;
    heatSinkCapacityMinW: number | null;
    heatSinkCapacityShortfallW: number | null;
    energyPerCycleHeatLimitedMaxJ: number | null;
    energyPerCycleReductionJ: number | null;
    sourceTensorContaminationFractionMax: 0.05;
    sourceTensorContaminationFractionReduction: number | null;
    requiredTraceRefCount: 15;
    missingTraceRefCount: number;
    timeTraceSampleCountMin: number;
    energyWaveformSampleCountShortfall: number | null;
    actuatorAuthorityTraceSampleCountShortfall: number | null;
    gapNoiseTraceSampleCountShortfall: number | null;
    heatLoadTraceSampleCountShortfall: number | null;
    timingSyncTraceSampleCountShortfall: number | null;
    phaseNoiseSpectrumBinCountMin: number;
    phaseNoiseSpectrumBinCountShortfall: number | null;
    lockAcquisitionTrialCountMin: number;
    lockAcquisitionTrialCountShortfall: number | null;
    requiredFailureModeCount: 5;
    missingFailureModeCount: number;
  };
  blockers: string[];
  summary: {
    operatingBudgetComputed: boolean;
    activeControlEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetOnly: true;
    controllerEvidenceDoesNotSupplyFullApparatusTensor: true;
    heatAndTimingReceiptsRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceActiveControlOperatingBudgetInput = {
  generatedAt?: string | null;
  forceGapLoadBudget?: Nhm2TileSourceForceGapLoadBudgetV1 | null;
  forceGapLoadBudgetRef?: string | null;
  activeControlEvidence?: Nhm2TileSourceActiveControlEvidenceV1 | null;
};

const SWITCHING_RATE_HZ = 15e9;
const BANDWIDTH_MIN_HZ = 30e9;
const GAP_NOISE_MAX_METERS = 8e-11;
const TIMING_JITTER_MAX_SECONDS = 0.1 / SWITCHING_RATE_HZ;
const PHASE_NOISE_MAX_SECONDS = 0.05 / SWITCHING_RATE_HZ;
const CONTROLLER_PHASE_MARGIN_MIN_DEGREES = 45;
const CONTROLLER_GAIN_MARGIN_MIN_DB = 6;
const THERMAL_SINK_CAPACITY_FACTOR_MIN = 1.2;
const SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX = 0.05;
const TIME_TRACE_SAMPLE_COUNT_MIN = 4096;
const PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN = 512;
const LOCK_ACQUISITION_TRIAL_COUNT_MIN = 100;
const HEAT_SINK_CAPACITY_CRITERION =
  "heatSinkCapacityW >= 1.2 * max(heatLoadW, energyPerCycleJ * switchingRateHz)";

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const isPositiveFinite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

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

const switchingRateMatchesTarget = (rateHz: number | null): boolean =>
  rateHz != null && Math.abs(rateHz - SWITCHING_RATE_HZ) <= SWITCHING_RATE_HZ * 1e-9;

const shortfallToMinimum = (value: number | null | undefined, minimum: number): number | null =>
  value == null ? null : round(Math.max(0, minimum - value));

const reductionToMaximum = (value: number | null | undefined, maximum: number): number | null =>
  value == null ? null : round(Math.max(0, value - maximum));

const sampleCountMargin = (minimum: number, value: number | null | undefined): number | null =>
  value == null || !Number.isFinite(value) ? null : round(value / minimum);

const sampleCountShortfall = (
  minimum: number,
  value: number | null | undefined,
): number | null => (value == null ? null : round(Math.max(0, minimum - value)));

export const buildNhm2TileSourceActiveControlOperatingBudget = (
  input: BuildNhm2TileSourceActiveControlOperatingBudgetInput = {},
): Nhm2TileSourceActiveControlOperatingBudgetV1 => {
  const forceGapLoadBudget =
    input.forceGapLoadBudget ??
    buildNhm2TileSourceForceGapLoadBudget({ generatedAt: input.generatedAt });
  if (!isNhm2TileSourceForceGapLoadBudget(forceGapLoadBudget)) {
    throw new Error("force gap load budget must be nhm2_tile_source_force_gap_load_budget/v1");
  }
  const evidence = input.activeControlEvidence ?? null;
  const gapControlAuthorityMargin =
    forceGapLoadBudget.margins.activeAuthorityMarginToIdealLoad;
  const energyPerCycleValid = isPositiveFinite(evidence?.energyPerCycleJ);
  const actuatorAuthorityValid = isPositiveFinite(evidence?.actuatorAuthorityN);
  const switchingRateValid = isPositiveFinite(evidence?.switchingRateHz);
  const bandwidthValid = isPositiveFinite(evidence?.bandwidthHz);
  const gapNoiseValid = isPositiveFinite(evidence?.gapNoiseRmsMeters);
  const timingJitterValid = isPositiveFinite(evidence?.timingJitterSeconds);
  const phaseNoiseValid = isPositiveFinite(evidence?.phaseNoiseRmsSeconds);
  const controllerPhaseMarginValid = isPositiveFinite(evidence?.controllerPhaseMarginDegrees);
  const controllerGainMarginValid = isPositiveFinite(evidence?.controllerGainMarginDb);
  const heatLoadValid = isNonNegativeFinite(evidence?.heatLoadW);
  const heatSinkCapacityValid = isPositiveFinite(evidence?.heatSinkCapacityW);
  const sourceTensorContaminationValid = isUnitFraction(
    evidence?.sourceTensorContaminationFraction,
  );
  const lockAcquisitionTimeValid = isPositiveFinite(evidence?.lockAcquisitionTimeSeconds);
  const energyWaveformSampleCountValid = isPositiveInteger(evidence?.energyWaveformSampleCount);
  const actuatorAuthorityTraceSampleCountValid = isPositiveInteger(
    evidence?.actuatorAuthorityTraceSampleCount,
  );
  const gapNoiseTraceSampleCountValid = isPositiveInteger(evidence?.gapNoiseTraceSampleCount);
  const heatLoadTraceSampleCountValid = isPositiveInteger(evidence?.heatLoadTraceSampleCount);
  const timingSyncTraceSampleCountValid = isPositiveInteger(evidence?.timingSyncTraceSampleCount);
  const phaseNoiseSpectrumBinCountValid = isPositiveInteger(
    evidence?.phaseNoiseSpectrumBinCount,
  );
  const lockAcquisitionTrialCountValid = isPositiveInteger(evidence?.lockAcquisitionTrialCount);
  const energyPerCycleJ = energyPerCycleValid ? evidence?.energyPerCycleJ ?? null : null;
  const actuatorAuthorityN = actuatorAuthorityValid ? evidence?.actuatorAuthorityN ?? null : null;
  const evidenceSwitchingRate = switchingRateValid ? evidence?.switchingRateHz ?? null : null;
  const bandwidthHz = bandwidthValid ? evidence?.bandwidthHz ?? null : null;
  const gapNoiseRmsMeters = gapNoiseValid ? evidence?.gapNoiseRmsMeters ?? null : null;
  const timingJitterSeconds = timingJitterValid ? evidence?.timingJitterSeconds ?? null : null;
  const phaseNoiseRmsSeconds = phaseNoiseValid ? evidence?.phaseNoiseRmsSeconds ?? null : null;
  const controllerPhaseMarginDegrees = controllerPhaseMarginValid
    ? evidence?.controllerPhaseMarginDegrees ?? null
    : null;
  const controllerGainMarginDb = controllerGainMarginValid
    ? evidence?.controllerGainMarginDb ?? null
    : null;
  const heatLoadW = heatLoadValid ? evidence?.heatLoadW ?? null : null;
  const heatSinkCapacityW = heatSinkCapacityValid ? evidence?.heatSinkCapacityW ?? null : null;
  const sourceTensorContaminationFraction = sourceTensorContaminationValid
    ? evidence?.sourceTensorContaminationFraction ?? null
    : null;
  const suppliedActuatorAuthorityMargin = safeRatio(
    actuatorAuthorityN,
    forceGapLoadBudget.idealLoadBudget.requiredActiveGapControlAuthorityN,
  );
  const controlPowerW =
    energyPerCycleJ == null || evidenceSwitchingRate == null
      ? null
      : round(energyPerCycleJ * evidenceSwitchingRate);
  const switchingRateMargin =
    evidenceSwitchingRate == null
      ? null
      : round(Math.min(evidenceSwitchingRate, SWITCHING_RATE_HZ) / SWITCHING_RATE_HZ);
  const bandwidthMargin = safeRatio(bandwidthHz, BANDWIDTH_MIN_HZ);
  const noiseMargin = safeRatio(
    GAP_NOISE_MAX_METERS,
    gapNoiseRmsMeters,
  );
  const timingMargin = safeRatio(
    TIMING_JITTER_MAX_SECONDS,
    timingJitterSeconds,
  );
  const phaseNoiseMargin = safeRatio(
    PHASE_NOISE_MAX_SECONDS,
    phaseNoiseRmsSeconds,
  );
  const controllerPhaseMargin = safeRatio(
    controllerPhaseMarginDegrees,
    CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
  );
  const controllerGainMargin = safeRatio(
    controllerGainMarginDb,
    CONTROLLER_GAIN_MARGIN_MIN_DB,
  );
  const thermalAccountingMargin = safeRatio(heatLoadW, controlPowerW);
  const failureModeCoverage = evidence?.failureModeCoverage ?? null;
  const requiredGapControlAuthorityN =
    forceGapLoadBudget.idealLoadBudget.requiredActiveGapControlAuthorityN;
  const suppliedGapControlAuthorityN =
    gapControlAuthorityMargin == null
      ? null
      : round(gapControlAuthorityMargin * requiredGapControlAuthorityN);
  const heatLoadMinW = controlPowerW;
  const heatSinkReferenceLoadW = heatLoadW ?? controlPowerW;
  const heatSinkCapacityMinW =
    heatSinkReferenceLoadW == null
      ? null
      : round(heatSinkReferenceLoadW * THERMAL_SINK_CAPACITY_FACTOR_MIN);
  const thermalSinkCapacityMargin = safeRatio(
    heatSinkCapacityW,
    heatSinkCapacityMinW,
  );
  const sourceTensorContaminationMargin = upperBoundUnitFractionMargin(
    SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
    sourceTensorContaminationFraction,
  );
  const energyWaveformSampleCountMargin = sampleCountMargin(
    TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence?.energyWaveformSampleCount,
  );
  const actuatorAuthorityTraceSampleCountMargin = sampleCountMargin(
    TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence?.actuatorAuthorityTraceSampleCount,
  );
  const gapNoiseTraceSampleCountMargin = sampleCountMargin(
    TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence?.gapNoiseTraceSampleCount,
  );
  const heatLoadTraceSampleCountMargin = sampleCountMargin(
    TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence?.heatLoadTraceSampleCount,
  );
  const timingSyncTraceSampleCountMargin = sampleCountMargin(
    TIME_TRACE_SAMPLE_COUNT_MIN,
    evidence?.timingSyncTraceSampleCount,
  );
  const phaseNoiseSpectrumBinCountMargin = sampleCountMargin(
    PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
    evidence?.phaseNoiseSpectrumBinCount,
  );
  const lockAcquisitionTrialCountMargin = sampleCountMargin(
    LOCK_ACQUISITION_TRIAL_COUNT_MIN,
    evidence?.lockAcquisitionTrialCount,
  );
  const activeControlTraceSamplingComplete =
    (energyWaveformSampleCountMargin ?? 0) >= 1 &&
    (actuatorAuthorityTraceSampleCountMargin ?? 0) >= 1 &&
    (gapNoiseTraceSampleCountMargin ?? 0) >= 1 &&
    (heatLoadTraceSampleCountMargin ?? 0) >= 1 &&
    (timingSyncTraceSampleCountMargin ?? 0) >= 1 &&
    (phaseNoiseSpectrumBinCountMargin ?? 0) >= 1 &&
    (lockAcquisitionTrialCountMargin ?? 0) >= 1;
  const energyPerCycleHeatLimitedMaxJ =
    heatLoadW == null || evidenceSwitchingRate == null || evidenceSwitchingRate === 0
      ? null
      : round(heatLoadW / evidenceSwitchingRate);
  const traceRefs = [
    evidence?.energyWaveformRef,
    evidence?.actuatorAuthorityTraceRef,
    evidence?.gapSensorCalibrationRef,
    evidence?.controlTransferFunctionRef,
    evidence?.controllerStabilityRef,
    evidence?.gapNoiseTraceRef,
    evidence?.noiseSpectrumRef,
    evidence?.thermalModelRef,
    evidence?.heatSinkCapacityTraceRef,
    evidence?.heatLoadTraceRef,
    evidence?.sourceTensorContaminationRef,
    evidence?.timingSyncTraceRef,
    evidence?.phaseNoiseSpectrumRef,
    evidence?.lockAcquisitionTraceRef,
    evidence?.failureModeRef,
  ];
  const missingTraceRefCount = traceRefs.filter((ref) => ref == null).length;
  const missingFailureModeCount = [
    failureModeCoverage?.lossOfLock === true,
    failureModeCoverage?.thermalRunaway === true,
    failureModeCoverage?.noiseRunaway === true,
    failureModeCoverage?.timingDesynchronization === true,
    failureModeCoverage?.failSafeShutdown === true,
  ].filter((covered) => !covered).length;
  const failureModeCoverageComplete =
    failureModeCoverage?.lossOfLock === true &&
    failureModeCoverage.thermalRunaway === true &&
    failureModeCoverage.noiseRunaway === true &&
    failureModeCoverage.timingDesynchronization === true &&
    failureModeCoverage.failSafeShutdown === true;
  const blockers = [
    ...(evidence == null || evidence.evidenceTier === "missing"
      ? ["active_control_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence?.evidenceTier !== "measured" &&
    evidence?.evidenceTier !== "validated_simulation"
      ? ["active_control_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence?.energyPerCycleJ == null
      ? ["active_control_energy_per_cycle_missing_for_power_budget"]
      : !energyPerCycleValid
        ? ["active_control_energy_per_cycle_invalid_for_operating_budget"]
        : []),
    ...(evidence?.energyWaveformRef == null
      ? ["active_control_energy_waveform_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.energyWaveformSampleCount == null
      ? ["active_control_energy_waveform_sample_count_missing_for_operating_budget"]
      : !energyWaveformSampleCountValid
        ? ["active_control_energy_waveform_sample_count_invalid_for_operating_budget"]
        : energyWaveformSampleCountMargin == null
          ? ["active_control_energy_waveform_sample_count_missing_for_operating_budget"]
          : energyWaveformSampleCountMargin < 1
            ? ["active_control_energy_waveform_sample_count_below_4096_for_operating_budget"]
            : []),
    ...(evidence?.actuatorAuthorityTraceRef == null
      ? ["active_control_actuator_authority_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.actuatorAuthorityTraceSampleCount == null
      ? ["active_control_actuator_authority_trace_sample_count_missing_for_operating_budget"]
      : !actuatorAuthorityTraceSampleCountValid
        ? ["active_control_actuator_authority_trace_sample_count_invalid_for_operating_budget"]
        : actuatorAuthorityTraceSampleCountMargin == null
          ? ["active_control_actuator_authority_trace_sample_count_missing_for_operating_budget"]
          : actuatorAuthorityTraceSampleCountMargin < 1
            ? ["active_control_actuator_authority_trace_sample_count_below_4096_for_operating_budget"]
            : []),
    ...(evidence?.gapSensorCalibrationRef == null
      ? ["active_control_gap_sensor_calibration_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.switchingRateHz == null
      ? ["active_control_switching_rate_missing_for_operating_budget"]
      : !switchingRateValid
        ? ["active_control_switching_rate_invalid_for_operating_budget"]
        : switchingRateMatchesTarget(evidenceSwitchingRate)
          ? []
          : ["active_control_switching_rate_not_15ghz"]),
    ...(controlPowerW == null ? ["active_control_power_budget_missing"] : []),
    ...(gapControlAuthorityMargin == null
      ? ["active_control_gap_authority_margin_missing_for_447_layer_load"]
      : gapControlAuthorityMargin < 1
        ? ["active_control_gap_authority_below_447_layer_load"]
        : []),
    ...(evidence?.actuatorAuthorityN == null
      ? ["active_control_actuator_authority_missing_for_operating_budget"]
      : !actuatorAuthorityValid
        ? ["active_control_actuator_authority_invalid_for_operating_budget"]
        : suppliedActuatorAuthorityMargin == null
          ? ["active_control_actuator_authority_missing_for_operating_budget"]
          : suppliedActuatorAuthorityMargin < 1
            ? ["active_control_supplied_actuator_authority_below_447_layer_load"]
            : []),
    ...(evidence?.bandwidthHz == null
      ? ["active_control_bandwidth_missing_for_operating_budget"]
      : !bandwidthValid
        ? ["active_control_bandwidth_invalid_for_operating_budget"]
        : bandwidthMargin == null
          ? ["active_control_bandwidth_missing_for_operating_budget"]
          : bandwidthMargin < 1
            ? ["active_control_bandwidth_below_30ghz"]
            : []),
    ...(evidence?.controlTransferFunctionRef == null
      ? ["active_control_transfer_function_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.controllerStabilityRef == null
      ? ["active_control_controller_stability_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.controllerPhaseMarginDegrees == null
      ? ["active_control_controller_phase_margin_missing_for_operating_budget"]
      : !controllerPhaseMarginValid
        ? ["active_control_controller_phase_margin_invalid_for_operating_budget"]
        : controllerPhaseMargin == null
          ? ["active_control_controller_phase_margin_missing_for_operating_budget"]
          : controllerPhaseMargin < 1
            ? ["active_control_controller_phase_margin_below_45deg"]
            : []),
    ...(evidence?.controllerGainMarginDb == null
      ? ["active_control_controller_gain_margin_missing_for_operating_budget"]
      : !controllerGainMarginValid
        ? ["active_control_controller_gain_margin_invalid_for_operating_budget"]
        : controllerGainMargin == null
          ? ["active_control_controller_gain_margin_missing_for_operating_budget"]
          : controllerGainMargin < 1
            ? ["active_control_controller_gain_margin_below_6db"]
            : []),
    ...(evidence?.gapNoiseRmsMeters == null
      ? ["active_control_gap_noise_missing_for_operating_budget"]
      : !gapNoiseValid
        ? ["active_control_gap_noise_invalid_for_operating_budget"]
        : noiseMargin == null
          ? ["active_control_gap_noise_missing_for_operating_budget"]
          : noiseMargin < 1
            ? ["active_control_gap_noise_above_80pm"]
            : []),
    ...(evidence?.gapNoiseTraceRef == null
      ? ["active_control_gap_noise_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.gapNoiseTraceSampleCount == null
      ? ["active_control_gap_noise_trace_sample_count_missing_for_operating_budget"]
      : !gapNoiseTraceSampleCountValid
        ? ["active_control_gap_noise_trace_sample_count_invalid_for_operating_budget"]
        : gapNoiseTraceSampleCountMargin == null
          ? ["active_control_gap_noise_trace_sample_count_missing_for_operating_budget"]
          : gapNoiseTraceSampleCountMargin < 1
            ? ["active_control_gap_noise_trace_sample_count_below_4096_for_operating_budget"]
            : []),
    ...(evidence?.noiseSpectrumRef == null
      ? ["active_control_noise_spectrum_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.timingJitterSeconds == null
      ? ["active_control_timing_jitter_missing_for_operating_budget"]
      : !timingJitterValid
        ? ["active_control_timing_jitter_invalid_for_operating_budget"]
        : timingMargin == null
          ? ["active_control_timing_jitter_missing_for_operating_budget"]
          : timingMargin < 1
            ? ["active_control_timing_jitter_above_0p1_cycle"]
            : []),
    ...(evidence?.heatLoadW == null
      ? ["active_control_heat_load_missing_for_power_budget"]
      : !heatLoadValid
        ? ["active_control_heat_load_invalid_for_operating_budget"]
        : thermalAccountingMargin == null
          ? ["active_control_heat_load_missing_for_power_budget"]
          : thermalAccountingMargin < 1
            ? ["active_control_heat_load_below_computed_control_power"]
            : []),
    ...(evidence?.heatSinkCapacityW == null
      ? ["active_control_heat_sink_capacity_missing_for_operating_budget"]
      : !heatSinkCapacityValid
        ? ["active_control_heat_sink_capacity_invalid_for_operating_budget"]
        : thermalSinkCapacityMargin == null
          ? ["active_control_heat_sink_capacity_missing_for_operating_budget"]
          : thermalSinkCapacityMargin < 1
            ? ["active_control_heat_sink_capacity_below_1p2x_heat_load"]
            : []),
    ...(evidence?.thermalModelRef == null
      ? ["active_control_thermal_model_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.heatSinkCapacityTraceRef == null
      ? ["active_control_heat_sink_capacity_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.heatLoadTraceRef == null
      ? ["active_control_heat_load_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.heatLoadTraceSampleCount == null
      ? ["active_control_heat_load_trace_sample_count_missing_for_operating_budget"]
      : !heatLoadTraceSampleCountValid
        ? ["active_control_heat_load_trace_sample_count_invalid_for_operating_budget"]
        : heatLoadTraceSampleCountMargin == null
          ? ["active_control_heat_load_trace_sample_count_missing_for_operating_budget"]
          : heatLoadTraceSampleCountMargin < 1
            ? ["active_control_heat_load_trace_sample_count_below_4096_for_operating_budget"]
            : []),
    ...(evidence?.sourceTensorContaminationFraction == null
      ? ["active_control_source_tensor_contamination_missing_for_operating_budget"]
      : !sourceTensorContaminationValid
        ? ["active_control_source_tensor_contamination_invalid_for_operating_budget"]
        : sourceTensorContaminationMargin == null
          ? ["active_control_source_tensor_contamination_missing_for_operating_budget"]
          : sourceTensorContaminationMargin < 1
            ? ["active_control_source_tensor_contamination_above_5pct"]
            : []),
    ...(evidence?.sourceTensorContaminationRef == null
      ? ["active_control_source_tensor_contamination_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.timingSyncTraceRef == null
      ? ["active_control_timing_sync_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.timingSyncTraceSampleCount == null
      ? ["active_control_timing_sync_trace_sample_count_missing_for_operating_budget"]
      : !timingSyncTraceSampleCountValid
        ? ["active_control_timing_sync_trace_sample_count_invalid_for_operating_budget"]
        : timingSyncTraceSampleCountMargin == null
          ? ["active_control_timing_sync_trace_sample_count_missing_for_operating_budget"]
          : timingSyncTraceSampleCountMargin < 1
            ? ["active_control_timing_sync_trace_sample_count_below_4096_for_operating_budget"]
            : []),
    ...(evidence?.phaseNoiseRmsSeconds == null
      ? ["active_control_phase_noise_missing_for_operating_budget"]
      : !phaseNoiseValid
        ? ["active_control_phase_noise_invalid_for_operating_budget"]
        : phaseNoiseMargin == null
          ? ["active_control_phase_noise_missing_for_operating_budget"]
          : phaseNoiseMargin < 1
            ? ["active_control_phase_noise_above_0p05_cycle"]
            : []),
    ...(evidence?.phaseNoiseSpectrumRef == null
      ? ["active_control_phase_noise_spectrum_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.phaseNoiseSpectrumBinCount == null
      ? ["active_control_phase_noise_spectrum_bin_count_missing_for_operating_budget"]
      : !phaseNoiseSpectrumBinCountValid
        ? ["active_control_phase_noise_spectrum_bin_count_invalid_for_operating_budget"]
        : phaseNoiseSpectrumBinCountMargin == null
          ? ["active_control_phase_noise_spectrum_bin_count_missing_for_operating_budget"]
          : phaseNoiseSpectrumBinCountMargin < 1
            ? ["active_control_phase_noise_spectrum_bin_count_below_512_for_operating_budget"]
            : []),
    ...(evidence?.lockAcquisitionTraceRef == null
      ? ["active_control_lock_acquisition_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.lockAcquisitionTrialCount == null
      ? ["active_control_lock_acquisition_trial_count_missing_for_operating_budget"]
      : !lockAcquisitionTrialCountValid
        ? ["active_control_lock_acquisition_trial_count_invalid_for_operating_budget"]
        : lockAcquisitionTrialCountMargin == null
          ? ["active_control_lock_acquisition_trial_count_missing_for_operating_budget"]
          : lockAcquisitionTrialCountMargin < 1
            ? ["active_control_lock_acquisition_trial_count_below_100_for_operating_budget"]
            : []),
    ...(evidence?.lockAcquisitionTimeSeconds == null
      ? ["active_control_lock_acquisition_time_missing_for_operating_budget"]
      : !lockAcquisitionTimeValid
        ? ["active_control_lock_acquisition_time_invalid_for_operating_budget"]
      : []),
    ...(evidence?.failureModeRef == null ? ["active_control_failure_mode_ref_missing_for_operating_budget"] : []),
    ...(failureModeCoverage?.lossOfLock === true
      ? []
      : ["active_control_loss_of_lock_failure_mode_missing_for_operating_budget"]),
    ...(failureModeCoverage?.thermalRunaway === true
      ? []
      : ["active_control_thermal_runaway_failure_mode_missing_for_operating_budget"]),
    ...(failureModeCoverage?.noiseRunaway === true
      ? []
      : ["active_control_noise_runaway_failure_mode_missing_for_operating_budget"]),
    ...(failureModeCoverage?.timingDesynchronization === true
      ? []
      : ["active_control_timing_desynchronization_failure_mode_missing_for_operating_budget"]),
    ...(failureModeCoverage?.failSafeShutdown === true
      ? []
      : ["active_control_fail_safe_shutdown_missing_for_operating_budget"]),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "active_control_bandwidth_below_30ghz",
            "active_control_switching_rate_not_15ghz",
            "active_control_gap_authority_below_447_layer_load",
            "active_control_supplied_actuator_authority_below_447_layer_load",
            "active_control_gap_noise_above_80pm",
            "active_control_timing_jitter_above_0p1_cycle",
            "active_control_phase_noise_above_0p05_cycle",
            "active_control_controller_phase_margin_below_45deg",
            "active_control_controller_gain_margin_below_6db",
            "active_control_heat_load_below_computed_control_power",
            "active_control_heat_sink_capacity_below_1p2x_heat_load",
            "active_control_source_tensor_contamination_above_5pct",
            "active_control_energy_per_cycle_invalid_for_operating_budget",
            "active_control_actuator_authority_invalid_for_operating_budget",
            "active_control_switching_rate_invalid_for_operating_budget",
            "active_control_bandwidth_invalid_for_operating_budget",
            "active_control_gap_noise_invalid_for_operating_budget",
            "active_control_timing_jitter_invalid_for_operating_budget",
            "active_control_phase_noise_invalid_for_operating_budget",
            "active_control_controller_phase_margin_invalid_for_operating_budget",
            "active_control_controller_gain_margin_invalid_for_operating_budget",
            "active_control_heat_load_invalid_for_operating_budget",
            "active_control_heat_sink_capacity_invalid_for_operating_budget",
            "active_control_source_tensor_contamination_invalid_for_operating_budget",
            "active_control_lock_acquisition_time_invalid_for_operating_budget",
            "active_control_energy_waveform_sample_count_invalid_for_operating_budget",
            "active_control_actuator_authority_trace_sample_count_invalid_for_operating_budget",
            "active_control_gap_noise_trace_sample_count_invalid_for_operating_budget",
            "active_control_heat_load_trace_sample_count_invalid_for_operating_budget",
            "active_control_timing_sync_trace_sample_count_invalid_for_operating_budget",
            "active_control_phase_noise_spectrum_bin_count_invalid_for_operating_budget",
            "active_control_lock_acquisition_trial_count_invalid_for_operating_budget",
            "active_control_energy_waveform_sample_count_below_4096_for_operating_budget",
            "active_control_actuator_authority_trace_sample_count_below_4096_for_operating_budget",
            "active_control_gap_noise_trace_sample_count_below_4096_for_operating_budget",
            "active_control_heat_load_trace_sample_count_below_4096_for_operating_budget",
            "active_control_timing_sync_trace_sample_count_below_4096_for_operating_budget",
            "active_control_phase_noise_spectrum_bin_count_below_512_for_operating_budget",
            "active_control_lock_acquisition_trial_count_below_100_for_operating_budget",
          ].includes(blocker),
        )
      : false;
  return {
    contractVersion: NHM2_TILE_SOURCE_ACTIVE_CONTROL_OPERATING_BUDGET_CONTRACT_VERSION,
    generatedAt: forceGapLoadBudget.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: forceGapLoadBudget.selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      forceGapLoadBudgetRef: input.forceGapLoadBudgetRef ?? null,
      activeControlEvidenceRef: evidence?.evidenceRef ?? null,
    },
    operatingTargets: {
      gapMeters: 8e-9,
      switchingRateHz: SWITCHING_RATE_HZ,
      bandwidthMinHz: BANDWIDTH_MIN_HZ,
      gapNoiseRmsMaxMeters: GAP_NOISE_MAX_METERS,
      timingJitterMaxSeconds: TIMING_JITTER_MAX_SECONDS,
      phaseNoiseMaxSeconds: PHASE_NOISE_MAX_SECONDS,
      controllerPhaseMarginMinDegrees: CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
      controllerGainMarginMinDb: CONTROLLER_GAIN_MARGIN_MIN_DB,
      thermalSinkCapacityFactorMin: THERMAL_SINK_CAPACITY_FACTOR_MIN,
      sourceTensorContaminationFractionMax: SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
      requiredGapControlAuthorityN,
      timeTraceSampleCountMin: TIME_TRACE_SAMPLE_COUNT_MIN,
      phaseNoiseSpectrumBinCountMin: PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
      lockAcquisitionTrialCountMin: LOCK_ACQUISITION_TRIAL_COUNT_MIN,
    },
    suppliedActiveControlEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      energyWaveformRef: stringOrNull(evidence?.energyWaveformRef),
      actuatorAuthorityTraceRef: stringOrNull(evidence?.actuatorAuthorityTraceRef),
      gapSensorCalibrationRef: stringOrNull(evidence?.gapSensorCalibrationRef),
      controlTransferFunctionRef: stringOrNull(evidence?.controlTransferFunctionRef),
      controllerStabilityRef: stringOrNull(evidence?.controllerStabilityRef),
      gapNoiseTraceRef: stringOrNull(evidence?.gapNoiseTraceRef),
      thermalModelRef: stringOrNull(evidence?.thermalModelRef),
      heatSinkCapacityTraceRef: stringOrNull(evidence?.heatSinkCapacityTraceRef),
      heatLoadTraceRef: stringOrNull(evidence?.heatLoadTraceRef),
      sourceTensorContaminationRef: stringOrNull(evidence?.sourceTensorContaminationRef),
      timingSyncTraceRef: stringOrNull(evidence?.timingSyncTraceRef),
      phaseNoiseSpectrumRef: stringOrNull(evidence?.phaseNoiseSpectrumRef),
      lockAcquisitionTraceRef: stringOrNull(evidence?.lockAcquisitionTraceRef),
      energyWaveformSampleCount: finiteOrNull(evidence?.energyWaveformSampleCount),
      actuatorAuthorityTraceSampleCount: finiteOrNull(
        evidence?.actuatorAuthorityTraceSampleCount,
      ),
      gapNoiseTraceSampleCount: finiteOrNull(evidence?.gapNoiseTraceSampleCount),
      heatLoadTraceSampleCount: finiteOrNull(evidence?.heatLoadTraceSampleCount),
      timingSyncTraceSampleCount: finiteOrNull(evidence?.timingSyncTraceSampleCount),
      phaseNoiseSpectrumBinCount: finiteOrNull(evidence?.phaseNoiseSpectrumBinCount),
      lockAcquisitionTrialCount: finiteOrNull(evidence?.lockAcquisitionTrialCount),
      energyPerCycleJ: finiteOrNull(evidence?.energyPerCycleJ),
      actuatorAuthorityN: finiteOrNull(evidence?.actuatorAuthorityN),
      bandwidthHz: finiteOrNull(evidence?.bandwidthHz),
      switchingRateHz: finiteOrNull(evidence?.switchingRateHz),
      gapNoiseRmsMeters: finiteOrNull(evidence?.gapNoiseRmsMeters),
      noiseSpectrumRef: evidence?.noiseSpectrumRef ?? null,
      heatLoadW: finiteOrNull(evidence?.heatLoadW),
      heatSinkCapacityW: finiteOrNull(evidence?.heatSinkCapacityW),
      sourceTensorContaminationFraction: finiteOrNull(
        evidence?.sourceTensorContaminationFraction,
      ),
      timingJitterSeconds: finiteOrNull(evidence?.timingJitterSeconds),
      phaseNoiseRmsSeconds: finiteOrNull(evidence?.phaseNoiseRmsSeconds),
      controllerPhaseMarginDegrees: finiteOrNull(evidence?.controllerPhaseMarginDegrees),
      controllerGainMarginDb: finiteOrNull(evidence?.controllerGainMarginDb),
      lockAcquisitionTimeSeconds: finiteOrNull(evidence?.lockAcquisitionTimeSeconds),
      failureModeRef: evidence?.failureModeRef ?? null,
      failureModeCoverage:
        failureModeCoverage == null
          ? null
          : {
              lossOfLock: failureModeCoverage.lossOfLock === true,
              thermalRunaway: failureModeCoverage.thermalRunaway === true,
              noiseRunaway: failureModeCoverage.noiseRunaway === true,
              timingDesynchronization: failureModeCoverage.timingDesynchronization === true,
              failSafeShutdown: failureModeCoverage.failSafeShutdown === true,
            },
    },
    derivedOperatingBudget: {
      controlPowerW,
      gapControlAuthorityMargin,
      suppliedActuatorAuthorityMargin,
      activeControlTraceRefsAvailable:
        evidence?.energyWaveformRef != null &&
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
        evidence.phaseNoiseSpectrumRef != null &&
        evidence.lockAcquisitionTraceRef != null &&
        evidence.failureModeRef != null,
      activeControlCalibrationRefsAvailable:
        evidence?.actuatorAuthorityTraceRef != null &&
        evidence.gapSensorCalibrationRef != null &&
        evidence.controllerStabilityRef != null &&
        evidence.heatSinkCapacityTraceRef != null &&
        evidence.phaseNoiseSpectrumRef != null,
      noiseSpectrumAvailable: evidence?.noiseSpectrumRef != null,
      failureModeCoverageComplete,
      activeControlTraceSamplingComplete,
      switchingRateMargin,
      bandwidthMargin,
      noiseMargin,
      timingMargin,
      phaseNoiseMargin,
      controllerPhaseMargin,
      controllerGainMargin,
      thermalAccountingMargin,
      thermalSinkCapacityMargin,
      sourceTensorContaminationMargin,
      energyWaveformSampleCountMargin,
      actuatorAuthorityTraceSampleCountMargin,
      gapNoiseTraceSampleCountMargin,
      heatLoadTraceSampleCountMargin,
      timingSyncTraceSampleCountMargin,
      phaseNoiseSpectrumBinCountMargin,
      lockAcquisitionTrialCountMargin,
    },
    requiredCorrections: {
      switchingRateTargetHz: SWITCHING_RATE_HZ,
      switchingRateAbsDeltaHz:
        evidenceSwitchingRate == null
          ? null
          : round(Math.abs(evidenceSwitchingRate - SWITCHING_RATE_HZ)),
      bandwidthMinHz: BANDWIDTH_MIN_HZ,
      bandwidthShortfallHz: shortfallToMinimum(bandwidthHz, BANDWIDTH_MIN_HZ),
      gapControlAuthorityMinN: requiredGapControlAuthorityN,
      suppliedGapControlAuthorityN,
      suppliedActuatorAuthorityN: actuatorAuthorityN,
      gapControlAuthorityShortfallN: shortfallToMinimum(
        suppliedGapControlAuthorityN,
        requiredGapControlAuthorityN,
      ),
      actuatorAuthorityShortfallN: shortfallToMinimum(
        actuatorAuthorityN,
        requiredGapControlAuthorityN,
      ),
      gapNoiseRmsMaxMeters: GAP_NOISE_MAX_METERS,
      gapNoiseRmsReductionMeters: reductionToMaximum(
        gapNoiseRmsMeters,
        GAP_NOISE_MAX_METERS,
      ),
      timingJitterMaxSeconds: TIMING_JITTER_MAX_SECONDS,
      timingJitterReductionSeconds: reductionToMaximum(
        timingJitterSeconds,
        TIMING_JITTER_MAX_SECONDS,
      ),
      phaseNoiseMaxSeconds: PHASE_NOISE_MAX_SECONDS,
      phaseNoiseReductionSeconds: reductionToMaximum(
        phaseNoiseRmsSeconds,
        PHASE_NOISE_MAX_SECONDS,
      ),
      controllerPhaseMarginMinDegrees: CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
      controllerPhaseMarginShortfallDegrees: shortfallToMinimum(
        controllerPhaseMarginDegrees,
        CONTROLLER_PHASE_MARGIN_MIN_DEGREES,
      ),
      controllerGainMarginMinDb: CONTROLLER_GAIN_MARGIN_MIN_DB,
      controllerGainMarginShortfallDb: shortfallToMinimum(
        controllerGainMarginDb,
        CONTROLLER_GAIN_MARGIN_MIN_DB,
      ),
      controlPowerW,
      heatLoadMinW,
      heatLoadShortfallW:
        heatLoadMinW == null || heatLoadW == null
          ? null
          : round(Math.max(0, heatLoadMinW - heatLoadW)),
      heatSinkCapacityCriterion: HEAT_SINK_CAPACITY_CRITERION,
      energyPerCycleHeatLimitedMaxJ,
      heatSinkCapacityMinW,
      heatSinkCapacityShortfallW:
        heatSinkCapacityMinW == null || heatSinkCapacityW == null
          ? null
          : round(Math.max(0, heatSinkCapacityMinW - heatSinkCapacityW)),
      energyPerCycleReductionJ:
        energyPerCycleJ == null || energyPerCycleHeatLimitedMaxJ == null
          ? null
          : round(Math.max(0, energyPerCycleJ - energyPerCycleHeatLimitedMaxJ)),
      sourceTensorContaminationFractionMax: SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
      sourceTensorContaminationFractionReduction: reductionToMaximum(
        sourceTensorContaminationFraction,
        SOURCE_TENSOR_CONTAMINATION_FRACTION_MAX,
      ),
      requiredTraceRefCount: 15,
      missingTraceRefCount,
      timeTraceSampleCountMin: TIME_TRACE_SAMPLE_COUNT_MIN,
      energyWaveformSampleCountShortfall: sampleCountShortfall(
        TIME_TRACE_SAMPLE_COUNT_MIN,
        evidence?.energyWaveformSampleCount,
      ),
      actuatorAuthorityTraceSampleCountShortfall: sampleCountShortfall(
        TIME_TRACE_SAMPLE_COUNT_MIN,
        evidence?.actuatorAuthorityTraceSampleCount,
      ),
      gapNoiseTraceSampleCountShortfall: sampleCountShortfall(
        TIME_TRACE_SAMPLE_COUNT_MIN,
        evidence?.gapNoiseTraceSampleCount,
      ),
      heatLoadTraceSampleCountShortfall: sampleCountShortfall(
        TIME_TRACE_SAMPLE_COUNT_MIN,
        evidence?.heatLoadTraceSampleCount,
      ),
      timingSyncTraceSampleCountShortfall: sampleCountShortfall(
        TIME_TRACE_SAMPLE_COUNT_MIN,
        evidence?.timingSyncTraceSampleCount,
      ),
      phaseNoiseSpectrumBinCountMin: PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
      phaseNoiseSpectrumBinCountShortfall: sampleCountShortfall(
        PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN,
        evidence?.phaseNoiseSpectrumBinCount,
      ),
      lockAcquisitionTrialCountMin: LOCK_ACQUISITION_TRIAL_COUNT_MIN,
      lockAcquisitionTrialCountShortfall: sampleCountShortfall(
        LOCK_ACQUISITION_TRIAL_COUNT_MIN,
        evidence?.lockAcquisitionTrialCount,
      ),
      requiredFailureModeCount: 5,
      missingFailureModeCount,
    },
    blockers,
    summary: {
      operatingBudgetComputed: true,
      activeControlEvidenceReady: blockers.length === 0,
      falsifiesCurrentCandidate,
      firstBlocker: blockers[0] ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetOnly: true,
      controllerEvidenceDoesNotSupplyFullApparatusTensor: true,
      heatAndTimingReceiptsRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceActiveControlOperatingBudget = (
  value: unknown,
): value is Nhm2TileSourceActiveControlOperatingBudgetV1 => {
  if (!isRecord(value)) return false;
  const targets = isRecord(value.operatingTargets) ? value.operatingTargets : null;
  const supplied = isRecord(value.suppliedActiveControlEvidence)
    ? value.suppliedActiveControlEvidence
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
    value.contractVersion === NHM2_TILE_SOURCE_ACTIVE_CONTROL_OPERATING_BUDGET_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    targets != null &&
    targets.gapMeters === 8e-9 &&
    targets.switchingRateHz === 15e9 &&
    targets.bandwidthMinHz === 30e9 &&
    targets.gapNoiseRmsMaxMeters === 8e-11 &&
    typeof targets.timingJitterMaxSeconds === "number" &&
    typeof targets.phaseNoiseMaxSeconds === "number" &&
    targets.controllerPhaseMarginMinDegrees === 45 &&
    targets.controllerGainMarginMinDb === 6 &&
    targets.thermalSinkCapacityFactorMin === 1.2 &&
    targets.sourceTensorContaminationFractionMax === 0.05 &&
    typeof targets.requiredGapControlAuthorityN === "number" &&
    targets.timeTraceSampleCountMin === TIME_TRACE_SAMPLE_COUNT_MIN &&
    targets.phaseNoiseSpectrumBinCountMin === PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN &&
    targets.lockAcquisitionTrialCountMin === LOCK_ACQUISITION_TRIAL_COUNT_MIN &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    (budget.gapControlAuthorityMargin === null ||
      typeof budget.gapControlAuthorityMargin === "number") &&
    (budget.suppliedActuatorAuthorityMargin === null ||
      typeof budget.suppliedActuatorAuthorityMargin === "number") &&
    typeof budget.activeControlCalibrationRefsAvailable === "boolean" &&
    typeof budget.noiseSpectrumAvailable === "boolean" &&
    typeof budget.failureModeCoverageComplete === "boolean" &&
    typeof budget.activeControlTraceSamplingComplete === "boolean" &&
    (budget.switchingRateMargin === null || typeof budget.switchingRateMargin === "number") &&
    requiredCorrections != null &&
    requiredCorrections.switchingRateTargetHz === 15e9 &&
    isNumberOrNull(requiredCorrections.switchingRateAbsDeltaHz) &&
    requiredCorrections.bandwidthMinHz === 30e9 &&
    isNumberOrNull(requiredCorrections.bandwidthShortfallHz) &&
    typeof requiredCorrections.gapControlAuthorityMinN === "number" &&
    isNumberOrNull(requiredCorrections.suppliedGapControlAuthorityN) &&
    isNumberOrNull(requiredCorrections.suppliedActuatorAuthorityN) &&
    isNumberOrNull(requiredCorrections.gapControlAuthorityShortfallN) &&
    isNumberOrNull(requiredCorrections.actuatorAuthorityShortfallN) &&
    requiredCorrections.gapNoiseRmsMaxMeters === 8e-11 &&
    isNumberOrNull(requiredCorrections.gapNoiseRmsReductionMeters) &&
    typeof requiredCorrections.timingJitterMaxSeconds === "number" &&
    isNumberOrNull(requiredCorrections.timingJitterReductionSeconds) &&
    typeof requiredCorrections.phaseNoiseMaxSeconds === "number" &&
    isNumberOrNull(requiredCorrections.phaseNoiseReductionSeconds) &&
    requiredCorrections.controllerPhaseMarginMinDegrees === 45 &&
    isNumberOrNull(requiredCorrections.controllerPhaseMarginShortfallDegrees) &&
    requiredCorrections.controllerGainMarginMinDb === 6 &&
    isNumberOrNull(requiredCorrections.controllerGainMarginShortfallDb) &&
    isNumberOrNull(requiredCorrections.controlPowerW) &&
    isNumberOrNull(requiredCorrections.heatLoadMinW) &&
    isNumberOrNull(requiredCorrections.heatLoadShortfallW) &&
    requiredCorrections.heatSinkCapacityCriterion === HEAT_SINK_CAPACITY_CRITERION &&
    isNumberOrNull(requiredCorrections.heatSinkCapacityMinW) &&
    isNumberOrNull(requiredCorrections.heatSinkCapacityShortfallW) &&
    isNumberOrNull(requiredCorrections.energyPerCycleHeatLimitedMaxJ) &&
    isNumberOrNull(requiredCorrections.energyPerCycleReductionJ) &&
    requiredCorrections.sourceTensorContaminationFractionMax === 0.05 &&
    isNumberOrNull(requiredCorrections.sourceTensorContaminationFractionReduction) &&
    requiredCorrections.requiredTraceRefCount === 15 &&
    typeof requiredCorrections.missingTraceRefCount === "number" &&
    requiredCorrections.timeTraceSampleCountMin === TIME_TRACE_SAMPLE_COUNT_MIN &&
    isNumberOrNull(requiredCorrections.energyWaveformSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.actuatorAuthorityTraceSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.gapNoiseTraceSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.heatLoadTraceSampleCountShortfall) &&
    isNumberOrNull(requiredCorrections.timingSyncTraceSampleCountShortfall) &&
    requiredCorrections.phaseNoiseSpectrumBinCountMin === PHASE_NOISE_SPECTRUM_BIN_COUNT_MIN &&
    isNumberOrNull(requiredCorrections.phaseNoiseSpectrumBinCountShortfall) &&
    requiredCorrections.lockAcquisitionTrialCountMin === LOCK_ACQUISITION_TRIAL_COUNT_MIN &&
    isNumberOrNull(requiredCorrections.lockAcquisitionTrialCountShortfall) &&
    requiredCorrections.requiredFailureModeCount === 5 &&
    typeof requiredCorrections.missingFailureModeCount === "number" &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    summary != null &&
    summary.operatingBudgetComputed === true &&
    typeof summary.activeControlEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetOnly === true &&
    boundary.controllerEvidenceDoesNotSupplyFullApparatusTensor === true &&
    boundary.heatAndTimingReceiptsRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
