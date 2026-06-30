export type MicArmState = "off" | "on";

export type ReadAloudPlaybackState = "idle" | "requesting" | "playing" | "dry-run" | "error";

export const VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS = 180;

export function resolveInitialMicArmState(persisted: string | null | undefined): MicArmState {
  return persisted === "off" ? "off" : "on";
}

export function transitionReadAloudState(
  current: ReadAloudPlaybackState,
  event: "request" | "audio" | "dry-run" | "error" | "stop" | "ended",
): ReadAloudPlaybackState {
  if (event === "request") return "requesting";
  if (event === "audio") return "playing";
  if (event === "dry-run") return "dry-run";
  if (event === "error") return "error";
  if (event === "stop" || event === "ended") return "idle";
  return current;
}

export function shouldStopReadAloudOnButtonPress(state: ReadAloudPlaybackState): boolean {
  return state === "requesting" || state === "playing";
}

export function formatReadAloudButtonLabel(state: ReadAloudPlaybackState): string {
  if (shouldStopReadAloudOnButtonPress(state)) return `Stop reading (${state})`;
  if (state === "dry-run") return "Read aloud (dry-run)";
  if (state === "error") return "Read aloud (error)";
  return "Read aloud";
}

export function hashVoiceUtteranceKey(source: string): string {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildVoiceAutoSpeakUtteranceId(parts: Array<string | undefined | null>): string {
  const normalized = parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(":");
  if (!normalized) {
    return `utt:${crypto.randomUUID()}`;
  }
  if (normalized.length <= VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS) {
    return normalized;
  }
  const digest = hashVoiceUtteranceKey(normalized);
  const headMax = Math.max(24, VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS - digest.length - 1);
  return `${normalized.slice(0, headMax)}:${digest}`;
}

export function isManualVoicePlaybackUtterance(
  utterance: { kind?: string | null; source?: string | null } | null | undefined,
): boolean {
  return utterance?.kind === "manual_read_aloud" || utterance?.source === "manual";
}

export function isInterimVoicePlaybackUtteranceKind(kind: string | null | undefined): boolean {
  return (
    kind === "tool_receipt" ||
    kind === "translation_relay" ||
    kind === "narrator_read" ||
    kind === "panel_narration"
  );
}

export function isMissionVoiceOutputModeEnabled(voiceMode: string | null | undefined): boolean {
  return voiceMode === "normal";
}

export function shouldEnableVoiceRollout(args: {
  enabled: boolean;
  killSwitch: boolean;
  activePercent: number;
  key: string;
}): boolean {
  if (!args.enabled || args.killSwitch) return false;
  const percent = Math.max(0, Math.min(100, Math.round(args.activePercent)));
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return (parseInt(hashVoiceUtteranceKey(args.key), 16) >>> 0) % 100 < percent;
}
