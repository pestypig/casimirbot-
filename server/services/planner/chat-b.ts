import { createHash, randomUUID } from "node:crypto";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { ConsoleTelemetryBundle } from "@shared/desktop";
import type {
  ResonanceBundle,
  ResonancePatch,
  ResonanceNodeKind,
  ResonanceCollapse,
} from "@shared/code-lattice";
import type { TMemoryRecord, TMemorySearchHit, TTaskTrace, TTaskApproval } from "@shared/essence-persona";
import { DebateConfig, type TDebateOutcome } from "@shared/essence-debate";
import type { Tool, ToolManifestEntry, ToolRiskType } from "@shared/skills";
import { putMemoryRecord, searchMemories } from "../essence/memory-store";
import { kvAdd, kvBudgetExceeded, kvEvictOldest } from "../llm/kv-budgeter";
import { getTool } from "../../skills";
import { metrics, recordTaskOutcome } from "../../metrics";
import { appendToolLog } from "../observability/tool-log-store";
import { runSpecialistPlan, runVerifierOnly, type SpecialistRunResult } from "../specialists/executor";
import { mergeKnowledgeBundles } from "../knowledge/merge";
import { composeKnowledgeAppendix } from "./knowledge-compositor";
import { CASIMIR_PROMOTION_THRESHOLDS } from "../code-lattice/resonance.constants";
import { startDebate, waitForDebateOutcome } from "../debate/orchestrator";
import { summarizeConsoleTelemetry } from "../console-telemetry/summarize";

export const PLAN_DSL_CHAIN = "SEARCH→SUMMARIZE→CALL(tool)";
export const PLAN_DSL_GUIDE = [
  `${PLAN_DSL_CHAIN} enforces grounding before tool use.`,
  'SEARCH("query", k=3-6)        # fetch evidence from memory or files',
  'SUMMARIZE(@step_id, "focus")  # compress the referenced output',
  'CALL(tool_name, {...})        # invoke a registered tool with JSON args',
  'SOLVE("solver", params={})    # (optional) run ENABLE_SPECIALISTS solvers with typed inputs',
  'VERIFY(@step_id, "verifier")  # (optional) re-check solver outputs with ENABLE_SPECIALISTS gates',
].join("\n");

export const DEFAULT_SUMMARY_FOCUS = "Highlight statuses, blockers, and actionable next steps.";
const DEFAULT_DEBATE_ATTACHMENTS = [
  {
    title: "Stellar Consciousness (Orch OR Review)",
    url: "/mnt/data/Reformatted; Stellar Consciousness by Orchestrated Objective Reduction Review.pdf",
  },
  {
    title: "Quantum Computation in Brain Microtubules (1998)",
    url: "/mnt/data/Quantum Computation in Brain Microtubules The Penrose-Hameroff hameroff-1998.pdf",
  },
];

export type PlanNode =
  | { id: string; kind: "SEARCH"; query: string; topK: number; target: "memory"; note: string }
  | { id: string; kind: "SUMMARIZE"; source: string; focus: string }
  | {
      id: string;
      kind: "CALL";
      tool: string;
      summaryRef?: string;
      promptTemplate: string;
      extra?: Record<string, unknown>;
    }
  | {
      id: string;
      kind: "SOLVE";
      solver: string;
      summaryRef?: string;
      verifier?: string;
      params?: Record<string, unknown>;
      repair?: boolean;
    }
  | { id: string; kind: "VERIFY"; source: string; verifier: string }
  | { id: string; kind: "DEBATE_START"; topic: string; summaryRef?: string }
  | { id: string; kind: "DEBATE_CONSUME"; source: string }
  // Legacy debate nodes kept for backward compatibility with stored traces
  | { id: string; kind: "DEBATE.START"; topic: string; summaryRef?: string }
  | { id: string; kind: "DEBATE.CONSUME"; source: string };

export type ExecutorStep =
  | { id: string; kind: "memory.search"; query: string; topK: number }
  | { id: string; kind: "summary.compose"; source: string; focus: string }
  | {
      id: string;
      kind: "tool.call";
      tool: string;
      summaryRef?: string;
      promptTemplate: string;
      extra?: Record<string, unknown>;
    }
  | {
      id: string;
      kind: "debate.run";
      tool: "debate.run";
      topic?: string;
      personaId?: string;
      summaryRef?: string;
      context?: Record<string, unknown>;
      budgets?: { max_rounds?: number; max_wall_ms?: number };
      debateTriggers?: string[];
    }
  | {
      id: string;
      kind: "specialist.run";
      solver: string;
      summaryRef?: string;
      verifier?: string;
      params?: Record<string, unknown>;
      repair?: boolean;
    }
  | { id: string; kind: "specialist.verify"; source: string; verifier: string }
  | { id: string; kind: "debate.start"; topic: string; summaryRef?: string }
  | { id: string; kind: "debate.consume"; source: string };

type ExecutionResultBase = {
  id: string;
  kind: ExecutorStep["kind"];
  citations: string[];
  latency_ms?: number;
  essence_ids?: string[];
};

type ExecutionErrorPolicy = {
  reason?: string;
  tool?: string;
  capability?: ToolRiskType;
  risks?: ToolRiskType[];
};

export type ExecutionError = {
  message: string;
  type?: string;
  policy?: ExecutionErrorPolicy;
};

export type ExecutionResultSuccess = ExecutionResultBase & { ok: true; output: unknown };
export type ExecutionResultFailure = ExecutionResultBase & { ok: false; output?: unknown; error?: ExecutionError | string };
export type ExecutionResult = ExecutionResultSuccess | ExecutionResultFailure;

const isFailedResult = (result: ExecutionResult): result is ExecutionResultFailure => result.ok === false;

export interface PlannerPromptArgs {
  goal: string;
  personaId?: string;
  manifest: ToolManifestEntry[];
  searchQuery: string;
  topK: number;
  summaryFocus: string;
  knowledgeContext?: KnowledgeProjectExport[];
  resonanceBundle?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  primaryPatchId?: string | null;
  telemetryBundle?: ConsoleTelemetryBundle | null;
  knowledgeHints?: string[];
}

export interface BuildPlanArgs {
  goal: string;
  searchQuery: string;
  topK?: number;
  summaryFocus?: string;
  finalTool: string;
}

export interface ExecutionRuntime {
  goal: string;
  personaId?: string;
  sessionId?: string;
  taskTrace?: TTaskTrace;
  requestApproval?: ApprovalHandler;
  knowledgeContext?: KnowledgeProjectExport[];
  telemetrySummary?: string | null;
  resonanceBundle?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  knowledgeHints?: string[];
  plannerPrompt?: string | null;
  debateId?: string | null;
  debateOutcome?: TDebateOutcome | null;
}

export type ResonantPlanCandidate = {
  patch: ResonancePatch;
  knowledgeContext?: KnowledgeProjectExport[];
  plannerPrompt: string;
  nodes: PlanNode[];
  planDsl: string;
};

const FIX_KEYWORDS = /\b(fix|bug|broken|repair|debug|error|failing|regression)\b/;
const IDEOLOGY_KEYWORDS = /\b(ethos|ideology|mission|philosophy|why|ethic|vision)\b/;
const CASIMIR_PANEL_ID = "casimir-tiles";
const CASIMIR_NODE_PATTERN = /casimir/i;

const basename = (value: string) => value.split(/[/\\]/).pop() ?? value;

const describePatchNodes = (patch: ResonancePatch, limit = 2): string => {
  const nodes = patch.nodes.slice(0, limit);
  if (nodes.length === 0) {
    return "n/a";
  }
  return nodes.map((node) => `${node.symbol} (${basename(node.filePath)})`).join(", ");
};

const RESONANCE_KIND_ORDER: ResonanceNodeKind[] = [
  "architecture",
  "ideology",
  "doc",
  "ui",
  "data",
  "plumbing",
  "test",
  "unknown",
];

const getKindPriority = (kind?: ResonanceNodeKind): number => {
  const resolved = kind ?? "unknown";
  const index = RESONANCE_KIND_ORDER.indexOf(resolved);
  return index >= 0 ? index : RESONANCE_KIND_ORDER.length;
};

const normalizeBand = (value?: string): string => (value ?? "").toLowerCase();

type ResonanceSectionArgs = {
  bundle?: ResonanceBundle | null;
  selection?: ResonanceCollapse | null;
  preferredPatchId?: string | null;
  hotNodeLimit?: number;
};

const pickPatchForSection = ({
  bundle,
  selection,
  preferredPatchId,
}: ResonanceSectionArgs): ResonancePatch | null => {
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return null;
  }
  if (preferredPatchId) {
    const preferred = bundle.candidates.find((candidate) => candidate.id === preferredPatchId);
    if (preferred) {
      return preferred;
    }
  }
  const rankingOrder = selection?.ranking?.map((entry) => entry.patchId) ?? [];
  for (const patchId of rankingOrder) {
    const match = bundle.candidates.find((candidate) => candidate.id === patchId);
    if (match) {
      return match;
    }
  }
  return bundle.candidates[0] ?? null;
};

