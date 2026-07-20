import { describe, expect, it } from "vitest";
import {
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA,
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC,
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_CHECK_IDS,
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS,
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_SERVER_REPLAY_BLOCKERS,
  buildNhm2IndependentNumericalReplication,
  isNhm2IndependentNumericalReplication,
  type Nhm2IndependentNumericalReplicationV1,
} from "../shared/contracts/nhm2-independent-numerical-replication.v1";
import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";

const sha = (character: string): string => character.repeat(64);
const git = (character: string): string => character.repeat(40);
const artifact = (path: string, digest = sha("a")) => ({
  path,
  sha256: digest,
});
const float64Array = (
  path: string,
  digest: string,
  componentOrder: readonly string[],
) => ({
  ...artifact(path, digest),
  dtype: "float64" as const,
  shape: [
    NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.sampleCount,
    componentOrder.length,
  ],
  sizeBytes:
    NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.sampleCount *
    componentOrder.length *
    8,
  storageOrder: "row-major" as const,
  componentOrder: [...componentOrder],
});
const binding = (
  artifactId: string,
  contractVersion: string,
  path: string,
  digest = sha("b"),
) => ({ artifactId, contractVersion, path, sha256: digest });

const invocationEnvironment = (input: {
  atlasSha: string;
  candidateId: string;
  chartId: string;
  normalizationSha: string;
  outputDirectory: string;
  runId: string;
  profileId: string;
  unitsSha: string;
  runtimeId: string;
  receiptId: string;
  requestId: string;
}): Array<{
  name: string;
  valueKind: "literal" | "candidate_manifest_raw_sha256";
  value: string | null;
}> =>
  (
    [
      ["NHM2_ATLAS_SHA256", "literal", input.atlasSha],
      ["NHM2_CANDIDATE_ID", "literal", input.candidateId],
      ["NHM2_CANDIDATE_MANIFEST_SHA256", "candidate_manifest_raw_sha256", null],
      ["NHM2_CHART_ID", "literal", input.chartId],
      ["NHM2_NORMALIZATION_SHA256", "literal", input.normalizationSha],
      ["NHM2_OUTPUT_DIR", "literal", input.outputDirectory],
      ["NHM2_RUN_ID", "literal", input.runId],
      ["NHM2_SELECTED_PROFILE_ID", "literal", input.profileId],
      ["NHM2_UNITS_SHA256", "literal", input.unitsSha],
      ["THEORY_RUNTIME_ID", "literal", input.runtimeId],
      ["THEORY_RUNTIME_RECEIPT_ID", "literal", input.receiptId],
      ["THEORY_RUNTIME_REQUEST_ID", "literal", input.requestId],
    ] as const satisfies readonly (readonly [
      string,
      "literal" | "candidate_manifest_raw_sha256",
      string | null,
    ])[]
  ).map(([name, valueKind, value]) => ({ name, valueKind, value }));

type CompleteInput = Pick<
  Nhm2IndependentNumericalReplicationV1,
  | "generatedAt"
  | "identity"
  | "coldRun"
  | "frozenReplay"
  | "comparison"
  | "discrepancyDisposition"
  | "reproducibilityPins"
>;

