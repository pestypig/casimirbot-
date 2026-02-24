import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import { BrainCircuit, Search, Square } from "lucide-react";
import { panelRegistry, getPanelDef, type PanelDefinition } from "@/lib/desktop/panelRegistry";
import {
  askLocal,
  askMoodHint,
  getPendingHelixAskJob,
  resumeHelixAskJob,
  speakVoice,
  subscribeToolLogs,
  type AtomicViewerLaunch,
  type PendingHelixAskJob,
  type ToolLogEvent,
} from "@/lib/agi/api";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { classifyMoodFromWhisper } from "@/lib/luma-mood-spectrum";
import { LUMA_MOOD_ORDER, resolveMoodAsset, type LumaMood } from "@/lib/luma-moods";
import { broadcastLumaMood } from "@/lib/luma-mood-theme";
import { reportClientError } from "@/lib/observability/client-error";
import {
  canStartContextSession,
  readMissionContextControls,
  startDesktopTier1ScreenSession,
  stopDesktopTier1ScreenSession,
  writeMissionContextControls,
  type ContextLifecycleEvent,
  type MissionContextControls,
  type MissionContextTier,
  type MissionVoiceMode,
} from "@/lib/mission-overwatch";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { HelixAskResponseEnvelope } from "@shared/helix-ask-envelope";


export type ReadAloudPlaybackState = "idle" | "requesting" | "playing" | "dry-run" | "error";

export function transitionReadAloudState(
  current: ReadAloudPlaybackState,
  event: "request" | "audio" | "dry-run" | "error" | "stop" | "ended",
): ReadAloudPlaybackState {
  if (event === "request") return "requesting";
  if (event === "audio") return "playing";
  if (event === "dry-run") return "dry-run";
  if (event === "error") return "error";
  if (event === "stop" || event === "ended") return "idle";
  return current;
}

const SPEAK_TEXT_MAX_CHARS = 600;

export function buildSpeakText(source: string, maxChars = SPEAK_TEXT_MAX_CHARS): string {
  const text = source.trim();
  if (!text || maxChars <= 0) return "";
  if (text.length <= maxChars) return text;

  const capped = text.slice(0, maxChars).trimEnd();
  const boundaryIndex = Math.max(
    capped.lastIndexOf("\n"),
    capped.lastIndexOf("."),
    capped.lastIndexOf("!"),
    capped.lastIndexOf("?"),
  );
  const bounded = boundaryIndex > 0 ? capped.slice(0, boundaryIndex + 1).trimEnd() : capped;
  const fallback = bounded || capped;
  if (!fallback) return "";
  if (fallback.length < maxChars) return `${fallback}…`;
  if (maxChars === 1) return "…";
  return `${fallback.slice(0, maxChars - 1).trimEnd()}…`;
}

export function isActivePlayback(audio: HTMLAudioElement | null, active: HTMLAudioElement): boolean {
  return audio === active;
}

type HelixAskReply = {
  id: string;
  content: string;
  mode?: "read" | "observe" | "act" | "verify";
  proof?: {
    verdict?: "PASS" | "FAIL";
    firstFail?: unknown;
    certificate?: { certificateHash?: string | null; integrityOk?: boolean | null } | null;
    artifacts?: Array<{ kind: string; ref: string; label?: string }>;
  };
  question?: string;
  sources?: string[];
  promptIngested?: boolean;
  envelope?: HelixAskResponseEnvelope;
  liveEvents?: AskLiveEventEntry[];
  debug?: {
    two_pass?: boolean;
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
    intent_id?: string;
    intent_domain?: string;
    intent_tier?: string;
    intent_secondary_tier?: string;
    intent_strategy?: string;
    intent_reason?: string;
    arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
    arbiter_reason?: string;
    arbiter_strictness?: "low" | "med" | "high";
    arbiter_user_expects_repo?: boolean;
    arbiter_repo_ok?: boolean;
    arbiter_hybrid_ok?: boolean;
    arbiter_ratio?: number;
    arbiter_topic_ok?: boolean;
    arbiter_concept_match?: boolean;
    verification_anchor_required?: boolean;
    verification_anchor_ok?: boolean;
    math_solver_ok?: boolean;
    math_solver_kind?: string;
    math_solver_final?: string;
    math_solver_reason?: string;
    math_solver_maturity?: string;
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
    evidence_critic_applied?: boolean;
    evidence_critic_ok?: boolean;
    evidence_critic_ratio?: number;
    evidence_critic_count?: number;
    evidence_critic_tokens?: number;
    ambiguity_terms?: string[];
    ambiguity_gate_applied?: boolean;
    overflow_retry_applied?: boolean;
    overflow_retry_steps?: string[];
    overflow_retry_labels?: string[];
    overflow_retry_attempts?: number;
    physics_lint_applied?: boolean;
    physics_lint_reasons?: string[];
    coverage_token_count?: number;
    coverage_key_count?: number;
    coverage_missing_key_count?: number;
    coverage_ratio?: number;
    coverage_missing_keys?: string[];
    coverage_gate_applied?: boolean;
    coverage_gate_reason?: string;
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
    graph_congruence_diagnostics?: {
      treeCount?: number;
      allowedEdges?: number;
      blockedEdges?: number;
      resolvedInTreeEdges?: number;
      resolvedCrossTreeEdges?: number;
      blockedByReason?: Record<string, number>;
      blockedByCondition?: Record<string, number>;
        strictSignals?: {
          B_equals_1?: boolean;
          qi_metric_derived_equals_true?: boolean;
          qi_strict_ok_equals_true?: boolean;
          theta_geom_equals_true?: boolean;
          vdb_two_wall_derivative_support_equals_true?: boolean;
          ts_metric_derived_equals_true?: boolean;
        };
      };
    citation_repair?: boolean;
    live_events?: Array<{
      ts: string;
      tool: string;
      stage: string;
      detail?: string;
      ok?: boolean;
      durationMs?: number;
      text?: string;
    }>;
    format?: "steps" | "compare" | "brief";
    stage_tags?: boolean;
    verbosity?: "brief" | "normal" | "extended";
  };
};

type AskLiveEventEntry = {
  id: string;
  text: string;
  tool?: string;
  ts?: string | number;
  durationMs?: number;
};

type HelixAskPillProps = {
  contextId: string;
  className?: string;
  maxWidthClassName?: string;
  onOpenPanel?: (panelId: PanelDefinition["id"]) => void;
  onOpenConversation?: (sessionId: string) => void;
  placeholder?: string;
};

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clipText(value: string | undefined, limit: number): string {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
}

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

function normalizeCitations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function clipForDisplay(value: string, limit: number, expanded: boolean): string {
  if (expanded || value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
}

function hasLongText(value: unknown, limit: number): boolean {
  return coerceText(value).length > limit;
}

function safeJsonStringify(value: unknown, fallback = "Unable to render debug payload."): string {
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") return val.toString();
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      2,
    );
  } catch {
    return fallback;
  }
}

type HelixAskErrorBoundaryState = { hasError: boolean; error?: Error };

class HelixAskErrorBoundary extends Component<{ children: ReactNode }, HelixAskErrorBoundaryState> {
  state: HelixAskErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): HelixAskErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[helix-ask] render error:", error, info);
    reportClientError(error, { componentStack: info.componentStack, scope: "helix-ask" });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    if (typeof window === "undefined") return;
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const message = this.state.error?.message || "Unexpected Helix Ask error.";
    return (
      <div className="pointer-events-auto rounded-2xl border border-amber-200/30 bg-amber-500/10 p-4 text-xs text-amber-100">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200">Helix Ask paused</p>
        <p className="mt-2">
          The Helix Ask panel hit a rendering error. You can retry or reload the page.
        </p>
        <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/40 p-2 text-[10px] text-amber-100/80">
          {message}
        </pre>
        <div className="mt-2 flex gap-2">
          <button
            className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-200/20"
            onClick={this.handleRetry}
            type="button"
          >
            Retry
          </button>
          <button
            className="rounded-full border border-amber-200/40 bg-amber-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-200/20"
            onClick={this.handleReload}
            type="button"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

function ensureFinalMarker(value: string): string {
  if (!value.trim()) return "ANSWER_START\nANSWER_END";
  if (value.includes("ANSWER_START") || value.includes("FINAL:")) {
    return value;
  }
  return `${value.trimEnd()}\n\nANSWER_START\nANSWER_END`;
}

const HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE = /^\s*ANSWER_(?:START|END)\b\s*/i;
const HELIX_ASK_ANSWER_MARKER_SPLIT_RE = /\b(?:ANSWER_START|ANSWER_END)\b/gi;

const stripAnswerBoundaryPrefix = (value: string): string => {
  let cursor = value.trimStart();
  while (true) {
    const stripped = cursor.replace(HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE, "");
    if (stripped === cursor) break;
    cursor = stripped.trimStart();
  }
  return cursor;
};

function formatEnvelopeSectionsForCopy(
  sections: HelixAskResponseEnvelope["sections"],
  hideTitle?: string,
): string {
  if (!sections || sections.length === 0) return "";
  const hidden = hideTitle?.toLowerCase();
  return sections
    .map((section) => {
      const lines: string[] = [];
      const title = coerceText(section.title);
      if (title && title.toLowerCase() !== hidden) {
        lines.push(title);
      }
      const body = coerceText(section.body);
      if (body) {
        lines.push(body);
      }
      const citations = normalizeCitations(section.citations);
      if (citations.length > 0) {
        lines.push(`Sources: ${citations.join(", ")}`);
      }
      return lines.filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

const HELIX_ASK_CONTEXT_FILES = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_FILES, 18),
  4,
  48,
);
const HELIX_ASK_CONTEXT_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_CHARS, 2200),
  120,
  2400,
);
const HELIX_ASK_MAX_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_TOKENS, 2048),
  64,
  8192,
);
const HELIX_ASK_CONTEXT_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_TOKENS, 2048),
  512,
  8192,
);
const HELIX_ASK_MAX_RENDER_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_RENDER_CHARS, 6000),
  1200,
  24000,
);
const HELIX_ASK_MAX_PROMPT_LINES = 4;
const HELIX_ASK_LIVE_EVENT_LIMIT = 28;
const HELIX_ASK_QUEUE_LIMIT = 12;
const HELIX_ASK_LIVE_EVENT_MAX_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_LIVE_EVENT_MAX_CHARS, 560),
  160,
  2400,
);
const HELIX_MOOD_HINT_MIN_INTERVAL_MS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_MIN_INTERVAL_MS, 1200),
  600,
  12_000,
);
const HELIX_MOOD_HINT_CONFIDENCE = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_CONFIDENCE, 0.58),
  0.2,
  1,
);
const HELIX_MOOD_HINT_MAX_TEXT_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_MOOD_HINT_MAX_TEXT_CHARS, 720),
  160,
  2400,
);
type LumaMoodPalette = {
  ring: string;
  aura: string;
  surfaceBorder: string;
  surfaceTint: string;
  surfaceHalo: string;
  liveBorder: string;
  replyBorder: string;
  replyTint: string;
};

