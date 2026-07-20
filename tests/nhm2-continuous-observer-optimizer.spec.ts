import { describe, expect, it } from "vitest";

import {
  NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS,
  NHM2_CONTINUOUS_OBSERVER_REQUIRED_CHECK_IDS,
  buildNhm2ContinuousObserverOptimizer,
  isNhm2ContinuousObserverOptimizer,
  type BuildNhm2ContinuousObserverOptimizerInput,
} from "../shared/contracts/nhm2-continuous-observer-optimizer.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";

const hash = (character: string): string => character.repeat(64);

let artifactIndex = 0;
const artifact = () => {
  artifactIndex += 1;
  const character = (artifactIndex % 10).toString();
  return {
    path: `artifacts/observer/${artifactIndex}.json`,
    sha256: hash(character),
  };
};

const completeInput = (): BuildNhm2ContinuousObserverOptimizerInput => {
  artifactIndex = 0;
  const candidateSha = hash("a");
  const gitSha = "b".repeat(40);
  return {
    generatedAt: "2026-07-19T00:00:02.000Z",
    identity: {
      candidateId: "nhm2-alpha-0.7-theory-candidate",
      candidateManifestSha256: candidateSha,
      preRunManifest: {
        path: "artifacts/candidate/pre-run-manifest.json",
        sha256: candidateSha,
      },
      laneId: "nhm2_shift_lapse",
      runId: "observer-run-1",
      requestId: "observer-request-1",
      receiptId: "observer-receipt-1",
      selectedProfileId: "alpha-0.7",
      chartId: "nhm2-cartesian-v1",
      atlas: artifact(),
      units: artifact(),
      normalization: artifact(),
      gitSha,
    },
    sourceBinding: {
      sourceContractVersion: "nhm2_full_apparatus_source_tensor/v1",
      sourceEvidence: {
        path: "artifacts/source/full-apparatus-source-tensor.v1.json",
        sha256: "c".repeat(64),
      },
      rawTotalSourceTensor: {
        path: "artifacts/source/raw-total-source-tensor.f64",
        sha256: "d".repeat(64),
      },
      candidateId: "nhm2-alpha-0.7-theory-candidate",
      candidateManifestSha256: candidateSha,
      runId: "observer-run-1",
      chartId: "nhm2-cartesian-v1",
    },
    domain: {
      admittedSpatialSampleCount: 64,
      optimizedSpatialSampleCount: 64,
      spatialSampleIndex: artifact(),
      timelikeManifold: {
        parameterization: "unit_timelike_hyperboloid",
        dimension: 3,
        chartCount: 2,
        atlas: artifact(),
        parameterSamples: artifact(),
      },
      nullManifold: {
        parameterization: "future_null_directions",
        dimension: 2,
        directionCount: 128,
        atlas: artifact(),
        directionSamples: artifact(),
      },
    },
    extrema: {
      rawExtremaArray: artifact(),
      entries: NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS.map(
        (condition, index) => ({
          condition,
          observerClass: condition === "NEC" ? "future_null" : "unit_timelike",
          extremum: "minimum",
          valueSI: -10 - index,
          absoluteUncertaintySI: 0.01,
          unit: "J/m^3",
          spatialSampleCount: 64,
          observerVectorCount: 3,
          observerVectors: artifact(),
          valueArray: artifact(),
        }),
      ),
    },
    optimizer: {
      algorithmId: "riemannian-global-minimizer",
      algorithmVersion: "1.0.0",
      objectiveDefinition: artifact(),
      stationarityResidualMax: 1e-10,
      stationarityTolerance: 1e-8,
      certifiedGlobalityGapMax: 1e-9,
      globalityGapTolerance: 1e-7,
      globalityCertificate: artifact(),
      convergence: {
        resolutionLevels: [32, 64, 128],
        observedOrder: 2.1,
        minimumOrder: 1.5,
        crossResolutionExtremumDifferenceMax: 1e-8,
        crossResolutionTolerance: 1e-6,
        study: artifact(),
      },
      adversarialStarts: {
        requiredCount: 8,
        completedCount: 8,
        distinctStartCount: 8,
        worstExtremumDisagreement: 1e-9,
        disagreementTolerance: 1e-7,
        starts: artifact(),
        replay: artifact(),
      },
      contradictoryEvidence: {
        scannedEvidenceCount: 4,
        contradictionsFound: 1,
        contradictionsResolved: 1,
        unresolvedCount: 0,
        registry: artifact(),
        resolutionLog: artifact(),
      },
    },
    uncertainty: {
      confidenceLevel: 0.95,
      method: "correlated-bootstrap-plus-discretization-envelope",
      budget: artifact(),
      rawSamples: artifact(),
    },
    provenance: {
      producerId: "nhm2-observer-producer",
      implementationId: "observer-implementation-a",
      solverId: "observer-solver",
      solverVersion: "1.0.0",
      solver: artifact(),
      environment: artifact(),
      invocation: artifact(),
      command: "node tools/nhm2/run-continuous-observer.js",
      argv: ["--candidate", "nhm2-alpha-0.7-theory-candidate"],
      workingDirectory: "/workspace/casimirbot",
      inputManifest: artifact(),
      outputDirectory: "artifacts/runs/observer-run-1",
      runId: "observer-run-1",
      requestId: "observer-request-1",
      receiptId: "observer-receipt-1",
      gitSha,
      startedAt: "2026-07-19T00:00:00.000Z",
      completedAt: "2026-07-19T00:00:01.000Z",
      durationMs: 1000,
      deterministicSeed: "observer-seed-1",
      runSpecificOutput: true,
    },
  };
};

