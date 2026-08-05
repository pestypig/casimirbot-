import { describe, expect, it } from "vitest";

import {
  attachCodexProviderExactCapabilityItinerary,
  ensureCodexPreGatewayRouteAuthority,
  runtimeProviderRequiredGroundingCapabilityIdsFromBody,
} from "../codex-provider";
import { readWorkstationGatewayCallRequestsForTurn } from "../explicit-workstation-gateway";

describe("Codex provider pre-gateway route authority", () => {
  it("commits an affirmative cadence command to the concrete control capability", () => {
    const body: Record<string, unknown> = {
      question: "Set the visual capture interval to 10 seconds.",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        strength: "hard",
        requested_outputs: ["live_pipeline_receipt", "typed_failure"],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "visual_capture_describe",
        requested_capability: "live_pipeline",
        required_terminal_kind: "situation_context_pack",
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:affirmative-cadence-control",
      selectedRoute: "/ask/turn",
    });

    expect(body.tool_call_admission_decision).toMatchObject({
      required: true,
      requested_capability: "situation-room.live-source.set_rate",
      selected_capability: "situation-room.live-source.set_rate",
      admitted_capability: "situation-room.live-source.set_rate",
      source_target: "live_pipeline",
    });
    expect(body.committed_ask_route).toMatchObject({
      route: { source_target: "live_pipeline" },
      canonical_goal: {
        goal_kind: "live_pipeline_control",
        requested_capability: "situation-room.live-source.set_rate",
        required_terminal_kind: "live_pipeline_receipt",
      },
    });
    expect(
      readWorkstationGatewayCallRequestsForTurn({
        body,
        includePlannerDerived: true,
      }),
    ).toMatchObject([
      {
        capability_id: "situation-room.live-source.set_rate",
        mode: "act",
        arguments: {
          cadence_ms: 10_000,
          capture_mode: "interval",
        },
      },
    ]);
  });

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

  it("lets a hard named-document summary override an unrelated theory goal frame", () => {
    const body: Record<string, unknown> = {
      question:
        'Find the document called "Casimir Dp Quantum Foam Study", read the best matching result, and explain what it is about in a short paragraph.',
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "docs_viewer",
        target_kind: "docs_viewer",
        strength: "hard",
        requested_outputs: [
          "file_path",
          "doc_summary",
          "tool_call_eligibility",
          "typed_failure",
        ],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "theory_context_reflection",
        required_terminal_kind: "workstation_tool_evaluation",
        classifier_reasons: [
          "workstation_tool_plan:theory_context_reflection",
        ],
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:hard-doc-summary-over-theory-frame",
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
        required_terminal_product: "doc_summary",
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

  it("repairs a stale scholarly projection from affirmative retained scientific evidence", () => {
    const body: Record<string, unknown> = {
      question:
        "For that extraction, report the exact sidecar id, source id, page, crop reference, evidence depth, and promoted equation. Use retained evidence; do not fetch, render, or crop.",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "scholarly_research",
        target_kind: "scholarly_research_followup",
        strength: "hard",
        requested_outputs: ["scholarly_paper_refs", "typed_failure"],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "scholarly_research_followup",
        required_terminal_kind: "scholarly_research_answer",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "visual_capture",
        allowed_terminal_artifact_kinds: [
          "scientific_image_evidence_continuity_summary",
          "typed_failure",
        ],
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId: "ask:retained-scientific-evidence-followup",
      selectedRoute: "/ask/turn",
    });

    expect(body.source_target_intent).toMatchObject({
      target_source: "scientific_image_evidence",
      target_kind: "scientific_image_evidence",
      strength: "hard",
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "scientific_image_evidence",
        target_kind: "scientific_image_evidence_sidecar",
      },
      canonical_goal: {
        goal_kind: "scientific_image_evidence_continuity",
        required_terminal_kind:
          "scientific_image_evidence_continuity_summary",
      },
      capability_policy: {
        required_capability_families: [],
      },
      terminal_product: {
        required_terminal_product:
          "scientific_image_evidence_continuity_summary",
        evidence_reentry_required: true,
        followup_reasoning_required: false,
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

  it("replaces a stale no-tool projection with the retained scientific sidecar route", () => {
    const turnId = "ask:scientific-sidecar-continuation";
    const promptText =
      "Continue with that exact enrollment. Prepare a current-turn execution plan changing permitted Dxx from 0.01 to 0.02 while freezing every other registered input. Bind the plan to the same badge orientation, source claim, Lanyon semantics, pinned Lean contract, primary and independent numerics, confirmation policy, and closure evaluator. Prepare only; do not start or evaluate.";
    const body: Record<string, unknown> = {
      question: promptText,
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: "thread:scientific-sidecar-continuation",
        target_source: "unknown",
        target_kind: "unknown",
        strength: "none",
        allow_client_shortcut: true,
        allow_no_tool_direct: true,
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId,
      selectedRoute: "/ask/turn",
    });

    expect(body.source_target_intent).toMatchObject({
      target_source: "theory_locator",
      target_kind: "scientific_evidence_execution_plan",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "theory_locator",
      },
      terminal_product: {
        evidence_reentry_required: true,
        followup_reasoning_required: true,
      },
    });
  });

  it("enriches one structured closure evaluation with the enrolled manifest", () => {
    const turnId = "ask:scientific-closure-evaluate";
    const promptText =
      "Now call scientific-evidence-closure.evaluate for that exact current-turn plan, using only current-turn confirmation, formal, and numerical artifacts that actually exist.";
    const body: Record<string, unknown> = {
      question: promptText,
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: "thread:scientific-closure-evaluate",
        target_source: "unknown",
        target_kind: "unknown",
        strength: "none",
        allow_no_tool_direct: true,
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId,
      selectedRoute: "/ask/turn",
    });

    expect(
      readWorkstationGatewayCallRequestsForTurn({
        body,
        includePlannerDerived: true,
      }),
    ).toMatchObject([
      {
        capability_id: "scientific-evidence-closure.evaluate",
        arguments: {
          manifest_id:
            "scientific-evidence:advection-diffusion-dxx:v1",
        },
      },
    ]);
  });

  it("reconciles a stale document lifecycle before a hard Minecraft world turn reaches Codex", () => {
    const turnId = "ask:minecraft-world-stale-document-lifecycle";
    const body: Record<string, unknown> = {
      question:
        "What is the current daytime value in our Minecraft world? Please read it directly from the live Fabric server before you answer.",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: "helix-ask:room:shared_realtime_room:minecraft",
        target_source: "world_event",
        target_kind: "world_event",
        strength: "hard",
        precedence_reason: "explicit_world_event_source_target",
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        turn_id: turnId,
        goal_kind: "doc_open_best",
        required_terminal_kind: "doc_open_receipt",
        classifier_reasons: ["doc_read_aloud_phrase"],
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        turn_id: turnId,
        source_target: "world_event",
        goal_kind: "doc_open_best",
        required_terminal_kind: "doc_open_receipt",
        required_terminal_artifact_kind: "doc_open_receipt",
        allowed_terminal_artifact_kinds: ["doc_open_receipt"],
      },
      active_doc_identity: {
        active_doc_path: "docs/example.md",
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId,
      selectedRoute: "/ask/turn/stream",
    });

    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "world_event",
        source_identity: null,
      },
      canonical_goal: {
        goal_kind: "environment_evidence_synthesis",
        required_terminal_kind: "model_synthesized_answer",
      },
    });
    expect(body.canonical_goal_frame).toMatchObject({
      goal_kind: "environment_evidence_synthesis",
      required_terminal_kind: "model_synthesized_answer",
      source: "committed_route_canonical_goal_reconciliation",
    });
    expect(body.route_product_contract).toMatchObject({
      source_target: "world_event",
      goal_kind: "environment_evidence_synthesis",
      required_terminal_kind: "model_synthesized_answer",
      required_terminal_artifact_kind: "model_synthesized_answer",
      evidence_reentry_required: true,
      followup_reasoning_required: true,
    });
    expect(body.route_evidence_authority).toMatchObject({
      schema: "helix.route_evidence_authority.v1",
      required_terminal_kind: "model_synthesized_answer",
      allowed_terminal_artifact_kinds: expect.arrayContaining([
        "model_synthesized_answer",
        "agent_provider_terminal_candidate",
      ]),
    });
    expect(body.committed_route_lifecycle_reconciliation).toMatchObject({
      canonical_goal_reconciled: true,
      route_product_contract_reconciled: true,
      authority: "helix_committed_route",
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("repairs a stale model-only route from an authenticated selected Minecraft subject", () => {
    const turnId = "ask:minecraft-trusted-room-followup";
    const prompt =
      "At my current safe plains site, build a freestanding stone-brick wall five blocks long north-south and three blocks high at the nearest safe level location at least three blocks away from me. Inspect first and avoid my player, entities, structures, foliage, paths, and water. Capture a rollback checkpoint before changing blocks, build only on verified solid support into verified air, inspect the finished wall, and report the exact endpoints plus checkpoint status. If no safe site is verified, do not build.";
    const body: Record<string, unknown> = {
      question: prompt,
      session_id: "helix-ask:room:shared_realtime_room:trusted-wall",
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: "helix-ask:room:shared_realtime_room:trusted-wall",
        target_source: "model_only",
        target_kind: "general_background",
        strength: "hard",
        allow_no_tool_direct: true,
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: turnId,
        required: false,
        admitted_tool_families: ["model_only"],
      },
    };

    ensureCodexPreGatewayRouteAuthority({
      body,
      turnId,
      selectedRoute: "/ask/turn/stream",
      trustedEnvironmentContext: {
        schema: "helix.trusted_room_environment_intent_context.v1",
        trusted_environment_domain: "minecraft",
        room_id: "shared_realtime_room:trusted-wall",
        participant_id: "room_participant:owner",
        environment_binding_ref: "environment_binding:trusted-wall",
        environment_label: "Local Fabric 1.21.8 source",
        domain_adapter: "minecraft.fabric_mod.v1",
        subject_kind: "minecraft.player",
        subject_label: "DatDamPig",
        source: "authenticated_room_environment_subject",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    expect(body.source_target_intent).toMatchObject({
      target_source: "live_environment",
      strength: "hard",
      allow_no_tool_direct: false,
    });
    expect(body.tool_call_admission_decision).toMatchObject({
      required: true,
      admitted_tool_families: expect.arrayContaining(["live_environment"]),
      compound_requested_capabilities: expect.arrayContaining([
        "com.casimirbot.minecraft.spatial_region.inspect",
        "com.casimirbot.minecraft.command.catalog",
        "com.casimirbot.minecraft.command",
      ]),
    });
    expect(body.committed_ask_route).toMatchObject({
      route: {
        source_target: "live_environment",
        strength: "hard",
      },
      terminal_product: {
        evidence_reentry_required: true,
        followup_reasoning_required: true,
      },
    });
  });

  it("puts room-scoped Minecraft mechanics grounding first in the native Codex itinerary", () => {
    const turnId = "ask:minecraft-mechanics-first-itinerary";
    const promptText =
      "At my current safe plains site, build a freestanding stone-brick wall five blocks long north-south and three blocks high. Inspect first, capture a rollback checkpoint, and do not build if no safe site is verified.";
    const trustedEnvironmentContext = {
      schema: "helix.trusted_room_environment_intent_context.v1" as const,
      trusted_environment_domain: "minecraft" as const,
      room_id: "shared_realtime_room:trusted-wall",
      participant_id: "room_participant:owner",
      environment_binding_ref: "environment_binding:trusted-wall",
      environment_label: "Local Fabric 1.21.8 source",
      domain_adapter: "minecraft.fabric_mod.v1",
      subject_kind: "minecraft.player",
      subject_label: "DatDamPig",
      source: "authenticated_room_environment_subject" as const,
      terminal_eligible: false as const,
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
    const body: Record<string, unknown> = {
      question: promptText,
      trusted_room_environment_intent_context: trustedEnvironmentContext,
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: turnId,
        source_target: "live_environment",
        requested_capability:
          "com.casimirbot.minecraft.spatial_region.inspect",
        selected_capability:
          "com.casimirbot.minecraft.spatial_region.inspect",
        admitted_capability:
          "com.casimirbot.minecraft.spatial_region.inspect",
        admitted_tool_families: ["live_environment", "docs_viewer"],
      },
    };

    expect(
      attachCodexProviderExactCapabilityItinerary({
        body,
        turnId,
        promptText,
        trustedEnvironmentContext,
        availableCapabilities: {
          capabilities: [
            { capability_id: "docs.search" },
            {
              capability_id:
                "com.casimirbot.minecraft.spatial_region.inspect",
            },
            { capability_id: "com.casimirbot.minecraft.command.catalog" },
            { capability_id: "com.casimirbot.minecraft.command" },
          ],
        },
      }),
    ).toBe(true);

    const subgoals = (
      body.compound_capability_contract as {
        subgoals: Array<{
          subgoal_id: string;
          runtime_capability: string;
          depends_on_subgoal_ids: string[];
          args_hint: Record<string, unknown>;
        }>;
      }
    ).subgoals;
    expect(subgoals.map((subgoal) => subgoal.runtime_capability)).toEqual([
      "docs.search",
      "com.casimirbot.minecraft.spatial_region.inspect",
      "com.casimirbot.minecraft.command.catalog",
      "com.casimirbot.minecraft.command",
    ]);
    expect(subgoals[0].args_hint).toMatchObject({
      query: promptText,
      environment_scope: "active_room_environment",
    });
    for (const subgoal of subgoals.slice(1)) {
      expect(subgoal.depends_on_subgoal_ids).toContain(subgoals[0].subgoal_id);
    }
    expect(
      runtimeProviderRequiredGroundingCapabilityIdsFromBody(body),
    ).toEqual(
      expect.arrayContaining([
        "docs.search",
        "com.casimirbot.minecraft.spatial_region.inspect",
        "com.casimirbot.minecraft.command.catalog",
        "com.casimirbot.minecraft.command",
      ]),
    );
  });
});
