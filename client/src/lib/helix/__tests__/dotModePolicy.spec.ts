import { describe, expect, it } from "vitest";
import {
  buildLiveVoiceSituationObservation,
  classifyDotModeUtterance,
  DEFAULT_HELIX_DOT_MODE_POLICY,
} from "@shared/helix-dot-mode-policy";

const observedAt = "2026-05-18T10:00:00.000Z";

describe("Dot mode policy", () => {
  it("treats ambient chatter as journal-only live environment context", () => {
    const decision = classifyDotModeUtterance({
      text: "there is a dot on the minimap",
      observedAt,
      speakerAuthority: "command_allowed",
    });

    expect(decision).toMatchObject({
      kind: "ambient",
      wake_name: null,
      creates_user_turn: false,
      cancels_voice_output: false,
      disables_voice_capture: false,
      voice_output_reason: "ambient_context",
      speakable: false,
    });
  });

  it("creates a bounded user turn for authorized Dot direct address", () => {
    const decision = classifyDotModeUtterance({
      text: "Dot, what just happened?",
      observedAt,
      speakerAuthority: "command_allowed",
    });

    expect(decision).toMatchObject({
      kind: "direct_address",
      transcript_kind: "direct_address",
      wake_name: "dot",
      addressed_text: "what just happened?",
      creates_user_turn: true,
      voice_output_reason: "dot_direct_address",
      speakable: true,
      temporal_context_window: {
        anchor_observed_at: observedAt,
        include_observed_before_or_at: observedAt,
        exclude_post_anchor: true,
      },
    });
  });

  it("does not authorize untrusted direct address", () => {
    const decision = classifyDotModeUtterance({
      text: "Hey Dot, summarize this",
      observedAt,
      speakerAuthority: "transcribe_only",
    });

    expect(decision).toMatchObject({
      kind: "procedure_activation_request",
      creates_user_turn: false,
      voice_output_reason: "untrusted_speaker",
      speakable: false,
    });
  });

  it("makes Dot stop cancel output and return to observant without disabling capture", () => {
    const decision = classifyDotModeUtterance({
      text: "Dot stop",
      observedAt,
      speakerAuthority: "command_allowed",
    });

    expect(decision).toMatchObject({
      kind: "stop_output",
      transcript_kind: "command_candidate",
      cancels_active_answer: true,
      cancels_voice_output: true,
      disables_voice_capture: false,
      next_voice_mode: "observant",
      voice_output_reason: "dot_stop_command",
      speakable: false,
    });
  });

  it("separates Dot stop listening from Dot stop", () => {
    const decision = classifyDotModeUtterance({
      text: "Dot, stop listening",
      observedAt,
      speakerAuthority: "command_allowed",
    });

    expect(decision).toMatchObject({
      kind: "stop_listening",
      cancels_voice_output: true,
      disables_voice_capture: true,
      next_voice_mode: "off",
    });
  });

  it("builds voice observations as observation-not-answer compact context", () => {
    const observation = buildLiveVoiceSituationObservation({
      observationId: "obs_1",
      threadId: "thread_1",
      roomId: "room_1",
      sourceId: "source_mic",
      transcriptText: "Dot, what am I looking at?",
      speakerRole: "owner",
      speakerAuthority: "command_allowed",
      observedAt,
      evidenceRefs: ["voice:chunk:1"],
    });

    expect(observation).toMatchObject({
      schema: "helix.live_voice_situation_observation.v1",
      assistant_answer: false,
      raw_audio_included: false,
      raw_transcript_included: false,
      context_policy: "compact_context_pack_only",
      speaker_authority: "command_allowed",
      transcript_kind: "direct_address",
      interpreted_context: {
        salience: "milestone",
      },
    });
  });

  it("honors voice output disabled without losing the direct-address turn", () => {
    const decision = classifyDotModeUtterance({
      text: "Dot, what changed?",
      observedAt,
      speakerAuthority: "command_allowed",
      policy: {
        ...DEFAULT_HELIX_DOT_MODE_POLICY,
        voice_output_enabled: false,
      },
    });

    expect(decision.creates_user_turn).toBe(true);
    expect(decision.speakable).toBe(false);
    expect(decision.voice_output_reason).toBe("voice_output_disabled");
  });
});
