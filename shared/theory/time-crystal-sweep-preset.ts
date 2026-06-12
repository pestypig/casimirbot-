import type { TheorySweepRunV1 } from "../contracts/theory-sweep-run.v1";
import { runTheoryScalarSweep } from "./theory-scalar-sweep-runner";

export const TIME_CRYSTAL_SUBHARMONIC_SWEEP_BADGE_IDS = [
  "matter.phase.floquet_quasienergy_context",
  "matter.phase.floquet_discrete_time_crystal_context",
  "matter.phase.time_crystal_observable_signature_context",
  "matter.phase.time_crystal_claim_boundary",
] as const;

const DEFAULT_DRIVE_FREQUENCIES_HZ = [1, 2, 4, 8];
const DEFAULT_PERIOD_MULTIPLIER = 2;
const DEFAULT_POLARITON_RESERVOIR_LIFETIMES_S = [0.0046];
const DEFAULT_NOISY_SYNCHRONY_LOCKING_RATES_S_INV = [120, 220, 320];
const DEFAULT_NOISY_SYNCHRONY_NOISE_RATES_S_INV = [50, 110, 180];
const DEFAULT_NOISY_SYNCHRONY_LOSS_RATES_S_INV = [40, 80, 120];
const DEFAULT_MAGNON_WAVENUMBERS_UM_INV = [5, 10];
const DEFAULT_NOISY_COLLECTIVE_LIFETIME_S = 0.08;
const DEFAULT_STABILIZED_COLLECTIVE_LIFETIME_S = 4.51;

function observedFrequenciesFor(args: {
  driveFrequenciesHz: number[];
  periodMultiplier: number;
  observedFrequenciesHz?: number[];
}): number[] {
  return args.observedFrequenciesHz && args.observedFrequenciesHz.length > 0
    ? args.observedFrequenciesHz
    : args.driveFrequenciesHz.map((driveFrequencyHz) => driveFrequencyHz / args.periodMultiplier);
}

export function buildTimeCrystalSubharmonicFrequencySweepRun(args: {
  graphId: string;
  generatedAt?: string;
  driveFrequenciesHz?: number[];
  periodMultiplier?: number;
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  const driveFrequenciesHz = args.driveFrequenciesHz ?? DEFAULT_DRIVE_FREQUENCIES_HZ;
  const periodMultiplier = args.periodMultiplier ?? DEFAULT_PERIOD_MULTIPLIER;

  return runTheoryScalarSweep({
    expression: "f_response_Hz = f_drive_Hz / n_period_multiplier",
    graphId: args.graphId,
    targetBadgeIds: [...TIME_CRYSTAL_SUBHARMONIC_SWEEP_BADGE_IDS],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "f_drive_Hz",
        unit: "Hz",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: driveFrequenciesHz },
      },
      {
        symbol: "n_period_multiplier",
        unit: null,
        dimensionSignature: "1",
        distribution: { kind: "fixed", value: periodMultiplier },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only subharmonic sweep; it does not validate a physical time-crystal mechanism.",
      "Static scalar rows require observable rigidity, stability, and phase-boundary evidence before time-crystal claims are admitted.",
    ],
  });
}

export function buildTimeCrystalSignedDetuningSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  driveFrequenciesHz?: number[];
  observedFrequenciesHz?: number[];
  periodMultiplier?: number;
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  const driveFrequenciesHz = args.driveFrequenciesHz ?? DEFAULT_DRIVE_FREQUENCIES_HZ;
  const periodMultiplier = args.periodMultiplier ?? DEFAULT_PERIOD_MULTIPLIER;
  const observedFrequenciesHz = observedFrequenciesFor({
    driveFrequenciesHz,
    periodMultiplier,
    observedFrequenciesHz: args.observedFrequenciesHz,
  });

  return runTheoryScalarSweep({
    expression: "signed_detuning_Hz = f_observed_Hz - f_drive_Hz / n_period_multiplier",
    graphId: args.graphId,
    targetBadgeIds: [...TIME_CRYSTAL_SUBHARMONIC_SWEEP_BADGE_IDS],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "f_drive_Hz",
        unit: "Hz",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: driveFrequenciesHz },
      },
      {
        symbol: "f_observed_Hz",
        unit: "Hz",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: observedFrequenciesHz },
      },
      {
        symbol: "n_period_multiplier",
        unit: null,
        dimensionSignature: "1",
        distribution: { kind: "fixed", value: periodMultiplier },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only detuning sweep; it is an evidence row, not answer authority.",
      "Near-zero detuning supports subharmonic-response inspection only when paired with stability and boundary tests.",
    ],
  });
}

export function buildPolaritonicReservoirInverseLifetimeSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  lifetimesS?: number[];
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "Gamma_life_s_inv = 1 / tau_s",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.collective.polariton_reservoir_lifetime_context",
      "matter.collective.polariton_decoherence_boundary",
      "matter.time_crystal.polariton_stc_bridge_boundary",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "tau_s",
        unit: "s",
        dimensionSignature: "T",
        distribution: { kind: "samples", values: args.lifetimesS ?? DEFAULT_POLARITON_RESERVOIR_LIFETIMES_S },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only reservoir lifetime sweep; lifetime is not automatically coherence time.",
      "The soliton-polariton reservoir does not by itself establish time-crystalline order.",
    ],
  });
}

