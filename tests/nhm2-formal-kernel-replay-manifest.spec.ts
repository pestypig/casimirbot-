import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING,
  NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING,
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
  NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM,
  NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING,
  NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
  canonicalNhm2FormalKernelReplayJson,
  computeNhm2FormalKernelReplaySourceMerkleRoot,
  isNhm2FormalKernelReplayManifest,
  nhm2FormalKernelReplayAssumptionLedgerValue,
  nhm2FormalKernelReplayAxiomLedgerValue,
  nhm2FormalKernelReplayManifestBlockers,
  nhm2FormalKernelReplaySourceLedgerValue,
  nhm2FormalKernelReplayTheoremLedgerValue,
  sha256Nhm2FormalKernelReplayUtf8,
  verifyNhm2FormalKernelReplayManifest,
  type Nhm2FormalKernelReplayArtifactRefV1,
  type Nhm2FormalKernelReplayExpectedBindingsV1,
  type Nhm2FormalKernelReplayManifestV1,
} from "../shared/contracts/nhm2-formal-kernel-replay-manifest.v1";

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

type Fixture = {
  manifest: Nhm2FormalKernelReplayManifestV1;
  expected: Nhm2FormalKernelReplayExpectedBindingsV1;
  files: Map<string, Buffer>;
};

