import { describe, expect, it } from "vitest";

import {
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX,
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_OBSERVABLE_IDS,
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS,
  isNhm2NumericalObservablePrediction,
  type Nhm2NumericalObservablePredictionV1,
} from "../nhm2-numerical-observable-prediction.v1";
import type { Nhm2PredictionFreezeObservableId } from "../nhm2-prediction-falsifier-freeze.v1";

const makeRef = (
  role: "runReceipt" | "source" | "derivation" | "uncertainty",
  observableId: Nhm2PredictionFreezeObservableId,
  digit: string,
) => ({
  artifactId: `test-only.${role}.${observableId}`,
  path: `fixtures/nhm2-predictions/${observableId}/${role}.json`,
  schemaVersion:
    NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS[role],
  sha256: digit.repeat(64),
});

const predictionFor = (
  observableId: Nhm2PredictionFreezeObservableId,
): Nhm2NumericalObservablePredictionV1 => {
  const phase = observableId === "delta_phi_f";
  return {
    artifactId: `${NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX}.${observableId}`,
    contractVersion: NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
    generatedAt: "2099-07-19T11:50:00.000Z",
    frozenAt: "2099-07-19T12:00:00.000Z",
    dataCollectionOpensAt: "2099-07-19T13:00:00.000Z",
    binding: {
      candidateId: "test-only-candidate",
      selectedProfileId: "test-only-profile",
      freezeId: "test-only-freeze",
      modelId: "test-only-model",
      parameterSetId: "test-only-parameters",
      uncertaintyBudgetId: "test-only-uncertainty",
    },
    observable: {
      observableId,
      definition: `test-only scalar statistic for ${observableId}`,
      unit: phase ? "rad" : "test-unit",
      centralValue: 1,
      coverageInterval: {
        lower: 0.5,
        upper: 1.5,
        coverageProbability: 0.95,
        unit: phase ? "rad" : "test-unit",
      },
      signOrPhase: phase
        ? {
            kind: "phase",
            statement: "test-only expected phase",
            expectedPhaseRadians: 1,
          }
        : {
            kind: "positive",
            statement: "test-only expected positive sign",
            expectedPhaseRadians: null,
          },
      scalingLaw: {
        expression: "y = k x",
        independentVariables: ["x"],
        validityDomain: "test-only bounded fixture domain",
      },
      analysisWindow: "test-only pre-data analysis window",
    },
    derivation: {
      runId: `test-only-derivation-${observableId}`,
      runtimeId: "test-only-prediction-runtime",
      solverId: "test-only-solver",
      solverVersion: "1.0.0",
      sourceCommitSha: "a".repeat(40),
      runReceiptRef: makeRef("runReceipt", observableId, "1"),
      sourceRef: makeRef("source", observableId, "2"),
      derivationRef: makeRef("derivation", observableId, "3"),
    },
    uncertainty: {
      uncertaintyBudgetId: "test-only-uncertainty",
      method: "test-only bounded propagation",
      sourceIds: ["test-only-source"],
      derivationRef: makeRef("uncertainty", observableId, "4"),
    },
    provenanceBoundary: {
      theoryOnly: true,
      dataBoundary: "pre_data",
      empiricalDataUsed: false,
      diagnosticSeed: false,
    },
    claimBoundary: {
      numericalPredictionOnly: true,
      physicalPredictionAuthority: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

describe("nhm2_numerical_observable_prediction/v1", () => {
  it("admits an exact test-only numerical artifact for every governed observable ID", () => {
    expect(NHM2_NUMERICAL_OBSERVABLE_PREDICTION_OBSERVABLE_IDS).toHaveLength(6);
    for (const observableId of NHM2_NUMERICAL_OBSERVABLE_PREDICTION_OBSERVABLE_IDS) {
      expect(
        isNhm2NumericalObservablePrediction(predictionFor(observableId)),
        observableId,
      ).toBe(true);
    }
  });

  it("rejects null and non-finite central values", () => {
    for (const centralValue of [null, Number.NaN, Infinity, -Infinity]) {
      const artifact = predictionFor("delta_F") as unknown as {
        observable: { centralValue: unknown };
      };
      artifact.observable.centralValue = centralValue;
      expect(isNhm2NumericalObservablePrediction(artifact)).toBe(false);
    }
  });

  it("rejects unordered, non-finite, or non-covering intervals", () => {
    const cases = [
      { lower: 2, upper: 1 },
      { lower: Number.NaN, upper: 2 },
      { lower: 2, upper: 3 },
    ];
    for (const interval of cases) {
      const artifact = predictionFor("delta_F");
      Object.assign(artifact.observable.coverageInterval, interval);
      expect(isNhm2NumericalObservablePrediction(artifact)).toBe(false);
    }
  });

  it("rejects sign, unit, and deterministic artifact identity mismatches", () => {
    const wrongSign = predictionFor("delta_F");
    wrongSign.observable.signOrPhase = {
      kind: "negative",
      statement: "test-only expected negative sign",
      expectedPhaseRadians: null,
    };
    expect(isNhm2NumericalObservablePrediction(wrongSign)).toBe(false);

    const wrongUnit = predictionFor("delta_F");
    wrongUnit.observable.coverageInterval.unit = "other-unit";
    expect(isNhm2NumericalObservablePrediction(wrongUnit)).toBe(false);

    const wrongIdentity = predictionFor("delta_F");
    wrongIdentity.artifactId = `${NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX}.delta_tau`;
    expect(isNhm2NumericalObservablePrediction(wrongIdentity)).toBe(false);
  });

  it("rejects diagnostic seeds, empirical or physical authority, and arbitrary JSON", () => {
    const diagnosticSeed = predictionFor("delta_F");
    (
      diagnosticSeed.provenanceBoundary as { diagnosticSeed: boolean }
    ).diagnosticSeed = true;
    expect(isNhm2NumericalObservablePrediction(diagnosticSeed)).toBe(false);

    const empirical = predictionFor("delta_F");
    (
      empirical.provenanceBoundary as { empiricalDataUsed: boolean }
    ).empiricalDataUsed = true;
    expect(isNhm2NumericalObservablePrediction(empirical)).toBe(false);

    const physical = predictionFor("delta_F");
    (
      physical.claimBoundary as { physicalPredictionAuthority: boolean }
    ).physicalPredictionAuthority = true;
    expect(isNhm2NumericalObservablePrediction(physical)).toBe(false);
    expect(
      isNhm2NumericalObservablePrediction({
        artifactId: "nhm2.numerical_observable_prediction.delta_F",
        centralValue: 1,
      }),
    ).toBe(false);
  });
});
