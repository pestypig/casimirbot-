import { z } from "zod";

import {
  evaluateErEprSimulation,
  type ErEprSimulationEvaluation,
  type ErEprSimulationInput,
} from "./er-epr-simulation";

export const erEprControlKindSchema = z.enum([
  "disentangled_control",
  "random_state_control",
  "wrong_sign_coupling_control",
  "no_coupling_control",
  "shuffled_hamiltonian_control",
  "random_matrix_control",
  "spin_chain_control",
  "high_entropy_washout_control",
  "starsim_structure_prior_only_control",
]);

export type ErEprControlKind = z.infer<typeof erEprControlKindSchema>;

export const REQUIRED_ER_EPR_CONTROL_KINDS: ErEprControlKind[] = [
  "disentangled_control",
  "random_state_control",
  "wrong_sign_coupling_control",
  "no_coupling_control",
  "shuffled_hamiltonian_control",
  "random_matrix_control",
  "spin_chain_control",
  "high_entropy_washout_control",
  "starsim_structure_prior_only_control",
];

export type ErEprControlRun = {
  runId: string;
  controlKind: ErEprControlKind;
  input: ErEprSimulationInput;
};

export type ErEprControlFailureSummary = {
  requiredControlsPresent: boolean;
  missingRequiredControls: ErEprControlKind[];
  signalCarryingControls: Array<{
    controlKind: ErEprControlKind;
    runId?: string;
    signalComposite: number;
    controlLeakage: number;
    verdict: ErEprSimulationEvaluation["evidence"]["verdict"];
  }>;
  overclaimBlockedControls: Array<{
    controlKind: ErEprControlKind;
    runId?: string;
    blockedClaims: string[];
  }>;
  entropyWashoutObserved: boolean;
  starSimPriorOnlyOk: boolean;
  batchShouldDemote: boolean;
};

export function buildErEprControlSuite(baseInput: ErEprSimulationInput): ErEprControlRun[] {
  return [
    {
      runId: "control-disentangled",
      controlKind: "disentangled_control",
      input: {
        ...baseInput,
        initialState: "disentangled_control",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.18,
          causalOrderingScore: 0.16,
          timeDelayScore: 0.14,
          disentangledControlScore: 0.12,
        },
      },
    },
    {
      runId: "control-random-state",
      controlKind: "random_state_control",
      input: {
        ...baseInput,
        initialState: "random_control",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.2,
          causalOrderingScore: 0.18,
          timeDelayScore: 0.18,
          ordinaryTeleportationControlScore: 0.12,
        },
      },
    },
    {
      runId: "control-wrong-sign",
      controlKind: "wrong_sign_coupling_control",
      input: {
        ...baseInput,
        coupling: "double_trace_wrong_sign",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.22,
          causalOrderingScore: 0.2,
          timeDelayScore: 0.18,
          wrongSignCouplingControlScore: 0.12,
        },
      },
    },
    {
      runId: "control-no-coupling",
      controlKind: "no_coupling_control",
      input: {
        ...baseInput,
        coupling: "none",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.2,
          causalOrderingScore: 0.18,
          timeDelayScore: 0.16,
        },
      },
    },
    {
      runId: "control-shuffled-hamiltonian",
      controlKind: "shuffled_hamiltonian_control",
      input: {
        ...baseInput,
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.24,
          causalOrderingScore: 0.2,
          timeDelayScore: 0.18,
          shuffledHamiltonianControlScore: 0.12,
        },
      },
    },
    {
      runId: "control-random-matrix",
      controlKind: "random_matrix_control",
      input: {
        ...baseInput,
        modelFamily: "random_matrix_control",
        initialState: "random_control",
        coupling: "none",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.18,
          causalOrderingScore: 0.16,
          timeDelayScore: 0.14,
        },
      },
    },
    {
      runId: "control-spin-chain",
      controlKind: "spin_chain_control",
      input: {
        ...baseInput,
        modelFamily: "spin_chain_control",
        initialState: "random_control",
        coupling: "none",
        observables: {
          ...baseInput.observables,
          teleportationFidelity: 0.2,
          causalOrderingScore: 0.16,
          timeDelayScore: 0.14,
        },
      },
    },
    {
      runId: "control-high-entropy",
      controlKind: "high_entropy_washout_control",
      input: {
        ...baseInput,
        entropyStretch: { deltaS_nats: Math.log(100) },
      },
    },
    {
      runId: "control-starsim-prior",
      controlKind: "starsim_structure_prior_only_control",
      input: {
        ...baseInput,
        modelFamily: "random_matrix_control",
        initialState: "random_control",
        coupling: "none",
        starSim: {
          role: "cosmological_structure_prior",
          clusteringEntropy_nats: 3,
        },
        observables: {
          ...baseInput.observables,
          mutualInformation: 0.3,
          entanglementEntropy_nats: 0.8,
          teleportationFidelity: 0.2,
          causalOrderingScore: 0.16,
          timeDelayScore: 0.14,
          operatorSizeWindingScore: 0.24,
          scramblingScore: 0.22,
          thermalizationScore: 0.2,
          entropyAreaProxyTrackingScore: 0.22,
          ordinaryTeleportationControlScore: 0.1,
          shuffledHamiltonianControlScore: 0.1,
          disentangledControlScore: 0.1,
          wrongSignCouplingControlScore: 0.1,
        },
      },
    },
  ];
}