const LUMA_MOOD_PALETTE: Record<LumaMood, LumaMoodPalette> = {
  mad: {
    ring: "ring-rose-400/60",
    aura:
      "border-rose-300/45 bg-rose-500/[0.08] shadow-[0_0_40px_rgba(244,63,94,0.45)]",
    surfaceBorder: "border-rose-300/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(244,63,94,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(244,63,94,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-rose-300/25",
    replyBorder: "border-rose-300/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(244,63,94,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  upset: {
    ring: "ring-amber-300/55",
    aura:
      "border-amber-200/45 bg-amber-400/[0.08] shadow-[0_0_40px_rgba(251,191,36,0.42)]",
    surfaceBorder: "border-amber-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(251,191,36,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(251,191,36,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-amber-200/25",
    replyBorder: "border-amber-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(251,191,36,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  shock: {
    ring: "ring-yellow-300/60",
    aura:
      "border-yellow-200/50 bg-yellow-300/[0.09] shadow-[0_0_42px_rgba(253,224,71,0.45)]",
    surfaceBorder: "border-yellow-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(253,224,71,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(253,224,71,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-yellow-200/25",
    replyBorder: "border-yellow-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(253,224,71,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
  },
  question: {
    ring: "ring-sky-300/55",
    aura:
      "border-sky-300/40 bg-sky-400/[0.07] shadow-[0_0_40px_rgba(125,211,252,0.45)]",
    surfaceBorder: "border-sky-300/30",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(125,211,252,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(125,211,252,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-sky-300/25",
    replyBorder: "border-sky-300/28",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(125,211,252,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
  },
  happy: {
    ring: "ring-emerald-300/60",
    aura:
      "border-emerald-200/45 bg-emerald-400/[0.08] shadow-[0_0_40px_rgba(110,231,183,0.42)]",
    surfaceBorder: "border-emerald-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(110,231,183,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(110,231,183,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-emerald-200/25",
    replyBorder: "border-emerald-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(110,231,183,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  friend: {
    ring: "ring-teal-300/60",
    aura:
      "border-teal-200/45 bg-teal-400/[0.08] shadow-[0_0_40px_rgba(94,234,212,0.44)]",
    surfaceBorder: "border-teal-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(94,234,212,0.2)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(94,234,212,0.1)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-teal-200/25",
    replyBorder: "border-teal-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(94,234,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
  love: {
    ring: "ring-pink-300/60",
    aura:
      "border-pink-200/45 bg-pink-400/[0.08] shadow-[0_0_42px_rgba(249,168,212,0.45)]",
    surfaceBorder: "border-pink-200/35",
    surfaceTint:
      "bg-[radial-gradient(120%_170%_at_6%_12%,rgba(249,168,212,0.22)_0%,rgba(15,23,42,0)_68%)]",
    surfaceHalo:
      "bg-[radial-gradient(120%_140%_at_94%_16%,rgba(249,168,212,0.12)_0%,rgba(15,23,42,0)_72%)]",
    liveBorder: "border-pink-200/25",
    replyBorder: "border-pink-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(249,168,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
  },
};
const HELIX_ASK_OUTPUT_TOKENS = clampNumber(
  readNumber(
    (import.meta as any)?.env?.VITE_HELIX_ASK_OUTPUT_TOKENS,
    Math.min(
      HELIX_ASK_MAX_TOKENS,
      Math.max(64, Math.floor(HELIX_ASK_CONTEXT_TOKENS * 0.5)),
    ),
  ),
  64,
  HELIX_ASK_MAX_TOKENS,
);
const HELIX_ASK_PATH_REGEX =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:tsx|ts|jsx|js|md|json|cjs|mjs|py|yml|yaml)/g;
const HELIX_ASK_CORE_FOCUS = /(helix ask|helix|ask system|ask pipeline|ask mode)/i;
const HELIX_ASK_CORE_PATH_BOOST =
  /(docs\/helix-ask-flow\.md|client\/src\/components\/helix\/HelixAskPill\.tsx|client\/src\/pages\/desktop\.tsx|server\/routes\/agi\.plan\.ts|server\/skills\/llm\.local|asklocal)/i;
const HELIX_ASK_CORE_NOISE =
  /(docs\/SMOKE\.md|docs\/V0\.1-SIGNOFF\.md|docs\/ESSENCE-CONSOLE|docs\/TRACE-API\.md|HullMetricsVisPanel|shared\/schema\.ts|server\/db\/)/i;
const HELIX_ASK_METHOD_TRIGGER = /(scientific method|methodology|method\b)/i;
const HELIX_ASK_STEP_TRIGGER =
  /(how to|how does|how do|steps?|step-by-step|procedure|process|workflow|pipeline|implement|implementation|configure|setup|set up|troubleshoot|debug|fix|resolve)/i;
const HELIX_ASK_COMPARE_TRIGGER =
  /(compare|versus|vs\.?|difference|better|worse|more accurate|accuracy|tradeoffs|advantages|what is|what's|why is|why are|how is|how are)/i;
const HELIX_ASK_REPO_HINT =
  /(helix|helix ask|ask system|ask pipeline|ask mode|this system|this repo|repository|repo\b|code|codebase|file|path|component|module|endpoint|api|server|client|ui|panel|pipeline|trace|essence|casimir|warp|alcubierre|resonance|code lattice|lattice|smoke test|smoke\.md|bug|error|crash|config|env|settings|docs\/)/i;
const HELIX_ASK_FILE_HINT =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|mjs|cjs|py|rs|go|java|kt|swift|cpp|c|h)/i;

type HelixAskFormat = "steps" | "compare" | "brief";

function decideHelixAskFormat(question?: string): { format: HelixAskFormat; stageTags: boolean } {
  const normalized = question?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return { format: "brief", stageTags: false };
  }
  if (HELIX_ASK_METHOD_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: true };
  }
  if (HELIX_ASK_STEP_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: false };
  }
  if (
    HELIX_ASK_COMPARE_TRIGGER.test(normalized) ||
    normalized.startsWith("why ") ||
    normalized.startsWith("what is") ||
    normalized.startsWith("what's")
  ) {
    return { format: "compare", stageTags: false };
  }
  return { format: "brief", stageTags: false };
}

function isHelixAskRepoQuestion(question: string): boolean {
  const trimmed = question.trim();
  if (!trimmed) return true;
  if (HELIX_ASK_FILE_HINT.test(trimmed)) return true;
  return HELIX_ASK_REPO_HINT.test(trimmed);
}

function stripStageTags(value: string): string {
  if (!value) return value;
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\s*\((observe|hypothesis|experiment|analysis|explain)\)\s*$/i, "").trimEnd())
    .join("\n")
    .trim();
}
const HELIX_ASK_WARP_FOCUS = /(warp|bubble|alcubierre|natario)/i;
const HELIX_ASK_WARP_PATH_BOOST =
  /(modules\/warp|client\/src\/lib\/warp-|warp-module|natario-warp|warp-theta|energy-pipeline)/i;

const HELIX_PANEL_ALIASES: Array<{ id: PanelDefinition["id"]; aliases: string[] }> = [
  { id: "helix-noise-gens", aliases: ["noise gens", "noise generators", "noise generator"] },
  { id: "alcubierre-viewer", aliases: ["warp bubble", "warp viewer", "alcubierre", "warp visualizer"] },
  { id: "live-energy", aliases: ["live energy", "energy pipeline", "pipeline"] },
  { id: "helix-core", aliases: ["helix core", "core"] },
  { id: "docs-viewer", aliases: ["docs", "documentation", "papers"] },
  { id: "resonance-orchestra", aliases: ["resonance", "resonance orchestra"] },
  { id: "agi-essence-console", aliases: ["essence console", "helix console", "conversation panel"] },
];

const HELIX_FILE_PANEL_HINTS: Array<{ pattern: RegExp; panelId: PanelDefinition["id"] }> = [
  { pattern: /(modules\/warp|client\/src\/components\/warp|client\/src\/lib\/warp-|warp-bubble)/i, panelId: "alcubierre-viewer" },
  { pattern: /(energy-pipeline|warp-pipeline-adapter|pipeline)/i, panelId: "live-energy" },
  { pattern: /(helix-core\.ts|server\/helix-core|\/helix\/pipeline)/i, panelId: "helix-core" },
  { pattern: /(code-lattice|resonance)/i, panelId: "resonance-orchestra" },
  { pattern: /(agi\.plan|training-trace|essence|trace)/i, panelId: "agi-essence-console" },
  { pattern: /(docs\/|\.md$)/i, panelId: "docs-viewer" },
];

const HELIX_ATOMIC_LAUNCH_EVENT = "helix:atomic-launch";
const HELIX_ATOMIC_LAUNCH_STORAGE_KEY = "helix.atomic.launch.v1";

