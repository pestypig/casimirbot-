import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import { BrainCircuit, Search, Settings, Square } from "lucide-react";
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
import {
  askLocal,
  askMoodHint,
  execute,
  plan,
  searchCodeLattice,
  subscribeToolLogs,
  type LocalAskResponse,
  type ToolLogEvent,
} from "@/lib/agi/api";
import { fetchUiPreferences, type EssenceEnvironmentContext, type UiPreference } from "@/lib/agi/preferences";
import { SurfaceStack } from "@/components/surface/SurfaceStack";
import { generateSurfaceRecipe } from "@/lib/surfacekit/generateSurface";
import { classifyMoodFromWhisper } from "@/lib/luma-mood-spectrum";
import { LUMA_MOOD_ORDER, resolveMoodAsset, type LumaMood } from "@/lib/luma-moods";
import { broadcastLumaMood } from "@/lib/luma-mood-theme";
import { reportClientError } from "@/lib/observability/client-error";
import type { ResonanceBundle, ResonanceCollapse, ResonancePatch } from "@shared/code-lattice";
import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";
import type { HelixAskResponseEnvelope } from "@shared/helix-ask-envelope";

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
const HELIX_ASK_USE_PLAN = HELIX_ASK_MODE === "execute";
const HELIX_ASK_USE_EXECUTE = HELIX_ASK_MODE === "execute";
const HELIX_ASK_MAX_TOKENS = clampNumber(
  readNumber((import.meta as any)?.env?.VITE_HELIX_ASK_MAX_TOKENS, 2048),
  64,
  4096,
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

type AskLiveEventEntry = {
  id: string;
  text: string;
  tool?: string;
  ts?: string | number;
};
type LumaMoodPalette = {
  ring: string;
  aura: string;
  surfaceBorder: string;
  surfaceTint: string;
  surfaceHalo: string;
  replyBorder: string;
  replyTint: string;
  surfaceInk: string;
  surfaceInkSoft: string;
  surfaceLaminate: string;
  surfaceLaminateSoft: string;
  uiBackground: string;
  uiForeground: string;
  uiBorder: string;
  uiInput: string;
  uiRing: string;
  uiPrimary: string;
  uiPrimaryForeground: string;
  uiAccent: string;
  uiAccentForeground: string;
  uiMuted: string;
  uiMutedForeground: string;
  uiCard: string;
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
    replyBorder: "border-rose-300/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(244,63,94,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
    surfaceInk: "rgba(251, 113, 133, 0.46)",
    surfaceInkSoft: "rgba(251, 113, 133, 0.2)",
    surfaceLaminate: "rgba(28, 8, 15, 0.96)",
    surfaceLaminateSoft: "rgba(52, 13, 28, 0.92)",
    uiBackground: "342 38% 6%",
    uiForeground: "342 56% 94%",
    uiBorder: "342 40% 18%",
    uiInput: "342 40% 16%",
    uiRing: "344 82% 66%",
    uiPrimary: "344 80% 60%",
    uiPrimaryForeground: "342 52% 12%",
    uiAccent: "342 36% 14%",
    uiAccentForeground: "342 70% 92%",
    uiMuted: "342 30% 12%",
    uiMutedForeground: "342 24% 72%",
    uiCard: "342 34% 8%",
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
    replyBorder: "border-amber-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(251,191,36,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
    surfaceInk: "rgba(251, 191, 36, 0.46)",
    surfaceInkSoft: "rgba(251, 191, 36, 0.2)",
    surfaceLaminate: "rgba(32, 18, 4, 0.96)",
    surfaceLaminateSoft: "rgba(59, 34, 6, 0.92)",
    uiBackground: "38 52% 6%",
    uiForeground: "42 78% 94%",
    uiBorder: "38 44% 18%",
    uiInput: "38 44% 16%",
    uiRing: "40 96% 62%",
    uiPrimary: "40 94% 58%",
    uiPrimaryForeground: "36 62% 12%",
    uiAccent: "38 40% 14%",
    uiAccentForeground: "42 82% 92%",
    uiMuted: "38 34% 12%",
    uiMutedForeground: "38 22% 70%",
    uiCard: "38 46% 8%",
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
    replyBorder: "border-yellow-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(253,224,71,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
    surfaceInk: "rgba(253, 224, 71, 0.5)",
    surfaceInkSoft: "rgba(253, 224, 71, 0.24)",
    surfaceLaminate: "rgba(30, 26, 4, 0.96)",
    surfaceLaminateSoft: "rgba(55, 47, 6, 0.92)",
    uiBackground: "54 58% 6%",
    uiForeground: "56 86% 94%",
    uiBorder: "54 46% 18%",
    uiInput: "54 46% 16%",
    uiRing: "55 96% 64%",
    uiPrimary: "55 94% 60%",
    uiPrimaryForeground: "50 68% 12%",
    uiAccent: "54 42% 14%",
    uiAccentForeground: "56 88% 92%",
    uiMuted: "54 36% 12%",
    uiMutedForeground: "54 24% 70%",
    uiCard: "54 48% 8%",
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
    replyBorder: "border-sky-300/28",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(125,211,252,0.12)_0%,rgba(15,23,42,0.7)_72%)]",
    surfaceInk: "rgba(125, 211, 252, 0.45)",
    surfaceInkSoft: "rgba(125, 211, 252, 0.2)",
    surfaceLaminate: "rgba(7, 17, 28, 0.96)",
    surfaceLaminateSoft: "rgba(10, 30, 48, 0.92)",
    uiBackground: "205 60% 6%",
    uiForeground: "204 78% 94%",
    uiBorder: "205 44% 18%",
    uiInput: "205 44% 16%",
    uiRing: "202 96% 66%",
    uiPrimary: "202 94% 60%",
    uiPrimaryForeground: "206 64% 12%",
    uiAccent: "205 40% 14%",
    uiAccentForeground: "204 82% 92%",
    uiMuted: "205 34% 12%",
    uiMutedForeground: "205 24% 72%",
    uiCard: "205 48% 8%",
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
    replyBorder: "border-emerald-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(110,231,183,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
    surfaceInk: "rgba(110, 231, 183, 0.46)",
    surfaceInkSoft: "rgba(110, 231, 183, 0.2)",
    surfaceLaminate: "rgba(6, 24, 18, 0.96)",
    surfaceLaminateSoft: "rgba(9, 45, 34, 0.92)",
    uiBackground: "154 54% 6%",
    uiForeground: "152 74% 94%",
    uiBorder: "154 40% 18%",
    uiInput: "154 40% 16%",
    uiRing: "152 74% 62%",
    uiPrimary: "152 70% 56%",
    uiPrimaryForeground: "154 60% 12%",
    uiAccent: "154 36% 14%",
    uiAccentForeground: "152 78% 92%",
    uiMuted: "154 30% 12%",
    uiMutedForeground: "154 22% 72%",
    uiCard: "154 44% 8%",
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
    replyBorder: "border-teal-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(94,234,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
    surfaceInk: "rgba(94, 234, 212, 0.46)",
    surfaceInkSoft: "rgba(94, 234, 212, 0.2)",
    surfaceLaminate: "rgba(5, 24, 26, 0.96)",
    surfaceLaminateSoft: "rgba(7, 46, 50, 0.92)",
    uiBackground: "178 56% 6%",
    uiForeground: "176 74% 94%",
    uiBorder: "178 42% 18%",
    uiInput: "178 42% 16%",
    uiRing: "176 78% 64%",
    uiPrimary: "176 72% 56%",
    uiPrimaryForeground: "178 62% 12%",
    uiAccent: "178 38% 14%",
    uiAccentForeground: "176 78% 92%",
    uiMuted: "178 32% 12%",
    uiMutedForeground: "178 22% 72%",
    uiCard: "178 46% 8%",
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
    replyBorder: "border-pink-200/30",
    replyTint:
      "bg-[radial-gradient(120%_160%_at_12%_16%,rgba(249,168,212,0.12)_0%,rgba(15,23,42,0.68)_72%)]",
    surfaceInk: "rgba(249, 168, 212, 0.48)",
    surfaceInkSoft: "rgba(249, 168, 212, 0.22)",
    surfaceLaminate: "rgba(31, 8, 22, 0.96)",
    surfaceLaminateSoft: "rgba(58, 12, 41, 0.92)",
    uiBackground: "326 48% 6%",
    uiForeground: "324 74% 94%",
    uiBorder: "326 40% 18%",
    uiInput: "326 40% 16%",
    uiRing: "326 82% 68%",
    uiPrimary: "326 78% 62%",
    uiPrimaryForeground: "324 60% 12%",
    uiAccent: "326 36% 14%",
    uiAccentForeground: "324 80% 92%",
    uiMuted: "326 30% 12%",
    uiMutedForeground: "326 22% 72%",
    uiCard: "326 44% 8%",
  },
};
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
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:tsx|ts|jsx|js|md|json|cjs|mjs|py|yml|yaml)/g;
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
  if (!value.trim()) return "ANSWER_START\nANSWER_END";
  if (value.includes("ANSWER_START") || value.includes("FINAL:")) {
    return value;
  }
  return `${value.trimEnd()}\n\nANSWER_START\nANSWER_END`;
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
const HELIX_ASK_CORE_FOCUS = /(helix ask|helix|ask system|ask pipeline|ask mode)/i;
const HELIX_ASK_CORE_PATH_BOOSTS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /docs\/helix-ask-flow\.md/i, boost: 10 },
  { pattern: /client\/src\/components\/helix\/HelixAskPill\.tsx/i, boost: 8 },
  { pattern: /client\/src\/pages\/desktop\.tsx/i, boost: 6 },
  { pattern: /server\/routes\/agi\.plan\.ts/i, boost: 6 },
  { pattern: /server\/skills\/llm\.local/i, boost: 4 },
];
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

