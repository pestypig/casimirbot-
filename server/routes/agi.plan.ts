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
import {
  agiRefineryRequestSchema,
  type AgiEvidence,
  type AgiExecutionEnvelope,
  type AgiIntent,
  type AgiRefineryRequest,
  type AgiRunMode,
} from "@shared/agi-refinery";
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
  type ExecutionResult,
  type ExecutionRuntime,
  type PlanNode,
  type ReasoningStrategy,
  type IntentFlags,
  buildChatBPlan,
  chooseReasoningStrategy,
  buildCandidatePlansFromResonance,
  compilePlan,
  executeCompiledPlan,
  pickReadableText,
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
import { grAssistantHandler, grAssistantSpec } from "../skills/physics.gr.assistant";
import { debateRunHandler, debateRunSpec } from "../skills/debate.run";
import { docsEvidenceSearchMdHandler, docsEvidenceSearchMdSpec } from "../skills/docs.evidence.search.md";
import { docsEvidenceSearchPdfHandler, docsEvidenceSearchPdfSpec } from "../skills/docs.evidence.search.pdf";
import { docsHeadingSectionHandler, docsHeadingSectionSpec } from "../skills/docs.heading.section.md";
import { docsTableExtractHandler, docsTableExtractSpec } from "../skills/docs.table.extract";
import { debateClaimExtractHandler, debateClaimExtractSpec } from "../skills/debate.claim.extract";
import { citationVerifySpanHandler, citationVerifySpanSpec } from "../skills/citation.verify.span";
import { docsContradictionScanHandler, docsContradictionScanSpec } from "../skills/docs.contradiction.scan";
import { numericExtractUnitsHandler, numericExtractUnitsSpec } from "../skills/numeric.extract.units";
import { hashEmbed } from "../services/hce-text";
import { resolveLocalContextTokens } from "../services/llm/local-runtime";
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
import {
  matchHelixAskIntent,
  getDefaultHelixAskIntentProfile,
  getHelixAskIntentProfileById,
  type HelixAskIntentProfile,
} from "../services/helix-ask/intent-directory";
import {
  enforceHelixAskAnswerFormat,
  collapseEvidenceBullets,
  resolveHelixAskFormat,
  type HelixAskFormat,
} from "../services/helix-ask/format";
import { buildHelixAskEnvelope } from "../services/helix-ask/envelope";
import { extractFilePathsFromText } from "../services/helix-ask/paths";
import {
  evaluateClaimCoverage,
  evaluateEvidenceEligibility,
  evaluateEvidenceCritic,
  extractClaimCandidates,
  filterCriticTokens,
  filterSignalTokens,
  tokenizeAskQuery,
} from "../services/helix-ask/query";
import { resolveHelixAskArbiter } from "../services/helix-ask/arbiter";
import {
  buildConceptScaffold,
  findConceptMatch,
  listConceptCandidates,
  renderConceptAnswer,
  renderConceptDefinition,
  type HelixAskConceptCandidate,
  type HelixAskConceptMatch,
} from "../services/helix-ask/concepts";
import {
  buildRepoSearchPlan,
  formatRepoSearchEvidence,
  runRepoSearch,
  type RepoSearchResult,
} from "../services/helix-ask/repo-search";
import {
  buildHelixAskMathAnswer,
  solveHelixAskMathQuestion,
  type HelixAskMathSolveResult,
} from "../services/helix-ask/math";
import {
  applyHelixAskPlatonicGates,
  type HelixAskDomain,
} from "../services/helix-ask/platonic-gates";
import {
  buildHelixAskTopicProfile,
  inferHelixAskTopicTags,
  pathMatchesAny,
  scoreHelixAskTopicPath,
  topicMustIncludeSatisfied,
  type HelixAskTopicTag,
  type HelixAskTopicProfile,
} from "../services/helix-ask/topic";
import {
  appendHelixAskJobPartial,
  completeHelixAskJob,
  createHelixAskJob,
  failHelixAskJob,
  getHelixAskJob,
  markHelixAskJobRunning,
  type HelixAskJobRecord,
} from "../services/helix-ask/job-store";
import { runNoiseFieldLoop } from "../../modules/analysis/noise-field-loop";
import { runImageDiffusionLoop } from "../../modules/analysis/diffusion-loop";
import { runBeliefGraphLoop } from "../../modules/analysis/belief-graph-loop";
import { runGrEvaluation } from "../gr/gr-evaluation";
import { getGlobalPipelineState } from "../energy-pipeline";
import { getTaskTrace, saveTaskTrace } from "../db/agi";
import { metrics, sseConnections } from "../metrics";
import { personaPolicy } from "../auth/policy";
import { guardTenant } from "../auth/tenant";
import { hashStableJson } from "../utils/information-boundary";
import {
  normalizeEvidencePath,
  normalizeEvidenceRef,
} from "../services/agi/refinery-identity";
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
import { resolveLocalRuntimeCaps } from "../services/llm/local-runtime";
import { fetchKnowledgeForProjects } from "../services/knowledge/corpus";
import {
  getTrainingTraceExport,
  recordTrainingTrace,
} from "../services/observability/training-trace-store";
import {
  detectSafetyHandling,
  hasRestrictedInput,
  isRestrictedEvidencePath,
  evaluateTrajectoryGates,
} from "../services/agi/refinery-gates";
import {
  buildEvidenceFromRepoGraphHits,
  buildRefineryTrajectory,
} from "../services/agi/refinery-trajectory";
import { searchRepoGraph } from "../services/repo/repoGraph";
import {
  buildKnowledgeValidator,
  KnowledgeValidationError,
  estimateKnowledgeContextBytes,
} from "../services/knowledge/validation";
import { mergeKnowledgeBundles } from "../services/knowledge/merge";
import { buildResonanceBundle } from "../services/code-lattice/resonance";
import { getLatticeVersion, loadCodeLattice } from "../services/code-lattice/loader";
import { collectBadgeTelemetry } from "../services/telemetry/badges";
import { collectPanelSnapshots } from "../services/telemetry/panels";
import { smallLlmCallSpecTriage } from "../services/small-llm";

const planRouter = Router();
const LOCAL_SPAWN_TOOL_NAME = "llm.local.spawn.generate";
const HTTP_TOOL_NAME = "llm.http.generate";
const normalizeEnv = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};
const resolveDefaultModel = (): string | undefined =>
  normalizeEnv(process.env.LLM_HTTP_MODEL) ??
  normalizeEnv(process.env.LLM_LOCAL_MODEL);
const resolvePlannerModel = (): string | undefined =>
  normalizeEnv(process.env.AGI_ROUTER_MODEL) ??
  normalizeEnv(process.env.AGI_ROUTER_ADAPTER) ??
  normalizeEnv(process.env.AGI_PLANNER_MODEL) ??
  resolveDefaultModel();
const resolveExecutorModel = (): string | undefined =>
  normalizeEnv(process.env.AGI_ANSWERER_MODEL) ??
  normalizeEnv(process.env.AGI_ANSWERER_ADAPTER) ??
  normalizeEnv(process.env.AGI_EXECUTOR_MODEL) ??
  resolveDefaultModel();
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
  sessionId?: string;
  planDsl: string;
  nodes: PlanNode[];
  executorSteps: ExecutorStep[];
  manifest: ToolManifestEntry[];
  plannerPrompt: string;
  taskTrace: TTaskTrace;
  knowledgeContext?: KnowledgeProjectExport[];
  knowledgeHash?: string | null;
  knowledgeHints?: string[];
  resourceHints?: string[];
  knowledgeProjects?: string[];
  searchQuery?: string;
  topK?: number;
  summaryFocus?: string;
  desktopId?: string;
  telemetry?: ConsoleTelemetryBundle | null;
  telemetrySummary?: string | null;
  resonance?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  latticeVersion?: number | string | null;
  debateId?: string | null;
  strategy?: ReasoningStrategy;
  strategyNotes?: string[];
  intent?: IntentFlags;
  groundingReport?: GroundingReport;
  debugSources?: boolean;
  promptSpec?: PromptSpec;
  collapseTrace?: TCollapseTraceEntry;
  collapseStrategy?: string;
  callSpec?: LocalCallSpec;
  refinery?: AgiRefineryRequest;
};

type PlanRecordCacheEntry = { record: PlanRecord; expiresAt: number };

const planRecords = new Map<string, PlanRecordCacheEntry>();
const REFINERY_TRACE_ENABLED = process.env.ENABLE_AGI_REFINERY_TRACE === "1";
const REFINERY_TRACE_PERSONAS = new Set(
  (process.env.AGI_REFINERY_TRACE_PERSONAS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
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

const REFINERY_TRACE_ON_REFINE =
  process.env.AGI_REFINERY_TRACE_ON_REFINE !== "0";

const shouldCaptureRefineryTrace = (
  personaId: string | undefined,
  refinery?: AgiRefineryRequest,
): boolean => {
  if (REFINERY_TRACE_ENABLED) return true;
  if (REFINERY_TRACE_ON_REFINE) return true;
  if (!personaId) return false;
  if (REFINERY_TRACE_PERSONAS.size === 0) return false;
  return REFINERY_TRACE_PERSONAS.has(personaId) || REFINERY_TRACE_PERSONAS.has("all");
};

const clampRatio = (value: number): number => Math.min(Math.max(value, 0), 1);

const parseAlphaTarget = (): number | undefined => {
  const raw = process.env.AGI_REFINERY_ALPHA_TARGET;
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return clampRatio(parsed);
};

const parseAlphaWindow = (): number => {
  const parsed = Number(process.env.AGI_REFINERY_ALPHA_WINDOW ?? 400);
  if (!Number.isFinite(parsed)) return 400;
  return Math.min(Math.max(25, Math.floor(parsed)), 5000);
};

type AlphaGovernorState = {
  enabled: boolean;
  alphaTarget?: number;
  live: number;
  variant: number;
  cap: number;
  window: number;
  alphaRun: number;
  runMode: AgiRunMode;
  engaged: boolean;
};

const collectAcceptedOrigins = (limit: number): { live: number; variant: number } => {
  const traces = getTrainingTraceExport({ limit });
  let live = 0;
  let variant = 0;
  for (const trace of traces) {
    if (!trace.payload || trace.payload.kind !== "trajectory") continue;
    if (!trace.pass) continue;
    const origin = trace.payload.data.meta?.origin;
    if (origin === "variant") {
      variant += 1;
    } else {
      live += 1;
    }
  }
  return { live, variant };
};

const computeVariantCap = (alphaTarget: number, live: number): number => {
  if (alphaTarget >= 1) return 0;
  if (alphaTarget <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(((1 - alphaTarget) / alphaTarget) * live);
};

const classifyRunModeFromCounts = (live: number, variant: number): AgiRunMode => {
  const total = live + variant;
  const liveShare = total > 0 ? live / total : 0;
  const variantShare = total > 0 ? variant / total : 0;
  if (liveShare >= 0.8) return "anchor_mining";
  if (variantShare >= 0.8) return "variant_expansion";
  return "mixed";
};

const computeAlphaGovernorState = (): AlphaGovernorState => {
  const alphaTarget = parseAlphaTarget();
  const enabled = process.env.AGI_REFINERY_ALPHA_GOVERNOR !== "0";
  const window = parseAlphaWindow();
  if (!enabled || alphaTarget === undefined) {
    return {
      enabled,
      alphaTarget,
      live: 0,
      variant: 0,
      cap: Number.POSITIVE_INFINITY,
      window,
      alphaRun: 0,
      runMode: "mixed",
      engaged: false,
    };
  }
  const { live, variant } = collectAcceptedOrigins(window);
  const cap = computeVariantCap(alphaTarget, live);
  const total = live + variant;
  const alphaRun = total > 0 ? live / total : 0;
  const runMode = classifyRunModeFromCounts(live, variant);
  const engaged = Number.isFinite(cap) && variant >= cap;
  return {
    enabled,
    alphaTarget,
    live,
    variant,
    cap,
    window,
    alphaRun,
    runMode,
    engaged,
  };
};

const evaluateAlphaGovernor = (
  origin: string | undefined,
  accepted: boolean,
): {
  allow: boolean;
  alphaTarget?: number;
  live: number;
  variant: number;
  cap: number;
  window: number;
  alphaRun: number;
  runMode: AgiRunMode;
  engaged: boolean;
} => {
  const state = computeAlphaGovernorState();
  if (!state.enabled || state.alphaTarget === undefined || origin !== "variant" || !accepted) {
    return { allow: true, ...state };
  }
  const projected = state.variant + 1;
  return {
    allow: projected <= state.cap,
    ...state,
    engaged: projected > state.cap,
  };
};

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

const detectStepErrorType = (step: unknown): string | undefined => {
  if (!step || typeof step !== "object") return undefined;
  const error = (step as { error?: unknown }).error;
  if (!error || typeof error !== "object") return undefined;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
};

type ExecutionErrorInfo = {
  message?: string;
  type?: string;
  code?: string;
  name?: string;
  stack?: string;
  policyReason?: string;
};

const MAX_EXECUTION_ERROR_MESSAGE = 220;

const coerceString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const normalizeErrorMessage = (value: unknown): string | undefined => {
  const text = coerceString(value);
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_EXECUTION_ERROR_MESSAGE
    ? `${trimmed.slice(0, MAX_EXECUTION_ERROR_MESSAGE)}...`
    : trimmed;
};

const extractExecutionErrorInfo = (error: unknown): ExecutionErrorInfo => {
  if (!error) return {};
  if (typeof error === "string") {
    return { message: normalizeErrorMessage(error) };
  }
  if (typeof error !== "object") return {};
  const err = error as {
    message?: unknown;
    type?: unknown;
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    name?: unknown;
    stack?: unknown;
    policy?: { reason?: unknown };
  };
  const codeCandidate =
    coerceString(err.code) ??
    (typeof err.status === "number" ? String(err.status) : undefined) ??
    (typeof err.statusCode === "number" ? String(err.statusCode) : undefined);
  return {
    message: normalizeErrorMessage(err.message),
    type: coerceString(err.type),
    code: codeCandidate,
    name: coerceString(err.name),
    stack: coerceString(err.stack),
    policyReason: coerceString(err.policy?.reason),
  };
};

const classifyExecutionErrorClass = (info: ExecutionErrorInfo): string | undefined => {
  const parts = [info.type, info.message, info.code, info.name, info.policyReason]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!parts) return undefined;
  if (/timeout|timed out|etimedout|esockettimedout/.test(parts)) {
    return "execution_timeout";
  }
  if (/rate limit|rate_limited|429/.test(parts)) {
    return "execution_rate_limited";
  }
  if (/unauthorized|forbidden|auth|401|403/.test(parts)) {
    return "execution_auth";
  }
  if (/policy|blocked/.test(parts)) {
    return "execution_policy";
  }
  if (/network|econnrefused|enotfound|ehostunreach|eai_again|socket/.test(parts)) {
    return "execution_network";
  }
  if (/invalid|schema|mismatch|bad request|400/.test(parts)) {
    return "execution_invalid_args";
  }
  if (/contract/.test(parts)) {
    return "execution_tool_contract_mismatch";
  }
  if (/playwright/.test(parts)) {
    return "execution_playwright_crash";
  }
  if (/out of memory|oom|heap/.test(parts)) {
    return "execution_resource_exhaustion";
  }
  if (/5\\d\\d|server error|internal error/.test(parts)) {
    return "execution_tool_5xx";
  }
  return "execution_tool_error";
};

const buildStackFingerprint = (stack?: string): string | undefined => {
  if (!stack) return undefined;
  const normalized = stack.split("\n").slice(0, 8).join("\n");
  return normalized ? hashStableJson({ stack: normalized }) : undefined;
};

const buildExecutionFingerprint = (input: {
  toolName?: string;
  errorClass?: string;
  errorCode?: string;
  stackFingerprint?: string;
}): string | undefined => {
  if (!input.errorClass && !input.stackFingerprint) return undefined;
  return hashStableJson({
    tool: input.toolName,
    class: input.errorClass,
    code: input.errorCode,
    stack: input.stackFingerprint,
  });
};

const resolveToolName = (
  step: ExecutionResult,
  executorStep?: ExecutorStep,
): string | undefined => {
  if (executorStep?.kind === "tool.call") return executorStep.tool;
  if (executorStep?.kind === "debate.run") return executorStep.tool;
  if (executorStep?.kind === "specialist.run") return executorStep.solver;
  if (executorStep?.kind === "specialist.verify") return executorStep.verifier;
  if (executorStep?.kind) return executorStep.kind;
  return step.kind;
};

const resolveToolKind = (
  step: ExecutionResult,
  executorStep?: ExecutorStep,
): string | undefined => executorStep?.kind ?? step.kind;

const extractRequestId = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as { requestId?: unknown; request_id?: unknown };
  return coerceString(record.requestId) ?? coerceString(record.request_id);
};

const resolveHostContext = (): string =>
  process.env.CI ? "ci" : process.env.NODE_ENV ?? "local";

const collectExecutionEnvelopes = (
  steps: ExecutionResult[],
  executorStepById: Map<string, ExecutorStep>,
  startedAtMs: number,
): AgiExecutionEnvelope[] => {
  const envelopes: AgiExecutionEnvelope[] = [];
  let cursorMs = startedAtMs;
  for (const step of steps) {
    const executorStep = executorStepById.get(step.id);
    const latency = Number.isFinite(step.latency_ms)
      ? Math.max(0, Math.floor(step.latency_ms ?? 0))
      : 0;
    const startTs = new Date(cursorMs).toISOString();
    const endTs = new Date(cursorMs + latency).toISOString();
    if (latency > 0) {
      cursorMs += latency;
    }
    const toolName = resolveToolName(step, executorStep);
    const toolKind = resolveToolKind(step, executorStep);
    const errorInfo = extractExecutionErrorInfo(
      (step as { error?: unknown }).error,
    );
    const errorClass = classifyExecutionErrorClass(errorInfo);
    const stackFingerprint = buildStackFingerprint(errorInfo.stack);
    const fingerprint = buildExecutionFingerprint({
      toolName,
      errorClass,
      errorCode: errorInfo.code,
      stackFingerprint,
    });
    const requestId =
      extractRequestId(step.output) ??
      extractRequestId((step as { error?: unknown }).error);
    envelopes.push({
      stepId: step.id,
      stepKind: step.kind,
      toolName,
      toolKind,
      requestId,
      startTs,
      endTs,
      durationMs: latency,
      ok: step.ok,
      errorClass,
      errorCode: errorInfo.code,
      errorMessage: errorInfo.message,
      stackFingerprint,
      fingerprint,
      hostContext: resolveHostContext(),
    });
  }
  return envelopes;
};

const collectExecutionErrorTypes = (steps: unknown[]): string[] => {
  const types = new Set<string>();
  for (const step of steps) {
    const error = step && typeof step === "object"
      ? (step as { error?: unknown }).error
      : undefined;
    if (!error) continue;
    const info = extractExecutionErrorInfo(error);
    const errorClass = classifyExecutionErrorClass(info);
    types.add(errorClass ?? "execution_tool_error");
  }
  return Array.from(types);
};

const detectSafetyFailure = (step: unknown): boolean => {
  const type = detectStepErrorType(step);
  if (type && ["forbidden", "policy", "blocked"].includes(type)) {
    return true;
  }
  const error = step && typeof step === "object" ? (step as { error?: any }).error : null;
  const message = typeof error?.message === "string" ? error.message : "";
  return /forbidden|policy|blocked/i.test(message);
};

const detectTestsRun = (step: unknown): boolean => {
  if (!step || typeof step !== "object") return false;
  const kind =
    (step as { kind?: unknown }).kind ??
    (step as { tool?: unknown }).tool ??
    (step as { id?: unknown }).id;
  const label = typeof kind === "string" ? kind.toLowerCase() : "";
  return label.includes("test");
};

const CODE_TOUCH_TOOL_HINTS = [
  "repo.patch",
  "repo.diff",
  "apply_patch",
  "write_file",
  "file.write",
];
const DIFF_FILE_PATTERN = /^diff --git a\/(.+?) b\/(.+)$/;
const DIFF_ADD_PATTERN = /^\+\+\+ b\/(.+)$/;
const DIFF_REMOVE_PATTERN = /^--- a\/(.+)$/;
const PATCH_FILE_PATTERN = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/;
const DIFF_SIGNAL_PATTERN = /(diff --git|\+\+\+ b\/|--- a\/|\*\*\* Begin Patch)/;

const extractDiffPaths = (diff: string): string[] => {
  const output = new Set<string>();
  const lines = diff.split(/\r?\n/);
  for (const line of lines) {
    let match = line.match(DIFF_FILE_PATTERN);
    if (match) {
      const normalized = normalizeEvidencePath(match[2], {
        lowercase: true,
        normalizeExtensions: true,
      });
      if (normalized) output.add(normalized);
      continue;
    }
    match = line.match(DIFF_ADD_PATTERN);
    if (match && match[1] !== "/dev/null") {
      const normalized = normalizeEvidencePath(match[1], {
        lowercase: true,
        normalizeExtensions: true,
      });
      if (normalized) output.add(normalized);
      continue;
    }
    match = line.match(DIFF_REMOVE_PATTERN);
    if (match && match[1] !== "/dev/null") {
      const normalized = normalizeEvidencePath(match[1], {
        lowercase: true,
        normalizeExtensions: true,
      });
      if (normalized) output.add(normalized);
      continue;
    }
    match = line.match(PATCH_FILE_PATTERN);
    if (match) {
      const normalized = normalizeEvidencePath(match[1], {
        lowercase: true,
        normalizeExtensions: true,
      });
      if (normalized) output.add(normalized);
    }
  }
  return Array.from(output);
};

const extractDiffPayload = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as { diff?: unknown; patch?: unknown; stdout?: unknown };
  const candidates = [record.diff, record.patch, record.stdout];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (DIFF_SIGNAL_PATTERN.test(trimmed)) return trimmed;
  }
  return undefined;
};

const collectCodeTouchedPaths = (
  steps: ExecutionResult[],
  executorStepById: Map<string, ExecutorStep>,
): { paths: string[]; toolTouched: boolean } => {
  const paths = new Set<string>();
  let toolTouched = false;
  for (const step of steps) {
    const executorStep = executorStepById.get(step.id);
    const toolName = resolveToolName(step, executorStep);
    const toolLabel = toolName?.toLowerCase() ?? "";
    if (CODE_TOUCH_TOOL_HINTS.some((hint) => toolLabel.includes(hint))) {
      toolTouched = true;
    }
    const diffPayload = extractDiffPayload(step.output);
    if (diffPayload) {
      extractDiffPaths(diffPayload).forEach((entry) => paths.add(entry));
    }
  }
  return { paths: Array.from(paths), toolTouched };
};

const CONTRACT_PATH_PREFIXES = [
  "server/routes/",
  "server/skills/",
  "shared/",
  "client/src/",
  "sdk/",
  "packages/",
  "types/",
];

type ContractSurface = "server" | "client" | "shared" | "other";

const classifyContractSurface = (value: string): ContractSurface => {
  if (value.startsWith("server/")) return "server";
  if (value.startsWith("client/")) return "client";
  if (
    value.startsWith("shared/") ||
    value.startsWith("sdk/") ||
    value.startsWith("packages/") ||
    value.startsWith("types/")
  ) {
    return "shared";
  }
  return "other";
};

const isContractPath = (value: string): boolean =>
  CONTRACT_PATH_PREFIXES.some((prefix) => value.startsWith(prefix));

const resolveContractSignals = (
  paths: string[],
  testsRun: boolean,
  testsOk: boolean,
): {
  contractRequired: boolean;
  contractOk: boolean;
  contractIssues: string[];
} => {
  const contractPaths = paths.filter(isContractPath);
  const contractRequired = contractPaths.length > 0;
  if (!contractRequired) {
    return { contractRequired, contractOk: true, contractIssues: [] };
  }
  const surfaces = new Set<ContractSurface>(
    contractPaths.map(classifyContractSurface).filter((surface) => surface !== "other"),
  );
  const crossSurface =
    surfaces.size >= 2 ||
    (surfaces.has("shared") && (surfaces.has("server") || surfaces.has("client")));
  if (testsRun && testsOk) {
    return { contractRequired, contractOk: true, contractIssues: [] };
  }
  if (crossSurface) {
    return { contractRequired, contractOk: true, contractIssues: [] };
  }
  return {
    contractRequired,
    contractOk: false,
    contractIssues: ["contract_surface_missing"],
  };
};

type ConstraintSignal = {
  ok: boolean;
  source: string;
  issues: string[];
};

const CONSTRAINT_STATUSES = new Set([
  "admissible",
  "marginal",
  "inadmissible",
  "not_certified",
]);

const evaluateConstraintArray = (
  constraints: Array<Record<string, unknown>>,
): { ok: boolean; issues: string[] } => {
  const issues: string[] = [];
  for (const constraint of constraints) {
    const passed =
      typeof constraint.passed === "boolean" ? constraint.passed : undefined;
    const status =
      typeof constraint.status === "string"
        ? constraint.status.toLowerCase()
        : undefined;
    const severity =
      typeof constraint.severity === "string"
        ? constraint.severity.toUpperCase()
        : undefined;
    const isHard = severity === "HARD" || !severity;
    let ok = true;
    if (passed === false) ok = false;
    if (status && ["fail", "failed", "error", "unknown"].includes(status)) {
      ok = false;
    }
    if (!ok && isHard) {
      const id =
        typeof constraint.id === "string" ? constraint.id : "constraint_failed";
      issues.push(id);
    }
  }
  return { ok: issues.length === 0, issues };
};

const extractConstraintResult = (
  output: unknown,
  toolName?: string,
): ConstraintSignal | null => {
  if (!output || typeof output !== "object") return null;
  const record = output as Record<string, unknown>;
  const issues: string[] = [];
  let ok: boolean | undefined;
  if (record.gate && typeof record.gate === "object") {
    const gate = record.gate as Record<string, unknown>;
    if (typeof gate.pass === "boolean") {
      ok = gate.pass;
    }
    if (Array.isArray(gate.constraints)) {
      const evaluated = evaluateConstraintArray(
        gate.constraints as Array<Record<string, unknown>>,
      );
      ok = ok ?? evaluated.ok;
      issues.push(...evaluated.issues);
    }
  }
  if (record.report && typeof record.report === "object") {
    const report = record.report as Record<string, unknown>;
    if (typeof report.passed === "boolean") {
      ok = report.passed;
    }
    if (Array.isArray(report.failed_checks) && report.failed_checks.length > 0) {
      ok = false;
      issues.push("report_failed_checks");
    }
  }
  if (Array.isArray(record.constraints)) {
    const evaluated = evaluateConstraintArray(
      record.constraints as Array<Record<string, unknown>>,
    );
    ok = ok ?? evaluated.ok;
    issues.push(...evaluated.issues);
  }
  if (typeof record.pass === "boolean") {
    ok = record.pass;
  }
  if (typeof record.status === "string") {
    const status = record.status.toLowerCase();
    if (CONSTRAINT_STATUSES.has(status) && status !== "admissible") {
      ok = false;
      issues.push(`status_${status}`);
    }
    if (CONSTRAINT_STATUSES.has(status) && status === "admissible") {
      ok = ok ?? true;
    }
  }
  if (record.integrityOk === false) {
    ok = false;
    issues.push("certificate_integrity");
  }
  const hasMarkers =
    issues.length > 0 ||
    typeof ok === "boolean" ||
    Array.isArray(record.constraints) ||
    typeof record.pass === "boolean" ||
    record.gate !== undefined ||
    record.report !== undefined;
  if (!hasMarkers || typeof ok !== "boolean") return null;
  return {
    ok,
    source: toolName ?? (typeof record.kind === "string" ? record.kind : "constraint"),
    issues: issues.length > 0 ? issues : [],
  };
};

const isConstraintIntentGoal = (goal: string): boolean =>
  /\b(constraint|residual|bianchi|vacuum|admissible|viability|guardrail|invariant)\b/i.test(
    goal,
  );

const collectConstraintSignals = (
  steps: ExecutionResult[],
  executorStepById: Map<string, ExecutorStep>,
  goal: string,
  intent?: IntentFlags,
): {
  constraintRequired: boolean;
  constraintOk: boolean;
  constraintIssues: string[];
  constraintSources: string[];
} => {
  const signals: ConstraintSignal[] = [];
  for (const step of steps) {
    const executorStep = executorStepById.get(step.id);
    const toolName = resolveToolName(step, executorStep);
    const signal = extractConstraintResult(step.output, toolName);
    if (signal) {
      signals.push(signal);
    }
  }
  const constraintRequired =
    signals.length > 0 ||
    Boolean(intent?.wantsPhysics || intent?.wantsWarp) ||
    isWarpOrPhysicsIntentGoal(goal) ||
    isConstraintIntentGoal(goal);
  const constraintOk =
    signals.length > 0 ? signals.every((signal) => signal.ok) : !constraintRequired;
  const constraintIssues = signals.flatMap((signal) =>
    signal.ok ? [] : signal.issues.length > 0 ? signal.issues : ["constraint_failed"],
  );
  const constraintSources = signals.map((signal) => signal.source);
  return {
    constraintRequired,
    constraintOk,
    constraintIssues,
    constraintSources,
  };
};

const estimateTokens = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

const summarizeExecutionSignals = (
  steps: ExecutionResult[],
  goal: string,
  executorStepById: Map<string, ExecutorStep>,
  intent: IntentFlags | undefined,
  executionErrorTypesOverride?: string[],
): {
  formatOk: boolean;
  testsRun: boolean;
  testsOk: boolean;
  testsRequired: boolean;
  safetyOk: boolean;
  executionErrorTypes: string[];
  codeTouched: boolean;
  codeTouchedPaths: string[];
  contractRequired: boolean;
  contractOk: boolean;
  contractIssues: string[];
  constraintRequired: boolean;
  constraintOk: boolean;
  constraintIssues: string[];
  constraintSources: string[];
} => {
  let formatOk = true;
  let testsRun = false;
  let testsOk = true;
  let safetyOk = !hasRestrictedInput(goal);
  for (const step of steps) {
    if (detectStepErrorType(step) === "final_output_schema_mismatch") {
      formatOk = false;
    }
    if (detectSafetyFailure(step)) {
      safetyOk = false;
    }
    if (detectTestsRun(step)) {
      testsRun = true;
      const ok = (step as { ok?: unknown }).ok;
      if (ok !== true) {
        testsOk = false;
      }
    }
  }
  const executionErrorTypes =
    executionErrorTypesOverride ?? collectExecutionErrorTypes(steps);
  const codeTouch = collectCodeTouchedPaths(steps, executorStepById);
  const contractSignals = resolveContractSignals(
    codeTouch.paths,
    testsRun,
    testsOk,
  );
  const constraintSignals = collectConstraintSignals(
    steps,
    executorStepById,
    goal,
    intent,
  );
  const codeTouched = codeTouch.toolTouched || codeTouch.paths.length > 0;
  const testsRequired = codeTouched || contractSignals.contractRequired;
  return {
    formatOk,
    testsRun,
    testsOk,
    testsRequired,
    safetyOk,
    executionErrorTypes,
    codeTouched,
    codeTouchedPaths: codeTouch.paths,
    contractRequired: contractSignals.contractRequired,
    contractOk: contractSignals.contractOk,
    contractIssues: contractSignals.contractIssues,
    constraintRequired: constraintSignals.constraintRequired,
    constraintOk: constraintSignals.constraintOk,
    constraintIssues: constraintSignals.constraintIssues,
    constraintSources: constraintSignals.constraintSources,
  };
};

const SAFETY_REFUSAL_SUMMARY =
  "Sorry, I cannot comply with that request. I can help if you share a non-sensitive excerpt or ask a high-level question.";
const EXECUTION_FALLBACK_SUMMARY =
  "Sorry, I am unable to complete that request because a tool step failed. You can retry or provide more details.";

const resolveSafetyHandledSummary = (
  summary: string,
  safetyOk: boolean,
): { summary: string; handled: boolean } => {
  if (safetyOk) {
    return { summary, handled: false };
  }
  const handling = detectSafetyHandling(summary);
  if (handling.handled) {
    return { summary, handled: true };
  }
  return { summary: SAFETY_REFUSAL_SUMMARY, handled: true };
};

const resolveExecutionHandledSummary = (
  summary: string,
  executionOk: boolean,
): { summary: string; handled: boolean } => {
  if (executionOk) {
    return { summary, handled: false };
  }
  const handling = detectSafetyHandling(summary);
  if (handling.handled) {
    return { summary, handled: true };
  }
  return { summary: EXECUTION_FALLBACK_SUMMARY, handled: true };
};

type RepoGraphHitLike = {
  id?: string;
  kind?: string;
  path?: string;
  file_path?: string;
  snippet?: string;
  snippet_id?: string;
  score?: number;
  symbol_name?: string;
};

const collectStepCitations = (steps: ExecutionResult[]): string[] => {
  const citations = new Set<string>();
  for (const step of steps) {
    if (Array.isArray(step.citations)) {
      step.citations.forEach((citation) => {
        if (typeof citation === "string" && citation.trim().length > 0) {
          citations.add(citation.trim());
        }
      });
    }
    const output = step.output as { citations?: unknown } | undefined;
    if (Array.isArray(output?.citations)) {
      output.citations.forEach((citation) => {
        if (typeof citation === "string" && citation.trim().length > 0) {
          citations.add(citation.trim());
        }
      });
    }
  }
  return Array.from(citations);
};

const coerceRepoGraphHits = (value: unknown): RepoGraphHitLike[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RepoGraphHitLike => Boolean(item && typeof item === "object"),
  );
};

const collectRepoGraphEvidence = (
  steps: ExecutionResult[],
  executorStepById: Map<string, ExecutorStep>,
): { candidates: AgiEvidence[]; selected: AgiEvidence[] } => {
  const candidates: AgiEvidence[] = [];
  const selected: AgiEvidence[] = [];
  for (const step of steps) {
    const exec = executorStepById.get(step.id);
    const tool = exec?.kind === "tool.call" ? exec.tool : undefined;
    const isRepoGraph = tool === "repo.graph.search";
    if (!isRepoGraph || step.ok !== true) continue;
    if (!step.output || typeof step.output !== "object") continue;
    const output = step.output as { hits?: unknown; packets?: unknown };
    const hits = coerceRepoGraphHits(output.hits);
    const packets = coerceRepoGraphHits(output.packets);
    if (hits.length > 0) {
      candidates.push(...buildEvidenceFromRepoGraphHits(hits, "repo_graph_hit"));
    }
    if (packets.length > 0) {
      selected.push(
        ...buildEvidenceFromRepoGraphHits(packets, "repo_graph_packet"),
      );
    }
  }
  return { candidates, selected };
};

const filterRepoGraphHits = (hits: RepoGraphHitLike[]): RepoGraphHitLike[] =>
  hits.filter(
    (hit) => !isRestrictedEvidencePath(hit.file_path ?? hit.path ?? undefined),
  );

const buildSafeRetrievalFallback = async (
  query: string | undefined,
): Promise<{ candidates: AgiEvidence[]; selected: AgiEvidence[] }> => {
  if (!query) return { candidates: [], selected: [] };
  try {
    const result = await searchRepoGraph({ query, limit: 12 });
    const safeHits = filterRepoGraphHits(result.hits ?? []);
    const evidence = buildEvidenceFromRepoGraphHits(
      safeHits as RepoGraphHitLike[],
      "repo_graph_fallback",
    );
    return { candidates: evidence, selected: evidence };
  } catch {
    return { candidates: [], selected: [] };
  }
};

const HINT_PATH_PATTERN =
  /\b[a-z0-9_./-]+\.(ts|tsx|js|jsx|json|md|mdx|yml|yaml|py|go|rs|java|cpp|c|h)\b/gi;
const HINT_PATH_TEST =
  /\b[a-z0-9_./-]+\.(ts|tsx|js|jsx|json|md|mdx|yml|yaml|py|go|rs|java|cpp|c|h)\b/i;
const HINT_PASS_MAX = (() => {
  const parsed = Number(process.env.AGI_REFINERY_HINT_PASS_MAX);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(Math.max(1, Math.floor(parsed)), 10);
})();
const HINT_QUERY_LIMIT = (() => {
  const parsed = Number(process.env.AGI_REFINERY_HINT_QUERY_LIMIT);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(Math.max(1, Math.floor(parsed)), 25);
})();
const HINT_QUERY_MAX = (() => {
  const parsed = Number(process.env.AGI_REFINERY_HINT_QUERY_MAX);
  if (!Number.isFinite(parsed)) return 4;
  return Math.min(Math.max(1, Math.floor(parsed)), 12);
})();

const normalizeHintPath = (value: string): string | undefined => {
  const normalized = normalizeEvidenceRef(value, {
    normalizeExtensions: false,
  });
  if (!normalized) return undefined;
  if (!HINT_PATH_TEST.test(normalized)) return undefined;
  return normalized;
};

const extractHintPathsFromText = (value?: string): string[] => {
  if (!value) return [];
  const matches = value.match(HINT_PATH_PATTERN);
  if (!matches) return [];
  const output: string[] = [];
  for (const match of matches) {
    const normalized = normalizeHintPath(match);
    if (normalized) output.push(normalized);
  }
  return output;
};

const collectHintInputs = (
  inputs: string[],
  extraText?: string,
): string[] => {
  const output: string[] = [];
  const seen = new Set<string>();
  const combined = [...inputs, ...extractHintPathsFromText(extraText)];
  for (const hint of combined) {
    const normalized = normalizeHintPath(hint);
    if (!normalized) continue;
    if (isRestrictedEvidencePath(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
};

const buildHintQueries = (hints: string[]): string[] => {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const hint of hints) {
    const normalized = normalizeHintPath(hint);
    if (!normalized) continue;
    const base = normalized.split("/").pop() ?? normalized;
    const stem = base.replace(/\.[^.]+$/, "");
    for (const candidate of [normalized, base, stem]) {
      const cleaned = candidate.trim();
      if (!cleaned || seen.has(cleaned)) continue;
      seen.add(cleaned);
      output.push(cleaned);
      if (output.length >= HINT_QUERY_MAX) return output;
    }
  }
  return output;
};

const buildIntentTags = (intent?: AgiIntent): string[] => {
  if (!intent) return [];
  if (intent.wantsWarp || intent.wantsPhysics) return ["warp-physics"];
  return [];
};

const buildHintQueryEvidence = async (
  hints: string[],
  intentTags?: string[],
): Promise<{
  candidates: AgiEvidence[];
  selected: AgiEvidence[];
  queries: string[];
}> => {
  if (process.env.AGI_REFINERY_HINT_QUERY === "0") {
    return { candidates: [], selected: [], queries: [] };
  }
  const queries = buildHintQueries(hints);
  if (queries.length === 0) {
    return { candidates: [], selected: [], queries: [] };
  }
  const candidates: AgiEvidence[] = [];
  const selected: AgiEvidence[] = [];
  for (const query of queries) {
    try {
      const result = await searchRepoGraph({
        query,
        limit: HINT_QUERY_LIMIT,
        intentTags,
      });
      const safeHits = filterRepoGraphHits(result.hits ?? []);
      candidates.push(
        ...buildEvidenceFromRepoGraphHits(safeHits as RepoGraphHitLike[], "repo_hint_query"),
      );
      const packets = filterRepoGraphHits((result.packets ?? []) as RepoGraphHitLike[]);
      selected.push(
        ...buildEvidenceFromRepoGraphHits(packets as RepoGraphHitLike[], "repo_hint_query"),
      );
    } catch {
      continue;
    }
  }
  return { candidates, selected, queries };
};

const CITATION_COMPLETION_CLAIM_PATTERN =
  /\b(is|are|does|returns|means|implements|uses|adds|removes|updates|exposes|requires|includes|defined|located|calls|builds|runs|function|class|module|endpoint|route|api|handler|schema|component|service|config)\b/i;
const CITATION_COMPLETION_FILE_PATTERN =
  /\b[a-z0-9_.-]+\.(ts|tsx|js|jsx|json|md|yml|yaml|py|go|rs|java|cpp|c|h)\b/i;
const CITATION_COMPLETION_MAX = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_MAX);
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(Math.max(1, Math.floor(parsed)), 64);
})();
const CITATION_COMPLETION_MIN = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_MIN);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(Math.max(0, Math.floor(parsed)), CITATION_COMPLETION_MAX);
})();
const CITATION_COMPLETION_RATIO = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_RATIO);
  if (!Number.isFinite(parsed)) return 0.5;
  return Math.min(Math.max(0, parsed), 1);
})();

const hasCitationClaim = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return (
    CITATION_COMPLETION_CLAIM_PATTERN.test(normalized) ||
    CITATION_COMPLETION_FILE_PATTERN.test(normalized)
  );
};

const buildEvidenceKey = (item: AgiEvidence): string =>
  item.hash ?? `${item.kind ?? ""}:${item.id ?? ""}:${item.path ?? ""}`;

const mergeEvidence = (
  primary: AgiEvidence[],
  extra: AgiEvidence[],
): AgiEvidence[] => {
  const output: AgiEvidence[] = [];
  const seen = new Set<string>();
  for (const item of [...primary, ...extra]) {
    const key = buildEvidenceKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
};

const collectEvidenceTokens = (item: AgiEvidence): string[] => {
  const tokens = new Set<string>();
  const path = normalizeEvidenceRef(item.path);
  if (path) {
    tokens.add(path);
    const base = path.split("/").pop();
    if (base) tokens.add(base);
  }
  if (item.id) tokens.add(item.id.toLowerCase());
  if (Array.isArray(item.keys)) {
    item.keys.forEach((key) => tokens.add(String(key).toLowerCase()));
  }
  if (item.extra && typeof item.extra === "object") {
    const extra = item.extra as { snippetId?: unknown; symbolName?: unknown };
    if (typeof extra.snippetId === "string") {
      tokens.add(extra.snippetId.toLowerCase());
    }
    if (typeof extra.symbolName === "string") {
      tokens.add(extra.symbolName.toLowerCase());
    }
  }
  return Array.from(tokens).filter((token) => token.length >= 3);
};

const scoreEvidence = (textLower: string, item: AgiEvidence): number => {
  let score = 0;
  for (const token of collectEvidenceTokens(item)) {
    if (textLower.includes(token)) score += 1;
  }
  return score;
};

const normalizeCitationRef = (value: string): string =>
  normalizeEvidenceRef(value) ?? "";

const buildEvidenceTokenSet = (items: AgiEvidence[]): string[] => {
  const tokens = new Set<string>();
  for (const item of items) {
    collectEvidenceTokens(item).forEach((token) => tokens.add(token));
    if (item.path) {
      const normalized = normalizeCitationRef(item.path);
      if (normalized) tokens.add(normalized);
    }
  }
  return Array.from(tokens);
};

const citationMatchesEvidence = (
  citation: string,
  evidenceTokens: string[],
): boolean => {
  const normalized = normalizeCitationRef(citation);
  if (!normalized) return false;
  for (const token of evidenceTokens) {
    if (!token) continue;
    if (normalized === token) return true;
    if (normalized.endsWith(token)) return true;
    if (token.endsWith(normalized)) return true;
  }
  return false;
};

type CitationLinkStats = {
  hasClaim: boolean;
  citationCount: number;
  linkedCount: number;
  recall: number;
};

const normalizeCitations = (citations: string[]): string[] =>
  Array.from(
    new Set(
      citations
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  );

const computeCitationLinkStats = ({
  citations,
  evidence,
  hasClaim,
}: {
  citations: string[];
  evidence: AgiEvidence[];
  hasClaim: boolean;
}): CitationLinkStats => {
  const normalized = normalizeCitations(citations);
  const evidenceTokens = buildEvidenceTokenSet(evidence);
  let linkedCount = 0;
  for (const citation of normalized) {
    if (citationMatchesEvidence(citation, evidenceTokens)) linkedCount += 1;
  }
  if (!hasClaim) {
    return {
      hasClaim,
      citationCount: normalized.length,
      linkedCount,
      recall: 1,
    };
  }
  if (normalized.length === 0 || evidenceTokens.length === 0) {
    return {
      hasClaim,
      citationCount: normalized.length,
      linkedCount,
      recall: 0,
    };
  }
  return {
    hasClaim,
    citationCount: normalized.length,
    linkedCount,
    recall: linkedCount / normalized.length,
  };
};

const resolveCitationValue = (item: AgiEvidence): string | undefined => {
  if (item.path && !isRestrictedEvidencePath(item.path)) return item.path;
  if (item.id) return item.id;
  if (item.hash) return item.hash;
  return undefined;
};

type CitationCompletionMetrics = {
  candidateRecallPreCompletion: number;
  candidateRecallPostCompletion: number;
  selectedRecallPreCompletion: number;
  selectedRecallPostCompletion: number;
  citationsPreCompletion: number;
  citationsPostCompletion: number;
  completionQueriesCount: number;
  completionLatencyMs: number;
};

const completeCitations = async (args: {
  outputText: string;
  citations: string[];
  retrievalCandidates: AgiEvidence[];
  retrievalSelected: AgiEvidence[];
  searchQuery?: string;
}): Promise<{
  citations: string[];
  retrievalCandidates: AgiEvidence[];
  retrievalSelected: AgiEvidence[];
  added: boolean;
  metrics: CitationCompletionMetrics;
}> => {
  const completionStart = Date.now();
  let completionQueriesCount = 0;
  const baseCitations = normalizeCitations(args.citations);
  const outputText = args.outputText.trim();
  const forceCompletion =
    process.env.AGI_REFINERY_CITATION_COMPLETION_FORCE === "1";
  const hasClaim = forceCompletion
    ? outputText.length > 0 || baseCitations.length > 0
    : hasCitationClaim(outputText);
  const preCandidateStats = computeCitationLinkStats({
    citations: baseCitations,
    evidence: args.retrievalCandidates,
    hasClaim,
  });
  const preSelectedStats = computeCitationLinkStats({
    citations: baseCitations,
    evidence: args.retrievalSelected,
    hasClaim,
  });
  const finalize = (result: {
    citations: string[];
    retrievalCandidates: AgiEvidence[];
    retrievalSelected: AgiEvidence[];
    added: boolean;
  }): {
    citations: string[];
    retrievalCandidates: AgiEvidence[];
    retrievalSelected: AgiEvidence[];
    added: boolean;
    metrics: CitationCompletionMetrics;
  } => {
    const finalCitations = normalizeCitations(result.citations);
    const nextSelected =
      finalCitations.length > 0 && result.retrievalSelected.length === 0
        ? mergeEvidence(result.retrievalSelected, result.retrievalCandidates)
        : result.retrievalSelected;
    const postCandidateStats = computeCitationLinkStats({
      citations: finalCitations,
      evidence: result.retrievalCandidates,
      hasClaim,
    });
    const postSelectedStats = computeCitationLinkStats({
      citations: finalCitations,
      evidence: nextSelected,
      hasClaim,
    });
    return {
      citations: finalCitations,
      retrievalCandidates: result.retrievalCandidates,
      retrievalSelected: nextSelected,
      added: result.added,
      metrics: {
        candidateRecallPreCompletion: preCandidateStats.recall,
        candidateRecallPostCompletion: postCandidateStats.recall,
        selectedRecallPreCompletion: preSelectedStats.recall,
        selectedRecallPostCompletion: postSelectedStats.recall,
        citationsPreCompletion: baseCitations.length,
        citationsPostCompletion: finalCitations.length,
        completionQueriesCount,
        completionLatencyMs: Math.max(0, Date.now() - completionStart),
      },
    };
  };
  if (!hasClaim && baseCitations.length === 0) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates: args.retrievalCandidates,
      retrievalSelected: args.retrievalSelected,
      added: false,
    });
  }
  let retrievalCandidates = args.retrievalCandidates;
  let retrievalSelected = args.retrievalSelected;
  if (retrievalCandidates.length === 0 && retrievalSelected.length === 0) {     
    if (args.searchQuery) completionQueriesCount += 1;
    const fallback = await buildSafeRetrievalFallback(args.searchQuery);        
    if (fallback.candidates.length > 0) {
      retrievalCandidates = mergeEvidence(
        retrievalCandidates,
        fallback.candidates,
      );
    }
    if (fallback.selected.length > 0) {
      retrievalSelected = mergeEvidence(retrievalSelected, fallback.selected);
    }
  }
  if (baseCitations.length > 0 && retrievalSelected.length === 0) {
    retrievalSelected = mergeEvidence(retrievalSelected, retrievalCandidates);  
  }
  const targetEvidence = mergeEvidence(retrievalSelected, retrievalCandidates);
  const targetCount = Math.min(
    CITATION_COMPLETION_MAX,
    Math.max(
      CITATION_COMPLETION_MIN,
      Math.ceil(
        (targetEvidence.length > 0 ? targetEvidence : retrievalSelected.length > 0
          ? retrievalSelected
          : retrievalCandidates
        ).length * CITATION_COMPLETION_RATIO,
      ),
    ),
  );
  const allowedEvidence =
    retrievalSelected.length > 0 ? retrievalSelected : retrievalCandidates;
  const allowedTokens = buildEvidenceTokenSet(allowedEvidence);
  const linkedCitations = baseCitations.filter((citation) =>
    citationMatchesEvidence(citation, allowedTokens),
  );
  const hasLinkedCitation = linkedCitations.length > 0;
  const removedUnlinked = linkedCitations.length !== baseCitations.length;
  if (
    baseCitations.length > 0 &&
    hasLinkedCitation &&
    !removedUnlinked &&
    baseCitations.length >= targetCount
  ) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates,
      retrievalSelected,
      added: false,
    });
  }
  if (baseCitations.length > 0 && hasLinkedCitation && removedUnlinked) {
    return finalize({
      citations: linkedCitations,
      retrievalCandidates,
      retrievalSelected,
      added: true,
    });
  }
  if (retrievalCandidates.length === 0 && retrievalSelected.length === 0) {
    const nextCitations = baseCitations.length > 0 ? [] : baseCitations;
    return finalize({
      citations: nextCitations,
      retrievalCandidates,
      retrievalSelected,
      added: nextCitations.length !== baseCitations.length,
    });
  }
  const pool: Array<{ item: AgiEvidence; index: number }> = [];
  const seen = new Set<string>();
  let index = 0;
  const addToPool = (item: AgiEvidence): void => {
    const key = buildEvidenceKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ item, index });
    index += 1;
  };
  retrievalSelected.forEach(addToPool);
  retrievalCandidates.forEach(addToPool);

  const textLower = outputText.toLowerCase();
  const scored = pool.map(({ item, index }) => ({
    item,
    index,
    score: scoreEvidence(textLower, item),
  }));
  const ordered = scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });
  const nextCitations: string[] = [...linkedCitations];
  const usedEvidence: AgiEvidence[] = [];
  for (const entry of ordered) {
    if (nextCitations.length >= CITATION_COMPLETION_MAX) break;
    if (nextCitations.length >= targetCount) break;
    const citation = resolveCitationValue(entry.item);
    if (!citation) continue;
    if (nextCitations.includes(citation)) continue;
    nextCitations.push(citation);
    usedEvidence.push(entry.item);
  }
  if (nextCitations.length === 0) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates,
      retrievalSelected,
      added: false,
    });
  }
  const finalCitations = Array.from(new Set(nextCitations)).slice(
    0,
    CITATION_COMPLETION_MAX,
  );
  const nextCandidates = mergeEvidence(retrievalCandidates, usedEvidence);
  const nextSelected = mergeEvidence(retrievalSelected, usedEvidence);
  return finalize({
    citations: finalCitations,
    retrievalCandidates: nextCandidates,
    retrievalSelected: nextSelected,
    added: finalCitations.length !== baseCitations.length,
  });
};

const buildGateMetrics = (
  gates: { name: string; pass: boolean }[],
  evidenceCount: number,
  accepted: boolean,
): Record<string, number> => {
  const metrics: Record<string, number> = {
    gate_accept: accepted ? 1 : 0,
    evidence_count: evidenceCount,
  };
  for (const gate of gates) {
    metrics[`gate_${gate.name}`] = gate.pass ? 1 : 0;
  }
  return metrics;
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
      refinery: (taskTrace as { refinery?: AgiRefineryRequest }).refinery,
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

const localRuntimeCaps = resolveLocalRuntimeCaps();
const applyKnowledgeCaps = (config: ReturnType<typeof readKnowledgeConfig>) => {
  if (!localRuntimeCaps) {
    return config;
  }
  return {
    ...config,
    contextBytes: Math.min(config.contextBytes, localRuntimeCaps.maxKnowledgeBytes),
    maxFilesPerProject: Math.min(config.maxFilesPerProject, localRuntimeCaps.maxKnowledgeFiles),
  };
};
const knowledgeConfig = applyKnowledgeCaps(readKnowledgeConfig());
const clampTopK = (value: number): number => {
  if (!localRuntimeCaps) {
    return value;
  }
  return Math.max(1, Math.min(value, localRuntimeCaps.maxTopK));
};
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
  sessionId: z.string().min(1).max(128).optional(),
  refinery: agiRefineryRequestSchema.optional(),
});

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const clipAskText = (value: string | undefined, limit: number): string => {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

const HELIX_ASK_CONTEXT_FILES = clampNumber(
  readNumber(process.env.HELIX_ASK_CONTEXT_FILES ?? process.env.VITE_HELIX_ASK_CONTEXT_FILES, 18),
  4,
  48,
);
const HELIX_ASK_CONTEXT_CHARS = clampNumber(
  readNumber(process.env.HELIX_ASK_CONTEXT_CHARS ?? process.env.VITE_HELIX_ASK_CONTEXT_CHARS, 2200),
  120,
  2400,
);
const HELIX_ASK_HTTP_KEEPALIVE =
  String(process.env.HELIX_ASK_HTTP_KEEPALIVE ?? "1").trim() !== "0";
const HELIX_ASK_HTTP_KEEPALIVE_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_HTTP_KEEPALIVE_MS, 15000),
  2000,
  60000,
);
const HELIX_ASK_LOCAL_CONTEXT_TOKENS = resolveLocalContextTokens();
const HELIX_ASK_SCAFFOLD_CONTEXT_CHARS = Math.max(
  800,
  Math.min(6000, HELIX_ASK_CONTEXT_CHARS * 2),
);
const HELIX_ASK_TWO_PASS =
  String(process.env.HELIX_ASK_TWO_PASS ?? process.env.VITE_HELIX_ASK_TWO_PASS ?? "")
    .trim() === "1";
const HELIX_ASK_SCAFFOLD_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_SCAFFOLD_TOKENS ?? process.env.VITE_HELIX_ASK_SCAFFOLD_TOKENS, 512),
  64,
  2048,
);
const HELIX_ASK_MICRO_PASS =
  String(process.env.HELIX_ASK_MICRO_PASS ?? process.env.VITE_HELIX_ASK_MICRO_PASS ?? "1")
    .trim() === "1";
const HELIX_ASK_MICRO_PASS_AUTO =
  String(process.env.HELIX_ASK_MICRO_PASS_AUTO ?? process.env.VITE_HELIX_ASK_MICRO_PASS_AUTO ?? "1")
    .trim() === "1";
const HELIX_ASK_MICRO_PASS_AUTO_MIN_WORDS = clampNumber(
  readNumber(process.env.HELIX_ASK_MICRO_PASS_AUTO_MIN_WORDS ?? process.env.VITE_HELIX_ASK_MICRO_PASS_AUTO_MIN_WORDS, 18),
  6,
  80,
);
const HELIX_ASK_MICRO_PASS_AUTO_MIN_CHARS = clampNumber(
  readNumber(process.env.HELIX_ASK_MICRO_PASS_AUTO_MIN_CHARS ?? process.env.VITE_HELIX_ASK_MICRO_PASS_AUTO_MIN_CHARS, 160),
  40,
  400,
);
const HELIX_ASK_MICRO_PASS_AUTO_MIN_CLAUSES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_MICRO_PASS_AUTO_MIN_CLAUSES ?? process.env.VITE_HELIX_ASK_MICRO_PASS_AUTO_MIN_CLAUSES,
    2,
  ),
  1,
  6,
);
const HELIX_ASK_QUERY_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_QUERY_TOKENS ?? process.env.VITE_HELIX_ASK_QUERY_TOKENS, 128),
  32,
  512,
);
const HELIX_ASK_EVIDENCE_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_TOKENS ?? process.env.VITE_HELIX_ASK_EVIDENCE_TOKENS, 256),
  64,
  768,
);
const HELIX_ASK_REPAIR_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_REPAIR_TOKENS ?? process.env.VITE_HELIX_ASK_REPAIR_TOKENS, 192),
  64,
  512,
);
const HELIX_ASK_QUERY_HINTS_MAX = clampNumber(
  readNumber(process.env.HELIX_ASK_QUERY_HINTS_MAX ?? process.env.VITE_HELIX_ASK_QUERY_HINTS_MAX, 6),
  3,
  12,
);
const HELIX_ASK_QUERY_MERGE_MAX = clampNumber(
  readNumber(process.env.HELIX_ASK_QUERY_MERGE_MAX ?? process.env.VITE_HELIX_ASK_QUERY_MERGE_MAX, 8),
  4,
  16,
);
const HELIX_ASK_RRF_K = clampNumber(
  readNumber(process.env.HELIX_ASK_RRF_K ?? process.env.VITE_HELIX_ASK_RRF_K, 60),
  10,
  200,
);
const HELIX_ASK_RRF_WEIGHT_LEXICAL = clampNumber(
  readNumber(
    process.env.HELIX_ASK_RRF_WEIGHT_LEXICAL ?? process.env.VITE_HELIX_ASK_RRF_WEIGHT_LEXICAL,
    1,
  ),
  0.1,
  3,
);
const HELIX_ASK_RRF_WEIGHT_SYMBOL = clampNumber(
  readNumber(
    process.env.HELIX_ASK_RRF_WEIGHT_SYMBOL ?? process.env.VITE_HELIX_ASK_RRF_WEIGHT_SYMBOL,
    0.8,
  ),
  0.1,
  3,
);
const HELIX_ASK_RRF_WEIGHT_FUZZY = clampNumber(
  readNumber(process.env.HELIX_ASK_RRF_WEIGHT_FUZZY ?? process.env.VITE_HELIX_ASK_RRF_WEIGHT_FUZZY, 0.6),
  0.1,
  3,
);
const HELIX_ASK_MMR_LAMBDA = clampNumber(
  readNumber(process.env.HELIX_ASK_MMR_LAMBDA ?? process.env.VITE_HELIX_ASK_MMR_LAMBDA, 0.72),
  0.2,
  0.95,
);
const HELIX_ASK_LONGPROMPT_CHUNK_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_CHUNK_TOKENS ?? process.env.VITE_HELIX_ASK_LONGPROMPT_CHUNK_TOKENS,
    420,
  ),
  120,
  1200,
);
const HELIX_ASK_LONGPROMPT_CHUNK_OVERLAP = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_CHUNK_OVERLAP ?? process.env.VITE_HELIX_ASK_LONGPROMPT_CHUNK_OVERLAP,
    80,
  ),
  0,
  400,
);
const HELIX_ASK_LONGPROMPT_TOPK_CANDIDATES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_TOPK_CANDIDATES ?? process.env.VITE_HELIX_ASK_LONGPROMPT_TOPK_CANDIDATES,
    18,
  ),
  4,
  50,
);
const HELIX_ASK_LONGPROMPT_TOPM_SELECTED = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_TOPM_SELECTED ?? process.env.VITE_HELIX_ASK_LONGPROMPT_TOPM_SELECTED,
    8,
  ),
  2,
  20,
);
const HELIX_ASK_LONGPROMPT_CARD_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_CARD_TOKENS ?? process.env.VITE_HELIX_ASK_LONGPROMPT_CARD_TOKENS,
    256,
  ),
  64,
  768,
);
const HELIX_ASK_LONGPROMPT_MAX_CARDS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_MAX_CARDS ?? process.env.VITE_HELIX_ASK_LONGPROMPT_MAX_CARDS,
    12,
  ),
  4,
  24,
);
const HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS ?? process.env.VITE_HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS,
    Math.max(640, Math.floor(HELIX_ASK_LOCAL_CONTEXT_TOKENS * 0.6)),
  ),
  256,
  HELIX_ASK_LOCAL_CONTEXT_TOKENS,
);
const HELIX_ASK_LONGPROMPT_OVERHEAD_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_OVERHEAD_TOKENS ?? process.env.VITE_HELIX_ASK_LONGPROMPT_OVERHEAD_TOKENS,
    360,
  ),
  120,
  1200,
);
const HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO = clampNumber(
  readNumber(
    process.env.HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO ?? process.env.VITE_HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
    0.25,
  ),
  0.05,
  0.9,
);
const HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS ?? process.env.VITE_HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
    2,
  ),
  1,
  8,
);
const HELIX_ASK_EVIDENCE_CLAIM_GATE =
  String(process.env.HELIX_ASK_EVIDENCE_CLAIM_GATE ?? "1").trim() !== "0";
const HELIX_ASK_EVIDENCE_CLAIM_MAX = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_CLAIM_MAX, 6),
  2,
  12,
);
const HELIX_ASK_EVIDENCE_CLAIM_MIN_RATIO = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_CLAIM_MIN_RATIO, 0.2),
  0.05,
  0.9,
);
const HELIX_ASK_EVIDENCE_CLAIM_MIN_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_CLAIM_MIN_TOKENS, 1),
  1,
  8,
);
const HELIX_ASK_EVIDENCE_CLAIM_SUPPORT_RATIO = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_CLAIM_SUPPORT_RATIO, 0.5),
  0.1,
  1,
);
const HELIX_ASK_EVIDENCE_CRITIC =
  String(process.env.HELIX_ASK_EVIDENCE_CRITIC ?? process.env.VITE_HELIX_ASK_EVIDENCE_CRITIC ?? "0")
    .trim() === "1";
const HELIX_ASK_TRAINING_TRACE =
  String(process.env.HELIX_ASK_TRAINING_TRACE ?? "1").trim() !== "0";
const HELIX_ASK_AMBIGUITY_GATE =
  String(process.env.HELIX_ASK_AMBIGUITY_GATE ?? "1").trim() !== "0";
const HELIX_ASK_AMBIGUITY_RESOLVER =
  String(process.env.HELIX_ASK_AMBIGUITY_RESOLVER ?? "1").trim() !== "0";
const HELIX_ASK_AMBIGUITY_SHORT_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_SHORT_TOKENS, 4),
  2,
  12,
);
const HELIX_ASK_AMBIGUITY_MIN_SCORE = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_MIN_SCORE, 8),
  1,
  40,
);
const HELIX_ASK_AMBIGUITY_MARGIN_MIN = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_MARGIN_MIN, 4),
  0,
  40,
);
const HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN, 5),
  3,
  12,
);
const HELIX_ASK_AMBIGUOUS_MAX_TERMS = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUOUS_MAX_TERMS, 2),
  1,
  6,
);
const HELIX_ASK_OVERFLOW_RETRY =
  String(process.env.HELIX_ASK_OVERFLOW_RETRY ?? "1").trim() !== "0";
const HELIX_ASK_OVERFLOW_RETRY_POLICY =
  process.env.HELIX_ASK_OVERFLOW_RETRY_POLICY?.trim() ||
  "drop_context_then_drop_output_then_retry";
const HELIX_ASK_RETRIEVAL_RETRY_ENABLED =
  clampNumber(
    readNumber(
      process.env.HELIX_ASK_RETRIEVAL_RETRY_ENABLED ??
        process.env.VITE_HELIX_ASK_RETRIEVAL_RETRY_ENABLED,
      1,
    ),
    0,
    1,
  ) > 0;
const HELIX_ASK_RETRIEVAL_RETRY_TOPK_BONUS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_RETRIEVAL_RETRY_TOPK_BONUS ??
      process.env.VITE_HELIX_ASK_RETRIEVAL_RETRY_TOPK_BONUS,
    4,
  ),
  0,
  20,
);
const HELIX_ASK_SWEEP_OVERRIDES =
  clampNumber(
    readNumber(
      process.env.HELIX_ASK_SWEEP_OVERRIDES ?? process.env.VITE_HELIX_ASK_SWEEP_OVERRIDES,
      0,
    ),
    0,
    1,
  ) > 0;
const HELIX_ASK_FORMAT_ENFORCEMENT_LEVEL = (() => {
  const raw = String(
    process.env.HELIX_ASK_FORMAT_ENFORCEMENT_LEVEL ??
      process.env.VITE_HELIX_ASK_FORMAT_ENFORCEMENT_LEVEL ??
      "strict",
  )
    .trim()
    .toLowerCase();
  return raw === "relaxed" ? "relaxed" : "strict";
})();
const HELIX_ASK_SOFT_EXPANSION_MAX_SENTENCES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_SOFT_EXPANSION_MAX_SENTENCES ??
      process.env.VITE_HELIX_ASK_SOFT_EXPANSION_MAX_SENTENCES,
    0,
  ),
  0,
  2,
);
const HELIX_ASK_ARBITER_REPO_RATIO = clampNumber(
  readNumber(
    process.env.HELIX_ASK_ARBITER_REPO_RATIO ?? process.env.VITE_HELIX_ASK_ARBITER_REPO_RATIO,
    0.45,
  ),
  0.05,
  0.95,
);
const HELIX_ASK_ARBITER_HYBRID_RATIO = clampNumber(
  readNumber(
    process.env.HELIX_ASK_ARBITER_HYBRID_RATIO ?? process.env.VITE_HELIX_ASK_ARBITER_HYBRID_RATIO,
    0.25,
  ),
  0.05,
  0.95,
);
const HELIX_ASK_TWO_PASS_TRIGGER =
  /(how does|how do|why|explain|system|pipeline|architecture|workflow|flow|method|scientific method|plan|execute|trace|ask|assistant|llm)/i;
const HELIX_ASK_WARP_FOCUS = /(warp|bubble|alcubierre|natario)/i;
const HELIX_ASK_WARP_PATH_BOOST =
  /(modules\/warp|client\/src\/lib\/warp-|warp-module|natario-warp|warp-theta|energy-pipeline|docs\/knowledge\/warp)/i;
const HELIX_ASK_CONCEPTUAL_FOCUS = /\b(what is|what's|define|definition|meaning|concept|theory)\b/i;
const HELIX_ASK_CONCEPT_FAST_PATH_INTENTS = new Set([
  "repo.warp_definition_docs_first",
  "repo.warp_conceptual_explain",
  "repo.ideology_reference",
]);
const HELIX_ASK_DOCS_PATH_BOOST = /^docs\//i;
const HELIX_ASK_TEST_PATH_NOISE = /(^|\/)(__tests__|tests?)(\/|$)/i;
const HELIX_ASK_CORE_FOCUS = /(helix ask|helix|ask system|ask pipeline|ask mode)/i;
const HELIX_ASK_CORE_PATH_BOOST =
  /(docs\/helix-ask-flow\.md|client\/src\/components\/helix\/HelixAskPill\.tsx|client\/src\/pages\/desktop\.tsx|server\/routes\/agi\.plan\.ts|server\/skills\/llm\.local|asklocal)/i;
const HELIX_ASK_CORE_NOISE =
  /(docs\/SMOKE\.md|docs\/V0\.1-SIGNOFF\.md|docs\/ESSENCE-CONSOLE|docs\/TRACE-API\.md|HullMetricsVisPanel|shared\/schema\.ts|server\/db\/)/i;
const HELIX_ASK_REPO_FORCE =
  /\b(cite files?|file paths?|codebase|repo|repository|where in the code|which file|which files|module|component|path\b|according to the codebase|according to the repo|according to the code)\b/i;
const HELIX_ASK_REPO_EXPECTS =
  /\b(in this system|in this repo|this repo|this system|helix ask|ask pipeline|ask system|codebase|repository|where in the code|which file|which files|file paths?|cite files?|according to the codebase|according to the repo|according to the code|per the codebase|per the repo|from the codebase|from the repo|from the code)\b/i;
const HELIX_ASK_REPO_HINT =
  /(helix|helix ask|ask system|ask pipeline|ask mode|this system|this repo|repository|repo\b|code|codebase|file|path|component|module|endpoint|api|server|client|ui|panel|pipeline|trace|essence|casimir|warp|alcubierre|resonance|code lattice|lattice|ideology|ethos|mission ethos|ideology tree|smoke test|smoke\.md|bug|error|crash|config|env|settings|docs\/)/i;
const HELIX_ASK_ENDPOINT_HINT_RE = /\/api\/[a-z0-9/_-]+/gi;
const HELIX_ASK_ENDPOINT_GUARD =
  String(process.env.HELIX_ASK_ENDPOINT_GUARD ?? "1").trim() !== "0";
const HELIX_ASK_VIABILITY_FOCUS =
  /\b(viability|certificate|constraint gate|constraint gates|admissible|warp viability)\b/i;
const HELIX_ASK_VIABILITY_PATHS =
  /(server\/gr\/gr-evaluation\.ts|server\/gr\/gr-constraint-policy\.ts|server\/routes\/warp-viability\.ts|server\/skills\/physics\.warp\.viability|server\/skills\/physics\.gr\.grounding|types\/warpViability|server\/helix-core\.ts)/i;
const HELIX_ASK_VERIFICATION_FOCUS =
  /\b(scientific method|verification|verify|falsifiable|falsifiability|hypothesis|experiment)\b/i;
const HELIX_ASK_VERIFICATION_ANCHOR_PATHS: RegExp[] = [
  /server\/routes\/agi\.plan\.ts/i,
  /server\/services\/helix-ask\/platonic-gates\.ts/i,
  /server\/services\/observability\/training-trace-store\.ts/i,
  /server\/services\/agi\/refinery-gates\.ts/i,
  /server\/services\/agi\/refinery-policy\.ts/i,
  /server\/services\/agi\/refinery-trajectory\.ts/i,
  /server\/routes\/training-trace\.ts/i,
];
const HELIX_ASK_VERIFICATION_ANCHOR_FILES = [
  "server/routes/agi.plan.ts",
  "server/services/helix-ask/platonic-gates.ts",
  "server/services/observability/training-trace-store.ts",
  "server/services/agi/refinery-gates.ts",
  "server/services/agi/refinery-policy.ts",
  "server/services/agi/refinery-trajectory.ts",
  "server/routes/training-trace.ts",
];
const HELIX_ASK_COMPOSITE_HINT =
  /\b(synthesize|fit together|bring together|tie together|map (?:it|them)? together|relate (?:these|those|them|it)|connect (?:these|those|them|it)|how do .* fit together|how do .* relate)\b/i;
const HELIX_ASK_COMPOSITE_MIN_TOPICS = 2;
const HELIX_ASK_COMPOSITE_ALLOWLIST =
  /(docs\/knowledge\/|docs\/ethos\/|server\/gr\/|server\/routes\/warp-viability\.ts|server\/skills\/physics\.warp\.viability\.ts|server\/helix-proof-pack\.ts|shared\/curvature-proxy\.ts|client\/src\/physics\/|client\/src\/pages\/star-hydrostatic-panel\.tsx|client\/src\/components\/WarpLedgerPanel\.tsx|client\/src\/components\/DriveGuardsPanel\.tsx|warp-web\/km-scale-warp-ledger\.html)/i;

type HelixAskVerbosity = "brief" | "normal" | "extended";

function resolveHelixAskVerbosity(
  question: string,
  intentProfile: HelixAskIntentProfile,
  requested?: HelixAskVerbosity,
): HelixAskVerbosity {
  if (requested) return requested;
  if (intentProfile.strategy !== "constraint_report") return "brief";
  const normalized = question.toLowerCase();
  if (/\bintegrity(_ok)?\b/.test(normalized)) {
    return "extended";
  }
  if (
    /\b(trace|end-to-end|end to end|data flow|modules|files|pipeline|full|detailed)\b/.test(
      normalized,
    )
  ) {
    return "extended";
  }
  if (/\b(decide|issue)\b/.test(normalized) && /\b(certificate|viability)\b/.test(normalized)) {
    return "extended";
  }
  return "brief";
}

function shouldHelixAskCompositeSynthesis(
  question: string,
  topicTags: HelixAskTopicTag[],
): { enabled: boolean; topics: HelixAskTopicTag[] } {
  if (!question.trim()) {
    return { enabled: false, topics: [] };
  }
  if (!HELIX_ASK_COMPOSITE_HINT.test(question)) {
    return { enabled: false, topics: [] };
  }
  const compositeTopics = topicTags.filter((tag) => tag !== "helix_ask");
  if (compositeTopics.length < HELIX_ASK_COMPOSITE_MIN_TOPICS) {
    return { enabled: false, topics: compositeTopics };
  }
  return { enabled: true, topics: compositeTopics };
}
const HELIX_ASK_FILE_HINT =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|mjs|cjs|py|rs|go|java|kt|swift|cpp|c|h)/i;
const HELIX_ASK_ANSWER_START = "ANSWER_START";
const HELIX_ASK_ANSWER_END = "ANSWER_END";
const HELIX_ASK_PROGRESS_TOOL = "helix.ask.progress";
const HELIX_ASK_PROGRESS_VERSION = "v1";
const HELIX_ASK_STREAM_TOOL = "helix.ask.stream";
const HELIX_ASK_STREAM_VERSION = "v1";
const HELIX_ASK_STREAM_FLUSH_MS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_STREAM_FLUSH_MS ?? process.env.VITE_HELIX_ASK_STREAM_FLUSH_MS,
    180,
  ),
  60,
  1200,
);
const HELIX_ASK_STREAM_CHUNK_MAX = clampNumber(
  readNumber(
    process.env.HELIX_ASK_STREAM_CHUNK_MAX ?? process.env.VITE_HELIX_ASK_STREAM_CHUNK_MAX,
    240,
  ),
  80,
  1200,
);
const HELIX_ASK_STREAM_MAX_EVENTS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_STREAM_MAX_EVENTS ?? process.env.VITE_HELIX_ASK_STREAM_MAX_EVENTS,
    64,
  ),
  8,
  300,
);
const HELIX_ASK_JOB_TIMEOUT_MS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_JOB_TIMEOUT_MS ?? process.env.VITE_HELIX_ASK_JOB_TIMEOUT_MS,
    180_000,
  ),
  30_000,
  30 * 60_000,
);

function ensureFinalMarker(value: string): string {
  if (!value.trim()) return `${HELIX_ASK_ANSWER_START}\n${HELIX_ASK_ANSWER_END}`;
  if (value.includes(HELIX_ASK_ANSWER_START) || value.includes("FINAL:")) return value;
  return `${value.trimEnd()}\n\n${HELIX_ASK_ANSWER_START}\n${HELIX_ASK_ANSWER_END}`;
}

function cleanPromptLine(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^[\"'`.,;\-]+/g, "").replace(/[\"'`.,;\-]+$/g, "").trim();
}

function normalizeQuestionMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const SCAFFOLD_HEADING_RE =
  /^(general reasoning|repo evidence|reasoning steps|reasoning bullets|evidence steps|evidence bullets)\s*:/i;
const SCAFFOLD_LINE_RE =
  /^(no (general reasoning|repo evidence) provided|definition|key questions|notes|scope)\s*:/i;
const SCAFFOLD_LIST_RE = /^(\d+\.\s+|[-*]\s+)/;


function resolveFallbackIntentProfile(target: "general" | "hybrid"): HelixAskIntentProfile {
  if (target === "general") {
    return getDefaultHelixAskIntentProfile();
  }
  const hybridProfile = getHelixAskIntentProfileById("hybrid.concept_plus_system_mapping");
  if (hybridProfile) {
    return {
      ...hybridProfile,
      formatPolicy: "auto",
      evidencePolicy: { ...hybridProfile.evidencePolicy },
    };
  }
  return {
    id: "hybrid.fallback",
    label: "Hybrid fallback",
    domain: "hybrid",
    tier: "F1",
    secondaryTier: "F0",
    strategy: "hybrid_explain",
    formatPolicy: "auto",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: false,
      allowedEvidenceKinds: ["repo_chunk", "prompt_chunk"],
    },
    matchers: [],
  };
}

type HelixAskMicroPassDecision = {
  enabled: boolean;
  auto?: boolean;
  reason?: string;
};

function countMicroPassClauses(value: string): number {
  const matches = value.match(/[?;:]|\b(?:and|or|vs|versus|but)\b/gi);
  return matches ? matches.length : 0;
}

function decideHelixAskMicroPass(question: string, formatSpec: { format: HelixAskFormat }): HelixAskMicroPassDecision {
  const trimmed = question.trim();
  if (!trimmed) {
    return { enabled: false };
  }
  if (HELIX_ASK_MICRO_PASS) {
    return { enabled: true, auto: false, reason: "flag" };
  }
  if (!HELIX_ASK_MICRO_PASS_AUTO) {
    return { enabled: false };
  }
  const normalized = trimmed.toLowerCase();
  if (HELIX_ASK_TWO_PASS_TRIGGER.test(normalized)) {
    return { enabled: true, auto: true, reason: "trigger" };
  }
  if (formatSpec.format === "steps" || formatSpec.format === "compare") {
    return { enabled: true, auto: true, reason: "format" };
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount >= HELIX_ASK_MICRO_PASS_AUTO_MIN_WORDS) {
    return { enabled: true, auto: true, reason: "length_words" };
  }
  if (normalized.length >= HELIX_ASK_MICRO_PASS_AUTO_MIN_CHARS) {
    return { enabled: true, auto: true, reason: "length_chars" };
  }
  if (countMicroPassClauses(normalized) >= HELIX_ASK_MICRO_PASS_AUTO_MIN_CLAUSES) {
    return { enabled: true, auto: true, reason: "clauses" };
  }
  return { enabled: false };
}

function isHelixAskRepoQuestion(question: string): boolean {
  const trimmed = question.trim();
  if (!trimmed) return true;
  if (HELIX_ASK_REPO_FORCE.test(trimmed)) return true;
  if (HELIX_ASK_FILE_HINT.test(trimmed)) return true;
  return HELIX_ASK_REPO_HINT.test(trimmed);
}

function extractEndpointHints(question: string): string[] {
  const matches = question.match(HELIX_ASK_ENDPOINT_HINT_RE) ?? [];
  if (matches.length === 0) return [];
  const hints = new Set<string>();
  for (const match of matches) {
    const trimmed = match.trim();
    if (!trimmed) continue;
    hints.add(trimmed);
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length >= 2) {
      hints.add(`/${parts.slice(0, 2).join("/")}`);
    }
    if (parts.length >= 3) {
      hints.add(`/${parts[parts.length - 1]}`);
    }
  }
  return Array.from(hints);
}

function extractEndpointAnchorPaths(evidenceText: string, hints: string[]): string[] {
  if (!evidenceText || hints.length === 0) return [];
  const hintSet = hints.map((hint) => hint.toLowerCase());
  const blocks = evidenceText.split(/\n{2,}/);
  const anchors = new Set<string>();
  for (const block of blocks) {
    const blockLower = block.toLowerCase();
    if (!hintSet.some((hint) => blockLower.includes(hint))) {
      continue;
    }
    const firstLine = block.split(/\r?\n/)[0]?.trim() ?? "";
    const fromHeader = extractFilePathsFromText(firstLine)[0];
    const fromBlock = extractFilePathsFromText(block)[0];
    const filePath = fromHeader || fromBlock;
    if (filePath) {
      anchors.add(filePath);
    }
  }
  return Array.from(anchors);
}

function hashHelixAskProgress(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

type HelixAskProgressArgs = {
  stage: string;
  detail?: string;
  sessionId?: string;
  traceId?: string;
  startedAt?: number;
  ok?: boolean;
};

function logHelixAskProgress({
  stage,
  detail,
  sessionId,
  traceId,
  startedAt,
  ok = true,
}: HelixAskProgressArgs): void {
  if (!sessionId) return;
  const cleanedDetail = detail?.trim();
  const label = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
  appendToolLog({
    tool: HELIX_ASK_PROGRESS_TOOL,
    version: HELIX_ASK_PROGRESS_VERSION,
    paramsHash: hashHelixAskProgress(`${stage}:${cleanedDetail ?? ""}`),
    durationMs: typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0,
    sessionId,
    traceId,
    ok,
    text: label,
  });
}

type HelixAskStreamEmitter = {
  onToken: (chunk: string) => void;
  flush: () => void;
  finalize: (fallback?: string) => void;
};

function createHelixAskStreamEmitter({
  sessionId,
  traceId,
  onChunk,
}: {
  sessionId?: string;
  traceId?: string;
  onChunk?: (chunk: string) => void;
}): HelixAskStreamEmitter {
  let buffer = "";
  let pending = "";
  let lastFlush = 0;
  let eventCount = 0;
  let seenStart = false;
  let done = false;
  let stopped = false;

  const pushLog = (text: string): void => {
    if (!sessionId || !text.trim()) return;
    appendToolLog({
      tool: HELIX_ASK_STREAM_TOOL,
      version: HELIX_ASK_STREAM_VERSION,
      paramsHash: hashHelixAskProgress(`stream:${eventCount}`),
      durationMs: 0,
      sessionId,
      traceId,
      ok: true,
      text,
    });
  };

  const flush = (): void => {
    if (stopped || !buffer.trim()) return;
    pushLog(buffer);
    onChunk?.(buffer);
    buffer = "";
    lastFlush = Date.now();
    eventCount += 1;
    if (eventCount >= HELIX_ASK_STREAM_MAX_EVENTS) {
      stopped = true;
    }
  };

  const pushText = (text: string): void => {
    if (stopped || !text) return;
    buffer += text;
    const now = Date.now();
    if (buffer.length >= HELIX_ASK_STREAM_CHUNK_MAX || now - lastFlush >= HELIX_ASK_STREAM_FLUSH_MS) {
      flush();
    }
  };

  const onToken = (chunk: string): void => {
    if (done || stopped || !chunk) return;
    pending += chunk;
    if (!seenStart) {
      const startIndex = pending.indexOf(HELIX_ASK_ANSWER_START);
      if (startIndex === -1) {
        if (pending.length > HELIX_ASK_ANSWER_START.length * 2) {
          pending = pending.slice(-HELIX_ASK_ANSWER_START.length);
        }
        return;
      }
      seenStart = true;
      pending = pending.slice(startIndex + HELIX_ASK_ANSWER_START.length);
      pending = pending.replace(/^\s*\n/, "");
    }
    if (!pending) return;
    const endIndex = pending.indexOf(HELIX_ASK_ANSWER_END);
    if (endIndex !== -1) {
      const emitText = pending.slice(0, endIndex);
      if (emitText) {
        pushText(emitText);
      }
      pending = "";
      done = true;
      flush();
      return;
    }
    const endLen = HELIX_ASK_ANSWER_END.length;
    if (pending.length >= endLen) {
      const emitLen = pending.length - (endLen - 1);
      const emitText = pending.slice(0, emitLen);
      if (emitText) {
        pushText(emitText);
      }
      pending = pending.slice(emitLen);
    }
  };

  const finalize = (fallback?: string): void => {
    if (done || stopped) return;
    if (!seenStart && fallback) {
      pushText(fallback);
    }
    flush();
    done = true;
  };

  return { onToken, flush, finalize };
}

type HelixAskJsonKeepAlive = {
  send: (status: number, payload: unknown) => void;
  stop: () => void;
  isStreaming: () => boolean;
};

function createHelixAskJsonKeepAlive(
  res: Response,
  options: { enabled: boolean; intervalMs: number },
): HelixAskJsonKeepAlive {
  let timer: NodeJS.Timeout | null = null;
  let streaming = false;
  let stopped = false;

  const startStreaming = (): void => {
    if (streaming || stopped || res.writableEnded) return;
    streaming = true;
    res.status(200);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    try {
      res.write(" \n");
    } catch {
      // Ignore write failures; caller will finalize.
    }
  };

  const tick = (): void => {
    if (stopped || res.writableEnded) {
      stop();
      return;
    }
    if (!streaming) {
      startStreaming();
      return;
    }
    try {
      res.write(" \n");
    } catch {
      stop();
    }
  };

  if (options.enabled) {
    timer = setInterval(tick, options.intervalMs);
  }

  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const send = (status: number, payload: unknown): void => {
    if (res.writableEnded) {
      stop();
      return;
    }
    if (!options.enabled || !streaming) {
      stop();
      res.status(status).json(payload);
      return;
    }
    stop();
    try {
      res.end(JSON.stringify(payload));
    } catch {
      // Ignore write failures on shutdown.
    }
  };

  return { send, stop, isStreaming: () => streaming };
}

function stripStageTags(value: string): string {
  if (!value) return value;
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\s*\((observe|hypothesis|experiment|analysis|explain)\)\s*$/i, "").trimEnd())
    .join("\n")
    .trim();
}

const QUESTION_PREFIX = /^question\s*:\s*/i;

function stripInlineQuestionLine(line: string, question?: string): string | null {
  if (!QUESTION_PREFIX.test(line)) return null;
  let rest = line.replace(QUESTION_PREFIX, "").trimStart();
  if (QUESTION_PREFIX.test(rest)) {
    rest = rest.replace(QUESTION_PREFIX, "").trimStart();
  }
  const questionTrimmed = question?.trim();
  if (questionTrimmed) {
    const questionLower = questionTrimmed.toLowerCase();
    if (rest.toLowerCase().startsWith(questionLower)) {
      rest = rest
        .slice(questionTrimmed.length)
        .replace(/^[\s:;,.!?-]+/, "")
        .trimStart();
    }
  }
  if (!rest) return "";
  const markIndex = rest.indexOf("?");
  if (markIndex >= 0 && markIndex < 240) {
    const after = rest.slice(markIndex + 1).replace(/^[\s:;,.!?-]+/, "").trimStart();
    if (after) return after;
  }
  return rest;
}

function stripQuestionPrefixText(value: string, question?: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  if (!lines.length) return value;
  const stripped = stripInlineQuestionLine(lines[0] ?? "", question);
  if (stripped === null) return value;
  if (stripped) {
    lines[0] = stripped;
  } else {
    lines.shift();
  }
  return lines.join("\n").trim();
}

function isPromptLine(value: string): boolean {
  const cleaned = cleanPromptLine(value);
  if (!cleaned) return false;
  return (
    /^(question|context|prompt context|resonance patch)\s*:/i.test(cleaned) ||
    SCAFFOLD_HEADING_RE.test(cleaned) ||
    /^you are helix ask/i.test(cleaned) ||
    /^use only the evidence/i.test(cleaned) ||
    /^use only the evidence steps/i.test(cleaned) ||
    /^use only the evidence bullets/i.test(cleaned) ||
    /^use general knowledge/i.test(cleaned) ||
    /^use only the reasoning/i.test(cleaned) ||
    /^respond with only the answer between/i.test(cleaned) ||
    /^answer_start$/i.test(cleaned) ||
    /^answer_end$/i.test(cleaned) ||
    /^if the context is insufficient/i.test(cleaned) ||
    /^if the question mentions/i.test(cleaned) ||
    /^when the context includes/i.test(cleaned) ||
    /^when listing multiple/i.test(cleaned) ||
    /^if the question is comparative/i.test(cleaned) ||
    /^answer with a step/i.test(cleaned) ||
    /^start directly with/i.test(cleaned) ||
    /^each step should/i.test(cleaned) ||
    /^answer in \d/i.test(cleaned) ||
    /^do not use numbered steps/i.test(cleaned) ||
    /^after the steps/i.test(cleaned) ||
    /^avoid repetition/i.test(cleaned) ||
    /^revise the answer\b/i.test(cleaned) ||
    /^do not add new claims\b/i.test(cleaned) ||
    /^preserve the format\b/i.test(cleaned) ||
    /^keep the paragraph format\b/i.test(cleaned) ||
    /^keep the numbered step list\b/i.test(cleaned) ||
    /^use only file paths\b/i.test(cleaned) ||
    /^evidence\s*:/i.test(cleaned) ||
    /^answer\s*:/i.test(cleaned) ||
    /^preserve any stage tags/i.test(cleaned) ||
    /^do not include stage tags/i.test(cleaned) ||
    /^no preamble\b/i.test(cleaned) ||
    /^no headings\b/i.test(cleaned) ||
    /^evidence steps\s*:/i.test(cleaned) ||
    /^evidence bullets\s*:/i.test(cleaned) ||
    /^reasoning steps\s*:/i.test(cleaned) ||
    /^reasoning bullets\s*:/i.test(cleaned) ||
    /^do not include\b/i.test(cleaned) ||
    /^do not output\b/i.test(cleaned) ||
    /^do not include the words/i.test(cleaned) ||
    /^context sources\b/i.test(cleaned) ||
    /^ask debug\b/i.test(cleaned) ||
    /^(two-pass|two pass)\s*:/i.test(cleaned) ||
    /^format\s*:/i.test(cleaned) ||
    /^stage tags\s*:/i.test(cleaned) ||
    /^keep paragraphs short/i.test(cleaned) ||
    /^end with a short paragraph/i.test(cleaned) ||
    /^do not repeat the question/i.test(cleaned) ||
    /^do not output tool logs/i.test(cleaned) ||
    /^respond w/i.test(cleaned)
  );
}

function stripScaffoldSections(value: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const cleaned = cleanPromptLine(line);
    if (!cleaned) {
      if (!skipping) kept.push("");
      continue;
    }
    if (SCAFFOLD_HEADING_RE.test(cleaned)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (SCAFFOLD_LINE_RE.test(cleaned) || SCAFFOLD_LIST_RE.test(cleaned) || isPromptLine(cleaned)) {
        continue;
      }
      skipping = false;
    }
    kept.push(line);
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripLeadingQuestion(answer: string, question?: string): string {
  const lines = answer.split(/\r?\n/);
  const target = question?.trim();
  const normalizedTarget = target ? normalizeQuestionMatch(target) : "";
  let index = 0;
  while (index < lines.length) {
    const inline = stripInlineQuestionLine(lines[index] ?? "", question);
    if (inline !== null) {
      if (inline) {
        lines[index] = inline;
        break;
      }
      index += 1;
      continue;
    }
    const cleaned = cleanPromptLine(lines[index] ?? "");
    if (!cleaned) {
      index += 1;
      continue;
    }
    if (isPromptLine(cleaned)) {
      index += 1;
      continue;
    }
    if (target) {
      if (cleaned.toLowerCase() === target.toLowerCase()) {
        index += 1;
        continue;
      }
      if (normalizeQuestionMatch(cleaned) === normalizedTarget) {
        index += 1;
        continue;
      }
    }
    break;
  }
  return lines.slice(index).join("\n").trim();
}

function stripPromptEchoFromAnswer(answer: string, question?: string): string {
  let trimmed = stripQuestionPrefixText(answer.trim(), question);
  trimmed = stripLeadingQuestion(trimmed, question);
  trimmed = stripEvidencePromptBlock(trimmed);
  trimmed = stripScaffoldSections(trimmed);
  if (trimmed) {
    const lines = trimmed.split(/\r?\n/);
    let start = 0;
    for (; start < lines.length; start += 1) {
      const cleaned = cleanPromptLine(lines[start] ?? "");
      if (!cleaned) continue;
      if (/^question:/i.test(cleaned) && /(truncated|\.\.\.)/i.test(cleaned)) {
        continue;
      }
      break;
    }
    trimmed = lines.slice(start).join("\n").trim();
  }
  const answerBlock = extractAnswerBlock(trimmed);
  if (answerBlock) {
    return stripScaffoldSections(answerBlock);
  }
  if (!trimmed) return trimmed;
  trimmed = trimmed
    .split(/\r?\n/)
    .filter((line) => {
      const cleaned = cleanPromptLine(line);
      if (!cleaned) return false;
      return !isPromptLine(cleaned);
    })
    .join("\n")
    .trim();
  if (!trimmed) return trimmed;
  trimmed = stripScaffoldSections(trimmed);
  if (!trimmed) return trimmed;
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const idx = trimmed.lastIndexOf(marker);
    if (idx >= 0) {
      const after = trimmed.slice(idx + marker.length).trim();
      if (after) return after;
    }
  }
  return trimmed;
}

function stripEvidencePromptBlock(value: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  const cleaned = lines.map((line) => cleanPromptLine(line));
  const evidenceIndex = cleaned.findIndex((line) => /^evidence\s*:/i.test(line));
  if (evidenceIndex < 0) return value;
  const answerIndex = cleaned.findIndex((line, index) => index > evidenceIndex && /^answer\s*:/i.test(line));
  if (answerIndex < 0) return value;
  const pruned = [...lines.slice(0, evidenceIndex), ...lines.slice(answerIndex + 1)];
  return pruned.join("\n").trim();
}

function extractAnswerBlock(value: string): string {
  if (!value) return "";
  const startIndex = value.lastIndexOf(HELIX_ASK_ANSWER_START);
  if (startIndex >= 0) {
    const afterStart = value.slice(startIndex + HELIX_ASK_ANSWER_START.length);
    const endIndex = afterStart.lastIndexOf(HELIX_ASK_ANSWER_END);
    const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    const trimmed = slice.trim();
    if (trimmed) return trimmed;
  }
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const idx = value.lastIndexOf(marker);
    if (idx >= 0) {
      const after = value.slice(idx + marker.length).trim();
      if (after) return after;
    }
  }
  return "";
}

function formatHelixAskAnswer(answer: string): string {
  if (!answer) return answer;
  const lines = answer.split(/\r?\n/);
  const formatted: string[] = [];
  let lastWasBlank = true;
  for (const rawLine of lines) {
    let line = rawLine.trimEnd();
    if (line) {
      line = line.replace(HELIX_ASK_LABEL_PREFIX_RE, "");
    }
    if (!line.trim()) {
      if (!lastWasBlank && formatted.length) {
        formatted.push("");
        lastWasBlank = true;
      }
      continue;
    }
    const trimmedLine = line.trim();
    if (/^paragraph\s+\d+\s*:/i.test(trimmedLine)) {
      continue;
    }
    if (
      /^(general reasoning|repo evidence|evidence bullets|reasoning bullets)\s*:/i.test(trimmedLine) ||
      /^(details|key files|sources)\s*:?\s*$/i.test(trimmedLine)
    ) {
      continue;
    }
    const isListItem = /^\s*(\d+\.\s+|[-*]\s+)/.test(line);
    if (isListItem && formatted.length && !lastWasBlank) {
      formatted.push("");
    }
    formatted.push(line);
    lastWasBlank = false;
  }
  const normalizedParagraph = (value: string): string =>
    value
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  let packed = formatted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!packed) return packed;
  packed = packed.replace(HELIX_ASK_LABEL_PREFIX_RE, "").trim();
  const seen = new Set<string>();
  const deduped = packed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => {
      if (!paragraph) return false;
      const key = normalizedParagraph(paragraph);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return deduped.join("\n\n").trim();
}

const HELIX_ASK_TWO_PARAGRAPH_CONTRACT =
  /\b(two|2)\s+(short\s+)?paragraphs?\b/i;
const HELIX_ASK_LABEL_PREFIX_RE =
  /\b(Definition|Key questions|Notes|Scope)\s*:\s*/gi;
const HELIX_ASK_DRAWER_HEADER =
  /^(details|key files|sources|proof)\s*:?\s*$/i;
const HELIX_ASK_SOURCES_LINE = /^sources?\s*:/i;
const HELIX_ASK_FILE_LIST_ITEM = /^[-*]\s+.+\.(md|json|ts|tsx|js|jsx|html|css|yml|yaml)\b/i;

function stripDrawerSectionsFromAnswer(answer: string): string {
  if (!answer) return answer;
  const lines = answer.split(/\r?\n/);
  const cleaned: string[] = [];
  let skipSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (skipSection) {
        skipSection = false;
        continue;
      }
      cleaned.push("");
      continue;
    }
    if (HELIX_ASK_DRAWER_HEADER.test(trimmed)) {
      skipSection = true;
      continue;
    }
    if (HELIX_ASK_SOURCES_LINE.test(trimmed)) {
      continue;
    }
    if (skipSection) {
      continue;
    }
    if (HELIX_ASK_FILE_LIST_ITEM.test(trimmed) && /[\\/]/.test(trimmed)) {
      continue;
    }
    cleaned.push(line);
  }
  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function enforceHelixAskPromptContract(answer: string, question: string): string {
  if (!answer) return answer;
  if (!HELIX_ASK_TWO_PARAGRAPH_CONTRACT.test(question)) return answer;
  const stripped = stripDrawerSectionsFromAnswer(answer);
  const paragraphs = stripped
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length <= 2) {
    return paragraphs.join("\n\n").trim();
  }
  return paragraphs.slice(0, 2).join("\n\n").trim();
}

const hasTwoParagraphContract = (question: string): boolean =>
  HELIX_ASK_TWO_PARAGRAPH_CONTRACT.test(question);

function normalizeNumberedListLines(value: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  const normalized = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    const matches = trimmed.match(/\b\d+\.\s+/g) ?? [];
    if (matches.length < 2) return line;
    return line
      .replace(/(\s)(\d+\.)\s+/g, "\n$2 ")
      .replace(/(\S)(\d+\.)\s+/g, "$1\n$2 ");
  });
  return normalized.join("\n");
}

function hasSourcesLine(value: string): boolean {
  if (!value) return false;
  return /(?:^|\n)sources?\s*:\s*\S/i.test(value);
}

function repairAnswerFilePathFragments(
  answer: string,
  contextFiles: string[],
  evidenceText: string,
): string {
  if (!answer || contextFiles.length === 0) return answer;
  const replacements = contextFiles
    .map((file) => {
      const match = file.match(/^(.*)\.(ts|tsx|md|json|js|jsx)$/);
      if (!match) return null;
      return { stem: match[1], full: file };
    })
    .filter((value): value is { stem: string; full: string } => Boolean(value));
  if (replacements.length === 0) return answer;
  const knownPaths = new Set([
    ...contextFiles,
    ...extractFilePathsFromText(evidenceText),
  ]);
  const lines = answer.split(/\r?\n/);
  const repaired = lines.map((line) => {
    let updated = line;
    for (const { stem, full } of replacements) {
      if (updated.includes(full)) {
        continue;
      }
      if (updated.includes(`${stem}.`)) {
        const escapedStem = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        updated = updated.replace(
          new RegExp(`\\b${escapedStem}\\.(?!ts|tsx|md|json|js|jsx)`, "g"),
          full,
        );
      }
    }
    if (
      updated.includes("(") &&
      !updated.includes(")") &&
      /\b[\w./-]+\.(?:ts|tsx|md|json|js|jsx)\b/.test(updated)
    ) {
      updated = `${updated})`;
    }
    if (updated.includes("(")) {
      const segments = updated.split("(");
      if (segments.length > 1) {
        const prefix = segments.shift() ?? "";
        const tail = segments.join("(");
        const parts = tail.split(")");
        const inside = parts[0] ?? "";
        const corrected = inside.replace(/([\w./-]+)\.(?=\s*(?:,|\)|$))/g, (match, stem) => {
          for (const ext of ["ts", "tsx", "md", "json", "js", "jsx"]) {
            const candidate = `${stem}.${ext}`;
            if (knownPaths.has(candidate)) {
              return candidate;
            }
          }
          return match;
        });
        updated = `${prefix}(${corrected}${parts.length > 1 ? `)${parts.slice(1).join(")")}` : ")"}`;
      }
    }
    return updated;
  });
  return repaired.join("\n");
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function stripTruncationMarkers(value: string): string {
  if (!value) return value;
  const lines = value.split(/\r?\n/);
  let start = 0;
  for (; start < lines.length; start += 1) {
    const trimmed = lines[start].trim();
    if (!trimmed) continue;
    if (/^(?:\.{3,}|…)(?:\s*\(truncated\))?$/i.test(trimmed)) {
      continue;
    }
    if (/\(truncated\)/i.test(trimmed)) {
      continue;
    }
    if (trimmed.length <= 120 && /\.{3,}\s*$/.test(trimmed)) {
      continue;
    }
    break;
  }
  const remainder = lines.slice(start).join("\n").trim();
  return remainder || "";
}



const LONGPROMPT_HEADING = /^#{1,6}\s+(.+)$/;
const LONGPROMPT_CODE_FENCE = /^```/;
const LONGPROMPT_EMBED_DIM = 128;

type PromptBlock = {
  heading: string;
  text: string;
};

type PromptChunk = {
  id: string;
  section: string;
  text: string;
  tokens: string[];
  embedding: Float64Array | null;
};

type PromptChunkCandidate = {
  chunkId: string;
  section: string;
  text: string;
  tokens: string[];
  score: number;
  rrfScore: number;
};

type PromptChunkSelection = {
  id: string;
  section: string;
  preview: string;
};

const dedupeTokens = (tokens: string[]): string[] => Array.from(new Set(tokens));

const estimateTokenCount = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

const tokenizePromptText = (text: string): string[] => dedupeTokens(tokenizeAskQuery(text));

const splitPromptBlocks = (text: string): PromptBlock[] => {
  const blocks: PromptBlock[] = [];
  const lines = text.split(/\r?\n/);
  let buffer: string[] = [];
  let heading = "";
  let inFence = false;
  const flush = () => {
    const joined = buffer.join("\n").trim();
    buffer = [];
    if (!joined) return;
    blocks.push({ heading, text: joined });
  };
  for (const rawLine of lines) {
    const line = rawLine ?? "";
    if (LONGPROMPT_CODE_FENCE.test(line.trim())) {
      inFence = !inFence;
    }
    if (!inFence) {
      const headingMatch = line.match(LONGPROMPT_HEADING);
      if (headingMatch) {
        flush();
        heading = headingMatch[1]?.trim() ?? heading;
        buffer.push(line);
        continue;
      }
      if (!line.trim()) {
        flush();
        continue;
      }
    }
    buffer.push(line);
  }
  flush();
  return blocks;
};

const splitLargeText = (text: string, maxChars: number, overlapChars: number): string[] => {
  const segments: string[] = [];
  let start = 0;
  const safeOverlap = Math.min(Math.max(overlapChars, 0), Math.max(0, maxChars - 40));
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars);
    const breakIndex = text.lastIndexOf("\n", end);
    if (breakIndex > start + 120) {
      end = breakIndex;
    }
    const slice = text.slice(start, end).trim();
    if (slice) {
      segments.push(slice);
    }
    if (end >= text.length) {
      break;
    }
    start = Math.max(0, end - safeOverlap);
  }
  return segments;
};

const buildPromptChunks = (
  text: string,
  options: { chunkTokens: number; overlapTokens: number },
): PromptChunk[] => {
  const normalized = text.trim();
  if (!normalized) return [];
  const maxChars = Math.max(240, Math.floor(options.chunkTokens * 4));
  const overlapChars = Math.max(0, Math.floor(options.overlapTokens * 4));
  const baseHash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12);
  const basePath = `prompt/longprompt/${baseHash}`;
  const blocks = splitPromptBlocks(normalized);
  const chunks: PromptChunk[] = [];
  let current = "";
  let currentHeading = "";
  const pushChunk = (value: string, headingValue: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const chunkId = `${basePath}/chunk-${String(chunks.length + 1).padStart(4, "0")}.md`;
    const tokens = tokenizePromptText(trimmed);
    const embedding = trimmed ? hashEmbed(trimmed, LONGPROMPT_EMBED_DIM) : null;
    chunks.push({
      id: chunkId,
      section: headingValue,
      text: trimmed,
      tokens,
      embedding,
    });
  };

  for (const block of blocks) {
    const blockText = block.text.trim();
    if (!blockText) continue;
    const headingValue = block.heading || currentHeading;
    if (!current) {
      current = blockText;
      currentHeading = headingValue;
      continue;
    }
    const candidate = `${current}\n\n${blockText}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      currentHeading = headingValue || currentHeading;
      continue;
    }
    pushChunk(current, currentHeading);
    const overlap = overlapChars > 0 ? current.slice(-overlapChars) : "";
    current = overlap ? `${overlap}\n\n${blockText}` : blockText;
    currentHeading = headingValue || currentHeading;
    if (current.length > maxChars) {
      const splits = splitLargeText(current, maxChars, overlapChars);
      const leading = splits.slice(0, Math.max(0, splits.length - 1));
      leading.forEach((segment) => pushChunk(segment, currentHeading));
      current = splits.length ? splits[splits.length - 1] : "";
    }
  }
  if (current) {
    pushChunk(current, currentHeading);
  }
  return chunks;
};

const dot = (a: Float64Array, b: Float64Array): number => {
  const len = Math.min(a.length, b.length);
  let acc = 0;
  for (let i = 0; i < len; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
};

const normalizeScore = (value: number): number => Math.max(0, Math.min(1, (value + 1) / 2));

const keywordScore = (queryTokens: string[], docTokens: string[]): number => {
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return 0;
  }
  const set = new Set(docTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (set.has(token)) {
      hits += 1;
    }
  }
  return hits / queryTokens.length;
};

const embeddingScore = (query: Float64Array | null, doc: Float64Array | null): number => {
  if (!query || !doc || query.length === 0 || doc.length === 0) {
    return 0;
  }
  return normalizeScore(dot(query, doc));
};

const mergePromptCandidatesWithRrf = (candidateLists: PromptChunkCandidate[][], rrfK: number): PromptChunkCandidate[] => {
  const merged = new Map<string, PromptChunkCandidate>();
  candidateLists.forEach((list) => {
    list.forEach((candidate, index) => {
      const existing = merged.get(candidate.chunkId);
      const bump = 1 / (rrfK + index + 1);
      if (!existing) {
        merged.set(candidate.chunkId, { ...candidate, rrfScore: bump });
        return;
      }
      if (candidate.score > existing.score) {
        existing.score = candidate.score;
      }
      existing.rrfScore += bump;
    });
  });
  return Array.from(merged.values()).sort((a, b) => b.rrfScore - a.rrfScore);
};

const promptChunkSimilarity = (a: PromptChunkCandidate, b: PromptChunkCandidate): number => {
  if (!a.tokens.length || !b.tokens.length) return 0;
  const aSet = new Set(a.tokens);
  const bSet = new Set(b.tokens);
  let intersect = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersect += 1;
  }
  const union = aSet.size + bSet.size - intersect;
  return union > 0 ? intersect / union : 0;
};

const selectPromptCandidatesWithMmr = (
  candidates: PromptChunkCandidate[],
  limit: number,
  lambda: number,
): PromptChunkCandidate[] => {
  if (candidates.length <= 1) return candidates.slice(0, limit);
  const remaining = candidates.slice();
  const selected: PromptChunkCandidate[] = [];
  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const relevance = candidate.rrfScore;
      let diversity = 0;
      for (const picked of selected) {
        diversity = Math.max(diversity, promptChunkSimilarity(candidate, picked));
      }
      const mmrScore = lambda * relevance - (1 - lambda) * diversity;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return selected;
};

const buildLongPromptContext = (
  promptText: string,
  query: string,
  opts: {
    chunkTokens: number;
    overlapTokens: number;
    topK: number;
    topM: number;
  },
): {
  context: string;
  files: string[];
  chunkCount: number;
  selectedCount: number;
  selections: PromptChunkSelection[];
} => {
  const chunks = buildPromptChunks(promptText, {
    chunkTokens: opts.chunkTokens,
    overlapTokens: opts.overlapTokens,
  });
  if (!chunks.length) {
    return { context: "", files: [], chunkCount: 0, selectedCount: 0, selections: [] };
  }
  const queryTokens = tokenizePromptText(query);
  const queryVector = queryTokens.length ? hashEmbed(query, LONGPROMPT_EMBED_DIM) : null;
  const lexical: PromptChunkCandidate[] = [];
  const semantic: PromptChunkCandidate[] = [];
  for (const chunk of chunks) {
    const kwScore = keywordScore(queryTokens, chunk.tokens);
    if (kwScore > 0) {
      lexical.push({
        chunkId: chunk.id,
        section: chunk.section,
        text: chunk.text,
        tokens: chunk.tokens,
        score: kwScore,
        rrfScore: 0,
      });
    }
    const embedScore = embeddingScore(queryVector, chunk.embedding);
    if (embedScore > 0) {
      semantic.push({
        chunkId: chunk.id,
        section: chunk.section,
        text: chunk.text,
        tokens: chunk.tokens,
        score: embedScore,
        rrfScore: 0,
      });
    }
  }
  const topK = Math.max(1, opts.topK);
  const lexicalTop = lexical.sort((a, b) => b.score - a.score).slice(0, topK);
  const semanticTop = semantic.sort((a, b) => b.score - a.score).slice(0, topK);
  const merged = mergePromptCandidatesWithRrf([lexicalTop, semanticTop], HELIX_ASK_RRF_K);
  const selectLimit = Math.max(1, opts.topM);
  let selected = selectPromptCandidatesWithMmr(merged, selectLimit, HELIX_ASK_MMR_LAMBDA);
  if (!selected.length) {
    selected = chunks.slice(0, selectLimit).map((chunk) => ({
      chunkId: chunk.id,
      section: chunk.section,
      text: chunk.text,
      tokens: chunk.tokens,
      score: 0,
      rrfScore: 0,
    }));
  }
  const lines: string[] = [];
  const files: string[] = [];
  const selections: PromptChunkSelection[] = [];
  for (const entry of selected) {
    const preview = clipAskText(entry.text, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    lines.push(`${entry.chunkId}\n${preview}`);
    files.push(entry.chunkId);
    selections.push({
      id: entry.chunkId,
      section: entry.section,
      preview,
    });
  }
  return {
    context: lines.join("\n\n"),
    files,
    chunkCount: chunks.length,
    selectedCount: selected.length,
    selections,
  };
};

type LongPromptCandidate = {
  text: string;
  source: "context" | "prompt" | "question";
};

const resolveLongPromptCandidate = (input: {
  prompt?: string;
  question?: string;
  contextText?: string;
  hasQuestion: boolean;
}): LongPromptCandidate | null => {
  const contextText = input.contextText?.trim() ?? "";
  if (contextText) {
    return { text: contextText, source: "context" };
  }
  const promptText = input.prompt?.trim() ?? "";
  if (promptText && !input.hasQuestion) {
    return { text: promptText, source: "prompt" };
  }
  const questionText = input.question?.trim() ?? "";
  if (questionText) {
    return { text: questionText, source: "question" };
  }
  return null;
};

function stripQueryPrefix(value: string): string {
  return value.replace(/^(\d+\.\s+|[-*]\s+)/, "").trim();
}

function parseQueryHints(raw: string, limit: number): string[] {
  const hints: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const cleaned = cleanPromptLine(stripQueryPrefix(line));
    if (!cleaned) continue;
    if (/^(question|context)\s*:/i.test(cleaned)) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hints.push(cleaned);
    if (hints.length >= limit) break;
  }
  return hints;
}

function mergeHelixAskQueries(base: string[], hints: string[], limit: number): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  };
  base.forEach(push);
  hints.forEach(push);
  return merged.slice(0, Math.max(1, limit));
}

function normalizeAskSearchSeed(value: string): string {
  return value.replace(/^\s*question:\s*/i, "").trim();
}

function buildHelixAskSearchQueries(
  question: string,
  topicTags: HelixAskTopicTag[] = [],
): string[] {
  const base = normalizeAskSearchSeed(question.trim());
  if (!base) return [];
  const normalized = base.toLowerCase();
  const queries = [base];
  const seen = new Set([base.toLowerCase()]);
  const hasTopic = (tag: HelixAskTopicTag) => topicTags.includes(tag);
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(trimmed);
  };

  if (
    hasTopic("helix_ask") ||
    HELIX_ASK_CORE_FOCUS.test(normalized) ||
    /\/api\/agi\/ask|helix ask|helixask|ask pipeline|ask system|agi ask/i.test(normalized)
  ) {
    push("/api/agi/ask");
    push("docs/helix-ask-flow.md");
    push("helix ask");
    push("helix ask flow");
    push("helix ask pipeline");
    push("buildGroundedAskPrompt");
    push("buildGroundedPrompt");
    push("askLocal");
    push("server/routes/agi.plan.ts");
    push("client/src/pages/desktop.tsx");
    push("client/src/components/helix/HelixAskPill.tsx");
    push("server/skills/llm.local.spawn.ts");
  }
  if (hasTopic("warp") || /warp|alcubierre|bubble/i.test(normalized)) {
    push("warp bubble");
    push("modules/warp/warp-module.ts");
    push("calculateNatarioWarpBubble");
    push("docs/knowledge/warp/warp-bubble.md");
    push("docs/knowledge/warp/natario-zero-expansion.md");
    push("docs/knowledge/warp/shift-vector-expansion-scalar.md");
    push("warp pipeline");
    push("energy-pipeline warp");
  }
  if (hasTopic("ideology") || /ideology|ethos|mission ethos|ledger/i.test(normalized)) {
    push("docs/ethos/ideology.json");
    push("docs/ethos/why.md");
    push("mission ethos");
  }
  if (hasTopic("ledger") || /ledger|stellar ledger|sun ledger|stewardship ledger/i.test(normalized)) {
    push("docs/knowledge/sun-ledger.md");
    push("docs/knowledge/stewardship-ledger.md");
    push("docs/knowledge/warp-ledger.md");
    push("docs/knowledge/kappa-proxy.md");
    push("server/helix-proof-pack.ts");
    push("client/src/components/WarpLedgerPanel.tsx");
  }
  if (hasTopic("star") || /save the sun|save-the-sun|solar restoration|stellar ledger|red giant/i.test(normalized)) {
    push("docs/ethos/ideology.json");
    push("docs/ethos/why.md");
    push("docs/knowledge/sun-ledger.md");
    push("docs/knowledge/stewardship-ledger.md");
    push("docs/knowledge/star-hydrostatic.md");
    push("client/src/pages/star-hydrostatic-panel.tsx");
    push("client/src/physics/polytrope.ts");
    push("client/src/physics/gamow.ts");
  }
  if (hasTopic("concepts") || /platonic|uncertainty|wavefunction|probability field|langevin/i.test(normalized)) {
    push("docs/knowledge/platonic-reasoning.md");
    push("server/services/helix-ask/platonic-gates.ts");
    push("server/services/helix-ask/concepts.ts");
    push("server/services/observability/training-trace-store.ts");
    push("server/services/agi/refinery-gates.ts");
    push("server/services/agi/refinery-policy.ts");
  }
  if (normalized.includes("solve") || normalized.includes("solver")) {
    push("warp solver");
    push("constraint gate");
    push("gr evaluation");
  }

  return queries.slice(0, 10);
}

function buildHybridConceptSkeleton(
  question: string,
  conceptMatch: HelixAskConceptMatch | null,
): string[] {
  const label =
    conceptMatch?.card.label ?? conceptMatch?.card.id ?? "the concept";
  if (!question.trim()) return [];
  return [
    `Hypothesis: what claim about ${label} is being tested or verified?`,
    "Test/Gate: which gate or policy accepts or rejects outputs?",
    "Evidence/Trace: where is evidence recorded or replayed?",
    "Revision: how does the system repair, retry, or clarify?",
  ];
}

function shouldRequireVerificationAnchors(
  intentProfile: HelixAskIntentProfile | null,
  question: string,
  conceptMatch: HelixAskConceptMatch | null,
): boolean {
  if (!intentProfile) return false;
  if (intentProfile.id !== "hybrid.concept_plus_system_mapping") return false;
  const matchId = conceptMatch?.card.id.toLowerCase();
  if (matchId) {
    if (matchId.includes("scientific method") || matchId.includes("verification") || matchId.includes("falsifiability")) {
      return true;
    }
  }
  return HELIX_ASK_VERIFICATION_FOCUS.test(question);
}

function buildVerificationAnchorHints(question: string): string[] {
  const hints = [...HELIX_ASK_VERIFICATION_ANCHOR_FILES];
  if (HELIX_ASK_VIABILITY_FOCUS.test(question)) {
    hints.push("server/gr/gr-evaluation.ts");
    hints.push("server/gr/gr-constraint-policy.ts");
  }
  return hints;
}

function buildHelixAskQueryPrompt(
  question: string,
  options?: { conceptSkeleton?: string[]; anchorHints?: string[] },
): string {
  const lines = [
    "You are Helix Ask query planner.",
    `Return up to ${HELIX_ASK_QUERY_HINTS_MAX} short search queries or file path hints.`,
    "Output ONLY the block between PLAN_START and PLAN_END.",
    "Inside the block: emit optional directives (one per line), then a QUERIES_START line, then query hints.",
    "Directive format:",
    "preferred_surfaces: docs, ethos, knowledge, tests, code",
    "Only use preferred_surfaces/avoid_surfaces from the allowed list above.",
    "avoid_surfaces: tokamak, qi",
    "must_include_globs: docs/ethos/**, docs/knowledge/**",
    "Only emit must_include_globs if you can name real repo paths (docs/, server/, client/, modules/, shared/, apps/, tools/, scripts/, cli/, packages/, warp-web/, .github/).",
    "required_slots: definition, repo_mapping, verification, failure_path",
    "clarify: <one short question if evidence is likely missing>",
    "Use one line per query. Prefer module names, symbols, or paths.",
    "No preamble, no numbering, no extra commentary.",
    "PLAN_START",
    "QUERIES_START",
    "PLAN_END",
    options?.conceptSkeleton?.length
      ? "Use these conceptual slots to shape the queries:"
      : "",
    options?.conceptSkeleton?.length ? options.conceptSkeleton.join("\n") : "",
    options?.anchorHints?.length ? "Prefer these verification anchors:" : "",
    options?.anchorHints?.length ? options.anchorHints.map((entry) => `- ${entry}`).join("\n") : "",
    "",
    `Question: ${question}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function filterCompositeContext(context: string): string {
  if (!context.trim()) return "";
  const blocks = context.split(/\n{2,}/);
  const kept: string[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) continue;
    const header = lines[0].trim();
    if (HELIX_ASK_COMPOSITE_ALLOWLIST.test(header)) {
      kept.push(block.trim());
    }
  }
  return kept.join("\n\n");
}

function collectCompositeMustIncludeFiles(tags: HelixAskTopicTag[]): string[] {
  const files = new Set<string>();
  for (const tag of tags) {
    const profile = buildHelixAskTopicProfile([tag]);
    if (!profile?.mustIncludeFiles?.length) continue;
    for (const entry of profile.mustIncludeFiles) {
      if (entry) files.add(entry);
    }
  }
  return Array.from(files);
}

type AskCandidate = {
  filePath: string;
  preview: string;
  score: number;
  rrfScore: number;
};

type AskCandidateChannel = "lexical" | "symbol" | "fuzzy" | "path";
type AskCandidateChannelStats = Record<AskCandidateChannel, number>;
type AskCandidateChannelList = { channel: AskCandidateChannel; candidates: AskCandidate[] };

const HELIX_ASK_CHANNELS: AskCandidateChannel[] = ["lexical", "symbol", "fuzzy", "path"];
const HELIX_ASK_RRF_CHANNEL_WEIGHTS: AskCandidateChannelStats = {
  lexical: HELIX_ASK_RRF_WEIGHT_LEXICAL,
  symbol: HELIX_ASK_RRF_WEIGHT_SYMBOL,
  fuzzy: HELIX_ASK_RRF_WEIGHT_FUZZY,
  path: 1.5,
};

type HelixAskPlanDirectives = {
  preferredSurfaces: string[];
  avoidSurfaces: string[];
  mustIncludeGlobs: string[];
  requiredSlots: string[];
  clarifyQuestion?: string;
};

type HelixAskPlanScope = {
  allowlistTiers?: RegExp[][];
  avoidlist?: RegExp[];
  mustIncludeGlobs?: RegExp[];
  docsFirst?: boolean;
  docsAllowlist?: RegExp[][];
};

function initAskChannelStats(value = 0): AskCandidateChannelStats {
  return { lexical: value, symbol: value, fuzzy: value, path: value };
}

function applyAskNodeBoosts(
  score: number,
  filePath: string,
  question: string,
  topicProfile?: HelixAskTopicProfile | null,
): number {
  let boosted = score;
  if (HELIX_ASK_CORE_FOCUS.test(question)) {
    if (HELIX_ASK_CORE_PATH_BOOST.test(filePath)) boosted += 10;
    if (HELIX_ASK_CORE_NOISE.test(filePath)) boosted -= 8;
  }
  if (HELIX_ASK_WARP_FOCUS.test(question) && HELIX_ASK_WARP_PATH_BOOST.test(filePath)) {
    boosted += 8;
  }
  if (HELIX_ASK_CONCEPTUAL_FOCUS.test(question)) {
    if (HELIX_ASK_DOCS_PATH_BOOST.test(filePath)) boosted += 8;
    if (HELIX_ASK_TEST_PATH_NOISE.test(filePath)) boosted -= 10;
  }
  if (topicProfile) {
    boosted += scoreHelixAskTopicPath(filePath, topicProfile);
  }
  return boosted;
}

function scoreAskNodeLexical(
  node: { symbol?: string; filePath?: string; signature?: string; doc?: string; snippet?: string },
  tokens: string[],
  question: string,
  topicProfile?: HelixAskTopicProfile | null,
): number {
  const symbol = node.symbol ?? "";
  const filePath = node.filePath ?? "";
  if (!filePath) return 0;
  const signature = node.signature ?? "";
  const doc = node.doc ?? "";
  const snippet = node.snippet ?? "";
  let score = 0;
  for (const token of tokens) {
    if (symbol.toLowerCase().includes(token)) score += 6;
    if (filePath.toLowerCase().includes(token)) score += 5;
    if (signature.toLowerCase().includes(token)) score += 3;
    if (doc.toLowerCase().includes(token)) score += 1.5;
    if (snippet.toLowerCase().includes(token)) score += 1;
  }
  return applyAskNodeBoosts(score, filePath, question, topicProfile);
}

function scoreAskNodeSymbol(
  node: { symbol?: string; filePath?: string; signature?: string },
  tokens: string[],
  question: string,
  topicProfile?: HelixAskTopicProfile | null,
): number {
  const symbol = node.symbol ?? "";
  const filePath = node.filePath ?? "";
  if (!filePath) return 0;
  const signature = node.signature ?? "";
  let score = 0;
  for (const token of tokens) {
    if (symbol.toLowerCase().includes(token)) score += 7;
    if (signature.toLowerCase().includes(token)) score += 4;
    if (filePath.toLowerCase().includes(token)) score += 1.5;
  }
  return applyAskNodeBoosts(score, filePath, question, topicProfile);
}

function buildTrigramSet(value: string): Set<string> {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!normalized) return new Set();
  if (normalized.length < 3) return new Set([normalized]);
  const trigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i += 1) {
    trigrams.add(normalized.slice(i, i + 3));
  }
  return trigrams;
}

function normalizePlanValue(value: string): string {
  return value.trim().replace(/^[-\s]+/, "");
}

const PLAN_SURFACE_ALLOWLIST = new Set(["docs", "ethos", "knowledge", "tests", "code"]);
const PLAN_REPO_PATH_PREFIXES = [
  "docs/",
  "server/",
  "client/",
  "modules/",
  "shared/",
  "apps/",
  "tools/",
  "scripts/",
  "cli/",
  "packages/",
  "warp-web/",
  ".github/",
];

function normalizePlanDirectiveEntry(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "").replace(/\\/g, "/");
}

function stripLeadingGlob(value: string): string {
  return value.replace(/^(\*\*\/|\*\/)+/g, "");
}

function looksLikeRepoPath(value: string): boolean {
  const normalized = normalizePlanDirectiveEntry(value);
  if (!normalized) return false;
  let trimmed = normalized.replace(/^\.\/+/, "");
  trimmed = stripLeadingGlob(trimmed);
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (PLAN_REPO_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true;
  if (/\.[a-z0-9]{1,6}$/i.test(lower) && lower.includes("/")) return true;
  return false;
}

function parsePlanList(value: string): string[] {
  return value
    .split(/[,\|]/)
    .map((entry) => normalizePlanValue(entry))
    .filter(Boolean);
}

function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");
  return new RegExp(pattern, "i");
}

function surfaceToRegexes(surface: string): RegExp[] {
  const normalized = surface.toLowerCase();
  if (normalized === "docs") return [/^docs\//i];
  if (normalized === "ethos") return [/^docs\/ethos\//i];
  if (normalized === "knowledge") return [/^docs\/knowledge\//i];
  if (normalized === "tests") return [/^tests\//i];
  if (normalized === "code")
    return [/^(server|client|shared|modules|apps|tools|scripts|cli|packages)\//i];
  if (normalized.includes("*") || normalized.includes("/")) {
    return [globToRegex(normalized)];
  }
  return [new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")];
}

function buildPlanSurfaceRegexes(surfaces: string[]): RegExp[] {
  const regexes: RegExp[] = [];
  for (const surface of surfaces) {
    regexes.push(...surfaceToRegexes(surface));
  }
  return regexes;
}

function parsePlanDirectives(text: string): { directives: HelixAskPlanDirectives; queryHints: string[] } {
  const directives: HelixAskPlanDirectives = {
    preferredSurfaces: [],
    avoidSurfaces: [],
    mustIncludeGlobs: [],
    requiredSlots: [],
  };
  const isInstructionLine = (value: string): boolean => {
    return (
      value.startsWith("return up to") ||
      value.startsWith("output only the block") ||
      value.startsWith("inside the block") ||
      value.startsWith("directive format") ||
      value.startsWith("use one line per query") ||
      value.startsWith("no preamble") ||
      value.startsWith("use these conceptual slots") ||
      value.startsWith("prefer these verification anchors")
    );
  };
  const splitDirectiveValue = (line: string): string => {
    if (line.includes(":")) return line.split(":").slice(1).join(":");
    if (line.includes("=")) return line.split("=").slice(1).join("=");
    return "";
  };
  const hintLines: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let inPlan = false;
  let inQueries = false;
  let sawMarkers = false;
  for (const rawLine of lines) {
    const cleaned = normalizePlanValue(rawLine);
    const normalized = cleaned.toLowerCase();
    if (!normalized) continue;
    if (normalized.includes("plan_start")) {
      inPlan = true;
      inQueries = false;
      sawMarkers = true;
      continue;
    }
    if (normalized.includes("plan_end")) {
      break;
    }
    if (!sawMarkers) {
      inPlan = true;
    }
    if (!inPlan) continue;
    if (normalized.includes("queries_start")) {
      inQueries = true;
      continue;
    }
    if (isInstructionLine(normalized)) continue;
    if (
      normalized.startsWith("preferred_surfaces") ||
      normalized.startsWith("preferred")
    ) {
      const entries = parsePlanList(splitDirectiveValue(cleaned))
        .map(normalizePlanDirectiveEntry)
        .filter(Boolean);
      for (const entry of entries) {
        const lower = entry.toLowerCase();
        if (PLAN_SURFACE_ALLOWLIST.has(lower)) {
          directives.preferredSurfaces.push(lower);
        } else if (looksLikeRepoPath(entry)) {
          hintLines.push(entry);
        }
      }
      continue;
    }
    if (normalized.startsWith("avoid_surfaces") || normalized.startsWith("avoid")) {
      const entries = parsePlanList(splitDirectiveValue(cleaned))
        .map(normalizePlanDirectiveEntry)
        .filter(Boolean);
      for (const entry of entries) {
        const lower = entry.toLowerCase();
        if (PLAN_SURFACE_ALLOWLIST.has(lower)) {
          directives.avoidSurfaces.push(lower);
        }
      }
      continue;
    }
    if (
      normalized.startsWith("must_include_globs") ||
      normalized.startsWith("must_include") ||
      normalized.startsWith("must_include_paths")
    ) {
      const entries = parsePlanList(splitDirectiveValue(cleaned))
        .map(normalizePlanDirectiveEntry)
        .filter(Boolean);
      for (const entry of entries) {
        if (looksLikeRepoPath(entry)) {
          directives.mustIncludeGlobs.push(entry);
        } else {
          hintLines.push(entry);
        }
      }
      continue;
    }
    if (normalized.startsWith("required_slots") || normalized.startsWith("slots")) {
      directives.requiredSlots.push(...parsePlanList(splitDirectiveValue(cleaned)));
      continue;
    }
    if (normalized.startsWith("clarify")) {
      const clarify = normalizePlanValue(splitDirectiveValue(cleaned));
      if (clarify) directives.clarifyQuestion = clarify;
      continue;
    }
    if (!inQueries && normalized.startsWith("queries")) {
      continue;
    }
    if (inQueries || !sawMarkers) {
      hintLines.push(cleaned);
    }
  }
  const queryHints = parseQueryHints(hintLines.join("\n"), HELIX_ASK_QUERY_HINTS_MAX);
  directives.preferredSurfaces = Array.from(new Set(directives.preferredSurfaces));
  directives.avoidSurfaces = Array.from(new Set(directives.avoidSurfaces));
  directives.mustIncludeGlobs = Array.from(new Set(directives.mustIncludeGlobs));
  directives.requiredSlots = Array.from(new Set(directives.requiredSlots));
  return { directives, queryHints };
}

function buildPlanScope({
  directives,
  topicTags,
  requiresRepoEvidence,
  repoExpectationLevel,
  question,
}: {
  directives?: HelixAskPlanDirectives | null;
  topicTags: HelixAskTopicTag[];
  requiresRepoEvidence: boolean;
  repoExpectationLevel: "low" | "medium" | "high";
  question: string;
}): HelixAskPlanScope {
  const scope: HelixAskPlanScope = {};
  const preferredSurfaces = new Set<string>(directives?.preferredSurfaces ?? []);
  const mustIncludeGlobs = new Set<string>(directives?.mustIncludeGlobs ?? []);
  const avoidSurfaces = new Set<string>(directives?.avoidSurfaces ?? []);
  const wantsDocsFirst =
    HELIX_ASK_CONCEPTUAL_FOCUS.test(question) &&
    topicTags.some((tag) => tag === "warp" || tag === "concepts");
  const docsFirst =
    repoExpectationLevel !== "low" &&
    (wantsDocsFirst || topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star"));
  if (docsFirst) {
    preferredSurfaces.add("docs");
    preferredSurfaces.add("knowledge");
    if (topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star")) {
      preferredSurfaces.add("ethos");
    }
  }
  const preferredRegexes = buildPlanSurfaceRegexes(Array.from(preferredSurfaces));
  const avoidRegexes = buildPlanSurfaceRegexes(Array.from(avoidSurfaces));
  const mustRegexes = Array.from(mustIncludeGlobs).map((glob) =>
    glob.includes("*") || glob.includes("/") ? globToRegex(glob) : globToRegex(`**/${glob}/**`),
  );
  const allowlistTiers: RegExp[][] = [];
  if (preferredRegexes.length) {
    allowlistTiers.push(preferredRegexes);
  }
  if (mustRegexes.length) {
    allowlistTiers.push(mustRegexes);
  }
  if (allowlistTiers.length) {
    scope.allowlistTiers = allowlistTiers;
  }
  if (avoidRegexes.length) {
    scope.avoidlist = avoidRegexes;
  }
  if (mustRegexes.length) {
    scope.mustIncludeGlobs = mustRegexes;
  }
  if (docsFirst) {
    const docsSurfaces = ["docs", "knowledge"];
    if (topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star")) {
      docsSurfaces.push("ethos");
    }
    const docsRegexes = buildPlanSurfaceRegexes(docsSurfaces);
    const docsAllowlist: RegExp[][] = [];
    if (docsRegexes.length) docsAllowlist.push(docsRegexes);
    if (mustRegexes.length) docsAllowlist.push(mustRegexes);
    scope.docsFirst = true;
    scope.docsAllowlist = docsAllowlist.length ? docsAllowlist : undefined;
  }
  return scope;
}

function normalizeSlotName(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function evaluateSlotCoverage({
  contextText,
  requiredSlots,
  conceptMatch,
}: {
  contextText: string;
  requiredSlots: string[];
  conceptMatch: HelixAskConceptMatch | null;
}): { required: string[]; covered: string[]; missing: string[]; ratio: number } {
  const normalized = contextText.toLowerCase();
  const filePaths = extractFilePathsFromText(contextText);
  const required = requiredSlots.map(normalizeSlotName).filter(Boolean);
  const covered: string[] = [];
  const label = conceptMatch?.card.label?.toLowerCase() ?? "";
  for (const slot of required) {
    let ok = false;
    if (slot === "definition") {
      ok = /definition\b|defined as\b|what is\b/.test(normalized);
      if (!ok && label) ok = normalized.includes(label);
    } else if (slot === "repo_mapping") {
      ok = filePaths.length > 0;
    } else if (slot === "verification") {
      ok = /verification|verify|gate|constraint|certificate|integrity_ok|test\b/.test(normalized);
    } else if (slot === "failure_path") {
      ok = /fail|failure|reject|clarify|not certified|missing\b/.test(normalized);
    } else if (slot === "flow" || slot === "pipeline") {
      ok = /pipeline|stage|flow|step\b/.test(normalized);
    } else {
      ok = normalized.includes(slot.replace(/_/g, " "));
    }
    if (ok) covered.push(slot);
  }
  const missing = required.filter((slot) => !covered.includes(slot));
  const ratio = required.length ? covered.length / required.length : 1;
  return { required, covered, missing, ratio };
}

function trigramSimilarity(a: string, b: string): number {
  const aSet = buildTrigramSet(a);
  const bSet = buildTrigramSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let intersect = 0;
  for (const trigram of aSet) {
    if (bSet.has(trigram)) intersect += 1;
  }
  const union = aSet.size + bSet.size - intersect;
  return union > 0 ? intersect / union : 0;
}

function scoreAskNodeFuzzy(
  node: { symbol?: string; filePath?: string; signature?: string },
  query: string,
  question: string,
  topicProfile?: HelixAskTopicProfile | null,
): number {
  const filePath = node.filePath ?? "";
  if (!filePath) return 0;
  const queryLower = query.toLowerCase();
  const symbol = node.symbol ?? "";
  const signature = node.signature ?? "";
  const candidates = [filePath, symbol, signature].filter(Boolean);
  let best = 0;
  for (const candidate of candidates) {
    best = Math.max(best, trigramSimilarity(queryLower, candidate));
  }
  if (best < 0.25) return 0;
  let score = best * 8;
  if (filePath.toLowerCase().includes(queryLower)) score += 4;
  return applyAskNodeBoosts(score, filePath, question, topicProfile);
}

function upsertAskCandidate(
  byPath: Map<string, AskCandidate>,
  node: { symbol?: string; filePath?: string; signature?: string; doc?: string; snippet?: string },
  score: number,
): void {
  const filePath = node.filePath ?? "";
  if (!filePath) return;
  const preview = formatAskPreview({
    doc: node.doc ?? "",
    snippet: node.snippet ?? "",
    score,
    filePath,
    symbol: node.symbol ?? "",
  });
  const existing = byPath.get(filePath);
  if (!existing || score > existing.score) {
    byPath.set(filePath, { filePath, preview, score, rrfScore: 0 });
  }
}

function looksLikePathHint(value: string): boolean {
  const normalized = value.trim().replace(/^[\-\s]+/, "");
  if (!normalized) return false;
  if (normalized.includes("/") || normalized.includes("\\")) {
    return /\.(md|json|ya?ml|ts|tsx|js|jsx|mjs|cjs)$/i.test(normalized);
  }
  return false;
}

function collectPathCandidatesForQuery(
  query: string,
  question: string,
  options?: { allowlist?: RegExp[]; avoidlist?: RegExp[]; topicProfile?: HelixAskTopicProfile | null },
): AskCandidate[] {
  const allowlist = options?.allowlist ?? [];
  const avoidlist = options?.avoidlist ?? [];
  const pathHints = extractFilePathsFromText(query);
  if (!pathHints.length && looksLikePathHint(query)) {
    pathHints.push(query.trim());
  }
  const candidates: AskCandidate[] = [];
  for (const hint of pathHints) {
    const normalized = hint.replace(/\\/g, "/");
    if (allowlist.length > 0 && !pathMatchesAny(normalized, allowlist)) continue;
    if (avoidlist.length > 0 && pathMatchesAny(normalized, avoidlist)) continue;
    const fullPath = path.resolve(process.cwd(), normalized);
    if (!fs.existsSync(fullPath)) continue;
    let raw = "";
    try {
      raw = fs.readFileSync(fullPath, "utf8");
    } catch {
      continue;
    }
    const preview = clipAskText(raw, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    const baseScore = 40;
    const score = applyAskNodeBoosts(baseScore, normalized, question, options?.topicProfile);
    candidates.push({
      filePath: normalized,
      preview: formatAskPreview({
        doc: preview,
        snippet: "",
        score,
        filePath: normalized,
        symbol: "path",
      }),
      score,
      rrfScore: 0,
    });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function collectDocsGrepCandidates(
  queries: string[],
  question: string,
  options?: { allowlist?: RegExp[]; avoidlist?: RegExp[]; limit?: number },
): AskCandidate[] {
  const allowlist = options?.allowlist ?? [];
  const avoidlist = options?.avoidlist ?? [];
  const tokens = new Set<string>();
  const phrases: string[] = [];
  for (const query of queries) {
    const cleaned = query.trim();
    if (!cleaned) continue;
    if (extractFilePathsFromText(cleaned).length > 0) continue;
    const normalized = cleaned.toLowerCase();
    if (normalized.length <= 120) phrases.push(normalized);
    tokenizeAskQuery(cleaned).forEach((token) => tokens.add(token));
  }
  if (tokens.size === 0 && phrases.length === 0) return [];
  const docsRoots = ["docs/ethos", "docs/knowledge", "docs"];
  const files: string[] = [];
  const seen = new Set<string>();
  const maxFiles = options?.limit ?? 200;
  const walk = (dir: string): void => {
    if (files.length >= maxFiles) return;
    if (!fs.existsSync(dir)) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const nextPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        walk(nextPath);
        continue;
      }
      if (!/\.(md|json|ya?ml|txt)$/i.test(entry.name)) continue;
      const normalized = path.relative(process.cwd(), nextPath).replace(/\\/g, "/");
      if (seen.has(normalized)) continue;
      if (allowlist.length > 0 && !pathMatchesAny(normalized, allowlist)) continue;
      if (avoidlist.length > 0 && pathMatchesAny(normalized, avoidlist)) continue;
      seen.add(normalized);
      files.push(normalized);
    }
  };
  docsRoots.forEach((root) => walk(path.resolve(process.cwd(), root)));
  const candidates: AskCandidate[] = [];
  for (const filePath of files) {
    let raw = "";
    try {
      raw = fs.readFileSync(path.resolve(process.cwd(), filePath), "utf8");
    } catch {
      continue;
    }
    const lower = raw.toLowerCase();
    let score = 0;
    for (const phrase of phrases) {
      if (phrase.length > 3 && lower.includes(phrase)) score += 6;
    }
    for (const token of tokens) {
      if (token.length > 2 && lower.includes(token)) score += 2;
    }
    if (score <= 0) continue;
    const preview = clipAskText(raw, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    const boosted = applyAskNodeBoosts(score + 8, filePath, question, null);
    candidates.push({
      filePath,
      preview: formatAskPreview({
        doc: preview,
        snippet: "",
        score: boosted,
        filePath,
        symbol: "grep",
      }),
      score: boosted,
      rrfScore: 0,
    });
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, 12);
}

function collectAskCandidatesMultiChannel(
  snapshot: { nodes: Array<{ symbol?: string; filePath?: string; signature?: string; doc?: string; snippet?: string }> },
  query: string,
  question: string,
  options?: { topicProfile?: HelixAskTopicProfile | null; allowlist?: RegExp[]; avoidlist?: RegExp[] },
): { lists: AskCandidateChannelList[]; queryHit: boolean } {
  const tokens = tokenizeAskQuery(query);
  if (!tokens.length) return { lists: [], queryHit: false };
  const allowlist = options?.allowlist ?? [];
  const avoidlist = options?.avoidlist ?? [];
  const byPathLexical = new Map<string, AskCandidate>();
  const byPathSymbol = new Map<string, AskCandidate>();
  const byPathFuzzy = new Map<string, AskCandidate>();
  for (const node of snapshot.nodes) {
    const filePath = node.filePath ?? "";
    if (!filePath) continue;
    if (allowlist.length > 0 && !pathMatchesAny(filePath, allowlist)) continue;
    if (avoidlist.length > 0 && pathMatchesAny(filePath, avoidlist)) continue;
    const lexicalScore = scoreAskNodeLexical(node, tokens, question, options?.topicProfile);
    if (lexicalScore > 0) upsertAskCandidate(byPathLexical, node, lexicalScore);
    const symbolScore = scoreAskNodeSymbol(node, tokens, question, options?.topicProfile);
    if (symbolScore > 0) upsertAskCandidate(byPathSymbol, node, symbolScore);
    const fuzzyScore = scoreAskNodeFuzzy(node, query, question, options?.topicProfile);
    if (fuzzyScore > 0) upsertAskCandidate(byPathFuzzy, node, fuzzyScore);
  }
  const lexical = Array.from(byPathLexical.values()).sort((a, b) => b.score - a.score);
  const symbol = Array.from(byPathSymbol.values()).sort((a, b) => b.score - a.score);
  const fuzzy = Array.from(byPathFuzzy.values()).sort((a, b) => b.score - a.score);
  const lists: AskCandidateChannelList[] = [];
  if (lexical.length) lists.push({ channel: "lexical", candidates: lexical });
  if (symbol.length) lists.push({ channel: "symbol", candidates: symbol });
  if (fuzzy.length) lists.push({ channel: "fuzzy", candidates: fuzzy });
  const pathCandidates = collectPathCandidatesForQuery(query, question, {
    allowlist,
    avoidlist,
    topicProfile: options?.topicProfile,
  });
  if (pathCandidates.length) lists.push({ channel: "path", candidates: pathCandidates });
  const queryHit = lists.some((entry) => entry.candidates.length > 0);
  return { lists, queryHit };
}

function mergeCandidatesWithWeightedRrf(
  candidateLists: AskCandidateChannelList[],
  rrfK: number,
  channelWeights: AskCandidateChannelStats,
): AskCandidate[] {
  const merged = new Map<string, AskCandidate>();
  candidateLists.forEach(({ channel, candidates }) => {
    const weight = channelWeights[channel] ?? 1;
    candidates.forEach((candidate, index) => {
      const existing = merged.get(candidate.filePath);
      const bump = weight / (rrfK + index + 1);
      if (!existing) {
        merged.set(candidate.filePath, {
          ...candidate,
          rrfScore: bump,
        });
        return;
      }
      if (candidate.score > existing.score) {
        existing.score = candidate.score;
        existing.preview = candidate.preview;
      }
      existing.rrfScore += bump;
    });
  });
  return Array.from(merged.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}

function pathSimilarity(a: string, b: string): number {
  const aParts = a.toLowerCase().split(/[\\/]+/).filter(Boolean);
  const bParts = b.toLowerCase().split(/[\\/]+/).filter(Boolean);
  if (!aParts.length || !bParts.length) return 0;
  const aSet = new Set(aParts);
  const bSet = new Set(bParts);
  let intersect = 0;
  for (const part of aSet) {
    if (bSet.has(part)) intersect += 1;
  }
  const union = aSet.size + bSet.size - intersect;
  return union > 0 ? intersect / union : 0;
}

function selectCandidatesWithMmr(candidates: AskCandidate[], limit: number, lambda: number): AskCandidate[] {
  if (candidates.length <= 1) return candidates.slice(0, limit);
  const remaining = candidates.slice();
  const selected: AskCandidate[] = [];
  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const relevance = candidate.rrfScore;
      let diversity = 0;
      for (const picked of selected) {
        diversity = Math.max(diversity, pathSimilarity(candidate.filePath, picked.filePath));
      }
      const mmrScore = lambda * relevance - (1 - lambda) * diversity;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return selected;
}

function buildMustIncludeCandidates(
  topicProfile: HelixAskTopicProfile | null | undefined,
  question: string,
): AskCandidate[] {
  const mustIncludeFiles = topicProfile?.mustIncludeFiles ?? [];
  if (!topicProfile || mustIncludeFiles.length === 0) return [];
  const tokens = tokenizeAskQuery(question);
  const candidates: AskCandidate[] = [];
  for (const relativePath of mustIncludeFiles) {
    const filePath = relativePath.replace(/\\/g, "/");
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) continue;
    let raw = "";
    try {
      raw = fs.readFileSync(fullPath, "utf8");
    } catch {
      continue;
    }
    const preview = clipAskText(raw, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    const baseScore = Math.max(1, scoreHelixAskTopicPath(filePath, topicProfile));
    const tokenScore = tokens.length
      ? tokens.reduce((acc, token) => (filePath.toLowerCase().includes(token) ? acc + 2 : acc), 0)
      : 0;
    const score = baseScore + tokenScore + 25;
    candidates.push({
      filePath,
      preview: formatAskPreview({
        doc: preview,
        snippet: "",
        score,
        filePath,
        symbol: "must-include",
      }),
      score,
      rrfScore: score,
    });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function injectMustIncludeCandidates(
  selected: AskCandidate[],
  mustInclude: AskCandidate[],
  topicProfile: HelixAskTopicProfile | null | undefined,
  limit: number,
): { selected: AskCandidate[]; mustIncludeOk: boolean } {
  if (!topicProfile || mustInclude.length === 0) {
    const files = selected.map((entry) => entry.filePath);
    return { selected, mustIncludeOk: topicMustIncludeSatisfied(files, topicProfile) };
  }
  const mustIncludeSet = new Set(mustInclude.map((entry) => entry.filePath));
  const byPath = new Map<string, AskCandidate>();
  for (const entry of selected) {
    byPath.set(entry.filePath, entry);
  }
  for (const entry of mustInclude) {
    const existing = byPath.get(entry.filePath);
    if (!existing || entry.score > existing.score) {
      byPath.set(entry.filePath, entry);
    }
  }
  const merged = Array.from(byPath.values()).sort((a, b) => {
    const aMust = mustIncludeSet.has(a.filePath) ? 1 : 0;
    const bMust = mustIncludeSet.has(b.filePath) ? 1 : 0;
    if (aMust !== bMust) return bMust - aMust;
    return b.score - a.score;
  });
  let trimmed = merged;
  if (merged.length > limit) {
    const required = merged.filter((entry) => mustIncludeSet.has(entry.filePath));
    const slots = Math.max(0, limit - required.length);
    const optional = merged
      .filter((entry) => !mustIncludeSet.has(entry.filePath))
      .sort((a, b) => b.score - a.score)
      .slice(0, slots);
    trimmed = [...required, ...optional];
  }
  const files = trimmed.map((entry) => entry.filePath);
  const mustIncludeOk = topicMustIncludeSatisfied(files, topicProfile);
  return { selected: trimmed, mustIncludeOk };
}

async function buildAskContextFromQueries(
  question: string,
  queries: string[],
  topK?: number,
  topicProfile?: HelixAskTopicProfile | null,
  options?: { allowlistTiers?: RegExp[][]; avoidlist?: RegExp[]; overrideAllowlist?: boolean },
): Promise<{
  context: string;
  files: string[];
  topicTier?: number;
  topicMustIncludeOk?: boolean;
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  channelHits?: AskCandidateChannelStats;
  channelTopScores?: AskCandidateChannelStats;
}> {
  const snapshot = await loadCodeLattice();
  if (!snapshot) return { context: "", files: [] };
  const cleanQueries = queries.filter(Boolean);
  if (!cleanQueries.length) return { context: "", files: [] };
  const limit = clampNumber(topK ?? HELIX_ASK_CONTEXT_FILES, 1, HELIX_ASK_CONTEXT_FILES);
  const perQueryLimit = Math.max(6, Math.ceil(limit / Math.max(1, cleanQueries.length)));
  const candidatePool = Math.max(limit * 3, perQueryLimit * 2, 12);
  const baseAllowlistTiers =
    topicProfile?.allowlistTiers?.length ? topicProfile.allowlistTiers : [[]];
  const allowlistTiers =
    options?.allowlistTiers?.length && options.overrideAllowlist
      ? options.allowlistTiers
      : options?.allowlistTiers?.length
        ? [...options.allowlistTiers, ...baseAllowlistTiers]
        : baseAllowlistTiers;
  const minTierCandidates =
    topicProfile && topicProfile.minTierCandidates > 0
      ? Math.min(limit, topicProfile.minTierCandidates)
      : 1;
  let selected: AskCandidate[] = [];
  let topicTier = 0;
  let topicMustIncludeOk = true;
  let queryHitCount = 0;
  let topScore = 0;
  let scoreGap = 0;
  let channelHits = initAskChannelStats();
  let channelTopScores = initAskChannelStats();

  for (let tierIndex = 0; tierIndex < allowlistTiers.length; tierIndex += 1) {
    const allowlist = allowlistTiers[tierIndex] ?? [];
    const candidateLists: AskCandidateChannelList[] = [];
    queryHitCount = 0;
    channelHits = initAskChannelStats();
    channelTopScores = initAskChannelStats();
    for (const query of cleanQueries) {
      const multi = collectAskCandidatesMultiChannel(snapshot, query, question, {
        topicProfile,
        allowlist,
        avoidlist: options?.avoidlist,
      });
      if (multi.queryHit) queryHitCount += 1;
      for (const entry of multi.lists) {
        const candidates = entry.candidates.slice(0, candidatePool);
        candidateLists.push({ channel: entry.channel, candidates });
        if (candidates.length) {
          channelHits[entry.channel] += 1;
          channelTopScores[entry.channel] = Math.max(channelTopScores[entry.channel], candidates[0].score);
        }
      }
    }
    const merged = mergeCandidatesWithWeightedRrf(candidateLists, HELIX_ASK_RRF_K, HELIX_ASK_RRF_CHANNEL_WEIGHTS);
    topScore = merged.length ? merged[0].rrfScore : 0;
    scoreGap =
      merged.length >= 2 ? Math.max(0, merged[0].rrfScore - merged[1].rrfScore) : topScore;
    const tierSelected = selectCandidatesWithMmr(merged, limit, HELIX_ASK_MMR_LAMBDA);
    if (!tierSelected.length) continue;
    const files = tierSelected.map((entry) => entry.filePath);
    let mustIncludeOk = topicMustIncludeSatisfied(files, topicProfile);
    let tierFinal = tierSelected;
    if (!mustIncludeOk && topicProfile?.mustIncludeFiles?.length) {
      const mustIncludeCandidates = buildMustIncludeCandidates(topicProfile, question);
      if (mustIncludeCandidates.length > 0) {
        const injected = injectMustIncludeCandidates(
          tierSelected,
          mustIncludeCandidates,
          topicProfile,
          limit,
        );
        tierFinal = injected.selected;
        mustIncludeOk = injected.mustIncludeOk;
      }
    }
    selected = tierFinal;
    topicTier = tierIndex + 1;
    topicMustIncludeOk = mustIncludeOk;
    if (tierFinal.length >= minTierCandidates && mustIncludeOk) {
      break;
    }
    if (tierIndex === allowlistTiers.length - 1) {
      break;
    }
  }
  return finalizeAskContext({
    selected,
    topicTier: topicTier || undefined,
    topicMustIncludeOk,
    queryHitCount,
    topScore,
    scoreGap,
    channelHits,
    channelTopScores,
  });
}

function finalizeAskContext({
  selected,
  topicTier,
  topicMustIncludeOk,
  queryHitCount,
  topScore,
  scoreGap,
  channelHits,
  channelTopScores,
}: {
  selected: AskCandidate[];
  topicTier?: number;
  topicMustIncludeOk?: boolean;
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  channelHits?: AskCandidateChannelStats;
  channelTopScores?: AskCandidateChannelStats;
}): {
  context: string;
  files: string[];
  topicTier?: number;
  topicMustIncludeOk?: boolean;
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  channelHits?: AskCandidateChannelStats;
  channelTopScores?: AskCandidateChannelStats;
} {
  const lines: string[] = [];
  const files: string[] = [];
  for (const entry of selected) {
    const preview = clipAskText(entry.preview, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    lines.push(`${entry.filePath}\n${preview}`);
    files.push(entry.filePath);
  }
  return {
    context: lines.join("\n\n"),
    files,
    topicTier,
    topicMustIncludeOk,
    queryHitCount,
    topScore,
    scoreGap,
    channelHits,
    channelTopScores,
  };
}

function formatAskPreview({
  doc,
  snippet,
  score,
  filePath,
  symbol,
}: {
  doc?: string;
  snippet?: string;
  score: number;
  filePath: string;
  symbol: string;
}): string {
  const parts: string[] = [];
  if (doc) parts.push(clipAskText(doc, 400));
  if (snippet) parts.push(clipAskText(snippet, 320));
  parts.push(`score=${score.toFixed(3)} | symbol=${symbol} | file=${filePath}`);
  return parts.join("\n");
}

async function buildAskContext(
  question: string,
  searchQuery?: string,
  topK?: number,
  topicProfile?: HelixAskTopicProfile | null,
): Promise<string> {
  const topicTags = topicProfile?.tags ?? [];
  const queries = buildHelixAskSearchQueries(searchQuery ?? question, topicTags);
  if (!queries.length) return "";
  const result = await buildAskContextFromQueries(question, queries, topK, topicProfile);
  return result.context;
}

function buildGroundedAskPrompt(
  question: string,
  context: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
    "Use only the evidence in the context below. Cite file paths when referencing code.",
    "If the context is insufficient, say what is missing and ask a concise follow-up.",
    "When the context includes solver or calculation functions, summarize the inputs, outputs, and flow before UI details.",
  ];
  if (format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 6-9 steps and no preamble.");
    lines.push("Each step should be 2-3 sentences and grounded in repo details; cite file paths when relevant.");
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (2-3 sentences).");
  } else if (format === "compare") {
    lines.push("Answer in 2-3 short paragraphs; do not use numbered steps.");
    lines.push("If the question is comparative, include a short bullet list (3-5 items) of concrete differences grounded in repo details.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (2-3 sentences).");
  } else {
    lines.push("Answer in 2-3 short paragraphs; do not use numbered steps unless explicitly requested.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (2-3 sentences).");
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push("Do not include the words \"Question:\" or \"Context sources\".");
  lines.push("Keep paragraphs short (2-3 sentences) and separate sections with blank lines.");
  lines.push("Do not repeat the question or include headings like Question or Context.");
  lines.push("Do not output tool logs, certificates, command transcripts, or repeat the prompt/context.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Context:");
  lines.push(context || "No repo context was attached to this request.");
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function buildGeneralAskPrompt(
  question: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask.",
    "Answer using general knowledge; do not cite file paths or repo details.",
  ];
  if (format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences.");
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else if (format === "compare") {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps.");
    lines.push("If the question is comparative, include a short bullet list (2-4 items) of concrete differences.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  }
  lines.push("Avoid repetition; do not repeat the question.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function extractQuestionFromPrompt(prompt: string): string {
  const match = prompt.match(/(?:^|\n)Question:\s*([^\n]+)/i);
  return match?.[1]?.trim() ?? "";
}

function extractContextFromPrompt(prompt: string): string {
  const marker = "\nContext:\n";
  const start = prompt.indexOf(marker);
  if (start < 0) return "";
  const after = prompt.slice(start + marker.length);
  const end = after.lastIndexOf("\nFINAL:");
  const context = end >= 0 ? after.slice(0, end) : after;
  return context.trim();
}

const SCAFFOLD_JUNK_LINE_RE = [
  /^",?\s*no headings\./i,
  /^general reasoning\s*:/i,
  /^repo evidence\s*:/i,
  /^evidence\s*:/i,
  /^ts[x]?[`.)\s]/i,
  /^(md|json|html)[`.)\s]/i,
];

function normalizeScaffoldText(value: string): string {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(error:|srv\s+send_error)/i.test(line))
    .filter((line) => !/request\s*\(\d+\s+tokens\)\s+exceeds/i.test(line))
    .filter((line) => !SCAFFOLD_JUNK_LINE_RE.some((re) => re.test(line)));
  if (!lines.length) return "";
  const listed = lines.filter((line) => /^(\d+\.\s+|[-*]\s+)/.test(line));
  const trimmed = (listed.length ? listed : lines).slice(0, 12);
  return trimmed.join("\n");
}

function resolveEvidencePaths(
  evidence: string,
  contextFiles: string[],
  contextText?: string,
  limit = 6,
): string[] {
  const evidencePaths = extractFilePathsFromText(evidence);
  if (evidencePaths.length > 0) {
    return Array.from(new Set(evidencePaths)).slice(0, limit);
  }
  const contextPaths = [
    ...contextFiles.filter(Boolean),
    ...(contextText ? extractFilePathsFromText(contextText) : []),
  ];
  if (contextPaths.length === 0) return [];
  return Array.from(new Set(contextPaths)).slice(0, limit);
}

function appendEvidenceSources(
  evidence: string,
  contextFiles: string[],
  limit = 6,
  contextText?: string,
): string {
  const trimmed = evidence?.trim() ?? "";
  if (extractFilePathsFromText(trimmed).length > 0) return evidence;
  const sources = resolveEvidencePaths(trimmed, contextFiles, contextText, limit);
  if (sources.length === 0) return evidence;
  if (!trimmed) {
    return `Sources: ${sources.join(", ")}`;
  }
  return `${trimmed}\n\nSources: ${sources.join(", ")}`;
}

function buildHelixAskScaffoldPrompt(
  question: string,
  context: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask evidence distiller.",
    "Use only the evidence in the context below. Do not speculate.",
  ];
  if (format === "steps") {
    lines.push("Return a numbered list (6-9 items) of the concrete steps the system actually performs.");
    if (stageTags) {
      lines.push(
        "Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).",
      );
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Each step must cite at least one file path from the context in parentheses.");
  } else {
    lines.push("Return 6-9 short evidence bullets (not steps) grounded in the context.");
    lines.push("Each bullet must cite at least one file path from the context in parentheses.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
  }
  lines.push("No preamble, no question restatement, no \"FINAL:\", no headings.");
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Context:");
  lines.push(context || "No repo context was attached to this request.");
  lines.push("");
  return lines.join("\n");
}

function buildHelixAskEvidencePrompt(
  question: string,
  context: string,
  format: HelixAskFormat,
  stageTags: boolean,
  composite = false,
  anchorHints: string[] = [],
): string {
  const lines = [
    "You are Helix Ask evidence distiller.",
    "Use only the evidence in the context below. Do not speculate.",
  ];
  if (anchorHints.length) {
    lines.push("Prefer evidence from these verification anchors when present in context:");
    lines.push(...anchorHints.map((entry) => `- ${entry}`));
    lines.push("At least one bullet must cite a verification anchor if available.");
    lines.push("Avoid UI-only files unless the question explicitly asks about UI.");
  }
  if (format === "steps") {
    lines.push("Return a numbered list (6-9 items) of evidence steps the system actually performs.");
    if (stageTags) {
      lines.push(
        "Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).",
      );
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Each step should be 1-2 sentences and cite at least one file path or prompt chunk id from the context.");
  } else {
    const count = composite ? "4-6" : "6-9";
    lines.push(`Return ${count} short evidence bullets grounded in the context.`);
    lines.push("Each bullet should be 1-2 sentences and cite at least one file path or prompt chunk id from the context.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    if (composite) {
      lines.push("Prefer evidence from domain docs (ethos/knowledge) and core GR viability files over UI or prompt infrastructure.");
      lines.push("Do not mention 'anchors' or list files without tying them to the question.");
    }
  }
  lines.push("No preamble, no question restatement, no \"FINAL:\", no headings.");
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Context:");
  lines.push(context || "No repo context was attached to this request.");
  lines.push("");
  return lines.join("\n");
}

function buildHelixAskPromptEvidencePrompt(
  question: string,
  context: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask evidence distiller.",
    "Use only the evidence in the prompt context below. Do not speculate.",
  ];
  if (format === "steps") {
    lines.push("Return a numbered list (4-6 items) of concise reasoning steps.");
    if (stageTags) {
      lines.push(
        "Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).",
      );
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Each step should be 1-2 sentences and cite at least one prompt chunk id from the context.");
  } else {
    lines.push("Return 4-6 short evidence bullets grounded in the prompt context.");
    lines.push("Each bullet should be 1-2 sentences and cite at least one prompt chunk id from the context.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
  }
  lines.push("No preamble, no question restatement, no \"FINAL:\", no headings.");
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Prompt context:");
  lines.push(context || "No prompt context was attached to this request.");
  lines.push("");
  return lines.join("\n");
}

function buildGeneralAskEvidencePrompt(
  question: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask evidence distiller.",
    "Use general knowledge only. Do not cite file paths or repo details.",
  ];
  if (format === "steps") {
    lines.push("Return a numbered list (4-6 items) of concise reasoning steps.");
    if (stageTags) {
      lines.push(
        "Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).",
      );
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Each step should be 1-2 sentences.");
  } else {
    lines.push("Return 4-6 short reasoning bullets.");
    lines.push("Each bullet should be 1-2 sentences.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
  }
  lines.push("No preamble, no question restatement, no \"FINAL:\", no headings.");
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  return lines.join("\n");
}

function buildHelixAskSynthesisPrompt(
  question: string,
  scaffold: string,
  format: HelixAskFormat,
  stageTags: boolean,
  softExpansionSentences = 0,
): string {
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  if (format === "steps") {
    lines.push("Use only the evidence steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the evidence steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Start directly with a numbered list using `1.` style; use 6-9 steps and no preamble.");
    lines.push("Each step should be 2-3 sentences and cite file paths or gate/certificate ids from the evidence steps.");
    if (!twoParagraphContract) {
      lines.push("After the steps, add a short paragraph starting with \"In practice,\" (2-3 sentences).");
    }
    lines.push("Evidence steps:");
  } else {
    lines.push("Use only the evidence bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? "Answer in two short paragraphs; do not use numbered steps."
        : "Answer in 2-3 short paragraphs; do not use numbered steps.",
    );
    lines.push(
      "If the question is comparative, include a short bullet list (3-5 items) of concrete differences grounded in repo details.",
    );
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    if (!twoParagraphContract) {
      lines.push("End with a short paragraph starting with \"In practice,\" (2-3 sentences).");
    }
    lines.push("Evidence bullets:");
  }
  if (softExpansionSentences > 0) {
    lines.push(
      `If the evidence is strong, you may add up to ${softExpansionSentences} extra sentences of interpretation that do not introduce new uncited facts.`,
    );
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push("Do not include the words \"Question:\" or \"Context sources\".");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push(scaffold);
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function buildHelixAskPromptSynthesisPrompt(
  question: string,
  scaffold: string,
  format: HelixAskFormat,
  stageTags: boolean,
  softExpansionSentences = 0,
): string {
  const lines = [
    "You are Helix Ask, a grounded assistant.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  if (format === "steps") {
    lines.push("Use only the evidence steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the evidence steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences and cite file paths or prompt chunk ids from the evidence steps.");
    if (!twoParagraphContract) {
      lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
    lines.push("Evidence steps:");
  } else {
    lines.push("Use only the evidence bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? "Answer in two short paragraphs; do not use numbered steps."
        : "Answer in 1-2 short paragraphs; do not use numbered steps.",
    );
    lines.push("If the question is comparative, include a short bullet list (2-4 items) of concrete differences.");
    if (!twoParagraphContract) {
      lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
    lines.push("Evidence bullets:");
  }
  if (softExpansionSentences > 0) {
    lines.push(
      `If the evidence is strong, you may add up to ${softExpansionSentences} extra sentences of interpretation that do not introduce new uncited facts.`,
    );
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push(scaffold);
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function buildHelixAskHybridPrompt(
  question: string,
  generalScaffold: string,
  repoScaffold: string,
  hasRepoEvidence: boolean,
  format: HelixAskFormat,
  stageTags: boolean,
  constraintEvidence?: string,
  composite = false,
): string {
  const lines = [
    "You are Helix Ask, a hybrid assistant.",
    "Use only the general reasoning and repo evidence below. Do not invent citations.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  const hasConstraintEvidence = Boolean(constraintEvidence?.trim());
  if (format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 5-7 steps and no preamble.");
    lines.push("First 1-2 steps define the general concept (no citations).");
    if (hasRepoEvidence) {
      lines.push("Remaining steps map to this system and must cite repo file paths from the repo evidence section.");
    } else {
      lines.push("Since repo evidence is missing, state that and ask for specific files or components (no citations).");
    }
    if (hasConstraintEvidence) {
      lines.push(
        "If constraint evidence is provided, include one step that states gate/certificate status and cite gate/certificate ids or sources.",
      );
    }
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    if (!twoParagraphContract) {
      lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
  } else {
    lines.push(
      twoParagraphContract
        ? "Write two short paragraphs."
        : composite
        ? "Write two paragraphs with 2-3 sentences each (aim for 5-7 sentences total)."
        : "Write two short paragraphs.",
    );
    lines.push("Paragraph 1: general explanation using only the general reasoning bullets (no citations).");
    if (hasRepoEvidence) {
      lines.push("Paragraph 2: map to this system using the repo evidence bullets and include file path citations.");
    } else {
      lines.push("Paragraph 2: state that no repo evidence was found and ask for the specific files to review (no citations).");
    }
    if (hasConstraintEvidence) {
      lines.push(
        "If constraint evidence is provided, add a sentence that states gate/certificate status and cite gate/certificate ids or sources.",
      );
    }
    if (!composite && !twoParagraphContract) {
      lines.push("If the question is comparative, include a short bullet list (2-4 items) after paragraph 2.");
    }
    if (composite) {
      lines.push(
        "Do not mention UI components or Helix Ask implementation details unless the question explicitly asks about the UI.",
      );
      lines.push("Do not start any sentence with a file path; place citations in parentheses at the end.");
      lines.push("Avoid listing file names without explaining their role.");
      lines.push("Do not mention evidence bullets, anchors, or the prompt structure.");
    }
    if (!composite && !twoParagraphContract) {
      lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("General reasoning:");
  lines.push(generalScaffold || "No general reasoning provided.");
  lines.push("");
  lines.push("Repo evidence:");
  lines.push(repoScaffold || "No repo evidence provided.");
  lines.push("");
  lines.push("Constraint evidence:");
  lines.push(constraintEvidence || "No constraint evidence provided.");
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function buildGeneralAskSynthesisPrompt(
  question: string,
  scaffold: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = ["You are Helix Ask."];
  const twoParagraphContract = hasTwoParagraphContract(question);
  if (format === "steps") {
    lines.push("Use only the reasoning steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences.");
    if (!twoParagraphContract) {
      lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
    lines.push("Reasoning steps:");
  } else {
    lines.push("Use only the reasoning bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? "Answer in two short paragraphs; do not use numbered steps."
        : "Answer in 1-2 short paragraphs; do not use numbered steps.",
    );
    lines.push("If the question is comparative, include a short bullet list (2-4 items) of concrete differences.");
    if (!twoParagraphContract) {
      lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
    }
    lines.push("Reasoning bullets:");
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push(scaffold);
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

function buildHelixAskConstraintPrompt(
  question: string,
  evidence: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask, a constraint-grounded assistant.",
    "Use only the evidence below. Do not speculate beyond the gate or certificate data.",
    "Cite gate ids (gate:...) or certificate ids (certificate:...) when referencing residuals or viability.",
  ];
  if (format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences and cite the relevant gate or certificate.");
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Evidence:");
  lines.push(evidence || "No constraint evidence available.");
  lines.push("");
  lines.push(HELIX_ASK_ANSWER_START);
  lines.push(HELIX_ASK_ANSWER_END);
  return lines.join("\n");
}

const resolveEnvelopeMode = (verbosity: HelixAskVerbosity) =>
  verbosity === "normal" ? "standard" : verbosity;

type ConstraintEvidenceResult = {
  evidenceText: string;
  refs: string[];
};

function extractWarpConstraintSummary(evidenceText: string): string | null {
  if (!evidenceText) return null;
  const lines = evidenceText.split(/\r?\n/);
  let gate = "";
  let status = "";
  let certificate = "";
  let integrityOk = "";
  let constraintCount = "";
  let residuals = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("gate:")) {
      gate = trimmed.replace("gate:", "").trim();
    }
    if (trimmed.startsWith("status:")) {
      status = trimmed.replace("status:", "").trim();
    } else if (trimmed.startsWith("certificate:")) {
      certificate = trimmed.replace("certificate:", "").trim();
    } else if (trimmed.startsWith("integrity_ok:")) {
      integrityOk = trimmed.replace("integrity_ok:", "").trim();
    } else if (trimmed.startsWith("constraints:")) {
      constraintCount = trimmed.replace("constraints:", "").trim();
    } else if (trimmed.startsWith("residuals:")) {
      residuals = trimmed.replace("residuals:", "").trim();
    }
  }
  if (!status && !certificate && !gate) return null;
  return [
    gate ? `Gate: gate:${gate}.` : "",
    status ? `Gate status: ${status}.` : "",
    residuals ? `Residuals: ${residuals}.` : "Residuals: not reported in gate evidence.",
    constraintCount ? `Constraints: ${constraintCount}.` : "",
    certificate ? `Certificate: ${certificate}.` : "",
    integrityOk ? `Integrity ok: ${integrityOk}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildWarpViabilityTraceParagraph(question?: string, verbosity: HelixAskVerbosity = "brief"): string {
  const wantsIntegrityDetail = /\bintegrity(_ok)?\b/i.test(question ?? "");
  const parts = [
    "Pipeline state and warp parameters are evaluated by the GR viability gate and constraint policy.",
    "Certificate issuance is handled by the warp viability endpoint and tool bindings.",
    "Warp viability status and certificate metadata are merged into the pipeline state and surfaced to the UI.",
  ];
  if (wantsIntegrityDetail) {
    parts.push(
      "If integrity_ok is false, GR evaluation records the integrity failure and helix-core treats the certificate as NOT_CERTIFIED.",
    );
  }
  if (verbosity === "extended") {
    parts.push(
      "The certificate payload is attached to the pipeline viability snapshot and echoed into training traces for replay.",
    );
  }
  return parts.join(" ");
}

function buildWarpConstraintAnswer(
  evidenceText: string,
  question?: string,
  verbosity: HelixAskVerbosity = "brief",
): string {
  const summary = extractWarpConstraintSummary(evidenceText);
  const pipeline = buildWarpViabilityTraceParagraph(question, verbosity);
  const inPractice =
    "In practice, a FAIL gate status blocks certification and the UI surfaces the non-admissible state along with the certificate metadata.";
  if (verbosity === "extended") {
    const detail = "Failures are surfaced as NOT_CERTIFIED/FAIL statuses in the viability snapshot and any missing or failed constraints are kept with the certificate record.";
    return [summary, pipeline, detail, inPractice].filter(Boolean).join("\n\n");
  }
  return [summary, pipeline, inPractice].filter(Boolean).join("\n\n");
}

function buildHelixAskPipelineEvidence(): string {
  const sources = [
    "docs/helix-ask-flow.md",
    "server/routes/agi.plan.ts",
    "server/services/helix-ask/intent-directory.ts",
    "server/services/helix-ask/topic.ts",
    "server/services/helix-ask/query.ts",
    "server/services/helix-ask/format.ts",
    "server/services/helix-ask/envelope.ts",
    "client/src/components/helix/HelixAskPill.tsx",
  ];
  return sources.map((source) => `source: ${source}`).join("\n");
}

function buildHelixAskPipelineAnswer(): string {
  const steps = [
    "Route intent + topic (server/services/helix-ask/intent-directory.ts, server/services/helix-ask/topic.ts).",
    "Gather repo context and evaluate evidence eligibility (server/routes/agi.plan.ts, server/services/helix-ask/query.ts).",
    "Distill evidence and resolve format (server/services/helix-ask/format.ts).",
    "Synthesize the answer and repair citations if needed (server/routes/agi.plan.ts).",
    "Package the response envelope and render in the UI (server/services/helix-ask/envelope.ts, client/src/components/helix/HelixAskPill.tsx).",
  ];
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function buildHelixAskIdeologyAnswer(conceptMatch: HelixAskConceptMatch): string {
  const core: string[] = [];
  if (conceptMatch.card.definition) {
    core.push(ensureSentence(conceptMatch.card.definition));
  }
  if (conceptMatch.card.keyQuestions) {
    core.push(ensureSentence(`Key questions include: ${conceptMatch.card.keyQuestions}`));
  }
  const paragraph1 = core.join(" ").trim();
  const paragraph2 = conceptMatch.card.notes ? ensureSentence(conceptMatch.card.notes) : "";
  return [paragraph1, paragraph2].filter(Boolean).join("\n\n");
}
const formatConstraintStatus = (pass: boolean) => (pass ? "PASS" : "FAIL");

function buildNoiseFieldEvidence(): ConstraintEvidenceResult {
  const result = runNoiseFieldLoop({});
  const last = result.attempts[result.attempts.length - 1];
  const gate = last?.gate;
  const constraints = last?.constraints as { laplacianRms?: number; laplacianMaxAbs?: number } | undefined;
  const status = gate?.status === "pass";
  const lines = [
    "gate:noise-field",
    `status: ${formatConstraintStatus(status)}`,
    `residuals: laplacianRms=${constraints?.laplacianRms ?? "n/a"}, laplacianMaxAbs=${constraints?.laplacianMaxAbs ?? "n/a"}`,
    "source: modules/analysis/noise-field-loop.ts",
  ];
  return { evidenceText: lines.join("\n"), refs: ["gate:noise-field", "modules/analysis/noise-field-loop.ts"] };
}

function buildDiffusionEvidence(): ConstraintEvidenceResult {
  const result = runImageDiffusionLoop({});
  const last = result.attempts[result.attempts.length - 1];
  const gate = last?.gate;
  const constraints = last?.constraints as { scoreRms?: number; fidelityRms?: number } | undefined;
  const status = gate?.status === "pass";
  const lines = [
    "gate:diffusion-field",
    `status: ${formatConstraintStatus(status)}`,
    `residuals: scoreRms=${constraints?.scoreRms ?? "n/a"}, fidelityRms=${constraints?.fidelityRms ?? "n/a"}`,
    "source: modules/analysis/diffusion-loop.ts",
  ];
  return { evidenceText: lines.join("\n"), refs: ["gate:diffusion-field", "modules/analysis/diffusion-loop.ts"] };
}

function buildBeliefGraphEvidence(): ConstraintEvidenceResult {
  const result = runBeliefGraphLoop({});
  const last = result.attempts[result.attempts.length - 1];
  const gate = last?.gate;
  const constraints = last?.constraints as { violationCount?: number; violationWeight?: number; axiomViolations?: number } | undefined;
  const status = gate?.status === "pass";
  const lines = [
    "gate:belief-graph",
    `status: ${formatConstraintStatus(status)}`,
    `violations: count=${constraints?.violationCount ?? "n/a"}, weight=${constraints?.violationWeight ?? "n/a"}, axiom=${constraints?.axiomViolations ?? "n/a"}`,
    "source: modules/analysis/belief-graph-loop.ts",
  ];
  return { evidenceText: lines.join("\n"), refs: ["gate:belief-graph", "modules/analysis/belief-graph-loop.ts"] };
}

async function buildGrViabilityEvidence(): Promise<ConstraintEvidenceResult> {
  const state = getGlobalPipelineState();
  const diagnostics = state?.gr ?? null;
  const evaluation = await runGrEvaluation({
    diagnostics,
    warpConfig: {},
    useLiveSnapshot: true,
  });
  const cert = evaluation.certificate;
  const status = evaluation.evaluation.pass;
  const certRef = cert.certificateHash
    ? `certificate:warp-viability:${cert.certificateHash.slice(0, 12)}`
    : "certificate:warp-viability:missing";
  const lines = [
    "gate:gr-constraint",
    `status: ${formatConstraintStatus(status)}`,
    `constraints: ${evaluation.evaluation.constraints.length} items`,
    `certificate: ${certRef}`,
    `integrity_ok: ${evaluation.integrityOk}`,
    "source: server/gr/gr-evaluation.ts",
    "source: server/gr/gr-constraint-policy.ts",
    "source: server/routes/warp-viability.ts",
    "source: server/skills/physics.warp.viability.ts",
    "source: server/helix-core.ts",
    "source: server/services/observability/training-trace-store.ts",
  ];
  return {
    evidenceText: lines.join("\n"),
    refs: [
      certRef,
      "gate:gr-constraint",
      "server/gr/gr-evaluation.ts",
      "server/gr/gr-constraint-policy.ts",
      "server/routes/warp-viability.ts",
      "server/skills/physics.warp.viability.ts",
      "server/helix-core.ts",
      "server/services/observability/training-trace-store.ts",
    ],
  };
}

function buildHelixAskCitationRepairPrompt(
  question: string,
  answer: string,
  evidence: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask citation fixer.",
    "Revise the answer to include citations (file paths, prompt chunk ids, or gate/certificate ids) from the evidence list.",
    "Do not add new claims or steps. Preserve the format and wording as much as possible.",
  ];
  if (format === "steps") {
    lines.push("Keep the numbered step list and the trailing \"In practice,\" paragraph.");
    if (stageTags) {
      lines.push("Preserve any stage tags already present.");
    }
  } else {
    lines.push("Keep the paragraph format; do not introduce numbered steps.");
  }
  lines.push("Use only citation identifiers that appear in the evidence list.");
  lines.push("");
  lines.push("Evidence:");
  lines.push(evidence || "No evidence available.");
  lines.push("");
  lines.push("Answer:");
  lines.push(answer);
  lines.push("");
  lines.push("FINAL:");
  return lines.join("\n");
}

const HelixAskTuningOverrides = z
  .object({
    arbiter_repo_ratio: z.coerce.number().min(0.05).max(0.95).optional(),
    arbiter_hybrid_ratio: z.coerce.number().min(0.05).max(0.95).optional(),
    retrieval_retry_topk_bonus: z.coerce.number().int().min(0).max(20).optional(),
    scaffold_tokens: z.coerce.number().int().min(64).max(2048).optional(),
    evidence_tokens: z.coerce.number().int().min(64).max(768).optional(),
    repair_tokens: z.coerce.number().int().min(64).max(512).optional(),
    format_enforcement: z.enum(["strict", "relaxed"]).optional(),
    soft_expansion: z.coerce.number().int().min(0).max(2).optional(),
  })
  .partial();

  const LocalAskRequest = z
  .object({
    prompt: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    debug: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    verbosity: z.enum(["brief", "normal", "extended"]).optional(),
    searchQuery: z.string().optional(),
    topK: z.coerce.number().int().min(1).max(48).optional(),
    context: z.string().optional(),
    max_tokens: z.coerce.number().int().min(1).max(8_192).optional(),
    temperature: z.coerce.number().min(0).max(2).optional(),
    seed: z.coerce.number().int().nonnegative().optional(),
    stop: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
    sessionId: z.string().min(1).max(128).optional(),
    traceId: z.string().min(1).max(128).optional(),
    personaId: z.string().min(1).optional(),
    tuning: HelixAskTuningOverrides.optional(),
  })
  .refine((value) => Boolean(value.prompt || value.question), {
    message: "prompt or question required",
    path: ["prompt"],
  });

const LUMA_MOOD_VALUES = ["mad", "upset", "shock", "question", "happy", "friend", "love"] as const;
type LumaMood = (typeof LUMA_MOOD_VALUES)[number];
const LumaMoodSchema = z.enum(LUMA_MOOD_VALUES);

const MoodHintRequest = z.object({
  text: z.string().min(1, "text required"),
  sessionId: z.string().min(1).max(128).optional(),
  personaId: z.string().min(1).optional(),
});

const MoodHintPayloadSchema = z.object({
  mood: LumaMoodSchema.nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().min(1).optional(),
});

const HELIX_MOOD_HINT_MAX_CHARS = clampNumber(
  readNumber(
    process.env.HELIX_MOOD_HINT_MAX_CHARS ?? process.env.VITE_HELIX_MOOD_HINT_MAX_CHARS,
    600,
  ),
  120,
  2400,
);
const HELIX_MOOD_HINT_MAX_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_MOOD_HINT_MAX_TOKENS ?? process.env.VITE_HELIX_MOOD_HINT_MAX_TOKENS,
    48,
  ),
  8,
  256,
);
const HELIX_MOOD_HINT_TEMP = clampNumber(
  readNumber(process.env.HELIX_MOOD_HINT_TEMP ?? process.env.VITE_HELIX_MOOD_HINT_TEMP, 0.1),
  0,
  1,
);

function clamp01(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function coerceLumaMood(value: unknown): LumaMood | null {
  if (typeof value !== "string") return null;
  const lowered = value.trim().toLowerCase();
  return LUMA_MOOD_VALUES.includes(lowered as LumaMood) ? (lowered as LumaMood) : null;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function buildMoodHintPrompt(text: string): string {
  const clipped = text.slice(0, HELIX_MOOD_HINT_MAX_CHARS);
  const lines: string[] = [];
  lines.push("You are a fast mood classifier for UI theming.");
  lines.push(
    `Choose exactly one mood from: ${LUMA_MOOD_VALUES.join(", ")}. Use question for neutral prompts.`,
  );
  lines.push(
    "Return strict JSON only: {\"mood\":\"<mood|null>\",\"confidence\":0..1,\"reason\":\"short\"}.",
  );
  lines.push("If unclear, use mood null with low confidence.");
  lines.push("");
  lines.push("Text:");
  lines.push(clipped);
  return lines.join("\n");
}

function parseMoodHintResult(raw: string): {
  mood: LumaMood | null;
  confidence: number;
  reason: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { mood: null, confidence: 0, reason: null };
  }

  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = MoodHintPayloadSchema.safeParse(JSON.parse(jsonCandidate));
    if (parsed.success) {
      const mood = coerceLumaMood(parsed.data.mood ?? null);
      const confidence = clamp01(parsed.data.confidence, mood ? 0.6 : 0.2);
      const reason = parsed.data.reason?.trim() ?? null;
      return { mood, confidence, reason };
    }
  } catch {
    // Fall through to token parsing.
  }

  const lowered = trimmed.toLowerCase();
  const mood =
    LUMA_MOOD_VALUES.find((entry) => new RegExp(`\\b${entry}\\b`, "i").test(lowered)) ?? null;
  return {
    mood,
    confidence: mood ? 0.35 : 0.1,
    reason: mood ? "token-match" : null,
  };
}

type LocalAskResult = {
  text?: string;
  prompt_ingested?: boolean;
  prompt_ingest_source?: string;
  prompt_ingest_reason?: string;
  [key: string]: unknown;
};

type HelixAskOverflowMeta = {
  applied: boolean;
  steps: string[];
  attempts: number;
  promptTokens: number;
  maxTokens: number;
};

type HelixAskOverflowOptions = {
  allowContextDrop?: boolean;
  fallbackMaxTokens?: number;
  label?: string;
};

const OVERFLOW_CONTEXT_MARKERS = new Set(["context:", "prompt context:"]);
const OVERFLOW_ERROR_RE =
  /(context|ctx|token|prompt\s+too\s+long|max(?:imum)?\s+context|n_ctx|exceed)/i;

const parseOverflowPolicy = (value: string): string[] =>
  value
    .split(/_then_|->/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry && entry !== "retry");

const prunePromptContext = (prompt: string): { prompt: string; applied: boolean } => {
  const lines = prompt.split(/\r?\n/);
  const out: string[] = [];
  let inContext = false;
  let applied = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const lowered = trimmed.toLowerCase();
    if (!inContext && OVERFLOW_CONTEXT_MARKERS.has(lowered)) {
      inContext = true;
      applied = true;
      out.push(line);
      out.push("Context omitted due to overflow.");
      continue;
    }
    if (inContext) {
      if (trimmed === HELIX_ASK_ANSWER_START || trimmed === HELIX_ASK_ANSWER_END) {
        inContext = false;
        out.push(line);
      }
      continue;
    }
    out.push(line);
  }
  return { prompt: out.join("\n"), applied };
};

const applyOverflowStep = (args: {
  step: string;
  prompt: string;
  maxTokens: number | undefined;
  fallbackMaxTokens: number;
  allowContextDrop: boolean;
}): { prompt: string; maxTokens: number | undefined; applied: boolean } => {
  if (args.step === "drop_context" && args.allowContextDrop) {
    const pruned = prunePromptContext(args.prompt);
    if (pruned.applied) {
      return { prompt: pruned.prompt, maxTokens: args.maxTokens, applied: true };
    }
    return { prompt: args.prompt, maxTokens: args.maxTokens, applied: false };
  }
  if (args.step === "drop_output") {
    const budget = args.maxTokens ?? args.fallbackMaxTokens;
    const promptTokens = estimateTokenCount(args.prompt);
    const available = Math.max(1, HELIX_ASK_LOCAL_CONTEXT_TOKENS - promptTokens - 8);
    const nextMaxTokens = Math.min(Math.max(1, Math.floor(budget)), available);
    if (args.maxTokens === nextMaxTokens) {
      return { prompt: args.prompt, maxTokens: args.maxTokens, applied: false };
    }
    return { prompt: args.prompt, maxTokens: nextMaxTokens, applied: true };
  }
  return { prompt: args.prompt, maxTokens: args.maxTokens, applied: false };
};

const isOverflowLikely = (prompt: string, maxTokens: number): boolean => {
  const promptTokens = estimateTokenCount(prompt);
  return promptTokens + maxTokens > HELIX_ASK_LOCAL_CONTEXT_TOKENS;
};

const runHelixAskLocalWithOverflowRetry = async (
  input: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    seed?: number;
    stop?: string | string[];
  },
  ctx: {
    personaId: string;
    sessionId?: string;
    traceId?: string;
    onToken?: (chunk: string) => void;
  },
  options: HelixAskOverflowOptions = {},
): Promise<{ result: LocalAskResult; overflow?: HelixAskOverflowMeta }> => {
  const steps = parseOverflowPolicy(HELIX_ASK_OVERFLOW_RETRY_POLICY);
  const fallbackMaxTokens = Math.max(1, Math.floor(options.fallbackMaxTokens ?? 256));
  let prompt = input.prompt;
  let maxTokens = input.max_tokens;
  const appliedSteps: string[] = [];
  let attempts = 0;

  if (HELIX_ASK_OVERFLOW_RETRY && steps.length > 0) {
    for (const step of steps) {
      const budget = maxTokens ?? fallbackMaxTokens;
      if (!isOverflowLikely(prompt, budget)) {
        break;
      }
      const applied = applyOverflowStep({
        step,
        prompt,
        maxTokens,
        fallbackMaxTokens,
        allowContextDrop: options.allowContextDrop !== false,
      });
      if (!applied.applied) {
        continue;
      }
      prompt = applied.prompt;
      maxTokens = applied.maxTokens;
      appliedSteps.push(step);
    }
  }

  while (true) {
    attempts += 1;
    try {
      const result = (await llmLocalHandler(
        {
          prompt,
          max_tokens: maxTokens ?? input.max_tokens,
          temperature: input.temperature,
          seed: input.seed,
          stop: input.stop,
        },
        ctx,
      )) as LocalAskResult;
      const promptTokens = estimateTokenCount(prompt);
      const overflow =
        appliedSteps.length > 0
          ? {
              applied: true,
              steps: appliedSteps.slice(),
              attempts,
              promptTokens,
              maxTokens: maxTokens ?? fallbackMaxTokens,
            }
          : undefined;
      return { result, overflow };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const overflowError = HELIX_ASK_OVERFLOW_RETRY && OVERFLOW_ERROR_RE.test(message);
      if (!overflowError || steps.length === 0) {
        throw error;
      }
      const nextStep = steps[appliedSteps.length];
      if (!nextStep) {
        throw error;
      }
      const applied = applyOverflowStep({
        step: nextStep,
        prompt,
        maxTokens,
        fallbackMaxTokens,
        allowContextDrop: options.allowContextDrop !== false,
      });
      if (!applied.applied) {
        throw error;
      }
      prompt = applied.prompt;
      maxTokens = applied.maxTokens;
      appliedSteps.push(nextStep);
    }
  }
};

const AMBIGUOUS_IGNORE_TOKENS = new Set([
  "helix",
  "ask",
  "system",
  "repo",
  "codebase",
  "pipeline",
  "file",
  "files",
  "path",
  "paths",
  "citations",
  "citation",
  "module",
  "modules",
  "define",
  "defined",
  "definition",
  "explain",
  "describe",
  "meaning",
  "mean",
]);

const collectConceptTokens = (conceptMatch: HelixAskConceptMatch | null): Set<string> => {
  if (!conceptMatch) return new Set<string>();
  const values = [
    conceptMatch.card.id,
    conceptMatch.card.label ?? "",
    ...(conceptMatch.card.aliases ?? []),
  ].filter(Boolean);
  const tokens = values
    .flatMap((value) => tokenizeAskQuery(value))
    .flatMap((token) => filterCriticTokens([token]));
  return new Set(tokens.map((token) => token.toLowerCase()));
};

const extractAmbiguousTerms = (
  question: string,
  referenceText: string,
  conceptMatch: HelixAskConceptMatch | null,
): string[] => {
  if (!question.trim()) return [];
  const conceptTokens = collectConceptTokens(conceptMatch);
  const normalizedRef = referenceText.toLowerCase();
  const tokens = filterCriticTokens(tokenizeAskQuery(question));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (normalized.length < HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN) continue;
    if (AMBIGUOUS_IGNORE_TOKENS.has(normalized)) continue;
    if (conceptTokens.has(normalized)) continue;
    if (/^\d+$/.test(normalized)) continue;
    if (normalizedRef.includes(normalized)) continue;
    out.push(normalized);
    if (out.length >= HELIX_ASK_AMBIGUOUS_MAX_TERMS) break;
  }
  return out;
};

const buildAmbiguityClarifyLine = (terms: string[]): string => {
  if (!terms.length) {
    return "Repo evidence was required by the question but could not be confirmed. Please point to the relevant files or clarify the term.";
  }
  if (terms.length === 1) {
    return `I do not see "${terms[0]}" in the repo evidence yet. What do you mean by it, or which file should I use?`;
  }
  const joined = terms.map((term) => `"${term}"`).join(" or ");
  return `I do not see ${joined} in the repo evidence yet. Which files define those terms?`;
};

const selectClarifyToken = (question: string): string | undefined => {
  const tokens = filterCriticTokens(tokenizeAskQuery(question));
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (AMBIGUOUS_IGNORE_TOKENS.has(normalized)) continue;
    if (normalized.length < HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN) continue;
    return normalized;
  }
  return tokens[0];
};

const formatAmbiguityCandidateLabel = (candidate: HelixAskConceptCandidate): string =>
  candidate.card.label ?? candidate.card.id;

const buildPreIntentClarifyLine = (
  question: string,
  candidates: HelixAskConceptCandidate[],
): string => {
  if (candidates.length >= 2) {
    const labelA = formatAmbiguityCandidateLabel(candidates[0]);
    const labelB = formatAmbiguityCandidateLabel(candidates[1]);
    return `Do you mean "${labelA}" or "${labelB}"? If you mean a repo concept, point me to the file or module.`;
  }
  if (candidates.length === 1) {
    const label = formatAmbiguityCandidateLabel(candidates[0]);
    const token = selectClarifyToken(question) ?? candidates[0].matchedTerm;
    return `Do you mean "${label}" in this repo, or the general meaning of "${token}"? If it's repo-specific, point me to the file or module.`;
  }
  const token = selectClarifyToken(question);
  if (token) {
    return `What do you mean by "${token}"? If you mean a repo/physics concept, point me to the file or module.`;
  }
  return "Could you clarify the term or point me to the relevant files?";
};

const resolvePreIntentAmbiguity = ({
  question,
  candidates,
  explicitRepoExpectation,
  repoExpectationLevel,
}: {
  question: string;
  candidates: HelixAskConceptCandidate[];
  explicitRepoExpectation: boolean;
  repoExpectationLevel: "low" | "medium" | "high";
}): {
  shouldClarify: boolean;
  reason?: string;
  tokenCount: number;
  shortPrompt: boolean;
  topScore: number;
  margin: number;
} => {
  if (!HELIX_ASK_AMBIGUITY_RESOLVER) {
    return {
      shouldClarify: false,
      tokenCount: 0,
      shortPrompt: false,
      topScore: 0,
      margin: 0,
    };
  }
  const tokenCount = filterCriticTokens(tokenizeAskQuery(question)).length;
  const shortPrompt = tokenCount > 0 && tokenCount <= HELIX_ASK_AMBIGUITY_SHORT_TOKENS;
  const topScore = candidates[0]?.score ?? 0;
  const margin = candidates.length > 1 ? topScore - candidates[1].score : topScore;
  const strongConcept =
    candidates.length > 0 &&
    topScore >= HELIX_ASK_AMBIGUITY_MIN_SCORE &&
    (candidates.length < 2 || margin >= HELIX_ASK_AMBIGUITY_MARGIN_MIN);
  const hasRepoExpectation = explicitRepoExpectation || repoExpectationLevel !== "low";
  const shouldClarify = shortPrompt && !hasRepoExpectation && !strongConcept;
  return {
    shouldClarify,
    reason: shouldClarify ? "short_prompt_low_signal" : undefined,
    tokenCount,
    shortPrompt,
    topScore,
    margin,
  };
};

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
  sessionId: z
    .string()
    .min(1, "sessionId required")
    .transform((value) => value.trim())
    .optional(),
  traceId: z
    .string()
    .min(1, "traceId required")
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
  if (!getTool(grAssistantSpec.name)) {
    registerTool({ ...grAssistantSpec, handler: grAssistantHandler });
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

planRouter.post("/mood-hint", async (req, res) => {
  const tenantGuard = guardTenant(req);
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const parsed = MoodHintRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }

  let personaId = parsed.data.personaId ?? "default";
  if (
    personaPolicy.shouldRestrictRequest(req.auth) &&
    (!personaId || personaId === "default") &&
    req.auth?.sub
  ) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  const text = parsed.data.text.trim();
  if (!text) {
    return res.status(400).json({ error: "bad_request", details: "text required" });
  }

  const sessionId = parsed.data.sessionId?.trim() || undefined;
  const traceId = `mood:${crypto.randomUUID()}`;
  const startedAt = Date.now();
  const prompt = buildMoodHintPrompt(text);

  try {
    const result = await llmLocalHandler(
      {
        prompt,
        max_tokens: HELIX_MOOD_HINT_MAX_TOKENS,
        temperature: HELIX_MOOD_HINT_TEMP,
        stop: ["\n\n"],
        metadata: { kind: "helix.mood_hint" },
      },
      {
        sessionId,
        traceId,
        personaId,
        tenantId: tenantGuard.tenantId,
      },
    );
    const raw = String((result as any)?.text ?? "");
    const parsedHint = parseMoodHintResult(raw);
    const rawPreview = raw.trim().slice(0, 320);
    return res.json({
      mood: parsedHint.mood,
      confidence: parsedHint.confidence,
      reason: parsedHint.reason,
      source: "local-llm",
      durationMs: Math.max(0, Date.now() - startedAt),
      traceId,
      sessionId: sessionId ?? null,
      raw: rawPreview || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.json({
      mood: null,
      confidence: 0,
      reason: message || "mood_hint_failed",
      source: "error",
      durationMs: Math.max(0, Date.now() - startedAt),
      traceId,
      sessionId: sessionId ?? null,
      raw: null,
    });
  }
});


type HelixAskResponder = {
  send: (status: number, payload: unknown) => void;
};

type HelixAskExecutionArgs = {
  request: z.infer<typeof LocalAskRequest>;
  personaId: string;
  responder: HelixAskResponder;
  streamChunk?: (chunk: string) => void;
};

const executeHelixAsk = async ({
  request,
  personaId,
  responder,
  streamChunk,
}: HelixAskExecutionArgs): Promise<void> => {
  const parsed = { data: request };
  const askSessionId = parsed.data.sessionId;
  const askTraceId = (parsed.data.traceId?.trim() || `ask:${crypto.randomUUID()}`).slice(0, 128);
  const dryRun = parsed.data.dryRun === true;
  const debugEnabled = parsed.data.debug === true;
  const debugLogsEnabled = process.env.HELIX_ASK_DEBUG === "1";
  const logDebug = (message: string, detail?: Record<string, unknown>): void => {
    if (!debugLogsEnabled) return;
    const tag = `[HELIX_ASK_DEBUG:${Date.now()}]`;
    if (detail) {
      try {
        console.log(tag, message, JSON.stringify(detail));
      } catch {
        console.log(tag, message);
      }
      return;
    }
    console.log(tag, message);
  };
  const HELIX_ASK_EVENT_HISTORY_LIMIT = clampNumber(
    readNumber(process.env.HELIX_ASK_EVENT_HISTORY_LIMIT, 90),
    20,
    240,
  );
  const captureLiveHistory = debugEnabled || process.env.HELIX_ASK_LIVE_HISTORY_ALWAYS === "1";
  const liveEventHistory: Array<{
    ts: string;
    tool: string;
    stage: string;
    detail?: string;
    ok?: boolean;
    durationMs?: number;
    text?: string;
  }> = [];
  const pushLiveEvent = (entry: {
    tool: string;
    stage: string;
    detail?: string;
    ok?: boolean;
    durationMs?: number;
    text?: string;
  }): void => {
    if (!captureLiveHistory) return;
    liveEventHistory.push({
      ts: new Date().toISOString(),
      ...entry,
    });
    if (liveEventHistory.length > HELIX_ASK_EVENT_HISTORY_LIMIT) {
      liveEventHistory.splice(0, liveEventHistory.length - HELIX_ASK_EVENT_HISTORY_LIMIT);
    }
  };
  const logProgress = (stage: string, detail?: string, startedAt?: number, ok?: boolean): void => {
    logHelixAskProgress({
      stage,
      detail,
      sessionId: askSessionId,
      traceId: askTraceId,
      startedAt,
      ok,
    });
    const cleanedDetail = detail?.trim();
    const label = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
    pushLiveEvent({
      tool: HELIX_ASK_PROGRESS_TOOL,
      stage,
      detail: cleanedDetail,
      ok,
      durationMs: typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0,
      text: clipEventText(label),
    });
  };
  const HELIX_ASK_EVENT_TOOL = "helix.ask.event";
  const HELIX_ASK_EVENT_VERSION = "v1";
  const HELIX_ASK_EVENT_MAX_CHARS = clampNumber(
    readNumber(
      process.env.HELIX_ASK_EVENT_MAX_CHARS ?? process.env.VITE_HELIX_ASK_EVENT_MAX_CHARS,
      1400,
    ),
    240,
    8000,
  );
  const HELIX_ASK_EVENT_FILE_LIMIT = 14;
  const clipEventText = (value?: string): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.length <= HELIX_ASK_EVENT_MAX_CHARS) return trimmed;
    return `${trimmed.slice(0, Math.max(0, HELIX_ASK_EVENT_MAX_CHARS - 3))}...`;
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
    const preview = unique.slice(0, HELIX_ASK_EVENT_FILE_LIMIT);
    const remainder = unique.length - preview.length;
    const body = preview.map((entry) => `- ${entry}`).join("\n");
    return remainder > 0 ? `${body}\n- ...and ${remainder} more` : body;
  };
  const logEvent = (
    stage: string,
    detail?: string,
    text?: string,
    startedAt?: number,
    ok = true,
  ): void => {
    if (!askSessionId) return;
    const cleanedDetail = detail?.trim();
    const header = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
    const body = clipEventText(text);
    appendToolLog({
      tool: HELIX_ASK_EVENT_TOOL,
      version: HELIX_ASK_EVENT_VERSION,
      paramsHash: hashHelixAskProgress(`event:${stage}:${cleanedDetail ?? ""}`),
      durationMs: typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0,
      sessionId: askSessionId,
      traceId: askTraceId,
      ok,
      text: body ? `${header}\n${body}` : header,
    });
    pushLiveEvent({
      tool: HELIX_ASK_EVENT_TOOL,
      stage,
      detail: cleanedDetail,
      ok,
      durationMs: typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0,
      text: body ? `${header}\n${body}` : header,
    });
  };
  const streamEmitter = createHelixAskStreamEmitter({ sessionId: askSessionId, traceId: askTraceId, onChunk: streamChunk });
  try {
    logDebug("executeHelixAsk START", {
      traceId: askTraceId,
      sessionId: askSessionId ?? null,
    });
    let prompt = parsed.data.prompt?.trim();
    const question = parsed.data.question?.trim();
    let questionValue = question;
    const tuningOverrides = HELIX_ASK_SWEEP_OVERRIDES ? parsed.data.tuning : undefined;
    const arbiterRepoRatio = clampNumber(
      typeof tuningOverrides?.arbiter_repo_ratio === "number"
        ? tuningOverrides.arbiter_repo_ratio
        : HELIX_ASK_ARBITER_REPO_RATIO,
      0.05,
      0.95,
    );
    const arbiterHybridRatio = clampNumber(
      typeof tuningOverrides?.arbiter_hybrid_ratio === "number"
        ? tuningOverrides.arbiter_hybrid_ratio
        : HELIX_ASK_ARBITER_HYBRID_RATIO,
      0.05,
      0.95,
    );
    const retryTopKBonus = clampNumber(
      typeof tuningOverrides?.retrieval_retry_topk_bonus === "number"
        ? tuningOverrides.retrieval_retry_topk_bonus
        : HELIX_ASK_RETRIEVAL_RETRY_TOPK_BONUS,
      0,
      20,
    );
    const scaffoldTokens = clampNumber(
      typeof tuningOverrides?.scaffold_tokens === "number"
        ? tuningOverrides.scaffold_tokens
        : HELIX_ASK_SCAFFOLD_TOKENS,
      64,
      2048,
    );
    const evidenceTokens = clampNumber(
      typeof tuningOverrides?.evidence_tokens === "number"
        ? tuningOverrides.evidence_tokens
        : HELIX_ASK_EVIDENCE_TOKENS,
      64,
      768,
    );
    const repairTokens = clampNumber(
      typeof tuningOverrides?.repair_tokens === "number"
        ? tuningOverrides.repair_tokens
        : HELIX_ASK_REPAIR_TOKENS,
      64,
      512,
    );
    const formatEnforcementLevel =
      (tuningOverrides?.format_enforcement ?? HELIX_ASK_FORMAT_ENFORCEMENT_LEVEL) === "relaxed"
        ? "relaxed"
        : "strict";
    let softExpansionBudget = clampNumber(
      typeof tuningOverrides?.soft_expansion === "number"
        ? tuningOverrides.soft_expansion
        : HELIX_ASK_SOFT_EXPANSION_MAX_SENTENCES,
      0,
      2,
    );
    const debugPayload: {
      two_pass: boolean;
      micro_pass?: boolean;
      micro_pass_auto?: boolean;
      micro_pass_reason?: string;
      scaffold?: string;
      evidence_cards?: string;
      query_hints?: string[];
      queries?: string[];
      context_files?: string[];
      prompt_ingested?: boolean;
      prompt_ingest_source?: string;
      prompt_ingest_reason?: string;
      prompt_chunk_count?: number;
      prompt_selected?: number;
      prompt_context_files?: string[];
      prompt_context_points?: string[];
      prompt_used_sections?: string[];
      topic_tags?: string[];
      topic_allowlist_tiers?: number;
      topic_must_include_files?: string[];
      docs_first_enabled?: boolean;
      plan_scope_allowlist_tiers?: number;
      plan_scope_avoidlist?: number;
      plan_scope_must_include?: number;
      composite_synthesis?: boolean;
      composite_topics?: string[];
      topic_tier?: number;
      topic_must_include_ok?: boolean;
      viability_must_include_ok?: boolean;
      concept_id?: string;
      concept_label?: string;
      concept_source?: string;
      concept_fast_path?: boolean;
      concept_fast_path_reason?: string;
      concept_fast_path_source?: string;
      math_solver_ok?: boolean;
      math_solver_kind?: string;
      math_solver_final?: string;
      math_solver_reason?: string;
      math_solver_variable?: string;
      math_solver_gate_pass?: boolean;
      math_solver_gate_reason?: string;
      math_solver_domain_pass?: boolean;
      math_solver_residual_pass?: boolean;
      math_solver_residual_max?: number;
      math_solver_registry_id?: string;
      math_solver_selected_solution?: string;
      math_solver_admissible_count?: number;
      math_solver_maturity?: string;
      intent_id?: string;
      intent_domain?: string;
      intent_tier?: string;
      intent_secondary_tier?: string;
      intent_strategy?: string;
      intent_reason?: string;
      tuning_enabled?: boolean;
      arbiter_repo_ratio?: number;
      arbiter_hybrid_ratio?: number;
      retry_topk_bonus?: number;
      format_enforcement?: "strict" | "relaxed";
      soft_expansion?: number;
      scaffold_tokens?: number;
      evidence_tokens?: number;
      repair_tokens?: number;
      arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
      arbiter_reason?: string;
      arbiter_strictness?: "low" | "med" | "high";
      arbiter_user_expects_repo?: boolean;
      requires_repo_evidence?: boolean;
      explicit_repo_expectation?: boolean;
      repo_expectation_score?: number;
      repo_expectation_level?: "low" | "medium" | "high";
      repo_expectation_signals?: string[];
      arbiter_ratio?: number;
      arbiter_topic_ok?: boolean;
      arbiter_concept_match?: boolean;
      plan_pass_used?: boolean;
      plan_pass_forced?: boolean;
      plan_directives?: HelixAskPlanDirectives;
      clarify_triggered?: boolean;
      obligation_violation?: boolean;
      context_deferred?: boolean;
      arbiter_repo_ok?: boolean;
      arbiter_hybrid_ok?: boolean;
      verification_anchor_required?: boolean;
      verification_anchor_ok?: boolean;
      evidence_critic_applied?: boolean;
      evidence_critic_ok?: boolean;
      evidence_critic_ratio?: number;
      evidence_critic_count?: number;
      evidence_critic_tokens?: number;
      evidence_gate_ok?: boolean;
      evidence_match_ratio?: number;
      evidence_match_count?: number;
      evidence_token_count?: number;
      evidence_claim_count?: number;
      evidence_claim_supported?: number;
      evidence_claim_unsupported?: number;
      evidence_claim_ratio?: number;
      evidence_claim_gate_ok?: boolean;
      evidence_claim_missing?: string[];
      retrieval_confidence?: number;
      retrieval_doc_share?: number;
      retrieval_doc_hits?: number;
      retrieval_context_file_count?: number;
      retrieval_query_hit_count?: number;
      retrieval_top_score?: number;
      retrieval_score_gap?: number;
      retrieval_channel_hits?: AskCandidateChannelStats;
      retrieval_channel_top_scores?: AskCandidateChannelStats;
      slot_coverage_required?: string[];
      slot_coverage_missing?: string[];
      slot_coverage_ratio?: number;
      slot_coverage_ok?: boolean;
      repo_search_terms?: string[];
      repo_search_paths?: string[];
      repo_search_reason?: string;
      repo_search_explicit?: boolean;
      repo_search_hits?: number;
      repo_search_truncated?: boolean;
      repo_search_error?: string;
      ambiguity_terms?: string[];
      ambiguity_gate_applied?: boolean;
      overflow_retry_applied?: boolean;
      overflow_retry_steps?: string[];
      overflow_retry_labels?: string[];
      overflow_retry_attempts?: number;
      plan_must_include_ok?: boolean;
      constraint_evidence?: string;
      citation_repair?: boolean;
      format?: HelixAskFormat;
      stage_tags?: boolean;
      verbosity?: HelixAskVerbosity;
      junk_clean_applied?: boolean;
      junk_clean_reasons?: string[];
      concept_lint_applied?: boolean;
      concept_lint_reasons?: string[];
      physics_lint_applied?: boolean;
      physics_lint_reasons?: string[];
      coverage_token_count?: number;
      coverage_key_count?: number;
      coverage_missing_key_count?: number;
      coverage_ratio?: number;
      coverage_missing_keys?: string[];
      coverage_gate_applied?: boolean;
      coverage_gate_reason?: string;
      ambiguity_resolver_applied?: boolean;
      ambiguity_resolver_reason?: string;
      ambiguity_resolver_candidates?: string[];
      ambiguity_resolver_token_count?: number;
      ambiguity_resolver_short_prompt?: boolean;
      ambiguity_resolver_top_score?: number;
      ambiguity_resolver_margin?: number;
      belief_claim_count?: number;
      belief_supported_count?: number;
      belief_unsupported_count?: number;
      belief_unsupported_rate?: number;
      belief_contradictions?: number;
      belief_gate_applied?: boolean;
      belief_gate_reason?: string;
      belief_graph_node_count?: number;
      belief_graph_edge_count?: number;
      belief_graph_claim_count?: number;
      belief_graph_definition_count?: number;
      belief_graph_conclusion_count?: number;
      belief_graph_evidence_ref_count?: number;
      belief_graph_constraint_count?: number;
      belief_graph_supports?: number;
      belief_graph_contradicts?: number;
      belief_graph_depends_on?: number;
      belief_graph_maps_to?: number;
      belief_graph_claim_ids?: string[];
      belief_graph_unsupported_claim_ids?: string[];
      belief_graph_contradiction_ids?: string[];
      rattling_score?: number;
      rattling_base_distance?: number;
      rattling_perturbation_distance?: number;
      rattling_claim_set_count?: number;
      rattling_gate_applied?: boolean;
      variant_selection_applied?: boolean;
      variant_selection_reason?: string;
      variant_selection_label?: string;
      variant_selection_candidate_count?: number;
      gates?: {
        evidence?: {
          ok?: boolean;
          matchCount?: number;
          tokenCount?: number;
          matchRatio?: number;
          criticApplied?: boolean;
          criticOk?: boolean;
          criticRatio?: number;
          criticCount?: number;
          criticTokens?: number;
        };
        coverage?: {
          applied?: boolean;
          reason?: string;
          ratio?: number;
          tokenCount?: number;
          keyCount?: number;
          missingKeyCount?: number;
          missingKeys?: string[];
        };
        belief?: {
          applied?: boolean;
          reason?: string;
          unsupportedRate?: number;
          unsupportedCount?: number;
          supportedCount?: number;
          claimCount?: number;
          contradictions?: number;
        };
        beliefGraph?: {
          nodeCount?: number;
          edgeCount?: number;
          claimCount?: number;
          definitionCount?: number;
          conclusionCount?: number;
          evidenceRefCount?: number;
          constraintCount?: number;
          supports?: number;
          contradicts?: number;
          dependsOn?: number;
          mapsTo?: number;
        };
        rattling?: {
          applied?: boolean;
          score?: number;
          baseDistance?: number;
          perturbationDistance?: number;
          claimSetCount?: number;
        };
        lint?: {
          conceptApplied?: boolean;
          conceptReasons?: string[];
          physicsApplied?: boolean;
          physicsReasons?: string[];
        };
        variant?: {
          applied?: boolean;
          reason?: string;
          label?: string;
          candidateCount?: number;
        };
        ambiguity?: {
          resolverApplied?: boolean;
          resolverReason?: string;
          resolverTokenCount?: number;
          resolverShortPrompt?: boolean;
          resolverTopScore?: number;
          resolverMargin?: number;
          resolverCandidates?: string[];
          gateApplied?: boolean;
          terms?: string[];
        };
      };
      answer_path?: string[];
      live_events?: Array<{
        ts: string;
        tool: string;
        stage: string;
        detail?: string;
        ok?: boolean;
        durationMs?: number;
        text?: string;
      }>;
    } | undefined = debugEnabled
      ? { two_pass: false, micro_pass: false }
      : undefined;
    const overflowHistory: Array<{ label: string; steps: string[]; attempts: number }> = [];
    const recordOverflow = (label: string, overflow?: HelixAskOverflowMeta): void => {
      if (!overflow?.applied) return;
      overflowHistory.push({
        label,
        steps: overflow.steps.slice(),
        attempts: overflow.attempts,
      });
      logEvent("Overflow retry", label, overflow.steps.join(" -> "));
    };
    if (debugPayload) {
      debugPayload.tuning_enabled = Boolean(tuningOverrides);
      debugPayload.arbiter_repo_ratio = arbiterRepoRatio;
      debugPayload.arbiter_hybrid_ratio = arbiterHybridRatio;
      debugPayload.retry_topk_bonus = retryTopKBonus;
      debugPayload.format_enforcement = formatEnforcementLevel;
      debugPayload.soft_expansion = softExpansionBudget;
      debugPayload.scaffold_tokens = scaffoldTokens;
      debugPayload.evidence_tokens = evidenceTokens;
      debugPayload.repair_tokens = repairTokens;
    }
    const answerPath: string[] = [];
    if (!questionValue && prompt) {
      const extracted = extractQuestionFromPrompt(prompt);
      if (extracted) {
        questionValue = extracted;
      }
    }
    const baseQuestion = (questionValue ?? question ?? "").trim();
    const hasFilePathHints = HELIX_ASK_FILE_HINT.test(baseQuestion);
    const explicitRepoExpectation =
      hasFilePathHints ||
      HELIX_ASK_REPO_FORCE.test(baseQuestion) ||
      HELIX_ASK_REPO_EXPECTS.test(baseQuestion);
    let topicTags = inferHelixAskTopicTags(baseQuestion, parsed.data.searchQuery);
    logEvent(
      "Topic tags",
      topicTags.length ? "ok" : "none",
      topicTags.length ? topicTags.join(", ") : "none",
    );
    const repoNativeTags = new Set([
      "helix_ask",
      "warp",
      "ideology",
      "ledger",
      "star",
      "constraints",
    ]);
    const repoExpectationSignals: string[] = [];
    let repoExpectationScore = 0;
    if (explicitRepoExpectation) {
      repoExpectationScore = 3;
      repoExpectationSignals.push("explicit_repo");
    }
    if (hasFilePathHints) {
      repoExpectationScore = Math.max(repoExpectationScore, 3);
      repoExpectationSignals.push("file_path");
    }
    const tagSignals = topicTags.filter((tag) => repoNativeTags.has(tag));
    if (tagSignals.length) {
      repoExpectationScore = Math.max(repoExpectationScore, 2);
      repoExpectationSignals.push(...tagSignals.map((tag) => `tag:${tag}`));
    }
    if (HELIX_ASK_REPO_HINT.test(baseQuestion)) {
      repoExpectationScore = Math.max(repoExpectationScore, 1);
      repoExpectationSignals.push("repo_hint");
    }
    const repoExpectationLevel =
      repoExpectationScore >= 3
        ? "high"
        : repoExpectationScore >= 2
          ? "medium"
          : "low";
    let requiresRepoEvidence = explicitRepoExpectation;
    const hasRepoHints =
      explicitRepoExpectation ||
      HELIX_ASK_REPO_HINT.test(baseQuestion) ||
      repoExpectationLevel !== "low";
    if (debugPayload) {
      debugPayload.explicit_repo_expectation = explicitRepoExpectation;
      debugPayload.repo_expectation_score = repoExpectationScore;
      debugPayload.repo_expectation_level = repoExpectationLevel;
      debugPayload.repo_expectation_signals = repoExpectationSignals.slice();
    }
    if (explicitRepoExpectation) {
      logEvent("Obligation", "requires_repo", baseQuestion);
    }
    if (repoExpectationLevel !== "low") {
      logEvent(
        "Repo expectation",
        repoExpectationLevel,
        repoExpectationSignals.length ? repoExpectationSignals.join(", ") : undefined,
      );
    }
    let topicProfile = buildHelixAskTopicProfile(topicTags);
    if (topicProfile) {
      logEvent(
        "Topic profile",
        "ok",
        [
          `allowlistTiers=${topicProfile.allowlistTiers.length}`,
          `mustIncludeFiles=${topicProfile.mustIncludeFiles?.length ?? 0}`,
          `boosts=${topicProfile.boostPaths.length}`,
          `deboosts=${topicProfile.deboostPaths.length}`,
        ].join(" | "),
      );
      if (debugPayload) {
        debugPayload.topic_allowlist_tiers = topicProfile.allowlistTiers.length;
        debugPayload.topic_must_include_files = topicProfile.mustIncludeFiles?.slice();
      }
    } else {
      logEvent("Topic profile", "none", "no profile");
    }
    const ambiguityCandidates = HELIX_ASK_AMBIGUITY_RESOLVER
      ? listConceptCandidates(baseQuestion, 3)
      : [];
    const ambiguityResolution = resolvePreIntentAmbiguity({
      question: baseQuestion,
      candidates: ambiguityCandidates,
      explicitRepoExpectation,
      repoExpectationLevel,
    });
    let preIntentClarify: string | null = null;
    if (debugPayload && HELIX_ASK_AMBIGUITY_RESOLVER) {
      debugPayload.ambiguity_resolver_applied = ambiguityResolution.shouldClarify;
      debugPayload.ambiguity_resolver_reason = ambiguityResolution.reason;
      debugPayload.ambiguity_resolver_token_count = ambiguityResolution.tokenCount;
      debugPayload.ambiguity_resolver_short_prompt = ambiguityResolution.shortPrompt;
      debugPayload.ambiguity_resolver_top_score = ambiguityResolution.topScore;
      debugPayload.ambiguity_resolver_margin = ambiguityResolution.margin;
      debugPayload.ambiguity_resolver_candidates = ambiguityCandidates.map((candidate) =>
        formatAmbiguityCandidateLabel(candidate),
      );
    }
    if (ambiguityResolution.shouldClarify) {
      preIntentClarify = buildPreIntentClarifyLine(baseQuestion, ambiguityCandidates);
      logEvent(
        "Ambiguity resolver",
        "clarify",
        ambiguityResolution.reason ?? "short_prompt",
      );
    }
    const intentMatch = matchHelixAskIntent({
      question: baseQuestion,
      hasRepoHints,
      hasFilePathHints,
    });
    const compositeRequest = shouldHelixAskCompositeSynthesis(baseQuestion, topicTags);
    const originalIntentProfile = intentMatch.profile;
    let intentProfile = intentMatch.profile;
    let intentReasonBase = intentMatch.reason;
    let compositeApplied = false;
    let compositeRequiredFiles: string[] = [];
    if (compositeRequest.enabled) {
      const compositeProfile = getHelixAskIntentProfileById(
        "hybrid.composite_system_synthesis",
      );
      if (compositeProfile) {
        const compositeReason = `composite:${intentProfile.id}`;
        intentProfile = compositeProfile;
        intentReasonBase = `${intentReasonBase}|${compositeReason}`;
        compositeApplied = true;
        compositeRequiredFiles = collectCompositeMustIncludeFiles(compositeRequest.topics);
      }
    }
    if (requiresRepoEvidence && intentProfile.domain === "general") {
      const fallbackProfile = resolveFallbackIntentProfile("hybrid");
      intentProfile = fallbackProfile;
      intentReasonBase = `${intentReasonBase}|obligation:repo_required`;
      logEvent("Fallback", "obligation -> hybrid", intentReasonBase);
    }
    if (!requiresRepoEvidence && repoExpectationLevel !== "low" && intentProfile.domain === "general") {
      const fallbackProfile = resolveFallbackIntentProfile("hybrid");
      intentProfile = fallbackProfile;
      intentReasonBase = `${intentReasonBase}|expectation:${repoExpectationLevel}`;
      logEvent("Fallback", "repo_expectation -> hybrid", `level=${repoExpectationLevel}`);
    }
    let intentDomain = intentProfile.domain;
    let intentTier = intentProfile.tier;
    let intentSecondaryTier = intentProfile.secondaryTier;
    let intentStrategy = intentProfile.strategy;
    let formatSpec = resolveHelixAskFormat(baseQuestion, intentProfile, debugEnabled);
    if (hasTwoParagraphContract(baseQuestion)) {
      formatSpec = { format: "compare", stageTags: false };
    }
    if (intentStrategy === "hybrid_explain" && formatSpec.format !== "steps") {
      formatSpec = { ...formatSpec, stageTags: false };
    }
    const compositeConstraintRequested =
      compositeRequest.enabled &&
      (originalIntentProfile.strategy === "constraint_report" ||
        HELIX_ASK_VIABILITY_FOCUS.test(baseQuestion));
    if (compositeConstraintRequested) {
      intentSecondaryTier = "F3";
    }
    const verbosity = resolveHelixAskVerbosity(
      baseQuestion,
      intentProfile,
      parsed.data.verbosity as HelixAskVerbosity | undefined,
    );
    let intentReason = intentReasonBase;
    if (compositeConstraintRequested) {
      intentReason = `${intentReason}|composite:constraint`;
    }
    const updateIntentDebug = () => {
      if (!debugPayload) return;
      debugPayload.format = formatSpec.format;
      debugPayload.stage_tags = formatSpec.stageTags;
      debugPayload.verbosity = verbosity;
      if (topicTags.length > 0) {
        debugPayload.topic_tags = topicTags.slice();
      }
      if (compositeApplied) {
        debugPayload.composite_synthesis = true;
        if (compositeRequest.topics.length > 0) {
          debugPayload.composite_topics = compositeRequest.topics.slice();
        }
      }
      debugPayload.intent_id = intentProfile.id;
      debugPayload.intent_domain = intentDomain;
      debugPayload.intent_tier = intentTier;
      debugPayload.intent_secondary_tier = intentSecondaryTier;
      debugPayload.intent_strategy = intentStrategy;
      debugPayload.intent_reason = intentReason;
    };
    updateIntentDebug();
    logEvent(
      "Intent resolved",
      "ok",
      [
        `id=${intentProfile.id}`,
        `domain=${intentDomain}`,
        `tier=${intentTier}`,
        intentSecondaryTier ? `secondary=${intentSecondaryTier}` : "",
        `strategy=${intentStrategy}`,
        `reason=${intentReason}`,
      ]
        .filter(Boolean)
        .join(" | "),
    );
    answerPath.push(`intent:${intentProfile.id}`);
    answerPath.push(`domain:${intentDomain}`);
    answerPath.push(`strategy:${intentStrategy}`);
    if (compositeApplied) {
      answerPath.push("composite:enabled");
    }
    let contextText = parsed.data.context?.trim() ?? "";
    if (!contextText && prompt) {
      contextText = extractContextFromPrompt(prompt);
    }
    let contextFiles = extractFilePathsFromText(contextText);
    let isRepoQuestion =
      intentProfile.evidencePolicy.allowRepoCitations &&
      (intentDomain === "repo" || intentDomain === "hybrid");
    if (intentStrategy === "constraint_report") {
      isRepoQuestion = false;
    }
    const longPromptCandidate = resolveLongPromptCandidate({
      prompt,
      question: baseQuestion,
      contextText,
      hasQuestion: Boolean(questionValue ?? question),
    });
    const answerTokenBudget = Math.min(parsed.data.max_tokens ?? scaffoldTokens, 8192);
    let promptIngested = false;
    let promptIngestReason: string | undefined;
    let promptIngestSource: string | undefined;
    let promptContextText = "";
    let promptContextFiles: string[] = [];
    let promptChunkCount = 0;
    let promptSelectedCount = 0;
    let promptContextPoints: string[] = [];
    let promptUsedSections: string[] = [];
    if (longPromptCandidate) {
      const estimatedTokens = estimateTokenCount(longPromptCandidate.text);
      const estimatedTotal = estimatedTokens + answerTokenBudget + HELIX_ASK_LONGPROMPT_OVERHEAD_TOKENS;
      if (
        estimatedTokens >= HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS ||
        estimatedTotal > HELIX_ASK_LOCAL_CONTEXT_TOKENS
      ) {
        promptIngested = true;
        promptIngestReason =
          estimatedTokens >= HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS ? "threshold" : "overflow";
        promptIngestSource = longPromptCandidate.source;
        const ingestStart = Date.now();
        logProgress("Prompt ingest", "chunking", ingestStart);
        const ingestResult = buildLongPromptContext(
          longPromptCandidate.text,
          baseQuestion || longPromptCandidate.text.slice(0, 200),
          {
            chunkTokens: HELIX_ASK_LONGPROMPT_CHUNK_TOKENS,
            overlapTokens: HELIX_ASK_LONGPROMPT_CHUNK_OVERLAP,
            topK: HELIX_ASK_LONGPROMPT_TOPK_CANDIDATES,
            topM: Math.min(HELIX_ASK_LONGPROMPT_TOPM_SELECTED, HELIX_ASK_LONGPROMPT_MAX_CARDS),
          },
        );
        promptContextText = ingestResult.context;
        promptContextFiles = ingestResult.files;
        promptChunkCount = ingestResult.chunkCount;
        promptSelectedCount = ingestResult.selectedCount;
        promptContextPoints = ingestResult.selections
          .map((entry) => {
            const section = entry.section ? ` (${entry.section})` : "";
            const preview = entry.preview ? ` - ${entry.preview}` : "";
            return `${entry.id}${section}${preview}`;
          })
          .slice(0, 12);
        promptUsedSections = Array.from(
          new Set(ingestResult.selections.map((entry) => entry.section).filter(Boolean)),
        ).slice(0, 12);
        logProgress(
          "Prompt ingest ready",
          `${promptSelectedCount} chunks`,
          ingestStart,
        );
        logEvent(
          "Prompt ingest ready",
          `${promptSelectedCount} chunks`,
          formatFileList(promptContextFiles),
          ingestStart,
        );
      }
    }
    if (promptIngested && debugPayload) {
      debugPayload.prompt_ingested = true;
      debugPayload.prompt_ingest_reason = promptIngestReason;
      debugPayload.prompt_ingest_source = promptIngestSource;
      debugPayload.prompt_chunk_count = promptChunkCount;
      debugPayload.prompt_selected = promptSelectedCount;
      debugPayload.prompt_context_files = promptContextFiles;
      if (promptContextPoints.length > 0) {
        debugPayload.prompt_context_points = promptContextPoints.slice();
      }
      if (promptUsedSections.length > 0) {
        debugPayload.prompt_used_sections = promptUsedSections.slice();
      }
    }
    let conceptMatch: HelixAskConceptMatch | null = null;
    let mathSolveResult: HelixAskMathSolveResult | null = null;
    let verificationAnchorRequired = false;
    let verificationAnchorHints: string[] = [];
    let forcedAnswer: string | null = null;
    if (preIntentClarify) {
      forcedAnswer = preIntentClarify;
      answerPath.push("clarify:pre_intent");
      if (debugPayload) {
        debugPayload.clarify_triggered = true;
      }
    }
    const conceptualFocus = HELIX_ASK_CONCEPTUAL_FOCUS.test(baseQuestion);
    const wantsConceptMatch =
      intentDomain === "general" ||
      intentDomain === "hybrid" ||
      intentProfile.id === "repo.ideology_reference" ||
      (intentDomain === "repo" && conceptualFocus);
    if (!promptIngested && wantsConceptMatch) {
      conceptMatch = findConceptMatch(baseQuestion);
      if (conceptMatch && debugPayload) {
        debugPayload.concept_id = conceptMatch.card.id;
        debugPayload.concept_label = conceptMatch.card.label ?? conceptMatch.card.id;
        debugPayload.concept_source = conceptMatch.card.sourcePath;
      }
      if (conceptMatch) {
        answerPath.push(`concept:${conceptMatch.card.id}`);
      }
    }
    const normalizeConceptTags = (tags?: string[]): HelixAskTopicTag[] => {
      if (!tags) return [];
      const allowed = new Set<HelixAskTopicTag>([
        "helix_ask",
        "warp",
        "physics",
        "energy_pipeline",
        "trace",
        "resonance",
        "ideology",
        "ledger",
        "star",
        "concepts",
      ]);
      return tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag): tag is HelixAskTopicTag => allowed.has(tag as HelixAskTopicTag));
    };
    const mergeTopicTags = (
      base: HelixAskTopicTag[],
      extra: HelixAskTopicTag[],
    ): HelixAskTopicTag[] => Array.from(new Set([...base, ...extra]));
    const mergeTopicProfileMustInclude = (
      profile: HelixAskTopicProfile | null,
      files: string[],
    ): HelixAskTopicProfile | null => {
      if (files.length === 0) return profile;
      const escapeRegExp = (value: string): string =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const normalizedFiles = files
        .map((file) => file.replace(/\\/g, "/").trim())
        .filter(Boolean);
      if (normalizedFiles.length === 0) return profile;
      const filePatterns = normalizedFiles.map(
        (file) => new RegExp(escapeRegExp(file), "i"),
      );
      if (!profile) {
        return {
          tags: [],
          allowlistTiers: [[]],
          boostPaths: [],
          deboostPaths: [],
          mustIncludePaths: filePatterns,
          mustIncludeFiles: normalizedFiles,
          minTierCandidates: 0,
        };
      }
      const mustIncludeFiles = Array.from(
        new Set([...(profile.mustIncludeFiles ?? []), ...normalizedFiles]),
      );
      const mustIncludePaths = Array.from(new Set([...profile.mustIncludePaths, ...filePatterns]));
      return {
        ...profile,
        mustIncludeFiles,
        mustIncludePaths,
      };
    };
    const conceptTopicTags = normalizeConceptTags(conceptMatch?.card.topicTags);
    if (conceptTopicTags.length > 0) {
      const merged = mergeTopicTags(topicTags, conceptTopicTags);
      if (merged.length !== topicTags.length) {
        topicTags = merged;
        topicProfile = buildHelixAskTopicProfile(topicTags);
        logEvent(
          "Topic tags",
          "concept",
          conceptTopicTags.length ? conceptTopicTags.join(", ") : "none",
        );
        if (debugPayload) {
          debugPayload.topic_tags = topicTags.slice();
        }
        if (topicProfile && debugPayload) {
          debugPayload.topic_allowlist_tiers = topicProfile.allowlistTiers.length;
          debugPayload.topic_must_include_files = topicProfile.mustIncludeFiles?.slice();
        }
      }
    }
    if (conceptMatch?.card.mustIncludeFiles?.length) {
      topicProfile = mergeTopicProfileMustInclude(
        topicProfile,
        conceptMatch.card.mustIncludeFiles,
      );
      if (topicProfile && debugPayload) {
        debugPayload.topic_must_include_files = topicProfile.mustIncludeFiles?.slice();
      }
    }
    const evidenceSignalTokens = Array.from(
      new Set(
        [
          ...topicTags.map((tag) => tag.replace(/_/g, " ")),
          conceptMatch?.card.id ?? "",
          conceptMatch?.card.label ?? "",
          ...(conceptMatch?.card.aliases ?? []),
        ]
          .map((token) => token.trim())
          .filter(Boolean),
      ),
    );
    const conceptFastPath =
      Boolean(conceptMatch) &&
      conceptualFocus &&
      intentDomain === "repo" &&
      HELIX_ASK_CONCEPT_FAST_PATH_INTENTS.has(intentProfile.id);
    if (conceptFastPath) {
      if (debugPayload) {
        debugPayload.concept_fast_path = true;
        debugPayload.concept_fast_path_reason = intentProfile.id;
        debugPayload.concept_fast_path_source = conceptMatch?.card.sourcePath;
      }
      answerPath.push("concept_fast_path");
      logEvent(
        "Concept fast path",
        "enabled",
        [
          `intent=${intentProfile.id}`,
          conceptMatch?.card.sourcePath ? `source=${conceptMatch.card.sourcePath}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      );
    }
    verificationAnchorRequired = shouldRequireVerificationAnchors(
      intentProfile,
      baseQuestion,
      conceptMatch,
    ) || shouldRequireVerificationAnchors(originalIntentProfile, baseQuestion, conceptMatch);
    if (verificationAnchorRequired) {
      verificationAnchorHints = buildVerificationAnchorHints(baseQuestion);
    }
    if (debugPayload) {
      debugPayload.verification_anchor_required = verificationAnchorRequired;
    }
    if (!promptIngested && intentDomain === "general" && baseQuestion) {
      mathSolveResult = await solveHelixAskMathQuestion(baseQuestion);
      if (mathSolveResult?.ok) {
        formatSpec = { format: "brief", stageTags: false };
      }
      if (debugPayload && mathSolveResult) {
        debugPayload.math_solver_ok = mathSolveResult.ok;
        debugPayload.math_solver_kind = mathSolveResult.kind;
        debugPayload.math_solver_final = mathSolveResult.final;
        debugPayload.math_solver_reason = mathSolveResult.reason;
        debugPayload.math_solver_variable = mathSolveResult.variable;
        debugPayload.math_solver_gate_pass = mathSolveResult.gatePass;
        debugPayload.math_solver_gate_reason = mathSolveResult.gateReason;
        debugPayload.math_solver_domain_pass = mathSolveResult.domainPass;
        debugPayload.math_solver_residual_pass = mathSolveResult.residualPass;
        debugPayload.math_solver_residual_max = mathSolveResult.residualMax;
        debugPayload.math_solver_registry_id = mathSolveResult.registryId;
        debugPayload.math_solver_selected_solution = mathSolveResult.selectedSolution;
        debugPayload.math_solver_admissible_count = mathSolveResult.admissibleSolutions?.length;
        debugPayload.math_solver_maturity = mathSolveResult.maturityStage;
      }
    }
    let evidenceText = "";
    let evidenceGateOk = true;
    let constraintEvidenceText = "";
    let constraintEvidenceRefs: string[] = [];
    const mathSolverOk = mathSolveResult?.ok === true;
    if (mathSolveResult && mathSolveResult.ok) {
      forcedAnswer = buildHelixAskMathAnswer(mathSolveResult);
      answerPath.push("forcedAnswer:math_solver");
    }
    if (conceptFastPath && conceptMatch && !forcedAnswer) {
      const conceptAnswer =
        intentProfile.id === "repo.ideology_reference"
          ? buildHelixAskIdeologyAnswer(conceptMatch)
          : renderConceptDefinition(conceptMatch);
      if (conceptAnswer) {
        forcedAnswer = conceptAnswer;
        answerPath.push(
          intentProfile.id === "repo.ideology_reference"
            ? "forcedAnswer:ideology"
            : "forcedAnswer:concept",
        );
      }
    }
    const shouldRunConstraintLoop =
      !dryRun && (intentStrategy === "constraint_report" || compositeConstraintRequested);
    if (!shouldRunConstraintLoop && (intentStrategy === "constraint_report" || compositeConstraintRequested)) {
      logEvent("Constraint loop", "skipped", "dry_run");
    }
    if (shouldRunConstraintLoop) {
      const constraintStart = Date.now();
      const constraintIntentId =
        intentStrategy === "constraint_report"
          ? intentProfile.id
          : originalIntentProfile.strategy === "constraint_report"
            ? originalIntentProfile.id
            : "falsifiable.constraints.gr_viability_certificate";
      const label =
        intentStrategy === "constraint_report"
          ? intentProfile.label ?? intentProfile.id
          : constraintIntentId;
      logProgress("Constraint loop", label, constraintStart);
      answerPath.push("constraint:loop");
      let constraintEvidence: ConstraintEvidenceResult | null = null;
      if (constraintIntentId.includes("analysis_noise_field")) {
        constraintEvidence = buildNoiseFieldEvidence();
      } else if (constraintIntentId.includes("analysis_diffusion_field")) {
        constraintEvidence = buildDiffusionEvidence();
      } else if (constraintIntentId.includes("belief_graph_consistency")) {
        constraintEvidence = buildBeliefGraphEvidence();
      } else {
        constraintEvidence = await buildGrViabilityEvidence();
      }
      constraintEvidenceText = constraintEvidence?.evidenceText ?? "";
      constraintEvidenceRefs = constraintEvidence?.refs?.slice() ?? [];
      if (debugPayload && constraintEvidenceText) {
        debugPayload.constraint_evidence = constraintEvidenceText;
      }
      if (intentStrategy === "constraint_report") {
        evidenceText = constraintEvidenceText;
        if (debugPayload) {
          debugPayload.evidence_cards = evidenceText || undefined;
          if (constraintEvidenceRefs.length) {
            debugPayload.context_files = constraintEvidenceRefs.slice();
          }
        }
        if (constraintEvidenceRefs.length) {
          contextFiles = constraintEvidenceRefs.slice();
        }
        if (intentProfile.id.includes("gr_viability_certificate")) {
          const traceAnswer = buildWarpConstraintAnswer(evidenceText, baseQuestion, verbosity);
          if (traceAnswer) {
            forcedAnswer = traceAnswer;
            answerPath.push("forcedAnswer:constraint_report");
          }
        }
        prompt = ensureFinalMarker(
          buildHelixAskConstraintPrompt(
            baseQuestion || question || "Report constraint status.",
            evidenceText,
            formatSpec.format,
            formatSpec.stageTags,
          ),
        );
      } else if (compositeConstraintRequested && constraintEvidenceText) {
        answerPath.push("constraint:evidence");
      }
      logProgress("Constraint evidence ready", label, constraintStart);
    }
    if (!isRepoQuestion) {
      contextText = "";
      contextFiles = [];
    }
    if (compositeConstraintRequested && constraintEvidenceRefs.length) {
      const merged = new Set(contextFiles);
      constraintEvidenceRefs.forEach((entry) => merged.add(entry));
      contextFiles = Array.from(merged);
      if (debugPayload) {
        debugPayload.context_files = contextFiles.slice();
      }
    }
    if (promptIngested && intentStrategy !== "constraint_report") {
      prompt = undefined;
    }
    const deferAutoContext =
      isRepoQuestion &&
      (repoExpectationLevel !== "low" || requiresRepoEvidence) &&
      !promptIngested;
    if (debugPayload) {
      debugPayload.context_deferred = deferAutoContext;
    }
    if (!prompt && question && intentStrategy !== "constraint_report") {
        if (!contextText && isRepoQuestion && !deferAutoContext) {
          const contextStart = Date.now();
          contextText = await buildAskContext(
            question,
            parsed.data.searchQuery,
            parsed.data.topK,
            topicProfile,
          );
          contextFiles = extractFilePathsFromText(contextText);
          logProgress("Context ready", "auto", contextStart);
          logEvent(
            "Context ready",
            "auto",
            formatFileList(extractFilePathsFromText(contextText)),
            contextStart,
          );
        } else if (!contextText && isRepoQuestion && deferAutoContext) {
          logEvent(
            "Context deferred",
            "plan_pass",
            `expectation=${repoExpectationLevel}`,
          );
        }
        if (compositeRequest.enabled && isRepoQuestion) {
          const compositeStart = Date.now();
          const compositeFiles = new Set(contextFiles);
          const compositeContexts: string[] = [];
          const compositeTags = compositeRequest.topics.slice(0, 4);
          const searchSeed = parsed.data.searchQuery?.trim() || baseQuestion;
          for (const tag of compositeTags) {
            const profile = buildHelixAskTopicProfile([tag]);
            if (!profile) continue;
            const tagQueries = buildHelixAskSearchQueries(searchSeed, [tag]);
            if (!tagQueries.length) continue;
            const tagResult = await buildAskContextFromQueries(
              baseQuestion,
              tagQueries,
              parsed.data.topK,
              profile,
            );
            if (tagResult.context) {
              compositeContexts.push(tagResult.context);
            }
            tagResult.files.forEach((entry) => compositeFiles.add(entry));
          }
          if (compositeContexts.length) {
            const mergedContext = [contextText, ...compositeContexts].filter(Boolean).join("\n\n");
            contextText = mergedContext;
            contextFiles = Array.from(compositeFiles);
            logProgress("Composite context ready", `${compositeTags.length} tags`, compositeStart);
            logEvent(
              "Composite context ready",
              compositeTags.join(", "),
              formatFileList(contextFiles),
              compositeStart,
            );
          }
          const filteredComposite = filterCompositeContext(contextText);
          if (filteredComposite) {
            contextText = filteredComposite;
            contextFiles = extractFilePathsFromText(filteredComposite);
          }
          if (compositeRequiredFiles.length) {
            const requiredHeader = [
              "Required composite anchors (cite when relevant):",
              ...compositeRequiredFiles.map((entry) => `- ${entry}`),
              "",
            ].join("\n");
            contextText = `${requiredHeader}${contextText}`;
          }
        }
      const basePrompt = isRepoQuestion
        ? buildGroundedAskPrompt(question, contextText, formatSpec.format, formatSpec.stageTags)
        : buildGeneralAskPrompt(question, formatSpec.format, formatSpec.stageTags);
      prompt = ensureFinalMarker(basePrompt);
    }
    if (!prompt) {
      responder.send(400, {
        error: "bad_request",
        details: [{ path: ["prompt"], message: "prompt required" }],
      });
      return;
    }

    const forcePlanPass =
      repoExpectationLevel !== "low" || requiresRepoEvidence || conceptFastPath;
    const microPassDecision = decideHelixAskMicroPass(baseQuestion, formatSpec);
    const skipMicroPass = intentStrategy === "constraint_report" || mathSolverOk;
    const microPassEnabled =
      !skipMicroPass && (microPassDecision.enabled || promptIngested || forcePlanPass);
    const microPassReason =
      forcePlanPass && !microPassDecision.enabled && !promptIngested
        ? "repo_expectation"
        : promptIngested && !microPassDecision.enabled
      ? "prompt_ingest"
      : microPassDecision.reason;
    const microPassStage = skipMicroPass
      ? mathSolverOk
        ? "math solver"
        : "constraint report"
      : microPassEnabled
        ? "micro-pass"
        : "single-pass";
    logEvent(
      "Plan",
      microPassStage,
      [
        `intent=${intentProfile.id}`,
        `strategy=${intentStrategy}`,
        `format=${formatSpec.format}`,
        `verbosity=${verbosity}`,
        `microPass=${microPassEnabled ? microPassReason : "off"}`,
        `conceptFastPath=${conceptFastPath ? "yes" : "no"}`,
      ].join(" | "),
    );
    let result: LocalAskResult;
    let generalScaffold = "";
    let repoScaffold = "";
    let promptScaffold = "";
    let topicMustIncludeOk: boolean | undefined;
    let conceptAnswer: string | null = null;
    let pipelineEvidence: string | null = null;
    let planPassStart: number | null = null;
    let planDirectives: HelixAskPlanDirectives | null = null;
    let planScope: HelixAskPlanScope | null = null;
    let clarifyOverride: string | undefined;
    let requiredSlots: string[] = [];

    if (debugPayload && skipMicroPass) {
      debugPayload.micro_pass = false;
      debugPayload.micro_pass_reason = mathSolverOk ? "math_solver" : "constraint_report";
    }
    if (debugPayload) {
      debugPayload.plan_pass_used = microPassEnabled;
      debugPayload.plan_pass_forced = forcePlanPass;
    }

    if (microPassEnabled) {
      planPassStart = Date.now();
      logEvent(
        "Plan pass",
        "start",
        [
          `intent=${intentProfile.id}`,
          `expectation=${repoExpectationLevel}`,
          `forced=${forcePlanPass ? "yes" : "no"}`,
          `verbosity=${verbosity}`,
        ].join(" | "),
        planPassStart,
      );
      if (debugPayload) {
        debugPayload.micro_pass = true;
        debugPayload.micro_pass_auto = microPassDecision.auto;
        debugPayload.micro_pass_reason = conceptFastPath
          ? "concept_fast_path"
          : isRepoQuestion
            ? microPassReason
            : promptIngested
              ? "prompt_ingest"
              : "general";
      }
      const conceptScaffold = conceptMatch ? buildConceptScaffold(conceptMatch) : "";
      const hasConceptScaffold = Boolean(conceptScaffold);
      if (hasConceptScaffold) {
        generalScaffold = conceptScaffold;
        const conceptStart = Date.now();
        logProgress("Concept card ready", conceptMatch?.card.id, conceptStart);
        logEvent("Concept card ready", conceptMatch?.card.id, conceptScaffold, conceptStart);
      }
      if (hasConceptScaffold && intentDomain === "general") {
        conceptAnswer = renderConceptAnswer(conceptMatch);
      }
      let wantsHybrid = intentStrategy === "hybrid_explain";
      let forceHybridNoEvidence = false;
      if (isRepoQuestion) {
        let queryHints: string[] = [];
        if (!dryRun) {
          if (conceptFastPath) {
            logEvent("Query hints ready", "skipped", "concept_fast_path");
          } else {
            try {
              const queryStart = Date.now();
              const conceptSkeleton =
                intentProfile.id === "hybrid.concept_plus_system_mapping"
                  ? buildHybridConceptSkeleton(baseQuestion, conceptMatch)
                  : [];
              const queryPrompt = buildHelixAskQueryPrompt(baseQuestion, {
                conceptSkeleton,
                anchorHints: verificationAnchorRequired ? verificationAnchorHints : [],
              });
              const { result: queryResult, overflow: queryOverflow } =
                await runHelixAskLocalWithOverflowRetry(
                  {
                    prompt: queryPrompt,
                    max_tokens: HELIX_ASK_QUERY_TOKENS,
                    temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                    seed: parsed.data.seed,
                    stop: parsed.data.stop,
                  },
                  {
                    personaId,
                    sessionId: parsed.data.sessionId,
                    traceId: askTraceId,
                  },
                  {
                    fallbackMaxTokens: HELIX_ASK_QUERY_TOKENS,
                    allowContextDrop: true,
                    label: "query_hints",
                  },
                );
              recordOverflow("query_hints", queryOverflow);
              const planParse = parsePlanDirectives(queryResult.text ?? "");
              planDirectives = planParse.directives;
              queryHints = planParse.queryHints;
              if (verificationAnchorHints.length > 0) {
                queryHints = mergeHelixAskQueries(
                  queryHints,
                  verificationAnchorHints,
                  HELIX_ASK_QUERY_HINTS_MAX,
                );
              }
              logProgress("Query hints ready", `${queryHints.length} hints`, queryStart);
              logEvent(
                "Query hints ready",
                `${queryHints.length} hints`,
                queryHints.length ? queryHints.map((hint) => `- ${hint}`).join("\n") : undefined,
                queryStart,
              );
              if (planDirectives) {
                const directiveSummary = [
                  planDirectives.preferredSurfaces.length
                    ? `preferred=${planDirectives.preferredSurfaces.join(",")}`
                    : "",
                  planDirectives.avoidSurfaces.length ? `avoid=${planDirectives.avoidSurfaces.join(",")}` : "",
                  planDirectives.mustIncludeGlobs.length
                    ? `must=${planDirectives.mustIncludeGlobs.join(",")}`
                    : "",
                  planDirectives.requiredSlots.length
                    ? `slots=${planDirectives.requiredSlots.join(",")}`
                    : "",
                  planDirectives.clarifyQuestion ? "clarify=provided" : "",
                ]
                  .filter(Boolean)
                  .join(" | ");
                logEvent("Plan directives", "ok", directiveSummary || "none", queryStart);
              }
            } catch {
              queryHints = [];
            }
          }
        }
        if (debugPayload && queryHints.length > 0) {
          debugPayload.query_hints = queryHints;
        }
        if (debugPayload && planDirectives) {
          debugPayload.plan_directives = planDirectives;
        }

        const searchSeed = parsed.data.searchQuery?.trim() || baseQuestion;
        const baseQueries = buildHelixAskSearchQueries(searchSeed, topicTags);
        if (conceptMatch?.card.sourcePath) {
          baseQueries.push(conceptMatch.card.sourcePath);
        }
        const queries = mergeHelixAskQueries(baseQueries, queryHints, HELIX_ASK_QUERY_MERGE_MAX);
        if (debugPayload && queries.length > 0) {
          debugPayload.queries = queries;
        }
        if (queries.length > 0) {
          logEvent(
            "Queries merged",
            `${queries.length} queries`,
            queries.map((query) => `- ${query}`).join("\n"),
          );
        }
        if (!planScope) {
          planScope = buildPlanScope({
            directives: planDirectives,
            topicTags,
            requiresRepoEvidence,
            repoExpectationLevel,
            question: baseQuestion,
          });
          if (debugPayload) {
            debugPayload.docs_first_enabled = planScope.docsFirst ?? false;
            debugPayload.plan_scope_allowlist_tiers = planScope.allowlistTiers?.length ?? 0;
            debugPayload.plan_scope_avoidlist = planScope.avoidlist?.length ?? 0;
            debugPayload.plan_scope_must_include = planScope.mustIncludeGlobs?.length ?? 0;
          }
          if (planScope.allowlistTiers?.length || planScope.avoidlist?.length) {
            logEvent(
              "Retrieval scope",
              "ok",
              [
                planScope.allowlistTiers?.length ? `allowlistTiers=${planScope.allowlistTiers.length}` : "",
                planScope.avoidlist?.length ? `avoidlist=${planScope.avoidlist.length}` : "",
                planScope.mustIncludeGlobs?.length ? `mustIncludeGlobs=${planScope.mustIncludeGlobs.length}` : "",
                `docsFirst=${planScope.docsFirst ? "yes" : "no"}`,
              ]
                .filter(Boolean)
                .join(" | "),
            );
          } else if (planScope.docsFirst) {
            logEvent("Retrieval scope", "ok", "docsFirst=yes");
          }
        }
        if (!requiredSlots.length) {
          if (planDirectives?.requiredSlots?.length) {
            requiredSlots = planDirectives.requiredSlots.slice(0, 6);
          } else if (intentStrategy === "hybrid_explain" && (requiresRepoEvidence || intentDomain === "hybrid")) {
            requiredSlots = ["definition", "repo_mapping"];
            if (verificationAnchorRequired) {
              requiredSlots.push("verification");
            }
          } else if (verificationAnchorRequired) {
            requiredSlots = ["verification", "repo_mapping"];
          }
        }
        if (requiredSlots.length > 0) {
          const allowVerification =
            verificationAnchorRequired || /verify|verification|gate|constraint|certificate|integrity_ok|audit/i.test(baseQuestion);
          const allowFailure =
            /fail|failure|retry|repair|clarify|fallback|when .* fail/i.test(baseQuestion);
          requiredSlots = requiredSlots.filter((slot) => {
            if (slot === "verification" && !allowVerification) return false;
            if (slot === "failure_path" && !allowFailure) return false;
            return true;
          });
        }

        let contextMeta: {
          files: string[];
          topicTier?: number;
          topicMustIncludeOk?: boolean;
          queryHitCount?: number;
          topScore?: number;
          scoreGap?: number;
          channelHits?: AskCandidateChannelStats;
          channelTopScores?: AskCandidateChannelStats;
        } = {
          files: contextFiles.slice(),
          queryHitCount: 0,
          topScore: 0,
          scoreGap: 0,
          channelHits: initAskChannelStats(),
          channelTopScores: initAskChannelStats(),
        };

        if (!contextText) {
          const contextStart = Date.now();
          const fallbackLimit = clampNumber(
            parsed.data.topK ?? HELIX_ASK_CONTEXT_FILES,
            1,
            HELIX_ASK_CONTEXT_FILES,
          );
          let contextResult:
            | {
                context: string;
                files: string[];
                topicTier?: number;
                topicMustIncludeOk?: boolean;
                queryHitCount?: number;
                topScore?: number;
                scoreGap?: number;
                channelHits?: AskCandidateChannelStats;
                channelTopScores?: AskCandidateChannelStats;
              }
            | undefined;
          let docsFirstOk = false;
          if (planScope?.docsFirst && planScope.docsAllowlist?.length) {
            const docsScope = await buildAskContextFromQueries(
              baseQuestion,
              queries,
              parsed.data.topK,
              topicProfile,
              {
                allowlistTiers: planScope.docsAllowlist,
                avoidlist: planScope.avoidlist,
                overrideAllowlist: true,
              },
            );
            const planMustIncludeOk =
              planScope.mustIncludeGlobs?.length
                ? docsScope.files.some((filePath) =>
                    pathMatchesAny(filePath, planScope.mustIncludeGlobs ?? []),
                  )
                : true;
            docsFirstOk = docsScope.files.length > 0 && planMustIncludeOk;
            logEvent(
              "Docs-first scope",
              docsFirstOk ? "ok" : "miss",
              [
                `files=${docsScope.files.length}`,
                `mustInclude=${planMustIncludeOk ? "ok" : "missing"}`,
              ].join(" | "),
              contextStart,
            );
            if (debugPayload) {
              debugPayload.docs_first_used = true;
              debugPayload.docs_first_ok = docsFirstOk;
            }
            if (docsFirstOk) {
              contextResult = docsScope;
            } else if (requiresRepoEvidence) {
              const docsAllowlist = (planScope.docsAllowlist ?? []).flat();
              const grepCandidates = collectDocsGrepCandidates(queries, baseQuestion, {
                allowlist: docsAllowlist,
                avoidlist: planScope.avoidlist,
                limit: 160,
              });
              if (grepCandidates.length > 0) {
                const selected = selectCandidatesWithMmr(
                  grepCandidates,
                  fallbackLimit,
                  HELIX_ASK_MMR_LAMBDA,
                );
                const topScore = selected[0]?.score ?? 0;
                const scoreGap =
                  selected.length >= 2 ? Math.max(0, topScore - selected[1].score) : topScore;
                const normalizedTop = topScore > 0 ? Math.min(1, topScore / 100) : 0;
                const normalizedGap = scoreGap > 0 ? Math.min(1, scoreGap / 100) : 0;
                const channelHits = initAskChannelStats();
                channelHits.lexical = selected.length ? 1 : 0;
                const channelTopScores = initAskChannelStats();
                channelTopScores.lexical = normalizedTop;
                contextResult = buildAskContextFromCandidates({
                  selected,
                  topicTier: 0,
                  topicMustIncludeOk: planMustIncludeOk,
                  queryHitCount: selected.length ? 1 : 0,
                  topScore: normalizedTop,
                  scoreGap: normalizedGap,
                  channelHits,
                  channelTopScores,
                });
                logEvent(
                  "Docs grep fallback",
                  "ok",
                  `hits=${grepCandidates.length}`,
                  contextStart,
                );
                if (debugPayload) {
                  debugPayload.docs_grep_hits = grepCandidates.length;
                }
              } else {
                logEvent("Docs grep fallback", "miss", "hits=0", contextStart);
                if (debugPayload) {
                  debugPayload.docs_grep_hits = 0;
                }
              }
            }
          }
          if (!contextResult) {
            contextResult = await buildAskContextFromQueries(
              baseQuestion,
              queries,
              parsed.data.topK,
              topicProfile,
              planScope ?? undefined,
            );
          }
          contextText = contextResult.context;
          contextFiles = contextResult.files.slice();
          topicMustIncludeOk = contextResult.topicMustIncludeOk;
          contextMeta = contextResult;
          logProgress("Context ready", `${contextResult.files.length} files`, contextStart);
          logEvent(
            "Context ready",
            `${contextResult.files.length} files`,
            formatFileList(contextResult.files),
            contextStart,
          );
          if (topicProfile) {
            if (contextResult.topicTier) {
              logEvent(
                "Allowlist tier",
                `tier=${contextResult.topicTier}`,
                `mustInclude=${contextResult.topicMustIncludeOk ? "ok" : "missing"}`,
                contextStart,
              );
            } else {
              logEvent("Allowlist tier", "none", "no topic tier selected", contextStart);
            }
          }
          if (debugPayload && contextResult.files.length > 0) {
            debugPayload.context_files = contextResult.files;
          }
          if (debugPayload) {
            if (contextResult.topicTier) {
              debugPayload.topic_tier = contextResult.topicTier;
            }
            if (typeof contextResult.topicMustIncludeOk === "boolean") {
              debugPayload.topic_must_include_ok = contextResult.topicMustIncludeOk;
            }
          }
        }

        const baseEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
          minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
          minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
          signalTokens: evidenceSignalTokens,
        });
        let evidenceGate = baseEvidenceGate;
        const evidenceCritic =
          HELIX_ASK_EVIDENCE_CRITIC
            ? evaluateEvidenceCritic(baseQuestion, contextText, {
                minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                signalTokens: evidenceSignalTokens,
              })
            : null;
        if (evidenceCritic && evidenceCritic.tokenCount > 0) {
          evidenceGate = evidenceCritic;
        }
        if (debugPayload && HELIX_ASK_EVIDENCE_CRITIC) {
          debugPayload.evidence_critic_applied = true;
          if (evidenceCritic) {
            debugPayload.evidence_critic_ok = evidenceCritic.ok;
            debugPayload.evidence_critic_ratio = evidenceCritic.matchRatio;
            debugPayload.evidence_critic_count = evidenceCritic.matchCount;
            debugPayload.evidence_critic_tokens = evidenceCritic.tokenCount;
          }
        }
        const viabilityFocus = HELIX_ASK_VIABILITY_FOCUS.test(baseQuestion);
        const viabilityMustIncludeOk =
          !viabilityFocus ||
          pathMatchesAny(contextText, [HELIX_ASK_VIABILITY_PATHS]) ||
          extractFilePathsFromText(contextText).some((filePath) =>
            HELIX_ASK_VIABILITY_PATHS.test(filePath),
          ) ||
          (compositeConstraintRequested &&
            constraintEvidenceRefs.some((filePath) => HELIX_ASK_VIABILITY_PATHS.test(filePath)));
        const verificationAnchorOk =
          !verificationAnchorRequired ||
          pathMatchesAny(contextText, HELIX_ASK_VERIFICATION_ANCHOR_PATHS) ||
          extractFilePathsFromText(contextText).some((filePath) =>
            pathMatchesAny(filePath, HELIX_ASK_VERIFICATION_ANCHOR_PATHS),
          );
        let mustIncludeOk =
          typeof topicMustIncludeOk === "boolean"
            ? topicMustIncludeOk
            : topicMustIncludeSatisfied(extractFilePathsFromText(contextText), topicProfile);
        if (verificationAnchorRequired && !verificationAnchorOk) {
          mustIncludeOk = false;
        }
        const contextFilesSnapshot = extractFilePathsFromText(contextText);
        const planMustIncludeOk =
          planScope?.mustIncludeGlobs?.length
            ? contextFilesSnapshot.some((filePath) => pathMatchesAny(filePath, planScope?.mustIncludeGlobs ?? []))
            : true;
        if (!planMustIncludeOk) {
          mustIncludeOk = false;
        }
        const slotCoverage = requiredSlots.length
          ? evaluateSlotCoverage({ contextText, requiredSlots, conceptMatch })
          : { required: [], covered: [], missing: [], ratio: 1 };
        const slotCoverageOk = slotCoverage.missing.length === 0;
        if (requiredSlots.length && !slotCoverageOk) {
          mustIncludeOk = false;
          evidenceGate = { ...evidenceGate, ok: false };
        }
        const repoSearchPlan = buildRepoSearchPlan({
          question: baseQuestion,
          topicTags,
          conceptMatch,
          intentDomain,
          evidenceGateOk: evidenceGate.ok,
          promptIngested,
          topicProfile,
        });
        if (repoSearchPlan) {
          const searchStart = Date.now();
          logEvent(
            "Repo search",
            "start",
            `terms=${repoSearchPlan.terms.join(",")}`,
            searchStart,
          );
          const repoSearchResult: RepoSearchResult = await runRepoSearch(repoSearchPlan);
          if (repoSearchResult.hits.length > 0) {
            const formatted = formatRepoSearchEvidence(repoSearchResult);
            contextText = [contextText, formatted.evidenceText].filter(Boolean).join("\n\n");
            if (formatted.filePaths.length > 0) {
              contextFiles = Array.from(new Set([...contextFiles, ...formatted.filePaths]));
            }
            const repoEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
              minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
              minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
              signalTokens: evidenceSignalTokens,
            });
            evidenceGate = repoEvidenceGate;
            if (HELIX_ASK_EVIDENCE_CRITIC) {
              const repoCritic = evaluateEvidenceCritic(baseQuestion, contextText, {
                minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                signalTokens: evidenceSignalTokens,
              });
              if (repoCritic.tokenCount > 0) {
                evidenceGate = repoCritic;
              }
              if (debugPayload) {
                debugPayload.evidence_critic_applied = true;
                debugPayload.evidence_critic_ok = repoCritic.ok;
                debugPayload.evidence_critic_ratio = repoCritic.matchRatio;
                debugPayload.evidence_critic_count = repoCritic.matchCount;
                debugPayload.evidence_critic_tokens = repoCritic.tokenCount;
              }
            }
            mustIncludeOk = topicProfile
              ? topicMustIncludeSatisfied(extractFilePathsFromText(contextText), topicProfile)
              : mustIncludeOk;
            logEvent(
              "Repo search",
              repoSearchResult.truncated ? "truncated" : "ok",
              `hits=${repoSearchResult.hits.length}`,
              searchStart,
            );
          } else {
            const note = repoSearchResult.error ?? "no_hits";
            logEvent("Repo search", "empty", note, searchStart);
          }
          if (debugPayload) {
            debugPayload.repo_search_terms = repoSearchPlan.terms;
            debugPayload.repo_search_paths = repoSearchPlan.paths;
            debugPayload.repo_search_reason = repoSearchPlan.reason;
            debugPayload.repo_search_explicit = repoSearchPlan.explicit;
            debugPayload.repo_search_hits = repoSearchResult.hits.length;
            debugPayload.repo_search_truncated = repoSearchResult.truncated;
            if (repoSearchResult.error) {
              debugPayload.repo_search_error = repoSearchResult.error;
            }
          }
        }
        const queryHitCount = contextMeta.queryHitCount ?? 0;
        const topScore = contextMeta.topScore ?? 0;
        const scoreGap = contextMeta.scoreGap ?? 0;
        const channelHits = contextMeta.channelHits ?? initAskChannelStats();
        const channelTopScores = contextMeta.channelTopScores ?? initAskChannelStats();
        const docsHits = contextFilesSnapshot.filter((filePath) => /(^|\/)docs\//i.test(filePath));
        const docShare = contextFilesSnapshot.length
          ? docsHits.length / contextFilesSnapshot.length
          : 0;
        const channelCoverage =
          HELIX_ASK_CHANNELS.filter((channel) => channelHits[channel] > 0).length / HELIX_ASK_CHANNELS.length;
        let retrievalConfidence = evidenceGate.matchRatio;
        if (mustIncludeOk) retrievalConfidence += 0.15;
        if (viabilityMustIncludeOk) retrievalConfidence += 0.05;
        if (verificationAnchorRequired && verificationAnchorOk) retrievalConfidence += 0.1;
        if (contextFilesSnapshot.length >= 5) retrievalConfidence += 0.05;
        if (docShare >= 0.4) retrievalConfidence += 0.1;
        if (queryHitCount >= 2) retrievalConfidence += 0.05;
        if (channelCoverage >= 0.67) retrievalConfidence += 0.05;
        if (scoreGap >= 0.02 || topScore >= 0.05) retrievalConfidence += 0.05;
        if (evidenceGate.matchCount === 0) retrievalConfidence = 0;
        retrievalConfidence = Math.min(1, Math.max(0, retrievalConfidence));
        if (debugPayload) {
          debugPayload.topic_must_include_ok = mustIncludeOk;
          debugPayload.viability_must_include_ok = viabilityMustIncludeOk;
          debugPayload.verification_anchor_ok = verificationAnchorOk;
          debugPayload.plan_must_include_ok = planMustIncludeOk;
        }
        evidenceGateOk = evidenceGate.ok;
        if (debugPayload) {
          debugPayload.evidence_gate_ok = evidenceGate.ok;
          debugPayload.evidence_match_ratio = evidenceGate.matchRatio;
          debugPayload.evidence_match_count = evidenceGate.matchCount;
          debugPayload.evidence_token_count = evidenceGate.tokenCount;
          debugPayload.retrieval_confidence = retrievalConfidence;
          debugPayload.retrieval_doc_share = docShare;
          debugPayload.retrieval_doc_hits = docsHits.length;
          debugPayload.retrieval_context_file_count = contextFilesSnapshot.length;
          debugPayload.retrieval_query_hit_count = queryHitCount;
          debugPayload.retrieval_top_score = topScore;
          debugPayload.retrieval_score_gap = scoreGap;
          debugPayload.retrieval_channel_hits = channelHits;
          debugPayload.retrieval_channel_top_scores = channelTopScores;
          debugPayload.slot_coverage_required = slotCoverage.required;
          debugPayload.slot_coverage_missing = slotCoverage.missing;
          debugPayload.slot_coverage_ratio = slotCoverage.ratio;
          debugPayload.slot_coverage_ok = slotCoverageOk;
        }
        if (requiredSlots.length > 0) {
          logEvent(
            "Slot coverage",
            slotCoverageOk ? "ok" : "missing",
            [
              `ratio=${slotCoverage.ratio.toFixed(2)}`,
              slotCoverage.missing.length ? `missing=${slotCoverage.missing.join(",")}` : "missing=none",
            ].join(" | "),
          );
        }
        logEvent(
          "Evidence gate",
          evidenceGate.ok ? "pass" : "fail",
          [
            `match=${evidenceGate.matchCount}/${evidenceGate.tokenCount}`,
            `ratio=${evidenceGate.matchRatio.toFixed(2)}`,
            `mustInclude=${mustIncludeOk ? "ok" : "missing"}`,
            `planMust=${planMustIncludeOk ? "ok" : "missing"}`,
            `viability=${viabilityMustIncludeOk ? "ok" : "missing"}`,
            `verifyAnchors=${verificationAnchorRequired ? (verificationAnchorOk ? "ok" : "missing") : "n/a"}`,
          ].join(" | "),
        );
        logEvent(
          "Retrieval confidence",
          retrievalConfidence >= 0.6 ? "high" : retrievalConfidence >= 0.35 ? "med" : "low",
          [
            `score=${retrievalConfidence.toFixed(2)}`,
            `docShare=${docShare.toFixed(2)}`,
            `files=${contextFilesSnapshot.length}`,
            `queries=${queryHitCount}`,
          ].join(" | "),
        );
        logEvent(
          "Retrieval channels",
          "ok",
          [
            `hits=lex:${channelHits.lexical},sym:${channelHits.symbol},fuz:${channelHits.fuzzy}`,
            `tops=lex:${channelTopScores.lexical.toFixed(2)},sym:${channelTopScores.symbol.toFixed(
              2,
            )},fuz:${channelTopScores.fuzzy.toFixed(2)}`,
          ].join(" | "),
        );
        const arbiterHybridThreshold = Math.min(arbiterRepoRatio, arbiterHybridRatio);
        const shouldRetryRetrieval =
          HELIX_ASK_RETRIEVAL_RETRY_ENABLED &&
          !promptIngested &&
          hasRepoHints &&
          retrievalConfidence < arbiterHybridThreshold;
        if (shouldRetryRetrieval) {
          const retryStart = Date.now();
          const retryHints = [
            ...(topicProfile?.mustIncludeFiles ?? []),
            ...compositeRequiredFiles,
            ...verificationAnchorHints,
          ];
          const retryQueries = mergeHelixAskQueries(
            baseQueries,
            retryHints,
            HELIX_ASK_QUERY_MERGE_MAX + 4,
          );
          const retryTopK = Math.min(
            HELIX_ASK_CONTEXT_FILES,
            (parsed.data.topK ?? HELIX_ASK_CONTEXT_FILES) + retryTopKBonus,
          );
          const retryResult = await buildAskContextFromQueries(
            baseQuestion,
            retryQueries,
            retryTopK,
            topicProfile,
            planScope ?? undefined,
          );
          if (retryResult.context) {
            contextText = retryResult.context;
            contextFiles = retryResult.files.slice();
            topicMustIncludeOk = retryResult.topicMustIncludeOk;
            const retryEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
              minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
              minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
              signalTokens: evidenceSignalTokens,
            });
            evidenceGate = retryEvidenceGate;
            if (HELIX_ASK_EVIDENCE_CRITIC) {
              const retryCritic = evaluateEvidenceCritic(baseQuestion, contextText, {
                minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                signalTokens: evidenceSignalTokens,
              });
              if (retryCritic.tokenCount > 0) {
                evidenceGate = retryCritic;
              }
              if (debugPayload) {
                debugPayload.evidence_critic_applied = true;
                debugPayload.evidence_critic_ok = retryCritic.ok;
                debugPayload.evidence_critic_ratio = retryCritic.matchRatio;
                debugPayload.evidence_critic_count = retryCritic.matchCount;
                debugPayload.evidence_critic_tokens = retryCritic.tokenCount;
              }
            }
            mustIncludeOk =
              typeof topicMustIncludeOk === "boolean"
                ? topicMustIncludeOk
                : topicMustIncludeSatisfied(extractFilePathsFromText(contextText), topicProfile);
            const retryFiles = extractFilePathsFromText(contextText);
            const retryPlanMustIncludeOk =
              planScope?.mustIncludeGlobs?.length
                ? retryFiles.some((filePath) => pathMatchesAny(filePath, planScope?.mustIncludeGlobs ?? []))
                : true;
            if (!retryPlanMustIncludeOk) {
              mustIncludeOk = false;
            }
            const retrySlotCoverage = requiredSlots.length
              ? evaluateSlotCoverage({ contextText, requiredSlots, conceptMatch })
              : { required: [], covered: [], missing: [], ratio: 1 };
            const retrySlotCoverageOk = retrySlotCoverage.missing.length === 0;
            if (requiredSlots.length && !retrySlotCoverageOk) {
              mustIncludeOk = false;
              evidenceGate = { ...evidenceGate, ok: false };
            }
            const retryQueryHits = retryResult.queryHitCount ?? 0;
            const retryTopScore = retryResult.topScore ?? 0;
            const retryScoreGap = retryResult.scoreGap ?? 0;
            const retryChannelHits = retryResult.channelHits ?? initAskChannelStats();
            const retryChannelTopScores = retryResult.channelTopScores ?? initAskChannelStats();
            const retryDocs = retryFiles.filter((filePath) => /(^|\/)docs\//i.test(filePath));
            const retryDocShare = retryFiles.length ? retryDocs.length / retryFiles.length : 0;
            const retryChannelCoverage =
              HELIX_ASK_CHANNELS.filter((channel) => retryChannelHits[channel] > 0).length /
              HELIX_ASK_CHANNELS.length;
            retrievalConfidence = evidenceGate.matchRatio;
            if (mustIncludeOk) retrievalConfidence += 0.15;
            if (viabilityMustIncludeOk) retrievalConfidence += 0.05;
            if (verificationAnchorRequired && verificationAnchorOk) retrievalConfidence += 0.1;
            if (retryFiles.length >= 5) retrievalConfidence += 0.05;
            if (retryDocShare >= 0.4) retrievalConfidence += 0.1;
            if (retryQueryHits >= 2) retrievalConfidence += 0.05;
            if (retryChannelCoverage >= 0.67) retrievalConfidence += 0.05;
            if (retryScoreGap >= 0.02 || retryTopScore >= 0.05) retrievalConfidence += 0.05;
            if (evidenceGate.matchCount === 0) retrievalConfidence = 0;
            retrievalConfidence = Math.min(1, Math.max(0, retrievalConfidence));
            evidenceGateOk = evidenceGate.ok;
            if (debugPayload) {
              debugPayload.evidence_gate_ok = evidenceGate.ok;
              debugPayload.evidence_match_ratio = evidenceGate.matchRatio;
              debugPayload.evidence_match_count = evidenceGate.matchCount;
              debugPayload.evidence_token_count = evidenceGate.tokenCount;
              debugPayload.context_files = retryResult.files;
              debugPayload.queries = retryQueries;
              debugPayload.retrieval_confidence = retrievalConfidence;
              debugPayload.retrieval_doc_share = retryDocShare;
              debugPayload.retrieval_doc_hits = retryDocs.length;
              debugPayload.retrieval_context_file_count = retryFiles.length;
              debugPayload.retrieval_query_hit_count = retryQueryHits;
              debugPayload.retrieval_top_score = retryTopScore;
              debugPayload.retrieval_score_gap = retryScoreGap;
              debugPayload.retrieval_channel_hits = retryChannelHits;
              debugPayload.retrieval_channel_top_scores = retryChannelTopScores;
              debugPayload.plan_must_include_ok = retryPlanMustIncludeOk;
              debugPayload.slot_coverage_required = retrySlotCoverage.required;
              debugPayload.slot_coverage_missing = retrySlotCoverage.missing;
              debugPayload.slot_coverage_ratio = retrySlotCoverage.ratio;
              debugPayload.slot_coverage_ok = retrySlotCoverageOk;
            }
            logProgress(
              "Context retry ready",
              `${retryResult.files.length} files`,
              retryStart,
            );
            logEvent(
              "Retrieval retry",
              `match=${evidenceGate.matchCount}/${evidenceGate.tokenCount}`,
              [
                `ratio=${evidenceGate.matchRatio.toFixed(2)}`,
                `mustInclude=${mustIncludeOk ? "ok" : "missing"}`,
                `files=${retryResult.files.length}`,
              ].join(" | "),
              retryStart,
            );
            logEvent(
              "Retrieval confidence",
              retrievalConfidence >= 0.6 ? "high" : retrievalConfidence >= 0.35 ? "med" : "low",
              [
                `score=${retrievalConfidence.toFixed(2)}`,
                `docShare=${retryDocShare.toFixed(2)}`,
                `files=${retryFiles.length}`,
                `queries=${retryQueryHits}`,
              ].join(" | "),
              retryStart,
            );
            if (requiredSlots.length > 0) {
              logEvent(
                "Slot coverage",
                retrySlotCoverageOk ? "ok" : "missing",
                [
                  `ratio=${retrySlotCoverage.ratio.toFixed(2)}`,
                  retrySlotCoverage.missing.length
                    ? `missing=${retrySlotCoverage.missing.join(",")}`
                    : "missing=none",
                ].join(" | "),
                retryStart,
              );
            }
            logEvent(
              "Retrieval channels",
              "ok",
              [
                `hits=lex:${retryChannelHits.lexical},sym:${retryChannelHits.symbol},fuz:${retryChannelHits.fuzzy}`,
                `tops=lex:${retryChannelTopScores.lexical.toFixed(2)},sym:${retryChannelTopScores.symbol.toFixed(
                  2,
                )},fuz:${retryChannelTopScores.fuzzy.toFixed(2)}`,
              ].join(" | "),
              retryStart,
            );
          } else {
            logEvent("Retrieval retry", "no_context", "retry yielded empty context", retryStart);
          }
        }
        requiresRepoEvidence =
          requiresRepoEvidence || intentDomain === "repo" || intentDomain === "falsifiable";
        const userExpectsRepo =
          intentDomain === "falsifiable" || requiresRepoEvidence;
        const hasHighStakesConstraints =
          intentTier === "F3" ||
          intentStrategy === "constraint_report" ||
          compositeConstraintRequested;
        const arbiterDecision = resolveHelixAskArbiter({
          retrievalConfidence,
          repoThreshold: arbiterRepoRatio,
          hybridThreshold: arbiterHybridRatio,
          mustIncludeOk,
          viabilityMustIncludeOk,
          topicMustIncludeOk,
          conceptMatch,
          hasRepoHints,
          topicTags,
          verificationAnchorRequired,
          verificationAnchorOk,
          userExpectsRepo,
          hasHighStakesConstraints,
          explicitRepoExpectation,
          intentDomain,
        });
        const arbiterMode = arbiterDecision.mode;
        const arbiterReason = arbiterDecision.reason;
        const arbiterStrictness = arbiterDecision.strictness;
        const arbiterRepoOk = arbiterDecision.repoOk;
        const arbiterHybridOk = arbiterDecision.hybridOk;
        logEvent(
          "Arbiter",
          arbiterMode,
          [
            `reason=${arbiterReason}`,
            `expectation=${repoExpectationLevel}`,
            `score=${repoExpectationScore}`,
          ].join(" | "),
        );
        if (debugPayload) {
          debugPayload.arbiter_mode = arbiterMode;
          debugPayload.arbiter_reason = arbiterReason;
          debugPayload.arbiter_strictness = arbiterStrictness;
          debugPayload.arbiter_user_expects_repo = userExpectsRepo;
          debugPayload.requires_repo_evidence = requiresRepoEvidence;
          debugPayload.arbiter_repo_ok = arbiterRepoOk;
          debugPayload.arbiter_hybrid_ok = arbiterHybridOk;
          debugPayload.arbiter_ratio = arbiterDecision.ratio;
          debugPayload.arbiter_topic_ok = arbiterDecision.topicOk;
          debugPayload.arbiter_concept_match = arbiterDecision.conceptMatch;
        }
        const softExpansionAllowed =
          softExpansionBudget > 0 &&
          (arbiterMode === "repo_grounded" || arbiterMode === "hybrid") &&
          evidenceGate.matchRatio >= arbiterRepoRatio;
        if (!softExpansionAllowed) {
          softExpansionBudget = 0;
        }
        if (debugPayload) {
          debugPayload.soft_expansion = softExpansionBudget;
        }
        answerPath.push(`arbiter:${arbiterMode}`);
        if (arbiterMode === "hybrid" || arbiterMode === "clarify") {
          const fallbackProfile = resolveFallbackIntentProfile("hybrid");
          intentProfile = fallbackProfile;
          intentDomain = fallbackProfile.domain;
          intentTier = fallbackProfile.tier;
          intentSecondaryTier = fallbackProfile.secondaryTier;
          intentStrategy = fallbackProfile.strategy;
          formatSpec = resolveHelixAskFormat(baseQuestion, intentProfile, debugEnabled);
          if (hasTwoParagraphContract(baseQuestion)) {
            formatSpec = { format: "compare", stageTags: false };
          }
          if (intentStrategy === "hybrid_explain" && formatSpec.format !== "steps") {
            formatSpec = { ...formatSpec, stageTags: false };
          }
          intentReason = `${intentReasonBase}|arbiter:${arbiterMode}`;
          if (!mustIncludeOk) {
            if (verificationAnchorRequired && !verificationAnchorOk) {
              intentReason = `${intentReason}|anchor_gate:missing_verification`;
            } else {
              intentReason = `${intentReason}|topic_gate:missing_core`;
            }
          } else if (!viabilityMustIncludeOk) {
            intentReason = `${intentReason}|viability_gate:missing_core`;
          } else if (!evidenceGate.ok) {
            intentReason = `${intentReason}|evidence_gate:no_repo_evidence`;
          }
          updateIntentDebug();
          wantsHybrid = true;
          isRepoQuestion = true;
          if (arbiterMode === "clarify") {
            forceHybridNoEvidence = true;
            contextText = "";
            contextFiles = [];
            logEvent("Fallback", "clarify (arbiter)", intentReason);
            logEvent("Clarify", "arbiter", baseQuestion);
            if (debugPayload) {
              debugPayload.clarify_triggered = true;
            }
          } else {
            logEvent("Fallback", "hybrid (arbiter)", intentReason);
          }
        } else if (arbiterMode === "general") {
          const fallbackProfile = resolveFallbackIntentProfile("general");
          intentProfile = fallbackProfile;
          intentDomain = fallbackProfile.domain;
          intentTier = fallbackProfile.tier;
          intentSecondaryTier = fallbackProfile.secondaryTier;
          intentStrategy = fallbackProfile.strategy;
          formatSpec = resolveHelixAskFormat(baseQuestion, intentProfile, debugEnabled);
          if (hasTwoParagraphContract(baseQuestion)) {
            formatSpec = { format: "compare", stageTags: false };
          }
          intentReason = `${intentReasonBase}|arbiter:general`;
          updateIntentDebug();
          isRepoQuestion =
            intentProfile.evidencePolicy.allowRepoCitations &&
            (intentDomain === "repo" || intentDomain === "hybrid");
          wantsHybrid = intentStrategy === "hybrid_explain";
          if (!isRepoQuestion) {
            contextText = "";
            contextFiles = [];
          }
          logEvent("Fallback", `intent -> ${fallbackProfile.id}`, intentReason);
        }

        if (compositeConstraintRequested) {
          intentSecondaryTier = "F3";
          updateIntentDebug();
        }

        if (debugPayload && promptContextFiles.length > 0) {
          const existing = new Set(debugPayload.context_files ?? []);
          promptContextFiles.forEach((entry) => existing.add(entry));
          debugPayload.context_files = Array.from(existing);
        }
        if (promptContextFiles.length > 0) {
          const merged = new Set(contextFiles);
          promptContextFiles.forEach((entry) => merged.add(entry));
          contextFiles = Array.from(merged);
        }
      }

      if (isRepoQuestion && !dryRun) {
        const combinedContext = wantsHybrid
          ? contextText
          : [promptContextText, contextText].filter(Boolean).join("\n\n");
        const evidenceContext = clipAskText(combinedContext, HELIX_ASK_SCAFFOLD_CONTEXT_CHARS);
        if (conceptFastPath && conceptMatch) {
          const evidenceStart = Date.now();
          const conceptScaffold = buildConceptScaffold(conceptMatch);
          const conceptSources = conceptMatch.card.sourcePath ? [conceptMatch.card.sourcePath] : [];
          if (conceptSources.length > 0) {
            contextFiles = Array.from(new Set([...contextFiles, ...conceptSources]));
            if (debugPayload) {
              debugPayload.context_files = contextFiles.slice();
            }
          }
          repoScaffold = appendEvidenceSources(conceptScaffold, contextFiles, 6, contextText);
          logProgress("Evidence cards ready", repoScaffold ? "concept" : "empty", evidenceStart);
          logEvent(
            "Evidence cards ready",
            repoScaffold ? "concept" : "empty",
            repoScaffold,
            evidenceStart,
          );
        } else if (evidenceContext) {
          const evidenceStart = Date.now();
          const evidencePrompt = buildHelixAskEvidencePrompt(
            baseQuestion,
            evidenceContext,
            formatSpec.format,
            formatSpec.stageTags,
            compositeRequest.enabled,
            verificationAnchorRequired ? verificationAnchorHints : [],
          );
          const { result: evidenceResult, overflow: evidenceOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: evidencePrompt,
                max_tokens: evidenceTokens,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                seed: parsed.data.seed,
                stop: parsed.data.stop,
              },
              {
                personaId,
                sessionId: parsed.data.sessionId,
                traceId: askTraceId,
              },
              {
                fallbackMaxTokens: evidenceTokens,
                allowContextDrop: true,
                label: "repo_evidence",
              },
            );
          recordOverflow("repo_evidence", evidenceOverflow);
          repoScaffold = normalizeScaffoldText(
            stripPromptEchoFromAnswer(evidenceResult.text ?? "", baseQuestion),
          );
          if (repoScaffold && !formatSpec.stageTags) {
            repoScaffold = stripStageTags(repoScaffold);
          }
          if (repoScaffold) {
            repoScaffold = appendEvidenceSources(repoScaffold, contextFiles, 6, contextText);
          }
          if (compositeRequest.enabled && compositeRequiredFiles.length && debugPayload) {
            const missing = compositeRequiredFiles.filter(
              (entry) => entry && !repoScaffold.toLowerCase().includes(entry.toLowerCase()),
            );
            if (missing.length) {
              debugPayload.composite_topics = [
                ...(debugPayload.composite_topics ?? []),
                "missing_anchors",
              ];
            }
          }
          logProgress(
            "Evidence cards ready",
            repoScaffold ? "ok" : "empty",
            evidenceStart,
          );
          logEvent(
            "Evidence cards ready",
            repoScaffold ? "repo" : "empty",
            repoScaffold,
            evidenceStart,
          );
        }
      }

      if ((!isRepoQuestion || wantsHybrid) && !dryRun) {
        if (promptContextText) {
          const evidenceStart = Date.now();
          const evidencePrompt = buildHelixAskPromptEvidencePrompt(
            baseQuestion,
            promptContextText,
            formatSpec.format,
            formatSpec.stageTags,
          );
          const { result: evidenceResult, overflow: promptOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: evidencePrompt,
                max_tokens: HELIX_ASK_LONGPROMPT_CARD_TOKENS,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                seed: parsed.data.seed,
                stop: parsed.data.stop,
              },
              {
                personaId,
                sessionId: parsed.data.sessionId,
                traceId: askTraceId,
              },
              {
                fallbackMaxTokens: HELIX_ASK_LONGPROMPT_CARD_TOKENS,
                allowContextDrop: true,
                label: "prompt_evidence",
              },
            );
          recordOverflow("prompt_evidence", promptOverflow);
          promptScaffold = normalizeScaffoldText(
            stripPromptEchoFromAnswer(evidenceResult.text ?? "", baseQuestion),
          );
          if (promptScaffold && !formatSpec.stageTags) {
            promptScaffold = stripStageTags(promptScaffold);
          }
          logProgress(
            "Prompt context cards ready",
            promptScaffold ? "ok" : "empty",
            evidenceStart,
          );
          const promptRefs = formatFileList(promptContextFiles);
          const promptEventText = [promptScaffold, promptRefs ? `Prompt refs:\n${promptRefs}` : ""]
            .filter(Boolean)
            .join("\n\n");
          logEvent(
            "Prompt context cards ready",
            promptScaffold ? "ok" : "empty",
            promptEventText,
            evidenceStart,
          );
          if (debugPayload && promptContextFiles.length > 0) {
            const existing = new Set(debugPayload.context_files ?? []);
            promptContextFiles.forEach((entry) => existing.add(entry));
            debugPayload.context_files = Array.from(existing);
          }
          if (promptContextFiles.length > 0) {
            const merged = new Set(contextFiles);
            promptContextFiles.forEach((entry) => merged.add(entry));
            contextFiles = Array.from(merged);
          }
        } else if (!hasConceptScaffold) {
          const evidenceStart = Date.now();
          const evidencePrompt = buildGeneralAskEvidencePrompt(
            baseQuestion,
            formatSpec.format,
            formatSpec.stageTags,
          );
          const { result: evidenceResult, overflow: generalOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: evidencePrompt,
                max_tokens: evidenceTokens,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                seed: parsed.data.seed,
                stop: parsed.data.stop,
              },
              {
                personaId,
                sessionId: parsed.data.sessionId,
                traceId: askTraceId,
              },
              {
                fallbackMaxTokens: evidenceTokens,
                allowContextDrop: true,
                label: "general_evidence",
              },
            );
          recordOverflow("general_evidence", generalOverflow);
          generalScaffold = normalizeScaffoldText(
            stripPromptEchoFromAnswer(evidenceResult.text ?? "", baseQuestion),
          );
          if (generalScaffold && !formatSpec.stageTags) {
            generalScaffold = stripStageTags(generalScaffold);
          }
          logProgress(
            "Reasoning scaffold ready",
            generalScaffold ? "ok" : "empty",
            evidenceStart,
          );
          logEvent(
            "Reasoning scaffold ready",
            generalScaffold ? "ok" : "empty",
            generalScaffold,
            evidenceStart,
          );
        }
      }

      let claimCoverage: ReturnType<typeof evaluateClaimCoverage> | null = null;
      let claimGateFailed = false;
      if (
        HELIX_ASK_EVIDENCE_CLAIM_GATE &&
        (repoScaffold || promptScaffold || generalScaffold)
      ) {
        const claimSource = repoScaffold || promptScaffold || generalScaffold;
        const claimContext = promptIngested ? promptContextText : contextText;
        const claims = extractClaimCandidates(claimSource, HELIX_ASK_EVIDENCE_CLAIM_MAX);
        if (claims.length > 0 && claimContext) {
          claimCoverage = evaluateClaimCoverage(claims, claimContext, {
            minTokens: HELIX_ASK_EVIDENCE_CLAIM_MIN_TOKENS,
            minRatio: HELIX_ASK_EVIDENCE_CLAIM_MIN_RATIO,
            minSupportRatio: HELIX_ASK_EVIDENCE_CLAIM_SUPPORT_RATIO,
            signalTokens: evidenceSignalTokens,
          });
          if (debugPayload) {
            debugPayload.evidence_claim_count = claimCoverage.claimCount;
            debugPayload.evidence_claim_supported = claimCoverage.supportedCount;
            debugPayload.evidence_claim_unsupported = claimCoverage.unsupported.length;
            debugPayload.evidence_claim_ratio = claimCoverage.supportRatio;
            debugPayload.evidence_claim_gate_ok = claimCoverage.ok;
            debugPayload.evidence_claim_missing = claimCoverage.unsupported.slice(0, 3);
          }
          claimGateFailed = !claimCoverage.ok;
          if (!claimCoverage.ok && (intentDomain === "repo" || intentDomain === "hybrid")) {
            forceHybridNoEvidence = true;
          }
        }
      }

      const ambiguityTerms = HELIX_ASK_AMBIGUITY_GATE
        ? extractAmbiguousTerms(
            baseQuestion,
            [contextText, promptContextText].filter(Boolean).join("\n"),
            conceptMatch,
          )
        : [];
      if (debugPayload && ambiguityTerms.length > 0) {
        debugPayload.ambiguity_terms = ambiguityTerms.slice();
      }
      if (ambiguityTerms.length > 0) {
        clarifyOverride = buildAmbiguityClarifyLine(ambiguityTerms);
        if (debugPayload) {
          debugPayload.ambiguity_gate_applied = true;
        }
      }
      const shouldClarifyNow =
        !promptIngested &&
        (intentDomain === "repo" || intentDomain === "hybrid") &&
        requiresRepoEvidence &&
        (claimGateFailed || (!evidenceGateOk && ambiguityTerms.length > 0));
      if (shouldClarifyNow && !forcedAnswer && intentStrategy !== "constraint_report") {
        forcedAnswer = clarifyOverride ?? buildAmbiguityClarifyLine([]);
        answerPath.push("clarify:ambiguity");
      }

      const generalEvidence = promptScaffold || generalScaffold;
      if (intentStrategy === "hybrid_explain" && generalEvidence) {
        const hasRepoEvidence = !forceHybridNoEvidence && Boolean(repoScaffold.trim());
        if (conceptMatch) {
          const coreSentences: string[] = [];
          if (conceptMatch.card.definition) {
            coreSentences.push(ensureSentence(conceptMatch.card.definition));
          }
          if (conceptMatch.card.keyQuestions) {
            coreSentences.push(
              ensureSentence(`Key questions include: ${conceptMatch.card.keyQuestions}`),
            );
          }
          if (conceptMatch.card.notes) {
            coreSentences.push(ensureSentence(conceptMatch.card.notes));
          }
          const paragraph1 = coreSentences.join(" ").trim();
          let paragraph2 = "";
          if (hasRepoEvidence) {
            paragraph2 = collapseEvidenceBullets(repoScaffold);
          } else {
            paragraph2 =
              "No repo evidence was found for this system mapping; please point to the relevant files or modules.";
          }
          let inPractice = "";
          if (conceptMatch.card.notes) {
            inPractice = ensureSentence(
              "In practice, those standards guide how evidence and justification are weighed in specific contexts.",
            );
          } else {
            inPractice = ensureSentence(
              "In practice, verification emphasizes repeatable checks and falsifiable evidence.",
            );
          }
          forcedAnswer = [paragraph1, paragraph2, inPractice].filter(Boolean).join("\n\n");
        }
        const hybridPrompt = buildHelixAskHybridPrompt(
          baseQuestion,
          generalEvidence,
          repoScaffold,
          hasRepoEvidence,
          formatSpec.format,
          formatSpec.stageTags,
          constraintEvidenceText,
          compositeRequest.enabled,
        );
        prompt = ensureFinalMarker(hybridPrompt);
        evidenceText = [repoScaffold, generalEvidence, constraintEvidenceText]
          .filter(Boolean)
          .join("\n\n");
        if (debugPayload) {
          const cards: string[] = [];
          if (generalEvidence) {
            cards.push(`General reasoning:\n${generalEvidence}`);
          }
          if (repoScaffold) {
            cards.push(`Repo evidence:\n${repoScaffold}`);
          }
          if (constraintEvidenceText) {
            cards.push(`Constraint evidence:\n${constraintEvidenceText}`);
          }
          if (cards.length) {
            debugPayload.evidence_cards = cards.join("\n\n");
          }
        }
        logEvent(
          "Synthesis prompt ready",
          "hybrid",
          [
            `repoEvidence=${hasRepoEvidence ? "yes" : "no"}`,
            `generalEvidence=${generalEvidence ? "yes" : "no"}`,
          ].join(" | "),
        );
      } else if (isRepoQuestion && repoScaffold) {
        if (intentProfile.id === "repo.ideology_reference" && conceptMatch && !forcedAnswer) {
          forcedAnswer = buildHelixAskIdeologyAnswer(conceptMatch);
          answerPath.push("forcedAnswer:ideology");
        }
        if (intentProfile.id === "repo.helix_ask_pipeline_explain") {
          forcedAnswer = buildHelixAskPipelineAnswer();
          pipelineEvidence = buildHelixAskPipelineEvidence();
          answerPath.push("forcedAnswer:helix_pipeline");
        }
        prompt = ensureFinalMarker(
          buildHelixAskSynthesisPrompt(
            baseQuestion,
            repoScaffold,
            formatSpec.format,
            formatSpec.stageTags,
            softExpansionBudget,
          ),
        );
        evidenceText = pipelineEvidence ?? repoScaffold;
        if (debugPayload && repoScaffold) {
          debugPayload.evidence_cards = pipelineEvidence ?? repoScaffold;
        }
        logEvent(
          "Synthesis prompt ready",
          "repo",
          formatFileList(extractFilePathsFromText(evidenceText)),
        );
      } else if (promptScaffold) {
        prompt = ensureFinalMarker(
          buildHelixAskPromptSynthesisPrompt(
            baseQuestion,
            promptScaffold,
            formatSpec.format,
            formatSpec.stageTags,
            softExpansionBudget,
          ),
        );
        evidenceText = promptScaffold;
        if (debugPayload && promptScaffold) {
          debugPayload.evidence_cards = promptScaffold;
        }
        logEvent(
          "Synthesis prompt ready",
          "prompt context",
          formatFileList(promptContextFiles) ?? promptScaffold,
        );
      } else if (generalScaffold) {
        prompt = ensureFinalMarker(
          buildGeneralAskSynthesisPrompt(
            baseQuestion,
            generalScaffold,
            formatSpec.format,
            formatSpec.stageTags,
          ),
        );
        if (debugPayload && generalScaffold) {
          debugPayload.evidence_cards = generalScaffold;
        }
        logEvent(
          "Synthesis prompt ready",
          "general",
          generalScaffold,
        );
      } else if (baseQuestion) {
        prompt = ensureFinalMarker(buildGeneralAskPrompt(baseQuestion, formatSpec.format, formatSpec.stageTags));
      }
    } else if (!skipMicroPass && !dryRun) {
      const useTwoPass =
        HELIX_ASK_TWO_PASS &&
        Boolean(questionValue) &&
        HELIX_ASK_TWO_PASS_TRIGGER.test(questionValue ?? "");
      if (useTwoPass) {
        if (debugPayload) {
          debugPayload.two_pass = true;
        }
        const extractedContext = extractContextFromPrompt(prompt);
        if (extractedContext) {
          const scaffoldStart = Date.now();
          const scaffoldContext = clipAskText(extractedContext, HELIX_ASK_SCAFFOLD_CONTEXT_CHARS);
          const scaffoldPrompt = buildHelixAskScaffoldPrompt(
            questionValue ?? "",
            scaffoldContext,
            formatSpec.format,
            formatSpec.stageTags,
          );
          const scaffoldMaxTokens = Math.min(
            scaffoldTokens,
            parsed.data.max_tokens ?? scaffoldTokens,
          );
          const { result: scaffoldResult, overflow: scaffoldOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: scaffoldPrompt,
                max_tokens: scaffoldMaxTokens,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                seed: parsed.data.seed,
                stop: parsed.data.stop,
              },
              {
                personaId,
                sessionId: parsed.data.sessionId,
                traceId: askTraceId,
              },
              {
                fallbackMaxTokens: scaffoldMaxTokens,
                allowContextDrop: true,
                label: "two_pass_scaffold",
              },
            );
          recordOverflow("two_pass_scaffold", scaffoldOverflow);
          logProgress("Scaffold ready", "two-pass", scaffoldStart);
          let scaffoldText = normalizeScaffoldText(
            stripPromptEchoFromAnswer(scaffoldResult.text ?? "", questionValue ?? ""),
          );
          if (scaffoldText && !formatSpec.stageTags) {
            scaffoldText = stripStageTags(scaffoldText);
          }
          if (scaffoldText) {
            if (debugPayload) {
              debugPayload.scaffold = scaffoldText;
            }
            prompt = ensureFinalMarker(
              buildHelixAskSynthesisPrompt(
                questionValue ?? "",
                scaffoldText,
                formatSpec.format,
                formatSpec.stageTags,
                softExpansionBudget,
              ),
            );
          }
        }
      }
    }

    if (dryRun) {
      const dryPayload: LocalAskResult = { text: "", prompt_ingested: promptIngested };
      if (promptIngested) {
        if (promptIngestSource) {
          dryPayload.prompt_ingest_source = promptIngestSource;
        }
        if (promptIngestReason) {
          dryPayload.prompt_ingest_reason = promptIngestReason;
        }
      }
      const responsePayload = debugPayload
        ? { ...dryPayload, debug: debugPayload, dry_run: true }
        : { ...dryPayload, dry_run: true };
      responder.send(200, responsePayload);
      return;
    }

    if (planPassStart !== null) {
      logEvent(
        "Plan pass",
        "end",
        `intent=${intentProfile.id}`,
        planPassStart,
      );
    }
    const answerStart = Date.now();
    logProgress("Generating answer");
    if (conceptAnswer || forcedAnswer) {
      result = { text: forcedAnswer ?? conceptAnswer ?? "" } as LocalAskResult;
      logProgress("Answer ready", "concept", answerStart);
      answerPath.push("answer:forced");
    } else {
      logDebug("llmLocalHandler MAIN start", {
        maxTokens: parsed.data.max_tokens ?? null,
        temperature: parsed.data.temperature ?? null,
      });
      const answerFallbackTokens = parsed.data.max_tokens ?? scaffoldTokens;
      const { result: answerResult, overflow: answerOverflow } =
        await runHelixAskLocalWithOverflowRetry(
          {
            prompt,
            max_tokens: parsed.data.max_tokens,
            temperature: parsed.data.temperature,
            seed: parsed.data.seed,
            stop: parsed.data.stop,
          },
          {
            personaId,
            sessionId: parsed.data.sessionId,
            traceId: askTraceId,
            onToken: streamEmitter.onToken,
          },
          {
            fallbackMaxTokens: answerFallbackTokens,
            allowContextDrop: true,
            label: "answer",
          },
        );
      recordOverflow("answer", answerOverflow);
      result = answerResult as LocalAskResult;
      logDebug("llmLocalHandler MAIN complete", {
        textLength: typeof result.text === "string" ? result.text.length : 0,
      });
      logProgress("Answer ready", undefined, answerStart);
      answerPath.push("answer:llm");
    }

    let cleanedText: string | undefined;
    if (typeof result.text === "string" && result.text.trim()) {
      let cleaned = formatHelixAskAnswer(stripPromptEchoFromAnswer(result.text, baseQuestion));
      const rawPreview = clipAskText(
        stripPromptEchoFromAnswer(result.text, baseQuestion)
          .replace(/\s+/g, " ")
          .trim(),
        240,
      );
      if (rawPreview) {
        logEvent("Answer raw preview", "llm", rawPreview, answerStart);
      }
      const enforceFormat =
        formatEnforcementLevel === "strict" || intentDomain !== "hybrid";
      if (enforceFormat) {
        cleaned = enforceHelixAskAnswerFormat(cleaned, formatSpec.format, baseQuestion);
      }
      cleaned = stripTruncationMarkers(cleaned);
      if (!cleaned.trim()) {
        const fallback = stripPromptEchoFromAnswer(result.text, baseQuestion);
        cleaned = fallback.trim() ? fallback.trim() : result.text.trim();
        cleaned = stripTruncationMarkers(cleaned);
      }
      const allowCitationRepair =
        (microPassEnabled || intentStrategy === "constraint_report") &&
        intentProfile.id !== "repo.ideology_reference";
      if (allowCitationRepair) {
        const evidenceForRepair = appendEvidenceSources(evidenceText, contextFiles, 6, contextText);
        if (evidenceForRepair !== evidenceText) {
          evidenceText = evidenceForRepair;
        }
        const hasEvidencePaths = extractFilePathsFromText(evidenceText).length > 0;
        const hasAnswerPaths = extractFilePathsFromText(cleaned).length > 0;
        if (hasEvidencePaths && !hasAnswerPaths) {
          const repairStart = Date.now();
          logDebug("llmLocalHandler CITATION_REPAIR start", {
            maxTokens: repairTokens,
            temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
          });
          const repairPrompt = buildHelixAskCitationRepairPrompt(
            baseQuestion,
            cleaned,
            evidenceText,
            formatSpec.format,
            formatSpec.stageTags,
          );
          const { result: repairResult, overflow: repairOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: repairPrompt,
                max_tokens: repairTokens,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.4),
                seed: parsed.data.seed,
                stop: parsed.data.stop,
              },
              {
                personaId,
                sessionId: parsed.data.sessionId,
                traceId: askTraceId,
              },
              {
                fallbackMaxTokens: repairTokens,
                allowContextDrop: true,
                label: "citation_repair",
              },
            );
          recordOverflow("citation_repair", repairOverflow);
          logDebug("llmLocalHandler CITATION_REPAIR complete", {
            textLength: typeof repairResult.text === "string" ? repairResult.text.length : 0,
          });
          const repaired = stripPromptEchoFromAnswer(repairResult.text ?? "", baseQuestion);
          if (repaired.trim()) {
            cleaned = repaired;
            if (debugPayload) {
              debugPayload.citation_repair = true;
            }
            answerPath.push("citationRepair:applied");
            logProgress("Citation repair", "applied", repairStart);
            logEvent(
              "Citation repair",
              "applied",
              formatFileList(extractFilePathsFromText(cleaned)),
              repairStart,
            );
          }
        } else {
          answerPath.push(hasAnswerPaths ? "citationRepair:skipped(grounded)" : "citationRepair:skipped(no_evidence)");
        }
      } else {
        answerPath.push("citationRepair:skipped(intent)");
      }
      if (extractFilePathsFromText(cleaned).length === 0) {
        const evidencePaths = extractFilePathsFromText(evidenceText).slice(0, 6);
        if (evidencePaths.length) {
          cleaned = `${cleaned}\n\nSources: ${evidencePaths.join(", ")}`;
          answerPath.push("citationFallback:sources");
        }
      }
      const hasRepoEvidence = intentStrategy === "hybrid_explain" && Boolean(repoScaffold.trim());
      const allowHybridFallback = formatEnforcementLevel === "strict";
      const hasRepoCitations = () =>
        extractFilePathsFromText(cleaned).length > 0 || hasSourcesLine(cleaned);
      const hasHybridPlaceholder =
        /(map to this system|repo evidence bullets|paragraph\s*2|paragraph\s*1)/i.test(cleaned);
      if (allowHybridFallback && hasRepoEvidence && (!hasRepoCitations() || hasHybridPlaceholder)) {
        const generalEvidence = promptScaffold || generalScaffold;
        let paragraph1 = "";
        if (generalEvidence) {
          const collapsed = collapseEvidenceBullets(generalEvidence);
          const stripped = stripPromptEchoFromAnswer(generalEvidence, baseQuestion)
            .replace(/^question:\s*/i, "")
            .trim();
          paragraph1 = clipAskText(collapsed || stripped, 420);
        }
        let paragraph2 = collapseEvidenceBullets(repoScaffold);
        if (paragraph2 && extractFilePathsFromText(paragraph2).length === 0) {
          const repoPaths = extractFilePathsFromText(repoScaffold).slice(0, 6);
          if (repoPaths.length) {
            paragraph2 = `${paragraph2} (${repoPaths.join(", ")})`;
          }
        }
        const fallback = [paragraph1, paragraph2].filter(Boolean).join("\n\n").trim();
        if (fallback) {
          cleaned = fallback;
          answerPath.push("hybridFallback:repoEvidence");
        }
      }
      if (!formatSpec.stageTags) {
        cleaned = stripStageTags(cleaned);
      }
      const repoEvidencePaths = resolveEvidencePaths(evidenceText, contextFiles, contextText, 6);
      if (requiresRepoEvidence && !hasRepoCitations()) {
        if (repoEvidencePaths.length) {
          cleaned = `${cleaned}\n\nSources: ${repoEvidencePaths.join(", ")}`;
          answerPath.push("citationFallback:sources");
        } else {
          const generalEvidence = promptScaffold || generalScaffold;
          let paragraph1 = "";
          if (generalEvidence) {
            const collapsed = collapseEvidenceBullets(generalEvidence);
            const stripped = stripPromptEchoFromAnswer(generalEvidence, baseQuestion)
              .replace(/^question:\s*/i, "")
              .trim();
            paragraph1 = clipAskText(collapsed || stripped, 420);
          }
          const planClarify = (clarifyOverride ?? planDirectives?.clarifyQuestion ?? "").trim();
          const clarifyLine =
            planClarify && /(file|doc|module|path|repo|codebase|where)/i.test(planClarify)
              ? planClarify
              : "Repo evidence was required by the question but could not be confirmed. Please point to the relevant files or clarify the term.";
          const paragraph2 = clarifyLine;
          const clarified = [paragraph1, paragraph2].filter(Boolean).join("\n\n").trim();
          cleaned = clarified || paragraph2;
          answerPath.push("obligation:missing_repo_evidence");
          logEvent("Obligation", "missing_repo_evidence", baseQuestion);
          if (debugPayload) {
            debugPayload.obligation_violation = true;
          }
        }
      }
      if (
        intentDomain === "repo" &&
        !hasRepoCitations()
      ) {
        if (repoEvidencePaths.length) {
          cleaned = `${cleaned}\n\nSources: ${repoEvidencePaths.join(", ")}`;
          answerPath.push("citationFallback:sources");
          logProgress("Citation missing", "repaired");
          logEvent("Citation missing", "repaired", formatFileList(repoEvidencePaths));
        } else {
          cleaned =
            "Repo evidence was available but the answer could not be grounded with file citations. Please point to the relevant files or narrow the request.";
          logProgress("Citation missing", "fallback");
          logEvent("Citation missing", "fallback", formatFileList(repoEvidencePaths));
        }
      }
      let endpointGuardApplied = false;
      let endpointGuardMessage: string | null = null;
      if (
        HELIX_ASK_ENDPOINT_GUARD &&
        (intentDomain === "repo" || intentDomain === "hybrid")
      ) {
        const endpointHints = extractEndpointHints(baseQuestion);
        if (endpointHints.length > 0) {
          const anchorPaths = extractEndpointAnchorPaths(evidenceText, endpointHints);
          const answerPaths = extractFilePathsFromText(cleaned);
          const answerPathSet = new Set(answerPaths.map((entry) => entry.toLowerCase()));
          const anchorSet = new Set(anchorPaths.map((entry) => entry.toLowerCase()));
          const hasAnchorCitation = Array.from(anchorSet).some((entry) => answerPathSet.has(entry));
          if (anchorPaths.length === 0) {
            endpointGuardMessage =
              "Repo evidence did not include the endpoint path requested. Please point to the relevant files or paste the route snippet.";
            cleaned = endpointGuardMessage;
            endpointGuardApplied = true;
            logProgress("Endpoint anchor", "missing");
            logEvent("Endpoint anchor", "missing", endpointHints.join(", "));
          } else if (!hasAnchorCitation) {
            endpointGuardMessage =
              "Repo evidence referenced the requested endpoint but the answer did not cite those files. Please point to the relevant files or narrow the request.";
            cleaned = endpointGuardMessage;
            endpointGuardApplied = true;
            logProgress("Endpoint anchor", "mismatch");
            logEvent("Endpoint anchor", "mismatch", formatFileList(anchorPaths));
          }
          if (debugPayload) {
            debugPayload.endpoint_hints = endpointHints;
            debugPayload.endpoint_anchor_paths = anchorPaths;
            debugPayload.endpoint_anchor_violation = anchorPaths.length === 0 || !hasAnchorCitation;
          }
        }
      }
      const platonicDomain: HelixAskDomain =
        intentDomain === "repo" || intentDomain === "hybrid"
          ? intentDomain
          : intentStrategy === "constraint_report"
            ? "falsifiable"
            : "general";
      const evidencePaths = Array.from(
        new Set([
          ...contextFiles,
          ...promptContextFiles,
          conceptMatch?.card.sourcePath ?? "",
          ...extractFilePathsFromText(evidenceText),
          ...extractFilePathsFromText(repoScaffold),
          ...extractFilePathsFromText(generalScaffold),
          ...extractFilePathsFromText(promptScaffold),
        ]),
      );
      const platonicResult = applyHelixAskPlatonicGates({
        question: baseQuestion,
        answer: cleaned,
        domain: platonicDomain,
        tier: intentTier,
        intentId: intentProfile.id,
        format: formatSpec.format,
        evidenceText,
        evidencePaths,
        generalScaffold,
        repoScaffold,
        promptScaffold,
        conceptMatch,
      });
      logEvent(
        "Platonic gates",
        "ok",
        [
          platonicResult.conceptLintApplied ? "conceptLint=on" : "conceptLint=off",
          platonicResult.physicsLintApplied ? "physicsLint=on" : "physicsLint=off",
          `coverage=${platonicResult.coverageSummary.coverageRatio.toFixed(2)}`,
          `beliefUnsupported=${platonicResult.beliefSummary.unsupportedRate.toFixed(2)}`,
          `rattling=${platonicResult.rattlingScore.toFixed(2)}`,
        ].join(" | "),
      );
      logEvent(
        "Coverage gate",
        platonicResult.coverageGateApplied ? "applied" : "pass",
        [
          `ratio=${platonicResult.coverageSummary.coverageRatio.toFixed(2)}`,
          platonicResult.coverageSummary.missingKeys.length
            ? `missing=${platonicResult.coverageSummary.missingKeys.join(",")}`
            : "missing=none",
        ].join(" | "),
      );
      logEvent(
        "Belief gate",
        platonicResult.beliefGateApplied ? "applied" : "pass",
        [
          `unsupported=${platonicResult.beliefSummary.unsupportedRate.toFixed(2)}`,
          `claims=${platonicResult.beliefSummary.claimCount}`,
          `contradictions=${platonicResult.beliefSummary.contradictionCount}`,
        ].join(" | "),
      );
      logEvent(
        "Rattling gate",
        platonicResult.rattlingGateApplied ? "applied" : "pass",
        `score=${platonicResult.rattlingScore.toFixed(2)}`,
      );
      if (HELIX_ASK_TRAINING_TRACE) {
        try {
          const notes: string[] = [];
          if (platonicResult.coverageGateApplied) {
            notes.push(`coverage_gate:${platonicResult.coverageGateReason ?? "applied"}`);
          }
          if (platonicResult.beliefGateApplied) {
            notes.push(`belief_gate:${platonicResult.beliefGateReason ?? "applied"}`);
          }
          if (platonicResult.rattlingGateApplied) {
            notes.push("rattling_gate:applied");
          }
          if (platonicResult.variantSummary?.selectedLabel) {
            notes.push(`variant:${platonicResult.variantSummary.selectedLabel}`);
          }
          if (platonicResult.beliefGraphSummary.claimIds.length) {
            notes.push(`claim_ids=${platonicResult.beliefGraphSummary.claimIds.join(",")}`);
          }
          if (platonicResult.beliefGraphSummary.unsupportedClaimIds.length) {
            notes.push(
              `unsupported_claims=${platonicResult.beliefGraphSummary.unsupportedClaimIds.join(",")}`,
            );
          }
          if (platonicResult.beliefGraphSummary.contradictionIds.length) {
            notes.push(
              `contradictions=${platonicResult.beliefGraphSummary.contradictionIds.join(",")}`,
            );
          }
          const latticeSnapshot = await loadCodeLattice();
          const latticeVersion = latticeSnapshot?.latticeVersion ?? getLatticeVersion();
          const latticeCommit = latticeSnapshot?.commit ?? null;
          recordTrainingTrace({
            traceId: askTraceId,
            pass:
              !platonicResult.coverageGateApplied &&
              !platonicResult.beliefGateApplied &&
              !platonicResult.rattlingGateApplied,
            deltas: [],
            metrics: {
              intent_id: intentProfile.id,
              domain: platonicDomain,
              tier: intentTier ?? null,
              lattice_version: latticeVersion ?? null,
              lattice_commit: latticeCommit ?? null,
              prompt_ingested: promptIngested ? 1 : 0,
              prompt_chunk_count: promptChunkCount || null,
              prompt_selected_count: promptSelectedCount || null,
              coverage_ratio: platonicResult.coverageSummary.coverageRatio,
              coverage_missing_key_count: platonicResult.coverageSummary.missingKeyCount,
              belief_claim_count: platonicResult.beliefSummary.claimCount,
              belief_unsupported_rate: platonicResult.beliefSummary.unsupportedRate,
              belief_contradictions: platonicResult.beliefSummary.contradictionCount,
              belief_graph_nodes: platonicResult.beliefGraphSummary.nodeCount,
              belief_graph_edges: platonicResult.beliefGraphSummary.edgeCount,
              belief_graph_supports: platonicResult.beliefGraphSummary.edgeCounts.supports,
              belief_graph_contradicts: platonicResult.beliefGraphSummary.edgeCounts.contradicts,
              belief_graph_depends_on: platonicResult.beliefGraphSummary.edgeCounts.depends_on,
              belief_graph_maps_to: platonicResult.beliefGraphSummary.edgeCounts.maps_to,
              belief_graph_definitions: platonicResult.beliefGraphSummary.definitionCount,
              belief_graph_conclusions: platonicResult.beliefGraphSummary.conclusionCount,
              belief_graph_evidence_refs: platonicResult.beliefGraphSummary.evidenceRefCount,
              belief_graph_constraints: platonicResult.beliefGraphSummary.constraintCount,
              rattling_score: platonicResult.rattlingScore,
              rattling_base_distance: platonicResult.rattlingDetail?.baseDistance ?? null,
              rattling_perturbation_distance:
                platonicResult.rattlingDetail?.perturbationDistance ?? null,
              rattling_claim_set_count: platonicResult.rattlingDetail?.claimSetCount ?? null,
              coverage_gate_applied: platonicResult.coverageGateApplied,
              belief_gate_applied: platonicResult.beliefGateApplied,
              rattling_gate_applied: platonicResult.rattlingGateApplied,
              variant_applied: platonicResult.variantSummary?.applied ?? false,
              variant_candidates: platonicResult.variantSummary?.candidateCount ?? null,
            },
            source: {
              system: "helix-ask",
              component: "platonic-gates",
              tool: "belief_state",
            },
            notes: notes.length ? notes : undefined,
          });
        } catch (error) {
          console.warn("[helix-ask] training trace emit failed", error);
        }
      }
      cleaned = platonicResult.answer;
      if (endpointGuardApplied && endpointGuardMessage) {
        cleaned = endpointGuardMessage;
        answerPath.push("endpointGuard:applied");
      }
      if (allowHybridFallback && intentStrategy === "hybrid_explain" && repoScaffold.trim()) {
        const guarded =
          /please point to the relevant files|available evidence was weakly reflected|repo evidence did not cover/i.test(
            cleaned,
          );
        if (!guarded) {
          const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
          const hasRepoCitations =
            extractFilePathsFromText(cleaned).length > 0 || hasSourcesLine(cleaned);
          if (paragraphs.length < 2 || !hasRepoCitations) {
            const generalEvidence = promptScaffold || generalScaffold;
            let paragraph1 = "";
            if (generalEvidence) {
              const collapsed = collapseEvidenceBullets(generalEvidence);
              const stripped = stripPromptEchoFromAnswer(generalEvidence, baseQuestion)
                .replace(/^question:\s*/i, "")
                .trim();
              paragraph1 = clipAskText(collapsed || stripped, 420);
            }
            let paragraph2 = collapseEvidenceBullets(repoScaffold);
            if (paragraph2 && extractFilePathsFromText(paragraph2).length === 0) {
              const repoPaths = extractFilePathsFromText(repoScaffold).slice(0, 6);
              if (repoPaths.length) {
                paragraph2 = `${paragraph2} (${repoPaths.join(", ")})`;
              }
            }
            const fallback = [paragraph1, paragraph2].filter(Boolean).join("\n\n").trim();
            if (fallback) {
              cleaned = fallback;
              answerPath.push("hybridFallback:post_platonic");
            }
          }
        }
      }
      cleaned = normalizeNumberedListLines(cleaned);
      cleaned = repairAnswerFilePathFragments(cleaned, contextFiles, evidenceText);
      cleaned = enforceHelixAskPromptContract(cleaned, baseQuestion);
      const citedPaths = extractFilePathsFromText(cleaned);
      const hasCitations = citedPaths.length > 0 || hasSourcesLine(cleaned);
      logEvent(
        "Citations",
        intentProfile.evidencePolicy.requireCitations ? "required" : "optional",
        `present=${hasCitations ? "yes" : "no"} | files=${citedPaths.length}`,
      );
      const cleanedPreview = clipAskText(cleaned.replace(/\s+/g, " ").trim(), 240);
      if (cleanedPreview) {
        logEvent("Answer cleaned preview", "final", cleanedPreview, answerStart);
      }
      answerPath.push("platonic:gates");
      if (debugPayload) {
        debugPayload.junk_clean_applied = platonicResult.junkCleanApplied;
        debugPayload.junk_clean_reasons = platonicResult.junkCleanReasons;
        debugPayload.concept_lint_applied = platonicResult.conceptLintApplied;
        debugPayload.concept_lint_reasons = platonicResult.conceptLintReasons;
        debugPayload.physics_lint_applied = platonicResult.physicsLintApplied;
        debugPayload.physics_lint_reasons = platonicResult.physicsLintReasons;
        debugPayload.coverage_token_count = platonicResult.coverageSummary.tokenCount;
        debugPayload.coverage_key_count = platonicResult.coverageSummary.keyCount;
        debugPayload.coverage_missing_key_count = platonicResult.coverageSummary.missingKeyCount;
        debugPayload.coverage_ratio = platonicResult.coverageSummary.coverageRatio;
        debugPayload.coverage_missing_keys = platonicResult.coverageSummary.missingKeys;
        debugPayload.coverage_gate_applied = platonicResult.coverageGateApplied;
        debugPayload.coverage_gate_reason = platonicResult.coverageGateReason;
        debugPayload.belief_claim_count = platonicResult.beliefSummary.claimCount;
        debugPayload.belief_supported_count = platonicResult.beliefSummary.supportedCount;
        debugPayload.belief_unsupported_count = platonicResult.beliefSummary.unsupportedCount;
        debugPayload.belief_unsupported_rate = platonicResult.beliefSummary.unsupportedRate;
        debugPayload.belief_contradictions = platonicResult.beliefSummary.contradictionCount;
        debugPayload.belief_gate_applied = platonicResult.beliefGateApplied;
        debugPayload.belief_gate_reason = platonicResult.beliefGateReason;
        debugPayload.belief_graph_node_count = platonicResult.beliefGraphSummary.nodeCount;
        debugPayload.belief_graph_edge_count = platonicResult.beliefGraphSummary.edgeCount;
        debugPayload.belief_graph_claim_count = platonicResult.beliefGraphSummary.claimCount;
        debugPayload.belief_graph_definition_count =
          platonicResult.beliefGraphSummary.definitionCount;
        debugPayload.belief_graph_conclusion_count =
          platonicResult.beliefGraphSummary.conclusionCount;
        debugPayload.belief_graph_evidence_ref_count =
          platonicResult.beliefGraphSummary.evidenceRefCount;
        debugPayload.belief_graph_constraint_count =
          platonicResult.beliefGraphSummary.constraintCount;
        debugPayload.belief_graph_supports = platonicResult.beliefGraphSummary.edgeCounts.supports;
        debugPayload.belief_graph_contradicts =
          platonicResult.beliefGraphSummary.edgeCounts.contradicts;
        debugPayload.belief_graph_depends_on =
          platonicResult.beliefGraphSummary.edgeCounts.depends_on;
        debugPayload.belief_graph_maps_to = platonicResult.beliefGraphSummary.edgeCounts.maps_to;
        debugPayload.belief_graph_claim_ids = platonicResult.beliefGraphSummary.claimIds;
        debugPayload.belief_graph_unsupported_claim_ids =
          platonicResult.beliefGraphSummary.unsupportedClaimIds;
        debugPayload.belief_graph_contradiction_ids =
          platonicResult.beliefGraphSummary.contradictionIds;
        debugPayload.rattling_score = platonicResult.rattlingScore;
        debugPayload.rattling_gate_applied = platonicResult.rattlingGateApplied;
        if (platonicResult.rattlingDetail) {
          debugPayload.rattling_base_distance = platonicResult.rattlingDetail.baseDistance;
          debugPayload.rattling_perturbation_distance =
            platonicResult.rattlingDetail.perturbationDistance;
          debugPayload.rattling_claim_set_count = platonicResult.rattlingDetail.claimSetCount;
        }
        if (platonicResult.variantSummary) {
          debugPayload.variant_selection_applied = platonicResult.variantSummary.applied;
          debugPayload.variant_selection_reason = platonicResult.variantSummary.reason;
          debugPayload.variant_selection_label = platonicResult.variantSummary.selectedLabel;
          debugPayload.variant_selection_candidate_count =
            platonicResult.variantSummary.candidateCount;
        }
        debugPayload.gates = {
          evidence: {
            ok: debugPayload.evidence_gate_ok,
            matchCount: debugPayload.evidence_match_count,
            tokenCount: debugPayload.evidence_token_count,
            matchRatio: debugPayload.evidence_match_ratio,
            criticApplied: debugPayload.evidence_critic_applied,
            criticOk: debugPayload.evidence_critic_ok,
            criticRatio: debugPayload.evidence_critic_ratio,
            criticCount: debugPayload.evidence_critic_count,
            criticTokens: debugPayload.evidence_critic_tokens,
          },
          coverage: {
            applied: debugPayload.coverage_gate_applied,
            reason: debugPayload.coverage_gate_reason,
            ratio: debugPayload.coverage_ratio,
            tokenCount: debugPayload.coverage_token_count,
            keyCount: debugPayload.coverage_key_count,
            missingKeyCount: debugPayload.coverage_missing_key_count,
            missingKeys: debugPayload.coverage_missing_keys,
          },
          belief: {
            applied: debugPayload.belief_gate_applied,
            reason: debugPayload.belief_gate_reason,
            unsupportedRate: debugPayload.belief_unsupported_rate,
            unsupportedCount: debugPayload.belief_unsupported_count,
            supportedCount: debugPayload.belief_supported_count,
            claimCount: debugPayload.belief_claim_count,
            contradictions: debugPayload.belief_contradictions,
          },
          beliefGraph: {
            nodeCount: debugPayload.belief_graph_node_count,
            edgeCount: debugPayload.belief_graph_edge_count,
            claimCount: debugPayload.belief_graph_claim_count,
            definitionCount: debugPayload.belief_graph_definition_count,
            conclusionCount: debugPayload.belief_graph_conclusion_count,
            evidenceRefCount: debugPayload.belief_graph_evidence_ref_count,
            constraintCount: debugPayload.belief_graph_constraint_count,
            supports: debugPayload.belief_graph_supports,
            contradicts: debugPayload.belief_graph_contradicts,
            dependsOn: debugPayload.belief_graph_depends_on,
            mapsTo: debugPayload.belief_graph_maps_to,
          },
          rattling: {
            applied: debugPayload.rattling_gate_applied,
            score: debugPayload.rattling_score,
            baseDistance: debugPayload.rattling_base_distance,
            perturbationDistance: debugPayload.rattling_perturbation_distance,
            claimSetCount: debugPayload.rattling_claim_set_count,
          },
          lint: {
            conceptApplied: debugPayload.concept_lint_applied,
            conceptReasons: debugPayload.concept_lint_reasons,
            physicsApplied: debugPayload.physics_lint_applied,
            physicsReasons: debugPayload.physics_lint_reasons,
          },
          variant: {
            applied: debugPayload.variant_selection_applied,
            reason: debugPayload.variant_selection_reason,
            label: debugPayload.variant_selection_label,
            candidateCount: debugPayload.variant_selection_candidate_count,
          },
          ambiguity: {
            resolverApplied: debugPayload.ambiguity_resolver_applied,
            resolverReason: debugPayload.ambiguity_resolver_reason,
            resolverTokenCount: debugPayload.ambiguity_resolver_token_count,
            resolverShortPrompt: debugPayload.ambiguity_resolver_short_prompt,
            resolverTopScore: debugPayload.ambiguity_resolver_top_score,
            resolverMargin: debugPayload.ambiguity_resolver_margin,
            resolverCandidates: debugPayload.ambiguity_resolver_candidates,
            gateApplied: debugPayload.ambiguity_gate_applied,
            terms: debugPayload.ambiguity_terms,
          },
        };
        debugPayload.answer_path = answerPath;
      }
      cleanedText = cleaned;
      result.text = cleaned;
    }
    if (cleanedText) {
      result.envelope = buildHelixAskEnvelope({
        answer: cleanedText,
        format: formatSpec.format,
        tier: intentTier,
        secondaryTier: intentSecondaryTier,
        mode: resolveEnvelopeMode(verbosity),
        evidenceText,
        traceId: askTraceId,
      });
    }
    logDebug("streamEmitter.finalize start", {
      cleanedLength: typeof cleanedText === "string" ? cleanedText.length : 0,
    });
    streamEmitter.finalize(cleanedText);
    logDebug("streamEmitter.finalize complete");
    result.prompt_ingested = promptIngested;
    if (promptIngested) {
      if (promptIngestSource) {
        result.prompt_ingest_source = promptIngestSource;
      }
      if (promptIngestReason) {
        result.prompt_ingest_reason = promptIngestReason;
      }
    }
    if (debugPayload && captureLiveHistory) {
      debugPayload.live_events = liveEventHistory.slice();
    }
    if (debugPayload && overflowHistory.length > 0) {
      const steps = overflowHistory.flatMap((entry) => entry.steps);
      debugPayload.overflow_retry_applied = true;
      debugPayload.overflow_retry_steps = Array.from(new Set(steps));
      debugPayload.overflow_retry_labels = overflowHistory.map((entry) => entry.label);
      debugPayload.overflow_retry_attempts = overflowHistory.reduce(
        (sum, entry) => sum + entry.attempts,
        0,
      );
    }
    const responsePayload = debugPayload ? { ...result, debug: debugPayload } : result;
    logDebug("responder.send(200) start", {
      hasDebug: Boolean(debugPayload),
      hasEnvelope: Boolean(result.envelope),
    });
    responder.send(200, responsePayload);
    logDebug("responder.send(200) complete");
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logDebug("executeHelixAsk ERROR", { message });
    streamEmitter.finalize();
    logProgress("Failed", "llm_local_failed", undefined, false);
    responder.send(500, { ok: false, error: "llm_local_failed", message, status: 500 });
    return;
  } finally {
    logDebug("executeHelixAsk FINALLY");
  }
};

planRouter.post("/ask", async (req, res) => {
  const parsed = LocalAskRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  let personaId = parsed.data.personaId ?? "default";
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const keepAlive = createHelixAskJsonKeepAlive(res, {
    enabled: HELIX_ASK_HTTP_KEEPALIVE && parsed.data.dryRun !== true,
    intervalMs: HELIX_ASK_HTTP_KEEPALIVE_MS,
  });
  await executeHelixAsk({
    request: parsed.data,
    personaId,
    responder: { send: keepAlive.send },
  });
});

const describeHelixAskJobError = (payload: unknown, status: number): string => {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
    const error = (payload as { error?: string }).error;
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }
  return `helix_ask_failed_${status}`;
};

const buildHelixAskJobResponse = (job: HelixAskJobRecord) => ({
  jobId: job.id,
  status: job.status,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  expiresAt: job.expiresAt,
  sessionId: job.sessionId ?? null,
  traceId: job.traceId ?? null,
  partialText: job.partialText ?? null,
  error: job.error ?? null,
  result: job.result ?? null,
});

const runHelixAskJob = async (
  jobId: string,
  request: z.infer<typeof LocalAskRequest>,
  personaId: string,
): Promise<void> => {
  if (!(await markHelixAskJobRunning(jobId))) return;
  let settled = false;
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutMs = HELIX_ASK_JOB_TIMEOUT_MS;
  const timeoutPromise =
    timeoutMs > 0
      ? new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error("helix_ask_timeout"));
          }, timeoutMs);
          timeoutHandle.unref?.();
        })
      : null;
  const responder: HelixAskResponder = {
    send: (status, payload) => {
      if (settled) return;
      settled = true;
      if (status >= 400) {
        const message = describeHelixAskJobError(payload, status);
        void failHelixAskJob(jobId, message);
        return;
      }
      void completeHelixAskJob(jobId, payload as Record<string, unknown>);
    },
  };
  try {
    const executePromise = executeHelixAsk({
      request,
      personaId,
      responder,
      streamChunk: (chunk) => appendHelixAskJobPartial(jobId, chunk),
    });
    if (timeoutPromise) {
      await Promise.race([executePromise, timeoutPromise]);
    } else {
      await executePromise;
    }
    if (!settled) {
      settled = true;
      await failHelixAskJob(jobId, "helix_ask_no_response");
    }
  } catch (error) {
    if (settled) return;
    settled = true;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.includes("helix_ask_timeout")
      ? "helix_ask_timeout"
      : message || "helix_ask_failed";
    await failHelixAskJob(jobId, normalized);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
  }
};

planRouter.post("/ask/jobs", async (req, res) => {
  const parsed = LocalAskRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  let personaId = parsed.data.personaId ?? "default";
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const askTraceId = (parsed.data.traceId?.trim() || `ask:${crypto.randomUUID()}`).slice(0, 128);
  const request = { ...parsed.data, traceId: askTraceId };
  const question = (request.question ?? request.prompt ?? "").trim();
  let job: HelixAskJobRecord;
  try {
    job = await createHelixAskJob({
      sessionId: request.sessionId,
      traceId: askTraceId,
      question: question ? question.slice(0, 480) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(503).json({ error: "job_store_unavailable", message });
  }
  res.status(202).json({
    jobId: job.id,
    status: job.status,
    sessionId: request.sessionId ?? null,
    traceId: askTraceId,
  });
  void runHelixAskJob(job.id, request, personaId);
});

planRouter.get("/ask/jobs/:jobId", async (req, res) => {
  const jobId = req.params.jobId?.trim();
  if (!jobId) {
    return res.status(400).json({ error: "bad_request", details: [{ message: "jobId required" }] });
  }
  const job = await getHelixAskJob(jobId);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  res.set({
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.json(buildHelixAskJobResponse(job));
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
  const { searchQuery, summaryFocus, sessionId, refinery } = parsed.data;
  const topK = clampTopK(parsed.data.topK);
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
      const wantsRepoHints =
        anchorIntent === "architecture" ||
        anchorIntent === "hybrid" ||
        intent.wantsImplementation ||
        callSpecIntent.has("repo_deep") ||
        callSpecIntent.has("repo");
      if (wantsRepoHints) {
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
  if (
    (intent.wantsWarp || intent.wantsPhysics || intent.wantsImplementation) &&
    resourceHintPaths.length === 0
  ) {
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
    refinery: refinery ?? undefined,
    collapse_strategy: collapseStrategy,
    collapse_trace: collapseTrace,
  };

  const record: PlanRecord = {
    traceId,
    createdAt,
    goal,
    personaId,
    sessionId,
    planDsl,
    nodes,
    executorSteps,
    manifest,
    plannerPrompt,
    taskTrace,
    knowledgeContext,
    knowledgeHash,
    knowledgeHints,
    resourceHints: resourceHintPaths,
    knowledgeProjects: requestedProjects,
    searchQuery: query,
    topK,
    summaryFocus: focus,
    desktopId,
    telemetry: telemetryBundle ?? null,
    telemetrySummary: telemetrySummary ?? null,
    resonance: resonanceBundle,
    resonanceSelection,
    latticeVersion,
    debateId: null,
    strategy,
    strategyNotes,
    intent,
    groundingReport,
    debugSources,
    promptSpec: promptSpec ?? undefined,
    collapseTrace: collapseTrace ?? undefined,
    collapseStrategy,
    callSpec: callSpec ?? undefined,
    refinery: refinery ?? undefined,
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
  if (record.refinery?.origin === "variant") {
    const alphaState = computeAlphaGovernorState();
    if (alphaState.enabled && alphaState.alphaTarget !== undefined && alphaState.engaged) {
      recordTrainingTrace({
        traceId,
        pass: false,
        deltas: [],
        metrics: {
          alpha_blocked: 1,
          governor_engaged: 1,
          alpha_target: alphaState.alphaTarget ?? null,
          alpha_run: alphaState.alphaRun,
          alpha_live: alphaState.live,
          alpha_variant: alphaState.variant,
          alpha_cap: Number.isFinite(alphaState.cap) ? alphaState.cap : null,
          alpha_window: alphaState.window,
          run_mode: alphaState.runMode,
        },
        source: {
          system: "agi-refinery",
          component: "execute",
          tool: "alpha_governor",
        },
        notes: [
          "alpha_blocked",
          "governor_engaged",
          `origin=${record.refinery.origin}`,
        ],
      });
      return res.status(409).json({
        error: "alpha_governor_engaged",
        alphaTarget: alphaState.alphaTarget ?? null,
        alphaRun: alphaState.alphaRun,
        alphaLive: alphaState.live,
        alphaVariant: alphaState.variant,
        alphaCap: Number.isFinite(alphaState.cap) ? alphaState.cap : null,
        alphaWindow: alphaState.window,
        runMode: alphaState.runMode,
        governorEngaged: true,
      });
    }
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
  const executionEnvelopes = collectExecutionEnvelopes(
    steps,
    executorStepById,
    start,
  );
  const executionErrorTypes = collectExecutionErrorTypes(steps);
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
  const executionSignals = summarizeExecutionSignals(
    steps,
    record.goal,
    executorStepById,
    record.intent,
    executionErrorTypes,
  );
  const rawSummary =
    record.taskTrace.result_summary ?? summarizeExecutionResults(steps);
  const executionSummary = resolveExecutionHandledSummary(rawSummary, ok);
  const safetySummary = resolveSafetyHandledSummary(
    executionSummary.summary,
    executionSignals.safetyOk,
  );
  const summary = safetySummary.summary;
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
  if (shouldCaptureRefineryTrace(record.personaId, record.refinery)) {
    try {
      const {
        formatOk,
        testsRun,
        testsOk,
        testsRequired,
        safetyOk,
        executionErrorTypes,
        codeTouched,
        codeTouchedPaths,
        contractRequired,
        contractOk,
        contractIssues,
        constraintRequired,
        constraintOk,
        constraintIssues,
        constraintSources,
      } = executionSignals;
      let citations = safetyOk ? collectStepCitations(steps) : [];
      let { candidates: retrievalCandidates, selected: retrievalSelected } =
        collectRepoGraphEvidence(steps, executorStepById);
      const intentTags = buildIntentTags(record.intent);
      if (!safetyOk) {
        try {
          const fallback = await buildSafeRetrievalFallback(
            record.searchQuery ?? record.goal,
          );
          if (fallback.candidates.length > 0) {
            retrievalCandidates = fallback.candidates;
          }
          if (fallback.selected.length > 0) {
            retrievalSelected = fallback.selected;
          }
        } catch (error) {
          console.warn("[agi.refinery] safe retrieval fallback failed", error);
        }
      }
      const hintPassEnabled = process.env.AGI_REFINERY_HINT_PASS !== "0";
      const hintPathInputs = collectHintInputs(
        record.resourceHints ?? [],
        record.searchQuery ?? record.goal,
      );
      let hintPathsUsed: string[] | undefined;
      let hintQueryApplied = false;
      if (hintPassEnabled && hintPathInputs.length > 0) {
        try {
          const hintPaths: string[] = [];
          for (const hint of hintPathInputs) {
            if (isRestrictedEvidencePath(hint)) continue;
            hintPaths.push(hint);
            if (hintPaths.length >= HINT_PASS_MAX) break;
          }
          if (hintPaths.length > 0) {
            hintPathsUsed = hintPaths;
            const hintHits = hintPaths.map((path, index) => ({
              id: `hint:${index}:${path}`,
              kind: "repo_hint",
              path,
              file_path: path,
              score: 1,
            }));
            const hintEvidence = buildEvidenceFromRepoGraphHits(
              hintHits,
              "repo_hint",
            );
            if (hintEvidence.length > 0) {
              retrievalCandidates = [...retrievalCandidates, ...hintEvidence];
              retrievalSelected = [...retrievalSelected, ...hintEvidence];
            }
          }
        } catch (error) {
          console.warn("[agi.refinery] hint pass failed", error);
        }
      }
      if (hintPathsUsed && hintPathsUsed.length > 0) {
        const hintQueryEvidence = await buildHintQueryEvidence(
          hintPathsUsed,
          intentTags,
        );
        if (hintQueryEvidence.candidates.length > 0) {
          retrievalCandidates = mergeEvidence(
            retrievalCandidates,
            hintQueryEvidence.candidates,
          );
          hintQueryApplied = true;
        }
        if (hintQueryEvidence.selected.length > 0) {
          retrievalSelected = mergeEvidence(
            retrievalSelected,
            hintQueryEvidence.selected,
          );
          hintQueryApplied = true;
        }
      }
      const citationCompletionEnabled =
        process.env.AGI_REFINERY_CITATION_COMPLETION !== "0";
      let citationCompletionApplied = false;
      let citationCompletionMetrics: CitationCompletionMetrics | undefined;
      if (citationCompletionEnabled && safetyOk) {
        try {
          const finalStep = steps[steps.length - 1];
          const finalText =
            finalStep && finalStep.ok
              ? pickReadableText(finalStep.output)
              : undefined;
          const completionText = (finalText ?? summary).trim();
          const completion = await completeCitations({
            outputText: completionText.length > 0 ? completionText : summary,
            citations,
            retrievalCandidates,
            retrievalSelected,
            searchQuery: record.searchQuery ?? record.goal,
          });
          citations = completion.citations;
          retrievalCandidates = completion.retrievalCandidates;
          retrievalSelected = completion.retrievalSelected;
          citationCompletionApplied = completion.added;
          citationCompletionMetrics = completion.metrics;
        } catch (error) {
          console.warn("[agi.refinery] citation completion failed", error);
        }
      }
      const tokens =
        estimateTokens(record.goal) + estimateTokens(summary ?? "");
      const plannerVersion = resolvePlannerModel();
      const executorVersion = resolveExecutorModel();
      const model = executorVersion ?? plannerVersion;
      const trajectory = buildRefineryTrajectory({
        trajectoryId: traceId,
        traceId,
        sessionId: record.sessionId,
        personaId: record.personaId,
        createdAt: record.createdAt,
        goal: record.goal,
        intent: record.intent,
        strategy: record.strategy,
        searchQuery: record.searchQuery,
        topK: record.topK,
        summaryFocus: record.summaryFocus,
        model,
        plannerVersion,
        executorVersion,
        knowledgeContext: safetyOk ? record.knowledgeContext : undefined,
        groundingReport: safetyOk
          ? record.groundingReport ?? record.taskTrace.grounding_report ?? undefined
          : undefined,
        knowledgeHash: record.knowledgeHash ?? undefined,
        resourceHints: hintPassEnabled ? hintPathsUsed ?? [] : record.resourceHints,
        knowledgeProjects: record.knowledgeProjects,
        summary,
        citations,
        durationMs: duration,
        tokens,
        executionOk: ok,
        executionErrorTypes:
          executionErrorTypes.length > 0 ? executionErrorTypes : undefined,
        executionEnvelopes:
          executionEnvelopes.length > 0 ? executionEnvelopes : undefined,
        formatOk,
        testsRun,
        testsOk,
        testsRequired,
        codeTouched,
        codeTouchedPaths: codeTouchedPaths.length > 0 ? codeTouchedPaths : undefined,
        contractRequired,
        contractOk,
        contractIssues: contractIssues.length > 0 ? contractIssues : undefined,
        constraintRequired,
        constraintOk,
        constraintIssues:
          constraintIssues.length > 0 ? constraintIssues : undefined,
        constraintSources:
          constraintSources.length > 0 ? constraintSources : undefined,
        safetyOk,
        sanitizeEvidence: !safetyOk,
        retrievalCandidates:
          retrievalCandidates.length > 0 ? retrievalCandidates : undefined,
        retrievalSelected:
          retrievalSelected.length > 0 ? retrievalSelected : undefined,
        citationCompletionApplied,
        candidateRecallPreCompletion:
          citationCompletionMetrics?.candidateRecallPreCompletion,
        candidateRecallPostCompletion:
          citationCompletionMetrics?.candidateRecallPostCompletion,
        selectedRecallPreCompletion:
          citationCompletionMetrics?.selectedRecallPreCompletion,
        selectedRecallPostCompletion:
          citationCompletionMetrics?.selectedRecallPostCompletion,
        citationsPreCompletion: citationCompletionMetrics?.citationsPreCompletion,
        citationsPostCompletion:
          citationCompletionMetrics?.citationsPostCompletion,
        completionQueriesCount:
          citationCompletionMetrics?.completionQueriesCount,
        completionLatencyMs: citationCompletionMetrics?.completionLatencyMs,
        refinery: record.refinery,
      });
      const gateReport = evaluateTrajectoryGates(trajectory);
      const metricsPayload = buildGateMetrics(
        gateReport.gates,
        trajectory.E?.length ?? 0,
        gateReport.accepted,
      );
      if (citationCompletionMetrics) {
        metricsPayload.candidateRecall_preCompletion =
          citationCompletionMetrics.candidateRecallPreCompletion;
        metricsPayload.candidateRecall_postCompletion =
          citationCompletionMetrics.candidateRecallPostCompletion;
        metricsPayload.selectedRecall_preCompletion =
          citationCompletionMetrics.selectedRecallPreCompletion;
        metricsPayload.selectedRecall_postCompletion =
          citationCompletionMetrics.selectedRecallPostCompletion;
        metricsPayload.completionQueriesCount =
          citationCompletionMetrics.completionQueriesCount;
        metricsPayload.completionLatencyMs =
          citationCompletionMetrics.completionLatencyMs;
      }
      const notes = record.refinery?.origin
        ? [`origin=${record.refinery.origin}`]
        : [];
      if (!ok && executionSummary.handled) {
        notes.push("execution_handled");
      }
      if (!safetyOk && safetySummary.handled) {
        notes.push("safety_handled");
      }
      if (hintQueryApplied) {
        notes.push("hint_query");
      }
      if (citationCompletionApplied) {
        notes.push("citation_completion");
      }
      const alphaGate = evaluateAlphaGovernor(
        trajectory.meta?.origin,
        gateReport.accepted,
      );
      if (!alphaGate.allow) {
        notes.push("alpha_blocked");
        const alphaRun = alphaGate.alphaRun;
        const traceNotes = notes.length > 0 ? notes : undefined;
        recordTrainingTrace({
          traceId,
          pass: false,
          deltas: [],
          metrics: {
            alpha_blocked: 1,
            governor_engaged: alphaGate.engaged ? 1 : 0,
            alpha_target: alphaGate.alphaTarget ?? null,
            alpha_run: alphaRun,
            alpha_live: alphaGate.live,
            alpha_variant: alphaGate.variant,
            alpha_cap: Number.isFinite(alphaGate.cap) ? alphaGate.cap : null,
            alpha_window: alphaGate.window,
            run_mode: alphaGate.runMode,
          },
          source: {
            system: "agi-refinery",
            component: "execute",
            tool: "alpha_governor",
          },
          notes: traceNotes,
        });
      } else {
        const traceNotes = notes.length > 0 ? notes : undefined;
        recordTrainingTrace({
          traceId,
          pass: gateReport.accepted,
          deltas: [],
          metrics: metricsPayload,
          source: { system: "agi-refinery", component: "execute", tool: "trajectory" },
          payload: { kind: "trajectory", data: trajectory },
          notes: traceNotes,
        });
        recordTrainingTrace({
          traceId,
          pass: gateReport.accepted,
          deltas: [],
          metrics: metricsPayload,
          source: { system: "agi-refinery", component: "execute", tool: "gates" },
          payload: { kind: "trajectory_gates", data: gateReport },
          notes: traceNotes,
        });
      }
    } catch (error) {
      console.warn("[agi.refinery] trajectory capture failed", error);
    }
  }

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
  const { limit, tool, sessionId, traceId } = parsed.data;
  const logs = getToolLogs({ limit, tool, tenantId: tenantGuard.tenantId, sessionId, traceId });
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
  const { limit, tool, sessionId, traceId } = parsed.data;
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
    ? getToolLogsSince(lastEventId, { tool, tenantId, sessionId, traceId })
    : getToolLogs({ limit, tool, tenantId, sessionId, traceId }).sort((a, b) => a.seq - b.seq);
  for (const entry of backlog) {
    sendEvent(entry);
  }

  const unsubscribe = subscribeToolLogs((entry) => {
    if (tenantId && entry.tenantId !== tenantId) {
      return;
    }
    if (sessionId && entry.sessionId !== sessionId) {
      return;
    }
    if (traceId && entry.traceId !== traceId) {
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
