import { describe, expect, it } from "vitest";

import {
  attachCodexProviderExactCapabilityItinerary,
  ensureCodexPreGatewayRouteAuthority,
} from "../codex-provider";

describe("Codex provider pre-gateway route authority", () => {
  it("does not promote a generic visual-source turn into named receipt evaluation", () => {
    const body: Record<string, unknown> = {
      question: "What is happening right now in the visual screen capture?",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "visual_capture",
        target_kind: "visual_capture",
        strength: "hard",
        requested_outputs: [
          "situation_context_pack",
          "model_synthesized_answer",
          "typed_failure",
        ],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "visual_capture_describe",
        requested_capability: "situation-room.describe_visual_capture",
        required_terminal_kind: "model_synthesized_answer",
        allowed_terminal_artifact_kinds: [
          "model_synthesized_answer",
          "situation_context_pack",
          "image_lens_named_receipt_evaluation",
          "typed_failure",
        ],
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "visual_capture",
        goal_kind: "visual_capture_describe",
        required_terminal_kind: "model_synthesized_answer",
        required_terminal_artifact_kind: "model_synthesized_answer",
        allowed_terminal_artifact_kinds: [
          "model_synthesized_answer",
          "situation_context_pack",
          "image_lens_named_receipt_evaluation",
          "typed_failure",
        ],
        evidence_reentry_required: true,
        followup_reasoning_required: true,
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:generic-visual-source",
      selectedRoute: "/ask/turn",
    });

    expect(body.canonical_goal_frame).toMatchObject({
      goal_kind: "visual_capture_describe",
      requested_capability: "situation-room.describe_visual_capture",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(body.route_product_contract).toMatchObject({
      required_terminal_kind: "model_synthesized_answer",
      required_terminal_artifact_kind: "model_synthesized_answer",
      evidence_reentry_required: true,
      followup_reasoning_required: true,
    });
  });

  it("materializes the Docs summary lifecycle from a hard source contract", () => {
    const body: Record<string, unknown> = {
      question:
        'Find the document called "Casimir Dp Quantum Foam Study", read the best matching result, and explain what it is about.',
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "docs_viewer",
        target_kind: "docs_viewer",
        strength: "hard",
        requested_outputs: ["file_path", "doc_summary", "typed_failure"],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "agent_provider_gateway_turn",
        requested_capability: "docs.search",
        required_terminal_kind: "model_synthesized_answer",
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:hard-doc-summary-contract",
      selectedRoute: "/ask/turn",
    });

    expect(body.canonical_goal_frame).toMatchObject({
      goal_kind: "doc_summary",
      answer_scope: "current_turn_doc",
      required_terminal_kind: "doc_summary",
      source: "hard_source_target_contract_repair",
    });
    expect(body.route_product_contract).toMatchObject({
      source_target: "docs_viewer",
      goal_kind: "doc_summary",
      required_terminal_kind: "doc_summary",
      evidence_reentry_required: true,
      followup_reasoning_required: true,
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "docs_viewer",
      },
      canonical_goal: {
        goal_kind: "doc_summary",
        required_terminal_kind: "doc_summary",
      },
      terminal_product: {
        evidence_reentry_required: true,
      },
    });
  });

  it("does not promote quoted, negated, or future Docs language without a hard source contract", () => {
    for (const question of [
      'The screen says "find the document and summarize it." Explain that label.',
      "Do not find or summarize the document.",
      "Later, find the document and summarize it.",
    ]) {
      const body: Record<string, unknown> = {
        question,
        source_target_intent: {
          target_source: "model_only",
          target_kind: "model_only",
          strength: "soft",
          requested_outputs: ["direct_answer_text"],
        },
        canonical_goal_frame: {
          goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
        },
      };

      ensureCodexPreGatewayRouteAuthority({
        body,
        turnId: `ask:dormant-doc-summary:${question.length}`,
        selectedRoute: "/ask/turn",
      });

      expect(body.canonical_goal_frame).toMatchObject({
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      });
    }
  });

  it("preserves an authoritative active-document follow-up over stale scholarly memory", () => {
    const body: Record<string, unknown> = {
      question: "Can you explain what that paper is about?",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "operator_text",
        target_kind: "realtime_transcript",
        source: "stage_play_realtime_handoff",
      },
      route_metadata: {
        source: "realtime_stage_play",
        invocationKind: "stage_play_realtime_transcript_handoff",
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          target_source: "active_doc",
          target_kind: "active_doc",
          strength: "hard",
          active_doc_path: "docs/research/nhm2-current-status-whitepaper.md",
          requested_outputs: ["file_path", "grounded_runtime_agent_answer", "typed_failure"],
          must_enter_backend_ask: true,
          allow_no_tool_direct: false,
        },
      },
      sourceTargetIntent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "active_doc",
        target_kind: "active_doc",
        strength: "hard",
        active_doc_path: "docs/research/nhm2-current-status-whitepaper.md",
        requested_outputs: ["file_path", "grounded_runtime_agent_answer", "typed_failure"],
        must_enter_backend_ask: true,
        allow_no_tool_direct: false,
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "model_only_concept",
        answer_scope: "model_only",
        required_terminal_kind: "direct_answer_text",
      },
      workspace_context_snapshot: {
        active_doc_path: "docs/research/nhm2-current-status-whitepaper.md",
        chat_referent_context: {
          previous_assistant_final_answer: {
            text: "I found the NHM2 current status whitepaper.",
          },
        },
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:active-doc-paper-followup",
      selectedRoute: "/ask/turn",
    });

    expect(body.source_target_intent).toMatchObject({
      target_source: "active_doc",
      target_kind: "active_doc",
      active_doc_path: "docs/research/nhm2-current-status-whitepaper.md",
    });
    expect(body.canonical_goal_frame).toMatchObject({
      goal_kind: "agent_provider_gateway_turn",
      requested_capability: "docs.search",
      required_terminal_kind: "model_synthesized_answer",
      source: "hard_source_target_contract_repair",
    });
    expect(body.route_product_contract).toMatchObject({
      source_target: "active_doc",
      required_terminal_kind: "model_synthesized_answer",
      evidence_reentry_required: true,
      followup_reasoning_required: true,
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "active_doc",
      },
      canonical_goal: {
        required_terminal_kind: "model_synthesized_answer",
      },
      terminal_product: {
        evidence_reentry_required: true,
      },
    });
  });

  it("rebuilds an exact provider itinerary before terminal family fallback can erase it", () => {
    const turnId = "ask:theory-procedure-exact-itinerary";
    const capability = "theory-experiment-procedure.prepare";
    const promptText =
      "Prepare a theory experiment procedure comparing badge study.casimir_dp.evidence_map_stage3 with physics.energy.energy_density using advection_diffusion_full_1d.";
    const body: Record<string, unknown> = {
      question: promptText,
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: turnId,
        source_target: "theory_locator",
        requested_capability: capability,
        selected_capability: capability,
        admitted_capability: capability,
        admitted_tool_families: ["theory_locator"],
      },
      runtime_intent_packet: {
        schema: "helix.runtime_intent_packet.v1",
        turn_id: turnId,
      },
    };
    const attached = attachCodexProviderExactCapabilityItinerary({
      body,
      turnId,
      promptText,
      availableCapabilities: {
        capabilities: [{ capability_id: capability }],
      },
    });

    expect(attached).toBe(true);
    expect(body.capability_itinerary).toMatchObject({
      schema: "helix.capability_itinerary.v1",
      turn_id: turnId,
      source: "codex_provider_pre_gateway_exact_admission",
      prompt_shape: "single_tool",
      planned_steps: [
        expect.objectContaining({
          requested_capability: capability,
          runtime_capability: capability,
          required_observation_kinds: [
            "theory_experiment_procedure_observation",
          ],
          args_hint: expect.objectContaining({
            operation: "compare",
            selected_badge_ids: [
              "study.casimir_dp.evidence_map_stage3",
              "physics.energy.energy_density",
            ],
            lanyon_case_id: "advection_diffusion_full_1d",
          }),
        }),
      ],
      terminal_success_criteria: expect.objectContaining({
        required_capabilities: [capability],
      }),
    });
    expect(body.compound_capability_contract).toMatchObject({
      schema: "helix.compound_capability_contract.v1",
      subgoals: [
        expect.objectContaining({
          requested_capability: capability,
          runtime_capability: capability,
          required_observation_kinds: [
            "theory_experiment_procedure_observation",
          ],
          args_hint: expect.objectContaining({
            operation: "compare",
            selected_badge_ids: [
              "study.casimir_dp.evidence_map_stage3",
              "physics.energy.energy_density",
            ],
            lanyon_case_id: "advection_diffusion_full_1d",
          }),
        }),
      ],
    });
    expect(body.runtime_intent_packet).toMatchObject({
      capability_itinerary: {
        source: "codex_provider_pre_gateway_exact_admission",
      },
      compound_capability_contract: {
        schema: "helix.compound_capability_contract.v1",
      },
    });

    const blockedBody: Record<string, unknown> = {
      tool_call_admission_decision: {
        turn_id: turnId,
        selected_capability: capability,
        admitted_tool_families: ["theory_locator"],
      },
    };
    expect(attachCodexProviderExactCapabilityItinerary({
      body: blockedBody,
      turnId,
      promptText: "Continue that same comparison and re-prepare the procedure.",
      availableCapabilities: { capabilities: [] },
    })).toBe(false);
    expect(blockedBody).not.toHaveProperty("capability_itinerary");
  });

  it("projects a policy-admitted Docs search without requiring capability syntax in the prompt", () => {
    const turnId = "ask:natural-doc-search-exact-itinerary";
    const promptText = "Can you find the NHM2 current status whitepaper?";
    const body: Record<string, unknown> = {
      question: promptText,
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: turnId,
        source_target: "docs_viewer",
        requested_capability: "docs-viewer.search_docs",
        selected_capability: "docs.search",
        admitted_capability: "docs.search",
        admitted_tool_families: ["docs_viewer"],
      },
      runtime_intent_packet: {
        schema: "helix.runtime_intent_packet.v1",
        turn_id: turnId,
      },
    };

    expect(
      attachCodexProviderExactCapabilityItinerary({
        body,
        turnId,
        promptText,
        availableCapabilities: {
          capabilities: [{ capability_id: "docs.search" }],
        },
      }),
    ).toBe(true);

    expect(body.capability_itinerary).toMatchObject({
      source: "codex_provider_pre_gateway_exact_admission",
      prompt_shape: "single_tool",
      planned_steps: [
        expect.objectContaining({
          requested_capability: "docs-viewer.search_docs",
          runtime_capability: "docs.search",
          args_hint: expect.objectContaining({
            query: expect.stringContaining("NHM2 current status whitepaper"),
          }),
        }),
      ],
      terminal_success_criteria: expect.objectContaining({
        required_capabilities: ["docs-viewer.search_docs"],
      }),
    });
    expect(body.compound_capability_contract).toMatchObject({
      prompt_shape: "single_capability",
      required_capabilities: ["docs-viewer.search_docs"],
      subgoals: [
        expect.objectContaining({
          requested_capability: "docs-viewer.search_docs",
          runtime_capability: "docs.search",
          required_observation_kinds: [
            "doc_search_results",
            "retrieval_context",
          ],
        }),
      ],
    });
  });
});
