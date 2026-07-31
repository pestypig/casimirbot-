import { afterEach, describe, expect, it } from "vitest";

import {
  buildCasimirFormalExecutionEnrollmentV2,
  type CasimirFormalExecutionEnrollmentV2,
} from "../../../../shared/contracts/casimir-formal-execution-enrollment.v2";
import {
  buildCasimirFormalSandboxExecutorCapabilityV1,
  type CasimirFormalSandboxExecutorCapabilityV1,
} from "../../../../shared/contracts/casimir-formal-sandbox-executor-capability.v1";
import {
  buildCasimirFormalVerificationCertificateV2,
  type CasimirFormalVerificationCertificateV2,
} from "../../../../shared/contracts/casimir-formal-verification-certificate.v2";
import {
  buildCasimirFormalVerificationRequestV2,
  type CasimirFormalVerificationRequestV2,
} from "../../../../shared/contracts/casimir-formal-verification-request.v2";
import type { TheoryExperimentProcedureV1 } from "../../../../shared/contracts/theory-experiment-procedure.v1";
import { computeCasimirSpecValueSha256V1 } from "../../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../../../shared/theory/nhm2-theory-badges";
import { buildTheoryContextReflection } from "../../../../shared/theory/theory-context-reflector";
import { compileTheoryExperimentProcedureV1 } from "../../../../shared/theory/theory-experiment-procedure-compiler";
import {
  computeCasimirFormalVerificationSealedExecutionSha256V2,
  createCasimirFormalVerificationExecutionCatalogV2,
  type CasimirFormalVerificationSealedExecutionV2,
} from "../casimir-formal-verification-execution-catalog.v2";
import {
  installCasimirFormalExecutionRegistryAtServerBootstrapV2,
} from "../casimir-formal-execution-registry-bootstrap.v2";
import {
  createCasimirFormalVerifierJobServiceV2,
  inspectCasimirFormalVerifierRuntimeReadinessV2,
} from "../casimir-formal-verifier-job-service.v2";
import {
  installCasimirTheoryExecutionRuntimeApprovalDependenciesForServerV1,
  installCasimirTheoryExecutionStateDependenciesForServerV1,
  resetCasimirTheoryExecutionServerCompositionForTestsV1,
} from "../casimir-theory-execution-server-composition";
import { createInMemoryCasimirTheoryExecutionStateStoreV1 } from "../casimir-theory-execution-state-store";
import {
  buildRuntimeToolConfirmationTestReceipt,
  createTrustedRuntimeTestReplayLedger,
  verifyTrustedRuntimeTestReceipt,
} from "./runtime-tool-confirmation-fixture";

const hash = (character: string): string => character.repeat(64);
const TURN_ID = "ask:formal-v2:prepare";
const PROFILE_ID = "developer-formal-v2";
const CATALOG_ID = "formal-execution:gr-maxwell:1d:v2";
const durableTestStateStore = () => ({
  ...createInMemoryCasimirTheoryExecutionStateStoreV1(),
  durability: "durable_postgres" as const,
});

const drainAsyncJob = async (): Promise<void> => {
  for (let index = 0; index < 10; index += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 25));
};

const procedureEnvelope = (
  procedure: TheoryExperimentProcedureV1,
): Record<string, unknown> => ({
  schema: "helix.current_turn_artifact.v1",
  turn_id: TURN_ID,
  artifact_id: `${TURN_ID}:procedure`,
  assistant_answer: false,
  terminal_eligible: false,
  payload: {
    schema: "casimir.theory_experiment_procedure.observation.v1",
    status: "succeeded",
    procedure,
    assistant_answer: false,
    terminal_eligible: false,
  },
});

async function buildProcedure(): Promise<TheoryExperimentProcedureV1> {
  const graph = buildNhm2TheoryBadgeGraphV1();
  const generatedAt = "2026-07-29T00:00:00.000Z";
  const badgeId = "study.casimir_dp.evidence_map_stage3";
  const procedureId = "procedure:gr-maxwell:formal-v2";
  const reflection = buildTheoryContextReflection({
    graph,
    prompt:
      "Compare the admitted definition with a pinned one-dimensional formal lane.",
    mentionedDomains: [badgeId],
    generatedAt,
    reflectionId: `${TURN_ID}:reflection`,
  });
  return compileTheoryExperimentProcedureV1({
    graph,
    turnId: TURN_ID,
    procedureId,
    generatedAt,
    reflection,
    request: {
      operation: "compare",
      target: "one-dimensional periodic advection diffusion",
      targetObservable: "concentration_field",
      scaleLog10M: { min: -3, max: 0 },
      coordinateFrame: "laboratory",
      initialBoundaryConditions: [
        "periodic domain",
        "sinusoidal initial concentration",
      ],
      formalSystem: null,
      requestedPrecision: "1e-3",
      evidenceMaturityCeiling: "diagnostic",
      normalizationStatus: "explicit",
    },
    selectedBadgeIds: [badgeId],
    evidenceBindings: [
      {
        artifactRef: `${TURN_ID}:source-audit`,
        kind: "research_paper_sidecar",
        schema: "helix.paper_evidence_sidecar.v1",
        sourceTurnId: TURN_ID,
        admissionTurnId: TURN_ID,
        contentSha256: hash("a"),
        admission: "current_turn_admitted",
        authority: "evidence_only",
        assistantAnswer: false,
        terminalEligible: false,
      },
      {
        artifactRef: `${TURN_ID}:semantic-admission`,
        kind: "semantic_admission",
        schema: "casimir.theory_semantic_admitter.observation.v1",
        sourceTurnId: TURN_ID,
        admissionTurnId: TURN_ID,
        contentSha256: hash("b"),
        admission: "current_turn_admitted",
        lineage: {
          sourceKind: "semantic_claim_ir",
          procedureId,
          candidateBadgeIds: [badgeId],
          casimirSpecId: "casimir-spec:gr-maxwell",
          casimirSpecSemanticSha256: hash("1"),
          casimirSpecArtifactSha256: hash("2"),
          claims: [
            {
              claimId: "claim:gr-maxwell:local-identity",
              propositionSha256: hash("3"),
              observableIds: [],
            },
          ],
          sourceGraphId: graph.graphId,
          sourceGraphSnapshotSha256: hash("e"),
          sourceMasterProblemPlanId: null,
          sourceMasterProblemArtifactSha256: null,
          sourceDerivationProgramId: null,
          sourceDerivationProgramArtifactSha256: null,
          requestArtifactSha256: null,
          frozenCase: null,
        },
        authority: "evidence_only",
        assistantAnswer: false,
        terminalEligible: false,
      },
    ],
    lanyon: {
      requested: true,
      caseId: "advection_diffusion_full_1d",
    },
  });
}

