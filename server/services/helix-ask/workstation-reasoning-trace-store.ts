import fs from "node:fs";
import path from "node:path";
import type { HelixWorkstationReasoningTrace } from "@shared/helix-workstation-reasoning-trace";

const tracesByThread = new Map<string, HelixWorkstationReasoningTrace[]>();
const tracesById = new Map<string, HelixWorkstationReasoningTrace>();
const hydratedThreads = new Set<string>();
const TRACE_DIR = path.resolve(process.cwd(), ".cal/workstation-reasoning-traces");

const shouldPersist = (): boolean => process.env.NODE_ENV !== "test";

const safeThreadFileName = (threadId: string): string =>
  `${threadId.replace(/[^a-zA-Z0-9_.-]/g, "_")}.jsonl`;

const tracePath = (threadId: string): string =>
  path.join(TRACE_DIR, safeThreadFileName(threadId));

const hydrateThread = (threadId: string): void => {
  if (!shouldPersist() || hydratedThreads.has(threadId)) return;
  hydratedThreads.add(threadId);
  const filePath = tracePath(threadId);
  if (!fs.existsSync(filePath)) return;
  const entries = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as HelixWorkstationReasoningTrace);
  tracesByThread.set(threadId, entries.slice(-500));
  for (const trace of entries.slice(-500)) tracesById.set(trace.trace_id, trace);
};

const persistTrace = (trace: HelixWorkstationReasoningTrace): void => {
  if (!shouldPersist()) return;
  fs.mkdirSync(TRACE_DIR, { recursive: true });
  fs.appendFileSync(tracePath(trace.thread_id), `${JSON.stringify(trace)}\n`, "utf8");
};

export function recordWorkstationReasoningTrace(
  trace: HelixWorkstationReasoningTrace,
): HelixWorkstationReasoningTrace {
  hydrateThread(trace.thread_id);
  const existingThread = tracesByThread.get(trace.thread_id) ?? [];
  const withoutSameTurn = existingThread.filter(
    (entry) => entry.trace_id !== trace.trace_id && entry.turn_id !== trace.turn_id,
  );
  const nextThread = [...withoutSameTurn, trace].slice(-500);
  tracesByThread.set(trace.thread_id, nextThread);
  tracesById.set(trace.trace_id, trace);
  for (const stale of existingThread) {
    if (stale.turn_id === trace.turn_id && stale.trace_id !== trace.trace_id) {
      tracesById.delete(stale.trace_id);
    }
  }
  persistTrace(trace);
  return trace;
}

export function listWorkstationReasoningTraces(input: {
  threadId: string;
  limit?: number;
}): HelixWorkstationReasoningTrace[] {
  hydrateThread(input.threadId);
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 50))) : 50;
  return [...(tracesByThread.get(input.threadId) ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function getWorkstationReasoningTrace(traceId: string): HelixWorkstationReasoningTrace | null {
  if (!tracesById.has(traceId) && shouldPersist()) {
    if (fs.existsSync(TRACE_DIR)) {
      for (const fileName of fs.readdirSync(TRACE_DIR)) {
        if (!fileName.endsWith(".jsonl")) continue;
        const threadId = fileName.replace(/\.jsonl$/i, "");
        hydrateThread(threadId);
        if (tracesById.has(traceId)) break;
      }
    }
  }
  return tracesById.get(traceId) ?? null;
}

export function getLatestWorkstationReasoningTrace(input: {
  threadId: string;
  turnId?: string | null;
}): HelixWorkstationReasoningTrace | null {
  hydrateThread(input.threadId);
  const traces = tracesByThread.get(input.threadId) ?? [];
  if (input.turnId) {
    const byTurn = traces.find((trace) => trace.turn_id === input.turnId);
    if (byTurn) return byTurn;
  }
  return traces.at(-1) ?? null;
}

export function clearWorkstationReasoningTracesForTest(): void {
  tracesByThread.clear();
  tracesById.clear();
  hydratedThreads.clear();
}
