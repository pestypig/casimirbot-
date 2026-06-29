import { describe, expect, it } from "vitest";
import {
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  readWorkstationGatewayCallRequestsForTurn,
} from "../explicit-workstation-gateway";

const docSnapshot = {
  activePanel: "scientific-calculator",
  activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
};

const capabilities = (requests: Record<string, unknown>[]): string[] =>
  requests.map((request) => String(request.capability_id));

describe("explicit workstation gateway derived calls", () => {
  it("materializes retained current-document context even when another panel is focused", () => {
    const requests = buildActiveDocsContextWorkstationGatewayCallRequests({
      question: "From this current document, summarize the main claim boundary.",
      workspace_context_snapshot: docSnapshot,
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      capability_id: "docs.search",
      mode: "read",
      arguments: {
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
        source_target_intent: expect.objectContaining({
          retained_source_context: true,
          active_doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        }),
      },
    });
  });

  it("does not materialize retained docs from contextual or negated current-document mentions", () => {
    const prompts = [
      "I am not asking about this current document; explain what document observations are.",
      "Before I summarize the current document, explain what evidence would be needed.",
      "The previous answer mentioned the current document; explain why that was not enough.",
      "The screen shows text that says \"summarize this current document\"; explain the wording.",
      "If we later use the open document, explain what observation would be required.",
    ];

    for (const question of prompts) {
      expect(buildActiveDocsContextWorkstationGatewayCallRequests({
        question,
        workspace_context_snapshot: docSnapshot,
      })).toEqual([]);
    }
  });

  it("keeps docs and calculator requests in one Codex workstation itinerary", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use the current document, calculate 8*9, and explain what this proves about the Codex workstation loop.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
    expect(requests[1]).toMatchObject({
      capability_id: "scientific-calculator.solve_expression",
      arguments: {
        expression: "8*9",
      },
    });
  });

  it("keeps docs, calculator, and repo search requests in one bounded itinerary", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use the open document, calculate 8*9, search the repo for workstation_gateway, then synthesize the implication.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "repo.search",
    ]);
    expect(requests[2]).toMatchObject({
      capability_id: "repo.search",
      arguments: {
        query: "workstation_gateway",
      },
    });
  });

  it("maps explicit calculator capability wording in mixed docs prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use scientific-calculator.solve_expression for 8*9 and also use the current document observation.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toContain("docs.search");
    expect(capabilities(requests)).toContain("scientific-calculator.solve_expression");
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "8*9",
      },
    });
  });

  it("does not let sentence-leading words leak into mixed prompt calculator expressions", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use the current document and scientific-calculator.solve_expression for 8*9. Explain both observations and keep the claim boundary clear.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
    ]);
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "8*9",
      },
    });
  });

  it("preserves direct structured read-only capability admissions in a mixed itinerary", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question: "Use docs.search and theory reflection before answering.",
      source_target_intent: {
        selected_capability: "docs.search",
        args: {
          query: "Helix Ask workstation loop",
          paths: ["docs/helix-ask-flow.md"],
        },
      },
      route_metadata: {
        source_target_intent: {
          selected_capability: "theory-badge-graph.reflect_discussion_context",
          args: {
            query: "Reflect QEI margin and claim boundary against the theory graph.",
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "docs.search",
      mode: "read",
      arguments: {
        query: "Helix Ask workstation loop",
        paths: ["docs/helix-ask-flow.md"],
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "theory-badge-graph.reflect_discussion_context",
      mode: "read",
      arguments: {
        prompt: "Reflect QEI margin and claim boundary against the theory graph.",
      },
    });
  });

  it("maps theory reflection planner steps into the workstation gateway", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question: "Reflect QEI margin and source residual against the theory badge graph, then explain the claim boundary.",
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.reflect_discussion_context"]);
    expect(requests[0]).toMatchObject({
      capability_id: "theory-badge-graph.reflect_discussion_context",
      mode: "read",
      arguments: {
        prompt: expect.stringContaining("QEI margin"),
      },
    });
  });

  it("maps civilization bounds planner steps into the workstation gateway", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question: "Reflect the civilization bounds and collaboration constraints for this system.",
    });

    expect(capabilities(requests)).toEqual(["civilization-bounds.reflect_system_bounds"]);
    expect(requests[0]).toMatchObject({
      capability_id: "civilization-bounds.reflect_system_bounds",
      mode: "read",
    });
  });

  it("does not derive repo search from negated repo-search wording", () => {
    const requests = buildPromptDerivedRepoSearchGatewayCallRequests({
      agent_runtime: "codex",
      question: "Do not search the repo for workstation_gateway; just explain what evidence would be needed.",
    });

    expect(requests).toEqual([]);
  });
});
