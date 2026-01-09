import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { ToolManifestEntry } from "@shared/skills";
import type { TCollapseTraceEntry, TTaskTrace } from "@shared/essence-persona";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import type { ResonanceBundle, ResonanceCollapse, ResonancePatch } from "@shared/code-lattice";
import type { GroundingReport, GroundingSource } from "@shared/grounding";
import { Routine, type TRoutine } from "@shared/agi-instructions";
import { PROMPT_SPEC_SCHEMA_VERSION, type PromptSpec } from "@shared/prompt-spec";
import { zLocalCallSpec, type LocalCallSpec } from "@shared/local-call-spec";
import type { AnchorConfig, RetrieveCandidate } from "../../codex/anchors/types";
import { routeIntent } from "../../codex/anchors/router";
import { retrieveCandidates } from "../../codex/anchors/retriever";
import {
  DEFAULT_SUMMARY_FOCUS,
  formatPlanDsl,
  type BuildPlanArgs,
  type ExecutorStep,
  type ExecutionRuntime,
  type PlanNode,
  type ReasoningStrategy,
  type IntentFlags,
  buildChatBPlan,
  chooseReasoningStrategy,
  buildCandidatePlansFromResonance,
  compilePlan,
  executeCompiledPlan,
  summarizeExecutionResults,
  renderChatBPlannerPrompt,
  registerInMemoryTrace,
  collapseResonancePatches,
  classifyIntent,
  isViabilityIntentGoal,
  isWarpOrPhysicsIntentGoal,
  isWarpConsoleIntent,
  isWarpRelevantPath,
  normalizeForIntent,
} from "../services/planner/chat-b";
import {
  ensureGroundingReport as ensurePlannerGroundingReport,
  recordKnowledgeSources,
  recordResonancePatchSources,
  seedWarpPaths,
} from "../services/planner/grounding";
import { saveConsoleTelemetry, getConsoleTelemetry } from "../services/console-telemetry/store";
import { persistConsoleTelemetrySnapshot } from "../services/console-telemetry/persist";
import { summarizeConsoleTelemetry } from "../services/console-telemetry/summarize";
import { ensureCasimirTelemetry } from "../services/casimir/telemetry";
import { buildWhyBelongs } from "../services/planner/why-belongs";
import { getTool, listTools, registerTool } from "../skills";
import { llmLocalHandler, llmLocalSpec } from "../skills/llm.local";
import { lumaGenerateHandler, lumaGenerateSpec } from "../skills/luma.generate";
import {
  noiseGenCoverHandler,
  noiseGenCoverSpec,
} from "../skills/noise.gen.cover";
import {
  noiseGenFingerprintHandler,
  noiseGenFingerprintSpec,
} from "../skills/noise.gen.fingerprint";
import { badgeTelemetryHandler, badgeTelemetrySpec } from "../skills/telemetry.badges";
import { panelSnapshotHandler, panelSnapshotSpec } from "../skills/telemetry.panels";
import { sttWhisperHandler, sttWhisperSpec } from "../skills/stt.whisper";
import { readmeHandler, readmeSpec } from "../skills/docs.readme";
import { essenceMixHandler, essenceMixSpec } from "../skills/essence.mix";
import { warpAskHandler, warpAskSpec } from "../skills/physics.warp.ask";
import { warpViabilityHandler, warpViabilitySpec } from "../skills/physics.warp.viability";
import { grGroundingHandler, grGroundingSpec } from "../skills/physics.gr.grounding";
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
import { repoGraphSearchHandler, repoGraphSearchSpec } from "../skills/repo.graph.search";
import { repoDiffReviewHandler, repoDiffReviewSpec } from "../skills/repo.diff.review";
import { repoPatchSimulateHandler, repoPatchSimulateSpec } from "../skills/repo.patch.simulate";
import { getTaskTrace, saveTaskTrace } from "../db/agi";
import { metrics, sseConnections } from "../metrics";
import { personaPolicy } from "../auth/policy";
import { guardTenant } from "../auth/tenant";
import {
  appendToolLog,
  getToolLogs,
  getToolLogsSince,
  subscribeToolLogs,
  type ToolLogPolicyFlags,
  type ToolLogRecord,
} from "../services/observability/tool-log-store";
import {
  createToolEventAdapter,
  mapLangGraphToolEvent,
} from "../services/observability/tool-event-adapters";
import { stableJsonStringify } from "../utils/stable-json";
import { sha256Hex } from "../utils/information-boundary";
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
import { getGlobalPipelineState } from "../energy-pipeline";
import { smallLlmCallSpecTriage } from "../services/small-llm";

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
const toolEventAdapter = createToolEventAdapter();
const DEFAULT_DESKTOP_ID = "helix.desktop.main";
const LOCAL_CALL_SPEC_URL =
  process.env.LOCAL_CALL_SPEC_URL ??
  process.env.VITE_LOCAL_CALL_SPEC_URL ??
  "http://127.0.0.1:11434/api/local-call-spec";
const LOCAL_CALL_SPEC_TIMEOUT_MS = 2500;
const LOCAL_TTS_URL =
  process.env.LOCAL_TTS_URL ??
  process.env.VITE_LOCAL_TTS_URL ??
  "http://127.0.0.1:11434/api/tts";
const LOCAL_STT_URL =
  process.env.LOCAL_STT_URL ??
  process.env.VITE_LOCAL_STT_URL ??
  "http://127.0.0.1:11434/api/stt";
const LOCAL_TTS_TIMEOUT_MS = 5000;
const LOCAL_STT_TIMEOUT_MS = 5000;
const ANCHOR_CONFIG_PATH = path.resolve(process.cwd(), "codex/anchors/anchors.config.json");
let anchorConfigCache: AnchorConfig | null = null;
let anchorConfigLoadFailed = false;

