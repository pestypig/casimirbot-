import { describe, expect, it } from "vitest";
import {
  buildReadAloudStateMapTransition,
  buildVoiceAutoSpeakUtteranceId,
  canPlayVoiceUtteranceWithMicOff,
  filterReadAloudQueueForReply,
  formatReadAloudButtonLabel,
  hashVoiceUtteranceKey,
  isInterimVoicePlaybackUtteranceKind,
  isManualVoicePlaybackUtterance,
  isMissionVoiceOutputModeEnabled,
  resolveInitialMicArmState,
  resolveReadAloudButtonPressAction,
  shouldEnableVoiceRollout,
  shouldStopReadAloudOnButtonPress,
  transitionReadAloudState,
} from "../ask-read-aloud-display";

describe("ask read-aloud display helpers", () => {
  it("defaults mic arm state to on unless persistence explicitly disables it", () => {
    expect(resolveInitialMicArmState(null)).toBe("on");
    expect(resolveInitialMicArmState(undefined)).toBe("on");
    expect(resolveInitialMicArmState("on")).toBe("on");
    expect(resolveInitialMicArmState("off")).toBe("off");
    expect(resolveInitialMicArmState("disabled")).toBe("on");
  });

  it("maps playback events to read-aloud UI state", () => {
    expect(transitionReadAloudState("idle", "request")).toBe("requesting");
    expect(transitionReadAloudState("requesting", "audio")).toBe("playing");
    expect(transitionReadAloudState("requesting", "dry-run")).toBe("dry-run");
    expect(transitionReadAloudState("requesting", "error")).toBe("error");
    expect(transitionReadAloudState("playing", "ended")).toBe("idle");
    expect(transitionReadAloudState("playing", "stop")).toBe("idle");
  });

  it("projects read-aloud state-map updates without mutating the current map", () => {
    const current = {
      "reply-1": "idle",
      "reply-2": "playing",
    } as const;

    expect(buildReadAloudStateMapTransition(current, "reply-1", "request")).toEqual({
      "reply-1": "requesting",
      "reply-2": "playing",
    });
    expect(current).toEqual({
      "reply-1": "idle",
      "reply-2": "playing",
    });
    expect(buildReadAloudStateMapTransition(current, "reply-3", "error")).toEqual({
      "reply-1": "idle",
      "reply-2": "playing",
      "reply-3": "error",
    });
    expect(buildReadAloudStateMapTransition(current, "", "request")).toBe(current);
  });

  it("formats read-aloud button labels from display state only", () => {
    expect(shouldStopReadAloudOnButtonPress("idle")).toBe(false);
    expect(shouldStopReadAloudOnButtonPress("requesting")).toBe(true);
    expect(shouldStopReadAloudOnButtonPress("playing")).toBe(true);
    expect(formatReadAloudButtonLabel("idle")).toBe("Read aloud");
    expect(formatReadAloudButtonLabel("requesting")).toBe("Stop reading (requesting)");
    expect(formatReadAloudButtonLabel("playing")).toBe("Stop reading (playing)");
    expect(formatReadAloudButtonLabel("dry-run")).toBe("Read aloud (dry-run)");
    expect(formatReadAloudButtonLabel("error")).toBe("Read aloud (error)");
  });

  it("resolves manual read-aloud button actions without owning playback", () => {
    expect(resolveReadAloudButtonPressAction({ currentState: "requesting" })).toBe("stop");
    expect(resolveReadAloudButtonPressAction({ currentState: "playing" })).toBe("stop");
    expect(resolveReadAloudButtonPressAction({ currentState: "idle", hasText: false })).toBe("error");
    expect(resolveReadAloudButtonPressAction({ currentState: "dry-run", hasText: true })).toBe("request");
    expect(resolveReadAloudButtonPressAction({ currentState: "error", hasText: null })).toBe("request");
  });

  it("filters queued read-aloud utterances for the clicked reply", () => {
    const queue = [
      { id: "a", replyId: "reply-1" },
      { id: "b", replyId: "reply-2" },
      { id: "c", replyId: "reply-1" },
      { id: "d", replyId: null },
    ];

    expect(filterReadAloudQueueForReply(queue, "reply-1")).toEqual([
      { id: "b", replyId: "reply-2" },
      { id: "d", replyId: null },
    ]);
    expect(filterReadAloudQueueForReply(queue, "")).toEqual(queue);
    expect(filterReadAloudQueueForReply(queue, undefined)).not.toBe(queue);
  });

  it("builds stable voice utterance IDs and hashes without owning playback scheduling", () => {
    expect(hashVoiceUtteranceKey("voice:turn:one")).toBe(hashVoiceUtteranceKey("voice:turn:one"));
    expect(hashVoiceUtteranceKey("voice:turn:one")).not.toBe(hashVoiceUtteranceKey("voice:turn:two"));
    expect(buildVoiceAutoSpeakUtteranceId([" reply-1 ", null, " final "])).toBe("reply-1:final");

    const longId = buildVoiceAutoSpeakUtteranceId(["x".repeat(220)]);
    expect(longId.length).toBeLessThanOrEqual(180);
    expect(longId).toMatch(/:[a-f0-9]{8}$/);
  });

  it("classifies voice utterance display predicates structurally", () => {
    expect(isManualVoicePlaybackUtterance({ kind: "manual_read_aloud" })).toBe(true);
    expect(isManualVoicePlaybackUtterance({ source: "manual" })).toBe(true);
    expect(isManualVoicePlaybackUtterance({ kind: "auto_brief", source: "auto" })).toBe(false);
    expect(canPlayVoiceUtteranceWithMicOff({ kind: "manual_read_aloud" })).toBe(true);
    expect(canPlayVoiceUtteranceWithMicOff({ source: "manual" })).toBe(true);
    expect(canPlayVoiceUtteranceWithMicOff({ source: "auto", allowMicOffPlayback: true })).toBe(true);
    expect(canPlayVoiceUtteranceWithMicOff({ source: "auto", allowMicOffPlayback: false })).toBe(false);
    expect(canPlayVoiceUtteranceWithMicOff(null)).toBe(false);
    expect(isInterimVoicePlaybackUtteranceKind("tool_receipt")).toBe(true);
    expect(isInterimVoicePlaybackUtteranceKind("panel_narration")).toBe(true);
    expect(isInterimVoicePlaybackUtteranceKind("final_answer")).toBe(false);
    expect(isMissionVoiceOutputModeEnabled("normal")).toBe(true);
    expect(isMissionVoiceOutputModeEnabled("muted")).toBe(false);
  });

  it("evaluates voice rollout gates deterministically", () => {
    expect(shouldEnableVoiceRollout({ enabled: false, killSwitch: false, activePercent: 100, key: "a" })).toBe(false);
    expect(shouldEnableVoiceRollout({ enabled: true, killSwitch: true, activePercent: 100, key: "a" })).toBe(false);
    expect(shouldEnableVoiceRollout({ enabled: true, killSwitch: false, activePercent: 0, key: "a" })).toBe(false);
    expect(shouldEnableVoiceRollout({ enabled: true, killSwitch: false, activePercent: 100, key: "a" })).toBe(true);
    expect(
      shouldEnableVoiceRollout({ enabled: true, killSwitch: false, activePercent: 37, key: "stable-key" }),
    ).toBe(
      shouldEnableVoiceRollout({ enabled: true, killSwitch: false, activePercent: 37, key: "stable-key" }),
    );
  });
});
