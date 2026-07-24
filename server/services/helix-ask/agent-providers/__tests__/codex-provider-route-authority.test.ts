import { describe, expect, it } from "vitest";

import { ensureCodexPreGatewayRouteAuthority } from "../codex-provider";

describe("Codex provider pre-gateway route authority", () => {
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
});
