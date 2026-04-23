import React from "react";
import { marked, type MarkedOptions } from "marked";
import { BookOpen, Folder, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speakVoice } from "@/lib/agi/api";
import { DOC_MANIFEST, findDocEntry, type DocManifestEntry } from "@/lib/docs/docManifest";
import { consumeDocViewerIntent, makeDocHref } from "@/lib/docs/docViewer";
import {
  HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT,
  type HelixWorkstationProceduralStepPayload,
} from "@/lib/workstation/proceduralPlaybackContract";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useDocViewerStore } from "@/store/useDocViewerStore";

const DOC_MARKED_OPTIONS: MarkedOptions & { mangle?: boolean; headerIds?: boolean } = {
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
};

marked.setOptions(DOC_MARKED_OPTIONS);

const DOC_AUTO_READ_PROVIDER = "elevenlabs";
const DOC_AUTO_READ_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const DOC_AUTO_READ_CHUNK_MAX = 560;
const DOC_AUTO_READ_MAX_CHARS = 12_000;
const DOC_AUTO_READ_TAG = "helix-doc-reader";

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
    recent,
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
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const modeRef = React.useRef(mode);
  const followLiveReadRef = React.useRef(followLiveRead);
  const liveReadRatioRef = React.useRef(0);
  const lastProceduralTraceIdRef = React.useRef<string | null>(null);
  const currentEntry = React.useMemo(() => (currentPath ? findDocEntry(currentPath) : null), [currentPath]);

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
        const rendered = marked.parse(raw);
        setHtml(typeof rendered === "string" ? rendered : String(rendered));
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

  const stopAutoRead = React.useCallback(() => {
    stopGlobalDocRead();
    setIsAutoReading(false);
    setReadProgress(null);
    setFollowLiveRead(true);
    liveReadRatioRef.current = 0;
  }, []);

  React.useEffect(() => () => stopAutoRead(), [stopAutoRead]);

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
        const snippet = chunks[i].slice(0, 220);
        setReadProgress({
          chunkIndex: i + 1,
          chunkCount: chunks.length,
          snippet,
        });
        const ratio = i / Math.max(1, chunks.length - 1);
        liveReadRatioRef.current = ratio;
        if (
          contentRef.current &&
          modeRef.current === "doc" &&
          followLiveReadRef.current
        ) {
          scrollDocReadProgress(contentRef.current, ratio);
        }
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
      });
  }, [
    clearPendingAutoRead,
    currentEntry,
    currentPath,
    error,
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
    const ratio = liveReadRatioRef.current;
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (!contentRef.current) return;
      scrollDocReadProgress(contentRef.current, ratio);
    }, 30);
  }, [anchor, currentPath, viewDoc]);

  const queryValue = query.trim().toLowerCase();
  const filteredEntries = React.useMemo(() => {
    if (!queryValue) return DOC_MANIFEST;
    return DOC_MANIFEST.filter((entry) => entry.searchText.includes(queryValue));
  }, [queryValue]);
  const grouped = React.useMemo(() => groupByFolder(filteredEntries), [filteredEntries]);
  const recentEntries = React.useMemo(
    () =>
      recent
        .map((route) => findDocEntry(route))
        .filter(Boolean) as DocManifestEntry[],
    [recent],
  );

  return (
    <div className="flex h-full w-full bg-slate-950/90 text-slate-100">
      <DirectoryRail
        entries={grouped}
        total={DOC_MANIFEST.length}
        filteredCount={filteredEntries.length}
        currentRoute={currentPath}
        query={query}
        onQueryChange={setQuery}
        onSelect={viewDoc}
      />
      <div className="flex flex-1 flex-col">
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
          canRejoinLiveRead={isAutoReading && mode === "directory" && Boolean(currentPath)}
          onRejoinLiveRead={rejoinLiveRead}
        />
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {mode === "directory" ? (
            <DirectoryView recent={recentEntries} onOpen={viewDoc} />
          ) : loading ? (
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
              className="prose prose-invert max-w-none px-6 py-6"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <DirectoryView recent={recentEntries} onOpen={viewDoc} />
          )}
        </div>
      </div>
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
};

function DirectoryRail({
  entries,
  total,
  filteredCount,
  currentRoute,
  query,
  onQueryChange,
  onSelect,
}: DirectoryRailProps) {
  const entryRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  React.useEffect(() => {
    if (!currentRoute) return;
    const target = entryRefs.current[currentRoute];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentRoute, query, entries]);

  return (
    <aside className="flex h-full w-80 flex-col border-r border-white/10 bg-slate-950/60">
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
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {entries.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              <Folder className="h-3 w-3" />
              {group.label}
            </div>
            <ul className="space-y-1.5">
              {group.entries.map((entry) => {
                const selected = entry.route === currentRoute;
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
                      <p className="text-sm font-medium leading-tight">{entry.title}</p>
                      <p className="text-[11px] text-slate-400">{entry.relativePath}</p>
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
      ? entry.relativePath + (anchor ? ` · #${anchor}` : "")
      : "Browse every note, digest, and ethos memo from the repo.";

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{subtitle}</p>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
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
      <div className="flex items-center gap-2">
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
        <Button
          variant="secondary"
          size="sm"
          onClick={onShowDirectory}
        >
          Directory
        </Button>
        {mode === "doc" && entry && (
          <a
            href={makeDocHref(entry.route, anchor)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-sm text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100"
          >
            <Link2 className="h-3.5 w-3.5" />
            Open Tab
          </a>
        )}
      </div>
    </header>
  );
}

type DirectoryViewProps = {
  recent: DocManifestEntry[];
  onOpen: (path: string) => void;
};

function DirectoryView({ recent, onOpen }: DirectoryViewProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-slate-300">
      <BookOpen className="h-10 w-10 text-cyan-300" />
      <div>
        <h3 className="text-lg font-semibold text-white">Browse docs & digests</h3>
        <p className="text-sm text-slate-400">
          Use the directory rail to the left or search for a Ford–Roman brief, ethos memo, or sweep note.
        </p>
      </div>
      {recent.length > 0 && (
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Recent files</p>
          <ul className="mt-2 space-y-1.5">
            {recent.map((entry) => (
              <li key={entry.id}>
                <button
                  className="w-full rounded-lg border border-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                  onClick={() => onOpen(entry.route)}
                >
                  <div className="font-semibold">{entry.title}</div>
                  <div className="text-[11px] text-slate-400">{entry.relativePath}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function groupByFolder(entries: DocManifestEntry[]): GroupedDocs[] {
  const map = new Map<string, DocManifestEntry[]>();
  entries.forEach((entry) => {
    const label = entry.folderChain.length ? entry.folderChain.join(" / ") : "root";
    const bucket = map.get(label);
    if (bucket) {
      bucket.push(entry);
    } else {
      map.set(label, [entry]);
    }
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, bucket]) => ({
      label,
      entries: bucket.sort((a, b) => a.title.localeCompare(b.title)),
    }));
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

function scrollDocReadProgress(container: HTMLDivElement, ratio: number) {
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  if (maxTop <= 0) return;
  const clamped = Math.max(0, Math.min(1, ratio));
  container.scrollTo({
    top: Math.round(maxTop * clamped),
    behavior: "smooth",
  });
}

function cssEscape(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

export default DocViewerPanel;
