import { useEffect, useMemo, useState } from "react";
import type { IdeologyNode } from "@/lib/ideology-types";
import { useIdeology } from "@/hooks/use-ideology";
import { useIdeologyBeliefGraph } from "@/hooks/use-ideology-belief-graph";
import { useIdeologyArtifacts } from "@/hooks/use-ideology-artifacts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CitizensArcView from "@/components/ideology/CitizensArcView";
import { cn } from "@/lib/utils";

type IdeologyPanelProps = {
  initialId?: string;
  className?: string;
};

const formatMetric = (value: number | null | undefined, digits = 3) =>
  Number.isFinite(value) ? (value as number).toFixed(digits) : "--";

const CITIZENS_ARC_ID = "citizens-arc";

export function IdeologyPanel({ initialId, className }: IdeologyPanelProps) {
  const { data, isLoading, error, childrenOf, resolve } = useIdeology();
  const beliefGraphRequest = useMemo(
    () => ({
      includeGraph: false,
      includeAttempts: false,
      includeSeeAlso: false,
      edgeMode: "bidirectional" as const,
    }),
    [],
  );
  const {
    data: beliefGraph,
    isLoading: beliefLoading,
    error: beliefError,
  } = useIdeologyBeliefGraph(beliefGraphRequest);
  const initialQueryNode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("node") ?? undefined
      : undefined;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId ?? initialQueryNode ?? null
  );
  const selected = selectedId ? resolve?.(selectedId) ?? null : null;
  const [query, setQuery] = useState("");
  const [artifactQuery, setArtifactQuery] = useState("");
  const artifactContextId = selected?.id ?? undefined;
  const artifactPanelId = "mission-ethos";
  const {
    data: artifactsData,
    isLoading: artifactsLoading,
    error: artifactsError,
  } = useIdeologyArtifacts({
    query: artifactQuery.trim() || undefined,
    panelId: artifactPanelId,
    nodeId: artifactContextId,
    limit: 12,
  });
  const artifactItems = artifactsData?.items ?? [];
  const artifactTotal = artifactsData?.total ?? 0;

  useEffect(() => {
    if (!selectedId && data?.rootId) {
      setSelectedId(data.rootId);
    }
  }, [data?.rootId, selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (selectedId) {
      url.searchParams.set("node", selectedId);
    } else {
      url.searchParams.delete("node");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedId]);

  const flatNodes = useMemo(() => data?.nodes ?? [], [data]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return flatNodes.filter((node) => {
      const inTitle = node.title.toLowerCase().includes(term);
      const inExcerpt = node.excerpt?.toLowerCase().includes(term) ?? false;
      const inTags = node.tags?.some((tag) => tag.toLowerCase().includes(term)) ?? false;
      return inTitle || inExcerpt || inTags;
    });
  }, [flatNodes, query]);

  const parentOf = useMemo(() => {
    const pairs = new Map<string, string | null>();
    if (data) {
      for (const node of data.nodes) {
        for (const child of node.children ?? []) {
          pairs.set(child, node.id);
        }
      }
      pairs.set(data.rootId, null);
    }
    return pairs;
  }, [data]);

  const breadcrumbs = useMemo(() => {
    if (!selected || !parentOf.size) return [];
    const trail: IdeologyNode[] = [];
    let cursor: IdeologyNode | null = selected;
    while (cursor) {
      trail.unshift(cursor);
      const nextParent: string | null | undefined = parentOf.get(cursor.id);
      cursor = nextParent ? resolve?.(nextParent) ?? null : null;
    }
    return trail;
  }, [parentOf, resolve, selected]);

  const handleAction = (nodeId: string | undefined, actionKind?: string, payload?: any) => {
    if (!actionKind) return;
    if (actionKind === "gotoNode" && payload?.to) {
      setSelectedId(payload.to);
      return;
    }
    if (typeof window === "undefined") return;
    if (actionKind === "openPanel") {
      const detail = { id: payload?.panelId ?? nodeId, params: payload?.params };
      window.dispatchEvent(new CustomEvent("open-helix-panel", { detail }));
      return;
    }
    if (actionKind === "openUrl" && payload?.href) {
      window.open(payload.href, "_blank", "noopener");
      return;
    }
    if (actionKind === "openSettings") {
      window.dispatchEvent(
        new CustomEvent("open-desktop-settings", { detail: { tab: payload?.tab ?? "preferences" } })
      );
      return;
    }
    if (actionKind === "openKnowledgeProject" && payload?.projectId) {
      window.dispatchEvent(
        new CustomEvent("open-knowledge-project", { detail: { projectId: payload.projectId } })
      );
    }
  };

  const renderBody = (node: IdeologyNode | null) => {
    if (!node?.bodyMD) return null;
    const paragraphs = node.bodyMD
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    const renderText = (text: string) =>
      text.split(/(\[\[node:[a-z0-9-]+\]\])/gi).map((chunk, index) => {
        const match = /\[\[node:([a-z0-9-]+)\]\]/i.exec(chunk);
        if (!match) return <span key={`${chunk}-${index}`}>{chunk}</span>;
        const target = resolve?.(match[1]);
        return (
          <button
            key={`${chunk}-${index}`}
            className="underline underline-offset-2 hover:no-underline text-sky-500"
            onClick={() => setSelectedId(target?.id ?? match[1])}
          >
            {target?.title ?? match[1]}
          </button>
        );
      });
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {paragraphs.map((paragraph, index) => (
          <p key={`paragraph-${index}`}>{renderText(paragraph)}</p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-slate-300">Loading ideology...</div>;
  }
  if (error || !data) {
    return (
      <div className="p-4 text-sm text-red-400">
        Unable to load ideology – {error instanceof Error ? error.message : "unknown error"}.
      </div>
    );
  }

  const rootNode = resolve?.(data.rootId) ?? null;
  const gateStatus = beliefGraph?.gate?.status ?? "unknown";
  const gateLabel =
    gateStatus === "pass" ? "PASS" : gateStatus === "fail" ? "FAIL" : "UNKNOWN";
  const gateTone =
    gateStatus === "pass"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      : gateStatus === "fail"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
        : "border-slate-500/40 bg-slate-500/10 text-slate-300";

  return (
    <div
      className={cn(
        "grid min-h-full grid-cols-12 gap-3 p-3 text-slate-100 bg-slate-950/70",
        className
      )}
    >
      <div className="col-span-12 lg:col-span-3 space-y-3">
        <Card className="p-3 bg-slate-950/50 border-white/10">
          <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
            Search
            <input
              aria-label="Search ideology nodes"
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              placeholder="Titles, tags, excerpts..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Separator className="my-3 bg-white/10" />
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Ideology Tree</div>
          <nav aria-label="Ideology tree" role="tree" className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {rootNode ? (
              <TreeNode
                nodeId={rootNode.id}
                depth={0}
                selectedId={selected?.id ?? null}
                onSelect={(id) => setSelectedId(id)}
                resolve={resolve}
                childrenOf={childrenOf}
              />
            ) : (
              <p className="text-sm text-slate-400">No root node defined.</p>
            )}
          </nav>
        </Card>
        {query.trim() && (
          <Card className="p-3 bg-slate-950/50 border-white/10">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Matches</div>
            <ul className="mt-2 space-y-1 text-sm">
              {filtered.length === 0 && <li className="text-slate-500">No matches.</li>}
              {filtered.slice(0, 40).map((node) => (
                <li key={node.id}>
                  <button
                    className={cn(
                      "w-full rounded-md px-2 py-1 text-left transition",
                      node.id === selected?.id
                        ? "bg-sky-500/20 text-white"
                        : "text-slate-300 hover:bg-white/5"
                    )}
                    onClick={() => setSelectedId(node.id)}
                  >
                    <span className="font-medium">{node.title}</span>
                    {node.tags?.length ? (
                      <span className="ml-2 text-xs text-slate-400">#{node.tags[0]}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="col-span-12 space-y-3 lg:col-span-6">
        <Card className="p-5 bg-slate-950/60 border-white/10 min-h-[60vh]">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.id} className="flex items-center gap-2">
                    <button
                      className="text-slate-300 hover:text-white hover:underline underline-offset-2"
                      onClick={() => setSelectedId(crumb.id)}
                    >
                      {crumb.title}
                    </button>
                    {index < breadcrumbs.length - 1 ? <span className="text-slate-600">/</span> : null}
                  </span>
                ))}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-white">{selected.title}</h1>
              {selected.excerpt && (
                <p className="mt-1 text-sm text-slate-300">{selected.excerpt}</p>
              )}
              {selected.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <Separator className="my-4 bg-white/10" />
              {selected.id === CITIZENS_ARC_ID ? (
                <CitizensArcView
                  onSelectNode={setSelectedId}
                  resolve={resolve}
                />
              ) : (
                renderBody(selected)
              )}
              {selected.links && selected.links.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Links
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.links.map((link) => {
                      const target = resolve?.(link.to);
                      return (
                        <button
                          key={`${selected.id}-${link.rel}-${link.to}`}
                          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-left text-sm text-slate-200 transition hover:border-sky-400/40"
                          onClick={() => setSelectedId(target?.id ?? link.to)}
                        >
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">{link.rel}</div>
                          <div className="font-medium text-white">{target?.title ?? link.to}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Select a node to explore its vows.
            </div>
          )}
        </Card>

        {selected?.actions && selected.actions.length > 0 && (
          <Card className="p-4 bg-slate-950/60 border-white/10">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 mb-3">
              Act on this
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.actions.map((action, index) => (
                <button
                  key={`${selected.id}-action-${index}`}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-sky-400/40"
                  onClick={() => handleAction(selected.id, action.action.kind, action.action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-3">
        <Card className="p-4 bg-slate-950/60 border-white/10">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Belief graph
          </div>
          {beliefLoading ? (
            <p className="mt-2 text-xs text-slate-400">Checking constraints...</p>
          ) : beliefError || !beliefGraph ? (
            <p className="mt-2 text-xs text-rose-300">
              {beliefError instanceof Error
                ? beliefError.message
                : "Unable to load belief graph."}
            </p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={`border ${gateTone}`}>Gate {gateLabel}</Badge>
                <Badge variant="secondary">
                  Nodes {beliefGraph.summary.nodeCount}
                </Badge>
                <Badge variant="secondary">
                  Edges {beliefGraph.summary.edgeCount}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Violations</span>
                  <span>{beliefGraph.constraints?.violationCount ?? "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Weight</span>
                  <span>{formatMetric(beliefGraph.constraints?.violationWeight, 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Axiom</span>
                  <span>{beliefGraph.constraints?.axiomViolations ?? "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Implies</span>
                  <span>{beliefGraph.constraints?.impliesViolations ?? "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Excludes</span>
                  <span>{beliefGraph.constraints?.excludesViolations ?? "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max pressure</span>
                  <span>{formatMetric(beliefGraph.constraints?.maxAbsPressure, 3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Iterations</span>
                  <span>{beliefGraph.iterations}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Accepted</span>
                  <span>
                    {beliefGraph.accepted
                      ? `yes @${beliefGraph.acceptedIteration ?? 0}`
                      : "no"}
                  </span>
                </div>
              </div>
              {(beliefGraph.summary.missingNodes.length > 0 ||
                beliefGraph.summary.unknownIds.length > 0 ||
                beliefGraph.summary.conflictIds.length > 0) && (
                <div className="mt-3 text-[11px] text-slate-500">
                  {beliefGraph.summary.missingNodes.length > 0
                    ? `Missing nodes: ${beliefGraph.summary.missingNodes.length}. `
                    : ""}
                  {beliefGraph.summary.unknownIds.length > 0
                    ? `Unknown ids: ${beliefGraph.summary.unknownIds.length}. `
                    : ""}
                  {beliefGraph.summary.conflictIds.length > 0
                    ? `Conflicts: ${beliefGraph.summary.conflictIds.length}.`
                    : ""}
                </div>
              )}
            </>
          )}
        </Card>
        <Card className="p-4 bg-slate-950/60 border-white/10">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Artifacts
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Context: {selected?.title ?? "Mission Ethos"} ({artifactTotal})
          </div>
          <input
            aria-label="Search artifacts"
            className="mt-3 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
            placeholder="Search artifacts..."
            value={artifactQuery}
            onChange={(event) => setArtifactQuery(event.target.value)}
          />
          {artifactsLoading ? (
            <p className="mt-3 text-xs text-slate-400">Loading artifacts...</p>
          ) : artifactsError ? (
            <p className="mt-3 text-xs text-rose-300">
              {artifactsError instanceof Error
                ? artifactsError.message
                : "Unable to load artifacts."}
            </p>
          ) : artifactItems.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No artifacts matched this context.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {artifactItems.map((artifact) => (
                <li
                  key={artifact.id}
                  className="rounded-md border border-white/10 bg-white/5 p-2"
                >
                  <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    {artifact.exportKind}
                  </div>
                  <div className="text-sm font-medium text-white">{artifact.title}</div>
                  {artifact.summary && (
                    <div className="mt-1 text-xs text-slate-400">
                      {artifact.summary}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                    {artifact.formats?.includes("png") && (
                      <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5">
                        PNG
                      </span>
                    )}
                    {(artifact.tags ?? []).slice(0, 4).map((tag) => (
                      <span
                        key={`${artifact.id}-${tag}`}
                        className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4 bg-slate-950/60 border-white/10">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            References
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(selected?.references ?? []).length === 0 && (
              <li className="text-slate-500">No references attached.</li>
            )}
            {selected?.references?.map((ref, index) => {
              if (ref.kind === "doc") {
                const href = ref.path.startsWith("http") ? ref.path : `/${ref.path}`;
                return (
                  <li key={`ref-${index}`}>
                    <a
                      className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ref.title}
                    </a>
                  </li>
                );
              }
              if (ref.kind === "url") {
                return (
                  <li key={`ref-${index}`}>
                    <a
                      className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ref.title}
                    </a>
                  </li>
                );
              }
              if (ref.kind === "panel") {
                return (
                  <li key={`ref-${index}`}>
                    <button
                      className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                      onClick={() => handleAction(selected?.id, "openPanel", ref)}
                    >
                      {ref.title}
                    </button>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

type TreeNodeProps = {
  nodeId: string;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  resolve?: (id: string) => IdeologyNode | null;
  childrenOf: (id: string) => IdeologyNode[];
};

function TreeNode({ nodeId, depth, selectedId, onSelect, resolve, childrenOf }: TreeNodeProps) {
  const node = resolve?.(nodeId);
  const children = childrenOf(nodeId);
  const [open, setOpen] = useState(true);
  const isSelected = node?.id === selectedId;
  return (
    <div role="treeitem" aria-level={depth + 1} aria-expanded={children.length ? open : undefined}>
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition",
          isSelected ? "bg-sky-500/20 text-white" : "text-slate-300 hover:bg-white/5"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(nodeId)}
        onDoubleClick={() => children.length && setOpen((prev) => !prev)}
      >
        {children.length > 0 ? (
          <span className="text-xs text-slate-500">{open ? "▾" : "▸"}</span>
        ) : (
          <span className="text-xs text-slate-600">•</span>
        )}
        <span>{node?.title ?? nodeId}</span>
      </button>
      {open && children.length > 0 && (
        <div role="group" className="ml-2 border-l border-white/5 pl-2">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              nodeId={child.id}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              resolve={resolve}
              childrenOf={childrenOf}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default IdeologyPanel;
