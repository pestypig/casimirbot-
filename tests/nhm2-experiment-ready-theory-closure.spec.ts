import { describe, expect, it } from "vitest";

import {
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS,
  buildNhm2ExperimentReadyTheoryClosure,
  isNhm2ExperimentReadyTheoryClosureArtifact,
  type BuildNhm2ExperimentReadyTheoryClosureInput,
  type Nhm2ExperimentReadyTheoryClosureAssurance,
  type Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1,
  type Nhm2ExperimentReadyTheoryClosureEvidenceId,
  type Nhm2ExperimentReadyTheoryClosureEvidenceV1,
} from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  buildTheoryRuntimeOutputManifestV1,
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeOutputManifestEntryV1,
  type TheoryRuntimeReceiptV1,
} from "../shared/contracts/theory-runtime-receipt.v1";

const GENERATED_AT = "2026-07-19T12:00:00.000Z";
const COMPLETED_AT = "2026-07-19T12:00:01.000Z";
const PRIMARY_GIT_SHA = "a".repeat(40);
const INDEPENDENT_GIT_SHA = "b".repeat(40);
const FORMAL_GIT_SHA = "c".repeat(40);
const CANDIDATE_MANIFEST_SHA256 = "1".repeat(64);
const ATLAS_SHA256 = "2".repeat(64);
const UNITS_SHA256 = "3".repeat(64);
const NORMALIZATION_SHA256 = "4".repeat(64);
const NUMERIC_POLICY_SET_SHA256 = "5".repeat(64);
const NUMERIC_POLICY_SET_SEMANTIC_SHA256 = "9".repeat(64);
const PRIMARY_RECEIPT_PATH =
  "artifacts/research/theory-runtime-receipts/primary/receipt.json";
const PRIMARY_RECEIPT_SHA256 = "6".repeat(64);

const candidate = (): Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1 => ({
  candidateId: "nhm2-alpha07-theory-closure-candidate-v1",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p7000_candidate_v1",
  primaryRunId: "nhm2-theory-primary-run",
  chartId: "nhm2-asymptotic-cartesian-v1",
  unitsRef: "nhm2-si-stress-energy-v1",
  unitsSha256: UNITS_SHA256,
  normalizationRef: "nhm2-full-apparatus-normalization-v1",
  normalizationSha256: NORMALIZATION_SHA256,
  atlasPath: "artifacts/theory-closure/nhm2-theory-primary-run/atlas.json",
  atlasSha256: ATLAS_SHA256,
  candidateManifestPath:
    "artifacts/theory-closure/nhm2-theory-primary-run/candidate-manifest.json",
  candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
  candidateManifestId: "nhm2-alpha07-theory-closure-candidate-manifest-v1",
  candidateManifestContractVersion:
    "nhm2_experiment_ready_theory_candidate_manifest/v1",
  numericPolicySetPath:
    "artifacts/theory-closure/nhm2-theory-primary-run/numeric-policy-set.json",
  numericPolicySetSha256: NUMERIC_POLICY_SET_SHA256,
  numericPolicySetSemanticSha256: NUMERIC_POLICY_SET_SEMANTIC_SHA256,
  primaryGitSha: PRIMARY_GIT_SHA,
  primaryRequestId: "request-receipt-primary",
  primaryRuntimeId: "nhm2.experiment_ready_theory_closure",
  primaryReceiptId: "receipt-primary",
  primaryReceiptPath: PRIMARY_RECEIPT_PATH,
  primaryReceiptSha256: PRIMARY_RECEIPT_SHA256,
});

const assuranceFor = (
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId,
): Nhm2ExperimentReadyTheoryClosureAssurance => {
  if (evidenceId === "independent_numerical_replication") {
    return "independent_computation";
  }
  if (evidenceId === "formal_manifest_certificate") return "formal_proof";
  if (evidenceId === "prediction_falsifier_freeze") return "frozen_prediction";
  return "computed";
};

