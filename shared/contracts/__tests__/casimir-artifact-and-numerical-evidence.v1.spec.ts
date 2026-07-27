import { describe, expect, it } from "vitest";

import {
  buildCasimirArtifactGenerationReceiptV1,
  buildCasimirArtifactGenerationRequestV1,
  validateCasimirArtifactGenerationReceiptAgainstRequestV1,
  validateCasimirArtifactGenerationReceiptIntegrityV1,
  validateCasimirArtifactGenerationReceiptV1,
  validateCasimirArtifactGenerationRequestIntegrityV1,
  validateCasimirArtifactGenerationRequestV1,
} from "../casimir-artifact-generation.v1";
import {
  buildCasimirIndependentNumericalVerificationCertificateV1,
  buildCasimirIndependentNumericalVerificationRequestV1,
  validateCasimirIndependentNumericalCertificateAgainstRequestV1,
  validateCasimirIndependentNumericalVerificationCertificateIntegrityV1,
  validateCasimirIndependentNumericalVerificationCertificateV1,
  validateCasimirIndependentNumericalVerificationRequestIntegrityV1,
  validateCasimirIndependentNumericalVerificationRequestV1,
  validateCasimirNumericalImplementationAgainstProducerReceiptV1,
} from "../casimir-independent-numerical-verification.v1";

const hash = (digit: string): string => digit.repeat(64);

async function buildGenerationFixture() {
  const request = await buildCasimirArtifactGenerationRequestV1({
    generatedAt: "2026-07-24T12:00:00.000Z",
    requestId: "generation-request-advection-diffusion",
    casimirSpec: {
      specId: "spec.advection-diffusion.1d",
      schemaVersion: "casimir_spec_scientific_claim_ir/v1",
      semanticSha256: hash("a"),
      artifactSha256: hash("b"),
    },
    claim: {
      claimId: "claim.advection-diffusion.1d",
      propositionSha256: hash("c"),
    },
    sourcePacket: {
      packetId: "source.advection-diffusion.1d",
      mediaType: "application/vnd.casimir.scientific-source+json",
      artifactSha256: hash("d"),
    },
    masterProblem: {
      schemaVersion: "theory_master_problem/v1",
      planId: "master.advection-diffusion.1d",
      artifactSha256: hash("e"),
    },
    derivationProgram: {
      schemaVersion: "theory_derivation_program/v1",
      programId: "derivation.advection-diffusion.1d",
      sourceMasterProblemPlanId: "master.advection-diffusion.1d",
      artifactSha256: hash("f"),
    },
    producerPolicy: {
      adapterContractId: "casimir-lanyon-adapter/v1",
      adapterContractSha256: hash("1"),
      allowedProducerIds: ["lanyon"],
      immutableRepositoryPinRequired: true,
      outputHashRequired: true,
      providerOutputTrusted: false,
    },
    requestedArtifacts: [
      {
        artifactId: "artifact.advection-diffusion.build-manifest",
        role: "build_manifest",
        mediaType: "application/json",
      },
      {
        artifactId: "artifact.advection-diffusion.c",
        role: "implementation_source",
        mediaType: "text/x-c",
      },
      {
        artifactId: "artifact.advection-diffusion.lean",
        role: "formal_source",
        mediaType: "text/x-lean",
      },
      {
        artifactId: "artifact.advection-diffusion.rkt",
        role: "numerical_case",
        mediaType: "text/x-racket",
      },
    ],
  });
  const receipt = await buildCasimirArtifactGenerationReceiptV1({
    generatedAt: "2026-07-24T12:02:00.000Z",
    receiptId: "generation-receipt-advection-diffusion",
    request: {
      schemaVersion: request.schemaVersion,
      requestId: request.requestId,
      artifactSha256: request.artifactSha256,
      casimirSpec: {
        semanticSha256: request.casimirSpec.semanticSha256,
        artifactSha256: request.casimirSpec.artifactSha256,
      },
      claimId: request.claim.claimId,
      propositionSha256: request.claim.propositionSha256,
      masterProblem: {
        planId: request.masterProblem.planId,
        artifactSha256: request.masterProblem.artifactSha256,
      },
      derivationProgram: {
        programId: request.derivationProgram.programId,
        artifactSha256: request.derivationProgram.artifactSha256,
      },
    },
    producer: {
      producerId: "lanyon",
      adapterId: request.producerPolicy.adapterContractId,
      adapterRevisionSha256: request.producerPolicy.adapterContractSha256,
      upstreamRepository: {
        uri: "https://github.com/lanyonai/AdvectionDiffusion",
        commitSha: "3d19be11e101121d8187230977f5a5aeba0daefe",
        sourceTreeSha256: hash("2"),
      },
    },
    run: {
      status: "succeeded",
      startedAt: "2026-07-24T12:01:00.000Z",
      completedAt: "2026-07-24T12:02:00.000Z",
      transcriptSha256: hash("3"),
      environmentSha256: hash("4"),
    },
    artifacts: request.requestedArtifacts.map((artifact, index) => ({
      ...artifact,
      logicalPath: `generated/${artifact.artifactId.split(".").at(-1)}`,
      artifactSha256: String(index + 5).repeat(64),
      sizeBytes: 100 + index,
      derivedFromSha256s: [request.sourcePacket.artifactSha256],
    })),
    blockers: [],
  });
  return { request, receipt };
}

