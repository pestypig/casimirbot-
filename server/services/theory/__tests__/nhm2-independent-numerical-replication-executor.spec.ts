import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES,
  type Nhm2ExternalNumericalKernelObservationV1,
  type Nhm2ExternalNumericalKernelRunSpecV1,
} from "../nhm2-external-numerical-kernel-executor";
import {
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
  NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID,
  NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
  computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256,
  type Nhm2IndependentNumericalExternalExecutionDescriptorV1,
} from "../../../../shared/contracts/nhm2-independent-numerical-execution-descriptor.v1";
import {
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_VERSION,
  assertNhm2IndependentNumericalApprovedToolchainPolicy,
  computeNhm2IndependentNumericalApprovedToolchainPolicySemanticSha256,
  executeNhm2IndependentNumericalReplication,
  executeNhm2IndependentNumericalReplicationForTest,
  nhm2IndependentNumericalExecutableBlocker,
  nhm2IndependentNumericalFingerprintBlockers,
  nhm2IndependentNumericalOutputCopyBlockers,
  type ExecuteNhm2IndependentNumericalReplicationInput,
  type Nhm2IndependentNumericalApprovedToolchainPolicyV1,
  type Nhm2IndependentNumericalCandidateContext,
  type Nhm2IndependentNumericalPrimaryBundleLineageV1,
  type Nhm2IndependentNumericalPresealedRunSpecV1,
} from "../nhm2-independent-numerical-replication-executor";
import {
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
} from "../../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import { buildTheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_WORKSTATION_GRAPH_ID } from "../../../../shared/theory/runtime-execution-policy";

const sha = (character: string): string => character.repeat(64);

function resealDescriptor(
  descriptor: Nhm2IndependentNumericalExternalExecutionDescriptorV1,
): void {
  const { semanticSha256: _semanticSha256, ...semantic } = descriptor;
  descriptor.semanticSha256 =
    computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256(semantic);
}

function approvedPolicy(): Nhm2IndependentNumericalApprovedToolchainPolicyV1 {
  const semantic = {
    artifactId:
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
    contractVersion:
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
    policyId: "test-independent-multiphysics-v1",
    approvedAt: "2026-07-20T00:00:00.000Z",
    authority: "server_owned_immutable_allowlist" as const,
    status: "approved_for_diagnostic_independent_execution_only" as const,
    target: {
      platform: process.platform,
      architecture: process.arch,
    },
    solver: {
      family: "independent_replication_suite" as const,
      solverId: "external-independent-multiphysics",
      implementationId: "separate-codebase-v1",
      version: "1.0.0",
      independenceGroup: "external-team-codebase-v1",
      implementationSourceClosureSha256: sha("1"),
    },
    toolchain: {
      ledgerSha256: sha("2"),
      executableSha256: sha("3"),
      executableSizeBytes: 4096,
    },
    environment: {
      allowlist: ["LANG", "TZ"],
      values: { LANG: "C", TZ: "UTC" },
    },
    claimBoundary: {
      externalProcessObservationOnly: true as const,
      independentImplementationLineageEstablished: false as const,
      exactWholeFileCopyCheckIsTripwireOnly: true as const,
      primaryContentLineageExclusionEstablished: false as const,
      fieldLevelScientificReplayRequired: true as const,
      passingIndependentReplicationArtifactMayBeEmitted: false as const,
      syntheticFallbackForbidden: true as const,
      primaryOutputCopyingForbidden: true as const,
      theoryClosureClaimAllowed: false as const,
      empiricalValidationEstablished: false as const,
      physicalViabilityClaimAllowed: false as const,
      transportClaimAllowed: false as const,
      propulsionClaimAllowed: false as const,
      routeEtaClaimAllowed: false as const,
      speedAuthorityClaimAllowed: false as const,
    },
  };
  return {
    ...semantic,
    semanticSha256:
      computeNhm2IndependentNumericalApprovedToolchainPolicySemanticSha256(
        semantic,
      ),
  };
}

