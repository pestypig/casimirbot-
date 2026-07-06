export type MicArmState = "off" | "on";

export type ReadAloudPlaybackState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "resuming"
  | "completed"
  | "cancelled"
  | "error"
  | "unavailable";
export type ReadAloudPlaybackStateByReply = Record<string, ReadAloudPlaybackState>;
export type ReadAloudButtonPressAction = "request" | "pause" | "resume" | "stop" | "retry" | "error";
export type ReadAloudPlaybackEvent =
  | "request"
  | "queued"
  | "audio"
  | "started"
  | "pause"
  | "paused"
  | "resume"
  | "resumed"
  | "cancel"
  | "cancelled"
  | "unavailable"
  | "suppressed"
  | "error"
  | "stop"
  | "ended";

export const VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS = 180;

export function resolveInitialMicArmState(persisted: string | null | undefined): MicArmState {
  return persisted === "off" ? "off" : "on";
}

export function transitionReadAloudState(
  current: ReadAloudPlaybackState,
  event: ReadAloudPlaybackEvent,
): ReadAloudPlaybackState {
  if (event === "request" || event === "queued") return "loading";
  if (event === "audio" || event === "started" || event === "resumed") return "playing";
  if (event === "pause" || event === "paused") return "paused";
  if (event === "resume") return current === "paused" ? "resuming" : "loading";
  if (event === "unavailable" || event === "suppressed") return "unavailable";
  if (event === "cancel" || event === "cancelled" || event === "stop") return "cancelled";
  if (event === "error") return "error";
  if (event === "ended") return "completed";
  return current;
}

export function buildReadAloudStateMapTransition(
  currentByReply: ReadAloudPlaybackStateByReply,
  replyId: string,
  event: ReadAloudPlaybackEvent,
): ReadAloudPlaybackStateByReply {
  if (!replyId) return currentByReply;
  return {
    ...currentByReply,
    [replyId]: transitionReadAloudState(currentByReply[replyId] ?? "idle", event),
  };
}

export function shouldStopReadAloudOnButtonPress(state: ReadAloudPlaybackState): boolean {
  return state === "loading" || state === "resuming";
}

export function shouldPauseReadAloudOnButtonPress(state: ReadAloudPlaybackState): boolean {
  return state === "playing";
}

export function shouldResumeReadAloudOnButtonPress(state: ReadAloudPlaybackState): boolean {
  return state === "paused";
}

export function resolveReadAloudButtonPressAction(args: {
  currentState: ReadAloudPlaybackState;
  hasText?: boolean | null;
}): ReadAloudButtonPressAction {
  if (shouldPauseReadAloudOnButtonPress(args.currentState)) return "pause";
  if (shouldResumeReadAloudOnButtonPress(args.currentState)) return "resume";
  if (shouldStopReadAloudOnButtonPress(args.currentState)) return "stop";
  if (args.hasText === false) return "error";
  if (args.currentState === "error" || args.currentState === "unavailable") return "retry";
  return "request";
}

export function filterReadAloudQueueForReply<T extends { replyId?: string | null }>(
  queue: readonly T[],
  replyId: string | null | undefined,
): T[] {
  const normalizedReplyId = replyId?.trim();
  if (!normalizedReplyId) return [...queue];
  return queue.filter((utterance) => utterance.replyId !== normalizedReplyId);
}

export function formatReadAloudButtonLabel(state: ReadAloudPlaybackState): string {
  if (state === "loading") return "Loading read-aloud";
  if (state === "playing") return "Pause read-aloud";
  if (state === "paused") return "Resume read-aloud";
  if (state === "resuming") return "Resuming read-aloud";
  if (state === "completed") return "Read aloud again";
  if (state === "cancelled") return "Read aloud";
  if (state === "unavailable") return "Read aloud unavailable";
  if (state === "error") return "Retry read-aloud";
  return "Read aloud";
}

export type ReadAloudChunkTrafficEventLike = {
  atMs?: number | null;
  kind?: string | null;
  status?: string | null;
  replyId?: string | null;
  chunkIndex?: number | null;
  chunkCount?: number | null;
  text?: string | null;
};