const composeResonancePatchSection = ({
  bundle,
  selection,
  preferredPatchId,
  hotNodeLimit = 5,
}: ResonanceSectionArgs): string => {
  const unavailable = (reason: string): string =>
    ["[Code Resonance Patch]", "status: unavailable", `reason: ${reason}`].join("\n");
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return unavailable("code lattice snapshot unavailable or no resonance seeds matched this goal");
  }
  const patch = pickPatchForSection({ bundle, selection, preferredPatchId });
  if (!patch) {
    return unavailable("no resonance patch ranked for this goal");
  }
  const stats = patch.stats ?? ({
    nodeCount: patch.nodes.length,
    failingTests: 0,
    activePanels: 0,
    activationTotal: patch.nodes.reduce((sum, node) => sum + (node.score ?? 0), 0),
    telemetryWeight: 0,
  } as ResonancePatch["stats"]);
  const nodes = patch.nodes
    .slice()
    .sort((a, b) => {
      const kindDiff = getKindPriority(a.kind) - getKindPriority(b.kind);
      if (kindDiff !== 0) {
        return kindDiff;
      }
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, Math.max(1, hotNodeLimit));

  if (nodes.length === 0) {
    return unavailable("resonance candidates collapsed to zero nodes");
  }

  const lines = [
    "[Code Resonance Patch]",
    `blueprint: ${patch.mode}`,
    "stats:",
    `  nodes: ${stats.nodeCount ?? nodes.length}`,
    `  activation_total: ${(stats.activationTotal ?? 0).toFixed(3)}`,
    `  telemetry_overlap: ${stats.telemetryWeight ?? 0}`,
    `  failing_tests: ${stats.failingTests ?? 0}`,
    "",
  ];

  const casimirBands = bundle?.telemetry?.casimir?.bands ?? [];
  if (casimirBands.length > 0) {
    lines.push("casimir_bands:");
    for (const band of casimirBands) {
      const bandName = normalizeBand(band.name);
      const taggedNodes = nodes
        .filter((node) => (node.bands ?? []).some((value) => normalizeBand(value) === bandName))
        .slice(0, 5);
      const sources = (band.sourceIds ?? []).slice(0, 5).join(", ");
      const nodeList = taggedNodes.map((node) => basename(node.filePath)).join(", ");
      lines.push(`- band: ${band.name}`);
      lines.push(`  seed: ${formatMetric(band.seed)}`);
      lines.push(`  coherence: ${formatMetric(band.coherence)}`);
      lines.push(`  q: ${formatMetric(band.q)}`);
      lines.push(`  occupancy: ${formatMetric(band.occupancy)}`);
      if (band.eventRate !== undefined) {
        lines.push(`  event_rate: ${formatMetric(band.eventRate)}`);
      }
      if (sources) {
        lines.push(`  sources: ${sources}`);
      }
      if (nodeList) {
        lines.push(`  nodes: ${nodeList}`);
      }
    }
    lines.push("");
  }

  lines.push("hot_nodes:");

  for (const node of nodes) {
    lines.push(
      [
        `- id: ${node.id}`,
        `  file: ${node.filePath}`,
        `  kind: ${node.kind ?? "unknown"}`,
        `  summary: ${(node.summary ?? node.symbol).replace(/\s+/g, " ")}`,
      ].join("\n"),
    );
  }

  return lines.join("\n");
};

const pickCasimirNodes = (bundle?: ResonanceBundle | null, limit = 3) => {
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return [] as ResonancePatch["nodes"];
  }
  const nodes: ResonancePatch["nodes"][number][] = [];
  for (const candidate of bundle.candidates) {
    for (const node of candidate.nodes) {
      if (CASIMIR_NODE_PATTERN.test(node.filePath) || CASIMIR_NODE_PATTERN.test(node.symbol ?? "")) {
        nodes.push(node);
      }
    }
  }
  nodes.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return nodes.slice(0, Math.max(1, limit));
};

const toFinite = (value?: number): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

const formatMetric = (value?: number, digits = 3): string => {
  const finite = toFinite(value);
  return finite === null ? "n/a" : finite.toFixed(digits);
};

const composeCasimirTelemetrySection = ({
  telemetry,
  bundle,
}: {
  telemetry?: ConsoleTelemetryBundle | null;
  bundle?: ResonanceBundle | null;
}): string => {
  const panel = telemetry?.panels?.find((entry) => entry.panelId === CASIMIR_PANEL_ID) ?? null;
  const nodes = pickCasimirNodes(bundle);
  const casimir = bundle?.telemetry?.casimir;
  if (!panel && !casimir) {
    return [
      "[Casimir telemetry]",
      "status: none",
      "reason: no casimir-tiles snapshot available in console telemetry",
      "action: enable the Casimir tile emitter so planners can cite tile health.",
    ].join("\n");
  }
  const lines = [
    "[Casimir telemetry]",
    `status: ${panel?.flags?.hasActivity ? "active" : "idle"}`,
  ];
  const tileSample = panel?.tile_sample ?? casimir?.tileSample;
  const tilesActive = toFinite(tileSample?.active ?? panel?.metrics?.tilesActive);
  const totalTiles = toFinite(tileSample?.total ?? panel?.metrics?.totalTiles);
  if (tilesActive !== null || totalTiles !== null) {
    lines.push(`tiles_active: ${tilesActive ?? "n/a"}/${totalTiles ?? "n/a"}`);
  }
  lines.push(`avg_q_factor: ${formatMetric(panel?.metrics?.avgQFactor ?? casimir?.bands?.[0]?.q)}`);
  lines.push(`coherence: ${formatMetric(panel?.metrics?.coherence ?? casimir?.bands?.[0]?.coherence)}`);
  const lastIso = panel?.strings?.lastEventIso ?? casimir?.bands?.[0]?.lastEventIso;
  if (lastIso) {
    lines.push(`last_event: ${lastIso}`);
  }
  if (casimir?.bands?.length) {
    lines.push("bands:");
    for (const band of casimir.bands) {
      lines.push(
        `- ${band.name}: seed=${formatMetric(band.seed)} coherence=${formatMetric(band.coherence)} q=${formatMetric(band.q)} occupancy=${formatMetric(band.occupancy)}`,
      );
      if (band.eventRate !== undefined) {
        lines.push(`  event_rate: ${formatMetric(band.eventRate)}`);
      }
      if (band.sourceIds?.length) {
        lines.push(`  sources: ${band.sourceIds.slice(0, 5).join(", ")}`);
      }
    }
  }
  if (nodes.length > 0) {
    lines.push("", "activated_nodes:");
    for (const node of nodes) {
      const score = typeof node.score === "number" ? node.score.toFixed(3) : "n/a";
      lines.push(`- ${node.id} (${node.kind ?? "unknown"}) score=${score}`);
    }
  } else {
    lines.push("reason: telemetry present but Casimir nodes remained below the resonance threshold");
    lines.push("action: raise tile activity or widen sampling before collapse.");
  }
  return lines.join("\n");
};

const formatKnowledgeHeading = (base: string, hints?: string[]): string => {
  const list = (hints ?? []).map((hint) => hint.trim()).filter(Boolean);
  if (list.length === 0) {
    return base;
  }
  const excerpt = list.slice(0, 4).join(", ");
  const suffix = list.length > 4 ? ", ..." : "";
  return `${base} (hints: ${excerpt}${suffix})`;
};

const computePlumbingShare = (nodes: ResonancePatch["nodes"], top = 5): number => {
  if (!nodes.length) {
    return 0;
  }
  const sample = nodes.slice(0, Math.max(1, top));
  const plumbing = sample.filter((node) => (node.kind ?? "unknown") === "plumbing").length;
  return plumbing / sample.length;
};

export function collapseResonancePatches(args: {
  bundle?: ResonanceBundle | null;
  goal: string;
  jitter?: number;
}): ResonanceCollapse | null {
  const bundle = args.bundle;
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return null;
  }
  const jitter =
    typeof args.jitter === "number" && Number.isFinite(args.jitter)
      ? Math.abs(args.jitter)
      : Number(process.env.RESONANCE_COLLAPSE_JITTER ?? 0.04);
  const normalizedGoal = args.goal.toLowerCase();
  const wantsFix = FIX_KEYWORDS.test(normalizedGoal);
  const wantsIdeology = IDEOLOGY_KEYWORDS.test(normalizedGoal);

  const rankingInternal = bundle.candidates
    .map((patch) => {
      let weight = patch.score;
      if (wantsFix) {
        weight += Math.min(1, patch.stats.failingTests * 0.12);
      }
      if (patch.stats.activePanels > 0) {
        weight += Math.min(0.6, patch.stats.activePanels * 0.05);
      }
      if (wantsIdeology && patch.mode === "ideology") {
        weight += 0.35;
      } else if (!wantsIdeology && patch.mode === "ideology") {
        weight -= 0.1;
      }
      if (!wantsIdeology && patch.mode === "local") {
        weight += 0.05;
      }
      const noise = (Math.random() * 2 - 1) * jitter;
      return { patch, weightedScore: weight + noise };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);

  const casimirCoherence = bundle.telemetry?.casimir?.totalCoherence ?? 0;
  let primary = rankingInternal[0]?.patch;
  if (!primary) {
    return null;
  }
  let backup = rankingInternal[1]?.patch;
  const primaryPlumbingShare = computePlumbingShare(primary.nodes);
  let promotedPrimary = false;
  if (
    casimirCoherence > CASIMIR_PROMOTION_THRESHOLDS.totalCoherence &&
    primaryPlumbingShare > CASIMIR_PROMOTION_THRESHOLDS.plumbingShare
  ) {
    const alternate = rankingInternal.find(
      (entry) => entry.patch.id !== primary.id && computePlumbingShare(entry.patch.nodes) <= 0.7,
    );
    if (alternate) {
      backup = primary;
      primary = alternate.patch;
      promotedPrimary = true;
    }
  }
  const ranking = rankingInternal
    .map((entry) => ({
      patchId: entry.patch.id,
      label: entry.patch.label,
      mode: entry.patch.mode,
      weightedScore: Number(entry.weightedScore.toFixed(4)),
      stats: entry.patch.stats,
    }))
    .sort((a, b) => {
      if (a.patchId === primary.id) return -1;
      if (b.patchId === primary.id) return 1;
      return 0;
    });
  const rationaleParts = [
    `Selected ${primary.label} (${primary.mode})`,
    `focus=${describePatchNodes(primary)}`,
    `panels=${primary.stats.activePanels}`,
    `failing_tests=${primary.stats.failingTests}`,
  ];
  if (casimirCoherence > 0) {
    rationaleParts.push(`casimir_coherence=${casimirCoherence.toFixed(3)}`);
  }
  if (promotedPrimary && backup) {
    rationaleParts.push(`promoted_non_plumbing=${primary.label} (was ${backup.label})`);
  }
  if (backup) {
    rationaleParts.push(`backup=${backup.label}`);
  }

  return {
    primaryPatchId: primary.id,
    backupPatchId: backup?.id,
    rationale: rationaleParts.join(" | "),
    ranking,
  };
}

type ApprovalRequest = {
  tool: Tool;
  capability: ToolRiskType;
  reason: string;
  sessionId: string;
  personaId: string;
  goal: string;
};

type ApprovalDecision = {
  granted: boolean;
  grantedBy?: string;
  notes?: string;
  message?: string;
  reason?: string;
};

type ApprovalHandler = (request: ApprovalRequest) => Promise<ApprovalDecision>;

type PlannerPolicyError = Error & {
  type?: string;
  policy?: ExecutionErrorPolicy;
};

