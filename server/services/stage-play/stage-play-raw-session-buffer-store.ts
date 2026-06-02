import crypto from "node:crypto";
import {
  STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA,
  validateStagePlayRawSessionBufferEntryV1,
  type StagePlayRawSessionBufferEntryV1,
  type StagePlayRawSessionBufferRawKindV1,
  type StagePlayRawSessionBufferRetentionPolicyV1,
} from "@shared/stage-play-raw-session-buffer";

export const STAGE_PLAY_RAW_SESSION_BUFFER_DEFAULT_TTL_MS = 60 * 60 * 1000;
const MAX_PREVIEW_CHARS = 240;

const entriesById = new Map<string, StagePlayRawSessionBufferEntryV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const cleanStringArray = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map((value) => cleanString(value)).filter((value): value is string => Boolean(value))))
    : [];

const clampPreview = (value: unknown): string | null => {
  const text = cleanString(value);
  if (!text) return null;
  return text.length > MAX_PREVIEW_CHARS ? `${text.slice(0, MAX_PREVIEW_CHARS - 1)}…` : text;
};

export function stagePlayRawSessionId(input: {
  threadId: string;
  roomId?: string | null;
  sessionId?: string | null;
}): string {
  return cleanString(input.sessionId) ?? `stage_play_session:${input.threadId}:${input.roomId ?? "no-room"}`;
}

function isExpired(entry: StagePlayRawSessionBufferEntryV1, nowMs: number): boolean {
  if (entry.retention.policy !== "session_ttl") return false;
  const expiresAt = entry.retention.expiresAt ? Date.parse(entry.retention.expiresAt) : Number.NaN;
  return Number.isFinite(expiresAt) && expiresAt <= nowMs;
}

export function purgeExpiredStagePlayRawSessionBufferEntries(now: Date = new Date()): number {
  const nowMs = now.getTime();
  let purged = 0;
  for (const [entryId, entry] of entriesById.entries()) {
    if (isExpired(entry, nowMs)) {
      entriesById.delete(entryId);
      purged += 1;
    }
  }
  return purged;
}

export function recordStagePlayRawSessionBufferEntry(input: {
  sessionId?: string | null;
  threadId: string;
  roomId?: string | null;
  sourceId: string;
  modality: StagePlayRawSessionBufferEntryV1["modality"];
  sourceEventId?: string | null;
  fromTs?: string | null;
  toTs?: string | null;
  rawKind: StagePlayRawSessionBufferRawKindV1;
  rawRef: string;
  rawTextPreview?: string | null;
  retentionPolicy?: StagePlayRawSessionBufferRetentionPolicyV1;
  ttlMs?: number | null;
  evidenceRefs?: string[];
  now?: string | Date;
}): StagePlayRawSessionBufferEntryV1 | null {
  const rawRef = cleanString(input.rawRef);
  const sourceId = cleanString(input.sourceId);
  const threadId = cleanString(input.threadId);
  if (!rawRef || !sourceId || !threadId) return null;

  const nowDate = input.now instanceof Date
    ? input.now
    : input.now
      ? new Date(input.now)
      : new Date();
  const nowIso = Number.isFinite(nowDate.getTime()) ? nowDate.toISOString() : new Date().toISOString();
  const policy = input.retentionPolicy ?? "session_ttl";
  const ttlMs = policy === "session_ttl"
    ? Math.max(0, Math.round(input.ttlMs ?? STAGE_PLAY_RAW_SESSION_BUFFER_DEFAULT_TTL_MS))
    : input.ttlMs ?? null;
  const expiresAt = policy === "session_ttl" && ttlMs != null
    ? new Date(Date.parse(nowIso) + ttlMs).toISOString()
    : null;
  const sessionId = stagePlayRawSessionId({
    threadId,
    roomId: input.roomId ?? null,
    sessionId: input.sessionId ?? null,
  });
  const fromTs = cleanString(input.fromTs) ?? nowIso;
  const toTs = cleanString(input.toTs) ?? fromTs;
  const evidenceRefs = cleanStringArray(input.evidenceRefs);
  const entryId = `stage_play_raw_session_buffer_entry:${hashShort([
    sessionId,
    threadId,
    input.roomId ?? null,
    sourceId,
    input.modality,
    input.sourceEventId ?? null,
    input.rawKind,
    rawRef,
    fromTs,
    toTs,
  ])}`;
  const entry: StagePlayRawSessionBufferEntryV1 = {
    schema: STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA,
    entryId,
    sessionId,
    threadId,
    roomId: input.roomId ?? null,
    sourceId,
    modality: input.modality,
    sourceEventId: input.sourceEventId ?? null,
    fromTs,
    toTs,
    rawKind: input.rawKind,
    rawRef,
    rawTextPreview: clampPreview(input.rawTextPreview),
    retention: {
      policy,
      ttlMs,
      expiresAt,
    },
    evidenceRefs,
    assistant_answer: false,
    context_role: "audit_buffer_not_graph",
  };
  const issues = validateStagePlayRawSessionBufferEntryV1(entry);
  if (issues.length > 0) {
    throw new Error(`invalid_stage_play_raw_session_buffer_entry:${issues.join(";")}`);
  }
  if (policy !== "disabled") entriesById.set(entry.entryId, entry);
  purgeExpiredStagePlayRawSessionBufferEntries(nowDate);
  return entry;
}

export function listStagePlayRawSessionBufferEntries(input: {
  sessionId?: string | null;
  threadId?: string | null;
  roomId?: string | null;
  sourceId?: string | null;
  modality?: string | null;
  limit?: number;
  includeExpired?: boolean;
  now?: Date;
} = {}): StagePlayRawSessionBufferEntryV1[] {
  if (!input.includeExpired) purgeExpiredStagePlayRawSessionBufferEntries(input.now);
  const limit = Math.max(1, Math.min(200, Math.round(input.limit ?? 50)));
  return Array.from(entriesById.values())
    .filter((entry) => !input.sessionId || entry.sessionId === input.sessionId)
    .filter((entry) => !input.threadId || entry.threadId === input.threadId)
    .filter((entry) => input.roomId === undefined || entry.roomId === input.roomId)
    .filter((entry) => !input.sourceId || entry.sourceId === input.sourceId)
    .filter((entry) => !input.modality || entry.modality === input.modality)
    .sort((a, b) => b.toTs.localeCompare(a.toTs) || b.entryId.localeCompare(a.entryId))
    .slice(0, limit);
}

export function getStagePlayRawSessionBufferEntry(entryId: string): StagePlayRawSessionBufferEntryV1 | null {
  purgeExpiredStagePlayRawSessionBufferEntries();
  return entriesById.get(entryId) ?? null;
}

export function clearStagePlayRawSessionBuffer(input: {
  sessionId?: string | null;
  threadId?: string | null;
  roomId?: string | null;
  sourceId?: string | null;
} = {}): { clearedCount: number; clearedEntryIds: string[] } {
  const clearedEntryIds: string[] = [];
  for (const [entryId, entry] of entriesById.entries()) {
    if (input.sessionId && entry.sessionId !== input.sessionId) continue;
    if (input.threadId && entry.threadId !== input.threadId) continue;
    if (input.roomId !== undefined && entry.roomId !== input.roomId) continue;
    if (input.sourceId && entry.sourceId !== input.sourceId) continue;
    entriesById.delete(entryId);
    clearedEntryIds.push(entryId);
  }
  return { clearedCount: clearedEntryIds.length, clearedEntryIds };
}

export function resetStagePlayRawSessionBufferForTest(): void {
  entriesById.clear();
}
