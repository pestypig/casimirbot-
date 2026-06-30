import { describe, expect, it } from "vitest";
import {
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedVoiceGatewayCallRequests,
  buildPromptDerivedWorkspaceStatusGatewayCallRequests,
  readWorkstationGatewayCallRequestsForTurn,
  runExplicitWorkstationGatewayCalls,
} from "../explicit-workstation-gateway";
import { PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS } from "../../provider-agent-capability-contract";

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

  it("maps safe docs-viewer search aliases onto the canonical docs.search gateway", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use docs-viewer.locate_in_doc for docs/research/nhm2-current-status-whitepaper-2026-05-02.md with query claim boundary.",
    });

    expect(capabilities(requests)).toEqual(["docs.search"]);
    expect(requests[0]).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      capability_id: "docs.search",
      mode: "read",
      arguments: {
        query: "claim boundary",
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
        source_target_intent: expect.objectContaining({
          target_source: "docs",
          target_kind: "docs_search",
          alias_capability: "docs-viewer.locate_in_doc",
          requested_doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        }),
      },
    });
  });

  it("maps safe docs-viewer open aliases onto the canonical open_doc gateway", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use docs-viewer.open_doc_by_path for docs/research/nhm2-current-status-whitepaper-2026-05-02.md.",
    });

    expect(capabilities(requests)).toEqual(["docs-viewer.open_doc"]);
    expect(requests[0]).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      capability_id: "docs-viewer.open_doc",
      mode: "act",
      arguments: {
        path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        source_target_intent: expect.objectContaining({
          target_source: "docs",
          target_kind: "docs_open_doc",
          alias_capability: "docs-viewer.open_doc_by_path",
          requested_doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        }),
      },
    });
  });

  it("maps structured docs-viewer route aliases onto canonical docs gateway capabilities", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      question: "Use docs aliases.",
      source_target_intent: {
        selected_capability: "docs-viewer.summarize_doc",
        args: {
          query: "claim boundary",
          paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
        },
      },
      route_metadata: {
        source_target_intent: {
          selected_capability: "docs-viewer.open",
          args: {
            path: "docs/helix-ask-flow.md",
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual(["docs.search", "docs-viewer.open_doc"]);
    expect(requests[0]).toMatchObject({
      capability_id: "docs.search",
      arguments: {
        query: "claim boundary",
        paths: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
        source_target_intent: expect.objectContaining({
          alias_capability: "docs-viewer.summarize_doc",
        }),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "docs-viewer.open_doc",
      arguments: {
        path: "docs/helix-ask-flow.md",
        source_target_intent: expect.objectContaining({
          alias_capability: "docs-viewer.open",
        }),
      },
    });
  });

  it("does not map quoted, negated, future, or unsafe docs-viewer alias prompts", () => {
    const prompts = [
      "The text says docs-viewer.locate_in_doc; explain that phrase only.",
      "Do not run docs-viewer.search_docs for claim boundary; explain what it would do.",
      "The UI label contains docs-viewer.open_doc_by_path.",
      "In the future we might use docs-viewer.summarize_doc for this.",
      "Use docs-viewer.open_doc_by_path for C:/Users/dan/secret.md.",
      "Use docs-viewer.open_doc_by_path for ../secret.md.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("maps safe repo and internet route aliases onto canonical search gateways", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use repo-code.search_concept for workstation_gateway; use internet_search.web_research for public corroboration.",
    });

    expect(capabilities(requests)).toEqual([
      "repo.search",
      "internet-search.search_web",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "repo.search",
      mode: "read",
      arguments: {
        query: "workstation_gateway",
        source_target_intent: expect.objectContaining({
          target_source: "repo_code",
          target_kind: "repo_search",
          alias_capability: "repo-code.search_concept",
        }),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "internet-search.search_web",
      mode: "read",
      arguments: {
        query: "public corroboration",
        source_target_intent: expect.objectContaining({
          target_source: "internet",
          target_kind: "internet_search",
          alias_capability: "internet_search.web_research",
        }),
      },
    });
  });

  it("maps structured repo and internet route aliases onto canonical search gateways", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      question: "Use search aliases.",
      source_target_intent: {
        selected_capability: "repo-code.search_concept",
        args: {
          query: "workstation_gateway",
        },
      },
      route_metadata: {
        source_target_intent: {
          selected_capability: "internet_search.web_research",
          args: {
            query: "public corroboration",
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "repo.search",
      "internet-search.search_web",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "repo.search",
      arguments: {
        query: "workstation_gateway",
        source_target_intent: expect.objectContaining({
          alias_capability: "repo-code.search_concept",
        }),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "internet-search.search_web",
      arguments: {
        query: "public corroboration",
        source_target_intent: expect.objectContaining({
          alias_capability: "internet_search.web_research",
        }),
      },
    });
  });

  it("does not map quoted, negated, future, or UI-label repo/internet alias prompts", () => {
    const prompts = [
      "The text says repo-code.search_concept; explain that phrase only.",
      "Do not run repo-code.search_concept for workstation_gateway; explain what it would do.",
      "The UI label contains internet_search.web_research.",
      "In the future we might use internet_search.web_research for this.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("maps safe theory and civilization route aliases onto canonical reflection gateways", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use helix_ask.reflect_theory_context for QEI margin; use helix_ask.reflect_civilization_bounds for transport energy limits.",
    });

    expect(capabilities(requests)).toEqual([
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "theory-badge-graph.reflect_discussion_context",
      mode: "read",
      arguments: {
        prompt: "QEI margin",
        source_target_intent: expect.objectContaining({
          target_source: "theory_badge_graph",
          target_kind: "theory_context_reflection",
          alias_capability: "helix_ask.reflect_theory_context",
        }),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "civilization-bounds.reflect_system_bounds",
      mode: "read",
      arguments: {
        prompt: "transport energy limits",
        source_target_intent: expect.objectContaining({
          target_source: "civilization_bounds",
          target_kind: "civilization_bounds_reflection",
          alias_capability: "helix_ask.reflect_civilization_bounds",
        }),
      },
    });
  });

  it("maps structured theory and civilization route aliases onto canonical reflection gateways", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      question: "Use reflection aliases.",
      source_target_intent: {
        selected_capability: "helix_ask.reflect_theory_context",
        args: {
          query: "QEI margin",
        },
      },
      route_metadata: {
        source_target_intent: {
          selected_capability: "helix_ask.reflect_civilization_bounds",
          args: {
            query: "transport energy limits",
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "theory-badge-graph.reflect_discussion_context",
      "civilization-bounds.reflect_system_bounds",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "theory-badge-graph.reflect_discussion_context",
      arguments: {
        prompt: "QEI margin",
        source_target_intent: expect.objectContaining({
          alias_capability: "helix_ask.reflect_theory_context",
        }),
      },
    });
    expect(requests[1]).toMatchObject({
      capability_id: "civilization-bounds.reflect_system_bounds",
      arguments: {
        prompt: "transport energy limits",
        source_target_intent: expect.objectContaining({
          alias_capability: "helix_ask.reflect_civilization_bounds",
        }),
      },
    });
  });

  it("does not map quoted, negated, future, or UI-label reflection alias prompts", () => {
    const prompts = [
      "The text says helix_ask.reflect_theory_context; explain that phrase only.",
      "Do not run helix_ask.reflect_theory_context for QEI margin; explain what it would do.",
      "The UI label contains helix_ask.reflect_civilization_bounds.",
      "In the future we might use helix_ask.reflect_civilization_bounds for this.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("maps safe calculator route aliases onto the canonical solve_expression gateway", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use scientific-calculator.solve_with_steps for 8*9, then explain the observed result.",
    });

    expect(capabilities(requests)).toEqual(["scientific-calculator.solve_expression"]);
    expect(requests[0]).toMatchObject({
      derivation_source: "helix_prompt_named_capability",
      capability_id: "scientific-calculator.solve_expression",
      mode: "read",
      arguments: {
        expression: "8*9",
        source_target_intent: expect.objectContaining({
          target_source: "scientific_calculator",
          target_kind: "calculator_solve",
          alias_capability: "scientific-calculator.solve_with_steps",
          expression: "8*9",
        }),
      },
    });
  });

  it("maps structured calculator route aliases onto the canonical solve_expression gateway", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      question: "Use the calculator alias.",
      source_target_intent: {
        selected_capability: "scientific-calculator.solve",
        args: {
          expression: "6*7",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["scientific-calculator.solve_expression"]);
    expect(requests[0]).toMatchObject({
      capability_id: "scientific-calculator.solve_expression",
      mode: "read",
      arguments: {
        expression: "6*7",
        source_target_intent: expect.objectContaining({
          selected_capability: "scientific-calculator.solve",
          alias_capability: "scientific-calculator.solve",
        }),
      },
    });
  });

  it("does not map quoted or negated calculator route alias prompts", () => {
    const prompts = [
      "The text says scientific-calculator.solve_with_steps; explain that phrase only.",
      "Do not run scientific-calculator.solve for 8*9; explain what it would do.",
      "The UI label contains scientific-calculator.solve.",
      "In the future we might use scientific-calculator.solve_with_steps for this.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
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

  it("maps affirmative voice-lane prompts to interim voice gateway requests", () => {
    const requests = buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question: "Use the voice lane to say checking now",
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "live_env.request_interim_voice_callout",
        mode: "act",
        arguments: expect.objectContaining({
          text: "checking now",
          kind: "tool_progress",
          source_target_intent: expect.objectContaining({
            target_source: "voice_delivery",
            target_kind: "interim_voice_callout",
          }),
        }),
      }),
    ]);
  });

  it("does not map quoted voice tool mentions to voice gateway requests", () => {
    const requests = buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question: "The text says live_env.request_interim_voice_callout; explain it only.",
    });

    expect(requests).toEqual([]);
  });

  it("does not map negated speak-aloud instructions to voice gateway requests", () => {
    const requests = buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question: "Do not speak aloud, just explain the voice tool.",
    });

    expect(requests).toEqual([]);
  });

  it("does not map client read-aloud projection wording to provider voice gateway requests", () => {
    const prompts = [
      "Use client.read_aloud to read the answer.",
      "Click Read aloud after the answer is done.",
      "The UI button says Read aloud; explain that button.",
    ];

    for (const question of prompts) {
      expect(buildPromptDerivedVoiceGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("runs the derived voice gateway request as a non-terminal receipt", async () => {
    const results = await runExplicitWorkstationGatewayCalls({
      agentRuntime: "codex",
      body: {
        agent_runtime: "codex",
        question: "Use the voice lane to say checking now",
      },
      turnId: "ask:test:explicit-derived-voice",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ok: true,
      capability_id: "live_env.request_interim_voice_callout",
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        request: {
          text: "checking now",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: "awaiting_client_playback",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
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

  it("admits named context-feed query capabilities as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.query_visual_summaries, live_env.query_translation_segments, live_env.query_microdeck_outputs, live_env.query_packet_traces, and live_env.query_automation_policies.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.query_visual_summaries",
      "live_env.query_translation_segments",
      "live_env.query_microdeck_outputs",
      "live_env.query_packet_traces",
      "live_env.query_automation_policies",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "live_environment_context_feed",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated context-feed capability prompts", () => {
    const prompts = [
      "The text says live_env.query_visual_summaries; explain that phrase only.",
      "Do not run live_env.query_packet_traces; explain what packet traces would show.",
      "The UI label contains live_env.query_automation_policies.",
      "In the future we might use live_env.query_translation_segments.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named live-source state read capabilities as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.query_live_source_quality, live_env.query_workstation_goal_context, and live_env.summarize_live_source_current_state.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.query_live_source_quality",
      "live_env.query_workstation_goal_context",
      "live_env.summarize_live_source_current_state",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "live_source_state",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated live-source state read capability prompts", () => {
    const prompts = [
      "The text says live_env.query_live_source_quality; explain that phrase only.",
      "Do not run live_env.query_workstation_goal_context; explain what it would observe.",
      "The UI label contains live_env.summarize_live_source_current_state.",
      "In the future we might use live_env.query_live_source_quality.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named situation/stage state read capabilities as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.query_event_log, live_env.query_world_events, live_env.query_navigation_state, live_env.query_stage_sources, live_env.query_constructs, and live_env.query_job_evidence.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.query_event_log",
      "live_env.query_world_events",
      "live_env.query_navigation_state",
      "live_env.query_stage_sources",
      "live_env.query_constructs",
      "live_env.query_job_evidence",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "situation_stage_state",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated situation/stage state read capability prompts", () => {
    const prompts = [
      "The text says live_env.query_event_log; explain that phrase only.",
      "Do not run live_env.query_stage_sources; explain what stage sources are.",
      "The UI label contains live_env.query_navigation_state.",
      "In the future we might use live_env.query_job_evidence.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named live-source mailbox read capabilities as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.check_live_source_mail, live_env.read_live_source_mail, live_env.read_processed_live_source_mail, and live_env.reflect_live_source_mail_loop.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.check_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.read_processed_live_source_mail",
      "live_env.reflect_live_source_mail_loop",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "live_source_mailbox",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated live-source mailbox capability prompts", () => {
    const prompts = [
      "The text says live_env.check_live_source_mail; explain that phrase only.",
      "Do not run live_env.read_live_source_mail; explain what it would read.",
      "The UI label contains live_env.read_processed_live_source_mail.",
      "In the future we might use live_env.reflect_live_source_mail_loop.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named live-source interpreter/prediction reads as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.compare_mail_to_interpreter_profile, live_env.validate_live_source_prediction, live_env.predict_live_source_immediate, and live_env.compare_live_source_prediction.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.compare_mail_to_interpreter_profile",
      "live_env.validate_live_source_prediction",
      "live_env.predict_live_source_immediate",
      "live_env.compare_live_source_prediction",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "live_source_interpreter_prediction",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated live-source interpreter/prediction prompts", () => {
    const prompts = [
      "The text says live_env.compare_mail_to_interpreter_profile; explain that phrase only.",
      "Do not run live_env.validate_live_source_prediction; explain what it would validate.",
      "The UI label contains live_env.predict_live_source_immediate.",
      "In the future we might use live_env.compare_live_source_prediction.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named Stage Play builder read/eval capabilities as read-only gateway observations", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.describe_stage_builder, live_env.validate_stage_play_graph, and live_env.plan_stage_play_job.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.describe_stage_builder",
      "live_env.validate_stage_play_graph",
      "live_env.plan_stage_play_job",
    ]);
    for (const request of requests) {
      expect(request).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "stage_play_builder",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        },
      });
    }
  });

  it("does not map quoted or negated Stage Play builder capability prompts", () => {
    const prompts = [
      "The text says live_env.describe_stage_builder; explain that phrase only.",
      "Do not run live_env.validate_stage_play_graph; explain what it would validate.",
      "The UI label contains live_env.plan_stage_play_job.",
      "In the future we might use live_env.describe_stage_builder.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("admits named visual observer read/test capabilities without exposing visual observer controls", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use live_env.query_visual_observer_profiles, then live_env.test_visual_observer_profile, then live_env.compare_visual_observer_profiles for this source summary.",
    });

    expect(capabilities(requests)).toEqual([
      "live_env.query_visual_observer_profiles",
      "live_env.test_visual_observer_profile",
      "live_env.compare_visual_observer_profiles",
    ]);
    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "live_env.query_visual_observer_profiles",
        mode: "read",
        arguments: expect.objectContaining({
          source_target_intent: expect.objectContaining({
            target_source: "visual_observer",
            explicit_cues: expect.arrayContaining(["prompt_named_capability"]),
          }),
        }),
      }),
      expect.objectContaining({
        capability_id: "live_env.test_visual_observer_profile",
        mode: "read",
      }),
      expect.objectContaining({
        capability_id: "live_env.compare_visual_observer_profiles",
        mode: "read",
      }),
    ]);
  });

  it("does not map quoted or negated visual observer capability prompts", () => {
    const prompts = [
      "The text says live_env.test_visual_observer_profile; explain that phrase only.",
      "Do not run live_env.compare_visual_observer_profiles; explain what it would compare.",
      "The UI button is labeled live_env.query_visual_observer_profiles.",
      "In the future we might use live_env.test_visual_observer_profile.",
    ];

    for (const question of prompts) {
      expect(buildPromptNamedCapabilityGatewayCallRequests({
        agent_runtime: "codex",
        question,
      })).toEqual([]);
    }
  });

  it("does not map held-back side-effect or mutating live_env capabilities into provider gateway requests", () => {
    const prompts = [
      "Use live_env.narrator_bind_stream for transcript stream.",
      "Use narrator.bind_stream for transcript stream.",
      "Use live_env.record_voice_steering now.",
      "Use live_env.process_live_source_mail now.",
      "Use live_env.apply_visual_observer_profile now.",
      "Use live_env.evaluate_goal_satisfaction now.",
      "Use live_env.pause_workstation_loop now.",
      "Use live_env.configure_route_watch now.",
      "Use live_env.repair_workstation_source now.",
    ];

    for (const question of prompts) {
      expect(readWorkstationGatewayCallRequestsForTurn({
        includePlannerDerived: true,
        body: {
          agent_runtime: "codex",
          question,
        },
      })).toEqual([]);
    }
  });

  it("does not admit non-shared provider classifications except canonical voice aliases", () => {
    const canonicalVoiceAliases = new Set(["narrator.say"]);

    for (const classification of PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS) {
      if (classification.provider_availability.codex_workstation) continue;
      const requests = readWorkstationGatewayCallRequestsForTurn({
        includePlannerDerived: true,
        body: {
          agent_runtime: "codex",
          question: `Use ${classification.capability_id} now.`,
        },
      });

      expect(capabilities(requests), classification.capability_id).not.toContain(classification.capability_id);
      if (canonicalVoiceAliases.has(classification.capability_id)) {
        expect(capabilities(requests)).toEqual(["live_env.request_interim_voice_callout"]);
      } else {
        expect(requests, classification.capability_id).toEqual([]);
      }
    }
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