const clone = <T>(value: T): T => structuredClone(value);

describe("nhm2 continuous observer optimizer contract", () => {
  it("derives a contract-only pass from complete synthetic raw evidence", () => {
    const artifact = buildNhm2ContinuousObserverOptimizer(completeInput());

    expect(artifact.status).toBe("pass");
    expect(artifact.continuousObserverOptimizationReady).toBe(true);
    expect(artifact.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.continuous_observer_optimizer,
    );
    expect(artifact.checks.every((entry) => entry.status === "pass")).toBe(
      true,
    );
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2ContinuousObserverOptimizer(artifact)).toBe(true);
  });

  it("fails closed while retaining every required check for empty evidence", () => {
    const artifact = buildNhm2ContinuousObserverOptimizer();

    expect(artifact.status).toBe("blocked");
    expect(artifact.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_CONTINUOUS_OBSERVER_REQUIRED_CHECK_IDS,
    );
    expect(artifact.blockers).toContain(
      "identity_or_provenance:candidate_id_missing",
    );
    expect(isNhm2ContinuousObserverOptimizer(artifact)).toBe(true);
  });

  it("fails when any admitted spatial sample is omitted", () => {
    const input = completeInput();
    input.domain!.optimizedSpatialSampleCount = 63;
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("fail");
    expect(
      artifact.checks.find(
        (entry) => entry.checkId === "every_admitted_spatial_sample_covered",
      ),
    ).toMatchObject({
      status: "fail",
      blockers: ["admitted_spatial_samples_not_fully_covered"],
    });
  });

  it("rejects one-point spatial and one-direction observer scans", () => {
    const input = completeInput();
    input.domain!.admittedSpatialSampleCount = 1;
    input.domain!.optimizedSpatialSampleCount = 1;
    input.domain!.nullManifold!.directionCount = 1;
    for (const entry of input.extrema!.entries ?? []) {
      entry!.spatialSampleCount = 1;
    }
    const result = buildNhm2ContinuousObserverOptimizer(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "observer_spatial_sample_count_meets_frozen_minimum:admitted_spatial_sample_count_below_frozen_minimum",
    );
    expect(result.blockers).toContain(
      "null_direction_sample_count_meets_frozen_minimum:null_direction_count_below_frozen_minimum",
    );
  });

  it("rejects sub-policy observer convergence despite a caller-declared lower minimum", () => {
    const input = completeInput();
    input.optimizer!.convergence!.observedOrder = 0.5;
    input.optimizer!.convergence!.minimumOrder = 0.25;
    const result = buildNhm2ContinuousObserverOptimizer(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "observer_resolution_convergence_meets_frozen_minimum:observed_convergence_order_below_frozen_minimum",
    );
  });

  it("blocks when null-direction raw arrays are not hash bound", () => {
    const input = completeInput();
    input.domain!.nullManifold!.directionSamples = null;
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("blocked");
    expect(
      artifact.checks.find(
        (entry) => entry.checkId === "null_direction_manifold_covered",
      )?.blockers,
    ).toContain("null_direction_samples_path_missing");
  });

  it("blocks unless optimization is bound to the raw full-apparatus source tensor", () => {
    const input = completeInput();
    input.sourceBinding!.rawTotalSourceTensor = null;
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("blocked");
    expect(artifact.blockers).toContain(
      "identity_or_provenance:full_apparatus_raw_total_source_tensor_path_missing",
    );
    expect(artifact.blockers).toContain(
      "identity_or_provenance:full_apparatus_raw_total_source_tensor_sha256_unbound",
    );
  });

  it("blocks source evidence detached from the candidate, run, or chart", () => {
    const input = completeInput();
    input.sourceBinding!.candidateId = "different-candidate";
    input.sourceBinding!.runId = "different-run";
    input.sourceBinding!.chartId = "different-chart";
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("blocked");
    expect(artifact.blockers).toContain(
      "identity_or_provenance:source_candidate_id_mismatch",
    );
    expect(artifact.blockers).toContain(
      "identity_or_provenance:source_run_id_mismatch",
    );
    expect(artifact.blockers).toContain(
      "identity_or_provenance:source_chart_id_mismatch",
    );
  });

  it("fails incomplete adversarial replay and unresolved contradictions", () => {
    const input = completeInput();
    input.optimizer!.adversarialStarts!.completedCount = 7;
    input.optimizer!.contradictoryEvidence!.unresolvedCount = 1;
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("fail");
    expect(artifact.blockers).toContain(
      "adversarial_initializations_replayed:adversarial_initializations_incomplete",
    );
    expect(artifact.blockers).toContain(
      "contradictory_observer_evidence_resolved:unresolved_contradictory_evidence_present",
    );
  });

  it("blocks mismatched pre-run and execution identities", () => {
    const input = completeInput();
    input.identity!.preRunManifest!.sha256 = hash("c");
    input.provenance!.receiptId = "different-receipt";
    const artifact = buildNhm2ContinuousObserverOptimizer(input);

    expect(artifact.status).toBe("blocked");
    expect(artifact.blockers).toContain(
      "identity_or_provenance:pre_run_manifest_candidate_sha_mismatch",
    );
    expect(artifact.blockers).toContain(
      "identity_or_provenance:provenance_receipt_id_mismatch",
    );
  });

  it("rejects derived-authority tampering and unknown fields", () => {
    const valid = buildNhm2ContinuousObserverOptimizer(completeInput());
    const tampered = clone(valid) as unknown as Record<string, unknown>;
    tampered.status = "blocked";
    expect(isNhm2ContinuousObserverOptimizer(tampered)).toBe(false);

    const shadow = clone(valid) as unknown as Record<string, unknown>;
    (shadow.optimizer as Record<string, unknown>).pass = true;
    expect(isNhm2ContinuousObserverOptimizer(shadow)).toBe(false);
  });

  it("contains no forward receipt/output-manifest hashes and rejects shadows", () => {
    const valid = buildNhm2ContinuousObserverOptimizer(completeInput());
    expect(valid.identity).not.toHaveProperty("receiptArtifact");
    expect(valid.provenance).not.toHaveProperty("outputManifest");
    expect(valid.provenance.outputDirectory).toBe(
      "artifacts/runs/observer-run-1",
    );
    expect(valid.sourceBinding).toEqual({
      sourceContractVersion: "nhm2_full_apparatus_source_tensor/v1",
      sourceEvidence: {
        path: "artifacts/source/full-apparatus-source-tensor.v1.json",
        sha256: "c".repeat(64),
      },
      rawTotalSourceTensor: {
        path: "artifacts/source/raw-total-source-tensor.f64",
        sha256: "d".repeat(64),
      },
      candidateId: "nhm2-alpha-0.7-theory-candidate",
      candidateManifestSha256: hash("a"),
      runId: "observer-run-1",
      chartId: "nhm2-cartesian-v1",
    });
    expect(valid.sourceBinding).not.toHaveProperty("receiptSha256");
    expect(valid.sourceBinding).not.toHaveProperty("outputManifestSha256");

    const receiptShadow = clone(valid) as unknown as Record<string, unknown>;
    (receiptShadow.identity as Record<string, unknown>).receiptArtifact =
      artifact();
    expect(isNhm2ContinuousObserverOptimizer(receiptShadow)).toBe(false);

    const manifestShadow = clone(valid) as unknown as Record<string, unknown>;
    (manifestShadow.provenance as Record<string, unknown>).outputManifest =
      artifact();
    expect(isNhm2ContinuousObserverOptimizer(manifestShadow)).toBe(false);

    const sourceForwardShadow = clone(valid) as unknown as Record<
      string,
      unknown
    >;
    (
      sourceForwardShadow.sourceBinding as Record<string, unknown>
    ).receiptSha256 = "e".repeat(64);
    expect(isNhm2ContinuousObserverOptimizer(sourceForwardShadow)).toBe(false);

    const sourceOutputShadow = clone(valid) as unknown as Record<
      string,
      unknown
    >;
    (
      sourceOutputShadow.sourceBinding as Record<string, unknown>
    ).outputManifestSha256 = "f".repeat(64);
    expect(isNhm2ContinuousObserverOptimizer(sourceOutputShadow)).toBe(false);
  });
});
