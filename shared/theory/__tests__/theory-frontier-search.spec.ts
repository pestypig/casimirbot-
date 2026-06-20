import { describe, expect, it } from "vitest";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  buildTheoryFrontierSearch,
  hashTheoryFrontierGraph,
} from "../theory-frontier-search";
import { verifyTheoryFrontierCandidateExactContract } from "../theory-frontier-exact-verifier";

describe("theory frontier search", () => {
  it("preserves deterministic candidate replay for the same graph, query, and seed", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const first = buildTheoryFrontierSearch({
      graph,
      query: "source residual QEI margin first principles",
      searchSeed: "deterministic-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });
    const second = buildTheoryFrontierSearch({
      graph,
      query: "source residual QEI margin first principles",
      searchSeed: "deterministic-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });

    expect(first.graphHash).toBe(hashTheoryFrontierGraph(graph));
    expect(first.searchId).toBe(second.searchId);
    expect(first.candidates.map((candidate) => candidate.candidateId)).toEqual(
      second.candidates.map((candidate) => candidate.candidateId),
    );
    expect(first.candidates.map((candidate) => candidate.scores.verifiedFrontierYieldPerBudget)).toEqual(
      second.candidates.map((candidate) => candidate.scores.verifiedFrontierYieldPerBudget),
    );
    expect(first.probabilityTerrain.candidateProbabilityById).toEqual(second.probabilityTerrain.candidateProbabilityById);
    expect(first.scholarlyLookupRequests.map((request) => request.requestId)).toEqual(
      second.scholarlyLookupRequests.map((request) => request.requestId),
    );
    expect(first.scholarlyLookupRequests.every((request) =>
      first.candidates.some((candidate) => candidate.candidateId === request.candidateId),
    )).toBe(true);
  });

  it("keeps probability terrain scoped to placement uncertainty", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "photon energy wavelength solar spectrum",
      searchSeed: "terrain-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 6,
    });

    expect(search.probabilityTerrain.normalizedMass).toBeCloseTo(1, 5);
    expect(search.probabilityTerrain.posteriorEntropyBits).toBeGreaterThanOrEqual(0);
    expect(search.probabilityTerrain.interpretation).toBe("placement_probability_not_truth_claim");
    expect(
      search.candidates.every(
        (candidate) => candidate.claimBoundary.probabilityMeans === "placement_uncertainty_not_truth_probability",
      ),
    ).toBe(true);
    expect(search.scholarlyLookupRequests.every((request) => request.noAutoPromoteLiterature === true)).toBe(true);
    expect(search.scholarlyLookupRequests.every((request) => request.mutating === false)).toBe(true);
  });

  it("marks explicit claim-boundary regions as blocked candidates", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const claimBoundaryBadge = graph.badges.find((badge) => badge.level === "claim_boundary");
    expect(claimBoundaryBadge).toBeDefined();

    const search = buildTheoryFrontierSearch({
      graph,
      query: "claim boundary promotion validation",
      searchSeed: "boundary-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      originBadgeIds: claimBoundaryBadge ? [claimBoundaryBadge.id] : [],
      limit: 10,
    });

    expect(search.candidates.some((candidate) => candidate.status === "blocked_by_boundary")).toBe(true);
    expect(
      search.candidates
        .filter((candidate) => candidate.status === "blocked_by_boundary")
        .every((candidate) => candidate.claimBoundary.promotionAllowed === false),
    ).toBe(true);
  });

  it("classifies direct connections separately from missing or unresolved frontier regions", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const directEdge = graph.edges.find((edge) =>
      [
        "derives",
        "requires",
        "specializes",
        "approximates",
        "bounds",
        "shares_units",
        "uses_constant",
        "numerically_solves",
        "diagnostic_checks",
        "documents",
        "blocks",
      ].includes(edge.relation),
    );
    expect(directEdge).toBeDefined();
    if (!directEdge) throw new Error("frontier search graph has no supported direct edge");

    const directSearch = buildTheoryFrontierSearch({
      graph,
      query: `${directEdge.from} ${directEdge.to}`,
      searchSeed: "frontier-kind-direct-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      originBadgeIds: [directEdge.from, directEdge.to],
      limit: 25,
    });
    expect(directSearch.candidates.some((candidate) => candidate.frontierKind === "candidate_connection")).toBe(true);

    const broadSearch = buildTheoryFrontierSearch({
      graph,
      query: "source residual photon wavelength QEI margin claim boundary missing intermediate semantic region",
      searchSeed: "frontier-kind-broad-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 25,
    });
    const broadKinds = new Set(broadSearch.candidates.map((candidate) => candidate.frontierKind));
    expect(
      broadKinds.has("missing_intermediate_badge") || broadKinds.has("unresolved_semantic_region"),
    ).toBe(true);
    expect(
      broadSearch.candidates
        .filter((candidate) => candidate.frontierKind === "missing_intermediate_badge")
        .every((candidate) => typeof candidate.missingBadgeTitle === "string" && candidate.missingBadgeTitle.length > 0),
    ).toBe(true);
    expect(
      broadSearch.candidates
        .filter((candidate) => candidate.frontierKind === "unresolved_semantic_region")
        .every(
          (candidate) =>
            candidate.status === "needs_observable" ||
            candidate.status === "needs_scholarly_evidence" ||
            candidate.congruence.requiredObservables.length === 0 ||
            candidate.congruence.sourceReferences.length === 0,
        ),
    ).toBe(true);
  });

  it("verifies exact-contract completeness without granting validation authority", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "Einstein tensor source residual",
      searchSeed: "verifier-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });
    const candidate = search.candidates[0];
    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("frontier search returned no candidates");

    const generatedCheck = verifyTheoryFrontierCandidateExactContract(candidate);
    expect(generatedCheck.promotionAllowed).toBe(false);
    expect(generatedCheck.validatesTheory).toBe(false);

    const completeCandidate = {
      ...candidate,
      congruence: {
        ...candidate.congruence,
        unitCompatibility: "compatible" as const,
        dimensionalIssues: [],
        sharedSymbols: candidate.congruence.sharedSymbols.length > 0 ? candidate.congruence.sharedSymbols : ["T_mu_nu"],
        symbolCompatibilityScore: Math.max(candidate.congruence.symbolCompatibilityScore, 0.5),
        sharedEquationFamilies:
          candidate.congruence.sharedEquationFamilies.length > 0
            ? candidate.congruence.sharedEquationFamilies
            : ["gr_source_residual"],
        equationFamilyCompatibilityScore: Math.max(candidate.congruence.equationFamilyCompatibilityScore, 0.5),
        sharedFirstPrincipleBadgeIds:
          candidate.congruence.sharedFirstPrincipleBadgeIds.length > 0
            ? candidate.congruence.sharedFirstPrincipleBadgeIds
            : ["physics.gr.einstein_field_equation"],
        firstPrinciplesPathBadgeIds:
          candidate.congruence.firstPrinciplesPathBadgeIds.length > 0
            ? candidate.congruence.firstPrinciplesPathBadgeIds
            : ["physics.gr.einstein_field_equation", ...candidate.badgeIds],
        requiredObservables:
          candidate.congruence.requiredObservables.length > 0
            ? candidate.congruence.requiredObservables
            : ["test: server/__tests__/source-residual.test.ts"],
        sourceReferences:
          candidate.congruence.sourceReferences.length > 0
            ? candidate.congruence.sourceReferences
            : [{ kind: "repo_module" as const, path: "shared/theory/theory-frontier-search.ts" }],
      },
      replay: {
        ...candidate.replay,
        evidenceReferenceIds:
          candidate.replay.evidenceReferenceIds.length > 0
            ? candidate.replay.evidenceReferenceIds
            : ["repo_module::shared/theory/theory-frontier-search.ts::::"],
      },
    };

    const verified = verifyTheoryFrontierCandidateExactContract(completeCandidate);
    expect(verified.exactContractSatisfied).toBe(true);
    expect(verified.promotionAllowed).toBe(false);
    expect(verified.validatesTheory).toBe(false);

    const incomplete = {
      ...completeCandidate,
      congruence: {
        ...completeCandidate.congruence,
        requiredObservables: [],
      },
    };
    const rejected = verifyTheoryFrontierCandidateExactContract(incomplete);
    expect(rejected.exactContractSatisfied).toBe(false);
    expect(rejected.issues).toContain("missing required observables");
  });
});
