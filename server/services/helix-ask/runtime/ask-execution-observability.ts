import type { HelixAskTraceEvent } from "../surface/response-debug-payload";

type ProgressLogArgs = {
  stage: string;
  detail?: string;
  sessionId?: string;
  traceId?: string;
  startedAt?: number;
  ok?: boolean;
};

type AppendToolLogArgs = {
  tool: string;
  version: string;
  paramsHash: string;
  durationMs: number;
  sessionId?: string;
  traceId?: string;
  ok: boolean;
  stage?: string;
  detail?: string;
  message?: string;
  meta?: Record<string, unknown>;
  text?: string;
};

const HELIX_ASK_EVENT_TOOL = "helix.ask.event";
const HELIX_ASK_EVENT_VERSION = "v1";

export const createHelixAskExecutionObservability = (args: {
  askSessionId?: string;
  askTraceId: string;
  debugLogsEnabled: boolean;
  captureLiveHistory: boolean;
  eventHistoryLimit: number;
  eventMaxChars: number;
  eventFileLimit: number;
  reportContext?: { blockIndex?: number; blockCount?: number } | null;
  logProgressRecord: (args: ProgressLogArgs) => void;
  appendToolLog: (args: AppendToolLogArgs) => void;
  hashProgress: (value: string) => string;
  consoleLog?: (...args: unknown[]) => void;
}) => {
  const liveEventHistory: HelixAskTraceEvent[] = [];
  const consoleLog = args.consoleLog ?? console.log;

  const logDebug = (message: string, detail?: Record<string, unknown>): void => {
    if (!args.debugLogsEnabled) return;
    const tag = `[HELIX_ASK_DEBUG:${Date.now()}]`;
    if (detail) {
      try {
        consoleLog(tag, message, JSON.stringify(detail));
      } catch {
        consoleLog(tag, message);
      }
      return;
    }
    consoleLog(tag, message);
  };

  const clipEventText = (value?: string): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.length <= args.eventMaxChars) return trimmed;
    return `${trimmed.slice(0, Math.max(0, args.eventMaxChars - 3))}...`;
  };

  const pushLiveEvent = (entry: Omit<HelixAskTraceEvent, "ts">): void => {
    if (!args.captureLiveHistory) return;
    liveEventHistory.push({
      ts: new Date().toISOString(),
      ...entry,
    });
    const limit = Math.max(1, args.eventHistoryLimit);
    if (liveEventHistory.length > limit) {
      if (limit < 32) {
        liveEventHistory.splice(0, liveEventHistory.length - limit);
        return;
      }
      const prefixCount = Math.max(12, Math.min(24, Math.floor(limit * 0.25)));
      const tailCount = Math.max(1, limit - prefixCount);
      const prefix = liveEventHistory.slice(0, prefixCount);
      const tail = liveEventHistory.slice(-tailCount);
      liveEventHistory.length = 0;
      liveEventHistory.push(...prefix, ...tail);
    }
  };

  const formatFileList = (files: string[] | undefined): string | undefined => {
    if (!files || files.length === 0) return undefined;
    const unique = Array.from(
      new Set(
        files
          .map((entry) => entry?.trim())
          .filter((entry): entry is string => Boolean(entry)),
      ),
    );
    if (unique.length === 0) return undefined;
    const preview = unique.slice(0, args.eventFileLimit);
    const remainder = unique.length - preview.length;
    const body = preview.map((entry) => `- ${entry}`).join("\n");
    return remainder > 0 ? `${body}\n- ...and ${remainder} more` : body;
  };

  const logProgress = (stage: string, detail?: string, startedAt?: number, ok?: boolean): void => {
    args.logProgressRecord({
      stage,
      detail,
      sessionId: args.askSessionId,
      traceId: args.askTraceId,
      startedAt,
      ok,
    });
    const cleanedDetail = detail?.trim();
    const label = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
    const elapsedMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0;
    pushLiveEvent({
      tool: "helix.ask.progress",
      stage,
      detail: cleanedDetail,
      ok,
      durationMs: elapsedMs,
      text: clipEventText(label),
      meta: typeof startedAt === "number" ? { elapsedMs } : undefined,
    });
  };

  const logEvent = (
    stage: string,
    detail?: string,
    text?: string,
    startedAt?: number,
    ok = true,
    meta?: Record<string, unknown>,
  ): void => {
    if (!args.askSessionId) return;
    const cleanedDetail = detail?.trim();
    const header = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
    const body = clipEventText(text);
    const elapsedMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0;
    const baseMeta =
      args.reportContext?.blockIndex !== undefined
        ? { blockIndex: args.reportContext.blockIndex, blockCount: args.reportContext.blockCount }
        : undefined;
    const mergedMeta = meta ? { ...(baseMeta ?? {}), ...meta } : baseMeta;
    args.appendToolLog({
      tool: HELIX_ASK_EVENT_TOOL,
      version: HELIX_ASK_EVENT_VERSION,
      paramsHash: args.hashProgress(`event:${stage}:${cleanedDetail ?? ""}`),
      durationMs: elapsedMs,
      sessionId: args.askSessionId,
      traceId: args.askTraceId,
      ok,
      stage,
      detail: cleanedDetail,
      message: header,
      meta: mergedMeta,
      text: body ? `${header}\n${body}` : header,
    });
    pushLiveEvent({
      tool: HELIX_ASK_EVENT_TOOL,
      stage,
      detail: cleanedDetail,
      ok,
      durationMs: elapsedMs,
      text: body ? `${header}\n${body}` : header,
      meta: mergedMeta,
    });
  };

  const logStepStart = (
    stage: string,
    detail?: string,
    meta?: Record<string, unknown>,
  ): number => {
    const startedAt = Date.now();
    logProgress(stage, "start", startedAt);
    logEvent(stage, "start", detail, undefined, true, meta);
    return startedAt;
  };

  const logStepEnd = (
    stage: string,
    detail: string | undefined,
    startedAt: number,
    ok = true,
    meta?: Record<string, unknown>,
  ): void => {
    logProgress(stage, ok ? "done" : "error", startedAt, ok);
    logEvent(stage, ok ? "done" : "error", detail, startedAt, ok, meta);
  };

  return {
    clipEventText,
    formatFileList,
    liveEventHistory,
    logDebug,
    logEvent,
    logProgress,
    logStepEnd,
    logStepStart,
  };
};
