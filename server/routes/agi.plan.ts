import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import type { ToolManifestEntry } from "@shared/skills";
import type { TTaskTrace } from "@shared/essence-persona";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import type { ResonanceBundle, ResonanceCollapse } from "@shared/code-lattice";
import { Routine, type TRoutine } from "@shared/agi-instructions";
import {
  DEFAULT_SUMMARY_FOCUS,
  formatPlanDsl,
  type BuildPlanArgs,
  type ExecutorStep,
  type PlanNode,
  buildChatBPlan,
  buildCandidatePlansFromResonance,
  compilePlan,
  executeCompiledPlan,
  summarizeExecutionResults,
  renderChatBPlannerPrompt,
  registerInMemoryTrace,
  collapseResonancePatches,
} from "../services/planner/chat-b";
import { saveConsoleTelemetry, getConsoleTelemetry } from "../services/console-telemetry/store";
import { persistConsoleTelemetrySnapshot } from "../services/console-telemetry/persist";
import { summarizeConsoleTelemetry } from "../services/console-telemetry/summarize";
import { ensureCasimirTelemetry } from "../services/casimir/telemetry";
import { buildWhyBelongs } from "../services/planner/why-belongs";
import { getTool, listTools, registerTool } from "../skills";
import { llmLocalHandler, llmLocalSpec } from "../skills/llm.local";
import { lumaGenerateHandler, lumaGenerateSpec } from "../skills/luma.generate";
import { badgeTelemetryHandler, badgeTelemetrySpec } from "../skills/telemetry.badges";
import { panelSnapshotHandler, panelSnapshotSpec } from "../skills/telemetry.panels";
import { sttWhisperHandler, sttWhisperSpec } from "../skills/stt.whisper";
import { readmeHandler, readmeSpec } from "../skills/docs.readme";
import { essenceMixHandler, essenceMixSpec } from "../skills/essence.mix";
import { debateRunHandler, debateRunSpec } from "../skills/debate.run";
import { docsEvidenceSearchMdHandler, docsEvidenceSearchMdSpec } from "../skills/docs.evidence.search.md";
import { docsEvidenceSearchPdfHandler, docsEvidenceSearchPdfSpec } from "../skills/docs.evidence.search.pdf";
import { docsHeadingSectionHandler, docsHeadingSectionSpec } from "../skills/docs.heading.section.md";
import { docsTableExtractHandler, docsTableExtractSpec } from "../skills/docs.table.extract";
import { debateClaimExtractHandler, debateClaimExtractSpec } from "../skills/debate.claim.extract";
import { citationVerifySpanHandler, citationVerifySpanSpec } from "../skills/citation.verify.span";
import { docsContradictionScanHandler, docsContradictionScanSpec } from "../skills/docs.contradiction.scan";
import { numericExtractUnitsHandler, numericExtractUnitsSpec } from "../skills/numeric.extract.units";
import {
  debateChecklistGenerateAliasSpec,
  debateChecklistGenerateHandler,
  debateChecklistGenerateSpec,
} from "../skills/debate.checklist.generate";
import {
  debateChecklistScoreAliasSpec,
  debateChecklistScoreHandler,
  debateChecklistScoreSpec,
} from "../skills/debate.checklist.score";
import { experimentFalsifierProposeHandler, experimentFalsifierProposeSpec } from "../skills/experiment.falsifier.propose";
import { telemetryCrosscheckDocsHandler, telemetryCrosscheckDocsSpec } from "../skills/telemetry.crosscheck.docs";
import { getTaskTrace, saveTaskTrace } from "../db/agi";
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
import { mergeKnowledgeBundles } from "../services/knowledge/merge";
import { buildResonanceBundle } from "../services/code-lattice/resonance";
import { getLatticeVersion } from "../services/code-lattice/loader";
import { collectBadgeTelemetry } from "../services/telemetry/badges";
import { collectPanelSnapshots } from "../services/telemetry/panels";