function executionFixture(input?: {
  executablePath?: string;
  outputSha?: string;
}) {
  const policy = approvedPolicy();
  const projectRoot = path.resolve(
    os.tmpdir(),
    `nhm2-independent-executor-spec-${process.pid}`,
  );
  const manifestPath = "artifacts/candidates/independent-candidate.v1.json";
  const manifestSha256 = sha("a");
  const primaryOutputSha256 = sha("9");
  const outputDirectory = "artifacts/runs/independent-run";
  const plan = (
    role: "primary_numerical" | "independent_numerical",
  ): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 => {
    const independent = role === "independent_numerical";
    const runtimeId = independent
      ? "nhm2.experiment_ready_theory.independent"
      : "nhm2.experiment_ready_theory.primary";
    const requestId = `${role}-request`;
    const script = independent
      ? "warp:full-solve:nhm2:theory-candidate:independent"
      : "warp:full-solve:nhm2:theory-candidate:primary";
    return {
      planRole: role,
      requestId,
      runId: `${role}-run`,
      receiptId: nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
        runtimeId,
        requestId,
      ),
      runtimeId,
      sourceCommitSha: "1".repeat(40),
      deterministicSeedPolicy: `${role}-seed`,
      solver: {
        artifactId: independent
          ? NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID
          : `${role}.solver`,
        contractVersion: independent
          ? NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION
          : `${role}_solver/v1`,
        path: `artifacts/inputs/${role}-solver.json`,
        sha256: independent ? sha("b") : sha("c"),
        solverId: independent ? policy.solver.solverId : "primary-solver",
        solverVersion: independent ? policy.solver.version : "primary-v1",
        implementationId: independent
          ? policy.solver.implementationId
          : "primary-implementation",
      },
      environmentLock: {
        artifactId: independent
          ? "nhm2.independent_environment_lock"
          : `${role}.environment`,
        contractVersion: independent
          ? "nhm2_independent_environment_lock/v1"
          : `${role}_environment/v1`,
        path: `artifacts/inputs/${role}-environment.json`,
        sha256: independent ? sha("d") : sha("e"),
        environmentId: `${role}-environment`,
      },
      expectedInvocation: {
        entrypoint: `npm run ${script} -- --candidate-manifest ${manifestPath}`,
        command: "npm",
        args: ["run", "-s", script, "--", "--candidate-manifest", manifestPath],
        cwd: ".",
        environment: [],
        outputDirectory: independent
          ? outputDirectory
          : "artifacts/runs/primary-run",
      },
    };
  };
  const independentPlan = plan("independent_numerical");
  const primaryPlan = plan("primary_numerical");
  const artifactRef = (
    artifactId: string,
    contractVersion: string,
    relativePath: string,
    digest: string,
    sizeBytes = 128,
  ) => ({
    artifactId,
    contractVersion,
    relativePath,
    sha256: digest,
    sizeBytes,
  });
  const descriptorSemantic = {
    artifactId: NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_ARTIFACT_ID,
    contractVersion:
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
    generatedAt: "2026-07-20T00:00:00.050Z",
    descriptorId: "external-independent-multiphysics-x64-v1",
    planRole: "independent_numerical" as const,
    producerMode: "external_binary" as const,
    solverFamily: "independent_replication_suite" as const,
    solver: {
      solverId: policy.solver.solverId,
      implementationId: policy.solver.implementationId,
      version: policy.solver.version,
      independenceGroup: policy.solver.independenceGroup,
    },
    approvedPolicy: {
      artifactId: policy.artifactId,
      contractVersion: policy.contractVersion,
      policyId: policy.policyId,
      semanticSha256: policy.semanticSha256,
      approvedAt: policy.approvedAt,
      artifact: artifactRef(
        policy.artifactId,
        policy.contractVersion,
        "enrollment/independent-policy.v1.json",
        sha("4"),
      ),
    },
    target: { ...policy.target },
    implementationSourceClosure: {
      closureId: "external-independent-source-v1",
      closureSha256: policy.solver.implementationSourceClosureSha256,
      entryCount: 12,
      aggregateBytes: 4096,
      ledger: artifactRef(
        "nhm2.independent_source_ledger",
        "nhm2_independent_source_ledger/v1",
        "enrollment/independent-source-ledger.v1.json",
        sha("5"),
      ),
    },
    toolchain: {
      ledger: artifactRef(
        "nhm2.independent_toolchain_ledger",
        "nhm2_independent_toolchain_ledger/v1",
        "enrollment/independent-toolchain-ledger.v1.json",
        policy.toolchain.ledgerSha256,
      ),
      executable: artifactRef(
        "nhm2.independent_executable",
        "nhm2_independent_executable/v1",
        "enrollment/independent-solver.bin",
        policy.toolchain.executableSha256,
        policy.toolchain.executableSizeBytes,
      ),
    },
    environment: {
      lock: artifactRef(
        independentPlan.environmentLock.artifactId,
        independentPlan.environmentLock.contractVersion,
        independentPlan.environmentLock.path,
        independentPlan.environmentLock.sha256,
      ),
      allowlist: [...policy.environment.allowlist],
      values: { ...policy.environment.values },
    },
    primaryLineage: {
      solverId: primaryPlan.solver.solverId,
      implementationId: primaryPlan.solver.implementationId,
      solverDescriptorSha256: primaryPlan.solver.sha256,
      environmentLockSha256: primaryPlan.environmentLock.sha256,
      producerBundleSha256: sha("a"),
      sourceClosureSha256: sha("b"),
    },
    claimBoundary: {
      administrativeEnrollmentOnly: true as const,
      serverPolicyAdmissionRequired: true as const,
      serverPresealRequired: true as const,
      externalProcessObservationIsNotScientificReplay: true as const,
      serverFieldLevelReplayRequired: true as const,
    },
    claimLocks: {
      descriptorEstablishesInstalledPolicy: false as const,
      descriptorEstablishesExecutableAvailability: false as const,
      independentImplementationLineageEstablished: false as const,
      independentContentLineageExclusionEstablished: false as const,
      independentNumericalReplicationReady: false as const,
      theoryClosureEstablished: false as const,
      empiricalValidationEstablished: false as const,
      physicalViabilityEstablished: false as const,
      transportEstablished: false as const,
      propulsionEstablished: false as const,
      routeEtaEstablished: false as const,
      certifiedSpeedEstablished: false as const,
    },
  } satisfies Omit<
    Nhm2IndependentNumericalExternalExecutionDescriptorV1,
    "semanticSha256"
  >;
  const independentDescriptor: Nhm2IndependentNumericalExternalExecutionDescriptorV1 =
    {
      ...descriptorSemantic,
      semanticSha256:
        computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256(
          descriptorSemantic,
        ),
    };
  const context: Nhm2IndependentNumericalCandidateContext = {
    manifest: {
      frozenAt: "2026-07-20T00:00:00.000Z",
      bindings: {
        candidate: { candidateId: "candidate-alpha-0.7" },
        profile: { selectedProfileId: "profile-alpha-0.7" },
        chart: { chartId: "comoving_cartesian" },
        atlas: { sha256: sha("1") },
        units: { sha256: sha("2") },
        normalization: { sha256: sha("3") },
      },
    } as unknown as Nhm2IndependentNumericalCandidateContext["manifest"],
    manifestSha256,
    independentPlan,
    primaryPlan,
    independentDescriptor,
  };
  const primaryBundleLineage: Nhm2IndependentNumericalPrimaryBundleLineageV1 = {
    candidateManifestSha256: manifestSha256,
    primaryPlan: {
      requestId: primaryPlan.requestId,
      runtimeId: primaryPlan.runtimeId,
      receiptId: primaryPlan.receiptId,
      solverId: primaryPlan.solver.solverId,
      implementationId: primaryPlan.solver.implementationId,
      solverDescriptorSha256: primaryPlan.solver.sha256,
      environmentLockSha256: primaryPlan.environmentLock.sha256,
    },
    producerBundle: {
      path: "artifacts/inputs/primary-producer-bundle.mjs",
      sha256: independentDescriptor.primaryLineage.producerBundleSha256,
      sizeBytes: 4096,
    },
    buildMetadata: {
      path: "artifacts/inputs/primary-producer-bundle-build.v1.json",
      sha256: sha("0"),
      sourceSnapshotSha256:
        independentDescriptor.primaryLineage.sourceClosureSha256,
    },
  };
  const kernel: Nhm2ExternalNumericalKernelRunSpecV1 = {
    lane: "independent_numerical_replication",
    solver: {
      family: "independent_replication_suite",
      implementationId: policy.solver.implementationId,
      version: policy.solver.version,
      producerMode: "external_binary",
    },
    executable: {
      absolutePath: input?.executablePath ?? process.execPath,
      sha256: policy.toolchain.executableSha256,
      sizeBytes: policy.toolchain.executableSizeBytes,
    },
    ledgers: {
      toolchain: {
        kind: "toolchain",
        rootPath: path.dirname(input?.executablePath ?? process.execPath),
        entries: [],
        ledgerSha256: policy.toolchain.ledgerSha256,
      },
      input: {
        kind: "input",
        rootPath: path.resolve(projectRoot, "artifacts/independent-input"),
        entries: [
          {
            relativePath: "primary/full-output.json",
            sha256: primaryOutputSha256,
            sizeBytes: 8,
          },
        ],
        ledgerSha256: sha("f"),
      },
    },
    outputRoot: path.resolve(projectRoot, outputDirectory, "external-kernel"),
    arguments: [],
    environmentAllowlist: [...policy.environment.allowlist],
    environment: { ...policy.environment.values },
    expectedOutputs: [
      {
        role: "independent_replay_bundle",
        relativePath: "bundle.bin",
        maxBytes: 1024,
      },
      {
        role: "independent_replay_inventory",
        relativePath: "inventory.json",
        maxBytes: 1024,
      },
      {
        role: "independent_replay_trace",
        relativePath: "trace.json",
        maxBytes: 1024,
      },
    ],
    timeoutMs: 1000,
    maxCapturedOutputBytes: 1024,
    maxLedgerFileBytes: 1024,
    maxLedgerAggregateBytes: 4096,
    maxOutputAggregateBytes: 4096,
  };
  const presealedRunSpec: Nhm2IndependentNumericalPresealedRunSpecV1 = {
    artifactId: "nhm2.independent_numerical_presealed_run_spec",
    contractVersion: "nhm2_independent_numerical_presealed_run_spec/v1",
    generatedAt: "2026-07-20T00:00:01.000Z",
    candidateManifest: { path: manifestPath, sha256: manifestSha256 },
    independentPlan: {
      requestId: independentPlan.requestId,
      runId: independentPlan.runId,
      receiptId: independentPlan.receiptId,
      runtimeId: independentPlan.runtimeId,
    },
    primaryReceipt: {
      requestId: primaryPlan.requestId,
      receiptId: primaryPlan.receiptId,
      path: "artifacts/research/theory-runtime-receipts/receipt-primary.v1.json",
      sha256: sha("8"),
    },
    primaryOutputs: [
      {
        primaryPath: "artifacts/runs/primary-run/full-output.json",
        inputRelativePath: "primary/full-output.json",
        sha256: primaryOutputSha256,
        sizeBytes: 8,
      },
    ],
    approvedPolicy: {
      policyId: policy.policyId,
      semanticSha256: policy.semanticSha256,
    },
    kernel,
    claimBoundary: { ...policy.claimBoundary },
  };
  const primaryEntrypoint = getTheoryRuntimeEntrypoint(primaryPlan.runtimeId)!;
  const receipt = buildTheoryRuntimeReceiptV1({
    generatedAt: "2026-07-20T00:00:00.450Z",
    receiptId: primaryPlan.receiptId,
    runtimeId: primaryPlan.runtimeId,
    graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
    badgeIds: [...primaryEntrypoint.ownedBadgeIds],
    command: primaryPlan.expectedInvocation.command,
    args: {
      adapter: "nhm2_theory_candidate_primary_executor",
      requestId: primaryPlan.requestId,
      runId: primaryPlan.runId,
      receiptId: primaryPlan.receiptId,
      candidateManifestPath: manifestPath,
      candidateManifestSha256: manifestSha256,
      candidateId: "candidate-alpha-0.7",
      selectedProfileId: "profile-alpha-0.7",
      chartId: "comoving_cartesian",
      atlasSha256: sha("1"),
      unitsSha256: sha("2"),
      normalizationSha256: sha("3"),
    },
    status: "completed",
    outputs: {
      artifacts: ["artifacts/runs/primary-run/full-output.json"],
      scalars: {
        expectedEvidenceCount: 9,
        primaryEvidenceRootCount: 9,
        supplementaryRunOwnedArtifactCount: 1,
        totalRunOwnedArtifactCount: 10,
        freshEvidenceCount: 10,
        predictionFreezeReady: false,
        hermeticDependencyTreeAttested: true,
        runtimeNodeModulesRequired: false,
        hostSpecificDiagnosticRuntimeClosure: true,
        operatingSystemHermeticityAsserted: false,
        nodeRuntimeReproducibilityAsserted: false,
        inheritedProcessEnvironment: false,
        primaryNumericalEvidenceReady: false,
        primaryNumericalEvidenceFalsified: false,
        primaryComparisonProjectionAssessmentPublished: true,
        primaryComparisonProjectionReady: false,
        experimentReadyTheoryClosureClaimAllowed: false,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
        propulsionClaimAllowed: false,
        routeEtaClaimAllowed: false,
        speedAuthorityClaimAllowed: false,
      },
      units: {},
      gates: {
        runtime_execution: "pass",
        runtime_execution_provenance: "pass",
        runtime_artifact_freshness: "pass",
        run_owned_nested_reference_closure: "pass",
        primary_evidence_inventory: "pass",
        primary_numerical_evidence: "not_ready",
        primary_comparison_projection: "not_ready",
        experiment_ready_theory_closure: "not_ready",
        prediction_falsifier_freeze: "not_ready",
      },
      missingSignals: [
        "primary_comparison_projection_not_ready",
        "experiment_ready_theory_closure_not_ready",
      ],
      warnings: [],
      artifactManifest: {
        artifactId: "theory_runtime_output_manifest",
        schemaVersion: "theory_runtime_output_manifest/v1",
        generatedAt: "2026-07-20T00:00:00.400Z",
        requestId: primaryPlan.requestId,
        runtimeId: primaryPlan.runtimeId,
        gitSha: primaryPlan.sourceCommitSha,
        startedAt: "2026-07-20T00:00:00.100Z",
        completedAt: "2026-07-20T00:00:00.400Z",
        outputDirectory: primaryPlan.expectedInvocation.outputDirectory,
        boundToExecution: true,
        manifestPath: "artifacts/runs/primary-run/output-manifest.json",
        manifestSha256: sha("6"),
        entries: [],
      },
    },
    provenance: {
      gitSha: primaryPlan.sourceCommitSha,
      startedAt: "2026-07-20T00:00:00.100Z",
      completedAt: "2026-07-20T00:00:00.400Z",
      durationMs: 300,
    },
    execution: {
      command: primaryPlan.expectedInvocation.command,
      args: [...primaryPlan.expectedInvocation.args],
      cwd: projectRoot,
      exitCode: 0,
      environment: {
        THEORY_RUNTIME_REQUEST_ID: primaryPlan.requestId,
        THEORY_RUNTIME_RECEIPT_ID: primaryPlan.receiptId,
        THEORY_RUNTIME_ID: primaryPlan.runtimeId,
        NHM2_RUN_ID: primaryPlan.runId,
        NHM2_CANDIDATE_MANIFEST_SHA256: manifestSha256,
      },
      outputDirectory: primaryPlan.expectedInvocation.outputDirectory,
      outputDirectoryBound: true,
      stdout: "",
      stderr: "",
      timedOut: false,
      error: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: [
        "experiment_ready_theory_closure_requires_independent_and_formal_evidence",
        "empirical_receipts_required_for_physical_promotion",
      ],
    },
  });
  const persistedReceiptBytes = Buffer.from(
    `${JSON.stringify(receipt, null, 2)}\n`,
    "utf8",
  );
  presealedRunSpec.primaryReceipt.sha256 = createHash("sha256")
    .update(persistedReceiptBytes)
    .digest("hex");
  const kernelObservation = {
    status: "execution_observed_scientific_replay_required",
    outputs: [
      {
        role: "independent_replay_bundle",
        sha256: input?.outputSha ?? sha("7"),
      },
    ],
    blockers: [
      "independent_scientific_content_replay_required",
      "same_user_staged_toolchain_mutation_exclusion_not_os_enforced",
    ],
  } as unknown as Nhm2ExternalNumericalKernelObservationV1;
  return {
    input: {
      projectRoot,
      candidateManifestPath: manifestPath,
      execute: true as const,
    },
    dependencies: {
      loadApprovedPolicy: async () => policy,
      now: () => new Date("2026-07-20T00:00:02.000Z"),
      loadCandidateContext: async () => context,
      loadPrimaryBundleLineage: async () => primaryBundleLineage,
      readPersistedPreseal: async () => {
        const bytes = Buffer.from(JSON.stringify(presealedRunSpec), "utf8");
        return {
          artifact: {
            artifactId: "nhm2.independent_numerical_persisted_preseal" as const,
            schemaVersion:
              "nhm2_independent_numerical_persisted_preseal/v1" as const,
            path: "artifacts/research/nhm2/independent/preseal.v1.json",
            sha256: createHash("sha256").update(bytes).digest("hex"),
            sizeBytes: bytes.byteLength,
            writtenAt: "2026-07-20T00:00:01.500Z",
          },
          bytes,
        };
      },
      readPrimaryReceipt: async () => ({
        receipt,
        artifact: {
          artifactId: "theory_runtime_persisted_receipt" as const,
          schemaVersion: "theory_runtime_persisted_receipt/v1" as const,
          requestId: primaryPlan.requestId,
          receiptId: primaryPlan.receiptId,
          path: presealedRunSpec.primaryReceipt.path,
          sha256: presealedRunSpec.primaryReceipt.sha256,
          sizeBytes: persistedReceiptBytes.byteLength,
          writtenAt: "2026-07-20T00:00:00.500Z",
        },
      }),
      verifyPrimaryReceipt: async () => ({
        ok: true,
        blockers: [],
        projectRoot,
        outputDirectory: primaryPlan.expectedInvocation.outputDirectory,
        manifestPath: "artifacts/runs/primary-run/output-manifest.json",
        freshnessProofVerified: true,
        files: [
          {
            path: presealedRunSpec.primaryOutputs[0].primaryPath,
            sha256: primaryOutputSha256,
            sizeBytes: 8,
            modifiedAt: "2026-07-20T00:00:00.250Z",
            freshness: "new" as const,
            absolutePath: path.resolve(
              projectRoot,
              presealedRunSpec.primaryOutputs[0].primaryPath,
            ),
            bytes: Buffer.from("primary"),
          },
        ],
      }),
      executeKernel: async () => kernelObservation,
    },
    presealedRunSpec,
    context,
    primaryBundleLineage,
    receipt,
  };
}