export type ReadAloudRegionTrafficState = {
  active: boolean;
  phase: "loading" | "reading" | "paused" | "resuming" | "completed";
  label: string;
  detail: string | null;
  chunkIndex: number | null;
  chunkCount: number | null;
  chunkText: string | null;
};

export const READ_ALOUD_COMPLETED_CHUNK_TRAFFIC_LINGER_MS = 8_000;

function normalizeChunkNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;
}

export function resolveReadAloudRegionTrafficState(args: {
  replyId?: string | null;
  readAloudState: ReadAloudPlaybackState;
  events?: readonly ReadAloudChunkTrafficEventLike[] | null;
  nowMs?: number;
  completedChunkLingerMs?: number;
}): ReadAloudRegionTrafficState | null {
  const replyId = args.replyId?.trim();
  if (!replyId) return null;
  const directPhase: ReadAloudRegionTrafficState["phase"] | null =
    args.readAloudState === "loading"
      ? "loading"
      : args.readAloudState === "playing"
        ? "reading"
        : args.readAloudState === "paused"
          ? "paused"
          : args.readAloudState === "resuming"
            ? "resuming"
            : null;
  const matchingEvents = [...(args.events ?? [])]
    .filter((event) => event.replyId === replyId)
    .filter((event) =>
      event.kind === "chunk_synth_start" ||
      event.kind === "chunk_synth_ok" ||
      event.kind === "chunk_play_start" ||
      event.kind === "chunk_play_end",
    )
    .sort((left, right) => (right.atMs ?? 0) - (left.atMs ?? 0));
  const nowMs = args.nowMs ?? Date.now();
  const completedChunkLingerMs =
    args.completedChunkLingerMs ?? READ_ALOUD_COMPLETED_CHUNK_TRAFFIC_LINGER_MS;
  const latestMatchingEvent = matchingEvents[0] ?? null;
  const recentCompletedChunk =
    args.readAloudState === "completed" &&
    latestMatchingEvent?.kind === "chunk_play_end" &&
    typeof latestMatchingEvent.atMs === "number" &&
    Number.isFinite(latestMatchingEvent.atMs) &&
    nowMs - latestMatchingEvent.atMs >= 0 &&
    nowMs - latestMatchingEvent.atMs <= completedChunkLingerMs;
  const phase: ReadAloudRegionTrafficState["phase"] | null =
    directPhase ?? (recentCompletedChunk ? "completed" : null);
  if (!phase) return null;
  const preferredEvent =
    matchingEvents.find((event) =>
      phase === "loading"
        ? event.kind === "chunk_synth_start" || event.kind === "chunk_synth_ok"
        : phase === "completed"
          ? event.kind === "chunk_play_end" || event.kind === "chunk_play_start"
        : event.kind === "chunk_play_start" || event.kind === "chunk_play_end",
    ) ?? matchingEvents[0] ?? null;
  const chunkIndex = normalizeChunkNumber(preferredEvent?.chunkIndex);
  const chunkCount = normalizeChunkNumber(preferredEvent?.chunkCount);
  const chunkText =
    typeof preferredEvent?.text === "string" && preferredEvent.text.trim()
      ? preferredEvent.text.trim()
      : matchingEvents.find((event) =>
          normalizeChunkNumber(event.chunkIndex) === chunkIndex &&
          typeof event.text === "string" &&
          event.text.trim(),
        )?.text?.trim() ?? null;
  const chunkDetail =
    chunkIndex !== null && chunkCount !== null && chunkCount > 0
      ? `chunk ${chunkIndex + 1}/${chunkCount}`
      : null;
  const label =
    phase === "loading"
      ? "Loading read-aloud"
      : phase === "reading"
        ? "Reading aloud"
        : phase === "paused"
          ? "Read-aloud paused"
          : phase === "completed"
            ? "Read-aloud completed"
            : "Resuming read-aloud";
  return {
    active: true,
    phase,
    label,
    detail: chunkDetail,
    chunkIndex,
    chunkCount,
    chunkText,
  };
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

export function canPlayVoiceUtteranceWithMicOff(
  utterance:
    | { kind?: string | null; source?: string | null; allowMicOffPlayback?: boolean | null }
    | null
    | undefined,
): boolean {
  return isManualVoicePlaybackUtterance(utterance) || utterance?.allowMicOffPlayback === true;
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
