import { describe, expect, it } from "vitest";

import {
  buildCasimirFormalVerificationCertificateV2,
  validateCasimirFormalVerificationCertificateV2AgainstRequest,
  validateCasimirFormalVerificationCertificateV2Integrity,
} from "../casimir-formal-verification-certificate.v2";
import {
  buildCasimirFormalVerificationRequestV2,
  validateCasimirFormalVerificationRequestV2Integrity,
} from "../casimir-formal-verification-request.v2";

const hash = (character: string): string => character.repeat(64);

const requestInput = () => ({
  requestId: "formal-v2:request:1",
  generatedAt: "2026-07-29T00:00:00.000Z",
  casimirSpec: {
    specId: "casimir-spec:gr-maxwell",
    schemaVersion: "casimir_spec_scientific_claim_ir/v1" as const,
    semanticSha256: hash("1"),
    artifactSha256: hash("2"),
  },
  semanticClaim: {
    claimId: "claim:gr-maxwell:local-identity",
    propositionSha256: hash("3"),
    candidateBadgeIds: ["badge:gr-maxwell"],
  },
  formalArtifact: {
    formalArtifactId:
      "casimir:lanyon:gr_hyperbolic_maxwell_1d:formal_source",
    sourceAuditArtifactSha256: hash("4"),
    theoremName: "xHyperbolicity",
    theoremModule: "gr_hyperbolic_maxwell_1d",
    sourceSha256: hash("5"),
    declarationSha256: hash("6"),
    propositionSourceSha256: hash("7"),
    observedTheoremTypeSha256: hash("8"),
    emitterId: "lanyon",
    emitterRevisionSha256: hash("9"),
  },
  semanticToLeanBinding: {
    bindingId: "semantic-lean-binding:1",
    schemaVersion: "casimir_semantic_to_lean_binding/v1" as const,
    artifactSha256: hash("a"),
    bindingKind: "reviewed_translation_mapping" as const,
    status: "reviewed" as const,
    claimId: "claim:gr-maxwell:local-identity",
    semanticPropositionSha256: hash("3"),
    formalArtifactId:
      "casimir:lanyon:gr_hyperbolic_maxwell_1d:formal_source",
    observedTheoremTypeSha256: hash("8"),
    reviewerPolicyId: "casimir.formal.semantic-binding-review.v1",
    reviewerPolicySha256: hash("b"),
    limitations: ["does_not_validate_physical_truth"],
  },
  masterProblem: {
    schemaVersion: "theory_master_problem/v1" as const,
    planId: "master-problem:gr-maxwell",
    artifactSha256: hash("c"),
  },
  derivationProgram: {
    schemaVersion: "theory_derivation_program/v1" as const,
    programId: "derivation:gr-maxwell",
    sourceMasterProblemPlanId: "master-problem:gr-maxwell",
    artifactSha256: hash("d"),
  },
  theoryGraph: {
    graphId: "theory-badge-graph",
    snapshotSha256: hash("e"),
  },
  catalogSnapshots: [
    {
      catalogId: "formal-artifact-family-audit",
      snapshotSha256: hash("f"),
    },
  ],
  formalEnvironment: {
    prover: "lean4" as const,
    environmentPolicyId: "lean4-mathlib:gr-maxwell",
    environmentPolicySha256: hash("0"),
    pinnedVersion: "4.31.0+68218e876d2a38b1985b8590fff244a83c321783",
    kernelBinarySha256: hash("1"),
    dependencyLockSha256: hash("2"),
    importClosureSha256: hash("3"),
    imports: [
      {
        module: "Mathlib",
        sourceSha256: hash("4"),
        objectSha256: hash("5"),
      },
    ],
    declaredAxiomIds: ["propext"],
    allowedAxiomIds: ["propext"],
  },
  executionPolicy: {
    replayCount: 2 as const,
    timeoutMs: 300_000,
    maxMemoryBytes: 1024 * 1024 * 1024,
    maxOutputBytes: 4 * 1024 * 1024,
    sandboxExecutorCapabilityId:
      "casimir.sandbox.formal-replay.external-worker.v1",
    sandboxExecutorCapabilitySha256: hash("6"),
    networkAllowed: false as const,
    arbitraryCommandAllowed: false as const,
    outerObservedProcessRequired: true as const,
    operatingSystemMemoryLimitRequired: true as const,
    operatingSystemProcessLimitRequired: true as const,
    operatingSystemFilesystemIsolationRequired: true as const,
    operatingSystemNetworkIsolationRequired: true as const,
    hostWorkstationExecutionAllowed: false as const,
  },
});

