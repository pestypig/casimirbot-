import type { MicArmState } from "@/lib/helix/ask-read-aloud-display";

// v1 could contain an implicit "on" written by the former opt-out default.
// v2 starts clean so only an explicit user toggle persists microphone access.
export const HELIX_ASK_MICROPHONE_PREFERENCE_STORAGE_KEY =
  "helix.ask.micCaptureEnabled.v2";

export type HelixAskMicrophonePreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function resolveHelixAskMicrophonePreferenceStorage(): HelixAskMicrophonePreferenceStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function resolveInitialMicArmState(
  persisted: string | null | undefined,
): MicArmState {
  return persisted === "on" ? "on" : "off";
}

export function readStoredHelixAskMicArmState(
  storage: HelixAskMicrophonePreferenceStorage | null =
    resolveHelixAskMicrophonePreferenceStorage(),
): MicArmState {
  if (!storage) return "off";
  try {
    return resolveInitialMicArmState(
      storage.getItem(HELIX_ASK_MICROPHONE_PREFERENCE_STORAGE_KEY),
    );
  } catch {
    return "off";
  }
}

export function persistHelixAskMicArmState(
  value: MicArmState,
  storage: HelixAskMicrophonePreferenceStorage | null =
    resolveHelixAskMicrophonePreferenceStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(HELIX_ASK_MICROPHONE_PREFERENCE_STORAGE_KEY, value);
  } catch {
    // Local storage can be unavailable in embedded or test contexts.
  }
}
