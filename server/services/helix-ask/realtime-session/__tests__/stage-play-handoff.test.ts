import { beforeEach, describe, expect, it } from "vitest";
import {
  listStagePlayLiveSourceConversationEvents,
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import { bridgeRealtimeTranscriptToStagePlay, resetRealtimeStagePlayAskHandoffsForTests } from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../route-boundary";

describe("Realtime transcript Stage Play handoff", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
  });

  it("records one conversation event and returns one idempotent server handoff", () => {
    const transcriptText = "Check the workstation, but do not change anything.";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:test",
      nowMs: 100,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:1",
        transcript_text: transcriptText,
      },
    });
    expect(observation).not.toBeNull();
    const input = {
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:1",
      transcriptText,
      observation: observation!,
      selectedRuntimeAgentProvider: "codex",
      providerCallRef: "openai-realtime:call:hashed",
      nowMs: 100,
    };
    const first = bridgeRealtimeTranscriptToStagePlay(input);
    const duplicate = bridgeRealtimeTranscriptToStagePlay({ ...input, nowMs: 200 });

    expect(duplicate).toEqual(first);
    expect(listStagePlayLiveSourceConversationEvents({
      threadId: "helix-ask:desktop",
      source: "user_voice",
    })).toHaveLength(1);
    expect(first).toMatchObject({
      schema: "helix.realtime_stage_play.ask_handoff.v1",
      transcript_observation_ref: observation!.observation_ref,
      read_only: true,
      transcript_is_user_intent_after_admission: true,
      answer_authority: false,
      terminal_eligible: false,
      route_metadata: {
        source: "realtime_stage_play",
        invocationKind: "stage_play_realtime_transcript_handoff",
        transportSource: "operator_text",
        transportKind: "realtime_transcript",
        transportPrecedenceReason: "server_admitted_realtime_transcript_handoff",
        selectedRuntimeAgentProvider: "codex",
        selected_runtime_agent_provider: "codex",
        forbiddenCapabilities: expect.arrayContaining([
          "workstation_mutation",
          "workstation_action_execution",
          "realtime_provider_tool_execution",
        ]),
        source_target_intent: expect.objectContaining({
          transport_source: "operator_text",
          transport_kind: "realtime_transcript",
          semantic_source_authority: "ask_source_target_arbitrator",
          must_enter_backend_ask: true,
          allow_client_shortcut: false,
          allow_no_tool_direct: false,
          grounded_feedback_requires_observation: true,
          admitted_readonly_handoff: true,
          runtime_agent_provider: "codex",
        }),
      },
      runtime_agent_provider: "codex",
      worker_admission: expect.objectContaining({
        selected_runtime_agent_provider: "codex",
        dispatch: expect.objectContaining({
          target_runtime_agent_provider: "codex",
          runtime_selection_source: "ask_ui_selected_runtime",
        }),
      }),
    });
    expect(first.route_metadata.sourceTarget).toBe(first.worker_admission.selected_route);
    expect((first.route_metadata.source_target_intent as Record<string, unknown>).target_source)
      .toBe(first.worker_admission.selected_route);
    expect((first.route_metadata.source_target_intent as Record<string, unknown>).target_source)
      .not.toBe("operator_text");
    expect(JSON.stringify(first)).not.toContain(transcriptText);
    expect(JSON.stringify(first)).not.toContain("realtime_transcript_readonly_reentry");
  });

  it("requires an active-context observation for a deictic workstation question", () => {
    const transcriptText = "What panel in the workstation is active?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:deictic",
      nowMs: 300,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:deictic",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:deictic",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:deictic",
      transcriptText,
      observation,
      nowMs: 300,
    });

    expect(handoff.required_grounding_capability_ids).toEqual(["workstation.active_context"]);
    expect(handoff.route_metadata).toMatchObject({
      requiredGroundingCapabilityIds: ["workstation.active_context"],
      realtime_grounded_feedback_binding: {
        schema: "helix.realtime_grounded_feedback.binding.v1",
        handoff_id: handoff.handoff_id,
        realtime_session_id: "realtime:deictic",
        thread_id: "helix-ask:desktop",
        transcript_observation_ref: observation.observation_ref,
        worker_admission_id: handoff.worker_admission.admission_id,
        issued_at_ms: 300,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      source_target_intent: {
        allow_no_tool_direct: false,
        grounded_feedback_requires_observation: true,
        required_grounding_capability_ids: ["workstation.active_context"],
      },
    });
  });

  it("preserves a natural scholarly source route across the Realtime transport boundary", () => {
    const transcriptText = "Okay, can you look for papers about a magnetar?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:scholarly",
      nowMs: 325,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:scholarly",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:scholarly",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:scholarly",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
      nowMs: 325,
    });

    expect(handoff.required_grounding_capability_ids).toEqual([
      "scholarly-research.lookup_papers",
    ]);
    expect(handoff.route_metadata).toMatchObject({
      sourceTarget: "scholarly_research",
      transportSource: "operator_text",
      transportKind: "realtime_transcript",
      source_target_intent: {
        target_source: "scholarly_research",
        target_kind: "scholarly_research",
        allow_no_tool_direct: false,
        grounded_feedback_requires_observation: true,
        required_grounding_capability_ids: ["scholarly-research.lookup_papers"],
        semantic_source_authority: "ask_source_target_arbitrator",
        transport_source: "operator_text",
        transport_kind: "realtime_transcript",
      },
    });
    expect((handoff.route_metadata.source_target_intent as Record<string, unknown>).requested_outputs)
      .toEqual(expect.arrayContaining([
        "scholarly_paper_refs",
        "grounded_runtime_agent_answer",
        "typed_failure",
      ]));
  });

  it("does not launch Ask for a bare panel transcript fragment", () => {
    const transcriptText = "active panel";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:panel-fragment",
      nowMs: 350,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:panel-fragment",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:panel-fragment",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:panel-fragment",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 350,
    });

    expect(handoff.required_grounding_capability_ids).toEqual([]);
    expect(handoff.worker_admission).toMatchObject({
      outcome: "conversation_local",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "none",
        requested: false,
        suppress_parallel_ask_turn: true,
      },
      spoken_relay_eligible: false,
    });
    expect(handoff.worker_admission.reason_codes).toContain(
      "realtime_workspace_panel_fragment_without_affirmative_request",
    );
    expect(handoff.route_metadata.source_target_intent).toMatchObject({
      must_enter_backend_ask: false,
      allow_no_tool_direct: true,
      requested_outputs: expect.arrayContaining(["realtime_conversation_local"]),
    });
  });

  it.each([
    "The button says \"What panel do you see?\"",
    "Later, ask what panel do you see.",
    "Do not answer what panel is currently visible.",
  ])("does not turn contextual panel wording into an observation requirement: %s", (transcriptText) => {
    const suffix = transcriptText.length.toString(16);
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: `realtime:contextual:${suffix}`,
      body: {
        event_type: "transcript.final",
        event_ref: `provider-event:contextual:${suffix}`,
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: `realtime:contextual:${suffix}`,
      threadId: "helix-ask:desktop",
      providerEventRef: `provider-event:contextual:${suffix}`,
      transcriptText,
      observation,
    });

    expect(handoff.required_grounding_capability_ids).toEqual([]);
    expect(handoff.worker_admission).toMatchObject({
      outcome: "conversation_local",
      dispatch: {
        kind: "none",
        requested: false,
      },
    });
    expect(handoff.route_metadata.source_target_intent).toMatchObject({
      must_enter_backend_ask: false,
      allow_no_tool_direct: true,
    });
  });
});