const loadAnchorConfig = (): AnchorConfig | null => {
  if (anchorConfigLoadFailed) return null;
  if (anchorConfigCache) return anchorConfigCache;
  try {
    const raw = fs.readFileSync(ANCHOR_CONFIG_PATH, "utf8");
    anchorConfigCache = JSON.parse(raw) as AnchorConfig;
    return anchorConfigCache;
  } catch (error) {
    anchorConfigLoadFailed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[plan] anchors config unavailable: ${message}`);
    return null;
  }
};

const mergeAnchorHints = (args: {
  callSpec: LocalCallSpec | undefined;
  candidates: RetrieveCandidate[];
  goal: string;
  knowledgeHints: string[];
}): { callSpec: LocalCallSpec | undefined; knowledgeHints: string[] } => {
  const { goal, candidates } = args;
  if (candidates.length === 0) {
    return { callSpec: args.callSpec, knowledgeHints: args.knowledgeHints };
  }

  const nextHints = [...args.knowledgeHints];
  const resourceHints = [...(args.callSpec?.resourceHints ?? [])];
  const seenPaths = new Set(
    resourceHints
      .map((hint) => hint.path)
      .filter((pathValue): pathValue is string => typeof pathValue === "string" && pathValue.trim().length > 0),
  );

  for (const candidate of candidates) {
    if (!nextHints.includes(candidate.path)) {
      nextHints.push(candidate.path);
    }
    if (!seenPaths.has(candidate.path)) {
      resourceHints.push({
        type: "repo_file",
        path: candidate.path,
        reason: candidate.reason,
      });
      seenPaths.add(candidate.path);
    }
  }

  const baseSpec: LocalCallSpec = args.callSpec ?? {
    action: "call_remote",
    premise: goal,
    intent: [],
  };

  return {
    callSpec: { ...baseSpec, resourceHints },
    knowledgeHints: nextHints,
  };
};

const parseDebugSourcesFlag = (bodyValue?: boolean, queryValue?: unknown): boolean => {
  if (typeof bodyValue === "boolean") {
    return bodyValue;
  }
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return false;
};

const normalizeCollapseStrategy = (value?: string | null): string | undefined => {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lowered = trimmed.toLowerCase();
  if (["off", "none", "baseline", "disabled"].includes(lowered)) {
    return "off";
  }
  if (lowered.startsWith("micro") || lowered.includes("llm")) {
    return "micro_llm_v1";
  }
  if (lowered.startsWith("embed")) {
    return "embedding_v1";
  }
  if (lowered.startsWith("deterministic")) {
    return "deterministic_hash_v1";
  }
  return undefined;
};

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
  strategy?: ReasoningStrategy;
  strategyNotes?: string[];
  groundingReport?: GroundingReport;
  debugSources?: boolean;
  promptSpec?: PromptSpec;
  collapseTrace?: TCollapseTraceEntry;
  collapseStrategy?: string;
  callSpec?: LocalCallSpec;
};

type PlanRecordCacheEntry = { record: PlanRecord; expiresAt: number };

const planRecords = new Map<string, PlanRecordCacheEntry>();
const PLAN_RECORD_CACHE_TTL_MS = (() => {
  const fallback = 30 * 60 * 1000;
  const raw = Number(process.env.PLAN_RECORD_CACHE_TTL_MS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.min(6 * 60 * 60 * 1000, Math.floor(raw));
})();
const PLAN_RECORD_CACHE_MAX = (() => {
  const fallback = 200;
  const raw = Number(process.env.PLAN_RECORD_CACHE_MAX ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.min(2000, Math.floor(raw));
})();
const PLAN_RECORD_CACHE_CLEANUP_MS = 60_000;

const prunePlanRecords = (): void => {
  const now = Date.now();
  for (const [traceId, entry] of planRecords) {
    if (entry.expiresAt <= now) {
      planRecords.delete(traceId);
    }
  }
  while (planRecords.size > PLAN_RECORD_CACHE_MAX) {
    const oldestKey = planRecords.keys().next().value;
    if (!oldestKey) break;
    planRecords.delete(oldestKey);
  }
};

const rememberPlanRecord = (record: PlanRecord): PlanRecord => {
  const entry: PlanRecordCacheEntry = { record, expiresAt: Date.now() + PLAN_RECORD_CACHE_TTL_MS };
  planRecords.delete(record.traceId);
  planRecords.set(record.traceId, entry);
  prunePlanRecords();
  return record;
};

const getPlanRecord = (traceId: string): PlanRecord | null => {
  prunePlanRecords();
  const entry = planRecords.get(traceId);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    planRecords.delete(traceId);
    return null;
  }
  entry.expiresAt = Date.now() + PLAN_RECORD_CACHE_TTL_MS;
  planRecords.delete(traceId);
  planRecords.set(traceId, entry);
  return entry.record;
};

const planRecordCleanup = setInterval(prunePlanRecords, PLAN_RECORD_CACHE_CLEANUP_MS);
planRecordCleanup.unref?.();

const dedupeGroundingSources = (sources?: GroundingSource[] | null): GroundingSource[] => {
  if (!sources || sources.length === 0) return [];
  const seen = new Set<string>();
  const result: GroundingSource[] = [];
  for (const source of sources) {
    const key = `${source.kind ?? "unknown"}:${source.id ?? ""}:${source.path ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
};

const pickResonancePatch = ({
  bundle,
  selection,
}: {
  bundle?: ResonanceBundle | null;
  selection?: ResonanceCollapse | null;
}): ResonancePatch | null => {
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return null;
  }
  if (selection?.primaryPatchId) {
    const preferred = bundle.candidates.find((candidate) => candidate.id === selection.primaryPatchId);
    if (preferred) {
      return preferred;
    }
  }
  return bundle.candidates[0] ?? null;
};

const findLatestAccessiblePlan = (claims: unknown): PlanRecord | null => {
  prunePlanRecords();
  let latest: PlanRecord | null = null;
  for (const entry of planRecords.values()) {
    const record = entry.record;
    if (!personaPolicy.canAccess(claims as any, record.personaId, "plan")) continue;
    if (!latest || record.createdAt > latest.createdAt) {
      latest = record;
    }
  }
  if (latest) {
    rememberPlanRecord(latest);
  }
  return latest;
};

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
      grounding_report: (trace as any).grounding_report ?? (trace as any).groundingReport ?? undefined,
      debug_sources: (trace as any).debug_sources ?? undefined,
    };
    const nodes = Array.isArray(trace.plan_json) ? (trace.plan_json as PlanNode[]) : [];
    const executorSteps = nodes.length > 0 ? compilePlan(nodes) : [];
    const manifest = Array.isArray(trace.plan_manifest) ? (trace.plan_manifest as ToolManifestEntry[]) : listTools();
    const planDsl = nodes.length > 0 ? formatPlanDsl(nodes) : "";
    const collapseStrategy = taskTrace.collapse_strategy ?? taskTrace.collapse_trace?.strategy ?? undefined;
    if (collapseStrategy && !taskTrace.collapse_strategy) {
      taskTrace.collapse_strategy = collapseStrategy;
    }
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
      strategy: (taskTrace as any).reasoning_strategy ?? undefined,
      strategyNotes: Array.isArray((taskTrace as any).strategy_notes)
        ? ((taskTrace as any).strategy_notes as string[])
        : [],
      groundingReport: taskTrace.grounding_report ?? undefined,
      debugSources: taskTrace.debug_sources ?? undefined,
      collapseTrace: taskTrace.collapse_trace ?? undefined,
      collapseStrategy,
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
  intent?: IntentFlags;
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
  const wantsWarp = args.intent?.wantsWarp || args.intent?.wantsPhysics;
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
      .filter((node) => !wantsWarp || isWarpRelevantPath(node.filePath) || isWarpRelevantPath(node.symbol ?? ""))
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

