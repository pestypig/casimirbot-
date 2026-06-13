import React from "react";
import { marked, type MarkedOptions } from "marked";
import { renderToString as renderKatexToString } from "katex";
import "katex/dist/katex.min.css";
import { ArrowLeft, Folder, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { speakVoice } from "@/lib/agi/api";
import {
  DOC_MANIFEST,
  compareDocCatalogEntries,
  filterDocManifestEntries,
  findDocEntry,
  docCatalogTimestamp,
  type DocManifestEntry,
} from "@/lib/docs/docManifest";
import { consumeDocViewerIntent } from "@/lib/docs/docViewer";
import { buildWorkstationPathRef } from "@/lib/workstation/workstationDeepLink";
import {
  HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT,
  type HelixWorkstationProceduralStepPayload,
} from "@/lib/workstation/proceduralPlaybackContract";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import {
  executeDocEquationAction,
  getDocEquationActionEntryForLatex,
  getDocEquationTheoryActions,
} from "@/lib/docs/docEquationActions";
import {
  markInteraction,
  runWhenQuiet,
} from "@/lib/workstation/performance/workstationInteractionScheduler";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useWorkstationSessionMemoryStore } from "@/store/useWorkstationSessionMemoryStore";

export type DocMathPickContext = {
  latex: string;
  currentPath?: string;
  anchor?: string;
  clipboardWrite?: ((text: string) => Promise<void>) | null;
  dispatchEvent?: ((detail: { latex: string; sourcePath: string | null; anchor: string | null }) => void) | null;
};

export function handleDocMathPick(context: DocMathPickContext): void {
  const latex = context.latex.trim();
  if (!latex) return;
  const detail = {
    latex,
    sourcePath: context.currentPath ?? null,
    anchor: context.anchor ?? null,
  };
  const customDispatch = context.dispatchEvent;
  if (customDispatch) {
    customDispatch(detail);
  } else {
    dispatchScientificCalculatorMathPicked(detail);
  }
  const clipboardWrite = context.clipboardWrite;
  if (clipboardWrite) {
    void clipboardWrite(latex).catch(() => undefined);
  }
}

const DOC_MARKED_OPTIONS: MarkedOptions & { mangle?: boolean; headerIds?: boolean } = {
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
};

let activeMarkedDocPath: string | null = null;

marked.setOptions(DOC_MARKED_OPTIONS);
marked.use({
  extensions: [
    {
      name: "docMathBlock",
      level: "block",
      start(src: string) {
        const bracketStart = src.indexOf("\\[");
        const dollarStart = src.indexOf("$$");
        if (bracketStart === -1) return dollarStart;
        if (dollarStart === -1) return bracketStart;
        return Math.min(bracketStart, dollarStart);
      },
      tokenizer(src: string) {
        const bracketMatch = src.match(/^\\\[\n?([\s\S]+?)\n?\\\](?:\n|$)/);
        if (bracketMatch) {
          return {
            type: "docMathBlock",
            raw: bracketMatch[0],
            text: bracketMatch[1].trim(),
          };
        }
        const dollarMatch = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$(?:\n|$)/);
        if (dollarMatch) {
          return {
            type: "docMathBlock",
            raw: dollarMatch[0],
            text: dollarMatch[1].trim(),
          };
        }
        return undefined;
      },
      renderer(token: { text?: string }) {
        return renderDocMath(token.text ?? "", true, activeMarkedDocPath);
      },
    },
    {
      name: "docMathInline",
      level: "inline",
      start(src: string) {
        return src.indexOf("\\(");
      },
      tokenizer(src: string) {
        const inlineMatch = src.match(/^\\\((.+?)\\\)/);
        if (!inlineMatch) return undefined;
        return {
          type: "docMathInline",
          raw: inlineMatch[0],
          text: inlineMatch[1].trim(),
        };
      },
      renderer(token: { text?: string }) {
        return renderDocMath(token.text ?? "", false, activeMarkedDocPath);
      },
    },
  ],
});

const DOC_AUTO_READ_PROVIDER = "elevenlabs";
const DOC_AUTO_READ_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const DOC_AUTO_READ_CHUNK_MAX = 560;
const DOC_AUTO_READ_MAX_CHARS = 12_000;
const DOC_AUTO_READ_TAG = "helix-doc-reader";
const DOC_AUTO_READ_ACTIVE_CLASS = "doc-read-active-section";

let globalDocReadController: AbortController | null = null;
let globalDocReadAudio: HTMLAudioElement | null = null;
let globalDocReadUrl: string | null = null;
let globalDocReadKey: string | null = null;

