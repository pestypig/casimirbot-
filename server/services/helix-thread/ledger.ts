import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  type HelixThreadAnswerSurfaceMode,
  type HelixThreadClaimLink,
  type HelixThreadClassifierResult,
  type HelixThreadEvent,
  type HelixThreadEventInput,
  type HelixThreadItem,
  type HelixThreadItemStatus,
  type HelixThreadItemStream,
  type HelixThreadItemType,
  type HelixThreadMemoryCitation,
  type HelixThreadRequestKind,
  type HelixThreadServerRequest,
  type HelixThreadServerRequestStatus,
  type HelixThreadStatus,
  type HelixTurnKind,
} from "./types";

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const parseBufferSize = (): number =>
  clampNumber(readNumber(process.env.HELIX_THREAD_BUFFER_SIZE, 300), 50, 4000);

const parseRotateMaxBytes = (): number =>
  clampNumber(
    readNumber(process.env.HELIX_THREAD_ROTATE_MAX_BYTES, 5_000_000),
    1_024,
    200_000_000,
  );

const parseRotateMaxFiles = (): number =>
  clampNumber(readNumber(process.env.HELIX_THREAD_ROTATE_MAX_FILES, 6), 0, 50);

const MAX_BUFFER_SIZE = parseBufferSize();
const LEDGER_PERSIST_ENABLED = process.env.HELIX_THREAD_PERSIST !== "0";
const LEDGER_PATH = resolveLedgerPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const eventBuffer: HelixThreadEvent[] = [];
let eventSequence = 0;
let persistedBytes = loadPersistedBytes();

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipThreadText = (value: unknown, limit = 1200): string | null => {
  const normalized = normalizeOptionalString(value)?.replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const normalizeObjectRecord = (
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null =>
  value && typeof value === "object" ? value : null;

const normalizeStringArray = (
  value: unknown,
  limit: number,
): string[] | null => {
  if (!Array.isArray(value)) return null;
  const next = Array.from(
    new Set(
      value
        .map((entry) => normalizeOptionalString(entry))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ).slice(0, limit);
  return next.length > 0 ? next : null;
};

const normalizeClassifierResult = (
  value: HelixThreadClassifierResult | null | undefined,
): HelixThreadClassifierResult | null => {
  if (!value || typeof value !== "object") return null;
  const normalized: HelixThreadClassifierResult = {
    mode: normalizeOptionalString(value.mode),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? clampNumber(value.confidence, 0, 1)
        : null,
    dispatch_hint:
      typeof value.dispatch_hint === "boolean" ? value.dispatch_hint : null,
    clarify_needed:
      typeof value.clarify_needed === "boolean" ? value.clarify_needed : null,
    reason: clipThreadText(value.reason, 280),
    source: normalizeOptionalString(value.source),
  };
  return Object.values(normalized).some((entry) => entry !== null && entry !== undefined)
    ? normalized
    : null;
};

const normalizeMemoryCitation = (
  value: HelixThreadMemoryCitation | null | undefined,
): HelixThreadMemoryCitation | null => {
  if (!value || typeof value !== "object") return null;
  const entries = Array.isArray(value.entries)
    ? value.entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          path: normalizeOptionalString((entry as { path?: unknown }).path) ?? "",
          line_start:
            typeof (entry as { line_start?: unknown }).line_start === "number" &&
            Number.isFinite((entry as { line_start?: number }).line_start)
              ? Math.max(1, Math.floor((entry as { line_start?: number }).line_start ?? 0))
              : null,
          line_end:
            typeof (entry as { line_end?: unknown }).line_end === "number" &&
            Number.isFinite((entry as { line_end?: number }).line_end)
              ? Math.max(1, Math.floor((entry as { line_end?: number }).line_end ?? 0))
              : null,
          note: clipThreadText((entry as { note?: unknown }).note, 240) ?? "source=thread_event",
        }))
        .filter((entry) => entry.path)
        .slice(0, 16)
    : [];
  const rolloutIds = normalizeStringArray(value.rollout_ids, 12) ?? [];
  if (entries.length === 0 && rolloutIds.length === 0) return null;
  return {
    entries,
    rollout_ids: rolloutIds,
  };
};

const normalizeAnswerSurfaceMode = (
  value: unknown,
): HelixThreadAnswerSurfaceMode | null =>
  value === "conversational" ||
  value === "structured_report" ||
  value === "fail_closed"
    ? value
    : null;