const planRouter = Router();
const LOCAL_SPAWN_TOOL_NAME = "llm.local.spawn.generate";
const HTTP_TOOL_NAME = "llm.http.generate";
const TRACE_SSE_LIMIT = (() => {
  const fallback = 50;
  const raw = Number(process.env.TRACE_SSE_BUFFER ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  const clamped = Math.floor(raw);
  return Math.min(250, Math.max(1, clamped));
})();
const DEFAULT_DESKTOP_ID = "helix.desktop.main";

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
  knowledgeHash?: string | null;
  knowledgeHints?: string[];
  desktopId?: string;
  telemetry?: ConsoleTelemetryBundle | null;
  telemetrySummary?: string | null;
  resonance?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  latticeVersion?: number | string | null;
  debateId?: string | null;
};

const planRecords = new Map<string, PlanRecord>();

async function rehydratePlanRecord(traceId: string): Promise<PlanRecord | null> {
  try {
    const trace = await getTaskTrace(traceId);
    if (!trace) {
      return null;
    }
    const taskTrace: TTaskTrace = {
      ...trace,
      telemetry_bundle: (trace as any).telemetry_bundle ?? trace.telemetry_bundle ?? null,
      telemetry_summary: (trace as any).telemetry_summary ?? trace.telemetry_summary ?? null,
      resonance_bundle: (trace as any).resonance_bundle ?? trace.resonance_bundle ?? null,
      resonance_selection: (trace as any).resonance_selection ?? trace.resonance_selection ?? null,
      lattice_version: (trace as any).lattice_version ?? trace.lattice_version ?? null,
      planner_prompt: trace.planner_prompt ?? (trace as any).planner_prompt ?? null,
      debate_id: (trace as any).debate_id ?? trace.debate_id ?? null,
    };
    const nodes = Array.isArray(trace.plan_json) ? (trace.plan_json as PlanNode[]) : [];
    const executorSteps = nodes.length > 0 ? compilePlan(nodes) : [];
    const manifest = Array.isArray(trace.plan_manifest) ? (trace.plan_manifest as ToolManifestEntry[]) : listTools();
    const planDsl = nodes.length > 0 ? formatPlanDsl(nodes) : "";
    const record: PlanRecord = {
      traceId,
      createdAt: trace.created_at,
      goal: trace.goal,
      personaId: trace.persona_id,
      planDsl,
      nodes,
      executorSteps,
      manifest,
      plannerPrompt: taskTrace.planner_prompt ?? "",
      taskTrace,
      knowledgeContext: taskTrace.knowledgeContext,
      knowledgeHash: (trace as any).knowledge_hash ?? hashKnowledgeContext(taskTrace.knowledgeContext),
      knowledgeHints: Array.isArray((trace as any).knowledge_hints)
        ? ((trace as any).knowledge_hints as string[])
        : [],
      desktopId: DEFAULT_DESKTOP_ID,
      telemetry: taskTrace.telemetry_bundle ?? null,
      telemetrySummary: taskTrace.telemetry_summary ?? null,
      resonance: taskTrace.resonance_bundle ?? null,
      resonanceSelection: taskTrace.resonance_selection ?? null,
      latticeVersion: taskTrace.lattice_version ?? null,
      debateId: taskTrace.debate_id ?? null,
    };
    registerInMemoryTrace(taskTrace);
    return record;
  } catch (error) {
    console.warn(`[agi.plan] failed to rehydrate trace ${traceId}:`, error);
    return null;
  }
}

const contains = (value: string, pattern: RegExp) => pattern.test(value.toLowerCase());

const hullMode = hullModeEnabled();
if (hullMode) {
  process.env.LLM_POLICY = "local";
}

