import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import type { ToolManifestEntry } from "@shared/skills";
import type { TTaskTrace } from "@shared/essence-persona";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import { Routine, type TRoutine } from "@shared/agi-instructions";
import {
  DEFAULT_SUMMARY_FOCUS,
  type ExecutorStep,
  type PlanNode,
  buildChatBPlan,
  compilePlan,
  executeCompiledPlan,
  summarizeExecutionResults,
  renderChatBPlannerPrompt,
  registerInMemoryTrace,
} from "../services/planner/chat-b";
import { buildWhyBelongs } from "../services/planner/why-belongs";
import { getTool, listTools, registerTool } from "../skills";
import { llmLocalHandler, llmLocalSpec } from "../skills/llm.local";
import { lumaGenerateHandler, lumaGenerateSpec } from "../skills/luma.generate";
import { sttWhisperHandler, sttWhisperSpec } from "../skills/stt.whisper";
import { readmeHandler, readmeSpec } from "../skills/docs.readme";
import { essenceMixHandler, essenceMixSpec } from "../skills/essence.mix";
import { saveTaskTrace } from "../db/agi";
import { metrics, sseConnections } from "../metrics";
import { personaPolicy } from "../auth/policy";
import { getToolLogs, getToolLogsSince, subscribeToolLogs, type ToolLogRecord } from "../services/observability/tool-log-store";
import { ensureSpecialistsRegistered } from "../specialists/bootstrap";
import { hullModeEnabled, shouldRegisterExternalAdapter } from "../security/hull-guard";
import { readKnowledgeConfig } from "../config/knowledge";
import { fetchKnowledgeForProjects } from "../services/knowledge/corpus";
import {
  buildKnowledgeValidator,
  KnowledgeValidationError,
  estimateKnowledgeContextBytes,
} from "../services/knowledge/validation";

const planRouter = Router();
const LOCAL_SPAWN_TOOL_NAME = "llm.local.spawn.generate";
const TRACE_SSE_LIMIT = (() => {
  const fallback = 50;
  const raw = Number(process.env.TRACE_SSE_BUFFER ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  const clamped = Math.floor(raw);
  return Math.min(250, Math.max(1, clamped));
})();

type PlanRecord = {
  traceId: string;
  createdAt: string;
  goal: string;
  personaId: string;
  planDsl: string;
  nodes: PlanNode[];
  executorSteps: ExecutorStep[];
  manifest: ToolManifestEntry[];
  plannerPrompt: string;
  taskTrace: TTaskTrace;
  knowledgeContext?: KnowledgeProjectExport[];
};

const planRecords = new Map<string, PlanRecord>();

const contains = (value: string, pattern: RegExp) => pattern.test(value.toLowerCase());

const hullMode = hullModeEnabled();
if (hullMode) {
  process.env.LLM_POLICY = "local";
}

const knowledgeConfig = readKnowledgeConfig();
const validateKnowledgeContext = buildKnowledgeValidator(knowledgeConfig);
const MAX_KNOWLEDGE_PREVIEW_CHARS = 2000;

function validateOutputSchema(output: unknown, schema?: TRoutine["knobs"]["final_output"]): { pass: boolean; reason?: string } {
  if (!schema) {
    return { pass: true };
  }
  try {
    if (schema.type) {
      const type = Array.isArray(output) ? "array" : output === null ? "null" : typeof output;
      if (type !== schema.type) {
        return { pass: false, reason: `expected type ${schema.type}, got ${type}` };
      }
    }
    if (schema.type === "object" && output && typeof output === "object") {
      const required = Array.isArray(schema.required) ? schema.required : [];
      for (const key of required) {
        if (!(key in (output as Record<string, unknown>))) {
          return { pass: false, reason: `missing required key: ${key}` };
        }
      }
    }
    return { pass: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { pass: false, reason: message };
  }
}

function sanitizeKnowledgeContextForTrace(projects?: KnowledgeProjectExport[]): KnowledgeProjectExport[] | undefined {
  if (!projects || projects.length === 0) {
    return undefined;
  }
  return projects.map((project) => ({
    project: {
      id: project.project.id,
      name: project.project.name,
      tags: project.project.tags,
      type: project.project.type,
      hashSlug: project.project.hashSlug,
    },
    summary: project.summary,
    approxBytes: project.approxBytes,
    omittedFiles: project.omittedFiles,
    files: project.files.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mime: file.mime,
      size: file.size,
      hashSlug: file.hashSlug,
      projectId: file.projectId,
      kind: file.kind,
      preview: clipKnowledgePreview(file.preview),
    })),
  }));
}

