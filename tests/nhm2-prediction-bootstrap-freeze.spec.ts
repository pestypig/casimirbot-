import { describe, expect, it } from "vitest";

import {
  NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID,
  NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION,
  NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION,
  NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
  NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION,
  NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION,
  computeNhm2PredictionBootstrapSetSha256,
  verifyNhm2PredictionBootstrapFreezeFromBytes,
  type Nhm2PredictionBootstrapArtifactRefV1,
  type Nhm2PredictionBootstrapClaimBoundaryV1,
  type Nhm2PredictionBootstrapFreezeV1,
  type Nhm2PredictionContentReplayEntryV1,
  type Nhm2PredictionContentReplayV1,
  type Nhm2PredictionGenerationCandidateV1,
  type Nhm2PredictionGenerationRunV1,
  type Nhm2PredictionReproductionCandidateV1,
} from "../shared/contracts/nhm2-prediction-bootstrap-freeze.v1";
import {
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX,
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS,
  type Nhm2NumericalObservablePredictionV1,
} from "../shared/contracts/nhm2-numerical-observable-prediction.v1";
import {
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PredictionFreezeObservableId,
} from "../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import { sha256Nhm2CanonicalText } from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID,
  THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION,
  THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
  THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
  type TheoryRuntimeReceiptV1,
} from "../shared/contracts/theory-runtime-receipt.v1";

const encoder = new TextEncoder();
const SOURCE_COMMIT = "a".repeat(40);
const GENERATED_AT = "2099-07-19T10:00:00.000Z";
const SOURCE_FROZEN_AT = "2099-07-19T10:01:00.000Z";
const RUN_STARTED_AT = "2099-07-19T10:05:00.000Z";
const RUN_COMPLETED_AT = "2099-07-19T10:10:00.000Z";
const PREDICTION_GENERATED_AT = "2099-07-19T10:12:00.000Z";
const REPLAY_GENERATED_AT = "2099-07-19T10:13:00.000Z";
const TARGET_GENERATED_AT = "2099-07-19T10:14:00.000Z";
const FREEZE_AT = "2099-07-19T10:15:00.000Z";
const REPRODUCTION_START_AT = "2099-07-19T10:20:00.000Z";
const DATA_OPENS_AT = "2099-07-19T11:00:00.000Z";

const claimBoundary = (): Nhm2PredictionBootstrapClaimBoundaryV1 => ({
  theoryOnlyBootstrapEvidence: true,
  experimentReadyTheoryClosureClaimAllowed: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
  empiricalReceiptsRequired: true,
});

type FixtureOptions = {
  historicalAlpha07?: boolean;
  nullPrediction?: boolean;
  placeholderPrediction?: boolean;
  wrongUnit?: boolean;
  wrongRunProvenance?: boolean;
  targetReusesSourceIdentity?: boolean;
  targetStartsBeforeFreeze?: boolean;
  targetClaimLockOpened?: boolean;
  nestedClaimLockOpened?: boolean;
};

type Fixture = {
  freeze: Nhm2PredictionBootstrapFreezeV1;
  freezeBytes: Uint8Array;
  store: Map<string, Uint8Array>;
  predictionPaths: string[];
};

const observableUnit = (
  observableId: Nhm2PredictionFreezeObservableId,
): string =>
  observableId === "delta_phi_f"
    ? "rad"
    : observableId === "delta_tau"
      ? "s"
      : observableId === "delta_F"
        ? "N"
        : observableId === "R_0i0j"
          ? "s^-2"
          : "J m^-3";