type TranscriptBlock = {
  turnId: string;
  stepId: string;
  kind: ExecutorStep["kind"];
  text: string;
  bytes: number;
  citations: string[];
  createdAt: string;
};

const transcriptStore = new Map<string, Map<string, TranscriptBlock>>();
type TraceEntry = { trace: TTaskTrace; expiresAt: number };
const traceStore = new Map<string, TraceEntry>();
const DEFAULT_KV_BUDGET_BYTES = 1.5e9;
const TRACE_TTL_MS = (() => {
  const fallback = 6 * 60 * 60 * 1000;
  const raw = Number(process.env.TRACE_TTL_MS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.floor(raw);
})();

const cleanupExpiredTraces = (): void => {
  if (traceStore.size === 0) {
    return;
  }
  const now = Date.now();
  for (const [key, entry] of traceStore.entries()) {
    if (entry.expiresAt <= now) {
      traceStore.delete(key);
    }
  }
};

export function registerInMemoryTrace(trace: TTaskTrace): void {
  cleanupExpiredTraces();
  traceStore.set(trace.id, { trace, expiresAt: Date.now() + TRACE_TTL_MS });
}

export function __getTaskTrace(id: string): TTaskTrace | undefined {
  cleanupExpiredTraces();
  const entry = traceStore.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    traceStore.delete(id);
    return undefined;
  }
  return entry.trace;
}

export function renderChatBPlannerPrompt(args: PlannerPromptArgs): string {
  const persona = args.personaId ?? "default";
  const manifestLines =
    args.manifest.length > 0
      ? args.manifest
          .map(
            (tool) =>
              `- ${tool.name}: ${tool.desc} (deterministic=${tool.deterministic ? "yes" : "no"}, rpm=${tool.rateLimit.rpm})`,
          )
          .join("\n")
      : "- (no tools registered yet)";

  const lines = [
    `You are Chat B, the planner for persona ${persona}.`,
    `Goal: ${args.goal}`,
    `Always respond with ${PLAN_DSL_CHAIN}, then optionally SOLVE/VERIFY steps when specialists are enabled.`,
    PLAN_DSL_GUIDE,
    `Suggested search query: ${args.searchQuery} (top_k=${args.topK}).`,
    `Summary focus: ${args.summaryFocus}`,
    "Registered tools:",
    manifestLines,
    'Return a single line using "->" between steps, e.g.',
    'SEARCH("drive status",k=4)->SUMMARIZE(@s1,"Blockers")->CALL(llm.local.generate,{"prompt":"..."})',
  ];

  const resonanceSection = composeResonancePatchSection({
    bundle: args.resonanceBundle,
    selection: args.resonanceSelection,
    preferredPatchId: args.primaryPatchId,
  });
  if (resonanceSection) {
    lines.push("", resonanceSection);
  }

  const knowledgeHeading = formatKnowledgeHeading("Knowledge Appendix", args.knowledgeHints);
  const appendix = composeKnowledgeAppendix({
    goal: args.goal,
    knowledgeContext: args.knowledgeContext,
    maxSnippets: 4,
    heading: knowledgeHeading,
  });
  if (appendix.text) {
    lines.push("", appendix.text);
  }

  const casimirSection = composeCasimirTelemetrySection({
    telemetry: args.telemetryBundle,
    bundle: args.resonanceBundle,
  });
  if (casimirSection) {
    lines.push("", casimirSection);
  }

  return lines.join("\n");
}

export function buildDebateNarrationPrompt(args: {
  goal: string;
  resonancePatch?: ResonancePatch | null;
  telemetrySummary?: string | null;
  verdictFromStepId?: string;
  keyTurns?: string[];
}): string {
  const patchLabel = args.resonancePatch ? `${args.resonancePatch.label} (${args.resonancePatch.mode})` : "n/a";
  const keyTurnLine = args.keyTurns && args.keyTurns.length > 0 ? `Key turns: ${args.keyTurns.join(", ")}` : null;
  const lines = [
    "Draft an operator-facing narration that blends telemetry/tool output with the referee's debate verdict.",
    `Goal: ${args.goal}`,
    `Resonance patch: ${patchLabel}`,
    "Rewrite the telemetry/tool output in one concise, actionable update.",
    "Telemetry output:",
    "{{summary}}",
    "Debate verdict:",
    "{{debate}}",
  ];
  if (args.verdictFromStepId) {
    lines.push(`Verdict source step: @${args.verdictFromStepId}`);
  }
  if (keyTurnLine) {
    lines.push(keyTurnLine);
  }
  if (args.telemetrySummary) {
    lines.push("Panel snapshot:", args.telemetrySummary);
  }
  lines.push("Keep it brief, cite notable turns, and state next actions for operators.");
  return lines.join("\n");
}

export function buildDirectNarrationPrompt(args: {
  goal: string;
  resonancePatch?: ResonancePatch | null;
  telemetrySummary?: string | null;
}): string {
  const patchLabel = args.resonancePatch ? `${args.resonancePatch.label} (${args.resonancePatch.mode})` : "n/a";
  const lines = [
    "Rewrite the telemetry/tool output for operators with clear status and next steps.",
    `Goal: ${args.goal}`,
    `Resonance patch: ${patchLabel}`,
    "Telemetry output:",
    "{{summary}}",
  ];
  if (args.telemetrySummary) {
    lines.push("Panel snapshot:", args.telemetrySummary);
  }
  lines.push("Highlight anomalies, blockers, and what to do next.");
  return lines.join("\n");
}

const AMBIGUOUS_INTENT_PATTERN = /\b(maybe|not sure|unclear|which|options?|either|should (we|i)|could|unsure)\b/i;
const WHY_COMPARE_PATTERN = /\b(why|compare|versus|vs\.?|related|difference|diff|better|trade ?off)\b/i;
const TELEMETRY_OVERLAP_LIMIT = 1;
const RESONANCE_CONFIDENCE_LIMIT = 0.35;

const computeDebateTriggers = (goal: string, patch: ResonancePatch, selection?: ResonanceCollapse | null): string[] => {
  const triggers: string[] = [];
  const normalizedGoal = goal.toLowerCase();
  if (AMBIGUOUS_INTENT_PATTERN.test(normalizedGoal) || normalizedGoal.includes("?")) {
    triggers.push("ambiguous_intent");
  }
  if (WHY_COMPARE_PATTERN.test(normalizedGoal)) {
    triggers.push("why_compare_related");
  }
  const telemetryWeight = patch.stats?.telemetryWeight ?? 0;
  if (telemetryWeight < TELEMETRY_OVERLAP_LIMIT) {
    triggers.push("low_telemetry_overlap");
  }
  const rankingEntry = selection?.ranking?.find((entry) => entry.patchId === patch.id);
  const confidence = rankingEntry?.weightedScore ?? patch.score ?? 0;
  if (!Number.isFinite(confidence) || confidence < RESONANCE_CONFIDENCE_LIMIT) {
    triggers.push("low_resonance_confidence");
  }
  if (process.env.ENABLE_DEBATE === "1") {
    triggers.push("operator_toggle");
  }
  return triggers;
};

const toFetchableAttachmentUrl = (value: string): string => {
  if (!value) {
    return "";
  }
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  // Keep local file paths intact; the debate tool converts them into fetchable URLs.
  return normalized;
};

const normalizeDebateAttachments = (
  attachments?: Array<{ title?: string; url?: string }>,
): Array<{ title: string; url: string }> => {
  const base = attachments && attachments.length > 0 ? attachments : DEFAULT_DEBATE_ATTACHMENTS;
  return base
    .map((item) => {
      const url = toFetchableAttachmentUrl(item.url ?? "");
      if (!url) {
        return null;
      }
      return { title: item.title ?? "attachment", url };
    })
    .filter(Boolean) as Array<{ title: string; url: string }>;
};

const buildDebateContext = (params: {
  patch: ResonancePatch;
  telemetrySummary?: string | null;
  knowledgeHints?: string[];
  plannerPrompt?: string | null;
}) => ({
  resonance_patch: params.patch,
  telemetry_summary: params.telemetrySummary,
  knowledge_hints: params.knowledgeHints,
  attachments: DEFAULT_DEBATE_ATTACHMENTS,
  planner_prompt: params.plannerPrompt ?? undefined,
});