function clipKnowledgePreview(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized.length <= MAX_KNOWLEDGE_PREVIEW_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_KNOWLEDGE_PREVIEW_CHARS)}...`;
}

function mergeKnowledgeBundles(
  base?: KnowledgeProjectExport[],
  extra?: KnowledgeProjectExport[],
): KnowledgeProjectExport[] | undefined {
  if ((!base || base.length === 0) && (!extra || extra.length === 0)) {
    return undefined;
  }
  const map = new Map<string, KnowledgeProjectExport>();
  for (const bundle of base ?? []) {
    map.set(bundle.project.id, { ...bundle, files: [...bundle.files] });
  }
  for (const bundle of extra ?? []) {
    const existing = map.get(bundle.project.id);
    if (!existing) {
      map.set(bundle.project.id, { ...bundle, files: [...bundle.files] });
      continue;
    }
    const seen = new Set(existing.files.map((file) => file.id));
    const mergedFiles = [...existing.files];
    for (const file of bundle.files) {
      if (seen.has(file.id)) {
        continue;
      }
      mergedFiles.push(file);
      seen.add(file.id);
    }
    const mergedOmitted = [
      ...(existing.omittedFiles ?? []),
      ...(bundle.omittedFiles ?? []),
    ].filter(Boolean);
    map.set(bundle.project.id, {
      project: existing.project,
      summary: existing.summary ?? bundle.summary,
      files: mergedFiles,
      approxBytes: (existing.approxBytes ?? 0) + (bundle.approxBytes ?? 0),
      omittedFiles: mergedOmitted.length > 0 ? mergedOmitted : undefined,
    });
  }
  return Array.from(map.values());
}

function selectToolForGoal(goal: string, manifest: ToolManifestEntry[]): string {
  const available = new Set(manifest.map((entry) => entry.name));
  const prefersLocalSpawn =
    process.env.LLM_POLICY?.toLowerCase() === "local" && available.has(LOCAL_SPAWN_TOOL_NAME);
  const fallback = prefersLocalSpawn
    ? LOCAL_SPAWN_TOOL_NAME
    : manifest.find((entry) => entry.name === llmLocalSpec.name)?.name ?? manifest[0]?.name ?? llmLocalSpec.name;
  const normalized = goal.toLowerCase();

  const hasTool = (name: string) => available.has(name);

  if (hasTool(readmeSpec.name) && contains(normalized, /(read\s?me|readme|documentation|docs?)/)) {
    return readmeSpec.name;
  }
  if (
    hasTool(lumaGenerateSpec.name) &&
    contains(normalized, /\b(image|picture|render|visual|art|illustration|photo|graphic)\b/)
  ) {
    return lumaGenerateSpec.name;
  }
  if (hasTool("vision.http.describe") && contains(normalized, /\b(image|photo|picture|screenshot|diagram|figure)\b/)) {
    return "vision.http.describe";
  }
  if (hasTool(sttWhisperSpec.name) && contains(normalized, /\b(audio|transcribe|speech|voice|recording)\b/)) {
    return sttWhisperSpec.name;
  }
  return fallback;
}

const KnowledgeFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().optional(),
  mime: z.string(),
  size: z.number().nonnegative(),
  hashSlug: z.string().optional(),
  kind: z.enum(["text","json","code","audio","image"]),
  preview: z.string().max(8192).optional(),
  contentBase64: z.string().max(131072).optional(),
});

const KnowledgeProjectSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    tags: z.array(z.string()).optional(),
    type: z.string().optional(),
    hashSlug: z.string().optional(),
  }),
  summary: z.string().max(4096).optional(),
  files: z.array(KnowledgeFileSchema).max(knowledgeConfig.maxFilesPerProject),
  approxBytes: z.number().int().nonnegative().optional(),
  omittedFiles: z.array(z.string()).optional(),
});

const PlanRequest = z.object({
  goal: z.string().min(3, "goal required"),
  personaId: z.string().min(1).default("default"),
  searchQuery: z.string().optional(),
  topK: z.coerce.number().int().min(1).max(10).default(5),
  summaryFocus: z.string().optional(),
  knowledgeContext: z.array(KnowledgeProjectSchema).optional(),
  knowledgeProjects: z.array(z.string().min(1).max(128)).max(32).optional(),
  routineId: z.string().min(1).optional(),
  routine: Routine.optional(),
});

const ExecuteRequest = z.object({
  traceId: z.string().min(8, "traceId required"),
});

const ToolLogsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(250).default(TRACE_SSE_LIMIT),
  tool: z
    .string()
    .min(1, "tool name required")
    .transform((value) => value.trim())
    .optional(),
});

const PHYSICS_TOOL_NAME = "physics.curvature.unit";

async function ensureDefaultTools(): Promise<void> {
  if (!getTool(llmLocalSpec.name)) {
    registerTool({ ...llmLocalSpec, handler: llmLocalHandler });
  }
  if (process.env.ENABLE_LLM_LOCAL_SPAWN === "1" && !getTool(LOCAL_SPAWN_TOOL_NAME)) {
    const { llmLocalSpawnSpec, llmLocalSpawnHandler } = await import("../skills/llm.local.spawn");
    registerTool({ ...llmLocalSpawnSpec, handler: llmLocalSpawnHandler });
  }
  if (!getTool(readmeSpec.name)) {
    registerTool({ ...readmeSpec, handler: readmeHandler });
  }
  if (!getTool(lumaGenerateSpec.name)) {
    registerTool({ ...lumaGenerateSpec, handler: lumaGenerateHandler });
  }
  if (!getTool(sttWhisperSpec.name)) {
    registerTool({ ...sttWhisperSpec, handler: sttWhisperHandler });
  }
  if (!getTool(essenceMixSpec.name)) {
    registerTool({ ...essenceMixSpec, handler: essenceMixHandler });
  }
  const llmHttpBase = process.env.LLM_HTTP_BASE?.trim();
  if (llmHttpBase && !getTool("llm.http.generate")) {
    const gate = shouldRegisterExternalAdapter(llmHttpBase);
    if (gate.allowed) {
      const { llmHttpSpec, llmHttpHandler } = await import("../skills/llm.http");
      registerTool({ ...llmHttpSpec, handler: llmHttpHandler });
    } else if (hullMode) {
      console.warn(`[agi.plan] HULL_MODE: skipping external llm.http.generate (${llmHttpBase})`);
    }
  }
  const whisperHttpUrl = process.env.WHISPER_HTTP_URL?.trim();
  if (whisperHttpUrl && !getTool("stt.whisper.http.transcribe")) {
    const gate = shouldRegisterExternalAdapter(whisperHttpUrl);
    if (gate.allowed) {
      const { sttHttpSpec, sttHttpHandler } = await import("../skills/stt.whisper.http");
      registerTool({ ...sttHttpSpec, handler: sttHttpHandler });
    } else if (hullMode) {
      console.warn(`[agi.plan] HULL_MODE: skipping external stt.whisper.http (${whisperHttpUrl})`);
    }
  }
  const diffHttpUrl = process.env.DIFF_HTTP_URL?.trim();
  if (diffHttpUrl && !getTool("luma.http.generate")) {
    const gate = shouldRegisterExternalAdapter(diffHttpUrl);
    if (gate.allowed) {
      const { lumaHttpSpec, lumaHttpHandler } = await import("../skills/luma.http");
      registerTool({ ...lumaHttpSpec, handler: lumaHttpHandler });
    } else if (hullMode) {
      console.warn(`[agi.plan] HULL_MODE: skipping external luma.http.generate (${diffHttpUrl})`);
    }
  }
  const visionHttpBase = process.env.VISION_HTTP_BASE?.trim();
  if (visionHttpBase && !getTool("vision.http.describe")) {
    const gate = shouldRegisterExternalAdapter(visionHttpBase);
    if (gate.allowed) {
      const { visionHttpSpec, visionHttpHandler } = await import("../skills/vision.http");
      registerTool({ ...visionHttpSpec, handler: visionHttpHandler });
    } else if (hullMode) {
      console.warn(`[agi.plan] HULL_MODE: skipping external vision.http.describe (${visionHttpBase})`);
    }
  }
  if (process.env.ENABLE_PHYSICS === "1" && !getTool(PHYSICS_TOOL_NAME)) {
    const { curvatureUnitSpec, curvatureUnitHandler } = await import("../skills/physics.curvature");
    registerTool({ ...curvatureUnitSpec, handler: curvatureUnitHandler });
  }
}

planRouter.post("/plan", async (req, res) => {
  await ensureDefaultTools();
  await ensureSpecialistsRegistered();
  const parsed = PlanRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }

  let { personaId } = parsed.data;
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const { goal, searchQuery, topK, summaryFocus } = parsed.data;
  let knowledgeContext: KnowledgeProjectExport[] | undefined;
  if (parsed.data.knowledgeContext && parsed.data.knowledgeContext.length > 0) {
    if (!knowledgeConfig.enabled) {
      return res.status(400).json({ error: "knowledge_projects_disabled" });
    }
    try {
      knowledgeContext = validateKnowledgeContext(parsed.data.knowledgeContext);
    } catch (error) {
      if (error instanceof KnowledgeValidationError) {
        return res.status(error.status).json({ error: "knowledge_context_invalid", message: error.message });
      }
      throw error;
    }
  }

  const requestedProjects =
    parsed.data.knowledgeProjects?.map((id) => id.trim()).filter((id) => id.length > 0) ?? [];

  if (knowledgeConfig.enabled && requestedProjects.length > 0) {
    const inlineBytes = estimateKnowledgeContextBytes(knowledgeContext);
    const remainingBudget = Math.max(0, knowledgeConfig.contextBytes - inlineBytes);
    if (remainingBudget > 0) {
      try {
        const fetched = await fetchKnowledgeForProjects(requestedProjects, {
          goal,
          maxBytes: remainingBudget,
          maxFilesPerProject: knowledgeConfig.maxFilesPerProject,
        });
        if (fetched.length > 0) {
          knowledgeContext = mergeKnowledgeBundles(knowledgeContext, fetched);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[knowledge] failed to fetch corpus attachments: ${message}`);
      }
    }
  }
  const routine: TRoutine | undefined = parsed.data.routine
    ? Routine.parse(parsed.data.routine)
    : parsed.data.routineId
    ? { id: parsed.data.routineId, name: parsed.data.routineId, version: "1" } as TRoutine
    : undefined;
  const manifest = listTools();
  const chooserText = [goal, searchQuery ?? ""]
    .map((value) => (value ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const selectedTool = selectToolForGoal(chooserText || goal, manifest);
  const query = (searchQuery ?? goal).trim();
  const focus = summaryFocus?.trim() || DEFAULT_SUMMARY_FOCUS;

  const plannerPrompt = renderChatBPlannerPrompt({
    goal,
    personaId,
    manifest,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    knowledgeContext,
  });
  const { nodes, planDsl } = buildChatBPlan({
    goal,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    finalTool: selectedTool,
  });
  const executorStepsAll = compilePlan(nodes);
  const maxTurns = routine?.knobs?.max_turns;
  const executorSteps =
    typeof maxTurns === "number" && Number.isFinite(maxTurns)
      ? executorStepsAll.slice(0, Math.max(1, Math.min(executorStepsAll.length, Math.floor(maxTurns))))
      : executorStepsAll;
  const traceId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const persistedKnowledgeContext = sanitizeKnowledgeContextForTrace(knowledgeContext) ?? [];
  const taskTrace: TTaskTrace = {
    id: traceId,
    persona_id: personaId,
    created_at: createdAt,
    goal,
    plan_json: nodes,
    steps: [],
    approvals: [],
    knowledgeContext: persistedKnowledgeContext,
    plan_manifest: manifest,
    routine_json: routine,
  };

  const record: PlanRecord = {
    traceId,
    createdAt,
    goal,
    personaId,
    planDsl,
    nodes,
    executorSteps,
    manifest,
    plannerPrompt,
    taskTrace,
    knowledgeContext,
  };

  registerInMemoryTrace(taskTrace);
  planRecords.set(traceId, record);
  await saveTaskTrace(taskTrace);

  res.json({
    traceId,
    goal,
    personaId,
    created_at: createdAt,
    planner_prompt: plannerPrompt,
    plan_dsl: planDsl,
    plan_steps: nodes,
    tool_manifest: manifest,
    executor_steps: executorSteps,
    task_trace: taskTrace,
    knowledge_context: knowledgeContext,
  });
});

