import { Router } from "express";
import { z } from "zod";
import type { TMemoryRecord } from "@shared/essence-persona";
import { personaPolicy } from "../auth/policy";
import { listMemoryRecords } from "../services/essence/memory-store";
import { getTaskTraceById } from "../db/agi";
import { __getTaskTrace } from "../services/planner/chat-b";

const memoryTraceRouter = Router();
const Query = z.object({
  k: z.coerce.number().int().min(1).max(50).default(10),
});

const featureEnabled = (): boolean =>
  process.env.ENABLE_TRACE_API === "1" && process.env.ENABLE_MEMORY_UI === "1";

const REFLECTION_LIMIT = 8;

memoryTraceRouter.get("/by-trace/:traceId", async (req, res) => {
  if (!featureEnabled()) {
    return res.status(404).json({ error: "memory_ui_disabled" });
  }
  const traceId = req.params.traceId?.trim();
  if (!traceId) {
    return res.status(400).json({ error: "bad_request", message: "traceId required" });
  }
  const parsed = Query.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_query", details: parsed.error.issues });
  }
  const trace = (await getTaskTraceById(traceId).catch(() => null)) ?? __getTaskTrace(traceId);
  if (!trace) {
    return res.status(404).json({ error: "trace_not_found", traceId });
  }
  if (!personaPolicy.canAccess(req.auth, trace.persona_id, "memory:read")) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const records = await listMemoryRecords();
    const { k } = parsed.data;
    const matchKeys = new Set([`session:${traceId}`, `task:${traceId}`]);
    const memories = records
      .filter((record) => hasMatchingKey(record, matchKeys))
      .sort(sortByCreatedDesc)
      .slice(0, k)
      .map(toSummary);
    const reflections = records
      .filter(
        (record) =>
          record.kind === "procedural" &&
          record.keys?.some((key) => key === `task:${traceId}`) &&
          record.owner_id === trace.persona_id,
      )
      .sort(sortByCreatedDesc)
      .slice(0, Math.min(k, REFLECTION_LIMIT))
      .map(toSummary);

    return res.json({
      traceId,
      personaId: trace.persona_id,
      top_k: k,
      memories,
      reflections,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "memory_lookup_failed", message });
  }
});

const hasMatchingKey = (record: TMemoryRecord, match: Set<string>): boolean => {
  if (!Array.isArray(record.keys) || record.keys.length === 0) {
    return false;
  }
  return record.keys.some((key) => match.has(key));
};

const sortByCreatedDesc = (a: TMemoryRecord, b: TMemoryRecord): number => {
  const tsA = safeTs(a.created_at);
  const tsB = safeTs(b.created_at);
  return tsB - tsA;
};

const safeTs = (value?: string): number => {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const toSummary = (record: TMemoryRecord) => ({
  id: record.id,
  kind: record.kind,
  owner_id: record.owner_id,
  created_at: record.created_at,
  keys: Array.isArray(record.keys) ? record.keys : [],
  snippet: buildSnippet(record.text),
  essence_id: record.essence_id,
});

const buildSnippet = (text?: string): string => {
  if (!text) {
    return "";
  }
  const trimmed = text.trim();
  if (trimmed.length <= 280) {
    return trimmed;
  }
  return `${trimmed.slice(0, 277)}...`;
};

export { memoryTraceRouter };
