import { ensureDatabase, getPool } from "../../db/client";

export type MissionBoardStoredEvent = {
  eventId: string;
  missionId: string;
  type: string;
  classification: string;
  text: string;
  ts: string;
  fromState?: string;
  toState?: string;
  evidenceRefs: string[];
  timerId?: string;
  timerKind?: "countdown" | "deadline";
  timerStatus?: "scheduled" | "running" | "expired" | "cancelled" | "completed";
  timerDueTs?: string;
  derivedFromEventId?: string;
  ackRefId?: string;
  metrics?: {
    trigger_to_debrief_closed_ms?: number;
  };
};

type MissionBoardStore = {
  listEvents: (missionId: string) => Promise<MissionBoardStoredEvent[]>;
  appendEvent: (missionId: string, event: MissionBoardStoredEvent) => Promise<void>;
};

type MissionBoardRow = {
  id: string;
  mission_id: string;
  type: string;
  classification: string;
  event_ts: Date | string;
  payload: unknown;
};

const memoryEvents = new Map<string, MissionBoardStoredEvent[]>();
let resolvedStore: MissionBoardStore | null = null;
let warnedStoreError = false;

const getMemoryEvents = (missionId: string): MissionBoardStoredEvent[] => {
  const existing = memoryEvents.get(missionId);
  if (existing) return existing;
  const created: MissionBoardStoredEvent[] = [];
  memoryEvents.set(missionId, created);
  return created;
};

const sortEvents = (events: MissionBoardStoredEvent[]): MissionBoardStoredEvent[] =>
  [...events].sort((a, b) => {
    const tsDiff = Date.parse(a.ts) - Date.parse(b.ts);
    return tsDiff !== 0 ? tsDiff : a.eventId.localeCompare(b.eventId);
  });

const toIso = (value: Date | string): string => {
  if (value instanceof Date) return value.toISOString();
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
};

const readPayload = (
  value: unknown,
): {
  text?: string;
  fromState?: string;
  toState?: string;
  evidenceRefs?: unknown;
  derivedFromEventId?: unknown;
  ackRefId?: unknown;
  metrics?: unknown;
  timerId?: unknown;
  timerKind?: unknown;
  timerStatus?: unknown;
  timerDueTs?: unknown;
} => {
  if (!value) return {};
  if (typeof value === "object") {
    return value as {
      text?: string;
      fromState?: string;
      toState?: string;
      evidenceRefs?: unknown;
      derivedFromEventId?: unknown;
      ackRefId?: unknown;
      metrics?: unknown;
      timerId?: unknown;
      timerKind?: unknown;
      timerStatus?: unknown;
      timerDueTs?: unknown;
    };
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as {
        text?: string;
        fromState?: string;
        toState?: string;
        evidenceRefs?: unknown;
        derivedFromEventId?: unknown;
        ackRefId?: unknown;
        metrics?: unknown;
        timerId?: unknown;
        timerKind?: unknown;
        timerStatus?: unknown;
        timerDueTs?: unknown;
      };
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeEvidenceRefs = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const refs = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (trimmed) refs.add(trimmed);
  }
  return [...refs];
};


const normalizeMetrics = (value: unknown): { trigger_to_debrief_closed_ms?: number } | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as { trigger_to_debrief_closed_ms?: unknown }).trigger_to_debrief_closed_ms;
  if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate < 0) return undefined;
  return { trigger_to_debrief_closed_ms: Math.floor(candidate) };
};