const completeInput = (): CompleteInput => {
  const candidateId = "candidate-alpha-0.7";
  const profileId = "profile-alpha-0.7";
  const chartId = "nhm2-cartesian";
  const requestId = "request-independent-001";
  const runId = "run-independent-001";
  const runtimeId = "nhm2-independent-runtime";
  const receiptId = nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
    runtimeId,
    requestId,
  );
  const outputDirectory = "artifacts/research/nhm2-independent/run-001";
  const atlasSha = sha("c");
  const unitsSha = sha("d");
  const normalizationSha = sha("e");
  const environmentSha = sha("f");
  return {
    generatedAt: "2026-07-19T12:00:00.000Z",
    identity: {
      candidateId,
      candidateManifestId: "manifest-alpha-0.7-v1",
      candidateManifest: binding(
        "nhm2.experiment_ready_theory_candidate_manifest",
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
        "artifacts/research/candidates/alpha-0.7.v1.json",
        sha("1"),
      ),
      numericPolicySet: {
        ...artifact(
          "artifacts/research/policies/nhm2-numeric.v1.json",
          sha("2"),
        ),
        policySetId: "nhm2-authoritative-v1",
        semanticSha256: sha("3"),
      },
      laneId: "nhm2_shift_lapse" as const,
      profile: {
        ...binding(
          "nhm2.profile",
          "nhm2_profile/v1",
          "inputs/profile.v1.json",
          sha("4"),
        ),
        selectedProfileId: profileId,
      },
      chart: {
        ...binding(
          "nhm2.chart",
          "nhm2_chart/v1",
          "inputs/chart.v1.json",
          sha("5"),
        ),
        chartId,
      },
      atlas: {
        ...binding(
          "nhm2.atlas",
          "nhm2_atlas/v1",
          "inputs/atlas.v1.json",
          atlasSha,
        ),
        atlasId: "nhm2-atlas-alpha-0.7",
      },
      units: {
        ...binding(
          "nhm2.units",
          "nhm2_units/v1",
          "inputs/units.v1.json",
          unitsSha,
        ),
        unitsId: "si-v1",
      },
      normalization: {
        ...binding(
          "nhm2.normalization",
          "nhm2_normalization/v1",
          "inputs/normalization.v1.json",
          normalizationSha,
        ),
        normalizationId: "nhm2-normalization-v1",
      },
      candidateGitSha: git("a"),
      primaryExecution: {
        requestId: "request-primary-001",
        runId: "run-primary-001",
        receiptId: "runtime:primary:request:receipt-primary-001",
        runtimeId: "nhm2-primary-runtime",
        solverId: "primary-solver",
        implementationId: "primary-implementation",
        independenceGroup: "primary-team-and-codebase",
      },
      independentPlan: {
        planRole: "independent_numerical" as const,
        requestId,
        runId,
        receiptId,
        runtimeId,
        sourceCommitSha: git("b"),
        deterministicSeed: "independent-seed-001",
        solver: {
          ...binding(
            "nhm2.independent_solver",
            "nhm2_independent_solver/v1",
            "solvers/independent.bin",
            sha("6"),
          ),
          solverId: "independent-solver",
          solverVersion: "1.0.0",
          implementationId: "independent-implementation",
          independenceGroup: "independent-team-and-codebase",
        },
        environmentLock: {
          ...binding(
            "nhm2.independent_environment",
            "nhm2_environment_lock/v1",
            "environments/independent.lock",
            environmentSha,
          ),
          environmentId: "independent-environment-v1",
        },
        expectedInvocation: {
          entrypoint: "nhm2-independent-replay",
          command: "node",
          args: ["dist/nhm2-independent-replay.js", "--frozen"],
          cwd: ".",
          environment: invocationEnvironment({
            atlasSha,
            candidateId,
            chartId,
            normalizationSha,
            outputDirectory,
            runId,
            profileId,
            unitsSha,
            runtimeId,
            receiptId,
            requestId,
          }),
          outputDirectory,
        },
      },
    },
    coldRun: {
      completed: true,
      processStateIsolated: true,
      priorOutputsExcluded: true,
      cachesDisabledOrPurged: true,
      scratchWorkspace: artifact("raw/cold-workspace.json", sha("7")),
      coldStartLog: artifact("raw/cold-start.log", sha("8")),
    },
    frozenReplay: {
      candidateInputs: artifact("inputs/candidate-inputs.json", sha("9")),
      replayedInputs: artifact("raw/replayed-inputs.json", sha("9")),
      candidateMesh: artifact("inputs/candidate-mesh.bin", sha("a")),
      replayedMesh: artifact("raw/replayed-mesh.bin", sha("a")),
      candidateEnvironment: artifact(
        "environments/independent.lock",
        environmentSha,
      ),
      replayedEnvironment: artifact(
        "raw/replayed-environment.lock",
        environmentSha,
      ),
      replayTranscript: artifact("raw/frozen-replay.json", sha("b")),
    },
    comparison: {
      frozenFieldSet: artifact("inputs/frozen-field-set.json", sha("c")),
      expectedFieldCount:
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length,
      comparedFieldCount:
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length,
      policy: {
        checkId: "field_level_outputs_agree_within_frozen_tolerances" as const,
        comparator: "lte" as const,
        tolerance: 0.1,
        unit: NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC,
        frozenPolicySha256: sha("d"),
      },
      fields: NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.map(
        (definition, index) => ({
          fieldId: definition.fieldId,
          primaryRawOutput: float64Array(
            `runs/primary/raw/${index}.f64`,
            sha("e"),
            definition.componentOrder,
          ),
          independentRawOutput: float64Array(
            `runs/independent/raw/${index}.f64`,
            sha("f"),
            definition.componentOrder,
          ),
          sampleDomain: artifact(
            `inputs/sample-domains/${index}.json`,
            sha("1"),
          ),
          diagnosticCoverage: {
            sampleCount:
              NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.sampleCount,
            refinementLevels:
              NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.refinementLevels,
            observedConvergenceOrder:
              NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.observedConvergenceOrder,
            domainCoverageFraction:
              NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.domainCoverageFraction,
          },
          metric: NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC,
          metricValue: index === 1 ? 0.03 : 0.02,
          tolerance: 0.1,
          unit: NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC,
          absoluteUncertainty95: 0.005,
        }),
      ),
      maximumMetricValue: 0.03,
      rawComparisonTable: artifact("raw/comparison-table.json", sha("4")),
    },
    discrepancyDisposition: {
      uncertaintyConfidenceLevel: 0.95,
      uncertaintyBudget: artifact("raw/uncertainty-budget.json", sha("5")),
      entries: [],
      dispositionLog: artifact("raw/disposition-log.json", sha("6")),
    },
    reproducibilityPins: {
      candidateCommitSha: git("a"),
      independentCommitSha: git("b"),
      candidateContainer: artifact("containers/candidate.oci", sha("7")),
      independentContainer: artifact("containers/independent.oci", sha("8")),
      candidateToolchain: artifact("toolchains/candidate.lock", sha("9")),
      independentToolchain: artifact("toolchains/independent.lock", sha("a")),
      candidateSeed: "candidate-seed-001",
      independentSeed: "independent-seed-001",
      pinLedger: artifact("raw/pin-ledger.json", sha("b")),
    },
  };
};

