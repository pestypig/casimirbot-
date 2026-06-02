import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Layers, Link2, Search, Shield, Waypoints } from "lucide-react";
import type {
  StagePlayBadgeEdgeV1,
  StagePlayBadgeGraphRecommendedActionV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStagePlayBadgeGraphPanelStore } from "@/store/useStagePlayBadgeGraphPanelStore";
import {
  selectActiveLiveAnswerEnvironment,
  useLiveAnswerEnvironmentStore,
} from "@/store/useLiveAnswerEnvironmentStore";

const STAGE_PLAY_PANEL_THREAD_ID = "helix-ask:desktop";

async function fetchStagePlayBadgeGraph(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<StagePlayBadgeGraphV1> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  const response = await fetch(`/api/helix/stage-play/graph?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play graph request failed: ${response.status}`);
  }
  return await response.json() as StagePlayBadgeGraphV1;
}

function labelize(value: string): string {
  return value.replace(/[._-]/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b));
}

function statusTone(status: string): string {
  if (status === "blocked") return "border-rose-700 bg-rose-950/40 text-rose-100";
  if (status === "missing_evidence") return "border-amber-700 bg-amber-950/40 text-amber-100";
  if (status === "candidate" || status === "ask_user_required") return "border-cyan-700 bg-cyan-950/40 text-cyan-100";
  if (status === "available" || status === "observed") return "border-emerald-700 bg-emerald-950/35 text-emerald-100";
  return "border-slate-700 bg-slate-950/70 text-slate-200";
}

