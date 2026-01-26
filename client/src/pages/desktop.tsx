import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Search, Settings } from "lucide-react";
import { panelRegistry, getPanelDef, type PanelDefinition } from "@/lib/desktop/panelRegistry";
import { useDesktopStore } from "@/store/useDesktopStore";
import { DesktopWindow } from "@/components/desktop/DesktopWindow";
import { DesktopTaskbar } from "@/components/desktop/DesktopTaskbar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelixSettingsDialogContent } from "@/components/HelixSettingsDialogContent";
import SplashCursor from "@/components/SplashCursor";
import {
  PROFILE_STORAGE_KEY,
  useHelixStartSettings,
  type SettingsTab
} from "@/hooks/useHelixStartSettings";
import { decodeLayout, resolvePanelIds, type DesktopLayoutHash } from "@/lib/desktop/shareState";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { askLocal, execute, plan, searchCodeLattice } from "@/lib/agi/api";
import { fetchUiPreferences, type EssenceEnvironmentContext, type UiPreference } from "@/lib/agi/preferences";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import type { ResonanceBundle, ResonanceCollapse, ResonancePatch } from "@shared/code-lattice";
import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";

const LAYOUT_COLLECTION_KEYS = ["panels", "windows", "openPanels", "items", "children", "columns", "stack", "slots"];
const MAX_LAYOUT_DEPTH = 5;
const PENDING_PANEL_KEY = "helix:pending-panel";
const NOISE_GENS_PANEL_ID = "helix-noise-gens";
const ESSENCE_CONSOLE_PANEL_ID = "agi-essence-console";
const NOISE_GENS_AUTO_OPEN_SUPPRESS = new Set([ESSENCE_CONSOLE_PANEL_ID]);
const HELIX_ASK_CONTEXT_ID = "helix-ask-desktop";
const HELIX_ASK_KNOWLEDGE_FLAG = String(
  (import.meta as any)?.env?.VITE_HELIX_ASK_USE_KNOWLEDGE ?? "",
).trim();
const HELIX_ASK_USE_KNOWLEDGE =
  HELIX_ASK_KNOWLEDGE_FLAG.length === 0 ? true : HELIX_ASK_KNOWLEDGE_FLAG === "1";
const HELIX_ASK_MODE = (
  String((import.meta as any)?.env?.VITE_HELIX_ASK_MODE ?? "").trim().toLowerCase() || "grounded"
);
const HELIX_ASK_USE_PLAN = HELIX_ASK_MODE !== "local";
const HELIX_ASK_USE_EXECUTE = HELIX_ASK_MODE === "execute";
const HELIX_ASK_MAX_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_TOKENS, 2048),
  64,
  4096,
);
const HELIX_ASK_CONTEXT_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_TOKENS, 2048),
  512,
  8192,
);
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
const HELIX_ASK_PROMPT_BUDGET_TOKENS = Math.max(
  256,
  HELIX_ASK_CONTEXT_TOKENS - HELIX_ASK_OUTPUT_TOKENS - 128,
);
const HELIX_ASK_CONTEXT_FILES = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_FILES, 48),
  2,
  48,
);
const HELIX_ASK_PATCH_CONTEXT_FILES = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_PATCH_FILES, 12),
  2,
  24,
);
const HELIX_ASK_SEARCH_FALLBACK =
  String((import.meta as any)?.env?.VITE_HELIX_ASK_SEARCH_FALLBACK ?? "1").trim() !== "0";
const HELIX_ASK_CONTEXT_CHARS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_CONTEXT_CHARS, 2400),
  120,
  2400,
);
const HELIX_ASK_SEARCH_QUERY_LIMIT = 10;
const HELIX_ASK_PATH_REGEX =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|md|json|js|cjs|mjs|py|yml|yaml)/g;
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

function estimateTokens(value: string): number {
  return Math.ceil(value.length / 4);
}

function trimToTokenBudget(value: string, budget: number): string {
  if (budget <= 0) return "";
  const maxChars = Math.max(0, Math.floor(budget * 4));
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars).trimEnd();
}

function ensureFinalMarker(value: string): string {
  if (!value.trim()) return "FINAL:";
  if (value.includes("FINAL:")) {
    return value;
  }
  return `${value.trimEnd()}\n\nFINAL:`;
}

