import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./useHelixStartSettings";

describe("Helix Start settings defaults", () => {
  it("keeps the legacy Helix Ask observer lane opt-in", () => {
    expect(DEFAULT_SETTINGS.showHelixAskObserverLane).toBe(false);
  });

  it("keeps Dottie voice debug clips separate from the legacy observer lane", () => {
    expect(DEFAULT_SETTINGS.showDottieVoiceDebugClips).toBe(false);
    expect(DEFAULT_SETTINGS.showHelixAskObserverLane).toBe(false);
  });
});
