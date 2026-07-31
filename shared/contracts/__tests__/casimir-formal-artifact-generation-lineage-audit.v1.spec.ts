import { describe, expect, it } from "vitest";

import auditJson from "../../../configs/research/casimir-formal-generation-lineage-audits/lanyon-gr-maxwell-b13da44.v1.json";
import {
  buildCasimirFormalArtifactGenerationLineageAuditV1,
  validateCasimirFormalArtifactGenerationLineageAuditIntegrityV1,
  type CasimirFormalArtifactGenerationLineageAuditV1,
} from "../casimir-formal-artifact-generation-lineage-audit.v1";

const audit =
  auditJson as CasimirFormalArtifactGenerationLineageAuditV1;

describe("casimir formal artifact generation-lineage audit v1", () => {
  it("binds the complete pinned tree and keeps missing generator lineage explicit", async () => {
    expect(
      await validateCasimirFormalArtifactGenerationLineageAuditIntegrityV1(
        audit,
      ),
    ).toEqual([]);
    expect(audit.recursiveTreeInspection).toMatchObject({
      ref: "b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3",
      complete: true,
      truncated: false,
      entryCount: 32,
      generatorCandidatePaths: [],
    });
    expect(audit.generatorLineage).toEqual({
      status: "not_published_in_pinned_repository",
      generatorArtifactId: null,
      generatorRevisionSha256: null,
      invocationManifestSha256: null,
      generationReceiptId: null,
      generationReceiptSha256: null,
      requiredForExecutionEnrollment: true,
      blockerCode: "formal_generator_lineage_unavailable",
    });
    expect(audit.authority).toMatchObject({
      generatorRegistrationAuthority: false,
      executionEnrollmentAuthority: false,
      provesGeneratorCorrectness: false,
      provesGeneratedArtifactsCorrect: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("rejects repository path-set substitution", async () => {
    const substituted = structuredClone(audit);
    substituted.recursiveTreeInspection.paths[
      substituted.recursiveTreeInspection.paths.length - 1
    ] = "wald_jet_final2.png";
    expect(
      await validateCasimirFormalArtifactGenerationLineageAuditIntegrityV1(
        substituted,
      ),
    ).toEqual(
      expect.arrayContaining([
        "recursiveTreeInspection.pathSetSha256 does not match paths",
        "artifactSha256 does not match generation-lineage audit",
      ]),
    );
  });

  it("cannot keep not-published status after a generator candidate is added and rehashed", async () => {
    const {
      artifactId: _artifactId,
      schemaVersion: _schemaVersion,
      artifactSha256: _artifactSha256,
      authority: _authority,
      ...input
    } = structuredClone(audit);
    const paths = [...input.recursiveTreeInspection.paths, "generator/run.py"]
      .sort((left, right) => left.localeCompare(right, "en"));
    const rehashed =
      await buildCasimirFormalArtifactGenerationLineageAuditV1({
        ...input,
        recursiveTreeInspection: {
          ...input.recursiveTreeInspection,
          entryCount: paths.length,
          paths,
          generatorCandidatePaths: ["generator/run.py"],
        },
      });
    expect(
      await validateCasimirFormalArtifactGenerationLineageAuditIntegrityV1(
        rehashed,
      ),
    ).toEqual(
      [
        expect.stringContaining(
          "not_published status requires an empty generator candidate path scan",
        ),
      ],
    );
  });
});
