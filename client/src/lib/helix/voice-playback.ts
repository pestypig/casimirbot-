export type VoicePlaybackUtteranceKind = "brief" | "final";

export type VoicePlaybackPlayState =
  | "queued"
  | "synthesizing"
  | "playing"
  | "done"
  | "cancelled"
  | "failed";

export type VoicePlaybackCancelReason =
  | "barge_in"
  | "mic_off"
  | "manual_stop"
  | "superseded_same_turn"
  | "superseded_new_turn"
  | "preempted_by_final"
  | "error";

export type VoicePreemptPolicy = "none" | "pending_final" | "pending_regen";

export type VoicePlaybackChunk = {
  utteranceId: string;
  turnKey: string;
  kind: VoicePlaybackUtteranceKind;
  revision: number;
  chunkIndex: number;
  chunkCount: number;
  text: string;
};

export type VoicePlaybackUtterance = {
  utteranceId: string;
  turnKey: string;
  kind: VoicePlaybackUtteranceKind;
  revision: number;
  text: string;
  chunks: string[];
  playState: VoicePlaybackPlayState;
  enqueuedAtMs: number;
  traceId?: string;
  eventId: string;
};

export type VoicePlaybackMetrics = {
  utteranceId: string;
  turnKey: string;
  kind: VoicePlaybackUtteranceKind;
  chunkCount: number;
  enqueueToFirstAudioMs: number | null;
  synthDurationsMs: number[];
  chunkGapMs: number[];
  totalPlaybackMs: number | null;
  cancelReason: VoicePlaybackCancelReason | null;
  providerHeader?: string;
  profileHeader?: string;
  cacheHitCount: number;
  cacheMissCount: number;
};

export type VoiceChunkingOptions = {
  targetMinChars?: number;
  targetMaxChars?: number;
  hardMaxChars?: number;
};

export type VoicePlaybackQueueTransition = {
  queue: VoicePlaybackUtterance[];
  droppedUtteranceIds: string[];
  supersededActiveReason: VoicePlaybackCancelReason | null;
  pendingPreemptPolicy: VoicePreemptPolicy;
};

const DEFAULT_TARGET_MIN_CHARS = 90;
const DEFAULT_TARGET_MAX_CHARS = 160;
const DEFAULT_HARD_MAX_CHARS = 220;

const normalizeWhitespace = (source: string): string => source.replace(/\s+/g, " ").trim();

const splitSentenceUnits = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/g)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

const splitPhraseUnits = (text: string): string[] =>
  text
    .split(/(?<=[,;:])\s+/g)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

const splitHard = (text: string, hardMaxChars: number): string[] => {
  const words = normalizeWhitespace(text).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const segments: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > hardMaxChars) {
      if (current) {
        segments.push(current);
        current = "";
      }
      const slices = Math.ceil(word.length / hardMaxChars);
      for (let i = 0; i < slices; i += 1) {
        const start = i * hardMaxChars;
        segments.push(word.slice(start, start + hardMaxChars));
      }
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length <= hardMaxChars) {
      current = next;
    } else {
      if (current) segments.push(current);
      current = word;
    }
  }
  if (current) {
    segments.push(current);
  }
  return segments;
};

const expandUnits = (text: string, hardMaxChars: number): string[] => {
  const sentenceUnits = splitSentenceUnits(text);
  const units = sentenceUnits.length > 0 ? sentenceUnits : [normalizeWhitespace(text)];
  const expanded: string[] = [];
  for (const unit of units) {
    if (unit.length <= hardMaxChars) {
      expanded.push(unit);
      continue;
    }
    const phraseUnits = splitPhraseUnits(unit);
    if (phraseUnits.length > 1) {
      for (const phrase of phraseUnits) {
        if (phrase.length <= hardMaxChars) {
          expanded.push(phrase);
        } else {
          expanded.push(...splitHard(phrase, hardMaxChars));
        }
      }
      continue;
    }
    expanded.push(...splitHard(unit, hardMaxChars));
  }
  return expanded.filter(Boolean);
};

export function segmentVoicePlaybackText(
  source: string,
  options?: VoiceChunkingOptions,
): string[] {
  const normalized = normalizeWhitespace(source);
  if (!normalized) return [];
  const targetMinChars = Math.max(24, options?.targetMinChars ?? DEFAULT_TARGET_MIN_CHARS);
  const targetMaxChars = Math.max(targetMinChars, options?.targetMaxChars ?? DEFAULT_TARGET_MAX_CHARS);
  const hardMaxChars = Math.max(targetMaxChars, options?.hardMaxChars ?? DEFAULT_HARD_MAX_CHARS);
  const units = expandUnits(normalized, hardMaxChars);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = normalizeWhitespace(current);
    if (trimmed) chunks.push(trimmed);
    current = "";
  };

  for (const unit of units) {
    if (!unit) continue;
    if (!current) {
      current = unit;
      continue;
    }
    const joined = `${current} ${unit}`;
    if (joined.length <= targetMaxChars) {
      current = joined;
      continue;
    }
    if (current.length < targetMinChars && joined.length <= hardMaxChars) {
      current = joined;
      continue;
    }
    pushCurrent();
    current = unit;
  }

  pushCurrent();
  return chunks.map((chunk) => {
    if (chunk.length <= hardMaxChars) return chunk;
    return chunk.slice(0, hardMaxChars).trimEnd();
  });
}