describe("NHM2 independent numerical execution lane", () => {
  it("adds a governed external-binary lane with an exact output inventory", () => {
    expect(
      NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES.independent_numerical_replication,
    ).toEqual({
      solverFamily: "independent_replication_suite",
      requiredOutputRoles: [
        "independent_replay_bundle",
        "independent_replay_inventory",
        "independent_replay_trace",
      ],
    });
  });

  it("accepts only a semantic-hash-bound server-owned approval policy", () => {
    expect(NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_VERSION).toBe(
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
    );

    const policy = approvedPolicy();
    expect(() =>
      assertNhm2IndependentNumericalApprovedToolchainPolicy(policy),
    ).not.toThrow();

    const tampered = structuredClone(policy);
    tampered.solver.version = "caller-substituted";
    expect(() =>
      assertNhm2IndependentNumericalApprovedToolchainPolicy(tampered),
    ).toThrow(/semantic digest/i);
  });

  it("rejects policy identity substitutions without widening authority", () => {
    const wrongArtifactId = structuredClone(
      approvedPolicy(),
    ) as unknown as Record<string, unknown>;
    wrongArtifactId.artifactId = "nhm2.caller_authored_toolchain_policy";
    expect(() =>
      assertNhm2IndependentNumericalApprovedToolchainPolicy(wrongArtifactId),
    ).toThrow(/exact server-owned approved toolchain policy/i);

    const wrongContractVersion = structuredClone(
      approvedPolicy(),
    ) as unknown as Record<string, unknown>;
    wrongContractVersion.contractVersion =
      "nhm2_independent_numerical_approved_toolchain_policy/v2";
    expect(() =>
      assertNhm2IndependentNumericalApprovedToolchainPolicy(
        wrongContractVersion,
      ),
    ).toThrow(/exact server-owned approved toolchain policy/i);
  });

  it("rejects shared declared identities and exact pinned-hash aliases", () => {
    const primary = {
      solverId: "primary-solver",
      implementationId: "primary-implementation",
      solverDescriptorSha256: sha("4"),
      environmentLockSha256: sha("5"),
    };
    expect(
      nhm2IndependentNumericalFingerprintBlockers({
        primary,
        independent: {
          solverId: primary.solverId,
          implementationId: primary.implementationId,
          solverDescriptorSha256: primary.solverDescriptorSha256,
          environmentLockSha256: primary.environmentLockSha256,
          implementationSourceClosureSha256: primary.solverDescriptorSha256,
          independenceGroup: primary.implementationId,
        },
      }),
    ).toEqual([
      "independent_solver_id_not_distinct",
      "independent_implementation_id_not_distinct",
      "independent_solver_descriptor_not_distinct",
      "independent_environment_lock_not_distinct",
      "independent_source_closure_hash_aliases_primary_solver_descriptor",
      "independent_group_not_distinct",
    ]);
  });

  it("classifies an absent external executable as typed not-ready evidence", async () => {
    const missing = path.resolve(
      process.cwd(),
      `definitely-missing-independent-solver-${process.pid}`,
    );
    await expect(
      nhm2IndependentNumericalExecutableBlocker(missing),
    ).resolves.toBe("independent_executable_missing");
  });

  it("rejects any generated output whose bytes equal a primary artifact", () => {
    expect(
      nhm2IndependentNumericalOutputCopyBlockers({
        primarySha256: [sha("6"), sha("7")],
        outputs: [
          { role: "independent_replay_bundle", sha256: sha("6") },
          { role: "independent_replay_trace", sha256: sha("8") },
        ],
      }),
    ).toEqual([
      "independent_output_copies_primary_artifact:independent_replay_bundle",
    ]);
  });

  it("fails closed before filesystem admission when no approved toolchain is installed", async () => {
    const result = await executeNhm2IndependentNumericalReplication({
      candidateManifestPath: "artifacts/candidates/not-present.json",
      execute: true,
    });

    expect(result).toMatchObject({
      status: "not_ready",
      independentReplicationArtifact: null,
      independentNumericalReplicationReady: false,
      kernelObservation: null,
      failedProcessObservation: null,
      blockers: ["independent_approved_toolchain_policy_missing"],
      claimBoundary: {
        passingIndependentReplicationArtifactMayBeEmitted: false,
        syntheticFallbackForbidden: true,
        theoryClosureClaimAllowed: false,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
        propulsionClaimAllowed: false,
        routeEtaClaimAllowed: false,
        speedAuthorityClaimAllowed: false,
      },
    });
  });

  it("does not expose dependency injection in the canonical workspace", async () => {
    await expect(
      executeNhm2IndependentNumericalReplicationForTest(
        {
          projectRoot: process.cwd(),
          candidateManifestPath: "artifacts/candidates/not-present.json",
          execute: true,
        },
        { loadApprovedPolicy: async () => approvedPolicy() },
      ),
    ).rejects.toThrow(/named OS-temporary test workspace/i);
  });

  it("ignores caller-authored policy and clock fields instead of granting authority", async () => {
    const callerAuthoredInput = {
      candidateManifestPath: "artifacts/candidates/not-present.json",
      presealedRunSpec: {},
      approvedPolicy: approvedPolicy(),
      executionStartsAt: "2099-01-01T00:00:00.000Z",
      execute: true,
    } as unknown as ExecuteNhm2IndependentNumericalReplicationInput;

    const result =
      await executeNhm2IndependentNumericalReplication(callerAuthoredInput);

    expect(result.blockers).toEqual([
      "independent_approved_toolchain_policy_missing",
    ]);
    expect(result.approvedPolicy).toEqual({
      policyId: null,
      semanticSha256: null,
    });
  });

  it("rejects the legacy flat descriptor shadow before receipt or preseal admission", async () => {
    const fixture = executionFixture();
    const flatShadow = {
      artifactId: fixture.context.independentPlan.solver.artifactId,
      contractVersion: fixture.context.independentPlan.solver.contractVersion,
      planRole: "independent_numerical",
      producerMode: "external_binary",
      solverId: fixture.context.independentPlan.solver.solverId,
      solverVersion: fixture.context.independentPlan.solver.solverVersion,
      implementationId: fixture.context.independentPlan.solver.implementationId,
      approvedPolicyId: approvedPolicy().policyId,
    };
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      {
        ...fixture.dependencies,
        loadCandidateContext: async () => ({
          ...fixture.context,
          independentDescriptor:
            flatShadow as unknown as Nhm2IndependentNumericalExternalExecutionDescriptorV1,
        }),
      },
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual(["independent_solver_descriptor_invalid"]);
    expect(result.primaryReceipt.receiptId).toBeNull();
    expect(result.persistedPreseal.path).toBeNull();
  });

  it("rejects a self-declared primary producer-bundle hash", async () => {
    const fixture = executionFixture();
    fixture.context.independentDescriptor.primaryLineage.producerBundleSha256 =
      sha("f");
    resealDescriptor(fixture.context.independentDescriptor);
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.blockers).toEqual([
      "independent_primary_bundle_lineage_mismatch",
    ]);
    expect(result.primaryReceipt.receiptId).toBeNull();
    expect(result.persistedPreseal.path).toBeNull();
  });

  it("rejects a self-declared primary source-closure hash", async () => {
    const fixture = executionFixture();
    fixture.context.independentDescriptor.primaryLineage.sourceClosureSha256 =
      sha("f");
    resealDescriptor(fixture.context.independentDescriptor);
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.blockers).toEqual([
      "independent_primary_bundle_lineage_mismatch",
    ]);
    expect(result.primaryReceipt.receiptId).toBeNull();
    expect(result.persistedPreseal.path).toBeNull();
  });

  it("rejects a certified or promoting primary receipt before reading its preseal", async () => {
    const fixture = executionFixture();
    fixture.receipt.claimBoundary.currentTier = "certified";
    fixture.receipt.claimBoundary.maximumTier = "certified";
    fixture.receipt.claimBoundary.promotionAllowed = true;
    let presealRead = false;
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      {
        ...fixture.dependencies,
        readPersistedPreseal: async () => {
          presealRead = true;
          return null;
        },
      },
    );

    expect(result.blockers).toEqual([
      "independent_primary_receipt_claim_boundary_invalid",
    ]);
    expect(presealRead).toBe(false);
    expect(result.kernelObservation).toBeNull();
  });

  it("rejects a primary receipt whose experiment-ready closure gate passes", async () => {
    const fixture = executionFixture();
    fixture.receipt.outputs.gates.experiment_ready_theory_closure = "pass";
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.blockers).toEqual([
      "independent_primary_receipt_claim_boundary_invalid",
    ]);
    expect(result.kernelObservation).toBeNull();
  });

  it("rejects an extra empirical true scalar on the primary receipt", async () => {
    const fixture = executionFixture();
    fixture.receipt.outputs.scalars.empiricalValidationEstablished = true;
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.blockers).toEqual([
      "independent_primary_receipt_claim_boundary_invalid",
    ]);
    expect(result.kernelObservation).toBeNull();
  });

  it("rejects an extra empirical pass gate on the primary receipt", async () => {
    const fixture = executionFixture();
    fixture.receipt.outputs.gates.empirical_validation = "pass";
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.blockers).toEqual([
      "independent_primary_receipt_claim_boundary_invalid",
    ]);
    expect(result.kernelObservation).toBeNull();
  });

  it("requires a server-loaded hash-addressed persisted preseal", async () => {
    const fixture = executionFixture();
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      {
        ...fixture.dependencies,
        readPersistedPreseal: async () => null,
      },
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual(["independent_persisted_preseal_missing"]);
    expect(result.persistedPreseal.hashAddressVerified).toBe(false);
  });

  it("rejects persisted preseal bytes that do not match their hash address", async () => {
    const fixture = executionFixture();
    const original = fixture.dependencies.readPersistedPreseal;
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      {
        ...fixture.dependencies,
        readPersistedPreseal: async () => {
          const persisted = await original();
          if (persisted == null) return null;
          return {
            ...persisted,
            artifact: { ...persisted.artifact, sha256: sha("0") },
          };
        },
      },
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual([
      "independent_persisted_preseal_hash_mismatch",
    ]);
    expect(result.persistedPreseal.hashAddressVerified).toBe(false);
  });

  it("keeps a policy-admitted external process at replay-required status", async () => {
    const fixture = executionFixture();
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result).toMatchObject({
      status: "execution_observed_scientific_replay_required",
      independentReplicationArtifact: null,
      independentNumericalReplicationReady: false,
      primaryReceipt: { filesystemVerified: true },
      persistedPreseal: { hashAddressVerified: true },
    });
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "independent_primary_source_lineage_comparison_unavailable",
        "independent_implementation_lineage_not_established",
        "independent_exact_copy_check_tripwire_only",
        "independent_primary_content_lineage_exclusion_not_established",
        "independent_field_level_content_replay_required",
        "independent_replication_evidence_not_emitted",
      ]),
    );
  });

  it("turns a successful process with copied primary bytes into not-ready", async () => {
    const fixture = executionFixture({ outputSha: sha("9") });
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.status).toBe("not_ready");
    expect(result.kernelObservation).not.toBeNull();
    expect(result.blockers).toEqual([
      "independent_output_copies_primary_artifact:independent_replay_bundle",
    ]);
    expect(result.independentReplicationArtifact).toBeNull();
  });

  it("returns typed not-ready when the approved executable is absent", async () => {
    const fixture = executionFixture({
      executablePath: path.resolve(
        process.cwd(),
        `missing-independent-executable-${process.pid}`,
      ),
    });
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual(["independent_executable_missing"]);
    expect(result.kernelObservation).toBeNull();
    expect(result.independentReplicationArtifact).toBeNull();
  });

  it("rejects a preseal timestamp that predates primary completion", async () => {
    const fixture = executionFixture();
    fixture.presealedRunSpec.generatedAt = "2026-07-20T00:00:00.300Z";
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual([
      "independent_primary_receipt_not_verified",
    ]);
  });

  it("rejects a preseal that omits or substitutes verified primary output bytes", async () => {
    const fixture = executionFixture();
    fixture.presealedRunSpec.primaryOutputs[0].sha256 = sha("0");
    const result = await executeNhm2IndependentNumericalReplicationForTest(
      fixture.input,
      fixture.dependencies,
    );

    expect(result.status).toBe("not_ready");
    expect(result.blockers).toEqual([
      "independent_primary_output_inventory_mismatch",
    ]);
  });
});
