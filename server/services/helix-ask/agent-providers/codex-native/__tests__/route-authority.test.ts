import { describe, expect, it } from "vitest";

import { mergeCodexProviderRouteAuthorityProjection } from "../route-authority";

describe("Codex provider route authority projection", () => {
  it("preserves solver-owned request authority over a generic provider gateway projection", () => {
    const result = mergeCodexProviderRouteAuthorityProjection(
      {
        source_target_intent: {
          target_source: "docs_viewer",
          strength: "hard",
        },
        canonical_goal_frame: {
          goal_kind: "doc_summary",
          required_terminal_kind: "doc_summary",
          source: "ask_turn_solver",
        },
        route_product_contract: {
          source_target: "docs_viewer",
          required_terminal_kind: "doc_summary",
        },
        capability_itinerary: {
          prompt_shape: "source_backed",
          relevant_tool_families: ["docs_viewer"],
        },
      },
      {
        canonical_goal_frame: {
          goal_kind: "agent_provider_gateway_turn",
          requested_capability: "docs.search",
          required_terminal_kind: "model_synthesized_answer",
        },
        route_product_contract: {
          source_target: "agent_provider_gateway_turn",
          required_terminal_kind: "model_synthesized_answer",
        },
        tool_call_admission_decision: {
          selected_capability: "docs.search",
        },
      },
    );

    expect(result.canonical_goal_frame).toMatchObject({
      goal_kind: "doc_summary",
      required_terminal_kind: "doc_summary",
      source: "ask_turn_solver",
    });
    expect(result.route_product_contract).toMatchObject({
      source_target: "docs_viewer",
      required_terminal_kind: "doc_summary",
    });
    expect(result.tool_call_admission_decision).toMatchObject({
      selected_capability: "docs.search",
    });
    expect(result.provider_gateway_route_authority_projection).toMatchObject({
      canonical_goal_frame: {
        goal_kind: "agent_provider_gateway_turn",
        requested_capability: "docs.search",
      },
      authority: "execution_evidence_only",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("uses provider gateway projections only when request authority is absent", () => {
    const result = mergeCodexProviderRouteAuthorityProjection(
      {},
      {
        canonical_goal_frame: {
          goal_kind: "agent_provider_gateway_turn",
          requested_capability: "docs.search",
        },
      },
    );

    expect(result.canonical_goal_frame).toMatchObject({
      goal_kind: "agent_provider_gateway_turn",
      requested_capability: "docs.search",
    });
  });
});