async function buildSealedExecution(
  procedure: TheoryExperimentProcedureV1,
): Promise<{
  sealed: CasimirFormalVerificationSealedExecutionV2;
  capability: CasimirFormalSandboxExecutorCapabilityV1;
}> {
  const capability =
    await buildCasimirFormalSandboxExecutorCapabilityV1({
      generatedAt: "2026-07-29T00:00:00.000Z",
      capabilityId: "casimir.formal.external-sandbox.test.v1",
      platform: "linux",
      architecture: "x64",
      sandboxPolicySha256: hash("c"),
      enforcement: {
        operatingSystemMemoryLimitEnforced: true,
        operatingSystemProcessLimitEnforced: true,
        filesystemIsolationEnforced: true,
        networkIsolationEnforced: true,
        wallTimeoutEnforced: true,
        outputByteLimitEnforced: true,
        processTreeContainmentEnforced: true,
        hostWorkstationExecutionAllowed: false,
      },
      resourceCeilings: {
        maxMemoryBytes: 2 * 1024 * 1024 * 1024,
        maxProcessCount: 8,
        timeoutMs: 600_000,
        maxOutputBytes: 8 * 1024 * 1024,
      },
      attestation: {
        issuer: "casimir-test-control-plane",
        evidenceSha256: hash("d"),
      },
    });
  const [masterProblemArtifactSha256, derivationProgramArtifactSha256] =
    await Promise.all([
      computeCasimirSpecValueSha256V1(procedure.masterProblem),
      computeCasimirSpecValueSha256V1(
        procedure.derivationProgram,
      ),
    ]);
  const request =
    await buildCasimirFormalVerificationRequestV2({
      generatedAt: "2026-07-29T00:01:00.000Z",
      requestId: "formal-v2:request:gr-maxwell",
      casimirSpec: {
        specId: "casimir-spec:gr-maxwell",
        schemaVersion: "casimir_spec_scientific_claim_ir/v1",
        semanticSha256: hash("1"),
        artifactSha256: hash("2"),
      },
      semanticClaim: {
        claimId: "claim:gr-maxwell:local-identity",
        propositionSha256: hash("3"),
        candidateBadgeIds: [
          "study.casimir_dp.evidence_map_stage3",
        ],
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
        bindingId: "semantic-lean-binding:gr-maxwell",
        schemaVersion: "casimir_semantic_to_lean_binding/v1",
        artifactSha256: hash("a"),
        bindingKind: "reviewed_translation_mapping",
        status: "reviewed",
        claimId: "claim:gr-maxwell:local-identity",
        semanticPropositionSha256: hash("3"),
        formalArtifactId:
          "casimir:lanyon:gr_hyperbolic_maxwell_1d:formal_source",
        observedTheoremTypeSha256: hash("8"),
        reviewerPolicyId: "casimir.semantic-review.v1",
        reviewerPolicySha256: hash("b"),
        limitations: ["does_not_validate_physical_truth"],
      },
      masterProblem: {
        schemaVersion: "theory_master_problem/v1",
        planId: procedure.masterProblem.planId,
        artifactSha256: masterProblemArtifactSha256,
      },
      derivationProgram: {
        schemaVersion: "theory_derivation_program/v1",
        programId: procedure.derivationProgram.programId,
        sourceMasterProblemPlanId:
          procedure.derivationProgram.sourceMasterProblemPlanId,
        artifactSha256:
          derivationProgramArtifactSha256,
      },
      theoryGraph: {
        graphId: procedure.graphId,
        snapshotSha256: hash("e"),
      },
      catalogSnapshots: [
        {
          catalogId: "formal-artifact-family-audit",
          snapshotSha256: hash("f"),
        },
      ],
      formalEnvironment: {
        prover: "lean4",
        environmentPolicyId: "lean4-mathlib:gr-maxwell",
        environmentPolicySha256: hash("0"),
        pinnedVersion:
          "4.31.0+68218e876d2a38b1985b8590fff244a83c321783",
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
        replayCount: 2,
        timeoutMs: 300_000,
        maxMemoryBytes: 1024 * 1024 * 1024,
        maxOutputBytes: 4 * 1024 * 1024,
        sandboxExecutorCapabilityId: capability.capabilityId,
        sandboxExecutorCapabilitySha256:
          capability.artifactSha256,
        networkAllowed: false,
        arbitraryCommandAllowed: false,
        outerObservedProcessRequired: true,
        operatingSystemMemoryLimitRequired: true,
        operatingSystemProcessLimitRequired: true,
        operatingSystemFilesystemIsolationRequired: true,
        operatingSystemNetworkIsolationRequired: true,
        hostWorkstationExecutionAllowed: false,
      },
    });
  return {
    capability,
    sealed: {
      executionCatalogEntryId: CATALOG_ID,
      procedure: {
        procedureId: procedure.procedureId,
        procedureSha256: procedure.procedureSha256,
      },
      request,
      executorCapability: capability,
      sourceBundle: {
        bundleId: "formal-source-bundle:gr-maxwell:1d",
        artifactSha256: hash("6"),
        formalSourceSha256: request.formalArtifact.sourceSha256,
        importClosureSha256:
          request.formalEnvironment.importClosureSha256,
        resolverRef: "casimir-formal-bundle:gr-maxwell-1d",
      },
    },
  };
}