export function buildCandidatePlansFromResonance(args: {
  basePlan: BuildPlanArgs;
  personaId?: string;
  manifest: ToolManifestEntry[];
  baseKnowledgeContext?: KnowledgeProjectExport[];
  resonanceBundle?: ResonanceBundle | null;
  resonanceSelection?: ResonanceCollapse | null;
  topPatches?: number;
  telemetryBundle?: ConsoleTelemetryBundle | null;
  knowledgeHints?: string[];
  telemetrySummary?: string | null;
}): ResonantPlanCandidate[] {
  const bundle = args.resonanceBundle;
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return [];
  }
  const telemetrySummary = args.telemetrySummary ?? summarizeConsoleTelemetry(args.telemetryBundle);
  const hasDebateTool = args.manifest.some((tool) => tool.name === "debate.run");
  const narrationTool = args.manifest.some((tool) => tool.name === "llm.http.generate")
    ? "llm.http.generate"
    : args.manifest.some((tool) => tool.name === "llm.local.generate")
    ? "llm.local.generate"
    : "llm.http.generate";
  const ranking = args.resonanceSelection?.ranking ?? [];
  const rankingOrder = ranking.map((entry) => entry.patchId);
  const topLimit = Math.max(1, Math.min(bundle.candidates.length, args.topPatches ?? 3));
  const sortedPatches = bundle.candidates
    .slice()
    .sort((a, b) => {
      const aIndex = rankingOrder.indexOf(a.id);
      const bIndex = rankingOrder.indexOf(b.id);
      if (aIndex >= 0 || bIndex >= 0) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }
      return b.score - a.score;
    })
    .slice(0, topLimit);

  const candidates: ResonantPlanCandidate[] = [];
  for (const patch of sortedPatches) {
    const knowledgeContext = mergeKnowledgeBundles(args.baseKnowledgeContext, [patch.knowledge]);
    const plannerPrompt = renderChatBPlannerPrompt({
      goal: args.basePlan.goal,
      personaId: args.personaId,
      manifest: args.manifest,
      searchQuery: args.basePlan.searchQuery,
      topK: args.basePlan.topK ?? 5,
      summaryFocus: args.basePlan.summaryFocus ?? DEFAULT_SUMMARY_FOCUS,
      knowledgeContext,
      resonanceBundle: args.resonanceBundle,
      resonanceSelection: args.resonanceSelection,
      primaryPatchId: patch.id,
      telemetryBundle: args.telemetryBundle,
      knowledgeHints: args.knowledgeHints,
    });
    const basePlan = buildChatBPlan(args.basePlan);
    const baseNodes = [...basePlan.nodes];
    const summaryId = baseNodes.find((node) => node.kind === "SUMMARIZE")?.id ?? "s2";
    const nodes: PlanNode[] = baseNodes.filter((node) => node.kind !== "CALL");
    let stepCounter = nodes.length + 1;
    const nextId = () => {
      const id = `s${stepCounter}`;
      stepCounter += 1;
      return id;
    };

    const addTelemetry = args.manifest.some((tool) => tool.name === "telemetry.badges.read");
    if (addTelemetry) {
      nodes.push({
        id: nextId(),
        kind: "CALL",
        tool: "telemetry.badges.read",
        summaryRef: summaryId,
        promptTemplate: "Collect Casimir badge snapshot before debating.",
      });
    }

    const addChecklist = args.manifest.some(
      (tool) => tool.name === "debate.checklist.generate" || tool.name === "checklist.method.generate",
    );
    if (addChecklist) {
      nodes.push({
        id: nextId(),
        kind: "CALL",
        tool: "debate.checklist.generate",
        summaryRef: summaryId,
        promptTemplate: "Instantiate falsifiability checklist for the operator goal.",
        extra: {
          goal: args.basePlan.goal,
          frames: { observer: "operator", timescale: "session", domain: "casimir" },
          sources: DEFAULT_DEBATE_ATTACHMENTS.map((att) => att.url),
        },
      });
    }

    const debateTriggers = computeDebateTriggers(args.basePlan.goal, patch, args.resonanceSelection);
    const shouldDebate = hasDebateTool && debateTriggers.length > 0;
    if (shouldDebate) {
      const debateStepId = nextId();
      nodes.push({
        id: debateStepId,
        kind: "CALL",
        tool: "debate.run",
        summaryRef: summaryId,
        promptTemplate: [
          "Prep a short proponent/skeptic debate before operator narration.",
          "Goal: {{goal}}",
          "Context:",
          "{{summary}}",
          "Return the referee verdict with confidence and key_turn_ids.",
        ].join("\n"),
        extra: {
          topic: args.basePlan.goal,
          personaId: args.personaId ?? "default",
          context: buildDebateContext({
            patch,
            telemetrySummary,
            knowledgeHints: args.knowledgeHints,
            plannerPrompt,
          }),
          budgets: { max_rounds: 4, max_wall_ms: 15000 },
          debateTriggers,
        },
      });
      nodes.push({
        id: nextId(),
        kind: "CALL",
        tool: narrationTool,
        summaryRef: summaryId,
        promptTemplate: buildDebateNarrationPrompt({
          goal: args.basePlan.goal,
          resonancePatch: patch,
          telemetrySummary,
          verdictFromStepId: debateStepId,
          keyTurns: [],
        }),
        extra: {
          narrationKind: "debate",
          verdictFrom: debateStepId,
          debateTriggers,
          useDebate: true,
        },
      });
    } else {
      const fallbackCall = baseNodes.find((node) => node.kind === "CALL");
      if (fallbackCall) {
        nodes.push({ ...fallbackCall, id: nextId(), summaryRef: summaryId });
      }
      nodes.push({
        id: nextId(),
        kind: "CALL",
        tool: narrationTool,
        summaryRef: summaryId,
        promptTemplate: buildDirectNarrationPrompt({
          goal: args.basePlan.goal,
          resonancePatch: patch,
          telemetrySummary,
        }),
        extra: { narrationKind: "direct" },
      });
    }
    const planDsl = formatPlanDsl(nodes);
    candidates.push({
      patch,
      knowledgeContext,
      plannerPrompt,
      nodes,
      planDsl,
    });
  }
  return candidates;
}

function maybeInjectSpecialists(goal: string, planSteps: PlanNode[]): PlanNode[] {
  if (process.env.ENABLE_SPECIALISTS !== "1" || planSteps.some((node) => node.kind === "SOLVE")) {
    return planSteps;
  }
  const normalized = goal.toLowerCase();
  const mathPattern = /\b(compute|simplify|solve|calculate|derivative|integral|sum|equation|what is)\b/;
  const inlineMath = /[-+*/=()\d\s]{4,}/;
  const isMath = mathPattern.test(normalized) || inlineMath.test(goal);
  if (!isMath) {
    return planSteps;
  }
  const lastSummary = [...planSteps].reverse().find((node) => node.kind === "SUMMARIZE");
  const summaryRef = lastSummary?.id;
  const base = planSteps.length + 1;
  const solveId = `s${base}`;
  const verifyId = `s${base + 1}`;
  const expr = goal.replace(/^.*?:/, "").trim() || goal.trim();
  const verifyName = process.env.ENABLE_SYMPY_VERIFIER === "1" ? "math.sympy.verify" : "math.sum.verify";
  return [
    ...planSteps,
    {
      id: solveId,
      kind: "SOLVE",
      solver: "math.expr",
      summaryRef,
      params: { expr },
    },
    {
      id: verifyId,
      kind: "VERIFY",
      source: solveId,
      verifier: verifyName,
    },
  ];
}

export function buildChatBPlan(args: BuildPlanArgs): { nodes: PlanNode[]; planDsl: string } {
  const topK = clamp(args.topK ?? 5, 1, 10);
  const summaryFocus = args.summaryFocus?.trim() || DEFAULT_SUMMARY_FOCUS;
  const nodes: PlanNode[] = [];
  let step = 1;
  nodes.push({
    id: `s${step++}`,
    kind: "SEARCH",
    query: args.searchQuery,
    topK,
    target: "memory",
    note: `Ground goal "${args.goal}" with Essence memories`,
  });
  nodes.push({ id: `s${step++}`, kind: "SUMMARIZE", source: "s1", focus: summaryFocus });

  if (process.env.ENABLE_DEBATE === "1") {
    nodes.push({
      id: `s${step++}`,
      kind: "CALL",
      tool: "telemetry.badges.read",
      summaryRef: "s2",
      promptTemplate: "Collect badge telemetry to ground debate context.",
    });
    nodes.push({
      id: `s${step++}`,
      kind: "CALL",
      tool: "debate.checklist.generate",
      summaryRef: "s2",
      promptTemplate: "Create falsifiability checklist for the operator goal.",
      extra: {
        goal: args.goal,
        frames: { observer: "operator", timescale: "session", domain: "casimir" },
        sources: DEFAULT_DEBATE_ATTACHMENTS.map((att) => att.url),
      },
    });
  }

  nodes.push({
    id: `s${step++}`,
    kind: "CALL",
    tool: args.finalTool,
    summaryRef: "s2",
    promptTemplate: [
      "You are Chat B, compiling an actionable response.",
      "Persona: {{persona}}",
      "Goal: {{goal}}",
      "Grounded context:",
      "{{summary}}",
      "Return the next concrete action or answer with provenance notes when possible.",
    ].join("\n"),
  });

  const enriched = maybeInjectSpecialists(args.goal, nodes);
  return { nodes: enriched, planDsl: formatPlanDsl(enriched) };
}

export function compilePlan(nodes: PlanNode[]): ExecutorStep[] {
  return nodes.map((node): ExecutorStep => {
    switch (node.kind) {
      case "SEARCH":
        return { id: node.id, kind: "memory.search", query: node.query, topK: node.topK };
      case "SUMMARIZE":
        return { id: node.id, kind: "summary.compose", source: node.source, focus: node.focus };
      case "CALL":
        if (node.tool === "debate.run") {
          const extra = (node.extra ?? {}) as {
            topic?: string;
            personaId?: string;
            context?: Record<string, unknown>;
            budgets?: { max_rounds?: number; max_wall_ms?: number };
            debateTriggers?: string[];
          };
          return {
            id: node.id,
            kind: "debate.run",
            tool: "debate.run",
            topic: extra.topic,
            personaId: extra.personaId,
            summaryRef: node.summaryRef,
            context: extra.context,
            budgets: extra.budgets,
            debateTriggers: extra.debateTriggers,
          };
        }
        return {
          id: node.id,
          kind: "tool.call",
          tool: node.tool,
          summaryRef: node.summaryRef,
          promptTemplate: node.promptTemplate,
          extra: node.extra,
        };
      case "SOLVE":
        return {
          id: node.id,
          kind: "specialist.run",
          solver: node.solver,
          summaryRef: node.summaryRef,
          verifier: node.verifier,
          params: node.params,
          repair: node.repair,
        };
      case "VERIFY":
        return { id: node.id, kind: "specialist.verify", source: node.source, verifier: node.verifier };
      case "DEBATE_START":
      case "DEBATE.START":
        return { id: node.id, kind: "debate.start", topic: node.topic, summaryRef: node.summaryRef };
      case "DEBATE_CONSUME":
      case "DEBATE.CONSUME":
        return { id: node.id, kind: "debate.consume", source: node.source };
      default:
        throw new Error(`Unsupported planner node: ${(node as { kind: string }).kind}`);
    }
  });
}

