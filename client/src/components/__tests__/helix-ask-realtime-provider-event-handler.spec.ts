import { describe, expect, it, vi } from "vitest";
import { createHelixAskRealtimeProviderEventHandler } from "@/components/helix/ask-console/HelixAskRealtimeProviderEventHandler";

const buildServerHandoff = (observationRef: string, suffix = "test") => ({
  schema: "helix.realtime_stage_play.ask_handoff.v1",
  handoff_id: `realtime-stage-play-handoff:${suffix}`,
  realtime_session_id: "realtime:test",
  thread_id: "helix-ask:desktop",
  provider_event_ref: `event:transcript:${suffix}`,
  transcript_observation_ref: observationRef,
  stage_play_event_ref: `stage-play-event:${suffix}`,
  context_pack_id: `context-pack:${suffix}`,
  context_hash: `sha256:${suffix}`,
  transcript_text_hash: `sha256:transcript-${suffix}`,
  transcript_text_char_count: 37,
  created_at_ms: 100,
  route_metadata: {
    schema: "helix.ask.route_metadata.v1",
    source: "realtime_stage_play",
    invocationKind: "stage_play_realtime_transcript_handoff",
    sourceTarget: "operator_text",
    handoffId: `realtime-stage-play-handoff:${suffix}`,
    forbiddenCapabilities: [
      "workstation_mutation",
      "workstation_action_execution",
      "realtime_provider_tool_execution",
    ],
    evidenceRefs: [observationRef, `stage-play-event:${suffix}`],
    source_target_intent: {
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      admitted_readonly_handoff: true,
      assistant_answer: false,
      raw_content_included: false,
      server_fixture_marker: suffix,
    },
  },
  read_only: true,
  transcript_is_user_intent_after_admission: true,
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("Helix Ask Realtime provider event handler", () => {
  it("requires a transcript observation receipt before read-only Ask re-entry", async () => {
    const serverHandoff = buildServerHandoff("obs:realtime:transcript:test");
    const postEvent = vi.fn(async () => ({
      ok: true,
      realtime_transcript_observations: [{ observation_ref: "obs:realtime:transcript:test" }],
      realtime_stage_play_ask_handoff: serverHandoff,
      realtime_stage_play_context_sync: {
        schema: "helix.realtime_stage_play.context_sync.v1",
        status: "sent",
      },
    }));
    const launchPrompt = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt,
      getRuntimeContext: () => ({
        transportReceiptRef: "receipt:transport:test",
        vadState: "speech_stopped",
        interruptionCount: 1,
        audioFocusOwner: "helix_realtime",
        sourceBinding: {
          thread_id: "helix-ask:desktop",
          source_id: "helix-ask:desktop",
          source_kind: "helix_ask_workstation",
          focus_panel_id: "scientific-calculator",
        },
      }),
    });

    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:transcript:1",
      transcript: "Check the current workstation status.",
    });

    expect(postEvent).toHaveBeenCalledWith(
      "/api/agi/realtime/session/realtime%3Atest/event",
      expect.objectContaining({
        event_type: "transcript.final",
        transcript_text: "Check the current workstation status.",
        runtime_agent_authority: "observe_only",
        realtime_transport_receipt_ref: "receipt:transport:test",
        realtime_vad_state: "speech_stopped",
        realtime_interruption_count: 1,
        realtime_audio_focus_owner: "helix_realtime",
        workstation_source_binding: expect.objectContaining({
          focus_panel_id: "scientific-calculator",
          source_kind: "helix_ask_workstation",
        }),
      }),
    );
    expect(launchPrompt).toHaveBeenCalledWith(expect.objectContaining({
      question: "Check the current workstation status.",
      autoSubmit: true,
      bypassWorkstationDispatch: true,
      forceReasoningDispatch: true,
      requiresBackendAskEntrypoint: true,
      suppressWorkstationPayloadActions: true,
      routeMetadata: expect.objectContaining({
        source: "realtime_stage_play",
        invocationKind: "stage_play_realtime_transcript_handoff",
        evidenceRefs: expect.arrayContaining(["obs:realtime:transcript:test"]),
        source_target_intent: expect.objectContaining({
          server_fixture_marker: "test",
        }),
      }),
    }));
    expect(result).toMatchObject({
      event_kind: "input_transcript_final",
      reentry_status: "reentered",
      tool_execution_attempted: false,
      workstation_action_executed: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      handoff_id: "realtime-stage-play-handoff:test",
      stage_play_event_ref: "stage-play-event:test",
      context_pack_id: "context-pack:test",
      context_sync_status: "sent",
    });
    expect(result).not.toHaveProperty("transcript_text");
  });

  it("does not execute or re-enter provider tool-call events", async () => {
    const postEvent = vi.fn();
    const launchPrompt = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "suggest_actions",
      postEvent,
      launchPrompt,
    });
    const result = await handler.handle({
      type: "response.function_call_arguments.done",
      name: "workstation.open_panel",
      arguments: "{\"panel\":\"docs\"}",
    });
    expect(result).toMatchObject({ event_kind: "ignored", reentry_status: "not_required" });
    expect(postEvent).not.toHaveBeenCalled();
    expect(launchPrompt).not.toHaveBeenCalled();
  });

  it("deduplicates non-terminal client playback receipts", async () => {
    const postEvent = vi.fn(async () => ({ ok: true }));
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt: vi.fn(),
    });
    const event = {
      type: "response.output_audio.delta",
      event_id: "event:audio:1",
      response_id: "response:1",
      delta: "base64-audio",
    };
    await handler.handle(event);
    await handler.handle({ ...event, event_id: "event:audio:2" });
    await handler.handle({
      type: "response.output_audio.done",
      event_id: "event:audio:done",
      response_id: "response:1",
    });
    expect(postEvent).toHaveBeenCalledTimes(2);
    expect(postEvent).toHaveBeenNthCalledWith(
      1,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({ receipt_kind: "playback_started", terminal_eligible: false }),
    );
    expect(postEvent).toHaveBeenNthCalledWith(
      2,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({ receipt_kind: "playback_ended", terminal_eligible: false }),
    );
  });

  it("recognizes WebRTC output buffer lifecycle as non-terminal playback", async () => {
    const postEvent = vi.fn(async () => ({ ok: true }));
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:webrtc-buffer",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt: vi.fn(),
    });

    const started = await handler.handle({
      type: "output_audio_buffer.started",
      event_id: "event:buffer:started",
      response_id: "response:buffer",
    });
    const stopped = await handler.handle({
      type: "output_audio_buffer.stopped",
      event_id: "event:buffer:stopped",
      response_id: "response:buffer",
    });

    expect(started).toMatchObject({
      event_kind: "playback",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(stopped).toMatchObject({
      event_kind: "playback",
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it("normalizes VAD and interruption events into safe non-terminal receipts", async () => {
    const postEvent = vi.fn(async () => ({ ok: true }));
    const projections = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt: vi.fn(),
      onProjection: projections,
    });

    const vad = await handler.handle({
      type: "input_audio_buffer.speech_started",
      event_id: "event:vad:1",
    });
    const interrupted = await handler.handle({
      type: "conversation.item.truncated",
      event_id: "event:interrupt:1",
    });

    expect(vad).toMatchObject({
      event_kind: "vad",
      vad_state: "speech_started",
      response_interrupted: false,
      terminal_eligible: false,
    });
    expect(interrupted).toMatchObject({
      event_kind: "interruption",
      response_interrupted: true,
      terminal_eligible: false,
    });
    expect(postEvent).toHaveBeenNthCalledWith(
      1,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "vad_speech_started",
        qualified_user_interruption: false,
      }),
    );
    expect(postEvent).toHaveBeenNthCalledWith(
      2,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "response_interrupted",
        response_interrupted: true,
        qualified_user_interruption: false,
      }),
    );
    expect(projections).toHaveBeenCalledTimes(2);
  });

  it("normalizes response lifecycle without admitting it as answer authority", async () => {
    const postEvent = vi.fn(async () => ({ ok: true }));
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt: vi.fn(),
    });

    const started = await handler.handle({
      type: "response.created",
      event_id: "event:response:start",
      response: { id: "response:safe-ref", status: "in_progress" },
    });
    const completed = await handler.handle({
      type: "response.done",
      event_id: "event:response:done",
      response: { id: "response:safe-ref", status: "completed" },
    });

    expect(started).toMatchObject({
      event_kind: "response",
      response_status: "in_progress",
      provider_response_ref: "response:safe-ref",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(completed).toMatchObject({
      event_kind: "response",
      response_status: "completed",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(postEvent).toHaveBeenNthCalledWith(
      1,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "response_started",
        provider_response_ref: "response:safe-ref",
      }),
    );
    expect(postEvent).toHaveBeenNthCalledWith(
      2,
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "response_completed",
        raw_content_included: false,
      }),
    );
  });

  it("suppresses short terminal-voice overlap as potential speaker loopback", async () => {
    let nowMs = 1000;
    const postEvent = vi.fn(async () => ({ ok: true }));
    const launchPrompt = vi.fn();
    const interruptTerminalVoice = vi.fn(() => true);
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt,
      nowMs: () => nowMs,
      readAudioFocus: () => ({
        active_id: "terminal:1",
        active_kind: "helix_terminal_voice",
        active_priority: 100,
        resumable_id: "realtime:1",
      }),
      interruptTerminalVoice,
    });

    await handler.handle({
      type: "input_audio_buffer.speech_started",
      event_id: "event:short:start",
    });
    nowMs += 250;
    await handler.handle({
      type: "input_audio_buffer.speech_stopped",
      event_id: "event:short:stop",
    });
    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:short:transcript",
      transcript: "Potential speaker echo.",
    });

    expect(result).toMatchObject({
      reentry_status: "blocked",
      blocked_reason: "speaker_loopback_suppressed",
      speaker_loopback_suppressed: true,
      qualified_user_interruption: false,
    });
    expect(postEvent).toHaveBeenLastCalledWith(
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "speaker_loopback_suppressed",
        raw_content_included: false,
      }),
    );
    expect(interruptTerminalVoice).not.toHaveBeenCalled();
    expect(launchPrompt).not.toHaveBeenCalled();
  });

  it("admits persistent AEC-plus-VAD speech as a qualified terminal-voice barge-in", async () => {
    let nowMs = 2000;
    const postEvent = vi.fn(async (path: string) =>
      path.endsWith("/event")
        ? {
            ok: true,
            realtime_transcript_observations: [
              { observation_ref: "obs:realtime:qualified-barge" },
            ],
            realtime_stage_play_ask_handoff: buildServerHandoff(
              "obs:realtime:qualified-barge",
              "qualified-barge",
            ),
          }
        : { ok: true });
    const launchPrompt = vi.fn();
    const interruptTerminalVoice = vi.fn(() => true);
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt,
      nowMs: () => nowMs,
      readAudioFocus: () => ({
        active_id: "terminal:1",
        active_kind: "helix_terminal_voice",
        active_priority: 100,
        resumable_id: "realtime:1",
      }),
      interruptTerminalVoice,
    });

    await handler.handle({
      type: "input_audio_buffer.speech_started",
      event_id: "event:barge:start",
    });
    nowMs += 800;
    await handler.handle({
      type: "input_audio_buffer.speech_stopped",
      event_id: "event:barge:stop",
    });
    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:barge:transcript",
      transcript: "Stop and check the workstation status.",
    });

    expect(interruptTerminalVoice).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      reentry_status: "reentered",
      qualified_user_interruption: true,
      speaker_loopback_suppressed: false,
    });
    expect(postEvent).toHaveBeenCalledWith(
      "/api/agi/realtime/session/realtime%3Atest/client-receipt",
      expect.objectContaining({
        receipt_kind: "qualified_barge_in",
        terminal_voice_interrupted: true,
        barge_in_qualification_basis:
          "browser_echo_cancellation_plus_persistent_provider_vad",
      }),
    );
    expect(launchPrompt).toHaveBeenCalledWith(expect.objectContaining({
      question: "Stop and check the workstation status.",
      routeMetadata: expect.objectContaining({
        source_target_intent: expect.objectContaining({
          server_fixture_marker: "qualified-barge",
        }),
      }),
    }));
  });

  it("fails closed when the observation receipt is missing", async () => {
    const launchPrompt = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent: vi.fn(async () => ({ ok: true, realtime_transcript_observations: [] })),
      launchPrompt,
    });
    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:transcript:missing",
      transcript: "What changed?",
    });
    expect(result).toMatchObject({
      reentry_status: "blocked",
      blocked_reason: "realtime_transcript_observation_receipt_missing",
    });
    expect(launchPrompt).not.toHaveBeenCalled();
  });

  it("fails closed when the server observation has no canonical Stage Play handoff", async () => {
    const launchPrompt = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent: vi.fn(async () => ({
        ok: true,
        realtime_transcript_observations: [{ observation_ref: "obs:realtime:no-handoff" }],
      })),
      launchPrompt,
    });
    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:transcript:no-handoff",
      transcript: "What changed?",
    });
    expect(result).toMatchObject({
      reentry_status: "blocked",
      blocked_reason: "realtime_stage_play_ask_handoff_missing",
    });
    expect(launchPrompt).not.toHaveBeenCalled();
  });

  it("rejects a handoff whose route metadata can bypass the read-only Ask boundary", async () => {
    const launchPrompt = vi.fn();
    const unsafeHandoff = buildServerHandoff("obs:realtime:unsafe-route", "unsafe-route");
    unsafeHandoff.route_metadata.source_target_intent.allow_client_shortcut = true;
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent: vi.fn(async () => ({
        ok: true,
        realtime_transcript_observations: [{ observation_ref: "obs:realtime:unsafe-route" }],
        realtime_stage_play_ask_handoff: unsafeHandoff,
      })),
      launchPrompt,
    });

    const result = await handler.handle({
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:transcript:unsafe-route",
      transcript: "What changed?",
    });

    expect(result).toMatchObject({
      reentry_status: "blocked",
      blocked_reason: "realtime_stage_play_ask_handoff_missing",
    });
    expect(launchPrompt).not.toHaveBeenCalled();
  });

  it("allows a failed server handoff request to retry without duplicate Ask launch", async () => {
    const observationRef = "obs:realtime:retry";
    const postEvent = vi.fn()
      .mockResolvedValueOnce({ ok: true, realtime_transcript_observations: [] })
      .mockResolvedValueOnce({
        ok: true,
        realtime_transcript_observations: [{ observation_ref: observationRef }],
        realtime_stage_play_ask_handoff: buildServerHandoff(observationRef, "retry"),
      });
    const launchPrompt = vi.fn();
    const handler = createHelixAskRealtimeProviderEventHandler({
      realtimeSessionId: "realtime:test",
      runtimeAgentAuthority: "observe_only",
      postEvent,
      launchPrompt,
    });
    const event = {
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "event:transcript:retry",
      transcript: "Retry this admitted transcript.",
    };

    expect(await handler.handle(event)).toMatchObject({ reentry_status: "blocked" });
    expect(await handler.handle(event)).toMatchObject({ reentry_status: "reentered" });
    expect(await handler.handle(event)).toMatchObject({
      reentry_status: "blocked",
      blocked_reason: "duplicate_realtime_transcript_event",
    });
    expect(postEvent).toHaveBeenCalledTimes(2);
    expect(launchPrompt).toHaveBeenCalledTimes(1);
  });
});
