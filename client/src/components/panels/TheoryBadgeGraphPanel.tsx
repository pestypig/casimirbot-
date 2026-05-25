import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, ExternalLink, Search } from "lucide-react";
import type {
  TheoryBadgeCalculatorPayloadV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "@shared/contracts/theory-badge-graph.v1";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";

const LEVEL_ORDER = [
  "first_principle",
  "law",
  "derived_relation",
  "model",
  "simulation_specific",
  "diagnostic_gate",
  "claim_boundary",
];

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
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
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-500"
      >
        <option value="all">All</option>
        {options.map((option) => (
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
  badge: TheoryBadgeV1;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition ${
        selected
          ? "border-cyan-500 bg-cyan-950/40 text-cyan-50"
          : "border-slate-800 bg-slate-950/70 text-slate-100 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{badge.title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-slate-400">{badge.plainMeaning}</div>
        </div>
        {badge.calculatorPayloads.length > 0 ? (
          <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-label="Calculator loadable" />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(badge.level)}
        </Badge>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(badge.status)}
        </Badge>
      </div>
    </button>
  );
}

function LoadPayloadButton({ badge, payload }: { badge: TheoryBadgeV1; payload: TheoryBadgeCalculatorPayloadV1 }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() =>
        dispatchScientificCalculatorMathPicked({
          latex: payload.displayLatex || payload.expression,
          sourcePath: `theory://${badge.id}/${payload.id}`,
          anchor: payload.id,
        })
      }
      className="gap-2"
    >
      <Calculator className="h-4 w-4" />
      Load to Calculator
    </Button>
  );
}

function RelatedBadgeRow({
  edge,
  selectedId,
  byId,
  onSelect,
}: {
  edge: TheoryBadgeEdgeV1;
  selectedId: string;
  byId: Map<string, TheoryBadgeV1>;
  onSelect: (id: string) => void;
}) {
  const relatedId = edge.from === selectedId ? edge.to : edge.from;
  const related = byId.get(relatedId);
  return (
    <button
      type="button"
      onClick={() => onSelect(relatedId)}
      className="w-full rounded-md border border-slate-800 bg-slate-950/70 p-2 text-left text-xs text-slate-300 hover:border-slate-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-100">{related?.title ?? relatedId}</span>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(edge.relation)}
        </Badge>
      </div>
      <div className="mt-1 text-slate-400">{edge.label}</div>
    </button>
  );
}

