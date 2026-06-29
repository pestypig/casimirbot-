import { describe, expect, it } from "vitest";
import {
  formatReadAloudButtonLabel,
  resolveInitialMicArmState,
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
});