async function buildNumericalFixture() {
  const request = await buildCasimirIndependentNumericalVerificationRequestV1({
    generatedAt: "2026-07-24T13:00:00.000Z",
    requestId: "numerical-request-advection-diffusion",
    casimirSpec: {
      specId: "spec.advection-diffusion.1d",
      schemaVersion: "casimir_spec_scientific_claim_ir/v1",
      semanticSha256: hash("a"),
      artifactSha256: hash("b"),
    },
    claim: {
      claimId: "claim.advection-diffusion.1d",
      propositionSha256: hash("c"),
    },
    primaryImplementation: {
      implementationId: "casimir-reference-advection-diffusion",
      lineageId: "casimir-reference",
      sourceSha256: hash("d"),
      buildManifestSha256: hash("e"),
      producerReceipt: {
        schemaVersion: "casimir_artifact_generation_receipt/v1",
        receiptId: "receipt.casimir-reference",
        artifactSha256: hash("f"),
      },
    },
    independentImplementation: {
      implementationId: "lanyon-advection-diffusion",
      lineageId: "lanyon",
      sourceSha256: hash("1"),
      buildManifestSha256: hash("2"),
      producerReceipt: {
        schemaVersion: "casimir_artifact_generation_receipt/v1",
        receiptId: "receipt.lanyon",
        artifactSha256: hash("3"),
      },
    },
    frozenCase: {
      caseId: "case.periodic-advection-diffusion.1d",
      inputsSha256: hash("4"),
      meshSha256: hash("5"),
      initialConditionsSha256: hash("6"),
      boundaryConditionsSha256: hash("7"),
      observables: [
        { observableId: "l2_error", unit: "1" },
        { observableId: "mass_conservation_error", unit: "1" },
      ],
    },
    comparisonPolicy: {
      policyId: "policy.advection-diffusion.1d",
      artifactSha256: hash("8"),
      norm: "linf",
      tolerances: [
        {
          observableId: "l2_error",
          absoluteTolerance: 1e-8,
          relativeTolerance: 1e-6,
        },
        {
          observableId: "mass_conservation_error",
          absoluteTolerance: 1e-10,
          relativeTolerance: 1e-8,
        },
      ],
      minimumRefinementLevels: 3,
      minimumObservedOrder: 1.5,
      deterministicSeed: "casimir-advection-diffusion-v1",
    },
    environments: {
      primary: {
        environmentId: "environment.casimir-reference",
        toolchainSha256: hash("9"),
        runtimeSha256: hash("0"),
        platformSha256: hash("a"),
      },
      independent: {
        environmentId: "environment.lanyon",
        toolchainSha256: hash("b"),
        runtimeSha256: hash("c"),
        platformSha256: hash("d"),
      },
    },
    executionPolicy: {
      replayCount: 2,
      networkAllowed: false,
      arbitraryCommandAllowed: false,
      outerObservedProcessRequired: true,
    },
  });
  const certificate =
    await buildCasimirIndependentNumericalVerificationCertificateV1({
      generatedAt: "2026-07-24T13:10:00.000Z",
      certificateId: "numerical-certificate-advection-diffusion",
      request: {
        schemaVersion: request.schemaVersion,
        requestId: request.requestId,
        artifactSha256: request.artifactSha256,
        casimirSpec: {
          semanticSha256: request.casimirSpec.semanticSha256,
          artifactSha256: request.casimirSpec.artifactSha256,
        },
        claimId: request.claim.claimId,
        propositionSha256: request.claim.propositionSha256,
        frozenCase: {
          caseId: request.frozenCase.caseId,
          inputsSha256: request.frozenCase.inputsSha256,
          meshSha256: request.frozenCase.meshSha256,
          initialConditionsSha256:
            request.frozenCase.initialConditionsSha256,
          boundaryConditionsSha256:
            request.frozenCase.boundaryConditionsSha256,
          observableIds: request.frozenCase.observables.map(
            (observable) => observable.observableId,
          ),
        },
      },
      status: "passed",
      lineageAudit: {
        primaryLineageId: request.primaryImplementation.lineageId,
        independentLineageId: request.independentImplementation.lineageId,
        sourceDistinct: true,
        buildManifestDistinct: true,
        independenceEstablished: true,
      },
      runs: {
        primary: {
          implementationId: request.primaryImplementation.implementationId,
          completedReplayCount: 2,
          byteIdentical: true,
          aggregateOutputManifestSha256: hash("e"),
          aggregateTranscriptSha256: hash("f"),
          refinementLevels: 3,
        },
        independent: {
          implementationId: request.independentImplementation.implementationId,
          completedReplayCount: 2,
          byteIdentical: true,
          aggregateOutputManifestSha256: hash("1"),
          aggregateTranscriptSha256: hash("2"),
          refinementLevels: 3,
        },
      },
      comparisons: request.comparisonPolicy.tolerances.map((tolerance) => ({
        observableId: tolerance.observableId,
        unit:
          request.frozenCase.observables.find(
            (observable) => observable.observableId === tolerance.observableId,
          )?.unit ?? "1",
        maximumAbsoluteError: tolerance.absoluteTolerance / 2,
        maximumRelativeError: tolerance.relativeTolerance / 2,
        observedConvergenceOrder: 2,
        absoluteTolerance: tolerance.absoluteTolerance,
        relativeTolerance: tolerance.relativeTolerance,
        withinTolerance: true,
        convergenceSatisfied: true,
      })),
      blockers: [],
    });
  return { request, certificate };
}

