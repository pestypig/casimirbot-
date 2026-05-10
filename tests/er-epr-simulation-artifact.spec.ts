import { describe, expect, it } from "vitest";

import {
  erEprSimulationRunArtifactSchema,
  type ErEprSimulationRunArtifact,
} from "../shared/er-epr-simulation-artifact";
import {
  evaluateErEprSimulation,
  type ErEprSimulationInput,
} from "../shared/er-epr-simulation";

const fixtureInput: ErEprSimulationInput = {
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

function makeFixtureArtifact(): ErEprSimulationRunArtifact {
  const evaluation = evaluateErEprSimulation(fixtureInput);

  return {
    schemaVersion: "1.0.0",
    runId: "er-epr-stage1-fixture-run",
    createdAt: "2026-05-10T00:00:00.000Z",
    modelFamily: fixtureInput.modelFamily,
    nQubitsOrModes: fixtureInput.nQubitsOrModes,
    initialState: fixtureInput.initialState,
    coupling: fixtureInput.coupling,
    modelRef: "fixture:two_sided_syk_stage1_controlled",
    hamiltonianHash: "sha256:fixture-hamiltonian",
    seed: "fixture-seed",
    inputHash: "sha256:fixture-input",
    thresholds: {
      signalMin: 0.7,
      controlMax: 0.35,
      diagnosticMin: 0.6,
      entropyAreaTrackingMin: 0.6,
      entropyVisibilityMin: 0.05,
      strongSupportMin: 0.82,
    },
    rawObservables: {
      source: "fixture",
      observables: fixtureInput.observables,
    },
    normalizedObservables: evaluation.observables,
    controls: {
      ordinaryTeleportationControlScore: evaluation.observables.ordinaryTeleportationControlScore,
      shuffledHamiltonianControlScore: evaluation.observables.shuffledHamiltonianControlScore,
      disentangledControlScore: evaluation.observables.disentangledControlScore,
      wrongSignCouplingControlScore: evaluation.observables.wrongSignCouplingControlScore,
    },
    qstEntropyStretch: evaluation.entropyStretch,
    evaluation,
    claimIds: evaluation.evidence.claimIds,
    citations: evaluation.evidence.citations,
    caveats: evaluation.evidence.uncertaintyNotes,
    reproducibilityStatus: "fixture_only",
  };
}

function withoutKey<T extends Record<string, unknown>>(value: T, key: keyof T): Record<string, unknown> {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

describe("ER=EPR Stage 1 simulation run artifact schema", () => {
  it("accepts a fixture-only run artifact", () => {
    const artifact = erEprSimulationRunArtifactSchema.parse(makeFixtureArtifact());

    expect(artifact.reproducibilityStatus).toBe("fixture_only");
    expect(artifact.claimIds.length).toBeGreaterThan(0);
    expect(artifact.citations.length).toBeGreaterThan(0);
    expect(artifact.raw_audio_included).toBeUndefined();
  });

  it("rejects missing claim IDs", () => {
    const artifact = makeFixtureArtifact();

    expect(erEprSimulationRunArtifactSchema.safeParse(withoutKey(artifact, "claimIds")).success).toBe(false);
    expect(erEprSimulationRunArtifactSchema.safeParse({ ...artifact, claimIds: [] }).success).toBe(false);
  });

  it("rejects missing citations", () => {
    const artifact = makeFixtureArtifact();

    expect(erEprSimulationRunArtifactSchema.safeParse(withoutKey(artifact, "citations")).success).toBe(false);
    expect(erEprSimulationRunArtifactSchema.safeParse({ ...artifact, citations: [] }).success).toBe(false);
  });

  it("rejects missing reproducibility status", () => {
    const artifact = makeFixtureArtifact();

    expect(
      erEprSimulationRunArtifactSchema.safeParse(withoutKey(artifact, "reproducibilityStatus")).success,
    ).toBe(false);
  });

  it("requires either a Hamiltonian reference or a model reference", () => {
    const artifact = makeFixtureArtifact();
    const withoutRefs = withoutKey(withoutKey(artifact, "modelRef"), "hamiltonianRef");

    expect(erEprSimulationRunArtifactSchema.safeParse(withoutRefs).success).toBe(false);
  });
});
