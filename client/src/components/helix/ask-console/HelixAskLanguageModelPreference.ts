import type { HelixLanguageModelProfileId } from "@shared/helix-language-model-policy";

export const HELIX_ASK_LANGUAGE_MODEL_PROFILE_STORAGE_KEY = "helix.ask.languageModelProfile.v1";

export type HelixAskLanguageModelPreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function resolveHelixAskLanguageModelPreferenceStorage(): HelixAskLanguageModelPreferenceStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function isHelixLanguageModelProfileId(value: unknown): value is HelixLanguageModelProfileId {
  return value === "auto" || value === "fast" || value === "balanced" || value === "deep";
}

export function readStoredHelixAskLanguageModelProfile(
  storage: HelixAskLanguageModelPreferenceStorage | null = resolveHelixAskLanguageModelPreferenceStorage(),
): HelixLanguageModelProfileId {
  if (!storage) return "auto";
  try {
    const value = storage.getItem(HELIX_ASK_LANGUAGE_MODEL_PROFILE_STORAGE_KEY);
    return isHelixLanguageModelProfileId(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

export function persistHelixAskLanguageModelProfile(
  value: HelixLanguageModelProfileId,
  storage: HelixAskLanguageModelPreferenceStorage | null = resolveHelixAskLanguageModelPreferenceStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(HELIX_ASK_LANGUAGE_MODEL_PROFILE_STORAGE_KEY, value);
  } catch {
    // Local storage can be unavailable in embedded or test contexts.
  }
}
