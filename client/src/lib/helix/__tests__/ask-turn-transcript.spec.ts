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

  it("does not clip terminal answer transcript events in the console stream", () => {
    const longFinal = `Final answer starts.\n${"agent-output ".repeat(80)}\nFinal answer ends.`;

    const event = buildAskLiveEventFromTurnTranscriptRecord(
      {
        id: "terminal-answer-1",
        text: longFinal,
        role: "assistant",
        type: "final_answer",
        source_event_type: "terminal_answer",
        status: "completed",
        turn_id: "turn-long-final",
      },
      "fallback",
      80,
    );

    expect(event?.text).toBe(longFinal);
    expect(event?.text).toContain("Final answer ends.");
    expect(event?.text).not.toContain("...");
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

  it("projects structured Codex voice gateway receipts as non-terminal tool observations", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-voice-gateway",
      turn_id: "turn-codex-voice-gateway",
      content: "I requested the voice lane to say checking now.",
      debug: {
        turn_id: "turn-codex-voice-gateway",
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
            text: "I requested the voice lane to say checking now.",
            source_event_type: "terminal_answer",
          },
        ],
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "live_env.request_interim_voice_callout",
            mode: "act",
            gateway_admission: {
              requested_capability: "live_env.request_interim_voice_callout",
              admission_status: "admitted",
            },
            observation: {
              schema: "helix.interim_voice_callout_tool_result.v1",
              post_tool_model_step_required: true,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
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
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-voice-gateway",
              capability_key: "live_env.request_interim_voice_callout",
              status: "succeeded",
              observation_summary: "Voice callout request queued for host playback",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Runtime selected: Codex Workstation Mode.");
    expect(combined).toContain("Action request: live_env.request_interim_voice_callout.");
    expect(combined).toContain(
      "Action observation: live_env.request_interim_voice_callout observed Voice callout request queued for host playback.",
    );
    expect(combined).toContain("Model re-entry: Codex received the workstation observation packet");
    expect(combined).toContain("I requested the voice lane to say checking now.");
    expect(combined).not.toContain("no workstation observation packet was available");
    expect(rows.find((row) => row.label === "Action Observation")).toMatchObject({
      role: "tool",
      status: "completed",
    });
    expect(rows.find((row) => row.label === "Final")).toMatchObject({
      role: "assistant",
      status: "completed",
    });
  });

  it("does not promote a structured voice receipt into a final answer row", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-voice-receipt-only",
      turn_id: "turn-codex-voice-receipt-only",
      debug: {
        turn_id: "turn-codex-voice-receipt-only",
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "live_env.narrator_say",
            mode: "act",
            gateway_admission: {
              requested_capability: "live_env.narrator_say",
              admission_status: "admitted",
            },
            observation: {
              schema: "helix.interim_voice_callout_tool_result.v1",
              post_tool_model_step_required: true,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
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
              host_projection: {
                kind: "voice_playback_request",
                playback_status: "awaiting_client_playback",
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
              },
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-voice-receipt-only",
              capability_key: "live_env.narrator_say",
              status: "succeeded",
              observation_summary: "Narrator voice playback request queued",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Action request: live_env.narrator_say.");
    expect(combined).toContain("Action observation: live_env.narrator_say observed Narrator voice playback request queued.");
    expect(combined).toContain("Model re-entry: Codex received the workstation observation packet");
    expect(rows.some((row) => row.label === "Final")).toBe(false);
    expect(rows.find((row) => row.label === "Action Observation")).toMatchObject({
      role: "tool",
      status: "completed",
    });
  });

  it("projects compound docs-to-narrator itinerary status from structured gateway state", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-compound-read-aloud",
      turn_id: "turn-codex-compound-read-aloud",
      debug: {
        turn_id: "turn-codex-compound-read-aloud",
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "docs.search",
            mode: "read",
            gateway_admission: {
              requested_capability: "docs.search",
              admission_status: "admitted",
              source_target_intent: {
                compound_outcome: "read_aloud_doc_excerpt",
                subgoal_id: "read_aloud_doc_excerpt:docs_excerpt",
              },
            },
            observation: {
              schema: "helix.docs_search_observation.v1",
              compound_dependency_turn_plan: {
                schema: "helix.compound_capability_dependency_turn_plan.v1",
                turn_id: "turn-codex-compound-read-aloud",
                compound_outcomes: ["read_aloud_doc_excerpt"],
                rail_status: "satisfied",
                subgoal_count: 2,
                satisfied_subgoal_count: 2,
                ordered_subgoals: [
                  {
                    subgoal_id: "read_aloud_doc_excerpt:docs_excerpt",
                    requested_capability: "docs.search",
                    executed_capability: "docs.search",
                    satisfied: true,
                  },
                  {
                    subgoal_id: "read_aloud_doc_excerpt:narrator_receipt",
                    requested_capability: "live_env.narrator_say",
                    executed_capability: "live_env.narrator_say",
                    required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
                    satisfied: true,
                  },
                ],
              },
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-compound-read-aloud",
              capability_key: "docs.search",
              status: "succeeded",
              observation_summary: "docs.search materialized a bounded document excerpt",
            },
          },
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "live_env.narrator_say",
            mode: "act",
            gateway_admission: {
              requested_capability: "live_env.narrator_say",
              admission_status: "admitted",
              source_target_intent: {
                compound_outcome: "read_aloud_doc_excerpt",
                subgoal_id: "read_aloud_doc_excerpt:narrator_receipt",
                depends_on_subgoal_id: "read_aloud_doc_excerpt:docs_excerpt",
              },
            },
            observation: {
              schema: "helix.interim_voice_callout_tool_result.v1",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-compound-read-aloud",
              capability_key: "live_env.narrator_say",
              status: "succeeded",
              observation_summary: "Narrator voice playback request queued",
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Tool request: docs.search.");
    expect(combined).toContain("Tool observation: docs.search observed docs.search materialized a bounded document excerpt.");
    expect(combined).toContain("Action request: live_env.narrator_say.");
    expect(combined).toContain("Action observation: live_env.narrator_say observed Narrator voice playback request queued.");
    expect(combined).toContain("Itinerary: Compound itinerary: read_aloud_doc_excerpt satisfied with 2/2 subgoals satisfied.");
    expect(combined).toContain("Model re-entry: Codex received the workstation observation packet");
  });

  it("projects readable surface observation and narrator receipt trace rows", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-readable-surface",
      turn_id: "turn-codex-readable-surface",
      content: "I read the visible section aloud.",
      debug: {
        turn_id: "turn-codex-readable-surface",
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "docs-viewer.read_visible_surface",
            mode: "read",
            gateway_admission: {
              requested_capability: "docs-viewer.read_visible_surface",
              admission_status: "admitted",
              source_target_intent: {
                compound_outcome: "read_aloud_surface",
                subgoal_id: "read_aloud_surface:surface_observation",
              },
            },
            observation: {
              schema: "helix.workstation_readable_surface_observation.v1",
              status: "succeeded",
              text: "Visible section text.",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
              compound_dependency_turn_plan: {
                schema: "helix.compound_capability_dependency_turn_plan.v1",
                turn_id: "turn-codex-readable-surface",
                compound_outcomes: ["read_aloud_surface"],
                rail_status: "satisfied",
                subgoal_count: 2,
                satisfied_subgoal_count: 2,
                ordered_subgoals: [
                  {
                    subgoal_id: "read_aloud_surface:surface_observation",
                    requested_capability: "docs-viewer.read_visible_surface",
                    executed_capability: "docs-viewer.read_visible_surface",
                    required_observation_kind: "helix.workstation_readable_surface_observation.v1",
                    satisfied: true,
                  },
                  {
                    subgoal_id: "read_aloud_surface:narrator_receipt",
                    requested_capability: "live_env.narrator_say",
                    executed_capability: "live_env.narrator_say",
                    required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
                    satisfied: true,
                  },
                ],
              },
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-readable-surface",
              capability_key: "docs-viewer.read_visible_surface",
              status: "succeeded",
              observation_summary: "docs-viewer.read_visible_surface observed bounded visible document surface",
            },
          },
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "live_env.narrator_say",
            mode: "act",
            gateway_admission: {
              requested_capability: "live_env.narrator_say",
              admission_status: "admitted",
              source_target_intent: {
                compound_outcome: "read_aloud_surface",
                subgoal_id: "read_aloud_surface:narrator_receipt",
                depends_on_subgoal_id: "read_aloud_surface:surface_observation",
                depends_on_capability_id: "docs-viewer.read_visible_surface",
              },
            },
            observation: {
              schema: "helix.interim_voice_callout_tool_result.v1",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-readable-surface",
              capability_key: "live_env.narrator_say",
              status: "succeeded",
              observation_summary: "Narrator voice playback request queued",
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Tool request: docs-viewer.read_visible_surface.");
    expect(combined).toContain(
      "Tool observation: docs-viewer.read_visible_surface observed docs-viewer.read_visible_surface observed bounded visible document surface.",
    );
    expect(combined).toContain("Action request: live_env.narrator_say.");
    expect(combined).toContain("Action observation: live_env.narrator_say observed Narrator voice playback request queued.");
    expect(combined).toContain("Itinerary: Compound itinerary: read_aloud_surface satisfied with 2/2 subgoals satisfied.");
    expect(combined).toContain("Model re-entry: Codex received the workstation observation packet");
    expect(combined).not.toContain("client.read_aloud");
  });

  it("projects blocked compound downstream tools without faking action execution", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-compound-read-aloud-blocked",
      turn_id: "turn-codex-compound-read-aloud-blocked",
      debug: {
        turn_id: "turn-codex-compound-read-aloud-blocked",
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "docs.search",
            mode: "read",
            gateway_admission: {
              requested_capability: "docs.search",
              admission_status: "admitted",
              source_target_intent: {
                compound_outcome: "read_aloud_doc_excerpt",
                subgoal_id: "read_aloud_doc_excerpt:docs_excerpt",
              },
            },
            observation: {
              schema: "helix.docs_search_observation.v1",
              hit_count: 0,
              compound_dependency_turn_plan: {
                schema: "helix.compound_capability_dependency_turn_plan.v1",
                turn_id: "turn-codex-compound-read-aloud-blocked",
                compound_outcomes: ["read_aloud_doc_excerpt"],
                rail_status: "blocked",
                subgoal_count: 2,
                satisfied_subgoal_count: 1,
                first_broken_rail: {
                  subgoal_id: "read_aloud_doc_excerpt:narrator_receipt",
                  requested_capability: "live_env.narrator_say",
                  rail_status: "blocked_by_dependency",
                  reason: "upstream_docs_excerpt_missing",
                  satisfied: false,
                },
                ordered_subgoals: [
                  {
                    subgoal_id: "read_aloud_doc_excerpt:docs_excerpt",
                    requested_capability: "docs.search",
                    executed_capability: "docs.search",
                    satisfied: true,
                  },
                  {
                    subgoal_id: "read_aloud_doc_excerpt:narrator_receipt",
                    requested_capability: "live_env.narrator_say",
                    executed_capability: null,
                    satisfied: false,
                    rail_status: "blocked_by_dependency",
                  },
                ],
              },
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-compound-read-aloud-blocked",
              capability_key: "docs.search",
              status: "succeeded",
              observation_summary: "docs.search returned no document excerpt",
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(combined).toContain("Tool request: docs.search.");
    expect(combined).toContain(
      "Itinerary: Compound itinerary: read_aloud_doc_excerpt blocked at read_aloud_doc_excerpt:narrator_receipt (live_env.narrator_say): upstream_docs_excerpt_missing.",
    );
    expect(combined).not.toContain("Action request: live_env.narrator_say.");
    expect(combined).not.toContain("Action observation: live_env.narrator_say");
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
