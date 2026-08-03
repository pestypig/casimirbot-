import { beforeEach, describe, expect, it } from "vitest";
import {
  listStagePlayLiveSourceConversationEvents,
  recordStagePlayLiveSourceConversationEvent,
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import {
  bridgeRealtimeTranscriptToStagePlay,
  readRealtimeStagePlayTurnActorContext,
  resetRealtimeStagePlayAskHandoffsForTests,
} from "../../live-source/realtime-stage-play-handoff";
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

  it("keeps the frozen room speaker in server-only handoff control state", () => {
    const transcriptText = "Check my current Minecraft status.";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:room-speaker",
      nowMs: 250,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:room-speaker",
        transcript_text: transcriptText,
      },
    })!;
    const trustedTurnActorContext = {
      schema: "helix.realtime_room.turn_actor_context.v1" as const,
      origin: "realtime_voice" as const,
      room_id: "shared_realtime_room:test",
      requester_profile_id: "profile:owner",
      realtime_session_id: "realtime:room-speaker",
      participant_id: "participant:guest",
      resolution: "resolved" as const,
      resolution_source: "active_speaker_floor" as const,
      captured_at_ms: 250,
    };
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:room-speaker",
      threadId: "helix-ask:room:shared_realtime_room:test",
      providerEventRef: "provider-event:room-speaker",
      transcriptText,
      observation,
      trustedTurnActorContext,
      nowMs: 250,
    });

    expect(readRealtimeStagePlayTurnActorContext(handoff.handoff_id)).toEqual(
      trustedTurnActorContext,
    );
    expect(JSON.stringify(handoff)).not.toContain("participant:guest");
    expect(JSON.stringify(handoff)).not.toContain("profile:owner");
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

  it("carries the exact Minecraft connector probe across the Realtime handoff", () => {
    const transcriptText =
      "Check my current Minecraft inventory now using the connected environment.";
    const capability = "com.casimirbot.minecraft.inventory.check";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:minecraft-connector",
      nowMs: 320,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:minecraft-connector",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:minecraft-connector",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:minecraft-connector",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 320,
    });

    expect(handoff.worker_admission).toMatchObject({
      selected_route: "live_environment",
      candidate_readonly_capability_ids: [capability],
      action_candidate_capability_ids: [],
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(handoff.required_grounding_capability_ids).toEqual([capability]);
    expect(handoff.route_metadata).toMatchObject({
      sourceTarget: "live_environment",
      requiredGroundingCapabilityIds: [capability],
      source_target_intent: {
        target_source: "live_environment",
        required_grounding_capability_ids: [capability],
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
        active_doc_path: "docs/research/example.md",
        active_panel: "docs-viewer",
      },
    });
    expect((handoff.route_metadata.source_target_intent as Record<string, unknown>).requested_outputs)
      .toEqual(expect.arrayContaining([
        "scholarly_paper_refs",
        "grounded_runtime_agent_answer",
        "typed_failure",
      ]));
  });

  it("requires a document observation for a hard active-doc trip-comparison turn", () => {
    const transcriptText =
      "So can you tell me about the warp profile? Is it a relativistic profile? And how fast does that go, like in terms of saving time? I think we have some comparisons on days that it saves?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:active-doc-trip-comparison",
      nowMs: 340,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:active-doc-trip-comparison",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:active-doc-trip-comparison",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:active-doc-trip-comparison",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/nhm2-current-status-whitepaper.md",
      },
      nowMs: 340,
    });

    expect(handoff.worker_admission).toMatchObject({
      interaction_mode: "worker_required",
      selected_route: "active_doc",
      candidate_readonly_capability_ids: ["docs.search"],
    });
    expect(handoff.required_grounding_capability_ids).toEqual(["docs.search"]);
    expect(handoff.route_metadata).toMatchObject({
      requiredGroundingCapabilityIds: ["docs.search"],
      source_target_intent: {
        target_source: "active_doc",
        allow_no_tool_direct: false,
        grounded_feedback_requires_observation: true,
        required_grounding_capability_ids: ["docs.search"],
      },
    });
  });

  it("keeps document identity and document path distinct across the Realtime handoff", () => {
    const transcriptText =
      "What exact evidence in the current document says this applies beyond one paper?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:active-doc-identity",
      nowMs: 342,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:active-doc-identity",
        transcript_text: transcriptText,
      },
    })!;
    const documentPath =
      "docs/helix-ask/workstation-tool-contracts/helix_ask.inspect_capability_catalog.md";
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:active-doc-identity",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:active-doc-identity",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "doc:capability-catalog-contract",
        document_path: documentPath,
      },
      nowMs: 342,
    });

    expect(handoff.route_metadata).toMatchObject({
      sourceTarget: "active_doc",
      source_target_intent: {
        target_source: "active_doc",
        active_doc_path: documentPath,
        active_panel: "docs-viewer",
      },
    });
    expect(
      (handoff.route_metadata.source_target_intent as Record<string, unknown>)
        .active_doc_path,
    ).not.toBe("doc:capability-catalog-contract");
  });

  it("requires docs.search for a current-status whitepaper comparison", () => {
    const transcriptText =
      "Okay, and how does this relate to the NHM2 Current Status Whitepaper in the docs that we have?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:current-status-whitepaper-comparison",
      nowMs: 345,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:current-status-whitepaper-comparison",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:current-status-whitepaper-comparison",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:current-status-whitepaper-comparison",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
      sourceBinding: {
        focus_panel_id: "docs-viewer",
      },
      nowMs: 345,
    });

    expect(handoff.worker_admission).toMatchObject({
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
    expect(handoff.required_grounding_capability_ids).toEqual(["docs.search"]);
    expect(handoff.required_grounding_capability_ids).not.toContain(
      "internet-search.search_web",
    );
  });

  it("requires the exact procedure tool for an affirmative continuation bound to hash-checked Realtime context", () => {
    recordStagePlayLiveSourceConversationEvent({
      threadId: "helix-ask:desktop",
      text: [
        "Prepared the seven-stage comparison for badges",
        "study.casimir_dp.evidence_map_stage3 and physics.energy.energy_density",
        "with pinned Lanyon case advection_diffusion_full_1d.",
      ].join(" "),
      source: "assistant_answer",
      turnId: "ask:prior:theory-procedure",
      evidenceRefs: ["ask:prior:theory-procedure:terminal"],
      now: new Date(100).toISOString(),
    });
    const transcriptText = [
      "Continue that same comparison.",
      "Re-prepare the procedure so its evidence is current for this turn,",
      "then identify the missing semantic, formal, numerical, and observable requirements.",
      "Do not start downstream jobs.",
    ].join(" ");
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:theory-procedure-continuation",
      nowMs: 200,
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:theory-procedure-continuation",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:theory-procedure-continuation",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:theory-procedure-continuation",
      transcriptText,
      observation,
      sourceBinding: { focus_panel_id: "workflow-demo-lab" },
      selectedRuntimeAgentProvider: "codex",
      nowMs: 200,
    });

    expect(handoff.worker_admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      candidate_readonly_capability_ids: [
        "theory-experiment-procedure.prepare",
      ],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
      },
    });
    expect(handoff.worker_admission.reason_codes).toContain(
      "realtime_context_pack_bound_for_argument_admission",
    );
    expect(handoff.required_grounding_capability_ids).toEqual([
      "theory-experiment-procedure.prepare",
    ]);
    expect(handoff.route_metadata).toMatchObject({
      requiredGroundingCapabilityIds: [
        "theory-experiment-procedure.prepare",
      ],
      source_target_intent: {
        required_grounding_capability_ids: [
          "theory-experiment-procedure.prepare",
        ],
        grounded_feedback_requires_observation: true,
      },
    });
  });

  it.each([
    "Do not re-prepare that same theory comparison yet.",
    "If we later re-prepare that same theory comparison, what would happen?",
    "The screen says “re-prepare that same theory comparison.” Explain the wording.",
  ])("does not admit a retained procedure from non-affirmative current language: %s", (transcriptText) => {
    recordStagePlayLiveSourceConversationEvent({
      threadId: "helix-ask:desktop",
      text: [
        "Prepared badges study.casimir_dp.evidence_map_stage3 and",
        "physics.energy.energy_density using advection_diffusion_full_1d.",
      ].join(" "),
      source: "assistant_answer",
      turnId: "ask:prior:theory-procedure-suppressed",
      evidenceRefs: ["ask:prior:theory-procedure-suppressed:terminal"],
      now: new Date(100).toISOString(),
    });
    const suffix = transcriptText.length.toString(16);
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: `realtime:theory-procedure-suppressed:${suffix}`,
      nowMs: 200,
      body: {
        event_type: "transcript.final",
        event_ref: `provider-event:theory-procedure-suppressed:${suffix}`,
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: `realtime:theory-procedure-suppressed:${suffix}`,
      threadId: "helix-ask:desktop",
      providerEventRef: `provider-event:theory-procedure-suppressed:${suffix}`,
      transcriptText,
      observation,
      sourceBinding: { focus_panel_id: "workflow-demo-lab" },
      selectedRuntimeAgentProvider: "codex",
      nowMs: 200,
    });

    expect(handoff.worker_admission.candidate_readonly_capability_ids).not.toContain(
      "theory-experiment-procedure.prepare",
    );
    expect(handoff.required_grounding_capability_ids).not.toContain(
      "theory-experiment-procedure.prepare",
    );
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