const fixture = (options: FixtureOptions = {}): Fixture => {
  const store = new Map<string, Uint8Array>();
  const write = <T extends { artifactId: string }>(
    path: string,
    schemaVersion: string,
    value: T,
  ): Nhm2PredictionBootstrapArtifactRefV1 => {
    const text = JSON.stringify(value);
    const bytes = encoder.encode(text);
    store.set(path, bytes);
    return {
      artifactId: value.artifactId,
      path,
      schemaVersion,
      sha256: sha256Nhm2CanonicalText(text),
      sizeBytes: bytes.byteLength,
      mediaType: "application/json",
    };
  };

  const sourceCandidate: Nhm2PredictionGenerationCandidateV1 = {
    artifactId: "nhm2_prediction_generation_candidate",
    contractVersion: NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
    generatedAt: GENERATED_AT,
    frozenAt: SOURCE_FROZEN_AT,
    dataCollectionOpensAt: DATA_OPENS_AT,
    candidateId: "nhm2-prediction-generation-candidate-001",
    manifestId: "nhm2-prediction-generation-manifest-001",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "nhm2-profile-alpha-0p7000-fresh-solver-campaign",
    freezeId: "nhm2-prediction-bootstrap-freeze-001",
    sourceCommitSha: SOURCE_COMMIT,
    model: {
      modelId: "nhm2-coupled-model-001",
      parameterSetId: "nhm2-parameter-set-001",
      uncertaintyBudgetId: "nhm2-uncertainty-budget-001",
      uncertaintyMethod:
        "joint discretization and material covariance propagation",
      uncertaintySourceIds: [
        "solver-discretization-covariance",
        "material-model-covariance",
      ],
    },
    targetReservation: {
      candidateId: options.targetReusesSourceIdentity
        ? "nhm2-prediction-generation-candidate-001"
        : "nhm2-reproduction-candidate-002",
      manifestId: options.targetReusesSourceIdentity
        ? "nhm2-prediction-generation-manifest-001"
        : "nhm2-reproduction-manifest-002",
      requestId: "nhm2-reproduction-request-002",
      runId: "nhm2-reproduction-run-002",
      receiptId: "nhm2-reproduction-receipt-002",
      runtimeId: "nhm2-reproduction-runtime-002",
    },
    plannedGenerationRun: {
      requestId: "nhm2-prediction-generation-request-001",
      runId: "nhm2-prediction-generation-run-001",
      receiptId: "nhm2-prediction-generation-receipt-001",
      runtimeId: "nhm2-prediction-generation-runtime-001",
      solverId: "nhm2-coupled-prediction-solver",
      solverVersion: "1.0.0",
      outputDirectory: "artifacts/nhm2/prediction-generation/run-001",
    },
    observableTargets: NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.map(
      (observableId, index) => ({
        observableId,
        definition: `independently replayable numerical observable ${observableId}`,
        unit: observableUnit(observableId),
        analysisWindow: `sealed analysis window ${index + 1}`,
        targetTime: `2099-07-19T11:${String(10 + index).padStart(2, "0")}:00.000Z`,
      }),
    ),
    provenanceBoundary: options.historicalAlpha07
      ? ({
          sourceKind: "historical_alpha07_import",
          historicalImport: true,
          legacyAlpha07ArtifactUsed: true,
          diagnosticSeed: false,
        } as unknown as Nhm2PredictionGenerationCandidateV1["provenanceBoundary"])
      : {
          sourceKind: "fresh_prediction_generation",
          historicalImport: false,
          legacyAlpha07ArtifactUsed: false,
          diagnosticSeed: false,
        },
    claimBoundary: claimBoundary(),
  };
  const candidateRef = write(
    "artifacts/nhm2/prediction-generation/candidate-001.json",
    NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
    sourceCandidate,
  );

  const sourceRefs = NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.map(
    (observableId) =>
      write(
        `artifacts/nhm2/prediction-generation/run-001/source-${observableId}.json`,
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.source,
        {
          artifactId: `nhm2.prediction_source_snapshot.${observableId}`,
          contractVersion:
            NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.source,
          generatedAt: RUN_COMPLETED_AT,
          observableId,
          candidateId: sourceCandidate.candidateId,
          runId: sourceCandidate.plannedGenerationRun.runId,
          sourceCommitSha: SOURCE_COMMIT,
          sourceArraySha256: String(
            NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.indexOf(
              observableId,
            ) + 1,
          ).repeat(64),
          ...(options.nestedClaimLockOpened && observableId === "DeltaTmunu_xt"
            ? { physicalViabilityClaimAllowed: true }
            : {}),
        },
      ),
  );

  const sourceRun: Nhm2PredictionGenerationRunV1 = {
    artifactId: "nhm2_prediction_generation_run",
    contractVersion: NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION,
    generatedAt: RUN_COMPLETED_AT,
    candidateRef,
    identity: {
      candidateId: sourceCandidate.candidateId,
      selectedProfileId: sourceCandidate.selectedProfileId,
      requestId: sourceCandidate.plannedGenerationRun.requestId,
      runId: sourceCandidate.plannedGenerationRun.runId,
      receiptId: sourceCandidate.plannedGenerationRun.receiptId,
      runtimeId: sourceCandidate.plannedGenerationRun.runtimeId,
    },
    solver: {
      solverId: sourceCandidate.plannedGenerationRun.solverId,
      solverVersion: sourceCandidate.plannedGenerationRun.solverVersion,
      sourceCommitSha: SOURCE_COMMIT,
    },
    execution: {
      outputDirectory: sourceCandidate.plannedGenerationRun.outputDirectory,
      startedAt: RUN_STARTED_AT,
      completedAt: RUN_COMPLETED_AT,
      durationMs: 300_000,
      exitCode: 0,
    },
    sourceSnapshotRefs: sourceRefs,
    claimBoundary: claimBoundary(),
  };
  const runRef = write(
    "artifacts/nhm2/prediction-generation/run-001/run.json",
    NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION,
    sourceRun,
  );

  const receiptOutputs = [runRef, ...sourceRefs];
  const runtimeReceipt: TheoryRuntimeReceiptV1 = {
    artifactId: THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
    generatedAt: "2099-07-19T10:11:00.000Z",
    receiptId: sourceRun.identity.receiptId,
    runtimeId: sourceRun.identity.runtimeId,
    graphId: "nhm2.prediction_generation",
    badgeIds: ["nhm2.prediction_generation.runtime"],
    command: "nhm2-prediction-generation",
    args: { candidateId: sourceCandidate.candidateId },
    status: "completed",
    outputs: {
      artifacts: receiptOutputs.map((ref) => ref.path),
      scalars: { exitCode: 0 },
      units: { exitCode: null },
      gates: { prediction_generation_runtime: "pass" },
      missingSignals: [],
      warnings: [],
      artifactManifest: {
        artifactId: THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID,
        schemaVersion: THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION,
        generatedAt: "2099-07-19T10:10:30.000Z",
        requestId: sourceRun.identity.requestId,
        runtimeId: sourceRun.identity.runtimeId,
        gitSha: SOURCE_COMMIT,
        startedAt: RUN_STARTED_AT,
        completedAt: RUN_COMPLETED_AT,
        outputDirectory: sourceRun.execution.outputDirectory,
        boundToExecution: true,
        manifestPath:
          "artifacts/nhm2/prediction-generation/run-001/output-manifest.json",
        manifestSha256: "b".repeat(64),
        entries: receiptOutputs.map((ref) => ({
          path: ref.path,
          sha256: ref.sha256,
          sizeBytes: ref.sizeBytes,
          modifiedAt: RUN_COMPLETED_AT,
          freshness: "new" as const,
        })),
      },
      artifactEvidence: receiptOutputs.map((ref) => ({
        path: ref.path,
        sha256: ref.sha256,
        freshness: "new" as const,
        status: "pass" as const,
        gates: { raw_bytes_hash_bound: "pass" as const },
      })),
    },
    provenance: {
      gitSha: SOURCE_COMMIT,
      startedAt: RUN_STARTED_AT,
      completedAt: RUN_COMPLETED_AT,
      durationMs: 300_000,
    },
    execution: {
      command: "nhm2-prediction-generation",
      args: ["--candidate", candidateRef.path],
      cwd: "casimirbot",
      environment: { NHM2_RUN_ID: sourceRun.identity.runId },
      outputDirectory: sourceRun.execution.outputDirectory,
      outputDirectoryBound: true,
      exitCode: 0,
      stdout: "prediction source generation completed",
      stderr: "",
      timedOut: false,
      error: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy: ["experimental receipts remain absent"],
    },
  };
  const receiptRef = write(
    "artifacts/nhm2/prediction-generation/run-001/runtime-receipt.json",
    THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
    runtimeReceipt,
  );

  const predictions: Nhm2NumericalObservablePredictionV1[] = [];
  const predictionRefs: Nhm2PredictionBootstrapArtifactRefV1[] = [];
  const derivationRefs: Nhm2PredictionBootstrapArtifactRefV1[] = [];
  const uncertaintyRefs: Nhm2PredictionBootstrapArtifactRefV1[] = [];
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.forEach(
    (observableId, index) => {
      const derivationRef = write(
        `artifacts/nhm2/prediction-generation/run-001/derivation-${observableId}.json`,
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.derivation,
        {
          artifactId: `nhm2.prediction_derivation.${observableId}`,
          contractVersion:
            NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.derivation,
          generatedAt: PREDICTION_GENERATED_AT,
          observableId,
          runId: sourceRun.identity.runId,
          sourceRef: sourceRefs[index],
          equationId: `nhm2-observable-equation-${index + 1}`,
        },
      );
      derivationRefs.push(derivationRef);
      const uncertaintyRef = write(
        `artifacts/nhm2/prediction-generation/run-001/uncertainty-${observableId}.json`,
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.uncertainty,
        {
          artifactId: `nhm2.prediction_uncertainty.${observableId}`,
          contractVersion:
            NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.uncertainty,
          generatedAt: PREDICTION_GENERATED_AT,
          observableId,
          uncertaintyBudgetId: sourceCandidate.model.uncertaintyBudgetId,
          method: sourceCandidate.model.uncertaintyMethod,
          sourceIds: sourceCandidate.model.uncertaintySourceIds,
          derivationRef,
        },
      );
      uncertaintyRefs.push(uncertaintyRef);
      const phase = observableId === "delta_phi_f";
      const prediction = {
        artifactId: `${NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX}.${observableId}`,
        contractVersion: NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
        generatedAt: PREDICTION_GENERATED_AT,
        frozenAt: FREEZE_AT,
        dataCollectionOpensAt: DATA_OPENS_AT,
        binding: {
          candidateId: sourceCandidate.targetReservation.candidateId,
          selectedProfileId: sourceCandidate.selectedProfileId,
          freezeId: sourceCandidate.freezeId,
          modelId: sourceCandidate.model.modelId,
          parameterSetId: sourceCandidate.model.parameterSetId,
          uncertaintyBudgetId: sourceCandidate.model.uncertaintyBudgetId,
        },
        observable: {
          observableId,
          definition: sourceCandidate.observableTargets[index].definition,
          unit:
            options.wrongUnit && index === 0
              ? "kg"
              : sourceCandidate.observableTargets[index].unit,
          centralValue:
            options.nullPrediction && index === 0 ? null : 1 + index / 10,
          coverageInterval: {
            lower: 0.5,
            upper: 2,
            coverageProbability: 0.95,
            unit:
              options.wrongUnit && index === 0
                ? "kg"
                : sourceCandidate.observableTargets[index].unit,
          },
          signOrPhase: phase
            ? {
                kind: "phase" as const,
                statement: "positive phase excursion in the sealed window",
                expectedPhaseRadians: 1.1,
              }
            : {
                kind: "positive" as const,
                statement: "positive signed observable in the sealed window",
                expectedPhaseRadians: null,
              },
          scalingLaw: {
            expression: "observable = calibrated_amplitude * drive_scale",
            independentVariables: ["drive_scale"],
            validityDomain:
              options.placeholderPrediction && index === 0
                ? "placeholder"
                : "frozen bounded source and geometry domain",
          },
          analysisWindow:
            sourceCandidate.observableTargets[index].analysisWindow,
        },
        derivation: {
          runId:
            options.wrongRunProvenance && index === 0
              ? "unrelated-generation-run"
              : sourceRun.identity.runId,
          runtimeId: sourceRun.identity.runtimeId,
          solverId: sourceRun.solver.solverId,
          solverVersion: sourceRun.solver.solverVersion,
          sourceCommitSha: SOURCE_COMMIT,
          runReceiptRef: {
            artifactId: receiptRef.artifactId,
            path: receiptRef.path,
            schemaVersion: receiptRef.schemaVersion,
            sha256: receiptRef.sha256,
          },
          sourceRef: {
            artifactId: sourceRefs[index].artifactId,
            path: sourceRefs[index].path,
            schemaVersion: sourceRefs[index].schemaVersion,
            sha256: sourceRefs[index].sha256,
          },
          derivationRef: {
            artifactId: derivationRef.artifactId,
            path: derivationRef.path,
            schemaVersion: derivationRef.schemaVersion,
            sha256: derivationRef.sha256,
          },
        },
        uncertainty: {
          uncertaintyBudgetId: sourceCandidate.model.uncertaintyBudgetId,
          method: sourceCandidate.model.uncertaintyMethod,
          sourceIds: sourceCandidate.model.uncertaintySourceIds,
          derivationRef: {
            artifactId: uncertaintyRef.artifactId,
            path: uncertaintyRef.path,
            schemaVersion: uncertaintyRef.schemaVersion,
            sha256: uncertaintyRef.sha256,
          },
        },
        provenanceBoundary: {
          theoryOnly: true as const,
          dataBoundary: "pre_data" as const,
          empiricalDataUsed: false as const,
          diagnosticSeed: false as const,
        },
        claimBoundary: {
          numericalPredictionOnly: true as const,
          physicalPredictionAuthority: false as const,
          physicalViabilityClaimAllowed: false as const,
          transportClaimAllowed: false as const,
          propulsionClaimAllowed: false as const,
          routeEtaClaimAllowed: false as const,
          speedAuthorityClaimAllowed: false as const,
        },
      } as unknown as Nhm2NumericalObservablePredictionV1;
      predictions.push(prediction);
      predictionRefs.push(
        write(
          `artifacts/nhm2/prediction-freeze/prediction-${observableId}.json`,
          NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
          prediction,
        ),
      );
    },
  );

  const digestEntries = predictions.map((prediction, index) => ({
    observableId: prediction.observable.observableId,
    ref: predictionRefs[index],
    prediction,
  }));
  const predictionSetSha256 =
    computeNhm2PredictionBootstrapSetSha256(digestEntries);
  const replayEntries: Nhm2PredictionContentReplayEntryV1[] = predictions.map(
    (prediction, index) => ({
      observableId: prediction.observable.observableId,
      targetTime: sourceCandidate.observableTargets[index].targetTime,
      analysisWindow: prediction.observable.analysisWindow,
      unit: prediction.observable.unit,
      centralValue: prediction.observable.centralValue,
      intervalLower: prediction.observable.coverageInterval.lower,
      intervalUpper: prediction.observable.coverageInterval.upper,
      coverageProbability:
        prediction.observable.coverageInterval.coverageProbability,
      predictionRef: predictionRefs[index],
      sourceSnapshotRef: sourceRefs[index],
      derivationRef: derivationRefs[index],
      uncertaintyRef: uncertaintyRefs[index],
    }),
  );
  const replay: Nhm2PredictionContentReplayV1 = {
    artifactId: "nhm2_prediction_content_replay",
    contractVersion: NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION,
    generatedAt: REPLAY_GENERATED_AT,
    candidateRef,
    runRef,
    receiptRef,
    identity: {
      candidateId: sourceCandidate.candidateId,
      selectedProfileId: sourceCandidate.selectedProfileId,
      requestId: sourceRun.identity.requestId,
      runId: sourceRun.identity.runId,
      receiptId: sourceRun.identity.receiptId,
      runtimeId: sourceRun.identity.runtimeId,
      freezeId: sourceCandidate.freezeId,
    },
    algorithm: "reopen_hash_and_recompute_prediction_payload/v1",
    predictionSetSha256,
    entries: replayEntries,
    result: "verified",
    claimBoundary: claimBoundary(),
  };
  const replayRef = write(
    "artifacts/nhm2/prediction-freeze/content-replay.json",
    NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION,
    replay,
  );

  const targetClaimBoundary = claimBoundary();
  if (options.targetClaimLockOpened) {
    (
      targetClaimBoundary as { physicalViabilityClaimAllowed: boolean }
    ).physicalViabilityClaimAllowed = true;
  }
  const target: Nhm2PredictionReproductionCandidateV1 = {
    artifactId: "nhm2_prediction_reproduction_candidate",
    contractVersion: NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION,
    generatedAt: TARGET_GENERATED_AT,
    frozenAt: FREEZE_AT,
    dataCollectionOpensAt: DATA_OPENS_AT,
    candidateId: sourceCandidate.targetReservation.candidateId,
    manifestId: sourceCandidate.targetReservation.manifestId,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: sourceCandidate.selectedProfileId,
    freezeId: sourceCandidate.freezeId,
    supersession: {
      predecessorCandidateId: sourceCandidate.candidateId,
      predecessorManifestId: sourceCandidate.manifestId,
      predecessorRef: candidateRef,
      originalImmutable: true,
      inPlaceMutationForbidden: true,
    },
    contentReplayRef: replayRef,
    predictionSetSha256,
    predictionRefs,
    reproductionRun: {
      requestId: sourceCandidate.targetReservation.requestId,
      runId: sourceCandidate.targetReservation.runId,
      receiptId: sourceCandidate.targetReservation.receiptId,
      runtimeId: sourceCandidate.targetReservation.runtimeId,
      plannedStartAt: options.targetStartsBeforeFreeze
        ? FREEZE_AT
        : REPRODUCTION_START_AT,
    },
    claimBoundary: targetClaimBoundary,
  };
  const targetRef = write(
    "artifacts/nhm2/prediction-freeze/reproduction-candidate-002.json",
    NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION,
    target,
  );

  const closure = [
    candidateRef,
    runRef,
    receiptRef,
    replayRef,
    targetRef,
    ...sourceRefs,
    ...derivationRefs,
    ...uncertaintyRefs,
    ...predictionRefs,
  ].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  const freeze: Nhm2PredictionBootstrapFreezeV1 = {
    artifactId: NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID,
    contractVersion: NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION,
    generatedAt: FREEZE_AT,
    frozenAt: FREEZE_AT,
    freezePath: "artifacts/nhm2/prediction-freeze/bootstrap-freeze.json",
    freezeId: sourceCandidate.freezeId,
    source: {
      candidateRef,
      runRef,
      receiptRef,
      contentReplayRef: replayRef,
    },
    targetCandidateRef: targetRef,
    predictionSetSha256,
    predictionRefs,
    artifactClosure: {
      algorithm: "sha256_raw_utf8_json/v1",
      ordering: "path_code_unit_ascending/v1",
      entries: closure,
    },
    claimBoundary: claimBoundary(),
  };
  return {
    freeze,
    freezeBytes: encoder.encode(JSON.stringify(freeze)),
    store,
    predictionPaths: predictionRefs.map((ref) => ref.path),
  };
};