describe("Casimir provider-neutral artifact generation evidence", () => {
  it("binds generated bytes to the canonical IR without promoting producer output", async () => {
    const { request, receipt } = await buildGenerationFixture();

    expect(
      await validateCasimirArtifactGenerationRequestIntegrityV1(request),
    ).toEqual([]);
    expect(
      await validateCasimirArtifactGenerationReceiptIntegrityV1(receipt),
    ).toEqual([]);
    expect(
      validateCasimirArtifactGenerationReceiptAgainstRequestV1(
        receipt,
        request,
      ),
    ).toEqual([]);
    expect(receipt.request).toMatchObject({
      casimirSpec: {
        semanticSha256: request.casimirSpec.semanticSha256,
        artifactSha256: request.casimirSpec.artifactSha256,
      },
      masterProblem: {
        planId: request.masterProblem.planId,
        artifactSha256: request.masterProblem.artifactSha256,
      },
      derivationProgram: {
        programId: request.derivationProgram.programId,
        artifactSha256: request.derivationProgram.artifactSha256,
      },
    });
    expect(receipt.authority).toMatchObject({
      artifactBytesProduced: true,
      providerOutputTrusted: false,
      formalPropositionChecked: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("fails closed on competing IRs, overclaiming, tampering, and unbound artifacts", async () => {
    const { request, receipt } = await buildGenerationFixture();
    const competingIr = {
      ...request,
      casimirSpec: {
        ...request.casimirSpec,
        schemaVersion: "scientific_system_definition/v1",
      },
    };
    expect(validateCasimirArtifactGenerationRequestV1(competingIr)).toContain(
      "casimirSpec.schemaVersion must be casimir_spec_scientific_claim_ir/v1",
    );

    const overclaiming = {
      ...receipt,
      authority: { ...receipt.authority, validatesGeneratedCode: true },
    };
    expect(validateCasimirArtifactGenerationReceiptV1(overclaiming)).toContain(
      "authority.validatesGeneratedCode must be false",
    );

    const unbound = {
      ...receipt,
      artifacts: receipt.artifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, derivedFromSha256s: [] } : artifact,
      ),
    };
    expect(
      validateCasimirArtifactGenerationReceiptAgainstRequestV1(
        unbound,
        request,
      ),
    ).toContain(
      `artifact is not bound to source packet hash: ${receipt.artifacts[0].artifactId}`,
    );

    const tampered = { ...request, requestId: "tampered" };
    expect(
      await validateCasimirArtifactGenerationRequestIntegrityV1(tampered),
    ).toContain("artifactSha256 does not match request content");

    const substitutedReceipt = structuredClone(receipt);
    substitutedReceipt.request.masterProblem.planId = "master.substituted";
    substitutedReceipt.request.masterProblem.artifactSha256 = hash("0");
    substitutedReceipt.request.derivationProgram.programId =
      "derivation.substituted";
    substitutedReceipt.request.derivationProgram.artifactSha256 = hash("9");
    expect(
      validateCasimirArtifactGenerationReceiptAgainstRequestV1(
        substitutedReceipt,
        request,
      ),
    ).toEqual(
      expect.arrayContaining([
        "receipt Master Problem planId does not match request",
        "receipt Master Problem artifact hash does not match request",
        "receipt derivation programId does not match request",
        "receipt derivation program artifact hash does not match request",
      ]),
    );
    expect(
      await validateCasimirArtifactGenerationReceiptIntegrityV1(
        substitutedReceipt,
      ),
    ).toContain("artifactSha256 does not match receipt content");
  });

  it("requires numerical implementation bytes and build manifest in the cited receipt", async () => {
    const { receipt } = await buildGenerationFixture();
    const source = receipt.artifacts.find(
      (artifact) => artifact.role === "implementation_source",
    );
    const manifest = receipt.artifacts.find(
      (artifact) => artifact.role === "build_manifest",
    );
    expect(source).toBeDefined();
    expect(manifest).toBeDefined();
    const binding = {
      implementationId: "lanyon-advection-diffusion",
      lineageId: "lanyon",
      sourceSha256: source?.artifactSha256 ?? hash("0"),
      buildManifestSha256: manifest?.artifactSha256 ?? hash("0"),
      producerReceipt: {
        schemaVersion: receipt.schemaVersion,
        receiptId: receipt.receiptId,
        artifactSha256: receipt.artifactSha256,
      },
    };

    expect(
      validateCasimirNumericalImplementationAgainstProducerReceiptV1(
        binding,
        receipt,
      ),
    ).toEqual([]);
    expect(
      validateCasimirNumericalImplementationAgainstProducerReceiptV1(
        { ...binding, sourceSha256: hash("0") },
        receipt,
      ),
    ).toContain("implementation source hash is absent from producer receipt");
  });
});

describe("Casimir independent numerical evidence", () => {
  it("certifies only the frozen comparison between distinct lineages", async () => {
    const { request, certificate } = await buildNumericalFixture();

    expect(
      await validateCasimirIndependentNumericalVerificationRequestIntegrityV1(
        request,
      ),
    ).toEqual([]);
    expect(
      await validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
        certificate,
      ),
    ).toEqual([]);
    expect(
      validateCasimirIndependentNumericalCertificateAgainstRequestV1(
        certificate,
        request,
      ),
    ).toEqual([]);
    expect(certificate.request.frozenCase).toEqual({
      caseId: request.frozenCase.caseId,
      inputsSha256: request.frozenCase.inputsSha256,
      meshSha256: request.frozenCase.meshSha256,
      initialConditionsSha256: request.frozenCase.initialConditionsSha256,
      boundaryConditionsSha256: request.frozenCase.boundaryConditionsSha256,
      observableIds: request.frozenCase.observables.map(
        (observable) => observable.observableId,
      ),
    });
    expect(certificate.authority).toMatchObject({
      frozenNumericalComparisonChecked: true,
      independentImplementationCompared: true,
      validatesTheory: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      formalPropositionChecked: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    });
  });

  it("rejects self-comparison, tolerance drift, incomplete replay, and authority inflation", async () => {
    const { request, certificate } = await buildNumericalFixture();
    const selfComparison = {
      ...request,
      independentImplementation: {
        ...request.independentImplementation,
        lineageId: request.primaryImplementation.lineageId,
        sourceSha256: request.primaryImplementation.sourceSha256,
        buildManifestSha256: request.primaryImplementation.buildManifestSha256,
      },
    };
    expect(
      validateCasimirIndependentNumericalVerificationRequestV1(selfComparison),
    ).toEqual(
      expect.arrayContaining([
        "implementation lineageIds must be distinct",
        "implementation source hashes must be distinct",
        "implementation build manifest hashes must be distinct",
      ]),
    );

    const incomplete = {
      ...certificate,
      runs: {
        ...certificate.runs,
        independent: {
          ...certificate.runs.independent,
          completedReplayCount: 1,
        },
      },
    };
    expect(
      validateCasimirIndependentNumericalVerificationCertificateV1(incomplete),
    ).toContain(
      "passed status requires two byte-identical independent replays",
    );

    const toleranceDrift = {
      ...certificate,
      comparisons: certificate.comparisons.map((comparison, index) =>
        index === 0
          ? {
              ...comparison,
              absoluteTolerance: comparison.absoluteTolerance * 10,
            }
          : comparison,
      ),
    };
    expect(
      validateCasimirIndependentNumericalCertificateAgainstRequestV1(
        toleranceDrift,
        request,
      ),
    ).toContain(
      `comparison tolerance mismatch: ${certificate.comparisons[0].observableId}`,
    );

    const inflated = {
      ...certificate,
      authority: {
        ...certificate.authority,
        validatesNumericalImplementation: true,
      },
    };
    expect(
      validateCasimirIndependentNumericalVerificationCertificateV1(inflated),
    ).toContain("authority.validatesNumericalImplementation must be false");
  });

  it("rejects frozen-case and observable-set substitution", async () => {
    const { request, certificate } = await buildNumericalFixture();
    const substituted = structuredClone(certificate);
    substituted.request.frozenCase.caseId = "case.substituted";
    substituted.request.frozenCase.inputsSha256 = hash("0");
    substituted.request.frozenCase.meshSha256 = hash("1");
    substituted.request.frozenCase.initialConditionsSha256 = hash("2");
    substituted.request.frozenCase.boundaryConditionsSha256 = hash("3");
    substituted.request.frozenCase.observableIds.reverse();

    expect(
      validateCasimirIndependentNumericalVerificationCertificateV1(
        substituted,
      ),
    ).toContain(
      "request.frozenCase.observableIds must be sorted and duplicate-free",
    );
    expect(
      validateCasimirIndependentNumericalCertificateAgainstRequestV1(
        substituted,
        request,
      ),
    ).toEqual(
      expect.arrayContaining([
        "certificate frozen caseId does not match request",
        "certificate frozen case inputsSha256 does not match request",
        "certificate frozen case meshSha256 does not match request",
        "certificate frozen case initialConditionsSha256 does not match request",
        "certificate frozen case boundaryConditionsSha256 does not match request",
        "certificate frozen case observableIds do not match request",
      ]),
    );
    const hashSubstituted = structuredClone(certificate);
    hashSubstituted.request.frozenCase.inputsSha256 = hash("0");
    expect(
      await validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
        hashSubstituted,
      ),
    ).toContain("artifactSha256 does not match certificate content");
  });
});