async function buildEnrollment(
  sealed: CasimirFormalVerificationSealedExecutionV2,
): Promise<CasimirFormalExecutionEnrollmentV2> {
  const request = sealed.request;
  return buildCasimirFormalExecutionEnrollmentV2({
    generatedAt: "2026-07-29T00:01:30.000Z",
    enrollmentId: "formal-enrollment:gr-maxwell:1d:v2",
    executionCatalogEntryId: sealed.executionCatalogEntryId,
    sealedExecutionSha256:
      await computeCasimirFormalVerificationSealedExecutionSha256V2(
        sealed,
      ),
    procedure: {
      schemaVersion: "theory_experiment_procedure/v1",
      procedureId: sealed.procedure.procedureId,
      procedureSha256: sealed.procedure.procedureSha256,
    },
    request: {
      schemaVersion: request.schemaVersion,
      requestId: request.requestId,
      artifactSha256: request.artifactSha256,
    },
    sourceLineage: {
      sourceAuditId: "source-audit:gr-maxwell:test",
      sourceAuditArtifactSha256:
        request.formalArtifact.sourceAuditArtifactSha256,
      generationLineageAuditId:
        "generation-lineage-audit:gr-maxwell:test",
      generationLineageAuditArtifactSha256: hash("d"),
      repository: {
        producerId: "lanyon",
        uri: "https://github.com/lanyonai/GeneralRelativisticMaxwell",
        commitSha: "b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3",
        selectedSourceTreeSha256: hash("e"),
      },
      caseId: "gr_hyperbolic_maxwell_1d",
      specification: {
        logicalPath:
          "specifications/gr_hyperbolic_maxwell_1d.rkt",
        sha256: hash("f"),
      },
      formalSource: {
        logicalPath: "proofs/gr_hyperbolic_maxwell_1d.lean",
        sha256: request.formalArtifact.sourceSha256,
        moduleName: request.formalArtifact.theoremModule,
      },
      implementationSource: {
        logicalPath:
          "implementations/gr_hyperbolic_maxwell_1d.c",
        sha256: hash("0"),
        numericModel: "c_ieee754_binary64",
        entrypointStatus: "placeholder_noop",
        formalRefinementStatus: "unassessed",
      },
      generator: {
        registrationId: "generator-registration:lanyon:test",
        producerId: "lanyon",
        generatorArtifactId: "lanyon:generator:test",
        generatorRevisionSha256:
          request.formalArtifact.emitterRevisionSha256,
        invocationManifestSha256: hash("1"),
        generationReceiptId: "lanyon:generation-receipt:test",
        generationReceiptSha256: hash("2"),
        outputBundleSha256: hash("3"),
      },
    },
    theorem: {
      formalArtifactId: request.formalArtifact.formalArtifactId,
      theoremName: request.formalArtifact.theoremName,
      theoremModule: request.formalArtifact.theoremModule,
      declarationSha256: request.formalArtifact.declarationSha256,
      propositionSourceSha256:
        request.formalArtifact.propositionSourceSha256,
      observedTheoremTypeSha256:
        request.formalArtifact.observedTheoremTypeSha256,
    },
    semanticBinding: {
      bindingId: request.semanticToLeanBinding.bindingId,
      artifactSha256:
        request.semanticToLeanBinding.artifactSha256,
      status: request.semanticToLeanBinding.status,
      claimId: request.semanticToLeanBinding.claimId,
      semanticPropositionSha256:
        request.semanticToLeanBinding.semanticPropositionSha256,
    },
    graph: {
      graphId: request.theoryGraph.graphId,
      snapshotSha256: request.theoryGraph.snapshotSha256,
    },
    environment: {
      policyId: request.formalEnvironment.environmentPolicyId,
      policySha256:
        request.formalEnvironment.environmentPolicySha256,
      pinnedVersion: request.formalEnvironment.pinnedVersion,
      kernelBinarySha256:
        request.formalEnvironment.kernelBinarySha256,
      dependencyLockSha256:
        request.formalEnvironment.dependencyLockSha256,
      importClosureSha256:
        request.formalEnvironment.importClosureSha256,
    },
    sourceBundle: sealed.sourceBundle,
    executorCapability: {
      schemaVersion: sealed.executorCapability.schemaVersion,
      capabilityId: sealed.executorCapability.capabilityId,
      artifactSha256: sealed.executorCapability.artifactSha256,
    },
  });
}

