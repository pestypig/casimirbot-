export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ASK_TURN = "ask_turn" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_HOVER = "docs_hover" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_SELECTION = "docs_selection" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK = "docs_chunk" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_AUDIO_CHUNK = "audio_chunk" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ACCOUNT_LANGUAGE = "account_language" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN = "unknown" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_LEGACY = "docs_viewer_inline" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_DOT_LEGACY =
  "docs_viewer.inline_translation" as const;

export const HELIX_LIVE_TRANSLATION_PROJECTION_TARGETS = [
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ASK_TURN,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_HOVER,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_SELECTION,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_AUDIO_CHUNK,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_ACCOUNT_LANGUAGE,
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
] as const;

export type HelixLiveTranslationProjectionTarget =
  typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGETS[number];

export type HelixDocumentLiveTranslationProjectionTarget =
  | typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK
  | typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_SELECTION
  | typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_HOVER
  | typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_LEGACY
  | typeof HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_DOT_LEGACY;

const normalizeProjectionTargetText = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

export function normalizeHelixLiveTranslationProjectionTarget(
  value: string | null | undefined,
  fallback: HelixLiveTranslationProjectionTarget = HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
): HelixLiveTranslationProjectionTarget {
  const normalized = normalizeProjectionTargetText(value);
  if (
    normalized === HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_LEGACY ||
    normalized === HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_INLINE_DOT_LEGACY
  ) {
    return HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK;
  }
  if (HELIX_LIVE_TRANSLATION_PROJECTION_TARGETS.includes(normalized as HelixLiveTranslationProjectionTarget)) {
    return normalized as HelixLiveTranslationProjectionTarget;
  }
  return fallback;
}