const rowToEvent = (row: MissionBoardRow): MissionBoardStoredEvent => {
  const payload = readPayload(row.payload);
  return {
    eventId: row.id,
    missionId: row.mission_id,
    type: row.type,
    classification: row.classification,
    text: typeof payload.text === "string" ? payload.text : "Mission update",
    ts: toIso(row.event_ts),
    fromState: typeof payload.fromState === "string" ? payload.fromState : undefined,
    toState: typeof payload.toState === "string" ? payload.toState : undefined,
    evidenceRefs: normalizeEvidenceRefs(payload.evidenceRefs),
    timerId: typeof payload.timerId === "string" ? payload.timerId : undefined,
    timerKind: payload.timerKind === "countdown" || payload.timerKind === "deadline" ? payload.timerKind : undefined,
    timerStatus:
      payload.timerStatus === "scheduled" ||
      payload.timerStatus === "running" ||
      payload.timerStatus === "expired" ||
      payload.timerStatus === "cancelled" ||
      payload.timerStatus === "completed"
        ? payload.timerStatus
        : undefined,
    timerDueTs: typeof payload.timerDueTs === "string" ? payload.timerDueTs : undefined,
    derivedFromEventId: typeof payload.derivedFromEventId === "string" ? payload.derivedFromEventId : undefined,
    ackRefId: typeof payload.ackRefId === "string" ? payload.ackRefId : undefined,
    metrics: normalizeMetrics(payload.metrics),
  };
};

const memoryStore: MissionBoardStore = {
  listEvents: async (missionId) => sortEvents(getMemoryEvents(missionId)),
  appendEvent: async (missionId, event) => {
    const events = getMemoryEvents(missionId);
    if (events.some((entry) => entry.eventId === event.eventId)) return;
    events.push(event);
  },
};

const dbStore: MissionBoardStore = {
  listEvents: async (missionId) => {
    await ensureDatabase();
    const pool = getPool();
    const { rows } = await pool.query<MissionBoardRow>(
      `SELECT id, mission_id, type, classification, event_ts, payload
       FROM mission_board_events
       WHERE mission_id = $1
       ORDER BY event_ts ASC, id ASC`,
      [missionId],
    );
    return rows.map(rowToEvent);
  },
  appendEvent: async (missionId, event) => {
    await ensureDatabase();
    const pool = getPool();
    await pool.query(
      `INSERT INTO mission_board_events
        (id, mission_id, type, classification, event_ts, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.eventId,
        missionId,
        event.type,
        event.classification,
        event.ts,
        JSON.stringify({
          text: event.text,
          fromState: event.fromState ?? null,
          toState: event.toState ?? null,
          evidenceRefs: event.evidenceRefs,
          timerId: event.timerId ?? null,
          timerKind: event.timerKind ?? null,
          timerStatus: event.timerStatus ?? null,
          timerDueTs: event.timerDueTs ?? null,
          derivedFromEventId: event.derivedFromEventId ?? null,
          ackRefId: event.ackRefId ?? null,
          metrics: event.metrics ?? null,
        }),
      ],
    );
  },
};

const shouldUseMemoryStore = (): boolean => {
  const explicit = process.env.MISSION_BOARD_STORE?.trim().toLowerCase();
  if (explicit === "memory" || explicit === "mem" || explicit === "inmemory") {
    return true;
  }
  if (process.env.USE_INMEM_MISSION_BOARD_STORE === "1") {
    return true;
  }
  return !Boolean(process.env.DATABASE_URL?.trim());
};

const resolveStore = async (): Promise<MissionBoardStore> => {
  if (resolvedStore) return resolvedStore;
  if (shouldUseMemoryStore()) {
    resolvedStore = memoryStore;
    return resolvedStore;
  }

  try {
    await ensureDatabase();
    resolvedStore = dbStore;
    return resolvedStore;
  } catch (error) {
    if (!warnedStoreError) {
      warnedStoreError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[mission-board] db store unavailable, falling back to memory: ${message}`);
    }
    resolvedStore = memoryStore;
    return resolvedStore;
  }
};

export const listMissionBoardEvents = async (missionId: string): Promise<MissionBoardStoredEvent[]> => {
  const store = await resolveStore();
  return store.listEvents(missionId);
};

export const appendMissionBoardEvent = async (
  missionId: string,
  event: MissionBoardStoredEvent,
): Promise<void> => {
  const store = await resolveStore();
  await store.appendEvent(missionId, event);
};

export const __resetMissionBoardStoreForTest = (): void => {
  resolvedStore = null;
  warnedStoreError = false;
  memoryEvents.clear();
};
