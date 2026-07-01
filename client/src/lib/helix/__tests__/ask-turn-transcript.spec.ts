import { describe, expect, it } from "vitest";

import {
  buildAskLiveEventFromTurnTranscriptRecord,
  buildHelixRuntimeAskLiveEvents,
  buildHelixTurnTranscriptRows,
  buildHelixWorkstationGatewayTranscriptEvents,
} from "@/lib/helix/ask-turn-transcript";
import { buildHelixAskRuntimeTurnSummary } from "@/lib/helix/ask-runtime-turn-summary";

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

  it("projects capability lane requests, backend selection, observations, re-entry, and terminal authority", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-lane-translation",
      turn_id: "turn-codex-lane-translation",
      content: "The translation observation is available.",
      debug: {
        turn_id: "turn-codex-lane-translation",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        turn_transcript_events: [
          {
            role: "system",
            type: "plan",
            status: "completed",
            text: "Runtime selected: Codex Workstation Mode.",
            source_event_type: "runtime_selected",
          },
          {
            role: "assistant",
            type: "final_answer",
            status: "completed",
            text: "The translation observation is available.",
            source_event_type: "terminal_answer",
          },
        ],
        capability_lane_reentry_status: "observation_packet_required_for_provider_reentry",
        capability_lane_resolve_traces: [
          {
            schema: "helix.capability_lane_resolve_trace.v1",
            requested_lane: "live_translation",
            requested_backend_provider: "google_gemini",
            selected_backend_provider: "live_translation.local_runtime",
            requested_backend_configuration_status: "configured",
            requested_backend_availability_status: "dry_run",
            requested_backend_permission_status: "admitted",
            selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              owner: "helix",
              outcome: "requested_recorded_default_selected",
              reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
              requested_backend_provider: "google_gemini",
              requested_backend_provider_known: true,
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              selected_runtime_provider_remains_root: true,
              backend_provider_becomes_root_agent: false,
              dynamic_switching_executed: false,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            availability_status: "available",
            permission_status: "available",
          },
        ],
        capability_lane_call_results: [
          {
            schema: "helix.live_translation.one_shot_result.v1",
            ok: true,
            capability: "live_translation.translate_text",
            lane_id: "live_translation",
            observation: {
              lane_session_id: "lane-session-translation",
              observation_ref: "ask:lane:translation:obs",
              source_id: "docs:nhm2",
              chunk_id: "chunk-1",
              projection_target: "docs_chunk",
            },
            lane_resolve_trace: {
              requested_lane: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              requested_backend_configuration_status: "configured",
              requested_backend_availability_status: "dry_run",
              requested_backend_permission_status: "admitted",
              selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
              backend_selection_decision: {
                schema: "helix.capability_lane.backend_selection_decision.v1",
                owner: "helix",
                outcome: "requested_recorded_default_selected",
                reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
                requested_backend_provider: "google_gemini",
                requested_backend_provider_known: true,
                selected_backend_provider: "live_translation.local_runtime",
                fallback_backend_provider: "live_translation.local_runtime",
                selected_runtime_provider_remains_root: true,
                backend_provider_becomes_root_agent: false,
                dynamic_switching_executed: false,
                live_backend_execution_enabled: false,
                terminal_authority_owner: "helix",
                terminal_eligible: false,
                assistant_answer: false,
                raw_content_included: false,
              },
              availability_status: "available",
              permission_status: "available",
            },
            observation_ref: "ask:lane:translation:obs",
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-lane-translation",
              capability_key: "live_translation.translate_text",
              lane_id: "live_translation",
              status: "succeeded",
              observation_summary: "Translation observation ready for en -> es",
              observation_ref: "ask:lane:translation:obs",
              state_delta: {
                live_translation_chunk: {
                  lane_session_id: "lane-session-translation",
                  source_id: "docs:nhm2",
                  chunk_id: "chunk-1",
                  chunk_index: 1,
                  dedupe_key: "docs:nhm2:chunk-1:es",
                  source_event_ms: null,
                  observed_at_ms: 1782860000000,
                  freshness_status: "fresh",
                  projection_target: "docs_chunk",
                  cancel_requested: false,
                  observation_ref: "ask:lane:translation:obs",
                  terminal_eligible: false,
                  assistant_answer: false,
                  raw_content_included: false,
                },
              },
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Runtime selected: Codex Workstation Mode.");
    expect(combined).toContain("Lane Request: Lane requested: live_translation.translate_text.");
    expect(combined).toContain("Lane Backend: Lane backend selected: selected live_translation.local_runtime");
    expect(combined).toContain("requested google_gemini");
    expect(combined).toContain("requested configuration configured");
    expect(combined).toContain("requested availability dry_run");
    expect(combined).toContain("requested permission admitted");
    expect(combined).toContain("reason requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy");
    expect(combined).toContain("decision requested_recorded_default_selected");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain(
      "Lane Observation: Lane observation: live_translation.translate_text session lane-session-translation produced Translation observation ready for en -> es.",
    );
    expect(combined).toContain("Lane Re-entry: Lane re-entry: observation packet available for provider reasoning before terminal selection.");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: The translation observation is available.");
    expect(combined).not.toContain("source text");
  });

  it("summarizes session-bound live translation chunks in the runtime turn summary", () => {
    const summary = buildHelixAskRuntimeTurnSummary({
      id: "reply-codex-lane-summary-session",
      turn_id: "turn-codex-lane-summary-session",
      debug: {
        turn_id: "turn-codex-lane-summary-session",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_resolve_trace: {
          requested_lane: "live_translation",
          requested_backend_provider: "google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          requested_backend_configuration_status: "configured",
          requested_backend_availability_status: "dry_run",
          requested_backend_permission_status: "admitted",
          selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
          backend_selection_decision: {
            schema: "helix.capability_lane.backend_selection_decision.v1",
            owner: "helix",
            outcome: "requested_recorded_default_selected",
            reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
            requested_backend_provider: "google_gemini",
            requested_backend_provider_known: true,
            selected_backend_provider: "live_translation.local_runtime",
            fallback_backend_provider: "live_translation.local_runtime",
            selected_runtime_provider_remains_root: true,
            backend_provider_becomes_root_agent: false,
            dynamic_switching_executed: false,
            live_backend_execution_enabled: false,
            terminal_authority_owner: "helix",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          availability_status: "dry_run",
          permission_status: "admitted",
        },
        capability_lane_call_results: [
          {
            schema: "helix.live_translation.one_shot_result.v1",
            ok: true,
            capability: "live_translation.translate_text",
            lane_id: "live_translation",
            translated_text: "hola",
            lane_resolve_trace: {
              requested_lane: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              requested_backend_configuration_status: "configured",
              requested_backend_availability_status: "dry_run",
              requested_backend_permission_status: "admitted",
              selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
              backend_selection_decision: {
                schema: "helix.capability_lane.backend_selection_decision.v1",
                owner: "helix",
                outcome: "requested_recorded_default_selected",
                reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
                requested_backend_provider: "google_gemini",
                requested_backend_provider_known: true,
                selected_backend_provider: "live_translation.local_runtime",
                fallback_backend_provider: "live_translation.local_runtime",
                selected_runtime_provider_remains_root: true,
                backend_provider_becomes_root_agent: false,
                dynamic_switching_executed: false,
                live_backend_execution_enabled: false,
                terminal_authority_owner: "helix",
                terminal_eligible: false,
                assistant_answer: false,
                raw_content_included: false,
              },
              availability_status: "dry_run",
              permission_status: "admitted",
            },
            observation: {
              lane_session_id: "lane-session-summary",
              observation_ref: "ask:lane:translation:summary-obs",
              source_id: "docs:nhm2",
              chunk_id: "chunk-9",
              target_language: "es",
              freshness_status: "fresh",
              projection_target: "docs_chunk",
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-lane-summary-session",
              capability_key: "live_translation.translate_text",
              status: "succeeded",
              state_delta: {
                live_translation_chunk: {
                  lane_session_id: "lane-session-summary",
                  source_id: "docs:nhm2",
                  chunk_id: "chunk-9",
                  chunk_index: 9,
                  dedupe_key: "docs:nhm2:chunk-9:es",
                  source_event_ms: null,
                  observed_at_ms: 1782860000000,
                  freshness_status: "fresh",
                  projection_target: "docs_chunk",
                  cancel_requested: false,
                  observation_ref: "ask:lane:translation:summary-obs",
                  terminal_eligible: false,
                  assistant_answer: false,
                  raw_content_included: false,
                },
              },
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    const projection = summary?.rows.find((row) => row.key === "lane_projection")?.value ?? "";
    expect(projection).toContain("live_translation");
    expect(projection).toContain("session lane-session-summary");
    expect(projection).toContain("source docs:nhm2");
    expect(projection).toContain("chunk chunk-9");
    expect(projection).toContain("ref ask:lane:translation:summary-obs");
    const backend = summary?.rows.find((row) => row.key === "lane_backend")?.value ?? "";
    expect(backend).toContain("lane live_translation");
    expect(backend).toContain("backend live_translation.local_runtime");
    expect(backend).toContain("requested configuration configured");
    expect(backend).toContain("requested availability dry_run");
    expect(backend).toContain("requested permission admitted");
    expect(backend).toContain("decision requested_recorded_default_selected");
    expect(backend).toContain("runtime root preserved");
    expect(backend).toContain("no live backend execution");
    expect(backend).toContain("terminal authority helix");
  });

  it("summarizes goal dispatch readiness in the runtime turn summary without executing side effects", () => {
    const summary = buildHelixAskRuntimeTurnSummary({
      id: "reply-codex-goal-readiness-summary",
      turn_id: "turn-codex-goal-readiness-summary",
      debug: {
        turn_id: "turn-codex-goal-readiness-summary",
        agent_runtime: "codex",
        capability_lane_goal_dispatch_readiness: {
          schema: "helix.capability_lane.goal_dispatch_readiness.v1",
          total_plans: 2,
          total_admissions: 2,
          admitted_count: 1,
          blocked_count: 1,
          pending_wake_count: 1,
          pending_terminal_authority_count: 0,
          projection_only_count: 0,
          manual_review_count: 0,
          debug_only_count: 0,
          blocked_reasons: ["missing_mail_loop_ref"],
          next_dispatch_targets: ["ask_wake"],
          next_goal_binding_ids: ["goal-binding-ready"],
          side_effects_allowed: false,
          side_effects_executed: false,
          wake_dispatch_allowed: false,
          badge_projection_allowed: false,
          terminal_report_allowed: false,
          terminal_report_emitted: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    });

    const readiness = summary?.rows.find((row) => row.key === "goal_dispatch_readiness");
    expect(readiness).toMatchObject({
      label: "Goal dispatch readiness",
      value: expect.stringContaining("plans 2"),
    });
    expect(readiness?.value).toContain("admissions 2");
    expect(readiness?.value).toContain("admitted 1");
    expect(readiness?.value).toContain("blocked 1");
    expect(readiness?.value).toContain("pending wake 1");
    expect(readiness?.value).toContain("targets ask_wake");
    expect(readiness?.value).toContain("goal bindings goal-binding-ready");
    expect(readiness?.value).toContain("blocked missing_mail_loop_ref");
    expect(readiness?.value).toContain("no side effects");
    expect(readiness?.value).toContain("observation-only");
  });

  it("projects utility and workstation reference lane observations without granting terminal authority", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-generalized-lanes",
      turn_id: "turn-codex-generalized-lanes",
      content: "The lane observations are ready.",
      debug: {
        turn_id: "turn-codex-generalized-lanes",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_reentry_status: "observation_packet_required_for_provider_reentry",
        capability_lane_call_results: [
          {
            schema: "helix.utility_text.normalize_result.v1",
            ok: true,
            capability: "utility_text.normalize_text",
            lane_id: "utility_text",
            lane_resolve_trace: {
              requested_lane: "utility_text",
              requested_backend_provider: "utility_text.openai_compatible",
              selected_backend_provider: "utility_text.local_runtime",
              selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
              availability_status: "dry_run",
              permission_status: "admitted",
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-generalized-lanes",
              capability_key: "utility_text.normalize_text",
              lane_id: "utility_text",
              status: "succeeded",
              observation_summary: "Utility text normalization ready: lowercase.",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
          {
            schema: "helix.workstation_tool_reference.list_result.v1",
            ok: true,
            capability: "workstation_tool_reference.list_capabilities",
            lane_id: "workstation_tool_reference",
            lane_resolve_trace: {
              requested_lane: "workstation_tool_reference",
              selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
              selection_reason: "selected_default_backend_provider_for_shadow_manifest",
              availability_status: "available",
              permission_status: "admitted",
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-generalized-lanes",
              capability_key: "workstation_tool_reference.list_capabilities",
              lane_id: "workstation_tool_reference",
              status: "succeeded",
              observation_summary: "Workstation gateway catalog ready: 42 capabilities.",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Lane Request: Lane requested: utility_text.normalize_text.");
    expect(combined).toContain("Lane Backend: Lane backend selected: selected utility_text.local_runtime");
    expect(combined).toContain("requested utility_text.openai_compatible");
    expect(combined).toContain(
      "Lane Observation: Lane observation: utility_text.normalize_text produced Utility text normalization ready: lowercase.",
    );
    expect(combined).toContain("Lane Request: Lane requested: workstation_tool_reference.list_capabilities.");
    expect(combined).toContain(
      "Lane Backend: Lane backend selected: selected workstation_tool_reference.helix_workstation_gateway",
    );
    expect(combined).toContain(
      "Lane Observation: Lane observation: workstation_tool_reference.list_capabilities produced Workstation gateway catalog ready: 42 capabilities.",
    );
    expect(combined).toContain("Lane Re-entry: Lane re-entry: observation packet available for provider reasoning before terminal selection.");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: The lane observations are ready.");
    expect(combined).not.toContain("source text");
  });

  it("projects lane lifecycle rows from capability_lane_debug_events without call results", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-lane-debug-events-only",
      turn_id: "turn-codex-lane-debug-events-only",
      content: "The debug event trail is visible.",
      debug: {
        turn_id: "turn-codex-lane-debug-events-only",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_debug_events: [
          {
            schema: "helix.capability_lane.debug_event.v1",
            event_id: "debug-lane-0-requested",
            seq: 0,
            stage: "lane_requested",
            selected_runtime_agent_provider: "codex",
            lane_id: "utility_text",
            capability: "utility_text.normalize_text",
            status: "completed",
            requested_backend_provider: "utility_text.openai_compatible",
            requested_backend_provider_known: true,
            requested_backend_configuration_status: "missing",
            requested_backend_availability_status: "unconfigured",
            requested_backend_permission_status: "configuration_missing",
            requested_backend_fallback_provider: "utility_text.local_runtime",
            selected_backend_provider: "utility_text.local_runtime",
            selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              owner: "helix",
              outcome: "fallback_selected",
              reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
              requested_backend_provider: "utility_text.openai_compatible",
              requested_backend_provider_known: true,
              selected_backend_provider: "utility_text.local_runtime",
              fallback_backend_provider: "utility_text.local_runtime",
              selected_runtime_provider_remains_root: true,
              backend_provider_becomes_root_agent: false,
              dynamic_switching_executed: false,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            availability_status: "dry_run",
            permission_status: "admitted",
            execution_status: "executed_observation_only",
            observation_ref: "ask:lane:utility:obs",
            result_ref: "ask:lane:utility:obs",
            receipt_ref: null,
            reentry_required: true,
            reentry_status: "not_applicable",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          {
            schema: "helix.capability_lane.debug_event.v1",
            event_id: "debug-lane-0-backend",
            seq: 1,
            stage: "lane_backend_selected",
            selected_runtime_agent_provider: "codex",
            lane_id: "utility_text",
            capability: "utility_text.normalize_text",
            status: "completed",
            requested_backend_provider: "utility_text.openai_compatible",
            requested_backend_provider_known: true,
            requested_backend_configuration_status: "missing",
            requested_backend_availability_status: "unconfigured",
            requested_backend_permission_status: "configuration_missing",
            requested_backend_fallback_provider: "utility_text.local_runtime",
            selected_backend_provider: "utility_text.local_runtime",
            selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              owner: "helix",
              outcome: "fallback_selected",
              reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
              requested_backend_provider: "utility_text.openai_compatible",
              requested_backend_provider_known: true,
              selected_backend_provider: "utility_text.local_runtime",
              fallback_backend_provider: "utility_text.local_runtime",
              selected_runtime_provider_remains_root: true,
              backend_provider_becomes_root_agent: false,
              dynamic_switching_executed: false,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            availability_status: "dry_run",
            permission_status: "admitted",
            execution_status: "executed_observation_only",
            observation_ref: "ask:lane:utility:obs",
            result_ref: "ask:lane:utility:obs",
            receipt_ref: null,
            reentry_required: true,
            reentry_status: "not_applicable",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          {
            schema: "helix.capability_lane.debug_event.v1",
            event_id: "debug-lane-0-observation",
            seq: 2,
            stage: "lane_observation",
            selected_runtime_agent_provider: "codex",
            lane_id: "utility_text",
            capability: "utility_text.normalize_text",
            status: "completed",
            requested_backend_provider: "utility_text.openai_compatible",
            selected_backend_provider: "utility_text.local_runtime",
            selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
            availability_status: "dry_run",
            permission_status: "admitted",
            execution_status: "executed_observation_only",
            observation_ref: "ask:lane:utility:obs",
            result_ref: "ask:lane:utility:obs",
            receipt_ref: null,
            reentry_required: true,
            reentry_status: "observation_packet_required_for_provider_reentry",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          {
            schema: "helix.capability_lane.debug_event.v1",
            event_id: "debug-lane-reentry",
            seq: 3,
            stage: "lane_reentered",
            selected_runtime_agent_provider: "codex",
            lane_id: "capability_lane",
            capability: "capability_lane.reentry",
            status: "pending",
            requested_backend_provider: null,
            selected_backend_provider: null,
            selection_reason: null,
            availability_status: null,
            permission_status: null,
            execution_status: "executed_observation_only",
            observation_ref: null,
            result_ref: null,
            receipt_ref: null,
            reentry_required: true,
            reentry_status: "observation_packet_required_for_provider_reentry",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Lane Request: Lane requested: utility_text.normalize_text.");
    expect(combined).toContain("Lane Backend: Lane backend selected: selected utility_text.local_runtime");
    expect(combined).toContain("requested utility_text.openai_compatible");
    expect(combined).toContain("requested configuration missing");
    expect(combined).toContain("requested availability unconfigured");
    expect(combined).toContain("requested permission configuration_missing");
    expect(combined).toContain("reason requested_backend_unconfigured_default_backend_selected_by_helix_policy");
    expect(combined).toContain("decision fallback_selected");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain("Lane Observation: Lane observation: utility_text.normalize_text produced ask:lane:utility:obs.");
    expect(combined).toContain("Lane Re-entry: Lane re-entry: observation packet available for provider reasoning before terminal selection.");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: The debug event trail is visible.");
    expect(combined).not.toContain("source text");
  });

  it("projects compact lane backend selection summaries without inventing observations", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-lane-backend-summary-only",
      turn_id: "turn-codex-lane-backend-summary-only",
      content: "Backend selection is visible.",
      debug: {
        turn_id: "turn-codex-lane-backend-summary-only",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_backend_selections: [
          {
            schema: "helix.capability_lane.backend_selection_summary.v1",
            selected_runtime_agent_provider: "codex",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            requested_lane: "live_translation",
            requested_backend_provider: "google_gemini",
            selected_backend_provider: "live_translation.local_runtime",
            selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              owner: "helix",
              outcome: "requested_recorded_default_selected",
              reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
              requested_backend_provider: "google_gemini",
              requested_backend_provider_known: true,
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              selected_runtime_provider_remains_root: true,
              backend_provider_becomes_root_agent: false,
              dynamic_switching_executed: false,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            availability_status: "dry_run",
            permission_status: "admitted",
            execution_status: "executed_observation_only",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Lane Request: Lane requested: live_translation.translate_text.");
    expect(combined).toContain("Lane Backend: Lane backend selected: selected live_translation.local_runtime");
    expect(combined).toContain("requested google_gemini");
    expect(combined).toContain("reason requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy");
    expect(combined).toContain("decision requested_recorded_default_selected");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: Backend selection is visible.");
    expect(combined).not.toContain("Lane Observation:");
  });

  it("projects goal-bound lane session summaries without treating lane output as the final answer", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-lane-goal-binding",
      turn_id: "turn-codex-lane-goal-binding",
      content: "The goal-bound lane session is being watched.",
      debug: {
        turn_id: "turn-codex-lane-goal-binding",
        agent_runtime: "codex",
        capability_lane_goal_binding_debug_summaries: [
          {
            schema: "helix.capability_lane.goal_binding_debug_summary.v1",
            goal_binding_id: "goal-binding-translate-docs",
            goal_id: "goal:translate-docs",
            lane_session_id: "lane-session-translate-docs",
            lane_id: "live_translation",
            selected_runtime_agent_provider: "codex",
            selected_backend_provider: "live_translation.local_runtime",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              lane_id: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              outcome: "fallback_to_available_provider",
              reason: "requested_backend_unconfigured",
              selected_runtime_provider_remains_root: true,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
            },
            session_status: "running",
            session_health: "healthy",
            source_id: "docs:nhm2",
            last_observation_ref: "ask:lane:translation:goal-obs",
            latest_mail_loop_summary: {
              schema: "helix.capability_lane.mail_loop_debug_summary.v1",
              lane_session_id: "lane-session-translate-docs",
              lane_id: "live_translation",
              capability: "live_translation.translate_text",
              observation_ref: "ask:lane:translation:goal-obs",
              stage_play_mail_id: "stage-play-mail-goal",
              stage_play_wake_expected: true,
              mailbox_thread_id: "ask-thread-goal",
              terminal_authority_status: "pending_helix_terminal_authority",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            mail_loop_refs: ["stage-play-mail-goal"],
            report_decision: {
              schema: "helix.capability_lane.goal_report_decision.v1",
              action: "wake_on_salience",
              reason: "goal_binding_policy_requests_wake_on_salience",
              wake_expected: true,
              surface_badge_expected: false,
              terminal_report_requested: false,
              terminal_report_authorized: false,
              terminal_report_requires_authority: true,
              terminal_authority_status: "pending_helix_terminal_authority",
              evidence_ref: "ask:lane:translation:goal-obs",
              mail_loop_ref: "stage-play-mail-goal",
              reentry_required: true,
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            dispatch_plan: {
              schema: "helix.capability_lane.goal_dispatch_plan.v1",
              target: "ask_wake",
              status: "planned_not_dispatched",
              reason: "goal_binding_policy_plans_ask_wake",
              source_report_action: "wake_on_salience",
              goal_binding_id: "goal-binding-translate-docs",
              goal_id: "goal:translate-docs",
              lane_session_id: "lane-session-translate-docs",
              lane_id: "live_translation",
              evidence_ref: "ask:lane:translation:goal-obs",
              mail_loop_ref: "stage-play-mail-goal",
              requires_live_mail_loop: true,
              requires_terminal_authority: false,
              side_effects_executed: false,
              wake_dispatched: false,
              badge_projected: false,
              terminal_report_emitted: false,
              terminal_authority_status: "pending_helix_terminal_authority",
              reentry_required: true,
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            dispatch_admission: {
              schema: "helix.capability_lane.goal_dispatch_admission.v1",
              status: "eligible_waiting_for_mail_loop",
              reason: "goal_dispatch_admission_eligible_waiting_for_mail_loop",
              target: "ask_wake",
              goal_binding_id: "goal-binding-translate-docs",
              goal_id: "goal:translate-docs",
              lane_session_id: "lane-session-translate-docs",
              lane_id: "live_translation",
              evidence_ref: "ask:lane:translation:goal-obs",
              mail_loop_ref: "stage-play-mail-goal",
              blocked_reason: null,
              requires_live_mail_loop: true,
              requires_terminal_authority: false,
              side_effects_allowed: false,
              side_effects_executed: false,
              wake_dispatch_allowed: false,
              badge_projection_allowed: false,
              terminal_report_allowed: false,
              terminal_authority_status: "pending_helix_terminal_authority",
              reentry_required: true,
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            binding_status: "bound",
            report_policy: "terminal_authorized_summary",
            quiet_behavior: "wake_on_salience",
            backend_provider_becomes_root_agent: false,
            final_reports_require_terminal_authority: true,
            terminal_authority_status: "pending_helix_terminal_authority",
            reentry_required: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_goal_dispatch_readiness: {
          schema: "helix.capability_lane.goal_dispatch_readiness.v1",
          total_plans: 1,
          total_admissions: 1,
          admitted_count: 1,
          blocked_count: 0,
          pending_wake_count: 1,
          pending_terminal_authority_count: 0,
          projection_only_count: 0,
          manual_review_count: 0,
          debug_only_count: 0,
          blocked_reasons: [],
          next_dispatch_targets: ["ask_wake"],
          next_goal_binding_ids: ["goal-binding-translate-docs"],
          side_effects_allowed: false,
          side_effects_executed: false,
          wake_dispatch_allowed: false,
          badge_projection_allowed: false,
          terminal_report_allowed: false,
          terminal_report_emitted: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Goal Lane: Goal-bound lane session: live_translation;");
    expect(combined).toContain("goal goal:translate-docs");
    expect(combined).toContain("session lane-session-translate-docs");
    expect(combined).toContain("backend live_translation.local_runtime");
    expect(combined).toContain("decision fallback_to_available_provider");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain("last observation ask:lane:translation:goal-obs");
    expect(combined).toContain("latest mail stage-play-mail-goal");
    expect(combined).toContain("report action wake_on_salience");
    expect(combined).toContain("report reason goal_binding_policy_requests_wake_on_salience");
    expect(combined).toContain("dispatch target ask_wake");
    expect(combined).toContain("dispatch planned_not_dispatched");
    expect(combined).toContain("Goal Admission: Goal dispatch admission: live_translation;");
    expect(combined).toContain("status eligible_waiting_for_mail_loop");
    expect(combined).toContain("side effects not allowed");
    expect(combined).toContain("Goal Readiness: Goal dispatch readiness:");
    expect(combined).toContain("plans 1");
    expect(combined).toContain("admitted 1");
    expect(combined).toContain("pending wake 1");
    expect(combined).toContain("next targets ask_wake");
    expect(combined).toContain("next goal bindings goal-binding-translate-docs");
    expect(combined).toContain("no side effects allowed");
    expect(combined).toContain("terminal authority pending_helix_terminal_authority");
    expect(combined).toContain("lane output remains observation-only");
    expect(combined).toContain("Final: The goal-bound lane session is being watched.");
    expect(rows.find((row) => row.label === "Goal Lane")).toMatchObject({
      role: "system",
      status: "pending",
    });
    expect(rows.find((row) => row.label === "Goal Dispatch")).toMatchObject({
      role: "system",
      status: "pending",
      text: expect.stringContaining("Goal dispatch plan: live_translation; target ask_wake"),
    });
    expect(rows.find((row) => row.label === "Goal Admission")).toMatchObject({
      role: "system",
      status: "pending",
      text: expect.stringContaining("Goal dispatch admission: live_translation; target ask_wake"),
    });
    expect(rows.find((row) => row.label === "Goal Readiness")).toMatchObject({
      role: "system",
      status: "pending",
      text: expect.stringContaining("Goal dispatch readiness: plans 1"),
    });
    expect(rows.filter((row) => row.label === "Final")).toHaveLength(1);
  });

  it("projects direct goal dispatch plans without requiring a full goal-binding summary", () => {
    const rows = buildHelixTurnTranscriptRows({
      id: "reply-codex-lane-goal-dispatch",
      turn_id: "turn-codex-lane-goal-dispatch",
      content: "The goal dispatch plan is visible.",
      debug: {
        turn_id: "turn-codex-lane-goal-dispatch",
        agent_runtime: "codex",
        capability_lane_goal_dispatch_plans: [
          {
            schema: "helix.capability_lane.goal_dispatch_plan.v1",
            target: "terminal_authority_review",
            status: "planned_not_dispatched",
            reason: "goal_binding_policy_plans_terminal_authority_review",
            source_report_action: "request_terminal_authority",
            goal_binding_id: "goal-binding-review",
            goal_id: "goal:review-lane",
            lane_session_id: "lane-session-review",
            lane_id: "live_translation",
            evidence_ref: "ask:lane:translation:review-obs",
            mail_loop_ref: null,
            requires_live_mail_loop: false,
            requires_terminal_authority: true,
            side_effects_executed: false,
            wake_dispatched: false,
            badge_projected: false,
            terminal_report_emitted: false,
            terminal_authority_status: "pending_helix_terminal_authority",
            reentry_required: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_goal_dispatch_admissions: [
          {
            schema: "helix.capability_lane.goal_dispatch_admission.v1",
            status: "blocked",
            reason: "goal_dispatch_admission_blocked:terminal_authority_not_pending",
            target: "terminal_authority_review",
            goal_binding_id: "goal-binding-review",
            goal_id: "goal:review-lane",
            lane_session_id: "lane-session-review",
            lane_id: "live_translation",
            evidence_ref: "ask:lane:translation:review-obs",
            mail_loop_ref: null,
            blocked_reason: "terminal_authority_not_pending",
            requires_live_mail_loop: false,
            requires_terminal_authority: true,
            side_effects_allowed: false,
            side_effects_executed: false,
            wake_dispatch_allowed: false,
            badge_projection_allowed: false,
            terminal_report_allowed: false,
            terminal_authority_status: "not_terminal_authority",
            reentry_required: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
      },
    });

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Goal Dispatch: Goal dispatch plan: live_translation;");
    expect(combined).toContain("target terminal_authority_review");
    expect(combined).toContain("status planned_not_dispatched");
    expect(combined).toContain("no side effects executed");
    expect(combined).toContain("Goal Admission: Goal dispatch admission: live_translation;");
    expect(combined).toContain("blocked terminal_authority_not_pending");
    expect(combined).toContain("side effects not allowed");
    expect(combined).toContain("lane output remains observation-only");
    expect(rows.find((row) => row.label === "Goal Dispatch")).toMatchObject({
      role: "system",
      status: "pending",
    });
    expect(rows.find((row) => row.label === "Goal Admission")).toMatchObject({
      role: "system",
      status: "failed",
    });
    expect(rows.filter((row) => row.label === "Goal Lane")).toHaveLength(0);
    expect(rows.filter((row) => row.label === "Final")).toHaveLength(1);
  });

  it("projects standalone lane session summaries before goal binding exists", () => {
    const reply = {
      id: "reply-codex-lane-session",
      turn_id: "turn-codex-lane-session",
      content: "The lane session is visible.",
      debug: {
        turn_id: "turn-codex-lane-session",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_session_debug_summaries: [
          {
            schema: "helix.capability_lane.session_debug_summary.v1",
            lane_session_id: "lane-session-standalone",
            lane_id: "live_translation",
            selected_runtime_agent_provider: "codex",
            selected_backend_provider: "live_translation.local_runtime",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              lane_id: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              outcome: "fallback_to_available_provider",
              reason: "requested_backend_unconfigured",
              selected_runtime_provider_remains_root: true,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
            },
            session_status: "running",
            session_health: "healthy",
            source_id: "docs:nhm2",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            last_observation_ref: "ask:lane:translation:session-obs",
            session_event_count: 2,
            terminal_authority_status: "pending_helix_terminal_authority",
            reentry_required: true,
            backend_provider_becomes_root_agent: false,
            final_reports_require_terminal_authority: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
      },
    };
    const rows = buildHelixTurnTranscriptRows(reply);
    const summary = buildHelixAskRuntimeTurnSummary(reply);

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Lane Session: Lane session: live_translation;");
    expect(combined).toContain("session lane-session-standalone");
    expect(combined).toContain("backend live_translation.local_runtime");
    expect(combined).toContain("decision fallback_to_available_provider");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain("source docs:nhm2");
    expect(combined).toContain("projection docs_chunk");
    expect(combined).toContain("locale es-US");
    expect(combined).toContain("last observation ask:lane:translation:session-obs");
    expect(combined).toContain("terminal authority pending_helix_terminal_authority");
    expect(combined).toContain("lane output remains observation-only");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: The lane session is visible.");
    expect(rows.find((row) => row.label === "Lane Session")).toMatchObject({
      role: "system",
      status: "pending",
    });
    expect(rows.some((row) => row.label === "Goal Lane")).toBe(false);

    const sessionSummary = summary?.rows.find((row) => row.key === "lane_sessions")?.value ?? "";
    expect(sessionSummary).toContain("live_translation");
    expect(sessionSummary).toContain("session lane-session-standalone");
    expect(sessionSummary).toContain("backend live_translation.local_runtime");
    expect(sessionSummary).toContain("decision fallback_to_available_provider");
    expect(sessionSummary).toContain("runtime root preserved");
    expect(sessionSummary).toContain("no live backend execution");
    expect(sessionSummary).toContain("terminal authority helix");
    expect(sessionSummary).toContain("source docs:nhm2");
    expect(sessionSummary).toContain("projection docs_chunk");
    expect(sessionSummary).toContain("locale es-US");
    expect(sessionSummary).toContain("observation ask:lane:translation:session-obs");
    expect(sessionSummary).toContain("authority pending_helix_terminal_authority");
    expect(sessionSummary).toContain("observation-only");
  });

  it("projects goal-bound lane backend-selection decisions in the runtime summary", () => {
    const summary = buildHelixAskRuntimeTurnSummary({
      id: "reply-codex-lane-goal-summary",
      turn_id: "turn-codex-lane-goal-summary",
      content: "Goal-bound lane summary.",
      debug: {
        turn_id: "turn-codex-lane-goal-summary",
        agent_runtime: "codex",
        capability_lane_goal_binding_debug_summaries: [
          {
            schema: "helix.capability_lane.goal_binding_debug_summary.v1",
            goal_binding_id: "goal-binding-translate-docs",
            goal_id: "goal:translate-docs",
            lane_session_id: "lane-session-translate-docs",
            lane_id: "live_translation",
            selected_runtime_agent_provider: "codex",
            selected_backend_provider: "live_translation.local_runtime",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              lane_id: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              outcome: "fallback_to_available_provider",
              reason: "requested_backend_unconfigured",
              selected_runtime_provider_remains_root: true,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
            },
            binding_status: "active",
            session_status: "running",
            source_id: "docs:nhm2",
            last_observation_ref: "ask:lane:translation:goal-obs",
            terminal_authority_status: "pending_helix_terminal_authority",
          },
        ],
      },
    });

    const goalSummary = summary?.rows.find((row) => row.key === "goal_bound_lanes")?.value ?? "";
    expect(goalSummary).toContain("live_translation");
    expect(goalSummary).toContain("goal goal:translate-docs");
    expect(goalSummary).toContain("session lane-session-translate-docs");
    expect(goalSummary).toContain("backend live_translation.local_runtime");
    expect(goalSummary).toContain("decision fallback_to_available_provider");
    expect(goalSummary).toContain("runtime root preserved");
    expect(goalSummary).toContain("no live backend execution");
    expect(goalSummary).toContain("terminal authority helix");
    expect(goalSummary).toContain("authority pending_helix_terminal_authority");
    expect(goalSummary).toContain("observation-only");
  });

  it("projects lane mail-loop summaries as evidence-only wake rows", () => {
    const reply = {
      id: "reply-codex-lane-mail-loop",
      turn_id: "turn-codex-lane-mail-loop",
      content: "The lane mail packet is visible.",
      debug: {
        turn_id: "turn-codex-lane-mail-loop",
        agent_runtime: "codex",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        capability_lane_mail_loop_debug_summaries: [
          {
            schema: "helix.capability_lane.mail_loop_debug_summary.v1",
            lane_session_id: "lane-session-mail",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            observation_ref: "ask:lane:translation:mail-obs",
            stage_play_mail_id: "stage-play-mail-translation",
            stage_play_wake_expected: true,
            mailbox_thread_id: "ask-thread-mail",
            source_id: "docs:nhm2",
            source_kind: "document_markdown",
            chunk_id: "chunk-1",
            projection_target: "docs_chunk",
            selected_backend_provider: "live_translation.local_runtime",
            requested_backend_provider: "google_gemini",
            backend_selection_decision: {
              schema: "helix.capability_lane.backend_selection_decision.v1",
              lane_id: "live_translation",
              requested_backend_provider: "google_gemini",
              selected_backend_provider: "live_translation.local_runtime",
              fallback_backend_provider: "live_translation.local_runtime",
              outcome: "fallback_to_available_provider",
              reason: "requested_backend_unconfigured",
              selected_runtime_provider_remains_root: true,
              live_backend_execution_enabled: false,
              terminal_authority_owner: "helix",
            },
            freshness_status: "fresh",
            blocked_reason: null,
            mail_status: "unread",
            terminal_authority_status: "pending_helix_terminal_authority",
            reentry_required: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
      },
    };
    const rows = buildHelixTurnTranscriptRows(reply);
    const summary = buildHelixAskRuntimeTurnSummary(reply);

    const combined = rows.map((row) => `${row.label}: ${row.text} ${row.meta} ${row.status}`).join("\n");
    expect(combined).toContain("Lane Mail: Lane mail loop: live_translation;");
    expect(combined).toContain("session lane-session-mail");
    expect(combined).toContain("mail stage-play-mail-translation");
    expect(combined).toContain("wake expected");
    expect(combined).toContain("observation ask:lane:translation:mail-obs");
    expect(combined).toContain("source docs:nhm2");
    expect(combined).toContain("chunk chunk-1");
    expect(combined).toContain("backend live_translation.local_runtime");
    expect(combined).toContain("requested backend google_gemini");
    expect(combined).toContain("decision fallback_to_available_provider");
    expect(combined).toContain("runtime root preserved");
    expect(combined).toContain("no live backend execution");
    expect(combined).toContain("terminal authority helix");
    expect(combined).toContain("terminal authority pending_helix_terminal_authority");
    expect(combined).toContain("mail is evidence-only");
    expect(combined).toContain("Terminal: Terminal selected: agent_provider_terminal_candidate.");
    expect(combined).toContain("Final: The lane mail packet is visible.");
    expect(rows.find((row) => row.label === "Lane Mail")).toMatchObject({
      role: "system",
      status: "pending",
    });

    const mailSummary = summary?.rows.find((row) => row.key === "lane_mail")?.value ?? "";
    expect(mailSummary).toContain("live_translation");
    expect(mailSummary).toContain("session lane-session-mail");
    expect(mailSummary).toContain("mail stage-play-mail-translation");
    expect(mailSummary).toContain("wake expected");
    expect(mailSummary).toContain("observation ask:lane:translation:mail-obs");
    expect(mailSummary).toContain("source docs:nhm2");
    expect(mailSummary).toContain("chunk chunk-1");
    expect(mailSummary).toContain("backend live_translation.local_runtime");
    expect(mailSummary).toContain("decision fallback_to_available_provider");
    expect(mailSummary).toContain("runtime root preserved");
    expect(mailSummary).toContain("no live backend execution");
    expect(mailSummary).toContain("terminal authority helix");
    expect(mailSummary).toContain("authority pending_helix_terminal_authority");
    expect(mailSummary).toContain("evidence-only");
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
