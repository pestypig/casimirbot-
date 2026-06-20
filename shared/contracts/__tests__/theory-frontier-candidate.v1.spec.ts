import { describe, expect, it } from "vitest";
import {
  buildTheoryFrontierCandidateV1,
  isTheoryFrontierCandidateV1,
  validateTheoryFrontierCandidateV1,
} from "../theory-frontier-candidate.v1";

function buildCompleteCandidate() {
  return buildTheoryFrontierCandidateV1({
    generatedAt: "2026-06-19T00:00:00.000Z",
    candidateId: "frontier:test",
    frontierKind: "candidate_connection",
    status: "exact_verification_pending",
    title: "Frontier: Einstein field equation <-> source residual",
    summary: "Candidate placement only; exact verification is required before claim movement.",
    badgeIds: ["physics.gr.einstein_field_equation", "nhm2.closure.source_residual"],
    missingBadgeTitle: null,
    replay: {
      graphHash: "tfh_test",
      graphId: "helix-theory-badge-graph",
      query: "source residual",
      searchSeed: "seed:test",
      taxonomyVersion: "theory_frontier_taxonomy/v1",
      scoringVersion: "theory_frontier_scoring/v1",
      evidenceReferenceIds: ["repo_module::shared/theory/example.ts::::"],
    },
    biomeRegion: {
      scaleEnvelopeLog10M: { min: -18, max: 1 },
      scaleBands: ["planck_quantum", "device_laboratory"],
      domainKeys: ["qei_stress_energy", "nhm2"],
      fidelityKeys: ["canonical", "diagnostic_gate"],
      renderChunkIds: ["0:0"],
      semanticChunkIds: ["nhm2:device_laboratory:diagnostic:claim_medium"],
      averageClaimPressure: 0.8,
    },
    congruence: {
      unitCompatibility: "compatible",
      sharedUnitSignatures: ["M L^-1 T^-2"],
      dimensionalIssues: [],
      symbolCompatibilityScore: 0.5,
      sharedSymbols: ["T_mu_nu"],
      equationFamilyCompatibilityScore: 0.5,
      sharedEquationFamilies: ["gr_source"],
      sharedFirstPrincipleBadgeIds: ["physics.gr.einstein_field_equation"],
      firstPrinciplesPathBadgeIds: ["physics.gr.einstein_field_equation", "nhm2.closure.source_residual"],
      allowedTypedEdgeRelations: ["requires"],
      requiredObservables: ["test: server/__tests__/example.test.ts"],
      requiredArtifacts: ["repo_module:shared/theory/example.ts"],
      sourceReferences: [{ kind: "repo_module", path: "shared/theory/example.ts" }],
      falsificationChecks: ["candidate fails if source residual observable is absent"],
      uncertaintyBudget: ["placement entropy is not truth probability"],
      claimBoundaryNotes: ["nhm2.closure.source_residual: promotion not allowed"],
    },
    scores: {
      cheapBiomeScore: 0.8,
      congruenceScore: 0.7,
      evidenceClosureScore: 0.6,
      informationGainBits: 0.1,
      estimatedCost: 2,
      verifiedFrontierYieldPerBudget: 1.05,
    },
    literaturePolicy: {
      scholarlyLookupAllowed: true,
      noAutoPromoteLiterature: true,
      allowedEvidenceEffects: [
        "support_existing_context",
        "conflict_with_badge",
        "identify_missing_evidence",
        "suggest_missing_badge",
        "unrelated",
      ],
    },
    claimBoundary: {
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
      terminalEligible: false,
      assistantAnswer: false,
      probabilityMeans: "placement_uncertainty_not_truth_probability",
    },
  });
}

describe("theory_frontier_candidate/v1", () => {
  it("validates a non-terminal frontier candidate", () => {
    const candidate = buildCompleteCandidate();

    expect(validateTheoryFrontierCandidateV1(candidate)).toEqual([]);
    expect(isTheoryFrontierCandidateV1(candidate)).toBe(true);
    expect(candidate.claimBoundary.promotionAllowed).toBe(false);
    expect(candidate.claimBoundary.probabilityMeans).toBe("placement_uncertainty_not_truth_probability");
  });

  it("rejects promotion authority and forbidden validation language", () => {
    const candidate = buildCompleteCandidate();
    const unsafe = {
      ...candidate,
      summary: "This frontier candidate validates a working warp drive.",
      claimBoundary: {
        ...candidate.claimBoundary,
        promotionAllowed: true,
      },
    };

    const issues = validateTheoryFrontierCandidateV1(unsafe);
    expect(issues).toContain("claimBoundary.promotionAllowed must be false");
    expect(issues.some((issue) => issue.includes("forbidden frontier validation phrase matched"))).toBe(true);
  });

  it("rejects malformed literature policies that could widen evidence authority", () => {
    const candidate = buildCompleteCandidate();
    const unsafe = {
      ...candidate,
      literaturePolicy: {
        scholarlyLookupAllowed: "yes",
        noAutoPromoteLiterature: true,
        allowedEvidenceEffects: ["support_existing_context", "promote_theory_edge"],
      },
    };

    expect(validateTheoryFrontierCandidateV1(unsafe)).toEqual(
      expect.arrayContaining([
        "literaturePolicy.scholarlyLookupAllowed must be boolean",
        "literaturePolicy.allowedEvidenceEffects contains invalid effect promote_theory_edge",
        "literaturePolicy.allowedEvidenceEffects must include conflict_with_badge",
        "literaturePolicy.allowedEvidenceEffects must include identify_missing_evidence",
        "literaturePolicy.allowedEvidenceEffects must include suggest_missing_badge",
        "literaturePolicy.allowedEvidenceEffects must include unrelated",
      ]),
    );
  });
});
