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
    requiredGapControlAuthorityN: number;
  };
  suppliedActiveControlEvidence: {
    evidenceTier: string;
    energyWaveformRef: string | null;
    controlTransferFunctionRef: string | null;
    gapNoiseTraceRef: string | null;
    thermalModelRef: string | null;
    heatLoadTraceRef: string | null;
    timingSyncTraceRef: string | null;
    energyPerCycleJ: number | null;
    bandwidthHz: number | null;
    switchingRateHz: number | null;
    gapNoiseRmsMeters: number | null;
    noiseSpectrumRef: string | null;
    heatLoadW: number | null;
    timingJitterSeconds: number | null;
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
    activeControlTraceRefsAvailable: boolean;
    noiseSpectrumAvailable: boolean;
    failureModeCoverageComplete: boolean;
    switchingRateMargin: number | null;
    bandwidthMargin: number | null;
    noiseMargin: number | null;
    timingMargin: number | null;
    thermalAccountingMargin: number | null;
  };
  requiredCorrections: {
    switchingRateTargetHz: 15e9;
    switchingRateAbsDeltaHz: number | null;
    bandwidthMinHz: 30e9;
    bandwidthShortfallHz: number | null;
    gapControlAuthorityMinN: number;
    suppliedGapControlAuthorityN: number | null;
    gapControlAuthorityShortfallN: number | null;
    gapNoiseRmsMaxMeters: 8e-11;
    gapNoiseRmsReductionMeters: number | null;
    timingJitterMaxSeconds: number;
    timingJitterReductionSeconds: number | null;
    controlPowerW: number | null;
    heatLoadMinW: number | null;
    heatLoadShortfallW: number | null;
    energyPerCycleHeatLimitedMaxJ: number | null;
    energyPerCycleReductionJ: number | null;
    requiredTraceRefCount: 8;
    missingTraceRefCount: number;
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

const switchingRateMatchesTarget = (rateHz: number | null): boolean =>
  rateHz != null && Math.abs(rateHz - SWITCHING_RATE_HZ) <= SWITCHING_RATE_HZ * 1e-9;

const shortfallToMinimum = (value: number | null | undefined, minimum: number): number | null =>
  value == null ? null : round(Math.max(0, minimum - value));

const reductionToMaximum = (value: number | null | undefined, maximum: number): number | null =>
  value == null ? null : round(Math.max(0, value - maximum));

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
  const evidenceSwitchingRate = evidence?.switchingRateHz ?? null;
  const controlPowerW =
    evidence?.energyPerCycleJ == null || evidenceSwitchingRate == null
      ? null
      : round(evidence.energyPerCycleJ * evidenceSwitchingRate);
  const switchingRateMargin =
    evidenceSwitchingRate == null
      ? null
      : round(Math.min(evidenceSwitchingRate, SWITCHING_RATE_HZ) / SWITCHING_RATE_HZ);
  const bandwidthMargin = safeRatio(evidence?.bandwidthHz ?? null, BANDWIDTH_MIN_HZ);
  const noiseMargin = safeRatio(
    GAP_NOISE_MAX_METERS,
    evidence?.gapNoiseRmsMeters ?? null,
  );
  const timingMargin = safeRatio(
    TIMING_JITTER_MAX_SECONDS,
    evidence?.timingJitterSeconds ?? null,
  );
  const thermalAccountingMargin = safeRatio(evidence?.heatLoadW ?? null, controlPowerW);
  const failureModeCoverage = evidence?.failureModeCoverage ?? null;
  const requiredGapControlAuthorityN =
    forceGapLoadBudget.idealLoadBudget.requiredActiveGapControlAuthorityN;
  const suppliedGapControlAuthorityN =
    gapControlAuthorityMargin == null
      ? null
      : round(gapControlAuthorityMargin * requiredGapControlAuthorityN);
  const heatLoadMinW = controlPowerW;
  const energyPerCycleHeatLimitedMaxJ =
    evidence?.heatLoadW == null || evidenceSwitchingRate == null || evidenceSwitchingRate === 0
      ? null
      : round(evidence.heatLoadW / evidenceSwitchingRate);
  const traceRefs = [
    evidence?.energyWaveformRef,
    evidence?.controlTransferFunctionRef,
    evidence?.gapNoiseTraceRef,
    evidence?.noiseSpectrumRef,
    evidence?.thermalModelRef,
    evidence?.heatLoadTraceRef,
    evidence?.timingSyncTraceRef,
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
    ...(evidence?.energyPerCycleJ == null ? ["active_control_energy_per_cycle_missing_for_power_budget"] : []),
    ...(evidence?.energyWaveformRef == null
      ? ["active_control_energy_waveform_ref_missing_for_operating_budget"]
      : []),
    ...(evidenceSwitchingRate == null
      ? ["active_control_switching_rate_missing_for_operating_budget"]
      : switchingRateMatchesTarget(evidenceSwitchingRate)
        ? []
        : ["active_control_switching_rate_not_15ghz"]),
    ...(controlPowerW == null ? ["active_control_power_budget_missing"] : []),
    ...(gapControlAuthorityMargin == null
      ? ["active_control_gap_authority_margin_missing_for_447_layer_load"]
      : gapControlAuthorityMargin < 1
        ? ["active_control_gap_authority_below_447_layer_load"]
        : []),
    ...(bandwidthMargin == null
      ? ["active_control_bandwidth_missing_for_operating_budget"]
      : bandwidthMargin < 1
        ? ["active_control_bandwidth_below_30ghz"]
        : []),
    ...(evidence?.controlTransferFunctionRef == null
      ? ["active_control_transfer_function_ref_missing_for_operating_budget"]
      : []),
    ...(noiseMargin == null
      ? ["active_control_gap_noise_missing_for_operating_budget"]
      : noiseMargin < 1
        ? ["active_control_gap_noise_above_80pm"]
        : []),
    ...(evidence?.gapNoiseTraceRef == null
      ? ["active_control_gap_noise_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.noiseSpectrumRef == null
      ? ["active_control_noise_spectrum_ref_missing_for_operating_budget"]
      : []),
    ...(timingMargin == null
      ? ["active_control_timing_jitter_missing_for_operating_budget"]
      : timingMargin < 1
        ? ["active_control_timing_jitter_above_0p1_cycle"]
        : []),
    ...(thermalAccountingMargin == null
      ? ["active_control_heat_load_missing_for_power_budget"]
      : thermalAccountingMargin < 1
        ? ["active_control_heat_load_below_computed_control_power"]
        : []),
    ...(evidence?.thermalModelRef == null
      ? ["active_control_thermal_model_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.heatLoadTraceRef == null
      ? ["active_control_heat_load_trace_ref_missing_for_operating_budget"]
      : []),
    ...(evidence?.timingSyncTraceRef == null
      ? ["active_control_timing_sync_trace_ref_missing_for_operating_budget"]
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
            "active_control_gap_noise_above_80pm",
            "active_control_timing_jitter_above_0p1_cycle",
            "active_control_heat_load_below_computed_control_power",
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
      requiredGapControlAuthorityN,
    },
    suppliedActiveControlEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      energyWaveformRef: stringOrNull(evidence?.energyWaveformRef),
      controlTransferFunctionRef: stringOrNull(evidence?.controlTransferFunctionRef),
      gapNoiseTraceRef: stringOrNull(evidence?.gapNoiseTraceRef),
      thermalModelRef: stringOrNull(evidence?.thermalModelRef),
      heatLoadTraceRef: stringOrNull(evidence?.heatLoadTraceRef),
      timingSyncTraceRef: stringOrNull(evidence?.timingSyncTraceRef),
      energyPerCycleJ: finiteOrNull(evidence?.energyPerCycleJ),
      bandwidthHz: finiteOrNull(evidence?.bandwidthHz),
      switchingRateHz: finiteOrNull(evidence?.switchingRateHz),
      gapNoiseRmsMeters: finiteOrNull(evidence?.gapNoiseRmsMeters),
      noiseSpectrumRef: evidence?.noiseSpectrumRef ?? null,
      heatLoadW: finiteOrNull(evidence?.heatLoadW),
      timingJitterSeconds: finiteOrNull(evidence?.timingJitterSeconds),
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
      activeControlTraceRefsAvailable:
        evidence?.energyWaveformRef != null &&
        evidence.controlTransferFunctionRef != null &&
        evidence.gapNoiseTraceRef != null &&
        evidence.noiseSpectrumRef != null &&
        evidence.thermalModelRef != null &&
        evidence.heatLoadTraceRef != null &&
        evidence.timingSyncTraceRef != null &&
        evidence.failureModeRef != null,
      noiseSpectrumAvailable: evidence?.noiseSpectrumRef != null,
      failureModeCoverageComplete,
      switchingRateMargin,
      bandwidthMargin,
      noiseMargin,
      timingMargin,
      thermalAccountingMargin,
    },
    requiredCorrections: {
      switchingRateTargetHz: SWITCHING_RATE_HZ,
      switchingRateAbsDeltaHz:
        evidenceSwitchingRate == null
          ? null
          : round(Math.abs(evidenceSwitchingRate - SWITCHING_RATE_HZ)),
      bandwidthMinHz: BANDWIDTH_MIN_HZ,
      bandwidthShortfallHz: shortfallToMinimum(evidence?.bandwidthHz, BANDWIDTH_MIN_HZ),
      gapControlAuthorityMinN: requiredGapControlAuthorityN,
      suppliedGapControlAuthorityN,
      gapControlAuthorityShortfallN: shortfallToMinimum(
        suppliedGapControlAuthorityN,
        requiredGapControlAuthorityN,
      ),
      gapNoiseRmsMaxMeters: GAP_NOISE_MAX_METERS,
      gapNoiseRmsReductionMeters: reductionToMaximum(
        evidence?.gapNoiseRmsMeters,
        GAP_NOISE_MAX_METERS,
      ),
      timingJitterMaxSeconds: TIMING_JITTER_MAX_SECONDS,
      timingJitterReductionSeconds: reductionToMaximum(
        evidence?.timingJitterSeconds,
        TIMING_JITTER_MAX_SECONDS,
      ),
      controlPowerW,
      heatLoadMinW,
      heatLoadShortfallW:
        heatLoadMinW == null || evidence?.heatLoadW == null
          ? null
          : round(Math.max(0, heatLoadMinW - evidence.heatLoadW)),
      energyPerCycleHeatLimitedMaxJ,
      energyPerCycleReductionJ:
        evidence?.energyPerCycleJ == null || energyPerCycleHeatLimitedMaxJ == null
          ? null
          : round(Math.max(0, evidence.energyPerCycleJ - energyPerCycleHeatLimitedMaxJ)),
      requiredTraceRefCount: 8,
      missingTraceRefCount,
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
    typeof targets.requiredGapControlAuthorityN === "number" &&
    supplied != null &&
    typeof supplied.evidenceTier === "string" &&
    budget != null &&
    (budget.gapControlAuthorityMargin === null ||
      typeof budget.gapControlAuthorityMargin === "number") &&
    typeof budget.noiseSpectrumAvailable === "boolean" &&
    typeof budget.failureModeCoverageComplete === "boolean" &&
    (budget.switchingRateMargin === null || typeof budget.switchingRateMargin === "number") &&
    requiredCorrections != null &&
    requiredCorrections.switchingRateTargetHz === 15e9 &&
    isNumberOrNull(requiredCorrections.switchingRateAbsDeltaHz) &&
    requiredCorrections.bandwidthMinHz === 30e9 &&
    isNumberOrNull(requiredCorrections.bandwidthShortfallHz) &&
    typeof requiredCorrections.gapControlAuthorityMinN === "number" &&
    isNumberOrNull(requiredCorrections.suppliedGapControlAuthorityN) &&
    isNumberOrNull(requiredCorrections.gapControlAuthorityShortfallN) &&
    requiredCorrections.gapNoiseRmsMaxMeters === 8e-11 &&
    isNumberOrNull(requiredCorrections.gapNoiseRmsReductionMeters) &&
    typeof requiredCorrections.timingJitterMaxSeconds === "number" &&
    isNumberOrNull(requiredCorrections.timingJitterReductionSeconds) &&
    isNumberOrNull(requiredCorrections.controlPowerW) &&
    isNumberOrNull(requiredCorrections.heatLoadMinW) &&
    isNumberOrNull(requiredCorrections.heatLoadShortfallW) &&
    isNumberOrNull(requiredCorrections.energyPerCycleHeatLimitedMaxJ) &&
    isNumberOrNull(requiredCorrections.energyPerCycleReductionJ) &&
    requiredCorrections.requiredTraceRefCount === 8 &&
    typeof requiredCorrections.missingTraceRefCount === "number" &&
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