const receiptIdentityFor = (
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId,
) => {
  if (evidenceId === "independent_numerical_replication") {
    return {
      receiptId: "receipt-independent",
      receiptPath:
        "artifacts/research/theory-runtime-receipts/independent/receipt.json",
      receiptSha256: "7".repeat(64),
      runId: "nhm2-theory-independent-run",
      gitSha: INDEPENDENT_GIT_SHA,
      implementationId: "independent-solver-implementation",
      independenceGroup: "independent-numerical-group",
    };
  }
  if (evidenceId === "formal_manifest_certificate") {
    return {
      receiptId: "receipt-formal",
      receiptPath:
        "artifacts/research/theory-runtime-receipts/formal/receipt.json",
      receiptSha256: "8".repeat(64),
      runId: "nhm2-theory-formal-run",
      gitSha: FORMAL_GIT_SHA,
      implementationId: "lean-independent-kernel",
      independenceGroup: "formal-kernel-group",
    };
  }
  return {
    receiptId: "receipt-primary",
    receiptPath: PRIMARY_RECEIPT_PATH,
    receiptSha256: PRIMARY_RECEIPT_SHA256,
    runId: "nhm2-theory-primary-run",
    gitSha: PRIMARY_GIT_SHA,
    implementationId: "primary-multiphysics-implementation",
    independenceGroup: "primary-numerical-group",
  };
};

const evidenceFixture = (
  identity: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1,
): Nhm2ExperimentReadyTheoryClosureEvidenceV1[] =>
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS.map((evidenceId, index) => {
    const receiptIdentity = receiptIdentityFor(evidenceId);
    const artifactPath = `artifacts/theory-closure/${receiptIdentity.runId}/${evidenceId}.json`;
    return {
      evidenceId,
      artifactContractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
          evidenceId
        ],
      artifactPath,
      sha256: ((index + 3) % 10).toString().repeat(64),
      receiptId: receiptIdentity.receiptId,
      receiptPath: receiptIdentity.receiptPath,
      receiptSha256: receiptIdentity.receiptSha256,
      candidateId: identity.candidateId,
      candidateManifestSha256: identity.candidateManifestSha256,
      runId: receiptIdentity.runId,
      selectedProfileId: identity.selectedProfileId,
      chartId: identity.chartId,
      unitsRef: identity.unitsRef,
      unitsSha256: identity.unitsSha256,
      normalizationRef: identity.normalizationRef,
      normalizationSha256: identity.normalizationSha256,
      atlasSha256: identity.atlasSha256,
      gitSha: receiptIdentity.gitSha,
      producerId: `producer:${evidenceId}`,
      implementationId: receiptIdentity.implementationId,
      independenceGroup: receiptIdentity.independenceGroup,
      assurance: assuranceFor(evidenceId),
      schemaValidated: true,
      assertionOnly: false,
      proxy: false,
      metricEcho: false,
      verdict: "pass",
      checks: Object.fromEntries(
        NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS[evidenceId].map(
          (checkId) => {
            const numericPolicy = (
              NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES as Record<
                string,
                "lt" | "lte" | "gt" | "gte" | undefined
              >
            )[checkId];
            return [
              checkId,
              {
                pass: true,
                method: `computed:${evidenceId}:${checkId}`,
                evidenceRef: `${artifactPath}#/checks/${checkId}`,
                frozenPolicyId: `${evidenceId}.${checkId}`,
                policyManifestSha256: identity.candidateManifestSha256,
                frozenPolicySha256: ((index + 6) % 10).toString().repeat(64),
                policySetSemanticSha256:
                  identity.numericPolicySetSemanticSha256,
                metricValue:
                  numericPolicy == null
                    ? null
                    : numericPolicy === "lt" || numericPolicy === "lte"
                      ? 0.5
                      : 2,
                tolerance: numericPolicy == null ? null : 1,
                units: numericPolicy == null ? null : "1",
              },
            ];
          },
        ),
      ),
      blockers: [],
    };
  });

