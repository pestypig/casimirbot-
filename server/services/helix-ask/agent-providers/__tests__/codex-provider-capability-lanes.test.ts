import { describe, expect, it } from "vitest";
import { codexProvider } from "../codex-provider";

describe("Codex provider capability lane adapter", () => {
  it("executes structured one-shot lane calls at the provider adapter edge", async () => {
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-lane-adapter",
        question: "",
        capability_lane_call: {
          capability: "utility_text.normalize_text",
          text: "  HELLO   WORKSTATION  ",
          normalization_mode: "lowercase",
          requested_backend_provider: "utility_text.openai_compatible",
        },
      },
    });
    const debug = result.debug as Record<string, unknown>;

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
    });
    expect(debug.capability_lane_call_results).toEqual([
      expect.objectContaining({
        schema: "helix.utility_text.normalize_result.v1",
        ok: true,
        capability: "utility_text.normalize_text",
        lane_id: "utility_text",
        normalized_text: "hello workstation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_resolve_traces).toEqual([
      expect.objectContaining({
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        execution_status: "executed_observation_only",
      }),
    ]);
    expect(debug.capability_lane_backend_selections).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.backend_selection_summary.v1",
        selected_runtime_agent_provider: "codex",
        lane_id: "utility_text",
        capability: "utility_text.normalize_text",
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
        execution_status: "executed_observation_only",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_observation_packets).toEqual([
      expect.objectContaining({
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "turn-codex-lane-adapter",
        capability_key: "utility_text.normalize_text",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_debug_events).toEqual([
      expect.objectContaining({ stage: "lane_requested" }),
      expect.objectContaining({ stage: "lane_backend_selected" }),
      expect.objectContaining({ stage: "lane_observation" }),
      expect.objectContaining({ stage: "lane_reentered" }),
    ]);
    expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
    expect(debug.current_turn_artifact_ledger).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "capability_lane_observation_packet",
          observation_kind: "utility_text.normalize_text",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]),
    );
  });
});
