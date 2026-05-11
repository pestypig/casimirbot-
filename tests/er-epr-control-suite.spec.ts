import { describe, expect, it } from "vitest";

import {
  REQUIRED_ER_EPR_CONTROL_KINDS,
  buildErEprControlSuite,
  classifyErEprControlFailure,
  evaluateErEprControlSuite,
} from "../shared/er-epr-control-suite";
import type { ErEprSimulationInput } from "../shared/er-epr-simulation";

const baseInput: ErEprSimulationInput = {
  modelFamily: "two_sided_SYK",
  nQubitsOrModes: 12,
  temperatureRegime: "low",
  initialState: "thermofield_double",
  coupling: "double_trace_correct_sign",
  probeInsertionTime: -4,
  measurementWindow: 8,
  entropyStretch: { deltaS_nats: 0 },
  observables: {
    mutualInformation: 1.8,
    entanglementEntropy_nats: 3.2,
    teleportationFidelity: 0.86,
    causalOrderingScore: 0.84,
    timeDelayScore: 0.82,
    operatorSizeWindingScore: 0.85,
    scramblingScore: 0.83,
    thermalizationScore: 0.84,
    entropyAreaProxyTrackingScore: 0.86,
    ordinaryTeleportationControlScore: 0.12,
    shuffledHamiltonianControlScore: 0.18,
    disentangledControlScore: 0.1,
    wrongSignCouplingControlScore: 0.14,
  },
};

describe("ER=EPR Stage 1 control suite", () => {
  it("builds every required null-control kind", () => {
    const controls = buildErEprControlSuite(baseInput);
    const kinds = controls.map((control) => control.controlKind).sort();

    expect(kinds).toEqual([...REQUIRED_ER_EPR_CONTROL_KINDS].sort());
  });

  it("classifies failed controls and records entropy washout", () => {
    const evaluations = evaluateErEprControlSuite(buildErEprControlSuite(baseInput));
    const summary = classifyErEprControlFailure(evaluations);

    expect(summary.requiredControlsPresent).toBe(true);
    expect(summary.batchShouldDemote).toBe(false);
    expect(summary.signalCarryingControls).toHaveLength(0);
    expect(summary.entropyWashoutObserved).toBe(true);
    expect(summary.starSimPriorOnlyOk).toBe(true);
  });

  it("demotes when a shuffled-Hamiltonian control carries the signal", () => {
    const controls = buildErEprControlSuite(baseInput).map((control) =>
      control.controlKind === "shuffled_hamiltonian_control"
        ? {
            ...control,
            input: {
              ...control.input,
              observables: {
                ...control.input.observables,
                shuffledHamiltonianControlScore: 0.72,
              },
            },
          }
        : control,
    );
    const summary = classifyErEprControlFailure(evaluateErEprControlSuite(controls));

    expect(summary.batchShouldDemote).toBe(true);
    expect(summary.signalCarryingControls.map((control) => control.controlKind)).toContain(
      "shuffled_hamiltonian_control",
    );
  });

  it("demotes when a wrong-sign coupling control carries the signal", () => {
    const controls = buildErEprControlSuite(baseInput).map((control) =>
      control.controlKind === "wrong_sign_coupling_control"
        ? {
            ...control,
            input: {
              ...control.input,
              observables: {
                ...control.input.observables,
                wrongSignCouplingControlScore: 0.72,
              },
            },
          }
        : control,
    );
    const summary = classifyErEprControlFailure(evaluateErEprControlSuite(controls));

    expect(summary.batchShouldDemote).toBe(true);
    expect(summary.signalCarryingControls.map((control) => control.controlKind)).toContain(
      "wrong_sign_coupling_control",
    );
  });
});
