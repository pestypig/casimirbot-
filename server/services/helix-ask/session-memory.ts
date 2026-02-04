type HelixAskSessionSlot = {
  id: string;
  label: string;
  aliases: string[];
  updatedAt: number;
};

export type HelixAskSessionMemory = {
  slots: Record<string, HelixAskSessionSlot>;
  pinnedFiles: string[];
  lastClarifySlots: string[];
  updatedAt: number;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const HELIX_ASK_SESSION_TTL_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_TTL_MS, 30 * 60 * 1000),
  5 * 60 * 1000,
  24 * 60 * 60 * 1000,
);
const HELIX_ASK_SESSION_MAX_SLOTS = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_SLOTS, 12),
  2,
  40,
);
const HELIX_ASK_SESSION_MAX_FILES = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_FILES, 12),
  2,
  40,
);
const HELIX_ASK_SESSION_MAX_ALIASES = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_ALIASES, 6),
  2,
  20,
);
const HELIX_ASK_SESSION_MAX_CLARIFY = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_CLARIFY, 4),
  1,
  12,
);

const memory = new Map<string, HelixAskSessionMemory>();

const pruneMemory = (): void => {
  const now = Date.now();
  for (const [id, entry] of memory.entries()) {
    if (now - entry.updatedAt > HELIX_ASK_SESSION_TTL_MS) {
      memory.delete(id);
    }
  }
};

export const getHelixAskSessionMemory = (
  sessionId?: string,
): HelixAskSessionMemory | null => {
  if (!sessionId) return null;
  pruneMemory();
  return memory.get(sessionId) ?? null;
};

export const recordHelixAskSessionMemory = (args: {
  sessionId?: string;
  slots?: Array<{ id: string; label: string; aliases?: string[] }>;
  pinnedFiles?: string[];
  lastClarifySlots?: string[];
}): void => {
  if (!args.sessionId) return;
  pruneMemory();
  const now = Date.now();
  const existing =
    memory.get(args.sessionId) ??
    ({
      slots: {},
      pinnedFiles: [],
      lastClarifySlots: [],
      updatedAt: now,
    } satisfies HelixAskSessionMemory);

  const slots = { ...existing.slots };
  for (const slot of args.slots ?? []) {
    if (!slot.id || !slot.label) continue;
    const aliases = Array.from(
      new Set([...(slot.aliases ?? []).map((alias) => alias.trim()).filter(Boolean)]),
    ).slice(0, HELIX_ASK_SESSION_MAX_ALIASES);
    slots[slot.id] = {
      id: slot.id,
      label: slot.label,
      aliases,
      updatedAt: now,
    };
  }

  const orderedSlots = Object.values(slots)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, HELIX_ASK_SESSION_MAX_SLOTS);
  const trimmedSlots: Record<string, HelixAskSessionSlot> = {};
  for (const entry of orderedSlots) {
    trimmedSlots[entry.id] = entry;
  }

  const pinnedFiles = Array.from(
    new Set([...(existing.pinnedFiles ?? []), ...(args.pinnedFiles ?? [])]),
  ).slice(0, HELIX_ASK_SESSION_MAX_FILES);
  const lastClarifySlots = Array.from(
    new Set([...(args.lastClarifySlots ?? []).filter(Boolean)]),
  ).slice(0, HELIX_ASK_SESSION_MAX_CLARIFY);

  memory.set(args.sessionId, {
    slots: trimmedSlots,
    pinnedFiles,
    lastClarifySlots,
    updatedAt: now,
  });
};