const knowledgeConfig = readKnowledgeConfig();
const validateKnowledgeContext = buildKnowledgeValidator(knowledgeConfig);
const MAX_KNOWLEDGE_PREVIEW_CHARS = 2000;
const KNOWLEDGE_FETCH_TIMEOUT_MS = (() => {
  const fallback = 5000;
  const raw = Number(process.env.KNOWLEDGE_FETCH_TIMEOUT_MS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.floor(raw);
})();
const RESONANCE_BUILD_TIMEOUT_MS = (() => {
  const fallback = 5000;
  const raw = Number(process.env.RESONANCE_BUILD_TIMEOUT_MS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.floor(raw);
})();
const SAVE_TASK_TRACE_TIMEOUT_MS = (() => {
  const fallback = 4000;
  const raw = Number(process.env.SAVE_TASK_TRACE_TIMEOUT_MS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.floor(raw);
})();

const normalizeKnowledgeForHash = (ctx?: KnowledgeProjectExport[]): object | null => {
  if (!ctx || ctx.length === 0) {
    return null;
  }
  const projects = ctx.map((project) => ({
    id: project.project.id,
    hashSlug: project.project.hashSlug,
    files: (project.files ?? [])
      .map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path,
        hashSlug: file.hashSlug,
        size: file.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  }));
  projects.sort((a, b) => a.id.localeCompare(b.id));
  return projects;
};

const hashKnowledgeContext = (ctx?: KnowledgeProjectExport[]): string | null => {
  const normalized = normalizeKnowledgeForHash(ctx);
  if (!normalized) {
    return null;
  }
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label = "operation"): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
    }),
  ]);
}

const buildKnowledgeHints = (args: {
  telemetry?: ConsoleTelemetryBundle | null;
  resonanceBundle?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  limit?: number;
}): string[] => {
  const hints = new Set<string>();
  for (const panel of args.telemetry?.panels ?? []) {
    for (const source of panel.sourceIds ?? []) {
      if (source) {
        hints.add(source);
      }
    }
  }
  const candidates = args.resonanceBundle?.candidates ?? [];
  const primaryId = args.resonanceSelection?.primaryPatchId;
  const preferred =
    (primaryId && candidates.find((c) => c.id === primaryId)) ??
    (args.resonanceSelection?.ranking
      ?.map((entry) => entry.patchId)
      .map((id) => candidates.find((c) => c.id === id))
      .find(Boolean) ??
      candidates[0]);
  if (preferred) {
    const nodes = preferred.nodes
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, Math.max(1, args.limit ?? 6));
    for (const node of nodes) {
      if (node.symbol) {
        hints.add(node.symbol);
      }
      if (node.filePath) {
        hints.add(node.filePath);
      }
    }
  }
  return Array.from(hints).slice(0, Math.max(4, args.limit ?? 8));
};

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