export async function executeCompiledPlan(steps: ExecutorStep[], runtime: ExecutionRuntime): Promise<ExecutionResult[]> {
  const sessionId = runtime.sessionId ?? runtime.goal;
  const budgetBytes = Number(process.env.KV_BUDGET_BYTES ?? DEFAULT_KV_BUDGET_BYTES);
  runtime.debateId = runtime.debateId ?? runtime.taskTrace?.debate_id ?? null;
  runtime.debateOutcome = runtime.debateOutcome ?? null;
  runtime.telemetrySummary = runtime.telemetrySummary ?? runtime.taskTrace?.telemetry_summary ?? null;
  runtime.resonanceBundle = runtime.resonanceBundle ?? runtime.taskTrace?.resonance_bundle ?? null;
  runtime.resonanceSelection = runtime.resonanceSelection ?? runtime.taskTrace?.resonance_selection ?? null;
  runtime.plannerPrompt = runtime.plannerPrompt ?? runtime.taskTrace?.planner_prompt ?? null;
  const outputs = new Map<string, unknown>();
  const citationsByStep = new Map<string, string[]>();
  const results: ExecutionResult[] = [];

  for (const step of steps) {
    const stepStart = Date.now();
    let stepEssenceIds: string[] = [];
    try {
      let output: unknown;
      let citations: string[] = [];
      if (step.kind === "memory.search") {
        const hits = await searchMemories(step.query, step.topK);
        output = hits;
        citations = hits.map((hit) => hit.id);
      } else if (step.kind === "summary.compose") {
        const source = outputs.get(step.source);
        const hits = Array.isArray(source) ? (source as TMemorySearchHit[]) : [];
        output = summarizeHits(hits, step.focus, runtime.goal);
        const inherited = citationsByStep.get(step.source) ?? [];
        citations = inherited.length > 0 ? [...inherited] : [step.source];
      } else if (step.kind === "debate.start") {
        const summary = step.summaryRef ? outputs.get(step.summaryRef) : undefined;
        const summaryText = typeof summary === "string" && summary.trim() ? summary.trim() : runtime.goal;
        const topic = step.topic || summaryText || runtime.goal;
        const contextBase = {
          resonance_patch: runtime.resonanceSelection ?? runtime.resonanceBundle,
          telemetry_summary: runtime.telemetrySummary,
          knowledge_hints: runtime.knowledgeHints,
          attachments: DEFAULT_DEBATE_ATTACHMENTS,
          planner_prompt: runtime.plannerPrompt ?? runtime.taskTrace?.planner_prompt,
        };
        const context = { ...contextBase, attachments: normalizeDebateAttachments(contextBase.attachments) };
        const budgets = {
          max_rounds: Number(process.env.DEBATE_MAX_ROUNDS ?? NaN),
          max_wall_ms: Number(process.env.DEBATE_MAX_WALL_MS ?? NaN),
        };
        const config = DebateConfig.parse({
          goal: topic,
          persona_id: runtime.personaId ?? "default",
          max_rounds: Number.isFinite(budgets.max_rounds) ? budgets.max_rounds : undefined,
          max_wall_ms: Number.isFinite(budgets.max_wall_ms) ? budgets.max_wall_ms : undefined,
          context,
        });
        const toolStart = Date.now();
        const debateStart = await startDebate(config as any);
        const debateId: string = debateStart.debateId;
        runtime.debateId = debateId;
        runtime.debateOutcome = null;
        if (runtime.taskTrace) {
          runtime.taskTrace.debate_id = debateId;
        }
        appendToolLog({
          tool: "debate.start",
          version: "orchestrator",
          paramsHash: hashPayload(config),
          promptHash: hashText(topic),
          durationMs: Date.now() - toolStart,
          sessionId,
          traceId: runtime.taskTrace?.id ?? sessionId,
          stepId: step.id,
          ok: true,
          text: `debate started (${debateId})`,
          essenceId: undefined,
          seed: undefined,
          debateId,
        });
        output = { debateId, goal: topic };
        citations = [];
      } else if (step.kind === "debate.consume") {
        const prior = outputs.get(step.source) as { debateId?: string } | undefined;
        const debateId: string | null =
          runtime.debateId ?? prior?.debateId ?? (runtime.taskTrace?.debate_id as string | null) ?? null;
        if (!debateId) {
          throw new Error("debate id missing");
        }
        const outcome = await waitForDebateOutcome(debateId);
        runtime.debateId = debateId;
        runtime.debateOutcome = outcome ?? null;
        if (runtime.taskTrace) {
          runtime.taskTrace.debate_id = debateId;
        }
        const duration = Date.now() - stepStart;
        appendToolLog({
          tool: "debate.consume",
          version: "orchestrator",
          paramsHash: hashPayload({ debateId }),
          promptHash: debateId,
          durationMs: duration,
          sessionId,
          traceId: runtime.taskTrace?.id ?? sessionId,
          stepId: step.id,
          ok: Boolean(outcome),
          text: outcome ? `debate verdict: ${outcome.verdict}` : "debate verdict pending",
          essenceId: undefined,
          seed: undefined,
          debateId,
        });
        output = { debateId, outcome: outcome ?? null };
        citations = outcome?.key_turn_ids ?? [];
      } else if (step.kind === "debate.run") {
        const tool = getTool(step.tool);
        if (!tool) {
          throw new Error(`Tool "${step.tool}" is not registered.`);
        }
        await ensureToolApprovals(tool, runtime);
        const summary = step.summaryRef ? outputs.get(step.summaryRef) : undefined;
        const summaryText = formatSummaryForPrompt(summary);
        const topic = (step.topic ?? "").trim() || summaryText || runtime.goal;
        const rawContext = step.context ?? {};
        const context = {
          ...rawContext,
          planner_prompt:
            (rawContext as { planner_prompt?: string }).planner_prompt ??
            runtime.plannerPrompt ??
            runtime.taskTrace?.planner_prompt,
          telemetry_summary:
            (rawContext as { telemetry_summary?: string | null }).telemetry_summary ?? runtime.telemetrySummary,
          knowledge_hints: (rawContext as { knowledge_hints?: string[] }).knowledge_hints ?? runtime.knowledgeHints,
          resonance_patch:
            (rawContext as { resonance_patch?: unknown }).resonance_patch ??
            runtime.resonanceSelection ??
            runtime.resonanceBundle,
        };
        const contextWithAttachments = {
          ...context,
          attachments: normalizeDebateAttachments(
            (context as { attachments?: Array<{ title?: string; url?: string }> }).attachments,
          ),
        };
        const input = {
          topic,
          personaId: step.personaId ?? runtime.personaId ?? "default",
          context: contextWithAttachments,
          budgets: step.budgets,
        };
        const paramsHash = hashPayload(input);
        const toolStart = Date.now();
        let toolError: unknown;
        let result: any;
        let essenceId: string | undefined;
        try {
          result = await tool.handler(input, {
            sessionId,
            goal: runtime.goal,
            personaId: runtime.personaId ?? "default",
          });
          essenceId = extractEssenceId(result);
        } catch (err) {
          toolError = err;
        } finally {
          const duration = Date.now() - toolStart;
          const ok = !toolError;
          metrics.recordTool(step.tool, duration, ok);
          const logDebateId =
            result && typeof result === "object"
              ? ((result as { debateId?: string; debate_id?: string }).debateId ??
                (result as { debate_id?: string }).debate_id)
              : undefined;
          appendToolLog({
            tool: step.tool,
            version: (tool as any).version ?? "unknown",
            paramsHash,
            promptHash: paramsHash,
            seed: (input as { seed?: unknown }).seed,
            sessionId,
            traceId: runtime.taskTrace?.id ?? sessionId,
            durationMs: duration,
            ok,
            error: toolError ? formatToolError(toolError) : undefined,
            essenceId,
            stepId: step.id,
            debateId: logDebateId,
          });
        }
        if (toolError) {
          throw toolError;
        }
        const debateId =
          (result as { debateId?: string; debate_id?: string }).debateId ?? (result as { debate_id?: string }).debate_id ?? null;
        const confidenceRaw = (result as { confidence?: number }).confidence;
        const confidence = Number.isFinite(confidenceRaw ?? NaN) ? Number(confidenceRaw) : 0;
        const keyTurnIds = Array.isArray((result as { key_turn_ids?: string[] }).key_turn_ids)
          ? ((result as { key_turn_ids?: string[] }).key_turn_ids ?? []).filter((id) => typeof id === "string")
          : [];
        const verdict = (result as { verdict?: string }).verdict ?? "unknown";
        output = { debateId, verdict, confidence, key_turn_ids: keyTurnIds };
        citations = keyTurnIds;
        const debateOutcome: TDebateOutcome = {
          debate_id: debateId ?? runtime.debateId ?? step.id,
          verdict,
          confidence,
          winning_role: (result as { winning_role?: TDebateOutcome["winning_role"] }).winning_role,
          key_turn_ids: keyTurnIds,
          created_at: new Date().toISOString(),
        };
        if (essenceId) {
          stepEssenceIds = [essenceId];
        }
        runtime.debateId = debateOutcome.debate_id;
        runtime.debateOutcome = debateOutcome;
        if (runtime.taskTrace) {
          runtime.taskTrace.debate_id = debateOutcome.debate_id;
        }
      } else if (step.kind === "tool.call") {
        const tool = getTool(step.tool);
        if (!tool) {
          throw new Error(`Tool "${step.tool}" is not registered.`);
        }
        await ensureToolApprovals(tool, runtime);
        const summary = step.summaryRef ? outputs.get(step.summaryRef) : undefined;
        const summaryText = formatSummaryForPrompt(summary);
        const telemetrySummary = runtime.telemetrySummary ?? runtime.taskTrace?.telemetry_summary ?? null;
        const resonanceBundle = runtime.resonanceBundle ?? runtime.taskTrace?.resonance_bundle ?? null;
        const resonanceSelection =
          runtime.resonanceSelection ?? runtime.taskTrace?.resonance_selection ?? null;
        const patchForPrompt = pickPatchForSection({
          bundle: resonanceBundle,
          selection: resonanceSelection,
          preferredPatchId: resonanceSelection?.primaryPatchId,
        });
        let promptTemplate = step.promptTemplate;
        const narrationKind = (step.extra as { narrationKind?: string | null } | undefined)?.narrationKind;
        const verdictFrom = (step.extra as { verdictFrom?: string | null } | undefined)?.verdictFrom;
        if (narrationKind === "debate") {
          promptTemplate = buildDebateNarrationPrompt({
            goal: runtime.goal,
            resonancePatch: patchForPrompt ?? undefined,
            telemetrySummary,
            verdictFromStepId: verdictFrom ?? undefined,
            keyTurns: runtime.debateOutcome?.key_turn_ids ?? [],
          });
        } else if (narrationKind === "direct") {
          promptTemplate = buildDirectNarrationPrompt({
            goal: runtime.goal,
            resonancePatch: patchForPrompt ?? undefined,
            telemetrySummary,
          });
        }
        const appendixHeading = formatKnowledgeHeading("Attached knowledge", runtime.knowledgeHints);
        const appendix = composeKnowledgeAppendix({
          goal: runtime.goal,
          summary: summaryText,
          knowledgeContext: runtime.knowledgeContext,
          maxChars: 1200,
          maxSnippets: 3,
          heading: appendixHeading,
        });
        const debateNote = formatDebateNote(runtime.debateOutcome, runtime.debateId);
        const promptBase = renderTemplate(promptTemplate, {
          goal: runtime.goal,
          persona: runtime.personaId ?? "default",
          summary: summaryText,
          debate: debateNote ?? "",
        });
        const resonanceSection = composeResonancePatchSection({
          bundle: resonanceBundle,
          selection: resonanceSelection,
          preferredPatchId: resonanceSelection?.primaryPatchId,
        });
        const sections: string[] = [];
        if (resonanceSection) {
          sections.push(resonanceSection);
        }
        if (appendix.text) {
          sections.push(appendix.text);
        }
        sections.push(promptBase);
        if (telemetrySummary) {
          sections.push(`[Panel snapshot]\n${telemetrySummary}`);
        }
        if (debateNote && step.extra?.useDebate) {
          sections.push(debateNote);
        }
        const prompt = sections.filter(Boolean).join("\n\n");
        const promptHash = hashText(prompt);
        const isNarrationCall = narrationKind === "debate" || narrationKind === "direct";
        const sealedContext = isNarrationCall
          ? {
              telemetry_summary: telemetrySummary,
              resonance_patch: patchForPrompt ?? null,
              debate_outcome: runtime.debateOutcome
                ? {
                    debate_id: runtime.debateOutcome.debate_id ?? runtime.debateId ?? null,
                    verdict: runtime.debateOutcome.verdict,
                    confidence: runtime.debateOutcome.confidence,
                    key_turn_ids: runtime.debateOutcome.key_turn_ids ?? [],
                  }
                : null,
            }
          : null;
        const input: Record<string, unknown> = { ...(step.extra ?? {}), prompt };
        if (sealedContext?.telemetry_summary !== null && sealedContext?.telemetry_summary !== undefined) {
          input.telemetry_summary = sealedContext.telemetry_summary;
        }
        if (sealedContext?.resonance_patch) {
          input.resonance_patch = sealedContext.resonance_patch;
        }
        if (sealedContext?.debate_outcome) {
          input.debate_outcome = sealedContext.debate_outcome;
        }
        if (sealedContext) {
          input.sealed_context = sealedContext;
        }
        if (runtime.knowledgeContext && runtime.knowledgeContext.length > 0) {
          input.knowledgeContext = runtime.knowledgeContext;
        }
        if (runtime.taskTrace) {
          runtime.taskTrace.prompt_hash = promptHash;
        }
        const toolStart = Date.now();
        const paramsHash = hashPayload(input);
        let toolError: unknown;
        let essenceId: string | undefined;
        try {
          output = await tool.handler(input, {
            sessionId,
            goal: runtime.goal,
            personaId: runtime.personaId ?? "default",
          });
          essenceId = extractEssenceId(output);
          if (step.tool === "debate.run" && output && typeof output === "object") {
            const verdict = output as {
              debateId?: string;
              debate_id?: string;
              verdict?: string;
              confidence?: number;
              key_turn_ids?: string[];
              winning_role?: TDebateOutcome["winning_role"];
            };
            const debateOutcome: TDebateOutcome = {
              debate_id: verdict.debate_id ?? verdict.debateId ?? runtime.debateId ?? step.id,
              verdict: verdict.verdict ?? "unknown",
              confidence: typeof verdict.confidence === "number" ? verdict.confidence : 0,
              winning_role: verdict.winning_role,
              key_turn_ids: verdict.key_turn_ids ?? [],
              created_at: new Date().toISOString(),
            };
            runtime.debateId = debateOutcome.debate_id;
            runtime.debateOutcome = debateOutcome;
            if (runtime.taskTrace) {
              runtime.taskTrace.debate_id = debateOutcome.debate_id;
            }
          }
        } catch (err) {
          toolError = err;
          throw err;
        } finally {
          const toolDuration = Date.now() - toolStart;
          const ok = !toolError;
          metrics.recordTool(step.tool, toolDuration, ok);
          appendToolLog({
            tool: step.tool,
            version: (tool as any).version ?? "unknown",
            paramsHash,
            seed: (input as { seed?: unknown }).seed,
            sessionId,
            traceId: runtime.taskTrace?.id ?? sessionId,
            durationMs: toolDuration,
            promptHash,
            ok,
            error: toolError ? formatToolError(toolError) : undefined,
            essenceId,
            stepId: step.id,
          });
        }
        const debateCitations =
          step.tool === "debate.run" && runtime.debateOutcome?.key_turn_ids?.length
            ? runtime.debateOutcome.key_turn_ids
            : [];
        citations = step.summaryRef ? [...(citationsByStep.get(step.summaryRef) ?? [])] : [];
        if (debateCitations.length > 0) {
          const citeSet = new Set([...citations, ...debateCitations]);
          citations = Array.from(citeSet);
        }
        if (appendix.citations.length > 0) {
          const citeSet = new Set(citations);
          for (const cite of appendix.citations) {
            citeSet.add(cite);
          }
          citations = Array.from(citeSet);
        }
        if (essenceId) {
          stepEssenceIds = [essenceId];
        }
      } else if (step.kind === "specialist.run") {
        const summary = step.summaryRef ? outputs.get(step.summaryRef) : undefined;
        const summaryCitations = step.summaryRef ? citationsByStep.get(step.summaryRef) ?? [] : [];
        const problem = buildSpecialistProblem(runtime, step.id, step.summaryRef, summary, summaryCitations);
        const personaId = runtime.personaId ?? "default";
        const traceId = runtime.taskTrace?.id ?? runtime.sessionId ?? runtime.goal;
        const plan = {
          solver: step.solver,
          verifier: step.verifier,
          params: step.params,
          repair: step.repair,
        };
        const result = await runSpecialistPlan(plan, problem, { personaId, traceId, stepId: step.id });
        output = result;
        citations = result.solver_output.essence_ids ?? [];
        stepEssenceIds = citations.length > 0 ? [...citations] : [];
      } else if (step.kind === "specialist.verify") {
        const prior = outputs.get(step.source);
        if (!prior || typeof prior !== "object") {
          throw new Error(`specialist verify requires output from ${step.source}`);
        }
        const specialist = prior as SpecialistRunResult;
        const personaId = runtime.personaId ?? "default";
        const traceId = runtime.taskTrace?.id ?? runtime.sessionId ?? runtime.goal;
        const check = await runVerifierOnly(step.verifier, specialist.problem, specialist.solver_output, {
          personaId,
          traceId,
          stepId: step.id,
        });
        output = check;
        citations = specialist.solver_output.essence_ids ?? [];
        stepEssenceIds = citations.length > 0 ? [...citations] : [];
      } else {
        const kind = (step as { kind: string }).kind;
        throw new Error(`Unknown executor step kind: ${kind}`);
      }
      outputs.set(step.id, output);
      citationsByStep.set(step.id, citations);
      const stepOk = evaluateStepSuccess(step, output);
      const latencyMs = Date.now() - stepStart;
      const entry: ExecutionResult = stepOk
        ? { id: step.id, kind: step.kind, ok: true, output, citations, latency_ms: latencyMs, essence_ids: stepEssenceIds }
        : { id: step.id, kind: step.kind, ok: false, output, citations, latency_ms: latencyMs, essence_ids: stepEssenceIds };
      results.push(entry);
      await recordKvUsage({
        sessionId,
        runtime,
        step,
        output,
        citations,
        budgetBytes,
      });
      if (!stepOk) {
        break;
      }
    } catch (error) {
      const executionError = normalizeExecutionError(error);
      results.push({
        id: step.id,
        kind: step.kind,
        ok: false,
        error: executionError,
        citations: [],
        latency_ms: Date.now() - stepStart,
        essence_ids: stepEssenceIds,
      });
      break;
    }
  }

  // Minimal knowledge-citation verifier and one-shot repair
  try {
    const attachments = runtime.knowledgeContext ?? [];
    if (process.env.ENABLE_KNOWLEDGE_CITATION_VERIFY === "1" && attachments.length > 0 && results.length > 0) {
      const final = results[results.length - 1];
      const readable = final.ok ? pickReadableText(final.output) : undefined;
      if (readable) {
        const { extractCitations, verifyCitations } = await import("../knowledge/citations");
        const verdict = verifyCitations(attachments as any[], extractCitations(readable));
        if (!verdict.pass) {
          const lastCall = [...steps].reverse().find((s) => s.kind === "tool.call");
          if (lastCall && lastCall.kind === "tool.call") {
            const tool = getTool(lastCall.tool);
            if (tool) {
              const hint =
                `Please revise the answer and include explicit citations to the attached knowledge files in the form [project:<slug>/file:<name>]. Missing examples: ${verdict.missing.join(", ")}`;
              const summaryVal = lastCall.summaryRef ? outputs.get(lastCall.summaryRef) : undefined;
              const summaryText = formatSummaryForPrompt(summaryVal);
              const knowledgeHeading = formatKnowledgeHeading("Attached knowledge", runtime.knowledgeHints);
              const appendix = composeKnowledgeAppendix({
                goal: runtime.goal,
                summary: summaryText,
                knowledgeContext: attachments,
                maxChars: 1200,
                maxSnippets: 3,
                heading: knowledgeHeading,
              });
              const debateNote = formatDebateNote(runtime.debateOutcome, runtime.debateId);
              const promptBase = renderTemplate(`${lastCall.promptTemplate}\n\n${hint}`, {
                goal: runtime.goal,
                persona: runtime.personaId ?? "default",
                summary: summaryText,
                debate: debateNote ?? "",
              });
              const resonanceSection = composeResonancePatchSection({
                bundle: runtime.resonanceBundle,
                selection: runtime.resonanceSelection,
                preferredPatchId: runtime.resonanceSelection?.primaryPatchId,
              });
              const sections: string[] = [];
              if (resonanceSection) {
                sections.push(resonanceSection);
              }
              if (appendix.text) {
                sections.push(appendix.text);
              }
              sections.push(promptBase);
              if (runtime.telemetrySummary) {
                sections.push(`[Panel snapshot]\n${runtime.telemetrySummary}`);
              }
              if (debateNote && (lastCall.extra as { useDebate?: boolean } | undefined)?.useDebate) {
                sections.push(debateNote);
              }
              const prompt = sections.filter(Boolean).join("\n\n");
              const promptHash = hashText(prompt);
              const input: Record<string, unknown> = { ...(lastCall.extra ?? {}), prompt };
              if (attachments.length > 0) {
                input.knowledgeContext = attachments;
              }
              if (runtime.taskTrace) {
                runtime.taskTrace.prompt_hash = promptHash;
              }
              const toolStart = Date.now();
              let toolError: unknown;
              let essenceId: string | undefined;
              let output: unknown;
              try {
                output = await tool.handler(input, {
                  sessionId,
                  goal: runtime.goal,
                  personaId: runtime.personaId ?? "default",
                });
                essenceId = extractEssenceId(output);
              } catch (err) {
                toolError = err;
              } finally {
                const toolDuration = Date.now() - toolStart;
                const ok = !toolError;
                metrics.recordTool(lastCall.tool, toolDuration, ok);
                appendToolLog({
                  tool: lastCall.tool,
                  version: (tool as any).version ?? "unknown",
                  paramsHash: hashPayload(input),
                  promptHash,
                  seed: (input as { seed?: unknown }).seed,
                  sessionId,
                  traceId: runtime.taskTrace?.id ?? sessionId,
                  durationMs: toolDuration,
                  ok,
                  error: toolError ? formatToolError(toolError) : undefined,
                  essenceId,
                  stepId: `${lastCall.id}.citation`,
                });
              }
              const stepOk = toolError ? false : evaluateStepSuccess(lastCall, output);
              const inherited = lastCall.summaryRef ? citationsByStep.get(lastCall.summaryRef) ?? [] : [];
              const mergedCitations =
                appendix.citations.length > 0 ? Array.from(new Set([...inherited, ...appendix.citations])) : inherited;
              const entry: ExecutionResult = stepOk
                ? {
                    id: `${lastCall.id}.citation`,
                    kind: lastCall.kind,
                    ok: true,
                    output,
                    citations: mergedCitations,
                    latency_ms: 0,
                    essence_ids: [],
                  }
                : {
                    id: `${lastCall.id}.citation`,
                    kind: lastCall.kind,
                    ok: false,
                    output,
                    error: toolError ? normalizeExecutionError(toolError) : undefined,
                    citations: [],
                    latency_ms: 0,
                    essence_ids: [],
                  };
              results.push(entry);
            }
          }
        }
      }
    }
  } catch {
    // citation repair is best-effort; ignore failures
  }

  recordTaskTraceResults(runtime.taskTrace, results);
  const success = results.length > 0 && results.every((step) => step.ok);
  recordTaskOutcome(success);
  if (process.env.ENABLE_REFLECTION === "1" && runtime.taskTrace) {
    const personaId = runtime.personaId ?? runtime.taskTrace.persona_id ?? "default";
    const summary = runtime.taskTrace.result_summary ?? summarizeExecutionResults(results);
    try {
      const { writeTaskReflection } = await import("../learning/reflect");
      await writeTaskReflection(runtime.taskTrace, summary, personaId);
    } catch (err) {
      console.warn("[planner] reflection failed", err);
    }
  }
  return results;
}

