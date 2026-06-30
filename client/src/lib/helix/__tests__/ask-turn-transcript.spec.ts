import { describe, expect, it } from "vitest";

import {
  buildAskLiveEventFromTurnTranscriptRecord,
  buildHelixRuntimeAskLiveEvents,
  buildHelixTurnTranscriptRows,
  buildHelixWorkstationGatewayTranscriptEvents,
} from "@/lib/helix/ask-turn-transcript";

describe("Helix Ask turn transcript projection", () => {
  it("projects individual turn transcript records into live-event entries", () => {
    expect(
      buildAskLiveEventFromTurnTranscriptRecord(
        {
          id: "transcript-1",
          text: `Working ${"x".repeat(24)}`,
          role: "tool",
          type: "tool_result",
          source_event_type: "tool_observation",
          status: "completed",
          detail: "calculator",
          step_id: "step-1",
          lane: "scientific-calculator.solve_expression",
          turn_id: "turn-1",
          at_ms: Date.UTC(2026, 0, 2, 3, 4, 5, 678),
          seq: 4.8,
          durationMs: 12.6,
          reconstructed: true,
        },
        "fallback",
        18,
      ),
    ).toEqual({
      id: "transcript-1",
      text: "Working xxxxxxxxx...",
      tool: "tool",
      ts: "2026-01-02T03:04:05.678Z",
      tsMs: Date.UTC(2026, 0, 2, 3, 4, 5, 678),
      seq: 4,
      durationMs: 13,
      meta: {
        stage: "tool_result",
        detail: "calculator",
        status: "completed",
        stepId: "step-1",
        lane: "scientific-calculator.solve_expression",
        source_event_type: "tool_observation",
        event_source: "live",
        turn_id: "turn-1",
        reconstructed: true,
        stream_event: "turn_transcript_event",
      },
    });

    expect(
      buildAskLiveEventFromTurnTranscriptRecord(
        {
          text: "  ",
          ts: "2026-01-02T03:04:05.000Z",
        },
        "empty",
      ),
    ).toBeNull();
  });

  it("projects runtime transcript events into Ask live-event rows", () => {
    const events = buildHelixRuntimeAskLiveEvents({
      id: "reply-1",
      turn_id: "turn-1",
      debug: {
        agent_runtime_loop: {
          iterations: [
            {
              next_step: "tool",
              chosen_capability: "docs.search",
              decision_authority: "runtime",
              decision_id: "decision-1",
              observed_artifact_refs: ["doc_search_results:abc123"],
            },
          ],
        },
      },
    });

    expect(events).toEqual([
      expect.objectContaining({
        id: "reply-1-runtime-0-decision",
        text: "Selected docs.search.",
        tool: "agent",
        seq: 0,
        meta: expect.objectContaining({
          stage: "decision",
          detail: "docs.search",
          status: "completed",
          turnKey: "turn-1",
          stepId: "runtime_1",
          lane: "runtime",
          event_source: "agent_runtime_loop",
        }),
      }),
      expect.objectContaining({
        id: "reply-1-runtime-0-observation",
        text: "Observed doc_search_results.",
        tool: "tool",
        seq: 1,
        meta: expect.objectContaining({
          stage: "tool_result",
          detail: "docs.search",
          status: "completed",
          turnKey: "turn-1",
          stepId: "runtime_1",
          lane: "docs.search",
          event_source: "agent_runtime_loop",
        }),
      }),
    ]);
  });

  it("projects structured Codex workstation gateway calls without final-prose scraping", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-structured-gateway",
      turn_id: "turn-codex-structured-gateway",
      content: "Observed expression: 8*9\nResult: 72",
      debug: {
        turn_id: "turn-codex-structured-gateway",
        agent_runtime: "codex",
        turn_transcript_events: [
          {
            role: "system",
            type: "plan",
            status: "completed",
            text: "Runtime selected: Codex Workstation Mode.",
            source_event_type: "runtime_selected",
          },
          {
            role: "agent",
            type: "model_decision",
            status: "completed",
            text: "Model re-entry: no workstation observation packet was available for this Codex turn.",
            source_event_type: "model_reentry",
          },
          {
            role: "assistant",
            type: "final_answer",
            status: "completed",
            text: "Observed expression: 8*9\nResult: 72",
            source_event_type: "terminal_answer",
          },
        ],
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            gateway_admission: {
              requested_capability: "scientific-calculator.solve_expression",
              admission_status: "admitted",
            },
            observation: {
              expression: "8*9",
              result: "72",
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-structured-gateway",
              capability_key: "scientific-calculator.solve_expression",
              status: "succeeded",
              observation_summary: "8*9 = 72",
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text}`).join("\n");
    expect(combined).toContain("Runtime selected: Codex Workstation Mode.");
    expect(combined).toContain("Tool request: scientific-calculator.solve_expression.");
    expect(combined).toContain("Tool observation: scientific-calculator.solve_expression observed 8*9 = 72.");
    expect(combined).toContain("Model re-entry: Codex received the workstation observation packet");
    expect(combined).toContain("Observed expression: 8*9\nResult: 72");
    expect(combined).not.toContain("no workstation observation packet was available");
  });

  it("does not create gateway observations from final prose alone", () => {
    const events = buildHelixWorkstationGatewayTranscriptEvents({
      id: "reply-prose-only",
      content: "Observed expression: 8*9\nResult: 72",
      debug: {
        turn_id: "turn-prose-only",
        agent_runtime: "codex",
      },
    });

    expect(events).toEqual([]);
  });

  it("keeps no-observation gateway turns as failed observations without model re-entry success", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-no-observation",
      debug: {
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            ok: false,
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            error: "calculator_gateway_solve_observation_missing",
            gateway_admission: {
              requested_capability: "scientific-calculator.solve_expression",
              admission_status: "blocked",
              blocked_reason: "calculator_gateway_solve_observation_missing",
            },
            observation_packet: {
              capability_key: "scientific-calculator.solve_expression",
              status: "blocked",
              observation_summary: "calculator_gateway_solve_observation_missing",
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Tool request: scientific-calculator.solve_expression.");
    expect(combined).toContain("Tool observation: scientific-calculator.solve_expression blocked calculator_gateway_solve_observation_missing.");
    expect(combined).toContain("failed");
    expect(combined).not.toContain("Codex received the workstation observation packet");
  });
});
