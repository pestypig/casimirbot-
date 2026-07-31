import { describe, expect, it } from "vitest";

import {
  buildCasimirFormalExecutionEnrollmentV2,
  validateCasimirFormalExecutionEnrollmentIntegrityV2,
  type BuildCasimirFormalExecutionEnrollmentV2Input,
} from "../casimir-formal-execution-enrollment.v2";

const hash = (character: string): string => character.repeat(64);

const input = (): BuildCasimirFormalExecutionEnrollmentV2Input => ({
  generatedAt: "2026-07-30T00:00:00.000Z",
  enrollmentId: "formal-enrollment:test",
  executionCatalogEntryId: "formal-execution:test",
  sealedExecutionSha256: hash("0"),
  procedure: {
    schemaVersion: "theory_experiment_procedure/v1",
    procedureId: "procedure:test",
    procedureSha256: hash("1"),
  },
  request: {
    schemaVersion: "casimir_formal_verification_request/v2",
    requestId: "formal-request:test",
    artifactSha256: hash("2"),
  },
  sourceLineage: {
    sourceAuditId: "source-audit:test",
    sourceAuditArtifactSha256: hash("3"),
    generationLineageAuditId: "generation-lineage-audit:test",
    generationLineageAuditArtifactSha256: hash("4"),
    repository: {
      producerId: "lanyon",
      uri: "https://github.com/lanyonai/GeneralRelativisticMaxwell",
      commitSha: "b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3",
      selectedSourceTreeSha256: hash("5"),
    },
    caseId: "gr_hyperbolic_maxwell_1d",
    specification: {
      logicalPath: "specifications/gr_hyperbolic_maxwell_1d.rkt",
      sha256: hash("6"),
    },
    formalSource: {
      logicalPath: "proofs/gr_hyperbolic_maxwell_1d.lean",
      sha256: hash("7"),
      moduleName: "gr_hyperbolic_maxwell_1d",
    },
    implementationSource: {
      logicalPath: "implementations/gr_hyperbolic_maxwell_1d.c",
      sha256: hash("8"),
      numericModel: "c_ieee754_binary64",
      entrypointStatus: "placeholder_noop",
      formalRefinementStatus: "unassessed",
    },
    generator: {
      registrationId: "generator-registration:test",
      producerId: "lanyon",
      generatorArtifactId: "lanyon-generator:test",
      generatorRevisionSha256: hash("9"),
      invocationManifestSha256: hash("a"),
      generationReceiptId: "generation-receipt:test",
      generationReceiptSha256: hash("b"),
      outputBundleSha256: hash("c"),
    },
  },
  theorem: {
    formalArtifactId: "formal-artifact:test",
    theoremName: "xHyperbolicity",
    theoremModule: "gr_hyperbolic_maxwell_1d",
    declarationSha256: hash("d"),
    propositionSourceSha256: hash("e"),
    observedTheoremTypeSha256: hash("f"),
  },
  semanticBinding: {
    bindingId: "semantic-binding:test",
    artifactSha256: hash("0"),
    status: "reviewed",
    claimId: "claim:test",
    semanticPropositionSha256: hash("1"),
  },
  graph: {
    graphId: "graph:test",
    snapshotSha256: hash("2"),
  },
  environment: {
    policyId: "lean-environment:test",
    policySha256: hash("3"),
    pinnedVersion: "4.31.0+test",
    kernelBinarySha256: hash("4"),
    dependencyLockSha256: hash("5"),
    importClosureSha256: hash("6"),
  },
  sourceBundle: {
    bundleId: "formal-bundle:test",
    artifactSha256: hash("7"),
    formalSourceSha256: hash("7"),
    importClosureSha256: hash("6"),
    resolverRef: "casimir-formal-bundle:test",
  },
  executorCapability: {
    schemaVersion: "casimir_formal_sandbox_executor_capability/v1",
    capabilityId: "formal-executor:test",
    artifactSha256: hash("8"),
  },
});

describe("casimir formal execution enrollment v2", () => {
  it("binds every execution lineage without granting result authority", async () => {
    const enrollment =
      await buildCasimirFormalExecutionEnrollmentV2(input());
    expect(
      await validateCasimirFormalExecutionEnrollmentIntegrityV2(enrollment),
    ).toEqual([]);
    expect(enrollment.sourceLineage.generator).toMatchObject({
      registrationId: "generator-registration:test",
      generatorRevisionSha256: hash("9"),
      generationReceiptSha256: hash("b"),
    });
    expect(enrollment.authority).toMatchObject({
      serverRegistrationRequired: true,
      specificationBound: true,
      formalSourceBound: true,
      implementationSourceBound: true,
      generatorLineageBound: true,
      executionEnabled: false,
      validatesGeneratorCorrectness: false,
      validatesFormalProposition: false,
      validatesNumericalImplementation: false,
      validatesScientificTruth: false,
      terminalEligible: false,
    });
  });

  it("rejects registered-generator substitution after enrollment", async () => {
    const enrollment =
      await buildCasimirFormalExecutionEnrollmentV2(input());
    enrollment.sourceLineage.generator.generatorRevisionSha256 = hash("e");
    expect(
      await validateCasimirFormalExecutionEnrollmentIntegrityV2(enrollment),
    ).toContain(
      "artifactSha256 does not match formal execution enrollment",
    );
  });

  it("rejects producer and theorem-module cross-lineage mismatches even when rehashed", async () => {
    const candidate = input();
    candidate.sourceLineage.generator.producerId = "other-producer";
    candidate.theorem.theoremModule = "substituted_module";
    const enrollment =
      await buildCasimirFormalExecutionEnrollmentV2(candidate);
    expect(
      await validateCasimirFormalExecutionEnrollmentIntegrityV2(enrollment),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "sourceLineage.generator.producerId",
        ),
        expect.stringContaining("theorem.theoremModule"),
      ]),
    );
  });
});
