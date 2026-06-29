export type AskLiveEventEntry = {
  id: string;
  text: string;
  tool?: string;
  ts?: string | number;
  tsMs?: number;
  seq?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

function summarizeVoiceDebugText(source: string, maxChars = 220): string {
  const text = source.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function safeJsonStringify(value: unknown, fallback = "Unable to render debug payload."): string {
  const normalize = (input: unknown, stack: WeakSet<object>): unknown => {
    if (typeof input === "bigint") return input.toString();
    if (!input || typeof input !== "object") return input;
    if (stack.has(input)) return "[Circular]";
    stack.add(input);
    if (Array.isArray(input)) {
      const out = input.map((entry) => normalize(entry, stack));
      stack.delete(input);
      return out;
    }
    const out: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, entry]) => {
      out[key] = normalize(entry, stack);
    });
    stack.delete(input);
    return out;
  };
  try {
    return JSON.stringify(normalize(value, new WeakSet<object>()), null, 2);
  } catch {
    return fallback;
  }
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function resolveAskLiveEventTimestampMs(event: AskLiveEventEntry): number | null {
  if (typeof event.tsMs === "number" && Number.isFinite(event.tsMs)) {
    return event.tsMs;
  }
  return parseTimestampMs(event.ts);
}

export function formatAskLiveEventLogLine(event: AskLiveEventEntry): string {
  const tsMs = resolveAskLiveEventTimestampMs(event);
  const timestamp =
    tsMs === null
      ? "time"
      : new Date(tsMs).toISOString().split("T")[1]?.replace("Z", "") ?? "time";
  const toolLabel = event.tool?.trim()
    ? event.tool.startsWith("helix.ask.")
      ? event.tool.replace("helix.ask.", "").replace(/\./g, " ")
      : event.tool
    : "event";
  const stageLabel =
    event.meta && typeof event.meta.stage === "string" ? String(event.meta.stage).trim() : "";
  const detailLabel =
    event.meta && typeof event.meta.detail === "string" ? String(event.meta.detail).trim() : "";
  const statusLabel =
    event.meta && typeof event.meta.status === "string" ? String(event.meta.status).trim() : "";
  const parts: string[] = [`tool=${toolLabel}`];
  if (stageLabel) parts.push(`stage=${stageLabel}`);
  if (statusLabel) parts.push(`status=${statusLabel}`);
  if (detailLabel) parts.push(`detail=${detailLabel}`);
  if (typeof event.seq === "number" && Number.isFinite(event.seq)) {
    parts.push(`seq=${Math.max(0, Math.trunc(event.seq))}`);
  }
  if (typeof event.durationMs === "number" && Number.isFinite(event.durationMs)) {
    parts.push(`dur=${Math.max(0, Math.round(event.durationMs))}ms`);
  }
  const text = summarizeVoiceDebugText(event.text ?? "", 220) || "event";
  return `[${timestamp}] ${parts.join(" | ")} | text=${text}`;
}

export function buildAskLiveEventLogExport(events: AskLiveEventEntry[]): string {
  if (!events.length) return "";
  return events.map((event) => formatAskLiveEventLogLine(event)).join("\n");
}

export function buildAskLiveEventLogDetailPayload(event: AskLiveEventEntry): string {
  const payload = {
    id: event.id,
    ts: event.ts ?? null,
    tsMs: resolveAskLiveEventTimestampMs(event),
    tool: typeof event.tool === "string" ? event.tool : null,
    seq: typeof event.seq === "number" && Number.isFinite(event.seq) ? event.seq : null,
    durationMs:
      typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
        ? Math.max(0, Math.round(event.durationMs))
        : null,
    text: typeof event.text === "string" ? event.text : "",
    meta: event.meta ?? null,
  };
  return safeJsonStringify(payload);
}

export function readEventMetaString(
  meta: Record<string, unknown> | undefined,
  keys: string[],
): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function parseHelixAskQueuedQuestionsInput(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  return normalized ? [normalized] : [];
}