const HELIX_ASK_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "does",
  "for",
  "how",
  "in",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "system",
  "solve",
  "solves",
  "solver",
  "solution",
]);

const HELIX_ASK_WARP_TOKENS = new Set([
  "warp",
  "bubble",
  "alcubierre",
  "natario",
  "geometry",
  "metric",
  "sdf",
]);
const HELIX_ASK_SOLVER_PATH_BOOSTS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /modules\/warp/i, boost: 8 },
  { pattern: /(natario-warp|warp-module|warp-theta)/i, boost: 6 },
  { pattern: /(warp-pipeline|energy-pipeline)/i, boost: 4 },
];

function extractHelixAskTokens(question: string): string[] {
  const normalized = normalizeHelixAskQuery(question);
  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !HELIX_ASK_STOPWORDS.has(token));
  const hasWarpFocus = tokens.some((token) => HELIX_ASK_WARP_TOKENS.has(token));
  if (!hasWarpFocus) return tokens;
  const focused = tokens.filter((token) => HELIX_ASK_WARP_TOKENS.has(token));
  return focused.length ? focused : tokens;
}

function scoreResonancePatch(patch: ResonancePatch, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const summary = `${patch.summary ?? ""} ${patch.label ?? ""} ${patch.mode ?? ""}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (summary.includes(token)) score += 2;
  }
  for (const file of patch.knowledge?.files ?? []) {
    const haystack = `${file.path ?? ""} ${file.name ?? ""} ${file.preview ?? ""}`.toLowerCase();
    for (const token of tokens) {
      if (haystack.includes(token)) score += 3;
    }
  }
  return score;
}

function scoreHelixAskFile(file: KnowledgeFileAttachment, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const haystack = `${file.path ?? ""} ${file.name ?? ""} ${file.preview ?? ""}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
  }
  const hasWarpFocus = tokens.some((token) => HELIX_ASK_WARP_TOKENS.has(token));
  if (hasWarpFocus) {
    const path = `${file.path ?? ""} ${file.name ?? ""}`.toLowerCase();
    for (const { pattern, boost } of HELIX_ASK_SOLVER_PATH_BOOSTS) {
      if (pattern.test(path)) score += boost;
    }
  }
  return score;
}