const verify = (value: Fixture) =>
  verifyNhm2PredictionBootstrapFreezeFromBytes({
    freezeBytes: value.freezeBytes,
    readBytes: (path) => {
      const bytes = value.store.get(path);
      if (bytes == null) throw new Error(`missing ${path}`);
      return bytes;
    },
  });

describe("NHM2 prediction bootstrap/freeze v1", () => {
  it("verifies a fresh precursor run, exactly six numerical predictions, replay, and distinct frozen reproduction candidate", async () => {
    const result = await verify(fixture());

    expect(result).toMatchObject({
      valid: true,
      freezeParsed: true,
      allReferencedBytesVerified: true,
      predictionCount: 6,
      blockers: [],
    });
    expect(result.artifact?.claimBoundary).toMatchObject({
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
  });

  it("rejects the historical alpha07 import even when every byte and hash is internally consistent", async () => {
    const result = await verify(fixture({ historicalAlpha07: true }));

    expect(result.valid).toBe(false);
    expect(result.allReferencedBytesVerified).toBe(true);
    expect(result.blockers).toContain(
      "prediction_bootstrap_source_candidate_invalid",
    );
  });

  it("rejects null or placeholder prediction payloads and requires the exact six-observable set", async () => {
    const nullResult = await verify(fixture({ nullPrediction: true }));
    expect(nullResult.valid).toBe(false);
    expect(
      nullResult.blockers.some((blocker) =>
        blocker.startsWith("prediction_bootstrap_prediction_invalid:"),
      ),
    ).toBe(true);

    const placeholder = await verify(fixture({ placeholderPrediction: true }));
    expect(placeholder.valid).toBe(false);
    expect(
      placeholder.blockers.some((blocker) =>
        blocker.startsWith("prediction_bootstrap_placeholder_content:"),
      ),
    ).toBe(true);

    const missing = fixture();
    missing.freeze.predictionRefs = missing.freeze.predictionRefs.slice(1);
    missing.freezeBytes = encoder.encode(JSON.stringify(missing.freeze));
    const missingResult = await verify(missing);
    expect(missingResult.valid).toBe(false);
    expect(missingResult.blockers).toContain(
      "prediction_bootstrap_prediction_ref_set_invalid",
    );
  });

  it("rejects identity, unit, uncertainty/provenance, and target-time/run mismatches after rehashing", async () => {
    const wrongUnit = await verify(fixture({ wrongUnit: true }));
    expect(wrongUnit.valid).toBe(false);
    expect(wrongUnit.blockers).toContain(
      "prediction_bootstrap_prediction_binding_mismatch:DeltaTmunu_xt",
    );

    const wrongRun = await verify(fixture({ wrongRunProvenance: true }));
    expect(wrongRun.valid).toBe(false);
    expect(wrongRun.blockers).toContain(
      "prediction_bootstrap_prediction_binding_mismatch:DeltaTmunu_xt",
    );
  });

  it("detects post-freeze byte mutation without trusting the serialized replay result", async () => {
    const value = fixture();
    const path = value.predictionPaths[0];
    const bytes = value.store.get(path)!;
    value.store.set(
      path,
      encoder.encode(`${new TextDecoder().decode(bytes)} `),
    );

    const result = await verify(value);
    expect(result.valid).toBe(false);
    expect(result.allReferencedBytesVerified).toBe(false);
    expect(result.blockers).toContain(
      `prediction_bootstrap_sha256_mismatch:${path}`,
    );
  });

  it("rejects a self/circular freeze reference", async () => {
    const value = fixture();
    const selfValue = {
      artifactId: NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID,
      contractVersion: NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION,
      note: "forbidden self reference",
    };
    const selfText = JSON.stringify(selfValue);
    const selfBytes = encoder.encode(selfText);
    const selfRef: Nhm2PredictionBootstrapArtifactRefV1 = {
      artifactId: NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID,
      path: value.freeze.freezePath,
      schemaVersion: NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION,
      sha256: sha256Nhm2CanonicalText(selfText),
      sizeBytes: selfBytes.byteLength,
      mediaType: "application/json",
    };
    value.store.set(selfRef.path, selfBytes);
    value.freeze.artifactClosure.entries.push(selfRef);
    value.freeze.artifactClosure.entries.sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
    value.freezeBytes = encoder.encode(JSON.stringify(value.freeze));

    const result = await verify(value);
    expect(result.valid).toBe(false);
    expect(result.blockers).toContain(
      "prediction_bootstrap_self_reference_forbidden",
    );
  });

  it("requires a distinct target candidate and freezes it before the reproduction run", async () => {
    const reused = await verify(fixture({ targetReusesSourceIdentity: true }));
    expect(reused.valid).toBe(false);
    expect(reused.blockers).toContain(
      "prediction_bootstrap_source_candidate_invalid",
    );

    const late = await verify(fixture({ targetStartsBeforeFreeze: true }));
    expect(late.valid).toBe(false);
    expect(late.blockers).toContain(
      "prediction_bootstrap_target_candidate_invalid",
    );
  });

  it("rejects opened physical, transport, propulsion, ETA, or speed claim locks", async () => {
    const target = await verify(fixture({ targetClaimLockOpened: true }));
    expect(target.valid).toBe(false);
    expect(target.blockers).toContain(
      "prediction_bootstrap_target_candidate_invalid",
    );

    const nested = await verify(fixture({ nestedClaimLockOpened: true }));
    expect(nested.valid).toBe(false);
    expect(
      nested.blockers.some((blocker) =>
        blocker.startsWith("prediction_bootstrap_claim_lock_opened:"),
      ),
    ).toBe(true);

    for (const key of [
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ] as const) {
      const value = fixture();
      (value.freeze.claimBoundary as Record<string, boolean>)[key] = true;
      value.freezeBytes = encoder.encode(JSON.stringify(value.freeze));
      const result = await verify(value);
      expect(result.valid, key).toBe(false);
      expect(result.blockers, key).toContain(
        "prediction_bootstrap_claim_lock_opened",
      );
    }
  });
});