export function classifyErEprControlFailure(
  controls: Array<{
    runId?: string;
    controlKind: ErEprControlKind;
    evaluation: ErEprSimulationEvaluation;
  }>,
  options: { signalMin?: number; controlMax?: number } = {},
): ErEprControlFailureSummary {
  const signalMin = options.signalMin ?? 0.7;
  const controlMax = options.controlMax ?? 0.35;
  const present = new Set(controls.map((control) => control.controlKind));
  const missingRequiredControls = REQUIRED_ER_EPR_CONTROL_KINDS.filter((controlKind) => !present.has(controlKind));
  const signalCarryingControls = controls
    .filter((control) => {
      if (control.controlKind === "high_entropy_washout_control" && !control.evaluation.gates.entropyVisibilityPass) {
        return false;
      }
      return control.evaluation.values.signalComposite >= signalMin || control.evaluation.values.controlLeakage > controlMax;
    })
    .map((control) => ({
      controlKind: control.controlKind,
      runId: control.runId,
      signalComposite: control.evaluation.values.signalComposite,
      controlLeakage: control.evaluation.values.controlLeakage,
      verdict: control.evaluation.evidence.verdict,
    }));
  const overclaimBlockedControls = controls
    .filter((control) => control.evaluation.evidence.verdict === "overclaim_blocked")
    .map((control) => ({
      controlKind: control.controlKind,
      runId: control.runId,
      blockedClaims: control.evaluation.guards.blockedClaims,
    }));
  const entropyWashoutObserved = controls.some(
    (control) =>
      control.controlKind === "high_entropy_washout_control" &&
      !control.evaluation.gates.entropyVisibilityPass,
  );
  const starSimPriorOnlyOk = controls.some(
    (control) =>
      control.controlKind === "starsim_structure_prior_only_control" &&
      control.evaluation.evidence.verdict === "proxy_only_structure_prior",
  );

  return {
    requiredControlsPresent: missingRequiredControls.length === 0,
    missingRequiredControls,
    signalCarryingControls,
    overclaimBlockedControls,
    entropyWashoutObserved,
    starSimPriorOnlyOk,
    batchShouldDemote:
      missingRequiredControls.length > 0 ||
      signalCarryingControls.length > 0 ||
      overclaimBlockedControls.length > 0,
  };
}

export function evaluateErEprControlSuite(
  controls: ErEprControlRun[],
  thresholds: Parameters<typeof evaluateErEprSimulation>[1] = {},
): Array<{ runId: string; controlKind: ErEprControlKind; evaluation: ErEprSimulationEvaluation }> {
  return controls.map((control) => ({
    runId: control.runId,
    controlKind: control.controlKind,
    evaluation: evaluateErEprSimulation(control.input, thresholds),
  }));
}