async function passingCertificate(
  request: CasimirFormalVerificationRequestV2,
  capability: CasimirFormalSandboxExecutorCapabilityV1,
): Promise<CasimirFormalVerificationCertificateV2> {
  return buildCasimirFormalVerificationCertificateV2({
    generatedAt: "2026-07-29T00:05:00.000Z",
    certificateId: "formal-v2:certificate:gr-maxwell",
    request: {
      schemaVersion: request.schemaVersion,
      requestId: request.requestId,
      artifactSha256: request.artifactSha256,
      semanticPropositionSha256:
        request.semanticClaim.propositionSha256,
      candidateBadgeIds: request.semanticClaim.candidateBadgeIds,
      observedTheoremTypeSha256:
        request.formalArtifact.observedTheoremTypeSha256,
      semanticToLeanBindingSha256:
        request.semanticToLeanBinding.artifactSha256,
      casimirSpecId: request.casimirSpec.specId,
      casimirSpecSemanticSha256: request.casimirSpec.semanticSha256,
      casimirSpecArtifactSha256: request.casimirSpec.artifactSha256,
      masterProblemPlanId: request.masterProblem.planId,
      masterProblemArtifactSha256:
        request.masterProblem.artifactSha256,
      derivationProgramId: request.derivationProgram.programId,
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
      emittedSourceSha256: request.formalArtifact.sourceSha256,
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
      executorCapabilityId: capability.capabilityId,
      executorCapabilitySha256: capability.artifactSha256,
      sandboxPolicySha256: capability.sandboxPolicySha256,
      attestationSha256: capability.attestation.evidenceSha256,
      workerId: "worker:formal-v2:test",
      memoryLimitBytes: request.executionPolicy.maxMemoryBytes,
      processLimit: capability.resourceCeilings.maxProcessCount,
      timeoutMs: request.executionPolicy.timeoutMs,
      outputLimitBytes: request.executionPolicy.maxOutputBytes,
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
}

async function fixture(input: {
  includeCatalog?: boolean;
  includeExecutor?: boolean;
  certificateTransform?: (
    certificate: CasimirFormalVerificationCertificateV2,
  ) => Promise<CasimirFormalVerificationCertificateV2>;
  sealedTransform?: (
    sealed: CasimirFormalVerificationSealedExecutionV2,
  ) => Promise<CasimirFormalVerificationSealedExecutionV2>;
} = {}) {
  let procedure: TheoryExperimentProcedureV1;
  try {
    procedure = await buildProcedure();
  } catch (error) {
    throw new Error("formal-v2 fixture procedure failed", {
      cause: error,
    });
  }
  let sealed: CasimirFormalVerificationSealedExecutionV2;
  let capability: CasimirFormalSandboxExecutorCapabilityV1;
  try {
    ({ sealed, capability } =
      await buildSealedExecution(procedure));
  } catch (error) {
    throw new Error("formal-v2 fixture sealed execution failed", {
      cause: error,
    });
  }
  if (input.sealedTransform) {
    sealed = await input.sealedTransform(sealed);
  }
  const enrollment = await buildEnrollment(sealed);
  const catalog =
    await createCasimirFormalVerificationExecutionCatalogV2([
      { enrollment, sealedExecution: sealed },
    ], {
      verifyEnrollmentRegistration: () => true,
    });
  const service = createCasimirFormalVerifierJobServiceV2({
    ...(input.includeCatalog === false
      ? {}
      : {
          resolveTrustedExecutionCatalogEntry:
            catalog.resolve,
          inspectTrustedExecutionCatalog: catalog.inspect,
        }),
    ...(input.includeExecutor === false
      ? {}
      : {
          resolveExternalSandboxExecutor: () => ({
            capabilityId: capability.capabilityId,
            artifactSha256: capability.artifactSha256,
            execute: async () => {
              const certificate = await passingCertificate(
                sealed.request,
                capability,
              );
              return input.certificateTransform
                ? input.certificateTransform(certificate)
                : certificate;
            },
          }),
        }),
    verifyTrustedRuntimeReceipt: verifyTrustedRuntimeTestReceipt,
    confirmationReplayLedger: createTrustedRuntimeTestReplayLedger(),
    stateStore: durableTestStateStore(),
    now: () => Date.parse("2026-07-29T00:00:30.000Z"),
  });
  return {
    service,
    procedure,
    sealed,
    enrollment,
    catalog,
    capability,
    authoritativeEvidenceArtifacts: [procedureEnvelope(procedure)],
  };
}

describe("Casimir formal verifier v2 external execution lifecycle", () => {
  afterEach(() => {
    resetCasimirTheoryExecutionServerCompositionForTestsV1();
  });

  it("reports redacted production composition readiness without resolving authority", async () => {
    expect(
      createCasimirFormalVerifierJobServiceV2().inspectConfiguration(),
    ).toEqual({
      schema: "casimir.theory_formal_verifier.runtime_readiness.v2",
      status: "blocked",
      composition: {
        executionCatalogResolverConfigured: false,
        executionCatalogInspectorConfigured: false,
        externalSandboxExecutorResolverConfigured: false,
        trustedReceiptVerifierConfigured: false,
        durableReplayLedgerConfigured: false,
        durableJobStateStoreConfigured: false,
      },
      catalog: {
        configured: false,
        entryCount: 0,
        issues: [],
      },
      configuredForExactResolutionAttempt: false,
      blockerCodes: [
        "formal_execution_catalog_unconfigured",
        "formal_execution_catalog_inspector_unconfigured",
        "formal_external_sandbox_executor_unconfigured",
        "runtime_approval_receipt_issuer_unconfigured",
        "runtime_approval_receipt_replay_ledger_unconfigured",
        "formal_durable_job_state_store_unconfigured",
      ],
      authority: expect.objectContaining({
        configurationEvidenceOnly: true,
        exactCatalogEntryResolved: false,
        exactExecutorResolved: false,
        formalPropositionChecked: false,
        assistantAnswer: false,
        terminalEligible: false,
      }),
    });

    const data = await fixture();
    expect(data.service.inspectConfiguration()).toMatchObject({
      status: "configured",
      composition: {
        executionCatalogResolverConfigured: true,
        executionCatalogInspectorConfigured: true,
        externalSandboxExecutorResolverConfigured: true,
        trustedReceiptVerifierConfigured: true,
        durableReplayLedgerConfigured: true,
        durableJobStateStoreConfigured: true,
      },
      catalog: {
        configured: true,
        entryCount: 1,
        issues: [],
      },
      configuredForExactResolutionAttempt: true,
      blockerCodes: [],
      authority: {
        configurationEvidenceOnly: true,
        exactCatalogEntryResolved: false,
        exactExecutorResolved: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    });
  });

  it("turns a persisted running job from a previous service process into an actionable failure", async () => {
    const stateStore = durableTestStateStore();
    await stateStore.put("job", "formal-job:interrupted", {
      ownerKey: `developer:${PROFILE_ID}`,
      jobId: "formal-job:interrupted",
      planId: "formal-plan:interrupted",
      sealedInputSha256: hash("a"),
      requestId: "formal-request:interrupted",
      status: "running",
      certificate: null,
      issues: [],
    });
    const restarted =
      createCasimirFormalVerifierJobServiceV2({ stateStore });

    await expect(
      restarted.readResult({
        accountType: "developer",
        profileId: PROFILE_ID,
        jobId: "formal-job:interrupted",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "failed",
      issues: ["formal_job_interrupted_by_server_restart"],
    });
    await expect(
      stateStore.get("job", "formal-job:interrupted"),
    ).resolves.toMatchObject({
      status: "failed",
      issues: ["formal_job_interrupted_by_server_restart"],
    });
  });

  it("fails readiness closed for empty, inconsistent, or failing catalog inspection", () => {
    const inspections: Array<{
      label: string;
      inspect: () => never | {
        schema: "casimir.formal_verification_execution_catalog.v2";
        configured: boolean;
        entryCount: number;
        entries: never[];
        issues: string[];
        authority: {
          serverInstalledCatalogOnly: true;
          callerSuppliedExecutionAuthority: false;
          assistantAnswer: false;
          terminalEligible: false;
        };
      };
      blocker: string;
    }> = [
      {
        label: "empty",
        inspect: () => ({
          schema:
            "casimir.formal_verification_execution_catalog.v2",
          configured: false,
          entryCount: 0,
          entries: [],
          issues: [],
          authority: {
            serverInstalledCatalogOnly: true,
            callerSuppliedExecutionAuthority: false,
            assistantAnswer: false,
            terminalEligible: false,
          },
        }),
        blocker: "formal_execution_catalog_empty_or_invalid",
      },
      {
        label: "inconsistent",
        inspect: () => ({
          schema:
            "casimir.formal_verification_execution_catalog.v2",
          configured: true,
          entryCount: 1,
          entries: [],
          issues: [],
          authority: {
            serverInstalledCatalogOnly: true,
            callerSuppliedExecutionAuthority: false,
            assistantAnswer: false,
            terminalEligible: false,
          },
        }),
        blocker: "formal_execution_catalog_inspection_invalid",
      },
      {
        label: "throwing",
        inspect: () => {
          throw new Error("inspector failure");
        },
        blocker: "formal_execution_catalog_inspection_failed",
      },
    ];
    for (const inspection of inspections) {
      const service = createCasimirFormalVerifierJobServiceV2({
        resolveTrustedExecutionCatalogEntry: () => null,
        inspectTrustedExecutionCatalog:
          inspection.inspect as never,
        resolveExternalSandboxExecutor: () => null,
        verifyTrustedRuntimeReceipt:
          verifyTrustedRuntimeTestReceipt,
        confirmationReplayLedger:
          createTrustedRuntimeTestReplayLedger(),
        stateStore: durableTestStateStore(),
      });
      expect(
        service.inspectConfiguration(),
        inspection.label,
      ).toMatchObject({
        status: "blocked",
        configuredForExactResolutionAttempt: false,
        blockerCodes: [inspection.blocker],
        authority: {
          exactCatalogEntryResolved: false,
          exactExecutorResolved: false,
          assistantAnswer: false,
          terminalEligible: false,
        },
      });
    }
  });

  it("installs only a fully preflighted registry and clears stale execution authority on replacement failure", async () => {
    const data = await fixture();
    installCasimirTheoryExecutionStateDependenciesForServerV1({
      formalStateStore: durableTestStateStore(),
    });
    installCasimirTheoryExecutionRuntimeApprovalDependenciesForServerV1(
      {
        verifyTrustedRuntimeReceipt:
          verifyTrustedRuntimeTestReceipt,
        confirmationReplayLedger:
          createTrustedRuntimeTestReplayLedger(),
      },
    );
    const executor = {
      capabilityId: data.capability.capabilityId,
      artifactSha256: data.capability.artifactSha256,
      execute: async () => {
        throw new Error(
          "registry bootstrap must not execute a formal job",
        );
      },
    };
    const validRegistry = {
      entries: [
        {
          enrollment: data.enrollment,
          sealedExecution: data.sealed,
        },
      ],
      verifyEnrollmentRegistration: () => true,
      resolveExternalSandboxExecutor: () => executor,
    };

    await expect(
      installCasimirFormalExecutionRegistryAtServerBootstrapV2(
        validRegistry,
      ),
    ).resolves.toMatchObject({
      configured: true,
      catalogConfigured: true,
      catalogEntryCount: 1,
      enrollmentRegistrationVerifierConfigured: true,
      externalSandboxExecutorResolverConfigured: true,
      executorCapabilitiesRequired: 1,
      executorCapabilitiesPreflighted: 1,
      catalogIssues: [],
      blockerCodes: [],
      authority: {
        trustedServerCompositionOnly: true,
        executesJobs: false,
        validatesScientificTruth: false,
        validatesTheory: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    });
    expect(
      inspectCasimirFormalVerifierRuntimeReadinessV2(),
    ).toMatchObject({
      status: "configured",
      catalog: {
        configured: true,
        entryCount: 1,
        issues: [],
      },
      configuredForExactResolutionAttempt: true,
      blockerCodes: [],
    });

    await expect(
      installCasimirFormalExecutionRegistryAtServerBootstrapV2({
        ...validRegistry,
        resolveExternalSandboxExecutor: () => ({
          ...executor,
          artifactSha256: hash("0"),
        }),
      }),
    ).resolves.toMatchObject({
      configured: false,
      catalogConfigured: true,
      catalogEntryCount: 1,
      executorCapabilitiesRequired: 1,
      executorCapabilitiesPreflighted: 0,
      blockerCodes: [
        "formal_external_sandbox_executor_capability_mismatch",
        "formal_external_sandbox_executor_preflight_incomplete",
      ],
    });
    expect(
      inspectCasimirFormalVerifierRuntimeReadinessV2(),
    ).toMatchObject({
      status: "blocked",
      composition: {
        executionCatalogResolverConfigured: false,
        executionCatalogInspectorConfigured: false,
        externalSandboxExecutorResolverConfigured: false,
        trustedReceiptVerifierConfigured: true,
        durableReplayLedgerConfigured: true,
      },
      configuredForExactResolutionAttempt: false,
      blockerCodes: [
        "formal_execution_catalog_unconfigured",
        "formal_execution_catalog_inspector_unconfigured",
        "formal_external_sandbox_executor_unconfigured",
      ],
    });

    await installCasimirFormalExecutionRegistryAtServerBootstrapV2(
      validRegistry,
    );
    await expect(
      installCasimirFormalExecutionRegistryAtServerBootstrapV2({
        ...validRegistry,
        resolveExternalSandboxExecutor: () => {
          throw new Error("external executor registry unavailable");
        },
      }),
    ).resolves.toMatchObject({
      configured: false,
      catalogConfigured: true,
      executorCapabilitiesRequired: 1,
      executorCapabilitiesPreflighted: 0,
      blockerCodes: [
        "formal_external_sandbox_executor_preflight_failed",
        "formal_external_sandbox_executor_preflight_incomplete",
      ],
    });
    expect(
      inspectCasimirFormalVerifierRuntimeReadinessV2(),
    ).toMatchObject({
      status: "blocked",
      configuredForExactResolutionAttempt: false,
    });

    await installCasimirFormalExecutionRegistryAtServerBootstrapV2(
      validRegistry,
    );
    await expect(
      installCasimirFormalExecutionRegistryAtServerBootstrapV2({
        entries: [],
        verifyEnrollmentRegistration: () => true,
        resolveExternalSandboxExecutor: () => executor,
      }),
    ).resolves.toMatchObject({
      configured: false,
      catalogConfigured: false,
      catalogEntryCount: 0,
      executorCapabilitiesRequired: 0,
      executorCapabilitiesPreflighted: 0,
      blockerCodes: [
        "formal_execution_catalog_empty_or_invalid",
        "formal_execution_registry_entries_required",
      ],
    });
    expect(
      inspectCasimirFormalVerifierRuntimeReadinessV2(),
    ).toMatchObject({
      status: "blocked",
      configuredForExactResolutionAttempt: false,
    });
  });

  it("keeps the production-shaped empty governed catalog fail closed", async () => {
    const catalog =
      await createCasimirFormalVerificationExecutionCatalogV2();
    expect(catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      entries: [],
      issues: [],
      authority: {
        serverInstalledCatalogOnly: true,
        callerSuppliedExecutionAuthority: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    });
    await expect(
      catalog.resolve({
        accountType: "developer",
        profileId: PROFILE_ID,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: "procedure:missing",
        procedureSha256: hash("0"),
      }),
    ).resolves.toBeNull();
  });

  it("withholds an entry when trusted enrollment verification is not installed", async () => {
    const data = await fixture();
    const catalog =
      await createCasimirFormalVerificationExecutionCatalogV2([
        {
          enrollment: data.enrollment,
          sealedExecution: data.sealed,
        },
      ]);
    expect(catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      entries: [],
      issues: [
        `${CATALOG_ID}:formal_execution_enrollment_registration_verifier_unconfigured`,
      ],
    });
  });

  it("rejects a formal enrollment that omits registered generator lineage", async () => {
    const data = await fixture();
    const missingGenerator = structuredClone(data.enrollment);
    delete (
      missingGenerator.sourceLineage as unknown as Record<string, unknown>
    ).generator;
    const catalog =
      await createCasimirFormalVerificationExecutionCatalogV2([
        {
          enrollment: missingGenerator,
          sealedExecution: data.sealed,
        },
      ], {
        verifyEnrollmentRegistration: () => true,
      });
    expect(catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      entries: [],
      issues: [
        expect.stringContaining(
          `${CATALOG_ID}:formal_execution_enrollment:sourceLineage.generator`,
        ),
      ],
    });
  });

  it("returns immutable clones only for an exact developer procedure binding", async () => {
    const data = await fixture();
    expect(data.catalog.inspect()).toMatchObject({
      configured: true,
      entryCount: 1,
      entries: [
        expect.objectContaining({
          executionCatalogEntryId: CATALOG_ID,
          enrollmentId: data.enrollment.enrollmentId,
          enrollmentArtifactSha256:
            data.enrollment.artifactSha256,
          generatorRegistrationId:
            "generator-registration:lanyon:test",
          procedureId: data.procedure.procedureId,
          procedureSha256: data.procedure.procedureSha256,
        }),
      ],
    });
    const selector = {
      accountType: "developer" as const,
      profileId: PROFILE_ID,
      executionCatalogEntryId: CATALOG_ID,
      procedureId: data.procedure.procedureId,
      procedureSha256: data.procedure.procedureSha256,
    };
    const first = await data.catalog.resolve(selector);
    expect(first).not.toBeNull();
    if (!first) throw new Error("expected governed catalog entry");
    first.sourceBundle.bundleId = "mutated-by-caller";
    const second = await data.catalog.resolve(selector);
    expect(second?.sourceBundle.bundleId).toBe(
      "formal-source-bundle:gr-maxwell:1d",
    );
    await expect(
      data.catalog.resolve({
        ...selector,
        accountType: "user",
      }),
    ).resolves.toBeNull();
    await expect(
      data.catalog.resolve({
        ...selector,
        procedureSha256: hash("0"),
      }),
    ).resolves.toBeNull();
  });

  it("withholds every entry when catalog identities or procedure bindings collide", async () => {
    const data = await fixture();
    const catalog =
      await createCasimirFormalVerificationExecutionCatalogV2([
        {
          enrollment: data.enrollment,
          sealedExecution: data.sealed,
        },
        {
          enrollment: structuredClone(data.enrollment),
          sealedExecution: structuredClone(data.sealed),
        },
      ], {
        verifyEnrollmentRegistration: () => true,
      });
    expect(catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      entries: [],
      issues: [
        `${CATALOG_ID}:formal_execution_catalog_entry_id_duplicate`,
        `${CATALOG_ID}:formal_execution_catalog_procedure_binding_duplicate`,
        `${CATALOG_ID}:formal_execution_enrollment_id_duplicate`,
      ],
    });
    await expect(
      catalog.resolve({
        accountType: "developer",
        profileId: PROFILE_ID,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: data.procedure.procedureId,
        procedureSha256: data.procedure.procedureSha256,
      }),
    ).resolves.toBeNull();
  });

  it("fails closed when the trusted execution catalog is not installed", async () => {
    const { service, procedure, authoritativeEvidenceArtifacts } =
      await fixture({ includeCatalog: false });
    await expect(
      service.prepareRequest({
        accountType: "developer",
        profileId: PROFILE_ID,
        turnId: TURN_ID,
        authoritativeEvidenceArtifacts,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: procedure.procedureId,
        procedureSha256: procedure.procedureSha256,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "blocked",
      issues: ["formal_execution_catalog_unconfigured"],
    });
  });

  it("requires an integrity-valid current-turn procedure observation", async () => {
    const { service, procedure } = await fixture();
    await expect(
      service.prepareRequest({
        accountType: "developer",
        profileId: PROFILE_ID,
        turnId: TURN_ID,
        authoritativeEvidenceArtifacts: [],
        executionCatalogEntryId: CATALOG_ID,
        procedureId: procedure.procedureId,
        procedureSha256: procedure.procedureSha256,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: [
        "formal_authoritative_procedure_artifact_not_admitted",
      ],
    });
  });

  it("rejects an integrity-valid catalog request bound to a different procedure program", async () => {
    const data = await fixture({
      sealedTransform: async (sealed) => {
        const {
          artifactId: _artifactId,
          schemaVersion: _schemaVersion,
          artifactSha256: _artifactSha256,
          authority: _authority,
          ...requestInput
        } = sealed.request;
        const request =
          await buildCasimirFormalVerificationRequestV2({
            ...requestInput,
            masterProblem: {
              ...sealed.request.masterProblem,
              artifactSha256: hash("f"),
            },
          });
        return { ...sealed, request };
      },
    });
    await expect(
      data.service.prepareRequest({
        accountType: "developer",
        profileId: PROFILE_ID,
        turnId: TURN_ID,
        authoritativeEvidenceArtifacts:
          data.authoritativeEvidenceArtifacts,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: data.procedure.procedureId,
        procedureSha256: data.procedure.procedureSha256,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "blocked",
      issues: [
        "formal_execution_master_problem_lineage_mismatch",
      ],
    });
  });

  it("rejects a filesystem path masquerading as an opaque source-bundle reference", async () => {
    const data = await fixture({
      sealedTransform: async (sealed) => ({
        ...sealed,
        sourceBundle: {
          ...sealed.sourceBundle,
          resolverRef: "C:\\untrusted\\FormalSource.lean",
        },
      }),
    });
    expect(data.catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      issues: [
        expect.stringContaining(
          `${CATALOG_ID}:formal_execution_enrollment:sourceBundle.resolverRef`,
        ),
        `${CATALOG_ID}:formal_source_bundle_binding_invalid`,
      ],
    });
    await expect(
      data.service.prepareRequest({
        accountType: "developer",
        profileId: PROFILE_ID,
        turnId: TURN_ID,
        authoritativeEvidenceArtifacts:
          data.authoritativeEvidenceArtifacts,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: data.procedure.procedureId,
        procedureSha256: data.procedure.procedureSha256,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "blocked",
      issues: ["formal_execution_catalog_entry_not_found"],
    });
  });

  it("rejects executable fields added to a sealed catalog entry", async () => {
    const data = await fixture({
      sealedTransform: async (sealed) =>
        ({
          ...sealed,
          command: "lean Untrusted.lean",
        }) as CasimirFormalVerificationSealedExecutionV2,
    });
    expect(data.catalog.inspect()).toMatchObject({
      configured: false,
      entryCount: 0,
      issues: [
        `${CATALOG_ID}:formal_execution_catalog_entry_shape_invalid`,
      ],
    });
    await expect(
      data.service.prepareRequest({
        accountType: "developer",
        profileId: PROFILE_ID,
        turnId: TURN_ID,
        authoritativeEvidenceArtifacts:
          data.authoritativeEvidenceArtifacts,
        executionCatalogEntryId: CATALOG_ID,
        procedureId: data.procedure.procedureId,
        procedureSha256: data.procedure.procedureSha256,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "blocked",
      issues: ["formal_execution_catalog_entry_not_found"],
    });
  });

  it("will not plan through a bare or missing host runner", async () => {
    const base = await fixture({ includeExecutor: false });
    const service = createCasimirFormalVerifierJobServiceV2({
      resolveTrustedExecutionCatalogEntry: () => base.sealed,
      ...({
        runner: async () => {
          throw new Error("host runner must never execute");
        },
      } as Record<string, unknown>),
    });
    const prepared = await service.prepareRequest({
      accountType: "developer",
      profileId: PROFILE_ID,
      turnId: TURN_ID,
      authoritativeEvidenceArtifacts:
        base.authoritativeEvidenceArtifacts,
      executionCatalogEntryId: CATALOG_ID,
      procedureId: base.procedure.procedureId,
      procedureSha256: base.procedure.procedureSha256,
    });
    await expect(
      service.plan({
        accountType: "developer",
        profileId: PROFILE_ID,
        preparedRequestId: prepared.preparedRequestId,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["formal_external_sandbox_executor_unconfigured"],
    });
  });

  it("requires exact single-use confirmation and accepts only an external certificate", async () => {
    const {
      service,
      procedure,
      authoritativeEvidenceArtifacts,
    } = await fixture();
    const prepared = await service.prepareRequest({
      accountType: "developer",
      profileId: PROFILE_ID,
      turnId: TURN_ID,
      authoritativeEvidenceArtifacts,
      executionCatalogEntryId: CATALOG_ID,
      procedureId: procedure.procedureId,
      procedureSha256: procedure.procedureSha256,
    });
    expect(prepared).toMatchObject({ ok: true, status: "prepared" });
    const planned = await service.plan({
      accountType: "developer",
      profileId: PROFILE_ID,
      preparedRequestId: prepared.preparedRequestId,
    });
    expect(planned).toMatchObject({ ok: true, status: "ready" });
    await expect(
      service.start({
        accountType: "developer",
        profileId: PROFILE_ID,
        preparedRequestId: prepared.preparedRequestId,
        planId: planned.planId,
        sessionId: "session:formal-v2",
        turnId: "ask:formal-v2:start",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: "needs_confirmation",
      issues: ["runtime_approval_receipt_required"],
    });
    const receipt = await buildRuntimeToolConfirmationTestReceipt({
      issuedAt: "2026-07-29T00:00:00.000Z",
      approvedAt: "2026-07-29T00:00:10.000Z",
      expiresAt: "2026-07-29T00:05:00.000Z",
      binding: {
        capabilityId: "theory-formal-verifier.start",
        planId: planned.planId as string,
        accountType: "developer",
        profileId: PROFILE_ID,
        sessionId: "session:formal-v2",
        turnId: "ask:formal-v2:start",
        sealedInputSha256: planned.sealedInputSha256 as string,
      },
    });
    const started = await service.start({
      accountType: "developer",
      profileId: PROFILE_ID,
      preparedRequestId: prepared.preparedRequestId,
      planId: planned.planId,
      sessionId: "session:formal-v2",
      turnId: "ask:formal-v2:start",
      approvalReceipt: receipt,
    });
    expect(started).toMatchObject({ ok: true, status: "running" });
    await drainAsyncJob();
    expect(
      await service.readResult({
        accountType: "developer",
        profileId: PROFILE_ID,
        jobId: started.jobId,
      }),
    ).toMatchObject({
      ok: true,
      status: "completed",
      certificate: {
        status: "passed",
        authority: {
          formalPropositionChecked: true,
          validatesScientificTruth: false,
          validatesTheory: false,
          validatesNumericalImplementation: false,
          validatesEmpiricalClaim: false,
          validatesPhysicalMechanism: false,
          assistantAnswer: false,
          terminalEligible: false,
          promotionAllowed: false,
        },
      },
      authority: {
        externalSandboxOnly: true,
        formalPropositionChecked: false,
        terminalEligible: false,
      },
    });
  });

  it("rejects an integrity-valid certificate whose executor attestation was substituted", async () => {
    const data = await fixture({
      certificateTransform: async (certificate) => {
        const {
          artifactId: _artifactId,
          schemaVersion: _schemaVersion,
          artifactSha256: _artifactSha256,
          authority: _authority,
          ...input
        } = certificate;
        return buildCasimirFormalVerificationCertificateV2({
          ...input,
          sandbox: {
            ...certificate.sandbox,
            attestationSha256: hash("e"),
          },
        });
      },
    });
    const prepared = await data.service.prepareRequest({
      accountType: "developer",
      profileId: PROFILE_ID,
      turnId: TURN_ID,
      authoritativeEvidenceArtifacts:
        data.authoritativeEvidenceArtifacts,
      executionCatalogEntryId: CATALOG_ID,
      procedureId: data.procedure.procedureId,
      procedureSha256: data.procedure.procedureSha256,
    });
    const planned = await data.service.plan({
      accountType: "developer",
      profileId: PROFILE_ID,
      preparedRequestId: prepared.preparedRequestId,
    });
    const receipt = await buildRuntimeToolConfirmationTestReceipt({
      issuedAt: "2026-07-29T00:00:00.000Z",
      approvedAt: "2026-07-29T00:00:10.000Z",
      expiresAt: "2026-07-29T00:05:00.000Z",
      requestId: "runtime-confirmation-request:attestation",
      receiptId: "runtime-confirmation-receipt:attestation",
      binding: {
        capabilityId: "theory-formal-verifier.start",
        planId: planned.planId as string,
        accountType: "developer",
        profileId: PROFILE_ID,
        sessionId: "session:formal-v2:attestation",
        turnId: "ask:formal-v2:attestation",
        sealedInputSha256: planned.sealedInputSha256 as string,
      },
    });
    const started = await data.service.start({
      accountType: "developer",
      profileId: PROFILE_ID,
      preparedRequestId: prepared.preparedRequestId,
      planId: planned.planId,
      sessionId: "session:formal-v2:attestation",
      turnId: "ask:formal-v2:attestation",
      approvalReceipt: receipt,
    });
    await drainAsyncJob();
    expect(
      await data.service.readResult({
        accountType: "developer",
        profileId: PROFILE_ID,
        jobId: started.jobId,
      }),
    ).toMatchObject({
      ok: false,
      status: "failed",
      certificate: null,
      issues: ["formal_certificate_executor_attestation_mismatch"],
    });
  });
});
