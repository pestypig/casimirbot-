import fs from "node:fs/promises";
import path from "node:path";

type HelixAskSessionSlot = {
  id: string;
  label: string;
  aliases: string[];
  updatedAt: number;
};

type HelixAskSessionAttempt = {
  action: string;
  count: number;
  lastAt: number;
};

type HelixAskResolvedConcept = {
  id: string;
  label: string;
  evidence: string[];
  updatedAt: number;
};

type HelixAskSessionPrefs = {
  hypothesisEnabled?: boolean;
  verbosity?: string;
  citationsRequired?: boolean;
};

export type HelixAskSessionMemory = {
  slots: Record<string, HelixAskSessionSlot>;
  pinnedFiles: string[];
  lastClarifySlots: string[];
  resolvedConcepts: Record<string, HelixAskResolvedConcept>;
  openSlots: string[];
  attemptHistory: HelixAskSessionAttempt[];
  recentTopics: string[];
  userPrefs: HelixAskSessionPrefs;
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
const HELIX_ASK_SESSION_MAX_OPEN_SLOTS = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_OPEN_SLOTS, 8),
  2,
  24,
);
const HELIX_ASK_SESSION_MAX_ATTEMPTS = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_ATTEMPTS, 24),
  4,
  120,
);
const HELIX_ASK_SESSION_MAX_TOPICS = clampNumber(
  readNumber(process.env.HELIX_ASK_SESSION_MAX_TOPICS, 8),
  2,
  24,
);
const HELIX_ASK_SESSION_PERSIST_PATH = process.env.HELIX_ASK_SESSION_PERSIST_PATH?.trim();

const memory = new Map<string, HelixAskSessionMemory>();
let persistInFlight: Promise<void> | null = null;

const safeParseMemory = (raw: string): Record<string, HelixAskSessionMemory> | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, HelixAskSessionMemory>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const hydrateMemoryFromDisk = async (): Promise<void> => {
  if (!HELIX_ASK_SESSION_PERSIST_PATH) return;
  try {
    const resolved = path.resolve(process.cwd(), HELIX_ASK_SESSION_PERSIST_PATH);
    const raw = await fs.readFile(resolved, "utf8");
    const parsed = safeParseMemory(raw);
    if (!parsed) return;
    for (const [key, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== "object") continue;
      memory.set(key, entry);
    }
  } catch {
    // ignore missing/invalid cache
  }
};

const persistMemoryToDisk = (): void => {
  if (!HELIX_ASK_SESSION_PERSIST_PATH) return;
  if (persistInFlight) return;
  persistInFlight = (async () => {
    try {
      pruneMemory();
      const resolved = path.resolve(process.cwd(), HELIX_ASK_SESSION_PERSIST_PATH);
      const payload = Object.fromEntries(memory.entries());
      await fs.writeFile(resolved, JSON.stringify(payload, null, 2), "utf8");
    } catch {
      // best-effort
    } finally {
      persistInFlight = null;
    }
  })();
};

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
  resolvedConcepts?: Array<{ id: string; label: string; evidence?: string[] }>;
  pinnedFiles?: string[];
  lastClarifySlots?: string[];
  openSlots?: string[];
  attempts?: string[];
  recentTopics?: string[];
  userPrefs?: HelixAskSessionPrefs;
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
      resolvedConcepts: {},
      openSlots: [],
      attemptHistory: [],
      recentTopics: [],
      userPrefs: {},
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

  const resolvedConcepts = { ...existing.resolvedConcepts };
  for (const concept of args.resolvedConcepts ?? []) {
    if (!concept.id || !concept.label) continue;
    const evidence = Array.from(new Set(concept.evidence ?? [])).slice(0, HELIX_ASK_SESSION_MAX_FILES);
    resolvedConcepts[concept.id] = {
      id: concept.id,
      label: concept.label,
      evidence,
      updatedAt: now,
    };
  }
  const orderedConcepts = Object.values(resolvedConcepts)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, HELIX_ASK_SESSION_MAX_SLOTS);
  const trimmedConcepts: Record<string, HelixAskResolvedConcept> = {};
  for (const entry of orderedConcepts) {
    trimmedConcepts[entry.id] = entry;
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

  const openSlots = Array.from(
    new Set([...(existing.openSlots ?? []), ...(args.openSlots ?? [])].filter(Boolean)),
  ).slice(0, HELIX_ASK_SESSION_MAX_OPEN_SLOTS);

  const attempts = new Map<string, HelixAskSessionAttempt>();
  for (const attempt of existing.attemptHistory ?? []) {
    attempts.set(attempt.action, attempt);
  }
  for (const action of args.attempts ?? []) {
    const trimmed = action.trim();
    if (!trimmed) continue;
    const existingAttempt = attempts.get(trimmed);
    attempts.set(trimmed, {
      action: trimmed,
      count: (existingAttempt?.count ?? 0) + 1,
      lastAt: now,
    });
  }
  const attemptHistory = Array.from(attempts.values())
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, HELIX_ASK_SESSION_MAX_ATTEMPTS);

  const recentTopics = Array.from(
    new Set([...(existing.recentTopics ?? []), ...(args.recentTopics ?? [])].filter(Boolean)),
  ).slice(0, HELIX_ASK_SESSION_MAX_TOPICS);

  const userPrefs: HelixAskSessionPrefs = {
    ...(existing.userPrefs ?? {}),
    ...(args.userPrefs ?? {}),
  };

  memory.set(args.sessionId, {
    slots: trimmedSlots,
    pinnedFiles,
    lastClarifySlots,
    resolvedConcepts: trimmedConcepts,
    openSlots,
    attemptHistory,
    recentTopics,
    userPrefs,
    updatedAt: now,
  });
  persistMemoryToDisk();
};

void hydrateMemoryFromDisk();