const buildReceipt = (input: {
  identity: Nhm2ExperimentReadyTheoryClosureCandidateIdentityV1;
  receiptId: string;
  runId: string;
  gitSha: string;
  entries: TheoryRuntimeOutputManifestEntryV1[];
}): TheoryRuntimeReceiptV1 => {
  const outputDirectory = `artifacts/theory-closure/${input.runId}`;
  const manifest = buildTheoryRuntimeOutputManifestV1({
    generatedAt: COMPLETED_AT,
    requestId: `request-${input.receiptId}`,
    runtimeId: "nhm2.experiment_ready_theory_closure",
    gitSha: input.gitSha,
    startedAt: GENERATED_AT,
    completedAt: COMPLETED_AT,
    outputDirectory,
    boundToExecution: true,
    manifestPath: `${outputDirectory}/theory-runtime-output-manifest.json`,
    manifestSha256: input.gitSha[0].repeat(64),
    entries: input.entries,
    freshnessProof: {
      schemaVersion: "theory_runtime_freshness_snapshot/v1",
      algorithm: "sha256_size_pre_post/v1",
      beforeCapturedAt: GENERATED_AT,
      afterCapturedAt: COMPLETED_AT,
      beforeCommitmentPath:
        "artifacts/research/theory-runtime-pre-spawn-snapshots/test.json",
      beforeCommitmentSha256: "f".repeat(64),
      beforeSnapshotSha256: "d".repeat(64),
      afterSnapshotSha256: "e".repeat(64),
      beforeEntries: [],
    },
  });
  return buildTheoryRuntimeReceiptV1({
    generatedAt: COMPLETED_AT,
    receiptId: input.receiptId,
    runtimeId: "nhm2.experiment_ready_theory_closure",
    graphId: "theory-graph.nhm2.experiment-ready-theory-closure",
    badgeIds: ["nhm2.experiment_ready_theory_closure"],
    command: "tsx",
    args: {
      requestId: `request-${input.receiptId}`,
      candidateId: input.identity.candidateId,
      selectedProfileId: input.identity.selectedProfileId,
      chartId: input.identity.chartId,
      runId: input.runId,
      candidateManifestSha256: input.identity.candidateManifestSha256,
      atlasSha256: input.identity.atlasSha256,
    },
    status: "completed",
    outputs: {
      artifacts: input.entries.map((entry) => entry.path),
      scalars: {},
      units: {},
      gates: { runtime_artifact_freshness: "pass" },
      missingSignals: [],
      warnings: [],
      artifactManifest: manifest,
    },
    provenance: {
      gitSha: input.gitSha,
      startedAt: GENERATED_AT,
      completedAt: COMPLETED_AT,
      durationMs: 1_000,
    },
    execution: {
      command: "tsx",
      args: ["tools/nhm2/build-experiment-ready-theory-closure.ts"],
      cwd: "C:/repo/CasimirBot",
      environment: {
        THEORY_RUNTIME_REQUEST_ID: `request-${input.receiptId}`,
        THEORY_RUNTIME_RECEIPT_ID: input.receiptId,
        THEORY_RUNTIME_ID: "nhm2.experiment_ready_theory_closure",
        NHM2_RUN_ID: input.runId,
        NHM2_CANDIDATE_ID: input.identity.candidateId,
        NHM2_SELECTED_PROFILE_ID: input.identity.selectedProfileId,
        NHM2_CHART_ID: input.identity.chartId,
        NHM2_CANDIDATE_MANIFEST_SHA256: input.identity.candidateManifestSha256,
        NHM2_ATLAS_SHA256: input.identity.atlasSha256,
        NHM2_UNITS_SHA256: input.identity.unitsSha256,
        NHM2_NORMALIZATION_SHA256: input.identity.normalizationSha256,
      },
      outputDirectory,
      outputDirectoryBound: true,
      exitCode: 0,
      stdout: "PASS\n",
      stderr: "",
      timedOut: false,
      error: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy: ["empirical_receipts_missing"],
    },
  });
};

const entryForEvidence = (
  evidence: Nhm2ExperimentReadyTheoryClosureEvidenceV1,
): TheoryRuntimeOutputManifestEntryV1 => ({
  path: evidence.artifactPath,
  sha256: evidence.sha256,
  sizeBytes: 1_024,
  modifiedAt: COMPLETED_AT,
  freshness: "new",
});

const allPassInput = (): BuildNhm2ExperimentReadyTheoryClosureInput => {
  const identity = candidate();
  const evidence = evidenceFixture(identity);
  const primaryEntries = [
    ...evidence
      .filter((entry) => entry.receiptId === "receipt-primary")
      .map(entryForEvidence),
  ];
  const independentEntries = evidence
    .filter((entry) => entry.receiptId === "receipt-independent")
    .map(entryForEvidence);
  const formalEntries = evidence
    .filter((entry) => entry.receiptId === "receipt-formal")
    .map(entryForEvidence);
  return {
    generatedAt: GENERATED_AT,
    candidate: identity,
    evidence,
    runtimeReceipts: [
      buildReceipt({
        identity,
        receiptId: "receipt-primary",
        runId: identity.primaryRunId,
        gitSha: PRIMARY_GIT_SHA,
        entries: primaryEntries,
      }),
      buildReceipt({
        identity,
        receiptId: "receipt-independent",
        runId: "nhm2-theory-independent-run",
        gitSha: INDEPENDENT_GIT_SHA,
        entries: independentEntries,
      }),
      buildReceipt({
        identity,
        receiptId: "receipt-formal",
        runId: "nhm2-theory-formal-run",
        gitSha: FORMAL_GIT_SHA,
        entries: formalEntries,
      }),
    ],
  };
};

const evidenceById = (
  input: BuildNhm2ExperimentReadyTheoryClosureInput,
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId,
): Nhm2ExperimentReadyTheoryClosureEvidenceV1 =>
  input.evidence!.find((entry) => entry.evidenceId === evidenceId)!;