function prioritizeKnowledgeContext(
  context: KnowledgeProjectExport[] | undefined,
  preferredIds: string[],
): KnowledgeProjectExport[] | undefined {
  if (!context || context.length === 0 || !preferredIds || preferredIds.length === 0) {
    return context;
  }
  const map = new Map(context.map((bundle) => [bundle.project.id, bundle]));
  const ordered: KnowledgeProjectExport[] = [];
  for (const id of preferredIds) {
    const hit = map.get(id);
    if (hit) {
      ordered.push(hit);
      map.delete(id);
    }
  }
  for (const bundle of context) {
    if (map.has(bundle.project.id)) {
      ordered.push(bundle);
      map.delete(bundle.project.id);
    }
  }
  return ordered;
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

const PromptSpecCitationSchema = z.object({
  source: z.enum(["trace", "memory", "knowledge", "profile"]),
  id: z.string(),
  snippet: z.string().max(2000).optional(),
});

const PromptSpecBudgetsSchema = z.object({
  max_tokens_hint: z.number().int().positive().max(32768).optional(),
  max_citations: z.number().int().positive().max(16).optional(),
  max_chars: z.number().int().positive().max(100_000).optional(),
});

const PromptSpecSchema = z.object({
  schema_version: z.literal(PROMPT_SPEC_SCHEMA_VERSION),
  mode: z.enum(["plan_and_execute", "direct_answer", "profile_update", "eval", "panel_control"]),
  target_api: z.enum(["/api/agi/plan", "/api/agi/eval/smoke", "/api/agi/eval/replay", "/api/essence/profile"]),
  user_question: z.string(),
  system_instructions: z.string().optional(),
  citations: z.array(PromptSpecCitationSchema).max(16).optional(),
  soft_goals: z.array(z.string()).optional(),
  budgets: PromptSpecBudgetsSchema.optional(),
});

const CollapseTraceSchema = z.object({
  timestamp: z.string(),
  chosenId: z.string(),
  candidates: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      tags: z.array(z.string()),
    }),
  ),
  input_hash: z.string().optional(),
  decider: z.enum(["heuristic", "local-llm", "disabled"]).optional(),
  model: z.string().optional(),
  note: z.string().optional(),
  strategy: z.string().optional(),
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

function sanitizePromptSpecForServer(ps?: PromptSpec): PromptSpec | undefined {
  if (!ps) return undefined;
  if (ps.schema_version !== PROMPT_SPEC_SCHEMA_VERSION) return undefined;

  const citations = (ps.citations ?? []).slice(0, 16).map((c) => ({
    ...c,
    snippet: c.snippet?.slice(0, 2000),
  }));

  return {
    ...ps,
    citations,
    budgets: {
      max_citations: Math.min(ps.budgets?.max_citations ?? 8, 16),
      max_tokens_hint: Math.min(ps.budgets?.max_tokens_hint ?? 4000, 32768),
      max_chars: Math.min(ps.budgets?.max_chars ?? 20000, 100000),
    },
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
  debugSources: z.boolean().optional(),
  prompt_spec: PromptSpecSchema.optional(),
  collapse_trace: CollapseTraceSchema.optional(),
  collapse_strategy: z.string().optional(),
  call_spec: zLocalCallSpec.optional(),
  essenceConsole: z.boolean().optional(),
  warpParams: z.record(z.any()).optional(),
});

const ExecuteRequest = z.object({
  traceId: z.string().min(8, "traceId required"),
  debugSources: z.boolean().optional(),
});

const ToolLogsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(250).default(TRACE_SSE_LIMIT),
  tool: z
    .string()
    .min(1, "tool name required")
    .transform((value) => value.trim())
    .optional(),
});

const ToolLogPolicyFlagSchema = z.union([z.boolean(), z.number()]);
const ToolLogPolicyFlagsSchema = z
  .object({
    forbidden: ToolLogPolicyFlagSchema.optional(),
    approvalMissing: ToolLogPolicyFlagSchema.optional(),
    provenanceMissing: ToolLogPolicyFlagSchema.optional(),
  })
  .partial();
const ToolLogDefaultsSchema = z.object({
  traceId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  policy: ToolLogPolicyFlagsSchema.optional(),
});
const ToolLogRecordSchema = z
  .object({
    tool: z.string().min(1),
    ok: z.boolean(),
    durationMs: z.coerce.number().nonnegative(),
    paramsHash: z.string().optional(),
    promptHash: z.string().optional(),
    params: z.unknown().optional(),
    version: z.string().optional(),
    ts: z.union([z.string(), z.number(), z.date()]).optional(),
    traceId: z.string().optional(),
    sessionId: z.string().optional(),
    stepId: z.string().optional(),
    seed: z.unknown().optional(),
    error: z.unknown().optional(),
    policy: ToolLogPolicyFlagsSchema.optional(),
    essenceId: z.string().optional(),
    text: z.string().optional(),
    debateId: z.string().optional(),
    strategy: z.string().optional(),
  })
  .passthrough();
const ToolEventSchema = z
  .object({
    kind: z.enum(["start", "success", "error"]),
    runId: z.string().min(1),
    tool: z.string().optional(),
    traceId: z.string().optional(),
    sessionId: z.string().optional(),
    stepId: z.string().optional(),
    version: z.string().optional(),
    params: z.unknown().optional(),
    paramsHash: z.string().optional(),
    promptHash: z.string().optional(),
    seed: z.unknown().optional(),
    policy: ToolLogPolicyFlagsSchema.optional(),
    essenceId: z.string().optional(),
    text: z.string().optional(),
    debateId: z.string().optional(),
    strategy: z.string().optional(),
    ts: z.union([z.string(), z.number(), z.date()]).optional(),
    durationMs: z.coerce.number().nonnegative().optional(),
    output: z.unknown().optional(),
    error: z.unknown().optional(),
  })
  .passthrough();
const LangGraphEventSchema = z.object({}).passthrough();
const ToolLogIngestSchema = z.object({
  defaults: ToolLogDefaultsSchema.optional(),
  record: ToolLogRecordSchema.optional(),
  records: z.array(ToolLogRecordSchema).optional(),
  event: ToolEventSchema.optional(),
  events: z.array(ToolEventSchema).optional(),
  langGraphEvent: LangGraphEventSchema.optional(),
  langGraphEvents: z.array(LangGraphEventSchema).optional(),
});

const parseBoundedInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(min, Math.floor(parsed)), max);
};