const normalizeThreadStatus = (value: unknown): HelixThreadStatus | null =>
  value === "idle" ||
  value === "active" ||
  value === "interrupted" ||
  value === "failed" ||
  value === "archived"
    ? value
    : null;

const normalizeTurnKind = (value: unknown): HelixTurnKind | null =>
  value === "ask" ||
  value === "conversation_turn" ||
  value === "review" ||
  value === "compact" ||
  value === "auxiliary"
    ? value
    : null;

const normalizeItemType = (value: unknown): HelixThreadItemType | null =>
  value === "userMessage" ||
  value === "classification" ||
  value === "brief" ||
  value === "plan" ||
  value === "retrieval" ||
  value === "toolObservation" ||
  value === "validation" ||
  value === "answer" ||
  value === "requestUserInput" ||
  value === "approval" ||
  value === "commandExecution" ||
  value === "dynamicToolCall" ||
  value === "review" ||
  value === "contextCompaction"
    ? value
    : null;

const normalizeItemStatus = (value: unknown): HelixThreadItemStatus | null =>
  value === "in_progress" ||
  value === "completed" ||
  value === "failed" ||
  value === "declined" ||
  value === "cancelled"
    ? value
    : null;

const normalizeItemStream = (value: unknown): HelixThreadItemStream | null =>
  value === "plan" || value === "answer" || value === "tool" || value === "observation"
    ? value
    : null;

const normalizeRequestKind = (value: unknown): HelixThreadRequestKind | null =>
  value === "request_user_input" || value === "approval" || value === "elicitation"
    ? value
    : null;

const normalizeClaimLinks = (
  value: HelixThreadClaimLink[] | null | undefined,
): HelixThreadClaimLink[] | null => {
  if (!Array.isArray(value)) return null;
  const links = value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      claim_id: normalizeOptionalString((entry as { claim_id?: unknown }).claim_id) ?? "",
      source_item_ids:
        normalizeStringArray(
          (entry as { source_item_ids?: unknown }).source_item_ids,
          24,
        ) ?? [],
    }))
    .filter((entry) => entry.claim_id && entry.source_item_ids.length > 0)
    .slice(0, 24);
  return links.length > 0 ? links : null;
};

const resolveThreadId = (input: HelixThreadEventInput): string => {
  const explicit = normalizeOptionalString(input.thread_id);
  if (explicit) return explicit;
  const sessionId = normalizeOptionalString(input.session_id);
  if (sessionId) return sessionId;
  const traceId = normalizeOptionalString(input.trace_id);
  if (traceId) return `trace:${traceId}`;
  return `turn:${input.turn_id.trim()}`;
};

const sortBySequence = (events: HelixThreadEvent[]): HelixThreadEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

const buildItemStateFromEvents = (events: HelixThreadEvent[]): HelixThreadItem[] => {
  const byItemId = new Map<string, HelixThreadItem>();
  for (const event of sortBySequence(events)) {
    if (!event.item_id || !event.item_type) continue;
    const existing = byItemId.get(event.item_id);
    const next: HelixThreadItem =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        item_id: event.item_id,
        item_type: event.item_type,
        item_status: event.item_status ?? "in_progress",
        item_stream: event.item_stream ?? null,
        started_at: event.ts,
        updated_at: event.ts,
        completed_at: null,
        text: null,
        delta_count: 0,
        last_seq: event.seq,
        source_item_ids: event.source_item_ids ?? null,
        claim_links: event.claim_links ?? null,
        observation_ref: event.observation_ref ?? null,
        meta: event.meta ?? null,
      };
    next.thread_id = event.thread_id;
    next.turn_id = event.turn_id;
    next.item_type = event.item_type ?? next.item_type;
    next.item_stream = event.item_stream ?? next.item_stream ?? null;
    next.item_status = event.item_status ?? next.item_status;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.source_item_ids = event.source_item_ids ?? next.source_item_ids ?? null;
    next.claim_links = event.claim_links ?? next.claim_links ?? null;
    next.observation_ref = event.observation_ref ?? next.observation_ref ?? null;
    next.meta = event.meta ?? next.meta ?? null;
    if (event.event_type === "item_started") {
      next.started_at = existing?.started_at ?? event.ts;
      next.item_status = event.item_status ?? "in_progress";
    }
    if (event.delta_text) {
      next.text = [next.text ?? "", event.delta_text].filter(Boolean).join("");
      next.delta_count += 1;
    }
    if (event.user_text && next.item_type === "userMessage") {
      next.text = event.user_text;
    }
    if (event.assistant_text && next.item_type === "answer") {
      next.text = event.assistant_text;
    }
    if (
      event.event_type === "item_completed" ||
      event.item_status === "completed" ||
      event.item_status === "failed" ||
      event.item_status === "declined" ||
      event.item_status === "cancelled"
    ) {
      next.completed_at = event.ts;
      next.item_status = event.item_status ?? "completed";
    }
    byItemId.set(event.item_id, next);
  }
  return Array.from(byItemId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.started_at.localeCompare(b.started_at),
  );
};