function selectToolForGoal(goal: string, manifest: ToolManifestEntry[]): string {
  const available = new Set(manifest.map((entry) => entry.name));
  const prefersLocalSpawn =
    process.env.LLM_POLICY?.toLowerCase() === "local" && available.has(LOCAL_SPAWN_TOOL_NAME);
  const fallback = prefersLocalSpawn
    ? LOCAL_SPAWN_TOOL_NAME
    : available.has(HTTP_TOOL_NAME)
        ? HTTP_TOOL_NAME
        : manifest.find((entry) => entry.name === llmLocalSpec.name)?.name ?? manifest[0]?.name ?? llmLocalSpec.name;
  const normalized = goal.toLowerCase();

  const hasTool = (name: string) => available.has(name);

  if (
    hasTool(badgeTelemetrySpec.name) &&
    contains(normalized, /(badge|badges|telemetry|casimir|tile\s+grid|drive\s+guard|guard\s+badge|proof|solution)/)
  ) {
    return badgeTelemetrySpec.name;
  }
  if (
    hasTool(panelSnapshotSpec.name) &&
    contains(normalized, /\b(panel|render|display|hud|overlay|what'?s\s+showing|screenshot|ui)\b/)
  ) {
    return panelSnapshotSpec.name;
  }
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

const PanelTelemetrySchema = z.object({
  panelId: z.string().min(1),
  instanceId: z.string().min(1),
  title: z.string().min(1),
  kind: z.string().min(1).optional(),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  flags: z.record(z.boolean()).optional(),
  strings: z.record(z.string()).optional(),
  bands: z
    .array(
      z.object({
        name: z.string().min(1),
        q: z.number().optional(),
        coherence: z.number().optional(),
        occupancy: z.number().optional(),
        event_rate: z.number().optional(),
        last_event: z.string().optional(),
      }),
    )
    .max(24)
    .optional(),
  tile_sample: z
    .object({
      total: z.number().int().nonnegative().optional(),
      active: z.number().int().nonnegative().optional(),
      hot: z.array(z.number()).max(256).optional(),
    })
    .optional(),
  sourceIds: z.array(z.string().min(1)).max(16).optional(),
  notes: z.string().max(512).optional(),
  lastUpdated: z.string().optional(),
});

const ConsoleTelemetrySchema = z.object({
  desktopId: z.string().min(1).max(128),
  capturedAt: z.string().optional(),
  panels: z.array(PanelTelemetrySchema).max(32),
});

type RawPanelTelemetry = z.infer<typeof PanelTelemetrySchema>;

const toFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const pickTypedEntries = <T extends "string" | "number" | "boolean">(
  source: Record<string, unknown> | undefined,
  type: T,
): Record<string, T extends "string" ? string : T extends "number" ? number : boolean> => {
  if (!source) {
    return {} as Record<string, any>;
  }
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === type) {
      next[key] = value;
    }
  }
  return next as Record<string, any>;
};

function sanitizePanelTelemetry(panel: RawPanelTelemetry, capturedAt: string): PanelTelemetry {
  const metrics = pickTypedEntries(panel.metrics, "number");
  const strings = { ...pickTypedEntries(panel.metrics, "string"), ...(panel.strings ?? {}) };
  const flags = { ...pickTypedEntries(panel.metrics, "boolean"), ...(panel.flags ?? {}) };
  const bands =
    panel.bands
      ?.map((band) => ({
        name: band.name,
        q: toFiniteNumber(band.q) ?? 0,
        coherence: toFiniteNumber(band.coherence) ?? 0,
        occupancy: toFiniteNumber(band.occupancy) ?? 0,
        event_rate: toFiniteNumber(band.event_rate),
        last_event: band.last_event,
      }))
      .filter((band) => band.name) ?? [];
  const tileSample =
    panel.tile_sample && (panel.tile_sample.total !== undefined || panel.tile_sample.active !== undefined)
      ? {
          total: toFiniteNumber(panel.tile_sample.total) ?? 0,
          active: toFiniteNumber(panel.tile_sample.active) ?? 0,
          hot: Array.isArray(panel.tile_sample.hot)
            ? panel.tile_sample.hot.filter((value) => typeof value === "number" && Number.isFinite(value)).slice(0, 256)
            : undefined,
        }
      : undefined;

  return {
    panelId: panel.panelId,
    instanceId: panel.instanceId,
    title: panel.title,
    kind: panel.kind,
    metrics: Object.keys(metrics).length ? metrics : undefined,
    flags: Object.keys(flags).length ? flags : undefined,
    strings: Object.keys(strings).length ? strings : undefined,
    bands: bands.length ? bands : undefined,
    tile_sample: tileSample,
    sourceIds: panel.sourceIds?.filter(Boolean),
    notes: panel.notes,
    lastUpdated: panel.lastUpdated ?? capturedAt,
  };
}

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
  desktopId: z.string().min(1).max(128).optional(),
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
  if (!getTool(panelSnapshotSpec.name)) {
    registerTool({ ...panelSnapshotSpec, handler: panelSnapshotHandler });
  }
  if (!getTool(badgeTelemetrySpec.name)) {
    registerTool({ ...badgeTelemetrySpec, handler: badgeTelemetryHandler });
  }
  if (process.env.ENABLE_DEBATE === "1") {
    if (!getTool(debateRunSpec.name)) {
      registerTool({ ...debateRunSpec, handler: debateRunHandler });
    }
    if (!getTool(docsEvidenceSearchMdSpec.name)) {
      registerTool({ ...docsEvidenceSearchMdSpec, handler: docsEvidenceSearchMdHandler });
    }
    if (!getTool(docsEvidenceSearchPdfSpec.name)) {
      registerTool({ ...docsEvidenceSearchPdfSpec, handler: docsEvidenceSearchPdfHandler });
    }
    if (!getTool(docsHeadingSectionSpec.name)) {
      registerTool({ ...docsHeadingSectionSpec, handler: docsHeadingSectionHandler });
    }
    if (!getTool(docsTableExtractSpec.name)) {
      registerTool({ ...docsTableExtractSpec, handler: docsTableExtractHandler });
    }
    if (!getTool(debateClaimExtractSpec.name)) {
      registerTool({ ...debateClaimExtractSpec, handler: debateClaimExtractHandler });
    }
    if (!getTool(citationVerifySpanSpec.name)) {
      registerTool({ ...citationVerifySpanSpec, handler: citationVerifySpanHandler });
    }
    if (!getTool(docsContradictionScanSpec.name)) {
      registerTool({ ...docsContradictionScanSpec, handler: docsContradictionScanHandler });
    }
    if (!getTool(numericExtractUnitsSpec.name)) {
      registerTool({ ...numericExtractUnitsSpec, handler: numericExtractUnitsHandler });
    }
    if (!getTool(experimentFalsifierProposeSpec.name)) {
      registerTool({ ...experimentFalsifierProposeSpec, handler: experimentFalsifierProposeHandler });
    }
    if (!getTool(debateChecklistGenerateSpec.name)) {
      registerTool({ ...debateChecklistGenerateSpec, handler: debateChecklistGenerateHandler });
    }
    if (!getTool(debateChecklistGenerateAliasSpec.name)) {
      registerTool({ ...debateChecklistGenerateAliasSpec, handler: debateChecklistGenerateHandler });
    }
    if (!getTool(debateChecklistScoreSpec.name)) {
      registerTool({ ...debateChecklistScoreSpec, handler: debateChecklistScoreHandler });
    }
    if (!getTool(debateChecklistScoreAliasSpec.name)) {
      registerTool({ ...debateChecklistScoreAliasSpec, handler: debateChecklistScoreHandler });
    }
    if (!getTool(telemetryCrosscheckDocsSpec.name)) {
      registerTool({ ...telemetryCrosscheckDocsSpec, handler: telemetryCrosscheckDocsHandler });
    }
  }
  if (!getTool("image.openai.looks")) {
    const { fashionLooksSpec, fashionLooksHandler } = await import("../skills/fashion.looks");
    registerTool({ ...fashionLooksSpec, handler: fashionLooksHandler });
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

planRouter.post("/console/telemetry", (req, res) => {
  const parsed = ConsoleTelemetrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const capturedAt = parsed.data.capturedAt ?? new Date().toISOString();
  const panels: PanelTelemetry[] = parsed.data.panels.map((panel) => sanitizePanelTelemetry(panel, capturedAt));
  const payload: ConsoleTelemetryBundle = {
    desktopId: parsed.data.desktopId,
    capturedAt,
    panels,
  };
  saveConsoleTelemetry(payload);
  void persistConsoleTelemetrySnapshot(payload).catch((error) => {
    console.warn("[telemetry] failed to persist snapshot", error);
  });
  res.status(204).end();
});

planRouter.get("/telemetry/badges", (req, res) => {
  const desktopId =
    typeof req.query.desktopId === "string" && req.query.desktopId.trim()
      ? req.query.desktopId.trim()
      : DEFAULT_DESKTOP_ID;
  const panelParam = (req.query.panelId ?? req.query.panelIds) as string | string[] | undefined;
  const panelIds = Array.isArray(panelParam)
    ? panelParam
    : typeof panelParam === "string"
      ? panelParam.split(",").map((id) => id.trim()).filter(Boolean)
      : undefined;
  const includeRaw = req.query.includeRaw === "1" || req.query.includeRaw === "true";
  const { snapshot, rawPanels } = collectBadgeTelemetry({ desktopId, panelIds });
  if (includeRaw) {
    return res.json({ ...snapshot, raw: rawPanels });
  }
  return res.json(snapshot);
});

planRouter.get("/telemetry/panels", (req, res) => {
  const desktopId =
    typeof req.query.desktopId === "string" && req.query.desktopId.trim()
      ? req.query.desktopId.trim()
      : DEFAULT_DESKTOP_ID;
  const panelParam = (req.query.panelId ?? req.query.panelIds) as string | string[] | undefined;
  const panelIds = Array.isArray(panelParam)
    ? panelParam
    : typeof panelParam === "string"
      ? panelParam.split(",").map((id) => id.trim()).filter(Boolean)
      : undefined;
  const snapshot = collectPanelSnapshots({ desktopId, panelIds });
  return res.json(snapshot);
});

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
  const desktopId = parsed.data.desktopId?.trim() || DEFAULT_DESKTOP_ID;
  const baseTelemetryBundle = getConsoleTelemetry(desktopId);
  const { bundle: telemetryBundle } = ensureCasimirTelemetry({ desktopId, base: baseTelemetryBundle });
  const telemetrySummary = summarizeConsoleTelemetry(telemetryBundle);
  const query = (searchQuery ?? goal).trim();
  let baseKnowledgeContext: KnowledgeProjectExport[] | undefined;
  if (parsed.data.knowledgeContext && parsed.data.knowledgeContext.length > 0) {
    if (!knowledgeConfig.enabled) {
      return res.status(400).json({ error: "knowledge_projects_disabled" });
    }
    try {
      baseKnowledgeContext = validateKnowledgeContext(parsed.data.knowledgeContext);
    } catch (error) {
      if (error instanceof KnowledgeValidationError) {
        return res.status(error.status).json({ error: "knowledge_context_invalid", message: error.message });
      }
      throw error;
    }
  }

  const requestedProjects =
    parsed.data.knowledgeProjects?.map((id) => id.trim()).filter((id) => id.length > 0) ?? [];

  let resonanceBundle: ResonanceBundle | null = null;
  let resonanceSelection: ResonanceCollapse | null = null;
  let knowledgeHints: string[] = [];
  try {
    resonanceBundle = await withTimeout(
      buildResonanceBundle({
        goal,
        query,
        limit: Number(process.env.CODE_PATCH_TOPK ?? 12),
        telemetry: telemetryBundle ?? null,
      }),
      RESONANCE_BUILD_TIMEOUT_MS,
      "resonance_build",
    );
    if (resonanceBundle) {
      resonanceSelection = collapseResonancePatches({ bundle: resonanceBundle, goal });
      // patch merge deferred until plan candidate selection
    }
  } catch (error) {
    console.warn("[code-lattice] resonance patch build failed:", error);
  }
  knowledgeHints = buildKnowledgeHints({
    telemetry: telemetryBundle,
    resonanceBundle,
    resonanceSelection,
  });

  if (knowledgeConfig.enabled && requestedProjects.length > 0) {
    const inlineBytes = estimateKnowledgeContextBytes(baseKnowledgeContext);
    const remainingBudget = Math.max(0, knowledgeConfig.contextBytes - inlineBytes);
    if (remainingBudget > 0) {
      try {
        const fetched = await withTimeout(
          fetchKnowledgeForProjects(requestedProjects, {
            goal,
            extraKeywords: knowledgeHints,
            maxBytes: remainingBudget,
            maxFilesPerProject: knowledgeConfig.maxFilesPerProject,
          }),
          KNOWLEDGE_FETCH_TIMEOUT_MS,
          "knowledge_fetch",
        );
        if (fetched.length > 0) {
          baseKnowledgeContext = mergeKnowledgeBundles(baseKnowledgeContext, fetched);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[knowledge] failed to fetch corpus attachments: ${message}`);
      }
    }
  }
  const latticeVersion = getLatticeVersion() || null;
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
  // Telemetry tools don't need knowledge context; skip to avoid unnecessary sync/corpus fetch.
  const telemetryTools = new Set(["telemetry.badges.read", "telemetry.panels.snapshot"]);
  if (telemetryTools.has(selectedTool)) {
    baseKnowledgeContext = undefined;
    requestedProjects.length = 0;
  }
  const focus = summaryFocus?.trim() || DEFAULT_SUMMARY_FOCUS;

  const basePlanArgs: BuildPlanArgs = {
    goal,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    finalTool: selectedTool,
  };
  const basePlan = buildChatBPlan(basePlanArgs);
  const primaryPatchId = resonanceSelection?.primaryPatchId ?? null;
  const planCandidates = buildCandidatePlansFromResonance({
    basePlan: basePlanArgs,
    personaId,
    manifest,
    baseKnowledgeContext,
    resonanceBundle,
    resonanceSelection,
    topPatches: Number(process.env.RESONANCE_PLAN_BRANCHES ?? 3),
    telemetryBundle,
    knowledgeHints,
    telemetrySummary,
  });
  let knowledgeContext = baseKnowledgeContext;
  let plannerPrompt = renderChatBPlannerPrompt({
    goal,
    personaId,
    manifest,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    knowledgeContext,
    resonanceBundle,
    resonanceSelection,
    primaryPatchId,
    telemetryBundle,
    knowledgeHints,
  });
  let nodes = basePlan.nodes;
  let planDsl = basePlan.planDsl;
  const winningPlan =
    (primaryPatchId && planCandidates.find((candidate) => candidate.patch.id === primaryPatchId)) ??
    planCandidates[0];
  if (winningPlan) {
    knowledgeContext = winningPlan.knowledgeContext;
    plannerPrompt = winningPlan.plannerPrompt;
    nodes = winningPlan.nodes;
    planDsl = winningPlan.planDsl;
  } else if (primaryPatchId) {
    const fallbackPatch = resonanceBundle?.candidates.find((patch) => patch.id === primaryPatchId);
    if (fallbackPatch) {
      knowledgeContext = mergeKnowledgeBundles(baseKnowledgeContext, [fallbackPatch.knowledge]);
      plannerPrompt = renderChatBPlannerPrompt({
        goal,
        personaId,
        manifest,
        searchQuery: query,
        topK,
        summaryFocus: focus,
        knowledgeContext,
        resonanceBundle,
        resonanceSelection,
        primaryPatchId,
        telemetryBundle,
        knowledgeHints,
      });
    }
  }
  const executorStepsAll = compilePlan(nodes);
  const maxTurns = routine?.knobs?.max_turns;
  const executorSteps =
    typeof maxTurns === "number" && Number.isFinite(maxTurns)
      ? executorStepsAll.slice(0, Math.max(1, Math.min(executorStepsAll.length, Math.floor(maxTurns))))
      : executorStepsAll;
  const traceId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const persistedKnowledgeContext = sanitizeKnowledgeContextForTrace(knowledgeContext) ?? [];
  const knowledgeHash = hashKnowledgeContext(persistedKnowledgeContext);
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
    resonance_bundle: resonanceBundle,
    resonance_selection: resonanceSelection,
    telemetry_bundle: telemetryBundle,
    telemetry_summary: telemetrySummary,
    lattice_version: latticeVersion != null ? String(latticeVersion) : null,
    planner_prompt: plannerPrompt,
    routine_json: routine,
    debate_id: null,
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
    knowledgeHash,
    knowledgeHints,
    desktopId,
    telemetry: telemetryBundle ?? null,
    telemetrySummary: telemetrySummary ?? null,
    resonance: resonanceBundle,
    resonanceSelection,
    latticeVersion,
    debateId: null,
  };

  registerInMemoryTrace(taskTrace);
  planRecords.set(traceId, record);
  try {
    await withTimeout(saveTaskTrace(taskTrace), SAVE_TASK_TRACE_TIMEOUT_MS, "save_task_trace");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[agi.plan] task trace persistence skipped: ${message}`);
  }

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
    knowledge_hash: knowledgeHash,
    telemetry_bundle: telemetryBundle,
    telemetry_summary: telemetrySummary,
    lattice_version: latticeVersion,
    resonance_bundle: resonanceBundle,
    resonance_selection: resonanceSelection,
    debate_id: record.debateId ?? null,
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
  let record: PlanRecord | null = planRecords.get(traceId) ?? null;
  if (!record) {
    record = await rehydratePlanRecord(traceId);
    if (record) {
      planRecords.set(traceId, record);
    }
  }
  if (!record) {
    return res.status(404).json({ error: "trace_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, record.personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  const runtimeKnowledgeHash = hashKnowledgeContext(sanitizeKnowledgeContextForTrace(record.knowledgeContext));
  if (record.knowledgeHash && runtimeKnowledgeHash && record.knowledgeHash !== runtimeKnowledgeHash) {
    return res.status(409).json({
      error: "knowledge_context_mismatch",
      expected: record.knowledgeHash,
      got: runtimeKnowledgeHash,
    });
  }

  const start = Date.now();
  const runtimeTelemetry = record.telemetry ?? null;
  const runtimeTelemetrySummary = record.telemetrySummary ?? null;
  if (runtimeTelemetrySummary === null) {
    return res.status(409).json({
      error: "telemetry_snapshot_missing",
      message: "Execute requires a sealed telemetry snapshot from plan.",
    });
  }
  const steps = await executeCompiledPlan(record.executorSteps, {
    goal: record.goal,
    personaId: record.personaId,
    sessionId: traceId,
    taskTrace: record.taskTrace,
    knowledgeContext: record.knowledgeContext,
    telemetrySummary: runtimeTelemetrySummary,
    resonanceBundle: record.resonance,
    resonanceSelection: record.resonanceSelection,
    knowledgeHints: record.knowledgeHints,
    plannerPrompt: record.plannerPrompt,
    debateId: record.debateId ?? record.taskTrace.debate_id ?? null,
  });
  record.telemetry = runtimeTelemetry;
  record.telemetrySummary = runtimeTelemetrySummary;
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
  const executorStepById = new Map(record.executorSteps.map((entry) => [entry.id, entry]));
  const debateStepResult = steps.find((step) => {
    const exec = executorStepById.get(step.id);
    const isDebateRun =
      step.kind === "debate.run" ||
      exec?.kind === "debate.run" ||
      ((exec as { tool?: string } | undefined)?.tool === "debate.run" && exec?.kind === "tool.call");
    return isDebateRun && step.output && typeof step.output === "object";
  });
  const debateIdFromSteps =
    debateStepResult && typeof debateStepResult.output === "object"
      ? ((debateStepResult.output as { debateId?: string; debate_id?: string }).debateId ??
        (debateStepResult.output as { debate_id?: string }).debate_id ??
        null)
      : null;
  if (debateIdFromSteps) {
    record.debateId = debateIdFromSteps;
    record.taskTrace.debate_id = debateIdFromSteps;
  }
  metrics.recordTask(duration, ok);
  record.taskTrace.ok = record.taskTrace.ok ?? ok;
  record.taskTrace.steps = steps;
  record.taskTrace.telemetry_bundle = runtimeTelemetry ?? record.taskTrace.telemetry_bundle ?? null;
  record.taskTrace.telemetry_summary = runtimeTelemetrySummary ?? record.taskTrace.telemetry_summary ?? null;
  record.taskTrace.resonance_bundle = record.resonance ?? record.taskTrace.resonance_bundle ?? null;
  record.taskTrace.resonance_selection = record.resonanceSelection ?? record.taskTrace.resonance_selection ?? null;
  record.taskTrace.lattice_version = record.latticeVersion ?? record.taskTrace.lattice_version ?? null;
  record.taskTrace.planner_prompt = record.plannerPrompt ?? record.taskTrace.planner_prompt ?? null;
  record.debateId = record.taskTrace.debate_id ?? record.debateId ?? null;
  record.taskTrace.debate_id = record.debateId;
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
    planner_prompt: record.plannerPrompt,
    lattice_version: record.latticeVersion ?? null,
    telemetry_bundle: record.telemetry ?? null,
    telemetry_summary: runtimeTelemetrySummary,
    ok,
    steps,
    result_summary: summary,
    task_trace: record.taskTrace,
    why_belongs: whyBelongs,
    resonance_bundle: record.resonance,
    resonance_selection: record.resonanceSelection,
    debate_id: record.debateId ?? null,
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
