import { describe, expect, it } from "vitest";
import {
  buildTheoryRuntimeOutputManifestV1,
  buildTheoryRuntimeReceiptV1,
  isTheoryRuntimeReceiptV1,
  validateTheoryRuntimeOutputManifestV1,
  validateTheoryRuntimeReceiptV1,
} from "../shared/contracts/theory-runtime-receipt.v1";

const generatedAt = "2026-05-29T00:00:00.000Z";
const completedAt = "2026-05-29T00:00:01.000Z";
const gitSha = "1234567890abcdef1234567890abcdef12345678";

const makeManifest = () =>
  buildTheoryRuntimeOutputManifestV1({
    generatedAt,
    requestId: "request:strict-receipt",
    runtimeId: "nhm2.shift_lapse.alpha_sweep",
    gitSha,
    startedAt: generatedAt,
    completedAt,
    outputDirectory: "artifacts/run",
    boundToExecution: true,
    manifestPath: "artifacts/run/theory-runtime-output-manifest.v1.json",
    manifestSha256: "a".repeat(64),
    entries: [
      {
        path: "artifacts/run/source-closure.json",
        sha256: "b".repeat(64),
        sizeBytes: 42,
        modifiedAt: generatedAt,
        freshness: "new",
      },
    ],
    freshnessProof: {
      schemaVersion: "theory_runtime_freshness_snapshot/v1",
      algorithm: "sha256_size_pre_post/v1",
      beforeCapturedAt: generatedAt,
      afterCapturedAt: completedAt,
      beforeCommitmentPath: "artifacts/run/pre-spawn-snapshot.v1.json",
      beforeCommitmentSha256: "c".repeat(64),
      beforeSnapshotSha256: "d".repeat(64),
      afterSnapshotSha256: "e".repeat(64),
      beforeEntries: [
        {
          path: "artifacts/run/preexisting.json",
          sha256: "f".repeat(64),
          sizeBytes: 7,
          modifiedAt: generatedAt,
        },
      ],
    },
  });

const makeReceipt = () =>
  buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: "runtime-receipt:strict",
    runtimeId: "nhm2.shift_lapse.alpha_sweep",
    graphId: "nhm2-theory-badge-graph",
    badgeIds: ["nhm2.formal.lean_certificate"],
    command: "npm run warp:full-solve:nhm2:profile:campaign",
    args: { alpha: 0.7 },
    status: "completed",
    outputs: {
      artifacts: ["artifacts/run/source-closure.json"],
      scalars: { residual: 0.05 },
      units: { residual: "1" },
      gates: { source_closure: "pass" },
      missingSignals: [],
      warnings: [],
      artifactManifest: makeManifest(),
      artifactEvidence: [
        {
          path: "artifacts/run/source-closure.json",
          sha256: "b".repeat(64),
          freshness: "new",
          status: "pass",
          gates: { source_closure: "pass" },
        },
      ],
    },
    provenance: {
      gitSha,
      startedAt: generatedAt,
      completedAt,
      durationMs: 1000,
    },
    execution: {
      command: "npm",
      args: ["run", "warp:full-solve:nhm2:profile:campaign"],
      cwd: "C:/repo",
      environment: { NODE_ENV: "test" },
      outputDirectory: "artifacts/run",
      outputDirectoryBound: true,
      exitCode: 0,
      stdout: "done",
      stderr: "",
      timedOut: false,
      error: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: ["empirical_receipts_missing"],
    },
  });

describe("theory runtime receipt exact-key validation", () => {
  it("accepts the declared optional manifest, evidence, and execution fields", () => {
    const receipt = makeReceipt();

    expect(validateTheoryRuntimeOutputManifestV1(makeManifest())).toEqual([]);
    expect(validateTheoryRuntimeReceiptV1(receipt)).toEqual([]);
    expect(isTheoryRuntimeReceiptV1(receipt)).toBe(true);
  });

  it("rejects unknown or shadow-authority fields throughout runtime receipts", () => {
    const receipt = makeReceipt();
    const cases = [
      {
        label: "runtime receipt",
        value: { ...receipt, certified: true },
      },
      {
        label: "outputs",
        value: {
          ...receipt,
          outputs: { ...receipt.outputs, physicalViability: "pass" },
        },
      },
      {
        label: "provenance",
        value: {
          ...receipt,
          provenance: { ...receipt.provenance, independentlyVerified: true },
        },
      },
      {
        label: "execution",
        value: {
          ...receipt,
          execution: { ...receipt.execution!, runtimeAuthority: "certified" },
        },
      },
      {
        label: "claimBoundary",
        value: {
          ...receipt,
          claimBoundary: {
            ...receipt.claimBoundary,
            physicalViabilityClaimAllowed: true,
          },
        },
      },
      {
        label: "outputs.artifactEvidence[0]",
        value: {
          ...receipt,
          outputs: {
            ...receipt.outputs,
            artifactEvidence: [
              {
                ...receipt.outputs.artifactEvidence![0],
                promotionAuthority: "physical",
              },
            ],
          },
        },
      },
    ];

    for (const testCase of cases) {
      const issues = validateTheoryRuntimeReceiptV1(testCase.value);
      expect(
        issues.some((issue) =>
          issue.includes(`${testCase.label} contains unknown field(s)`),
        ),
      ).toBe(true);
      expect(isTheoryRuntimeReceiptV1(testCase.value)).toBe(false);
    }
  });

  it("rejects unknown fields in manifests, entries, and freshness snapshots", () => {
    const manifest = makeManifest();
    const cases = [
      {
        label: "runtime output manifest",
        value: { ...manifest, verdict: "pass" },
      },
      {
        label: "entries[0]",
        value: {
          ...manifest,
          entries: [{ ...manifest.entries[0], approved: true }],
        },
      },
      {
        label: "freshnessProof",
        value: {
          ...manifest,
          freshnessProof: {
            ...manifest.freshnessProof!,
            freshnessAuthority: "verified",
          },
        },
      },
      {
        label: "freshnessProof.beforeEntries[0]",
        value: {
          ...manifest,
          freshnessProof: {
            ...manifest.freshnessProof!,
            beforeEntries: [
              {
                ...manifest.freshnessProof!.beforeEntries[0],
                immutable: true,
              },
            ],
          },
        },
      },
    ];

    for (const testCase of cases) {
      const issues = validateTheoryRuntimeOutputManifestV1(testCase.value);
      expect(
        issues.some((issue) =>
          issue.includes(`${testCase.label} contains unknown field(s)`),
        ),
      ).toBe(true);
    }
  });
});