const completeFixture = (): Fixture => {
  const files = new Map<string, Buffer>();
  const addFile = (
    path: string,
    contents: Uint8Array | string,
  ): Nhm2FormalKernelReplayArtifactRefV1 => {
    const bytes =
      typeof contents === "string"
        ? Buffer.from(contents, "utf8")
        : Buffer.from(contents);
    files.set(path, bytes);
    return { path, sha256: sha256(bytes) };
  };

  const candidateManifest = addFile(
    "inputs/candidate-manifest.v1.json",
    '{"candidateId":"candidate-alpha-0.7"}',
  );
  const environmentLock = addFile(
    "toolchain/lake-manifest.json",
    '{"lean":"4.21.0","packages":[]}',
  );
  const theoremSource = addFile(
    "formal/Nhm2Candidate.lean",
    "theorem candidate_scope_replay : True := by trivial\n",
  );
  const kernelBinary = addFile(
    "toolchain/bin/lean",
    Buffer.from("pinned-lean-kernel-binary", "utf8"),
  );
  const preRunSources = [
    candidateManifest,
    environmentLock,
    theoremSource,
    kernelBinary,
  ].sort((left, right) => utf8Compare(left.path, right.path));

  const candidateProof = addFile(
    "outputs/proofs/candidate_scope_replay.bin",
    "candidate-scope-proof-term",
  );
  const candidateTranscript = addFile(
    "outputs/transcripts/candidate_scope_replay.log",
    "candidate_scope_replay: proved\n",
  );
  const lockProof = addFile(
    "outputs/proofs/nhm2_pre_experimental_claim_locks.bin",
    "pre-experimental-claim-lock-proof-term",
  );
  const lockTranscript = addFile(
    "outputs/transcripts/nhm2_pre_experimental_claim_locks.log",
    "nhm2_pre_experimental_claim_locks: proved\n",
  );
  const aggregateTranscript = addFile(
    "outputs/transcripts/kernel-replay.log",
    "candidate_scope_replay: proved\nnhm2_pre_experimental_claim_locks: proved\nexit: 0\n",
  );

  const candidateProposition =
    "candidate_manifest_sha256_is_bound /\\ evidence_scope_is_exact";
  const theoremEntries = [
    {
      theoremId: "candidate_scope_replay",
      proposition: candidateProposition,
      propositionSha256: sha256Nhm2FormalKernelReplayUtf8(candidateProposition),
      proofArtifact: candidateProof,
      transcriptArtifact: candidateTranscript,
      usedAxiomIds: ["Lean.ofReduceBool"],
      usedAssumptionIds: ["candidate_manifest_hash"],
      replayResult: "proved" as const,
    },
    {
      theoremId: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
      proposition: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
      propositionSha256: sha256Nhm2FormalKernelReplayUtf8(
        NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
      ),
      proofArtifact: lockProof,
      transcriptArtifact: lockTranscript,
      usedAxiomIds: ["Lean.ofReduceBool"],
      usedAssumptionIds: [],
      replayResult: "proved" as const,
    },
  ];
  const axiomType = "Lean.ofReduceBool : reduceBool p = true -> p";
  const usedAxioms = [
    {
      axiomId: "Lean.ofReduceBool",
      typeStatement: axiomType,
      typeStatementSha256: sha256Nhm2FormalKernelReplayUtf8(axiomType),
      usedByTheoremIds: [
        "candidate_scope_replay",
        NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
      ],
    },
  ];
  const assumptionType =
    "candidateManifestSha256 : SHA256 inputs/candidate-manifest.v1.json";
  const usedAssumptions = [
    {
      assumptionId: "candidate_manifest_hash",
      kind: "typed_hypothesis" as const,
      valueType: "artifact_hash" as const,
      typeStatement: assumptionType,
      typeStatementSha256: sha256Nhm2FormalKernelReplayUtf8(assumptionType),
      sourceArtifact: candidateManifest,
      usedByTheoremIds: ["candidate_scope_replay"],
    },
  ];

  const manifest = {
    artifactId: NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID,
    contractVersion: NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
    generatedAt: "2026-07-19T16:00:00.000Z",
    identity: {
      candidateId: "candidate-alpha-0.7",
      candidateManifestSha256: candidateManifest.sha256,
      requestId: "formal-request-001",
      runId: "formal-run-001",
      runtimeId: "nhm2-formal-runtime",
      sourceCommitSha: "a".repeat(40),
    },
    preRunSourceCommitment: {
      frozenBeforeReplay: true as const,
      ordering: NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING,
      merkleAlgorithm: NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM,
      entries: preRunSources,
      merkleRootSha256:
        computeNhm2FormalKernelReplaySourceMerkleRoot(preRunSources),
      ledgerArtifact: {
        path: "outputs/ledgers/pre-run-sources.v1.json",
        sha256: "0".repeat(64),
      },
    },
    kernel: {
      proofAssistant: "Lean" as const,
      kernelId: "lean-kernel",
      kernelVersion: "4.21.0",
      binary: kernelBinary,
      environmentLock,
    },
    theoremReplay: {
      ordering: NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING,
      expectedTheoremCount: theoremEntries.length,
      replayedTheoremCount: theoremEntries.length,
      entries: theoremEntries,
      ledgerArtifact: {
        path: "outputs/ledgers/theorem-replay.v1.json",
        sha256: "0".repeat(64),
      },
    },
    dependencyLedgers: {
      axiomOrdering: NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING,
      assumptionOrdering: NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING,
      usedAxioms,
      usedAssumptions,
      usedAxiomLedgerArtifact: {
        path: "outputs/ledgers/used-axioms.v1.json",
        sha256: "0".repeat(64),
      },
      usedAssumptionLedgerArtifact: {
        path: "outputs/ledgers/used-assumptions.v1.json",
        sha256: "0".repeat(64),
      },
    },
    replay: {
      mode: "external_pinned_lean_kernel" as const,
      exitCode: 0 as const,
      aggregateTranscript,
    },
    claimLock: {
      theoremId: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
      proposition: NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
      physicalViabilityClaimAllowed: false as const,
      transportClaimAllowed: false as const,
      propulsionClaimAllowed: false as const,
      routeEtaClaimAllowed: false as const,
      speedAuthorityClaimAllowed: false as const,
      empiricalReceiptsRequired: true as const,
    },
    claimBoundary: {
      formalReplayEvidenceOnly: true as const,
      contractVerifierInvokesLean: false as const,
      processReceiptRequiredForRuntimeClaim: true as const,
      physicsProved: false as const,
      physicalViabilityClaimAllowed: false as const,
      transportClaimAllowed: false as const,
      propulsionClaimAllowed: false as const,
      routeEtaClaimAllowed: false as const,
      speedAuthorityClaimAllowed: false as const,
    },
  } satisfies Nhm2FormalKernelReplayManifestV1;

  const addCanonicalLedger = (
    artifact: Nhm2FormalKernelReplayArtifactRefV1,
    value: unknown,
  ): void => {
    const bytes = Buffer.from(
      canonicalNhm2FormalKernelReplayJson(value),
      "utf8",
    );
    artifact.sha256 = sha256(bytes);
    files.set(artifact.path, bytes);
  };
  addCanonicalLedger(
    manifest.preRunSourceCommitment.ledgerArtifact,
    nhm2FormalKernelReplaySourceLedgerValue(manifest),
  );
  addCanonicalLedger(
    manifest.theoremReplay.ledgerArtifact,
    nhm2FormalKernelReplayTheoremLedgerValue(manifest),
  );
  addCanonicalLedger(
    manifest.dependencyLedgers.usedAxiomLedgerArtifact,
    nhm2FormalKernelReplayAxiomLedgerValue(manifest),
  );
  addCanonicalLedger(
    manifest.dependencyLedgers.usedAssumptionLedgerArtifact,
    nhm2FormalKernelReplayAssumptionLedgerValue(manifest),
  );
  const manifestArtifact = addFile(
    "outputs/nhm2-formal-kernel-replay-manifest.v1.json",
    canonicalNhm2FormalKernelReplayJson(manifest),
  );
  const expected: Nhm2FormalKernelReplayExpectedBindingsV1 = {
    manifestArtifact,
    identity: structuredClone(manifest.identity),
    preRunSources: structuredClone(manifest.preRunSourceCommitment.entries),
    kernel: structuredClone(manifest.kernel),
    theorems: structuredClone(manifest.theoremReplay.entries),
    usedAxioms: structuredClone(manifest.dependencyLedgers.usedAxioms),
    usedAssumptions: structuredClone(
      manifest.dependencyLedgers.usedAssumptions,
    ),
  };
  return { manifest, expected, files };
};

