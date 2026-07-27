import { describe, expect, it } from "vitest";
import {
  buildCasimirFormalVerificationCertificateV1,
  validateCasimirFormalVerificationCertificateAgainstRequestV1,
  validateCasimirFormalVerificationCertificateIntegrityV1,
  validateCasimirFormalVerificationCertificateV1,
  type CasimirFormalVerificationCertificateV1,
} from "../casimir-formal-verification-certificate.v1";
import {
  buildCasimirFormalVerificationRequestV1,
  validateCasimirFormalVerificationRequestIntegrityV1,
  validateCasimirFormalVerificationRequestV1,
  type CasimirFormalVerificationRequestV1,
} from "../casimir-formal-verification-request.v1";

const hash = (digit: string): string => digit.repeat(64);

async function makeRequest(
  overrides: Partial<CasimirFormalVerificationRequestV1> = {},
): Promise<CasimirFormalVerificationRequestV1> {
  const request = await buildCasimirFormalVerificationRequestV1({
    generatedAt: "2026-07-23T12:00:00.000Z",
    requestId: "formal-request-001",
    casimirSpec: {
      specId: "spec.unsplittable-flow.counterexample",
      schemaVersion: "casimir_spec_scientific_claim_ir/v1",
      semanticSha256: hash("a"),
      artifactSha256: hash("b"),
    },
    claim: {
      claimId: "claim.integral-optimum-lower-bound",
      propositionSha256: hash("c"),
    },
    formalArtifact: {
      theoremName: "integral_optimum_ge_sixty",
      theoremModule: "Casimir.Generated.IntegralOptimum",
      statementSha256: hash("c"),
      sourceSha256: hash("6"),
      emitterId: "casimir-spec-lean-emitter",
      emitterRevisionSha256: hash("7"),
    },
    masterProblem: {
      schemaVersion: "theory_master_problem/v1",
      planId: "master-problem-001",
      artifactSha256: hash("d"),
    },
    derivationProgram: {
      schemaVersion: "theory_derivation_program/v1",
      programId: "derivation-program-001",
      sourceMasterProblemPlanId: "master-problem-001",
      artifactSha256: hash("e"),
    },
    theoryGraph: {
      graphId: "theory-graph-001",
      snapshotSha256: hash("f"),
    },
    catalogSnapshots: [
      { catalogId: "axiom-catalog", snapshotSha256: hash("1") },
      { catalogId: "definition-catalog", snapshotSha256: hash("2") },
    ],
    formalEnvironment: {
      prover: "lean4",
      toolchainPolicyId: "lean-policy-001",
      toolchainPolicySha256: hash("3"),
      pinnedVersion: "v4.19.0",
      imports: [
        { module: "Mathlib.Data.Nat.Basic", sourceSha256: hash("4") },
        { module: "Mathlib.Tactic", sourceSha256: hash("5") },
      ],
      declaredAxiomIds: ["Classical.choice"],
      allowedAxiomIds: ["Classical.choice", "propext"],
    },
    executionPolicy: {
      replayCount: 2,
      timeoutMs: 60_000,
      maxMemoryBytes: 1_073_741_824,
      maxOutputBytes: 1_048_576,
      networkAllowed: false,
      arbitraryCommandAllowed: false,
      outerObservedProcessRequired: true,
    },
  });
  return { ...request, ...overrides };
}