function stopGlobalDocRead() {
  if (globalDocReadController) {
    globalDocReadController.abort();
    globalDocReadController = null;
  }
  if (globalDocReadAudio) {
    globalDocReadAudio.pause();
    globalDocReadAudio.src = "";
    globalDocReadAudio = null;
  }
  if (globalDocReadUrl) {
    URL.revokeObjectURL(globalDocReadUrl);
    globalDocReadUrl = null;
  }
  globalDocReadKey = null;
}

export function DocViewerPanel() {
  const {
    mode,
    currentPath,
    anchor,
    pendingAutoReadNonce,
    viewDirectory,
    viewDoc,
    clearPendingAutoRead,
    applyIntent,
  } = useDocViewerStore();
  const [query, setQuery] = React.useState("");
  const [html, setHtml] = React.useState<string>("");
  const [rawMarkdown, setRawMarkdown] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadedDocId, setLoadedDocId] = React.useState<string | null>(null);
  const [isAutoReading, setIsAutoReading] = React.useState(false);
  const [autoReadError, setAutoReadError] = React.useState<string | null>(null);
  const [proceduralStatus, setProceduralStatus] = React.useState<string | null>(null);
  const [followLiveRead, setFollowLiveRead] = React.useState(true);
  const [readProgress, setReadProgress] = React.useState<{
    chunkIndex: number;
    chunkCount: number;
    snippet: string;
  } | null>(null);
  const rememberPanelScroll = useWorkstationSessionMemoryStore((state) => state.rememberPanelScroll);
  const readPanelScroll = useWorkstationSessionMemoryStore((state) => state.readPanelScroll);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const activeReadTargetRef = React.useRef<HTMLElement | null>(null);
  const modeRef = React.useRef(mode);
  const followLiveReadRef = React.useRef(followLiveRead);
  const liveReadChunkRef = React.useRef<string | null>(null);
  const lastProceduralTraceIdRef = React.useRef<string | null>(null);
  const currentEntry = React.useMemo(() => (currentPath ? findDocEntry(currentPath) : null), [currentPath]);
  const docScrollMemoryKey = React.useMemo(
    () => (mode === "doc" && currentPath ? `docs-viewer:doc:${currentPath}` : "docs-viewer:directory"),
    [currentPath, mode],
  );

  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  React.useEffect(() => {
    followLiveReadRef.current = followLiveRead;
  }, [followLiveRead]);

  React.useEffect(() => {
    const intent = consumeDocViewerIntent();
    if (intent) {
      applyIntent(intent);
    }
  }, [applyIntent]);

  React.useEffect(() => {
    if (mode !== "doc" || !currentEntry) {
      setHtml("");
      setRawMarkdown("");
      setError(null);
      setLoading(false);
      setLoadedDocId(null);
      return;
    }
    let canceled = false;
    setLoading(true);
    setError(null);
    setLoadedDocId(null);
    currentEntry
      .loader()
      .then((raw) => {
        if (canceled) return;
        setRawMarkdown(raw);
        let rendered: string | Promise<string>;
        try {
          activeMarkedDocPath = currentEntry.relativePath;
          rendered = marked.parse(renderMathMarkdown(raw, currentEntry.relativePath));
        } finally {
          activeMarkedDocPath = null;
        }
        const renderedHtml = typeof rendered === "string" ? rendered : String(rendered);
        setHtml(renderMathInRenderedHtml(renderedHtml, currentEntry.relativePath));
        setLoadedDocId(currentEntry.id);
      })
      .catch((err) => {
        if (canceled) return;
        setError(err instanceof Error ? err.message : "Unable to render document.");
        setHtml("");
        setRawMarkdown("");
        setLoadedDocId(currentEntry.id);
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, [mode, currentEntry]);

  React.useEffect(() => {
    if (mode !== "doc" || !anchor || !contentRef.current) return;
    const container = contentRef.current;
    const selector = `#${cssEscape(anchor)}`;
    const target = container.querySelector(selector) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("ring-2", "ring-cyan-400/70");
    if (typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      target.classList.remove("ring-2", "ring-cyan-400/70");
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [anchor, html, mode]);

  React.useLayoutEffect(() => {
    if (mode !== "doc" || anchor || loading || !contentRef.current) return;
    const saved = readPanelScroll(docScrollMemoryKey);
    if (!saved) return;
    const node = contentRef.current;
    const restore = () => {
      const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = Math.min(saved.scrollTop, maxScrollTop);
    };
    if (typeof window === "undefined") {
      restore();
      return;
    }
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [anchor, docScrollMemoryKey, html, loading, mode, readPanelScroll]);

  const handleContentScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      markInteraction("scrolling", "docs-viewer.content_scroll");
      const scroll = {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
      runWhenQuiet(() => {
        rememberPanelScroll(docScrollMemoryKey, scroll);
      }, {
        key: `workstation.scroll_memory:${docScrollMemoryKey}`,
        priority: "share_state",
        quietMs: 450,
        timeoutMs: 1800,
      });
    },
    [docScrollMemoryKey, rememberPanelScroll],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStep = (event: Event) => {
      const detail = (event as CustomEvent<HelixWorkstationProceduralStepPayload | null>)?.detail;
      if (!detail || detail.panelId !== "docs-viewer") return;
      if (typeof detail.traceId === "string" && detail.traceId.trim()) {
        lastProceduralTraceIdRef.current = detail.traceId.trim();
      }
      const label =
        detail.step === "highlight_plus"
          ? "Agent: focusing panel picker."
          : detail.step === "open_picker"
            ? "Agent: opening panel picker."
            : detail.step === "target_panel"
              ? "Agent: selecting Docs panel."
              : detail.step === "open_doc"
                ? "Agent: opening selected document."
                : detail.step === "read_start"
                  ? "Agent: starting read-aloud."
                  : detail.step === "highlight_copy"
                    ? "Agent: highlighting topic section for copy."
                  : null;
      if (!label) return;
      setProceduralStatus(label);
    };
    window.addEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    return () => {
      window.removeEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    };
  }, []);

  const clearActiveReadTarget = React.useCallback(() => {
    const target = activeReadTargetRef.current;
    if (target) {
      target.classList.remove(DOC_AUTO_READ_ACTIVE_CLASS);
      target.removeAttribute("data-doc-read-active");
    }
    activeReadTargetRef.current = null;
  }, []);

  const focusActiveReadChunk = React.useCallback(
    (chunkText: string) => {
      const container = contentRef.current;
      if (!container || modeRef.current !== "doc") return null;
      const target = findDocReadTarget(container, chunkText);
      if (!target) return null;
      if (activeReadTargetRef.current && activeReadTargetRef.current !== target) {
        activeReadTargetRef.current.classList.remove(DOC_AUTO_READ_ACTIVE_CLASS);
        activeReadTargetRef.current.removeAttribute("data-doc-read-active");
      }
      target.classList.add(DOC_AUTO_READ_ACTIVE_CLASS);
      target.setAttribute("data-doc-read-active", "true");
      activeReadTargetRef.current = target;
      if (followLiveReadRef.current) {
        keepDocReadTargetInView(container, target);
      }
      return target;
    },
    [],
  );

  const stopAutoRead = React.useCallback(() => {
    stopGlobalDocRead();
    clearActiveReadTarget();
    setIsAutoReading(false);
    setReadProgress(null);
    setFollowLiveRead(true);
    liveReadChunkRef.current = null;
  }, [clearActiveReadTarget]);

  React.useEffect(() => () => stopAutoRead(), [stopAutoRead]);

  React.useEffect(() => {
    clearActiveReadTarget();
  }, [clearActiveReadTarget, currentPath, html]);

  React.useEffect(() => {
    if (!proceduralStatus) return;
    const timeout = window.setTimeout(() => {
      setProceduralStatus((current) => (current === proceduralStatus ? null : current));
    }, 2600);
    return () => window.clearTimeout(timeout);
  }, [proceduralStatus]);

  React.useEffect(() => {
    if (mode !== "doc" || !pendingAutoReadNonce || loading) return;
    const traceId =
      lastProceduralTraceIdRef.current ??
      `docs:auto-read:${currentPath ?? "unknown"}:${pendingAutoReadNonce}`;
    const emitAutoReadEvent = (text: string, ok: boolean, detail?: string) => {
      emitHelixAskLiveEvent({
        contextId: HELIX_ASK_CONTEXT_ID.desktop,
        traceId,
        entry: {
          id: `docs-auto-read:${traceId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          text,
          tool: "docs.auto_read",
          ts: new Date().toISOString(),
          meta: {
            kind: "docs_auto_read",
            ok,
            detail: detail ?? null,
            path: currentPath ?? null,
            pending_auto_read_nonce: pendingAutoReadNonce,
          },
        },
      });
    };

    if (error) {
      setAutoReadError(error);
      clearPendingAutoRead();
      emitAutoReadEvent(`fail: docs auto-read blocked - document load error (${error})`, false, "doc_load_error");
      return;
    }

    if (!currentEntry) {
      const message = "Selected document could not be resolved for read-aloud.";
      setAutoReadError(message);
      clearPendingAutoRead();
      emitAutoReadEvent(`fail: docs auto-read blocked - ${message}`, false, "doc_manifest_miss");
      return;
    }
    if (loadedDocId !== currentEntry.id) {
      return;
    }
    const plain = markdownToSpeechText(rawMarkdown);
    if (!plain) {
      clearPendingAutoRead();
      setAutoReadError("Document has no readable text for voice playback.");
      emitAutoReadEvent("fail: docs auto-read blocked - no readable text extracted.", false, "empty_plain_text");
      return;
    }
    const readKey = `${DOC_AUTO_READ_TAG}:${currentEntry.id}:${pendingAutoReadNonce}`;
    if (globalDocReadKey === readKey) {
      clearPendingAutoRead();
      emitAutoReadEvent("ok: docs auto-read already active for this document.", true, "dedupe");
      return;
    }
    stopGlobalDocRead();
    const controller = new AbortController();
    globalDocReadController = controller;
    globalDocReadKey = readKey;
    setIsAutoReading(true);
    setAutoReadError(null);

    const run = async () => {
      const clipped = plain.slice(0, DOC_AUTO_READ_MAX_CHARS);
      const chunks = splitSpeechChunks(clipped, DOC_AUTO_READ_CHUNK_MAX);
      let heardAudio = false;
      let suppressedChunks = 0;
      emitAutoReadEvent(
        `ok: docs auto-read started (${chunks.length} chunk${chunks.length === 1 ? "" : "s"}).`,
        true,
        "start",
      );
      for (let i = 0; i < chunks.length; i += 1) {
        if (controller.signal.aborted) return;
        const response = await speakVoice(
          {
            text: chunks[i],
            mode: "briefing",
            priority: "info",
            provider: DOC_AUTO_READ_PROVIDER,
            voice_profile_id: DOC_AUTO_READ_PROFILE_ID,
            traceId: `docs:${currentEntry.id}:${pendingAutoReadNonce}`,
            eventId: `docs:${currentEntry.id}:${i + 1}`,
          },
          { signal: controller.signal },
        );
        if (response.kind === "json") {
          if (response.payload?.suppressed) {
            suppressedChunks += 1;
            continue;
          }
          throw new Error(response.payload?.error || response.payload?.message || "voice_response_json");
        }
        heardAudio = true;
        const snippet = chunks[i].slice(0, 220);
        liveReadChunkRef.current = chunks[i];
        setReadProgress({
          chunkIndex: i + 1,
          chunkCount: chunks.length,
          snippet,
        });
        focusActiveReadChunk(chunks[i]);
        await playAutoReadAudio({
          blob: response.blob,
          signal: controller.signal,
        });
      }
      if (!heardAudio) {
        const message =
          suppressedChunks > 0
            ? `No playable audio returned (${suppressedChunks} suppressed chunk${suppressedChunks === 1 ? "" : "s"}).`
            : "No playable audio returned by voice provider.";
        throw new Error(message);
      }
      emitAutoReadEvent("ok: docs auto-read completed.", true, "complete");
    };

    void run()
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unable to read this document aloud.";
        setAutoReadError(message);
        emitAutoReadEvent(`fail: docs auto-read failed (${message}).`, false, "runtime_error");
      })
      .finally(() => {
        if (globalDocReadController === controller) {
          globalDocReadController = null;
          globalDocReadKey = null;
        }
        clearPendingAutoRead();
        setIsAutoReading(false);
        setReadProgress(null);
        setFollowLiveRead(true);
        liveReadChunkRef.current = null;
        clearActiveReadTarget();
      });
  }, [
    clearActiveReadTarget,
    clearPendingAutoRead,
    currentEntry,
    currentPath,
    error,
    focusActiveReadChunk,
    loadedDocId,
    loading,
    mode,
    pendingAutoReadNonce,
    rawMarkdown,
  ]);

  React.useEffect(() => {
    if (!isAutoReading) return;
    if (mode !== "directory") return;
    setFollowLiveRead(false);
  }, [isAutoReading, mode]);

  const handleShowDirectory = React.useCallback(() => {
    if (isAutoReading) {
      setFollowLiveRead(false);
    }
    viewDirectory();
  }, [isAutoReading, viewDirectory]);

  const rejoinLiveRead = React.useCallback(() => {
    if (!currentPath) return;
    viewDoc(currentPath, anchor);
    setFollowLiveRead(true);
    const chunkText = liveReadChunkRef.current;
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (!chunkText) return;
      focusActiveReadChunk(chunkText);
    }, 30);
  }, [anchor, currentPath, focusActiveReadChunk, viewDoc]);

  const queryValue = query.trim().toLowerCase();
  const filteredEntries = React.useMemo(() => {
    return filterDocManifestEntries(queryValue);
  }, [queryValue]);
  const grouped = React.useMemo(() => groupBySubject(filteredEntries), [filteredEntries]);
  const handleDocMathClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const source = target.closest("[data-doc-math-latex]") as HTMLElement | null;
      if (!source) return;
      const latex = source.dataset.docMathLatex?.trim();
      if (!latex) return;
      event.preventDefault();
      event.stopPropagation();
      const actionSource = target.closest("[data-doc-equation-action-id]") as HTMLElement | null;
      const actionId = actionSource?.dataset.docEquationActionId?.trim();
      if (actionId) {
        void executeDocEquationAction({
          currentPath,
          anchor,
          actionId,
          latex,
        });
        return;
      }
      handleDocMathPick({
        latex,
        currentPath,
        anchor,
        clipboardWrite:
          typeof navigator !== "undefined" && navigator.clipboard?.writeText
            ? navigator.clipboard.writeText.bind(navigator.clipboard)
            : null,
      });
    },
    [anchor, currentPath],
  );

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-slate-950/90 text-slate-100">
      {mode === "directory" ? (
        <DirectoryRail
          entries={grouped}
          total={DOC_MANIFEST.length}
          filteredCount={filteredEntries.length}
          currentRoute={currentPath}
          query={query}
          onQueryChange={setQuery}
          onSelect={viewDoc}
          variant="full"
          scrollMemoryKey="docs-viewer:directory"
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <PanelHeader
            mode={mode}
            entry={currentEntry}
            anchor={anchor}
            isAutoReading={isAutoReading}
            autoReadError={autoReadError}
            proceduralStatus={proceduralStatus}
            readProgress={readProgress}
            onStopAutoRead={stopAutoRead}
            onShowDirectory={handleShowDirectory}
            canRejoinLiveRead={false}
            onRejoinLiveRead={rejoinLiveRead}
          />
          <div
            ref={contentRef}
            className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden"
            style={{ scrollbarGutter: "stable" }}
            onScroll={handleContentScroll}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading document…
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-amber-300">Unable to load the document.</p>
                <p className="text-xs text-slate-400">{error}</p>
                {currentEntry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDoc(currentEntry.route, anchor)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            ) : currentEntry ? (
              <article
                className="prose prose-invert max-w-none overflow-x-hidden px-6 py-6 [&_*]:max-w-full [&_a]:break-words [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto"
                onClick={handleDocMathClick}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                Select a document from the directory to open the reader.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type GroupedDocs = {
  label: string;
  entries: DocManifestEntry[];
};

type DirectoryRailProps = {
  entries: GroupedDocs[];
  total: number;
  filteredCount: number;
  currentRoute?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (path: string) => void;
  variant?: "rail" | "full";
  scrollMemoryKey?: string;
};

function DirectoryRail({
  entries,
  total,
  filteredCount,
  currentRoute,
  query,
  onQueryChange,
  onSelect,
  variant = "rail",
  scrollMemoryKey,
}: DirectoryRailProps) {
  const entryRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const rememberPanelScroll = useWorkstationSessionMemoryStore((state) => state.rememberPanelScroll);
  const readPanelScroll = useWorkstationSessionMemoryStore((state) => state.readPanelScroll);
  const isFull = variant === "full";

  React.useLayoutEffect(() => {
    if (!scrollMemoryKey || !scrollRef.current) return;
    const saved = readPanelScroll(scrollMemoryKey);
    if (!saved) return;
    const node = scrollRef.current;
    const restore = () => {
      const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = Math.min(saved.scrollTop, maxScrollTop);
    };
    if (typeof window === "undefined") {
      restore();
      return;
    }
    const frame = window.requestAnimationFrame(restore);
    return () => window.cancelAnimationFrame(frame);
  }, [entries, query, readPanelScroll, scrollMemoryKey]);

  React.useEffect(() => {
    if (!currentRoute) return;
    if (scrollMemoryKey && readPanelScroll(scrollMemoryKey)) return;
    const target = entryRefs.current[currentRoute];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentRoute, query, entries, readPanelScroll, scrollMemoryKey]);

  const handleRailScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!scrollMemoryKey) return;
      const node = event.currentTarget;
      markInteraction("scrolling", "docs-viewer.directory_scroll");
      const scroll = {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
      runWhenQuiet(() => {
        rememberPanelScroll(scrollMemoryKey, scroll);
      }, {
        key: `workstation.scroll_memory:${scrollMemoryKey}`,
        priority: "share_state",
        quietMs: 450,
        timeoutMs: 1800,
      });
    },
    [rememberPanelScroll, scrollMemoryKey],
  );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-slate-950/60",
        isFull ? "w-full" : "w-80 border-r border-white/10"
      )}
    >
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search docs & digests"
            className="h-9 border-none bg-transparent text-sm focus-visible:ring-0"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Showing {filteredCount} of {total} files.
        </p>
      </div>
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto px-2 py-3", isFull && "px-3")}
        onScroll={handleRailScroll}
      >
        {entries.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              <Folder className="h-3 w-3" />
              {group.label}
            </div>
            <ul className="space-y-1.5">
              {group.entries.map((entry) => {
                const selected = entry.route === currentRoute;
                const catalogDate = formatDocCatalogDate(entry);
                return (
                  <li key={entry.id}>
                    <button
                      ref={(node) => {
                        entryRefs.current[entry.route] = node;
                      }}
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                        selected
                          ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/60"
                          : "text-slate-200 hover:bg-white/5"
                      )}
                      onClick={() => onSelect(entry.route)}
                    >
                      <p className="break-words text-sm font-medium leading-tight">{entry.title}</p>
                      {catalogDate ? (
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-cyan-300/75">{catalogDate}</p>
                      ) : null}
                      <p className="break-all text-[11px] text-slate-400">{entry.relativePath}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-slate-400">No documents match that search.</p>
        )}
      </div>
    </aside>
  );
}

type PanelHeaderProps = {
  mode: DocViewerState["mode"];
  entry: DocManifestEntry | null;
  anchor?: string;
  isAutoReading: boolean;
  autoReadError: string | null;
  proceduralStatus: string | null;
  readProgress: {
    chunkIndex: number;
    chunkCount: number;
    snippet: string;
  } | null;
  onStopAutoRead: () => void;
  onShowDirectory: () => void;
  canRejoinLiveRead: boolean;
  onRejoinLiveRead: () => void;
};

type DocViewerState = ReturnType<typeof useDocViewerStore.getState>;

function PanelHeader({
  mode,
  entry,
  anchor,
  isAutoReading,
  autoReadError,
  proceduralStatus,
  readProgress,
  onStopAutoRead,
  onShowDirectory,
  canRejoinLiveRead,
  onRejoinLiveRead,
}: PanelHeaderProps) {
  const title =
    mode === "doc" && entry
      ? entry.title
      : "Docs & Papers Directory";
  const subtitle =
    mode === "doc" && entry
      ? entry.relativePath + (anchor ? ` #${anchor}` : "")
      : "Browse every note, digest, and ethos memo from the repo.";
  const pathRef = mode === "doc" && entry ? buildWorkstationPathRef(entry.relativePath) : null;

  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onShowDirectory}
        aria-label="Back to docs and digests"
        className="h-9 w-9 shrink-0 rounded-full border border-white/10 text-slate-100 hover:bg-white/10 hover:text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        {pathRef ? (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden text-[11px] uppercase tracking-wide text-slate-400 sm:gap-1.5">
              {pathRef.displaySegments.map((segment, index) => {
                const isLast = index === pathRef.displaySegments.length - 1;
                return (
                  <React.Fragment key={`${segment}:${index}`}>
                    <BreadcrumbItem className="min-w-0">
                      <BreadcrumbPage
                        className={cn(
                          "max-w-[12rem] truncate text-[11px] font-normal uppercase tracking-wide",
                          isLast ? "text-slate-200" : "text-slate-500",
                        )}
                        title={segment}
                      >
                        {segment}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {!isLast ? <BreadcrumbSeparator className="text-slate-600" /> : null}
                  </React.Fragment>
                );
              })}
              {anchor ? (
                <>
                  <BreadcrumbSeparator className="text-slate-600" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage
                      className="max-w-[10rem] truncate text-[11px] font-normal uppercase tracking-wide text-cyan-200"
                      title={`#${anchor}`}
                    >
                      #{anchor}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">{subtitle}</p>
        )}
        <h2 className="truncate text-lg font-semibold text-white">{title}</h2>
        {isAutoReading ? (
          <p className="mt-0.5 text-[11px] text-cyan-200">Reading aloud with Auntie Dottie...</p>
        ) : null}
        {proceduralStatus ? <p className="mt-0.5 text-[11px] text-sky-200">{proceduralStatus}</p> : null}
        {readProgress ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-cyan-100/90">
            Read {readProgress.chunkIndex}/{readProgress.chunkCount}: {readProgress.snippet}
          </p>
        ) : null}
        {!isAutoReading && autoReadError ? (
          <p className="mt-0.5 text-[11px] text-amber-300">Read-aloud stopped: {autoReadError}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isAutoReading ? (
          <Button variant="destructive" size="sm" onClick={onStopAutoRead}>
            Stop Reading
          </Button>
        ) : null}
        {canRejoinLiveRead ? (
          <Button variant="outline" size="sm" onClick={onRejoinLiveRead}>
            Rejoin Live Read
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function groupBySubject(entries: DocManifestEntry[]): GroupedDocs[] {
  const map = new Map<string, DocManifestEntry[]>();
  entries.forEach((entry) => {
    const label = entry.subjectLabel || "General Reference";
    const bucket = map.get(label);
    if (bucket) {
      bucket.push(entry);
    } else {
      map.set(label, [entry]);
    }
  });
  return Array.from(map.entries())
    .sort((a, b) => groupRecencyScore(b[1]) - groupRecencyScore(a[1]) || a[0].localeCompare(b[0]))
    .map(([label, bucket]) => ({
      label,
      entries: bucket.sort(compareDocCatalogEntries),
    }));
}

function groupRecencyScore(entries: DocManifestEntry[]): number {
  return entries.reduce((score, entry) => {
    return Math.max(score, docCatalogTimestamp(entry));
  }, 0);
}

function formatDocCatalogDate(entry: DocManifestEntry): string | null {
  if (!entry.catalogDate) return null;
  if (entry.catalogDateSource === "mtime") return `Edited ${entry.catalogDate}`;
  return `Dated ${entry.catalogDate}`;
}

function markdownToSpeechText(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|/gm, "")
    .replace(/\|/g, " ")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitSpeechChunks(source: string, maxChars: number): string[] {
  const text = source.trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= maxChars) {
      chunks.push(rest.trim());
      break;
    }
    const window = rest.slice(0, maxChars);
    const sentenceBreak = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
    const splitAt = sentenceBreak > 200 ? sentenceBreak + 1 : window.lastIndexOf(" ");
    const index = splitAt > 0 ? splitAt : maxChars;
    const chunk = rest.slice(0, index).trim();
    if (chunk) chunks.push(chunk);
    rest = rest.slice(index).trimStart();
  }
  return chunks;
}

async function playAutoReadAudio(args: {
  blob: Blob;
  signal: AbortSignal;
}): Promise<void> {
  if (args.signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (globalDocReadUrl) {
    URL.revokeObjectURL(globalDocReadUrl);
    globalDocReadUrl = null;
  }
  const url = URL.createObjectURL(args.blob);
  globalDocReadUrl = url;
  const audio = new Audio(url);
  globalDocReadAudio = audio;
  await new Promise<void>((resolve, reject) => {
    const finalize = (error?: unknown) => {
      audio.onended = null;
      audio.onerror = null;
      args.signal.removeEventListener("abort", handleAbort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    const handleAbort = () => {
      audio.pause();
      finalize(new DOMException("Aborted", "AbortError"));
    };
    audio.onended = () => finalize();
    audio.onerror = () => finalize(new Error("audio_playback_failed"));
    args.signal.addEventListener("abort", handleAbort, { once: true });
    void audio.play().catch((error) => finalize(error));
  });
}

function findDocReadTarget(container: HTMLDivElement, chunkText: string): HTMLElement | null {
  const chunk = normalizeDocReadText(chunkText);
  if (!chunk) return null;
  const article = container.querySelector("article") ?? container;
  const blocks = Array.from(
    article.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,pre"),
  ).filter((element) => normalizeDocReadText(element.textContent ?? "").length > 0);
  if (!blocks.length) return article instanceof HTMLElement ? article : null;

  const directNeedle = chunk.slice(0, Math.min(160, chunk.length));
  const directMatch = blocks.find((element) => normalizeDocReadText(element.textContent ?? "").includes(directNeedle));
  if (directMatch) return directMatch;

  const terms = chunk
    .split(" ")
    .filter((term) => term.length > 3)
    .slice(0, 34);
  let best: { element: HTMLElement; score: number } | null = null;
  for (const element of blocks) {
    const text = normalizeDocReadText(element.textContent ?? "");
    const matches = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const prefixBoost = text && chunk.includes(text.slice(0, Math.min(80, text.length))) ? 8 : 0;
    const score = matches + prefixBoost;
    if (!best || score > best.score) {
      best = { element, score };
    }
  }
  return best && best.score >= Math.max(3, Math.ceil(Math.min(terms.length, 18) * 0.28)) ? best.element : null;
}

function keepDocReadTargetInView(container: HTMLDivElement, target: HTMLElement) {
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  if (maxTop <= 0) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const comfortPad = Math.min(180, Math.max(72, containerRect.height * 0.24));
  const alreadyComfortable =
    targetRect.top >= containerRect.top + comfortPad &&
    targetRect.bottom <= containerRect.bottom - comfortPad;
  if (alreadyComfortable) return;
  const targetTop = targetRect.top - containerRect.top + container.scrollTop;
  const centeredTop = targetTop + targetRect.height / 2 - container.clientHeight / 2;
  container.scrollTo({
    top: Math.max(0, Math.min(maxTop, Math.round(centeredTop))),
    behavior: "smooth",
  });
}

function normalizeDocReadText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cssEscape(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

function renderDocMath(expression: string, displayMode: boolean, docPath?: string | null): string {
  if (!expression.trim()) return "";
  try {
    const rendered = renderKatexToString(expression, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
    const escapedExpression = escapeHtml(expression);
    const className = displayMode
      ? "doc-math-clickable doc-math-clickable-display"
      : "doc-math-clickable doc-math-clickable-inline";
    const equationActionEntry = getDocEquationActionEntryForLatex(docPath, expression);
    const theoryActions = getDocEquationTheoryActions(equationActionEntry);
    const actionMarkup = theoryActions
      .map((action) => {
        const title = action.claimBoundaryNote
          ? `${action.label}: ${action.claimBoundaryNote}`
          : action.label;
        return `<span class="doc-equation-action-chip" data-doc-equation-action-id="${escapeHtml(action.actionId)}" role="button" tabindex="0" title="${escapeHtml(title)}">T</span>`;
      })
      .join("");
    const equationIdAttr = equationActionEntry
      ? ` data-doc-equation-id="${escapeHtml(equationActionEntry.equationId)}"`
      : "";
    if (displayMode) {
      return `<div class="${className}"${equationIdAttr} data-doc-math-latex="${escapedExpression}" role="button" tabindex="0" title="Copy LaTeX to clipboard and ingest in calculator">${actionMarkup}${rendered}</div>`;
    }
    return `<span class="${className}"${equationIdAttr} data-doc-math-latex="${escapedExpression}" role="button" tabindex="0" title="Copy LaTeX to clipboard and ingest in calculator">${rendered}${actionMarkup}</span>`;
  } catch {
    return `<code>${escapeHtml(expression)}</code>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMathMarkdown(markdown: string, docPath?: string | null): string {
  if (!markdown) return markdown;
  const FENCE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_RE.exec(markdown)) !== null) {
    output += renderMathInNonCodeMarkdown(markdown.slice(cursor, match.index), docPath);
    output += renderMathFenceBlock(match[0], docPath) ?? match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathInNonCodeMarkdown(markdown.slice(cursor), docPath);
  return output;
}

function renderMathInNonCodeMarkdown(segment: string, docPath?: string | null): string {
  const INLINE_CODE_RE = /`[^`\n]*`/g;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_CODE_RE.exec(segment)) !== null) {
    output += renderMathExpressions(segment.slice(cursor, match.index), docPath);
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathExpressions(segment.slice(cursor), docPath);
  return output;
}

function renderMathExpressions(source: string, docPath?: string | null): string {
  return source
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_full, expr: string) => renderDocMath(expr, true, docPath))
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_full, expr: string) => renderDocMath(expr, true, docPath))
    .replace(/\\\((.+?)\\\)/g, (_full, expr: string) => renderDocMath(expr, false, docPath));
}

function renderMathFenceBlock(fence: string, docPath?: string | null): string | null {
  const match = fence.match(/^(?:```|~~~)\s*math\s*\r?\n([\s\S]*?)\r?\n(?:```|~~~)\s*$/i);
  if (!match) return null;
  const expr = match[1].trim();
  if (!expr) return "";
  return renderDocMath(expr, true, docPath);
}

function renderMathInRenderedHtml(html: string, docPath?: string | null): string {
  if (!html) return html;
  const CODE_BLOCK_RE = /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = CODE_BLOCK_RE.exec(html)) !== null) {
    output += renderMathExpressions(html.slice(cursor, match.index), docPath);
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathExpressions(html.slice(cursor), docPath);
  return output;
}

export default DocViewerPanel;