const TOOL_LOG_INGEST_MAX_BYTES = parseBoundedInt(
  process.env.TOOL_LOG_INGEST_MAX_BYTES,
  100000,
  1024,
  10000000,
);
const TOOL_LOG_INGEST_MAX_RECORDS = parseBoundedInt(
  process.env.TOOL_LOG_INGEST_MAX_RECORDS,
  200,
  1,
  5000,
);
const TOOL_LOG_INGEST_RPM = parseBoundedInt(
  process.env.TOOL_LOG_INGEST_RPM,
  0,
  0,
  60000,
);
const TOOL_LOG_INGEST_RATE_WINDOW_MS = parseBoundedInt(
  process.env.TOOL_LOG_INGEST_RATE_WINDOW_MS,
  60000,
  1000,
  3600000,
);
const TOOL_LOG_INGEST_RATE_MAX_KEYS = 5000;
const toolLogIngestLimiter = new Map<string, { count: number; resetAt: number }>();

const mergePolicyFlags = (
  base?: ToolLogPolicyFlags,
  override?: ToolLogPolicyFlags,
): ToolLogPolicyFlags | undefined => {
  if (!base && !override) return undefined;
  return { ...(base ?? {}), ...(override ?? {}) };
};

const normalizeTimestamp = (
  value?: string | number | Date,
): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
};

const normalizeErrorValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const resolveParamsHash = (paramsHash?: string, params?: unknown): string => {  
  if (typeof paramsHash === "string" && paramsHash.trim()) {
    return paramsHash.trim();
  }
  if (params === undefined) return "unknown";
  try {
    return sha256Hex(stableJsonStringify(params));
  } catch {
    return "unknown";
  }
};

const estimateBodyBytes = (body: unknown): number | null => {
  if (body === undefined) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return null;
  }
};

const checkToolLogIngestRate = (
  key: string,
): { ok: true } | { ok: false; retryAfterMs: number; limit: number } => {
  if (TOOL_LOG_INGEST_RPM <= 0) {
    return { ok: true };
  }
  const now = Date.now();
  if (toolLogIngestLimiter.size > TOOL_LOG_INGEST_RATE_MAX_KEYS) {
    for (const [entryKey, entry] of toolLogIngestLimiter.entries()) {
      if (entry.resetAt <= now) {
        toolLogIngestLimiter.delete(entryKey);
      }
    }
  }
  const existing = toolLogIngestLimiter.get(key);
  const record =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + TOOL_LOG_INGEST_RATE_WINDOW_MS };
  record.count += 1;
  toolLogIngestLimiter.set(key, record);
  if (record.count > TOOL_LOG_INGEST_RPM) {
    return { ok: false, retryAfterMs: record.resetAt - now, limit: TOOL_LOG_INGEST_RPM };
  }
  return { ok: true };
};

const PHYSICS_TOOL_NAME = "physics.curvature.unit";

const repoToolsEnabled = (): boolean => process.env.ENABLE_REPO_TOOLS === "1";

const addWarpAskStep = (
  steps: ExecutorStep[],
  goal: string,
  warpParams?: Record<string, unknown>,
  intent?: IntentFlags,
): ExecutorStep[] => {
  const existing = steps.find((step) => step.kind === "tool.call" && step.tool === warpAskSpec.name);
  const warpIntent =
    intent?.wantsWarp ||
    intent?.wantsPhysics ||
    isWarpOrPhysicsIntentGoal(goal) ||
    isViabilityIntentGoal(goal) ||
    (warpParams && Object.keys(warpParams).length > 0);
  if (!warpIntent && !existing) {
    return steps;
  }
  const warpStepId = existing?.id ?? `warp.ask.${crypto.randomUUID()}`;
  const warpStep =
    existing ??
    ({
      id: warpStepId,
      kind: "tool.call",
      tool: warpAskSpec.name,
      summaryRef: undefined,
      promptTemplate: "Run grounded physics.warp.ask for the user question.",
      extra: {
        question: goal,
        includeSnapshot: true,
        params: warpParams ?? undefined,
      },
    } as ExecutorStep);
  const rest = steps.filter((step) => !(step.kind === "tool.call" && step.tool === warpAskSpec.name));
  const injected = [warpStep, ...rest];

  for (const step of injected) {
    if (
      step.kind !== "tool.call" ||
      step.tool === warpAskSpec.name ||
      step.tool === warpViabilitySpec.name ||
      step.tool === grGroundingSpec.name
    ) {
      continue;
    }
    const extra = (step.extra ?? {}) as { appendSummaries?: string[] };
    const existingAppends = Array.isArray(extra.appendSummaries) ? extra.appendSummaries : [];
    const appendSummaries = Array.from(new Set([...existingAppends, warpStepId]));
    step.extra = { ...extra, appendSummaries };
  }

  return injected;
};

const addWarpViabilityStep = (
  steps: ExecutorStep[],
  goal: string,
  warpParams?: Record<string, unknown>,
  intent?: IntentFlags,
): ExecutorStep[] => {
  const existing = steps.find((step) => step.kind === "tool.call" && step.tool === warpViabilitySpec.name);
  const viabilityIntent =
    isViabilityIntentGoal(goal) ||
    intent?.wantsWarp ||
    intent?.wantsPhysics ||
    (warpParams && Object.keys(warpParams).length > 0 && (intent?.wantsWarp || intent?.wantsPhysics));
  if (!viabilityIntent && !existing) {
    return steps;
  }
  const viabilityStepId = existing?.id ?? `warp.viability.${crypto.randomUUID()}`;
  const viabilityStep =
    existing ??
    ({
      id: viabilityStepId,
      kind: "tool.call",
      tool: warpViabilitySpec.name,
      summaryRef: undefined,
      promptTemplate:
        "Run physics.warp.viability to issue a warp-viability certificate; use only the certificate payload to narrate viability.",
      extra: { ...(warpParams ?? {}) },
    } as ExecutorStep);
  const rest = steps.filter((step) => !(step.kind === "tool.call" && step.tool === warpViabilitySpec.name));
  const injected = [viabilityStep, ...rest];

  for (const step of injected) {
    if (
      step.kind !== "tool.call" ||
      step.tool === warpViabilitySpec.name ||
      step.tool === warpAskSpec.name ||
      step.tool === grGroundingSpec.name
    ) {
      continue;
    }
    const extra = (step.extra ?? {}) as { appendSummaries?: string[] };
    const existingAppends = Array.isArray(extra.appendSummaries) ? extra.appendSummaries : [];
    const appendSummaries = Array.from(new Set([...existingAppends, viabilityStepId]));
    step.extra = { ...extra, appendSummaries };
  }

  return injected;
};