describe("NHM2 independent numerical replication contract", () => {
  it("fails closed as blocked when evidence is missing", () => {
    const artifactValue = buildNhm2IndependentNumericalReplication();

    expect(artifactValue.status).toBe("blocked");
    expect(artifactValue.independentNumericalReplicationReady).toBe(false);
    expect(artifactValue.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_CHECK_IDS,
    );
    expect(artifactValue.claimBoundary.physicalViability).toBe(false);
    expect(artifactValue.claimBoundary.transport).toBe(false);
    expect(artifactValue.claimBoundary.theoryClosureEstablished).toBe(false);
    expect(artifactValue.claimBoundary.empiricalValidationEstablished).toBe(
      false,
    );
    expect(isNhm2IndependentNumericalReplication(artifactValue)).toBe(true);
  });

  it("keeps complete producer-declared comparison metadata diagnostic until server replay", () => {
    const artifactValue =
      buildNhm2IndependentNumericalReplication(completeInput());
    const fieldCheck = artifactValue.checks.find(
      (entry) =>
        entry.checkId === "field_level_outputs_agree_within_frozen_tolerances",
    );

    expect(artifactValue.status).toBe("blocked");
    expect(artifactValue.independentNumericalReplicationReady).toBe(false);
    expect(fieldCheck).toMatchObject({
      status: "blocked",
      metricValue: 0.03,
      tolerance: 0.1,
      unit: "relative_L_inf",
    });
    expect(fieldCheck?.blockers).toEqual(
      expect.arrayContaining([
        ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_SERVER_REPLAY_BLOCKERS,
      ]),
    );
    expect(isNhm2IndependentNumericalReplication(artifactValue)).toBe(true);
  });

  it("ignores a caller-declared replay receipt and cannot self-promote metadata", () => {
    const input = {
      ...completeInput(),
      serverOwnedReplayReceipt: {
        status: "pass",
        primaryComparisonProjectionManifestBound: true,
        independentFieldArrayManifestBound: true,
        recomputedFieldCount:
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length,
      },
    };

    const artifactValue = buildNhm2IndependentNumericalReplication(input);

    expect(artifactValue.status).toBe("blocked");
    expect(artifactValue.independentNumericalReplicationReady).toBe(false);
    expect(artifactValue.blockers).toEqual(
      expect.arrayContaining(
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_SERVER_REPLAY_BLOCKERS.map(
          (blocker) =>
            `field_level_outputs_agree_within_frozen_tolerances:${blocker}`,
        ),
      ),
    );
    expect("serverOwnedReplayReceipt" in artifactValue).toBe(false);
  });

  it("rejects an arbitrary one-field comparison in place of the frozen nine-family ledger", () => {
    const input = completeInput();
    input.comparison.fields = [input.comparison.fields[0]];
    input.comparison.expectedFieldCount = 1;
    input.comparison.comparedFieldCount = 1;
    input.comparison.maximumMetricValue = 0.02;

    const artifactValue = buildNhm2IndependentNumericalReplication(input);
    const check = artifactValue.checks.find(
      (entry) =>
        entry.checkId === "field_level_outputs_agree_within_frozen_tolerances",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toEqual(
      expect.arrayContaining([
        "expected_field_count_not_frozen_required_count",
        "compared_field_count_not_frozen_required_count",
        "frozen_required_field_set_or_order_mismatch",
      ]),
    );
  });

  it("requires typed float64 arrays and non-degenerate diagnostic refinement", () => {
    const input = completeInput();
    input.comparison.fields[0].primaryRawOutput.shape = [1, 10];
    input.comparison.fields[0].primaryRawOutput.sizeBytes = 1;
    input.comparison.fields[0].primaryRawOutput.componentOrder = ["T00"];
    input.comparison.fields[0].diagnosticCoverage.sampleCount = 1;
    input.comparison.fields[0].diagnosticCoverage.refinementLevels = 0;
    input.comparison.fields[0].diagnosticCoverage.observedConvergenceOrder = 0;
    input.comparison.fields[0].diagnosticCoverage.domainCoverageFraction = 0.5;

    const artifactValue = buildNhm2IndependentNumericalReplication(input);
    const check = artifactValue.checks.find(
      (entry) =>
        entry.checkId === "field_level_outputs_agree_within_frozen_tolerances",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("primary_raw_size_bytes_invalid"),
        expect.stringContaining("primary_raw_component_order_invalid"),
        expect.stringContaining("diagnostic_sample_count_below_minimum"),
        expect.stringContaining("diagnostic_refinement_levels_below_minimum"),
        expect.stringContaining("diagnostic_convergence_order_below_minimum"),
        expect.stringContaining("diagnostic_domain_coverage_incomplete"),
      ]),
    );
  });

  it("classifies measured disagreements and replay mismatches as fail, not blocked", () => {
    const input = completeInput();
    input.comparison.fields[0].metricValue = 0.2;
    input.comparison.maximumMetricValue = 0.2;
    input.frozenReplay.replayedMesh.sha256 = sha("0");
    const artifactValue = buildNhm2IndependentNumericalReplication(input);

    expect(artifactValue.status).toBe("fail");
    expect(
      artifactValue.checks.find(
        (entry) =>
          entry.checkId ===
          "field_level_outputs_agree_within_frozen_tolerances",
      )?.status,
    ).toBe("fail");
    expect(
      artifactValue.checks.find(
        (entry) => entry.checkId === "frozen_inputs_mesh_environment_replayed",
      )?.status,
    ).toBe("fail");
  });

  it("requires an authoritative frozen relative-L-infinity tolerance", () => {
    const input = completeInput();
    input.comparison.policy.tolerance = 0.2;
    input.comparison.fields[0].tolerance = 0.2;
    const artifactValue = buildNhm2IndependentNumericalReplication(input);

    const check = artifactValue.checks.find(
      (entry) =>
        entry.checkId === "field_level_outputs_agree_within_frozen_tolerances",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "field_policy_tolerance_not_authoritative",
    );
  });

  it("requires independent IDs, implementation, and independence group", () => {
    const input = completeInput();
    input.identity.independentPlan.requestId =
      input.identity.primaryExecution.requestId;
    input.identity.independentPlan.solver.implementationId =
      input.identity.primaryExecution.implementationId;
    input.identity.independentPlan.solver.independenceGroup =
      input.identity.primaryExecution.independenceGroup;
    const artifactValue = buildNhm2IndependentNumericalReplication(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "independent_solver_and_implementation_used",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain("independent_request_not_distinct");
    expect(check?.blockers).toContain(
      "independent_implementation_not_distinct",
    );
    expect(check?.blockers).toContain(
      "independent_independence_group_not_distinct",
    );
  });

  it.each([
    ["receiptPath", "artifacts/receipts/receipt.json"],
    ["receiptSha256", sha("c")],
    ["outputManifest", { path: "raw/output-manifest.json", sha256: sha("d") }],
    ["outputManifestSha256", sha("e")],
    ["forwardEnvelopeSha256", sha("f")],
  ])("rejects forbidden shadow authority field %s", (field, value) => {
    const artifactValue =
      buildNhm2IndependentNumericalReplication(completeInput());
    const poisoned = structuredClone(artifactValue) as unknown as Record<
      string,
      unknown
    >;
    (poisoned.identity as Record<string, unknown>)[field] = value;

    expect(isNhm2IndependentNumericalReplication(poisoned)).toBe(false);
  });

  it("rejects receipt and output-envelope shadows at nested authority layers", () => {
    const artifactValue =
      buildNhm2IndependentNumericalReplication(completeInput());
    const poisoned = structuredClone(artifactValue) as unknown as {
      identity: { independentPlan: Record<string, unknown> };
      comparison: Record<string, unknown>;
    };
    poisoned.identity.independentPlan.receiptSha256 = sha("a");
    poisoned.comparison.outputManifestSha256 = sha("b");

    expect(isNhm2IndependentNumericalReplication(poisoned)).toBe(false);
  });

  it("rejects caller-tampered derived status", () => {
    const artifactValue =
      buildNhm2IndependentNumericalReplication(completeInput());
    const poisoned = structuredClone(artifactValue);
    poisoned.status = "pass";

    expect(isNhm2IndependentNumericalReplication(poisoned)).toBe(false);
  });

  it("rejects tampering with theory-closure and empirical-validation locks", () => {
    const artifactValue =
      buildNhm2IndependentNumericalReplication(completeInput());
    const closurePoisoned = structuredClone(artifactValue) as unknown as {
      claimBoundary: { theoryClosureEstablished: boolean };
    };
    closurePoisoned.claimBoundary.theoryClosureEstablished = true;
    const empiricalPoisoned = structuredClone(artifactValue) as unknown as {
      claimBoundary: { empiricalValidationEstablished: boolean };
    };
    empiricalPoisoned.claimBoundary.empiricalValidationEstablished = true;

    expect(isNhm2IndependentNumericalReplication(closurePoisoned)).toBe(false);
    expect(isNhm2IndependentNumericalReplication(empiricalPoisoned)).toBe(
      false,
    );
  });
});
