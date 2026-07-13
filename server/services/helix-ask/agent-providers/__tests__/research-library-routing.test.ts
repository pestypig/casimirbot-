import { describe, expect, it } from "vitest";
import { readWorkstationGatewayCallRequestsForTurn } from "../explicit-workstation-gateway";
import { ensureCodexPreGatewayRouteAuthority } from "../codex-provider";
import { compactScholarlyFullTextArtifactForModel } from "../../model-context-economy";
import { isHelixAskGoldenPathScholarlyResearchRequested } from "../../golden-path/capabilities/scholarly-research";

const prompt =
  "Using the existing full-text evidence for https://arxiv.org/pdf/2401.12345, report the paper title, authors, and abstract. Include page-grounded evidence references. Do not refetch the PDF, run lookup_papers, or use Image Lens.";

describe("Research Library prompt routing", () => {
  it("routes exact saved-evidence prompts to the private library without network or Image Lens tools", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: { question: prompt, agent_runtime: "codex" },
      includePlannerDerived: true,
    });

    expect(requests.map((request) => request.capability_id)).toEqual([
      "research-library.read_document",
    ]);
    expect(requests[0]).toMatchObject({
      arguments: {
        source_url: "https://arxiv.org/pdf/2401.12345",
        source_target_intent: {
          target_source: "research_library",
          target_kind: "saved_scholarly_full_text",
          no_network_retrieval: true,
        },
      },
    });
  });

  it("defers saved evidence from lookup golden path and admits it without an external runtime selection", () => {
    expect(isHelixAskGoldenPathScholarlyResearchRequested({ question: prompt })).toBe(false);

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: { question: prompt },
      includePlannerDerived: false,
    });

    expect(requests.map((request) => request.capability_id)).toEqual([
      "research-library.read_document",
    ]);
  });

  it("normalizes incidental sentence punctuation and requests every matching page", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "Using the saved full-text evidence for https://arxiv.org/pdf/2401.12345, find every page containing “distributionally robust.”",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: {
        search_term: "distributionally robust",
        max_pages: 40,
      },
    });
  });

  it("admits an unambiguous same-saved-paper referent without repeating its identifier", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "From that same saved Research Library paper, read only page 9 and return the first excerpt containing “multi-frame case”",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: {
        resolve_single_profile_document: true,
        page_start: 9,
        page_end: 9,
        search_term: "multi-frame case",
      },
    });
  });

  it("preserves an explicit conjunction of saved-paper pages as an exact page list", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "From that same saved Research Library paper, compare the page-8 method with the page-9 method. Use only pages 8 and 9. Do not inspect other pages.",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: {
        resolve_single_profile_document: true,
        page_numbers: [8, 9],
        max_pages: 2,
      },
    });
    expect(requests[0]?.arguments).not.toHaveProperty("page_start");
    expect(requests[0]?.arguments).not.toHaveProperty("page_end");
  });

  it("propagates an affirmative exact case-sensitive saved-page search", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "Within only pages 8 and 9 of that same saved paper, find every exact case-sensitive occurrence of “Wasserstein”.",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: {
        page_numbers: [8, 9],
        search_term: "Wasserstein",
        case_sensitive: true,
      },
    });
  });

  it("requests deterministic full-page sentence boundaries for exact boundary prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "From only page 8 of that same saved paper, return the first and last nonblank sentences exactly as extracted.",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: {
        page_start: 8,
        page_end: 8,
        page_boundary_mode: "first_last_nonblank_sentence",
      },
    });
  });

  it("does not infer case-sensitive execution from a negated or contextual mention", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question:
          "From that same saved paper, do not run a case-sensitive search; find every occurrence of “Wasserstein”.",
      },
      includePlannerDerived: false,
    });

    expect(requests[0]).toMatchObject({
      capability_id: "research-library.read_document",
      arguments: { search_term: "Wasserstein" },
    });
    expect(requests[0]?.arguments).not.toHaveProperty("case_sensitive");
  });

  it("admits the saved library before Codex commits the production route", () => {
    const body: Record<string, unknown> = {
      question: prompt,
      agent_runtime: "codex",
      turn_id: "ask:saved-library-pre-route",
      thread_id: "thread:saved-library-pre-route",
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:saved-library-pre-route",
      selectedRoute: "/ask",
    });

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });

    expect(requests.map((request) => request.capability_id)).toEqual([
      "research-library.read_document",
    ]);
    expect(body.tool_call_admission_decision).toMatchObject({
      admitted_capability: "research-library.read_document",
      source_target: "research_library",
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "research_library",
      },
      canonical_goal: {
        required_terminal_kind: "scholarly_research_answer",
      },
    });
  });

  it("suppresses runtime or explicit lookup/fetch/Image Lens requests listed in a comma-separated negation", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question: prompt,
        workstation_gateway_calls: [
          { capability_id: "scholarly-research.lookup_papers", mode: "read", arguments: { query: "paper" } },
          { capability_id: "scholarly-research.fetch_full_text", mode: "read", arguments: { source_url: "https://arxiv.org/pdf/2401.12345" } },
          { capability_id: "visual-analysis.inspect_image_region", mode: "read", arguments: {} },
          { capability_id: "research-library.read_document", mode: "read", arguments: { source_url: "https://arxiv.org/pdf/2401.12345" } },
        ],
      },
    });

    expect(requests.map((request) => request.capability_id)).toEqual([
      "research-library.read_document",
    ]);
  });

  it("re-enters bounded saved pages through the scholarly full-text model packet", () => {
    const packet = compactScholarlyFullTextArtifactForModel({
      turnId: "ask:saved-page-reentry",
      userRequested: prompt,
      artifact: {
        kind: "research_library_observation",
        artifact_id: "ask:saved-page-reentry:research_library_observation:1",
        payload: {
          schema: "helix.research_library_observation.v1",
          artifact_id: "ask:saved-page-reentry:research_library_observation:1",
          capability: "research-library.read_document",
          evidence_state: "full_text_usable",
          selected_pages: [{
            page: 1,
            text_excerpt: "Distributionally Robust Receive Combining by Shixiong Wang, Wei Dai, and Geoffrey Ye Li. Abstract: This paper studies robust receive combining.",
            source_text_ref: "artifact://paper#page=1&text",
            text_char_count: 142,
          }],
          missing_requirements: [],
        },
      },
    });

    expect(packet).toMatchObject({
      capability_key: "research-library.read_document",
      status: "succeeded",
      support_refs: expect.arrayContaining(["artifact://paper#page=1&text"]),
      exact_excerpt_refs: ["artifact://paper#page=1&text"],
    });
    expect(packet?.found.join(" ")).toContain("Distributionally Robust Receive Combining");
  });

  it("re-enters a completed zero-match scan as successful evidence", () => {
    const packet = compactScholarlyFullTextArtifactForModel({
      turnId: "ask:saved-zero-match-reentry",
      userRequested: "find every page containing an absent phrase",
      artifact: {
        kind: "research_library_observation",
        artifact_id: "ask:saved-zero-match-reentry:research_library_observation:1",
        payload: {
          schema: "helix.research_library_observation.v1",
          artifact_id: "ask:saved-zero-match-reentry:research_library_observation:1",
          capability: "research-library.read_document",
          evidence_state: "full_text_usable",
          selected_pages: [],
          search_term: "deliberately absent phrase",
          match_count: 0,
          match_pages: [],
          missing_requirements: [],
        },
      },
    });

    expect(packet).toMatchObject({
      status: "succeeded",
      capability_key: "research-library.read_document",
      suggested_next_steps: expect.arrayContaining(["answer"]),
    });
    expect(packet?.found.join(" ")).toContain("found 0 matches");
  });
});