function normalizePanelQuery(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function resolvePanelIdFromText(value: string): PanelDefinition["id"] | null {
  const normalized = normalizePanelQuery(value);
  if (!normalized) return null;
  for (const entry of HELIX_PANEL_ALIASES) {
    if (!getPanelDef(entry.id)) continue;
    if (entry.aliases.some((alias) => normalized.includes(alias))) {
      return entry.id;
    }
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  let bestId: PanelDefinition["id"] | null = null;
  let bestScore = 0;
  for (const panel of panelRegistry) {
    if (!getPanelDef(panel.id)) continue;
    const haystack = `${panel.title} ${panel.id} ${(panel.keywords ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = panel.id;
    }
  }
  return bestScore > 0 ? bestId : null;
}

function resolvePanelIdFromPath(value: string): PanelDefinition["id"] | null {
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  for (const hint of HELIX_FILE_PANEL_HINTS) {
    if (hint.pattern.test(normalized) && getPanelDef(hint.panelId)) {
      return hint.panelId;
    }
  }
  return resolvePanelIdFromText(normalized);
}

function parseOpenPanelCommand(value: string): PanelDefinition["id"] | null {
  const match = value.trim().match(/^(?:\/open|open|show|launch)\s+(.+)/i);
  if (!match) return null;
  const raw = match[1].replace(/^(the|panel|window)\s+/i, "").trim();
  return resolvePanelIdFromText(raw);
}

function buildHelixAskSearchQueries(question: string): string[] {
  const base = question.trim();
  if (!base) return [];
  const normalized = base.toLowerCase();
  const queries = [base];
  const seen = new Set([base.toLowerCase()]);
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(trimmed);
  };

  if (/(scientific method|ask|assistant|llm|prompt|context|plan|execute|trace|code lattice|resonance)/i.test(normalized)) {
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
    push("client/src/lib/agi/api.ts");
    push("server/skills/llm.local.spawn.ts");
  }
  if (normalized.includes("warp") || normalized.includes("alcubierre") || normalized.includes("bubble")) {
    push("warp bubble");
    push("modules/warp/warp-module.ts");
    push("calculateNatarioWarpBubble");
    push("warp pipeline");
    push("energy-pipeline warp");
  }
  if (normalized.includes("solve") || normalized.includes("solver")) {
    push("warp solver");
    push("constraint gate");
    push("gr evaluation");
  }

  return queries.slice(0, 6);
}

function buildGroundedPrompt(question: string, context: string): string {
  const formatSpec = decideHelixAskFormat(question);
  const lines = [
    "You are Helix Ask, a repo-grounded assistant.",
    "Use only the evidence in the context below. Cite file paths when referencing code.",
    "If the context is insufficient, say what is missing and ask a concise follow-up.",
    "When the context includes solver or calculation functions, summarize the inputs, outputs, and flow before UI details.",
  ];
  if (formatSpec.format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 6-9 steps and no preamble.");
    lines.push("Each step should be 2-3 sentences and grounded in repo details; cite file paths when relevant.");
    if (formatSpec.stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (2-3 sentences).");
  } else if (formatSpec.format === "compare") {
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
  lines.push("Do not repeat the question or include headings like Question, Context, or Resonance patch.");
  lines.push("Do not output tool logs, certificates, command transcripts, or repeat the prompt/context.");
  lines.push('Respond with only the answer and prefix it with "FINAL:".');
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("Context:");
  lines.push(context || "No repo context was attached to this request.");
  lines.push("");
  lines.push("FINAL:");
  return lines.join("\n");
}

function buildGeneralPrompt(question: string): string {
  const formatSpec = decideHelixAskFormat(question);
  const lines = [
    "You are Helix Ask.",
    "Answer using general knowledge; do not cite file paths or repo details.",
  ];
  if (formatSpec.format === "steps") {
    lines.push("Start directly with a numbered list using `1.` style; use 4-6 steps and no preamble.");
    lines.push("Each step should be 1-2 sentences.");
    if (formatSpec.stageTags) {
      lines.push("Tag each step with the stage in parentheses (observe, hypothesis, experiment, analysis, explain).");
    } else {
      lines.push("Do not include stage tags or parenthetical labels unless explicitly requested.");
    }
    lines.push("After the steps, add a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else if (formatSpec.format === "compare") {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps.");
    lines.push("If the question is comparative, include a short bullet list (2-4 items) of concrete differences.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  } else {
    lines.push("Answer in 1-2 short paragraphs; do not use numbered steps unless explicitly requested.");
    lines.push("End with a short paragraph starting with \"In practice,\" (1-2 sentences).");
  }
  lines.push("Avoid repetition; do not repeat the question.");
  lines.push('Respond with only the answer and prefix it with "FINAL:".');
  lines.push("");
  lines.push(`Question: ${question}`);
  lines.push("");
  lines.push("FINAL:");
  return lines.join("\n");
}

function normalizeQuestionMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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

function cleanPromptLine(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const stripped = trimmed
    .replace(/^[\"'`.\-–—,;]+/g, "")
    .replace(/[\"'`.\-–—,;]+$/g, "")
    .trim();
  return stripped;
}

function stripLeadingQuestion(response: string, question?: string): string {
  const lines = response.split(/\r?\n/);
  const target = question?.trim();
  const targetNormalized = target ? normalizeQuestionMatch(target) : "";
  let startIndex = 0;
  while (startIndex < lines.length) {
    const inline = stripInlineQuestionLine(lines[startIndex] ?? "", question);
    if (inline !== null) {
      if (inline) {
        lines[startIndex] = inline;
        break;
      }
      startIndex += 1;
      continue;
    }
    const cleaned = cleanPromptLine(lines[startIndex]);
    if (!cleaned) {
      startIndex += 1;
      continue;
    }
    if (/^(question|context|resonance patch)\s*:/i.test(cleaned)) {
      startIndex += 1;
      continue;
    }
    if (target) {
      const lowerLine = cleaned.toLowerCase();
      if (lowerLine === target.toLowerCase()) {
        startIndex += 1;
        continue;
      }
      const normalizedLine = normalizeQuestionMatch(cleaned);
      if (normalizedLine && normalizedLine === targetNormalized) {
        startIndex += 1;
        continue;
      }
    }
    break;
  }
  return lines.slice(startIndex).join("\n").trim();
}

function stripPromptEcho(response: string, question?: string): string {
  let trimmed = stripQuestionPrefixText(response.trim(), question);
  trimmed = stripLeadingQuestion(trimmed, question);
  trimmed = stripEvidencePromptBlock(trimmed);
  trimmed = stripAnswerBoundaryPrefix(trimmed);
  const answerBlock = extractAnswerBlock(trimmed);
  if (answerBlock) {
    return answerBlock;
  }
  if (!trimmed) return trimmed;
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const index = trimmed.lastIndexOf(marker);
    if (index >= 0) {
      const after = trimmed.slice(index + marker.length).trim();
      if (after) return after;
    }
  }
  const isScaffoldLine = (line: string) => {
    const cleaned = line
      .trim()
      .replace(/^[>"'`*#\-\d\.\)\s]+/, "")
      .trim();
    if (!cleaned) return true;
    const lowered = cleaned.toLowerCase();
    return (
      lowered.startsWith("you are helix ask") ||
      lowered.startsWith("use only the evidence") ||
      lowered.startsWith("use only the evidence steps") ||
      lowered.startsWith("use only the evidence bullets") ||
      lowered.startsWith("use general knowledge") ||
      lowered.startsWith("use only the reasoning") ||
      lowered.startsWith("revise the answer") ||
      lowered.startsWith("do not add new claims") ||
      lowered.startsWith("preserve the format") ||
      lowered.startsWith("keep the paragraph format") ||
      lowered.startsWith("keep the numbered step list") ||
      lowered.startsWith("use only file paths") ||
      lowered.startsWith("evidence:") ||
      lowered.startsWith("answer:") ||
      lowered.startsWith("if the context is insufficient") ||
      lowered.startsWith("if the question mentions") ||
      lowered.startsWith("when the context includes") ||
      lowered.startsWith("if the question is comparative") ||
      lowered.startsWith("answer in") ||
      lowered.startsWith("do not use numbered steps") ||
      lowered.startsWith("start directly with") ||
      lowered.startsWith("each step should") ||
      lowered.startsWith("after the steps") ||
      lowered.startsWith("avoid repetition") ||
      lowered.startsWith("preserve any stage tags") ||
      lowered.startsWith("do not include stage tags") ||
      lowered.startsWith("do not include the words") ||
      lowered.startsWith("do not output tool logs") ||
      lowered.startsWith("do not repeat the question") ||
      lowered.startsWith("end with a short paragraph") ||
      lowered.startsWith("respond with only the answer between") ||
      /^answer_(?:start|end)\b/i.test(cleaned) ||
      lowered.startsWith("no preamble") ||
      lowered.startsWith("no headings") ||
      lowered.startsWith("ask debug") ||
      lowered.startsWith("two-pass:") ||
      lowered.startsWith("format:") ||
      lowered.startsWith("stage tags:") ||
      lowered.startsWith("question:") ||
      lowered.includes("question:") ||
      lowered.startsWith("context:") ||
      lowered.startsWith("prompt context") ||
      lowered.startsWith("context sources") ||
      lowered.startsWith("resonance patch:") ||
      lowered.startsWith("knowledge projects:") ||
      lowered.startsWith("evidence steps:") ||
      lowered.startsWith("evidence bullets:") ||
      lowered.startsWith("reasoning steps:") ||
      lowered.startsWith("reasoning bullets:") ||
      lowered.startsWith("final:")
    );
  };
  const cleanedLines = trimmed
    .split(/\r?\n/)
    .filter((line) => !isScaffoldLine(line))
    .map((line) => stripAnswerBoundaryPrefix(line));
  const cleaned = cleanedLines.join("\n").trim();
  const formatSpec = decideHelixAskFormat(question);
  if (cleaned) {
    return formatSpec.stageTags ? cleaned : stripStageTags(cleaned);
  }
  return formatSpec.stageTags
    ? trimmed
    : stripStageTags(stripAnswerBoundaryPrefix(trimmed));
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
  const startIndex = value.lastIndexOf("ANSWER_START");
  if (startIndex >= 0) {
    const afterStart = value.slice(startIndex + "ANSWER_START".length);
    const endIndex = afterStart.lastIndexOf("ANSWER_END");
    const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    const trimmed = stripAnswerBoundaryPrefix(slice).trim();
    if (trimmed) return trimmed;
  }
  const boundaryTrimmed = stripAnswerBoundaryPrefix(value);
  if (boundaryTrimmed) {
    return boundaryTrimmed;
  }
  const markers = ["FINAL:", "FINAL ANSWER:", "FINAL_ANSWER:", "Answer:"];
  for (const marker of markers) {
    const index = value.lastIndexOf(marker);
    if (index >= 0) {
      const after = value.slice(index + marker.length).trim();
      if (after) return after;
    }
  }
  return "";
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

function parseSearchScore(preview: string | undefined): number {
  if (!preview) return 0;
  const match = preview.match(/score=([0-9.]+)/i);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildContextFromBundles(bundles: KnowledgeProjectExport[], question: string): string {
  const files = bundles.flatMap((bundle) => bundle.files ?? []);
  const helixAskFocus = HELIX_ASK_CORE_FOCUS.test(question);
  const scored = files
    .map((file) => {
      const label = file.path || file.name || "";
      const preview = file.preview ?? "";
      let score = parseSearchScore(preview);
      if (helixAskFocus) {
        if (HELIX_ASK_CORE_PATH_BOOST.test(label)) {
          score += 10;
        }
        if (HELIX_ASK_CORE_NOISE.test(label)) {
          score -= 6;
        }
      }
      if (HELIX_ASK_WARP_FOCUS.test(question) && HELIX_ASK_WARP_PATH_BOOST.test(label)) {
        score += 8;
      }
      return { file, label, preview, score };
    })
    .filter((entry) => entry.label && entry.preview && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const entry of scored) {
    if (seen.has(entry.label)) continue;
    const preview = clipText(entry.preview, HELIX_ASK_CONTEXT_CHARS);
    if (!preview) continue;
    lines.push(`${entry.label}\n${preview}`);
    seen.add(entry.label);
    if (lines.length >= HELIX_ASK_CONTEXT_FILES) {
      return lines.join("\n\n");
    }
  }
  return lines.join("\n\n");
}

export function HelixAskPill({
  contextId,
  className,
  maxWidthClassName,
  onOpenPanel,
  onOpenConversation,
  placeholder,
}: HelixAskPillProps) {
  const { userSettings } = useHelixStartSettings();
  const { ensureContextSession, addMessage, setActive } = useAgiChatStore();
  const helixAskSessionRef = useRef<string | null>(null);
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
  const [askReplies, setAskReplies] = useState<HelixAskReply[]>([]);
  const [askExtensionOpenByReply, setAskExtensionOpenByReply] = useState<Record<string, boolean>>(
    {},
  );
  const [askLiveEvents, setAskLiveEvents] = useState<AskLiveEventEntry[]>([]);
  const askLiveEventsRef = useRef<AskLiveEventEntry[]>([]);
  const [askLiveSessionId, setAskLiveSessionId] = useState<string | null>(null);
  const [askLiveTraceId, setAskLiveTraceId] = useState<string | null>(null);
  const [askElapsedMs, setAskElapsedMs] = useState<number | null>(null);
  const [askLiveDraft, setAskLiveDraft] = useState<string>("");
  const askLiveDraftRef = useRef("");
  const askLiveDraftBufferRef = useRef("");
  const askLiveDraftFlushRef = useRef<number | null>(null);
  const [askQueue, setAskQueue] = useState<string[]>([]);
  const [askActiveQuestion, setAskActiveQuestion] = useState<string | null>(null);
  const [askMood, setAskMood] = useState<LumaMood>("question");
  const [askMoodBroken, setAskMoodBroken] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.onLine === false;
  });
  const resumeAttemptedRef = useRef(false);
  const askStartRef = useRef<number | null>(null);
  const lastAskStatusRef = useRef<string | null>(null);
  const askDraftRef = useRef("");
  const askMoodTimerRef = useRef<number | null>(null);
  const moodHintAbortRef = useRef<AbortController | null>(null);
  const moodHintSeqRef = useRef(0);
  const moodHintLastAtRef = useRef(0);
  const askAbortRef = useRef<AbortController | null>(null);
  const askRunIdRef = useRef(0);
  const moodHintSessionId = useMemo(() => `helix:mood:${contextId}`, [contextId]);
  const [askExpandedByReply, setAskExpandedByReply] = useState<Record<string, boolean>>({});
  const [askMode, setAskMode] = useState<"read" | "observe" | "act" | "verify">("read");
  const [missionContextControls, setMissionContextControls] = useState<MissionContextControls>(() =>
    readMissionContextControls(),
  );
  const [contextSessionState, setContextSessionState] = useState<
    "idle" | "requesting" | "active" | "stopping" | "error"
  >("idle");
  const [readAloudByReply, setReadAloudByReply] = useState<Record<string, ReadAloudPlaybackState>>({});
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const playbackReplyIdRef = useRef<string | null>(null);
  const contextSessionStreamRef = useRef<MediaStream | null>(null);
  const contextSessionStartInFlightRef = useRef(false);

  const getHelixAskSessionId = useCallback(() => {
    if (helixAskSessionRef.current) return helixAskSessionRef.current;
    const sessionId = ensureContextSession(contextId, "Helix Ask");
    helixAskSessionRef.current = sessionId || null;
    return helixAskSessionRef.current;
  }, [contextId, ensureContextSession]);

  useEffect(() => {
    setAskMoodBroken(false);
  }, [askMood]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const update = () => setIsOffline(navigator.onLine === false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    broadcastLumaMood(askMood);
  }, [askMood]);

  const clearLiveDraftFlush = useCallback(() => {
    if (askLiveDraftFlushRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(askLiveDraftFlushRef.current);
    }
    askLiveDraftFlushRef.current = null;
  }, []);

  const flushLiveDraft = useCallback(() => {
    clearLiveDraftFlush();
    const nextRaw = askLiveDraftBufferRef.current;
    const clipped = nextRaw.length > 4000 ? nextRaw.slice(-4000) : nextRaw;
    askLiveDraftRef.current = clipped;
    setAskLiveDraft(clipped);
  }, [clearLiveDraftFlush]);

  const scheduleLiveDraftFlush = useCallback(() => {
    if (askLiveDraftFlushRef.current !== null) return;
    if (typeof window === "undefined") {
      flushLiveDraft();
      return;
    }
    askLiveDraftFlushRef.current = window.setTimeout(() => {
      flushLiveDraft();
    }, 60);
  }, [flushLiveDraft]);

  const pickRandomMood = useCallback((): LumaMood => {
    const idx = Math.floor(Math.random() * LUMA_MOOD_ORDER.length);
    return LUMA_MOOD_ORDER[idx] ?? "question";
  }, []);

  useEffect(() => {
    setAskMood(pickRandomMood());
  }, [pickRandomMood]);

  const updateMoodFromText = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const { mood } = classifyMoodFromWhisper(trimmed);
    if (mood) {
      setAskMood(mood);
    }
  }, []);

  const cancelMoodHint = useCallback(() => {
    moodHintSeqRef.current += 1;
    moodHintLastAtRef.current = 0;
    if (moodHintAbortRef.current) {
      moodHintAbortRef.current.abort();
      moodHintAbortRef.current = null;
    }
  }, []);

  const requestMoodHint = useCallback(
    (value: string, opts?: { force?: boolean }) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const now = Date.now();
      const force = opts?.force === true;
      if (!force && now - moodHintLastAtRef.current < HELIX_MOOD_HINT_MIN_INTERVAL_MS) {
        return;
      }
      moodHintLastAtRef.current = now;
      moodHintSeqRef.current += 1;
      const seq = moodHintSeqRef.current;
      if (moodHintAbortRef.current) {
        moodHintAbortRef.current.abort();
      }
      const controller = new AbortController();
      moodHintAbortRef.current = controller;
      const clipped = trimmed.slice(-HELIX_MOOD_HINT_MAX_TEXT_CHARS);
      void askMoodHint(clipped, {
        sessionId: moodHintSessionId,
        signal: controller.signal,
      })
        .then((hint) => {
          if (controller.signal.aborted) return;
          if (seq !== moodHintSeqRef.current) return;
          const mood = hint?.mood;
          const confidence = typeof hint?.confidence === "number" ? hint.confidence : 0;
          if (mood && confidence >= HELIX_MOOD_HINT_CONFIDENCE) {
            setAskMood(mood);
          }
        })
        .catch(() => {
          // Mood hints are best-effort and should never block the UI.
        })
        .finally(() => {
          if (moodHintAbortRef.current === controller) {
            moodHintAbortRef.current = null;
          }
        });
    },
    [moodHintSessionId],
  );

  const clearMoodTimer = useCallback(() => {
    if (askMoodTimerRef.current !== null) {
      window.clearTimeout(askMoodTimerRef.current);
      askMoodTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearMoodTimer(), [clearMoodTimer]);
  useEffect(() => () => cancelMoodHint(), [cancelMoodHint]);
  useEffect(() => () => clearLiveDraftFlush(), [clearLiveDraftFlush]);
  useEffect(() => {
    if (!askBusy) return;
    cancelMoodHint();
  }, [askBusy, cancelMoodHint]);

  useEffect(() => {
    if (!askBusy) return;
    const offlineStatus = "Offline - reconnecting...";
    if (isOffline) {
      if (askStatus && askStatus !== offlineStatus) {
        lastAskStatusRef.current = askStatus;
      }
      if (askStatus !== offlineStatus) {
        setAskStatus(offlineStatus);
      }
      return;
    }
    if (askStatus === offlineStatus) {
      setAskStatus(lastAskStatusRef.current ?? "Generating answer...");
    }
  }, [askBusy, askStatus, isOffline]);

  useEffect(() => {
    if (isOffline) return;
    if (askStatus) {
      lastAskStatusRef.current = askStatus;
    }
  }, [askStatus, isOffline]);


  const moodAsset = resolveMoodAsset(askMood);
  const moodSrc = askMoodBroken ? null : moodAsset?.sources[0] ?? null;
  const moodLabel = moodAsset?.label ?? "Helix mood";
  const moodPalette = LUMA_MOOD_PALETTE[askMood] ?? LUMA_MOOD_PALETTE.question;
  const moodRingClass = moodPalette.ring;

  useEffect(() => {
    if (!askBusy) return;
    const lastEvent = askLiveEvents[askLiveEvents.length - 1]?.text?.trim();
    const draftTail = askLiveDraft.trim();
    const status = askStatus?.trim();
    const nextText = lastEvent || (draftTail ? draftTail.slice(-320) : "") || status;
    if (!nextText) return;
    const timer = window.setTimeout(() => {
      updateMoodFromText(nextText);
      requestMoodHint(nextText);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [askBusy, askLiveDraft, askLiveEvents, askStatus, requestMoodHint, updateMoodFromText]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"] | null | undefined) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      onOpenPanel?.(panelId);
    },
    [onOpenPanel],
  );

  const launchAtomicViewer = useCallback(
    (payload: AtomicViewerLaunch | undefined) => {
      if (!payload) return;
      if (payload.viewer !== "atomic-orbital" || payload.panel_id !== "electron-orbital") return;
      openPanelById(payload.panel_id);
      if (typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(HELIX_ATOMIC_LAUNCH_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Best effort; still dispatch the event.
      }
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(HELIX_ATOMIC_LAUNCH_EVENT, {
            detail: payload,
          }),
        );
      }, 60);
    },
    [openPanelById],
  );

  const renderHelixAskContent = useCallback(
    (content: unknown): ReactNode[] => {
      const parts: ReactNode[] = [];
      const text = coerceText(content);
      if (!text) return parts;
      HELIX_ASK_PATH_REGEX.lastIndex = 0;
      let lastIndex = 0;
      for (const match of text.matchAll(HELIX_ASK_PATH_REGEX)) {
        const matchText = match[0];
        const start = match.index ?? 0;
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        const panelId = resolvePanelIdFromPath(matchText);
        if (panelId) {
          parts.push(
            <button
              key={`${matchText}-${start}`}
              className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
              onClick={() => openPanelById(panelId)}
              type="button"
            >
              {matchText}
            </button>,
          );
        } else {
          parts.push(matchText);
        }
        lastIndex = start + matchText.length;
      }
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      return parts.length ? parts : [text];
    },
    [openPanelById],
  );

  const renderEnvelopeSections = useCallback(
    (sections: HelixAskResponseEnvelope["sections"], hideTitle?: string, expanded?: boolean) => {
      if (!sections || sections.length === 0) return null;
      const hidden = hideTitle?.toLowerCase();
      return (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="text-sm text-slate-100">
              {(() => {
                const title = coerceText(section.title);
                return title && title.toLowerCase() !== hidden ? (
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {title}
                  </p>
                ) : null;
              })()}
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {renderHelixAskContent(
                  clipForDisplay(
                    coerceText(section.body),
                    HELIX_ASK_MAX_RENDER_CHARS,
                    Boolean(expanded),
                  ),
                )}
              </p>
              {section.layer === "proof" && normalizeCitations(section.citations).length > 0 ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  Sources: {renderHelixAskContent(normalizeCitations(section.citations).join(", "))}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      );
    },
    [renderHelixAskContent],
  );

  const renderHelixAskEnvelope = useCallback(
    (reply: HelixAskReply) => {
      if (!reply.envelope) {
        return (
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(reply.content)}
          </p>
        );
      }
      const envelopeAnswer = coerceText(reply.envelope.answer).trim();
      const fallbackAnswer = coerceText(reply.content).trim();
      const sections = reply.envelope.sections ?? [];
      const detailSections = sections.filter((section) => section.layer !== "proof");
      const proofSections = sections.filter((section) => section.layer === "proof");
      const expandDetails = reply.envelope.mode === "extended";
      const extension = reply.envelope.extension;
      const extensionBody = coerceText(extension?.body).trim();
      const extensionCitations = normalizeCitations(extension?.citations);
      const extensionAvailable = Boolean(extension?.available && extensionBody);
      const extensionOpen = Boolean(askExtensionOpenByReply[reply.id]);
      const expanded = Boolean(askExpandedByReply[reply.id]);
      const answerText = clipForDisplay(
        coerceText(envelopeAnswer || fallbackAnswer),
        HELIX_ASK_MAX_RENDER_CHARS,
        expanded,
      );
      const hasLongContent =
        hasLongText(envelopeAnswer || fallbackAnswer, HELIX_ASK_MAX_RENDER_CHARS) ||
        hasLongText(extensionBody, HELIX_ASK_MAX_RENDER_CHARS) ||
        sections.some((section) => hasLongText(section.body, HELIX_ASK_MAX_RENDER_CHARS));
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(answerText)}
          </p>
          {hasLongContent ? (
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
              onClick={() =>
                setAskExpandedByReply((prev) => ({
                  ...prev,
                  [reply.id]: !expanded,
                }))
              }
            >
              {expanded ? "Show Less" : "Show Full Answer"}
            </button>
          ) : null}
          {extensionAvailable ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              <button
                type="button"
                className="text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-slate-200"
                onClick={() =>
                  setAskExtensionOpenByReply((prev) => ({
                    ...prev,
                    [reply.id]: !prev[reply.id],
                  }))
                }
              >
                {extensionOpen ? "Hide Additional Repo Context" : "Expand With Retrieved Evidence"}
              </button>
              {extensionOpen ? (
                <div className="mt-2 space-y-1">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderHelixAskContent(
                      clipForDisplay(extensionBody, HELIX_ASK_MAX_RENDER_CHARS, expanded),
                    )}
                  </p>
                  {extensionCitations.length > 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Sources: {renderHelixAskContent(extensionCitations.join(", "))}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {detailSections.length > 0 ? (
            <details
              open={expandDetails}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Details
              </summary>
              <div className="mt-2">
                {renderEnvelopeSections(detailSections, "Details", expanded)}
              </div>
            </details>
          ) : null}
          {proofSections.length > 0 ? (
            <details
              open={expandDetails}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Proof
              </summary>
              <div className="mt-2">
                {renderEnvelopeSections(proofSections, "Proof", expanded)}
              </div>
            </details>
          ) : null}
        </div>
      );
    },
    [askExpandedByReply, askExtensionOpenByReply, renderEnvelopeSections, renderHelixAskContent],
  );

  const buildCopyText = useCallback((reply: HelixAskReply): string => {
    if (!reply) return "";
    if (!reply.envelope) return reply.content;
    const sections = reply.envelope.sections ?? [];
    const detailSections = sections.filter((section) => section.layer !== "proof");
    const proofSections = sections.filter((section) => section.layer === "proof");
    const chunks: string[] = [coerceText(reply.envelope.answer)];
    const extensionBody = coerceText(reply.envelope.extension?.body).trim();
    if (extensionBody) {
      chunks.push(`Additional Repo Context\n${extensionBody}`);
    }
    if (detailSections.length > 0) {
      const detailText = formatEnvelopeSectionsForCopy(detailSections, "Details");
      if (detailText) {
        chunks.push(`Details\n${detailText}`);
      }
    }
    if (proofSections.length > 0) {
      const proofText = formatEnvelopeSectionsForCopy(proofSections, "Proof");
      if (proofText) {
        chunks.push(`Proof\n${proofText}`);
      }
    }
    return chunks.filter(Boolean).join("\n\n").trim();
  }, []);

  const handleCopyReply = useCallback(
    async (reply: HelixAskReply) => {
      const text = buildCopyText(reply);
      if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore clipboard failures
      }
    },
    [buildCopyText],
  );


  const stopReadAloud = useCallback(() => {
    const currentAudio = playbackAudioRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      playbackAudioRef.current = null;
    }
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }
    if (playbackReplyIdRef.current) {
      const replyId = playbackReplyIdRef.current;
      setReadAloudByReply((prev) => ({ ...prev, [replyId]: transitionReadAloudState(prev[replyId] ?? "idle", "stop") }));
      playbackReplyIdRef.current = null;
    }
  }, []);

  const handleReadAloud = useCallback(async (reply: HelixAskReply) => {
    const text = buildSpeakText(buildCopyText(reply));
    if (!text) return;
    stopReadAloud();
    setReadAloudByReply((prev) => ({ ...prev, [reply.id]: transitionReadAloudState(prev[reply.id] ?? "idle", "request") }));
    try {
      const response = await speakVoice({
        text,
        mode: "briefing",
        priority: "info",
        traceId: askLiveTraceId ?? `ask:${crypto.randomUUID()}`,
        missionId: contextId,
        eventId: reply.id,
        contextTier: missionContextControls.tier,
        sessionState: contextSessionState,
        voiceMode: missionContextControls.voiceMode,
      });
      if (response.kind === "json") {
        const statusEvent = response.status >= 400 ? "error" : "dry-run";
        setReadAloudByReply((prev) => ({ ...prev, [reply.id]: transitionReadAloudState(prev[reply.id] ?? "idle", statusEvent) }));
        return;
      }
      const audio = new Audio();
      const url = URL.createObjectURL(response.blob);
      playbackUrlRef.current = url;
      playbackReplyIdRef.current = reply.id;
      audio.src = url;
      audio.onended = () => {
        if (!isActivePlayback(playbackAudioRef.current, audio)) {
          return;
        }
        setReadAloudByReply((prev) => ({ ...prev, [reply.id]: transitionReadAloudState(prev[reply.id] ?? "idle", "ended") }));
        if (playbackUrlRef.current === url) {
          URL.revokeObjectURL(url);
          playbackUrlRef.current = null;
        }
        playbackAudioRef.current = null;
        playbackReplyIdRef.current = null;
      };
      playbackAudioRef.current = audio;
      setReadAloudByReply((prev) => ({ ...prev, [reply.id]: transitionReadAloudState(prev[reply.id] ?? "idle", "audio") }));
      await audio.play();
    } catch {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.src = "";
        playbackAudioRef.current = null;
      }
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
        playbackUrlRef.current = null;
      }
      playbackReplyIdRef.current = null;
      setReadAloudByReply((prev) => ({ ...prev, [reply.id]: transitionReadAloudState(prev[reply.id] ?? "idle", "error") }));
    }
  }, [askLiveTraceId, buildCopyText, contextId, contextSessionState, missionContextControls.tier, missionContextControls.voiceMode, stopReadAloud]);

  useEffect(() => () => {
    stopReadAloud();
  }, [stopReadAloud]);

  const handleOpenConversationPanel = useCallback(() => {
    const sessionId = getHelixAskSessionId();
    if (!sessionId) return;
    setActive(sessionId);
    onOpenConversation?.(sessionId);
  }, [getHelixAskSessionId, onOpenConversation, setActive]);

  const resizeTextarea = useCallback((target?: HTMLTextAreaElement | null) => {
    const el = target ?? askInputRef.current;
    if (!el || typeof window === "undefined") return;
    el.style.height = "auto";
    const styles = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(styles.lineHeight || "20");
    const paddingTop = Number.parseFloat(styles.paddingTop || "0");
    const paddingBottom = Number.parseFloat(styles.paddingBottom || "0");
    const maxHeight = lineHeight * HELIX_ASK_MAX_PROMPT_LINES + paddingTop + paddingBottom;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  useEffect(() => {
    if (!askBusy) {
      setAskElapsedMs(null);
      return;
    }
    const startedAt = askStartRef.current ?? Date.now();
    askStartRef.current = startedAt;
    setAskElapsedMs(0);
    const timer = setInterval(() => {
      setAskElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [askBusy]);

  useEffect(() => {
    if (!askBusy || !askLiveSessionId || !askLiveTraceId) return undefined;
    const startedAt = askStartRef.current ?? Date.now();
    const handleEvent = (event: ToolLogEvent) => {
      if (!event) return;
      const hasSessionFilter = Boolean(askLiveSessionId);
      if (hasSessionFilter && event.sessionId && event.sessionId !== askLiveSessionId) return;
      if (askLiveTraceId && event.traceId && event.traceId !== askLiveTraceId) return;
      const toolName = (event.tool ?? "").trim();
      const isHelixTool = toolName.startsWith("helix.ask");
      const isLocalTool =
        toolName.startsWith("llm.local") ||
        toolName.startsWith("llm.http") ||
        toolName.startsWith("luma.");
      if (!isHelixTool && !hasSessionFilter) return;
      if (!isHelixTool && hasSessionFilter && !isLocalTool && event.sessionId !== askLiveSessionId) {
        return;
      }
      const eventTs =
        typeof event.ts === "number"
          ? event.ts
          : typeof event.ts === "string"
            ? Date.parse(event.ts)
            : undefined;
      if (typeof eventTs === "number" && Number.isFinite(eventTs) && eventTs < startedAt - 500) {
        return;
      }
      if (toolName === "helix.ask.stream") {
        const chunk = (event.text ?? "").toString();
        if (!chunk.trim()) return;
        askLiveDraftBufferRef.current = `${askLiveDraftBufferRef.current}${chunk}`;
        if (askLiveDraftBufferRef.current.length > 4000) {
          askLiveDraftBufferRef.current = askLiveDraftBufferRef.current.slice(-4000);
        }
        askLiveDraftRef.current = askLiveDraftBufferRef.current;
        scheduleLiveDraftFlush();
        return;
      }
      let text = (event.message ?? event.text ?? "").toString().trim();
      if (!text && event.stage) {
        text = event.detail ? `${event.stage}: ${event.detail}` : event.stage;
      }
      if (!text) {
        text = toolName || "Helix Ask update";
      }
      text = clipText(text, HELIX_ASK_LIVE_EVENT_MAX_CHARS);
      if (!text) return;
      setAskStatus(text);
      setAskLiveEvents((prev) => {
        const id = event.id ?? String(event.seq ?? Date.now());
        if (prev.some((entry) => entry.id === id)) return prev;
        const next = [
          ...prev,
          {
            id,
            text,
            tool: toolName || undefined,
            ts: event.ts,
            durationMs:
              typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
                ? event.durationMs
                : undefined,
          },
        ];
        const clipped = next.slice(-HELIX_ASK_LIVE_EVENT_LIMIT);
        askLiveEventsRef.current = clipped;
        return clipped;
      });
    };
    const unsubscribe = subscribeToolLogs(handleEvent, {
      sessionId: askLiveSessionId ?? undefined,
      traceId: askLiveTraceId ?? undefined,
      limit: 200,
    });
    return () => unsubscribe();
  }, [askBusy, askLiveSessionId, askLiveTraceId, scheduleLiveDraftFlush]);

  const askLiveStatusText = useMemo(() => {
    const statusTrimmed = askStatus?.trim() ?? "";
    if (!askBusy) {
      return statusTrimmed || null;
    }
    const statusIsGenerating = !statusTrimmed || /^generating/i.test(statusTrimmed);
    const lastEventText = askLiveEvents[askLiveEvents.length - 1]?.text?.trim();
    if (lastEventText) {
      return lastEventText;
    }
    const draftTail = askLiveDraft.trim();
    if (draftTail && statusIsGenerating) {
      const normalized = draftTail.replace(/\s+/g, " ").trim();
      if (normalized) {
        const snippet = normalized.slice(-160);
        return normalized.length > snippet.length
          ? `Streaming: ...${snippet}`
          : `Streaming: ${snippet}`;
      }
    }
    return statusTrimmed || null;
  }, [askBusy, askLiveDraft, askLiveEvents, askStatus]);

  const parseQueuedQuestions = useCallback((value: string): string[] => {
    if (!value) return [];
    return value
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, []);

  const resolveReplyEvents = useCallback((reply: HelixAskReply): AskLiveEventEntry[] => {
    if (reply.liveEvents && reply.liveEvents.length > 0) {
      return reply.liveEvents;
    }
    const debugEvents = reply.debug?.live_events;
    if (!debugEvents || debugEvents.length === 0) {
      return [];
    }
    return debugEvents.map((entry, index) => {
      const fallbackLabel = `${entry.stage}${entry.detail ? ` - ${entry.detail}` : ""}`.trim();
      const text = entry.text?.trim() || fallbackLabel || "Helix Ask update";
      return {
        id: `${reply.id}-debug-${index}`,
        text,
        tool: entry.tool,
        ts: entry.ts,
        durationMs: entry.durationMs,
      };
    });
  }, []);


  const extractObjectiveSignals = useCallback((events: AskLiveEventEntry[]) => {
    const objective = events.find((event) => /objective/i.test(event.text));
    const gaps = events
      .filter((event) => /gap/i.test(event.text))
      .map((event) => event.text)
      .sort((a, b) => a.localeCompare(b));
    const suppression = events.find((event) => /suppress/i.test(event.text) || /context_ineligible|dedupe_cooldown|mission_rate_limited/.test(event.text));
    return {
      objective: objective?.text ?? null,
      gaps: gaps.slice(0, 3),
      suppression: suppression?.text ?? null,
    };
  }, []);

  const resumePendingAsk = useCallback(
    async (pending: PendingHelixAskJob) => {
      if (!pending.jobId) return;
      const questionText = pending.question?.trim() ?? "";
      setAskBusy(true);
      setAskStatus("Reconnecting to previous answer...");
      setAskError(null);
      setAskLiveEvents([]);
      askLiveEventsRef.current = [];
      setAskLiveDraft("");
      askLiveDraftRef.current = "";
      askLiveDraftBufferRef.current = "";
      clearLiveDraftFlush();
      askStartRef.current = Date.now();
      setAskElapsedMs(0);
      setAskActiveQuestion(questionText || null);
      if (questionText) {
        clearMoodTimer();
        cancelMoodHint();
        updateMoodFromText(questionText);
        requestMoodHint(questionText, { force: true });
      }
      const sessionId = pending.sessionId ?? getHelixAskSessionId();
      const traceId = pending.traceId ?? `ask:${crypto.randomUUID()}`;
      setAskLiveSessionId(sessionId ?? null);
      setAskLiveTraceId(traceId);
      if (sessionId) {
        setActive(sessionId);
      }

      const controller = new AbortController();
      askAbortRef.current = controller;
      const runId = ++askRunIdRef.current;
      let skipReply = false;

      try {
        let responseText = "";
        let responseDebug: HelixAskReply["debug"];
        let responsePromptIngested: boolean | undefined;
        let responseEnvelope: HelixAskResponseEnvelope | undefined;
        let responseViewerLaunch: AtomicViewerLaunch | undefined;
        let responseMode: "read" | "observe" | "act" | "verify" | undefined;
        let responseProof: HelixAskReply["proof"];
        try {
          const localResponse = await resumeHelixAskJob(pending.jobId, {
            signal: controller.signal,
          });
          responseEnvelope = localResponse.envelope;
          const envelopeAnswer = responseEnvelope?.answer?.trim() ?? "";
          responseText = envelopeAnswer
            ? envelopeAnswer
            : stripPromptEcho(localResponse.text ?? "", questionText);
          responseDebug = localResponse.debug;
          responsePromptIngested = localResponse.prompt_ingested;
          responseViewerLaunch = localResponse.viewer_launch;
          responseMode = localResponse.mode;
          responseProof = localResponse.proof;
        } catch (error) {
          const aborted =
            controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
          if (aborted) {
            skipReply = true;
            setAskStatus("Generation stopped.");
          } else {
            const message = error instanceof Error ? error.message : String(error);
            const streamedFallback = askLiveDraftRef.current.trim();
            responseText = streamedFallback || message || "Request failed.";
          }
        }
        if (!skipReply) {
          if (!responseText) {
            responseText = "No response returned.";
          }
          launchAtomicViewer(responseViewerLaunch);
          updateMoodFromText(responseText);
          requestMoodHint(responseText, { force: true });
          const replyId = crypto.randomUUID();
          const liveEventsSnapshot = [...askLiveEventsRef.current];
          setAskReplies((prev) =>
            [
              {
                id: replyId,
                content: responseText,
                question: questionText || "Previous request",
                debug: responseDebug,
                promptIngested: responsePromptIngested,
                envelope: responseEnvelope,
                mode: responseMode,
                proof: responseProof,
                sources: responseDebug?.context_files ?? responseDebug?.prompt_context_files ?? [],
                liveEvents: liveEventsSnapshot,
              },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
        }
      } finally {
        if (askRunIdRef.current === runId) {
          setAskBusy(false);
          setAskStatus(null);
          setAskLiveSessionId(null);
          setAskLiveTraceId(null);
          setAskLiveDraft("");
          askLiveDraftRef.current = "";
          askLiveDraftBufferRef.current = "";
          clearLiveDraftFlush();
          setAskActiveQuestion(null);
        }
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
      }
    },
    [
      addMessage,
      cancelMoodHint,
      clearLiveDraftFlush,
      clearMoodTimer,
      getHelixAskSessionId,
      launchAtomicViewer,
      requestMoodHint,
      setActive,
      updateMoodFromText,
    ],
  );

  useEffect(() => {
    if (askBusy) return;
    if (resumeAttemptedRef.current) return;
    const pending = getPendingHelixAskJob();
    if (!pending) return;
    resumeAttemptedRef.current = true;
    void resumePendingAsk(pending);
  }, [askBusy, resumePendingAsk]);

  const runAsk = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      setAskBusy(true);
      setAskStatus("Interpreting prompt...");
      setAskError(null);
      setAskLiveEvents([]);
      askLiveEventsRef.current = [];
      setAskLiveDraft("");
      askLiveDraftRef.current = "";
      askLiveDraftBufferRef.current = "";
      clearLiveDraftFlush();
      askStartRef.current = Date.now();
      setAskElapsedMs(0);
      setAskActiveQuestion(trimmed);
      if (askInputRef.current) {
        askInputRef.current.value = "";
        resizeTextarea();
      }
      askDraftRef.current = "";
      clearMoodTimer();
      cancelMoodHint();
      updateMoodFromText(trimmed);
      requestMoodHint(trimmed, { force: true });
      const sessionId = getHelixAskSessionId();
      const traceId = `ask:${crypto.randomUUID()}`;
      setAskLiveSessionId(sessionId ?? null);
      setAskLiveTraceId(traceId);
      if (sessionId) {
        setActive(sessionId);
        addMessage(sessionId, { role: "user", content: trimmed });
      }

      const controller = new AbortController();
      askAbortRef.current = controller;
      const runId = ++askRunIdRef.current;
      let skipReply = false;

      try {
        let responseText = "";
        let responseDebug: HelixAskReply["debug"];
        let responsePromptIngested: boolean | undefined;
        let responseEnvelope: HelixAskResponseEnvelope | undefined;
        let responseViewerLaunch: AtomicViewerLaunch | undefined;
        let responseMode: "read" | "observe" | "act" | "verify" | undefined;
        let responseProof: HelixAskReply["proof"];
        setAskStatus("Generating answer...");
        try {
          const localResponse = await askLocal(undefined, {
            sessionId: sessionId ?? undefined,
            traceId,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
            question: trimmed,
            debug: userSettings.showHelixAskDebug,
            signal: controller.signal,
            mode: askMode,
          });
          responseEnvelope = localResponse.envelope;
          const envelopeAnswer = responseEnvelope?.answer?.trim() ?? "";
          responseText = envelopeAnswer
            ? envelopeAnswer
            : stripPromptEcho(localResponse.text ?? "", trimmed);
          responseDebug = localResponse.debug;
          responsePromptIngested = localResponse.prompt_ingested;
          responseViewerLaunch = localResponse.viewer_launch;
          responseMode = localResponse.mode;
          responseProof = localResponse.proof;
        } catch (error) {
          const aborted =
            controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
          if (aborted) {
            skipReply = true;
            setAskStatus("Generation stopped.");
          } else {
            const message = error instanceof Error ? error.message : String(error);
            const streamedFallback = askLiveDraftRef.current.trim();
            responseText = streamedFallback || message || "Request failed.";
          }
        }
        if (!skipReply) {
          if (!responseText) {
            responseText = "No response returned.";
          }
          launchAtomicViewer(responseViewerLaunch);
          updateMoodFromText(responseText);
          requestMoodHint(responseText, { force: true });
          const replyId = crypto.randomUUID();
          const liveEventsSnapshot = [...askLiveEventsRef.current];
          setAskReplies((prev) =>
            [
              {
                id: replyId,
                content: responseText,
                question: trimmed,
                debug: responseDebug,
                promptIngested: responsePromptIngested,
                envelope: responseEnvelope,
                mode: responseMode,
                proof: responseProof,
                sources: responseDebug?.context_files ?? responseDebug?.prompt_context_files ?? [],
                liveEvents: liveEventsSnapshot,
              },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
        }
      } finally {
        if (askRunIdRef.current === runId) {
          setAskBusy(false);
          setAskStatus(null);
          setAskLiveSessionId(null);
          setAskLiveTraceId(null);
          setAskLiveDraft("");
          askLiveDraftRef.current = "";
          askLiveDraftBufferRef.current = "";
          clearLiveDraftFlush();
          setAskActiveQuestion(null);
        }
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
      }
    },
    [
      addMessage,
      askBusy,
      cancelMoodHint,
      clearLiveDraftFlush,
      clearMoodTimer,
      getHelixAskSessionId,
      launchAtomicViewer,
      requestMoodHint,
      resizeTextarea,
      setActive,
      updateMoodFromText,
      userSettings.showHelixAskDebug,
    ],
  );

  useEffect(() => {
    if (askBusy || askQueue.length === 0) return;
    const next = askQueue[0];
    setAskQueue((prev) => prev.slice(1));
    void runAsk(next);
  }, [askBusy, askQueue, runAsk]);

  const handleStop = useCallback(() => {
    if (askAbortRef.current) {
      askAbortRef.current.abort();
    }
    setAskStatus("Stopping...");
  }, []);

  const handleAskSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const rawInput = askInputRef.current?.value ?? "";
      const entries = parseQueuedQuestions(rawInput);
      if (entries.length === 0) return;
      const panelCommand = entries.length === 1 ? parseOpenPanelCommand(entries[0]) : null;
      if (panelCommand) {
        const panelDef = getPanelDef(panelCommand);
        if (askInputRef.current) {
          askInputRef.current.value = "";
          resizeTextarea();
        }
        askDraftRef.current = "";
        clearMoodTimer();
        cancelMoodHint();
        updateMoodFromText(entries[0]);
        requestMoodHint(entries[0], { force: true });
        const sessionId = getHelixAskSessionId();
        if (sessionId) {
          setActive(sessionId);
          addMessage(sessionId, { role: "user", content: entries[0] });
        }
        if (panelDef) {
          openPanelById(panelCommand);
          const replyId = crypto.randomUUID();
          const responseText = `Opened ${panelDef.title}.`;
          setAskReplies((prev) =>
            [
              { id: replyId, content: responseText, question: entries[0] },
              ...prev,
            ].slice(0, 3),
          );
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: responseText });
          }
        } else {
          setAskError("Panel not found.");
          if (sessionId) {
            addMessage(sessionId, { role: "assistant", content: "Error: Panel not found." });
          }
        }
        return;
      }
      if (askInputRef.current) {
        askInputRef.current.value = "";
        resizeTextarea();
      }
      askDraftRef.current = "";
      if (askBusy) {
        setAskQueue((prev) => {
          const combined = [...prev, ...entries];
          return combined.slice(0, HELIX_ASK_QUEUE_LIMIT);
        });
        return;
      }
      const [first, ...rest] = entries;
      if (rest.length > 0) {
        setAskQueue((prev) => {
          const combined = [...prev, ...rest];
          return combined.slice(0, HELIX_ASK_QUEUE_LIMIT);
        });
      }
      void runAsk(first);
    },
    [
      addMessage,
      cancelMoodHint,
      clearMoodTimer,
      getHelixAskSessionId,
      openPanelById,
      parseQueuedQuestions,
      requestMoodHint,
      resizeTextarea,
      setActive,
      updateMoodFromText,
      runAsk,
      userSettings.showHelixAskDebug,
    ],
  );

  const maxWidthClass = maxWidthClassName ?? "max-w-4xl";
  const inputPlaceholder = placeholder ?? "Ask anything about this system";
  const currentPlaceholder = askBusy ? "Add another question..." : inputPlaceholder;

  const emitContextLifecycle = useCallback((event: ContextLifecycleEvent) => {
    setContextSessionState(event.sessionState);
  }, []);

  const startContextSession = useCallback(async () => {
    if (contextSessionStartInFlightRef.current) return;
    if (!canStartContextSession({ tier: missionContextControls.tier, sessionState: contextSessionState })) return;
    contextSessionStartInFlightRef.current = true;
    const stream = await startDesktopTier1ScreenSession(emitContextLifecycle);
    contextSessionStartInFlightRef.current = false;
    if (!stream) {
      contextSessionStreamRef.current = null;
      return;
    }
    contextSessionStreamRef.current = stream;
    for (const track of stream.getTracks()) {
      track.addEventListener(
        "ended",
        () => {
          if (contextSessionStreamRef.current === stream) {
            contextSessionStreamRef.current = null;
            setContextSessionState("idle");
          }
        },
        { once: true },
      );
    }
  }, [contextSessionState, emitContextLifecycle, missionContextControls.tier]);

  const stopContextSession = useCallback(() => {
    const stream = contextSessionStreamRef.current;
    if (!stream && contextSessionState === "idle") return;
    stopDesktopTier1ScreenSession(stream, emitContextLifecycle);
    contextSessionStreamRef.current = null;
    contextSessionStartInFlightRef.current = false;
  }, [contextSessionState, emitContextLifecycle]);

  useEffect(() => {
    writeMissionContextControls(missionContextControls);
  }, [missionContextControls]);

  useEffect(() => {
    if (missionContextControls.tier !== "tier0") return;
    stopContextSession();
    setContextSessionState("idle");
  }, [missionContextControls.tier, stopContextSession]);

  useEffect(() => {
    return () => {
      const stream = contextSessionStreamRef.current;
      contextSessionStreamRef.current = null;
      for (const track of stream?.getTracks?.() ?? []) {
        track.stop();
      }
      contextSessionStartInFlightRef.current = false;
    };
  }, []);

  const contextSessionBadge =
    contextSessionState === "active"
      ? "LIVE"
      : contextSessionState === "requesting"
        ? "REQUESTING"
        : contextSessionState === "stopping"
          ? "STOPPING"
          : contextSessionState === "error"
            ? "ERROR"
            : "IDLE";

  const queuePreview = useMemo(() => {
    const preview = askQueue.slice(0, 3).map((entry) => clipText(entry, 80));
    const remainder = Math.max(0, askQueue.length - preview.length);
    return { preview, remainder };
  }, [askQueue]);

  return (
    <HelixAskErrorBoundary>
      <div className={className}>
        <form className={`w-full ${maxWidthClass}`} onSubmit={handleAskSubmit}>
        <div
          className={`relative overflow-hidden rounded-3xl border bg-slate-950/80 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur ${moodPalette.surfaceBorder}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 ${moodPalette.surfaceTint}`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-0 ${moodPalette.surfaceHalo}`}
            aria-hidden
          />
          <div className="relative">
            {isOffline ? (
              <div className="px-4 pt-3 text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
                Offline - reconnecting
              </div>
            ) : null}
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border ${moodPalette.aura}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/45 ring-1 ring-inset ${moodRingClass}`}
                >
                  {moodSrc ? (
                    <img
                      src={moodSrc}
                      alt={`${moodLabel} mood`}
                      className="h-9 w-9 object-contain"
                      loading="lazy"
                      onError={() => setAskMoodBroken(true)}
                    />
                  ) : (
                    <BrainCircuit
                      className="h-5 w-5 text-slate-100/90"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            <select
              value={askMode}
              onChange={(event) => setAskMode(event.target.value as "read" | "observe" | "act" | "verify")}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-slate-200"
              aria-label="Ask mode"
            >
              <option value="read">read</option>
              <option value="observe">observe</option>
              <option value="act">act</option>
              <option value="verify">verify</option>
            </select>
            <textarea
              aria-label="Ask Helix"
              aria-disabled={askBusy}
              className="flex-1 resize-none bg-transparent text-[16px] leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none sm:text-sm"
              ref={askInputRef}
              placeholder={currentPlaceholder}
              rows={1}
              onInput={(event) => {
                resizeTextarea(event.currentTarget);
                askDraftRef.current = event.currentTarget.value;
                if (askBusy) return;
                clearMoodTimer();
                askMoodTimerRef.current = window.setTimeout(() => {
                  askMoodTimerRef.current = null;
                  const trimmed = askDraftRef.current.trim();
                  if (trimmed) {
                    updateMoodFromText(trimmed);
                    requestMoodHint(trimmed);
                  }
                }, 900);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit?.();
                }
              }}
            />
            <button
              aria-label={askBusy ? "Stop generation" : "Submit prompt"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60"
              onClick={askBusy ? handleStop : undefined}
              type={askBusy ? "button" : "submit"}
            >
              {askBusy ? <Square className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
            <div className="-mt-1 px-4 pb-2 text-[10px] text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="uppercase tracking-[0.2em] text-slate-500">Dot context</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  {missionContextControls.tier === "tier1" ? "Tier 1" : "Tier 0"}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  {contextSessionBadge}
                </span>
                {missionContextControls.tier === "tier1" ? (
                  <span className="rounded-full border border-cyan-300/30 px-2 py-0.5 text-cyan-200">screen</span>
                ) : null}
                <label className="ml-auto flex items-center gap-1">
                  <span className="text-slate-400">tier</span>
                  <select
                    value={missionContextControls.tier}
                    onChange={(event) =>
                      setMissionContextControls((prev) => ({
                        ...prev,
                        tier: event.target.value as MissionContextTier,
                      }))
                    }
                    className="rounded border border-white/10 bg-black/30 px-1 py-0.5 text-[10px] text-slate-200"
                  >
                    <option value="tier0">tier0</option>
                    <option value="tier1">tier1</option>
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-slate-400">voice</span>
                  <select
                    value={missionContextControls.voiceMode}
                    onChange={(event) =>
                      setMissionContextControls((prev) => ({
                        ...prev,
                        voiceMode: event.target.value as MissionVoiceMode,
                      }))
                    }
                    className="rounded border border-white/10 bg-black/30 px-1 py-0.5 text-[10px] text-slate-200"
                  >
                    <option value="off">off</option>
                    <option value="critical_only">critical_only</option>
                    <option value="normal">normal</option>
                    <option value="dnd">dnd</option>
                  </select>
                </label>
                <label className="flex items-center gap-1 text-slate-300">
                  <input
                    type="checkbox"
                    checked={missionContextControls.muteWhileTyping}
                    onChange={(event) =>
                      setMissionContextControls((prev) => ({ ...prev, muteWhileTyping: event.target.checked }))
                    }
                  />
                  mute while typing
                </label>
                <button
                  type="button"
                  className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-300"
                  onClick={() => {
                    if (contextSessionState === "active" || contextSessionState === "requesting") {
                      stopContextSession();
                      return;
                    }
                    void startContextSession();
                  }}
                  disabled={missionContextControls.tier !== "tier1" || contextSessionState === "stopping"}
                >
                  {contextSessionState === "active" || contextSessionState === "requesting" ? "stop" : "start"}
                </button>
              </div>
            </div>
          {askBusy ? (
            <div
              className={`relative overflow-hidden border-t px-4 py-2 text-[11px] text-slate-300 ${moodPalette.liveBorder}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-70 ${moodPalette.replyTint}`}
                aria-hidden
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Live
                  </span>
                  <span className="text-slate-200">
                    {askLiveStatusText ?? "Working..."}
                  </span>
                  {askElapsedMs !== null ? (
                    <span className="text-slate-500">
                      ({Math.round(askElapsedMs / 1000)}s)
                    </span>
                  ) : null}
                </div>
                {askActiveQuestion ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Now
                    </span>{" "}
                    {clipText(askActiveQuestion, 140)}
                  </p>
                ) : null}
                {askQueue.length > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Queue ({askQueue.length})
                    </span>{" "}
                    {queuePreview.preview.join(" | ")}
                    {queuePreview.remainder > 0
                      ? ` +${queuePreview.remainder} more`
                      : ""}
                  </p>
                ) : null}
                {askLiveEvents.length > 0 ? (
                  <div className="mt-2 max-h-40 space-y-2 overflow-hidden pr-1 text-[11px] text-slate-300">
                    {askLiveEvents.map((entry) => {
                      const label = entry.tool?.startsWith("helix.ask.")
                        ? entry.tool.replace("helix.ask.", "").replace(/\./g, " ")
                        : entry.tool ?? "event";
                      return (
                        <div
                          key={entry.id}
                          className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-1"
                        >
                          <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
                            {label}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-slate-300">{entry.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Waiting for updates...
                  </p>
                )}
                {askLiveDraft ? (
                  <div className="mt-2 max-h-28 overflow-hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
                    <p className="whitespace-pre-wrap leading-relaxed">{askLiveDraft}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        </div>
        </form>
        {askError ? (
          <p className="mt-3 text-xs text-rose-200">{askError}</p>
        ) : null}
        {askReplies.length > 0 ? (
          <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-2">
          {askReplies.map((reply) => {
            const replyEvents = resolveReplyEvents(reply);
            const expanded = Boolean(askExpandedByReply[reply.id]);
            return (
              <div
                  key={reply.id}
                  className={`relative overflow-hidden rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur ${moodPalette.replyBorder}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 opacity-80 ${moodPalette.replyTint}`}
                    aria-hidden
                  />
                  <div className="relative">
                {reply.question ? (
                  <p className="mb-2 text-xs text-slate-300">
                    <span className="text-slate-400">Question:</span> {reply.question}
                  </p>
                ) : null}
                {renderHelixAskEnvelope(reply)}
                {(() => {
                  const objectiveSignals = extractObjectiveSignals(replyEvents);
                  if (!objectiveSignals.objective && objectiveSignals.gaps.length === 0 && !objectiveSignals.suppression) return null;
                  return (
                    <div className="mt-2 rounded-lg border border-indigo-400/20 bg-indigo-950/20 px-3 py-2 text-xs text-indigo-100">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300">Objective-first situational view</p>
                      {objectiveSignals.objective ? <p className="mt-1">Objective: {objectiveSignals.objective}</p> : null}
                      {objectiveSignals.gaps.length > 0 ? <p className="mt-1">Top unresolved gaps: {objectiveSignals.gaps.join(" · ")}</p> : null}
                      <p className="mt-1">Suppression inspector: {objectiveSignals.suppression ?? "not suppressed"}</p>
                    </div>
                  );
                })()}
                {reply.proof ? (
                  <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Proof</p>
                    <p className="mt-1">Mode: {reply.mode ?? "read"} · Verdict: {reply.proof.verdict ?? "n/a"}</p>
                    {reply.proof.certificate?.certificateHash ? (
                      <p className="mt-1">Certificate: {reply.proof.certificate.certificateHash}</p>
                    ) : null}
                    {typeof reply.proof.certificate?.integrityOk === "boolean" ? (
                      <p className="mt-1">Integrity: {reply.proof.certificate.integrityOk ? "OK" : "FAILED"}</p>
                    ) : null}
                    {reply.proof.artifacts?.length ? (
                      <p className="mt-1 whitespace-pre-wrap">
                        Artifacts: {reply.proof.artifacts.map((a) => `${a.kind}: ${a.ref}`).join(", ")}
                      </p>
                    ) : null}
                  </div>
              ) : null}
              {userSettings.showHelixAskDebug &&
              (reply.sources?.length || reply.debug?.context_files?.length || reply.debug?.prompt_context_files?.length) ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Context sources
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {(reply.sources?.length
                      ? reply.sources
                      : reply.debug?.context_files ?? reply.debug?.prompt_context_files ?? []
                    )
                      .filter(Boolean)
                      .slice(0, 12)
                      .join("\n")}
                  </p>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  Saved in Helix Console
                  {reply.promptIngested ? " · Prompt ingested" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyReply(reply)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-200"
                    aria-label="Copy response"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReadAloud(reply)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-200"
                    aria-label="Read aloud"
                  >
                    Read aloud ({readAloudByReply[reply.id] ?? "idle"})
                  </button>
                  {onOpenConversation ? (
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                      onClick={handleOpenConversationPanel}
                      type="button"
                    >
                      Open conversation
                    </button>
                  ) : null}
                </div>
              </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </HelixAskErrorBoundary>
  );
}