function kindTone(kind: string): string {
  if (kind === "hazard" || kind === "blocked_affordance") return "border-rose-800/70 bg-rose-950/25";
  if (kind === "procedural_binding" || kind === "intent_module") return "border-violet-800/70 bg-violet-950/25";
  if (kind === "affordance" || kind === "resource") return "border-emerald-800/70 bg-emerald-950/25";
  if (kind === "setting" || kind === "actor") return "border-cyan-800/70 bg-cyan-950/25";
  return "border-slate-800 bg-slate-950/70";
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-500"
      >
        <option value="all">All</option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {labelize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function BadgeButton({
  badge,
  selected,
  onSelect,
}: {
  badge: StagePlayBadgeV1;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition ${
        selected
          ? "border-cyan-500 bg-cyan-950/45 text-cyan-50"
          : `${kindTone(badge.kind)} text-slate-100 hover:border-slate-600`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{badge.title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-slate-400">{badge.plainMeaning}</div>
        </div>
        {badge.kind === "blocked_affordance" || badge.status === "blocked" ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-label="Blocked move" />
        ) : badge.kind === "procedural_binding" ? (
          <Waypoints className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-label="Procedural binding" />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(badge.kind)}
        </Badge>
        <Badge variant="outline" className={`text-[10px] ${statusTone(badge.status)}`}>
          {labelize(badge.status)}
        </Badge>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
          {badge.confidence.toFixed(2)}
        </Badge>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-2 text-sm text-slate-200">{children}</div>
    </section>
  );
}

function StagePlayGraphCanvas({
  graph,
  selectedBadgeIds,
  selectedBadgeId,
  onSelect,
}: {
  graph: StagePlayBadgeGraphV1;
  selectedBadgeIds: string[];
  selectedBadgeId: string | null;
  onSelect: (badgeId: string) => void;
}) {
  const columns = useMemo(() => {
    const order = [
      "setting",
      "actor",
      "resource",
      "prop",
      "hazard",
      "affordance",
      "blocked_affordance",
      "intent_module",
      "procedural_binding",
      "recommended_check",
      "admission_gate",
      "missing_evidence",
    ];
    const grouped = new Map<string, StagePlayBadgeV1[]>();
    for (const kind of order) grouped.set(kind, []);
    for (const badge of graph.badges) {
      const group = grouped.get(badge.kind) ?? [];
      group.push(badge);
      grouped.set(badge.kind, group);
    }
    return Array.from(grouped.entries()).filter(([, badges]) => badges.length > 0);
  }, [graph.badges]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    columns.forEach(([, badges], columnIndex) => {
      badges.forEach((badge, rowIndex) => {
        map.set(badge.id, {
          x: 120 + columnIndex * 190,
          y: 86 + rowIndex * 92,
        });
      });
    });
    return map;
  }, [columns]);

  const width = Math.max(780, columns.length * 190 + 140);
  const height = Math.max(420, Math.max(...columns.map(([, badges]) => badges.length), 1) * 92 + 120);
  const selectedSet = new Set(selectedBadgeIds);
  const relatedEdgeIds = new Set(
    graph.edges
      .filter((edge: StagePlayBadgeEdgeV1) =>
        selectedBadgeId ? edge.from === selectedBadgeId || edge.to === selectedBadgeId : false,
      )
      .map((edge: StagePlayBadgeEdgeV1) => edge.id),
  );

  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto rounded-md border border-slate-800 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:22px_22px]"
      data-testid="stage-play-badge-graph-scrollport"
    >
      <svg width={width} height={height} className="absolute left-0 top-0">
        <defs>
          <marker id="stage-play-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgb(100 116 139)" />
          </marker>
        </defs>
        {graph.edges.map((edge: StagePlayBadgeEdgeV1) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const active = relatedEdgeIds.has(edge.id) || selectedSet.has(edge.from) || selectedSet.has(edge.to);
          return (
            <g key={edge.id}>
              <line
                x1={from.x + 64}
                y1={from.y + 26}
                x2={to.x - 64}
                y2={to.y + 26}
                stroke={active ? "rgb(34 211 238)" : "rgb(51 65 85)"}
                strokeWidth={active ? 2 : 1}
                markerEnd="url(#stage-play-arrow)"
              />
              {active ? (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 + 18}
                  textAnchor="middle"
                  className="fill-cyan-200 text-[10px]"
                >
                  {edge.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="relative" style={{ width, height }}>
        {columns.map(([kind], columnIndex) => (
          <div
            key={kind}
            className="absolute top-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
            style={{ left: 54 + columnIndex * 190 }}
          >
            {labelize(kind)}
          </div>
        ))}
        {graph.badges.map((badge: StagePlayBadgeV1) => {
          const point = positions.get(badge.id);
          if (!point) return null;
          const active = selectedBadgeId === badge.id || selectedSet.has(badge.id);
          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onSelect(badge.id)}
              className={`absolute flex h-14 w-32 flex-col items-center justify-center rounded-md border px-2 text-center text-xs transition ${
                active
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                  : `${kindTone(badge.kind)} text-slate-200 hover:border-slate-500`
              }`}
              style={{ left: point.x - 64, top: point.y }}
              aria-label={badge.title}
              title={`${badge.title}\n${badge.plainMeaning}`}
            >
              <span className="line-clamp-2 font-semibold leading-tight">{badge.title}</span>
              <span className="mt-1 font-mono text-[10px] text-slate-400">{badge.confidence.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Inspector({
  badge,
  relatedEdges,
  relatedBadges,
  relatedActions,
}: {
  badge: StagePlayBadgeV1 | null;
  relatedEdges: StagePlayBadgeEdgeV1[];
  relatedBadges: StagePlayBadgeV1[];
  relatedActions: StagePlayBadgeGraphRecommendedActionV1[];
}) {
  if (!badge) {
    return (
      <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4 text-sm text-slate-400">
        Select a Stage Play badge to inspect live bindings, affordances, procedural bindings, evidence, and admission.
      </aside>
    );
  }

  const expression = badge.intentModule
    ? [
      badge.intentModule.verb,
      ...(badge.intentModule.requires ?? []),
      ...(badge.intentModule.preserves ?? []),
      ...(badge.intentModule.blocks ?? []),
    ].filter(Boolean).join(" + ")
    : badge.reasonCodes.join(" + ");

  return (
    <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-50">{badge.title}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{badge.id}</div>
        </div>
        <Badge variant="outline" className={statusTone(badge.status)}>
          {labelize(badge.status)}
        </Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Section title="Meaning">
          <p>{badge.plainMeaning}</p>
          <p className="mt-2 text-xs text-slate-400">{badge.whyItMatters}</p>
        </Section>

        <Section title="Live Bindings">
          {badge.liveBindings.length > 0 ? (
            <div className="space-y-2">
              {badge.liveBindings.map((binding, index) => (
                <div key={`${binding.bindingKind}-${index}`} className="rounded border border-slate-800 bg-black/20 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                      {labelize(binding.bindingKind)}
                    </Badge>
                    <span className="text-xs text-slate-400">{binding.freshness}</span>
                    <span className="font-mono text-[10px] text-slate-500">{binding.confidence.toFixed(2)}</span>
                  </div>
                  {binding.compactValue !== undefined && binding.compactValue !== null ? (
                    <div className="mt-1 font-mono text-xs text-slate-300">{String(binding.compactValue)}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500">No live binding attached to this badge.</span>
          )}
        </Section>

        <Section title="Affordance / Blocked Move">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {labelize(badge.kind)}
            </Badge>
            {badge.admission ? (
              <Badge variant="outline" className={statusTone(badge.admission === "blocked" ? "blocked" : badge.status)}>
                {labelize(badge.admission)}
              </Badge>
            ) : null}
          </div>
        </Section>

        <Section title="Intent Module">
          {badge.intentModule ? (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Verb:</span>{" "}
                <span className="font-mono text-cyan-200">{badge.intentModule.verb}</span>
              </div>
              {badge.intentModule.requires?.length ? <div>Requires: {badge.intentModule.requires.join(", ")}</div> : null}
              {badge.intentModule.preserves?.length ? <div>Preserves: {badge.intentModule.preserves.join(", ")}</div> : null}
              {badge.intentModule.blocks?.length ? <div>Blocks: {badge.intentModule.blocks.join(", ")}</div> : null}
            </div>
          ) : (
            <span className="text-slate-500">No intent verb is attached to this badge.</span>
          )}
        </Section>

        <Section title="Procedural Binding">
          <div className="rounded border border-slate-800 bg-black/30 p-2 font-mono text-xs text-cyan-100">
            {expression || "No procedural expression for this badge."}
          </div>
        </Section>

        <Section title="Missing Evidence">
          {badge.missingEvidence.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-xs text-amber-100">
              {badge.missingEvidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <span className="text-slate-500">No missing evidence recorded.</span>
          )}
        </Section>

        <Section title="Admission">
          <div className="space-y-2 text-xs">
            <div>Badge admission: <span className="font-mono text-slate-200">{badge.admission ?? "none"}</span></div>
            {relatedActions.map((action) => (
              <div key={action.id} className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-semibold text-slate-100">{action.label}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className={statusTone(action.admission === "blocked" ? "blocked" : "candidate")}>
                    {labelize(action.admission)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {labelize(action.actionType)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    agent executable: false
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Source Refs">
          <div className="space-y-1 font-mono text-xs text-slate-400">
            {badge.sourceRefs.length > 0 ? badge.sourceRefs.map((ref) => (
              <div key={`${ref.kind}:${ref.id}`}>{ref.kind}: {ref.id}</div>
            )) : <span>No source refs.</span>}
          </div>
        </Section>

        <Section title="Related Badges">
          <div className="space-y-2">
            {relatedEdges.map((edge) => (
              <div key={edge.id} className="rounded border border-slate-800 bg-black/20 p-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                  {labelize(edge.relation)}: {edge.label}
                </div>
              </div>
            ))}
            {relatedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {relatedBadges.map((related) => (
                  <Badge key={related.id} variant="outline" className="border-slate-700 text-slate-300">
                    {related.title}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    </aside>
  );
}

export default function StagePlayBadgeGraphPanel() {
  const [query, setQuery] = useState("");
  const activeEnvironment = useLiveAnswerEnvironmentStore((state) =>
    selectActiveLiveAnswerEnvironment(state, STAGE_PLAY_PANEL_THREAD_ID),
  );
  const threadId = activeEnvironment?.thread_id ?? STAGE_PLAY_PANEL_THREAD_ID;
  const roomId = activeEnvironment?.room_id ?? null;
  const environmentId = activeEnvironment?.environment_id ?? null;
  const selectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeId);
  const selectedBadgeIds = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeIds);
  const activeFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.activeFilterKind);
  const activeFilterStatus = useStagePlayBadgeGraphPanelStore((state) => state.activeFilterStatus);
  const setSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.setSelectedBadgeId);
  const toggleSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.toggleSelectedBadgeId);
  const setActiveFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.setActiveFilterKind);
  const setActiveFilterStatus = useStagePlayBadgeGraphPanelStore((state) => state.setActiveFilterStatus);
  const resetPanelMemory = useStagePlayBadgeGraphPanelStore((state) => state.resetPanelMemory);

  const { data: graph, isLoading, error } = useQuery<StagePlayBadgeGraphV1>({
    queryKey: [
      "/api/helix/stage-play/graph",
      threadId,
      roomId,
      environmentId,
    ],
    queryFn: () => fetchStagePlayBadgeGraph({ threadId, roomId, environmentId }),
    refetchInterval: 1000,
  });

  const kinds = useMemo(() => uniqueSorted((graph?.badges ?? []).map((badge) => badge.kind)), [graph?.badges]);
  const statuses = useMemo(() => uniqueSorted((graph?.badges ?? []).map((badge) => badge.status)), [graph?.badges]);

  const filteredBadges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (graph?.badges ?? []).filter((badge: StagePlayBadgeV1) => {
      const haystack = [
        badge.id,
        badge.title,
        badge.plainMeaning,
        badge.whyItMatters,
        badge.kind,
        badge.status,
        ...badge.subjects,
        ...badge.tags,
        ...badge.reasonCodes,
      ].join(" ").toLowerCase();
      return (
        (needle.length === 0 || haystack.includes(needle)) &&
        (!activeFilterKind || badge.kind === activeFilterKind) &&
        (!activeFilterStatus || badge.status === activeFilterStatus)
      );
    });
  }, [activeFilterKind, activeFilterStatus, graph?.badges, query]);

  const groupedBadges = useMemo(() => {
    return kinds.map((kind) => ({
      kind,
      badges: filteredBadges.filter((badge: StagePlayBadgeV1) => badge.kind === kind),
    })).filter((group) => group.badges.length > 0);
  }, [filteredBadges, kinds]);

  useEffect(() => {
    if (!graph) return;
    if (filteredBadges.length === 0) {
      setSelectedBadgeId(null);
      return;
    }
    if (selectedBadgeId && !filteredBadges.some((badge) => badge.id === selectedBadgeId)) {
      setSelectedBadgeId(null);
    }
  }, [filteredBadges, graph, selectedBadgeId, setSelectedBadgeId]);

  const selectedBadge = useMemo(
    () => graph?.badges.find((badge) => badge.id === selectedBadgeId) ?? null,
    [graph?.badges, selectedBadgeId],
  );
  const relatedEdges = useMemo(
    () => graph && selectedBadge
      ? graph.edges.filter((edge) => edge.from === selectedBadge.id || edge.to === selectedBadge.id)
      : [],
    [graph, selectedBadge],
  );
  const relatedBadges = useMemo(() => {
    if (!graph || !selectedBadge) return [];
    const ids = new Set(relatedEdges.flatMap((edge) => [edge.from, edge.to]).filter((id) => id !== selectedBadge.id));
    return graph.badges.filter((badge) => ids.has(badge.id));
  }, [graph, relatedEdges, selectedBadge]);
  const relatedActions = useMemo(
    () => graph && selectedBadge
      ? graph.recommendedActions.filter((action) =>
        action.evidenceRefs.some((ref) => selectedBadge.evidenceRefs.includes(ref)) ||
        action.reasonCodes.some((code) => selectedBadge.reasonCodes.includes(code)),
      )
      : [],
    [graph, selectedBadge],
  );

  if (isLoading) {
    return <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">Loading Stage Play Badge Graph...</div>;
  }

  if (error || !graph) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 p-6 text-sm text-rose-200">
        Stage Play graph failed to load.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-cyan-300" />
            Stage Play Badge Graph
          </div>
          <div className="mt-1 text-xs text-slate-500">{graph.description}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-slate-700 text-slate-300">{graph.summary.badgeCount} badges</Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">{graph.summary.edgeCount} connections</Badge>
          <Badge variant="outline" className={statusTone(graph.sourceWindow.freshness === "fresh" ? "observed" : graph.sourceWindow.freshness === "missing" ? "missing_evidence" : "candidate")}>
            source {labelize(graph.sourceWindow.freshness)}
          </Badge>
          <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={resetPanelMemory}>
            Reset view
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(420px,1fr)_360px] gap-3 p-3">
        <aside className="flex min-h-0 flex-col rounded-md border border-slate-800 bg-slate-950/75">
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search live badges"
                className="h-9 border-slate-800 bg-slate-950 pl-8 text-slate-100 placeholder:text-slate-600"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SelectFilter
                label="Kind"
                value={activeFilterKind ?? "all"}
                options={kinds}
                onChange={(value) => setActiveFilterKind(value === "all" ? null : value)}
              />
              <SelectFilter
                label="Status"
                value={activeFilterStatus ?? "all"}
                options={statuses}
                onChange={(value) => setActiveFilterStatus(value === "all" ? null : value)}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {groupedBadges.length === 0 ? (
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
                No admitted source window has produced Stage Play badges yet.
              </div>
            ) : groupedBadges.map((group) => (
              <div key={group.kind} className="mb-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labelize(group.kind)}</div>
                <div className="space-y-2">
                  {group.badges.map((badge) => (
                    <BadgeButton
                      key={badge.id}
                      badge={badge}
                      selected={selectedBadgeId === badge.id || selectedBadgeIds.includes(badge.id)}
                      onSelect={() => toggleSelectedBadgeId(badge.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col gap-3">
          <StagePlayGraphCanvas
            graph={graph}
            selectedBadgeIds={selectedBadgeIds}
            selectedBadgeId={selectedBadgeId}
            onSelect={toggleSelectedBadgeId}
          />
          <footer className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center gap-2 font-semibold text-slate-300"><Shield className="h-3.5 w-3.5" /> Authority</div>
              <div className="mt-1 font-mono text-slate-500">evidence_only / agent_executable false</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <div className="font-semibold text-slate-300">Source refs</div>
              <div className="mt-1 font-mono text-slate-500">
                {[...graph.sourceWindow.latestObservationRefs, ...graph.sourceWindow.latestSnapshotRefs].slice(0, 2).join(" | ") || "none"}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <div className="font-semibold text-slate-300">Recommended actions</div>
              <div className="mt-1 font-mono text-slate-500">{graph.recommendedActions.length} evidence-only candidate(s)</div>
            </div>
          </footer>
        </main>

        <Inspector
          badge={selectedBadge}
          relatedEdges={relatedEdges}
          relatedBadges={relatedBadges}
          relatedActions={relatedActions}
        />
      </div>
    </div>
  );
}
