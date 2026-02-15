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
import {
  timeDilationActivateHandler,
  timeDilationActivateSpec,
} from "../skills/telemetry.time_dilation.activate";
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
  readDocSectionIndex,
  selectDocSectionMatch,
  type DocSection,
  findDocSectionByHeading,
} from "../services/helix-ask/doc-sections";
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
import { evaluateRuntimeBudgetState } from "../services/runtime/budget-model";
import { loadRuntimeFrameContract } from "../services/runtime/frame-contract";
import {
  buildConceptScaffold,
  findConceptMatch,
  listConceptCandidates,
  listConceptCards,
  renderConceptAnswer,
  renderConceptDefinition,
  type HelixAskConceptCandidate,
  type HelixAskConceptCard,
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
  resolveHelixAskGraphPack,
  type HelixAskCongruenceWalkOverride,
  type HelixAskGraphEvidence,
  type HelixAskGraphPack,
} from "../services/helix-ask/graph-resolver";
import {
  applyHelixAskPlatonicGates,
  type HelixAskDomain,
  type HelixAskClaimLedgerEntry,
  type HelixAskUncertaintyEntry,
  evaluateCoverageSlots,
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
  getHelixAskActiveJobCount,
  markHelixAskJobRunning,
  touchHelixAskJob,
  type HelixAskJobRecord,
} from "../services/helix-ask/job-store";
import {
  getHelixAskSessionMemory,
  getHelixAskSessionGraphLock,
  setHelixAskSessionGraphLock,
  clearHelixAskSessionGraphLock,
  recordHelixAskSessionMemory,
  type HelixAskSessionMemory,
} from "../services/helix-ask/session-memory";
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
import { kvGetSessionTokensApprox } from "../services/llm/kv-budgeter";
import { getGpuThermals } from "../services/hardware/gpu-scheduler";
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

const readNumber = (value: string | number | undefined, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
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
const HELIX_ASK_PREFLIGHT_ENABLED =
  String(process.env.HELIX_ASK_PREFLIGHT ?? "1").trim() !== "0";
const HELIX_ASK_PREFLIGHT_REUSE =
  String(process.env.HELIX_ASK_PREFLIGHT_REUSE ?? "1").trim() !== "0";
const HELIX_ASK_PREFLIGHT_TOPK = clampNumber(
  readNumber(process.env.HELIX_ASK_PREFLIGHT_TOPK ?? 6, 6),
  2,
  16,
);
const HELIX_ASK_PREFLIGHT_MIN_FILES = clampNumber(
  readNumber(process.env.HELIX_ASK_PREFLIGHT_MIN_FILES ?? 2, 2),
  1,
  10,
);
const HELIX_ASK_PREFLIGHT_DOC_SHARE = clampNumber(
  readNumber(process.env.HELIX_ASK_PREFLIGHT_DOC_SHARE ?? 0.3, 0.3),
  0,
  1,
);
const HELIX_ASK_HTTP_KEEPALIVE =
  String(process.env.HELIX_ASK_HTTP_KEEPALIVE ?? "1").trim() !== "0";
const HELIX_ASK_HTTP_KEEPALIVE_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_HTTP_KEEPALIVE_MS, 15000),
  2000,
  60000,
);
const HELIX_ASK_FAILURE_MAX_RAW = readNumber(process.env.HELIX_ASK_FAILURE_MAX, 1);
const HELIX_ASK_FAILURE_MAX =
  HELIX_ASK_FAILURE_MAX_RAW <= 0 ? 0 : clampNumber(HELIX_ASK_FAILURE_MAX_RAW, 1, 10);
const HELIX_ASK_FAILURE_COOLDOWN_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_FAILURE_COOLDOWN_MS, 120000),
  10_000,
  900_000,
);
const HELIX_ASK_LOCAL_CONTEXT_TOKENS = resolveLocalContextTokens();
const HELIX_ASK_SCAFFOLD_CONTEXT_CHARS = Math.max(
  800,
  Math.min(6000, HELIX_ASK_CONTEXT_CHARS * 2),
);
const HELIX_ASK_TWO_PASS =
  String(process.env.HELIX_ASK_TWO_PASS ?? process.env.VITE_HELIX_ASK_TWO_PASS ?? "")
    .trim() === "1";
const HELIX_ASK_SINGLE_LLM =
  String(process.env.HELIX_ASK_SINGLE_LLM ?? "1").trim() !== "0";
const HELIX_ASK_SCAFFOLD_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_SCAFFOLD_TOKENS ?? process.env.VITE_HELIX_ASK_SCAFFOLD_TOKENS, 1024),
  64,
  2048,
);
const HELIX_ASK_FORCE_FULL_ANSWERS =
  String(process.env.HELIX_ASK_FORCE_FULL_ANSWERS ?? "1").trim() !== "0";
const HELIX_ASK_FORCE_FULL_ANSWER_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_FORCE_FULL_ANSWER_TOKENS ??
      process.env.VITE_HELIX_ASK_FORCE_FULL_ANSWER_TOKENS,
    3000,
  ),
  1024,
  8192,
);
const HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH =
  String(
    process.env.HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH ??
      process.env.VITE_HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH ??
      "1",
  ).trim() === "1";
const HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH_MIN_SCORE = clampNumber(
  readNumber(
    process.env.HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH_MIN_SCORE ??
      process.env.VITE_HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH_MIN_SCORE,
    52,
  ),
  20,
  100,
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
const HELIX_ASK_SLOT_PLAN_PASS =
  String(process.env.HELIX_ASK_SLOT_PLAN_PASS ?? "1").trim() !== "0";
const HELIX_ASK_SLOT_PLAN_PASS_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_SLOT_PLAN_PASS_TOKENS ?? 160, 160),
  64,
  320,
);
const HELIX_ASK_SLOT_PLAN_PASS_MAX_SLOTS = clampNumber(
  readNumber(process.env.HELIX_ASK_SLOT_PLAN_PASS_MAX_SLOTS ?? 5, 5),
  2,
  8,
);
const HELIX_ASK_SESSION_MEMORY =
  String(process.env.HELIX_ASK_SESSION_MEMORY ?? "1").trim() !== "0";
const HELIX_ASK_AGENT_LOOP =
  String(process.env.HELIX_ASK_AGENT_LOOP ?? "1").trim() !== "0";
const HELIX_ASK_AGENT_LOOP_MAX_STEPS = clampNumber(
  readNumber(process.env.HELIX_ASK_AGENT_LOOP_MAX_STEPS ?? 3, 3),
  1,
  6,
);
const HELIX_ASK_AGENT_ACTION_BUDGET_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_AGENT_ACTION_BUDGET_MS ?? 20_000, 20_000),
  2_000,
  120_000,
);
const HELIX_ASK_AGENT_LOOP_BUDGET_MS = clampNumber(
  readNumber(process.env.HELIX_ASK_AGENT_LOOP_BUDGET_MS ?? 120_000, 120_000),
  10_000,
  900_000,
);
const HELIX_ASK_AGENT_CODE_FIRST =
  String(process.env.HELIX_ASK_AGENT_CODE_FIRST ?? "1").trim() !== "0";
const HELIX_ASK_QUERY_HINTS_BLOCKS =
  String(process.env.HELIX_ASK_QUERY_HINTS_BLOCKS ?? "1").trim() !== "0";
const HELIX_ASK_QUERY_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_QUERY_TOKENS ?? process.env.VITE_HELIX_ASK_QUERY_TOKENS, 128),
  32,
  512,
);
const HELIX_ASK_QUERY_TOKENS_BLOCK = clampNumber(
  readNumber(
    process.env.HELIX_ASK_QUERY_TOKENS_BLOCK ??
      process.env.HELIX_ASK_QUERY_TOKENS ??
      process.env.VITE_HELIX_ASK_QUERY_TOKENS,
    96,
  ),
  32,
  256,
);
const HELIX_ASK_EVIDENCE_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_EVIDENCE_TOKENS ?? process.env.VITE_HELIX_ASK_EVIDENCE_TOKENS, 512),
  64,
  1024,
);
const HELIX_ASK_TOOL_RESULTS =
  String(process.env.HELIX_ASK_TOOL_RESULTS ?? process.env.VITE_HELIX_ASK_TOOL_RESULTS ?? "1").trim() !== "0";
const HELIX_ASK_TOOL_RESULTS_MAX_CHARS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_TOOL_RESULTS_MAX_CHARS ??
      process.env.VITE_HELIX_ASK_TOOL_RESULTS_MAX_CHARS,
    6000,
  ),
  800,
  20000,
);
const HELIX_ASK_COMPACTION_MAX_BLOCKS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_COMPACTION_MAX_BLOCKS ??
      process.env.VITE_HELIX_ASK_COMPACTION_MAX_BLOCKS,
    12,
  ),
  4,
  60,
);
const HELIX_ASK_COMPACTION_MAX_BYTES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_COMPACTION_MAX_BYTES ??
      process.env.VITE_HELIX_ASK_COMPACTION_MAX_BYTES,
    18000,
  ),
  2000,
  200000,
);
const HELIX_ASK_COMPACTION_MAX_PER_FILE = clampNumber(
  readNumber(
    process.env.HELIX_ASK_COMPACTION_MAX_PER_FILE ??
      process.env.VITE_HELIX_ASK_COMPACTION_MAX_PER_FILE,
    2,
  ),
  1,
  6,
);
const HELIX_ASK_CODE_ALIGNMENT =
  String(process.env.HELIX_ASK_CODE_ALIGNMENT ?? process.env.VITE_HELIX_ASK_CODE_ALIGNMENT ?? "1").trim() !== "0";
const HELIX_ASK_CODE_ALIGN_MAX_SYMBOLS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_CODE_ALIGN_MAX_SYMBOLS ??
      process.env.VITE_HELIX_ASK_CODE_ALIGN_MAX_SYMBOLS,
    6,
  ),
  1,
  30,
);
const HELIX_ASK_CODE_ALIGN_MAX_SPANS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_CODE_ALIGN_MAX_SPANS ??
      process.env.VITE_HELIX_ASK_CODE_ALIGN_MAX_SPANS,
    6,
  ),
  1,
  30,
);
const HELIX_ASK_CODE_ALIGN_MAX_BYTES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_CODE_ALIGN_MAX_BYTES ??
      process.env.VITE_HELIX_ASK_CODE_ALIGN_MAX_BYTES,
    8000,
  ),
  1000,
  20000,
);
const HELIX_ASK_CODE_ALIGN_TESTS =
  String(process.env.HELIX_ASK_CODE_ALIGN_TESTS ?? "1").trim() !== "0";
const HELIX_ASK_TREE_WALK_MODE_RAW = String(process.env.HELIX_ASK_TREE_WALK_MODE ?? "full").trim();
const HELIX_ASK_TREE_WALK_MAX_STEPS = clampNumber(
  readNumber(process.env.HELIX_ASK_TREE_WALK_MAX_STEPS ?? 0, 0),
  0,
  60,
);
const HELIX_ASK_TREE_WALK_INJECT =
  String(process.env.HELIX_ASK_TREE_WALK_INJECT ?? "0").trim() === "1";
const HELIX_ASK_TREE_WALK_BINDING =
  String(process.env.HELIX_ASK_TREE_WALK_BINDING ?? "1").trim() !== "0";
const HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS ??
      process.env.VITE_HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS,
    0.45,
  ),
  0,
  1,
);
const HELIX_ASK_DEFINITION_REGISTRY_TOPK = clampNumber(
  readNumber(
    process.env.HELIX_ASK_DEFINITION_REGISTRY_TOPK ??
      process.env.VITE_HELIX_ASK_DEFINITION_REGISTRY_TOPK,
    2,
  ),
  1,
  6,
);
const HELIX_ASK_ANSWER_MAX_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_ANSWER_MAX_TOKENS ??
      process.env.VITE_HELIX_ASK_MAX_TOKENS ??
      process.env.LLM_LOCAL_MAX_TOKENS,
    3072,
  ),
  256,
  8192,
);
const HELIX_ASK_ANSWER_EXTENSION_MAX_ITEMS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_ANSWER_EXTENSION_MAX_ITEMS ??
      process.env.VITE_HELIX_ASK_ANSWER_EXTENSION_MAX_ITEMS,
    3,
  ),
  1,
  8,
);
const HELIX_ASK_SHORT_ANSWER_RETRY_MAX = clampNumber(
  readNumber(
    process.env.HELIX_ASK_SHORT_ANSWER_RETRY_MAX ??
      process.env.VITE_HELIX_ASK_SHORT_ANSWER_RETRY_MAX,
    1,
  ),
  0,
  2,
);
const HELIX_ASK_SHORT_ANSWER_MIN_SENTENCES = readNumber(
  process.env.HELIX_ASK_SHORT_ANSWER_MIN_SENTENCES ??
    process.env.VITE_HELIX_ASK_SHORT_ANSWER_MIN_SENTENCES,
  0,
);
const HELIX_ASK_SHORT_ANSWER_MIN_TOKENS = readNumber(
  process.env.HELIX_ASK_SHORT_ANSWER_MIN_TOKENS ??
    process.env.VITE_HELIX_ASK_SHORT_ANSWER_MIN_TOKENS,
  0,
);
const HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_SENTENCES = clampNumber(
  readNumber(
    process.env.HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_SENTENCES ??
      process.env.VITE_HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_SENTENCES,
    3,
  ),
  1,
  12,
);
const HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_TOKENS ??
      process.env.VITE_HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_TOKENS,
    120,
  ),
  40,
  600,
);
const HELIX_ASK_TREE_DOMINANCE_RATIO = clampNumber(
  readNumber(
    process.env.HELIX_ASK_TREE_DOMINANCE_RATIO ?? process.env.VITE_HELIX_ASK_TREE_DOMINANCE_RATIO,
    0.7,
  ),
  0.5,
  1,
);
const HELIX_ASK_APPEND_EXTENSION_TO_TEXT =
  String(process.env.HELIX_ASK_APPEND_EXTENSION_TO_TEXT ?? "1").trim() !== "0";
const HELIX_ASK_ANSWER_EXTENSION_MIN_WORDS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_ANSWER_EXTENSION_MIN_WORDS ??
      process.env.VITE_HELIX_ASK_ANSWER_EXTENSION_MIN_WORDS,
    260,
  ),
  80,
  1200,
);
const HELIX_ASK_DEFINITION_EVIDENCE_BOOST = clampNumber(
  readNumber(
    process.env.HELIX_ASK_DEFINITION_EVIDENCE_BOOST ??
      process.env.VITE_HELIX_ASK_DEFINITION_EVIDENCE_BOOST,
    128,
  ),
  0,
  512,
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
const HELIX_ASK_LONGPROMPT_QUESTION_OVERFLOW_TOKENS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_LONGPROMPT_QUESTION_OVERFLOW_TOKENS ??
      process.env.VITE_HELIX_ASK_LONGPROMPT_QUESTION_OVERFLOW_TOKENS,
    220,
  ),
  80,
  1200,
);
const HELIX_ASK_CROSS_CONCEPT_HINTS = clampNumber(
  readNumber(process.env.HELIX_ASK_CROSS_CONCEPT_HINTS, 3),
  1,
  8,
);
const HELIX_ASK_REPORT_MODE = String(process.env.HELIX_ASK_REPORT_MODE ?? "1").trim() !== "0";
const HELIX_ASK_REPORT_TRIGGER_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_REPORT_TRIGGER_TOKENS, 220),
  40,
  2000,
);
const HELIX_ASK_REPORT_TRIGGER_CHARS = clampNumber(
  readNumber(process.env.HELIX_ASK_REPORT_TRIGGER_CHARS, 1400),
  200,
  10000,
);
const HELIX_ASK_REPORT_TRIGGER_BLOCKS = clampNumber(
  readNumber(process.env.HELIX_ASK_REPORT_TRIGGER_BLOCKS, 4),
  1,
  20,
);
const HELIX_ASK_REPORT_MAX_BLOCKS = clampNumber(
  readNumber(process.env.HELIX_ASK_REPORT_MAX_BLOCKS, 12),
  2,
  40,
);
const HELIX_ASK_REPORT_BLOCK_CHAR_LIMIT = clampNumber(
  readNumber(process.env.HELIX_ASK_REPORT_BLOCK_CHAR_LIMIT, 900),
  180,
  6000,
);
const HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_TOKENS = clampNumber(
  readNumber(process.env.HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_TOKENS, 95),
  40,
  240,
);
const HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_CHARS = clampNumber(
  readNumber(process.env.HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_CHARS, 900),
  200,
  3200,
);
const HELIX_ASK_IDEOLOGY_CHAT_QUERY_RE =
  /\b(?:what|what\s+is|what\s+does|what\s+do|how|in\s+plain|plain\s+language|simple\s+terms|define|meaning\s+of)\b/i;
const HELIX_ASK_IDEOLOGY_NARRATIVE_QUERY_RE =
  /\b(?:how|why|impact|affect|effects?|societ(y|al)|community|governance|public|policy|scenario|example|examples|trust|rumor|decision|in\s+real\s+world|for\s+a|for\s+an|for\s+the|platform|team|council|school)\b/i;
const HELIX_ASK_IDEOLOGY_REPORT_BAN_RE = /\b(?:report|point[s]?|coverage|summary|compare|difference|between|each|step|slot|bullet|section)\b/i;
const HELIX_ASK_DRIFT_REPAIR = String(process.env.HELIX_ASK_DRIFT_REPAIR ?? "1").trim() !== "0";
const HELIX_ASK_DRIFT_REPAIR_MAX = clampNumber(
  readNumber(process.env.HELIX_ASK_DRIFT_REPAIR_MAX, 1),
  0,
  3,
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
const HELIX_ASK_AMBIGUITY_LABEL_LLM =
  String(process.env.HELIX_ASK_AMBIGUITY_LABEL_LLM ?? "0").trim() === "1";
const HELIX_ASK_AMBIGUITY_EVIDENCE_PASS =
  String(process.env.HELIX_ASK_AMBIGUITY_EVIDENCE_PASS ?? "1").trim() !== "0";
const HELIX_ASK_AMBIGUITY_DOMINANCE_THRESHOLD = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_DOMINANCE_THRESHOLD, 0.18),
  0.05,
  0.8,
);
const HELIX_ASK_AMBIGUITY_SENSE_TOPK = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_SENSE_TOPK, 2),
  2,
  6,
);
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
const HELIX_ASK_AMBIGUITY_CLUSTER_TOPK = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_CLUSTER_TOPK, 18),
  6,
  60,
);
const HELIX_ASK_AMBIGUITY_CLUSTER_MARGIN_MIN = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_CLUSTER_MARGIN_MIN, 0.35),
  0,
  1,
);
const HELIX_ASK_AMBIGUITY_CLUSTER_ENTROPY_MAX = clampNumber(
  readNumber(process.env.HELIX_ASK_AMBIGUITY_CLUSTER_ENTROPY_MAX, 0.6),
  0,
  1,
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
const HELIX_ASK_SCIENTIFIC_CLARIFY =
  String(process.env.HELIX_ASK_SCIENTIFIC_CLARIFY ?? "1").trim() !== "0";
const HELIX_ASK_HYPOTHESIS =
  String(process.env.HELIX_ASK_HYPOTHESIS ?? "0").trim() === "1";
const HELIX_ASK_HYPOTHESIS_STYLE = (() => {
  const raw = String(process.env.HELIX_ASK_HYPOTHESIS_STYLE ?? "conservative")
    .trim()
    .toLowerCase();
  return raw === "exploratory" ? "exploratory" : "conservative";
})();
const HELIX_ASK_SCIENTIFIC_MAX_HYPOTHESES = clampNumber(
  readNumber(process.env.HELIX_ASK_SCIENTIFIC_MAX_HYPOTHESES, 3),
  0,
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
const HELIX_ASK_CONCEPTUAL_FOCUS =
  /\b(what is|what's|define|definition|meaning|concept|theory|how (?:does|do)|effect|impact|influence|consequences?)\b/i;
  const HELIX_ASK_DEFINITION_FOCUS =
    /\b(what does\b[^?]{0,80}\bmean\b|what is|what's|define|definition|meaning|concept|theory|in\s+(gpa|pa|kpa|mpa|bar|psi|hz|khz|mhz|ghz|w|mw|gw|j|ev|kg|g|m|cm|mm|nm|s|ms|ns))\b/i;
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
const HELIX_ASK_INDEX_ONLY_PATHS: RegExp[] = [/server\/_generated\/code-lattice\.json/i];
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
  /\b(synthesize|fit together|bring together|tie together|map (?:it|them)? together|relate (?:these|those|them|it)|connect (?:these|those|them|it)|connect .* to|how do .* fit together|how do .* relate|how does .* connect)\b/i;
const HELIX_ASK_COMPOSITE_MIN_TOPICS = 2;
const HELIX_ASK_COMPOSITE_ALLOWLIST =
  /(docs\/knowledge\/|docs\/ethos\/|server\/gr\/|server\/routes\/warp-viability\.ts|server\/skills\/physics\.warp\.viability\.ts|server\/helix-proof-pack\.ts|shared\/curvature-proxy\.ts|client\/src\/physics\/|client\/src\/pages\/star-hydrostatic-panel\.tsx|client\/src\/components\/WarpLedgerPanel\.tsx|client\/src\/components\/DriveGuardsPanel\.tsx|warp-web\/km-scale-warp-ledger\.html)/i;

type HelixAskVerbosity = "brief" | "normal" | "extended";

const HELIX_ASK_DEFAULT_VERBOSITY = (() => {
  const raw = String(
    process.env.HELIX_ASK_DEFAULT_VERBOSITY ??
      process.env.VITE_HELIX_ASK_DEFAULT_VERBOSITY ??
      "extended",
  )
    .trim()
    .toLowerCase();
  if (raw === "brief" || raw === "normal" || raw === "extended") {
    return raw as HelixAskVerbosity;
  }
  return "extended";
})();

type HelixAskVerbositySpec = {
  steps: {
    count: string;
    sentences: string;
    inPractice: string;
  };
  paragraphs: {
    count: string;
    sentences: string;
    inPractice: string;
  };
  compareBullets: string;
};

const HELIX_ASK_VERBOSITY_SPECS: Record<HelixAskVerbosity, HelixAskVerbositySpec> = {
  brief: {
    steps: { count: "6-9", sentences: "2-3", inPractice: "2-3" },
    paragraphs: { count: "2-3", sentences: "2-3", inPractice: "2-3" },
    compareBullets: "3-5",
  },
  normal: {
    steps: { count: "7-10", sentences: "2-4", inPractice: "2-4" },
    paragraphs: { count: "3-4", sentences: "2-4", inPractice: "2-4" },
    compareBullets: "4-6",
  },
  extended: {
    steps: { count: "9-12", sentences: "3-5", inPractice: "3-5" },
    paragraphs: { count: "4-6", sentences: "3-5", inPractice: "3-5" },
    compareBullets: "5-7",
  },
};

const resolveHelixAskVerbositySpec = (verbosity: HelixAskVerbosity): HelixAskVerbositySpec =>
  HELIX_ASK_VERBOSITY_SPECS[verbosity] ?? HELIX_ASK_VERBOSITY_SPECS.brief;

function resolveHelixAskVerbosity(
  question: string,
  intentProfile: HelixAskIntentProfile,
  requested?: HelixAskVerbosity,
): HelixAskVerbosity {
  if (requested) return requested;
  const fallbackVerbosity = HELIX_ASK_DEFAULT_VERBOSITY;
  if (intentProfile.strategy !== "constraint_report") return fallbackVerbosity;
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
  return fallbackVerbosity;
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
const HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE = /^\s*ANSWER_(?:START|END)\b\s*/i;
const HELIX_ASK_ANSWER_MARKER_SPLIT_RE = /\b(?:ANSWER_START|ANSWER_END)\b/gi;
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
const HELIX_ASK_JOB_HEARTBEAT_MS = clampNumber(
  readNumber(
    process.env.HELIX_ASK_JOB_HEARTBEAT_MS ?? process.env.VITE_HELIX_ASK_JOB_HEARTBEAT_MS,
    Math.max(2_000, Math.floor(HELIX_ASK_JOB_TIMEOUT_MS / 6)),
  ),
  1_000,
  60_000,
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
  const elapsedMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0;
  appendToolLog({
    tool: HELIX_ASK_PROGRESS_TOOL,
    version: HELIX_ASK_PROGRESS_VERSION,
    paramsHash: hashHelixAskProgress(`${stage}:${cleanedDetail ?? ""}`),
    durationMs: elapsedMs,
    sessionId,
    traceId,
    ok,
    stage,
    detail: cleanedDetail,
    message: label,
    meta: startedAt ? { elapsedMs } : undefined,
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

type HelixAskCircuitState = {
  failures: number;
  openedUntil: number;
  lastError?: string;
  lastFailureAt?: number;
};

const helixAskCircuit: HelixAskCircuitState = {
  failures: 0,
  openedUntil: 0,
};

const resetHelixAskCircuit = (): void => {
  helixAskCircuit.failures = 0;
  helixAskCircuit.openedUntil = 0;
  helixAskCircuit.lastError = undefined;
  helixAskCircuit.lastFailureAt = undefined;
};

const normalizeHelixAskError = (error: unknown): string => {
  if (!error) return "unknown_error";
  if (error instanceof Error) return error.message || "error";
  if (typeof error === "string") return error;
  if (typeof (error as { message?: unknown }).message === "string") {
    return String((error as { message?: unknown }).message);
  }
  return "error";
};

const recordHelixAskFailure = (error: unknown): void => {
  if (HELIX_ASK_FAILURE_MAX <= 0) return;
  const message = normalizeHelixAskError(error);
  helixAskCircuit.failures += 1;
  helixAskCircuit.lastError = message.slice(0, 280);
  helixAskCircuit.lastFailureAt = Date.now();
  if (helixAskCircuit.failures >= HELIX_ASK_FAILURE_MAX) {
    helixAskCircuit.openedUntil = Date.now() + HELIX_ASK_FAILURE_COOLDOWN_MS;
  }
};

const recordHelixAskSuccess = (): void => {
  if (HELIX_ASK_FAILURE_MAX <= 0) return;
  resetHelixAskCircuit();
};

const isHelixAskCircuitOpen = (): boolean => {
  if (HELIX_ASK_FAILURE_MAX <= 0) return false;
  if (!helixAskCircuit.openedUntil) return false;
  if (Date.now() < helixAskCircuit.openedUntil) return true;
  resetHelixAskCircuit();
  return false;
};

const buildHelixAskCircuitPayload = (debug?: boolean) => {
  const retryAfterMs = Math.max(0, helixAskCircuit.openedUntil - Date.now());
  const payload: {
    ok: boolean;
    error: string;
    message: string;
    retryAfterMs: number;
    status: number;
    debug?: {
      circuit_open: boolean;
      failures: number;
      last_error: string | null;
      last_failure_at: string | null;
    };
  } = {
    ok: false,
    error: "helix_ask_temporarily_unavailable",
    message: "Helix Ask is cooling down after a runtime error. Please retry shortly.",
    retryAfterMs,
    status: 503,
  };
  if (debug) {
    payload.debug = {
      circuit_open: true,
      failures: helixAskCircuit.failures,
      last_error: helixAskCircuit.lastError ?? null,
      last_failure_at: helixAskCircuit.lastFailureAt
        ? new Date(helixAskCircuit.lastFailureAt).toISOString()
        : null,
    };
  }
  return payload;
};

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
    /^answer_(?:start|end)\b/i.test(cleaned) ||
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
    /^to\s+revise the answer\b/i.test(cleaned) ||
    /^do not add new claims\b/i.test(cleaned) ||
    /^preserve the format\b/i.test(cleaned) ||
    /^keep the paragraph format\b/i.test(cleaned) ||
    /^keep the numbered step list\b/i.test(cleaned) ||
    /^identify the relevant citations\b/i.test(cleaned) ||
    /^follow these steps\b/i.test(cleaned) ||
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

const stripAnswerBoundaryPrefix = (value: string): string => {
  let cursor = value;
  let next = cursor.trimStart();
  while (true) {
    const stripped = next.replace(HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE, "");
    if (stripped === next) {
      break;
    }
    next = stripped.trimStart();
  }
  return next;
};

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
  trimmed = stripAnswerBoundaryPrefix(trimmed);
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
      return !isPromptLine(stripAnswerBoundaryPrefix(cleaned));
    })
    .join("\n")
    .trim();
  trimmed = stripAnswerBoundaryPrefix(trimmed);
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
  const splitSegments = value
    .split(HELIX_ASK_ANSWER_MARKER_SPLIT_RE)
    .map((segment) => stripAnswerBoundaryPrefix(segment).trim())
    .filter(Boolean);
  if (splitSegments.length > 0) {
    const longest = splitSegments.reduce((best, candidate) =>
      best.length >= candidate.length ? best : candidate,
    "");
    if (longest) return longest;
  }
  const startIndex = value.lastIndexOf(HELIX_ASK_ANSWER_START);
  if (startIndex >= 0) {
    const afterStart = value.slice(startIndex + HELIX_ASK_ANSWER_START.length);
    const endIndex = afterStart.lastIndexOf(HELIX_ASK_ANSWER_END);
    const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    const trimmed = stripAnswerBoundaryPrefix(slice).trim();
    if (trimmed) return trimmed;
  }
  const boundaryStartTrimmed = stripAnswerBoundaryPrefix(value);
  if (boundaryStartTrimmed.trim()) return boundaryStartTrimmed.trim();
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

const HELIX_ASK_IDEOLOGY_SCENARIO_RE =
  /\b(?:team|platform|organization|org|city|community|product|group|office|company|department|government|school|hospital|forum|moderation|network|platforms|service|service provider)\b/i;

const trim = (value: string): string => value.replace(/\s+/g, " ").trim();

const HELIX_ASK_NOTE_CLAUSE_RE =
  /(?:^|[.;]\s*)([A-Za-z][A-Za-z0-9\s-]*?)\s*:\s*([^.;]+)(?=(?:[.;]\s*[A-Za-z][A-Za-z0-9\s-]*\s*:|$))/g;

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(" ")
    .map((token) => (token ? token.charAt(0).toUpperCase() + token.slice(1) : token))
    .join(" ");

type HelixAskConceptNoteEntry = {
  label: string;
  value: string;
};

const parseConceptNotesEntries = (notes?: string): HelixAskConceptNoteEntry[] => {
  if (!notes) return [];
  const trimmed = notes.trim();
  if (!trimmed) return [];
  const entries: HelixAskConceptNoteEntry[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  HELIX_ASK_NOTE_CLAUSE_RE.lastIndex = 0;
  while ((match = HELIX_ASK_NOTE_CLAUSE_RE.exec(trimmed)) !== null) {
    const rawLabel = match[1]?.trim();
    const rawValue = match[2]?.trim();
    if (!rawLabel || !rawValue) continue;
    const label = toTitleCase(rawLabel);
    const value = rawValue.replace(/\s*[.;]\s*$/, "").trim();
    if (!value) continue;
    const key = `${label.toLowerCase()}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ label, value });
  }
  if (entries.length > 0) {
    return entries;
  }
  const fallback = ensureSentence(trimmed);
  return fallback ? [{ label: "Notes", value: fallback }] : [];
};

const stripConversationQuote = (value: string): string =>
  value.replace(/^["']/, "").replace(/["']$/, "").trim();

const extractIdeologyScenarioSeed = (question: string): string | null => {
  const match = question.match(
    /\b(?:for|for the|for an|for a|in|for your|for their)\s+([^?.!,]+?)(?:\?|,|\s+when|\s+if|\s+how|$)/i,
  );
  if (!match?.[1]) return null;
  const seed = trim(match[1]);
  if (seed.length < 6 || seed.length > 120) return null;
  return HELIX_ASK_IDEOLOGY_SCENARIO_RE.test(seed) ? seed : null;
};

const buildIdeologyConversationSeed = (match: HelixAskConceptMatch | null): string => {
  if (!match) return "";
  const { card } = match;
  const label = card.label ? stripConversationQuote(card.label) : card.id;
  const definition = card.definition ? card.definition.trim() : "";
  const notes = parseConceptNotesEntries(card.notes);
  const effect = notes.find((entry) =>
    entry.label.toLowerCase().includes("societal effect"),
  )?.value;
  const civicEffect = effect ? ` Societal effect: ${ensureSentence(effect)}` : "";
  const scope = card.scope ? ` Scope: ${stripConversationQuote(card.scope)}.` : "";
  const definitionSentence = definition
    ? ensureSentence(`"${label}" means ${definition.charAt(0).toLowerCase() + definition.slice(1)}`)
    : `${label} is defined in the ideology tree.`;
  return `${definitionSentence}${civicEffect}${scope}`.trim();
};

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

function buildConstraintMatrix(args: {
  answer: string;
  question: string;
  format: HelixAskFormat;
  requiresRepoEvidence: boolean;
  stageTags: boolean;
}): { section_count: number; constraints: Array<{ id: string; satisfied: boolean; detail?: string }> } {
  const trimmed = args.answer.trim();
  const paragraphs = trimmed
    ? trimmed.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const stepLines = lines.filter((line) => /^\d+\.\s+/.test(line));
  const sectionCount = args.format === "steps" ? stepLines.length : paragraphs.length;
  const constraints: Array<{ id: string; satisfied: boolean; detail?: string }> = [];
  if (args.format === "steps") {
    constraints.push({
      id: "steps_format",
      satisfied: stepLines.length > 0,
      detail: `steps=${stepLines.length}`,
    });
  } else if (hasTwoParagraphContract(args.question)) {
    constraints.push({
      id: "two_paragraphs",
      satisfied: paragraphs.length === 2,
      detail: `paragraphs=${paragraphs.length}`,
    });
  }
  if (args.requiresRepoEvidence) {
    const citationCount = extractFilePathsFromText(args.answer).length;
    constraints.push({
      id: "citations_required",
      satisfied: citationCount > 0,
      detail: `citations=${citationCount}`,
    });
  }
  if (args.stageTags && args.format === "steps") {
    const hasStageTag = stepLines.some((line) =>
      /\((observe|hypothesis|experiment|analysis|explain)\)/i.test(line),
    );
    constraints.push({
      id: "stage_tags",
      satisfied: hasStageTag,
      detail: hasStageTag ? "present" : "missing",
    });
  }
  return { section_count: sectionCount, constraints };
}

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

type HelixAskAnswerBudget = {
  tokens: number;
  cap: number;
  base: number;
  boosts: string[];
  reason: string;
  override: boolean;
};

const HELIX_ASK_SHORT_SENTENCE_TARGET: Record<HelixAskVerbosity, number> = {
  brief: 4,
  normal: 6,
  extended: 8,
};

const HELIX_ASK_SHORT_TOKEN_TARGET: Record<HelixAskVerbosity, number> = {
  brief: 140,
  normal: 240,
  extended: 360,
};

const resolveShortAnswerThreshold = (verbosity: HelixAskVerbosity): { sentences: number; tokens: number } => {
  const baseSentences = HELIX_ASK_SHORT_SENTENCE_TARGET[verbosity] ?? 4;
  const baseTokens = HELIX_ASK_SHORT_TOKEN_TARGET[verbosity] ?? 140;
  const sentences =
    HELIX_ASK_SHORT_ANSWER_MIN_SENTENCES > 0
      ? HELIX_ASK_SHORT_ANSWER_MIN_SENTENCES
      : baseSentences;
  const tokens =
    HELIX_ASK_SHORT_ANSWER_MIN_TOKENS > 0
      ? HELIX_ASK_SHORT_ANSWER_MIN_TOKENS
      : baseTokens;
  return {
    sentences: clampNumber(sentences, 2, 32),
    tokens: clampNumber(tokens, 60, 1400),
  };
};

const computeAnswerTokenBudget = ({
  verbosity,
  format,
  scaffoldTokens,
  evidenceText,
  definitionFocus,
  composite,
  hasRepoEvidence,
  hasGeneralEvidence,
  maxTokensOverride,
}: {
  verbosity: HelixAskVerbosity;
  format: HelixAskFormat;
  scaffoldTokens: number;
  evidenceText?: string;
  definitionFocus?: boolean;
  composite?: boolean;
  hasRepoEvidence?: boolean;
  hasGeneralEvidence?: boolean;
  maxTokensOverride?: number | null;
}): HelixAskAnswerBudget => {
  if (typeof maxTokensOverride === "number" && Number.isFinite(maxTokensOverride) && maxTokensOverride > 0) {
    const requested = Math.max(0, maxTokensOverride);
    const requestedCap = clampNumber(requested, 64, HELIX_ASK_ANSWER_MAX_TOKENS);
    const forcedMinCap = HELIX_ASK_FORCE_FULL_ANSWERS
      ? clampNumber(HELIX_ASK_FORCE_FULL_ANSWER_TOKENS, 64, HELIX_ASK_ANSWER_MAX_TOKENS)
      : requestedCap;
    const boosted = HELIX_ASK_FORCE_FULL_ANSWERS && requestedCap < forcedMinCap
      ? ["request_override", "force_full_answer"]
      : ["request_override"];
    const capped = Math.max(requestedCap, forcedMinCap);
    const reason = HELIX_ASK_FORCE_FULL_ANSWERS && requestedCap < forcedMinCap
      ? "request_override_force_full"
      : "request_override";
    return {
      tokens: capped,
      cap: HELIX_ASK_ANSWER_MAX_TOKENS,
      base: capped,
      boosts: boosted,
      reason,
      override: true,
    };
  }
  let base =
    verbosity === "extended"
      ? 2800
      : verbosity === "normal"
      ? 1800
      : 1100;
  const boosts: string[] = [];
  if (format === "steps") {
    base += 150;
    boosts.push("steps");
  }
  if (definitionFocus) {
    base += 250;
    boosts.push("definition");
  }
  if (composite) {
    base += 300;
    boosts.push("composite");
  }
  if (hasRepoEvidence && hasGeneralEvidence) {
    base += 200;
    boosts.push("hybrid");
  }
  const evidenceTokens = estimateTokenCount(evidenceText ?? "");
  if (evidenceTokens > 600) {
    base += 200;
    boosts.push("evidence>600");
  }
  if (evidenceTokens > 1000) {
    base += 200;
    boosts.push("evidence>1000");
  }
  if (evidenceTokens > 1400) {
    base += 200;
    boosts.push("evidence>1400");
  }
  if (HELIX_ASK_FORCE_FULL_ANSWERS) {
    const forcedFloor = clampNumber(
      HELIX_ASK_FORCE_FULL_ANSWER_TOKENS,
      64,
      HELIX_ASK_ANSWER_MAX_TOKENS,
    );
    if (base < forcedFloor) {
      base = forcedFloor;
      boosts.push("force_full_floor");
    }
  }
  base = Math.max(base, scaffoldTokens);
  const capped = clampNumber(base, 256, HELIX_ASK_ANSWER_MAX_TOKENS);
  return {
    tokens: capped,
    cap: HELIX_ASK_ANSWER_MAX_TOKENS,
    base,
    boosts,
    reason: boosts.length ? `auto:${boosts.join(",")}` : "auto:base",
    override: false,
  };
};

const isShortAnswer = (
  text: string,
  verbosity: HelixAskVerbosity,
): { short: boolean; sentences: number; tokens: number } => {
  if (!text.trim()) return { short: true, sentences: 0, tokens: 0 };
  const sentences = splitGroundedSentences(text);
  const tokenCount = estimateTokenCount(text);
  const threshold = resolveShortAnswerThreshold(verbosity);
  return {
    short: sentences.length < threshold.sentences || tokenCount < threshold.tokens,
    sentences: sentences.length,
    tokens: tokenCount,
  };
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
  if (hasTopic("ui") || hasTopic("frontend") || hasTopic("client") || /ui|panel|dashboard|hud|frontend/i.test(normalized)) {
    push("docs/knowledge/ui-components-tree.json");
    push("docs/knowledge/ui-backend-binding-tree.json");
    push("client/src/components");
    push("client/src/pages");
    push("client/src/hooks");
    push("helix desktop panels");
  }
  if (hasTopic("backend") || /backend|api|endpoint|service/i.test(normalized)) {
    push("server/helix-core.ts");
    push("server/routes.ts");
    push("server/services");
  }
  if (hasTopic("simulation") || /simulation|simulator|sweep/i.test(normalized)) {
    push("docs/knowledge/physics/simulation-systems-tree.json");
    push("simulations");
    push("sim_core");
    push("modules/analysis");
  }
  if (hasTopic("uncertainty") || /uncertainty|error bars|confidence interval/i.test(normalized)) {
    push("docs/knowledge/physics/uncertainty-mechanics-tree.json");
    push("docs/knowledge/certainty-framework-tree.json");
  }
  if (hasTopic("knowledge") || hasTopic("rag") || /knowledge ingestion|rag|retrieval/i.test(normalized)) {
    push("docs/knowledge/knowledge-ingestion-tree.json");
    push("server/services/knowledge");
    push("server/config/knowledge.ts");
  }
  if (hasTopic("essence") || /essence profile|essence mix/i.test(normalized)) {
    push("docs/knowledge/essence-luma-noise-tree.json");
    push("server/routes/essence.ts");
    push("shared/essence-persona.ts");
  }
  if (hasTopic("luma") || /luma/i.test(normalized)) {
    push("docs/knowledge/essence-luma-noise-tree.json");
    push("server/services/luma.ts");
    push("client/src/pages/luma.tsx");
  }
  if (hasTopic("noise") || /noise gen|noise field|noisegen/i.test(normalized)) {
    push("docs/knowledge/essence-luma-noise-tree.json");
    push("server/services/noisegen-store.ts");
    push("client/src/pages/noisegen.tsx");
  }
  if (hasTopic("hardware") || /hardware telemetry|hardware feed/i.test(normalized)) {
    push("docs/knowledge/hardware-telemetry-tree.json");
    push("server/helix-core.ts");
    push("client/src/hooks/useHardwareFeeds.ts");
  }
  if (hasTopic("telemetry") || /telemetry|observability|metrics/i.test(normalized)) {
    push("docs/knowledge/hardware-telemetry-tree.json");
    push("server/services/observability");
    push("server/skills/telemetry.panels.ts");
  }
  if (hasTopic("queue") || hasTopic("jobs") || /queue|scheduler|orchestration/i.test(normalized)) {
    push("docs/knowledge/queue-orchestration-tree.json");
    push("server/services/jobs");
  }
  if (hasTopic("ops") || hasTopic("ci") || /deployment|release|ci|cd|runbook/i.test(normalized)) {
    push("docs/knowledge/ops-deployment-tree.json");
    push(".github/workflows/casimir-verify.yml");
    push("ops");
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
    "concept_slots: <slot-id-1>, <slot-id-2>",
    "evidence_criteria: <slot-id> => short evidence phrases/headings that would prove the slot",
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

function buildHelixAskSlotPlanPrompt(
  question: string,
  options?: { conceptCandidates?: HelixAskConceptCandidate[] },
): string {
  const candidates = options?.conceptCandidates ?? [];
  const candidateHints = candidates.slice(0, 6).map((candidate) => {
    const label = candidate.card.label ?? candidate.card.id;
    const alias = candidate.matchedTerm && candidate.matchedTerm !== label ? candidate.matchedTerm : "";
    return `- ${label}${alias ? ` (alias: ${alias})` : ""}`;
  });
  const lines = [
    "You are Helix Ask slot planner.",
    "Return strict JSON only. Do NOT include commentary or markdown fences.",
    "Goal: extract 2-5 concise slot labels (noun phrases) from the question.",
    "Avoid generic verbs like relate/associated/fit/impact/creation; prefer specific concepts.",
    "Do NOT invent facts or repo claims. Structure only.",
    "Schema:",
    '{ "slots":[{"label":"<slot>","aliases":["..."],"surfaces":["docs|knowledge|ethos|server|client|modules|shared|tests|scripts|cli|packages|warp-web|apps|code"],"required":true|false,"clarify":["..."]}], "expected_surfaces":["docs","knowledge"], "clarify_candidates":["..."] }',
    "aliases: optional paraphrases or file-ish phrases from the question.",
    "surfaces: optional preferred repo areas (if obvious).",
    "required: mark true for the most central 1-2 slots.",
    "clarify: optional ambiguous senses for a slot.",
    candidateHints.length ? "Known concept candidates (optional):" : "",
    candidateHints.length ? candidateHints.join("\n") : "",
    "",
    `Question: ${question}`,
  ];
  return lines.filter(Boolean).join("\n");
}

const coerceSlotPlanSurfaces = (values?: string[]): string[] => {
  if (!values?.length) return [];
  const surfaces = new Set<string>();
  for (const entry of values) {
    const cleaned = entry.trim().toLowerCase();
    if (!cleaned) continue;
    if (SLOT_PLAN_SURFACES.has(cleaned)) surfaces.add(cleaned);
  }
  return Array.from(surfaces).slice(0, 6);
};

function parseSlotPlanPassResult(raw: string): HelixAskSlotPlanPass | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = SLOT_PLAN_PASS_SCHEMA.safeParse(JSON.parse(jsonCandidate));
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    return null;
  }
  return null;
}

const buildSlotPlanPassEntries = (
  pass: HelixAskSlotPlanPass | null,
): HelixAskSlotPlanEntry[] => {
  if (!pass) return [];
  const out: HelixAskSlotPlanEntry[] = [];
  const slots = pass.slots.slice(0, HELIX_ASK_SLOT_PLAN_PASS_MAX_SLOTS);
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const label = normalizeAliasValue(slot.label);
    if (!label) continue;
    const id = normalizeSlotId(label);
    if (!id) continue;
    const normalizedToken = normalizeSlotName(label).replace(/_/g, " ");
    if (SLOT_IGNORE_TOKENS.has(normalizedToken)) continue;
    const aliases = new Set<string>();
    (slot.aliases ?? []).forEach((alias) => {
      const cleaned = normalizeAliasValue(alias);
      if (cleaned) aliases.add(cleaned);
    });
    (slot.clarify ?? []).forEach((entry) => {
      const cleaned = normalizeAliasValue(entry);
      if (cleaned) aliases.add(cleaned);
    });
    const surfaces = coerceSlotPlanSurfaces(slot.surfaces);
      out.push({
        id,
        label,
        required: Boolean(slot.required),
        source: "plan_pass",
        weak: false,
        aliases: Array.from(aliases).slice(0, SLOT_ALIAS_MAX),
        surfaces: surfaces.length ? surfaces : undefined,
      });
  }
  return out;
};

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
type EvidenceEligibility = ReturnType<typeof evaluateEvidenceEligibility>;

type AmbiguityCluster = {
  key: string;
  label: string;
  score: number;
  mass: number;
  count: number;
  paths: string[];
};

type AmbiguityClusterSummary = {
  targetSpan?: string;
  totalScore: number;
  topScore: number;
  margin: number;
  entropy: number;
  clusters: AmbiguityCluster[];
};

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
  conceptSlots: string[];
  evidenceCriteria?: Record<string, string[]>;
  clarifyQuestion?: string;
};

type HelixAskPlanScope = {
  allowlistTiers?: RegExp[][];
  avoidlist?: RegExp[];
  mustIncludeGlobs?: RegExp[];
  mustIncludeEntries?: string[];
  mustIncludeMissing?: string[];
  docsFirst?: boolean;
  docsAllowlist?: RegExp[][];
  overrideAllowlist?: boolean;
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
    conceptSlots: [],
    evidenceCriteria: {},
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
  const pushEvidenceCriteria = (slotId: string, criteria: string[]) => {
    const key = normalizeSlotId(slotId);
    if (!key || criteria.length === 0) return;
    const existing = directives.evidenceCriteria?.[key] ?? [];
    const merged = new Set<string>([...existing, ...criteria]);
    directives.evidenceCriteria = directives.evidenceCriteria ?? {};
    directives.evidenceCriteria[key] = Array.from(merged).slice(0, 8);
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
    if (normalized.startsWith("concept_slots")) {
      directives.conceptSlots.push(...parsePlanList(splitDirectiveValue(cleaned)));
      continue;
    }
    if (
      normalized.startsWith("evidence_criteria") ||
      normalized.startsWith("slot_evidence") ||
      normalized.startsWith("evidence_for")
    ) {
      const value = splitDirectiveValue(cleaned);
      if (value) {
        const normalizedValue = normalizePlanValue(value);
        const parts = normalizedValue.split(/\s*(?:=>|->)\s*/);
        if (parts.length >= 2) {
          const slotId = parts[0]?.trim() ?? "";
          const criteria = parsePlanList(parts.slice(1).join(" => "))
            .map(normalizePlanDirectiveEntry)
            .filter(Boolean);
          pushEvidenceCriteria(slotId, criteria);
        } else {
          const entries = parsePlanList(normalizedValue)
            .map(normalizePlanDirectiveEntry)
            .filter(Boolean);
          if (entries.length > 1) {
            pushEvidenceCriteria(entries[0], entries.slice(1));
          }
        }
      }
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
  directives.conceptSlots = Array.from(new Set(directives.conceptSlots));
  return { directives, queryHints };
}

const sanitizeMustIncludeGlobs = (
  entries: string[],
): { globs: string[]; missing: string[] } => {
  const globs: string[] = [];
  const missing: string[] = [];
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (/[*?\[\]{}]/.test(trimmed)) {
      globs.push(trimmed);
      continue;
    }
    const normalized = trimmed.replace(/\\/g, "/").replace(/^\.\/+/, "");
    const resolved = path.isAbsolute(normalized)
      ? normalized
      : path.resolve(process.cwd(), normalized);
    if (fs.existsSync(resolved)) {
      globs.push(normalized);
    } else {
      missing.push(normalized);
    }
  }
  return { globs, missing };
};

const resolveMustIncludeMissing = (
  scope: HelixAskPlanScope | null | undefined,
  files: string[],
): string[] => {
  if (!scope?.mustIncludeGlobs?.length) return [];
  const entries = scope.mustIncludeEntries ?? [];
  if (!entries.length || entries.length !== scope.mustIncludeGlobs.length) return [];
  const missing: string[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const regex = scope.mustIncludeGlobs[i];
    if (!files.some((filePath) => regex.test(filePath))) {
      missing.push(entries[i]);
    }
  }
  return missing;
};

function buildPlanScope({
  directives,
  topicTags,
  requiresRepoEvidence,
  repoExpectationLevel,
  question,
  conceptMatch,
  override,
}: {
  directives?: HelixAskPlanDirectives | null;
  topicTags: HelixAskTopicTag[];
  requiresRepoEvidence: boolean;
  repoExpectationLevel: "low" | "medium" | "high";
  question: string;
  conceptMatch?: HelixAskConceptMatch | null;
  override?: HelixAskPlanScope | null;
}): HelixAskPlanScope {
  const scope: HelixAskPlanScope = {};
  const preferredSurfaces = new Set<string>(directives?.preferredSurfaces ?? []);
  const rawMustInclude = Array.from(new Set(directives?.mustIncludeGlobs ?? []));
  const { globs: sanitizedMustInclude, missing: missingMustInclude } =
    sanitizeMustIncludeGlobs(rawMustInclude);
  const mustIncludeGlobs = new Set<string>(sanitizedMustInclude);
  const avoidSurfaces = new Set<string>(directives?.avoidSurfaces ?? []);
  const definitionFocus = isDefinitionQuestion(question);
  const conceptMustInclude = conceptMatch?.card.mustIncludeFiles ?? [];
  const conceptDocsFirst = conceptMustInclude.some((filePath) => {
    const normalized = filePath.replace(/\\/g, "/").toLowerCase();
    return normalized.startsWith("docs/");
  });
  const conceptEthos = conceptMustInclude.some((filePath) => {
    const normalized = filePath.replace(/\\/g, "/").toLowerCase();
    return normalized.startsWith("docs/ethos/");
  });
  const wantsDocsFirst =
    definitionFocus ||
    (HELIX_ASK_CONCEPTUAL_FOCUS.test(question) &&
      topicTags.some((tag) => tag === "warp" || tag === "concepts"));
  const docsFirst =
    repoExpectationLevel !== "low" &&
    (wantsDocsFirst ||
      conceptDocsFirst ||
      topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star"));
  if (docsFirst) {
    preferredSurfaces.add("docs");
    preferredSurfaces.add("knowledge");
    if (
      conceptEthos ||
      topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star")
    ) {
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
    scope.mustIncludeEntries = sanitizedMustInclude;
  }
  if (missingMustInclude.length) {
    scope.mustIncludeMissing = missingMustInclude;
  }
  if (docsFirst) {
    const docsSurfaces = ["docs", "knowledge"];
    if (
      conceptEthos ||
      topicTags.some((tag) => tag === "ideology" || tag === "ledger" || tag === "star")
    ) {
      docsSurfaces.push("ethos");
    }
    const docsRegexes = buildPlanSurfaceRegexes(docsSurfaces);
    const docsAllowlist: RegExp[][] = [];
    if (docsRegexes.length) docsAllowlist.push(docsRegexes);
    if (mustRegexes.length) docsAllowlist.push(mustRegexes);
    scope.docsFirst = true;
    scope.docsAllowlist = docsAllowlist.length ? docsAllowlist : undefined;
  }
  if (!override) return scope;
  return mergePlanScope(scope, override);
}

function mergePlanScope(base: HelixAskPlanScope, override: HelixAskPlanScope): HelixAskPlanScope {
  const merged: HelixAskPlanScope = { ...base };
  if (override.allowlistTiers && override.allowlistTiers.length > 0) {
    merged.allowlistTiers = override.allowlistTiers;
    merged.overrideAllowlist = override.overrideAllowlist ?? true;
  }
  if (override.avoidlist && override.avoidlist.length > 0) {
    merged.avoidlist = override.avoidlist;
  }
  if (override.mustIncludeGlobs && override.mustIncludeGlobs.length > 0) {
    merged.mustIncludeGlobs = override.mustIncludeGlobs;
    merged.mustIncludeEntries = override.mustIncludeEntries ?? [];
    merged.mustIncludeMissing = override.mustIncludeMissing;
  }
  if (override.docsFirst !== undefined) {
    merged.docsFirst = override.docsFirst;
  }
  if (override.docsAllowlist && override.docsAllowlist.length > 0) {
    merged.docsAllowlist = override.docsAllowlist;
  }
  if (override.overrideAllowlist !== undefined) {
    merged.overrideAllowlist = override.overrideAllowlist;
  }
  return merged;
}

function normalizeSlotName(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

type HelixAskSlotPlanEntry = {
  id: string;
  label: string;
  required: boolean;
  source:
    | "concept"
    | "plan"
    | "plan_pass"
    | "memory"
    | "memory_resolved"
    | "heading"
    | "graph"
    | "token";
  weak?: boolean;
  surfaces?: string[];
  aliases?: string[];
  evidenceCriteria?: string[];
};

type HelixAskSlotPlan = {
  slots: HelixAskSlotPlanEntry[];
  coverageSlots: string[];
};

type HelixAskSlotPlanPassSlot = {
  label: string;
  aliases?: string[];
  surfaces?: string[];
  required?: boolean;
  clarify?: string[];
};

type HelixAskSlotPlanPass = {
  slots: HelixAskSlotPlanPassSlot[];
  expected_surfaces?: string[];
  clarify_candidates?: string[];
};

const SLOT_PLAN_PASS_SCHEMA = z.object({
  slots: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        aliases: z.array(z.string().min(1).max(120)).max(8).optional(),
        surfaces: z.array(z.string().min(1).max(32)).max(8).optional(),
        required: z.boolean().optional(),
        clarify: z.array(z.string().min(1).max(120)).max(4).optional(),
      }),
    )
    .min(1)
    .max(HELIX_ASK_SLOT_PLAN_PASS_MAX_SLOTS),
  expected_surfaces: z.array(z.string().min(1).max(32)).max(8).optional(),
  clarify_candidates: z.array(z.string().min(1).max(120)).max(6).optional(),
});

  const STRUCTURAL_SLOTS = new Set([
    "definition",
    "repo_mapping",
    "verification",
    "failure_path",
    "flow",
    "pipeline",
  ]);

  // Slot tiers for reasoning contract (A=hard, B=strong, C=soft).
  const SLOT_TIER_SOURCES: Record<HelixAskSlotPlanEntry["source"], "A" | "B" | "C"> = {
    concept: "A",
    memory: "A",
    memory_resolved: "A",
    heading: "B",
    graph: "B",
    plan: "C",
    plan_pass: "C",
    token: "C",
  };

  const resolveSlotTier = (slot: HelixAskSlotPlanEntry): "A" | "B" | "C" =>
    SLOT_TIER_SOURCES[slot.source] ?? "C";

  // Only sources with hard evidence can force required coverage slots.
  const HARD_REQUIRED_SLOT_SOURCES = new Set<HelixAskSlotPlanEntry["source"]>([
    "concept",
    "memory",
    "memory_resolved",
  ]);

  const isHardRequiredSlot = (slot: HelixAskSlotPlanEntry): boolean =>
    slot.required && !isWeakSlot(slot) && HARD_REQUIRED_SLOT_SOURCES.has(slot.source);

const DOC_SURFACES = new Set(["docs", "knowledge", "ethos"]);
const SLOT_PLAN_SURFACES = new Set([
  "docs",
  "knowledge",
  "ethos",
  "code",
  "server",
  "client",
  "modules",
  "shared",
  "tests",
  "scripts",
  "cli",
  "packages",
  "warp-web",
  "apps",
]);

const isWeakSlot = (slot: HelixAskSlotPlanEntry): boolean =>
  slot.weak === true || slot.source === "token";

const SLOT_IGNORE_TOKENS = new Set([
  "plan",
  "fit",
  "creation",
  "create",
  "creating",
  "make",
  "made",
  "build",
  "building",
  "relate",
  "relation",
  "relates",
  "relating",
  "root",
  "cause",
  "causes",
  "also",
  "into",
  "about",
  "with",
  "without",
  "from",
  "that",
  "this",
  "these",
  "those",
  "which",
  "what",
  "why",
  "how",
  "does",
  "do",
  "is",
  "are",
  "can",
  "should",
  "could",
  "would",
  "implement",
  "implementation",
  "loop",
  "retrieval",
  "controller",
  "file",
  "files",
]);

const normalizeSlotId = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized;
};

const SLOT_ALIAS_MAX = 12;
const DOC_ALIAS_IGNORE = new Set([
  "index",
  "readme",
  "overview",
  "intro",
  "notes",
  "guide",
  "manual",
]);
const DOC_HEADING_LIMIT = 5;
const DOC_HEADING_MAX_CHARS = 120;

type DocHeadingInfo = {
  title?: string;
  headings: string[];
  aliases: string[];
};

const docHeadingCache = new Map<string, DocHeadingInfo>();
let docFileCache: string[] | null = null;
let conceptCardIndex: Map<string, HelixAskConceptCard> | null = null;
const DOC_FILE_EXT_RE = /\.(md|json|ya?ml|txt)$/i;
const DOC_FILE_ROOTS = ["docs/ethos", "docs/knowledge", "docs"];

const listDocFiles = (): string[] => {
  if (docFileCache) return docFileCache;
  const files: string[] = [];
  const seen = new Set<string>();
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const nextPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        walk(nextPath);
        continue;
      }
      if (!DOC_FILE_EXT_RE.test(entry.name)) continue;
      const normalized = path.relative(process.cwd(), nextPath).replace(/\\/g, "/");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      files.push(normalized);
    }
  };
  DOC_FILE_ROOTS.forEach((root) => walk(path.resolve(process.cwd(), root)));
  docFileCache = files;
  return files;
};

const normalizeAliasValue = (value: string): string => {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const deriveAliasFromFilename = (filePath: string): string => {
  const base = path.basename(filePath, path.extname(filePath));
  const trimmed = base.trim();
  if (!trimmed) return "";
  if (DOC_ALIAS_IGNORE.has(trimmed.toLowerCase())) return "";
  const spaced = trimmed.replace(/[_-]+/g, " ").trim();
  return spaced.length >= 3 ? spaced : "";
};

const readDocHeadingInfo = (filePath: string): DocHeadingInfo => {
  const normalized = filePath.replace(/\\/g, "/");
  const cacheKey = normalized.toLowerCase();
  const cached = docHeadingCache.get(cacheKey);
  if (cached) return cached;
  const index = readDocSectionIndex(normalized);
  const info: DocHeadingInfo = {
    title: index.title,
    headings: index.headings.slice(0, DOC_HEADING_LIMIT).map((heading) => heading.slice(0, DOC_HEADING_MAX_CHARS)),
    aliases: index.aliases.slice(0, SLOT_ALIAS_MAX),
  };
  docHeadingCache.set(cacheKey, info);
  return info;
};

const collectAliasesFromPaths = (paths: string[]): string[] => {
  const aliases = new Set<string>();
  for (const entry of paths) {
    if (!entry) continue;
    const baseAlias = deriveAliasFromFilename(entry);
    if (baseAlias) aliases.add(baseAlias);
    if (entry.replace(/\\/g, "/").toLowerCase().startsWith("docs/")) {
      const info = readDocHeadingInfo(entry);
      if (info.title) aliases.add(info.title);
      info.headings.forEach((heading) => heading && aliases.add(heading));
      info.aliases.forEach((alias) => alias && aliases.add(alias));
    }
  }
  return Array.from(aliases);
};

const isShortClarifyPrompt = (question: string): boolean => {
  const tokens = filterCriticTokens(tokenizeAskQuery(question));
  return tokens.length <= 5 || question.trim().length <= 80;
};

const buildMemorySeedSlots = (
  question: string,
  memory: HelixAskSessionMemory | null,
): HelixAskSlotPlanEntry[] => {
  if (!memory) return [];
  const normalizedQuestion = normalizeAliasValue(question).toLowerCase();
  const out: HelixAskSlotPlanEntry[] = [];
  const seen = new Set<string>();
  for (const slot of Object.values(memory.slots)) {
    const aliases = [slot.label, ...(slot.aliases ?? [])]
      .map((alias) => normalizeAliasValue(alias))
      .filter(Boolean);
    if (!aliases.length) continue;
    const matched = aliases.some((alias) => normalizedQuestion.includes(alias.toLowerCase()));
    if (!matched) continue;
    if (seen.has(slot.id)) continue;
    seen.add(slot.id);
    out.push({
      id: slot.id,
      label: slot.label,
      required: false,
      source: "memory",
      weak: false,
      aliases: aliases.slice(0, SLOT_ALIAS_MAX),
    });
  }
  for (const concept of Object.values(memory.resolvedConcepts ?? {})) {
    if (!concept || seen.has(concept.id)) continue;
    const evidenceAliases = collectAliasesFromPaths(concept.evidence ?? []);
    const aliases = [concept.label, concept.id, ...evidenceAliases]
      .map((alias) => normalizeAliasValue(alias))
      .filter(Boolean);
    if (!aliases.length) continue;
    const matched = aliases.some((alias) => normalizedQuestion.includes(alias.toLowerCase()));
    if (!matched) continue;
    seen.add(concept.id);
    out.push({
      id: concept.id,
      label: concept.label,
      required: false,
      source: "memory_resolved",
      weak: false,
      aliases: aliases.slice(0, SLOT_ALIAS_MAX),
    });
  }
  if (out.length === 0 && memory.lastClarifySlots.length > 0 && isShortClarifyPrompt(question)) {
    for (const slotId of memory.lastClarifySlots) {
      const slot = memory.slots[slotId];
      if (!slot || seen.has(slotId)) continue;
      seen.add(slotId);
      const aliases = [slot.label, ...(slot.aliases ?? [])]
        .map((alias) => normalizeAliasValue(alias))
        .filter(Boolean);
      out.push({
        id: slot.id,
        label: slot.label,
        required: true,
        source: "memory",
        weak: false,
        aliases: aliases.slice(0, SLOT_ALIAS_MAX),
      });
    }
  }
  return out;
};

const DOC_HEADING_SLOT_LIMIT = 6;
const DOC_HEADING_SLOT_MIN_SCORE = 2;

const buildDocHeadingSeedSlots = (question: string): HelixAskSlotPlanEntry[] => {
  const normalizedQuestion = normalizeAliasValue(question).toLowerCase();
  const questionTokens = filterCriticTokens(tokenizeAskQuery(question))
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 4 && !SLOT_IGNORE_TOKENS.has(token));
  if (questionTokens.length === 0) return [];
  const questionTokenSet = new Set(questionTokens);
  const candidates = new Map<
    string,
    { id: string; label: string; score: number; aliases: string[]; surfaces?: string[] }
  >();
  const files = listDocFiles().filter((entry) => entry.toLowerCase().startsWith("docs/"));
  for (const filePath of files) {
    const index = readDocSectionIndex(filePath);
    if (!index.headings.length) continue;
    for (const heading of index.headings) {
      const headingTokens = filterCriticTokens(tokenizeAskQuery(heading))
        .map((token) => token.toLowerCase())
        .filter((token) => token.length >= 4);
      if (headingTokens.length === 0) continue;
      const overlap = headingTokens.filter((token) => questionTokenSet.has(token));
      if (overlap.length === 0) continue;
      let score = overlap.length * 2;
      if (normalizedQuestion.includes(heading.toLowerCase())) score += 3;
      if (score < DOC_HEADING_SLOT_MIN_SCORE) continue;
      const id = normalizeSlotId(heading);
      if (!id) continue;
      const existing = candidates.get(id);
      const aliases = filterSlotHintTerms(
        [heading, ...(index.aliases ?? [])],
        { maxTokens: 6, maxChars: 72 },
      ).slice(0, SLOT_ALIAS_MAX);
      if (!existing || score > existing.score) {
        candidates.set(id, {
          id,
          label: heading,
          score,
          aliases,
          surfaces: deriveSlotSurfaces(filePath),
        });
      }
    }
  }
  return Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, DOC_HEADING_SLOT_LIMIT)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      required: false,
      source: "heading",
      weak: false,
      aliases: entry.aliases,
      surfaces: entry.surfaces,
    }));
};

const GRAPH_SLOT_LIMIT = 6;
const GRAPH_HINT_TERM_LIMIT = 16;

const collectGraphHintTerms = (pack: HelixAskGraphPack | null): string[] => {
  if (!pack) return [];
  const terms: string[] = [];
  const seenNodes = new Set<string>();
  const pushNodeTerms = (node: HelixAskGraphPack["frameworks"][number]["anchors"][number]): void => {
    if (node.title) terms.push(node.title);
    if (node.id) terms.push(node.id);
    for (const tag of node.tags ?? []) terms.push(tag);
  };
  for (const framework of pack.frameworks) {
    for (const node of framework.anchors) {
      pushNodeTerms(node);
      if (node.id) seenNodes.add(node.id);
    }
    for (const node of framework.path) {
      if (node.id && seenNodes.has(node.id)) continue;
      pushNodeTerms(node);
    }
  }
  const filtered = filterSlotHintTerms(terms, { maxTokens: 8, maxChars: 90 });
  return filtered.slice(0, GRAPH_HINT_TERM_LIMIT);
};

const buildGraphSeedSlots = (
  pack: HelixAskGraphPack | null,
): HelixAskSlotPlanEntry[] => {
  if (!pack) return [];
  const frameworks = pack.frameworks;
  if (frameworks.length === 0) return [];
  const out: HelixAskSlotPlanEntry[] = [];
  const seen = new Set<string>();
  const buildSlotEntry = (
    node: HelixAskGraphPack["frameworks"][number]["anchors"][number],
    framework: HelixAskGraphPack["frameworks"][number],
  ): HelixAskSlotPlanEntry | null => {
    const id = normalizeSlotId(node.id || node.title || "");
    if (!id) return null;
    const aliases = filterSlotHintTerms(
      [node.title ?? "", node.id, ...(node.tags ?? [])],
      { maxTokens: 6, maxChars: 72 },
    ).slice(0, SLOT_ALIAS_MAX);
    return {
      id,
      label: node.title || node.id,
      required: false,
      source: "graph",
      weak: false,
      aliases,
      surfaces: deriveSlotSurfaces(node.artifact ?? framework.sourcePath),
      evidenceCriteria: (node.tags ?? []).slice(0, 6),
    };
  };

  const nodeBuckets = frameworks.map((framework) => ({
    framework,
    nodes: [...framework.anchors, ...framework.path].slice().sort((a, b) => b.score - a.score),
  }));
  const perTreeQuota = Math.max(1, Math.floor(GRAPH_SLOT_LIMIT / nodeBuckets.length));

  for (const bucket of nodeBuckets) {
    let added = 0;
    for (const node of bucket.nodes) {
      if (out.length >= GRAPH_SLOT_LIMIT || added >= perTreeQuota) break;
      const slot = buildSlotEntry(node, bucket.framework);
      if (!slot || seen.has(slot.id)) continue;
      seen.add(slot.id);
      out.push(slot);
      added += 1;
    }
  }

  if (out.length < GRAPH_SLOT_LIMIT) {
    const ranked = nodeBuckets
      .flatMap((bucket, index) =>
        bucket.nodes.map((node) => ({
          node,
          framework: bucket.framework,
          score: node.score + (nodeBuckets.length - index) * 0.25,
        })),
      )
      .sort((a, b) => b.score - a.score);
    for (const entry of ranked) {
      if (out.length >= GRAPH_SLOT_LIMIT) break;
      const slot = buildSlotEntry(entry.node, entry.framework);
      if (!slot || seen.has(slot.id)) continue;
      seen.add(slot.id);
      out.push(slot);
    }
  }

  return out;
};

const getConceptCardIndex = (): Map<string, HelixAskConceptCard> => {
  if (conceptCardIndex) return conceptCardIndex;
  const index = new Map<string, HelixAskConceptCard>();
  for (const card of listConceptCards()) {
    const idKey = normalizeSlotId(card.id);
    if (idKey) index.set(idKey, card);
    if (card.label) {
      const labelKey = normalizeSlotId(card.label);
      if (labelKey && !index.has(labelKey)) index.set(labelKey, card);
    }
    for (const alias of card.aliases ?? []) {
      const aliasKey = normalizeSlotId(alias);
      if (aliasKey && !index.has(aliasKey)) index.set(aliasKey, card);
    }
  }
  conceptCardIndex = index;
  return index;
};

const resolveConceptCardForSlot = (slotId: string): HelixAskConceptCard | null => {
  const key = normalizeSlotId(slotId);
  if (!key) return null;
  return getConceptCardIndex().get(key) ?? null;
};

const deriveSlotSurfaces = (sourcePath?: string, mustInclude?: string[]): string[] => {
  const surfaces = new Set<string>();
  const pushFromPath = (entry: string) => {
    const normalized = entry.replace(/\\/g, "/").toLowerCase();
    if (normalized.startsWith("docs/ethos/")) {
      surfaces.add("ethos");
      surfaces.add("docs");
    } else if (normalized.startsWith("docs/knowledge/")) {
      surfaces.add("knowledge");
      surfaces.add("docs");
    } else if (normalized.startsWith("docs/")) {
      surfaces.add("docs");
    } else if (/^(server|client|shared|modules|apps|tools|scripts|cli|packages)\//.test(normalized)) {
      surfaces.add("code");
    }
  };
  if (sourcePath) pushFromPath(sourcePath);
  mustInclude?.forEach((entry) => entry && pushFromPath(entry));
  return Array.from(surfaces);
};

const buildCanonicalSlotPlan = (args: {
  question: string;
  directives?: HelixAskPlanDirectives | null;
  candidates?: HelixAskConceptCandidate[];
  seedSlots?: HelixAskSlotPlanEntry[];
  maxTokens?: number;
}): HelixAskSlotPlan => {
  const slotOrder: string[] = [];
  const slotMap = new Map<string, HelixAskSlotPlanEntry>();
  const directives = args.directives;
  const directiveEvidence = directives?.evidenceCriteria ?? {};
  const maxTokens = args.maxTokens ?? 6;
  const sourcePriority: Record<HelixAskSlotPlanEntry["source"], number> = {
    concept: 4,
    plan_pass: 3,
    memory: 3,
    memory_resolved: 3,
    plan: 2,
    heading: 2,
    graph: 2,
    token: 1,
  };
  const mergeSlot = (
    existing: HelixAskSlotPlanEntry,
    incoming: HelixAskSlotPlanEntry,
  ): HelixAskSlotPlanEntry => {
    const mergedAliases = new Set<string>([
      ...(existing.aliases ?? []),
      ...(incoming.aliases ?? []),
    ]);
    const mergedSurfaces = new Set<string>([
      ...(existing.surfaces ?? []),
      ...(incoming.surfaces ?? []),
    ]);
    const mergedEvidence = new Set<string>([
      ...(existing.evidenceCriteria ?? []),
      ...(incoming.evidenceCriteria ?? []),
      ...(directiveEvidence[existing.id] ?? []),
    ]);
    const mergedWeak = Boolean(existing.weak) && Boolean(incoming.weak);
    const existingPriority = sourcePriority[existing.source];
    const incomingPriority = sourcePriority[incoming.source];
    const label =
      existing.label === existing.id && incoming.label !== incoming.id
        ? incoming.label
        : incomingPriority > existingPriority && incoming.label
          ? incoming.label
          : existing.label;
    return {
      ...existing,
      ...incoming,
      label,
      source: incomingPriority > existingPriority ? incoming.source : existing.source,
      required: existing.required || incoming.required,
      weak: mergedWeak,
      surfaces: Array.from(mergedSurfaces),
      aliases: Array.from(mergedAliases).slice(0, SLOT_ALIAS_MAX),
      evidenceCriteria: Array.from(mergedEvidence).slice(0, 8),
    };
  };
  const addSlot = (entry: HelixAskSlotPlanEntry) => {
    const id = normalizeSlotId(entry.id);
    if (!id) return;
    const incoming: HelixAskSlotPlanEntry = {
      ...entry,
      id,
      evidenceCriteria: [
        ...(entry.evidenceCriteria ?? []),
        ...(directiveEvidence[id] ?? []),
      ].filter(Boolean),
      aliases: entry.aliases ?? [],
    };
    const existing = slotMap.get(id);
    if (!existing) {
      slotOrder.push(id);
      slotMap.set(id, incoming);
      return;
    }
    slotMap.set(id, mergeSlot(existing, incoming));
  };
  const candidates = args.candidates ?? listConceptCandidates(args.question, 4);
  for (const candidate of candidates) {
    const card = candidate.card;
    const aliasSources = [card.sourcePath, ...(card.mustIncludeFiles ?? [])].filter(Boolean);
    const derivedAliases = collectAliasesFromPaths(aliasSources);
    const aliases = Array.from(new Set([...(card.aliases ?? []), ...derivedAliases]));
    addSlot({
      id: card.id,
      label: card.label ?? card.id,
      required: true,
      source: "concept",
      weak: false,
      aliases,
      surfaces: deriveSlotSurfaces(card.sourcePath, card.mustIncludeFiles),
    });
  }
  const seedSlots = args.seedSlots ?? [];
  for (const slot of seedSlots) {
    addSlot(slot);
  }
  const planSlots = [
    ...(directives?.conceptSlots ?? []),
    ...(directives?.requiredSlots ?? []).filter((slot) => !STRUCTURAL_SLOTS.has(normalizeSlotName(slot))),
  ];
    for (const slot of planSlots) {
      const conceptCard = resolveConceptCardForSlot(slot);
      const aliasSources = conceptCard
        ? [conceptCard.sourcePath, ...(conceptCard.mustIncludeFiles ?? [])].filter(Boolean)
        : [];
      const derivedAliases = collectAliasesFromPaths(aliasSources);
      const aliases = Array.from(
        new Set([...(conceptCard?.aliases ?? []), ...derivedAliases]),
      );
      addSlot({
        id: slot,
        label: conceptCard?.label ?? slot,
        // Plan directives are advisory; do not promote them to required coverage slots.
        required: false,
        source: conceptCard ? "concept" : "plan",
        weak: false,
        aliases,
        surfaces: conceptCard
          ? deriveSlotSurfaces(conceptCard.sourcePath, conceptCard.mustIncludeFiles)
        : undefined,
    });
  }
  if (args.question.trim()) {
    const conceptTokens = new Set<string>();
    for (const candidate of candidates) {
      [candidate.card.id, candidate.card.label ?? "", ...(candidate.card.aliases ?? [])]
        .filter(Boolean)
        .flatMap((value) => tokenizeAskQuery(value))
        .flatMap((token) => filterCriticTokens([token]))
        .forEach((token) => conceptTokens.add(token.toLowerCase()));
    }
    for (const slot of planSlots) {
      tokenizeAskQuery(slot)
        .flatMap((token) => filterCriticTokens([token]))
        .forEach((token) => conceptTokens.add(token.toLowerCase()));
    }
    const tokens = filterCriticTokens(tokenizeAskQuery(args.question));
    for (const token of tokens) {
      const cleaned = token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
      if (!cleaned) continue;
      if (cleaned.length < 4) continue;
      if (SLOT_IGNORE_TOKENS.has(cleaned)) continue;
      if (conceptTokens.has(cleaned)) continue;
      if (/^\d+$/.test(cleaned)) continue;
      addSlot({
        id: cleaned,
        label: cleaned,
        required: false,
        source: "token",
        weak: true,
      });
      if (slotOrder.length >= maxTokens) break;
    }
  }
  const slots = slotOrder.map((id) => slotMap.get(id)).filter(Boolean) as HelixAskSlotPlanEntry[];
    const requiredSlots = slots.filter(isHardRequiredSlot);
    return { slots, coverageSlots: requiredSlots.map((slot) => slot.id) };
  };

const restrictSlotPlanToCoverage = (
  slotPlan: HelixAskSlotPlan | null,
  coverageSlots: string[],
): HelixAskSlotPlan | null => {
  if (!slotPlan || coverageSlots.length === 0) return slotPlan;
  const allowed = new Set(coverageSlots.map((slot) => normalizeSlotId(slot)).filter(Boolean));
  if (allowed.size === 0) return slotPlan;
  const scopedSlots = slotPlan.slots
    .filter((slot) => allowed.has(slot.id))
    .map((slot) => ({ ...slot, required: true }));
  if (scopedSlots.length === 0) return slotPlan;
  return { slots: scopedSlots, coverageSlots: scopedSlots.map((slot) => slot.id) };
};

const collectSlotAliasHints = (slotPlan: HelixAskSlotPlan | null): string[] => {
  if (!slotPlan) return [];
  const hints = new Set<string>();
  const strongSlots = slotPlan.slots.filter((slot) => !isWeakSlot(slot));
  const hintSlots = strongSlots.length > 0 ? strongSlots : slotPlan.slots;
  for (const slot of hintSlots) {
    if (slot.label) hints.add(normalizeAliasValue(slot.label));
    if (slot.id) hints.add(slot.id.replace(/-/g, " "));
    (slot.aliases ?? []).forEach((alias) => {
      const cleaned = normalizeAliasValue(alias);
      if (cleaned) hints.add(cleaned);
    });
  }
  const filtered = filterSlotHintTerms(Array.from(hints));
  return filtered.slice(0, 16);
};

const collectSlotEvidenceHints = (slotPlan: HelixAskSlotPlan | null): string[] => {
  if (!slotPlan) return [];
  const hints = new Set<string>();
  const strongSlots = slotPlan.slots.filter((slot) => !isWeakSlot(slot));
  const hintSlots = strongSlots.length > 0 ? strongSlots : slotPlan.slots;
  for (const slot of hintSlots) {
    (slot.evidenceCriteria ?? []).forEach((entry) => entry && hints.add(entry));
  }
  const filtered = filterSlotHintTerms(Array.from(hints), { maxTokens: 6, maxChars: 72 });
  return filtered.slice(0, 12);
};

const buildRetryHintsForSlots = (
  slotPlan: HelixAskSlotPlan | null,
  slotIds: string[],
): string[] => {
  if (!slotPlan || slotIds.length === 0) return [];
  const slotMap = new Map(slotPlan.slots.map((slot) => [slot.id, slot]));
  const hints = new Set<string>();
  for (const slotId of slotIds) {
    const normalized = normalizeSlotId(slotId);
    const slot = slotMap.get(normalized) ?? slotMap.get(slotId);
    if (!slot) {
      const cleaned = normalizeAliasValue(slotId);
      if (cleaned) hints.add(cleaned);
      continue;
    }
    if (isWeakSlot(slot)) continue;
    buildSlotQueryTerms(slot).forEach((term) => term && hints.add(term));
  }
  return Array.from(hints).filter(Boolean).slice(0, 16);
};

const buildSlotAliasMap = (slotPlan: HelixAskSlotPlan | null): Record<string, string[]> => {
  if (!slotPlan) return {};
  const map: Record<string, string[]> = {};
  const strongSlots = slotPlan.slots.filter((slot) => !isWeakSlot(slot));
  const aliasSlots = strongSlots.length > 0 ? strongSlots : slotPlan.slots;
  for (const slot of aliasSlots) {
    const aliases = new Set<string>();
    if (slot.label) aliases.add(slot.label);
    (slot.aliases ?? []).forEach((alias) => alias && aliases.add(alias));
    const values = filterSlotHintTerms(Array.from(aliases)).slice(0, SLOT_ALIAS_MAX);
    if (values.length > 0) {
      map[slot.id] = values;
    }
  }
  return map;
};

const collectCoverageSlotAliases = (
  slotAliasMap: Record<string, string[]> | null,
  coverageSlots: string[],
): string[] => {
  if (coverageSlots.length === 0) return [];
  const aliases = new Set<string>();
  for (const slot of coverageSlots) {
    const values = slotAliasMap ? slotAliasMap[slot] ?? [] : [];
    for (const value of values) {
      const cleaned = normalizeAliasValue(value);
      if (cleaned) aliases.add(cleaned);
    }
    const spaced = slot.replace(/[-_]+/g, " ").trim();
    if (spaced) aliases.add(spaced);
  }
  const filtered = filterSlotHintTerms(Array.from(aliases), { maxTokens: 6, maxChars: 72 });
  return filtered.slice(0, 12);
};

const mergeEvidenceSignalTokens = (...groups: string[][]): string[] =>
  Array.from(
    new Set(
      groups
        .flat()
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );

const buildEvidenceEligibilityTokens = (
  question: string,
  signalTokens: string[],
  useQuestionTokens: boolean,
): string[] => {
  const baseTokens = useQuestionTokens ? filterCriticTokens(tokenizeAskQuery(question)) : [];
  const extraTokens = signalTokens
    .flatMap((token) => tokenizeAskQuery(token))
    .flatMap((token) => filterCriticTokens([token]));
  return Array.from(new Set([...baseTokens, ...extraTokens])).filter(Boolean);
};

const matchEvidenceTokens = (tokens: string[], contextText: string): string[] => {
  if (!tokens.length || !contextText) return [];
  const lower = contextText.toLowerCase();
  return tokens.filter((token) => lower.includes(token.toLowerCase()));
};

const buildAliasVariants = (value: string): string[] => {
  const cleaned = normalizeAliasValue(value).toLowerCase();
  if (!cleaned) return [];
  const variants = new Set<string>();
  variants.add(cleaned);
  const spaced = cleaned.replace(/[_-]+/g, " ").trim();
  if (spaced) variants.add(spaced);
  const hyphenated = spaced.replace(/\s+/g, "-");
  if (hyphenated) variants.add(hyphenated);
  const underscored = spaced.replace(/\s+/g, "_");
  if (underscored) variants.add(underscored);
  if (spaced.endsWith("s")) {
    variants.add(spaced.slice(0, -1));
  } else if (spaced.length >= 3) {
    variants.add(`${spaced}s`);
  }
  return Array.from(variants);
};

const buildSlotAliasVariants = (slot: HelixAskSlotPlanEntry): string[] => {
  const variants = new Set<string>();
  if (slot.label) {
    buildAliasVariants(slot.label).forEach((variant) => variants.add(variant));
  }
  (slot.aliases ?? []).forEach((alias) => {
    buildAliasVariants(alias).forEach((variant) => variants.add(variant));
  });
  return Array.from(variants).filter((entry) => entry.length >= 3);
};

const buildSlotVariants = (slot: HelixAskSlotPlanEntry): string[] => {
  const variants = new Set<string>();
  buildAliasVariants(slot.id).forEach((variant) => variants.add(variant));
  buildSlotAliasVariants(slot).forEach((variant) => variants.add(variant));
  return Array.from(variants).filter((entry) => entry.length >= 3);
};

const SLOT_HINT_MAX_CHARS = 80;
const SLOT_HINT_MAX_TOKENS = 8;
const SLOT_HINT_PREFIX_RE = /^(overview|definition|purpose|notes?)\b/i;
const SLOT_HINT_COLON_RE = /:/;

const isPathLikeHint = (value: string): boolean => {
  if (!value) return false;
  if (/[\\/]/.test(value)) return true;
  return /\.[a-z0-9]{1,4}\b/i.test(value);
};

const filterSlotHintTerms = (
  terms: string[],
  options?: { maxTokens?: number; maxChars?: number },
): string[] => {
  if (terms.length === 0) return [];
  const maxTokens = options?.maxTokens ?? SLOT_HINT_MAX_TOKENS;
  const maxChars = options?.maxChars ?? SLOT_HINT_MAX_CHARS;
  const out = new Set<string>();
  for (const term of terms) {
    const cleaned = normalizeAliasValue(term);
    if (!cleaned) continue;
    if (isPathLikeHint(cleaned)) {
      if (cleaned.length <= Math.max(120, maxChars)) {
        out.add(cleaned);
      }
      continue;
    }
    if (cleaned.length > maxChars) continue;
    if (SLOT_HINT_PREFIX_RE.test(cleaned)) continue;
    const tokens = filterCriticTokens(tokenizeAskQuery(cleaned));
    if (tokens.length === 0 || tokens.length > maxTokens) continue;
    if (SLOT_HINT_COLON_RE.test(cleaned) && tokens.length > 3) continue;
    out.add(cleaned);
  }
  return Array.from(out);
};

const buildSlotQueryTerms = (slot: HelixAskSlotPlanEntry): string[] => {
  const terms = new Set<string>();
  if (slot.label) terms.add(slot.label);
  if (slot.id) terms.add(slot.id.replace(/-/g, " "));
  (slot.aliases ?? []).forEach((alias) => alias && terms.add(alias));
  (slot.evidenceCriteria ?? []).forEach((entry) => entry && terms.add(entry));
  buildSlotVariants(slot).forEach((variant) => terms.add(variant));
  const filtered = filterSlotHintTerms(Array.from(terms));
  return filtered.slice(0, 12);
};

const hasDocSurface = (slot: HelixAskSlotPlanEntry): boolean =>
  Boolean(slot.surfaces?.some((surface) => DOC_SURFACES.has(surface)));

  const resolveDocRequiredSlots = (slotPlan: HelixAskSlotPlan | null): string[] => {
    if (!slotPlan) return [];
    return slotPlan.slots
      .filter((slot) => slot.required && hasDocSurface(slot) && isHardRequiredSlot(slot))
      .map((slot) => slot.id);
  };

  const resolveRequiredSlots = (slotPlan: HelixAskSlotPlan | null): string[] => {
    if (!slotPlan) return [];
    return slotPlan.slots.filter(isHardRequiredSlot).map((slot) => slot.id);
  };

const countSlotDocHits = (
  slot: HelixAskSlotPlanEntry,
  docBlocks: Array<{ path: string; block: string }>,
): number => {
  if (!docBlocks.length) return 0;
  const variants = buildSlotVariants(slot);
  if (!variants.length) return 0;
  let count = 0;
  for (const block of docBlocks) {
    const lines = block.block.split(/\r?\n/);
    const text = lines.slice(1).join(" ").toLowerCase();
    if (variants.some((variant) => text.includes(variant))) {
      count += 1;
    }
  }
  return count;
};

const countSlotAliasHits = (
  slot: HelixAskSlotPlanEntry,
  docBlocks: Array<{ path: string; block: string }>,
): number => {
  if (!docBlocks.length) return 0;
  const variants = buildSlotAliasVariants(slot);
  if (!variants.length) return 0;
  let count = 0;
  for (const block of docBlocks) {
    const lines = block.block.split(/\r?\n/);
    const text = lines.slice(1).join(" ").toLowerCase();
    if (variants.some((variant) => text.includes(variant))) {
      count += 1;
    }
  }
  return count;
};

const evaluateDocSlotCoverage = (
  slotPlan: HelixAskSlotPlan | null,
  docBlocks: Array<{ path: string; block: string }>,
  slotIds: string[],
): { slots: string[]; coveredSlots: string[]; missingSlots: string[]; ratio: number } => {
  if (!slotPlan || slotIds.length === 0) {
    return { slots: [], coveredSlots: [], missingSlots: [], ratio: 1 };
  }
  const slotMap = new Map(slotPlan.slots.map((slot) => [slot.id, slot]));
  const coveredSlots: string[] = [];
  const missingSlots: string[] = [];
  for (const slotId of slotIds) {
    const slot = slotMap.get(slotId);
    if (!slot) {
      missingSlots.push(slotId);
      continue;
    }
    const hits = countSlotDocHits(slot, docBlocks);
    if (hits > 0) {
      coveredSlots.push(slotId);
    } else {
      missingSlots.push(slotId);
    }
  }
  const ratio = slotIds.length ? coveredSlots.length / slotIds.length : 1;
  return { slots: slotIds, coveredSlots, missingSlots, ratio };
};

const buildSlotEvidenceSnapshot = (
  slotPlan: HelixAskSlotPlan | null,
  docBlocks: Array<{ path: string; block: string }>,
  coverage?: { coveredSlots: string[]; missingSlots: string[] } | null,
  options?: { evidenceGateOk?: boolean },
): Array<{
  id: string;
  label: string;
  doc_card_count: number;
  alias_card_count: number;
  evidence_gate_ok?: boolean;
  coverage_ratio: number;
  missing_slots: string[];
}> => {
  if (!slotPlan || slotPlan.slots.length === 0) return [];
  const coverageSet = new Set(coverage?.coveredSlots ?? []);
  return slotPlan.slots.map((slot) => {
    const covered = coverageSet.has(slot.id);
    return {
      id: slot.id,
      label: slot.label,
      doc_card_count: countSlotDocHits(slot, docBlocks),
      alias_card_count: countSlotAliasHits(slot, docBlocks),
      evidence_gate_ok: options?.evidenceGateOk,
      coverage_ratio: covered ? 1 : 0,
      missing_slots: covered ? [] : [slot.id],
    };
  });
};

const computeSlotEvidenceRates = (
  slotPlan: HelixAskSlotPlan | null,
  slotEvidence: Array<{
    id: string;
    doc_card_count: number;
    alias_card_count: number;
  }>,
): { docHitRate: number; aliasHitRate: number } => {
  if (!slotPlan || slotEvidence.length === 0) return { docHitRate: 0, aliasHitRate: 0 };
  const requiredIds = new Set(slotPlan.slots.filter((slot) => slot.required).map((slot) => slot.id));
  const relevant = requiredIds.size
    ? slotEvidence.filter((entry) => requiredIds.has(entry.id))
    : slotEvidence;
  const total = relevant.length || slotEvidence.length;
  const docHits = relevant.filter((entry) => entry.doc_card_count > 0).length;
  const aliasHits = relevant.filter((entry) => entry.alias_card_count > 0).length;
  return {
    docHitRate: total > 0 ? docHits / total : 1,
    aliasHitRate: total > 0 ? aliasHits / total : 1,
  };
};

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
  const tokenList = Array.from(tokens)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
  const phraseList = phrases.map((phrase) => phrase.toLowerCase());
  const maxFiles = options?.limit ?? 200;
  const files = listDocFiles()
    .filter((entry) => {
      if (allowlist.length > 0 && !pathMatchesAny(entry, allowlist)) return false;
      if (avoidlist.length > 0 && pathMatchesAny(entry, avoidlist)) return false;
      return true;
    })
    .slice(0, maxFiles);
  const candidates: AskCandidate[] = [];
  for (const filePath of files) {
    const index = readDocSectionIndex(filePath);
    if (index.sections.length === 0) continue;
    const match = selectDocSectionMatch(index, tokenList, phraseList);
    if (!match.section || match.score <= 0) continue;
    const headerLines = buildDocHeaderLines(filePath);
    const snippet = match.snippet ?? "";
    const boosted = applyAskNodeBoosts(match.score + 8, filePath, question, null);
    candidates.push({
      filePath,
      preview: formatAskPreview({
        doc: headerLines.join("\n"),
        snippet,
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

async function collectSlotDocCandidates(args: {
  slotPlan: HelixAskSlotPlan | null;
  slotIds: string[];
  question: string;
  allowlist?: RegExp[];
  avoidlist?: RegExp[];
  topicProfile?: HelixAskTopicProfile | null;
  limitPerSlot?: number;
}): Promise<AskCandidate[]> {
  if (!args.slotPlan || args.slotIds.length === 0) return [];
  const snapshot = await loadCodeLattice();
  if (!snapshot) return [];
  const allowlist = args.allowlist ?? [];
  const avoidlist = args.avoidlist ?? [];
  const limitPerSlot = Math.max(1, args.limitPerSlot ?? 1);
  const slotMap = new Map(args.slotPlan.slots.map((slot) => [slot.id, slot]));
  const slotIds = Array.from(new Set(args.slotIds)).filter(Boolean);
  const out: AskCandidate[] = [];
  const candidatePool = Math.max(12, limitPerSlot * 8);
  for (const slotId of slotIds) {
    const slotEntry = slotMap.get(slotId);
    if (!slotEntry) continue;
    const slotQueries = mergeHelixAskQueries(
      [slotEntry.label ?? slotEntry.id],
      buildSlotQueryTerms(slotEntry),
      HELIX_ASK_QUERY_MERGE_MAX,
    );
    if (!slotQueries.length) continue;
    const candidateLists: AskCandidateChannelList[] = [];
    const channelTopScores = initAskChannelStats();
    for (const query of slotQueries) {
      const multi = collectAskCandidatesMultiChannel(snapshot, query, args.question, {
        topicProfile: args.topicProfile,
        allowlist,
        avoidlist,
      });
      for (const entry of multi.lists) {
        const candidates = entry.candidates.slice(0, candidatePool);
        if (!candidates.length) continue;
        candidateLists.push({ channel: entry.channel, candidates });
        channelTopScores[entry.channel] = Math.max(
          channelTopScores[entry.channel],
          candidates[0].score,
        );
      }
    }
    if (!candidateLists.length) continue;
    const channelWeights = scaleAskChannelWeights(
      HELIX_ASK_RRF_CHANNEL_WEIGHTS,
      channelTopScores,
    );
    const merged = mergeCandidatesWithWeightedRrf(
      candidateLists,
      HELIX_ASK_RRF_K,
      channelWeights,
    );
    const docsOnly = merged.filter((candidate) => /(^|\/)docs\//i.test(candidate.filePath));
    if (docsOnly.length === 0) continue;
    const selected = selectCandidatesWithMmr(docsOnly, limitPerSlot, HELIX_ASK_MMR_LAMBDA);
    if (selected.length > 0) {
      out.push(...selected);
    }
  }
  return out;
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

function scaleAskChannelWeights(
  base: AskCandidateChannelStats,
  topScores: AskCandidateChannelStats,
): AskCandidateChannelStats {
  const scores = HELIX_ASK_CHANNELS.map((channel) => topScores[channel] ?? 0);
  const maxScore = Math.max(...scores);
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return { ...base };
  }
  const scaled: AskCandidateChannelStats = { ...base };
  for (const channel of HELIX_ASK_CHANNELS) {
    const ratio = Math.max(0, Math.min(1, (topScores[channel] ?? 0) / maxScore));
    const factor = 0.5 + 0.5 * ratio;
    scaled[channel] = base[channel] * factor;
  }
  return scaled;
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
  channelWeights?: AskCandidateChannelStats;
  docHeaderInjected?: number;
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
  let channelWeights = initAskChannelStats();

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
    const channelWeightsForTier = scaleAskChannelWeights(
      HELIX_ASK_RRF_CHANNEL_WEIGHTS,
      channelTopScores,
    );
    const merged = mergeCandidatesWithWeightedRrf(candidateLists, HELIX_ASK_RRF_K, channelWeightsForTier);
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
    channelWeights = channelWeightsForTier;
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
    channelWeights,
  });
}

function buildAskContextFromCandidates(args: {
  selected: AskCandidate[];
  topicTier?: number;
  topicMustIncludeOk?: boolean;
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  channelHits?: AskCandidateChannelStats;
  channelTopScores?: AskCandidateChannelStats;
  channelWeights?: AskCandidateChannelStats;
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
  channelWeights?: AskCandidateChannelStats;
  docHeaderInjected?: number;
} {
  return finalizeAskContext(args);
}

const DOC_HEADER_PREVIEW_RE = /^(Title|Heading|Subheading|Doc):/im;

const buildDocHeaderLines = (filePath: string): string[] => {
  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.toLowerCase().startsWith("docs/")) return [];
  const info = readDocHeadingInfo(filePath);
  const lines: string[] = [];
  if (info.title) {
    lines.push(`Title: ${info.title}`);
  } else {
    const baseAlias = deriveAliasFromFilename(filePath);
    if (baseAlias) lines.push(`Doc: ${baseAlias}`);
  }
  if (info.headings.length > 0) {
    info.headings.forEach((heading, index) => {
      const label = index === 0 ? "Heading" : "Subheading";
      lines.push(`${label}: ${heading}`);
    });
  }
  return lines;
};

const injectDocHeaderPreview = (
  filePath: string,
  preview: string,
): { preview: string; injected: boolean } => {
  if (!preview.trim()) return { preview, injected: false };
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (!normalized.startsWith("docs/")) return { preview, injected: false };
  if (DOC_HEADER_PREVIEW_RE.test(preview)) return { preview, injected: false };
  const headerLines = buildDocHeaderLines(filePath);
  if (headerLines.length === 0) return { preview, injected: false };
  return { preview: `${headerLines.join("\n")}\n${preview}`, injected: true };
};

function splitAskContextBlocks(context: string): Array<{ path: string; block: string }> {
  if (!context.trim()) return [];
  return context
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [firstLine] = block.split(/\r?\n/);
      return { path: (firstLine ?? "").trim(), block };
    })
    .filter((entry) => entry.path.length > 0);
}

const isIndexOnlyPath = (filePath: string): boolean =>
  HELIX_ASK_INDEX_ONLY_PATHS.some((re) => re.test(filePath));

const isDefinitionDocPath = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return normalized.startsWith("docs/") && normalized.endsWith(".md");
};

const isDefinitionQuestion = (question: string): boolean =>
  HELIX_ASK_DEFINITION_FOCUS.test(question);

  const collectDefinitionRegistryPaths = (
    question: string,
    conceptMatch: HelixAskConceptMatch | null,
    definitionFocus: boolean,
    graphPack?: HelixAskGraphPack | null,
  ): string[] => {
    if (!definitionFocus) return [];
    const paths = new Set<string>();
    const addPath = (value?: string) => {
      if (!value) return;
    const normalized = value.replace(/\\/g, "/").trim();
    if (!normalized) return;
    if (!isDefinitionDocPath(normalized)) return;
    paths.add(normalized);
  };
  if (conceptMatch) {
    addPath(conceptMatch.card.sourcePath);
    (conceptMatch.card.mustIncludeFiles ?? []).forEach((filePath) => addPath(filePath));
    } else {
      const candidates = listConceptCandidates(question, HELIX_ASK_DEFINITION_REGISTRY_TOPK);
      candidates.forEach((candidate) => {
        addPath(candidate.card.sourcePath);
        (candidate.card.mustIncludeFiles ?? []).forEach((filePath) => addPath(filePath));
      });
    }
      const treeDocPaths = findDefinitionTreeDocPaths(question);
      treeDocPaths.forEach((treePath) => addPath(treePath));
      const packTreeDocs = findDefinitionTreeDocPathsForPack(graphPack);
      packTreeDocs.forEach((treePath) => addPath(treePath));
      return Array.from(paths);
    };

const buildDefinitionMatchTerms = (
  question: string,
  conceptMatch: HelixAskConceptMatch | null,
): { tokens: string[]; phrases: string[] } => {
  const phrases: string[] = [];
  const tokens = new Set<string>();
  if (conceptMatch?.card) {
    const terms = [
      conceptMatch.card.id,
      conceptMatch.card.label ?? "",
      ...(conceptMatch.card.aliases ?? []),
    ].filter(Boolean);
    terms.forEach((term) => {
      if (term.includes(" ")) phrases.push(term.toLowerCase());
      term
        .split(/\s+/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .forEach((chunk) => tokens.add(chunk.toLowerCase()));
    });
  }
  if (tokens.size === 0) {
    tokenizeAskQuery(question).forEach((token) => tokens.add(token.toLowerCase()));
  }
  return { tokens: Array.from(tokens), phrases };
};

const buildDocSectionSnippet = (section: DocSection): string => {
  const headerPath = section.headerPath.join(" > ") || section.heading || "Overview";
  const lines = section.bodyLines.filter((line) => line.trim().length > 0);
  const snippetLines = lines.slice(0, 4).map((line) => line.trimEnd());
  const spanStart = section.bodyStartLine;
  const spanEnd = section.bodyStartLine + Math.max(0, snippetLines.length - 1);
  return [`Section: ${headerPath}`, `Span: L${spanStart}-L${spanEnd}`, ...snippetLines]
    .filter(Boolean)
    .join("\n");
};

const buildDefinitionRegistryBlocks = (
  definitionPaths: string[],
  question: string,
  conceptMatch: HelixAskConceptMatch | null,
  existingBlocks: Array<{ path: string; block: string }>,
): Array<{ path: string; block: string }> => {
  if (definitionPaths.length === 0) return [];
  const existing = new Set(existingBlocks.map((block) => block.path.replace(/\\/g, "/").toLowerCase()));
  const { tokens, phrases } = buildDefinitionMatchTerms(question, conceptMatch);
  const blocks: Array<{ path: string; block: string }> = [];
  for (const definitionPath of definitionPaths) {
    const normalized = definitionPath.replace(/\\/g, "/");
    if (existing.has(normalized.toLowerCase())) continue;
    const index = readDocSectionIndex(normalized);
    if (!index.sections.length) continue;
    const match = selectDocSectionMatch(index, tokens, phrases);
    const snippet = match.snippet ?? buildDocSectionSnippet(index.sections[0]);
    const block = `${normalized}\n${snippet}`;
    blocks.push({ path: normalized, block });
  }
  return blocks;
};

const mergeDefinitionRegistryBlocks = (
  baseBlocks: Array<{ path: string; block: string }>,
  registryBlocks: Array<{ path: string; block: string }>,
): Array<{ path: string; block: string }> => {
  if (!registryBlocks.length) return baseBlocks;
  const existing = new Set(
    baseBlocks.map((block) => block.path.replace(/\\/g, "/").toLowerCase()),
  );
  const mergedBlocks = [...baseBlocks];
  registryBlocks.forEach((block) => {
    const key = block.path.replace(/\\/g, "/").toLowerCase();
    if (!existing.has(key)) {
      mergedBlocks.push(block);
      existing.add(key);
    }
  });
  return mergedBlocks;
};

const normalizeGraphEvidenceKey = (entry: HelixAskGraphEvidence): string => {
  const parts = [
    entry.type,
    entry.path ?? "",
    entry.symbol ?? "",
    entry.heading ?? "",
    entry.field ?? "",
    entry.contains ?? "",
    entry.note ?? "",
  ]
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);
  return parts.join("|");
};

const normalizeGraphNodeType = (value?: string): string => (value ?? "").trim().toLowerCase();

const DERIVED_NODE_TYPES = new Set(["derived", "computed", "pipeline", "metric"]);

const evaluateGraphNodeAcceptance = (node: {
  nodeType?: string;
  evidence?: HelixAskGraphEvidence[];
  assumptions?: string[];
  validity?: Record<string, unknown>;
}): { ok: boolean; missing: string[] } => {
  const nodeType = normalizeGraphNodeType(node.nodeType);
  if (!DERIVED_NODE_TYPES.has(nodeType)) return { ok: true, missing: [] };
  const evidenceTypes = new Set((node.evidence ?? []).map((entry) => entry.type));
  const missing: string[] = [];
  if (!evidenceTypes.has("doc")) missing.push("doc");
  if (!evidenceTypes.has("code")) missing.push("code");
  if (!evidenceTypes.has("telemetry") && !evidenceTypes.has("test")) {
    missing.push("telemetry_or_test");
  }
  if (!node.assumptions || node.assumptions.length === 0) missing.push("assumptions");
  if (!node.validity || Object.keys(node.validity).length === 0) missing.push("validity");
  return { ok: missing.length === 0, missing };
};

const collectGraphEvidenceItems = (
  graphPack: HelixAskGraphPack | null,
): { items: HelixAskGraphEvidence[]; acceptance: { total: number; accepted: number; rejected: number; missing: string[] } } => {
  const summary = { total: 0, accepted: 0, rejected: 0, missing: [] as string[] };
  if (!graphPack?.frameworks?.length) return { items: [], acceptance: summary };
  const collected: HelixAskGraphEvidence[] = [];
  const seen = new Set<string>();
  const missingSet = new Set<string>();
  for (const framework of graphPack.frameworks) {
    const nodes = [...(framework.path ?? []), ...(framework.anchors ?? [])];
    for (const node of nodes) {
      summary.total += 1;
      const acceptance = evaluateGraphNodeAcceptance(node);
      if (!acceptance.ok) {
        summary.rejected += 1;
        acceptance.missing.forEach((entry) => missingSet.add(entry));
        continue;
      }
      summary.accepted += 1;
      if (!node.evidence?.length) continue;
      for (const entry of node.evidence) {
        const key = normalizeGraphEvidenceKey(entry);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        collected.push(entry);
      }
    }
  }
  summary.missing = Array.from(missingSet);
  return { items: collected, acceptance: summary };
};

const buildGraphEvidenceMatchTerms = (
  entry: HelixAskGraphEvidence,
  fallback: { tokens: string[]; phrases: string[] },
): { tokens: string[]; phrases: string[] } => {
  const seed = (entry.contains ?? entry.heading ?? entry.symbol ?? entry.field ?? "").trim();
  if (!seed) return fallback;
  const tokens = new Set<string>();
  filterSignalTokens(tokenizeAskQuery(seed))
    .map((token) => token.toLowerCase())
    .forEach((token) => tokens.add(token));
  const phrases = seed.includes(" ") ? [seed.toLowerCase()] : [];
  return {
    tokens: tokens.size > 0 ? Array.from(tokens) : fallback.tokens,
    phrases: phrases.length > 0 ? phrases : fallback.phrases,
  };
};

const estimateWordCount = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const buildGraphEvidenceDocBlocks = (args: {
  evidence: HelixAskGraphEvidence[];
  question: string;
  conceptMatch: HelixAskConceptMatch | null;
  existingBlocks: Array<{ path: string; block: string }>;
}): { blocks: Array<{ path: string; block: string }>; paths: string[] } => {
  const docEvidence = args.evidence.filter((entry) => entry.type === "doc" && entry.path);
  if (docEvidence.length === 0) return { blocks: [], paths: [] };
  const existing = new Set(args.existingBlocks.map((block) => block.path.replace(/\\/g, "/").toLowerCase()));
  const fallbackTerms = buildDefinitionMatchTerms(args.question, args.conceptMatch);
  const blocks: Array<{ path: string; block: string }> = [];
  const paths: string[] = [];
  for (const entry of docEvidence) {
    const normalizedPath = (entry.path ?? "").replace(/\\/g, "/").trim();
    if (!normalizedPath) continue;
    const key = normalizedPath.toLowerCase();
    if (existing.has(key)) continue;
    const index = readDocSectionIndex(normalizedPath);
    if (!index.sections.length) continue;
    let snippet = "";
    if (entry.heading) {
      const section = findDocSectionByHeading(index, entry.heading);
      if (section) {
        snippet = buildDocSectionSnippet(section);
      }
    }
    if (!snippet) {
      const matchTerms = buildGraphEvidenceMatchTerms(entry, fallbackTerms);
      const match = selectDocSectionMatch(index, matchTerms.tokens, matchTerms.phrases);
      if (match.snippet) {
        snippet = match.snippet;
      } else {
        snippet = buildDocSectionSnippet(index.sections[0]);
      }
    }
    if (!snippet) continue;
    const block = `${normalizedPath}\n${snippet}`;
    blocks.push({ path: normalizedPath, block });
    paths.push(normalizedPath);
    existing.add(key);
  }
  return { blocks, paths };
};

  const DOC_PROOF_SPAN_RE = /\bSpan:\s*L\d+/i;
  const DOC_SECTION_LINE_RE = /\b(Section|Title|Heading|Subheading|Doc):\s+/i;

  const resolveDefinitionDocBlocks = (
    docBlocks: Array<{ path: string; block: string }>,
    conceptMatch: HelixAskConceptMatch | null,
    definitionFocus: boolean,
  ): Array<{ path: string; block: string }> => {
    if (!definitionFocus || docBlocks.length === 0) return docBlocks;
    const normalize = (value: string) => value.replace(/\\/g, "/").toLowerCase();
    const preferredPaths = new Set<string>();
    if (conceptMatch?.card.sourcePath && isDefinitionDocPath(conceptMatch.card.sourcePath)) {
      preferredPaths.add(normalize(conceptMatch.card.sourcePath));
    }
    if (preferredPaths.size > 0) {
      const byPath = docBlocks.filter((block) =>
        preferredPaths.has(normalize(block.path)),
      );
      if (byPath.length > 0) return byPath;
    }
    const termSet = new Set<string>();
    const pushTerm = (term?: string) => {
      const trimmed = term?.trim();
      if (trimmed) termSet.add(trimmed);
    };
    if (conceptMatch?.card) {
      pushTerm(conceptMatch.card.id);
      pushTerm(conceptMatch.card.label);
      (conceptMatch.card.aliases ?? []).forEach((alias) => pushTerm(alias));
    }
    const terms = Array.from(termSet).filter((term) => term.length > 2);
    if (terms.length === 0) return docBlocks;
    const escaped = terms
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    if (!escaped) return docBlocks;
  const termRe = new RegExp(`\\b(?:${escaped})\\b`, "i");
  const byTerm = docBlocks.filter(
    (block) => termRe.test(block.block) || termRe.test(block.path),
  );
  return byTerm.length > 0 ? byTerm : docBlocks;
};

const extractDocBlockHeader = (block: { path: string; block: string }): string => {
  const lines = block.block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (DOC_SECTION_LINE_RE.test(line)) {
      return line;
    }
  }
  return lines[1] ?? lines[0] ?? block.path;
};

const scoreDocBlock = (
  block: { path: string; block: string },
  definitionFocus: boolean,
): { score: number; reasons: string[] } => {
  const pathLower = block.path.toLowerCase();
  const textLower = block.block.toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  if (definitionFocus && isDefinitionDocPath(block.path)) {
    score += 4;
    reasons.push("definition_doc");
  }
  if (/\bdefinition\b|\bmeaning\b|\boverview\b/.test(textLower)) {
    score += 3;
    reasons.push("definition_terms");
  }
  if (/\bcontract\b|\bguardrail\b|\bpolicy\b|\bmust\b|\bshould\b/.test(textLower)) {
    score += 2;
    reasons.push("policy");
  }
  if (/\bentrypoint\b|\bapi\b|\binterface\b|\bschema\b/.test(textLower)) {
    score += 2;
    reasons.push("entrypoint");
  }
  if (/(^|\/)(tests?|specs?)[/\\]/i.test(block.path) || /\btest\b|\bspec\b/.test(textLower)) {
    score += 1;
    reasons.push("test");
  }
  if (pathLower.includes("docs/knowledge") || pathLower.includes("docs/ethos")) {
    score += 1;
    reasons.push("core_docs");
  }
  return { score, reasons };
};

const compactDocBlocks = (
  docBlocks: Array<{ path: string; block: string }>,
  options: {
    maxBlocks: number;
    maxBytes: number;
    maxPerFile: number;
    definitionFocus: boolean;
  },
): { blocks: Array<{ path: string; block: string }>; summary: HelixAskCompactionSummary } => {
  if (!docBlocks.length) {
    return {
      blocks: [],
      summary: {
        applied: false,
        kept: 0,
        dropped: 0,
        maxBlocks: options.maxBlocks,
        maxBytes: options.maxBytes,
        maxPerFile: options.maxPerFile,
        policy: "definition->policy->entrypoint->tests",
      },
    };
  }
  const policy = "definition->policy->entrypoint->tests";
  const deduped: Array<{
    path: string;
    block: string;
    header: string;
    score: number;
    reasons: string[];
  }> = [];
  const seen = new Set<string>();
  for (const block of docBlocks) {
    const header = extractDocBlockHeader(block);
    const hash = crypto.createHash("sha1").update(block.block).digest("hex");
    const key = `${block.path.toLowerCase()}::${header.toLowerCase()}::${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const scored = scoreDocBlock(block, options.definitionFocus);
    deduped.push({ ...block, header, score: scored.score, reasons: scored.reasons });
  }
  const sorted = deduped.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) return pathCompare;
    return a.header.localeCompare(b.header);
  });
  const kept: Array<{ path: string; block: string }> = [];
  const perFileCount = new Map<string, number>();
  let totalBytes = 0;
  for (const entry of sorted) {
    if (kept.length >= options.maxBlocks) break;
    const currentBytes = totalBytes + entry.block.length;
    if (currentBytes > options.maxBytes) break;
    const key = entry.path.toLowerCase();
    const count = perFileCount.get(key) ?? 0;
    if (count >= options.maxPerFile) continue;
    kept.push({ path: entry.path, block: entry.block });
    perFileCount.set(key, count + 1);
    totalBytes = currentBytes;
  }
  const dropped = Math.max(0, docBlocks.length - kept.length);
  return {
    blocks: kept,
    summary: {
      applied: dropped > 0,
      kept: kept.length,
      dropped,
      maxBlocks: options.maxBlocks,
      maxBytes: options.maxBytes,
      maxPerFile: options.maxPerFile,
      policy,
    },
  };
};

const selectDocBlocks = (
  contextText: string,
  definitionFocus: boolean,
): { docBlocks: Array<{ path: string; block: string }>; proofSpanRate: number; compaction: HelixAskCompactionSummary } => {
  const blocks = splitAskContextBlocks(contextText);
  const docBlocksAll = blocks.filter((block) => /(^|\/)docs\//i.test(block.path));
  const docBlocks = definitionFocus
    ? docBlocksAll.filter((block) => isDefinitionDocPath(block.path))
    : docBlocksAll;
  const compaction = compactDocBlocks(docBlocks, {
    maxBlocks: HELIX_ASK_COMPACTION_MAX_BLOCKS,
    maxBytes: HELIX_ASK_COMPACTION_MAX_BYTES,
    maxPerFile: HELIX_ASK_COMPACTION_MAX_PER_FILE,
    definitionFocus,
  });
  return { docBlocks: compaction.blocks, proofSpanRate: computeProofSpanRate(compaction.blocks), compaction: compaction.summary };
};

const applyCompactionDebug = (
  debugPayload: Record<string, any> | null | undefined,
  summary: HelixAskCompactionSummary | null | undefined,
): void => {
  if (!debugPayload || !summary) return;
  debugPayload.compaction_applied = summary.applied;
  debugPayload.compaction_dropped = summary.dropped;
  debugPayload.compaction_kept = summary.kept;
  debugPayload.compaction_policy = summary.policy;
  debugPayload.compaction_budget = {
    maxBlocks: summary.maxBlocks,
    maxBytes: summary.maxBytes,
    maxPerFile: summary.maxPerFile,
  };
};

const computeProofSpanRate = (docBlocks: Array<{ path: string; block: string }>): number => {
  if (!docBlocks.length) return 0;
  let hits = 0;
  for (const block of docBlocks) {
    if (DOC_PROOF_SPAN_RE.test(block.block) || DOC_SECTION_LINE_RE.test(block.block)) {
      hits += 1;
    }
  }
  return hits / docBlocks.length;
};

const computeClaimRefRate = (claims: Array<{ evidenceRefs?: string[] }>): number => {
  if (!claims.length) return 0;
  const withRefs = claims.filter((claim) => (claim.evidenceRefs?.length ?? 0) > 0).length;
  return withRefs / claims.length;
};

const buildResolvedConceptSnapshot = (
  slotPlan: HelixAskSlotPlan | null,
  evidencePaths: string[],
): Array<{ id: string; label: string; evidence: string[] }> => {
  if (!slotPlan) return [];
  const lowerPaths = evidencePaths.map((path) => path.toLowerCase());
  const resolved: Array<{ id: string; label: string; evidence: string[] }> = [];
  for (const slot of slotPlan.slots) {
    if (isWeakSlot(slot)) continue;
    const slotId = slot.id.toLowerCase();
    const matches = evidencePaths.filter((path, index) =>
      lowerPaths[index]?.includes(slotId),
    );
    resolved.push({
      id: slot.id,
      label: slot.label,
      evidence: matches.slice(0, 6),
    });
  }
  return resolved;
};

async function buildAmbiguityCandidateSnapshot(args: {
  question: string;
  targetSpan?: string;
  seedTerms?: string[];
  topicProfile?: HelixAskTopicProfile | null;
}): Promise<{ candidates: AskCandidate[]; queries: string[] }> {
  const snapshot = await loadCodeLattice();
  if (!snapshot) return { candidates: [], queries: [] };
  const rawQueries = [
    args.targetSpan,
    args.question,
    ...(args.seedTerms ?? []),
  ].filter(Boolean) as string[];
  const seen = new Set<string>();
  const queries = rawQueries.filter((entry) => {
    const normalized = entry.trim().toLowerCase();
    if (!normalized) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  if (queries.length === 0) return { candidates: [], queries: [] };
  const allowlist = args.topicProfile?.allowlistTiers?.[0] ?? [];
  const candidatePool = Math.max(HELIX_ASK_AMBIGUITY_CLUSTER_TOPK * 3, 12);
  const candidateLists: AskCandidateChannelList[] = [];
  const channelTopScores = initAskChannelStats();
  for (const query of queries) {
    const multi = collectAskCandidatesMultiChannel(snapshot, query, args.question, {
      topicProfile: args.topicProfile,
      allowlist,
    });
    for (const entry of multi.lists) {
      const trimmed = entry.candidates.slice(0, candidatePool);
      if (trimmed.length > 0) {
        candidateLists.push({ channel: entry.channel, candidates: trimmed });
        channelTopScores[entry.channel] = Math.max(channelTopScores[entry.channel], trimmed[0].score);
      }
    }
  }
  if (candidateLists.length === 0) {
    return { candidates: [], queries };
  }
  const channelWeights = scaleAskChannelWeights(HELIX_ASK_RRF_CHANNEL_WEIGHTS, channelTopScores);
  const merged = mergeCandidatesWithWeightedRrf(candidateLists, HELIX_ASK_RRF_K, channelWeights);
  return {
    candidates: merged.slice(0, HELIX_ASK_AMBIGUITY_CLUSTER_TOPK),
    queries,
  };
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
  channelWeights,
}: {
  selected: AskCandidate[];
  topicTier?: number;
  topicMustIncludeOk?: boolean;
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  channelHits?: AskCandidateChannelStats;
  channelTopScores?: AskCandidateChannelStats;
  channelWeights?: AskCandidateChannelStats;
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
  channelWeights?: AskCandidateChannelStats;
  docHeaderInjected?: number;
} {
  const lines: string[] = [];
  const files: string[] = [];
  let docHeaderInjected = 0;
  for (const entry of selected) {
    let preview = entry.preview;
    const injected = injectDocHeaderPreview(entry.filePath, preview);
    preview = injected.preview;
    if (injected.injected) docHeaderInjected += 1;
    preview = clipAskText(preview, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    const normalizedPath = entry.filePath.replace(/\\/g, "/");
    if (isIndexOnlyPath(normalizedPath)) {
      continue;
    }
    lines.push(`${normalizedPath}\n${preview}`);
    files.push(normalizedPath);
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
    channelWeights,
    docHeaderInjected,
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
  verbosity: HelixAskVerbosity,
): string {
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
    "Use only the evidence in the context below. Cite file paths when referencing code.",
    "If the context is insufficient, say what is missing and ask a concise follow-up.",
    "When the context includes solver or calculation functions, summarize the inputs, outputs, and flow before UI details.",
  ];
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  if (format === "steps") {
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(
      `Each step should be ${spec.steps.sentences} sentences and grounded in repo details; cite file paths when relevant.`,
    );
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
    );
  } else if (format === "compare") {
    lines.push(
      `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `If the question is comparative, include a short bullet list (${spec.compareBullets} items) of concrete differences grounded in repo details.`,
    );
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push(
      `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
    );
  } else {
    lines.push(
      `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps unless explicitly requested.`,
    );
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    lines.push(
      `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
    );
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push("Do not include the words \"Question:\" or \"Context sources\".");
  lines.push("Keep paragraphs focused and separate sections with blank lines.");
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
  verbosity: HelixAskVerbosity,
): string {
  const lines = [
    "You are Helix Ask.",
    "Answer using general knowledge; do not cite file paths or repo details.",
  ];
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  if (format === "steps") {
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(`Each step should be ${spec.steps.sentences} sentences.`);
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
    );
  } else if (format === "compare") {
    lines.push(
      `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `If the question is comparative, include a short bullet list (${spec.compareBullets} items) of concrete differences.`,
    );
    lines.push(
      `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
    );
  } else {
    lines.push(
      `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps unless explicitly requested.`,
    );
    lines.push(
      `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
    );
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

  const INLINE_JSON_TEXT_RE = /\{\s*"text"\s*:\s*"([^"]+)"[^}]*\}/g;
  const NO_EVIDENCE_RE =
    /\b(no|not enough)\s+repo[-\s]?evidenced?\b|\bno\s+repo\s+evidence\b|\bno\s+evidence\s+(was|is)\s+found\b|\bno\s+repo[-\s]?grounded\b|\bcould\s+not\s+confirm\b/i;

  function stripInlineJsonArtifacts(value: string): string {
    if (!value) return value;
    return value.replace(INLINE_JSON_TEXT_RE, (_match, text: string) => {
      const decoded = text
        .replace(/\\"/g, '"')
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\\/g, "\\")
        .trim();
      return decoded || text;
    });
  }

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

const EVIDENCE_BULLET_RE = /^\s*(\d+\.\s+|[-*]\s+)/;

  function filterEvidenceBulletsByPath(
    text: string,
    allowPath: (path: string) => boolean,
  ): string {
    const trimmed = text?.trim() ?? "";
    if (!trimmed) return "";
    const lines = trimmed.split(/\r?\n/);
    const groups: string[][] = [];
    let current: string[] = [];
    let preamble: string[] = [];
    let sawBullet = false;
    for (const line of lines) {
      if (EVIDENCE_BULLET_RE.test(line)) {
        if (!sawBullet && preamble.length) {
          groups.push(preamble);
          preamble = [];
        }
        sawBullet = true;
        if (current.length) groups.push(current);
        current = [line];
        continue;
      }
      if (current.length) {
        current.push(line);
        continue;
      }
      if (!sawBullet) {
        preamble.push(line);
      }
    }
    if (current.length) groups.push(current);
    if (!sawBullet && preamble.length) groups.push(preamble);
    if (groups.length === 0) {
      const paths = extractFilePathsFromText(trimmed);
      return paths.some((path) => allowPath(path)) ? trimmed : "";
    }
  const kept = groups.filter((group) => {
    const paths = extractFilePathsFromText(group.join("\n"));
    return paths.some((path) => allowPath(path));
  });
  if (kept.length === 0) return "";
  return kept.map((group) => group.join("\n")).join("\n");
}

function buildDocEvidenceBullet(
  block: { path: string; block: string },
  label: "Definition" | "Evidence",
): string {
  const lines = block.block.split(/\r?\n/).slice(1);
  const referenceLines = lines.filter((line) =>
    DOC_PROOF_SPAN_RE.test(line) || DOC_SECTION_LINE_RE.test(line),
  );
  const content = lines
    .filter((line) => !DOC_PROOF_SPAN_RE.test(line))
    .filter((line) => !DOC_SECTION_LINE_RE.test(line))
    .join(" ")
    .trim();
  const snippet = clipAskText(content, 240);
  const prefix = referenceLines.length ? `${referenceLines.join(" ")} ` : "";
  const summary =
    snippet ? ensureSentence(snippet) : "See the documentation for more detail.";
  return `- ${label}: ${prefix}${summary} (see ${block.path})`;
}

function buildDefinitionDocBullet(block: { path: string; block: string }): string {
  return buildDocEvidenceBullet(block, "Definition");
}

function buildDocEvidenceScaffold(
  blocks: Array<{ path: string; block: string }>,
  options: { maxBlocks: number; definitionFocus: boolean },
): string {
  if (!blocks.length || options.maxBlocks <= 0) return "";
  const selected = blocks.slice(0, options.maxBlocks);
  const bullets = selected.map((block, index) => {
    const label = options.definitionFocus && index === 0 ? "Definition" : "Evidence";
    return buildDocEvidenceBullet(block, label);
  });
  return bullets.join("\n");
}

function buildCodeEvidenceBullet(span: HelixAskCodeSpan): string {
  const spanLabel = span.span ? `${span.span} ` : "";
  const snippet = clipAskText(span.snippet, 240);
  const prefix = span.isTest ? "Test" : "Code";
  const summary = snippet ? ensureSentence(snippet) : "See the implementation for details.";
  return `- ${prefix}: ${spanLabel}${summary} (see ${span.filePath})`;
}

const SYMBOL_TOKEN_RE = /\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g;
const SYMBOL_STOPWORDS = new Set(
  [
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "into",
    "what",
    "does",
    "mean",
    "repo",
    "docs",
    "document",
    "definition",
    "overview",
    "section",
    "span",
    "file",
    "files",
    "path",
    "paths",
    "system",
    "module",
    "modules",
    "function",
    "functions",
    "class",
    "classes",
    "types",
    "type",
    "data",
    "info",
    "note",
    "notes",
    "key",
    "keys",
    "value",
    "values",
  ].map((entry) => entry.toLowerCase()),
);

const extractSymbolCandidates = (blocks: Array<{ path: string; block: string }>): string[] => {
  const counts = new Map<string, number>();
  const pushToken = (token: string) => {
    const trimmed = token.trim();
    if (trimmed.length < 3) return;
    const lower = trimmed.toLowerCase();
    if (SYMBOL_STOPWORDS.has(lower)) return;
    const symbolLike =
      /[A-Z]/.test(trimmed) || /_/.test(trimmed) || /\d/.test(trimmed) || /::|\./.test(trimmed);
    if (!symbolLike) return;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  };
  for (const block of blocks) {
    const content = block.block.split(/\r?\n/).slice(1).join(" ");
    const matches = content.match(SYMBOL_TOKEN_RE) ?? [];
    for (const match of matches) {
      pushToken(match);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token);
};

const extractCodeSpanFromFile = (
  filePath: string,
  symbol: string,
): { snippet: string; span?: string } => {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return { snippet: "" };
  }
  try {
    const raw = fs.readFileSync(resolved, "utf8");
    const lines = raw.split(/\r?\n/);
    const lowerSymbol = symbol.toLowerCase();
    let index = lines.findIndex((line) => line.includes(symbol));
    if (index < 0) {
      index = lines.findIndex((line) => line.toLowerCase().includes(lowerSymbol));
    }
    if (index < 0) return { snippet: "" };
    const start = Math.max(0, index - 2);
    const end = Math.min(lines.length - 1, index + 2);
    const snippet = lines.slice(start, end + 1).join("\n").trim();
    const span = `Span: L${start + 1}-L${end + 1}`;
    return { snippet, span };
  } catch {
    return { snippet: "" };
  }
};

const buildGraphEvidenceCodeSpans = async (args: {
  evidence: HelixAskGraphEvidence[];
  question: string;
  topicProfile?: HelixAskTopicProfile | null;
}): Promise<HelixAskCodeSpan[]> => {
  if (!HELIX_ASK_CODE_ALIGNMENT) return [];
  const entries = args.evidence.filter((entry) => entry.type !== "doc");
  if (entries.length === 0) return [];
  const spans: HelixAskCodeSpan[] = [];
  const seen = new Set<string>();
  let bytesUsed = 0;
  let snapshot: Awaited<ReturnType<typeof loadCodeLattice>> | null = null;
  const ensureSnapshot = async () => {
    if (snapshot === null) {
      snapshot = await loadCodeLattice();
    }
    return snapshot;
  };
  for (const entry of entries) {
    if (spans.length >= HELIX_ASK_CODE_ALIGN_MAX_SPANS) break;
    const symbol = (entry.symbol ?? entry.field ?? entry.contains ?? "").trim();
    if (!symbol) continue;
    let filePath = entry.path;
    if (!filePath) {
      const lattice = await ensureSnapshot();
      if (!lattice) continue;
      const multi = collectAskCandidatesMultiChannel(lattice, symbol, args.question, {
        topicProfile: args.topicProfile,
      });
      const flat = multi.lists.flatMap((list) => list.candidates);
      flat.sort((a, b) => b.score - a.score);
      if (entry.type === "test") {
        const testCandidate = flat.find((candidate) =>
          /(^|\/)(tests?|specs?)[/\\]/i.test(candidate.filePath ?? "") || /\.spec\./i.test(candidate.filePath ?? ""),
        );
        if (testCandidate?.filePath) {
          filePath = testCandidate.filePath;
        }
      }
      if (!filePath) {
        filePath = flat[0]?.filePath;
      }
    }
    if (!filePath) continue;
    const { snippet, span } = extractCodeSpanFromFile(filePath, symbol);
    const trimmedSnippet = snippet ? clipAskText(snippet, 400) : "";
    if (!trimmedSnippet) continue;
    const key = `${symbol}|${filePath}`.toLowerCase();
    if (seen.has(key)) continue;
    const candidateBytes = trimmedSnippet.length;
    if (bytesUsed + candidateBytes > HELIX_ASK_CODE_ALIGN_MAX_BYTES && spans.length > 0) break;
    bytesUsed += candidateBytes;
    const isTest =
      entry.type === "test" ||
      /(^|\/)(tests?|specs?)[/\\]/i.test(filePath) ||
      /\.spec\./i.test(filePath);
    spans.push({
      symbol,
      filePath,
      snippet: trimmedSnippet,
      span,
      isTest,
    });
    seen.add(key);
  }
  return spans;
};

const buildCodeAlignmentFromDocBlocks = async (
  blocks: Array<{ path: string; block: string }>,
  question: string,
  topicProfile?: HelixAskTopicProfile | null,
): Promise<HelixAskCodeAlignment> => {
  if (!HELIX_ASK_CODE_ALIGNMENT || blocks.length === 0) {
    return { spans: [], symbols: [], resolved: [] };
  }
  const symbols = extractSymbolCandidates(blocks).slice(0, HELIX_ASK_CODE_ALIGN_MAX_SYMBOLS);
  if (symbols.length === 0) {
    return { spans: [], symbols: [], resolved: [] };
  }
  const snapshot = await loadCodeLattice();
  if (!snapshot) {
    return { spans: [], symbols, resolved: [] };
  }
  const spans: HelixAskCodeSpan[] = [];
  const resolved: string[] = [];
  let bytesUsed = 0;
  for (const symbol of symbols) {
    if (spans.length >= HELIX_ASK_CODE_ALIGN_MAX_SPANS) break;
    const multi = collectAskCandidatesMultiChannel(snapshot, symbol, question, {
      topicProfile,
    });
    const flat = multi.lists.flatMap((list) => list.candidates);
    flat.sort((a, b) => b.score - a.score);
    const top = flat[0];
    if (!top?.filePath) continue;
    const { snippet, span } = extractCodeSpanFromFile(top.filePath, symbol);
    const trimmedSnippet = snippet ? clipAskText(snippet, 400) : "";
    if (!trimmedSnippet) continue;
    const candidateBytes = trimmedSnippet.length;
    if (bytesUsed + candidateBytes > HELIX_ASK_CODE_ALIGN_MAX_BYTES && spans.length > 0) break;
    bytesUsed += candidateBytes;
    const isTest = /(^|\/)(tests?|specs?)[/\\]/i.test(top.filePath) || /\.spec\./i.test(top.filePath);
    spans.push({
      symbol,
      filePath: top.filePath,
      snippet: trimmedSnippet,
      span,
      isTest,
    });
    resolved.push(top.filePath);
    if (HELIX_ASK_CODE_ALIGN_TESTS && !isTest) {
      const testCandidate = flat.find((entry) =>
        /(^|\/)(tests?|specs?)[/\\]/i.test(entry.filePath) || /\.spec\./i.test(entry.filePath),
      );
      if (testCandidate && spans.length < HELIX_ASK_CODE_ALIGN_MAX_SPANS) {
        const testSpan = extractCodeSpanFromFile(testCandidate.filePath, symbol);
        if (testSpan.snippet) {
          spans.push({
            symbol,
            filePath: testCandidate.filePath,
            snippet: clipAskText(testSpan.snippet, 320),
            span: testSpan.span,
            isTest: true,
          });
          resolved.push(testCandidate.filePath);
        }
      }
    }
  }
  return { spans, symbols, resolved };
};

const buildPromptItemHash = (type: string, content: string): string => {
  return crypto.createHash("sha256").update(`${type}\n${content}`).digest("hex").slice(0, 12);
};

const buildHelixAskPromptItems = (args: {
  intentId?: string;
  intentDomain?: string;
  intentTier?: string;
  queries?: string[];
  contextFiles?: string[];
  retrievalConfidence?: number;
  docBlocks?: Array<{ path: string; block: string }>;
  codeAlignment?: HelixAskCodeAlignment | null;
  treeWalk?: string;
  slotCoverage?: { missingSlots: string[]; ratio: number } | null;
  docCoverage?: { missingSlots: string[]; ratio: number } | null;
  graphPack?: HelixAskGraphPack | null;
}): HelixAskPromptItem[] => {
  const items: HelixAskPromptItem[] = [];
  const pushItem = (type: string, content: string, label?: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const hash = buildPromptItemHash(type, trimmed);
    items.push({
      id: `${type}:${hash}`,
      type,
      label,
      content: trimmed,
      hash,
      size: trimmed.length,
    });
  };
  if (args.intentId) {
    pushItem(
      "intent",
      `intent=${args.intentId} domain=${args.intentDomain ?? "-"} tier=${args.intentTier ?? "-"}`,
    );
  }
  if (args.queries?.length || args.contextFiles?.length) {
    const lines = [
      args.queries?.length ? `queries: ${args.queries.join("; ")}` : "",
      args.contextFiles?.length ? `files: ${args.contextFiles.slice(0, 12).join(", ")}` : "",
      typeof args.retrievalConfidence === "number"
        ? `confidence: ${args.retrievalConfidence.toFixed(2)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    pushItem("retrieval_summary", lines);
  }
  if (args.graphPack?.treeIds?.length) {
    pushItem("selected_trees", args.graphPack.treeIds.join(", "));
  }
  if (args.docBlocks?.length) {
    const docLines = args.docBlocks
      .map((block) => `- ${extractDocBlockHeader(block)} (${block.path})`)
      .join("\n");
    pushItem("doc_spans", docLines);
  }
  if (args.codeAlignment?.spans?.length) {
    const codeLines = args.codeAlignment.spans
      .map((span) => `- ${span.symbol} ${span.span ?? ""} (${span.filePath})`)
      .join("\n");
    pushItem("code_spans", codeLines);
  }
  if (args.treeWalk?.trim()) {
    pushItem("tree_walk", args.treeWalk.trim());
  }
  if (args.slotCoverage || args.docCoverage) {
    const coverageLines = [
      args.slotCoverage
        ? `slot_coverage: ${args.slotCoverage.ratio.toFixed(2)} missing=${args.slotCoverage.missingSlots.join(",") || "none"}`
        : "",
      args.docCoverage
        ? `doc_coverage: ${args.docCoverage.ratio.toFixed(2)} missing=${args.docCoverage.missingSlots.join(",") || "none"}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    pushItem("slot_coverage", coverageLines);
  }
  return items;
};

const buildToolResultsBlock = (items: HelixAskPromptItem[]): string => {
  if (!items.length) return "";
  const lines: string[] = ["TOOL_RESULTS"];
  for (const item of items) {
    if (!["retrieval_summary", "doc_spans", "code_spans", "tree_walk"].includes(item.type)) {
      continue;
    }
    lines.push(`[${item.type}]`);
    lines.push(item.content);
    lines.push("");
  }
  lines.push("END_TOOL_RESULTS");
  const raw = lines.join("\n").trim();
  if (raw.length <= HELIX_ASK_TOOL_RESULTS_MAX_CHARS) return raw;
  const clipped = clipAskText(raw, HELIX_ASK_TOOL_RESULTS_MAX_CHARS);
  if (clipped.includes("END_TOOL_RESULTS")) return clipped;
  return `${clipped}\nEND_TOOL_RESULTS`;
};

const toolResultsHas = (toolResultsBlock: string | undefined, type: string): boolean => {
  if (!toolResultsBlock?.trim()) return false;
  return toolResultsBlock.includes(`[${type}]`);
};

const buildToolResultsFallbackAnswer = (args: {
  definitionFocus: boolean;
  docBlocks: Array<{ path: string; block: string }>;
  codeAlignment?: HelixAskCodeAlignment | null;
  treeWalk?: string;
}): string => {
  const lines: string[] = ["Confirmed:"];
  const fallbackDocBlocks = filterFallbackDocBlocks(args.docBlocks);
  const docBlocks = fallbackDocBlocks.length > 0 ? fallbackDocBlocks : args.docBlocks;
  if (docBlocks.length > 0) {
    const limit = Math.min(docBlocks.length, 3);
    for (let i = 0; i < limit; i += 1) {
      const label = args.definitionFocus && i === 0 ? "Definition" : "Evidence";
      lines.push(buildDocEvidenceBullet(docBlocks[i], label));
    }
  }
  if (args.codeAlignment?.spans?.length) {
    const limit = Math.min(args.codeAlignment.spans.length, 3);
    for (let i = 0; i < limit; i += 1) {
      lines.push(buildCodeEvidenceBullet(args.codeAlignment.spans[i]));
    }
  }
  if (args.treeWalk?.trim()) {
    lines.push("");
    lines.push(args.treeWalk.trim());
  }
  return lines.join("\n");
};

const stripEvidenceBulletPrefix = (value: string): string =>
  value.replace(/^\s*-\s*/, "").trim();

const filterFallbackDocBlocks = (
  docBlocks: Array<{ path: string; block: string }>,
): Array<{ path: string; block: string }> => {
  if (!docBlocks.length) return docBlocks;
  return docBlocks.filter((block) => {
    const normalized = block.path.replace(/\\/g, "/").toLowerCase();
    if (normalized.includes("/warp-web/")) return false;
    if (/\.(html?|xhtml)$/i.test(normalized)) return false;
    return true;
  });
};

const SCIENTIFIC_SECTION_HEADINGS = [
  "Confirmed:",
  "Reasoned connections (bounded):",
  "Hypotheses (optional):",
  "Next evidence:",
] as const;

const normalizeScientificSectionLayout = (value: string): string => {
  if (!value.trim()) return value;
  let cleaned = value;
  for (let i = 1; i < SCIENTIFIC_SECTION_HEADINGS.length; i += 1) {
    const heading = SCIENTIFIC_SECTION_HEADINGS[i];
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!\\n)\\s*${escaped}`, "gi");
    cleaned = cleaned.replace(re, `\n\n${heading}`);
  }
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
};

const extractOrderedAnswerSentences = (value: string, limit = 3): string[] => {
  if (!value.trim()) return [];
  const ordered: string[] = [];
  const orderedRe = /(?:^|\s)\d+\.\s+([\s\S]*?)(?=(?:\s+\d+\.\s+)|$)/g;
  for (const match of value.matchAll(orderedRe)) {
    const sentence = (match[1] ?? "").replace(/\s+/g, " ").trim();
    if (sentence.length >= 24) {
      ordered.push(ensureSentence(sentence));
    }
    if (ordered.length >= limit) break;
  }
  if (ordered.length > 0) return Array.from(new Set(ordered)).slice(0, limit);
  const fallback = splitGroundedSentences(value)
    .map((entry) => ensureSentence(entry))
    .filter((entry) => entry.length >= 24);
  return Array.from(new Set(fallback)).slice(0, limit);
};

const buildSingleLlmShortAnswerFallback = (args: {
  question: string;
  definitionFocus: boolean;
  docBlocks: Array<{ path: string; block: string }>;
  codeAlignment?: HelixAskCodeAlignment | null;
  treeWalk?: string;
  missingSlots?: string[];
  slotPlan?: HelixAskSlotPlan | null;
  anchorFiles?: string[];
  searchedTerms?: string[];
  searchedFiles?: string[];
  planClarify?: string;
  headingSeedSlots?: HelixAskSlotPlanEntry[];
  requiresRepoEvidence?: boolean;
}): string => {
  const implementationQuestion = isImplementationQuestion(args.question);
  const derivedDocBlocks = args.docBlocks.length
    ? args.docBlocks
    : (args.codeAlignment?.spans ?? [])
        .filter((span) => isDocEvidencePath(span.filePath))
        .map((span) => ({
          path: span.filePath,
          block: `${span.filePath}\nSection: Retrieved Span\n${span.span ?? "Span: L?-L?"}\n${span.snippet}`,
        }));
  const filteredDocBlocks = filterFallbackDocBlocks(derivedDocBlocks);
  const docBlocksForRanking = filteredDocBlocks.length > 0 ? filteredDocBlocks : derivedDocBlocks;
  const relevanceTokens = tokenizeCoverageRelevance(args.question);
  const rankedDocBlocks = docBlocksForRanking
    .map((block) => ({
      block,
      relevance: scoreCoverageRelevance(
        relevanceTokens,
        `${block.path}\n${extractDocBlockHeader(block)}\n${block.block}`,
      ),
    }))
    .sort((a, b) => b.relevance - a.relevance);
  const docSource =
    rankedDocBlocks.some((entry) => entry.relevance > 0)
      ? rankedDocBlocks.filter((entry) => entry.relevance > 0).map((entry) => entry.block)
      : derivedDocBlocks;
  const rankedCodeSpans = (args.codeAlignment?.spans ?? [])
    .filter((span) => isCodeEvidencePath(span.filePath) || span.isTest)
    .map((span) => {
      const relevance = scoreCoverageRelevance(
        relevanceTokens,
        `${span.filePath}\n${span.symbol}\n${span.snippet}`,
      );
      return { span, relevance };
    })
    .filter((entry) => implementationQuestion || entry.relevance >= 0.45)
    .sort((a, b) => b.relevance - a.relevance);
  const codeSource =
    rankedCodeSpans.some((entry) => entry.relevance > 0)
      ? rankedCodeSpans.filter((entry) => entry.relevance > 0).map((entry) => entry.span)
      : [];
  const docLimit = Math.min(derivedDocBlocks.length, args.definitionFocus ? 5 : 4);
  const codeLimit = Math.min(codeSource.length, implementationQuestion ? 4 : 2);
  const docBullets = docSource
    .slice(0, docLimit)
    .map((block, index) =>
      buildDocEvidenceBullet(block, args.definitionFocus && index === 0 ? "Definition" : "Evidence"),
    );
  const codeBullets = codeSource.slice(0, codeLimit).map((span) => buildCodeEvidenceBullet(span));
  const normalizedEvidence = [...docBullets, ...codeBullets].map(stripEvidenceBulletPrefix);
  const lines: string[] = ["Confirmed:"];
  if (docBullets.length === 0 && codeBullets.length === 0) {
    lines.push(
      `- ${
        args.requiresRepoEvidence
          ? "No repo-evidenced claims were confirmed yet."
          : "No confirmed evidence was found yet."
      }`,
    );
  } else {
    for (const bullet of docBullets) lines.push(bullet);
    for (const bullet of codeBullets) lines.push(bullet);
  }
  lines.push("");
  lines.push("Reasoned connections (bounded):");
  if (normalizedEvidence.length >= 2) {
    lines.push(
      `- ${clipAskText(normalizedEvidence[0], 220)} ${clipAskText(normalizedEvidence[1], 220)} Bounded linkage supported by cited repo evidence.`,
    );
  } else {
    lines.push("- Need at least two grounded points before drawing a connection.");
  }
  if (args.treeWalk?.trim()) {
    lines.push("");
    lines.push("Tree walk (bound):");
    lines.push(args.treeWalk.trim());
  }
  const nextEvidence = buildNextEvidenceHints({
    question: args.question,
    missingSlots: args.missingSlots,
    slotPlan: args.slotPlan,
    anchorFiles: args.anchorFiles,
    searchedTerms: args.searchedTerms,
    searchedFiles: args.searchedFiles,
    includeSearchSummary: true,
    planClarify: args.planClarify,
    headingSeedSlots: args.headingSeedSlots,
    suppressClarify: normalizedEvidence.length >= 2 && !(args.missingSlots?.length ?? 0),
    limit: 6,
  });
  lines.push("");
  lines.push("Next evidence:");
  if (nextEvidence.length > 0) {
    nextEvidence.forEach((item) => lines.push(`- ${item}`));
  } else {
    lines.push("- Provide the file path or doc section that defines the missing terms.");
  }
  return lines.join("\n").trim();
};

type HelixAskAnswerExtensionResult = {
  available: boolean;
  text?: string;
  citations: string[];
  itemCount: number;
  docItems: number;
  codeItems: number;
};

type HelixAskAnswerExtensionItem = {
  kind: "doc" | "code";
  path: string;
  summary: string;
  treeJson?: boolean;
};

const normalizePathKey = (value: string): string =>
  (normalizeEvidenceRef(value) ?? value).toLowerCase();

const TREE_JSON_CITATION_RE = /(^|\/)docs\/knowledge\/.+-tree\.json$/i;
const DOC_EVIDENCE_PATH_RE = /(^|\/)docs\/.+\.(md|json)$/i;
const CODE_EVIDENCE_PATH_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|cpp|cc|c|h|hpp|sql)$/i;
const NON_SIGNAL_EVIDENCE_PATH_RE = /\.(html?|css|svg|png|jpg|jpeg|gif|webp|ico)$/i;

const isTreeJsonCitationPath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  return TREE_JSON_CITATION_RE.test(normalized);
};

const isDocEvidencePath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  return DOC_EVIDENCE_PATH_RE.test(normalized);
};

const isCodeEvidencePath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  if (NON_SIGNAL_EVIDENCE_PATH_RE.test(normalized)) return false;
  if (isDocEvidencePath(normalized)) return false;
  return CODE_EVIDENCE_PATH_RE.test(normalized) || /(^|\/)(tests?|specs?)[/\\]/i.test(normalized);
};

const computeTreeCitationStats = (
  paths: string[],
): { total: number; tree: number; nonTree: number; share: number } => {
  const unique = Array.from(
    new Set(paths.map((entry) => (normalizeEvidenceRef(entry) ?? entry).replace(/\\/g, "/"))),
  ).filter(Boolean);
  if (unique.length === 0) {
    return { total: 0, tree: 0, nonTree: 0, share: 0 };
  }
  const tree = unique.reduce((count, entry) => count + (isTreeJsonCitationPath(entry) ? 1 : 0), 0);
  const nonTree = Math.max(0, unique.length - tree);
  return {
    total: unique.length,
    tree,
    nonTree,
    share: tree / unique.length,
  };
};

const summarizeForExtension = (value: string): string => {
  const cleaned = stripEvidenceBulletPrefix(value)
    .replace(/\s+/g, " ")
    .trim();
  return clipAskText(cleaned, 220);
};

const COVERAGE_RELEVANCE_STOPWORDS = new Set([
  "about",
  "connect",
  "define",
  "does",
  "explain",
  "from",
  "in",
  "into",
  "mean",
  "repo",
  "this",
  "what",
  "where",
  "which",
  "with",
]);

const tokenizeCoverageRelevance = (text: string): string[] =>
  dedupeTokens(tokenizeAskQuery(text))
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 4 && !COVERAGE_RELEVANCE_STOPWORDS.has(token));

const scoreCoverageRelevance = (questionTokens: string[], value: string): number => {
  if (!questionTokens.length || !value.trim()) return 0;
  const normalized = value.toLowerCase();
  let overlap = 0;
  for (const token of questionTokens) {
    if (normalized.includes(token)) overlap += 1;
  }
  return overlap / questionTokens.length;
};

const scoreNovelty = (answerLower: string, summary: string): number => {
  if (!summary.trim()) return 1;
  const tokens = dedupeTokens(tokenizeAskQuery(summary)).filter((token) => token.length >= 4);
  if (tokens.length === 0) return 1;
  let overlap = 0;
  for (const token of tokens) {
    if (answerLower.includes(token)) overlap += 1;
  }
  return 1 - overlap / tokens.length;
};

const isImplementationQuestion = (question: string): boolean =>
  /\b(where|implement|implementation|code|function|module|class|route|endpoint|test|validate|computed|compute|file|files)\b/i.test(
    question,
  );

const buildAnswerCoverageExtension = (args: {
  answerText: string;
  question?: string;
  docBlocks: Array<{ path: string; block: string }>;
  codeAlignment?: HelixAskCodeAlignment | null;
}): HelixAskAnswerExtensionResult => {
  const answer = args.answerText?.trim() ?? "";
  if (!answer) {
    return {
      available: false,
      citations: [],
      itemCount: 0,
      docItems: 0,
      codeItems: 0,
    };
  }
  const answerLower = answer.toLowerCase();
  const questionTokens = tokenizeCoverageRelevance(args.question ?? "");
  const citedPathKeys = new Set(
    extractFilePathsFromText(answer)
      .map((entry) => normalizePathKey(entry))
      .filter(Boolean),
  );
  const candidates: HelixAskAnswerExtensionItem[] = [];
  const pushCandidate = (item: HelixAskAnswerExtensionItem) => {
    if (!item.path || !item.summary) return;
    candidates.push(item);
  };
  for (let index = 0; index < args.docBlocks.length; index += 1) {
    const block = args.docBlocks[index];
    if (!isDocEvidencePath(block.path)) continue;
    const bullet = buildDocEvidenceBullet(
      block,
      index === 0 ? "Definition" : "Evidence",
    );
    const summary = summarizeForExtension(bullet);
    if (!summary) continue;
    pushCandidate({
      kind: "doc",
      path: block.path,
      summary,
      treeJson: isTreeJsonCitationPath(block.path),
    });
  }
  for (const span of args.codeAlignment?.spans ?? []) {
    if (!(isCodeEvidencePath(span.filePath) || span.isTest || isDocEvidencePath(span.filePath))) {
      continue;
    }
    const summary = summarizeForExtension(buildCodeEvidenceBullet(span));
    if (!summary) continue;
    pushCandidate({
      kind: "code",
      path: span.filePath,
      summary,
      treeJson: isTreeJsonCitationPath(span.filePath),
    });
  }
  if (candidates.length === 0) {
    return {
      available: false,
      citations: [],
      itemCount: 0,
      docItems: 0,
      codeItems: 0,
    };
  }
  const ranked = candidates
    .map((item) => {
      const pathKey = normalizePathKey(item.path);
      const pathNovel = pathKey ? !citedPathKeys.has(pathKey) : true;
      const novelty = scoreNovelty(answerLower, item.summary);
      const relevance = scoreCoverageRelevance(questionTokens, `${item.path}\n${item.summary}`);
      const treePenalty = item.treeJson ? 0.45 : 0;
      const score = (pathNovel ? 1 : 0) + novelty + relevance * 1.25 - treePenalty;
      return { ...item, pathKey, pathNovel, novelty, relevance, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.pathNovel) - Number(a.pathNovel));
  const selected: HelixAskAnswerExtensionItem[] = [];
  const seenPathKeys = new Set<string>();
  let selectedNonTree = 0;
  for (const item of ranked) {
    if (selected.length >= HELIX_ASK_ANSWER_EXTENSION_MAX_ITEMS) break;
    if (item.pathKey && seenPathKeys.has(item.pathKey)) continue;
    if (item.treeJson && selectedNonTree >= 2 && ranked.some((entry) => !entry.treeJson)) {
      continue;
    }
    if (item.pathKey) {
      seenPathKeys.add(item.pathKey);
    }
    if (item.pathNovel || item.novelty >= 0.35 || item.relevance >= 0.34 || selected.length === 0) {
      selected.push({
        kind: item.kind,
        path: item.path,
        summary: item.summary,
        treeJson: item.treeJson,
      });
      if (!item.treeJson) selectedNonTree += 1;
    }
  }
  if (selected.length === 0) {
    return {
      available: false,
      citations: [],
      itemCount: 0,
      docItems: 0,
      codeItems: 0,
    };
  }
  const citations = Array.from(new Set(selected.map((item) => item.path)));
  const extensionLines = ["Additional repo context:"];
  for (const item of selected) {
    extensionLines.push(`- ${ensureSentence(item.summary)} (see ${item.path})`);
  }
  return {
    available: true,
    text: extensionLines.join("\n").trim(),
    citations,
    itemCount: selected.length,
    docItems: selected.filter((item) => item.kind === "doc").length,
    codeItems: selected.filter((item) => item.kind === "code").length,
  };
};

const repairSparseScientificSections = (
  text: string,
  citationPaths: string[],
  fallbackSentences?: string[],
): string => {
  if (!text.trim()) return text;
  const normalized = normalizeScientificSectionLayout(text);
  const citations = citationPaths.filter(Boolean).slice(0, 3);
  const fallback = (fallbackSentences ?? []).filter(Boolean);
  let repaired = normalized;
  if (/Confirmed:\s*\n\s*\nReasoned connections \(bounded\):/i.test(repaired)) {
    const confirmedLine =
      fallback[0] ??
      (citations.length
        ? `- Evidence spans were retrieved from ${citations.join(", ")}.`
        : "- Evidence spans were retrieved from the current repo context.");
    repaired = repaired.replace(
      /Confirmed:\s*\n\s*\nReasoned connections \(bounded\):/i,
      `Confirmed:\n${confirmedLine}\n\nReasoned connections (bounded):`,
    );
  }
  if (/Reasoned connections \(bounded\):\s*\n\s*\nNext evidence:/i.test(repaired)) {
    const boundedLine = fallback.length >= 2
      ? `- ${clipAskText(fallback[0], 220)} ${clipAskText(fallback[1], 220)} Bounded linkage supported by cited evidence.`
      : citations.length >= 2
        ? `- Bounded linkage supported by cited repo evidence (${citations[0]} and ${citations[1]}).`
        : "- Need at least two grounded points before drawing a connection.";
    repaired = repaired.replace(
      /Reasoned connections \(bounded\):\s*\n\s*\nNext evidence:/i,
      `Reasoned connections (bounded):\n${boundedLine}\n\nNext evidence:`,
    );
  }
  return repaired;
};

const extractScientificSectionBody = (text: string, heading: string): string => {
  if (!text.trim()) return "";
  const normalized = normalizeScientificSectionLayout(text);
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const otherHeadings = SCIENTIFIC_SECTION_HEADINGS
    .filter((entry) => entry !== heading)
    .map((entry) => entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const bodyRe = new RegExp(
    `${escapedHeading}\\s*([\\s\\S]*?)(?=\\n{2,}(?:${otherHeadings})|$)`,
    "i",
  );
  const match = normalized.match(bodyRe);
  return (match?.[1] ?? "").trim();
};

const extractSectionBullets = (body: string): string[] =>
  body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);

const isLowSignalScientificBullet = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^\d+[.)]?$/.test(trimmed)) return true;
  if (/^[a-z]\.?$/i.test(trimmed)) return true;
  const alphaChars = trimmed.replace(/[^a-z]/gi, "").length;
  if (alphaChars < 10) return true;
  return false;
};

const hasWeakScientificSections = (text: string): boolean => {
  if (!isScientificMicroReport(text)) return false;
  const confirmedBody = extractScientificSectionBody(text, "Confirmed:");
  const reasonedBody = extractScientificSectionBody(text, "Reasoned connections (bounded):");
  const confirmedRawBullets = extractSectionBullets(confirmedBody);
  const reasonedRawBullets = extractSectionBullets(reasonedBody);
  const confirmedBullets = confirmedRawBullets.filter(
    (entry) => !isLowSignalScientificBullet(entry),
  );
  const reasonedBullets = reasonedRawBullets.filter(
    (entry) => !isLowSignalScientificBullet(entry),
  );
  if (confirmedBullets.length === 0) return true;
  // If most confirmed bullets are numeric/list noise, treat the section as weak.
  if (confirmedRawBullets.length >= 2 && confirmedBullets.length <= 1) return true;
  if (reasonedBullets.length === 0) return true;
  if (reasonedRawBullets.length >= 2 && reasonedBullets.length <= 1) return true;
  return false;
};

const shouldForceScientificFallback = (
  text: string,
  docBlocks: Array<unknown>,
  codeAlignment?: { spans?: Array<unknown> } | null,
): boolean => {
  if (!isScientificMicroReport(text)) return false;
  const confirmedBody = extractScientificSectionBody(text, "Confirmed:");
  const reasonedBody = extractScientificSectionBody(text, "Reasoned connections (bounded):");
  const confirmedBullets = extractSectionBullets(confirmedBody).filter(
    (entry) => !isLowSignalScientificBullet(entry),
  );
  const reasonedBullets = extractSectionBullets(reasonedBody).filter(
    (entry) => !isLowSignalScientificBullet(entry),
  );
  const evidenceCount =
    (docBlocks?.length ?? 0) + (codeAlignment?.spans?.length ?? 0);
  if (evidenceCount <= 0) return false;
  if (confirmedBullets.length < 2) return true;
  if (reasonedBullets.length < 1) return true;
  return false;
};

type HelixAskTreeWalkMetrics = {
  treeCount: number;
  nodeCount: number;
  nodesWithText: number;
  nodesWithoutText: number;
  stepCount: number;
  treeIds: string[];
  primaryTreeId?: string;
  boundCount?: number;
};

type HelixAskTreeWalkMode = "full" | "root_to_anchor" | "root_to_leaf" | "root_only" | "anchor_only";

  const normalizeTreeWalkKey = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  const TREE_TOKEN_STOPWORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "does",
    "for",
    "from",
    "how",
    "in",
    "into",
    "is",
    "it",
    "mean",
    "of",
    "on",
    "or",
    "repo",
    "the",
    "this",
    "to",
    "what",
    "with",
    "within",
  ]);

  const TREE_SHORT_TOKENS = new Set(["ts", "qi", "gr", "ai", "ml", "ui", "ux"]);

  const tokenizeTreeText = (value: string): string[] =>
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => {
        if (!token) return false;
        if (TREE_TOKEN_STOPWORDS.has(token)) return false;
        if (token.length >= 3) return true;
        if (token.length === 2) return TREE_SHORT_TOKENS.has(token);
        return false;
      });

const TREE_DOCS_DIR = "docs/knowledge/trees";
  type DefinitionTreeDocEntry = { key: string; path: string; tokens: string[] };
  let definitionTreeDocCache: DefinitionTreeDocEntry[] | null = null;

const sanitizeTreeDocSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const collectTreeFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const entries: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let children: string[] = [];
    try {
      children = fs.readdirSync(current);
    } catch {
      continue;
    }
    for (const child of children) {
      const full = path.join(current, child);
      let stat: fs.Stats | null = null;
      try {
        stat = fs.statSync(full);
      } catch {
        stat = null;
      }
      if (!stat) continue;
      if (stat.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (child.endsWith("-tree.json")) {
        entries.push(full);
      }
    }
  }
  return entries;
};

  const loadDefinitionTreeDocIndex = (): DefinitionTreeDocEntry[] => {
    if (definitionTreeDocCache) return definitionTreeDocCache;
    const index: DefinitionTreeDocEntry[] = [];
    const treeFiles = collectTreeFiles(path.resolve(process.cwd(), "docs/knowledge"));
  for (const treeFile of treeFiles) {
    let raw = "";
    try {
      raw = fs.readFileSync(treeFile, "utf8");
    } catch {
      continue;
    }
    let parsed:
      | {
          rootId?: string;
          nodes?: Array<{
            id?: string;
            title?: string;
            label?: string;
            tags?: string[];
            aliases?: string[];
          }>;
        }
      | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    if (!parsed) continue;
    const rootId = typeof parsed.rootId === "string" ? parsed.rootId : path.basename(treeFile, ".json");
    const slug = sanitizeTreeDocSlug(rootId || "");
    if (!slug) continue;
    const docPath = path.join(TREE_DOCS_DIR, `${slug}.md`).replace(/\\/g, "/");
    const fullDocPath = path.resolve(process.cwd(), docPath);
    if (!fs.existsSync(fullDocPath)) continue;
      const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      for (const node of nodes) {
        const title = node?.title ?? node?.label ?? node?.id ?? "";
        const id = node?.id ?? "";
        const tags = Array.isArray(node?.tags) ? node.tags : [];
        const aliases = Array.isArray(node?.aliases) ? node.aliases : [];
        if (!title && !id && tags.length === 0 && aliases.length === 0) continue;
        const key = normalizeTreeWalkKey(title || id);
        const tokenSet = new Set<string>();
        [title, id, ...tags, ...aliases]
          .filter(Boolean)
          .forEach((value) => {
            tokenizeTreeText(String(value)).forEach((token) => tokenSet.add(token));
          });
        const tokens = Array.from(tokenSet);
        if (!key && tokens.length === 0) continue;
        index.push({ key, path: docPath, tokens });
      }
    }
    definitionTreeDocCache = index;
    return index;
  };

  const findDefinitionTreeDocPaths = (question: string, limit = 3): string[] => {
    const normalizedQuestion = normalizeTreeWalkKey(question);
    const questionTokens = new Set(tokenizeTreeText(question));
    if (!normalizedQuestion && questionTokens.size === 0) return [];
    const entries = loadDefinitionTreeDocIndex();
    const scores = new Map<string, number>();
    for (const entry of entries) {
      let score = 0;
      if (entry.key && normalizedQuestion && normalizedQuestion.includes(entry.key)) {
        score += 3;
      }
      if (entry.tokens.length && questionTokens.size) {
        let overlap = 0;
        for (const token of entry.tokens) {
          if (questionTokens.has(token)) overlap += 1;
        }
        if (overlap > 0) score += overlap;
      }
      if (score <= 0) continue;
      const current = scores.get(entry.path) ?? 0;
      if (score > current) scores.set(entry.path, score);
    }
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(1, limit))
      .map(([path]) => path);
  };

  const findDefinitionTreeDocPathsForPack = (
    graphPack?: HelixAskGraphPack | null,
    limit = 3,
  ): string[] => {
    if (!graphPack?.frameworks?.length) return [];
    const paths: string[] = [];
    const seen = new Set<string>();
    const resolveDocPath = (candidate: string): string | null => {
      const slug = sanitizeTreeDocSlug(candidate);
      if (!slug) return null;
      const docPath = path.join(TREE_DOCS_DIR, `${slug}.md`).replace(/\\/g, "/");
      const fullDocPath = path.resolve(process.cwd(), docPath);
      return fs.existsSync(fullDocPath) ? docPath : null;
    };
    const pushCandidate = (candidate: string) => {
      if (!candidate) return;
      const docPath = resolveDocPath(candidate);
      if (!docPath || seen.has(docPath)) return;
      seen.add(docPath);
      paths.push(docPath);
    };
    for (const framework of graphPack.frameworks) {
      const treeId = framework.treeId || framework.rootId || "";
      const fallbackId = framework.sourcePath
        ? path.basename(framework.sourcePath, ".json")
        : "";
      const candidates = [treeId, fallbackId].filter(Boolean);
      for (const candidate of candidates) {
        pushCandidate(candidate);
        if (!candidate.endsWith("-tree")) {
          pushCandidate(`${candidate}-tree`);
        } else {
          pushCandidate(candidate.replace(/-tree$/, ""));
        }
        if (paths.length >= limit) break;
      }
      if (paths.length >= limit) break;
    }
    return paths;
  };

const resolveHelixAskTreeWalkMode = (
  raw: string,
  verbosity: HelixAskVerbosity,
): HelixAskTreeWalkMode => {
  const normalized = raw.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "auto") {
    return verbosity === "brief" ? "root_to_anchor" : "full";
  }
  if (normalized === "root" || normalized === "root_only") return "root_only";
  if (normalized === "anchor" || normalized === "anchor_only") return "anchor_only";
  if (normalized === "root_to_anchor" || normalized === "root2anchor") return "root_to_anchor";
  if (normalized === "root_to_leaf" || normalized === "root2leaf") return "root_to_leaf";
  return "full";
};

const buildTreeWalkBindingSet = (
  pack: HelixAskGraphPack | null,
  docBlocks: Array<{ path: string; block: string }>,
): Set<string> => {
  const bound = new Set<string>();
  if (!pack?.frameworks?.length || docBlocks.length === 0) return bound;
  const docText = docBlocks.map((block) => block.block.toLowerCase()).join("\n");
  const headerTerms = new Set<string>();
  const pathTerms = new Set<string>();
  for (const block of docBlocks) {
    const header = extractDocBlockHeader(block);
    if (header) headerTerms.add(normalizeTreeWalkKey(header));
    const fileStem = path.basename(block.path, path.extname(block.path));
    if (fileStem) pathTerms.add(normalizeTreeWalkKey(fileStem));
  }
  for (const framework of pack.frameworks) {
    for (const node of framework.path ?? []) {
      const title = node.title ?? "";
      const id = node.id ?? "";
      const titleKey = normalizeTreeWalkKey(title);
      const idKey = normalizeTreeWalkKey(id);
      const titleHit =
        (title && docText.includes(title.toLowerCase())) ||
        (titleKey && (headerTerms.has(titleKey) || pathTerms.has(titleKey)));
      const idHit =
        (id && docText.includes(id.toLowerCase())) ||
        (idKey && (headerTerms.has(idKey) || pathTerms.has(idKey)));
      if (titleHit || idHit) {
        if (id) bound.add(id);
        if (titleKey) bound.add(titleKey);
        if (idKey) bound.add(idKey);
      }
    }
  }
  return bound;
};

function buildHelixAskTreeWalk(
  pack: HelixAskGraphPack | null,
  options: { mode: HelixAskTreeWalkMode; maxSteps: number; boundNodes?: Set<string> },
): { text: string; metrics: HelixAskTreeWalkMetrics | null } {
  if (!pack?.frameworks?.length) {
    return { text: "", metrics: null };
  }
  const lines: string[] = [];
  let nodeCount = 0;
  let nodesWithText = 0;
  let nodesWithoutText = 0;
  let boundCount = 0;
  const stepCap = options.maxSteps > 0 ? options.maxSteps : null;
  for (const framework of pack.frameworks) {
    const label = framework.treeLabel ?? framework.treeId;
    const header = `Tree Walk: ${label} (tree-derived; source: ${framework.sourcePath})`;
    lines.push(header);
    const pathModeLabel = framework.pathMode ?? "full";
    const fallback = framework.pathFallbackReason
      ? ` | continuity: fallback ${framework.pathFallbackReason}`
      : "";
    lines.push(`Chain scaffold: ${pathModeLabel}${fallback}`);
    const anchorIds = new Set(framework.anchors.map((node) => node.id));
    const path = framework.path ?? [];
    if (!path.length) {
      lines.push("1. Walk: (no nodes resolved) - no tree path available.");
      lines.push("");
      continue;
    }
    const rootIndexFromId = framework.rootId
      ? path.findIndex((node) => node.id === framework.rootId)
      : -1;
    const minDepth = path.reduce(
      (min, node) => Math.min(min, node.depth ?? 0),
      Number.POSITIVE_INFINITY,
    );
    const rootIndexFromDepth = path.findIndex((node) => (node.depth ?? 0) === minDepth);
    const rootIndex =
      rootIndexFromId >= 0
        ? rootIndexFromId
        : rootIndexFromDepth >= 0
          ? rootIndexFromDepth
          : 0;
    const anchorIndex = path.findIndex(
      (node, idx) => idx >= rootIndex && anchorIds.has(node.id),
    );
    let selected = path.slice();
    switch (options.mode) {
      case "anchor_only":
        selected = path.filter((node) => anchorIds.has(node.id));
        break;
      case "root_only":
        selected = [path[rootIndex] ?? path[0]];
        break;
      case "root_to_anchor":
        if (anchorIndex >= 0) {
          selected = path.slice(rootIndex, anchorIndex + 1);
        }
        break;
      case "root_to_leaf":
        selected = path.slice(rootIndex);
        break;
      case "full":
      default:
        selected = path.slice();
        break;
    }
    if (selected.length === 0) {
      selected = path.slice();
    }
    if (stepCap && selected.length > stepCap) {
      selected = selected.slice(0, stepCap);
    }
    selected.forEach((node, idx) => {
      nodeCount += 1;
      const title = node.title ?? node.id;
      const normalizedTitle = normalizeTreeWalkKey(title);
      const bound =
        !options.boundNodes ||
        options.boundNodes.has(node.id) ||
        options.boundNodes.has(normalizedTitle);
      if (bound) boundCount += 1;
      const roleLabel = node.role
        ? `Role:${node.role}`
        : anchorIds.has(node.id)
          ? "Anchor"
          : "Walk";
      const role = bound ? roleLabel : "Hint";
      const idSuffix =
        node.id && normalizeTreeWalkKey(title) !== normalizeTreeWalkKey(node.id)
          ? ` (${node.id})`
          : "";
      let detail = node.excerpt?.trim() ?? "";
      if (!detail && node.artifact) {
        detail = `Minimal artifact: ${node.artifact.trim()}`;
      }
      if (detail) {
        nodesWithText += 1;
        detail = ensureSentence(clipAskText(detail, 200));
      } else {
        nodesWithoutText += 1;
        detail = "No detail provided in the tree node.";
      }
      if (!bound) {
        detail = "Navigation hint only; no doc span bound.";
      }
      lines.push(
        `${idx + 1}. ${role}: ${title}${idSuffix} - ${detail} (${framework.sourcePath})`,
      );
    });
    lines.push("");
  }
  const trimmed = lines.join("\n").trim();
  const metrics: HelixAskTreeWalkMetrics = {
    treeCount: pack.frameworks.length,
    nodeCount,
    nodesWithText,
    nodesWithoutText,
    stepCount: nodeCount,
    treeIds: pack.treeIds,
    primaryTreeId: pack.primaryTreeId,
    boundCount,
  };
  return { text: trimmed, metrics };
}

function ensureTreeWalkInAnswer(
  answerText: string,
  treeWalkBlock: string,
): { text: string; injected: boolean } {
  const trimmedWalk = treeWalkBlock.trim();
  if (!trimmedWalk) return { text: answerText, injected: false };
  const current = answerText ?? "";
  const hasTreeWalk =
    /(^|\n)\s*Tree Walk:/i.test(current) ||
    current.includes(trimmedWalk.split(/\r?\n/)[0] ?? "");
  if (hasTreeWalk) return { text: current, injected: false };
  const base = current.trim();
  if (!base) return { text: trimmedWalk, injected: true };
  return { text: `${base}\n\n${trimmedWalk}`, injected: true };
}

function appendContextBlock(contextText: string, block: string): string {
  const trimmedBlock = block?.trim() ?? "";
  if (!trimmedBlock) return contextText;
  const trimmedContext = contextText?.trim() ?? "";
  if (!trimmedContext) return trimmedBlock;
  if (trimmedContext.includes(trimmedBlock)) return contextText;
  return `${trimmedContext}\n\n${trimmedBlock}`;
}

function mergeEvidenceScaffolds(base: string, extra: string): string {
  const baseTrimmed = base?.trim() ?? "";
  const extraTrimmed = extra?.trim() ?? "";
  if (!extraTrimmed) return baseTrimmed;
  if (!baseTrimmed) return extraTrimmed;
  const baseLines = baseTrimmed.split(/\r?\n/);
  const existing = new Set(baseLines.map((line) => line.trim().toLowerCase()).filter(Boolean));
  const extraLines = extraTrimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !existing.has(line.toLowerCase()));
  if (extraLines.length === 0) return baseTrimmed;
  return `${baseTrimmed}\n${extraLines.join("\n")}`;
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
  const definitionFocus = isDefinitionQuestion(question);
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
    const count = composite ? "4-6" : definitionFocus ? "8-12" : "6-9";
    lines.push(`Return ${count} short evidence bullets grounded in the context.`);
    lines.push("Each bullet should be 1-2 sentences and cite at least one file path or prompt chunk id from the context.");
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    if (composite) {
      lines.push("Prefer evidence from domain docs (ethos/knowledge) and core GR viability files over UI or prompt infrastructure.");
      lines.push("Do not mention 'anchors' or list files without tying them to the question.");
    }
    if (definitionFocus) {
      lines.push("Include at least one bullet that directly defines the term using a docs/*.md source (not *-tree.json).");
      lines.push("If a context block includes Section/Span lines, preserve them verbatim in that definition bullet.");
      lines.push("Treat graph/tree JSON as derivation hints only; bind them to .md docs before citing.");
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

function buildHelixAskIdeologySynthesisPrompt(
  question: string,
  scaffold: string,
  format: HelixAskFormat,
  stageTags: boolean,
  verbosity: HelixAskVerbosity,
  toolResultsBlock?: string,
  softExpansionSentences = 0,
  conceptMatch?: HelixAskConceptMatch | null,
): string {
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const lines = [
    "You are Helix Ask, a civic policy explainer grounded in repository evidence.",
    "Start with a plain-language civic opening before technical details.",
  ];
  const scenarioHint = extractIdeologyScenarioSeed(question);
  const twoParagraphContract = hasTwoParagraphContract(question);
  const hasCodeSpans = toolResultsHas(toolResultsBlock, "code_spans");
  const conversationSeed = buildIdeologyConversationSeed(conceptMatch ?? null);
  const introSentenceBudget =
    verbosity === "brief" ? "2-3" : verbosity === "normal" ? "3-4" : "4-6";
  const mechanismSentenceBudget =
    verbosity === "brief" ? "2-4" : verbosity === "normal" ? "3-5" : "4-6";
  const effectSentenceBudget =
    verbosity === "brief" ? "2-3" : verbosity === "normal" ? "2-4" : "2-4";
  if (conversationSeed) {
    lines.push(
      "Use this as a loose anchor, then adapt it to the exact user question.",
    );
    lines.push(`"${conversationSeed}"`);
  }
  if (format === "steps") {
    lines.push("Use only the evidence steps below. Do not add steps not in evidence.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the evidence steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `Start directly with a numbered list using "1." style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(
      `Each step should be ${spec.steps.sentences} sentences and cite file paths or gate/certificate ids from evidence steps.`,
    );
    if (!twoParagraphContract) {
      lines.push(
        `After the steps, add a short paragraph starting with "In practice," (${spec.steps.inPractice} sentences).`,
      );
    }
    lines.push("Evidence steps:");
  } else {
    lines.push(
      "Answer in conversational civic paragraphs, not a checklist. Do not use numbered steps.",
    );
    if (twoParagraphContract) {
      lines.push("Use exactly two paragraphs.");
      lines.push(
        `Paragraph 1: open with a plain-language civic summary (${introSentenceBudget} sentences).`,
      );
      lines.push(
      `Paragraph 2: explain mechanism plus social effect in accessible terms (${effectSentenceBudget} sentences).`,
    );
    } else {
      lines.push("Use 3-4 paragraphs.");
      lines.push(
        `Paragraph 1: open with a plain-language civic summary (${introSentenceBudget} sentences).`,
      );
      lines.push(
        `Paragraph 2: explain governance mechanism with concrete process detail and why it is needed (${mechanismSentenceBudget} sentences).`,
      );
      lines.push(
        `Paragraph 3: connect to social effects, trust, and stability (${effectSentenceBudget} sentences).`,
      );
      lines.push(
        `If the question includes a scenario, add a final short paragraph that applies the concept to it (${mechanismSentenceBudget} sentences, concise).`,
      );
    }
    lines.push(
      scenarioHint
        ? `Include one concrete example sentence that mirrors the scenario: "${scenarioHint}".`
        : "If a scenario is present in the question, include one concrete example sentence.",
    );
    lines.push(
      "After the narrative paragraphs, include a short appendix headed 'Technical notes:' with only evidence-grounded bullets.",
    );
    if (!twoParagraphContract) {
      lines.push(
        'Optionally end with "In practice," and one-to-two practical takeaways.',
      );
    }
    if (toolResultsBlock?.trim()) {
      lines.push("Tool results are authoritative. Use them as ground truth.");
      lines.push("If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.");
      if (!hasCodeSpans) {
        lines.push(
          "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
        );
      }
      lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
      lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
      lines.push(toolResultsBlock.trim());
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
  lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
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

function buildHelixAskSynthesisPrompt(
  question: string,
  scaffold: string,
  format: HelixAskFormat,
  stageTags: boolean,
  verbosity: HelixAskVerbosity,
  toolResultsBlock?: string,
  softExpansionSentences = 0,
): string {
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  const hasCodeSpans = toolResultsHas(toolResultsBlock, "code_spans");
  if (format === "steps") {
    lines.push("Use only the evidence steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the evidence steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(
      `Each step should be ${spec.steps.sentences} sentences and cite file paths or gate/certificate ids from the evidence steps.`,
    );
    if (!twoParagraphContract) {
      lines.push(
        `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
      );
    }
    lines.push(
      "If the evidence includes a block starting with \"Tree Walk:\", include that block verbatim after the steps (keep its numbering and header).",
    );
    if (toolResultsBlock?.trim()) {
      lines.push("Tool results are authoritative. Use them as ground truth.");
      lines.push(
        "If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.",
      );
      if (!hasCodeSpans) {
        lines.push(
          "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
        );
      }
      lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
      lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
      lines.push(toolResultsBlock.trim());
    }
    lines.push("Evidence steps:");
  } else {
    lines.push("Use only the evidence bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? `Answer in two ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`
        : `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `If the question is comparative, include a short bullet list (${spec.compareBullets} items) of concrete differences grounded in repo details.`,
    );
    lines.push(
      "If the evidence includes a block starting with \"Tree Walk:\", include that block verbatim after the first paragraph (keep its numbering and header).",
    );
    lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    if (!twoParagraphContract) {
      lines.push(
        `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
      );
    }
    if (toolResultsBlock?.trim()) {
      lines.push("Tool results are authoritative. Use them as ground truth.");
      lines.push(
        "If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.",
      );
      if (!hasCodeSpans) {
        lines.push(
          "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
        );
      }
      lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
      lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
      lines.push(toolResultsBlock.trim());
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
  verbosity: HelixAskVerbosity,
  toolResultsBlock?: string,
  softExpansionSentences = 0,
): string {
  const lines = [
    "You are Helix Ask, a grounded assistant.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  const hasCodeSpans = toolResultsHas(toolResultsBlock, "code_spans");
  if (format === "steps") {
    lines.push("Use only the evidence steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the evidence steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(
      `Each step should be ${spec.steps.sentences} sentences and cite file paths or prompt chunk ids from the evidence steps.`,
    );
    if (!twoParagraphContract) {
      lines.push(
        `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
      );
    }
    if (toolResultsBlock?.trim()) {
      lines.push("Tool results are authoritative. Use them as ground truth.");
      lines.push(
        "If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.",
      );
      if (!hasCodeSpans) {
        lines.push(
          "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
        );
      }
      lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
      lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
      lines.push(toolResultsBlock.trim());
    }
    lines.push("Evidence steps:");
  } else {
    lines.push("Use only the evidence bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? `Answer in two ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`
        : `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `If the question is comparative, include a short bullet list (${spec.compareBullets} items) of concrete differences.`,
    );
    if (!twoParagraphContract) {
      lines.push(
        `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
      );
    }
    if (toolResultsBlock?.trim()) {
      lines.push("Tool results are authoritative. Use them as ground truth.");
      lines.push(
        "If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.",
      );
      if (!hasCodeSpans) {
        lines.push(
          "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
        );
      }
      lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
      lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
      lines.push(toolResultsBlock.trim());
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
  verbosity: HelixAskVerbosity,
  constraintEvidence?: string,
  composite = false,
  toolResultsBlock?: string,
): string {
  const lines = [
    "You are Helix Ask, a hybrid assistant.",
    "Use only the general reasoning and repo evidence below. Do not invent citations.",
  ];
  const twoParagraphContract = hasTwoParagraphContract(question);
  const hasConstraintEvidence = Boolean(constraintEvidence?.trim());
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  const hasCodeSpans = toolResultsHas(toolResultsBlock, "code_spans");
  if (format === "steps") {
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
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
      lines.push(
        `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
      );
    }
    lines.push(
      "If the repo evidence includes a block starting with \"Tree Walk:\", include that block verbatim after the steps (keep its numbering and header).",
    );
  } else {
    lines.push(
      twoParagraphContract
        ? `Write two ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each.`
        : `Write two ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each.`,
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
      lines.push(
        `If the question is comparative, include a short bullet list (${spec.compareBullets} items) after paragraph 2.`,
      );
    }
    if (composite) {
      lines.push(
        "Do not mention UI components or Helix Ask implementation details unless the question explicitly asks about the UI.",
      );
      lines.push("Do not start any sentence with a file path; place citations in parentheses at the end.");
      lines.push("Avoid listing file names without explaining their role.");
      lines.push("Do not mention evidence bullets, anchors, or the prompt structure.");
    }
    lines.push(
      "If the repo evidence includes a block starting with \"Tree Walk:\", include that block verbatim after paragraph 1 (keep its numbering and header).",
    );
    if (!twoParagraphContract) {
      lines.push(
        `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
      );
    }
  }
  lines.push("Avoid repetition; do not repeat any sentence or paragraph.");
  lines.push(`Respond with only the answer between ${HELIX_ASK_ANSWER_START} and ${HELIX_ASK_ANSWER_END}.`);
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  if (toolResultsBlock?.trim()) {
    lines.push("Tool results are authoritative. Use them as ground truth.");
    lines.push(
      "If TOOL_RESULTS include doc_spans or code_spans, do not claim evidence is missing.",
    );
    if (!hasCodeSpans) {
      lines.push(
        "Do not mention code, functions, components, tests, UI, or implementation details unless code_spans are provided.",
      );
    }
    lines.push("Use tree_walk as the continuity scaffold for the argument chain.");
    lines.push("Preserve the walk order as a root-to-leaf evidence thread when organizing the narrative.");
    lines.push(toolResultsBlock.trim());
    lines.push("");
  }
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
  verbosity: HelixAskVerbosity,
): string {
  const lines = ["You are Helix Ask."];
  const twoParagraphContract = hasTwoParagraphContract(question);
  const spec = resolveHelixAskVerbositySpec(verbosity);
  const paragraphDescriptor = verbosity === "brief" ? "short " : "";
  if (format === "steps") {
    lines.push("Use only the reasoning steps below. Do not add new steps.");
    if (stageTags) {
      lines.push("Preserve any stage tags present in the steps.");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(`Each step should be ${spec.steps.sentences} sentences.`);
    if (!twoParagraphContract) {
      lines.push(
        `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
      );
    }
    lines.push("Reasoning steps:");
  } else {
    lines.push("Use only the reasoning bullets below. Do not add new claims.");
    lines.push(
      twoParagraphContract
        ? `Answer in two ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`
        : `Answer in ${spec.paragraphs.count} ${paragraphDescriptor}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `If the question is comparative, include a short bullet list (${spec.compareBullets} items) of concrete differences.`,
    );
    if (!twoParagraphContract) {
      lines.push(
        `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
      );
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
  verbosity: HelixAskVerbosity,
): string {
  const lines = [
    "You are Helix Ask, a constraint-grounded assistant.",
    "Use only the evidence below. Do not speculate beyond the gate or certificate data.",
    "Cite gate ids (gate:...) or certificate ids (certificate:...) when referencing residuals or viability.",
  ];
  const spec = resolveHelixAskVerbositySpec(verbosity);
  if (format === "steps") {
    lines.push(
      `Start directly with a numbered list using \`1.\` style; use ${spec.steps.count} steps and no preamble.`,
    );
    lines.push(
      `Each step should be ${spec.steps.sentences} sentences and cite the relevant gate or certificate.`,
    );
    if (stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    }
    lines.push(
      `After the steps, add a paragraph starting with \"In practice,\" (${spec.steps.inPractice} sentences).`,
    );
  } else {
    lines.push(
      `Answer in ${spec.paragraphs.count} ${verbosity === "brief" ? "short " : ""}paragraphs with ${spec.paragraphs.sentences} sentences each; do not use numbered steps.`,
    );
    lines.push(
      `End with a paragraph starting with \"In practice,\" (${spec.paragraphs.inPractice} sentences).`,
    );
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

const buildConceptEvidencePaths = (match: HelixAskConceptMatch): string[] => {
  const paths = new Set<string>();
  if (match.card.sourcePath) {
    paths.add(match.card.sourcePath);
  }
  for (const entry of match.card.mustIncludeFiles ?? []) {
    if (entry) {
      paths.add(entry);
    }
  }
  return Array.from(paths);
};
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
    "Return strict JSON only. Do NOT include markdown or commentary.",
    'Schema: {"text":"<revised answer>","sources":["<citation-id>"]}.',
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
  lines.push("If citations cannot be added, return the original answer text and an empty sources array.");
  lines.push("");
  lines.push("Evidence:");
  lines.push(evidence || "No evidence available.");
  lines.push("");
  lines.push("Answer:");
  lines.push(answer);
  return lines.join("\n");
}

const HELIX_ASK_CITATION_REPAIR_SCHEMA = z
  .object({
    text: z.string().min(1),
    sources: z.array(z.string()).optional(),
    citations: z.array(z.string()).optional(),
  })
  .strict();

type HelixAskCitationRepairPayload = z.infer<typeof HELIX_ASK_CITATION_REPAIR_SCHEMA>;

function buildHelixAskDriftRepairPrompt(
  question: string,
  answer: string,
  evidence: string,
  format: HelixAskFormat,
  stageTags: boolean,
): string {
  const lines = [
    "You are Helix Ask evidence aligner.",
    "Rewrite the answer to only include claims supported by the evidence list.",
    "Remove or rewrite any unsupported sentences. Do not add new facts.",
    "If evidence is insufficient, say so and ask for the relevant files (one short sentence).",
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

const HelixAskGraphLockRequest = z.object({
  sessionId: z.string().min(1),
  treeIds: z.array(z.string().min(1)).optional(),
  mode: z.enum(["replace", "merge", "clear"]).optional(),
});

const normalizeGraphLockSessionId = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

  const LocalAskRequest = z
  .object({
    prompt: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    debug: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    verbosity: z.enum(["brief", "normal", "extended"]).optional(),
    searchQuery: z.string().optional(),
    coverageSlots: z.array(z.string().min(1)).max(12).optional(),
    topK: z.coerce.number().int().min(1).max(48).optional(),
    context: z.string().optional(),
    contextFiles: z.array(z.string().min(1)).max(48).optional(),
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

function parseCitationRepairPayload(raw: string): HelixAskCitationRepairPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = HELIX_ASK_CITATION_REPAIR_SCHEMA.safeParse(JSON.parse(jsonCandidate));
    if (parsed.success) return parsed.data;
  } catch {
    return null;
  }
  return null;
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

const OVERFLOW_CONTEXT_MARKERS = new Set([
  "context:",
  "prompt context:",
  "evidence:",
  "evidence bullets:",
  "evidence steps:",
  "repo evidence:",
  "general reasoning:",
  "constraint evidence:",
  "technical notes:",
  "tree walk:",
]);
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
  "connect",
  "connection",
  "connections",
  "relate",
  "relation",
  "relations",
  "related",
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

const stripEdgePunctuation = (value: string): string =>
  value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");

const stripLeadingArticles = (value: string): string =>
  value.replace(/^(?:a|an|the)\s+/i, "");

const extractClarifySpan = (question: string): string | undefined => {
  const match = question.match(
    /\b(?:what\s+is|what's|whats|define|explain|describe|meaning\s+of)\b\s+(.+)$/i,
  );
  if (!match) return undefined;
  let span = match[1].trim();
  span = span.replace(/[?!.]+$/g, "").trim();
  span = stripLeadingArticles(span);
  return span || undefined;
};

const normalizeClarifyToken = (value: string): string | undefined => {
  const trimmed = stripEdgePunctuation(value.toLowerCase());
  if (!trimmed) return undefined;
  if (AMBIGUOUS_IGNORE_TOKENS.has(trimmed)) return undefined;
  if (trimmed.length < HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN) return undefined;
  return trimmed;
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
    const normalized = stripEdgePunctuation(token.toLowerCase());
    if (!normalized) continue;
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

const filterClarifySlots = (slots: string[]): string[] =>
  slots
    .map((slot) => normalizeSlotName(slot))
    .filter(Boolean)
    .filter((slot) => !STRUCTURAL_SLOTS.has(slot))
    .filter((slot) => !SLOT_IGNORE_TOKENS.has(slot));

const buildSlotClarifyOptions = (
  slotId: string,
  slotPlan?: HelixAskSlotPlan | null,
): string[] => {
  const slot = slotPlan?.slots.find((entry) => entry.id === slotId);
  const label = slot?.label ?? slotId;
  const candidates = listConceptCandidates(label, 3);
  const options = candidates.map(formatAmbiguityCandidateLabel).filter(Boolean);
  if (options.length === 0) {
    (slot?.aliases ?? []).forEach((alias) => alias && options.push(alias));
  }
  const unique = Array.from(new Set(options.map((entry) => entry.trim()).filter(Boolean)));
  return unique.slice(0, 2);
};

const buildSlotClarifyLine = (args: {
  missingSlots: string[];
  slotPlan?: HelixAskSlotPlan | null;
  planClarify?: string;
}): string => {
  const planClarify = (args.planClarify ?? "").trim();
  if (planClarify && /(file|doc|module|path|repo|codebase|where)/i.test(planClarify)) {
    return planClarify;
  }
  const slots = filterClarifySlots(args.missingSlots);
  if (!slots.length) {
    return "Repo evidence was required by the question but could not be confirmed. Please point to the relevant files or clarify the term.";
  }
  const primary = slots[0];
  const label = args.slotPlan?.slots.find((entry) => entry.id === primary)?.label ?? primary;
  const options = buildSlotClarifyOptions(primary, args.slotPlan);
  if (options.length >= 2) {
    return `I could not confirm "${label}" yet. Do you mean "${options[0]}" or "${options[1]}", or can you point to the relevant files?`;
  }
  if (options.length === 1) {
    return `I could not confirm "${label}" yet. Do you mean "${options[0]}", or can you point to the relevant files?`;
  }
  if (slots.length > 1) {
    return `I could not confirm "${label}" (and ${slots.slice(1, 3).join(", ")}). Please point to the relevant files or clarify the terms.`;
  }
  return `I could not confirm "${label}" yet. Please point to the relevant files or clarify the term.`;
};

const SCIENTIFIC_REPORT_HEAD_RE =
  /^(Confirmed:|Reasoned connections|Hypotheses \(optional\)|Next evidence:)/im;

const isScientificMicroReport = (text: string): boolean =>
  Boolean(text && SCIENTIFIC_REPORT_HEAD_RE.test(text));

const extractNextEvidenceLines = (text: string): string[] => {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^Next evidence:/i.test(line.trim()));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (out.length > 0) break;
      continue;
    }
    if (/^[A-Za-z ].+:\s*$/.test(trimmed) && !/^[-*]\s+/.test(trimmed)) {
      break;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      out.push(trimmed.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    if (out.length > 0) break;
  }
  return out;
};

const buildSlotSurfaceHints = (surfaces?: string[]): string[] => {
  if (!surfaces?.length) return [];
  const set = new Set(surfaces.map((entry) => entry.trim().toLowerCase()).filter(Boolean));
  const hints: string[] = [];
  if (set.has("ethos")) hints.push("docs/ethos");
  if (set.has("knowledge")) hints.push("docs/knowledge");
  if (set.has("docs")) hints.push("docs/");
  if (set.has("code")) hints.push("server/ or client/ or modules/");
  return hints;
};

const buildNextEvidenceHints = (args: {
  question: string;
  missingSlots?: string[];
  slotPlan?: HelixAskSlotPlan | null;
  anchorFiles?: string[];
  searchedTerms?: string[];
  searchedFiles?: string[];
  includeSearchSummary?: boolean;
  planClarify?: string;
  headingSeedSlots?: HelixAskSlotPlanEntry[];
  suppressClarify?: boolean;
  limit?: number;
}): string[] => {
  const limit = Math.max(
    1,
    (args.limit ?? 4) + (args.includeSearchSummary ? 2 : 0),
  );
  const hints: string[] = [];
  const seen = new Set<string>();
  const pushHint = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    hints.push(trimmed);
  };
  const planClarify = (args.planClarify ?? "").trim();
  if (!args.suppressClarify && planClarify && /(file|doc|module|path|repo|codebase|where)/i.test(planClarify)) {
    pushHint(`Clarify: ${planClarify}`);
  }
  if (args.includeSearchSummary) {
    const terms = (args.searchedTerms ?? [])
      .map((entry) => entry.trim())
      .filter((entry) => entry && !entry.includes("/") && entry.length <= 60)
      .slice(0, 4);
    if (terms.length > 0) {
      pushHint(`Searched terms: ${terms.join(", ")}`);
    }
    const files = (args.searchedFiles ?? [])
      .map((entry) => entry.trim())
      .filter((entry) => entry && entry.length <= 120)
      .slice(0, 4);
    if (files.length > 0) {
      pushHint(`Checked files: ${files.join(", ")}`);
    }
  }
  const dirHints = Array.from(
    new Set(
      (args.anchorFiles ?? [])
        .map((filePath) => filePath.split("/")[0])
        .filter((segment) => Boolean(segment)),
    ),
  ).slice(0, 2);
  if (dirHints.length > 0) {
    pushHint(`Check files under ${dirHints.join(" or ")}.`);
  }
  const slots = filterClarifySlots(args.missingSlots ?? []);
  for (const slotId of slots) {
    const slotEntry = args.slotPlan?.slots.find(
      (entry) => entry.id === slotId || normalizeSlotId(entry.label) === slotId,
    );
    const label = slotEntry?.label ?? slotId;
    const conceptCard =
      resolveConceptCardForSlot(slotId) ??
      (slotEntry?.label ? resolveConceptCardForSlot(slotEntry.label) : null);
    if (conceptCard?.sourcePath) {
      pushHint(`Check ${conceptCard.sourcePath} for "${label}".`);
    } else if (conceptCard?.mustIncludeFiles?.length) {
      conceptCard.mustIncludeFiles.forEach((filePath) =>
        pushHint(`Check ${filePath} for "${label}".`),
      );
    } else {
      const surfaceHints = buildSlotSurfaceHints(slotEntry?.surfaces);
      if (surfaceHints.length > 0) {
        pushHint(`Search ${surfaceHints.join(" or ")} for "${label}".`);
      } else {
        pushHint(`Search docs headings for "${label}".`);
      }
    }
    if (hints.length >= limit) break;
  }
  if (hints.length < limit) {
    const headingSeeds =
      args.headingSeedSlots && args.headingSeedSlots.length > 0
        ? args.headingSeedSlots
        : buildDocHeadingSeedSlots(args.question);
    for (const seed of headingSeeds) {
      if (!seed.label) continue;
      pushHint(`Search docs headings for "${seed.label}".`);
      if (hints.length >= limit) break;
    }
  }
  return hints.slice(0, limit);
};

const buildScientificMicroReport = (args: {
  question: string;
  claimLedger?: HelixAskClaimLedgerEntry[];
  uncertaintyRegister?: HelixAskUncertaintyEntry[];
  missingSlots?: string[];
  slotPlan?: HelixAskSlotPlan | null;
  anchorFiles?: string[];
  searchedTerms?: string[];
  searchedFiles?: string[];
  includeSearchSummary?: boolean;
  planClarify?: string;
  headingSeedSlots?: HelixAskSlotPlanEntry[];
  hypothesisEnabled?: boolean;
  hypothesisStyle?: "conservative" | "exploratory";
  requiresRepoEvidence?: boolean;
}): {
  text: string;
  nextEvidence: string[];
  confirmedCount: number;
  hypothesisCount: number;
} => {
  const supportedClaims =
    args.claimLedger?.filter((entry) => entry.supported && entry.type !== "question") ?? [];
  const confirmedItems = supportedClaims.map((entry) => ensureSentence(entry.text)).slice(0, 3);
  const lines: string[] = [];
  lines.push("Confirmed:");
  if (confirmedItems.length > 0) {
    confirmedItems.forEach((item) => lines.push(`- ${item}`));
  } else {
    lines.push(
      `- ${
        args.requiresRepoEvidence
          ? "No repo-evidenced claims were confirmed yet."
          : "No confirmed evidence was found yet."
      }`,
    );
  }
  lines.push("");
  lines.push("Reasoned connections (bounded):");
  if (supportedClaims.length >= 2) {
    const first = supportedClaims[0];
    const second = supportedClaims[1];
    const firstRef = first.evidenceRefs[0] ? `see ${first.evidenceRefs[0]}` : "see cited evidence";
    const secondRef = second.evidenceRefs[0] ? `see ${second.evidenceRefs[0]}` : "see cited evidence";
    const firstText = clipAskText(first.text, 160);
    const secondText = clipAskText(second.text, 160);
    lines.push(
      `- ${firstText} (${firstRef}). ${secondText} (${secondRef}). Bounded linkage supported by cited evidence.`,
    );
  } else {
    lines.push("- Need at least two grounded points before drawing a connection.");
  }
  const hypothesisEnabled = args.hypothesisEnabled ?? false;
  let hypothesisItems: string[] = [];
  if (hypothesisEnabled && HELIX_ASK_SCIENTIFIC_MAX_HYPOTHESES > 0) {
    const rawCandidates =
      args.claimLedger?.filter((entry) => !entry.supported && entry.type !== "question") ?? [];
    const filtered =
      (args.hypothesisStyle ?? "conservative") === "exploratory"
        ? rawCandidates
        : rawCandidates.filter(
            (entry) => entry.type === "hypothesis" || entry.type === "assumption",
          );
    hypothesisItems = filtered
      .map((entry) => ensureSentence(entry.text))
      .filter(Boolean)
      .slice(0, HELIX_ASK_SCIENTIFIC_MAX_HYPOTHESES);
  }
  if (hypothesisEnabled) {
    lines.push("");
    lines.push("Hypotheses (optional):");
    if (hypothesisItems.length > 0) {
      hypothesisItems.forEach((item) => lines.push(`- ${item}`));
    } else {
      lines.push("- None without additional evidence.");
    }
  }
  const nextEvidence = buildNextEvidenceHints({
    question: args.question,
    missingSlots: args.missingSlots,
    slotPlan: args.slotPlan,
    anchorFiles: args.anchorFiles,
    searchedTerms: args.searchedTerms,
    searchedFiles: args.searchedFiles,
    includeSearchSummary: args.includeSearchSummary,
    planClarify: args.planClarify,
    headingSeedSlots: args.headingSeedSlots,
    limit: 4,
  });
  lines.push("");
  lines.push("Next evidence:");
  if (nextEvidence.length > 0) {
    nextEvidence.forEach((item) => lines.push(`- ${item}`));
  } else {
    lines.push("- Provide the file path or doc section that defines the missing terms.");
  }
  return {
    text: lines.join("\n").trim(),
    nextEvidence,
    confirmedCount: confirmedItems.length,
    hypothesisCount: hypothesisItems.length,
  };
};

const resolveClusterKey = (filePath: string): string => {
  const normalized = normalizeEvidencePath(filePath) ?? filePath;
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) return "unknown";
  const root = parts[0];
  if (root === "docs" && parts[1]) return `docs/${parts[1]}`;
  if (root === "modules" && parts[1]) return `modules/${parts[1]}`;
  if (root === "client" && parts[1]) return `client/${parts[1]}`;
  if (root === "server" && parts[1]) return `server/${parts[1]}`;
  if (root === "shared" && parts[1]) return `shared/${parts[1]}`;
  if (root === "tests") return "tests";
  if (root === "scripts") return "scripts";
  return parts.slice(0, Math.min(2, parts.length)).join("/");
};

const formatClusterLabel = (key: string): string => key.replace(/_/g, " ");

const computeClusterEntropy = (clusters: AmbiguityCluster[], totalScore: number): number => {
  if (clusters.length <= 1 || totalScore <= 0) return 0;
  const base = Math.log(clusters.length);
  if (!Number.isFinite(base) || base <= 0) return 0;
  let sum = 0;
  for (const cluster of clusters) {
    const p = cluster.score / totalScore;
    if (p <= 0) continue;
    sum += -p * Math.log(p);
  }
  return Math.min(1, Math.max(0, sum / base));
};

const buildAmbiguityClusterSummary = (
  candidates: AskCandidate[],
  targetSpan?: string,
): AmbiguityClusterSummary | null => {
  if (candidates.length === 0) {
    return {
      targetSpan,
      totalScore: 0,
      topScore: 0,
      margin: 0,
      entropy: 0,
      clusters: [],
    };
  }
  const map = new Map<string, AmbiguityCluster>();
  for (const candidate of candidates) {
    const key = resolveClusterKey(candidate.filePath);
    const entry = map.get(key);
    if (entry) {
      entry.score += candidate.rrfScore;
      entry.count += 1;
      if (entry.paths.length < 3) {
        entry.paths.push(candidate.filePath);
      }
    } else {
      map.set(key, {
        key,
        label: formatClusterLabel(key),
        score: candidate.rrfScore,
        mass: 0,
        count: 1,
        paths: [candidate.filePath],
      });
    }
  }
  const clusters = Array.from(map.values()).sort((a, b) => b.score - a.score);
  const totalScore = clusters.reduce((sum, cluster) => sum + cluster.score, 0);
  for (const cluster of clusters) {
    cluster.mass = totalScore > 0 ? cluster.score / totalScore : 0;
  }
  const topScore = clusters[0]?.score ?? 0;
  const secondScore = clusters[1]?.score ?? 0;
  const margin = topScore > 0 ? Math.max(0, (topScore - secondScore) / topScore) : 0;
  const entropy = computeClusterEntropy(clusters, totalScore);
  return {
    targetSpan,
    totalScore,
    topScore,
    margin,
    entropy,
    clusters,
  };
};

const parseLabelList = (raw: string): string[] | null => {
  if (!raw.trim()) return null;
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((entry) => String(entry).trim()).filter(Boolean);
  } catch {
    return null;
  }
};

const applyAmbiguityClusterLabels = (
  clusters: AmbiguityCluster[],
  labels: string[] | null,
): AmbiguityCluster[] => {
  if (!labels || labels.length === 0) return clusters;
  return clusters.map((cluster, index) => ({
    ...cluster,
    label: labels[index] ?? cluster.label,
  }));
};

const buildAmbiguityLabelPrompt = (args: {
  question: string;
  targetSpan?: string;
  clusters: AmbiguityCluster[];
}): string => {
  const lines = args.clusters.map((cluster, index) => {
    const samples = cluster.paths.slice(0, 2).join(", ");
    return `- ${index + 1}. key: ${cluster.key}; samples: ${samples || "n/a"}`;
  });
  return [
    "You label ambiguity clusters for a clarification question.",
    "Return a JSON array of short labels (2-6 words) in the same order as the list.",
    `Question: "${args.question}"`,
    args.targetSpan ? `Target: "${args.targetSpan}"` : "",
    "Clusters:",
    ...lines,
    "Return JSON only.",
  ]
    .filter(Boolean)
    .join("\n");
};

const labelAmbiguityClustersWithLlm = async (args: {
  question: string;
  targetSpan?: string;
  clusters: AmbiguityCluster[];
  personaId: string;
  sessionId?: string;
  traceId?: string;
}): Promise<{ clusters: AmbiguityCluster[]; applied: boolean; overflow?: HelixAskOverflowMeta }> => {
  if (!HELIX_ASK_AMBIGUITY_LABEL_LLM || args.clusters.length === 0) {
    return { clusters: args.clusters, applied: false };
  }
  const prompt = buildAmbiguityLabelPrompt(args);
  const { result, overflow } = await runHelixAskLocalWithOverflowRetry(
    {
      prompt,
      max_tokens: 96,
      temperature: 0.1,
    },
    {
      personaId: args.personaId,
      sessionId: args.sessionId,
      traceId: args.traceId,
    },
    {
      fallbackMaxTokens: 96,
      allowContextDrop: true,
      label: "ambiguity_labels",
    },
  );
  const labels = parseLabelList(result.text ?? "");
  const labeled = applyAmbiguityClusterLabels(args.clusters, labels);
  return { clusters: labeled, applied: Boolean(labels && labels.length), overflow };
};

const selectClarifyToken = (question: string): string | undefined => {
  const span = extractClarifySpan(question);
  if (span) {
    const spanTokens = filterCriticTokens(tokenizeAskQuery(span));
    for (let i = spanTokens.length - 1; i >= 0; i -= 1) {
      const normalized = normalizeClarifyToken(spanTokens[i]);
      if (normalized) return normalized;
    }
    const normalizedSpan = normalizeClarifyToken(span);
    if (normalizedSpan) return normalizedSpan;
  }
  const tokens = filterCriticTokens(tokenizeAskQuery(question));
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const normalized = normalizeClarifyToken(tokens[i]);
    if (normalized) return normalized;
  }
  return undefined;
};

const formatAmbiguityCandidateLabel = (candidate: HelixAskConceptCandidate): string =>
  candidate.card.label ?? candidate.card.id;

const collectAmbiguitySeedLabels = (
  slots: Array<{ label?: string; aliases?: string[] }>,
  limit = 3,
): string[] => {
  const labels: string[] = [];
  const seen = new Set<string>();
  const pushLabel = (value?: string) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length < HELIX_ASK_AMBIGUOUS_TERM_MIN_LEN) return;
    const normalized = normalizeSlotName(trimmed);
    if (STRUCTURAL_SLOTS.has(normalized)) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    labels.push(trimmed);
  };
  for (const slot of slots) {
    pushLabel(slot.label);
    if (labels.length >= limit) break;
    for (const alias of slot.aliases ?? []) {
      pushLabel(alias);
      if (labels.length >= limit) break;
    }
    if (labels.length >= limit) break;
  }
  return labels.slice(0, limit);
};

const buildPreIntentClarifyLine = (
  question: string,
  candidates: HelixAskConceptCandidate[],
  clusterSummary?: AmbiguityClusterSummary | null,
  seedLabels: string[] = [],
): string => {
  const clusterLabels = (clusterSummary?.clusters ?? [])
    .map((cluster) => cluster.label)
    .filter(Boolean);
  if (clusterLabels.length >= 2) {
    return `Do you mean "${clusterLabels[0]}" or "${clusterLabels[1]}"? If you mean a repo concept, point me to the file or module.`;
  }
  if (clusterLabels.length === 1) {
    const token =
      selectClarifyToken(question) ??
      clusterSummary?.targetSpan ??
      candidates[0]?.matchedTerm;
    return `Do you mean "${clusterLabels[0]}" in this repo, or the general meaning of "${token ?? "that term"}"? If it's repo-specific, point me to the file or module.`;
  }
  if (seedLabels.length >= 2) {
    return `Do you mean "${seedLabels[0]}" or "${seedLabels[1]}"? If you mean a repo concept, point me to the file or module.`;
  }
  if (seedLabels.length === 1) {
    const token = selectClarifyToken(question) ?? seedLabels[0];
    return `Do you mean "${seedLabels[0]}" in this repo, or the general meaning of "${token}"? If it's repo-specific, point me to the file or module.`;
  }
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

type HelixAskReportBlock = {
  id: string;
  text: string;
  label?: string;
  typeHint?: string;
  slotId?: string;
  slotSurfaces?: string[];
  slotAliases?: string[];
  slotEvidenceCriteria?: string[];
};

type HelixAskReportBlockResult = {
  id: string;
  index: number;
  label?: string;
  text: string;
  answer: string;
  mode: "repo_grounded" | "hybrid" | "general" | "clarify";
  clarify: boolean;
  citations: string[];
  traceId?: string;
  nextEvidence?: string[];
};

type HelixAskReportModeDecision = {
  enabled: boolean;
  reason?: string;
  tokenCount: number;
  charCount: number;
  blockCount: number;
};

const REPORT_MODE_INTENT_RE =
  /\b(report|point[- ]by[- ]point|line by line|go through (each|every)|analyze each)\b/i;
const REPORT_MODE_HEADING_RE = /^#{1,6}\s+(.+)$/;
const REPORT_MODE_BULLET_RE = /^\s*(?:[-*+]|[0-9]+[.)]|[a-zA-Z][.)])\s+(.+)$/;
const REPORT_MODE_SECTION_RE = /^(?:Q:|Question:|Requirement:|Issue:|Task:)\s*(.+)$/i;
type HelixAskReportBlockHint = {
  id: string;
  patterns: RegExp[];
  anchorFiles: string[];
  searchTerms?: string[];
  repoFocus?: boolean;
};

const REPORT_BLOCK_HINTS: HelixAskReportBlockHint[] = [
  {
    id: "helix_ask_sources",
    patterns: [
      /\b(selects?|selection|sources?|retrieval|context assembly|evidence gate|coverage gate|belief gate|rattling gate|citation repair)\b/i,
      /\b(arbiter|arbiter threshold|repo ratio|hybrid ratio)\b/i,
    ],
    anchorFiles: [
      "server/routes/agi.plan.ts",
      "server/services/helix-ask/arbiter.ts",
      "server/services/helix-ask/platonic-gates.ts",
      "server/services/helix-ask/query.ts",
      "docs/helix-ask-flow.md",
    ],
    searchTerms: [
      "retrieval",
      "evidence gate",
      "coverage gate",
      "belief gate",
      "rattling gate",
      "arbiter",
    ],
    repoFocus: true,
  },
  {
    id: "helix_ask_ambiguity",
    patterns: [
      /\b(ambiguity|ambiguous|clarify|clarification|short prompt|short prompts)\b/i,
      /\b(cavity|lattice|bubble|ledger)\b/i,
    ],
    anchorFiles: [
      "server/routes/agi.plan.ts",
      "server/services/helix-ask/query.ts",
      "server/services/helix-ask/platonic-gates.ts",
      "server/services/helix-ask/topic.ts",
    ],
    searchTerms: ["ambiguity resolver", "clarify", "short prompt", "target span"],
    repoFocus: true,
  },
  {
    id: "helix_ask_longprompt",
    patterns: [
      /\b(long prompt|prompt ingest|ingest(ed|ion)?|chunk|chunking|overflow|context window|token budget)\b/i,
    ],
    anchorFiles: [
      "server/routes/agi.plan.ts",
      "server/services/helix-ask/query.ts",
    ],
    searchTerms: ["longprompt", "overflow retry", "prompt chunk"],
    repoFocus: true,
  },
  {
    id: "helix_ask_report_mode",
    patterns: [/\b(report mode|point[- ]by[- ]point|coverage map|executive summary)\b/i],
    anchorFiles: [
      "server/routes/agi.plan.ts",
      "docs/helix-ask-flow.md",
    ],
    searchTerms: ["report mode", "report blocks", "coverage map"],
    repoFocus: true,
  },
];

const REPORT_BLOCK_EXAMPLE_RE = /\b(?:like|such as)\s+(\"[^\"]+\"|'[^']+')/gi;
const REPORT_BLOCK_PAREN_EXAMPLE_RE = /\((?:e\.g\.|for example)[^)]*\)/gi;
const REPORT_BLOCK_EXAMPLE_TAIL_RE = /\b(?:like|such as)\s+([a-z0-9_-]{3,30})/gi;
const REPORT_BLOCK_REPO_CUE_RE =
  /\b(repo|repository|codebase|file|files|path|paths|cite|citation|source|sources|module|component|helix ask|arbiter|gate|constraint)\b/i;
const REPORT_BLOCK_CLARIFY_LABELS: Record<string, string> = {
  helix_ask_sources: "Helix Ask source selection + evidence gates",
  helix_ask_ambiguity: "Ambiguity resolver / clarification behavior",
  helix_ask_longprompt: "Long prompt ingest + overflow retry",
  helix_ask_report_mode: "Report mode behavior",
};

const normalizeReportBlockText = (text: string): string => {
  if (!text) return "";
  let cleaned = text.trim();
  cleaned = cleaned.replace(REPORT_BLOCK_PAREN_EXAMPLE_RE, " ");
  cleaned = cleaned.replace(REPORT_BLOCK_EXAMPLE_RE, " ");
  cleaned = cleaned.replace(REPORT_BLOCK_EXAMPLE_TAIL_RE, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  return cleaned.trim();
};

const shouldUseIdeologyConversationalMode = (
  question: string,
  tokenCount: number,
  charCount: number,
  options?: { explicitReportCue?: boolean; blockScoped?: boolean },
): boolean => {
  if (options?.blockScoped) return false;
  if (options?.explicitReportCue) return false;
  if (tokenCount > HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_TOKENS) return false;
  if (charCount > HELIX_ASK_IDEOLOGY_CHAT_MODE_MAX_CHARS) return false;
  const trimmed = question.trim();
  if (trimmed.length < 20) return false;
  if (HELIX_ASK_IDEOLOGY_REPORT_BAN_RE.test(trimmed)) return false;
  return (
    HELIX_ASK_IDEOLOGY_CHAT_QUERY_RE.test(trimmed) ||
    HELIX_ASK_IDEOLOGY_NARRATIVE_QUERY_RE.test(trimmed)
  );
};

const resolveReportBlockHints = (
  text: string,
  options?: { typeHint?: string },
): {
  anchorFiles: string[];
  searchTerms: string[];
  repoFocus: boolean;
  hintIds: string[];
  includeHelixAsk: boolean;
} => {
  if (options?.typeHint) {
    return {
      anchorFiles: [],
      searchTerms: [],
      repoFocus: false,
      hintIds: [],
      includeHelixAsk: false,
    };
  }
  const anchorFiles: string[] = [];
  const searchTerms: string[] = [];
  const hintIds: string[] = [];
  let repoFocus = false;
  let includeHelixAsk = false;
  for (const hint of REPORT_BLOCK_HINTS) {
    if (!hint.patterns.some((pattern) => pattern.test(text))) continue;
    hintIds.push(hint.id);
    if (hint.anchorFiles?.length) anchorFiles.push(...hint.anchorFiles);
    if (hint.searchTerms?.length) searchTerms.push(...hint.searchTerms);
    if (hint.repoFocus) repoFocus = true;
    includeHelixAsk = true;
  }
  return {
    anchorFiles: Array.from(new Set(anchorFiles)),
    searchTerms: Array.from(new Set(searchTerms)),
    repoFocus,
    hintIds,
    includeHelixAsk,
  };
};

const buildReportBlockSearchQuery = (args: {
  blockText: string;
  searchTerms: string[];
  anchorFiles: string[];
  reportRepoContext: boolean;
  slotAliases?: string[];
  slotEvidenceCriteria?: string[];
  slotId?: string;
  includeHelixAsk?: boolean;
}): string => {
  const parts: string[] = [];
  const aliasHints = args.slotAliases?.length
    ? filterSlotHintTerms(args.slotAliases, { maxTokens: 6, maxChars: 72 })
    : [];
  const evidenceHints = args.slotEvidenceCriteria?.length
    ? filterSlotHintTerms(args.slotEvidenceCriteria, { maxTokens: 6, maxChars: 72 })
    : [];
  if (args.blockText) parts.push(args.blockText);
  if (args.includeHelixAsk && !/helix ask/i.test(args.blockText)) {
    parts.push("helix ask");
  }
  if (aliasHints.length) {
    parts.push(...aliasHints);
  }
  if (evidenceHints.length) {
    parts.push(...evidenceHints);
  }
  if (args.slotId) {
    parts.push(args.slotId.replace(/-/g, " "));
  }
  if (args.searchTerms.length) parts.push(...args.searchTerms);
  if (args.anchorFiles.length) parts.push(...args.anchorFiles);
  const unique = Array.from(new Set(parts.map((part) => part.trim()).filter(Boolean)));
  return unique.join(" ");
};

const buildReportBlockClarifyLine = (
  terms: string[],
  hintIds: string[],
  anchorFiles: string[],
): string => {
  const cleanedTerms = terms.map((term) => term.replace(/[\"'`.,;:!?]+$/g, "").trim()).filter(Boolean);
  const options = hintIds
    .map((id) => REPORT_BLOCK_CLARIFY_LABELS[id])
    .filter((label): label is string => Boolean(label));
  const dirHints = Array.from(
    new Set(
      anchorFiles
        .map((filePath) => filePath.split("/")[0])
        .filter((segment) => Boolean(segment)),
    ),
  ).slice(0, 2);
  if (cleanedTerms.length > 0) {
    const termText = cleanedTerms.length === 1 ? `"${cleanedTerms[0]}"` : cleanedTerms.join(", ");
    if (options.length > 0) {
      return `I could not confirm ${termText} for this block yet. Do you mean ${options.join(
        " or ",
      )}, or can you point to the relevant files?`;
    }
    if (dirHints.length > 0) {
      return `I could not confirm ${termText} for this block yet. Can you point to files under ${dirHints.join(
        " or ",
      )}?`;
    }
    return `I could not confirm ${termText} for this block yet. Please point to the relevant files or clarify the term.`;
  }
  if (options.length > 0) {
    return `Repo evidence was required for this block. Do you mean ${options.join(
      " or ",
    )}, or can you point to the relevant files?`;
  }
  return "Repo evidence was required for this block but could not be confirmed. Please point to the relevant files or clarify the term.";
};

const splitGroundedSentences = (text: string): string[] => {
  if (!text.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const computeGroundedSentenceRate = (answer: string): number => {
  const sentences = splitGroundedSentences(answer);
  if (!sentences.length) return 1;
  const grounded = sentences.filter((sentence) => extractFilePathsFromText(sentence).length > 0).length;
  return grounded / sentences.length;
};

const buildReportBlockScopeOverride = (anchorFiles: string[], hintIds: string[]): HelixAskPlanScope => {
  const docsSurfaces = new Set<string>();
  const codeSurfaces = new Set<string>();
  const testSurfaces = new Set<string>();
  for (const filePath of anchorFiles) {
    const normalized = filePath.replace(/\\/g, "/");
    if (normalized.startsWith("docs/ethos/")) {
      docsSurfaces.add("docs");
      docsSurfaces.add("ethos");
      continue;
    }
    if (normalized.startsWith("docs/knowledge/")) {
      docsSurfaces.add("docs");
      docsSurfaces.add("knowledge");
      continue;
    }
    if (normalized.startsWith("docs/")) {
      docsSurfaces.add("docs");
      continue;
    }
    if (normalized.startsWith("tests/")) {
      testSurfaces.add("tests");
      continue;
    }
    codeSurfaces.add("code");
  }
  if (hintIds.includes("helix_ask_sources") || hintIds.includes("helix_ask_report_mode")) {
    docsSurfaces.add("docs");
    codeSurfaces.add("code");
  }
  const tiers: RegExp[][] = [];
  if (docsSurfaces.size > 0) {
    tiers.push(buildPlanSurfaceRegexes(Array.from(docsSurfaces)));
  }
  if (codeSurfaces.size > 0) {
    tiers.push(buildPlanSurfaceRegexes(Array.from(codeSurfaces)));
  }
  if (testSurfaces.size > 0) {
    tiers.push(buildPlanSurfaceRegexes(Array.from(testSurfaces)));
  }
  if (tiers.length === 0) return {};
  tiers.push([]);
  return {
    allowlistTiers: tiers,
    overrideAllowlist: true,
    docsFirst: docsSurfaces.size > 0,
    docsAllowlist: docsSurfaces.size > 0 ? [buildPlanSurfaceRegexes(Array.from(docsSurfaces))] : undefined,
  };
};

const buildCodeFirstPlanScopeOverride = (
  scope?: HelixAskPlanScope | null,
): HelixAskPlanScope => {
  const codeRegexes = buildPlanSurfaceRegexes(["code"]);
  if (codeRegexes.length === 0) return scope ?? {};
  const tiers: RegExp[][] = [codeRegexes, []];
  const override: HelixAskPlanScope = {
    allowlistTiers: tiers,
    overrideAllowlist: true,
    docsFirst: false,
  };
  return scope ? mergePlanScope(scope, override) : override;
};

const buildSlotReportBlockScopeOverride = (
  slotSurfaces: string[],
  slotId?: string,
): HelixAskPlanScope => {
  const surfaces = new Set(slotSurfaces.map((surface) => surface.trim()).filter(Boolean));
  const docSurfaces = new Set(
    Array.from(surfaces).filter((surface) =>
      surface === "docs" || surface === "knowledge" || surface === "ethos",
    ),
  );
  if (docSurfaces.size === 0) {
    docSurfaces.add("docs");
    docSurfaces.add("knowledge");
  }
  const codeSurfaces = new Set(Array.from(surfaces).filter((surface) => surface === "code"));
  const docRegexes = buildPlanSurfaceRegexes(Array.from(docSurfaces));
  const codeRegexes = buildPlanSurfaceRegexes(Array.from(codeSurfaces));
  const allowlistTiers: RegExp[][] = [];
  if (docRegexes.length) allowlistTiers.push(docRegexes);
  if (codeRegexes.length) allowlistTiers.push(codeRegexes);
  const docsAllowlist: RegExp[][] = [];
  if (docRegexes.length) docsAllowlist.push(docRegexes);
  const mustIncludeEntry = slotId ? `**/${slotId}*` : undefined;
  const mustIncludeGlobs = mustIncludeEntry ? [globToRegex(mustIncludeEntry)] : undefined;
  return {
    allowlistTiers: allowlistTiers.length ? allowlistTiers : undefined,
    docsAllowlist: docsAllowlist.length ? docsAllowlist : undefined,
    docsFirst: true,
    overrideAllowlist: true,
    mustIncludeGlobs,
    mustIncludeEntries: mustIncludeEntry ? [mustIncludeEntry] : undefined,
  };
};

const countReportBlockCandidates = (question: string): number => {
  if (!question.trim()) return 0;
  const lines = question.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (REPORT_MODE_BULLET_RE.test(trimmed)) count += 1;
    else if (REPORT_MODE_SECTION_RE.test(trimmed)) count += 1;
  }
  return count;
};

const splitLongReportBlock = (text: string, limit: number): string[] => {
  if (text.length <= limit) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if (!current) {
      current = sentence.trim();
      continue;
    }
    if ((current + " " + sentence).length > limit) {
      chunks.push(current.trim());
      current = sentence.trim();
    } else {
      current = `${current} ${sentence.trim()}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
};

const stripAnswerMarkers = (value: string): string =>
  value.replace(/\bANSWER_(?:START|END)\b/g, "").trim();

const REPORT_SENTENCE_SPLIT = /(?<=[.!?])\s+/;

const collapseRepeatedSentenceBlock = (value: string): string => {
  const sentences = value
    .split(REPORT_SENTENCE_SPLIT)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length < 2 || sentences.length % 2 !== 0) return value;
  const half = sentences.length / 2;
  for (let i = 0; i < half; i += 1) {
    const left = sentences[i].replace(/\s+/g, " ").toLowerCase();
    const right = sentences[i + half].replace(/\s+/g, " ").toLowerCase();
    if (left !== right) return value;
  }
  return sentences.slice(0, half).join(" ").trim();
};

const stripTrivialOrdinalBullets = (value: string): string => {
  if (!value.trim()) return value;
  const normalized = normalizeScientificSectionLayout(value);
  let cleaned = normalized;
  // Drop pure numeric/roman list markers that carry no content.
  cleaned = cleaned.replace(/^[\t ]*[-*][\t ]*(?:\d+|[ivxlcdm]+)\s*(?:[.)-])?\s*$/gim, "");
  cleaned = cleaned.replace(/^[\t ]*(?:\d+|[ivxlcdm]+)\s*(?:[.)-])\s*$/gim, "");
  // Convert bullets like "- 1. Meaningful text" to "- Meaningful text".
  cleaned = cleaned.replace(/^([\t ]*[-*][\t ]*)(?:\d+|[ivxlcdm]+)\s*[.)-]\s+/gim, "$1");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
};

const dedupeReportParagraphs = (
  value: string,
): { text: string; applied: boolean } => {
  const paragraphs = value.split(/\n{2,}/);
  const seen = new Set<string>();
  const output: string[] = [];
  let applied = false;
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    const collapsed = collapseRepeatedSentenceBlock(trimmed);
    if (collapsed !== trimmed) applied = true;
    const normalized = collapsed.replace(/\s+/g, " ").toLowerCase();
    if (normalized.length >= 80 && seen.has(normalized)) {
      applied = true;
      continue;
    }
    if (normalized.length >= 80) {
      seen.add(normalized);
    }
    output.push(collapsed.trim());
  }
  return { text: output.join("\n\n"), applied };
};

const scrubUnsupportedPaths = (
  value: string,
  allowedPaths: string[],
): { text: string; removed: string[] } => {
  if (!value.trim()) return { text: value, removed: [] };
  if (allowedPaths.length === 0) return { text: value, removed: [] };
  const escapeRegExp = (input: string): string =>
    input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const allowed = new Set<string>();
  for (const path of allowedPaths) {
    const normalized = normalizeEvidenceRef(path) ?? path;
    if (normalized) allowed.add(normalized);
    if (path) allowed.add(path);
  }
  const presentPaths = extractFilePathsFromText(value);
  if (presentPaths.length === 0) return { text: value, removed: [] };
  let cleaned = value;
  const removed: string[] = [];
  for (const candidate of presentPaths) {
    if (/^(gate|certificate):/i.test(candidate)) continue;
    const normalized = normalizeEvidenceRef(candidate) ?? candidate;
    if (allowed.has(normalized) || allowed.has(candidate)) continue;
    removed.push(candidate);
    const escaped = escapeRegExp(candidate);
    cleaned = cleaned.replace(new RegExp(`\\[[^\\]]*${escaped}[^\\]]*\\]`, "g"), "");
    cleaned = cleaned.replace(new RegExp(`\\s*\\|\\s*(?:symbol|file)=${escaped}\\b`, "gi"), "");
    cleaned = cleaned.replace(new RegExp(`\\b(?:symbol|file)=${escaped}\\b`, "gi"), "");
    cleaned = cleaned.split(candidate).join("");
  }
  if (removed.length) {
    cleaned = cleaned.replace(/\[(?:r|g|s|c):\s*\]/gi, "");
    cleaned = cleaned.replace(/\s*\|\s*(?:symbol|file)=\s*(?=\s|$)/gi, "");
    cleaned = cleaned.replace(/\b(?:symbol|file)=\s*(?=\s|$)/gi, "");
    cleaned = cleaned.replace(/\s*\|\s*(?=\s*(?:\n|$))/g, "");
    cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
    cleaned = cleaned.replace(/ +([,.;:])/g, "$1");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  }
  return { text: cleaned, removed };
};

const CITATION_TOKEN_RE = /\b(?:gate|certificate):[a-z0-9._-]+/gi;

const extractCitationTokensFromText = (value: string): string[] => {
  if (!value) return [];
  const tokens = value.match(CITATION_TOKEN_RE) ?? [];
  return Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
};

const sanitizeSourcesLine = (
  value: string,
  allowedPaths: string[],
  allowedTokens: string[],
): string => {
  if (!value) return value;
  const allowedPathSet = new Set(allowedPaths.map((path) => path.toLowerCase()));
  const allowedTokenSet = new Set(allowedTokens.map((token) => token.toLowerCase()));
  const lines = value.split(/\r?\n/);
  const output: string[] = [];
  const sourcePool: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*sources?\s*:\s*(.+)$/i);
    if (!match) {
      output.push(line);
      continue;
    }
    const rawPaths = normalizeCitations(extractFilePathsFromText(line));
    const rawTokens = extractCitationTokensFromText(line);
    const filteredPaths = rawPaths.filter((entry) => {
      const normalized = (normalizeEvidenceRef(entry) ?? entry).toLowerCase();
      return allowedPathSet.has(normalized) || allowedPathSet.has(entry.toLowerCase());
    });
    const filteredTokens = rawTokens.filter((token) => allowedTokenSet.has(token.toLowerCase()));
    const combined = normalizeCitations([...filteredPaths, ...filteredTokens]);
    if (combined.length === 0) {
      continue;
    }
    sourcePool.push(...combined);
  }
  const mergedSources = normalizeCitations(sourcePool);
  if (mergedSources.length > 0) {
    while (output.length > 0 && !output[output.length - 1]?.trim()) {
      output.pop();
    }
    if (output.length > 0) {
      output.push("");
    }
    output.push(`Sources: ${mergedSources.join(", ")}`);
  }
  return output.join("\n").trim();
};

const stripCitationRepairArtifacts = (value: string): string => {
  if (!value) return value;
  let cleaned = value;
  cleaned = cleaned.replace(/\[citations?:[^\]]*\]/gi, "");
  cleaned = cleaned.replace(/\[end of text\]/gi, "");
  cleaned = cleaned.replace(/\[(?:g|r|s|c):[^\]]*\]/gi, "");
  cleaned = cleaned.replace(/\s*\|\s*(?:symbol|file)\s*=\s*[^\s|]+/gi, "");
  cleaned = cleaned.replace(/\s*\|\s*(?=\s*(?:\n|$))/g, "");
  const lines = cleaned.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const promptClean = cleanPromptLine(trimmed);
    if (!promptClean) return false;
    if (isPromptLine(promptClean)) return false;
    if (/^to\s+revise the answer\b/i.test(promptClean)) return false;
    if (/^identify the relevant citations\b/i.test(promptClean)) return false;
    if (/^replace\b.*\bcitations?\b/i.test(promptClean)) return false;
    if (/^follow these steps\b/i.test(promptClean)) return false;
    return true;
  });
  cleaned = filtered.join("\n");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
};

const sanitizeCitationRepairOutput = (
  value: string,
  allowedPaths: string[],
  evidenceText: string,
): { text: string; removedPaths: string[] } => {
  let cleaned = stripAnswerMarkers(stripTruncationMarkers(value));
  cleaned = stripCitationRepairArtifacts(cleaned);
  const scrubbed = scrubUnsupportedPaths(cleaned, allowedPaths);
  cleaned = scrubbed.text;
  const allowedTokens = extractCitationTokensFromText(evidenceText);
  cleaned = sanitizeSourcesLine(cleaned, allowedPaths, allowedTokens);
  return { text: cleaned, removedPaths: scrubbed.removed };
};

const sanitizeReportBlockAnswer = (
  value: string,
  allowedPaths: string[],
): { text: string; removedPaths: string[]; dedupeApplied: boolean } => {
  let cleaned = stripAnswerMarkers(stripTruncationMarkers(value));
  cleaned = stripCitationRepairArtifacts(cleaned);
  const deduped = dedupeReportParagraphs(cleaned);
  cleaned = deduped.text;
  const scrubbed = scrubUnsupportedPaths(cleaned, allowedPaths);
  cleaned = scrubbed.text;
  return {
    text: cleaned,
    removedPaths: scrubbed.removed,
    dedupeApplied: deduped.applied,
  };
};

const buildReportBlocks = (question: string): HelixAskReportBlock[] => {
  const lines = question.split(/\r?\n/);
  const blocks: HelixAskReportBlock[] = [];
  let current: string[] = [];
  let currentLabel: string | undefined;
  const pushCurrent = () => {
    const text = current.join(" ").trim();
    if (!text) {
      current = [];
      return;
    }
    const parts = splitLongReportBlock(text, HELIX_ASK_REPORT_BLOCK_CHAR_LIMIT);
    for (const part of parts) {
      blocks.push({
        id: `block-${blocks.length + 1}`,
        text: part,
        label: currentLabel,
      });
    }
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      pushCurrent();
      continue;
    }
    if (REPORT_MODE_INTENT_RE.test(trimmed)) {
      const intentTokens = filterCriticTokens(tokenizeAskQuery(trimmed));
      if (intentTokens.length <= 2) {
        pushCurrent();
        continue;
      }
    }
    const headingMatch = trimmed.match(REPORT_MODE_HEADING_RE);
    if (headingMatch) {
      pushCurrent();
      currentLabel = headingMatch[1].trim();
      continue;
    }
    const sectionMatch = trimmed.match(REPORT_MODE_SECTION_RE);
    if (sectionMatch) {
      pushCurrent();
      const sectionText = sectionMatch[1].trim();
      if (sectionText) {
        blocks.push({
          id: `block-${blocks.length + 1}`,
          text: sectionText,
          label: currentLabel ?? sectionMatch[0].split(":")[0],
        });
      }
      continue;
    }
    const bulletMatch = trimmed.match(REPORT_MODE_BULLET_RE);
    if (bulletMatch) {
      pushCurrent();
      const bulletText = bulletMatch[1].trim();
      if (bulletText) {
        blocks.push({
          id: `block-${blocks.length + 1}`,
          text: bulletText,
          label: currentLabel,
        });
      }
      continue;
    }
    current.push(trimmed);
  }
  pushCurrent();
  if (blocks.length === 0 && question.trim()) {
    blocks.push({ id: "block-1", text: question.trim() });
  }
  return blocks;
};

const buildSlotReportBlocks = (
  slotPlan: HelixAskSlotPlan,
  question: string,
): HelixAskReportBlock[] => {
  if (!slotPlan.slots.length) return [];
  const blocks: HelixAskReportBlock[] = [];
  const strongSlots = slotPlan.slots.filter((slot) => !isWeakSlot(slot));
  const selectedSlots = strongSlots.filter((slot) => slot.required);
  const slots = selectedSlots.length > 0 ? selectedSlots : strongSlots;
  if (slots.length === 0) return [];
  const globalHeader = question.trim() ? `Global question: ${question.trim()}` : "";
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const label = slot.label || slot.id;
    const slotHeader = slot.id ? `Canonical slot: ${slot.id}` : "";
    const slotAliases = filterSlotHintTerms(slot.aliases ?? [], { maxTokens: 6, maxChars: 72 });
    const slotEvidenceCriteria = filterSlotHintTerms(
      slot.evidenceCriteria ?? [],
      { maxTokens: 6, maxChars: 72 },
    );
    const scopedText = [globalHeader, slotHeader, `Answer only about "${label}". Ignore other topics from the original question.`]
      .filter(Boolean)
      .join("\n");
    blocks.push({
      id: `slot-${index + 1}`,
      text: scopedText,
      label,
      typeHint: slot.source,
      slotId: slot.id,
      slotSurfaces: slot.surfaces ?? [],
      slotAliases,
      slotEvidenceCriteria,
    });
  }
  return blocks;
};

const resolveReportModeDecision = (question: string): HelixAskReportModeDecision => {
  const tokens = filterCriticTokens(tokenizeAskQuery(question));
  const tokenCount = tokens.length;
  const charCount = question.length;
  const blockCount = countReportBlockCandidates(question);
  if (!HELIX_ASK_REPORT_MODE) {
    return { enabled: false, tokenCount, charCount, blockCount };
  }
  if (REPORT_MODE_INTENT_RE.test(question)) {
    return { enabled: true, reason: "explicit_report_request", tokenCount, charCount, blockCount };
  }
  if (blockCount >= HELIX_ASK_REPORT_TRIGGER_BLOCKS) {
    return { enabled: true, reason: "block_count", tokenCount, charCount, blockCount };
  }
  if (tokenCount >= HELIX_ASK_REPORT_TRIGGER_TOKENS || charCount >= HELIX_ASK_REPORT_TRIGGER_CHARS) {
    return { enabled: true, reason: "long_prompt", tokenCount, charCount, blockCount };
  }
  return { enabled: false, tokenCount, charCount, blockCount };
};

const buildHelixAskReportAnswer = (
  blocks: HelixAskReportBlockResult[],
  omittedCount: number,
): string => {
  const counts = {
    repo_grounded: 0,
    hybrid: 0,
    general: 0,
    clarify: 0,
  };
  for (const block of blocks) {
    counts[block.mode] += 1;
  }
  const summary = [
    `Report covers ${blocks.length} item${blocks.length === 1 ? "" : "s"}.`,
    `Grounded: ${counts.repo_grounded}, hybrid: ${counts.hybrid}, general: ${counts.general}, clarify: ${counts.clarify}.`,
  ];
  if (omittedCount > 0) {
    summary.push(`Omitted ${omittedCount} item${omittedCount === 1 ? "" : "s"} due to report block limits.`);
  }
  const lines: string[] = [];
  lines.push("Executive summary:");
  for (const line of summary) lines.push(`- ${line}`);
  lines.push("");
  lines.push("Coverage map:");
  lines.push(`- Grounded: ${counts.repo_grounded}`);
  lines.push(`- Hybrid: ${counts.hybrid}`);
  lines.push(`- General: ${counts.general}`);
  lines.push(`- Clarify: ${counts.clarify}`);
  lines.push("");
  const groundedBlocks = blocks.filter(
    (block) => block.mode === "repo_grounded" || block.mode === "hybrid",
  );
  if (groundedBlocks.length >= 2) {
    const [first, second] = groundedBlocks;
    const firstLabel = first.label || "Item 1";
    const secondLabel = second.label || "Item 2";
    const firstSource =
      first.citations.length > 0 ? `see ${first.citations[0]}` : "see cited sources";
    const secondSource =
      second.citations.length > 0 ? `see ${second.citations[0]}` : "see cited sources";
    lines.push("Connections (grounded only):");
    lines.push(
      `- ${firstLabel} is grounded (${firstSource}). ${secondLabel} is grounded (${secondSource}). Hypothesis: a direct connection requires evidence that mentions both.`,
    );
    lines.push("");
  }
  const nextEvidence = Array.from(
    new Set(blocks.flatMap((block) => block.nextEvidence ?? [])),
  ).slice(0, 4);
  if (nextEvidence.length > 0) {
    lines.push("Next evidence (global):");
    nextEvidence.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }
  lines.push("Point-by-point:");
  blocks.forEach((block, index) => {
    const label = block.label ? `${block.label}` : `Item ${index + 1}`;
    lines.push(`${index + 1}) ${label}`);
    lines.push(block.answer.trim());
    if (block.citations.length > 0 && extractFilePathsFromText(block.answer).length === 0) {
      lines.push(`Sources: ${block.citations.join(", ")}`);
    }
    lines.push("");
  });
  return lines.join("\n").trim();
};

const computeReportMetrics = (
  blocks: HelixAskReportBlockResult[],
  details: Array<{
    clarify?: boolean;
    coverage_missing_keys?: string[];
    drift_detected?: boolean;
    belief_gate_applied?: boolean;
    rattling_gate_applied?: boolean;
    duration_ms?: number;
  }>,
): {
  block_count: number;
  block_answer_rate: number;
  block_grounded_rate: number;
  drift_fail_rate: number;
  clarify_with_terms_rate: number;
  avg_block_ms: number;
} => {
  const total = blocks.length;
  if (total === 0) {
    return {
      block_count: 0,
      block_answer_rate: 0,
      block_grounded_rate: 0,
      drift_fail_rate: 0,
      clarify_with_terms_rate: 0,
      avg_block_ms: 0,
    };
  }
  const clarifyCount = blocks.filter((block) => block.clarify).length;
  const groundedCount = blocks.filter(
    (block) => block.mode === "repo_grounded" || block.mode === "hybrid",
  ).length;
  const driftFails = details.filter((detail) => {
    if (typeof detail.drift_detected === "boolean") {
      return detail.drift_detected;
    }
    return Boolean(detail.belief_gate_applied || detail.rattling_gate_applied);
  }).length;
  const clarifyWithTerms = details.filter(
    (detail) => detail.clarify && (detail.coverage_missing_keys?.length ?? 0) > 0,
  ).length;
  const durations = details.map((detail) => detail.duration_ms ?? 0).filter((value) => value > 0);
  const avgBlockMs =
    durations.length > 0 ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;
  return {
    block_count: total,
    block_answer_rate: (total - clarifyCount) / total,
    block_grounded_rate: groundedCount / total,
    drift_fail_rate: driftFails / total,
    clarify_with_terms_rate: clarifyWithTerms / total,
    avg_block_ms: avgBlockMs,
  };
};

const resolvePreIntentAmbiguity = ({
  question,
  candidates,
  clusterSummary,
  explicitRepoExpectation,
  repoExpectationLevel,
  seedLabels,
}: {
  question: string;
  candidates: HelixAskConceptCandidate[];
  clusterSummary?: AmbiguityClusterSummary | null;
  explicitRepoExpectation: boolean;
  repoExpectationLevel: "low" | "medium" | "high";
  seedLabels?: string[];
}): {
  shouldClarify: boolean;
  reason?: string;
  tokenCount: number;
  shortPrompt: boolean;
  topScore: number;
  margin: number;
  clusterMargin: number;
  clusterEntropy: number;
  clusterTopMass: number;
} => {
  if (!HELIX_ASK_AMBIGUITY_RESOLVER) {
    return {
      shouldClarify: false,
      tokenCount: 0,
      shortPrompt: false,
      topScore: 0,
      margin: 0,
      clusterMargin: 0,
      clusterEntropy: 0,
      clusterTopMass: 0,
    };
  }
  const tokenCount = filterCriticTokens(tokenizeAskQuery(question)).length;
  const shortPrompt = tokenCount > 0 && tokenCount <= HELIX_ASK_AMBIGUITY_SHORT_TOKENS;
  const topScore = candidates[0]?.score ?? 0;
  const margin = candidates.length > 1 ? topScore - candidates[1].score : topScore;
  const clusterMargin = clusterSummary?.margin ?? 0;
  const clusterEntropy = clusterSummary?.entropy ?? 0;
  const clusterTopMass = clusterSummary?.clusters?.[0]?.mass ?? 0;
  const labelCount = seedLabels?.length ?? 0;
  const labelAmbiguity = labelCount >= 2;
  const strongConcept =
    candidates.length > 0 &&
    topScore >= HELIX_ASK_AMBIGUITY_MIN_SCORE &&
    (candidates.length < 2 || margin >= HELIX_ASK_AMBIGUITY_MARGIN_MIN);
  const clusterSplit = Boolean(
    clusterSummary &&
      clusterSummary.clusters.length >= 2 &&
      (clusterMargin < HELIX_ASK_AMBIGUITY_CLUSTER_MARGIN_MIN ||
        clusterEntropy > HELIX_ASK_AMBIGUITY_CLUSTER_ENTROPY_MAX),
  );
  const allowLongClarify = explicitRepoExpectation || repoExpectationLevel !== "low";
  const shouldClarify =
    (shortPrompt &&
      (clusterSplit ||
        (!strongConcept &&
          !clusterSummary?.clusters?.length &&
          (repoExpectationLevel === "low" || labelAmbiguity)))) ||
    (clusterSplit && allowLongClarify) ||
    (labelAmbiguity && allowLongClarify && !strongConcept && !clusterSummary?.clusters?.length);
  return {
    shouldClarify,
    reason: shouldClarify
      ? clusterSplit
        ? clusterMargin < HELIX_ASK_AMBIGUITY_CLUSTER_MARGIN_MIN
          ? "cluster_margin"
          : "cluster_entropy"
        : "short_prompt_low_signal"
      : undefined,
    tokenCount,
    shortPrompt,
    topScore,
    margin,
    clusterMargin,
    clusterEntropy,
    clusterTopMass,
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
    stage: z.string().optional(),
    detail: z.string().optional(),
    message: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
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
  if (!getTool(timeDilationActivateSpec.name)) {
    registerTool({ ...timeDilationActivateSpec, handler: timeDilationActivateHandler });
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

planRouter.get("/helix-ask/graph-lock", (req, res) => {
  if (!HELIX_ASK_SESSION_MEMORY) {
    return res.status(404).json({ error: "session_memory_disabled", status: 404 });
  }
  const sessionId = normalizeGraphLockSessionId(req.query.sessionId);
  if (!sessionId) {
    return res.status(400).json({ error: "bad_request", message: "sessionId required" });
  }
  const treeIds = getHelixAskSessionGraphLock(sessionId);
  return res.json({ sessionId, treeIds, locked: treeIds.length > 0 });
});

planRouter.post("/helix-ask/graph-lock", (req, res) => {
  if (!HELIX_ASK_SESSION_MEMORY) {
    return res.status(404).json({ error: "session_memory_disabled", status: 404 });
  }
  const parsed = HelixAskGraphLockRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const sessionId = parsed.data.sessionId.trim();
  const mode = parsed.data.mode ?? "replace";
  if (mode === "clear") {
    clearHelixAskSessionGraphLock(sessionId);
    return res.json({ ok: true, sessionId, treeIds: [], locked: false, mode: "clear" });
  }
  const treeIds = parsed.data.treeIds ?? [];
  if (treeIds.length === 0) {
    return res.status(400).json({ error: "bad_request", message: "treeIds required" });
  }
  const next = setHelixAskSessionGraphLock({
    sessionId,
    treeIds,
    mode: mode === "merge" ? "merge" : "replace",
  });
  return res.json({ ok: true, sessionId, treeIds: next, locked: next.length > 0, mode });
});

planRouter.delete("/helix-ask/graph-lock", (req, res) => {
  if (!HELIX_ASK_SESSION_MEMORY) {
    return res.status(404).json({ error: "session_memory_disabled", status: 404 });
  }
  const sessionId =
    normalizeGraphLockSessionId(req.query.sessionId) ||
    normalizeGraphLockSessionId((req.body as { sessionId?: string } | undefined)?.sessionId);
  if (!sessionId) {
    return res.status(400).json({ error: "bad_request", message: "sessionId required" });
  }
  clearHelixAskSessionGraphLock(sessionId);
  return res.json({ ok: true, sessionId, treeIds: [], locked: false });
});


type HelixAskResponder = {
  send: (status: number, payload: unknown) => void;
};

type HelixAskExecutionArgs = {
  request: z.infer<typeof LocalAskRequest>;
  personaId: string;
  responder: HelixAskResponder;
  streamChunk?: (chunk: string) => void;
  skipReportMode?: boolean;
  reportContext?: {
    parentTraceId?: string;
    blockIndex?: number;
    blockCount?: number;
    planScopeOverride?: HelixAskPlanScope;
  };
};

type HelixAskAgentAction = {
  action: string;
  reason: string;
  expectedGain?: string;
  observedDelta?: string;
  durationMs?: number;
  overBudget?: boolean;
  ok?: boolean;
  ts: string;
};

type HelixAskTraceEvent = {
  ts: string;
  tool: string;
  stage: string;
  detail?: string;
  ok?: boolean;
  durationMs?: number;
  text?: string;
  meta?: Record<string, unknown>;
};

type HelixAskTraceSummary = {
  stage: string;
  detail?: string;
  ok?: boolean;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

type HelixAskControllerStep = {
  step: string;
  action?: string;
  reason?: string;
  evidenceOk?: boolean;
  slotCoverageOk?: boolean;
  docCoverageOk?: boolean;
  missingSlots?: string[];
  retrievalConfidence?: number;
};

type HelixAskCompactionSummary = {
  applied: boolean;
  kept: number;
  dropped: number;
  maxBlocks: number;
  maxBytes: number;
  maxPerFile: number;
  policy: string;
};

type HelixAskPromptItem = {
  id: string;
  type: string;
  label?: string;
  content: string;
  hash: string;
  size: number;
};

type HelixAskCodeSpan = {
  symbol: string;
  filePath: string;
  snippet: string;
  span?: string;
  isTest?: boolean;
};

type HelixAskCodeAlignment = {
  spans: HelixAskCodeSpan[];
  symbols: string[];
  resolved: string[];
};

const executeHelixAsk = async ({
  request,
  personaId,
  responder,
  streamChunk,
  skipReportMode,
  reportContext,
}: HelixAskExecutionArgs): Promise<void> => {
  const parsed = { data: request };
  const askRequestStartedAt = Date.now();
  const askSessionId = parsed.data.sessionId;
  const askTraceId = (parsed.data.traceId?.trim() || `ask:${crypto.randomUUID()}`).slice(0, 128);
  const dryRun = parsed.data.dryRun === true;
  const debugEnabled = parsed.data.debug === true;
  const skipReportModeEffective = Boolean(skipReportMode || HELIX_ASK_SINGLE_LLM);
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
  const liveEventHistory: HelixAskTraceEvent[] = [];
  const pushLiveEvent = (entry: Omit<HelixAskTraceEvent, "ts">): void => {
    if (!captureLiveHistory) return;
    liveEventHistory.push({
      ts: new Date().toISOString(),
      ...entry,
    });
    if (liveEventHistory.length > HELIX_ASK_EVENT_HISTORY_LIMIT) {
      liveEventHistory.splice(0, liveEventHistory.length - HELIX_ASK_EVENT_HISTORY_LIMIT);
    }
  };
  const buildTraceSummary = (
    events: HelixAskTraceEvent[],
    limit = 12,
  ): HelixAskTraceSummary[] => {
    if (!events.length) return [];
    return events
      .filter((entry) => {
        const fn = (entry.meta as { fn?: unknown } | undefined)?.fn;
        return (
          typeof entry.durationMs === "number" &&
          Number.isFinite(entry.durationMs) &&
          entry.durationMs > 0 &&
          typeof fn === "string" &&
          fn.trim().length > 0
        );
      })
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
      .slice(0, limit)
      .map((entry) => ({
        stage: entry.stage,
        detail: entry.detail,
        ok: entry.ok,
        durationMs: entry.durationMs,
        meta: entry.meta,
      }));
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
      meta: typeof startedAt === "number" ? { elapsedMs: Math.max(0, Date.now() - startedAt) } : undefined,
    });
  };
  const HELIX_ASK_EVENT_TOOL = "helix.ask.event";
  const HELIX_ASK_EVENT_VERSION = "v1";
  const HELIX_ASK_EVENT_MAX_CHARS = clampNumber(
    readNumber(
      process.env.HELIX_ASK_EVENT_MAX_CHARS ??
        process.env.VITE_HELIX_ASK_EVENT_MAX_CHARS ??
        process.env.HELIX_ASK_PREVIEW_CHARS ??
        process.env.VITE_HELIX_ASK_PREVIEW_CHARS,
      3000,
    ),
    240,
    20000,
  );
  const HELIX_ASK_ANSWER_PREVIEW_CHARS = clampNumber(
    readNumber(
      process.env.HELIX_ASK_PREVIEW_CHARS ??
        process.env.VITE_HELIX_ASK_PREVIEW_CHARS ??
        process.env.HELIX_ASK_ANSWER_PREVIEW_CHARS ??
        process.env.VITE_HELIX_ASK_ANSWER_PREVIEW_CHARS,
      3000,
    ),
    240,
    20000,
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
    meta?: Record<string, unknown>,
  ): void => {
    if (!askSessionId) return;
    const cleanedDetail = detail?.trim();
    const header = cleanedDetail ? `Helix Ask: ${stage} - ${cleanedDetail}` : `Helix Ask: ${stage}`;
    const body = clipEventText(text);
    const elapsedMs = typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0;
    const baseMeta =
      reportContext?.blockIndex !== undefined
        ? { blockIndex: reportContext.blockIndex, blockCount: reportContext.blockCount }
        : undefined;
    const mergedMeta = meta ? { ...(baseMeta ?? {}), ...meta } : baseMeta;
    appendToolLog({
      tool: HELIX_ASK_EVENT_TOOL,
      version: HELIX_ASK_EVENT_VERSION,
      paramsHash: hashHelixAskProgress(`event:${stage}:${cleanedDetail ?? ""}`),
      durationMs: elapsedMs,
      sessionId: askSessionId,
      traceId: askTraceId,
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
      durationMs: typeof startedAt === "number" ? Math.max(0, Date.now() - startedAt) : 0,
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
  const streamEmitter = createHelixAskStreamEmitter({ sessionId: askSessionId, traceId: askTraceId, onChunk: streamChunk });
  try {
    logDebug("executeHelixAsk START", {
      traceId: askTraceId,
      sessionId: askSessionId ?? null,
    });
    let prompt = parsed.data.prompt?.trim();
    const question = parsed.data.question?.trim();
    let questionValue = question;
    let sessionMemoryForTags: HelixAskSessionMemory | null = null;
    let sessionMemory: HelixAskSessionMemory | null = null;
    let memorySeedSlots: HelixAskSlotPlanEntry[] = [];
    let slotPlanHeadingSeedSlots: HelixAskSlotPlanEntry[] = [];
    let graphSeedSlots: HelixAskSlotPlanEntry[] = [];
    let memoryPinnedFiles: string[] = [];
    let graphTreeLock: string[] = [];
    let slotPlanPass: HelixAskSlotPlanPass | null = null;
    let slotPlanPassSlots: HelixAskSlotPlanEntry[] = [];
    let graphHintTerms: string[] = [];
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
    let evidenceTokens = clampNumber(
      typeof tuningOverrides?.evidence_tokens === "number"
        ? tuningOverrides.evidence_tokens
        : HELIX_ASK_EVIDENCE_TOKENS,
      64,
      1024,
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
      single_llm?: boolean;
      micro_pass?: boolean;
      micro_pass_enabled?: boolean;
      micro_pass_auto?: boolean;
      micro_pass_reason?: string;
      scaffold?: string;
      evidence_cards?: string;
      query_hints?: string[];
      queries?: string[];
      context_files?: string[];
      context_files_count?: number;
      block_scoped?: boolean;
      block_scoped_source?: string;
      is_repo_question?: boolean;
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
      docs_first_used?: boolean;
      docs_first_ok?: boolean;
      docs_first_min_cards?: number;
      docs_first_evidence_cards?: number;
      docs_first_slot_covered?: string[];
      docs_first_slot_missing?: string[];
      docs_first_slot_ratio?: number;
      docs_grep_hits?: number;
      slot_doc_coverage_rate?: number;
      proof_span_rate?: number;
      definition_focus?: boolean;
      definition_doc_required?: boolean;
      definition_doc_ok?: boolean;
      definition_doc_blocks?: number;
        definition_doc_span_rate?: number;
        definition_registry_paths?: string[];
        definition_registry_blocks?: number;
        graph_evidence_count?: number;
        graph_evidence_doc_blocks?: number;
        graph_evidence_code_spans?: number;
        graph_evidence_types?: string[];
        graph_node_acceptance_rate?: number;
        graph_node_acceptance_total?: number;
        graph_node_acceptance_rejected?: number;
        graph_node_acceptance_missing?: string[];
        claim_ref_rate?: number;
      report_mode?: boolean;
      report_mode_reason?: string;
      report_blocks_count?: number;
      report_blocks?: Array<{
        id: string;
        label?: string;
        mode: "repo_grounded" | "hybrid" | "general" | "clarify";
        clarify: boolean;
        citation_count: number;
        answer_preview?: string;
        trace_id?: string;
      }>;
      report_blocks_detail?: Array<{
        id: string;
        label?: string;
        question: string;
        search_query?: string;
        anchor_files?: string[];
        hint_ids?: string[];
        intent_id?: string;
        arbiter_mode?: string;
        clarify?: boolean;
        drift_detected?: boolean;
        evidence_ok?: boolean;
        evidence_match_ratio?: number;
        evidence_match_count?: number;
        evidence_token_count?: number;
        coverage_applied?: boolean;
        coverage_ratio?: number;
        coverage_missing_keys?: string[];
        block_citation_fallback?: boolean;
        block_paths_scrubbed?: string[];
        block_dedupe_applied?: boolean;
        evidence_use_question_tokens?: boolean;
        evidence_signal_tokens?: string[];
        evidence_tokens_preview?: string[];
        evidence_match_preview?: string[];
        topic_tags?: string[];
        context_files?: string[];
        context_files_count?: number;
        block_scoped?: boolean;
        micro_pass?: boolean;
        micro_pass_enabled?: boolean;
        plan_pass_forced?: boolean;
        is_repo_question?: boolean;
        retrieval_confidence?: number;
        retrieval_doc_share?: number;
        retrieval_context_file_count?: number;
        retrieval_query_hit_count?: number;
        retrieval_top_score?: number;
        retrieval_score_gap?: number;
        retrieval_channel_weights?: AskCandidateChannelStats;
        topic_tier?: number;
        topic_must_include_ok?: boolean;
        docs_first_ok?: boolean;
        block_must_include_ok?: boolean;
        block_must_include_missing?: string[];
        block_doc_slot_targets?: string[];
        block_gate_decision?: string;
        belief_gate_applied?: boolean;
        rattling_gate_applied?: boolean;
        doc_header_injected?: number;
        slot_doc_hit_rate?: number;
        slot_alias_coverage_rate?: number;
        duration_ms?: number;
        prefetch_files_count?: number;
      }>;
      report_metrics?: {
        block_count: number;
        block_answer_rate: number;
        block_grounded_rate: number;
        drift_fail_rate: number;
        clarify_with_terms_rate: number;
        avg_block_ms: number;
      };
      agent_loop_enabled?: boolean;
      agent_loop_max_steps?: number;
      agent_loop_budget_ms?: number;
      agent_action_budget_ms?: number;
      clocka_tool_cap?: number;
      agent_loop_steps?: number;
      agent_loop_actions?: HelixAskAgentAction[];
      agent_stop_reason?: string;
      agent_action_counts?: Record<string, number>;
      agent_attempts?: string[];
      controller_steps?: HelixAskControllerStep[];
      controller_stop_reason?: string;
      controller_attempts?: number;
      retrieval_iterations?: number;
      prompt_items?: Array<{
        type: string;
        hash: string;
        size: number;
        label?: string;
      }>;
      prompt_item_count?: number;
      tool_results_block?: string;
      tool_results_hash?: string;
      tool_results_items?: string[];
      tool_results_present?: boolean;
      tool_results_fallback_applied?: boolean;
      tool_results_fallback_reason?: string;
      compaction_applied?: boolean;
      compaction_dropped?: number;
      compaction_kept?: number;
      compaction_policy?: string;
      compaction_budget?: {
        maxBlocks: number;
        maxBytes: number;
        maxPerFile: number;
      };
      code_alignment_applied?: boolean;
      code_alignment_symbols?: string[];
      code_alignment_resolved?: string[];
      code_spans_added?: number;
      tree_walk_bound_nodes?: number;
      tree_walk_binding_rate?: number;
      tree_citation_share?: number;
      tree_citation_total?: number;
      tree_citation_tree?: number;
      tree_citation_non_tree?: number;
      plan_scope_allowlist_tiers?: number;
      plan_scope_avoidlist?: number;
      plan_scope_must_include?: number;
      plan_scope_must_include_missing?: string[];
      block_must_include_ok?: boolean;
      block_must_include_missing?: string[];
      block_doc_slot_targets?: string[];
      block_gate_decision?: string;
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
      concept_fast_path_blocked_reason?: string;
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
      answer_token_budget?: number;
      answer_token_cap?: number;
      answer_token_base?: number;
      answer_token_boosts?: string[];
      answer_token_reason?: string;
      answer_retry_applied?: boolean;
      answer_retry_reason?: string;
      answer_retry_max_tokens?: number;
      answer_short_sentences?: number;
      answer_short_tokens?: number;
      answer_short_fallback_applied?: boolean;
      answer_short_fallback_reason?: string;
      answer_extension_available?: boolean;
      answer_extension_items?: number;
      answer_extension_doc_items?: number;
      answer_extension_code_items?: number;
      answer_extension_appended?: boolean;
      answer_raw_text?: string;
      answer_after_format?: string;
      answer_after_fallback?: string;
      answer_final_text?: string;
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
      runtime_budget_level?: "OK" | "WARNING" | "OVER";
      runtime_budget_recommend?: string;
      runtime_budget_signals?: Record<string, unknown>;
      plan_pass_used?: boolean;
      plan_pass_forced?: boolean;
      slot_plan_pass_used?: boolean;
      slot_plan_pass?: {
        slots: Array<{
          label: string;
          aliases?: string[];
          surfaces?: string[];
          required?: boolean;
          clarify?: string[];
        }>;
        expected_surfaces?: string[];
        clarify_candidates?: string[];
      };
      session_memory_used?: boolean;
      session_memory_pinned?: string[];
      session_memory_slots?: Array<{
        id: string;
        label: string;
        aliases?: string[];
      }>;
      session_memory_last_clarify?: string[];
      graph_pack_lock?: {
        requested?: string[];
        applied?: string[];
      };
      graph_congruence_region?: Record<string, boolean>;
      graph_congruence_chart?: string;
      graph_framework?: {
        primary?: string;
        locked?: string[];
        trees: Array<{
          tree: string;
          anchors: string[];
          nodes: string[];
          source: string;
          score?: number | null;
          congruence?: {
            inventory?: {
              nodesCount: number;
              evaluatedEdges: number;
              blockedLinkCount: number;
            };
            allowedEdges?: number;
            blockedEdges?: number;
            resolvedInTreeEdges?: number;
            resolvedCrossTreeEdges?: number;
            blockedByReason?: Record<string, number>;
            blockedByCondition?: Record<string, number>;
            strictSignals?: Record<string, boolean>;
          } | null;
        }>;
      };
      graph_congruence_diagnostics?: {
        treeCount: number;
        allowedEdges: number;
        blockedEdges: number;
        resolvedInTreeEdges: number;
        resolvedCrossTreeEdges: number;
        blockedByReason: Record<string, number>;
        blockedByCondition: Record<string, number>;
        strictSignals: {
          B_equals_1: boolean;
          qi_metric_derived_equals_true: boolean;
          qi_strict_ok_equals_true: boolean;
          theta_geom_equals_true: boolean;
          vdb_two_wall_support_equals_true: boolean;
          ts_metric_derived_equals_true: boolean;
          cl3_metric_t00_available_equals_true: boolean;
          cl3_rho_gate_equals_true: boolean;
        };
      };
      graph_framework_applied?: boolean;
      graph_hint_terms?: string[];
      tree_walk?: HelixAskTreeWalkMetrics;
      tree_walk_mode?: HelixAskTreeWalkMode;
      tree_walk_max_steps?: number;
      tree_walk_lines?: number;
      tree_walk_block_present?: boolean;
      tree_walk_injected?: boolean;
      tree_walk_in_answer?: boolean;
      answer_retry_model_error?: string;
      answer_generation_failed?: boolean;
      answer_model_error?: string;
      answer_fallback_used?: boolean;
      answer_fallback_reason?: string;
      plan_directives?: HelixAskPlanDirectives;
      slot_plan?: Array<{
        id: string;
        label: string;
        required: boolean;
        source: string;
        surfaces?: string[];
        aliases?: string[];
        evidence_criteria?: string[];
      }>;
      slot_count?: number;
      slot_required_count?: number;
      slot_evidence?: Array<{
        id: string;
        label: string;
        doc_card_count: number;
        alias_card_count: number;
        evidence_gate_ok?: boolean;
        coverage_ratio: number;
        missing_slots: string[];
      }>;
      fallback_reason?: string;
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
      evidence_use_question_tokens?: boolean;
      evidence_signal_tokens?: string[];
      evidence_tokens_preview?: string[];
      evidence_match_preview?: string[];
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
      retrieval_channel_weights?: AskCandidateChannelStats;
      doc_header_injected?: number;
      slot_coverage_required?: string[];
      slot_coverage_missing?: string[];
      slot_coverage_ratio?: number;
      slot_coverage_ok?: boolean;
      hard_required_slots?: string[];
      hard_required_slot_count?: number;
      coverage_slots_source?: "request" | "concept" | "none";
      slot_tiers?: Array<{
        id: string;
        label: string;
        source: HelixAskSlotPlanEntry["source"];
        required: boolean;
        tier: "A" | "B" | "C";
      }>;
      slot_tier_counts?: { A: number; B: number; C: number };
      slot_doc_hit_rate?: number;
      slot_alias_coverage_rate?: number;
      slot_dominance_margin?: number;
      grounded_sentence_rate?: number;
      scientific_response_applied?: boolean;
      hypothesis_enabled?: boolean;
      hypothesis_count?: number;
      hypothesis_rate?: number;
      next_evidence_count?: number;
      next_evidence_coverage?: number;
      ambiguity_clarify_rate?: number;
      clarify_precision?: number;
      coverage_slots_required?: string[];
      coverage_slots_covered?: string[];
      coverage_slots_missing?: string[];
      coverage_slots_ratio?: number;
      repo_search_terms?: string[];
      repo_search_paths?: string[];
      repo_search_reason?: string;
      repo_search_explicit?: boolean;
      repo_search_hits?: number;
      repo_search_truncated?: boolean;
      repo_search_error?: string;
      preflight_repo_search_terms?: string[];
      preflight_repo_search_paths?: string[];
      preflight_repo_search_reason?: string;
      preflight_repo_search_hits?: number;
      preflight_repo_search_truncated?: boolean;
      preflight_repo_search_error?: string;
      preflight_queries?: string[];
      preflight_files?: string[];
      preflight_file_count?: number;
      preflight_doc_share?: number;
      preflight_evidence_ok?: boolean;
      preflight_evidence_ratio?: number;
      preflight_retrieval_upgrade?: boolean;
      preflight_reuse?: boolean;
      endpoint_hints?: string[];
      endpoint_anchor_paths?: string[];
      endpoint_anchor_violation?: boolean;
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
      drift_repair_applied?: boolean;
      drift_repair_attempts?: number;
      drift_repair_improved?: boolean;
      coverage_token_count?: number;
      coverage_key_count?: number;
      coverage_missing_key_count?: number;
      coverage_ratio?: number;
      coverage_missing_keys?: string[];
      coverage_gate_applied?: boolean;
      coverage_gate_reason?: string;
      definition_doc_filtered?: boolean;
      definition_doc_paths?: string[];
      report_mode_bypass?: {
        reason?: string;
        block_count?: number;
      };
      claim_ledger?: Array<{
        id: string;
        type: string;
        supported: boolean;
        evidence_refs: string[];
        proof: string;
      }>;
      uncertainty_register?: Array<{
        id: string;
        type: string;
        reason: string;
      }>;
      constraint_matrix?: {
        section_count: number;
        constraints: Array<{
          id: string;
          satisfied: boolean;
          detail?: string;
        }>;
      };
      ambiguity_resolver_applied?: boolean;
      ambiguity_resolver_reason?: string;
      ambiguity_resolver_candidates?: string[];
      ambiguity_resolver_token_count?: number;
      ambiguity_resolver_short_prompt?: boolean;
      ambiguity_resolver_top_score?: number;
      ambiguity_resolver_margin?: number;
      ambiguity_evidence_pass?: boolean;
      ambiguity_evidence_scores?: Array<{
        label: string;
        score: number;
        docShare: number;
        matchRatio: number;
      }>;
      ambiguity_selected?: string;
      ambiguity_target_span?: string;
      ambiguity_cluster_count?: number;
      ambiguity_cluster_top_mass?: number;
      ambiguity_cluster_margin?: number;
      ambiguity_cluster_entropy?: number;
      ambiguity_cluster_candidates?: Array<{
        label: string;
        score: number;
        mass: number;
        count: number;
      }>;
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
          targetSpan?: string;
          clusterCount?: number;
          clusterTopMass?: number;
          clusterMargin?: number;
          clusterEntropy?: number;
          clusterCandidates?: Array<{
            label: string;
            score: number;
            mass: number;
            count: number;
          }>;
          gateApplied?: boolean;
          terms?: string[];
        };
      };
      answer_path?: string[];
      trace_id?: string;
      session_id?: string;
      live_events?: HelixAskTraceEvent[];
      trace_events?: HelixAskTraceEvent[];
      trace_summary?: HelixAskTraceSummary[];
    } | undefined = debugEnabled
      ? { two_pass: false, micro_pass: false }
      : undefined;
    if (debugPayload) {
      debugPayload.trace_id = askTraceId;
      if (askSessionId) {
        debugPayload.session_id = askSessionId;
      }
    }
    const agentLoopEnabled = HELIX_ASK_AGENT_LOOP;
    const runtimeContract = loadRuntimeFrameContract();
    const agentLoopMaxSteps = Math.max(1, Math.min(HELIX_ASK_AGENT_LOOP_MAX_STEPS, runtimeContract.clockA.max_plan_steps));
    const agentActionBudgetMs = HELIX_ASK_AGENT_ACTION_BUDGET_MS;
    const agentLoopBudgetMs = HELIX_ASK_AGENT_LOOP_BUDGET_MS;
    const agentStart = Date.now();
    const agentActions: HelixAskAgentAction[] = [];
    const agentActionCounts: Record<string, number> = {};
    let agentActionOverBudget = false;
    const agentStepActions = new Set([
      "retrieve_docs_first",
      "retrieve_mixed",
      "retrieve_code_first",
      "slot_local_retry",
      "ask_slot_clarify",
    ]);
    let agentStopReason: string | null = null;
    const getAgentStepCount = (): number =>
      agentActions.filter((entry) => agentStepActions.has(entry.action)).length;
    const updateAgentDebug = (): void => {
      if (!debugPayload) return;
      debugPayload.agent_loop_enabled = agentLoopEnabled;
      debugPayload.agent_loop_max_steps = agentLoopMaxSteps;
      debugPayload.agent_loop_budget_ms = agentLoopBudgetMs;
      debugPayload.agent_action_budget_ms = agentActionBudgetMs;
      debugPayload.clocka_tool_cap = runtimeContract.clockA.max_tool_calls;
      debugPayload.agent_loop_steps = getAgentStepCount();
      debugPayload.agent_loop_actions = agentActions.slice();
      debugPayload.agent_stop_reason = agentStopReason ?? undefined;
      debugPayload.agent_action_counts = { ...agentActionCounts };
      debugPayload.agent_attempts = agentActions.map((entry) => entry.action);
    };
    const recordAgentAction = (
      action: string,
      reason: string,
      expectedGain?: string,
      observedDelta?: string,
      ok = true,
      durationMs?: number,
    ): void => {
      if (!agentLoopEnabled) return;
      const overBudget =
        typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > agentActionBudgetMs;
      if (overBudget) {
        agentActionOverBudget = true;
        if (!agentStopReason) {
          agentStopReason = "action_budget_exhausted";
        }
      }
      const entry: HelixAskAgentAction = {
        action,
        reason,
        expectedGain,
        observedDelta,
        durationMs,
        overBudget,
        ok: ok && !overBudget,
        ts: new Date().toISOString(),
      };
      agentActions.push(entry);
      agentActionCounts[action] = (agentActionCounts[action] ?? 0) + 1;
      updateAgentDebug();
      logEvent(
        "Agent action",
        action,
        [
          reason ? `reason=${reason}` : "",
          expectedGain ? `gain=${expectedGain}` : "",
          observedDelta ? `delta=${observedDelta}` : "",
          typeof durationMs === "number" ? `durationMs=${durationMs}` : "",
          overBudget ? "over_budget=true" : "",
        ]
          .filter(Boolean)
          .join(" | "),
      );
    };
    const controllerSteps: HelixAskControllerStep[] = [];
    let controllerStopLogged = false;
    const buildControllerDetail = (step: HelixAskControllerStep): string => {
      const missing =
        step.missingSlots && step.missingSlots.length > 0
          ? step.missingSlots.slice(0, 3).join(",")
          : "";
      return [
        step.action ? `action=${step.action}` : "",
        step.reason ? `reason=${step.reason}` : "",
        typeof step.evidenceOk === "boolean" ? `evidence=${step.evidenceOk ? "ok" : "fail"}` : "",
        typeof step.slotCoverageOk === "boolean"
          ? `slots=${step.slotCoverageOk ? "ok" : "missing"}`
          : "",
        typeof step.docCoverageOk === "boolean"
          ? `docs=${step.docCoverageOk ? "ok" : "missing"}`
          : "",
        typeof step.retrievalConfidence === "number"
          ? `conf=${step.retrievalConfidence.toFixed(2)}`
          : "",
        missing ? `missing=${missing}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    };
    const recordControllerStep = (step: HelixAskControllerStep): void => {
      controllerSteps.push(step);
      if (debugPayload) {
        debugPayload.controller_steps = controllerSteps.slice();
        debugPayload.controller_attempts = controllerSteps.length;
      }
      logEvent("Controller step", step.step, buildControllerDetail(step));
    };
    const recordControllerStop = (reason: string, detail?: string): void => {
      if (controllerStopLogged) return;
      controllerStopLogged = true;
      if (debugPayload) {
        debugPayload.controller_stop_reason = reason;
      }
      logEvent("Controller stop", reason, detail);
    };
    const getAgentBlockReason = (): string | null => {
      if (!agentLoopEnabled) return null;
      const stepCount = getAgentStepCount();
      if (agentActionOverBudget) return "action_budget_exhausted";
      if (stepCount >= runtimeContract.clockA.max_tool_calls) return "clocka_tool_cap";
      if (stepCount >= agentLoopMaxSteps) return "max_steps";
      if (Date.now() - agentStart > agentLoopBudgetMs) return "budget_exhausted";
      return null;
    };
    const markAgentStopIfBlocked = (): void => {
      const reason = getAgentBlockReason();
      if (!reason || agentStopReason) return;
      agentStopReason = reason;
      updateAgentDebug();
      recordControllerStop(reason, "blocked");
    };
    const canAgentAct = (): boolean => {
      if (!agentLoopEnabled) return false;
      return getAgentBlockReason() === null;
    };
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
      debugPayload.hypothesis_enabled = HELIX_ASK_HYPOTHESIS;
      updateAgentDebug();
    }
    const answerPath: string[] = [];
    if (!questionValue && prompt) {
      const extracted = extractQuestionFromPrompt(prompt);
      if (extracted) {
        questionValue = extracted;
      }
    }
    const baseQuestion = (questionValue ?? question ?? "").trim();
    const definitionFocus = isDefinitionQuestion(baseQuestion);
    if (definitionFocus) {
      evidenceTokens = clampNumber(
        evidenceTokens + HELIX_ASK_DEFINITION_EVIDENCE_BOOST,
        64,
        1024,
      );
    }
    if (debugPayload) {
      debugPayload.single_llm = HELIX_ASK_SINGLE_LLM;
      debugPayload.definition_focus = definitionFocus;
      debugPayload.evidence_tokens = evidenceTokens;
    }
    const rawQuestion = (request.question ?? request.prompt ?? "").trim();
    const requestCoverageSlots = Array.isArray(parsed.data.coverageSlots)
      ? parsed.data.coverageSlots.map(normalizeSlotId)
      : [];
    const coverageSlotsFromRequest = requestCoverageSlots.length > 0;
    const reportBlockScoped = Boolean(reportContext?.blockIndex);
    const blockScoped = coverageSlotsFromRequest || reportBlockScoped;
    if (debugPayload) {
      debugPayload.block_scoped = blockScoped;
      if (reportBlockScoped && !coverageSlotsFromRequest) {
        debugPayload.block_scoped_source = "report_context";
      } else if (coverageSlotsFromRequest) {
        debugPayload.block_scoped_source = "coverage_slots";
      }
    }
    const blockSearchSeed =
      blockScoped && parsed.data.searchQuery?.trim()
        ? parsed.data.searchQuery.trim()
        : blockScoped && requestCoverageSlots.length > 0
          ? requestCoverageSlots.join(" ")
          : "";
    const slotPreviewSeed =
      blockScoped && blockSearchSeed
        ? blockSearchSeed
        : rawQuestion || baseQuestion;
    const slotPreviewCandidates = listConceptCandidates(slotPreviewSeed, 4);
    sessionMemoryForTags =
      HELIX_ASK_SESSION_MEMORY && parsed.data.sessionId
        ? getHelixAskSessionMemory(parsed.data.sessionId)
        : null;
    sessionMemory = sessionMemoryForTags;
    memorySeedSlots = buildMemorySeedSlots(slotPreviewSeed, sessionMemory);
    const headingSeedSlots = buildDocHeadingSeedSlots(slotPreviewSeed);
    memoryPinnedFiles = sessionMemory?.pinnedFiles ?? [];
    graphTreeLock = sessionMemoryForTags?.graphTreeIds?.slice() ?? [];
    if (headingSeedSlots.length > 0) {
      recordAgentAction("expand_heading_aliases", "doc_heading_seed_slots", "seed_slot_aliases");
    }
    if (memoryPinnedFiles.length > 0) {
      recordAgentAction("expand_filename_aliases", "session_pinned_files", "boost_query_hints");
    }
    let slotPreview = buildCanonicalSlotPlan({
      question: slotPreviewSeed,
      candidates: slotPreviewCandidates,
      seedSlots: [...memorySeedSlots, ...headingSeedSlots],
    });
    const initialReportQuestion = rawQuestion || baseQuestion;
    const ideologyConversationCandidate = findConceptMatch(initialReportQuestion, {
      intentId: "repo.ideology_reference",
    });
    const isIdeologyNarrativeQuery = HELIX_ASK_IDEOLOGY_NARRATIVE_QUERY_RE.test(initialReportQuestion);
    let reportDecision = resolveReportModeDecision(initialReportQuestion);
    const isIdeologyConversationalCandidate =
      Boolean(ideologyConversationCandidate) &&
      shouldUseIdeologyConversationalMode(
        initialReportQuestion,
        reportDecision.tokenCount,
        reportDecision.charCount,
        {
          explicitReportCue: reportDecision.reason === "explicit_report_request",
          blockScoped,
        },
      );
    if (
      isIdeologyConversationalCandidate &&
      !blockScoped &&
      reportDecision.reason !== "explicit_report_request"
    ) {
      reportDecision = {
        ...reportDecision,
        enabled: false,
        reason: "ideology_chat_mode",
      };
    }
    if (
      !isIdeologyConversationalCandidate &&
      !reportDecision.enabled &&
      slotPreview.coverageSlots.length >= 2
    ) {
      reportDecision = {
        ...reportDecision,
        enabled: true,
        reason: "multi_slot",
        blockCount: slotPreview.coverageSlots.length,
      };
    }
    const slotPreviewWeakOnly = slotPreview.slots.length > 0 && slotPreview.slots.every((slot) => isWeakSlot(slot));
    if (
      HELIX_ASK_SLOT_PLAN_PASS &&
      !HELIX_ASK_SINGLE_LLM &&
      !dryRun &&
      !blockScoped &&
      baseQuestion &&
      (slotPreviewWeakOnly || slotPreview.coverageSlots.length < 2)
    ) {
      const slotPlanTokens = HELIX_ASK_SLOT_PLAN_PASS_TOKENS;
      const slotPlanStart = logStepStart(
        "LLM slot plan pass",
        `tokens=${slotPlanTokens}`,
        {
          maxTokens: slotPlanTokens,
          fn: "runHelixAskLocalWithOverflowRetry",
          label: "slot_plan_pass",
          prompt: "buildHelixAskSlotPlanPrompt",
        },
      );
      try {
        const slotPlanPrompt = buildHelixAskSlotPlanPrompt(baseQuestion, {
          conceptCandidates: slotPreviewCandidates,
        });
        const { result: slotPlanResult } = await runHelixAskLocalWithOverflowRetry(
          {
            prompt: slotPlanPrompt,
            max_tokens: slotPlanTokens,
            temperature: Math.min(parsed.data.temperature ?? 0.2, 0.35),
            seed: parsed.data.seed,
            stop: parsed.data.stop,
          },
          {
            personaId,
            sessionId: parsed.data.sessionId,
            traceId: askTraceId,
          },
          {
            fallbackMaxTokens: slotPlanTokens,
            allowContextDrop: true,
            label: "slot_plan_pass",
          },
        );
        slotPlanPass = parseSlotPlanPassResult(slotPlanResult.text ?? "");
        slotPlanPassSlots = buildSlotPlanPassEntries(slotPlanPass);
        if (slotPlanPassSlots.length > 0) {
          slotPreview = buildCanonicalSlotPlan({
            question: slotPreviewSeed,
            candidates: slotPreviewCandidates,
            seedSlots: [...memorySeedSlots, ...headingSeedSlots, ...slotPlanPassSlots],
          });
        }
        logStepEnd(
          "LLM slot plan pass",
          `slots=${slotPlanPassSlots.length}`,
          slotPlanStart,
          true,
          {
            slotCount: slotPlanPassSlots.length,
            fn: "runHelixAskLocalWithOverflowRetry",
            label: "slot_plan_pass",
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logStepEnd(
          "LLM slot plan pass",
          message,
          slotPlanStart,
          false,
          { fn: "runHelixAskLocalWithOverflowRetry", label: "slot_plan_pass" },
        );
        slotPlanPass = null;
        slotPlanPassSlots = [];
      }
    }
    if (!isIdeologyConversationalCandidate && !reportDecision.enabled && slotPreview.coverageSlots.length >= 2) {
      reportDecision = {
        ...reportDecision,
        enabled: true,
        reason: "slot_plan",
        blockCount: slotPreview.coverageSlots.length,
      };
    }
    if (reportDecision.enabled && !blockScoped && agentActionCounts.switch_report_mode === undefined) {
      recordAgentAction(
        "switch_report_mode",
        reportDecision.reason ?? "multi_slot",
        "decompose_multi_slot_prompt",
      );
    }
    if (debugPayload) {
      debugPayload.report_mode = reportDecision.enabled;
      debugPayload.report_mode_reason = reportDecision.reason;
      debugPayload.report_blocks_count = reportDecision.blockCount;
      debugPayload.slot_plan_pass_used = slotPlanPassSlots.length > 0;
      if (slotPlanPass) {
        debugPayload.slot_plan_pass = {
          slots: slotPlanPass.slots.map((slot) => ({
            label: slot.label,
            aliases: slot.aliases ?? [],
            surfaces: slot.surfaces ?? [],
            required: slot.required,
            clarify: slot.clarify ?? [],
          })),
          expected_surfaces: slotPlanPass.expected_surfaces,
          clarify_candidates: slotPlanPass.clarify_candidates,
        };
      }
      debugPayload.session_memory_used = Boolean(sessionMemory);
      if (sessionMemory) {
        debugPayload.session_memory_pinned = sessionMemory.pinnedFiles.slice(0, 6);
        debugPayload.session_memory_last_clarify = sessionMemory.lastClarifySlots.slice(0, 4);
        debugPayload.session_memory_slots = Object.values(sessionMemory.slots).map((slot) => ({
          id: slot.id,
          label: slot.label,
          aliases: slot.aliases.slice(0, 4),
        }));
      }
    }
    if (reportDecision.enabled && !skipReportModeEffective && baseQuestion) {
      const slotBlocks =
        slotPreview.coverageSlots.length > 0 ? buildSlotReportBlocks(slotPreview, baseQuestion) : [];
      const reportBlocks = slotBlocks.length ? slotBlocks : buildReportBlocks(baseQuestion);
      const limitedBlocks = reportBlocks.slice(0, HELIX_ASK_REPORT_MAX_BLOCKS);
      const omittedCount = Math.max(0, reportBlocks.length - limitedBlocks.length);
      const inferredReportReason = reportDecision.reason ?? "enabled";
      const bypassSingleBlock =
        (inferredReportReason === "multi_slot" || inferredReportReason === "slot_plan") &&
        limitedBlocks.length <= 1;
      if (bypassSingleBlock) {
        if (debugPayload) {
          debugPayload.report_mode = false;
          debugPayload.report_mode_reason = "single_block_bypass";
          debugPayload.report_blocks_count = limitedBlocks.length;
          debugPayload.report_mode_bypass = {
            reason: inferredReportReason,
            block_count: limitedBlocks.length,
          };
        }
        reportDecision = {
          ...reportDecision,
          enabled: false,
          reason: "single_block_bypass",
          blockCount: limitedBlocks.length,
        };
      }
      if (!bypassSingleBlock) {
      const reportExplicitRepo =
        HELIX_ASK_REPO_FORCE.test(rawQuestion) ||
        HELIX_ASK_REPO_EXPECTS.test(rawQuestion) ||
        HELIX_ASK_FILE_HINT.test(rawQuestion);
      const reportRepoContext =
        reportExplicitRepo ||
        HELIX_ASK_REPO_HINT.test(rawQuestion) ||
        /helix ask|codebase|repository|repo|arbiter|evidence gate|constraint/i.test(rawQuestion);
      const helixAskAnchorFiles = reportRepoContext && /helix ask/i.test(rawQuestion)
        ? [
            "server/routes/agi.plan.ts",
            "server/services/helix-ask/arbiter.ts",
            "server/services/helix-ask/platonic-gates.ts",
            "server/services/helix-ask/query.ts",
            "docs/helix-ask-flow.md",
          ]
        : [];
      logEvent(
        "Report mode",
        "start",
        reportDecision.reason ?? "enabled",
      );
      if (debugPayload) {
        debugPayload.report_blocks_count = limitedBlocks.length;
      }
      if (dryRun) {
        const responsePayload = debugPayload
          ? { text: "", report_mode: true, debug: debugPayload, dry_run: true }
          : { text: "", report_mode: true, dry_run: true };
        responder.send(200, responsePayload);
        return;
      }
      const blockResults: HelixAskReportBlockResult[] = [];
      const reportLiveEvents: HelixAskTraceEvent[] = [];
      const reportBlockDetails: Array<{
        id: string;
        label?: string;
        question: string;
        search_query?: string;
        anchor_files?: string[];
        hint_ids?: string[];
        intent_id?: string;
        arbiter_mode?: string;
        clarify?: boolean;
        drift_detected?: boolean;
        evidence_ok?: boolean;
        evidence_match_ratio?: number;
        evidence_match_count?: number;
        evidence_token_count?: number;
        coverage_applied?: boolean;
        coverage_ratio?: number;
        coverage_missing_keys?: string[];
        evidence_use_question_tokens?: boolean;
        evidence_signal_tokens?: string[];
        evidence_tokens_preview?: string[];
        evidence_match_preview?: string[];
        topic_tags?: string[];
        context_files?: string[];
        context_files_count?: number;
        block_scoped?: boolean;
        micro_pass?: boolean;
        micro_pass_enabled?: boolean;
        plan_pass_forced?: boolean;
        is_repo_question?: boolean;
        block_citation_fallback?: boolean;
        block_paths_scrubbed?: string[];
        block_dedupe_applied?: boolean;
        retrieval_confidence?: number;
        retrieval_doc_share?: number;
        retrieval_context_file_count?: number;
        retrieval_query_hit_count?: number;
        retrieval_top_score?: number;
        retrieval_score_gap?: number;
        retrieval_channel_weights?: AskCandidateChannelStats;
        topic_tier?: number;
        topic_must_include_ok?: boolean;
        docs_first_ok?: boolean;
        block_must_include_ok?: boolean;
        block_must_include_missing?: string[];
        block_doc_slot_targets?: string[];
        block_gate_decision?: string;
        belief_gate_applied?: boolean;
        rattling_gate_applied?: boolean;
        doc_header_injected?: number;
        slot_doc_hit_rate?: number;
        slot_alias_coverage_rate?: number;
        duration_ms?: number;
        prefetch_files_count?: number;
      }> = [];
      for (let index = 0; index < limitedBlocks.length; index += 1) {
        const block = limitedBlocks[index];
        const blockTraceId = `${askTraceId}:b${index + 1}`.slice(0, 128);
        const blockStart = Date.now();
        const blockText = normalizeReportBlockText(block.text);
        const blockTextForQuestion = blockText || block.text;
        const blockHints = resolveReportBlockHints(block.text, { typeHint: block.typeHint });
        const blockHasRepoCue =
          HELIX_ASK_REPO_FORCE.test(blockTextForQuestion) ||
          HELIX_ASK_REPO_EXPECTS.test(blockTextForQuestion) ||
          HELIX_ASK_REPO_HINT.test(blockTextForQuestion) ||
          HELIX_ASK_FILE_HINT.test(blockTextForQuestion) ||
          REPORT_BLOCK_REPO_CUE_RE.test(blockTextForQuestion);
        const slotRepoContext = Boolean(block.slotId);
        const blockRepoContext =
          slotRepoContext ||
          reportRepoContext ||
          reportExplicitRepo ||
          blockHints.repoFocus ||
          blockHasRepoCue;
        const blockAnchorFiles = Array.from(
          new Set([...helixAskAnchorFiles, ...blockHints.anchorFiles]),
        );
        const slotScopeOverride =
          block.typeHint === "concept"
            ? buildSlotReportBlockScopeOverride(block.slotSurfaces ?? [], block.slotId)
            : null;
        const blockScopeOverride = blockRepoContext
          ? buildReportBlockScopeOverride(blockAnchorFiles, blockHints.hintIds)
          : {};
        const mergedBlockScopeOverride = slotScopeOverride
          ? mergePlanScope(blockScopeOverride, slotScopeOverride)
          : blockScopeOverride;
        const needsRepoPrefix =
          blockRepoContext &&
          !HELIX_ASK_REPO_FORCE.test(blockTextForQuestion) &&
          !HELIX_ASK_REPO_EXPECTS.test(blockTextForQuestion) &&
          !HELIX_ASK_REPO_HINT.test(blockTextForQuestion) &&
          !HELIX_ASK_FILE_HINT.test(blockTextForQuestion);
        const needsHelixAskAnchor =
          blockRepoContext &&
          blockAnchorFiles.length > 0 &&
          !/helix ask/i.test(blockTextForQuestion);
        const needsCitationPrompt =
          blockRepoContext &&
          !/\b(cite|citation|file|path|source)\b/i.test(blockTextForQuestion);
        const prefix = needsHelixAskAnchor
          ? "In this repo's Helix Ask system, "
          : needsRepoPrefix
            ? "In this repo, "
            : "";
        const baseBlockQuestion = `${prefix}${blockTextForQuestion}`.trim();
        const anchorHint =
          blockAnchorFiles.length > 0 ? `Use files: ${blockAnchorFiles.join(", ")}.` : "";
        const baseSlotAliasText = (block.slotAliases ?? [])
          .map((alias) => alias.trim())
          .filter(Boolean)
          .slice(0, 4);
        if (block.slotId) {
          baseSlotAliasText.push(block.slotId.replace(/-/g, " "));
        }
        const slotAliasText = baseSlotAliasText.length
          ? `Use slot terms: ${Array.from(new Set(baseSlotAliasText)).join(", ")}.`
          : "";
        const baseEvidenceText = (block.slotEvidenceCriteria ?? [])
          .map((entry) => entry.trim())
          .filter(Boolean)
          .slice(0, 3);
        const evidenceText = baseEvidenceText.length
          ? `Evidence target: ${Array.from(new Set(baseEvidenceText)).join(", ")}.`
          : "";
        const blockQuestion = needsCitationPrompt
          ? `${baseBlockQuestion} Cite repo file paths. ${anchorHint} ${slotAliasText} ${evidenceText}`.trim()
          : `${baseBlockQuestion} ${anchorHint} ${slotAliasText} ${evidenceText}`.trim();
        const blockQueryText = block.slotId ? "" : blockTextForQuestion;
        const blockSearchQuery = buildReportBlockSearchQuery({
          blockText: blockQueryText,
          searchTerms: block.slotId ? [] : blockHints.searchTerms,
          anchorFiles: block.slotId ? [] : blockAnchorFiles,
          reportRepoContext: blockRepoContext,
          slotAliases: block.slotAliases,
          slotEvidenceCriteria: block.slotEvidenceCriteria,
          slotId: block.slotId,
          includeHelixAsk: block.slotId ? false : blockHints.includeHelixAsk,
        });
        const blockSearchSeed =
          blockSearchQuery ||
          (block.slotId ? block.slotId.replace(/-/g, " ") : blockTextForQuestion);
        const blockHeadingSeedSlots = buildDocHeadingSeedSlots(blockSearchSeed);
        let blockPrefetchContext: { context: string; files: string[] } | null = null;
        if (blockRepoContext && blockSearchSeed) {
          const prefetchStart = Date.now();
          const blockTopicTags = inferHelixAskTopicTags(blockSearchSeed, blockSearchSeed);
          const blockTopicProfile = buildHelixAskTopicProfile(blockTopicTags);
          const basePrefetchQueries = buildHelixAskSearchQueries(blockSearchSeed, blockTopicTags);
          const prefetchHints = [
            ...(block.slotAliases ?? []),
            ...(block.slotEvidenceCriteria ?? []),
            ...blockAnchorFiles,
          ];
          const prefetchQueries = mergeHelixAskQueries(
            basePrefetchQueries,
            prefetchHints,
            HELIX_ASK_QUERY_MERGE_MAX,
          );
          if (prefetchQueries.length > 0) {
            const prefetchOptions = mergedBlockScopeOverride
              ? {
                  allowlistTiers: mergedBlockScopeOverride.allowlistTiers,
                  avoidlist: mergedBlockScopeOverride.avoidlist,
                  overrideAllowlist: mergedBlockScopeOverride.overrideAllowlist,
                }
              : undefined;
            const prefetchResult = await buildAskContextFromQueries(
              blockQuestion,
              prefetchQueries,
              parsed.data.topK,
              blockTopicProfile,
              prefetchOptions,
            );
            if (prefetchResult.context) {
              blockPrefetchContext = {
                context: prefetchResult.context,
                files: prefetchResult.files.slice(),
              };
            }
          }
          logEvent(
            "Report block prefetch",
            blockPrefetchContext ? "ok" : "miss",
            `files=${blockPrefetchContext?.files.length ?? 0}`,
            prefetchStart,
          );
        }
        logEvent(
          "Report block",
          "start",
          `block=${index + 1}/${limitedBlocks.length}`,
          blockStart,
        );
        if (
          blockRepoContext &&
          (blockAnchorFiles.length > 0 || mergedBlockScopeOverride.allowlistTiers)
        ) {
          logEvent(
            "Report block scope",
            `block=${index + 1}`,
            [
              blockAnchorFiles.length ? `anchors=${blockAnchorFiles.length}` : "",
              mergedBlockScopeOverride.allowlistTiers?.length
                ? `tiers=${mergedBlockScopeOverride.allowlistTiers.length}`
                : "",
              blockHints.hintIds.length ? `hints=${blockHints.hintIds.join(",")}` : "",
            ]
              .filter(Boolean)
              .join(" | "),
            blockStart,
          );
        }
        let blockPayload: { status: number; payload: any } | null = null;
          await executeHelixAsk({
          request: {
            ...request,
            question: blockQuestion,
            prompt: undefined,
            traceId: blockTraceId,
            debug: debugEnabled,
            context: blockPrefetchContext?.context,
            contextFiles: blockPrefetchContext?.files,
            searchQuery: blockSearchSeed,
            coverageSlots: block.slotId ? [block.slotId] : undefined,
          },
          personaId,
          responder: {
            send: (status, payload) => {
              blockPayload = { status, payload };
            },
          },
          skipReportMode: true,
          reportContext: {
            parentTraceId: askTraceId,
            blockIndex: index + 1,
            blockCount: limitedBlocks.length,
            planScopeOverride: mergedBlockScopeOverride,
          },
        });
        const resolvedBlockPayload = blockPayload as { status: number; payload: any } | null;
        const failedBlock =
          !resolvedBlockPayload || resolvedBlockPayload.status >= 400;
        const rawBlockAnswer =
          resolvedBlockPayload && resolvedBlockPayload.status < 400
            ? String(resolvedBlockPayload.payload?.text ?? "").trim()
            : "Unable to complete this block. Please clarify or point to the relevant files.";
        const blockDebug = resolvedBlockPayload?.payload?.debug as
          | {
              arbiter_mode?: string;
              clarify_triggered?: boolean;
              evidence_gate_ok?: boolean;
              evidence_match_ratio?: number;
              evidence_match_count?: number;
              evidence_token_count?: number;
              evidence_use_question_tokens?: boolean;
              evidence_signal_tokens?: string[];
              evidence_tokens_preview?: string[];
              evidence_match_preview?: string[];
              coverage_gate_applied?: boolean;
              coverage_ratio?: number;
              coverage_missing_keys?: string[];
              ambiguity_terms?: string[];
              intent_id?: string;
              topic_tags?: string[];
              context_files?: string[];
              context_files_count?: number;
              block_scoped?: boolean;
              micro_pass?: boolean;
              micro_pass_enabled?: boolean;
              plan_pass_forced?: boolean;
              is_repo_question?: boolean;
              retrieval_confidence?: number;
              retrieval_doc_share?: number;
              retrieval_context_file_count?: number;
              retrieval_query_hit_count?: number;
              retrieval_top_score?: number;
              retrieval_score_gap?: number;
              retrieval_channel_weights?: AskCandidateChannelStats;
              topic_tier?: number;
              topic_must_include_ok?: boolean;
              docs_first_ok?: boolean;
              block_must_include_ok?: boolean;
              block_must_include_missing?: string[];
              block_doc_slot_targets?: string[];
              block_gate_decision?: string;
              belief_gate_applied?: boolean;
              rattling_gate_applied?: boolean;
              doc_header_injected?: number;
              slot_doc_hit_rate?: number;
              slot_alias_coverage_rate?: number;
            }
          | undefined;
        const blockLiveEvents = resolvedBlockPayload?.payload?.debug?.live_events as
          | HelixAskTraceEvent[]
          | undefined;
        if (Array.isArray(blockLiveEvents)) {
          reportLiveEvents.push(...blockLiveEvents);
        }
        const evidenceOk = failedBlock ? false : blockDebug?.evidence_gate_ok !== false;
        const coverageApplied = !failedBlock && Boolean(blockDebug?.coverage_gate_applied);
        const driftDetected =
          !failedBlock &&
          (/drifted too far/i.test(rawBlockAnswer) ||
            ((Boolean(blockDebug?.belief_gate_applied) ||
              Boolean(blockDebug?.rattling_gate_applied)) &&
              !evidenceOk));
        let clarify =
          failedBlock ||
          Boolean(blockDebug?.clarify_triggered) ||
          /^what do you mean|please point|could you clarify/i.test(rawBlockAnswer);
        if (blockRepoContext) {
          const repoExpectationFailed = coverageApplied || !evidenceOk;
          if (repoExpectationFailed) {
            clarify = true;
          }
        }
        if (driftDetected) {
          clarify = true;
        }
        const rawMode = failedBlock || driftDetected ? "clarify" : blockDebug?.arbiter_mode ?? "general";
        const mode: HelixAskReportBlockResult["mode"] =
          clarify
            ? "clarify"
            : rawMode === "repo_grounded" || rawMode === "hybrid" || rawMode === "general"
              ? rawMode
              : "general";
        const clarifyTerms = (
          failedBlock && block.label
            ? [block.label]
            : (blockDebug?.coverage_missing_keys ?? blockDebug?.ambiguity_terms ?? [])
        ).slice(0, 2);
        const rawScientific = isScientificMicroReport(rawBlockAnswer);
        let blockAnswer = rawBlockAnswer;
        let blockNextEvidence: string[] = [];
        if (clarify) {
          if (rawScientific) {
            blockNextEvidence = extractNextEvidenceLines(rawBlockAnswer);
            blockAnswer = rawBlockAnswer;
          } else if (HELIX_ASK_SCIENTIFIC_CLARIFY) {
            const clarifyLine = buildReportBlockClarifyLine(
              clarifyTerms,
              blockHints.hintIds,
              blockAnchorFiles,
            );
            const scientific = buildScientificMicroReport({
              question: blockQuestion,
              missingSlots: clarifyTerms,
              slotPlan: slotPreview,
              anchorFiles: blockAnchorFiles,
              searchedTerms: blockHints.hintIds,
              searchedFiles: blockAnchorFiles,
              includeSearchSummary: Boolean(blockRepoContext),
              planClarify: clarifyLine,
              headingSeedSlots:
                blockHeadingSeedSlots.length > 0 ? blockHeadingSeedSlots : headingSeedSlots,
              hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
              hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
              requiresRepoEvidence: blockRepoContext,
            });
            blockAnswer = scientific.text;
            blockNextEvidence = scientific.nextEvidence;
          } else {
            blockAnswer = buildReportBlockClarifyLine(
              clarifyTerms,
              blockHints.hintIds,
              blockAnchorFiles,
            );
          }
        }
        let citations: string[] = [];
        let citationFallbackApplied = false;
        let scrubbedPaths: string[] = [];
        let dedupeApplied = false;
        if (!clarify) {
          const allowedPaths = Array.from(
            new Set([...(blockDebug?.context_files ?? []), ...blockAnchorFiles]),
          );
          const sanitized = sanitizeReportBlockAnswer(blockAnswer, allowedPaths);
          blockAnswer = sanitized.text || blockAnswer;
          scrubbedPaths = sanitized.removedPaths;
          dedupeApplied = sanitized.dedupeApplied;
          citations = normalizeCitations(extractFilePathsFromText(blockAnswer));
          if (citations.length === 0 && allowedPaths.length > 0) {
            citations = normalizeCitations(allowedPaths).slice(0, 6);
            citationFallbackApplied = citations.length > 0;
          }
        }
        blockResults.push({
          id: block.id,
          index,
          label: block.label,
          text: block.text,
          answer: blockAnswer || "No answer returned for this block.",
          mode,
          clarify,
          citations,
          traceId: blockTraceId,
          nextEvidence: blockNextEvidence,
        });
        if (debugPayload) {
          const blockDuration = Math.max(0, Date.now() - blockStart);
          reportBlockDetails.push({
            id: block.id,
            label: block.label,
            question: blockQuestion,
            search_query: blockSearchQuery,
            anchor_files: blockAnchorFiles,
            hint_ids: blockHints.hintIds,
            intent_id: blockDebug?.intent_id,
            arbiter_mode: blockDebug?.arbiter_mode,
            clarify,
            drift_detected: driftDetected,
            evidence_ok: evidenceOk,
            evidence_match_ratio: blockDebug?.evidence_match_ratio,
            evidence_match_count: blockDebug?.evidence_match_count,
            evidence_token_count: blockDebug?.evidence_token_count,
            coverage_applied: coverageApplied,
            coverage_ratio: blockDebug?.coverage_ratio,
            coverage_missing_keys: blockDebug?.coverage_missing_keys,
            evidence_use_question_tokens: blockDebug?.evidence_use_question_tokens,
            evidence_signal_tokens: blockDebug?.evidence_signal_tokens,
            evidence_tokens_preview: blockDebug?.evidence_tokens_preview,
            evidence_match_preview: blockDebug?.evidence_match_preview,
            topic_tags: blockDebug?.topic_tags,
            context_files: blockDebug?.context_files?.slice(0, 6) ?? [],
            context_files_count:
              blockDebug?.context_files_count ??
              blockDebug?.retrieval_context_file_count ??
              blockDebug?.context_files?.length ??
              0,
            block_scoped: blockDebug?.block_scoped,
            micro_pass: blockDebug?.micro_pass,
            micro_pass_enabled: blockDebug?.micro_pass_enabled,
            plan_pass_forced: blockDebug?.plan_pass_forced,
            is_repo_question: blockDebug?.is_repo_question,
            block_citation_fallback: citationFallbackApplied,
            block_paths_scrubbed: scrubbedPaths.slice(0, 4),
            block_dedupe_applied: dedupeApplied,
            retrieval_confidence: blockDebug?.retrieval_confidence,
            retrieval_doc_share: blockDebug?.retrieval_doc_share,
            retrieval_context_file_count: blockDebug?.retrieval_context_file_count,
            retrieval_query_hit_count: blockDebug?.retrieval_query_hit_count,
            retrieval_top_score: blockDebug?.retrieval_top_score,
            retrieval_score_gap: blockDebug?.retrieval_score_gap,
            retrieval_channel_weights: blockDebug?.retrieval_channel_weights,
            topic_tier: blockDebug?.topic_tier,
            topic_must_include_ok: blockDebug?.topic_must_include_ok,
            docs_first_ok: blockDebug?.docs_first_ok,
            block_must_include_ok: blockDebug?.block_must_include_ok,
            block_must_include_missing: blockDebug?.block_must_include_missing,
            block_doc_slot_targets: blockDebug?.block_doc_slot_targets,
            block_gate_decision: blockDebug?.block_gate_decision,
            belief_gate_applied: blockDebug?.belief_gate_applied,
            rattling_gate_applied: blockDebug?.rattling_gate_applied,
            doc_header_injected: blockDebug?.doc_header_injected,
            slot_doc_hit_rate: blockDebug?.slot_doc_hit_rate,
            slot_alias_coverage_rate: blockDebug?.slot_alias_coverage_rate,
            duration_ms: blockDuration,
            prefetch_files_count: blockPrefetchContext?.files.length ?? 0,
          });
        }
        logEvent(
          "Report block",
          "ok",
          `mode=${mode}`,
          blockStart,
        );
      }
      const reportText = buildHelixAskReportAnswer(blockResults, omittedCount);
      const reportMetrics = debugPayload
        ? computeReportMetrics(blockResults, reportBlockDetails)
        : null;
      const reportPayload: LocalAskResult = {
        text: reportText,
        report_mode: true,
        report_blocks: blockResults.map((block) => ({
          id: block.id,
          label: block.label,
          mode: block.mode,
          clarify: block.clarify,
          citation_count: block.citations.length,
          answer_preview: clipAskText(
            block.answer.replace(/\s+/g, " ").trim(),
            HELIX_ASK_ANSWER_PREVIEW_CHARS,
          ),
          trace_id: block.traceId,
        })),
      };
      if (debugPayload) {
        debugPayload.report_blocks = reportPayload.report_blocks as any;
        debugPayload.report_blocks_detail = reportBlockDetails as any;
        debugPayload.report_metrics = reportMetrics as any;
        const combinedEvents = [...liveEventHistory, ...reportLiveEvents];
        debugPayload.live_events = combinedEvents;
        debugPayload.trace_events = combinedEvents;
        debugPayload.trace_summary = buildTraceSummary(combinedEvents);
      }
      responder.send(200, debugPayload ? { ...reportPayload, debug: debugPayload } : reportPayload);
      return;
      }
    }
    const hasFilePathHints = HELIX_ASK_FILE_HINT.test(baseQuestion);
    const explicitRepoExpectation =
      hasFilePathHints ||
      HELIX_ASK_REPO_FORCE.test(baseQuestion) ||
      HELIX_ASK_REPO_EXPECTS.test(baseQuestion);
    let topicTags = inferHelixAskTopicTags(
      blockScoped && blockSearchSeed ? blockSearchSeed : baseQuestion,
      parsed.data.searchQuery,
    );
    if (!sessionMemoryForTags) {
      sessionMemoryForTags =
        HELIX_ASK_SESSION_MEMORY && parsed.data.sessionId
          ? getHelixAskSessionMemory(parsed.data.sessionId)
          : null;
    }
      if (sessionMemoryForTags?.recentTopics?.length) {
        topicTags = Array.from(
          new Set([...topicTags, ...sessionMemoryForTags.recentTopics]),
        ) as HelixAskTopicTag[];
      }
      logEvent(
        "Topic tags",
        topicTags.length ? "ok" : "none",
        topicTags.length ? topicTags.join(", ") : "none",
      );
    let conceptMatch: HelixAskConceptMatch | null = null;
    let conceptFastPath = false;
    let forcedAnswer: string | null = null;
    let forcedAnswerIsHard = false;
    let conceptAnswer: string | null = null;
    const ideologyConversationalMode = Boolean(
      isIdeologyConversationalCandidate &&
        shouldUseIdeologyConversationalMode(
          rawQuestion || baseQuestion,
          reportDecision.tokenCount,
          reportDecision.charCount,
          {
            explicitReportCue: reportDecision.reason === "explicit_report_request",
            blockScoped,
          },
        ),
    );
    const earlyIdeologyConceptMatch =
      ideologyConversationCandidate ??
      findConceptMatch(baseQuestion, {
        intentId: "repo.ideology_reference",
      });
    const ideologySeedScore = earlyIdeologyConceptMatch?.score ?? 0;
    const isConceptMatchAvailable =
      Boolean(earlyIdeologyConceptMatch) &&
      !isIdeologyNarrativeQuery &&
      (ideologySeedScore >= HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH_MIN_SCORE ||
        isIdeologyConversationalCandidate);
    if (
      HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH &&
      isConceptMatchAvailable &&
      reportDecision.reason !== "explicit_report_request"
    ) {
      if (!earlyIdeologyConceptMatch) {
        conceptMatch = null;
      } else {
        conceptMatch = earlyIdeologyConceptMatch;
      }
      conceptFastPath = true;
      if (!conceptMatch) {
        logEvent("Concept fast path", "preintent_ideology", "null_match");
        answerPath.push("concept_fast_path:preintent:missing_card");
        conceptMatch = null;
        forcedAnswer = null;
        conceptFastPath = false;
        forcedAnswerIsHard = false;
      } else {
        logEvent(
          "Concept fast path",
          "preintent_ideology",
          `score=${ideologySeedScore}`,
        );
        if (debugPayload) {
          debugPayload.concept_id = conceptMatch.card.id;
          debugPayload.concept_label = conceptMatch.card.label ?? conceptMatch.card.id;
          debugPayload.concept_source = conceptMatch.card.sourcePath;
        }
        answerPath.push("concept_fast_path:preintent");
      }
    }
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
      const conceptRepoMatch = Boolean(
        (conceptMatch as HelixAskConceptMatch | null)?.card?.sourcePath,
      );
      if (conceptRepoMatch) {
        repoExpectationScore = Math.max(repoExpectationScore, 2);
        repoExpectationSignals.push("concept_match");
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
    let repoExpectationLevel: "low" | "medium" | "high" =
      repoExpectationScore >= 3
        ? "high"
        : repoExpectationScore >= 2
          ? "medium"
          : "low";
      let requiresRepoEvidence = explicitRepoExpectation || conceptRepoMatch;
      let hasRepoHints =
        explicitRepoExpectation ||
        HELIX_ASK_REPO_HINT.test(baseQuestion) ||
        conceptRepoMatch ||
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
    let preIntentClarify: string | null = null;
    let conceptScopeCandidates: HelixAskConceptCandidate[] = [];
    let ambiguityCandidates: HelixAskConceptCandidate[] = [];
    let ambiguityCandidateLabels: string[] = [];
    if (!forcedAnswer) {
      const ambiguityTargetSpan = extractClarifySpan(baseQuestion);
      const ambiguitySeedLabels = collectAmbiguitySeedLabels(
        [
          ...(slotPreview?.slots ?? []),
          ...headingSeedSlots,
          ...slotPlanPassSlots,
        ],
        3,
      );
      let ambiguityClusterSummary: AmbiguityClusterSummary | null = null;
      if (debugPayload && ambiguityTargetSpan) {
        debugPayload.ambiguity_target_span = ambiguityTargetSpan;
      }
      if (HELIX_ASK_AMBIGUITY_RESOLVER) {
        const ambiguityTokenCount = filterCriticTokens(tokenizeAskQuery(baseQuestion)).length;
        const shouldProbeClusters =
          ambiguityTokenCount > 0 && ambiguityTokenCount <= HELIX_ASK_AMBIGUITY_SHORT_TOKENS + 2;
        if (shouldProbeClusters) {
          const clusterStart = Date.now();
          const snapshot = await buildAmbiguityCandidateSnapshot({
            question: baseQuestion,
            targetSpan: ambiguityTargetSpan,
            seedTerms: ambiguitySeedLabels,
            topicProfile,
          });
          const summary = buildAmbiguityClusterSummary(snapshot.candidates, ambiguityTargetSpan);
          if (summary) {
            ambiguityClusterSummary = summary;
            if (summary.clusters.length > 0) {
              if (HELIX_ASK_AMBIGUITY_LABEL_LLM) {
                let labelStart: number | null = null;
                try {
                  labelStart = logStepStart(
                    "LLM ambiguity labels",
                    `clusters=${summary.clusters.length}`,
                    {
                      clusterCount: summary.clusters.length,
                      fn: "labelAmbiguityClustersWithLlm",
                    },
                  );
                  const labeled = await labelAmbiguityClustersWithLlm({
                    question: baseQuestion,
                    targetSpan: ambiguityTargetSpan,
                    clusters: summary.clusters,
                    personaId,
                    sessionId: parsed.data.sessionId,
                    traceId: askTraceId,
                  });
                  logStepEnd(
                    "LLM ambiguity labels",
                    labeled.applied ? "ok" : "fallback",
                    labelStart,
                    true,
                    { applied: labeled.applied, fn: "labelAmbiguityClustersWithLlm" },
                  );
                  ambiguityClusterSummary = {
                    ...summary,
                    clusters: labeled.clusters,
                  };
                  if (labeled.overflow) {
                    recordOverflow("ambiguity_labels", labeled.overflow);
                  }
                  logEvent(
                    "Ambiguity labels",
                    labeled.applied ? "llm" : "fallback",
                    labeled.clusters
                      .slice(0, 3)
                      .map((cluster) => cluster.label)
                      .join(", "),
                  );
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  if (labelStart) {
                    logStepEnd(
                      "LLM ambiguity labels",
                      message,
                      labelStart,
                      false,
                      { fn: "labelAmbiguityClustersWithLlm" },
                    );
                  }
                  logEvent("Ambiguity labels", "error", message);
                }
              }
            }
            const finalSummary = ambiguityClusterSummary ?? summary;
            if (finalSummary) {
              const detail = [
                `clusters=${finalSummary.clusters.length}`,
                `margin=${finalSummary.margin.toFixed(2)}`,
                `entropy=${finalSummary.entropy.toFixed(2)}`,
                snapshot.queries.length ? `queries=${snapshot.queries.length}` : "",
              ]
                .filter(Boolean)
                .join(" | ");
              logEvent("Ambiguity clusters", "ok", detail, clusterStart);
            }
          }
          if (debugPayload) {
            debugPayload.ambiguity_target_span = ambiguityTargetSpan;
            const finalSummary = ambiguityClusterSummary ?? summary;
            if (finalSummary) {
              debugPayload.ambiguity_cluster_count = finalSummary.clusters.length;
              debugPayload.ambiguity_cluster_top_mass = finalSummary.clusters[0]?.mass ?? 0;
              debugPayload.ambiguity_cluster_margin = finalSummary.margin;
              debugPayload.ambiguity_cluster_entropy = finalSummary.entropy;
              debugPayload.ambiguity_cluster_candidates = finalSummary.clusters.map((cluster) => ({
                label: cluster.label,
                score: Number(cluster.score.toFixed(6)),
                mass: Number(cluster.mass.toFixed(6)),
                count: cluster.count,
              }));
            }
          }
        }
      }
      conceptScopeCandidates = baseQuestion
        ? listConceptCandidates(baseQuestion, 4)
        : [];
      ambiguityCandidates = HELIX_ASK_AMBIGUITY_RESOLVER
        ? conceptScopeCandidates.length > 0
          ? conceptScopeCandidates.slice(0, 3)
          : slotPreviewCandidates.slice(0, 3)
        : [];
      ambiguityCandidateLabels = Array.from(
        new Set([
          ...collectAmbiguitySeedLabels(
            [
              ...(slotPreview?.slots ?? []),
              ...headingSeedSlots,
              ...slotPlanPassSlots,
            ],
            3,
          ),
          ...ambiguityCandidates.map((candidate) => formatAmbiguityCandidateLabel(candidate)),
        ]),
      ).slice(0, 3);
      const ambiguityResolutionRaw = resolvePreIntentAmbiguity({
        question: baseQuestion,
        candidates: ambiguityCandidates,
        clusterSummary: ambiguityClusterSummary,
        explicitRepoExpectation,
        repoExpectationLevel,
        seedLabels: ambiguitySeedLabels,
      });
      let ambiguityResolution = blockScoped
        ? { ...ambiguityResolutionRaw, shouldClarify: false, reason: undefined }
        : ambiguityResolutionRaw;
      if (
        ambiguityResolution.shouldClarify &&
        HELIX_ASK_AMBIGUITY_EVIDENCE_PASS &&
        ambiguityClusterSummary?.clusters?.length
      ) {
        const senseCandidates = ambiguityClusterSummary.clusters
          .slice(0, Math.max(2, HELIX_ASK_AMBIGUITY_SENSE_TOPK))
          .filter((cluster) => cluster.label);
        if (senseCandidates.length >= 2) {
          const scores: Array<{
            label: string;
            score: number;
            docShare: number;
            matchRatio: number;
          }> = [];
          for (const sense of senseCandidates) {
            const senseQueries = mergeHelixAskQueries(
              [baseQuestion],
              [sense.label],
              Math.max(3, HELIX_ASK_QUERY_MERGE_MAX - 2),
            );
            const senseContext = await buildAskContextFromQueries(
              baseQuestion,
              senseQueries,
              HELIX_ASK_AMBIGUITY_SENSE_TOPK,
              topicProfile,
            );
            const senseEvidence = evaluateEvidenceEligibility(baseQuestion, senseContext.context, {
              minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
              minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
              signalTokens: ambiguitySeedLabels,
              useQuestionTokens: true,
            });
            const docHits = senseContext.files.filter((filePath) => /(^|\/)docs\//i.test(filePath));
            const docShare = senseContext.files.length
              ? docHits.length / senseContext.files.length
              : 0;
            const score = Math.min(
              1,
              senseEvidence.matchRatio + (docShare >= 0.4 ? 0.1 : 0),
            );
            scores.push({
              label: sense.label,
              score: Number(score.toFixed(4)),
              docShare: Number(docShare.toFixed(4)),
              matchRatio: Number(senseEvidence.matchRatio.toFixed(4)),
            });
          }
          scores.sort((a, b) => b.score - a.score);
          const top = scores[0];
          const second = scores[1];
          const margin = top && second ? top.score - second.score : top?.score ?? 0;
          if (top && margin >= HELIX_ASK_AMBIGUITY_DOMINANCE_THRESHOLD) {
            ambiguityResolution = {
              ...ambiguityResolution,
              shouldClarify: false,
              reason: "evidence_dominance",
            };
            logEvent(
              "Ambiguity evidence",
              "dominant",
              `sense=${top.label} margin=${margin.toFixed(2)}`,
            );
          } else {
            logEvent(
              "Ambiguity evidence",
              "split",
              `top=${top?.label ?? "n/a"} margin=${margin.toFixed(2)}`,
            );
          }
          if (debugPayload) {
            debugPayload.ambiguity_evidence_pass = true;
            debugPayload.ambiguity_evidence_scores = scores;
            debugPayload.ambiguity_selected = top?.label;
          }
        }
      }
      if (debugPayload && HELIX_ASK_AMBIGUITY_RESOLVER) {
        debugPayload.ambiguity_resolver_applied = ambiguityResolution.shouldClarify;
        debugPayload.ambiguity_resolver_reason = ambiguityResolution.reason;
        debugPayload.ambiguity_resolver_token_count = ambiguityResolution.tokenCount;
        debugPayload.ambiguity_resolver_short_prompt = ambiguityResolution.shortPrompt;
        debugPayload.ambiguity_resolver_top_score = ambiguityResolution.topScore;
        debugPayload.ambiguity_resolver_margin = ambiguityResolution.margin;
        debugPayload.slot_dominance_margin =
          ambiguityResolution.clusterMargin ?? ambiguityResolution.margin;
        if (ambiguityClusterSummary) {
          debugPayload.ambiguity_cluster_margin = ambiguityResolution.clusterMargin;
          debugPayload.ambiguity_cluster_entropy = ambiguityResolution.clusterEntropy;
          debugPayload.ambiguity_cluster_top_mass = ambiguityResolution.clusterTopMass;
        }
        debugPayload.ambiguity_resolver_candidates = ambiguityCandidateLabels;
      }
      if (ambiguityResolution.shouldClarify) {
        preIntentClarify = buildPreIntentClarifyLine(
          baseQuestion,
          ambiguityCandidates,
          ambiguityClusterSummary,
          ambiguitySeedLabels,
        );
        logEvent(
          "Ambiguity resolver",
          "clarify",
          ambiguityResolution.reason ?? "short_prompt",
        );
      }
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
    const isIdeologyReferenceIntent = intentProfile.id === "repo.ideology_reference";
    const isIdeologyConversationalMode = isIdeologyReferenceIntent && ideologyConversationalMode;
    if (
      isIdeologyConversationalMode &&
      !blockScoped &&
      reportDecision.reason !== "explicit_report_request"
    ) {
      reportDecision = {
        ...reportDecision,
        enabled: false,
        reason: "ideology_chat_mode",
      };
    }
    if (requiresRepoEvidence && intentProfile.domain === "general" && !isIdeologyReferenceIntent) {
      const fallbackProfile = resolveFallbackIntentProfile("hybrid");
      intentProfile = fallbackProfile;
      intentReasonBase = `${intentReasonBase}|obligation:repo_required`;
      logEvent("Fallback", "obligation -> hybrid", intentReasonBase);
    }
    if (
      !requiresRepoEvidence &&
      repoExpectationLevel !== "low" &&
      intentProfile.domain === "general" &&
      !isIdeologyReferenceIntent
    ) {
      const fallbackProfile = resolveFallbackIntentProfile("hybrid");
      intentProfile = fallbackProfile;
      intentReasonBase = `${intentReasonBase}|expectation:${repoExpectationLevel}`;
      logEvent("Fallback", "repo_expectation -> hybrid", `level=${repoExpectationLevel}`);
    }
    let intentDomain: HelixAskDomain = intentProfile.domain;
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
    let verbosity = resolveHelixAskVerbosity(
      baseQuestion,
      intentProfile,
      parsed.data.verbosity as HelixAskVerbosity | undefined,
    );
    if (isIdeologyReferenceIntent && !parsed.data.verbosity) {
      verbosity = "extended";
    }
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
    const applyIntentProfile = (profile: HelixAskIntentProfile, reasonSuffix?: string) => {
      intentProfile = profile;
      intentDomain = intentProfile.domain;
      intentTier = intentProfile.tier;
      intentSecondaryTier = intentProfile.secondaryTier;
      intentStrategy = intentProfile.strategy;
      formatSpec = resolveHelixAskFormat(baseQuestion, intentProfile, debugEnabled);
      if (hasTwoParagraphContract(baseQuestion)) {
        formatSpec = { format: "compare", stageTags: false };
      }
      if (intentStrategy === "hybrid_explain" && formatSpec.format !== "steps") {
        formatSpec = { ...formatSpec, stageTags: false };
      }
      if (compositeConstraintRequested) {
        intentSecondaryTier = "F3";
      }
      verbosity = resolveHelixAskVerbosity(
        baseQuestion,
        intentProfile,
        parsed.data.verbosity as HelixAskVerbosity | undefined,
      );
      if (
        isIdeologyReferenceIntent &&
        intentProfile.id === "repo.ideology_reference" &&
        !parsed.data.verbosity
      ) {
        verbosity = "extended";
      }
      intentReason = reasonSuffix ? `${intentReasonBase}|${reasonSuffix}` : intentReasonBase;
      if (compositeConstraintRequested) {
        intentReason = `${intentReason}|composite:constraint`;
      }
      updateIntentDebug();
    };
    applyIntentProfile(intentProfile);
    if (isIdeologyReferenceIntent && isIdeologyConversationalMode) {
      formatSpec = { ...formatSpec, format: "brief", stageTags: false };
    }
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
      let coverageSlotSummary: ReturnType<typeof evaluateCoverageSlots> | null = null;
      let docSlotSummary: ReturnType<typeof evaluateCoverageSlots> | null = null;
      let docSlotTargets: string[] = [];
      let docBlocks: Array<{ path: string; block: string }> = [];
      let definitionRegistryBlocks: Array<{ path: string; block: string }> = [];
      let graphEvidenceItems: HelixAskGraphEvidence[] = [];
      let minDocEvidenceCards = 0;
      const providedContextFiles = Array.isArray((parsed.data as any).contextFiles)
        ? (parsed.data as any).contextFiles
        : [];
    if (providedContextFiles.length > 0) {
      const normalized = providedContextFiles
        .map((entry: string) => (entry ? entry.replace(/\\/g, "/") : ""))
        .filter(Boolean);
      if (normalized.length > 0) {
        const merged = new Set([...contextFiles, ...normalized]);
        contextFiles = Array.from(merged);
      }
    }
    let isRepoQuestion =
      intentProfile.evidencePolicy.allowRepoCitations &&
      (intentDomain === "repo" || intentDomain === "hybrid");
    if (intentStrategy === "constraint_report") {
      isRepoQuestion = false;
    }
    if (blockScoped && intentStrategy !== "constraint_report") {
      isRepoQuestion = true;
    }
    if (!isRepoQuestion && contextFiles.length > 0 && intentStrategy !== "constraint_report") {
      isRepoQuestion = true;
    }
    if (debugPayload) {
      debugPayload.is_repo_question = isRepoQuestion;
    }
    const longPromptCandidate = resolveLongPromptCandidate({
      prompt,
      question: baseQuestion,
      contextText,
      hasQuestion: Boolean(questionValue ?? question),
    });
    const answerTokenBudgetEstimate = computeAnswerTokenBudget({
      verbosity,
      format: formatSpec.format,
      scaffoldTokens,
      evidenceText: contextText,
      definitionFocus,
      composite: compositeRequest.enabled,
      hasRepoEvidence: isRepoQuestion,
      hasGeneralEvidence: !isRepoQuestion,
      maxTokensOverride: parsed.data.max_tokens,
    });
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
      const estimatedTotal =
        estimatedTokens + answerTokenBudgetEstimate.tokens + HELIX_ASK_LONGPROMPT_OVERHEAD_TOKENS;
      const thresholdTrigger = estimatedTokens >= HELIX_ASK_LONGPROMPT_TRIGGER_TOKENS;
      const questionOverflowAllowed =
        longPromptCandidate.source !== "question" ||
        estimatedTokens >= HELIX_ASK_LONGPROMPT_QUESTION_OVERFLOW_TOKENS;
      const overflowTrigger =
        questionOverflowAllowed && estimatedTotal > HELIX_ASK_LOCAL_CONTEXT_TOKENS;
      if (
        thresholdTrigger ||
        overflowTrigger
      ) {
        promptIngested = true;
        promptIngestReason = thresholdTrigger ? "threshold" : "overflow";
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
    let graphPack: HelixAskGraphPack | null = null;
    let treeWalkBlock = "";
    let treeWalkMetrics: HelixAskTreeWalkMetrics | null = null;
    let treeWalkBindingRate = 0;
    let treeWalkMode: HelixAskTreeWalkMode = resolveHelixAskTreeWalkMode(
      HELIX_ASK_TREE_WALK_MODE_RAW,
      verbosity,
    );
    if (intentProfile.id === "repo.ideology_reference") {
      treeWalkMode = "root_to_leaf";
    }
    let codeAlignment: HelixAskCodeAlignment | null = null;
    let graphResolverPreferred = false;
    let mathSolveResult: HelixAskMathSolveResult | null = null;
    let verificationAnchorRequired = false;
    let verificationAnchorHints: string[] = [];
    let retrievalQueries: string[] = [];
    let retrievalFilesSnapshot: string[] = [];
    let promptItems: HelixAskPromptItem[] = [];
    let toolResultsBlock = "";
    if (preIntentClarify) {
      if (HELIX_ASK_SCIENTIFIC_CLARIFY) {
        const scientific = buildScientificMicroReport({
          question: baseQuestion,
          slotPlan: slotPreview,
          planClarify: preIntentClarify,
          headingSeedSlots,
          hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
          hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
          requiresRepoEvidence,
        });
        forcedAnswer = scientific.text;
        forcedAnswerIsHard = true;
        if (debugPayload) {
          debugPayload.scientific_response_applied = true;
          debugPayload.next_evidence_count = scientific.nextEvidence.length;
          debugPayload.next_evidence_coverage = scientific.nextEvidence.length > 0 ? 1 : 0;
          debugPayload.hypothesis_count = scientific.hypothesisCount;
          debugPayload.hypothesis_rate = scientific.hypothesisCount > 0 ? 1 : 0;
        }
      } else {
        forcedAnswer = preIntentClarify;
        forcedAnswerIsHard = true;
      }
      answerPath.push("clarify:pre_intent");
      if (debugPayload) {
        debugPayload.clarify_triggered = true;
        debugPayload.fallback_reason = "ambiguity_clarify";
        debugPayload.ambiguity_clarify_rate = 1;
      }
    }
    const conceptualFocus = HELIX_ASK_CONCEPTUAL_FOCUS.test(baseQuestion);
    const intentDomainForConcept: HelixAskDomain = intentDomain;
    const isRepoDomain = String(intentDomainForConcept) === "repo";
    const wantsConceptMatch =
      intentDomainForConcept === "general" ||
      intentDomainForConcept === "hybrid" ||
      isRepoDomain ||
      intentProfile.id === "repo.ideology_reference" ||
      (isRepoDomain && conceptualFocus);
    if (!conceptMatch && wantsConceptMatch && baseQuestion) {
      conceptMatch = findConceptMatch(baseQuestion, { intentId: intentProfile.id });
      if (conceptMatch && debugPayload) {
        debugPayload.concept_id = conceptMatch.card.id;
        debugPayload.concept_label = conceptMatch.card.label ?? conceptMatch.card.id;
        debugPayload.concept_source = conceptMatch.card.sourcePath;
      }
      if (conceptMatch) {
        answerPath.push(`concept:${conceptMatch.card.id}`);
        if (repoExpectationScore < 2) {
          repoExpectationScore = 2;
        }
        if (!repoExpectationSignals.includes("concept_match")) {
          repoExpectationSignals.push("concept_match");
        }
        repoExpectationLevel =
          repoExpectationScore >= 3
            ? "high"
            : repoExpectationScore >= 2
              ? "medium"
              : "low";
        hasRepoHints = true;
        if (intentStrategy !== "constraint_report") {
          requiresRepoEvidence = true;
          if (!isRepoQuestion) {
            isRepoQuestion = true;
            if (debugPayload) {
              debugPayload.is_repo_question = true;
            }
          }
        }
        if (debugPayload) {
          debugPayload.repo_expectation_score = repoExpectationScore;
          debugPayload.repo_expectation_level = repoExpectationLevel;
          debugPayload.repo_expectation_signals = repoExpectationSignals.slice();
        }
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
        "ui",
        "frontend",
        "client",
        "backend",
        "simulation",
        "uncertainty",
        "brick",
        "lattice",
        "knowledge",
        "rag",
        "essence",
        "luma",
        "noise",
        "hardware",
        "telemetry",
        "queue",
        "jobs",
        "ops",
        "ci",
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
    const strictCongruenceEnabled =
      String(process.env.WARP_STRICT_CONGRUENCE ?? "1").trim() !== "0";
    const isMetricQiRhoSource = (value: unknown): boolean =>
      typeof value === "string" &&
      (value.startsWith("warp.metric") ||
        value.startsWith("gr.metric") ||
        value.startsWith("gr.rho_constraint"));
    const resolveGraphCongruenceWalkOverride = (): HelixAskCongruenceWalkOverride => {
      const state = getGlobalPipelineState() as any;
      const asFiniteNumber = (value: unknown): number | null => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      };
      const cl3ThresholdFallback = (() => {
        const parsed = Number(process.env.WARP_CL3_RHO_DELTA_MAX);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.1;
      })();
      const metricBeta = state?.warp?.metricAdapter?.betaDiagnostics;
      const thetaCandidate = metricBeta?.thetaMax ?? metricBeta?.thetaRms;
      const thetaGeom = Number.isFinite(thetaCandidate as number)
        ? Number(thetaCandidate)
        : null;
      const thetaGeomProxy = metricBeta?.method === "not-computed";
      const thetaGeomUsable = thetaGeom != null && !thetaGeomProxy;
      const qiRhoSource =
        typeof state?.qiGuardrail?.rhoSource === "string"
          ? String(state.qiGuardrail.rhoSource)
          : null;
      const qiMetricDerivedFromGuard =
        typeof state?.qiGuardrail?.metricDerived === "boolean"
          ? Boolean(state.qiGuardrail.metricDerived)
          : null;
      const qiMetricDerived =
        qiMetricDerivedFromGuard != null
          ? qiMetricDerivedFromGuard
          : isMetricQiRhoSource(qiRhoSource);
      const qiStrictOk = strictCongruenceEnabled
        ? qiMetricDerived
        : true;
      const vdbTwoWallSupport =
        state?.vdbRegionII?.support === true &&
        state?.vdbRegionIV?.support === true;
      const tsMetricDerived = Boolean(
        state?.tsMetricDerived === true ||
          state?.clocking?.metricDerived === true ||
          state?.ts?.metricDerived === true,
      );
      const metricT00Source =
        typeof state?.warp?.metricT00Source === "string"
          ? String(state.warp.metricT00Source)
          : null;
      const metricT00Available =
        (metricT00Source === "metric" &&
          asFiniteNumber(state?.warp?.metricT00) != null) ||
        (state?.vdbRegionII?.support === true &&
          asFiniteNumber(state?.vdbRegionII?.t00_mean) != null) ||
        asFiniteNumber(state?.warpViability?.snapshot?.rho_delta_metric_mean) != null;
      const viabilityConstraints = Array.isArray(state?.warpViability?.constraints)
        ? (state.warpViability.constraints as Array<{ id?: unknown; passed?: unknown }>)
        : [];
      const cl3Constraint = viabilityConstraints.find(
        (constraint) =>
          constraint &&
          typeof constraint.id === "string" &&
          constraint.id === "CL3_RhoDelta",
      );
      const cl3RhoDelta =
        asFiniteNumber(state?.warpViability?.snapshot?.rho_delta_mean) ??
        asFiniteNumber(state?.gr?.constraints?.rho_constraint?.deltaMean);
      const cl3RhoThreshold =
        asFiniteNumber(state?.warpViability?.snapshot?.rho_delta_threshold) ??
        cl3ThresholdFallback;
      const cl3RhoGate =
        typeof cl3Constraint?.passed === "boolean"
          ? cl3Constraint.passed
          : cl3RhoDelta != null && cl3RhoDelta <= cl3RhoThreshold;
      const chartLabel =
        typeof state?.warp?.metricAdapter?.chart?.label === "string"
          ? (state.warp.metricAdapter.chart.label as string)
          : undefined;
      return {
        ...(chartLabel ? { chart: chartLabel } : {}),
        region: {
          B_equals_1: true,
          qi_metric_derived_equals_true: qiMetricDerived,
          qi_strict_ok_equals_true: qiStrictOk,
          theta_geom_equals_true: thetaGeomUsable,
          vdb_two_wall_support_equals_true: vdbTwoWallSupport,
          ts_metric_derived_equals_true: tsMetricDerived,
          cl3_metric_t00_available_equals_true: metricT00Available,
          cl3_rho_gate_equals_true: cl3RhoGate,
        },
      };
    };
    let graphCongruenceWalkOverride: HelixAskCongruenceWalkOverride | undefined;
    const shouldResolveGraphPack = !conceptFastPath || isIdeologyReferenceIntent;
    const graphPackPathMode =
      treeWalkMode === "root_to_leaf" || treeWalkMode === "root_to_anchor"
        ? treeWalkMode
        : undefined;
    if (shouldResolveGraphPack) {
      graphCongruenceWalkOverride = resolveGraphCongruenceWalkOverride();
      graphPack = resolveHelixAskGraphPack({
        question: baseQuestion,
        topicTags,
        conceptMatch,
        lockedTreeIds: graphTreeLock.length > 0 ? graphTreeLock : undefined,
        congruenceWalkOverride: graphCongruenceWalkOverride,
        pathMode: graphPackPathMode,
      });
      graphResolverPreferred = Boolean(graphPack?.preferGraph);
      graphHintTerms = collectGraphHintTerms(graphPack);
      graphSeedSlots = buildGraphSeedSlots(graphPack);
      const primaryPathMode = graphPack?.frameworks?.find((framework) => framework.pathMode)?.pathMode;
      if (primaryPathMode === "root_to_leaf" || primaryPathMode === "root_to_anchor") {
        treeWalkMode = primaryPathMode;
      }
      if (debugPayload) {
        debugPayload.graph_pack_lock = {
          requested: graphTreeLock.length > 0 ? graphTreeLock.slice() : [],
          applied: graphPack?.treeIds ?? [],
        };
        if (graphCongruenceWalkOverride) {
          debugPayload.graph_congruence_region = graphCongruenceWalkOverride.region;
          if (graphCongruenceWalkOverride.chart) {
            debugPayload.graph_congruence_chart = graphCongruenceWalkOverride.chart;
          }
        }
      }
      if (graphPack) {
        const treeCount = graphPack.frameworks.length;
        const anchorCount = graphPack.frameworks.reduce((sum, framework) => sum + framework.anchors.length, 0);
        const nodeCount = graphPack.frameworks.reduce((sum, framework) => sum + framework.path.length, 0);
        const treeList = graphPack.treeIds.join(", ");
        const graphDetail = [
          `trees=${treeCount}`,
          treeList ? `tree_ids=${treeList}` : null,
          graphPack.primaryTreeId ? `primary=${graphPack.primaryTreeId}` : null,
          `anchors=${anchorCount}`,
          `nodes=${nodeCount}`,
        ]
          .filter(Boolean)
          .join(" | ");
        logEvent("Graph pack", "resolved", graphDetail);
        if (debugPayload) {
          const frameworkTrees = graphPack.frameworks.map((framework) => ({
            tree: framework.treeId,
            anchors: framework.anchors.map((node) => node.id),
            nodes: framework.path.map((node) => node.id),
            source: framework.sourcePath,
            score: framework.rankScore ?? null,
            pathMode: framework.pathMode ?? null,
            pathFallbackReason: framework.pathFallbackReason ?? null,
            congruence: framework.congruenceDiagnostics ?? null,
          }));
          const blockedByReasonTotal: Record<string, number> = {};
          const blockedByConditionTotal: Record<string, number> = {};
          let allowedEdgesTotal = 0;
          let blockedEdgesTotal = 0;
          let resolvedInTreeEdgesTotal = 0;
          let resolvedCrossTreeEdgesTotal = 0;
          for (const framework of graphPack.frameworks) {
            const diagnostics = framework.congruenceDiagnostics;
            if (!diagnostics) continue;
            allowedEdgesTotal += diagnostics.allowedEdges ?? 0;
            blockedEdgesTotal += diagnostics.blockedEdges ?? 0;
            resolvedInTreeEdgesTotal += diagnostics.resolvedInTreeEdges ?? 0;
            resolvedCrossTreeEdgesTotal += diagnostics.resolvedCrossTreeEdges ?? 0;
            for (const [reason, count] of Object.entries(diagnostics.blockedByReason ?? {})) {
              blockedByReasonTotal[reason] = (blockedByReasonTotal[reason] ?? 0) + Number(count || 0);
            }
            for (const [condition, count] of Object.entries(diagnostics.blockedByCondition ?? {})) {
              blockedByConditionTotal[condition] =
                (blockedByConditionTotal[condition] ?? 0) + Number(count || 0);
            }
          }
          debugPayload.graph_framework = {
            primary: graphPack.primaryTreeId,
            locked: graphTreeLock.length > 0 ? graphTreeLock : undefined,
            trees: frameworkTrees,
          };
          debugPayload.graph_congruence_diagnostics = {
            treeCount: graphPack.frameworks.length,
            allowedEdges: allowedEdgesTotal,
            blockedEdges: blockedEdgesTotal,
            resolvedInTreeEdges: resolvedInTreeEdgesTotal,
            resolvedCrossTreeEdges: resolvedCrossTreeEdgesTotal,
            blockedByReason: blockedByReasonTotal,
            blockedByCondition: blockedByConditionTotal,
            strictSignals: {
              B_equals_1: graphCongruenceWalkOverride.region?.B_equals_1 === true,
              qi_metric_derived_equals_true:
                graphCongruenceWalkOverride.region?.qi_metric_derived_equals_true === true,
              qi_strict_ok_equals_true:
                graphCongruenceWalkOverride.region?.qi_strict_ok_equals_true === true,
              theta_geom_equals_true: graphCongruenceWalkOverride.region?.theta_geom_equals_true === true,
              vdb_two_wall_support_equals_true:
                graphCongruenceWalkOverride.region?.vdb_two_wall_support_equals_true === true,
              ts_metric_derived_equals_true:
                graphCongruenceWalkOverride.region?.ts_metric_derived_equals_true === true,
              cl3_metric_t00_available_equals_true:
                graphCongruenceWalkOverride.region?.cl3_metric_t00_available_equals_true === true,
              cl3_rho_gate_equals_true:
                graphCongruenceWalkOverride.region?.cl3_rho_gate_equals_true === true,
            },
          };
        }
        if (debugPayload) {
          debugPayload.tree_walk_mode = treeWalkMode;
          debugPayload.tree_walk_max_steps = HELIX_ASK_TREE_WALK_MAX_STEPS;
        }
      }
    } else {
      if (debugPayload) {
        (debugPayload as Record<string, unknown>).graph_pack_skip_reason = "concept_fast_path";
      }
      logEvent("Graph pack", "skipped", "concept fast path");
    }
    const baseEvidenceSignalTokens = Array.from(
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
    let evidenceSignalTokens = baseEvidenceSignalTokens.slice();
    if (graphHintTerms.length > 0) {
      evidenceSignalTokens = mergeEvidenceSignalTokens(evidenceSignalTokens, graphHintTerms);
    }
    let evidenceUseQuestionTokens = true;
    const conceptFastPathCandidate =
      Boolean(conceptMatch) &&
      (conceptualFocus || intentProfile.id === "repo.ideology_reference") &&
      intentDomain === "repo" &&
      HELIX_ASK_CONCEPT_FAST_PATH_INTENTS.has(intentProfile.id) &&
      reportDecision.reason !== "explicit_report_request" &&
      (intentProfile.id === "repo.ideology_reference"
        ? !isIdeologyNarrativeQuery
        : !graphResolverPreferred);
    let conceptFastPathBlockedReason: string | null = null;
    if (!conceptFastPath && conceptFastPathCandidate && conceptMatch) {
      if (HELIX_ASK_FORCE_FULL_ANSWERS && !HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH) {
        conceptFastPathBlockedReason = "full_answer_mode";
      } else {
        const topCandidate = ambiguityCandidates[0];
        const secondCandidate = ambiguityCandidates[1];
        const candidateTopMatch = !topCandidate || topCandidate.card.id === conceptMatch.card.id;
        const candidateMarginOk =
          !secondCandidate || (topCandidate?.score ?? 0) - secondCandidate.score >= 3;
        const conceptRelevantTags = topicTags.filter((tag) => repoNativeTags.has(tag));
        const conceptTagCoverageOk =
          conceptTopicTags.length === 0 ||
          conceptRelevantTags.every((tag) => conceptTopicTags.includes(tag));
        if (!candidateTopMatch) {
          conceptFastPathBlockedReason = "concept_candidate_mismatch";
        } else if (!candidateMarginOk) {
          conceptFastPathBlockedReason = "concept_candidate_ambiguous";
        } else if (!conceptTagCoverageOk) {
          conceptFastPathBlockedReason = "concept_topic_mismatch";
        } else {
          conceptFastPath = true;
        }
      }
    }
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
    } else if (conceptFastPathCandidate && conceptFastPathBlockedReason) {
      if (debugPayload) {
        debugPayload.concept_fast_path_blocked_reason = conceptFastPathBlockedReason;
      }
      logEvent("Concept fast path", "skipped", conceptFastPathBlockedReason);
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
    let preflightContext:
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
          channelWeights?: AskCandidateChannelStats;
          docHeaderInjected?: number;
        }
      | null = null;
    let preflightEvidence: EvidenceEligibility | null = null;
    let preflightQueries: string[] = [];
    let preflightDocShare = 0;
    let preflightRepoSearchHits = 0;
    let preflightSignalsOk = false;
    let preflightReuseApplied = false;
    let retrievalOverrideApplied = false;
    const preflightEnabled =
      HELIX_ASK_PREFLIGHT_ENABLED &&
      !promptIngested &&
      intentStrategy !== "constraint_report" &&
      !forcedAnswer &&
      !contextText;
    if (preflightEnabled) {
      const preflightSearchSeed = parsed.data.searchQuery?.trim() || baseQuestion;
      const preflightBaseQueries = buildHelixAskSearchQueries(preflightSearchSeed, topicTags);
      if (!blockScoped && conceptMatch?.card.sourcePath) {
        preflightBaseQueries.push(conceptMatch.card.sourcePath);
      }
      const preflightHeadingSeeds = buildDocHeadingSeedSlots(baseQuestion);
      const preflightHeadingTerms = preflightHeadingSeeds.flatMap((slot) => buildSlotQueryTerms(slot));
      const preflightHints = [...graphHintTerms, ...preflightHeadingTerms].filter(
        (value): value is string => typeof value === "string",
      );
      preflightQueries = mergeHelixAskQueries(
        preflightBaseQueries,
        preflightHints,
        HELIX_ASK_QUERY_MERGE_MAX,
      );
      const preflightStart = logStepStart(
        "Preflight retrieval",
        `queries=${preflightQueries.length}`,
        {
          queryCount: preflightQueries.length,
          topK: HELIX_ASK_PREFLIGHT_TOPK,
          fn: "buildAskContextFromQueries",
          phase: "preflight",
        },
      );
      if (preflightQueries.length > 0) {
        const preflightResult = await buildAskContextFromQueries(
          baseQuestion,
          preflightQueries,
          HELIX_ASK_PREFLIGHT_TOPK,
          topicProfile,
        );
        preflightContext = preflightResult;
        let preflightText = preflightResult.context;
        let preflightFiles = preflightResult.files.slice();
        if (!preflightText) {
          const grepCandidates = collectDocsGrepCandidates(preflightQueries, baseQuestion, {
            allowlist: topicProfile?.allowlistTiers?.[0] ?? [],
            limit: 120,
          });
          if (grepCandidates.length > 0) {
            const selected = selectCandidatesWithMmr(
              grepCandidates,
              HELIX_ASK_PREFLIGHT_TOPK,
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
            preflightContext = buildAskContextFromCandidates({
              selected,
              topicTier: 0,
              topicMustIncludeOk: true,
              queryHitCount: selected.length ? 1 : 0,
              topScore: normalizedTop,
              scoreGap: normalizedGap,
              channelHits,
              channelTopScores,
              channelWeights: scaleAskChannelWeights(HELIX_ASK_RRF_CHANNEL_WEIGHTS, channelTopScores),
            });
            preflightText = preflightContext.context;
            preflightFiles = preflightContext.files.slice();
            logEvent(
              "Preflight docs grep",
              "ok",
              `hits=${grepCandidates.length}`,
              preflightStart,
            );
          } else {
            logEvent("Preflight docs grep", "miss", "hits=0", preflightStart);
          }
        }
        if (graphPack?.contextText) {
          preflightText = appendContextBlock(preflightText, graphPack.contextText);
          if (graphPack.sourcePaths.length > 0) {
            preflightFiles = Array.from(new Set([...preflightFiles, ...graphPack.sourcePaths]));
          }
        }
        if (preflightText) {
          preflightEvidence = evaluateEvidenceEligibility(baseQuestion, preflightText, {
            minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
            minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
            signalTokens: evidenceSignalTokens,
            useQuestionTokens: true,
          });
          if (!preflightEvidence.ok) {
            const repoSearchPlan = buildRepoSearchPlan({
              question: baseQuestion,
              topicTags,
              conceptMatch,
              intentDomain,
              evidenceGateOk: preflightEvidence.ok,
              promptIngested,
              topicProfile,
              mode: "preflight",
            });
            if (repoSearchPlan) {
              const repoSearchResult = await runRepoSearch(repoSearchPlan);
              const repoSearchHits = repoSearchResult.hits.filter(
                (hit) => !isIndexOnlyPath(hit.filePath ?? ""),
              );
              preflightRepoSearchHits = repoSearchHits.length;
              if (repoSearchHits.length > 0) {
                const formatted = formatRepoSearchEvidence({
                  ...repoSearchResult,
                  hits: repoSearchHits,
                });
                preflightText = [preflightText, formatted.evidenceText].filter(Boolean).join("\n\n");
                if (formatted.filePaths.length > 0) {
                  preflightFiles = Array.from(new Set([...preflightFiles, ...formatted.filePaths]));
                }
                preflightEvidence = evaluateEvidenceEligibility(baseQuestion, preflightText, {
                  minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                  minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                  signalTokens: evidenceSignalTokens,
                  useQuestionTokens: true,
                });
              }
              if (debugPayload) {
                debugPayload.preflight_repo_search_terms = repoSearchPlan.terms;
                debugPayload.preflight_repo_search_paths = repoSearchPlan.paths;
                debugPayload.preflight_repo_search_reason = repoSearchPlan.reason;
                debugPayload.preflight_repo_search_hits = repoSearchHits.length;
                debugPayload.preflight_repo_search_truncated = repoSearchResult.truncated;
                if (repoSearchResult.error) {
                  debugPayload.preflight_repo_search_error = repoSearchResult.error;
                }
              }
            }
          }
          preflightContext = {
            ...(preflightContext ?? preflightResult),
            context: preflightText,
            files: preflightFiles,
          };
          const docHits = preflightFiles.filter((filePath) => /(^|\/)docs\//i.test(filePath));
          preflightDocShare = preflightFiles.length
            ? docHits.length / preflightFiles.length
            : 0;
          preflightSignalsOk =
            Boolean(preflightEvidence?.ok) ||
            (preflightFiles.length >= HELIX_ASK_PREFLIGHT_MIN_FILES &&
              preflightDocShare >= HELIX_ASK_PREFLIGHT_DOC_SHARE);
          const retrievalUpgradeEligible =
            intentDomain === "general" &&
            preflightSignalsOk &&
            (repoExpectationLevel !== "low" ||
              tagSignals.length > 0 ||
              Boolean(graphPack?.frameworks.length) ||
              Boolean(conceptMatch));
          if (retrievalUpgradeEligible) {
            const fallbackProfile = resolveFallbackIntentProfile("hybrid");
            applyIntentProfile(fallbackProfile, "retrieval_preflight");
            if (isIdeologyConversationalMode && fallbackProfile.id === "repo.ideology_reference") {
              formatSpec = { ...formatSpec, format: "brief", stageTags: false };
            }
            retrievalOverrideApplied = true;
            answerPath.push("intent:retrieval_preflight");
            answerPath.push(`intent_override:${fallbackProfile.id}`);
            answerPath.push(`domain_override:${fallbackProfile.domain}`);
            logEvent(
              "Intent override",
              "retrieval_preflight",
              `profile=${fallbackProfile.id}`,
              preflightStart,
            );
          }
          if (!isRepoQuestion && preflightSignalsOk && intentStrategy !== "constraint_report") {
            isRepoQuestion = true;
          }
          if (debugPayload) {
            debugPayload.preflight_queries = preflightQueries.slice(0, 12);
            debugPayload.preflight_files = preflightFiles.slice(0, 12);
            debugPayload.preflight_file_count = preflightFiles.length;
            debugPayload.preflight_doc_share = preflightDocShare;
            debugPayload.preflight_evidence_ok = preflightEvidence?.ok ?? false;
            debugPayload.preflight_evidence_ratio = preflightEvidence?.matchRatio ?? 0;
            debugPayload.preflight_repo_search_hits = preflightRepoSearchHits;
            debugPayload.preflight_retrieval_upgrade = retrievalOverrideApplied;
          }
          logEvent(
            "Preflight retrieval",
            preflightSignalsOk ? "ok" : "weak",
            [
              `files=${preflightFiles.length}`,
              `docShare=${preflightDocShare.toFixed(2)}`,
              preflightEvidence ? `match=${preflightEvidence.matchCount}/${preflightEvidence.tokenCount}` : "",
            ]
              .filter(Boolean)
              .join(" | "),
            preflightStart,
          );
        } else {
          logEvent("Preflight retrieval", "empty", "no_context", preflightStart);
        }
      }
    }
    if (debugPayload) {
      debugPayload.is_repo_question = isRepoQuestion;
    }
    if (
      preflightContext?.context &&
      HELIX_ASK_PREFLIGHT_REUSE &&
      preflightSignalsOk &&
      isRepoQuestion &&
      !contextText
    ) {
      contextText = preflightContext.context;
      contextFiles = preflightContext.files.slice();
      preflightReuseApplied = true;
      if (debugPayload) {
        debugPayload.preflight_reuse = true;
      }
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
      forcedAnswerIsHard = true;
      answerPath.push("forcedAnswer:math_solver");
    }
    if (conceptFastPath && conceptMatch && !forcedAnswer) {
      const conceptDraft = isIdeologyReferenceIntent
        ? renderConceptAnswer(conceptMatch)
        : renderConceptDefinition(conceptMatch);
      if (conceptDraft) {
        conceptAnswer = conceptDraft;
        if (!isIdeologyReferenceIntent) {
          forcedAnswer = conceptAnswer;
          forcedAnswerIsHard = true;
          answerPath.push("forcedAnswer:concept");
        } else {
          answerPath.push("concept_fast_path_enabled");
        }
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
            forcedAnswerIsHard = true;
            answerPath.push("forcedAnswer:constraint_report");
          }
        }
        prompt = ensureFinalMarker(
          buildHelixAskConstraintPrompt(
            baseQuestion || question || "Report constraint status.",
            evidenceText,
            formatSpec.format,
            formatSpec.stageTags,
            verbosity,
          ),
        );
      } else if (compositeConstraintRequested && constraintEvidenceText) {
        answerPath.push("constraint:evidence");
      }
      logProgress("Constraint evidence ready", label, constraintStart);
    }
    if (!isRepoQuestion && !blockScoped) {
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
      !blockScoped &&
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
          logEvent(
            "Allowlist tier",
            "auto",
            topicProfile ? "auto context (no tier)" : "no topic profile",
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
        ? buildGroundedAskPrompt(question, contextText, formatSpec.format, formatSpec.stageTags, verbosity)
        : buildGeneralAskPrompt(question, formatSpec.format, formatSpec.stageTags, verbosity);
      prompt = ensureFinalMarker(basePrompt);
    }
    if (!prompt) {
      responder.send(400, {
        error: "bad_request",
        details: [{ path: ["prompt"], message: "prompt required" }],
      });
      return;
    }

    const ideologyFastPathBypass =
      HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH &&
      isIdeologyReferenceIntent &&
      conceptFastPath &&
      Boolean(forcedAnswer) &&
      String(verbosity ?? "").trim().length > 0;
    const ideologyConceptForceBypass =
      isIdeologyReferenceIntent &&
      conceptFastPath &&
      Boolean(forcedAnswer) &&
      forcedAnswerIsHard &&
      String(verbosity ?? "").trim().length > 0;
    const forcePlanPass =
      blockScoped ||
      (!ideologyFastPathBypass && !ideologyConceptForceBypass && repoExpectationLevel !== "low") ||
      (!ideologyFastPathBypass && !ideologyConceptForceBypass && requiresRepoEvidence) ||
      ((conceptFastPath || Boolean(conceptMatch)) &&
        !ideologyFastPathBypass &&
        !ideologyConceptForceBypass);
    const microPassDecision = decideHelixAskMicroPass(baseQuestion, formatSpec);
    const skipMicroPass =
      intentStrategy === "constraint_report" ||
      mathSolverOk ||
      ideologyFastPathBypass ||
      ideologyConceptForceBypass;
    const microPassEnabled =
      !skipMicroPass && (microPassDecision.enabled || promptIngested || forcePlanPass);
    if (debugPayload) {
      debugPayload.micro_pass_enabled = microPassEnabled;
    }
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
    let pipelineEvidence: string | null = null;
    let planPassStart: number | null = null;
    let planDirectives: HelixAskPlanDirectives | null = null;
    let planScope: HelixAskPlanScope | null = null;
    let clarifyOverride: string | undefined;
    let requiredSlots: string[] = [];
    let slotPlan: HelixAskSlotPlan | null = null;
    let coverageSlots: string[] = [];
    let slotAliases: string[] = [];
    let slotEvidenceHints: string[] = [];
    let slotAliasMap: Record<string, string[]> | null = null;
    let coverageSlotAliasMap: Record<string, string[]> | null = null;
    let slotCoverageOk = true;
    let slotCoverageFailed = false;
    let docSlotCoverageFailed = false;
    let definitionDocMissing = false;
    let slotEvidenceLogged = false;
    let slotEvidenceRates: { docHitRate: number; aliasHitRate: number } | null = null;
    let blockMustIncludeOk: boolean | undefined;
    let blockMustIncludeMissing: string[] = [];
    let blockGateDecision: string | undefined;
    let failClosedRepoEvidence = false;
    let failClosedReason: string | null = null;

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
          if (HELIX_ASK_SINGLE_LLM) {
            const queryStart = Date.now();
            queryHints = [];
            planDirectives = null;
            logProgress("Query hints ready", "skipped", queryStart);
            logEvent("LLM query hints", "skipped", "single_llm", queryStart);
            logEvent("Query hints ready", "single_llm", "0 hints", queryStart);
          } else if (conceptFastPath) {
            logEvent("Query hints ready", "skipped", "concept_fast_path");
          } else if (blockScoped && !HELIX_ASK_QUERY_HINTS_BLOCKS) {
            const queryStart = Date.now();
            queryHints = [];
            planDirectives = null;
            logProgress("Query hints ready", "0 hints", queryStart);
            logEvent("Query hints ready", "block_scoped", "0 hints", queryStart);
          } else {
            let queryStart: number | null = null;
            try {
              const conceptSkeleton =
                intentProfile.id === "hybrid.concept_plus_system_mapping"
                  ? buildHybridConceptSkeleton(baseQuestion, conceptMatch)
                  : [];
              const queryPrompt = buildHelixAskQueryPrompt(baseQuestion, {
                conceptSkeleton,
                anchorHints: verificationAnchorRequired ? verificationAnchorHints : [],
              });
              const queryMaxTokens = blockScoped ? HELIX_ASK_QUERY_TOKENS_BLOCK : HELIX_ASK_QUERY_TOKENS;
              queryStart = logStepStart(
                "LLM query hints",
                `tokens=${queryMaxTokens}`,
                {
                  maxTokens: queryMaxTokens,
                  fn: "runHelixAskLocalWithOverflowRetry",
                  label: "query_hints",
                  prompt: "buildHelixAskQueryPrompt",
                },
              );
              const { result: queryResult, overflow: queryOverflow } =
                await runHelixAskLocalWithOverflowRetry(
                  {
                    prompt: queryPrompt,
                    max_tokens: queryMaxTokens,
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
                    fallbackMaxTokens: queryMaxTokens,
                    allowContextDrop: true,
                    label: "query_hints",
                  },
                );
              recordOverflow("query_hints", queryOverflow);
              const planParse = parsePlanDirectives(queryResult.text ?? "");
              planDirectives = planParse.directives;
              queryHints = filterSlotHintTerms(planParse.queryHints, { maxTokens: 8, maxChars: 90 })
                .slice(0, HELIX_ASK_QUERY_HINTS_MAX);
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
                  planDirectives.conceptSlots.length
                    ? `conceptSlots=${planDirectives.conceptSlots.join(",")}`
                    : "",
                  planDirectives.evidenceCriteria && Object.keys(planDirectives.evidenceCriteria).length
                    ? `evidenceCriteria=${Object.keys(planDirectives.evidenceCriteria).length}`
                    : "",
                  planDirectives.clarifyQuestion ? "clarify=provided" : "",
                ]
                  .filter(Boolean)
                  .join(" | ");
                logEvent("Plan directives", "ok", directiveSummary || "none", queryStart);
              }
              if (queryStart) {
                logStepEnd(
                  "LLM query hints",
                  `hints=${queryHints.length}`,
                  queryStart,
                  true,
                  {
                    hintCount: queryHints.length,
                    fn: "runHelixAskLocalWithOverflowRetry",
                    label: "query_hints",
                  },
                );
              }
            } catch (error) {
              if (queryStart) {
                const message = error instanceof Error ? error.message : String(error);
                logStepEnd(
                  "LLM query hints",
                  message,
                  queryStart,
                  false,
                  { fn: "runHelixAskLocalWithOverflowRetry", label: "query_hints" },
                );
              }
              queryHints = [];
            }
          }
        }
        if (debugPayload && queryHints.length > 0) {
          debugPayload.query_hints = queryHints;
        }
        if (debugPayload && graphHintTerms.length > 0) {
          debugPayload.graph_hint_terms = graphHintTerms.slice(0, 12);
        }
        if (debugPayload && planDirectives) {
          debugPayload.plan_directives = planDirectives;
        }
        const slotPlanQuestion =
          blockScoped && blockSearchSeed ? blockSearchSeed : baseQuestion;
        slotPlanHeadingSeedSlots = buildDocHeadingSeedSlots(slotPlanQuestion);
        slotPlan = buildCanonicalSlotPlan({
          question: slotPlanQuestion,
          directives: planDirectives,
          candidates: slotPreviewCandidates,
          seedSlots: [
            ...memorySeedSlots,
            ...slotPlanHeadingSeedSlots,
            ...slotPlanPassSlots,
            ...graphSeedSlots,
          ],
        });
        const requiredSlotIds = resolveRequiredSlots(slotPlan);
        coverageSlots = coverageSlotsFromRequest
          ? requestCoverageSlots
          : requiredSlotIds.length > 0
            ? requiredSlotIds
            : slotPlan.coverageSlots.slice();
        if (coverageSlotsFromRequest) {
          const scopedPlan = restrictSlotPlanToCoverage(slotPlan, coverageSlots);
          if (scopedPlan) {
            slotPlan = scopedPlan;
            if (scopedPlan.coverageSlots.length > 0) {
              coverageSlots = scopedPlan.coverageSlots.slice();
            }
          }
        }
          slotAliases = collectSlotAliasHints(slotPlan);
          slotEvidenceHints = collectSlotEvidenceHints(slotPlan);
          slotAliasMap = buildSlotAliasMap(slotPlan);
          coverageSlotAliasMap =
            slotAliasMap && coverageSlots.length > 0
              ? Object.fromEntries(
                  Object.entries(slotAliasMap).filter(([slotId]) =>
                    coverageSlots.includes(slotId),
                  ),
                )
              : null;
          if (debugPayload) {
            const tierCounts = { A: 0, B: 0, C: 0 } as { A: number; B: number; C: number };
            const tierList = slotPlan.slots.map((slot) => {
              const tier = resolveSlotTier(slot);
              tierCounts[tier] += 1;
              return {
                id: slot.id,
                label: slot.label,
                source: slot.source,
                required: slot.required,
                tier,
              };
            });
            debugPayload.slot_tiers = tierList.slice(0, 12);
            debugPayload.slot_tier_counts = tierCounts;
          }
          if (coverageSlotsFromRequest) {
            const coverageSlotAliases = collectCoverageSlotAliases(slotAliasMap, coverageSlots);
            if (
              coverageSlotAliases.length > 0 ||
            slotEvidenceHints.length > 0 ||
            graphHintTerms.length > 0
          ) {
            evidenceSignalTokens = mergeEvidenceSignalTokens(
              coverageSlotAliases,
              slotEvidenceHints,
              graphHintTerms,
            );
            evidenceUseQuestionTokens = false;
          }
        } else if (slotEvidenceHints.length > 0 || graphHintTerms.length > 0) {
          evidenceSignalTokens = mergeEvidenceSignalTokens(
            evidenceSignalTokens,
            slotEvidenceHints,
            graphHintTerms,
          );
        }
          if (slotPlan.slots.length > 0) {
            const slotLabels = slotPlan.slots
              .slice(0, 6)
              .map((slot) => `${slot.id}${slot.required ? "" : "?"}`);
            const suffix = slotPlan.slots.length > 6 ? "..." : "";
            logEvent(
              "Slot plan",
              `${slotPlan.slots.length} slots`,
              `${slotLabels.join(", ")}${suffix}`,
            );
          const optionalSlots = slotPlan.slots
            .filter((slot) => !slot.required && !isWeakSlot(slot))
            .map((slot) => slot.id);
          const weakSlots = slotPlan.slots.filter((slot) => isWeakSlot(slot)).map((slot) => slot.id);
          const requiredPreview = requiredSlotIds.slice(0, 8).join(", ");
          const optionalPreview = optionalSlots.slice(0, 8).join(", ");
          const requirementLines = [
            requiredSlotIds.length ? `required: ${requiredPreview}` : "required: none",
            optionalSlots.length ? `optional: ${optionalPreview}` : "optional: none",
            weakSlots.length ? `weak=${weakSlots.length}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          logEvent(
            "Slot requirements",
            `required=${requiredSlotIds.length} optional=${optionalSlots.length}`,
            requirementLines,
          );
        }
        if (debugPayload) {
          debugPayload.slot_plan = slotPlan.slots.map((slot) => ({
            id: slot.id,
            label: slot.label,
            required: slot.required,
            source: slot.source,
            weak: Boolean(slot.weak),
            surfaces: slot.surfaces,
            aliases: (slot.aliases ?? []).slice(0, 6),
            evidence_criteria: (slot.evidenceCriteria ?? []).slice(0, 4),
          }));
          debugPayload.slot_count = slotPlan.slots.length;
            const hardRequiredSlots = coverageSlots.slice(0, 12);
            debugPayload.slot_required_count = slotPlan.slots.filter(isHardRequiredSlot).length;
            debugPayload.hard_required_slots = hardRequiredSlots;
            debugPayload.hard_required_slot_count = hardRequiredSlots.length;
            debugPayload.coverage_slots_source = coverageSlotsFromRequest
              ? "request"
              : requiredSlotIds.length > 0
                ? "concept"
                : "none";
          }

        const searchSeed = blockScoped
          ? blockSearchSeed || coverageSlots.join(" ")
          : parsed.data.searchQuery?.trim() || baseQuestion;
        const baseQueries = buildHelixAskSearchQueries(searchSeed, topicTags);
        const crossConceptHints = !blockScoped
          ? slotPreviewCandidates
              .slice(0, HELIX_ASK_CROSS_CONCEPT_HINTS)
              .flatMap((candidate) => [
                candidate.card.sourcePath ?? "",
                ...(candidate.card.mustIncludeFiles ?? []).slice(0, 2),
                ...(candidate.card.aliases ?? []).slice(0, 2),
              ])
              .filter(Boolean)
          : [];
        if (!blockScoped && conceptMatch?.card.sourcePath) {
          baseQueries.push(conceptMatch.card.sourcePath);
        }
        const blockQueryHints = blockScoped && HELIX_ASK_QUERY_HINTS_BLOCKS ? queryHints : [];
        const mergeHints = blockScoped
          ? [...blockQueryHints, ...graphHintTerms, ...slotAliases, ...slotEvidenceHints]
          : [
              ...queryHints,
              ...graphHintTerms,
              ...slotAliases,
              ...slotEvidenceHints,
              ...memoryPinnedFiles,
              ...crossConceptHints,
            ];
        const queries = mergeHelixAskQueries(
          baseQueries,
          mergeHints,
          HELIX_ASK_QUERY_MERGE_MAX,
        );
        retrievalQueries = queries.slice();
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
            conceptMatch,
            override: reportContext?.planScopeOverride,
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
        if (
          agentActionCounts.retrieve_docs_first === undefined &&
          agentActionCounts.retrieve_mixed === undefined
        ) {
          const retrievalAction = planScope?.docsFirst ? "retrieve_docs_first" : "retrieve_mixed";
          const retrievalReason =
            blockScoped && headingSeedSlots.length > 0
              ? "heading_seed_followup"
              : planScope?.docsFirst
                ? "docs_first_scope"
                : "default_scope";
          const retrievalGain = planScope?.docsFirst ? "prioritize_docs" : "balanced_retrieval";
          recordAgentAction(retrievalAction, retrievalReason, retrievalGain);
        }
        const enforceStructuralCoverage =
          coverageSlotsFromRequest || intentStrategy === "constraint_report";
        if (!requiredSlots.length && enforceStructuralCoverage) {
          if (planDirectives?.requiredSlots?.length) {
            const structural = planDirectives.requiredSlots
              .map((slot) => normalizeSlotName(slot))
              .filter((slot) => STRUCTURAL_SLOTS.has(slot))
              .slice(0, 6);
            requiredSlots = structural;
          }
          if (
            requiredSlots.length === 0 &&
            intentStrategy === "hybrid_explain" &&
            (requiresRepoEvidence || intentDomain === "hybrid")
          ) {
            requiredSlots = ["definition", "repo_mapping"];
            if (verificationAnchorRequired) {
              requiredSlots.push("verification");
            }
          } else if (requiredSlots.length === 0 && verificationAnchorRequired) {
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
        if (definitionFocus && requiredSlots.length > 0) {
          const wantsRepoMapping =
            /where|which\s+(file|doc|module|path)|file\s+is|docs?\//i.test(baseQuestion);
          requiredSlots = requiredSlots.filter((slot) => {
            if (slot === "definition") return false;
            if (slot === "repo_mapping" && !wantsRepoMapping) return false;
            return true;
          });
        }

        const preflightMeta = preflightReuseApplied ? preflightContext : null;
        let contextMeta: {
          files: string[];
          topicTier?: number;
          topicMustIncludeOk?: boolean;
          queryHitCount?: number;
          topScore?: number;
          scoreGap?: number;
          channelHits?: AskCandidateChannelStats;
          channelTopScores?: AskCandidateChannelStats;
          channelWeights?: AskCandidateChannelStats;
          docHeaderInjected?: number;
        } = preflightMeta
          ? {
              files: contextFiles.slice(),
              topicTier: preflightMeta.topicTier,
              topicMustIncludeOk: preflightMeta.topicMustIncludeOk,
              queryHitCount: preflightMeta.queryHitCount,
              topScore: preflightMeta.topScore,
              scoreGap: preflightMeta.scoreGap,
              channelHits: preflightMeta.channelHits ?? initAskChannelStats(),
              channelTopScores: preflightMeta.channelTopScores ?? initAskChannelStats(),
              channelWeights: preflightMeta.channelWeights,
              docHeaderInjected: preflightMeta.docHeaderInjected,
            }
          : {
              files: contextFiles.slice(),
              queryHitCount: 0,
              topScore: 0,
              scoreGap: 0,
              channelHits: initAskChannelStats(),
              channelTopScores: initAskChannelStats(),
            };
        coverageSlotSummary = null;
        docSlotSummary = null;
        docSlotTargets = [];
          docBlocks = mergeDefinitionRegistryBlocks([], definitionRegistryBlocks);
        minDocEvidenceCards = 0;

        if (!contextText) {
          const scope = planScope ?? undefined;
          const contextStart = logStepStart(
            "Retrieval",
            scope?.docsFirst ? "docs-first" : "mixed",
            {
              docsFirst: Boolean(scope?.docsFirst),
              queries: queries.length,
              fn: "buildAskContextFromQueries",
              phase: scope?.docsFirst ? "docsFirst" : "mixed",
            },
          );
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
                channelWeights?: AskCandidateChannelStats;
                docHeaderInjected?: number;
              }
            | undefined;
          let docsFirstOk = false;
          if (scope?.docsFirst && scope.docsAllowlist?.length) {
            const docsScope = await buildAskContextFromQueries(
              baseQuestion,
              queries,
              parsed.data.topK,
              topicProfile,
              {
                allowlistTiers: scope.docsAllowlist,
                avoidlist: scope.avoidlist,
                overrideAllowlist: true,
              },
            );
            const planMustIncludeOk =
              scope.mustIncludeGlobs?.length
                ? docsScope.files.some((filePath) =>
                    pathMatchesAny(filePath, scope.mustIncludeGlobs ?? []),
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
              const docsAllowlist = (scope.docsAllowlist ?? []).flat();
              const grepCandidates = collectDocsGrepCandidates(queries, baseQuestion, {
                allowlist: docsAllowlist,
                avoidlist: scope.avoidlist,
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
                  channelWeights: scaleAskChannelWeights(HELIX_ASK_RRF_CHANNEL_WEIGHTS, channelTopScores),
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
          if (contextResult.docHeaderInjected && contextResult.docHeaderInjected > 0) {
            logEvent(
              "Doc headers",
              "injected",
              `count=${contextResult.docHeaderInjected}`,
              contextStart,
            );
            if (debugPayload) {
              debugPayload.doc_header_injected =
                (debugPayload.doc_header_injected ?? 0) + contextResult.docHeaderInjected;
            }
          }
          const selectedDocs = selectDocBlocks(contextText, definitionFocus);
          docBlocks = mergeDefinitionRegistryBlocks(
            selectedDocs.docBlocks,
            definitionRegistryBlocks,
          );
          applyCompactionDebug(debugPayload, selectedDocs.compaction);
          if (debugPayload) {
            debugPayload.proof_span_rate = Math.max(
              debugPayload.proof_span_rate ?? 0,
              selectedDocs.proofSpanRate,
            );
            if (definitionFocus) {
              debugPayload.definition_doc_blocks = docBlocks.length;
              debugPayload.definition_doc_span_rate = selectedDocs.proofSpanRate;
            }
          }
          logStepEnd(
            "Retrieval",
            `files=${contextFiles.length} docs=${docBlocks.length}`,
            contextStart,
            true,
            {
              files: contextFiles.length,
              docBlocks: docBlocks.length,
              queryHits: contextMeta?.queryHitCount ?? 0,
              topicTier: contextMeta?.topicTier ?? 0,
              fn: "buildAskContextFromQueries",
            },
          );
          const docContextText = docBlocks.map((block) => block.block).join("\n\n");
          coverageSlotSummary = evaluateCoverageSlots({
            question: baseQuestion,
            referenceText: contextText,
            evidencePaths: contextFiles,
            conceptMatch,
            domain: intentDomain,
            explicitSlots: coverageSlots,
            slotAliases: coverageSlotAliasMap ?? undefined,
            includeQuestionTokens: coverageSlots.length === 0,
          });
          const docRequiredSlots = resolveDocRequiredSlots(slotPlan);
          const requiredSlotIds = resolveRequiredSlots(slotPlan);
          if (coverageSlotsFromRequest && coverageSlots.length > 0) {
            docSlotTargets = coverageSlots.slice();
          } else {
            docSlotTargets = slotPlan
              ? docRequiredSlots.length > 0
                ? docRequiredSlots
                : requiredSlotIds
              : [];
          }
          if (planScope?.docsFirst && docSlotTargets.length > 0) {
            logEvent(
              "Docs-first slots",
              `${docSlotTargets.length} slots`,
              docSlotTargets.join(","),
              undefined,
              true,
              { slots: docSlotTargets.slice(0, 12) },
            );
          }
          if (slotPlan && docSlotTargets.length > 0) {
            docSlotSummary = evaluateDocSlotCoverage(slotPlan, docBlocks, docSlotTargets);
          } else {
            docSlotSummary =
              docContextText.trim().length > 0
                ? evaluateCoverageSlots({
                    question: baseQuestion,
                    referenceText: docContextText,
                    evidencePaths: docBlocks.map((block) => block.path),
                    conceptMatch,
                    domain: intentDomain,
                    explicitSlots: coverageSlots,
                    slotAliases: coverageSlotAliasMap ?? undefined,
                    includeQuestionTokens: coverageSlots.length === 0,
                  })
                : coverageSlotSummary;
          }
          if (debugPayload && docSlotSummary?.ratio !== undefined) {
            debugPayload.slot_doc_coverage_rate = Math.max(
              debugPayload.slot_doc_coverage_rate ?? 0,
              docSlotSummary.ratio,
            );
          }
          const slotCountForDocs =
            docSlotSummary?.slots.length ??
            (coverageSlots.length > 0 ? coverageSlots.length : coverageSlotSummary?.slots.length ?? 0);
          minDocEvidenceCards = definitionFocus
            ? Math.max(1, Math.min(slotCountForDocs || 0, 3) || 1)
            : Math.max(2, Math.min(slotCountForDocs || 0, 4) || 2);
          if (debugPayload && planScope?.docsFirst) {
            debugPayload.docs_first_evidence_cards = docBlocks.length;
            debugPayload.docs_first_min_cards = minDocEvidenceCards;
          }
          const repoDocsRequired =
            requiresRepoEvidence ||
            intentDomain === "repo" ||
            intentDomain === "hybrid" ||
            intentDomain === "falsifiable";
          if (
            (planScope?.docsFirst || repoDocsRequired) &&
            docSlotTargets.length > 0 &&
            (docBlocks.length < minDocEvidenceCards ||
              (docSlotSummary?.slots.length ? docSlotSummary.missingSlots.length > 0 : false))
          ) {
            const docsAllowlist = (planScope?.docsAllowlist ?? []).flat();
            const slotDocsAllowlist = docsAllowlist.length ? docsAllowlist : [/^docs\//i];
            const slotHints =
              docSlotSummary?.missingSlots?.length
                ? docSlotSummary.missingSlots
                : coverageSlotSummary?.slots ?? [];
            const docQueries = mergeHelixAskQueries(
              queries,
              [...slotHints, ...slotAliases, ...slotEvidenceHints],
              HELIX_ASK_QUERY_MERGE_MAX + 6,
            );
            const grepCandidates = collectDocsGrepCandidates(docQueries, baseQuestion, {
              allowlist: docsAllowlist,
              avoidlist: planScope?.avoidlist,
              limit: 200,
            });
            const perSlotCandidates: AskCandidate[] = [];
            if (slotPlan && docSlotSummary?.missingSlots?.length) {
              const channelSlotCandidates = await collectSlotDocCandidates({
                slotPlan,
                slotIds: docSlotSummary.missingSlots,
                question: baseQuestion,
                allowlist: slotDocsAllowlist,
                avoidlist: planScope?.avoidlist,
                topicProfile,
                limitPerSlot: 1,
              });
              if (channelSlotCandidates.length > 0) {
                perSlotCandidates.push(...channelSlotCandidates);
              }
              for (const slotId of docSlotSummary.missingSlots) {
                const slotEntry = slotPlan.slots.find((entry) => entry.id === slotId);
                if (!slotEntry) continue;
                const slotQueries = mergeHelixAskQueries(
                  [slotEntry.label ?? slotEntry.id],
                  buildSlotQueryTerms(slotEntry),
                  HELIX_ASK_QUERY_MERGE_MAX,
                );
                const slotGrep = collectDocsGrepCandidates(slotQueries, baseQuestion, {
                  allowlist: docsAllowlist,
                  avoidlist: planScope?.avoidlist,
                  limit: 120,
                });
                if (slotGrep.length > 0) {
                  perSlotCandidates.push(slotGrep[0]);
                }
              }
            }
            if (grepCandidates.length > 0 || perSlotCandidates.length > 0) {
              const candidateMap = new Map<string, AskCandidate>();
              for (const candidate of [...grepCandidates, ...perSlotCandidates]) {
                const existing = candidateMap.get(candidate.filePath);
                if (!existing || candidate.score > existing.score) {
                  candidateMap.set(candidate.filePath, candidate);
                }
              }
              const combinedCandidates = Array.from(candidateMap.values());
              const existing = new Set(contextFiles.map((entry) => entry.toLowerCase()));
              const extras = combinedCandidates.filter(
                (candidate) => !existing.has(candidate.filePath.toLowerCase()),
              );
              const extraLimit = Math.min(
                4,
                Math.max(minDocEvidenceCards - docBlocks.length, docSlotSummary?.missingSlots.length || 1),
              );
              const selectedExtras = selectCandidatesWithMmr(
                extras,
                extraLimit,
                HELIX_ASK_MMR_LAMBDA,
              );
              if (selectedExtras.length > 0) {
                let extraHeaderInjected = 0;
                const extraLines = selectedExtras
                  .map((entry) => {
                    const injected = injectDocHeaderPreview(entry.filePath, entry.preview);
                    if (injected.injected) extraHeaderInjected += 1;
                    const preview = clipAskText(injected.preview, HELIX_ASK_CONTEXT_CHARS);
                    if (!preview) return null;
                    return `${entry.filePath}\n${preview}`;
                  })
                  .filter(Boolean) as string[];
                if (extraLines.length > 0) {
                  contextText = [contextText, extraLines.join("\n\n")].filter(Boolean).join("\n\n");
                  contextFiles = Array.from(
                    new Set([...contextFiles, ...selectedExtras.map((entry) => entry.filePath)]),
                  );
                }
                if (extraHeaderInjected > 0) {
                  logEvent(
                    "Doc headers (fallback)",
                    "injected",
                    `count=${extraHeaderInjected}`,
                    contextStart,
                  );
                  if (debugPayload) {
                    debugPayload.doc_header_injected =
                      (debugPayload.doc_header_injected ?? 0) + extraHeaderInjected;
                  }
                }
              }
            }
            const refreshedDocs = selectDocBlocks(contextText, definitionFocus);
            const refreshedDocBlocks = refreshedDocs.docBlocks;
            docBlocks = mergeDefinitionRegistryBlocks(
              refreshedDocBlocks,
              definitionRegistryBlocks,
            );
            applyCompactionDebug(debugPayload, refreshedDocs.compaction);
            if (debugPayload) {
              debugPayload.proof_span_rate = Math.max(
                debugPayload.proof_span_rate ?? 0,
                refreshedDocs.proofSpanRate,
              );
              if (definitionFocus) {
                debugPayload.definition_doc_blocks = refreshedDocBlocks.length;
                debugPayload.definition_doc_span_rate = refreshedDocs.proofSpanRate;
              }
            }
            const refreshedDocText = refreshedDocBlocks.map((block) => block.block).join("\n\n");
            if (debugPayload && planScope?.docsFirst) {
              debugPayload.docs_first_evidence_cards = refreshedDocBlocks.length;
            }
            coverageSlotSummary = evaluateCoverageSlots({
              question: baseQuestion,
              referenceText: contextText,
              evidencePaths: contextFiles,
              conceptMatch,
              domain: intentDomain,
              explicitSlots: coverageSlots,
              slotAliases: coverageSlotAliasMap ?? undefined,
              includeQuestionTokens: coverageSlots.length === 0,
            });
            if (slotPlan && docSlotTargets.length > 0) {
              docSlotSummary = evaluateDocSlotCoverage(slotPlan, refreshedDocBlocks, docSlotTargets);
            } else {
              docSlotSummary =
                refreshedDocText.trim().length > 0
                  ? evaluateCoverageSlots({
                      question: baseQuestion,
                      referenceText: refreshedDocText,
                      evidencePaths: refreshedDocBlocks.map((block) => block.path),
                      conceptMatch,
                      domain: intentDomain,
                      explicitSlots: coverageSlots,
                      slotAliases: coverageSlotAliasMap ?? undefined,
                      includeQuestionTokens: coverageSlots.length === 0,
                    })
                  : coverageSlotSummary;
            }
            if (debugPayload && docSlotSummary?.ratio !== undefined) {
              debugPayload.slot_doc_coverage_rate = Math.max(
                debugPayload.slot_doc_coverage_rate ?? 0,
                docSlotSummary.ratio,
              );
            }
            if (planScope?.docsFirst) {
              const docStatus =
                refreshedDocBlocks.length >= minDocEvidenceCards &&
                (docSlotSummary?.missingSlots.length ?? 0) === 0
                  ? "ok"
                  : "weak";
              logEvent(
                "Docs-first evidence",
                docStatus,
                [
                  `docs=${refreshedDocBlocks.length}`,
                  `min=${minDocEvidenceCards}`,
                  docSlotSummary?.missingSlots?.length
                    ? `missing=${docSlotSummary.missingSlots.join(",")}`
                    : "missing=none",
                ].join(" | "),
              );
            }
            if (debugPayload && slotPlan) {
              const slotEvidence = buildSlotEvidenceSnapshot(slotPlan, docBlocks, docSlotSummary ?? coverageSlotSummary, {
                evidenceGateOk,
              });
              if (slotEvidence.length) {
                debugPayload.slot_evidence = slotEvidence;
                const rates = computeSlotEvidenceRates(slotPlan, slotEvidence);
                debugPayload.slot_doc_hit_rate = rates.docHitRate;
                debugPayload.slot_alias_coverage_rate = rates.aliasHitRate;
                if (!slotEvidenceLogged) {
                  const docHits = slotEvidence.filter((entry) => entry.doc_card_count > 0).length;
                  const aliasHits = slotEvidence.filter((entry) => entry.alias_card_count > 0).length;
                  logEvent(
                    "Slot evidence",
                    "ok",
                    `docHits=${docHits}/${slotEvidence.length} aliasHits=${aliasHits}/${slotEvidence.length}`,
                  );
                  slotEvidenceLogged = true;
                }
              }
            }
          }
          logProgress("Context ready", `${contextFiles.length} files`, contextStart);
          logEvent(
            "Context ready",
            `${contextFiles.length} files`,
            formatFileList(contextFiles),
            contextStart,
          );
          if (contextResult.topicTier) {
            logEvent(
              "Allowlist tier",
              `tier=${contextResult.topicTier}`,
              `mustInclude=${contextResult.topicMustIncludeOk ? "ok" : "missing"}`,
              contextStart,
            );
          } else {
            logEvent(
              "Allowlist tier",
              "none",
              topicProfile ? "no topic tier selected" : "no topic profile",
              contextStart,
            );
          }
        if (debugPayload && (contextFiles.length > 0 || blockScoped)) {
          debugPayload.context_files = contextFiles.slice();
          debugPayload.context_files_count = contextFiles.length;
        }
          if (debugPayload) {
            if (contextResult.topicTier) {
              debugPayload.topic_tier = contextResult.topicTier;
            }
            if (typeof contextResult.topicMustIncludeOk === "boolean") {
              debugPayload.topic_must_include_ok = contextResult.topicMustIncludeOk;
            }
            if (slotPlan && !debugPayload.slot_evidence) {
              const slotEvidence = buildSlotEvidenceSnapshot(slotPlan, docBlocks, docSlotSummary ?? coverageSlotSummary, {
                evidenceGateOk,
              });
              if (slotEvidence.length) {
                debugPayload.slot_evidence = slotEvidence;
                const rates = computeSlotEvidenceRates(slotPlan, slotEvidence);
                debugPayload.slot_doc_hit_rate = rates.docHitRate;
                debugPayload.slot_alias_coverage_rate = rates.aliasHitRate;
                if (!slotEvidenceLogged) {
                  const docHits = slotEvidence.filter((entry) => entry.doc_card_count > 0).length;
                  const aliasHits = slotEvidence.filter((entry) => entry.alias_card_count > 0).length;
                  logEvent(
                    "Slot evidence",
                    "ok",
                    `docHits=${docHits}/${slotEvidence.length} aliasHits=${aliasHits}/${slotEvidence.length}`,
                  );
                  slotEvidenceLogged = true;
                }
              }
            }
          }
        }

        if (!dryRun && graphPack?.contextText) {
          const merged = appendContextBlock(contextText, graphPack.contextText);
          if (merged !== contextText) {
            contextText = merged;
          }
          if (graphPack.sourcePaths.length > 0) {
            contextFiles = Array.from(new Set([...contextFiles, ...graphPack.sourcePaths]));
          }
          coverageSlotSummary = null;
          docSlotSummary = null;
          logEvent(
            "Graph pack",
            "context_added",
            `trees=${graphPack.frameworks.length} nodes=${graphPack.frameworks.reduce((sum, framework) => sum + framework.path.length, 0)}`,
          );
          if (debugPayload) {
            debugPayload.graph_framework_applied = true;
            debugPayload.context_files = contextFiles.slice();
            debugPayload.context_files_count = contextFiles.length;
          }
        }

        if (coverageSlotsFromRequest && evidenceUseQuestionTokens) {
          if (coverageSlots.length === 0) {
            coverageSlots = requestCoverageSlots.slice();
          }
          const coverageSlotAliases = collectCoverageSlotAliases(slotAliasMap, coverageSlots);
          if (coverageSlotAliases.length > 0 || slotEvidenceHints.length > 0) {
            evidenceSignalTokens = mergeEvidenceSignalTokens(
              coverageSlotAliases,
              slotEvidenceHints,
            );
            evidenceUseQuestionTokens = false;
          }
        }
        const baseEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
          minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
          minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
          signalTokens: evidenceSignalTokens,
          useQuestionTokens: evidenceUseQuestionTokens,
        });
        let evidenceGate = baseEvidenceGate;
        const evidenceCritic =
          HELIX_ASK_EVIDENCE_CRITIC
            ? evaluateEvidenceCritic(baseQuestion, contextText, {
                minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                signalTokens: evidenceSignalTokens,
                useQuestionTokens: evidenceUseQuestionTokens,
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
        if (!coverageSlotSummary) {
          coverageSlotSummary = evaluateCoverageSlots({
            question: baseQuestion,
            referenceText: contextText,
            evidencePaths: contextFiles,
            conceptMatch,
            domain: intentDomain,
            explicitSlots: coverageSlots,
            slotAliases: coverageSlotAliasMap ?? undefined,
            includeQuestionTokens: coverageSlots.length === 0,
          });
        }
        if (!docSlotSummary) {
          const selectedDocs = selectDocBlocks(contextText, definitionFocus);
          docBlocks = mergeDefinitionRegistryBlocks(
            selectedDocs.docBlocks,
            definitionRegistryBlocks,
          );
          applyCompactionDebug(debugPayload, selectedDocs.compaction);
          if (debugPayload) {
            debugPayload.proof_span_rate = Math.max(
              debugPayload.proof_span_rate ?? 0,
              selectedDocs.proofSpanRate,
            );
            if (definitionFocus) {
              debugPayload.definition_doc_blocks = docBlocks.length;
              debugPayload.definition_doc_span_rate = selectedDocs.proofSpanRate;
            }
          }
          const docContextText = docBlocks.map((block) => block.block).join("\n\n");
          if (!coverageSlotsFromRequest && slotPlan && docSlotTargets.length === 0) {
            const docRequiredSlots = resolveDocRequiredSlots(slotPlan);
            const requiredSlotIds = resolveRequiredSlots(slotPlan);
            docSlotTargets = docRequiredSlots.length > 0 ? docRequiredSlots : requiredSlotIds;
          }
          if (slotPlan && docSlotTargets.length > 0) {
            docSlotSummary = evaluateDocSlotCoverage(slotPlan, docBlocks, docSlotTargets);
          } else if (docContextText.trim().length > 0) {
            docSlotSummary = evaluateCoverageSlots({
              question: baseQuestion,
              referenceText: docContextText,
              evidencePaths: docBlocks.map((block) => block.path),
              conceptMatch,
              domain: intentDomain,
              explicitSlots: coverageSlots,
              slotAliases: coverageSlotAliasMap ?? undefined,
              includeQuestionTokens: coverageSlots.length === 0,
            });
          }
          if (debugPayload && docSlotSummary?.ratio !== undefined) {
            debugPayload.slot_doc_coverage_rate = Math.max(
              debugPayload.slot_doc_coverage_rate ?? 0,
              docSlotSummary.ratio,
            );
          }
        }
        const contextFilesSnapshot = extractFilePathsFromText(contextText);
        retrievalFilesSnapshot = contextFilesSnapshot.slice();
        const planMustIncludeMissing = resolveMustIncludeMissing(planScope, contextFilesSnapshot);
        const planMustIncludeOk =
          planScope?.mustIncludeGlobs?.length
            ? contextFilesSnapshot.some((filePath) => pathMatchesAny(filePath, planScope?.mustIncludeGlobs ?? []))
            : true;
        if (blockScoped) {
          const planMissing = new Set<string>([
            ...(planScope?.mustIncludeMissing ?? []),
            ...planMustIncludeMissing,
          ]);
          blockMustIncludeMissing = Array.from(planMissing);
        }
        if (!planMustIncludeOk && !blockScoped) {
          mustIncludeOk = false;
        }
        const slotCoverage = requiredSlots.length
          ? evaluateSlotCoverage({ contextText, requiredSlots, conceptMatch })
          : { required: [], covered: [], missing: [], ratio: 1 };
        slotCoverageOk = slotCoverage.missing.length === 0;
        slotCoverageFailed = requiredSlots.length > 0 && !slotCoverageOk;
        if (slotCoverageFailed) {
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
          mode: "fallback",
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
          const repoSearchHits = repoSearchResult.hits.filter(
            (hit) => !isIndexOnlyPath(hit.filePath ?? ""),
          );
          if (repoSearchHits.length > 0) {
            const formatted = formatRepoSearchEvidence({
              ...repoSearchResult,
              hits: repoSearchHits,
            });
            contextText = [contextText, formatted.evidenceText].filter(Boolean).join("\n\n");
            if (formatted.filePaths.length > 0) {
              contextFiles = Array.from(new Set([...contextFiles, ...formatted.filePaths]));
            }
            const repoEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
              minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
              minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
              signalTokens: evidenceSignalTokens,
              useQuestionTokens: evidenceUseQuestionTokens,
            });
            evidenceGate = repoEvidenceGate;
            if (HELIX_ASK_EVIDENCE_CRITIC) {
              const repoCritic = evaluateEvidenceCritic(baseQuestion, contextText, {
                minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
                minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
                signalTokens: evidenceSignalTokens,
                useQuestionTokens: evidenceUseQuestionTokens,
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
              `hits=${repoSearchHits.length}`,
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
            debugPayload.repo_search_hits = repoSearchHits.length;
            debugPayload.repo_search_truncated = repoSearchResult.truncated;
            if (repoSearchResult.error) {
              debugPayload.repo_search_error = repoSearchResult.error;
            }
          }
        }
        if (coverageSlotSummary) {
          coverageSlotSummary = evaluateCoverageSlots({
            question: baseQuestion,
            referenceText: contextText,
            evidencePaths: contextFiles,
            conceptMatch,
            domain: intentDomain,
            explicitSlots: coverageSlots,
            slotAliases: coverageSlotAliasMap ?? undefined,
            includeQuestionTokens: coverageSlots.length === 0,
          });
        }
        if (docSlotSummary) {
          const selectedDocs = selectDocBlocks(contextText, definitionFocus);
          docBlocks = mergeDefinitionRegistryBlocks(
            selectedDocs.docBlocks,
            definitionRegistryBlocks,
          );
          applyCompactionDebug(debugPayload, selectedDocs.compaction);
          if (debugPayload) {
            debugPayload.proof_span_rate = Math.max(
              debugPayload.proof_span_rate ?? 0,
              selectedDocs.proofSpanRate,
            );
            if (definitionFocus) {
              debugPayload.definition_doc_blocks = docBlocks.length;
              debugPayload.definition_doc_span_rate = selectedDocs.proofSpanRate;
            }
          }
          const docContextText = docBlocks.map((block) => block.block).join("\n\n");
          if (slotPlan && docSlotTargets.length > 0) {
            docSlotSummary = evaluateDocSlotCoverage(slotPlan, docBlocks, docSlotTargets);
          } else if (docContextText.trim().length > 0) {
            docSlotSummary = evaluateCoverageSlots({
              question: baseQuestion,
              referenceText: docContextText,
              evidencePaths: docBlocks.map((block) => block.path),
              conceptMatch,
              domain: intentDomain,
              explicitSlots: coverageSlots,
              slotAliases: coverageSlotAliasMap ?? undefined,
              includeQuestionTokens: coverageSlots.length === 0,
            });
          }
          if (debugPayload && docSlotSummary?.ratio !== undefined) {
            debugPayload.slot_doc_coverage_rate = Math.max(
              debugPayload.slot_doc_coverage_rate ?? 0,
              docSlotSummary.ratio,
            );
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
          if (planScope?.mustIncludeMissing?.length) {
            debugPayload.plan_scope_must_include_missing = planScope.mustIncludeMissing.slice(0, 6);
          }
        }
        evidenceGateOk = evidenceGate.ok;
        logEvent(
          "Evidence gate",
          evidenceGate.ok ? "ok" : "fail",
          [
            `ratio=${evidenceGate.matchRatio.toFixed(2)}`,
            `count=${evidenceGate.matchCount}`,
            `tokens=${evidenceGate.tokenCount}`,
            `confidence=${retrievalConfidence.toFixed(2)}`,
          ].join(" | "),
          undefined,
          evidenceGate.ok,
          {
            ratio: Number(evidenceGate.matchRatio.toFixed(3)),
            count: evidenceGate.matchCount,
            tokenCount: evidenceGate.tokenCount,
            retrievalConfidence: Number(retrievalConfidence.toFixed(3)),
            docShare: Number(docShare.toFixed(3)),
            docHits: docsHits.length,
            queryHitCount,
          },
        );
        if (debugPayload) {
          const evidenceTokensPreview = buildEvidenceEligibilityTokens(
            baseQuestion,
            evidenceSignalTokens,
            evidenceUseQuestionTokens,
          );
          const matchedPreview = matchEvidenceTokens(evidenceTokensPreview, contextText);
          debugPayload.evidence_gate_ok = evidenceGate.ok;
          debugPayload.evidence_match_ratio = evidenceGate.matchRatio;
          debugPayload.evidence_match_count = evidenceGate.matchCount;
          debugPayload.evidence_token_count = evidenceGate.tokenCount;
          debugPayload.evidence_use_question_tokens = evidenceUseQuestionTokens;
          debugPayload.evidence_signal_tokens = evidenceSignalTokens.slice(0, 12);
          debugPayload.evidence_tokens_preview = evidenceTokensPreview.slice(0, 12);
          debugPayload.evidence_match_preview = matchedPreview.slice(0, 12);
          debugPayload.retrieval_confidence = retrievalConfidence;
          debugPayload.retrieval_doc_share = docShare;
          debugPayload.retrieval_doc_hits = docsHits.length;
          debugPayload.retrieval_context_file_count = contextFilesSnapshot.length;
          debugPayload.retrieval_query_hit_count = queryHitCount;
          debugPayload.retrieval_top_score = topScore;
          debugPayload.retrieval_score_gap = scoreGap;
          debugPayload.retrieval_channel_hits = channelHits;
          debugPayload.retrieval_channel_top_scores = channelTopScores;
          debugPayload.retrieval_channel_weights = contextMeta.channelWeights;
          if (typeof contextMeta.docHeaderInjected === "number") {
            debugPayload.doc_header_injected = Math.max(
              debugPayload.doc_header_injected ?? 0,
              contextMeta.docHeaderInjected,
            );
          }
          debugPayload.slot_coverage_required = slotCoverage.required;
          debugPayload.slot_coverage_missing = slotCoverage.missing;
          debugPayload.slot_coverage_ratio = slotCoverage.ratio;
          debugPayload.slot_coverage_ok = slotCoverageOk;
          if (coverageSlotSummary) {
            debugPayload.coverage_slots_required = coverageSlotSummary.slots;
            debugPayload.coverage_slots_covered = coverageSlotSummary.coveredSlots;
            debugPayload.coverage_slots_missing = coverageSlotSummary.missingSlots;
            debugPayload.coverage_slots_ratio = coverageSlotSummary.ratio;
          }
          if (docSlotSummary) {
            debugPayload.docs_first_slot_covered = docSlotSummary.coveredSlots;
            debugPayload.docs_first_slot_missing = docSlotSummary.missingSlots;
            debugPayload.docs_first_slot_ratio = docSlotSummary.ratio;
          }
          if (slotPlan) {
            const slotEvidence = buildSlotEvidenceSnapshot(slotPlan, docBlocks, docSlotSummary ?? coverageSlotSummary, {
              evidenceGateOk,
            });
            if (slotEvidence.length) {
              debugPayload.slot_evidence = slotEvidence;
              const rates = computeSlotEvidenceRates(slotPlan, slotEvidence);
              slotEvidenceRates = rates;
              debugPayload.slot_doc_hit_rate = rates.docHitRate;
              debugPayload.slot_alias_coverage_rate = rates.aliasHitRate;
              if (!slotEvidenceLogged) {
                const docHits = slotEvidence.filter((entry) => entry.doc_card_count > 0).length;
                const aliasHits = slotEvidence.filter((entry) => entry.alias_card_count > 0).length;
                logEvent(
                  "Slot evidence",
                  "ok",
                  `docHits=${docHits}/${slotEvidence.length} aliasHits=${aliasHits}/${slotEvidence.length}`,
                  undefined,
                  true,
                  {
                    docHits,
                    aliasHits,
                    slotCount: slotEvidence.length,
                  },
                );
                slotEvidenceLogged = true;
              }
            }
          }
        }
        if (slotPlan && !slotEvidenceRates) {
          const slotEvidence = buildSlotEvidenceSnapshot(slotPlan, docBlocks, docSlotSummary ?? coverageSlotSummary, {
            evidenceGateOk,
          });
          if (slotEvidence.length) {
            slotEvidenceRates = computeSlotEvidenceRates(slotPlan, slotEvidence);
          }
        }
        if (requiredSlots.length > 0) {
          logEvent(
            "Slot coverage",
            slotCoverageOk ? "ok" : "missing",
            [
              `ratio=${slotCoverage.ratio.toFixed(2)}`,
              slotCoverage.missing.length ? `missing=${slotCoverage.missing.join(",")}` : "missing=none",
            ].join(" | "),
            undefined,
            slotCoverageOk,
            {
              ratio: Number(slotCoverage.ratio.toFixed(3)),
              missing: slotCoverage.missing,
              required: slotCoverage.required,
            },
          );
        }
        if (coverageSlotSummary && coverageSlotSummary.slots.length > 0) {
          const coverageOk = coverageSlotSummary.missingSlots.length === 0;
          logEvent(
            "Coverage slots",
            coverageOk ? "ok" : "missing",
            [
              `ratio=${coverageSlotSummary.ratio.toFixed(2)}`,
              coverageSlotSummary.missingSlots.length
                ? `missing=${coverageSlotSummary.missingSlots.join(",")}`
                : "missing=none",
            ].join(" | "),
            undefined,
            coverageOk,
            {
              ratio: Number(coverageSlotSummary.ratio.toFixed(3)),
              missing: coverageSlotSummary.missingSlots,
              required: coverageSlotSummary.slots,
            },
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
        recordControllerStep({
          step: "initial",
          evidenceOk: evidenceGateOk,
          slotCoverageOk,
          docCoverageOk: !docSlotCoverageFailed,
          missingSlots:
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [],
          retrievalConfidence,
        });
        const applyContextAttempt = (
          label: string,
          result: Awaited<ReturnType<typeof buildAskContextFromQueries>>,
          startedAt: number,
          queries: string[],
          scopeOverride?: HelixAskPlanScope | null,
        ): { applied: boolean; observedDelta?: string; missingSlots: string[] } => {
          const beforeMissingSlots =
            docSlotSummary?.missingSlots?.length ??
            coverageSlotSummary?.missingSlots?.length ??
            0;
          const beforeEvidenceOk = evidenceGateOk;
          if (!result.context) {
            logEvent(
              `Retrieval ${label}`,
              "no_context",
              `${label} yielded empty context`,
              startedAt,
            );
            return { applied: false, missingSlots: [] };
          }
          contextText = result.context;
          contextFiles = result.files.slice();
          topicMustIncludeOk = result.topicMustIncludeOk;
          if (result.docHeaderInjected && result.docHeaderInjected > 0) {
            logEvent("Doc headers", "injected", `count=${result.docHeaderInjected}`, startedAt);
            if (debugPayload) {
              debugPayload.doc_header_injected = Math.max(
                debugPayload.doc_header_injected ?? 0,
                result.docHeaderInjected,
              );
            }
          }
          const attemptEvidenceGate = evaluateEvidenceEligibility(baseQuestion, contextText, {
            minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
            minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
            signalTokens: evidenceSignalTokens,
            useQuestionTokens: evidenceUseQuestionTokens,
          });
          evidenceGate = attemptEvidenceGate;
          if (HELIX_ASK_EVIDENCE_CRITIC) {
            const attemptCritic = evaluateEvidenceCritic(baseQuestion, contextText, {
              minTokens: HELIX_ASK_EVIDENCE_MATCH_MIN_TOKENS,
              minRatio: HELIX_ASK_EVIDENCE_MATCH_MIN_RATIO,
              signalTokens: evidenceSignalTokens,
              useQuestionTokens: evidenceUseQuestionTokens,
            });
            if (attemptCritic.tokenCount > 0) {
              evidenceGate = attemptCritic;
            }
            if (debugPayload) {
              debugPayload.evidence_critic_applied = true;
              debugPayload.evidence_critic_ok = attemptCritic.ok;
              debugPayload.evidence_critic_ratio = attemptCritic.matchRatio;
              debugPayload.evidence_critic_count = attemptCritic.matchCount;
              debugPayload.evidence_critic_tokens = attemptCritic.tokenCount;
            }
          }
          mustIncludeOk =
            typeof topicMustIncludeOk === "boolean"
              ? topicMustIncludeOk
              : topicMustIncludeSatisfied(extractFilePathsFromText(contextText), topicProfile);
          const attemptFiles = extractFilePathsFromText(contextText);
          const attemptScope = scopeOverride ?? planScope;
          const attemptPlanMustIncludeOk =
            attemptScope?.mustIncludeGlobs?.length
              ? attemptFiles.some((filePath) => pathMatchesAny(filePath, attemptScope?.mustIncludeGlobs ?? []))
              : true;
          if (!attemptPlanMustIncludeOk) {
            mustIncludeOk = false;
          }
          const attemptSlotCoverage = requiredSlots.length
            ? evaluateSlotCoverage({ contextText, requiredSlots, conceptMatch })
            : { required: [], covered: [], missing: [], ratio: 1 };
          const attemptSlotCoverageOk = attemptSlotCoverage.missing.length === 0;
          slotCoverageOk = attemptSlotCoverageOk;
          slotCoverageFailed = requiredSlots.length > 0 && !slotCoverageOk;
          coverageSlotSummary = evaluateCoverageSlots({
            question: baseQuestion,
            referenceText: contextText,
            evidencePaths: attemptFiles,
            conceptMatch,
            domain: intentDomain,
            explicitSlots: coverageSlots,
            slotAliases: coverageSlotAliasMap ?? undefined,
            includeQuestionTokens: coverageSlots.length === 0,
          });
          const attemptDocSelection = selectDocBlocks(contextText, definitionFocus);
          const attemptDocBlocks = attemptDocSelection.docBlocks;
          const attemptDocText = attemptDocBlocks.map((block) => block.block).join("\n\n");
          docBlocks = mergeDefinitionRegistryBlocks(
            attemptDocBlocks,
            definitionRegistryBlocks,
          );
          applyCompactionDebug(debugPayload, attemptDocSelection.compaction);
          if (debugPayload) {
            debugPayload.proof_span_rate = Math.max(
              debugPayload.proof_span_rate ?? 0,
              attemptDocSelection.proofSpanRate,
            );
            if (definitionFocus) {
              debugPayload.definition_doc_blocks = attemptDocBlocks.length;
              debugPayload.definition_doc_span_rate = attemptDocSelection.proofSpanRate;
            }
          }
          if (!coverageSlotsFromRequest && slotPlan && docSlotTargets.length === 0) {
            const docRequiredSlots = resolveDocRequiredSlots(slotPlan);
            const requiredSlotIds = resolveRequiredSlots(slotPlan);
            docSlotTargets = docRequiredSlots.length > 0 ? docRequiredSlots : requiredSlotIds;
          }
          if (slotPlan && docSlotTargets.length > 0) {
            docSlotSummary = evaluateDocSlotCoverage(slotPlan, attemptDocBlocks, docSlotTargets);
          } else if (attemptDocText.trim().length > 0) {
            docSlotSummary = evaluateCoverageSlots({
              question: baseQuestion,
              referenceText: attemptDocText,
              evidencePaths: attemptDocBlocks.map((block) => block.path),
              conceptMatch,
              domain: intentDomain,
              explicitSlots: coverageSlots,
              slotAliases: coverageSlotAliasMap ?? undefined,
              includeQuestionTokens: coverageSlots.length === 0,
            });
          }
          if (debugPayload && docSlotSummary?.ratio !== undefined) {
            debugPayload.slot_doc_coverage_rate = Math.max(
              debugPayload.slot_doc_coverage_rate ?? 0,
              docSlotSummary.ratio,
            );
          }
          if (requiredSlots.length && !attemptSlotCoverageOk) {
            mustIncludeOk = false;
            evidenceGate = { ...evidenceGate, ok: false };
          }
          const attemptQueryHits = result.queryHitCount ?? 0;
          const attemptTopScore = result.topScore ?? 0;
          const attemptScoreGap = result.scoreGap ?? 0;
          const attemptChannelHits = result.channelHits ?? initAskChannelStats();
          const attemptChannelTopScores = result.channelTopScores ?? initAskChannelStats();
          const attemptDocFiles = attemptFiles.filter((filePath) => /(^|\/)docs\//i.test(filePath));
          const attemptDocShare = attemptFiles.length ? attemptDocFiles.length / attemptFiles.length : 0;
          const attemptChannelCoverage =
            HELIX_ASK_CHANNELS.filter((channel) => attemptChannelHits[channel] > 0).length /
            HELIX_ASK_CHANNELS.length;
          retrievalConfidence = evidenceGate.matchRatio;
          if (mustIncludeOk) retrievalConfidence += 0.15;
          if (viabilityMustIncludeOk) retrievalConfidence += 0.05;
          if (verificationAnchorRequired && verificationAnchorOk) retrievalConfidence += 0.1;
          if (attemptFiles.length >= 5) retrievalConfidence += 0.05;
          if (attemptDocShare >= 0.4) retrievalConfidence += 0.1;
          if (attemptQueryHits >= 2) retrievalConfidence += 0.05;
          if (attemptChannelCoverage >= 0.67) retrievalConfidence += 0.05;
          if (attemptScoreGap >= 0.02 || attemptTopScore >= 0.05) retrievalConfidence += 0.05;
          if (evidenceGate.matchCount === 0) retrievalConfidence = 0;
          retrievalConfidence = Math.min(1, Math.max(0, retrievalConfidence));
          evidenceGateOk = evidenceGate.ok;
          if (debugPayload) {
            debugPayload.evidence_gate_ok = evidenceGate.ok;
            debugPayload.evidence_match_ratio = evidenceGate.matchRatio;
            debugPayload.evidence_match_count = evidenceGate.matchCount;
            debugPayload.evidence_token_count = evidenceGate.tokenCount;
            debugPayload.context_files = result.files;
            debugPayload.queries = queries;
            debugPayload.retrieval_confidence = retrievalConfidence;
            debugPayload.retrieval_doc_share = attemptDocShare;
            debugPayload.retrieval_doc_hits = attemptDocFiles.length;
            debugPayload.retrieval_context_file_count = attemptFiles.length;
            debugPayload.retrieval_query_hit_count = attemptQueryHits;
            debugPayload.retrieval_top_score = attemptTopScore;
            debugPayload.retrieval_score_gap = attemptScoreGap;
            debugPayload.retrieval_channel_hits = attemptChannelHits;
            debugPayload.retrieval_channel_top_scores = attemptChannelTopScores;
            debugPayload.retrieval_channel_weights = result.channelWeights;
            debugPayload.plan_must_include_ok = attemptPlanMustIncludeOk;
            debugPayload.slot_coverage_required = attemptSlotCoverage.required;
            debugPayload.slot_coverage_missing = attemptSlotCoverage.missing;
            debugPayload.slot_coverage_ratio = attemptSlotCoverage.ratio;
            debugPayload.slot_coverage_ok = attemptSlotCoverageOk;
            if (coverageSlotSummary) {
              debugPayload.coverage_slots_required = coverageSlotSummary.slots;
              debugPayload.coverage_slots_covered = coverageSlotSummary.coveredSlots;
              debugPayload.coverage_slots_missing = coverageSlotSummary.missingSlots;
              debugPayload.coverage_slots_ratio = coverageSlotSummary.ratio;
            }
            if (docSlotSummary) {
              debugPayload.docs_first_slot_covered = docSlotSummary.coveredSlots;
              debugPayload.docs_first_slot_missing = docSlotSummary.missingSlots;
              debugPayload.docs_first_slot_ratio = docSlotSummary.ratio;
            }
          }
          logProgress(
            `Context ${label} ready`,
            `${result.files.length} files`,
            startedAt,
          );
          logEvent(
            `Retrieval ${label}`,
            `match=${evidenceGate.matchCount}/${evidenceGate.tokenCount}`,
            [
              `ratio=${evidenceGate.matchRatio.toFixed(2)}`,
              `mustInclude=${mustIncludeOk ? "ok" : "missing"}`,
              `files=${result.files.length}`,
            ].join(" | "),
            startedAt,
          );
          logEvent(
            "Retrieval confidence",
            retrievalConfidence >= 0.6 ? "high" : retrievalConfidence >= 0.35 ? "med" : "low",
            [
              `score=${retrievalConfidence.toFixed(2)}`,
              `docShare=${attemptDocShare.toFixed(2)}`,
              `files=${attemptFiles.length}`,
              `queries=${attemptQueryHits}`,
            ].join(" | "),
            startedAt,
          );
          if (requiredSlots.length > 0) {
            logEvent(
              "Slot coverage",
              attemptSlotCoverageOk ? "ok" : "missing",
              [
                `ratio=${attemptSlotCoverage.ratio.toFixed(2)}`,
                attemptSlotCoverage.missing.length
                  ? `missing=${attemptSlotCoverage.missing.join(",")}`
                  : "missing=none",
              ].join(" | "),
              startedAt,
            );
          }
          logEvent(
            "Retrieval channels",
            "ok",
            [
              `hits=lex:${attemptChannelHits.lexical},sym:${attemptChannelHits.symbol},fuz:${attemptChannelHits.fuzzy}`,
              `tops=lex:${attemptChannelTopScores.lexical.toFixed(2)},sym:${attemptChannelTopScores.symbol.toFixed(
                2,
              )},fuz:${attemptChannelTopScores.fuzzy.toFixed(2)}`,
            ].join(" | "),
            startedAt,
          );
          const afterMissingSlots =
            docSlotSummary?.missingSlots?.length ??
            coverageSlotSummary?.missingSlots?.length ??
            0;
          const observedDelta = `slots:${beforeMissingSlots}->${afterMissingSlots}; evidence:${beforeEvidenceOk ? "ok" : "fail"}->${evidenceGateOk ? "ok" : "fail"}`;
          const missingSlots =
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [];
          return { applied: true, observedDelta, missingSlots };
        };
        const arbiterHybridThreshold = Math.min(arbiterRepoRatio, arbiterHybridRatio);
        const coverageSlotsMissing = Boolean(
          coverageSlotSummary && coverageSlotSummary.missingSlots.length > 0,
        );
        const missingSlotsForRetry =
          slotCoverageFailed ||
          (docSlotSummary?.missingSlots?.length ?? 0) > 0 ||
          coverageSlotsMissing;
        const shouldRetryRetrieval =
          HELIX_ASK_RETRIEVAL_RETRY_ENABLED &&
          !promptIngested &&
          hasRepoHints &&
          (retrievalConfidence < arbiterHybridThreshold || missingSlotsForRetry) &&
          canAgentAct();
        let retryMissingSlots: string[] = [];
        if (shouldRetryRetrieval) {
          const retrySlotTargets =
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [];
          const retrySlotHints = buildRetryHintsForSlots(slotPlan, retrySlotTargets);
          const retryHints = [
            ...(topicProfile?.mustIncludeFiles ?? []),
            ...compositeRequiredFiles,
            ...verificationAnchorHints,
            ...retrySlotTargets.slice(0, 4),
            ...retrySlotHints,
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
          const retryStart = logStepStart(
            "Retrieval retry",
            `slots=${retrySlotTargets.length} queries=${retryQueries.length}`,
            {
              slotCount: retrySlotTargets.length,
              queryCount: retryQueries.length,
              topK: retryTopK,
              fn: "buildAskContextFromQueries",
              phase: "retry",
            },
          );
          const retryResult = await buildAskContextFromQueries(
            baseQuestion,
            retryQueries,
            retryTopK,
            topicProfile,
            planScope ?? undefined,
          );
          const retryApplied = applyContextAttempt(
            "retry",
            retryResult,
            retryStart,
            retryQueries,
            planScope ?? undefined,
          );
          const retryDurationMs = Date.now() - retryStart;
          if (retryApplied.applied) {
            logStepEnd(
              "Retrieval retry",
              `files=${retryResult.files.length}`,
              retryStart,
              true,
              {
                files: retryResult.files.length,
                missingSlots: retryApplied.missingSlots,
                fn: "buildAskContextFromQueries",
              },
            );
            retryMissingSlots = retryApplied.missingSlots;
            recordAgentAction(
              "slot_local_retry",
              "slot_missing",
              "recover_missing_slots",
              retryApplied.observedDelta,
              true,
              retryDurationMs,
            );
          } else {
            recordAgentAction(
              "slot_local_retry",
              "no_context",
              "recover_missing_slots",
              "no_context",
              false,
              retryDurationMs,
            );
          }
          recordControllerStep({
            step: "retry",
            action: retryApplied.applied ? "applied" : "no_context",
            reason: retryApplied.applied ? "slot_missing" : "no_context",
            evidenceOk: evidenceGateOk,
            slotCoverageOk,
            docCoverageOk: !docSlotCoverageFailed,
            missingSlots: retryApplied.missingSlots,
            retrievalConfidence,
          });
        }
        const missingSlotsForCodeFirst =
          (docSlotSummary?.missingSlots?.length ?? 0) > 0 ||
          (coverageSlotSummary?.missingSlots?.length ?? 0) > 0 ||
          retryMissingSlots.length > 0;
        if (HELIX_ASK_AGENT_CODE_FIRST && missingSlotsForCodeFirst && canAgentAct()) {
          const codeSlotTargets =
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? retryMissingSlots;
          const codeSlotHints = buildRetryHintsForSlots(slotPlan, codeSlotTargets);
          const codeHints = [
            ...(topicProfile?.mustIncludeFiles ?? []),
            ...compositeRequiredFiles,
            ...verificationAnchorHints,
            ...codeSlotTargets.slice(0, 4),
            ...codeSlotHints,
          ];
          const codeQueries = mergeHelixAskQueries(
            baseQueries,
            codeHints,
            HELIX_ASK_QUERY_MERGE_MAX + 2,
          );
          const codeScope = buildCodeFirstPlanScopeOverride(planScope ?? undefined);
          const codeStart = logStepStart(
            "Retrieval code-first",
            `slots=${codeSlotTargets.length} queries=${codeQueries.length}`,
            {
              slotCount: codeSlotTargets.length,
              queryCount: codeQueries.length,
              fn: "buildAskContextFromQueries",
              phase: "codeFirst",
            },
          );
          const codeResult = await buildAskContextFromQueries(
            baseQuestion,
            codeQueries,
            parsed.data.topK,
            topicProfile,
            codeScope,
          );
          const codeApplied = applyContextAttempt(
            "code-first",
            codeResult,
            codeStart,
            codeQueries,
            codeScope,
          );
          const codeDurationMs = Date.now() - codeStart;
          if (codeApplied.applied) {
            logStepEnd(
              "Retrieval code-first",
              `files=${codeResult.files.length}`,
              codeStart,
              true,
              {
                files: codeResult.files.length,
                missingSlots: codeApplied.missingSlots,
                fn: "buildAskContextFromQueries",
              },
            );
            recordAgentAction(
              "retrieve_code_first",
              "slot_missing",
              "surface_code",
              codeApplied.observedDelta,
              true,
              codeDurationMs,
            );
          } else {
            recordAgentAction(
              "retrieve_code_first",
              "no_context",
              "surface_code",
              "no_context",
              false,
              codeDurationMs,
            );
          }
          recordControllerStep({
            step: "code_first",
            action: codeApplied.applied ? "applied" : "no_context",
            reason: codeApplied.applied ? "slot_missing" : "no_context",
            evidenceOk: evidenceGateOk,
            slotCoverageOk,
            docCoverageOk: !docSlotCoverageFailed,
            missingSlots: codeApplied.missingSlots,
            retrievalConfidence,
          });
        } else if (!canAgentAct() && missingSlotsForCodeFirst) {
          markAgentStopIfBlocked();
        }
          const repoDocsRequired =
            requiresRepoEvidence ||
            intentDomain === "repo" ||
            intentDomain === "hybrid" ||
            intentDomain === "falsifiable";
          const definitionDocRequired = definitionFocus && (repoDocsRequired || Boolean(conceptMatch));
          const definitionDocBlocks = resolveDefinitionDocBlocks(
            docBlocks,
            conceptMatch,
            definitionFocus,
          );
          const definitionDocOk = !definitionDocRequired || definitionDocBlocks.length > 0;
          definitionDocMissing = definitionDocRequired && !definitionDocOk;
          if (debugPayload) {
            debugPayload.definition_doc_required = definitionDocRequired;
            debugPayload.definition_doc_ok = definitionDocOk;
            debugPayload.definition_doc_blocks = definitionDocBlocks.length;
          }
          docSlotCoverageFailed =
            (repoDocsRequired &&
              docSlotTargets.length > 0 &&
              ((docSlotSummary?.missingSlots?.length ?? 0) > 0 ||
                (minDocEvidenceCards > 0 &&
                  definitionDocBlocks.length < minDocEvidenceCards))) ||
            definitionDocMissing;
        if (docSlotCoverageFailed) {
          mustIncludeOk = false;
          evidenceGate = { ...evidenceGate, ok: false };
          evidenceGateOk = false;
          if (debugPayload) {
            debugPayload.evidence_gate_ok = false;
          }
        }
        if (agentStopReason === null) {
          const remainingSlots =
            docSlotSummary?.missingSlots?.length ??
            coverageSlotSummary?.missingSlots?.length ??
            0;
          if (evidenceGateOk && !slotCoverageFailed && !docSlotCoverageFailed) {
            agentStopReason = "proof_density_sufficient";
          } else if (remainingSlots > 0 && requiresRepoEvidence) {
            agentStopReason = "only_missing_slots_need_user";
          } else if (!canAgentAct()) {
            agentStopReason = getAgentBlockReason() ?? "budget_exhausted";
          }
          updateAgentDebug();
          if (agentStopReason) {
            recordControllerStop(agentStopReason);
          }
        }
        if (
          HELIX_ASK_SESSION_MEMORY &&
          parsed.data.sessionId &&
          slotPlan &&
          evidenceGateOk &&
          !slotCoverageFailed &&
          !docSlotCoverageFailed
        ) {
          const strongSlots = slotPlan.slots.filter((slot) => !isWeakSlot(slot));
          const slotsToRecord = strongSlots.map((slot) => ({
            id: slot.id,
            label: slot.label,
            aliases: slot.aliases,
          }));
          const resolvedConcepts = buildResolvedConceptSnapshot(slotPlan, contextFiles);
          const userPrefs = {
            hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
            verbosity: parsed.data.verbosity,
            citationsRequired: requiresRepoEvidence,
          };
          if (slotsToRecord.length > 0 || contextFiles.length > 0 || resolvedConcepts.length > 0) {
            recordHelixAskSessionMemory({
              sessionId: parsed.data.sessionId,
              slots: slotsToRecord,
              pinnedFiles: contextFiles,
              resolvedConcepts,
              graphTreeIds: graphPack?.treeIds,
              openSlots:
                docSlotSummary?.missingSlots?.length
                  ? docSlotSummary.missingSlots
                  : coverageSlotSummary?.missingSlots ?? [],
              attempts: agentActions.map((entry) => entry.action),
              recentTopics: topicTags,
              userPrefs,
            });
          }
        }
        if (blockScoped) {
          const blockDocHitRate = slotEvidenceRates?.docHitRate ?? 0;
          const blockEvidenceStrong =
            evidenceGateOk && !docSlotCoverageFailed && blockDocHitRate >= 0.5;
          if (blockEvidenceStrong) {
            if (!mustIncludeOk || !planMustIncludeOk) {
              blockGateDecision = "evidence_override";
            } else {
              blockGateDecision = "default";
            }
            mustIncludeOk = true;
          } else if (!planMustIncludeOk) {
            blockGateDecision = "plan_must_include_missing";
            mustIncludeOk = false;
          } else {
            blockGateDecision = "default";
          }
          blockMustIncludeOk = mustIncludeOk;
        }
        if (blockScoped && debugPayload) {
          debugPayload.block_must_include_ok = blockMustIncludeOk ?? mustIncludeOk;
          debugPayload.block_must_include_missing = blockMustIncludeMissing.slice(0, 6);
          debugPayload.block_doc_slot_targets = docSlotTargets.slice(0, 6);
          debugPayload.block_gate_decision = blockGateDecision;
        }
        requiresRepoEvidence =
          requiresRepoEvidence ||
          intentDomain === "repo" ||
          intentDomain === "hybrid" ||
          intentDomain === "falsifiable";
        const userExpectsRepo =
          intentDomain === "falsifiable" || requiresRepoEvidence;
        failClosedReason = null;
        if (requiresRepoEvidence && intentStrategy !== "constraint_report") {
          if (definitionDocMissing) {
            failClosedReason = "definition_doc_missing";
          } else if (slotCoverageFailed) {
            failClosedReason = "slot_coverage_failed";
          } else if (docSlotCoverageFailed) {
            failClosedReason = "doc_slot_missing";
          } else if (!evidenceGateOk) {
            failClosedReason = "evidence_gate_failed";
          }
        }
        failClosedRepoEvidence = Boolean(failClosedReason);
        const hasHighStakesConstraints =
          intentTier === "F3" ||
          intentStrategy === "constraint_report" ||
          compositeConstraintRequested;
        const activeJobCount = await getHelixAskActiveJobCount();
        const clockAP95Ms = Math.max(0, Date.now() - askRequestStartedAt);
        const kvTokens = askSessionId ? kvGetSessionTokensApprox(askSessionId) : 0;
        const thermals = getGpuThermals();
        const lanePressure = {
          llm: Math.min(1, clockAP95Ms / Math.max(1, runtimeContract.clockA.p95_ms)),
          io: Math.min(1, retrievalConfidence),
          media: Math.min(1, thermals.current / Math.max(1, thermals.max)),
          physics: 0,
          perception: 0,
        };
        const budgetState = evaluateRuntimeBudgetState({
          clockAP95Ms,
          clockABudgetMs: runtimeContract.clockA.p95_ms,
          toolCallsLastTick: Math.max(0, getAgentStepCount()),
          maxToolCalls: runtimeContract.clockA.max_tool_calls,
          kvTokens,
          kvMaxTokens: runtimeContract.kv.max_tokens,
          queueDepth: activeJobCount,
          queueMaxDepth: runtimeContract.clockB.max_queue_depth,
          lanePressure,
        });
        const arbiterDecision = resolveHelixAskArbiter({
          retrievalConfidence,
          repoThreshold: arbiterRepoRatio,
          hybridThreshold: arbiterHybridRatio,
          mustIncludeOk,
          viabilityMustIncludeOk,
          topicMustIncludeOk,
          conceptMatch: Boolean(conceptMatch),
          hasRepoHints,
          topicTags,
          verificationAnchorRequired,
          verificationAnchorOk,
          userExpectsRepo,
          hasHighStakesConstraints,
          explicitRepoExpectation,
          intentDomain,
          budgetLevel: budgetState.level,
          budgetRecommend: budgetState.recommend,
        });
        const rawArbiterMode = arbiterDecision.mode;
        const isIdeologyIntent = intentProfile.id === "repo.ideology_reference";
        const arbiterMode =
          isIdeologyIntent && rawArbiterMode !== "repo_grounded"
            ? "repo_grounded"
            : rawArbiterMode;
        const arbiterReason = arbiterDecision.reason;
        const arbiterStrictness = arbiterDecision.strictness;
        const arbiterRepoOk = arbiterDecision.repoOk;
        const arbiterHybridOk = arbiterDecision.hybridOk;
        logEvent(
          "Arbiter",
          arbiterMode,
          [
            isIdeologyIntent && rawArbiterMode !== "repo_grounded" ? "forced=repo_grounded" : "",
            `reason=${arbiterReason}`,
            `expectation=${repoExpectationLevel}`,
            `score=${repoExpectationScore}`,
          ]
            .filter(Boolean)
            .join(" | "),
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
          debugPayload.arbiter_concept_match = Boolean(arbiterDecision.conceptMatch);
          debugPayload.runtime_budget_level = budgetState.level;
          debugPayload.runtime_budget_recommend = budgetState.recommend;
          debugPayload.runtime_budget_signals = budgetState.signals;
        }
        if (
          intentProfile.id === "repo.ideology_reference" &&
          !parsed.data.verbosity &&
          softExpansionBudget < 2
        ) {
          softExpansionBudget = 2;
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

        const definitionRegistryPaths = collectDefinitionRegistryPaths(
          baseQuestion,
          conceptMatch,
          definitionFocus,
          graphPack,
        );
        if (definitionRegistryPaths.length > 0) {
          const registryBlocks = buildDefinitionRegistryBlocks(
            definitionRegistryPaths,
            baseQuestion,
            conceptMatch,
            docBlocks,
          );
          definitionRegistryBlocks = registryBlocks;
          if (registryBlocks.length > 0) {
            docBlocks = mergeDefinitionRegistryBlocks(docBlocks, registryBlocks);
          }
          if (definitionRegistryPaths.length > 0) {
            contextFiles = Array.from(new Set([...contextFiles, ...definitionRegistryPaths]));
          }
          if (debugPayload) {
            debugPayload.definition_registry_paths = definitionRegistryPaths.slice(0, 6);
            debugPayload.definition_registry_blocks = registryBlocks.length;
          }
      }

      const graphEvidence = collectGraphEvidenceItems(graphPack);
      graphEvidenceItems = graphEvidence.items;
      if (debugPayload) {
        const rate =
          graphEvidence.acceptance.total > 0
            ? graphEvidence.acceptance.accepted / graphEvidence.acceptance.total
            : 0;
        debugPayload.graph_node_acceptance_rate = Number(rate.toFixed(3));
        debugPayload.graph_node_acceptance_total = graphEvidence.acceptance.total;
        debugPayload.graph_node_acceptance_rejected = graphEvidence.acceptance.rejected;
        debugPayload.graph_node_acceptance_missing = graphEvidence.acceptance.missing;
        if (graphEvidence.acceptance.total > 0 && rate < 0.5) {
          logEvent(
            "Graph node acceptance",
            "low",
            `rate=${rate.toFixed(2)} | missing=${graphEvidence.acceptance.missing.join(",") || "none"}`,
          );
        }
      }
      if (graphEvidenceItems.length > 0) {
        const graphDoc = buildGraphEvidenceDocBlocks({
          evidence: graphEvidenceItems,
          question: baseQuestion,
          conceptMatch,
          existingBlocks: docBlocks,
        });
        if (graphDoc.blocks.length > 0) {
          const existing = new Set(docBlocks.map((block) => block.path.replace(/\\/g, "/").toLowerCase()));
          const mergedBlocks = [...docBlocks];
          graphDoc.blocks.forEach((block) => {
            const key = block.path.replace(/\\/g, "/").toLowerCase();
            if (!existing.has(key)) {
              mergedBlocks.push(block);
              existing.add(key);
            }
          });
          docBlocks = mergeDefinitionRegistryBlocks(
            mergedBlocks,
            definitionRegistryBlocks,
          );
        }
        if (graphDoc.paths.length > 0) {
          contextFiles = Array.from(new Set([...contextFiles, ...graphDoc.paths]));
        }
        if (debugPayload) {
          debugPayload.graph_evidence_count = graphEvidenceItems.length;
          debugPayload.graph_evidence_doc_blocks = graphDoc.blocks.length;
          debugPayload.graph_evidence_types = Array.from(
            new Set(graphEvidenceItems.map((entry) => entry.type)),
          ).sort();
        }
      }

      if (graphPack) {
          const bindingBlocks = docBlocks;
        const boundNodes = HELIX_ASK_TREE_WALK_BINDING
          ? buildTreeWalkBindingSet(graphPack, bindingBlocks)
          : undefined;
        const treeWalk = buildHelixAskTreeWalk(graphPack, {
          mode: treeWalkMode,
          maxSteps: HELIX_ASK_TREE_WALK_MAX_STEPS,
          boundNodes,
        });
        treeWalkBlock = treeWalk.text;
        treeWalkMetrics = treeWalk.metrics;
        if (treeWalkMetrics) {
          const bindingRate =
            treeWalkMetrics.nodeCount > 0 && typeof treeWalkMetrics.boundCount === "number"
              ? treeWalkMetrics.boundCount / treeWalkMetrics.nodeCount
              : 0;
          treeWalkBindingRate = bindingRate;
          const treeWalkDetail = [
            `mode=${treeWalkMode}`,
            treeWalkMetrics.stepCount ? `steps=${treeWalkMetrics.stepCount}` : null,
            treeWalkMetrics.treeCount ? `trees=${treeWalkMetrics.treeCount}` : null,
            typeof treeWalkMetrics.boundCount === "number"
              ? `bound=${treeWalkMetrics.boundCount}`
              : null,
          ]
            .filter(Boolean)
            .join(" | ");
          logEvent("Tree walk", "ready", treeWalkDetail);
          if (debugPayload) {
            debugPayload.tree_walk = treeWalkMetrics;
            debugPayload.tree_walk_lines = treeWalkBlock
              ? treeWalkBlock.split(/\r?\n/).filter((line) => line.trim()).length
              : 0;
            debugPayload.tree_walk_block_present = Boolean(treeWalkBlock);
            debugPayload.tree_walk_bound_nodes = treeWalkMetrics.boundCount ?? 0;
            debugPayload.tree_walk_binding_rate = Number(bindingRate.toFixed(3));
          }
        }
      }

        if (HELIX_ASK_CODE_ALIGNMENT && (docBlocks.length > 0 || graphEvidenceItems.length > 0)) {
          if (docBlocks.length > 0) {
            codeAlignment = await buildCodeAlignmentFromDocBlocks(
              docBlocks,
              baseQuestion,
              topicProfile,
            );
          } else {
            codeAlignment = { spans: [], symbols: [], resolved: [] };
          }
          if (graphEvidenceItems.length > 0) {
            const alignment = codeAlignment ?? { spans: [], symbols: [], resolved: [] };
            codeAlignment = alignment;
            const graphEvidenceSpans = await buildGraphEvidenceCodeSpans({
              evidence: graphEvidenceItems,
              question: baseQuestion,
              topicProfile,
            });
            if (graphEvidenceSpans.length > 0) {
              const existing = new Set(
                (alignment.spans ?? []).map((span) =>
                  `${span.symbol}|${span.filePath}`.toLowerCase(),
                ),
              );
              const merged = [...(alignment.spans ?? [])];
              graphEvidenceSpans.forEach((span) => {
                const key = `${span.symbol}|${span.filePath}`.toLowerCase();
                if (!existing.has(key)) {
                  merged.push(span);
                  existing.add(key);
                  if (alignment.resolved && !alignment.resolved.includes(span.filePath)) {
                    alignment.resolved.push(span.filePath);
                  }
                }
              });
              alignment.spans = merged;
              if (debugPayload) {
                debugPayload.graph_evidence_code_spans = graphEvidenceSpans.length;
              }
            }
          }
          if (debugPayload) {
            debugPayload.code_alignment_applied = true;
            debugPayload.code_alignment_symbols = codeAlignment.symbols.slice();
            debugPayload.code_alignment_resolved = codeAlignment.resolved.slice();
            debugPayload.code_spans_added = codeAlignment.spans.length;
          }
        } else if (debugPayload) {
          debugPayload.code_alignment_applied = false;
        }

      const promptRetrievalConfidence =
        typeof debugPayload?.retrieval_confidence === "number"
          ? debugPayload.retrieval_confidence
          : 0;
      const toolResultsTreeWalk =
        treeWalkMetrics &&
        typeof treeWalkMetrics.boundCount === "number" &&
        treeWalkMetrics.boundCount > 0 &&
        treeWalkBindingRate >= HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS
          ? treeWalkBlock
          : "";
      promptItems = buildHelixAskPromptItems({
        intentId: intentProfile.id,
        intentDomain,
        intentTier,
        queries: retrievalQueries.length ? retrievalQueries : undefined,
        contextFiles,
        retrievalConfidence: promptRetrievalConfidence,
        docBlocks,
        codeAlignment,
        treeWalk: toolResultsTreeWalk,
        slotCoverage: coverageSlotSummary
          ? { missingSlots: coverageSlotSummary.missingSlots ?? [], ratio: coverageSlotSummary.ratio ?? 0 }
          : null,
        docCoverage: docSlotSummary
          ? { missingSlots: docSlotSummary.missingSlots ?? [], ratio: docSlotSummary.ratio ?? 0 }
          : null,
        graphPack,
      });
      toolResultsBlock = HELIX_ASK_TOOL_RESULTS ? buildToolResultsBlock(promptItems) : "";
      if (debugPayload) {
        debugPayload.prompt_items = promptItems.map((item) => ({
          type: item.type,
          hash: item.hash,
          size: item.size,
          label: item.label,
        }));
        debugPayload.prompt_item_count = promptItems.length;
        debugPayload.tool_results_block = toolResultsBlock || undefined;
        debugPayload.tool_results_present = Boolean(toolResultsBlock);
        debugPayload.tool_results_items = promptItems
          .filter((item) => ["retrieval_summary", "doc_spans", "code_spans", "tree_walk"].includes(item.type))
          .map((item) => item.type);
        if (toolResultsBlock) {
          debugPayload.tool_results_hash = crypto
            .createHash("sha1")
            .update(toolResultsBlock)
            .digest("hex")
            .slice(0, 12);
        }
      }

      if (isRepoQuestion && !dryRun) {
        const combinedContext = wantsHybrid
          ? contextText
          : [promptContextText, contextText].filter(Boolean).join("\n\n");
        let evidenceContextSource = combinedContext;
          if (definitionFocus) {
            const definitionDocBlocks = resolveDefinitionDocBlocks(
              docBlocks,
              conceptMatch,
              definitionFocus,
            );
            const definitionDocContext = definitionDocBlocks.length
              ? definitionDocBlocks.map((block) => block.block).join("\n\n")
              : "";
            const mergedDefinitionContext = [promptContextText, definitionDocContext]
              .filter(Boolean)
              .join("\n\n");
            if (mergedDefinitionContext.trim()) {
              evidenceContextSource = mergedDefinitionContext;
            }
          }
          const evidenceContext = clipAskText(
            evidenceContextSource,
            HELIX_ASK_SCAFFOLD_CONTEXT_CHARS,
          );
          const definitionDocBlocks = resolveDefinitionDocBlocks(
            docBlocks,
            conceptMatch,
            definitionFocus,
          );
          const definitionEvidenceFiles = definitionFocus
            ? definitionDocBlocks.length
              ? definitionDocBlocks.map((block) => block.path)
              : contextFiles.filter((filePath) => isDefinitionDocPath(filePath))
            : contextFiles;
          const definitionEvidenceContext = definitionFocus
            ? definitionDocBlocks.length
              ? definitionDocBlocks.map((block) => block.block).join("\n\n")
              : ""
            : "";
          const allowConceptFastPath =
            conceptFastPath &&
            conceptMatch &&
            (!definitionFocus ||
              (conceptMatch.card.sourcePath && isDefinitionDocPath(conceptMatch.card.sourcePath)));
        if (allowConceptFastPath && conceptMatch) {
          const evidenceStart = Date.now();
          const conceptScaffold = buildConceptScaffold(conceptMatch);
          const conceptSources = conceptMatch.card.sourcePath ? [conceptMatch.card.sourcePath] : [];
          if (conceptSources.length > 0) {
            contextFiles = Array.from(new Set([...contextFiles, ...conceptSources]));
            if (debugPayload) {
              debugPayload.context_files = contextFiles.slice();
            }
          }
          const conceptEvidenceFiles = definitionFocus
            ? definitionEvidenceFiles
            : contextFiles;
          const conceptEvidenceContext = definitionFocus ? definitionEvidenceContext : contextText;
          repoScaffold = appendEvidenceSources(
            conceptScaffold,
            conceptEvidenceFiles,
            6,
            conceptEvidenceContext,
          );
          logProgress("Evidence cards ready", repoScaffold ? "concept" : "empty", evidenceStart);
          logEvent(
            "Evidence cards ready",
            repoScaffold ? "concept" : "empty",
            repoScaffold,
            evidenceStart,
          );
        } else if (evidenceContext) {
          if (HELIX_ASK_SINGLE_LLM) {
            const evidenceStart = Date.now();
            const scaffoldBlocks = definitionFocus ? definitionDocBlocks : docBlocks;
            const docScaffoldMax = Math.min(Math.max(minDocEvidenceCards, 1), 6);
            repoScaffold = buildDocEvidenceScaffold(scaffoldBlocks, {
              maxBlocks: docScaffoldMax,
              definitionFocus,
            });
            if (repoScaffold) {
              const sourceFiles = definitionFocus ? definitionEvidenceFiles : contextFiles;
              const sourceContext = definitionFocus ? definitionEvidenceContext : contextText;
              repoScaffold = appendEvidenceSources(repoScaffold, sourceFiles, 6, sourceContext);
            }
            logProgress(
              "Evidence cards ready",
              repoScaffold ? "deterministic" : "empty",
              evidenceStart,
            );
            logEvent(
              "Evidence cards ready",
              repoScaffold ? "deterministic" : "empty",
              repoScaffold,
              evidenceStart,
            );
          } else {
            const evidenceStart = logStepStart(
              "LLM evidence cards",
              "repo",
              {
                maxTokens: evidenceTokens,
                fn: "runHelixAskLocalWithOverflowRetry",
                label: "evidence_cards",
                prompt: "buildHelixAskEvidencePrompt",
              },
            );
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
              const sourceFiles = definitionFocus ? definitionEvidenceFiles : contextFiles;
              const sourceContext = definitionFocus ? definitionEvidenceContext : contextText;
              repoScaffold = appendEvidenceSources(repoScaffold, sourceFiles, 6, sourceContext);
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
            logStepEnd(
              "LLM evidence cards",
              `cards=${repoScaffold ? "ok" : "empty"}`,
              evidenceStart,
              true,
              {
                textLength: repoScaffold.length,
                fn: "runHelixAskLocalWithOverflowRetry",
                label: "evidence_cards",
              },
            );
          }
        }
      }

      if (definitionFocus && repoScaffold) {
        const filtered = filterEvidenceBulletsByPath(repoScaffold, isDefinitionDocPath);
        repoScaffold = filtered;
        const docEvidencePaths = extractFilePathsFromText(repoScaffold).filter(isDefinitionDocPath);
        const definitionDocBlocks = resolveDefinitionDocBlocks(
          docBlocks,
          conceptMatch,
          definitionFocus,
        );
        if ((!repoScaffold || docEvidencePaths.length === 0) && definitionDocBlocks.length > 0) {
          const fallbackBullet = buildDefinitionDocBullet(definitionDocBlocks[0]);
          repoScaffold = mergeEvidenceScaffolds(fallbackBullet, repoScaffold);
        }
        if (debugPayload) {
          debugPayload.definition_doc_filtered = Boolean(filtered);
          debugPayload.definition_doc_paths = docEvidencePaths.slice(0, 6);
        }
      }

      if (repoScaffold && codeAlignment?.spans?.length) {
        const codeEvidence = codeAlignment.spans
          .slice(0, 2)
          .map((span) => buildCodeEvidenceBullet(span))
          .join("\n");
        if (codeEvidence.trim()) {
          repoScaffold = mergeEvidenceScaffolds(repoScaffold, codeEvidence);
        }
      }

      if (isRepoQuestion || wantsHybrid) {
        if (treeWalkBlock && HELIX_ASK_TREE_WALK_INJECT) {
          repoScaffold = mergeEvidenceScaffolds(repoScaffold, treeWalkBlock);
        } else if (graphPack?.scaffoldText && HELIX_ASK_TREE_WALK_INJECT) {
          repoScaffold = mergeEvidenceScaffolds(repoScaffold, graphPack.scaffoldText);
        }
      }

      if ((!isRepoQuestion || wantsHybrid) && !dryRun) {
        if (promptContextText) {
          if (HELIX_ASK_SINGLE_LLM) {
            promptScaffold = clipAskText(promptContextText, HELIX_ASK_SCAFFOLD_CONTEXT_CHARS);
            logEvent(
              "Prompt context cards ready",
              promptScaffold ? "single_llm" : "empty",
              formatFileList(promptContextFiles) ?? promptScaffold,
            );
          } else {
            const evidenceStart = logStepStart(
              "LLM prompt cards",
              "prompt",
              {
                maxTokens: HELIX_ASK_LONGPROMPT_CARD_TOKENS,
                fn: "runHelixAskLocalWithOverflowRetry",
                label: "prompt_cards",
                prompt: "buildHelixAskPromptEvidencePrompt",
              },
            );
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
            logStepEnd(
              "LLM prompt cards",
              `cards=${promptScaffold ? "ok" : "empty"}`,
              evidenceStart,
              true,
              {
                textLength: promptScaffold.length,
                fn: "runHelixAskLocalWithOverflowRetry",
                label: "prompt_cards",
              },
            );
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
        } else if (!hasConceptScaffold && !HELIX_ASK_SINGLE_LLM) {
          const evidenceStart = logStepStart(
            "LLM reasoning scaffold",
            "general",
            {
              maxTokens: evidenceTokens,
              fn: "runHelixAskLocalWithOverflowRetry",
              label: "general_evidence",
              prompt: "buildGeneralAskEvidencePrompt",
            },
          );
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
          logStepEnd(
            "LLM reasoning scaffold",
            `scaffold=${generalScaffold ? "ok" : "empty"}`,
            evidenceStart,
            true,
            {
              textLength: generalScaffold.length,
              fn: "runHelixAskLocalWithOverflowRetry",
              label: "general_evidence",
            },
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
        ((claimGateFailed &&
          (!evidenceGateOk ||
            definitionDocMissing ||
            slotCoverageFailed ||
            docSlotCoverageFailed)) ||
          (!evidenceGateOk && ambiguityTerms.length > 0));
      const skipIdeologyClarify =
        isIdeologyReferenceIntent && Boolean(conceptMatch);
      if (shouldClarifyNow && !forcedAnswer && intentStrategy !== "constraint_report" && !skipIdeologyClarify) {
        const clarifyLine = clarifyOverride ?? buildAmbiguityClarifyLine([]);
        if (HELIX_ASK_SCIENTIFIC_CLARIFY) {
          const scientific = buildScientificMicroReport({
            question: baseQuestion,
            slotPlan,
            searchedTerms: retrievalQueries,
            searchedFiles: retrievalFilesSnapshot,
            includeSearchSummary: true,
            planClarify: clarifyLine,
            headingSeedSlots,
            hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
            hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
            requiresRepoEvidence,
          });
          forcedAnswer = scientific.text;
          forcedAnswerIsHard = true;
          if (debugPayload) {
            debugPayload.scientific_response_applied = true;
            debugPayload.next_evidence_count = scientific.nextEvidence.length;
            debugPayload.next_evidence_coverage = scientific.nextEvidence.length > 0 ? 1 : 0;
            debugPayload.hypothesis_count = scientific.hypothesisCount;
            debugPayload.hypothesis_rate = scientific.hypothesisCount > 0 ? 1 : 0;
          }
          recordAgentAction("render_scientific_micro_report", "ambiguity_gate", "return_scaffold");
        } else {
          forcedAnswer = clarifyLine;
          forcedAnswerIsHard = true;
        }
        answerPath.push("clarify:ambiguity");
        if (debugPayload) {
          debugPayload.fallback_reason = "ambiguity_clarify";
          debugPayload.ambiguity_clarify_rate = 1;
        }
        recordAgentAction("ask_slot_clarify", "ambiguity_gate", "request_user_disambiguation");
        agentStopReason = "user_clarify_required";
        updateAgentDebug();
        recordControllerStop(agentStopReason, "ambiguity_gate");
      }
      if (failClosedRepoEvidence && !forcedAnswer && intentStrategy !== "constraint_report" && !skipIdeologyClarify) {
          const planClarify = (clarifyOverride ?? planDirectives?.clarifyQuestion ?? "").trim();
          const missingSlots =
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [];
          const clarifySlots = filterClarifySlots(missingSlots);
          const definitionClarify = definitionDocMissing
            ? "Definition questions require at least one docs/*.md span. Please point to the relevant doc file."
            : "";
          if (HELIX_ASK_SESSION_MEMORY && parsed.data.sessionId && clarifySlots.length > 0) {
            recordHelixAskSessionMemory({
              sessionId: parsed.data.sessionId,
            lastClarifySlots: clarifySlots,
            openSlots: clarifySlots,
            attempts: agentActions.map((entry) => entry.action),
            recentTopics: topicTags,
            graphTreeIds: graphPack?.treeIds,
            userPrefs: {
              hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
              verbosity: parsed.data.verbosity,
              citationsRequired: requiresRepoEvidence,
            },
            });
          }
        const clarifyLine = definitionClarify
          ? definitionClarify
          : clarifySlots.length
          ? buildSlotClarifyLine({
              missingSlots: clarifySlots,
              slotPlan,
              planClarify,
            })
          : planClarify && /(file|doc|module|path|repo|codebase|where)/i.test(planClarify)
            ? planClarify
            : "Repo evidence was required by the question but could not be confirmed. Please point to the relevant files or clarify the term.";
        const failLabel = failClosedReason ?? "evidence_gate_failed";
        if (HELIX_ASK_SCIENTIFIC_CLARIFY) {
          const scientific = buildScientificMicroReport({
            question: baseQuestion,
            missingSlots: clarifySlots,
            slotPlan,
            anchorFiles: contextFiles,
            searchedTerms: retrievalQueries,
            searchedFiles: retrievalFilesSnapshot,
            includeSearchSummary: true,
            planClarify: clarifyLine,
            headingSeedSlots,
            hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
            hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
            requiresRepoEvidence,
          });
          forcedAnswer = scientific.text;
          forcedAnswerIsHard = true;
          if (debugPayload) {
            debugPayload.scientific_response_applied = true;
            debugPayload.next_evidence_count = scientific.nextEvidence.length;
            debugPayload.next_evidence_coverage =
              clarifySlots.length > 0 ? scientific.nextEvidence.length / clarifySlots.length : 0;
            debugPayload.hypothesis_count = scientific.hypothesisCount;
            debugPayload.hypothesis_rate =
              scientific.hypothesisCount > 0
                ? scientific.hypothesisCount / Math.max(1, clarifySlots.length)
                : 0;
          }
          recordAgentAction("render_scientific_micro_report", "fail_closed", "return_scaffold");
        } else {
          forcedAnswer = clarifyLine;
          forcedAnswerIsHard = true;
        }
        answerPath.push(`failClosed:${failLabel}`);
        logEvent("Fail-closed", failLabel, clarifyLine);
        if (debugPayload) {
          debugPayload.clarify_triggered = true;
          debugPayload.fallback_reason = failClosedReason ?? "evidence_gate_failed";
        }
        recordAgentAction("ask_slot_clarify", "fail_closed", "request_missing_evidence");
        agentStopReason = "user_clarify_required";
        updateAgentDebug();
        recordControllerStop(agentStopReason, "fail_closed");
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
          verbosity,
          constraintEvidenceText,
          compositeRequest.enabled,
          toolResultsBlock,
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
        if (intentProfile.id === "repo.helix_ask_pipeline_explain") {
          forcedAnswer = buildHelixAskPipelineAnswer();
          pipelineEvidence = buildHelixAskPipelineEvidence();
          answerPath.push("forcedAnswer:helix_pipeline");
        }
        const ideologySynthesis = intentProfile.id === "repo.ideology_reference";
        if (ideologySynthesis) {
          prompt = ensureFinalMarker(
            buildHelixAskIdeologySynthesisPrompt(
              baseQuestion,
              repoScaffold,
              formatSpec.format,
              formatSpec.stageTags,
              verbosity,
              toolResultsBlock,
              softExpansionBudget,
              conceptMatch,
            ),
          );
        } else {
          prompt = ensureFinalMarker(
            buildHelixAskSynthesisPrompt(
              baseQuestion,
              repoScaffold,
              formatSpec.format,
              formatSpec.stageTags,
              verbosity,
              toolResultsBlock,
              softExpansionBudget,
            ),
          );
        }
        evidenceText = pipelineEvidence ?? repoScaffold;
        if (debugPayload && repoScaffold) {
          debugPayload.evidence_cards = pipelineEvidence ?? repoScaffold;
        }
        logEvent(
          "Synthesis prompt ready",
          ideologySynthesis ? "repo_ideology" : "repo",
          formatFileList(extractFilePathsFromText(evidenceText)),
        );
      } else if (promptScaffold) {
        prompt = ensureFinalMarker(
          buildHelixAskPromptSynthesisPrompt(
            baseQuestion,
            promptScaffold,
            formatSpec.format,
            formatSpec.stageTags,
            verbosity,
            toolResultsBlock,
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
            verbosity,
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
        prompt = ensureFinalMarker(
          buildGeneralAskPrompt(baseQuestion, formatSpec.format, formatSpec.stageTags, verbosity),
        );
      }
    } else if (!skipMicroPass && !dryRun && !HELIX_ASK_SINGLE_LLM) {
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
          const scaffoldStart = logStepStart(
            "LLM two-pass scaffold",
            `tokens=${scaffoldMaxTokens}`,
            {
              maxTokens: scaffoldMaxTokens,
              fn: "runHelixAskLocalWithOverflowRetry",
              label: "two_pass_scaffold",
              prompt: "buildHelixAskScaffoldPrompt",
            },
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
                verbosity,
                toolResultsBlock,
                softExpansionBudget,
              ),
            );
          }
          logStepEnd(
            "LLM two-pass scaffold",
            `scaffold=${scaffoldText ? "ok" : "empty"}`,
            scaffoldStart,
            true,
            {
              textLength: scaffoldText.length,
              fn: "runHelixAskLocalWithOverflowRetry",
              label: "two_pass_scaffold",
            },
          );
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
    const fallbackAnswer = forcedAnswer ?? conceptAnswer ?? "";
    const shouldShortCircuitAnswer =
      Boolean(fallbackAnswer) &&
      (forcedAnswerIsHard || (!prompt && !isIdeologyReferenceIntent));
    const shouldFastPathFinalize =
      shouldShortCircuitAnswer &&
      isIdeologyReferenceIntent &&
      conceptFastPath &&
      forcedAnswerIsHard &&
      String(verbosity ?? "").trim().length > 0;
    if (shouldShortCircuitAnswer) {
      const forcedRawText = stripPromptEchoFromAnswer(fallbackAnswer, baseQuestion).trim();
      const forcedCleanText = stripTruncationMarkers(formatHelixAskAnswer(forcedRawText));
      const forcedMeta = isShortAnswer(forcedCleanText, verbosity);
      result = { text: forcedCleanText } as LocalAskResult;
      if (debugPayload) {
        debugPayload.answer_short_sentences = forcedMeta.sentences;
        debugPayload.answer_short_tokens = forcedMeta.tokens;
      }
      logProgress("Answer ready", "concept", answerStart);
      answerPath.push("answer:forced");
      if (shouldFastPathFinalize) {
        answerPath.push("answer:fast_path_finalize");
        result.text = forcedCleanText;
        result.envelope = buildHelixAskEnvelope({
          answer: forcedCleanText,
          format: formatSpec.format,
          tier: intentTier,
          secondaryTier: intentSecondaryTier,
          mode: resolveEnvelopeMode(verbosity),
          evidenceText: conceptMatch?.card?.sourcePath
            ? `Sources: ${conceptMatch.card.sourcePath}`
            : evidenceText,
          traceId: askTraceId,
        });
        if (debugPayload) {
          debugPayload.answer_after_fallback = clipAskText(
            forcedCleanText,
            HELIX_ASK_ANSWER_PREVIEW_CHARS,
          );
          debugPayload.answer_final_text = clipAskText(
            forcedCleanText,
            HELIX_ASK_ANSWER_PREVIEW_CHARS,
          );
          debugPayload.answer_path = answerPath;
          debugPayload.answer_extension_available = false;
          debugPayload.micro_pass = false;
          debugPayload.micro_pass_enabled = false;
        }
        if (debugPayload && captureLiveHistory) {
          const traceEvents = liveEventHistory.slice();
          debugPayload.live_events = traceEvents;
          debugPayload.trace_events = traceEvents;
          debugPayload.trace_summary = buildTraceSummary(traceEvents);
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
        result.prompt_ingested = promptIngested;
        if (promptIngested) {
          if (promptIngestSource) {
            result.prompt_ingest_source = promptIngestSource;
          }
          if (promptIngestReason) {
            result.prompt_ingest_reason = promptIngestReason;
          }
        }
        logDebug("streamEmitter.finalize start", {
          cleanedLength: forcedCleanText.length,
        });
        streamEmitter.finalize(forcedCleanText);
        logDebug("streamEmitter.finalize complete");
        const responsePayload = debugPayload ? { ...result, debug: debugPayload } : result;
        responder.send(200, responsePayload);
        return;
      }
    } else {
      const generalEvidenceForBudget = promptScaffold || generalScaffold;
      const answerBudget = computeAnswerTokenBudget({
        verbosity,
        format: formatSpec.format,
        scaffoldTokens,
        evidenceText: evidenceText || repoScaffold || generalScaffold || contextText,
        definitionFocus,
        composite: compositeRequest.enabled,
        hasRepoEvidence: Boolean(repoScaffold?.trim()),
        hasGeneralEvidence: Boolean(generalEvidenceForBudget?.trim()),
        maxTokensOverride: parsed.data.max_tokens,
      });
      const answerMaxTokens = answerBudget.tokens;
      if (debugPayload) {
        debugPayload.answer_token_budget = answerMaxTokens;
        debugPayload.answer_token_cap = answerBudget.cap;
        debugPayload.answer_token_base = answerBudget.base;
        debugPayload.answer_token_boosts = answerBudget.boosts;
        debugPayload.answer_token_reason = answerBudget.reason;
      }
      logDebug("llmLocalHandler MAIN start", {
        maxTokens: answerMaxTokens,
        temperature: parsed.data.temperature ?? null,
      });
      const answerFallbackTokens = answerMaxTokens;
      const llmAnswerStart = logStepStart(
        "LLM answer",
        `tokens=${answerMaxTokens}`,
        {
          maxTokens: answerMaxTokens,
          fn: "runHelixAskLocalWithOverflowRetry",
          label: "answer",
        },
      );
      let answerGenerationFailed = false;
      let retryApplied = false;
      let answerText = "";
      let answerMeta = isShortAnswer(answerText, verbosity);
      let resultForAnswer: LocalAskResult | null = null;
      try {
        const { result: answerResult, overflow: answerOverflow } =
          await runHelixAskLocalWithOverflowRetry(
            {
              prompt,
              max_tokens: answerMaxTokens,
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
        answerText = (answerResult as LocalAskResult)?.text ?? "";
        answerMeta = isShortAnswer(answerText, verbosity);
        resultForAnswer = answerResult as LocalAskResult;
        const retryEligible =
          !HELIX_ASK_SINGLE_LLM &&
          HELIX_ASK_SHORT_ANSWER_RETRY_MAX > 0 &&
          answerMeta.short &&
          !answerBudget.override &&
          Boolean(prompt);
        if (retryEligible) {
          const retryBudget = clampNumber(
            Math.min(Math.round(answerMaxTokens * 1.35), answerBudget.cap),
            128,
            answerBudget.cap,
          );
          if (retryBudget > answerMaxTokens) {
            const retryStart = logStepStart(
              "LLM answer retry",
              `tokens=${retryBudget}`,
              {
                maxTokens: retryBudget,
                fn: "runHelixAskLocalWithOverflowRetry",
                label: "answer_retry",
              },
            );
            try {
              const { result: retryResult, overflow: retryOverflow } =
                await runHelixAskLocalWithOverflowRetry(
                  {
                    prompt,
                    max_tokens: retryBudget,
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
                    fallbackMaxTokens: retryBudget,
                    allowContextDrop: true,
                    label: "answer_retry",
                  },
                );
              recordOverflow("answer_retry", retryOverflow);
              logStepEnd(
                "LLM answer retry",
                "done",
                retryStart,
                true,
                {
                  textLength: typeof retryResult?.text === "string" ? retryResult.text.length : 0,
                  fn: "runHelixAskLocalWithOverflowRetry",
                  label: "answer_retry",
                },
              );
              answerText = (retryResult as LocalAskResult)?.text ?? answerText;
              answerMeta = isShortAnswer(answerText, verbosity);
              retryApplied = true;
              if (debugPayload) {
                debugPayload.answer_retry_applied = true;
                debugPayload.answer_retry_reason = "short_answer";
                debugPayload.answer_retry_max_tokens = retryBudget;
              }
              resultForAnswer = retryResult as LocalAskResult;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              logStepEnd(
                "LLM answer retry",
                "error",
                retryStart,
                false,
                {
                  fn: "runHelixAskLocalWithOverflowRetry",
                  label: "answer_retry",
                  error: message,
                },
              );
              if (debugPayload) {
                debugPayload.answer_retry_model_error = message;
                debugPayload.answer_retry_applied = false;
              }
            }
          }
        } else if (debugPayload) {
          debugPayload.answer_retry_applied = false;
        }
      } catch (error) {
        answerGenerationFailed = true;
        const message = error instanceof Error ? error.message : String(error);
        logStepEnd(
          "LLM answer",
          "error",
          llmAnswerStart,
          false,
          {
            fn: "runHelixAskLocalWithOverflowRetry",
            label: "answer",
            error: message,
          },
        );
        if (debugPayload) {
          debugPayload.answer_generation_failed = true;
          debugPayload.answer_model_error = message;
          debugPayload.answer_fallback_used = true;
          debugPayload.answer_fallback_reason = "llm_error";
        }
      }

      const fallbackNeeded = !resultForAnswer || !resultForAnswer.text?.trim();
      if (answerGenerationFailed || fallbackNeeded) {
        if (!fallbackAnswer) {
          throw new Error("No answer text available");
        }
        result = { text: fallbackAnswer } as LocalAskResult;
        resultForAnswer = result;
        answerText = fallbackAnswer;
        answerMeta = isShortAnswer(answerText, verbosity);
        answerPath.push("answer:fallback");
      } else {
        result = resultForAnswer as LocalAskResult;
      }

      if (treeWalkBlock && HELIX_ASK_TREE_WALK_INJECT && typeof resultForAnswer?.text === "string") {
        const treeWalkApplied = ensureTreeWalkInAnswer(resultForAnswer.text, treeWalkBlock);
        if (treeWalkApplied.injected) {
          resultForAnswer.text = treeWalkApplied.text;
          answerText = treeWalkApplied.text;
          answerMeta = isShortAnswer(answerText, verbosity);
          if (debugPayload) {
            debugPayload.tree_walk_injected = true;
          }
        } else if (debugPayload) {
          debugPayload.tree_walk_in_answer = true;
        }
      }

      if (debugPayload) {
        debugPayload.answer_short_sentences = answerMeta.sentences;
        debugPayload.answer_short_tokens = answerMeta.tokens;
        if (!retryApplied) {
          debugPayload.answer_retry_applied = false;
        }
      }
      if (!answerGenerationFailed) {
        logDebug("llmLocalHandler MAIN complete", {
          textLength: typeof result.text === "string" ? result.text.length : 0,
        });
        logStepEnd(
          "LLM answer",
          `tokens=${answerFallbackTokens}`,
          llmAnswerStart,
          true,
          {
            textLength: typeof result.text === "string" ? result.text.length : 0,
            fn: "runHelixAskLocalWithOverflowRetry",
            label: "answer",
          },
        );
      }
      logProgress("Answer ready", undefined, answerStart);
      answerPath.push("answer:llm");
      if (!result?.text) {
        throw new Error("No answer generated");
      }
    }

    let cleanedText: string | undefined;
    let answerExtension: HelixAskAnswerExtensionResult | null = null;
    if (typeof result.text === "string" && result.text.trim()) {
      let cleaned = formatHelixAskAnswer(stripPromptEchoFromAnswer(result.text, baseQuestion));
      cleaned = stripInlineJsonArtifacts(cleaned);
      const rawAnswerText = stripInlineJsonArtifacts(
        stripPromptEchoFromAnswer(result.text, baseQuestion),
      ).trim();
      const rawAnswerSentences = extractOrderedAnswerSentences(rawAnswerText, 3);
      const rawPreview = clipAskText(
        rawAnswerText.replace(/\s+/g, " ").trim(),
        HELIX_ASK_ANSWER_PREVIEW_CHARS,
      );
      if (debugPayload) {
        debugPayload.answer_raw_text = clipAskText(rawAnswerText, HELIX_ASK_ANSWER_PREVIEW_CHARS);
      }
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
        cleaned = stripInlineJsonArtifacts(cleaned);
      }
      if (debugPayload) {
        debugPayload.answer_after_format = clipAskText(
          cleaned,
          HELIX_ASK_ANSWER_PREVIEW_CHARS,
        );
      }
      const toolResultsPresent = Boolean(toolResultsBlock?.trim());
      const hasToolEvidence =
        docBlocks.length > 0 || (codeAlignment?.spans?.length ?? 0) > 0;
      if (
        !HELIX_ASK_FORCE_FULL_ANSWERS &&
        toolResultsPresent &&
        hasToolEvidence &&
        NO_EVIDENCE_RE.test(cleaned)
      ) {
        cleaned = buildToolResultsFallbackAnswer({
          definitionFocus,
          docBlocks,
          codeAlignment,
          treeWalk: HELIX_ASK_TREE_WALK_INJECT ? treeWalkBlock : undefined,
        });
        answerPath.push("toolResultsFallback");
        if (debugPayload) {
          debugPayload.tool_results_fallback_applied = true;
          debugPayload.tool_results_fallback_reason = "llm_denied_evidence";
        }
      }
      const shortMetaAfterClean = isShortAnswer(cleaned, verbosity);
      const hasCitationsAfterClean =
        extractFilePathsFromText(cleaned).length > 0 || hasSourcesLine(cleaned);
      const singleLlmVeryShort =
        shortMetaAfterClean.sentences < HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_SENTENCES ||
        shortMetaAfterClean.tokens < HELIX_ASK_SINGLE_LLM_SHORT_FALLBACK_MIN_TOKENS;
      const singleLlmShortFallbackEligible =
        !HELIX_ASK_FORCE_FULL_ANSWERS &&
        HELIX_ASK_SINGLE_LLM &&
        !isIdeologyReferenceIntent &&
        hasToolEvidence &&
        !hasCitationsAfterClean &&
        singleLlmVeryShort;
      if (singleLlmShortFallbackEligible) {
        const missingSlotsForShortFallback =
          docSlotSummary?.missingSlots?.length
            ? docSlotSummary.missingSlots
            : coverageSlotSummary?.missingSlots ?? [];
        const shortFallbackText = buildSingleLlmShortAnswerFallback({
          question: baseQuestion,
          definitionFocus,
          docBlocks,
          codeAlignment,
          treeWalk: HELIX_ASK_TREE_WALK_INJECT ? treeWalkBlock : undefined,
          missingSlots: missingSlotsForShortFallback,
          slotPlan,
          anchorFiles: contextFiles,
          searchedTerms: retrievalQueries,
          searchedFiles: retrievalFilesSnapshot,
          planClarify: clarifyOverride ?? planDirectives?.clarifyQuestion,
          headingSeedSlots:
            slotPlanHeadingSeedSlots.length > 0 ? slotPlanHeadingSeedSlots : headingSeedSlots,
          requiresRepoEvidence,
        });
        const fallbackMeta = isShortAnswer(shortFallbackText, verbosity);
        if (!fallbackMeta.short || shortFallbackText.length > cleaned.length + 80) {
          cleaned = shortFallbackText;
          answerPath.push("shortAnswerFallback");
          if (debugPayload) {
            debugPayload.answer_short_fallback_applied = true;
            debugPayload.answer_short_fallback_reason = "single_llm_short_answer";
          }
        }
      }
      const baselineCleaned = cleaned;
      const allowCitationRepair =
        !HELIX_ASK_SINGLE_LLM &&
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
          const repairStart = logStepStart(
            "LLM citation repair",
            `tokens=${repairTokens}`,
            {
              maxTokens: repairTokens,
              fn: "runHelixAskLocalWithOverflowRetry",
              label: "citation_repair",
              prompt: "buildHelixAskCitationRepairPrompt",
            },
          );
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
          const rawRepairText = repairResult.text ?? "";
          const parsedRepair = parseCitationRepairPayload(rawRepairText);
          let repairedText = parsedRepair?.text ?? rawRepairText;
          repairedText = stripPromptEchoFromAnswer(repairedText, baseQuestion);
          const allowedRepairPaths = Array.from(
            new Set([
              ...contextFiles,
              ...promptContextFiles,
              ...extractFilePathsFromText(evidenceText),
            ].filter(Boolean)),
          );
          const sanitized = sanitizeCitationRepairOutput(
            repairedText,
            allowedRepairPaths,
            evidenceText,
          );
          repairedText = sanitized.text;
          repairedText = stripInlineJsonArtifacts(repairedText);
          repairedText = stripTruncationMarkers(repairedText);
          const baselineTrimmed = baselineCleaned.trim();
          const repairedTrimmed = repairedText.trim();
          const repairedHasPaths =
            extractFilePathsFromText(repairedTrimmed).length > 0 || hasSourcesLine(repairedTrimmed);
          const baselineHasPaths =
            extractFilePathsFromText(baselineTrimmed).length > 0 || hasSourcesLine(baselineTrimmed);
          const repairedTooShort =
            baselineTrimmed.length > 0 &&
            repairedTrimmed.length > 0 &&
            repairedTrimmed.length < baselineTrimmed.length * 0.6;
          if (parsedRepair && repairedText) {
            const allowedTokenSet = new Set(
              extractCitationTokensFromText(evidenceText).map((token) => token.toLowerCase()),
            );
            const allowedPathSet = new Set(
              allowedRepairPaths.map((path) => (normalizeEvidenceRef(path) ?? path).toLowerCase()),
            );
            const repairSources = normalizeCitations([
              ...(parsedRepair.sources ?? []),
              ...(parsedRepair.citations ?? []),
            ]);
            const filteredSources = repairSources.filter((entry) => {
              const normalized = (normalizeEvidenceRef(entry) ?? entry).toLowerCase();
              if (allowedPathSet.has(normalized)) return true;
              if (allowedTokenSet.has(entry.toLowerCase())) return true;
              return false;
            });
            if (
              filteredSources.length > 0 &&
              extractFilePathsFromText(repairedText).length === 0 &&
              !hasSourcesLine(repairedText)
            ) {
              repairedText = `${repairedText}\n\nSources: ${filteredSources.join(", ")}`;
            }
          }
          if (
            repairedTrimmed &&
            !(repairedTooShort && baselineHasPaths && !repairedHasPaths)
          ) {
            cleaned = repairedText;
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
          } else {
            answerPath.push("citationRepair:skipped(degraded)");
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
        cleaned = stripCitationRepairArtifacts(cleaned);
        cleaned = stripInlineJsonArtifacts(cleaned);
      cleaned = stripTrivialOrdinalBullets(cleaned);
      cleaned = dedupeReportParagraphs(cleaned).text;
      const conceptSourcePaths = conceptMatch ? buildConceptEvidencePaths(conceptMatch) : [];
      const resolvedEvidencePaths = resolveEvidencePaths(evidenceText, contextFiles, contextText, 12);
      const isDocSourcePath = (value: string): boolean => {
        return value.trim().toLowerCase().startsWith("docs/");
      };
      const allowedSourcePaths = Array.from(
        new Set([
          ...conceptSourcePaths,
          ...(
            isIdeologyReferenceIntent
              ? resolvedEvidencePaths.filter(isDocSourcePath)
              : resolvedEvidencePaths
          ),
        ]),
      );
      cleaned = sanitizeSourcesLine(
        cleaned,
        allowedSourcePaths,
        extractCitationTokensFromText(evidenceText),
      );
      const repoEvidencePaths = allowedSourcePaths.slice(0, 6);
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
        } else if (HELIX_ASK_SCIENTIFIC_CLARIFY && !isIdeologyReferenceIntent) {
          const missingSlots =
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [];
          const scientific = buildScientificMicroReport({
            question: baseQuestion,
            claimLedger: [],
            uncertaintyRegister: [],
            missingSlots,
            slotPlan,
            anchorFiles: contextFiles,
            searchedTerms: retrievalQueries,
            searchedFiles: retrievalFilesSnapshot,
            includeSearchSummary: true,
            planClarify:
              "Repo evidence was available but the answer could not be grounded with file citations.",
            headingSeedSlots: slotPlanHeadingSeedSlots.length ? slotPlanHeadingSeedSlots : headingSeedSlots,
            hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
            hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
            requiresRepoEvidence,
          });
          cleaned = scientific.text;
          if (debugPayload) {
            debugPayload.scientific_response_applied = true;
            debugPayload.next_evidence_count = scientific.nextEvidence.length;
            debugPayload.next_evidence_coverage =
              missingSlots.length > 0 ? scientific.nextEvidence.length / missingSlots.length : 0;
            debugPayload.hypothesis_count = scientific.hypothesisCount;
            debugPayload.hypothesis_rate =
              scientific.hypothesisCount > 0
                ? scientific.hypothesisCount / Math.max(1, missingSlots.length)
                : 0;
          }
          logProgress("Citation missing", "scientific");
          logEvent("Citation missing", "scientific", formatFileList(repoEvidencePaths));
        } else if (isIdeologyReferenceIntent) {
          // Preserve narrative answer style for ideology reference prompts when no repo file
          // citations are available; avoid scientific micro-report substitution.
          answerPath.push("citationFallback:non_scientific");
          logProgress("Citation missing", "non_scientific");
          logEvent("Citation missing", "non_scientific", formatFileList(repoEvidencePaths));
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
      const templateLockedPlatonicAnswer =
        Boolean(forcedAnswer && forcedAnswerIsHard && intentProfile.id === "repo.ideology_reference");
      let platonicResult = applyHelixAskPlatonicGates({
        question: baseQuestion,
        answer: cleaned,
        domain: platonicDomain,
        tier: intentTier,
        intentId: intentProfile.id,
        format: formatSpec.format,
        evidenceText,
        evidencePaths,
        evidenceGateOk,
        requiresRepoEvidence,
        coverageSlots: coverageSlots.length > 0 ? coverageSlots : undefined,
        coverageSlotAliases: coverageSlotAliasMap ?? undefined,
        generalScaffold,
        repoScaffold,
        promptScaffold,
        conceptMatch,
        templateLockedAnswer: templateLockedPlatonicAnswer,
      });
      const lockedByIdeologyTemplate =
        templateLockedPlatonicAnswer || platonicResult.ideologyTemplateApplied;
      if (lockedByIdeologyTemplate && intentProfile.id === "repo.ideology_reference") {
        if (!answerPath.includes("forcedAnswer:ideology")) {
          answerPath.push("forcedAnswer:ideology");
        }
        if (!answerPath.includes("answer:forced")) {
          answerPath.push("answer:forced");
        }
      }
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
      let driftRepairApplied = false;
      let driftRepairAttempts = 0;
      let driftRepairImproved = false;
      if (
        HELIX_ASK_DRIFT_REPAIR &&
        !HELIX_ASK_SINGLE_LLM &&
        HELIX_ASK_DRIFT_REPAIR_MAX > 0 &&
        !lockedByIdeologyTemplate &&
        (platonicResult.beliefGateApplied || platonicResult.rattlingGateApplied) &&
        !platonicResult.coverageGateApplied &&
        evidenceText.trim().length > 0 &&
        (platonicDomain === "repo" || platonicDomain === "hybrid" || platonicDomain === "falsifiable")
      ) {
        const repairStart = logStepStart(
          "LLM drift repair",
          `tokens=${repairTokens}`,
          {
            maxTokens: repairTokens,
            fn: "runHelixAskLocalWithOverflowRetry",
            label: "drift_repair",
            prompt: "buildHelixAskDriftRepairPrompt",
          },
        );
        driftRepairAttempts += 1;
        try {
          const repairEvidence = appendEvidenceSources(evidenceText, contextFiles, 8, contextText);
          const repairPrompt = buildHelixAskDriftRepairPrompt(
            baseQuestion,
            cleaned,
            repairEvidence,
            formatSpec.format,
            formatSpec.stageTags,
          );
          const { result: repairResult, overflow: repairOverflow } =
            await runHelixAskLocalWithOverflowRetry(
              {
                prompt: repairPrompt,
                max_tokens: repairTokens,
                temperature: Math.min(parsed.data.temperature ?? 0.2, 0.35),
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
                label: "drift_repair",
              },
            );
          recordOverflow("drift_repair", repairOverflow);
          const repairText = stripPromptEchoFromAnswer(repairResult.text ?? "", baseQuestion);
          if (repairText) {
            const candidate = applyHelixAskPlatonicGates({
              question: baseQuestion,
              answer: repairText,
              domain: platonicDomain,
              tier: intentTier,
              intentId: intentProfile.id,
              format: formatSpec.format,
              evidenceText,
              evidencePaths,
              evidenceGateOk,
              requiresRepoEvidence,
              coverageSlots: coverageSlots.length > 0 ? coverageSlots : undefined,
              coverageSlotAliases: coverageSlotAliasMap ?? undefined,
              generalScaffold,
              repoScaffold,
              promptScaffold,
              conceptMatch,
              templateLockedAnswer: lockedByIdeologyTemplate,
            });
            const gateScore = (result: typeof platonicResult): number =>
              (result.coverageGateApplied ? 1 : 0) +
              (result.beliefGateApplied ? 1 : 0) +
              (result.rattlingGateApplied ? 1 : 0);
            const priorScore = gateScore(platonicResult);
            const nextScore = gateScore(candidate);
            if (
              nextScore < priorScore ||
              (nextScore === priorScore &&
                candidate.beliefSummary.unsupportedRate <= platonicResult.beliefSummary.unsupportedRate)
            ) {
              platonicResult = candidate;
              cleaned = candidate.answer;
              driftRepairImproved = true;
            }
            driftRepairApplied = true;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logEvent("Drift repair", "error", message, repairStart, false);
        }
        if (driftRepairApplied) {
          logEvent(
            "Drift repair",
            driftRepairImproved ? "ok" : "no_change",
            [
              `attempts=${driftRepairAttempts}`,
              driftRepairImproved ? "improved=yes" : "improved=no",
            ].join(" | "),
            repairStart,
          );
        }
    }
    if (
      HELIX_ASK_SCIENTIFIC_CLARIFY &&
      !isIdeologyReferenceIntent &&
      !lockedByIdeologyTemplate &&
      !isScientificMicroReport(cleaned) &&
      (platonicDomain === "repo" || platonicDomain === "hybrid" || platonicDomain === "falsifiable") &&
      (platonicResult.coverageGateApplied ||
        platonicResult.beliefGateApplied ||
        platonicResult.rattlingGateApplied)
    ) {
      const missingSlots =
        docSlotSummary?.missingSlots?.length
          ? docSlotSummary.missingSlots
          : coverageSlotSummary?.missingSlots ?? [];
      const scientific = buildScientificMicroReport({
        question: baseQuestion,
        claimLedger: platonicResult.claimLedger,
        uncertaintyRegister: platonicResult.uncertaintyRegister,
        missingSlots,
        slotPlan,
        anchorFiles: contextFiles,
        searchedTerms: retrievalQueries,
        searchedFiles: retrievalFilesSnapshot,
        includeSearchSummary: true,
        planClarify: planDirectives?.clarifyQuestion,
        headingSeedSlots: slotPlanHeadingSeedSlots.length ? slotPlanHeadingSeedSlots : headingSeedSlots,
        hypothesisEnabled: HELIX_ASK_HYPOTHESIS,
        hypothesisStyle: HELIX_ASK_HYPOTHESIS_STYLE,
        requiresRepoEvidence,
      });
      cleaned = scientific.text;
      platonicResult = applyHelixAskPlatonicGates({
        question: baseQuestion,
        answer: cleaned,
        domain: platonicDomain,
        tier: intentTier,
        intentId: intentProfile.id,
        format: formatSpec.format,
        evidenceText,
        evidencePaths,
        evidenceGateOk,
        requiresRepoEvidence,
        coverageSlots: coverageSlots.length > 0 ? coverageSlots : undefined,
        coverageSlotAliases: coverageSlotAliasMap ?? undefined,
        generalScaffold,
        repoScaffold,
        promptScaffold,
        conceptMatch,
        templateLockedAnswer: lockedByIdeologyTemplate,
      });
      if (debugPayload) {
        debugPayload.scientific_response_applied = true;
        debugPayload.next_evidence_count = scientific.nextEvidence.length;
        debugPayload.next_evidence_coverage =
          missingSlots.length > 0 ? scientific.nextEvidence.length / missingSlots.length : 0;
        debugPayload.hypothesis_count = scientific.hypothesisCount;
        debugPayload.hypothesis_rate =
          scientific.hypothesisCount > 0
            ? scientific.hypothesisCount / Math.max(1, missingSlots.length)
            : 0;
      }
    }
    if (debugPayload) {
      debugPayload.claim_ref_rate = computeClaimRefRate(platonicResult.claimLedger);
    }
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
      const citedPathStats = computeTreeCitationStats(extractFilePathsFromText(cleaned));
      const treeDominatedCitations =
        citedPathStats.total > 0 &&
        citedPathStats.nonTree === 0 &&
        citedPathStats.share >= HELIX_ASK_TREE_DOMINANCE_RATIO;
      if (
        !HELIX_ASK_FORCE_FULL_ANSWERS &&
        HELIX_ASK_SINGLE_LLM &&
        !isIdeologyReferenceIntent &&
        hasToolEvidence &&
        treeDominatedCitations
      ) {
        const dominanceFallback = buildSingleLlmShortAnswerFallback({
          question: baseQuestion,
          definitionFocus,
          docBlocks,
          codeAlignment,
          treeWalk:
            HELIX_ASK_TREE_WALK_INJECT &&
            treeWalkBindingRate >= HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS
              ? treeWalkBlock
              : undefined,
          missingSlots:
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [],
          slotPlan,
          anchorFiles: contextFiles,
          searchedTerms: retrievalQueries,
          searchedFiles: retrievalFilesSnapshot,
          planClarify: clarifyOverride ?? planDirectives?.clarifyQuestion,
          headingSeedSlots:
            slotPlanHeadingSeedSlots.length > 0 ? slotPlanHeadingSeedSlots : headingSeedSlots,
          requiresRepoEvidence,
        });
        if (dominanceFallback.trim()) {
          cleaned = dominanceFallback.trim();
          answerPath.push("treeDominanceFallback");
          if (debugPayload) {
            debugPayload.answer_short_fallback_applied = true;
            debugPayload.answer_short_fallback_reason = "tree_dominance";
          }
        }
      }
      if (debugPayload) {
        debugPayload.answer_after_fallback = clipAskText(
          cleaned,
          HELIX_ASK_ANSWER_PREVIEW_CHARS,
        );
      }
      const citedPaths = extractFilePathsFromText(cleaned);
      const hasCitations = citedPaths.length > 0 || hasSourcesLine(cleaned);
      logEvent(
        "Citations",
        intentProfile.evidencePolicy.requireCitations ? "required" : "optional",
        `present=${hasCitations ? "yes" : "no"} | files=${citedPaths.length}`,
      );
      answerPath.push("platonic:gates");
      if (debugPayload) {
        debugPayload.junk_clean_applied = platonicResult.junkCleanApplied;
        debugPayload.junk_clean_reasons = platonicResult.junkCleanReasons;
        debugPayload.concept_lint_applied = platonicResult.conceptLintApplied;
        debugPayload.concept_lint_reasons = platonicResult.conceptLintReasons;
        debugPayload.physics_lint_applied = platonicResult.physicsLintApplied;
        debugPayload.physics_lint_reasons = platonicResult.physicsLintReasons;
        debugPayload.drift_repair_applied = driftRepairApplied;
        debugPayload.drift_repair_attempts = driftRepairAttempts;
        debugPayload.drift_repair_improved = driftRepairImproved;
        debugPayload.coverage_token_count = platonicResult.coverageSummary.tokenCount;
        debugPayload.coverage_key_count = platonicResult.coverageSummary.keyCount;
        debugPayload.coverage_missing_key_count = platonicResult.coverageSummary.missingKeyCount;
        debugPayload.coverage_ratio = platonicResult.coverageSummary.coverageRatio;
        debugPayload.coverage_missing_keys = platonicResult.coverageSummary.missingKeys;
        debugPayload.coverage_gate_applied = platonicResult.coverageGateApplied;
        debugPayload.coverage_gate_reason = platonicResult.coverageGateReason;
        debugPayload.claim_ledger = platonicResult.claimLedger
          .slice(0, 8)
          .map((entry) => ({
            id: entry.id,
            type: entry.type,
            supported: entry.supported,
            evidence_refs: entry.evidenceRefs.slice(0, 4),
            proof: entry.proof,
          }));
        debugPayload.uncertainty_register = platonicResult.uncertaintyRegister
          .slice(0, 8)
          .map((entry) => ({
            id: entry.id,
            type: entry.type,
            reason: entry.reason,
          }));
        debugPayload.constraint_matrix = buildConstraintMatrix({
          answer: cleaned,
          question: baseQuestion,
          format: formatSpec.format,
          requiresRepoEvidence,
          stageTags: formatSpec.stageTags,
        });
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
        debugPayload.grounded_sentence_rate = computeGroundedSentenceRate(cleaned);
        const finalCitationStats = computeTreeCitationStats(citedPaths);
        debugPayload.tree_citation_share = Number(finalCitationStats.share.toFixed(3));
        debugPayload.tree_citation_total = finalCitationStats.total;
        debugPayload.tree_citation_tree = finalCitationStats.tree;
        debugPayload.tree_citation_non_tree = finalCitationStats.nonTree;
        if (debugPayload.clarify_triggered) {
          const clarifySignals =
            (debugPayload.ambiguity_terms?.length ?? 0) > 0 ||
            (debugPayload.coverage_missing_keys?.length ?? 0) > 0 ||
            (debugPayload.coverage_slots_missing?.length ?? 0) > 0 ||
            (debugPayload.slot_coverage_missing?.length ?? 0) > 0 ||
            (debugPayload.docs_first_slot_missing?.length ?? 0) > 0;
          debugPayload.clarify_precision = clarifySignals ? 1 : 0;
        }
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
            targetSpan: debugPayload.ambiguity_target_span,
            clusterCount: debugPayload.ambiguity_cluster_count,
            clusterTopMass: debugPayload.ambiguity_cluster_top_mass,
            clusterMargin: debugPayload.ambiguity_cluster_margin,
            clusterEntropy: debugPayload.ambiguity_cluster_entropy,
            clusterCandidates: debugPayload.ambiguity_cluster_candidates,
            gateApplied: debugPayload.ambiguity_gate_applied,
            terms: debugPayload.ambiguity_terms,
          },
        };
        debugPayload.answer_path = answerPath;
      }
      if (forcedAnswerIsHard) {
        answerExtension = {
          available: false,
          citations: [],
          itemCount: 0,
          docItems: 0,
          codeItems: 0,
        };
      } else {
        answerExtension = buildAnswerCoverageExtension({
          answerText: cleaned,
          question: baseQuestion,
          docBlocks,
          codeAlignment,
        });
      }
      const answerWordCount = estimateWordCount(cleaned);
      const extensionAppendEligible =
        HELIX_ASK_APPEND_EXTENSION_TO_TEXT &&
        !isIdeologyReferenceIntent &&
        answerExtension.available &&
        Boolean(answerExtension.text) &&
        (isShortAnswer(cleaned, verbosity).short ||
          answerWordCount < HELIX_ASK_ANSWER_EXTENSION_MIN_WORDS ||
          computeTreeCitationStats(extractFilePathsFromText(cleaned)).share >= HELIX_ASK_TREE_DOMINANCE_RATIO);
      const extensionAlreadyPresent =
        Boolean(answerExtension.text) &&
        cleaned.toLowerCase().includes(answerExtension.text!.toLowerCase());
      const extensionAppendedToText = Boolean(extensionAppendEligible && !extensionAlreadyPresent);
      if (extensionAppendedToText && answerExtension.text) {
        cleaned = `${cleaned}\n\n${answerExtension.text}`.trim();
        answerPath.push("answerExtension:appended");
      }
      cleaned = repairSparseScientificSections(
        cleaned,
        answerExtension.citations.length > 0
          ? answerExtension.citations
          : extractFilePathsFromText(cleaned),
        rawAnswerSentences,
      );
      cleaned = stripTrivialOrdinalBullets(cleaned);
      cleaned = dedupeReportParagraphs(cleaned).text;
      const scientificFallbackReason = hasWeakScientificSections(cleaned)
        ? "weak_scientific_sections"
        : shouldForceScientificFallback(cleaned, docBlocks, codeAlignment)
          ? "sparse_scientific_sections"
          : null;
      if (
        !HELIX_ASK_FORCE_FULL_ANSWERS &&
        HELIX_ASK_SINGLE_LLM &&
        !isIdeologyReferenceIntent &&
        hasToolEvidence &&
        scientificFallbackReason
      ) {
        const weakSectionFallback = buildSingleLlmShortAnswerFallback({
          question: baseQuestion,
          definitionFocus,
          docBlocks,
          codeAlignment,
          treeWalk:
            HELIX_ASK_TREE_WALK_INJECT &&
            treeWalkBindingRate >= HELIX_ASK_TREE_WALK_MIN_BIND_FOR_TOOL_RESULTS
              ? treeWalkBlock
              : undefined,
          missingSlots:
            docSlotSummary?.missingSlots?.length
              ? docSlotSummary.missingSlots
              : coverageSlotSummary?.missingSlots ?? [],
          slotPlan,
          anchorFiles: contextFiles,
          searchedTerms: retrievalQueries,
          searchedFiles: retrievalFilesSnapshot,
          planClarify: clarifyOverride ?? planDirectives?.clarifyQuestion,
          headingSeedSlots:
            slotPlanHeadingSeedSlots.length > 0 ? slotPlanHeadingSeedSlots : headingSeedSlots,
          requiresRepoEvidence,
        });
        if (weakSectionFallback.trim()) {
          cleaned = weakSectionFallback.trim();
          answerPath.push(`scientificFallback:${scientificFallbackReason}`);
          if (debugPayload) {
            debugPayload.answer_short_fallback_applied = true;
            debugPayload.answer_short_fallback_reason = scientificFallbackReason;
          }
        }
      }
      cleaned = sanitizeSourcesLine(
        cleaned,
        allowedSourcePaths,
        extractCitationTokensFromText(evidenceText),
      );
      const finalCleanedPreview = clipAskText(cleaned.trim(), HELIX_ASK_ANSWER_PREVIEW_CHARS);
      if (finalCleanedPreview) {
        logEvent("Answer cleaned preview", "final", finalCleanedPreview, answerStart);
      }
      if (debugPayload) {
        debugPayload.answer_final_text = clipAskText(
          cleaned,
          HELIX_ASK_ANSWER_PREVIEW_CHARS,
        );
      }
      cleanedText = cleaned;
      result.text = cleaned;
      if (debugPayload) {
        debugPayload.answer_extension_available = answerExtension.available;
        debugPayload.answer_extension_items = answerExtension.itemCount;
        debugPayload.answer_extension_doc_items = answerExtension.docItems;
        debugPayload.answer_extension_code_items = answerExtension.codeItems;
        debugPayload.answer_extension_appended = extensionAppendedToText;
      }
    }
    if (cleanedText) {
      const extensionTextValue = answerExtension?.text ?? "";
      const extensionAlreadyInAnswer =
        Boolean(extensionTextValue) &&
        cleanedText.toLowerCase().includes(extensionTextValue.toLowerCase());
      result.envelope = buildHelixAskEnvelope({
        answer: cleanedText,
        format: formatSpec.format,
        tier: intentTier,
        secondaryTier: intentSecondaryTier,
        mode: resolveEnvelopeMode(verbosity),
        evidenceText,
        traceId: askTraceId,
        treeWalk: treeWalkBlock || undefined,
        extensionText: extensionAlreadyInAnswer ? undefined : answerExtension?.text,
        extensionCitations: answerExtension?.citations,
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
      const traceEvents = liveEventHistory.slice();
      debugPayload.live_events = traceEvents;
      debugPayload.trace_events = traceEvents;
      debugPayload.trace_summary = buildTraceSummary(traceEvents);
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
  if (isHelixAskCircuitOpen()) {
    const payload = buildHelixAskCircuitPayload(parsed.data.debug === true);
    const retryAfterSeconds = Math.ceil(payload.retryAfterMs / 1000);
    if (retryAfterSeconds > 0) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
    }
    return res.status(503).json(payload);
  }
  const keepAlive = createHelixAskJsonKeepAlive(res, {
    enabled: HELIX_ASK_HTTP_KEEPALIVE && parsed.data.dryRun !== true,
    intervalMs: HELIX_ASK_HTTP_KEEPALIVE_MS,
  });
  const safeSend: HelixAskResponder["send"] = (status, payload) => {
    if (status >= 500) {
      recordHelixAskFailure(payload);
    } else if (status < 400) {
      recordHelixAskSuccess();
    }
    keepAlive.send(status, payload);
  };
  try {
    await executeHelixAsk({
      request: parsed.data,
      personaId,
      responder: { send: safeSend },
    });
  } catch (error) {
    recordHelixAskFailure(error);
    const message = error instanceof Error ? error.message : String(error);
    safeSend(500, { ok: false, error: "helix_ask_unhandled", message, status: 500 });
  }
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
  if (isHelixAskCircuitOpen()) {
    await failHelixAskJob(jobId, "helix_ask_temporarily_unavailable");
    return;
  }
  let settled = false;
  let timeoutHandle: NodeJS.Timeout | null = null;
  let heartbeatHandle: NodeJS.Timeout | null = null;
  const heartbeatIntervalMs = Math.max(1_000, HELIX_ASK_JOB_HEARTBEAT_MS);
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

  heartbeatHandle = setInterval(() => {
    if (settled) return;
    touchHelixAskJob(jobId);
  }, heartbeatIntervalMs);
  heartbeatHandle.unref?.();

  const responder: HelixAskResponder = {
    send: (status, payload) => {
      if (settled) return;
      settled = true;
      if (status >= 500) {
        recordHelixAskFailure(payload);
      } else if (status < 400) {
        recordHelixAskSuccess();
      }
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
    recordHelixAskFailure(error);
    await failHelixAskJob(jobId, normalized);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
    if (heartbeatHandle) {
      clearInterval(heartbeatHandle);
      heartbeatHandle = null;
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
  if (isHelixAskCircuitOpen()) {
    const payload = buildHelixAskCircuitPayload();
    const retryAfterSeconds = Math.ceil(payload.retryAfterMs / 1000);
    if (retryAfterSeconds > 0) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
    }
    return res.status(503).json(payload);
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
  const telemetryTools = new Set([
    "telemetry.badges.read",
    "telemetry.panels.snapshot",
    "telemetry.time_dilation.activate_natario",
  ]);
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
