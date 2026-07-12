import { describe, expect, it } from "vitest";
import {
  HELIX_ASK_MICROPHONE_PREFERENCE_STORAGE_KEY,
  persistHelixAskMicArmState,
  readStoredHelixAskMicArmState,
  resolveInitialMicArmState,
  type HelixAskMicrophonePreferenceStorage,
} from "../HelixAskMicrophonePreference";

describe("Helix Ask microphone preference", () => {
  it("keeps fresh and invalid preferences disarmed", () => {
    expect(HELIX_ASK_MICROPHONE_PREFERENCE_STORAGE_KEY).toBe(
      "helix.ask.micCaptureEnabled.v2",
    );
    expect(resolveInitialMicArmState(null)).toBe("off");
    expect(resolveInitialMicArmState(undefined)).toBe("off");
    expect(resolveInitialMicArmState("invalid")).toBe("off");
    expect(resolveInitialMicArmState("off")).toBe("off");
    expect(resolveInitialMicArmState("on")).toBe("on");
  });

  it("owns resilient preference reads and explicit-toggle persistence", () => {
    const values = new Map<string, string>();
    const storage: HelixAskMicrophonePreferenceStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };

    expect(readStoredHelixAskMicArmState(null)).toBe("off");
    expect(readStoredHelixAskMicArmState(storage)).toBe("off");
    persistHelixAskMicArmState("on", storage);
    expect(readStoredHelixAskMicArmState(storage)).toBe("on");
    persistHelixAskMicArmState("off", storage);
    expect(readStoredHelixAskMicArmState(storage)).toBe("off");

    const throwingStorage: HelixAskMicrophonePreferenceStorage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
      setItem: () => {
        throw new Error("storage unavailable");
      },
    };
    expect(readStoredHelixAskMicArmState(throwingStorage)).toBe("off");
    expect(() => persistHelixAskMicArmState("on", throwingStorage)).not.toThrow();
  });
});