function scoreHelixAskFile(
  file: KnowledgeFileAttachment,
  tokens: string[],
  helixAskFocus: boolean,
): number {
  if (tokens.length === 0) return 0;
  const haystack = `${file.path ?? ""} ${file.name ?? ""} ${file.preview ?? ""}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
  }
  if (helixAskFocus) {
    const path = `${file.path ?? ""} ${file.name ?? ""}`.toLowerCase();
    for (const { pattern, boost } of HELIX_ASK_CORE_PATH_BOOSTS) {
      if (pattern.test(path)) score += boost;
    }
    if (HELIX_ASK_CORE_NOISE.test(path)) score -= 6;
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
  helixAskFocus = false,
): KnowledgeFileAttachment[] {
  if (!files.length) return [];
  if (tokens.length === 0) return files.slice(0, limit);
  const scored = files
    .map((file) => ({ file, score: scoreHelixAskFile(file, tokens, helixAskFocus) }))
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
  helixAskFocus = false,
): KnowledgeFileAttachment[] {
  const files = collectKnowledgeFiles(projects, limit);
  return selectHelixAskFiles(files, tokens, limit, requireMatch, helixAskFocus);
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
  const helixAskFocus = HELIX_ASK_CORE_FOCUS.test(question);
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
      helixAskFocus,
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
      helixAskFocus,
    );
    if (knowledgeFiles.length) {
      const formatted = knowledgeFiles.map((file, idx) => formatKnowledgeFile(file, idx));
      pushSection("Knowledge projects:", formatted.join("\n\n"));
    }
  }
  const contextBlock =
    sections.length > 0 ? sections.join("\n\n") : "No repo context was attached to this request.";
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
  lines.push(contextBlock);
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
  const helixAskFocus = question ? HELIX_ASK_CORE_FOCUS.test(question) : false;
  const requireMatch = patchTokens.length > 0;
  const patchScore =
    patch && patchTokens.length > 0 ? scoreResonancePatch(patch, patchTokens) : 0;
  if (patch && (patchTokens.length === 0 || patchScore > 0)) {
    const patchFiles = selectHelixAskFiles(
      patch.knowledge?.files ?? [],
      patchTokens,
      HELIX_ASK_PATCH_CONTEXT_FILES,
      requireMatch,
      helixAskFocus,
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
      helixAskFocus,
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
      lowered === "answer_start" ||
      lowered === "answer_end" ||
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
  const cleanedLines = trimmed.split(/\r?\n/).filter((line) => !isScaffoldLine(line));
  const cleaned = cleanedLines.join("\n").trim();
  const formatSpec = decideHelixAskFormat(question);
  if (cleaned) {
    return formatSpec.stageTags ? cleaned : stripStageTags(cleaned);
  }
  return formatSpec.stageTags ? trimmed : stripStageTags(trimmed);
}

function extractAnswerBlock(value: string): string {
  if (!value) return "";
  const startIndex = value.lastIndexOf("ANSWER_START");
  if (startIndex >= 0) {
    const afterStart = value.slice(startIndex + "ANSWER_START".length);
    const endIndex = afterStart.lastIndexOf("ANSWER_END");
    const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    const trimmed = slice.trim();
    if (trimmed) return trimmed;
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
  const askInputRef = useRef<HTMLTextAreaElement | null>(null);
  const askDraftRef = useRef("");
  const askMoodTimerRef = useRef<number | null>(null);
  const askStartRef = useRef<number | null>(null);
  const moodHintAbortRef = useRef<AbortController | null>(null);
  const moodHintSeqRef = useRef(0);
  const moodHintLastAtRef = useRef(0);
  const askAbortRef = useRef<AbortController | null>(null);
  const askRunIdRef = useRef(0);
  const moodHintSessionId = useMemo(() => `helix:mood:${HELIX_ASK_CONTEXT_ID}`, []);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
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
  const [askExtensionOpenByReply, setAskExtensionOpenByReply] = useState<Record<string, boolean>>(
    {},
  );
  const [askExpandedByReply, setAskExpandedByReply] = useState<Record<string, boolean>>({});
  const [askReplies, setAskReplies] = useState<
    Array<{
      id: string;
      content: string;
      question?: string;
      traceId?: string;
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
        format?: "steps" | "compare" | "brief";
        stage_tags?: boolean;
        prompt_ingested?: boolean;
        prompt_ingest_source?: string;
        prompt_ingest_reason?: string;
        prompt_chunk_count?: number;
        prompt_selected?: number;
        context_files?: string[];
        prompt_context_files?: string[];
        prompt_context_points?: string[];
        prompt_used_sections?: string[];
        intent_id?: string;
        intent_domain?: string;
        intent_tier?: string;
        intent_secondary_tier?: string;
        intent_strategy?: string;
        intent_reason?: string;
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
        ambiguity_terms?: string[];
        ambiguity_gate_applied?: boolean;
        overflow_retry_applied?: boolean;
        overflow_retry_steps?: string[];
        overflow_retry_labels?: string[];
        overflow_retry_attempts?: number;
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
            vdb_two_wall_support_equals_true?: boolean;
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
        verbosity?: "brief" | "normal" | "extended";
      };
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
  const allowAutoOpen = false;

  useEffect(() => {
    registerFromManifest(panelRegistry, { allowDefaultOpen: false });
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

  useEffect(() => {
    setAskMoodBroken(false);
  }, [askMood]);

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
        .then((result) => {
          if (controller.signal.aborted) return;
          if (seq !== moodHintSeqRef.current) return;
          const mood = result?.mood ?? null;
          const confidence = typeof result?.confidence === "number" ? result.confidence : 0;
          if (!mood || confidence < HELIX_MOOD_HINT_CONFIDENCE) return;
          setAskMood(mood);
        })
        .catch(() => undefined);
    },
    [moodHintSessionId],
  );

  const clearMoodTimer = useCallback(() => {
    if (askMoodTimerRef.current !== null) {
      window.clearTimeout(askMoodTimerRef.current);
      askMoodTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearMoodTimer();
      cancelMoodHint();
      clearLiveDraftFlush();
    };
  }, [cancelMoodHint, clearLiveDraftFlush, clearMoodTimer]);

  const askMoodAsset = resolveMoodAsset(askMood);
  const askMoodSrc = askMoodBroken ? null : askMoodAsset?.sources[0] ?? null;
  const askMoodLabel = askMoodAsset?.label ?? "Helix mood";
  const askMoodPalette = LUMA_MOOD_PALETTE[askMood] ?? LUMA_MOOD_PALETTE.question;
  const askMoodRingClass = askMoodPalette.ring;
  const surfaceMoodVars = useMemo(
    () =>
      ({
        "--background": askMoodPalette.uiBackground,
        "--foreground": askMoodPalette.uiForeground,
        "--card": askMoodPalette.uiCard,
        "--card-foreground": askMoodPalette.uiForeground,
        "--popover": askMoodPalette.uiCard,
        "--popover-foreground": askMoodPalette.uiForeground,
        "--border": askMoodPalette.uiBorder,
        "--input": askMoodPalette.uiInput,
        "--primary": askMoodPalette.uiPrimary,
        "--primary-foreground": askMoodPalette.uiPrimaryForeground,
        "--secondary": askMoodPalette.uiMuted,
        "--secondary-foreground": askMoodPalette.uiForeground,
        "--accent": askMoodPalette.uiAccent,
        "--accent-foreground": askMoodPalette.uiAccentForeground,
        "--muted": askMoodPalette.uiMuted,
        "--muted-foreground": askMoodPalette.uiMutedForeground,
        "--ring": askMoodPalette.uiRing,
        "--surface-ink": askMoodPalette.surfaceInk,
        "--surface-ink-soft": askMoodPalette.surfaceInkSoft,
        "--surface-laminate": askMoodPalette.surfaceLaminate,
        "--surface-laminate-soft": askMoodPalette.surfaceLaminateSoft,
      }) as CSSProperties,
    [askMoodPalette],
  );

  useEffect(() => {
    if (!askBusy) return;
    const lastEvent = askLiveEvents[askLiveEvents.length - 1]?.text?.trim();
    const draftTail = askLiveDraft.trim();
    const status = askStatus?.trim();
    const moodSource = lastEvent || draftTail || status || "";
    if (!moodSource) return;
    updateMoodFromText(moodSource);
    requestMoodHint(moodSource);
  }, [askBusy, askLiveDraft, askLiveEvents, askStatus, requestMoodHint, updateMoodFromText]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"] | null | undefined) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      open(panelId);
    },
    [open],
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
              {normalizeCitations(section.citations).length > 0 ? (
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
    (reply: { id?: string; content: string; envelope?: HelixAskResponseEnvelope }) => {
      if (!reply.envelope) {
        return (
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(reply.content)}
          </p>
        );
      }
      const sections = reply.envelope.sections ?? [];
      const detailSections = sections.filter((section) => section.layer !== "proof");
      const proofSections = sections.filter((section) => section.layer === "proof");
      const extension = reply.envelope.extension;
      const extensionBody = coerceText(extension?.body).trim();
      const extensionCitations = normalizeCitations(extension?.citations);
      const extensionAvailable = Boolean(extension?.available && extensionBody);
      const replyId = reply.id ?? "";
      const extensionOpen = replyId ? Boolean(askExtensionOpenByReply[replyId]) : false;
      const expanded = replyId ? Boolean(askExpandedByReply[replyId]) : false;
      const answerText = clipForDisplay(
        coerceText(reply.envelope.answer),
        HELIX_ASK_MAX_RENDER_CHARS,
        expanded,
      );
      const hasLongContent =
        hasLongText(reply.envelope.answer, HELIX_ASK_MAX_RENDER_CHARS) ||
        hasLongText(extensionBody, HELIX_ASK_MAX_RENDER_CHARS) ||
        sections.some((section) => hasLongText(section.body, HELIX_ASK_MAX_RENDER_CHARS));
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderHelixAskContent(answerText)}
          </p>
          {replyId && hasLongContent ? (
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
              onClick={() =>
                setAskExpandedByReply((prev) => ({
                  ...prev,
                  [replyId]: !expanded,
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
                onClick={() => {
                  if (!replyId) return;
                  setAskExtensionOpenByReply((prev) => ({
                    ...prev,
                    [replyId]: !prev[replyId],
                  }));
                }}
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
              open
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
              open
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

  const buildCopyText = useCallback(
    (reply: { content: string; envelope?: HelixAskResponseEnvelope }): string => {
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
    },
    [],
  );

  const handleCopyReply = useCallback(
    async (reply: { content: string; envelope?: HelixAskResponseEnvelope }) => {
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

  const handleOpenConversationPanel = useCallback(() => {
    const sessionId = getHelixAskSessionId();
    if (!sessionId) return;
    setActive(sessionId);
    open(ESSENCE_CONSOLE_PANEL_ID);
  }, [getHelixAskSessionId, open, setActive]);

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
    const timer = window.setInterval(() => {
      setAskElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => window.clearInterval(timer);
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
      const eventTs =
        typeof event.ts === "number"
          ? event.ts
          : typeof event.ts === "string"
            ? Date.parse(event.ts)
            : undefined;
      if (typeof eventTs === "number" && Number.isFinite(eventTs) && eventTs < startedAt - 500) {
        return;
      }
      let text = (event.text ?? "").toString().trim();
      if (!text) {
        text = toolName || "Helix Ask update";
      }
      text = clipText(text, HELIX_ASK_LIVE_EVENT_MAX_CHARS);
      if (!text) return;
      setAskStatus(text);
      setAskLiveEvents((prev) => {
        const id = event.id ?? String(event.seq ?? Date.now());
        if (prev.some((entry) => entry.id === id)) return prev;
        const next = [...prev, { id, text, tool: toolName || undefined, ts: event.ts }];
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

  const resolveReplyEvents = useCallback((reply: { id: string; liveEvents?: AskLiveEventEntry[]; debug?: { live_events?: Array<{ ts: string; tool: string; stage: string; detail?: string; text?: string }> } }): AskLiveEventEntry[] => {
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
      };
    });
  }, []);

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
      const askTraceId = `ask:${crypto.randomUUID()}`;
      setAskLiveSessionId(sessionId ?? null);
      setAskLiveTraceId(askTraceId);
      if (sessionId) {
        setActive(sessionId);
        addMessage(sessionId, { role: "user", content: trimmed });
      }

      const controller = new AbortController();
      askAbortRef.current = controller;
      const runId = ++askRunIdRef.current;
      let skipReply = false;
      const checkAbort = () => {
        if (!controller.signal.aborted) return false;
        skipReply = true;
        setAskStatus("Generation stopped.");
        return true;
      };

      try {
        let responseText = "";
        let responseDebug: LocalAskResponse["debug"];
        let responsePromptIngested: boolean | undefined;
        let responseEnvelope: HelixAskResponseEnvelope | undefined;
        let planTraceId: string | undefined;
        let debugSources: string[] | undefined;
        const useRepoContext = isHelixAskRepoQuestion(trimmed);
        if (HELIX_ASK_USE_PLAN && useRepoContext) {
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
          if (checkAbort()) return;
          planTraceId = planResponse.traceId;
          if (HELIX_ASK_USE_EXECUTE) {
            setAskStatus("Executing tools...");
            const executeResponse = await execute(planResponse.traceId);
            if (checkAbort()) return;
            responseText =
              executeResponse.result_summary?.trim() ||
              "Task completed. Open the conversation panel for full details.";
          } else {
            const searchBundles: KnowledgeProjectExport[] = [];
            if (HELIX_ASK_SEARCH_FALLBACK) {
              const searchQueries = !checkAbort() ? buildHelixAskSearchQueries(trimmed) : [];
              const perQueryLimit = Math.max(
                4,
                Math.ceil(HELIX_ASK_CONTEXT_FILES / Math.max(1, searchQueries.length)),
              );
              for (let index = 0; index < searchQueries.length; index += 1) {
                if (checkAbort()) return;
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
            if (checkAbort()) return;
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
                traceId: askTraceId,
                maxTokens: HELIX_ASK_OUTPUT_TOKENS,
                question: trimmed,
                debug: userSettings.showHelixAskDebug,
                signal: controller.signal,
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
                traceId: askTraceId,
                maxTokens: HELIX_ASK_OUTPUT_TOKENS,
                question: trimmed,
                debug: userSettings.showHelixAskDebug,
                signal: controller.signal,
              });
            }
            if (checkAbort()) return;
            responseEnvelope = localResponse.envelope;
            responseText =
              responseEnvelope?.answer ??
              stripPromptEcho(localResponse.text ?? "", trimmed);
            responseDebug = localResponse.debug;
            responsePromptIngested = localResponse.prompt_ingested;
            if (!responseText) {
              responseText = "No response returned.";
            }
          }
        } else {
          setAskStatus("Generating answer...");
          const localResponse = await askLocal(undefined, {
            sessionId: sessionId ?? undefined,
            traceId: askTraceId,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
            question: trimmed,
            debug: userSettings.showHelixAskDebug,
            signal: controller.signal,
          });
          if (checkAbort()) return;
          responseEnvelope = localResponse.envelope;
          responseText =
            responseEnvelope?.answer ??
            stripPromptEcho(localResponse.text ?? "", trimmed);
          responseDebug = localResponse.debug;
          responsePromptIngested = localResponse.prompt_ingested;
          if (!responseText) {
            responseText = "No response returned.";
          }
        }
        if (skipReply) return;
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
              traceId: planTraceId ?? askTraceId,
              sources:
                debugSources ??
                responseDebug?.context_files ??
                responseDebug?.prompt_context_files ??
                [],
              debug: responseDebug,
              promptIngested: responsePromptIngested,
              envelope: responseEnvelope,
              liveEvents: liveEventsSnapshot,
            },
            ...prev,
          ].slice(0, 3),
        );
        if (sessionId) {
          addMessage(sessionId, { role: "assistant", content: responseText });
        }
      } catch (error) {
        const aborted =
          controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
        if (aborted) {
          skipReply = true;
          setAskStatus("Generation stopped.");
        } else {
          const message = error instanceof Error ? error.message : "Request failed";
          const streamedFallback = askLiveDraftRef.current.trim();
          if (streamedFallback) {
            updateMoodFromText(streamedFallback);
            requestMoodHint(streamedFallback, { force: true });
            const replyId = crypto.randomUUID();
            const liveEventsSnapshot = [...askLiveEventsRef.current];
            setAskReplies((prev) =>
              [
                {
                  id: replyId,
                  content: streamedFallback,
                  question: trimmed,
                  traceId: askTraceId,
                  sources: [],
                  liveEvents: liveEventsSnapshot,
                },
                ...prev,
              ].slice(0, 3),
            );
            if (sessionId) {
              addMessage(sessionId, { role: "assistant", content: streamedFallback });
            }
          } else {
            setAskError(message);
            if (sessionId) {
              addMessage(sessionId, { role: "assistant", content: `Error: ${message}` });
            }
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
      exportActiveContext,
      getHelixAskSessionId,
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
    if (!askBusy) return;
    if (askAbortRef.current) {
      askAbortRef.current.abort();
    }
    setAskStatus("Stopping...");
  }, [askBusy]);

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
      askBusy,
      cancelMoodHint,
      clearMoodTimer,
      getHelixAskSessionId,
      parseQueuedQuestions,
      requestMoodHint,
      resizeTextarea,
      runAsk,
      setActive,
      updateMoodFromText,
    ],
  );

  const inputPlaceholder = "Ask anything about this system";
  const currentPlaceholder = askBusy ? "Add another question..." : inputPlaceholder;
  const queuePreview = useMemo(() => {
    const preview = askQueue.slice(0, 3).map((entry) => clipText(entry, 80));
    const remainder = Math.max(0, askQueue.length - preview.length);
    return { preview, remainder };
  }, [askQueue]);

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(next) => {
        setSettingsOpen(next);
        if (!next) setSettingsTab("preferences");
      }}
    >
      {userSettings.enableSplashCursor && <SplashCursor />}
      <div
        className="mood-transition-scope relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100"
        style={surfaceMoodVars}
      >
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
          <HelixAskErrorBoundary>
            <form
              className="pointer-events-auto w-full max-w-4xl"
              onSubmit={handleAskSubmit}
            >
              <div
                className={`relative overflow-hidden rounded-[32px] border bg-slate-950/80 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur ${askMoodPalette.surfaceBorder}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 ${askMoodPalette.surfaceTint}`}
                  aria-hidden
                />
                <div
                  className={`pointer-events-none absolute inset-0 ${askMoodPalette.surfaceHalo}`}
                  aria-hidden
                />
                <div className="relative flex items-start gap-3 px-4 py-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border ${askMoodPalette.aura}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/45 ring-1 ring-inset ${askMoodRingClass}`}
                  >
                {askMoodSrc ? (
                  <img
                    src={askMoodSrc}
                    alt={`${askMoodLabel} mood`}
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
                <textarea
                  aria-label="Ask Helix"
                  aria-disabled={askBusy}
                  className="helix-ask-textarea flex-1 resize-none bg-transparent pt-2 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none"
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
              {askBusy ? (
                <div
                  className={`relative overflow-hidden border-t px-4 py-2 text-[11px] text-slate-300 ${askMoodPalette.replyBorder}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 opacity-70 ${askMoodPalette.replyTint}`}
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
                              <p className="mt-1 whitespace-pre-wrap text-slate-300">
                                {entry.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">Waiting for updates...</p>
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
            </form>
            {askError ? (
              <p className="pointer-events-auto mt-3 text-xs text-rose-200">
                {askError}
              </p>
            ) : null}
            {askReplies.length > 0 ? (
              <div className="pointer-events-auto mt-4 w-full max-w-4xl max-h-[52vh] space-y-3 overflow-y-auto pr-2">
                {askReplies.map((reply) => {
                  const replyEvents = resolveReplyEvents(reply);
                  return (
                    <div
                      key={reply.id}
                      className={`relative overflow-hidden rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur ${askMoodPalette.replyBorder}`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 opacity-80 ${askMoodPalette.replyTint}`}
                        aria-hidden
                      />
                      <div className="relative">
                      {reply.question ? (
                        <p className="mb-2 text-xs text-slate-300">
                          <span className="text-slate-400">Question:</span> {reply.question}
                        </p>
                      ) : null}
                      {renderHelixAskEnvelope(reply)}
                      {replyEvents.length > 0 ? (
                        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            Execution log
                          </p>
                          <div className="mt-2 space-y-2 text-[11px] text-slate-300">
                            {replyEvents.map((entry) => {
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
                                  <p className="mt-1 whitespace-pre-wrap text-slate-300">
                                    {entry.text}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      {userSettings.showHelixAskDebug && reply.debug ? (
                        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            Ask debug
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Two-pass: {reply.debug.two_pass ? "on" : "off"}
                          </p>
                          {typeof reply.debug.micro_pass === "boolean" ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Micro-pass: {reply.debug.micro_pass ? "on" : "off"}
                              {reply.debug.micro_pass_auto === true ? " (auto)" : ""}
                            </p>
                          ) : null}
                          {reply.debug.micro_pass_reason ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Micro-pass reason: {reply.debug.micro_pass_reason}
                            </p>
                          ) : null}
                          {typeof reply.promptIngested === "boolean" ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Prompt ingest: {reply.promptIngested ? "on" : "off"}
                            </p>
                          ) : null}
                          {reply.debug.prompt_ingest_reason ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Prompt ingest reason: {reply.debug.prompt_ingest_reason}
                            </p>
                          ) : null}
                          {reply.debug.prompt_ingest_source ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Prompt ingest source: {reply.debug.prompt_ingest_source}
                            </p>
                          ) : null}
                          {typeof reply.debug.prompt_chunk_count === "number" ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Prompt chunks: {reply.debug.prompt_chunk_count}
                              {typeof reply.debug.prompt_selected === "number"
                                ? ` (selected ${reply.debug.prompt_selected})`
                                : ""}
                            </p>
                          ) : null}
                          {reply.debug.prompt_context_points &&
                          reply.debug.prompt_context_points.length > 0 ? (
                            <div className="mt-2 whitespace-pre-wrap text-[11px] text-slate-400">
                              Prompt context points:
                              {"\n"}
                              {reply.debug.prompt_context_points.join("\n")}
                            </div>
                          ) : null}
                          {reply.debug.prompt_used_sections &&
                          reply.debug.prompt_used_sections.length > 0 ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Prompt sections: {reply.debug.prompt_used_sections.join(", ")}
                            </p>
                          ) : null}
                          {typeof reply.debug.evidence_claim_count === "number" ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Claim gate: {reply.debug.evidence_claim_supported ?? 0}/
                              {reply.debug.evidence_claim_count} supported
                              {typeof reply.debug.evidence_claim_ratio === "number"
                                ? ` (${reply.debug.evidence_claim_ratio.toFixed(2)})`
                                : ""}
                            </p>
                          ) : null}
                          {reply.debug.ambiguity_terms && reply.debug.ambiguity_terms.length > 0 ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Ambiguous terms: {reply.debug.ambiguity_terms.join(", ")}
                            </p>
                          ) : null}
                          {reply.debug.overflow_retry_steps &&
                          reply.debug.overflow_retry_steps.length > 0 ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Overflow retry: {reply.debug.overflow_retry_steps.join(" -> ")}
                            </p>
                          ) : null}
                          {reply.debug.intent_id ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Intent: {reply.debug.intent_id}
                              {reply.debug.intent_domain ? ` · ${reply.debug.intent_domain}` : ""}
                              {reply.debug.intent_tier ? ` · ${reply.debug.intent_tier}` : ""}
                              {reply.debug.intent_strategy ? ` · ${reply.debug.intent_strategy}` : ""}
                            </p>
                          ) : null}
                          {reply.debug.intent_reason ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Intent reason: {reply.debug.intent_reason}
                            </p>
                          ) : null}
                          {reply.debug.graph_congruence_diagnostics ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Graph congruence: blocked{" "}
                              {reply.debug.graph_congruence_diagnostics.blockedEdges ?? 0}
                              {" / "}allowed{" "}
                              {reply.debug.graph_congruence_diagnostics.allowedEdges ?? 0}
                              {" | "}in-tree{" "}
                              {reply.debug.graph_congruence_diagnostics.resolvedInTreeEdges ?? 0}
                              {" | "}cross-tree{" "}
                              {reply.debug.graph_congruence_diagnostics.resolvedCrossTreeEdges ?? 0}
                              {" | "}strict QI metric path{" "}
                              {reply.debug.graph_congruence_diagnostics.strictSignals
                                ?.qi_metric_derived_equals_true
                                ? "on"
                                : "off"}
                            </p>
                          ) : null}
                          {reply.debug.graph_congruence_diagnostics?.blockedByCondition &&
                          Object.keys(reply.debug.graph_congruence_diagnostics.blockedByCondition)
                            .length > 0 ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Graph blocked conditions:{" "}
                              {Object.entries(reply.debug.graph_congruence_diagnostics.blockedByCondition)
                                .map(([key, count]) => `${key}:${count}`)
                                .join(", ")}
                            </p>
                          ) : null}
                          {typeof reply.debug.evidence_gate_ok === "boolean" ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Evidence gate: {reply.debug.evidence_gate_ok ? "pass" : "fail"}
                              {typeof reply.debug.evidence_match_count === "number" &&
                              typeof reply.debug.evidence_token_count === "number"
                                ? ` (${reply.debug.evidence_match_count}/${reply.debug.evidence_token_count}${
                                    typeof reply.debug.evidence_match_ratio === "number"
                                      ? `, ${reply.debug.evidence_match_ratio.toFixed(2)}`
                                      : ""
                                  })`
                                : ""}
                            </p>
                          ) : null}
                          {reply.debug.format ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Format: {reply.debug.format}
                              {typeof reply.debug.stage_tags === "boolean"
                                ? ` · Stage tags: ${reply.debug.stage_tags ? "on" : "off"}`
                                : ""}
                            </p>
                          ) : null}
                          {reply.debug.scaffold ? (
                            <p className="mt-2 whitespace-pre-wrap">{reply.debug.scaffold}</p>
                          ) : null}
                          {reply.debug.evidence_cards ? (
                            <p className="mt-2 whitespace-pre-wrap">{reply.debug.evidence_cards}</p>
                          ) : null}
                          {reply.debug.live_events &&
                          reply.debug.live_events.length > 0 &&
                          replyEvents.length === 0 ? (
                            <div className="mt-2 whitespace-pre-wrap text-[11px] text-slate-300">
                              Live events:
                              {"\n"}
                              {reply.debug.live_events
                                .map((entry) => {
                                  const status = entry.ok === false ? "FAIL" : "OK";
                                  const duration =
                                    typeof entry.durationMs === "number"
                                      ? ` ${Math.round(entry.durationMs)}ms`
                                      : "";
                                  const label =
                                    entry.text?.trim() ||
                                    `${entry.stage}${entry.detail ? ` - ${entry.detail}` : ""}`;
                                  const toolLabel = entry.tool?.trim();
                                  const prefix = toolLabel ? `${toolLabel} ` : "";
                                  return `${prefix}${status}${duration} | ${label}`;
                                })
                                .join("\n")}
                            </div>
                          ) : null}
                          {reply.debug.citation_repair ? (
                            <p className="mt-2 text-[11px] text-slate-400">
                              Citation repair: applied
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      {userSettings.showHelixAskDebug &&
                      (reply.sources?.length || reply.debug?.context_files?.length) ? (
                        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            Context sources
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">
                            {(reply.sources?.length
                              ? reply.sources
                              : reply.debug?.context_files ??
                                reply.debug?.prompt_context_files ??
                                [])
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
                            className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                            onClick={handleOpenConversationPanel}
                            type="button"
                          >
                            Open conversation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : null}
          </HelixAskErrorBoundary>
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
