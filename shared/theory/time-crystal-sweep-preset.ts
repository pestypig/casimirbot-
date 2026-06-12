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