const addGrGroundingStep = (
  steps: ExecutorStep[],
  goal: string,
  warpParams?: Record<string, unknown>,
  intent?: IntentFlags,
): ExecutorStep[] => {
  const existing = steps.find(
    (step) => step.kind === "tool.call" && step.tool === grGroundingSpec.name,
  );
  const groundingIntent =
    intent?.wantsWarp ||
    intent?.wantsPhysics ||
    isWarpOrPhysicsIntentGoal(goal) ||
    isViabilityIntentGoal(goal) ||
    (warpParams && Object.keys(warpParams).length > 0);
  if (!groundingIntent && !existing) {
    return steps;
  }
  const groundingStepId = existing?.id ?? `gr.grounding.${crypto.randomUUID()}`;
  const groundingStep =
    existing ??
    ({
      id: groundingStepId,
      kind: "tool.call",
      tool: grGroundingSpec.name,
      summaryRef: undefined,
      promptTemplate:
        "Run physics.gr.grounding to capture GR residuals, constraints, and certificate references for the agent.",
      extra:
        warpParams && Object.keys(warpParams).length > 0
          ? { warpConfig: warpParams }
          : undefined,
    } as ExecutorStep);
  const rest = steps.filter(
    (step) => !(step.kind === "tool.call" && step.tool === grGroundingSpec.name),
  );
  const injected = [groundingStep, ...rest];

  for (const step of injected) {
    if (
      step.kind !== "tool.call" ||
      step.tool === grGroundingSpec.name ||
      step.tool === warpAskSpec.name ||
      step.tool === warpViabilitySpec.name
    ) {
      continue;
    }
    const extra = (step.extra ?? {}) as { appendSummaries?: string[] };
    const existingAppends = Array.isArray(extra.appendSummaries)
      ? extra.appendSummaries
      : [];
    const appendSummaries = Array.from(
      new Set([...existingAppends, groundingStepId]),
    );
    step.extra = { ...extra, appendSummaries };
  }

  return injected;
};

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
  if (!getTool(noiseGenCoverSpec.name)) {
    registerTool({ ...noiseGenCoverSpec, handler: noiseGenCoverHandler });
  }
  if (!getTool(noiseGenFingerprintSpec.name)) {
    registerTool({
      ...noiseGenFingerprintSpec,
      handler: noiseGenFingerprintHandler,
    });
  }
  if (!getTool(sttWhisperSpec.name)) {
    registerTool({ ...sttWhisperSpec, handler: sttWhisperHandler });
  }
  if (!getTool(warpAskSpec.name)) {
    registerTool({ ...warpAskSpec, handler: warpAskHandler });
  }
  if (!getTool(warpViabilitySpec.name)) {
    registerTool({ ...warpViabilitySpec, handler: warpViabilityHandler });
  }
  if (!getTool(grGroundingSpec.name)) {
    registerTool({ ...grGroundingSpec, handler: grGroundingHandler });
  }
  if (!getTool(essenceMixSpec.name)) {
    registerTool({ ...essenceMixSpec, handler: essenceMixHandler });
  }
  if (!getTool(repoGraphSearchSpec.name)) {
    registerTool({ ...repoGraphSearchSpec, handler: repoGraphSearchHandler });
  }
  if (repoToolsEnabled()) {
    if (!getTool(repoDiffReviewSpec.name)) {
      registerTool({ ...repoDiffReviewSpec, handler: repoDiffReviewHandler });
    }
    if (!getTool(repoPatchSimulateSpec.name)) {
      registerTool({ ...repoPatchSimulateSpec, handler: repoPatchSimulateHandler });
    }
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

// Lightweight pipeline status snapshot for grounding telemetry/status intents
planRouter.get("/pipeline/status", (_req, res) => {
  try {
    const state = getGlobalPipelineState();
    // Avoid leaking large buffers; send core physics/warp fields
    const { warp, natario, warpUniforms, natarioConstraint, dutyEffective_FR, thetaScaleExpected, thetaScale } = state as any;
    res.json({
      ok: true,
      natarioConstraint: natarioConstraint ?? warp?.isZeroExpansion ?? natario?.isZeroExpansion,
      dutyEffective_FR,
      thetaScaleExpected,
      thetaScale,
      warp: warp ?? null,
      natario: natario ?? null,
      warpUniforms: warpUniforms ?? null,
      capturedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: "pipeline_status_error", message });
  }
});

planRouter.get("/pipeline/last-plan-debug", async (req, res) => {
  const traceIdParam =
    typeof req.query.traceId === "string" && req.query.traceId.trim().length > 0
      ? req.query.traceId.trim()
      : undefined;
  let record: PlanRecord | null = null;
  if (traceIdParam) {
    record = getPlanRecord(traceIdParam) ?? (await rehydratePlanRecord(traceIdParam));
    if (record) {
      rememberPlanRecord(record);
    }
  }
  if (!record) {
    record = findLatestAccessiblePlan(req.auth);
  }
  if (!record) {
    return res.status(404).json({ error: "plan_debug_unavailable" });
  }
  if (!personaPolicy.canAccess(req.auth, record.personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const groundingSources = dedupeGroundingSources(
    record.groundingReport?.sources ?? record.taskTrace.grounding_report?.sources ?? [],
  );
  const patch = pickResonancePatch({ bundle: record.resonance, selection: record.resonanceSelection });
  const resonanceNodes = patch?.nodes ?? [];
  const resonancePatches = resonanceNodes
    .filter((node) => node?.filePath || node?.symbol)
    .slice(0, 16)
    .map((node) => ({
      id: node.id ?? node.symbol ?? patch?.id ?? "",
      path: node.filePath ?? node.symbol ?? "",
      kind: node.kind,
      score: node.score,
    }));
  res.json({
    ok: true,
    traceId: record.traceId,
    createdAt: record.createdAt,
    goal: record.goal,
    personaId: record.personaId,
    planDsl: record.planDsl,
    resonancePatchId: patch?.id ?? null,
    resonancePatches,
    groundingSources,
  });
});

planRouter.post("/local-call-spec", async (req, res) => {
  if ((process.env.ENABLE_LOCAL_CALL_SPEC ?? process.env.VITE_ENABLE_LOCAL_CALL_SPEC) !== "1") {
    return res.status(404).json({ error: "local_call_spec_disabled" });
  }
  if (!LOCAL_CALL_SPEC_URL) {
    return res.status(503).json({ error: "local_call_spec_unconfigured" });
  }
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), LOCAL_CALL_SPEC_TIMEOUT_MS);
    const response = await fetch(LOCAL_CALL_SPEC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body ?? {}),
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!response.ok) {
      return res.status(502).json({ error: "local_call_spec_upstream", status: response.status });
    }
    const payload = await response.json();
    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: "local_call_spec_failed", message });
  }
});