export function buildPolaritonicReservoirLinewidthProxySweepRun(args: {
  graphId: string;
  generatedAt?: string;
  lifetimesS?: number[];
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.collective.polariton_reservoir_lifetime_context",
      "matter.collective.polariton_decoherence_boundary",
      "matter.time_crystal.polariton_stc_bridge_boundary",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "tau_s",
        unit: "s",
        dimensionSignature: "T",
        distribution: { kind: "samples", values: args.lifetimesS ?? DEFAULT_POLARITON_RESERVOIR_LIFETIMES_S },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only Fourier-limited linewidth proxy; it is not a measured decoherence linewidth.",
      "Measured T2, g1(tau), linewidth, echo, or phase-noise evidence is required before coherence claims are admitted.",
    ],
  });
}

export function buildCollectiveLifetimeLimitedLinewidthSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  lifetimesS?: number[];
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.time_crystal.collective_lifetime_limited_linewidth_context",
      "matter.time_crystal.stabilized_vs_noisy_trace_context",
      "matter.phase.time_crystal_claim_boundary",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "T2_prime_s",
        unit: "s",
        dimensionSignature: "T",
        distribution: { kind: "samples", values: args.lifetimesS ?? [DEFAULT_NOISY_COLLECTIVE_LIFETIME_S, DEFAULT_STABILIZED_COLLECTIVE_LIFETIME_S] },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only collective linewidth sweep; linewidth narrowing does not bypass observable-signature requirements.",
      "T2 prime must come from admitted collective-order or sensing evidence.",
    ],
  });
}

export function buildNoisySynchronyMarginSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  lockingRatesSInv?: number[];
  noiseDephasingRatesSInv?: number[];
  lossRatesSInv?: number[];
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.time_crystal.noisy_synchrony_margin_context",
      "matter.time_crystal.stabilized_vs_noisy_trace_context",
      "matter.phase.time_crystal_claim_boundary",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "locking_rate_s_inv",
        unit: "1/s",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: args.lockingRatesSInv ?? DEFAULT_NOISY_SYNCHRONY_LOCKING_RATES_S_INV },
      },
      {
        symbol: "noise_dephasing_rate_s_inv",
        unit: "1/s",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: args.noiseDephasingRatesSInv ?? DEFAULT_NOISY_SYNCHRONY_NOISE_RATES_S_INV },
      },
      {
        symbol: "loss_rate_s_inv",
        unit: "1/s",
        dimensionSignature: "T^-1",
        distribution: { kind: "samples", values: args.lossRatesSInv ?? DEFAULT_NOISY_SYNCHRONY_LOSS_RATES_S_INV },
      },
    ],
    resultDimensionSignature: "T^-1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only noisy synchrony margin; positive margin is not a time-crystal claim.",
      "Noisy synchrony must be paired with rigidity, stability, and phase-boundary evidence.",
    ],
  });
}

export function buildStabilizedVsNoisyLifetimeSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  noisyLifetimeS?: number;
  stabilizedLifetimeS?: number;
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "lifetime_gain = T2_prime_stabilized_s / T2_prime_noisy_s",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.time_crystal.collective_lifetime_limited_linewidth_context",
      "matter.time_crystal.stabilized_vs_noisy_trace_context",
      "matter.phase.time_crystal_claim_boundary",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "T2_prime_noisy_s",
        unit: "s",
        dimensionSignature: "T",
        distribution: { kind: "fixed", value: args.noisyLifetimeS ?? DEFAULT_NOISY_COLLECTIVE_LIFETIME_S },
      },
      {
        symbol: "T2_prime_stabilized_s",
        unit: "s",
        dimensionSignature: "T",
        distribution: { kind: "fixed", value: args.stabilizedLifetimeS ?? DEFAULT_STABILIZED_COLLECTIVE_LIFETIME_S },
      },
    ],
    resultDimensionSignature: "1",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only stabilized-versus-noisy lifetime comparison; lifetime gain is not mechanism validation.",
      "Trace comparison must keep noisy, stabilized, and baseline conditions explicit.",
    ],
  });
}

export function buildMagnonSpaceTimeCrystalWavelengthSweepRun(args: {
  graphId: string;
  generatedAt?: string;
  wavenumbersUmInv?: number[];
  sourceRunId?: string | null;
}): TheorySweepRunV1 {
  return runTheoryScalarSweep({
    expression: "lambda_um = 1 / k_um_inv",
    graphId: args.graphId,
    targetBadgeIds: [
      "matter.time_crystal.magnon_space_time_lattice_context",
      "matter.time_crystal.polariton_stc_bridge_boundary",
      "matter.phase.time_crystal_observable_signature_context",
    ],
    sourceRunId: args.sourceRunId ?? null,
    samplePolicy: { kind: "grid" },
    variables: [
      {
        symbol: "k_um_inv",
        unit: "1/um",
        dimensionSignature: "L^-1",
        distribution: { kind: "samples", values: args.wavenumbersUmInv ?? DEFAULT_MAGNON_WAVENUMBERS_UM_INV },
      },
    ],
    resultDimensionSignature: "L",
    generatedAt: args.generatedAt,
    claimBoundaryNotes: [
      "Diagnostic-only magnon space-time lattice wavelength sweep; visualization context does not equate distinct mechanisms.",
      "Driven STC-like behavior remains distinct from strict spontaneous subharmonic DTC evidence.",
    ],
  });
}
