import { Router, type Request, type Response } from "express";
import type { TTaskTrace } from "@shared/essence-persona";
import { personaPolicy } from "../auth/policy";
import { traceExportTotal } from "../metrics";

export const traceRouter = Router();

const exportEnabled = (): boolean => process.env.ENABLE_TRACE_EXPORT === "1";
type AuthedRequest = Request & { auth?: unknown };

traceRouter.get("/:id", async (req: AuthedRequest, res) => {
  const id = req.params.id?.trim();
  if (!id) {
    return res.status(400).json({ error: "bad_request", message: "id required" });
  }
  try {
    const trace = await resolveTrace(req, res, id);
    if (!trace) {
      return;
    }
    res.json(trace);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "trace_error", message });
  }
});

traceRouter.get("/:id/export", async (req: AuthedRequest, res) => {
  if (!exportEnabled()) {
    return res.status(404).json({ error: "export_disabled" });
  }
  const id = req.params.id?.trim();
  if (!id) {
    return res.status(400).json({ error: "bad_request", message: "id required" });
  }
  try {
    const trace = await resolveTrace(req, res, id);
    if (!trace) {
      return;
    }
    const payload = {
      version: "essence-trace-export/1.0",
      trace,
      plan: Array.isArray(trace.plan_json) ? trace.plan_json : [],
      executor_steps: Array.isArray(trace.steps) ? trace.steps : [],
      tool_manifest: Array.isArray(trace.plan_manifest) ? trace.plan_manifest : [],
      knowledge_context: Array.isArray(trace.knowledgeContext) ? trace.knowledgeContext : [],
      routine: (trace as any).routine_json ?? null,
      env: {
        hull_mode: process.env.HULL_MODE === "1",
        llm_policy: process.env.LLM_POLICY ?? "remote",
      },
    };
    try {
      traceExportTotal.inc();
    } catch {
      /* metrics best effort */
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="trace-${id}.json"`);
    res.send(JSON.stringify(payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "trace_export_error", message });
  }
});

async function resolveTrace(req: AuthedRequest, res: Response, id: string): Promise<TTaskTrace | null> {
  const trace = await loadTrace(id);
  if (!trace) {
    res.status(404).json({ error: "not_found", id });
    return null;
  }
  if (!personaPolicy.canAccess(req.auth, trace.persona_id, "plan")) {
    res.status(403).json({ error: "forbidden" });
    return null;
  }
  return trace;
}

async function loadTrace(id: string): Promise<TTaskTrace | null> {
  const dal = await import("../db/agi").catch(() => null);
  if (dal) {
    if (typeof (dal as any).getTaskTraceById === "function") {
      const fromDal = await (dal as any).getTaskTraceById(id);
      if (fromDal) {
        return fromDal;
      }
    } else if (typeof (dal as any).getTaskTrace === "function") {
      const legacyTrace = await (dal as any).getTaskTrace(id);
      if (legacyTrace) {
        return legacyTrace;
      }
    }
  }
  const inMemory = ((await import("../services/planner/chat-b").catch(() => null)) as any)?.__getTaskTrace?.(id);
  return inMemory ?? null;
}