async function makePassedCertificate(
  request: CasimirFormalVerificationRequestV1,
): Promise<CasimirFormalVerificationCertificateV1> {
  return buildCasimirFormalVerificationCertificateV1({
    generatedAt: "2026-07-23T12:01:00.000Z",
    certificateId: "formal-certificate-001",
    request: {
      schemaVersion: request.schemaVersion,
      requestId: request.requestId,
      artifactSha256: request.artifactSha256,
      propositionSha256: request.claim.propositionSha256,
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
      theoryGraph: {
        graphId: request.theoryGraph.graphId,
        snapshotSha256: request.theoryGraph.snapshotSha256,
      },
    },
    status: "passed",
    theorem: {
      claimId: request.claim.claimId,
      theoremName: request.formalArtifact.theoremName,
      statementSha256: request.claim.propositionSha256,
      emittedSourceSha256: request.formalArtifact.sourceSha256,
    },
    environment: {
      prover: "lean4",
      pinnedVersion: request.formalEnvironment.pinnedVersion,
      toolchainPolicySha256: request.formalEnvironment.toolchainPolicySha256,
      kernelBinarySha256: hash("7"),
      imports: request.formalEnvironment.imports,
    },
    replay: {
      observationMode: "outer_observed_process",
      requiredReplayCount: 2,
      completedReplayCount: 2,
      byteIdentical: true,
      aggregateTranscriptSha256: hash("8"),
      runs: [
        {
          replayIndex: 1,
          exitCode: 0,
          stdoutSha256: hash("9"),
          stderrSha256: hash("0"),
          transcriptSha256: hash("a"),
          startedAt: "2026-07-23T12:00:10.000Z",
          completedAt: "2026-07-23T12:00:11.000Z",
        },
        {
          replayIndex: 2,
          exitCode: 0,
          stdoutSha256: hash("9"),
          stderrSha256: hash("0"),
          transcriptSha256: hash("a"),
          startedAt: "2026-07-23T12:00:20.000Z",
          completedAt: "2026-07-23T12:00:21.000Z",
        },
      ],
    },
    axiomAudit: {
      declaredAxiomIds: request.formalEnvironment.declaredAxiomIds,
      allowedAxiomIds: request.formalEnvironment.allowedAxiomIds,
      usedAxiomIds: ["Classical.choice"],
      hiddenAxiomsDetected: false,
      reportSha256: hash("b"),
    },
    blockers: [],
  });
}

describe("casimir_formal_verification_request/v1", () => {
  it("builds a structurally valid, hash-bound, non-executing request", async () => {
    const request = await makeRequest();

    expect(validateCasimirFormalVerificationRequestV1(request)).toEqual([]);
    expect(
      await validateCasimirFormalVerificationRequestIntegrityV1(request),
    ).toEqual([]);
    expect(request.authority).toMatchObject({
      executesTools: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
      validatesSemanticIntent: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
    });
  });

  it("fails closed on substituted scientific content", async () => {
    const request = await makeRequest();
    const tampered = structuredClone(request);
    tampered.casimirSpec.semanticSha256 = hash("0");

    expect(
      await validateCasimirFormalVerificationRequestIntegrityV1(tampered),
    ).toContain("artifactSha256 does not match request content");
  });

  it("rejects executable payload smuggling and undeclared axioms", async () => {
    const request = await makeRequest();
    const rawLeanSmuggling = {
      ...structuredClone(request),
      rawLeanSource: "theorem bypass : False := by sorry",
    };
    const axiomSmuggling = structuredClone(request);
    axiomSmuggling.formalEnvironment.declaredAxiomIds = ["Quot.sound"];

    expect(
      validateCasimirFormalVerificationRequestV1(rawLeanSmuggling),
    ).toContain(
      "$ must contain exactly: artifactId, schemaVersion, generatedAt, requestId, artifactSha256, casimirSpec, claim, formalArtifact, masterProblem, derivationProgram, theoryGraph, catalogSnapshots, formalEnvironment, executionPolicy, authority",
    );
    expect(
      validateCasimirFormalVerificationRequestV1(axiomSmuggling),
    ).toContain("declared axiom is not allowed: Quot.sound");
  });
});

