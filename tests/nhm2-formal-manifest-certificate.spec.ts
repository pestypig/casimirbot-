import { describe, expect, it } from "vitest";
import {
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-formal-kernel-replay-manifest.v1";
import {
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_IDS,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_SCOPE,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_EVIDENCE_SCOPE,
  buildNhm2FormalManifestCertificate,
  isNhm2FormalManifestCertificate,
} from "../shared/contracts/nhm2-formal-manifest-certificate.v1";
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

const completeInput = () => {
  const candidateId = "candidate-alpha-0.7";
  const profileId = "profile-alpha-0.7";
  const chartId = "nhm2-cartesian";
  const requestId = "request-formal-001";
  const runId = "run-formal-001";
  const runtimeId = "nhm2-formal-runtime";
  const receiptId = nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
    runtimeId,
    requestId,
  );
  const outputDirectory = "artifacts/research/nhm2-formal/run-001";
  const candidateManifestSha = sha("1");
  const policySemanticSha = sha("2");
  const atlasSha = sha("3");
  const unitsSha = sha("4");
  const normalizationSha = sha("5");
  const proofSha = sha("6");
  const sourceEntries = [
    {
      sourceId: "candidate-manifest",
      path: "artifacts/research/candidates/alpha-0.7.v1.json",
      sha256: candidateManifestSha,
      expectedSha256: candidateManifestSha,
      recomputedSha256: candidateManifestSha,
    },
    {
      sourceId: "numeric-policy",
      path: "artifacts/research/policies/nhm2-numeric.v1.json",
      sha256: sha("7"),
      expectedSha256: sha("7"),
      recomputedSha256: sha("7"),
    },
  ];
  return {
    generatedAt: "2026-07-19T12:00:00.000Z",
    identity: {
      candidateId,
      candidateManifestId: "manifest-alpha-0.7-v1",
      candidateManifest: binding(
        "nhm2.experiment_ready_theory_candidate_manifest",
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
        "artifacts/research/candidates/alpha-0.7.v1.json",
        candidateManifestSha,
      ),
      numericPolicySet: {
        ...artifact(
          "artifacts/research/policies/nhm2-numeric.v1.json",
          sha("7"),
        ),
        policySetId: "nhm2-authoritative-v1",
        semanticSha256: policySemanticSha,
      },
      laneId: "nhm2_shift_lapse" as const,
      profile: {
        ...binding(
          "nhm2.profile",
          "nhm2_profile/v1",
          "inputs/profile.v1.json",
          sha("8"),
        ),
        selectedProfileId: profileId,
      },
      chart: {
        ...binding(
          "nhm2.chart",
          "nhm2_chart/v1",
          "inputs/chart.v1.json",
          sha("9"),
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
      priorExecutions: {
        primaryNumerical: {
          requestId: "request-primary-001",
          runId: "run-primary-001",
          receiptId: "runtime:primary:request:receipt-primary-001",
          runtimeId: "nhm2-primary-runtime",
          implementationId: "primary-implementation",
          independenceGroup: "primary-team-and-codebase",
        },
        independentNumerical: {
          requestId: "request-independent-001",
          runId: "run-independent-001",
          receiptId: "runtime:independent:request:receipt-independent-001",
          runtimeId: "nhm2-independent-runtime",
          implementationId: "independent-implementation",
          independenceGroup: "independent-team-and-codebase",
        },
      },
      formalPlan: {
        planRole: "formal_kernel" as const,
        requestId,
        runId,
        receiptId,
        runtimeId,
        sourceCommitSha: git("b"),
        deterministicSeed: "formal-replay-seed-001",
        solver: {
          ...binding(
            "nhm2.formal_kernel",
            "nhm2_formal_kernel/v1",
            "formal/kernel.bin",
            sha("a"),
          ),
          solverId: "lean-kernel",
          solverVersion: "4.21.0",
          implementationId: "formal-kernel-replay-implementation",
          independenceGroup: "formal-kernel-independent-team",
        },
        environmentLock: {
          ...binding(
            "nhm2.formal_environment",
            "nhm2_environment_lock/v1",
            "formal/environment.lock",
            sha("b"),
          ),
          environmentId: "formal-environment-v1",
        },
        expectedInvocation: {
          entrypoint: "nhm2-formal-kernel-replay",
          command: "lake",
          args: ["env", "lean", "Formal/Nhm2Candidate.lean"],
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
    manifestMerkleCommitment: {
      algorithm: "sha256_binary_merkle_v1" as const,
      leafOrdering: "utf8_path_ascending" as const,
      pinnedMerkleRoot: sha("c"),
      recomputedMerkleRoot: sha("c"),
      leafCount: sourceEntries.length,
      leafLedger: artifact("formal/merkle-leaves.json", sha("d")),
      recomputationTranscript: artifact("formal/merkle-replay.json", sha("e")),
    },
    sourceHashRecomputation: {
      sources: sourceEntries,
      expectedSourceCount: sourceEntries.length,
      recomputedSourceCount: sourceEntries.length,
      mismatchCount: 0,
      expectedHashLedger: artifact("formal/expected-hashes.json", sha("f")),
      recomputedHashLedger: artifact("formal/recomputed-hashes.json", sha("0")),
      recomputationTranscript: artifact("formal/hash-replay.json", sha("1")),
    },
    formalKernelReplay: {
      manifest: binding(
        NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID,
        NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
        "formal/nhm2-formal-kernel-replay-manifest.v1.json",
        sha("a"),
      ),
      preRunSourceLedger: artifact("formal/merkle-leaves.json", sha("d")),
      preRunSourceArtifacts: sourceEntries.map((entry) => ({
        path: entry.path,
        sha256: entry.sha256,
      })),
      kernelBinary: artifact("formal/kernel.bin", sha("a")),
      theoremReplayLedger: artifact(
        "formal/theorem-replay-ledger.json",
        sha("b"),
      ),
      usedAxiomLedger: artifact("formal/used-axioms.json", sha("c")),
      usedAssumptionLedger: artifact("formal/assumption-ledger.json", sha("7")),
      aggregateReplayTranscript: artifact("formal/kernel-replay.log", sha("5")),
      claimLockProof: artifact("formal/claim-lock-proof.bin", proofSha),
      claimLockTranscript: artifact("formal/claim-lock-replay.log", sha("9")),
    },
    theoremScope: {
      candidateContractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
      candidateManifestId: "manifest-alpha-0.7-v1",
      candidateManifestSha256: candidateManifestSha,
      numericPolicySetSemanticSha256: policySemanticSha,
      evidenceContracts:
        NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_EVIDENCE_SCOPE.map(
          (entry) => ({ ...entry }),
        ),
      requiredChecks: [
        ...NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_SCOPE,
      ],
      scopeManifest: artifact("formal/theorem-scope.json", sha("2")),
      theoremSource: artifact("formal/Nhm2Candidate.lean", sha("3")),
    },
    kernelReplay: {
      replayMode: "cold_trusted_kernel" as const,
      kernelId: "lean-kernel",
      kernelVersion: "4.21.0",
      kernelBinary: artifact("formal/kernel.bin", sha("a")),
      theoremBundle: artifact("formal/theorem-bundle.olean", sha("4")),
      proofTerm: artifact("formal/claim-lock-proof.bin", proofSha),
      replayTranscript: artifact("formal/kernel-replay.log", sha("5")),
      expectedTheoremCount: 8,
      replayedTheoremCount: 8,
      exitCode: 0,
    },
    assumptions: {
      entries: [
        {
          assumptionId: "candidate-manifest-hash",
          kind: "typed_hypothesis" as const,
          valueType: "artifact_hash" as const,
          scopeRef: "candidate:manifest-alpha-0.7-v1",
          typeStatement: "candidateManifestSha256 : SHA256",
          evidence: artifact(
            "formal/assumptions/candidate-hash.json",
            sha("6"),
          ),
        },
      ],
      unscopedAssumptionCount: 0,
      unscopedBooleanCount: 0,
      assumptionLedger: artifact("formal/assumption-ledger.json", sha("7")),
      booleanScanReport: artifact("formal/boolean-scan.json", sha("8")),
    },
    claimLockTheorem: {
      theoremId: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
      proposition: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
      proofTerm: artifact("formal/claim-lock-proof.bin", proofSha),
      replayTranscript: artifact("formal/claim-lock-replay.log", sha("9")),
      kernelResult: "proved" as const,
      physicalViabilityStatus: "blocked_pending_empirical_receipts" as const,
      physicalViabilityClaimAllowed: false as const,
      transportClaimAllowed: false as const,
      propulsionClaimAllowed: false as const,
      routeEtaClaimAllowed: false as const,
      speedAuthorityClaimAllowed: false as const,
      empiricalReceiptsRequired: true as const,
    },
  };
};

describe("NHM2 formal manifest certificate contract", () => {
  it("fails closed as blocked when proof evidence is absent", () => {
    const artifactValue = buildNhm2FormalManifestCertificate();

    expect(artifactValue.status).toBe("blocked");
    expect(artifactValue.formalManifestCertificateReady).toBe(false);
    expect(artifactValue.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_IDS,
    );
    expect(artifactValue.claimBoundary.physicalViability).toBe(false);
    expect(artifactValue.claimBoundary.propulsion).toBe(false);
    expect(isNhm2FormalManifestCertificate(artifactValue)).toBe(true);
  });

  it("accepts an exact internally consistent trusted-kernel replay artifact", () => {
    const artifactValue = buildNhm2FormalManifestCertificate(completeInput());

    expect(artifactValue.status).toBe("pass");
    expect(artifactValue.formalManifestCertificateReady).toBe(true);
    expect(artifactValue.checks.every((entry) => entry.status === "pass")).toBe(
      true,
    );
    expect(artifactValue.claimLockTheorem.physicalViabilityClaimAllowed).toBe(
      false,
    );
    expect(artifactValue.claimLockTheorem.transportClaimAllowed).toBe(false);
    expect(artifactValue.claimLockTheorem.empiricalReceiptsRequired).toBe(true);
    expect(isNhm2FormalManifestCertificate(artifactValue)).toBe(true);
  });

  it("fails on source-hash and Merkle-root mismatches", () => {
    const input = completeInput();
    input.manifestMerkleCommitment.recomputedMerkleRoot = sha("0");
    input.sourceHashRecomputation.sources[0].recomputedSha256 = sha("f");
    input.sourceHashRecomputation.mismatchCount = 1;
    const artifactValue = buildNhm2FormalManifestCertificate(input);

    expect(artifactValue.status).toBe("fail");
    expect(
      artifactValue.checks.find(
        (entry) => entry.checkId === "candidate_manifest_merkle_root_pinned",
      )?.blockers,
    ).toContain("candidate_manifest_merkle_root_mismatch");
    expect(
      artifactValue.checks.find(
        (entry) => entry.checkId === "source_artifact_hashes_recomputed",
      )?.blockers,
    ).toContain("source_hash_mismatch_present");
  });

  it("requires the exact structured replay-manifest contract and planned kernel", () => {
    const input = completeInput();
    input.formalKernelReplay.manifest.contractVersion =
      "nhm2_formal_kernel_replay_manifest/v2";
    input.formalKernelReplay.kernelBinary.sha256 = sha("f");
    const artifactValue = buildNhm2FormalManifestCertificate(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "independent_kernel_replay_pass",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "formal_kernel_replay_manifest_contract_mismatch",
    );
    expect(check?.blockers).toContain(
      "formal_replay_kernel_binary_not_exactly_planned",
    );
  });

  it("requires a discoverable exact path and sha256 for every pre-run source", () => {
    const input = completeInput();
    input.formalKernelReplay.preRunSourceArtifacts[0].sha256 = sha("f");
    const artifactValue = buildNhm2FormalManifestCertificate(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "source_artifact_hashes_recomputed",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "formal_replay_pre_run_source_artifacts_not_exact",
    );
  });

  it("requires theorem scope to exactly cover the candidate contract", () => {
    const input = completeInput();
    input.theoremScope.requiredChecks.pop();
    input.theoremScope.evidenceContracts.pop();
    const artifactValue = buildNhm2FormalManifestCertificate(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "theorem_scope_matches_candidate_contract",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "theorem_evidence_contract_scope_not_exact",
    );
    expect(check?.blockers).toContain("theorem_required_check_scope_not_exact");
  });

  it("fails an unscoped Boolean assumption report", () => {
    const input = completeInput();
    input.assumptions.unscopedBooleanCount = 1;
    const artifactValue = buildNhm2FormalManifestCertificate(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "no_unscoped_assumption_booleans",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain("unscoped_assumption_booleans_present");
  });

  it("requires a kernel plan independent of both numerical executions", () => {
    const input = completeInput();
    input.identity.formalPlan.solver.independenceGroup =
      input.identity.priorExecutions.independentNumerical.independenceGroup;
    const artifactValue = buildNhm2FormalManifestCertificate(input);
    const check = artifactValue.checks.find(
      (entry) => entry.checkId === "independent_kernel_replay_pass",
    );

    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "formal_independence_group_not_distinct_from_independent",
    );
  });

  it.each([
    ["receiptPath", "artifacts/receipts/receipt.json"],
    ["receiptSha256", sha("a")],
    [
      "outputManifest",
      { path: "formal/output-manifest.json", sha256: sha("b") },
    ],
    ["outputManifestSha256", sha("c")],
    ["forwardEnvelopeSha256", sha("d")],
  ])("rejects forbidden shadow authority field %s", (field, value) => {
    const artifactValue = buildNhm2FormalManifestCertificate(completeInput());
    const poisoned = structuredClone(artifactValue) as unknown as Record<
      string,
      unknown
    >;
    (poisoned.identity as Record<string, unknown>)[field] = value;

    expect(isNhm2FormalManifestCertificate(poisoned)).toBe(false);
  });

  it("rejects receipt and output-envelope shadows at nested authority layers", () => {
    const artifactValue = buildNhm2FormalManifestCertificate(completeInput());
    const poisoned = structuredClone(artifactValue) as unknown as {
      identity: { formalPlan: Record<string, unknown> };
      kernelReplay: Record<string, unknown>;
    };
    poisoned.identity.formalPlan.receiptPath = "artifacts/receipts/formal.json";
    poisoned.kernelReplay.outputManifestSha256 = sha("e");

    expect(isNhm2FormalManifestCertificate(poisoned)).toBe(false);
  });

  it("rejects caller-tampered theorem results and status", () => {
    const artifactValue = buildNhm2FormalManifestCertificate(completeInput());
    const poisoned = structuredClone(artifactValue);
    poisoned.status = "blocked";
    poisoned.checks[0].status = "blocked";

    expect(isNhm2FormalManifestCertificate(poisoned)).toBe(false);
  });
});