const extractEssenceId = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = extractEssenceId(entry);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  }
  if (typeof value === "object") {
    const candidate = ((value as { essence_id?: string; essenceId?: string }).essence_id ??
      (value as { essenceId?: string }).essenceId)?.trim();
    if (candidate) {
      return candidate;
    }
    const output = (value as { output?: unknown }).output;
    if (output) {
      const nested = extractEssenceId(output);
      if (nested) {
        return nested;
      }
    }
    const artifacts = (value as { artifacts?: unknown }).artifacts;
    if (artifacts) {
      return extractEssenceId(artifacts);
    }
  }
  return undefined;
};

function normalizeExecutionError(error: unknown): ExecutionError {
  if (!error) {
    return { message: "Unknown planner execution error." };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error instanceof Error) {
    const typed = error as PlannerPolicyError;
    return {
      message: typed.message || "Planner execution error",
      type: typed.type,
      policy: typed.policy,
    };
  }
  if (typeof error === "object") {
    const maybe = error as { message?: string; type?: string; policy?: ExecutionErrorPolicy };
    return {
      message:
        typeof maybe.message === "string" && maybe.message.length > 0
          ? maybe.message
          : "Planner execution error",
      type: typeof maybe.type === "string" ? maybe.type : undefined,
      policy: maybe.policy && typeof maybe.policy === "object" ? maybe.policy : undefined,
    };
  }
  return { message: String(error) };
}