describe("NHM2 experiment-ready theory-closure contract", () => {
  it("requires only outer-observation v2 formal evidence and check IDs", () => {
    expect(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS.formal_manifest_certificate,
    ).toBe("nhm2_formal_manifest_certificate/v2");
    expect(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.formal_manifest_certificate,
    ).toEqual([...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS]);
    expect(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.formal_manifest_certificate,
    ).not.toEqual([
      ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS,
    ]);
  });

  it("keeps even a structurally complete package provisional until filesystem replay", () => {
    const artifact = buildNhm2ExperimentReadyTheoryClosure(allPassInput());

    expect(isNhm2ExperimentReadyTheoryClosureArtifact(artifact)).toBe(true);
    expect(artifact.status).toBe("not_ready");
    expect(artifact.verdictLabel).toBe("NOT_READY");
    expect(artifact.evaluationAuthority).toBe(
      "filesystem_replay_evaluator_required",
    );
    expect(artifact.gates.map((entry) => entry.gateId)).toEqual([
      ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_GATE_IDS,
    ]);
    expect(artifact.gates.every((entry) => entry.status === "pass")).toBe(true);
    expect(artifact.summary).toMatchObject({
      experimentReadyTheoryClosed: false,
      filesystemVerificationRequired: true,
      allEvidenceRunBoundFreshAndHashed: true,
      firstBlocker: "filesystem_replay_evaluation_required",
      empiricalStatus: "blocked_pending_empirical_receipts",
    });
    expect(artifact.claimBoundary).toMatchObject({
      experimentReadyTheoryClosureClaimAllowed: false,
      theoryClosureIsNotPhysicalValidation: true,
      physicalViabilityStatus: "blocked_pending_empirical_receipts",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
  });

  it("rejects artifact-name and pass-string spoofing without typed checks and receipts", () => {
    const input = allPassInput();
    input.runtimeReceipts = [];
    const source = evidenceById(
      input,
      "full_apparatus_source_tensor",
    ) as Nhm2ExperimentReadyTheoryClosureEvidenceV1 & { status?: string };
    source.status = "pass";
    source.checks = {};

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(artifact.summary.allEvidenceRunBoundFreshAndHashed).toBe(false);
    expect(
      artifact.gates.find(
        (entry) => entry.gateId === "same_chart_full_source_tensor",
      )?.blockers,
    ).toContain(
      "full_apparatus_source_tensor:required_check_missing:all_ten_components_computed",
    );
  });

  it("keeps a historical preexisting package at not-ready", () => {
    const input = allPassInput();
    const primary = input.runtimeReceipts!.find(
      (entry) => entry.receiptId === "receipt-primary",
    )!;
    primary.outputs.artifactManifest!.entries.forEach((entry) => {
      entry.freshness = "preexisting";
    });

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(artifact.summary.firstBlocker).toContain("runtime_artifact_not_new");
    expect(
      artifact.claimBoundary.historicalOrPreexistingArtifactsCannotQualify,
    ).toBe(true);
  });

  it.each([
    [
      "assertion-only stability",
      (input: BuildNhm2ExperimentReadyTheoryClosureInput) => {
        evidenceById(
          input,
          "dynamic_backreaction_stability_causality",
        ).assertionOnly = true;
      },
      "dynamic_backreaction_stability_causality:assertion_only_evidence_forbidden",
    ],
    [
      "missing continuous optimizer",
      (input: BuildNhm2ExperimentReadyTheoryClosureInput) => {
        delete evidenceById(input, "continuous_observer_optimizer").checks
          .unit_timelike_hyperboloid_continuously_optimized;
      },
      "continuous_observer_optimizer:required_check_missing:unit_timelike_hyperboloid_continuously_optimized",
    ],
    [
      "metric target echo",
      (input: BuildNhm2ExperimentReadyTheoryClosureInput) => {
        evidenceById(input, "full_apparatus_source_tensor").metricEcho = true;
      },
      "full_apparatus_source_tensor:metric_echo_forbidden",
    ],
    [
      "chart mismatch",
      (input: BuildNhm2ExperimentReadyTheoryClosureInput) => {
        evidenceById(input, "covariant_conservation").chartId =
          "different-chart";
      },
      "covariant_conservation:chart_id_mismatch",
    ],
    [
      "incomplete falsifier freeze",
      (input: BuildNhm2ExperimentReadyTheoryClosureInput) => {
        delete evidenceById(input, "prediction_falsifier_freeze").checks
          .falsifiers_and_retirement_rules_frozen;
      },
      "prediction_falsifier_freeze:required_check_missing:falsifiers_and_retirement_rules_frozen",
    ],
  ])("blocks %s", (_label, mutate, expectedBlocker) => {
    const input = allPassInput();
    mutate(input);

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(artifact.gates.flatMap((entry) => entry.blockers)).toContain(
      expectedBlocker,
    );
  });

  it("records a provisional failed support-retention gate without self-certifying falsification", () => {
    const input = allPassInput();
    const mechanics = evidenceById(input, "mechanical_support_control_margin");
    mechanics.verdict = "fail";
    mechanics.checks.support_retention_overlap_lower95_gt_one.pass = false;
    mechanics.checks.support_retention_overlap_lower95_gt_one.metricValue = 0.459;
    mechanics.checks.support_retention_overlap_lower95_gt_one.tolerance = 1;

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(artifact.verdictLabel).toBe("NOT_READY");
    expect(
      artifact.gates.find(
        (entry) => entry.gateId === "mechanical_control_energy_margin",
      ),
    ).toMatchObject({
      status: "fail",
      failedCheckIds: [
        "mechanical_support_control_margin:support_retention_overlap_lower95_gt_one",
      ],
    });
    expect(artifact.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("does not accept a Boolean pass for a required numeric check", () => {
    const input = allPassInput();
    const mechanics = evidenceById(input, "mechanical_support_control_margin");
    mechanics.checks.support_retention_overlap_lower95_gt_one.metricValue =
      null;
    mechanics.checks.support_retention_overlap_lower95_gt_one.tolerance = null;

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(
      artifact.gates.find(
        (entry) => entry.gateId === "mechanical_control_energy_margin",
      )?.blockers,
    ).toContain(
      "mechanical_support_control_margin:required_check_missing:support_retention_overlap_lower95_gt_one:numeric_metric_tolerance_or_units",
    );
  });

  it("requires independent numerical and formal execution identities", () => {
    const input = allPassInput();
    const primary = evidenceById(input, "full_apparatus_source_tensor");
    const independent = evidenceById(
      input,
      "independent_numerical_replication",
    );
    independent.implementationId = primary.implementationId;
    independent.independenceGroup = primary.independenceGroup;

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);
    const replication = artifact.gates.find(
      (entry) => entry.gateId === "independent_numerical_formal_replication",
    );

    expect(artifact.status).toBe("not_ready");
    expect(replication?.blockers).toEqual(
      expect.arrayContaining([
        "independent_replication_implementation_not_distinct",
        "independent_replication_group_not_distinct",
      ]),
    );
  });

  it("treats an unavailable formal replay as not-ready, never as falsification", () => {
    const input = allPassInput();
    const formal = evidenceById(input, "formal_manifest_certificate");
    formal.verdict = "fail";
    formal.checks.two_distinct_cold_replays_exact.pass = false;

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);
    const replication = artifact.gates.find(
      (entry) => entry.gateId === "independent_numerical_formal_replication",
    );

    expect(replication?.status).toBe("blocked");
    expect(replication?.failedCheckIds).toEqual([]);
    expect(replication?.blockers).toEqual(
      expect.arrayContaining([
        "formal_manifest_certificate:formal_replay_not_ready",
        "formal_manifest_certificate:formal_replay_not_ready:two_distinct_cold_replays_exact",
      ]),
    );
  });

  it("blocks an evidence role whose contract version is merely self-declared", () => {
    const input = allPassInput();
    evidenceById(input, "semiclassical_state").artifactContractVersion =
      "semiclassical_state/pass/v999";

    const artifact = buildNhm2ExperimentReadyTheoryClosure(input);

    expect(artifact.status).toBe("not_ready");
    expect(artifact.gates[0].blockers).toContain(
      "semiclassical_state:artifact_contract_version_mismatch",
    );
  });

  it("rejects shadow authority fields even when the canonical claim boundary is locked", () => {
    const artifact = buildNhm2ExperimentReadyTheoryClosure(allPassInput());
    const shadowed = {
      ...artifact,
      physicalViabilityClaimAllowed: true,
    };

    expect(isNhm2ExperimentReadyTheoryClosureArtifact(shadowed)).toBe(false);
  });

  it("rejects derived-status tampering", () => {
    const artifact = buildNhm2ExperimentReadyTheoryClosure(allPassInput());
    const tampered = structuredClone(artifact);
    tampered.status = "experiment_ready_theory_closed";

    expect(isNhm2ExperimentReadyTheoryClosureArtifact(tampered)).toBe(false);
  });
});
