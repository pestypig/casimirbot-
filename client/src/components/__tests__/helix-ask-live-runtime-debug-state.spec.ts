import { beforeEach, describe, expect, it } from "vitest";
import {
  beginHelixAskLiveRuntimeClientDebugAttempt,
  mergeHelixAskLiveRuntimeClientDebugIntoExport,
  readHelixAskLiveRuntimeClientDebugSnapshot,
  recordHelixAskLiveRuntimeClientDebugEvent,
  recordHelixAskLiveRuntimeServerStagePlayDebug,
  recordHelixAskLiveRuntimeStagePlayHandoff,
  resetHelixAskLiveRuntimeClientDebugStateForTests,
} from "@/components/helix/ask-console/HelixAskLiveRuntimeDebugState";
import {
  HELIX_DEBUG_EXPORT_MAX_UI_CHARS,
  boundHelixDebugExportTextForUi,
} from "@/components/helix/ask-console/HelixAskDebugExportSizeControl";

describe("Helix Ask live runtime client debug state", () => {
  beforeEach(resetHelixAskLiveRuntimeClientDebugStateForTests);

  it("distinguishes provider audio, remote track, muted playback, and unmuted speaker evidence", () => {
    beginHelixAskLiveRuntimeClientDebugAttempt({
      attemptRef: "receipt:live-runtime:consent:test",
      runtimeAgentMode: "live_voice",
      runtimeAgentAuthority: "observe_only",
      observedAtMs: 100,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "server_session_admitted",
      realtimeSessionId: "realtime:test",
      selectedModelOrService: "gpt-realtime-2.1",
      observedAtMs: 110,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "microphone_tracks_observed",
      realtimeSessionId: "realtime:test",
      microphoneTrackCount: 1,
      microphoneLiveTrackCount: 1,
      microphoneEnabledTrackCount: 1,
      microphoneMutedTrackCount: 0,
      microphoneDeviceLabel: "USB Microphone",
      microphoneLoopbackSource: false,
      observedAtMs: 115,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "microphone_enabled",
      realtimeSessionId: "realtime:test",
      observedAtMs: 115.5,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "data_channel_opened",
      realtimeSessionId: "realtime:test",
      observedAtMs: 116,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "initial_audio_probe_requested",
      realtimeSessionId: "realtime:test",
      observedAtMs: 117,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "remote_audio_track_attached",
      realtimeSessionId: "realtime:test",
      remoteTrackSource: "stream",
      remoteAudioMuted: true,
      audioFocusGranted: false,
      observedAtMs: 120,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "remote_audio_playback_started",
      realtimeSessionId: "realtime:test",
      remoteAudioMuted: true,
      audioFocusGranted: false,
      observedAtMs: 130,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "provider_event_received",
      realtimeSessionId: "realtime:test",
      providerEventType: "output_audio_buffer.started",
      observedAtMs: 140,
    });

    expect(readHelixAskLiveRuntimeClientDebugSnapshot()).toMatchObject({
      realtime_session_id: "realtime:test",
      voice_lane_required: false,
      microphone_track_count: 1,
      microphone_live_track_count: 1,
      microphone_enabled_track_count: 1,
      microphone_muted_track_count: 0,
      microphone_device_label: "USB Microphone",
      microphone_loopback_source: false,
      microphone_input_enabled: true,
      data_channel_state: "open",
      initial_audio_probe_requested: true,
      initial_audio_probe_error: null,
      provider_audio_event_observed: true,
      remote_audio_track_received: true,
      browser_playback_status: "started_muted",
      audio_focus_granted: false,
      speaker_trigger_evidence: "browser_play_resolved_muted",
      hardware_audio_output_confirmed: false,
    });

    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "remote_audio_playback_started",
      realtimeSessionId: "realtime:test",
      remoteAudioMuted: false,
      audioFocusGranted: true,
      observedAtMs: 150,
    });
    const exported = JSON.parse(mergeHelixAskLiveRuntimeClientDebugIntoExport(JSON.stringify({
      active_turn_id: "ask:selected-answer",
      selected_final_answer: "Existing answer remains authoritative.",
    })));
    expect(exported.realtime_live_client_debug).toMatchObject({
      realtime_session_id: "realtime:test",
      speaker_trigger_evidence: "provider_audio_and_browser_play_unmuted",
      selected_answer_turn_id: "ask:selected-answer",
      turn_binding: "ambient_live_runtime_session_not_bound_to_selected_answer",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(exported.selected_final_answer).toBe("Existing answer remains authoritative.");

    const oversized = mergeHelixAskLiveRuntimeClientDebugIntoExport(JSON.stringify({
      active_turn_id: "ask:selected-answer",
      giant_debug_blob: "x".repeat(HELIX_DEBUG_EXPORT_MAX_UI_CHARS + 1000),
    }));
    expect(JSON.parse(boundHelixDebugExportTextForUi(oversized))).toMatchObject({
      realtime_live_client_debug: {
        realtime_session_id: "realtime:test",
        speaker_trigger_evidence: "provider_audio_and_browser_play_unmuted",
        terminal_eligible: false,
      },
    });
  });

  it("does not modify answer debug before a live runtime attempt", () => {
    const payload = JSON.stringify({ active_turn_id: "ask:no-live-attempt" });
    expect(mergeHelixAskLiveRuntimeClientDebugIntoExport(payload)).toBe(payload);
  });

  it("binds a server-issued handoff and grounded feedback to the selected answer", () => {
    beginHelixAskLiveRuntimeClientDebugAttempt({
      attemptRef: "receipt:live-runtime:consent:binding",
      runtimeAgentMode: "live_voice",
      runtimeAgentAuthority: "observe_only",
      observedAtMs: 100,
    });
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "server_session_admitted",
      realtimeSessionId: "realtime:binding",
      observedAtMs: 110,
    });
    recordHelixAskLiveRuntimeStagePlayHandoff({
      handoff: {
        schema: "helix.realtime_stage_play.ask_handoff.v1",
        handoff_id: "handoff:binding",
        realtime_session_id: "realtime:binding",
        thread_id: "helix-ask:desktop",
        provider_event_ref: "provider-event:binding",
        transcript_observation_ref: "obs:binding",
        stage_play_event_ref: "stage-event:binding",
        context_pack_id: "context-pack:binding",
        context_hash: "sha256:binding",
        transcript_text_hash: "sha256:transcript",
        transcript_text_char_count: 20,
        created_at_ms: 120,
        route_metadata: {},
        read_only: true,
        transcript_is_user_intent_after_admission: true,
        reentry_required: true,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      observedAtMs: 120,
    });
    recordHelixAskLiveRuntimeServerStagePlayDebug({
      schema: "helix.realtime_stage_play.debug.v1",
      realtime_session_id: "realtime:binding",
      thread_id: "helix-ask:desktop",
      provider_call_ref: "openai-realtime:call:hash",
      handoffs: [{
        handoff_id: "handoff:binding",
        provider_event_ref: "provider-event:binding",
        transcript_observation_ref: "obs:binding",
        stage_play_event_ref: "stage-event:binding",
        context_pack_id: "context-pack:binding",
        context_hash: "sha256:binding",
        created_at_ms: 120,
        grounded_answer: {
          feedback_id: "feedback:binding",
          handoff_id: "handoff:binding",
          realtime_session_id: "realtime:binding",
          thread_id: "helix-ask:desktop",
          ask_turn_id: "ask:selected-answer",
          stage_play_event_ref: "stage-event:answer",
          answer_text_hash: "sha256:answer",
          answer_text_char_count: 42,
          final_answer_source: "final_answer_draft",
          terminal_artifact_kind: "model_synthesized_answer",
          evidence_refs: ["evidence:1"],
          recorded_at_ms: 130,
          completed_solver_path: true,
          server_authoritative: true,
          assistant_answer: false,
          raw_content_included: false,
        },
      }],
      latest_context_sync: null,
      authority: {
        realtime_answer_authority: false,
        workstation_action_authority: false,
        terminal_answer_authority: false,
        grounded_answer_requires_completed_solver_path: true,
      },
      provider_call_id_included: false,
      provider_payload_included: false,
      raw_content_included: false,
    });

    const exported = JSON.parse(mergeHelixAskLiveRuntimeClientDebugIntoExport(JSON.stringify({
      active_turn_id: "ask:selected-answer",
    })));
    expect(exported.realtime_live_client_debug).toMatchObject({
      latest_stage_play_handoff: { handoff_id: "handoff:binding" },
      selected_answer_grounded_feedback_id: "feedback:binding",
      turn_binding: "server_stage_play_handoff_bound_to_selected_answer",
      answer_authority: false,
      terminal_eligible: false,
    });
  });
});
