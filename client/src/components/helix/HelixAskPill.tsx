import { useCallback, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Search } from "lucide-react";
import { panelRegistry, getPanelDef, type PanelDefinition } from "@/lib/desktop/panelRegistry";
import { askLocal, searchCodeLattice } from "@/lib/agi/api";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import type { KnowledgeProjectExport } from "@shared/knowledge";

type HelixAskReply = {
  id: string;
  content: string;
  question?: string;
  sources?: string[];
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

function ensureFinalMarker(value: string): string {
  if (!value.trim()) return "FINAL:";
  if (value.includes("FINAL:")) {
    return value;
  }
  return `${value.trimEnd()}\n\nFINAL:`;
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
const HELIX_ASK_PATH_REGEX =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|md|json|js|cjs|mjs|py|yml|yaml)/g;
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
    'Respond with only the answer and prefix it with \"FINAL:\".',
    "",
    `Question: ${question}`,
    "",
    "Context:",
    context || "No repo context was attached to this request.",
    "",
    "FINAL:",
  ].join("\n");
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
  return trimmed;
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
  const scored = files
    .map((file) => {
      const label = file.path || file.name || "";
      const preview = file.preview ?? "";
      let score = parseSearchScore(preview);
      if (HELIX_ASK_WARP_FOCUS.test(question) && HELIX_ASK_WARP_PATH_BOOST.test(label)) {
        score += 8;
      }
      return { file, label, preview, score };
    })
    .filter((entry) => entry.label && entry.preview)
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
  const askInputRef = useRef<HTMLInputElement | null>(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
  const [askReplies, setAskReplies] = useState<HelixAskReply[]>([]);

  const getHelixAskSessionId = useCallback(() => {
    if (helixAskSessionRef.current) return helixAskSessionRef.current;
    const sessionId = ensureContextSession(contextId, "Helix Ask");
    helixAskSessionRef.current = sessionId || null;
    return helixAskSessionRef.current;
  }, [contextId, ensureContextSession]);

  const openPanelById = useCallback(
    (panelId: PanelDefinition["id"] | null | undefined) => {
      if (!panelId) return;
      if (!getPanelDef(panelId)) return;
      onOpenPanel?.(panelId);
    },
    [onOpenPanel],
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
    onOpenConversation?.(sessionId);
  }, [getHelixAskSessionId, onOpenConversation, setActive]);

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
      setAskStatus("Searching...");
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
        const searchBundles: KnowledgeProjectExport[] = [];
        const searchQueries = buildHelixAskSearchQueries(trimmed);
        const perQueryLimit = Math.max(
          4,
          Math.ceil(HELIX_ASK_CONTEXT_FILES / Math.max(1, searchQueries.length)),
        );
        for (let index = 0; index < searchQueries.length; index += 1) {
          setAskStatus(`Searching code lattice (${index + 1}/${searchQueries.length})...`);
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
        const contextText = buildContextFromBundles(searchBundles, trimmed);
        setAskStatus("Building context...");
        const groundedPrompt = buildGroundedPrompt(trimmed, contextText);
        setAskStatus("Generating answer...");
        let responseText = "";
        try {
          const localResponse = await askLocal(ensureFinalMarker(groundedPrompt), {
            sessionId: sessionId ?? undefined,
            maxTokens: HELIX_ASK_OUTPUT_TOKENS,
          });
          responseText = stripPromptEcho(localResponse.text ?? "", trimmed);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          responseText = message || "Request failed.";
        }
        if (!responseText) {
          responseText = "No response returned.";
        }
        const replyId = crypto.randomUUID();
        setAskReplies((prev) =>
          [
            {
              id: replyId,
              content: responseText,
              question: trimmed,
              sources: searchBundles.flatMap((bundle) =>
                (bundle.files ?? []).slice(0, 6).map((file) => file.path || file.name || ""),
              ),
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
    [addMessage, askBusy, getHelixAskSessionId, openPanelById, setActive],
  );

  const maxWidthClass = maxWidthClassName ?? "max-w-4xl";
  const inputPlaceholder = placeholder ?? "Ask anything about this system";

  return (
    <div className={className}>
      <form className={`w-full ${maxWidthClass}`} onSubmit={handleAskSubmit}>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
          </div>
          <input
            aria-label="Ask Helix"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            disabled={askBusy}
            ref={askInputRef}
            placeholder={askBusy ? askStatus ?? "Generating answer..." : inputPlaceholder}
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
        <p className="mt-3 text-xs text-rose-200">{askError}</p>
      ) : null}
      {askReplies.length > 0 ? (
        <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-2">
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
                  <p className="mt-1 whitespace-pre-wrap">
                    {reply.sources.filter(Boolean).slice(0, 12).join("\n")}
                  </p>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Saved in Helix Console</span>
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
          ))}
        </div>
      ) : null}
    </div>
  );
}