export function createVoicePlaybackUtterance(input: {
  utteranceId: string;
  turnKey: string;
  kind: VoicePlaybackUtteranceKind;
  revision: number;
  text: string;
  traceId?: string;
  eventId: string;
  enqueuedAtMs?: number;
  chunking?: VoiceChunkingOptions;
}): VoicePlaybackUtterance {
  const chunks = segmentVoicePlaybackText(input.text, input.chunking);
  return {
    utteranceId: input.utteranceId,
    turnKey: input.turnKey,
    kind: input.kind,
    revision: Math.max(1, Math.floor(input.revision)),
    text: normalizeWhitespace(input.text),
    chunks,
    playState: "queued",
    enqueuedAtMs: input.enqueuedAtMs ?? Date.now(),
    traceId: input.traceId,
    eventId: input.eventId,
  };
}

export function applyLatestWinsVoiceQueue(input: {
  queue: VoicePlaybackUtterance[];
  incoming: VoicePlaybackUtterance;
  active?: VoicePlaybackUtterance | null;
}): VoicePlaybackQueueTransition {
  const dropped = new Set<string>();
  const incomingTurnKey = input.incoming.turnKey;
  let queue = [...input.queue];
  let supersededActiveReason: VoicePlaybackCancelReason | null = null;
  let pendingPreemptPolicy: VoicePreemptPolicy = "none";

  if (input.incoming.kind === "brief") {
    queue = queue.filter((entry) => {
      if (entry.kind !== "brief") return true;
      if (entry.turnKey === incomingTurnKey) {
        dropped.add(entry.utteranceId);
        return false;
      }
      dropped.add(entry.utteranceId);
      return false;
    });
    if (
      input.active &&
      input.active.kind === "brief" &&
      input.active.turnKey === incomingTurnKey &&
      input.incoming.revision > input.active.revision
    ) {
      pendingPreemptPolicy = "pending_regen";
    }
  } else {
    queue = queue.filter((entry) => {
      if (entry.turnKey !== incomingTurnKey) return true;
      if (entry.kind === "brief") {
        dropped.add(entry.utteranceId);
        return false;
      }
      if (entry.kind === "final" && entry.revision <= input.incoming.revision) {
        dropped.add(entry.utteranceId);
        return false;
      }
      return true;
    });
    if (input.active && input.active.turnKey === incomingTurnKey) {
      if (
        input.active.kind === "brief" &&
        input.incoming.revision >= input.active.revision
      ) {
        pendingPreemptPolicy = "pending_final";
      } else if (
        input.active.kind === "final" &&
        input.incoming.revision > input.active.revision
      ) {
        pendingPreemptPolicy = "pending_regen";
      }
    }
  }

  if (input.active && input.active.turnKey !== incomingTurnKey) {
    pendingPreemptPolicy = pendingPreemptPolicy === "none" ? "pending_regen" : pendingPreemptPolicy;
  }

  if (input.incoming.kind === "brief") {
    const firstFinalIndex = queue.findIndex((entry) => entry.kind === "final");
    if (firstFinalIndex >= 0) {
      queue.splice(firstFinalIndex, 0, input.incoming);
    } else {
      queue.push(input.incoming);
    }
  } else {
    queue.push(input.incoming);
  }
  return {
    queue,
    droppedUtteranceIds: [...dropped],
    supersededActiveReason,
    pendingPreemptPolicy,
  };
}

export function trimVoicePlaybackQueue(
  queue: VoicePlaybackUtterance[],
  maxLength: number,
): { queue: VoicePlaybackUtterance[]; droppedUtteranceIds: string[] } {
  if (maxLength <= 0) {
    return {
      queue: [],
      droppedUtteranceIds: queue.map((entry) => entry.utteranceId),
    };
  }
  if (queue.length <= maxLength) {
    return { queue, droppedUtteranceIds: [] };
  }
  const dropCount = queue.length - maxLength;
  return {
    queue: queue.slice(dropCount),
    droppedUtteranceIds: queue.slice(0, dropCount).map((entry) => entry.utteranceId),
  };
}