const buildRequestStateFromEvents = (
  events: HelixThreadEvent[],
): HelixThreadServerRequest[] => {
  const byRequestId = new Map<string, HelixThreadServerRequest>();
  for (const event of sortBySequence(events)) {
    if (!event.request_id || !event.request_kind) continue;
    const existing = byRequestId.get(event.request_id);
    const next: HelixThreadServerRequest =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        request_id: event.request_id,
        request_kind: event.request_kind,
        status: "pending",
        created_at: event.ts,
        updated_at: event.ts,
        resolved_at: null,
        payload: event.request_payload ?? null,
        last_seq: event.seq,
      };
    next.thread_id = event.thread_id;
    next.turn_id = event.turn_id;
    next.request_kind = event.request_kind ?? next.request_kind;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.payload = event.request_payload ?? next.payload ?? null;
    if (event.event_type === "server_request_created") {
      next.status = "pending";
      next.created_at = existing?.created_at ?? event.ts;
    } else if (event.event_type === "server_request_resolved") {
      next.status =
        event.item_status === "declined"
          ? "declined"
          : event.item_status === "cancelled"
            ? "cancelled"
            : "resolved";
      next.resolved_at = event.ts;
    }
    byRequestId.set(event.request_id, next);
  }
  return Array.from(byRequestId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.created_at.localeCompare(b.created_at),
  );
};

export const appendHelixThreadEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => {
  const record: HelixThreadEvent = {
    kind: "helix.thread.event",
    version: 1,
    event_id: input.event_id?.trim() || `helix_thread_${crypto.randomUUID()}`,
    seq: ++eventSequence,
    ts: input.ts?.trim() || new Date().toISOString(),
    thread_id: resolveThreadId(input),
    route: input.route,
    event_type: input.event_type,
    turn_id: input.turn_id.trim(),
    session_id: normalizeOptionalString(input.session_id),
    trace_id: normalizeOptionalString(input.trace_id),
    user_text: clipThreadText(input.user_text),
    assistant_text: clipThreadText(input.assistant_text),
    classifier_result: normalizeClassifierResult(input.classifier_result),
    route_reason: clipThreadText(input.route_reason, 220),
    brief_status: normalizeOptionalString(input.brief_status),
    final_gate_outcome: clipThreadText(input.final_gate_outcome, 220),
    fail_reason: clipThreadText(input.fail_reason, 220),
    thread_status: normalizeThreadStatus(input.thread_status),
    turn_kind: normalizeTurnKind(input.turn_kind),
    item_id: normalizeOptionalString(input.item_id),
    item_type: normalizeItemType(input.item_type),
    item_status: normalizeItemStatus(input.item_status),
    item_stream: normalizeItemStream(input.item_stream),
    delta_text: clipThreadText(input.delta_text, 2_400),
    request_id: normalizeOptionalString(input.request_id),
    request_kind: normalizeRequestKind(input.request_kind),
    request_payload: normalizeObjectRecord(input.request_payload),
    observation_ref: normalizeObjectRecord(input.observation_ref),
    source_item_ids: normalizeStringArray(input.source_item_ids, 24),
    claim_links: normalizeClaimLinks(input.claim_links),
    answer_surface_mode: normalizeAnswerSurfaceMode(input.answer_surface_mode),
    memory_citation: normalizeMemoryCitation(input.memory_citation),
    meta: normalizeObjectRecord(input.meta),
  };
  eventBuffer.push(record);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.splice(0, eventBuffer.length - MAX_BUFFER_SIZE);
  }
  persistLedgerRecord(record);
  return record;
};

export const appendHelixThreadLifecycleEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => appendHelixThreadEvent(input);

export const appendHelixTurnEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => appendHelixThreadEvent(input);

export const appendHelixThreadItemEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => appendHelixThreadEvent(input);

export const appendHelixThreadServerRequestEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => appendHelixThreadEvent(input);

