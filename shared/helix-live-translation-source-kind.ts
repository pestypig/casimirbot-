import {
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
  normalizeHelixLiveTranslationProjectionTarget,
} from "./helix-live-translation-projection-target";

const DOCUMENT_SOURCE_KIND_ALIASES = new Set([
  "docs",
  "docs_viewer",
  "document_markdown",
]);

const AUDIO_SOURCE_KIND_ALIASES = new Set([
  "audio",
  "audio_transcript",
]);

const VISUAL_SOURCE_KIND_ALIASES = new Set([
  "visual",
  "visual_capture",
]);

const STABLE_SOURCE_KINDS = new Set([
  "docs_hover",
  "docs_selection",
  "ask_turn",
  "unknown",
  "custom",
]);

const normalizeToken = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return value;
  if (DOCUMENT_SOURCE_KIND_ALIASES.has(normalized)) return "docs";
  if (AUDIO_SOURCE_KIND_ALIASES.has(normalized)) return "audio";
  if (VISUAL_SOURCE_KIND_ALIASES.has(normalized)) return "visual";
  if (STABLE_SOURCE_KINDS.has(normalized)) return normalized;

  const projectionTarget = normalizeHelixLiveTranslationProjectionTarget(
    normalized,
    HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
  );
  return projectionTarget === HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN
    ? value
    : projectionTarget;
};

export const normalizeHelixLiveTranslationSourceKind = (
  value: unknown,
  fallback = "unknown",
): string => {
  if (typeof value !== "string") return fallback;
  const normalized = normalizeToken(value);
  return normalized.trim() || fallback;
};

export const normalizeHelixLiveTranslationSourceIdentityKey = (
  value: unknown,
): string => {
  if (typeof value !== "string") return "";
  return value
    .split("::")
    .map(normalizeToken)
    .join("::")
    .trim();
};