function describeExecutionError(error?: ExecutionError | string): string {
  if (!error) {
    return "Unknown planner execution error.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error.policy?.reason) {
    return `${error.message} (${error.policy.reason})`;
  }
  return error.message;
}

const RISK_REASONS: Record<ToolRiskType, string> = {
  writes_files: "Tool can write or persist files/envelopes on disk.",
  network_access: "Tool can initiate outbound network requests.",
};

async function ensureToolApprovals(tool: Tool, runtime: ExecutionRuntime): Promise<void> {
  const risks = tool.safety?.risks ?? [];
  if (risks.length === 0) {
    return;
  }
  const personaId = runtime.personaId ?? "default";
  const sessionId = runtime.sessionId ?? personaId;
  for (const capability of risks) {
    const alreadyApproved =
      runtime.taskTrace?.approvals?.some((entry) => entry.tool === tool.name && entry.capability === capability) ?? false;
    if (alreadyApproved) {
      continue;
    }
    const reason = buildApprovalReason(capability, tool);
    const request: ApprovalRequest = {
      tool,
      capability,
      reason,
      sessionId,
      personaId,
      goal: runtime.goal,
    };
    const decision = (await runtime.requestApproval?.(request)) ?? { granted: true, grantedBy: "system" };
    if (!decision.granted) {
      const denial = (decision.reason ?? decision.message)?.trim() || reason;
      const error = new Error(decision.message ?? `Approval denied for ${tool.name} (${capability}).`) as PlannerPolicyError;
      error.name = "ApprovalDeniedError";
      error.type = "approval_denied";
      error.policy = {
        reason: denial,
        tool: tool.name,
        capability,
        risks: risks,
      };
      throw error;
    }
    if (runtime.taskTrace) {
      const approvalEntry: TTaskApproval = {
        id: `approval-${randomUUID()}`,
        tool: tool.name,
        capability,
        granted_at: new Date().toISOString(),
        granted_by: decision.grantedBy ?? "system",
        reason,
        notes: decision.notes ?? tool.safety?.approvalNotes,
      };
      runtime.taskTrace.approvals.push(approvalEntry);
    }
  }
}

function buildApprovalReason(capability: ToolRiskType, tool: Tool): string {
  const base = RISK_REASONS[capability] ?? "Tool requires approval.";
  const notes = tool.safety?.approvalNotes?.trim();
  if (notes) {
    return `${base} ${notes}`;
  }
  return base;
}

function recordTaskTraceResults(taskTrace: TTaskTrace | undefined, results: ExecutionResult[]): void {
  if (!taskTrace) {
    return;
  }
  taskTrace.steps = results;
  const ok = results.length > 0 && results.every((step) => step.ok);
  taskTrace.ok = ok;
  taskTrace.result_summary = summarizeExecutionResults(results);
}

export function summarizeExecutionResults(results: ExecutionResult[]): string {
  if (results.length === 0) {
    return "No steps executed.";
  }
  const failure = results.find(isFailedResult);
  if (failure) {
    if (failure.kind === "tool.call") {
      return `Failed at ${failure.id}: ${describeExecutionError(failure.error)}`;
    }
    if (failure.kind === "specialist.run" && failure.output && typeof failure.output === "object") {
      const reason = ((failure.output as SpecialistRunResult).check?.reason ?? "specialist plan failed").trim();
      return `Failed at ${failure.id}: ${reason}`;
    }
    if (failure.kind === "specialist.verify" && failure.output && typeof failure.output === "object") {
      const reason = (((failure.output as { reason?: string })?.reason ?? "verification failed")).trim();
      return `Failed at ${failure.id}: ${reason}`;
    }
    if (failure.error) {
      return `Failed at ${failure.id}: ${describeExecutionError(failure.error)}`;
    }
    return `Failed at ${failure.id}`;
  }
  const successCount = results.filter((step) => step.ok).length;
  const final = results[results.length - 1];
  const readable = final.ok ? pickReadableText(final.output) : undefined;
  if (final.ok && readable) {
    return truncate(readable, 1200);
  }
  return `Executed ${successCount}/${results.length} steps successfully.`;
}

export function formatPlanDsl(nodes: PlanNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "SEARCH") {
        return `SEARCH(${JSON.stringify(node.query)},k=${node.topK})`;
      }
      if (node.kind === "SUMMARIZE") {
        return `SUMMARIZE(@${node.source},${JSON.stringify(node.focus)})`;
      }
      if (node.kind === "CALL") {
        return `CALL(${node.tool},{"prompt":...}@${node.summaryRef ?? "none"})`;
      }
      if (node.kind === "SOLVE") {
        const suffix = node.summaryRef ? `,@${node.summaryRef}` : "";
        const verify = node.verifier ? `,verify=${node.verifier}` : "";
        return `SOLVE(${node.solver}${verify}${suffix})`;
      }
      if (node.kind === "VERIFY") {
        return `VERIFY(${node.verifier},@${node.source})`;
      }
      if (node.kind === "DEBATE_START" || node.kind === "DEBATE.START") {
        return `DEBATE.START(${JSON.stringify(node.topic)})`;
      }
      if (node.kind === "DEBATE_CONSUME" || node.kind === "DEBATE.CONSUME") {
        return `DEBATE.CONSUME(@${node.source})`;
      }
      return assertUnreachable(node);
    })
    .join(" -> ");
}

