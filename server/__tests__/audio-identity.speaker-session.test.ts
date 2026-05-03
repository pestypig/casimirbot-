import { afterEach, describe, expect, it } from "vitest";
import { buildHelixAudioIdentityResult } from "../services/audio-identity/transcript-attribution";
import {
  applySpeakerSession,
  getSpeakerSessionSnapshot,
  resetSpeakerSessionRegistry,
  trustSessionSpeaker,
} from "../services/audio-identity/speaker-session";

describe("audio identity speaker sessions", () => {
  afterEach(() => {
    resetSpeakerSessionRegistry();
  });

  it("assigns stable session labels and colors for repeated speakers", () => {
    const first = buildHelixAudioIdentityResult({
      speakerIdentityEnabled: true,
      captureSessionId: "capture-a",
      roomId: "room-a",
      captureSource: "mic",
      speakerId: "spk_guest_a",
      speakerConfidence: 0.72,
      text: "first line",
    });
    expect(first).not.toBeNull();
    const firstApplied = applySpeakerSession(first!, {
      sessionId: "session-a",
      roomId: "room-a",
    }).audioIdentity;

    const second = buildHelixAudioIdentityResult({
      speakerIdentityEnabled: true,
      captureSessionId: "capture-a",
      roomId: "room-a",
      captureSource: "mic",
      speakerId: "spk_guest_a",
      speakerConfidence: 0.64,
      text: "second line",
    });
    const secondApplied = applySpeakerSession(second!, {
      sessionId: "session-a",
      roomId: "room-a",
    }).audioIdentity;

    expect(firstApplied.speakers[0]?.display_name).toBe("Guest 1");
    expect(secondApplied.speakers[0]?.display_name).toBe("Guest 1");
    expect(secondApplied.speakers[0]?.color_token).toBe(firstApplied.speakers[0]?.color_token);
    expect(secondApplied.speakers[0]?.confidence).toBe(0.72);
  });

  it("upgrades a speaker to session-trusted without profile enrollment", () => {
    trustSessionSpeaker({
      sessionId: "session-b",
      roomId: "room-b",
      speakerId: "spk_guest_b",
      displayName: "Rowan",
      role: "trusted_guest",
      authority: "command_confirm",
    });

    const identity = buildHelixAudioIdentityResult({
      speakerIdentityEnabled: true,
      captureSessionId: "capture-b",
      roomId: "room-b",
      captureSource: "mic",
      speakerId: "spk_guest_b",
      speakerConfidence: 0.8,
      text: "send it",
    });
    const applied = applySpeakerSession(identity!, {
      sessionId: "session-b",
      roomId: "room-b",
    }).audioIdentity;

    expect(applied.speakers[0]).toMatchObject({
      display_name: "Rowan",
      role: "trusted_guest",
      authority: "command_confirm",
      enrollment_state: "session",
    });
  });

  it("returns a session snapshot with all registered speakers", () => {
    trustSessionSpeaker({
      sessionId: "session-c",
      speakerId: "spk_owner",
      displayName: "You",
      role: "owner",
    });
    trustSessionSpeaker({
      sessionId: "session-c",
      speakerId: "spk_guest",
      displayName: "Guest 1",
      role: "trusted_guest",
    });

    const snapshot = getSpeakerSessionSnapshot("session-c");
    expect(snapshot).toMatchObject({
      session_id: "session-c",
      speaker_count: 2,
    });
    expect(snapshot?.speakers.map((speaker) => speaker.speaker_id).sort()).toEqual([
      "spk_guest",
      "spk_owner",
    ]);
  });
});
