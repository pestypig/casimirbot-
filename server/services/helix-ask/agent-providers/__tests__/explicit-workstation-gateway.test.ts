import { describe, expect, it } from "vitest";
import {
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedWorkspaceStatusGatewayCallRequests,
  readWorkstationGatewayCallRequestsForTurn,
  runExplicitWorkstationGatewayCalls,
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

  it("keeps the live Codex compound wording as docs, calculator, and repo requests", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use the current document, calculate 6*7, search the repo for workstation_gateway, then summarize what the observations prove and do not prove.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "repo.search",
    ]);
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "6*7",
      },
    });
    expect(requests.find((request) => request.capability_id === "repo.search")).toMatchObject({
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

  it("admits prompt-named docs, calculator, and theory capabilities in one Codex itinerary", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Codex workstation focused retest: use exactly these workstation observations before answering: docs.search for docs/research/nhm2-current-status-whitepaper-2026-05-02.md with query claim boundary; scientific-calculator.solve_expression with expression 8*9; theory-badge-graph.reflect_discussion_context for NHM2 claim boundary. Answer what those observations support and what remains unproven.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect(requests.find((request) => request.capability_id === "docs.search")).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      arguments: {
        query: "claim boundary",
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
      },
    });
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "8*9",
      },
    });
    expect(requests.find((request) => request.capability_id === "theory-badge-graph.reflect_discussion_context")).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      arguments: {
        prompt: "NHM2 claim boundary",
      },
    });
  });

  it("does not admit internet search from local current-whitepaper evidence wording", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Codex workstation API debug retest: use the current NHM2 whitepaper as bounded document evidence, calculate 8 * 9 with scientific-calculator.solve_expression, and reflect through the theory badge graph for the claim boundary. Answer what the evidence supports and what remains unproven.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
    ]);
    expect(capabilities(requests)).not.toContain("internet-search.search_web");
    expect(requests.find((request) => request.capability_id === "theory-badge-graph.reflect_discussion_context")).toMatchObject({
      derivation_source: "helix_prompt_derived_theory_reflection",
      arguments: {
        prompt: "the claim boundary",
      },
    });
  });

  it("admits explicitly named scholarly and internet capabilities without inferring either from prose", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use scholarly-research.lookup_papers for quantum inequality sampling, and internet-search.search_web for public corroboration.",
      },
    });

    expect(capabilities(requests)).toEqual([
      "scholarly-research.lookup_papers",
      "internet-search.search_web",
    ]);
    expect(requests[0]).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      arguments: {
        query: "quantum inequality sampling",
      },
    });
    expect(requests[1]).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      arguments: {
        query: "public corroboration",
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

  it("normalizes structured workspace_diagnostic admission to workspace_os.status execution", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question: "Use workspace_os.status to inspect workstation status.",
      source_target_intent: {
        selected_capability: "workspace_diagnostic",
        target_source: "workspace_diagnostic",
        target_kind: "workspace_diagnostic",
      },
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "workspace_os.status",
        mode: "observe",
        arguments: {
          source_target_intent: expect.objectContaining({
            selected_capability: "workspace_diagnostic",
          }),
        },
      }),
    ]);
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

  it("maps natural repo search variants named in the contract", () => {
    const prompts = [
      "Find workstation_gateway in the repository.",
      "Look in the codebase for workstation_gateway.",
    ];

    for (const question of prompts) {
      expect(buildPromptDerivedRepoSearchGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([
        expect.objectContaining({
          capability_id: "repo.search",
          mode: "read",
          arguments: expect.objectContaining({
            query: "workstation_gateway",
          }),
        }),
      ]);
    }
  });

  it("keeps underspecified affirmative repo search as an explicit blocked-capable request", () => {
    const requests = buildPromptDerivedRepoSearchGatewayCallRequests({
      agent_runtime: "codex",
      question: "Search the repo and tell me what you find.",
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "repo.search",
        mode: "read",
        arguments: expect.objectContaining({
          source_target_intent: expect.objectContaining({
            target_source: "repo_code",
            target_kind: "repo_search",
            blocked_reason: "missing_query",
          }),
        }),
      }),
    ]);
    expect((requests[0].arguments as Record<string, unknown>).query).toBeUndefined();
  });

  it("turns underspecified repo search into a typed gateway block instead of silently dropping it", async () => {
    const results = await runExplicitWorkstationGatewayCalls({
      agentRuntime: "codex",
      body: {
        agent_runtime: "codex",
        question: "Search the repo and tell me what you find.",
      },
      turnId: "ask:test:repo-search-missing-query",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: false,
      capability_id: "repo.search",
      error: "missing_query",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "missing_query",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
      },
    });
  });

  it("maps workspace status prompts to workspace_os.status observations", () => {
    const requests = buildPromptDerivedWorkspaceStatusGatewayCallRequests({
      agent_runtime: "codex",
      question: "Check the workspace OS status and tell me which capabilities are available.",
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "workspace_os.status",
        mode: "observe",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "workspace_os",
            target_kind: "workspace_status",
            reason_codes: expect.arrayContaining(["workspace_os_phrase"]),
          }),
        },
      }),
    ]);
  });

  it("maps named workspace_os.status capability prompts to observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question: "Use workspace_os.status to inspect workstation status. Answer only from that observation.",
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "workspace_os.status",
        mode: "observe",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "workspace_os",
            target_kind: "workspace_status",
            reason_codes: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      }),
    ]);
  });

  it("does not map negated named workspace_os.status capability prompts", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question: "Do not use workspace_os.status; explain what that capability would observe later.",
    });

    expect(requests).toEqual([]);
  });

  it("keeps workspace status in a compound read-only itinerary", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use the current document, check workspace OS status, calculate 6*7, and search the repo for workstation_gateway.",
        workspace_context_snapshot: docSnapshot,
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "workspace_os.status",
      "scientific-calculator.solve_expression",
      "repo.search",
    ]);
  });

  it("keeps reflection and repo search together in compound prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Reflect QEI margin against the theory badge graph and search the repo for workstation_gateway before answering.",
      },
    });

    expect(capabilities(requests)).toEqual([
      "theory-badge-graph.reflect_discussion_context",
      "repo.search",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "theory-badge-graph.reflect_discussion_context",
      arguments: {
        prompt: expect.stringContaining("QEI margin"),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "repo.search",
      arguments: {
        query: "workstation_gateway",
      },
    });
  });

  it("keeps the Codex workstation acceptance prompt as a multi-tool itinerary", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "use this current NHM2 document, calculate 6*7, search research papers on arXiv for quantum inequalities and warp constraints, reflect QEI margin through theory badge graph, and reflect civilization bounds",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
      "scholarly-research.lookup_papers",
    ]);
    expect(requests.find((request) => request.capability_id === "docs.search")).toMatchObject({
      arguments: {
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
        source_target_intent: expect.objectContaining({
          retained_source_context: true,
        }),
      },
    });
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "6*7",
      },
    });
  });

  it("keeps named whitepaper evidence and scholarly corroboration in Codex compound prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "I am trying to judge whether the NHM2 Casimir tile generation idea is a serious diagnostic engineering direction, a speculative metaphor, or something in between. Use the NHM2 whitepaper as document evidence, calculate 6 * 7 as a small scalar sanity check, reflect through the theory badge graph for where the claim should be bounded, apply civilization bounds for what social/energy/material conditions would have to be true, and check scholarly papers for corroboration. Give me a practical answer: what can I responsibly believe from this evidence, what remains unproven, and what should I test next?",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
      "scholarly-research.lookup_papers",
    ]);
    expect(requests.find((request) => request.capability_id === "docs.search")).toMatchObject({
      arguments: {
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
      },
    });
    expect(requests.find((request) => request.capability_id === "scholarly-research.lookup_papers")).toMatchObject({
      arguments: {
        source_target_intent: expect.objectContaining({
          target_kind: "research_paper_search",
        }),
      },
    });
  });
});
