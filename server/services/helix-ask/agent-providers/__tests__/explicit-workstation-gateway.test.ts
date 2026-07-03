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
  shouldAutoExecuteDependentCompoundRequest,
} from "../explicit-workstation-gateway";
import {
  buildCompoundCapabilityDependencyGatewayCallRequests,
  buildCompoundDependencyRailStatus,
  buildDependentCompoundCapabilityGatewayCallRequest,
  buildTurnCompoundDependencyPlan,
} from "../provider-compound-capability-planner";
import { PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS } from "../../provider-agent-capability-contract";
import type { HelixAgentProvider } from "../types";
import { runHelixCapabilityLaneOneShotRequests } from "../../capability-lanes/one-shot-runner";
import { resetInterimVoiceCalloutsForTest } from "../../interim-voice-callout-store";
import { runtimeMemoryGovernor } from "../../../runtime/runtime-memory-governor";

const docSnapshot = {
  activePanel: "scientific-calculator",
  activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
};

const capabilities = (requests: Record<string, unknown>[]): string[] =>
  requests.map((request) => String(request.capability_id));

const buildTestProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

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

  it("preserves scientific notation in prompt-named calculator expressions", () => {
    const expression = "2.26e18*164.8*1.602176634e-19";
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        `Use scientific-calculator.solve_expression with expression: ${expression}. Report only from the calculator receipt.`,
    });

    expect(capabilities(requests)).toEqual(["scientific-calculator.solve_expression"]);
    expect(requests[0]).toMatchObject({
      capability_id: "scientific-calculator.solve_expression",
      arguments: {
        expression,
        source_target_intent: expect.objectContaining({
          target_source: "scientific_calculator",
          target_kind: "calculator_solve",
          expression,
        }),
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

  it("maps safe theory frontier conjecture aliases onto the canonical workbench gateway", () => {
    const requests = buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use propose_frontier_conjectures for missing badge bridges between QEI margin and source residual.",
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.propose_frontier_conjectures"]);
    expect(requests[0]).toMatchObject({
      capability_id: "theory-badge-graph.propose_frontier_conjectures",
      mode: "read",
      arguments: {
        prompt: "missing badge bridges between QEI margin and source residual",
        build_explanation_plan: true,
        source_target_intent: expect.objectContaining({
          target_source: "theory_badge_graph",
          target_kind: "theory_frontier_conjecture_workbench",
          alias_capability: "propose_frontier_conjectures",
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

  it("maps structured Moral Graph substrate admission onto the living-substrate gateway", () => {
    const requests = buildStructuredAdmissionWorkstationGatewayCallRequests({
      question: "Use the Moral Graph to reason from organism boundary, sensing, and homeostasis.",
      source_target_intent: {
        selected_capability: "moral-graph.reflect_living_substrate_context",
        args: {
          query: "organism boundary, sensing, and homeostasis",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["moral-graph.reflect_living_substrate_context"]);
    expect(requests[0]).toMatchObject({
      schema: "helix.workstation_gateway.structured_admission_call_request.v1",
      derivation_source: "helix_structured_source_target_admission",
      capability_id: "moral-graph.reflect_living_substrate_context",
      mode: "read",
      arguments: {
        prompt: "organism boundary, sensing, and homeostasis",
        conversation_context: expect.stringContaining("Moral Graph"),
        include_theory_bridge: true,
        include_recommended_actions: true,
        source_target_intent: expect.objectContaining({
          target_source: "moral_graph",
          target_kind: "moral_living_substrate_reflection",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
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

  it("does not map quoted, negated, future, or UI-label frontier conjecture prompts", () => {
    const prompts = [
      "The text says propose_frontier_conjectures; explain that phrase only.",
      "Do not run theory-badge-graph.propose_frontier_conjectures for QEI margin.",
      "The UI label contains frontier_conjecture_workbench.",
      "In the future we might use theory_frontier_conjectures for this.",
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

  it("admits prompt-named Moral Graph living-substrate reflection as a gateway observation", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use moral-graph.reflect_living_substrate_context for organism boundary, sensing, homeostasis, entropy pressure, and non-human living systems, then reason from the observation.",
      },
    });

    expect(capabilities(requests)).toEqual(["moral-graph.reflect_living_substrate_context"]);
    expect(requests[0]).toMatchObject({
      schema: "helix.workstation_gateway.prompt_named_capability_call_request.v1",
      derivation_source: "helix_prompt_named_capability",
      capability_id: "moral-graph.reflect_living_substrate_context",
      mode: "read",
      arguments: {
        prompt: expect.stringContaining("organism boundary"),
        conversation_context: expect.stringContaining("moral-graph.reflect_living_substrate_context"),
        include_theory_bridge: true,
        include_recommended_actions: true,
        source_target_intent: expect.objectContaining({
          target_source: "moral_graph",
          target_kind: "moral_living_substrate_reflection",
          selected_capability: "moral-graph.reflect_living_substrate_context",
          explicit_capability: true,
        }),
      },
    });
  });

  it("keeps broad moral-substrate wording from admitting inferred internet search beside the primary reflection", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use moral-graph.reflect_living_substrate_context for organism boundary, sensing, homeostasis, personhood, law, civilization, and non-human living systems. Explain what the procedural chain supports.",
      },
    });

    expect(capabilities(requests)).toEqual(["moral-graph.reflect_living_substrate_context"]);
    expect(capabilities(requests)).not.toContain("internet-search.search_web");
  });

  it("defers non-explicit external research as a Moral Graph substrate next affordance", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use moral-graph.reflect_living_substrate_context for organism boundary, sensing, homeostasis, personhood, law, civilization, and non-human living systems. Explain what the procedural chain supports.",
        source_target_intent: {
          selected_capability: "moral-graph.reflect_living_substrate_context",
          args: {
            query: "organism boundary, sensing, homeostasis, personhood, law, civilization",
          },
        },
        route_metadata: {
          source_target_intent: {
            selected_capability: "internet-search.search_web",
            args: {
              query: "organism personhood law civilization moral status",
            },
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual(["moral-graph.reflect_living_substrate_context"]);
    const args = requests[0].arguments as Record<string, any>;
    expect(args.next_affordances).toEqual([
      expect.objectContaining({
        source: "helix_moral_substrate_primary_request_reduction",
        capability: "internet-search.search_web",
        purpose: "codex_selected_followup_tool",
        reason: "available_after_moral_substrate_observation_reentry",
        query: "organism personhood law civilization moral status",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(args.source_target_intent.next_affordances).toEqual(args.next_affordances);
  });

  it("keeps explicitly requested external research adjacent to Moral Graph substrate reflection", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use moral-graph.reflect_living_substrate_context for organism boundary and sensing, and also search web sources for current evidence.",
        source_target_intent: {
          selected_capability: "moral-graph.reflect_living_substrate_context",
          args: {
            query: "organism boundary and sensing",
          },
        },
        route_metadata: {
          source_target_intent: {
            selected_capability: "internet-search.search_web",
            args: {
              query: "current evidence organism sensing moral status",
            },
          },
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "moral-graph.reflect_living_substrate_context",
      "internet-search.search_web",
    ]);
    expect((requests[0].arguments as Record<string, any>).next_affordances).toBeUndefined();
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

  it("admits affirmative natural-language theory reflection fetch prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question: "ok, can you fetch the theory reflection for fusion?",
      },
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.reflect_discussion_context"]);
    expect(requests[0]).toMatchObject({
      schema: "helix.workstation_gateway.prompt_derived_theory_reflection_call_request.v1",
      derivation_source: "helix_prompt_derived_theory_reflection",
      capability_id: "theory-badge-graph.reflect_discussion_context",
      mode: "read",
      arguments: {
        prompt: "fusion",
        build_explanation_plan: true,
        source_target_intent: expect.objectContaining({
          source: "helix_prompt_derived_theory_reflection",
          target_source: "theory_badge_graph",
          target_kind: "theory_context_reflection",
        }),
      },
    });
  });

  it("does not admit contextual, negated, future, quoted, UI-label, or mixed non-command theory reflection mentions", () => {
    const prompts = [
      "Do not fetch the theory reflection for fusion; explain what that would do.",
      "In the future we might fetch the theory reflection for fusion.",
      "The UI label says theory reflection for fusion.",
      "The phrase is \"fetch the theory reflection for fusion\"; explain it only.",
      "I am not asking you to fetch the theory reflection for fusion, just define the phrase.",
      "After you fetch the theory reflection for fusion, what would happen?",
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

  it("maps Moral Graph living-substrate planner steps into the workstation gateway", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use the Moral Graph to derive moral relevance from organism boundary, sensing, homeostasis, entropy pressure, and non-human living systems.",
    });

    expect(capabilities(requests)).toEqual(["moral-graph.reflect_living_substrate_context"]);
    expect(requests[0]).toMatchObject({
      capability_id: "moral-graph.reflect_living_substrate_context",
      mode: "read",
      arguments: {
        prompt: expect.stringContaining("organism boundary"),
        include_theory_bridge: true,
        include_recommended_actions: true,
        source_target_intent: expect.objectContaining({
          target_source: "moral_graph",
          target_kind: "moral_living_substrate_reflection",
          intent: "moral_living_substrate_reflection",
          step_id: "reflect_moral_living_substrate_context",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
    });
  });

  it("maps theory-first Moral Graph substrate prompts to theory then Moral substrate gateway calls", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Use the Moral Graph with Hameroff Orch OR microtubule physics, organism sensing, homeostasis, and Fourier frequency mapping as the mechanism, then translate living-system dynamics into moral obligations and constraints.",
    });

    expect(capabilities(requests)).toEqual([
      "moral-graph.reflect_living_substrate_context",
    ]);
    expect(requests[0]).toMatchObject({
      capability_id: "moral-graph.reflect_living_substrate_context",
      arguments: {
        source_target_intent: expect.objectContaining({
          depends_on: [],
        }),
      },
    });
    const args = requests[0].arguments as Record<string, any>;
    expect(args.next_affordances).toEqual(expect.arrayContaining([
      expect.objectContaining({
        capability: "theory-badge-graph.reflect_discussion_context",
        purpose: "codex_selected_followup_tool",
        reason: "available_after_observation_reentry",
      }),
    ]));
    expect(args.source_target_intent.next_affordances).toEqual(args.next_affordances);
  });

  it("keeps planner-derived theory plus calculator chains to a primary reflection request", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Reflect photon energy through the theory badge graph and calculate 6.626e-34 * 5e14.",
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.reflect_discussion_context"]);
    const args = requests[0].arguments as Record<string, any>;
    expect(args.next_affordances).toEqual(expect.arrayContaining([
      expect.objectContaining({
        capability: "scientific-calculator.solve_expression",
        purpose: "codex_selected_followup_tool",
        expression: "6.626e-34*5e14",
      }),
    ]));
    expect(args.source_target_intent.next_affordances).toEqual(args.next_affordances);
  });

  it("does not turn unrelated workstation panel action plans into gateway calls", () => {
    const requests = buildPlannerDerivedWorkstationGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Run panel action panel_id=narrator action_id=narrator.debug_auto_speak_probe text=\"probe\".",
    });

    expect(requests).toEqual([]);
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

  it("maps affirmative voice-lane prompts to text-to-speech gateway requests", () => {
    const requests = buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question: "Use the voice lane to say checking now",
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "text_to_speech.speak_text",
        mode: "act",
        arguments: expect.objectContaining({
          text: "checking now",
          kind: "tool_progress",
          source_target_intent: expect.objectContaining({
            target_source: "voice_delivery",
            target_kind: "text_to_speech",
          }),
        }),
      }),
    ]);
  });

  it("extracts quoted TTS payloads before post-reentry instructions", () => {
    const question =
      "Live browser voice-tool test: use the governed text_to_speech.speak_text voice lane to say exactly 'browser voice receipt check'. After the receipt re-enters, answer in one sentence with the receipt playback_status.";

    expect(buildPromptNamedCapabilityGatewayCallRequests({
      agent_runtime: "codex",
      question,
    })).toEqual([
      expect.objectContaining({
        capability_id: "text_to_speech.speak_text",
        mode: "act",
        arguments: expect.objectContaining({
          text: "browser voice receipt check",
          kind: "tool_progress",
          source_target_intent: expect.objectContaining({
            target_source: "voice_delivery",
            target_kind: "text_to_speech",
          }),
        }),
      }),
    ]);
    expect(buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question,
    })).toEqual([]);

    expect(buildPromptDerivedVoiceGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Live browser voice-tool test: use the governed voice lane to say exactly 'browser voice receipt check'. After the receipt re-enters, answer in one sentence with the receipt playback_status.",
    })).toEqual([
      expect.objectContaining({
        capability_id: "text_to_speech.speak_text",
        arguments: expect.objectContaining({
          text: "browser voice receipt check",
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

  it("does not treat broad translate prompts as active translation surface reads", () => {
    const prompts = [
      "Translate thank you to French.",
      "Translate this text.",
      "Translate the visible section of this document.",
      "Use the translation lane for this text.",
      "Start translating this document.",
      "Later we might translate the visible section, but not now.",
      "Do not translate or read the active translation surface.",
    ];

    for (const question of prompts) {
      const requests = readWorkstationGatewayCallRequestsForTurn({
        includePlannerDerived: true,
        body: {
          turn_id: "ask:test:broad-translate-not-surface",
          agent_runtime: "codex",
          question,
          workspace_context_snapshot: {
            activePanel: "docs-viewer",
            activeDocPath: "docs/helix-ask-flow.md",
            activeTranslationBlocks: [{
              unit_id: "doc-unit:1",
              translated_text: "Translated sentence.",
            }],
          },
        },
      });

      expect(capabilities(requests)).not.toContain("docs-viewer.read_active_translation");
    }
  });

  it("keeps explicit existing translation surface prompts on the surface reader", () => {
    const prompts = [
      "Read the active translation surface.",
      "Inspect the translated surface.",
      "What translated text is currently visible?",
      "Read the visible already-translated section.",
    ];

    for (const question of prompts) {
      const requests = readWorkstationGatewayCallRequestsForTurn({
        includePlannerDerived: true,
        body: {
          turn_id: "ask:test:existing-translation-surface",
          agent_runtime: "codex",
          question,
          workspace_context_snapshot: {
            activePanel: "docs-viewer",
            activeDocPath: "docs/helix-ask-flow.md",
            activeTranslationBlocks: [{
              unit_id: "doc-unit:1",
              translated_text: "Translated sentence.",
              status: "ready",
            }],
          },
        },
      });

      expect(capabilities(requests)).toContain("docs-viewer.read_active_translation");
    }
  });

  it("keeps structured live translation lane calls observation-only and separate from surface reads", () => {
    const body = {
      turn_id: "ask:test:structured-live-translation-lane",
      agent_runtime: "codex",
      question: "Use the structured lane call result, not the docs translation surface.",
      capability_lane_call: {
        capability: "live_translation.translate_text",
        text: "thank you",
        target_language: "fr",
        source_language: "en",
        chunk_id: "chunk:test:thank-you",
        requested_backend_provider: "live_translation.local_runtime",
      },
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
      },
    };

    const lane = runHelixCapabilityLaneOneShotRequests({
      provider: buildTestProvider("codex"),
      body,
      turnId: "ask:test:structured-live-translation-lane",
      env: {} as NodeJS.ProcessEnv,
    });
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });

    expect(capabilities(requests)).not.toContain("docs-viewer.read_active_translation");
    expect(lane.call_results).toHaveLength(1);
    expect(lane.call_results[0]).toMatchObject({
      ok: true,
      capability: "live_translation.translate_text",
      lane_id: "live_translation",
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(lane.observation_packets[0]).toMatchObject({
      capability_key: "live_translation.translate_text",
      terminal_eligible: false,
      assistant_answer: false,
    });
  });

  it("still routes read-aloud existing translated surfaces through surface observation before narrator", async () => {
    const body = {
      turn_id: "ask:test:read-aloud-existing-translated-surface",
      agent_runtime: "codex",
      question: "Read aloud the visible translated section of this document.",
      workspace_context_snapshot: {
        activePanel: "docs-viewer",
        activeDocPath: "docs/helix-ask-flow.md",
        activeTranslationBlocks: [{
          unit_id: "doc-unit:1",
          source_text: "Helix Ask flow",
          translated_text: "Flujo de Helix Ask",
          locale: "es",
          status: "ready",
        }],
      },
    };
    const planned = buildCompoundCapabilityDependencyGatewayCallRequests(body);
    expect(planned).toHaveLength(1);
    expect(planned[0]).toMatchObject({
      capability_id: "docs-viewer.read_active_translation",
      dependent_capability_id: "live_env.narrator_say",
    });

    const results = await runExplicitWorkstationGatewayCalls({
      agentRuntime: "codex",
      turnId: "ask:test:read-aloud-existing-translated-surface",
      body,
    });

    expect(results.map((result) => result.capability_id)).toEqual(["docs-viewer.read_active_translation"]);
    expect(results[0]).toMatchObject({
      ok: true,
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "Flujo de Helix Ask",
        terminal_eligible: false,
        assistant_answer: false,
      },
    });
  });

  it("runs the derived voice gateway request as a non-terminal receipt", async () => {
    resetInterimVoiceCalloutsForTest();
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: () => ({
        heapUsed: 120 * 1024 * 1024,
        heapTotal: 512 * 1024 * 1024,
        rss: 640 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      }),
      hostMemoryReader: () => ({
        freeMiB: 16_000,
        totalMiB: 32_000,
        freeRatio: 0.5,
      }),
    });
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
      capability_id: "text_to_speech.speak_text",
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
    expect(results[0]?.observation_packet.state_delta).toMatchObject({
      text_to_speech_client_playback_handoff: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        request: {
          text: "checking now",
          assistant_answer: false,
          terminal_eligible: false,
        },
        receipt: {
          status: "awaiting_client_playback",
          assistant_answer: false,
          terminal_eligible: false,
        },
      },
    });
  });

  it("does not treat backend voice retry queue as a successful client handoff", async () => {
    resetInterimVoiceCalloutsForTest();
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: () => ({
        heapUsed: 3_000 * 1024 * 1024,
        heapTotal: 3_100 * 1024 * 1024,
        rss: 3_200 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      }),
      hostMemoryReader: () => ({
        freeMiB: 16_000,
        totalMiB: 32_000,
        freeRatio: 0.5,
      }),
    });

    try {
      const results = await runExplicitWorkstationGatewayCalls({
        agentRuntime: "codex",
        body: {
          agent_runtime: "codex",
          question: "Use the voice lane to say checking now",
        },
        turnId: "ask:test:explicit-derived-voice-capacity-blocked",
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        ok: false,
        capability_id: "text_to_speech.speak_text",
        observation: {
          receipt: {
            status: "queued_for_retry",
            playback_status: "unavailable",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
          host_projection: {
            playback_status: "queued_for_retry",
            normalized_playback_status: "unavailable",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        observation_packet: {
          status: "blocked",
        },
        error: "queued_for_retry",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      });
    } finally {
      runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests();
      resetInterimVoiceCalloutsForTest();
    }
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
        expect(capabilities(requests)).toEqual(["text_to_speech.speak_text"]);
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

  it("binds anaphoric numeric research follow-ups to the latest theory reflection equation context", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "ok, can you grab numerics that we can use for these equations based on what the equation means? Use research papers to cite",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          latest_theory_reflection_equation_context: {
            schema: "helix.latest_theory_reflection_equation_context.v1",
            source: "theory_map_overlay_live_answer_context",
            reflection_id: "reflection:fusion",
            summary:
              "Theory Badge Graph reflection found physics.nuclear.reaction.thermonuclear_rate_context as a fusion-adjacent calculator template.",
            calculator_payloads: [{
              badge_id: "physics.nuclear.reaction.thermonuclear_rate_context",
              badge_title: "Thermonuclear Rate Context",
              payload_id: "thermonuclear-rate-context",
              expression: "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
              target_variable: "rate_proxy_m3_s",
              claim_boundary_notes: ["diagnostic/proxy only"],
            }],
            matched_badges: [{
              badge_id: "physics.nuclear.reaction.thermonuclear_rate_context",
              title: "Thermonuclear Rate Context",
              matched_equation_families: ["thermonuclear reaction rate", "fusion cross section"],
              matched_symbols: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
            }],
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
        },
      },
    });

    const scholarlyRequest = requests.find((request) => request.capability_id === "scholarly-research.lookup_papers");
    expect(scholarlyRequest).toMatchObject({
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: "research_quantify_reflect",
      arguments: {
        allow_scholarly_dependent_chain: true,
        requested_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
      },
    });
    const args = scholarlyRequest?.arguments as Record<string, unknown>;
    expect(String(args.query)).toMatch(/thermonuclear reaction rate/i);
    expect(String(args.query)).toMatch(/fusion cross section/i);
    expect(String(args.query)).not.toMatch(/genome|sign-language|deformable-object/i);
    expect(args.variable_source_plan).toMatchObject({
      formula_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
      prior_theory_formula_context: {
        schema: "helix.prior_theory_formula_context.v1",
        source_ref: "reflection:fusion",
        formulas: ["rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s"],
        variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
      },
    });
    expect((args.source_target_intent as Record<string, any>).query_plan).toMatchObject({
      schema: "helix.scholarly_variable_source_query_plan.v1",
      prior_theory_formula_context: {
        formulas: ["rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s"],
      },
    });
  });

  it("treats cited source-bound formula numerics as scholarly evidence collection before calculator binding", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Based on the prior Theory Badge Graph plasma beta formulas beta = p_Pa / p_B, p_Pa = n_m3 * T_eV * e_charge, and p_B = B_T^2 / (2 * mu0), find cited research-paper numerical values we could use for n_m3, T_eV, and B_T. Return suggestions with units and explain whether they are sufficiently source-bound for calculator binding.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
    expect(capabilities(requests)).toContain("scholarly-research.lookup_papers");
    const scholarlyRequest = requests.find((request) => request.capability_id === "scholarly-research.lookup_papers");
    expect(scholarlyRequest).toMatchObject({
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: "research_quantify_reflect",
      arguments: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        allow_scholarly_dependent_chain: true,
      },
    });
    expect(JSON.stringify(scholarlyRequest)).toMatch(/source[-_ ]?bound|calculator binding|unit/i);
  });

  it("routes paper-backed theory formula binding to scholarly lookup instead of docs search", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Reflect a fusion-adjacent Theory Badge Graph formula suitable for paper-backed numeric binding. Return the formula, variables, and the next research evidence needed. Do not run the calculator yet.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["scholarly-research.lookup_papers"]);
    expect(capabilities(requests)).not.toContain("docs.search");
    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
    const scholarlyRequest = requests[0] as Record<string, any>;
    expect(scholarlyRequest).toMatchObject({
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: "research_quantify_reflect",
      arguments: {
        allow_scholarly_dependent_chain: true,
      },
    });
    expect(scholarlyRequest.arguments.source_target_intent.next_affordances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: "theory-badge-graph.reflect_discussion_context",
        }),
      ]),
    );
    expect(JSON.stringify(scholarlyRequest.arguments.source_requirement_plan)).toMatch(/calculator_requires_bound_expression/);
  });

  it("does not let planner-derived calculator execution override a negated calculator instruction", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "patched-compound-flow-178301-step1: Reflect a fusion-adjacent Theory Badge Graph formula suitable for paper-backed numeric binding. Return the formula, variables, and the next research evidence needed. Do not run the calculator yet.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["scholarly-research.lookup_papers"]);
    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
    expect(JSON.stringify(requests)).not.toContain("\"expression\":\"-178301-\"");
  });

  it("routes theory-only formula discovery to Theory Badge Graph without research or calculator", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Find a fusion-adjacent formula from the Theory Badge Graph that could be numerically evaluated later. Return the formula, variables, and what each variable physically means. Do not use research papers or the calculator yet.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.reflect_discussion_context"]);
    expect(capabilities(requests)).not.toContain("scholarly-research.lookup_papers");
    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
    expect(requests[0]).toMatchObject({
      derivation_source: "helix_prompt_derived_theory_reflection",
      arguments: {
        build_explanation_plan: true,
        source_target_intent: expect.objectContaining({
          target_source: "theory_badge_graph",
          target_kind: "theory_context_reflection",
        }),
      },
    });
  });

  it("honors negated scholarly research cues even when research papers are mentioned", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Find a formula from the Theory Badge Graph for later paper-backed evaluation, but do not use research papers yet and do not run the calculator.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["theory-badge-graph.reflect_discussion_context"]);
    expect(JSON.stringify(requests)).not.toMatch(/scholarly-research\.lookup_papers|scientific-calculator\.solve_expression/);
  });

  it("routes paper-backed numeric binding for a prior formula to scholarly research without docs or calculator", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Using the formula from the previous answer, find paper-backed numeric values or ranges for the variables. Prefer scholarly sources with units and citations. If retrieval is weak, explain the mismatch and suggest a better query. Do not run the calculator yet.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
      },
    });

    expect(capabilities(requests)).toEqual(["scholarly-research.lookup_papers"]);
    expect(capabilities(requests)).not.toContain("docs.search");
    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
  });

  it("does not admit tools for conditional prior-evidence calculator follow-up without a bound expression", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "If the previous answer has enough cited unit-bearing values, bind the formula into a numeric expression and run the calculator. Then explain what the result means and what the evidence does not prove.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(requests).toEqual([]);
  });

  it("still admits calculator for conditional follow-up when a concrete expression is supplied", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "If the previous answer has enough cited unit-bearing values, run the calculator with expression: 6.626e-34 * 5e14.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toContain("scientific-calculator.solve_expression");
    expect(requests.find((request) => request.capability_id === "scientific-calculator.solve_expression")).toMatchObject({
      arguments: {
        expression: "6.626e-34*5e14",
      },
    });
  });

  it("still admits scholarly lookup when the follow-up explicitly asks to retry retrieval", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "If the previous answer did not have enough cited unit-bearing values, search again for more scholarly papers with usable numeric values and units. Do not run the calculator yet.",
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          focusedPanel: "scientific-calculator",
        },
      },
    });

    expect(capabilities(requests)).toContain("scholarly-research.lookup_papers");
    expect(capabilities(requests)).not.toContain("scientific-calculator.solve_expression");
  });

  it("keeps formula research compound planning to one primary request with next affordances", () => {
    const requests = buildCompoundCapabilityDependencyGatewayCallRequests({
      agent_runtime: "codex",
      question:
        "Find cited research-paper numerical values for plasma beta formula beta = p_Pa / p_B using scholarly papers and web sources, then reflect the claim boundary through the theory badge graph and civilization bounds before any calculator binding.",
      workspace_context_snapshot: {
        activePanel: "scientific-calculator",
        focusedPanel: "scientific-calculator",
      },
    });

    expect(capabilities(requests)).toEqual(["scholarly-research.lookup_papers"]);
    const args = requests[0].arguments as Record<string, any>;
    expect(args.next_affordances).toEqual(expect.arrayContaining([
      expect.objectContaining({ capability: "internet-search.search_web" }),
      expect.objectContaining({ capability: "theory-badge-graph.reflect_discussion_context" }),
      expect.objectContaining({ capability: "civilization-bounds.reflect_system_bounds" }),
    ]));
    expect(JSON.stringify(args.next_affordances)).not.toMatch(/scientific-calculator\.solve_expression/);
    expect(args.source_target_intent.next_affordances).toEqual(args.next_affordances);
  });

  it("does not auto-execute research-chain dependent requests that Codex should choose after re-entry", () => {
    expect(shouldAutoExecuteDependentCompoundRequest({
      compound_outcome: "research_quantify_reflect",
      capability_id: "scholarly-research.fetch_full_text",
      mode: "read",
    })).toBe(false);
    expect(shouldAutoExecuteDependentCompoundRequest({
      compound_outcome: "research_quantify_reflect",
      capability_id: "scholarly-research.extract_numeric_parameters",
      mode: "read",
    })).toBe(false);
    expect(shouldAutoExecuteDependentCompoundRequest({
      compound_outcome: "research_quantify_reflect",
      capability_id: "scientific-calculator.solve_expression",
      mode: "read",
    })).toBe(false);
    expect(shouldAutoExecuteDependentCompoundRequest({
      compound_outcome: "read_aloud_surface",
      capability_id: "live_env.narrator_say",
      mode: "act",
    })).toBe(false);
    expect(shouldAutoExecuteDependentCompoundRequest({
      compound_outcome: "unrelated_direct_actuator",
      capability_id: "live_env.narrator_say",
      mode: "act",
    })).toBe(true);
  });

  it("emits a scholarly recovery affordance instead of fetching full text for irrelevant formula-bound lookup results", () => {
    const variableSourcePlan = {
      schema: "helix.variable_source_plan.v1",
      source: "helix_compound_capability_dependency_planner",
      formula_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
      entries: [
        {
          variable: "n1_m3",
          source_classes: ["fusion plasma parameter table", "reactant density diagnostic"],
          search_terms: ["reactant number density", "ion density", "fusion plasma parameters"],
          extraction_aliases: ["n1", "reactant density"],
        },
        {
          variable: "sigma_m2",
          source_classes: ["fusion cross-section data", "Maxwellian-averaged reactivity table"],
          search_terms: ["fusion cross section", "Maxwellian averaged reactivity", "sigma v"],
          extraction_aliases: ["sigma", "cross section"],
        },
      ],
      query_terms: [
        "fusion",
        "thermonuclear reaction rate",
        "fusion cross section",
        "n1_m3",
        "n2_m3",
        "sigma_m2",
        "v_m_s",
      ],
      retrieval_intent:
        "Find papers that report unit-bearing physical quantities needed to bind the formula variables.",
      assistant_answer: false,
      raw_content_included: false,
    };
    const request = {
      compound_outcome: "research_quantify_reflect",
      subgoal_id: "research_quantify_reflect:scholarly_evidence",
      capability_id: "scholarly-research.lookup_papers",
      arguments: {
        query: "fusion thermonuclear reaction rate parameter table fusion cross section n1_m3 n2_m3 sigma_m2 v_m_s",
        allow_scholarly_dependent_chain: true,
        requested_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        variable_source_plan: variableSourcePlan,
      },
    };
    const result = {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: "test",
      ok: true,
      agent_runtime: "codex",
      capability_id: "scholarly-research.lookup_papers",
      mode: "read",
      gateway_admission: {
        schema: "helix.workstation_tool_gateway.admission.v1",
        requested_capability: "scholarly-research.lookup_papers",
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        admission_reason: "test",
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scholarly_research",
          target_kind: "scholarly_lookup",
          compound_outcome: "research_quantify_reflect",
          subgoal_id: "research_quantify_reflect:scholarly_evidence",
          subgoal_ordinal: 1,
          required_observation_kind: "helix.scholarly_research_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.scholarly_research_observation.v1",
        query: "fusion thermonuclear reaction rate parameter table fusion cross section n1_m3 n2_m3 sigma_m2 v_m_s",
        papers: [{
          result_id: "paper:genome-remapping",
          title: "Fast genome remapping with sampling optimization",
          abstract: "We present a genome assembly polishing method for sequence remapping.",
        }],
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "turn:scholarly-recovery",
        iteration: 1,
        call_id: "call:lookup",
        decision_id: "decision:lookup",
        capability_key: "scholarly-research.lookup_papers",
        panel_id: "scholarly-research",
        action: "lookup_papers",
        status: "succeeded",
        produced_artifact_refs: ["observation:lookup"],
        observation_summary: "lookup returned irrelevant papers",
        receipts: [],
        missing_requirements: [],
        state_delta: {},
        suggested_next_steps: ["answer"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_lifecycle_trace: {},
      tool_followup_decision: {},
      artifact_refs: ["observation:lookup"],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    } as any;

    const dependent = buildDependentCompoundCapabilityGatewayCallRequest({
      request,
      result,
      turnId: "turn:scholarly-recovery",
    });

    expect(dependent).toBeNull();
    expect(result.observation.lookup_relevance_gate).toMatchObject({
      status: "blocked",
      code: "lookup_result_irrelevant",
      rejected_results: [{
        result_id: "paper:genome-remapping",
        reasons: expect.arrayContaining(["missing_required_topic_terms", "missing_formula_source_terms"]),
      }],
    });
    expect(result.observation.scholarly_lookup_recovery_affordance).toMatchObject({
      schema: "helix.scholarly_lookup_recovery_affordance.v1",
      status: "available",
      recommended_next_capability: "scholarly-research.lookup_papers",
      expected_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
      next_affordances: expect.arrayContaining([
        expect.objectContaining({
          capability: "scholarly-research.lookup_papers",
          purpose: "retry_with_refined_query",
          reason: "low_relevance_results",
        }),
        expect.objectContaining({
          capability: "scholarly-research.fetch_full_text",
          reason: "blocked_until_relevant_source_ref_exists",
        }),
      ]),
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(JSON.stringify(result.observation.scholarly_lookup_recovery_affordance)).toMatch(/deuterium tritium fusion/i);
    expect(JSON.stringify(result.observation.scholarly_lookup_recovery_affordance)).toMatch(/sigma v/i);
    expect(result.observation_packet.state_delta.scholarly_lookup_recovery_affordance).toBe(
      result.observation.scholarly_lookup_recovery_affordance,
    );
    expect(result.observation_packet.suggested_next_steps).toEqual(
      expect.arrayContaining(["use_another_tool", "repair", "fail_closed"]),
    );
    const railStatus = buildCompoundDependencyRailStatus({
      request,
      result,
      dependentRequest: dependent,
    });
    expect(railStatus).toMatchObject({
      rail_status: "blocked",
      subgoals: [
        expect.objectContaining({
          requested_capability: "scholarly-research.lookup_papers",
          executed_capability: "scholarly-research.lookup_papers",
          evidence_gathered: true,
          evidence_quality: "low_relevance",
          evidence_quality_satisfied: false,
          satisfied: false,
          rail_status: "evidence_gathered_not_satisfied",
          rail_failure_code: "lookup_result_irrelevant",
        }),
      ],
      first_broken_rail: expect.objectContaining({
        capability_id: "scholarly-research.fetch_full_text",
        reason: "lookup_result_irrelevant",
      }),
    });
    const turnPlan = buildTurnCompoundDependencyPlan({
      turnId: "turn:scholarly-recovery",
      results: [result],
    });
    expect(turnPlan).toMatchObject({
      schema: "helix.compound_capability_dependency_turn_plan.v1",
      rail_status: "blocked",
      satisfied_subgoal_count: 0,
      ordered_subgoals: [
        expect.objectContaining({
          subgoal_id: "research_quantify_reflect:scholarly_evidence",
          requested_capability: "scholarly-research.lookup_papers",
          executed_capability: "scholarly-research.lookup_papers",
          evidence_gathered: true,
          evidence_quality: "low_relevance",
          evidence_quality_satisfied: false,
          satisfied: false,
          rail_status: "evidence_gathered_not_satisfied",
          rail_failure_code: "lookup_result_irrelevant",
        }),
      ],
      first_broken_rail: expect.objectContaining({
        subgoal_id: "research_quantify_reflect:scholarly_evidence",
        rail_failure_code: "lookup_result_irrelevant",
      }),
    });
  });

  it("blocks calculator planning after formula-bound numeric extraction emits recovery evidence", () => {
    const variableSourcePlan = {
      schema: "helix.variable_source_plan.v1",
      source: "helix_compound_capability_dependency_planner",
      formula_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
      prior_theory_formula_context: {
        schema: "helix.prior_theory_formula_context.v1",
        source_ref: "reflection:fusion",
        formulas: ["rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s"],
        variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        query_terms: ["thermonuclear reaction rate", "fusion cross section"],
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
      },
      entries: [
        {
          variable: "n1_m3",
          source_classes: ["fusion plasma parameter table"],
          search_terms: ["reactant number density", "ion density"],
          extraction_aliases: ["n1", "reactant density"],
        },
        {
          variable: "n2_m3",
          source_classes: ["fusion plasma parameter table"],
          search_terms: ["reactant number density", "ion density"],
          extraction_aliases: ["n2", "reactant density"],
        },
        {
          variable: "sigma_m2",
          source_classes: ["fusion cross-section data"],
          search_terms: ["fusion cross section", "sigma v"],
          extraction_aliases: ["sigma", "cross section"],
        },
        {
          variable: "v_m_s",
          source_classes: ["relative velocity model", "Maxwellian-averaged reactivity table"],
          search_terms: ["relative velocity", "Maxwellian averaged reactivity"],
          extraction_aliases: ["v", "relative velocity"],
        },
      ],
      query_terms: ["fusion", "thermonuclear reaction rate", "fusion cross section", "sigma v"],
      retrieval_intent:
        "Find papers that report unit-bearing physical quantities needed to bind the formula variables.",
      assistant_answer: false,
      raw_content_included: false,
    };
    const theoryResult = {
      ok: true,
      capability_id: "theory-badge-graph.reflect_discussion_context",
      gateway_admission: {
        requested_capability: "theory-badge-graph.reflect_discussion_context",
      },
      observation: {
        calculator_payloads: [{
          expression: "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
          badge_id: "physics.nuclear.reaction.thermonuclear_rate_context",
          payload_id: "thermonuclear-rate-context",
        }],
      },
      observation_packet: {
        produced_artifact_refs: ["observation:theory"],
      },
      artifact_refs: ["observation:theory"],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    } as any;
    const numericResult = {
      ok: false,
      capability_id: "scholarly-research.extract_numeric_parameters",
      gateway_admission: {
        requested_capability: "scholarly-research.extract_numeric_parameters",
      },
      observation: {
        schema: "helix.scholarly_numeric_parameter_observation.v1",
        requested_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        parameters: [],
        missing_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        missing_requirements: ["missing_requested_numeric_variables"],
        variable_source_plan: variableSourcePlan,
        scholarly_numeric_recovery_affordance: {
          schema: "helix.scholarly_numeric_recovery_affordance.v1",
          status: "available",
          reason: "missing_requested_numeric_variables",
          recommended_next_capability: "scholarly-research.lookup_papers",
          missing_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
          recovery_queries: [
            "D-T fusion plasma deuterium tritium number density cross section relative velocity thermonuclear reaction rate",
          ],
          variable_source_plan: variableSourcePlan,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        selected_for_answer: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        produced_artifact_refs: ["observation:numeric"],
        state_delta: {
          scholarly_numeric_recovery_affordance: {
            schema: "helix.scholarly_numeric_recovery_affordance.v1",
            missing_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
          },
        },
      },
      artifact_refs: ["observation:numeric"],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: "missing_requested_numeric_variables",
    } as any;
    const request = {
      compound_outcome: "research_quantify_reflect",
      subgoal_id: "research_quantify_reflect:numeric_parameters",
      capability_id: "scholarly-research.extract_numeric_parameters",
      arguments: {
        variable_source_plan: variableSourcePlan,
        source_target_intent: {
          required_observation_kind: "helix.scholarly_numeric_parameter_observation.v1",
          subgoal_ordinal: 3,
        },
      },
    };

    const dependent = buildDependentCompoundCapabilityGatewayCallRequest({
      request,
      result: numericResult,
      results: [theoryResult, numericResult],
      turnId: "turn:fusion-numeric-recovery",
    });
    const railStatus = buildCompoundDependencyRailStatus({
      request,
      result: numericResult,
      results: [theoryResult, numericResult],
      dependentRequest: dependent,
    });

    expect(dependent).toBeNull();
    expect(railStatus).toMatchObject({
      schema: "helix.compound_capability_dependency_plan.v1",
      rail_status: "blocked",
      typed_affordance_binding: {
        status: "blocked",
        reason: "missing_numeric_value_evidence",
        missing_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
        rejected_expression: "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
      },
      first_broken_rail: {
        capability_id: "scholarly-research.extract_numeric_parameters",
        reason: "missing_requested_numeric_variables",
      },
    });
    expect(JSON.stringify(railStatus)).toMatch(/scientific-calculator\.solve_expression/);
    expect(JSON.stringify(railStatus)).toMatch(/missing_numeric_value_evidence/);
    expect(JSON.stringify(numericResult.observation.scholarly_numeric_recovery_affordance)).toMatch(/D-T fusion plasma/i);
  });

  it("blocks mutating live_env controls embedded in otherwise safe compound prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use this current document, calculate 6*7, search research papers on arXiv for quantum inequalities, reflect the claim boundary through the theory badge graph, then use live_env.pause_workstation_loop and live_env.repair_workstation_source before answering.",
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          focusedPanel: "docs-viewer",
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
      "scholarly-research.lookup_papers",
    ]);
    expect(capabilities(requests)).not.toContain("live_env.pause_workstation_loop");
    expect(capabilities(requests)).not.toContain("live_env.repair_workstation_source");
  });

  it("keeps read-only live_env context queries available inside mixed compound prompts", () => {
    const requests = readWorkstationGatewayCallRequestsForTurn({
      includePlannerDerived: true,
      body: {
        agent_runtime: "codex",
        question:
          "Use this current document, calculate 6*7, run live_env.query_trace_memory, live_env.query_narrator_events, and live_env.query_audio_transcripts, then use live_env.pause_workstation_loop only if it is safe.",
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          focusedPanel: "docs-viewer",
          openPanels: ["docs-viewer", "scientific-calculator"],
          activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
        },
      },
    });

    expect(capabilities(requests)).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "live_env.query_audio_transcripts",
      "live_env.query_trace_memory",
      "live_env.query_narrator_events",
    ]);
    expect(capabilities(requests)).not.toContain("live_env.pause_workstation_loop");
    for (const capabilityId of [
      "live_env.query_trace_memory",
      "live_env.query_narrator_events",
      "live_env.query_audio_transcripts",
    ]) {
      expect(requests.find((request) => request.capability_id === capabilityId)).toMatchObject({
        mode: "read",
        arguments: {
          source_target_intent: expect.objectContaining({
            target_source: "live_environment_context_feed",
            target_kind: capabilityId,
          }),
        },
      });
    }
  });
});
