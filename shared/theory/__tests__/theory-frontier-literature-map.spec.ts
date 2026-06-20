import { describe, expect, it } from "vitest";
import type {
  HelixScholarlyFullTextObservation,
  HelixScholarlyResearchObservation,
} from "../../helix-scholarly-research-observation";
import { isTheoryFrontierLiteratureMapV1 } from "../../contracts/theory-frontier-literature-map.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  buildTheoryFrontierLiteratureMap,
  buildTheoryFrontierLiteratureMapFromScholarlyObservations,
  buildTheoryFrontierScholarlyLookupRequests,
} from "../theory-frontier-literature-map";
import { verifyTheoryFrontierCandidateExactContract } from "../theory-frontier-exact-verifier";
import { buildTheoryFrontierSearch } from "../theory-frontier-search";

describe("theory frontier literature map", () => {
  it("builds deterministic scholarly lookup requests for unresolved candidates", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-request-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 5,
    });

    const requests = buildTheoryFrontierScholarlyLookupRequests(search.candidates);

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((request) => request.targetSource === "scholarly_research")).toBe(true);
    expect(requests.every((request) => request.mutating === false)).toBe(true);
    expect(requests.every((request) => request.noAutoPromoteLiterature === true)).toBe(true);
    expect(requests.some((request) => request.requestedOutputs.includes("scholarly_full_text"))).toBe(true);
  });

  it("maps extracted paper equations and limitations to badges/chunks without promotion", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-map-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });
    const source = {
      sourceId: "paper:qei-synthetic",
      title: "Synthetic quantum inequality sampling discussion",
      doi: "10.synthetic/qei",
      url: "https://example.test/qei",
      authors: ["Example Author"],
      year: 2026,
      retrieval: {
        targetSource: "scholarly_research" as const,
        requestedOutputs: ["scholarly_paper_refs" as const, "doi_metadata" as const, "scholarly_full_text" as const],
        fullTextRetrieved: true,
        fullTextDigest: "sha256:qei-synthetic",
      },
    };

    const first = buildTheoryFrontierLiteratureMap({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-map-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      candidates: search.candidates,
      sources: [source],
      extractedEvidence: [
        {
          itemId: "paper:qei-synthetic:item:equation",
          sourceId: source.sourceId,
          kind: "equation",
          text: "qei_margin = qei_bound - qei_sample",
          symbols: ["qei_margin", "qei_bound", "qei_sample"],
          equationFamilies: ["qei_sampling_bound"],
          unitSignatures: ["M L^-1 T^-2"],
          values: [],
          limitations: [],
          pageRefs: ["p. 4"],
          confidence: 0.9,
        },
        {
          itemId: "paper:qei-synthetic:item:limitation",
          sourceId: source.sourceId,
          kind: "limitation",
          text: "The sampling argument cannot validate a physical warp mechanism without independent source closure.",
          symbols: ["qei_sample"],
          equationFamilies: ["qei_sampling_bound"],
          unitSignatures: ["M L^-1 T^-2"],
          values: [],
          limitations: ["cannot validate a physical warp mechanism", "requires independent source closure"],
          pageRefs: ["p. 7"],
          confidence: 0.82,
        },
      ],
    });
    const second = buildTheoryFrontierLiteratureMap({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-map-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      candidates: search.candidates,
      sources: [source],
      extractedEvidence: first.extractedEvidence,
    });

    expect(isTheoryFrontierLiteratureMapV1(first)).toBe(true);
    expect(first.mapId).toBe(second.mapId);
    expect(first.mappings.map((mapping) => mapping.mappingId)).toEqual(second.mappings.map((mapping) => mapping.mappingId));
    expect(first.mappings.some((mapping) => mapping.badgeIds.includes("nhm2.qei.sampling_window"))).toBe(true);
    expect(first.mappings.some((mapping) => mapping.effect === "support_existing_context")).toBe(true);
    expect(first.mappings.some((mapping) => mapping.effect === "conflict_with_badge")).toBe(true);
    expect(first.authority.promotionAllowed).toBe(false);
    expect(first.authority.validatesTheory).toBe(false);
  });

  it("normalizes scholarly lookup and full-text observations into a non-terminal literature map", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-observation-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });
    const researchObservation: HelixScholarlyResearchObservation = {
      schema: "helix.scholarly_research_observation.v1",
      artifact_id: "ask:test:scholarly_research_observation",
      turn_id: "ask:test",
      capability: "scholarly-research.lookup_papers",
      query: "qei_margin qei_bound qei_sample source residual",
      intent: "paper_search",
      providers_considered: ["arxiv"],
      providers_called: ["arxiv"],
      evidence_refs: [{
        ref: "arxiv:synthetic-qei",
        provider: "arxiv",
        url: "https://example.test/synthetic-qei",
        retrieved_at_ms: 1781827200000,
      }],
      papers: [{
        result_id: "arxiv:synthetic-qei",
        title: "Synthetic QEI Sampling Bound",
        authors: [{ name: "Example Author" }],
        year: 2026,
        abstract:
          "The qei_margin = qei_bound - qei_sample diagnostic compares source residual pressure in J/m^3 but cannot validate a physical mechanism.",
        identifiers: {
          arxiv_id: "2606.00001",
          url: "https://example.test/synthetic-qei",
          pdf_url: "https://example.test/synthetic-qei.pdf",
        },
        evidence_refs: ["arxiv:synthetic-qei"],
        source_providers: ["arxiv"],
        confidence: "high",
      }],
      missing_requirements: [],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const fullTextObservation: HelixScholarlyFullTextObservation = {
      schema: "helix.scholarly_full_text_observation.v1",
      artifact_id: "ask:test:scholarly_full_text_observation",
      turn_id: "ask:test",
      capability: "scholarly-research.fetch_full_text",
      query: researchObservation.query,
      paper_result_id: "arxiv:synthetic-qei",
      title: "Synthetic QEI Sampling Bound",
      source_url: "https://example.test/synthetic-qei.pdf",
      source_kind: "pdf",
      source_pdf_ref: "artifact://scholarly-pdf/synthetic-qei.pdf",
      cache_integrity_hash: "sha256:synthetic-qei",
      total_pages: 8,
      pages_parsed: 8,
      page_text_refs: [],
      selected_chunks: [{
        chunk_id: "chunk:qei-equation",
        paper_result_id: "arxiv:synthetic-qei",
        title: "Synthetic QEI Sampling Bound",
        page_start: 4,
        page_end: 4,
        section_hint: "Results",
        text_excerpt:
          "Results define qei_margin = qei_bound - qei_sample and require source_required and source_available residual closure in J/m^3.",
        relevance_score: 0.92,
        citation_ref: "arxiv:synthetic-qei#page=4",
        source_text_ref: "artifact://scholarly-pdf/synthetic-qei.pdf/page/4#text",
      }],
      visual_candidates: [],
      missing_requirements: [],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
    };

    const map = buildTheoryFrontierLiteratureMapFromScholarlyObservations({
      graph,
      query: "QEI sampling source residual",
      searchSeed: "literature-observation-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      candidates: search.candidates,
      researchObservation,
      fullTextObservation,
    });

    expect(map).not.toBeNull();
    expect(isTheoryFrontierLiteratureMapV1(map)).toBe(true);
    expect(map?.sources[0]?.retrieval.fullTextRetrieved).toBe(true);
    expect(map?.sources[0]?.retrieval.fullTextDigest).toBe("sha256:synthetic-qei");
    expect(map?.extractedEvidence.some((item) => item.kind === "equation")).toBe(true);
    expect(map?.mappings.some((mapping) => mapping.badgeIds.includes("nhm2.qei.sampling_window"))).toBe(true);
    expect(map?.mappings.some((mapping) => mapping.candidateIds.length > 0)).toBe(true);
    expect(map?.authority.assistant_answer).toBe(false);
    expect(map?.authority.promotionAllowed).toBe(false);
    expect(map?.authority.noAutoPromoteLiterature).toBe(true);
  });

  it("replays the full frontier search to scholarly literature map to exact verifier pipeline deterministically", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const query = "QEI sampling source residual frontier";
    const searchSeed = "frontier-e2e-replay-seed";
    const generatedAt = "2026-06-19T00:00:00.000Z";
    const firstSearch = buildTheoryFrontierSearch({
      graph,
      query,
      searchSeed,
      generatedAt,
      limit: 8,
    });
    const secondSearch = buildTheoryFrontierSearch({
      graph,
      query,
      searchSeed,
      generatedAt,
      limit: 8,
    });

    expect(firstSearch.searchId).toBe(secondSearch.searchId);
    expect(firstSearch.graphHash).toBe(secondSearch.graphHash);
    expect(firstSearch.candidates.map((candidate) => candidate.candidateId)).toEqual(
      secondSearch.candidates.map((candidate) => candidate.candidateId),
    );
    expect(firstSearch.scholarlyLookupRequests.map((request) => request.requestId)).toEqual(
      secondSearch.scholarlyLookupRequests.map((request) => request.requestId),
    );

    const request = firstSearch.scholarlyLookupRequests.find((entry) =>
      entry.requestedOutputs.includes("scholarly_full_text"),
    ) ?? firstSearch.scholarlyLookupRequests[0];
    expect(request).toBeDefined();
    if (!request) throw new Error("frontier search did not produce a scholarly lookup request");
    expect(request.mutating).toBe(false);
    expect(request.noAutoPromoteLiterature).toBe(true);
    expect(request.badgeIds.length).toBeGreaterThan(0);
    expect(request.renderChunkIds.length + request.semanticChunkIds.length).toBeGreaterThan(0);

    const researchObservation: HelixScholarlyResearchObservation = {
      schema: "helix.scholarly_research_observation.v1",
      artifact_id: "ask:e2e:scholarly_research_observation",
      turn_id: "ask:e2e",
      capability: "scholarly-research.lookup_papers",
      query: request.query,
      intent: "paper_search",
      providers_considered: ["arxiv"],
      providers_called: ["arxiv"],
      evidence_refs: [{
        ref: "arxiv:frontier-e2e-qei",
        provider: "arxiv",
        url: "https://example.test/frontier-e2e-qei",
        retrieved_at_ms: 1781827200000,
      }],
      papers: [{
        result_id: "arxiv:frontier-e2e-qei",
        title: "Replayable QEI Source Residual Frontier Evidence",
        authors: [{ name: "Example Author" }],
        year: 2026,
        abstract:
          "The qei_margin = qei_bound - qei_sample equation supports source residual context but cannot validate a physical mechanism or promote a theory edge.",
        identifiers: {
          arxiv_id: "2606.00002",
          url: "https://example.test/frontier-e2e-qei",
          pdf_url: "https://example.test/frontier-e2e-qei.pdf",
        },
        evidence_refs: ["arxiv:frontier-e2e-qei"],
        source_providers: ["arxiv"],
        confidence: "high",
      }],
      missing_requirements: [],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const fullTextObservation: HelixScholarlyFullTextObservation = {
      schema: "helix.scholarly_full_text_observation.v1",
      artifact_id: "ask:e2e:scholarly_full_text_observation",
      turn_id: "ask:e2e",
      capability: "scholarly-research.fetch_full_text",
      query: request.query,
      paper_result_id: "arxiv:frontier-e2e-qei",
      title: "Replayable QEI Source Residual Frontier Evidence",
      source_url: "https://example.test/frontier-e2e-qei.pdf",
      source_kind: "pdf",
      source_pdf_ref: "artifact://scholarly-pdf/frontier-e2e-qei.pdf",
      cache_integrity_hash: "sha256:frontier-e2e-qei",
      total_pages: 9,
      pages_parsed: 9,
      page_text_refs: [],
      selected_chunks: [{
        chunk_id: "chunk:qei-source-residual-frontier",
        paper_result_id: "arxiv:frontier-e2e-qei",
        title: "Replayable QEI Source Residual Frontier Evidence",
        page_start: 5,
        page_end: 5,
        section_hint: "Bounded evidence",
        text_excerpt:
          "The full text states qei_margin = qei_bound - qei_sample, reports source residual pressure in J/m^3, and requires independent source closure before any mechanism claim.",
        relevance_score: 0.94,
        citation_ref: "arxiv:frontier-e2e-qei#page=5",
        source_text_ref: "artifact://scholarly-pdf/frontier-e2e-qei.pdf/page/5#text",
      }],
      visual_candidates: [],
      missing_requirements: [],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
    };

    const firstMap = buildTheoryFrontierLiteratureMapFromScholarlyObservations({
      graph,
      query,
      searchSeed,
      generatedAt,
      candidates: firstSearch.candidates,
      researchObservation,
      fullTextObservation,
    });
    const secondMap = buildTheoryFrontierLiteratureMapFromScholarlyObservations({
      graph,
      query,
      searchSeed,
      generatedAt,
      candidates: secondSearch.candidates,
      researchObservation,
      fullTextObservation,
    });

    expect(firstMap).not.toBeNull();
    expect(secondMap).not.toBeNull();
    if (!firstMap || !secondMap) throw new Error("frontier literature map was not built");
    expect(isTheoryFrontierLiteratureMapV1(firstMap)).toBe(true);
    expect(firstMap.mapId).toBe(secondMap.mapId);
    expect(firstMap.replay.graphHash).toBe(firstSearch.graphHash);
    expect(firstMap.replay.searchSeed).toBe(searchSeed);
    expect(firstMap.replay.evidenceReferenceIds).toEqual(secondMap.replay.evidenceReferenceIds);
    expect(firstMap.sources[0]?.retrieval.fullTextRetrieved).toBe(true);
    expect(firstMap.sources[0]?.retrieval.fullTextDigest).toBe("sha256:frontier-e2e-qei");
    expect(firstMap.mappings.some((mapping) => mapping.candidateIds.length > 0)).toBe(true);
    expect(firstMap.mappings.some((mapping) => mapping.effect === "conflict_with_badge")).toBe(true);
    expect(firstMap.authority.assistant_answer).toBe(false);
    expect(firstMap.authority.validatesTheory).toBe(false);
    expect(firstMap.authority.promotionAllowed).toBe(false);

    const candidate = firstSearch.candidates.find((entry) => entry.candidateId === request.candidateId) ??
      firstSearch.candidates[0];
    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("frontier search returned no candidates");
    const verified = verifyTheoryFrontierCandidateExactContract({
      ...candidate,
      congruence: {
        ...candidate.congruence,
        unitCompatibility: "compatible",
        dimensionalIssues: [],
        sharedSymbols: candidate.congruence.sharedSymbols.length > 0 ? candidate.congruence.sharedSymbols : ["qei_margin"],
        symbolCompatibilityScore: Math.max(candidate.congruence.symbolCompatibilityScore, 0.5),
        sharedEquationFamilies:
          candidate.congruence.sharedEquationFamilies.length > 0
            ? candidate.congruence.sharedEquationFamilies
            : ["qei_sampling_bound"],
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
            : ["scholarly_full_text_observation:arxiv:frontier-e2e-qei#page=5"],
        sourceReferences:
          candidate.congruence.sourceReferences.length > 0
            ? candidate.congruence.sourceReferences
            : [{ kind: "artifact" as const, id: firstMap.mapId }],
        falsificationChecks:
          candidate.congruence.falsificationChecks.length > 0
            ? candidate.congruence.falsificationChecks
            : ["candidate fails if source closure remains absent"],
        uncertaintyBudget:
          candidate.congruence.uncertaintyBudget.length > 0
            ? candidate.congruence.uncertaintyBudget
            : ["placement entropy only; not truth probability"],
        claimBoundaryNotes:
          candidate.congruence.claimBoundaryNotes.length > 0
            ? candidate.congruence.claimBoundaryNotes
            : ["literature map remains non-terminal and cannot promote theory edges"],
      },
      replay: {
        ...candidate.replay,
        evidenceReferenceIds: [
          ...new Set([
            ...candidate.replay.evidenceReferenceIds,
            ...firstMap.replay.evidenceReferenceIds,
          ]),
        ],
      },
    });

    expect(verified.exactContractSatisfied).toBe(true);
    expect(verified.promotionAllowed).toBe(false);
    expect(verified.validatesTheory).toBe(false);
    expect(verified.solvesPhysicalMechanism).toBe(false);
    expect(verified.requirementDetails.every((detail) => detail.status === "passed")).toBe(true);
  });
});