function Inspector({
  badge,
  graph,
  onSelect,
}: {
  badge: TheoryBadgeV1 | null;
  graph: TheoryBadgeGraphV1 | undefined;
  onSelect: (id: string) => void;
}) {
  const byId = useMemo(() => new Map((graph?.badges ?? []).map((item) => [item.id, item])), [graph?.badges]);
  const relatedEdges = useMemo(
    () => (graph?.edges ?? []).filter((edge) => edge.from === badge?.id || edge.to === badge?.id),
    [badge?.id, graph?.edges],
  );

  if (!badge) {
    return (
      <Card className="border-slate-800 bg-slate-950/80">
        <CardContent className="p-6 text-sm text-slate-400">Select a badge to inspect its theory payload.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-slate-50">{badge.title}</CardTitle>
            <div className="mt-1 text-xs text-slate-400">{badge.id}</div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className="bg-cyan-900/80 text-cyan-50">{labelize(badge.level)}</Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {labelize(badge.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Meaning</h3>
          <p className="mt-1 text-sm text-slate-200">{badge.plainMeaning}</p>
          <p className="mt-2 text-sm text-slate-400">{badge.whyItMatters}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Equations</h3>
          <div className="mt-2 space-y-2">
            {badge.equations.map((equation) => (
              <div key={equation.id} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
                <div className="font-mono text-sm text-cyan-100">{equation.displayLatex}</div>
                {equation.computableExpression ? (
                  <div className="mt-1 font-mono text-xs text-slate-400">{equation.computableExpression}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                    {labelize(equation.role)}
                  </Badge>
                  {equation.operatorKind ? (
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                      {labelize(equation.operatorKind)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Units</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {badge.units.length > 0 ? (
              badge.units.map((unit) => (
                <div key={`${unit.symbol}-${unit.dimensionSignature ?? unit.unit ?? "unit"}`} className="rounded-md border border-slate-800 bg-slate-900/50 p-2 text-xs">
                  <div className="font-mono text-slate-100">{unit.symbol}</div>
                  <div className="mt-1 text-slate-400">
                    {[unit.quantity, unit.unit, unit.dimensionSignature].filter(Boolean).join(" | ")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No unit-bearing scalar in this badge.</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assumptions</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {badge.assumptions.map((assumption) => (
              <li key={assumption}>- {assumption}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Calculator Payloads</h3>
          <div className="mt-2 space-y-2">
            {badge.calculatorPayloads.length > 0 ? (
              badge.calculatorPayloads.map((payload) => (
                <div key={payload.id} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
                  <div className="font-mono text-sm text-cyan-100">{payload.displayLatex}</div>
                  <div className="mt-1 font-mono text-xs text-slate-400">{payload.expression}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <LoadPayloadButton badge={badge} payload={payload} />
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                      {labelize(payload.preferredAction)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No scalar calculator payload for this badge yet.</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Source Refs</h3>
          <div className="mt-2 space-y-2">
            {badge.sourceRefs.map((source, index) => (
              <div key={`${source.kind}-${source.path ?? source.id ?? index}`} className="rounded-md border border-slate-800 bg-slate-900/50 p-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold">{labelize(source.kind)}</span>
                </div>
                <div className="mt-1 font-mono text-slate-400">{source.path ?? source.id}</div>
                {source.note ? <div className="mt-1 text-slate-500">{source.note}</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Related Badges</h3>
          <div className="mt-2 space-y-2">
            {relatedEdges.length > 0 ? (
              relatedEdges.map((edge) => (
                <RelatedBadgeRow key={edge.id} edge={edge} selectedId={badge.id} byId={byId} onSelect={onSelect} />
              ))
            ) : (
              <div className="text-sm text-slate-500">No related edges for this badge.</div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default function TheoryBadgeGraphPanel() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: graph, isLoading, error } = useQuery<TheoryBadgeGraphV1>({
    queryKey: ["/api/helix/theory/graph"],
  });

  const subjects = useMemo(() => uniqueSorted((graph?.badges ?? []).flatMap((badge) => badge.subjects)), [graph?.badges]);
  const levels = useMemo(() => uniqueSorted((graph?.badges ?? []).map((badge) => badge.level)), [graph?.badges]);
  const statuses = useMemo(() => uniqueSorted((graph?.badges ?? []).map((badge) => badge.status)), [graph?.badges]);

  const filteredBadges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (graph?.badges ?? []).filter((badge) => {
      const haystack = [
        badge.id,
        badge.title,
        badge.plainMeaning,
        badge.whyItMatters,
        ...badge.subjects,
        ...badge.tags,
        ...badge.hintKeys.symbols,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (needle.length === 0 || haystack.includes(needle)) &&
        (subject === "all" || badge.subjects.includes(subject)) &&
        (level === "all" || badge.level === level) &&
        (status === "all" || badge.status === status)
      );
    });
  }, [graph?.badges, level, query, status, subject]);

  const groupedBadges = useMemo(() => {
    return LEVEL_ORDER.map((levelName) => ({
      level: levelName,
      badges: filteredBadges.filter((badge) => badge.level === levelName),
    })).filter((group) => group.badges.length > 0);
  }, [filteredBadges]);

  useEffect(() => {
    if (filteredBadges.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredBadges.some((badge) => badge.id === selectedId)) {
      setSelectedId(filteredBadges[0].id);
    }
  }, [filteredBadges, selectedId]);

  const selectedBadge = useMemo(
    () => (graph?.badges ?? []).find((badge) => badge.id === selectedId) ?? null,
    [graph?.badges, selectedId],
  );

  return (
    <div className="flex h-full min-h-[520px] flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Theory Badge Graph</h2>
            <p className="mt-1 text-sm text-slate-400">
              Physics theory badges, unit signatures, assumptions, and calculator loadouts.
            </p>
          </div>
          {graph ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <Badge variant="outline" className="border-slate-700">
                {graph.summary.badgeCount} badges
              </Badge>
              <Badge variant="outline" className="border-slate-700">
                {graph.summary.edgeCount} edges
              </Badge>
              <Badge variant="outline" className="border-slate-700">
                {graph.summary.calculatorLoadableCount} calculator loadouts
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Badge, symbol, subject"
                className="h-9 border-slate-800 bg-slate-950 pl-8 text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </label>
          <SelectFilter label="Subject" value={subject} options={subjects} onChange={setSubject} />
          <SelectFilter label="Level" value={level} options={levels} onChange={setLevel} />
          <SelectFilter label="Status" value={status} options={statuses} onChange={setStatus} />
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 text-sm text-slate-400">Loading theory badge graph...</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-300">Theory badge graph failed to load.</div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto pr-1">
            <div className="space-y-4">
              {groupedBadges.map((group) => (
                <section key={group.level}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {labelize(group.level)}
                  </div>
                  <div className="space-y-2">
                    {group.badges.map((badge) => (
                      <BadgeButton
                        key={badge.id}
                        badge={badge}
                        selected={badge.id === selectedId}
                        onSelect={() => setSelectedId(badge.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {groupedBadges.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                  No badges match the current filters.
                </div>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            <Inspector badge={selectedBadge} graph={graph} onSelect={setSelectedId} />
          </div>
        </div>
      )}
    </div>
  );
}