const proxyBinaryPost = async (
  targetUrl: string,
  timeoutMs: number,
  req: Request,
  res: Response,
  disabledError: string,
) => {
  if (!targetUrl) {
    return res.status(503).json({ error: `${disabledError}_unconfigured` });
  }
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    const body: BodyInit | undefined = (() => {
      const payload = req.body;
      if (payload === undefined) return undefined;
      if (typeof payload === "string") return payload;
      if (payload instanceof ArrayBuffer) return payload;
      if (typeof SharedArrayBuffer !== "undefined" && payload instanceof SharedArrayBuffer) {
        return new Uint8Array(payload).slice();
      }
      if (ArrayBuffer.isView(payload)) return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength).slice();
      return JSON.stringify(payload);
    })();
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "content-type": req.headers["content-type"] ?? "application/octet-stream" },
      body,
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!response.ok) {
      return res.status(502).json({ error: `${disabledError}_upstream`, status: response.status });
    }
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await response.arrayBuffer());
    res.setHeader("content-type", contentType);
    return res.status(200).send(buf);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: `${disabledError}_failed`, message });
  }
};

planRouter.post("/tts/local", async (req, res) => {
  const enabled = (process.env.ENABLE_LOCAL_TTS ?? process.env.VITE_ENABLE_LOCAL_TTS) === "1";
  if (!enabled) {
    return res.status(404).json({ error: "local_tts_disabled" });
  }
  return proxyBinaryPost(LOCAL_TTS_URL, LOCAL_TTS_TIMEOUT_MS, req, res, "local_tts");
});

planRouter.post("/stt/local", async (req, res) => {
  const enabled = (process.env.ENABLE_LOCAL_STT ?? process.env.VITE_ENABLE_LOCAL_STT) === "1";
  if (!enabled) {
    return res.status(404).json({ error: "local_stt_disabled" });
  }
  return proxyBinaryPost(LOCAL_STT_URL, LOCAL_STT_TIMEOUT_MS, req, res, "local_stt");
});

