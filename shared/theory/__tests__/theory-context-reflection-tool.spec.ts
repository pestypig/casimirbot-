import { describe, expect, it } from "vitest";

import {
  isHelixTheoryContextReflectionToolReceiptV1,
} from "../../contracts/helix-theory-context-reflection-tool-receipt.v1";
import type { TheoryFrontierExactContractVerificationV1 } from "../../contracts/theory-frontier-exact-contract-verification.v1";
import type {
  HelixScholarlyFullTextObservation,
  HelixScholarlyResearchObservation,
} from "../../helix-scholarly-research-observation";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { runHelixTheoryContextReflectionTool } from "../theory-context-reflection-tool";

describe("Helix theory context reflection tool runner", () => {
  it("builds a non-terminal receipt without mutating UI or solving", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner",
      threadId: "thread:shared-runner",
      prompt: "Map source residual and QEI margin in the theory graph.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      buildExplanationPlan: true,
      panelSync: {
        requested: true,
        applied: false,
        overlayMode: "live_answer_context",
        openPanel: false,
        selectedLiveContextBlock: true,
      },
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.authority.assistant_answer).toBe(false);
    expect(receipt.authority.terminal_eligible).toBe(false);
    expect(receipt.reflectionV1.terminal_eligible).toBe(false);
    expect(receipt.explanationPlanV1?.terminal_eligible).toBe(false);
    expect(receipt.panelSync).toMatchObject({
      requested: true,
      applied: false,
      panelId: "theory-badge-graph",
      selectedLiveContextBlock: true,
      openPanel: false,
      overlayMode: "live_answer_context",
    });
    expect(receipt.recommendedNextActions.every((action: { solves: boolean }) => action.solves === false)).toBe(true);
  });

  it("combines reflection and explanation recommendedNextActions", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner:actions",
      threadId: "thread:shared-runner",
      prompt: "Map source residual and QEI margin in the theory graph.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      buildExplanationPlan: true,
    });

    expect(receipt.explanationPlanV1).not.toBeNull();
    expect(receipt.recommendedNextActions).toEqual(
      expect.arrayContaining(receipt.reflectionV1.evidenceForAsk.recommendedNextActions),
    );
    expect(receipt.recommendedNextActions).toEqual(
      expect.arrayContaining(receipt.explanationPlanV1?.recommendedNextActions ?? []),
    );
  });

  it("materializes non-terminal frontier artifacts for theory frontier prompts", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner:frontier",
      threadId: "thread:shared-runner",
      prompt:
        "Run the Theory Frontier Seed Finder for missing intermediate badges between source residual and QEI margin on the theory badge graph.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      buildExplanationPlan: true,
      frontierSearchSeed: "frontier-tool-test-seed",
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.frontierSearchV1).not.toBeNull();
    expect(receipt.frontierSearchV1?.candidates.length).toBeGreaterThan(0);
    expect(receipt.frontierSearchV1?.interpretation.noTheoryValidation).toBe(true);
    expect(receipt.frontierSearchV1?.probabilityTerrain.interpretation).toBe("placement_probability_not_truth_claim");
    expect(receipt.frontierExactVerificationResultsV1.length).toBe(receipt.frontierSearchV1?.candidates.length);
    const frontierScholarlyActions = receipt.recommendedNextActions.filter(
      (action) => action.actionId === "theory-badge-graph.request_frontier_scholarly_lookup",
    );
    expect(frontierScholarlyActions.length).toBe(receipt.frontierSearchV1?.scholarlyLookupRequests.length);
    expect(frontierScholarlyActions.length).toBeGreaterThan(0);
    expect(frontierScholarlyActions.every((action) => action.solves === false)).toBe(true);
    expect(frontierScholarlyActions.every((action) => action.mutatesCalculator === false)).toBe(true);
    const firstLookupRequest = receipt.frontierSearchV1?.scholarlyLookupRequests[0];
    expect(frontierScholarlyActions[0]?.args).toEqual(
      expect.objectContaining({
        request_id: firstLookupRequest?.requestId,
        candidate_id: firstLookupRequest?.candidateId,
        target_source: "scholarly_research",
        requested_outputs: firstLookupRequest?.requestedOutputs,
        query: firstLookupRequest?.query,
        badge_ids: firstLookupRequest?.badgeIds,
        render_chunk_ids: firstLookupRequest?.renderChunkIds,
        semantic_chunk_ids: firstLookupRequest?.semanticChunkIds,
        mutating: false,
        no_auto_promote_literature: true,
      }),
    );
    expect(frontierScholarlyActions[0]?.args.expected_artifacts).toEqual(
      expect.arrayContaining(["scholarly_research_observation", "theory_frontier_literature_map"]),
    );
    expect(
      receipt.frontierExactVerificationResultsV1.every(
        (result: TheoryFrontierExactContractVerificationV1) => result.promotionAllowed === false,
      ),
    ).toBe(true);
    expect(
      receipt.frontierExactVerificationResultsV1.every(
        (result: TheoryFrontierExactContractVerificationV1) => result.validatesTheory === false,
      ),
    ).toBe(true);
    expect(receipt.authority.terminal_eligible).toBe(false);
    expect(receipt.authority.assistant_answer).toBe(false);
  });

  it("re-enters scholarly observations as a non-terminal frontier literature map", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const scholarlyResearchObservation: HelixScholarlyResearchObservation = {
      schema: "helix.scholarly_research_observation.v1",
      artifact_id: "ask:frontier-literature:scholarly_research_observation",
      turn_id: "ask:frontier-literature",
      capability: "scholarly-research.lookup_papers",
      query: "qei_margin qei_bound qei_sample source residual",
      intent: "paper_search",
      providers_considered: ["arxiv"],
      providers_called: ["arxiv"],
      evidence_refs: [{
        ref: "arxiv:synthetic-qei",
        provider: "arxiv",
        retrieved_at_ms: 1781827200000,
      }],
      papers: [{
        result_id: "arxiv:synthetic-qei",
        title: "Synthetic QEI Sampling Bound",
        authors: [{ name: "Example Author" }],
        year: 2026,
        abstract: "The qei_margin = qei_bound - qei_sample diagnostic is limited by source residual closure.",
        identifiers: {
          arxiv_id: "2606.00001",
          url: "https://example.test/synthetic-qei",
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
    const scholarlyFullTextObservation: HelixScholarlyFullTextObservation = {
      schema: "helix.scholarly_full_text_observation.v1",
      artifact_id: "ask:frontier-literature:scholarly_full_text_observation",
      turn_id: "ask:frontier-literature",
      capability: "scholarly-research.fetch_full_text",
      query: scholarlyResearchObservation.query,
      paper_result_id: "arxiv:synthetic-qei",
      title: "Synthetic QEI Sampling Bound",
      source_kind: "pdf",
      source_pdf_ref: "artifact://scholarly-pdf/synthetic-qei.pdf",
      cache_integrity_hash: "sha256:frontier-literature",
      total_pages: 6,
      pages_parsed: 6,
      page_text_refs: [],
      selected_chunks: [{
        chunk_id: "chunk:qei-source-residual",
        paper_result_id: "arxiv:synthetic-qei",
        title: "Synthetic QEI Sampling Bound",
        page_start: 3,
        page_end: 3,
        text_excerpt:
          "The source residual uses source_required and source_available values in J/m^3 and cannot validate a physical mechanism.",
        relevance_score: 0.88,
        citation_ref: "arxiv:synthetic-qei#page=3",
        source_text_ref: "artifact://scholarly-pdf/synthetic-qei.pdf/page/3#text",
      }],
      visual_candidates: [],
      missing_requirements: [],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
    };

    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner:frontier-literature",
      threadId: "thread:shared-runner",
      prompt:
        "Run the Theory Frontier Seed Finder with scholarly full text and map extracted equations back to semantic chunks.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      frontierSearchSeed: "frontier-literature-tool-test-seed",
      scholarlyResearchObservation,
      scholarlyFullTextObservation,
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.frontierLiteratureMapV1).not.toBeNull();
    expect(receipt.frontierLiteratureMapV1?.authority.assistant_answer).toBe(false);
    expect(receipt.frontierLiteratureMapV1?.authority.terminal_eligible).toBe(false);
    expect(receipt.frontierLiteratureMapV1?.authority.promotionAllowed).toBe(false);
    expect(receipt.frontierLiteratureMapV1?.summary.mappingCount).toBeGreaterThan(0);
  });
});