describe("casimir_formal_verification_certificate/v1", () => {
  it("accepts a two-replay formal receipt while keeping every broader authority false", async () => {
    const request = await makeRequest();
    const certificate = await makePassedCertificate(request);

    expect(validateCasimirFormalVerificationCertificateV1(certificate)).toEqual(
      [],
    );
    expect(
      await validateCasimirFormalVerificationCertificateIntegrityV1(
        certificate,
      ),
    ).toEqual([]);
    expect(
      validateCasimirFormalVerificationCertificateAgainstRequestV1(
        certificate,
        request,
      ),
    ).toEqual([]);
    expect(certificate.request).toMatchObject({
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
      theoryGraph: {
        graphId: request.theoryGraph.graphId,
        snapshotSha256: request.theoryGraph.snapshotSha256,
      },
    });
    expect(certificate.authority).toMatchObject({
      formalPropositionChecked: true,
      validatesSemanticIntent: false,
      validatesTheory: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
      validatesEmpiricalClaim: false,
      validatesPhysicalMechanism: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
      postToolModelStepRequired: true,
    });
  });

  it("rejects a passing label without complete deterministic replay", async () => {
    const request = await makeRequest();
    const certificate = await makePassedCertificate(request);
    certificate.replay.runs.pop();
    certificate.replay.completedReplayCount = 1;
    certificate.replay.byteIdentical = false;

    const issues = validateCasimirFormalVerificationCertificateV1(certificate);
    expect(issues).toContain("passed status requires two completed replays");
    expect(issues).toContain("passed status requires byte-identical replays");
  });

  it("rejects proposition substitution, request substitution, and authority escalation", async () => {
    const request = await makeRequest();
    const certificate = await makePassedCertificate(request);
    const substituted = structuredClone(certificate);
    substituted.theorem.statementSha256 = hash("d");
    substituted.request.artifactSha256 = hash("e");
    substituted.authority.validatesPhysicalMechanism = true as false;

    expect(validateCasimirFormalVerificationCertificateV1(substituted)).toEqual(
      expect.arrayContaining([
        "theorem.statementSha256 must equal request.propositionSha256",
        "authority.validatesPhysicalMechanism must be false",
      ]),
    );
    expect(
      validateCasimirFormalVerificationCertificateAgainstRequestV1(
        substituted,
        request,
      ),
    ).toContain("certificate request artifactSha256 does not match request");
  });

  it("detects certificate content tampering even when its shape remains valid", async () => {
    const request = await makeRequest();
    const certificate = await makePassedCertificate(request);
    certificate.theorem.theoremName = "substituted_theorem";

    expect(
      await validateCasimirFormalVerificationCertificateIntegrityV1(
        certificate,
      ),
    ).toContain("artifactSha256 does not match certificate content");
  });

  it("rejects substitution across every scientific lineage binding", async () => {
    const request = await makeRequest();
    const certificate = await makePassedCertificate(request);
    const substituted = structuredClone(certificate);
    substituted.request.casimirSpec.semanticSha256 = hash("0");
    substituted.request.casimirSpec.artifactSha256 = hash("1");
    substituted.request.masterProblem.planId = "master-problem-substituted";
    substituted.request.masterProblem.artifactSha256 = hash("2");
    substituted.request.derivationProgram.programId =
      "derivation-program-substituted";
    substituted.request.derivationProgram.artifactSha256 = hash("3");
    substituted.request.theoryGraph.graphId = "theory-graph-substituted";
    substituted.request.theoryGraph.snapshotSha256 = hash("4");

    expect(
      validateCasimirFormalVerificationCertificateAgainstRequestV1(
        substituted,
        request,
      ),
    ).toEqual(
      expect.arrayContaining([
        "certificate Casimir Spec semantic hash does not match request",
        "certificate Casimir Spec artifact hash does not match request",
        "certificate Master Problem planId does not match request",
        "certificate Master Problem artifact hash does not match request",
        "certificate derivation programId does not match request",
        "certificate derivation program artifact hash does not match request",
        "certificate Theory Graph graphId does not match request",
        "certificate Theory Graph snapshot hash does not match request",
      ]),
    );
    expect(
      await validateCasimirFormalVerificationCertificateIntegrityV1(
        substituted,
      ),
    ).toContain("artifactSha256 does not match certificate content");
  });
});