const verify = (fixture: Fixture) =>
  verifyNhm2FormalKernelReplayManifest({
    manifest: fixture.manifest,
    expected: fixture.expected,
    readArtifact: (path) => fixture.files.get(path),
  });

describe("NHM2 formal kernel replay manifest", () => {
  it("freezes the domain-separated binary Merkle algorithm with a known vector", () => {
    expect(
      computeNhm2FormalKernelReplaySourceMerkleRoot([
        { path: "a.json", sha256: "0".repeat(64) },
        { path: "b.json", sha256: "1".repeat(64) },
      ]),
    ).toBe("6ba80116dc25af660bba1ab5c036272dbf731d14bb3560d29d021ca9b2346db3");
  });

  it("accepts exact expected bindings and the bytes of every referenced artifact", () => {
    const fixture = completeFixture();
    const result = verify(fixture);

    expect(isNhm2FormalKernelReplayManifest(fixture.manifest)).toBe(true);
    expect(result).toMatchObject({
      valid: true,
      structureValid: true,
      expectedBindingsValid: true,
      artifactContentValid: true,
      blockers: [],
      verifierExecution: {
        invokedLean: false,
        verifiedProcessReceipt: false,
        checkedReferencedArtifactBytes: true,
      },
      claimBoundary: {
        physicsProved: false,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
      },
    });
  });

  it("fails when a frozen source changes after the pre-run commitment", () => {
    const fixture = completeFixture();
    fixture.files.set(
      "inputs/candidate-manifest.v1.json",
      Buffer.from("tampered candidate", "utf8"),
    );
    const result = verify(fixture);

    expect(result.valid).toBe(false);
    expect(result.artifactContentValid).toBe(false);
    expect(result.blockers).toContain(
      "artifact_sha256_mismatch:inputs/candidate-manifest.v1.json",
    );
  });

  it("rejects an unsorted ledger and a different expected pre-run source set", () => {
    const fixture = completeFixture();
    fixture.manifest.preRunSourceCommitment.entries.reverse();

    expect(nhm2FormalKernelReplayManifestBlockers(fixture.manifest)).toContain(
      "pre_run_source_entries_not_exact_sorted_unique",
    );

    const clean = completeFixture();
    clean.expected.preRunSources = clean.expected.preRunSources.slice(1);
    expect(verify(clean).blockers).toContain(
      "expected_pre_run_sources_mismatch",
    );
  });

  it("rejects an alternate kernel even when the alternate bytes are readable", () => {
    const fixture = completeFixture();
    fixture.expected.kernel.binary = {
      path: "toolchain/bin/lean-alternate",
      sha256: sha256("alternate-kernel"),
    };
    fixture.files.set(
      "toolchain/bin/lean-alternate",
      Buffer.from("alternate-kernel", "utf8"),
    );

    const result = verify(fixture);
    expect(result.valid).toBe(false);
    expect(result.blockers).toContain("expected_kernel_binding_mismatch");
  });

  it("rejects a same-count theorem substitution and proof/transcript swaps", () => {
    const substituted = completeFixture();
    substituted.expected.theorems[0].theoremId = "unrelated_same_count_theorem";
    expect(verify(substituted).blockers).toContain(
      "expected_theorem_scope_mismatch",
    );

    const swapped = completeFixture();
    const first = swapped.expected.theorems[0];
    const second = swapped.expected.theorems[1];
    [first.proofArtifact, second.proofArtifact] = [
      second.proofArtifact,
      first.proofArtifact,
    ];
    [first.transcriptArtifact, second.transcriptArtifact] = [
      second.transcriptArtifact,
      first.transcriptArtifact,
    ];
    expect(verify(swapped).blockers).toContain(
      "expected_theorem_scope_mismatch",
    );
  });

  it("requires exact axiom and assumption use ledgers", () => {
    const axiomFixture = completeFixture();
    axiomFixture.manifest.dependencyLedgers.usedAxioms = [];
    expect(
      nhm2FormalKernelReplayManifestBlockers(axiomFixture.manifest),
    ).toContain(
      "theorem_used_axiom_unledgered:candidate_scope_replay:Lean.ofReduceBool",
    );

    const assumptionFixture = completeFixture();
    assumptionFixture.manifest.dependencyLedgers.usedAssumptions[0].usedByTheoremIds =
      [NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID];
    expect(
      nhm2FormalKernelReplayManifestBlockers(assumptionFixture.manifest),
    ).toContain(
      "used_assumption_theorem_binding_mismatch:candidate_manifest_hash",
    );
  });

  it("requires exit zero and the exact pre-experimental claim-lock theorem", () => {
    const nonzero = completeFixture();
    (nonzero.manifest.replay as { exitCode: number }).exitCode = 1;
    expect(nhm2FormalKernelReplayManifestBlockers(nonzero.manifest)).toContain(
      "kernel_replay_exit_not_zero",
    );

    const unlocked = completeFixture();
    (
      unlocked.manifest.claimLock as {
        physicalViabilityClaimAllowed: boolean;
      }
    ).physicalViabilityClaimAllowed = true;
    expect(nhm2FormalKernelReplayManifestBlockers(unlocked.manifest)).toContain(
      "claim_lock_physicalViabilityClaimAllowed_not_false",
    );

    const wrongProposition = completeFixture();
    (
      wrongProposition.manifest.claimLock as { proposition: string }
    ).proposition = "physical_viability = true";
    expect(
      nhm2FormalKernelReplayManifestBlockers(wrongProposition.manifest),
    ).toContain("claim_lock_proposition_not_exact");
  });

  it("rejects non-canonical or missing ledger bytes", () => {
    const nonCanonical = completeFixture();
    const ledger = nonCanonical.manifest.theoremReplay.ledgerArtifact;
    nonCanonical.files.set(
      ledger.path,
      Buffer.from(
        JSON.stringify(
          nhm2FormalKernelReplayTheoremLedgerValue(nonCanonical.manifest),
          null,
          2,
        ),
        "utf8",
      ),
    );
    expect(verify(nonCanonical).blockers).toContain(
      `artifact_sha256_mismatch:${ledger.path}`,
    );

    const missing = completeFixture();
    missing.files.delete(
      missing.manifest.dependencyLedgers.usedAssumptionLedgerArtifact.path,
    );
    expect(verify(missing).blockers).toContain(
      "artifact_missing:outputs/ledgers/used-assumptions.v1.json",
    );
  });
});