// Lightweight manifest endpoint for quick adapter visibility checks
planRouter.get("/tools/manifest", (_req, res) => {
  try {
    const manifest = listTools();
    res.json(manifest);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "manifest_error", message });
  }
});

planRouter.post("/execute", async (req, res) => {
  await ensureDefaultTools();
  await ensureSpecialistsRegistered();
  const parsed = ExecuteRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { traceId } = parsed.data;
  const record = planRecords.get(traceId);
  if (!record) {
    return res.status(404).json({ error: "trace_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, record.personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  const start = Date.now();
  const steps = await executeCompiledPlan(record.executorSteps, {
    goal: record.goal,
    personaId: record.personaId,
    sessionId: traceId,
    taskTrace: record.taskTrace,
    knowledgeContext: record.knowledgeContext,
  });
  const duration = Date.now() - start;
  let ok = steps.length > 0 && steps.every((step) => step.ok);
  // Enforce routine final_output schema if present
  const routine = (record.taskTrace as any).routine_json as TRoutine | undefined;
  const verdict = validateOutputSchema(steps[steps.length - 1]?.output, routine?.knobs?.final_output);
  if (!verdict.pass) {
    ok = false;
    steps.push({
      id: "final.output",
      kind: "final.output",
      ok: false,
      error: { message: verdict.reason ?? "final output schema mismatch", type: "final_output_schema_mismatch" },
      citations: [],
      latency_ms: 0,
      essence_ids: [],
    } as any);
  }
  metrics.recordTask(duration, ok);
  record.taskTrace.ok = record.taskTrace.ok ?? ok;
  record.taskTrace.steps = steps;
  const summary = record.taskTrace.result_summary ?? summarizeExecutionResults(steps);
  record.taskTrace.result_summary = summary;
  await saveTaskTrace(record.taskTrace);
  const whyBelongs = buildWhyBelongs({
    goal: record.goal,
    traceId,
    summary,
    executorSteps: record.executorSteps,
    results: steps,
    knowledgeContext: record.knowledgeContext,
  });

  res.json({
    traceId,
    goal: record.goal,
    personaId: record.personaId,
    plan_dsl: record.planDsl,
    ok,
    steps,
    result_summary: summary,
    task_trace: record.taskTrace,
    why_belongs: whyBelongs,
  });
});

planRouter.get("/tools/logs", (req, res) => {
  const parsed = ToolLogsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { limit, tool } = parsed.data;
  const logs = getToolLogs({ limit, tool });
  res.json({ logs, limit, tool });
});

planRouter.get("/tools/logs/stream", (req, res) => {
  const parsed = ToolLogsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { limit, tool } = parsed.data;
  const lastEventId = req.get("last-event-id") ?? req.get("Last-Event-ID");
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`retry: 3000\n\n`);
  sseConnections.inc();

  const ping = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      // ignore, close handler will clean up
    }
  }, 25000);

  const sendEvent = (entry: ToolLogRecord): void => {
    try {
      res.write(`id: ${entry.seq}\ndata: ${JSON.stringify(entry)}\n\n`);
    } catch {
      // connection closed, let close handler clean up
    }
  };

  const backlog = lastEventId
    ? getToolLogsSince(lastEventId, { tool })
    : getToolLogs({ limit, tool }).sort((a, b) => a.seq - b.seq);
  for (const entry of backlog) {
    sendEvent(entry);
  }

  const unsubscribe = subscribeToolLogs((entry) => {
    if (tool && entry.tool !== tool) {
      return;
    }
    sendEvent(entry);
  });
  const teardown = () => {
    clearInterval(ping);
    try {
      sseConnections.dec();
    } catch {
      // ignore metrics errors
    }
    unsubscribe();
    try {
      res.end();
    } catch {
      // ignore
    }
  };
  req.on("close", teardown);
  req.on("error", teardown);
});

export { planRouter };
