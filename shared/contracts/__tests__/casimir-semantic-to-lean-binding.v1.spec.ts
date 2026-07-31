import { describe, expect, it } from "vitest";

import {
  buildCasimirSemanticToLeanBindingV1,
  validateCasimirSemanticToLeanBindingV1,
} from "../casimir-semantic-to-lean-binding.v1";

const hash = (character: string): string => character.repeat(64);

const input = () => ({
  bindingId: "semantic-to-lean:gr-maxwell:x-hyperbolicity",
  generatedAt: "2026-07-29T00:00:00.000Z",
  status: "reviewed" as const,
  casimirSpec: {
    specId: "casimir-spec:gr-maxwell",
    schemaVersion: "casimir_spec_scientific_claim_ir/v1" as const,
    semanticSha256: hash("1"),
    artifactSha256: hash("2"),
  },
  semanticClaim: {
    claimId: "claim:gr-maxwell:x-hyperbolicity",
    propositionSha256: hash("3"),
  },
  formalArtifact: {
    formalArtifactId:
      "casimir:lanyon:gr_hyperbolic_maxwell_1d:formal_source",
    sourceAuditArtifactSha256: hash("4"),
    sourceSha256: hash("5"),
    theoremName: "xHyperbolicity",
    theoremModule: "gr_hyperbolic_maxwell_1d",
    declarationSha256: hash("6"),
    propositionSourceSha256: hash("7"),
    observedTheoremTypeSha256: hash("8"),
    environmentPolicySha256: hash("9"),
  },
  translation: {
    kind: "reviewed_translation_mapping" as const,
    correspondenceSha256: hash("a"),
    assumptionCorrespondenceSha256: hash("b"),
    unitsAndFramesCorrespondenceSha256: hash("c"),
  },
  review: {
    reviewerPolicyId: "casimir.formal.semantic-binding-review.v1",
    reviewerPolicySha256: hash("d"),
    reviewArtifactId: "review:gr-maxwell:x-hyperbolicity",
    reviewArtifactSha256: hash("e"),
    reviewedAt: "2026-07-29T00:01:00.000Z",
  },
  limitations: [
    "does_not_validate_numerical_implementation",
    "does_not_validate_physical_truth",
  ],
});

describe("casimir_semantic_to_lean_binding/v1", () => {
  it("builds an integrity-bound reviewed mapping with no answer authority", async () => {
    const binding = await buildCasimirSemanticToLeanBindingV1(input());
    expect(await validateCasimirSemanticToLeanBindingV1(binding)).toEqual([]);
    expect(binding.authority).toMatchObject({
      semanticEquivalenceReviewed: true,
      formalPropositionChecked: false,
      validatesScientificTruth: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("rejects reviewed status without independent review evidence", async () => {
    const candidate = input();
    candidate.review = {
      reviewerPolicyId: candidate.review.reviewerPolicyId,
      reviewerPolicySha256: candidate.review.reviewerPolicySha256,
      reviewArtifactId: null as unknown as string,
      reviewArtifactSha256: null as unknown as string,
      reviewedAt: null as unknown as string,
    };
    const binding = await buildCasimirSemanticToLeanBindingV1(candidate);
    expect(await validateCasimirSemanticToLeanBindingV1(binding)).toContain(
      "reviewed binding requires complete review evidence",
    );
  });

  it("detects semantic-claim substitution after hashing", async () => {
    const binding = await buildCasimirSemanticToLeanBindingV1(input());
    const substituted = {
      ...binding,
      semanticClaim: {
        ...binding.semanticClaim,
        propositionSha256: hash("f"),
      },
    };
    expect(await validateCasimirSemanticToLeanBindingV1(substituted)).toContain(
      "artifactSha256 does not match binding content",
    );
  });
});
