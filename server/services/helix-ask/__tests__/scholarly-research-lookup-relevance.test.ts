import { describe, expect, it } from "vitest";
import {
  runScholarlyResearchLookup,
  type ScholarlyFetch,
} from "../retrieval/scholarly-research-lookup";

describe("scholarly research lookup relevance", () => {
  it("admits a claim-relevant paper across inflections without treating retry modifiers as topic terms", async () => {
    const fetchImpl: ScholarlyFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            paperId: "qi-negative-energy",
            title: "Quantum Inequalities and Negative Energy",
            abstract:
              "We derive bounds for sampling functions along timelike worldlines and examine the duration of sampled energy densities.",
            authors: [{ name: "A. Researcher" }],
            year: 2000,
            externalIds: { ArXiv: "gr-qc/0000001" },
            isOpenAccess: true,
            openAccessPdf: { url: "https://arxiv.org/pdf/gr-qc/0000001.pdf" },
          },
        ],
      }),
    });

    const observation = await runScholarlyResearchLookup({
      turnId: "ask:quantum-inequality-relevance",
      callId: "call:quantum-inequality-relevance",
      query:
        "Worldline quantum inequalities bound sampled time-averaged negative energy and depend on sampling functions and duration review arxiv",
      providers: ["semantic_scholar"],
      limit: 5,
      fetchImpl,
    });

    expect(observation.evidence_state).toBe("lookup_usable");
    expect(observation.selected_for_answer).toBe(true);
    expect(observation.papers[0]?.title).toBe("Quantum Inequalities and Negative Energy");
    expect(observation.lookup_relevance_gate).toMatchObject({
      status: "satisfied",
      required_any: expect.arrayContaining(["worldline", "quantum", "inequality", "sampl", "duration"]),
      candidate_evaluations: [
        expect.objectContaining({
          supported: true,
          reason: "bounded_topic_overlap_satisfied",
          matched_tokens: expect.arrayContaining(["worldline", "quantum", "inequality", "sampl", "duration"]),
        }),
      ],
    });
    expect(observation.lookup_relevance_gate?.required_any).not.toEqual(
      expect.arrayContaining(["review", "arxiv"]),
    );
  });

  it("continues to reject an unrelated runtime-verification paper", async () => {
    const fetchImpl: ScholarlyFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            paperId: "runtime-verification",
            title: "Runtime Safety Verification of Neural Network Controlled Systems",
            abstract:
              "Reachability analysis supervises a neural controller over time and models energy, field state, and duration near unsafe regions.",
            authors: [{ name: "B. Engineer" }],
            year: 2024,
            externalIds: { ArXiv: "2408.08592" },
          },
        ],
      }),
    });

    const observation = await runScholarlyResearchLookup({
      turnId: "ask:quantum-inequality-off-topic",
      callId: "call:quantum-inequality-off-topic",
      query: "quantum inequalities sampled negative energy duration worldline field state time",
      providers: ["semantic_scholar"],
      limit: 5,
      fetchImpl,
    });

    expect(observation.evidence_state).toBe("lookup_weak_match");
    expect(observation.selected_for_answer).toBe(false);
    expect(observation.scholarly_lookup_recovery_affordance).toMatchObject({
      reason: "lookup_weak_match",
      rejected_results: [
        expect.objectContaining({
          title: "Runtime Safety Verification of Neural Network Controlled Systems",
          reason: "missing_primary_topic_anchor",
          matched_tokens: expect.arrayContaining(["time", "energy", "field", "state", "duration"]),
          matched_anchor_tokens: [],
        }),
      ],
    });
  });

  it("builds an arXiv field query from bounded topic terms instead of one encoded prose value", async () => {
    let observedSearchQuery = "";
    const fetchImpl: ScholarlyFetch = async (url) => {
      observedSearchQuery = new URL(url).searchParams.get("search_query") ?? "";
      return {
        ok: true,
        status: 200,
        text: async () => "<?xml version=\"1.0\"?><feed xmlns=\"http://www.w3.org/2005/Atom\"></feed>",
      };
    };

    await runScholarlyResearchLookup({
      turnId: "ask:arxiv-topic-query",
      callId: "call:arxiv-topic-query",
      query:
        "Find scholarly references supporting worldline quantum inequalities negative energy duration",
      providers: ["arxiv"],
      limit: 5,
      fetchImpl,
    });

    expect(observedSearchQuery).toBe(
      "all:worldline AND all:quantum AND all:inequalities",
    );
  });
});