function assertUnreachable(value: never): never {
  throw new Error(`Unhandled plan node kind: ${(value as { kind?: string }).kind ?? "unknown"}`);
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type RecordKvUsageArgs = {
  sessionId: string;
  runtime: ExecutionRuntime;
  step: ExecutorStep;
  output: unknown;
  citations: string[];
  budgetBytes: number;
};

async function recordKvUsage(args: RecordKvUsageArgs): Promise<void> {
  const transcriptText = formatTranscriptBlock(args.step, args.output);
  const content = transcriptText.trim() ? transcriptText : "[no-output]";
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes === 0) {
    return;
  }
  const turnId = randomUUID();
  kvAdd(args.sessionId, turnId, bytes);
  storeTranscriptBlock(args.sessionId, {
    turnId,
    stepId: args.step.id,
    kind: args.step.kind,
    text: content,
    bytes,
    citations: args.citations,
    createdAt: new Date().toISOString(),
  });

  if (!kvBudgetExceeded(args.sessionId, args.budgetBytes)) {
    return;
  }

  const evictedTurnIds = kvEvictOldest(args.sessionId, args.budgetBytes);
  if (evictedTurnIds.length === 0) {
    return;
  }
  const evictedBlocks = drainTranscriptBlocks(args.sessionId, evictedTurnIds);
  if (evictedBlocks.length === 0) {
    return;
  }
  await summarizeEvictedBlocks(args.sessionId, args.runtime, evictedBlocks);
}

function storeTranscriptBlock(sessionId: string, block: TranscriptBlock): void {
  let bucket = transcriptStore.get(sessionId);
  if (!bucket) {
    bucket = new Map();
    transcriptStore.set(sessionId, bucket);
  }
  bucket.set(block.turnId, block);
}

function drainTranscriptBlocks(sessionId: string, turnIds: string[]): TranscriptBlock[] {
  const bucket = transcriptStore.get(sessionId);
  if (!bucket) {
    return [];
  }
  const collected: TranscriptBlock[] = [];
  for (const turnId of turnIds) {
    const block = bucket.get(turnId);
    if (block) {
      collected.push(block);
      bucket.delete(turnId);
    }
  }
  if (bucket.size === 0) {
    transcriptStore.delete(sessionId);
  }
  return collected;
}

function formatTranscriptBlock(step: ExecutorStep, output: unknown): string {
  if (step.kind === "memory.search") {
    const hits = Array.isArray(output) ? (output as TMemorySearchHit[]) : [];
    const topHits = hits.slice(0, 4).map((hit) => {
      const detail = hit.snippet?.trim() || hit.keys.join(", ") || hit.id;
      return `- ${detail} [${hit.id}]`;
    });
    return [`Search "${step.query}" (k=${step.topK})`, ...topHits].join("\n");
  }
  if (step.kind === "tool.call") {
    if (typeof output === "string") {
      return output;
    }
    if (output && typeof output === "object" && typeof (output as any).text === "string") {
      return (output as { text: string }).text;
    }
  }
  if (step.kind === "summary.compose" && typeof output === "string") {
    return output;
  }
  if (step.kind === "specialist.run" && output && typeof output === "object") {
    const specialist = output as SpecialistRunResult;
    const lines = [
      `SOLVE ${step.solver}`,
      specialist.solver_output.summary ?? "[no summary]",
      step.verifier ? `${step.verifier}: ${specialist.check.ok ? "ok" : "fail"} ${specialist.check.reason ?? ""}` : "no verifier",
    ];
    return lines.filter(Boolean).join("\n");
  }
  if (step.kind === "specialist.verify" && output && typeof output === "object") {
    const check = output as { ok?: boolean; reason?: string };
    return `VERIFY ${step.verifier}: ${(check.ok ?? false) ? "ok" : "fail"} ${check.reason ?? ""}`.trim();
  }
  if (step.kind === "debate.start" && output && typeof output === "object") {
    const started = output as { debateId?: string };
    return started.debateId ? `Debate started: ${started.debateId}` : "Debate started.";
  }
  if (step.kind === "debate.consume" && output && typeof output === "object") {
    const verdict = (output as { outcome?: TDebateOutcome | null; debateId?: string }).outcome;
    if (verdict) {
      return `Debate verdict (${verdict.debate_id}): ${verdict.verdict} (confidence ${(verdict.confidence * 100).toFixed(1)}%)`;
    }
    const debateId = (output as { debateId?: string }).debateId;
    return debateId ? `Debate outcome pending (${debateId})` : "Debate outcome pending";
  }
  if (step.kind === "debate.run" && output && typeof output === "object") {
    const verdict = (output as { verdict?: string }).verdict ?? "pending";
    const debateId = (output as { debateId?: string }).debateId;
    const confidence = (output as { confidence?: number }).confidence;
    const confidencePct =
      typeof confidence === "number" && Number.isFinite(confidence) ? ` @ ${(confidence * 100).toFixed(1)}%` : "";
    return debateId ? `Debate.run ${debateId}: ${verdict}${confidencePct}` : `Debate.run: ${verdict}${confidencePct}`;
  }
  return safeStringify(output);
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const formatToolError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

async function summarizeEvictedBlocks(
  sessionId: string,
  runtime: ExecutionRuntime,
  blocks: TranscriptBlock[],
): Promise<void> {
  if (blocks.length === 0) {
    return;
  }
  const personaId = runtime.personaId ?? "default";
  const now = new Date().toISOString();
  const summaryLines = blocks.map((block) => {
    const citeSuffix = block.citations.length ? ` (citations: ${block.citations.join(", ")})` : "";
    return `- [${block.stepId}] ${truncate(block.text, 280)}${citeSuffix}`;
  });
  const citationKeys = Array.from(
    new Set(blocks.flatMap((block) => block.citations.filter(Boolean))),
  ).map((cite) => `cite:${cite}`);
  const record: TMemoryRecord = {
    id: `kv-${randomUUID()}`,
    owner_id: personaId,
    created_at: now,
    kind: "episodic",
    text: [`KV eviction summary for session ${sessionId}`, `Goal: ${runtime.goal}`, ...summaryLines].join("\n"),
    keys: ["kv-eviction", `session:${sessionId}`, `goal:${runtime.goal}`, ...citationKeys],
    visibility: "private",
  };
  await putMemoryRecord(record);
}

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
};

export function pickReadableText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (value && typeof value === "object") {
    const payload = value as Record<string, any>;
    const nestedOutput =
      payload.output && typeof payload.output === "object"
        ? ((payload.output as Record<string, any>).text as unknown)
        : undefined;
    const nestedData =
      payload.data && typeof payload.data === "object"
        ? ((payload.data as Record<string, any>).text as unknown)
        : undefined;
    const candidates = [
      payload.excerpt,
      payload.summary,
      payload.text,
      payload.message,
      payload.content,
      nestedOutput,
      nestedData,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }
  return undefined;
}

function summarizeHits(hits: TMemorySearchHit[], focus: string, goal: string): string {
  if (hits.length === 0) {
    return `No stored memories matched the goal "${goal}".`;
  }

  const bullets = hits.slice(0, 3).map((hit) => {
    const detail = hit.snippet || hit.keys.join(", ") || "(keys only)";
    return `- ${detail} [${hit.id}]`;
  });

  return [`Goal: ${goal}`, `Focus: ${focus}`, "Insights:", ...bullets].join("\n");
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(
    /\{\{(goal|persona|summary|debate)\}\}/g,
    (_, key: "goal" | "persona" | "summary" | "debate") => vars[key] ?? "",
  );
}

const limitText = (value: string, cap = 1800): string => {
  if (value.length > cap) {
    return `${value.slice(0, Math.max(0, cap - 3))}...`;
  }
  return value;
};

const formatSummaryForPrompt = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? limitText(trimmed) : "";
  }
  const readable = pickReadableText(value);
  if (readable) {
    return limitText(readable);
  }
  if (value && typeof value === "object") {
    return limitText(safeStringify(value));
  }
  if (value === undefined || value === null) {
    return "";
  }
  return limitText(String(value));
};

function buildSpecialistProblem(
  runtime: ExecutionRuntime,
  stepId: string,
  summaryRef: string | undefined,
  summaryValue: unknown,
  summaryCitations: string[],
): { id: string; persona_id: string; goal: string; context: Record<string, unknown> } {
  const sessionId = runtime.sessionId ?? runtime.goal;
  return {
    id: `${sessionId}:${stepId}`,
    persona_id: runtime.personaId ?? "default",
    goal: runtime.goal,
    context: buildSpecialistContext(summaryRef, summaryValue, summaryCitations),
  };
}

function buildSpecialistContext(
  summaryRef: string | undefined,
  summaryValue: unknown,
  summaryCitations: string[],
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  if (summaryRef) {
    context.summary_ref = summaryRef;
  }
  if (summaryCitations.length > 0) {
    context.citations = summaryCitations;
  }
  if (typeof summaryValue === "string" && summaryValue.trim()) {
    context.summary = summaryValue;
  } else if (summaryValue && typeof summaryValue === "object") {
    context.summary_object = summaryValue;
  }
  return context;
}

function formatDebateNote(outcome?: TDebateOutcome | null, debateId?: string | null): string | null {
  const id = outcome?.debate_id ?? debateId ?? null;
  if (!outcome && !id) {
    return null;
  }
  const lines = ["[Debate verdict]"];
  if (id) {
    lines.push(`debate_id: ${id}`);
  }
  if (outcome) {
    lines.push(`verdict: ${outcome.verdict}`);
    if (outcome.winning_role) {
      lines.push(`winner: ${outcome.winning_role}`);
    }
    lines.push(`confidence: ${(outcome.confidence ?? 0).toFixed(2)}`);
    if (outcome.key_turn_ids?.length) {
      lines.push(`key_turns: ${outcome.key_turn_ids.join(", ")}`);
    }
  } else {
    lines.push("status: pending");
  }
  return lines.join("\n");
}

function evaluateStepSuccess(step: ExecutorStep, output: unknown): boolean {
  if (step.kind === "specialist.run" && output && typeof output === "object") {
    return Boolean((output as SpecialistRunResult).ok);
  }
  if (step.kind === "specialist.verify" && output && typeof output === "object") {
    return Boolean((output as { ok?: boolean }).ok);
  }
  if (step.kind === "debate.run" && output && typeof output === "object") {
    return Boolean((output as { debateId?: string }).debateId);
  }
  if (step.kind === "debate.consume") {
    return true;
  }
  return true;
}

const hashPayload = (payload: unknown): string => {
  try {
    const serialized = JSON.stringify(payload) ?? "";
    return createHash("sha256").update(serialized).digest("hex").slice(0, 16);
  } catch {
    return "na";
  }
};

const hashText = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");