planRouter.post("/plan", async (req, res) => {
  await ensureDefaultTools();
  await ensureSpecialistsRegistered();
  const parsed = PlanRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }

  const debugSources = parseDebugSourcesFlag(parsed.data.debugSources, req.query.debug_sources ?? req.query.debugSources);
  const promptSpec = sanitizePromptSpecForServer(parsed.data.prompt_spec);
  const collapseTrace = parsed.data.collapse_trace;
  const collapseStrategy =
    normalizeCollapseStrategy(parsed.data.collapse_strategy ?? collapseTrace?.strategy ?? process.env.HYBRID_COLLAPSE_MODE) ??
    "deterministic_hash_v1";
  let callSpec: LocalCallSpec | undefined = parsed.data.call_spec ?? undefined;
  let groundingReport: GroundingReport | undefined;
  let { personaId } = parsed.data;
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const { searchQuery, topK, summaryFocus } = parsed.data;
  const promptGoal = (promptSpec?.user_question ?? "").trim();
  const goal = (promptGoal.length >= 3 ? promptGoal : parsed.data.goal).slice(0, 20000);
  const desktopId = parsed.data.desktopId?.trim() || DEFAULT_DESKTOP_ID;
  const warpParams = parsed.data.warpParams;
  const baseTelemetryBundle = getConsoleTelemetry(desktopId);
  const { bundle: telemetryBundle } = ensureCasimirTelemetry({ desktopId, base: baseTelemetryBundle });
  const telemetrySummary = summarizeConsoleTelemetry(telemetryBundle);
  const query = (callSpec?.premise ?? searchQuery ?? goal).trim();
  const resonanceQuery = normalizeForIntent(query);
  let intent = classifyIntent(goal);
  let callSpecIntent = new Set((callSpec?.intent ?? []).map((tag) => tag.toLowerCase()));
  if (callSpecIntent.has("warp_physics") || callSpecIntent.has("warp")) {
    intent.wantsWarp = true;
    intent.wantsPhysics = true;
  }
  if (callSpecIntent.has("implementation")) {
    intent.wantsImplementation = true;
  }
  if (callSpecIntent.has("physics")) {
    intent.wantsPhysics = true;
  }
  if (parsed.data.essenceConsole) {
    intent = { ...intent, wantsWarp: true, wantsPhysics: true };
  }
  if (intent.wantsImplementation && !callSpecIntent.has("repo_deep")) {
    callSpecIntent.add("repo_deep");
    const baseSpec: LocalCallSpec = callSpec ?? { action: "call_remote", premise: goal, intent: [] };
    callSpec = { ...baseSpec, intent: Array.from(callSpecIntent) };
  }
  if (process.env.SMALL_LLM_URL) {
    try {
      const existingHints = (callSpec?.resourceHints ?? [])
        .map((hint) => hint.path || hint.id || hint.url)
        .filter((value): value is string => typeof value === "string" && value.length > 0);
      const triage = await smallLlmCallSpecTriage({
        currentChat: goal,
        currentPageContext: query,
        existingResourceHints: existingHints,
      });
      if (triage.intentTags?.length) {
        const intentSet = new Set([...(callSpec?.intent ?? []), ...triage.intentTags]);
        const baseSpec: LocalCallSpec = callSpec ?? { action: "call_remote", premise: goal, intent: [] };
        callSpec = { ...baseSpec, intent: Array.from(intentSet) };
      }
      if (triage.resourceHints?.length) {
        const mergedHints = [
          ...(callSpec?.resourceHints ?? []),
          ...triage.resourceHints.map((hint) => ({ type: "repo_file" as const, path: hint })),
        ];
        const baseSpec: LocalCallSpec = callSpec ?? { action: "call_remote", premise: goal, intent: [] };
        callSpec = { ...baseSpec, resourceHints: mergedHints };
      }
    } catch (err) {
      console.warn("[plan] small-llm call_spec triage failed", err);
    }
  }
  callSpecIntent = new Set((callSpec?.intent ?? []).map((tag) => tag.toLowerCase()));
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
        query: resonanceQuery || query,
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
    intent,
  });
  const anchorConfig = loadAnchorConfig();
  if (anchorConfig) {
    const anchorText = [goal, query].filter(Boolean).join("\n");
    if (anchorText.trim().length > 0) {
      const anchorIntent = routeIntent(anchorText, anchorConfig);
      if (anchorIntent === "architecture" || anchorIntent === "hybrid") {
        const anchorCandidates = retrieveCandidates({
          userText: anchorText,
          cfg: anchorConfig,
          repoRoot: process.cwd(),
          max: anchorConfig.anchors.maxPerAnswer,
        });
        const merged = mergeAnchorHints({
          callSpec,
          candidates: anchorCandidates,
          goal,
          knowledgeHints,
        });
        callSpec = merged.callSpec;
        knowledgeHints = merged.knowledgeHints;
      }
    }
  }
  const resourceHintPaths: string[] = [];
  if (callSpec?.resourceHints) {
    for (const hint of callSpec.resourceHints) {
      if (hint.path) {
        knowledgeHints.push(hint.path);
        resourceHintPaths.push(hint.path);
      }
      if (hint.id) {
        knowledgeHints.push(hint.id);
        resourceHintPaths.push(hint.id);
      }
      if (hint.url) {
        resourceHintPaths.push(hint.url);
      }
    }
  }
  if (intent.wantsWarp || intent.wantsPhysics || intent.wantsImplementation) {
    const seeded = seedWarpPaths(callSpec?.resourceHints);
    for (const path of seeded) {
      if (!knowledgeHints.includes(path)) {
        knowledgeHints.push(path);
      }
      if (!resourceHintPaths.includes(path)) {
        resourceHintPaths.push(path);
      }
    }
  }

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
  const warpConsole = isWarpConsoleIntent(goal, parsed.data.essenceConsole);
  const deepIntent = intent.wantsWarp || intent.wantsPhysics || intent.wantsImplementation;
  const resonanceEvidence = resonanceBundle?.candidates?.length ?? 0;
  const hasKnowledgeEvidence = (baseKnowledgeContext?.length ?? 0) > 0;
  const hasHintEvidence = resourceHintPaths.length > 0;
  const hasEvidence = hasKnowledgeEvidence || hasHintEvidence || resonanceEvidence > 0;
  if (deepIntent && !hasEvidence && !warpConsole) {
    return res.status(400).json({
      error: "insufficient_grounding",
      message:
        "Deep repo/physics questions require grounded context (repo/docs/telemetry). Attach knowledge projects or provide call_spec.resourceHints.",
    });
  }
  const hasRepoContext =
    (baseKnowledgeContext?.length ?? 0) > 0 || (requestedProjects?.length ?? 0) > 0 || hasHintEvidence;
  const { strategy, notes: strategyNotes } = chooseReasoningStrategy(goal, {
    hasRepoContext,
    intentTags: callSpec?.intent,
    essenceConsole: parsed.data.essenceConsole,
    intent,
  });

  const basePlanArgs: BuildPlanArgs = {
    goal,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    finalTool: selectedTool,
    strategy,
    strategyNotes,
    intent,
    resourceHints: callSpec?.resourceHints,
    detailPreference: focus.toLowerCase().includes("short") ? "short" : focus.toLowerCase().includes("long") ? "long" : "medium",
    preferReviewed: strategy !== "default",
  };
  const basePlan = buildChatBPlan(basePlanArgs);
  const primaryPatchId = resonanceSelection?.primaryPatchId ?? null;
  const planCandidates = warpConsole
    ? []
    : buildCandidatePlansFromResonance({
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
        intent,
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
  const warpIntent = intent.wantsWarp || intent.wantsPhysics;
  if (winningPlan) {
    knowledgeContext = winningPlan.knowledgeContext;
    plannerPrompt = winningPlan.plannerPrompt;
    nodes = winningPlan.nodes;
    planDsl = winningPlan.planDsl;
  } else if (primaryPatchId) {
    const fallbackPatch = resonanceBundle?.candidates.find((patch) => patch.id === primaryPatchId);
    if (fallbackPatch) {
      const filteredFallback =
        warpIntent && fallbackPatch
          ? {
              ...fallbackPatch,
              nodes: (fallbackPatch.nodes ?? []).filter(
                (node) => isWarpRelevantPath(node.filePath) || isWarpRelevantPath(node.symbol ?? ""),
              ),
              knowledge: fallbackPatch.knowledge
                ? {
                    ...fallbackPatch.knowledge,
                    files: (fallbackPatch.knowledge.files ?? []).filter((file) =>
                      isWarpRelevantPath(file.path ?? file.name ?? ""),
                    ),
                  }
                : fallbackPatch.knowledge,
            }
          : fallbackPatch;
      if (filteredFallback && ((filteredFallback.nodes ?? []).length > 0 || (filteredFallback.knowledge?.files?.length ?? 0) > 0)) {
        knowledgeContext = mergeKnowledgeBundles(
          baseKnowledgeContext,
          filteredFallback.knowledge ? [filteredFallback.knowledge] : [],
        );
      } else {
        knowledgeContext = baseKnowledgeContext;
      }
      const primaryIdForPrompt = filteredFallback ? primaryPatchId : null;
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
        primaryPatchId: primaryIdForPrompt,
        telemetryBundle,
        knowledgeHints,
      });
    }
  }
  knowledgeContext = prioritizeKnowledgeContext(knowledgeContext, requestedProjects);
  if (debugSources) {
    const groundingHolder: { groundingReport?: GroundingReport } = { groundingReport };
    recordResonancePatchSources(groundingHolder, {
      bundle: resonanceBundle,
      selection: resonanceSelection,
      filterNode:
        intent.wantsWarp || intent.wantsPhysics
          ? (node) => isWarpRelevantPath(node.filePath) || isWarpRelevantPath(node.symbol ?? "")
          : undefined,
    });
    recordKnowledgeSources(groundingHolder, knowledgeContext);
    groundingReport = groundingHolder.groundingReport;
  }
  const executorStepsAll = addWarpAskStep(
    addWarpViabilityStep(
      addGrGroundingStep(compilePlan(nodes), goal, warpParams, intent),
      goal,
      warpParams,
      intent,
    ),
    goal,
    warpParams,
    intent,
  );
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
    reasoning_strategy: strategy,
    strategy_notes: strategyNotes,
    grounding_report: groundingReport,
    debug_sources: debugSources,
    collapse_strategy: collapseStrategy,
    collapse_trace: collapseTrace,
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
    strategy,
    strategyNotes,
    groundingReport,
    debugSources,
    promptSpec: promptSpec ?? undefined,
    collapseTrace: collapseTrace ?? undefined,
    collapseStrategy,
    callSpec: callSpec ?? undefined,
  };

  registerInMemoryTrace(taskTrace);
  rememberPlanRecord(record);
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
    strategy,
    strategy_notes: strategyNotes,
    task_trace: taskTrace,
    collapse_trace: collapseTrace ?? taskTrace.collapse_trace ?? null,
    collapse_strategy: collapseStrategy,
    call_spec: callSpec ?? null,
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
  const debugSources = parseDebugSourcesFlag(parsed.data.debugSources, req.query.debug_sources ?? req.query.debugSources);
  const { traceId } = parsed.data;
  let record: PlanRecord | null = getPlanRecord(traceId);
  if (!record) {
    record = await rehydratePlanRecord(traceId);
    if (record) {
      rememberPlanRecord(record);
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

  const effectiveDebugSources = Boolean(debugSources || record.debugSources);
  record.debugSources = effectiveDebugSources;
  const groundingHolder: { groundingReport?: GroundingReport } = {
    groundingReport: record.groundingReport ?? record.taskTrace.grounding_report ?? undefined,
  };
  if (effectiveDebugSources) {
    ensurePlannerGroundingReport(groundingHolder);
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
  const executionRuntime: ExecutionRuntime = {
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
    debugSources: effectiveDebugSources,
    groundingReport: groundingHolder.groundingReport,
  };
  const runtimeIntent = (() => {
    const base = classifyIntent(record.goal);
    if (record.strategy === "physics_console") {
      return { ...base, wantsWarp: true, wantsPhysics: true };
    }
    return base;
  })();
  const executorStepsRuntime = addWarpAskStep(
    addWarpViabilityStep(
      addGrGroundingStep(record.executorSteps, record.goal, undefined, runtimeIntent),
      record.goal,
      undefined,
      runtimeIntent,
    ),
    record.goal,
    undefined,
    runtimeIntent,
  );
  record.executorSteps = executorStepsRuntime;
  const steps = await executeCompiledPlan(executorStepsRuntime, executionRuntime);
  record.groundingReport = executionRuntime.groundingReport ?? groundingHolder.groundingReport;
  record.taskTrace.grounding_report = executionRuntime.groundingReport ?? record.taskTrace.grounding_report;
  record.taskTrace.debug_sources = executionRuntime.debugSources ?? record.taskTrace.debug_sources;
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
  try {
    await withTimeout(saveTaskTrace(record.taskTrace), SAVE_TASK_TRACE_TIMEOUT_MS, "save_task_trace");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[agi.plan] task trace persistence skipped: ${message}`);
  }
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
    ...(effectiveDebugSources
      ? { groundingReport: record.groundingReport ?? executionRuntime.groundingReport ?? null }
      : {}),
  });
});

planRouter.get("/tools/logs", (req, res) => {
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const parsed = ToolLogsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { limit, tool } = parsed.data;
  const logs = getToolLogs({ limit, tool, tenantId: tenantGuard.tenantId });
  res.json({ logs, limit, tool });
});

planRouter.post("/tools/logs/ingest", (req, res) => {
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const contentLength = Number(req.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > TOOL_LOG_INGEST_MAX_BYTES
  ) {
    return res.status(413).json({
      error: "payload_too_large",
      limitBytes: TOOL_LOG_INGEST_MAX_BYTES,
    });
  }
  const estimatedBytes = estimateBodyBytes(req.body);
  if (estimatedBytes !== null && estimatedBytes > TOOL_LOG_INGEST_MAX_BYTES) {
    return res.status(413).json({
      error: "payload_too_large",
      limitBytes: TOOL_LOG_INGEST_MAX_BYTES,
    });
  }
  const parsed = ToolLogIngestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const defaults = parsed.data.defaults ?? {};
  const records = [
    ...(parsed.data.record ? [parsed.data.record] : []),
    ...(parsed.data.records ?? []),
  ];
  const events = [
    ...(parsed.data.event ? [parsed.data.event] : []),
    ...(parsed.data.events ?? []),
  ];
  const langGraphEvents = [
    ...(parsed.data.langGraphEvent ? [parsed.data.langGraphEvent] : []),        
    ...(parsed.data.langGraphEvents ?? []),
  ];
  if (records.length === 0 && events.length === 0 && langGraphEvents.length === 0) {
    return res.status(400).json({ error: "bad_request", details: [{ message: "no_events" }] });
  }
  const totalIngested = records.length + events.length + langGraphEvents.length;
  if (totalIngested > TOOL_LOG_INGEST_MAX_RECORDS) {
    return res.status(413).json({
      error: "record_limit_exceeded",
      limit: TOOL_LOG_INGEST_MAX_RECORDS,
      received: totalIngested,
    });
  }
  const rateKey = tenantGuard.tenantId ?? req.ip ?? "anonymous";
  const rateResult = checkToolLogIngestRate(rateKey);
  if (!rateResult.ok) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(rateResult.retryAfterMs / 1000),
    );
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "rate_limited",
      limit: rateResult.limit,
      retryAfterMs: rateResult.retryAfterMs,
    });
  }

  const counts = {
    records: 0,
    events: 0,
    langGraphEvents: 0,
    starts: 0,
    successes: 0,
    errors: 0,
    ignored: 0,
  };

  for (const record of records) {
    const tool = record.tool.trim();
    if (!tool) {
      counts.ignored += 1;
      continue;
    }
    const policy = mergePolicyFlags(defaults.policy, record.policy);
    const paramsHash = resolveParamsHash(record.paramsHash, record.params);     
    appendToolLog({
      tool,
      version: record.version ?? defaults.version ?? "unknown",
      paramsHash,
      promptHash: record.promptHash,
      durationMs: record.durationMs,
      tenantId: tenantGuard.tenantId,
      sessionId: record.sessionId ?? defaults.sessionId,
      traceId: record.traceId ?? defaults.traceId,
      stepId: record.stepId,
      seed: record.seed,
      ok: record.ok,
      error: record.ok ? undefined : normalizeErrorValue(record.error),
      policy,
      essenceId: record.essenceId,
      text: record.text,
      debateId: record.debateId,
      strategy: record.strategy,
      ts: normalizeTimestamp(record.ts),
    });
    counts.records += 1;
  }

  const applyEventDefaults = (event: z.infer<typeof ToolEventSchema>) => ({     
    ...event,
    tenantId: tenantGuard.tenantId,
    traceId: event.traceId ?? defaults.traceId,
    sessionId: event.sessionId ?? defaults.sessionId,
    version: event.version ?? defaults.version,
    policy: mergePolicyFlags(defaults.policy, event.policy),
  });

  const handleEvent = (event: z.infer<typeof ToolEventSchema>): void => {
    const normalized = applyEventDefaults(event);
    toolEventAdapter.handle(normalized);
    if (normalized.kind === "start") counts.starts += 1;
    if (normalized.kind === "success") counts.successes += 1;
    if (normalized.kind === "error") counts.errors += 1;
  };

  for (const event of events) {
    handleEvent(event);
    counts.events += 1;
  }

  for (const rawEvent of langGraphEvents) {
    const mapped = mapLangGraphToolEvent(rawEvent as any);
    if (!mapped) {
      counts.ignored += 1;
      continue;
    }
    const normalized = applyEventDefaults(mapped);
    toolEventAdapter.handle(normalized);
    if (normalized.kind === "start") counts.starts += 1;
    if (normalized.kind === "success") counts.successes += 1;
    if (normalized.kind === "error") counts.errors += 1;
    counts.langGraphEvents += 1;
  }

  res.json({ ok: true, counts });
});

planRouter.get("/tools/logs/stream", (req, res) => {
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const parsed = ToolLogsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { limit, tool } = parsed.data;
  const tenantId = tenantGuard.tenantId;
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
    ? getToolLogsSince(lastEventId, { tool, tenantId })
    : getToolLogs({ limit, tool, tenantId }).sort((a, b) => a.seq - b.seq);
  for (const entry of backlog) {
    sendEvent(entry);
  }

  const unsubscribe = subscribeToolLogs((entry) => {
    if (tenantId && entry.tenantId !== tenantId) {
      return;
    }
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
