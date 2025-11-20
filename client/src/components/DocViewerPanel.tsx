import React from "react";
import { marked, type MarkedOptions } from "marked";
import { BookOpen, Folder, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOC_MANIFEST, findDocEntry, type DocManifestEntry } from "@/lib/docs/docManifest";
import { consumeDocViewerIntent, makeDocHref } from "@/lib/docs/docViewer";
import { useDocViewerStore } from "@/store/useDocViewerStore";

const DOC_MARKED_OPTIONS: MarkedOptions & { mangle?: boolean; headerIds?: boolean } = {
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
};

marked.setOptions(DOC_MARKED_OPTIONS);

export function DocViewerPanel() {
  const {
    mode,
    currentPath,
    anchor,
    recent,
    viewDirectory,
    viewDoc,
    applyIntent,
  } = useDocViewerStore();
  const [query, setQuery] = React.useState("");
  const [html, setHtml] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const currentEntry = React.useMemo(() => (currentPath ? findDocEntry(currentPath) : null), [currentPath]);

  React.useEffect(() => {
    const intent = consumeDocViewerIntent();
    if (intent) {
      applyIntent(intent);
    }
  }, [applyIntent]);

  React.useEffect(() => {
    if (mode !== "doc" || !currentEntry) {
      setHtml("");
      setError(null);
      setLoading(false);
      return;
    }
    let canceled = false;
    setLoading(true);
    setError(null);
    currentEntry
      .loader()
      .then((raw) => {
        if (canceled) return;
        const rendered = marked.parse(raw);
        setHtml(typeof rendered === "string" ? rendered : String(rendered));
      })
      .catch((err) => {
        if (canceled) return;
        setError(err instanceof Error ? err.message : "Unable to render document.");
        setHtml("");
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
          onShowDirectory={viewDirectory}
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
  onShowDirectory: () => void;
};

type DocViewerState = ReturnType<typeof useDocViewerStore.getState>;

function PanelHeader({ mode, entry, anchor, onShowDirectory }: PanelHeaderProps) {
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
      </div>
      <div className="flex items-center gap-2">
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

function cssEscape(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

export default DocViewerPanel;