export const getHelixThreadLedgerEvents = (options?: {
  sessionId?: string | null;
  threadId?: string | null;
  turnId?: string | null;
  itemId?: string | null;
  requestId?: string | null;
  limit?: number | null;
}): HelixThreadEvent[] => {
  const limit =
    options?.limit === null || options?.limit === undefined || Number.isNaN(options.limit)
      ? null
      : Math.max(1, Math.floor(options.limit));
  const sessionId = normalizeOptionalString(options?.sessionId);
  const threadId = normalizeOptionalString(options?.threadId);
  const turnId = normalizeOptionalString(options?.turnId);
  const itemId = normalizeOptionalString(options?.itemId);
  const requestId = normalizeOptionalString(options?.requestId);
  const persisted = LEDGER_PERSIST_ENABLED
    ? readPersistedEvents({ limit, sessionId, threadId, turnId, itemId, requestId })
    : [];
  const merged = new Map<string, HelixThreadEvent>();
  for (const event of [...persisted, ...eventBuffer]) {
    if (sessionId && event.session_id !== sessionId) continue;
    if (threadId && event.thread_id !== threadId) continue;
    if (turnId && event.turn_id !== turnId) continue;
    if (itemId && event.item_id !== itemId) continue;
    if (requestId && event.request_id !== requestId) continue;
    merged.set(event.event_id, event);
  }
  const ordered = sortBySequence(Array.from(merged.values()));
  return limit === null ? ordered : ordered.slice(-limit);
};

export const getHelixThreadItems = (args: {
  threadId: string;
  turnId?: string | null;
}): HelixThreadItem[] =>
  buildItemStateFromEvents(
    getHelixThreadLedgerEvents({
      threadId: args.threadId,
      turnId: args.turnId ?? null,
    }),
  );

export const getHelixThreadRequests = (args: {
  threadId: string;
  unresolvedOnly?: boolean;
}): HelixThreadServerRequest[] => {
  const requests = buildRequestStateFromEvents(
    getHelixThreadLedgerEvents({
      threadId: args.threadId,
    }),
  );
  return args.unresolvedOnly ? requests.filter((entry) => entry.status === "pending") : requests;
};

export const getHelixThreadLedgerPath = (): string => LEDGER_PATH;

export const __resetHelixThreadLedgerStore = (): void => {
  eventBuffer.length = 0;
  eventSequence = 0;
  persistedBytes = 0;
};

function resolveLedgerPath(): string {
  const explicit = process.env.HELIX_THREAD_LEDGER_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.HELIX_THREAD_LEDGER_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "helix-thread-ledger.jsonl");
}

function collectLedgerPaths(): string[] {
  const dir = path.dirname(LEDGER_PATH);
  const ext = path.extname(LEDGER_PATH) || ".jsonl";
  const base = path.basename(LEDGER_PATH, ext);
  const prefix = `${base}.`;
  const rotated =
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir, { withFileTypes: true })
          .filter(
            (entry) =>
              entry.isFile() &&
              entry.name.startsWith(prefix) &&
              entry.name.endsWith(ext),
          )
          .map((entry) => path.join(dir, entry.name))
          .sort()
      : [];
  return fs.existsSync(LEDGER_PATH) ? [...rotated, LEDGER_PATH] : rotated;
}

