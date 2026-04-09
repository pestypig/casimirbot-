import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type HelixThreadStatus } from "./types";

export type HelixThreadRecord = {
  thread_id: string;
  session_id?: string | null;
  created_at: string;
  updated_at: string;
  status: HelixThreadStatus;
  title_preview?: string | null;
  forked_from_thread_id?: string | null;
  latest_turn_id?: string | null;
  active_turn_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

type HelixThreadIndex = {
  version: 1;
  threads: Record<string, HelixThreadRecord>;
  active_by_session: Record<string, string>;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeMetadata = (
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null =>
  value && typeof value === "object" ? value : null;

const cloneRecord = (record: HelixThreadRecord): HelixThreadRecord => ({
  ...record,
  metadata: record.metadata ? { ...record.metadata } : null,
});

const sortRecords = (records: HelixThreadRecord[]): HelixThreadRecord[] =>
  records
    .slice()
    .sort(
      (a, b) =>
        b.updated_at.localeCompare(a.updated_at) ||
        b.created_at.localeCompare(a.created_at) ||
        a.thread_id.localeCompare(b.thread_id),
    );

const nowIso = (): string => new Date().toISOString();

const buildThreadId = (): string => `thread:${crypto.randomUUID()}`;

let cachedIndexPath: string | null = null;

const getIndexPath = (): string => {
  if (!cachedIndexPath) {
    cachedIndexPath = resolveThreadIndexPath();
  }
  return cachedIndexPath;
};

let cachedIndex = loadThreadIndex();

const persistThreadIndex = (): void => {
  const indexPath = getIndexPath();
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(
    indexPath,
    JSON.stringify(cachedIndex, null, 2),
    "utf8",
  );
};

const upsertThreadRecord = (
  threadId: string,
  patch: Partial<Omit<HelixThreadRecord, "thread_id" | "created_at">> & {
    session_id?: string | null;
  },
): HelixThreadRecord => {
  const existing = cachedIndex.threads[threadId];
  const createdAt = existing?.created_at ?? nowIso();
  const updatedAt = nowIso();
  const next: HelixThreadRecord = {
    thread_id: threadId,
    session_id:
      patch.session_id !== undefined
        ? normalizeOptionalString(patch.session_id)
        : existing?.session_id ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    status: patch.status ?? existing?.status ?? "idle",
    title_preview:
      patch.title_preview !== undefined
        ? normalizeOptionalString(patch.title_preview)
        : existing?.title_preview ?? null,
    forked_from_thread_id:
      patch.forked_from_thread_id !== undefined
        ? normalizeOptionalString(patch.forked_from_thread_id)
        : existing?.forked_from_thread_id ?? null,
    latest_turn_id:
      patch.latest_turn_id !== undefined
        ? normalizeOptionalString(patch.latest_turn_id)
        : existing?.latest_turn_id ?? null,
    active_turn_id:
      patch.active_turn_id !== undefined
        ? normalizeOptionalString(patch.active_turn_id)
        : existing?.active_turn_id ?? null,
    metadata:
      patch.metadata !== undefined
        ? normalizeMetadata(patch.metadata)
        : existing?.metadata ?? null,
  };
  cachedIndex.threads[threadId] = next;
  if (next.session_id) {
    cachedIndex.active_by_session[next.session_id] = threadId;
  }
  persistThreadIndex();
  return cloneRecord(next);
};

export const startHelixThread = (args?: {
  threadId?: string | null;
  sessionId?: string | null;
  titlePreview?: string | null;
  metadata?: Record<string, unknown> | null;
  forkedFromThreadId?: string | null;
}): HelixThreadRecord => {
  const threadId = normalizeOptionalString(args?.threadId) ?? buildThreadId();
  return upsertThreadRecord(threadId, {
    session_id: args?.sessionId ?? null,
    status: "active",
    title_preview: args?.titlePreview ?? null,
    forked_from_thread_id: args?.forkedFromThreadId ?? null,
    metadata: args?.metadata ?? null,
  });
};

export const resumeHelixThread = (args?: {
  threadId?: string | null;
  sessionId?: string | null;
  titlePreview?: string | null;
  metadata?: Record<string, unknown> | null;
}): HelixThreadRecord => {
  const explicitThreadId = normalizeOptionalString(args?.threadId);
  const sessionId = normalizeOptionalString(args?.sessionId);
  const activeThreadId =
    explicitThreadId ??
    (sessionId ? cachedIndex.active_by_session[sessionId] ?? null : null);
  if (activeThreadId && cachedIndex.threads[activeThreadId]) {
    return upsertThreadRecord(activeThreadId, {
      session_id: sessionId ?? cachedIndex.threads[activeThreadId].session_id ?? null,
      status: "active",
      title_preview:
        args?.titlePreview ?? cachedIndex.threads[activeThreadId].title_preview ?? null,
      metadata: args?.metadata ?? cachedIndex.threads[activeThreadId].metadata ?? null,
    });
  }
  return startHelixThread({
    threadId: explicitThreadId,
    sessionId,
    titlePreview: args?.titlePreview ?? null,
    metadata: args?.metadata ?? null,
  });
};

export const forkHelixThread = (args: {
  sourceThreadId: string;
  sessionId?: string | null;
  threadId?: string | null;
  titlePreview?: string | null;
  metadata?: Record<string, unknown> | null;
}): HelixThreadRecord => {
  const sourceThreadId = normalizeOptionalString(args.sourceThreadId);
  if (!sourceThreadId || !cachedIndex.threads[sourceThreadId]) {
    throw new Error("helix_thread_source_not_found");
  }
  const source = cachedIndex.threads[sourceThreadId];
  return startHelixThread({
    threadId: args.threadId ?? null,
    sessionId: args.sessionId ?? source.session_id ?? null,
    titlePreview: args.titlePreview ?? source.title_preview ?? null,
    metadata: {
      ...(source.metadata ?? {}),
      ...(args.metadata ?? {}),
      forked_from_thread_id: sourceThreadId,
    },
    forkedFromThreadId: sourceThreadId,
  });
};

export const readHelixThread = (args: {
  threadId: string;
}): HelixThreadRecord | null => {
  const threadId = normalizeOptionalString(args.threadId);
  if (!threadId) return null;
  const record = cachedIndex.threads[threadId];
  return record ? cloneRecord(record) : null;
};

export const listHelixThreads = (args?: {
  sessionId?: string | null;
  status?: HelixThreadStatus | null;
  includeArchived?: boolean;
}): HelixThreadRecord[] => {
  const sessionId = normalizeOptionalString(args?.sessionId);
  const status = args?.status ?? null;
  const includeArchived = args?.includeArchived === true;
  return sortRecords(Object.values(cachedIndex.threads))
    .filter((record) => (sessionId ? record.session_id === sessionId : true))
    .filter((record) => (status ? record.status === status : true))
    .filter((record) => (includeArchived ? true : record.status !== "archived"))
    .map((record) => cloneRecord(record));
};

export const getActiveHelixThreadForSession = (
  sessionId?: string | null,
): string | null => {
  const normalized = normalizeOptionalString(sessionId);
  if (!normalized) return null;
  const threadId = cachedIndex.active_by_session[normalized];
  return cachedIndex.threads[threadId] ? threadId : null;
};

export const setActiveHelixThreadForSession = (
  sessionId: string,
  threadId: string,
): string | null => {
  const normalizedSessionId = normalizeOptionalString(sessionId);
  const normalizedThreadId = normalizeOptionalString(threadId);
  if (!normalizedSessionId || !normalizedThreadId) return null;
  if (!cachedIndex.threads[normalizedThreadId]) return null;
  cachedIndex.active_by_session[normalizedSessionId] = normalizedThreadId;
  if (cachedIndex.threads[normalizedThreadId].session_id !== normalizedSessionId) {
    cachedIndex.threads[normalizedThreadId] = {
      ...cachedIndex.threads[normalizedThreadId],
      session_id: normalizedSessionId,
      updated_at: nowIso(),
    };
  }
  persistThreadIndex();
  return normalizedThreadId;
};

export const updateHelixThreadRecord = (args: {
  threadId: string;
  patch: Partial<Omit<HelixThreadRecord, "thread_id" | "created_at">>;
}): HelixThreadRecord | null => {
  const threadId = normalizeOptionalString(args.threadId);
  if (!threadId || !cachedIndex.threads[threadId]) return null;
  return upsertThreadRecord(threadId, args.patch);
};

export const archiveHelixThread = (threadId: string): HelixThreadRecord | null => {
  const normalizedThreadId = normalizeOptionalString(threadId);
  if (!normalizedThreadId || !cachedIndex.threads[normalizedThreadId]) return null;
  const record = cachedIndex.threads[normalizedThreadId];
  if (record.session_id && cachedIndex.active_by_session[record.session_id] === normalizedThreadId) {
    delete cachedIndex.active_by_session[record.session_id];
  }
  return upsertThreadRecord(normalizedThreadId, {
    status: "archived",
    active_turn_id: null,
  });
};

export const getHelixThreadIndexPath = (): string => getIndexPath();

export const __resetHelixThreadRegistryStore = (): void => {
  cachedIndexPath = null;
  cachedIndex = {
    version: 1,
    threads: {},
    active_by_session: {},
  };
};

function resolveThreadIndexPath(): string {
  const explicit = process.env.HELIX_THREAD_INDEX_PATH?.trim();
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), ".cal", "helix-thread-index.json");
}

function loadThreadIndex(): HelixThreadIndex {
  try {
    const raw = fs.readFileSync(getIndexPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<HelixThreadIndex>;
    if (
      parsed &&
      parsed.version === 1 &&
      parsed.threads &&
      typeof parsed.threads === "object" &&
      parsed.active_by_session &&
      typeof parsed.active_by_session === "object"
    ) {
      return {
        version: 1,
        threads: Object.fromEntries(
          Object.entries(parsed.threads).map(([threadId, record]) => [
            threadId,
            {
              thread_id: threadId,
              session_id: normalizeOptionalString(record?.session_id),
              created_at:
                typeof record?.created_at === "string" && record.created_at.trim()
                  ? record.created_at.trim()
                  : nowIso(),
              updated_at:
                typeof record?.updated_at === "string" && record.updated_at.trim()
                  ? record.updated_at.trim()
                  : nowIso(),
              status:
                record?.status === "idle" ||
                record?.status === "active" ||
                record?.status === "interrupted" ||
                record?.status === "failed" ||
                record?.status === "archived"
                  ? record.status
                  : "idle",
              title_preview: normalizeOptionalString(record?.title_preview),
              forked_from_thread_id: normalizeOptionalString(
                record?.forked_from_thread_id,
              ),
              latest_turn_id: normalizeOptionalString(record?.latest_turn_id),
              active_turn_id: normalizeOptionalString(record?.active_turn_id),
              metadata: normalizeMetadata(record?.metadata),
            } satisfies HelixThreadRecord,
          ]),
        ),
        active_by_session: Object.fromEntries(
          Object.entries(parsed.active_by_session)
            .map(([sessionId, threadId]) => [
              normalizeOptionalString(sessionId),
              normalizeOptionalString(threadId),
            ])
            .filter(
              (entry): entry is [string, string] => Boolean(entry[0] && entry[1]),
            ),
        ),
      };
    }
  } catch {
    // ignore load errors; start fresh.
  }
  return {
    version: 1,
    threads: {},
    active_by_session: {},
  };
}