describe("Casimir formal verification v2 contracts", () => {
  it("keeps semantic proposition and observed Lean theorem type separate", async () => {
    const request =
      await buildCasimirFormalVerificationRequestV2(requestInput());
    expect(request.semanticClaim.propositionSha256).not.toBe(
      request.formalArtifact.observedTheoremTypeSha256,
    );
    expect(request.semanticToLeanBinding).toMatchObject({
      semanticPropositionSha256: request.semanticClaim.propositionSha256,
      observedTheoremTypeSha256:
        request.formalArtifact.observedTheoremTypeSha256,
    });
    expect(
      await validateCasimirFormalVerificationRequestV2Integrity(request),
    ).toEqual([]);
  });

  it("rejects a semantic/formal substitution even after request rehashing", async () => {
    const input = requestInput();
    input.semanticToLeanBinding.observedTheoremTypeSha256 = hash("7");
    const request = await buildCasimirFormalVerificationRequestV2(input);
    expect(
      await validateCasimirFormalVerificationRequestV2Integrity(request),
    ).toContain(
      "semantic binding theorem type does not match formal artifact",
    );
  });

  it("rejects scientific replay that permits direct workstation execution", async () => {
    const input = requestInput();
    (
      input.executionPolicy as typeof input.executionPolicy & {
        hostWorkstationExecutionAllowed: boolean;
      }
    ).hostWorkstationExecutionAllowed = true;
    const request = await buildCasimirFormalVerificationRequestV2(
      input as Parameters<
        typeof buildCasimirFormalVerificationRequestV2
      >[0],
    );
    expect(
      await validateCasimirFormalVerificationRequestV2Integrity(request),
    ).toContain("executionPolicy authority boundary is invalid");
  });

  it("builds a passing evidence-only certificate bound to both identities", async () => {
    const request =
      await buildCasimirFormalVerificationRequestV2(requestInput());
    const certificate =
      await buildCasimirFormalVerificationCertificateV2({
        generatedAt: "2026-07-29T00:05:00.000Z",
        certificateId: "formal-v2:certificate:1",
        request: {
          schemaVersion: request.schemaVersion,
          requestId: request.requestId,
          artifactSha256: request.artifactSha256,
          semanticPropositionSha256:
            request.semanticClaim.propositionSha256,
          candidateBadgeIds:
            request.semanticClaim.candidateBadgeIds,
          observedTheoremTypeSha256:
            request.formalArtifact.observedTheoremTypeSha256,
          semanticToLeanBindingSha256:
            request.semanticToLeanBinding.artifactSha256,
          casimirSpecId: request.casimirSpec.specId,
          casimirSpecSemanticSha256: request.casimirSpec.semanticSha256,
          casimirSpecArtifactSha256:
            request.casimirSpec.artifactSha256,
          masterProblemPlanId: request.masterProblem.planId,
          masterProblemArtifactSha256:
            request.masterProblem.artifactSha256,
          derivationProgramId:
            request.derivationProgram.programId,
          derivationProgramArtifactSha256:
            request.derivationProgram.artifactSha256,
          graphId: request.theoryGraph.graphId,
          graphSnapshotSha256: request.theoryGraph.snapshotSha256,
        },
        status: "passed",
        theorem: {
          claimId: request.semanticClaim.claimId,
          formalArtifactId: request.formalArtifact.formalArtifactId,
          sourceAuditArtifactSha256:
            request.formalArtifact.sourceAuditArtifactSha256,
          theoremName: request.formalArtifact.theoremName,
          theoremModule: request.formalArtifact.theoremModule,
          sourceSha256: request.formalArtifact.sourceSha256,
          declarationSha256: request.formalArtifact.declarationSha256,
          propositionSourceSha256:
            request.formalArtifact.propositionSourceSha256,
          observedTheoremTypeSha256:
            request.formalArtifact.observedTheoremTypeSha256,
          emittedSourceSha256:
            request.formalArtifact.sourceSha256,
        },
        environment: {
          prover: "lean4",
          pinnedVersion: request.formalEnvironment.pinnedVersion,
          environmentPolicySha256:
            request.formalEnvironment.environmentPolicySha256,
          kernelBinarySha256:
            request.formalEnvironment.kernelBinarySha256,
          dependencyLockSha256:
            request.formalEnvironment.dependencyLockSha256,
          importClosureSha256:
            request.formalEnvironment.importClosureSha256,
          imports: request.formalEnvironment.imports,
        },
        sandbox: {
          executorCapabilityId:
            request.executionPolicy.sandboxExecutorCapabilityId,
          executorCapabilitySha256:
            request.executionPolicy.sandboxExecutorCapabilitySha256,
          sandboxPolicySha256: hash("c"),
          attestationSha256: hash("d"),
          workerId: "worker:formal-replay:isolated",
          memoryLimitBytes: request.executionPolicy.maxMemoryBytes,
          processLimit: 8,
          timeoutMs: request.executionPolicy.timeoutMs,
          outputLimitBytes:
            request.executionPolicy.maxOutputBytes,
          peakMemoryBytes: 512 * 1024 * 1024,
          outputBytes: 1024,
          oomKilled: false,
          timedOut: false,
          outputLimitExceeded: false,
          operatingSystemMemoryLimitApplied: true,
          operatingSystemProcessLimitApplied: true,
          operatingSystemFilesystemIsolationApplied: true,
          operatingSystemNetworkIsolationApplied: true,
          hostWorkstationExecution: false,
        },
        replay: {
          observationMode: "outer_observed_process",
          requiredReplayCount: 2,
          completedReplayCount: 2,
          byteIdentical: true,
          aggregateTranscriptSha256: hash("7"),
          runs: [
            {
              replayIndex: 1,
              exitCode: 0,
              stdoutSha256: hash("8"),
              stderrSha256: hash("9"),
              transcriptSha256: hash("a"),
              startedAt: "2026-07-29T00:01:00.000Z",
              completedAt: "2026-07-29T00:02:00.000Z",
            },
            {
              replayIndex: 2,
              exitCode: 0,
              stdoutSha256: hash("8"),
              stderrSha256: hash("9"),
              transcriptSha256: hash("a"),
              startedAt: "2026-07-29T00:03:00.000Z",
              completedAt: "2026-07-29T00:04:00.000Z",
            },
          ],
        },
        axiomAudit: {
          declaredAxiomIds: ["propext"],
          allowedAxiomIds: ["propext"],
          usedAxiomIds: ["propext"],
          hiddenAxiomsDetected: false,
          reportSha256: hash("b"),
        },
        blockers: [],
      });

    expect(
      await validateCasimirFormalVerificationCertificateV2AgainstRequest(
        certificate,
        request,
      ),
    ).toEqual([]);
    expect(certificate.authority).toMatchObject({
      formalPropositionChecked: true,
      semanticBindingApplied: true,
      semanticAndFormalIdentitySeparated: true,
      validatesScientificTruth: false,
      validatesTheory: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    });

    const {
      artifactId: _artifactId,
      schemaVersion: _schemaVersion,
      artifactSha256: _artifactSha256,
      authority: _authority,
      ...certificateInput
    } = certificate;
    const substituted =
      await buildCasimirFormalVerificationCertificateV2({
        ...certificateInput,
        theorem: {
          ...certificate.theorem,
          theoremName: "substitutedTheoremName",
        },
        environment: {
          ...certificate.environment,
          pinnedVersion: "4.31.0+substituted",
        },
        sandbox: {
          ...certificate.sandbox,
          timeoutMs: certificate.sandbox.timeoutMs + 1,
          outputLimitBytes:
            certificate.sandbox.outputLimitBytes + 1,
        },
        axiomAudit: {
          ...certificate.axiomAudit,
          allowedAxiomIds: ["choice", "propext"],
        },
      });
    expect(
      await validateCasimirFormalVerificationCertificateV2AgainstRequest(
        substituted,
        request,
      ),
    ).toEqual(
      expect.arrayContaining([
        "certificate formal artifact identity does not match request",
        "certificate formal environment does not match request",
        "certificate sandbox does not match request",
        "certificate axiom policy does not match request",
      ]),
    );
    expect(
      await validateCasimirFormalVerificationCertificateV2Integrity({
        ...certificate,
        command: "lean Untrusted.lean",
      }),
    ).toContain(
      "$ must contain exactly: artifactId, schemaVersion, generatedAt, certificateId, artifactSha256, request, status, theorem, environment, sandbox, replay, axiomAudit, blockers, authority",
    );
  });

  it("rejects a passing certificate with a substituted formal type", async () => {
    const request =
      await buildCasimirFormalVerificationRequestV2(requestInput());
    const certificate =
      await buildCasimirFormalVerificationCertificateV2({
        generatedAt: "2026-07-29T00:05:00.000Z",
        certificateId: "formal-v2:certificate:substituted",
        request: {
          schemaVersion: request.schemaVersion,
          requestId: request.requestId,
          artifactSha256: request.artifactSha256,
          semanticPropositionSha256:
            request.semanticClaim.propositionSha256,
          candidateBadgeIds:
            request.semanticClaim.candidateBadgeIds,
          observedTheoremTypeSha256: hash("f"),
          semanticToLeanBindingSha256:
            request.semanticToLeanBinding.artifactSha256,
          casimirSpecId: request.casimirSpec.specId,
          casimirSpecSemanticSha256: request.casimirSpec.semanticSha256,
          casimirSpecArtifactSha256:
            request.casimirSpec.artifactSha256,
          masterProblemPlanId: request.masterProblem.planId,
          masterProblemArtifactSha256:
            request.masterProblem.artifactSha256,
          derivationProgramId:
            request.derivationProgram.programId,
          derivationProgramArtifactSha256:
            request.derivationProgram.artifactSha256,
          graphId: request.theoryGraph.graphId,
          graphSnapshotSha256: request.theoryGraph.snapshotSha256,
        },
        status: "blocked",
        theorem: {
          claimId: request.semanticClaim.claimId,
          formalArtifactId: request.formalArtifact.formalArtifactId,
          sourceAuditArtifactSha256:
            request.formalArtifact.sourceAuditArtifactSha256,
          theoremName: request.formalArtifact.theoremName,
          theoremModule: request.formalArtifact.theoremModule,
          sourceSha256: request.formalArtifact.sourceSha256,
          declarationSha256: request.formalArtifact.declarationSha256,
          propositionSourceSha256:
            request.formalArtifact.propositionSourceSha256,
          observedTheoremTypeSha256: hash("f"),
          emittedSourceSha256:
            request.formalArtifact.sourceSha256,
        },
        environment: {
          prover: "lean4",
          pinnedVersion: request.formalEnvironment.pinnedVersion,
          environmentPolicySha256:
            request.formalEnvironment.environmentPolicySha256,
          kernelBinarySha256:
            request.formalEnvironment.kernelBinarySha256,
          dependencyLockSha256:
            request.formalEnvironment.dependencyLockSha256,
          importClosureSha256:
            request.formalEnvironment.importClosureSha256,
          imports: request.formalEnvironment.imports,
        },
        sandbox: {
          executorCapabilityId:
            request.executionPolicy.sandboxExecutorCapabilityId,
          executorCapabilitySha256:
            request.executionPolicy.sandboxExecutorCapabilitySha256,
          sandboxPolicySha256: hash("c"),
          attestationSha256: hash("d"),
          workerId: "worker:formal-replay:isolated",
          memoryLimitBytes: request.executionPolicy.maxMemoryBytes,
          processLimit: 8,
          timeoutMs: request.executionPolicy.timeoutMs,
          outputLimitBytes:
            request.executionPolicy.maxOutputBytes,
          peakMemoryBytes: null,
          outputBytes: null,
          oomKilled: false,
          timedOut: false,
          outputLimitExceeded: false,
          operatingSystemMemoryLimitApplied: true,
          operatingSystemProcessLimitApplied: true,
          operatingSystemFilesystemIsolationApplied: true,
          operatingSystemNetworkIsolationApplied: true,
          hostWorkstationExecution: false,
        },
        replay: {
          observationMode: "outer_observed_process",
          requiredReplayCount: 2,
          completedReplayCount: 0,
          byteIdentical: false,
          aggregateTranscriptSha256: hash("7"),
          runs: [],
        },
        axiomAudit: {
          declaredAxiomIds: ["propext"],
          allowedAxiomIds: ["propext"],
          usedAxiomIds: [],
          hiddenAxiomsDetected: false,
          reportSha256: hash("b"),
        },
        blockers: [
          {
            code: "observed_theorem_type_mismatch",
            message: "Observed theorem type does not match the request.",
            evidenceRefs: ["formal-v2:request:1"],
          },
        ],
      });
    expect(
      await validateCasimirFormalVerificationCertificateV2AgainstRequest(
        certificate,
        request,
      ),
    ).toContain(
      "certificate observed theorem type does not match request",
    );
  });

  it("returns issues instead of throwing for malformed certificate bodies", async () => {
    await expect(
      validateCasimirFormalVerificationCertificateV2Integrity({
        artifactId: "casimir_formal_verification_certificate_v2",
        schemaVersion: "casimir_formal_verification_certificate/v2",
        generatedAt: "invalid",
        certificateId: "",
        artifactSha256: "bad",
        request: {},
        status: "passed",
        theorem: {},
        environment: {},
        replay: { completedReplayCount: 2 },
        axiomAudit: {},
        blockers: null,
        authority: {},
      }),
    ).resolves.toEqual(expect.arrayContaining(["certificateId is invalid"]));
  });
});