function parseLedgerRecord(line: string): HelixThreadEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<HelixThreadEvent>;
    if (
      parsed.kind !== "helix.thread.event" ||
      parsed.version !== 1 ||
      typeof parsed.event_id !== "string" ||
      !parsed.event_id.trim() ||
      typeof parsed.thread_id !== "string" ||
      !parsed.thread_id.trim() ||
      typeof parsed.turn_id !== "string" ||
      !parsed.turn_id.trim() ||
      typeof parsed.route !== "string" ||
      typeof parsed.event_type !== "string" ||
      typeof parsed.seq !== "number" ||
      !Number.isFinite(parsed.seq) ||
      typeof parsed.ts !== "string" ||
      !parsed.ts.trim()
    ) {
      return null;
    }
    return {
      kind: "helix.thread.event",
      version: 1,
      event_id: parsed.event_id.trim(),
      seq: Math.max(0, Math.floor(parsed.seq)),
      ts: parsed.ts.trim(),
      thread_id: parsed.thread_id.trim(),
      route:
        parsed.route === "/ask" || parsed.route === "/ask/conversation-turn"
          ? parsed.route
          : "/ask",
      event_type: parsed.event_type as HelixThreadEvent["event_type"],
      turn_id: parsed.turn_id.trim(),
      session_id: normalizeOptionalString(parsed.session_id),
      trace_id: normalizeOptionalString(parsed.trace_id),
      user_text: clipThreadText(parsed.user_text),
      assistant_text: clipThreadText(parsed.assistant_text),
      classifier_result: normalizeClassifierResult(parsed.classifier_result),
      route_reason: clipThreadText(parsed.route_reason, 220),
      brief_status: normalizeOptionalString(parsed.brief_status),
      final_gate_outcome: clipThreadText(parsed.final_gate_outcome, 220),
      fail_reason: clipThreadText(parsed.fail_reason, 220),
      thread_status: normalizeThreadStatus(parsed.thread_status),
      turn_kind: normalizeTurnKind(parsed.turn_kind),
      item_id: normalizeOptionalString(parsed.item_id),
      item_type: normalizeItemType(parsed.item_type),
      item_status: normalizeItemStatus(parsed.item_status),
      item_stream: normalizeItemStream(parsed.item_stream),
      delta_text: clipThreadText(parsed.delta_text, 2_400),
      request_id: normalizeOptionalString(parsed.request_id),
      request_kind: normalizeRequestKind(parsed.request_kind),
      request_payload: normalizeObjectRecord(parsed.request_payload),
      observation_ref: normalizeObjectRecord(parsed.observation_ref),
      source_item_ids: normalizeStringArray(parsed.source_item_ids, 24),
      claim_links: normalizeClaimLinks(parsed.claim_links),
      answer_surface_mode: normalizeAnswerSurfaceMode(parsed.answer_surface_mode),
      memory_citation: normalizeMemoryCitation(parsed.memory_citation),
      meta: normalizeObjectRecord(parsed.meta),
    };
  } catch {
    return null;
  }
}

function readPersistedEvents(options?: {
  limit?: number | null;
  sessionId?: string | null;
  threadId?: string | null;
  turnId?: string | null;
  itemId?: string | null;
  requestId?: string | null;
}): HelixThreadEvent[] {
  if (!LEDGER_PERSIST_ENABLED) return [];
  const parsed: HelixThreadEvent[] = [];
  for (const filePath of collectLedgerPaths()) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const record = parseLedgerRecord(line);
        if (!record) continue;
        if (options?.sessionId && record.session_id !== options.sessionId) continue;
        if (options?.threadId && record.thread_id !== options.threadId) continue;
        if (options?.turnId && record.turn_id !== options.turnId) continue;
        if (options?.itemId && record.item_id !== options.itemId) continue;
        if (options?.requestId && record.request_id !== options.requestId) continue;
        parsed.push(record);
      }
    } catch {
      continue;
    }
  }
  const ordered = sortBySequence(parsed);
  if (options?.limit === null || options?.limit === undefined) return ordered;
  return ordered.slice(-Math.max(1, Math.floor(options.limit)));
}

function loadPersistedBytes(): number {
  if (!LEDGER_PERSIST_ENABLED) return 0;
  try {
    const stat = fs.statSync(LEDGER_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function persistLedgerRecord(record: HelixThreadEvent): void {
  if (!LEDGER_PERSIST_ENABLED) return;
  const line = JSON.stringify(record);
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  maybeRotateLedger(lineBytes);
  fs.appendFileSync(LEDGER_PATH, `${line}\n`, "utf8");
  persistedBytes += lineBytes;
}

function maybeRotateLedger(nextBytes: number): void {
  if (ROTATE_MAX_BYTES <= 0) return;
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) return;
  rotateLedger();
}

function rotateLedger(): void {
  if (!fs.existsSync(LEDGER_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(LEDGER_PATH);
  const ext = path.extname(LEDGER_PATH) || ".jsonl";
  const base = path.basename(LEDGER_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  fs.renameSync(LEDGER_PATH, rotated);
  persistedBytes = 0;
  pruneLedgerRotations(dir, base, ext);
}

function pruneLedgerRotations(dir: string, base: string, ext: string): void {
  if (ROTATE_MAX_FILES <= 0 || !fs.existsSync(dir)) return;
  const prefix = `${base}.`;
  const candidates = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(prefix) &&
        entry.name.endsWith(ext),
    )
    .map((entry) => entry.name)
    .sort();
  const excess = candidates.length - ROTATE_MAX_FILES;
  if (excess <= 0) return;
  for (const name of candidates.slice(0, excess)) {
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      // ignore pruning failures
    }
  }
}

function hydrateFromPersisted(): void {
  const persisted = readPersistedEvents({ limit: MAX_BUFFER_SIZE });
  if (persisted.length === 0) return;
  eventBuffer.push(...persisted);
  eventSequence = persisted.reduce((max, entry) => Math.max(max, entry.seq), 0);
}

hydrateFromPersisted();

