import { describe, expect, it } from "vitest";
import {
  buildTheoryFrontierLiteratureMapV1,
  isTheoryFrontierLiteratureMapV1,
  validateTheoryFrontierLiteratureMapV1,
} from "../theory-frontier-literature-map.v1";

function buildMap() {
  return buildTheoryFrontierLiteratureMapV1({
    generatedAt: "2026-06-19T00:00:00.000Z",
    mapId: "literature_map:test",
    frontierCandidateIds: ["frontier:test"],
    replay: {
      graphHash: "tfh_test",
      graphId: "helix-theory-badge-graph",
      query: "QEI source residual",
      searchSeed: "seed:test",
      taxonomyVersion: "theory_frontier_taxonomy/v1",
      scoringVersion: "theory_frontier_scoring/v1",
      literatureMapVersion: "theory_frontier_literature_map/v1",
      evidenceReferenceIds: ["literature_ref::doi:10.test/example::::paper:test"],
    },
    sources: [
      {
        sourceId: "paper:test",
        title: "Synthetic QEI context paper",
        doi: "10.test/example",
        url: "https://example.test/paper",
        authors: ["Example Author"],
        year: 2026,
        retrieval: {
          targetSource: "scholarly_research",
          requestedOutputs: ["scholarly_paper_refs", "doi_metadata", "scholarly_full_text"],
          fullTextRetrieved: true,
          fullTextDigest: "sha256:test",
        },
      },
    ],
    extractedEvidence: [
      {
        itemId: "paper:test:item:1",
        sourceId: "paper:test",
        kind: "equation",
        text: "qei_margin = qei_bound - qei_sample",
        symbols: ["qei_margin"],
        equationFamilies: ["qei_sampling_bound"],
        unitSignatures: ["M L^-1 T^-2"],
        values: [],
        limitations: ["sampling assumptions remain required"],
        pageRefs: ["p. 3"],
        confidence: 0.86,
      },
    ],
    mappings: [
      {
        mappingId: "literature_mapping:test",
        sourceId: "paper:test",
        sourceItemId: "paper:test:item:1",
        effect: "support_existing_context",
        candidateIds: ["frontier:test"],
        badgeIds: ["nhm2.qei.sampling_window"],
        renderChunkIds: ["0:0"],
        semanticChunkIds: ["qei_stress_energy:device_laboratory:diagnostic:claim_medium"],
        extractedClaims: [],
        extractedEquations: ["qei_margin = qei_bound - qei_sample"],
        extractedValues: [],
        extractedLimitations: ["sampling assumptions remain required"],
        reasons: ["literature effect is support_existing_context; no theory edge promotion is authorized"],
      },
    ],
  });
}

describe("theory_frontier_literature_map/v1", () => {
  it("validates a non-terminal scholarly evidence map", () => {
    const map = buildMap();

    expect(validateTheoryFrontierLiteratureMapV1(map)).toEqual([]);
    expect(isTheoryFrontierLiteratureMapV1(map)).toBe(true);
    expect(map.authority.noAutoPromoteLiterature).toBe(true);
    expect(map.authority.promotionAllowed).toBe(false);
    expect(map.authority.validatesTheory).toBe(false);
  });

  it("rejects literature maps that grant promotion authority", () => {
    const map = buildMap();
    const unsafe = {
      ...map,
      authority: {
        ...map.authority,
        promotionAllowed: true,
        noAutoPromoteLiterature: false,
      },
    };

    expect(validateTheoryFrontierLiteratureMapV1(unsafe)).toEqual(
      expect.arrayContaining([
        "authority.promotionAllowed must be false",
        "authority.noAutoPromoteLiterature must be true",
      ]),
    );
  });

  it("rejects malformed retrieval outputs and authority evidence effects", () => {
    const map = buildMap();
    const unsafe = {
      ...map,
      sources: [
        {
          ...map.sources[0],
          retrieval: {
            ...map.sources[0].retrieval,
            requestedOutputs: ["scholarly_paper_refs", "promote_theory_edge"],
            fullTextRetrieved: true,
            fullTextDigest: "",
          },
        },
      ],
      authority: {
        ...map.authority,
        allowedEvidenceEffects: ["support_existing_context", "validate_theory"],
      },
    };

    expect(validateTheoryFrontierLiteratureMapV1(unsafe)).toEqual(
      expect.arrayContaining([
        "sources[0].retrieval.requestedOutputs contains invalid output promote_theory_edge",
        "sources[0].retrieval.fullTextDigest must be non-empty when fullTextRetrieved is true",
        "authority.allowedEvidenceEffects contains invalid effect validate_theory",
        "authority.allowedEvidenceEffects must include conflict_with_badge",
        "authority.allowedEvidenceEffects must include identify_missing_evidence",
        "authority.allowedEvidenceEffects must include suggest_missing_badge",
        "authority.allowedEvidenceEffects must include unrelated",
      ]),
    );
  });
});