function selectHelixAskFiles(
  files: KnowledgeFileAttachment[],
  tokens: string[],
  limit: number,
  requireMatch = false,
): KnowledgeFileAttachment[] {
  if (!files.length) return [];
  if (tokens.length === 0) return files.slice(0, limit);
  const scored = files
    .map((file) => ({ file, score: scoreHelixAskFile(file, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return requireMatch ? [] : files.slice(0, limit);
  }
  return scored.slice(0, limit).map((entry) => entry.file);
}

function pickResonancePatch(
  bundle?: ResonanceBundle | null,
  selection?: ResonanceCollapse | null,
  question?: string,
): ResonancePatch | null {
  const candidates = bundle?.candidates ?? [];
  if (candidates.length === 0) return null;
  const preferredId = selection?.primaryPatchId;
  const preferred = preferredId
    ? candidates.find((patch) => patch.id === preferredId)
    : null;
  const tokens = question ? extractHelixAskTokens(question) : [];
  if (tokens.length > 0) {
    let best = preferred ?? candidates[0];
    let bestScore = best ? scoreResonancePatch(best, tokens) : 0;
    for (const candidate of candidates) {
      const candidateScore = scoreResonancePatch(candidate, tokens);
      if (candidateScore > bestScore) {
        best = candidate;
        bestScore = candidateScore;
      }
    }
    if (best && bestScore > 0) return best;
  }
  if (preferred) return preferred;
  return candidates[0] ?? null;
}

function collectKnowledgeFiles(projects: KnowledgeProjectExport[], limit: number): KnowledgeFileAttachment[] {
  const files: KnowledgeFileAttachment[] = [];
  const seen = new Set<string>();
  for (const project of projects) {
    for (const file of project.files ?? []) {
      const key = file.path || file.name;
      if (!key || seen.has(key)) continue;
      if (!file.preview) continue;
      files.push(file);
      seen.add(key);
      if (files.length >= limit) return files;
    }
  }
  return files;
}

function collectHelixAskKnowledgeFiles(
  projects: KnowledgeProjectExport[],
  limit: number,
  tokens: string[],
  requireMatch = false,
): KnowledgeFileAttachment[] {
  const files = collectKnowledgeFiles(projects, limit);
  return selectHelixAskFiles(files, tokens, limit, requireMatch);
}

function formatKnowledgeFile(file: KnowledgeFileAttachment, index: number): string {
  const label = file.path || file.name;
  const preview = clipText(file.preview, HELIX_ASK_CONTEXT_CHARS);
  if (!preview) {
    return `(${index + 1}) ${label}`;
  }
  return `(${index + 1}) ${label}\n${preview}`;
}

function buildGroundedPrompt(
  question: string,
  args: {
    resonanceBundle?: ResonanceBundle | null;
    resonanceSelection?: ResonanceCollapse | null;
    knowledgeContext?: KnowledgeProjectExport[];
  },
): string {
  const sections: string[] = [];
  const patch = pickResonancePatch(
    args.resonanceBundle,
    args.resonanceSelection,
    question,
  );
  const patchTokens = extractHelixAskTokens(question);
  const requireMatch = patchTokens.length > 0;
  const patchScore =
    patch && patchTokens.length > 0 ? scoreResonancePatch(patch, patchTokens) : 0;
  let remainingTokens = HELIX_ASK_PROMPT_BUDGET_TOKENS;
  const pushSection = (title: string, body: string) => {
    if (!body.trim()) return;
    const text = `${title}\n${body}`;
    const budgeted = trimToTokenBudget(text, remainingTokens);
    if (!budgeted) return;
    sections.push(budgeted);
    remainingTokens -= estimateTokens(budgeted);
  };

  let patchFilesCount = 0;
  if (
    patch?.knowledge?.files?.length &&
    (patchTokens.length === 0 || patchScore > 0)
  ) {
    const files = selectHelixAskFiles(
      patch.knowledge.files,
      patchTokens,
      HELIX_ASK_PATCH_CONTEXT_FILES,
      requireMatch,
    );
    patchFilesCount = files.length;
    if (patchFilesCount > 0) {
      const formatted = files.map((file, idx) => formatKnowledgeFile(file, idx));
      pushSection(`Resonance patch: ${patch.summary}`, formatted.join("\n\n"));
    }
  }
  const remainingFiles = Math.max(0, HELIX_ASK_CONTEXT_FILES - patchFilesCount);
  if (remainingFiles > 0 && args.knowledgeContext?.length) {
    const knowledgeFiles = collectHelixAskKnowledgeFiles(
      args.knowledgeContext,
      remainingFiles,
      patchTokens,
      requireMatch,
    );
    if (knowledgeFiles.length) {
      const formatted = knowledgeFiles.map((file, idx) => formatKnowledgeFile(file, idx));
      pushSection("Knowledge projects:", formatted.join("\n\n"));
    }
  }
  const contextBlock =
    sections.length > 0 ? sections.join("\n\n") : "No repo context was attached to this request.";
  return [
    "You are Helix Ask, a repo-grounded assistant.",
    "Use only the evidence in the context below. Cite file paths when referencing code.",
    "If the context is insufficient, say what is missing and ask a concise follow-up.",
    "When the context includes solver or calculation functions, summarize the inputs, outputs, and flow before UI details.",
    "When listing multiple points, use a numbered list with one item per line.",
    "Answer with a step-by-step explanation (6-10 steps) and end with a short in-practice walkthrough.",
    "Keep paragraphs short (2-3 sentences) and separate sections with blank lines.",
    "Do not repeat the question or include headings like Question, Context, or Resonance patch.",
    "Do not output tool logs, certificates, command transcripts, or repeat the prompt/context.",
    'Respond with only the answer and prefix it with "FINAL:".',
    "",
    `Question: ${question}`,
    "",
    "Context:",
    contextBlock,
    "",
    "FINAL:",
  ].join("\n");
}

function collectHelixAskSources(
  args: {
    resonanceBundle?: ResonanceBundle | null;
    resonanceSelection?: ResonanceCollapse | null;
    knowledgeContext?: KnowledgeProjectExport[];
  },
  question?: string,
): string[] {
  const sources: string[] = [];
  const seen = new Set<string>();
  const pushSource = (label: string, value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    sources.push(`${label}: ${trimmed}`);
  };
  const patch = pickResonancePatch(
    args.resonanceBundle,
    args.resonanceSelection,
    question,
  );
  const patchTokens = question ? extractHelixAskTokens(question) : [];
  const requireMatch = patchTokens.length > 0;
  const patchScore =
    patch && patchTokens.length > 0 ? scoreResonancePatch(patch, patchTokens) : 0;
  if (patch && (patchTokens.length === 0 || patchScore > 0)) {
    const patchFiles = selectHelixAskFiles(
      patch.knowledge?.files ?? [],
      patchTokens,
      HELIX_ASK_PATCH_CONTEXT_FILES,
      requireMatch,
    );
    for (const file of patchFiles) {
      pushSource("resonance", file.path || file.name);
      if (sources.length >= 12) return sources;
    }
  }
  if (args.knowledgeContext?.length) {
    const knowledgeFiles = collectHelixAskKnowledgeFiles(
      args.knowledgeContext,
      HELIX_ASK_CONTEXT_FILES,
      patchTokens,
      requireMatch,
    );
    for (const file of knowledgeFiles) {
      pushSource("search", file.path || file.name);
      if (sources.length >= 12) return sources;
    }
  }
  return sources;
}

function normalizeHelixAskQuery(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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
  const normalized = normalizeHelixAskQuery(base);
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

  const tokens = new Set(normalized.split(/\s+/).filter(Boolean));
  const mentionsWarp = tokens.has("warp") || normalized.includes("warp");
  const mentionsBubble = tokens.has("bubble");
  const mentionsAlcubierre = tokens.has("alcubierre");
  if (mentionsWarp || mentionsAlcubierre || mentionsBubble) {
    push("warp bubble");
    push("warp module");
    push("energy-pipeline warp");
    push("warp viability");
    push("helix-core warp");
    push("gr-evolve-brick");
    push("warp geometry");
    push("warpBubbleModule");
    push("modules/warp/warp-module.ts");
    push("server/energy-pipeline.ts");
    push("server/helix-core.ts");
    push("calculateNatarioWarpBubble");
    push("alcubierre");
    push("natario");
    push("stress-energy");
    push("gr constraints");
  }
  if (
    tokens.has("solve") ||
    tokens.has("solver") ||
    tokens.has("solution") ||
    normalized.includes("solve")
  ) {
    push("warp solver");
    push("warpBubbleModule.calculate");
    push("constraint gate");
    push("gr evaluation");
    push("energy pipeline");
  }
  if (normalized.includes("time dilation") || normalized.includes("lattice")) {
    push("time dilation lattice");
    push("gr assistant report");
  }

  return queries.slice(0, HELIX_ASK_SEARCH_QUERY_LIMIT);
}

function normalizeQuestionMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanPromptLine(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const stripped = trimmed
    .replace(/^[\"'`.\-–—]+/g, "")
    .replace(/[\"'`.\-–—]+$/g, "")
    .trim();
  return stripped;
}

function stripLeadingQuestion(response: string, question?: string): string {
  const lines = response.split(/\r?\n/);
  const target = question?.trim();
  const targetNormalized = target ? normalizeQuestionMatch(target) : "";
  let startIndex = 0;
  while (startIndex < lines.length) {
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
  const trimmed = stripLeadingQuestion(response.trim(), question);
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
      lowered.startsWith("if the context is insufficient") ||
      lowered.startsWith("do not output tool logs") ||
      lowered.startsWith("do not repeat the question") ||
      lowered.startsWith("question:") ||
      lowered.includes("question:") ||
      lowered.startsWith("context:") ||
      lowered.startsWith("context sources") ||
      lowered.startsWith("resonance patch:") ||
      lowered.startsWith("knowledge projects:") ||
      lowered.startsWith("final:")
    );
  };
  const cleanedLines = trimmed.split(/\r?\n/).filter((line) => !isScaffoldLine(line));
  const cleaned = cleanedLines.join("\n").trim();
  if (cleaned) return cleaned;
  return trimmed;
}

function collectPanelIdsFromStructure(
  input: unknown,
  target: Set<string>,
  depth = 0,
  allowLeaf = false
): void {
  if (input === null || input === undefined || depth > MAX_LAYOUT_DEPTH) {
    return;
  }
  if (typeof input === "string") {
    if (allowLeaf) {
      const trimmed = input.trim();
      if (trimmed) {
        target.add(trimmed);
      }
    }
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((entry) => collectPanelIdsFromStructure(entry, target, depth + 1, true));
    return;
  }
  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (allowLeaf) {
      const candidate =
        typeof record.panelId === "string"
          ? record.panelId
          : typeof record["panel_id"] === "string"
            ? (record["panel_id"] as string)
            : typeof record.panel === "string"
              ? record.panel
              : typeof record.id === "string"
                ? record.id
                : null;
      if (candidate) {
        const trimmed = candidate.trim();
        if (trimmed) {
          target.add(trimmed);
        }
      }
    }
    for (const key of LAYOUT_COLLECTION_KEYS) {
      if (key in record) {
        collectPanelIdsFromStructure(record[key], target, depth + 1, true);
      }
    }
  }
}

export default function DesktopPage() {
  const { windows, registerFromManifest, open } = useDesktopStore();
  const { userSettings, updateSettings } = useHelixStartSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("preferences");
  const { refresh: refreshProjects, selectProjects, projects } = useKnowledgeProjectsStore((state) => ({
    projects: state.projects,
    refresh: state.refresh,
    selectProjects: state.selectProjects,
  }));
  const { exportActiveContext } = useKnowledgeProjectsStore((state) => ({
    exportActiveContext: state.exportActiveContext,
  }));
  const { ensureContextSession, addMessage, setActive } = useAgiChatStore();
  const helixAskSessionRef = useRef<string | null>(null);
  const askInputRef = useRef<HTMLInputElement | null>(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
  const [askReplies, setAskReplies] = useState<
    Array<{
      id: string;
      content: string;
      question?: string;
      traceId?: string;
      sources?: string[];
    }>
  >([]);
  const hashAppliedRef = useRef(false);
  const environmentAppliedRef = useRef(false);
  const autoOpenSuppressRef = useRef<Set<string> | null>(null);
  const wallpaperRecipe = useMemo(
    () =>
      generateSurfaceRecipe({
        seed: "helix-wallpaper-v1",
        context: "desktop-wallpaper",
        density: "medium",
      }),
    [],
  );
  const allowAutoOpen = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(window.localStorage.getItem(PROFILE_STORAGE_KEY));
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    registerFromManifest(panelRegistry);
  }, [registerFromManifest]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pending = window.localStorage.getItem(PENDING_PANEL_KEY);
      if (pending) {
        if (pending === NOISE_GENS_PANEL_ID) {
          autoOpenSuppressRef.current = NOISE_GENS_AUTO_OPEN_SUPPRESS;
        }
        open(pending);
        window.localStorage.removeItem(PENDING_PANEL_KEY);
      }
    } catch {
      // ignore storage read failures
    }
  }, [open]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      const id = custom?.detail?.id;
      if (!id) return;
      open(id);
    };
    window.addEventListener("open-helix-panel", handleOpen as EventListener);
    return () => {
      window.removeEventListener("open-helix-panel", handleOpen as EventListener);
    };
  }, [open]);

  useEffect(() => {
    const handleKnowledgeOpen = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>;
      const projectId = custom?.detail?.projectId;
      if (projectId) {
        selectProjects([projectId]);
      }
      setSettingsTab("knowledge");
      setSettingsOpen(true);
    };
    window.addEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    return () => {
      window.removeEventListener("open-knowledge-project", handleKnowledgeOpen as EventListener);
    };
  }, [selectProjects]);

  useEffect(() => {
    const handleSettingsOpen = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: SettingsTab }>;
      setSettingsTab(custom?.detail?.tab ?? "preferences");
      setSettingsOpen(true);
    };
    window.addEventListener("open-desktop-settings", handleSettingsOpen as EventListener);
    return () => {
      window.removeEventListener("open-desktop-settings", handleSettingsOpen as EventListener);
    };
  }, []);

  const applyLayout = useCallback(
    (layout: DesktopLayoutHash) => {
      if (layout.projectSlug) {
        const match = projects.find((project) => project.hashSlug === layout.projectSlug);
        if (match) {
          selectProjects([match.id]);
        }
      }
      const panels = resolvePanelIds(layout.panels);
      if (panels.includes(NOISE_GENS_PANEL_ID)) {
        autoOpenSuppressRef.current = NOISE_GENS_AUTO_OPEN_SUPPRESS;
      }
      panels.forEach((id) => open(id));
    },
    [open, projects, selectProjects],
  );

  const applyEnvironment = useCallback(
    (context: EssenceEnvironmentContext | null | undefined) => {
      if (!context || !allowAutoOpen) return;
      const panelIds = new Set<string>();
      collectPanelIdsFromStructure(context.template.defaultPanels ?? [], panelIds, 0, true);
      collectPanelIdsFromStructure(context.template.defaultDesktopLayout, panelIds);
      collectPanelIdsFromStructure(context.environment.userOverrides?.layout, panelIds);
      collectPanelIdsFromStructure(context.environment.userOverrides?.widgets, panelIds);
      panelIds.forEach((panelId) => {
        if (panelId && getPanelDef(panelId)) {
          if (autoOpenSuppressRef.current?.has(panelId)) {
            return;
          }
          open(panelId);
        }
      });
    },
    [allowAutoOpen, open],
  );

  useEffect(() => {
    if (hashAppliedRef.current) return;
    if (typeof window === "undefined") return;
    const layout = decodeLayout(window.location.hash ?? "");
    if (!layout.projectSlug && (!layout.panels || layout.panels.length === 0)) {
      return;
    }
    if (layout.projectSlug) {
      const match = projects.find((project) => project.hashSlug === layout.projectSlug);
      if (!match) {
        return;
      }
    }
    applyLayout(layout);
    hashAppliedRef.current = true;
  }, [applyLayout, projects]);

  useEffect(() => {
    const handleApplyLayout = (event: Event) => {
      const detail = (event as CustomEvent<DesktopLayoutHash>).detail;
      if (!detail) return;
      applyLayout(detail);
    };
    window.addEventListener("apply-desktop-layout", handleApplyLayout as EventListener);
    return () => window.removeEventListener("apply-desktop-layout", handleApplyLayout as EventListener);
  }, [applyLayout]);

  const clearSavedChoice = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  const applyUiPreferences = useCallback(
    (preferences: UiPreference[]) => {
      if (!allowAutoOpen) return;
      if (!Array.isArray(preferences) || preferences.length === 0) {
        return;
      }
      const seen = new Set<string>();
      preferences.forEach((pref) => {
        if (!pref?.key || seen.has(pref.key)) {
          return;
        }
        if (pref.key.startsWith("panel:")) {
          const panelId = pref.key.slice("panel:".length);
          if (panelId) {
            if (autoOpenSuppressRef.current?.has(panelId)) {
              return;
            }
            open(panelId);
            seen.add(pref.key);
          }
        }
      });
    },
    [allowAutoOpen, open],
  );

  useEffect(() => {
    let canceled = false;
    fetchUiPreferences()
      .then(({ preferences, environment }) => {
        if (canceled) return;
        if (preferences?.length && allowAutoOpen) {
          applyUiPreferences(preferences);
        }
        if (environment && !environmentAppliedRef.current && allowAutoOpen) {
          applyEnvironment(environment);
          environmentAppliedRef.current = true;
        }
      })
      .catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, [allowAutoOpen, applyEnvironment, applyUiPreferences]);

  const getHelixAskSessionId = useCallback(() => {
    if (helixAskSessionRef.current) return helixAskSessionRef.current;
    const sessionId = ensureContextSession(HELIX_ASK_CONTEXT_ID, "Helix Ask");
    helixAskSessionRef.current = sessionId || null;
    return helixAskSessionRef.current;
  }, [ensureContextSession]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"] | null | undefined) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      open(panelId);
    },
    [open],
  );

  const renderHelixAskContent = useCallback(
    (content: string): ReactNode[] => {
      const parts: ReactNode[] = [];
      if (!content) return parts;
      HELIX_ASK_PATH_REGEX.lastIndex = 0;
      let lastIndex = 0;
      for (const match of content.matchAll(HELIX_ASK_PATH_REGEX)) {
        const matchText = match[0];
        const start = match.index ?? 0;
        if (start > lastIndex) {
          parts.push(content.slice(lastIndex, start));
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
      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
      }
      return parts.length ? parts : [content];
    },
    [openPanelById],
  );

  const handleOpenConversationPanel = useCallback(() => {
    const sessionId = getHelixAskSessionId();
    if (!sessionId) return;
    setActive(sessionId);
    open(ESSENCE_CONSOLE_PANEL_ID);
  }, [getHelixAskSessionId, open, setActive]);

  const handleAskSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (askBusy) return;
      const rawInput = askInputRef.current?.value ?? "";
      const trimmed = rawInput.trim();
      if (!trimmed) return;
      const panelCommand = parseOpenPanelCommand(trimmed);
      if (panelCommand) {
        const panelDef = getPanelDef(panelCommand);
        if (askInputRef.current) {
          askInputRef.current.value = "";
        }
        const sessionId = getHelixAskSessionId();
        if (sessionId) {
          setActive(sessionId);
          addMessage(sessionId, { role: "user", content: trimmed });
        }
        if (panelDef) {
          openPanelById(panelCommand);
          const replyId = crypto.randomUUID();
          const responseText = `Opened ${panelDef.title}.`;
          setAskReplies((prev) =>
            [
              { id: replyId, content: responseText, question: trimmed },
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
      setAskBusy(true);
      setAskStatus("Starting...");
      setAskError(null);
      if (askInputRef.current) {
        askInputRef.current.value = "";
      }
      const sessionId = getHelixAskSessionId();
      if (sessionId) {
        setActive(sessionId);
        addMessage(sessionId, { role: "user", content: trimmed });
      }
      try {
        let responseText = "";
        let traceId: string | undefined;
        let debugSources: string[] | undefined;
        if (HELIX_ASK_USE_PLAN) {
          let knowledgeContext: KnowledgeProjectExport[] = [];
          if (HELIX_ASK_USE_KNOWLEDGE) {
            try {
              knowledgeContext = await exportActiveContext();
            } catch {
              // best-effort knowledge context
            }
          }
          let planResponse: Awaited<ReturnType<typeof plan>>;
          setAskStatus("Planning...");
          const planKnowledgeContext = HELIX_ASK_USE_EXECUTE
            ? knowledgeContext.length
              ? knowledgeContext
              : undefined
            : undefined;
          try {
            planResponse = await plan(
              trimmed,
              "default",
              planKnowledgeContext,
              undefined,
              {
                includeTelemetry: false,
                sessionId: sessionId ?? undefined,
              },
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const shouldRetry =
              planKnowledgeContext &&
              (message.includes("bad_request") || message.includes("knowledge_projects_disabled"));
            if (!shouldRetry) {
              throw error;
            }
            planResponse = await plan(trimmed, "default", undefined, undefined, {
              includeTelemetry: false,
              sessionId: sessionId ?? undefined,
            });
          }
          traceId = planResponse.traceId;
          if (HELIX_ASK_USE_EXECUTE) {
            setAskStatus("Executing tools...");
            const executeResponse = await execute(planResponse.traceId);
            responseText =
              executeResponse.result_summary?.trim() ||
              "Task completed. Open the conversation panel for full details.";
          } else {
            const searchBundles: KnowledgeProjectExport[] = [];
            if (HELIX_ASK_SEARCH_FALLBACK) {
              const searchQueries = buildHelixAskSearchQueries(trimmed);
              const perQueryLimit = Math.max(
                4,
                Math.ceil(HELIX_ASK_CONTEXT_FILES / Math.max(1, searchQueries.length)),
              );
              for (let index = 0; index < searchQueries.length; index += 1) {
                setAskStatus(
                  `Searching code lattice (${index + 1}/${searchQueries.length})...`,
                );
                try {
                  const searchBundle = await searchCodeLattice(
                    searchQueries[index],
                    perQueryLimit,
                  );
                  if (searchBundle?.files?.length) {
                    searchBundles.push(searchBundle);
                  }
                } catch {
                  // best-effort search fallback
                }
              }
            }
            const combinedContext = [...searchBundles, ...knowledgeContext];
            if (userSettings.showHelixAskDebug) {
              debugSources = collectHelixAskSources(
                {
                  resonanceBundle: planResponse.resonance_bundle,
                  resonanceSelection: planResponse.resonance_selection,
                  knowledgeContext: combinedContext,
                },
                trimmed,
              );
            }
            setAskStatus("Building context...");
            const groundedPrompt = buildGroundedPrompt(trimmed, {
              resonanceBundle: planResponse.resonance_bundle,
              resonanceSelection: planResponse.resonance_selection,
              knowledgeContext: combinedContext,
            });
            setAskStatus("Generating answer...");
            let localResponse: LocalAskResponse;
            try {
              localResponse = await askLocal(groundedPrompt, {
                sessionId: sessionId ?? undefined,
                maxTokens: HELIX_ASK_OUTPUT_TOKENS,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              const shouldTrim =
                message.toLowerCase().includes("context") ||
                message.toLowerCase().includes("token") ||
                message.toLowerCase().includes("exceed");
              if (!shouldTrim) {
                throw error;
              }
              setAskStatus("Reducing context...");
              const reducedPrompt = ensureFinalMarker(
                trimToTokenBudget(
                  groundedPrompt,
                  Math.max(256, Math.floor(HELIX_ASK_PROMPT_BUDGET_TOKENS * 0.6)),
                ),
              );
              localResponse = await askLocal(reducedPrompt, {
                sessionId: sessionId ?? undefined,
                maxTokens: HELIX_ASK_OUTPUT_TOKENS,
              });
            }
            responseText = stripPromptEcho(localResponse.text ?? "", trimmed);
            if (!responseText) {
              responseText = "No response returned.";
            }
          }
        } else {
          setAskStatus("Generating answer...");
          const localResponse = await askLocal(trimmed, {
            sessionId: sessionId ?? undefined,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
          });
          responseText = stripPromptEcho(localResponse.text ?? "", trimmed);
          if (!responseText) {
            responseText = "No response returned.";
          }
        }
        const replyId = crypto.randomUUID();
        setAskReplies((prev) =>
          [
            {
              id: replyId,
              content: responseText,
              question: trimmed,
              traceId,
              sources: debugSources,
            },
            ...prev,
          ].slice(0, 3),
        );
        if (sessionId) {
          addMessage(sessionId, { role: "assistant", content: responseText });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Request failed";
        setAskError(message);
        if (sessionId) {
          addMessage(sessionId, { role: "assistant", content: `Error: ${message}` });
        }
      } finally {
        setAskBusy(false);
        setAskStatus(null);
      }
    },
    [
      addMessage,
      askBusy,
      exportActiveContext,
      getHelixAskSessionId,
      setActive,
      userSettings.showHelixAskDebug,
    ],
  );

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(next) => {
        setSettingsOpen(next);
        if (!next) setSettingsTab("preferences");
      }}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100">
        <SurfaceStack recipe={wallpaperRecipe} />
        <div className="pointer-events-none absolute left-0 right-0 top-4 flex items-center justify-end gap-2 pr-4">
          <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-400 md:block">
            Helix Controls
          </p>
          <DialogTrigger asChild>
            <button
              aria-label="Open Helix Start settings"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </DialogTrigger>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex flex-col items-center px-6">
          <form
            className="pointer-events-auto w-full max-w-4xl"
            onSubmit={handleAskSubmit}
          >
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              </div>
              <input
                aria-label="Ask Helix"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                disabled={askBusy}
                ref={askInputRef}
                placeholder={
                  askBusy
                    ? askStatus ?? "Generating answer..."
                    : "Ask anything about this system"
                }
                type="text"
              />
              <button
                aria-label="Submit prompt"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60"
                disabled={askBusy}
                type="submit"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          {askError ? (
            <p className="pointer-events-auto mt-3 text-xs text-rose-200">
              {askError}
            </p>
          ) : null}
          {askReplies.length > 0 ? (
            <div className="pointer-events-auto mt-4 w-full max-w-4xl max-h-[52vh] space-y-3 overflow-y-auto pr-2">
              {askReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur"
                >
                  {reply.question ? (
                    <p className="mb-2 text-xs text-slate-300">
                      <span className="text-slate-400">Question:</span> {reply.question}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderHelixAskContent(reply.content)}
                  </p>
                  {userSettings.showHelixAskDebug && reply.sources?.length ? (
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        Context sources
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{reply.sources.join("\n")}</p>
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Saved in Helix Console</span>
                    <button
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                      onClick={handleOpenConversationPanel}
                      type="button"
                    >
                      Open conversation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {Object.values(windows)
          .filter((w) => w.isOpen)
          .sort((a, b) => a.z - b.z)
          .map((w) => {
            const def = getPanelDef(w.id);
            if (!def) return null;
            return (
              <DesktopWindow
                key={w.id}
                id={w.id}
                title={def.title}
                Loader={def.loader}
              />
            );
          })}

        <DesktopTaskbar />
      </div>

      <HelixSettingsDialogContent
        settingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        userSettings={userSettings}
        updateSettings={updateSettings}
        onClearSavedChoice={clearSavedChoice}
        onClose={() => setSettingsOpen(false)}
      />
    </Dialog>
  );
}
