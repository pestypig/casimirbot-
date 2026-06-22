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
    energyPerCycleJ: number | null;
    bandwidthHz: number | null;
    switchingRateHz: number | null;
    gapNoiseRmsMeters: number | null;
    heatLoadW: number | null;
    timingJitterSeconds: number | null;
    failureModeRef: string | null;
  };
  derivedOperatingBudget: {
    controlPowerW: number | null;
    bandwidthMargin: number | null;
    noiseMargin: number | null;
    timingMargin: number | null;
    thermalAccountingMargin: number | null;
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

const safeRatio = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : round(numerator / denominator);

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
  const evidenceSwitchingRate = evidence?.switchingRateHz ?? null;
  const controlPowerW =
    evidence?.energyPerCycleJ == null || evidenceSwitchingRate == null
      ? null
      : round(evidence.energyPerCycleJ * evidenceSwitchingRate);
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
  const blockers = [
    ...(evidence == null || evidence.evidenceTier === "missing"
      ? ["active_control_receipt_missing_for_operating_budget"]
      : []),
    ...(evidence?.evidenceTier !== "measured" &&
    evidence?.evidenceTier !== "validated_simulation"
      ? ["active_control_operating_budget_tier_not_measured_or_validated"]
      : []),
    ...(evidence?.energyPerCycleJ == null ? ["active_control_energy_per_cycle_missing_for_power_budget"] : []),
    ...(controlPowerW == null ? ["active_control_power_budget_missing"] : []),
    ...(bandwidthMargin == null
      ? ["active_control_bandwidth_missing_for_operating_budget"]
      : bandwidthMargin < 1
        ? ["active_control_bandwidth_below_30ghz"]
        : []),
    ...(noiseMargin == null
      ? ["active_control_gap_noise_missing_for_operating_budget"]
      : noiseMargin < 1
        ? ["active_control_gap_noise_above_80pm"]
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
    ...(evidence?.failureModeRef == null ? ["active_control_failure_mode_ref_missing_for_operating_budget"] : []),
  ];
  const falsifiesCurrentCandidate =
    evidence?.evidenceTier === "measured" ||
    evidence?.evidenceTier === "validated_simulation"
      ? blockers.some((blocker) =>
          [
            "active_control_bandwidth_below_30ghz",
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
      requiredGapControlAuthorityN:
        forceGapLoadBudget.idealLoadBudget.requiredActiveGapControlAuthorityN,
    },
    suppliedActiveControlEvidence: {
      evidenceTier: evidence?.evidenceTier ?? "missing",
      energyPerCycleJ: finiteOrNull(evidence?.energyPerCycleJ),
      bandwidthHz: finiteOrNull(evidence?.bandwidthHz),
      switchingRateHz: finiteOrNull(evidence?.switchingRateHz),
      gapNoiseRmsMeters: finiteOrNull(evidence?.gapNoiseRmsMeters),
      heatLoadW: finiteOrNull(evidence?.heatLoadW),
      timingJitterSeconds: finiteOrNull(evidence?.timingJitterSeconds),
      failureModeRef: evidence?.failureModeRef ?? null,
    },
    derivedOperatingBudget: {
      controlPowerW,
      bandwidthMargin,
      noiseMargin,
      timingMargin,
      thermalAccountingMargin,
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
